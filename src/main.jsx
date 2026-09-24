import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/i18n';
import './styles/global.css';
import App from './App';
import { prefetchHome } from './lib/homeCache';
import { rechargerDepuisLeDisque } from './lib/queryCache';
import { track } from './lib/track';
import { reportPageLoad } from './lib/perf';
import { creerGardienRechargement } from './lib/swUpdate';

// Kick off Home's data request the instant the app boots — before routing,
// before auth resolves, before Home's own (lazy-loaded) code has even
// downloaded. Home is the index route and the most common landing screen, so
// by the time the user actually sees it, the network round-trip is often
// already done instead of only starting once Home's chunk mounts.
//
// Sauf sur les adresses qu'on ENVOIE à quelqu'un — la démonstration, les CGU,
// la page de suppression de compte… Trouvé en pilotant /demo au navigateur:
// on y tirait tout le fil d'accueil et la bande des boutiques, que la page
// n'affiche jamais. Pour une prestataire à qui on répond « regardez la
// démonstration », c'est du temps de chargement pris sur la seule chose qu'on
// voulait lui montrer — et sur un forfait qu'elle paie.
//
// La liste reste courte et locale à ce fichier: l'accueil, lui, ne perd rien.
const SANS_ACCUEIL = ['/demo', '/legal', '/suppression-compte', '/a-propos'];
if (!SANS_ACCUEIL.some((p) => window.location.pathname.startsWith(p))) {
  prefetchHome();
}

// One "visit" per browser tab session (not every reload) — feeds the admin
// dashboard's visits count. Fire-and-forget, never blocks boot.
try {
  if (!sessionStorage.getItem('finjaro-visit-logged')) {
    sessionStorage.setItem('finjaro-visit-logged', '1');
    track('visit');
  }
} catch {
  /* sessionStorage unavailable (private mode) — skip, non-critical */
}

// Beau: « le site prend trop de temps pour charger » — mesure du VRAI
// temps de premier affichage (LCP) et des images, au lieu de deviner.
reportPageLoad();

// Register the service worker (auto-update + Web Push). The user should never
// have to delete/reinstall the app to get a new version. We check for updates
// whenever the app regains focus; when a NEW worker takes control (i.e. a real
// update, not the first install) we reload once so the fresh build takes over.
if ('serviceWorker' in navigator) {
  const controlledAtLoad = !!navigator.serviceWorker.controller;
  const gardien = creerGardienRechargement();
  gardien.ecouter(window);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Ignore the very first install's claim (nothing to refresh into yet).
    if (!controlledAtLoad || refreshing) return;
    // Personne n'a encore touché l'écran: le rechargement est invisible.
    // Sinon, ON NE RECHARGE PAS — voir lib/swUpdate.js pour les deux pannes
    // (connexion coupée en plein envoi, Finia tué au retour de la photo)
    // que le rechargement immédiat a réellement causées le 27/08.
    if (!gardien.peutRecharger()) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        const check = () => reg.update().catch(() => {});
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
        setInterval(check, 60 * 1000);
      })
      .catch(() => {});
  });
}

// Relire le cache du disque AVANT le premier rendu.
//
// C'est la condition pour que l'application serve à quelque chose sans
// réseau: un écran décide d'afficher une valeur cachée au moment où il se
// monte, donc si le disque arrive après, il arrive trop tard et on voit un
// écran vide.
//
// Mais on ne fait pas attendre l'affichage pour autant: 400 ms au maximum,
// et on démarre. Une lecture d'IndexedDB prend quelques millisecondes; ce
// délai n'existe que pour les cas où le stockage traîne ou ne répond jamais
// (Firefox en navigation privée). Mieux vaut une application qui démarre
// sans son cache qu'une application qui ne démarre pas.
// Après une mise en ligne, un onglet resté ouvert réclame des morceaux de
// l'ancienne version qui n'existent plus : l'écran restait BLANC (Beau, 25/09,
// en ouvrant un fichier dans l'atelier). On recharge alors la page une fois,
// pour prendre la nouvelle version.
window.addEventListener('vite:preloadError', (ev) => {
  let deja = false;
  try { deja = sessionStorage.getItem('finjaro:recharge-version') === '1'; sessionStorage.setItem('finjaro:recharge-version', '1'); } catch { /* stockage bloqué */ }
  if (deja) return;
  ev.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => { setTimeout(() => { try { sessionStorage.removeItem('finjaro:recharge-version'); } catch { /* rien */ } }, 10_000); });

function demarrer() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

Promise.race([
  rechargerDepuisLeDisque(),
  new Promise((r) => setTimeout(r, 400)),
]).then(demarrer, demarrer);

// Clear the stale-chunk reload guard (see App.jsx lazyWithReload) once the app
// has been up a few seconds — so if the tab is left open across a LATER
// deploy, the auto-reload safety net is armed again instead of firing at most
// once ever per tab.
setTimeout(() => {
  try {
    sessionStorage.removeItem('finjaro-chunk-reload');
  } catch {
    /* sessionStorage unavailable (private mode) — safe to ignore */
  }
}, 15000);
