// Finou Chou — Finjaro's AI shopping assistant (text + vision).
// Accepts { message, image?, context?, history? } and returns { reply,
// category?, action? }. image is a data URL. Uses Gemini 2.5 Flash.
// `history` is the last few turns [{ role: 'user'|'assistant', text }] so
// Gemini actually has conversational memory within the session — previously
// only the current message was sent, so Finou "forgot" everything instantly.
//
// Budget safety net: finou-chat and miroir-ia share one Gemini API key/
// project. To guarantee the monthly bill can never run away (independent of
// whatever alert Google's own billing console sends), every successful call
// logs a conservative cost ESTIMATE to public.ai_usage, and this function
// refuses to call Gemini at all once this month's estimated total reaches
// BUDGET_EUR — replying in-character instead of erroring, so the UI stays
// graceful. Beau gets a one-time push notification per month when it trips.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CATEGORIES = [
  'mode', 'chaussures', 'sacs', 'bijoux', 'montres', 'parfums', 'beaute',
  'cheveux', 'deco', 'mariages', 'evenement', 'mannequinerie', 'art', 'accessoires',
];

const BUDGET_EUR = 20;
const FINOU_CALL_COST_EUR = 0.0008; // conservative estimate for one short Gemini 2.5 Flash text turn
const ADMIN_USER_ID = 'bffb724f-6652-4240-a6f7-6904369a1fd4';

const SYSTEM_PROMPT = `Tu es Finou Chou, l'assistante IA de Finjaro, une marketplace de
beauté, mode, parfums et décoration d'événement pour l'Afrique et la diaspora.
Slogan: "Au-delà des rêves". Tu es chaleureuse, concise et utile.

RÈGLE LA PLUS IMPORTANTE: tu es une assistante généraliste, pas un robot limité au
shopping. Réponds VRAIMENT à toute question qu'on te pose (calcul, culture
générale, conseil, question personnelle, blague...), même sans rapport avec
Finjaro — comme le ferait un assistant IA normal. Ne te contente JAMAIS de te
re-présenter ("Bonjour, je suis Finou Chou...") en guise de réponse: tu t'es déjà
présentée une fois au début de la conversation, ne le refais plus. Si tu ne sais
vraiment pas répondre, dis-le simplement et propose autre chose — ne récite pas
ta présentation.

Ton rôle shopping (en plus, pas à la place):
- Si une image est fournie, décris brièvement l'article et aide à le retrouver
  (style, couleur, matière). Ex: "trouve-moi cette robe en bleu" -> conseille.
- Aide à trouver des produits, idées de style, tendances, cadeaux.
- Ne promets jamais de prix précis ni de stock: invite à parcourir les boutiques.
- Tu as une vraie mémoire de cette conversation (les messages précédents te
  sont fournis) — utilise-la, ne redemande pas une info déjà donnée.
- Si le [Contexte écran] contient "vendorStats", ce sont de VRAIES données de
  vente du vendeur (nombre de commandes et revenu sur 7 et 30 jours). Le champ
  "currency" indique la devise du vendeur (EUR, USD, GBP ou FCFA) — les
  montants sont DÉJÀ convertis dans CETTE devise, n'écris jamais "FCFA" si
  currency dit autre chose, utilise le bon symbole (€, $, £). Utilise CES
  CHIFFRES RÉELS pour répondre à toute question sur ses ventes/revenus/
  chiffre d'affaires. Ne dis JAMAIS "je n'ai pas accès" si ces données sont
  présentes dans le contexte.
- Si le [Contexte écran] contient "shopUrl", c'est le VRAI lien de la boutique
  du vendeur connecté. Si on te demande "quel est le lien de ma boutique",
  "comment je partage ma boutique", "partage ma boutique" ou équivalent, donne
  CE lien exact tel quel — ne l'invente jamais et ne dis pas que tu n'y as pas
  accès — ET termine ta réponse par "ACTION: share_shop" (voir balises plus
  bas) pour proposer un vrai bouton de partage en un tap.

Style: réponds dans la langue de l'utilisateur (français ou anglais), 2-4
phrases, ton amical, un emoji max.

Balises de fin de réponse (au plus UNE, en dernière ligne, sinon aucune):
- Si l'article/la demande correspond clairement à une catégorie Finjaro parmi:
  mode, chaussures, sacs, bijoux, montres, parfums, beaute, cheveux, deco,
  mariages, evenement, mannequinerie, art, accessoires — termine par
  "CAT: <id>".
- Si l'utilisateur exprime clairement l'intention de se connecter/créer un
  compte ("je veux me connecter", "comment je me connecte") — termine par
  "ACTION: login".
- Si l'utilisateur exprime clairement l'intention de vendre/déposer un article/
  devenir vendeur ("je veux vendre", "déposer un article", "devenir vendeur")
  — termine par "ACTION: sell".
- Si l'utilisateur demande le lien de sa boutique ou veut la partager (et que
  shopUrl est présent dans le contexte) — termine par "ACTION: share_shop".
- Si l'utilisateur exprime clairement l'intention de supprimer/retirer un de
  ses articles ("supprime un article", "retire ce produit", "je veux
  supprimer une annonce") — termine par "ACTION: delete_product". Ne
  demande JAMAIS toi-même quel article: le choix se fait ensuite dans une
  liste réelle de ses produits, pas via toi.
Dans tous les autres cas, n'ajoute aucune de ces lignes.`;

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

  // One-time push alert per calendar month, best-effort — never blocks the response.
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'missing_api_key' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, image, context, history } = await req.json();
    if ((!message || typeof message !== 'string') && !image) {
      return new Response(JSON.stringify({ error: 'invalid_message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = admin();
    if (await isOverBudget(sb)) {
      return new Response(
        JSON.stringify({
          reply: "Je fais une petite pause ce mois-ci pour rester dans le budget de Finjaro 🙏 Reviens un peu plus tard, ou parcours les boutiques en attendant !",
          category: null,
          action: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ctxLine = context && typeof context === 'object'
      ? `\n[Contexte écran: ${JSON.stringify(context).slice(0, 800)}]`
      : '';

    const parts: Array<Record<string, unknown>> = [
      { text: (message || 'Aide-moi avec cette image.') + ctxLine },
    ];
    if (typeof image === 'string' && image.startsWith('data:')) {
      const match = image.match(/^data:(.+?);base64,(.*)$/);
      if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
    }

    // Prior turns give Gemini real conversational memory. Keep it short
    // (last 8) to bound latency/cost; text-only (images from earlier turns
    // aren't replayed).
    const contents: Array<Record<string, unknown>> = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        if (!turn?.text || typeof turn.text !== 'string') continue;
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text.slice(0, 1000) }],
        });
      }
    }
    contents.push({ role: 'user', parts });

    const endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
      apiKey;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      }),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error('Gemini error', geminiRes.status, detail);
      return new Response(JSON.stringify({ error: 'gemini_error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Best-effort usage log — never blocks the reply.
    sb.from('ai_usage').insert({ fn: 'finou_chat', cost_eur: FINOU_CALL_COST_EUR }).then(() => {}, () => {});

    const data = await geminiRes.json();
    let reply =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ??
      "Je n'ai pas bien compris, peux-tu reformuler ? 💫";

    // Extract an optional trailing directive line: either "CAT: <id>" or
    // "ACTION: login|sell" (the prompt asks for at most one).
    let category: string | null = null;
    let action: 'login' | 'sell' | 'share_shop' | 'delete_product' | null = null;
    const catMatch = reply.match(/CAT:\s*([a-z]+)\s*$/i);
    if (catMatch && CATEGORIES.includes(catMatch[1].toLowerCase())) {
      category = catMatch[1].toLowerCase();
      reply = reply.replace(/\n?CAT:\s*[a-z]+\s*$/i, '').trim();
    }
    const actionMatch = reply.match(/ACTION:\s*(login|sell|share_shop|delete_product)\s*$/i);
    if (actionMatch) {
      action = actionMatch[1].toLowerCase() as 'login' | 'sell' | 'share_shop' | 'delete_product';
      reply = reply.replace(/\n?ACTION:\s*(login|sell|share_shop|delete_product)\s*$/i, '').trim();
    }

    return new Response(JSON.stringify({ reply, category, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('finou-chat exception', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
