// LES TIRS AU BUT (lot 3.6, E11) : deux appuis. Le premier fixe la visée (une
// jauge va de gauche à droite), le second la puissance (comme au basket). Le
// gardien plonge d'un côté choisi d'avance pour chaque tir (sans hasard caché :
// une suite fixe, différente à chaque tir). Fonctions pures.

export const PERIODE_VISEE = 1.4; // s
export const PERIODE_PUISSANCE = 1.2; // s

const triangle = (s, p) => { const x = (((s % p) + p) % p) / p; return x < 0.5 ? x * 2 : 2 - x * 2; };
// La visée : de -1 (poteau gauche) à +1 (poteau droit).
export const visee = (s) => triangle(s, PERIODE_VISEE) * 2 - 1;
export const puissance = (s) => triangle(s, PERIODE_PUISSANCE);

// Le plongeon du gardien pour le n-ième tir : -1 gauche, 0 reste au centre, 1 droite.
const SUITE = [1, -1, 0, -1, 1, 1, 0, -1, -1, 1, 0, 1];
export const plongeon = (n) => SUITE[((n % SUITE.length) + SUITE.length) % SUITE.length];

// Le tir. Rend { issue: 'but' | 'arret' | 'cote' | 'dessus', x, y } : x, y = où
// le ballon passe la ligne (x de -1 à 1 entre les poteaux, y de 0 à 1 sous la barre).
export function tirerAuBut(v, p, n) {
  const g = plongeon(n);
  const y = Math.min(1.3, 0.15 + p * 0.95);
  if (Math.abs(v) > 0.93) return { issue: 'cote', x: v * 1.15, y, gardien: g };
  if (p > 0.92) return { issue: 'dessus', x: v, y: 1.25, gardien: g };
  if (p < 0.25) return { issue: 'arret', x: v, y, gardien: g }; // trop mou : le gardien a le temps
  const zone = v < -0.33 ? -1 : v > 0.33 ? 1 : 0;
  // Même côté que le plongeon : arrêt, sauf une frappe forte dans la lucarne.
  if (zone === g && !(Math.abs(v) > 0.75 && p > 0.7)) return { issue: 'arret', x: v, y, gardien: g };
  return { issue: 'but', x: v, y, gardien: g };
}

export function compterTirs(s, t) {
  const but = t.issue === 'but';
  return { buts: s.buts + (but ? 1 : 0), tirs: s.tirs + 1, serie: but ? s.serie + 1 : 0, meilleureSerie: Math.max(s.meilleureSerie, but ? s.serie + 1 : 0) };
}
export const tirsVide = () => ({ buts: 0, tirs: 0, serie: 0, meilleureSerie: 0 });
