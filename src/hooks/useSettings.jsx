import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES, currencyForCountry } from '../lib/currency';
import { detectCountry } from '../lib/countries';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const SettingsCtx = createContext(null);
const CUR_KEY = 'finjaro_currency';
const COUNTRY_KEY = 'finjaro_country';

export function SettingsProvider({ children }) {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [currency, setCurrencyState] = useState(() => localStorage.getItem(CUR_KEY) || 'FCFA');
  const [country, setCountryState] = useState(() => localStorage.getItem(COUNTRY_KEY) || null);

  // Geo default on first ever load (mockable IP geolocation).
  useEffect(() => {
    if (country) return;
    let active = true;
    detectCountry().then((code) => {
      if (!active || !code) return;
      setCountryState(code);
      localStorage.setItem(COUNTRY_KEY, code);
      if (!localStorage.getItem(CUR_KEY)) {
        const cur = currencyForCountry(code);
        setCurrencyState(cur);
        localStorage.setItem(CUR_KEY, cur);
      }
    });
    return () => {
      active = false;
    };
  }, [country]);

  // Adopt persisted preferences from the signed-in profile.
  useEffect(() => {
    if (!profile) return;
    if (profile.currency && CURRENCIES.includes(profile.currency)) {
      setCurrencyState(profile.currency);
      localStorage.setItem(CUR_KEY, profile.currency);
    }
    if (profile.locale && profile.locale !== i18n.language) i18n.changeLanguage(profile.locale);
    if (profile.country) {
      setCountryState(profile.country);
      localStorage.setItem(COUNTRY_KEY, profile.country);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

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
