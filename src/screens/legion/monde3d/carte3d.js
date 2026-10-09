// Le dessin de la grande carte (lot 3.3) : l'aéroport à l'est, la campagne à
// l'ouest. Logique (chargement à l'approche, avion qui décolle) : carte.js.
import * as THREE from 'three';
import { aCharger, quartierDe, avionAuDecollage, PISTE } from './carte';
import { construireNature, ruisseauLeger, arbresFeuillus } from './nature3d';
import { BANDE } from './nature';

const box = (l, h, p, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), mat); m.position.set(x, y, z); return m; };

function texPiste() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = '#3b3e42'; x.fillRect(0, 0, 128, 1024);
  x.fillStyle = '#eef0f2';
  for (let y = 40; y < 1000; y += 60) x.fillRect(61, y, 6, 30); // axe central
  x.fillRect(6, 0, 4, 1024); x.fillRect(118, 0, 4, 1024); // bords
  for (const y of [8, 990]) for (let k = 0; k < 8; k += 1) x.fillRect(16 + k * 13, y, 8, 26); // seuils
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Un avion de ligne, nez vers +z.
export function avion(couleur = '#1d5fa8') {
  const g = new THREE.Group();
  const blanc = new THREE.MeshStandardMaterial({ color: '#f2f4f6', metalness: 0.3, roughness: 0.4 });
  const teinte = new THREE.MeshStandardMaterial({ color: couleur, metalness: 0.3, roughness: 0.4 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 30, 16), blanc); fus.rotation.x = Math.PI / 2; fus.position.y = 3.2; g.add(fus);
  const nez = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), blanc); nez.rotation.x = Math.PI / 2; nez.position.set(0, 3.2, 15); g.add(nez);
  const queue = new THREE.Mesh(new THREE.ConeGeometry(1.9, 6, 16), blanc); queue.rotation.x = -Math.PI / 2; queue.position.set(0, 3.6, -18); g.add(queue);
  const bande = new THREE.Mesh(new THREE.CylinderGeometry(1.93, 1.93, 26, 16, 1, true, -0.5, 1), teinte); bande.rotation.x = Math.PI / 2; bande.position.y = 3.2; g.add(bande);
  g.add(box(34, 0.5, 6, blanc, 0, 2.6, 1));
  g.add(box(0.5, 6, 4, teinte, 0, 7.2, -17));
  g.add(box(11, 0.4, 3, blanc, 0, 4.2, -17));
  for (const s of [-1, 1]) { const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 4, 12), new THREE.MeshStandardMaterial({ color: '#8d939b', metalness: 0.6, roughness: 0.3 })); mot.rotation.x = Math.PI / 2; mot.position.set(s * 7, 1.6, 3); g.add(mot); }
  for (const [x, z] of [[0, 11], [-3, -1], [3, -1]]) g.add(box(0.4, 1.4, 0.4, new THREE.MeshStandardMaterial({ color: '#2b2f36' }), x, 0.7, z));
  return g;
}

function eolienne() {
  const g = new THREE.Group();
  const blanc = new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: 0.5 });
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 50, 12), blanc); mat.position.y = 25; g.add(mat);
  const nacelle = box(2, 2, 5, blanc, 0, 50, 0); g.add(nacelle);
  const rotor = new THREE.Group(); rotor.position.set(0, 50, 2.8);
  for (let k = 0; k < 3; k += 1) { const pale = box(1.2, 20, 0.3, blanc, 0, 10, 0); const bras = new THREE.Group(); bras.add(pale); bras.rotation.z = (k * Math.PI * 2) / 3; rotor.add(bras); }
  g.add(rotor);
  g.userData.rotor = rotor;
  return g;
}

// La version légère de chaque quartier : toujours là.
function legerAeroport(groupe, solides) {
  const herbe = new THREE.MeshStandardMaterial({ color: '#6f8f4e', roughness: 1 });
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(350, 400), herbe); sol.rotation.x = -Math.PI / 2; sol.position.set(385, -0.02, 0); groupe.add(sol);
  const asphalte = new THREE.MeshStandardMaterial({ color: '#45484d', roughness: 0.95 });
  const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(110, 300), asphalte); tarmac.rotation.x = -Math.PI / 2; tarmac.position.set(320, 0, 0); groupe.add(tarmac);
  for (const z of [-22, 30]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), asphalte); r.rotation.x = -Math.PI / 2; r.position.set(236, 0.005, z); groupe.add(r); }
  const piste = new THREE.Mesh(new THREE.PlaneGeometry(45, PISTE.z1 - PISTE.z0 + 20), new THREE.MeshStandardMaterial({ map: texPiste(), roughness: 0.9 }));
  piste.rotation.x = -Math.PI / 2; piste.position.set(PISTE.x, 0.01, 0); groupe.add(piste);
  const voie = new THREE.Mesh(new THREE.PlaneGeometry(18, 300), asphalte); voie.rotation.x = -Math.PI / 2; voie.position.set(392, 0.008, 0); groupe.add(voie);
  // Le terminal (verre) et la tour de contrôle : visibles de loin.
  const verre = new THREE.MeshStandardMaterial({ color: '#5d86a8', metalness: 0.6, roughness: 0.15 });
  groupe.add(box(26, 14, 140, verre, 285, 7, 0));
  groupe.add(box(28, 1.2, 142, new THREE.MeshStandardMaterial({ color: '#d9dde2' }), 285, 14.6, 0));
  solides.push({ x0: 272, x1: 298, z0: -70, z1: 70 });
  const tour = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 38, 16), new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.6 })); tour.position.set(320, 19, 110); groupe.add(tour);
  const cabine = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 4.5, 5, 12), verre); cabine.position.set(320, 40.5, 110); groupe.add(cabine);
  solides.push({ x0: 316, x1: 324, z0: 106, z1: 114 });
}

function legerCampagne(groupe, solides) {
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(350, 400), new THREE.MeshStandardMaterial({ color: '#7fa05a', roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(-385, -0.02, 0); groupe.add(sol);
  const couleurs = ['#d8c25a', '#9cbc59', '#a77c4f', '#c9b04a', '#88ad53', '#b88f55'];
  let k = 0;
  for (const z of [-150, -95, 95, 150]) for (const x of [-260, -330, -400, -470, -530]) {
    const champ = new THREE.Mesh(new THREE.PlaneGeometry(58, 46), new THREE.MeshStandardMaterial({ color: couleurs[k++ % couleurs.length], roughness: 1 }));
    champ.rotation.x = -Math.PI / 2; champ.position.set(x, -0.01, z); groupe.add(champ);
  }
  const route = new THREE.Mesh(new THREE.PlaneGeometry(354, 9), new THREE.MeshStandardMaterial({ color: '#4d4f52', roughness: 0.95 }));
  route.rotation.x = -Math.PI / 2; route.position.set(-383, 0.005, 30); groupe.add(route);
  // La ferme : une grange rouge et la maison.
  const grange = box(18, 9, 12, new THREE.MeshStandardMaterial({ color: '#9b2d22', roughness: 0.8 }), -300, 4.5, -40); groupe.add(grange);
  const toit = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 18.4, 3, 1), new THREE.MeshStandardMaterial({ color: '#4a4c50' })); toit.rotation.z = Math.PI / 2; toit.rotation.x = Math.PI / 6; toit.position.set(-300, 10.2, -40); groupe.add(toit);
  groupe.add(box(12, 6, 9, new THREE.MeshStandardMaterial({ color: '#e8dfcc', roughness: 0.8 }), -275, 3, -10));
  solides.push({ x0: -309, x1: -291, z0: -46, z1: -34 }, { x0: -281, x1: -269, z0: -14.5, z1: -5.5 });
  // Les éoliennes (les mâts se voient de loin ; les pales tournent quand on approche).
  const eols = [];
  for (const z of [-120, -20, 80]) { const e = eolienne(); e.position.set(-490, 0, z); groupe.add(e); eols.push(e); }
  // Le ruisseau vu de loin (le coin nature, Beau 09/10) ; ses détails viennent à l'approche.
  const ruisseau = ruisseauLeger();
  groupe.add(ruisseau);
  return { eols, ruisseau };
}

// Les détails, construits à l'approche.
function detailsAeroport() {
  const g = new THREE.Group();
  const parques = [];
  [['#1d5fa8', -60], ['#c8201f', 0], ['#2f7a4a', 60]].forEach(([c, z]) => { const a = avion(c); a.position.set(318, 0, z); a.rotation.y = -Math.PI / 2; g.add(a); parques.push(a); });
  const decolle = avion('#e3a857'); decolle.position.set(PISTE.x, 0, PISTE.z0); g.add(decolle);
  // Les feux de la piste.
  const feu = new THREE.MeshBasicMaterial({ color: '#ffd89a' });
  for (let z = PISTE.z0; z <= PISTE.z1; z += 20) for (const s of [-1, 1]) g.add(box(0.5, 0.3, 0.5, feu, PISTE.x + s * 23, 0.15, z));
  // La manche à air.
  const manche = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#ff7a1a', side: THREE.DoubleSide }));
  manche.rotation.z = Math.PI / 2; manche.position.set(470, 6, -60); g.add(manche);
  g.add(box(0.15, 6, 0.15, new THREE.MeshStandardMaterial({ color: '#2b2f36' }), 471.5, 3, -60));
  return { groupe: g, decolle, solides: parques.map((a) => ({ x0: a.position.x - 15, x1: a.position.x + 15, z0: a.position.z - 3, z1: a.position.z + 3 })) };
}

function detailsCampagne(mobile, env) {
  const g = new THREE.Group();
  const n = mobile ? 50 : 140;
  let r = 12345; const alea = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  const arbres = [];
  for (let i = 0; i < n; i += 1) {
    // Des haies d'arbres le long des champs, jamais sur la route, la ferme ni le coin nature.
    let x, z;
    do { x = -215 - alea() * 340; z = -195 + alea() * 390; } while (Math.abs(z - 30) < 9 || (x > -320 && x < -260 && z > -55 && z < 0) || (x > BANDE.x0 - 2 && z > BANDE.z0 - 1 && z < BANDE.z1 + 1));
    arbres.push({ x, z, h: 5 + alea() * 4, rot: alea() * Math.PI * 2 });
  }
  // Les mêmes arbres feuillus que le coin nature (Beau, 09/10 : plus de boules vertes).
  const feuillus = arbresFeuillus(arbres, { mobile, graine: 4242 });
  g.add(feuillus.groupe);
  // Des bottes de foin et une clôture le long de la route.
  const foin = new THREE.MeshStandardMaterial({ color: '#d6b85a', roughness: 1 });
  for (let k = 0; k < 8; k += 1) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 12), foin); b.rotation.z = Math.PI / 2; b.position.set(-340 - k * 9, 0.9, 120 + (k % 2) * 6); g.add(b); }
  const bois = new THREE.MeshStandardMaterial({ color: '#8a6a45' });
  for (let x = -215; x > -555; x -= 6) for (const s of [-1, 1]) g.add(box(0.15, 1.1, 0.15, bois, x, 0.55, 30 + s * 6));
  for (const s of [-1, 1]) g.add(box(340, 0.1, 0.08, bois, -385, 0.9, 30 + s * 6));
  // Le coin nature : le ruisseau, ses galets, l'herbe au vent, les arbres, le tunnel, le pont.
  const nature = construireNature({ mobile, env });
  g.add(nature.groupe);
  return { groupe: g, solides: nature.solides, animer: nature.animer };
}

export function construireCarte(monde, ville) {
  const groupe = new THREE.Group();
  groupe.name = 'grande-carte';
  const solides = ville.solides;
  legerAeroport(groupe, solides);
  const { eols, ruisseau } = legerCampagne(groupe, solides);
  const charges = new Map();
  let quartier = null;
  return {
    groupe,
    // À chaque image : construire ou défaire les détails, animer, dire le quartier.
    maj(dt, x, z) {
      const { charger, defaire } = aCharger(new Set(charges.keys()), x, z);
      for (const id of charger) {
        const d = id === 'aeroport' ? detailsAeroport() : detailsCampagne(monde.mobile, monde.envCiel || null);
        if (id === 'campagne') ruisseau.visible = false;
        groupe.add(d.groupe);
        solides.push(...d.solides);
        charges.set(id, d);
      }
      for (const id of defaire) {
        const d = charges.get(id);
        groupe.remove(d.groupe);
        d.groupe.traverse((o) => { o.geometry?.dispose(); if (o.material && !Array.isArray(o.material)) { for (const k of ['map', 'normalMap', 'clearcoatNormalMap', 'alphaMap']) o.material[k]?.dispose(); o.material.dispose(); } });
        for (const s of d.solides) { const i = solides.indexOf(s); if (i >= 0) solides.splice(i, 1); }
        charges.delete(id);
        if (id === 'campagne') ruisseau.visible = true;
      }
      const a = charges.get('aeroport');
      if (a) {
        const p = avionAuDecollage(performance.now() / 1000);
        a.decolle.visible = p.visible;
        a.decolle.position.set(PISTE.x, p.y, p.z);
        a.decolle.rotation.x = -p.tangage;
      }
      const c = charges.get('campagne');
      if (c) { for (const e of eols) e.userData.rotor.rotation.z += dt * 0.9; c.animer?.(performance.now() / 1000); }
      const q = quartierDe(x, z);
      if (q !== quartier) { quartier = q; monde.emettre?.({ type: 'quartier', id: q }); }
    },
    charges: () => [...charges.keys()],
  };
}
