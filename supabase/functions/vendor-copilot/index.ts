// Finjaro — Vendor Copilot. Trois modes, même sécurité pour les trois :
//   (défaut) 'description'  { name, category?, price?, currency?, lang? } -> { description }
//   'listing'               { image_path, lang? } -> fiche complète depuis la photo
//                           { title, description, keywords[], category, price_hint_fcfa?, price_samples }
//   'reel_script'           { name, description?, lang? } -> script vidéo
//                           { hook, scenes[{shot,text}], cta, hashtags[] }
//
// 'listing' est l'Auto-Listing du pilier 3 (capacité 12, partie texte) : la
// photo est lue DEPUIS le bucket public `products` (le vendeur l'a déjà
// uploadée pour sa fiche) — pas de base64 géant dans la requête. La catégorie
// renvoyée est contrainte par enum aux ids RÉELS de la table categories
// (Structured Outputs), jamais du texte libre. Le repère de prix n'est PAS
// inventé par Gemini : c'est la médiane des articles actifs de la même
// catégorie dans le catalogue — s'il y a moins de 3 échantillons on ne
// renvoie rien plutôt qu'un chiffre au doigt mouillé.
//
// SÉCURITÉ — JWT obligatoire, quota par compte (check_rate_limit),
// journalisation ai_usage dans le budget global partagé. La clé Gemini ne
// quitte jamais le serveur.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUDGET_EUR = 20;
const COPILOT_CALL_COST_EUR = 0.0005;
const LISTING_CALL_COST_EUR = 0.002; // vision = plus cher qu'un appel texte
const MAX_IMG_BYTES = 5_000_000;

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

// Mêmes modèles et même garde-temps que finou-chat. Un seul modèle codé en
// dur laissait la fonction retourner 502 dès que CE modèle refusait (quota,
// surcharge, retrait) — constaté le 04/08: l'ajout en masse ne remplissait
// rien pendant que finou-chat, qui a un repli, continuait de répondre.
const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash'];
const GEMINI_TIMEOUT_MS = 30_000;

// Google limite le nombre d'appels PAR MINUTE. L'ajout en masse en envoie un
// par photo: sur 77 photos on dépasse largement, et Google refuse la plupart
// (429/503). Constaté le 04/08 dans les journaux — un appel passait, les
// suivants tombaient. On attend et on réessaie au lieu d'abandonner: c'est un
// refus TEMPORAIRE, pas une erreur.
const RETRY_WAITS_MS = [1500, 4000, 9000];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// deno-lint-ignore no-explicit-any
async function gemini(apiKey: string, body: unknown): Promise<any | null> {
  for (const model of MODELS) {
    for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
          },
        );
        if (res.ok) return await res.json();
        const detail = (await res.text()).slice(0, 200);
        console.error('vendor-copilot: gemini error', model, res.status, detail);
        const temporary = res.status === 429 || res.status >= 500;
        if (!temporary) break; // refus définitif: passer au modèle suivant
        if (attempt < RETRY_WAITS_MS.length) await sleep(RETRY_WAITS_MS[attempt]);
      } catch (e) {
        console.error('vendor-copilot: gemini call failed', model, String(e));
        if (attempt < RETRY_WAITS_MS.length) await sleep(RETRY_WAITS_MS[attempt]);
      }
    }
  }
  return null;
}

// deno-lint-ignore no-explicit-any
function textOf(data: any): string {
  return (data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') || '').trim();
}

function b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 503);

    // Réservé aux vendeuses en train d'éditer — compte requis.
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const sb = admin();

    // 20 appels / 5 min suffisaient tant qu'on remplissait une fiche à la
    // fois; l'ajout en masse en demande un PAR PHOTO (Beau: 72 d'un coup), et
    // tout ce qui dépassait échouait en silence. Le vrai garde-fou contre la
    // dépense reste le budget mensuel partagé ci-dessous — celui-ci ne sert
    // qu'à empêcher l'emballement.
    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: `vendor_copilot:u:${user.id}`,
      p_limit: 120,
      p_window_seconds: 300,
    });
    if (allowed === false) return json({ error: 'rate_limited' }, 429);

    const { data: usage } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
    const totalEur = (usage ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
    if (totalEur >= BUDGET_EUR) return json({ error: 'budget_exceeded' }, 503);

    const body = await req.json();
    const mode = body.mode || 'description';
    const isFr = (body.lang || 'fr').toString().startsWith('fr');

    // ----------------------------------------------------------------- listing
    if (mode === 'listing') {
      const imagePath = body.image_path;
      if (!imagePath || typeof imagePath !== 'string' || imagePath.includes('..')) {
        return json({ error: 'missing_image' }, 400);
      }
      // La photo vient du bucket public `products`, déjà uploadée par la
      // vendeuse pour sa fiche — on la relit côté serveur.
      const imgUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/products/${imagePath}`;
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) return json({ error: 'image_not_found' }, 400);
      const buf = await imgRes.arrayBuffer();
      if (buf.byteLength > MAX_IMG_BYTES) return json({ error: 'image_too_large' }, 400);
      const mime = imgRes.headers.get('content-type') || 'image/jpeg';

      // Enum des catégories PRODUIT réelles (têtes + enfants) — la réponse ne
      // peut pas inventer une catégorie qui n'existe pas en base.
      const { data: cats } = await sb.from('categories').select('id, parent_id').eq('kind', 'PRODUCT');
      const catIds = (cats ?? []).map((c: { id: string }) => c.id);
      if (catIds.length === 0) return json({ error: 'no_categories' }, 503);

      const prompt = isFr
        ? `Tu prépares une fiche article pour une marketplace africaine (Finjaro) à partir de cette photo. ` +
          `Titre: court et vendeur (max 60 caractères), sans marque inventée. ` +
          `Description: 2-3 phrases chaleureuses et concrètes (max 60 mots), sans prix ni disponibilité inventés. ` +
          `Keywords: 3 à 6 mots de recherche. Category: l'id qui correspond le mieux à l'objet.`
        : `You are drafting a product listing for an African marketplace (Finjaro) from this photo. ` +
          `Title: short and appealing (max 60 chars), no invented brand. ` +
          `Description: 2-3 warm, concrete sentences (max 60 words), no invented price or availability. ` +
          `Keywords: 3-6 search words. Category: the best-matching id.`;

      const geminiBody = (withSchema: boolean) => ({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: mime, data: b64(buf) } },
            {
              text: withSchema
                ? prompt
                // Sans schéma, le format et la liste des ids doivent passer
                // par le texte de la consigne.
                : `${prompt}\n\nRéponds UNIQUEMENT en JSON: ` +
                  `{"title":"","description":"","keywords":[],"category":""}. ` +
                  `"category" doit être exactement l'un de: ${catIds.join(', ')}.`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
          ...(withSchema
            ? {
                responseSchema: {
                  type: 'OBJECT',
                  required: ['title', 'description', 'keywords', 'category'],
                  properties: {
                    title: { type: 'STRING' },
                    description: { type: 'STRING' },
                    keywords: { type: 'ARRAY', items: { type: 'STRING' } },
                    category: { type: 'STRING', enum: catIds },
                  },
                },
              }
            : {}),
        },
      });
      // Repli sans `responseSchema`: l'enum des catégories fait plusieurs
      // dizaines de valeurs et Gemini refuse parfois le schéma en bloc — dans
      // ce cas on redemande en JSON libre puis on valide la catégorie
      // nous-mêmes. Mieux vaut une fiche remplie qu'un 502.
      let data = await gemini(apiKey, geminiBody(true));
      if (!data) data = await gemini(apiKey, geminiBody(false));
      if (!data) return json({ error: 'gemini_error' }, 502);
      let parsed: { title: string; description: string; keywords: string[]; category: string };
      try {
        // En JSON libre, le modèle encadre parfois sa réponse de ```json.
        parsed = JSON.parse(textOf(data).replace(/^```(?:json)?|```$/g, '').trim());
      } catch {
        return json({ error: 'bad_ai_response' }, 502);
      }
      // La catégorie doit exister en base, que le schéma l'ait contrainte ou
      // non — sinon la fiche partirait avec un rayon inconnu.
      if (!catIds.includes(parsed.category)) parsed.category = '';

      // Repère de prix HONNÊTE : médiane du catalogue dans la même famille de
      // catégories (la catégorie + ses sœurs sous la même tête). Jamais un
      // chiffre inventé par le modèle.
      const cat = (cats ?? []).find((c: { id: string }) => c.id === parsed.category);
      const head = cat?.parent_id ?? parsed.category;
      const family = (cats ?? [])
        .filter((c: { id: string; parent_id: string | null }) => c.id === head || c.parent_id === head)
        .map((c: { id: string }) => c.id);
      const { data: prices } = await sb
        .from('products').select('price_fcfa')
        .in('category', family).eq('is_active', true).gt('price_fcfa', 0).limit(200);
      const nums = (prices ?? []).map((p: { price_fcfa: number }) => Number(p.price_fcfa)).filter((n: number) => n > 0);

      sb.from('ai_usage').insert({ fn: 'vendor_copilot', cost_eur: LISTING_CALL_COST_EUR }).then(() => {}, () => {});
      return json({
        ...parsed,
        price_hint_fcfa: nums.length >= 3 ? median(nums) : null,
        price_samples: nums.length,
      });
    }

    // ------------------------------------------------------------- reel_script
    if (mode === 'reel_script') {
      const { name, description } = body;
      if (!name || typeof name !== 'string') return json({ error: 'missing_name' }, 400);
      const prompt = isFr
        ? `Écris un script de vidéo courte (Reel/TikTok, 20-30 s) pour vendre cet article sur Finjaro, ` +
          `marketplace africaine. Article: "${name}"${description ? ` — ${description}` : ''}. ` +
          `hook: phrase d'accroche parlée (1 phrase). scenes: 3 à 4 plans, chacun avec "shot" ` +
          `(ce qu'on filme, concret et faisable au téléphone) et "text" (ce qu'on dit ou affiche). ` +
          `cta: appel à l'action final. hashtags: 4 à 6, sans le #. Ton naturel, pas d'anglicismes forcés.`
        : `Write a short-video script (Reel/TikTok, 20-30s) to sell this item on Finjaro, an African ` +
          `marketplace. Item: "${name}"${description ? ` — ${description}` : ''}. ` +
          `hook: spoken opening line. scenes: 3-4 shots, each with "shot" (what to film, phone-doable) ` +
          `and "text" (what is said or shown). cta: final call to action. hashtags: 4-6, without #.`;

      const data = await gemini(apiKey, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            required: ['hook', 'scenes', 'cta', 'hashtags'],
            properties: {
              hook: { type: 'STRING' },
              scenes: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  required: ['shot', 'text'],
                  properties: { shot: { type: 'STRING' }, text: { type: 'STRING' } },
                },
              },
              cta: { type: 'STRING' },
              hashtags: { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
        },
      });
      if (!data) return json({ error: 'gemini_error' }, 502);
      try {
        const parsed = JSON.parse(textOf(data));
        sb.from('ai_usage').insert({ fn: 'vendor_copilot', cost_eur: COPILOT_CALL_COST_EUR }).then(() => {}, () => {});
        return json(parsed);
      } catch {
        return json({ error: 'bad_ai_response' }, 502);
      }
    }

    // ----------------------------------------------- description (mode défaut)
    const { name, category, price, currency } = body;
    if (!name || typeof name !== 'string') return json({ error: 'missing_name' }, 400);

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

    const data = await gemini(apiKey, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
    });
    if (!data) return json({ error: 'gemini_error' }, 502);
    const description = textOf(data).replace(/^["']|["']$/g, '');
    if (!description) return json({ error: 'empty' }, 502);
    sb.from('ai_usage').insert({ fn: 'vendor_copilot', cost_eur: COPILOT_CALL_COST_EUR }).then(() => {}, () => {});
    return json({ description });
  } catch (err) {
    console.error('vendor-copilot exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
