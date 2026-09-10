// Exemple de numéro à montrer dans un champ téléphone, selon le pays de la
// personne. Avant: « +237 6XX XXX XXX » en dur — un indicatif camerounais
// dans une place de marché mondiale (CLAUDE.md §1). Pays inconnu: on
// n'invente pas d'indicatif.
const EXEMPLES = {
  CM: '+237 6XX XXX XXX',
  FR: '+33 6 XX XX XX XX',
  BE: '+32 4XX XX XX XX',
  CH: '+41 7X XXX XX XX',
  DE: '+49 15X XXXXXXX',
  GB: '+44 7XXX XXXXXX',
  US: '+1 XXX XXX XXXX',
  CA: '+1 XXX XXX XXXX',
  CI: '+225 XX XX XX XX XX',
  SN: '+221 7X XXX XX XX',
  GA: '+241 XX XX XX XX',
  NG: '+234 XXX XXX XXXX',
  GH: '+233 XX XXX XXXX',
  CD: '+243 XXX XXX XXX',
  MA: '+212 6XX XXX XXX',
  TD: '+235 XX XX XX XX',
  CG: '+242 0X XXX XXXX',
};

export function phoneExample(country) {
  return EXEMPLES[(country || '').toUpperCase()] || '+…';
}
