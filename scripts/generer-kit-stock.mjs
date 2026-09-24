// Fabrique le classeur du kit gratuit « Tenir son stock et sa caisse ».
//
//   node scripts/generer-kit-stock.mjs
//
// Écrit public/kit/stock-et-caisse.xlsx (français) et
// public/kit/stock-and-cash.xlsx (anglais).
//
// Pourquoi un script sans bibliothèque: le dépôt n'a aucune dépendance qui
// écrit de l'Excel, et en ajouter une pour un fichier fabriqué une fois
// alourdirait l'installation de tout le monde. Un .xlsx n'est qu'une archive
// zip de quelques fichiers XML; Node sait compresser (zlib) et calculer le
// CRC32 (zlib.crc32, Node ≥ 22.2). Le reste est écrit ici.
//
// Règles du kit (CLAUDE.md):
// - AUCUNE monnaie par défaut: la case « Ma monnaie » est vide, c'est la
//   personne qui l'écrit. Les montants sont des nombres nus.
// - AUCUNE donnée inventée présentée comme vraie: les seules lignes remplies
//   sont marquées « EXEMPLE — à effacer », en gris italique.
//
// La feuille Articles est la PREMIÈRE, et sa ligne 1 porte les titres de
// colonnes: c'est exactement ce que lit l'import de produits de Finjaro
// Accounting (première feuille, première ligne = titres; « Article »,
// « Prix de vente », « Prix d'achat », « Stock », « Catégorie »,
// « Référence » sont reconnus tels quels). Ne pas y ajouter de ligne de
// titre au-dessus, ni renommer ces colonnes, sans vérifier l'import
// d'Accounting (src/lib/importers.ts dans son dépôt).

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = join(RACINE, 'public', 'kit');

// Nombre de lignes préparées (formules déjà posées) dans chaque feuille.
const N_ARTICLES = 300;
const N_ENTREES = 600;
const N_VENTES = 2000;
const N_CAISSE = 400;

// Une date d'exemple fixe: les lignes d'exemple ne doivent pas se glisser
// dans le récapitulatif du jour de la personne.
const DATE_EXEMPLE = [2026, 9, 1];

// ---------------------------------------------------------------------------
// Textes
// ---------------------------------------------------------------------------

const TEXTES = {
  fr: {
    fichier: 'stock-et-caisse.xlsx',
    titreDoc: 'Tenir son stock et sa caisse — Finjaro',
    feuilles: { art: 'Articles', ent: 'Entrées de stock', ven: 'Ventes du jour', cai: 'Caisse du jour', rec: 'Récap' },
    paiements: ['Espèces', 'Mobile money', 'Carte', 'Crédit'],
    oui: 'Oui',
    non: 'Non',
    aCommander: 'À commander',
    ok: 'OK',
    art: {
      cols: ['Référence', 'Article', 'Catégorie', "Prix d'achat", 'Prix de vente', 'Stock', 'Stock de départ', "Seuil d'alerte", 'Marge par pièce', 'Valeur du stock', 'À commander ?'],
      maMonnaie: 'Ma monnaie',
      aide: [
        'Comment remplir',
        '1. Écris ta monnaie dans la case jaune ci-dessus (FCFA, €, £, $ CA, ₦, …).',
        '2. Une ligne par article. La référence est facultative (code-barres, code maison).',
        "3. Stock de départ : ce que tu comptes aujourd'hui sur l'étagère.",
        "4. Seuil d'alerte : à ce niveau ou en dessous, l'article passe « À commander ».",
        "5. Les colonnes grises se calculent seules : n'y écris rien.",
        '6. Efface les lignes EXEMPLE quand tu as compris.',
      ],
      exemples: [
        { ref: 'EX-01', nom: 'EXEMPLE — Savon (à effacer)', cat: 'Exemple', achat: 100, vente: 150, depart: 20, seuil: 5 },
        { ref: 'EX-02', nom: 'EXEMPLE — Filtre à huile (à effacer)', cat: 'Exemple', achat: 400, vente: 600, depart: 3, seuil: 2 },
      ],
    },
    ent: {
      titre: 'Entrées de stock — tout ce qui arrive sur tes étagères',
      aide: "Une ligne par livraison reçue. Choisis l'article dans la liste. Le prix d'achat se remplit tout seul : change-le si le fournisseur a changé son prix. « Payé ? » : Non tant que tu dois l'argent.",
      cols: ['Date', 'Article', 'Quantité reçue', "Prix d'achat unitaire", 'Total', 'Fournisseur', 'Payé ?', 'Note'],
      exemple: { article: 0, qte: 10, fournisseur: 'EXEMPLE — fournisseur', paye: true, note: 'EXEMPLE — à effacer' },
    },
    ven: {
      titre: 'Ventes du jour — une ligne par vente, jour après jour',
      aide: "Choisis l'article dans la liste. Le prix se remplit tout seul : change-le si tu as fait une remise. Si un client paie à crédit, écris son nom.",
      cols: ['Date', 'Article', 'Quantité', 'Prix unitaire', 'Total', 'Paiement', 'Client (si crédit)', 'Coût', 'Marge', 'Note'],
      exemples: [
        { article: 0, qte: 3, paiement: 0, note: 'EXEMPLE — à effacer' },
        { article: 1, qte: 1, paiement: 1, note: 'EXEMPLE — à effacer' },
      ],
    },
    cai: {
      titre: 'Caisse du jour — une ligne par jour',
      aide: "Le matin : la date et le fond de caisse. Pendant la journée : ce qui entre ou sort de la caisse en dehors des ventes (une dépense, de l'argent pris pour la maison). Le soir : compte les billets et les pièces, écris « Caisse comptée ». L'écart doit être 0.",
      cols: ['Date', 'Fond de caisse (matin)', 'Ventes en espèces', "Autres entrées d'espèces", "Sorties d'espèces", 'Caisse attendue', 'Caisse comptée (soir)', 'Écart', 'Ventes en mobile money (à vérifier sur le téléphone)', 'Explication'],
      exemple: { fond: 500, autres: 0, sorties: 100, ecart: -50, note: 'EXEMPLE — monnaie mal rendue ? À effacer' },
    },
    rec: {
      titre: "Où j'en suis",
      montantsEn: 'Montants en :',
      sansMonnaie: '(écris ta monnaie dans Articles, case « Ma monnaie »)',
      jour: 'Jour à regarder',
      jourAide: "Laisse vide pour aujourd'hui, ou écris une date.",
      jourAffiche: 'Jour affiché',
      sJour: 'La journée',
      ventesJour: 'Ventes du jour',
      dont: 'dont',
      margeJour: 'Marge du jour',
      ecartJour: 'Écart de caisse du jour',
      ecartAide: 'vide = caisse pas encore comptée ce jour-là',
      sMois: 'Le mois de ce jour',
      ventesMois: 'Ventes du mois',
      margeMois: 'Marge du mois',
      achatsMois: 'Achats de stock du mois',
      ecartsMois: 'Écarts de caisse du mois (cumulés)',
      sStock: 'Le stock',
      valeurStock: "Valeur du stock (au prix d'achat)",
      nbCommander: 'Articles à commander',
      dette: 'Ce que je dois encore aux fournisseurs',
      suite: "Quand ce classeur devient trop lourd (plusieurs caisses, reçus à envoyer, codes-barres) : Finjaro Accounting, accounting.finjaro.net — tes articles s'y importent depuis ce fichier.",
    },
  },
  en: {
    fichier: 'stock-and-cash.xlsx',
    titreDoc: 'Keep track of your stock and cash — Finjaro',
    feuilles: { art: 'Items', ent: 'Stock received', ven: 'Daily sales', cai: 'Daily cash', rec: 'Summary' },
    paiements: ['Cash', 'Mobile money', 'Card', 'Credit'],
    oui: 'Yes',
    non: 'No',
    aCommander: 'Reorder',
    ok: 'OK',
    art: {
      cols: ['Reference', 'Item name', 'Category', 'Purchase price', 'Selling price', 'Stock', 'Opening stock', 'Reorder level', 'Margin per unit', 'Stock value', 'Reorder?'],
      maMonnaie: 'My currency',
      aide: [
        'How to fill it in',
        '1. Type your currency in the yellow box above (£, €, $, CAD, FCFA, ₦, …).',
        '2. One row per item. The reference is optional (barcode, your own code).',
        '3. Opening stock: what you count on the shelf today.',
        '4. Reorder level: at or below it, the item shows “Reorder”.',
        '5. Grey columns calculate themselves: do not type in them.',
        '6. Delete the EXAMPLE rows once you have understood.',
      ],
      exemples: [
        { ref: 'EX-01', nom: 'EXAMPLE — Soap (delete me)', cat: 'Example', achat: 100, vente: 150, depart: 20, seuil: 5 },
        { ref: 'EX-02', nom: 'EXAMPLE — Oil filter (delete me)', cat: 'Example', achat: 400, vente: 600, depart: 3, seuil: 2 },
      ],
    },
    ent: {
      titre: 'Stock received — everything that arrives on your shelves',
      aide: 'One row per delivery. Pick the item from the list. The purchase price fills itself in: change it if the supplier changed the price. “Paid?”: No for as long as you still owe the money.',
      cols: ['Date', 'Item name', 'Quantity received', 'Unit purchase price', 'Total', 'Supplier', 'Paid?', 'Note'],
      exemple: { article: 0, qte: 10, fournisseur: 'EXAMPLE — supplier', paye: true, note: 'EXAMPLE — delete me' },
    },
    ven: {
      titre: 'Daily sales — one row per sale, day after day',
      aide: 'Pick the item from the list. The price fills itself in: change it if you gave a discount. If a customer buys on credit, write their name.',
      cols: ['Date', 'Item name', 'Quantity', 'Unit price', 'Total', 'Payment', 'Customer (if credit)', 'Cost', 'Margin', 'Note'],
      exemples: [
        { article: 0, qte: 3, paiement: 0, note: 'EXAMPLE — delete me' },
        { article: 1, qte: 1, paiement: 1, note: 'EXAMPLE — delete me' },
      ],
    },
    cai: {
      titre: 'Daily cash — one row per day',
      aide: 'Morning: the date and the opening float. During the day: cash in or out of the till other than sales (an expense, money taken for home). Evening: count notes and coins, write “Counted cash”. The difference should be 0.',
      cols: ['Date', 'Opening float (morning)', 'Cash sales', 'Other cash in', 'Cash out', 'Expected cash', 'Counted cash (evening)', 'Difference', 'Mobile money sales (check on the phone)', 'Explanation'],
      exemple: { fond: 500, autres: 0, sorties: 100, ecart: -50, note: 'EXAMPLE — wrong change given? Delete me' },
    },
    rec: {
      titre: 'Where I stand',
      montantsEn: 'Amounts in:',
      sansMonnaie: '(type your currency in Items, “My currency” box)',
      jour: 'Day to look at',
      jourAide: 'Leave empty for today, or type a date.',
      jourAffiche: 'Day shown',
      sJour: 'The day',
      ventesJour: 'Sales for the day',
      dont: 'of which',
      margeJour: 'Margin for the day',
      ecartJour: 'Cash difference for the day',
      ecartAide: 'empty = cash not counted yet that day',
      sMois: "That day's month",
      ventesMois: 'Sales for the month',
      margeMois: 'Margin for the month',
      achatsMois: 'Stock bought this month',
      ecartsMois: 'Cash differences this month (total)',
      sStock: 'Stock',
      valeurStock: 'Stock value (at purchase price)',
      nbCommander: 'Items to reorder',
      dette: 'What I still owe suppliers',
      suite: 'When this workbook gets too heavy (several tills, receipts to send, barcodes): Finjaro Accounting, accounting.finjaro.net — your items import straight from this file.',
    },
  },
};

// ---------------------------------------------------------------------------
// Styles (xl/styles.xml) — palette « Terre & Or » de Finjaro
// ---------------------------------------------------------------------------

const C = {
  ink: 'FF171B26',
  muted: 'FF6B6B6B',
  terracotta: 'FFC25E38',
  brass: 'FFE09F3E',
  creme: 'FFFAF6F0',
  calc: 'FFF4EFE6',
  jaune: 'FFFDF6E3',
  trait: 'FFD9CBB5',
};

// Indices des styles de cellule (cellXfs), dans l'ordre où ils sont écrits.
const S = {
  normal: 0,
  titre: 1,
  note: 2,
  entete: 3,
  texte: 4,
  argent: 5,
  entier: 6,
  date: 7,
  calcTexte: 8,
  calcArgent: 9,
  calcEntier: 10,
  exTexte: 11,
  exArgent: 12,
  exEntier: 13,
  exDate: 14,
  monnaieLabel: 15,
  monnaieCase: 16,
  recLabel: 17,
  recValeur: 18,
  recEntier: 19,
  recSection: 20,
  recDate: 21,
  aideTitre: 22,
  recValeurDate: 23,
  recTexte: 24,
  aide: 25,
  // Format « Standard », sans séparateur de milliers: voir construire().
  brut: 26,
  exBrut: 27,
  calcBrut: 28,
};

function stylesXml() {
  const fonts = [
    `<font><sz val="11"/><color rgb="${C.ink}"/><name val="Calibri"/><family val="2"/></font>`, // 0
    `<font><b/><sz val="16"/><color rgb="${C.terracotta}"/><name val="Calibri"/><family val="2"/></font>`, // 1 titre
    `<font><i/><sz val="10"/><color rgb="${C.muted}"/><name val="Calibri"/><family val="2"/></font>`, // 2 note
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>`, // 3 entête
    `<font><i/><sz val="11"/><color rgb="${C.muted}"/><name val="Calibri"/><family val="2"/></font>`, // 4 exemple
    `<font><b/><sz val="11"/><color rgb="${C.ink}"/><name val="Calibri"/><family val="2"/></font>`, // 5 gras
    `<font><b/><sz val="14"/><color rgb="${C.ink}"/><name val="Calibri"/><family val="2"/></font>`, // 6 grand
    `<font><b/><sz val="12"/><color rgb="${C.terracotta}"/><name val="Calibri"/><family val="2"/></font>`, // 7 section
  ];
  const fill = (rgb) => `<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
  const fills = [
    '<fill><patternFill patternType="none"/></fill>', // 0 (obligatoire)
    '<fill><patternFill patternType="gray125"/></fill>', // 1 (obligatoire)
    fill(C.terracotta), // 2
    fill(C.calc), // 3
    fill(C.jaune), // 4
    fill(C.brass), // 5
    fill(C.creme), // 6
  ];
  const bord = (style, rgb) => `<border><left style="${style}"><color rgb="${rgb}"/></left><right style="${style}"><color rgb="${rgb}"/></right><top style="${style}"><color rgb="${rgb}"/></top><bottom style="${style}"><color rgb="${rgb}"/></bottom><diagonal/></border>`;
  const borders = [
    '<border><left/><right/><top/><bottom/><diagonal/></border>', // 0
    bord('thin', C.trait), // 1
    bord('medium', C.brass), // 2
  ];
  // [numFmtId, fontId, fillId, borderId, alignement]
  const X = [
    [0, 0, 0, 0, ''], // normal
    [0, 1, 0, 0, ''], // titre
    [0, 2, 0, 0, '<alignment wrapText="1" vertical="top"/>'], // note
    [0, 3, 2, 1, '<alignment wrapText="1" vertical="center"/>'], // entête
    [0, 0, 0, 1, ''], // texte
    [3, 0, 0, 1, ''], // argent
    [3, 0, 0, 1, ''], // entier
    [14, 0, 0, 1, '<alignment horizontal="left"/>'], // date
    [0, 0, 3, 1, ''], // calcTexte
    [3, 0, 3, 1, ''], // calcArgent
    [3, 0, 3, 1, ''], // calcEntier
    [0, 4, 0, 1, ''], // exTexte
    [3, 4, 0, 1, ''], // exArgent
    [3, 4, 0, 1, ''], // exEntier
    [14, 4, 0, 1, '<alignment horizontal="left"/>'], // exDate
    [0, 3, 5, 2, '<alignment vertical="center"/>'], // monnaieLabel
    [0, 6, 4, 2, '<alignment horizontal="center" vertical="center"/>'], // monnaieCase
    [0, 0, 0, 0, '<alignment indent="1"/>'], // recLabel
    [3, 6, 6, 1, ''], // recValeur
    [3, 6, 6, 1, ''], // recEntier
    [0, 7, 0, 0, ''], // recSection
    [14, 6, 4, 2, '<alignment horizontal="left"/>'], // recDate (à saisir)
    [0, 5, 0, 0, ''], // aideTitre
    [14, 5, 6, 1, '<alignment horizontal="left"/>'], // recValeurDate
    [0, 5, 6, 1, ''], // recTexte
    [0, 2, 0, 0, ''], // aide (sans retour à la ligne: le texte déborde à droite)
    [0, 0, 0, 1, ''], // brut
    [0, 4, 0, 1, ''], // exBrut
    [0, 0, 3, 1, ''], // calcBrut
  ];
  const xfs = X.map(([n, f, fi, b, al]) => {
    const attrs = `numFmtId="${n}" fontId="${f}" fillId="${fi}" borderId="${b}" xfId="0"`
      + (n ? ' applyNumberFormat="1"' : '') + (f ? ' applyFont="1"' : '') + (fi ? ' applyFill="1"' : '')
      + (b ? ' applyBorder="1"' : '') + (al ? ' applyAlignment="1"' : '');
    return al ? `<xf ${attrs}>${al}</xf>` : `<xf ${attrs}/>`;
  });
  // Formats conditionnels: 0 = deux décimales quand le montant en a (livre,
  // euro, dollar), sinon on reste sans décimales (FCFA, naira…) — la même
  // colonne sert à toutes les monnaies; 1 = alerte; 2 = juste.
  const dxfs = [
    '<dxf><numFmt numFmtId="165" formatCode="#,##0.00"/></dxf>',
    '<dxf><font><b/><color rgb="FF9B2C2C"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFFDEDED"/></patternFill></fill></dxf>',
    '<dxf><font><b/><color rgb="FF1E6B5C"/></font><fill><patternFill patternType="solid"><bgColor rgb="FFEAF6EA"/></patternFill></fill></dxf>',
  ];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts>
<fonts count="${fonts.length}">${fonts.join('')}</fonts>
<fills count="${fills.length}">${fills.join('')}</fills>
<borders count="${borders.length}">${borders.join('')}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="${dxfs.length}">${dxfs.join('')}</dxfs>
</styleSheet>`;
}

// ---------------------------------------------------------------------------
// Cellules et feuilles
// ---------------------------------------------------------------------------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function lettre(n) {
  // 0 → A, 25 → Z, 26 → AA
  let s = '';
  let x = n + 1;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function serieDate([a, m, j]) {
  return (Date.UTC(a, m - 1, j) - Date.UTC(1899, 11, 30)) / 86400000;
}

// Une cellule: { v: nombre | texte, f: formule, cache: valeur calculée, s: style }
function celluleXml(ref, c) {
  const s = c.s ? ` s="${c.s}"` : '';
  if (c.f !== undefined) {
    if (c.cache === undefined) return `<c r="${ref}"${s}><f>${esc(c.f)}</f></c>`;
    if (typeof c.cache === 'number') return `<c r="${ref}"${s}><f>${esc(c.f)}</f><v>${c.cache}</v></c>`;
    return `<c r="${ref}"${s} t="str"><f>${esc(c.f)}</f><v>${esc(c.cache)}</v></c>`;
  }
  if (c.v === undefined || c.v === null || c.v === '') return c.s ? `<c r="${ref}"${s}/>` : '';
  if (typeof c.v === 'number') return `<c r="${ref}"${s}><v>${c.v}</v></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`;
}

class Feuille {
  constructor(nom, { onglet } = {}) {
    this.nom = nom;
    this.onglet = onglet;
    this.lignes = new Map(); // numéro de ligne (1…) → Map(colonne → cellule)
    this.hauteurs = new Map();
    this.largeurs = [];
    this.fige = 0; // lignes figées en haut
    this.condition = [];
    this.validations = [];
    this.paysage = true;
    this.fusions = [];
  }
  set(col, ligne, cellule) {
    if (!this.lignes.has(ligne)) this.lignes.set(ligne, new Map());
    this.lignes.get(ligne).set(col, cellule);
  }
  xml() {
    const numeros = [...this.lignes.keys()].sort((a, b) => a - b);
    const rows = numeros.map((n) => {
      const cells = [...this.lignes.get(n).entries()].sort((a, b) => a[0] - b[0])
        .map(([col, c]) => celluleXml(`${lettre(col)}${n}`, c)).join('');
      const h = this.hauteurs.get(n);
      return `<row r="${n}"${h ? ` ht="${h}" customHeight="1"` : ''}>${cells}</row>`;
    }).join('');
    const cols = this.largeurs.length
      ? `<cols>${this.largeurs.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
      : '';
    const vue = this.fige
      ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${this.fige}" topLeftCell="A${this.fige + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${this.fige + 1}" sqref="A${this.fige + 1}"/></sheetView></sheetViews>`
      : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
    let prio = 1;
    const cf = this.condition.map(({ sqref, regles }) =>
      `<conditionalFormatting sqref="${sqref}">${regles.map(({ f, dxf }) => `<cfRule type="expression" dxfId="${dxf}" priority="${prio++}"><formula>${esc(f)}</formula></cfRule>`).join('')}</conditionalFormatting>`).join('');
    const dv = this.validations.length
      ? `<dataValidations count="${this.validations.length}">${this.validations.map(({ sqref, liste }) =>
        `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="0" sqref="${sqref}"><formula1>${esc(liste)}</formula1></dataValidation>`).join('')}</dataValidations>`
      : '';
    const fusions = this.fusions.length
      ? `<mergeCells count="${this.fusions.length}">${this.fusions.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
      : '';
    const sheetPr = `<sheetPr>${this.onglet ? `<tabColor rgb="${this.onglet}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${sheetPr}${vue}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows}</sheetData>${fusions}${cf}${dv}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup orientation="${this.paysage ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  }
}

// Référence à une colonne entière d'une autre feuille: 'Ventes du jour'!$E:$E
const q = (nom) => (/^[A-Za-z0-9_]+$/.test(nom) ? nom : `'${nom.replace(/'/g, "''")}'`);
const colonne = (feuille, col) => `${q(feuille)}!$${col}:$${col}`;

// ---------------------------------------------------------------------------
// Le classeur
// ---------------------------------------------------------------------------

function construire(T) {
  const F = T.feuilles;
  const ex = T.art.exemples;
  const dEx = serieDate(DATE_EXEMPLE);

  // Valeurs d'exemple calculées ici, pour les mettre en cache dans le
  // fichier: un aperçu qui ne recalcule pas (aperçu d'iPhone, pièce jointe
  // WhatsApp, import d'Accounting) montre alors les bons chiffres.
  const ventesEx = T.ven.exemples.map((v) => {
    const a = ex[v.article];
    const total = v.qte * a.vente;
    const cout = v.qte * a.achat;
    return { ...v, a, prix: a.vente, total, cout, marge: total - cout };
  });
  const entEx = (() => {
    const e = T.ent.exemple;
    const a = ex[e.article];
    return { ...e, a, prix: a.achat, total: e.qte * a.achat };
  })();
  const stockEx = ex.map((a) => {
    const entrees = entEx.a === a ? entEx.qte : 0;
    const sorties = ventesEx.filter((v) => v.a === a).reduce((s, v) => s + v.qte, 0);
    return a.depart + entrees - sorties;
  });
  const especesEx = ventesEx.filter((v) => v.paiement === 0).reduce((s, v) => s + v.total, 0);
  const mobileEx = ventesEx.filter((v) => v.paiement === 1).reduce((s, v) => s + v.total, 0);

  // ---- Articles ------------------------------------------------------------
  const art = new Feuille(F.art, { onglet: C.terracotta });
  art.fige = 1;
  art.largeurs = [13, 34, 16, 14, 14, 10, 14, 13, 14, 15, 15, 3, 16, 16];
  art.hauteurs.set(1, 32);
  T.art.cols.forEach((t, i) => art.set(i, 1, { v: t, s: S.entete }));
  art.set(12, 1, { v: T.art.maMonnaie, s: S.monnaieLabel });
  art.set(13, 1, { v: '', s: S.monnaieCase }); // VIDE: aucune monnaie supposée
  T.art.aide.forEach((t, i) => art.set(12, 3 + i, { v: t, s: i === 0 ? S.aideTitre : S.aide }));

  const E = F.ent;
  const V = F.ven;
  for (let r = 2; r <= N_ARTICLES + 1; r += 1) {
    const e = ex[r - 2];
    const k = e ? r - 2 : -1;
    const t = (v, s, sEx) => (e ? { v, s: sEx } : { s });
    art.set(0, r, t(e?.ref, S.texte, S.exTexte));
    art.set(1, r, t(e?.nom, S.texte, S.exTexte));
    art.set(2, r, t(e?.cat, S.texte, S.exTexte));
    // Prix et stock en format « Standard », SANS séparateur de milliers:
    // l'import d'Accounting lit le texte affiché, et y remplace la virgule
    // par un point — « 1,500 » y deviendrait 1,5. « 1500 » passe tel quel.
    art.set(3, r, t(e?.achat, S.brut, S.exBrut));
    art.set(4, r, t(e?.vente, S.brut, S.exBrut));
    art.set(5, r, {
      f: `IF(B${r}="","",G${r}+SUMIFS(${colonne(E, 'C')},${colonne(E, 'B')},B${r})-SUMIFS(${colonne(V, 'C')},${colonne(V, 'B')},B${r}))`,
      cache: e ? stockEx[k] : '',
      s: S.calcBrut,
    });
    art.set(6, r, t(e?.depart, S.entier, S.exEntier));
    art.set(7, r, t(e?.seuil, S.entier, S.exEntier));
    art.set(8, r, { f: `IF(OR(B${r}="",E${r}=""),"",E${r}-D${r})`, cache: e ? e.vente - e.achat : '', s: S.calcArgent });
    art.set(9, r, { f: `IF(B${r}="","",F${r}*D${r})`, cache: e ? stockEx[k] * e.achat : '', s: S.calcArgent });
    art.set(10, r, {
      f: `IF(OR(B${r}="",H${r}=""),"",IF(F${r}<=H${r},"${T.aCommander}","${T.ok}"))`,
      cache: e ? (stockEx[k] <= e.seuil ? T.aCommander : T.ok) : '',
      s: S.calcTexte,
    });
  }
  const finArt = N_ARTICLES + 1;
  art.condition.push({ sqref: `D2:E${finArt} I2:J${finArt}`, regles: [{ f: 'MOD(D2,1)<>0', dxf: 0 }] });
  art.condition.push({ sqref: `K2:K${finArt}`, regles: [{ f: `$K2="${T.aCommander}"`, dxf: 1 }, { f: `$K2="${T.ok}"`, dxf: 2 }] });

  const listeArticles = `${q(F.art)}!$B$2:$B$${finArt}`;
  const prixAchat = (r) => `IFERROR(INDEX(${colonne(F.art, 'D')},MATCH(B${r},${colonne(F.art, 'B')},0)),"")`;
  const prixVente = (r) => `IFERROR(INDEX(${colonne(F.art, 'E')},MATCH(B${r},${colonne(F.art, 'B')},0)),"")`;

  // En-tête commun des feuilles de saisie: titre, aide, titres de colonnes.
  const entete = (f, titre, aide, cols) => {
    f.fige = 3;
    f.set(0, 1, { v: titre, s: S.titre });
    f.hauteurs.set(1, 24);
    f.set(0, 2, { v: aide, s: S.note });
    f.fusions.push(`A2:${lettre(cols.length - 1)}2`);
    f.hauteurs.set(2, 44);
    cols.forEach((t, i) => f.set(i, 3, { v: t, s: S.entete }));
    f.hauteurs.set(3, 32);
  };

  // ---- Entrées de stock -----------------------------------------------------
  const ent = new Feuille(F.ent, { onglet: C.brass });
  ent.largeurs = [12, 34, 12, 15, 14, 24, 9, 30];
  entete(ent, T.ent.titre, T.ent.aide, T.ent.cols);
  for (let r = 4; r < 4 + N_ENTREES; r += 1) {
    const e = r === 4 ? entEx : null;
    ent.set(0, r, e ? { v: dEx, s: S.exDate } : { s: S.date });
    ent.set(1, r, e ? { v: e.a.nom, s: S.exTexte } : { s: S.texte });
    ent.set(2, r, e ? { v: e.qte, s: S.exEntier } : { s: S.entier });
    ent.set(3, r, { f: `IF(B${r}="","",${prixAchat(r)})`, cache: e ? e.prix : '', s: e ? S.exArgent : S.argent });
    ent.set(4, r, { f: `IF(OR(C${r}="",D${r}=""),"",C${r}*D${r})`, cache: e ? e.total : '', s: S.calcArgent });
    ent.set(5, r, e ? { v: e.fournisseur, s: S.exTexte } : { s: S.texte });
    ent.set(6, r, e ? { v: e.paye ? T.oui : T.non, s: S.exTexte } : { s: S.texte });
    ent.set(7, r, e ? { v: e.note, s: S.exTexte } : { s: S.texte });
  }
  const finEnt = 3 + N_ENTREES;
  ent.validations.push({ sqref: `B4:B${finEnt}`, liste: listeArticles });
  ent.validations.push({ sqref: `G4:G${finEnt}`, liste: `"${T.oui},${T.non}"` });
  ent.condition.push({ sqref: `D4:E${finEnt}`, regles: [{ f: 'MOD(D4,1)<>0', dxf: 0 }] });
  ent.condition.push({ sqref: `G4:G${finEnt}`, regles: [{ f: `$G4="${T.non}"`, dxf: 1 }] });

  // ---- Ventes du jour -------------------------------------------------------
  const ven = new Feuille(F.ven, { onglet: C.terracotta });
  ven.largeurs = [12, 34, 10, 13, 13, 15, 22, 12, 12, 26];
  entete(ven, T.ven.titre, T.ven.aide, T.ven.cols);
  for (let r = 4; r < 4 + N_VENTES; r += 1) {
    const e = ventesEx[r - 4];
    ven.set(0, r, e ? { v: dEx, s: S.exDate } : { s: S.date });
    ven.set(1, r, e ? { v: e.a.nom, s: S.exTexte } : { s: S.texte });
    ven.set(2, r, e ? { v: e.qte, s: S.exEntier } : { s: S.entier });
    ven.set(3, r, { f: `IF(B${r}="","",${prixVente(r)})`, cache: e ? e.prix : '', s: e ? S.exArgent : S.argent });
    ven.set(4, r, { f: `IF(OR(C${r}="",D${r}=""),"",C${r}*D${r})`, cache: e ? e.total : '', s: S.calcArgent });
    ven.set(5, r, e ? { v: T.paiements[e.paiement], s: S.exTexte } : { s: S.texte });
    ven.set(6, r, { s: e ? S.exTexte : S.texte });
    ven.set(7, r, { f: `IF(OR(B${r}="",C${r}=""),"",C${r}*${prixAchat(r).replace(/,""\)$/, ',0)')})`, cache: e ? e.cout : '', s: S.calcArgent });
    ven.set(8, r, { f: `IF(OR(E${r}="",H${r}=""),"",E${r}-H${r})`, cache: e ? e.marge : '', s: S.calcArgent });
    ven.set(9, r, e ? { v: e.note, s: S.exTexte } : { s: S.texte });
  }
  const finVen = 3 + N_VENTES;
  ven.validations.push({ sqref: `B4:B${finVen}`, liste: listeArticles });
  ven.validations.push({ sqref: `F4:F${finVen}`, liste: `"${T.paiements.join(',')}"` });
  ven.condition.push({ sqref: `D4:E${finVen} H4:I${finVen}`, regles: [{ f: 'MOD(D4,1)<>0', dxf: 0 }] });

  // ---- Caisse du jour -------------------------------------------------------
  const cai = new Feuille(F.cai, { onglet: C.brass });
  cai.largeurs = [12, 15, 14, 15, 14, 15, 15, 12, 22, 34];
  entete(cai, T.cai.titre, T.cai.aide, T.cai.cols);
  const ce = T.cai.exemple;
  const attenduEx = ce.fond + especesEx + ce.autres - ce.sorties;
  for (let r = 4; r < 4 + N_CAISSE; r += 1) {
    const e = r === 4;
    cai.set(0, r, e ? { v: dEx, s: S.exDate } : { s: S.date });
    cai.set(1, r, e ? { v: ce.fond, s: S.exArgent } : { s: S.argent });
    cai.set(2, r, {
      f: `IF(A${r}="","",SUMIFS(${colonne(V, 'E')},${colonne(V, 'A')},A${r},${colonne(V, 'F')},"${T.paiements[0]}"))`,
      cache: e ? especesEx : '',
      s: S.calcArgent,
    });
    cai.set(3, r, e ? { v: ce.autres, s: S.exArgent } : { s: S.argent });
    cai.set(4, r, e ? { v: ce.sorties, s: S.exArgent } : { s: S.argent });
    cai.set(5, r, { f: `IF(A${r}="","",N(B${r})+N(C${r})+N(D${r})-N(E${r}))`, cache: e ? attenduEx : '', s: S.calcArgent });
    cai.set(6, r, e ? { v: attenduEx + ce.ecart, s: S.exArgent } : { s: S.argent });
    cai.set(7, r, { f: `IF(OR(A${r}="",G${r}=""),"",G${r}-F${r})`, cache: e ? ce.ecart : '', s: S.calcArgent });
    cai.set(8, r, {
      f: `IF(A${r}="","",SUMIFS(${colonne(V, 'E')},${colonne(V, 'A')},A${r},${colonne(V, 'F')},"${T.paiements[1]}"))`,
      cache: e ? mobileEx : '',
      s: S.calcArgent,
    });
    cai.set(9, r, e ? { v: ce.note, s: S.exTexte } : { s: S.texte });
  }
  const finCai = 3 + N_CAISSE;
  cai.condition.push({ sqref: `B4:I${finCai}`, regles: [{ f: 'MOD(B4,1)<>0', dxf: 0 }] });
  cai.condition.push({ sqref: `H4:H${finCai}`, regles: [{ f: 'AND(ISNUMBER($H4),$H4<>0)', dxf: 1 }, { f: 'AND(ISNUMBER($H4),$H4=0)', dxf: 2 }] });

  // ---- Récap ----------------------------------------------------------------
  const R = T.rec;
  const rec = new Feuille(F.rec, { onglet: C.ink });
  rec.paysage = false;
  rec.largeurs = [44, 20, 44];
  rec.set(0, 1, { v: R.titre, s: S.titre });
  rec.hauteurs.set(1, 24);
  rec.set(0, 2, { v: R.montantsEn, s: S.recLabel });
  rec.set(1, 2, { f: `IF(${q(F.art)}!$N$1="","${R.sansMonnaie}",${q(F.art)}!$N$1)`, cache: R.sansMonnaie, s: S.aideTitre });
  rec.set(0, 4, { v: R.jour, s: S.recLabel });
  rec.set(1, 4, { s: S.recDate });
  rec.set(2, 4, { v: R.jourAide, s: S.note });
  rec.set(0, 5, { v: R.jourAffiche, s: S.recLabel });
  rec.set(1, 5, { f: 'IF(B4="",TODAY(),B4)', s: S.recValeurDate });

  const jour = '$B$5';
  const debutMois = `">="&(EOMONTH(${jour},-1)+1)`;
  const finMois = `"<="&EOMONTH(${jour},0)`;
  let r = 7;
  const section = (t) => { rec.set(0, r, { v: t, s: S.recSection }); rec.hauteurs.set(r, 20); r += 1; };
  const ligne = (label, f, s = S.recValeur, aide) => {
    rec.set(0, r, { v: label, s: S.recLabel });
    rec.set(1, r, { f, s });
    if (aide) rec.set(2, r, { v: aide, s: S.note });
    r += 1;
  };
  section(R.sJour);
  ligne(R.ventesJour, `SUMIFS(${colonne(V, 'E')},${colonne(V, 'A')},${jour})`);
  T.paiements.forEach((p) => ligne(`   ${R.dont} ${p}`, `SUMIFS(${colonne(V, 'E')},${colonne(V, 'A')},${jour},${colonne(V, 'F')},"${p}")`));
  ligne(R.margeJour, `SUMIFS(${colonne(V, 'I')},${colonne(V, 'A')},${jour})`);
  ligne(R.ecartJour, `IFERROR(INDEX(${colonne(F.cai, 'H')},MATCH(${jour},${colonne(F.cai, 'A')},0)),"")`, S.recValeur, R.ecartAide);
  r += 1;
  section(R.sMois);
  ligne(R.ventesMois, `SUMIFS(${colonne(V, 'E')},${colonne(V, 'A')},${debutMois},${colonne(V, 'A')},${finMois})`);
  ligne(R.margeMois, `SUMIFS(${colonne(V, 'I')},${colonne(V, 'A')},${debutMois},${colonne(V, 'A')},${finMois})`);
  ligne(R.achatsMois, `SUMIFS(${colonne(E, 'E')},${colonne(E, 'A')},${debutMois},${colonne(E, 'A')},${finMois})`);
  ligne(R.ecartsMois, `SUMIFS(${colonne(F.cai, 'H')},${colonne(F.cai, 'A')},${debutMois},${colonne(F.cai, 'A')},${finMois})`);
  r += 1;
  section(R.sStock);
  ligne(R.valeurStock, `SUM(${q(F.art)}!$J$2:$J$${finArt})`);
  ligne(R.nbCommander, `COUNTIF(${q(F.art)}!$K$2:$K$${finArt},"${T.aCommander}")`, S.recEntier);
  ligne(R.dette, `SUMIFS(${colonne(E, 'E')},${colonne(E, 'G')},"${T.non}")`);
  const finRec = r - 1;
  rec.condition.push({ sqref: `B8:B${finRec}`, regles: [{ f: 'MOD(B8,1)<>0', dxf: 0 }] });
  r += 1;
  rec.set(0, r, { v: R.suite, s: S.note });
  rec.fusions.push(`A${r}:C${r}`);
  rec.hauteurs.set(r, 32);

  return [art, ent, ven, cai, rec];
}

// ---------------------------------------------------------------------------
// L'archive
// ---------------------------------------------------------------------------

function classeurXml(feuilles, T) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${feuilles.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(T.titreDoc)}</dc:title><dc:creator>Finjaro</dc:creator></cp:coreProperties>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${feuilles.map((f, i) => `<sheet name="${esc(f.nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${feuilles.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${feuilles.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return [
    ['[Content_Types].xml', contentTypes],
    ['_rels/.rels', rels],
    ['docProps/core.xml', core],
    ['xl/workbook.xml', workbook],
    ['xl/_rels/workbook.xml.rels', wbRels],
    ['xl/styles.xml', stylesXml()],
    ...feuilles.map((f, i) => [`xl/worksheets/sheet${i + 1}.xml`, f.xml()]),
  ];
}

// Archive zip minimale (méthode « deflate »). Date fixe: deux générations du
// même contenu donnent le même fichier, octet pour octet — pas de faux
// changement dans git.
function zip(entrees) {
  const DOS_HEURE = 0;
  const DOS_DATE = ((2026 - 1980) << 9) | (9 << 5) | 1;
  const locaux = [];
  const centraux = [];
  let decalage = 0;
  for (const [nom, contenu] of entrees) {
    const nomBuf = Buffer.from(nom, 'utf8');
    const donnees = Buffer.from(contenu, 'utf8');
    const comprime = deflateRawSync(donnees, { level: 9 });
    const crc = crc32(donnees) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // noms en UTF-8
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(DOS_HEURE, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprime.length, 18);
    local.writeUInt32LE(donnees.length, 22);
    local.writeUInt16LE(nomBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locaux.push(local, nomBuf, comprime);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_HEURE, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprime.length, 20);
    central.writeUInt32LE(donnees.length, 24);
    central.writeUInt16LE(nomBuf.length, 28);
    central.writeUInt32LE(decalage, 42);
    centraux.push(central, nomBuf);
    decalage += 30 + nomBuf.length + comprime.length;
  }
  const tailleCentral = centraux.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(entrees.length, 8);
  fin.writeUInt16LE(entrees.length, 10);
  fin.writeUInt32LE(tailleCentral, 12);
  fin.writeUInt32LE(decalage, 16);
  return Buffer.concat([...locaux, ...centraux, fin]);
}

mkdirSync(SORTIE, { recursive: true });
for (const T of Object.values(TEXTES)) {
  const feuilles = construire(T);
  const chemin = join(SORTIE, T.fichier);
  const octets = zip(classeurXml(feuilles, T));
  writeFileSync(chemin, octets);
  console.log(`${chemin} — ${(octets.length / 1024).toFixed(0)} Ko`);
}
