// Le quartier des projets (Beau, 25/09 : « oui, 4D ») : en face de l'immeuble,
// chaque projet de l'entreprise est un chantier. Rien n'est inventé :
// étages bâtis = tâches rendues, étages en charpente = tâches restantes,
// grue tant que ce n'est pas fini, gyrophare si la date de fin est dépassée.
import * as THREE from 'three';

const M = {};
function mats() {
  if (M.pret) return M;
  M.verre = new THREE.MeshStandardMaterial({ color: '#35506a', metalness: 0.6, roughness: 0.15 });
  M.dalle = new THREE.MeshStandardMaterial({ color: '#c9c3b8', roughness: 0.85 });
  M.acier = new THREE.MeshStandardMaterial({ color: '#7c848d', metalness: 0.7, roughness: 0.4 });
  M.jaune = new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.3, roughness: 0.5 });
  M.filet = new THREE.MeshStandardMaterial({ color: '#e8672e', roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  M.palissade = new THREE.MeshStandardMaterial({ color: '#e9e4da', roughness: 0.8 });
  M.couronne = new THREE.MeshStandardMaterial({ color: '#e3a857', emissive: '#e3a857', emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 });
  M.gyro = new THREE.MeshBasicMaterial({ color: '#ff2a2a' });
  M.lumiere = new THREE.MeshStandardMaterial({ color: '#16222c', emissive: '#ffd89a', emissiveIntensity: 0 });
  M.pret = true;
  return M;
}

function panneauProjet(p, langue) {
  const fr = langue !== 'en';
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#1b2233'; x.fillRect(0, 0, 512, 256);
  x.fillStyle = '#e3a857'; x.fillRect(0, 0, 512, 10);
  x.fillStyle = '#edf1f8'; x.font = 'bold 38px system-ui';
  const nom = String(p.nom || '').length > 22 ? `${String(p.nom).slice(0, 21)}…` : String(p.nom || '');
  x.fillText(nom, 22, 62);
  x.fillStyle = '#93a1b8'; x.font = '24px ui-monospace, monospace';
  x.fillText(p.debut && p.fin ? `${p.debut.slice(8, 10)}/${p.debut.slice(5, 7)} → ${p.fin.slice(8, 10)}/${p.fin.slice(5, 7)}` : (fr ? 'au quotidien' : 'day to day'), 22, 104);
  x.fillStyle = '#edf1f8'; x.font = 'bold 30px ui-monospace, monospace';
  x.fillText(`${p.rendues}/${p.total}`, 380, 104);
  x.fillStyle = '#2b3448'; x.fillRect(22, 132, 468, 22);
  x.fillStyle = p.enRetard ? '#e5484d' : p.termine ? '#7ee787' : '#e3a857'; x.fillRect(22, 132, 468 * Math.max(0, Math.min(1, p.avancement)), 22);
  x.fillStyle = '#c9d1dc'; x.font = '24px system-ui';
  const etat = p.termine ? (fr ? 'Terminé' : 'Finished') : p.enRetard ? (fr ? 'En retard' : 'Late') : (fr ? 'En chantier' : 'Under construction');
  x.fillText(`${etat}${p.agentsAuTravail ? ` · ${p.agentsAuTravail} ${fr ? 'agent(s) au travail' : 'agent(s) at work'}` : ''}`, 22, 200);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
}

// Un chantier, posé au sol en (0, 0) ; la face avant (panneau, portail) regarde -z.
export function construireChantier(p, { langue = 'fr', mobile = false } = {}) {
  const m = mats();
  const g = new THREE.Group();
  const L = 7, P = 7, H = 3.4;
  const etages = Math.max(3, Math.min(14, p.total || 3));
  const batis = p.termine ? etages : Math.round(etages * Math.max(0, Math.min(1, p.avancement || 0)));
  const bouger = [];
  // Étages bâtis : dalles + verre ; les fenêtres s'allument le soir
  for (let k = 0; k < batis; k += 1) {
    const dalle = new THREE.Mesh(new THREE.BoxGeometry(L + 0.3, 0.3, P + 0.3), m.dalle); dalle.position.y = k * H + 0.15; dalle.castShadow = true; g.add(dalle);
    const vitre = new THREE.Mesh(new THREE.BoxGeometry(L, H - 0.3, P), k % 3 === 1 ? m.lumiere : m.verre); vitre.position.y = k * H + 0.3 + (H - 0.3) / 2; vitre.castShadow = true; g.add(vitre);
  }
  // Étages restants : charpente d'acier et filets orange
  for (let k = batis; k < etages; k += 1) {
    const y0 = k * H;
    const dalle = new THREE.Mesh(new THREE.BoxGeometry(L + 0.3, 0.3, P + 0.3), m.dalle); dalle.position.y = y0 + 0.15; g.add(dalle);
    for (const [px, pz] of [[-L / 2, -P / 2], [L / 2, -P / 2], [-L / 2, P / 2], [L / 2, P / 2], [0, -P / 2], [0, P / 2]]) {
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.22, H, 0.22), m.acier); pot.position.set(px, y0 + H / 2, pz); g.add(pot);
    }
    if (k === batis) for (const [px, pz, rot] of [[0, -P / 2 - 0.2, 0], [L / 2 + 0.2, 0, Math.PI / 2]]) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(L, H * Math.min(2, etages - batis)), m.filet); f.position.set(px, y0 + (H * Math.min(2, etages - batis)) / 2, pz); f.rotation.y = rot; g.add(f);
    }
  }
  const hTotale = etages * H;
  if (p.termine) {
    // Fini : un toit, une couronne dorée qui brille
    const toit = new THREE.Mesh(new THREE.BoxGeometry(L + 0.5, 0.5, P + 0.5), m.dalle); toit.position.y = hTotale + 0.25; g.add(toit);
    const cour = new THREE.Mesh(new THREE.BoxGeometry(L + 0.55, 0.3, P + 0.55), m.couronne); cour.position.y = hTotale + 0.65; g.add(cour);
  } else {
    // La grue : mât, flèche qui tourne lentement, contrepoids, câble
    const grue = new THREE.Group();
    const hm = hTotale + 8;
    const mat = new THREE.Mesh(new THREE.BoxGeometry(0.8, hm, 0.8), m.jaune); mat.position.y = hm / 2; grue.add(mat);
    for (let y = 2; y < hm; y += 2) { const tr = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), m.acier); tr.position.y = y; grue.add(tr); }
    const tete = new THREE.Group(); tete.position.y = hm;
    const fleche = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 0.7), m.jaune); fleche.position.x = 5; tete.add(fleche);
    const contre = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), m.dalle); contre.position.set(-3.6, -0.3, 0); tete.add(contre);
    const cabine = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), m.acier); cabine.position.set(0.9, -0.9, 0); tete.add(cabine);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6), m.acier); cable.position.set(11, -3, 0); tete.add(cable);
    const charge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), m.acier); charge.position.set(11, -6.2, 0); tete.add(charge);
    grue.add(tete);
    grue.position.set(-L / 2 - 1.6, 0, P / 2 + 1.6);
    g.add(grue);
    const vitesse = 0.08 + (String(p.id).length % 5) * 0.02;
    bouger.push((dt) => { tete.rotation.y += dt * vitesse; });
    if (p.enRetard) {
      const gyro = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), m.gyro); gyro.position.set(L / 2, batis * H + 0.6, -P / 2); g.add(gyro);
      let t = 0; bouger.push((dt) => { t += dt; gyro.visible = t % 1 < 0.5; });
    }
  }
  // La palissade et le panneau du projet, devant
  for (const [px, pz, l, rot] of [[0, -P / 2 - 2.2, L + 4.4, 0], [-L / 2 - 2.2, 0, P + 4.4, Math.PI / 2], [L / 2 + 2.2, 0, P + 4.4, Math.PI / 2]]) {
    if (p.termine) continue;
    const pal = new THREE.Mesh(new THREE.BoxGeometry(l, 2, 0.08), m.palissade); pal.position.set(px, 1, pz); pal.rotation.y = rot; g.add(pal);
  }
  const pan = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), panneauProjet(p, langue));
  pan.position.set(0, p.termine ? 1.6 : 2.6, -P / 2 - 2.32); pan.rotation.y = Math.PI; g.add(pan);
  const pied = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2, 0.12), m.acier); pied.position.set(0, 1, -P / 2 - 2.28); if (p.termine) g.add(pied);
  g.traverse((o) => { if (o.isMesh && mobile) o.castShadow = false; });
  return { groupe: g, bouger };
}

export function lumieresChantiers(niveau) { if (M.pret) M.lumiere.emissiveIntensity = niveau * 1.3; }
