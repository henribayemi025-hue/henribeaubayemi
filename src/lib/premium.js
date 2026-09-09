// Finia Premium (5 000 FCFA/mois, activation manuelle par Beau).
//
// Même principe que featured.js: seul le client connaît l'heure qu'il est
// au moment où il affiche, `premium_until` seul ne suffit jamais — une date
// passée doit se lire comme "plus premium", pas comme "premium".
export function estPremium(shop) {
  return !!shop?.premium_until && new Date(shop.premium_until) > new Date();
}
