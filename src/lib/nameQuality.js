// Reconnaitre un article dont le nom ne dit rien a une acheteuse.
//
// 120 articles sur 378 sont dans ce cas — un sur trois. « Baby 1 » a
// « Baby 63 » chez ByFlora, « T-shirt no name 1 » a « 18 » chez Syama,
// « Ensemble » cinq fois, « Paire », « Robe », « Finjaro ». Ce sont de VRAIS
// articles, avec de vraies photos et de vrais prix: j'ai verifie qu'aucun
// n'est un doublon. Simplement, personne ne peut les trouver — taper « robe »
// dans la recherche ne remonte aucun des 63 « Baby ».
//
// La cause n'est pas la negligence: c'est « Appliquer a tous », qui numerote
// un nom commun (`${base} ${n}`). La vendeuse s'en sert pour aller vite, et
// c'est exactement ce que l'ecran lui propose. Le motif « meme prefixe +
// numero » est donc la SIGNATURE de cette fonctionnalite, pas une devinette.
//
// Prudence: se tromper ici propose de renommer un article correctement
// nomme, ce qui est insultant pour la vendeuse qui a pris le temps. On exige
// donc trois articles partageant le prefixe avant de conclure — « Samsung
// Galaxy S22+ 256Go » ou « Tonnelles 30 euros 1 » ne declenchent rien.

const MIN_SERIE = 3;

// Abaisser ce seuil a deux pour les noms courts a ete essaye, puis retire:
// ca visait « Lunette soudeur » et « YAKA Baobab » en double, qui sont de
// VRAIS noms. Deux articles du meme modele dans une boutique, c'est le
// commerce normal — pas un defaut de nommage.

// Des mots qui nomment une famille, jamais un article. Un nom entierement
// compose de ceux-la ne decrit rien: « Robe », « Produit bebe », « Paire ».
// Des qu'un seul mot concret s'y ajoute — « Robe maya », « Ensemble turban
// et bijoux assortis » — le nom redevient trouvable, et on n'y touche pas.
const GENERIQUES = new Set([
  'produit', 'produits', 'article', 'articles', 'photo', 'photos', 'image', 'images',
  'bebe', 'baby', 'enfant', 'enfants', 'femme', 'homme',
  'robe', 'ensemble', 'paire', 'paires', 'lot', 'lots', 'set',
  'habit', 'habits', 'vetement', 'vetements', 'tenue', 'tenues',
  'truc', 'trucs', 'divers', 'autre', 'autres', 'nouveau', 'nouveaute', 'promo', 'new',
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'a', 'pour',
]);

function motsDe(nom) {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean);
}

// Vrai si TOUS les mots du nom nomment une famille et aucun un article.
function toutGenerique(nom) {
  const mots = motsDe(nom);
  if (!mots.length) return true;
  return mots.every((m) => GENERIQUES.has(m));
}

// Nom vide, ou si court qu'il ne peut rien decrire (« Bo », « XL »).
function tropCourt(nom) {
  return nom.replace(/[^\p{L}]/gu, '').length < 4;
}

// « Baby 12 » -> « Baby ». Null si le nom ne finit pas par un numero seul.
function prefixeDeSerie(nom) {
  const m = nom.match(/^(.*\p{L}.*?)[\s-]+\d{1,3}$/u);
  return m ? m[1].trim().toLowerCase() : null;
}

// Les ids des articles a renommer, dans la liste fournie.
export function articlesSansVraiNom(rows) {
  const parPrefixe = new Map();
  const parNom = new Map();
  for (const p of rows) {
    const nom = String(p?.name ?? '').trim();
    if (!nom) continue;
    const pre = prefixeDeSerie(nom);
    if (pre) parPrefixe.set(pre, (parPrefixe.get(pre) ?? 0) + 1);
    const cle = nom.toLowerCase();
    parNom.set(cle, (parNom.get(cle) ?? 0) + 1);
  }
  return rows
    .filter((p) => {
      // Sans photo, Finia n'a rien a lire: la proposer serait mentir.
      if (!p?.images?.[0]) return false;
      const nom = String(p?.name ?? '').trim();
      if (!nom || tropCourt(nom)) return true;
      if (toutGenerique(nom)) return true;
      const pre = prefixeDeSerie(nom);
      if (pre && (parPrefixe.get(pre) ?? 0) >= MIN_SERIE) return true;
      // Le meme nom exact sur plusieurs articles differents: une cliente ne
      // peut pas les distinguer dans sa recherche ni dans son panier.
      return (parNom.get(nom.toLowerCase()) ?? 0) >= MIN_SERIE;
    })
    .map((p) => p.id);
}
