// Une vendeuse a Douala voyait son catalogue en euros, a « 0,00 ».
//
// Beau, capture d'ecran de la boutique Maison NGC: « la personne est au
// Cameroun, mais je vois les prix en euros ».
//
// Deux defauts distincts derriere la meme image:
//  1) l'espace vendeur affichait la devise DU TELEPHONE au lieu de celle de
//     la boutique — et la detection retombe sur la langue du systeme, donc un
//     telephone camerounais regle en « fr-FR » annonce la France;
//  2) « prix sur demande » s'affichait « 0 », comme si l'article etait offert.
//
// Le test place donc le pire cas: boutique au Cameroun, telephone en euros.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const OUT = '/home/user/henribeaubayemi/video-work/review-shots';
mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4809, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'vendor-cm-0000-0000-0000-000000000001';
const SHOP_ID = 'shop-cm-0000-0000-0000-000000000001';

const SHOP = { id: SHOP_ID, owner_id: USER_ID, name: 'Maison NGC', slug: 'maison-ngc-u9pg', country: 'CM', status: 'approved', is_active: true };
const PRODUCTS = [
  { id: 'p1', shop_id: SHOP_ID, name: 'Robes', price_fcfa: 2500, price_on_request: false, category: 'femme_robes', images: [], stock: 1, is_active: true, rotated_at: null, views: 0 },
  { id: 'p2', shop_id: SHOP_ID, name: 'Robe simple', price_fcfa: 0, price_on_request: true, category: 'femme_robes', images: [], stock: 1, is_active: true, rotated_at: null, views: 0 },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });

await ctx.addInitScript(([k, v]) => {
  localStorage.setItem(k, v);
  // Le pire cas: le telephone est convaincu d'etre en Europe.
  localStorage.setItem('finjaro_currency', 'EUR');
  localStorage.setItem('finjaro_country', 'FR');
}, [`sb-${PROJECT_REF}-auth-token`, JSON.stringify({
  access_token: 't', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
  user: { id: USER_ID, email: 'ngc@test.dev', app_metadata: {}, user_metadata: { name: 'Maison NGC' }, aud: 'authenticated', created_at: new Date(Date.now() - 30 * 864e5).toISOString() },
})]);
await ctx.addInitScript(() => localStorage.setItem('finjaro:intro-seen', '1'));

const page = await ctx.newPage();
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
await page.route('**/rest/v1/**', (route) => {
  const url = new URL(route.request().url());
  const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (route.request().headers()['accept'] || '').includes('vnd.pgrst.object');
  let rows = [];
  if (path === 'profiles') rows = [{ id: USER_ID, name: 'Maison NGC', country: 'CM', created_at: new Date().toISOString() }];
  else if (path === 'shops') rows = [SHOP];
  else if (path === 'products') rows = PRODUCTS;
  else if (path === 'vendor_applications') rows = [];
  route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-0/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});

await page.goto('http://localhost:4809/vendor/products', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
// `Intl.NumberFormat` en francais separe les milliers par une espace
// insecable ETROITE (U+202F), pas par une espace ordinaire: chercher
// « 2 500 » tape au clavier ne trouve rien. On normalise avant de comparer,
// sinon le test echoue sur un affichage pourtant juste.
const body = (await page.locator('body').innerText()).replace(/[  ]/g, ' ');
await page.screenshot({ path: `${OUT}/vendeur-devise.png`, fullPage: false });

let allOk = true;
const check = (ok, label, detail = '') => { allOk &= ok; console.log(`${ok ? '✅' : '⚠️ '} ${label}${detail ? ` — ${detail}` : ''}`); };

console.log('\n=== BOUTIQUE AU CAMEROUN, TELEPHONE EN EUROS ===\n');
check(body.includes('FCFA'), 'Le catalogue est en FCFA');
check(!body.includes('€'), 'Plus aucun euro affiche', body.includes('€') ? 'un € subsiste' : '');
check(body.includes('2 500') || body.includes('2500'), 'Le montant reste celui saisi (2 500), non converti');
check(body.includes('Prix sur demande'), '« Prix sur demande » remplace le 0');
check(!/\b0\s*(FCFA|€)/.test(body), 'Aucun article annonce a zero');

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close();
srv.close();
