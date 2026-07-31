// Finjaro — Évaluateur de troc (pilier 2, capacité 10). Deux photos d'objets
// → état de chacun, valeur estimée, et la soulte (le cash qui rééquilibre
// l'échange). Structured Output strict — jamais de texte libre à parser.
//
// HONNÊTETÉ D'ESTIMATION: la seule référence de prix disponible est le
// catalogue Finjaro lui-même (pas d'accès aux prix du marché mondial). C'est
// écrit dans l'UI, et le verdict est présenté comme une AIDE à la
// négociation, pas comme une expertise. Aucune écriture en base: la fonction
// ne crée ni n'engage aucun échange.
//
// Les photos arrivent en base64 (prises sur le moment, elles ne sont dans
// aucun bucket) — même flux et mêmes bornes que le selfie de miroir-ia.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUDGET_EUR = 20;
const TROC_CALL_COST_EUR = 0.002;
const MAX_B64 = 8_000_000; // ~6 Mo binaire par photo

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

    // Compte requis: l'appel coûte de l'argent et alimente une négociation
    // entre deux personnes réelles.
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const sb = admin();

    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: `troc:u:${user.id}`,
      p_limit: 10,
      p_window_seconds: 300,
    });
    if (allowed === false) return json({ error: 'rate_limited' }, 429);

    const { data: usage } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
    const totalEur = (usage ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
    if (totalEur >= BUDGET_EUR) return json({ error: 'budget_exceeded' }, 503);

    const { image_a, mime_a, image_b, mime_b, lang } = await req.json();
    if (!image_a || !image_b) return json({ error: 'missing_images' }, 400);
    if (String(image_a).length > MAX_B64 || String(image_b).length > MAX_B64) {
      return json({ error: 'image_too_large' }, 400);
    }
    const isFr = (lang || 'fr').toString().startsWith('fr');

    const prompt = isFr
      ? `Deux personnes veulent échanger ces deux objets (photo A puis photo B). Pour chacun: ` +
        `identifie l'objet (champ "objet"), évalue son état visible, et estime une valeur en FCFA ` +
        `d'occasion réaliste pour un marché ouest/centre-africain. Puis calcule la soulte: le montant ` +
        `en FCFA que doit ajouter le détenteur de l'objet le MOINS cher pour que l'échange soit ` +
        `équitable, et "en_faveur_de" = l'objet le plus cher ("a", "b", ou "aucun" si équivalents à ` +
        `10% près — soulte 0 dans ce cas). "conseil": une phrase de contexte honnête (incertitudes, ` +
        `ce qui ferait varier le prix).`
      : `Two people want to trade these two items (photo A then photo B). For each: identify the item ` +
        `("objet"), assess its visible condition, estimate a realistic second-hand value in FCFA for a ` +
        `West/Central African market. Then compute the balancing cash ("soulte_fcfa") the owner of the ` +
        `CHEAPER item must add for a fair trade, and "en_faveur_de" = the pricier item ("a", "b", or ` +
        `"aucun" if within 10% — soulte 0 then). "conseil": one honest sentence of context.`;

    const itemSchema = {
      type: 'OBJECT',
      required: ['objet', 'etat', 'valeur_estimee_fcfa'],
      properties: {
        objet: { type: 'STRING' },
        etat: { type: 'STRING', enum: ['neuf', 'tres_bon', 'bon', 'use', 'abime'] },
        valeur_estimee_fcfa: { type: 'NUMBER' },
      },
    };

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: 'Photo A:' },
              { inlineData: { mimeType: mime_a || 'image/jpeg', data: image_a } },
              { text: 'Photo B:' },
              { inlineData: { mimeType: mime_b || 'image/jpeg', data: image_b } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              required: ['item_a', 'item_b', 'soulte_fcfa', 'en_faveur_de', 'conseil'],
              properties: {
                item_a: itemSchema,
                item_b: itemSchema,
                soulte_fcfa: { type: 'NUMBER' },
                en_faveur_de: { type: 'STRING', enum: ['a', 'b', 'aucun'] },
                conseil: { type: 'STRING' },
              },
            },
          },
        }),
      },
    );
    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text());
      return json({ error: 'gemini_error' }, 502);
    }
    const data = await res.json();
    const text =
      (data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') || '').trim();
    try {
      const parsed = JSON.parse(text);
      sb.from('ai_usage').insert({ fn: 'troc_eval', cost_eur: TROC_CALL_COST_EUR }).then(() => {}, () => {});
      return json(parsed);
    } catch {
      return json({ error: 'bad_ai_response' }, 502);
    }
  } catch (err) {
    console.error('troc-eval exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
