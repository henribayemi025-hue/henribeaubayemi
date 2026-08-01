import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import fr from '../locales/fr/translation.json';
import en from '../locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
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

// Keep <html lang> in sync for a11y + correct number formatting hints.
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

export default i18n;
