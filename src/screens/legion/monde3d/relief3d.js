// Le relief des immeubles (Beau, 25/09 : « tout doit être 4D, même les bâtiments ») : les tours
// n'étaient qu'une photo de façade collée sur une boîte. On leur ajoute de vrais volumes, posés
// exactement sur le dessin de la façade : meneaux et bandeaux des tours de verre, balcons et
// garde-corps des résidences, piliers d'angle, équipements sur les toits. Chaque sorte d'élément
// est dessinée en une seule fois (InstancedMesh) : des milliers de pièces pour quelques appels.
import * as THREE from 'three';

// Où tombent les motifs sur chaque façade, mesuré sur les images (voir public/monde3d/facades).
// u : le long de la façade (mètres, depuis le bord de la tuile) ; v : en hauteur depuis le bas.
export const MOTIFS = {
  verre: { tuile: [29.6, 14.4], meneau: { debut: 1.73, pas: 1.85 }, bandeau: { v: 3.27, pas: 3.6, haut: 0.7 } },
  residence: { tuile: [11.9, 6.4], balcons: [2.95, 8.82], largeurBalcon: 4.6, etage: { v: 0.75, pas: 3.2 } },
  beton: { tuile: [19, 10.5] },
};

// Les quatre faces d'une boîte de largeur w (x) et profondeur d (z), telles que BoxGeometry pose
// ses coordonnées u : origine (bord gauche vu de dehors), direction le long, normale.
export function faces(w, d) {
  return [
    { o: [w / 2, d / 2], t: [0, -1], n: [1, 0], larg: d }, // +x
    { o: [-w / 2, -d / 2], t: [0, 1], n: [-1, 0], larg: d }, // -x
    { o: [-w / 2, d / 2], t: [1, 0], n: [0, 1], larg: w }, // +z
    { o: [w / 2, -d / 2], t: [-1, 0], n: [0, -1], larg: w }, // -z
  ];
}

// Positions le long d'une face (0…larg) d'un motif qui revient tous les « pas » mètres à partir
// de « debut » dans la tuile, la tuile étant décalée de du (fraction) comme dans cotesFacade.
export function lelong(larg, tuileU, du, debut, pas, marge = 0.3) {
  const out = [];
  let s = ((debut - du * tuileU) % pas + pas) % pas;
  for (; s <= larg - marge; s += pas) if (s >= marge) out.push(s);
  return out;
}
// Les mêmes positions pour un motif qui ne revient qu'une fois par tuile (les balcons).
export function parTuile(larg, tuileU, du, centres, demi) {
  const out = [];
  for (let k = -1; k * tuileU < larg + tuileU; k += 1) for (const c of centres) { const s = c + k * tuileU - du * tuileU; if (s - demi >= 0.2 && s + demi <= larg - 0.2) out.push(s); }
  return out.sort((a, b) => a - b);
}
export function hauteurs(hc, v0, pas, bas = 1.5, marge = 0.6) {
  const out = [];
  for (let v = v0; v <= hc - marge; v += pas) if (v >= bas) out.push(v);
  return out;
}

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
function poser(liste, x, y, z, rot, sx, sy, sz) { q.setFromAxisAngle(Y, rot); liste.push(m4.compose(p.set(x, y, z), q, sc.set(sx, sy, sz)).clone()); }

// Accumule le relief d'une tour. t : { nom, bx, bz, w, d, hc, base, du, h }
export function reliefTour(acc, t, { mobile = false } = {}) {
  const M = MOTIFS[t.nom];
  const F = faces(t.w, t.d);
  const graine = Math.abs(Math.sin(t.bx * 12.9898 + t.bz * 78.233) * 43758.5453) % 1; // pas de hasard neuf : la ville garde son plan
  // Piliers d'angle, sur toute la hauteur
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) poser(acc.piliers[t.nom] || acc.piliers.beton, t.bx + sx * (t.w / 2 + 0.05), t.base + t.hc / 2, t.bz + sz * (t.d / 2 + 0.05), 0, 0.55, t.hc, 0.55);
  // Toit : groupes de climatisation et château d'eau
  const tw = t.toitW ?? t.w, td = t.toitD ?? t.d, th = (t.toitH ?? t.h) + 0.6;
  const nb = tw > 5 ? 2 + Math.floor(graine * 3) : 0;
  for (let k = 0; k < nb; k += 1) {
    const ox = ((graine * (k + 3) * 7.3) % 1 - 0.5) * (tw - 3), oz = ((graine * (k + 5) * 3.1) % 1 - 0.5) * (td - 3);
    poser(acc.clims, t.bx + ox, th + 0.6, t.bz + oz, (k % 2) * Math.PI / 2, 1.8, 1.2, 1.2);
  }
  if (graine > 0.45 && tw > 7) poser(acc.citernes, t.bx - tw * 0.22, th + 1.6, t.bz + td * 0.2, 0, 1.2, 3.2, 1.2);
  for (const f of F) {
    const rot = Math.atan2(f.n[0], f.n[1]); // la pièce regarde vers dehors
    const pos = (s, v, saillie) => [t.bx + f.o[0] + f.t[0] * s + f.n[0] * saillie, t.base + v, t.bz + f.o[1] + f.t[1] * s + f.n[1] * saillie];
    if (t.nom === 'verre' && !mobile) {
      for (const s of lelong(f.larg, M.tuile[0], t.du, M.meneau.debut, M.meneau.pas)) { const [x, y, z] = pos(s, t.hc / 2, 0.14); poser(acc.meneaux, x, y, z, rot, 0.09, t.hc, 0.28); }
      for (const v of hauteurs(t.hc, M.bandeau.v, M.bandeau.pas, 0.5, 0.4)) { const [x, y, z] = pos(f.larg / 2, v, 0.06); poser(acc.bandeaux, x, y, z, rot, f.larg, M.bandeau.haut, 0.12); }
    }
    if (t.nom === 'residence') {
      const demi = M.largeurBalcon / 2;
      for (const s of parTuile(f.larg, M.tuile[0], t.du, M.balcons, demi)) {
        for (const v of hauteurs(t.hc, M.etage.v, M.etage.pas, 2.5, 1.5)) {
          const [x, y, z] = pos(s, v, 0.45); poser(acc.balcons, x, y, z, rot, M.largeurBalcon, 0.5, 0.9);
          const [gx, gy, gz] = pos(s, v + 0.75, 0.88); poser(acc.gardes, gx, gy, gz, rot, M.largeurBalcon, 1.0, 0.04);
        }
      }
    }
  }
}

export function nouveauRelief() {
  return { piliers: { verre: [], beton: [], residence: [] }, meneaux: [], bandeaux: [], balcons: [], gardes: [], clims: [], citernes: [] };
}

// Les maillages finaux : un par sorte de pièce.
export function construireRelief(acc, { mobile = false, envCiel = null } = {}) {
  const g = new THREE.Group();
  const boite = new THREE.BoxGeometry(1, 1, 1);
  const mats = {
    pilierVerre: new THREE.MeshStandardMaterial({ color: '#2b3038', metalness: 0.7, roughness: 0.35, envMap: envCiel }),
    pilierBeton: new THREE.MeshStandardMaterial({ color: '#d8d0c2', roughness: 0.85 }),
    pilierResidence: new THREE.MeshStandardMaterial({ color: '#f1eee8', roughness: 0.8 }),
    meneau: new THREE.MeshStandardMaterial({ color: '#2f343b', metalness: 0.75, roughness: 0.3, envMap: envCiel }),
    bandeau: new THREE.MeshStandardMaterial({ color: '#343a42', metalness: 0.5, roughness: 0.45, envMap: envCiel }),
    balcon: new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.75 }),
    garde: new THREE.MeshStandardMaterial({ color: '#b9d3dc', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.35, envMap: envCiel, depthWrite: false }),
    clim: new THREE.MeshStandardMaterial({ color: '#9ea3a8', metalness: 0.4, roughness: 0.6 }),
    citerne: new THREE.MeshStandardMaterial({ color: '#7a6a58', roughness: 0.8 }),
  };
  const ajouter = (liste, geo, mat, ombre = false) => {
    if (!liste.length) return;
    const im = new THREE.InstancedMesh(geo, mat, liste.length);
    liste.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true; im.castShadow = ombre && !mobile; im.receiveShadow = !mobile;
    im.userData.garder = true; // la fusion de la ville ne doit pas y toucher
    g.add(im);
  };
  ajouter(acc.piliers.verre, boite, mats.pilierVerre, true);
  ajouter(acc.piliers.beton, boite, mats.pilierBeton, true);
  ajouter(acc.piliers.residence, boite, mats.pilierResidence, true);
  ajouter(acc.meneaux, boite, mats.meneau);
  ajouter(acc.bandeaux, boite, mats.bandeau);
  ajouter(acc.balcons, boite, mats.balcon, true);
  ajouter(acc.gardes, boite, mats.garde);
  ajouter(acc.clims, boite, mats.clim, true);
  ajouter(acc.citernes, new THREE.CylinderGeometry(0.5, 0.5, 1, 12), mats.citerne, true);
  return { groupe: g, mats };
}
