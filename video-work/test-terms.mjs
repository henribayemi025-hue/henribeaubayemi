import { chromium } from 'playwright';
import { spawn } from 'child_process';

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webmanifest':'application/manifest+json' };
const srv = createServer((req, res) => {
  let f = join(DIST, req.url.split('?')[0]);
  if (!existsSync(f) || !extname(f)) f = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(4319);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 797 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));

await p.goto('http://localhost:4319/legal/terms', { waitUntil: 'networkidle' });
const h1 = await p.locator('h1').first().innerText();
const h2s = await p.locator('h2').allInnerTexts();
const body = await p.locator('body').innerText();
console.log('titre      :', h1);
console.log('sections   :', h2s.length);
console.log('art. 6     :', h2s.find((s) => s.startsWith('6.')) || h2s[5]);
console.log('clause clé :', body.includes('AUCUNE RESPONSABILITÉ'));
console.log('contact    :', body.includes('fin.finjaro@gmail.com'));
console.log('longueur   :', body.length, 'caractères');
console.log('scroll H   :', await p.evaluate(() => document.body.scrollWidth <= window.innerWidth));

await p.goto('http://localhost:4319/auth', { waitUntil: 'networkidle' });
await p.getByText(/Créer un compte|Pas encore de compte/).first().click().catch(() => {});
await p.waitForTimeout(600);
console.log('lien auth  :', await p.locator('a[href="/legal/terms"]').count());

console.log('erreurs    :', errs.length ? errs.slice(0, 3) : 'aucune');
await b.close();
srv.close();
