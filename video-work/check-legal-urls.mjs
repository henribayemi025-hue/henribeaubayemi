// Contrôle avant déploiement production: les deux URLs données à Google Play
// doivent s'afficher pour un visiteur NON connecté (Google ouvre le lien sans
// compte). On vérifie un titre attendu, pas seulement l'absence d'erreur.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4812, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
const page = await ctx.newPage();
await page.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: '[]' }));
await page.route('**/auth/v1/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: '{}' }));
let ok = true;
for (const [path, expect] of [
  ['/suppression-compte', 'Supprimer mon compte'],
  ['/legal/confidentialite', 'confidentialité'],
]) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  await page.goto(`http://localhost:4812${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  const body = await page.locator('body').innerText();
  const found = body.toLowerCase().includes(expect.toLowerCase());
  const broken = /quelque chose n.a pas fonctionné|introuvable|page not found/i.test(body);
  if (!found || broken || errs.length) ok = false;
  console.log(`${found && !broken && !errs.length ? '✅' : '❌'} ${path} — ${found ? `« ${expect} » trouvé` : `« ${expect} » ABSENT`}${broken ? ' / ÉCRAN D\'ERREUR' : ''}${errs.length ? ` / JS: ${errs[0]}` : ''}`);
  console.log(`   premières lignes: ${body.split('\n').filter(Boolean).slice(0, 3).join(' | ').slice(0, 160)}`);
  await page.screenshot({ path: `/home/user/henribeaubayemi/video-work/review-shots/prod${path.replace(/\//g, '_')}.png` });
}
await b.close(); srv.close();
process.exit(ok ? 0 : 1);
