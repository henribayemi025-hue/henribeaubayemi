// Voir Legion comme un fondateur le voit: fonder, puis l'entreprise.
//   npx vite preview --port 4179 && node video-work/voir-legion.mjs
import { chromium } from 'playwright';
const BASE = 'http://localhost:4179';
const MOI = '33333333-3333-3333-3333-333333333333';
const EID = '44444444-4444-4444-4444-444444444444';
const SORTIE = process.env.SORTIE || '/tmp';

const MODELES = [
  { cle:'conseil', nom:'Cabinet de conseil', promesse:'Une direction complète qui interroge ton plan.', emoji:'🏛️', taille_defaut:'startup', actif:true, ordre:10 },
  { cle:'produit', nom:'Studio produit et technique', promesse:'Concevoir, construire, livrer.', emoji:'🛠️', taille_defaut:'startup', actif:true, ordre:30 },
  { cle:'cinema', nom:'Studio de cinéma', promesse:'Du scénario à la série.', emoji:'🎬', taille_defaut:'scaleup', actif:true, ordre:70 },
];
const POSTES = [
  ...Array.from({length: 14}, (_, i) => ({ modele:'conseil', departement: i < 3 ? 'Direction' : 'Finance', poste:`Poste conseil ${i+1}`, des_la_taille: i < 2 ? 'cocon' : i < 8 ? 'startup' : 'scaleup', a_ecrire:false, est_directeur: i === 0 })),
  ...Array.from({length: 120}, (_, i) => ({ modele:'produit', departement: ['Ingénierie','Produit','Qualité','Données'][i % 4], poste:`Métier ${i+1}`, des_la_taille: i < 2 ? 'cocon' : i < 7 ? 'startup' : 'scaleup', a_ecrire:false, est_directeur: i === 0 })),
  ...Array.from({length: 8}, (_, i) => ({ modele:'cinema', departement:'Réalisation', poste:`Poste ciné ${i+1}`, des_la_taille:'startup', a_ecrire:true, est_directeur: i === 0 })),
];
// Une entreprise de 1 200: 120 métiers, ~10 personnes chacun.
const AGENTS = [{ id:'a0', entreprise_id:EID, cle:'fondateur', nom:'Beau', poste:'Fondateur', departement:null, mandat:'Tranche.', emoji:'👑', couleur:'#E09F3E', user_id:MOI, actif:true, ordre:1, est_directeur:false, avatar_url:null }];
let k = 0;
for (let m = 0; m < 120; m++) for (let j = 0; j < 10; j++) {
  k++;
  AGENTS.push({ id:`a${k}`, entreprise_id:EID, cle:`metier-${m+1}${j?'-'+(j+1):''}`, nom:`Personne ${k}`, poste:`Métier ${m+1}`,
    departement:['Ingénierie','Produit','Qualité','Données'][m % 4], mandat:'Fait son travail.', emoji:null, couleur:'#6366F1',
    user_id:null, actif:true, ordre:10+m, est_directeur: m === 0 && j === 0, avatar_url:`https://api.dicebear.com/9.x/notionists/svg?seed=x${k}` });
}
const CANAUX = [{ id:'c1', entreprise_id:EID, cle:'direction', nom:'Direction', a_quoi_ca_sert:'Décisions.', emoji:'🎯', ordre:1, prive_entre:null }];
const MESSAGES = [{ id:'m1', entreprise_id:EID, canal_id:'c1', auteur_id:'a1', user_id:null, texte:'Bonjour. L’équipe est en place — 1 200 personnes en service, 120 métiers. Dis-nous en une phrase ce que tu veux obtenir cette semaine.', genre:'question', repondu_le:null, assigne_a:null, termine_le:null, created_at:new Date().toISOString() }];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function page(largeur) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: 900 }, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => console.log(`  <-- ERREUR: ${e.message}`));
  await pg.route('**://api.dicebear.com/**', (r) => r.fulfill({ status:200, contentType:'image/svg+xml', body:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#c7d2fe"/></svg>' }));
  await pg.route('**://*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const json = (d) => route.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-expose-headers':'content-range' }, body: JSON.stringify(d) });
    if (url.includes('/auth/v1/user')) return json({ id: MOI, email:'beau@example.test' });
    if (url.includes('/rest/v1/profiles')) return json([{ id: MOI, name:'Beau', is_admin:true }]);
    if (url.includes('/rest/v1/studio_modeles')) return json(MODELES);
    if (url.includes('/rest/v1/studio_modele_postes')) return json(POSTES);
    if (url.includes('/rest/v1/legion_entreprises')) return json(url.includes('id=eq.') ? { id:EID, nom:'Essai 1200', modele:'produit', taille:'megacorp', projet:'essai', owner_id:MOI } : [{ id:EID, nom:'Essai 1200', modele:'produit', taille:'megacorp', projet:'essai', created_at:new Date().toISOString(), studio_modeles:{ nom:'Studio produit et technique', emoji:'🛠️' } }]);
    if (url.includes('/rest/v1/legion_agents')) return json(AGENTS);
    if (url.includes('/rest/v1/legion_canaux')) return json(CANAUX);
    if (url.includes('/rest/v1/legion_reactions')) return json([]);
    if (url.includes('/rest/v1/legion_messages')) {
      if (url.includes('genre=eq.tache')) return json([]);
      if (url.includes('repondu_le=is.null')) return json(MESSAGES);
      return json(MESSAGES);
    }
    return json([]);
  });
  await pg.addInitScript((uid) => {
    localStorage.setItem('sb-bokwivwizghdlaedczbw-auth-token', JSON.stringify({ access_token:'j', token_type:'bearer', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, refresh_token:'r',
      user:{ id:uid, aud:'authenticated', role:'authenticated', email:'beau@example.test', app_metadata:{}, user_metadata:{}, created_at:new Date().toISOString() } }));
  }, MOI);
  return { ctx, pg };
}
const fermerBandeaux = async (pg) => { for (const l of ['Refuser','Passer','Plus tard']) { const el = pg.locator(`button:visible:has-text("${l}")`).first(); if (await el.count()) { await el.click().catch(()=>{}); await pg.waitForTimeout(300); } } };
const lire = async (pg, n=700) => (await pg.locator('body').innerText()).replace(/\n{2,}/g,'\n').slice(0, n);

// 1. Fonder: choisir « produit », taper 1200, voir l'aperçu
{
  const { ctx, pg } = await page(390);
  await pg.goto(`${BASE}/legion/fonder`, { waitUntil:'domcontentloaded' }); await pg.waitForTimeout(3000); await fermerBandeaux(pg);
  await pg.locator('button:has-text("Studio produit")').first().click(); await pg.waitForTimeout(400);
  await pg.locator('input[type="number"]').fill('1200'); await pg.waitForTimeout(400);
  console.log('=== FONDER (390px) ==='); console.log(await lire(pg, 900));
  await pg.screenshot({ path:`${SORTIE}/legion-fonder.png`, fullPage:true });
  await ctx.close();
}
// 2. L'entreprise de 1 200: le salon, puis le carnet par métier
{
  const { ctx, pg } = await page(390);
  const t0 = Date.now();
  await pg.goto(`${BASE}/legion/${EID}`, { waitUntil:'domcontentloaded' }); await pg.waitForTimeout(3500); await fermerBandeaux(pg);
  console.log(`\n=== ENTREPRISE 1200 — salon (390px), ${Date.now()-t0} ms ===`); console.log(await lire(pg, 500));
  await pg.screenshot({ path:`${SORTIE}/legion-salon.png` });
  await pg.locator('button:has-text("Écrire à un")').first().click(); await pg.waitForTimeout(800);
  const t1 = Date.now();
  console.log(`\n=== carnet par métier, ${Date.now()-t1} ms de rendu ===`); console.log(await lire(pg, 600));
  const debord = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`  debordement lateral: ${debord}px ${debord>0?'<-- DEFAUT':'(aucun)'}`);
  await pg.locator('button:has-text("Métier 1")').first().click().catch(()=>{}); await pg.waitForTimeout(400);
  await pg.screenshot({ path:`${SORTIE}/legion-metiers.png` });
  await ctx.close();
}
await b.close();
