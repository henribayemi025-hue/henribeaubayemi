import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES, currencyForCountry } from '../lib/currency';
import { detectCountrySync, detectCurrencyRegionSync, countryFromPhone } from '../lib/countries';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const SettingsCtx = createContext(null);
const CUR_KEY = 'finjaro_currency';
const COUNTRY_KEY = 'finjaro_country';
// Marque un choix EXPLICITE de devise (Paramètres). Sans elle, impossible de
// distinguer « cette personne veut des FCFA » de « on n'a jamais rien su
// d'elle et FCFA était la valeur de repli » — c'est exactement cette
// confusion qui figeait toute l'app en FCFA.
const CUR_MANUAL_KEY = 'finjaro_currency_manual';

// Devise à afficher AVANT toute connaissance du profil: pays détecté, sinon
// région du fuseau, sinon FCFA. Calculée de façon synchrone pour que le tout
// premier rendu soit déjà juste — auparavant l'app peignait des FCFA puis se
// corrigeait, et sur les visites suivantes la valeur fautive, déjà mémorisée,
// ne se corrigeait plus jamais.
function initialCurrency(country) {
  const stored = localStorage.getItem(CUR_KEY);
  if (stored && CURRENCIES.includes(stored)) return stored;
  if (country) return currencyForCountry(country);
  // Dernier repli: le même que `currencyForCountry`, JAMAIS le FCFA en dur.
  // Supposer l'Afrique centrale pour quelqu'un dont on ne sait rien est
  // précisément ce que Beau a interdit — Finjaro est mondiale.
  return detectCurrencyRegionSync() || currencyForCountry(null);
}

function initialCountry() {
  return localStorage.getItem(COUNTRY_KEY) || detectCountrySync();
}

export function SettingsProvider({ children }) {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [country, setCountryState] = useState(initialCountry);
  const [currency, setCurrencyState] = useState(() => initialCurrency(initialCountry()));

  // Mémoriser ce qui vient d'être détecté, pour ne pas le recalculer à chaque
  // démarrage (et garder le même affichage si la personne voyage).
  useEffect(() => {
    if (country) localStorage.setItem(COUNTRY_KEY, country);
    if (currency) localStorage.setItem(CUR_KEY, currency);
  }, [country, currency]);

  // Préférences du compte connecté.
  //
  // On n'adopte la devise du profil QUE si elle a été choisie volontairement.
  // La colonne `profiles.currency` avait « FCFA » pour valeur par défaut en
  // base: tout compte naissait donc estampillé FCFA, et cette ligne écrasait
  // la détection à chaque connexion — une personne en Europe voyait ses prix
  // repasser en FCFA dès qu'elle se connectait. La migration 0037 remet cette
  // colonne à NULL par défaut; NULL signifie « jamais choisi », donc on laisse
  // la détection décider.
  useEffect(() => {
    if (!profile) return;
    if (profile.currency && CURRENCIES.includes(profile.currency)) {
      setCurrencyState(profile.currency);
    }
    if (profile.locale && profile.locale !== i18n.language) i18n.changeLanguage(profile.locale);
    if (profile.country) {
      setCountryState(profile.country);
      // La devise SUIT le pays du profil tant que personne ne l'a choisie
      // explicitement. Sans cette ligne, une valeur fautive mémorisée sur
      // l'appareil survivait à la correction du pays: on rectifiait « France »
      // en « Cameroun » dans les Réglages et les prix restaient en euros.
      const chosen = localStorage.getItem(CUR_MANUAL_KEY) === '1' || !!profile.currency;
      if (!chosen) {
        const fromCountry = currencyForCountry(profile.country);
        setCurrencyState(fromCountry);
        localStorage.setItem(CUR_KEY, fromCountry);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Premier enregistrement du pays/devise détectés sur un compte qui n'en a
  // pas encore — sinon la personne repart de zéro sur chaque appareil.
  useEffect(() => {
    if (!user || !profile || profile.country) return;
    // Le numéro du compte PRIME sur la détection: c'est un fait saisi par la
    // personne, là où le fuseau et la langue sont des indices faillibles.
    const detected = countryFromPhone(user.phone) || country || detectCountrySync();
    if (!detected) return;
    // On n'enregistre QUE le pays.
    //
    // Écrire aussi la devise transformait une simple détection en préférence
    // gravée dans le profil — impossible ensuite de distinguer « cette
    // personne veut des euros » de « on avait mal deviné ». C'est ce qui a
    // enfermé plusieurs comptes camerounais en euros: corriger son pays ne
    // suffisait pas, la devise fautive restait. Désormais `profiles.currency`
    // non nul signifie vraiment « choisie dans les Réglages ».
    const patch = { country: detected };
    // Synchro d'arrière-plan: le réglage est déjà dans localStorage, donc un
    // échec ne casse rien ici — il empêche seulement de le retrouver sur un
    // autre appareil. On le trace sans déranger l'utilisatrice.
    supabase.from('profiles').update(patch).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('[Settings] pays/devise non synchronisés:', error.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  // Même rattrapage pour la langue, sur un compte qui n'en porte aucune.
  //
  // L'inscription par e-mail ou par téléphone transmet la langue choisie dans
  // les métadonnées (voir useAuth), mais Google et Apple ne le peuvent pas: le
  // détour passe par LEUR site et rien de ce qui a été choisi ici ne fait le
  // voyage. Le profil revient donc sans langue — et c'est cette écriture qui
  // enregistre enfin le choix déjà fait sur l'écran d'inscription, pour qu'on
  // le retrouve sur un autre téléphone.
  useEffect(() => {
    if (!user || !profile || profile.locale) return;
    const lng = i18n.language?.startsWith('en') ? 'en' : 'fr';
    supabase.from('profiles').update({ locale: lng }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('[Settings] langue non synchronisée:', error.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const persist = useCallback(
    (patch) => {
      if (user) {
        supabase.from('profiles').update(patch).eq('id', user.id)
          .then(({ error }) => { if (error) console.error('[Settings] réglage non synchronisé:', error.message); });
      }
    },
    [user]
  );

  const setCurrency = useCallback(
    (cur) => {
      setCurrencyState(cur);
      localStorage.setItem(CUR_KEY, cur);
      localStorage.setItem(CUR_MANUAL_KEY, '1');
      persist({ currency: cur });
    },
    [persist]
  );

  const setLanguage = useCallback(
    (lng) => {
      i18n.changeLanguage(lng);
      persist({ locale: lng });
    },
    [i18n, persist]
  );

  const setCountry = useCallback(
    (code) => {
      setCountryState(code);
      localStorage.setItem(COUNTRY_KEY, code);
      // Changer de pays change la devise affichée — sauf si la personne en a
      // explicitement choisi une dans les Paramètres, auquel cas son choix
      // reste roi.
      if (!localStorage.getItem(CUR_MANUAL_KEY)) {
        const cur = currencyForCountry(code);
        setCurrencyState(cur);
        localStorage.setItem(CUR_KEY, cur);
      }
      // On n'écrit JAMAIS la devise déduite dans le profil: seule celle
      // choisie dans les Réglages y est enregistrée. Une devise deduite qui
      // s'y installe devient indiscernable d'un choix, et plus rien ne peut
      // la corriger — c'est ce qui a enfermé des comptes camerounais en euros.
      persist({ country: code });
    },
    [persist]
  );

  const value = {
    currency,
    setCurrency,
    country,
    setCountry,
    language: i18n.language?.startsWith('en') ? 'en' : 'fr',
    setLanguage,
  };
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
