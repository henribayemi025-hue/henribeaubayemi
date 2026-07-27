// Finou Chou — Finjaro's AI shopping assistant (text + vision).
// Accepts { message, image?, context?, history? } and returns { reply,
// category?, action? }. image is a data URL. Uses Gemini 2.5 Flash.
// `history` is the last few turns [{ role: 'user'|'assistant', text }] so
// Gemini actually has conversational memory within the session — previously
// only the current message was sent, so Finou "forgot" everything instantly.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CATEGORIES = [
  'mode', 'chaussures', 'sacs', 'bijoux', 'montres', 'parfums', 'beaute',
  'cheveux', 'deco', 'mariages', 'evenement', 'mannequinerie', 'art', 'accessoires',
];

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
Dans tous les autres cas, n'ajoute aucune de ces lignes.`;

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

    const data = await geminiRes.json();
    let reply =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ??
      "Je n'ai pas bien compris, peux-tu reformuler ? 💫";

    // Extract an optional trailing directive line: either "CAT: <id>" or
    // "ACTION: login|sell" (the prompt asks for at most one).
    let category: string | null = null;
    let action: 'login' | 'sell' | null = null;
    const catMatch = reply.match(/CAT:\s*([a-z]+)\s*$/i);
    if (catMatch && CATEGORIES.includes(catMatch[1].toLowerCase())) {
      category = catMatch[1].toLowerCase();
      reply = reply.replace(/\n?CAT:\s*[a-z]+\s*$/i, '').trim();
    }
    const actionMatch = reply.match(/ACTION:\s*(login|sell)\s*$/i);
    if (actionMatch) {
      action = actionMatch[1].toLowerCase() as 'login' | 'sell';
      reply = reply.replace(/\n?ACTION:\s*(login|sell)\s*$/i, '').trim();
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
