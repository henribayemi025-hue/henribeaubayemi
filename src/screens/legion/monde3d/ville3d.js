// La ville autour de l'immeuble (Beau, 25/09 : « voitures, motos, passants,
// restaurants, une ville comme Tokyo »). Tout est construit ici, sans modèle
// payant : rues, trottoirs, passages piétons, tours en mur-rideau qui
// reflètent le vrai ciel, boutiques et restaurants avec leurs enseignes,
// lampadaires, voitures et motos qui circulent, passants.
// C'est le décor de la ville : aucune de ces personnes n'est un agent.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const ROUTES_X = [-78, -26, 26, 78];
const ROUTES_Z = [-74, -22, 30, 82];
const LARGEUR_ROUTE = 12;
const TROTTOIR = 4.5;
const ENSEIGNES = ['CAFÉ', 'RAMEN', 'SUSHI', 'BOULANGERIE', 'PHARMACIE', 'RESTAURANT', 'MARCHÉ', 'LIBRAIRIE', 'PIZZA', 'THÉ', 'GRILL', 'FLEURS', 'BANQUE', 'CINÉMA', 'KARAOKÉ', 'NOODLES'];
const PEINTURES = ['#f2f2f0', '#141518', '#9aa0a6', '#7b1e1e', '#1d3a6b', '#e8c11c', '#2f4f3a', '#c8c3b8', '#5a5f66', '#0f2a44'];

function alea(graine) {
  let s = graine >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function canvasTex(l, h, dessiner, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = l; c.height = h;
  dessiner(c.getContext('2d'), l, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Mur-rideau : panneaux de verre, montants, un peu de variation d'un vitrage à l'autre.
function texturesFacade(r, teinte, petit = false) {
  const cols = 8, rangs = 16;
  const L = petit ? 256 : 512, H = petit ? 512 : 1024;
  const couleur = canvasTex(L, H, (x, w, h) => {
    const pw = w / cols, ph = h / rangs;
    for (let i = 0; i < cols; i += 1) for (let j = 0; j < rangs; j += 1) {
      const v = 0.85 + r() * 0.3;
      const c = new THREE.Color(teinte).multiplyScalar(v);
      x.fillStyle = `#${c.getHexString()}`;
      x.fillRect(i * pw, j * ph, pw, ph);
      if (r() < 0.25) { x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(i * pw, j * ph, pw, ph * 0.5); }
    }
    x.fillStyle = '#2b2f35';
    for (let i = 0; i <= cols; i += 1) x.fillRect(i * pw - 3, 0, 6, h);
    for (let j = 0; j <= rangs; j += 1) x.fillRect(0, j * ph - 5, w, 10);
  });
  const rugosite = petit ? null : canvasTex(L, H, (x, w, h) => {
    x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, w, h);
    const pw = w / cols, ph = h / rangs;
    x.fillStyle = '#b0b0b0';
    for (let i = 0; i <= cols; i += 1) x.fillRect(i * pw - 3, 0, 6, h);
    for (let j = 0; j <= rangs; j += 1) x.fillRect(0, j * ph - 5, w, 10);
  }, { srgb: false });
  const fenetres = canvasTex(L, H, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    const pw = w / cols, ph = h / rangs;
    for (let i = 0; i < cols; i += 1) for (let j = 0; j < rangs; j += 1) {
      if (r() < 0.42) { x.fillStyle = r() < 0.7 ? '#ffe0a8' : '#dff0ff'; x.fillRect(i * pw + 6, j * ph + 8, pw - 12, ph - 16); }
    }
  });
  return { couleur, rugosite, fenetres };
}

const CACHE_ENSEIGNES = new Map();
function enseigne(texte, couleur = '#ff4d6d', vertical = false) {
  const cle = `${texte}|${couleur}|${vertical}`;
  if (!CACHE_ENSEIGNES.has(cle)) CACHE_ENSEIGNES.set(cle, dessinerEnseigne(texte, couleur, vertical));
  return CACHE_ENSEIGNES.get(cle);
}
function dessinerEnseigne(texte, couleur, vertical) {
  const l = vertical ? 128 : 512, h = vertical ? 512 : 128;
  return canvasTex(l, h, (x, w, hh) => {
    x.fillStyle = '#0a0a0c'; x.fillRect(0, 0, w, hh);
    x.strokeStyle = couleur; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, hh - 12);
    x.fillStyle = couleur;
    x.shadowColor = couleur; x.shadowBlur = 18;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (vertical) {
      x.font = 'bold 64px system-ui';
      const lettres = texte.slice(0, 8).split('');
      x.font = `bold ${lettres.length > 6 ? 50 : 64}px system-ui`;
      lettres.forEach((c, i) => x.fillText(c, w / 2, 60 + i * (hh - 100) / Math.max(1, lettres.length - 1)));
    } else {
      x.font = `bold ${texte.length > 9 ? 58 : 72}px system-ui`;
      x.fillText(texte, w / 2, hh / 2 + 4);
    }
  });
}

// Une vitrine : l'intérieur éclairé d'une boutique, vu à travers le verre.
const VITRINES = [];
function texVitrine(r) {
  if (VITRINES.length < 6) VITRINES.push(dessinerVitrine(r, VITRINES.length));
  return VITRINES[Math.floor(r() * VITRINES.length)];
}
function dessinerVitrine(r, k) {
  const chaud = k % 3 !== 2;
  const face = 9;
  return canvasTex(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, chaud ? '#3a2a1c' : '#1f2a33'); g.addColorStop(0.5, chaud ? '#8a6a44' : '#5d7383'); g.addColorStop(1, '#2a2522');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i += 1) { x.fillStyle = `rgba(255,${chaud ? 220 : 240},${chaud ? 170 : 255},${0.25 + r() * 0.3})`; x.fillRect(20 + i * 55, 20, 26, 10); }
    for (let i = 0; i < 6; i += 1) { x.fillStyle = `rgba(20,16,12,${0.5 + r() * 0.3})`; x.fillRect(10 + r() * (w - 80), h * 0.45 + r() * 30, 50 + r() * 60, h * 0.4); }
    x.fillStyle = '#15171a';
    const n = Math.max(2, Math.round(face / 3));
    for (let i = 0; i <= n; i += 1) x.fillRect((i * w) / n - 4, 0, 8, h);
    x.fillRect(0, 0, w, 8); x.fillRect(0, h - 10, w, 10);
  });
}

// ——— Véhicules ———
function voiture(peinture) {
  const g = new THREE.Group();
  const carrosserie = new THREE.MeshStandardMaterial({ color: peinture, metalness: 0.6, roughness: 0.28 });
  const vitre = new THREE.MeshStandardMaterial({ color: '#0d1116', metalness: 0.3, roughness: 0.06 });
  const noir = new THREE.MeshStandardMaterial({ color: '#111214', roughness: 0.85 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#c9ccd1', metalness: 1, roughness: 0.25 });
  // Profil latéral : capot, pare-brise, toit, lunette, coffre.
  const s = new THREE.Shape();
  s.moveTo(-2.25, 0.32); s.lineTo(-2.3, 0.72); s.quadraticCurveTo(-2.2, 0.86, -1.7, 0.9);
  s.lineTo(-0.9, 0.95); s.quadraticCurveTo(-0.45, 1.38, 0.15, 1.42); s.lineTo(0.9, 1.4);
  s.quadraticCurveTo(1.45, 1.32, 1.85, 0.98); s.lineTo(2.25, 0.9); s.quadraticCurveTo(2.35, 0.7, 2.3, 0.32); s.closePath();
  const corps = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 10 }), carrosserie);
  corps.geometry.scale(-1, 1, 1); corps.geometry.computeVertexNormals(); corps.material.side = THREE.DoubleSide;
  corps.position.z = -0.85;
  g.add(corps);
  const v = new THREE.Shape();
  v.moveTo(-0.78, 1.0); v.quadraticCurveTo(-0.4, 1.33, 0.15, 1.36); v.lineTo(0.88, 1.34); v.quadraticCurveTo(1.35, 1.27, 1.7, 1.0); v.closePath();
  const vitres = new THREE.Mesh(new THREE.ExtrudeGeometry(v, { depth: 1.74, bevelEnabled: false }), vitre);
  vitres.geometry.scale(-1, 1, 1); vitres.geometry.computeVertexNormals(); vitres.material.side = THREE.DoubleSide;
  vitres.position.z = -0.87;
  g.add(vitres);
  const roue = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 20);
  const jante = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 12);
  g.userData.roues = [];
  for (const [x, z] of [[-1.45, 0.83], [-1.45, -0.83], [1.42, 0.83], [1.42, -0.83]]) {
    const r = new THREE.Group();
    const p = new THREE.Mesh(roue, noir); p.rotation.x = Math.PI / 2; r.add(p);
    const j = new THREE.Mesh(jante, chrome); j.rotation.x = Math.PI / 2; r.add(j);
    r.position.set(x, 0.34, z);
    g.add(r);
    g.userData.roues.push(r);
  }
  const phare = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4d6', emissiveIntensity: 0 });
  const feu = new THREE.MeshStandardMaterial({ color: '#6a0000', emissive: '#ff2a2a', emissiveIntensity: 0 });
  for (const z of [-0.6, 0.6]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.34), phare); a.position.set(2.33, 0.72, z); g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.36), feu); b.position.set(-2.33, 0.76, z); g.add(b);
  }
  g.userData.lumieres = [phare, feu];
  g.userData.roues = [];
  fusionner(g);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
  return g;
}

function moto(peinture) {
  const g = new THREE.Group();
  const carrosserie = new THREE.MeshStandardMaterial({ color: peinture, metalness: 0.6, roughness: 0.3 });
  const noir = new THREE.MeshStandardMaterial({ color: '#101112', roughness: 0.8 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#cfd3d8', metalness: 1, roughness: 0.2 });
  const roue = new THREE.TorusGeometry(0.3, 0.09, 10, 24);
  g.userData.roues = [];
  for (const x of [-0.72, 0.72]) {
    const r = new THREE.Mesh(roue, noir); r.position.set(x, 0.39, 0); g.add(r); g.userData.roues.push(r);
  }
  const reservoir = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 6, 12), carrosserie); reservoir.rotation.z = Math.PI / 2 - 0.15; reservoir.position.set(0.12, 0.82, 0); g.add(reservoir);
  const selle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.28), noir); selle.position.set(-0.35, 0.86, 0); g.add(selle);
  const moteur = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.3), chrome); moteur.position.set(0, 0.5, 0); g.add(moteur);
  const fourche = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75), chrome); fourche.rotation.z = 0.35; fourche.position.set(0.6, 0.72, 0); g.add(fourche);
  const guidon = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7), noir); guidon.rotation.x = Math.PI / 2; guidon.position.set(0.5, 1.08, 0); g.add(guidon);
  const phare = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4d6', emissiveIntensity: 0 });
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), phare); p.position.set(0.72, 0.98, 0); g.add(p);
  g.userData.lumieres = [phare];
  // Le pilote : casque et silhouette simples, vus de loin.
  const cuir = new THREE.MeshStandardMaterial({ color: '#1c1d20', roughness: 0.7 });
  const torse = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 10), cuir); torse.rotation.z = -0.45; torse.position.set(-0.12, 1.28, 0); g.add(torse);
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), carrosserie); casque.position.set(0.05, 1.68, 0); g.add(casque);
  for (const z of [-0.15, 0.15]) { const jambe = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 8), cuir); jambe.rotation.z = 1.1; jambe.position.set(-0.15, 0.85, z); g.add(jambe); }
  g.userData.roues = [];
  fusionner(g);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return g;
}

// Tout ce qui ne bouge pas est fusionné par matière : quelques dizaines
// d'appels de dessin au lieu de plusieurs centaines (Beau : « ça rame »).
function fusionner(racine) {
  racine.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(racine.matrixWorld).invert();
  const parMat = new Map();
  const aRetirer = [];
  const tous = [];
  racine.traverse((o) => { if (o !== racine && o.isMesh && !o.isSkinnedMesh && !o.userData.garder && !o.parent?.userData?.marche && o.parent?.userData?.voie === undefined) tous.push(o); });
  for (const o of tous) {
    if (o.parent !== racine && o.parent?.parent !== racine) continue;
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.garder) continue;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv || !g.attributes.normal) continue;
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!parMat.has(o.material)) parMat.set(o.material, { geos: [], ombre: false });
    const e = parMat.get(o.material);
    e.geos.push(g); e.ombre = e.ombre || o.castShadow;
    aRetirer.push(o);
  }
  for (const o of aRetirer) o.parent.remove(o);
  for (const [mat, e] of parMat) {
    const g = mergeGeometries(e.geos, false);
    if (!g) continue;
    const m = new THREE.Mesh(g, mat);
    m.castShadow = e.ombre; m.receiveShadow = true;
    racine.add(m);
  }
}

// ——— La ville ———
export function construireVille(monde, groupe, { sol = 0, envCiel = null, graine = 7 } = {}) {
  const r = alea(graine);
  const racine = new THREE.Group();
  racine.position.y = sol;
  groupe.add(racine);
  const bouger = [];
  const nuit = { lumieres: [], fenetres: [], enseignes: [] };

  // Chaussée et marquages
  const asphalte = monde.matiere('clean_asphalt', 60);
  const chaussee = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), asphalte);
  chaussee.rotation.x = -Math.PI / 2; chaussee.position.y = -0.03; chaussee.receiveShadow = true;
  racine.add(chaussee);
  const ligne = new THREE.MeshBasicMaterial({ color: '#e8e4d8' });
  const traits = [];
  for (const x of ROUTES_X) for (let z = -200; z < 200; z += 6) { if (!ROUTES_Z.some((rz) => Math.abs(z - rz) < 8)) traits.push([x, z, 0.15, 3]); }
  for (const z of ROUTES_Z) for (let x = -200; x < 200; x += 6) { if (!ROUTES_X.some((rx) => Math.abs(x - rx) < 8)) traits.push([x, z, 3, 0.15]); }
  for (const x of [-26, 26]) for (const z of [-22, 30]) for (let k = -5; k <= 5; k += 1) { traits.push([x + k, z - 8.5, 0.5, 3.2]); traits.push([x - 8.5, z + k, 3.2, 0.5]); }
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), ligne, traits.length);
  const mat4 = new THREE.Matrix4();
  traits.forEach(([x, z, l, p], i) => im.setMatrixAt(i, mat4.compose(new THREE.Vector3(x, 0.002, z), new THREE.Quaternion(), new THREE.Vector3(l, 1, p))));
  racine.add(im);

  // Îlots : trottoirs + bâtiments
  const trottoir = monde.matiere('concrete_pavement', 8);
  const ilots = [];
  const xs = [-200, ...ROUTES_X, 200], zs = [-200, ...ROUTES_Z, 200];
  for (let i = 0; i < xs.length - 1; i += 1) for (let j = 0; j < zs.length - 1; j += 1) {
    const x0 = xs[i] + (i === 0 ? 0 : LARGEUR_ROUTE / 2), x1 = xs[i + 1] - (i + 1 === xs.length - 1 ? 0 : LARGEUR_ROUTE / 2);
    const z0 = zs[j] + (j === 0 ? 0 : LARGEUR_ROUTE / 2), z1 = zs[j + 1] - (j + 1 === zs.length - 1 ? 0 : LARGEUR_ROUTE / 2);
    ilots.push({ x0, x1, z0, z1, centre: i === 2 && j === 2 });
  }
  const facades = (monde.mobile ? ['#7f93a6', '#9fb0bd', '#a39787'] : ['#7f93a6', '#8d9aa3', '#5f7386', '#9fb0bd', '#6b7d74', '#a39787', '#4f5d6e']).map((c) => texturesFacade(r, c, monde.mobile));
  const beton = monde.matiere('concrete_tile_facade', 3);
  for (const il of ilots) {
    const l = il.x1 - il.x0, p = il.z1 - il.z0;
    const dalle = new THREE.Mesh(new THREE.BoxGeometry(l, 0.18, p), trottoir);
    // Notre îlot : son trottoir affleure le sol du hall (0), les autres sont en bordure (+18 cm).
    dalle.position.set((il.x0 + il.x1) / 2, il.centre ? -0.11 : 0.09, (il.z0 + il.z1) / 2); dalle.receiveShadow = true;
    racine.add(dalle);
    if (il.centre) continue; // notre immeuble
    // 1 à 4 tours par îlot, rez-de-chaussée en boutiques
    const n = l > 60 || p > 60 ? 2 : 1 + Math.floor(r() * 3);
    const lx = (l - TROTTOIR * 2) / (n > 2 ? 2 : n), lz = (p - TROTTOIR * 2) / (n > 2 ? 2 : 1);
    for (let k = 0; k < Math.min(n, 4); k += 1) {
      const bx = il.x0 + TROTTOIR + (k % 2) * lx + lx / 2, bz = il.z0 + TROTTOIR + (n > 2 ? Math.floor(k / 2) : 0) * lz + lz / 2;
      const dist = Math.hypot(bx, bz);
      const h = 18 + r() * (dist < 90 ? 70 : 130);
      const w = lx - 2, d = lz - 2;
      const f = facades[Math.floor(r() * facades.length)];
      const mat = new THREE.MeshStandardMaterial({ map: f.couleur, roughnessMap: f.rugosite, roughness: f.rugosite ? 1 : 0.3, metalness: 0.75, envMap: envCiel, envMapIntensity: 1.2, emissive: '#ffffff', emissiveMap: f.fenetres, emissiveIntensity: 0 });
      mat.map.repeat.set(Math.max(1, w / 12), Math.max(1, h / 24));
      if (mat.roughnessMap) mat.roughnessMap.repeat.copy(mat.map.repeat); mat.emissiveMap.repeat.copy(mat.map.repeat);
      const tour = new THREE.Mesh(new THREE.BoxGeometry(w, h - 5, d), mat);
      tour.position.set(bx, 5 + (h - 5) / 2, bz); tour.castShadow = dist < 120; tour.receiveShadow = true;
      racine.add(tour);
      nuit.fenetres.push(mat);
      if (r() < 0.45) { // retrait au sommet
        const t2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, h * 0.18, d * 0.6), mat); t2.position.set(bx, h + h * 0.09, bz); racine.add(t2);
      }
      // Rez-de-chaussée : vitrines, auvent, enseigne
      const socle = new THREE.Mesh(new THREE.BoxGeometry(w, 5, d), beton); socle.position.set(bx, 2.5, bz); socle.receiveShadow = true; racine.add(socle);
      for (const [nx, nz, rot] of [[0, d / 2 + 0.02, 0], [w / 2 + 0.02, 0, Math.PI / 2], [0, -d / 2 - 0.02, Math.PI], [-w / 2 - 0.02, 0, -Math.PI / 2]]) {
        const face = rot % Math.PI === 0 ? w : d;
        const nom = ENSEIGNES[Math.floor(r() * ENSEIGNES.length)];
        const couleur = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#ffffff', '#ff9f1c'][ENSEIGNES.indexOf(nom) % 7];
        const vt = texVitrine(r);
        const vit = new THREE.Mesh(new THREE.PlaneGeometry(face * 0.8, 3.2), new THREE.MeshStandardMaterial({ map: vt, roughness: 0.12, metalness: 0.1, envMap: envCiel, envMapIntensity: 0.35, emissive: '#ffffff', emissiveMap: vt, emissiveIntensity: 0.25 }));
        vit.position.set(bx + nx, 1.8, bz + nz); vit.rotation.y = rot; racine.add(vit);
        nuit.enseignes.push(vit.material);
        const tex = enseigne(nom, couleur);
        const em = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 });
        const pan = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(face * 0.5, 7), 1.2), em);
        pan.position.set(bx + nx * 1.01, 4.1, bz + nz * 1.01); pan.rotation.y = rot; racine.add(pan);
        nuit.enseignes.push(em);
        const auvent = new THREE.Mesh(new THREE.BoxGeometry(face * 0.8, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.8 }));
        auvent.position.set(bx + nx + Math.sin(rot) * 0.7, 3.5, bz + nz + Math.cos(rot) * 0.7); auvent.rotation.y = rot; auvent.rotation.x = 0; racine.add(auvent);
        if (r() < 0.35 && h > 30) { // enseigne verticale à la japonaise
          const tv = enseigne(nom, couleur, true);
          const mv = new THREE.MeshStandardMaterial({ map: tv, emissive: '#ffffff', emissiveMap: tv, emissiveIntensity: 0.5 });
          const pv = new THREE.Group();
          const f1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 6), mv); f1.position.z = 0.03; pv.add(f1);
          const f2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 6), mv); f2.rotation.y = Math.PI; f2.position.z = -0.03; pv.add(f2);
          pv.position.set(bx + nx + Math.sin(rot) * 0.8 + Math.cos(rot) * face * 0.3, 9, bz + nz + Math.cos(rot) * 0.8 - Math.sin(rot) * face * 0.3); pv.rotation.y = rot + Math.PI / 2;
          racine.add(pv); nuit.enseignes.push(mv);
        }
      }
    }
  }

  // Lampadaires et mobilier le long de notre îlot
  (async () => {
    for (const x of [-19.5, 19.5]) for (let z = -14; z <= 22; z += 12) {
      const l = await monde.objet('street_lamp_01', { x, y: 0, z, rot: x < 0 ? Math.PI / 2 : -Math.PI / 2 });
      racine.add(l);
    }
    for (const [x, z, rot] of [[-18.6, 2, Math.PI / 2], [18.6, 8, -Math.PI / 2], [-6, 21.8, Math.PI], [6, 21.8, Math.PI]]) racine.add(await monde.objet('modular_street_seating', { x, y: 0, z, rot }));
    for (const [x, z] of [[-10, 21.5], [10, 21.5], [-18.8, -8], [18.8, -2]]) racine.add(await monde.objet('planter_box_01', { x, y: 0, z, echelle: 1.3 }));
  })();

  // Circulation : voitures et motos sur les deux sens des rues proches
  const voies = [];
  for (const x of [-26]) { voies.push({ axe: 'z', fixe: x - 3, sens: 1 }); voies.push({ axe: 'z', fixe: x + 3, sens: -1 }); }
  for (const z of [30]) { voies.push({ axe: 'x', fixe: z + 3, sens: 1 }); voies.push({ axe: 'x', fixe: z - 3, sens: -1 }); }
  const vehicules = [];
  voies.forEach((v, iv) => {
    const combien = monde.mobile ? 2 : 3;
    for (let k = 0; k < combien; k += 1) {
      const estMoto = r() < 0.22;
      const o = estMoto ? moto(PEINTURES[Math.floor(r() * PEINTURES.length)]) : voiture(PEINTURES[Math.floor(r() * PEINTURES.length)]);
      const vitesse = (estMoto ? 11 : 7 + r() * 5) * v.sens;
      const pos = -120 + ((k * 240) / combien) + r() * 30 + iv * 13;
      o.userData = { ...o.userData, voie: v, vitesse, pos };
      if (v.axe === 'z') o.rotation.y = v.sens > 0 ? -Math.PI / 2 : Math.PI / 2;
      else o.rotation.y = v.sens > 0 ? 0 : Math.PI;
      racine.add(o);
      vehicules.push(o);
      nuit.lumieres.push(...o.userData.lumieres);
    }
  });
  bouger.push((dt) => {
    for (const o of vehicules) {
      const u = o.userData;
      u.pos += u.vitesse * dt;
      if (u.pos > 130) u.pos -= 260; if (u.pos < -130) u.pos += 260;
      if (u.voie.axe === 'z') o.position.set(u.voie.fixe, 0, u.pos); else o.position.set(u.pos, 0, u.voie.fixe);
      for (const roue of u.roues || []) roue.rotation.z -= (Math.abs(u.vitesse) * dt) / 0.34;
    }
  });

  // Passants sur les trottoirs (Rocketbox), qui marchent en boucle
  const trottoirs = [{ axe: 'z', fixe: -18.3 }, { axe: 'z', fixe: 18.3 }, { axe: 'x', fixe: 23 }, { axe: 'x', fixe: 22 }, { axe: 'z', fixe: -33.8 }, { axe: 'x', fixe: 37.8 }, { axe: 'z', fixe: 33.8 }];
  const passants = [];
  (async () => {
    const corps = ['Female_Adult_09', 'Male_Adult_04', 'Female_Party_02'];
    const combien = monde.mobile ? 3 : 10;
    for (let k = 0; k < combien; k += 1) {
      const t = trottoirs[k % trottoirs.length];
      const p = await monde.personnage(corps[k % corps.length]);
      const sens = k % 2 ? 1 : -1;
      p.objet.userData.marche = { t, sens, pos: -50 + r() * 100, vitesse: 1.1 + r() * 0.5 };
      p.jouer('marche', { fondu: 0 });
      p.objet.rotation.y = t.axe === 'z' ? (sens > 0 ? 0 : Math.PI) : (sens > 0 ? Math.PI / 2 : -Math.PI / 2);
      racine.add(p.objet);
      passants.push(p);
    }
    // Des vendeurs ambulants sur la place : étal, parasol, caisses, et le vendeur.
    const toile = ['#d94f30', '#2f7d5b', '#e0a526'];
    for (const [k, x, z, c] of [[0, -12, 19, 'Male_Adult_12'], [1, 12, 20, 'Female_Party_02']]) {
      const etal = new THREE.Group();
      const bois = new THREE.MeshStandardMaterial({ color: '#8a5a33', roughness: 0.85 });
      const plateau = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), bois); plateau.position.y = 0.85; etal.add(plateau);
      for (const [px, pz] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) { const pied = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), bois); pied.position.set(px, 0.42, pz); etal.add(pied); }
      const mat = new THREE.MeshStandardMaterial({ color: toile[k], roughness: 0.9, side: THREE.DoubleSide });
      const parasol = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 8, 1, true), mat); parasol.position.y = 2.5; etal.add(parasol);
      const mat2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3), bois); mat2.position.y = 1.3; etal.add(mat2);
      for (let i = 0; i < 6; i += 1) { const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: ['#e5572d', '#f2c230', '#6fae3c'][i % 3], roughness: 0.6 })); fruit.position.set(-0.6 + i * 0.24, 0.95, 0.1 - (i % 2) * 0.2); etal.add(fruit); }
      const caisse = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), bois); caisse.position.set(1.2, 0.17, 0.2); etal.add(caisse);
      etal.position.set(x, 0, z); etal.userData.garder = true; racine.add(etal);
      const vendeur = await monde.personnage(c);
      vendeur.objet.position.set(x, 0, z - 0.9); vendeur.jouer(k ? 'parle' : 'repos', { fondu: 0 });
      racine.add(vendeur.objet); passants.push(vendeur);
    }
    // Une terrasse de restaurant : des clients attablés (pas au téléphone)
    if (!monde.mobile) for (const [x, z, rot, c] of [[-33.5, 8, Math.PI / 2, 'Female_Party_02'], [-33.5, 10, Math.PI / 2, 'Male_Adult_04']]) {
      const table = await monde.objet('side_table_01', { x: x - 0.9, y: 0.18, z: z + 1 });
      racine.add(table);
      const p = await monde.personnage(c);
      p.objet.position.set(x, 0.18, z); p.objet.rotation.y = rot;
      p.jouer('assis', { fondu: 0 });
      racine.add(p.objet); passants.push(p);
    }
  })();
  bouger.push((dt) => {
    for (const p of passants) {
      p.mixer.update(dt);
      const m = p.objet.userData.marche;
      if (!m) continue;
      m.pos += m.sens * m.vitesse * dt;
      if (m.pos > 60) m.pos = -60; if (m.pos < -60) m.pos = 60;
      const x = m.t.axe === 'z' ? m.t.fixe : m.pos, z = m.t.axe === 'z' ? m.pos : m.t.fixe;
      p.objet.position.set(x, x > -20 && x < 20 && z > -16 && z < 24 ? 0 : 0.18, z);
    }
  });

  fusionner(racine);
  return {
    racine,
    majEnv: (env) => racine.traverse((o) => { if (o.material?.envMap !== undefined && o.material.envMap) { o.material.envMap = env; o.material.needsUpdate = true; } }),
    avancer: (dt) => bouger.forEach((f) => f(dt)),
    reglerNuit: (niveau) => { // 0 = plein jour, 1 = nuit
      for (const m of nuit.fenetres) m.emissiveIntensity = niveau * 1.1;
      for (const m of nuit.enseignes) m.emissiveIntensity = 0.35 + niveau * 1.4;
      for (const m of nuit.lumieres) m.emissiveIntensity = niveau * 2.5;
    },
  };
}
