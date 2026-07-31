// Finjaro — envoi des notifications: push navigateur ET e-mail.
//
// Le nom "send-push" est conservé pour ne pas casser les trois appelants
// existants (CheckoutCOD, VendorChat, VendorOrders via src/lib/notify.js),
// mais la fonction fait désormais les deux canaux.
//
// Accepte:
//   { user_id, title, body, url?, tag? }                        -> une personne
//   { audience: 'shop_followers', shop_id, title, body, url? }  -> abonnés d'une boutique
//   { audience: 'country', country, except_user_id?, ... }      -> tout un pays
//
// POURQUOI L'E-MAIL EST INDISPENSABLE
// Sur iPhone, le push web ne fonctionne QUE si le site a été ajouté à l'écran
// d'accueil. Sans e-mail, une grande partie des utilisatrices n'était donc
// jamais prévenue de rien. Les deux canaux sont tentés indépendamment: si le
// push échoue ou n'existe pas, l'e-mail part quand même — c'était le vrai
// défaut de la version précédente, qui abandonnait dès qu'aucun abonnement
// push n'était trouvé.
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

async function resolveRecipients(sb: Admin, payload: Record<string, unknown>) {
  if (payload.user_id) return [payload.user_id as string];
  if (payload.audience === 'shop_followers' && payload.shop_id) {
    const { data } = await sb.from('shop_follows').select('follower_id').eq('shop_id', payload.shop_id);
    return (data ?? []).map((r) => r.follower_id);
  }
  if (payload.audience === 'country' && payload.country) {
    const { data } = await sb.from('profiles').select('id').eq('country', payload.country);
    return (data ?? [])
      .map((r) => r.id)
      .filter((id) => id !== payload.except_user_id);
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
    const recipients = await resolveRecipients(sb, payload);
    if (recipients.length === 0) return json({ push: 0, email: 0, reason: 'no_recipients' });

    // Les deux canaux en parallèle et indépendamment: l'échec de l'un ne doit
    // jamais empêcher l'autre d'arriver.
    const [push, email] = await Promise.all([
      sendPush(sb, recipients, payload).catch((e) => {
        console.error('push channel failed', e);
        return 0;
      }),
      sendEmails(sb, recipients, payload).catch((e) => {
        console.error('email channel failed', e);
        return 0;
      }),
    ]);

    return json({ push, email });
  } catch (err) {
    console.error('send-push exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
