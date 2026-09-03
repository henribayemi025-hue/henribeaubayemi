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

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

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

  const response = new Response(upstream.body, { status: 200, headers });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
