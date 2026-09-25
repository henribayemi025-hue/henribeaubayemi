// La planète (Beau : « le dézoom jusqu'à la planète »). On monte au-dessus
// de la ville, puis la Terre apparaît, éclairée comme elle l'est vraiment en
// ce moment (le soleil au-dessus du bon point du globe), avec un repère là où
// se trouve la personne. Continents : Natural Earth (domaine public), dessinés
// en texture pour Léo — aucune photo prise sur le web.
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Latitude / longitude → point sur la sphère (même repère que SphereGeometry).
export function versSphere(lat, lon, r = 1) {
  const phi = ((lon + 180) * Math.PI) / 180, theta = ((90 - lat) * Math.PI) / 180;
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r);
}

// Le point de la Terre où le soleil est au zénith, maintenant (approximation à ±1°).
export function pointSubsolaire(maintenant = Date.now()) {
  const d = new Date(maintenant);
  const debut = Date.UTC(d.getUTCFullYear(), 0, 0);
  const jour = (maintenant - debut) / 86400000;
  const lat = -23.44 * Math.cos(((2 * Math.PI) / 365) * (jour + 10));
  const heures = d.getUTCHours() + d.getUTCMinutes() / 60;
  let lon = -15 * (heures - 12);
  if (lon < -180) lon += 360; if (lon > 180) lon -= 360;
  return { lat, lon };
}

export function construirePlanete({ mobile = false, lat = null, lon = null, titre = '', sous = '' } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#02040a');
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 200);
  const tex = new THREE.TextureLoader().load(`/monde3d/terre${mobile ? '-m' : ''}.webp`);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const terre = new THREE.Mesh(new THREE.SphereGeometry(1, mobile ? 64 : 128, mobile ? 32 : 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 }));
  scene.add(terre);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 64, 32), new THREE.MeshBasicMaterial({ color: '#6fb3ff', transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(atmo);
  // Étoiles
  const n = mobile ? 700 : 1600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 30); pos.set([v.x, v.y, v.z], i * 3); }
  const etoiles = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({ color: '#dfe8ff', size: 0.12, sizeAttenuation: true }));
  scene.add(etoiles);
  // Le soleil, vraiment là où il est
  const soleil = new THREE.DirectionalLight('#fff4e0', 2.6);
  const placerSoleil = () => { const s = pointSubsolaire(Date.now()); soleil.position.copy(versSphere(s.lat, s.lon, 10)); };
  placerSoleil();
  scene.add(soleil, new THREE.AmbientLight('#8fa4c8', 0.18));
  // Le repère « vous êtes ici »
  let cible = new THREE.Vector3(0, 0, 1);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    cible = versSphere(lat, lon, 1);
    const repere = new THREE.Group();
    const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08), new THREE.MeshBasicMaterial({ color: '#e3a857' }));
    tige.position.y = 0.04; repere.add(tige);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), new THREE.MeshBasicMaterial({ color: '#e3a857' }));
    tete.position.y = 0.085; repere.add(tete);
    repere.position.copy(cible);
    repere.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cible.clone().normalize());
    const d = document.createElement('div');
    d.className = 'monde-etiquette';
    d.innerHTML = '<span><b></b><i></i></span>';
    d.querySelector('b').textContent = titre;
    d.querySelector('i').textContent = sous;
    const etiquette = new CSS2DObject(d); etiquette.position.y = 0.12; repere.add(etiquette);
    scene.add(repere);
  }
  // Caméra : du repère vers l'espace (dézoom), puis on peut faire tourner le globe.
  const etat = { distance: 1.25, voulue: 3.2, angle: 0 };
  const axe = cible.clone().normalize();
  return {
    scene, camera,
    zoom: (voulue) => { etat.voulue = voulue; },
    tourner: (d) => { etat.angle += d; },
    distance: () => etat.distance,
    recommencer: () => { etat.distance = 1.25; etat.voulue = 3.2; },
    avancer: (dt) => {
      etat.distance += (etat.voulue - etat.distance) * Math.min(1, dt * 1.6);
      const dir = axe.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), etat.angle);
      camera.position.copy(dir.multiplyScalar(etat.distance));
      camera.lookAt(0, 0, 0);
      etoiles.rotation.y += dt * 0.004;
      placerSoleil();
    },
    redimensionner: (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); },
    detruire: () => { scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); tex.dispose(); },
  };
}
