// Isole un seul écran pour vérifier si un souci vu dans review-buyer.mjs est
// reproductible seul, ou n'était qu'un artefact du passage en boucle sur une
// même page (requêtes qui se chevauchent d'un écran à l'autre).
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
await new Promise((r) => srv.listen(4802, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'buyer-test-0000-0000-0000-000000000001';
const SHOP_B = { id: 'shop-b', slug: 'byflora-kids', name: 'ByFlora kids', country: 'CM', city: 'Yaoundé', status: 'active', is_verified: false, rating: 0, followers_count: 8 };
const PROD4 = {
  id: 'prod-4', shop_id: SHOP_B.id, name: 'Article démo 4', price_fcfa: 17000, compare_at_price_fcfa: null,
  price_on_request: false, images: ['/demo-products/wd-03.jpg'], video_url: null, category: 'mode_femme',
  stock: 0, views: 12, is_active: true, created_at: new Date().toISOString(), sizes: ['S', 'M', 'L'], colors: ['Rouge'],
  shops: SHOP_B,
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });
const session = {
  access_token: 't', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'r', user: { id: USER_ID, email: 'a@test.dev', app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
};
await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));

const seen = [];
await page.route('**/rest/v1/**', (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  seen.push(`${req.method()} ${table} ${url.search} (single=${single})`);
  let rows = [];
  if (table === 'products') rows = [PROD4];
  else if (table === 'reviews') rows = [];
  return route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-0/1` },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});

await page.goto('http://localhost:4802/product/prod-4', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const body = await page.locator('body').innerText();
console.log('--- requêtes vues ---');
seen.forEach((s) => console.log(' ', s));
console.log('--- écran ---');
console.log(body.slice(0, 400));
await page.screenshot({ path: '/home/user/henribeaubayemi/video-work/review-isolate.png' });
await browser.close();
srv.close();
