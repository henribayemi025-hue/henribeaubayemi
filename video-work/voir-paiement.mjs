// Voir l'ecran de paiement comme une acheteuse le voit, SANS reseau.
//
// Le 22/09, une acheteuse reelle a atteint cet ecran deux fois en deux jours
// sans jamais commander. Je ne l'avais jamais vu de mes yeux: le mandataire
// reseau de cette machine casse le TLS vers finjaro.net ET vers Supabase, donc
// l'application se sert mais ne charge aucune donnee.
//
// La solution n'est pas de contourner le mandataire, c'est de se passer du
// reseau: on intercepte les appels Supabase dans le navigateur de test et on
// repond des donnees fabriquees. Rien n'est ajoute au produit.
//
//   npx vite preview --port 4174
//   node video-work/voir-paiement.mjs
import { chromium } from 'playwright';

const BOUTIQUE = '11111111-1111-1111-1111-111111111111';
const ARTICLE = '22222222-2222-2222-2222-222222222222';
const BASE = 'http://localhost:4174';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
const pg = await ctx.newPage();

// Tout ce qui sort vers Supabase est repondu ici.
await pg.route('**://*.supabase.co/**', async (route) => {
  const url = route.request().url();
  const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  if (url.includes('/rest/v1/shops')) {
    return json([{ id: BOUTIQUE, name: 'Louane épices', offers_delivery: true, delivery_fee_fcfa: 1000, delivery_zones: [], country: 'CM' }]);
  }
  if (url.includes('/auth/v1/user')) {
    return json({ id: '33333333-3333-3333-3333-333333333333', email: 'essai@example.test' });
  }
  return json([]);
});

// Un panier ET une session, poses avant le chargement. L'ecran de paiement est
// derriere `RequireAuth`: sans session on voit la page de connexion, pas le
// formulaire. La session est fabriquee, elle n'ouvre l'acces a rien — toutes
// les requetes sont interceptees plus haut.
const ACHETEUSE = '33333333-3333-3333-3333-333333333333';
await pg.addInitScript(([b, a, uid]) => {
  localStorage.setItem('finjaro_cart', JSON.stringify([
    { id: a, name: 'Pack épices séchées', price_fcfa: 4500, qty: 1, shop_id: b, size: null, color: null },
  ]));
  const utilisateur = {
    id: uid, aud: 'authenticated', role: 'authenticated', email: 'essai@example.test',
    app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(),
  };
  localStorage.setItem('sb-bokwivwizghdlaedczbw-auth-token', JSON.stringify({
    access_token: 'jeton-d-essai', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'rafraichissement-d-essai', user: utilisateur,
  }));
}, [BOUTIQUE, ARTICLE, ACHETEUSE]);

// ?tour=1 force la visite guidee: sans ca on ne saurait pas si elle est
// absente parce qu'on l'a exclue, ou parce que le compte d'essai est vieux.
await pg.goto(`${BASE}/checkout/${BOUTIQUE}?tour=1`, { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(4000);
// L'ecran d'accueil et la banniere: on les passe comme une personne le ferait.
for (const libelle of ['Passer', 'Refuser']) {
  const el = pg.locator(`button:has-text("${libelle}")`).first();
  if (await el.count() && await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); await pg.waitForTimeout(700); }
}
await pg.waitForTimeout(3000);

const texte = (await pg.locator('body').innerText()).replace(/\n{2,}/g, '\n');
console.log('=== CE QUE L\'ACHETEUSE VOIT ===');
console.log(texte.slice(0, 700));

console.log('\n=== BOUTONS, ET LESQUELS SONT CLIQUABLES ===');
for (const el of await pg.locator('button:visible').all()) {
  const t = (await el.innerText()).trim().replace(/\n/g, ' ');
  if (t) console.log(`  ${await el.isDisabled() ? '[GRISE]  ' : '[ACTIF]  '}${t.slice(0, 50)}`);
}

// Un ecran de telephone ne doit pas defiler lateralement.
const debord = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log(`\n=== DEBORDEMENT LATERAL: ${debord}px ${debord > 0 ? '<-- DEFAUT' : '(aucun)'} ===`);

// Ce qui recouvre l'ecran, et si ca intercepte le clic.
const accueil = pg.locator('text=Dis-moi ce qui t\'amène').first();
if (await accueil.count()) {
  console.log('\n=== UN PANNEAU RECOUVRE L\'ECRAN DE PAIEMENT ===');
  const bouton = pg.locator('button:has-text("Payer à la livraison")').first();
  const b = await bouton.boundingBox();
  if (b) {
    const dessus = await pg.evaluate(({x, y}) => {
      const el = document.elementFromPoint(x, y);
      return el ? (el.tagName + ' ' + (el.className || '').toString().slice(0, 60)) : 'rien';
    }, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
    console.log('  au centre du bouton « Payer à la livraison », le clic atteint:', dessus);
  }
}

console.log('\n=== LA MONNAIE AFFICHEE ===');
const prix = await pg.locator('text=/[0-9][0-9 .,]*\\s*(€|FCFA|\\$|£)/').allInnerTexts();
console.log(' ', [...new Set(prix)].slice(0, 6).join(' | ') || 'aucun prix lu');

await pg.screenshot({ path: 'video-work/paiement-390.png', fullPage: true });
console.log('\ncapture: video-work/paiement-390.png');
await b.close();
