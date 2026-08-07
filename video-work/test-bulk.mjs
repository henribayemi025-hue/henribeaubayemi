import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';
const DIST='/home/user/henribeaubayemi/dist';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const srv=createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]);if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html');
  res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4707,r));
const now=Date.now(), U='aaaa1111-1111-4111-8111-111111111111', SHOP='ssss1111-1111-4111-8111-111111111111';
const session={access_token:'f',token_type:'bearer',expires_in:3600,expires_at:Math.floor(now/1000)+3600,refresh_token:'f',user:{id:U,aud:'authenticated',role:'authenticated',phone:'237651234567',app_metadata:{},user_metadata:{name:'Aïcha K.'},created_at:new Date(now).toISOString()}};
const profile={id:U,name:'Aïcha K.',country:'CM',currency:'FCFA',is_vendor:true};
const shopRow={id:SHOP,owner_id:U,slug:'chez-aicha',name:'Chez Aïcha',country:'CM',city:'Douala',categories:['mode_femme'],status:'active'};
let inserted=null;
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await browser.newContext({viewport:{width:390,height:797},deviceScaleFactor:2,locale:'fr-FR'});
await ctx.addInitScript(([k,s])=>localStorage.setItem(k,JSON.stringify(s)),['sb-bokwivwizghdlaedczbw-auth-token',session]);
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e).slice(0,160)));
await page.route('**/realtime/v1/**',r=>r.abort());
await page.route('**/auth/v1/**',r=>r.fulfill({json:session}));
await page.route('**/storage/v1/**',r=>r.fulfill({status:200,headers:{'content-type':'application/json'},body:JSON.stringify({Key:'ok',path:'ok'})}));
// Finia répond pour chaque photo
await page.route('**/functions/v1/vendor-copilot',r=>r.fulfill({json:{title:'Pyjama fraise 2 pièces',description:'Ensemble coton, motif fraises.',category:'enfants_bebe',price_hint_fcfa:6500}}));
await page.route('**/rest/v1/**',route=>{const req=route.request();const url=new URL(req.url());
  const table=url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single=(req.headers()['accept']||'').includes('vnd.pgrst.object');
  if(req.method()==='POST'&&table==='products'){inserted=req.postDataJSON();
    return route.fulfill({status:201,headers:{'content-type':'application/json'},body:'[]'});}
  let rows=[];if(table==='shops')rows=[shopRow];else if(table==='profiles')rows=[profile];
  const h={'content-type':'application/json','content-range':`0-${Math.max(rows.length-1,0)}/${rows.length}`};
  return route.fulfill({status:200,headers:h,body:JSON.stringify(single?rows[0]??null:rows)});});

await page.goto('http://localhost:4707/vendor/products/bulk',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2500);
const photos=readdirSync(join(DIST,'demo-products')).filter(f=>f.endsWith('.jpg')).slice(0,12).map(f=>join(DIST,'demo-products',f));
console.log('Photos choisies d\'un coup :',photos.length);
await page.locator('input[type=file]').first().setInputFiles(photos);
await page.waitForTimeout(9000);
console.log('Lignes d\'articles créées :', await page.locator('input[placeholder="Nom du produit"]').count());
// Finia remplit tout
await page.locator('button',{hasText:'Faire écrire les noms par Finia'}).click();
await page.waitForTimeout(9000);
const noms=await page.locator('input[placeholder="Nom du produit"]').evaluateAll(els=>els.filter(e=>e.value.trim()).length);
const prix=await page.locator('input[placeholder^="Prix"]').evaluateAll(els=>els.filter(e=>e.value.trim()).length);
console.log('Noms remplis par Finia :',noms,'| Prix suggérés :',prix);
const bb=await page.locator('button',{hasText:/^Créer /}).first().boundingBox();const nb=await page.locator('nav .pointer-events-auto').first().boundingBox();console.log('Bouton Créer:',JSON.stringify(bb));console.log('Barre nav  :',JSON.stringify(nb));console.log('Chevauchement:',bb&&nb&&(bb.y+bb.height)>nb.y?'OUI':'non');await page.screenshot({path:'test-bulk.png',fullPage:false});
// Créer
const btn=page.locator('button',{hasText:/^Créer /}).first();
console.log('Bouton final :', (await btn.textContent())?.trim());
await btn.click();
await page.waitForTimeout(2500);
console.log('Articles envoyés en base :', Array.isArray(inserted)?inserted.length:0);
if(Array.isArray(inserted)&&inserted[0]) console.log('Exemple :',JSON.stringify({name:inserted[0].name,price:inserted[0].price_fcfa,cat:inserted[0].category,actif:inserted[0].is_active}));
await browser.close();srv.close();
