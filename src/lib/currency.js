// Les monnaies. Les prix sont stockés en FCFA entiers (`price_fcfa`) : c'est
// un détail de stockage, jamais une préférence d'affichage (CLAUDE.md §1).
//
// Beau, 23/09 : « chacun doit voir les prix dans SA monnaie — FCFA, euro,
// livre, dollar américain, dollar canadien, rouble… — et pouvoir la changer ».
// Avant, Finjaro n'en connaissait que quatre, avec des taux écrits à la main
// (celui du dollar était décalé d'environ 5 %), et bien des pays recevaient
// la monnaie d'un autre : le Canada voyait des dollars américains.
//
// Désormais :
//   - toutes les monnaies qui ont un taux (166 au 23/09), la monnaie de chaque
//     pays et le pays de chaque fuseau horaire viennent de sources publiques
//     (monnaies-donnees.js, régénéré par scripts/generer-monnaies.mjs) ;
//   - les taux sont ceux DU JOUR : la base les reprend chaque nuit
//     (taux_du_jour, 0181) et l'application les charge au démarrage. Un taux
//     par jour suffit pour afficher un prix ; le temps réel ferait bouger les
//     prix sous les yeux de l'acheteur ;
//   - le franc CFA garde sa parité fixe : 655,957 FCFA pour 1 euro.

import { PAYS_MONNAIE, FUSEAU_PAYS, TAUX_SECOURS, TAUX_SECOURS_DATE } from './monnaies-donnees';

const FCFA_PAR_EURO = 655.957;
// Liées à l'euro par une parité fixe : leur montant en FCFA ne bouge jamais.
export const MONNAIES_ARRIMEES = ['FCFA', 'EUR', 'XAF', 'XOF'];

// Unités de chaque monnaie pour 1 euro.
let parEuro = { ...TAUX_SECOURS, FCFA: FCFA_PAR_EURO, EUR: 1 };
let dateTaux = TAUX_SECOURS_DATE;

const CLE_TAUX = 'finjaro_taux';
try {
  const c = JSON.parse(localStorage.getItem(CLE_TAUX) || 'null');
  if (c?.date && c.date > dateTaux && c.par_euro) {
    parEuro = { ...parEuro, ...c.par_euro, FCFA: FCFA_PAR_EURO, EUR: 1 };
    dateTaux = c.date;
  }
} catch { /* navigation privée, ou pas de navigateur (tests) */ }

/** Prend les taux du jour lus dans la base (lignes { code, par_euro, maj }). */
export function appliquerTaux(lignes) {
  if (!Array.isArray(lignes) || !lignes.length) return false;
  const nouveaux = {};
  let date = '';
  for (const l of lignes) {
    const v = Number(l.par_euro);
    if (/^[A-Z]{3,4}$/.test(l.code) && v > 0) nouveaux[l.code] = v;
    if (l.maj && String(l.maj).slice(0, 10) > date) date = String(l.maj).slice(0, 10);
  }
  parEuro = { ...parEuro, ...nouveaux, FCFA: FCFA_PAR_EURO, EUR: 1 };
  if (date) dateTaux = date;
  try { localStorage.setItem(CLE_TAUX, JSON.stringify({ date: dateTaux, par_euro: nouveaux })); } catch { /* rien */ }
  return true;
}

/** La date des taux utilisés (AAAA-MM-JJ). */
export function dateDesTaux() {
  return dateTaux;
}

// Toutes les monnaies proposées : celles qui ont un taux, le franc CFA une
// seule fois (XAF et XOF s'affichent « FCFA »).
export const CURRENCIES = ['FCFA', ...Object.keys(TAUX_SECOURS).filter((c) => c !== 'XAF' && c !== 'XOF' && c !== 'EUR'), 'EUR'].sort((a, b) => a.localeCompare(b));

export function estMonnaie(code) {
  return !!code && (code === 'FCFA' || (code !== 'XAF' && code !== 'XOF' && !!parEuro[code]));
}

// Repli quand le pays est inconnu : surtout PAS le franc CFA (Beau, 10/08 :
// « je ne veux plus jamais entendre ça »). Le dollar est la monnaie la plus
// largement lisible — un aveu d'ignorance, pas une supposition sur l'endroit
// où vit la personne.
const FALLBACK_CURRENCY = 'USD';

export function currencyForCountry(countryCode) {
  if (!countryCode) return FALLBACK_CURRENCY;
  return PAYS_MONNAIE[String(countryCode).toUpperCase()] || FALLBACK_CURRENCY;
}

/** Le pays d'un fuseau horaire (« Africa/Douala » → « CM »), ou null. */
export function paysDuFuseau(fuseau) {
  return (fuseau && FUSEAU_PAYS[fuseau]) || null;
}

/** Convertit un montant en FCFA vers la monnaie demandée (nombre). */
export function convertFromFcfa(amountFcfa, currency) {
  const taux = parEuro[currency];
  if (!taux) return Number(amountFcfa) || 0;
  return ((Number(amountFcfa) || 0) * taux) / FCFA_PAR_EURO;
}

/** Ramène un montant exprimé en `currency` en FCFA entiers (stockage). */
export function toFcfa(amount, currency) {
  const taux = parEuro[currency];
  if (!taux) return Math.round(Number(amount) || 0);
  return Math.round(((Number(amount) || 0) * FCFA_PAR_EURO) / taux);
}

const LOCALES = { fr: 'fr-FR', en: 'en-US' };

/** Un montant stocké en FCFA, écrit dans la monnaie demandée. */
export function formatPrice(amountFcfa, currency = 'FCFA', locale = 'fr') {
  const value = convertFromFcfa(amountFcfa, currency);
  const loc = LOCALES[locale] || LOCALES.fr;
  if (currency === 'FCFA') {
    return `${new Intl.NumberFormat(loc).format(Math.round(value))} FCFA`;
  }
  try {
    // Le nombre de décimales est celui de la monnaie : 2 pour l'euro,
    // aucune pour le yen. Au-delà de 10 000, les centimes n'aident personne.
    const options = { style: 'currency', currency };
    if (Math.abs(value) >= 10000) options.maximumFractionDigits = 0;
    return new Intl.NumberFormat(loc, options).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Le nom d'une monnaie dans la langue de l'écran (« dollar canadien »). */
export function nomMonnaie(code, locale = 'fr') {
  if (code === 'FCFA') return locale === 'en' ? 'CFA franc' : 'franc CFA';
  try {
    const n = new Intl.DisplayNames([LOCALES[locale] || LOCALES.fr], { type: 'currency' }).of(code);
    return n && n !== code ? n : code;
  } catch {
    return code;
  }
}

export function currencySymbol(currency) {
  if (currency === 'FCFA') return 'FCFA';
  try {
    const p = new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).formatToParts(0).find((x) => x.type === 'currency');
    return p?.value || currency;
  } catch {
    return currency;
  }
}
