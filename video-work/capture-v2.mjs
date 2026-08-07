// Captures SUPPLÉMENTAIRES pour les vidéos v2 (04/08 soir) — les nouveautés
// absentes des vidéos du matin: ajout en masse + Finia, prix sur demande,
// « Tout publier », fil d'accueil diversifié. Mêmes conventions que
// capture.mjs (390x797 @3x, barre de statut dessinée par compose*.html).
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const OUT = '/home/user/henribeaubayemi/video-work/shots';
const DEMO = '/home/user/henribeaubayemi/public/demo-products';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4701, r));

const now = Date.now();
const iso = (d, h = 2) => new Date(now - d * 864e5 - h * 36e5).toISOString();
const U = 'aaaa1111-1111-4111-8111-111111111111';
const SHOP = 'ssss1111-1111-4111-8111-111111111111';
const session = { access_token: 'f', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(now / 1000) + 3600, refresh_token: 'f', user: { id: U, aud: 'authenticated', role: 'authenticated', email: null, phone: '237651234567', app_metadata: {}, user_metadata: { name: 'Aïcha K.' }, created_at: iso(1) } };
const profile = { id: U, name: 'Aïcha K.', phone: '+237651234567', country: 'CM', currency: 'FCFA', locale: 'fr', is_vendor: true, is_admin: false, is_suspended: false, created_at: iso(1), referral_code: 'AICHA123' };
const shopRow = {
  id: SHOP, owner_id: U, slug: 'chez-aicha', name: 'Chez Aïcha', bio: 'Mode & beauté, Douala',
  avatar_url: '/demo-products/turban-01.jpg', banner_url: '/demo-products/wd-01.jpg',
  country: 'CM', city: 'Douala', neighborhood: 'Akwa', categories: ['mode_femme', 'beaute_cosmetiques'],
  rating: 4.8, reviews_count: 12, followers_count: 87, is_verified: true, id_verified: true, phone_confirmed: true,
  status: 'active', seller_points: 140, offers_delivery: true, delivery_fee_fcfa: 1000,
  rotation_enabled: false, rotation_days: 7, rotation_delete: true, opening_hours: null,
  delivery_zones: [{ name: 'Akwa', fee_fcfa: 1000, days: '1-2' }], pickup_available: true,
  phone: '+237651234567', whatsapp: '+237651234567', instagram: null, created_at: iso(30),
};

// Réponses de Finia pour l'ajout en masse: une fiche par photo, dans l'ordre
// des appels. Titres/rayons crédibles pour des photos de mode.
const FINIA_LISTINGS = [
  { title: 'Robe wax élégante', description: 'Robe en wax aux motifs éclatants.', keywords: ['robe', 'wax'], category: 'femme_robes', price_hint_fcfa: 15000, price_samples: 8 },
  { title: 'Sac à main en cuir', description: 'Sac structuré, finitions dorées.', keywords: ['sac', 'cuir'], category: 'femme_sacs', price_hint_fcfa: 22000, price_samples: 5 },
  { title: 'Box braids stylées', description: 'Tresses prêtes à poser.', keywords: ['braids'], category: 'cheveux', price_hint_fcfa: 12000, price_samples: 4 },
  { title: 'Ensemble dashiki', description: 'Coupe moderne, tissu traditionnel.', keywords: ['dashiki'], category: 'mode_homme', price_hint_fcfa: 18000, price_samples: 6 },
  { title: 'Robe de soirée fluide', description: 'Tombé impeccable pour les grandes occasions.', keywords: ['robe'], category: 'femme_robes', price_hint_fcfa: 19000, price_samples: 8 },
];
let finiaCall = 0;

// Brouillons pour l'écran « Tout publier » (mêmes articles que le lot).
const drafts = FINIA_LISTINGS.map((l, i) => ({
  id: `d${i}`, shop_id: SHOP, name: l.title, price_fcfa: l.price_hint_fcfa, compare_at_price_fcfa: null,
  images: [`/demo-products/${['wd-03', 'sac-01', 'braids-01', 'dashiki-01', 'wd-04'][i]}.jpg`],
  category: l.category, stock: 1, views: 0, is_active: false, rotated_at: null,
  created_at: iso(0, 1), is_permanent: true, sizes: [], colors: [], attributes: {}, price_on_request: false,
}));

// Fil acheteur diversifié: 6 boutiques différentes dès le premier écran —
// c'est LE changement du soir, la vidéo doit le montrer.
const FEED_SHOPS = [
  { id: 's1', name: 'Chez Aïcha', slug: 'chez-aicha', country: 'CM', avatar_url: '/demo-products/turban-01.jpg', followers_count: 87, rating: 4.8, is_verified: true },
  { id: 's2', name: 'Nnal Beauty', slug: 'nnal', country: 'CM', avatar_url: '/demo-products/beaute-01.jpg', followers_count: 64, rating: 4.6, is_verified: true },
  { id: 's3', name: 'Atelier Kenté', slug: 'kente', country: 'CM', avatar_url: '/demo-products/kc-02.jpg', followers_count: 41, rating: 4.9, is_verified: false },
  { id: 's4', name: 'SM Store', slug: 'sm-store', country: 'CM', avatar_url: '/demo-products/parfum-02.jpg', followers_count: 38, rating: 4.5, is_verified: true },
  { id: 's5', name: 'Maison NGC', slug: 'ngc', country: 'CM', avatar_url: '/demo-products/ad-02.jpg', followers_count: 22, rating: 4.7, is_verified: false },
  { id: 's6', name: 'Yak store', slug: 'yak', country: 'CM', avatar_url: '/demo-products/lunettes-02.jpg', followers_count: 15, rating: 4.4, is_verified: false },
];
const FEED_ITEMS = [
  { shop: 0, name: 'Robe wax élégante', img: 'wd-03', price: 15000, compare: 20000 },
  { shop: 1, name: 'Coffret soins visage', img: 'beaute-02', price: 9500, compare: null },
  { shop: 2, name: 'Tissu kenté sur mesure', img: 'kc-01', price: 0, compare: null, onreq: true },
  { shop: 3, name: 'Parfum boisé intense', img: 'pf-01', price: 24000, compare: null },
  { shop: 4, name: 'Vase décoratif artisanal', img: 'ad-03', price: 13000, compare: null },
  { shop: 5, name: 'Lunettes aviateur', img: 'lunettes-02', price: 8000, compare: 11000 },
  { shop: 0, name: 'Sac à main en cuir', img: 'sac-01', price: 22000, compare: null },
  { shop: 1, name: 'Huile capillaire karité', img: 'beaute-01', price: 6000, compare: null },
].map((x, i) => ({
  id: `f${i}`, shop_id: FEED_SHOPS[x.shop].id, name: x.name,
  price_fcfa: x.price, compare_at_price_fcfa: x.compare, price_on_request: !!x.onreq,
  images: [`/demo-products/${x.img}.jpg`], video_url: null, category: 'mode_femme',
  stock: 5, views: 30 + i, shop_name: FEED_SHOPS[x.shop].name,
  shop_slug: FEED_SHOPS[x.shop].slug, shop_country: 'CM',
}));

function mockRoutes(page) {
  page.route('**/realtime/v1/**', (r) => r.abort());
  page.route('**/auth/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('/token')) return r.fulfill({ json: session });
    if (u.includes('/user')) return r.fulfill({ json: session.user });
    return r.fulfill({ json: {} });
  });
  page.route('**/functions/v1/**', (r) => r.fulfill({ json: {} }));
  page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ json: [] }));
  // NB: ordre inverse Playwright — les génériques ci-dessus sont enregistrés
  // AVANT les spécifiques pour être essayés APRÈS eux.
  // Upload storage: accepté; lecture d'une photo produit: on sert une vraie
  // image de démo pour que les lignes du lot montrent quelque chose.
  page.route('**/storage/v1/object/products/**', (r) => r.fulfill({ json: { Key: 'ok' } }));
  let served = 0;
  const cycle = ['wd-03.jpg', 'sac-01.jpg', 'braids-01.jpg', 'dashiki-01.jpg', 'wd-04.jpg'];
  page.route('**/storage/v1/object/public/products/**', (r) => {
    const img = readFileSync(join(DEMO, cycle[served++ % cycle.length]));
    return r.fulfill({ status: 200, contentType: 'image/jpeg', body: img });
  });
  page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const method = req.method();
    if (method === 'POST') return route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '[]' });
    if (method === 'PATCH') return route.fulfill({ status: 204, body: '' });
    let rows = [];
    if (table === 'shops') {
      const qs = url.searchParams.toString();
      // Requête « ma boutique » (par owner_id) → UNE seule ligne, sinon
      // maybeSingle() échoue et le layout vendeur redirige vers le profil.
      if (qs.includes('owner_id')) rows = [shopRow];
      else if (qs.includes('slug=eq.')) {
        const slug = url.searchParams.get('slug').slice(3);
        rows = FEED_SHOPS.filter((s) => s.slug === slug);
      } else if (qs.includes('id=eq.')) {
        const id = url.searchParams.get('id').slice(3);
        rows = [shopRow, ...FEED_SHOPS].filter((s) => s.id === id);
      } else rows = FEED_SHOPS;
    }
    else if (table === 'profiles') rows = [profile];
    else if (table === 'products') {
      const id = url.searchParams.get('id');
      if (id?.startsWith('eq.f')) rows = FEED_ITEMS.filter((p) => p.id === id.slice(3)).map((p) => ({ ...p, is_active: true, sizes: [], colors: [], attributes: {}, created_at: iso(0, 2), shops: FEED_SHOPS.find((s) => s.id === p.shop_id) }));
      else rows = drafts;
    }
    const h = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-expose-headers': 'content-range' };
    if (method === 'HEAD') return route.fulfill({ status: 200, headers: h, body: '' });
    return route.fulfill({ status: 200, headers: h, body: JSON.stringify(single ? rows[0] ?? null : rows) });
  });
  // Enregistrés en DERNIER (donc essayés en PREMIER): le catch-all
  // **/rest/v1/** ci-dessus matche aussi les URLs /rest/v1/rpc/*.
  page.route('**/functions/v1/vendor-copilot**', async (r) => {
    const body = FINIA_LISTINGS[finiaCall++ % FINIA_LISTINGS.length];
    await new Promise((res) => setTimeout(res, 700));
    return r.fulfill({ json: body });
  });
  page.route('**/rest/v1/rpc/home_feed_count**', (r) => r.fulfill({ json: FEED_ITEMS.length }));
  page.route('**/rest/v1/rpc/home_feed_page**', (r) => {
    const b = r.request().postDataJSON();
    return r.fulfill({ json: FEED_ITEMS.slice(b.p_offset, b.p_offset + b.p_limit) });
  });
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 797 }, deviceScaleFactor: 3,
  locale: 'fr-FR', timezoneId: 'Africa/Douala',
});
await ctx.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), ['sb-bokwivwizghdlaedczbw-auth-token', session]);
const page = await ctx.newPage();
mockRoutes(page);
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

// ---------- 1. Ajout en masse ----------
await page.goto('http://localhost:4701/vendor/products/bulk', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await shot('bulk-empty');

// Charger 5 photos réelles via le sélecteur de fichiers.
const files = ['wd-03.jpg', 'sac-01.jpg', 'braids-01.jpg', 'dashiki-01.jpg', 'wd-04.jpg'].map((f) => join(DEMO, f));
await page.locator('input[type="file"]').setInputFiles(files);
await page.waitForTimeout(3500);
await shot('bulk-photos');
console.log('ok bulk photos');

// Finia remplit — capture pendant la progression puis une fois fini.
await page.locator('button', { hasText: 'Faire écrire les noms par Finia' }).click();
await page.waitForTimeout(3200);
await shot('bulk-finia-progress');
await page.waitForTimeout(9000);
// Laisser le toast disparaître, puis cadrer sur les lignes remplies.
await page.waitForTimeout(4000);
await page.evaluate(() => document.querySelector('main')?.scrollTo(0, 900) || window.scrollTo(0, 900));
await page.waitForTimeout(600);
await shot('bulk-filled');
console.log('ok bulk Finia');

// Prix sur demande: coche la case commune — les prix laissent place au devis.
await page.locator('input[type="checkbox"]').first().check();
await page.waitForTimeout(600);
await shot('bulk-onrequest');
// Décocher pour la suite (le bouton Créer avec les prix remplis).
await page.locator('input[type="checkbox"]').first().uncheck();
await page.waitForTimeout(500);

// La barre « Créer N article(s) » ancrée en bas.
await page.evaluate(() => window.scrollTo(0, 300));
await page.waitForTimeout(500);
await shot('bulk-create');
console.log('ok bulk create');

// ---------- 2. Brouillons + Tout publier ----------
await page.goto('http://localhost:4701/vendor/products', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.locator('button', { hasText: 'Brouillons' }).click();
await page.waitForTimeout(900);
await shot('drafts-publish');
console.log('ok tout publier');

// ---------- 3. Fil acheteur diversifié ----------
await page.goto('http://localhost:4701/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await shot('buyer-home-mix');
// La grille diversifiée elle-même (noms de boutiques différents visibles).
await page.evaluate(() => document.querySelector('main')?.scrollTo(0, 1120));
await page.waitForTimeout(900);
await shot('buyer-feed-grid');
console.log('ok fil diversifié');

// ---------- 4. Fiche « Prix sur demande » côté acheteuse ----------
await page.goto('http://localhost:4701/product/f2', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
await shot('buyer-quote');
console.log('ok prix sur demande');

await browser.close();
srv.close();
console.log('CAPTURES V2 TERMINÉES');
