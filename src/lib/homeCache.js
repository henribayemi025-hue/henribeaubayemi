import { supabase } from './supabase';
import { detectCountrySync } from './countries';

// Shared with Home.jsx, but kept in its own tiny module (not part of the
// lazy-loaded Home chunk) so main.jsx can kick off the fetch the INSTANT the
// app boots — before routing/auth even resolve, and before Home's own code
// has downloaded. By the time the user actually lands on Home, the network
// round-trip is often already done, so the first paint feels instant instead
// of waiting for Home's chunk to load AND then start its own fetch.
export let homeCache = null;
let inFlight = null;
let cachedFor; // pays ayant servi à construire `homeCache`

const PRODUCT_COLS =
  'id, name, price_fcfa, compare_at_price_fcfa, images, video_url, price_on_request, category, stock, shop_id, views, shops!inner(name, slug, country)';
const SHOP_COLS = 'id, slug, name, avatar_url, rating, is_verified, followers_count, country';
const LIMIT_PRODUCTS = 24;
const LIMIT_SHOPS = 12;

// Fusionne « chez moi » puis « ailleurs », sans doublon et sans dépasser la
// limite. On PRIORISE le pays du visiteur sans jamais MASQUER le reste: avec
// une poignée de boutiques par pays, un filtre strict afficherait une place de
// marché vide à la première personne d'un pays non encore couvert — le plus
// sûr moyen de la perdre.
function mergeLocalFirst(local, rest, limit) {
  const seen = new Set();
  const out = [];
  for (const row of [...(local || []), ...(rest || [])]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

export async function fetchHome(country) {
  const products = () =>
    supabase
      .from('products')
      .select(PRODUCT_COLS)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  const shops = () =>
    supabase
      .from('shops')
      .select(SHOP_COLS)
      .eq('status', 'active')
      .order('followers_count', { ascending: false });

  // allSettled so a transient hiccup on ONE section doesn't blank the whole
  // home — we render whatever loaded. Only fail if both truly failed.
  const [pLocal, pAll, sLocal, sAll] = await Promise.allSettled([
    country ? products().eq('shops.country', country).limit(LIMIT_PRODUCTS) : Promise.resolve({ data: [] }),
    products().limit(LIMIT_PRODUCTS),
    country ? shops().eq('country', country).limit(LIMIT_SHOPS) : Promise.resolve({ data: [] }),
    shops().limit(LIMIT_SHOPS),
  ]);

  const ok = (res) => (res.status === 'fulfilled' && !res.value.error ? res.value.data : null);
  const allProducts = ok(pAll);
  const allShops = ok(sAll);
  if (allProducts === null && allShops === null) throw new Error('home_failed');

  return {
    products: mergeLocalFirst(ok(pLocal), allProducts, LIMIT_PRODUCTS).map((p) => ({
      ...p,
      shop_name: p.shops?.name,
    })),
    shops: mergeLocalFirst(ok(sLocal), allShops, LIMIT_SHOPS),
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
