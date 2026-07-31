// finou-vision — "Snap & Buy" (recherche visuelle inversée, Finou 2.0 pilier 2).
// L'utilisateur envoie la photo d'un objet; Gemini 2.5 Flash l'identifie via un
// STRUCTURED OUTPUT (responseSchema JSON strict — jamais de texte libre à
// parser), puis la fonction cherche elle-même les articles similaires dans le
// catalogue réel et renvoie tout au client:
//   POST { imageBase64, mimeType? } -> { analysis: {keywords, category,
//   description}, products: [...] }
//
// SÉCURITÉ (règle d'or): la clé Gemini ne quitte jamais le serveur; compte
// requis (verify_jwt + getUser), quota par compte via check_rate_limit,
// plafond budget mensuel partagé (ai_usage) — même mécanique que
// finou-chat/miroir-ia. La recherche catalogue passe par le client
// service_role mais ne touche que des produits is_active (déjà publics).
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MODEL = 'gemini-2.5-flash';
const BUDGET_EUR = 20;
const VISION_CALL_COST_EUR = 0.001;
const GEMINI_TIMEOUT_MS = 25_000;
const MAX_IMAGE_B64 = 8_000_000; // ~6 Mo binaire, comme miroir-ia

// Même règle que finou-chat/miroir-ia.
const PROD_HOST = 'finjaro.net';
const NETLIFY_HOST = 'finjaro.netlify.app';

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
  if (host === NETLIFY_HOST || host.endsWith(`--${NETLIFY_HOST}`)) return true;
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

// Schéma JSON STRICT imposé à Gemini (Structured Outputs): la réponse est
// toujours exactement cet objet — pas de prose, pas de markdown, rien à
// deviner côté serveur. La catégorie est contrainte par enum aux ids réels
// de la table categories (chargés au premier appel).
function analysisSchema(categoryIds: string[]) {
  return {
    type: 'OBJECT',
    properties: {
      keywords: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '2 à 5 mots-clés de recherche catalogue, en français, du plus au moins spécifique',
      },
      category: { type: 'STRING', enum: categoryIds, description: "Catégorie Finjaro la plus probable de l'objet" },
      description: { type: 'STRING', description: "Description courte de l'objet identifié (1 phrase)" },
    },
    required: ['keywords', 'category', 'description'],
  };
}

let CATEGORY_IDS: string[] = [];

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 503);

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const sb = admin();

    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: `finou_vision:u:${user.id}`,
      p_limit: 10,
      p_window_seconds: 300,
    });
    if (allowed === false) return json({ error: 'rate_limited' }, 429);

    const { data: usage } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
    const totalEur = (usage ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
    if (totalEur >= BUDGET_EUR) return json({ error: 'budget_exceeded' }, 503);

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') return json({ error: 'missing_image' }, 400);
    if (imageBase64.length > MAX_IMAGE_B64) return json({ error: 'image_too_large' }, 413);

    // Catégories PRODUCT réelles — l'enum du schéma les impose à Gemini.
    if (CATEGORY_IDS.length === 0) {
      const { data: cats } = await sb.from('categories').select('id').eq('kind', 'PRODUCT');
      CATEGORY_IDS = (cats ?? []).map((c: { id: string }) => c.id);
      if (CATEGORY_IDS.length === 0) CATEGORY_IDS = ['mode_femme'];
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Identifie l'objet principal de cette photo pour une recherche sur la marketplace Finjaro." },
              { inline_data: { mime_type: typeof mimeType === 'string' ? mimeType : 'image/jpeg', data: imageBase64 } },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema(CATEGORY_IDS),
            temperature: 0.2,
          },
        }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      }
    );
    if (!resp.ok) {
      console.error('finou-vision: gemini error', resp.status, (await resp.text()).slice(0, 300));
      return json({ error: 'gemini_error' }, 502);
    }
    const body = await resp.json();
    let analysis: { keywords?: string[]; category?: string; description?: string } = {};
    try {
      analysis = JSON.parse(body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
    } catch {
      return json({ error: 'bad_analysis' }, 502);
    }

    // Recherche catalogue: mot-clé par mot-clé (du plus spécifique au plus
    // large), premier qui matche gagne; repli sur la catégorie seule.
    let products: unknown[] = [];
    for (const kw of (analysis.keywords ?? []).slice(0, 5)) {
      if (typeof kw !== 'string' || !kw.trim()) continue;
      const { data } = await sb
        .from('products')
        .select('id,name,price_fcfa,images,category,stock,shop_id,shops(name)')
        .eq('is_active', true)
        .ilike('name', `%${kw.trim()}%`)
        .limit(8);
      if (data && data.length > 0) { products = data; break; }
    }
    if (products.length === 0 && analysis.category) {
      const { data: kids } = await sb.from('categories').select('id').or(`id.eq.${analysis.category},parent_id.eq.${analysis.category}`);
      const ids = (kids ?? []).map((k: { id: string }) => k.id);
      const { data } = await sb
        .from('products')
        .select('id,name,price_fcfa,images,category,stock,shop_id,shops(name)')
        .eq('is_active', true)
        .in('category', ids.length ? ids : [analysis.category])
        .order('views', { ascending: false })
        .limit(8);
      products = data ?? [];
    }

    sb.from('ai_usage').insert({ fn: 'finou_vision', cost_eur: VISION_CALL_COST_EUR }).then(() => {}, () => {});
    return json({ analysis, products });
  } catch (err) {
    console.error('finou-vision exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
