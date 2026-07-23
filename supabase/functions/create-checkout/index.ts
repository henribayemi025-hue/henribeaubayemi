// Finjaro — create a Stripe Checkout Session for an existing order.
// Body: { order_id }. Requires the caller's JWT (the buyer). Returns { url }.
// The Stripe secret key is read from the private app_config table (key 'stripe',
// value { secret, publishable, webhook_secret }) so it never lives in the repo.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// FCFA is our canonical store; Stripe charges in EUR for a French account.
const FCFA_TO_EUR = 0.001524;

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

async function stripeConfig(sb: ReturnType<typeof admin>) {
  const envKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (envKey) return { secret: envKey };
  const { data } = await sb.from('app_config').select('value').eq('key', 'stripe').maybeSingle();
  return (data?.value as { secret?: string }) || null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    // Identify the caller from their JWT.
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { order_id } = await req.json();
    if (!order_id) return json({ error: 'missing_order' }, 400);

    const sb = admin();
    const { data: order } = await sb
      .from('orders')
      .select('id, order_no, buyer_id, shop_id, total_fcfa, payment_status')
      .eq('id', order_id)
      .maybeSingle();
    if (!order || order.buyer_id !== user.id) return json({ error: 'forbidden' }, 403);
    if (order.payment_status === 'paid') return json({ error: 'already_paid' }, 409);

    const cfg = await stripeConfig(sb);
    if (!cfg?.secret) return json({ error: 'stripe_not_configured' }, 400);

    const stripe = new Stripe(cfg.secret, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const amount = Math.max(50, Math.round(order.total_fcfa * FCFA_TO_EUR * 100)); // cents, min 0.50€
    const origin = req.headers.get('origin') || 'https://finjaro.netlify.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Finjaro — commande #${order.order_no}` },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/profile/orders?paid=${order.id}`,
      cancel_url: `${origin}/checkout/${order.shop_id}?canceled=1`,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
    });

    await sb
      .from('orders')
      .update({ payment_provider: 'stripe', payment_ref: session.id, payment_status: 'unpaid' })
      .eq('id', order.id);

    return json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error', err);
    return json({ error: 'internal_error' }, 500);
  }
});
