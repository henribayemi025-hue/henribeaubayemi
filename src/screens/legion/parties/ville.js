// La Ville de Léo (25/09) : les calculs, sans écran, pour les tester.
// Une tour = un projet (legion_projets) ; les tâches s'y rattachent par
// meta.projet_id ; celles sans projet (ou d'un projet disparu) forment la
// tour « Au quotidien ». Rien ne bouge sans une vraie donnée : une fenêtre
// allumée = un agent qui a PRIS une tâche il y a moins de 10 minutes et ne
// l'a pas encore rendue.

export const QUOTIDIEN = 'quotidien';
const DIX_MIN = 10 * 60 * 1000;
const JOUR = 86_400_000;

const date = (x) => { const t = Date.parse(x || ''); return Number.isFinite(t) ? t : null; };

export function estRendue(t) {
  if (t.termine_le) return true;
  const s = t.meta?.statut;
  return s === 'fait' || s === 'revue';
}

// Au travail maintenant : prise récente, pas rendue depuis.
export function auTravail(t, maintenant) {
  const prise = date(t.meta?.travaille_depuis);
  if (!prise || maintenant - prise > DIX_MIN || prise > maintenant + 60_000) return false;
  const rendue = date(t.meta?.livre_le);
  return !(rendue && rendue >= prise);
}

export function projetDe(t, idsProjets) {
  const p = t.meta?.projet_id;
  return p && idsProjets.has(p) ? p : QUOTIDIEN;
}

// L'état d'une tour : rendues, restantes, agents au travail (distincts),
// avancement, fini, en retard. `eteints` : les agents dont l'interrupteur
// est coupé — ils n'allument jamais de fenêtre, même avec une prise récente
// (Orchestre, 25/09 : « l'interrupteur l'emporte sur toutes les horloges »).
export function hauteurTour(projet, taches, maintenant = Date.now(), eteints = new Set()) {
  const rendues = taches.filter(estRendue).length;
  const restantes = taches.length - rendues;
  const agents = new Set(taches.filter((t) => t.assigne_a && !eteints.has(t.assigne_a) && auTravail(t, maintenant)).map((t) => t.assigne_a));
  const fin = projet ? date(projet.fin) : null;
  const finPassee = fin != null && maintenant > fin + JOUR; // la fin est un jour entier
  const termine = !!projet && (projet.statut === 'fini' || (taches.length > 0 && restantes === 0));
  return {
    rendues, restantes, total: taches.length,
    agentsAuTravail: agents.size, agents: [...agents],
    avancement: taches.length ? rendues / taches.length : 0,
    termine,
    enRetard: !termine && finPassee && restantes > 0,
  };
}

// Toutes les tours de l'entreprise, la plus avancée dans le temps d'abord.
export function tours(projets, taches, maintenant = Date.now(), eteints = new Set()) {
  const ids = new Set(projets.map((p) => p.id));
  const parProjet = new Map([[QUOTIDIEN, []], ...projets.map((p) => [p.id, []])]);
  for (const t of taches) parProjet.get(projetDe(t, ids)).push(t);
  const liste = projets.map((p) => ({ projet: p, id: p.id, taches: parProjet.get(p.id), ...hauteurTour(p, parProjet.get(p.id), maintenant, eteints) }));
  liste.sort((a, b) => String(a.projet.debut).localeCompare(String(b.projet.debut)));
  const quotidien = parProjet.get(QUOTIDIEN);
  if (quotidien.length) liste.push({ projet: null, id: QUOTIDIEN, taches: quotidien, ...hauteurTour(null, quotidien, maintenant, eteints) });
  return liste;
}

// Jours restants avant la fin (négatif : dépassé).
export function joursRestants(projet, maintenant = Date.now()) {
  const fin = date(projet?.fin);
  return fin == null ? null : Math.ceil((fin + JOUR - maintenant) / JOUR);
}

// ——— La 4D (Beau, 25/09 : « tu peux pas faire 4D ? ») ———
// La ville à une date passée, refaite avec les vraies dates : un projet
// n'existe qu'à partir de sa création, une tâche à partir de la sienne, et
// elle n'est rendue qu'à sa date de rendu. Une tâche rendue SANS date de
// rendu ne compte comme rendue qu'aujourd'hui : on n'invente pas le jour.
export function dateRendue(t) { return date(t.termine_le) ?? date(t.meta?.livre_le); }

export function aLaDate(projets, taches, jour, maintenant = Date.now()) {
  if (jour == null || jour >= maintenant) return { projets, taches };
  // Un projet existe dès la première de ces dates : sa création, son début
  // prévu, ou la création de sa première tâche (le premier étage est du vrai travail).
  const premiere = new Map();
  for (const t of taches) { const id = t.meta?.projet_id; const c = date(t.created_at); if (id && c != null && c < (premiere.get(id) ?? Infinity)) premiere.set(id, c); }
  const ps = projets
    .filter((p) => { const d = [date(p.created_at), date(p.debut), premiere.get(p.id)].filter((x) => x != null); return !d.length || Math.min(...d) <= jour; })
    // « fini » n'a pas de date : dans le passé, seules les tâches rendues le disent.
    .map((p) => (p.statut === 'fini' ? { ...p, statut: 'en_cours' } : p));
  const ts = taches
    .filter((t) => { const c = date(t.created_at); return c != null && c <= jour; })
    .map((t) => {
      const r = dateRendue(t);
      const rendue = estRendue(t) && r != null && r <= jour;
      return { ...t, termine_le: rendue ? (t.termine_le || t.meta?.livre_le) : null, meta: { ...(t.meta || {}), statut: rendue ? 'fait' : 'a_faire' } };
    });
  return { projets: ps, taches: ts };
}

// Les bornes de la frise : du premier projet ou de la première tâche jusqu'à
// aujourd'hui, au plus un an en arrière. En jours entiers (minuit local).
export function bornesFrise(projets, taches, maintenant = Date.now()) {
  const dates = [...projets.map((p) => date(p.created_at) ?? date(p.debut)), ...taches.map((t) => date(t.created_at))].filter((x) => x != null && x <= maintenant);
  const minuit = (x) => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const fin = minuit(maintenant);
  const debut = dates.length ? Math.max(minuit(Math.min(...dates)), fin - 365 * JOUR) : fin;
  return { debut, fin, jours: Math.round((fin - debut) / JOUR) };
}
