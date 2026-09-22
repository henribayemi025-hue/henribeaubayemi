// Le cache qui survit à la fermeture de l'application.
//
// Beau, 22/09: « certains trucs doivent fonctionner hors ligne ».
//
// L'état de départ, mesuré et pas supposé: le service worker met la COQUE en
// cache, donc l'application s'ouvre sans réseau — et elle est VIDE, parce que
// toutes les données viennent de Supabase et que `queryCache` est une Map en
// mémoire qui disparaît au rechargement.
//
// Ce fichier est la moitié manquante: on écrit ce qu'on a lu dans IndexedDB,
// et on le relit au démarrage. Résultat: quelqu'un qui rouvre l'application
// dans le taxi revoit ce qu'il avait, au lieu d'un écran vide.
//
// ⚠️ LA RÈGLE, et elle décide de tout: hors ligne on LIT ce qu'on a déjà vu,
// et on AJOUTE. On ne modifie pas. Ce fichier ne fait que la lecture; la file
// d'attente des écritures viendra à côté, et n'acceptera que de l'ajout.
//
// Pourquoi IndexedDB et pas localStorage: localStorage plafonne vers 5 Mo,
// il est synchrone (il bloque l'affichage), et une liste d'articles avec ses
// variantes le remplit vite. IndexedDB est asynchrone et large.
//
// ⚠️ Vie privée: ce cache contient les données de la personne connectée — ses
// commandes, sa boîte de réception. Il est donc VIDÉ à la déconnexion
// (`viderTout`, appelé depuis `signOut`). Sans ça, la personne suivante à
// ouvrir le téléphone verrait les commandes de la précédente.

const BASE = 'finjaro-cache';
const MAGASIN = 'requetes';
const VERSION = 1;

// Au-delà, on ne garde pas: une seule entrée énorme chasserait tout le reste.
const MAX_OCTETS_PAR_ENTREE = 512 * 1024;
// Ce qui est plus vieux que ça ne sert plus à rien, même hors ligne.
const AGE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

let basePromise = null;

function ouvrir() {
  if (basePromise) return basePromise;
  basePromise = new Promise((resolve) => {
    // Pas d'IndexedDB (navigation privée sur certains navigateurs, stockage
    // refusé): on renvoie null et tout l'appelant retombe sur le comportement
    // d'avant. Un cache absent n'est jamais une erreur visible.
    if (typeof indexedDB === 'undefined') return resolve(null);
    let req;
    try {
      req = indexedDB.open(BASE, VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAGASIN)) db.createObjectStore(MAGASIN);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    // Firefox en navigation privée ne répond ni succès ni erreur: on n'attend
    // pas indéfiniment, sinon le premier rendu ne part jamais.
    setTimeout(() => resolve(null), 2000);
  });
  return basePromise;
}

function transaction(db, mode) {
  try {
    return db.transaction(MAGASIN, mode).objectStore(MAGASIN);
  } catch {
    return null;
  }
}

/** Tout ce qui est en réserve, sous la forme { cle: { data, ttl, timestamp } }. */
export async function toutRelire() {
  const db = await ouvrir();
  if (!db) return {};
  return new Promise((resolve) => {
    const magasin = transaction(db, 'readonly');
    if (!magasin) return resolve({});
    const req = magasin.openCursor();
    const sortie = {};
    const perimees = [];
    req.onsuccess = () => {
      const curseur = req.result;
      if (!curseur) {
        if (perimees.length) oublier(perimees);
        return resolve(sortie);
      }
      const v = curseur.value;
      // Trop vieux: on ne le rend pas, et on le jette au passage.
      if (!v || typeof v.timestamp !== 'number' || Date.now() - v.timestamp > AGE_MAX_MS) {
        perimees.push(curseur.key);
      } else {
        sortie[curseur.key] = v;
      }
      curseur.continue();
    };
    req.onerror = () => resolve({});
    setTimeout(() => resolve(sortie), 1500);
  });
}

/** Met une valeur en réserve. Silencieux en cas d'échec: ce n'est qu'un cache. */
export async function garder(cle, data, ttl) {
  const db = await ouvrir();
  if (!db) return;
  let taille = 0;
  try {
    taille = JSON.stringify(data).length;
  } catch {
    // Non sérialisable (une Map, une fonction): on ne garde pas.
    return;
  }
  if (taille > MAX_OCTETS_PAR_ENTREE) return;
  const magasin = transaction(db, 'readwrite');
  if (!magasin) return;
  try {
    magasin.put({ data, ttl, timestamp: Date.now() }, cle);
  } catch {
    // Quota dépassé: on laisse tomber cette entrée plutôt que de faire
    // échouer l'écran qui l'a demandée.
  }
}

export async function oublier(cles) {
  const db = await ouvrir();
  if (!db) return;
  const magasin = transaction(db, 'readwrite');
  if (!magasin) return;
  for (const cle of cles) {
    try { magasin.delete(cle); } catch { /* rien à faire */ }
  }
}

/** Vide tout. Appelé à la déconnexion — voir la note de vie privée en tête. */
export async function viderTout() {
  const db = await ouvrir();
  if (!db) return;
  const magasin = transaction(db, 'readwrite');
  if (!magasin) return;
  try { magasin.clear(); } catch { /* rien à faire */ }
}
