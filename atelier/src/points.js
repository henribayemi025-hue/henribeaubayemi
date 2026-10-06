// LES POINTS DE RETOUR (C13, 06/10) : une photo de tous les fichiers du
// projet, à laquelle on peut revenir d'un clic. L'humain en pose un quand il
// veut ; un point est aussi posé tout seul juste avant chaque retour, pour
// pouvoir annuler le retour lui-même.
//
// Ne connaît pas Cloudflare : `stockage` a get / put / delete / list (comme le
// stockage d'un Durable Object), `f` les fichiers du projet (atelier.js).

export const POINTS_MAX = 5;
const PAQUET = 128; // le stockage efface au plus 128 clés d'un coup

const cle = (pid, n, chemin = '') => `r:${pid}:${n}:${chemin}`;

async function effacer(stockage, pid, n) {
  const cles = [...(await stockage.list({ prefix: cle(pid, n) })).keys()];
  for (let i = 0; i < cles.length; i += PAQUET) await stockage.delete(cles.slice(i, i + PAQUET));
}

export function listePoints(e) {
  return (e.points || []).map(({ n, nom, quand, auto, index }) => ({
    n, nom, quand, auto: !!auto, fichiers: Object.keys(index).length, taille: Object.values(index).reduce((t, x) => t + x, 0),
  }));
}

export async function creerPoint(stockage, pid, e, f, { nom, auto = false, maintenant = new Date() } = {}) {
  e.points ||= [];
  e.pointN = (e.pointN || 0) + 1;
  const n = e.pointN;
  for (const { chemin } of await f.liste()) {
    const v = await f.lire(chemin);
    if (v != null) await stockage.put(cle(pid, n, chemin), v);
  }
  e.points.unshift({ n, nom: String(nom || '').trim().slice(0, 80) || null, quand: maintenant.toISOString(), auto, index: { ...e.index } });
  // Les plus anciens partent (un point « auto » d'abord, s'il y en a).
  while (e.points.length > POINTS_MAX) {
    const i = e.points.map((p) => p.auto).lastIndexOf(true);
    const [parti] = e.points.splice(i > 0 ? i : e.points.length - 1, 1);
    await effacer(stockage, pid, parti.n);
  }
  return n;
}

// Le projet redevient exactement la photo : les fichiers en plus sont
// retirés, les autres remis tels qu'ils étaient. Rend { remis, retires }.
export async function restaurerPoint(stockage, pid, e, f, n, { nomAvant, maintenant = new Date() } = {}) {
  const point = (e.points || []).find((p) => p.n === Number(n));
  if (!point) return null;
  const contenus = {};
  for (const chemin of Object.keys(point.index)) {
    const v = await stockage.get(cle(pid, point.n, chemin));
    if (v != null) contenus[chemin] = String(v);
  }
  await creerPoint(stockage, pid, e, f, { nom: nomAvant, auto: true, maintenant });
  let retires = 0;
  for (const { chemin } of await f.liste()) {
    if (!(chemin in contenus)) { await f.supprimer(chemin); retires += 1; }
  }
  let remis = 0;
  for (const [chemin, contenu] of Object.entries(contenus)) {
    if ((await f.lire(chemin)) !== contenu) { await f.ecrire(chemin, contenu); remis += 1; }
  }
  return { remis, retires };
}

export async function supprimerPoint(stockage, pid, e, n) {
  const i = (e.points || []).findIndex((p) => p.n === Number(n));
  if (i < 0) return false;
  const [parti] = e.points.splice(i, 1);
  await effacer(stockage, pid, parti.n);
  return true;
}
