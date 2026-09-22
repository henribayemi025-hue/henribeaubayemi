// Voir « Mon argent » comme Beau le voit, SANS reseau — telephone ET ordinateur.
//
// Le 22/09 la premiere version est partie en production sans que je l'aie
// regardee: Beau l'a vue avant moi, DANS la place de marche, crème et
// terracotta, avec la barre Services a gauche. « C'est quoi cette merde. »
// Il avait raison. Ce script existe pour que ca n'arrive plus: on rend
// l'application avec les vraies formes de donnees, aux deux largeurs, et on
// REGARDE les captures avant de pousser.
//
//   npx vite preview --port 4175
//   node video-work/voir-mon-argent.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:4175';
const MOI = '33333333-3333-3333-3333-333333333333';
const SORTIE = process.env.SORTIE || '/tmp';

// Les memes formes qu'en base — et les memes chiffres que sur ses captures:
// Revolut part de 31, une ligne de budget de 11,9 en sort, l'ecran doit dire
// 19,1. La caisse d'epargne part de 5,18, une ligne de 8,01 en sort: -2,83.
const COMPTES = [
  { id: 'a1', name: 'Paypal', balance: 0.16, color: '#6366F1', glyph: 'P' },
  { id: 'a2', name: 'Sg', balance: 0, color: '#38BDF8', glyph: 'S' },
  { id: 'a3', name: 'Revolut', balance: 31, color: '#34D399', glyph: 'R' },
  { id: 'a4', name: 'Cash', balance: 22.88, color: '#F5B544', glyph: 'C' },
  { id: 'a5', name: 'Boursorama', balance: 10, color: '#8B5CF6', glyph: 'B' },
  { id: 'a6', name: 'Caisse d’épargne', balance: 5.18, color: '#FB7185', glyph: 'C' },
  { id: 'a7', name: 'CIC', balance: 11.37, color: '#6366F1', glyph: 'C' },
];
const mois = new Date().toISOString().slice(0, 7);
const BUDGET = [
  { id: 'b1', user_id: MOI, kind: 'expense', category: 'Courses', planned: 150, actual: 11.9, period: mois, account_id: 'a3' },
  { id: 'b2', user_id: MOI, kind: 'expense', category: 'Transport', planned: 40, actual: 8.01, period: mois, account_id: 'a6' },
  { id: 'b3', user_id: MOI, kind: 'income', category: 'Salaire', planned: 1800, actual: 1800, period: mois, account_id: null },
];
const EPARGNE = [
  { id: 's1', user_id: MOI, name: 'Maison France', target: 20000, saved: 1250 },
  { id: 's2', user_id: MOI, name: 'Boursorama', target: 1000, saved: 1000 },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function regarder(largeur, hauteur, nom) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: hauteur }, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  // Une page qui devient vide, c'est presque toujours une exception React.
  // On l'affiche telle quelle: deviner la cause a deja coute une version.
  pg.on('pageerror', (e) => console.log(`  <-- ERREUR DANS LA PAGE: ${e.message}`));
  pg.on('console', (m) => { if (m.type() === 'error') console.log(`  <-- console.error: ${m.text().slice(0, 300)}`); });

  await pg.route('**://*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.includes('/auth/v1/user')) return json({ id: MOI, email: 'essai@example.test' });
    if (url.includes('/rest/v1/profiles')) return json([{ id: MOI, name: 'Beau', currency: 'EUR' }]);
    if (url.includes('/rest/v1/accounts')) return json(COMPTES);
    if (url.includes('/rest/v1/budget_entries')) return json(BUDGET);
    if (url.includes('/rest/v1/savings_goals')) return json(EPARGNE);
    if (url.includes('/rest/v1/finjaro_apps')) return json([]);
    return json([]);
  });

  await pg.addInitScript((uid) => {
    localStorage.setItem('finjaro_currency', 'EUR');
    localStorage.setItem('finjaro_currency_manual', '1');
    const utilisateur = {
      id: uid, aud: 'authenticated', role: 'authenticated', email: 'essai@example.test',
      app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(),
    };
    localStorage.setItem('sb-bokwivwizghdlaedczbw-auth-token', JSON.stringify({
      access_token: 'jeton-d-essai', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'rafraichissement-d-essai', user: utilisateur,
    }));
  }, MOI);

  await pg.goto(`${BASE}/argent`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3500);
  // La banniere cookies (pixel Meta) est legitime partout, y compris ici:
  // on la refuse comme une personne le ferait, puis on regarde l'application.
  const refuser = pg.locator('button:visible:has-text("Refuser")').first();
  if (await refuser.count()) { await refuser.click().catch(() => {}); await pg.waitForTimeout(500); }

  console.log(`\n=== ${nom} (${largeur}px) ===`);
  const texte = (await pg.locator('body').innerText()).replace(/\n{2,}/g, '\n');
  console.log(texte.slice(0, 600));

  // Ce qui ne doit PAS etre la: la barre de la place de marche.
  for (const mot of ['Services', 'Messages', 'Fin']) {
    const n = await pg.locator(`nav >> text="${mot}"`).count();
    if (n) console.log(`  <-- DEFAUT: « ${mot} » de la place de marche est visible`);
  }
  const fond = await pg.evaluate(() => getComputedStyle(document.querySelector('.money-app') || document.body).backgroundColor);
  console.log(`  fond de l'application: ${fond}`);
  const debord = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`  debordement lateral: ${debord}px ${debord > 0 ? '<-- DEFAUT' : '(aucun)'}`);

  await pg.screenshot({ path: `${SORTIE}/argent-${nom}.png`, fullPage: false });

  // L'onglet Analyste aussi — celui que personne n'a regarde.
  const analyste = pg.locator('button:visible:has-text("Analyste")').first();
  if (await analyste.count()) {
    await analyste.click();
    await pg.waitForTimeout(800);
    await pg.screenshot({ path: `${SORTIE}/argent-${nom}-analyste.png`, fullPage: false });
  }
  await ctx.close();
}

await regarder(390, 844, 'telephone');
await regarder(1280, 800, 'ordinateur');
await b.close();
