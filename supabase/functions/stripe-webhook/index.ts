// Finjaro — Stripe webhook. Confirms payment out-of-band (the reliable source of
// truth, independent of the browser redirect). Deployed with verify_jwt=false
// because Stripe calls it directly; instead we verify Stripe's signature.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

Deno.serve(async (req: Request) => {
  try {
    const sb = admin();
    const { data: cfgRow } = await sb.from('app_config').select('value').eq('key', 'stripe').maybeSingle();
    const cfg = (cfgRow?.value as { secret?: string; webhook_secret?: string }) || {};
    const secret = Deno.env.get('STRIPE_SECRET_KEY') || cfg.secret;
    const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || cfg.webhook_secret;
    if (!secret || !whSecret) return new Response('not_configured', { status: 400 });

    const stripe = new Stripe(secret, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() });
    const sig = req.headers.get('stripe-signature') || '';
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, whSecret);
    } catch (e) {
      console.error('bad signature', e);
      return new Response('bad_signature', { status: 400 });
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = (s.metadata?.order_id as string) || (s.client_reference_id as string);
      if (orderId) {
        await sb
          .from('orders')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', orderId);
      }
    } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = (s.metadata?.order_id as string) || (s.client_reference_id as string);
      if (orderId) await sb.from('orders').update({ payment_status: 'failed' }).eq('id', orderId);
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('stripe-webhook error', err);
    return new Response('error', { status: 500 });
  }
});
