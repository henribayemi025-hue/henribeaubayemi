// Vérifie le correctif du 07/08 sur `lazyWithReload` (src/App.jsx).
//
// Le scénario réel: l'app est ouverte depuis des jours, un déploiement passe,
// un chunk disparaît. Le premier échec doit recharger la page; le drapeau
// posé à ce moment-là doit être RETIRÉ dès qu'un import réussit, sinon le
// déploiement suivant n'a plus droit à sa tentative de secours et l'écran
// part en erreur (c'est ce qui est arrivé à une vendeuse le 07/08).
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const KEY = 'finjaro-chunk-reload';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4808, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
const page = await ctx.newPage();
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'content-range': '0-0/0' }, body: '[]' }));

let ok = true;
const check = (label, pass) => { console.log(`${pass ? '✅' : '❌'} ${label}`); if (!pass) ok = false; };

// 1. Un drapeau resté d'un déploiement précédent doit être effacé dès qu'un
//    écran se charge normalement — c'est tout l'objet du correctif.
await page.addInitScript((k) => sessionStorage.setItem(k, '1'), KEY);
await page.goto('http://localhost:4808/legal/terms', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('h2', { timeout: 15000 });
check('drapeau périmé effacé après un import réussi', await page.evaluate((k) => sessionStorage.getItem(k) === null, KEY));

// 2. Un chunk introuvable (le déploiement qui vient de passer) doit poser le
//    drapeau ET recharger la page une fois.
const page2 = await ctx.newPage();
await page2.route('**/realtime/v1/**', (r) => r.abort());
await page2.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'content-range': '0-0/0' }, body: '[]' }));
let navigations = 0;
page2.on('framenavigated', (f) => { if (f === page2.mainFrame()) navigations += 1; });
// On casse UNIQUEMENT le chunk de l'écran visé, comme un déploiement le ferait.
await page2.route('**/assets/About-*.js', (r) => r.fulfill({ status: 404, body: '' }));
await page2.goto('http://localhost:4808/a-propos', { waitUntil: 'domcontentloaded' });
await page2.waitForTimeout(3000);
check('chunk manquant → rechargement déclenché', navigations >= 2);
check('drapeau posé pendant la panne', await page2.evaluate((k) => sessionStorage.getItem(k) === '1', KEY));

await browser.close();
srv.close();
process.exit(ok ? 0 : 1);
