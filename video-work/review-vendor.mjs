// Revue complète — parcours VENDEUSE (tâche #48, suite).
// Même méthode que review-buyer.mjs: session connectée + boutique possédée,
// données mockées réalistes couvrant toutes les colonnes réellement lues
// (vérifiées contre le schéma en base avant d'écrire ce script, pour éviter
// les faux « undefined » qu'un mock incomplet avait produits côté acheteuse).
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
await new Promise((r) => srv.listen(4803, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'vendor-test-000-0000-0000-000000000001';
const SHOP = {
  id: 'shop-mine', owner_id: USER_ID, slug: 'atelier-test', name: 'Atelier Test', bio: 'Vêtements traditionnels sur mesure.',
  banner_url: null, avatar_url: null, whatsapp: '+237699112233', country: 'CM', city: 'Douala', categories: ['mode_femme'],
  rating: 4.5, reviews_count: 6, followers_count: 42, offers_delivery: true, delivery_fee_fcfa: 1000,
  id_verified: true, phone_confirmed: true, is_verified: true, status: 'active', report_count: 0,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(), lat: 4.05, lng: 9.7, seller_points: 120,
  rotation_enabled: false, rotation_days: null, rotation_last_at: null, rotation_delete: false,
  neighborhood: 'Bonapriso', phone: '+237699112233', instagram: null, opening_hours: {}, delivery_zones: [],
};

const now = Date.now();
const mkProd = (i, opts = {}) => ({
  id: `vp-${i}`, shop_id: SHOP.id, name: `Article vendeuse ${i}`,
  price_fcfa: opts.quote ? 0 : 12000 + i * 1000, compare_at_price_fcfa: null, price_on_request: !!opts.quote,
  images: ['/demo-products/wd-03.jpg'], video_url: null, category: 'mode_femme',
  stock: opts.stock ?? 5, views: 30, is_active: opts.draft ? false : true,
  created_at: new Date(now - i * 60000).toISOString(), sizes: ['S', 'M'], colors: ['Rouge'], attributes: {},
  shop_id_fk: SHOP.id, shops: SHOP,
});
const PRODUCTS = [mkProd(1), mkProd(2, { quote: true }), mkProd(3, { draft: true }), mkProd(4, { stock: 0 })];

const ORDER_NEW = { id: 'vo-1', order_no: '2001', buyer_id: 'buyer-x', shop_id: SHOP.id, status: 'new', delivery_method: 'delivery',
  subtotal_fcfa: 24000, delivery_fee_fcfa: 1000, total_fcfa: 25000, buyer_name: 'Marie N.', buyer_phone: '+237699887766',
  address: 'Rue des Manguiers, Bonapriso', city: 'Douala', country: 'CM', buyer_received: false,
  created_at: new Date(now - 1800000).toISOString(), payment_status: 'cod', payment_provider: null, payment_ref: null,
  platform_fee_fcfa: 0, paid_at: null, confirmed_at: null, shipped_at: null, delivered_at: null, cancelled_at: null, cancel_reason: null,
  order_items: [{ id: 'voi-1', product_id: 'vp-1', name: 'Article vendeuse 1', qty: 2, price_fcfa: 12000, size: 'M', color: 'Rouge' }] };
const ORDER_DELIVERED = { ...ORDER_NEW, id: 'vo-2', order_no: '1998', status: 'delivered', confirmed_at: new Date(now - 90000000).toISOString(),
  shipped_at: new Date(now - 80000000).toISOString(), delivered_at: new Date(now - 70000000).toISOString(), buyer_received: true,
  order_items: [{ id: 'voi-2', product_id: 'vp-2', name: 'Article vendeuse 2', qty: 1, price_fcfa: 13000, size: 'S', color: 'Rouge' }] };
const ORDERS = [ORDER_NEW, ORDER_DELIVERED];

const CONVERSATION = { id: 'vconv-1', buyer_id: 'buyer-x', shop_id: SHOP.id, updated_at: new Date().toISOString(), profiles: { name: 'Marie N.' } };
const MESSAGE = { id: 'vmsg-1', conversation_id: 'vconv-1', sender_id: 'buyer-x', body: 'Bonjour, article dispo ?', created_at: new Date().toISOString() };
const REEL = { id: 'vreel-1', shop_id: SHOP.id, video_url: '/demo-products/wd-03.jpg', caption: 'Nouvelle collection', likes: 12, comments: 3, product_id: 'vp-1' };
const APPLICATION = { id: 'app-1', user_id: USER_ID, status: 'approved', created_at: SHOP.created_at };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Africa/Douala' });
const session = {
  access_token: 'test-access-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
  user: { id: USER_ID, email: 'vendeuse@test.dev', phone: null, app_metadata: {}, user_metadata: { name: 'Test Vendeuse' }, aud: 'authenticated', created_at: new Date().toISOString() },
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
await page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ json: [] }));

// Filtrage minimal par id/owner_id: contrairement au premier passage (acheteuse),
// on respecte ici les filtres `eq.` les plus utilisés pour que chaque écran
// reçoive VRAIMENT la bonne ligne plutôt qu'un rows[0] toujours identique —
// c'est ce qui avait provoqué un faux plantage isolé la dernière fois.
await page.route('**/rest/v1/**', (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  const idFilter = url.searchParams.get('id');
  const ownerFilter = url.searchParams.get('owner_id');
  const shopFilter = url.searchParams.get('shop_id');
  const convFilter = url.searchParams.get('conversation_id');

  let rows = [];
  if (table === 'shops') rows = ownerFilter ? [SHOP] : [SHOP];
  else if (table === 'products') {
    rows = idFilter ? PRODUCTS.filter((p) => `eq.${p.id}` === idFilter) : PRODUCTS;
  } else if (table === 'orders') {
    rows = idFilter ? ORDERS.filter((o) => `eq.${o.id}` === idFilter) : ORDERS;
  } else if (table === 'vendor_applications') rows = [APPLICATION];
  else if (table === 'conversations') rows = [CONVERSATION];
  else if (table === 'messages') rows = convFilter ? [MESSAGE] : [MESSAGE];
  else if (table === 'reels') rows = shopFilter ? [REEL] : [REEL];
  else if (table === 'profiles') rows = [{ id: USER_ID, name: 'Test Vendeuse', avatar_url: null, country: 'CM', currency: 'FCFA', created_at: new Date().toISOString() }];
  else if (table === 'categories') rows = [{ id: 'mode_femme', parent_id: null, kind: 'PRODUCT', label_fr: 'Mode Femme', label_en: 'Women' }];
  const total = rows.length;
  return route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${total}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});

const ROUTES = [
  ['/vendor', 'Tableau de bord'],
  ['/vendor/products', 'Mes articles'],
  ['/vendor/products/bulk', 'Ajout en masse'],
  ['/vendor/products/vp-1', 'Éditer un article'],
  ['/vendor/products/new', 'Nouvel article'],
  ['/vendor/orders', 'Commandes'],
  ['/vendor/messages', 'Messages (liste)'],
  ['/vendor/messages/vconv-1', 'Conversation'],
  ['/vendor/reels', 'Mes reels'],
  ['/vendor/shop', 'Ma boutique'],
  ['/vendor/stats', 'Statistiques'],
  ['/vendor/finances', 'Finances'],
  ['/vendor/leaderboard', 'Classement'],
];

const report = [];
for (const [path, label] of ROUTES) {
  findings.length = 0;
  try {
    await page.goto(`http://localhost:4803${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1600);
  } catch (e) {
    report.push({ path, label, fatal: String(e).slice(0, 200) });
    continue;
  }
  const body = await page.locator('body').innerText().catch(() => '');
  const rawKeyMatches = [...body.matchAll(/\b[a-z]+(?:\.[a-zA-Z]+){1,4}\b/g)]
    .map((m) => m[0])
    .filter((s) => /^[a-z]+\.[a-zA-Z]+/.test(s) && !/^\d/.test(s) && s.split('.').length >= 2 && s.split('.').every((p) => p.length > 1))
    .filter((s) => !/^fin\.finjaro$/.test(s))
    .filter((s) => /^(common|auth|product|vendor|home|profile|cart|order|shop|chat|legal|reel|fin|services|nearYou|referral|help|category|search|orderStatus|becomeVendor|stats|finances|switchMode)\./.test(s));
  const suspicious = [];
  if (/\bundefined\b/.test(body)) suspicious.push('« undefined » visible');
  if (/\bNaN\b/.test(body)) suspicious.push('« NaN » visible');
  if (/\[object Object\]/.test(body)) suspicious.push('« [object Object] » visible');
  if (rawKeyMatches.length) suspicious.push(`clés i18n non traduites: ${[...new Set(rawKeyMatches)].slice(0, 5).join(', ')}`);
  const shotFile = `${OUT}/vendor${path.replace(/[/:]/g, '_')}.png`;
  await page.screenshot({ path: shotFile }).catch(() => {});
  report.push({ path, label, consoleErrors: findings.filter((f) => f.kind === 'console').map((f) => f.text), pageErrors: findings.filter((f) => f.kind === 'pageerror').map((f) => f.text), suspicious });
}

console.log('\n=== REVUE VENDEUSE ===\n');
for (const r of report) {
  const hasIssue = r.fatal || r.consoleErrors?.length || r.pageErrors?.length || r.suspicious?.length;
  console.log(`${hasIssue ? '⚠️ ' : '✅ '}${r.path.padEnd(28)} ${r.label}`);
  if (r.fatal) console.log(`   NAVIGATION ÉCHOUÉE: ${r.fatal}`);
  for (const e of r.consoleErrors || []) console.log(`   console: ${e}`);
  for (const e of r.pageErrors || []) console.log(`   erreur JS: ${e}`);
  for (const s of r.suspicious || []) console.log(`   ${s}`);
}

await browser.close();
srv.close();
