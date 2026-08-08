// Vérifie l'écran /auth: le bouton Google est toujours là, et le bouton
// « Continuer avec Apple » est affiché SI ET SEULEMENT SI le drapeau
// APPLE_SIGNIN_ENABLED (src/screens/Auth.jsx) est à true.
// Le drapeau est lu dans la source plutôt que codé en dur ici: le jour où on
// l'allume, ce contrôle vérifie le nouvel état sans qu'on ait à y penser.
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
const src = readFileSync('/home/user/henribeaubayemi/src/screens/Auth.jsx', 'utf8');
const expectApple = /const APPLE_SIGNIN_ENABLED = true;/.test(src);
const google = await page.getByText('Continuer avec Google').count();
const apple = await page.getByText('Continuer avec Apple').count();
const googleOk = google >= 1;
const appleOk = expectApple ? apple >= 1 : apple === 0;
console.log(googleOk ? '✅ bouton Google présent' : '❌ bouton Google ABSENT');
console.log(
  appleOk
    ? `✅ bouton Apple ${expectApple ? 'présent' : 'masqué'} — conforme au drapeau`
    : `❌ bouton Apple ${apple >= 1 ? 'VISIBLE' : 'ABSENT'} alors que le drapeau dit ${expectApple}`,
);
await page.screenshot({ path: 'video-work/review-shots/auth-apple.png', fullPage: false });
await b.close(); srv.close();
process.exit(googleOk && appleOk ? 0 : 1);
