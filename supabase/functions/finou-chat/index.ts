// Finou Chou — Finjaro's AI shopping assistant (text + vision).
// Accepts { message, image?, context? } and returns { reply, category? }.
// image is a data URL (data:image/...;base64,....). Uses Gemini 2.5 Flash.
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

const SYSTEM_PROMPT = `Tu es Finou Chou, l'assistante shopping de Finjaro, une marketplace de
beauté, mode, parfums et décoration d'événement pour l'Afrique et la diaspora.
Slogan: "Au-delà des rêves". Tu es chaleureuse, concise et utile.
- Réponds dans la langue de l'utilisateur (français ou anglais).
- Si une image est fournie, décris brièvement l'article et aide à le retrouver
  (style, couleur, matière). Ex: "trouve-moi cette robe en bleu" -> conseille.
- Aide à trouver des produits, idées de style, tendances, cadeaux.
- Réponses courtes (2-4 phrases), ton amical, un emoji max.
- Ne promets jamais de prix précis ni de stock: invite à parcourir les boutiques.
- Si l'article correspond clairement à une catégorie Finjaro parmi:
  mode, chaussures, sacs, bijoux, montres, parfums, beaute, cheveux, deco,
  mariages, evenement, mannequinerie, art, accessoires — termine ta réponse par
  une DERNIÈRE ligne exactement au format "CAT: <id>" (sinon n'ajoute pas cette ligne).`;

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

    const { message, image, context } = await req.json();
    if ((!message || typeof message !== 'string') && !image) {
      return new Response(JSON.stringify({ error: 'invalid_message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ctxLine = context && typeof context === 'object'
      ? `\n[Contexte écran: ${JSON.stringify(context).slice(0, 500)}]`
      : '';

    const parts: Array<Record<string, unknown>> = [
      { text: (message || 'Aide-moi avec cette image.') + ctxLine },
    ];
    if (typeof image === 'string' && image.startsWith('data:')) {
      const match = image.match(/^data:(.+?);base64,(.*)$/);
      if (match) parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
    }

    const endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' +
      apiKey;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
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

    // Extract an optional "CAT: <id>" trailing line and map to a real category.
    let category: string | null = null;
    const m = reply.match(/CAT:\s*([a-z]+)\s*$/i);
    if (m && CATEGORIES.includes(m[1].toLowerCase())) {
      category = m[1].toLowerCase();
      reply = reply.replace(/\n?CAT:\s*[a-z]+\s*$/i, '').trim();
    }

    return new Response(JSON.stringify({ reply, category }), {
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
