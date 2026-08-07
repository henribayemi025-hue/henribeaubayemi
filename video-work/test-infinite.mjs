// Vérifie le défilement infini de l'accueil au travers des fonctions RPC
// home_feed_count / home_feed_page (migration 0041) — le fil ne lit plus
// directement la table `products`, il diversifie par boutique. Ce test
// couvre la pagination et la règle pays (CM strict / diaspora + CM), pas la
// diversification elle-même (voir test-diversify.mjs pour ça): un seul
// magasin par pays ici, donc le tri se réduit au chronologique habituel.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4716, r));

const SHOP_CM = { id: 'shop-cm', slug: 'cm', name: 'Boutique CM', country: 'CM', city: 'Douala', status: 'active', is_verified: false, rating: 0, followers_count: 5 };
const SHOP_FR = { id: 'shop-fr', slug: 'fr', name: 'Boutique FR', country: 'FR', city: 'Paris', status: 'active', is_verified: false, rating: 0, followers_count: 3 };

const base = Date.parse('2026-08-01T10:00:00Z');
const mk = (i, shop) => ({
  id: `${shop.country}-${String(i).padStart(3, '0')}`,
  shop_id: shop.id, name: `${shop.country} article ${i}`,
  price_fcfa: 1000 + i, compare_at_price_fcfa: null, price_on_request: false,
  images: ['/demo-products/wd-03.jpg'], video_url: null, category: 'mode_femme',
  stock: 5, views: 0, shop_name: shop.name, shop_slug: shop.slug, shop_country: shop.country,
  _created: base - i * 60000,
});
const N_LOCAL = Number(process.argv[2] ?? 30); // articles dans le pays du visiteur (FR ici)
const FR = Array.from({ length: N_LOCAL }, (_, i) => mk(i, SHOP_FR));
const CM = Array.from({ length: 30 }, (_, i) => mk(i, SHOP_CM));
const ALL = [...CM, ...FR];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 1, locale: 'fr-FR' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));

await page.route('**/rest/v1/shops**', (route) => {
  const url = new URL(route.request().url());
  const c = url.searchParams.get('country');
  const rows = c === 'eq.CM' ? [SHOP_CM] : [SHOP_CM, SHOP_FR];
  route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(rows) });
});

const requests = [];
await page.route('**/rest/v1/rpc/home_feed_count**', async (route) => {
  const body = route.request().postDataJSON();
  const n = ALL.filter((p) => p.shop_country === body.p_country).length;
  route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(n) });
});

await page.route('**/rest/v1/rpc/home_feed_page**', async (route) => {
  const body = route.request().postDataJSON();
  let rows = ALL;
  if (body.p_local_country) rows = rows.filter((p) => p.shop_country === body.p_local_country);
  else if (body.p_exclude_country) rows = rows.filter((p) => p.shop_country !== body.p_exclude_country);
  rows = [...rows].sort((a, b) => b._created - a._created);
  const off = body.p_offset, lim = body.p_limit;
  requests.push(`${body.p_local_country || body.p_exclude_country || 'tous'}[${off}..${off + lim - 1}]`);
  route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(rows.slice(off, off + lim)) });
});

await page.goto('http://localhost:4716/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const cards = () => page.locator('.grid a[href^="/product/"]');
const first = await cards().count();
console.log(`--- ${N_LOCAL} articles dans le pays du visiteur, 30 à l'étranger ---`);
console.log('Page 1 — articles affichés :', first);

let previous = -1, rounds = 0;
while (rounds < 12) {
  const n = await cards().count();
  if (n === previous && (await page.locator('body').innerText()).includes('Tu as tout vu')) break;
  previous = n;
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(900);
  rounds += 1;
}

const total = await cards().count();
const hrefs = await cards().evaluateAll((els) => els.map((e) => e.getAttribute('href')));
const body = await page.locator('body').innerText();

console.log('Après défilement       :', total, 'articles');
console.log('Doublons               :', hrefs.length - new Set(hrefs).size);
console.log('Total attendu          :', N_LOCAL >= 24 ? N_LOCAL : N_LOCAL + 30);
console.log('Total obtenu           :', total);
console.log('Message de fin         :', body.includes('Tu as tout vu'));
console.log('Articles étrangers     :', hrefs.filter((h) => h.includes('CM-')).length);
console.log('Requêtes de pagination :', requests.join(' | '));

await page.screenshot({ path: 'test-infinite.png', fullPage: false });
await browser.close();
srv.close();
