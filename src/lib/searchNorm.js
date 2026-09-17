// Comparer des noms comme les gens les TAPENT.
//
// Beau: une boutique visible dans l'annuaire restait introuvable dans la
// recherche. Vérifié en base: taper « decoration » ne trouvait pas
// « Décoration évents » — la recherche exigeait les accents exacts. Même
// piège avec les apostrophes: « kems » ne trouvait pas « Kem'S Surprise ».
//
// Personne ne tape les accents sur un téléphone. On replie donc les deux
// côtés — le nom en base et ce qui est tapé — vers une forme nue: minuscules,
// sans accents, sans apostrophes ni ponctuation. « Décoration », « decoration »
// et « DECORATION » deviennent le même mot.
export function foldName(s) {
  return String(s || '')
    .toLowerCase()
    // Décompose « é » en « e » + accent, puis supprime les accents.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Apostrophes (droite et typographique), ponctuation légère.
    .replace(/['’‘`´.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vrai si `haystack` contient `needle`, tous deux repliés.
export function nameMatches(haystack, needle) {
  const n = foldName(needle);
  if (!n) return true;
  return foldName(haystack).includes(n);
}

// ---------------------------------------------------------------------------
// Trouver un MÉTIER à partir du mot qu'une cliente tape.
//
// Astrid (18/09): elle tape « coiffeuse » dans la barre de recherche et
// n'obtient RIEN — alors que Finjaro a Joli'Hair, Beauty hairs, Didi_beauty56,
// Teug's, Ange fashion beauty. Vérifié, il y avait trois trous qui
// s'additionnaient:
//
// 1. Les boutiques n'étaient cherchées que par leur NOM. Ce qu'une boutique
//    FAIT — ses catégories, son métier — n'était jamais regardé. Sur une place
//    de marché qui annonce 48 métiers, chercher un métier ne donnait rien.
// 2. Les catégories étaient comparées par simple « le libellé contient le mot
//    tapé ». Or le libellé dit « Coiffure » et la cliente tape « coiffeuse ».
//    Aucun des deux ne contient l'autre.
// 3. Le repli par mots-clés ne connaissait ni coiffure, ni tresse, ni aucun
//    métier de service — seulement cinq familles de produits.
//
// On corrige par la RACINE plutôt que par une liste de synonymes à rallonge:
// « coiffeuse » et « coiffure » partagent « coiff », « plombier » et
// « plomberie » partagent « plomb », « mécanicien » et « mécanique »
// partagent « mecanic ». Cinq lettres communes suffisent et se trompent
// rarement. La liste de synonymes ne sert donc qu'aux mots qui n'ont AUCUNE
// racine commune avec le libellé: une tresse n'est pas un cheveu, un taxi
// n'est pas un transport.
const RACINE_MIN = 5;

const SYNONYMES = {
  // Chercher une coiffeuse doit aussi remonter les boutiques de cheveux:
  // Beauty hairs est rangée dans « Cheveux », pas dans un métier de service,
  // et c'est pourtant exactement ce qu'une cliente veut voir.
  coiffeuse: ['beaute_domicile', 'beaute_coiffure', 'cheveux', 'soins_capillaires'],
  coiffeur: ['beaute_domicile', 'beaute_coiffure', 'cheveux', 'soins_capillaires'],
  coiffure: ['beaute_domicile', 'beaute_coiffure', 'cheveux', 'soins_capillaires'],
  tresse: ['beaute_domicile', 'cheveux'],
  tressage: ['beaute_domicile', 'cheveux'],
  natte: ['beaute_domicile', 'cheveux'],
  nattes: ['beaute_domicile', 'cheveux'],
  braids: ['beaute_domicile', 'cheveux'],
  locks: ['beaute_domicile', 'cheveux'],
  perruque: ['cheveux'],
  meche: ['cheveux'],
  meches: ['cheveux'],
  tissage: ['cheveux'],
  salon: ['beaute_domicile'],
  barbier: ['beaute_domicile'],
  ongles: ['beaute_domicile'],
  manucure: ['beaute_domicile'],
  maquillage: ['beaute_domicile'],
  taxi: ['transport_chauffeur'],
  chauffeur: ['transport_chauffeur'],
  moto: ['transport_chauffeur'],
  babysitter: ['garde_enfants'],
  nounou: ['garde_enfants'],
  menage: ['menage'],
  repassage: ['menage', 'pressing_blanchisserie'],
  blanchisserie: ['pressing_blanchisserie'],
  maçon: ['btp_bricolage'],
  macon: ['btp_bricolage'],
  carreleur: ['btp_bricolage'],
  soudeur: ['btp_bricolage'],
  garagiste: ['mecanique_auto'],
  vulcanisateur: ['mecanique_auto'],
  traiteur: ['traiteur_chef'],
  cuisinier: ['traiteur_chef'],
  chef: ['traiteur_chef'],
  patissier: ['patisserie_service'],
  gateau: ['patisserie_service'],
  couturier: ['couture_retouches'],
  tailleur: ['couture_retouches'],
  infirmier: ['sante_domicile'],
  infirmiere: ['sante_domicile'],
  prof: ['cours', 'enseignant'],
  repetiteur: ['cours', 'enseignant'],
  dj: ['musicien_dj'],
  photographe: ['photo_video'],
  cameraman: ['videaste', 'photo_video'],
  vigile: ['securite'],
  gardien: ['securite'],
  informaticien: ['informatique_digital'],
  webmaster: ['informatique_digital'],
  comptable: ['comptable'],
  avocat: ['admin_juridique'],
  notaire: ['admin_juridique'],
};

function motsUtiles(s) {
  return foldName(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3);
}

// Deux mots partagent-ils une racine assez longue ? « coiffeuse »/« coiffure »
// → « coiff ». On accepte aussi qu'un mot soit le début de l'autre dès quatre
// lettres: « photo » et « photographe ».
function memeRacine(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && (b.startsWith(a) || a.startsWith(b))) return true;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= RACINE_MIN;
}

/**
 * Les identifiants de catégories que ce terme désigne probablement.
 *
 * @param {string} terme ce que la personne a tapé
 * @param {Array<{id: string, label: string}>} categories id + libellé traduit
 */
export function categoriesPourTerme(terme, categories) {
  const mots = motsUtiles(terme);
  if (mots.length === 0) return [];
  const trouves = new Set();

  for (const mot of mots) {
    for (const id of SYNONYMES[mot] || []) trouves.add(id);
  }

  for (const { id, label } of categories) {
    const motsLabel = motsUtiles(label).filter((w) => w.length >= 4);
    const correspond = mots.some((mot) => motsLabel.some((ml) => memeRacine(mot, ml)));
    if (correspond) trouves.add(id);
  }

  return [...trouves];
}
