// Lire un rapport Power BI (.pbix, .pbit) dans le navigateur (Beau, 04/11 :
// « j'ai glissé mon rapport pour demander à Léo de faire des trucs, ça a
// refusé »). Un .pbix est une archive ZIP : on en sort ce qui se lit —
// les pages, les visuels et les champs qu'ils utilisent (Report/Layout), le
// modèle avec ses tables, colonnes et mesures DAX (DataModelSchema, présent
// dans un .pbit), les requêtes Power Query (DataMashup). Les DONNÉES du
// modèle (DataModel) sont compressées par Power BI : elles ne se lisent pas
// ici, et le résumé le dit au lieu de les inventer.

const MAX_TEXTE = 150_000;
const MAX_MESURE = 1_200; // une mesure de rendu (SVG, couleurs) peut faire des milliers de signes

function u16(d, o) { return d[o] | (d[o + 1] << 8); }
function u32(d, o) { return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0; }

async function inflater(octets) {
  const source = new ReadableStream({ start(c) { c.enqueue(octets); c.close(); } });
  const lu = source.pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const morceaux = []; let total = 0;
  for (;;) { const { done, value } = await lu.read(); if (done) break; morceaux.push(value); total += value.length; }
  const sortie = new Uint8Array(total); let o = 0;
  for (const m of morceaux) { sortie.set(m, o); o += m.length; }
  return sortie;
}

// Les entrées d'une archive ZIP : nom → fonction qui rend les octets.
export function listerZip(donnees) {
  const d = donnees instanceof Uint8Array ? donnees : new Uint8Array(donnees);
  let fin = -1;
  for (let i = d.length - 22; i >= Math.max(0, d.length - 65_557); i--) {
    if (u32(d, i) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error('Ce fichier n\'est pas une archive Power BI lisible.');
  const n = u16(d, fin + 10);
  let o = u32(d, fin + 16);
  const entrees = new Map();
  for (let k = 0; k < n; k++) {
    if (u32(d, o) !== 0x02014b50) break;
    const methode = u16(d, o + 10);
    const taille = u32(d, o + 20);
    const lg = u16(d, o + 28), ex = u16(d, o + 30), co = u16(d, o + 32);
    const local = u32(d, o + 42);
    const nom = new TextDecoder().decode(d.subarray(o + 46, o + 46 + lg));
    entrees.set(nom, async () => {
      const l = u16(d, local + 26), e = u16(d, local + 28);
      const debut = local + 30 + l + e;
      const brut = d.subarray(debut, debut + taille);
      return methode === 0 ? brut : inflater(brut);
    });
    o += 46 + lg + ex + co;
  }
  return entrees;
}

function texteDe(octets) {
  if (!octets || !octets.length) return '';
  const utf16 = (octets[0] === 0xff && octets[1] === 0xfe) || (octets[1] === 0 && octets[3] === 0);
  const t = new TextDecoder(utf16 ? 'utf-16le' : 'utf-8').decode(octets);
  return t.replace(/^﻿/, '');
}

function json(t) { try { return JSON.parse(t); } catch { return null; } }

const joli = (nom) => String(nom || '').replace(/^(Sum|Count|Avg|Min|Max|CountNonNull)\((.*)\)$/i, (_, f, x) => `${f.toLowerCase()} de ${x}`);

function resumerLayout(layout) {
  const lignes = [];
  const pages = layout?.sections || [];
  lignes.push(`PAGES DU RAPPORT (${pages.length})`);
  pages.forEach((p, i) => {
    const visuels = (p.visualContainers || []).map((v) => json(v.config)).filter(Boolean);
    lignes.push(`\nPage ${i + 1} : ${p.displayName || p.name || 'sans nom'} — ${visuels.length} visuel(s)`);
    visuels.forEach((c) => {
      const sv = c.singleVisual;
      if (!sv) return;
      const champs = (sv.prototypeQuery?.Select || []).map((s) => joli(s.Name || s.NativeReferenceName)).filter(Boolean);
      const titre = sv.vcObjects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;
      lignes.push(`  - ${sv.visualType || 'visuel'}${titre ? ` « ${String(titre).replace(/^'|'$/g, '')} »` : ''}${champs.length ? ` : ${champs.join(', ')}` : ''}`);
    });
  });
  return lignes.join('\n');
}

// Nouveau format de rapport (PBIR) : une page = Report/definition/pages/<id>/page.json,
// un visuel = .../visuals/<id>/visual.json. Les champs sont dans query.queryState.
function nomChamp(p) {
  if (p.queryRef) return joli(p.queryRef);
  const f = p.field || {};
  const col = f.Column || f.Measure || f.Aggregation?.Expression?.Column || f.HierarchyLevel;
  const ent = col?.Expression?.SourceRef?.Entity;
  const prop = col?.Property || col?.Level;
  return ent && prop ? `${ent}.${prop}` : '';
}

async function resumerPages(entrees, lire) {
  const cles = [...entrees.keys()];
  const pagesJson = json(texteDe(await lire('Report/definition/pages/pages.json') || new Uint8Array()));
  const ordre = pagesJson?.pageOrder || [];
  const ids = cles.map((c) => /^Report\/definition\/pages\/([^/]+)\/page\.json$/.exec(c)?.[1]).filter(Boolean);
  ids.sort((a, b) => (ordre.indexOf(a) < 0 ? 999 : ordre.indexOf(a)) - (ordre.indexOf(b) < 0 ? 999 : ordre.indexOf(b)));
  if (!ids.length) return '';
  const lignes = [`PAGES DU RAPPORT (${ids.length})`];
  let n = 0;
  for (const id of ids) {
    n += 1;
    const page = json(texteDe(await lire(`Report/definition/pages/${id}/page.json`)));
    const visuels = cles.filter((c) => c.startsWith(`Report/definition/pages/${id}/visuals/`) && c.endsWith('/visual.json'));
    lignes.push(`\nPage ${n} : ${page?.displayName || id} — ${visuels.length} visuel(s)`);
    for (const c of visuels) {
      const v = json(texteDe(await lire(c)));
      const vis = v?.visual;
      if (!vis) { if (v?.visualGroup) lignes.push(`  - groupe « ${v.visualGroup.displayName || ''} »`); continue; }
      const champs = [];
      for (const r of Object.values(vis.query?.queryState || {})) for (const p of r.projections || []) { const c2 = nomChamp(p); if (c2) champs.push(c2); }
      const titre = vis.visualContainerObjects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;
      lignes.push(`  - ${vis.visualType || 'visuel'}${titre ? ` « ${String(titre).replace(/^'|'$/g, '')} »` : ''}${champs.length ? ` : ${[...new Set(champs)].join(', ')}` : ''}`);
    }
  }
  const signets = cles.filter((c) => /\.bookmark\.json$/.test(c));
  if (signets.length) {
    const noms = [];
    for (const c of signets) { const b = json(texteDe(await lire(c))); if (b?.displayName) noms.push(b.displayName); }
    if (noms.length) lignes.push(`\nSIGNETS (${noms.length}) : ${noms.join(', ')}`);
  }
  const perso = [...new Set(cles.map((c) => /^Report\/CustomVisuals\/([^/]+)\//.exec(c)?.[1]).filter(Boolean))];
  if (perso.length) lignes.push(`\nVISUELS PERSONNALISÉS (${perso.length}) : ${perso.join(', ')}`);
  return lignes.join('\n');
}

function resumerModele(modele) {
  const m = modele?.model || modele;
  const tables = m?.tables || [];
  if (!tables.length) return '';
  const lignes = [`MODÈLE DE DONNÉES (${tables.length} table(s))`];
  tables.forEach((t) => {
    if (String(t.name).startsWith('LocalDateTable') || String(t.name).startsWith('DateTableTemplate')) return;
    lignes.push(`\nTable ${t.name}`);
    const cols = (t.columns || []).filter((c) => c.type !== 'rowNumber').map((c) => `${c.name}${c.dataType ? ` (${c.dataType})` : ''}`);
    if (cols.length) lignes.push(`  Colonnes : ${cols.join(', ')}`);
    (t.measures || []).forEach((x) => {
      const expr = Array.isArray(x.expression) ? x.expression.join('\n') : x.expression;
      const e = String(expr || '').trim();
      lignes.push(`  Mesure ${x.name} = ${e.length > MAX_MESURE ? `${e.slice(0, MAX_MESURE)}\n  [… mesure coupée : ${e.length} caractères au total]` : e}`);
    });
  });
  const rel = m?.relationships || [];
  if (rel.length) {
    lignes.push('\nRELATIONS');
    rel.forEach((r) => lignes.push(`  ${r.fromTable}[${r.fromColumn}] → ${r.toTable}[${r.toColumn}]`));
  }
  return lignes.join('\n');
}

async function requetes(octets) {
  // DataMashup : 4 octets de version, 4 octets de taille, puis une archive ZIP
  // qui contient Formulas/Section1.m (le code Power Query).
  try {
    const d = new Uint8Array(octets);
    const taille = u32(d, 4);
    const interne = listerZip(d.subarray(8, 8 + taille));
    const lire = interne.get('Formulas/Section1.m');
    return lire ? texteDe(await lire()) : '';
  } catch { return ''; }
}

function octetsDe(fichier) {
  if (typeof fichier.arrayBuffer === 'function') return fichier.arrayBuffer();
  return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ko(r.error); r.readAsArrayBuffer(fichier); });
}

export async function resumerPowerBI(fichier) {
  const donnees = new Uint8Array(await octetsDe(fichier));
  const entrees = listerZip(donnees);
  const lire = async (nom) => (entrees.has(nom) ? entrees.get(nom)() : null);
  const parties = [];
  const manque = [];

  const layout = await lire('Report/Layout');
  if (layout) {
    const l = json(texteDe(layout));
    if (l) parties.push(resumerLayout(l));
  } else {
    const pages = await resumerPages(entrees, lire);
    if (pages) parties.push(pages);
  }
  const schema = await lire('DataModelSchema');
  if (schema) {
    const s = resumerModele(json(texteDe(schema)));
    if (s) parties.push(s);
  } else if (entrees.has('DataModel')) {
    manque.push('Le modèle de données (tables, colonnes, mesures DAX) est compressé par Power BI dans un .pbix : il ne se lit pas ici. Pour que l\'agent le lise, enregistre le rapport en .pbit (modèle sans données) ou exporte les tables en Excel ou CSV.');
  }
  const pq = await lire('DataMashup');
  if (pq) {
    const m = await requetes(pq);
    if (m) parties.push(`REQUÊTES POWER QUERY (langage M)\n${m.trim()}`);
  }
  const conn = await lire('Connections');
  if (conn) parties.push(`SOURCES DE DONNÉES (Connections)\n${texteDe(conn).trim()}`);

  if (!parties.length) throw new Error('Aucune page, requête ou modèle lisible dans ce fichier Power BI.');
  let texte = `Rapport Power BI : ${fichier.name}\n(Résumé de ce qui se lit dans le fichier. Rien ici n'est calculé ni deviné.)\n\n${parties.join('\n\n')}`;
  if (manque.length) texte += `\n\nCE QUI NE SE LIT PAS\n${manque.join('\n')}`;
  if (texte.length > MAX_TEXTE) texte = `${texte.slice(0, MAX_TEXTE)}\n[… résumé coupé]`;
  return { texte, avertissements: manque };
}
