// Finjaro — Web Push delivery.
// Phase 1 notification events are wired here. Accepts one of:
//   { user_id, title, body, url?, tag? }                        -> single recipient
//   { audience: 'shop_followers', shop_id, title, body, url? }  -> all followers of a shop
//   { audience: 'country', country, except_user_id?, ... }      -> everyone in a country
// Delivers via VAPID Web Push when VAPID_KEYS is configured; otherwise degrades
// gracefully (in-app notifications are persisted separately by DB triggers).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush@0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
}

async function resolveRecipients(sb: ReturnType<typeof admin>, payload: Record<string, unknown>) {
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const sb = admin();
    const recipients = await resolveRecipients(sb, payload);
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ delivered: 0, reason: 'no_recipients' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch push subscriptions for all recipients.
    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key, user_id')
      .in('user_id', recipients);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ delivered: 0, reason: 'no_subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VAPID keys are optional in Phase 1; without them we skip delivery cleanly.
    const rawKeys = Deno.env.get('VAPID_KEYS');
    if (!rawKeys) {
      return new Response(JSON.stringify({ delivered: 0, reason: 'vapid_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidKeys = await webpush.importVapidKeys(JSON.parse(rawKeys), { extractable: false });
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@finjaro.app',
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
          // Stale subscription: prune it so we don't retry forever.
          console.error('push failed', e);
          await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      })
    );

    return new Response(JSON.stringify({ delivered }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push exception', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
