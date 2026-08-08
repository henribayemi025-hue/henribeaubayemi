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

// Origines autorisées. On teste le HÔTE, pas une liste figée d'URL: le
// domaine de production est finjaro.net, et une liste d'URL figée avait déjà
// bloqué la fonction en production une fois.
// Couvre donc: le domaine et ses sous-domaines, les préversions Cloudflare
// (*.pages.dev / *.workers.dev) et le dev local. Netlify a été retiré: le
// site n'y est plus hébergé, garder son domaine autorisé élargissait la
// surface CORS pour rien.
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
        body: `Finia et Miroir AI sont en pause ce mois-ci (limite ${BUDGET_EUR}€ atteinte).`,
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

    // Consigne par catégorie: OÙ se porte l'article, et surtout où il NE se
    // porte PAS.
    //
    // Cinq catégories qui déclenchent l'essayage n'avaient AUCUNE consigne
    // (mode_femme, mode_homme, enfants_bebe, maroquinerie, bijoux_montres):
    // la table n'en couvrait que 7 sur 12, et le repli était une chaîne vide.
    // Sans consigne, le modèle improvise — un boubou d'homme s'est retrouvé
    // noué sur le crâne, ce qu'un client a signalé à Beau en photo.
    //
    // Les interdits comptent autant que les instructions: dire « habille le
    // buste » ne suffit pas, il faut dire « ne touche NI aux cheveux NI à la
    // tête ». Et la photo de l'article le montre presque toujours seul, à
    // plat ou sur cintre: sans le préciser, le modèle recopie le cintre ou
    // colle l'article comme un autocollant.
    const HANGER_NOTE =
      "La photo de l'article le montre seul (à plat, sur cintre ou sur mannequin): ne reproduis NI le cintre, NI le mannequin, NI le fond — reprends uniquement l'article et fais-le porter naturellement, avec les plis, l'ombre et la perspective du corps.";

    const BODY_PART_HINTS: Record<string, string> = {
      // --- Vêtements: le piège, c'est la tête ---
      mode: `Ce vêtement se porte sur le CORPS. Remplace la tenue actuelle de la personne. Ne touche NI au visage, NI aux cheveux, NI à la coiffure, NI au couvre-chef: la tête doit rester exactement comme sur la photo d'origine. ${HANGER_NOTE}`,
      mode_femme: `Ce vêtement de femme se porte sur le CORPS (buste, taille, jambes selon la pièce). Remplace la tenue actuelle. Ne touche NI au visage, NI aux cheveux, NI à la coiffure: la tête reste identique à la photo d'origine. ${HANGER_NOTE}`,
      mode_homme: `Ce vêtement d'homme se porte sur le CORPS (buste, épaules, taille, jambes selon la pièce). Remplace la tenue actuelle. Ne touche NI au visage, NI à la barbe, NI aux cheveux, NI à la coiffure — et n'ajoute AUCUN couvre-chef, foulard ou turban qui ne serait pas l'article lui-même. ${HANGER_NOTE}`,
      enfants_bebe: `Ce vêtement d'enfant se porte sur le CORPS. Remplace la tenue actuelle en gardant la morphologie de l'enfant. Ne touche NI au visage NI aux cheveux. ${HANGER_NOTE}`,

      // --- Ce qui se porte sur la tête: là, c'est l'inverse ---
      cheveux: `Il s'agit d'une coiffure, d'une perruque, d'un foulard ou d'un couvre-chef: édite UNIQUEMENT la tête et les cheveux. Ne change NI le visage, NI les vêtements, NI le fond. Respecte la forme du crâne et la ligne du front.`,

      // --- Le reste: une partie du corps précise ---
      chaussures: `Les chaussures se portent AUX PIEDS. Édite uniquement les pieds et les chevilles visibles. Ne change ni les vêtements, ni le visage. Si les pieds ne sont pas dans le cadre, montre la personne en pied plutôt que de refuser. ${HANGER_NOTE}`,
      sacs: `Le sac se porte À LA MAIN, à l'épaule ou en bandoulière. Ajoute-le sans modifier la tenue, le visage ni la coiffure. Choisis le port naturel selon le type de sac et la pose de la personne. ${HANGER_NOTE}`,
      maroquinerie: `Cet article de maroquinerie (sac, valise, ceinture, portefeuille) se tient à la main, se porte à l'épaule ou à la taille selon la pièce. Ajoute-le sans modifier la tenue, le visage ni la coiffure. ${HANGER_NOTE}`,
      bijoux: `Le bijou se porte au COU, aux OREILLES, aux POIGNETS ou aux DOIGTS selon la pièce. Édite uniquement la zone concernée qui apparaît sur la photo, à la bonne échelle — un bijou est petit. Ne change ni la tenue, ni le visage, ni la coiffure.`,
      bijoux_montres: `Selon la pièce: un bijou se porte au cou, aux oreilles, aux poignets ou aux doigts; une montre se porte au POIGNET. Édite uniquement la zone concernée visible sur la photo, à la bonne échelle. Ne change ni la tenue, ni le visage, ni la coiffure.`,
      montres: `La montre se porte AU POIGNET, cadran vers l'extérieur, à taille réaliste. Édite uniquement le poignet visible. Ne change ni la tenue, ni le visage.`,
      accessoires: `Détermine d'abord OÙ cet accessoire se porte (tête, cou, poignet, taille, mains...) d'après sa forme sur la photo de l'article, puis édite UNIQUEMENT cette zone. En cas de doute, ne touche ni au visage ni à la coiffure. ${HANGER_NOTE}`,
    };

    const bodyPartHint = BODY_PART_HINTS[category] || '';

    const promptText = productImagePart
      ? `Essayage virtuel photoréaliste.

Voici DEUX images :
- IMAGE 1 : la photo de la personne. C'est elle que tu édites.
- IMAGE 2 : la photo réelle de l'article « ${prompt} » qu'elle doit porter.

OÙ PLACER L'ARTICLE : ${bodyPartHint}

FIDÉLITÉ À L'ARTICLE : reproduis exactement ce que montre l'IMAGE 2 — même couleur, même motif, même matière, même coupe, même longueur. N'invente aucun détail, ne change pas les imprimés.

FIDÉLITÉ À LA PERSONNE : le visage, le teint, la carrure, la pose, les mains, l'arrière-plan et l'éclairage de l'IMAGE 1 restent RIGOUREUSEMENT identiques. Tu ne modifies que la zone décrite ci-dessus.

SI LA ZONE N'EST PAS VISIBLE (par exemple les pieds hors cadre) : élargis le cadrage ou fais au mieux avec ce qui apparaît, mais ne refuse jamais.

SORTIE : tu DOIS renvoyer une image éditée. Ne réponds jamais uniquement par du texte.`
      : `Essayage virtuel photoréaliste : montre la personne de cette photo portant « ${prompt} ».

OÙ PLACER L'ARTICLE : ${bodyPartHint}

FIDÉLITÉ À LA PERSONNE : le visage, le teint, la carrure, la pose, les mains, l'arrière-plan et l'éclairage restent RIGOUREUSEMENT identiques. Tu ne modifies que la zone décrite ci-dessus.

SI LA ZONE N'EST PAS VISIBLE : élargis le cadrage ou fais au mieux avec ce qui apparaît, mais ne refuse jamais.

SORTIE : tu DOIS renvoyer une image éditée. Ne réponds jamais uniquement par du texte.`;

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
