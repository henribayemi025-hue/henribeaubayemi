// Finjaro — Vendor Copilot. Generates a short marketing product description
// from the fields the vendor already typed. Body:
// { name, category?, price?, currency?, lang? } -> { description }.
// Reuses the project-level GEMINI_API_KEY (same as finou-chat) so the vendor
// needs no extra key. The result is a *suggestion* the vendor edits/validates
// client-side — never auto-saved.
//
// SÉCURITÉ (corrigé) — cette fonction n'avait NI authentification NI quota:
// n'importe qui, connecté ou non, pouvait l'appeler directement (hors de
// l'app) en boucle et brûler la clé Gemini partagée avec Finou/Miroir IA,
// sans jamais apparaître dans le plafond de budget mensuel (ai_usage) qui
// protège les deux autres fonctions IA. Corrigé en réutilisant exactement le
// même mécanisme que finou-chat: JWT obligatoire, quota par compte, et
// journalisation dans ai_usage (donc comptabilisé dans le même budget global).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUDGET_EUR = 20;
const COPILOT_CALL_COST_EUR = 0.0005;

// Même règle que finou-chat/miroir-ia.
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

function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

function monthStartIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 503);

    // Cette fonction ne sert qu'aux vendeuses en train de créer/éditer un
    // article — un compte est donc requis (pas d'accès invité comme Finou).
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const sb = admin();

    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: `vendor_copilot:u:${user.id}`,
      p_limit: 20,
      p_window_seconds: 300,
    });
    if (allowed === false) return json({ error: 'rate_limited' }, 429);

    const { data: usage } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
    const totalEur = (usage ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
    if (totalEur >= BUDGET_EUR) return json({ error: 'budget_exceeded' }, 503);

    const { name, category, price, currency, lang } = await req.json();
    if (!name || typeof name !== 'string') return json({ error: 'missing_name' }, 400);

    const isFr = (lang || 'fr').toString().startsWith('fr');
    const priceLine = price ? ` Prix indicatif: ${price} ${currency || ''}.` : '';
    const prompt = isFr
      ? `Rédige une description produit courte et vendeuse (2 à 3 phrases, 60 mots max) ` +
        `en français pour une marketplace africaine (Finjaro). Produit: "${name}"` +
        `${category ? `, catégorie: ${category}` : ''}.${priceLine} ` +
        `Ton chaleureux et concret, met en valeur la qualité et le style. ` +
        `N'invente pas de prix ni de disponibilité. Réponds UNIQUEMENT avec le texte, sans guillemets ni titre.`
      : `Write a short, persuasive product description (2-3 sentences, max 60 words) ` +
        `in English for an African marketplace (Finjaro). Product: "${name}"` +
        `${category ? `, category: ${category}` : ''}.${priceLine} ` +
        `Warm, concrete tone highlighting quality and style. ` +
        `Do not invent price or availability. Reply ONLY with the text, no quotes or title.`;

    const endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
      }),
    });

    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text());
      return json({ error: 'gemini_error' }, 502);
    }
    const data = await res.json();
    const description =
      (data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') || '')
        .trim()
        .replace(/^["']|["']$/g, '');
    if (!description) return json({ error: 'empty' }, 502);
    sb.from('ai_usage').insert({ fn: 'vendor_copilot', cost_eur: COPILOT_CALL_COST_EUR }).then(() => {}, () => {});
    return json({ description });
  } catch (err) {
    console.error('vendor-copilot exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
