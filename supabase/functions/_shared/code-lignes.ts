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

// Mots de la vie courante → mots qu'on trouve dans les NOMS de fichiers d'un
// code écrit en anglais. code_chercher ne regarde que les noms de fichiers :
// Nino (12/10) cherchait « inscription », « creation-boutique » et
// « validation-commande », n'obtenait rien, et se déclarait « bloqué »
// alors que les fichiers s'appellent SignUp, CreateShop ou Checkout.
// Valable pour tout dépôt branché, pas seulement celui de Finjaro.
const EQUIVALENTS_EN: Record<string, string[]> = {
  inscription: ['signup', 'register'], connexion: ['login', 'auth', 'signin'], compte: ['account', 'profile'],
  profil: ['profile'], boutique: ['shop', 'store'], magasin: ['shop', 'store'], vendeur: ['seller', 'vendor'],
  vendeuse: ['seller', 'vendor'], acheteur: ['buyer'], acheteuse: ['buyer'], article: ['product', 'item'],
  produit: ['product', 'item'], prix: ['price'], panier: ['cart', 'basket'], commande: ['order', 'checkout'],
  validation: ['checkout', 'confirm'], paiement: ['payment', 'pay'], livraison: ['delivery', 'shipping'],
  message: ['chat', 'message', 'inbox'], messagerie: ['chat', 'inbox'], recherche: ['search'], avis: ['review', 'rating'],
  accueil: ['home'], parametres: ['settings'], notification: ['notification', 'push'], litige: ['dispute'],
  conditions: ['terms', 'legal'], confidentialite: ['privacy'], abonnement: ['subscription', 'plan'],
  facture: ['invoice', 'receipt'], stock: ['stock', 'inventory'], creation: ['create'], formulaire: ['form'],
  erreur: ['error'], image: ['image', 'photo'], photo: ['photo', 'image'], video: ['video', 'reel'],
};

// Les mots à essayer quand le mot demandé n'est dans aucun nom de fichier :
// chaque morceau (« creation-boutique » → creation, boutique), sans accents ni
// pluriel, puis ses équivalents anglais.
export function motsDeSecours(mot: string): string[] {
  const sansAccents = String(mot || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const jetons = sansAccents.split(/[^a-z0-9]+/).filter((j) => j.length >= 3);
  const sortie = new Set<string>();
  for (const j of jetons) {
    sortie.add(j);
    for (const e of EQUIVALENTS_EN[j] || EQUIVALENTS_EN[j.replace(/s$/, '')] || []) sortie.add(e);
  }
  return [...sortie];
}
