// Revue complète — parcours ACHETEUSE (tâche #48).
// Traverse tous les écrans acheteuse avec des données mockées réalistes,
// connectée (session pré-posée en localStorage — pas d'appel réseau réel).
// Signale par écran: erreurs console, clés i18n non résolues (ex.
// "profile.title" affiché tel quel), et "undefined"/"NaN" visibles.
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
await new Promise((r) => srv.listen(4801, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'buyer-test-0000-0000-0000-000000000001';
const SHOP_A = { id: 'shop-a', slug: 'atelier-kente', name: 'Atelier Kenté', country: 'CM', city: 'Douala', status: 'active', is_verified: true, rating: 4.6, followers_count: 120, avatar_url: null };
const SHOP_B = { id: 'shop-b', slug: 'byflora-kids', name: 'ByFlora kids', country: 'CM', city: 'Yaoundé', status: 'active', is_verified: false, rating: 0, followers_count: 8, avatar_url: null };

const now = Date.now();
const mkProd = (i, shop, opts = {}) => ({
  id: `prod-${i}`, shop_id: shop.id, name: `Article démo ${i}`,
  price_fcfa: opts.quote ? 0 : 15000 + i * 500, compare_at_price_fcfa: i === 1 ? 20000 : null,
  price_on_request: !!opts.quote, images: ['/demo-products/wd-03.jpg'], video_url: opts.video ? '/demo-products/wd-03.jpg' : null,
  category: 'mode_femme', stock: opts.outOfStock ? 0 : 5, views: 12, is_active: true,
  created_at: new Date(now - i * 60000).toISOString(), sizes: ['S', 'M', 'L'], colors: ['Rouge', 'Bleu'], attributes: {},
  shops: shop, shop_name: shop.name, shop_slug: shop.slug, shop_country: shop.country,
});
const PRODUCTS = [mkProd(1, SHOP_A), mkProd(2, SHOP_A, { quote: true }), mkProd(3, SHOP_B, { video: true }), mkProd(4, SHOP_B, { outOfStock: true })];
// status contraint en base à new/confirmed/shipped/delivered/cancelled
// (orders_status_check) — un autre mot ici fait remonter un faux positif
// « clé i18n non traduite » qui n'existe pas en réalité. order_items.name
// est une vraie colonne dénormalisée (nom au moment de l'achat), à
// renseigner ici sous peine d'un faux « undefined » sur Mes commandes.
const ORDER = {
  id: 'order-1', order_no: '1042', status: 'new', shop_id: SHOP_A.id, buyer_id: USER_ID,
  total_fcfa: 30000, delivery_fcfa: 1000, created_at: new Date(now - 3600000).toISOString(),
  address: 'Rue des Fleurs, Bonapriso, Douala', full_name: 'Test Acheteuse', phone: '+237699112233',
  shops: SHOP_A, order_items: [{ id: 'item-1', product_id: 'prod-1', name: PRODUCTS[0].name, qty: 1, price_fcfa: 15000, size: 'M', color: 'Rouge', products: PRODUCTS[0] }],
};
const CONVERSATION = { id: 'conv-1', buyer_id: USER_ID, shop_id: SHOP_A.id, updated_at: new Date().toISOString(), shops: SHOP_A, last_message: 'Bonjour, article dispo ?' };
const MESSAGE = { id: 'msg-1', conversation_id: 'conv-1', sender_id: SHOP_A.id, body: 'Oui, disponible !', created_at: new Date().toISOString() };
const REEL = { id: 'reel-1', shop_id: SHOP_A.id, video_url: '/demo-products/wd-03.jpg', caption: 'Nouvelle collection', likes: 12, comments: 3, shops: SHOP_A, product_id: 'prod-1' };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Africa/Douala' });

// Session pré-posée: getSession() la lit en local, aucun appel réseau requis.
const session = {
  access_token: 'test-access-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
  user: { id: USER_ID, email: 'acheteuse@test.dev', phone: null, app_metadata: {}, user_metadata: { name: 'Test Acheteuse' }, aud: 'authenticated', created_at: new Date().toISOString() },
};
await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);

const page = await ctx.newPage();
const findings = [];
page.on('console', (m) => { if (m.type() === 'error') findings.push({ kind: 'console', text: m.text().slice(0, 200) }); });
page.on('pageerror', (e) => findings.push({ kind: 'pageerror', text: String(e).slice(0, 200) }));

await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/user**', (r) => r.fulfill({ json: session.user }));
await page.route('**/auth/v1/token**', (r) => r.fulfill({ json: session }));
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));

await page.route('**/rest/v1/rpc/home_feed_count**', (r) => r.fulfill({ json: PRODUCTS.length }));
await page.route('**/rest/v1/rpc/home_feed_page**', (r) => r.fulfill({ json: PRODUCTS }));
await page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ json: [] }));

await page.route('**/rest/v1/**', (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  let rows = [];
  if (table === 'shops') rows = [SHOP_A, SHOP_B];
  else if (table === 'products') rows = PRODUCTS;
  else if (table === 'orders') rows = [ORDER];
  else if (table === 'order_items') rows = ORDER.order_items;
  else if (table === 'conversations') rows = [CONVERSATION];
  else if (table === 'messages') rows = [MESSAGE];
  else if (table === 'reels') rows = [REEL];
  else if (table === 'profiles') rows = [{ id: USER_ID, name: 'Test Acheteuse', avatar_url: null, country: 'CM', currency: 'FCFA', created_at: new Date().toISOString() }];
  else if (table === 'favorites') rows = [];
  else if (table === 'categories') rows = [{ id: 'mode_femme', parent_id: null, kind: 'PRODUCT', label_fr: 'Mode Femme', label_en: 'Women' }];
  else if (table === 'push_subscriptions') rows = [];
  const total = rows.length;
  return route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${total}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});

const ROUTES = [
  ['/', 'Accueil'],
  ['/search', 'Recherche'],
  ['/category/mode_femme', 'Catégorie'],
  ['/product/prod-1', 'Fiche article (prix normal)'],
  ['/product/prod-2', 'Fiche article (prix sur demande)'],
  ['/product/prod-4', 'Fiche article (rupture de stock)'],
  ['/boutique/atelier-kente', 'Boutique'],
  ['/fin', 'Fin (reels)'],
  ['/services', 'Services'],
  ['/cart', 'Panier'],
  ['/checkout/shop-a', 'Checkout'],
  ['/inbox', 'Messages (liste)'],
  ['/chat/conv-1', 'Conversation'],
  ['/profile', 'Profil'],
  ['/profile/settings', 'Réglages'],
  ['/profile/edit', 'Éditer le profil'],
  ['/profile/orders', 'Mes commandes'],
  ['/profile/favorites', 'Mes favoris'],
  ['/profile/invite', 'Parrainage'],
  ['/profile/help', 'Aide'],
  ['/legal/terms', 'CGU'],
  ['/a-propos', 'À propos (public)'],
];

const report = [];
for (const [path, label] of ROUTES) {
  findings.length = 0;
  const startErrors = findings.length;
  try {
    await page.goto(`http://localhost:4801${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1400);
  } catch (e) {
    report.push({ path, label, fatal: String(e).slice(0, 200) });
    continue;
  }
  const body = await page.locator('body').innerText().catch(() => '');
  const rawKeyMatches = [...body.matchAll(/\b[a-z]+(?:\.[a-zA-Z]+){1,4}\b/g)]
    .map((m) => m[0])
    .filter((s) => /^[a-z]+\.[a-zA-Z]+/.test(s) && !/^\d/.test(s) && s.split('.').length >= 2 && s.split('.').every((p) => p.length > 1))
    // fin.finjaro@gmail.com (adresse de contact) matche le même motif qu'une
    // clé i18n non résolue — exclu explicitement plutôt que de le signaler
    // à chaque passage.
    .filter((s) => !/^fin\.finjaro$/.test(s))
    .filter((s) => /^(common|auth|product|vendor|home|profile|cart|order|shop|chat|legal|reel|fin|services|nearYou|referral|help|category|search|orderStatus)\./.test(s));
  const suspicious = [];
  if (/\bundefined\b/.test(body)) suspicious.push('« undefined » visible');
  if (/\bNaN\b/.test(body)) suspicious.push('« NaN » visible');
  if (/\[object Object\]/.test(body)) suspicious.push('« [object Object] » visible');
  if (rawKeyMatches.length) suspicious.push(`clés i18n non traduites: ${[...new Set(rawKeyMatches)].slice(0, 5).join(', ')}`);
  const shotFile = `${OUT}/${path.replace(/[/:]/g, '_') || 'home'}.png`;
  await page.screenshot({ path: shotFile }).catch(() => {});
  report.push({ path, label, consoleErrors: findings.filter((f) => f.kind === 'console').map((f) => f.text), pageErrors: findings.filter((f) => f.kind === 'pageerror').map((f) => f.text), suspicious });
}

console.log('\n=== REVUE ACHETEUSE ===\n');
for (const r of report) {
  const hasIssue = r.fatal || r.consoleErrors?.length || r.pageErrors?.length || r.suspicious?.length;
  console.log(`${hasIssue ? '⚠️ ' : '✅ '}${r.path.padEnd(24)} ${r.label}`);
  if (r.fatal) console.log(`   NAVIGATION ÉCHOUÉE: ${r.fatal}`);
  for (const e of r.consoleErrors || []) console.log(`   console: ${e}`);
  for (const e of r.pageErrors || []) console.log(`   erreur JS: ${e}`);
  for (const s of r.suspicious || []) console.log(`   ${s}`);
}

await browser.close();
srv.close();
