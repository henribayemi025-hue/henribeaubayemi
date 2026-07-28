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

// gemini-2.5-flash-image kept declining real-person edits (finishReason
// STOP, no image, no safety block — just silently text-only) even on
// well-matched photos. 3.1 is built specifically for character/face
// resemblance across edits, which is exactly this feature's use case.
const MODEL = 'gemini-3.1-flash-image';
const DAILY_LIMIT = 5;
const BUDGET_EUR = 20;
const MIRROR_CALL_COST_EUR = 0.02; // conservative estimate — image generation costs more than a text turn
const ADMIN_USER_ID = 'bffb724f-6652-4240-a6f7-6904369a1fd4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });
    }

    const sb = admin();
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count } = await sb
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'mirror_try')
      .gte('created_at', since.toISOString());
    if ((count || 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'daily_limit_reached', limit: DAILY_LIMIT }),
        { status: 429, headers: cors }
      );
    }

    if (await isOverBudget(sb)) {
      return new Response(
        JSON.stringify({ error: 'budget_paused' }),
        { status: 503, headers: cors }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY manquant dans les secrets' }), { status: 500, headers: cors });
    }

    const { selfieBase64, prompt, category, productImageUrl } = await req.json();
    if (!selfieBase64 || !prompt) {
      return new Response(JSON.stringify({ error: 'selfieBase64 et prompt requis' }), { status: 400, headers: cors });
    }

    // The product's own photo — without it Gemini only has the product NAME
    // in text and has nothing to actually render ("I can't visualize
    // '<name>', describe it for me" was the exact refusal this fixes).
    let productImagePart: { inline_data: { mime_type: string; data: string } } | null = null;
    if (productImageUrl) {
      try {
        const imgResp = await fetch(productImageUrl);
        if (imgResp.ok) {
          const buf = await imgResp.arrayBuffer();
          const mimeType = imgResp.headers.get('content-type') || 'image/jpeg';
          let binary = '';
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          productImagePart = { inline_data: { mime_type: mimeType, data: btoa(binary) } };
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

    async function callGemini() {
      const parts: Array<Record<string, unknown>> = [
        { text: promptText },
        { inline_data: { mime_type: 'image/jpeg', data: selfieBase64 } },
      ];
      if (productImagePart) parts.push(productImagePart);
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        }
      );
      const json = await resp.json();
      return { ok: resp.ok, status: resp.status, json };
    }

    let attempts = 1;
    let { ok, status, json: data } = await callGemini();
    if (!ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Erreur Gemini' }), { status, headers: cors });
    }
    let imgPart = data.candidates?.[0]?.content?.parts?.find((p: { inline_data?: unknown }) => p.inline_data);

    // Nano Banana occasionally finishes normally (finishReason: STOP, no
    // safety block) but replies text-only instead of an image — a known
    // model quirk, not a real error. One silent retry recovers most of these.
    if (!imgPart) {
      console.error('miroir-ia: no image part on first try, retrying once', JSON.stringify(data).slice(0, 1000));
      attempts = 2;
      ({ ok, status, json: data } = await callGemini());
      if (!ok) {
        return new Response(JSON.stringify({ error: data.error?.message || 'Erreur Gemini' }), { status, headers: cors });
      }
      imgPart = data.candidates?.[0]?.content?.parts?.find((p: { inline_data?: unknown }) => p.inline_data);
    }

    if (!imgPart) {
      // Log the full response so we can see the REAL reason next time (e.g.
      // a safety-filter refusal or finishReason) instead of guessing blind.
      console.error('miroir-ia: no image part after retry', JSON.stringify(data).slice(0, 2000));
      // Google still billed for both attempts even though neither returned
      // an image — count that against the budget estimate too.
      sb.from('ai_usage').insert({ fn: 'miroir_ia', cost_eur: MIRROR_CALL_COST_EUR * attempts }).then(() => {}, () => {});
      const textPart = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
      const finishReason = data.candidates?.[0]?.finishReason;
      return new Response(
        JSON.stringify({
          error: 'Aucune image générée — reformulez votre description',
          detail: textPart || finishReason || undefined,
        }),
        { status: 502, headers: cors }
      );
    }

    // Best-effort: count this successful generation toward the daily quota
    // and the monthly budget estimate (x2 if the retry above fired, since
    // Google bills for that attempt too even though it returned no image).
    sb.from('events').insert({ user_id: user.id, type: 'mirror_try', meta: {} }).then(() => {}, () => {});
    sb.from('ai_usage').insert({ fn: 'miroir_ia', cost_eur: MIRROR_CALL_COST_EUR * attempts }).then(() => {}, () => {});

    return new Response(
      JSON.stringify({ image: imgPart.inline_data.data, mimeType: imgPart.inline_data.mime_type || 'image/png' }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
