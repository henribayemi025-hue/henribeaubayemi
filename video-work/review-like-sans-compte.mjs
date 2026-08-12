// Beau: « pour moi quelqu'un qui n'a pas de compte peut liker les vidéos, les
// reels ». Jusqu'ici le cœur ouvrait l'écran de connexion — le geste le plus
// léger de l'app demandait le plus gros engagement.
//
// On verifie les deux sens: le like part sans compte, et le cœur reste rempli
// quand la personne revient (meme appareil, toujours pas de compte).
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const DIST = '/home/user/henribeaubayemi/dist';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json' };
const srv = createServer((req,res)=>{let p=join(DIST,req.url.split('?')[0]); if(!existsSync(p)||extname(p)==='')p=join(DIST,'index.html'); res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(readFileSync(p));});
await new Promise(r=>srv.listen(4813,r));

const REEL = { id:'r1', shop_id:'s1', video_url:'v.mp4', caption:'Robe', likes:4, comments:0, category:'femme_robes',
               shops:{ id:'s1', name:'Boutique', slug:'b', logo_url:null } };

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
let allOk = true;
const check = (ok,l,d='') => { allOk &= ok; console.log(`${ok?'✅':'⚠️ '} ${l}${d?` — ${d}`:''}`); };

// Ce que la « base » a enregistre pendant le test.
let stockees = [];

const ctx = await browser.newContext({ viewport:{width:390,height:844}, locale:'fr-FR' });
await ctx.addInitScript(() => localStorage.setItem('finjaro:intro-seen','1'));
const page = await ctx.newPage();
await page.route('**/realtime/v1/**', r=>r.abort());
await page.route('**/auth/v1/**', r=>r.fulfill({json:{}}));
await page.route('**/rest/v1/**', route => {
  const req = route.request();
  const url = new URL(req.url());
  const path = url.pathname.split('/rest/v1/')[1].split('?')[0];
  const single = (req.headers()['accept']||'').includes('vnd.pgrst.object');
  const json = (rows) => route.fulfill({ status:200, headers:{'content-type':'application/json','content-range':`0-0/${rows.length}`,'access-control-allow-origin':'*','access-control-expose-headers':'content-range'}, body: JSON.stringify(single ? rows[0] ?? null : rows) });

  if (path === 'reel_likes') {
    if (req.method() === 'POST') { stockees.push(JSON.parse(req.postData() || '{}')); return json([]); }
    if (req.method() === 'DELETE') { stockees = []; return json([]); }
    // Lecture: la ligne existe-t-elle pour ce visiteur ?
    const vq = url.searchParams.get('visitor_id') || '';
    const vid = vq.replace('eq.', '');
    const found = stockees.filter((l) => l.visitor_id === vid);
    return json(found.map((_, i) => ({ id: `l${i}` })));
  }
  if (path === 'reels') return json([REEL]);
  return json([]);
});

await page.goto('http://localhost:4813/fin', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2500);

let body = await page.locator('body').innerText();
check(body.includes('4'), 'Le reel et son compteur sont a l\'ecran');

// Le cœur: premier bouton de la colonne d'actions.
const coeur = page.locator('button:has(svg.tabler-icon-heart), button:has(svg)').first();
await page.locator('button').filter({ hasText: /^4$/ }).first().click({ timeout: 5000 }).catch(async () => {
  // Repli: on clique le bouton qui porte le compteur.
  await page.getByText('4', { exact: true }).click();
});
await page.waitForTimeout(1200);

body = await page.locator('body').innerText();
const versConnexion = body.includes('Se connecter') || page.url().includes('/auth');
check(!versConnexion, "Aimer n'envoie plus vers l'ecran de connexion");
check(stockees.length === 1, 'Un like a bien ete enregistre', `${stockees.length} ligne(s)`);
check(!!stockees[0]?.visitor_id && !stockees[0]?.user_id,
      'Il porte un jeton d\'appareil, pas un compte',
      stockees[0] ? JSON.stringify(stockees[0]) : '');
check(body.includes('5'), 'Le compteur est passe de 4 a 5');

// Retour sur l'app, toujours sans compte: le cœur doit rester rempli.
await page.goto('http://localhost:4813/fin', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(2500);
const rempli = await page.locator('svg.tabler-icon-heart-filled').count();
check(rempli > 0, 'Au retour, le cœur est toujours rempli');

console.log(`\n${allOk ? 'CONFORME' : 'À CORRIGER'}\n`);
await browser.close(); srv.close();
