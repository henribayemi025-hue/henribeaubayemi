// Recapture de l'écran d'inscription — v2 du 04/08 au soir.
// Beau a repéré que la vidéo montrait encore le code SMS: le parcours réel
// est désormais numéro + MOT DE PASSE (le SMS n'arrive pas au Cameroun).
// On écrase shots/auth-phone.png avec l'écran actuel.
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
await new Promise((r) => srv.listen(4702, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 3, locale: 'fr-FR', timezoneId: 'Africa/Douala' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
await page.route('**/rest/v1/**', (r) => r.fulfill({ json: [] }));

await page.goto('http://localhost:4702/auth', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.locator('button', { hasText: "S'inscrire" }).click();
await page.waitForTimeout(400);
await page.locator('button', { hasText: 'Téléphone' }).click();
await page.waitForTimeout(400);
// Mode par défaut = mot de passe (plus de SMS). Remplir les trois champs.
await page.locator('input').nth(0).fill('Aïcha K.');
await page.locator('input[type="tel"]').fill('+237 651 23 45 67');
await page.locator('input[type="password"]').first().fill('MonJoliMotDePasse');
await page.waitForTimeout(400);
await page.screenshot({ path: '/home/user/henribeaubayemi/video-work/shots/auth-phone.png' });
console.log('auth-phone.png recapturé (numéro + mot de passe)');
await browser.close();
srv.close();
