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

// Numéro au format attendu par wa.me: uniquement des chiffres, indicatif
// compris. Trouvé le 28/09 en préparant une relance à la main: le bouton
// WhatsApp de la Console faisait `wa.me/691024291` pour une boutique de
// Yaoundé — un lien mort, puisqu'il manquait le +237. Toutes les boutiques
// sont concernées: le champ WhatsApp est saisi en format local.
//
// Le pays de la boutique prime sur ce que le numéro semble dire: un mobile
// camerounais « 61… » commence par l'indicatif australien, et le deviner
// enverrait le message à l'autre bout du monde. On ne devine qu'en dernier
// recours, et on préfère ne rien afficher plutôt qu'un lien mort.
import { countryFromPhone, dialForCountry } from './countries';

export function whatsappNumber(phone, country) {
  const brut = String(phone || '').trim();
  const digits = brut.replace(/\D/g, '');
  if (!digits) return null;
  if (brut.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  const dial = dialForCountry(country);
  if (dial) {
    // Déjà préfixé à la main par la vendeuse ? On ne le met pas deux fois.
    if (digits.startsWith(dial) && digits.length > dial.length + 5) return digits;
    return `${dial}${digits.replace(/^0+/, '')}`;
  }
  return countryFromPhone(digits) ? digits : null;
}

// Lien WhatsApp avec le message déjà écrit. `null` si on ne sait pas composer
// un numéro sûr: mieux vaut pas de bouton qu'un bouton qui ne s'ouvre pas.
export function whatsappLink(phone, country, message) {
  const num = whatsappNumber(phone, country);
  if (!num) return null;
  return message ? `https://wa.me/${num}?text=${encodeURIComponent(message)}` : `https://wa.me/${num}`;
}
