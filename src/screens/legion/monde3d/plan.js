// LA CARTE DE LA VILLE (touche M ; Beau, 08/10 : « exactement ce qu'il fait », la
// carte des villes de The Arcade). Logique pure, testée : de quoi la ville est faite
// (routes, immeubles, lieux) à un plan en deux dimensions, et pour chaque lieu un point
// sûr où poser la personne (le trottoir, jamais la chaussée ni un mur).
// Le dessin est dans CarteVille.jsx.
import { QUARTIERS, PISTE } from './carte';

// Le plan : x vers la droite, z vers le bas (comme vu d'avion, le nord en haut = z négatif).
export const CADRES = {
  ville: { x0: -215, z0: -215, l: 430, h: 430 },
  tout: { x0: -570, z0: -215, l: 1140, h: 430 },
};

// Les lieux qu'on montre, dans l'ordre de la légende. `cle` = clé de traduction.
export const LIEUX_PLAN = ['siege', 'boutiques', 'clients', 'projets', 'chezMoi', 'heliport', 'sport', 'foot', 'aeroport', 'campagne'];
export const ICONES_PLAN = { siege: '🏢', boutiques: '🛍️', clients: '🧺', projets: '🏗️', chezMoi: '🔑', heliport: '🚁', sport: '🏀', foot: '⚽', aeroport: '✈️', campagne: '🌾' };

// Un point sur le trottoir d'un îlot, côté rue la plus proche du centre de la ville,
// tourné vers l'îlot. placerJoueur ajoute un demi-tour : on lui passe l'angle moins π.
export function pointIlot(il) {
  const cx = (il.x0 + il.x1) / 2, cz = (il.z0 + il.z1) / 2;
  // Le bord le plus proche du centre (0, 0) : c'est là que passe la rue qui y mène.
  const bords = [
    { x: il.x0 + 1.6, z: cz, d: Math.abs(il.x0) },
    { x: il.x1 - 1.6, z: cz, d: Math.abs(il.x1) },
    { x: cx, z: il.z0 + 1.6, d: Math.abs(il.z0) },
    { x: cx, z: il.z1 - 1.6, d: Math.abs(il.z1) },
  ].sort((a, b) => a.d - b.d);
  const p = bords[0];
  return { x: p.x, z: p.z, yaw: Math.atan2(cx - p.x, cz - p.z) - Math.PI };
}

/**
 * Le modèle du plan, à partir de ce que la ville expose (villeVivante) :
 * { routes: { x: [], z: [], largeur }, emprises: [{ x, z, w, d, h }], reserves: { cle: îlot },
 *   chantiers: [{ id, nom, x, z }] }.
 */
export function modelePlan({ routes, emprises = [], reserves = {}, chantiers = [] } = {}) {
  const lieux = [];
  lieux.push({ cle: 'siege', x: 0, z: 0, aller: { x: 0, z: 22.6, yaw: Math.PI } });
  for (const cle of ['boutiques', 'clients', 'projets', 'chezMoi', 'heliport', 'sport', 'foot']) {
    const il = reserves[cle];
    if (!il) continue;
    lieux.push({ cle, x: (il.x0 + il.x1) / 2, z: (il.z0 + il.z1) / 2, aller: pointIlot(il), ilot: il });
  }
  // Les deux quartiers de la grande carte : on arrive par le trottoir de la rue qui y mène.
  const qa = QUARTIERS.find((q) => q.id === 'aeroport'), qc = QUARTIERS.find((q) => q.id === 'campagne');
  if (qa) lieux.push({ cle: 'aeroport', x: (qa.x0 + qa.x1) / 2, z: 0, aller: { x: qa.x0 + 2, z: 38, yaw: -Math.PI / 2 - Math.PI }, zone: qa });
  if (qc) lieux.push({ cle: 'campagne', x: (qc.x0 + qc.x1) / 2, z: 0, aller: { x: qc.x1 - 2, z: 38, yaw: Math.PI / 2 - Math.PI }, zone: qc });
  return {
    routes: routes || { x: [], z: [], largeur: 12 },
    immeubles: emprises.map((e) => ({ x0: e.x - e.w / 2, z0: e.z - e.d / 2, w: e.w, d: e.d, h: e.h })),
    lieux,
    chantiers: chantiers.map((c) => ({ id: c.id, nom: c.nom, x: c.x, z: c.z })),
    piste: PISTE,
    quartiers: QUARTIERS,
  };
}

// Où dessiner une flèche pour la personne : angle en degrés pour un SVG (y vers le bas).
// Le personnage regarde vers +z quand sa rotation vaut 0 ; sur le plan, +z est en bas.
export const angleFleche = (rotY) => -(rotY * 180) / Math.PI;

// Le cadre courant contient-il ce point ? (sinon on bascule sur « tout »).
export const dansCadre = (c, x, z) => x >= c.x0 && x <= c.x0 + c.l && z >= c.z0 && z <= c.z0 + c.h;
