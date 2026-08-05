// Revue complète — FINIA (l'assistante IA), dernier volet de la tâche #48.
// Finia n'est pas une route: c'est une modale ouverte par le bouton flottant.
// Ce script l'exerce donc par ÉTATS réels (accueil, réponse + carrousel
// produits, boutons d'action, panne, variante vendeuse) plutôt que par URL.
// La fonction edge finou-chat est simulée: on vérifie l'interface, pas
// Gemini.
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
await new Promise((r) => srv.listen(4804, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'finia-test-0000-0000-0000-000000000001';
const SHOP = { id: 'shop-mine', owner_id: USER_ID, slug: 'atelier-test', name: 'Atelier Test', country: 'CM', city: 'Douala', status: 'active', is_verified: true, rating: 4.5, reviews_count: 6, followers_count: 30, avatar_url: null, banner_url: null, categories: ['mode_femme'], created_at: new Date().toISOString() };
const PRODUCTS = [1, 2, 3].map((i) => ({
  id: `fp-${i}`, name: `Robe wax ${i}`, price_fcfa: 12000 + i * 1000,
  images: ['/demo-products/wd-03.jpg'], category: 'mode_femme', stock: 4,
  shop_id: 'shop-a', shops: { name: 'Atelier Kenté' },
}));

// Réponses simulées de finou-chat, une par état à vérifier.
const REPLIES = {
  category: { reply: 'Voici quelques robes en wax qui pourraient te plaire.', category: 'mode_femme' },
  sell: { reply: 'Bien sûr ! Tu peux ouvrir ta boutique sur Finjaro en quelques minutes.', action: 'sell' },
  share: { reply: 'Voici le lien de ta boutique, prêt à partager.', action: 'share_shop' },
  plain: { reply: 'Les paiements se font directement avec la vendeuse, jamais en dehors de l’application.' },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const session = (id) => ({
  access_token: 'test-access-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
  user: { id, email: 'finia@test.dev', phone: null, app_metadata: {}, user_metadata: { name: 'Test' }, aud: 'authenticated', created_at: new Date().toISOString() },
});

const report = [];

// `asVendor` décide si le compte simulé possède une boutique: useVendorStatus
// renvoie 'approved' dès qu'une boutique a cet owner_id, et Finia change
// alors de raccourcis (ventes, partager la boutique, supprimer un article).
async function scenario({ name, asVendor, reply, act }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Africa/Douala' });
  const sess = session(USER_ID);
  await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(sess)]);
  const page = await ctx.newPage();
  const findings = [];
  page.on('console', (m) => { if (m.type() === 'error') findings.push({ kind: 'console', text: m.text().slice(0, 200) }); });
  page.on('pageerror', (e) => findings.push({ kind: 'pageerror', text: String(e).slice(0, 200) }));

  await page.route('**/realtime/v1/**', (r) => r.abort());
  await page.route('**/auth/v1/user**', (r) => r.fulfill({ json: sess.user }));
  await page.route('**/auth/v1/token**', (r) => r.fulfill({ json: sess }));
  await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));

  await page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    let rows = [];
    if (table === 'shops') rows = asVendor ? [SHOP] : [];
    else if (table === 'products') rows = PRODUCTS;
    else if (table === 'vendor_applications') rows = [];
    else if (table === 'profiles') rows = [{ id: USER_ID, name: 'Test', country: 'CM', currency: 'FCFA', created_at: new Date().toISOString() }];
    else if (table === 'orders') rows = [];
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
      body: JSON.stringify(single ? rows[0] ?? null : rows),
    });
  });
  await page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ json: [] }));
  await page.route('**/rest/v1/rpc/home_feed_count**', (r) => r.fulfill({ json: PRODUCTS.length }));
  await page.route('**/rest/v1/rpc/home_feed_page**', (r) => r.fulfill({ json: PRODUCTS }));

  // `reply: null` = la fonction tombe en panne, pour vérifier le message
  // d'erreur et le bouton Réessayer plutôt que de supposer qu'ils marchent.
  await page.route('**/functions/v1/finou-chat**', (route) => {
    if (!reply) return route.fulfill({ status: 500, json: { error: 'boom' } });
    return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, json: reply });
  });

  await page.goto('http://localhost:4804/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1200);
  // Le bouton flottant porte l'aria-label "Finia" (finou.title).
  await page.getByRole('button', { name: 'Finia', exact: false }).first().click();
  await page.waitForTimeout(700);
  if (act) await act(page);
  await page.waitForTimeout(1200);

  const body = await page.locator('body').innerText().catch(() => '');
  const suspicious = [];
  if (/\bundefined\b/.test(body)) suspicious.push('« undefined » visible');
  if (/\bNaN\b/.test(body)) suspicious.push('« NaN » visible');
  if (/\[object Object\]/.test(body)) suspicious.push('« [object Object] » visible');
  const rawKeys = [...body.matchAll(/\b[a-z]+(?:\.[a-zA-Z]+){1,4}\b/g)].map((m) => m[0])
    .filter((s) => !/^fin\.finjaro$/.test(s))
    .filter((s) => /^(finou|finouWizard|finouDelete|common|mirror|categories|product|home)\./.test(s));
  if (rawKeys.length) suspicious.push(`clés i18n non traduites: ${[...new Set(rawKeys)].join(', ')}`);

  await page.screenshot({ path: `${OUT}/finia_${name}.png` }).catch(() => {});
  report.push({
    name,
    consoleErrors: findings.filter((f) => f.kind === 'console').map((f) => f.text),
    pageErrors: findings.filter((f) => f.kind === 'pageerror').map((f) => f.text),
    suspicious,
  });
  await ctx.close();
}

const ask = (text) => async (page) => {
  await page.locator('input.input').last().fill(text);
  await page.getByRole('button', { name: 'Envoyer', exact: false }).first().click();
};

await scenario({ name: '1-accueil-acheteuse', asVendor: false, reply: REPLIES.plain });
await scenario({ name: '2-reponse-carrousel', asVendor: false, reply: REPLIES.category, act: ask('Je cherche une robe en wax') });
await scenario({ name: '3-action-vendre', asVendor: false, reply: REPLIES.sell, act: ask('Je veux vendre sur Finjaro') });
await scenario({ name: '4-panne-reessayer', asVendor: false, reply: null, act: ask('Bonjour') });
await scenario({ name: '5-accueil-vendeuse', asVendor: true, reply: REPLIES.plain });
await scenario({ name: '6-partager-boutique', asVendor: true, reply: REPLIES.share, act: ask('Partage ma boutique') });

console.log('\n=== REVUE FINIA ===\n');
for (const r of report) {
  const hasIssue = r.consoleErrors?.length || r.pageErrors?.length || r.suspicious?.length;
  console.log(`${hasIssue ? '⚠️ ' : '✅ '}${r.name}`);
  for (const e of r.consoleErrors || []) console.log(`   console: ${e}`);
  for (const e of r.pageErrors || []) console.log(`   erreur JS: ${e}`);
  for (const s of r.suspicious || []) console.log(`   ${s}`);
}

await browser.close();
srv.close();
