// Le moteur du monde 3D de Léo (Beau, 25/09 : « du réalisme, au minimum GTA
// San Andreas ; de vrais buildings où les gens marchent »). Outils gratuits :
// three.js (MIT), personnages Microsoft Rocketbox (MIT), décor et matières
// Poly Haven (CC0) — voir public/monde3d/LICENCES.md.
//
// Trois lieux : la réception, la salle de réunion, l'atelier. Le joueur
// dirige son avatar (Z Q S D / W A S D / flèches, Maj pour courir, E pour
// interagir, V pour la caméra), la réceptionniste l'accueille, et les agents
// ne sont là que s'ils y travaillent VRAIMENT (monde.js).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { clone as clonerSquelette } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { corpsDe, RECEPTIONNISTE, CORPS } from './monde';
import { construireVille, matieresFacades, cotesFacade } from './ville3d';
import { piloter, heurterBlocs, heurterVehicules, portiere, kmh, voler, heurterTours } from './conduite';
import { nouvelleCourse, avancerCourse, construirePortes } from './course';
import { construireMaisons } from './maisons3d';
import { construireSalleMarche } from './salle-marche3d';
import { construirePlanete } from './planete3d';

const BASE = '/monde3d/';
const ANIMS = {
  repos: 'idle_neutral_01', marche: 'walk_neutral_01', course: 'run_neutral', salut: 'wave_01',
  parle: 'gestic_talk_neutral_01', ecoute: 'gestic_listen_accept_01', assis: 'sit_table_idle_neutral_01',
  travail: 'work_table', telephone: 'cell_phone_talk_01',
};
const VITESSE = { marche: 1.45, course: 3.6 };
const RAYON = 0.32;

const genreDe = (id) => CORPS.find((c) => c.id === id)?.g || 'm';

export class Monde {
  constructor(conteneur, { mobile = false, langue = 'fr', region = null, salleMarche = false, surEvenement = () => {} } = {}) {
    this.conteneur = conteneur;
    this.salleMarche = salleMarche; // l'atelier devient une salle des marchés (salle-marche3d.js)
    this.region = region; // allure de la ville (region.js)
    this.mobile = mobile;
    this.langue = langue;
    this.emettre = surEvenement;
    this.cache = new Map();
    this.chargeur = new GLTFLoader(THREE.DefaultLoadingManager);
    this.textures = new THREE.TextureLoader();
    this.horloge = new THREE.Clock();
    this.touches = new Set();
    this.joy = { x: 0, y: 0 };
    this.cam = { mode: 'tps', yaw: Math.PI, pitch: 0.18, dist: 3.4 };
    this.agents = new Map(); // id → { perso, etiquette, lieu }
    this.lieu = null;
    this.proche = null;
    this.vivant = true;
    this.ciel = { phase: 'jour', genre: 'clair' };

    const r = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
    // Téléphone : plus net (Beau : « les pixels sont trop faibles »), l'allègement se fait ailleurs (30 images/s, ville proche seulement).
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = !mobile;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    conteneur.appendChild(r.domElement);
    r.domElement.style.touchAction = 'none';
    // Si le téléphone reprend la mémoire graphique, on le dit au lieu de rester figé.
    r.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.emettre({ type: 'perdu' }); });
    THREE.DefaultLoadingManager.onProgress = (_u, faits, total) => this.emettre({ type: 'progression', faits, total });
    this.rendu = r;

    this.etiquettes = new CSS2DRenderer();
    Object.assign(this.etiquettes.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    conteneur.appendChild(this.etiquettes.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.05, mobile ? 420 : 900);
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    this.scene.environmentIntensity = 0.9;

    // Lumière : le soleil (ombres) + le ciel ; réglés par le vrai ciel.
    this.hemi = new THREE.HemisphereLight('#dfe8f5', '#4b4038', 0.55);
    this.scene.add(this.hemi);
    this.soleil = new THREE.DirectionalLight('#fff1dc', 2.4);
    this.soleil.castShadow = true;
    this.soleil.shadow.mapSize.set(1024, 1024);
    Object.assign(this.soleil.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
    this.soleil.shadow.bias = -0.0004;
    this.soleil.shadow.normalBias = 0.03;
    this.scene.add(this.soleil, this.soleil.target);
    this.sky = new Sky();
    this.sky.scale.setScalar(800);
    this.scene.add(this.sky);

    // L'occlusion (GTAO) coûtait trop cher, même sur ordinateur : on ne l'active
    // que si on le demande explicitement.
    if (!mobile && window.location.search.includes('qualite=haute')) {
      this.composer = new EffectComposer(r);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const ao = new GTAOPass(this.scene, this.camera, 1, 1);
      ao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1.2, scale: 1 });
      ao.blendIntensity = 0.85;
      this.composer.addPass(ao);
      this.composer.addPass(new OutputPass());
    }

    this.brancherCommandes();
    this.redimensionner();
    this.surRedim = () => this.redimensionner();
    window.addEventListener('resize', this.surRedim);
  }

  // ——— Chargements ———
  charger(chemin) {
    if (!this.cache.has(chemin)) this.cache.set(chemin, this.chargeur.loadAsync(BASE + chemin));
    return this.cache.get(chemin);
  }
  matiere(nom, repetition = 4, reglages = {}) {
    const t = (fichier, srgb) => {
      const x = this.textures.load(`${BASE}matieres/${nom}/${fichier}.webp`);
      x.wrapS = x.wrapT = THREE.RepeatWrapping;
      x.repeat.set(repetition, repetition * (reglages.ratio || 1));
      x.anisotropy = 8;
      if (srgb) x.colorSpace = THREE.SRGBColorSpace;
      return x;
    };
    // Au téléphone : la couleur seule, en 512 (la mémoire graphique d'un
    // navigateur de téléphone — surtout celui de WhatsApp — est très petite).
    if (this.mobile) {
      const x = this.textures.load(`${BASE}matieres-m/${nom}/diffuse.webp`);
      x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(repetition, repetition * (reglages.ratio || 1)); x.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: x, roughness: 0.8, ...reglages.m });
    }
    const arm = t('arm', false);
    return new THREE.MeshStandardMaterial({ map: t('diffuse', true), normalMap: t('nor_gl', false), aoMap: arm, roughnessMap: arm, metalnessMap: arm, ...reglages.m });
  }
  async objet(nom, { x = 0, y = 0, z = 0, rot = 0, echelle = 1, ombre = true } = {}) {
    const g = await this.charger(`decor/${nom}.glb`);
    const o = g.scene.clone(true);
    o.position.set(x, y, z);
    o.rotation.y = rot;
    o.scale.setScalar(echelle);
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = ombre; m.receiveShadow = true;
      if (this.mobile && m.material && !m.material.userData.allege) {
        // Les cartes de relief et de rugosité ne sont jamais envoyées au téléphone.
        Object.assign(m.material, { normalMap: null, roughnessMap: null, metalnessMap: null, aoMap: null });
        m.material.userData.allege = true; m.material.needsUpdate = true;
      }
    });
    return o;
  }
  async clip(genre, nom) {
    const fichier = nom === 'telephone' && genre === 'f' ? 'f_cell_phone_talk_01' : `${genre}_${ANIMS[nom]}`;
    const g = await this.charger(`anims/${fichier}.glb`);
    const c = g.animations[0].clone();
    c.tracks = c.tracks.filter((t) => !t.name.startsWith('MotionExtractionHelper') && !/Footsteps/.test(t.name));
    // Le mouvement vers l'avant est donné par le jeu, pas par l'animation :
    // on garde la hauteur du bassin, on annule sa dérive horizontale.
    for (const t of c.tracks) {
      if (!/^Bip01\.position$/.test(t.name)) continue;
      const v = t.values; const x0 = v[0], z0 = v[2];
      for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
    }
    return c;
  }

  // ——— Personnages ———
  async personnage(corps) {
    const g = await this.charger(`${this.mobile ? 'gens-m' : 'gens'}/${corps}.glb`);
    const objet = clonerSquelette(g.scene);
    objet.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
    const genre = genreDe(corps);
    const mixer = new THREE.AnimationMixer(objet);
    const p = { objet, mixer, genre, corps, action: null, anim: null };
    p.jouer = async (nom, { fondu = 0.3, unefois = false } = {}) => {
      if (p.anim === nom) return;
      p.anim = nom;
      const c = await this.clip(genre, nom);
      if (p.anim !== nom) return;
      const a = mixer.clipAction(c);
      a.reset();
      a.setLoop(unefois ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      a.clampWhenFinished = unefois;
      a.play();
      if (p.action && p.action !== a) p.action.crossFadeTo(a, fondu, false);
      p.action = a;
    };
    await p.jouer('repos', { fondu: 0 });
    return p;
  }
  etiquette(texte, sous, photo) {
    const d = document.createElement('div');
    d.className = 'monde-etiquette';
    d.innerHTML = `${photo ? `<img src="${photo}" alt="">` : ''}<span><b></b><i></i></span>`;
    d.querySelector('b').textContent = texte;
    d.querySelector('i').textContent = sous || '';
    const o = new CSS2DObject(d);
    o.position.set(0, 2.05, 0);
    return o;
  }

  // ——— Le ciel réel (ciel.js) ———
  reglerCiel({ phase = 'jour', genre = 'clair' } = {}) {
    this.ciel = { phase, genre };
    const elev = { aube: 4, jour: 52, couchant: 2.5, nuit: -12 }[phase] ?? 45;
    const azi = { aube: 95, jour: 160, couchant: 265, nuit: 200 }[phase] ?? 160;
    const gris = ['couvert', 'pluie', 'orage', 'brouillard', 'neige'].includes(genre);
    const s = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(azi));
    const u = this.sky.material.uniforms;
    u.sunPosition.value.copy(s);
    u.turbidity.value = gris ? 14 : 4;
    u.rayleigh.value = phase === 'nuit' ? 0.2 : gris ? 0.6 : 1.6;
    u.mieCoefficient.value = gris ? 0.02 : 0.005;
    u.mieDirectionalG.value = 0.85;
    this.soleil.position.copy(s).multiplyScalar(40).add(new THREE.Vector3(0, 0, 0));
    const nuit = phase === 'nuit';
    this.soleil.intensity = nuit ? 0.25 : gris ? 0.9 : phase === 'jour' ? 2.6 : 1.4;
    this.soleil.color.set(nuit ? '#9fb3d9' : phase === 'jour' ? '#fff3e0' : '#ffb27a');
    this.hemi.intensity = nuit ? 0.25 : gris ? 0.7 : 0.55;
    this.rendu.toneMappingExposure = nuit ? 0.85 : 1.0;
    this.scene.fog = gris ? new THREE.Fog(nuit ? '#1a2030' : '#aeb6c0', 30, genre === 'brouillard' ? 60 : 180) : null;
    // Les reflets du vrai ciel dans les vitres de la ville.
    if (!this.pm) this.pm = new THREE.PMREMGenerator(this.rendu);
    const sc = new THREE.Scene();
    const s2 = new Sky(); s2.scale.setScalar(1000);
    for (const k of Object.keys(u)) s2.material.uniforms[k].value = u[k].value?.clone ? u[k].value.clone() : u[k].value;
    sc.add(s2);
    this.envCiel?.dispose();
    this.envCiel = this.pm.fromScene(sc, 0, 0.1, 2000).texture;
    this.niveauNuit = nuit ? 1 : phase === 'jour' ? 0 : 0.55;
    this.villeVivante?.reglerNuit(this.niveauNuit);
    if (this.lieux?.maisons) this.lieux.maisons.lampes.emissiveIntensity = (this.niveauNuit || 0) * 1.4;
    this.villeVivante?.majEnv(this.envCiel);
  }

  // ——— La ville vue par les baies ———
  ville(groupe, { cote = 'x-', loin = 26 } = {}) {
    const sol = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#6f6a64', roughness: 0.95 }));
    sol.rotation.x = -Math.PI / 2;
    sol.position.y = -0.02;
    sol.receiveShadow = true;
    groupe.add(sol);
    const tex = this.texFenetres();
    this.fenetresVille = [];
    let n = 0;
    for (let i = 0; i < 70; i += 1) {
      n = (n * 9301 + 49297 + i * 17) % 233280;
      const r = n / 233280;
      const h = 14 + r * r * 70, l = 12 + (i % 5) * 5;
      const m = new THREE.MeshStandardMaterial({ color: ['#8fa3b8', '#b7c3cf', '#6f8296', '#a9a39a'][i % 4], roughness: 0.3, metalness: 0.35, emissive: '#ffd59a', emissiveMap: tex, emissiveIntensity: 0 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, l), m);
      const rang = Math.floor(i / 14), pos = (i % 14) - 7;
      const d = loin + rang * 60 + (r * 25);
      if (cote === 'x-') b.position.set(-d, h / 2, pos * 34 + r * 12);
      else b.position.set(pos * 34 + r * 12, h / 2, -d);
      groupe.add(b);
      this.fenetresVille.push(b);
    }
  }
  texFenetres() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 16; i += 1) for (let j = 0; j < 32; j += 1) {
      if (((i * 31 + j * 17) % 7) < 3) { x.fillStyle = '#fff'; x.fillRect(i * 8 + 2, j * 8 + 2, 4, 5); }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 4);
    return t;
  }
  ecran(largeur, hauteur, dessiner) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = Math.round(1024 * hauteur / largeur);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    m.userData.redessiner = (donnees) => { dessiner(c.getContext('2d'), c.width, c.height, donnees); t.needsUpdate = true; };
    m.userData.redessiner({});
    return m;
  }

  // ——— Les lieux ———
  mur(groupe, murs, x, z, l, p, h, matiere, collision = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), matiere);
    m.position.set(x, h / 2, z);
    m.receiveShadow = true;
    m.castShadow = true;
    groupe.add(m);
    if (collision) murs.push({ x0: x - l / 2, x1: x + l / 2, z0: z - p / 2, z1: z + p / 2 });
    return m;
  }
  vitre(groupe, x, z, l, h, rot = 0) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshStandardMaterial({ color: '#dcecf5', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
    v.position.set(x, h / 2, z);
    v.rotation.y = rot;
    groupe.add(v);
    // Montants
    const acier = new THREE.MeshStandardMaterial({ color: '#2b2f36', metalness: 0.9, roughness: 0.35 });
    const n = Math.round(l / 2.4);
    for (let i = 0; i <= n; i += 1) {
      const mt = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.12), acier);
      const d = -l / 2 + (i * l) / n;
      mt.position.set(x + (rot ? 0 : d), h / 2, z + (rot ? d : 0));
      groupe.add(mt);
    }
  }
  // Les plafonniers : des disques lumineux, sans lumière ponctuelle (chacune
  // alourdissait le calcul de chaque pixel de la scène).
  lampes(groupe, points) {
    const m = new THREE.MeshBasicMaterial({ color: '#fff3dc' });
    for (const [x, z, y = 5.55] of points) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), m);
      d.rotation.x = Math.PI / 2; d.position.set(x, y, z);
      groupe.add(d);
    }
  }
  plafond(groupe, l, p, h, couleur = '#f2efe9') {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(l, p), new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.9 }));
    c.rotation.x = Math.PI / 2;
    c.position.y = h;
    groupe.add(c);
  }
  sol(groupe, l, p, matiere) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(l, p), matiere);
    s.rotation.x = -Math.PI / 2;
    s.receiveShadow = true;
    groupe.add(s);
  }
  ascenseur(groupe, murs, x, z, rot) {
    const acier = new THREE.MeshStandardMaterial({ color: '#b9bec6', metalness: 1, roughness: 0.28 });
    const cadre = new THREE.MeshStandardMaterial({ color: '#2a2d33', metalness: 0.8, roughness: 0.4 });
    const g = new THREE.Group();
    const f = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 0.12), cadre); f.position.y = 1.45; g.add(f);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.88, 2.6, 0.06), acier); p.position.set(s * 0.45, 1.3, 0.07); g.add(p); }
    const e = this.ecran(0.7, 0.18, (x2, w, h) => { x2.fillStyle = '#05080d'; x2.fillRect(0, 0, w, h); x2.fillStyle = '#e3a857'; x2.font = `bold ${h * 0.62}px system-ui`; x2.textAlign = 'center'; x2.fillText('▲ ▼', w / 2, h * 0.75); });
    e.position.set(0, 3.1, 0.07); g.add(e);
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    groupe.add(g);
    // On ne traverse pas l'ascenseur.
    if (Math.abs(Math.sin(rot)) > 0.5) murs.push({ x0: x - 0.45, x1: x + 0.3, z0: z - 1.1, z1: z + 1.1 });
    else murs.push({ x0: x - 1.1, x1: x + 1.1, z0: z - 0.45, z1: z + 0.3 });
    return g;
  }
  async construireHall(nom) {
    const g = new THREE.Group();
    const ajouts = [];
    const A = (p) => ajouts.push(p.then((o) => g.add(o)));
    const murs = [];
    const marbre = this.matiere('terrazzo_tiles', 4);
    const platre = new THREE.MeshStandardMaterial({ color: '#ece7df', roughness: 0.88 });
    this.sol(g, 24, 18, marbre);
    this.plafond(g, 24, 18, 5.6);
    this.mur(g, murs, 0, -9, 24, 0.3, 5.6, platre);            // fond
    this.mur(g, murs, 12, 0, 0.3, 18, 5.6, platre);            // droite (ascenseurs)
    this.vitre(g, -12, 0, 18, 5.6, Math.PI / 2);                 // gauche : baie sur la ville
    murs.push({ x0: -12.2, x1: -11.9, z0: -9, z1: 9 });
    this.vitre(g, -7, 9, 10, 5.6);                               // entrée vitrée…
    this.vitre(g, 7, 9, 10, 5.6);
    murs.push({ x0: -12.2, x1: -2, z0: 8.9, z1: 9.2 }, { x0: 2, x1: 12.2, z0: 8.9, z1: 9.2 });  // …avec une porte au milieu
    const auvent = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), new THREE.MeshStandardMaterial({ color: '#23262b', metalness: 0.7, roughness: 0.4 }));
    auvent.position.set(0, 4.2, 10.4); auvent.castShadow = true; g.add(auvent);
    // L'immeuble vu de dehors : sa tour de verre au-dessus du hall.
    // Même façade de verre photo-réaliste que les tours de la ville (fenêtres allumées la nuit).
    const verreTour = matieresFacades(this, this.envCiel).find((f) => f.nom === 'verre');
    const tour = new THREE.Mesh(cotesFacade(24.4, 70, 18.4, verreTour.taille, () => 0), verreTour.mat); tour.position.set(0, 5.6 + 35, 0); g.add(tour);
    const toitTour = new THREE.Mesh(new THREE.BoxGeometry(24.8, 0.8, 18.8), new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.6, metalness: 0.4 })); toitTour.position.y = 5.6 + 70.4; g.add(toitTour);
    const corniche = new THREE.Mesh(new THREE.BoxGeometry(24.8, 0.5, 18.8), new THREE.MeshStandardMaterial({ color: '#23262b', metalness: 0.7, roughness: 0.4 })); corniche.position.y = 5.85; g.add(corniche);
    // Un vrai immeuble vu de dehors (Beau : « pas comme un vrai bâtiment »).
    // Socle en pierre sur les côtés sans vitrine, ailettes de bronze, poteaux d'angle.
    const metalSombre = new THREE.MeshStandardMaterial({ color: '#23262b', metalness: 0.7, roughness: 0.4 });
    const bronze = new THREE.MeshStandardMaterial({ color: '#6e5638', metalness: 0.8, roughness: 0.35 });
    const pierreExt = this.matiere('marble_tiles', 3, { m: { color: '#efe6d6' } });
    const dos = new THREE.Mesh(new THREE.BoxGeometry(24.4, 5.6, 0.22), pierreExt); dos.position.set(0, 2.8, -9.28); dos.receiveShadow = true; g.add(dos);
    const flanc = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.6, 18.4), pierreExt); flanc.position.set(12.28, 2.8, 0); flanc.receiveShadow = true; g.add(flanc);
    for (let x = -10; x <= 10; x += 2.5) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5.2, 0.4), bronze); a.position.set(x, 2.8, -9.55); g.add(a); }
    for (let z = -7.5; z <= 7.5; z += 2.5) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.2, 0.14), bronze); a.position.set(12.55, 2.8, z); g.add(a); }
    const porteService = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, 0.1), metalSombre); porteService.position.set(-6.25, 1.5, -9.42); g.add(porteService);
    for (const [x, z] of [[-12.25, -9.25], [12.25, -9.25], [-12.25, 9.25], [12.25, 9.25]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.55, 5.9, 0.55), metalSombre); c.position.set(x, 2.95, z); c.castShadow = true; g.add(c); }
    // Le nom de l'entreprise sur la façade, au-dessus de l'entrée, et en couronne tout en haut.
    const lettres = (l, h, taille) => this.ecran(l, h, (x2, w, hh) => { x2.clearRect(0, 0, w, hh); x2.fillStyle = '#f3dfb3'; x2.shadowColor = '#e3a857'; x2.shadowBlur = hh * 0.12; x2.font = `600 ${hh * taille}px Georgia, serif`; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(nom || 'Léo', w / 2, hh / 2); });
    const nomFacade = lettres(12, 1.6, 0.7); nomFacade.material.transparent = true; nomFacade.position.set(0, 7.3, 9.36); g.add(nomFacade);
    const nomFlanc = lettres(10, 1.4, 0.7); nomFlanc.material.transparent = true; nomFlanc.position.set(12.36, 7.3, 0); nomFlanc.rotation.y = Math.PI / 2; g.add(nomFlanc);
    const haut = 5.6 + 70;
    for (const [l, rot, x, z] of [[20, 0, 0, 9.36], [15, Math.PI / 2, 12.36, 0], [15, -Math.PI / 2, -12.36, 0], [20, Math.PI, 0, -9.36]]) {
      const n = lettres(l, 3, 0.62); n.material.transparent = true; n.position.set(x, haut - 3.4, z); n.rotation.y = rot; g.add(n);
    }
    // Le toit : acrotère, locaux techniques, mât avec son feu rouge, lisere lumineux.
    const acro = [[24.8, 0.2, 0, 9.3], [24.8, 0.2, 0, -9.3], [0.2, 18.8, 12.3, 0], [0.2, 18.8, -12.3, 0]];
    for (const [lx, lz, x, z] of acro) { const a = new THREE.Mesh(new THREE.BoxGeometry(lx, 1.3, lz), metalSombre); a.position.set(x, haut + 1.45, z); g.add(a); }
    const lisere = new THREE.MeshBasicMaterial({ color: '#ffe7b8' });
    for (const [lx, lz, x, z] of acro) { const a = new THREE.Mesh(new THREE.BoxGeometry(lx + 0.02, 0.12, lz + 0.02), lisere); a.position.set(x, haut + 2.1, z); g.add(a); }
    const technique = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 6.5), new THREE.MeshStandardMaterial({ color: '#5c6066', roughness: 0.7, metalness: 0.3 })); technique.position.set(-3, haut + 2.8, -2); technique.castShadow = true; g.add(technique);
    for (let i = 0; i < 6; i += 1) { const v = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 0.1), metalSombre); v.position.set(-3, haut + 1.4 + i * 0.5, 1.28); g.add(v); }
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 14, 8), metalSombre); mat.position.set(5, haut + 7.8, 2); g.add(mat);
    const feu = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); feu.position.set(5, haut + 15, 2); g.add(feu);
    this.feuMat = feu;
    // Le comptoir d'accueil
    const bois = this.matiere('herringbone_parquet', 1.5);
    const pierre = this.matiere('terrazzo_tiles', 1, { m: { color: '#f7f5f2' } });
    const comptoir = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.08, 0.9), bois); comptoir.position.set(0, 0.54, -5.2); comptoir.castShadow = comptoir.receiveShadow = true; g.add(comptoir);
    const dessus = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.06, 1.05), pierre); dessus.position.set(0, 1.11, -5.2); dessus.castShadow = true; g.add(dessus);
    murs.push({ x0: -2.7, x1: 2.7, z0: -5.7, z1: -4.7 });
    const panneau = new THREE.Mesh(new THREE.BoxGeometry(9, 4.6, 0.08), this.matiere('herringbone_parquet', 2, { m: { color: '#b88a5e' } }));
    panneau.position.set(0, 2.3, -8.8); panneau.receiveShadow = true; g.add(panneau);
    // Le nom de l'entreprise, lettres de laiton sur le mur du fond
    const enseigne = this.ecran(7, 1.1, (x2, w, h) => { x2.clearRect(0, 0, w, h); x2.fillStyle = '#c9a35a'; x2.font = `600 ${h * 0.62}px Georgia, serif`; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(nom || 'Léo', w / 2, h / 2); });
    enseigne.material.transparent = true;
    enseigne.position.set(0, 3.3, -8.74);
    g.add(enseigne);
    // L'écran des faits du jour (vraies données)
    const faits = this.ecran(3.2, 1.8, (x2, w, h, d) => {
      x2.fillStyle = '#0b1120'; x2.fillRect(0, 0, w, h);
      x2.fillStyle = '#e3a857'; x2.font = `bold ${h * 0.09}px system-ui`; x2.fillText(d.titre || '', w * 0.06, h * 0.17);
      x2.fillStyle = '#edf1f8'; x2.font = `${h * 0.075}px system-ui`;
      (d.lignes || []).slice(0, 6).forEach((l, i) => x2.fillText(l, w * 0.06, h * (0.34 + i * 0.12)));
    });
    faits.position.set(7.2, 2.3, -8.83);
    g.add(faits);
    this.ecranFaits = faits;
    if (this.faits) faits.userData.redessiner(this.faits);
    // Salon d'attente
    A(this.objet('sofa_03', { x: -8.4, z: 1.5, rot: Math.PI / 2 }));
    A(this.objet('modern_arm_chair_01', { x: -5.6, z: -0.6, rot: -Math.PI / 2 - 0.3 }));
    A(this.objet('modern_arm_chair_01', { x: -5.6, z: 3.4, rot: -Math.PI / 2 + 0.3 }));
    A(this.objet('modern_coffee_table_01', { x: -7.1, z: 1.5 }));
    murs.push({ x0: -9.4, x1: -5, z0: -1.4, z1: 4.3 });
    for (const [x, z] of [[-10.8, -7.8], [10.8, -7.8], [-10.8, 7.8], [4.2, -7.6], [-4.2, -7.6]]) {
      A(this.objet('potted_plant_04', { x, z, echelle: 3.2 }));
      murs.push({ x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4 });
    }
    for (const [x, z] of [[-6, -3], [6, -3], [-6, 4], [6, 4], [0, 0]]) A(this.objet('modern_ceiling_lamp_01', { x, y: 5.6 - 0.9, z, ombre: false }));
    this.lampes(g, [[-6, -3], [6, -3], [-6, 4], [6, 4], [0, -1]]);
    // Un escalier hélicoïdal rouge (photo de Beau), près de la baie.
    const rouge = new THREE.MeshStandardMaterial({ color: '#c8201f', roughness: 0.35, metalness: 0.1 });
    const blancMarche = new THREE.MeshStandardMaterial({ color: '#f2f0ec', roughness: 0.5 });
    const helice = new THREE.Group();
    for (let i = 0; i < 26; i += 1) {
      const a = (i / 26) * Math.PI * 2.2, y = 0.2 + i * 0.205;
      const marche = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.45), blancMarche); marche.position.set(Math.cos(a) * 1.05, y, Math.sin(a) * 1.05); marche.rotation.y = -a; helice.add(marche);
      const lim = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.5), rouge); lim.position.set(Math.cos(a) * 1.85, y + 0.25, Math.sin(a) * 1.85); lim.rotation.y = -a; helice.add(lim);
    }
    const fut = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.6, 20), rouge); fut.position.y = 2.8; helice.add(fut);
    helice.position.set(-8.6, 0, -5.6);
    helice.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    g.add(helice);
    murs.push({ x0: -10.6, x1: -6.6, z0: -7.6, z1: -3.6 });
    // Un comptoir-bar arrondi avec tabourets (photo de Beau), côté entrée.
    const boisClair = this.matiere('herringbone_parquet', 1, { m: { color: '#d9b98f' } });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.05, 40, 1, true, Math.PI * 0.15, Math.PI * 1.1), boisClair);
    bar.material.side = THREE.DoubleSide; bar.position.set(7.2, 0.52, 4.6); bar.castShadow = true; g.add(bar);
    const plan = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.35, 40, 1, Math.PI * 0.15, Math.PI * 1.1), new THREE.MeshStandardMaterial({ color: '#f5f3ef', roughness: 0.3, side: THREE.DoubleSide }));
    plan.rotation.x = -Math.PI / 2; plan.position.set(7.2, 1.06, 4.6); g.add(plan);
    murs.push({ x0: 5, x1: 9.4, z0: 2.4, z1: 6.8 });
    const noirTab = new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.5, metalness: 0.3 });
    const cuir = new THREE.MeshStandardMaterial({ color: '#b5612f', roughness: 0.6 });
    const placesBar = [];
    for (let i = 0; i < 6; i += 1) {
      const a = Math.PI * 0.15 + (i + 0.5) * (Math.PI * 1.1) / 6;
      const x = 7.2 + Math.cos(a) * 2.75, z = 4.6 - Math.sin(a) * 2.75;
      placesBar.push({ x: 7.2 + Math.cos(a) * 3.2, z: 4.6 - Math.sin(a) * 3.2, rot: Math.atan2(-Math.cos(a), Math.sin(a)) });
      const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72), noirTab); pied.position.set(x, 0.36, z); g.add(pied);
      const siege = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 18), cuir); siege.position.set(x, 0.75, z); siege.castShadow = true; g.add(siege);
    }
    // Des bandeaux lumineux au plafond (photo du couloir).
    const led = new THREE.MeshBasicMaterial({ color: '#fffaf0' });
    for (const x of [-4, 0, 4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 14), led); b.position.set(x, 5.58, 0); g.add(b); }
    // Des cadres aux murs.
    { const t = this.peinture(1.4, 1.0, 1); t.position.set(-11.6, 2.5, 5.5); t.rotation.y = Math.PI / 2; g.add(t); }
    { const t = this.peinture(1.4, 1.0, 2); t.position.set(11.8, 2.5, 5.5); t.rotation.y = -Math.PI / 2; g.add(t); }
    // Ascenseurs à droite
    this.ascenseur(g, murs, 11.84, -3, -Math.PI / 2);
    this.ascenseur(g, murs, 11.84, 1.2, -Math.PI / 2);

    const poi = [
      { type: 'receptionniste', x: 0, z: -4.2, rayon: 2.4 },
      { type: 'ascenseur', x: 11, z: -3, rayon: 1.8 },
      { type: 'ascenseur', x: 11, z: 1.2, rayon: 1.8 },
      { type: 'ecran', x: 7.2, z: -8, rayon: 2.2 },
      { type: 'escalier', x: -8.6, z: -3.2, rayon: 1.6 },
    ];
    await Promise.all(ajouts);
    return { groupe: g, murs, bar: placesBar, depart: { x: 0, z: 6.5, yaw: 0 }, poi, limites: { x0: -196, x1: 196, z0: -196, z1: 196 }, interieur: { x0: -12, x1: 12, z0: -9, z1: 9 }, sortieAscenseur: { x: 10.2, z: -1, yaw: Math.PI / 2 } };
  }
  async construireReunion() {
    const g = new THREE.Group();
    const ajouts = [];
    const A = (p) => ajouts.push(p.then((o) => g.add(o)));
    const murs = [];
    const moquette = new THREE.MeshStandardMaterial({ color: '#8e8a84', roughness: 0.98 });
    const platre = new THREE.MeshStandardMaterial({ color: '#ebe6de', roughness: 0.88 });
    this.sol(g, 14, 11, moquette);
    // Mur boisé à étagères (photo de Beau)
    const noyer = this.matiere('herringbone_parquet', 1.2, { m: { color: '#9a6b43' } });
    const panneau = new THREE.Mesh(new THREE.BoxGeometry(14, 3.4, 0.1), noyer); panneau.position.set(0, 1.7, 5.3); g.add(panneau);
    for (let i = 0; i < 4; i += 1) { const et = new THREE.Mesh(new THREE.BoxGeometry(5, 0.04, 0.32), noyer); et.position.set(3.6, 0.8 + i * 0.6, 5.1); g.add(et); }
    for (let i = 0; i < 18; i += 1) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06 + (i % 3) * 0.02, 0.28 + (i % 4) * 0.04, 0.22), new THREE.MeshStandardMaterial({ color: ['#7b2d26', '#1f3b57', '#c9a35a', '#2f4f3a', '#e8e1d5'][i % 5], roughness: 0.8 })); l.position.set(1.4 + (i % 9) * 0.5, 1.0 + Math.floor(i / 9) * 1.2, 5.1); g.add(l); }
    // Suspensions au-dessus de la table
    const laiton = new THREE.MeshStandardMaterial({ color: '#c9a35a', metalness: 1, roughness: 0.3, emissive: '#ffd9a0', emissiveIntensity: 0.4 });
    for (const x of [-2, 0, 2]) {
      const abat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.2, 24, 1, true), laiton); abat.position.set(x, 2.4, 0); g.add(abat);
      const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.0), laiton); fil.position.set(x, 2.95, 0); g.add(fil);
    }
    this.plafond(g, 14, 11, 3.4);
    this.mur(g, murs, 0, 5.5, 14, 0.3, 3.4, platre);
    this.mur(g, murs, 7, 0, 0.3, 11, 3.4, platre);
    this.mur(g, murs, 0, -5.5, 14, 0.3, 3.4, platre, true).visible = false;
    this.vitre(g, 0, -5.4, 14, 3.4);
    this.vitre(g, -7, 0, 11, 3.4, Math.PI / 2);
    murs.push({ x0: -7.2, x1: -6.9, z0: -5.5, z1: 5.5 });
    const bois = this.matiere('herringbone_parquet', 1.2, { m: { color: '#8a6a4a' } });
    const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.07, 1.8), bois); table.position.set(0, 0.76, 0); table.castShadow = table.receiveShadow = true; g.add(table);
    for (const s of [-2.6, 2.6]) { const pied = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.74, 1.2), new THREE.MeshStandardMaterial({ color: '#22252b', metalness: 0.8, roughness: 0.4 })); pied.position.set(s, 0.37, 0); g.add(pied); }
    murs.push({ x0: -3.4, x1: 3.4, z0: -1.4, z1: 1.4 });
    this.places = [];
    const chaise = [];
    for (let i = 0; i < 4; i += 1) for (const cote of [-1, 1]) chaise.push([-2.25 + i * 1.5, cote * 1.25, cote > 0 ? Math.PI : 0]);
    for (const [x, z, rot] of chaise) {
      const f = this.fauteuil(true); f.position.set(x, 0, z); f.rotation.y = rot; g.add(f);
      murs.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 });
      this.places.push({ x, z: z + (z > 0 ? 0.08 : -0.08), rot: z > 0 ? Math.PI : 0 });
    }
    const ecran = this.ecran(3.4, 1.9, (x2, w, h, d) => {
      x2.fillStyle = '#0b1120'; x2.fillRect(0, 0, w, h);
      x2.fillStyle = '#5fc8c0'; x2.font = `bold ${h * 0.08}px system-ui`; x2.fillText(d.etat || '', w * 0.06, h * 0.16);
      x2.fillStyle = '#edf1f8'; x2.font = `600 ${h * 0.1}px system-ui`;
      const mots = String(d.sujet || '').split(' '); let ligne = ''; let y = h * 0.36;
      for (const m of mots) { if ((ligne + m).length > 30) { x2.fillText(ligne, w * 0.06, y); ligne = ''; y += h * 0.13; } ligne += `${m} `; }
      x2.fillText(ligne, w * 0.06, y);
    });
    ecran.position.set(6.83, 1.8, 0); ecran.rotation.y = -Math.PI / 2; g.add(ecran);
    this.ecranReunion = ecran;
    A(this.objet('wall_clock', { x: 0, y: 2.6, z: 5.33, rot: Math.PI, ombre: false }));
    A(this.objet('potted_plant_04', { x: 6.2, z: 4.7, echelle: 1.4 }));
    this.lampes(g, [[-2.5, 0, 3.38], [2.5, 0, 3.38], [0, 0, 3.38]]);
    this.ascenseur(g, murs, -3.5, 5.33, Math.PI);

    await Promise.all(ajouts);
    return { groupe: g, murs, places: this.places, ecran: this.ecranReunion, depart: { x: -3.5, z: 3.2, yaw: 0 }, poi: [{ type: 'ascenseur', x: -3.5, z: 4.4, rayon: 1.6 }, { type: 'table', x: 0, z: 0, rayon: 3.6 }], limites: { x0: -6.7, x1: 6.7, z0: -5.2, z1: 5.2 }, sortieAscenseur: { x: -3.5, z: 3.0, yaw: 0 } };
  }
  async construireAtelier() {
    // L'atelier (Beau, 25/09 : « plus réaliste, avec des tableaux, des
    // fleurs, des détails ; c'est trop vide ») : postes en bois clair à
    // doubles écrans, fauteuils, caissons, plantes, tableaux, tableau blanc,
    // étagères, coin café.
    const g = new THREE.Group();
    const ajouts = [];
    const A = (p) => ajouts.push(p.then((o) => g.add(o)));
    const murs = [];
    const sol = this.matiere('herringbone_parquet', 6, { m: { color: '#e2cfb3' } });
    const platre = new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: 0.88 });
    this.sol(g, 22, 14, sol);
    this.plafond(g, 22, 14, 3.6, '#f1efeb');
    this.mur(g, murs, 0, 7, 22, 0.3, 3.6, platre);
    this.mur(g, murs, 11, 0, 0.3, 14, 3.6, platre);
    this.vitre(g, 0, -7, 22, 3.6); murs.push({ x0: -11, x1: 11, z0: -7.2, z1: -6.9 });
    this.vitre(g, -11, 0, 14, 3.6, Math.PI / 2); murs.push({ x0: -11.2, x1: -10.9, z0: -7, z1: 7 });
    const bois = this.matiere('herringbone_parquet', 0.6, { m: { color: '#d6bb95' } });
    const caisson = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.55 });
    const noir = new THREE.MeshStandardMaterial({ color: '#15171b', metalness: 0.4, roughness: 0.35 });
    const postes = [];
    for (let rang = 0; rang < 2; rang += 1) for (let i = 0; i < 4; i += 1) {
      const x = -6.5 + i * 4, z = -2.8 + rang * 4.6;
      const plateau = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.85), bois); plateau.position.set(x, 0.74, z); plateau.castShadow = plateau.receiveShadow = true; g.add(plateau);
      for (const sx of [-0.85, 0.85]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.75), caisson); p.position.set(x + sx, 0.36, z); g.add(p); }
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.55), caisson); c.position.set(x + 0.55, 0.29, z); g.add(c);
      // deux écrans : le gauche montre le vrai travail, le droit un terminal
      const ecran = this.ecran(0.58, 0.34, (x2, w, h, d) => {
        x2.fillStyle = d.actif ? '#0d1117' : '#07090c'; x2.fillRect(0, 0, w, h);
        if (!d.actif) return;
        x2.fillStyle = '#e3a857'; x2.font = `bold ${h * 0.1}px ui-monospace, monospace`; x2.fillText(d.nom || '', w * 0.05, h * 0.14);
        x2.font = `${h * 0.075}px ui-monospace, monospace`;
        const couleurs = ['#7ee787', '#79c0ff', '#d2a8ff', '#edf1f8'];
        const txt = String(d.texte || '').replace(/\s+/g, ' ');
        for (let l = 0; l < 8; l += 1) { x2.fillStyle = couleurs[l % 4]; x2.fillText(txt.slice(l * 34, l * 34 + 34), w * 0.05, h * (0.28 + l * 0.09)); }
      });
      for (const [dx, rot] of [[-0.33, 0.12], [0.33, -0.12]]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.03), noir); m.position.set(x + dx, 1.08, z - 0.25); m.rotation.y = rot; g.add(m);
        const pied = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), noir); pied.position.set(x + dx, 0.88, z - 0.27); g.add(pied);
      }
      ecran.position.set(x - 0.33, 1.08, z - 0.232); ecran.rotation.y = 0.12; g.add(ecran);
      const term = this.ecran(0.58, 0.34, (x2, w, h) => { x2.fillStyle = '#0b0f14'; x2.fillRect(0, 0, w, h); x2.fillStyle = '#5fc8c0'; x2.font = `${h * 0.075}px ui-monospace, monospace`; ['$ npm test', '✓ tests', '$ git status', 'on branch leo/'].forEach((l, k) => x2.fillText(l, w * 0.05, h * (0.18 + k * 0.12))); });
      term.position.set(x + 0.33, 1.08, z - 0.232); term.rotation.y = -0.12; g.add(term);
      const clavier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.14), noir); clavier.position.set(x, 0.77, z + 0.08); g.add(clavier);
      const f = this.fauteuil(); f.position.set(x, 0, z + 0.75); f.rotation.y = 0; g.add(f);
      if ((i + rang) % 2 === 0) A(this.objet('potted_plant_02', { x: x - 0.75, y: 0.76, z: z - 0.2, echelle: 0.5, ombre: false }));
      postes.push({ x, z: z + 0.7, rot: Math.PI, ecran });
      murs.push({ x0: x - 0.95, x1: x + 0.95, z0: z - 0.45, z1: z + 0.45 }, { x0: x - 0.28, x1: x + 0.28, z0: z + 0.5, z1: z + 1.0 });
    }
    this.postes = postes;
    // Le tableau blanc : les tâches de code en cours (données réelles, redessinées)
    const tableau = this.ecran(4, 1.6, (x2, w, h, d) => {
      x2.fillStyle = '#fbfbf8'; x2.fillRect(0, 0, w, h);
      x2.fillStyle = '#1f2a44'; x2.font = `bold ${h * 0.1}px system-ui`; x2.fillText(this.langue === 'en' ? 'In progress' : 'En cours', w * 0.04, h * 0.15);
      (d.lignes || []).slice(0, 5).forEach((l, k) => { x2.fillStyle = ['#c25e38', '#2a9d8f', '#e09f3e', '#264653', '#7b2d26'][k]; x2.fillRect(w * 0.04, h * (0.26 + k * 0.14), w * 0.012, h * 0.09); x2.fillStyle = '#222'; x2.font = `${h * 0.075}px system-ui`; x2.fillText(String(l).slice(0, 60), w * 0.07, h * (0.33 + k * 0.14)); });
    });
    tableau.position.set(-3, 1.9, 6.83); tableau.rotation.y = Math.PI; g.add(tableau);
    this.tableauAtelier = tableau;
    // Tableaux et étagères aux murs, plantes, coin café
    { const t = this.peinture(1.4, 1.0, 3); t.position.set(3, 2.3, 6.78); t.rotation.y = Math.PI; g.add(t); }
    { const t = this.peinture(1.4, 1.0, 4); t.position.set(10.8, 2.3, -3); t.rotation.y = -Math.PI / 2; g.add(t); }
    { const t = this.peinture(1.4, 1.0, 5); t.position.set(10.8, 2.3, 1.5); t.rotation.y = -Math.PI / 2; g.add(t); }
    const etagere = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.3), bois);
    for (let k = 0; k < 3; k += 1) { const e = etagere.clone(); e.position.set(6.5, 1.1 + k * 0.5, 6.7); g.add(e); }
    for (let k = 0; k < 14; k += 1) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.22), new THREE.MeshStandardMaterial({ color: ['#7b2d26', '#1f3b57', '#c9a35a', '#2f4f3a', '#e8e1d5'][k % 5], roughness: 0.8 })); l.position.set(5.5 + (k % 7) * 0.3, 1.27 + Math.floor(k / 7) * 0.5, 6.68); g.add(l); }
    for (const [x, z, e] of [[-10.2, 6.2, 1.6], [10.2, -6.2, 1.6], [-10.2, -6.2, 1.4], [0, 6.3, 1.3]]) A(this.objet('potted_plant_04', { x, z, echelle: e }));
    for (let i = 0; i < 5; i += 1) A(this.objet('planter_box_01', { x: -9 + i * 4.5, z: -6.4, echelle: 1.1 }));
    A(this.objet('modern_coffee_table_01', { x: -8.8, z: 4.8 }));
    A(this.objet('modern_arm_chair_01', { x: -9.8, z: 3.6, rot: 0.6 }));
    A(this.objet('modern_arm_chair_01', { x: -7.6, z: 3.6, rot: -0.6 }));
    murs.push({ x0: -10.5, x1: -7, z0: 3.1, z1: 5.4 });
    this.lampes(g, [[-6.5, -2.8, 3.58], [-2.5, -2.8, 3.58], [1.5, -2.8, 3.58], [5.5, -2.8, 3.58], [-4.5, 1.8, 3.58], [3.5, 1.8, 3.58]]);
    this.ascenseur(g, murs, 8, 6.83, Math.PI);
    await Promise.all(ajouts);
    return { groupe: g, murs, postes, depart: { x: 6.5, z: 4.6, yaw: 0.5 }, poi: [{ type: 'ascenseur', x: 8, z: 5.9, rayon: 1.6 }], limites: { x0: -10.7, x1: 10.7, z0: -6.7, z1: 6.7 }, sortieAscenseur: { x: 6.5, z: 4.4, yaw: 0.5 } };
  }

  // ——— Un étage par département (Beau, 25/09 : « il n'y a pas plusieurs
  // étages » ; photos : postes en bois clair, caissons blancs, fauteuils
  // noirs en maille, plantes, salle vitrée à montants noirs, grandes baies).
  // Chaque agent du département a SON bureau, avec son nom ; il n'y est assis
  // que s'il travaille vraiment en ce moment.
  fauteuil(orange = false) {
    const g = new THREE.Group();
    const noir = new THREE.MeshStandardMaterial({ color: '#16181b', roughness: 0.6, metalness: 0.2 });
    const maille = new THREE.MeshStandardMaterial({ color: orange ? '#c8692f' : '#1d2024', roughness: 0.95 });
    const assise = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.07, 0.46, 3, 0.03), maille); assise.position.y = 0.47; g.add(assise);
    const dos = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.52, 0.04, 3, 0.018), maille); dos.position.set(0, 0.8, 0.23); dos.rotation.x = -0.12; g.add(dos);
    const tete = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.1, 0.04, 3, 0.018), maille); tete.position.set(0, 1.13, 0.28); g.add(tete);
    const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4), noir); pied.position.y = 0.26; g.add(pied);
    for (let i = 0; i < 5; i += 1) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.32), noir); b.position.y = 0.06; b.rotation.y = (i / 5) * Math.PI * 2; b.translateZ(0.16); g.add(b); }
    for (const x of [-0.25, 0.25]) { const a = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.03, 0.26, 2, 0.012), noir); a.position.set(x, 0.66, 0.02); g.add(a); const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.17), noir); s2.position.set(x, 0.57, 0.1); g.add(s2); }
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    return g;
  }
  // Une toile abstraite encadrée, peinte ici (aucune œuvre d'autrui copiée).
  peinture(l, h, graine = 1) {
    let n = graine * 9301 + 49297; const r = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; };
    const g = new THREE.Group();
    const toile = this.ecran(l, h, (x, w, hh) => {
      const pal = [['#f3ead9', '#c25e38', '#e09f3e', '#264653', '#2a9d8f'], ['#efe7dc', '#7b2d26', '#c9a35a', '#1f3b57', '#d98e73'], ['#f5f1ea', '#2f4f3a', '#e3a857', '#b5612f', '#1d2a57']][graine % 3];
      x.fillStyle = pal[0]; x.fillRect(0, 0, w, hh);
      for (let k = 0; k < 7; k += 1) {
        x.fillStyle = pal[1 + (k % 4)]; x.globalAlpha = 0.75 + r() * 0.25;
        if (r() < 0.5) { x.beginPath(); x.arc(r() * w, r() * hh, (0.08 + r() * 0.22) * w, 0, Math.PI * 2); x.fill(); }
        else x.fillRect(r() * w * 0.8, r() * hh * 0.8, (0.1 + r() * 0.35) * w, (0.1 + r() * 0.4) * hh);
      }
      x.globalAlpha = 1;
    });
    toile.material.toneMapped = true;
    g.add(toile);
    const cadre = new THREE.MeshStandardMaterial({ color: '#1a1b1e', roughness: 0.5, metalness: 0.3 });
    for (const [px, py, pw, ph] of [[0, h / 2 + 0.025, l + 0.1, 0.05], [0, -h / 2 - 0.025, l + 0.1, 0.05], [l / 2 + 0.025, 0, 0.05, h], [-l / 2 - 0.025, 0, 0.05, h]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.04), cadre); b.position.set(px, py, -0.01); g.add(b);
    }
    return g;
  }
  plaque(nom, actif) {
    return this.ecran(0.36, 0.09, (x, w, h) => { x.fillStyle = actif ? '#1a2337' : '#e9e4da'; x.fillRect(0, 0, w, h); x.fillStyle = actif ? '#e3a857' : '#6b6b6b'; x.font = `600 ${h * 0.55}px system-ui`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(nom).slice(0, 18), w / 2, h / 2); });
  }
  async construireEtage(dept, numero) {
    const g = new THREE.Group();
    const murs = [];
    const ajouts = [];
    const A = (p) => ajouts.push(p.then((o) => g.add(o)));
    const parquet = this.matiere('herringbone_parquet', 6, { m: { color: '#e8d6bd' } });
    const blanc = new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.85 });
    this.sol(g, 26, 16, parquet);
    this.plafond(g, 26, 16, 3.6, '#f4f3f0');
    this.mur(g, murs, 0, 8, 26, 0.3, 3.6, blanc);
    this.mur(g, murs, 13, 0, 0.3, 16, 3.6, blanc);
    this.vitre(g, 0, -8, 26, 3.6); murs.push({ x0: -13, x1: 13, z0: -8.2, z1: -7.9 });
    this.vitre(g, -13, 0, 16, 3.6, Math.PI / 2); murs.push({ x0: -13.2, x1: -12.9, z0: -8, z1: 8 });
    // Le nom du département, grand, sur le mur du fond
    const titre = this.ecran(8, 0.9, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#2b2f36'; x.font = `600 ${h * 0.55}px Georgia, serif`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(`${numero}. ${dept}`, 10, h / 2); });
    titre.material.transparent = true; titre.position.set(-4.5, 2.6, 7.83); titre.rotation.y = Math.PI; g.add(titre);
    // Les postes : îlots de bureaux face à face
    const bois = this.matiere('herringbone_parquet', 0.6, { m: { color: '#d8bf9c' } });
    const caisson = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.55 });
    const noir = new THREE.MeshStandardMaterial({ color: '#111316', metalness: 0.4, roughness: 0.35 });
    const tissu = new THREE.MeshStandardMaterial({ color: '#b9a88e', roughness: 0.95 });
    this.postesEtage = [];
    const places = [];
    for (let ilot = 0; ilot < 3; ilot += 1) for (const rang of [0, 1]) {
      const cx = -8 + ilot * 7, cz = -2.4 + rang * 5.2;
      const plateau = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.04, 1.7), bois); plateau.position.set(cx, 0.74, cz); plateau.castShadow = plateau.receiveShadow = true; g.add(plateau);
      for (const sx of [-2.3, 2.3]) { const pied = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 1.5), caisson); pied.position.set(cx + sx, 0.36, cz); g.add(pied); }
      const cloison = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.42, 0.04), tissu); cloison.position.set(cx, 0.97, cz); g.add(cloison);
      murs.push({ x0: cx - 2.45, x1: cx + 2.45, z0: cz - 0.9, z1: cz + 0.9 });
      for (const cote of [-1, 1]) for (let k = 0; k < 2; k += 1) {
        const x = cx - 1.2 + k * 2.4, z = cz + cote * 0.42;
        const ecran = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.03), noir); ecran.position.set(x, 1.0, z - cote * 0.12); g.add(ecran);
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.55), caisson); c.position.set(x + 0.75, 0.29, z + cote * 0.1); g.add(c);
        const f = this.fauteuil(); f.position.set(x, 0, cz + cote * 1.25); f.rotation.y = cote > 0 ? 0 : Math.PI; g.add(f);
        places.push({ x, z: cz + cote * 1.18, rot: cote > 0 ? Math.PI : 0, ecranPos: [x, 1.0, z - cote * 0.12 + cote * 0.017], ecranRot: cote > 0 ? 0 : Math.PI, cote });
      }
      A(this.objet('potted_plant_04', { x: cx - 2.1, y: 0.76, z: cz, echelle: 0.9 }));
      A(this.objet('potted_plant_04', { x: cx + 2.1, y: 0.76, z: cz, echelle: 0.9 }));
    }
    this.placesEtage = places;
    // La salle de réunion vitrée à montants noirs, dans le coin
    const salle = new THREE.Group();
    const verre = new THREE.MeshStandardMaterial({ color: '#dcecf5', roughness: 0.05, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
    for (const [x, z, l, r] of [[9.5, 2.6, 6, 0], [6.5, 5.3, 5.4, Math.PI / 2]]) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(l, 3.6), verre); v.position.set(x, 1.8, z); v.rotation.y = r; salle.add(v);
      const n = Math.round(l / 1.2);
      for (let i = 0; i <= n; i += 1) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.6, 0.05), noir); const d = -l / 2 + (i * l) / n; m.position.set(x + (r ? 0 : d), 1.8, z + (r ? d : 0)); salle.add(m); }
    }
    g.add(salle);
    murs.push({ x0: 6.4, x1: 13, z0: 2.5, z1: 2.7 }, { x0: 6.4, x1: 6.6, z0: 2.6, z1: 6.6 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 1.3), bois); table.position.set(9.8, 0.75, 5.2); g.add(table);
    for (let i = 0; i < 3; i += 1) for (const c of [-1, 1]) { const f = this.fauteuil(); f.position.set(8.8 + i, 0, 5.2 + c * 0.95); f.rotation.y = c > 0 ? 0 : Math.PI; g.add(f); }
    // Plantes le long des baies et suspendues
    for (let i = 0; i < 6; i += 1) A(this.objet('planter_box_01', { x: -11 + i * 4.3, z: -7.3, echelle: 1.2 }));
    for (const [x, z] of [[-6, 0], [0, 0], [6, 0], [-3, 5], [3, 5]]) {
      A(this.objet('potted_plant_04', { x, y: 2.9, z, echelle: 1.1, ombre: false }));
      const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.7), noir); fil.position.set(x, 3.25, z); g.add(fil);
    }
    this.lampes(g, [[-8, -2.4, 3.58], [-1, -2.4, 3.58], [6, -2.4, 3.58], [-8, 2.8, 3.58], [-1, 2.8, 3.58]]);
    this.ascenseur(g, murs, 11.2, 7.83, Math.PI);
    await Promise.all(ajouts);
    return { groupe: g, murs, depart: { x: 11.2, z: 6.6, yaw: 0.3 }, poi: [{ type: 'ascenseur', x: 11.2, z: 6.9, rayon: 1.6 }], limites: { x0: -12.7, x1: 12.7, z0: -7.7, z1: 7.7 }, sortieAscenseur: { x: 10.4, z: 5.9, yaw: 0.6 }, places };
  }

  // ——— Aller quelque part ———
  async allerA(lieu, { nomEntreprise, avatar } = {}) {
    this.emettre({ type: 'chargement', lieu });
    if (!this.joueur || !this.receptionniste) {
      const [j, r] = await Promise.all([this.joueur || this.personnage(avatar || 'Male_Adult_07'), this.receptionniste || this.personnage(RECEPTIONNISTE)]);
      if (!this.joueur) { this.joueur = j; this.scene.add(j.objet); }
      if (!this.receptionniste) { this.receptionniste = r; r.objet.add(this.etiquette(this.langue === 'en' ? 'Receptionist' : 'Réceptionniste', nomEntreprise || '')); }
      // Les animations de marche : chargées d'avance pour ne pas figer au premier pas.
      ['marche', 'course', 'salut', 'parle'].forEach((a) => this.clip(j.genre, a).catch(() => {}));
    }
    if (!this.villeVivante) {
      this.villeVivante = construireVille(this, this.scene, { sol: 0, envCiel: this.envCiel });
      this.portes = construirePortes();
      this.villeVivante.racine.add(this.portes.groupe);
      this.villeVivante.reglerNuit(this.niveauNuit || 0);
      if (this.affichesBoutiques) this.villeVivante.afficher(this.affichesBoutiques);
      if (this.listeChantiers) this.poiChantiers = this.villeVivante.chantiers(this.listeChantiers);
    }
    const etage = String(lieu).startsWith('etage:') ? String(lieu).slice(6) : null;
    const depts = this.donnees?.departements || [];
    const numero = etage ? depts.indexOf(etage) + 1 : 0;
    this.villeVivante.racine.visible = lieu !== 'maisons'; // chez les agents : loin de la ville
    this.villeVivante.racine.position.y = etage ? -(12 + numero * 4) : (String(lieu).startsWith('reunion') ? -34 : ({ hall: 0, atelier: -22 }[lieu] ?? 0));
    // Chaque lieu n'est construit qu'une fois ; ensuite on y retourne sans rien recharger.
    this.lieux = this.lieux || {};
    if (this.lieu) {
      this.scene.remove(this.lieu.groupe);
      // Les étiquettes (noms au-dessus des têtes) ne suivent pas d'un étage à l'autre.
      this.lieu.groupe.traverse((o) => { if (o.isCSS2DObject && o.element.parentNode) o.element.parentNode.removeChild(o.element); });
    }
    const l = this.lieux[lieu] || (lieu === 'maisons' ? construireMaisons(this, this.donnees?.agents || []) : etage ? await this.construireEtage(etage, numero) : String(lieu).startsWith('reunion') ? await this.construireReunion() : lieu === 'atelier' ? (this.salleMarche ? await construireSalleMarche(this) : await this.construireAtelier()) : await this.construireHall(nomEntreprise));
    this.lieux[lieu] = l;
    if (lieu === 'maisons') l.lampes.emissiveIntensity = (this.niveauNuit || 0) * 1.4;
    if (l.tableau) this.tableauAtelier = l.tableau;
    if (lieu === 'hall' && !l.poiBase) { l.poiBase = l.poi; l.poi = [...l.poi, ...(this.poiChantiers || [])]; }
    if (l.majMarche && this.donneesMarche) l.majMarche(this.donneesMarche);
    l.nom = lieu;
    this.lieu = l;
    this.scene.add(l.groupe);
    const d = this.dejaVenu ? l.sortieAscenseur : l.depart;
    this.dejaVenu = true;
    this.joueur.objet.position.set(d.x, 0, d.z);
    this.joueur.objet.rotation.y = d.yaw + Math.PI;
    this.cam.yaw = d.yaw;
    this.camSnap = true;
    if (lieu === 'hall') {
      this.receptionniste.objet.position.set(0, 0, -6.1);
      this.receptionniste.objet.rotation.y = 0;
      l.groupe.add(this.receptionniste.objet);
    }
    this.placerAgents();
    this.emettre({ type: 'lieu', lieu });
  }

  // Vue du ciel : on monte au-dessus de la ville, puis la planète (planete3d.js).
  majPlanete(info) { this.infoPlanete = info; if (this.planete && !this.ciel3d) { this.planete.detruire(); this.planete = null; } }
  vueCiel(monter) {
    if (monter) {
      if (this.ciel3d) return;
      if (!this.planete) {
        this.planete = construirePlanete({ mobile: this.mobile, ...(this.infoPlanete || {}) });
        this.planete.redimensionner(this.conteneur.clientWidth || 800, this.conteneur.clientHeight || 600);
      }
      this.planete.recommencer();
      this.ciel3d = { phase: 'monte', t: 0, depart: this.camera.position.clone() };
    } else if (this.ciel3d) {
      this.ciel3d.phase = 'revient'; this.planete.zoom(1.12);
    }
  }
  animerCiel(dt) {
    const c = this.ciel3d, p = this.joueur?.objet.position || new THREE.Vector3();
    const doux = (x) => x * x * (3 - 2 * x);
    if (c.phase === 'monte') {
      c.t += dt / 2.4;
      const k = doux(Math.min(1, c.t));
      this.camera.position.set(c.depart.x + (p.x - c.depart.x) * k * 0.3, c.depart.y + (520 - c.depart.y) * k, c.depart.z + (p.z + 40 - c.depart.z) * k);
      this.camera.lookAt(p.x, 0, p.z);
      if (c.t >= 1) {
        c.phase = 'globe'; c.globe = true;
        // Les étiquettes de la ville restent dans la ville
        this.scene.traverse((o) => { if (o.isCSS2DObject) o.element.style.display = 'none'; });
        this.emettre({ type: 'ciel', actif: true });
      }
    } else if (c.phase === 'globe' || c.phase === 'revient') {
      this.planete.avancer(dt);
      if (c.phase === 'revient' && this.planete.distance() < 1.2) {
        c.phase = 'descend'; c.globe = false; c.t = 0;
        this.planete.scene.traverse((o) => { if (o.isCSS2DObject) o.element.style.display = 'none'; });
        this.emettre({ type: 'ciel', actif: false });
      }
    } else if (c.phase === 'descend') {
      c.t += dt / 1.8;
      const k = doux(Math.min(1, c.t));
      const haut = new THREE.Vector3(p.x, 520, p.z + 40);
      const voulu = this.camera.position.clone(); // position normale calculée par avancer()
      this.camera.position.lerpVectors(haut, voulu, k);
      this.camera.lookAt(p.x, 1.2 * k, p.z);
      if (c.t >= 1) { this.ciel3d = null; this.planete.zoom(3.2); }
    }
  }

  // Les projets en chantiers, en face de l'immeuble (chantiers3d.js).
  majChantiers(liste) {
    this.listeChantiers = liste;
    const pois = this.villeVivante?.chantiers(liste) || [];
    this.poiChantiers = pois;
    const hall = this.lieux?.hall;
    if (hall) hall.poi = [...(hall.poiBase || hall.poi.filter((x) => x.type !== 'chantier')), ...pois];
  }
  // Se poser dans la rue (onglet « La ville » : on arrive dehors, face aux chantiers).
  placerJoueur(x, z, yaw) {
    if (!this.joueur) return;
    this.joueur.objet.position.set(x, 0, z);
    this.joueur.objet.rotation.y = yaw + Math.PI;
    this.cam.yaw = yaw;
    this.camSnap = true;
  }

  // Salle des marchés : taux du jour, activité, heure (vraies données).
  majMarche(d) {
    this.donneesMarche = { ...this.donneesMarche, ...d };
    this.lieux?.atelier?.majMarche?.(this.donneesMarche);
  }

  // Les affiches des vraies boutiques Finjaro dans la ville (voir affiches.js).
  afficherBoutiques(liste) {
    this.affichesBoutiques = liste;
    this.villeVivante?.afficher(liste);
  }

  // ——— Les vrais agents ———
  majDonnees({ agents = [], ou, faits, departements = [] } = {}) {
    this.donnees = { agents, ou, departements };
    if (faits) { this.faits = faits; this.ecranFaits?.userData.redessiner(faits); }
    this.placerAgents();
  }
  async placerAgents() {
    if (!this.lieu || !this.donnees) return;
    const { agents, ou } = this.donnees;
    const parId = new Map(agents.map((a) => [a.id, a]));
    const voulus = new Map(); // id → { lieu, place, anim, sous }
    const r = ou?.reunion;
    if (String(this.lieu.nom).startsWith('reunion')) {
      // Une salle par réunion en cours : « reunion » = la 1re, « reunion:2 » = la 2e…
      const idx = this.lieu.nom === 'reunion' ? 0 : Number(this.lieu.nom.split(':')[1]) - 1;
      const r = (ou?.reunions || [])[idx] || null;
      (r?.participants || []).slice(0, this.lieu.places?.length || 0).forEach((id, i) => voulus.set(id, { place: this.lieu.places[i], anim: 'assis', sous: id === r.parle ? (this.langue === 'en' ? 'speaking' : 'parle') : (this.langue === 'en' ? 'in the meeting' : 'en réunion') }));
      this.lieu.ecran?.userData.redessiner(r ? { etat: this.langue === 'en' ? '● Meeting in progress' : '● Réunion en cours', sujet: r.sujet } : { etat: this.langue === 'en' ? 'Room free' : 'Salle libre', sujet: ou?.derniereReunion ? `${this.langue === 'en' ? 'Last meeting' : 'Dernière réunion'} (${new Date(ou.derniereReunion.quand).toLocaleString(this.langue === 'en' ? 'en' : 'fr', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}) : ${ou.derniereReunion.sujet}` : (this.langue === 'en' ? 'No meeting right now.' : 'Aucune réunion en ce moment.') });
    }
    if (this.lieu.nom === 'hall') {
      // Au bar : ceux qui viennent de rendre un travail (dernière demi-heure).
      (ou?.aupause || []).slice(0, this.lieu.bar?.length || 0).forEach((b, i) => voulus.set(b.id, { place: this.lieu.bar[i], anim: i % 2 ? 'ecoute' : 'parle', sous: `${this.langue === 'en' ? 'break · delivered' : 'pause · a rendu'} : ${String(b.tache || '').slice(0, 36)}` }));
      // Les disponibles (allumés, libres) : au salon, en discussion, ou qui marchent dans le hall.
      const dispo = this.langue === 'en' ? 'available · talk to me' : 'disponible · parle-moi';
      // Dans l'ordre : d'abord ce qu'on voit en entrant (quelqu'un qui marche, un groupe qui discute).
      const places = [
        { chemin: [[0, -2.6], [9.2, -1], [6, 7.6], [-3, 6.8], [-4, 0.5]] },
        { x: 8.4, z: -6.0, rot: -Math.PI / 2, anim: 'parle' }, { x: 7.2, z: -6.0, rot: Math.PI / 2, anim: 'ecoute' },
        { x: -8.0, z: 0.9, rot: Math.PI / 2, anim: 'assis' }, { x: -8.0, z: 2.1, rot: Math.PI / 2, anim: 'assis' },
        { chemin: [[9.2, -1], [0, -2.6], [-4, 0.5], [-3, 6.8], [6, 7.6]], decale: 0.5 },
        { x: -5.72, z: -0.62, rot: -Math.PI / 2 - 0.3, anim: 'assis' }, { x: -5.72, z: 3.42, rot: -Math.PI / 2 + 0.3, anim: 'assis' },
        { x: -10.2, z: 6.2, rot: Math.PI * 0.75, anim: 'parle' }, { x: -9.1, z: 5.1, rot: -Math.PI * 0.25, anim: 'ecoute' },
      ];
      // … et ceux qui attendent leur tâche, pendant leur pause (voir enPause dans monde.js).
      const enHall = [
        ...(ou?.disponibles || []).map((d) => ({ id: d.id, sous: dispo })),
        ...(ou?.aLeurPoste || []).filter((x) => x.pause).map((x) => ({ id: x.id, sous: `${this.langue === 'en' ? 'break · to do' : 'pause · à faire'} : ${String(x.tache || '').slice(0, 34)}` })),
      ];
      enHall.filter((d) => !voulus.has(d.id)).slice(0, this.mobile ? 5 : places.length).forEach((d, i) => {
        const pl = places[i];
        if (pl.chemin) voulus.set(d.id, { place: { x: pl.chemin[0][0], z: pl.chemin[0][1], rot: 0 }, anim: 'marche', sous: d.sous, chemin: pl.chemin, decale: pl.decale || 0 });
        else voulus.set(d.id, { place: pl, anim: pl.anim, sous: d.sous });
      });
    }
    if (this.lieu.nom === 'atelier') {
      (ou?.auBureau || []).slice(0, this.lieu.postes?.length || 0).forEach((b, i) => voulus.set(b.id, { place: this.lieu.postes[i], anim: 'travail', sous: String(b.tache || b.texte || '').slice(0, 48), texte: b.tache || b.texte }));
      this.tableauAtelier?.userData.redessiner({ lignes: [...(ou?.auBureau || []), ...(ou?.aLeurPoste || [])].map((b) => `${parId.get(b.id)?.nom || ''} — ${b.tache || b.texte || ''}`) });
      (this.lieu.postes || []).forEach((p, i) => {
        const b = ou?.auBureau?.[i];
        p.ecran.userData.redessiner(b ? { actif: true, nom: parId.get(b.id)?.nom, texte: b.tache || b.texte } : { actif: false });
      });
    }
    if (this.lieu.nom === 'maisons') {
      // Chez lui : seulement l'agent en veille (éteint). Allumé, il est à l'immeuble.
      for (const v of this.lieu.villas || []) {
        const a = parId.get(v.id);
        if (a && a.actif === false) voulus.set(a.id, { place: v.place, anim: 'assis', sous: this.langue === 'en' ? 'at home · switched off' : 'chez lui · en veille' });
      }
    }
    if (String(this.lieu.nom).startsWith('etage:')) {
      const dept = this.lieu.nom.slice(6);
      const plat = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const siens = agents.filter((a) => !a.user_id && plat(a.departement) === plat(dept));
      const actifs = new Map((ou?.auBureau || []).map((b) => [b.id, b]));
      this.lieu.places.forEach((p, i) => {
        const a = siens[i];
        if (!p.plaqueMesh) { p.plaqueMesh = null; }
        if (p.ecranMesh) { this.lieu.groupe.remove(p.ecranMesh); p.ecranMesh = null; }
        if (p.plaqueObj) { this.lieu.groupe.remove(p.plaqueObj); p.plaqueObj = null; }
        if (!a) return;
        const b = actifs.get(a.id);
        const attente = !b ? (ou?.aLeurPoste || []).find((x) => x.id === a.id) : null;
        const pl = this.plaque(a.nom, !!b); pl.position.set(p.x, 0.99, p.z - p.cote * 0.64); pl.rotation.y = p.ecranRot; pl.rotation.x = p.cote > 0 ? -0.3 : 0.3; this.lieu.groupe.add(pl); p.plaqueObj = pl;
        if (b) {
          const e = this.ecran(0.56, 0.32, (x, w, h) => { x.fillStyle = '#0d1117'; x.fillRect(0, 0, w, h); x.fillStyle = '#e3a857'; x.font = `bold ${h * 0.11}px ui-monospace, monospace`; x.fillText(a.nom, w * 0.05, h * 0.16); x.font = `${h * 0.08}px ui-monospace, monospace`; const t = String(b.tache || b.texte || '').replace(/\s+/g, ' '); ['#7ee787', '#79c0ff', '#d2a8ff', '#edf1f8'].forEach((c, l) => { x.fillStyle = c; x.fillText(t.slice(l * 32, l * 32 + 32), w * 0.05, h * (0.34 + l * 0.14)); }); });
          e.position.set(...p.ecranPos); e.rotation.y = p.ecranRot; this.lieu.groupe.add(e); p.ecranMesh = e;
          voulus.set(a.id, { place: p, anim: 'travail', sous: String(b.tache || b.texte || '').slice(0, 48) });
        } else if (attente) {
          // Il a une tâche ouverte : à son poste, sans taper.
          const e = this.ecran(0.56, 0.32, (x, w, h) => { x.fillStyle = '#10151d'; x.fillRect(0, 0, w, h); x.fillStyle = '#93a1b8'; x.font = `bold ${h * 0.1}px system-ui`; x.fillText(this.langue === 'en' ? 'To do' : 'À faire', w * 0.05, h * 0.18); x.fillStyle = '#edf1f8'; x.font = `${h * 0.085}px system-ui`; const t = String(attente.tache || ''); for (let l = 0; l < 4; l += 1) x.fillText(t.slice(l * 30, l * 30 + 30), w * 0.05, h * (0.38 + l * 0.14)); });
          e.position.set(...p.ecranPos); e.rotation.y = p.ecranRot; this.lieu.groupe.add(e); p.ecranMesh = e;
          // En pause au hall : l'écran reste allumé sur sa tâche, la chaise est vide.
          if (!attente.pause) voulus.set(a.id, { place: p, anim: 'assis', sous: `${this.langue === 'en' ? 'to do' : 'à faire'} : ${String(attente.tache || '').slice(0, 40)}` });
        }
      });
    }
    for (const [id, x] of this.agents) {
      if (!voulus.has(id)) { x.perso.objet.parent?.remove(x.perso.objet); this.agents.delete(id); }
    }
    for (const [id, v] of voulus) {
      const a = parId.get(id);
      if (!a) continue;
      let x = this.agents.get(id);
      if (!x) {
        const perso = await this.personnage(corpsDe(a).id);
        const etiquette = this.etiquette(a.nom, v.sous, a.apparence?.mini || a.avatar_url);
        perso.objet.add(etiquette);
        x = { perso, etiquette, agent: a };
        this.agents.set(id, x);
      }
      x.etiquette.element.querySelector('i').textContent = v.sous || '';
      if (v.chemin) {
        // Garde sa position s'il marchait déjà sur ce chemin (pas de saut à chaque mise à jour).
        if (!x.chemin || x.chemin.cle !== String(v.chemin)) {
          x.chemin = { pts: v.chemin, cle: String(v.chemin), i: 0, t: v.decale || 0 };
          x.perso.objet.position.set(v.place.x, 0, v.place.z);
        }
      } else {
        x.chemin = null;
        x.perso.objet.position.set(v.place.x, 0, v.place.z);
        x.perso.objet.rotation.y = v.place.rot;
      }
      x.perso.jouer(v.anim);
      if (x.perso.objet.parent !== this.lieu.groupe) this.lieu.groupe.add(x.perso.objet);
    }
  }

  // ——— Commandes ———
  brancherCommandes() {
    const el = this.rendu.domElement;
    this.surTouche = (e) => {
      if (e.target?.closest?.('input, textarea, [contenteditable]')) return;
      const code = e.code;
      if (e.type === 'keydown') {
        this.touches.add(code);
        if (code === 'KeyF' || (code === 'KeyE' && this.conduite)) { if (this.conduite) this.descendreVoiture(); else if (this.proche?.type === 'voiture') this.monterVoiture(this.proche.id); else if (this.proche?.type === 'helico') this.monterHelico(); }
        else if (code === 'KeyE') this.interagir();
        if (code === 'KeyV') this.cycleCamera();
      } else this.touches.delete(code);
    };
    window.addEventListener('keydown', this.surTouche);
    window.addEventListener('keyup', this.surTouche);
    let tire = null;
    el.addEventListener('pointerdown', (e) => { tire = { x: e.clientX, y: e.clientY, id: e.pointerId }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => {
      if (!tire || tire.id !== e.pointerId) return;
      if (this.ciel3d?.globe) { this.planete.tourner(-(e.clientX - tire.x) * 0.006); tire.x = e.clientX; tire.y = e.clientY; return; }
      this.cam.yaw -= (e.clientX - tire.x) * 0.006;
      this.cam.pitch = THREE.MathUtils.clamp(this.cam.pitch + (e.clientY - tire.y) * 0.004, -0.35, 1.1);
      tire.x = e.clientX; tire.y = e.clientY;
    });
    el.addEventListener('pointerup', () => { tire = null; });
    el.addEventListener('wheel', (e) => { this.cam.dist = THREE.MathUtils.clamp(this.cam.dist + e.deltaY * 0.003, 1.8, 7); }, { passive: true });
  }
  cycleCamera() {
    this.cam.mode = { tps: 'fps', fps: 'plan', plan: 'tps' }[this.cam.mode];
    this.emettre({ type: 'camera', mode: this.cam.mode });
  }
  // Frise du temps (onglet « La ville ») : vue d'ensemble des chantiers, ou retour au joueur.
  vueChantiers(oui) { if (oui && this.vueChantiersT == null) this.vueChantiersT = 0; if (!oui) this.vueChantiersT = null; }
  reglerCamera(mode) { this.cam.mode = mode; this.emettre({ type: 'camera', mode }); }
  // ——— Conduire (conduite.js) ———
  monterVoiture(id) {
    const lb = this.villeVivante?.voituresLibres.find((x) => x.id === id);
    if (!lb || this.conduite || this.lieu?.nom !== 'hall') return;
    this.conduite = { lb, kmh: -1, t: 0, secousse: 0 };
    lb.objet.userData.detailler?.();
    this.joueur.objet.visible = false;
    this.cleProche = null; this.proche = null; this.emettre({ type: 'proximite', cible: null });
    this.emettre({ type: 'conduite', active: true, kmh: 0 });
  }
  monterHelico() {
    const h = this.villeVivante?.helico;
    if (!h || this.conduite || this.lieu?.nom !== 'hall') return;
    this.conduite = { lb: h, genre: 'helico', kmh: -1, alt: -1, t: 0, secousse: 0, regime: 0.1 };
    this.joueur.objet.visible = false;
    this.cleProche = null; this.proche = null; this.emettre({ type: 'proximite', cible: null });
    this.emettre({ type: 'conduite', active: true, genre: 'helico', kmh: 0, alt: 0 });
  }
  descendreVoiture() {
    const c = this.conduite;
    if (!c) return;
    if (c.genre === 'helico') { // on ne saute pas d'un hélicoptère en vol : il faut se poser
      if (c.lb.etat.y > 0.3) { this.emettre({ type: 'conduite', active: true, genre: 'helico', kmh: c.kmh, alt: Math.round(c.lb.etat.y), sePoser: true }); return; }
      const e = c.lb.etat;
      const p = this.joueur.objet.position;
      p.set(e.x + Math.cos(e.cap) * 2.6, 0, e.z - Math.sin(e.cap) * 2.6);
      this.collisions(p);
      this.joueur.objet.rotation.y = e.cap + Math.PI;
      this.cam.yaw = e.cap + Math.PI; this.camSnap = true;
      this.conduite = null;
      this.emettre({ type: 'conduite', active: false });
      return;
    }
    const e = c.lb.etat;
    e.vitesse = 0;
    this.arreterCourse();
    const pied = portiere(e);
    const p = this.joueur.objet.position;
    p.set(pied.x, 0, pied.z);
    this.collisions(p);
    this.joueur.objet.rotation.y = e.cap + Math.PI;
    this.cam.yaw = e.cap + Math.PI; this.camSnap = true;
    this.conduite = null;
    this.emettre({ type: 'conduite', active: false });
  }
  // Une course autour du pâté de maisons (course.js), seulement au volant d'une voiture.
  lancerCourse() {
    if (!this.conduite || this.conduite.genre === 'helico') return;
    this.course = nouvelleCourse();
    this.portes?.montrer(this.course.prochaine, true);
    this.emettre({ type: 'course', ...this.resumeCourse(), nouvelle: true });
  }
  arreterCourse() {
    if (!this.course) return;
    this.course = null;
    this.portes?.montrer(0, false);
    this.emettre({ type: 'course', active: false });
  }
  resumeCourse() { const c = this.course; return { active: true, prochaine: Math.min(c.prochaine, c.circuit.length), total: c.circuit.length, temps: c.temps, finie: c.finie }; }
  // Pédales et volant du téléphone (boutons de l'écran), en plus du clavier et du joystick.
  pedales(p) { this.pedale = { ...(this.pedale || {}), ...p }; }
  avancerVoiture(dt) {
    const c = this.conduite, t = this.touches, V = this.villeVivante, pd = this.pedale || {};
    const gaz = Math.max(-1, Math.min(1, (t.has('KeyW') || t.has('ArrowUp') || pd.gaz ? 1 : 0) - (t.has('KeyS') || t.has('ArrowDown') || pd.frein ? 1 : 0) - this.joy.y));
    const volant = Math.max(-1, Math.min(1, (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0) + this.joy.x));
    // Petits pas de calcul : la voiture va à la bonne vitesse même sur un appareil lent.
    // Obstacles : la circulation et les autres voitures libres (garées ou laissées là).
    const autres = [...V.circulation(), ...V.voituresLibres.filter((x) => x !== c.lb).flatMap((x) => [-1.3, 1.3].map((k) => ({ x: x.etat.x + Math.sin(x.etat.cap) * k, z: x.etat.z + Math.cos(x.etat.cap) * k, rayon: 0.95 })))];
    let e = c.lb.etat, choc = 0, reste = Math.min(dt, 0.25);
    while (reste > 1e-4) {
      const h = Math.min(reste, 1 / 60); reste -= h;
      e = heurterBlocs(piloter(e, { gaz, volant, frein: t.has('Space') }, h), V.blocs);
      choc = Math.max(choc, e.choc);
      e = heurterVehicules(e, autres);
      choc = Math.max(choc, e.choc);
    }
    e.x = Math.max(-194, Math.min(194, e.x)); e.z = Math.max(-194, Math.min(194, e.z));
    if (choc > 4) { c.secousse = Math.min(0.6, choc / 30); this.emettre({ type: 'choc', force: choc }); }
    c.lb.etat = { x: e.x, z: e.z, cap: e.cap, vitesse: e.vitesse };
    const o = c.lb.objet;
    o.position.set(e.x, 0, e.z);
    o.rotation.y = e.cap - Math.PI / 2;
    o.rotation.z = Math.max(-0.03, Math.min(0.03, -gaz * 0.02 * Math.sign(e.vitesse || 1))); // la caisse plonge au freinage
    for (const r of o.userData.roues || []) {
      r.axe.rotation[r.axeRot || 'z'] += ((r.sens || -1) * e.vitesse * dt) / (r.rayon || 0.35);
      if (r.avant) r.pivot.rotation.y = -(e.angle || 0);
    }
    this.joueur.objet.position.set(e.x, 0, e.z); // le joueur est dans la voiture (caméra, soleil, proximité)
    c.t += dt;
    const k = kmh(e.vitesse);
    if (c.t > 0.15 && k !== c.kmh) { c.t = 0; c.kmh = k; this.emettre({ type: 'conduite', active: true, kmh: k }); }
    if (this.course && !this.course.finie) {
      const avant = this.course.prochaine;
      this.course = avancerCourse(this.course, e.x, e.z, dt);
      this.course.t = (this.course.t || 0) + dt;
      if (this.course.prochaine !== avant || this.course.finie) this.portes?.montrer(this.course.prochaine, !this.course.finie);
      if (this.course.t > 0.1 || this.course.prochaine !== avant || this.course.finie) { this.course.t = 0; this.emettre({ type: 'course', ...this.resumeCourse() }); }
    }
  }
  avancerHelico(dt) {
    const c = this.conduite, t = this.touches, V = this.villeVivante, pd = this.pedale || {}, h = c.lb;
    const avance = Math.max(-1, Math.min(1, (t.has('KeyW') || t.has('ArrowUp') ? 1 : 0) - (t.has('KeyS') || t.has('ArrowDown') ? 1 : 0) - this.joy.y));
    const lacet = Math.max(-1, Math.min(1, (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0) + this.joy.x));
    const monte = (t.has('Space') || pd.gaz ? 1 : 0) - (t.has('ShiftLeft') || t.has('ShiftRight') || t.has('KeyC') || pd.frein ? 1 : 0);
    // Les immeubles de la ville, et le nôtre (24,8 × 18,8 m, toit à 76 m).
    if (!this.toursHelico) this.toursHelico = [...V.tours, { x0: -12.4, x1: 12.4, z0: -9.4, z1: 9.4, h: 82 }];
    let e = h.etat, choc = 0, reste = Math.min(dt, 0.25);
    while (reste > 1e-4) {
      const pas = Math.min(reste, 1 / 60); reste -= pas;
      e = heurterTours(voler(e, { avance, lacet, monte }, pas), this.toursHelico);
      choc = Math.max(choc, e.choc);
    }
    e.x = Math.max(-194, Math.min(194, e.x)); e.z = Math.max(-194, Math.min(194, e.z));
    if (choc > 5) { c.secousse = Math.min(0.8, choc / 25); this.emettre({ type: 'choc', force: choc }); }
    h.etat = { x: e.x, y: e.y, z: e.z, cap: e.cap, vx: e.vx, vy: e.vy, vz: e.vz };
    const o = h.objet;
    o.position.set(e.x, h.sol + e.y, e.z);
    o.rotation.set(e.tangage || 0, e.cap, -(e.roulis || 0), 'YXZ');
    c.regime += ((e.y > 0.05 || monte > 0 ? 1 : 0.25) - c.regime) * Math.min(1, dt * 1.2);
    h.animer(dt, c.regime);
    this.joueur.objet.position.set(e.x, 0, e.z);
    c.t += dt;
    const k = kmh(Math.hypot(e.vx, e.vz)), alt = Math.round(e.y);
    if (c.t > 0.15 && (k !== c.kmh || alt !== c.alt)) { c.t = 0; c.kmh = k; c.alt = alt; this.emettre({ type: 'conduite', active: true, genre: 'helico', kmh: k, alt }); }
  }
  interagir() {
    if (!this.proche) return;
    if (this.proche.type === 'voiture') { this.monterVoiture(this.proche.id); return; }
    if (this.proche.type === 'helico') { this.monterHelico(); return; }
    if (this.proche.type === 'receptionniste') this.receptionniste?.jouer('parle');
    this.emettre({ type: 'interagir', cible: this.proche });
  }

  // ——— La boucle ———
  demarrer() {
    const pas = () => {
      if (!this.vivant) return;
      this.raf = requestAnimationFrame(pas);
      // Au téléphone : 30 images/s régulières plutôt que 60 qui saccadent (et la batterie tient).
      if (this.mobile) { this.reste = (this.reste || 0) + this.horloge.getDelta(); if (this.reste < 1 / 31) return; }
      const brut = this.mobile ? this.reste : this.horloge.getDelta();
      this.reste = 0;
      const dt = Math.min(brut, 0.05);
      this.adapter(brut);
      this.avancer(dt);
      if (this.ciel3d) this.animerCiel(dt);
      if (this.ciel3d?.globe) {
        this.rendu.render(this.planete.scene, this.planete.camera);
        this.etiquettes.render(this.planete.scene, this.planete.camera);
        return;
      }
      if (this.composer) this.composer.render(); else this.rendu.render(this.scene, this.camera);
      this.etiquettes.render(this.scene, this.camera);
    };
    pas();
  }
  // La résolution s'adapte à la machine : sous 40 images/s on baisse, au-dessus
  // de 58 on remonte (sans dépasser la limite de départ).
  adapter(brut) {
    this.mesure = this.mesure || { t: 0, n: 0, max: this.rendu.getPixelRatio() };
    this.mesure.t += brut; this.mesure.n += 1;
    if (this.mesure.t < 2) return;
    const ips = this.mesure.n / this.mesure.t;
    const pr = this.rendu.getPixelRatio();
    const plancher = 1; // jamais en dessous d'un pixel par point (Beau : « trop réduit le nombre de pixels »)
    const bas = this.mobile ? 24 : 35, haut = this.mobile ? 29 : 58; // au téléphone, on vise 30 images/s
    if (ips < bas && pr > plancher) this.rendu.setPixelRatio(Math.max(plancher, pr - 0.15));
    else if (ips > haut && pr < this.mesure.max) this.rendu.setPixelRatio(Math.min(this.mesure.max, pr + 0.1));
    if (ips < 28 && this.rendu.shadowMap.enabled && pr <= plancher) { this.rendu.shadowMap.enabled = false; this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
    if (this.rendu.getPixelRatio() !== pr) { const w = this.conteneur.clientWidth, h = this.conteneur.clientHeight; this.rendu.setSize(w, h); }
    this.mesure.t = 0; this.mesure.n = 0;
  }
  avancer(dt) {
    const j = this.joueur;
    if (!j || !this.lieu) return;
    const t = this.touches;
    let ax = (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0) + this.joy.x;
    let az = (t.has('KeyS') || t.has('ArrowDown') ? 1 : 0) - (t.has('KeyW') || t.has('ArrowUp') ? 1 : 0) + this.joy.y;
    const n = Math.hypot(ax, az);
    const court = t.has('ShiftLeft') || t.has('ShiftRight') || n > 1.4;
    if (this.conduite && this.lieu.nom !== 'hall') this.descendreVoiture();
    if (this.conduite?.genre === 'helico') this.avancerHelico(dt);
    else if (this.conduite) this.avancerVoiture(dt);
    else if (n > 0.08) {
      ax /= Math.max(n, 1); az /= Math.max(n, 1);
      const yaw = this.cam.mode === 'plan' ? Math.PI : this.cam.yaw;
      const dx = ax * Math.cos(yaw) + az * Math.sin(yaw);
      const dz = -ax * Math.sin(yaw) + az * Math.cos(yaw);
      const v = (court ? VITESSE.course : VITESSE.marche) * Math.min(1, n) * dt;
      const p = j.objet.position;
      p.x += dx * v; p.z += dz * v;
      this.collisions(p);
      const cible = Math.atan2(dx, dz);
      let d = cible - j.objet.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      j.objet.rotation.y += d * Math.min(1, dt * 10);
      j.jouer(court ? 'course' : 'marche', { fondu: 0.2 });
    } else j.jouer('repos', { fondu: 0.25 });
    j.mixer.update(dt);
    this.villeVivante?.avancer(dt);
    this.lieu?.avancer?.(dt);
    this.receptionniste?.mixer.update(dt);
    if (this.feuMat) this.feuMat.visible = performance.now() % 1600 < 700; // feu d'obstacle du mât
    for (const x of this.agents.values()) {
      x.perso.mixer.update(dt);
      const c = x.chemin;
      if (!c) continue;
      // Marche le long de son chemin, en boucle, à allure de promenade.
      const a = c.pts[c.i], b = c.pts[(c.i + 1) % c.pts.length];
      const long = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      c.t += (1.25 * dt) / long;
      if (c.t >= 1) { c.t -= 1; c.i = (c.i + 1) % c.pts.length; continue; }
      const o = x.perso.objet;
      o.position.set(a[0] + (b[0] - a[0]) * c.t, 0, a[1] + (b[1] - a[1]) * c.t);
      o.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    }

    // La réceptionniste se tourne vers le visiteur et le salue une fois.
    if (this.lieu.nom === 'hall' && this.receptionniste) {
      const r = this.receptionniste.objet;
      const dx = j.objet.position.x - r.position.x, dz = j.objet.position.z - r.position.z;
      const dist = Math.hypot(dx, dz);
      const vise = dist < 7 ? Math.atan2(dx, dz) : 0;
      let d = vise - r.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      r.rotation.y += d * Math.min(1, dt * 3);
      if (dist < 4.5 && !this.aSalue) {
        this.aSalue = true;
        this.receptionniste.jouer('salut', { unefois: true });
        setTimeout(() => this.receptionniste?.jouer('repos'), 2600);
      }
      if (dist > 9) this.aSalue = false;
    }

    // Ce qui est à portée (réceptionniste, ascenseur, agents).
    const p = j.objet.position;
    let proche = null;
    for (const x of this.lieu.poi) if (Math.hypot(p.x - x.x, p.z - x.z) < x.rayon) proche = x;
    if (this.lieu.nom === 'hall' && this.villeVivante) {
      for (const v of this.villeVivante.voituresLibres) if (Math.hypot(p.x - v.etat.x, p.z - v.etat.z) < 3.8) proche = { type: 'voiture', id: v.id };
      const hh = this.villeVivante.helico;
      if (hh && hh.etat.y < 0.1 && Math.hypot(p.x - hh.etat.x, p.z - hh.etat.z) < 6) proche = { type: 'helico', id: 'helico' };
      if (hh && !this.conduite) hh.animer(dt, 0); // rotor à l'arrêt, feux éteints
    }
    if (this.conduite) proche = null;
    for (const [id, x] of this.agents) {
      const q = x.perso.objet.position;
      if (Math.hypot(p.x - q.x, p.z - q.z) < 1.6) proche = { type: 'agent', id, nom: x.agent.nom };
    }
    const cle = proche ? `${proche.type}:${proche.id || proche.x}` : null;
    if (cle !== this.cleProche) { this.cleProche = cle; this.proche = proche; this.emettre({ type: 'proximite', cible: proche }); }

    // Caméra
    const tete = new THREE.Vector3(p.x, 1.55, p.z);
    j.objet.visible = this.cam.mode !== 'fps';
    if (this.conduite?.genre === 'helico') {
      const e = this.conduite.lb.etat, c = this.conduite, h = this.conduite.lb;
      j.objet.visible = false;
      const recul = 15 + Math.hypot(e.vx, e.vz) * 0.12;
      const voulu = new THREE.Vector3(e.x - Math.sin(e.cap) * recul, h.sol + e.y + 5.5, e.z - Math.cos(e.cap) * recul);
      if (this.camSnap) { this.camera.position.copy(voulu); this.camSnap = false; } else this.camera.position.lerp(voulu, Math.min(1, dt * 3));
      if (this.camera.position.y < 1.2) this.camera.position.y = 1.2;
      if (c.secousse > 0) { this.camera.position.x += (Math.random() - 0.5) * c.secousse; this.camera.position.y += (Math.random() - 0.5) * c.secousse; c.secousse = Math.max(0, c.secousse - dt * 1.5); }
      this.camera.lookAt(e.x + Math.sin(e.cap) * 6, h.sol + e.y + 1.5, e.z + Math.cos(e.cap) * 6);
    } else if (this.conduite) {
      // Derrière la voiture, un peu plus loin quand elle va vite ; petite secousse aux chocs.
      const e = this.conduite.lb.etat, c = this.conduite;
      j.objet.visible = false;
      const recul = 6.5 + Math.abs(e.vitesse) * 0.12, dir = e.vitesse < -0.5 ? -1 : 1;
      const voulu = new THREE.Vector3(e.x - Math.sin(e.cap) * recul * dir, 2.6 + Math.abs(e.vitesse) * 0.03, e.z - Math.cos(e.cap) * recul * dir);
      if (this.camSnap) { this.camera.position.copy(voulu); this.camSnap = false; } else this.camera.position.lerp(voulu, Math.min(1, dt * 4));
      if (c.secousse > 0) { this.camera.position.x += (Math.random() - 0.5) * c.secousse; this.camera.position.y += (Math.random() - 0.5) * c.secousse; c.secousse = Math.max(0, c.secousse - dt * 1.5); }
      this.camera.lookAt(e.x + Math.sin(e.cap) * 5 * dir, 1.1, e.z + Math.cos(e.cap) * 5 * dir);
    } else if (this.vueChantiersT != null && this.lieu.nom === 'hall') {
      // La frise du temps : on prend de la hauteur au-dessus du quartier des
      // projets, en se balançant doucement, pour voir les chantiers grandir.
      this.vueChantiersT += dt;
      const a = Math.sin(this.vueChantiersT * 0.12) * 0.55;
      // Assez loin pour que les 3 × 2 chantiers tiennent en largeur, même sur un téléphone debout.
      const demiLarg = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
      const d = Math.max(34, 17 / demiLarg);
      const voulu = new THREE.Vector3(Math.sin(a) * d, 8 + d * 0.5, 52.5 - Math.cos(a) * d);
      this.camera.position.lerp(voulu, Math.min(1, dt * 2));
      this.camera.lookAt(0, 8, 52.5);
    } else if (this.cam.mode === 'fps') {
      this.camera.position.set(p.x, 1.62, p.z);
      this.camera.lookAt(p.x - Math.sin(this.cam.yaw) * 5, 1.62 - this.cam.pitch * 3, p.z - Math.cos(this.cam.yaw) * 5);
    } else if (this.cam.mode === 'plan') {
      this.camera.position.lerp(new THREE.Vector3(p.x, 16, p.z + 7), Math.min(1, dt * 4));
      this.camera.lookAt(p.x, 0, p.z);
    } else {
      const d = this.cam.dist;
      const voulu = new THREE.Vector3(p.x + Math.sin(this.cam.yaw) * d * Math.cos(this.cam.pitch), 1.4 + Math.sin(this.cam.pitch) * d + 0.3, p.z + Math.cos(this.cam.yaw) * d * Math.cos(this.cam.pitch));
      const I = this.lieu.interieur;
      const dedans = I && p.x > I.x0 && p.x < I.x1 && p.z > I.z0 && p.z < I.z1;
      const L = dedans ? { x0: I.x0 + 0.3, x1: I.x1 - 0.3, z0: I.z0 + 0.3, z1: I.z1 - 0.3 } : this.lieu.limites;
      voulu.x = THREE.MathUtils.clamp(voulu.x, L.x0 + 0.25, L.x1 - 0.25);
      voulu.z = THREE.MathUtils.clamp(voulu.z, L.z0 + 0.25, L.z1 - 0.25);
      const reel = Math.hypot(voulu.x - p.x, voulu.z - p.z), ideal = Math.max(0.01, d * Math.cos(this.cam.pitch));
      voulu.y = 1.55 + (voulu.y - 1.55) * Math.min(1, reel / ideal);
      voulu.y = Math.min(voulu.y, this.lieu.nom === 'hall' ? (dedans ? 5.2 : 12) : 3.2);
      if (this.camSnap) { this.camera.position.copy(voulu); this.camSnap = false; } else this.camera.position.lerp(voulu, Math.min(1, dt * 8));
      this.camera.lookAt(tete);
    }
    this.soleil.target.position.set(p.x, 0, p.z);
  }
  collisions(p) {
    const L = this.lieu.limites;
    p.x = THREE.MathUtils.clamp(p.x, L.x0 + RAYON, L.x1 - RAYON);
    p.z = THREE.MathUtils.clamp(p.z, L.z0 + RAYON, L.z1 - RAYON);
    const murs = this.lieu.nom === 'hall' && this.villeVivante ? [...this.lieu.murs, ...this.villeVivante.tours] : this.lieu.murs;
    for (const b of murs) {
      if (p.x > b.x0 - RAYON && p.x < b.x1 + RAYON && p.z > b.z0 - RAYON && p.z < b.z1 + RAYON) {
        const g = p.x - (b.x0 - RAYON), d = (b.x1 + RAYON) - p.x, h = p.z - (b.z0 - RAYON), bas = (b.z1 + RAYON) - p.z;
        const m = Math.min(g, d, h, bas);
        if (m === g) p.x = b.x0 - RAYON; else if (m === d) p.x = b.x1 + RAYON; else if (m === h) p.z = b.z0 - RAYON; else p.z = b.z1 + RAYON;
      }
    }
  }
  redimensionner() {
    const w = this.conteneur.clientWidth || 800, h = this.conteneur.clientHeight || 600;
    this.rendu.setSize(w, h);
    this.etiquettes.setSize(w, h);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 70 : 55;
    this.camera.updateProjectionMatrix();
    this.planete?.redimensionner(w, h);
  }
  detruire() {
    this.vivant = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.surTouche);
    window.removeEventListener('keyup', this.surTouche);
    window.removeEventListener('resize', this.surRedim);
    this.rendu.dispose();
    this.conteneur.innerHTML = '';
  }
}
