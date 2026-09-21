// Vérifie la démonstration de bout en bout dans un vrai navigateur: on choisit
// une boutique, on achète, on accepte, on livre, et on lit les écritures.
//
// Il ASSERTE aussi que la page ne parle jamais à Supabase en dehors de la
// mesure de visite: une boutique inventée ne doit pas pouvoir atterrir dans la
// vraie base, et une commande de démonstration ne doit jamais arriver chez une
// vraie vendeuse. C'est la garantie qui rend cet écran partageable sans risque.
//
// Deux largeurs, parce qu'un rendu qui passe à 390 px peut casser en large —
// c'est dans CLAUDE.md, et ça s'est déjà vu.
//
// Lancer: npm run build && node video-work/check-demo.mjs

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };

const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = join(DIST, p);
  if (!existsSync(f) || !extname(f)) f = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(4821);

const erreurs = [];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const [nom, w, h] of [['mobile', 390, 844], ['large', 1280, 900]]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  pg.on('pageerror', e => erreurs.push(`${nom}: ${e.message}`));
  pg.on('console', m => { if (m.type() === 'error') erreurs.push(`${nom} console: ${m.text()}`); });
  // Le réseau vers Supabase est coupé: la démo ne doit RIEN lui demander.
  await pg.route('**://*.supabase.co/**', r => { erreurs.push(`${nom}: APPEL SUPABASE ${r.request().url()}`); r.abort(); });

  await pg.goto('http://127.0.0.1:4821/demo', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(600);

  // 1. choisir une boutique
  await pg.locator('button', { hasText: 'Atelier Sika' }).first().click();
  await pg.waitForTimeout(300);
  // 2. ajouter deux articles puis commander
  const ajouts = pg.locator('button', { hasText: /^Ajouter$/ });
  await ajouts.nth(0).click();
  await ajouts.nth(2).click();
  await pg.waitForTimeout(200);
  await pg.locator('button', { hasText: 'Commander' }).click();
  await pg.waitForTimeout(300);
  // 3. accepter puis livrer
  await pg.locator('button', { hasText: 'Accepter la commande' }).click();
  await pg.waitForTimeout(200);
  await pg.locator('button', { hasText: 'Marquer comme livrée' }).click();
  await pg.waitForTimeout(200);
  await pg.locator('button', { hasText: "Voir ce que ça a écrit" }).click();
  await pg.waitForTimeout(400);

  const corps = await pg.locator('body').innerText();
  const attendus = ['Caisse', 'Ventes de marchandises', 'Coût des ventes', 'Stock de marchandises', 'Votre marge'];
  for (const a of attendus) if (!corps.includes(a)) erreurs.push(`${nom}: manque "${a}"`);
  const lien = await pg.locator('a', { hasText: 'Continuer dans Finjaro Accounting' }).getAttribute('href');
  // Débordement horizontal: le harnais ne rend que 390px, donc on vérifie AUSSI en large.
  const debord = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (debord) erreurs.push(`${nom}: débordement horizontal`);
  console.log(`${nom}: lien Accounting = ${lien}`);
  await pg.screenshot({ path: `/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad/demo-${nom}.png`, fullPage: true });
  await pg.close();
}

await b.close();
srv.close();
console.log(erreurs.length ? '\nPROBLEMES:\n' + erreurs.join('\n') : '\nAucune erreur, aucun appel a Supabase.');
