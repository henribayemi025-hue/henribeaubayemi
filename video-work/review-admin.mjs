// Revue complète — console d'ADMINISTRATION (tâche #48, dernier volet après
// acheteuse et vendeuse). Build séparé (dist-admin/, voir
// vite.admin.config.js) servi sur son propre domaine (admin.finjaro.net) —
// exécuter `npm run build:admin` avant ce script si dist-admin/ est absent
// ou périmé. Même méthode que review-buyer.mjs/review-vendor.mjs: session
// pré-posée en localStorage, mock REST filtré par id/eq/status, scan de
// "undefined"/"NaN"/clés i18n non résolues.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist-admin';
const OUT = '/home/user/henribeaubayemi/video-work/review-shots';
mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4803, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'admin-test-0000-0000-0000-000000000001';
const PROFILE = { id: USER_ID, name: 'Admin Test', avatar_url: null, is_admin: true, is_vendor: false, is_suspended: false, country: 'CM', city: 'Douala', phone: '+237600000000', report_count: 0, referral_code: 'ADMIN1', created_at: new Date().toISOString(), locale: 'fr', currency: 'FCFA' };

const now = Date.now();
const SHOP = { id: 'shop-a', slug: 'atelier-kente', name: 'Atelier Kenté', avatar_url: null, city: 'Douala', country: 'CM', status: 'active', is_verified: true, followers_count: 120, rating: 4.6, reviews_count: 14, created_at: new Date(now - 90 * 86400000).toISOString(), owner_id: 'vendor-1', categories: ['mode_femme'], phone: '+237699112233', whatsapp: '+237699112233', profiles: { name: 'Vendeuse Test', phone: '+237699112233', is_suspended: false } };
// Colonnes réelles de la fonction SQL admin_shop_stats() (vérifiées via
// pg_get_functiondef) — un nom différent ici masquerait un vrai souci de
// nommage plutôt que d'en signaler un faux.
const SHOP_STATS = { shop_id: SHOP.id, orders_total: 12, orders_pending: 2, orders_delivered: 9, revenue_fcfa: 340000, products_total: 9, last_order_at: new Date(now - 3600000).toISOString() };
const SHOP_ORDER = { id: 'so-1', order_no: '1042', status: 'delivered', total_fcfa: 30000, created_at: new Date(now - 86400000).toISOString(), buyer_name: 'Test Acheteuse', delivery_method: 'delivery' };

// deletion_requested_at/reason renseignés: couvre la fiche « suppression de
// compte » (badge + encart rouge + bouton "marquer comme traité") ajoutée
// pour la demande d'effacement (CGU art. 20).
const USER_ROW = { id: 'user-2', name: 'Cliente Test', phone: '+237677889900', city: 'Yaoundé', country: 'CM', is_vendor: false, is_admin: false, is_suspended: false, report_count: 0, created_at: new Date(now - 30 * 86400000).toISOString(), referral_code: 'ABC123', deletion_requested_at: new Date(now - 3600000).toISOString(), deletion_reason: 'Je n’utilise plus l’application' };

const ORDER = { id: 'ao-1', order_no: '1050', status: 'shipped', total_fcfa: 22000, created_at: new Date(now - 3600000).toISOString(), buyer_name: 'Test Acheteuse', buyer_phone: '+237699000000', delivery_method: 'delivery', city: 'Douala', cancel_reason: null, shops: { name: SHOP.name }, order_items: [{ name: 'Robe wax', qty: 1 }] };

// reports.status: pending/resolved/dismissed (pas de CHECK en base mais
// admin.reportStatus.* n'a que ces 3 clés — un autre mot afficherait la clé
// brute sans qu'il s'agisse d'un vrai bug).
const REPORT = { id: 'rep-1', target_type: 'shop', target_id: SHOP.id, reason: 'Photos non conformes au produit reçu', status: 'pending', created_at: new Date(now - 7200000).toISOString(), resolved_at: null, reporter: { name: 'Cliente Test' } };

const ANNOUNCEMENT = { id: 'ann-1', active: true, label: 'Promo rentrée', text_fr: 'Livraison offerte ce week-end', text_en: 'Free delivery this weekend', href: '/category/mode_femme' };
// vendor_applications.status: pending/approved/rejected (CHECK en base).
const APPLICATION = { id: 'app-1', user_id: 'user-3', shop_name: 'Nouvelle Boutique', first_name: 'Awa', last_name: 'Test', phone: '+237655443322', country: 'CM', city: 'Douala', id_front_url: '/demo-products/wd-03.jpg', id_back_url: '/demo-products/wd-03.jpg', status: 'pending', created_at: new Date(now - 86400000).toISOString() };

const TOP_PRODUCT = { id: 'prod-1', name: 'Article démo 1', images: ['/demo-products/wd-03.jpg'], price_fcfa: 15500, views: 340 };
const VISIT_EVENT = { id: 1, created_at: new Date(now - 600000).toISOString(), user_id: USER_ID, profiles: { name: 'Cliente Test' } };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Africa/Douala' });

const session = {
  access_token: 'test-access-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
  user: { id: USER_ID, email: 'admin@test.dev', phone: null, app_metadata: {}, user_metadata: { name: 'Admin Test' }, aud: 'authenticated', created_at: new Date().toISOString() },
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

// Playwright teste les routes dans l'ordre INVERSE de leur enregistrement
// (la dernière enregistrée est testée en premier) — le catch-all générique
// doit donc être enregistré AVANT les routes RPC spécifiques, sinon il les
// masque silencieusement (déjà vu dans test-onreq.mjs : un souci de mock,
// pas de l'appli, mais qui fait passer un vrai écran à côté de la revue).
// Filtré par id/status/type comme sur le mock vendeuse — un mock qui
// renvoie toujours rows[0] cache les vrais soucis de filtrage.
await page.route('**/rest/v1/**', (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  const params = url.searchParams;
  let rows = [];
  // AdminUsers charge TOUS les profils sans filtre id — un mock qui ne
  // renvoyait que [PROFILE] dans ce cas cachait la seconde utilisatrice
  // (celle avec une demande de suppression) de la liste des Comptes.
  if (table === 'profiles') {
    if (params.get('id')?.includes(USER_ID)) rows = [PROFILE];
    else if (!params.get('id')) rows = [PROFILE, USER_ROW];
    else rows = [USER_ROW];
  }
  else if (table === 'shops') rows = [SHOP];
  else if (table === 'orders') {
    const shopFilter = params.get('shop_id');
    rows = shopFilter ? [SHOP_ORDER] : [ORDER];
  } else if (table === 'products') rows = [TOP_PRODUCT];
  else if (table === 'events') rows = [VISIT_EVENT];
  else if (table === 'reports') rows = [REPORT];
  else if (table === 'announcements') rows = [ANNOUNCEMENT];
  else if (table === 'vendor_applications') rows = [APPLICATION];
  else if (table === 'ai_usage') rows = [{ cost_eur: 3.2 }];
  const total = rows.length;
  return route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${total}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});
await page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ json: [] }));
await page.route('**/rest/v1/rpc/admin_shop_stats**', (r) => r.fulfill({ json: [SHOP_STATS] }));

const SECTIONS = [
  ['/?s=overview', 'Vue d’ensemble'],
  ['/?s=shops', 'Boutiques'],
  ['/?s=users', 'Utilisateurs'],
  ['/?s=orders', 'Commandes'],
  ['/?s=moderation', 'Modération'],
  ['/?s=content', 'Contenu'],
];

const report = [];
for (const [path, label] of SECTIONS) {
  findings.length = 0;
  try {
    await page.goto(`http://localhost:4803${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
  } catch (e) {
    report.push({ path, label, fatal: String(e).slice(0, 200) });
    continue;
  }
  const body = await page.locator('body').innerText().catch(() => '');
  const rawKeyMatches = [...body.matchAll(/\b[a-z]+(?:\.[a-zA-Z]+){1,4}\b/g)]
    .map((m) => m[0])
    .filter((s) => /^[a-z]+\.[a-zA-Z]+/.test(s) && !/^\d/.test(s) && s.split('.').length >= 2 && s.split('.').every((p) => p.length > 1))
    .filter((s) => !/^fin\.finjaro$/.test(s))
    .filter((s) => /^(admin|common|auth)\./.test(s));
  const suspicious = [];
  if (/\bundefined\b/.test(body)) suspicious.push('« undefined » visible');
  if (/\bNaN\b/.test(body)) suspicious.push('« NaN » visible');
  if (/\[object Object\]/.test(body)) suspicious.push('« [object Object] » visible');
  if (rawKeyMatches.length) suspicious.push(`clés i18n non traduites: ${[...new Set(rawKeyMatches)].slice(0, 5).join(', ')}`);
  const shotFile = `${OUT}/admin${path.replace(/[/:?=]/g, '_')}.png`;
  await page.screenshot({ path: shotFile }).catch(() => {});
  report.push({ path, label, consoleErrors: findings.filter((f) => f.kind === 'console').map((f) => f.text), pageErrors: findings.filter((f) => f.kind === 'pageerror').map((f) => f.text), suspicious });
}

// La fiche boutique (ShopSheet) est une modale ouverte au tap, pas une
// route à elle — le scan par écran ci-dessus ne l'exerce jamais. Elle
// concentre pourtant les vraies actions admin (certifier, suspendre), donc
// un passage dédié plutôt que de la laisser hors revue.
findings.length = 0;
let sheetSuspicious = [];
try {
  await page.goto('http://localhost:4803/?s=shops', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.getByText(SHOP.name, { exact: false }).first().click();
  await page.waitForTimeout(1000);
  const sheetBody = await page.locator('body').innerText().catch(() => '');
  if (/\bundefined\b/.test(sheetBody)) sheetSuspicious.push('« undefined » visible');
  if (/\bNaN\b/.test(sheetBody)) sheetSuspicious.push('« NaN » visible');
  if (/\[object Object\]/.test(sheetBody)) sheetSuspicious.push('« [object Object] » visible');
  const rawKeys = [...sheetBody.matchAll(/\b[a-z]+(?:\.[a-zA-Z]+){1,4}\b/g)].map((m) => m[0])
    .filter((s) => /^(admin|becomeVendor)\./.test(s));
  if (rawKeys.length) sheetSuspicious.push(`clés i18n non traduites: ${[...new Set(rawKeys)].join(', ')}`);
  await page.screenshot({ path: `${OUT}/admin__shop_sheet.png` }).catch(() => {});
} catch (e) {
  sheetSuspicious.push(`échec: ${String(e).slice(0, 200)}`);
}
report.push({
  path: '/?s=shops (fiche)', label: 'Fiche boutique (modale)',
  consoleErrors: findings.filter((f) => f.kind === 'console').map((f) => f.text),
  pageErrors: findings.filter((f) => f.kind === 'pageerror').map((f) => f.text),
  suspicious: sheetSuspicious,
});

// Fiche « demande de suppression de compte » (badge liste + encart rouge +
// bouton « marquer comme traité ») — même logique que la fiche boutique.
findings.length = 0;
let delSuspicious = [];
try {
  await page.goto('http://localhost:4803/?s=users', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.getByText(USER_ROW.name, { exact: false }).first().click();
  await page.waitForTimeout(1000);
  const delBody = await page.locator('body').innerText().catch(() => '');
  if (!delBody.includes(USER_ROW.deletion_reason)) delSuspicious.push('raison de suppression absente de la fiche');
  if (/\bundefined\b/.test(delBody)) delSuspicious.push('« undefined » visible');
  if (/\[object Object\]/.test(delBody)) delSuspicious.push('« [object Object] » visible');
  const rawKeys = [...delBody.matchAll(/\b[a-z]+(?:\.[a-zA-Z]+){1,4}\b/g)].map((m) => m[0])
    .filter((s) => /^(admin|becomeVendor)\./.test(s));
  if (rawKeys.length) delSuspicious.push(`clés i18n non traduites: ${[...new Set(rawKeys)].join(', ')}`);
  await page.screenshot({ path: `${OUT}/admin__deletion_sheet.png` }).catch(() => {});
} catch (e) {
  delSuspicious.push(`échec: ${String(e).slice(0, 200)}`);
}
report.push({
  path: '/?s=users (suppression)', label: 'Fiche demande de suppression (modale)',
  consoleErrors: findings.filter((f) => f.kind === 'console').map((f) => f.text),
  pageErrors: findings.filter((f) => f.kind === 'pageerror').map((f) => f.text),
  suspicious: delSuspicious,
});

console.log('\n=== REVUE ADMIN ===\n');
for (const r of report) {
  const hasIssue = r.fatal || r.consoleErrors?.length || r.pageErrors?.length || r.suspicious?.length;
  console.log(`${hasIssue ? '⚠️ ' : '✅ '}${r.path.padEnd(20)} ${r.label}`);
  if (r.fatal) console.log(`   NAVIGATION ÉCHOUÉE: ${r.fatal}`);
  for (const e of r.consoleErrors || []) console.log(`   console: ${e}`);
  for (const e of r.pageErrors || []) console.log(`   erreur JS: ${e}`);
  for (const s of r.suspicious || []) console.log(`   ${s}`);
}

await browser.close();
srv.close();
