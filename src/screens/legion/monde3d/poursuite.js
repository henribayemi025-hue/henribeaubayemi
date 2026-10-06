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

// Une infraction ponctuelle. quoi : 'choc' | 'pieton' | 'trottoir'.
export function infraction(p, quoi) {
  const plus = { choc: 0.7, pieton: 1.2, trottoir: 0.25 }[quoi] || 0;
  return { ...p, chaleur: Math.min(ETOILES_MAX + 0.99, p.chaleur + plus) };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// Un pas. j : { x, z, vitesse (m/s), auVolant }. Rend { p, evenements }.
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
    if (d < POLICE.rattrape && Math.abs(j.vitesse || 0) < POLICE.arret) {
      p.arret += dt;
      if (p.arret >= POLICE.delaiArrestation) {
        ev.push({ type: 'police', arrete: true, etoiles: etoiles(p) });
        return { p: nouvellePoursuite(), evenements: ev };
      }
    } else p.arret = 0;

    // Semée : hors de vue assez longtemps (plus vite si on est descendu de voiture).
    if (d > POLICE.perte || (!j.auVolant && d > 20)) {
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
