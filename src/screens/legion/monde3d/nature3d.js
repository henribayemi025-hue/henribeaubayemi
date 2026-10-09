// Le dessin du coin nature de la campagne (Beau, 09/10 : « je veux aussi cette
// visu », une vidéo de forêt avec un ruisseau et des galets). Tout est fait ici,
// sans aucune image prise ailleurs : les textures (lit de galets, herbe, feuilles,
// pierre, écorce, ondes de l'eau) sont dessinées au chargement. Logique et
// placements : nature.js.
//   - l'eau coule (deux couches d'ondes qui défilent dans le sens du courant),
//     reflète le vrai ciel, laisse voir le lit de galets, avec de l'écume au bord ;
//   - des galets arrondis à demi immergés, des rochers moussus sur les berges ;
//   - de l'herbe haute qui bouge au vent, des roseaux, des arbres feuillus ;
//   - le tunnel de pierre sous une butte moussue, un pont de bois, une mare ;
//   - des poussières de lumière au-dessus de l'eau.
// Au téléphone : moins de tout (herbe, galets, arbres), une seule couche d'ondes.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { axeRuisseau, dansEau, placerGalets, placerRochers, placerTouffes, placerRoseaux, placerArbres, placePont, alea, BANDE, MARE, BUTTE, SOURCE } from './nature';

const Y_LIT = 0.012, Y_EAU = 0.07;

// ——— Le bruit (pour les textures et les formes) ———
const hash2 = (x, y, p) => { const xi = ((x % p) + p) % p, yi = ((y % p) + p) % p; const s = Math.sin(xi * 127.1 + yi * 311.7) * 43758.5453; return s - Math.floor(s); };
const lisse = (t) => t * t * (3 - 2 * t);
function bruit2(x, y, p) { // périodique de période p : la texture se raccorde
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = lisse(x - x0), fy = lisse(y - y0);
  const a = hash2(x0, y0, p), b = hash2(x0 + 1, y0, p), c = hash2(x0, y0 + 1, p), d = hash2(x0 + 1, y0 + 1, p);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function fbm2(x, y, p, oct = 4) { let v = 0, amp = 0.5, f = 1; for (let o = 0; o < oct; o += 1) { v += amp * bruit2(x * f, y * f, p * f); amp *= 0.5; f *= 2; } return v; }
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function bruit3(x, y, z) {
  const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z), fx = lisse(x - x0), fy = lisse(y - y0), fz = lisse(z - z0);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash3(x0 + i, y0 + j, z0 + k);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy), l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
}
const fbm3 = (x, y, z) => 0.55 * bruit3(x, y, z) + 0.3 * bruit3(x * 2.1, y * 2.1, z * 2.1) + 0.15 * bruit3(x * 4.3, y * 4.3, z * 4.3);

// ——— Les textures dessinées ———
function toile(l, h = l) { const c = document.createElement('canvas'); c.width = l; c.height = h; return [c, c.getContext('2d')]; }
function texture(c, { repete = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function pixels(l, h, f) { // f(u, v) → [r, g, b, a] en 0..255
  const [c, x] = toile(l, h);
  const img = x.createImageData(l, h);
  for (let j = 0; j < h; j += 1) for (let i = 0; i < l; i += 1) { const v = f(i, j); const k = (j * l + i) * 4; img.data[k] = v[0]; img.data[k + 1] = v[1]; img.data[k + 2] = v[2]; img.data[k + 3] = v[3] ?? 255; }
  x.putImageData(img, 0, 0);
  return c;
}

// Les ondes de l'eau : une carte de normales qui se raccorde, tirée d'un relief de bruit.
function texOndes(taille, freq, etire = 1) {
  const h = (i, j) => fbm2((i / taille) * freq, (j / taille) * freq * etire, freq, 4);
  return texture(pixels(taille, taille, (i, j) => {
    const dx = (h(i + 1, j) - h(i - 1, j)) * 6, dy = (h(i, j + 1) - h(i, j - 1)) * 6;
    const n = new THREE.Vector3(-dx, -dy, 1).normalize();
    return [(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255];
  }), { srgb: false });
}

// Le lit du ruisseau : du sable sombre couvert de petits galets.
function texLit() {
  const [c, x] = toile(512);
  x.fillStyle = '#585645'; x.fillRect(0, 0, 512, 512);
  const r = alea(21);
  const teintes = ['#7d7563', '#8f8672', '#5e5747', '#a39a84', '#6b6656', '#857a64', '#4f4b3e'];
  for (let k = 0; k < 1500; k += 1) {
    const px = r() * 512, py = r() * 512, rx = 2 + r() ** 2 * 9, ry = rx * (0.6 + r() * 0.4), a = r() * Math.PI;
    for (const [dx, dy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {
      x.save(); x.translate(px + dx, py + dy); x.rotate(a);
      x.fillStyle = 'rgba(20,18,12,0.35)'; x.beginPath(); x.ellipse(1, 1.5, rx, ry, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = teintes[Math.floor(r() * teintes.length)]; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,240,0.10)'; x.beginPath(); x.ellipse(-rx * 0.3, -ry * 0.35, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    }
  }
  return texture(c);
}

// Le sol des berges : herbe rase, mousse et terre, par taches.
function texSol() {
  return texture(pixels(512, 512, (i, j) => {
    const a = fbm2(i / 64, j / 64, 8), b = fbm2(i / 16 + 7, j / 16 + 3, 32), g = bruit2(i / 2.2, j / 2.2, 233);
    const terre = Math.max(0, a - 0.62) * 3.2;
    const r0 = 52 + b * 38 + g * 20, g0 = 78 + b * 50 + g * 24, b0 = 30 + b * 16 + g * 9;
    return [r0 * (1 - terre) + 112 * terre, g0 * (1 - terre) + 96 * terre, b0 * (1 - terre) + 66 * terre];
  }));
}

// L'écume : des traînées blanches près des bords, étirées dans le sens du courant.
function texEcume() {
  return texture(pixels(128, 512, (i, j) => {
    const u = i / 128, bord = Math.max(0, 1 - Math.min(u, 1 - u) * 5.5);
    const trainee = fbm2(i / 6, j / 48, 21) * 1.3 - 0.35;
    const flocons = Math.max(0, bruit2(i / 3, j / 9, 43) - 0.82) * 4;
    const a = Math.max(0, Math.min(1, bord * trainee * 1.6 + flocons * 0.6));
    const v = a * 255;
    return [v, v, v];
  }), { srgb: false });
}

// Les feuilles : une grappe de feuilles détourée (le fond reste transparent).
function texFeuilles() {
  const [c, x] = toile(256);
  const r = alea(33);
  for (let k = 0; k < 260; k += 1) {
    const px = 18 + r() * 220, py = 18 + r() * 220;
    if (Math.hypot(px - 128, py - 128) > 118) continue;
    const l = 9 + r() * 10, a = r() * Math.PI * 2, t = r();
    x.save(); x.translate(px, py); x.rotate(a);
    x.fillStyle = `rgb(${Math.round(42 + t * 70)},${Math.round(82 + t * 80)},${Math.round(26 + t * 34)})`;
    x.beginPath(); x.moveTo(0, -l); x.quadraticCurveTo(l * 0.55, 0, 0, l); x.quadraticCurveTo(-l * 0.55, 0, 0, -l); x.fill();
    x.strokeStyle = 'rgba(20,40,10,0.35)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, -l * 0.9); x.lineTo(0, l * 0.9); x.stroke();
    x.restore();
  }
  return texture(c, { repete: false });
}

function texPierre() {
  return texture(pixels(256, 256, (i, j) => {
    const a = fbm2(i / 32, j / 32, 8), g = bruit2(i / 1.6, j / 1.6, 160), v = 150 + a * 70 + (g - 0.5) * 36;
    return [v, v * 0.97, v * 0.9];
  }));
}

function texEcorce() {
  return texture(pixels(64, 256, (i, j) => {
    const a = fbm2(i / 4, j / 40, 16), g = bruit2(i / 1.5, j / 3, 43), v = 60 + a * 50 + g * 20;
    return [v * 1.05, v * 0.85, v * 0.65];
  }));
}

function texPoussiere() {
  const [c, x] = toile(64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(0.35, 'rgba(255,240,200,0.45)'); g.addColorStop(1, 'rgba(255,240,200,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return texture(c, { repete: false });
}

// ——— Les formes ———
// Un ruban qui suit l'axe : u en travers (0 → 1), v le long (en mètres / echelleV).
function ruban(pts, demi, y, { colonnes = 5, echelleV = 4, couleur = null } = {}) {
  const pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    const ang = Math.atan2(q.z - o.z, q.x - o.x) + Math.PI / 2;
    const w = demi(p);
    for (let k = 0; k < colonnes; k += 1) {
      const u = k / (colonnes - 1), off = (u * 2 - 1) * w;
      pos.push(p.x + Math.cos(ang) * off, y, p.z + Math.sin(ang) * off);
      uv.push(u, p.s / echelleV);
      if (couleur) col.push(...couleur(u, p));
    }
    if (i > 0) for (let k = 0; k < colonnes - 1; k += 1) { const a = (i - 1) * colonnes + k, b = a + colonnes; idx.push(a, a + 1, b, a + 1, b + 1, b); } // face vers le ciel
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (couleur) g.setAttribute('color', new THREE.Float32BufferAttribute(col, col.length / (pos.length / 3)));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Un caillou : une sphère cabossée, aplatie comme un galet de rivière.
function formeCaillou(graine, detail, { aplati = 0.62, bosses = 0.2, mousse = false } = {}) {
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, detail));
  const p = g.attributes.position, v = new THREE.Vector3(), col = [];
  for (let i = 0; i < p.count; i += 1) {
    v.fromBufferAttribute(p, i).normalize();
    const r = 1 + bosses * (fbm3(v.x * 1.6 + graine, v.y * 1.6, v.z * 1.6) - 0.5) * 2 + 0.05 * (bruit3(v.x * 6 + graine, v.y * 6, v.z * 6) - 0.5);
    let y = v.y * r * aplati;
    if (y < -0.15) y = -0.15 + (y + 0.15) * 0.35; // le dessous posé à plat
    p.setXYZ(i, v.x * r, y, v.z * r);
    if (mousse) { const m = Math.max(0, Math.min(1, (v.y - 0.25) * 2.2 + (bruit3(v.x * 3 + graine, v.y * 3, v.z * 3) - 0.5))); col.push(0.62 - m * 0.3, 0.6 - m * 0.12, 0.55 - m * 0.33); }
  }
  if (mousse) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// Une touffe d'herbe : des brins effilés et courbés, plus sombres au pied.
function formeTouffe({ brins = 7, haut = [0.45, 0.85], large = 0.05, segments = 4, graine = 1, base = [0.17, 0.29, 0.1], pointe = [0.66, 0.77, 0.39] } = {}) {
  const r = alea(graine);
  const pos = [], col = [], nor = [], idx = [];
  for (let b = 0; b < brins; b += 1) {
    const h = haut[0] + r() * (haut[1] - haut[0]), a = r() * Math.PI * 2, d = r() * 0.12, courbe = 0.15 + r() * 0.3;
    const cx = Math.cos(a) * d, cz = Math.sin(a) * d, dirx = Math.cos(a + 1.3), dirz = Math.sin(a + 1.3);
    const debut = pos.length / 3;
    for (let s = 0; s <= segments; s += 1) {
      const t = s / segments, w = large * (1 - t * 0.92), y = h * t, pli = courbe * t * t * h;
      for (const c of [-1, 1]) {
        pos.push(cx + Math.cos(a) * pli + dirx * w * c * 0.5, y, cz + Math.sin(a) * pli + dirz * w * c * 0.5);
        col.push(base[0] + (pointe[0] - base[0]) * t, base[1] + (pointe[1] - base[1]) * t, base[2] + (pointe[2] - base[2]) * t);
        nor.push(Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3);
      }
      if (s > 0) { const k = debut + (s - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// Le vent dans l'herbe : les brins plient d'autant plus qu'ils sont hauts.
function auVent(mat, temps, force = 0.16) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTemps = temps;
    sh.vertexShader = 'uniform float uTemps;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float hh = max(position.y, 0.0);
      #ifdef USE_INSTANCING
        vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
      #else
        vec2 ip = vec2(0.0);
      #endif
      float souffle = sin(uTemps * 1.9 + ip.x * 0.31 + ip.y * 0.17) * 0.6 + sin(uTemps * 3.3 + ip.x * 0.7 - ip.y * 0.4) * 0.25;
      transformed.x += souffle * ${force.toFixed(3)} * hh * hh;
      transformed.z += souffle * ${(force * 0.45).toFixed(3)} * hh * hh;`);
  };
  mat.customProgramCacheKey = () => `herbe-vent-${force}`;
  return mat;
}

const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), vp = new THREE.Vector3(), vs = new THREE.Vector3(), eu = new THREE.Euler();
function instances(geo, mat, liste, poser, { ombre = false, couleur = null } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, liste.length));
  im.count = liste.length;
  liste.forEach((o, i) => { poser(o, i); im.setMatrixAt(i, m4.compose(vp, qt, vs)); if (couleur) im.setColorAt(i, couleur(o, i)); });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = ombre; im.receiveShadow = true;
  im.frustumCulled = false; // les instances couvrent toute la bande
  return im;
}

// Des arbres feuillus : un tronc d'écorce, une couronne de grappes de feuilles détourées autour
// d'un cœur vert. arbres : [{ x, z, h, rot, y? }]. Servent au coin nature et à toute la campagne.
export function arbresFeuillus(arbres, { mobile = false, graine = 19 } = {}) {
  const groupe = new THREE.Group();
  const r = alea(graine);
  const tEcorce = texEcorce(); tEcorce.repeat.set(2, 3);
  const geoTronc = new THREE.CylinderGeometry(0.14, 0.26, 1, 7, 3); geoTronc.translate(0, 0.5, 0);
  groupe.add(instances(geoTronc, new THREE.MeshStandardMaterial({ map: tEcorce, roughness: 0.95 }), arbres, (o) => {
    vp.set(o.x, o.y || 0, o.z); qt.setFromEuler(eu.set((r() - 0.5) * 0.08, o.rot, (r() - 0.5) * 0.08)); vs.set(o.h / 6.5, o.h * 0.72, o.h / 6.5);
  }, { ombre: !mobile }));
  const solides = arbres.filter((o) => !o.y).map((o) => ({ x0: o.x - 0.35, x1: o.x + 0.35, z0: o.z - 0.35, z1: o.z + 0.35 }));
  groupe.add(instances(formeCaillou(2.2, 1, { aplati: 0.85, bosses: 0.3 }), new THREE.MeshStandardMaterial({ color: '#3b5c27', roughness: 1 }), arbres, (o) => {
    vp.set(o.x, (o.y || 0) + o.h * 0.74, o.z); qt.identity(); vs.set(o.h * 0.22, o.h * 0.18, o.h * 0.22);
  }));
  const matFeuilles = new THREE.MeshStandardMaterial({ map: texFeuilles(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
  const cartes = [];
  const parArbre = mobile ? 24 : 50;
  for (const o of arbres) for (let k = 0; k < parArbre; k += 1) {
    const th = r() * Math.PI * 2, ph = Math.acos(1 - r() * 1.7), rr = 0.75 + r() * 0.3;
    cartes.push({ x: o.x + Math.sin(ph) * Math.cos(th) * o.h * 0.33 * rr, y: (o.y || 0) + o.h * 0.74 + Math.cos(ph) * o.h * 0.25 * rr, z: o.z + Math.sin(ph) * Math.sin(th) * o.h * 0.33 * rr, t: o.h * (0.2 + r() * 0.12), arbre: o });
  }
  const teinte = new Map();
  groupe.add(instances(new THREE.PlaneGeometry(1, 1), matFeuilles, cartes, (c) => {
    vp.set(c.x, c.y, c.z); qt.setFromEuler(eu.set(r() * Math.PI, r() * Math.PI * 2, r() * Math.PI)); vs.set(c.t, c.t, c.t);
  }, { ombre: !mobile, couleur: (c) => {
    if (!teinte.has(c.arbre)) teinte.set(c.arbre, new THREE.Color().setHSL(0.24 + r() * 0.07, 0.45 + r() * 0.2, 0.62 + r() * 0.12));
    return teinte.get(c.arbre).clone().multiplyScalar(0.85 + r() * 0.3);
  } }));
  return { groupe, solides, matFeuilles, tEcorce };
}

// La version légère, toujours là : le ruisseau vu de loin, sans détail.
export function ruisseauLeger() {
  const pts = axeRuisseau(4);
  const g = new THREE.Group();
  const eau = new THREE.Mesh(ruban(pts, (p) => p.l, 0.02, { colonnes: 2 }), new THREE.MeshStandardMaterial({ color: '#4d8178', roughness: 0.25 }));
  const mare = new THREE.Mesh(new THREE.CircleGeometry(MARE.r, 24), eau.material); mare.rotation.x = -Math.PI / 2; mare.position.set(MARE.x, 0.018, MARE.z);
  const butte = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5e6b45', roughness: 1 }));
  butte.scale.set(BUTTE.rx, BUTTE.h, BUTTE.rz); butte.position.set(BUTTE.x, 0, BUTTE.z);
  g.add(eau, mare, butte);
  return g;
}

// Les détails, construits à l'approche (avec la campagne).
export function construireNature({ mobile = false, env = null } = {}) {
  const groupe = new THREE.Group();
  groupe.name = 'coin-nature';
  const solides = [];
  const temps = { value: 0 };
  const pts = axeRuisseau(1.5);
  const ptsEau = pts.filter((p) => Math.hypot(p.x - MARE.x, p.z - MARE.z) > MARE.r - 4.5);
  // Le ruisseau se fond dans la mare une fois dedans (jamais avant son bord).
  const fondu = (p) => Math.max(0, Math.min(1, (Math.hypot(p.x - MARE.x, p.z - MARE.z) - (MARE.r - 4)) / 3));
  const pont = placePont(pts);

  // Le sol des berges (herbe rase et terre), sous tout le reste.
  const tSol = texSol(); tSol.repeat.set((BANDE.x1 - BANDE.x0) / 9, (BANDE.z1 - BANDE.z0) / 9);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(BANDE.x1 - BANDE.x0, BANDE.z1 - BANDE.z0), new THREE.MeshStandardMaterial({ map: tSol, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set((BANDE.x0 + BANDE.x1) / 2, 0.003, (BANDE.z0 + BANDE.z1) / 2); sol.receiveShadow = true;
  groupe.add(sol);

  // La rive mouillée : une bande de terre sombre qui s'efface vers l'herbe.
  const tLit = texLit(); tLit.repeat.set(2, 1);
  const rive = new THREE.Mesh(ruban(ptsEau, (p) => p.l + 1.5, 0.007, { colonnes: 5, couleur: (u, p) => { const bord = Math.min(u, 1 - u) * 2; return [0.42, 0.38, 0.3, Math.min(1, bord * 2.4) * fondu(p)]; } }),
    new THREE.MeshStandardMaterial({ map: tLit, vertexColors: true, transparent: true, roughness: 0.95, depthWrite: false }));
  rive.receiveShadow = true; groupe.add(rive);

  // Le lit : les petits galets qu'on voit à travers l'eau.
  const ptsLit = ptsEau.filter((p) => Math.hypot(p.x - MARE.x, p.z - MARE.z) > MARE.r - 0.6);
  const lit = new THREE.Mesh(ruban(ptsLit, (p) => p.l + 0.35, Y_LIT, { colonnes: 5, couleur: (u) => { const c = 0.42 + Math.min(u, 1 - u) * 0.5; return [c, c * 0.98, c * 0.88]; } }),
    new THREE.MeshStandardMaterial({ map: tLit, vertexColors: true, roughness: 0.85 }));
  lit.receiveShadow = true; groupe.add(lit);
  const litMare = new THREE.Mesh(new THREE.CircleGeometry(MARE.r + 0.3, 40), new THREE.MeshStandardMaterial({ map: tLit, color: '#7d7a6a', roughness: 0.85 }));
  litMare.rotation.x = -Math.PI / 2; litMare.position.set(MARE.x, Y_LIT - 0.002, MARE.z); groupe.add(litMare);

  // L'eau : transparente au bord, plus profonde au milieu, deux couches d'ondes qui coulent.
  const ondesA = texOndes(256, 4), ondesB = texOndes(256, 8, 2);
  ondesA.repeat.set(1.5, 1); ondesB.repeat.set(3, 2);
  const matEau = mobile
    ? new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, transparent: true, roughness: 0.14, metalness: 0, normalMap: ondesA, normalScale: new THREE.Vector2(0.5, 0.5), envMap: env, envMapIntensity: 0.32, depthWrite: false })
    : new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, transparent: true, roughness: 0.12, metalness: 0, normalMap: ondesA, normalScale: new THREE.Vector2(0.45, 0.45), clearcoat: 0.5, clearcoatRoughness: 0.08, clearcoatNormalMap: ondesB, clearcoatNormalScale: new THREE.Vector2(0.35, 0.35), envMap: env, envMapIntensity: 0.35, depthWrite: false });
  const eau = new THREE.Mesh(ruban(ptsEau, (p) => p.l + 0.15, Y_EAU, { colonnes: 7, couleur: (u, p) => {
    const bord = 1 - Math.abs(u * 2 - 1); // 0 au bord, 1 au milieu
    return [0.3 - bord * 0.2, 0.44 - bord * 0.16, 0.36 - bord * 0.1, (0.58 + bord * 0.36) * fondu(p)];
  } }), matEau);
  eau.renderOrder = 2; groupe.add(eau);
  const matMare = matEau.clone();
  const ondesMareA = ondesA.clone(), ondesMareB = ondesB.clone();
  ondesMareA.repeat.set(3, 3); ondesMareB.repeat.set(6, 6);
  matMare.normalMap = ondesMareA; if (!mobile) matMare.clearcoatNormalMap = ondesMareB;
  const geoMare = new THREE.CircleGeometry(MARE.r, 48);
  const cMare = [];
  const pm = geoMare.attributes.position;
  for (let i = 0; i < pm.count; i += 1) { const d = Math.min(1, Math.hypot(pm.getX(i), pm.getY(i)) / MARE.r); const prof = 1 - d; cMare.push(0.34 - prof * 0.24, 0.48 - prof * 0.22, 0.4 - prof * 0.16, 0.55 + prof * 0.4); }
  geoMare.setAttribute('color', new THREE.Float32BufferAttribute(cMare, 4));
  const mare = new THREE.Mesh(geoMare, matMare); mare.rotation.x = -Math.PI / 2; mare.position.set(MARE.x, Y_EAU - 0.004, MARE.z); mare.renderOrder = 2;
  groupe.add(mare);

  // L'écume au bord du courant.
  const tEcume = texEcume(); tEcume.repeat.set(1, 1);
  const ecume = new THREE.Mesh(ruban(ptsEau, (p) => p.l + 0.1, Y_EAU + 0.006, { colonnes: 5, echelleV: 6 }),
    new THREE.MeshBasicMaterial({ color: '#eef5f2', alphaMap: tEcume, transparent: true, opacity: 0.55, depthWrite: false }));
  ecume.renderOrder = 3; groupe.add(ecume);

  // Les galets : trois formes, à demi dans l'eau ; un peu plus sombres quand ils sont mouillés.
  const tPierre = texPierre();
  const matPierre = new THREE.MeshStandardMaterial({ map: tPierre, roughness: 0.78 });
  const galets = placerGalets(pts, mobile ? 140 : 420);
  const teintes = ['#d4c9b1', '#b4afa3', '#c6b394', '#a59e90', '#cfc0a2'].map((c) => new THREE.Color(c));
  const rg = alea(17);
  for (let f = 0; f < 3; f += 1) {
    const lot = galets.filter((_, i) => i % 3 === f);
    groupe.add(instances(formeCaillou(f * 13.7, mobile ? 1 : 2), matPierre, lot, (o) => {
      vp.set(o.x, o.eau ? Y_LIT + o.s * 0.12 : o.s * 0.16, o.z);
      qt.setFromEuler(eu.set((rg() - 0.5) * 0.3, rg() * Math.PI * 2, (rg() - 0.5) * 0.3));
      vs.set(o.s * (0.9 + rg() * 0.5), o.s, o.s * (0.8 + rg() * 0.4));
    }, { ombre: !mobile, couleur: (o) => teintes[Math.floor(rg() * teintes.length)].clone().multiplyScalar(o.eau ? 0.78 : 1) }));
  }

  // Les rochers moussus.
  const rochers = placerRochers(pts, mobile ? 8 : 18, 11, pont);
  const matRocher = new THREE.MeshStandardMaterial({ map: tPierre, vertexColors: true, roughness: 0.9 });
  groupe.add(instances(formeCaillou(5.1, 2, { aplati: 0.7, bosses: 0.32, mousse: true }), matRocher, rochers, (o) => {
    vp.set(o.x, o.s * 0.12, o.z); qt.setFromEuler(eu.set(0, rg() * Math.PI * 2, 0)); vs.set(o.s * 1.2, o.s, o.s);
  }, { ombre: !mobile, couleur: () => new THREE.Color().setHSL(0.11, 0.08, 0.62 + rg() * 0.2) }));
  for (const o of rochers) if (o.s > 1.2 && !dansEau(pts, o.x, o.z)) solides.push({ x0: o.x - o.s, x1: o.x + o.s, z0: o.z - o.s * 0.8, z1: o.z + o.s * 0.8 });

  // L'herbe haute qui bouge au vent.
  const matHerbe = auVent(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.92 }), temps);
  const touffes = placerTouffes(pts, mobile ? 1600 : 6500);
  for (let f = 0; f < 2; f += 1) {
    const lot = touffes.filter((_, i) => i % 2 === f);
    groupe.add(instances(formeTouffe({ graine: 3 + f * 9, brins: mobile ? 5 : 7 }), matHerbe, lot, (o) => {
      vp.set(o.x, 0, o.z); qt.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, o.rot); vs.set(o.s, o.s * (0.85 + rg() * 0.4), o.s);
    }, { couleur: () => new THREE.Color().setHSL(0.2 + rg() * 0.06, 0.45 + rg() * 0.2, 0.42 + rg() * 0.16) }));
  }

  // Les roseaux, au bord de l'eau et autour de la mare.
  const matRoseau = auVent(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 }), temps, 0.08);
  groupe.add(instances(formeTouffe({ graine: 41, brins: 6, haut: [1.1, 1.8], large: 0.04, segments: 5, base: [0.2, 0.27, 0.12], pointe: [0.52, 0.6, 0.3] }), matRoseau, placerRoseaux(pts, mobile ? 70 : 220), (o) => {
    vp.set(o.x, 0, o.z); qt.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, o.rot); vs.set(o.s, o.s, o.s);
  }));

  // Les arbres feuillus (les mêmes que dans toute la campagne).
  const arbres = placerArbres(pts, mobile ? 14 : 34, 9, pont);
  // Un arbre au sommet de la butte, comme sur la vidéo.
  arbres.push({ x: BUTTE.x + 1.2, z: BUTTE.z - 1.5, h: 6.5, rot: 1.1, y: BUTTE.h * 0.82 });
  const feuillus = arbresFeuillus(arbres, { mobile, graine: 19 });
  groupe.add(feuillus.groupe);
  solides.push(...feuillus.solides);
  const tEcorce = feuillus.tEcorce;

  // Des buissons au bord de l'eau et sur la butte.
  const rb = alea(77);
  const buissons = [];
  for (let k = 0; buissons.length < (mobile ? 16 : 44) && k < 400; k += 1) {
    const p = pts[2 + Math.floor(rb() * (pts.length - 4))], s = rb() < 0.5 ? -1 : 1, off = s * (p.l + 1 + rb() * 2.5);
    const x = p.x + (rb() - 0.5) * 2, z = p.z + off;
    if (Math.abs(x - pont.x) < 3 || z < BANDE.z0 + 1 || z > BANDE.z1 - 1) continue;
    buissons.push({ x, z, y: 0, r: 0.6 + rb() * 0.7 });
  }
  for (let k = 0; k < 9; k += 1) { const a = rb() * Math.PI * 2, d = 0.3 + rb() * 0.5; const ex = Math.cos(a) * d, ez = Math.sin(a) * d; buissons.push({ x: BUTTE.x + ex * BUTTE.rx, z: BUTTE.z + ez * BUTTE.rz, y: BUTTE.h * Math.sqrt(Math.max(0, 1 - d * d)) - 0.3, r: 0.7 + rb() * 0.6 }); }
  const cartes = [];
  for (const b of buissons) for (let k = 0; k < (mobile ? 6 : 11); k += 1) cartes.push({ x: b.x + (rb() - 0.5) * b.r * 1.4, y: b.y + b.r * (0.35 + rb() * 0.6), z: b.z + (rb() - 0.5) * b.r * 1.4, t: b.r * (0.6 + rb() * 0.35), arbre: b });
  const teinteBuisson = new Map();
  groupe.add(instances(new THREE.PlaneGeometry(1, 1), feuillus.matFeuilles, cartes, (c) => {
    vp.set(c.x, c.y, c.z); qt.setFromEuler(eu.set(rg() * Math.PI, rg() * Math.PI * 2, rg() * Math.PI)); vs.set(c.t, c.t, c.t);
  }, { ombre: !mobile, couleur: (c) => {
    if (!teinteBuisson.has(c.arbre)) teinteBuisson.set(c.arbre, new THREE.Color().setHSL(0.25 + rg() * 0.06, 0.45 + rg() * 0.2, 0.6 + rg() * 0.12));
    return teinteBuisson.get(c.arbre).clone().multiplyScalar(0.85 + rg() * 0.3);
  } }));

  // La butte moussue au-dessus du tunnel, avec sa face plate côté ruisseau.
  const geoButte = mergeVertices(new THREE.IcosahedronGeometry(1, mobile ? 3 : 4));
  const pb = geoButte.attributes.position, vb = new THREE.Vector3(), colB = [];
  const face = -0.82;
  for (let i = 0; i < pb.count; i += 1) {
    vb.fromBufferAttribute(pb, i).normalize();
    const r = 1 + 0.16 * (fbm3(vb.x * 2.2, vb.y * 2.2, vb.z * 2.2) - 0.5) * 2;
    let x = vb.x * r; const y = Math.max(-0.2, vb.y * r); const z = vb.z * r;
    if (x < face) x = face + (x - face) * 0.08;
    pb.setXYZ(i, x, y, z);
    const ny = vb.y, m = Math.max(0, Math.min(1, (ny - 0.15) * 1.8 + (bruit3(vb.x * 4, vb.y * 4, vb.z * 4) - 0.5) * 0.9));
    colB.push(0.5 - m * 0.2, 0.49 - m * 0.06, 0.44 - m * 0.24);
  }
  geoButte.setAttribute('color', new THREE.Float32BufferAttribute(colB, 3));
  geoButte.computeVertexNormals();
  const butte = new THREE.Mesh(geoButte, new THREE.MeshStandardMaterial({ map: tPierre, vertexColors: true, roughness: 0.95 }));
  butte.scale.set(BUTTE.rx, BUTTE.h, BUTTE.rz); butte.position.set(BUTTE.x, 0, BUTTE.z); butte.castShadow = !mobile; butte.receiveShadow = true;
  groupe.add(butte);
  solides.push({ x0: BUTTE.x - BUTTE.rx * 0.85, x1: BUTTE.x + BUTTE.rx, z0: BUTTE.z - BUTTE.rz * 0.85, z1: BUTTE.z + BUTTE.rz * 0.85 });

  // Le tunnel : une voûte de pierre et le noir de la galerie, posés devant la face plate de la butte.
  const xFace = BUTTE.x + face * BUTTE.rx - 0.3, rArche = 2.1;
  const noir = new THREE.Mesh(new THREE.CircleGeometry(rArche, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#060705' }));
  noir.rotation.y = -Math.PI / 2; noir.position.set(xFace + 0.02, Y_EAU - 0.05, SOURCE.z); groupe.add(noir);
  const matTaille = new THREE.MeshStandardMaterial({ map: tPierre, color: '#9d968a', roughness: 0.92, flatShading: true });
  const voute = new THREE.Mesh(new THREE.TorusGeometry(rArche + 0.32, 0.42, 6, 14, Math.PI), matTaille);
  voute.rotation.y = Math.PI / 2; voute.position.set(xFace - 0.05, Y_EAU - 0.05, SOURCE.z); voute.castShadow = !mobile; groupe.add(voute);
  for (const s of [-1, 1]) { const mur = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 2.4), matTaille); mur.position.set(xFace - 0.2, 0.55, SOURCE.z + s * (rArche + 1.5)); mur.rotation.y = s * 0.35; mur.castShadow = !mobile; groupe.add(mur); }

  // Le pont de bois.
  const bois = new THREE.MeshStandardMaterial({ map: tEcorce, color: '#a07a52', roughness: 0.85 });
  const planches = [];
  for (let z = -pont.longueur / 2; z <= pont.longueur / 2; z += 0.26) planches.push({ z });
  groupe.add(instances(new THREE.BoxGeometry(1.9, 0.07, 0.22), bois, planches, (o) => { vp.set(pont.x + (rg() - 0.5) * 0.04, 0.16, pont.z + o.z); qt.setFromEuler(eu.set(0, (rg() - 0.5) * 0.03, 0)); vs.set(1, 1, 1); }, { ombre: !mobile }));
  for (const s of [-1, 1]) {
    const longeron = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, pont.longueur + 0.4), bois); longeron.position.set(pont.x + s * 0.85, 0.06, pont.z); groupe.add(longeron);
    const main = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, pont.longueur), bois); main.position.set(pont.x + s * 0.92, 1.02, pont.z); groupe.add(main);
    for (let z = -pont.longueur / 2; z <= pont.longueur / 2 + 0.01; z += pont.longueur / 4) { const pot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), bois); pot.position.set(pont.x + s * 0.92, 0.55, pont.z + z); pot.castShadow = !mobile; groupe.add(pot); }
  }

  // Les poussières de lumière au-dessus de l'eau.
  const nP = mobile ? 50 : 220, rp = alea(91);
  const base = new Float32Array(nP * 3), phase = new Float32Array(nP);
  for (let i = 0; i < nP; i += 1) { const p = pts[Math.floor(rp() * pts.length)]; base[i * 3] = p.x + (rp() - 0.5) * 3; base[i * 3 + 1] = 0.3 + rp() * 2; base[i * 3 + 2] = p.z + (rp() - 0.5) * (p.l * 2 + 4); phase[i] = rp() * 100; }
  const geoP = new THREE.BufferGeometry(); geoP.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  const poussiere = new THREE.Points(geoP, new THREE.PointsMaterial({ map: texPoussiere(), size: mobile ? 0.12 : 0.09, color: '#fff2cf', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  poussiere.frustumCulled = false;
  groupe.add(poussiere);

  return {
    groupe,
    solides,
    animer(t) {
      temps.value = t;
      // Le courant va de la source vers la mare : les ondes défilent dans ce sens.
      ondesA.offset.y = -t * 0.18; ondesB.offset.y = -t * 0.31; ondesB.offset.x = Math.sin(t * 0.3) * 0.05;
      ondesMareA.offset.set(t * 0.01, t * 0.012); ondesMareB.offset.set(-t * 0.015, t * 0.008);
      tEcume.offset.y = -t * 0.25;
      const a = geoP.attributes.position.array;
      for (let i = 0; i < nP; i += 1) { const f = phase[i]; a[i * 3] = base[i * 3] + Math.sin(t * 0.3 + f) * 0.8; a[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.5 + f * 1.3) * 0.25; a[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.27 + f) * 0.6; }
      geoP.attributes.position.needsUpdate = true;
    },
  };
}
