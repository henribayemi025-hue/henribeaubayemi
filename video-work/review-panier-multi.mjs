// Plainte d'un testeur, capture a l'appui:
//   « Je ne vois pas de bouton pour passer les deux commandes. Je dois les
//     passer one by one ? »
//
// C'etait une QUESTION, pas un reproche. Le panier etait deja groupe par
// boutique — mais muet: rien n'expliquait que chaque boutique prepare et
// livre sa propre commande. Et apres la premiere commande, on ne renvoyait
// qu'a l'accueil, sans dire qu'il restait un panier a finir.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json' };
const srv = createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]); if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html'); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4814,r));

const PANIER = [
  { id:'a1', product_id:'a1', shop_id:'s1', shop_name:'Yak store', name:'Montre duo', price_fcfa:21500, qty:1, images:[], stock:5 },
  { id:'b1', product_id:'b1', shop_id:'s2', shop_name:'Beauty hairs', name:'Tresses fines', price_fcfa:23100, qty:1, images:[], stock:5 },
];

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR' });
await ctx.addInitScript((panier) => {
  localStorage.setItem('finjaro:intro-seen','1');
  localStorage.setItem('finjaro_cart', JSON.stringify(panier));
}, PANIER);
const page = await ctx.newPage();
await page.route('**/realtime/v1/**', r=>r.abort());
await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
await page.route('**/rest/v1/**', r=>r.fulfill({status:200,headers:{'content-type':'application/json','content-range':'0-0/0','access-control-allow-origin':'*','access-control-expose-headers':'content-range'},body:'[]'}));

await page.goto('http://localhost:4814/cart', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2500);
const body = await page.locator('body').innerText();

let allOk = true;
const check = (ok,l,d='') => { allOk &= ok; console.log(`${ok?'✅':'⚠️ '} ${l}${d?` — ${d}`:''}`); };

check(body.includes('2 boutiques'), 'Le panier annonce le nombre de boutiques');
check(body.includes('livre sa propre commande'), "Il explique POURQUOI il y a un bouton par boutique");
check((body.match(/Passer commande/g) || []).length === 2, 'Un bouton par boutique, comme avant');
await page.screenshot({ path:'/home/user/henribeaubayemi/video-work/review-shots/panier-multi.png' });

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close(); srv.close();
