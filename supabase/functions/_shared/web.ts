// CHERCHER SUR INTERNET — pour les agents qui en ont besoin.
//
// Beau, 23/09: « un agent qui me dit: Henri, tel concurrent a lancé ça, on
// ne l'a pas »; « un agent qui cherche les événements, les prix, les
// concours pour startups où on peut être présents ». Jusqu'ici les agents
// n'avaient AUCUN accès à Internet (et le disaient). Ici: une recherche
// Google faite par Gemini lui-même (« grounding »), qui rend un résumé ET
// ses sources. Les sources sont gardées: un agent cite d'où vient ce qu'il
// dit, et le fondateur peut vérifier.
//
// Coût: une recherche = un appel Flash avec l'outil Google Search, compté
// par cout.ts comme les autres. Google facture la recherche au-delà d'un
// quota gratuit quotidien; on n'en fait qu'une par réponse ou par livrable,
// et seulement quand la question le demande (voir `aBesoinDuWeb`).

import { avecCache } from './cache.ts';
import { gemini } from './cout.ts';

export type Trouvaille = { resume: string; sources: { titre: string; url: string }[]; via?: string };

// Une question ou une tâche qui demande de regarder dehors.
const BESOIN = /(internet|en ligne|sur le web|cherche|recherche|trouve|trouver|veille|concurren|lanc[ée]|nouveaut|actualit|tendance|événement|evenement|salon |concours|prix pour|appel à|appel a|incubat|accélérat|accelerat|investiss|financement|subvention|partenaire|prospect|entreprises? (à|a) |linkedin|instagram|tiktok|facebook|réseaux|reseaux|influenc|march[ée] |benchmark|compar)/i;
export function aBesoinDuWeb(...textes: (string | null | undefined)[]): boolean {
  return BESOIN.test(textes.filter(Boolean).join(' '));
}

const MODELES = ['gemini-2.5-flash', 'gemini-3.5-flash'];

// La même question dans les 12 heures : la même trouvaille, sans repayer (0190).
export function chercherWeb(apiKey: string, question: string): Promise<Trouvaille | null> {
  return avecCache('web', question, 12 * 3_600_000, () => chercherWebSansCache(apiKey, question));
}

async function chercherWebSansCache(apiKey: string, question: string): Promise<Trouvaille | null> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const texte = `Nous sommes le ${aujourdhui}. Une équipe d'entreprise a besoin de FAITS EXTÉRIEURS pour cette demande:
${question}

Cherche sur Internet ce qui se passe DEHORS: événements, concours, prix, financements, concurrents et leurs lancements, entreprises à démarcher, tendances, chiffres publics. Ne résume PAS la demande elle-même.
Rends en français, 800 à 2000 signes, les faits trouvés (qui, quoi, quand, où, combien, lien d'inscription ou date limite quand il y en a), du plus utile au moins utile. N'invente rien: ce que tu n'as pas trouvé, dis-le. Pas de préambule.`;
  for (const model of MODELES) {
    try {
      const resp = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: texte }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(40_000),
      });
      if (!resp.ok) { console.error(`web ${model}: HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`); continue; }
      const body = await resp.json();
      const cand = body?.candidates?.[0];
      const resume = (cand?.content?.parts || []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('').trim();
      const chunks = cand?.groundingMetadata?.groundingChunks || [];
      const vus = new Set<string>();
      const sources = chunks
        .map((c: { web?: { uri?: string; title?: string } }) => ({ titre: String(c.web?.title || ''), url: String(c.web?.uri || '') }))
        .filter((s: { url: string }) => s.url && !vus.has(s.url) && vus.add(s.url))
        .slice(0, 8);
      if (resume.length < 40) { console.error(`web ${model}: résumé vide`); continue; }
      // Sans source, ce n'est pas une recherche: c'est le modèle qui parle de
      // mémoire (vu le 23/09: il avait résumé la demande). On ne le fait pas
      // passer pour « j'ai cherché ».
      if (!sources.length) { console.error(`web ${model}: aucune source — ignoré`); return null; }
      return { resume: resume.slice(0, 3000), sources };
    } catch (e) { console.error(`web ${model}: ${(e as Error).message}`); }
  }
  // Le relais quand Google ne répond pas (proposition 3 de Beau, 24/09 :
  // « ne plus jamais dépendre de Google seul ») : Tavily, puis Brave, si
  // leur clé est posée. Ils rendent des extraits de pages avec leurs liens.
  return await parTavily(question) || await parBrave(question);
}

const courte = (q: string) => q.replace(/\s+/g, ' ').trim().slice(0, 380);

async function parTavily(question: string): Promise<Trouvaille | null> {
  const cle = Deno.env.get('TAVILY_API_KEY');
  if (!cle) return null;
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
      body: JSON.stringify({ api_key: cle, query: courte(question), search_depth: 'basic', include_answer: true, max_results: 6 }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) { console.error(`web tavily: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); return null; }
    const b = await r.json();
    const res = (b?.results || []) as Array<{ title?: string; url?: string; content?: string }>;
    const sources = res.filter((x) => x.url).slice(0, 8).map((x) => ({ titre: String(x.title || x.url), url: String(x.url) }));
    if (!sources.length) return null;
    const resume = [b?.answer ? String(b.answer) : '', ...res.map((x, i) => `[${i + 1}] ${String(x.content || '').slice(0, 400)}`)].filter(Boolean).join('\n').slice(0, 3000);
    return { resume, sources, via: 'Tavily' };
  } catch (e) { console.error(`web tavily: ${(e as Error).message}`); return null; }
}

async function parBrave(question: string): Promise<Trouvaille | null> {
  const cle = Deno.env.get('BRAVE_API_KEY');
  if (!cle) return null;
  try {
    const r = await fetch(`https://api.search.brave.com/res/v1/web/search?count=6&q=${encodeURIComponent(courte(question))}`, {
      headers: { Accept: 'application/json', 'X-Subscription-Token': cle }, signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) { console.error(`web brave: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); return null; }
    const b = await r.json();
    const res = (b?.web?.results || []) as Array<{ title?: string; url?: string; description?: string }>;
    const sources = res.filter((x) => x.url).slice(0, 8).map((x) => ({ titre: String(x.title || x.url), url: String(x.url) }));
    if (!sources.length) return null;
    const resume = res.map((x, i) => `[${i + 1}] ${String(x.title || '')} — ${String(x.description || '').replace(/<[^>]+>/g, '')}`).join('\n').slice(0, 3000);
    return { resume, sources, via: 'Brave' };
  } catch (e) { console.error(`web brave: ${(e as Error).message}`); return null; }
}

// Le bloc à glisser dans la consigne d'un agent.
export function blocWeb(t: Trouvaille): string {
  const src = t.sources.length ? `\nSOURCES (cite celles que tu utilises, par leur titre):\n${t.sources.map((s, i) => `[${i + 1}] ${s.titre}`).join('\n')}` : '';
  return `\nRECHERCHE SUR INTERNET FAITE À L'INSTANT pour cette demande (${t.via || 'Google, via Gemini'}) — tu PEUX t'en servir et dire « j'ai cherché »; ne dis pas plus que ce qu'elle contient:\n${t.resume}${src}\n`;
}
