// Vidéo « comment créer un compte » — 09/09.
//
// Différence avec les captures précédentes: le fil d'accueil et la bande de
// boutiques montrent de VRAIES fiches (nom, prix, boutique — lus en base il y
// a quelques minutes), pas des données inventées. Seules les PHOTOS restent
// des visuels de démonstration (public/demo-products): la connexion réseau
// directe vers finjaro.net/Supabase est bloquée depuis ce bac à sable, donc
// pas moyen de récupérer les vraies photos des vendeuses pour cet
// enregistrement — et CLAUDE.md interdit de toute façon toute photo prise
// ailleurs que chez la vendeuse elle-même. Le compte créé pendant
// l'enregistrement est un mannequin (Aïcha K.) — jamais persisté nulle part,
// tout le réseau est intercepté par Playwright.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const SC = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = createServer((req, res) => {
  let p = join(DIST, req.url.split('?')[0]);
  if (!existsSync(p) || extname(p) === '') p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4703, r));

const now = Date.now();
const iso = (d, h = 2) => new Date(now - d * 864e5 - h * 36e5).toISOString();

// Le compte créé PENDANT l'enregistrement — un mannequin, jamais écrit en base.
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

// Boutiques réelles (lues en base le 09/09) — noms, pays, vérification,
// abonnés: rien d'inventé. Seul avatar_url est vide: l'app dessine alors un
// dégradé + initiale (ShopAvatar), ce qui est déjà le vrai rendu pour les
// boutiques sans logo.
const FEED_SHOPS = [
  { id: 's1', name: 'Yak store', slug: 'yak-store-yv46', country: 'CM', avatar_url: null, followers_count: 1, rating: 0, is_verified: false },
  { id: 's2', name: 'La vitrine de Rachelle', slug: 'la-vitrine-de-rachelle-m6la', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's3', name: 'Polo', slug: 'polo-8ww2', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: false },
  { id: 's4', name: '✨🛍️ Luxury Shop & Cosmetic by Ima 💆🏽‍♀️🎀 🛒✨', slug: 'luxury-shop-cosmetic-by-ima-k1pd', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's5', name: "ECLAT D'ÉBÈNE", slug: 'eclat-d-ebene-w8dd', country: 'CM', avatar_url: null, followers_count: 1, rating: 0, is_verified: true },
  { id: 's6', name: 'Ange fashion beauty ( AFB)', slug: 'ange-fashion-beauty-afb-a4cf', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's7', name: 'Artisanat de rêve', slug: 'artisanat-de-reve-gtmc', country: 'CM', avatar_url: null, followers_count: 0, rating: 0, is_verified: true },
  { id: 's8', name: 'Décoration évents', slug: 'decoration-events-vas8', country: 'FR', avatar_url: null, followers_count: 0, rating: 0, is_verified: false },
];

// Fiches réelles — mêmes noms/prix/rayons que ceux vus en base ce matin.
// Les photos (public/demo-products) sont des visuels de démonstration —
// pas les vraies photos des boutiques, pour la raison expliquée en tête de
// fichier.
const FEED_ITEMS = [
  { shop: 0, name: 'Maillot du barca', img: 'sw-01', price: 25000, compare: null, category: 'mode' },
  { shop: 1, name: 'Paire', img: 'sneaker-01', price: 30000, compare: null, category: 'mode_homme' },
  { shop: 2, name: '2 plaques à pizza et un rouleau pique pâte', img: 'md-01', price: 10000, compare: 14900, category: 'electro_cuisine' },
  { shop: 3, name: 'Ensemble tailleur chic et tendance', img: 'blazer-01', price: 14000, compare: 18000, category: 'femme_vestes_manteaux' },
  { shop: 4, name: 'Savon Noir de Qualité', img: 'beaute-01', price: 4000, compare: null, category: 'beaute' },
  { shop: 5, name: 'Ensemble sport femme rouge - brassière et short cycliste', img: 'sw-02', price: 6000, compare: 10000, category: 'femme_robes' },
  { shop: 6, name: 'Sac en perles 😍', img: 'sac-01', price: 20000, compare: null, category: 'mode_femme' },
  { shop: 7, name: 'Décoration table réception africaine', img: 'mariage-01', price: 62500, compare: null, category: 'mariages' },
].map((x, i) => ({
  id: `f${i}`, shop_id: FEED_SHOPS[x.shop].id, name: x.name,
  price_fcfa: x.price, compare_at_price_fcfa: x.compare, price_on_request: false,
  images: [`/demo-products/${x.img}.jpg`], video_url: null, category: x.category,
  stock: 5, views: 40 - i, shop_name: FEED_SHOPS[x.shop].name,
  shop_slug: FEED_SHOPS[x.shop].slug, shop_country: FEED_SHOPS[x.shop].country,
}));

function mockRoutes(page) {
  page.route('**/realtime/v1/**', (r) => r.abort());
  page.route('**/auth/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('/token') || u.includes('/signup')) return r.fulfill({ json: session });
    if (u.includes('/user')) return r.fulfill({ json: session.user });
    return r.fulfill({ json: {} });
  });
  page.route('**/functions/v1/**', (r) => r.fulfill({ json: {} }));
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
      // Compte tout neuf: aucune boutique à lui — le bandeau « Devenir
      // vendeuse » du profil ne s'affiche que si cette requête revient vide.
      if (qs.includes('owner_id')) rows = [];
      else if (qs.includes('slug=eq.')) {
        const slug = url.searchParams.get('slug').slice(3);
        rows = FEED_SHOPS.filter((s) => s.slug === slug);
      } else rows = FEED_SHOPS;
    } else if (table === 'profiles') rows = [profile];
    else if (table === 'products') {
      const id = url.searchParams.get('id');
      if (id?.startsWith('eq.f')) rows = FEED_ITEMS.filter((p) => p.id === id.slice(3)).map((p) => ({ ...p, is_active: true, sizes: [], colors: [], attributes: {}, created_at: iso(0, 2), shops: FEED_SHOPS.find((s) => s.id === p.shop_id) }));
    }
    const h = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, 'access-control-expose-headers': 'content-range' };
    if (method === 'HEAD') return route.fulfill({ status: 200, headers: h, body: '' });
    return route.fulfill({ status: 200, headers: h, body: JSON.stringify(single ? rows[0] ?? null : rows) });
  });
  page.route('**/rest/v1/rpc/home_feed_count**', (r) => r.fulfill({ json: FEED_ITEMS.length }));
  page.route('**/rest/v1/rpc/home_feed_page**', (r) => {
    const b = r.request().postDataJSON();
    return r.fulfill({ json: FEED_ITEMS.slice(b.p_offset, b.p_offset + b.p_limit) });
  });
}

const RECDIR = `${SC}/rec`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 540, height: 960 },
  recordVideo: { dir: RECDIR, size: { width: 540, height: 960 } },
  locale: 'fr-FR', timezoneId: 'Africa/Douala',
});
const page = await ctx.newPage();
mockRoutes(page);
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 150)));

// ---------- 1. Accueil, anonyme — vraies fiches, vraies boutiques ----------
await page.goto('http://localhost:4703/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
// La visite guidée (premier passage) bloque tout le reste tant qu'on ne l'a
// pas fermée.
await page.locator('button', { hasText: 'Passer' }).click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(1000);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 500, behavior: 'smooth' }));
await page.waitForTimeout(1600);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 1050, behavior: 'smooth' }));
await page.waitForTimeout(1600);
console.log('ok accueil');

// ---------- 2. Onglet Profil → redirigé vers Auth ----------
await page.locator('a[href="/profile"]').last().click();
await page.waitForTimeout(900);
await page.locator('button', { hasText: "Se connecter" }).click().catch(() => {});
await page.waitForTimeout(300);
console.log('ok redirection auth');

// ---------- 3. Inscription — numéro + mot de passe ----------
await page.locator('button', { hasText: "S'inscrire" }).click();
await page.waitForTimeout(500);
await page.locator('button', { hasText: 'Téléphone' }).click();
await page.waitForTimeout(500);
await page.locator('input').nth(0).fill('');
await page.locator('input').nth(0).type(NAME, { delay: 55 });
await page.waitForTimeout(300);
await page.locator('input[type="tel"]').type('+237 651 23 45 67', { delay: 45 });
await page.waitForTimeout(300);
await page.locator('input[type="password"]').first().type('MonJoliMotDePasse', { delay: 45 });
await page.waitForTimeout(700);
console.log('ok formulaire rempli');

await page.locator('button[type="submit"]').click();
await page.waitForTimeout(2200);
console.log('ok compte créé, arrivée sur le profil');

// ---------- 4. Profil authentifié — teaser « Devenir vendeuse » ----------
await page.waitForTimeout(1800);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 120, behavior: 'smooth' }));
await page.waitForTimeout(2600);

await page.close();
await ctx.close();
await browser.close();
srv.close();
console.log('ENREGISTREMENT TERMINÉ:', RECDIR);
