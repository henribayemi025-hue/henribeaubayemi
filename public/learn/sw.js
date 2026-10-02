/* Finjaro Learn — mode hors-ligne.
   - Pages : réseau d'abord, copie en cache en secours (on voit toujours la dernière version quand on est en ligne).
   - Fichiers de l'appli (noms avec empreinte) et Python (Pyodide, version figée) : cache d'abord.
   - Tout le reste (connexion, base, fonctions IA) : jamais mis en cache, toujours le réseau. */
// Un cache par version publiée (sw.js?v=<empreinte>) : à l'activation, les fichiers des versions précédentes sont purgés.
const CACHE = 'learn-' + (new URL(self.location.href).searchParams.get('v') || 'dev')
const SCOPE = new URL(self.registration.scope).pathname // ex. /learn/
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SCOPE)).catch(() => {}).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('learn-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

const cacheFirst = async (req) => {
  const c = await caches.open(CACHE)
  const hit = await c.match(req)
  if (hit) return hit
  const res = await fetch(req)
  // Réponse « opaque » (script chargé sans CORS, ex. importScripts de Pyodide) : gardée SEULEMENT pour les fichiers Pyodide,
  // dont l'adresse est figée par version ; jamais pour le reste, car une réponse opaque peut cacher un échec.
  if (res.ok || (res.type === 'opaque' && req.url.startsWith(PYODIDE))) c.put(req, res.clone())
  return res
}

const networkFirst = async (req) => {
  const c = await caches.open(CACHE)
  try {
    const res = await fetch(req)
    if (res.ok) c.put(SCOPE, res.clone())
    return res
  } catch {
    return (await c.match(SCOPE)) || Response.error()
  }
}

// La lettre change chaque jour : réseau d'abord, dernière copie lue en secours hors ligne.
const reseauDabord = async (req) => {
  const c = await caches.open(CACHE)
  try {
    const res = await fetch(req)
    if (res.ok) c.put(req, res.clone())
    return res
  } catch {
    return (await c.match(req, { ignoreSearch: true })) || Response.error()
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (req.mode === 'navigate' && url.origin === location.origin && url.pathname.startsWith(SCOPE)) return e.respondWith(networkFirst(req))
  if (url.origin === location.origin && url.pathname.startsWith(SCOPE + 'lettre/')) return e.respondWith(reseauDabord(req))
  if (url.origin === location.origin && url.pathname.startsWith(SCOPE + 'assets/')) return e.respondWith(cacheFirst(req))
  if (url.origin === location.origin && (url.pathname.startsWith(SCOPE + 'visages/') || url.pathname.startsWith(SCOPE + 'images/'))) return e.respondWith(cacheFirst(req))
  if (req.url.startsWith(PYODIDE)) return e.respondWith(cacheFirst(req))
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return e.respondWith(cacheFirst(req))
})
