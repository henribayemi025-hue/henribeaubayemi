import { useEffect, useState, useCallback, useRef } from 'react';
import { dedupe, getCached, setCached, subscribe } from '../lib/queryCache';

// Standardizes the loading/success/error lifecycle + a retry() for every
// data-driven screen. `fn` should return data or throw.
//
// `options.cacheKey` (facultatif): active le cache mémoire lu dans
// lib/queryCache.js. En stale-while-revalidate: si une valeur est déjà en
// cache, on la rend immédiatement (loading=false), tout en relançant `fn` en
// tâche de fond pour rafraîchir. Sans cacheKey, comportement inchangé (fetch
// à chaque montée du composant) — les 20+ appelants existants ne bougent pas.
//
// Le retour arrière du navigateur, qui remontait ces composants depuis zéro,
// devient instantané pour toute page dont la clé est encore dans le cache.
export function useAsync(fn, deps = [], options = {}) {
  const { cacheKey, ttlMs } = options;

  const cached = cacheKey ? getCached(cacheKey) : { hit: false };
  const [data, setData] = useState(cached.hit ? cached.data : null);
  const [loading, setLoading] = useState(!cached.hit);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = cacheKey ? await dedupe(cacheKey, fn) : await fn();
      if (mounted.current) setData(result);
      if (cacheKey) setCached(cacheKey, result, ttlMs);
    } catch (e) {
      if (mounted.current) setError(e?.message || 'error');
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    // Cache tiède: on a déjà rendu la valeur cachée dans le state initial;
    // on relance quand même en tâche de fond pour rafraîchir (stale-while-
    // revalidate). Si le cache était froid, on charge normalement.
    if (cached.hit) run({ silent: true });
    else run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  // S'abonner aux invalidations extérieures (voir queryCache.invalidate):
  // après qu'un vendeur ait publié un article, la liste correspondante est
  // vidée du cache — on veut alors se re-fetcher au lieu de rester coincé
  // sur l'ancienne valeur.
  useEffect(() => {
    if (!cacheKey) return undefined;
    return subscribe(cacheKey, () => {
      const fresh = getCached(cacheKey);
      if (!fresh.hit) run();
    });
  }, [cacheKey, run]);

  return { data, loading, error, retry: run, setData };
}
