import { useEffect, useState, useCallback, useRef } from 'react';

// Standardizes the loading/success/error lifecycle + a retry() for every
// data-driven screen. `fn` should return data or throw.
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (mounted.current) setData(result);
    } catch (e) {
      if (mounted.current) setError(e?.message || 'error');
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
  }, [run]);

  return { data, loading, error, retry: run, setData };
}
