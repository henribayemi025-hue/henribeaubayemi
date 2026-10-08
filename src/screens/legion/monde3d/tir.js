// TIRER (A8, Beau, 08/10 : « tirer sur les gens en route, la police vient »). Un pistolet
// paralysant : la personne touchée tombe, se relève quelques secondes plus tard, fâchée, et
// s'enfuit ; une voiture touchée s'arrête. Rien de sanglant, et jamais un agent : seuls les
// passants, la circulation et la police sont des cibles.
// Logique pure, testée (tir.test.js) : le moteur dessine le trait et les chutes.
import { viser } from './heros';

export const TIR = {
  portee: 45, // m
  angle: 0.12, // rad : l'aide à la visée autour du centre de l'écran (souris)
  angleTel: 0.24, // rad : plus large au pouce
  cadence: 0.3, // s entre deux coups
  ko: 4.5, // s au sol
  stop: 3.5, // s : une voiture touchée reste arrêtée
};

/**
 * La cible visée : celle qui s'écarte le moins du rayon (o, dir normalisée), à portée, devant,
 * et qu'aucun mur ne cache vu depuis « depuis » (la main du joueur ; par défaut o).
 * cibles : [{ x, y, z, rayon, genre, ref }]. boites : les immeubles { x0, x1, z0, z1, h }.
 * Rend { cible, d } ou null.
 */
export function choisirCible(o, dir, cibles, { portee = TIR.portee, angle = TIR.angle, boites = [], depuis = o } = {}) {
  let m = null;
  for (const c of cibles) {
    const dx = c.x - o.x, dy = c.y - o.y, dz = c.z - o.z;
    const d = Math.hypot(dx, dy, dz);
    if (d < 0.5 || d > portee) continue;
    const cos = (dx * dir.x + dy * dir.y + dz * dir.z) / d;
    if (cos <= 0) continue;
    const ecart = Math.max(0, Math.acos(Math.min(1, cos)) - Math.atan((c.rayon || 0.4) / d));
    if (ecart > angle) continue;
    if (boites.length) {
      const hx = c.x - depuis.x, hy = c.y - depuis.y, hz = c.z - depuis.z, hd = Math.hypot(hx, hy, hz) || 1;
      const mur = viser(depuis, { x: hx / hd, y: hy / hd, z: hz / hd }, boites, hd);
      if (mur && mur.t < hd - 0.6) continue;
    }
    const score = ecart + (d / portee) * 0.02; // à écart égal, la plus proche
    if (!m || score < m.score) m = { cible: c, d, score };
  }
  return m && { cible: m.cible, d: m.d };
}

// Sans cible : là où le coup s'arrête (un mur, le sol, ou la portée).
export function pointImpact(o, dir, boites = [], portee = TIR.portee) {
  let t = portee;
  const mur = boites.length ? viser(o, dir, boites, portee) : null;
  if (mur) t = Math.min(t, mur.t);
  if (dir.y < -1e-3) t = Math.min(t, -o.y / dir.y);
  return { x: o.x + dir.x * t, y: o.y + dir.y * t, z: o.z + dir.z * t, mur: !!mur && mur.t <= t + 1e-6 };
}

// La chute d'une personne touchée : 0 debout … 1 allongée. Tombe en 0,35 s, reste au sol, se relève en 0,6 s.
export function chute(t, duree = TIR.ko) {
  if (t < 0.35) return t / 0.35;
  if (t < duree) return 1;
  return Math.max(0, 1 - (t - duree) / 0.6);
}
