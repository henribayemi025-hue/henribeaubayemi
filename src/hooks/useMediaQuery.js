import { useState, useEffect } from 'react';

// Média-query en JS plutôt qu'en CSS (`hidden lg:block`) quand les deux
// variantes contiendraient le MÊME composant qui charge des données: avec
// deux branches CSS, la liste des conversations serait montée deux fois et
// ferait deux fois la requête. Ici une seule branche existe à la fois.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
