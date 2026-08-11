// Beau: « la cliente est au Cameroun » — et elle voyait des euros.
//
// Enquete: son profil portait « FR / EUR ». Personne ne l'avait choisi. La
// detection retombe sur la langue du systeme quand le fuseau n'est pas
// exploitable, et un telephone camerounais regle en « fr-FR » annonce la
// France. Pire: cette devise devinee etait ENREGISTREE dans le profil, donc
// indiscernable d'un choix — plus rien ne pouvait la corriger.
//
// Deux regles verifiees ici:
//  1. la devise SUIT le pays du profil tant que personne ne l'a choisie;
//  2. un choix explicite reste roi.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json' };
const srv = createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]); if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html'); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4812,r));

const REF = 'bokwivwizghdlaedczbw';
const UID = 'buyer-0000-0000-0000-000000000001';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let allOk = true;
const check = (ok,l,d='') => { allOk &= ok; console.log(`${ok?'✅':'⚠️ '} ${l}${d?` — ${d}`:''}`); };

async function run({ label, profil, stockage = {}, attendu, interdit }) {
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR' });
  await ctx.addInitScript(([k,v,extra]) => {
    localStorage.setItem(k,v);
    localStorage.setItem('finjaro:intro-seen','1');
    localStorage.setItem('finjaro:welcome-seen:buyer-0000-0000-0000-000000000001','1');
    for (const [a,b] of extra) localStorage.setItem(a,b);
  }, [`sb-${REF}-auth-token`, JSON.stringify({
    access_token:'t', token_type:'bearer', expires_in:3600,
    expires_at: Math.floor(Date.now()/1000)+3600, refresh_token:'r',
    user:{ id:UID, phone:'237699887766', app_metadata:{}, user_metadata:{}, aud:'authenticated', created_at:new Date(Date.now()-30*864e5).toISOString() },
  }), Object.entries(stockage)]);

  const page = await ctx.newPage();
  await page.route('**/realtime/v1/**', r=>r.abort());
  await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
  await page.route('**/rest/v1/**', route => {
    const path = new URL(route.request().url()).pathname.split('/rest/v1/')[1].split('?')[0];
    const single = (route.request().headers()['accept']||'').includes('vnd.pgrst.object');
    let rows = [];
    if (path === 'profiles') rows = [{ id:UID, name:'Cliente', ...profil, created_at:new Date().toISOString() }];
    else if (path === 'products') rows = [{ id:'x1', shop_id:'s1', name:'Robe', price_fcfa:6560, price_on_request:false, category:'femme_robes', images:[], stock:3, is_active:true, views:0, shops:{ name:'Boutique', slug:'b' } }];
    route.fulfill({ status:200, headers:{'content-type':'application/json','content-range':`0-0/${rows.length}`,'access-control-allow-origin':'*','access-control-expose-headers':'content-range'}, body: JSON.stringify(single ? rows[0] ?? null : rows) });
  });

  await page.goto('http://localhost:4812/category/femme_robes', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(2600);
  const body = (await page.locator('body').innerText()).replace(/[  ]/g,' ');
  const ok = body.includes(attendu) && !body.includes(interdit);
  check(ok, label, ok ? '' : `attendu « ${attendu} », interdit « ${interdit} »`);
  await ctx.close();
}

console.log('\n=== LA DEVISE SUIT LE PAYS DU PROFIL ===\n');

// Le cas de la cliente: profil corrige au Cameroun, mais l'appareil garde
// encore « EUR » en memoire d'avant. Le pays doit l'emporter.
await run({ label:'Profil Cameroun, appareil encore en euros', profil:{ country:'CM', currency:null },
            stockage:{ finjaro_currency:'EUR', finjaro_country:'FR' }, attendu:'FCFA', interdit:'€' });

// Une personne reellement en France doit continuer a voir des euros.
await run({ label:'Profil France', profil:{ country:'FR', currency:null },
            stockage:{}, attendu:'€', interdit:'FCFA' });

// Un choix explicite reste roi, meme s'il ne correspond pas au pays.
await run({ label:'Choix explicite respecte (Cameroun qui veut des euros)', profil:{ country:'CM', currency:'EUR' },
            stockage:{ finjaro_currency_manual:'1', finjaro_currency:'EUR' }, attendu:'€', interdit:'FCFA' });

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close(); srv.close();
