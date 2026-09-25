// L'hélicoptère de la ville (Beau, 25/09 : « prendre un hélicoptère, comme GTA ») et son
// héliport. Dessiné pour Léo, en vrais volumes (pas de profil découpé) : fuselage galbé,
// verrière, poutre de queue effilée, dérive, patins, rotors qui tournent.
// Repère : l'avant regarde +z, le rotor est au-dessus de l'origine.
import * as THREE from 'three';

function profilFuselage() {
  // Demi-profil de révolution (x = rayon, y = position le long de l'appareil, de l'arrière vers l'avant)
  const pts = [[0.02, -2.2], [0.55, -2.0], [0.95, -1.4], [1.12, -0.4], [1.12, 0.6], [1.06, 1.15], [0.02, 1.2]]; // l'avant est la bulle vitrée
  return pts.map(([r, y]) => new THREE.Vector2(r, y));
}

export function construireHelico({ couleur = '#f4f1ea', bande = '#e3a857', mobile = false } = {}) {
  const g = new THREE.Group();
  const peinture = new THREE.MeshPhysicalMaterial({ color: couleur, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
  const dore = new THREE.MeshStandardMaterial({ color: bande, metalness: 0.6, roughness: 0.3 });
  const sombre = new THREE.MeshStandardMaterial({ color: '#1d2126', metalness: 0.5, roughness: 0.45 });
  const verre = new THREE.MeshPhysicalMaterial({ color: '#233447', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.72, clearcoat: 1, side: THREE.DoubleSide });
  const seg = mobile ? 16 : 28;
  // Fuselage : révolution allongée, couchée le long de z, un peu aplatie sur les côtés
  const corps = new THREE.Mesh(new THREE.LatheGeometry(profilFuselage(), seg), peinture);
  corps.rotation.x = Math.PI / 2; corps.scale.set(1, 1, 1.08); corps.position.set(0, 1.55, 0.2); g.add(corps);
  // Bande dorée autour de la cabine
  const ceinture = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 8, seg), dore);
  ceinture.scale.set(1, 1.08, 1); ceinture.position.set(0, 1.55, -0.4); g.add(ceinture);
  // Verrière : une grande bulle vitrée qui forme le nez, avec son cadre et deux sièges visibles
  const bulle = new THREE.Mesh(new THREE.SphereGeometry(1.1, seg, seg / 2, 0, Math.PI * 2, 0, Math.PI / 2), verre);
  bulle.rotation.x = Math.PI / 2; bulle.scale.set(1.0, 1.0, 1.45); bulle.position.set(0, 1.55, 1.45); g.add(bulle);
  const cadre = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 6, seg), sombre); cadre.position.set(0, 1.55, 1.45); g.add(cadre);
  const montant = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 6, seg, Math.PI), sombre);
  montant.rotation.y = Math.PI / 2; montant.scale.set(1.45, 1, 1); montant.position.set(0, 1.55, 1.45); g.add(montant);
  const siege = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.8 });
  for (const x of [-0.42, 0.42]) {
    const assise = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.55), siege); assise.position.set(x, 1.05, 1.2); g.add(assise);
    const dos = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.12), siege); dos.position.set(x, 1.45, 0.9); g.add(dos);
  }
  const tableau = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), sombre); tableau.position.set(0, 1.25, 2.2); tableau.rotation.x = -0.4; g.add(tableau);
  // Poutre de queue effilée, dérive, empennage
  const poutre = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.38, 5.2, seg / 2), peinture);
  poutre.rotation.x = Math.PI / 2; poutre.position.set(0, 1.95, -4.2); g.add(poutre);
  const derive = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.9), peinture);
  derive.position.set(0, 2.55, -6.6); derive.rotation.x = -0.35; g.add(derive);
  const empennage = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.55), peinture);
  empennage.position.set(0, 2.0, -5.9); g.add(empennage);
  // Patins : deux tubes et leurs jambes
  for (const x of [-0.95, 0.95]) {
    const patin = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 3.4, 4, 8), sombre);
    patin.rotation.x = Math.PI / 2; patin.position.set(x, 0.08, 0.1); g.add(patin);
    for (const z of [-0.8, 1.0]) {
      const jambe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 6), sombre);
      jambe.position.set(x * 0.82, 0.52, z); jambe.rotation.z = x > 0 ? 0.28 : -0.28; g.add(jambe);
    }
  }
  // Mât, moyeu et rotor principal (4 pales)
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 10), sombre); mat.position.set(0, 2.85, 0); g.add(mat);
  const rotor = new THREE.Group(); rotor.position.set(0, 3.2, 0); g.add(rotor);
  rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), sombre));
  for (let k = 0; k < 4; k += 1) {
    const pale = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 5.4), sombre);
    pale.position.set(Math.sin((k * Math.PI) / 2) * 2.8, 0, Math.cos((k * Math.PI) / 2) * 2.8);
    pale.rotation.y = (k * Math.PI) / 2; rotor.add(pale);
  }
  // Disque flou quand le rotor tourne vite (visible seulement en vol)
  const flou = new THREE.Mesh(new THREE.CircleGeometry(5.6, 40), new THREE.MeshBasicMaterial({ color: '#1d2126', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  flou.rotation.x = -Math.PI / 2; flou.position.y = 3.2; g.add(flou);
  // Rotor de queue
  const queue = new THREE.Group(); queue.position.set(0.18, 2.45, -6.7); g.add(queue);
  for (let k = 0; k < 2; k += 1) {
    const pale = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.3, 0.14), sombre);
    pale.rotation.x = (k * Math.PI) / 2; queue.add(pale);
  }
  // Feux : anticollision rouge dessous, feux de position
  const feu = new THREE.MeshBasicMaterial({ color: '#ff2a2a' });
  const anticol = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), feu); anticol.position.set(0, 0.62, 0.2); g.add(anticol);
  for (const [x, c] of [[-1.1, '#ff3030'], [1.1, '#30ff60']]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: c })); f.position.set(x, 1.6, 0.6); g.add(f); }
  g.traverse((m) => { if (m.isMesh) { m.castShadow = !mobile; m.receiveShadow = !mobile; } });
  flou.castShadow = false;
  let t = 0;
  // regime : 0 (arrêté) … 1 (plein vol)
  const animer = (dt, regime) => {
    t += dt;
    rotor.rotation.y += dt * (2 + regime * 34);
    queue.rotation.x += dt * (3 + regime * 50);
    flou.material.opacity = Math.max(0, regime - 0.35) * 0.35;
    anticol.visible = regime > 0.05 && t % 1.2 < 0.15;
  };
  return { groupe: g, animer };
}

// L'héliport : dalle, cercle et H jaunes, balisage, manche à air.
export function construireHeliport({ mobile = false } = {}) {
  const g = new THREE.Group();
  const dalle = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.3, 0.35, 48), new THREE.MeshStandardMaterial({ color: '#50545a', roughness: 0.85 }));
  dalle.position.y = 0.175; dalle.receiveShadow = true; g.add(dalle);
  const jaune = new THREE.MeshBasicMaterial({ color: '#f2c230' });
  const cercle = new THREE.Mesh(new THREE.RingGeometry(6.4, 6.9, 48), jaune); cercle.rotation.x = -Math.PI / 2; cercle.position.y = 0.36; g.add(cercle);
  for (const [w, d, x, z] of [[0.7, 5, -1.6, 0], [0.7, 5, 1.6, 0], [2.6, 0.7, 0, 0]]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d), jaune); b.rotation.x = -Math.PI / 2; b.position.set(x, 0.365, z); g.add(b);
  }
  const balise = new THREE.MeshStandardMaterial({ color: '#1a2a1a', emissive: '#3dff6a', emissiveIntensity: 0.6 });
  for (let k = 0; k < (mobile ? 8 : 16); k += 1) {
    const a = (k / (mobile ? 8 : 16)) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), balise); l.position.set(Math.sin(a) * 8.4, 0.45, Math.cos(a) * 8.4); g.add(l);
  }
  const perche = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), new THREE.MeshStandardMaterial({ color: '#d8d8d8' })); perche.position.set(10.5, 2, -6); g.add(perche);
  const manche = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#ff6a1a', side: THREE.DoubleSide }));
  manche.rotation.z = Math.PI / 2; manche.position.set(11.3, 3.8, -6); g.add(manche);
  return { groupe: g, balise };
}
