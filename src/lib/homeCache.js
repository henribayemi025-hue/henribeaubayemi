import { supabase } from './supabase';
import { detectCountrySync } from './countries';
import { avantDabord } from './featured';

// Shared with Home.jsx, but kept in its own tiny module (not part of the
// lazy-loaded Home chunk) so main.jsx can kick off the fetch the INSTANT the
// app boots — before routing/auth even resolve, and before Home's own code
// has downloaded. By the time the user actually lands on Home, the network
// round-trip is often already done, so the first paint feels instant instead
// of waiting for Home's chunk to load AND then start its own fetch.
export let homeCache = null;
let inFlight = null;
let cachedFor; // pays ayant servi à construire `homeCache`

const SHOP_COLS = 'id, slug, name, avatar_url, rating, is_verified, followers_count, country, featured_until';
export const HOME_PAGE_SIZE = 24;
// 30 et non 12. Beau, en glissant la bande: « quand je glisse je ne vois
// pas » — la bande s'arrêtait à douze sans jamais dire qu'il en existait
// d'autres. Une bande horizontale de cartes légères supporte très bien la
// trentaine; le jour où les boutiques se comptent en centaines, c'est
// l'annuaire /boutiques qui prend le relais, pas cette limite.
const LIMIT_SHOPS = 30;
// Finjaro est une place de marché CAMEROUNAISE avec une clientèle en diaspora.
// La règle n'est donc pas symétrique, et c'est voulu:
//
//   • au Cameroun, on ne montre que le Cameroun — une robe vendue à Paris est
//     inutile à une acheteuse de Douala, elle ne pourra jamais la commander;
//   • à l'étranger, on montre les boutiques locales D'ABORD, puis TOUJOURS le
//     Cameroun en dessous — la diaspora ouvre Finjaro précisément pour acheter
//     au pays. Le masquer viderait l'app de sa raison d'être (constaté le
//     04/08: depuis la France, aucune des 8 boutiques camerounaises n'était
//     visible).
const HOME_COUNTRY = 'CM';
// Seuils utilisés uniquement pour un visiteur AU Cameroun: en dessous, son
// pays n'a pas de quoi remplir l'accueil et on complète avec l'étranger.
const MIN_LOCAL_PRODUCTS = HOME_PAGE_SIZE;
const MIN_LOCAL_SHOPS = 3;

// Le fil défile à l'infini: on PRIORISE le pays du visiteur sans jamais MASQUER
// le reste. Plutôt que de fusionner deux requêtes qui se recouvrent (le même
// article pouvait sortir des deux, ce qui rendait toute pagination bancale), on
// lit DEUX FLUX DISJOINTS l'un après l'autre — d'abord « chez moi », puis
// « ailleurs ». Aucun doublon possible, et le curseur reste un simple décalage
// par flux.
//
// Le tri secondaire sur `id` n'est pas cosmétique: les ajouts en masse créent
// des dizaines d'articles à la même milliseconde, et sans départage un
// `created_at` ex aequo fait réapparaître ou sauter des lignes d'une page à
// l'autre.
// `allowRest` vaut null tant qu'on ignore la taille du catalogue local: il est
// tranché au premier chargement, en comptant les articles du pays du visiteur.
export function initialCursor(country) {
  return { phase: country ? 'local' : 'rest', local: 0, rest: 0, allowRest: country ? null : true };
}

// Renvoie une page pleine (sauf en fin de catalogue) en enchaînant au besoin la
// fin du flux local et le début du flux « ailleurs », pour ne jamais afficher
// une demi-page à la charnière entre les deux.
//
// La lecture passe par la fonction `home_feed_page` (migration 0041) plutôt
// que par une requête directe sur `products`: c'est elle qui diversifie le
// fil par boutique (voir la migration pour le détail) — un tri chronologique
// simple laissait une seule boutique ayant versé un gros lot occuper tout le
// haut du fil.
export async function fetchProductPage(country, cursor) {
  let { phase, local, rest, allowRest } = cursor || initialCursor(country);
  const items = [];

  while (items.length < HOME_PAGE_SIZE && phase !== 'done') {
    const need = HOME_PAGE_SIZE - items.length;
    const isLocal = phase === 'local';
    const offset = isLocal ? local : rest;

    const pageCall = supabase.rpc('home_feed_page', {
      p_local_country: isLocal ? country : null,
      p_exclude_country: isLocal ? null : country,
      p_limit: need,
      p_offset: offset,
    });

    // Le compte exact n'est demandé qu'une fois, sur la toute première requête
    // locale: il sert uniquement à décider si l'étranger a le droit de
    // compléter le fil. Son résultat NE change RIEN aux paramètres de la page
    // locale ci-dessus — donc plus besoin de l'attendre avant de lancer la
    // page: les deux partent EN MÊME TEMPS. Avant, ils s'enchaînaient (deux
    // allers-retours réseau l'un après l'autre), ce qui doublait la latence
    // du tout premier chargement de l'accueil. Mesuré en conditions réelles
    // (Cloudflare Web Vitals): LCP à 100% "Poor" — la base est à Paris
    // (eu-west-3), et deux allers-retours séquentiels depuis une connexion
    // camerounaise se voient beaucoup plus qu'un seul.
    let pageRes;
    if (isLocal && allowRest === null) {
      const [countRes, pRes] = await Promise.all([
        supabase.rpc('home_feed_count', { p_country: country }),
        pageCall,
      ]);
      if (countRes.error) throw countRes.error;
      // Hors du Cameroun, la suite du fil est acquise: on la donne sans même
      // regarder le compte local.
      allowRest = country !== HOME_COUNTRY || (countRes.data ?? 0) < MIN_LOCAL_PRODUCTS;
      pageRes = pRes;
    } else {
      pageRes = await pageCall;
    }
    if (pageRes.error) throw pageRes.error;
    const rows = pageRes.data || [];
    items.push(...rows);
    if (isLocal) local += rows.length;
    else rest += rows.length;
    // Flux local épuisé: on ne bascule vers l'étranger que si le pays du
    // visiteur était trop pauvre pour se suffire.
    if (rows.length < need) phase = isLocal && allowRest ? 'rest' : 'done';
  }

  return {
    items,
    cursor: { phase, local, rest, allowRest },
    done: phase === 'done',
  };
}

// Les boutiques tiennent en une seule bande horizontale, donc pas de
// pagination. Même règle que le fil: la bande s'intitule « près de chez toi »,
// on n'y met des boutiques étrangères que si le pays du visiteur n'en compte
// pas assez pour remplir la bande.
function localShopsFirst(localRows, restRows, limit, country) {
  const localList = localRows || [];
  // Même asymétrie que le fil: seul un visiteur AU Cameroun voit sa bande se
  // limiter à son pays.
  if (country === HOME_COUNTRY && localList.length >= MIN_LOCAL_SHOPS) {
    return [...localList].sort(avantDabord).slice(0, limit);
  }
  const seen = new Set(localList.map((r) => r.id));
  const reste = [];
  for (const row of restRows || []) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    reste.push(row);
    if (localList.length + reste.length >= limit) break;
  }
  // La proximité reste le PREMIER critère: la bande s'intitule « près de chez
  // toi », et une boutique mise en avant à l'autre bout du monde n'a rien à
  // faire devant celle d'à côté. On trie donc chaque moitié séparément.
  return [...localList].sort(avantDabord)
    .concat(reste.sort(avantDabord))
    .slice(0, limit);
}

export async function fetchHome(country) {
  const shops = () =>
    supabase
      .from('shops')
      .select(SHOP_COLS)
      .eq('status', 'active')
      // La mise en avant gagnée par parrainage passe devant le nombre
      // d'abonnés. C'est TOUTE la récompense: sans cet ordre, le programme
      // promet une place en tête et ne la donne pas.
      //
      // `featured_until` est trié en base sur la date brute, ce qui ferait
      // aussi remonter une mise en avant PÉRIMÉE — d'où le tri final côté
      // client, qui compare la date à maintenant.
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('followers_count', { ascending: false });

  // allSettled so a transient hiccup on ONE section doesn't blank the whole
  // home — we render whatever loaded. Only fail if both truly failed.
  const [pRes, sLocal, sAll] = await Promise.allSettled([
    fetchProductPage(country, initialCursor(country)),
    country ? shops().eq('country', country).limit(LIMIT_SHOPS) : Promise.resolve({ data: [] }),
    shops().limit(LIMIT_SHOPS),
  ]);

  const ok = (res) => (res.status === 'fulfilled' && !res.value.error ? res.value.data : null);
  const page = pRes.status === 'fulfilled' ? pRes.value : null;
  const allShops = ok(sAll);
  if (page === null && allShops === null) throw new Error('home_failed');

  return {
    products: page?.items || [],
    cursor: page?.cursor || initialCursor(country),
    done: page ? page.done : true,
    shops: localShopsFirst(ok(sLocal), allShops, LIMIT_SHOPS, country),
  };
}

// Fire-and-forget from main.jsx. Dedupes with any load() already in flight
// from Home.jsx itself (whichever started first wins, both await the same
// promise) so we never issue the same query twice on a cold boot.
export function prefetchHome() {
  if (homeCache || inFlight) return;
  cachedFor = detectCountrySync();
  inFlight = fetchHome(cachedFor)
    .then((result) => {
      homeCache = result;
      return result;
    })
    .finally(() => {
      inFlight = null;
    });
}

// `country` vient des réglages: pays détecté, ou celui du profil connecté.
// S'il diffère de celui ayant servi au préchargement — typiquement une
// personne connectée dont le profil dit « France » alors que le préchargement
// anonyme avait deviné autre chose — on relance la requête pour le bon pays.
export function loadHome(country) {
  if (inFlight && country === cachedFor) return inFlight;
  cachedFor = country;
  const p = fetchHome(country).then((result) => {
    homeCache = result;
    return result;
  });
  inFlight = p;
  p.catch(() => {}).finally(() => {
    if (inFlight === p) inFlight = null;
  });
  return p;
}
