import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES, currencyForCountry } from '../lib/currency';
import { detectCountrySync, detectCurrencyRegionSync } from '../lib/countries';
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
  return detectCurrencyRegionSync() || 'FCFA';
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
    if (profile.country) setCountryState(profile.country);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Premier enregistrement du pays/devise détectés sur un compte qui n'en a
  // pas encore — sinon la personne repart de zéro sur chaque appareil.
  useEffect(() => {
    if (!user || !profile || profile.country) return;
    const detected = country || detectCountrySync();
    if (!detected) return;
    const patch = { country: detected };
    if (!profile.currency) patch.currency = currencyForCountry(detected);
    supabase.from('profiles').update(patch).eq('id', user.id).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const persist = useCallback(
    (patch) => {
      if (user) supabase.from('profiles').update(patch).eq('id', user.id).then(() => {});
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
        persist({ country: code, currency: cur });
      } else {
        persist({ country: code });
      }
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
