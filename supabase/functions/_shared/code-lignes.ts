// Le code lu par les agents, avec ses numéros de ligne (05/10 : Nino citait
// « MonArgent.jsx ligne 0 » faute de numéros ; une remarque sans ligne exacte
// ne peut être ni vérifiée ni corrigée). Pur : testé par vitest.

export const MORCEAU = 16_000;

// Le morceau qui commence au caractère `debut`, chaque ligne précédée de son
// numéro dans le fichier entier (« 124│ … »). `suite` reste un décalage en
// caractères du texte brut, comme avant.
export function morceauNumerote(texte: string, debut = 0, taille = MORCEAU) {
  const d = Math.max(0, Math.min(texte.length, Math.floor(Number(debut) || 0)));
  // On ne coupe pas une ligne en deux : le morceau finit au dernier retour à
  // la ligne, sauf si une seule ligne dépasse déjà la taille.
  let fin = Math.min(texte.length, d + taille);
  if (fin < texte.length) {
    const dernier = texte.lastIndexOf('\n', fin);
    if (dernier > d) fin = dernier + 1;
  }
  const premiere = texte.slice(0, d).split('\n').length;
  const lignes = texte.slice(d, fin).replace(/\n$/, '').split('\n');
  const contenu = lignes.map((l, i) => `${premiere + i}│ ${l}`).join('\n');
  return { premiere_ligne: premiere, derniere_ligne: premiere + lignes.length - 1, suite: fin < texte.length ? fin : null, contenu };
}

// Le mot cherché, même quand un modèle de secours l'a rangé sous un autre nom
// (Socle, 05/10 : code_chercher({}) cinq fois de suite → « au moins 3 lettres »).
export function motCherche(args: Record<string, unknown>): string {
  const direct = args.mot ?? args.nom ?? args.requete ?? args.q ?? args.query ?? args.chemin;
  const v = typeof direct === 'string' ? direct : Object.values(args).find((x) => typeof x === 'string');
  return String(v || '').toLowerCase().trim();
}

// Parmi des fichiers trouvés par leur nom, ceux qui valent d'être lus d'abord :
// le code de l'écran avant ses tests, ses maquettes ou sa documentation.
export function fichiersALire(fichiers: string[], deja: Set<string>, max = 2): string[] {
  const rang = (f: string) => (/\.(test|spec)\./.test(f) ? 3 : /^(docs|video-work|public)\//.test(f) ? 2 : /\.(jsx?|tsx?|sql)$/.test(f) ? 0 : 1);
  return fichiers.filter((f) => !deja.has(f)).sort((a, b) => rang(a) - rang(b)).slice(0, max);
}
