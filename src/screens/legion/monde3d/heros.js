// LE MODE HÉROS (Beau, 08/10 : « devenir un super-héros, s'envoler sur les bâtiments, survoler la
// ville »). Aucun personnage protégé : notre héros, c'est l'avatar de la personne.
// Logique pure, testée (heros.test.js) ; le moteur l'appelle chaque image.
//
// - Au sol : on court très vite, Espace = super-saut.
// - En l'air : Espace (ou le bouton « Voler ») = on vole. On va là où regarde la caméra,
//   Maj = plus vite ; sans rien toucher, on reste en vol stationnaire.
// - Grappin : on vise un immeuble, la corde s'accroche, on se balance (pendule) en
//   remontant doucement ; on lâche, on garde son élan.
// - Les immeubles sont des boîtes { x0, x1, z0, z1, h } : on se pose sur les toits, on ne
//   traverse pas les murs.

export const HEROS = {
  course: 9.5, saut: 17, gravite: 24, vol: 20, volRapide: 42, accel: 3.2, rayon: 0.35,
  grappinPortee: 95, grappinRemonte: 5, plafond: 260,
};

export function nouveauHeros() {
  return { vol: false, enAir: false, v: { x: 0, y: 0, z: 0 }, grappin: null, sol: 0 };
}

// La hauteur du sol sous un point : la rue (0) ou le toit d'un immeuble si l'on est au-dessus.
export function solSous(x, z, y, boites, r = HEROS.rayon) {
  let s = 0;
  for (const b of boites) {
    if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && y >= b.h - 0.6) s = Math.max(s, b.h);
  }
  return s;
}

// Ne pas traverser les murs : si l'on est dans l'emprise d'un immeuble plus haut que soi, on
// est repoussé par le côté le plus proche.
export function repousser(p, boites, r = HEROS.rayon) {
  for (const b of boites) {
    if (p.y >= b.h - 0.6) continue;
    if (p.x > b.x0 - r && p.x < b.x1 + r && p.z > b.z0 - r && p.z < b.z1 + r) {
      const g = p.x - (b.x0 - r), d = (b.x1 + r) - p.x, h = p.z - (b.z0 - r), bas = (b.z1 + r) - p.z;
      const m = Math.min(g, d, h, bas);
      if (m === g) p.x = b.x0 - r; else if (m === d) p.x = b.x1 + r; else if (m === h) p.z = b.z0 - r; else p.z = b.z1 + r;
    }
  }
  return p;
}

// Où la corde s'accroche : le premier immeuble touché par le rayon (origine o, direction dir
// normalisée), à moins de la portée. Méthode des « tranches » sur chaque boîte.
export function viser(o, dir, boites, portee = HEROS.grappinPortee) {
  let meilleur = null;
  for (const b of boites) {
    let t0 = 0, t1 = portee;
    let ok = true;
    for (const [ax, lo, hi] of [['x', b.x0, b.x1], ['y', 0, b.h], ['z', b.z0, b.z1]]) {
      const d = dir[ax], s = o[ax];
      if (Math.abs(d) < 1e-6) { if (s < lo || s > hi) { ok = false; break; } continue; }
      let ta = (lo - s) / d, tb = (hi - s) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t0 > t1) { ok = false; break; }
    }
    if (ok && t0 > 0.5 && (!meilleur || t0 < meilleur.t)) meilleur = { t: t0, x: o.x + dir.x * t0, y: o.y + dir.y * t0, z: o.z + dir.z * t0, boite: b };
  }
  return meilleur;
}

// L'aide à la visée : si le rayon passe entre deux immeubles (une ruelle), on essaie un peu à
// gauche, à droite et plus haut, et l'on garde le mur le plus proche.
export function viserLarge(o, dir, boites, portee = HEROS.grappinPortee) {
  let meilleur = null;
  for (const dy of [0, 0.2, -0.1, 0.4]) {
    for (const a of [0, 0.12, -0.12, 0.25, -0.25, 0.4, -0.4]) {
      const c = Math.cos(a), sn = Math.sin(a);
      const d = { x: dir.x * c - dir.z * sn, y: dir.y + dy, z: dir.x * sn + dir.z * c };
      const n = Math.hypot(d.x, d.y, d.z) || 1;
      const v = viser(o, { x: d.x / n, y: d.y / n, z: d.z / n }, boites, portee);
      if (v && (!meilleur || v.t < meilleur.t * 0.85)) meilleur = v;
    }
    if (meilleur) break;
  }
  return meilleur;
}

/**
 * Une image de héros. h : l'état (nouveauHeros), p : la position {x,y,z} (modifiée),
 * e : { avant, cote } (joystick ou flèches, -1..1, dans le repère de la caméra), yaw et pitch de
 * la caméra, saute (appui), rapide (Maj), grappin (tenu), boites, bornes { x0, x1, z0, z1 }.
 * Rend { anim, cap } : l'animation à jouer et l'orientation du personnage.
 */
export function avancerHeros(h, p, e, dt, boites, bornes) {
  const H = HEROS;
  const v = h.v;
  dt = Math.min(dt, 1 / 20);
  // Le repère de la caméra : « avant » regarde dans la direction de la caméra.
  const fx = -Math.sin(e.yaw), fz = -Math.cos(e.yaw);
  const rx = Math.cos(e.yaw), rz = -Math.sin(e.yaw);
  const dirX = fx * e.avant + rx * e.cote, dirZ = fz * e.avant + rz * e.cote;
  const n = Math.min(1, Math.hypot(dirX, dirZ));

  // Le grappin : s'accrocher, se balancer, lâcher.
  if (!e.grappin) h.relacher = false; // après un bond sur le toit, il faut relâcher avant de relancer
  if (e.grappin && !h.grappin && e.vise && !h.relacher) {
    // La corde s'accroche haut sur la façade (près du toit) : on monte, puis on bondit sur le toit.
    const b = e.vise.boite;
    const ay = b ? Math.min(b.h - 0.4, Math.max(e.vise.y, p.y + 14)) : e.vise.y;
    h.grappin = { x: e.vise.x, y: ay, z: e.vise.z, L: Math.hypot(p.x - e.vise.x, p.y - ay, p.z - e.vise.z), boite: b || null };
    h.enAir = true; h.vol = false;
    if (v.y < 2) v.y = 2;
  }
  if (!e.grappin && h.grappin) h.grappin = null; // lâché : on garde l'élan

  if (h.grappin) {
    const g = h.grappin;
    v.y -= H.gravite * 0.85 * dt;
    v.x += dirX * 6 * dt; v.z += dirZ * 6 * dt; // on pousse un peu dans le sens voulu
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    g.L = Math.max(2, g.L - H.grappinRemonte * 1.6 * dt); // on remonte la corde
    // En haut de la corde mais pas du mur : on relance le grappin plus haut (on grimpe la façade).
    if (g.boite && g.L <= 2.5 && g.y < g.boite.h - 0.5) {
      g.y = Math.min(g.boite.h - 0.4, g.y + 8);
      g.L = Math.hypot(p.x - g.x, p.y - g.y, p.z - g.z);
    }
    // Arrivé en haut d'un immeuble : un bond par-dessus le rebord, et l'on se pose sur le toit.
    if (g.boite && g.L <= 2.5 && p.y > g.boite.h - 3.5) {
      const cx = (g.boite.x0 + g.boite.x1) / 2, cz = (g.boite.z0 + g.boite.z1) / 2;
      const dx0 = cx - p.x, dz0 = cz - p.z, n0 = Math.hypot(dx0, dz0) || 1;
      v.x = (dx0 / n0) * 6; v.z = (dz0 / n0) * 6; v.y = 14; // assez pour passer le rebord (≈ 4 m)
      h.grappin = null; h.relacher = true;
    }
    const dx = p.x - g.x, dy = p.y - g.y, dz = p.z - g.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    if (h.grappin && d > g.L) { // la corde est tendue : on reste sur la sphère, on garde la vitesse tangente
      const k = g.L / d;
      p.x = g.x + dx * k; p.y = g.y + dy * k; p.z = g.z + dz * k;
      const nx = dx / d, ny = dy / d, nz = dz / d;
      const radial = v.x * nx + v.y * ny + v.z * nz;
      if (radial > 0) { v.x -= radial * nx; v.y -= radial * ny; v.z -= radial * nz; }
    }
  } else if (h.vol) {
    // Le vol : on va vers où regarde la caméra (le tangage aussi : regarder en bas, c'est descendre).
    const vit = e.rapide ? H.volRapide : H.vol;
    // La caméra regarde un peu d'en haut par défaut (tangage ≈ 0,25) : c'est « tout droit ».
    const tang = e.pitch - 0.25;
    const cp = Math.cos(tang), sp = Math.sin(tang);
    const tx = (fx * cp * e.avant + rx * e.cote) * vit, tz = (fz * cp * e.avant + rz * e.cote) * vit;
    const ty = (-sp * e.avant) * vit + (e.saute ? 8 : 0);
    const k = Math.min(1, H.accel * dt);
    v.x += (tx - v.x) * k; v.y += (ty - v.y) * k; v.z += (tz - v.z) * k;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
  } else if (h.enAir) {
    // Un saut : la gravité, un peu de contrôle en l'air.
    v.y -= H.gravite * dt;
    v.x += (dirX * H.course - v.x) * Math.min(1, 1.5 * dt);
    v.z += (dirZ * H.course - v.z) * Math.min(1, 1.5 * dt);
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    if (e.sauteFront) { h.vol = true; v.y = Math.max(v.y, 0); } // deuxième appui en l'air : on vole
  } else {
    // Au sol (rue ou toit) : on court très vite ; Espace = super-saut.
    v.x = dirX * H.course * n; v.z = dirZ * H.course * n; v.y = 0;
    p.x += v.x * dt; p.z += v.z * dt;
    if (e.sauteFront) { v.y = H.saut; h.enAir = true; p.y += v.y * dt; }
  }

  // Les bornes du monde, le plafond, les murs, le sol.
  p.x = Math.max(bornes.x0, Math.min(bornes.x1, p.x));
  p.z = Math.max(bornes.z0, Math.min(bornes.z1, p.z));
  if (p.y > H.plafond) { p.y = H.plafond; v.y = Math.min(v.y, 0); }
  repousser(p, boites);
  const sol = solSous(p.x, p.z, p.y, boites);
  h.sol = sol;
  if (p.y < sol) p.y = sol;
  if (p.y <= sol && v.y <= 0) {
    p.y = sol;
    if (h.grappin) { /* posé en se balançant : on garde la corde */ } else if (h.vol && v.y > -2 && !e.posePossible) { /* vol au ras du sol */ } else { h.enAir = false; h.vol = false; v.y = 0; }
  } else if (!h.vol && !h.grappin && p.y > sol + 0.05) {
    h.enAir = true;
  }

  const vh = Math.hypot(v.x, v.z);
  const anim = h.grappin ? 'course' : h.vol ? (vh > 4 ? 'course' : 'repos') : h.enAir ? 'course' : (n > 0.1 ? 'course' : 'repos');
  const cap = vh > 0.5 ? Math.atan2(v.x, v.z) : null;
  return { anim, cap, vitesse: vh };
}
