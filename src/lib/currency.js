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

// Default currency guessed from a country code (geo default).
export function currencyForCountry(countryCode) {
  const eur = ['FR', 'DE', 'ES', 'IT', 'BE', 'PT', 'NL', 'IE', 'GR', 'AT', 'FI'];
  const xof = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW', 'CM', 'GA', 'CG', 'TD', 'CF', 'GQ'];
  if (countryCode === 'GB') return 'GBP';
  if (countryCode === 'US') return 'USD';
  if (eur.includes(countryCode)) return 'EUR';
  if (xof.includes(countryCode)) return 'FCFA';
  return 'FCFA';
}

/** Convert an amount in FCFA to the target currency (number). */
export function convertFromFcfa(amountFcfa, currency) {
  const rate = RATES[currency] ?? 1;
  return (Number(amountFcfa) || 0) * rate;
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
