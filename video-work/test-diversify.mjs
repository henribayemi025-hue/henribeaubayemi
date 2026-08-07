// Vérifie la diversification du fil d'accueil par boutique: une seule
// boutique verse 60 articles d'un coup (cas ByFlora réel), sept autres n'en
// ont que 1 à 9. On contrôle que la première page mélange les boutiques au
// lieu d'être toute entière la grosse boutique récemment versée.
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
await new Promise((r) => srv.listen(4715, r));

const SHOP_CM = { id: 'shop-cm', slug: 'cm', name: 'Boutique CM', country: 'CM', city: 'Douala', status: 'active', is_verified: false, rating: 0, followers_count: 5 };

// Un tour de table sur les tailles réelles: ByFlora 93, Nnal 9, SM Store 8,
// Maison NGC 3, Luxury 2, trois boutiques à 1.
const SHOPS = [
  { id: 'byflora', name: 'ByFlora kids', n: 60 },
  { id: 'nnal', name: 'Nnal Beauty', n: 9 },
  { id: 'sm', name: 'SM Store', n: 8 },
  { id: 'ngc', name: 'Maison NGC', n: 3 },
  { id: 'luxury', name: 'Luxury Shop', n: 2 },
  { id: 'yak', name: 'Yak store', n: 1 },
  { id: 'eclat', name: "ECLAT D'EBENE", n: 1 },
  { id: 'mrsol', name: 'Mr Solution', n: 1 },
];
const now = Date.parse('2026-08-04T20:00:00Z');
// ByFlora versée EN DERNIER (le cas réel qui écrasait le fil): ses articles
// sont les plus récents de tous.
const ALL = [];
SHOPS.forEach((shop, shopIdx) => {
  for (let i = 0; i < shop.n; i++) {
    ALL.push({
      id: `${shop.id}-${i}`, name: `${shop.name} article ${i}`,
      price_fcfa: 1000, compare_at_price_fcfa: null, price_on_request: false,
      images: ['/demo-products/wd-03.jpg'], video_url: null, category: 'mode_femme',
      stock: 5, views: 0, shop_id: shop.id, shop_name: shop.name, shop_slug: shop.id, shop_country: 'CM',
      _rank: i, // rang au sein de la boutique, 0 = le plus récent
      _created: now - shopIdx * 1000, // ByFlora (idx 0) la plus récente
    });
  }
});

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 1, locale: 'fr-FR' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));

await page.route('**/rest/v1/shops**', (route) => {
  route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify([SHOP_CM]) });
});

await page.route('**/rest/v1/rpc/home_feed_count**', async (route) => {
  const body = route.request().postDataJSON();
  const n = body.p_country === 'CM' ? ALL.length : 0;
  route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(n) });
});

await page.route('**/rest/v1/rpc/home_feed_page**', async (route) => {
  const body = route.request().postDataJSON();
  // Reproduit le tri de la fonction SQL: rang au sein de la boutique, puis date.
  const sorted = [...ALL].sort((a, b) => a._rank - b._rank || b._created - a._created);
  const page = sorted.slice(body.p_offset, body.p_offset + body.p_limit);
  route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(page) });
});

await page.goto('http://localhost:4715/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const names = await page.locator('.grid a[href^="/product/"] p.line-clamp-2').allInnerTexts();
const shopsOnPage1 = new Set(names.map((n) => n.replace(/ article \d+$/, '')));
console.log('Articles page 1        :', names.length);
console.log('Boutiques distinctes    :', shopsOnPage1.size, '/', SHOPS.length);
console.log('Détail                  :', [...shopsOnPage1].join(', '));
console.log('Toutes représentées     :', shopsOnPage1.size === SHOPS.length);

await browser.close();
srv.close();
