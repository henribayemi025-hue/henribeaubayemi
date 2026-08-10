// L'onglet Services doit montrer TOUS les prestataires par défaut, pas
// seulement ceux du pays de la personne. Beau, depuis la France, n'en voyait
// qu'un sur huit et croyait que TidalEx et Crea Lab n'avaient jamais été
// ajoutés — ils y étaient, cachés par le filtre pays.
//
// Ce contrôle vérifie précisément ça: un compte réglé sur la FRANCE doit voir
// les prestataires camerounais dès l'ouverture, sans toucher à un filtre.
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
await new Promise((r) => srv.listen(4805, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'buyer-fr-0000-0000-0000-000000000001';

// Les vraies boutiques, avec leur vrai pays ET les VRAIS identifiants de
// métiers du pivot: `isServiceShop` les compare à la liste réelle, donc un id
// invente ferait disparaitre la boutique de l'annuaire et ferait echouer le
// test pour une raison qui n'existe pas dans l'application.
const SHOPS = [
  { id: 's1', slug: 'music-live', name: 'Music live', city: 'Louveciennes', country: 'FR', status: 'active', categories: ['evenementiel_service'], followers_count: 0, rating: 0, is_verified: false },
  { id: 's2', slug: 'tidalex', name: 'TidalEx - Data Solution and Business Shop', city: 'Douala', country: 'CM', status: 'active', categories: ['informatique_digital'], followers_count: 0, rating: 0, is_verified: false },
  { id: 's3', slug: 'crea-lab', name: 'Crea Lab', city: 'Yaoundé', country: 'CM', status: 'active', categories: ['marketing_com'], followers_count: 0, rating: 0, is_verified: false },
];
const CATEGORIES = [
  { id: 'evenementiel_service', parent_id: null, kind: 'SERVICE', label_fr: 'Prestataire événementiel', label_en: 'Event provider' },
  { id: 'informatique_digital', parent_id: null, kind: 'SERVICE', label_fr: 'Informatique & Digital', label_en: 'IT & Digital' },
  { id: 'marketing_com', parent_id: null, kind: 'SERVICE', label_fr: 'Marketing & Communication', label_en: 'Marketing' },
];

const session = {
  access_token: 't', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
  user: { id: USER_ID, email: 'fr@test.dev', app_metadata: {}, user_metadata: { name: 'Test France' }, aud: 'authenticated', created_at: new Date().toISOString() },
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });
await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);
const page = await ctx.newPage();

const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/user**', (r) => r.fulfill({ json: session.user }));
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
await page.route('**/rest/v1/**', (route) => {
  const url = new URL(route.request().url());
  const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (route.request().headers()['accept'] || '').includes('vnd.pgrst.object');
  let rows = [];
  if (path === 'shops') rows = SHOPS;
  else if (path === 'categories') rows = CATEGORIES;
  // Le profil annonce la FRANCE: c'est lui qui pilotait le filtre par défaut.
  else if (path === 'profiles') rows = [{ id: USER_ID, name: 'Test France', country: 'FR', currency: 'EUR', created_at: new Date().toISOString() }];
  for (const [key, value] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset'].includes(key) || !value.startsWith('eq.')) continue;
    rows = rows.filter((r) => String(r[key]) === value.slice(3));
  }
  route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});

console.log('\n=== ANNUAIRE SERVICES, COMPTE RÉGLÉ SUR LA FRANCE ===\n');
await page.goto('http://localhost:4805/services', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(2000);
const body = await page.locator('body').innerText().catch(() => '');
await page.screenshot({ path: `${OUT}/services-tous-pays.png`, fullPage: false }).catch(() => {});

const attendus = ['TidalEx', 'Crea Lab', 'Music live'];
const manquants = attendus.filter((n) => !body.includes(n));
const ok = manquants.length === 0 && errs.length === 0;
console.log(`${ok ? '✅' : '⚠️ '} Les trois prestataires sont visibles SANS toucher au filtre`);
for (const m of manquants) console.log(`   ABSENT: ${m}`);
for (const e of errs) console.log(`   erreur JS: ${e}`);
console.log(`\n${ok ? 'CONFORME' : 'À CORRIGER'}\n`);

await browser.close();
srv.close();
