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
const MAX_LIGNES = 300;
const MAX_SIGNES = 14_000;

// Un classeur (xlsx, xls, csv) en texte lisible par un modèle.
export function classeurEnTexte(octets: Uint8Array): string {
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
