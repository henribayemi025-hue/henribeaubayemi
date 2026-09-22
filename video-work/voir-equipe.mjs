// Voir la messagerie d'equipe comme Beau la voit sur son telephone.
//
//   npx vite preview --port 4178
//   node video-work/voir-equipe.mjs
import { chromium } from 'playwright';

const BASE = 'http://localhost:4178';
const MOI = '33333333-3333-3333-3333-333333333333';
const SORTIE = process.env.SORTIE || '/tmp';

const AGENTS = [
  { cle:'beau', nom:'Beau', poste:'Fondateur', mandat:'Il tranche.', emoji:'👑', couleur:'#E09F3E', user_id:MOI, actif:true, ordre:1 },
  { cle:'alpha', nom:'Alpha', poste:'Direction générale', mandat:'Le plan, les rituels, des propositions.', emoji:'🛠️', couleur:'#C25E38', user_id:null, actif:true, ordre:10 },
  { cle:'vigie', nom:'Vigie', poste:'Concurrence', mandat:'Ce que les autres ont et qu’on n’a pas.', emoji:'🔭', couleur:'#6366F1', user_id:null, actif:true, ordre:30 },
  { cle:'boussole', nom:'Boussole', poste:'Données et mesure', mandat:'Possède les chiffres.', emoji:'📊', couleur:'#38BDF8', user_id:null, actif:true, ordre:71 },
  { cle:'caisse', nom:'Caisse', poste:'Paiements et Mobile Money', mandat:'Le trou trouvé par Vigie.', emoji:'💳', couleur:'#34D399', user_id:null, actif:false, ordre:61 },
];
const SALONS = [
  { cle:'direction', nom:'Direction', a_quoi_ca_sert:'Ce qui attend une décision.', emoji:'🎯', ordre:10, prive_entre:null },
  { cle:'concurrence', nom:'Concurrence', a_quoi_ca_sert:'Ce que les autres ont.', emoji:'🔭', ordre:20, prive_entre:null },
  { cle:'argent', nom:'Argent', a_quoi_ca_sert:'Paiements, Mobile Money.', emoji:'💳', ordre:60, prive_entre:null },
];
const MESSAGES = [
  { id:'m1', canal:'direction', auteur:'vigie', user_id:null, texte:'À trancher : le Mobile Money. Sept concurrents sur huit l’ont, nous zéro.', genre:'decision', repondu_le:null, assigne_a:null, termine_le:null, created_at:new Date(Date.now()-3600e3).toISOString() },
  { id:'m2', canal:'direction', auteur:'alpha', user_id:null, texte:'Learn est en ligne. 19 boutiques vides sur 67 — c’est pour elles qu’il existe.', genre:'info', repondu_le:null, assigne_a:null, termine_le:null, created_at:new Date(Date.now()-1800e3).toISOString() },
  { id:'m3', canal:'direction', auteur:'boussole', user_id:null, texte:'Quelqu’un peut vérifier si la notification arrive vraiment sur le téléphone ?', genre:'tache', repondu_le:null, assigne_a:null, termine_le:null, created_at:new Date(Date.now()-600e3).toISOString() },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function regarder(nom, largeur, apres) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: 900 }, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => console.log(`  <-- ERREUR: ${e.message}`));

  await pg.route('**://*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const json = (d) => route.fulfill({ status:200, contentType:'application/json',
      headers:{ 'access-control-expose-headers':'content-range' }, body: JSON.stringify(d) });
    if (url.includes('/auth/v1/user')) return json({ id: MOI, email:'beau@example.test' });
    if (url.includes('/rest/v1/profiles')) return json([{ id: MOI, name:'Beau', is_admin:true }]);
    if (url.includes('/rest/v1/team_agents')) return json(AGENTS);
    if (url.includes('/rest/v1/team_channels')) return json(SALONS);
    if (url.includes('/rest/v1/team_reactions')) return json([{ message_id:'m2', auteur:'beau', emoji:'👍' }]);
    if (url.includes('/rest/v1/team_messages')) {
      if (url.includes('genre=eq.tache')) return json(MESSAGES.filter((m) => m.genre === 'tache' && !m.assigne_a));
      if (url.includes('repondu_le=is.null')) return json(MESSAGES.filter((m) => ['question','decision'].includes(m.genre)));
      return json(MESSAGES.filter((m) => url.includes(`canal=eq.${m.canal}`)));
    }
    return json([]);
  });

  await pg.addInitScript((uid) => {
    const u = { id:uid, aud:'authenticated', role:'authenticated', email:'beau@example.test',
      app_metadata:{}, user_metadata:{}, created_at:new Date().toISOString() };
    localStorage.setItem('sb-bokwivwizghdlaedczbw-auth-token', JSON.stringify({
      access_token:'jeton', token_type:'bearer', expires_in:3600,
      expires_at: Math.floor(Date.now()/1000)+3600, refresh_token:'r', user:u }));
  }, MOI);

  await pg.goto(`${BASE}/equipe`, { waitUntil:'domcontentloaded' });
  await pg.waitForTimeout(3500);
  for (const l of ['Refuser','Passer','Plus tard']) {
    const el = pg.locator(`button:visible:has-text("${l}")`).first();
    if (await el.count()) { await el.click().catch(()=>{}); await pg.waitForTimeout(300); }
  }
  if (apres) await apres(pg);
  await pg.waitForTimeout(600);

  console.log(`\n=== ${nom} (${largeur}px) ===`);
  console.log((await pg.locator('body').innerText()).replace(/\n{2,}/g,'\n').slice(0, 800));
  const debord = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`  debordement lateral: ${debord}px ${debord>0?'<-- DEFAUT':'(aucun)'}`);
  await pg.screenshot({ path:`${SORTIE}/equipe-${nom}.png` });
  await ctx.close();
}

await regarder('salon', 390, null);
await regarder('membres', 390, async (pg) => {
  const b = pg.locator('button:visible:has-text("Écrire à un")').first();
  if (await b.count()) { await b.click(); await pg.waitForTimeout(600); }
});
await b.close();
