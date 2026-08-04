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
await new Promise((r) => srv.listen(4705, r));

const now = Date.now();
const U = 'aaaa1111-1111-4111-8111-111111111111';
const SHOP = 'ssss1111-1111-4111-8111-111111111111';
const session = { access_token: 'f', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(now/1000)+3600, refresh_token: 'f', user: { id: U, aud: 'authenticated', role: 'authenticated', phone: '237651234567', app_metadata: {}, user_metadata: { name: 'Aïcha K.' }, created_at: new Date(now).toISOString() } };
const profile = { id: U, name: 'Aïcha K.', country: 'CM', currency: 'FCFA', is_vendor: true };
const shopRow = { id: SHOP, owner_id: U, slug: 'chez-aicha', name: 'Chez Aïcha', country: 'CM', city: 'Douala', categories: ['mode_femme'], status: 'active' };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, locale: 'fr-FR' });
await ctx.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), ['sb-bokwivwizghdlaedczbw-auth-token', session]);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 160)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: session }));
await page.route('**/storage/v1/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ Key: 'ok', path: 'ok' }) }));
await page.route('**/rest/v1/**', (route) => {
  const url = new URL(route.request().url());
  const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (route.request().headers()['accept'] || '').includes('vnd.pgrst.object');
  let rows = [];
  if (table === 'shops') rows = [shopRow];
  else if (table === 'profiles') rows = [profile];
  const h = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length-1,0)}/${rows.length}` };
  return route.fulfill({ status: 200, headers: h, body: JSON.stringify(single ? rows[0] ?? null : rows) });
});

await page.goto('http://localhost:4705/vendor/products/new', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// La case vide doit être câblée sur l'input MULTIPLE
const tile = page.locator('button[aria-label="Ajouter des photos"]').first();
console.log('Case vide libellée « Ajouter des photos » :', await tile.count());

// Vérifie que l'input ciblé accepte bien plusieurs fichiers
const inputs = await page.locator('input[type=file]').evaluateAll((els) =>
  els.map((e) => ({ multiple: e.multiple, accept: e.accept })));
console.log('Inputs fichier présents :', JSON.stringify(inputs));

// Simule le choix de 3 photos d'un coup via cet input multiple
const multi = page.locator('input[type=file][multiple]').first();
await multi.setInputFiles([
  '/home/user/henribeaubayemi/dist/demo-products/wd-03.jpg',
  '/home/user/henribeaubayemi/dist/demo-products/sac-01.jpg',
  '/home/user/henribeaubayemi/dist/demo-products/braids-01.jpg',
]);
await page.waitForTimeout(4000);
const previews = await page.locator('img[alt=""]').count();
console.log('Photos affichées après un seul choix de 3 :', previews);
await page.screenshot({ path: 'test-multiphoto.png' });
await browser.close(); srv.close();
