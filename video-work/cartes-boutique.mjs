// Les cartes de la vidéo « Ouvrir sa boutique »: intro, fin, un fond par
// chapitre (titre en haut, place du téléphone en dessous), le masque aux
// coins arrondis, et les deux images neutres envoyées pendant le parcours
// (bannière et logo de la boutique fictive).
//
// Même langage que « La sélection »: crème, Fraunces, un filet laiton, de
// l'air. Tout est dessiné ici, rien n'est pris ailleurs.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SC = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad';
const W = 1080, H = 1920;
// Le téléphone dans la carte: 390x844 x1.846 = 720x1558, posé à y=250.
export const TEL = { x: 180, y: 250, w: 720, h: 1558, r: 54 };

const CHAPITRES = [
  { k: 'accueil',      n: '',        t: 'Finjaro, côté cliente',     s: 'Les boutiques, les pièces, les prix.' },
  { k: 'compte',       n: 'ÉTAPE 1', t: 'Créer son compte',          s: 'Un nom, un numéro, un mot de passe.' },
  { k: 'ouvrir',       n: 'ÉTAPE 2', t: 'Ouvrir sa boutique',        s: 'Depuis le profil, en un geste.' },
  { k: 'boutique',     n: 'ÉTAPE 3', t: 'La nommer',                 s: 'Son nom, sa ville, ses rayons.' },
  { k: 'identite',     n: 'ÉTAPE 4', t: 'Se présenter',              s: 'Facultatif. Tout se complète plus tard.' },
  { k: 'presentation', n: 'ÉTAPE 5', t: 'L’habiller',            s: 'Une bannière, un logo, quelques mots.' },
  { k: 'validation',   n: 'ÉTAPE 6', t: 'Valider',                   s: 'Relire, accepter, envoyer.' },
  { k: 'espace',       n: '',        t: 'La boutique est ouverte',   s: 'Il ne reste qu’à publier la première pièce.' },
  { k: 'article',      n: 'ÉTAPE 7', t: 'Publier sa première pièce', s: 'Un nom, un rayon, un prix, une photo.' },
  { k: 'publie',       n: '',        t: 'Elle est en ligne',         s: 'Visible par toutes les clientes, tout de suite.' },
];

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: W, height: H } });
await pg.setContent(`<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<canvas id="c" width="${W}" height="${H}"></canvas><style>body{margin:0}</style>`);
await pg.waitForTimeout(2500);
await pg.evaluate(() => document.fonts.ready);

const png = async (fn, arg) => Buffer.from(await pg.evaluate(fn, arg), 'base64');
const CST = { W, H, TEL };

// Fond de chapitre: crème, titre, ombre douce sous la place du téléphone.
for (const ch of CHAPITRES) {
  const b = await png(({ ch, C }) => {
    const { W, H, TEL } = C;
    const g = document.getElementById('c').getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
    // ombre portée sous le téléphone
    g.save(); g.shadowColor = 'rgba(23,27,38,.26)'; g.shadowBlur = 70; g.shadowOffsetY = 30;
    g.fillStyle = '#FAF6F0'; g.beginPath(); g.roundRect(TEL.x, TEL.y, TEL.w, TEL.h, TEL.r); g.fill(); g.restore();
    // titre
    const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = '#9A7A3E';
    if (ch.n) esp(ch.n, '600 22px Inter, sans-serif', 7, W / 2, 96);
    else esp('FINJARO', '600 22px Inter, sans-serif', 7, W / 2, 96);
    g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 66px Fraunces, Georgia, serif';
    g.fillText(ch.t, W / 2, 168);
    g.fillStyle = '#8A7D6B'; g.font = '400 30px Fraunces, Georgia, serif';
    g.fillText(ch.s, W / 2, 216);
    // marque en bas
    g.fillStyle = '#9A7A3E'; g.textAlign = 'left';
    esp('FINJARO.NET', '600 20px Inter, sans-serif', 6, W / 2, H - 62);
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, { ch, C: CST });
  writeFileSync(`${SC}/fond-${ch.k}.png`, b);
}

// Masque du téléphone (blanc = visible), coins arrondis.
writeFileSync(`${SC}/masque-tel.png`, await png(({ C }) => {
  const { TEL } = C; const cv = document.getElementById('c'); cv.width = TEL.w; cv.height = TEL.h;
  const g = cv.getContext('2d'); g.clearRect(0, 0, TEL.w, TEL.h);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, TEL.w, TEL.h, TEL.r); g.fill();
  const out = cv.toDataURL('image/png').split(',')[1]; cv.width = C.W; cv.height = C.H; return out;
}, { C: CST }));

// Intro et fin: mêmes mots que la vidéo « La sélection ».
const carte = async (nom, dessin) => writeFileSync(`${SC}/${nom}.png`, await png(dessin, CST));
await carte('carte-intro', ({ W, H }) => {
  const g = document.getElementById('c').getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
  const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
  g.textAlign = 'left'; g.fillStyle = '#9A7A3E'; esp('FINJARO', '600 28px Inter, sans-serif', 9, W / 2, 740);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 60, 800); g.lineTo(W / 2 + 60, 800); g.stroke();
  g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 118px Fraunces, Georgia, serif';
  g.fillText('Ouvrir sa boutique', W / 2, 980);
  g.fillStyle = '#8A7D6B'; g.font = '400 40px Fraunces, Georgia, serif';
  g.fillText('En quelques minutes. Gratuit.', W / 2, 1068);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});
await carte('carte-fin', ({ W, H }) => {
  const g = document.getElementById('c').getContext('2d'); g.clearRect(0, 0, W, H);
  g.fillStyle = '#FAF6F0'; g.fillRect(0, 0, W, H);
  const esp = (txt, police, e, x, y) => { g.font = police; let tw = 0; for (const c of txt) tw += g.measureText(c).width + e; tw -= e; let cx = x - tw / 2; for (const c of txt) { g.fillText(c, cx, y); cx += g.measureText(c).width + e; } };
  g.textAlign = 'left'; g.fillStyle = '#9A7A3E'; esp('FINJARO', '600 28px Inter, sans-serif', 9, W / 2, 760);
  g.textAlign = 'center'; g.fillStyle = '#171B26'; g.font = '500 96px Fraunces, Georgia, serif';
  g.fillText('Votre boutique,', W / 2, 930); g.fillText('ouverte au monde.', W / 2, 1046);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 60, 1120); g.lineTo(W / 2 + 60, 1120); g.stroke();
  g.fillStyle = '#C25E38'; g.font = '500 54px Fraunces, Georgia, serif'; g.fillText('finjaro.net', W / 2, 1220);
  g.fillStyle = '#8A7D6B'; g.font = '400 40px Fraunces, Georgia, serif'; g.fillText('Ouvrir sa boutique est gratuit.', W / 2, 1298);
  // Les pièces montrées appartiennent à de vraies boutiques: on le dit.
  g.fillStyle = '#9A7A3E'; g.font = '500 22px Inter, sans-serif';
  g.fillText('Pièces montrées : Artisanat de rêve · SM Store & Beauty · Nemalia cosmetics', W / 2, 1720);
  g.fillText('MTGBA Market Place · Luxus Beauty', W / 2, 1756);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});

// Bannière (1200x600) et logo (600x600) de la boutique fictive: un monogramme
// sur crème — pas la photo d'une vraie boutique.
writeFileSync(`${SC}/boutique-banniere.png`, await png(() => {
  const cv = document.getElementById('c'); cv.width = 1200; cv.height = 600; const g = cv.getContext('2d');
  g.fillStyle = '#F3ECE1'; g.fillRect(0, 0, 1200, 600);
  g.strokeStyle = '#C9A96A'; g.lineWidth = 3; g.strokeRect(40, 40, 1120, 520);
  g.fillStyle = '#171B26'; g.textAlign = 'center'; g.font = '500 150px Fraunces, Georgia, serif'; g.fillText('Chez Aïcha', 600, 350);
  const out = cv.toDataURL('image/png').split(',')[1]; cv.width = 1080; cv.height = 1920; return out;
}));
writeFileSync(`${SC}/boutique-logo.png`, await png(() => {
  const cv = document.getElementById('c'); cv.width = 600; cv.height = 600; const g = cv.getContext('2d');
  g.fillStyle = '#C25E38'; g.fillRect(0, 0, 600, 600);
  g.fillStyle = '#FAF6F0'; g.textAlign = 'center'; g.font = '600 340px Fraunces, Georgia, serif'; g.fillText('A', 300, 420);
  const out = cv.toDataURL('image/png').split(',')[1]; cv.width = 1080; cv.height = 1920; return out;
}));

await br.close();
console.log('cartes écrites dans', SC);
