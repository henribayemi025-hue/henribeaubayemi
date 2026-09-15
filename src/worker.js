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

    // Le plan de site est fabriqué à la demande à partir de la base: écrit à
    // la main, il déclarait 7 pages et aucune boutique (voir plus bas).
    if (url.pathname === '/sitemap.xml') {
      return servirPlanDuSite(url, ctx);
    }

    // Une page de boutique ou d'article reçoit SON titre et SA photo avant
    // d'être servie (voir reecrireEnTete).
    const fiche = ficheDemandee(url.pathname);
    if (fiche) {
      return servirAvecSonEnTete(request, url, env, fiche);
    }

    return env.ASSETS.fetch(request);
  },
};

// ---------------------------------------------------------------------------
// Être trouvable, et s'afficher correctement quand on est partagé
// ---------------------------------------------------------------------------
//
// Beau (15/09), en cherchant pourquoi personne ne vient: « je tape finjaro
// accounting sur Google, ça ne montre rien ». En regardant, le problème était
// bien plus large et touchait la place de marché elle-même.
//
// Deux défauts, tous les deux invisibles depuis l'application:
//
// 1. `public/sitemap.xml` était écrit à la main et déclarait SEPT pages:
//    l'accueil, la recherche, les services, à propos et les mentions légales.
//    Les 55 boutiques et les 342 articles n'étaient annoncés nulle part.
//    Google n'avait aucune raison de faire remonter Finjaro sur « sac à main
//    Douala ».
//
// 2. Chaque page servait le MÊME en-tête: « Finjaro — Au-delà des rêves » et
//    le logo Finjaro. Donc quand une vendeuse partageait sa boutique sur
//    WhatsApp — le canal de partage principal ici — l'aperçu ne montrait ni
//    son nom, ni sa photo, ni son article. Six mois de liens partagés qui
//    ressemblaient tous à une publicité générique.
//
// La correction tient au bord, dans ce worker, et ne change RIEN à
// l'application: React continue de s'afficher comme avant. On réécrit
// seulement les balises de l'en-tête au passage, à la volée, sans charger la
// page en mémoire (HTMLRewriter).
//
// Ces balises sont servies à TOUT LE MONDE, pas seulement aux robots. Servir
// une chose aux moteurs et une autre aux gens est justement ce que Google
// sanctionne — et de toute façon WhatsApp, Facebook et iMessage lisent ces
// balises avec leur propre robot.

const CLE_PUBLIQUE = 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt';
const SITE = 'https://finjaro.net';

// Reconnaît une page qui a un titre à elle. Les autres passent sans détour.
function ficheDemandee(pathname) {
  const boutique = /^\/boutique\/([^/]+)\/?$/.exec(pathname);
  if (boutique) return { genre: 'boutique', cle: decodeURIComponent(boutique[1]) };
  const article = /^\/product\/([^/]+)\/?$/.exec(pathname);
  if (article) return { genre: 'article', cle: decodeURIComponent(article[1]) };
  return null;
}

async function lireSupabase(chemin) {
  const reponse = await fetch(`https://${SUPABASE_HOST}/rest/v1/${chemin}`, {
    headers: { apikey: CLE_PUBLIQUE, Authorization: `Bearer ${CLE_PUBLIQUE}` },
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!reponse.ok) return null;
  const lignes = await reponse.json();
  return Array.isArray(lignes) ? lignes : null;
}

// Une photo de partage doit être une adresse ABSOLUE, et en pleine taille:
// les aperçus veulent au moins 600 px, une vignette ressort floue.
function photoAbsolue(seau, chemin) {
  if (!chemin) return null;
  if (chemin.startsWith('http')) return chemin;
  if (chemin.startsWith('/')) return `${SITE}${chemin}`;
  return `${SITE}/img/${seau}/${chemin}`;
}

function echapper(texte) {
  return String(texte ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Coupe proprement une description trop longue, sans couper un mot en deux.
function resumer(texte, max = 160) {
  const propre = String(texte ?? '').replace(/\s+/g, ' ').trim();
  if (propre.length <= max) return propre;
  return `${propre.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

async function enTeteDeLaFiche(fiche) {
  try {
    if (fiche.genre === 'boutique') {
      const lignes = await lireSupabase(
        `shops?slug=eq.${encodeURIComponent(fiche.cle)}&status=eq.active&select=name,bio,city,avatar_url,banner_url&limit=1`
      );
      const b = lignes?.[0];
      if (!b?.name) return null;
      return {
        titre: `${b.name} — Finjaro`,
        // La ville aide quelqu'un qui cherche « couture Douala »; on ne
        // l'invente pas, on la met seulement si la boutique l'a renseignée.
        description: resumer(b.bio || `Découvre la boutique ${b.name}${b.city ? ` à ${b.city}` : ''} sur Finjaro.`),
        photo: photoAbsolue('shops', b.banner_url || b.avatar_url),
      };
    }
    const lignes = await lireSupabase(
      `products?id=eq.${encodeURIComponent(fiche.cle)}&is_active=eq.true&select=name,description,images,shops(name)&limit=1`
    );
    const a = lignes?.[0];
    if (!a?.name) return null;
    const boutique = a.shops?.name;
    return {
      titre: boutique ? `${a.name} — ${boutique} | Finjaro` : `${a.name} — Finjaro`,
      description: resumer(a.description || `${a.name}${boutique ? `, vendu par ${boutique}` : ''}, sur Finjaro.`),
      photo: photoAbsolue('products', Array.isArray(a.images) ? a.images[0] : null),
    };
  } catch {
    return null; // une page sans son titre reste une page qui s'affiche
  }
}

async function servirAvecSonEnTete(request, url, env, fiche) {
  const page = await env.ASSETS.fetch(request);
  const type = page.headers.get('Content-Type') || '';
  if (!type.includes('text/html')) return page;

  const en = await enTeteDeLaFiche(fiche);
  if (!en) return page; // boutique retirée, article inactif: en-tête d'origine

  // Deux formes du même texte, et c'est important: `setInnerContent` échappe
  // tout seul, `setAttribute` non. Passer du texte déjà échappé au premier
  // donnait « &amp;amp; » dans le titre — attrapé par le test du 15/09 sur un
  // nom de boutique contenant « & » et des guillemets.
  const titre = en.titre;
  const titreAttribut = echapper(en.titre);
  const description = echapper(en.description);
  const photo = en.photo ? echapper(en.photo) : null;
  const adresse = echapper(`${SITE}${url.pathname}`);

  const poser = (attribut) => ({
    element(el) {
      const quoi = el.getAttribute(attribut);
      if (quoi === 'og:title' || quoi === 'twitter:title') el.setAttribute('content', titreAttribut);
      else if (quoi === 'description' || quoi === 'og:description' || quoi === 'twitter:description') el.setAttribute('content', description);
      else if (photo && (quoi === 'og:image' || quoi === 'twitter:image')) el.setAttribute('content', photo);
      else if (quoi === 'og:url') el.setAttribute('content', adresse);
    },
  });

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(titre); } })
    .on('meta[property]', poser('property'))
    .on('meta[name]', poser('name'))
    .transform(page);
}

// ---------------------------------------------------------------------------
// Le plan de site, fabriqué à partir de la base
// ---------------------------------------------------------------------------

const PAGES_FIXES = ['/', '/search', '/services', '/a-propos', '/legal/terms', '/legal/confidentialite'];

async function servirPlanDuSite(url, ctx) {
  const cache = caches.default;
  const cleCache = new Request(`${SITE}/sitemap.xml`, { method: 'GET' });
  if (cacheProgrammableUtilisable(url)) {
    const garde = await cache.match(cleCache).catch(() => null);
    if (garde) return garde;
  }

  const [boutiques, articles] = await Promise.all([
    lireSupabase('shops?status=eq.active&select=slug,updated_at&limit=1000'),
    lireSupabase('products?is_active=eq.true&select=id,updated_at&limit=5000'),
  ]);

  const entrees = [
    ...PAGES_FIXES.map((p) => ({ loc: `${SITE}${p}`, priorite: p === '/' ? '1.0' : '0.6' })),
    ...(boutiques ?? []).filter((b) => b.slug).map((b) => ({
      loc: `${SITE}/boutique/${encodeURIComponent(b.slug)}`, date: b.updated_at, priorite: '0.8',
    })),
    ...(articles ?? []).map((a) => ({
      loc: `${SITE}/product/${encodeURIComponent(a.id)}`, date: a.updated_at, priorite: '0.7',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    entrees.map((e) => `  <url><loc>${echapper(e.loc)}</loc>${
      e.date ? `<lastmod>${String(e.date).slice(0, 10)}</lastmod>` : ''
    }<priority>${e.priorite}</priority></url>`).join('\n')
  }\n</urlset>\n`;

  const reponse = new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Une heure: assez pour ne pas interroger la base à chaque passage d'un
      // robot, assez court pour qu'une boutique publiée le matin soit
      // annoncée le jour même.
      'Cache-Control': 'public, max-age=3600',
    },
  });
  if (cacheProgrammableUtilisable(url)) {
    ctx.waitUntil(cache.put(cleCache, reponse.clone()).catch(() => {}));
  }
  return reponse;
}

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
