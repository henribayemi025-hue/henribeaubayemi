// Passage en revue de TOUS les ecrans, acheteur et vendeur.
//
// Beau: « check s'il y a d'autres erreurs en mode vendeur... verifie aussi
// qu'il n'y a aucun bouton mort et aucun probleme comme ca ».
//
// Chaque route est ouverte avec des donnees simulees; on releve les erreurs
// de console, les erreurs de page, les cles de traduction manquantes et les
// ecrans vides.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST='/home/user/henribeaubayemi/dist';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const srv=createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]);if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html');res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4818,r));

const REF='bokwivwizghdlaedczbw';
const UID='vendeuse-0000-0000-0000-000000000001';
const SHOP={ id:'sh1', owner_id:UID, name:'Ma boutique', slug:'ma-boutique', country:'CM', status:'active',
  offers_delivery:true, delivery_fee_fcfa:1000, delivery_zones:[], categories:['mode_femme'], rating:4.5,
  followers_count:3, is_verified:false, avatar_url:null, banner_url:null, city:'Douala', whatsapp:'237699000000' };
const PRODUCT={ id:'p1', shop_id:'sh1', name:'Robe', price_fcfa:5000, price_on_request:false, category:'femme_robes',
  images:[], stock:2, is_active:true, rotated_at:null, views:4, description:'', sizes:[], colors:[], compare_at_price_fcfa:null };
const ORDER={ id:'o1', order_no:101, shop_id:'sh1', buyer_id:'b1', status:'pending', total_fcfa:5000, method:'pickup',
  created_at:new Date().toISOString(), buyer_name:'Awa', buyer_phone:'2376', payment_status:'cod',
  order_items:[{ id:'oi1', product_id:'p1', qty:1, price_fcfa:5000, name:'Robe', size:null, color:null }] };

const ROUTES = [
  '/', '/search', '/category/femme_robes', '/boutiques', '/fin', '/near-you', '/cart',
  '/profile', '/profile/settings', '/profile/orders', '/profile/favorites', '/inbox', '/help', '/invite',
  '/vendor', '/vendor/products', '/vendor/products/new', '/vendor/products/bulk', '/vendor/orders',
  '/vendor/messages', '/vendor/reels', '/vendor/shop', '/vendor/stats', '/vendor/finances', '/vendor/leaderboard',
];

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR' });
await ctx.addInitScript(([k,v]) => {
  localStorage.setItem(k,v);
  localStorage.setItem('finjaro:intro-seen','1');
  localStorage.setItem(`finjaro:welcome-seen:vendeuse-0000-0000-0000-000000000001`,'1');
}, [`sb-${REF}-auth-token`, JSON.stringify({
  access_token:'t', token_type:'bearer', expires_in:3600,
  expires_at: Math.floor(Date.now()/1000)+3600, refresh_token:'r',
  user:{ id:UID, phone:'237699000000', app_metadata:{}, user_metadata:{name:'Vendeuse'}, aud:'authenticated', created_at:new Date(Date.now()-30*864e5).toISOString() },
})]);
const page = await ctx.newPage();
const problemes = [];
let routeCourante = '';
page.on('console', (m) => {
  const txt = m.text();
  // Le proxy de test coupe les WebSockets: hors sujet.
  if (m.type() === 'error' && !/websocket|WebSocket|net::|Failed to load resource/i.test(txt)) {
    problemes.push(`${routeCourante} — console: ${txt.slice(0, 140)}`);
  }
});
page.on('pageerror', (e) => problemes.push(`${routeCourante} — page: ${String(e).slice(0, 140)}`));

await page.route('**/realtime/v1/**', r=>r.abort());
await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
await page.route('**/functions/v1/**', r=>r.fulfill({status:200,headers:{'access-control-allow-origin':'*'},json:{reply:'ok'}}));
await page.route('**/rest/v1/**', route => {
  const url = new URL(route.request().url());
  const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (route.request().headers()['accept']||'').includes('vnd.pgrst.object');
  let rows = [];
  if (path==='profiles') rows=[{ id:UID, name:'Vendeuse', country:'CM', currency:null, phone:'237699000000', created_at:new Date().toISOString() }];
  else if (path==='shops') rows=[SHOP];
  else if (path==='products') rows=[PRODUCT];
  else if (path==='orders') rows=[ORDER];
  else if (path==='order_items') rows=ORDER.order_items;
  else if (path==='vendor_applications') rows=[];
  else if (path==='categories') rows=[{id:'mode_femme',parent_id:null,kind:'PRODUCT',label_fr:'Femme',label_en:'Women',sort_order:1},{id:'femme_robes',parent_id:'mode_femme',kind:'PRODUCT',label_fr:'Robes',label_en:'Dresses',sort_order:1}];
  else if (path==='rpc/admin_shop_stats') rows=[];
  route.fulfill({status:200,headers:{'content-type':'application/json','content-range':`0-0/${rows.length}`,'access-control-allow-origin':'*','access-control-expose-headers':'content-range'},body:JSON.stringify(single?rows[0]??null:rows)});
});

for (const r of ROUTES) {
  routeCourante = r;
  try {
    await page.goto(`http://localhost:4818${r}`, { waitUntil:'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1600);
    const body = (await page.locator('body').innerText().catch(()=>'')) || '';
    if (body.trim().length < 10) problemes.push(`${r} — ECRAN QUASI VIDE`);
    // Cles i18n crues: elles ressemblent a "vendor.xxx" ou "missingKey".
    const brut = body.match(/\b[a-z]+\.[a-zA-Z]+\.[a-zA-Z]+\b|missingKey/g);
    if (brut) {
      const suspects = brut.filter((x) => /^(vendor|checkout|cart|shops|admin|finou|product|home|nav|common|errors|notifications|stats|finances|intro|welcome|reel|nearYou|legal|profile|settings|orders|help)\./.test(x));
      if (suspects.length) problemes.push(`${r} — traduction manquante: ${[...new Set(suspects)].slice(0,3).join(', ')}`);
    }
    if (/Quelque chose n.a pas fonctionné|Something went wrong/i.test(body)) problemes.push(`${r} — ECRAN D'ERREUR affiche`);
  } catch (e) {
    problemes.push(`${r} — NAVIGATION: ${String(e).slice(0, 100)}`);
  }
}

console.log(problemes.length ? problemes.join('\n') : 'AUCUN PROBLEME RELEVE');
console.log(`\n${problemes.length} probleme(s) sur ${ROUTES.length} ecrans`);
await browser.close(); srv.close();
