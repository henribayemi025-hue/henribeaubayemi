// La visite guidée doit s'ouvrir pour un compte QUI VIENT d'être créé, et
// rester invisible pour tous les autres. Beau: « je viens de créer un compte
// et nulle part on ne m'a proposé la tournée de l'app ».
//
// Trois cas, parce que se tromper dans un sens comme dans l'autre est grave:
// ne pas s'afficher = le manque signalé; s'afficher à un habitué = un écran
// qui bloque le passage pour rien.
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
await new Promise((r) => srv.listen(4807, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'new-user-0000-0000-0000-000000000001';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function run({ label, ageMs, expectVisible, shot, priorKeys = {}, query = '' }) {
  const createdAt = new Date(Date.now() - ageMs).toISOString();
  const session = {
    access_token: 't', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
    user: { id: USER_ID, email: 'new@test.dev', app_metadata: {}, user_metadata: { name: 'Awa Mbala' }, aud: 'authenticated', created_at: createdAt },
  };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);
  // Traces laissées dans CE navigateur par un AUTRE compte — le cas de Beau,
  // et celui d'un telephone partagé par plusieurs personnes.
  if (Object.keys(priorKeys).length) {
    await ctx.addInitScript((pairs) => {
      for (const [k, v] of pairs) localStorage.setItem(k, v);
    }, Object.entries(priorKeys));
  }
  const page = await ctx.newPage();
  await page.route('**/realtime/v1/**', (r) => r.abort());
  await page.route('**/auth/v1/user**', (r) => r.fulfill({ json: session.user }));
  await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
  await page.route('**/rest/v1/**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (route.request().headers()['accept'] || '').includes('vnd.pgrst.object');
    let rows = [];
    if (path === 'profiles') rows = [{ id: USER_ID, name: 'Awa Mbala', country: 'CM', currency: 'FCFA', created_at: createdAt }];
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': `0-0/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
      body: JSON.stringify(single ? rows[0] ?? null : rows),
    });
  });

  await page.goto(`http://localhost:4807/${query}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2200);
  const body = await page.locator('body').innerText().catch(() => '');
  if (shot) await page.screenshot({ path: `${OUT}/${shot}.png` }).catch(() => {});
  const visible = body.includes('Je viens acheter') && body.includes('Je viens vendre');
  const ok = visible === expectVisible;
  console.log(`${ok ? '✅' : '⚠️ '} ${label} — attendu ${expectVisible ? 'VISIBLE' : 'ABSENT'}, obtenu ${visible ? 'VISIBLE' : 'ABSENT'}`);
  await ctx.close();
  return ok;
}

console.log('\n=== VISITE GUIDÉE APRÈS INSCRIPTION ===\n');
let allOk = true;
allOk &= await run({ label: "Compte cree il y a 2 minutes", ageMs: 2 * 60 * 1000, expectVisible: true, shot: 'welcome-nouveau-compte' });
allOk &= await run({ label: 'Compte cree il y a 5 jours', ageMs: 5 * 24 * 3600 * 1000, expectVisible: false });
// Le bug signale par Beau: navigateur deja marque par son compte habituel.
allOk &= await run({
  label: 'Compte neuf, navigateur deja marque par un autre compte',
  ageMs: 2 * 60 * 1000, expectVisible: true,
  priorKeys: { 'finjaro:welcome-seen': '1', 'finjaro:welcome-seen:un-autre-compte': '1' },
});
// Et l'inverse doit rester vrai: qui a deja ecarte la visite ne la revoit pas.
allOk &= await run({
  label: 'Compte neuf qui a deja ecarte la visite',
  ageMs: 2 * 60 * 1000, expectVisible: false,
  priorKeys: { [`finjaro:welcome-seen:${USER_ID}`]: '1' },
});
// La porte de secours ?tour=1 doit passer outre l'age ET la marque, sinon
// Beau ne peut rien verifier depuis son telephone.
allOk &= await run({
  label: '?tour=1 sur un vieux compte deja marque',
  ageMs: 30 * 24 * 3600 * 1000, expectVisible: true, query: '?tour=1',
  priorKeys: { [`finjaro:welcome-seen:${USER_ID}`]: '1' },
});
console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);

await browser.close();
srv.close();
