// LES QUARTIERS DENSES (Beau, 08/10 : « exactement ce qu'il fait » — les villes de The Arcade :
// des centaines d'immeubles, chacun avec sa façade, et une vraie pièce derrière chaque fenêtre).
// Notre propre code, rien de repris.
//
// 1) parcelles() découpe les îlots du bord de la ville en parcelles : ruelles, quelques
//    placettes, des immeubles de hauteurs variées (logique pure, testée).
// 2) construireImmeubles() les dessine en UNE fois (InstancedMesh) : chaque immeuble est une
//    boîte, et toute la façade est calculée par la carte graphique — trame de fenêtres selon le
//    genre (fenêtres percées, bandeaux vitrés, mur-rideau, résidence), rez-de-chaussée en
//    vitrines avec bandeau, toit. Derrière chaque fenêtre, une pièce en profondeur
//    (« interior mapping », technique publique décrite par Joost van Dongen en 2008) : murs,
//    sol, plafond, un meuble, parfois un tableau ou un store ; la nuit, une partie s'allume.
import * as THREE from 'three';

const TROTTOIR = 4.5;

function alea(graine) {
  let s = graine >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Les couleurs de façade, par genre : 0 pierre et brique, 1 bandeaux, 2 verre, 3 résidence.
const TEINTES = [
  ['#a8916f', '#8f5a42', '#b39a7c', '#7a4b38', '#c2ad8d', '#8a7560'],
  ['#a9a69f', '#8e9399', '#bdb6a8', '#767c84'],
  ['#4a5b6b', '#3b4b5b', '#56697a', '#2f3c49'],
  ['#d8c8a8', '#c9a57d', '#b7a58c', '#e2d3b8', '#c08d6a', '#9fb3a6'],
];

/**
 * Les parcelles des îlots denses. ilots : [{ x0, x1, z0, z1 }].
 * Rend [{ x, z, w, d, h, genre, etage, largeurFenetre, couleur, graine }].
 */
export function parcelles(ilots, { graine = 11, mobile = false, hauteur = 1 } = {}) {
  const r = alea(graine);
  const cible = mobile ? 19 : 13.5, ruelle = 2.6;
  const liste = [];
  for (const il of ilots) {
    const x0 = il.x0 + TROTTOIR, x1 = il.x1 - TROTTOIR, z0 = il.z0 + TROTTOIR, z1 = il.z1 - TROTTOIR;
    const L = x1 - x0, P = z1 - z0;
    if (L < 8 || P < 8) continue;
    const nx = Math.max(1, Math.round(L / cible)), nz = Math.max(1, Math.round(P / cible));
    const cw = L / nx, cd = P / nz;
    for (let j = 0; j < nz; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        // Une placette de temps en temps (jamais au bord d'un îlot étroit).
        if (nx > 2 && nz > 2 && r() < 0.05) continue;
        // Parfois deux parcelles n'en font qu'une : un immeuble plus large.
        const double = i < nx - 1 && r() < 0.16;
        const w = (double ? 2 * cw : cw) - ruelle, d = cd - ruelle;
        const cx = x0 + (i + (double ? 1 : 0.5)) * cw, cz = z0 + (j + 0.5) * cd;
        if (double) i += 1;
        const dist = Math.hypot(cx, cz);
        const tour = r() < 0.06;
        let h = tour ? 55 + r() * 45 : (dist < 150 ? 14 + r() * 28 : 9 + r() * 22);
        h = Math.max(8, h * hauteur);
        const genre = h > 50 ? (r() < 0.75 ? 2 : 1) : h > 26 ? [0, 1, 1, 2, 3][Math.floor(r() * 5)] : [0, 0, 3, 3, 1][Math.floor(r() * 5)];
        const teintes = TEINTES[genre];
        liste.push({
          x: cx, z: cz, w: Math.max(5, w), d: Math.max(5, d), h,
          genre,
          etage: genre === 2 ? 3.6 : 3 + r() * 0.5,
          largeurFenetre: genre === 0 ? 0.42 + r() * 0.2 : 0.5 + r() * 0.25,
          couleur: teintes[Math.floor(r() * teintes.length)],
          graine: r(),
        });
      }
    }
  }
  return liste;
}

// ——— Le dessin ———
const DECL_VERTEX = /* glsl */`
attribute vec4 aStyle;
flat varying vec4 vStyle; // « flat » : la même valeur sur tout l'immeuble (sinon le hasard des pièces scintille)
varying vec3 vLoc;
varying vec3 vTaille;
varying vec3 vNormLoc;
varying vec3 vPosM;
`;
const CORPS_VERTEX = /* glsl */`
  vTaille = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vLoc = vec3((position.x + 0.5) * vTaille.x, position.y * vTaille.y, (position.z + 0.5) * vTaille.z);
  vNormLoc = normal;
  vStyle = aStyle;
  vPosM = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
`;
const DECL_FRAGMENT = /* glsl */`
flat varying vec4 vStyle; // « flat » : la même valeur sur tout l'immeuble (sinon le hasard des pièces scintille)
varying vec3 vLoc;
varying vec3 vTaille;
varying vec3 vNormLoc;
varying vec3 vPosM;
uniform float uNuit;
float hashImm(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;
const CORPS_FRAGMENT = /* glsl */`
  vec3 nL = normalize(vNormLoc);
  float estToit = step(0.5, abs(nL.y));
  bool faceX = abs(nL.x) > 0.5;
  float uF = faceX ? vLoc.z : vLoc.x;
  float largeurF = faceX ? vTaille.z : vTaille.x;
  float vF = vLoc.y;
  float faceId = faceX ? (nL.x > 0.0 ? 1.0 : 2.0) : (nL.z > 0.0 ? 3.0 : 4.0);
  float grI = floor(vStyle.x * 997.0), etI = vStyle.y, genreI = floor(vStyle.z + 0.5), lfI = vStyle.w;
  float rdcI = 4.2;
  float moduleI = largeurF / max(1.0, floor(largeurF / 3.2));
  float cu = uF / moduleI;
  float cv = (vF - rdcI) / etI;
  vec2 cellI = vec2(floor(cu), floor(cv));
  vec2 fI = vec2(fract(cu), fract(cv));
  vec4 rectI = genreI < 0.5 ? vec4(0.5 - lfI * 0.5, 0.5 + lfI * 0.5, 0.25, 0.85)
             : genreI < 1.5 ? vec4(0.02, 0.98, 0.32, 0.86)
             : genreI < 2.5 ? vec4(0.035, 0.965, 0.05, 0.95)
             : vec4(0.5 - lfI * 0.5, 0.5 + lfI * 0.5, 0.16, 0.88);
  vec2 fwI = max(fwidth(vec2(cu, cv)), vec2(1e-4));
  float inU = smoothstep(rectI.x - fwI.x, rectI.x + fwI.x, fI.x) * (1.0 - smoothstep(rectI.y - fwI.x, rectI.y + fwI.x, fI.x));
  float inV = smoothstep(rectI.z - fwI.y, rectI.z + fwI.y, fI.y) * (1.0 - smoothstep(rectI.w - fwI.y, rectI.w + fwI.y, fI.y));
  float etagesOk = step(0.0, cv) * step(vF, vTaille.y - 1.3) * (1.0 - estToit);
  float couverture = (rectI.y - rectI.x) * (rectI.w - rectI.z);
  float loinI = clamp(max(fwI.x, fwI.y) * 2.5 - 0.5, 0.0, 1.0);
  float fen = mix(inU * inV, couverture, loinI) * etagesOk;

  // La pièce derrière la fenêtre : un rayon de la caméra dans une boîte (largeur du module,
  // hauteur d'étage, 3,6 m de profondeur).
  vec3 Vw = normalize(vPosM - cameraPosition);
  vec3 Tg = faceX ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 rd = vec3(dot(Vw, Tg) / moduleI, Vw.y / etI, dot(Vw, -nL) / 3.6);
  rd.x = rd.x >= 0.0 ? max(rd.x, 1e-4) : min(rd.x, -1e-4);
  rd.y = rd.y >= 0.0 ? max(rd.y, 1e-4) : min(rd.y, -1e-4);
  rd.z = max(rd.z, 1e-4);
  vec3 p0 = vec3(fI, 0.0);
  float tx = rd.x > 0.0 ? (1.0 - p0.x) / rd.x : -p0.x / rd.x;
  float ty = rd.y > 0.0 ? (1.0 - p0.y) / rd.y : -p0.y / rd.y;
  float tz = 1.0 / rd.z;
  float tm = min(min(tx, ty), tz);
  vec3 hI = p0 + rd * tm;
  float hr = hashImm(cellI + vec2(faceId * 37.0, grI * 1.13));
  float hr2 = hashImm(cellI * 1.7 + vec2(faceId * 11.0, grI * 0.07));
  vec3 murP = mix(vec3(0.84, 0.79, 0.70), vec3(0.62, 0.70, 0.78), hr);
  murP = hr2 > 0.66 ? vec3(0.88, 0.86, 0.82) : murP;
  vec3 piece;
  if (tm == tz) {
    piece = murP;
    float meuble = step(0.12, hI.x) * step(hI.x, 0.45 + hr * 0.35) * step(hI.y, 0.3);
    piece = mix(piece, vec3(0.22, 0.17, 0.14), meuble);
    float tableau = step(0.52, hI.y) * step(hI.y, 0.74) * step(0.62, hI.x) * step(hI.x, 0.85) * step(0.45, hr2);
    piece = mix(piece, mix(vec3(0.25, 0.42, 0.58), vec3(0.72, 0.42, 0.28), hr), tableau);
  } else if (tm == ty) {
    piece = rd.y < 0.0 ? vec3(0.34, 0.25, 0.18) : vec3(0.93, 0.91, 0.87);
  } else {
    piece = murP * 0.8;
  }
  piece *= mix(1.0, 0.5, clamp(hI.z, 0.0, 1.0));
  // La nuit, une partie des pièces s'allume (plus d'un tiers) ; le jour, l'intérieur est plus sombre que la rue.
  float allume = step(hr, mix(0.1, 0.42, uNuit));
  vec3 lampe = vec3(1.0, 0.85, 0.62);
  vec3 interieur = piece * (0.3 * (1.0 - uNuit) + allume * uNuit * 1.35) * (allume > 0.5 ? lampe : vec3(1.0)) + piece * 0.02;
  // Un store baissé à moitié, de temps en temps.
  float store = step(0.8, hr2) * step(mix(rectI.z, rectI.w, 0.55), fI.y);
  interieur = mix(interieur, vec3(0.78, 0.72, 0.6) * (0.35 + uNuit * allume * 0.9), store);
  vec3 moyenne = murP * (0.22 * (1.0 - uNuit)) + lampe * allume * uNuit * 0.6;
  interieur = mix(interieur, moyenne, loinI);

  // Le rez-de-chaussée : des vitrines et un bandeau de couleur.
  float rdcZone = step(vF, rdcI) * (1.0 - estToit);
  float uVit = fract(uF / (moduleI * 2.0));
  float vitrine = rdcZone * step(0.35, vF) * step(vF, 3.15) * step(0.07, uVit) * step(uVit, 0.93);
  float bandeau = rdcZone * step(3.35, vF) * step(vF, 3.95);
  float hb = hashImm(vec2(floor(uF / (moduleI * 2.0)) + faceId * 3.0, grI * 0.51));
  vec3 couleurBandeau = hb < 0.25 ? vec3(0.76, 0.33, 0.22) : hb < 0.5 ? vec3(0.85, 0.66, 0.34) : hb < 0.75 ? vec3(0.2, 0.42, 0.38) : vec3(0.16, 0.2, 0.3);

  vec3 murExt = diffuseColor.rgb * (0.66 + hashImm(vec2(cellI.y, grI * 0.31)) * 0.1);
  // Les dalles d'étage des bandeaux : une ligne plus sombre.
  murExt *= genreI > 0.5 && genreI < 1.5 ? mix(1.0, 0.82, step(0.9, fI.y) * etagesOk) : 1.0;
  vec3 verre = genreI > 1.5 && genreI < 2.5 ? vec3(0.32, 0.4, 0.47) : vec3(0.025, 0.03, 0.035);
  diffuseColor.rgb = mix(murExt, verre, fen);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03), vitrine);
  diffuseColor.rgb = mix(diffuseColor.rgb, couleurBandeau, bandeau);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.23, 0.24), estToit);
  float vitreI = max(fen, vitrine);
  float rideau = genreI > 1.5 && genreI < 2.5 ? 0.55 : 1.0;
  // Derrière la vitrine : des rayons et de la marchandise de couleurs, éclairés.
  float colV = floor(uF / 0.55);
  vec3 marchandise = mix(vec3(0.62, 0.56, 0.48), vec3(hashImm(vec2(colV, 1.0 + grI * 0.01)), hashImm(vec2(colV, 2.0 + grI * 0.01)), hashImm(vec2(colV, 3.0 + grI * 0.01))), 0.4);
  marchandise *= mix(0.45, 1.0, step(0.12, fract(uF / 0.55)));
  float rayon = step(0.88, fract((vF - 0.35) / 0.7));
  vec3 boutique = mix(marchandise, vec3(0.18, 0.15, 0.12), rayon) * mix(0.5, 1.0, step(1.0, vF));
  vec3 emisImm = interieur * fen * rideau + vitrine * boutique * (0.35 + uNuit * 0.85) + bandeau * couleurBandeau * uNuit * 0.7;
`;

/** Dessine la liste rendue par parcelles(). Rend { groupe, reglerNuit(niveau), immeubles }. */
export function construireImmeubles(liste, { mobile = false, envCiel = null } = {}) {
  const groupe = new THREE.Group();
  groupe.userData.garder = true;
  if (!liste.length) return { groupe, reglerNuit: () => {}, immeubles: [] };
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const style = new Float32Array(liste.length * 4);
  liste.forEach((b, i) => { style.set([b.graine, b.etage, b.genre, b.largeurFenetre], i * 4); });
  geo.setAttribute('aStyle', new THREE.InstancedBufferAttribute(style, 4));
  const uNuit = { value: 0 };
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.88, metalness: 0, envMap: envCiel, envMapIntensity: 0.4 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uNuit = uNuit;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${DECL_VERTEX}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${CORPS_VERTEX}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${DECL_FRAGMENT}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${CORPS_FRAGMENT}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.14, vitreI);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, genreI > 1.5 && genreI < 2.5 ? 0.5 : 0.0, vitreI);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += emisImm;');
  };
  mat.customProgramCacheKey = () => 'leo-immeubles-1';
  const im = new THREE.InstancedMesh(geo, mat, liste.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  liste.forEach((b, i) => {
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(b.x, 0, b.z), q, new THREE.Vector3(b.w, b.h, b.d)));
    im.setColorAt(i, c.set(b.couleur));
  });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.receiveShadow = false; // l'ombre portée sur ces façades faisait du « grain » (acné d'ombre) ; ils sont loin
  im.castShadow = false;
  im.frustumCulled = false; // une seule boîte englobante pour des centaines d'immeubles : on dessine tout
  im.userData.garder = true;
  groupe.add(im);

  // Sur les toits : des blocs de climatisation, et des réservoirs d'eau sur certains.
  const r = alea(97);
  const blocs = [], reservoirs = [];
  for (const b of liste) {
    const n = mobile ? 1 : 1 + Math.floor(r() * 2);
    for (let k = 0; k < n; k += 1) blocs.push([b.x + (r() - 0.5) * b.w * 0.6, b.h, b.z + (r() - 0.5) * b.d * 0.6, 1.2 + r() * 1.4, 0.9 + r() * 0.8, 1 + r() * 1.2]);
    if (b.genre !== 2 && r() < 0.3) reservoirs.push([b.x + (r() - 0.5) * b.w * 0.4, b.h, b.z + (r() - 0.5) * b.d * 0.4]);
  }
  const gris = new THREE.MeshStandardMaterial({ color: '#8b9096', roughness: 0.7, metalness: 0.3 });
  const imB = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), gris, blocs.length);
  blocs.forEach(([x, y, z, l, h, p], i) => imB.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(l, h, p))));
  imB.frustumCulled = false; imB.userData.garder = true;
  groupe.add(imB);
  if (reservoirs.length) {
    const bois = new THREE.MeshStandardMaterial({ color: '#6b5240', roughness: 0.9 });
    const cuve = new THREE.CylinderGeometry(1.3, 1.3, 2.4, 12).translate(0, 3.0, 0);
    const imR = new THREE.InstancedMesh(cuve, bois, reservoirs.length);
    reservoirs.forEach(([x, y, z], i) => imR.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1))));
    imR.frustumCulled = false; imR.userData.garder = true;
    groupe.add(imR);
    const pieds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 1.8, 0.15).translate(0, 0.9, 0), gris, reservoirs.length * 4);
    let k = 0;
    for (const [x, y, z] of reservoirs) for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) pieds.setMatrixAt(k++, m4.compose(new THREE.Vector3(x + dx, y, z + dz), q, new THREE.Vector3(1, 1, 1)));
    pieds.frustumCulled = false; pieds.userData.garder = true;
    groupe.add(pieds);
  }

  return {
    groupe,
    immeubles: liste,
    reglerNuit: (niveau) => { uNuit.value = niveau; },
  };
}
