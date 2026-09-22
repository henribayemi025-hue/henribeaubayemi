// Voir Finjaro Learn comme une vendeuse le voit, SANS reseau.
//
// Deux cas, parce qu'ils n'ont rien a voir:
//   - la boutique VIDE — c'est pour elle que l'ecran existe (19 sur 67);
//   - la boutique qui a deja tout fait — on verifie que les coches sont la
//     et que les nombres affiches sont les vrais.
//
//   npx vite preview --port 4177
//   node video-work/voir-apprendre.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:4177';
const MOI = '33333333-3333-3333-3333-333333333333';
const BOUTIQUE = '11111111-1111-1111-1111-111111111111';
const SORTIE = process.env.SORTIE || '/tmp';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function regarder({ nom, largeur, articles, livrees, reponses }) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: 900 }, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => console.log(`  <-- ERREUR DANS LA PAGE: ${e.message}`));

  await pg.route('**://*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const json = (data, headers = {}) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(data) });

    if (url.includes('/auth/v1/user')) return json({ id: MOI, email: 'essai@example.test' });
    if (url.includes('/rest/v1/profiles')) return json([{ id: MOI, name: 'Beau' }]);
    if (url.includes('/rest/v1/shops')) {
      return json([{ id: BOUTIQUE, name: 'Boutique d’essai', slug: 'essai', owner_id: MOI, status: 'approved', country: 'CM' }]);
    }
    // Les comptages passent par `head: true` + `Prefer: count=exact`: la
    // reponse n'a pas de corps, le nombre est dans l'entete Content-Range.
    // ⚠️ `access-control-expose-headers`: la page et le faux serveur n'ont pas
    // la meme origine, donc le navigateur CACHE `content-range` a moins qu'on
    // l'expose. Sans cette ligne, supabase-js ne voit aucun compte et l'ecran
    // affiche « 0 sur 3 » alors que les donnees disent 12.
    const compte = (n) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-0/${n}`, 'access-control-expose-headers': 'content-range' },
      body: '[]',
    });
    if (url.includes('/rest/v1/products')) return compte(articles);
    if (url.includes('/rest/v1/orders')) return compte(livrees);
    if (url.includes('/rest/v1/chat_messages')) return compte(reponses);
    if (url.includes('/rest/v1/conversations')) return json(reponses > 0 ? [{ id: 'conv1' }] : []);
    return json([]);
  });

  await pg.addInitScript((uid) => {
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

  await pg.goto(`${BASE}/vendor/learn`, { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3500);
  for (const libelle of ['Refuser', 'Passer', 'Plus tard']) {
    const el = pg.locator(`button:visible:has-text("${libelle}")`).first();
    if (await el.count()) { await el.click().catch(() => {}); await pg.waitForTimeout(400); }
  }
  await pg.waitForTimeout(600);

  console.log(`\n=== ${nom} (${largeur}px) ===`);
  const texte = (await pg.locator('body').innerText()).replace(/\n{2,}/g, '\n');
  console.log(texte.slice(0, 700));

  const debord = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`  debordement lateral: ${debord}px ${debord > 0 ? '<-- DEFAUT' : '(aucun)'}`);
  await pg.screenshot({ path: `${SORTIE}/apprendre-${nom}.png`, fullPage: true });
  await ctx.close();
}

// Celle pour qui l'ecran existe: rien de fait.
await regarder({ nom: 'vide-telephone', largeur: 390, articles: 0, livrees: 0, reponses: 0 });
// Celle qui a tout fait: les coches, et les VRAIS nombres.
await regarder({ nom: 'active-ordinateur', largeur: 1280, articles: 12, livrees: 3, reponses: 7 });

await b.close();
