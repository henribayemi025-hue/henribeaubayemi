// Le bateau de la plage (Beau, 25/09 : « comme GTA ») et sa jetée. Dessiné pour Léo en volumes :
// coque effilée, pont, pare-brise, banquettes, moteur hors-bord. L'avant regarde +x (comme les
// voitures de la ville), l'origine est au milieu de la coque, au niveau de l'eau.
import * as THREE from 'three';

export function construireBateau({ couleur = '#f4f1ea', bande = '#e3a857', mobile = false } = {}) {
  const g = new THREE.Group();
  const coqueMat = new THREE.MeshPhysicalMaterial({ color: couleur, metalness: 0.15, roughness: 0.3, clearcoat: mobile ? 0 : 0.8, clearcoatRoughness: 0.2 });
  const dore = new THREE.MeshStandardMaterial({ color: bande, metalness: 0.6, roughness: 0.3 });
  const bois = new THREE.MeshStandardMaterial({ color: '#8a5a33', roughness: 0.6 });
  const sombre = new THREE.MeshStandardMaterial({ color: '#1d2126', metalness: 0.5, roughness: 0.45 });
  const verre = new THREE.MeshStandardMaterial({ color: '#233447', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  // La coque : vue de dessus, une forme effilée vers l'avant, extrudée vers le bas avec un biseau
  const s = new THREE.Shape();
  s.moveTo(-2.6, -1.05); s.lineTo(1.2, -1.05); s.quadraticCurveTo(2.5, -0.9, 3.1, 0); s.quadraticCurveTo(2.5, 0.9, 1.2, 1.05); s.lineTo(-2.6, 1.05); s.quadraticCurveTo(-2.75, 0, -2.6, -1.05);
  const coque = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 4, curveSegments: 10 }), coqueMat);
  coque.rotation.x = Math.PI / 2; coque.position.y = 0.55; g.add(coque);
  // Bande dorée à la ligne de flottaison, pont en bois, plat-bord
  const ligne = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false, curveSegments: 10 }), dore);
  ligne.rotation.x = Math.PI / 2; ligne.scale.set(1.02, 1.04, 1); ligne.position.y = 0.2; g.add(ligne);
  const pont = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false, curveSegments: 10 }), bois);
  pont.rotation.x = Math.PI / 2; pont.scale.set(0.9, 0.82, 1); pont.position.y = 0.62; g.add(pont);
  // Pare-brise incliné, volant, banquettes
  const pb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 1.5), verre); pb.position.set(0.9, 0.9, 0); pb.rotation.z = -0.35; g.add(pb);
  const cadre = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 1.55), sombre); cadre.position.set(0.8, 1.16, 0); g.add(cadre);
  const volant = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), sombre); volant.position.set(0.45, 0.95, -0.45); volant.rotation.y = Math.PI / 2; volant.rotation.x = 0.4; g.add(volant);
  for (const [x, w] of [[-0.2, 0.7], [-1.6, 0.9]]) {
    const assise = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 1.5), new THREE.MeshStandardMaterial({ color: '#f1dfc2', roughness: 0.8 })); assise.position.set(x, 0.72, 0); g.add(assise);
    const dos = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 1.5), new THREE.MeshStandardMaterial({ color: '#e8d2b0', roughness: 0.8 })); dos.position.set(x - w / 2, 1.0, 0); g.add(dos);
  }
  // Moteur hors-bord à l'arrière, feux de position
  const moteur = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.5), sombre); moteur.position.set(-2.85, 0.75, 0); g.add(moteur);
  const capot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.55), coqueMat); capot.position.set(-2.85, 1.11, 0); g.add(capot);
  const jambe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.14), sombre); jambe.position.set(-2.95, 0.1, 0); g.add(jambe);
  for (const [z, c] of [[-1.0, '#ff3030'], [1.0, '#30ff60']]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: c })); f.position.set(2.2, 0.75, z); g.add(f); }
  const feuMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const feuMat2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), feuMat); feuMat2.position.set(-2.7, 1.25, 0); g.add(feuMat2);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = !mobile; m.receiveShadow = !mobile; } });
  // Sillage : deux bandes d'écume derrière, visibles quand ça avance
  const sillage = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.4), new THREE.MeshBasicMaterial({ color: '#f4f7f8', transparent: true, opacity: 0, depthWrite: false }));
  sillage.rotation.x = -Math.PI / 2; sillage.position.set(-4.3, 0.02, 0); g.add(sillage);
  let t = 0;
  const animer = (dt, vitesse = 0) => {
    t += dt;
    sillage.material.opacity = Math.min(0.55, Math.abs(vitesse) * 0.06);
    sillage.scale.x = 1 + Math.min(2, Math.abs(vitesse) * 0.15);
    return { tangage: Math.sin(t * 1.3) * 0.015 - Math.min(0.12, vitesse * 0.01), roulis: Math.sin(t * 0.9) * 0.02, houle: Math.sin(t * 1.1) * 0.05 };
  };
  return { groupe: g, animer };
}

// La jetée : pilotis, platelage, taquets, échelle.
export function construireJetee({ longueur = 18, mobile = false } = {}) {
  const g = new THREE.Group();
  const bois = new THREE.MeshStandardMaterial({ color: '#7b5a3a', roughness: 0.85 });
  const platelage = new THREE.Mesh(new THREE.BoxGeometry(3, 0.18, longueur), new THREE.MeshStandardMaterial({ color: '#9a7452', roughness: 0.9 }));
  platelage.position.set(0, 0.6, longueur / 2); platelage.receiveShadow = !mobile; g.add(platelage);
  for (let z = 1; z < longueur; z += 3) for (const x of [-1.2, 1.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.2, 8), bois); p.position.set(x, -0.4, z); g.add(p); }
  for (let z = 4; z < longueur; z += 5) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.14), bois); t.position.set(1.35, 0.76, z); g.add(t); }
  for (const x of [-1.45, 1.45]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, longueur), bois); l.position.set(x, 1.1, longueur / 2); g.add(l); }
  g.traverse((m) => { if (m.isMesh) m.castShadow = !mobile; });
  return g;
}
