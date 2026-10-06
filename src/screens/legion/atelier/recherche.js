// La recherche dans tout le projet (C13, 06/10) : le Worker renvoie des
// lignes { chemin, ligne, extrait } ; ici, on les range par fichier et on
// repère le texte cherché pour le mettre en valeur.

export function grouper(trouves) {
  const parFichier = new Map();
  for (const x of trouves || []) {
    if (!parFichier.has(x.chemin)) parFichier.set(x.chemin, []);
    parFichier.get(x.chemin).push(x);
  }
  return [...parFichier].map(([chemin, lignes]) => ({ chemin, lignes }));
}

// L'extrait en morceaux { texte, trouve }, sans tenir compte des majuscules.
export function surligner(extrait, q) {
  const texte = String(extrait ?? '');
  const cherche = String(q ?? '').toLowerCase();
  if (!cherche.trim()) return [{ texte, trouve: false }];
  const bas = texte.toLowerCase();
  const morceaux = [];
  let i = 0;
  for (;;) {
    const j = bas.indexOf(cherche, i);
    if (j === -1) break;
    if (j > i) morceaux.push({ texte: texte.slice(i, j), trouve: false });
    morceaux.push({ texte: texte.slice(j, j + cherche.length), trouve: true });
    i = j + cherche.length;
  }
  if (i < texte.length) morceaux.push({ texte: texte.slice(i), trouve: false });
  return morceaux;
}
