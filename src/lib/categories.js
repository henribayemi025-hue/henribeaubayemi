// Arborescence de catégories du PIVOT (marketplace généraliste produits +
// services) — miroir client de la table `categories` (migrations 0022/0023/
// 0024). `id` reste la clé stable utilisée en base, dans les URL
// (/category/<id>) et en i18n. Les 25 anciennes catégories GARDENT leur id et
// vivent désormais en ENFANTS des nouvelles têtes (voir CATEGORY_CHILDREN):
// un produit "beaute" existant apparaît dans "Beauté & Cosmétiques" sans
// qu'aucune donnée n'ait bougé, et les anciens liens profonds restent valides.
//
// GENRE (0024): mode/chaussures/sacs/maroquinerie/accessoires n'ont jamais
// été taggées par genre en base — les ranger sous Mode Femme par défaut (fait
// dans 0023) affirmait un genre inconnu. Elles vivent maintenant sous "Mode
// (à trier)", une tête neutre et VISIBLE (pas cachée). Mode Femme/Homme/
// Enfants & Bébé ont chacune de vraies sous-catégories (Robes, Chemises,
// Vêtements bébé…) — c'est ce que choisissent les NOUVELLES fiches.
//
// Bannières: photos statiques 480x480 WebP (src/assets/categories). Les
// nouvelles catégories n'ont pas encore de photo — CategoryStrip affiche
// alors une tuile dégradée avec l'initiale (même logique que ShopAvatar).
import mode from '../assets/categories/mode.webp';
import chaussures from '../assets/categories/chaussures.webp';
import sacs from '../assets/categories/sacs.webp';
import bijoux from '../assets/categories/bijoux.webp';
import montres from '../assets/categories/montres.webp';
import parfums from '../assets/categories/parfums.webp';
import beaute from '../assets/categories/beaute.webp';
import cheveux from '../assets/categories/cheveux.webp';
import deco from '../assets/categories/deco.webp';
import mariages from '../assets/categories/mariages.webp';
import evenement from '../assets/categories/evenement.webp';
import mannequinerie from '../assets/categories/mannequinerie.webp';
import art from '../assets/categories/art.webp';
import accessoires from '../assets/categories/accessoires.webp';
import maroquinerie from '../assets/categories/maroquinerie.webp';

// Les 13 têtes PRODUIT du pivot — c'est CETTE liste que montrent l'accueil et
// les formulaires vendeur. Bannière réutilisée quand une photo héritée colle
// sémantiquement; null sinon (tuile initiale en attendant de vraies photos).
export const CATEGORIES = [
  { id: 'mode_femme', banner: mode },
  { id: 'mode_homme', banner: null },
  { id: 'enfants_bebe', banner: null },
  { id: 'hightech', banner: null },
  { id: 'beaute_cosmetiques', banner: beaute },
  { id: 'bijoux_montres', banner: bijoux },
  { id: 'maison_deco', banner: deco },
  { id: 'evenementiel_mariages', banner: mariages },
  { id: 'alimentaire', banner: null },
  { id: 'jus_naturels', banner: null },
  { id: 'seconde_main', banner: null },
  { id: 'vehicules', banner: null },
  { id: 'immobilier_vente', banner: null },
  // Tête transitoire (0024): anciens articles jamais taggés par genre.
  // Visible, cherchable — pas une corbeille cachée. Pas de photo: elle
  // partagerait celle de Mode Femme et les deux tuiles deviendraient
  // indistinguables.
  { id: 'mode_a_trier', banner: null },
];

// Anciennes catégories (bannières conservées pour les liens profonds
// /category/<id> hérités, qui doivent continuer d'afficher leur bandeau).
export const LEGACY_CATEGORIES = [
  { id: 'mode', banner: mode },
  { id: 'chaussures', banner: chaussures },
  { id: 'sacs', banner: sacs },
  { id: 'maroquinerie', banner: maroquinerie },
  { id: 'bijoux', banner: bijoux },
  { id: 'montres', banner: montres },
  { id: 'parfums', banner: parfums },
  { id: 'beaute', banner: beaute },
  { id: 'cheveux', banner: cheveux },
  { id: 'deco', banner: deco },
  { id: 'mariages', banner: mariages },
  { id: 'evenement', banner: evenement },
  { id: 'mannequinerie', banner: mannequinerie },
  { id: 'art', banner: art },
  { id: 'accessoires', banner: accessoires },
];

export function categoryBanner(id) {
  return (
    CATEGORIES.find((c) => c.id === id)?.banner ??
    LEGACY_CATEGORIES.find((c) => c.id === id)?.banner ??
    null
  );
}

// Miroir du parent/enfant en base. Une page catégorie interroge la tête ET
// ses enfants (voir lib/categoryCache.js) — c'est ce qui garantit que le
// pivot ne fait disparaître aucun produit existant. Sert aussi de source aux
// sous-catégories proposées à la création d'une fiche (VendorProductEdit).
export const CATEGORY_CHILDREN = {
  mode_femme: [
    'femme_robes', 'femme_hauts', 'femme_pantalons', 'femme_jupes',
    'femme_vestes_manteaux', 'femme_lingerie', 'femme_chaussures',
    'femme_sacs', 'femme_maroquinerie', 'femme_accessoires',
  ],
  mode_homme: [
    'homme_chemises', 'homme_tshirts_polos', 'homme_pantalons',
    'homme_vestes_costumes', 'homme_chaussures', 'homme_accessoires',
  ],
  enfants_bebe: [
    'enfant_bebe', 'enfant_fille', 'enfant_garcon',
    'enfant_chaussures', 'enfant_jouets', 'enfant_puericulture',
  ],
  // Anciens articles non genrés (0024) — head transitoire, pas une gamme
  // Femme/Homme comme les autres.
  mode_a_trier: ['mode', 'chaussures', 'sacs', 'maroquinerie', 'accessoires'],
  bijoux_montres: ['bijoux', 'montres'],
  beaute_cosmetiques: ['parfums', 'beaute', 'cheveux'],
  maison_deco: ['deco', 'art'],
  evenementiel_mariages: ['mariages', 'evenement', 'mannequinerie'],
  vehicules: ['vehicules_voiture', 'vehicules_moto', 'vehicules_pieces'],
  btp_bricolage: ['reparation', 'jardinage'],
  livraison_demenagement: ['demenagement', 'coursier'],
  beaute_domicile: ['ongles'],
};

// Sous-catégories PROPOSÉES à la création d'une fiche (choix explicite du
// vendeur, cascading select) — un sous-ensemble de CATEGORY_CHILDREN: on
// exclut mode_a_trier (transitoire, jamais un choix pour du neuf) et les
// entrées qui ne sont que des alias hérités (bijoux_montres, beaute_cosmetiques…
// où l'ancien id EST déjà la bonne catégorie, pas besoin d'un niveau de plus).
export const SELECTABLE_SUBCATEGORIES = {
  mode_femme: CATEGORY_CHILDREN.mode_femme,
  mode_homme: CATEGORY_CHILDREN.mode_homme,
  enfants_bebe: CATEGORY_CHILDREN.enfants_bebe,
  vehicules: CATEGORY_CHILDREN.vehicules,
};

// Tous les id à interroger pour une page catégorie: la tête + ses enfants.
export function categoryQueryIds(id) {
  return [id, ...(CATEGORY_CHILDREN[id] ?? [])];
}

// Tête d'une sous-catégorie (ex: 'femme_robes' -> 'mode_femme'). Renvoie l'id
// lui-même s'il est déjà une tête (ou inconnu) — sert au sélecteur en cascade
// de la fiche article (VendorProductEdit) pour préremplir le bon niveau 1.
export function categoryHeadFor(id) {
  const parent = Object.keys(CATEGORY_CHILDREN).find((p) => CATEGORY_CHILDREN[p].includes(id));
  return parent ?? id;
}

// Catégories SERVICE (annuaire de l'onglet Services + annonces near_you).
// Les 9 têtes du pivot + 3 héritées sans équivalent dans la nouvelle liste,
// conservées pour ne pas orpheliner les annonces existantes (à arbitrer).
export const SERVICE_CATEGORIES = [
  { id: 'beaute_domicile' },
  { id: 'menage' },
  { id: 'btp_bricolage' },
  { id: 'informatique_digital' },
  { id: 'electricite_plomberie' },
  { id: 'livraison_demenagement' },
  { id: 'traiteur_chef' },
  { id: 'location_immobiliere' },
  { id: 'location_vehicules' },
  // Héritées:
  { id: 'cours' },
  { id: 'evenementiel_service' },
  { id: 'autre_service' },
];

// Anciennes catégories service devenues enfants (annonces existantes).
const LEGACY_SERVICE_IDS = ['reparation', 'jardinage', 'demenagement', 'coursier', 'ongles'];

export function isServiceCategory(categoryId) {
  return (
    SERVICE_CATEGORIES.some((c) => c.id === categoryId) ||
    LEGACY_SERVICE_IDS.includes(categoryId)
  );
}

// Vendues sur devis/contact: pas de prix ferme ajoutable au panier COD.
// Étendu au pivot: on n'achète pas un appartement ni une voiture via le
// panier "paiement à la livraison" — ces fiches passent par le contact
// boutique (chat/WhatsApp/appel).
export const QUOTE_ONLY_CATEGORIES = [
  'mariages', 'evenement', 'mannequinerie',                     // héritées
  'evenementiel_mariages',
  'immobilier_vente', 'location_immobiliere',
  'vehicules', 'vehicules_voiture', 'vehicules_moto', 'location_vehicules',
];

export function isQuoteOnly(categoryId) {
  return QUOTE_ONLY_CATEGORIES.includes(categoryId);
}

// Essayage virtuel (Miroir IA): là où "se voir le porter" a du sens.
export const MIRROR_CATEGORIES = [
  'mode', 'chaussures', 'sacs', 'maroquinerie', 'bijoux', 'montres', 'accessoires', 'cheveux',
  'mode_femme', 'mode_homme', 'enfants_bebe', 'bijoux_montres',
];

// Champs spécifiques par catégorie (produits.attributes jsonb, migration
// 0023). Un bien immobilier ne se décrit pas comme un service de ménage:
// chaque entrée = { key, type } ; le libellé vient de l'i18n
// (productAttrs.<key>). Volontairement court — enrichi quand Beau tranchera
// les fiches types définitives.
export const ATTRIBUTE_FIELDS = {
  vehicules: [
    { key: 'marque', type: 'text' },
    { key: 'modele', type: 'text' },
    { key: 'annee', type: 'number' },
    { key: 'kilometrage', type: 'number' },
  ],
  immobilier_vente: [
    { key: 'surface_m2', type: 'number' },
    { key: 'pieces', type: 'number' },
    { key: 'quartier', type: 'text' },
  ],
  hightech: [
    { key: 'marque', type: 'text' },
    { key: 'modele', type: 'text' },
    { key: 'etat', type: 'text' },
  ],
};
// Les enfants héritent des champs de leur tête (ex: vehicules_moto).
export function attributeFieldsFor(categoryId) {
  if (ATTRIBUTE_FIELDS[categoryId]) return ATTRIBUTE_FIELDS[categoryId];
  const parent = Object.keys(CATEGORY_CHILDREN).find((p) => CATEGORY_CHILDREN[p].includes(categoryId));
  return (parent && ATTRIBUTE_FIELDS[parent]) || [];
}

export function categoryLabel(t, id) {
  return t(`categories.${id}`);
}
