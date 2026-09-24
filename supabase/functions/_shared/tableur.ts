// LE TABLEUR DES AGENTS (23/09).
//
// Beau, 23/09 : « connecter mes agents avec Excel », « capable d'ouvrir
// Excel et modifier ». Deux sens :
//   - LIRE : un classeur déposé dans un salon devient du texte que l'agent
//     lit (chaque feuille en CSV, tronquée proprement) ;
//   - ÉCRIRE : quand on lui demande un tableau, l'agent le rend en lignes et
//     colonnes, et on en fait un vrai .xlsx (formules comprises : une case
//     qui commence par « = » reste une formule).
//
// SheetJS 0.20.3, copié tel quel depuis son site officiel dans
// vendor/sheetjs (licence Apache 2.0 à côté) : la version publiée sur npm
// (0.18.5) a une faille connue à la LECTURE de fichiers piégés
// (CVE-2023-30533), et ici on lit des fichiers envoyés par des gens. Copié
// et non importé à distance : le paquetage de Supabase refuse les imports
// depuis cdn.sheetjs.com (vu au déploiement du 23/09).
// deno-lint-ignore-file no-explicit-any
// @ts-ignore: module JavaScript sans types
import * as XLSXmod from './vendor/sheetjs/xlsx.mjs';
const XLSX: any = XLSXmod;
type Cellule = { t: string; v?: unknown; f?: string };

export const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MAX_FEUILLES = 6;

// Un classeur (xlsx, xls, csv) en texte lisible par un modèle.
export function classeurEnTexte(octets: Uint8Array, MAX_SIGNES = 14_000, MAX_LIGNES = 300): string {
  const wb = XLSX.read(octets, { type: 'array', cellDates: true, dense: true });
  const morceaux: string[] = [];
  let total = 0;
  for (const nom of wb.SheetNames.slice(0, MAX_FEUILLES)) {
    const ws = wb.Sheets[nom];
    const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false, strip: true });
    const lignes = csv.split('\n');
    const gardees = lignes.slice(0, MAX_LIGNES);
    let bloc = `Feuille « ${nom} » (${lignes.length} ligne${lignes.length > 1 ? 's' : ''}${lignes.length > MAX_LIGNES ? `, les ${MAX_LIGNES} premières ici` : ''}) :\n${gardees.join('\n')}`;
    if (total + bloc.length > MAX_SIGNES) bloc = `${bloc.slice(0, Math.max(0, MAX_SIGNES - total))}\n[… coupé : le fichier est plus long]`;
    morceaux.push(bloc);
    total += bloc.length;
    if (total >= MAX_SIGNES) break;
  }
  if (wb.SheetNames.length > MAX_FEUILLES) morceaux.push(`[… et ${wb.SheetNames.length - MAX_FEUILLES} autre(s) feuille(s) non lue(s)]`);
  return morceaux.join('\n\n');
}

export type Feuille = { nom?: string; lignes?: unknown[][] };

// Une case telle que le modèle l'a écrite → une vraie case Excel : nombre,
// formule, ou texte.
function caseDe(v: unknown): Cellule {
  const s = v == null ? '' : String(v).trim();
  if (s.startsWith('=') && s.length > 1) return { t: 'n', f: s.slice(1) };
  const nombre = s.replace(/\s/g, '').replace(/,(\d{1,2})$/, '.$1');
  if (/^-?\d+(\.\d+)?$/.test(nombre) && nombre.length < 16) return { t: 'n', v: Number(nombre) };
  return { t: 's', v: s };
}

// Des feuilles (lignes de cases) → un fichier .xlsx. null si rien d'utile.
export function creerClasseur(feuilles: Feuille[]): Uint8Array | null {
  const wb = XLSX.utils.book_new();
  let n = 0;
  for (const f of feuilles.slice(0, MAX_FEUILLES)) {
    const lignes = (Array.isArray(f.lignes) ? f.lignes : []).filter(Array.isArray).slice(0, 2000) as unknown[][];
    if (!lignes.length) continue;
    const ws: Record<string, unknown> = {};
    let largeur = 0;
    // Une colonne de taux (« Taux de marge », « % ») s'affiche en pourcentage :
    // 0,33 devient 33,0 % (vu au premier essai, 23/09).
    const pourcent = (lignes[0] || []).map((x) => /taux|%|pourcent|rate|ratio/i.test(String(x ?? '')));
    lignes.forEach((ligne, r) => {
      ligne.slice(0, 60).forEach((v, c) => {
        const cellule = caseDe(v) as Cellule & { z?: string };
        if (cellule.t === 's' && cellule.v === '') return;
        if (r > 0 && pourcent[c] && cellule.t === 'n') cellule.z = '0.0%';
        ws[XLSX.utils.encode_cell({ r, c })] = cellule;
      });
      largeur = Math.max(largeur, Math.min(60, ligne.length));
    });
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, lignes.length - 1), c: Math.max(0, largeur - 1) } });
    // Des colonnes assez larges pour être lues sans toucher à rien.
    ws['!cols'] = Array.from({ length: largeur }, (_, c) => ({ wch: Math.min(40, Math.max(8, ...lignes.map((l) => String(l[c] ?? '').length + 2))) }));
    const nom = String(f.nom || `Feuille ${n + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Feuille ${n + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, nom, true);
    n += 1;
  }
  if (!n) return null;
  const sortie = XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: true });
  return new Uint8Array(sortie as ArrayBuffer);
}

// MODIFIER LE CLASSEUR REÇU (Beau, 24/09 : « s'ils reçoivent un Excel,
// travailler, modifier et renvoyer en xlsx »).
//
// Avant, l'agent recopiait tout le tableau de mémoire : au-delà de ~300
// lignes il en perdait, et les formules d'origine disparaissaient. Ici,
// l'agent ne rend que des MODIFICATIONS (écrire une case, ajouter une ligne,
// une colonne calculée, une feuille…), appliquées sur le VRAI fichier : tout
// le reste (lignes, feuilles, formules, formats de nombres, largeurs) reste
// tel quel. Limite de la version libre de SheetJS : les couleurs et polices
// d'origine peuvent se perdre à l'écriture ; les valeurs et formules, jamais.

// Le classeur avec les ADRESSES des cases (colonnes A, B, C… et numéros de
// ligne), pour que l'agent puisse dire « B7 » sans deviner.
export function classeurAvecAdresses(octets: Uint8Array, MAX_SIGNES = 12_000, MAX_LIGNES = 300): string {
  const wb = XLSX.read(octets, { type: 'array', cellDates: true });
  const morceaux: string[] = [];
  let total = 0;
  for (const nom of wb.SheetNames.slice(0, MAX_FEUILLES)) {
    const ws = wb.Sheets[nom];
    if (!ws['!ref']) { morceaux.push(`Feuille « ${nom} » : vide`); continue; }
    const plage = XLSX.utils.decode_range(ws['!ref']);
    const colonnes = Array.from({ length: Math.min(40, plage.e.c + 1) }, (_, c) => XLSX.utils.encode_col(c));
    const lignes: string[] = [];
    let nb = 0;
    for (let r = plage.s.r; r <= plage.e.r && nb < MAX_LIGNES; r++) {
      const cases = colonnes.map((col) => {
        const cell = ws[`${col}${r + 1}`];
        if (!cell) return '';
        const vu = cell.f ? `=${cell.f}` : String(cell.w ?? cell.v ?? '');
        return vu.replace(/\s+/g, ' ').slice(0, 60);
      });
      if (cases.every((x) => x === '')) continue;
      lignes.push(`${r + 1} | ${cases.join(' | ')}`);
      nb++;
    }
    const reste = plage.e.r + 1 - (plage.s.r + nb);
    let bloc = `Feuille « ${nom} » — lignes ${plage.s.r + 1} à ${plage.e.r + 1}, colonnes A à ${XLSX.utils.encode_col(plage.e.c)}${reste > 0 && nb >= MAX_LIGNES ? ` (les ${MAX_LIGNES} premières lignes remplies ici)` : ''} :\nligne | ${colonnes.join(' | ')}\n${lignes.join('\n')}`;
    if (total + bloc.length > MAX_SIGNES) bloc = `${bloc.slice(0, Math.max(0, MAX_SIGNES - total))}\n[… coupé : le fichier est plus long]`;
    morceaux.push(bloc);
    total += bloc.length;
    if (total >= MAX_SIGNES) break;
  }
  return morceaux.join('\n\n');
}

export type Operation = { op?: string; feuille?: string; cellule?: string; valeur?: string; valeurs?: string; numero?: string; entete?: string; nouveau_nom?: string };

const ADRESSE = /^[A-Z]{1,3}[1-9]\d{0,6}$/;

// Applique les modifications ; rend le fichier, ce qui a été fait et ce qui a
// été refusé (avec la raison), pour que l'agent le dise honnêtement.
export function modifierClasseur(octets: Uint8Array, operations: Operation[]): { octets: Uint8Array | null; faites: string[]; refusees: string[] } {
  const wb = XLSX.read(octets, { type: 'array', cellFormula: true, cellNF: true, cellStyles: true });
  const faites: string[] = [];
  const refusees: string[] = [];
  const feuilleDe = (nom?: string) => {
    const n = String(nom || '').trim();
    const trouve = n ? wb.SheetNames.find((x: string) => x.toLowerCase() === n.toLowerCase()) : wb.SheetNames[0];
    return trouve ? { nom: trouve, ws: wb.Sheets[trouve] } : null;
  };
  const etendre = (ws: Record<string, unknown>, r: number, c: number) => {
    const plage = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r, c }, e: { r, c } };
    plage.s.r = Math.min(plage.s.r, r); plage.s.c = Math.min(plage.s.c, c);
    plage.e.r = Math.max(plage.e.r, r); plage.e.c = Math.max(plage.e.c, c);
    ws['!ref'] = XLSX.utils.encode_range(plage);
  };
  // « {n} » dans une formule = le numéro de la ligne où elle est écrite.
  const avecLigne = (v: string, ligne: number) => v.replace(/\{n\}/g, String(ligne));
  const liste = (s?: string): unknown[] => { try { const x = JSON.parse(String(s || '[]')); return Array.isArray(x) ? x : []; } catch { return []; } };

  for (const o of operations.slice(0, 200)) {
    const op = String(o.op || '').trim();
    try {
      if (op === 'ajouter_feuille') {
        const nom = String(o.feuille || o.nouveau_nom || '').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31);
        if (!nom || wb.SheetNames.includes(nom)) { refusees.push(`ajouter_feuille « ${nom} » : nom vide ou déjà pris`); continue; }
        const lignes = liste(o.valeurs).filter(Array.isArray) as unknown[][];
        const ws: Record<string, unknown> = {};
        lignes.slice(0, 5000).forEach((ligne, r) => ligne.slice(0, 60).forEach((v, c) => { const cell = caseDe(avecLigne(String(v ?? ''), r + 1)); if (!(cell.t === 's' && cell.v === '')) { ws[XLSX.utils.encode_cell({ r, c })] = cell; etendre(ws, r, c); } }));
        if (!ws['!ref']) ws['!ref'] = 'A1:A1';
        XLSX.utils.book_append_sheet(wb, ws, nom);
        faites.push(`feuille « ${nom} » ajoutée (${lignes.length} ligne(s))`);
        continue;
      }
      const f = feuilleDe(o.feuille);
      if (!f) { refusees.push(`${op} : feuille « ${o.feuille} » introuvable`); continue; }
      const ws = f.ws;
      const plage = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r: 0, c: 0 }, e: { r: -1, c: -1 } };
      if (op === 'ecrire') {
        const adr = String(o.cellule || '').trim().toUpperCase();
        if (!ADRESSE.test(adr)) { refusees.push(`ecrire : adresse « ${o.cellule} » invalide`); continue; }
        const { r, c } = XLSX.utils.decode_cell(adr);
        ws[adr] = caseDe(avecLigne(String(o.valeur ?? ''), r + 1));
        etendre(ws, r, c);
        faites.push(`${f.nom}!${adr} = ${String(o.valeur ?? '').slice(0, 40)}`);
      } else if (op === 'ajouter_ligne') {
        const valeurs = liste(o.valeurs);
        if (!valeurs.length) { refusees.push('ajouter_ligne : aucune valeur'); continue; }
        const r = plage.e.r + 1;
        valeurs.slice(0, 60).forEach((v, c) => { const cell = caseDe(avecLigne(String(v ?? ''), r + 1)); if (!(cell.t === 's' && cell.v === '')) { ws[XLSX.utils.encode_cell({ r, c })] = cell; etendre(ws, r, c); } });
        faites.push(`${f.nom} : ligne ${r + 1} ajoutée`);
      } else if (op === 'ajouter_colonne') {
        const c = plage.e.c + 1;
        const tete = String(o.entete || '').trim();
        if (tete) { ws[XLSX.utils.encode_cell({ r: plage.s.r, c })] = { t: 's', v: tete }; etendre(ws, plage.s.r, c); }
        const modele = String(o.valeur ?? '');
        let n = 0;
        for (let r = plage.s.r + 1; r <= plage.e.r; r++) {
          const pleine = Array.from({ length: c }, (_, k) => ws[XLSX.utils.encode_cell({ r, c: k })]).some(Boolean);
          if (!pleine || !modele) continue;
          ws[XLSX.utils.encode_cell({ r, c })] = caseDe(avecLigne(modele, r + 1));
          etendre(ws, r, c);
          n++;
        }
        faites.push(`${f.nom} : colonne ${XLSX.utils.encode_col(c)}${tete ? ` « ${tete} »` : ''} ajoutée (${n} ligne(s) remplie(s))`);
      } else if (op === 'effacer_ligne') {
        const num = Number(o.numero);
        if (!Number.isInteger(num) || num < 1) { refusees.push(`effacer_ligne : numéro « ${o.numero} » invalide`); continue; }
        for (let c = plage.s.c; c <= plage.e.c; c++) delete ws[XLSX.utils.encode_cell({ r: num - 1, c })];
        faites.push(`${f.nom} : ligne ${num} vidée`);
      } else if (op === 'renommer_feuille') {
        const nouveau = String(o.nouveau_nom || '').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31);
        if (!nouveau || wb.SheetNames.includes(nouveau)) { refusees.push(`renommer_feuille : « ${nouveau} » vide ou déjà pris`); continue; }
        const i = wb.SheetNames.indexOf(f.nom);
        wb.SheetNames[i] = nouveau;
        wb.Sheets[nouveau] = ws;
        delete wb.Sheets[f.nom];
        faites.push(`feuille « ${f.nom} » renommée « ${nouveau} »`);
      } else {
        refusees.push(`« ${op} » : opération inconnue`);
      }
    } catch (e) { refusees.push(`${op} : ${(e as Error).message}`); }
  }
  if (!faites.length) return { octets: null, faites, refusees };
  const sortie = XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: true, cellStyles: true });
  return { octets: new Uint8Array(sortie as ArrayBuffer), faites, refusees };
}
