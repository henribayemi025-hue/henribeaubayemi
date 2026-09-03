import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Restaure la position de défilement d'un conteneur (BuyerLayout <main>)
// quand on revient en arrière, et le remet à zéro pour une navigation neuve.
//
// Avant: le retour arrière du navigateur (bouton retour, geste iOS)
// débarquait toujours en haut de la page précédente. Sur une liste où on
// avait scrollé pour lire un article, il fallait re-scroller à la main —
// pénible sur mobile, cassant sur une longue liste.
//
// L'API `history.scrollRestoration = 'manual'` seule ne suffit pas: le
// scroll vit ici sur un `<main>` interne (l'app est un shell fixe), pas
// sur `document.documentElement`. On mémorise donc le top de CE conteneur
// par pathname au moment où on quitte la route, et on le restaure au
// prochain rendu quand navigationType === 'POP'.
const positions = new Map();

export function useScrollRestore(ref) {
  const { pathname, key } = useLocation();
  const navType = useNavigationType();
  // La clé de sauvegarde inclut le key React Router: deux visites successives
  // à /product/123 sont bien des entrées distinctes dans l'historique et
  // peuvent avoir été scrollées différemment.
  const saveKey = useRef(`${pathname}::${key}`);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Restauration OU reset selon le type de navigation.
    if (navType === 'POP') {
      const saved = positions.get(`${pathname}::${key}`);
      if (typeof saved === 'number') el.scrollTop = saved;
    } else {
      el.scrollTop = 0;
    }
    saveKey.current = `${pathname}::${key}`;

    // Au déchargement de cette route, on note la dernière position vue —
    // pas besoin de le refaire en continu, la sauvegarde à la sortie suffit.
    return () => {
      positions.set(saveKey.current, el.scrollTop);
      // On plafonne la Map pour ne pas grossir indéfiniment sur une session
      // longue: 50 dernières routes visitées, c'est largement plus qu'un
      // parcours normal.
      if (positions.size > 50) {
        const oldest = positions.keys().next().value;
        positions.delete(oldest);
      }
    };
  }, [pathname, key, navType, ref]);

  // Filet de secours: certains parcours (fermeture d'un modale, changement
  // de query string sans changement de pathname) ne déclenchent pas l'effet
  // ci-dessus mais bougent le scroll — on capture au scroll aussi, throttle
  // à ~200 ms pour ne pas s'écrire dans la Map à chaque pixel.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    let last = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - last < 200) return;
      last = now;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        positions.set(saveKey.current, el.scrollTop);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref]);
}
