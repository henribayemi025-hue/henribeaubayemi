// Finjaro est une place de marche MONDIALE. Beau, 10/08:
//
//   « Quelqu'un en Angleterre, ca signale en monnaie d'Angleterre. Quelqu'un
//     au Cameroun, les prix du Cameroun. Un prix par defaut en FCFA comme tu
//     faisais, je ne veux plus jamais entendre ca. »
//
// Le Cameroun est la strategie de demarrage, pas l'identite du produit.
//
// Ce test verifie donc la meme boutique dans quatre pays, dont un qui n'a
// jamais figure dans la table des devises. Il couvre aussi les deux autres
// defauts signales par la capture de Maison NGC: le « 0,00 » a la place de
// « prix sur demande », et les brouillons introuvables apres un ajout.
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
const USER_ID = 'vendor-0000-0000-0000-000000000001';
const SHOP_ID = 'shop-0000-0000-0000-000000000001';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let allOk = true;
const check = (ok, label, detail = '') => { allOk &= ok; console.log(`${ok ? '✅' : '⚠️ '} ${label}${detail ? ` — ${detail}` : ''}`); };

async function open({ country, url = '/vendor/products', drafts = false }) {
  const products = drafts
    ? [{ id: 'd1', shop_id: SHOP_ID, name: 'Boubou', price_fcfa: 3000, price_on_request: false, category: 'femme_robes', images: [], stock: 1, is_active: false, rotated_at: null, views: 0 }]
    : [
        { id: 'p1', shop_id: SHOP_ID, name: 'Robes', price_fcfa: 6560, price_on_request: false, category: 'femme_robes', images: [], stock: 1, is_active: true, rotated_at: null, views: 0 },
        { id: 'p2', shop_id: SHOP_ID, name: 'Robe simple', price_fcfa: 0, price_on_request: true, category: 'femme_robes', images: [], stock: 1, is_active: true, rotated_at: null, views: 0 },
      ];
  const shop = { id: SHOP_ID, owner_id: USER_ID, name: 'Boutique', slug: 'boutique-x', country, status: 'approved', is_active: true };

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });
  await ctx.addInitScript(([k, v]) => {
    localStorage.setItem(k, v);
    localStorage.setItem('finjaro:intro-seen', '1');
    // Le pire cas: le telephone est convaincu d'etre ailleurs que la boutique.
    localStorage.setItem('finjaro_currency', 'EUR');
    localStorage.setItem('finjaro_country', 'FR');
  }, [`sb-${PROJECT_REF}-auth-token`, JSON.stringify({
    access_token: 't', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
    user: { id: USER_ID, email: 'v@test.dev', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date(Date.now() - 30 * 864e5).toISOString() },
  })]);

  const page = await ctx.newPage();
  await page.route('**/realtime/v1/**', (r) => r.abort());
  await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
  await page.route('**/rest/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (route.request().headers()['accept'] || '').includes('vnd.pgrst.object');
    let rows = [];
    if (path === 'profiles') rows = [{ id: USER_ID, name: 'Vendeuse', country, created_at: new Date().toISOString() }];
    else if (path === 'shops') rows = [shop];
    else if (path === 'products') rows = products;
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': `0-0/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
      body: JSON.stringify(single ? rows[0] ?? null : rows),
    });
  });

  await page.goto(`http://localhost:4809${url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  // `Intl.NumberFormat` en francais utilise une espace insecable ETROITE
  // (U+202F) pour les milliers: chercher « 6 560 » tape au clavier ne trouve
  // rien sans cette normalisation, et le test echouerait sur un affichage juste.
  const body = (await page.locator('body').innerText()).replace(/[  ]/g, ' ');
  return { ctx, page, body };
}

console.log('\n=== LA MEME BOUTIQUE, QUATRE PAYS ===\n');

// Le telephone dit toujours « France / euros ». C'est la boutique qui decide.
const CASES = [
  { country: 'CM', attendu: 'FCFA', interdit: ['€', '£', '$'], label: 'Cameroun' },
  { country: 'GB', attendu: '£', interdit: ['FCFA', '€'], label: 'Angleterre' },
  { country: 'US', attendu: '$', interdit: ['FCFA', '€'], label: 'Etats-Unis' },
  // Le Canada n'a jamais figure dans l'ancienne table: il tombait donc en
  // FCFA. C'est precisement le defaut que Beau a interdit.
  { country: 'CA', attendu: '$', interdit: ['FCFA'], label: 'Canada (hors ancienne table)' },
];

for (const c of CASES) {
  const { ctx, body } = await open({ country: c.country });
  const found = body.includes(c.attendu);
  const leak = c.interdit.find((x) => body.includes(x));
  check(found && !leak, `${c.label} → ${c.attendu}`, leak ? `« ${leak} » s'affiche encore` : '');
  if (c.country === 'CM') {
    check(body.includes('Prix sur demande'), '« Prix sur demande » remplace le 0');
    check(!/\b0\s*(FCFA|€|\$|£)/.test(body), 'Aucun article annonce a zero');
  }
  await ctx.close();
}

console.log('\n=== LES BROUILLONS SE TROUVENT ===\n');
{
  const { ctx, page, body } = await open({ country: 'CM', url: '/vendor/products?tab=drafts', drafts: true });
  check(body.includes('Boubou'), "L'article ajoute est bien a l'ecran");
  check(body.includes("ne sont pas encore visibles"), 'On explique ce que « brouillon » veut dire');
  check(body.includes('Publier'), 'Un bouton publier est disponible');
  await page.screenshot({ path: `${OUT}/vendeur-brouillons.png` });
  await ctx.close();
}

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close();
srv.close();
