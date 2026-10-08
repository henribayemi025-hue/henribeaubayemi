// LA POLICE (lot 3.5, E6) : rouler trop vite, percuter, bousculer des passants
// fait monter les « étoiles » ; une voiture de police prend la poursuite.
// Elle suit le CHEMIN que le joueur a pris (une trace de points) : elle ne
// traverse donc jamais un immeuble. On la sème en s'éloignant assez longtemps,
// ou en descendant de voiture loin d'elle. Si elle nous rattrape à l'arrêt :
// arrestation (pour de faux) et retour devant l'immeuble.
// Fonctions pures : le moteur (moteur.js) dessine et déplace la voiture.

export const POLICE = {
  seuilKmh: 70, // au-dessus, la chaleur monte
  vitesse: 20, // m/s de base (≈ 72 km/h), +1,5 par étoile
  rattrape: 7.5, // m : assez près pour arrêter
  colle: 5.8, // m : elle s'arrête là, derrière nous (les deux voitures ne se chevauchent pas)
  arret: 2.5, // m/s : le joueur est « à l'arrêt » en dessous
  delaiArrestation: 1.5, // s à l'arrêt, police collée
  perte: 80, // m : au-delà, elle nous perd de vue
  pas: 2, // m entre deux points de la trace
  traceMax: 500,
};

export const ETOILES_MAX = 5;

export function nouvellePoursuite() {
  return { chaleur: 0, police: null, trace: [], arret: 0, horsDeVue: 0 };
}

export const etoiles = (p) => Math.min(ETOILES_MAX, Math.floor(p.chaleur));

// Une infraction ponctuelle. Au volant : 'choc' | 'pieton' | 'trottoir'. À pied aussi (A8, Beau, 08/10 :
// « voler la moto de quelqu'un, tirer sur les gens en route, la police vient ») : 'tir' (un coup de
// feu), 'touche' (un passant atteint), 'vehicule' (une voiture atteinte), 'police', 'vol'.
export function infraction(p, quoi) {
  const plus = { choc: 0.7, pieton: 1.2, trottoir: 0.25, tir: 0.25, touche: 1, vehicule: 0.5, police: 1.5, vol: 1.2 }[quoi] || 0;
  return { ...p, chaleur: Math.min(ETOILES_MAX + 0.99, p.chaleur + plus) };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// Un pas. j : { x, z, vitesse (m/s), auVolant, cache, vu }. cache : à pied, hors de vue de la rue (derrière
// un immeuble, sur un toit, en vol) — on ne peut pas nous arrêter, et la police finit par nous perdre.
// vu : un agent à pied nous a en vue (il ne nous perd pas, même loin de la voiture).
// Rend { p, evenements }.
export function avancerPoursuite(p0, j, dt) {
  let p = { ...p0, trace: p0.trace };
  const ev = [];
  const avant = etoiles(p0);
  const kmh = Math.abs(j.vitesse || 0) * 3.6;
  // La vitesse seule mène à 3 étoiles au plus, et ne compte que si personne ne nous a perdus de vue.
  const vu = !p0.police || dist(p0.police, j) <= POLICE.perte;
  if (j.auVolant && vu && kmh > POLICE.seuilKmh && p.chaleur < 3) p.chaleur = Math.min(3, p.chaleur + (dt * (kmh - POLICE.seuilKmh)) / 40);

  // La trace du joueur (seulement si quelqu'un nous cherche ou risque de le faire).
  // À pied, on ne laisse pas de trace : la police ne nous suit pas entre les immeubles.
  if (j.auVolant && (p.chaleur > 0.3 || p.police)) {
    const dernier = p.trace[p.trace.length - 1];
    if (!dernier || dist(dernier, j) >= POLICE.pas) {
      p.trace = [...p.trace, { x: j.x, z: j.z }];
      if (p.trace.length > POLICE.traceMax) {
        const coupe = p.trace.length - POLICE.traceMax;
        p.trace = p.trace.slice(coupe);
        if (p.police) p.police = { ...p.police, i: Math.max(0, p.police.i - coupe) };
      }
    }
  }

  // Une étoile : la police arrive, par le chemin qu'on a pris, une cinquantaine de mètres derrière.
  if (!p.police && etoiles(p) >= 1 && p.trace.length > 1) {
    const i = Math.max(0, p.trace.length - 26);
    const q = p.trace[i];
    p.police = { x: q.x, z: q.z, cap: 0, i };
    ev.push({ type: 'police', arrive: true });
  }

  if (p.police) {
    // Elle avance le long de la trace, puis tout droit sur les derniers mètres.
    let reste = (POLICE.vitesse + 1.5 * etoiles(p)) * dt;
    let { x, z, i, cap } = p.police;
    while (reste > 0) {
      // Jamais plus près que « colle » du joueur : elle reste derrière, sans le percuter.
      if (Math.hypot(j.x - x, j.z - z) < POLICE.colle) break;
      const cible = i < p.trace.length ? p.trace[i] : j;
      const d = Math.hypot(cible.x - x, cible.z - z);
      if (d <= reste) { x = cible.x; z = cible.z; reste -= d; if (i < p.trace.length) i += 1; else break; }
      else { x += ((cible.x - x) / d) * reste; z += ((cible.z - z) / d) * reste; cap = Math.atan2(cible.x - x, cible.z - z); reste = 0; }
    }
    // À pied, le joueur n'a pas laissé de trace : la police s'arrête où il a quitté la voiture.
    if (!j.auVolant && i >= p.trace.length) { const fin = p.trace[p.trace.length - 1]; if (fin) { x = fin.x; z = fin.z; } }
    p.police = { x, z, cap, i };

    const d = dist(p.police, j);
    if (d < POLICE.rattrape && Math.abs(j.vitesse || 0) < POLICE.arret && !j.cache) {
      p.arret += dt;
      if (p.arret >= POLICE.delaiArrestation) {
        ev.push({ type: 'police', arrete: true, etoiles: etoiles(p) });
        return { p: nouvellePoursuite(), evenements: ev };
      }
    } else p.arret = 0;

    // Semée : hors de vue assez longtemps (plus vite si on est descendu de voiture). À pied, la
    // police va jusqu'au bout de son chemin avant de chercher ; caché, elle cherche tout de suite.
    const auBout = p.police.i >= p.trace.length;
    if (d > POLICE.perte || (!j.auVolant && (j.cache || (d > 20 && auBout && !j.vu)))) {
      p.horsDeVue += dt;
      p.chaleur = Math.max(0, p.chaleur - dt * (j.auVolant ? 0.35 : 0.6));
      if (p.chaleur < 1) {
        ev.push({ type: 'police', semee: true });
        return { p: nouvellePoursuite(), evenements: ev };
      }
    } else p.horsDeVue = 0;
  } else if (kmh <= POLICE.seuilKmh) {
    // Personne ne nous poursuit et on roule sagement : ça retombe doucement.
    p.chaleur = Math.max(0, p.chaleur - dt * 0.08);
    if (p.chaleur === 0) p.trace = [];
  }

  const apres = etoiles(p);
  if (apres !== avant) ev.push({ type: 'etoiles', etoiles: apres });
  return { p, evenements: ev };
}

// ——— À pied (A8) : la police vient par les rues ———
// routes : { x: [abscisses des rues nord-sud], z: [ordonnées des rues est-ouest], borne }.

const borneRue = (v, b) => Math.max(-b, Math.min(b, v));

// Le point de rue le plus proche (sur l'axe d'une rue), et sa distance.
export function pointRoute(p, routes) {
  const b = routes.borne || 196;
  let m = null;
  for (const x of routes.x) { const z = borneRue(p.z, b), d = Math.hypot(p.x - x, p.z - z); if (!m || d < m.d) m = { x, z, axe: 'z', d }; }
  for (const z of routes.z) { const x = borneRue(p.x, b), d = Math.hypot(p.x - x, p.z - z); if (!m || d < m.d) m = { x, z, axe: 'x', d }; }
  return m;
}

// Le chemin par les rues, de « de » jusqu'au point de rue le plus proche de « a » : un ou deux virages
// aux carrefours, jamais à travers un immeuble. Rend des points tous les « pas » mètres.
export function cheminRoutes(de, a, routes, pas = POLICE.pas) {
  const A = pointRoute(de, routes), B = pointRoute(a, routes);
  const coins = [{ x: de.x, z: de.z }, { x: A.x, z: A.z }];
  const fixe = (P) => (P.axe === 'z' ? P.x : P.z), long = (P) => (P.axe === 'z' ? P.z : P.x);
  if (A.axe !== B.axe) coins.push(A.axe === 'z' ? { x: A.x, z: B.z } : { x: B.x, z: A.z });
  else if (Math.abs(fixe(A) - fixe(B)) > 0.5) {
    // Deux rues parallèles : on passe par la rue transversale qui fait le moins de détour.
    const travers = A.axe === 'z' ? routes.z : routes.x;
    const c = travers.reduce((m, v) => (Math.abs(long(A) - v) + Math.abs(long(B) - v) < Math.abs(long(A) - m) + Math.abs(long(B) - m) ? v : m));
    if (A.axe === 'z') coins.push({ x: A.x, z: c }, { x: B.x, z: c }); else coins.push({ x: c, z: A.z }, { x: c, z: B.z });
  }
  coins.push({ x: B.x, z: B.z });
  const points = [{ ...coins[0] }];
  let reste = 0;
  for (let i = 1; i < coins.length; i += 1) {
    const a0 = coins[i - 1], b0 = coins[i], L = Math.hypot(b0.x - a0.x, b0.z - a0.z);
    if (L < 1e-6) continue;
    let s = pas - reste;
    while (s <= L) { points.push({ x: a0.x + ((b0.x - a0.x) * s) / L, z: a0.z + ((b0.z - a0.z) * s) / L }); s += pas; }
    reste = L - (s - pas);
  }
  const fin = coins[coins.length - 1], der = points[points.length - 1];
  if (Math.hypot(fin.x - der.x, fin.z - der.z) > 0.05) points.push({ ...fin });
  return points;
}

// D'où part la police quand on est à pied : sur notre rue, à « recul » mètres, du côté du centre.
export function departPolice(p, routes, recul = 60) {
  const A = pointRoute(p, routes), b = routes.borne || 196;
  if (A.axe === 'z') return { x: A.x, z: borneRue(A.z + (A.z > 0 ? -recul : recul), b) };
  return { x: borneRue(A.x + (A.x > 0 ? -recul : recul), b), z: A.z };
}

// L'agent de police à pied (A8) : quand la voiture est au bord de la rue et qu'on est plus loin, un
// agent descend et court vers nous. Il court moins vite que nous (on peut le semer en courant) ; s'il
// nous rejoint alors qu'on marche ou qu'on ne bouge plus : arrestation.
export const AGENT = { vitesse: 4.6, attrape: 1.4, arret: 3 };

export function pasAgent(a, j, dt) {
  const dx = j.x - a.x, dz = j.z - a.z, d = Math.hypot(dx, dz);
  const cap = Math.atan2(dx, dz);
  if (d <= AGENT.attrape) return { x: a.x, z: a.z, cap, d, attrape: Math.abs(j.vitesse || 0) < AGENT.arret };
  const pas = Math.min(d - AGENT.attrape * 0.8, AGENT.vitesse * dt);
  return { x: a.x + (dx / d) * pas, z: a.z + (dz / d) * pas, cap, d, attrape: false };
}
