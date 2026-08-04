// Capture des écrans RÉELS de l'app (données simulées) pour la vidéo
// « Ouvre ta boutique ». Sortie: video-work/shots/*.png en 1170x2532 (x3).
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const OUT = '/home/user/henribeaubayemi/video-work/shots';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4700, r));

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

const products = [
  { id: 'p1', shop_id: SHOP, name: 'Robe wax élégante', price_fcfa: 15000, compare_at_price_fcfa: 20000, images: ['/demo-products/wd-03.jpg'], category: 'femme_robes', stock: 8, views: 132, is_active: true, created_at: iso(0, 5), is_permanent: true, sizes: ['S', 'M', 'L', 'XL'], colors: ['Rouge', 'Bleu'], attributes: {}, description: 'Robe en wax, coupe moderne, parfaite pour les grandes occasions.' },
  { id: 'p2', shop_id: SHOP, name: 'Sac à main cuir', price_fcfa: 22000, compare_at_price_fcfa: null, images: ['/demo-products/sac-01.jpg'], category: 'femme_sacs', stock: 5, views: 98, is_active: true, created_at: iso(1), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p3', shop_id: SHOP, name: 'Box braids stylées', price_fcfa: 12000, compare_at_price_fcfa: null, images: ['/demo-products/braids-01.jpg'], category: 'cheveux', stock: 10, views: 76, is_active: true, created_at: iso(2), is_permanent: true, sizes: [], colors: [], attributes: {} },
  { id: 'p4', shop_id: SHOP, name: 'Ensemble dashiki', price_fcfa: 18000, compare_at_price_fcfa: null, images: ['/demo-products/dashiki-01.jpg'], category: 'mode_homme', stock: 4, views: 65, is_active: true, created_at: iso(3), is_permanent: true, sizes: ['M', 'L'], colors: [], attributes: {} },
];

let orders = [
  { id: 'o1', order_no: '1042', status: 'new', total_fcfa: 30000, subtotal_fcfa: 30000, delivery_fee_fcfa: 0, created_at: iso(0, 0.4), buyer_id: 'b1', buyer_name: 'Marie N.', buyer_phone: '+237699112233', delivery_method: 'delivery', address: 'Rue des Fleurs, Bonapriso', city: 'Douala', shop_id: SHOP, order_items: [{ name: 'Robe wax élégante (M · Rouge)', qty: 2, price_fcfa: 15000 }] },
  { id: 'o2', order_no: '1041', status: 'delivered', total_fcfa: 22000, subtotal_fcfa: 22000, delivery_fee_fcfa: 0, created_at: iso(1), confirmed_at: iso(1, -2), shipped_at: iso(0, 20), delivered_at: iso(0, 8), buyer_id: 'b2', buyer_name: 'Grace M.', delivery_method: 'pickup', shop_id: SHOP, order_items: [{ name: 'Sac à main cuir', qty: 1, price_fcfa: 22000 }] },
  { id: 'o3', order_no: '1040', status: 'delivered', total_fcfa: 12000, subtotal_fcfa: 12000, delivery_fee_fcfa: 0, created_at: iso(2), confirmed_at: iso(2, -1), shipped_at: iso(1, 20), delivered_at: iso(1, 6), buyer_id: 'b3', buyer_name: 'Aïssatou B.', delivery_method: 'delivery', shop_id: SHOP, order_items: [{ name: 'Box braids stylées', qty: 1, price_fcfa: 12000 }] },
];

let notifs = [
  { id: 'n1', user_id: U, type: 'order_received', title: 'Nouvelle commande', body: '#1042 — 2 articles', data: { order_id: 'o1', order_no: '1042' }, read: false, created_at: iso(0, 0.4) },
  { id: 'n2', user_id: U, type: 'new_message', title: 'Nouveau message', body: 'Bonjour, la robe est dispo en L ?', data: { conversation_id: 'c1', for_role: 'vendor' }, read: false, created_at: iso(0, 3) },
];

const convs = [
  { id: 'c1', shop_id: SHOP, buyer_id: 'b1', last_message: 'Bonjour, la robe est dispo en L ?', last_message_at: iso(0, 3), vendor_unread: 1, buyer_unread: 0, profiles: { name: 'Marie N.' } },
];

// État partagé entre routes: la boutique « existe » seulement après le POST
// du parcours d'inscription (contexte A), et d'office au contexte B.
let shopExists = false;

// Réponse simulée de Finia côté vendeuse: elle connaît le chiffre de la
// semaine (l'app lui envoie un instantané des ventes dans le contexte).
const FINIA_VENDOR_REPLY = {
  reply: "Belle semaine ! 64 000 FCFA de ventes sur 7 jours, en hausse de 18 % — la « Robe wax élégante » représente à elle seule la moitié. Pense à réapprovisionner la taille M, il ne t'en reste que 3 🧡",
};

function mockRoutes(page) {
  page.route('**/realtime/v1/**', (r) => r.abort());
  page.route('**/functions/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('finou-chat')) return r.fulfill({ json: FINIA_VENDOR_REPLY });
    return r.fulfill({ json: {} });
  });
  page.route('**/auth/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('/otp')) return r.fulfill({ json: {} });
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
    if (method === 'POST') {
      if (table === 'shops') shopExists = true;
      return route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '[]' });
    }
    if (method === 'PATCH') {
      if (table === 'orders') {
        const id = url.searchParams.get('id')?.slice(3);
        const body = req.postDataJSON();
        orders = orders.map((o) => (o.id === id ? { ...o, ...body } : o));
      }
      if (table === 'notifications') notifs = notifs.map((n) => ({ ...n, read: true }));
      return route.fulfill({ status: 204, body: '' });
    }
    let rows = [];
    if (table === 'shops') rows = shopExists ? [shopRow] : [];
    else if (table === 'profiles') rows = [profile];
    else if (table === 'vendor_applications') rows = [];
    else if (table === 'products') {
      const id = url.searchParams.get('id');
      rows = id?.startsWith('eq.') ? products.filter((p) => p.id === id.slice(3)) : products;
    } else if (table === 'orders') {
      const st = url.searchParams.get('status');
      rows = st?.startsWith('eq.') ? orders.filter((o) => o.status === st.slice(3)) : orders;
    } else if (table === 'conversations') rows = convs;
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

async function newPage({ withSession }) {
  // 390x797 (et non 844): les 47 pt du haut sont réservés à la barre de
  // statut iOS dessinée par compose.html — l'app est capturée dans la zone
  // restante, comme sur un vrai iPhone.
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 797 },
    deviceScaleFactor: 3,
    locale: 'fr-FR',
    timezoneId: 'Africa/Douala',
  });
  await ctx.addInitScript(() => {
    // Géoloc instantanée (Douala) pour que BecomeVendor ne bloque pas 8 s.
    navigator.geolocation.getCurrentPosition = (ok) =>
      ok({ coords: { latitude: 4.05, longitude: 9.7 } });
  });
  if (withSession) {
    await ctx.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), ['sb-bokwivwizghdlaedczbw-auth-token', session]);
  }
  const page = await ctx.newPage();
  await mockRoutes(page);
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));
  return { ctx, page };
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

// ---------- Contexte A: nouvelle vendeuse ----------
{
  const { ctx, page } = await newPage({ withSession: false });
  // 1. Inscription par téléphone
  await page.goto('http://localhost:4700/auth', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.locator('button', { hasText: /S'inscrire/ }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Téléphone' }).click();
  await page.waitForTimeout(300);
  await page.locator('input').nth(0).fill('Aïcha K.');
  await page.locator('input[type="tel"]').fill('+237 651 23 45 67');
  await page.waitForTimeout(300);
  await shot(page, 'auth-phone');
  await page.locator('button', { hasText: 'Envoyer le code' }).click();
  await page.waitForTimeout(800);
  const otp = page.locator('input[autocomplete="one-time-code"]');
  if (await otp.count()) await otp.fill('4829');
  await page.waitForTimeout(300);
  await shot(page, 'auth-otp');
  console.log('ok auth');
  await ctx.close();
}

{
  const { ctx, page } = await newPage({ withSession: true });
  // 2. Créer la boutique
  await page.goto('http://localhost:4700/become-vendor', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('input').nth(0).fill('Chez Aïcha');
  await page.locator('input').nth(1).fill('Douala');
  await page.locator('button.chip', { hasText: 'Mode Femme' }).click();
  await page.locator('button.chip', { hasText: 'Beauté & Cosmétiques' }).click();
  await page.waitForTimeout(300);
  await shot(page, 'shop-step1');
  // Avancer jusqu'au bout
  for (let i = 0; i < 3; i++) {
    await page.locator('button', { hasText: 'Continuer' }).last().click();
    await page.waitForTimeout(400);
  }
  await page.locator('input[type="checkbox"]').check();
  await page.locator('button', { hasText: 'Envoyer ma demande' }).click();
  await page.waitForTimeout(1500);
  await shot(page, 'shop-done');
  console.log('ok boutique');
  await ctx.close();
}

// ---------- Contexte B: vendeuse installée ----------
shopExists = true;
{
  const { ctx, page } = await newPage({ withSession: true });
  // 3. Fiche article remplie
  await page.goto('http://localhost:4700/vendor/products/p1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, 'product-edit');
  // 4. Grille articles
  await page.goto('http://localhost:4700/vendor/products', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await shot(page, 'products-grid');
  // 5. Tableau de bord + cloche
  await page.goto('http://localhost:4700/vendor', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await shot(page, 'dashboard');
  await page.locator('button[aria-label="Notifications"]').click();
  await page.waitForTimeout(900);
  await shot(page, 'bell-panel');
  await page.keyboard.press('Escape');
  // 6. Commandes: nouvelle → valider → en cours
  await page.goto('http://localhost:4700/vendor/orders', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await shot(page, 'order-new');
  await page.locator('button', { hasText: 'Valider la commande' }).click();
  await page.waitForTimeout(1200);
  await page.locator('button', { hasText: 'En cours' }).click();
  await page.waitForTimeout(900);
  await shot(page, 'order-accepted');
  console.log('ok vendeur');
  // 7. Finia côté vendeuse: elle répond sur les ventes de la semaine.
  await page.goto('http://localhost:4700/vendor', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.locator('button[aria-label="Finia"]').last().click();
  await page.waitForTimeout(900);
  await page.locator('button.chip', { hasText: 'Mes ventes cette semaine' }).click();
  await page.waitForTimeout(2400);
  await shot(page, 'finia-vendor');
  console.log('ok Finia vendeuse');
  await ctx.close();
}

await browser.close();
srv.close();
console.log('CAPTURES TERMINÉES');
