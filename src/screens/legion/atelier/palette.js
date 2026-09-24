// La recherche floue de la palette Ctrl+K. Écrite par Ada Nkemba dans
// l'atelier (25/09, projet « Chantier — Palette Ctrl+K (Ada) », 18/18 tests),
// relue et reprise ici par Claude.

export const MAX_RESULTATS = 50;

// Minuscules, sans accents (é → e : même longueur, les positions restent justes).
export function normaliser(texte) {
  return String(texte).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Les lettres tapées doivent apparaître DANS L'ORDRE dans le libellé.
// null si ça ne correspond pas ; sinon { score, positions } (plus grand = mieux).
export function scoreFlou(requete, libelle) {
  const q = normaliser(requete).trim();
  const cible = normaliser(libelle);
  if (!q) return { score: 0, positions: [] };
  const positions = [];
  let depuis = 0;
  let precedent = -2;
  let score = 0;
  for (const lettre of q) {
    if (lettre === ' ') continue;
    const trouve = cible.indexOf(lettre, depuis);
    if (trouve === -1) return null;
    positions.push(trouve);
    score += 10;
    if (trouve === precedent + 1) score += 8; // lettres qui se suivent
    if (trouve === 0) score += 6; // début du libellé
    else if ('/. -_'.includes(cible[trouve - 1])) score += 4; // début de mot
    score -= Math.min(trouve, 20) * 0.1;
    precedent = trouve;
    depuis = trouve + 1;
  }
  return { score: score - cible.length * 0.05, positions };
}

// entrees : [{ type: 'fichier' | 'action', label, ... }]. « > » au début :
// seulement les actions. Meilleurs d'abord ; à égalité, l'ordre d'origine.
export function rechercher(requete, entrees) {
  let brut = String(requete ?? '');
  const actionsSeules = brut.startsWith('>');
  if (actionsSeules) brut = brut.slice(1);
  const res = [];
  entrees.forEach((e, ordre) => {
    if (actionsSeules && e.type !== 'action') return;
    const r = scoreFlou(brut, e.label);
    if (r) res.push({ ...e, score: r.score, positions: r.positions, ordre });
  });
  res.sort((a, b) => (b.score - a.score) || (a.ordre - b.ordre));
  return res.slice(0, MAX_RESULTATS);
}

// Le libellé en morceaux { texte, gras } pour mettre en gras les lettres trouvées.
export function decouper(label, positions) {
  const ens = new Set(positions);
  const morceaux = [];
  for (let i = 0; i < label.length; i += 1) {
    const gras = ens.has(i);
    const dernier = morceaux[morceaux.length - 1];
    if (dernier && dernier.gras === gras) dernier.texte += label[i];
    else morceaux.push({ texte: label[i], gras });
  }
  return morceaux;
}
