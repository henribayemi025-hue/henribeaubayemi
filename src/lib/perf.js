import { track } from './track';

const LOGGED_KEY = 'finjaro-perf-logged';

// Mesure le VRAI temps de chargement du premier écran, une fois par onglet
// — pas une supposition. Beau: « le site prend trop de temps pour charger »,
// suivi d'une capture où les images ne s'affichaient pas. Sans mesure, on
// devine; avec elle, on saura si c'est le réseau, les images, ou autre
// chose, et depuis quelle ville/connexion.
//
// LCP (Largest Contentful Paint): l'instant où le plus gros élément visible
// (souvent la première image produit) apparaît réellement à l'écran — c'est
// la mesure qui correspond le mieux à "le site met du temps à s'afficher",
// bien plus que le simple chargement du HTML.
export function reportPageLoad() {
  try {
    if (sessionStorage.getItem(LOGGED_KEY)) return;
    sessionStorage.setItem(LOGGED_KEY, '1');
  } catch {
    /* stockage indisponible (navigation privée) — on mesure quand même */
  }

  let lcp = null;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) lcp = last.startTime;
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* LCP non supporté par ce navigateur (ex: anciens Safari) */
  }

  let envoye = false;
  function envoyer() {
    if (envoye) return;
    envoye = true;
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      // Les images passent par le proxy Cloudflare /img/... (même domaine):
      // leur durée est donc mesurable sans en-tête spécial.
      const images = performance.getEntriesByType('resource').filter((r) => r.name.includes('/img/'));
      const durees = images.map((r) => Math.round(r.duration)).filter((d) => d > 0);
      const conn = navigator.connection;
      track('perf_page_load', null, {
        chemin: location.pathname,
        ttfb_ms: nav ? Math.round(nav.responseStart) : null,
        dom_ms: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        charge_ms: nav ? Math.round(nav.loadEventEnd) : null,
        lcp_ms: lcp !== null ? Math.round(lcp) : null,
        nb_images: images.length,
        image_max_ms: durees.length ? Math.max(...durees) : null,
        image_moyenne_ms: durees.length ? Math.round(durees.reduce((a, b) => a + b, 0) / durees.length) : null,
        connexion: conn?.effectiveType || null,
        rtt_ms: conn?.rtt ?? null,
      });
    } catch {
      /* la mesure ne doit jamais casser la page */
    }
  }

  // Le LCP ne se "fige" qu'au premier signe d'interaction ou quand l'onglet
  // passe en arrière-plan — avant ça, un élément plus gros peut encore
  // apparaître. On attend l'un de ces trois signaux, avec un filet de
  // secours si la personne reste immobile sur l'écran.
  function onVisibility() {
    if (document.visibilityState === 'hidden') envoyer();
  }
  document.addEventListener('visibilitychange', onVisibility);
  ['keydown', 'click', 'scroll', 'touchstart'].forEach((ev) =>
    document.addEventListener(ev, envoyer, { once: true, passive: true })
  );
  setTimeout(envoyer, 15000);
}
