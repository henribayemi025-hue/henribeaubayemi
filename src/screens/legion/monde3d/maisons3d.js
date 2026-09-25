// Là où vivent les agents (Beau, 25/09 : photos de campagne, de villas avec
// piscine, d'une plage au pied d'une montagne). Chaque agent a sa villa, avec
// son nom devant. Règle de vérité : un agent n'est chez lui que s'il est en
// veille (éteint) — un agent allumé est à l'immeuble. Tout est dessiné ici :
// aucune image prise sur le web.
import * as THREE from 'three';

function alea(graine) { let s = graine >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function texture(l, h, dessiner) {
  const c = document.createElement('canvas'); c.width = l; c.height = h;
  dessiner(c.getContext('2d'), l, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function construireMaisons(monde, agents = []) {
  const r = alea(11);
  const g = new THREE.Group();
  const murs = [];
  // Les baies vitrées : sombres le jour, allumées le soir (même matière).
  const lampes = new THREE.MeshStandardMaterial({ color: '#16222c', metalness: 0.5, roughness: 0.08, emissive: '#ffd89a', emissiveIntensity: 0 });

  // Le sol : prairie, chemin, sable, mer
  const herbe = texture(256, 256, (x, w, h) => {
    x.fillStyle = '#5d8a3f'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i += 1) { const v = 70 + Math.floor(r() * 70); x.fillStyle = `rgb(${Math.floor(v * 0.6)},${v + 40},${Math.floor(v * 0.35)})`; x.fillRect(r() * w, r() * h, 2, 3 + r() * 4); }
  });
  herbe.repeat.set(60, 60);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: herbe, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.y = -0.02; sol.receiveShadow = true; g.add(sol);
  const sableT = texture(128, 128, (x, w, h) => { x.fillStyle = '#e6d3a8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i += 1) { x.fillStyle = r() < 0.5 ? '#d9c393' : '#f1e2bf'; x.fillRect(r() * w, r() * h, 2, 2); } });
  sableT.repeat.set(40, 4);
  const sable = new THREE.Mesh(new THREE.PlaneGeometry(600, 26), new THREE.MeshStandardMaterial({ map: sableT, roughness: 1 }));
  sable.rotation.x = -Math.PI / 2; sable.position.set(0, 0.0, 47); sable.receiveShadow = true; g.add(sable);
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshStandardMaterial({ color: '#1f6f8b', roughness: 0.08, metalness: 0.35, transparent: true, opacity: 0.94 }));
  mer.rotation.x = -Math.PI / 2; mer.position.set(0, -0.05, 258); g.add(mer);
  const ecume = new THREE.Mesh(new THREE.PlaneGeometry(600, 1.2), new THREE.MeshStandardMaterial({ color: '#f4f7f8', roughness: 0.6, transparent: true, opacity: 0.7 }));
  ecume.rotation.x = -Math.PI / 2; ecume.position.set(0, 0.01, 59.5); g.add(ecume);
  const chemin = new THREE.Mesh(new THREE.PlaneGeometry(600, 3.5), new THREE.MeshStandardMaterial({ color: '#b9a98a', roughness: 1 }));
  chemin.rotation.x = -Math.PI / 2; chemin.position.set(0, 0.01, 35.5); // promenade entre les jardins et la plage chemin.receiveShadow = true; g.add(chemin);

  // Montagnes et collines au loin
  const roche = new THREE.MeshStandardMaterial({ color: '#6f7d6a', roughness: 1, flatShading: true });
  const neige = new THREE.MeshStandardMaterial({ color: '#f3f5f7', roughness: 0.9, flatShading: true });
  for (const [x, z, rayon, h] of [[-160, -190, 110, 120], [-20, -230, 150, 170], [140, -200, 120, 130], [260, -150, 90, 90], [-280, -140, 100, 95]]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(rayon, h, 7, 1), roche); m.position.set(x, h / 2 - 2, z); m.rotation.y = r() * 3; g.add(m);
    const s = new THREE.Mesh(new THREE.ConeGeometry(rayon * 0.28, h * 0.28, 7, 1), neige); s.position.set(x, h - h * 0.14 - 2, z); s.rotation.y = m.rotation.y; g.add(s);
  }
  const colline = new THREE.MeshStandardMaterial({ color: '#4f7a36', roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i += 1) { const c = new THREE.Mesh(new THREE.SphereGeometry(30 + r() * 25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), colline); c.scale.y = 0.35; c.position.set(-240 + i * 60, -1, -90 - r() * 30); g.add(c); }

  // Les villas : une par agent (les agents humains n'en ont pas), le long du chemin.
  const siens = agents.filter((a) => !a.user_id).slice(0, monde.mobile ? 5 : 8);
  const blanc = new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.8 });
  const bois = new THREE.MeshStandardMaterial({ color: '#8a5a33', roughness: 0.7 });
  const verre = new THREE.MeshStandardMaterial({ color: '#16222c', metalness: 0.5, roughness: 0.08 });
  const eau = new THREE.MeshStandardMaterial({ color: '#35b6d8', roughness: 0.05, metalness: 0.2, emissive: '#0b5e78', emissiveIntensity: 0.25 });
  const pierre = new THREE.MeshStandardMaterial({ color: '#b8ab95', roughness: 0.95 });
  const haie = new THREE.MeshStandardMaterial({ color: '#3f6b2c', roughness: 1 });
  const villas = [];
  const pas = 20, debut = -((siens.length - 1) * pas) / 2;
  siens.forEach((a, i) => {
    const x = debut + i * pas, z = 20;
    const v = new THREE.Group(); v.position.set(x, 0, z);
    const bas = new THREE.Mesh(new THREE.BoxGeometry(11, 3.3, 8), i % 3 === 2 ? pierre : blanc); bas.position.y = 1.65; bas.castShadow = bas.receiveShadow = true; v.add(bas);
    const haut = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 6.5), blanc); haut.position.set(i % 2 ? 1.8 : -1.8, 4.8, -0.6); haut.castShadow = true; v.add(haut);
    for (const [lx, lz, px, py, pz] of [[12, 9, 0, 3.4, 0], [8, 7.5, haut.position.x, 6.4, -0.6]]) { const toit = new THREE.Mesh(new THREE.BoxGeometry(lx, 0.25, lz), blanc); toit.position.set(px, py, pz); toit.castShadow = true; v.add(toit); }
    // Grandes baies vitrées face à la mer, qui s'allument le soir
    const baie = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.6), lampes); baie.position.set(0, 1.5, 4.01); v.add(baie);
    const baie2 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.2), lampes); baie2.position.set(haut.position.x, 4.8, 2.66); v.add(baie2);
    // Côté campagne : une porte et des fenêtres en bandeau
    const dos = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), verre); dos.position.set(-1.5, 2.1, -4.01); dos.rotation.y = Math.PI; v.add(dos);
    const porte = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), bois); porte.position.set(3.2, 1.15, -4.01); porte.rotation.y = Math.PI; v.add(porte);
    // Terrasse en bois, piscine, transat
    const terrasse = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 5), bois); terrasse.position.set(0, 0.1, 6.5); terrasse.receiveShadow = true; v.add(terrasse);
    const bassin = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 3), eau); bassin.position.set(-1.5, 0.22, 11); v.add(bassin);
    const margelle = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.15, 3.8), pierre); margelle.position.set(-1.5, 0.12, 11); v.add(margelle);
    const transat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 1.9), bois); transat.position.set(3.8, 0.38, 10.5); v.add(transat);
    // Haie et portail, avec le nom de l'agent
    for (const sx of [-6.5, 6.5]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 12), haie); h.position.set(sx, 0.6, 7); v.add(h); }
    const plaque = monde.ecran(1.6, 0.5, (c, w, h) => { c.fillStyle = '#1d1a16'; c.fillRect(0, 0, w, h); c.fillStyle = '#e3c07a'; c.font = `600 ${h * 0.5}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(a.nom, w / 2, h / 2); });
    plaque.position.set(5.2, 1.3, 13.1); v.add(plaque);
    const pilier = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), pierre); pilier.position.set(5.2, 0.8, 13.3); v.add(pilier);
    g.add(v);
    murs.push({ x0: x - 5.7, x1: x + 5.7, z0: z - 4.2, z1: z + 4.2 });
    for (const sx of [-6.5, 6.5]) murs.push({ x0: x + sx - 0.5, x1: x + sx + 0.5, z0: z + 1, z1: z + 13 });
    villas.push({ id: a.id, place: { x: x + 3.8, z: z + 10.5, rot: Math.PI }, porte: { x: x + 2, z: z + 14 } });
  });

  // Palmiers sur la plage, maisons de pierre du hameau côté campagne
  const palme = texture(256, 128, (x, w, h) => {
    x.strokeStyle = '#3d7a2f'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
    for (let i = 8; i < w; i += 7) { x.strokeStyle = r() < 0.5 ? '#4f8f37' : '#35702a'; x.beginPath(); x.moveTo(i, h / 2); x.lineTo(i + 14, h / 2 - 40 * (1 - i / w) - 8); x.moveTo(i, h / 2); x.lineTo(i + 14, h / 2 + 40 * (1 - i / w) + 8); x.stroke(); }
  });
  palme.wrapS = palme.wrapT = THREE.ClampToEdgeWrapping;
  const feuille = new THREE.MeshStandardMaterial({ map: palme, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 });
  const tronc = new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 1 });
  for (let i = 0; i < (monde.mobile ? 6 : 14); i += 1) {
    const px = -130 + i * 20 + r() * 8, pz = 42 + r() * 10, hauteur = 6 + r() * 3;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, hauteur, 7), tronc); t.position.set(px, hauteur / 2, pz); t.rotation.z = (r() - 0.5) * 0.25; t.castShadow = true; g.add(t);
    for (let k = 0; k < 7; k += 1) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), feuille);
      f.geometry.translate(2, 0, 0);
      f.position.set(px, hauteur, pz); f.rotation.set(0, (k / 7) * Math.PI * 2, -0.45); g.add(f);
    }
  }
  const tuile = new THREE.MeshStandardMaterial({ color: '#8c4a33', roughness: 0.9, flatShading: true });
  for (const [x, z] of [[-120, -30], [-106, -36], [-132, -44], [110, -34]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 6), pierre); m.position.set(x, 2, z); m.castShadow = true; g.add(m);
    const toit = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), tuile); toit.position.set(x, 5.3, z); toit.rotation.y = Math.PI / 4; toit.scale.set(1, 1, 0.85); g.add(toit);
  }

  return {
    groupe: g, murs, villas, lampes,
    // On arrive sur la promenade, face aux villas, la mer dans le dos.
    depart: { x: 0, z: 37, yaw: 0 },
    sortieAscenseur: { x: 0, z: 37, yaw: 0 },
    poi: [],
    limites: { x0: -150, x1: 150, z0: -60, z1: 58 },
  };
}
