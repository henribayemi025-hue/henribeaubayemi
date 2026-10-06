// LE BASKET (lot 3.6, E11) : un tir au bon moment. Quand on a le ballon, une
// jauge va et vient ; on tire (E ou le bouton) quand elle est dans la zone
// verte. Plus on est loin du panier, plus la zone est petite et plus elle est
// haut. Au-delà de 6,75 m, un panier vaut 3 points. Fonctions pures : le
// moteur (moteur.js) dessine le ballon et le terrain (sport3d.js).

export const PERIODE = 1.6; // s : un aller-retour de la jauge
export const LIGNE_3PTS = 6.75;
export const ANNEAU = 3.05; // m : hauteur du cercle
export const DUREE_VOL = 0.95; // s

// La jauge entre 0 et 1, en triangle : monte, puis redescend.
export function jauge(secondes) {
  const x = ((secondes % PERIODE) + PERIODE) % PERIODE / PERIODE;
  return x < 0.5 ? x * 2 : 2 - x * 2;
}

// La zone verte pour une distance (m) : centrée plus haut quand on est loin,
// et plus étroite. Toujours dans [0, 1].
export function zone(distance) {
  const d = Math.max(0, Math.min(12, distance));
  const centre = 0.45 + d * 0.035; // 0,45 tout près → 0,87 à 12 m
  const largeur = Math.max(0.07, 0.3 - d * 0.02); // 0,30 → 0,07
  return { de: Math.max(0, centre - largeur / 2), a: Math.min(1, centre + largeur / 2), centre };
}

// Le tir. Rend { reussi, points, ecart } ; ecart < 0 : trop court, > 0 : trop long.
export function tirer(valeur, distance) {
  const z = zone(distance);
  const reussi = valeur >= z.de && valeur <= z.a;
  return { reussi, points: reussi ? (distance > LIGNE_3PTS ? 3 : 2) : 0, ecart: reussi ? 0 : valeur < z.de ? valeur - z.de : valeur - z.a };
}

// Le score d'une séance : points, série de paniers d'affilée, meilleure série.
export function compter(score, tir) {
  const serie = tir.reussi ? score.serie + 1 : 0;
  return { points: score.points + tir.points, tirs: score.tirs + 1, reussis: score.reussis + (tir.reussi ? 1 : 0), serie, meilleureSerie: Math.max(score.meilleureSerie, serie) };
}
export const scoreVide = () => ({ points: 0, tirs: 0, reussis: 0, serie: 0, meilleureSerie: 0 });

// La position du ballon à l'instant t (0 → DUREE_VOL) entre le départ et le
// cercle (ou à côté, si raté : ecart dit de combien et de quel côté).
export function ballon(depart, cercle, t, ecart = 0) {
  const k = Math.max(0, Math.min(1, t / DUREE_VOL));
  // Raté : trop court, il tombe avant ; trop long, il passe derrière.
  const decale = ecart ? Math.sign(ecart) * Math.min(1.2, 0.35 + Math.abs(ecart) * 3) : 0;
  const dx = cercle.x - depart.x, dz = cercle.z - depart.z;
  const n = Math.hypot(dx, dz) || 1;
  const cible = { x: cercle.x + (dx / n) * decale, y: cercle.y, z: cercle.z + (dz / n) * decale };
  const haut = Math.max(depart.y, cible.y) + 1.2 + n * 0.12; // la cloche du tir
  // Parabole par trois points : départ (0), sommet (0,5), arrivée (1).
  const y = (1 - k) * (1 - 2 * k) * depart.y + 4 * k * (1 - k) * haut + k * (2 * k - 1) * cible.y;
  return { x: depart.x + (cible.x - depart.x) * k, y, z: depart.z + (cible.z - depart.z) * k };
}
