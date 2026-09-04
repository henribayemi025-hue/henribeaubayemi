import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

// Public VAPID application-server key (public by design). Hardcoded default so
// Web Push works even when the host doesn't inject VITE_* at build time.
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BMd-k0e9sRisx9rduYzSe9TWZx64zvpqjMlIhJP9NtPnsp_fjDxkHKCs17J9emm1NJcd3J3z8pkVGJjx4W6392A';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// ─── Push NATIF (app installée depuis le Play Store / App Store) ───────────
//
// Le Web Push ci-dessous ne fonctionne QUE dans un vrai navigateur — pas
// dans la coque Capacitor de l'app: sans jeton FCM (Android) ou APNs (iOS),
// le système d'exploitation n'a aucun moyen de réveiller l'app fermée pour
// afficher une notification. C'est la vraie raison derrière « les gens ne
// reçoivent rien sur l'app » (Beau, 04/09) — un trou d'architecture, pas un
// bug ponctuel. Voir aussi la migration 0073 (table native_push_tokens,
// séparée de push_subscriptions qui reste le canal web).
async function enableNativePush(userId) {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return { ok: false, reason: 'denied' };

  // `register()` ne renvoie pas le jeton directement: il déclenche un
  // événement 'registration' (ou 'registrationError') écouté ci-dessous.
  // On enveloppe ça dans une promesse pour garder la même signature
  // { ok, reason } que le web, sans rien changer côté appelants
  // (PushPrompt.jsx, Settings.jsx).
  return new Promise((resolve) => {
    let settled = false;
    let regHandle = null;
    let errHandle = null;
    const cleanup = () => {
      regHandle?.remove();
      errHandle?.remove();
    };
    const done = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    PushNotifications.addListener('registration', async (token) => {
      try {
        await supabase.from('native_push_tokens').upsert(
          { user_id: userId, platform: Capacitor.getPlatform(), token: token.value },
          { onConflict: 'token' }
        );
        done({ ok: true });
      } catch {
        done({ ok: false, reason: 'save_failed' });
      }
    }).then((h) => {
      regHandle = h;
      if (settled) h.remove(); // la réponse est déjà partie (timeout) — nettoyer quand même
    });

    PushNotifications.addListener('registrationError', () => {
      done({ ok: false, reason: 'registration_failed' });
    }).then((h) => {
      errHandle = h;
      if (settled) h.remove();
    });

    // Filet de sécurité: un réseau capricieux ne doit jamais laisser
    // l'appelant (le bouton "Activer") tourner indéfiniment.
    setTimeout(() => done({ ok: false, reason: 'timeout' }), 15000);

    PushNotifications.register();
  });
}

// ─── Web Push (navigateur uniquement) ───────────────────────────────────────
// Subscribe the browser to Web Push and persist the subscription.
// Returns { ok, reason }. Degrades cleanly when VAPID isn't configured yet.
async function enableWebPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'vapid_not_configured' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  const json = sub.toJSON();
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth_key: json.keys.auth,
    },
    { onConflict: 'endpoint' }
  );
  return { ok: true };
}

// Point d'entrée unique, appelé par PushPrompt.jsx et Settings.jsx — le
// bon canal (natif ou web) est choisi ici, sans rien changer côté appelants.
export async function enablePush(userId) {
  if (Capacitor.isNativePlatform()) return enableNativePush(userId);
  return enableWebPush(userId);
}
