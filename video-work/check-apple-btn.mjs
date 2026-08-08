// Vérifie que le bouton « Continuer avec Apple » apparaît sur /auth,
// sous le bouton Google, sans casser l'écran.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4810, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })).newPage();
await page.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: '[]' }));
await page.goto('http://localhost:4810/auth', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const google = await page.getByText('Continuer avec Google').count();
const apple = await page.getByText('Continuer avec Apple').count();
console.log(google >= 1 ? '✅ bouton Google présent' : '❌ bouton Google ABSENT');
console.log(apple >= 1 ? '✅ bouton Apple présent' : '❌ bouton Apple ABSENT');
await page.screenshot({ path: 'video-work/review-shots/auth-apple.png', fullPage: false });
await b.close(); srv.close();
process.exit(google >= 1 && apple >= 1 ? 0 : 1);
