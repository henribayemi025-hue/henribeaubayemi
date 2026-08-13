// « Je ne vois pas de bouton pour passer les deux commandes. Je dois les
// passer one by one ? » — la reponse est desormais NON.
//
// Une commande reste une commande PAR boutique (chacune prepare et livre la
// sienne), mais le PARCOURS est unique: coordonnees une fois, choix
// retrait/livraison par boutique, un seul bouton.
//
// Le cas qui compte vraiment est l'echec PARTIEL: la premiere commande passe,
// la seconde echoue. On ne doit ni tout perdre, ni faire croire que tout est
// passe.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const OUT = '/home/user/henribeaubayemi/video-work/review-shots';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json' };
const srv = createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]); if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html'); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4815,r));

const REF = 'bokwivwizghdlaedczbw';
const UID = 'acheteuse-0000-0000-0000-00000001';
const PANIER = [
  { id:'a1', key:'a1', product_id:'a1', shop_id:'s1', shop_name:'Yak store',    name:'Montre duo',    price_fcfa:21500, qty:1, images:[], stock:5 },
  { id:'b1', key:'b1', product_id:'b1', shop_id:'s2', shop_name:'Beauty hairs', name:'Tresses fines', price_fcfa:23100, qty:1, images:[], stock:5 },
];
const SHOPS = [
  { id:'s1', name:'Yak store',    offers_delivery:true,  delivery_fee_fcfa:1000, delivery_zones:[{name:'Douala', fee_fcfa:1000, days:2}], country:'CM', owner_id:'o1' },
  { id:'s2', name:'Beauty hairs', offers_delivery:false, delivery_fee_fcfa:0,    delivery_zones:[],                                        country:'CM', owner_id:'o2' },
];

let allOk = true;
const check = (ok,l,d='') => { allOk &= ok; console.log(`${ok?'✅':'⚠️ '} ${l}${d?` — ${d}`:''}`); };

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });

async function run({ label, echecSur = null, shot = null }) {
  const appels = [];
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR' });
  await ctx.addInitScript(([k,v,panier]) => {
    localStorage.setItem(k,v);
    localStorage.setItem('finjaro:intro-seen','1');
    localStorage.setItem(`finjaro:welcome-seen:acheteuse-0000-0000-0000-00000001`,'1');
    localStorage.setItem('finjaro_cart', JSON.stringify(panier));
  }, [`sb-${REF}-auth-token`, JSON.stringify({
    access_token:'t', token_type:'bearer', expires_in:3600,
    expires_at: Math.floor(Date.now()/1000)+3600, refresh_token:'r',
    user:{ id:UID, phone:'237699000000', app_metadata:{}, user_metadata:{}, aud:'authenticated', created_at:new Date(Date.now()-30*864e5).toISOString() },
  }), PANIER]);

  const page = await ctx.newPage();
  await page.route('**/realtime/v1/**', r=>r.abort());
  await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
  // Playwright applique la DERNIERE interception enregistree EN PREMIER.
  // Le filtre general doit donc etre pose AVANT celui de place_order,
  // sinon il avale les appels de commande et le test echoue en accusant
  // l'application d'un defaut qui n'existe pas (constate: 0 appel).
  await page.route('**/rest/v1/**', route => {
    const path = new URL(route.request().url()).pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (route.request().headers()['accept']||'').includes('vnd.pgrst.object');
    let rows = [];
    if (path === 'shops') rows = SHOPS;
    else if (path === 'profiles') rows = [{ id:UID, name:'Awa', phone:'237699000000', address:'Rue 12', city:'Douala', country:'CM' }];
    route.fulfill({ status:200, headers:{'content-type':'application/json','content-range':`0-0/${rows.length}`,'access-control-allow-origin':'*','access-control-expose-headers':'content-range'}, body: JSON.stringify(single ? rows[0] ?? null : rows) });
  });

  await page.route('**/rest/v1/rpc/place_order**', route => {
    const body = JSON.parse(route.request().postData() || '{}');
    appels.push(body);
    if (echecSur && body.p_shop_id === echecSur) {
      return route.fulfill({ status:400, headers:{'content-type':'application/json','access-control-allow-origin':'*'},
                             body: JSON.stringify({ message:'insufficient_stock:Tresses fines' }) });
    }
    return route.fulfill({ status:200, headers:{'content-type':'application/json','access-control-allow-origin':'*'},
                           body: JSON.stringify([{ id:'o-'+body.p_shop_id, order_no: body.p_shop_id === 's1' ? 101 : 102 }]) });
  });
  console.log(`\n--- ${label} ---`);
  await page.goto('http://localhost:4815/cart', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(2200);
  let body = await page.locator('body').innerText();
  check(body.includes('Tout commander'), 'Le panier propose « Tout commander »');

  await page.getByRole('button', { name: 'Tout commander' }).click();
  await page.waitForTimeout(2500);
  body = await page.locator('body').innerText();
  check(body.includes('Yak store') && body.includes('Beauty hairs'), 'Les deux boutiques sont sur un seul ecran');
  check((body.match(/Tes coordonnées/g) || []).length === 1, 'Les coordonnees ne sont demandees QU\'UNE fois');
  // Beauty hairs ne livre pas: elle ne doit pas proposer « Livraison ».
  check((body.match(/Livraison/g) || []).length <= 2, 'Seule la boutique qui livre propose la livraison');
  if (shot) await page.screenshot({ path:`${OUT}/${shot}.png` });

  await page.getByRole('button', { name: /Commander/ }).last().click();
  await page.waitForTimeout(2500);
  body = await page.locator('body').innerText();
  check(appels.length === 2, 'Une commande est envoyee PAR boutique', `${appels.length} appel(s)`);
  return { page, ctx, body };
}

// 1. Tout se passe bien.
{
  const { ctx, body } = await run({ label:'Les deux commandes passent', shot:'commande-groupee' });
  check(body.includes('#101') && body.includes('#102'), 'Les deux numeros de commande sont affiches');
  check(!body.includes('pas pu'), 'Aucun echec annonce');
  await ctx.close();
}

// 2. La seconde echoue: le cas qui compte.
{
  const { ctx, page, body } = await run({ label:'La seconde boutique echoue (rupture de stock)', echecSur:'s2' });
  check(body.includes('#101'), 'La commande reussie est annoncee avec son numero');
  check(body.includes('Beauty hairs') && body.includes('pas pu'), 'La boutique en echec est nommee');
  // Le message reel est « ... n'est plus disponible en quantite suffisante »,
  // avec le nom de l'article. Chercher le mot « stock » ne prouvait rien.
  check(body.includes('quantité suffisante') && body.includes('Tresses fines'),
        'La vraie raison est donnee, avec le nom de l\'article');
  check(body.includes('restés dans ton panier'), 'On dit que ces articles restent au panier');
  // Et c'est vrai: le panier doit encore contenir Beauty hairs, pas Yak store.
  const panier = await page.evaluate(() => JSON.parse(localStorage.getItem('finjaro_cart') || '[]'));
  check(panier.length === 1 && panier[0].shop_id === 's2', 'Le panier ne garde QUE la boutique en echec',
        JSON.stringify(panier.map((i) => i.shop_name)));
  await ctx.close();
}

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close(); srv.close();
