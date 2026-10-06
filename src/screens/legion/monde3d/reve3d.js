// LE MONDE DE RÊVE (lot 3.7, E12) : un mode qu'on allume (la ville réelle reste
// réaliste). Au-dessus du centre, des couloirs aériens lumineux où passent des
// voitures volantes ; un parc suspendu entre deux tours ; la nuit, des aurores.
// Sur la mer des maisons, des dauphins qui sautent — et parfois s'envolent.
// Rien ici ne vient des données : c'est du décor, et il est présenté comme tel.
import * as THREE from 'three';

// Les couloirs : trois boucles à des hauteurs différentes (rayons en m).
export const COULOIRS = [
  { h: 46, rx: 70, rz: 55, couleur: '#4cc9f0', vitesse: 22, n: 5 },
  { h: 62, rx: 105, rz: 80, couleur: '#f72585', vitesse: 28, n: 6 },
  { h: 80, rx: 50, rz: 95, couleur: '#e3a857', vitesse: 18, n: 4 },
];

// Un point d'une boucle à la fraction u (0 → 1), légèrement ondulée en hauteur.
export function pointCouloir(c, u) {
  const a = u * Math.PI * 2;
  return { x: Math.cos(a) * c.rx, y: c.h + Math.sin(a * 3) * 3, z: Math.sin(a) * c.rz };
}

// Les deux tours les plus hautes assez proches l'une de l'autre (25 à 70 m),
// pour y suspendre le parc. null s'il n'y en a pas.
export function toursDuParc(tours) {
  const hautes = [...tours].filter((t) => Math.hypot(t.bx, t.bz) < 130).sort((a, b) => b.h - a.h).slice(0, 12);
  let mieux = null;
  for (let i = 0; i < hautes.length; i += 1) for (let j = i + 1; j < hautes.length; j += 1) {
    const a = hautes[i], b = hautes[j];
    const d = Math.hypot(a.bx - b.bx, a.bz - b.bz);
    if (d < 25 || d > 70) continue;
    const h = Math.min(a.h, b.h);
    if (h < 30) continue;
    if (!mieux || h > mieux.h) mieux = { a, b, h, d };
  }
  return mieux;
}

function voitureVolante(couleur) {
  const g = new THREE.Group();
  const caisse = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 2.4, 6, 12), new THREE.MeshStandardMaterial({ color: '#e9edf2', metalness: 0.8, roughness: 0.25 }));
  caisse.rotation.z = Math.PI / 2; g.add(caisse);
  const bulle = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1b2531', metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.7 }));
  bulle.position.set(0.2, 0.45, 0); g.add(bulle);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.1, 20), new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.rotation.x = Math.PI / 2; halo.position.y = -0.8; g.add(halo);
  return g;
}

function arbre() {
  const g = new THREE.Group();
  const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 2, 8), new THREE.MeshStandardMaterial({ color: '#6b4a2b' })); tronc.position.y = 1; g.add(tronc);
  const feuilles = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), new THREE.MeshStandardMaterial({ color: '#3f8f4f', roughness: 0.9, flatShading: true })); feuilles.position.y = 2.8; g.add(feuilles);
  return g;
}

// Les aurores : de grands rubans aux couleurs qui ondulent (shader), visibles la nuit.
function aurores() {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { t: { value: 0 }, force: { value: 0 } },
    vertexShader: 'varying vec2 vUv; uniform float t; void main(){ vUv = uv; vec3 p = position; p.z += sin(uv.x * 9.0 + t * 0.6) * 18.0; p.y += sin(uv.x * 5.0 - t * 0.4) * 6.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float t; uniform float force; void main(){ float bande = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)); float ondes = 0.55 + 0.45 * sin(vUv.x * 40.0 + t * 1.3); vec3 vert = vec3(0.2, 1.0, 0.55); vec3 violet = vec3(0.65, 0.3, 1.0); vec3 c = mix(vert, violet, smoothstep(0.35, 1.0, vUv.y)); float bords = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x)); gl_FragColor = vec4(c, bande * ondes * bords * 0.55 * force); }',
  });
  for (const [x, z, ry, l] of [[-120, -260, 0.15, 520], [160, -300, -0.3, 420], [0, -340, 0.05, 640]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, 90, 64, 1), mat);
    m.position.set(x, 150, z); m.rotation.y = ry; g.add(m);
  }
  return { groupe: g, mat };
}

export function construireReve({ tours = [], mobile = false } = {}) {
  const groupe = new THREE.Group();
  groupe.name = 'reve';
  // Les couloirs lumineux, et leurs voitures.
  const voitures = [];
  for (const c of COULOIRS) {
    const pts = Array.from({ length: 64 }, (_, i) => { const p = pointCouloir(c, i / 64); return new THREE.Vector3(p.x, p.y, p.z); });
    const courbe = new THREE.CatmullRomCurve3(pts, true);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(courbe, 160, 0.5, 6, true), new THREE.MeshBasicMaterial({ color: c.couleur, transparent: true, opacity: 0.8, depthWrite: false }));
    groupe.add(tube);
    // Des anneaux, tous les 1/16 de boucle, comme des portes du couloir.
    for (let k = 0; k < 16; k += 1) {
      const u = k / 16, p = pointCouloir(c, u), q = pointCouloir(c, u + 0.001);
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 6, 28), new THREE.MeshBasicMaterial({ color: c.couleur, transparent: true, opacity: 0.85, depthWrite: false }));
      anneau.position.set(p.x, p.y, p.z); anneau.lookAt(q.x, q.y, q.z); groupe.add(anneau);
    }
    const longueur = courbe.getLength();
    for (let k = 0; k < (mobile ? Math.ceil(c.n / 2) : c.n); k += 1) {
      const v = voitureVolante(c.couleur);
      groupe.add(v);
      voitures.push({ objet: v, c, u: k / c.n, pas: c.vitesse / longueur });
    }
  }
  // Le parc suspendu entre deux tours.
  const duo = toursDuParc(tours);
  if (duo) {
    const { a, b, h } = duo;
    const y = h - 6;
    const mx = (a.bx + b.bx) / 2, mz = (a.bz + b.bz) / 2;
    const ang = Math.atan2(b.bz - a.bz, b.bx - a.bx);
    const l = Math.hypot(b.bx - a.bx, b.bz - a.bz);
    const parc = new THREE.Group();
    parc.position.set(mx, y, mz); parc.rotation.y = -ang;
    const dalle = new THREE.Mesh(new THREE.BoxGeometry(l, 1.2, 12), new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: 0.8 }));
    parc.add(dalle);
    const herbe = new THREE.Mesh(new THREE.BoxGeometry(l - 2, 0.3, 10), new THREE.MeshStandardMaterial({ color: '#4f9a54', roughness: 1 }));
    herbe.position.y = 0.75; parc.add(herbe);
    const verre = new THREE.MeshStandardMaterial({ color: '#9fd3ff', transparent: true, opacity: 0.35, metalness: 0.2, roughness: 0.05 });
    for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.BoxGeometry(l, 1.2, 0.08), verre); g.position.set(0, 1.4, s * 6); parc.add(g); }
    for (let k = 0; k < Math.floor(l / 6); k += 1) { const t = arbre(); t.position.set(-l / 2 + 4 + k * 6, 0.9, (k % 2 ? 2.5 : -2.5)); t.scale.setScalar(0.8 + (k % 3) * 0.15); parc.add(t); }
    // Des lumières douces sous le pont-jardin.
    const lueur = new THREE.Mesh(new THREE.BoxGeometry(l, 0.1, 11), new THREE.MeshBasicMaterial({ color: '#e3a857', transparent: true, opacity: 0.35 }));
    lueur.position.y = -0.65; parc.add(lueur);
    groupe.add(parc);
  }
  const A = aurores();
  groupe.add(A.groupe);
  return {
    groupe,
    parc: !!duo,
    animer(dt, niveauNuit = 0) {
      const t = performance.now() / 1000;
      for (const v of voitures) {
        v.u = (v.u + v.pas * dt) % 1;
        const p = pointCouloir(v.c, v.u), q = pointCouloir(v.c, v.u + 0.004);
        v.objet.position.set(p.x, p.y, p.z);
        v.objet.lookAt(q.x, q.y, q.z);
        v.objet.rotateY(-Math.PI / 2); // la caisse est allongée sur x
      }
      A.mat.uniforms.t.value = t;
      A.mat.uniforms.force.value = Math.max(0, Math.min(1, niveauNuit * 1.2));
      A.groupe.visible = niveauNuit > 0.2;
    },
  };
}

// Les dauphins de la mer des maisons (z > rivage). Un saut tous les quelques
// secondes ; en monde de rêve, un sur trois s'envole un moment.
export function sautDauphin(t, periode = 4.5, hauteur = 2.2) {
  const k = ((t % periode) + periode) % periode / periode;
  if (k > 0.35) return { y: -1.2, dans: false, k }; // sous l'eau la plupart du temps
  const s = k / 0.35; // 0 → 1 pendant le saut
  return { y: -0.4 + Math.sin(s * Math.PI) * hauteur, dans: true, k: s };
}

function dauphin() {
  const g = new THREE.Group();
  const peau = new THREE.MeshStandardMaterial({ color: '#7b8fa1', roughness: 0.35, metalness: 0.1 });
  const corps = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10), peau); corps.scale.set(2.6, 0.9, 0.9); g.add(corps);
  const bec = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 10), peau); bec.rotation.z = -Math.PI / 2; bec.position.set(1.25, -0.05, 0); g.add(bec);
  const aileron = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), peau); aileron.position.set(-0.1, 0.5, 0); aileron.rotation.z = 0.4; g.add(aileron);
  const queue = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.8), peau); queue.position.set(-1.2, 0, 0); g.add(queue);
  return g;
}

export function construireDauphins(rivage) {
  const groupe = new THREE.Group();
  const liste = Array.from({ length: 6 }, (_, i) => {
    const o = dauphin();
    groupe.add(o);
    return { o, x: -60 + i * 22, z: rivage + 30 + (i % 3) * 14, decal: i * 1.3, vole: i % 3 === 0 };
  });
  return {
    groupe,
    animer(dt, reve) {
      const t = performance.now() / 1000;
      for (const d of liste) {
        const s = sautDauphin(t + d.decal);
        let y = s.y;
        // En rêve, un dauphin sur trois s'envole au-dessus de la mer pendant son saut.
        if (reve && d.vole && s.dans) y += Math.sin(s.k * Math.PI) * 9;
        d.x += dt * 4; if (d.x > 120) d.x = -120;
        d.o.position.set(d.x, y, d.z);
        d.o.rotation.z = s.dans ? Math.cos(s.k * Math.PI) * 0.9 : 0;
        d.o.visible = y > -1;
      }
    },
  };
}
