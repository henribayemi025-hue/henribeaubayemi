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

import { gemini } from './cout.ts';

export type Trouvaille = { resume: string; sources: { titre: string; url: string }[] };

// Une question ou une tâche qui demande de regarder dehors.
const BESOIN = /(internet|en ligne|sur le web|cherche|recherche|trouve|trouver|veille|concurren|lanc[ée]|nouveaut|actualit|tendance|événement|evenement|salon |concours|prix pour|appel à|appel a|incubat|accélérat|accelerat|investiss|financement|subvention|partenaire|prospect|entreprises? (à|a) |linkedin|instagram|tiktok|facebook|réseaux|reseaux|influenc|march[ée] |benchmark|compar)/i;
export function aBesoinDuWeb(...textes: (string | null | undefined)[]): boolean {
  return BESOIN.test(textes.filter(Boolean).join(' '));
}

const MODELES = ['gemini-2.5-flash', 'gemini-3.5-flash'];

export async function chercherWeb(apiKey: string, question: string): Promise<Trouvaille | null> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const texte = `Nous sommes le ${aujourdhui}. Fais une recherche sur Internet pour répondre, avec des faits récents et vérifiables, à cette demande d'une équipe d'entreprise:
${question}

Rends un résumé en français de 800 à 2000 signes: les faits trouvés (qui, quoi, quand, où, combien, lien d'inscription ou date limite quand il y en a), du plus utile au moins utile. N'invente rien: ce que tu n'as pas trouvé, dis-le. Pas de préambule.`;
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
      return { resume: resume.slice(0, 3000), sources };
    } catch (e) { console.error(`web ${model}: ${(e as Error).message}`); }
  }
  return null;
}

// Le bloc à glisser dans la consigne d'un agent.
export function blocWeb(t: Trouvaille): string {
  const src = t.sources.length ? `\nSOURCES (cite celles que tu utilises, par leur titre):\n${t.sources.map((s, i) => `[${i + 1}] ${s.titre}`).join('\n')}` : '';
  return `\nRECHERCHE SUR INTERNET FAITE À L'INSTANT pour cette demande (Google, via Gemini) — tu PEUX t'en servir et dire « j'ai cherché »; ne dis pas plus que ce qu'elle contient:\n${t.resume}${src}\n`;
}
