import { PRODUCT_HEADS } from './categoryTree';

// Adaptation du catalogue par zone géographique (étape 4 du pivot).
// Réutilise la détection de pays déjà en place pour les devises
// (useSettings().country ← lib/countries.detectCountry): aucun nouvel appel
// réseau, aucune permission — juste une lecture différente du même signal.

// Pays africains présents dans COUNTRIES (lib/countries.js).
const AFRICA = new Set([
  'ZA', 'DZ', 'AO', 'BJ', 'BF', 'BI', 'CM', 'CF', 'KM', 'CG', 'CD', 'CI',
  'EG', 'ET', 'GA', 'GM', 'GH', 'GN', 'GQ', 'GW', 'KE', 'LR', 'LY', 'MG',
  'ML', 'MA', 'MR', 'MU', 'MZ', 'NE', 'NG', 'RW', 'SN', 'SL', 'TZ', 'TD',
  'TG', 'TN', 'UG', 'ZM', 'ZW',
]);

// 'africa' | 'diaspora'. Pays inconnu (détection échouée): 'africa' — le
// marché principal, et l'ordre par défaut le plus proche de l'existant.
export function regionForCountry(country) {
  if (!country) return 'africa';
  return AFRICA.has(country) ? 'africa' : 'diaspora';
}

// Ordre des catégories mises en avant selon la zone. Même liste (rien n'est
// caché — on ne prive personne d'une catégorie), seule la PRIORITÉ change:
//   - Afrique: quotidien d'abord (mode, alimentaire, high-tech, véhicules).
//   - Diaspora: cadeaux/envoi au pays et évènementiel remontent.
// Structure prête pour le catalogue "mis en avant" — les écrans consomment
// featuredCategoryOrder() sans connaître la règle.
// ATTENTION: tout rayon absent de ces listes se retrouvait relégué en fin de
// bandeau — c'est ce qui a rendu Sport, Musique, Électroménager… invisibles
// alors qu'ils étaient bien créés. Les listes doivent donc couvrir TOUS les
// rayons; le garde-fou ci-dessous ajoute automatiquement ceux qu'on
// oublierait après une future migration, plutôt que de les enterrer.
const ORDER = {
  africa: [
    'mode_femme', 'mode_homme', 'mode_a_trier', 'enfants_bebe',
    'hightech', 'alimentaire', 'beaute_cosmetiques', 'bijoux_montres',
    'electromenager', 'sport_loisirs', 'jus_naturels', 'maison_deco',
    'musique', 'seconde_main', 'vehicules', 'evenementiel_mariages',
    'sante_bienetre', 'livres_papeterie', 'jardin_exterieur', 'animaux',
    'immobilier_vente',
  ],
  diaspora: [
    'mode_femme', 'beaute_cosmetiques', 'bijoux_montres', 'evenementiel_mariages',
    'mode_homme', 'mode_a_trier', 'enfants_bebe', 'maison_deco',
    'hightech', 'sport_loisirs', 'alimentaire', 'musique',
    'seconde_main', 'electromenager', 'jus_naturels', 'sante_bienetre',
    'livres_papeterie', 'jardin_exterieur', 'animaux', 'vehicules',
    'immobilier_vente',
  ],
};

export function featuredCategoryOrder(country) {
  const base = ORDER[regionForCountry(country)];
  // Filet: un rayon ajouté en base mais oublié ici passe juste après les
  // rayons ordonnés, au lieu de disparaître au bout du défilement.
  const missing = PRODUCT_HEADS.filter((id) => !base.includes(id));
  return [...base, ...missing];
}
