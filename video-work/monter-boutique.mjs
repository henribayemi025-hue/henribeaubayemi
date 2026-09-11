// Assemblage de « Ouvrir sa boutique »: carte d'intro, puis pour chaque
// chapitre le fond titré avec la capture posée dedans (coins arrondis), puis
// la carte de fin. Tout en 1080x1920, 30 i/s, mêmes réglages d'encodage pour
// que la concaténation passe sans réencoder.
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const FF = '/home/user/henribeaubayemi/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';
const SC = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad';
const V = '/home/user/henribeaubayemi/video-work';
const ff = (args) => execFileSync(FF, ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-vsync', 'cfr', '-an'];
// Même valeur que dans cartes-boutique.mjs (recopiée: importer ce fichier
// relancerait le dessin des cartes).
const TEL = { x: 180, y: 250, w: 720, h: 1558, r: 54 };

const chap = JSON.parse(readFileSync(`${SC}/chapitres.json`, 'utf8'));
const trames = JSON.parse(readFileSync(`${SC}/trames.json`, 'utf8'));

// 0) La capture est une suite d'images horodatées (screencast): on la
// remonte en MP4 à cadence fixe avec le démultiplexeur « concat », chaque
// image tenue jusqu'à la suivante — le temps de la vidéo est donc celui de
// l'enregistrement, et les marques de chapitres tombent juste.
const finT = chap[chap.length - 1].t;
const lignes = [];
for (let i = 0; i < trames.length; i++) {
  const d = (i + 1 < trames.length ? trames[i + 1].t : finT) - trames[i].t;
  lignes.push(`file '${trames[i].f}'`, `duration ${Math.max(d, 0.001).toFixed(4)}`);
}
lignes.push(`file '${trames[trames.length - 1].f}'`);
writeFileSync(`${SC}/trames.txt`, lignes.join('\n'));
const REC = `${SC}/rec-boutique.mp4`;
ff(['-f', 'concat', '-safe', '0', '-i', `${SC}/trames.txt`, '-vf', `scale=${TEL.w}:${TEL.h}:flags=lanczos`, ...ENC, REC]);
console.log('capture remontée:', REC);

// Un chapitre = de sa marque à la marque suivante. Le premier (« accueil »)
// et le dernier (« espace ») gardent leur fond « sans numéro d'étape ».
const morceaux = [];
for (let i = 0; i < chap.length - 1; i++) {
  const c = chap[i], suiv = chap[i + 1];
  morceaux.push({ k: c.nom, ss: c.t, d: suiv.t - c.t });
}

const liste = [];
// Intro: 3,4 s, fondu d'entrée.
ff(['-loop', '1', '-i', `${SC}/carte-intro.png`, '-t', '3.4', '-vf', 'fade=t=in:st=0:d=0.5:color=0xFAF6F0,fade=t=out:st=3.0:d=0.4:color=0xFAF6F0', ...ENC, `${SC}/b-intro.mp4`]);
liste.push(`${SC}/b-intro.mp4`);

for (const m of morceaux) {
  const out = `${SC}/b-${m.k}.mp4`;
  // [0] fond titré (image fixe), [1] capture, [2] masque arrondi.
  // La capture est réduite à la taille du téléphone du fond, arrondie par le
  // masque, posée à sa place. Un fondu court en tête et en queue de chaque
  // chapitre évite les coupes sèches.
  const fin = Math.max(m.d - 0.35, 0.1);
  ff([
    '-loop', '1', '-i', `${SC}/fond-${m.k}.png`,
    '-ss', String(m.ss), '-t', String(m.d), '-i', REC,
    '-loop', '1', '-i', `${SC}/masque-tel.png`,
    '-filter_complex',
    `[1:v]scale=${TEL.w}:${TEL.h}:flags=lanczos,format=rgba[t];[t][2:v]alphamerge[tm];` +
    `[0:v][tm]overlay=${TEL.x}:${TEL.y}:shortest=1,fade=t=in:st=0:d=0.3:color=0xFAF6F0,fade=t=out:st=${fin.toFixed(2)}:d=0.3:color=0xFAF6F0[v]`,
    '-map', '[v]', '-t', String(m.d), ...ENC, out,
  ]);
  liste.push(out);
  console.log(`chapitre ${m.k.padEnd(13)} ${m.ss.toFixed(1)}s → ${m.d.toFixed(1)}s`);
}

// Fin: 4,6 s.
ff(['-loop', '1', '-i', `${SC}/carte-fin.png`, '-t', '4.6', '-vf', 'fade=t=in:st=0:d=0.5:color=0xFAF6F0', ...ENC, `${SC}/b-fin.mp4`]);
liste.push(`${SC}/b-fin.mp4`);

writeFileSync(`${SC}/liste-boutique.txt`, liste.map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', `${SC}/liste-boutique.txt`, '-c', 'copy', `${V}/finjaro-ouvrir-sa-boutique.mp4`]);
console.log('MONTÉ:', `${V}/finjaro-ouvrir-sa-boutique.mp4`);
