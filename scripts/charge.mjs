// TEST DE CHARGE (idée 141 des 200, 24/09) — prudent, en lecture seule.
//
// Des « visiteurs » simultanés demandent ce que demande une vraie visite :
// la page du site, la liste des articles (lecture publique de la base), les
// taux du jour. On mesure le temps de réponse (médiane, 95e centile) et les
// erreurs. La base est partagée avec la production : on reste modeste par
// défaut (20 visiteurs × 10 visites) ; on monte seulement avant une grosse
// campagne, et jamais aux heures de pointe.
//
//   VISITEURS=20 VISITES=10 node scripts/charge.mjs
const SITE = process.env.SITE || 'https://staging-finjaro.finjaro.workers.dev';
const U = 'https://bokwivwizghdlaedczbw.supabase.co';
const K = process.env.CLE || 'sb_publishable_UMnuj2_xJ7uZt76TspkBAA_EiAMg6zt';
const VISITEURS = Number(process.env.VISITEURS || 20);
const VISITES = Number(process.env.VISITES || 10);

const CIBLES = [
  { nom: 'site', url: `${SITE}/`, h: {} },
  { nom: 'articles', url: `${U}/rest/v1/products?select=id,name,price_fcfa&is_active=eq.true&order=created_at.desc&limit=24`, h: { apikey: K, Authorization: `Bearer ${K}` } },
  { nom: 'taux', url: `${U}/rest/v1/taux_du_jour?select=code,par_euro&limit=200`, h: { apikey: K, Authorization: `Bearer ${K}` } },
];

const mesures = Object.fromEntries(CIBLES.map((c) => [c.nom, { ms: [], erreurs: 0, codes: {} }]));
async function visiteur() {
  for (let i = 0; i < VISITES; i++) {
    for (const c of CIBLES) {
      const t0 = performance.now();
      try {
        const r = await fetch(c.url, { headers: c.h });
        await r.arrayBuffer();
        mesures[c.nom].codes[r.status] = (mesures[c.nom].codes[r.status] || 0) + 1;
        if (!r.ok) mesures[c.nom].erreurs += 1;
      } catch { mesures[c.nom].erreurs += 1; }
      mesures[c.nom].ms.push(performance.now() - t0);
    }
  }
}
const centile = (l, p) => { const s = [...l].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]) : 0; };
const t0 = performance.now();
await Promise.all(Array.from({ length: VISITEURS }, visiteur));
const duree = (performance.now() - t0) / 1000;
const total = CIBLES.length * VISITEURS * VISITES;
console.log(`${VISITEURS} visiteurs × ${VISITES} visites × ${CIBLES.length} demandes = ${total} demandes en ${duree.toFixed(1)} s (${(total / duree).toFixed(1)} par seconde)`);
for (const c of CIBLES) {
  const m = mesures[c.nom];
  console.log(`${c.nom.padEnd(9)} médiane ${centile(m.ms, 50)} ms · 95 % ${centile(m.ms, 95)} ms · pire ${centile(m.ms, 100)} ms · erreurs ${m.erreurs} · codes ${JSON.stringify(m.codes)}`);
}
