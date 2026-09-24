// LES PARCOURS D'UTILISATEURS (idée 19 des 200, 24/09).
//
// Chaque nuit, un navigateur rejoue ce que font une acheteuse et une
// visiteuse sur la préproduction, sur téléphone (390 px) et sur grand écran
// (1366 px) : l'accueil, une recherche, une fiche d'article, une boutique,
// la page de connexion. Il note ce qui casse : une page qui ne répond pas,
// une erreur JavaScript, l'écran « Oups ». Un parcours cassé ouvre un ticket
// sur le dépôt — et une entreprise Legion qui a branché ce dépôt avec
// « un nouveau ticket ouvre une réunion » en débat le matin même.
//
// Lancé par .github/workflows/parcours.yml ; à la main :
//   BASE=https://staging-finjaro.finjaro.workers.dev node scripts/parcours.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.env.BASE || 'https://staging-finjaro.finjaro.workers.dev').replace(/\/$/, '');
const SORTIE = process.env.SORTIE || 'parcours';
mkdirSync(SORTIE, { recursive: true });

const ETAPES = [
  { nom: 'accueil', aller: async (p) => p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }) },
  { nom: 'recherche', aller: async (p) => p.goto(`${BASE}/search?q=robe`, { waitUntil: 'domcontentloaded' }) },
  {
    nom: 'fiche-article', aller: async (p) => {
      await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(4000);
      const lien = await p.locator('a[href*="/product/"]').first().getAttribute('href').catch(() => null);
      if (!lien) throw new Error('aucune fiche d’article trouvée sur l’accueil');
      return p.goto(new URL(lien, BASE).href, { waitUntil: 'domcontentloaded' });
    },
  },
  {
    nom: 'boutique', aller: async (p) => {
      await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(4000);
      const lien = await p.locator('a[href*="/shop/"]').first().getAttribute('href').catch(() => null);
      if (!lien) throw new Error('aucune boutique trouvée sur l’accueil');
      return p.goto(new URL(lien, BASE).href, { waitUntil: 'domcontentloaded' });
    },
  },
  { nom: 'connexion', aller: async (p) => p.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' }) },
];

const navigateur = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const rapport = [];
for (const largeur of [390, 1366]) {
  // En local (CHROMIUM donné), le proxy du poste signe les connexions : on l'accepte. Jamais en CI.
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: largeur < 800 ? 844 : 900 }, locale: 'fr-FR', ignoreHTTPSErrors: !!process.env.CHROMIUM });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('finjaro_cookie_consent', 'refuse');
      localStorage.setItem('finjaro_pixel_consent', 'refuse');
      localStorage.setItem('finjaro_install_banner_dismissed_at', String(Date.now()));
      localStorage.setItem('finjaro:intro-seen', '1');
    } catch { /* rien */ }
  });
  for (const e of ETAPES) {
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', (x) => erreurs.push(String(x.message).slice(0, 200)));
    const debut = Date.now();
    let statut = null;
    let probleme = null;
    try {
      const r = await e.aller(page);
      statut = r?.status() ?? null;
      await page.waitForTimeout(3500);
      const texte = await page.evaluate(() => document.body.innerText || '');
      if (statut && statut >= 400) probleme = `HTTP ${statut}`;
      else if (/Oups|Something went wrong|Une erreur est survenue/i.test(texte)) probleme = 'écran d’erreur';
      else if (texte.trim().length < 40) probleme = 'page vide';
      else if (erreurs.length) probleme = `erreur JavaScript : ${erreurs[0]}`;
    } catch (x) { probleme = String(x.message).slice(0, 200); }
    const duree = Date.now() - debut;
    await page.screenshot({ path: `${SORTIE}/${e.nom}-${largeur}.png` }).catch(() => {});
    rapport.push({ etape: e.nom, largeur, statut, duree_ms: duree, probleme, url: page.url() });
    console.log(`${probleme ? '✗' : '✓'} ${e.nom} @${largeur} — ${duree} ms${probleme ? ` — ${probleme}` : ''}`);
    await page.close();
  }
  await ctx.close();
}
await navigateur.close();
writeFileSync(`${SORTIE}/rapport.json`, JSON.stringify(rapport, null, 2));

const casses = rapport.filter((r) => r.probleme);
// Un ticket par nuit au plus, et pas de doublon s'il en existe un ouvert.
if (casses.length && process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  const api = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
  const h = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'parcours-finjaro' };
  const ouverts = await fetch(`${api}/issues?state=open&labels=parcours&per_page=5`, { headers: h }).then((r) => r.json()).catch(() => []);
  if (!Array.isArray(ouverts) || !ouverts.length) {
    const corps = `Les parcours de cette nuit sur ${BASE} ont trouvé ${casses.length} problème(s) :\n\n${casses.map((c) => `- **${c.etape}** (${c.largeur} px) : ${c.probleme}`).join('\n')}\n\nCaptures et rapport complet : dans les artefacts du workflow « Parcours d'utilisateurs ».`;
    await fetch(`${api}/issues`, { method: 'POST', headers: h, body: JSON.stringify({ title: `Parcours cassé : ${casses.map((c) => c.etape).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`, body: corps, labels: ['parcours'] }) });
    console.log('ticket ouvert');
  } else console.log('un ticket « parcours » est déjà ouvert');
}
process.exitCode = casses.length ? 1 : 0;
