// Vidéo « Ouvrir sa boutique » — capture du vrai parcours, version soignée.
//
// Beau (11/09): la vidéo qu'il voulait refaire, c'est celle-ci — « le
// processus de création de boutique » — et « que ça fasse luxe, classe,
// l'excellence de Finjaro, pas un truc banalisé ».
//
// Ce qui change par rapport à capture-signup-real.mjs (09/09):
//  - Netteté: l'écran est rendu à l'échelle 2 d'un téléphone (390x844 -> 780
//    x1688) au lieu d'une capture 540x960 agrandie deux fois.
//  - Les fiches du fil d'accueil sont les VRAIES pièces de « La sélection »
//    (photos des boutiques, rapatriées de la base), plus les visuels de
//    démonstration pris sur le web — CLAUDE.md les interdit.
//  - La bannière et le logo envoyés à l'étape 3 sont des cartes neutres
//    dessinées ici (monogramme sur crème): pas la photo d'une autre boutique
//    pour habiller une boutique fictive.
//  - Chaque frontière de chapitre est horodatée (fichier chapitres.json):
//    monter-boutique.mjs découpe la capture là-dessus et pose les titres.
//
// Le compte et la boutique créés pendant l'enregistrement (Aïcha K. / « Chez
// Aïcha ») sont un mannequin: tout le réseau est intercepté, rien n'est
// jamais écrit en base.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const ASSETS = '/home/user/henribeaubayemi/video-work/assets';
const SC = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  const chemin = decodeURIComponent(req.url.split('?')[0]);
  // Le build de production demande /img/{bucket}/{chemin}: on sert les
  // photos rapatriées depuis le dossier assets.
  if (chemin.startsWith('/img/products/')) {
    const p = join(ASSETS, chemin.slice('/img/products/'.length));
    if (existsSync(p)) { res.writeHead(200, { 'content-type': MIME[extname(p)] || 'image/jpeg' }); return res.end(readFileSync(p)); }
    res.writeHead(404); return res.end();
  }
  let p = join(DIST, chemin);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4704, r));

const now = Date.now();
const iso = (d, h = 2) => new Date(now - d * 864e5 - h * 36e5).toISOString();

const U = 'aaaa2222-2222-4222-8222-222222222222';
const NAME = 'Aïcha K.';
const PHONE = '+237651234567';
const session = {
  access_token: 'f', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(now / 1000) + 3600, refresh_token: 'f',
  user: { id: U, aud: 'authenticated', role: 'authenticated', email: null, phone: '237651234567', app_metadata: {}, user_metadata: { name: NAME }, created_at: iso(0) },
};
const profile = {
  id: U, name: NAME, phone: PHONE, country: 'CM', currency: 'FCFA', locale: 'fr',
  is_vendor: false, is_admin: false, is_suspended: false, created_at: iso(0), referral_code: null,
};

// Les boutiques et les pièces de « La sélection » — noms, villes, prix lus en
// base le 11/09. Photos: celles des boutiques, rien d'autre.
const FEED_SHOPS = [
  { id: 's1', name: 'SM Store & Beauty', slug: 'sm-store-beauty', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: false },
  { id: 's2', name: 'Nemalia cosmetics', slug: 'nemalia-cosmetics', country: 'FR', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's3', name: 'MTGBA MARKET PLACE', slug: 'mtgba-market-place', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's4', name: 'Artisanat de rêve', slug: 'artisanat-de-reve', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's5', name: 'Luxus Beauty', slug: 'luxus-beauty', country: 'TG', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
];
const FEED_ITEMS = [
  { shop: 0, name: 'Ensemble crème', img: '720c4d78-c78d-49cd-9318-6daf72e7f865/150a58a9-a6ef-4885-a0de-709c4416ca60.jpg', price: 18000, dem: false, category: 'femme_robes' },
  { shop: 1, name: 'Pop lemon ( gommage )', img: '111c5aeb-7ca2-44e2-bb67-7a30b41f92c7/9b509593-2721-45ba-97e3-4718bccc78e0.jpg', price: null, dem: true, category: 'beaute' },
  { shop: 2, name: 'Mocassins noirs vernis élégants pour homme', img: '49d28698-1f14-4b4e-9276-62d1ca26c03e/68e21072-1f5e-4809-912c-857fac348c68.webp', price: null, dem: true, category: 'homme_chaussures' },
  { shop: 3, name: 'Sac en perles', img: '5b3fe859-aa00-4d83-be6d-54230b749d69/6944b3da-f931-4178-b154-be3bf9a0077c.webp', price: 20000, dem: false, category: 'mode_femme' },
  { shop: 0, name: 'Ensemble bordeaux', img: '720c4d78-c78d-49cd-9318-6daf72e7f865/04b53053-142b-419b-8100-427156ccbfa6.jpg', price: 18000, dem: false, category: 'femme_robes' },
  { shop: 1, name: 'Huile de carotte', img: '111c5aeb-7ca2-44e2-bb67-7a30b41f92c7/1a3d228a-478f-4d7b-91d0-570ce9837376.jpg', price: null, dem: true, category: 'beaute' },
  { shop: 4, name: 'Sérums Visage Professionnels', img: 'eb83d3df-0fc9-4254-8fd4-bd4f61b234ab/33368acf-167e-47a9-8886-42da7537eb50.webp', price: 2000, dem: false, category: 'beaute_cosmetiques' },
  { shop: 1, name: 'Pink rose ( gommage)', img: '111c5aeb-7ca2-44e2-bb67-7a30b41f92c7/463b75f5-afe1-4e19-8eba-7250da2c17b2.jpg', price: null, dem: true, category: 'beaute' },
].map((x, i) => ({
  id: `f${i}`, shop_id: FEED_SHOPS[x.shop].id, name: x.name,
  price_fcfa: x.price, compare_at_price_fcfa: null, price_on_request: x.dem,
  images: [x.img], video_url: null, category: x.category,
  stock: 5, views: 40 - i, shop_name: FEED_SHOPS[x.shop].name,
  shop_slug: FEED_SHOPS[x.shop].slug, shop_country: FEED_SHOPS[x.shop].country,
}));

let myShop = null;
let imgServed = 0;
// L'article publié pendant l'enregistrement. La photo envoyée est celle du
// sac en perles d'Artisanat de rêve (photo de la boutique, créditée à la fin).
const SAC = '5b3fe859-aa00-4d83-be6d-54230b749d69/6944b3da-f931-4178-b154-be3bf9a0077c.webp';
const myProducts = [];

function mockRoutes(page) {
  page.route('**/realtime/v1/**', (r) => r.abort());
  page.route('**/auth/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('/token') || u.includes('/signup')) return r.fulfill({ json: session });
    if (u.includes('/user')) return r.fulfill({ json: session.user });
    return r.fulfill({ json: {} });
  });
  page.route('**/functions/v1/**', (r) => r.fulfill({ json: {} }));
  page.route('**/storage/v1/object/shops/**', (r) => r.fulfill({ status: 200, json: { Key: 'ok' } }));
  page.route('**/storage/v1/object/products/**', (r) => r.fulfill({ status: 200, json: { Key: 'ok' } }));
  // Photo d'article: un chemin connu est servi depuis assets (fil d'accueil);
  // le chemin généré à l'envoi (inconnu d'avance) reçoit le sac en perles.
  // Les cartes demandent la vignette (« …_thumb.jpg »), qui n'existe pas ici:
  // on sert l'original du même nom. Seul le chemin généré à l'envoi de la
  // première pièce (inconnu d'avance) reçoit la photo du sac. Avant ce
  // correctif, TOUTES les cartes du fil montraient le sac (Beau, 11/09).
  page.route('**/img/products/**', (r) => {
    const chemin = decodeURIComponent(new URL(r.request().url()).pathname.slice('/img/products/'.length));
    const candidats = [join(ASSETS, chemin), join(ASSETS, chemin.replace(/_thumb(\.[a-z]+)$/i, '$1'))];
    const f = candidats.find((c) => existsSync(c)) || join(ASSETS, SAC);
    return r.fulfill({ status: 200, contentType: MIME[extname(f)] || 'image/jpeg', body: readFileSync(f) });
  });
  // Relecture des deux images envoyées: bannière puis logo, cartes neutres.
  page.route('**/img/shops/**', (r) => {
    const file = imgServed++ === 0 ? 'boutique-banniere.png' : 'boutique-logo.png';
    return r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(join(SC, file)) });
  });
  page.route('**/storage/v1/object/list/**', (r) => r.fulfill({ json: [] }));
  page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const method = req.method();
    if (method === 'POST') {
      if (table === 'shops') {
        const body = req.postDataJSON();
        myShop = {
          id: 'shop-aicha', owner_id: U, slug: 'chez-aicha-demo',
          name: body.name, bio: body.bio || null, country: body.country, city: body.city || null,
          categories: body.categories || [], avatar_url: body.avatar_url || null, banner_url: body.banner_url || null,
          rating: 0, reviews_count: 0, followers_count: 0, is_verified: false, id_verified: false, phone_confirmed: false,
          status: 'active', seller_points: 0, offers_delivery: false, delivery_fee_fcfa: null,
          rotation_enabled: false, featured_until: null, whatsapp: body.whatsapp || null,
          phone: PHONE, instagram: null, created_at: iso(0),
        };
      }
      if (table === 'products') {
        const body = req.postDataJSON();
        (Array.isArray(body) ? body : [body]).forEach((b, i) =>
          myProducts.unshift({ id: `p-${i + 1}`, ...b, is_active: true, views: 0, created_at: iso(0), shops: myShop, shop_name: myShop?.name }));
      }
      return route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '[]' });
    }
    if (method === 'PATCH') return route.fulfill({ status: 204, body: '' });
    let rows = [];
    if (table === 'shops') {
      const qs = url.searchParams.toString();
      if (qs.includes('owner_id')) rows = myShop ? [myShop] : [];
      else if (qs.includes('slug=eq.')) { const slug = url.searchParams.get('slug').slice(3); rows = FEED_SHOPS.filter((s) => s.slug === slug); }
      else if (qs.includes('id=eq.') && myShop) { const id = url.searchParams.get('id').slice(3); rows = id === myShop.id ? [myShop] : []; }
      else rows = FEED_SHOPS;
    } else if (table === 'profiles') rows = [profile];
    else if (table === 'products') {
      const id = url.searchParams.get('id');
      if (id?.startsWith('eq.f')) rows = FEED_ITEMS.filter((p) => p.id === id.slice(3)).map((p) => ({ ...p, is_active: true, sizes: [], colors: [], attributes: {}, created_at: iso(0, 2), shops: FEED_SHOPS.find((s) => s.id === p.shop_id) }));
      else if (url.searchParams.toString().includes('shop_id=eq.shop-aicha')) rows = myProducts;
    }
    const h = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-expose-headers': 'content-range' };
    if (method === 'HEAD') return route.fulfill({ status: 200, headers: h, body: '' });
    return route.fulfill({ status: 200, headers: h, body: JSON.stringify(single ? rows[0] ?? null : rows) });
  });
  page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: '[]' }));
  page.route('**/rest/v1/rpc/home_feed_count**', (r) => r.fulfill({ json: FEED_ITEMS.length }));
  page.route('**/rest/v1/rpc/home_feed_page**', (r) => {
    const b = r.request().postDataJSON();
    return r.fulfill({ json: FEED_ITEMS.slice(b.p_offset, b.p_offset + b.p_limit) });
  });
}

const RECDIR = `${SC}/rec-boutique`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// recordVideo n'enregistre que la taille CSS (390x844): demander 780x1688
// posait la page dans un coin et laissait le reste en gris. Le screencast
// de Chromium, lui, livre les vrais pixels de l'écran (échelle 2), image par
// image, avec l'horodatage de chacune: c'est ce qu'on garde.
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  locale: 'fr-FR', timezoneId: 'Africa/Douala',
});
await ctx.addInitScript(() => {
  navigator.geolocation.getCurrentPosition = (_ok, err) => err && err({ code: 1, message: 'denied' });
  try { localStorage.setItem('finjaro_consent', '{"ads":false}'); } catch {}
});
const page = await ctx.newPage();
const T0 = Date.now();
mkdirSync(RECDIR, { recursive: true });
// Le screencast de Chromium ignore l'échelle 2 en mode sans tête (images en
// 390x844). page.screenshot(), lui, la respecte: on capture donc en boucle,
// à la cadence que la machine permet (une dizaine d'images par seconde),
// chaque image horodatée. Le montage tient chaque image jusqu'à la suivante.
const trames = []; let nTrame = 0; let enregistre = true;
const boucle = (async () => {
  while (enregistre) {
    try {
      const t = (Date.now() - T0) / 1000;
      const buf = await page.screenshot({ type: 'jpeg', quality: 90, timeout: 4000 });
      const f = `${RECDIR}/f${String(nTrame++).padStart(5, '0')}.jpg`;
      writeFileSync(f, buf);
      trames.push({ f, t });
    } catch { /* page en transition: on passe à l'image suivante */ }
    await new Promise((r) => setTimeout(r, 40));
  }
})();
const chapitres = [];
const marque = (nom) => { chapitres.push({ nom, t: (Date.now() - T0) / 1000 }); console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${nom}`); };
mockRoutes(page);
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));

// ---------- 1. Accueil, anonyme ----------
marque('accueil');
await page.goto('http://localhost:4704/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1400);
await page.locator('button', { hasText: 'Passer' }).click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(700);
await page.locator('.bg-ink button[aria-label="Fermer"]').click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 520, behavior: 'smooth' }));
await page.waitForTimeout(1800);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 1100, behavior: 'smooth' }));
await page.waitForTimeout(1800);

// ---------- 2. Profil → Auth, inscription ----------
marque('compte');
await page.locator('a[href="/profile"]').last().click();
await page.waitForTimeout(1000);
await page.locator('button', { hasText: 'Se connecter' }).click().catch(() => {});
await page.waitForTimeout(400);
await page.locator('button', { hasText: "S'inscrire" }).click();
await page.waitForTimeout(600);
await page.locator('button', { hasText: 'Téléphone' }).click();
await page.waitForTimeout(600);
await page.locator('input').nth(0).fill('');
await page.locator('input').nth(0).type(NAME, { delay: 60 });
await page.waitForTimeout(350);
await page.locator('input[type="tel"]').type('+237 651 23 45 67', { delay: 50 });
await page.waitForTimeout(350);
await page.locator('input[type="password"]').first().type('MonJoliMotDePasse', { delay: 50 });
await page.waitForTimeout(800);
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(2200);

// ---------- 3. Profil → Ouvrir ma boutique ----------
marque('ouvrir');
await page.waitForTimeout(1200);
await page.locator('.z-50 button', { hasText: 'Plus tard' }).click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(700);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 120, behavior: 'smooth' }));
await page.waitForTimeout(1300);
await page.locator('button, a', { hasText: 'Ouvrir ma boutique gratuite' }).click();
await page.waitForTimeout(1500);

// ---------- 4. Étape 1: la boutique ----------
marque('boutique');
await page.locator('input').nth(0).type('Chez Aïcha', { delay: 60 });
await page.waitForTimeout(500);
await page.locator('select').selectOption('CM');
await page.waitForTimeout(500);
await page.locator('input').nth(1).type('Douala', { delay: 60 });
await page.waitForTimeout(800);
await page.locator('button', { hasText: 'Des articles' }).click();
await page.waitForTimeout(900);
const chips = page.locator('.chip');
await chips.nth(0).click();
await page.waitForTimeout(450);
await chips.nth(4).click();
await page.waitForTimeout(900);
await page.locator('button', { hasText: 'Continuer' }).click();
await page.waitForTimeout(1300);

// ---------- 5. Étape 2: qui elle est ----------
marque('identite');
await page.locator('input').nth(0).type('Aïcha', { delay: 60 });
await page.waitForTimeout(300);
await page.locator('input').nth(1).type('K.', { delay: 60 });
await page.waitForTimeout(300);
await page.locator('input[type="tel"]').type('+237 651 23 45 67', { delay: 50 });
await page.waitForTimeout(900);
await page.locator('button', { hasText: 'Continuer' }).click();
await page.waitForTimeout(1300);

// ---------- 6. Étape 3: présentation ----------
marque('presentation');
await page.locator('input[type="file"]').nth(0).setInputFiles(join(SC, 'boutique-banniere.png'));
await page.waitForTimeout(1800);
await page.locator('input[type="file"]').nth(1).setInputFiles(join(SC, 'boutique-logo.png'));
await page.waitForTimeout(1800);
await page.locator('textarea').type('Mode et beauté. Des pièces choisies, livrées avec soin.', { delay: 35 });
await page.waitForTimeout(900);
await page.locator('button', { hasText: 'Continuer' }).click();
await page.waitForTimeout(1300);

// ---------- 7. Étape 4: validation ----------
marque('validation');
await page.waitForTimeout(1400);
await page.locator('input[type="checkbox"]').check();
await page.waitForTimeout(800);
await page.locator('button', { hasText: 'Envoyer ma demande' }).click();
await page.waitForTimeout(2200);
await page.locator('button', { hasText: 'Aller à mon espace vendeur' }).click();
await page.waitForTimeout(2600);

// ---------- 8. Espace vendeur ----------
marque('espace');
await page.waitForTimeout(1400);
await page.waitForTimeout(2200);

// ---------- 9. Publier sa première pièce ----------
// Le bouton du tableau de bord ouvre « Ajouter plusieurs articles »: une
// photo = un article, un rayon et un prix communs, puis Publier.
marque('article');
try {
  await page.locator('a, button', { hasText: 'Publier mon premier article' }).first().click({ timeout: 8000 });
  await page.waitForSelector('text=Choisir mes photos', { timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.locator('input[type="file"]').first().setInputFiles(join(ASSETS, SAC));
  // La ligne de l'article apparaît sous le bloc « Appliquer à tous ».
  await page.waitForSelector('input[placeholder="Nom du produit"]', { timeout: 15000 });
  await page.waitForTimeout(1600);
  // Rayon et prix communs, appliqués à la ligne; puis le nom, tapé sur la
  // ligne elle-même (le nom commun numérote: « Sac en perles 1 »).
  await page.locator('select').first().selectOption('mode_femme');
  await page.waitForTimeout(700);
  await page.locator('input[type="number"]').first().type('20000', { delay: 70 });
  await page.waitForTimeout(600);
  await page.locator('button', { hasText: 'Appliquer à tous' }).click({ timeout: 5000 });
  await page.waitForTimeout(900);
  const ligneNom = page.locator('input[placeholder="Nom du produit"]').first();
  await ligneNom.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await ligneNom.type('Sac en perles', { delay: 60 });
  await page.waitForTimeout(1200);
  await page.locator('button', { hasText: 'Publier 1' }).click({ timeout: 8000 });
  await page.waitForTimeout(2400);
  // ---------- 10. La pièce est en ligne ----------
  marque('publie');
  await page.waitForTimeout(3400);
} catch (e) {
  console.log('ARTICLE KO:', String(e).slice(0, 160));
  await page.screenshot({ path: `${SC}/article-ko.png` }).catch(() => {});
}
marque('fin');

enregistre = false;
await boucle;
await page.close();
await ctx.close();
await browser.close();
srv.close();
writeFileSync(`${SC}/chapitres.json`, JSON.stringify(chapitres, null, 1));
writeFileSync(`${SC}/trames.json`, JSON.stringify(trames));
console.log(`${trames.length} images capturées`);
console.log('ENREGISTREMENT TERMINÉ:', RECDIR);
