// Banc d'essai des en-têtes de page et du plan du site.
//
// Ce code tourne dans le worker Cloudflare, pas dans le navigateur: il utilise
// HTMLRewriter, qui n'existe pas sous Node. On le fait donc tourner dans le
// VRAI moteur Cloudflare, via miniflare, avec Supabase simulé.
//
//   npm install --no-save miniflare@3
//   node scripts/verifier-entetes.mjs
//
// Ce que ce test a déjà attrapé (15/09): `setInnerContent` échappe tout seul
// alors que `setAttribute` non — passer du texte déjà échappé au premier
// donnait « &amp;amp; » dans le titre d'une boutique nommée
// « claferShop&perfum ». Invisible à l'œil, visible par un moteur.
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';

const INDEX = readFileSync('index.html', 'utf8');

// Cas volontairement pénibles: « & » et guillemets dans un nom, emoji,
// description à rallonge, article sans photo.
const BOUTIQUE = [{
  name: '🌸claferShop&perfum 🌸 "la vraie"',
  bio: 'Parfums, tenues et accessoires choisis avec soin. '.repeat(12),
  city: 'Douala', avatar_url: 'abc/logo.jpg', banner_url: 'abc/banniere.jpg',
}];
const ARTICLE = [{
  name: 'Robe courte froncée manches bouffantes élégante',
  description: 'Coupe cintrée, tissu léger.',
  images: ['def/robe-01.jpg'], shops: { name: 'Sacs personnalisés' },
}];

const mf = new Miniflare({
  modules: true,
  scriptPath: 'src/worker.js',
  compatibilityDate: '2026-01-01',
  serviceBindings: {
    ASSETS: () => new Response(INDEX, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  },
  // Tout appel sortant du worker passe ici: on simule Supabase.
  outboundService: (request) => {
    const u = request.url;
    const json = (o) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json' } });
    if (u.includes('shops?slug=eq.')) return json(BOUTIQUE);
    if (u.includes('products?id=eq.')) return json(ARTICLE);
    if (u.includes('shops?status=eq.active')) return json([
      { slug: 'clafershop', updated_at: '2026-09-12T08:33:10Z' }, { slug: 'sacs-perso', updated_at: null }]);
    if (u.includes('products?is_active=eq.true')) return json([
      { id: 'p-1', updated_at: '2026-09-14T22:18:14Z' }, { id: 'p-2', updated_at: null }]);
    return json([]);
  },
});

const voir = async (c) => { const r = await mf.dispatchFetch('http://finjaro.net' + c); return { t: r.headers.get('content-type'), c: await r.text() }; };
const lire = (h, re) => re.exec(h)?.[1];

const b = await voir('/boutique/clafershop');
console.log('BOUTIQUE /boutique/clafershop');
console.log('  titre        :', lire(b.c, /<title>([^<]*)<\/title>/));
console.log('  og:title     :', lire(b.c, /property="og:title" content="([^"]*)"/));
console.log('  og:image     :', lire(b.c, /property="og:image" content="([^"]*)"/));
const d = lire(b.c, /property="og:description" content="([^"]*)"/);
console.log('  og:description:', d?.length, 'caractères →', d?.slice(0, 70) + '…');

const a = await voir('/product/p-1');
console.log('\nARTICLE /product/p-1');
console.log('  titre        :', lire(a.c, /<title>([^<]*)<\/title>/));
console.log('  og:image     :', lire(a.c, /property="og:image" content="([^"]*)"/));

const h = await voir('/');
console.log("\nACCUEIL / (ne doit PAS être touché)");
console.log('  titre        :', lire(h.c, /<title>([^<]*)<\/title>/));

const s = await voir('/sitemap.xml');
console.log('\nPLAN DU SITE');
console.log('  type         :', s.t);
console.log("  nombre d'URL :", (s.c.match(/<loc>/g) || []).length, '— attendu 10 (6 fixes + 2 boutiques + 2 articles)');
console.log('  boutique     :', lire(s.c, /<loc>([^<]*boutique[^<]*)<\/loc>/));
console.log('  article      :', lire(s.c, /<loc>([^<]*product[^<]*)<\/loc>/));
console.log('  lastmod      :', lire(s.c, /<lastmod>([^<]*)<\/lastmod>/));

await mf.dispose();
