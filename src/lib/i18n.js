import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from '../locales/fr/translation.json';

// L'anglais n'est téléchargé que pour qui l'a choisi (audit M-13 : les deux
// langues pesaient ≈ 125 ko compressés à chaque première visite, alors que le
// français est la langue par défaut).
const chargeurs = { en: () => import('../locales/en/translation.json') };
async function assurerLangue(lng) {
  const code = String(lng || 'fr').slice(0, 2);
  if (!chargeurs[code] || i18n.hasResourceBundle(code, 'translation')) return;
  const m = await chargeurs[code]();
  i18n.addResourceBundle(code, 'translation', m.default || m, true, true);
}
const changerLangue = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = async (lng, ...reste) => {
  await assurerLangue(lng).catch(() => { /* hors ligne : on reste en français */ });
  return changerLangue(lng, ...reste);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
    },
    partialBundledLanguages: true,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    // Ramène TOUJOURS 'fr-FR'/'en-US' à 'fr'/'en'. Sans ça, i18n.language
    // pouvait valoir 'fr-FR', et la douzaine d'endroits qui testent
    // `locale === 'fr'` (dates, heures, noms de pays, format des prix)
    // basculaient silencieusement en anglais pour une utilisatrice
    // française — exactement le "j'ai choisi français, j'ai des champs en
    // anglais" signalé par Beau.
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      // Le français est la langue du produit (marché francophone). On ne
      // suit PLUS la langue du navigateur: un téléphone réglé en anglais
      // affichait l'app en anglais alors que personne ne l'avait demandé.
      // L'anglais reste à un tap dans Profil > Paramètres, et ce choix est
      // mémorisé ici.
      order: ['localStorage'],
      lookupLocalStorage: 'finjaro_lang',
      caches: ['localStorage'],
    },
  });

// Langue mémorisée autre que le français : on télécharge ses textes, puis on
// réapplique la langue pour que l'écran se redessine avec.
function chargerLangueMemorisee() {
  if (i18n.language && !i18n.language.startsWith('fr')) i18n.changeLanguage(i18n.language);
}
if (i18n.isInitialized) chargerLangueMemorisee();
else i18n.on('initialized', chargerLangueMemorisee);

// Keep <html lang> in sync for a11y + correct number formatting hints.
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

export default i18n;
