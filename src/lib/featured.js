// La mise en avant gagnée par parrainage.
//
// Beau: « le parrainage c'est pas genre argent, c'est genre bonus
// visibilité ». La récompense est donc une place devant, pendant sept jours
// par filleule qui ouvre sa boutique.
//
// La base trie sur `featured_until` brut, ce qui ferait aussi remonter une
// mise en avant PÉRIMÉE. Seul le client connaît l'heure qu'il est au moment
// où il affiche: c'est ici qu'on compare.
export function estEnAvant(shop) {
  return !!shop?.featured_until && new Date(shop.featured_until) > new Date();
}

// À utiliser en PREMIER critère de tri, avant tous les autres: les boutiques
// en avant d'abord, le reste ensuite dans son ordre habituel.
export function avantDabord(a, b) {
  const ea = estEnAvant(a);
  const eb = estEnAvant(b);
  if (ea !== eb) return ea ? -1 : 1;
  return 0;
}
