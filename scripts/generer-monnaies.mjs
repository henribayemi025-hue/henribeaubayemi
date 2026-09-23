// Génère src/lib/monnaies-donnees.js : la monnaie de chaque pays, le pays de
// chaque fuseau horaire, et des taux de secours datés.
//
// Beau, 23/09 : chacun doit voir les prix dans SA monnaie — FCFA, euro,
// livre, dollar américain, dollar canadien, rouble… Écrire ces tables de
// mémoire, c'est ce qui avait mis le Canada en dollars américains. Elles
// viennent donc de sources publiques, et ce script les régénère :
//   - la monnaie d'un pays : Unicode CLDR (paquet npm cldr-core,
//     supplemental/currencyData.json), la première monnaie en cours de la
//     liste du pays qui a un taux ;
//   - le pays d'un fuseau horaire : la base IANA (zone.tab, et les anciens
//     noms de tzdata.zi, que certains navigateurs renvoient encore) ;
//   - les taux de secours : ExchangeRate-API (open.er-api.com), la même
//     source que la base, pour qu'un premier affichage hors ligne reste juste.
//
// Usage : node scripts/generer-monnaies.mjs <dossier du paquet cldr-core>
// (npm pack cldr-core && tar xzf cldr-core-*.tgz → ./package)

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cldr = process.argv[2];
if (!cldr) { console.error('Usage : node scripts/generer-monnaies.mjs <cldr-core/package>'); process.exit(1); }

const r = await fetch('https://open.er-api.com/v6/latest/EUR');
const api = await r.json();
if (api.result !== 'success') throw new Error('Taux indisponibles');
const taux = api.rates;

// Le franc CFA : XAF (Afrique centrale) et XOF (Afrique de l'Ouest), même
// parité fixe à l'euro ; Finjaro les affiche tous deux « FCFA ».
const cfa = (c) => (c === 'XAF' || c === 'XOF' ? 'FCFA' : c);

const regions = JSON.parse(readFileSync(join(cldr, 'supplemental/currencyData.json'), 'utf8')).supplemental.currencyData.region;
const paysMonnaie = {};
for (const [pays, liste] of Object.entries(regions)) {
  if (!/^[A-Z]{2}$/.test(pays) || pays === 'EU' || pays === 'ZZ') continue;
  const enCours = liste.flatMap((e) => Object.entries(e)).filter(([, i]) => !i._to && i._tender !== 'false').map(([c]) => c);
  const choisie = enCours.find((c) => taux[c]);
  if (choisie) paysMonnaie[pays] = cfa(choisie);
}

const fuseauPays = {};
for (const ligne of readFileSync('/usr/share/zoneinfo/zone.tab', 'utf8').split('\n')) {
  if (!ligne || ligne.startsWith('#')) continue;
  const [pays, , fuseau] = ligne.split('\t');
  if (paysMonnaie[pays]) fuseauPays[fuseau] = pays;
}
for (const ligne of readFileSync('/usr/share/zoneinfo/tzdata.zi', 'utf8').split('\n')) {
  const m = ligne.match(/^L (\S+) (\S+)$/);
  if (m && fuseauPays[m[1]] && !fuseauPays[m[2]]) fuseauPays[m[2]] = fuseauPays[m[1]];
}

// Compact : « CM:XAF,… » et, par pays, ses fuseaux regroupés.
const parPays = {};
for (const [f, p] of Object.entries(fuseauPays)) (parPays[p] ||= []).push(f);
const monnaies = Object.entries(paysMonnaie).sort().map(([p, c]) => `${p}:${c}`).join(',');
const fuseaux = Object.entries(parPays).sort().map(([p, fs]) => `${p}=${fs.sort().join(' ')}`).join(';');
const secours = Object.fromEntries(Object.entries(taux).filter(([c]) => /^[A-Z]{3}$/.test(c)).sort());
const date = new Date(api.time_last_update_unix * 1000).toISOString().slice(0, 10);

writeFileSync('src/lib/monnaies-donnees.js', `// Généré par scripts/generer-monnaies.mjs le ${new Date().toISOString().slice(0, 10)} — ne pas modifier à la main.
// Sources : Unicode CLDR ${JSON.parse(readFileSync(join(cldr, 'package.json'), 'utf8')).version} (monnaie de chaque pays),
// base IANA des fuseaux horaires (pays de chaque fuseau), ExchangeRate-API (taux du ${date}).

// Pays → monnaie (XAF et XOF sont affichés « FCFA »).
export const PAYS_MONNAIE = Object.fromEntries('${monnaies}'.split(',').map((x) => x.split(':')));

// Fuseau horaire → pays.
export const FUSEAU_PAYS = Object.fromEntries('${fuseaux}'.split(';').flatMap((x) => { const [p, fs] = x.split('='); return fs.split(' ').map((f) => [f, p]); }));

// Taux de secours (unités pour 1 euro), tant que ceux du jour ne sont pas arrivés.
export const TAUX_SECOURS_DATE = '${date}';
export const TAUX_SECOURS = ${JSON.stringify(secours)};
`);
console.log(`${Object.keys(paysMonnaie).length} pays, ${Object.keys(fuseauPays).length} fuseaux, ${Object.keys(secours).length} taux du ${date}`);
