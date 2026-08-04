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
// Photos envoyées par Beau (31/07) pour les rayons qui n'en avaient pas
// encore — CC0/domaine public (Wikimedia Commons, Openverse), aucune
// attribution requise.
import modeHomme from '../assets/categories/mode_homme.webp';
import modeATrier from '../assets/categories/mode_a_trier.webp';
import enfantsBebe from '../assets/categories/enfants_bebe.webp';
import hightech from '../assets/categories/hightech.webp';
import alimentaire from '../assets/categories/alimentaire.webp';
import electromenager from '../assets/categories/electromenager.webp';
import sportLoisirs from '../assets/categories/sport_loisirs.webp';
import jusNaturels from '../assets/categories/jus_naturels.webp';
import musique from '../assets/categories/musique.webp';
import secondeMain from '../assets/categories/seconde_main.webp';
import vehicules from '../assets/categories/vehicules.webp';
import santeBienetre from '../assets/categories/sante_bienetre.webp';
import livresPapeterie from '../assets/categories/livres_papeterie.webp';
import jardinExterieur from '../assets/categories/jardin_exterieur.webp';
import animaux from '../assets/categories/animaux.webp';
import immobilierVente from '../assets/categories/immobilier_vente.webp';
import { PRODUCT_HEADS, SERVICE_HEADS, CATEGORY_CHILDREN } from './categoryTree';

export { CATEGORY_CHILDREN };

// Les 13 têtes PRODUIT du pivot — c'est CETTE liste que montrent l'accueil et
// les formulaires vendeur. Bannière réutilisée quand une photo héritée colle
// sémantiquement; null sinon (tuile initiale en attendant de vraies photos).
// Photo de rayon quand il en existe une; sinon CategoryStrip pose une icône.
const HEAD_BANNER = {
  mode_femme: mode,
  beaute_cosmetiques: beaute,
  bijoux_montres: bijoux,
  maison_deco: deco,
  evenementiel_mariages: mariages,
  mode_homme: modeHomme,
  mode_a_trier: modeATrier,
  enfants_bebe: enfantsBebe,
  hightech,
  alimentaire,
  electromenager,
  sport_loisirs: sportLoisirs,
  jus_naturels: jusNaturels,
  musique,
  seconde_main: secondeMain,
  vehicules,
  sante_bienetre: santeBienetre,
  livres_papeterie: livresPapeterie,
  jardin_exterieur: jardinExterieur,
  animaux,
  immobilier_vente: immobilierVente,
};

// Les rayons produits viennent de la BASE (categoryTree, généré) — plus de
// liste tenue à la main qui divergeait de la table `categories`.
export const CATEGORIES = PRODUCT_HEADS.map((id) => ({ id, banner: HEAD_BANNER[id] ?? null }));

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

// Sous-catégories PROPOSÉES à la création d'une fiche (sélecteur en cascade).
// Toutes les têtes qui ont des enfants, SAUF `mode_a_trier`: cette tête ne
// contient que d'anciens articles jamais classés, ce n'est jamais un choix
// valable pour une fiche neuve.
export const SELECTABLE_SUBCATEGORIES = Object.fromEntries(
  Object.entries(CATEGORY_CHILDREN).filter(([head]) => head !== 'mode_a_trier')
);

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

// Métiers de services (annuaire de l'onglet Services + annonces near_you),
// eux aussi issus de la base.
export const SERVICE_CATEGORIES = SERVICE_HEADS.map((id) => ({ id }));

// Tous les ids de service: les têtes ET leurs sous-catégories (une annonce
// peut porter "reparation", enfant de "btp_bricolage").
const SERVICE_IDS = new Set(
  SERVICE_HEADS.flatMap((id) => [id, ...(CATEGORY_CHILDREN[id] ?? [])])
);

export function isServiceCategory(categoryId) {
  return SERVICE_IDS.has(categoryId);
}

// Une boutique est PRESTATAIRE dès qu'elle affiche au moins un métier de
// service. C'est ce qui décide de sa présence dans l'onglet Services: une
// boutique purement produit n'y a rien à faire (elle y apparaissait avant).
export function isServiceShop(shop) {
  return (shop?.categories ?? []).some(isServiceCategory);
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

// Un article se vend « sur demande » soit parce que sa CATÉGORIE l'impose
// (on n'achète pas un appartement au panier), soit parce que la vendeuse
// l'a décidé pour CET article — typiquement quand elle n'a pas encore fixé
// son prix. Un seul point de vérité: tout l'affichage acheteur passe par là.
export function isPriceOnRequest(product) {
  return !!product?.price_on_request || isQuoteOnly(product?.category);
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
