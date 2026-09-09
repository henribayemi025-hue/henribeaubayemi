// Vidéo « comment créer un compte (et sa boutique) » — 09/09.
//
// v2: Beau, après la première coupe — « trop court, trop rapide, ça ne
// montre pas comment créer sa boutique ». La vidéo va donc du tout début
// (accueil anonyme) jusqu'à l'arrivée dans l'espace vendeur: inscription,
// choix produits/services, catégories, photos de la boutique, et le vrai
// tableau de bord vide d'une boutique toute neuve. Pays: Cameroun — c'est là
// qu'il y a le plus de vraies fiches à montrer.
//
// Le fil d'accueil et la bande de boutiques montrent de VRAIES fiches (nom,
// prix, boutique — lus en base ce matin), pas des données inventées. Seules
// les PHOTOS restent des visuels de démonstration (public/demo-products): la
// connexion réseau directe vers finjaro.net/Supabase est bloquée depuis ce
// bac à sable, donc pas moyen de récupérer les vraies photos des vendeuses
// pour cet enregistrement — et CLAUDE.md interdit de toute façon toute photo
// prise ailleurs que chez la vendeuse elle-même. Le compte ET la boutique
// créés pendant l'enregistrement sont un mannequin (Aïcha K. / « Chez
// Aïcha ») — jamais persistés nulle part, tout le réseau est intercepté par
// Playwright.
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

// La boutique n'existe qu'APRÈS l'étape 4 de « Devenir vendeuse » — avant
// ça, `myShop` reste `null` et toute requête « ma boutique » (owner_id)
// revient vide, exactement comme pour un compte tout neuf.
let myShop = null;
const DEMO = '/home/user/henribeaubayemi/public/demo-products';
let imgServed = 0;

function mockRoutes(page) {
  page.route('**/realtime/v1/**', (r) => r.abort());
  page.route('**/auth/v1/**', (r) => {
    const u = r.request().url();
    if (u.includes('/token') || u.includes('/signup')) return r.fulfill({ json: session });
    if (u.includes('/user')) return r.fulfill({ json: session.user });
    return r.fulfill({ json: {} });
  });
  page.route('**/functions/v1/**', (r) => r.fulfill({ json: {} }));
  // Upload des photos de boutique (bannière + logo): accepté sans écrire
  // nulle part.
  page.route('**/storage/v1/object/shops/**', (r) => r.fulfill({ status: 200, json: { Key: 'ok' } }));
  // Lecture des photos envoyées: 1er appel = bannière, 2e = logo — l'ordre
  // exact dans lequel le formulaire les envoie.
  page.route('**/img/shops/**', (r) => {
    const file = imgServed++ === 0 ? 'wd-01.jpg' : 'turban-01.jpg';
    return r.fulfill({ status: 200, contentType: 'image/jpeg', body: readFileSync(join(DEMO, file)) });
  });
  // Rappel des photos orphelines sur le tableau de bord: aucune boutique
  // toute neuve n'en a, mais la liste doit répondre pour ne pas laisser
  // useAsync en erreur silencieuse.
  page.route('**/storage/v1/object/list/**', (r) => r.fulfill({ json: [] }));
  page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const table = url.pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const method = req.method();
    if (method === 'POST') {
      // La candidature ET la boutique s'insèrent ici (BecomeVendor.submit) —
      // c'est CE point qui fait exister `myShop` pour tout ce qui suit
      // (tableau de bord, bascule acheteuse/vendeuse…).
      if (table === 'shops') {
        const body = req.postDataJSON();
        myShop = {
          id: 'shop-aicha', owner_id: U, slug: `${(body.name || 'boutique').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-demo`,
          name: body.name, bio: body.bio || null, country: body.country, city: body.city || null,
          categories: body.categories || [], avatar_url: body.avatar_url || null, banner_url: body.banner_url || null,
          rating: 0, reviews_count: 0, followers_count: 0, is_verified: false, id_verified: false, phone_confirmed: false,
          status: 'active', seller_points: 0, offers_delivery: false, delivery_fee_fcfa: null,
          rotation_enabled: false, featured_until: null, whatsapp: body.whatsapp || null,
          phone: PHONE, instagram: null, created_at: iso(0),
        };
      }
      return route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '[]' });
    }
    if (method === 'PATCH') return route.fulfill({ status: 204, body: '' });
    let rows = [];
    if (table === 'shops') {
      const qs = url.searchParams.toString();
      if (qs.includes('owner_id')) rows = myShop ? [myShop] : [];
      else if (qs.includes('slug=eq.')) {
        const slug = url.searchParams.get('slug').slice(3);
        rows = FEED_SHOPS.filter((s) => s.slug === slug);
      } else if (qs.includes('id=eq.') && myShop) {
        const id = url.searchParams.get('id').slice(3);
        rows = id === myShop.id ? [myShop] : [];
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
// Sans ça, `getCurrentPosition()` reste parfois bloqué indéfiniment en
// headless (ni succès ni erreur) — « Devenir vendeuse » restait alors
// coincé sur son bouton qui tourne, à l'étape 4.
await ctx.addInitScript(() => {
  navigator.geolocation.getCurrentPosition = (_ok, err) => err && err({ code: 1, message: 'denied' });
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
await page.waitForTimeout(600);
// Le bandeau « installer l'app » partage le même z-index que la modale
// Bienvenue plus tard dans le parcours et cache son bouton « Plus tard » —
// on l'écarte une fois pour toutes ici (le choix reste en mémoire 14 jours).
await page.locator('.bg-ink button[aria-label="Fermer"]').click({ timeout: 3000 }).catch(() => {});
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

// ---------- 4. Profil authentifié — ouvrir sa boutique ----------
await page.waitForTimeout(1600);
// La modale « Bienvenue » (achat/vente) envoie vers Finia — pas le parcours
// qu'on veut montrer ici. On la ferme, comme le ferait quelqu'un qui va
// directement à la carte « Vendre » en dessous.
await page.locator('.z-50 button', { hasText: 'Plus tard' }).click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 120, behavior: 'smooth' }));
await page.waitForTimeout(1400);
await page.locator('button, a', { hasText: 'Ouvrir ma boutique gratuite' }).click();
await page.waitForTimeout(1400);
console.log('ok entrée dans « Devenir vendeuse »');

// ---------- 5. Devenir vendeuse — étape 1: identité de la boutique ----------
const SHOP_NAME = 'Chez Aïcha';
await page.locator('input').nth(0).type(SHOP_NAME, { delay: 55 });
await page.waitForTimeout(500);
// Le Cameroun est déjà le pays détecté par défaut — on le confirme à
// l'écran plutôt que de le changer, exactement ce qu'une vendeuse y ferait.
await page.locator('select').selectOption('CM');
await page.waitForTimeout(500);
await page.locator('input').nth(1).type('Douala', { delay: 55 });
await page.waitForTimeout(700);
// Elle regarde les trois choix avant de trancher — « Des services » puis
// « Des articles », dans cet ordre, pour bien montrer que le choix existe.
await page.locator('button', { hasText: 'Des services' }).click();
await page.waitForTimeout(700);
await page.locator('button', { hasText: 'Des articles' }).click();
await page.waitForTimeout(900);
const chips = page.locator('.chip');
await chips.nth(0).click();
await page.waitForTimeout(400);
await chips.nth(2).click();
await page.waitForTimeout(900);
await page.locator('button', { hasText: 'Continuer' }).click();
await page.waitForTimeout(1200);
console.log('ok étape 1 (identité + catégories)');

// ---------- 6. Étape 2: qui elle est ----------
await page.locator('input').nth(0).type('Aïcha', { delay: 55 });
await page.waitForTimeout(300);
await page.locator('input').nth(1).type('K.', { delay: 55 });
await page.waitForTimeout(300);
await page.locator('input[type="tel"]').type('+237 651 23 45 67', { delay: 45 });
await page.waitForTimeout(900);
await page.locator('button', { hasText: 'Continuer' }).click();
await page.waitForTimeout(1200);
console.log('ok étape 2 (identité vendeuse)');

// ---------- 7. Étape 3: les photos de la boutique ----------
await page.locator('input[type="file"]').nth(0).setInputFiles(join(DEMO, 'wd-01.jpg'));
await page.waitForTimeout(1800);
await page.locator('input[type="file"]').nth(1).setInputFiles(join(DEMO, 'turban-01.jpg'));
await page.waitForTimeout(1800);
await page.locator('textarea').type('Mode & beauté, livraison à Douala.', { delay: 30 });
await page.waitForTimeout(900);
await page.locator('button', { hasText: 'Continuer' }).click();
await page.waitForTimeout(1200);
console.log('ok étape 3 (photos + description)');

// ---------- 8. Étape 4: récapitulatif + validation ----------
await page.waitForTimeout(1400);
await page.locator('input[type="checkbox"]').check();
await page.waitForTimeout(700);
await page.locator('button', { hasText: 'Envoyer ma demande' }).click();
await page.waitForTimeout(2000);
console.log('ok boutique créée');

// ---------- 9. Entrer dans l'espace vendeur ----------
await page.locator('button', { hasText: 'Aller à mon espace vendeur' }).click();
await page.waitForTimeout(2400); // écran de bienvenue « Mode vendeuse », transition automatique
await page.waitForTimeout(1400);
console.log('ok arrivée dans l’espace vendeur');

// ---------- 10. Tableau de bord — boutique toute neuve ----------
await page.waitForTimeout(2400);

await page.close();
await ctx.close();
await browser.close();
srv.close();
console.log('ENREGISTREMENT TERMINÉ:', RECDIR);
