// Les courses de la ville (Beau, 25/09 : « comme GTA, des courses et tout »).
// Un circuit autour de notre pâté de maisons, sur la voie de droite : on passe les portes
// dans l'ordre, puis la ligne d'arrivée. Le chrono est mesuré, rien n'est inventé ;
// le record reste dans ce navigateur.
import * as THREE from 'three';

import { CIRCUIT } from './conduite';

export { CIRCUIT };
export const RAYON_PORTE = 7;

// Une course : on part du départ (porte 0), on passe les portes 1…n-1, on revient à la porte 0.
export function nouvelleCourse(circuit = CIRCUIT) { return { circuit, prochaine: 1, temps: 0, finie: false }; }

export function avancerCourse(c, x, z, dt) {
  if (c.finie) return c;
  const n = c.circuit.length;
  const temps = c.temps + dt;
  const [px, pz] = c.circuit[c.prochaine % n];
  if (Math.hypot(x - px, z - pz) > RAYON_PORTE) return { ...c, temps };
  if (c.prochaine === n) return { ...c, temps, prochaine: n, finie: true }; // retour au départ
  return { ...c, temps, prochaine: c.prochaine + 1 };
}

export { chrono } from './conduite'; // sans three.js : l'écran l'importe sans charger le moteur

// Les portes : deux mâts et une banderole numérotée ; la prochaine brille, les autres sont cachées.
export function construirePortes(circuit = CIRCUIT) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#2a2d33', metalness: 0.5, roughness: 0.4 });
  const anneauMat = new THREE.MeshBasicMaterial({ color: '#e3a857', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const portes = circuit.map(([x, z], i) => {
    const [ax, az] = circuit[(i + circuit.length - 1) % circuit.length];
    const [bx, bz] = circuit[(i + 1) % circuit.length];
    const cap = Math.atan2(bx - ax, bz - az); // la porte est perpendiculaire au sens de la course
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = cap;
    for (const s of [-5.6, 5.6]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8), mat); m.position.set(s, 2.3, 0); p.add(m); }
    const c = document.createElement('canvas'); c.width = 512; c.height = 64;
    const x2 = c.getContext('2d');
    if (i === 0) { for (let k = 0; k < 16; k += 1) for (let l = 0; l < 2; l += 1) { x2.fillStyle = (k + l) % 2 ? '#111' : '#f4f1ea'; x2.fillRect(k * 32, l * 32, 32, 32); } }
    else { x2.fillStyle = '#e3a857'; x2.fillRect(0, 0, 512, 64); x2.fillStyle = '#1b2233'; x2.font = 'bold 44px system-ui'; x2.textAlign = 'center'; x2.fillText(`${i} / ${circuit.length - 1}`, 256, 48); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const banderole = new THREE.Mesh(new THREE.PlaneGeometry(11.2, 1.1), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    banderole.position.y = 4.3; banderole.rotation.y = Math.PI; p.add(banderole); // lisible pour qui arrive
    const anneau = new THREE.Mesh(new THREE.RingGeometry(RAYON_PORTE - 0.6, RAYON_PORTE, 40), anneauMat);
    anneau.rotation.x = -Math.PI / 2; anneau.position.y = 0.06; p.add(anneau);
    p.visible = false;
    g.add(p);
    return p;
  });
  return {
    groupe: g,
    montrer: (prochaine, active) => portes.forEach((p, i) => { p.visible = active && i === prochaine % portes.length; }),
  };
}
