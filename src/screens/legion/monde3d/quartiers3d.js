// Les quartiers de la ville de chacun (voir maVille.js) : le quartier des boutiques, le quartier
// des clients, et le chez-soi en cité. Chaque bâtiment est une vraie boutique ou un vrai client ;
// là où il n'y a encore rien, un terrain à bâtir l'annonce. Dessiné pour Léo.
import * as THREE from 'three';
import { cotesFacade } from './ville3d';

const OR = '#e3a857';

function chargerImage(url) {
  return new Promise((ok) => {
    if (!url) { ok(null); return; }
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => ok(img); img.onerror = () => ok(null); img.src = url;
  });
}

// Un panneau de bois sur deux poteaux : « terrain à bâtir ».
function panneau(monde, lignes, x, z, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const bois = new THREE.MeshStandardMaterial({ color: '#7a5230', roughness: 0.9 });
  for (const s of [-1.3, 1.3]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.2, 0.14), bois); p.position.set(s, 1.1, 0); g.add(p); }
  const e = monde.ecran(3.2, 1.5, (c, w, h) => {
    c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a5230'; c.lineWidth = h * 0.05; c.strokeRect(0, 0, w, h);
    c.fillStyle = '#3a2a1a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    lignes.forEach((l, i) => { c.font = `${i ? '' : 'bold '}${h * (i ? 0.13 : 0.17)}px system-ui`; c.fillText(l, w / 2, h * (0.3 + i * 0.24)); });
  });
  e.position.set(0, 1.75, 0.08); g.add(e);
  return g;
}

// Le contour d'une parcelle libre, tracé au sol (on voit où la ville peut grandir).
const TRAIT = new THREE.MeshBasicMaterial({ color: '#f2e2b8', transparent: true, opacity: 0.7 });
function parcelle(x, z, w) {
  const g = new THREE.Group(); g.position.set(x, 0.11, z);
  for (const [lx, lz, px, pz] of [[w, 0.18, 0, -w / 2], [w, 0.18, 0, w / 2], [0.18, w, -w / 2, 0], [0.18, w, w / 2, 0]]) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(lx, lz), TRAIT); t.rotation.x = -Math.PI / 2; t.position.set(px, 0, pz); g.add(t);
  }
  for (const [px, pz] of [[-w / 2, -w / 2], [w / 2, -w / 2], [-w / 2, w / 2], [w / 2, w / 2]]) {
    const piquet = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), new THREE.MeshStandardMaterial({ color: '#e8672e' })); piquet.position.set(px, 0.35, pz); g.add(piquet);
  }
  return g;
}

// Un totem à l'entrée d'un quartier.
function totem(monde, texte, x, z, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const pied = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.8, 0.5), new THREE.MeshStandardMaterial({ color: '#1b2233', metalness: 0.4, roughness: 0.5 }));
  pied.position.y = 1.9; g.add(pied);
  const e = monde.ecran(0.8, 3.4, (c, w, h) => {
    c.fillStyle = '#1b2233'; c.fillRect(0, 0, w, h); c.fillStyle = OR; c.fillRect(0, 0, w, h * 0.03);
    c.save(); c.translate(w / 2, h / 2); c.rotate(-Math.PI / 2); c.fillStyle = '#f3dfb3'; c.font = `600 ${w * 0.42}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(texte, 0, 0); c.restore();
  });
  e.position.set(0, 1.95, 0.26); g.add(e);
  const e2 = e.clone(); e2.position.z = -0.26; e2.rotation.y = Math.PI; g.add(e2);
  return g;
}

// ilots : { boutiques, clients, chezMoi } (rectangles réservés par ville3d)
// donnees : { boutiques, clients, totalClients } (maVille.js) ; habitat : { genre: 'cite'|'maison', nom }
export function construireQuartiers(monde, ilots, donnees, { habitat = null, langue = 'fr' } = {}) {
  const fr = langue !== 'en';
  const g = new THREE.Group();
  const pois = [], murs = [];
  const facades = monde.facades || [];
  const verre = facades.find((f) => f.nom === 'verre') || facades[0];
  const residence = facades.find((f) => f.nom === 'residence') || facades[0];
  const beton = new THREE.MeshStandardMaterial({ color: '#c9c3b8', roughness: 0.85 });
  const toit = new THREE.MeshStandardMaterial({ color: '#5b5e62', roughness: 0.9 });
  const aleatoire = () => 0.5; // façades régulières : pas de hasard dans la ville de chacun

  // ——— Le quartier des boutiques ———
  if (ilots.boutiques) {
    const B = ilots.boutiques, m = 4.5;
    const cols = [0, 1, 2].map((k) => B.x0 + m + ((B.x1 - B.x0 - 2 * m) / 3) * (k + 0.5));
    const rangs = [0, 1].map((k) => B.z0 + m + ((B.z1 - B.z0 - 2 * m) / 2) * (k + 0.5));
    const places = rangs.flatMap((z) => cols.map((x) => [x, z])).sort((a, b) => b[0] - a[0]); // les plus proches de notre immeuble d'abord
    g.add(totem(monde, fr ? 'Quartier des boutiques' : 'Shops district', B.x1 - 1.5, B.z1 - 1.5, Math.PI / 4));
    (donnees.boutiques || []).forEach((b, i) => {
      const [x, z] = places[i];
      const w = 8.4, h = 4.6 + (b.etages - 1) * 3.2;
      const corps = new THREE.Mesh(cotesFacade(w, Math.max(0.1, h - 4.6), w, verre?.taille || [8, 8], aleatoire), verre?.mat || beton);
      corps.position.set(x, 4.6 + Math.max(0.1, h - 4.6) / 2, z); corps.castShadow = !monde.mobile; if (h > 4.7) g.add(corps);
      const rdc = new THREE.Mesh(new THREE.BoxGeometry(w, 4.6, w), beton); rdc.position.set(x, 2.3, z); rdc.receiveShadow = true; g.add(rdc);
      const dessus = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.5, w + 0.4), toit); dessus.position.set(x, h + 0.25, z); g.add(dessus);
      // Vitrine, auvent doré et enseigne au nom de la boutique, face à la rue (+x) et côté quartier (+z)
      for (const [nx, nz, rot] of [[w / 2 + 0.03, 0, Math.PI / 2], [0, w / 2 + 0.03, 0]]) {
        const vitrine = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 2.6), new THREE.MeshStandardMaterial({ color: '#2a3a48', metalness: 0.3, roughness: 0.1, emissive: '#ffd89a', emissiveIntensity: 0.15 }));
        vitrine.position.set(x + nx, 1.5, z + nz); vitrine.rotation.y = rot; g.add(vitrine);
        const auvent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.08, 1.3), new THREE.MeshStandardMaterial({ color: OR, roughness: 0.7 }));
        auvent.position.set(x + nx + Math.sin(rot) * 0.65, 3.05, z + nz + Math.cos(rot) * 0.65); auvent.rotation.y = rot; g.add(auvent);
        const nom = String(b.nom || '').length > 20 ? `${String(b.nom).slice(0, 19)}…` : String(b.nom || '');
        const enseigne = monde.ecran(w * 0.8, 0.9, (c, cw, ch) => { c.fillStyle = '#1b2233'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#f3dfb3'; c.font = `600 ${ch * 0.55}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nom, cw / 2, ch / 2); });
        enseigne.position.set(x + nx * 1.005, 3.75, z + nz * 1.005); enseigne.rotation.y = rot; g.add(enseigne);
        // La vraie image de la boutique (celle qu'elle a mise sur Finjaro), au-dessus de la vitrine
        if (b.image) {
          const cadre = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ color: '#1b2233' }));
          cadre.position.set(x + nx * 1.01, 6.4, z + nz * 1.01); cadre.rotation.y = rot; cadre.visible = false; g.add(cadre);
          chargerImage(b.image).then((img) => {
            if (!img) return;
            const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
            cadre.material = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); cadre.visible = h > 7.9;
          });
        }
      }
      murs.push({ x0: x - w / 2, x1: x + w / 2, z0: z - w / 2, z1: z + w / 2, h: h + 0.5 });
      pois.push({ type: 'boutique', id: b.id, nom: b.nom, slug: b.slug, commandes: b.commandes, livrees: b.livrees, articles: b.articles, x: x + w / 2 + 1.8, z, rayon: 3.6 });
    });
    const n = (donnees.boutiques || []).length;
    for (const [px, pz] of places.slice(n)) g.add(parcelle(px, pz, 8.4));
    if (n < places.length) {
      const [x, z] = places[n];
      g.add(panneau(monde, n ? [fr ? 'Terrain à bâtir' : 'Building plot', fr ? 'votre prochaine boutique' : 'your next shop'] : [fr ? 'Terrain à bâtir' : 'Building plot', fr ? 'ouvrez une boutique :' : 'open a shop:', fr ? 'elle s\'élèvera ici' : 'it will rise here'], x + 3, z, Math.PI / 2));
    }
  }

  // ——— Le quartier des clients ———
  if (ilots.clients) {
    const C = ilots.clients, m = 4.5;
    const cols = [0, 1, 2, 3].map((k) => C.x0 + m + ((C.x1 - C.x0 - 2 * m) / 4) * (k + 0.5));
    const rangs = [0, 1, 2].map((k) => C.z1 - m - ((C.z1 - C.z0 - 2 * m) / 3) * (k + 0.5));
    const places = rangs.flatMap((z) => cols.map((x) => [x, z]));
    g.add(totem(monde, fr ? 'Quartier des clients' : 'Customers district', C.x1 - 1.5, C.z1 - 1.5, -Math.PI / 4));
    (donnees.clients || []).forEach((cl, i) => {
      const [x, z] = places[i];
      const w = 5.8, h = 3 + cl.etages * 2.8;
      const maison = new THREE.Mesh(cotesFacade(w, h, w, residence?.taille || [6, 6], aleatoire), residence?.mat || beton);
      maison.position.set(x, h / 2, z); maison.castShadow = !monde.mobile; g.add(maison);
      const dessus = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.4, w + 0.3), toit); dessus.position.set(x, h + 0.2, z); g.add(dessus);
      const texte = `${cl.prenom || (fr ? 'Client' : 'Customer')} · ${cl.commandes} ${fr ? (cl.commandes > 1 ? 'commandes' : 'commande') : (cl.commandes > 1 ? 'orders' : 'order')}`;
      const plaque = monde.ecran(3.4, 0.55, (c, cw, ch) => { c.fillStyle = '#1d1a16'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#e3c07a'; c.font = `600 ${ch * 0.5}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(texte, cw / 2, ch / 2); });
      plaque.position.set(x, 2.6, z + w / 2 + 0.03); g.add(plaque);
      const porte = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ color: '#6b4428', roughness: 0.7 }));
      porte.position.set(x, 1.1, z + w / 2 + 0.02); g.add(porte);
      murs.push({ x0: x - w / 2, x1: x + w / 2, z0: z - w / 2, z1: z + w / 2, h: h + 0.4 });
      pois.push({ type: 'client', id: cl.cle, nom: cl.prenom, commandes: cl.commandes, livrees: cl.livrees, x, z: z + w / 2 + 1.6, rayon: 2.6 });
    });
    const n = (donnees.clients || []).length;
    for (const [px, pz] of places.slice(n)) g.add(parcelle(px, pz, 5.8));
    if (!n) g.add(panneau(monde, [fr ? 'Terrain à bâtir' : 'Building plot', fr ? 'vos clients' : 'your customers', fr ? 'habiteront ici' : 'will live here'], places[0][0], places[0][1] + 3));
    else if (n < places.length) g.add(panneau(monde, [fr ? 'Terrain à bâtir' : 'Building plot', fr ? 'votre prochain client' : 'your next customer'], places[n][0], places[n][1] + 3));
  }

  // ——— Chez moi, en cité ———
  if (ilots.chezMoi && habitat?.genre === 'cite') {
    const M = ilots.chezMoi;
    const x = (M.x0 + M.x1) / 2, z = (M.z0 + M.z1) / 2, w = 14, h = 34;
    const tour = new THREE.Mesh(cotesFacade(w, h, w, residence?.taille || [6, 6], aleatoire), residence?.mat || beton);
    tour.position.set(x, h / 2, z); tour.castShadow = !monde.mobile; g.add(tour);
    const dessus = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.6, w + 0.5), toit); dessus.position.set(x, h + 0.3, z); g.add(dessus);
    const nom = habitat.nom ? (fr ? `Chez ${habitat.nom}` : `${habitat.nom}'s home`) : (fr ? 'Chez moi' : 'Home');
    const lettres = monde.ecran(10, 1.6, (c, cw, ch) => { c.clearRect(0, 0, cw, ch); c.fillStyle = '#f3dfb3'; c.shadowColor = OR; c.shadowBlur = ch * 0.15; c.font = `600 ${ch * 0.62}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nom, cw / 2, ch / 2); });
    lettres.position.set(x, h - 3, z - w / 2 - 0.05); lettres.rotation.y = Math.PI; g.add(lettres);
    // L'entrée (Beau, 25/09 : la porte n'était qu'une plaque dorée et un trou noir) : un vrai hall
    // vitré éclairé de l'intérieur, un auvent, un cadre de laiton, deux marches et deux plantes.
    const zf = z - w / 2; // la façade, côté rue (-z)
    const laiton = new THREE.MeshStandardMaterial({ color: OR, metalness: 0.75, roughness: 0.3 });
    const hallLumiere = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.9), new THREE.MeshStandardMaterial({ color: '#3a2a1c', emissive: '#f0c27a', emissiveIntensity: 0.55, roughness: 0.9 }));
    hallLumiere.position.set(x, 1.55, zf - 0.04); hallLumiere.rotation.y = Math.PI; g.add(hallLumiere);
    const vitre = new THREE.MeshStandardMaterial({ color: '#a9c2cc', metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false });
    for (const dx of [-0.9, 0.9]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.8), vitre); v.position.set(x + dx, 1.5, zf - 0.12); v.rotation.y = Math.PI; g.add(v); }
    for (const [dx, lw, lh, y] of [[-1.85, 0.12, 3.1, 1.55], [1.85, 0.12, 3.1, 1.55], [0, 0.1, 3.0, 1.5], [0, 3.8, 0.14, 3.05]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.14), laiton); b.position.set(x + dx, y, zf - 0.14); g.add(b);
    }
    const poignees = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.08), laiton); poignees.position.set(x, 1.1, zf - 0.24); g.add(poignees);
    const auvent = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 2.2), new THREE.MeshStandardMaterial({ color: '#2a2622', metalness: 0.5, roughness: 0.4 }));
    auvent.position.set(x, 3.55, zf - 1.1); auvent.castShadow = !monde.mobile; g.add(auvent);
    const liseré = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: '#ffdca0' })); liseré.position.set(x, 3.42, zf - 2.15); g.add(liseré);
    for (const [k, [ww, dd]] of [[0, [4.6, 1.2]], [1, [4.2, 0.7]]].entries()) {
      const marche = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.14, dd), new THREE.MeshStandardMaterial({ color: '#cfc6b8', roughness: 0.85 }));
      marche.position.set(x, 0.07 + k * 0.14, zf - dd / 2 - 0.05); marche.receiveShadow = !monde.mobile; g.add(marche);
    }
    for (const dx of [-2.6, 2.6]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.7, 14), new THREE.MeshStandardMaterial({ color: '#3b3632', roughness: 0.6 })); pot.position.set(x + dx, 0.35, zf - 0.6); g.add(pot);
      const feuillage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.9, flatShading: true })); feuillage.position.set(x + dx, 1.2, zf - 0.6); feuillage.scale.y = 1.3; g.add(feuillage);
    }
    murs.push({ x0: x - w / 2, x1: x + w / 2, z0: z - w / 2, z1: z + w / 2, h: h + 1 });
    pois.push({ type: 'chezmoi', id: 'chezmoi', x, z: z - w / 2 - 2, rayon: 3 });
  }

  g.traverse((o) => { if (o.isMesh && monde.mobile) o.castShadow = false; });
  const jeter = () => {
    g.parent?.remove(g);
    g.traverse((o) => { if (!o.isMesh) return; o.geometry.dispose(); if (o.material !== verre?.mat && o.material !== residence?.mat && o.material !== TRAIT) { o.material.map?.dispose(); o.material.dispose(); } });
  };
  return { groupe: g, pois, murs, jeter };
}
