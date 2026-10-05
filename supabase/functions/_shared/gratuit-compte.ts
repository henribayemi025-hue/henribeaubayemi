// Le compte des neurones de l'IA gratuite (gratuit.ts) — module PUR, testé
// par vitest avec le reste (gratuit-compte.test.ts).
//
// Neurones par million de jetons [entrée, sortie] — page de prix de Workers
// AI, lue le 05/10/2026. Même liste que MODELES_IA dans src/ia.js.
export const NEURONES: Record<string, [number, number]> = {
  'gemma-4': [9091, 27273],
  'glm-4.7-flash': [5500, 36400],
};
export const SORTIE_MAX = 8192;

export function neurones(alias: string, entree: number, sortie: number): number {
  const p = NEURONES[alias];
  if (!p) return Number.POSITIVE_INFINITY;
  return Math.ceil((Math.max(0, entree) * p[0] + Math.max(0, sortie) * p[1]) / 1_000_000);
}

// Jetons d'entrée, comptés large : 2,5 signes par jeton (le français en fait
// plutôt 3,5 à 4). Mieux vaut réserver trop et rendre que dépasser.
export function jetonsEstimes(corps: Record<string, unknown>): number {
  return Math.ceil((JSON.stringify(corps.messages ?? []).length + JSON.stringify(corps.tools ?? []).length) / 2.5);
}

// Réparer le JSON d'un petit modèle (05/10). Gemma 4 n'a pas de « mode JSON »
// garanti chez Cloudflare, et le disjoncteur rangeait l'IA gratuite pour
// « JSON illisible » — les agents repartaient alors sur OpenAI, payant. Les
// fautes vues sont toujours les mêmes : des balises ```json, un mot avant ou
// après l'objet, de VRAIS retours à la ligne au milieu d'un texte (interdits
// en JSON), une virgule avant } ou ]. On répare ça, et rien d'autre : un
// JSON vraiment cassé reste illisible (rend null).
export function reparerJson(brut: string): unknown {
  const net = String(brut ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(net); } catch { /* on répare */ }
  const debut = net.search(/[[{]/);
  const fin = Math.max(net.lastIndexOf('}'), net.lastIndexOf(']'));
  if (debut < 0 || fin <= debut) return null;
  const morceau = net.slice(debut, fin + 1);
  try { return JSON.parse(morceau); } catch { /* suite */ }
  // Retours à la ligne et tabulations À L'INTÉRIEUR des chaînes → \n, \t.
  let dedans = false, echappe = false, sortie = '';
  for (const c of morceau) {
    if (dedans) {
      if (echappe) { sortie += c; echappe = false; continue; }
      if (c === '\\') { sortie += c; echappe = true; continue; }
      if (c === '"') { dedans = false; sortie += c; continue; }
      if (c === '\n') { sortie += '\\n'; continue; }
      if (c === '\r') continue;
      if (c === '\t') { sortie += '\\t'; continue; }
      sortie += c;
    } else {
      if (c === '"') dedans = true;
      sortie += c;
    }
  }
  const sansVirgule = sortie.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(sansVirgule); } catch { return null; }
}

// Un petit modèle range parfois sa réponse sous un autre nom que celui du
// schéma (« text », « réponse »…) ou l'emballe dans un objet de plus : le
// moteur y lisait un « texte vide » et endormait l'IA gratuite (05/10).
const SYNONYMES: Record<string, string[]> = {
  texte: ['text', 'reponse', 'response', 'message', 'contenu', 'content', 'answer', 'reply'],
};
const norme = (k: string) => k.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const vide = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim());

export function adapterAuSchema(obj: unknown, schema: unknown): unknown {
  const props = (schema as { properties?: Record<string, unknown> } | null)?.properties;
  if (!props || !obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  let o = obj as Record<string, unknown>;
  const attendus = Object.keys(props);
  // { "reponse": { "texte": … } } : on retire l'emballage.
  const cles = Object.keys(o);
  if (!cles.some((k) => attendus.includes(k)) && cles.length === 1 && o[cles[0]] && typeof o[cles[0]] === 'object' && !Array.isArray(o[cles[0]])) {
    o = o[cles[0]] as Record<string, unknown>;
  }
  const r: Record<string, unknown> = { ...o };
  for (const k of attendus) {
    if (!vide(r[k])) continue;
    const candidats = [norme(k), ...(SYNONYMES[k] || [])];
    const trouve = Object.keys(o).find((x) => x !== k && !attendus.includes(x) && candidats.includes(norme(x)) && !vide(o[x]));
    if (trouve) { r[k] = o[trouve]; delete r[trouve]; }
  }
  return r;
}

// Les champs que la réponse DOIT remplir : ceux que le schéma exige, et
// toujours « texte » quand il en a un (c'est ce que l'agent dit).
export function champsManquants(obj: unknown, schema: unknown): string[] {
  const s = schema as { properties?: Record<string, unknown>; required?: string[] } | null;
  if (!s?.properties || !obj || typeof obj !== 'object') return [];
  const exiges = new Set([...(s.required || []), ...('texte' in s.properties ? ['texte'] : [])]);
  return [...exiges].filter((k) => vide((obj as Record<string, unknown>)[k]));
}
