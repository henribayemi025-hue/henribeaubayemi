// Le quartier du sport (lot 3.6, E11) : un terrain de basket en plein air, sur
// un îlot réservé de la ville (ville3d.js). Le jeu lui-même est dans basket.js.
import * as THREE from 'three';

const LONG = 28, LARGE = 15; // m, terrain réglementaire
const SOL = 0.19; // le dessus du trottoir des îlots

function texTerrain() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 550;
  const x = c.getContext('2d');
  const k = c.width / LONG;
  x.fillStyle = '#1f4e8c'; x.fillRect(0, 0, c.width, c.height); // bleu
  x.fillStyle = '#c8562a'; // les raquettes, en terre cuite
  for (const cote of [0, 1]) x.fillRect(cote ? c.width - 5.8 * k : 0, (LARGE / 2 - 2.45) * k, 5.8 * k, 4.9 * k);
  x.strokeStyle = '#f4efe6'; x.lineWidth = 0.07 * k;
  x.strokeRect(0.05 * k, 0.05 * k, c.width - 0.1 * k, c.height - 0.1 * k);
  x.beginPath(); x.moveTo(c.width / 2, 0); x.lineTo(c.width / 2, c.height); x.stroke();
  x.beginPath(); x.arc(c.width / 2, c.height / 2, 1.8 * k, 0, Math.PI * 2); x.stroke();
  for (const cote of [0, 1]) {
    const bx = cote ? c.width - 1.575 * k : 1.575 * k;
    x.beginPath(); x.arc(bx, c.height / 2, 6.75 * k, cote ? Math.PI / 2 + 0.24 : -Math.PI / 2 + 0.24, cote ? (3 * Math.PI) / 2 - 0.24 : Math.PI / 2 - 0.24, false); x.stroke();
    x.strokeRect(cote ? c.width - 5.8 * k : 0, (LARGE / 2 - 2.45) * k, 5.8 * k, 4.9 * k);
    x.beginPath(); x.arc(cote ? c.width - 5.8 * k : 5.8 * k, c.height / 2, 1.8 * k, 0, Math.PI * 2); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Un panier, tourné vers +x : poteau derrière la ligne de fond, potence,
// planche, cercle orange (son centre à 0,38 m devant la planche), filet.
function panier() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#2b2f36', metalness: 0.7, roughness: 0.35 });
  const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.5, 12), metal); poteau.position.set(-1.2, 1.75, 0); g.add(poteau);
  const bras = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), metal); bras.position.set(-0.6, 3.4, 0); g.add(bras);
  const planche = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 1.8), new THREE.MeshStandardMaterial({ color: '#f4f6f8', roughness: 0.3, transparent: true, opacity: 0.88 }));
  planche.position.set(0, 3.45, 0); g.add(planche);
  const carre = new THREE.Mesh(new THREE.PlaneGeometry(0.59, 0.45), new THREE.MeshBasicMaterial({ color: '#c8562a', wireframe: true }));
  carre.rotation.y = Math.PI / 2; carre.position.set(0.03, 3.28, 0); g.add(carre);
  const cercle = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.018, 8, 24), new THREE.MeshStandardMaterial({ color: '#e8672e', metalness: 0.5, roughness: 0.4 }));
  cercle.rotation.x = Math.PI / 2; cercle.position.set(0.38, 3.05, 0); g.add(cercle);
  const filet = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.14, 0.42, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#f4efe6', wireframe: true, transparent: true, opacity: 0.8 }));
  filet.position.set(0.38, 2.83, 0); g.add(filet);
  return g;
}

export function construireSport(ilot) {
  const groupe = new THREE.Group();
  const cx = (ilot.x0 + ilot.x1) / 2, cz = (ilot.z0 + ilot.z1) / 2;
  // Le sol du terrain, avec ses lignes.
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(LONG + 3, LARGE + 3), new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.95 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(cx, SOL, cz); sol.receiveShadow = true; groupe.add(sol);
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(LONG, LARGE), new THREE.MeshStandardMaterial({ map: texTerrain(), roughness: 0.75 }));
  terrain.rotation.x = -Math.PI / 2; terrain.position.set(cx, SOL + 0.005, cz); terrain.receiveShadow = true; groupe.add(terrain);
  // Les deux paniers, face à face (le cercle à 1,575 m de la ligne de fond).
  const cercles = [];
  for (const sens of [-1, 1]) {
    const p = panier();
    // sens -1 : panier à l'ouest, tourné vers l'est ; sens 1 : à l'est, tourné vers l'ouest.
    const xc = cx + sens * (LONG / 2 - 1.575);
    p.position.set(xc + sens * 0.38, SOL, cz);
    p.rotation.y = sens === 1 ? Math.PI : 0;
    groupe.add(p);
    cercles.push({ x: xc, y: SOL + 3.05, z: cz });
  }
  // Un grillage bas tout autour, et deux bancs.
  const grille = new THREE.MeshStandardMaterial({ color: '#3d434c', metalness: 0.6, roughness: 0.5, transparent: true, opacity: 0.55 });
  for (const [l, x, z, ry] of [[LONG + 3, cx, cz - (LARGE + 3) / 2, 0], [LONG + 3, cx, cz + (LARGE + 3) / 2, 0], [LARGE + 3, cx - (LONG + 3) / 2, cz, Math.PI / 2], [LARGE + 3, cx + (LONG + 3) / 2, cz, Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, 1.1, 0.04), grille); m.position.set(x, SOL + 0.55, z); m.rotation.y = ry; groupe.add(m);
  }
  const bois = new THREE.MeshStandardMaterial({ color: '#a0703f', roughness: 0.8 });
  for (const dx of [-5, 5]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 0.45), bois); b.position.set(cx + dx, SOL + 0.45, cz + LARGE / 2 + 0.9); groupe.add(b); }
  // Le ballon (posé au centre ; le moteur le prend en main).
  const ballon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), new THREE.MeshStandardMaterial({ color: '#d9622b', roughness: 0.7 }));
  ballon.position.set(cx, SOL + 0.12, cz); ballon.castShadow = true; groupe.add(ballon);
  return {
    groupe,
    ballon,
    cercles,
    centre: { x: cx, z: cz },
    // On joue quand on est sur le terrain (un peu au-delà des lignes).
    surTerrain: (x, z) => Math.abs(x - cx) < LONG / 2 + 1.5 && Math.abs(z - cz) < LARGE / 2 + 1.5,
    poi: { type: 'basket', x: cx, z: cz, rayon: 0 },
  };
}
