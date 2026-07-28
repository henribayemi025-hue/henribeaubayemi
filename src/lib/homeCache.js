import { supabase } from './supabase';

// Shared with Home.jsx, but kept in its own tiny module (not part of the
// lazy-loaded Home chunk) so main.jsx can kick off the fetch the INSTANT the
// app boots — before routing/auth even resolve, and before Home's own code
// has downloaded. By the time the user actually lands on Home, the network
// round-trip is often already done, so the first paint feels instant instead
// of waiting for Home's chunk to load AND then start its own fetch.
export let homeCache = null;
let inFlight = null;

export async function fetchHome() {
  // allSettled so a transient hiccup on ONE section doesn't blank the whole
  // home — we render whatever loaded. Only fail if both truly failed.
  const [pRes, sRes] = await Promise.allSettled([
    supabase
      .from('products')
      .select('id, name, price_fcfa, images, category, stock, shop_id, views, shops(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase
      .from('shops')
      .select('id, slug, name, avatar_url, rating, is_verified, followers_count')
      .eq('status', 'active')
      .order('followers_count', { ascending: false })
      .limit(12),
  ]);
  const products = pRes.status === 'fulfilled' && !pRes.value.error ? pRes.value.data : null;
  const shops = sRes.status === 'fulfilled' && !sRes.value.error ? sRes.value.data : null;
  if (products === null && shops === null) throw new Error('home_failed');
  return {
    products: (products || []).map((p) => ({ ...p, shop_name: p.shops?.name })),
    shops: shops || [],
  };
}

// Fire-and-forget from main.jsx. Dedupes with any load() already in flight
// from Home.jsx itself (whichever started first wins, both await the same
// promise) so we never issue the same query twice on a cold boot.
export function prefetchHome() {
  if (homeCache || inFlight) return;
  inFlight = fetchHome()
    .then((result) => {
      homeCache = result;
      return result;
    })
    .finally(() => {
      inFlight = null;
    });
}

export function loadHome() {
  if (inFlight) return inFlight;
  return fetchHome().then((result) => {
    homeCache = result;
    return result;
  });
}
