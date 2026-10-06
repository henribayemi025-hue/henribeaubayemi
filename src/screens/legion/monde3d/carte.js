// LA GRANDE CARTE (lot 3.3, E10) : la ville (±200 m) s'ouvre à l'est sur
// l'aéroport et à l'ouest sur la campagne. Chaque quartier a une version légère,
// toujours là (le sol, les routes, les grandes silhouettes), et ses détails
// (avions, arbres, éoliennes, ferme) qui ne se construisent qu'à l'approche et
// se défont quand on s'éloigne : la mémoire du téléphone tient.
// Ici, la logique pure (testée) ; le dessin est dans carte3d.js.

export const QUARTIERS = [
  { id: 'aeroport', x0: 206, x1: 560, z0: -200, z1: 200 },
  { id: 'campagne', x0: -560, x1: -206, z0: -200, z1: 200 },
];

// Jusqu'où l'on peut aller (à pied, en voiture, en hélicoptère).
export const BORNES = { x0: -554, x1: 554, z0: -194, z1: 194 };
export const borner = (x, z) => ({ x: Math.max(BORNES.x0, Math.min(BORNES.x1, x)), z: Math.max(BORNES.z0, Math.min(BORNES.z1, z)) });

// Distance d'un point à un quartier (0 dedans).
export function distanceAuQuartier(q, x, z) {
  const dx = Math.max(q.x0 - x, 0, x - q.x1), dz = Math.max(q.z0 - z, 0, z - q.z1);
  return Math.hypot(dx, dz);
}

// Quels détails construire ou défaire, avec un écart pour ne pas clignoter à la
// frontière : on charge à moins de `pres`, on défait au-delà de `loin`.
export function aCharger(charges, x, z, { pres = 150, loin = 260 } = {}) {
  const charger = [], defaire = [];
  for (const q of QUARTIERS) {
    const d = distanceAuQuartier(q, x, z);
    if (!charges.has(q.id) && d < pres) charger.push(q.id);
    if (charges.has(q.id) && d > loin) defaire.push(q.id);
  }
  return { charger, defaire };
}

// Le quartier où l'on est (null en ville).
export const quartierDe = (x, z) => QUARTIERS.find((q) => distanceAuQuartier(q, x, z) === 0)?.id || null;

// L'avion qui décolle, toutes les PERIODE secondes : il roule sur la piste,
// accélère, quitte le sol au milieu et monte. Rend { z, y, tangage, visible }.
export const PISTE = { x: 440, z0: -175, z1: 175 };
export const PERIODE_AVION = 45;
export function avionAuDecollage(t) {
  const s = ((t % PERIODE_AVION) + PERIODE_AVION) % PERIODE_AVION;
  if (s > 30) return { z: PISTE.z0, y: 0, tangage: 0, visible: false }; // parti : le suivant arrive
  // Roulage accéléré : z = z0 + a t² / 2, a choisie pour décoller à mi-piste vers 14 s.
  const a = 1.6;
  const z = PISTE.z0 + (a * s * s) / 2;
  const decolle = PISTE.z0 + (a * 14 * 14) / 2;
  const y = z > decolle ? (z - decolle) * 0.22 : 0;
  return { z, y, tangage: z > decolle ? Math.min(0.22, (z - decolle) * 0.004) : 0, visible: true };
}
