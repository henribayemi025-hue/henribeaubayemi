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
export function piloter(e, { gaz = 0, volant = 0, frein = false, nitro = false } = {}, dt, V0 = VOITURE) {
  // Nitro : accélération doublée et vitesse maxi relevée, tant que la jauge le permet (géré par le moteur).
  const V = nitro && gaz > 0 ? { ...V0, accel: V0.accel * 2.2, max: V0.max * 1.4 } : V0;
  let v = e.vitesse;
  if (!nitro && v > V0.max) v = Math.max(V0.max, v - 6 * dt); // après la nitro, on redescend doucement
  const haut = nitro && gaz > 0 ? V.max : Math.max(V0.max, v);
  if (frein) v -= Math.sign(v) * Math.min(Math.abs(v), V.frein * 1.3 * dt);
  else if (gaz > 0) v += (v < -0.2 ? V.frein : V.accel * (1 - Math.max(0, v) / (V.max * 1.15))) * gaz * dt;
  else if (gaz < 0) v += (v > 0.2 ? -V.frein : -V.accel * 0.6) * -gaz * dt;
  else v -= Math.sign(v) * Math.min(Math.abs(v), (1.4 + Math.abs(v) * 0.08) * dt); // roue libre
  v = borne(v, -V.arriere, haut);
  // Moins de braquage à grande vitesse, comme une vraie voiture (et pour ne pas partir en toupie).
  const angle = borne(volant, -1, 1) * V.braquage * (1 - Math.min(0.65, (Math.abs(v) / V.max) * 0.65));
  const cap = e.cap - (v / V.empattement) * Math.tan(angle) * dt;
  return { ...e, vitesse: v, cap, angle, x: e.x + Math.sin(cap) * v * dt, z: e.z + Math.cos(cap) * v * dt };
}

// Le bateau : plus lent à répondre, tourne large, pas de frein à main. Même pilotage que la voiture.
export const BATEAU = { accel: 3.5, frein: 5, arriere: 3, max: 14, empattement: 4.5, braquage: 0.6, demiLong: 2.8, rayon: 1.2 };
// Nager : lent, plus lent encore sous l'eau ; l'air dure 25 s.
export const NAGE = { vitesse: 1.15, course: 2.0, plongee: 0.9, air: 25, profondeur: 2.2, surface: -0.62 };

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

// Chrono d'une course : minutes, secondes, dixièmes.
export function chrono(s) {
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
}

// ——— L'hélicoptère (Beau, 25/09 : « prendre un hélicoptère, comme GTA ») ———
// Pilotage simple, façon jeu : avance (-1 recule … 1 avance), lacet (-1 gauche … 1 droite),
// monte (-1 descend … 1 monte). Au sol, il ne glisse pas : il faut d'abord décoller.
export const HELICO = { vitesse: 32, recul: 10, montee: 9, lacet: 1.1, reponse: 1.6, plafond: 160, rayon: 5.2 };

export function voler(e, { avance = 0, lacet = 0, monte = 0 } = {}, dt, H = HELICO) {
  const auSol = e.y <= 0.01;
  const cap = auSol && monte <= 0 ? e.cap : e.cap - borne(lacet, -1, 1) * H.lacet * dt;
  const vise = auSol && monte <= 0 ? 0 : borne(avance, -1, 1) * (avance >= 0 ? H.vitesse : H.recul);
  const k = Math.min(1, H.reponse * dt);
  const vx = e.vx + (Math.sin(cap) * vise - e.vx) * k;
  const vz = e.vz + (Math.cos(cap) * vise - e.vz) * k;
  const vy = e.vy + (borne(monte, -1, 1) * H.montee - e.vy) * Math.min(1, 2.5 * dt);
  let y = e.y + vy * dt;
  y = borne(y, 0, H.plafond);
  const pose = y <= 0.01;
  return {
    ...e, cap, y,
    vx: pose && monte <= 0 ? 0 : vx, vz: pose && monte <= 0 ? 0 : vz, vy: pose ? Math.max(0, vy) : vy,
    x: e.x + (pose && monte <= 0 ? 0 : vx) * dt, z: e.z + (pose && monte <= 0 ? 0 : vz) * dt,
    // Pour le dessin : il pique du nez en avançant et penche dans les virages.
    tangage: borne(avance, -1, 1) * 0.22 * (pose ? 0 : 1), roulis: borne(lacet, -1, 1) * 0.18 * (pose ? 0 : 1),
  };
}

// Les immeubles arrêtent l'hélicoptère tant qu'il vole plus bas que leur toit.
export function heurterTours(e, tours, H = HELICO) {
  let { x, z, vx, vz } = e;
  let choc = 0;
  for (const b of tours) {
    if (e.y > (b.h ?? 0) + 1) continue;
    const px = borne(x, b.x0, b.x1), pz = borne(z, b.z0, b.z1);
    const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
    if (d >= H.rayon) continue;
    if (d < 1e-6) continue; // (au-dessus du toit, posé dessus)
    x += (dx / d) * (H.rayon - d); z += (dz / d) * (H.rayon - d);
    choc = Math.max(choc, Math.hypot(vx, vz));
    vx *= -0.2; vz *= -0.2;
  }
  return { ...e, x, z, vx, vz, choc };
}

// Le circuit des courses (voir course.js) : départ devant l'immeuble, puis à droite à chaque carrefour.
export const CIRCUIT = [
  [6, 27], [-14, 27], [-23, 12], [-23, -12], [-10, -19], [14, -19], [23, -8], [23, 16],
];
// La grille des rues (voir ville3d.js), pour la mini-carte.
export const RUES = { x: [-78, -26, 26, 78], z: [-74, -22, 30, 82], largeur: 12 };
