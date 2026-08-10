// Vérification visuelle du parcours « devenir vendeur » (demande de Beau:
// plusieurs personnes ne trouvaient ni comment ouvrir une boutique, ni
// comment publier). Trois états à voir de ses propres yeux, parce qu'ils
// dépendent tous d'une condition différente:
//   - Profil SANS boutique  → la carte « Vendre sur Finjaro »
//   - Profil AVEC boutique  → le bouton « Passer en mode vendeur »
//   - Formulaire étapes 2/3 → la mention « facultative » + « Passer »
//
// Le mock renvoie ou non une boutique selon le scénario: c'est `shops` filtré
// sur owner_id qui décide de tout l'affichage (useVendorStatus).
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
await new Promise((r) => srv.listen(4803, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'seller-test-0000-0000-0000-000000000001';
const SHOP = {
  id: 'shop-own', slug: 'ma-boutique', name: 'Ma boutique', owner_id: USER_ID,
  country: 'CM', city: 'Douala', status: 'active', is_verified: false, rating: 0,
  followers_count: 0, avatar_url: null, banner_url: null, categories: ['mode_femme'],
};
// La boutique de QUELQU'UN D'AUTRE: le bandeau « C'est ta boutique » ne doit
// jamais s'y montrer — l'inverse serait pire que son absence.
const OTHER_SHOP = {
  id: 'shop-other', slug: 'autre-boutique', name: 'Autre boutique', owner_id: 'someone-else-0000',
  country: 'CM', city: 'Yaoundé', status: 'active', is_verified: false, rating: 0,
  followers_count: 3, avatar_url: null, banner_url: null, categories: ['mode_femme'],
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const session = {
  access_token: 'test-access-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
  user: { id: USER_ID, email: 'vendeuse@test.dev', phone: null, app_metadata: {}, user_metadata: { name: 'Test Vendeuse' }, aud: 'authenticated', created_at: new Date().toISOString() },
};

const findings = [];

async function makePage({ hasShop }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Africa/Douala' });
  await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);
  const page = await ctx.newPage();
  page.on('console', (m) => {
    // Le websocket realtime n'est pas interceptable par page.route (ce n'est
    // pas du HTTP) et le proxy de l'environnement de test le bloque: c'est un
    // artefact du banc d'essai, pas un défaut de l'application.
    if (m.type() === 'error' && !m.text().includes('WebSocket connection')) findings.push({ kind: 'console', text: m.text().slice(0, 200) });
  });
  page.on('pageerror', (e) => findings.push({ kind: 'pageerror', text: String(e).slice(0, 200) }));

  await page.route('**/realtime/v1/**', (r) => r.abort());
  await page.route('**/auth/v1/user**', (r) => r.fulfill({ json: session.user }));
  await page.route('**/auth/v1/token**', (r) => r.fulfill({ json: session }));
  await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));

  await page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
    if (path.startsWith('rpc/')) {
      return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: '[]' });
    }
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    let rows = [];
    if (path === 'shops') rows = hasShop ? [SHOP, OTHER_SHOP] : [OTHER_SHOP];
    else if (path === 'profiles') rows = [{ id: USER_ID, name: 'Test Vendeuse', avatar_url: null, country: 'CM', currency: 'FCFA', is_vendor: hasShop, created_at: new Date().toISOString() }];
    else if (path === 'categories') rows = [{ id: 'mode_femme', parent_id: null, kind: 'PRODUCT', label_fr: 'Mode Femme', label_en: 'Women' }];
    const at = (row, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), row);
    for (const [key, value] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
      if (!value.startsWith('eq.')) continue;
      rows = rows.filter((r) => String(at(r, key)) === value.slice(3));
    }
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
      body: JSON.stringify(single ? rows[0] ?? null : rows),
    });
  });
  return page;
}

// Le texte attendu est vérifié APRÈS la capture: une capture seule ne prouve
// rien tant que personne ne la regarde, et c'est exactement comme ça qu'une
// revue précédente a annoncé « ✅ » sur un écran d'erreur.
async function check(page, label, url, expect, shot) {
  findings.length = 0;
  await page.goto(`http://localhost:4803${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  const body = await page.locator('body').innerText().catch(() => '');
  await page.screenshot({ path: `${OUT}/${shot}.png` }).catch(() => {});
  const missing = expect.filter((s) => !body.includes(s));
  const errs = findings.map((f) => `${f.kind}: ${f.text}`);
  const ok = missing.length === 0 && errs.length === 0;
  console.log(`${ok ? '✅' : '⚠️ '} ${label}`);
  for (const m of missing) console.log(`   ATTENDU MAIS ABSENT: « ${m} »`);
  for (const e of errs) console.log(`   ${e}`);
  return ok;
}

console.log('\n=== PARCOURS DEVENIR VENDEUR ===\n');
let allOk = true;

const guest = await makePage({ hasShop: false });
allOk &= await check(guest, 'Profil sans boutique — carte « Vendre sur Finjaro »', '/profile',
  ['Vendre sur Finjaro', 'Ouvre ta boutique gratuitement'], 'onboarding_profil-sans-boutique');

allOk &= await check(guest, 'Formulaire étape 1 — champs obligatoires', '/become-vendor',
  ['Étape 1'], 'onboarding_form-etape1');

// Étapes 2 et 3: on avance réellement dans le formulaire, on ne triche pas
// avec une URL — l'étape vit dans l'état du composant. « Continuer » reste
// désactivé tant que nom + pays + AU MOINS UNE catégorie ne sont pas remplis,
// donc les trois doivent l'être réellement.
// `TextInput` ne pose pas d'attribut type — un sélecteur [type="text"] ne
// trouve rien et le test échoue sur un timeout qui ne dit pas pourquoi.
await guest.locator('input.input').first().fill('Boutique Test');
await guest.locator('select').first().selectOption('CM');
await guest.locator('button[aria-pressed]').first().click();   // « Je vends des articles »
await guest.waitForTimeout(300);
await guest.locator('.chip').first().click();                  // une catégorie
await guest.waitForTimeout(300);
const cont = guest.getByRole('button', { name: /^Continuer$/i });
if (await cont.isDisabled()) {
  console.log('   ⚠️  « Continuer » encore désactivé: étape 1 incomplète dans le test');
}
await cont.click();
await guest.waitForTimeout(800);
const step2 = await guest.locator('body').innerText().catch(() => '');
await guest.screenshot({ path: `${OUT}/onboarding_form-etape2.png` }).catch(() => {});
const step2Ok = step2.includes('facultative') && /Passer, je le ferai plus tard/.test(step2);
console.log(`${step2Ok ? '✅' : '⚠️ '} Formulaire étape 2 — « facultative » + « Passer »`);
if (!step2Ok) console.log(`   texte vu: ${step2.replace(/\n+/g, ' | ').slice(0, 300)}`);
allOk &= step2Ok;

const vendor = await makePage({ hasShop: true });
allOk &= await check(vendor, 'Profil AVEC boutique — « Passer en mode vendeur »', '/profile',
  ['Passer en mode vendeur'], 'onboarding_profil-avec-boutique');

// Le RETOUR. C'est la question de Beau: la sortie doit se lire, pas se
// deviner sous une icône de deux flèches croisées.
allOk &= await check(vendor, 'Tableau de bord vendeur — « Mode acheteur » écrit', '/vendor',
  ['Mode acheteur'], 'onboarding_vendeur-tableau-de-bord');

allOk &= await check(vendor, 'Ma boutique — « Passer en mode acheteur »', '/vendor/shop',
  ['Passer en mode acheteur'], 'onboarding_vendeur-ma-boutique');

// Finia: la troisième sortie. On l'ouvre depuis un écran vendeur SANS sortie
// propre (Produits), puis on vérifie l'inverse côté acheteur — un raccourci
// « passe en mode acheteur » affiché à une acheteuse serait absurde, et c'est
// le genre d'erreur qu'une capture seule ne signale pas.
async function openFinia(page, url) {
  await page.goto(`http://localhost:4803${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.locator('button[aria-label="Finia"], button[aria-label*="Finia"]').first().click({ timeout: 5000 })
    .catch(async () => { await page.locator('.fixed button.rounded-full').last().click({ timeout: 5000 }); });
  await page.waitForTimeout(1200);
  return page.locator('body').innerText().catch(() => '');
}

const finiaVendor = await openFinia(vendor, '/vendor/products');
await vendor.screenshot({ path: `${OUT}/onboarding_finia-vendeur.png` }).catch(() => {});
const vendorChipOk = finiaVendor.includes('Passer en mode acheteur');
console.log(`${vendorChipOk ? '✅' : '⚠️ '} Finia depuis Produits — raccourci « Passer en mode acheteur »`);
if (!vendorChipOk) console.log(`   texte vu: ${finiaVendor.replace(/\n+/g, ' | ').slice(0, 300)}`);
allOk &= vendorChipOk;

// SA boutique vue en mode acheteur: le cas exact de la vendeuse perdue.
// Les deux gestes qu'elle cherchait doivent être là, et « S'abonner » (à
// soi-même) ne doit plus l'être.
const ownShop = await check(vendor, 'Sa propre boutique — bandeau propriétaire', '/boutique/ma-boutique',
  ["C'est ta boutique", 'Passer en mode vendeur', 'Ajouter un article'], 'onboarding_boutique-proprietaire');
allOk &= ownShop;
const ownBody = await vendor.locator('body').innerText().catch(() => '');
const noFollowSelf = !/\bSuivre\b/.test(ownBody);
console.log(`${noFollowSelf ? '✅' : '⚠️ '} Sa propre boutique — « Suivre » bien retiré`);
allOk &= noFollowSelf;

allOk &= await check(vendor, "La boutique d'une AUTRE — pas de bandeau, «Suivre» présent", '/boutique/autre-boutique',
  ['Suivre'], 'onboarding_boutique-autrui');
const otherBody = await vendor.locator('body').innerText().catch(() => '');
const noOwnerBannerElsewhere = !otherBody.includes("C'est ta boutique");
console.log(`${noOwnerBannerElsewhere ? '✅' : '⚠️ '} La boutique d'une autre — le bandeau propriétaire est bien ABSENT`);
allOk &= noOwnerBannerElsewhere;

const finiaBuyer = await openFinia(vendor, '/');
await vendor.screenshot({ path: `${OUT}/onboarding_finia-acheteur.png` }).catch(() => {});
const buyerChipAbsent = !finiaBuyer.includes('Passer en mode acheteur');
console.log(`${buyerChipAbsent ? '✅' : '⚠️ '} Finia côté acheteur — le raccourci est bien ABSENT`);
if (!buyerChipAbsent) console.log('   le raccourci s\'affiche alors qu\'on est déjà en mode acheteur');
allOk &= buyerChipAbsent;

console.log(`\n${allOk ? 'TOUT EST CONFORME' : 'DES POINTS À CORRIGER CI-DESSUS'}\n`);
await browser.close();
srv.close();
