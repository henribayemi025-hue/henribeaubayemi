// L'arbre des dossiers, à partir de la liste plate des fichiers que rend
// l'atelier : [{ chemin: 'src/app.js', taille }] → dossiers d'abord, puis
// fichiers, chacun trié par nom.
export function construireArbre(fichiers) {
  const racine = { nom: '', chemin: '', dossiers: new Map(), fichiers: [] };
  for (const f of fichiers || []) {
    const parts = String(f.chemin).split('/').filter(Boolean);
    let n = racine;
    parts.slice(0, -1).forEach((p, i) => {
      if (!n.dossiers.has(p)) n.dossiers.set(p, { nom: p, chemin: parts.slice(0, i + 1).join('/'), dossiers: new Map(), fichiers: [] });
      n = n.dossiers.get(p);
    });
    if (parts.length) n.fichiers.push({ nom: parts.at(-1), chemin: parts.join('/'), taille: f.taille });
  }
  const figer = (n) => ({
    nom: n.nom,
    chemin: n.chemin,
    dossiers: [...n.dossiers.values()].sort((a, b) => a.nom.localeCompare(b.nom)).map(figer),
    fichiers: n.fichiers.sort((a, b) => a.nom.localeCompare(b.nom)),
  });
  return figer(racine);
}

// Le langage de l'éditeur, d'après l'extension.
export function langageDe(chemin) {
  const ext = String(chemin || '').split('.').pop().toLowerCase();
  if (['js', 'mjs', 'cjs', 'jsx'].includes(ext)) return 'js';
  if (['ts', 'tsx'].includes(ext)) return 'ts';
  if (ext === 'py') return 'py';
  if (['html', 'htm'].includes(ext)) return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'json') return 'json';
  return 'texte';
}

// Un montant en dollars US (les prix publiés par les fournisseurs, sans
// conversion : on ne suppose la monnaie de personne).
export function dollars(n, langue = 'fr') {
  const v = Number(n) || 0;
  return new Intl.NumberFormat(langue, { style: 'currency', currency: 'USD', minimumFractionDigits: v > 0 && v < 0.01 ? 4 : 2, maximumFractionDigits: 4 }).format(v);
}
