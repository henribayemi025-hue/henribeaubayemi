// Voir Legion comme Beau le voit: l'entreprise sur téléphone (390) et sur
// ordinateur (1280), avec des données qui ressemblent aux vraies.
//   npx vite preview --port 4179 && SORTIE=/tmp node video-work/voir-legion.mjs
import { chromium } from 'playwright';
const BASE = 'http://localhost:4179';
const MOI = '33333333-3333-3333-3333-333333333333';
const EID = '44444444-4444-4444-4444-444444444444';
const SORTIE = process.env.SORTIE || '/tmp';
const il_y_a = (min) => new Date(Date.now() - min * 60000).toISOString();

const DEPTS = [
  ['direction', 'Direction', 'Ce qui attend une décision du fondateur.', '🎯'],
  ['concurrence', 'Concurrence', 'Ce que font les autres.', '🔭'],
  ['marketing', 'Marketing', 'Faire venir et garder.', '🔥'],
  ['produit', 'Produit', 'Ce qu’on construit.', '🛠️'],
  ['qualite', 'Qualité', 'Ce qui casse, et pourquoi.', '🔍'],
  ['argent', 'Argent', 'Trésorerie, factures, comptabilité.', '💳'],
  ['international', 'International', 'Pays par pays.', '🌍'],
];
const CANAUX = DEPTS.map(([cle, nom, but, emoji], i) => ({ id: `c${i}`, entreprise_id: EID, cle, nom, a_quoi_ca_sert: but, emoji, ordre: i + 1, prive_entre: null }));
const av = (s, fam = 'avataaars') => `https://api.dicebear.com/9.x/${fam}/svg?seed=${s}`;
const AGENTS = [
  { id: 'a0', cle: 'fondateur', nom: 'Beau', poste: 'Fondateur', departement: null, mandat: 'Tranche.', emoji: '👑', couleur: '#E09F3E', user_id: MOI, actif: true, ordre: 1, est_directeur: false, avatar_url: null },
  { id: 'a1', cle: 'alpha', nom: 'Alpha', poste: 'Direction technique', departement: 'Direction', mandat: 'Que ça marche, que ça reste simple.', couleur: '#C25E38', actif: true, ordre: 2, est_directeur: true, avatar_url: av('alpha'), personnalite: 'Direct, parfois trop. Commence toujours par le chiffre.', choisi_par_lui: true, autonomie: 'semi' },
  { id: 'a2', cle: 'claudinette', nom: 'Claudinette', poste: 'Comptabilité, paie et fiscalité', departement: 'Argent', mandat: 'Que les chiffres soient justes.', couleur: '#0D9488', actif: true, ordre: 3, est_directeur: true, avatar_url: av('claudinette'), personnalite: 'Méthodique jusqu’à la lenteur. Cite sa source.', choisi_par_lui: true, autonomie: 'supervise' },
  { id: 'a3', cle: 'vigie', nom: 'Vigie', poste: 'Concurrence et veille', departement: 'Concurrence', mandat: 'Savoir ce que font les autres avant eux.', couleur: '#B45309', actif: true, ordre: 4, est_directeur: true, avatar_url: av('vigie'), personnalite: 'Enthousiaste, il faut le freiner.', choisi_par_lui: false, autonomie: 'autonome' },
  { id: 'a4', cle: 'echo', nom: 'Écho', poste: 'Marketing et acquisition', departement: 'Marketing', mandat: 'Faire venir.', couleur: '#7C3AED', actif: false, ordre: 5, est_directeur: true, avatar_url: av('echo', 'fun-emoji'), personnalite: 'Rieur, détend les réunions tendues.', choisi_par_lui: true, autonomie: 'semi' },
  { id: 'a5', cle: 'plume', nom: 'Plume', poste: 'Contenu et réseaux', departement: 'Marketing', mandat: 'Écrire ce qu’on lit.', couleur: '#7C3AED', actif: true, ordre: 6, est_directeur: false, avatar_url: av('plume'), personnalite: 'Sûr de lui, à vérifier.', choisi_par_lui: false, autonomie: 'supervise' },
  { id: 'a6', cle: 'sonde', nom: 'Sonde', poste: 'Qualité et tests', departement: 'Qualité', mandat: 'Casser avant les clients.', couleur: '#059669', actif: true, ordre: 7, est_directeur: true, avatar_url: av('sonde', 'bottts'), personnalite: 'Méfiant par métier.', choisi_par_lui: true, autonomie: 'autonome' },
].map((a) => ({ entreprise_id: EID, user_id: null, emoji: null, ...a }));
const MESSAGES = [
  { id: 'm1', canal_id: 'c0', auteur_id: 'a1', texte: 'Bonjour. L’équipe est en place — 6 personnes en service, 6 métiers. Dis-nous en une phrase ce que tu veux obtenir cette semaine.', genre: 'question', created_at: il_y_a(1500) },
  { id: 'm2', canal_id: 'c0', auteur_id: 'a0', user_id: MOI, texte: 'On doit intégrer le paiement en un clic via Mobile Money d’ici vendredi. C’est critique.', genre: 'decision', created_at: il_y_a(60) },
  { id: 'm3', canal_id: 'c0', auteur_id: 'a2', texte: 'Compris. Je regarde ce que MTN et Orange demandent comme pièces pour un compte marchand, et je reviens avec la liste avant 16 h. Un chiffre manque: les frais par transaction, je ne l’ai pas encore.', genre: 'info', meta: { par_ia: true, reponse_a: { id: 'm2', nom: 'Beau', texte: 'On doit intégrer le paiement en un clic…' } }, created_at: il_y_a(57) },
  { id: 'm4', canal_id: 'c0', auteur_id: 'a2', texte: 'Lister les pièces MTN / Orange pour le compte marchand', genre: 'tache', assigne_a: 'a2', meta: { statut: 'en_cours', priorite: 'haute' }, created_at: il_y_a(56) },
  { id: 'm5', canal_id: 'c0', auteur_id: 'a1', texte: 'Côté technique on est prêts: la page de paiement existe déjà, il manque juste le bouton. Deux jours de travail, pas plus.', genre: 'proposition', meta: { par_ia: true }, created_at: il_y_a(40) },
  { id: 'm6', canal_id: 'c0', auteur_id: 'a0', user_id: MOI, texte: '📷', genre: 'info', meta: { pieces: [{ type: 'image', url: 'https://finjaro.net/logos/argent.png' }] }, created_at: il_y_a(8) },
  { id: 'm7', canal_id: 'c0', auteur_id: 'a0', user_id: MOI, texte: 'salut tout le monde 👋', genre: 'info', created_at: il_y_a(2) },
  { id: 'm8', canal_id: 'c1', auteur_id: 'a3', texte: 'Sept concurrents sur huit ont le Mobile Money. Nous, zéro.', genre: 'info', created_at: il_y_a(300) },
  { id: 'm9', canal_id: 'c0', auteur_id: 'a6', texte: 'Ajouter un test de bout en bout sur le paiement', genre: 'tache', assigne_a: 'a6', meta: { statut: 'a_faire', priorite: 'moyenne' }, created_at: il_y_a(30) },
  { id: 'm10', canal_id: 'c2', auteur_id: 'a5', texte: 'Préparer trois visuels pour l’annonce', genre: 'tache', assigne_a: 'a5', meta: { statut: 'revue', priorite: 'basse' }, created_at: il_y_a(20) },
].map((m) => ({ entreprise_id: EID, user_id: null, repondu_le: null, assigne_a: null, termine_le: null, meta: null, ...m }));
const REACTIONS = [{ message_id: 'm7', auteur_id: 'a1', emoji: '👋' }, { message_id: 'm7', auteur_id: 'a3', emoji: '👋' }, { message_id: 'm5', auteur_id: 'a0', emoji: '🔥' }];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function page(largeur, hauteur = 900) {
  const ctx = await b.newContext({ viewport: { width: largeur, height: hauteur }, locale: 'fr-FR' });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => console.log(`  <-- ERREUR: ${e.message}`));
  await pg.route('**://api.dicebear.com/**', (r) => {
    const seed = new URL(r.request().url()).searchParams.get('seed') || 'x';
    const teinte = (seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0) * 37) % 360;
    r.fulfill({ status: 200, contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="hsl(${teinte},60%,85%)"/><circle cx="40" cy="32" r="14" fill="hsl(${teinte},45%,45%)"/><ellipse cx="40" cy="70" rx="24" ry="16" fill="hsl(${teinte},45%,45%)"/></svg>` });
  });
  await pg.route('**://*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const json = (d) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-expose-headers': 'content-range', 'access-control-allow-origin': '*' }, body: JSON.stringify(d) });
    if (url.includes('/auth/v1/user')) return json({ id: MOI, email: 'beau@example.test' });
    if (url.includes('/rest/v1/profiles')) return json([{ id: MOI, name: 'Beau', is_admin: true }]);
    if (url.includes('/rest/v1/legion_entreprises')) return json({ id: EID, nom: 'Finjaro', modele: 'conseil', taille: 'scaleup', projet: 'La place de marché.', owner_id: MOI });
    if (url.includes('/rest/v1/legion_agents')) return json(AGENTS);
    if (url.includes('/rest/v1/legion_canaux')) return json(CANAUX);
    if (url.includes('/rest/v1/legion_reactions')) return json(REACTIONS);
    if (url.includes('/rest/v1/legion_messages')) return json([...MESSAGES].reverse());
    if (url.includes('/functions/v1/')) return json({ agent: { id: 'a1', nom: 'Alpha' } });
    if (url.includes('/realtime/')) return route.abort();
    return json([]);
  });
  await pg.addInitScript((uid) => {
    localStorage.setItem('finjaro_lang', 'fr');
    localStorage.setItem('sb-bokwivwizghdlaedczbw-auth-token', JSON.stringify({ access_token: 'j', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r',
      user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'beau@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } }));
  }, MOI);
  return { ctx, pg };
}
const fermerBandeaux = async (pg) => { for (const l of ['Refuser', 'Passer', 'Plus tard']) { const el = pg.locator(`button:visible:has-text("${l}")`).first(); if (await el.count()) { await el.click().catch(() => {}); await pg.waitForTimeout(300); } } };
const lire = async (pg, n = 700) => (await pg.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, n);
const debord = async (pg) => pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// 1. Ordinateur: les quatre colonnes
{
  const { ctx, pg } = await page(1280, 820);
  const t0 = Date.now();
  await pg.goto(`${BASE}/legion/${EID}`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(3500); await fermerBandeaux(pg);
  console.log(`=== ORDINATEUR 1280 — accueil, ${Date.now() - t0} ms ===`); console.log(await lire(pg, 900));
  await pg.screenshot({ path: `${SORTIE}/legion-accueil.png`, fullPage: true });
  console.log(`  debordement accueil: ${await debord(pg)}px`);
  await pg.locator('button:has-text("Entrer dans les salons")').first().click(); await pg.waitForTimeout(600);
  await pg.screenshot({ path: `${SORTIE}/legion-ordi.png` });
  await pg.locator('button[title="Fiche agent"]').first().click().catch(() => {}); await pg.waitForTimeout(500);
  await pg.screenshot({ path: `${SORTIE}/legion-ordi-fiche.png` });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  await pg.locator('button[title="Emoji"]').first().click().catch(() => {}); await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${SORTIE}/legion-ordi-emoji.png` });
  console.log(`  debordement: ${await debord(pg)}px`);
  await ctx.close();
}
// 2. Téléphone: la discussion, puis les salons, puis l'équipe, puis les tâches
{
  const { ctx, pg } = await page(390, 844);
  await pg.goto(`${BASE}/legion/${EID}`, { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(3500); await fermerBandeaux(pg);
  console.log(`\n=== TÉLÉPHONE 390 — accueil ===`); console.log(await lire(pg, 500));
  await pg.screenshot({ path: `${SORTIE}/legion-tel-accueil.png`, fullPage: true });
  console.log(`  debordement accueil: ${await debord(pg)}px`);
  await pg.locator('nav button:has-text("Discussion")').first().click(); await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${SORTIE}/legion-tel-chat.png` });
  for (const [onglet, fichier] of [['Salons', 'salons'], ['Équipe', 'equipe'], ['Tâches', 'taches']]) {
    await pg.locator(`nav button:has-text("${onglet}")`).first().click(); await pg.waitForTimeout(400);
    await pg.screenshot({ path: `${SORTIE}/legion-tel-${fichier}.png` });
  }
  console.log(`  debordement: ${await debord(pg)}px`);
  await ctx.close();
}
await b.close();
