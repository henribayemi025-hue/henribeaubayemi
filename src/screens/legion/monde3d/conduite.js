// Conduire dans la ville (Beau, 25/09 : « j'entre dans une voiture, je peux
// conduire — comme GTA San Andreas »). Le calcul seul, sans dessin, pour le tester.
// Repère : cap = 0 regarde vers +z ; l'avant de la voiture est (sin cap, cos cap).

export const VOITURE = {
  accel: 7.5, // m/s² à plein gaz
  frein: 16, // m/s² en freinant
  arriere: 7, // vitesse maxi en marche arrière (m/s)
  max: 25, // vitesse maxi (m/s) ≈ 90 km/h
  empattement: 2.9,
  braquage: 0.55, // angle maxi des roues (rad)
  demiLong: 2.3,
  rayon: 1.0, // la caisse vue de dessus : deux cercles, à l'avant et à l'arrière
};

const borne = (x, a, b) => Math.max(a, Math.min(b, x));

// Un pas de conduite. entrees : gaz (-1 recule/freine … 1 accélère), volant (-1 gauche … 1 droite), frein à main.
export function piloter(e, { gaz = 0, volant = 0, frein = false } = {}, dt, V = VOITURE) {
  let v = e.vitesse;
  if (frein) v -= Math.sign(v) * Math.min(Math.abs(v), V.frein * 1.3 * dt);
  else if (gaz > 0) v += (v < -0.2 ? V.frein : V.accel * (1 - Math.max(0, v) / (V.max * 1.15))) * gaz * dt;
  else if (gaz < 0) v += (v > 0.2 ? -V.frein : -V.accel * 0.6) * -gaz * dt;
  else v -= Math.sign(v) * Math.min(Math.abs(v), (1.4 + Math.abs(v) * 0.08) * dt); // roue libre
  v = borne(v, -V.arriere, V.max);
  // Moins de braquage à grande vitesse, comme une vraie voiture (et pour ne pas partir en toupie).
  const angle = borne(volant, -1, 1) * V.braquage * (1 - Math.min(0.65, (Math.abs(v) / V.max) * 0.65));
  const cap = e.cap - (v / V.empattement) * Math.tan(angle) * dt;
  return { ...e, vitesse: v, cap, angle, x: e.x + Math.sin(cap) * v * dt, z: e.z + Math.cos(cap) * v * dt };
}

// Les deux cercles de la caisse.
export function cercles(e, V = VOITURE) {
  const d = V.demiLong - V.rayon;
  return [[e.x + Math.sin(e.cap) * d, e.z + Math.cos(e.cap) * d], [e.x - Math.sin(e.cap) * d, e.z - Math.cos(e.cap) * d]];
}

// Les trottoirs (îlots) sont des obstacles : on repousse la voiture et elle perd sa vitesse.
// Rend l'état corrigé et la force du choc (0 si rien touché).
export function heurterBlocs(e, blocs, V = VOITURE) {
  let { x, z, vitesse } = e;
  let choc = 0;
  for (const b of blocs) {
    for (const [cx0, cz0] of cercles({ ...e, x, z }, V)) {
      const px = borne(cx0, b.x0, b.x1), pz = borne(cz0, b.z0, b.z1);
      let dx = cx0 - px, dz = cz0 - pz;
      let d = Math.hypot(dx, dz);
      if (d >= V.rayon) continue;
      if (d < 1e-6) { // centre du cercle dans le bloc : sortir par le côté le plus proche
        const g = cx0 - b.x0, dr = b.x1 - cx0, h = cz0 - b.z0, bas = b.z1 - cz0;
        const m = Math.min(g, dr, h, bas);
        [dx, dz, d] = m === g ? [-1, 0, -g] : m === dr ? [1, 0, -dr] : m === h ? [0, -1, -h] : [0, 1, -bas];
        x += dx * (V.rayon - d); z += dz * (V.rayon - d);
      } else {
        x += (dx / d) * (V.rayon - d); z += (dz / d) * (V.rayon - d);
      }
      choc = Math.max(choc, Math.abs(vitesse));
      vitesse *= -0.25;
    }
  }
  return { ...e, x, z, vitesse, choc };
}

// Les autres véhicules (circulation) : de simples cercles.
export function heurterVehicules(e, autres, V = VOITURE) {
  let { x, z, vitesse } = e;
  let choc = 0;
  for (const o of autres) {
    for (const [cx0, cz0] of cercles({ ...e, x, z }, V)) {
      const dx = cx0 - o.x, dz = cz0 - o.z, d = Math.hypot(dx, dz), min = V.rayon + o.rayon;
      if (d >= min || d < 1e-6) continue;
      x += (dx / d) * (min - d); z += (dz / d) * (min - d);
      choc = Math.max(choc, Math.abs(vitesse));
      vitesse *= -0.2;
    }
  }
  return { ...e, x, z, vitesse, choc };
}

// Où l'on descend : côté conducteur (à gauche), à 1,8 m.
export function portiere(e) {
  return { x: e.x + Math.cos(e.cap) * 1.8, z: e.z - Math.sin(e.cap) * 1.8 };
}

export const kmh = (v) => Math.round(Math.abs(v) * 3.6);
