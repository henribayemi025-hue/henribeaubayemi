// Beau: « dans l'admin on dit qu'il y a 30 boutiques, mais moi j'en vois 10
// au maximum ».
//
// Il avait raison, et ce n'etait pas un bug: la page n'existait pas. Les
// boutiques n'apparaissaient QUE dans le bandeau horizontal de l'accueil,
// plafonne a douze. La treizieme vendeuse etait invisible pour toujours.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST='/home/user/henribeaubayemi/dist';
const OUT='/home/user/henribeaubayemi/video-work/review-shots';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const srv=createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]);if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html');res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4817,r));

// 31 boutiques, comme en vrai. Les 10 dernieres sont vides (pas d'articles),
// exactement comme en production.
const BOUTIQUES = Array.from({ length: 31 }, (_, i) => ({
  id: `s${i}`, slug: `boutique-${i}`, name: `Boutique ${i}`, avatar_url: null,
  rating: 0, is_verified: false, followers_count: 31 - i,
  country: i % 3 === 0 ? 'CM' : 'FR', city: i === 5 ? 'Douala' : 'Yaoundé', status: 'active',
}));
const ARTICLES = BOUTIQUES.slice(0, 21).map((s) => ({ shop_id: s.id }));

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR' });
await ctx.addInitScript(() => {
  localStorage.setItem('finjaro:intro-seen','1');
  localStorage.setItem('finjaro_country','CM');
});
const page = await ctx.newPage();
await page.route('**/realtime/v1/**', r=>r.abort());
await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
await page.route('**/rest/v1/**', route => {
  const url = new URL(route.request().url());
  const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
  let rows = [];
  if (path === 'shops') rows = BOUTIQUES;
  else if (path === 'products') rows = url.searchParams.get('select') === 'shop_id' ? ARTICLES : [];
  route.fulfill({status:200,headers:{'content-type':'application/json','content-range':`0-0/${rows.length}`,'access-control-allow-origin':'*','access-control-expose-headers':'content-range'},body:JSON.stringify(rows)});
});

let allOk = true;
const check = (ok,l,d='') => { allOk &= ok; console.log(`${ok?'✅':'⚠️ '} ${l}${d?` — ${d}`:''}`); };

await page.goto('http://localhost:4817/boutiques', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2600);
let body = await page.locator('body').innerText();

check(body.includes('31 boutiques'), 'La page annonce les 31 boutiques', body.match(/\d+ boutiques?/)?.[0] || '');
const cartes = await page.locator('a[href^="/boutique/"]').count();
check(cartes === 31, 'Les 31 sont réellement à l\'écran', `${cartes} cartes`);
await page.screenshot({ path:`${OUT}/toutes-boutiques.png` });

// La recherche filtre.
await page.locator('input.input').first().fill('Boutique 1');
await page.waitForTimeout(600);
const apres = await page.locator('a[href^="/boutique/"]').count();
check(apres > 0 && apres < 31, 'La recherche filtre bien', `${apres} resultats`);

// Depuis l'accueil, le lien « Voir tout » existe et mene ici.
await page.locator('input.input').first().fill('');
await page.goto('http://localhost:4817/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2600);
body = await page.locator('body').innerText();
check(body.includes('Voir tout'), "L'accueil propose « Voir tout »");
if (body.includes('Voir tout')) {
  await page.getByRole('link', { name: 'Voir tout' }).click();
  await page.waitForTimeout(2200);
  check(page.url().includes('/boutiques'), 'Le lien mene bien a l\'annuaire', page.url());
}

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close(); srv.close();
