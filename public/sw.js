/* Finjaro service worker — auto-update + Web Push.
 *
 * Goal: the user NEVER has to delete/reinstall the app to get a new version.
 * - install: activate immediately (skipWaiting)
 * - activate: take control of open pages (clients.claim) + drop old caches
 * - fetch: network-first for page navigations, so each launch loads the fresh
 *   index.html (and therefore the fresh, content-hashed JS). Falls back to the
 *   last cached shell only when offline.
 */
// v3: la v2 pouvait contenir autre chose que la coque de l'application (voir
// le gestionnaire `fetch`). Changer le nom jette l'ancien cache au lieu de
// traîner une entrée douteuse chez les gens qui ont déjà l'application.
const SHELL_CACHE = 'finjaro-shell-v3';

// Adresses servies par le worker Cloudflare, PAS par l'application: le plan du
// site, le fichier des robots, le manifeste. Elles ne doivent jamais être
// détournées vers index.html.
const HORS_APPLICATION = /^\/(sitemap\.xml|robots\.txt|manifest\.webmanifest|sw\.js|img\/)/;

self.addEventListener('install', () => {
  self.skipWaiting();
});

// Let a page ask a waiting worker to activate now (belt-and-suspenders on top
// of install-time skipWaiting): postMessage({ type: 'SKIP_WAITING' }).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only manage top-level navigations; content-hashed assets and API calls
  // are left to the browser (assets are immutable, so they're safe to cache).
  if (req.mode !== 'navigate') return;

  // Beau (15/09): il ouvre finjaro.net/sitemap.xml et l'ACCUEIL s'affiche,
  // alors que l'adresse dans la barre dit bien sitemap.xml. Deux défauts se
  // cumulaient ici.
  //
  // 1. Ce gestionnaire prenait TOUTE navigation, y compris les adresses qui
  //    ne sont pas des pages de l'application — le plan du site, le fichier
  //    des robots. Au moindre échec réseau, il rendait la coque de
  //    l'application à leur place, et le routeur, ne connaissant pas
  //    l'adresse, affichait l'accueil.
  //
  // 2. Plus grave: la réponse était mise en cache SOUS LE NOM index.html,
  //    quelle qu'elle soit. Naviguer une seule fois vers /sitemap.xml
  //    enregistrait donc du XML comme coque de l'application — et au
  //    prochain lancement hors ligne, l'application affichait du XML brut.
  //    Personne ne l'avait vu parce qu'il fallait justement ouvrir une de ces
  //    adresses à la main.
  const chemin = new URL(req.url).pathname;
  if (HORS_APPLICATION.test(chemin)) return; // laissé au navigateur

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        // On ne garde que du HTML: c'est la coque de l'application, pas
        // n'importe quelle réponse qui passe par là.
        const type = fresh.headers.get('Content-Type') || '';
        if (fresh.ok && type.includes('text/html')) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put('/index.html', fresh.clone());
        }
        return fresh;
      } catch {
        return (await caches.match('/index.html')) || Response.error();
      }
    })()
  );
});

/* ---- Web Push ---- */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'Finjaro', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'Finjaro';
  const options = {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: payload.url || '/' },
    tag: payload.tag || undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
