import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
const DIST='/home/user/henribeaubayemi/dist';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const srv=createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]);if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html');
  res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4713,r));
const now=Date.now(),SHOP='ssss1111-1111-4111-8111-111111111111';
const shopRow={id:SHOP,slug:'byflora',name:'ByFlora kids',country:'CM',city:'Douala',status:'active',is_verified:false,rating:0};
const prod={id:'b1',shop_id:SHOP,name:'Baby 12',price_fcfa:0,price_on_request:true,compare_at_price_fcfa:null,
  images:['/demo-products/wd-03.jpg'],category:'enfants_bebe',stock:1,views:3,is_active:true,
  created_at:new Date(now).toISOString(),sizes:[],colors:[],attributes:{},shops:shopRow};
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await browser.newContext({viewport:{width:390,height:797},deviceScaleFactor:2,locale:'fr-FR'});
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e).slice(0,160)));
await page.route('**/realtime/v1/**',r=>r.abort());
await page.route('**/auth/v1/**',r=>r.fulfill({json:{}}));
await page.route('**/rest/v1/**',route=>{const url=new URL(route.request().url());
  const table=url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single=(route.request().headers()['accept']||'').includes('vnd.pgrst.object');
  let rows=[];if(table==='shops')rows=[shopRow];else if(table==='products')rows=[prod];
  const h={'content-type':'application/json','content-range':`0-${Math.max(rows.length-1,0)}/${rows.length}`};
  return route.fulfill({status:200,headers:h,body:JSON.stringify(single?rows[0]??null:rows)});});
// Playwright essaie les routes dans l'ordre INVERSE de leur enregistrement
// (la dernière ajoutée est tentée en premier): ces deux-là doivent donc rester
// APRÈS le filet générique `**/rest/v1/**` ci-dessus pour avoir la main sur
// les appels RPC de l'accueil.
await page.route('**/rest/v1/rpc/home_feed_count**',r=>r.fulfill({json:1}));
await page.route('**/rest/v1/rpc/home_feed_page**',route=>{
  const body=route.request().postDataJSON();
  const rows=body.p_offset>0?[]:[{...prod,shop_name:shopRow.name,shop_slug:shopRow.slug,shop_country:shopRow.country}];
  return route.fulfill({json:rows});});
// Fil d'accueil
await page.goto('http://localhost:4713/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3000);
const body=await page.locator('body').innerText();
console.log('Accueil — « Prix sur demande » :', body.includes('Prix sur demande'));
console.log('Accueil — « 0 FCFA » visible   :', /\b0\s*FCFA/.test(body));
// Fiche article
await page.goto('http://localhost:4713/product/b1',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2500);
const b2=await page.locator('body').innerText();
console.log('Fiche  — « Prix sur demande »  :', b2.includes('Prix sur demande'));
console.log('Fiche  — « 0 FCFA » visible    :', /\b0\s*FCFA/.test(b2));
console.log('Fiche  — bouton panier         :', await page.locator('button',{hasText:'Ajouter au panier'}).count());
console.log('Fiche  — bouton contact        :', await page.locator('button',{hasText:/Contacter|Demander/}).count());
await page.screenshot({path:'test-onreq.png'});
await browser.close();srv.close();
