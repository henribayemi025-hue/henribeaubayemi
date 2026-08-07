// Capture des écrans RÉELS côté acheteuse (données simulées) pour la vidéo
// « Achète en 3 clics ». Sortie: video-work/shots/buyer-*.png en 1170x2391.
// Même principe que capture.mjs: app servie depuis dist/, Supabase mocké,
// parcours réellement CLIQUÉ (panier, checkout, commande) — rien de photoshopé.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const OUT = '/home/user/henribeaubayemi/video-work/shots';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4701, r));

const now = Date.now();
const iso = (d, h = 2) => new Date(now - d * 864e5 - h * 36e5).toISOString();
const U = 'cccc3333-3333-4333-8333-333333333333';
const session = { access_token: 'f', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(now / 1000) + 3600, refresh_token: 'f', user: { id: U, aud: 'authenticated', role: 'authenticated', email: null, phone: '237699887766', app_metadata: {}, user_metadata: { name: 'Sandra T.' }, created_at: iso(20) } };
const profile = { id: U, name: 'Sandra T.', phone: '+237699887766', country: 'CM', currency: 'FCFA', locale: 'fr', is_vendor: false, is_admin: false, is_suspended: false, created_at: iso(20), referral_code: 'SANDRA1', address: 'Rue des Manguiers, Bonapriso', city: 'Douala' };

// 4 boutiques — celles de Beau + « Chez Aïcha » (continuité avec la vidéo A).
const shops = [
  { id: 's1', owner_id: 'v1', slug: 'chez-aicha', name: 'Chez Aïcha', avatar_url: '/demo-products/turban-01.jpg', banner_url: '/demo-products/wd-01.jpg', rating: 4.8, reviews_count: 12, followers_count: 87, is_verified: true, country: 'CM', city: 'Douala', status: 'active', bio: 'Mode & beauté, Douala', categories: ['mode_femme'], offers_delivery: true, delivery_fee_fcfa: 1000, delivery_zones: [{ name: 'Akwa', fee_fcfa: 1000, days: '1' }, { name: 'Bonapriso', fee_fcfa: 1000, days: '1' }, { name: 'Bonabéri', fee_fcfa: 1500, days: '2' }], pickup_available: true, phone: '+237651234567', whatsapp: '+237651234567' },
  { id: 's2', owner_id: 'v2', slug: 'beauty-hairs', name: 'Beauty Hairs', avatar_url: '/demo-products/hb-01.jpg', banner_url: '/demo-products/hb-02.jpg', rating: 4.9, reviews_count: 31, followers_count: 214, is_verified: true, country: 'CM', city: 'Douala', status: 'active', bio: 'Perruques & soins', categories: ['beaute_cosmetiques'], offers_delivery: true, delivery_fee_fcfa: 1000, delivery_zones: [], pickup_available: true },
  { id: 's3', owner_id: 'v3', slug: 'camerounian-chanel', name: 'Camerounian Chanel', avatar_url: '/demo-products/kc-01.jpg', banner_url: '/demo-products/kc-02.jpg', rating: 4.7, reviews_count: 18, followers_count: 156, is_verified: true, country: 'CM', city: 'Yaoundé', status: 'active', bio: 'Luxe accessible', categories: ['mode_femme'], offers_delivery: true, delivery_fee_fcfa: 1500, delivery_zones: [], pickup_available: true },
  { id: 's4', owner_id: 'v4', slug: 'decor-and-co', name: 'Décor & Co', avatar_url: '/demo-products/deco-01.jpg', banner_url: '/demo-products/deco-02.jpg', rating: 4.6, reviews_count: 9, followers_count: 64, is_verified: false, country: 'CM', city: 'Douala', status: 'active', bio: 'Déco artisanale', categories: ['maison_deco'], offers_delivery: true, delivery_fee_fcfa: 1000, delivery_zones: [], pickup_available: true },
];
const shopEmbed = (id) => { const s = shops.find((x) => x.id === id); return { id: s.id, name: s.name, slug: s.slug, country: s.country, is_verified: s.is_verified, rating: s.rating, avatar_url: s.avatar_url, whatsapp: s.whatsapp || null, phone: s.phone || null }; };

const products = [
  { id: 'p1', shop_id: 's1', name: 'Robe wax élégante', price_fcfa: 15000, compare_at_price_fcfa: 20000, images: ['/demo-products/wd-03.jpg', '/demo-products/wd-04.jpg'], category: 'femme_robes', stock: 8, views: 132, is_active: true, created_at: iso(0, 5), is_permanent: true, sizes: ['S', 'M', 'L', 'XL'], colors: ['Rouge', 'Bleu'], attributes: {}, description: 'Robe en wax, coupe moderne, parfaite pour les grandes occasions. Tissu premium cousu main à Douala.' },
  { id: 'p2', shop_id: 's3', name: 'Sac à main cuir', price_fcfa: 22000, compare_at_price_fcfa: null, images: ['/demo-products/sac-01.jpg'], category: 'femme_sacs', stock: 5, views: 98, is_active: true, created_at: iso(1), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p3', shop_id: 's2', name: 'Box braids stylées', price_fcfa: 12000, compare_at_price_fcfa: null, images: ['/demo-products/braids-01.jpg'], category: 'cheveux', stock: 10, views: 76, is_active: true, created_at: iso(1, 8), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p4', shop_id: 's2', name: 'Perruque lace wave', price_fcfa: 25000, compare_at_price_fcfa: 32000, images: ['/demo-products/hb-03.jpg'], category: 'cheveux', stock: 3, views: 164, is_active: true, created_at: iso(2), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p5', shop_id: 's3', name: 'Parfum oud intense', price_fcfa: 18000, compare_at_price_fcfa: null, images: ['/demo-products/parfum-01.jpg'], category: 'beaute', stock: 7, views: 88, is_active: true, created_at: iso(2, 9), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p6', shop_id: 's1', name: 'Sandales dorées', price_fcfa: 9000, compare_at_price_fcfa: null, images: ['/demo-products/sandale-01.jpg'], category: 'femme_chaussures', stock: 6, views: 54, is_active: true, created_at: iso(3), is_permanent: true, sizes: ['37', '38', '39', '40'], colors: [], attributes: {} },
  { id: 'p7', shop_id: 's3', name: 'Montre élégante', price_fcfa: 30000, compare_at_price_fcfa: null, images: ['/demo-products/montre-01.jpg'], category: 'accessoires', stock: 4, views: 71, is_active: true, created_at: iso(3, 7), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p8', shop_id: 's4', name: 'Vase déco artisanal', price_fcfa: 14000, compare_at_price_fcfa: null, images: ['/demo-products/deco-01.jpg'], category: 'maison_deco', stock: 5, views: 43, is_active: true, created_at: iso(4), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p9', shop_id: 's1', name: 'Robe de soirée', price_fcfa: 28000, compare_at_price_fcfa: 35000, images: ['/demo-products/wd-05.jpg'], category: 'femme_robes', stock: 2, views: 120, is_active: true, created_at: iso(4, 6), is_permanent: true, sizes: ['S', 'M', 'L'], colors: [], attributes: {} },
  { id: 'p10', shop_id: 's3', name: 'Bague plaquée or', price_fcfa: 7000, compare_at_price_fcfa: null, images: ['/demo-products/bague-01.jpg'], category: 'bijoux', stock: 12, views: 66, is_active: true, created_at: iso(5), is_permanent: true, sizes: [], colors: [], attributes: {} },
].map((p) => ({ ...p, shops: shopEmbed(p.shop_id) }));

const reviews = [
  { id: 'r1', rating: 5, body: 'Superbe qualité, reçue en 24h à Akwa !', created_at: iso(3) },
  { id: 'r2', rating: 5, body: 'La coupe est parfaite, je recommande.', created_at: iso(8) },
];

// Commandes de Sandra (suivi acheteuse) — la #1043 est créée EN DIRECT par le
// parcours checkout, les deux autres donnent de la vie à l'historique.
let myOrders = [
  { id: 'oB', order_no: '1038', status: 'shipped', total_fcfa: 12000, subtotal_fcfa: 12000, delivery_fee_fcfa: 0, created_at: iso(1), confirmed_at: iso(0, 20), shipped_at: iso(0, 6), buyer_id: U, buyer_name: 'Sandra T.', delivery_method: 'delivery', address: 'Rue des Manguiers', city: 'Bonapriso', shop_id: 's2', shops: { name: 'Beauty Hairs' }, order_items: [{ product_id: 'p3', name: 'Box braids stylées', qty: 1, price_fcfa: 12000 }], reviews: [] },
  { id: 'oC', order_no: '1031', status: 'delivered', total_fcfa: 22000, subtotal_fcfa: 22000, delivery_fee_fcfa: 0, created_at: iso(6), confirmed_at: iso(5, 20), shipped_at: iso(5), delivered_at: iso(4, 12), buyer_id: U, buyer_name: 'Sandra T.', delivery_method: 'pickup', shop_id: 's3', shops: { name: 'Camerounian Chanel' }, order_items: [{ product_id: 'p2', name: 'Sac à main cuir', qty: 1, price_fcfa: 22000 }], reviews: [{ id: 'rv1' }] },
];
let orderSeq = 1043;

const notifs = [
  { id: 'n1', user_id: U, type: 'order_shipped', title: 'Commande expédiée', body: '#1038 — Beauty Hairs', data: { order_id: 'oB' }, read: false, created_at: iso(0, 6) },
];

const conv = { id: 'c9', shop_id: 's1', buyer_id: U, last_message: 'Parfait, je commande tout de suite !', last_message_at: iso(0, 1), vendor_unread: 1, buyer_unread: 0, shops: shopEmbed('s1') };
const chatMessages = [
  { id: 'm1', conversation_id: 'c9', sender_id: U, body: 'Bonjour ! La robe wax est dispo en M ?', created_at: iso(0, 1.6), read: true },
  { id: 'm2', conversation_id: 'c9', sender_id: 'v1', body: 'Oui ma belle, il en reste 3 en M 🧡 Livraison possible dès demain à Bonapriso.', created_at: iso(0, 1.3), read: true },
  { id: 'm3', conversation_id: 'c9', sender_id: U, body: 'Parfait, je commande tout de suite !', created_at: iso(0, 1), read: true },
];

// Boutiques prestataires (onglet Services) — elles portent un métier de
// service dans `categories`, c'est ce qui décide de leur présence là-bas.
const serviceShops = [
  { id: 'sv1', owner_id: 'w1', slug: 'coiffure-express', name: 'Coiffure Express', avatar_url: '/demo-products/braids-01.jpg', banner_url: '/demo-products/hb-01.jpg', rating: 4.9, reviews_count: 24, followers_count: 132, is_verified: true, country: 'CM', city: 'Douala', neighborhood: 'Akwa', status: 'active', bio: 'Coiffure & soins à domicile', categories: ['beaute_domicile'], offers_delivery: false, delivery_zones: [], pickup_available: false, phone: '+237655001122', whatsapp: '+237655001122' },
  { id: 'sv2', owner_id: 'w2', slug: 'chef-mariam', name: 'Chef Mariam', avatar_url: '/demo-products/evenement-01.jpg', banner_url: '/demo-products/mariage-01.jpg', rating: 5.0, reviews_count: 17, followers_count: 98, is_verified: true, country: 'CM', city: 'Douala', neighborhood: 'Bonapriso', status: 'active', bio: 'Traiteur événements & repas maison', categories: ['traiteur_chef'], offers_delivery: false, delivery_zones: [], pickup_available: false, phone: '+237655334455' },
  { id: 'sv3', owner_id: 'w3', slug: 'studio-lumiere', name: 'Studio Lumière', avatar_url: '/demo-products/mannequin-01.jpg', banner_url: '/demo-products/mn-01.jpg', rating: 4.8, reviews_count: 11, followers_count: 76, is_verified: false, country: 'CM', city: 'Yaoundé', status: 'active', bio: 'Photo & vidéo, shooting mode', categories: ['photo_video'], offers_delivery: false, delivery_zones: [], pickup_available: false },
  { id: 'sv4', owner_id: 'w4', slug: 'atelier-couture-nina', name: 'Atelier Nina', avatar_url: '/demo-products/sw-01.jpg', banner_url: '/demo-products/sw-02.jpg', rating: 4.7, reviews_count: 8, followers_count: 54, is_verified: true, country: 'CM', city: 'Douala', status: 'active', bio: 'Couture sur mesure & retouches', categories: ['couture_retouches'], offers_delivery: false, delivery_zones: [], pickup_available: false },
];
// Prestations affichées sur les cartes (photos de vitrine + prix d'appel).
const serviceProducts = [
  { id: 'svp1', shop_id: 'sv1', name: 'Pose box braids à domicile', price_fcfa: 8000, images: ['/demo-products/braids-01.jpg'], is_active: true, category: 'beaute_domicile' },
  { id: 'svp2', shop_id: 'sv1', name: 'Soin & brushing', price_fcfa: 5000, images: ['/demo-products/hb-02.jpg'], is_active: true, category: 'beaute_domicile' },
  { id: 'svp3', shop_id: 'sv2', name: 'Menu événement (20 pers.)', price_fcfa: 45000, images: ['/demo-products/evenement-01.jpg'], is_active: true, category: 'traiteur_chef' },
  { id: 'svp4', shop_id: 'sv3', name: 'Shooting photo 1h', price_fcfa: 25000, images: ['/demo-products/mn-01.jpg'], is_active: true, category: 'photo_video' },
  { id: 'svp5', shop_id: 'sv4', name: 'Retouche robe', price_fcfa: 3000, images: ['/demo-products/sw-03.jpg'], is_active: true, category: 'couture_retouches' },
];

// Reels de l'onglet Fin (vidéos courtes attachées à un article).
const reels = [
  { id: 'rl1', shop_id: 's1', product_id: 'p1', video_url: '/demo-products/reel-wd-03.webm', thumbnail_url: '/demo-products/wd-03.jpg', caption: 'La robe wax qui fait tourner les têtes 🔥', likes: 214, comments: 18, views: 1840, created_at: iso(0, 4), shops: { name: 'Chez Aïcha', slug: 'chez-aicha', avatar_url: '/demo-products/turban-01.jpg', owner_id: 'v1' }, products: { id: 'p1', name: 'Robe wax élégante', price_fcfa: 15000, images: ['/demo-products/wd-03.jpg'], stock: 8, shop_id: 's1' } },
  { id: 'rl2', shop_id: 's2', product_id: 'p4', video_url: '/demo-products/reel-hb-03.webm', thumbnail_url: '/demo-products/hb-03.jpg', caption: 'Pose de perruque lace en 20 minutes', likes: 176, comments: 9, views: 1320, created_at: iso(1), shops: { name: 'Beauty Hairs', slug: 'beauty-hairs', avatar_url: '/demo-products/hb-01.jpg', owner_id: 'v2' }, products: { id: 'p4', name: 'Perruque lace wave', price_fcfa: 25000, images: ['/demo-products/hb-03.jpg'], stock: 3, shop_id: 's2' } },
];

// Réponse simulée de Finia (fonction edge finou-chat) — le vrai composant
// enchaîne ensuite une requête produits sur `category` et affiche le
// carrousel d'articles réellement achetables.
const FINIA_REPLY = {
  reply: "Bien sûr ! J'ai trouvé de très jolies robes wax chez nos boutiques de Douala. La « Robe wax élégante » de Chez Aïcha est à −25 % aujourd'hui, en tailles S à XL. Je te montre la sélection 👇",
  category: 'femme_robes',
};

function mockRoutes(page) {
  page.route('**/realtime/v1/**', (r) => r.abort());
  page.route('**/functions/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('finou-chat')) return r.fulfill({ json: FINIA_REPLY });
    return r.fulfill({ json: {} });
  });
  page.route('**/auth/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('/token')) return r.fulfill({ json: session });
    if (u.includes('/user')) return r.fulfill({ json: session.user });
    return r.fulfill({ json: {} });
  });
  page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const method = req.method();
    const eq = (k) => { const v = url.searchParams.get(k); return v?.startsWith('eq.') ? v.slice(3) : null; };

    if (method === 'POST') {
      if (table === 'orders') {
        const body = req.postDataJSON();
        const order = { id: `live-${orderSeq}`, order_no: String(orderSeq), shop_id: body.shop_id, ...body, shops: { name: shops.find((s) => s.id === body.shop_id)?.name }, order_items: [{ product_id: 'p1', name: 'Robe wax élégante (M · Rouge)', qty: 1, price_fcfa: 15000 }, { product_id: 'p6', name: 'Sandales dorées (38)', qty: 1, price_fcfa: 9000 }], reviews: [] };
        orderSeq += 1;
        myOrders = [order, ...myOrders];
        return route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: JSON.stringify(single ? order : [order]) });
      }
      return route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '[]' });
    }
    if (method === 'PATCH') {
      if (table === 'notifications') notifs.forEach((n) => { n.read = true; });
      return route.fulfill({ status: 204, body: '' });
    }

    const allShops = [...shops, ...serviceShops];
    const allProducts = [...products, ...serviceProducts];
    let rows = [];
    if (table === 'shops') {
      const id = eq('id'); const slug = eq('slug');
      // L'annuaire Services demande toutes les boutiques actives; l'accueil
      // et le reste ne montrent que les boutiques produit.
      const wantsAll = url.searchParams.get('select') === '*';
      rows = id ? allShops.filter((s) => s.id === id)
        : slug ? allShops.filter((s) => s.slug === slug)
        : wantsAll ? allShops : shops;
    } else if (table === 'profiles') rows = [profile];
    else if (table === 'products') {
      const id = eq('id'); const shopId = eq('shop_id'); const cat = eq('category');
      rows = id ? allProducts.filter((p) => p.id === id)
        : shopId ? allProducts.filter((p) => p.shop_id === shopId)
        : cat ? allProducts.filter((p) => p.category === cat)
        : products;
      const inList = url.searchParams.get('shop_id') || url.searchParams.get('id');
      if (inList?.startsWith('in.')) {
        const ids = inList.slice(4, -1).split(',').map((s) => s.replace(/"/g, ''));
        rows = allProducts.filter((p) => ids.includes(p.shop_id) || ids.includes(p.id));
      }
      rows = rows.map((p) => ({ ...p, shops: p.shops || { name: allShops.find((s) => s.id === p.shop_id)?.name } }));
    } else if (table === 'near_you_listings') rows = [];
    else if (table === 'orders') {
      const st = url.searchParams.get('status');
      rows = myOrders;
      if (st?.startsWith('eq.')) rows = rows.filter((o) => o.status === st.slice(3));
      if (st?.startsWith('in.')) { const sts = st.slice(4, -1).split(','); rows = rows.filter((o) => sts.includes(o.status)); }
    } else if (table === 'reviews') rows = reviews;
    else if (table === 'conversations') rows = [conv];
    else if (table === 'chat_messages') rows = chatMessages;
    else if (table === 'shop_follows') rows = [];
    else if (table === 'reels') rows = reels;
    else if (table === 'notifications') {
      const rd = url.searchParams.get('read');
      rows = rd === 'eq.false' ? notifs.filter((n) => !n.read) : notifs;
    }
    const h = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-expose-headers': 'content-range' };
    if (method === 'HEAD') return route.fulfill({ status: 200, headers: h, body: '' });
    return route.fulfill({ status: 200, headers: h, body: JSON.stringify(single ? rows[0] ?? null : rows) });
  });
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 797 },
  deviceScaleFactor: 3,
  locale: 'fr-FR',
  timezoneId: 'Africa/Douala',
});
await ctx.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), ['sb-bokwivwizghdlaedczbw-auth-token', session]);
const page = await ctx.newPage();
await mockRoutes(page);
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));
const shot = (name) => page.screenshot({ path: `${OUT}/buyer-${name}.png` });

// 1. Accueil vivant
await page.goto('http://localhost:4701/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);
await shot('home');
// Accueil scrollé sur la grille « Nouveautés » — montre l'abondance du
// catalogue dans la vidéo.
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 780 }));
await page.waitForTimeout(900);
await shot('home-grid');
console.log('ok home');

// 2. Fiche produit — taille M + couleur Rouge réellement sélectionnées
await page.goto('http://localhost:4701/product/p1', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
await page.locator('button', { hasText: /^M$/ }).first().click();
await page.locator('button', { hasText: /^Rouge$/ }).first().click();
// Revenir tout en haut: les clics sur les variantes peuvent avoir légèrement
// scrollé la fiche, on veut la photo entière dans la capture.
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 0 }));
await page.waitForTimeout(500);
await shot('product');
// 3. Ajout panier réel → mini-tiroir de confirmation
await page.locator('button', { hasText: 'Ajouter au panier' }).click();
await page.waitForTimeout(900);
await shot('product-added');
console.log('ok produit');

// 2e article même boutique pour un panier crédible
await page.goto('http://localhost:4701/product/p6', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
const sz = page.locator('button', { hasText: /^38$/ });
if (await sz.count()) await sz.first().click();
await page.locator('button', { hasText: 'Ajouter au panier' }).click();
await page.waitForTimeout(600);

// 4. Panier
await page.goto('http://localhost:4701/cart', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await shot('cart');
console.log('ok panier');

// 5. Checkout: livraison + zone + adresse pré-remplie du profil
await page.locator('button', { hasText: 'Passer commande' }).first().click();
await page.waitForTimeout(1800);
await page.locator('button', { hasText: /^Livraison$/ }).click();
await page.waitForTimeout(500);
const zoneSel = page.locator('select').first();
if (await zoneSel.count()) await zoneSel.selectOption({ index: 1 }).catch(() => {});
await page.waitForTimeout(400);
await shot('checkout');
// 6. Commande réellement passée → écran de confirmation
await page.locator('button', { hasText: 'Payer à la livraison' }).click();
await page.waitForTimeout(1500);
await shot('order-done');
console.log('ok checkout');

// 7. Suivi de commandes
await page.goto('http://localhost:4701/profile/orders', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
await shot('orders-track');

// 8. Chat avec la vendeuse
await page.goto('http://localhost:4701/chat/c9', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
await shot('chat');
console.log('ok suivi + chat');

// 9. Finia — l'assistante IA: on tape une vraie question et on capture la
// réponse + le carrousel d'articles qu'elle propose.
await page.goto('http://localhost:4701/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2400);
await page.locator('button[aria-label="Finia"]').last().click();
await page.waitForTimeout(900);
await shot('finia-open');
await page.locator('input[aria-label="Pose ta question à Finia…"], textarea[aria-label="Pose ta question à Finia…"]').first()
  .fill('Je cherche une robe wax pour un mariage à Douala');
await page.waitForTimeout(300);
await page.locator('button[aria-label="Envoyer"]').click();
await page.waitForTimeout(2600);
await shot('finia-reply');
console.log('ok Finia');

// 10. Services — l'annuaire des prestataires
await page.goto('http://localhost:4701/services', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await shot('services');
console.log('ok services');

// 11. Fin — les vidéos courtes
await page.goto('http://localhost:4701/fin', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await shot('fin');
console.log('ok fin');

await ctx.close();
await browser.close();
srv.close();
console.log('CAPTURES ACHETEUSE TERMINÉES');
