// Finjaro — Vendor Copilot. Generates a short marketing product description
// from the fields the vendor already typed. Body:
// { name, category?, price?, currency?, lang? } -> { description }.
// Reuses the project-level GEMINI_API_KEY (same as finou-chat) so the vendor
// needs no extra key. The result is a *suggestion* the vendor edits/validates
// client-side — never auto-saved.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'missing_api_key' }, 503);

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
    return json({ description });
  } catch (err) {
    console.error('vendor-copilot exception', err);
    return json({ error: 'internal_error' }, 500);
  }
});
