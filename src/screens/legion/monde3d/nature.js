// LE COIN NATURE DE LA CAMPAGNE (Beau, 09/10 : une vidéo d'un monde 3D réaliste,
// forêt, ruisseau, galets, « je veux aussi cette visu »). Un ruisseau sort d'un
// tunnel de pierre au bord de la ville, coule vers l'ouest entre la route et les
// champs, et finit dans une petite mare. Galets dans l'eau, herbe haute sur les
// berges, arbres, roseaux. Ici, la logique pure (testée) : le tracé, la distance
// à l'eau, où poser chaque chose. Le dessin est dans nature3d.js.

// La bande libre entre la clôture de la route (z = 36) et les champs (z = 72).
export const BANDE = { x0: -440, x1: -204, z0: 37.5, z1: 71 };
// Le tunnel d'où sort l'eau (côté ville) et la mare où elle finit.
export const SOURCE = { x: -214, z: 55 };
export const MARE = { x: -432, z: 51.5, r: 8.5 };
const LONGUEUR = SOURCE.x - (MARE.x + 4);

// Un hasard qui redonne toujours la même suite : la campagne garde son plan d'une visite à l'autre.
export function alea(graine = 1) {
  let r = Math.max(1, Math.floor(graine)) % 2147483647;
  return () => { r = (r * 16807) % 2147483647; return (r - 1) / 2147483646; };
}

// L'axe du ruisseau, un point tous les `pas` mètres, de la source vers la mare :
// { x, z, l (demi-largeur), s (distance parcourue depuis la source) }.
export function axeRuisseau(pas = 1.5) {
  const n = Math.max(2, Math.round(LONGUEUR / pas));
  const pts = [];
  let s = 0;
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const x = SOURCE.x - t * LONGUEUR;
    // Des méandres doux, deux ondes qui ne se répètent pas.
    const z = SOURCE.z + (4.5 * Math.sin(t * Math.PI * 2 * 1.6) + 1.5 * Math.sin(t * Math.PI * 2 * 3.7 + 1)) * Math.min(1, t * 6);
    // Étroit à la sortie du tunnel, plus large ensuite, s'évase vers la mare.
    const l = 2.4 + 0.9 * Math.min(1, t * 5) + 0.7 * Math.sin(t * Math.PI * 2 * 2.3 + 0.7) + 2.2 * Math.max(0, (t - 0.9) / 0.1) ** 2;
    if (i > 0) s += Math.hypot(x - pts[i - 1].x, z - pts[i - 1].z);
    pts.push({ x, z, l, s });
  }
  return pts;
}

// Distance d'un point à l'axe (au segment le plus proche), et la demi-largeur de l'eau à cet endroit.
export function distanceAxe(pts, x, z) {
  let best = { d: Infinity, l: 0, i: 0, t: 0 };
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    const d = Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
    if (d < best.d) best = { d, l: a.l + (b.l - a.l) * t, i, t };
  }
  return best;
}

// Dans l'eau (ruisseau ou mare), avec une marge en mètres (positive = un peu au-delà du bord).
export function dansEau(pts, x, z, marge = 0) {
  if (Math.hypot(x - MARE.x, z - MARE.z) < MARE.r + marge) return true;
  const { d, l } = distanceAxe(pts, x, z);
  return d < l + marge;
}

// Le monticule de pierre et de mousse au-dessus du tunnel.
export const BUTTE = { x: -208.5, z: 55, rx: 6.5, rz: 7.5, h: 4.2 };
export const surButte = (x, z, marge = 0) => ((x - BUTTE.x) / (BUTTE.rx + marge)) ** 2 + ((z - BUTTE.z) / (BUTTE.rz + marge)) ** 2 < 1;

const dansBande = (x, z) => x > BANDE.x0 && x < BANDE.x1 && z > BANDE.z0 && z < BANDE.z1;

// Les galets : la plupart dans le lit (à demi immergés), quelques-uns sur la rive.
// Rend [{ x, z, s (rayon), eau (bool) }].
export function placerGalets(pts, n, graine = 7) {
  const r = alea(graine);
  const out = [];
  for (let k = 0; k < n * 4 && out.length < n; k += 1) {
    const p = pts[Math.floor(r() * (pts.length - 1))];
    const q = pts[Math.min(pts.length - 1, pts.indexOf(p) + 1)];
    const ang = Math.atan2(q.z - p.z, q.x - p.x) + Math.PI / 2;
    const eau = r() < 0.72;
    const off = eau ? (r() * 2 - 1) * p.l * 0.9 : (r() < 0.5 ? -1 : 1) * (p.l + 0.2 + r() * 1.6);
    const x = p.x + Math.cos(ang) * off + (r() - 0.5);
    const z = p.z + Math.sin(ang) * off;
    if (!dansBande(x, z) || surButte(x, z, 0.5)) continue;
    const s = eau ? 0.18 + r() ** 1.8 * 0.75 : 0.25 + r() ** 1.5 * 0.9;
    out.push({ x, z, s, eau: dansEau(pts, x, z) });
  }
  return out;
}

// Les gros rochers : sur les berges, quelques-uns dans l'eau, jamais sur le passage du pont.
export function placerRochers(pts, n, graine = 11, pont = null) {
  const r = alea(graine);
  const out = [];
  for (let k = 0; k < n * 6 && out.length < n; k += 1) {
    const i = 4 + Math.floor(r() * (pts.length - 8));
    const p = pts[i], q = pts[i + 1];
    const ang = Math.atan2(q.z - p.z, q.x - p.x) + Math.PI / 2;
    const off = (r() < 0.5 ? -1 : 1) * (p.l * (0.4 + r() * 1.1));
    const x = p.x + Math.cos(ang) * off, z = p.z + Math.sin(ang) * off;
    if (!dansBande(x, z) || surButte(x, z, 1)) continue;
    if (pont && Math.abs(x - pont.x) < 4) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 4)) continue;
    out.push({ x, z, s: 0.9 + r() * 1.4 });
  }
  return out;
}

// Les touffes d'herbe : partout sur les berges, jamais dans l'eau ni sur la butte.
export function placerTouffes(pts, n, graine = 3) {
  const r = alea(graine);
  const out = [];
  for (let k = 0; k < n * 3 && out.length < n; k += 1) {
    const x = BANDE.x0 + r() * (BANDE.x1 - BANDE.x0), z = BANDE.z0 + r() * (BANDE.z1 - BANDE.z0);
    if (dansEau(pts, x, z, 0.25) || surButte(x, z, -0.5)) continue;
    // Plus dense près de l'eau, comme sur la vidéo : l'herbe pousse là où c'est humide.
    const { d, l } = distanceAxe(pts, x, z);
    if (d - l > 9 && r() < 0.85) continue;
    if (d - l > 5 && r() < 0.4) continue;
    out.push({ x, z, s: 0.75 + r() * 0.6, rot: r() * Math.PI * 2 });
  }
  return out;
}

// Les roseaux : au bord de l'eau et autour de la mare.
export function placerRoseaux(pts, n, graine = 5) {
  const r = alea(graine);
  const out = [];
  for (let k = 0; k < n * 4 && out.length < n; k += 1) {
    let x, z;
    if (r() < 0.45) { const a = r() * Math.PI * 2, rr = MARE.r + 0.2 + r() * 1.4; x = MARE.x + Math.cos(a) * rr; z = MARE.z + Math.sin(a) * rr; }
    else { const p = pts[Math.floor(r() * (pts.length - 1))], q = pts[pts.indexOf(p) + 1]; const ang = Math.atan2(q.z - p.z, q.x - p.x) + Math.PI / 2; const off = (r() < 0.5 ? -1 : 1) * (p.l + 0.15 + r() * 0.8); x = p.x + Math.cos(ang) * off; z = p.z + Math.sin(ang) * off; }
    if (!dansBande(x, z) || dansEau(pts, x, z, 0.05) || surButte(x, z)) continue;
    out.push({ x, z, s: 0.9 + r() * 0.7, rot: r() * Math.PI * 2 });
  }
  return out;
}

// Les arbres : le long des berges, à 3–10 m de l'eau, espacés d'au moins 5 m.
export function placerArbres(pts, n, graine = 9, pont = null) {
  const r = alea(graine);
  const out = [];
  for (let k = 0; k < n * 10 && out.length < n; k += 1) {
    const p = pts[2 + Math.floor(r() * (pts.length - 4))], q = pts[pts.indexOf(p) + 1];
    const ang = Math.atan2(q.z - p.z, q.x - p.x) + Math.PI / 2;
    const off = (r() < 0.5 ? -1 : 1) * (p.l + 3 + r() * 7);
    const x = p.x + Math.cos(ang) * off, z = p.z + Math.sin(ang) * off;
    if (!dansBande(x, z) || surButte(x, z, 2) || dansEau(pts, x, z, 2)) continue;
    if (pont && Math.abs(x - pont.x) < 5) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 5)) continue;
    out.push({ x, z, h: 5 + r() * 4, rot: r() * Math.PI * 2 });
  }
  return out;
}

// Où passe le pont de bois : là où le ruisseau croise x = -300.
export function placePont(pts, x = -300) {
  const i = pts.findIndex((p) => p.x <= x);
  const p = pts[Math.max(0, i)];
  return { x: p.x, z: p.z, longueur: 2 * p.l + 3.2 };
}
