// Cache mémoire process-wide pour les fetches lus dans useAsync.
//
// Contexte: avant ce cache, chaque navigation refaisait TOUS les appels
// Supabase, y compris quand on revenait en arrière sur une page qu'on venait
// de quitter. Sur mobile 3G/4G au Cameroun, le retour arrière prenait 1 à 2
// secondes visibles pour rien — l'utilisateur avait l'impression que l'app
// ramait. Le navigateur AURAIT pu restaurer la page via bfcache, mais le
// service worker de la PWA le désactive.
//
// Choix simples volontaires:
//  - Une Map en module (pas de store, pas de context) — 200 lignes plutôt
//    qu'une lib de 30 Ko.
//  - Stale-while-revalidate: on rend immédiatement la valeur cache tout en
//    déclenchant un rafraîchissement en tâche de fond, pour que l'écran ne
//    reste jamais coincé sur une donnée périmée. La 2ᵉ résolution remplace
//    la 1ʳᵉ sans que l'utilisateur voie une bascule de spinner.
//  - TTL par défaut 5 min: assez court pour que la fraîcheur reste correcte
//    (nouveau produit, changement de prix), assez long pour couvrir la vraie
//    fenêtre de navigation (l'utilisateur qui va voir un article puis revient).
//  - Pas de persistance: c'est bien un cache mémoire, il disparaît au reload.
//    Le cache "long terme" reste dans Cloudflare (voir src/worker.js pour les
//    images) et dans le service worker (Workbox) pour les assets JS/CSS.
//  - Limite en taille: on garde les 100 dernières clés (LRU basique) pour
//    ne pas grossir indéfiniment sur une session longue.

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 100;

// Map préserve l'ordre d'insertion — on s'en sert pour l'éviction LRU: on
// supprime la première clé de la Map quand on dépasse la limite.
const store = new Map();
// Requêtes en cours par clé, pour dédupliquer: si deux composants demandent
// la MÊME clé en même temps, on n'appelle Supabase qu'une fois.
const inflight = new Map();

// Chaque clé a aussi un jeu d'abonnés qu'on notifie quand la valeur change
// (après un rafraîchissement en arrière-plan, ou une invalidation manuelle).
const listeners = new Map();

function notify(key) {
  const set = listeners.get(key);
  if (!set) return;
  for (const fn of set) fn();
}

function bumpLru(key, entry) {
  // Réinsérer déplace la clé en dernier — c'est ce qui rend la Map LRU.
  store.delete(key);
  store.set(key, entry);
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
    listeners.delete(oldest);
  }
}

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return { hit: false };
  const isStale = Date.now() - entry.timestamp > entry.ttl;
  return { hit: true, data: entry.data, isStale };
}

export function setCached(key, data, ttl = DEFAULT_TTL_MS) {
  bumpLru(key, { data, ttl, timestamp: Date.now() });
  notify(key);
}

export function invalidate(prefix) {
  // Supprime toutes les clés commençant par `prefix` — utile après une
  // mutation (ex: après avoir publié un article, `invalidate('vendor-products')`
  // pour que la liste soit re-fetchée à la prochaine ouverture).
  const toDelete = [];
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) toDelete.push(key);
  }
  for (const key of toDelete) {
    store.delete(key);
    notify(key); // que les abonnés sachent que la valeur a été invalidée
  }
}

// Exécute `fn` UNE FOIS pour une clé donnée même si plusieurs composants
// l'appellent en parallèle (ex: deux écrans qui se montent en même temps).
export async function dedupe(key, fn) {
  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = (async () => {
    try {
      return await fn();
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

export function subscribe(key, fn) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);
  return () => {
    set.delete(fn);
    if (set.size === 0) listeners.delete(key);
  };
}
