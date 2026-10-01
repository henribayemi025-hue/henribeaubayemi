import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

// Public VAPID application-server key (public by design). Repli seulement :
// la clé en vigueur est demandée au serveur (clePubliqueVapid), pour qu'un
// changement de clé côté serveur n'exige pas de republier le site.
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
// Identifiant anonyme, pour enregistrer un jeton AVANT tout compte — Beau:
// « c'est moi qui décide à qui j'envoie l'annonce du matin », donc une
// diffusion large n'a pas besoin de connaître le compte, juste un téléphone
// qui a dit oui aux notifications. Persisté en local, jamais envoyé ailleurs
// que dans notre propre table (native_push_tokens.device_id).
function getDeviceId() {
  const KEY = 'finjaro:device_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // stockage indisponible: pas de rattachement possible plus tard, tant pis
  }
}

// Pas de paramètre userId: register_native_push_token (migration 0076)
// détermine QUI enregistre via auth.uid() côté serveur, à partir de la
// session que le client Supabase porte déjà — un paramètre ici inviterait
// à (mal) faire confiance à ce que l'appelant prétend être.
async function enableNativePush() {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return { ok: false, reason: 'denied' };
  const deviceId = getDeviceId();

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
        // register_native_push_token (migration 0076) lit QUI appelle via
        // auth.uid() côté serveur — jamais le paramètre `userId` qu'on
        // pourrait lui faire croire depuis le client. Sans session, la
        // ligne reste anonyme (device_id); avec une session, elle se
        // rattache tout de suite, ou récupère un jeton déjà enregistré
        // anonymement sur ce même appareil — un simple appel RPC couvre
        // les trois cas (voir la fonction pour le détail).
        const { error } = await supabase.rpc('register_native_push_token', {
          p_token: token.value,
          p_platform: Capacitor.getPlatform(),
          p_device_id: deviceId,
        });
        if (error) throw error;
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

// Demande l'autorisation dès la PREMIÈRE OUVERTURE de l'app, avant tout
// compte (voir NativePushBootstrap.jsx). Ne redemande jamais si déjà
// tranchée: une permission système refusée une fois ne se represente plus
// à l'utilisateur, insister la ferait paraître cassée pour rien.
export async function enableNativePushIfUndecided() {
  if (!Capacitor.isNativePlatform()) return { ok: false, reason: 'not_native' };
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'prompt' && perm.receive !== 'prompt-with-rationale') {
    return { ok: false, reason: 'already_decided' };
  }
  return enableNativePush();
}

// Rattache un jeton déjà enregistré (anonyme, ou d'un compte précédent sur
// le même appareil) au compte qui vient de se connecter. La permission a
// déjà été tranchée à la première ouverture: register() redonne le même
// jeton sans rouvrir de dialogue, la fonction RPC le fait simplement
// passer d'anonyme à personnel (côté serveur, via auth.uid() — `userId`
// ici ne sert qu'à décider s'il vaut la peine d'essayer).
export async function linkNativePushToUser(userId) {
  if (!Capacitor.isNativePlatform() || !userId) return;
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') return; // jamais accepté: rien à rattacher
  await enableNativePush();
}

// ─── Web Push (navigateur uniquement) ───────────────────────────────────────
// La clé en vigueur, donnée par send-push à partir du même secret que la clé
// privée (audit du 01/10 : les clés VAPID sont renouvelées). Repli sur la
// clé écrite ici si le serveur ne répond pas.
async function clePubliqueVapid() {
  try {
    const { data } = await supabase.functions.invoke('send-push', { body: { cle_publique: true } });
    if (data?.publicKey) return data.publicKey;
  } catch {
    // repli ci-dessous
  }
  return VAPID_PUBLIC_KEY;
}

function memesOctets(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// Abonne le navigateur avec la clé en vigueur. Un abonnement fait avec une
// ANCIENNE clé ne peut plus recevoir (le serveur signe avec la nouvelle) et
// empêche d'en créer un autre : on le résilie d'abord.
async function abonner(reg) {
  const voulu = urlBase64ToUint8Array(await clePubliqueVapid());
  const existant = await reg.pushManager.getSubscription();
  if (existant) {
    const actuel = existant.options?.applicationServerKey;
    if (actuel && memesOctets(new Uint8Array(actuel), voulu)) return existant;
    await existant.unsubscribe().catch(() => {});
  }
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: voulu });
}

async function enregistrer(userId, sub) {
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
}

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
  await enregistrer(userId, await abonner(reg));
  return { ok: true };
}

// À chaque ouverture, une personne connectée qui a DÉJÀ dit oui garde un
// abonnement valable : nouvelle clé côté serveur, abonnement effacé après un
// échec d'envoi… Jamais de fenêtre de permission ici.
export async function resyncWebPush(userId) {
  if (!userId || Capacitor.isNativePlatform()) return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  await enregistrer(userId, await abonner(reg));
}

// Point d'entrée unique, appelé par PushPrompt.jsx et Settings.jsx — le
// bon canal (natif ou web) est choisi ici, sans rien changer côté appelants.
export async function enablePush(userId) {
  if (Capacitor.isNativePlatform()) return enableNativePush();
  return enableWebPush(userId);
}
