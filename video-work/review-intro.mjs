// Deux reproches de Beau, deux verifications.
//
// 1) « Dès que quelqu'un télécharge l'application, il doit pouvoir faire le
//    tour, avec passer ou accepter. » — la presentation du premier lancement.
// 2) « Ce n'est pas beau, ce n'est pas bien présenté. » — le texte de Finia
//    sortait en Markdown brut, etoiles comprises.
//
// On capture aussi les ecrans: Beau juge sur image, pas sur ma parole.
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
await new Promise((r) => srv.listen(4808, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'intro-user-0000-0000-0000-00000000001';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// La reponse type de Finia, telle qu'elle arrivait chez Beau: du Markdown.
const FINIA_MARKDOWN = `Bienvenue sur Finjaro ! C'est super simple et entierement gratuit de vendre ici. Voici comment faire en 3 etapes :

1. **Ouvre ta boutique** : Va dans ton Profil et clique sur "Vendre sur Finjaro".
2. **Publie tes articles** : Une photo suffit pour commencer.
3. **Gere tes ventes** : Tu recevras tes commandes dans ton espace vendeur.

Tu veux qu'on ouvre ta boutique ensemble ?`;

async function newCtx({ loggedIn = false, seen = false } = {}) {
  const createdAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR' });
  if (loggedIn) {
    const session = {
      access_token: 't', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
      user: { id: USER_ID, email: 'new@test.dev', app_metadata: {}, user_metadata: { name: 'Awa Mbala' }, aud: 'authenticated', created_at: createdAt },
    };
    await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);
  }
  if (seen) await ctx.addInitScript(() => localStorage.setItem('finjaro:intro-seen', '1'));
  const page = await ctx.newPage();
  await page.route('**/realtime/v1/**', (r) => r.abort());
  await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
  await page.route('**/functions/v1/finou-chat**', (r) =>
    r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, json: { reply: FINIA_MARKDOWN } }));
  await page.route('**/rest/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (route.request().headers()['accept'] || '').includes('vnd.pgrst.object');
    const rows = path === 'profiles'
      ? [{ id: USER_ID, name: 'Awa Mbala', country: 'CM', currency: 'FCFA', created_at: createdAt }]
      : [];
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': `0-0/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
      body: JSON.stringify(single ? rows[0] ?? null : rows),
    });
  });
  return { ctx, page };
}

let allOk = true;
const check = (ok, label, detail = '') => {
  allOk &= ok;
  console.log(`${ok ? '✅' : '⚠️ '} ${label}${detail ? ` — ${detail}` : ''}`);
};

console.log('\n=== PREMIER LANCEMENT ===\n');

// 1. Navigateur vierge: la presentation s'ouvre, les trois ecrans defilent.
{
  const { ctx, page } = await newCtx();
  await page.goto('http://localhost:4808/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  let body = await page.locator('body').innerText();
  check(body.includes('Passer'), "L'ecran d'accueil s'ouvre au premier lancement");
  await page.screenshot({ path: `${OUT}/intro-1.png` });

  for (const n of [2, 3]) {
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${OUT}/intro-${n}.png` });
  }
  body = await page.locator('body').innerText();
  check(body.includes("C'est parti"), 'Le dernier ecran propose de commencer');

  await page.getByRole('button', { name: "C'est parti" }).click();
  await page.waitForTimeout(700);
  body = await page.locator('body').innerText();
  check(!body.includes('Passer'), 'Une fois termine, on arrive dans l\'application');
  await ctx.close();
}

// 2. Deuxieme lancement: on ne la revoit pas.
{
  const { ctx, page } = await newCtx({ seen: true });
  await page.goto('http://localhost:4808/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const body = await page.locator('body').innerText();
  check(!body.includes('Passer'), 'Au lancement suivant, elle ne revient pas');
  await ctx.close();
}

// 3. Pages autonomes: rien ne se superpose (les relecteurs des magasins y vont).
{
  const { ctx, page } = await newCtx();
  await page.goto('http://localhost:4808/legal/confidentialite', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const body = await page.locator('body').innerText();
  check(!body.includes('Passer'), 'Rien ne se superpose a la politique de confidentialite');
  await ctx.close();
}

console.log('\n=== TEXTE DE FINIA ===\n');

// 4. Le Markdown est rendu, pas imprime.
{
  const { ctx, page } = await newCtx({ loggedIn: true, seen: true });
  await page.goto('http://localhost:4808/?tour=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.getByText('Je viens vendre').click();
  await page.waitForTimeout(2500);
  const body = await page.locator('body').innerText();
  check(!body.includes('**'), 'Plus aucune etoile en clair dans la bulle',
    body.includes('**') ? 'des ** restent affiches' : '');
  check(body.includes('Ouvre ta boutique'), 'Le texte de Finia est bien la');
  const gras = await page.locator('strong', { hasText: 'Ouvre ta boutique' }).count();
  check(gras > 0, 'Les titres d\'etape sont en gras');
  await page.screenshot({ path: `${OUT}/finia-texte.png` });
  await ctx.close();
}

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close();
srv.close();
