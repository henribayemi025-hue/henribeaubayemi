// Prouver que l'application sert à quelque chose SANS reseau.
//
// Beau, 22/09: « certains trucs doivent fonctionner hors ligne ». L'etat de
// depart, mesure: le service worker mettait la coque en cache, donc
// l'application s'ouvrait — et elle etait VIDE, parce que le cache de
// requetes vivait en memoire et mourait au rechargement.
//
// Ce script fait la seule verification qui compte, dans l'ordre d'une vraie
// journee:
//   1. on charge un ecran AVEC reseau (le cache se remplit et s'ecrit);
//   2. on COUPE le reseau pour de bon;
//   3. on RECHARGE la page — c'est la que tout se jouait;
//   4. on regarde si l'ecran montre quelque chose, et s'il le DIT.
//
//   npx vite preview --port 4176
//   node video-work/voir-hors-ligne.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:4176';
const MOI = '33333333-3333-3333-3333-333333333333';
const SORTIE = process.env.SORTIE || '/tmp';

// Les colonnes que l'ecran lit vraiment (`order_no`, `shops(name)`,
// `order_items`) — verifiees dans MyOrders.jsx, pas devinees. Un faux jeu de
// donnees qui ne ressemble pas a la base ne prouve rien.
const COMMANDES = [
  { id: 'c1', order_no: 4242, status: 'new', total_fcfa: 4500, created_at: '2026-09-20T10:00:00Z', shop_id: 's1', buyer_id: MOI,
    shops: { name: 'Louane épices' }, order_items: [{ product_id: 'p1', name: 'Pack épices séchées', qty: 1, price_fcfa: 4500, price_pending: false }], reviews: [] },
  { id: 'c2', order_no: 4243, status: 'delivered', total_fcfa: 12000, created_at: '2026-09-18T10:00:00Z', shop_id: 's1', buyer_id: MOI,
    shops: { name: 'FreCh Marketplace' }, order_items: [{ product_id: 'p2', name: 'Sac en raphia', qty: 2, price_fcfa: 6000, price_pending: false }], reviews: [] },
];
const MARQUEURS = ['4242', '4243'];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => console.log(`  <-- ERREUR DANS LA PAGE: ${e.message}`));
pg.on('console', (m) => { if (m.type() === 'error') console.log(`  <-- console.error: ${m.text().slice(0, 200)}`); });

let reseauCoupe = false;
let appelsPendantLaCoupure = 0;

await pg.route('**://*.supabase.co/**', async (route) => {
  if (reseauCoupe) {
    appelsPendantLaCoupure++;
    // Ce que fait un vrai reseau absent: la requete n'aboutit pas.
    return route.abort('internetdisconnected');
  }
  const url = route.request().url();
  const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  if (url.includes('/auth/v1/user')) return json({ id: MOI, email: 'essai@example.test' });
  if (url.includes('/rest/v1/profiles')) return json([{ id: MOI, name: 'Beau' }]);
  if (url.includes('/rest/v1/orders')) return json(COMMANDES);
  if (url.includes('/rest/v1/shops')) return json([{ id: 's1', name: 'Louane épices', slug: 'louane' }]);
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

const lire = async () => (await pg.locator('body').innerText()).replace(/\n{2,}/g, '\n');

// ---- 1. AVEC reseau -------------------------------------------------------
await pg.goto(`${BASE}/profile/orders`, { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(3000);
for (const libelle of ['Refuser', 'Passer']) {
  const el = pg.locator(`button:visible:has-text("${libelle}")`).first();
  if (await el.count()) { await el.click().catch(() => {}); await pg.waitForTimeout(400); }
}
const avec = await lire();
console.log('=== 1. AVEC RESEAU ===');
console.log(avec.slice(0, 300));
const codesAvec = MARQUEURS.filter((c) => avec.includes(c));
console.log(`  commandes visibles: ${codesAvec.length ? codesAvec.join(', ') : 'AUCUNE <-- le test ne prouve rien'}`);
await pg.screenshot({ path: `${SORTIE}/horsligne-1-avec.png` });

// Laisser le temps a l'ecriture sur le disque (elle est volontairement sans await).
await pg.waitForTimeout(1200);

// ---- 2. on coupe ----------------------------------------------------------
reseauCoupe = true;
appelsPendantLaCoupure = 0;
// ⚠️ `ctx.setOffline(true)` bloquerait AUSSI le chargement de la page
// elle-meme, et on ne testerait plus rien — juste un onglet mort. En vrai, le
// service worker sert la coque depuis son cache (c'est acquis: l'application
// s'ouvrait deja sans reseau). Ce qu'on met a l'epreuve ici, c'est la seule
// chose qui manquait: les DONNEES. Donc la coque se charge, Supabase refuse.
// Et on fait croire a la page qu'elle est hors ligne, pour voir le bandeau.
await pg.addInitScript(() => {
  Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
});

// ---- 3. on RECHARGE -------------------------------------------------------
// C'est l'etape qui echouait: le cache memoire mourait ici.
await pg.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
await pg.waitForTimeout(3500);
// La visite guidee et la banniere cookies reviennent au rechargement et
// RECOUVRENT le contenu: sans les fermer, on lirait le panneau au lieu de
// l'ecran. Une personne les fermerait aussi.
for (const libelle of ['Refuser', 'Passer', 'Plus tard']) {
  const el = pg.locator(`button:visible:has-text("${libelle}")`).first();
  if (await el.count()) { await el.click().catch(() => {}); await pg.waitForTimeout(400); }
}
await pg.waitForTimeout(800);
console.log(`  adresse apres rechargement: ${new URL(pg.url()).pathname}`);

const sans = await lire();
console.log('\n=== 3. SANS RESEAU, APRES RECHARGEMENT ===');
console.log(sans.slice(0, 300));

const codesSans = MARQUEURS.filter((c) => sans.includes(c));
console.log(`\n  commandes encore visibles: ${codesSans.length ? codesSans.join(', ') : 'AUCUNE'}`);
console.log(`  le bandeau le dit: ${/Hors ligne/i.test(sans) ? 'OUI' : 'NON <-- DEFAUT: on montre des donnees d\'hier sans le dire'}`);
console.log(`  message d'erreur a la place: ${/erreur|error|Réessayer/i.test(sans) ? 'OUI <-- DEFAUT' : 'non'}`);
console.log(`  appels reseau refuses pendant la coupure: ${appelsPendantLaCoupure}`);
const diag = await pg.evaluate(() => ({
  racine: (document.getElementById('root')?.innerHTML || '').length,
  rondQuiTourne: !!document.querySelector('svg.animate-spin, .spinner, [class*="Spinner"]'),
  squelettes: document.querySelectorAll('.skeleton').length,
  h1: Array.from(document.querySelectorAll('h1,h2')).map((e) => e.textContent.trim()).slice(0, 4),
}));
console.log(`  diagnostic: ${JSON.stringify(diag)}`);
// Ce que la page a VRAIMENT sous les yeux: le texte visible ne dit rien quand
// le contenu est rendu mais invisible (recouvert, ou hauteur nulle).
const brut = await pg.evaluate(() => (document.getElementById('root')?.innerText || '').replace(/\n{2,}/g, '\n'));
console.log(`  texte de la racine (300): ${JSON.stringify(brut.slice(0, 300))}`);
const cache = await pg.evaluate(async () => {
  try {
    const db = await new Promise((res) => { const r = indexedDB.open('finjaro-cache', 1); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
    if (!db) return 'pas de base';
    return await new Promise((res) => {
      const st = db.transaction('requetes', 'readonly').objectStore('requetes');
      const rq = st.getAllKeys();
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res('erreur lecture');
    });
  } catch (e) { return 'exception: ' + e.message; }
});
console.log(`  clefs dans IndexedDB: ${JSON.stringify(cache)}`);
const zone = await pg.evaluate(() => {
  const m = document.querySelector('main');
  return {
    mainTrouve: !!m,
    mainHtml: m ? m.innerHTML.slice(0, 500) : null,
    mainTexte: m ? m.innerText.slice(0, 200) : null,
    contientMesCommandes: document.body.innerHTML.includes('Mes commandes'),
  };
});
console.log(`  zone de contenu: ${JSON.stringify(zone, null, 1)}`);
await pg.screenshot({ path: `${SORTIE}/horsligne-2-sans.png` });

console.log(`\n=== VERDICT: ${codesSans.length === codesAvec.length && codesAvec.length > 0 ? 'l\'application SERT sans reseau' : 'ECHEC — l\'ecran ne montre plus ce qu\'il avait'} ===`);

await b.close();
