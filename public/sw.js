/* Finjaro service worker — auto-update + Web Push.
 *
 * Goal: the user NEVER has to delete/reinstall the app to get a new version.
 * - install: activate immediately (skipWaiting)
 * - activate: take control of open pages (clients.claim) + drop old caches
 * - fetch: network-first for page navigations, so each launch loads the fresh
 *   index.html (and therefore the fresh, content-hashed JS). Falls back to the
 *   last cached shell only when offline.
 */
const SHELL_CACHE = 'finjaro-shell-v2';

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
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('/index.html', fresh.clone());
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
