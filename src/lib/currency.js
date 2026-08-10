// Currency handling. Prices are stored canonically in FCFA (XOF/XAF) integers
// in the DB (produits.prix_fcfa style). Rates are a static Phase-1 table,
// structured so a live rate API can replace `RATES` later without touching UI.

export const CURRENCIES = ['FCFA', 'EUR', 'USD', 'GBP'];

// 1 FCFA = X target currency. Mocked static rates (swap for a live feed later).
export const RATES = {
  FCFA: 1,
  EUR: 0.001524, // ~655.957 FCFA per EUR
  USD: 0.00165,
  GBP: 0.0013,
};

const SYMBOLS = { FCFA: 'FCFA', EUR: '€', USD: '$', GBP: '£' };

// Devise d'un pays.
//
// Beau, 10/08: « quelqu'un en Angleterre, ça signale en monnaie d'Angleterre;
// quelqu'un au Cameroun, les prix du Cameroun. Un prix par défaut en FCFA
// comme tu faisais, je ne veux plus jamais entendre ça. »
//
// Finjaro est une place de marché MONDIALE — le Cameroun est la stratégie de
// démarrage, pas l'identité du produit. L'ancienne table connaissait dix-sept
// pays et renvoyait FCFA pour tout le reste: quelqu'un au Canada, au Japon ou
// au Nigeria voyait donc des francs CFA sans jamais avoir rien demandé.
//
// La table ci-dessous couvre le monde; le repli, lui, ne suppose plus rien.
const COUNTRY_CURRENCY = {
  // Zone euro
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', BE: 'EUR', PT: 'EUR', NL: 'EUR',
  IE: 'EUR', GR: 'EUR', AT: 'EUR', FI: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR',
  EE: 'EUR', LV: 'EUR', LT: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
  // Francs CFA — XOF (Afrique de l'Ouest) et XAF (Afrique centrale). Même
  // parité fixe à l'euro, donc même affichage « FCFA » pour l'instant.
  CI: 'FCFA', SN: 'FCFA', ML: 'FCFA', BF: 'FCFA', BJ: 'FCFA', TG: 'FCFA',
  NE: 'FCFA', GW: 'FCFA', CM: 'FCFA', GA: 'FCFA', CG: 'FCFA', TD: 'FCFA',
  CF: 'FCFA', GQ: 'FCFA',
  // Livre sterling et dollar américain
  GB: 'GBP', US: 'USD',
  // Pays qui alignent leur monnaie sur le dollar américain, ou dont la
  // devise n'est pas encore gérée: le dollar reste bien plus proche du vrai
  // prix que le franc CFA.
  CA: 'USD', AU: 'USD', NZ: 'USD', CH: 'EUR', NO: 'EUR', SE: 'EUR', DK: 'EUR',
  PL: 'EUR', CZ: 'EUR', RO: 'EUR', BG: 'EUR', HU: 'EUR',
  NG: 'USD', GH: 'USD', KE: 'USD', ZA: 'USD', EG: 'USD', MA: 'EUR', TN: 'EUR',
  DZ: 'EUR', CD: 'USD', AO: 'USD', RW: 'USD', TZ: 'USD', UG: 'USD', ET: 'USD',
  AE: 'USD', SA: 'USD', QA: 'USD', TR: 'EUR', IN: 'USD', CN: 'USD', JP: 'USD',
  BR: 'USD', MX: 'USD', AR: 'USD', RU: 'EUR',
};

// Repli quand le pays est inconnu.
//
// Surtout PAS le FCFA: supposer l'Afrique centrale pour qui n'a rien dit,
// c'est exactement la faute que ce fichier corrige. Le dollar est la monnaie
// la plus universellement lisible — et c'est un aveu d'ignorance honnête,
// pas une supposition sur l'endroit où vit la personne.
const FALLBACK_CURRENCY = 'USD';

export function currencyForCountry(countryCode) {
  if (!countryCode) return FALLBACK_CURRENCY;
  return COUNTRY_CURRENCY[String(countryCode).toUpperCase()] || FALLBACK_CURRENCY;
}

/** Convert an amount in FCFA to the target currency (number). */
export function convertFromFcfa(amountFcfa, currency) {
  const rate = RATES[currency] ?? 1;
  return (Number(amountFcfa) || 0) * rate;
}

/** Convert an amount expressed in `currency` back into canonical FCFA (integer). */
export function toFcfa(amount, currency) {
  const rate = RATES[currency] ?? 1;
  return Math.round((Number(amount) || 0) / rate);
}

/** Format an FCFA amount into a localized currency string for display. */
export function formatPrice(amountFcfa, currency = 'FCFA', locale = 'fr') {
  const value = convertFromFcfa(amountFcfa, currency);
  if (currency === 'FCFA') {
    const rounded = Math.round(value);
    return `${new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(rounded)} FCFA`;
  }
  try {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${SYMBOLS[currency] || ''}${value.toFixed(2)}`;
  }
}

export function currencySymbol(currency) {
  return SYMBOLS[currency] || currency;
}
