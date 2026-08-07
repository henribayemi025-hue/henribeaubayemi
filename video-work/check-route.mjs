import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
const DIST='/home/user/henribeaubayemi/dist';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const srv=createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]);if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html');
  res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4709,r));
const now=Date.now(),U='aaaa1111-1111-4111-8111-111111111111',SHOP='ssss1111-1111-4111-8111-111111111111';
const session={access_token:'f',token_type:'bearer',expires_in:3600,expires_at:Math.floor(now/1000)+3600,refresh_token:'f',user:{id:U,aud:'authenticated',role:'authenticated',phone:'237651234567',app_metadata:{},user_metadata:{name:'A'},created_at:new Date(now).toISOString()}};
const profile={id:U,name:'A',country:'CM',currency:'FCFA',is_vendor:true};
const shopRow={id:SHOP,owner_id:U,slug:'s',name:'Chez Aïcha',country:'CM',city:'Douala',categories:['mode_femme'],status:'active'};
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await browser.newContext({viewport:{width:390,height:797},locale:'fr-FR'});
await ctx.addInitScript(([k,s])=>localStorage.setItem(k,JSON.stringify(s)),['sb-bokwivwizghdlaedczbw-auth-token',session]);
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e).slice(0,200)));
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE-ERR',m.text().slice(0,200));});
await page.route('**/realtime/v1/**',r=>r.abort());
await page.route('**/auth/v1/**',r=>r.fulfill({json:session}));
await page.route('**/rest/v1/**',route=>{const url=new URL(route.request().url());
  const table=url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single=(route.request().headers()['accept']||'').includes('vnd.pgrst.object');
  let rows=[];if(table==='shops')rows=[shopRow];else if(table==='profiles')rows=[profile];else if(table==='products')rows=[];
  const h={'content-type':'application/json','content-range':`0-${Math.max(rows.length-1,0)}/${rows.length}`};
  return route.fulfill({status:200,headers:h,body:JSON.stringify(single?rows[0]??null:rows)});});

await page.goto('http://localhost:4709/vendor/products/new',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3000);
const esc=page.locator('a[href="/vendor/products/bulk"]');
console.log('C. Sortie depuis Nouveau produit :', await esc.count(), '|', (await esc.first().textContent())?.trim());
await esc.first().click(); await page.waitForTimeout(2500);
console.log('   -> arrive sur :', (await page.locator('h1, header').first().textContent())?.trim().slice(0,40));
await page.screenshot({path:'check-escape.png'});

// A. URL directe
await page.goto('http://localhost:4709/vendor/products/bulk',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3000);
console.log('A. URL directe -> titre :', (await page.locator('h1, header').first().textContent())?.trim().slice(0,60));
console.log('   URL finale :', page.url());

// B. Navigation depuis la liste (comme Beau)
await page.goto('http://localhost:4709/vendor/products',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2500);
await page.locator('a[href="/vendor/products/bulk"]').click();
await page.waitForTimeout(3000);
console.log('B. Clic « En masse » -> URL :', page.url());
console.log('   titre :', (await page.locator('h1, header').first().textContent())?.trim().slice(0,60));
console.log('   « Choisir mes photos » présent :', await page.locator('button', {hasText:'Choisir mes photos'}).count());
await browser.close();srv.close();
