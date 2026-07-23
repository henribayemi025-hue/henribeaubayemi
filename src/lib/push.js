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

// Subscribe the browser to Web Push and persist the subscription.
// Returns { ok, reason }. Degrades cleanly when VAPID isn't configured yet.
export async function enablePush(userId) {
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
