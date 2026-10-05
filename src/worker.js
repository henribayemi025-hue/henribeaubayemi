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
import { servirIa } from './ia.js';

const SUPABASE_HOST = 'bokwivwizghdlaedczbw.supabase.co';
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours
const BROWSER_CACHE = `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}, immutable`;

// Ce relais est PUBLIC et met chaque image en cache 30 jours. Il ne sert donc
// QUE les dossiers faits pour être vus de tous (liste blanche). Avant le 01/10
// c'était une liste noire (« ids » seul) : les photos des conversations
// (« chat ») passaient par ici, restaient en cache 30 jours, et un dossier
// rendu privé en base continuait d'être servi depuis ce cache. Les dossiers
// privés (ids, chat, legion-prive) se lisent par lien signé côté site.
const PUBLIC_BUCKETS = new Set(['products', 'shops', 'reels', 'listings', 'photos']);

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

// En-têtes de sécurité (audit du 01/10, M-1). Les fichiers servis
// directement (sans passer par ce Worker) les reçoivent par public/_headers ;
// ce qui passe ici (fiches, plan du site, repli) les reçoit ci-dessous.
// frame-ancestors : seuls nos propres sites peuvent afficher finjaro.net dans
// un cadre (contre le détournement de clic). Les applications Android et iOS
// ne l'encadrent pas : elles l'ouvrent directement.
// CSP complète en MODE RAPPORT (M-1 suite) : elle ne bloque rien, elle
// signale au navigateur (console) et à /csp-rapport ce qui serait bloqué.
// Inventaire du 01/10 (parcours de 14 pages + lecture du code) : le site,
// Supabase (API et temps réel), Google Fonts, les tuiles de la carte
// (OpenFreeMap, ArcGIS), la météo de Léo (Open-Meteo), le pixel Facebook,
// le Worker de l'atelier, raw.githubusercontent.com (fiches d'agents).
// Images : toute adresse https (photos des boutiques, avatars Google…).
// 'wasm-unsafe-eval' : détourage des photos (onnxruntime, fichier local).
// À NE PAS passer en mode bloquant avant d'avoir sorti l'aperçu de l'atelier
// (iframe srcdoc qui hérite de cette règle) sur une autre origine.
const SUPABASE_ORIGINE = 'https://bokwivwizghdlaedczbw.supabase.co';
function csp({ evalPermis = false } = {}) {
  return [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval'${evalPermis ? " 'unsafe-eval' https://cdn.jsdelivr.net" : ''} https://connect.facebook.net`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `media-src 'self' data: blob: ${SUPABASE_ORIGINE}`,
    `connect-src 'self' ${SUPABASE_ORIGINE} ${SUPABASE_ORIGINE.replace('https:', 'wss:')} https://tiles.openfreemap.org https://server.arcgisonline.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://raw.githubusercontent.com https://finjaro-atelier.finjaro.workers.dev https://www.facebook.com https://connect.facebook.net${evalPermis ? ' https://cdn.jsdelivr.net' : ''}`,
    "frame-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'report-uri /csp-rapport',
  ].join('; ');
}
// Un objet, pas deux textes : l'environnement des Workers refuse qu'un module
// exporte une simple chaîne (le Worker ne démarre plus — vu en local le 01/10).
// Learn (/learn/) exécute le code de l'élève avec new Function dans un Worker
// isolé, et Python avec Pyodide (version figée, chargée depuis jsDelivr) : il
// lui faut 'unsafe-eval' et cdn.jsdelivr.net, et à lui seul.
export const CSP_RAPPORT = { site: csp(), learn: csp({ evalPermis: true }) };

export const EN_TETES_SECURITE = {
  'Strict-Transport-Security': 'max-age=15552000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "frame-ancestors 'self' https://*.finjaro.net https://*.finjaro.workers.dev",
  'Content-Security-Policy-Report-Only': CSP_RAPPORT.site,
};

function securiser(reponse, { learn = false } = {}) {
  const r = new Response(reponse.body, reponse);
  for (const [cle, valeur] of Object.entries(EN_TETES_SECURITE)) r.headers.set(cle, valeur);
  if (learn) r.headers.set('Content-Security-Policy-Report-Only', CSP_RAPPORT.learn);
  return r;
}

// Rapports de la CSP : une ligne compacte dans les journaux du Worker
// (tableau de bord Cloudflare → Workers → finjaro → Logs). Rien n'est stocké.
async function recevoirRapportCsp(request) {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  try {
    const texte = (await request.text()).slice(0, 8000);
    const brut = JSON.parse(texte);
    const liste = Array.isArray(brut) ? brut.map((x) => x.body || x) : [brut['csp-report'] || brut];
    for (const v of liste.slice(0, 10)) {
      console.log('csp', JSON.stringify({
        directive: v['effective-directive'] || v.effectiveDirective || v['violated-directive'],
        bloque: String(v['blocked-uri'] || v.blockedURL || '').slice(0, 200),
        page: String(v['document-uri'] || v.documentURL || '').replace(/[?#].*$/, '').slice(0, 200),
      }));
    }
  } catch { /* rapport illisible : ignoré */ }
  return new Response(null, { status: 204 });
}

// D'OÙ VIENNENT LES VISITEURS (Beau, 05/10 : « ajoute le pays et la ville des
// visiteurs »). Cloudflare connaît déjà, pour chaque requête, le pays et la
// ville approximative déduits de l'adresse IP (request.cf) ; on les rend au
// site, qui les joint à l'événement « visit ». Rien d'autre : ni l'adresse IP,
// ni les coordonnées, ni rien qui désigne une personne. Jamais mis en cache.
export function geoDuVisiteur(request) {
  const cf = request.cf || {};
  const propre = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const corps = { pays: propre(cf.country, 2), ville: propre(cf.city, 80), region: propre(cf.region, 80) };
  return new Response(JSON.stringify(corps), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Finjaro Learn est servi sous /learn/ sur la préproduction seulement : Beau
// (01/10) « laisse Learn sur staging, on ne se presse pas ». Comme finjaro.net
// reprend tout staging à chaque mise en ligne, ses fichiers y partiraient avec
// n'importe quel autre changement ; sur la production on renvoie donc à
// l'accueil. Pour ouvrir Learn sur finjaro.net : retirer ce verrou (et la
// ligne run_worker_first de wrangler.toml), sur décision de Beau.
export function learnFerme(url) {
  const learn = url.pathname === '/learn' || url.pathname.startsWith('/learn/');
  const preproduction = url.hostname.endsWith('.workers.dev') || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  return learn && !preproduction;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/csp-rapport') {
      return recevoirRapportCsp(request);
    }

    if (url.pathname === '/geo') {
      return securiser(geoDuVisiteur(request));
    }

    // L'IA gratuite de Cloudflare pour Léo et Finia (src/ia.js).
    if (url.pathname === '/ia/chat/completions') {
      return securiser(await servirIa(request, env));
    }

    if (learnFerme(url)) {
      return securiser(new Response(null, { status: 302, headers: { Location: '/', 'Cache-Control': 'no-store' } }));
    }

    if (url.pathname.startsWith('/img/')) {
      return serveImage(request, url, ctx);
    }

    // Le plan de site est fabriqué à la demande à partir de la base: écrit à
    // la main, il déclarait 7 pages et aucune boutique (voir plus bas).
    if (url.pathname === '/sitemap.xml') {
      return securiser(await servirPlanDuSite(url, ctx));
    }

    // Une page de boutique ou d'article reçoit SON titre et SA photo avant
    // d'être servie (voir reecrireEnTete).
    const fiche = ficheDemandee(url.pathname);
    if (fiche) {
      return securiser(await servirAvecSonEnTete(request, url, env, fiche));
    }

    const learn = url.pathname === '/learn' || url.pathname.startsWith('/learn/');
    return securiser(await env.ASSETS.fetch(request), { learn });
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

const PAGES_FIXES = ['/', '/search', '/services', '/a-propos', '/kit', '/legal/terms', '/legal/confidentialite'];

// La clé de cache porte un numéro de version. Le 15/09, une version fautive
// du plan du site (six pages, aucune boutique) s'est retrouvée en cache pour
// une heure: le correctif était déployé, et Cloudflare servait toujours
// l'ancienne. Un cache qui épingle une mauvaise réponse sans moyen de la
// chasser est un piège — on change ce numéro quand le contenu change de
// forme, et l'ancienne entrée est ignorée aussitôt.
const VERSION_PLAN_DU_SITE = 2;

async function servirPlanDuSite(url, ctx) {
  const cache = caches.default;
  const cleCache = new Request(`${SITE}/sitemap.xml?v=${VERSION_PLAN_DU_SITE}`, { method: 'GET' });
  // `?refresh` force la reconstruction sans attendre l'expiration. Sert à
  // vérifier un correctif tout de suite, au lieu de regarder une heure une
  // page qu'on vient de réparer.
  const forcer = url.searchParams.has('refresh');
  if (cacheProgrammableUtilisable(url) && !forcer) {
    const garde = await cache.match(cleCache).catch(() => null);
    if (garde) return garde;
  }

  // `created_at`, PAS `updated_at`: cette colonne n'existe sur aucune des deux
  // tables. Écrite à tort le 15/09, la requête partait en erreur 400 et le
  // plan de site se rabattait en silence sur les seules pages fixes — Google
  // a répondu « Impossible de récupérer le sitemap ». Le banc d'essai ne l'a
  // pas vu parce qu'il SIMULE la réponse de Supabase: un nom de colonne faux
  // y passe très bien. D'où la vérification contre la vraie base, plus bas
  // dans scripts/verifier-entetes.mjs.
  const [boutiques, articles] = await Promise.all([
    lireSupabase('shops?status=eq.active&select=slug,created_at&limit=1000'),
    lireSupabase('products?is_active=eq.true&select=id,created_at&limit=5000'),
  ]);

  const entrees = [
    ...PAGES_FIXES.map((p) => ({ loc: `${SITE}${p}`, priorite: p === '/' ? '1.0' : '0.6' })),
    ...(boutiques ?? []).filter((b) => b.slug).map((b) => ({
      loc: `${SITE}/boutique/${encodeURIComponent(b.slug)}`, date: b.created_at, priorite: '0.8',
    })),
    ...(articles ?? []).map((a) => ({
      loc: `${SITE}/product/${encodeURIComponent(a.id)}`, date: a.created_at, priorite: '0.7',
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
      // Un quart d'heure: assez pour ne pas interroger la base à chaque
      // passage d'un robot, assez court pour qu'une erreur ne reste pas
      // affichée longtemps — la leçon du 15/09.
      'Cache-Control': 'public, max-age=900',
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
  // Vérifié AVANT toute lecture du cache : une copie gardée d'un dossier
  // devenu privé ne doit plus sortir.
  if (!PUBLIC_BUCKETS.has(bucket)) return new Response('not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

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
    // Une image sans vignette est un cas normal (SmartImage retombe sur la
    // pleine taille). Le stockage répond alors 400 « Object not found » : on
    // le traduit en 404, sinon chaque visiteur voit une erreur rouge dans sa
    // console (audit m-17). Les erreurs ne restent en cache que 30 s.
    const absent = upstream.status === 400 || upstream.status === 404;
    return new Response(absent ? 'not found' : upstream.body, {
      status: absent ? 404 : upstream.status,
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
