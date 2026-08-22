// Le releve telechargeable des Finances — « un systeme de compte que vont
// utiliser les PME, et qu'ils pourront telecharger » (Beau).
//
// On clique le bouton, on intercepte le VRAI telechargement, et on relit le
// fichier: entetes, lignes, total encaisse, accents intacts.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST='/home/user/henribeaubayemi/dist';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const srv=createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]);if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html');res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4819,r));

const REF='bokwivwizghdlaedczbw';
const UID='vendeuse-0000-0000-0000-000000000001';
const SHOP={ id:'sh1', owner_id:UID, name:'Ma boutique', slug:'ma-boutique', country:'CM', status:'active',
  offers_delivery:false, delivery_fee_fcfa:0, delivery_zones:[], categories:['mode_femme'], rating:0,
  followers_count:0, is_verified:false, avatar_url:null, banner_url:null, city:'Douala' };
const ORDERS=[
  { id:'o1', order_no:101, shop_id:'sh1', status:'delivered', total_fcfa:5000, method:'pickup',
    created_at:new Date(Date.now()-2*864e5).toISOString(), buyer_name:'Awa Mbala',
    order_items:[{ name:'Robe été', qty:1, price_fcfa:5000 }] },
  { id:'o2', order_no:102, shop_id:'sh1', status:'new', total_fcfa:3000, method:'pickup',
    created_at:new Date(Date.now()-864e5).toISOString(), buyer_name:'Béatrice',
    order_items:[{ name:'Sac perlé', qty:2, price_fcfa:1500 }] },
];

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR', acceptDownloads:true });
await ctx.addInitScript(([k,v]) => {
  localStorage.setItem(k,v);
  localStorage.setItem('finjaro:intro-seen','1');
}, [`sb-${REF}-auth-token`, JSON.stringify({
  access_token:'t', token_type:'bearer', expires_in:3600,
  expires_at: Math.floor(Date.now()/1000)+3600, refresh_token:'r',
  user:{ id:UID, phone:'237699000000', app_metadata:{}, user_metadata:{}, aud:'authenticated', created_at:new Date(Date.now()-30*864e5).toISOString() },
})]);
const page = await ctx.newPage();
await page.route('**/realtime/v1/**', r=>r.abort());
await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
await page.route('**/rest/v1/**', route => {
  const path = new URL(route.request().url()).pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (route.request().headers()['accept']||'').includes('vnd.pgrst.object');
  let rows = [];
  if (path==='profiles') rows=[{ id:UID, name:'Vendeuse', country:'CM', created_at:new Date().toISOString() }];
  else if (path==='shops') rows=[SHOP];
  else if (path==='orders') rows=ORDERS;
  else if (path==='vendor_applications') rows=[];
  route.fulfill({status:200,headers:{'content-type':'application/json','content-range':`0-0/${rows.length}`,'access-control-allow-origin':'*','access-control-expose-headers':'content-range'},body:JSON.stringify(single?rows[0]??null:rows)});
});

let allOk = true;
const check = (ok,l,d='') => { allOk &= ok; console.log(`${ok?'✅':'⚠️ '} ${l}${d?` — ${d}`:''}`); };

await page.goto('http://localhost:4819/vendor/finances', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2600);
const body = await page.locator('body').innerText();
check(body.includes('Télécharger le relevé'), 'Le bouton de telechargement est present');

const [dl] = await Promise.all([
  page.waitForEvent('download', { timeout: 10000 }),
  page.getByRole('button', { name: /Télécharger le relevé/ }).click(),
]);
const chemin = await dl.path();
const contenu = readFileSync(chemin, 'utf8');

check(dl.suggestedFilename().includes('finjaro-releve-ma-boutique'), 'Nom de fichier parlant', dl.suggestedFilename());
check(contenu.startsWith('﻿'), 'BOM UTF-8 present (accents corrects dans Excel)');
check(contenu.includes('"Date";"Commande";"Client"'), 'Entetes en francais, separees par point-virgule');
check(contenu.includes('#101') && contenu.includes('Awa Mbala') && contenu.includes('Robe été x1'), 'La commande livree est detaillee');
check(contenu.includes('#102') && contenu.includes('Béatrice') && contenu.includes('Sac perlé x2'), 'La commande en attente aussi, accents intacts');
check(contenu.includes('TOTAL ENCAISSÉ') && contenu.includes('"5000"'), 'Le total encaisse ne compte QUE les livrees (5000, pas 8000)');
check(contenu.includes('En attente de validation') && contenu.includes('Livrée'), 'Les statuts sont en clair, pas en code');

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close(); srv.close();
