// Arborescence de catégories du PIVOT (marketplace généraliste produits +
// services) — miroir client de la table `categories` (migrations 0022/0023).
// `id` reste la clé stable utilisée en base, dans les URL (/category/<id>) et
// en i18n. Les 25 anciennes catégories GARDENT leur id et vivent désormais en
// ENFANTS des nouvelles têtes (voir CATEGORY_CHILDREN): un produit "beaute"
// existant apparaît dans "Beauté & Cosmétiques" sans qu'aucune donnée n'ait
// bougé, et les anciens liens profonds restent valides.
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
// pivot ne fait disparaître aucun produit existant.
export const CATEGORY_CHILDREN = {
  mode_femme: ['mode', 'chaussures', 'sacs', 'maroquinerie', 'accessoires'],
  bijoux_montres: ['bijoux', 'montres'],
  beaute_cosmetiques: ['parfums', 'beaute', 'cheveux'],
  maison_deco: ['deco', 'art'],
  evenementiel_mariages: ['mariages', 'evenement', 'mannequinerie'],
  vehicules: ['vehicules_voiture', 'vehicules_moto', 'vehicules_pieces'],
  btp_bricolage: ['reparation', 'jardinage'],
  livraison_demenagement: ['demenagement', 'coursier'],
  beaute_domicile: ['ongles'],
};

// Tous les id à interroger pour une page catégorie: la tête + ses enfants.
export function categoryQueryIds(id) {
  return [id, ...(CATEGORY_CHILDREN[id] ?? [])];
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
