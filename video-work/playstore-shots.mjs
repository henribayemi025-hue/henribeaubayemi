// Captures d'écran pour la fiche Google Play.
//
// Reprend le harnais de revue (review-buyer.mjs): même serveur statique sur
// dist/, mêmes données simulées, même session pré-posée — donc aucun appel
// réseau réel et des écrans toujours identiques d'une exécution à l'autre.
//
// Seule vraie différence: le format. Google Play impose des captures en 16:9
// ou 9:16, chaque côté entre 320 et 3840 px, et exige au moins 1080 px de côté
// pour que l'appli soit éligible aux mises en avant. Un viewport de 360x640
// (un vrai gabarit de téléphone, donc la mise en page mobile — au-delà, l'app
// bascule sur la version large avec barre latérale) rendu à l'échelle 3 donne
// exactement 1080x1920, soit 9:16 pile.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const OUT = '/home/user/henribeaubayemi/video-work/playstore';
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4802, r));

const PROJECT_REF = 'bokwivwizghdlaedczbw';
const USER_ID = 'buyer-test-0000-0000-0000-000000000001';

// Boutiques et articles vitrines. Les noms restent génériques et les photos
// sont celles de la démo déjà versionnée: une capture Play Store est une
// publicité permanente, on n'y expose pas le catalogue réel d'une vendeuse
// sans son accord.
const SHOP_A = { id: 'shop-a', slug: 'atelier-kente', name: 'Atelier Kenté', country: 'CM', city: 'Douala', status: 'active', is_verified: true, rating: 4.8, followers_count: 412, avatar_url: null, bio: 'Prêt-à-porter et pièces sur mesure.' };
const SHOP_B = { id: 'shop-b', slug: 'maison-akwa', name: 'Maison Akwa', country: 'CM', city: 'Yaoundé', status: 'active', is_verified: true, rating: 4.6, followers_count: 188, avatar_url: null, bio: 'Décoration d’événement.' };

const now = Date.now();
const PHOTOS = ['/demo-products/wd-03.jpg', '/demo-products/wd-01.jpg', '/demo-products/wd-02.jpg', '/demo-products/wd-04.jpg'];
const NAMES = ['Robe longue en wax', 'Ensemble tailleur', 'Sac à main cuir', 'Parure de table'];
const mkProd = (i, shop) => ({
  id: `prod-${i}`, shop_id: shop.id, name: NAMES[(i - 1) % NAMES.length],
  price_fcfa: 12000 + i * 2500, compare_at_price_fcfa: i === 1 ? 21000 : null,
  price_on_request: false, images: [PHOTOS[(i - 1) % PHOTOS.length]], video_url: null,
  category: 'mode_femme', stock: 6, views: 120 + i, is_active: true,
  created_at: new Date(now - i * 60000).toISOString(),
  sizes: ['S', 'M', 'L'], colors: ['Rouge', 'Bleu', 'Ocre'], attributes: {},
  shops: shop, shop_name: shop.name, shop_slug: shop.slug, shop_country: shop.country,
});
const PRODUCTS = [mkProd(1, SHOP_A), mkProd(2, SHOP_A), mkProd(3, SHOP_B), mkProd(4, SHOP_B), mkProd(5, SHOP_A), mkProd(6, SHOP_B)];

const ORDER = {
  id: 'order-1', order_no: '1042', status: 'shipped', shop_id: SHOP_A.id, buyer_id: USER_ID,
  total_fcfa: 27500, delivery_fcfa: 1500, created_at: new Date(now - 86400000 * 2).toISOString(),
  address: 'Rue des Fleurs, Bonapriso, Douala', full_name: 'Aïcha M.', phone: '+237699112233',
  shops: SHOP_A,
  order_items: [{ id: 'item-1', product_id: 'prod-1', name: PRODUCTS[0].name, qty: 1, price_fcfa: 14500, size: 'M', color: 'Rouge', products: PRODUCTS[0] }],
};
const CONVERSATION = { id: 'conv-1', buyer_id: USER_ID, shop_id: SHOP_A.id, updated_at: new Date().toISOString(), shops: SHOP_A, last_message: 'Bonjour, la robe est-elle disponible en M ?' };
const MESSAGES = [
  { id: 'm1', conversation_id: 'conv-1', sender_id: USER_ID, body: 'Bonjour, la robe est-elle disponible en M ?', created_at: new Date(now - 600000).toISOString() },
  { id: 'm2', conversation_id: 'conv-1', sender_id: SHOP_A.id, body: 'Bonjour ! Oui, en M et en L. Je peux livrer demain sur Douala.', created_at: new Date(now - 300000).toISOString() },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// 360x640 CSS x3 = 1080x1920 = 9:16 exact.
// Trois formats, tous en 16:9 ou 9:16 comme l'exige Google Play:
//   phone   360x640  x3 = 1080x1920 (9:16)  — mise en page mobile
//   tab7    960x540  x2 = 1920x1080 (16:9)  — mise en page large, barre latérale
//   tab10  1280x720  x2 = 2560x1440 (16:9)
// Les tablettes sont en PAYSAGE volontairement: au-delà d'environ 900 px de
// large l'app passe sur la version à barre latérale, et c'est bien celle-là
// qu'une personne sur tablette verra — montrer la version mobile étirée
// donnerait une fausse idée de l'application.
const FORMATS = {
  phone: { width: 360, height: 640, scale: 3, dir: '' },
  tab7: { width: 960, height: 540, scale: 2, dir: 'tablette-7' },
  tab10: { width: 1280, height: 720, scale: 2, dir: 'tablette-10' },
};
const format = FORMATS[process.argv[2] || 'phone'];
if (!format) throw new Error('format inconnu: ' + process.argv[2]);
const outDir = format.dir ? `${OUT}/${format.dir}` : OUT;
mkdirSync(outDir, { recursive: true });
const ctx = await browser.newContext({ viewport: { width: format.width, height: format.height }, deviceScaleFactor: format.scale, locale: 'fr-FR', timezoneId: 'Africa/Douala' });

const session = {
  access_token: 'test-access-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
  user: { id: USER_ID, email: 'demo@finjaro.net', phone: null, app_metadata: {}, user_metadata: { name: 'Aïcha M.' }, aud: 'authenticated', created_at: new Date().toISOString() },
};
await ctx.addInitScript(([key, val]) => localStorage.setItem(key, val), [`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session)]);

const page = await ctx.newPage();
// Une capture d'écran d'un écran en erreur ne se voit pas dans le nom du
// fichier: on remonte les erreurs pour ne pas livrer une vitrine cassée.
page.on('console', (m) => { if (m.type() === 'error') console.log('  console:', m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('  erreur JS:', String(e).slice(0, 200)));
await page.route('**/realtime/v1/**', (r) => r.abort());
await page.route('**/auth/v1/user**', (r) => r.fulfill({ json: session.user }));
await page.route('**/auth/v1/token**', (r) => r.fulfill({ json: session }));
await page.route('**/auth/v1/**', (r) => r.fulfill({ json: {} }));
await page.route('**/rest/v1/rpc/home_feed_count**', (r) => r.fulfill({ json: PRODUCTS.length }));
await page.route('**/rest/v1/rpc/home_feed_page**', (r) => r.fulfill({ json: PRODUCTS }));
await page.route('**/rest/v1/rpc/**', (r) => r.fulfill({ json: [] }));
await page.route('**/rest/v1/**', (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
  let rows = [];
  if (table === 'shops') rows = [SHOP_A, SHOP_B];
  else if (table === 'products') rows = PRODUCTS;
  else if (table === 'orders') rows = [ORDER];
  else if (table === 'order_items') rows = ORDER.order_items;
  else if (table === 'conversations') rows = [CONVERSATION];
  else if (table === 'messages') rows = MESSAGES;
  else if (table === 'profiles') rows = [{ id: USER_ID, name: 'Aïcha M.', avatar_url: null, country: 'CM', currency: 'FCFA', created_at: new Date().toISOString() }];
  else if (table === 'categories') rows = [{ id: 'mode_femme', parent_id: null, kind: 'PRODUCT', label_fr: 'Mode Femme', label_en: 'Women' }];

  // Respecter les filtres d'égalité (`id=eq.prod-1`, `slug=eq.…`). Sans ça, la
  // fiche article recevait les SIX articles: `.maybeSingle()` refuse une
  // réponse à plusieurs lignes et l'écran basculait en « Quelque chose n'a pas
  // fonctionné » — une erreur muette, sans trace en console, qui serait partie
  // telle quelle sur la fiche Play Store.
  // Le chemin peut traverser une table liée (`shops.slug=eq.atelier-kente`,
  // le filtre du catalogue d'une boutique). Sans la descente dans l'objet
  // imbriqué, plus aucune ligne ne passait et la fiche boutique affichait
  // « 0 Produits » — vrai côté simulateur, faux et désastreux sur une
  // capture publicitaire.
  const at = (row, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), row);
  for (const [key, value] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
    if (!value.startsWith('eq.')) continue;
    const wanted = value.slice(3);
    rows = rows.filter((r) => String(at(r, key)) === wanted);
  }

  return route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
    body: JSON.stringify(single ? rows[0] ?? null : rows),
  });
});

const SHOTS = [
  ['/', '1-accueil'],
  ['/product/prod-1', '2-fiche-article'],
  ['/boutique/atelier-kente', '3-boutique'],
  ['/search', '4-recherche'],
  ['/chat/conv-1', '5-messagerie'],
  ['/profile/orders', '6-mes-commandes'],
  ['/services', '7-services'],
];

for (const [path, name] of SHOTS) {
  await page.goto(`http://localhost:4802${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Laisse les images du fil se charger: une capture avec des vignettes grises
  // dessert l'app plus qu'elle ne la montre.
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log('✓', name);
}

await browser.close();
srv.close();
