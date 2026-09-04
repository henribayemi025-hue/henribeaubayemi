// Finjaro — envoi des notifications: push navigateur, push NATIF (app
// installée) et e-mail.
//
// Le nom "send-push" est conservé pour ne pas casser les appelants existants
// (triggers SQL via pg_net, VendorChat, VendorOrders via src/lib/notify.js),
// mais la fonction fait désormais les trois canaux.
//
// Accepte:
//   { user_id, title, body, url?, tag? }                        -> une personne
//   { audience: 'shop_followers', shop_id, title, body, url? }  -> abonnés d'une boutique
//   { audience: 'country', country, except_user_id?, ... }      -> tout un pays
//   { audience: 'all' | 'vendors' | 'buyers', title, body, ... } -> diffusion
//
// QUI A LE DROIT D'ENVOYER
// Un envoi à UNE personne reste ouvert: c'est ce dont se servent les triggers
// SQL, appelés par pg_net sans jeton à présenter. Tout envoi COLLECTIF exige
// en revanche une preuve (jeton d'un compte administrateur, ou de la
// propriétaire de la boutique pour ses propres abonnés) — sans quoi cette
// fonction serait un relais ouvert: quiconque connaît son adresse pourrait
// écrire à tous les comptes d'un pays sous le nom de Finjaro.
//
// POURQUOI L'E-MAIL EST INDISPENSABLE
// Sur iPhone, le push web ne fonctionne QUE si le site a été ajouté à l'écran
// d'accueil. Sans e-mail, une grande partie des utilisatrices n'était donc
// jamais prévenue de rien. Les trois canaux sont tentés indépendamment: si
// l'un échoue ou n'a rien à envoyer, les autres partent quand même.
//
// POURQUOI LE PUSH NATIF (FCM/APNs) EST UN CANAL À PART
// Le push web (VAPID, ci-dessous) ne fonctionne QUE dans un vrai navigateur.
// L'app installée depuis le Play Store / App Store est une coque Capacitor:
// sans jeton natif (table native_push_tokens, distincte de
// push_subscriptions), l'OS ne peut pas réveiller l'app fermée pour
// afficher une notification — c'était la cause de « les gens ne reçoivent
// rien sur l'app » (Beau, 04/09). Voir aussi migration 0073.
// Android passe par Firebase (FCM). iOS n'a PAS de pont Firebase côté app
// (@capacitor/push-notifications donne le jeton APNs brut) — on parle donc
// directement à Apple avec la clé .p8 (app_config.apns_key).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush@0.3';

// Même règle que finou-chat/miroir-ia: finjaro.net + sous-domaines (dont un
// futur "staging.finjaro.net"), previews Cloudflare Pages (*.pages.dev),
// ancien Netlify, dev local. Cette fonction est aussi appelée serveur-à-serveur
// (par finou-chat, par les triggers SQL via pg_net) — ces appels n'envoient pas
// d'en-tête Origin, donc `isAllowedOrigin(null)` reste false et retombe sur
// PROD_HOST par défaut, ce qui ne bloque pas l'appel lui-même (CORS ne
// s'applique qu'aux requêtes navigateur).
const PROD_HOST = 'finjaro.net';

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host === PROD_HOST || host.endsWith(`.${PROD_HOST}`)) return true;
  if (host.endsWith('.pages.dev')) return true;
  if (host.endsWith('.workers.dev')) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : `https://${PROD_HOST}`,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const SITE_URL = 'https://finjaro.net';
const RESEND_BATCH_MAX = 100; // limite de l'API Resend
// Boîte réellement relevée. Les e-mails partent de notifications@finjaro.net,
// une adresse d'envoi uniquement: sans reply_to, une réponse se perdrait.
const SUPPORT_EMAIL = 'fin.finjaro@gmail.com';

type Admin = ReturnType<typeof admin>;

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
}

// Envois qui touchent PLUSIEURS personnes d'un coup. Ils exigent une preuve
// d'identité (voir callerRights): sans elle, cette fonction serait un relais
// ouvert — n'importe qui connaissant l'adresse pourrait écrire à tous les
// comptes d'un pays sous le nom de Finjaro.
const DIFFUSIONS = new Set(['all', 'vendors', 'buyers', 'country', 'shop_followers']);

// Qui appelle, et a-t-il le droit de diffuser ?
//
// La fonction est appelée de deux façons: par les triggers SQL (pg_net, sans
// en-tête d'autorisation, toujours vers UNE personne) et par le navigateur
// via supabase.functions.invoke, qui transmet le jeton de la personne
// connectée. `verify_jwt` est à false pour laisser passer les premiers — la
// vérification se fait donc ici, à la main, pour les seconds.
async function callerRights(sb: Admin, req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { userId: null as string | null, isAdmin: false };
  // La clé anonyme est elle aussi un JWT: getUser la rejette, ce qui est
  // exactement ce qu'on veut (elle ne prouve l'identité de personne).
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { userId: null, isAdmin: false };
  const { data: prof } = await sb
    .from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle();
  return { userId: data.user.id, isAdmin: prof?.is_admin === true };
}

async function resolveRecipients(sb: Admin, payload: Record<string, unknown>) {
  if (payload.user_id) return [payload.user_id as string];

  const except = payload.except_user_id;
  const sansExpediteur = (rows: { id: string }[] | null) =>
    (rows ?? []).map((r) => r.id).filter((id) => id !== except);

  if (payload.audience === 'shop_followers' && payload.shop_id) {
    const { data } = await sb.from('shop_follows').select('follower_id').eq('shop_id', payload.shop_id);
    return (data ?? []).map((r) => r.follower_id).filter((id) => id !== except);
  }
  if (payload.audience === 'country' && payload.country) {
    const { data } = await sb.from('profiles').select('id').eq('country', payload.country);
    return sansExpediteur(data);
  }
  // Tout le monde.
  if (payload.audience === 'all') {
    const { data } = await sb.from('profiles').select('id');
    return sansExpediteur(data);
  }
  // Les vendeuses = les personnes qui tiennent une boutique. On passe par
  // `shops.owner_id` plutôt que par `profiles.is_vendor`: le drapeau peut
  // rester à true après la fermeture d'une boutique, la table des boutiques
  // est la seule source qui dise qui en tient une aujourd'hui.
  if (payload.audience === 'vendors') {
    const { data } = await sb.from('shops').select('owner_id').not('owner_id', 'is', null);
    const ids = [...new Set((data ?? []).map((r) => r.owner_id))];
    return ids.filter((id) => id !== except);
  }
  if (payload.audience === 'buyers') {
    const { data: shops } = await sb.from('shops').select('owner_id').not('owner_id', 'is', null);
    const proprietaires = new Set((shops ?? []).map((r) => r.owner_id));
    const { data } = await sb.from('profiles').select('id');
    return sansExpediteur(data).filter((id) => !proprietaires.has(id));
  }
  return [];
}

// --- Push navigateur -------------------------------------------------------

async function sendPush(
  sb: Admin,
  recipients: string[],
  payload: Record<string, unknown>,
): Promise<number> {
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key, user_id')
    .in('user_id', recipients);
  if (!subs || subs.length === 0) return 0;

  // Clés VAPID: le secret d'environnement d'abord, sinon la table privée
  // app_config (pour pouvoir tout provisionner depuis l'outillage).
  let keysJson: unknown = null;
  const rawKeys = Deno.env.get('VAPID_KEYS');
  if (rawKeys) {
    keysJson = JSON.parse(rawKeys);
  } else {
    const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'vapid_keys').maybeSingle();
    if (cfg?.value) keysJson = cfg.value;
  }
  if (!keysJson) return 0;

  const vapidKeys = await webpush.importVapidKeys(keysJson, { extractable: false });
  const appServer = await webpush.ApplicationServer.new({
    contactInformation: Deno.env.get('VAPID_SUBJECT') ?? `mailto:${SUPPORT_EMAIL}`,
    vapidKeys,
  });

  const message = JSON.stringify({
    title: payload.title ?? 'Finjaro',
    body: payload.body ?? '',
    url: payload.url ?? '/',
    tag: payload.tag,
  });

  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        const subscriber = appServer.subscribe({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth_key },
        });
        await subscriber.pushTextMessage(message, {});
        delivered++;
      } catch (e) {
        // Abonnement périmé: on le supprime pour ne pas réessayer sans fin.
        console.error('push failed', e);
        await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    })
  );
  return delivered;
}

// --- Push NATIF (Firebase Cloud Messaging, HTTP v1) -------------------------
//
// Contrairement au Web Push (clés VAPID publiques), envoyer via FCM exige un
// jeton OAuth2 obtenu en signant un JWT avec la clé privée du compte de
// service Firebase (app_config.fcm_service_account — jamais dans un fichier
// versionné, voir le commentaire de la migration 0073). On le fait à la main
// avec Web Crypto plutôt que d'ajouter une dépendance: c'est ~30 lignes et
// évite un SDK Node lourd, mal adapté à Deno Edge.

let cachedFcmToken: { token: string; exp: number } | null = null;

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = '';
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getFcmAccessToken(
  sb: Admin,
): Promise<{ token: string; projectId: string } | null> {
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'fcm_service_account').maybeSingle();
  const sa = cfg?.value as
    | { project_id?: string; client_email?: string; private_key?: string; token_uri?: string }
    | null;
  if (!sa?.project_id || !sa.client_email || !sa.private_key) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.exp > now + 60) {
    return { token: cachedFcmToken.token, projectId: sa.project_id };
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const enc = new TextEncoder();
  const unsigned = `${base64url(enc.encode(JSON.stringify(header)))}.${base64url(enc.encode(JSON.stringify(claims)))}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned));
  const jwt = `${unsigned}.${base64url(sig)}`;

  const resp = await fetch(sa.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(jwt)}`,
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) {
    console.error('fcm oauth failed', resp.status, (await resp.text()).slice(0, 300));
    return null;
  }
  const { access_token, expires_in } = (await resp.json()) as { access_token: string; expires_in: number };
  cachedFcmToken = { token: access_token, exp: now + (expires_in ?? 3600) };
  return { token: access_token, projectId: sa.project_id };
}

async function sendFcmPush(
  sb: Admin,
  recipients: string[],
  payload: Record<string, unknown>,
): Promise<number> {
  const { data: tokens } = await sb
    .from('native_push_tokens')
    .select('id, token')
    .eq('platform', 'android')
    .in('user_id', recipients);
  if (!tokens || tokens.length === 0) return 0;

  const auth = await getFcmAccessToken(sb);
  if (!auth) return 0;

  const title = String(payload.title ?? 'Finjaro');
  const body = String(payload.body ?? '');
  const url = String(payload.url ?? '/');

  let delivered = 0;
  await Promise.all(
    tokens.map(async (t) => {
      try {
        const resp = await fetch(
          `https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: {
                token: t.token,
                notification: { title, body },
                data: { url, tag: String(payload.tag ?? '') },
                android: { priority: 'high' },
                apns: { headers: { 'apns-priority': '10' } },
              },
            }),
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (resp.ok) {
          delivered++;
          return;
        }
        const errText = await resp.text();
        // Jeton périmé/désinstallé: FCM répond UNREGISTERED ou NOT_FOUND —
        // on le retire pour ne pas réessayer indéfiniment sur un mort.
        if (resp.status === 404 || /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(errText)) {
          await sb.from('native_push_tokens').delete().eq('id', t.id);
        } else {
          console.error('fcm send failed', resp.status, errText.slice(0, 300));
        }
      } catch (e) {
        console.error('fcm send exception', e);
      }
    }),
  );
  return delivered;
}

// --- Push NATIF iOS (Apple Push Notification service, HTTP/2 direct) -------
//
// @capacitor/push-notifications donne sur iOS le jeton APNs BRUT (vérifié
// dans son code source: didRegisterForRemoteNotificationsWithDeviceToken),
// pas un jeton FCM — il n'y a pas de pont Firebase côté app. On parle donc
// directement à Apple, avec un jeton d'autorité ES256 signé à partir de la
// clé .p8 (app_config.apns_key — jamais dans un fichier versionné, même
// principe que fcm_service_account).

let cachedApnsToken: { token: string; exp: number } | null = null;

async function getApnsAuth(
  sb: Admin,
): Promise<{ jwt: string; bundleId: string } | null> {
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'apns_key').maybeSingle();
  const k = cfg?.value as
    | { key_id?: string; team_id?: string; bundle_id?: string; private_key?: string }
    | null;
  if (!k?.key_id || !k.team_id || !k.private_key) return null;
  const bundleId = k.bundle_id ?? 'net.finjaro.app';

  const now = Math.floor(Date.now() / 1000);
  // Apple: jeton valable jusqu'à 60 min, ne pas en refabriquer trop souvent.
  // On rafraîchit à 50 min pour rester large.
  if (cachedApnsToken && cachedApnsToken.exp > now + 60) {
    return { jwt: cachedApnsToken.token, bundleId };
  }

  const header = { alg: 'ES256', kid: k.key_id };
  const claims = { iss: k.team_id, iat: now };
  const enc = new TextEncoder();
  const unsigned = `${base64url(enc.encode(JSON.stringify(header)))}.${base64url(enc.encode(JSON.stringify(claims)))}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(k.private_key),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  // Web Crypto rend directement la signature au format IEEE P1363 (r || s)
  // attendu par JWS ES256 — pas de ré-encodage DER nécessaire ici,
  // contrairement à RSA plus haut.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned));
  const jwt = `${unsigned}.${base64url(sig)}`;

  cachedApnsToken = { token: jwt, exp: now + 3000 };
  return { jwt, bundleId };
}

async function sendApnsPush(
  sb: Admin,
  recipients: string[],
  payload: Record<string, unknown>,
): Promise<number> {
  const { data: tokens } = await sb
    .from('native_push_tokens')
    .select('id, token')
    .eq('platform', 'ios')
    .in('user_id', recipients);
  if (!tokens || tokens.length === 0) return 0;

  const auth = await getApnsAuth(sb);
  if (!auth) return 0;

  const title = String(payload.title ?? 'Finjaro');
  const body = String(payload.body ?? '');
  const url = String(payload.url ?? '/');

  let delivered = 0;
  await Promise.all(
    tokens.map(async (t) => {
      try {
        const resp = await fetch(`https://api.push.apple.com/3/device/${t.token}`, {
          method: 'POST',
          headers: {
            authorization: `bearer ${auth.jwt}`,
            'apns-topic': auth.bundleId,
            'apns-priority': '10',
            'apns-push-type': 'alert',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            aps: { alert: { title, body }, sound: 'default' },
            url,
            tag: String(payload.tag ?? ''),
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (resp.ok) {
          delivered++;
          return;
        }
        const errText = await resp.text();
        // Jeton périmé/désinstallé: APNs répond 410 (Unregistered) ou 400
        // (BadDeviceToken) — on le retire pour ne pas réessayer sur un mort.
        if (resp.status === 410 || resp.status === 400) {
          await sb.from('native_push_tokens').delete().eq('id', t.id);
        } else {
          console.error('apns send failed', resp.status, errText.slice(0, 300));
        }
      } catch (e) {
        console.error('apns send exception', e);
      }
    }),
  );
  return delivered;
}

// --- E-mail (Resend) -------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Gabarit sobre aux couleurs de la marque. Volontairement en HTML inline:
// les clients mail ignorent les feuilles de style externes et une bonne
// partie du CSS moderne.
function emailHtml(title: string, body: string, url: string): string {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:0;background:#FAF6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #E8DFD1;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #E8DFD1;">
          <span style="font-size:20px;font-weight:600;color:#C25E38;">Finjaro</span>
        </td></tr>
        <tr><td style="padding:24px;">
          <h1 style="margin:0 0 10px;font-size:18px;line-height:1.35;color:#171B26;">${safeTitle}</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#6B6B6B;">${safeBody}</p>
          <a href="${url}" style="display:inline-block;background:#C25E38;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Ouvrir Finjaro</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #E8DFD1;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#6B6B6B;">
            Tu reçois cet e-mail parce que tu as un compte Finjaro.
            Pour ne plus en recevoir, va dans Profil &gt; Paramètres &gt; Notifications.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmails(
  sb: Admin,
  recipients: string[],
  payload: Record<string, unknown>,
): Promise<number> {
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'resend').maybeSingle();
  const conf = (cfg?.value ?? null) as { api_key?: string; from?: string } | null;
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? conf?.api_key;
  if (!apiKey) return 0;
  const from = conf?.from ?? 'Finjaro <onboarding@resend.dev>';

  // emails_for_users écarte déjà les personnes ayant coupé les e-mails —
  // impossible de l'oublier ici par mégarde.
  const { data: rows, error } = await sb.rpc('emails_for_users', { p_ids: recipients });
  if (error || !rows || rows.length === 0) return 0;

  const title = String(payload.title ?? 'Finjaro');
  const body = String(payload.body ?? '');
  const path = String(payload.url ?? '/');
  const url = path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const html = emailHtml(title, body, url);

  let sent = 0;
  for (let i = 0; i < rows.length; i += RESEND_BATCH_MAX) {
    const chunk = rows.slice(i, i + RESEND_BATCH_MAX);
    try {
      const resp = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          chunk.map((r: { email: string }) => ({
            from,
            to: [r.email],
            reply_to: [SUPPORT_EMAIL],
            subject: title,
            html,
          })),
        ),
        signal: AbortSignal.timeout(15_000),
      });
      if (resp.ok) {
        sent += chunk.length;
      } else {
        // Jamais la clé dans les journaux — seulement le motif du refus.
        console.error('resend batch failed', resp.status, (await resp.text()).slice(0, 300));
      }
    } catch (e) {
      console.error('resend batch exception', e);
    }
  }
  return sent;
}

// --- Point d'entrée --------------------------------------------------------

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const payload = await req.json();
    const sb = admin();

    // Verrou des envois collectifs. Un envoi à UNE personne reste ouvert:
    // c'est ce dont se servent les triggers SQL, qui n'ont pas de jeton à
    // présenter. Un envoi collectif, lui, doit être prouvé.
    if (DIFFUSIONS.has(payload.audience)) {
      const { userId, isAdmin } = await callerRights(sb, req);
      let autorise = isAdmin;
      // Une vendeuse peut écrire aux abonnés de SA boutique — mais
      // uniquement de la sienne.
      if (!autorise && payload.audience === 'shop_followers' && payload.shop_id && userId) {
        const { data: shop } = await sb
          .from('shops').select('owner_id').eq('id', payload.shop_id).maybeSingle();
        autorise = shop?.owner_id === userId;
      }
      if (!autorise) return json({ error: 'forbidden' }, 403);
    }

    const recipients = await resolveRecipients(sb, payload);
    if (recipients.length === 0) return json({ push: 0, email: 0, reason: 'no_recipients' });

    // Les quatre canaux en parallèle et indépendamment: l'échec de l'un ne
    // doit jamais empêcher les autres d'arriver.
    const [push, android, ios, email] = await Promise.all([
      sendPush(sb, recipients, payload).catch((e) => {
        console.error('push channel failed', e);
        return 0;
      }),
      sendFcmPush(sb, recipients, payload).catch((e) => {
        console.error('fcm channel failed', e);
        return 0;
      }),
      sendApnsPush(sb, recipients, payload).catch((e) => {
        console.error('apns channel failed', e);
        return 0;
      }),
      sendEmails(sb, recipients, payload).catch((e) => {
        console.error('email channel failed', e);
        return 0;
      }),
    ]);

    return json({ push, native: android + ios, email });
  } catch (err) {
    console.error('send-push exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
