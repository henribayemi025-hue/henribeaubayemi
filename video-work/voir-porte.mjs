// La porte de Legion et de Mon argent quand on n'est pas connecté — à 390 px
// et à 1280 px (une capture de téléphone ne suffit pas, CLAUDE.md §6).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4179';
const SORTIE = process.env.SORTIE || '/tmp';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [app, chemin] of [['legion', '/legion'], ['argent', '/argent']]) {
  for (const largeur of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: largeur, height: largeur < 800 ? 844 : 800 }, locale: 'fr-FR' });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => console.log(`  <-- ERREUR: ${e.message}`));
    await pg.route('**://*.supabase.co/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"non connecté"}' }));
    await pg.addInitScript(() => localStorage.setItem('finjaro_lang', 'fr'));
    await pg.goto(`${BASE}${chemin}`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2500);
    for (const l of ['Refuser', 'Passer']) { const el = pg.locator(`button:visible:has-text("${l}")`).first(); if (await el.count()) await el.click().catch(() => {}); }
    await pg.waitForTimeout(300);
    const debord = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(app, largeur, 'google:', await pg.locator('button:has-text("Google")').count(), 'débordement:', debord);
    await pg.screenshot({ path: `${SORTIE}/porte-${app}-${largeur}.png`, fullPage: largeur < 800 });
    await ctx.close();
  }
}
await b.close();
