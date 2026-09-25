// La ville autour de l'immeuble (Beau, 25/09 : « voitures, motos, passants,
// restaurants, une ville comme Tokyo »). Tout est construit ici, sans modèle
// payant : rues, trottoirs, passages piétons, tours en mur-rideau qui
// reflètent le vrai ciel, boutiques et restaurants avec leurs enseignes,
// lampadaires, voitures et motos qui circulent, passants.
// C'est le décor de la ville : aucune de ces personnes n'est un agent.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { STYLES } from './region';
import { construireChantier, jeterChantier, lumieresChantiers } from './chantiers3d';
import { construireHelico, construireHeliport } from './helico3d';
import { reliefTour, nouveauRelief, construireRelief } from './relief3d';

const ROUTES_X = [-78, -26, 26, 78];
const ROUTES_Z = [-74, -22, 30, 82];
const LARGEUR_ROUTE = 12;
const TROTTOIR = 4.5;
// Les enseignes des boutiques, selon la région de la personne et sa langue.
const ENSEIGNES_REGION = {
  afrique: { fr: ['BOUTIQUE', 'PHARMACIE', 'ALIMENTATION', 'BOULANGERIE', 'COIFFURE', 'TAILLEUR', 'TÉLÉPHONES', 'RESTAURANT', 'GRILL', 'QUINCAILLERIE', 'PRESSING', 'BANQUE', 'CAFÉ', 'CINÉMA', 'MARCHÉ', 'PÂTISSERIE'], en: ['SHOP', 'PHARMACY', 'GROCERY', 'BAKERY', 'SALON', 'TAILOR', 'PHONES', 'RESTAURANT', 'GRILL', 'HARDWARE', 'LAUNDRY', 'BANK', 'CAFÉ', 'CINEMA', 'MARKET', 'SWEETS'] },
  europe: { fr: ['CAFÉ', 'BOULANGERIE', 'PHARMACIE', 'LIBRAIRIE', 'FLEURS', 'BISTROT', 'FROMAGERIE', 'BANQUE', 'CINÉMA', 'PIZZA', 'OPTIQUE', 'PÂTISSERIE', 'BRASSERIE', 'PRIMEUR', 'GALERIE', 'THÉ'], en: ['CAFÉ', 'BAKERY', 'PHARMACY', 'BOOKS', 'FLOWERS', 'BISTRO', 'CHEESE', 'BANK', 'CINEMA', 'PIZZA', 'OPTICIAN', 'PATISSERIE', 'PUB', 'GROCER', 'GALLERY', 'TEA'] },
  asie: { fr: ['RAMEN', 'SUSHI', 'KARAOKÉ', 'NOODLES', 'THÉ', 'CAFÉ', 'PHARMACIE', 'GRILL', 'LIBRAIRIE', 'CINÉMA', 'BANQUE', 'FLEURS', 'BOULANGERIE', 'MARCHÉ', 'RESTAURANT', 'PIZZA'], en: ['RAMEN', 'SUSHI', 'KARAOKE', 'NOODLES', 'TEA', 'CAFÉ', 'PHARMACY', 'GRILL', 'BOOKS', 'CINEMA', 'BANK', 'FLOWERS', 'BAKERY', 'MARKET', 'RESTAURANT', 'PIZZA'] },
  amerique: { fr: ['CAFÉ', 'DINER', 'PIZZA', 'PHARMACIE', 'BANQUE', 'CINÉMA', 'FLEURS', 'LIBRAIRIE', 'GRILL', 'TACOS', 'BOULANGERIE', 'MARCHÉ', 'RESTAURANT', 'THÉ', 'SPORTS', 'DELI'], en: ['COFFEE', 'DINER', 'PIZZA', 'PHARMACY', 'BANK', 'CINEMA', 'FLOWERS', 'BOOKS', 'GRILL', 'TACOS', 'BAKERY', 'MARKET', 'RESTAURANT', 'TEA', 'SPORTS', 'DELI'] },
  mixte: { fr: ['CAFÉ', 'RAMEN', 'SUSHI', 'BOULANGERIE', 'PHARMACIE', 'RESTAURANT', 'MARCHÉ', 'LIBRAIRIE', 'PIZZA', 'THÉ', 'GRILL', 'FLEURS', 'BANQUE', 'CINÉMA', 'KARAOKÉ', 'NOODLES'], en: ['CAFÉ', 'RAMEN', 'SUSHI', 'BAKERY', 'PHARMACY', 'RESTAURANT', 'MARKET', 'BOOKS', 'PIZZA', 'TEA', 'GRILL', 'FLOWERS', 'BANK', 'CINEMA', 'KARAOKE', 'NOODLES'] },
};
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

// Façades photo-réalistes (images générées pour Léo, découpées pour se répéter
// sans couture) : verre, pierre, résidence à balcons. Une texture « nuit »
// allume certaines fenêtres quand le soleil se couche.
// Taille réelle d'une tuile, en mètres (largeur, hauteur).
const FACADES = { verre: [29.6, 14.4], beton: [19, 10.5], residence: [11.9, 6.4] };
export function matieresFacades(monde, envCiel = null) {
  if (monde.facades) { for (const f of monde.facades) if (envCiel) f.mat.envMap = envCiel; return monde.facades; }
  const dossier = '/monde3d/facades/';
  const suf = monde.mobile ? '-m' : '';
  const tex = (f, srgb = true) => {
    const t = monde.textures.load(`${dossier}${f}${suf}.webp`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const reglages = {
    verre: { roughness: 0.28, metalness: 0.35, envMapIntensity: 0.9 },
    beton: { roughness: 0.85, metalness: 0, envMapIntensity: 0.5 },
    residence: { roughness: 0.8, metalness: 0, envMapIntensity: 0.5 },
  };
  const teintes = monde.mobile ? ['#ffffff'] : ['#ffffff', '#f1e6d8'];
  const liste = [];
  for (const nom of Object.keys(FACADES)) {
    const map = tex(nom), nuit = tex(`${nom}-nuit`);
    nuit.repeat.set(0.25, 0.25); // la carte de nuit couvre 4 × 4 tuiles : les fenêtres allumées ne se répètent pas
    for (const color of teintes) {
      liste.push({ nom, taille: FACADES[nom], mat: new THREE.MeshStandardMaterial({ map, color, envMap: envCiel, emissive: '#ffffff', emissiveMap: nuit, emissiveIntensity: 0, ...reglages[nom] }) });
    }
  }
  monde.facades = liste;
  return liste;
}
// Les quatre côtés d'un bloc, UV en mètres (la façade garde sa vraie échelle),
// décalés au hasard pour que deux tours voisines ne soient pas identiques.
export function cotesFacade(w, h, d, [tw, th], r) {
  const b = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const pos = b.attributes.position, uv = b.attributes.uv;
  const du = Math.floor(r() * 8) / 8;
  const garder = [];
  for (let f = 0; f < 6; f += 1) {
    if (f === 2 || f === 3) continue; // dessus et dessous : le toit à part
    const larg = f < 2 ? d : w;
    for (let i = f * 6; i < f * 6 + 6; i += 1) {
      garder.push([pos.getX(i), pos.getY(i), pos.getZ(i), b.attributes.normal.getX(i), b.attributes.normal.getY(i), b.attributes.normal.getZ(i), uv.getX(i) * larg / tw + du, uv.getY(i) * h / th]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(garder.flatMap((v) => v.slice(0, 3)), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(garder.flatMap((v) => v.slice(3, 6)), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(garder.flatMap((v) => v.slice(6)), 2));
  g.userData.du = du; // le décalage de la tuile : le relief (relief3d.js) se pose dessus
  return g;
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
// Matières partagées par tous les véhicules (moins de mémoire, moins d'appels de dessin).
let MV = null;
function matVehicules() {
  if (MV) return MV;
  const ombre = document.createElement('canvas'); ombre.width = ombre.height = 64;
  const xo = ombre.getContext('2d'); const go = xo.createRadialGradient(32, 32, 4, 32, 32, 32);
  go.addColorStop(0, 'rgba(0,0,0,0.75)'); go.addColorStop(1, 'rgba(0,0,0,0)'); xo.fillStyle = go; xo.fillRect(0, 0, 64, 64);
  const halo = document.createElement('canvas'); halo.width = halo.height = 64;
  const xh = halo.getContext('2d'); const gh = xh.createRadialGradient(32, 32, 0, 32, 32, 32);
  gh.addColorStop(0, 'rgba(255,244,214,1)'); gh.addColorStop(0.35, 'rgba(255,236,190,0.35)'); gh.addColorStop(1, 'rgba(255,230,180,0)'); xh.fillStyle = gh; xh.fillRect(0, 0, 64, 64);
  // La flaque de lumière des phares sur la chaussée
  const cone = document.createElement('canvas'); cone.width = 128; cone.height = 64;
  const xc = cone.getContext('2d'); const gc = xc.createRadialGradient(10, 32, 2, 10, 32, 118);
  gc.addColorStop(0, 'rgba(255,240,205,0.9)'); gc.addColorStop(1, 'rgba(255,240,205,0)'); xc.fillStyle = gc; xc.fillRect(0, 0, 128, 64);
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const additif = (c) => new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  MV = {
    vitre: new THREE.MeshPhongMaterial({ color: '#020304', specular: '#6f7c8a', shininess: 90, side: THREE.DoubleSide }), // géométrie retournée (miroir) : double face
    noir: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.75 }),
    plastique: new THREE.MeshStandardMaterial({ color: '#23252a', roughness: 0.55, metalness: 0.2 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d4d7dc', metalness: 1, roughness: 0.18 }),
    plaque: new THREE.MeshStandardMaterial({ color: '#f1f0ea', roughness: 0.5 }),
    phare: new THREE.MeshStandardMaterial({ color: '#f4f6f8', metalness: 0.5, roughness: 0.1, emissive: '#fff4d6', emissiveIntensity: 0 }),
    feu: new THREE.MeshStandardMaterial({ color: '#7a0b0b', roughness: 0.2, emissive: '#ff2020', emissiveIntensity: 0 }),
    ombre: new THREE.MeshBasicMaterial({ map: tex(ombre), transparent: true, depthWrite: false, toneMapped: false }),
    halo: additif(halo),
    cone: additif(cone),
  };
  return MV;
}
const BOITE = (l, h, p) => new THREE.BoxGeometry(l, h, p);
function poser(g, geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; }
const posePiece = poser;
// Ombre douce sous le véhicule, halos des phares et flaque de lumière devant (visibles la nuit).
function eclairage(g, M, long, larg, avant, leger) {
  const o = poser(g, new THREE.PlaneGeometry(long + 0.6, larg + 0.6), M.ombre, 0, 0.02, 0); o.rotation.x = -Math.PI / 2; o.userData.garder = true;
  if (leger) return; // au téléphone : l'ombre seulement, pas de halos (moins d'appels de dessin)
  for (const z of [-larg * 0.33, larg * 0.33]) { const h = poser(g, new THREE.PlaneGeometry(0.9, 0.9), M.halo, avant + 0.05, 0.72, z); h.rotation.y = Math.PI / 2; h.userData.garder = true; }
  const c = poser(g, new THREE.PlaneGeometry(9, 4), M.cone, avant + 4.5, 0.03, 0); c.rotation.x = -Math.PI / 2; c.userData.garder = true;
}
// Berline, SUV ou taxi : caisse extrudée (profil latéral), vitres, pare-chocs, calandre, feux.
function voiture(peinture, genre = 'berline', leger = false, jouable = false) {
  const M = matVehicules();
  const g = new THREE.Group();
  const carrosserie = new THREE.MeshStandardMaterial({ color: genre === 'taxi' ? '#f2b705' : peinture, metalness: 0.55, roughness: 0.22, envMapIntensity: 1.2 });
  const suv = genre === 'suv', k = suv ? 1.12 : 1;
  const s = new THREE.Shape();
  s.moveTo(-2.25, 0.34); s.lineTo(-2.32, 0.74 * k); s.quadraticCurveTo(-2.24, 0.9 * k, -1.75, 0.94 * k);
  s.lineTo(-1.0, 0.98 * k); s.quadraticCurveTo(-0.55, 1.4 * k, 0.05, 1.45 * k); s.lineTo(suv ? 1.55 : 0.95, 1.43 * k);
  s.quadraticCurveTo(suv ? 1.95 : 1.5, 1.34 * k, suv ? 2.1 : 1.9, 1.0 * k); s.lineTo(2.26, 0.92 * k); s.quadraticCurveTo(2.36, 0.72, 2.3, 0.34); s.closePath();
  const corps = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 4, curveSegments: 14 }), carrosserie);
  corps.geometry.scale(-1, 1, 1); corps.geometry.computeVertexNormals(); carrosserie.side = THREE.DoubleSide;
  corps.position.z = -0.85; g.add(corps);
  const v = new THREE.Shape();
  // L'habitacle vitré suit la ligne de toit, un peu en dehors de la caisse pour être visible.
  // (la caisse a un biseau de 8 cm : l'habitacle doit dépasser d'autant)
  v.moveTo(-1.1, 0.99 * k); v.quadraticCurveTo(-0.62, 1.53 * k, 0.05, 1.58 * k); v.lineTo(suv ? 1.55 : 0.95, 1.56 * k); v.quadraticCurveTo(suv ? 2.05 : 1.6, 1.45 * k, suv ? 2.2 : 2.02, 1.0 * k); v.closePath();
  const vitres = new THREE.Mesh(new THREE.ExtrudeGeometry(v, { depth: 1.96, bevelEnabled: false, curveSegments: 12 }), M.vitre);
  vitres.geometry.scale(-1, 1, 1); vitres.position.z = -0.98; g.add(vitres);
  poser(g, BOITE(suv ? 1.75 : 1.2, 0.05, 1.9), carrosserie, suv ? -0.75 : -0.45, 1.59 * k, 0); // pavillon
  // Montants entre les vitres, de la couleur de la caisse
  for (const z of [-0.99, 0.99]) poser(g, BOITE(0.1, 0.5 * k, 0.03), carrosserie, 0.15, 1.27 * k, z);
  // Pare-chocs, calandre, bas de caisse
  poser(g, BOITE(0.22, 0.28, 1.86), M.plastique, 2.3, 0.42, 0);
  poser(g, BOITE(0.22, 0.28, 1.86), M.plastique, -2.33, 0.42, 0);
  poser(g, BOITE(0.05, 0.16, 0.9), M.noir, 2.41, 0.62, 0);
  for (const z of [-0.93, 0.93]) poser(g, BOITE(3.0, 0.14, 0.04), M.plastique, 0, 0.36, z);
  // Phares et feux (bandeaux), plaques
  for (const z of [-0.62, 0.62]) {
    poser(g, BOITE(0.08, 0.13, 0.42), M.phare, 2.37, 0.76 * k, z);
    poser(g, BOITE(0.08, 0.1, 0.5), M.feu, -2.38, 0.8 * k, z);
  }
  poser(g, BOITE(0.03, 0.12, 0.5), M.plaque, 2.43, 0.44, 0);
  poser(g, BOITE(0.03, 0.12, 0.5), M.plaque, -2.46, 0.5, 0);
  // Rétroviseurs
  for (const z of [-0.98, 0.98]) poser(g, BOITE(0.14, 0.1, 0.18), carrosserie, 0.95, 1.02 * k, z);
  // Roues : pneu, jante, enjoliveur
  const pneu = new THREE.CylinderGeometry(0.35, 0.35, 0.26, 22);
  const jante = new THREE.CylinderGeometry(0.22, 0.22, 0.27, 14);
  const roues = [];
  for (const [x, z] of [[-1.45, 0.84], [-1.45, -0.84], [1.45, 0.84], [1.45, -0.84]]) {
    if (jouable) { // la voiture qu'on conduit : des roues qui tournent, celles de devant braquent
      const pivot = new THREE.Group(); pivot.position.set(x, 0.35, z); g.add(pivot);
      const axe = new THREE.Group(); pivot.add(axe);
      for (const [geo, mat] of [[pneu, M.noir], [jante, M.chrome]]) { const m = poser(axe, geo, mat, 0, 0, 0); m.rotation.x = Math.PI / 2; m.userData.garder = true; }
      roues.push({ pivot, axe, avant: x > 0 });
      continue;
    }
    poser(g, pneu, M.noir, x, 0.35, z).rotation.x = Math.PI / 2;
    poser(g, jante, M.chrome, x, 0.35, z).rotation.x = Math.PI / 2;
  }
  const lumieres = [M.phare, M.feu];
  if (genre === 'taxi') { // lanterne TAXI sur le toit, allumée la nuit
    const lanterne = new THREE.MeshStandardMaterial({ color: '#fff7d0', emissive: '#ffd24a', emissiveIntensity: 0 });
    poser(g, BOITE(0.28, 0.18, 0.6), lanterne, 0.4, 1.55 * k, 0);
    lumieres.push(lanterne);
    for (const z of [-0.87, 0.87]) poser(g, BOITE(2.6, 0.08, 0.02), M.noir, 0, 0.72, z); // bande à damier, vue de loin
  }
  fusionner(g);
  eclairage(g, M, 4.7, 1.9, 2.4, leger);
  g.userData.lumieres = lumieres;
  g.userData.demi = 2.5;
  g.userData.roues = roues;
  g.traverse((m) => { if (m.isMesh && !m.userData.garder) m.castShadow = true; });
  return g;
}

// Les vraies voitures (Beau, 25/09 : « les voitures sont en 2D ») : le modèle Car Concept
// (Khronos, CC-BY 4.0, voir LICENCES.md), allégé pour Léo. « haut » pour celles qu'on
// conduit à l'ordinateur (roues qui tournent et braquent, sièges, volant), « bas » pour la
// circulation et le téléphone. Le groupe est rendu tout de suite ; le modèle s'y pose une fois
// chargé. Son avant est +z : on le tourne pour qu'il regarde +x comme les autres véhicules.
const CARROSSERIE = /^Paint [12]/;
// Les vitres du modèle sont en « transmission » : three.js redessine alors toute la scène une
// seconde fois à chaque image. On les remplace par un verre teinté simple, bien moins coûteux.
let VITRE_SIMPLE = null;
const vitreSimple = () => (VITRE_SIMPLE ||= new THREE.MeshStandardMaterial({ name: 'Glass', color: '#1b2531', metalness: 0.3, roughness: 0.04, transparent: true, opacity: 0.62, envMapIntensity: 1.3 }));
// Au téléphone, le vernis (clearcoat) coûte cher : une matière standard qui garde la couleur et l'éclat.
function simplifier(mat) {
  if (!mat?.isMeshPhysicalMaterial) return mat;
  const m = new THREE.MeshStandardMaterial({ name: mat.name, color: mat.color, metalness: 0.4, roughness: 0.4, map: mat.map, emissive: mat.emissive, emissiveMap: mat.emissiveMap, envMapIntensity: 0.9 });
  return m;
}
function voiture3d(monde, peinture, genre = 'berline', leger = false, jouable = false) {
  const M = matVehicules();
  const g = new THREE.Group();
  const couleur = genre === 'taxi' ? '#f2b705' : genre === 'police' ? '#f4f5f7' : genre === 'luxe' ? '#0d0f13' : peinture;
  g.userData.genre = genre;
  g.userData.lumieres = [];
  g.userData.demi = 2.3;
  g.userData.roues = [];
  eclairage(g, M, 4.4, 1.95, 2.3, leger);
  // Garée ou dans la circulation : version légère. On passe à la version détaillée
  // (roues qui tournent et braquent, sièges, volant) quand on monte dedans, à l'ordinateur.
  const poser = (detail) => monde.charger(`vehicules/voiture-${detail ? 'haut' : 'bas'}.glb`).then((gltf) => {
    const modele = gltf.scene.clone(true);
    modele.rotation.y = Math.PI / 2;
    // Une seule vraie voiture sous licence libre, déclinée en silhouettes (Beau, 25/09 : « les voitures
    // sont du même modèle ») : SUV haut et large, coupé bas et long, limousine de luxe allongée.
    // x = largeur, y = hauteur, z = longueur (avant la rotation).
    const PROPORTIONS = { suv: [1.07, 1.16, 1.04], coupe: [1.0, 0.88, 1.05], luxe: [1.03, 0.97, 1.14], police: [1.03, 1.02, 1.02] };
    if (PROPORTIONS[genre]) modele.scale.set(...PROPORTIONS[genre]);
    const peint = new Map();
    modele.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = detail; m.receiveShadow = !leger; // la circulation a déjà son ombre peinte au sol
      const nom = m.material?.name || '';
      if (m.material?.transmission > 0 || nom === 'Glass') { m.material = vitreSimple(); return; }
      if (leger && m.material?.isMeshPhysicalMaterial) { const cle = `simple:${m.material.uuid}`; peint.set(cle, peint.get(cle) || simplifier(m.material)); m.material = peint.get(cle); }
      if (CARROSSERIE.test(nom)) { // chaque voiture a sa couleur (le second ton reste noir)
        if (!peint.has(nom)) {
          const c = (leger ? simplifier(m.material) : m.material).clone();
          c.color.set(nom.startsWith('Paint 1') ? couleur : genre === 'police' ? '#111418' : genre === 'luxe' ? '#8d8f94' : '#1b1d21');
          // Peinture satinée : des reflets doux plutôt qu'un chrome qui ondule
          c.metalness = Math.min(c.metalness, 0.45); c.roughness = Math.max(c.roughness, detail ? 0.28 : 0.38); c.envMapIntensity = 0.9;
          peint.set(nom, c);
        }
        if (!detail && !m.geometry.userData.lisse) { m.geometry = m.geometry.clone(); m.geometry.computeVertexNormals(); m.geometry.userData.lisse = true; }
        m.material = peint.get(nom);
      }
      if (leger && m.material && !m.material.userData.allege) { Object.assign(m.material, { normalMap: null, aoMap: null }); m.material.userData.allege = true; m.material.needsUpdate = true; }
      if (/^(Headlight|Brakelight)$/.test(nom) && !g.userData.lumieres.includes(m.material)) {
        m.material.emissive?.set(nom === 'Headlight' ? '#fff1d0' : '#ff2020');
        g.userData.lumieres.push(m.material);
      }
    });
    const roues = [];
    if (detail) { // pivot (braquage) → axe (rotation) → pièces de la roue
      const parRoue = new Map();
      for (const m of [...modele.children]) { const k = /^(Wheel(?:Front|Rear)[LR])_/.exec(m.name)?.[1]; if (k) { if (!parRoue.has(k)) parRoue.set(k, []); parRoue.get(k).push(m); } }
      for (const [k, pieces] of parRoue) {
        const pivot = new THREE.Group(); pivot.position.copy(pieces[0].position); modele.add(pivot);
        const axe = new THREE.Group(); pivot.add(axe);
        for (const m of pieces) { m.position.set(0, 0, 0); axe.add(m); }
        roues.push({ pivot, axe, avant: k.includes('Front'), axeRot: 'x', sens: 1, rayon: 0.38 });
      }
    }
    if (g.userData.modele) g.remove(g.userData.modele);
    g.userData.modele = modele;
    g.userData.roues.splice(0, g.userData.roues.length, ...roues);
    g.add(modele);
    g.userData.pret = true;
    monde.surModele?.(g);
  });
  poser(false).then(() => {
    if (genre === 'police') { // rampe de gyrophares (rouge / bleu, clignote en service) et « POLICE » sur les portières
      const rouge = new THREE.MeshStandardMaterial({ color: '#5a0a0a', emissive: '#ff1a1a', emissiveIntensity: 0 });
      const bleu = new THREE.MeshStandardMaterial({ color: '#0a1a5a', emissive: '#1a5cff', emissiveIntensity: 0 });
      posePiece(g, BOITE(0.34, 0.08, 1.05), new THREE.MeshStandardMaterial({ color: '#15171b', metalness: 0.5, roughness: 0.4 }), -0.35, 1.08, 0);
      posePiece(g, BOITE(0.26, 0.1, 0.42), rouge, -0.35, 1.16, -0.24);
      posePiece(g, BOITE(0.26, 0.1, 0.42), bleu, -0.35, 1.16, 0.24);
      g.userData.gyro = [rouge, bleu];
      if (monde.ecran) for (const cote of [-1, 1]) {
        const txt = monde.ecran(1.5, 0.3, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#10223f'; c.font = `800 ${h * 0.8}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('POLICE', w / 2, h / 2); });
        txt.material.transparent = true; txt.position.set(0.15, 0.58, cote * 1.04); txt.rotation.y = cote > 0 ? 0 : Math.PI; g.add(txt);
      }
      monde.surModele?.(g);
    }
    if (genre === 'taxi') { // lanterne TAXI sur le toit
      const lanterne = new THREE.MeshStandardMaterial({ color: '#fff7d0', emissive: '#ffd24a', emissiveIntensity: 0 });
      posePiece(g, BOITE(0.28, 0.18, 0.6), lanterne, -0.2, 1.22, 0);
      g.userData.lumieres.push(lanterne);
      monde.surModele?.(g);
    }
  }).catch(() => { g.add(voiture(peinture, genre, leger)); g.userData.pret = true; }); // hors ligne : l'ancienne voiture dessinée
  if (jouable && !leger) g.userData.detailler = () => { if (!g.userData.detaille) { g.userData.detaille = true; poser(true).catch(() => {}); } };
  return g;
}

// Bus de ville : long, vitré sur les côtés, girouette lumineuse.
function bus(peinture, leger = false) {
  // Bus de ville en vrais volumes (Beau, 25/09 : « tout doit être 4D ») : caisse aux angles
  // arrondis, pare-brise incliné, fenêtres en creux avec leurs montants, portes, passages de
  // roues, rétroviseurs, bloc de climatisation sur le toit, girouette.
  const M = matVehicules();
  const g = new THREE.Group();
  const caisse = new THREE.MeshStandardMaterial({ color: peinture, metalness: 0.35, roughness: 0.32, envMapIntensity: 0.9 });
  const clair = new THREE.MeshStandardMaterial({ color: '#eceae4', roughness: 0.5 });
  const L = 11, H = 2.6, P = 2.5, r = 0.32, Y = 0.95; // la caisse commence à 95 cm : les roues sont visibles dessous
  // Profil (vue de face) arrondi, extrudé sur la longueur
  const prof = new THREE.Shape();
  prof.moveTo(-P / 2 + r, Y); prof.lineTo(P / 2 - r, Y); prof.quadraticCurveTo(P / 2, Y, P / 2, Y + r);
  prof.lineTo(P / 2, Y + H - r); prof.quadraticCurveTo(P / 2, Y + H, P / 2 - r, Y + H);
  prof.lineTo(-P / 2 + r, Y + H); prof.quadraticCurveTo(-P / 2, Y + H, -P / 2, Y + H - r);
  prof.lineTo(-P / 2, Y + r); prof.quadraticCurveTo(-P / 2, Y, -P / 2 + r, Y); prof.closePath();
  const corps = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: L - 0.6, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.06, bevelSegments: 3, curveSegments: 6 }), caisse);
  corps.rotation.y = Math.PI / 2; corps.position.x = -(L - 0.6) / 2; g.add(corps);
  poser(g, BOITE(L - 0.5, 0.6, 2.2), M.plastique, 0, 0.7, 0); // jupe sombre sous la caisse
  // Pare-brise incliné et lunette arrière, vitres en creux (légèrement en retrait des montants)
  const pb = new THREE.Mesh(BOITE(0.08, 1.7, 2.2), M.vitre); pb.position.set(L / 2 + 0.04, 2.45, 0); pb.rotation.z = -0.12; g.add(pb);
  poser(g, BOITE(0.06, 1.2, 2.1), M.vitre, -L / 2 - 0.04, 2.6, 0);
  for (const z of [-P / 2 - 0.08, P / 2 + 0.08]) {
    for (let x = -4.4; x <= 3.4; x += 1.6) { poser(g, BOITE(1.35, 1.05, 0.04), M.vitre, x, 2.6, z); }
    for (let x = -5.2; x <= 4.2; x += 1.6) poser(g, BOITE(0.14, 1.2, 0.08), caisse, x, 2.6, z); // montants
    poser(g, BOITE(L - 0.4, 0.07, 0.08), M.plastique, -0.3, 3.2, z); // bandeau haut
    poser(g, BOITE(L - 0.4, 0.07, 0.08), M.plastique, -0.3, 2.0, z); // bandeau bas
  }
  // Portes (côté droit) : deux vantaux vitrés avec leur cadre
  for (const x of [4.2, -1.4]) { poser(g, BOITE(1.1, 2.0, 0.06), M.vitre, x, 2.05, P / 2 + 0.09); poser(g, BOITE(0.08, 2.0, 0.1), M.plastique, x, 2.05, P / 2 + 0.1); poser(g, BOITE(1.2, 0.08, 0.1), M.plastique, x, 1.1, P / 2 + 0.1); }
  // Passages de roues et roues à jante
  const pneu = new THREE.CylinderGeometry(0.52, 0.52, 0.36, 22), jante = new THREE.CylinderGeometry(0.34, 0.34, 0.37, 14);
  for (const [x, z] of [[-3.6, 1.1], [-3.6, -1.1], [3.5, 1.1], [3.5, -1.1]]) {
    poser(g, pneu, M.noir, x, 0.52, z).rotation.x = Math.PI / 2;
    poser(g, jante, M.chrome, x, 0.52, z).rotation.x = Math.PI / 2;
  }
  // Toit : bloc de climatisation, bandeau clair ; pare-chocs ; rétroviseurs sur bras
  poser(g, BOITE(2.4, 0.35, 1.8), clair, -1.5, 3.75, 0);
  poser(g, BOITE(L - 1, 0.06, 2.0), clair, -0.3, 3.6, 0);
  poser(g, BOITE(0.25, 0.45, 2.45), M.plastique, L / 2 + 0.05, 1.05, 0);
  poser(g, BOITE(0.25, 0.45, 2.45), M.plastique, -L / 2 - 0.05, 1.05, 0);
  for (const z of [-1.5, 1.5]) { poser(g, BOITE(0.06, 0.06, 0.45), M.noir, L / 2 - 0.4, 2.75, z); poser(g, BOITE(0.18, 0.4, 0.12), M.noir, L / 2 - 0.4, 2.55, z + Math.sign(z) * 0.2); }
  const girouette = new THREE.MeshStandardMaterial({ color: '#221a05', emissive: '#ffb020', emissiveIntensity: 0 });
  poser(g, BOITE(0.05, 0.3, 1.6), girouette, L / 2 + 0.08, 3.3, 0);
  for (const z of [-0.85, 0.85]) { poser(g, BOITE(0.1, 0.2, 0.45), M.phare, L / 2 + 0.08, 1.4, z); poser(g, BOITE(0.1, 0.35, 0.22), M.feu, -L / 2 - 0.08, 1.5, z); }
  fusionner(g);
  eclairage(g, M, 11, 2.5, 5.5, leger);
  g.userData.lumieres = [M.phare, M.feu, girouette];
  g.userData.demi = 5.6;
  g.userData.roues = [];
  g.traverse((m) => { if (m.isMesh && !m.userData.garder) m.castShadow = !leger; });
  return g;
}

function moto(peinture) {
  // Moto en volumes : pneus à jante, réservoir galbé, selle, carénage, fourche double,
  // pot d'échappement, garde-boue, et un pilote un peu plus dessiné.
  const g = new THREE.Group();
  const carrosserie = new THREE.MeshStandardMaterial({ color: peinture, metalness: 0.5, roughness: 0.3, envMapIntensity: 0.9 });
  const noir = new THREE.MeshStandardMaterial({ color: '#101112', roughness: 0.8 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#cfd3d8', metalness: 1, roughness: 0.2 });
  const pneu = new THREE.TorusGeometry(0.29, 0.1, 10, 26), jante = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), disque = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16);
  for (const x of [-0.72, 0.72]) {
    const r = new THREE.Mesh(pneu, noir); r.position.set(x, 0.39, 0); g.add(r);
    const j = new THREE.Mesh(jante, chrome); j.rotation.x = Math.PI / 2; j.position.set(x, 0.39, 0); g.add(j);
    const d = new THREE.Mesh(disque, noir); d.rotation.x = Math.PI / 2; d.position.set(x, 0.39, 0); g.add(d);
    // Garde-boue : un bout de tore au-dessus de la roue
    const gb = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 6, 16, Math.PI * 0.9), x > 0 ? carrosserie : noir); gb.position.set(x, 0.39, 0); gb.rotation.z = Math.PI * 0.05; gb.scale.z = 1.6; g.add(gb);
  }
  // Réservoir galbé (révolution), carénage avant, selle, moteur
  const tank = new THREE.Mesh(new THREE.LatheGeometry([[0.02, -0.32], [0.16, -0.28], [0.21, -0.05], [0.19, 0.2], [0.1, 0.34], [0.02, 0.36]].map(([r2, y]) => new THREE.Vector2(r2, y)), 14), carrosserie);
  tank.rotation.z = Math.PI / 2 - 0.2; tank.position.set(0.1, 0.84, 0); tank.scale.z = 0.85; g.add(tank);
  const carenage = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), carrosserie); carenage.rotation.z = -Math.PI / 2 + 0.3; carenage.position.set(0.62, 0.95, 0); carenage.scale.set(1, 1.4, 1.1); g.add(carenage);
  const selle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.3), noir); selle.position.set(-0.32, 0.86, 0); g.add(selle);
  const dosseret = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.28), carrosserie); dosseret.position.set(-0.62, 0.9, 0); dosseret.rotation.z = 0.35; g.add(dosseret);
  const moteur = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.32), chrome); moteur.position.set(0, 0.5, 0); g.add(moteur);
  const cylindre = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), noir); cylindre.rotation.x = Math.PI / 2; cylindre.position.set(0.12, 0.66, 0); g.add(cylindre);
  // Pot d'échappement, fourche double, guidon, phare
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 10), chrome); pot.rotation.z = Math.PI / 2 + 0.12; pot.position.set(-0.35, 0.45, 0.18); g.add(pot);
  for (const z of [-0.07, 0.07]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8), chrome); f.rotation.z = 0.35; f.position.set(0.58, 0.72, z); g.add(f); }
  const guidon = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7), noir); guidon.rotation.x = Math.PI / 2; guidon.position.set(0.5, 1.08, 0); g.add(guidon);
  const phareMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4d6', emissiveIntensity: 0 });
  const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), phareMat); p2.position.set(0.74, 1.0, 0); g.add(p2);
  g.userData.lumieres = [phareMat];
  // Le pilote : casque, torse penché, bras vers le guidon, jambes repliées
  const cuir = new THREE.MeshStandardMaterial({ color: '#1c1d20', roughness: 0.7 });
  const torse = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.4, 6, 10), cuir); torse.rotation.z = -0.5; torse.position.set(-0.1, 1.27, 0); g.add(torse);
  for (const z of [-0.2, 0.2]) { const bras = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.42, 4, 8), cuir); bras.rotation.z = 0.9; bras.position.set(0.22, 1.29, z); g.add(bras); } // de l'épaule au guidon
  const casque = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), carrosserie); casque.position.set(0.08, 1.66, 0); g.add(casque);
  const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 8, -0.6, 1.2, 0.9, 1.0), noir); visiere.position.set(0.08, 1.66, 0); g.add(visiere);
  for (const z of [-0.15, 0.15]) { const jambe = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.48, 4, 8), cuir); jambe.rotation.z = 1.1; jambe.position.set(-0.15, 0.85, z); g.add(jambe); const tibia = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), cuir); tibia.rotation.z = 0.15; tibia.position.set(0.02, 0.55, z * 1.2); g.add(tibia); }
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
  racine.traverse((o) => { if (o !== racine && o.isMesh && !o.isSkinnedMesh && !o.userData.garder && !o.parent?.userData?.marche && o.parent?.userData?.voie === undefined && !o.parent?.userData?.libre) tous.push(o); });
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


// ——— Affiches ———
function chargerImage(url) {
  return new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = url;
    setTimeout(() => ok(null), 15000);
  });
}
function dessinerAffiche({ img, nom }, l, h, etiquette = 'BOUTIQUE') {
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#f4ede3'; x.fillRect(0, 0, l, h);
  const large = l > h;
  // Photo de la boutique : à gauche (grand écran) ou en haut (panneau), recadrée sans déformer.
  const zl = large ? l * 0.58 : l, zh = large ? h : h * 0.72;
  const k = Math.max(zl / img.width, zh / img.height);
  const iw = img.width * k, ih = img.height * k;
  x.save(); x.beginPath(); x.rect(0, 0, zl, zh); x.clip();
  x.drawImage(img, (zl - iw) / 2, (zh - ih) / 2, iw, ih);
  x.restore();
  try { x.getImageData(0, 0, 1, 1); } catch { return null; } // image refusée par son serveur
  const tx = large ? zl + l * 0.04 : l * 0.07, largeurTexte = large ? l - zl - l * 0.08 : l * 0.86;
  let y = large ? h * 0.3 : zh + h * 0.08;
  x.fillStyle = '#b5532d'; x.font = `600 ${Math.round(h * (large ? 0.05 : 0.032))}px system-ui`;
  x.fillText(etiquette, tx, y);
  x.fillStyle = '#1c1a17';
  const propre = String(nom).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim() || nom;
  let taille = Math.round(h * (large ? 0.11 : 0.06));
  x.font = `700 ${taille}px Georgia, serif`;
  while (x.measureText(propre).width > largeurTexte * 2 && taille > 14) { taille -= 2; x.font = `700 ${taille}px Georgia, serif`; }
  // Deux lignes au plus
  const mots = propre.split(/\s+/); const lignes = [''];
  for (const m of mots) { const essai = `${lignes[lignes.length - 1]} ${m}`.trim(); if (x.measureText(essai).width > largeurTexte && lignes[lignes.length - 1]) lignes.push(m); else lignes[lignes.length - 1] = essai; }
  lignes.slice(0, 2).forEach((li) => { y += taille * 1.15; x.fillText(li, tx, y); });
  x.fillStyle = '#9a7b3f'; x.font = `600 ${Math.round(h * (large ? 0.055 : 0.034))}px system-ui`;
  x.fillText('finjaro.net', tx, large ? h * 0.86 : h * 0.95);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ——— La ville ———
export function construireVille(monde, groupe, { sol = 0, envCiel = null, graine = 7 } = {}) {
  const r = alea(graine);
  // L'allure de la ville suit la région de la personne (voir region.js).
  const style = monde.region || { nom: 'mixte', ...STYLES.mixte };
  const ENSEIGNES = (ENSEIGNES_REGION[style.nom] || ENSEIGNES_REGION.mixte)[monde.langue === 'en' ? 'en' : 'fr'];
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
    ilots.push({ x0, x1, z0, z1, centre: i === 2 && j === 2, projets: i === 2 && j === 3, heliport: i === 3 && j === 2, boutiques: i === 1 && j === 2, clients: i === 2 && j === 1, chezMoi: i === 3 && j === 3 }); // en face : les projets (chantiers3d.js) ; à droite : l'héliport ; à gauche : les boutiques, derrière : les clients (quartiers3d.js) ; en diagonale : chez moi
  }
  const tours = [];
  const relief = nouveauRelief();
  const NEONS = new Map();
  const facades = matieresFacades(monde, envCiel);
  for (const f of facades) nuit.fenetres.push(f.mat);
  const toit = new THREE.MeshStandardMaterial({ color: '#5b5e62', roughness: 0.9 });
  const beton = monde.matiere('concrete_tile_facade', 3);
  for (const il of ilots) {
    const l = il.x1 - il.x0, p = il.z1 - il.z0;
    const dalle = new THREE.Mesh(new THREE.BoxGeometry(l, 0.18, p), trottoir);
    // Notre îlot : son trottoir affleure le sol du hall (0), les autres sont en bordure (+18 cm).
    dalle.position.set((il.x0 + il.x1) / 2, il.centre ? -0.11 : 0.09, (il.z0 + il.z1) / 2); dalle.receiveShadow = true;
    racine.add(dalle);
    if (il.centre || il.projets || il.heliport || il.boutiques || il.clients || il.chezMoi) continue; // notre immeuble, les projets, l'héliport, la ville de chacun
    if (monde.mobile && Math.hypot((il.x0 + il.x1) / 2, (il.z0 + il.z1) / 2) > 110) continue; // téléphone : seulement les îlots proches
    // 1 à 4 tours par îlot, rez-de-chaussée en boutiques
    const n = l > 60 || p > 60 ? 2 : 1 + Math.floor(r() * 3);
    const lx = (l - TROTTOIR * 2) / (n > 2 ? 2 : n), lz = (p - TROTTOIR * 2) / (n > 2 ? 2 : 1);
    for (let k = 0; k < Math.min(n, 4); k += 1) {
      const bx = il.x0 + TROTTOIR + (k % 2) * lx + lx / 2, bz = il.z0 + TROTTOIR + (n > 2 ? Math.floor(k / 2) : 0) * lz + lz / 2;
      const dist = Math.hypot(bx, bz);
      const h = 14 + r() * (dist < 90 ? 70 : 130) * style.hauteur;
      const w = lx - 2, d = lz - 2;
      // Tours hautes : plutôt du verre ; petites : pierre ou résidence.
      const verres = facades.filter((x) => x.nom === 'verre'), autres = facades.filter((x) => x.nom !== 'verre');
      const lot = r() < (h > 60 ? Math.min(0.95, style.verre + 0.2) : style.verre * 0.5) ? verres : autres;
      const f = lot[Math.floor(r() * lot.length)];
      const hc = h - 5;
      const tour = new THREE.Mesh(cotesFacade(w, hc, d, f.taille, r), f.mat);
      tour.position.set(bx, 5 + hc / 2, bz); tour.castShadow = dist < 120; tour.receiveShadow = true;
      racine.add(tour);
      tours.push({ bx, bz, w, d, h });
      const dessus = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.6, d + 0.4), toit); dessus.position.set(bx, h + 0.3, bz); racine.add(dessus);
      const retrait = r() < 0.45;
      // Le relief : piliers, meneaux, bandeaux, balcons, toiture (sur le toit du retrait s'il y en a un)
      reliefTour(relief, { nom: f.nom, bx, bz, w, d, hc, base: 5, du: tour.geometry.userData.du, h, toitW: retrait ? w * 0.6 : w, toitD: retrait ? d * 0.6 : d, toitH: retrait ? h + h * 0.18 : h }, { mobile: monde.mobile });
      if (retrait) { // retrait au sommet
        const t2 = new THREE.Mesh(cotesFacade(w * 0.6, h * 0.18, d * 0.6, f.taille, r), f.mat); t2.position.set(bx, h + h * 0.09, bz); racine.add(t2);
        const d2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6 + 0.3, 0.5, d * 0.6 + 0.3), toit); d2.position.set(bx, h + h * 0.18 + 0.25, bz); racine.add(d2);
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
        // Tube de néon sous l'auvent, de la couleur de l'enseigne (s'allume la nuit)
        if (!NEONS.has(couleur)) { const m = new THREE.MeshStandardMaterial({ color: couleur, emissive: couleur, emissiveIntensity: 0.35 }); NEONS.set(couleur, m); nuit.enseignes.push(m); }
        const tube = new THREE.Mesh(new THREE.BoxGeometry(face * 0.8, 0.06, 0.06), NEONS.get(couleur));
        tube.position.set(bx + nx + Math.sin(rot) * 1.38, 3.44, bz + nz + Math.cos(rot) * 1.38); tube.rotation.y = rot; racine.add(tube);
        if (r() < (dist < 120 ? style.neons : style.neons * 0.5) && h > 24) { // enseigne verticale à la japonaise
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

  // Arbres d'alignement le long de notre îlot (photos de boulevards de Beau) :
  // tronc, feuillage en plans croisés dessinés ici (aucune image du web), fusionnés.
  {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    for (let i = 0; i < 900; i += 1) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 118;
      const px = 128 + Math.cos(a) * d, py = 128 + Math.sin(a) * d * 0.9;
      const v = 60 + Math.floor(r() * 70);
      x.fillStyle = `rgb(${Math.floor(v * 0.45)},${v + 25},${Math.floor(v * 0.35)})`;
      x.beginPath(); x.ellipse(px, py, 5 + r() * 6, 3 + r() * 4, r() * Math.PI, 0, Math.PI * 2); x.fill();
    }
    const feuilles = new THREE.CanvasTexture(c); feuilles.colorSpace = THREE.SRGBColorSpace;
    const feuillage = new THREE.MeshStandardMaterial({ map: feuilles, alphaTest: 0.5, // le fond du canvas reste transparent
      side: THREE.DoubleSide, roughness: 0.9 });
    const ecorce = new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 0.95 });
    const grille = new THREE.MeshStandardMaterial({ color: '#2a2c2f', metalness: 0.6, roughness: 0.5 });
    const places = [];
    for (const xs of [-19.4, 19.4]) for (const z of [-8, 4, 16]) places.push([xs, z]);
    for (const xs of [-16, -3, 3, 16]) places.push([xs, 23.2]);
    for (const [ax, az] of places) {
      const h = 5.5 + r() * 1.5;
      const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h * 0.55, 8), ecorce); tronc.position.set(ax, h * 0.275, az); tronc.castShadow = true; racine.add(tronc);
      const g2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.2), grille); g2.position.set(ax, 0.02, az); racine.add(g2);
      for (let k = 0; k < 7; k += 1) {
        const t = 2.4 + r() * 1.2;
        const f = new THREE.Mesh(new THREE.PlaneGeometry(t, t * 0.85), feuillage);
        f.position.set(ax + (r() - 0.5) * 1.2, h * 0.6 + r() * h * 0.35, az + (r() - 0.5) * 1.2);
        f.rotation.set((r() - 0.5) * 0.6, r() * Math.PI, (r() - 0.5) * 0.4);
        f.castShadow = true; racine.add(f);
      }
    }
  }

  // Distributeurs de boissons éclairés, comme dans les rues de Tokyo (façade dessinée ici).
  {
    const c = document.createElement('canvas'); c.width = 128; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#e9eef2'; x.fillRect(0, 0, 128, 256);
    x.fillStyle = '#0f1a24'; x.fillRect(8, 8, 112, 150);
    const teintes = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e9c46a', '#8ecae6'];
    for (let j = 0; j < 4; j += 1) for (let i = 0; i < 5; i += 1) { x.fillStyle = teintes[(i + j * 2) % teintes.length]; x.fillRect(14 + i * 21, 16 + j * 36, 14, 26); x.fillStyle = '#f7f7f7'; x.fillRect(14 + i * 21, 36 + j * 36, 14, 4); }
    x.fillStyle = '#1d1f22'; x.fillRect(20, 190, 88, 30); x.fillStyle = '#4ade80'; x.fillRect(96, 170, 10, 6);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.35 });
    nuit.enseignes.push(face);
    const caisse = new THREE.MeshStandardMaterial({ color: '#c8102e', roughness: 0.4, metalness: 0.2 });
    for (const [px, pz, rot] of [[-19.4, 9.5, Math.PI / 2], [-19.4, 10.3, Math.PI / 2], [19.4, -4.5, -Math.PI / 2]]) {
      const d = new THREE.Group();
      const corps = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.85, 0.7), caisse); corps.position.y = 0.925; d.add(corps);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.75), face); f.position.set(0, 0.95, 0.351); d.add(f);
      d.position.set(px, 0, pz); d.rotation.y = rot; racine.add(d);
    }
  }

  // Un marché sur le trottoir d'en face (photos de Beau : le marché, les étals, les parasols).
  if (style.marche) {
    const bois = new THREE.MeshStandardMaterial({ color: '#7a4f2c', roughness: 0.9 });
    const toiles = ['#d94f30', '#2f7d5b', '#e0a526', '#2b59a8', '#b83280'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide }));
    const produits = ['#e5572d', '#f2c230', '#6fae3c', '#8b3a1e', '#f0e6d2', '#c2185b'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    for (let i = 0; i < 12; i += 1) {
      const x = -19 + i * 3.3, z = 38.2;
      const plateau = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 1.1), bois); plateau.position.set(x, 1.0, z); racine.add(plateau);
      for (const [px, pz] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) { const pied = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.82, 0.06), bois); pied.position.set(x + px, 0.59, z + pz); racine.add(pied); }
      // Bâche tendue sur quatre perches, comme au marché
      const bache = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), toiles[i % toiles.length]); bache.rotation.x = -Math.PI / 2 + 0.12; bache.position.set(x, 2.55, z - 0.1); racine.add(bache);
      for (const [px, pz] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) { const perche = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4), bois); perche.position.set(x + px, 1.38, z + pz); racine.add(perche); }
      // La marchandise : tas de fruits, piles de tissus, paniers
      for (let k = 0; k < 5; k += 1) {
        const m = produits[(i + k) % produits.length];
        const o = i % 3 === 1 ? new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08 + r() * 0.12, 0.3), m) : new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), m);
        o.position.set(x - 0.9 + k * 0.45, 1.12, z + (r() - 0.5) * 0.4); racine.add(o);
      }
      const panier = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.35, 12), bois); panier.position.set(x + 1.0, 0.36, z + 0.9); racine.add(panier);
    }
  }
  // Un grand rond-point avec son monument (photo de Beau), au carrefour voisin sans circulation.
  if (style.rondPoint) {
    const cx = 26, cz = -22;
    const herbe = new THREE.MeshStandardMaterial({ color: '#4f7a3a', roughness: 0.95 });
    const bordure = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.8 });
    const pierre = new THREE.MeshStandardMaterial({ color: '#cfc6b4', roughness: 0.7 });
    const bronzeM = new THREE.MeshStandardMaterial({ color: '#6b5433', metalness: 0.8, roughness: 0.35 });
    const ile = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.25, 48), bordure); ile.position.set(cx, 0.1, cz); ile.receiveShadow = true; racine.add(ile);
    const gazon = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.28, 48), herbe); gazon.position.set(cx, 0.12, cz); racine.add(gazon);
    for (let k = 0; k < 3; k += 1) { const marche = new THREE.Mesh(new THREE.CylinderGeometry(2.4 - k * 0.6, 2.4 - k * 0.6, 0.35, 32), pierre); marche.position.set(cx, 0.4 + k * 0.35, cz); marche.castShadow = true; racine.add(marche); }
    const socle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.1), pierre); socle.position.set(cx, 2.55, cz); socle.castShadow = true; racine.add(socle);
    const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.5, 7, 4), bronzeM); flamme.position.set(cx, 7.1, cz); flamme.rotation.y = Math.PI / 4; flamme.castShadow = true; racine.add(flamme);
    for (let k = 0; k < 8; k += 1) { const a = (k / 8) * Math.PI * 2; const fleur = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshStandardMaterial({ color: k % 2 ? '#e0a526' : '#c8201f', roughness: 0.9 })); fleur.position.set(cx + Math.cos(a) * 4, 0.45, cz + Math.sin(a) * 4); racine.add(fleur); }
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

  // L'héliport et son hélicoptère, sur l'îlot à droite de notre immeuble.
  const ilHeli = ilots.find((il) => il.heliport);
  const hx = (ilHeli.x0 + ilHeli.x1) / 2, hz = (ilHeli.z0 + ilHeli.z1) / 2;
  const heliport = construireHeliport({ mobile: monde.mobile });
  heliport.groupe.position.set(hx, 0.18, hz); racine.add(heliport.groupe);
  const H = construireHelico({ mobile: monde.mobile });
  H.groupe.position.set(hx, 0.53, hz); H.groupe.rotation.y = -Math.PI / 2; H.groupe.userData.libre = true;
  racine.add(H.groupe);
  const helico = { id: 'helico', objet: H.groupe, animer: H.animer, sol: 0.53, etat: { x: hx, y: 0, z: hz, cap: -Math.PI / 2, vx: 0, vy: 0, vz: 0 } };
  // Les vraies voitures arrivent après coup : leurs phares s'allument avec la nuit.
  monde.surModele = (g) => { for (const m of g.userData.lumieres) if (!nuit.lumieres.includes(m)) nuit.lumieres.push(m); };
  // Circulation : voitures et motos sur les deux sens des rues proches
  const voies = [];
  for (const x of [-26]) { voies.push({ axe: 'z', fixe: x - 3, sens: 1 }); voies.push({ axe: 'z', fixe: x + 3, sens: -1 }); }
  for (const z of [30]) { voies.push({ axe: 'x', fixe: z + 3, sens: 1 }); voies.push({ axe: 'x', fixe: z - 3, sens: -1 }); }
  const vehicules = [];
  voies.forEach((v, iv) => {
    const combien = monde.mobile ? 1 : 3; // au téléphone : une voiture par voie (Beau, 25/09 : « ça rame »)
    // Une allure par voie : les véhicules d'une même voie ne se traversent plus.
    const allure = (8 + r() * 3) * v.sens;
    for (let k = 0; k < combien; k += 1) {
      const t = r();
      const peinture = PEINTURES[Math.floor(r() * PEINTURES.length)];
      const leger = monde.mobile;
      const s1 = style.motos, s2 = s1 + style.bus, s3 = s2 + style.taxis;
      // Au-delà des taxis : SUV, coupés, berlines, voitures de luxe, et une voiture de police de temps en temps.
      // La silhouette vient d'un hachage de la position (pas de r() en plus : le plan de la ville ne bouge pas).
      const h = Math.abs(Math.sin((iv + 1) * 12.9898 + (k + 1) * 78.233) * 43758.5453) % 1;
      const civile = h < 0.1 ? 'police' : h < 0.35 ? 'suv' : h < 0.55 ? 'coupe' : h < 0.68 ? 'luxe' : 'berline';
      const o = t < s1 ? moto(peinture) : t < s2 ? bus(['#c8201f', '#1d5fa8', '#f2f0ea', '#2f7a4a'][Math.floor(r() * 4)], leger) : t < s3 ? voiture3d(monde, peinture, 'taxi', leger) : voiture3d(monde, peinture, civile, leger);
      const vitesse = allure;
      const pos = -120 + ((k * 240) / combien) + r() * 30 + iv * 13;
      o.userData = { ...o.userData, voie: v, vitesse, pos };
      if (v.axe === 'z') o.rotation.y = v.sens > 0 ? -Math.PI / 2 : Math.PI / 2;
      else o.rotation.y = v.sens > 0 ? 0 : Math.PI;
      racine.add(o);
      vehicules.push(o);
      nuit.lumieres.push(...o.userData.lumieres);
    }
  });
  // Des voitures garées le long de notre trottoir : on peut monter dedans et conduire
  // (Beau, 25/09 : « comme GTA San Andreas »). Elles restent là où on les laisse.
  const libres = [
    // Garées dans le sens de la circulation de leur côté (on roule à droite).
    { id: 'v1', peinture: '#b3121b', genre: 'berline', x: 2.5, z: 25.2, cap: -Math.PI / 2 }, // juste devant l'arrivée de l'onglet « La ville »
    { id: 'v2', peinture: '#1c2b44', genre: 'suv', x: -6, z: 34.8, cap: Math.PI / 2 }, // en face, le long du quartier des projets
    { id: 'v3', peinture: '#f2b705', genre: 'taxi', x: -21.0, z: 8, cap: Math.PI },
  ].map((d) => {
    const o = voiture3d(monde, d.peinture, d.genre, monde.mobile, true);
    o.userData.libre = true;
    o.position.set(d.x, 0, d.z); o.rotation.y = d.cap - Math.PI / 2;
    racine.add(o);
    nuit.lumieres.push(...o.userData.lumieres);
    return { id: d.id, objet: o, etat: { x: d.x, z: d.z, cap: d.cap, vitesse: 0 } };
  });
  // Passages piétons surveillés : une voiture s'arrête si quelqu'un traverse devant elle,
  // et ne rentre pas dans celle de devant.
  const passages = [
    { axe: 'z', voies: [-29, -23], p0: 21.5, occupe: 0 },
    { axe: 'x', voies: [27, 33], p0: 17.5, occupe: 0 },
    { axe: 'x', voies: [27, 33], p0: -34.5, occupe: 0 },
  ];
  const TOUR = 260;
  const ecart = (a, b) => { let d = b - a; while (d > TOUR / 2) d -= TOUR; while (d < -TOUR / 2) d += TOUR; return d; };
  bouger.push((dt) => {
    // Les gyrophares des voitures de police clignotent (rouge, puis bleu).
    const phase = Math.floor(performance.now() / 180) % 4;
    for (const o of vehicules) { const gy = o.userData.gyro; if (gy) { gy[0].emissiveIntensity = phase === 0 || phase === 2 ? 3 : 0.15; gy[1].emissiveIntensity = phase === 1 || phase === 3 ? 3 : 0.15; } }
    for (const o of vehicules) {
      const u = o.userData;
      const sens = Math.sign(u.vitesse), demi = u.demi || 1.2;
      let arret = false;
      for (const ps of passages) {
        if (!ps.occupe || ps.axe !== u.voie.axe || !ps.voies.includes(u.voie.fixe)) continue;
        const d = ecart(u.pos, ps.p0) * sens - demi;
        if (d > 0.5 && d < 12) arret = true;
      }
      if (!arret) for (const lb of libres) { // voitures du joueur (conduite ou garée) sur la voie, devant
        const q = lb.etat;
        const surVoie = u.voie.axe === 'z' ? Math.abs(q.x - u.voie.fixe) < 1.6 : Math.abs(q.z - u.voie.fixe) < 1.6;
        if (!surVoie) continue;
        const d = ecart(u.pos, u.voie.axe === 'z' ? q.z : q.x) * sens - demi - 2.4;
        if (d > -1.5 && d < 3) { arret = true; break; }
      }
      if (!arret) for (const b of vehicules) {
        if (b === o || b.userData.voie !== u.voie) continue;
        const d = ecart(u.pos, b.userData.pos) * sens - demi - (b.userData.demi || 1.2);
        if (d > -1 && d < 2.5) { arret = true; break; }
      }
      u.arret = arret;
      if (!arret) u.pos += u.vitesse * dt;
      if (u.pos > 130) u.pos -= TOUR; if (u.pos < -130) u.pos += TOUR;
      if (u.voie.axe === 'z') o.position.set(u.voie.fixe, 0, u.pos); else o.position.set(u.pos, 0, u.voie.fixe);
    }
  });

  // Passants sur les trottoirs (Rocketbox), qui marchent en boucle. Chacun a un prénom :
  // on peut le prendre en voiture, et il se fâche si on le bouscule (25/09).
  const PRENOMS = ['Awa', 'Idris', 'Nora', 'Karim', 'Lucas', 'Fatou', 'Sofia', 'Yann', 'Maya', 'Rayan', 'Julie', 'Samuel', 'Inès', 'Adam', 'Léa', 'Omar', 'Chloé', 'Malik', 'Zoé'];
  const trottoirs = [{ axe: 'z', fixe: -18.3 }, { axe: 'z', fixe: 18.3 }, { axe: 'x', fixe: 23 }, { axe: 'x', fixe: 22 }, { axe: 'z', fixe: -33.8 }, { axe: 'x', fixe: 37.8 }, { axe: 'z', fixe: 33.8 }];
  const passants = [];
  (async () => {
    const corps = ['Female_Adult_09', 'Male_Adult_04', 'Female_Party_02'];
    const combien = monde.mobile ? 4 : 16;
    for (let k = 0; k < combien; k += 1) {
      const t = trottoirs[k % trottoirs.length];
      const p = await monde.personnage(corps[k % corps.length]);
      p.nom = PRENOMS[k % PRENOMS.length]; // pour la passagère et le piéton qui se fâche (25/09)
      const sens = k % 2 ? 1 : -1;
      p.objet.userData.marche = { t, sens, pos: -50 + r() * 100, vitesse: 1.1 + r() * 0.5 };
      p.jouer('marche', { fondu: 0 });
      p.objet.rotation.y = t.axe === 'z' ? (sens > 0 ? 0 : Math.PI) : (sens > 0 ? Math.PI / 2 : -Math.PI / 2);
      racine.add(p.objet);
      passants.push(p);
    }
    // Des gens qui traversent aux passages piétons : ils attendent, traversent, attendent, reviennent.
    const traversees = [
      { ps: passages[0], a: [-33, 21.5], b: [-19.2, 21.5] },
      { ps: passages[1], a: [17.5, 23.2], b: [17.5, 36.8] },
      { ps: passages[2], a: [-34.5, 36.8], b: [-34.5, 23.2] },
    ].slice(0, monde.mobile ? 2 : 3);
    for (const [k, tr] of traversees.entries()) {
      const p = await monde.personnage(['Male_Adult_07', 'Female_Adult_05', 'Male_Adult_12'][k]);
      p.nom = PRENOMS[(k + 7) % PRENOMS.length];
      p.objet.userData.traverse = { ...tr, etat: 'attend', t: 2 + k * 3, u: 0, aller: true };
      p.objet.position.set(tr.a[0], tr.a[0] > -20 && tr.a[0] < 20 && tr.a[1] > -16 && tr.a[1] < 24 ? 0 : 0.18, tr.a[1]);
      p.jouer('repos', { fondu: 0 });
      racine.add(p.objet); passants.push(p);
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
    if (!monde.mobile && style.terrasses) for (const [x, z, rot, c] of [[-33.5, 8, Math.PI / 2, 'Female_Party_02'], [-33.5, 10, Math.PI / 2, 'Male_Adult_04']]) {
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
      const f = p.objet.userData.fache;
      if (f) { f.t -= dt; if (f.t <= 0) { p.objet.userData.fache = null; p.jouer(p.objet.userData.marche ? 'marche' : 'repos', { fondu: 0.3 }); } else continue; }
      if (p.objet.userData.assis) continue; // dans la voiture
      const tv = p.objet.userData.traverse;
      if (tv) {
        const [a, b] = tv.aller ? [tv.a, tv.b] : [tv.b, tv.a];
        if (tv.etat === 'attend') {
          tv.t -= dt;
          // On ne s'engage pas si une voiture est déjà sur le passage.
          const libre = !vehicules.some((o) => { const u = o.userData; return u.voie.axe === tv.ps.axe && tv.ps.voies.includes(u.voie.fixe) && Math.abs(ecart(u.pos, tv.ps.p0)) < (u.demi || 1.2) + 1.5; });
          if (tv.t <= 0 && libre) { tv.etat = 'traverse'; tv.u = 0; tv.ps.occupe += 1; p.jouer('marche', { fondu: 0.2 }); p.objet.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); }
        } else {
          tv.u += (1.3 * dt) / Math.hypot(b[0] - a[0], b[1] - a[1]);
          const u = Math.min(tv.u, 1);
          const px = a[0] + (b[0] - a[0]) * u, pz = a[1] + (b[1] - a[1]) * u;
          const surNotreIlot = px > -20 && px < 20 && pz > -16 && pz < 24; // notre trottoir affleure le sol
          p.objet.position.set(px, surNotreIlot || (u > 0.08 && u < 0.92) ? 0 : 0.18, pz);
          if (tv.u >= 1) { tv.etat = 'attend'; tv.t = 4 + r() * 6; tv.aller = !tv.aller; tv.ps.occupe -= 1; p.jouer('repos', { fondu: 0.3 }); }
        }
        continue;
      }
      const m = p.objet.userData.marche;
      if (!m) continue;
      m.pos += m.sens * m.vitesse * dt;
      if (m.pos > 60) m.pos = -60; if (m.pos < -60) m.pos = 60;
      const x = m.t.axe === 'z' ? m.t.fixe : m.pos, z = m.t.axe === 'z' ? m.pos : m.t.fixe;
      p.objet.position.set(x, x > -20 && x < 20 && z > -16 && z < 24 ? 0 : 0.18, z);
    }
  });

  // Affiches des vraies boutiques Finjaro (Beau, 25/09) : grands écrans sur
  // les tours voisines, panneaux lumineux sur nos trottoirs. Elles défilent.
  const panneaux = [];
  const cadreMat = new THREE.MeshStandardMaterial({ color: '#1b1d21', metalness: 0.6, roughness: 0.4 });
  const ecranVide = () => { const m = new THREE.MeshBasicMaterial({ color: '#0d0f12' }); return m; };
  const voisines = tours.map((t) => ({ ...t, dist: Math.hypot(t.bx, t.bz) })).sort((a, b) => a.dist - b.dist).slice(0, monde.mobile ? 3 : 6);
  for (const t of voisines) {
    // La face tournée vers notre immeuble
    const faces = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const [nx, nz] = faces.reduce((m, f) => (-(f[0] * t.bx + f[1] * t.bz) > -(m[0] * t.bx + m[1] * t.bz) ? f : m));
    const face = nx ? t.d : t.w;
    const L = Math.min(face * 0.5, 12), H = L * 9 / 16;
    if (t.h < 5 + H + 3) continue;
    const y = 5.8 + 1.4 + H / 2;
    const px = t.bx + nx * (t.w / 2 + 0.35), pz = t.bz + nz * (t.d / 2 + 0.35);
    const rot = Math.atan2(nx, nz);
    const cadre = new THREE.Mesh(new THREE.BoxGeometry(L + 0.5, H + 0.5, 0.4), cadreMat);
    cadre.position.set(px - nx * 0.15, y, pz - nz * 0.15); cadre.rotation.y = rot; cadre.userData.garder = true; cadre.visible = false; racine.add(cadre);
    const ecran = new THREE.Mesh(new THREE.PlaneGeometry(L, H), ecranVide());
    ecran.position.set(px + nx * 0.07, y, pz + nz * 0.07); ecran.rotation.y = rot; ecran.userData.garder = true; ecran.visible = false; racine.add(ecran);
    panneaux.push({ ecran, format: 'large', objets: [cadre, ecran] });
  }
  // Panneaux sur pied (double face) le long de notre îlot
  for (const [x, z, rot] of [[-18.9, 14, 0], [18.9, 15, 0], [-15, 22.7, Math.PI / 2], [15, 22.7, Math.PI / 2]]) {
    const pied = new THREE.Group();
    const corps = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.1, 0.26), cadreMat); corps.position.y = 1.35; pied.add(corps);
    const socle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), cadreMat); socle.position.y = 0.15; pied.add(socle);
    const mat = ecranVide();
    for (const cote of [1, -1]) {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.86), mat);
      e.position.set(0, 1.37, cote * 0.135); e.rotation.y = cote > 0 ? 0 : Math.PI; e.userData.garder = true; pied.add(e);
    }
    corps.userData.garder = true; socle.userData.garder = true;
    pied.position.set(x, 0, z); pied.rotation.y = rot; pied.userData.garder = true; pied.visible = false; racine.add(pied);
    panneaux.push({ ecran: { material: mat }, format: 'haut', objets: [pied] });
  }
  let affiches = [], rang = 0, attente = 0;
  const tex = { large: [], haut: [] };
  const montrer = () => {
    panneaux.forEach((p, i) => {
      const t = tex[p.format][(i + rang) % (tex[p.format].length || 1)];
      if (!t) return;
      if (!(p.ecran.material.map)) { p.ecran.material.color.set('#ffffff'); p.objets.forEach((o) => { o.visible = true; }); }
      p.ecran.material.map = t; p.ecran.material.needsUpdate = true;
    });
  };
  bouger.push((dt) => {
    if (!affiches.length) return;
    attente += dt;
    if (attente > 8) { attente = 0; rang += 1; montrer(); }
  });

  let groupeChantiers = null, bougerChantiers = [], chantiersFaits = new Map();
  racine.add(construireRelief(relief, { mobile: monde.mobile, envCiel }).groupe);
  fusionner(racine);
  return {
    racine,
    majEnv: (env) => racine.traverse((o) => { if (o.material?.envMap !== undefined && o.material.envMap) { o.material.envMap = env; o.material.needsUpdate = true; } }),
    avancer: (dt) => { bouger.forEach((f) => f(dt)); for (const f of bougerChantiers) f(dt); },
    // Pour conduire (conduite.js) : les voitures libres, les trottoirs, la circulation.
    voituresLibres: libres,
    passants,
    passages,
    // Le marché d'en face, s'il y en a un (région) : les agents y déjeunent (lot 3.2).
    marche: style.marche ? { z: 38.2, x0: -19, x1: 17.3 } : null,
    blocs: ilots.map(({ x0, x1, z0, z1 }) => ({ x0, x1, z0, z1 })),
    // Ce qu'une voiture ne traverse pas : les immeubles (pas les trottoirs — on peut y monter, 25/09).
    solides: [...tours.map(({ bx, bz, w, d }) => ({ x0: bx - w / 2 - 0.4, x1: bx + w / 2 + 0.4, z0: bz - d / 2 - 0.4, z1: bz + d / 2 + 0.4 })), { x0: -12.8, x1: 12.8, z0: -9.8, z1: 9.8 }],
    tours: tours.map(({ bx, bz, w, d, h }) => ({ x0: bx - w / 2 - 1.5, x1: bx + w / 2 + 1.5, z0: bz - d / 2 - 1.5, z1: bz + d / 2 + 1.5, h: h * 1.18 + 1 })),
    helico,
    // Les îlots de la ville de chacun (quartiers3d.js)
    ilotsReserves: Object.fromEntries(['boutiques', 'clients', 'chezMoi'].map((k) => { const il = ilots.find((x) => x[k]); return [k, il && { x0: il.x0, x1: il.x1, z0: il.z0, z1: il.z1 }]; })),
    // Chaque véhicule de la circulation, en cercles le long de son axe (un bus en fait quatre).
    circulation: () => vehicules.flatMap((o) => {
      const demi = o.userData.demi || 1.2, axeZ = o.userData.voie.axe === 'z';
      const pas = demi > 3 ? [-4.2, -1.5, 1.5, 4.2] : demi > 1.5 ? [-1.3, 1.3] : [0];
      const rayon = demi > 3 ? 1.3 : demi > 1.5 ? 0.9 : 0.55;
      return pas.map((k) => ({ x: o.position.x + (axeZ ? 0 : k), z: o.position.z + (axeZ ? k : 0), rayon }));
    }),
    // Les projets de l'entreprise, en chantiers (vraies données : ville.js → tours()).
    chantiers: (liste = []) => {
      if (!groupeChantiers) { groupeChantiers = new THREE.Group(); racine.add(groupeChantiers); }
      const places = [[-11, 45], [0, 45], [11, 45], [-11, 60], [0, 60], [11, 60]];
      const pois = [];
      const gardes = new Map();
      // Frise du temps : seuls les chantiers qui ont changé sont refaits.
      liste.slice(0, places.length).forEach((p, k) => {
        const [x, z] = places[k];
        const sig = JSON.stringify([k, p.nom, p.debut, p.fin, p.rendues, p.total, p.termine, p.enRetard, p.agentsAuTravail]);
        let e = chantiersFaits.get(p.id);
        if (!e || e.sig !== sig) {
          if (e) jeterChantier(e.c.groupe);
          const c = construireChantier(p, { langue: monde.langue, mobile: monde.mobile });
          c.groupe.position.set(x, 0.18, z); groupeChantiers.add(c.groupe);
          e = { c, sig };
        }
        gardes.set(p.id, e);
        pois.push({ type: 'chantier', id: p.id, nom: p.nom, x, z: z - 6.5, rayon: 3.2 });
      });
      for (const [id, e] of chantiersFaits) if (!gardes.has(id)) jeterChantier(e.c.groupe);
      chantiersFaits = gardes;
      bougerChantiers = [...gardes.values()].flatMap((e) => e.c.bouger);
      return pois;
    },
    // liste : [{ nom, image }] — de vraies boutiques (voir affiches.js).
    afficher: async (liste = []) => {
      // Mémoire graphique : 8 boutiques à l'ordinateur, 4 au téléphone, en plus petit.
      const k = monde.mobile ? 0.5 : 1;
      const images = await Promise.all(liste.slice(0, monde.mobile ? 4 : 8).map(async (a) => { const img = (await chargerImage(a.image)) || (a.secours && a.secours !== a.image ? await chargerImage(a.secours) : null); return img ? { ...a, img } : null; }));
      affiches = images.filter(Boolean);
      tex.large = affiches.map((a) => dessinerAffiche(a, 1024 * k, 576 * k, monde.langue === 'en' ? 'SHOP' : 'BOUTIQUE')).filter(Boolean);
      tex.haut = affiches.map((a) => dessinerAffiche(a, 400 * k, 640 * k, monde.langue === 'en' ? 'SHOP' : 'BOUTIQUE')).filter(Boolean);
      if (!tex.large.length) affiches = [];
      montrer();
    },
    reglerNuit: (niveau) => { // 0 = plein jour, 1 = nuit
      for (const m of nuit.fenetres) m.emissiveIntensity = niveau * 1.1;
      for (const m of nuit.enseignes) m.emissiveIntensity = 0.35 + niveau * 1.4;
      for (const m of nuit.lumieres) m.emissiveIntensity = niveau * 2.5;
      if (MV) { MV.halo.opacity = niveau * 0.9; MV.cone.opacity = niveau * 0.45; }
      lumieresChantiers(niveau);
    },
  };
}
