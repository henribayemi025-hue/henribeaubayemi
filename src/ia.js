// L'IA GRATUITE DE CLOUDFLARE (Workers AI) — Beau, 05/10 : « oui branche
// cloudflare gratuit ». Gemini, DeepSeek, Kimi et OpenAI étaient tous à sec
// ou hors quota le même matin, sans argent pour les recharger.
//
// /ia/chat/completions parle comme l'API d'OpenAI (messages, outils), pour
// que les fonctions de Léo et Finia s'en servent comme des autres moteurs
// (supabase/functions/_shared/gratuit.ts). Le modèle tourne chez Cloudflare,
// par le binding AI de ce Worker : aucune clé de fournisseur.
//
// Deux barrières :
// - le jeton : seul le serveur de Finjaro le connaît (app_secret
//   « ia_gratuite », dans le coffre de Supabase). Ici, on ne garde que son
//   empreinte SHA-256 (wrangler.toml), qui ne permet pas de le retrouver.
// - l'argent : le compte est sur l'offre payante Workers, donc Cloudflare
//   facturerait au-delà de 10 000 neurones par jour. Le compteur de la base
//   (ia_gratuite_reserver, migration 0231) réserve chaque appel AVANT qu'il
//   parte, et coupe à 8 000. Ici, en plus, une sortie bornée et une entrée
//   bornée : même un jeton volé ne peut pas lancer un appel démesuré.

// Seulement des modèles ouverts à l'offre gratuite de Cloudflare (liste du
// 28/07/2026) et peu gourmands en neurones.
export const MODELES_IA = {
  'gemma-4': '@cf/google/gemma-4-26b-a4b-it',
  'glm-4.7-flash': '@cf/zai-org/glm-4.7-flash',
};
const MODELE_PAR_DEFAUT = 'gemma-4';
export const SORTIE_MAX = 8192;
// ≈ 60 000 jetons d'entrée : au-delà, l'appel coûterait plus que la marge
// laissée sous le plafond du jour.
export const ENTREE_MAX_SIGNES = 200_000;

const json = (corps, status = 200) => new Response(JSON.stringify(corps), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

async function sha256Hex(texte) {
  const octets = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte)));
  return [...octets].map((o) => o.toString(16).padStart(2, '0')).join('');
}

// Comparaison sans court-circuit (le temps de réponse ne dit rien du jeton).
function egaux(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function jetonValide(request, env) {
  const attendu = String(env?.IA_JETON_SHA256 || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(attendu)) return false;
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get('Authorization') || '');
  if (!m) return false;
  return egaux(await sha256Hex(m[1]), attendu);
}

// Les seuls champs transmis au modèle : le reste (thinking, response_format,
// max_completion_tokens…) vient d'autres fournisseurs et ferait échouer
// l'appel.
export function corpsPourCloudflare(b) {
  const messages = Array.isArray(b?.messages) ? b.messages : null;
  if (!messages || !messages.length) return { erreur: 'messages manquants' };
  if (JSON.stringify(messages).length + JSON.stringify(b.tools ?? []).length > ENTREE_MAX_SIGNES) return { erreur: 'entrée trop longue' };
  const alias = typeof b.model === 'string' && MODELES_IA[b.model] ? b.model : MODELE_PAR_DEFAUT;
  const max = Math.max(1, Math.min(SORTIE_MAX, Number(b.max_tokens ?? b.max_completion_tokens ?? 2048) || 2048));
  const entree = { messages, max_tokens: max };
  // Gemma 4 « réfléchit » avant de répondre, et cette réflexion compte dans
  // la sortie : le 05/10, des livrables d'agents sont sortis coupés ou ont
  // dépassé le délai. Coupée ici : réponse plus courte, plus rapide, moins
  // de neurones dépensés.
  if (alias === 'gemma-4') entree.chat_template_kwargs = { enable_thinking: false };
  if (typeof b.temperature === 'number') entree.temperature = Math.max(0, Math.min(2, b.temperature));
  if (Array.isArray(b.tools) && b.tools.length) {
    entree.tools = b.tools;
    if (b.tool_choice) entree.tool_choice = b.tool_choice;
  }
  return { alias, modele: MODELES_IA[alias], entree };
}

// Selon le modèle, le binding rend déjà la forme d'OpenAI (choices) ou
// l'ancienne forme de Workers AI (response, tool_calls). On rend toujours la
// première.
export function versOpenAI(r, alias) {
  if (r && Array.isArray(r.choices)) return { ...r, model: alias };
  const appels = Array.isArray(r?.tool_calls) ? r.tool_calls.map((t, i) => ({
    id: t.id || `appel_${i}`,
    type: 'function',
    function: {
      name: t.name ?? t.function?.name,
      arguments: typeof (t.arguments ?? t.function?.arguments) === 'string'
        ? (t.arguments ?? t.function?.arguments)
        : JSON.stringify(t.arguments ?? t.function?.arguments ?? {}),
    },
  })) : [];
  const texte = typeof r?.response === 'string' ? r.response : (r?.response == null ? '' : JSON.stringify(r.response));
  return {
    model: alias,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: texte, ...(appels.length ? { tool_calls: appels } : {}) },
      finish_reason: appels.length ? 'tool_calls' : (r?.finish_reason || 'stop'),
    }],
    usage: r?.usage ?? null,
  };
}

export async function servirIa(request, env) {
  if (request.method !== 'POST') return json({ error: { message: 'POST seulement' } }, 405);
  if (!(await jetonValide(request, env))) return json({ error: { message: 'jeton refusé' } }, 401);
  if (!env?.AI) return json({ error: { message: 'binding AI absent' } }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: { message: 'JSON illisible' } }, 400); }
  const c = corpsPourCloudflare(b);
  if (c.erreur) return json({ error: { message: c.erreur } }, 400);
  try {
    const r = await env.AI.run(c.modele, c.entree);
    return json(versOpenAI(r, c.alias));
  } catch (e) {
    const message = String(e?.message || e).slice(0, 300);
    // 3036 : la part gratuite du jour est épuisée chez Cloudflare. 3040 :
    // plus de place sur leurs machines, réessayer plus tard.
    const status = /3036|daily free allocation/i.test(message) ? 402 : /3040|capacity|429/i.test(message) ? 429 : 502;
    return json({ error: { message } }, status);
  }
}
