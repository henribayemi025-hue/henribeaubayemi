// Captures d'écran pour les fiches Google Play ET App Store.
//
// Reprend le harnais de revue (review-buyer.mjs): même serveur statique sur
// dist/, mêmes données simulées, même session pré-posée — donc aucun appel
// réseau réel et des écrans toujours identiques d'une exécution à l'autre.
//
// Seule vraie différence: le format, et chaque magasin a le sien.
//
// Google Play impose du 16:9 ou du 9:16, chaque côté entre 320 et 3840 px, et
// au moins 1080 px de côté pour être éligible aux mises en avant.
//
// L'App Store, lui, n'accepte QUE les dimensions exactes de ses appareils de
// référence: une image à un pixel près à côté est refusée à l'envoi, sans
// possibilité de recadrage. Les gabarits ci-dessous sont donc calculés pour
// tomber juste — viewport en points x densité = dimensions attendues.
//
// Usage: node video-work/store-shots.mjs <format>
//   (voir la table FORMATS; défaut « phone »)
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const ROOT = '/home/user/henribeaubayemi/video-work';

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
// Google Play — 16:9 ou 9:16, 1080 px de côté minimum:
//   phone   360x640  x3 = 1080x1920 (9:16)  — mise en page mobile
//   tab7    960x540  x2 = 1920x1080 (16:9)  — mise en page large, barre latérale
//   tab10  1280x720  x2 = 2560x1440 (16:9)
// Les tablettes sont en PAYSAGE volontairement: au-delà d'environ 900 px de
// large l'app passe sur la version à barre latérale, et c'est bien celle-là
// qu'une personne sur tablette verra — montrer la version mobile étirée
// donnerait une fausse idée de l'application.
//
// App Store — dimensions imposées au pixel près:
//   iphone69  440x956  x3 = 1320x2868  iPhone 16 Pro Max, le seul format
//                                      d'iPhone encore exigé par Apple
//   iphone65  428x926  x3 = 1284x2778  ancien gabarit, accepté en secours
//   ipad13   1024x1366 x2 = 2048x2732  OBLIGATOIRE: le projet iOS déclare
//                                      TARGETED_DEVICE_FAMILY "1,2", donc une
//                                      app iPad, et Apple refuse la fiche sans
//                                      captures iPad. À 1024 points de large,
//                                      c'est bien la version à barre latérale
//                                      qui s'affiche — la bonne.
// Les valeurs en points sont celles des vrais appareils: y toucher casse la
// correspondance et l'envoi est rejeté.
const FORMATS = {
  phone: { width: 360, height: 640, scale: 3, store: 'playstore', dir: '' },
  tab7: { width: 960, height: 540, scale: 2, store: 'playstore', dir: 'tablette-7' },
  tab10: { width: 1280, height: 720, scale: 2, store: 'playstore', dir: 'tablette-10' },
  iphone69: { width: 440, height: 956, scale: 3, store: 'appstore', dir: 'iphone-6.9' },
  iphone65: { width: 428, height: 926, scale: 3, store: 'appstore', dir: 'iphone-6.5' },
  ipad13: { width: 1024, height: 1366, scale: 2, store: 'appstore', dir: 'ipad-13' },
};
const format = FORMATS[process.argv[2] || 'phone'];
if (!format) throw new Error(`format inconnu: ${process.argv[2]} (attendu: ${Object.keys(FORMATS).join(', ')})`);
const outDir = format.dir ? `${ROOT}/${format.store}/${format.dir}` : `${ROOT}/${format.store}`;
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
// UN SEUL gestionnaire pour tout /rest/v1/, appels de fonction compris.
//
// Il y en avait quatre auparavant, du plus précis au plus général. Playwright
// consulte ses routes de la DERNIÈRE enregistrée à la première: le filet
// `**/rest/v1/**` passait donc AVANT les trois routes `rpc/…` et les avalait.
// `home_feed_page` retombait sur la table nommée « rpc/home_feed_page », donc
// aucune ligne, donc « Aucun produit pour le moment » sur la capture d'accueil
// — la première image de la fiche des deux magasins. Rien en console, rien
// dans les journaux: l'écran d'accueil est LÉGITIMEMENT vide quand il n'y a
// pas d'article, et review-buyer.mjs ne vérifie que les erreurs.
// Un gestionnaire unique qui aiguille lui-même supprime la question de
// l'ordre plutôt que d'en dépendre.
await page.route('**/rest/v1/**', (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const path = url.pathname.split('/rest/v1/')[1].split('?')[0];

  if (path.startsWith('rpc/')) {
    const fn = path.slice(4);
    const json = fn === 'home_feed_page' ? PRODUCTS : fn === 'home_feed_count' ? PRODUCTS.length : [];
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify(json),
    });
  }

  const table = path;
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

// Dimensions réelles d'un PNG: elles sont dans l'en-tête IHDR, deux entiers de
// 4 octets à partir de l'octet 16. On les relit au lieu de faire confiance au
// viewport — l'App Store refuse une image dont la taille ne tombe pas juste, et
// le message d'erreur arrive après un envoi de plusieurs minutes.
const pngSize = (file) => {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
const expected = [format.width * format.scale, format.height * format.scale];

let bad = 0;
for (const [path, name] of SHOTS) {
  await page.goto(`http://localhost:4802${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Laisse les images du fil se charger: une capture avec des vignettes grises
  // dessert l'app plus qu'elle ne la montre.
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
  const file = `${outDir}/${name}.png`;
  await page.screenshot({ path: file });
  const [w, h] = pngSize(file);
  const ok = w === expected[0] && h === expected[1];
  if (!ok) bad += 1;
  console.log(`${ok ? '✓' : '✗'} ${name}  ${w}x${h}${ok ? '' : ` — ATTENDU ${expected[0]}x${expected[1]}`}`);
}
console.log(`\n${format.width}x${format.height} @${format.scale}x → ${expected[0]}x${expected[1]} · ${outDir}`);

await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
