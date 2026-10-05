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
