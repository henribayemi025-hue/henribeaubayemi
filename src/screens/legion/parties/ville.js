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
// avancement, fini, en retard.
export function hauteurTour(projet, taches, maintenant = Date.now()) {
  const rendues = taches.filter(estRendue).length;
  const restantes = taches.length - rendues;
  const agents = new Set(taches.filter((t) => t.assigne_a && auTravail(t, maintenant)).map((t) => t.assigne_a));
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
export function tours(projets, taches, maintenant = Date.now()) {
  const ids = new Set(projets.map((p) => p.id));
  const parProjet = new Map([[QUOTIDIEN, []], ...projets.map((p) => [p.id, []])]);
  for (const t of taches) parProjet.get(projetDe(t, ids)).push(t);
  const liste = projets.map((p) => ({ projet: p, id: p.id, taches: parProjet.get(p.id), ...hauteurTour(p, parProjet.get(p.id), maintenant) }));
  liste.sort((a, b) => String(a.projet.debut).localeCompare(String(b.projet.debut)));
  const quotidien = parProjet.get(QUOTIDIEN);
  if (quotidien.length) liste.push({ projet: null, id: QUOTIDIEN, taches: quotidien, ...hauteurTour(null, quotidien, maintenant) });
  return liste;
}

// Jours restants avant la fin (négatif : dépassé).
export function joursRestants(projet, maintenant = Date.now()) {
  const fin = date(projet?.fin);
  return fin == null ? null : Math.ceil((fin + JOUR - maintenant) / JOUR);
}
