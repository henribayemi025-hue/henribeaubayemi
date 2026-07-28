// Finjaro — Mirror AI / essayage virtuel. Cache la clé Gemini, jamais visible
// côté client. La photo envoyée n'est PAS stockée (aucune écriture Storage) —
// elle transite juste vers Gemini et repart, RGPD-friendly par défaut.
// Une limite quotidienne par utilisateur est appliquée CÔTÉ SERVEUR (via la
// table events) car Gemini facture à l'image — impossible à contourner depuis
// le client, contrairement à une limite purement front-end.
//
// Budget safety net: shares one Gemini API key/project with finou-chat. See
// finou-chat/index.ts for the full rationale — same mechanism here so an
// image-generation spike can't blow the monthly budget either.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Chaîne de repli: si le modèle principal échoue (indisponible, refus), on
// tente le suivant avant d'abandonner. Tous vérifiés présents sur la clé.
const MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'];
const DAILY_LIMIT = 5;
const BUDGET_EUR = 20;
const MIRROR_CALL_COST_EUR = 0.02; // conservative estimate — image generation costs more than a text turn
const ADMIN_USER_ID = 'bffb724f-6652-4240-a6f7-6904369a1fd4';
// Un worker edge est tué vers ~150 s (statut 546). On borne chaque appel bien
// en dessous pour renvoyer une vraie erreur au lieu de mourir sans réponse.
const GEMINI_TIMEOUT_MS = 40_000;
const PRODUCT_IMG_TIMEOUT_MS = 8_000;
const MAX_SELFIE_B64 = 8_000_000;   // ~6 Mo binaire
const MAX_PRODUCT_IMG_BYTES = 5_000_000;

const ALLOWED_ORIGINS = [
  'https://finjaro.netlify.app',
  'https://finjaro-main.netlify.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed || '',
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

// L'API REST v1beta ACCEPTE le snake_case en entrée mais RÉPOND en camelCase.
// Chercher uniquement `inline_data` dans la réponse ne trouvait jamais rien:
// l'image était bien générée (et facturée) puis jetée, d'où les 502 en boucle.
// On lit donc les deux formes, partout.
type GeminiPart = { inlineData?: Blob64; inline_data?: Blob64; text?: string };
type Blob64 = { mimeType?: string; mime_type?: string; data: string };

function findImage(data: Record<string, any>): Blob64 | null {
  const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const blob = p.inlineData ?? p.inline_data;
    if (blob?.data) return blob;
  }
  return null;
}

// btoa() sur une chaîne construite caractère par caractère est en O(n²) et
// faisait dépasser la limite CPU du worker sur une photo produit un peu
// lourde. On convertit par blocs.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function monthStartIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function isOverBudget(sb: ReturnType<typeof admin>): Promise<boolean> {
  const { data } = await sb.from('ai_usage').select('cost_eur').gte('created_at', monthStartIso());
  const total = (data ?? []).reduce((s: number, r: { cost_eur: number }) => s + Number(r.cost_eur), 0);
  if (total < BUDGET_EUR) return false;

  const monthKey = monthStartIso().slice(0, 7);
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'ai_budget_alert_sent').maybeSingle();
  if (cfg?.value !== monthKey) {
    sb.from('app_config').upsert({ key: 'ai_budget_alert_sent', value: monthKey, updated_at: new Date().toISOString() }).then(() => {}, () => {});
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({
        user_id: ADMIN_USER_ID,
        title: 'Finjaro — budget IA atteint',
        body: `Finou Chou et Miroir AI sont en pause ce mois-ci (limite ${BUDGET_EUR}€ atteinte).`,
      }),
    }).catch(() => {});
  }
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    const sb = admin();

    // Anti-abus court terme: 3 générations / 5 min, en plus du quota du jour.
    const { data: allowed } = await sb.rpc('check_rate_limit', {
      p_bucket: `miroir-ia:${user.id}`,
      p_limit: 3,
      p_window_seconds: 300,
    });
    if (allowed === false) return json({ error: 'rate_limited', retry_after_s: 300 }, 429);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count } = await sb
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'mirror_try')
      .gte('created_at', since.toISOString());
    if ((count || 0) >= DAILY_LIMIT) {
      return json({ error: 'daily_limit_reached', limit: DAILY_LIMIT }, 429);
    }

    if (await isOverBudget(sb)) return json({ error: 'budget_paused' }, 503);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY manquant dans les secrets' }, 500);

    const { selfieBase64, prompt, category, productImageUrl } = await req.json();
    if (!selfieBase64 || !prompt) {
      return json({ error: 'selfieBase64 et prompt requis' }, 400);
    }
    if (typeof selfieBase64 !== 'string' || selfieBase64.length > MAX_SELFIE_B64) {
      return json({ error: 'photo_too_large' }, 413);
    }

    // The product's own photo — without it Gemini only has the product NAME
    // in text and has nothing to actually render ("I can't visualize
    // '<name>', describe it for me" was the exact refusal this fixes).
    let productImagePart: { inline_data: { mime_type: string; data: string } } | null = null;
    if (productImageUrl && typeof productImageUrl === 'string') {
      try {
        const imgResp = await fetch(productImageUrl, { signal: AbortSignal.timeout(PRODUCT_IMG_TIMEOUT_MS) });
        if (imgResp.ok) {
          const buf = await imgResp.arrayBuffer();
          if (buf.byteLength <= MAX_PRODUCT_IMG_BYTES) {
            const mimeType = imgResp.headers.get('content-type') || 'image/jpeg';
            productImagePart = { inline_data: { mime_type: mimeType, data: bytesToBase64(new Uint8Array(buf)) } };
          }
        }
      } catch (e) {
        console.error('miroir-ia: failed to fetch product image', e);
      }
    }

    // A ring needs a hand in frame, a watch needs a wrist, etc. — telling
    // Gemini which body part to expect (and to work with whatever is
    // actually in the photo) cuts down on it silently declining to edit.
    const BODY_PART_HINTS: Record<string, string> = {
      bijoux: "Le bijou se porte probablement sur la main, le cou ou les oreilles visibles sur la photo — édite la zone du corps pertinente qui apparaît dans l'image.",
      montres: "La montre se porte au poignet — édite le poignet visible sur la photo.",
      chaussures: "Les chaussures se portent aux pieds — édite les pieds visibles sur la photo.",
      mode: "Édite les vêtements de la personne sur la photo.",
      sacs: "Ajoute le sac porté ou tenu par la personne sur la photo.",
      accessoires: "Édite la zone du corps où cet accessoire se porte habituellement, selon ce qui est visible sur la photo.",
      cheveux: "Édite la coiffure/cheveux de la personne sur la photo.",
    };
    const bodyPartHint = BODY_PART_HINTS[category] || '';

    const promptText = productImagePart
      ? `Essayage virtuel. Voici deux images : la PREMIÈRE est la photo de la personne, la SECONDE est la photo réelle de l'article "${prompt}" à lui faire porter. ${bodyPartHint} Édite la première photo pour que la personne porte exactement l'article montré dans la seconde image (même couleur, forme et matière). Garde le visage, la pose et la morphologie de la personne identiques. Si la partie du corps nécessaire n'est pas visible sur la photo, fais de ton mieux avec ce qui est visible plutôt que de refuser. Tu DOIS produire une image éditée en sortie — ne réponds jamais uniquement par du texte.`
      : `Essayage virtuel : montre la personne sur cette photo portant ${prompt}. ${bodyPartHint} Garde le visage, la pose et la morphologie identiques, change seulement la tenue/le look décrit. Si la partie du corps nécessaire n'est pas visible sur la photo, fais de ton mieux avec ce qui est visible plutôt que de refuser. Tu DOIS produire une image éditée en sortie — ne réponds jamais uniquement par du texte.`;

    async function callGemini(model: string) {
      const parts: Array<Record<string, unknown>> = [
        { text: promptText },
        { inline_data: { mime_type: 'image/jpeg', data: selfieBase64 } },
      ];
      if (productImagePart) parts.push(productImagePart);
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': GEMINI_API_KEY!, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        }
      );
      const body = await resp.json();
      return { ok: resp.ok, status: resp.status, body };
    }

    // On parcourt la chaîne de modèles: le premier qui rend une image gagne.
    // Gemini renvoie parfois un 503 "overloaded" purement transitoire (observé
    // en test), donc on retente le MÊME modèle une fois avant de basculer.
    let attempts = 0;
    let lastDetail: string | undefined;
    for (const model of MODELS) {
      let res: Awaited<ReturnType<typeof callGemini>> | null = null;

      for (let tryNo = 1; tryNo <= 2; tryNo++) {
        attempts++;
        try {
          res = await callGemini(model);
        } catch (e) {
          lastDetail = `${model}: ${String(e)}`;
          console.error('miroir-ia: gemini call failed', model, e);
          res = null;
          continue; // panne réseau/timeout: transitoire, on retente
        }
        if (res.ok) break;
        lastDetail = res.body?.error?.message || `HTTP ${res.status}`;
        console.error('miroir-ia: gemini error', model, res.status, JSON.stringify(res.body).slice(0, 500));
        if (res.status < 500 && res.status !== 429) break; // erreur définitive
        res = null; // 5xx/429: transitoire
      }

      if (!res?.ok) continue; // ce modèle n'a rien donné, au suivant

      const img = findImage(res.body);
      if (img) {
        sb.from('events').insert({ user_id: user.id, type: 'mirror_try', meta: { model } }).then(() => {}, () => {});
        sb.from('ai_usage').insert({ fn: 'miroir_ia', cost_eur: MIRROR_CALL_COST_EUR * attempts }).then(() => {}, () => {});
        return json({ image: img.data, mimeType: img.mimeType ?? img.mime_type ?? 'image/png' });
      }

      // Pas d'image: on garde la raison réelle (refus de sécurité, texte seul…)
      const parts = res.body?.candidates?.[0]?.content?.parts ?? [];
      lastDetail =
        parts.find((p: GeminiPart) => p.text)?.text ||
        res.body?.candidates?.[0]?.finishReason ||
        res.body?.promptFeedback?.blockReason;
      console.error('miroir-ia: no image from', model, JSON.stringify(res.body).slice(0, 1000));
    }

    // Google a facturé chaque tentative même sans image en retour.
    sb.from('ai_usage').insert({ fn: 'miroir_ia', cost_eur: MIRROR_CALL_COST_EUR * attempts }).then(() => {}, () => {});
    return json(
      { error: 'Aucune image générée — reformulez votre description', detail: lastDetail },
      502
    );
  } catch (e) {
    console.error('miroir-ia exception', e);
    return json({ error: String(e) }, 500);
  }
});
