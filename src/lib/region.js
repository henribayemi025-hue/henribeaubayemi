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
const ORDER = {
  africa: [
    'mode_femme', 'mode_homme', 'enfants_bebe', 'hightech', 'alimentaire',
    'beaute_cosmetiques', 'bijoux_montres', 'jus_naturels', 'maison_deco',
    'seconde_main', 'vehicules', 'evenementiel_mariages', 'immobilier_vente',
  ],
  diaspora: [
    'mode_femme', 'beaute_cosmetiques', 'bijoux_montres', 'evenementiel_mariages',
    'mode_homme', 'enfants_bebe', 'maison_deco', 'hightech', 'alimentaire',
    'jus_naturels', 'seconde_main', 'vehicules', 'immobilier_vente',
  ],
};

export function featuredCategoryOrder(country) {
  return ORDER[regionForCountry(country)];
}
