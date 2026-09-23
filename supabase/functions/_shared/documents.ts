// LES DOCUMENTS DE L'ENTREPRISE (0179, 23/09).
//
// Découper un document en morceaux, leur donner un vecteur (Gemini,
// 768 dimensions), et retrouver les passages utiles à une question. La leçon
// retenue (Air Canada, docs/LEGION-INTERIM-ETUDE.md) : un agent qui répond
// au nom de l'entreprise ne répond QU'À PARTIR de ses documents, cite sa
// source, et dit quand il ne trouve pas.

import { ajouterCout, gemini } from './cout.ts';

// deno-lint-ignore no-explicit-any
type Service = any;

const MODELE = 'gemini-embedding-001';
// Prix public des vecteurs : environ 0,15 $ le million de jetons (≈ 4 signes
// par jeton), converti en euros comme dans cout.ts.
const EUR_PAR_SIGNE = (0.15 / 1_000_000 / 4) * 0.92;

// Des morceaux d'environ 1 200 signes, coupés sur une fin de phrase ou de
// ligne, avec un peu de recouvrement pour ne pas couper une idée en deux.
export function decouper(texte: string, taille = 1200, recouvrement = 150): string[] {
  const propre = texte.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const morceaux: string[] = [];
  let i = 0;
  while (i < propre.length && morceaux.length < 400) {
    let fin = Math.min(propre.length, i + taille);
    if (fin < propre.length) {
      const coupe = Math.max(propre.lastIndexOf('\n', fin), propre.lastIndexOf('. ', fin));
      if (coupe > i + taille * 0.5) fin = coupe + 1;
    }
    const m = propre.slice(i, fin).trim();
    if (m.length > 20) morceaux.push(m);
    if (fin >= propre.length) break;
    i = Math.max(fin - recouvrement, i + 1);
  }
  return morceaux;
}

// Les vecteurs de plusieurs textes, par paquets de 50.
export async function vecteurs(apiKey: string, textes: string[], tache: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'): Promise<number[][]> {
  const sortie: number[][] = [];
  for (let i = 0; i < textes.length; i += 50) {
    const paquet = textes.slice(i, i + 50);
    const r = await gemini(`https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:batchEmbedContents`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: paquet.map((t) => ({ model: `models/${MODELE}`, content: { parts: [{ text: t.slice(0, 8000) }] }, taskType: tache, outputDimensionality: 768 })) }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!r.ok) throw new Error(`vecteurs: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
    const corps = await r.json();
    const v = (corps?.embeddings || []).map((e: { values: number[] }) => e.values);
    if (v.length !== paquet.length) throw new Error('vecteurs: réponse incomplète');
    sortie.push(...v);
    ajouterCout(paquet.reduce((s, t) => s + Math.min(8000, t.length), 0) * EUR_PAR_SIGNE);
  }
  return sortie;
}

export type Passage = { document_id: string; titre: string; url: string | null; texte: string; distance: number };

// Les passages les plus proches d'une question, dans les documents d'UNE
// entreprise. Rien si elle n'a aucun document lu.
export async function chercherPassages(service: Service, apiKey: string, entrepriseId: string, question: string, n = 5): Promise<Passage[]> {
  const { count } = await service.from('legion_documents').select('id', { count: 'exact', head: true }).eq('entreprise_id', entrepriseId).eq('statut', 'lu');
  if (!count) return [];
  const [v] = await vecteurs(apiKey, [question.slice(0, 4000)], 'RETRIEVAL_QUERY');
  const { data, error } = await service.rpc('legion_chercher_morceaux', { p_entreprise: entrepriseId, p_vecteur: `[${v.join(',')}]`, p_n: n });
  if (error) { console.error('passages:', error.message); return []; }
  // Au-delà de cette distance, le passage ne parle pas vraiment de la question.
  return ((data || []) as Passage[]).filter((p) => p.distance < 0.55);
}

// Le bloc à mettre dans une consigne.
export function blocDocuments(passages: Passage[]): string {
  if (!passages.length) return '';
  return `\nLES DOCUMENTS DE L'ENTREPRISE — les passages trouvés pour ce message. Quand la réponse est dedans, réponds À PARTIR d'eux et cite le titre du document (« d'après « Conditions de vente » … »). Quand elle n'y est pas, dis-le simplement (« je ne trouve pas ça dans nos documents ») au lieu de supposer.\n${passages.map((p, i) => `[${i + 1}] « ${p.titre} » :\n${p.texte}`).join('\n\n')}\n`;
}
