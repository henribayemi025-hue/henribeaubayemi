// Cloudflare Worker qui met le CDN entre les visiteurs et Supabase Storage.
//
// Avant: chaque photo produit était téléchargée directement depuis
// bokwivwizghdlaedczbw.supabase.co (Frankfurt). Sur un mobile au Cameroun ça
// donnait un LCP à 13 s mesuré par Web Vitals — une seule image en tête de
// fiche prenait 13 secondes à s'afficher. Les visiteurs partaient avant
// d'avoir vu l'article.
//
// Après: le composant appelle `/img/{bucket}/{chemin}` (via storageUrl dans
// lib/supabase.js). Le Worker répond en récupérant l'objet Supabase la
// PREMIÈRE fois, puis Cloudflare le sert depuis le POP le plus proche du
// visiteur (Yaoundé, Douala, Paris, New York…) jusqu'à un mois.
//
// Les autres URLs continuent d'être servies par le binding ASSETS (SPA
// statique). C'est le comportement d'avant, on ne fait qu'ajouter la branche
// /img/*.
const SUPABASE_HOST = 'bokwivwizghdlaedczbw.supabase.co';
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours
const BROWSER_CACHE = `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, immutable`;

// Les objets « ids » sont des pièces d'identité. Elles ne sont pas publiques
// (accès signé côté client via createSignedUrl) — pas question de créer une
// route non authentifiée qui les rediffuserait.
const PRIVATE_BUCKETS = new Set(['ids']);

// Taille au-delà de laquelle on ne met PAS l'objet dans le cache programmable:
// on le laisse couler tel quel vers le visiteur. Une photo d'article peut
// peser 22 Mo (constaté en base) et il n'y a aucune raison de la garder en
// mémoire le temps de la recopier.
const TAILLE_MAX_CACHE = 5 * 1024 * 1024;

// Le cache programmable (Cache API) ne fonctionne pas partout: la
// documentation Cloudflare précise qu'il est « sans effet » dans les aperçus.
// L'adresse de préproduction en est un (staging-finjaro.finjaro.workers.dev,
// créée par `wrangler versions upload`).
//
// Ça compte, parce qu'on écrivait `cache.put(response.clone())`: cloner une
// réponse crée DEUX flux, et tant que le second n'est pas lu, le premier se
// bloque quand le tampon est plein. Si `cache.put` ne lit jamais rien, la
// photo n'arrive jamais au navigateur — pas d'erreur, juste un carré gris qui
// tourne. C'est exactement ce que Beau voit sur staging le 11/09, alors que
// les mêmes photos s'affichent sur finjaro.net.
//
// On s'en passe donc sur ces adresses: `cf.cacheEverything` sur le fetch
// couvre déjà la mise en cache côté Cloudflare, sans clone ni tampon.
function cacheProgrammableUtilisable(url) {
  return !url.hostname.endsWith('.workers.dev');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/img/')) {
      return serveImage(request, url, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

async function serveImage(request, url, ctx) {
  const rest = url.pathname.slice('/img/'.length); // {bucket}/{chemin…}
  const slash = rest.indexOf('/');
  if (slash === -1) return new Response('bad path', { status: 400 });

  const bucket = rest.slice(0, slash);
  const objectPath = rest.slice(slash + 1);
  if (!bucket || !objectPath) return new Response('bad path', { status: 400 });
  if (PRIVATE_BUCKETS.has(bucket)) return new Response('forbidden', { status: 403 });

  // GET/HEAD seulement — pas de POST/PUT/DELETE via ce proxy public.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405 });
  }

  const cacheUtilisable = cacheProgrammableUtilisable(url);
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  if (cacheUtilisable) {
    // Un cache indisponible ne doit jamais faire échouer une photo.
    const cached = await cache.match(cacheKey).catch(() => null);
    if (cached) return cached;
  }

  const upstreamUrl = `https://${SUPABASE_HOST}/storage/v1/object/public/${bucket}/${objectPath}`;
  const upstream = await fetch(upstreamUrl, {
    cf: {
      // Cloudflare cache le résultat au niveau edge en plus de notre Cache API.
      cacheEverything: true,
      cacheTtl: CACHE_TTL_SECONDS,
    },
  });

  if (!upstream.ok) {
    // 404 sur une image sans vignette est un cas normal (SmartImage retombe sur
    // la pleine taille). On renvoie le statut tel quel, sans cacher les erreurs
    // longtemps — 30 s suffit à absorber les burst.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Cache-Control': 'public, max-age=30' },
    });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get('Content-Type') || 'application/octet-stream';
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', BROWSER_CACHE);
  headers.set('Access-Control-Allow-Origin', '*');
  // Vary sur Accept pour permettre AVIF/WebP négocié par le navigateur plus tard.
  headers.set('Vary', 'Accept');

  // Assez petit et cache disponible: on lit l'objet EN ENTIER, puis on sert
  // et on range deux copies indépendantes. Plus de clone, donc plus de flux
  // qui attend l'autre.
  const taille = Number(upstream.headers.get('Content-Length') || 0);
  if (cacheUtilisable && taille > 0 && taille <= TAILLE_MAX_CACHE) {
    const octets = await upstream.arrayBuffer();
    ctx.waitUntil(
      cache.put(cacheKey, new Response(octets, { status: 200, headers })).catch(() => {})
    );
    return new Response(octets, { status: 200, headers });
  }

  // Sinon: on laisse couler, sans rien retenir. Cloudflare garde quand même
  // l'objet au bord grâce à `cf.cacheEverything` posé sur le fetch ci-dessus.
  return new Response(upstream.body, { status: 200, headers });
}
