// Passage écran par écran (audit 200, 07/10) : texte, tailles, débordements, erreurs.
const { chromium } = require('/home/user/henribeaubayemi/node_modules/playwright');
const fs = require('fs');
const BASE = 'https://staging-finjaro.finjaro.workers.dev';
const PAGES = [
  ['place-accueil', '/'], ['place-recherche', '/search?q=robe'], ['place-boutiques', '/boutiques'], ['place-services', '/services'],
  ['place-categorie', '/products'], ['place-pres-de-vous', '/near-you'], ['place-reels', '/reels'], ['place-panier', '/cart'],
  ['place-ma-commande', '/ma-commande'], ['place-connexion', '/auth'], ['place-a-propos', '/a-propos'], ['place-apps', '/apps'],
  ['place-devenir-vendeur', '/become-vendor'], ['place-kit', '/kit'], ['place-landing', '/landing'], ['place-classement', '/leaderboard'],
  ['leo-accueil', '/legion'], ['leo-fonder', '/legion/fonder'], ['leo-atelier', '/legion/atelier'],
  ['learn-accueil', '/learn/'], ['learn-parcours', '/learn/#/parcours/programmation'], ['learn-lecon-py', '/learn/#/lecon/py-print'],
  ['learn-lecon-ia', '/learn/#/lecon/dl-neuron'], ['learn-atelier', '/learn/#/atelier'], ['learn-progression', '/learn/#/progression'],
];
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const [w, h, app] of [[390, 844, 'tel'], [1440, 900, 'grand']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'fr-FR', timezoneId: 'Africa/Douala' });
    for (const [nom, chemin] of PAGES) {
      const p = await ctx.newPage();
      const errs = []; let echecs = 0;
      p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
      p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)) });
      p.on('requestfailed', () => echecs++);
      const t0 = Date.now();
      try { await p.goto(BASE + chemin, { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e) { errs.push('goto ' + e.message.slice(0, 80)) }
      await p.waitForTimeout(4500);
      const m = await p.evaluate(() => {
        const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' };
        const texte = document.body.innerText || '';
        const mots = (texte.match(/[\p{L}\p{N}’']+/gu) || []).length;
        // mots visibles dans le premier écran
        let motsEcran1 = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n; while ((n = walker.nextNode())) { const el = n.parentElement; if (!el || !vis(el)) continue; const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) motsEcran1 += (n.textContent.match(/[\p{L}\p{N}’']+/gu) || []).length }
        const blocsLongs = [...document.querySelectorAll('p,li,div,span')].filter((e) => vis(e) && e.children.length === 0 && (e.innerText || '').split(/\s+/).length > 45).length;
        const champs = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select')].filter(vis).map((e) => Math.round(e.getBoundingClientRect().height));
        const boutons = [...document.querySelectorAll('button,a.btn,[role=button]')].filter(vis).map((e) => Math.round(e.getBoundingClientRect().height));
        const petitsTextes = [...document.querySelectorAll('body *')].filter((e) => vis(e) && e.childNodes.length && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 2) && parseFloat(getComputedStyle(e).fontSize) < 11).length;
        const debord = document.documentElement.scrollWidth > innerWidth + 1;
        const h1 = [...document.querySelectorAll('h1')].filter(vis).map((e) => e.innerText.trim().slice(0, 60));
        return { url: location.href.replace(location.origin, ''), titre: document.title, mots, motsEcran1, blocsLongs, champs, boutons, petitsTextes, debord, hauteurPage: document.documentElement.scrollHeight, h1, oups: /Oups|Something went wrong/i.test(texte) };
      }).catch((e) => ({ erreur: e.message }));
      await p.screenshot({ path: `${process.argv[2]}/${app}-${nom}.png` }).catch(() => {});
      out.push({ app, nom, chemin, ms: Date.now() - t0, errs: [...new Set(errs)].slice(0, 5), echecs, ...m });
      await p.close();
    }
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  console.log('ok', out.length);
})();
