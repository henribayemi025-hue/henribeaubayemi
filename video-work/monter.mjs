// Assemblage final: canvas + VRAIES videos + canvas.
//
// Beau: « ca n'a pas fait defiler les videos, c'est juste des images
// statiques ». Exact. Le chapitre « Les Fin » contient desormais les vraies
// videos publiees par les boutiques, decoupees au format 9:16, avec le
// bandeau de credit incruste — pas des captures.
//
// Le montage canvas s'arrete au plan « coupure », ffmpeg intercale les
// extraits, puis le canvas reprend. Les trois morceaux sont encodes avec les
// memes reglages, sinon la concatenation refuse.
import { spawn, execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const FF = '/home/user/henribeaubayemi/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';
const SC = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad';
const V = '/home/user/henribeaubayemi/video-work';
const ff = (args) => execFileSync(FF, ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });

// Reglages communs aux trois morceaux — obligatoire pour concatener.
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
  '-r', '30', '-vsync', 'cfr', '-an'];

// 1) Ou tombe la coupure dans le montage canvas ?
const page = readFileSync(`${V}/reel-v2.html`, 'utf8');
const { chromium } = await import('playwright');
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await nav.newPage();
await pg.goto('file://' + `${V}/reel-v2.html`, { waitUntil: 'domcontentloaded' });
await pg.waitForFunction(() => typeof TOTAL === 'number');
const t = await pg.evaluate(() => {
  let acc = 0, coupure = null;
  for (const p of plans) { if (p.type === 'coupure') { coupure = acc; break; } acc += p.d; }
  return { coupure, total: TOTAL };
});
await nav.close();
console.log(`coupure a ${t.coupure.toFixed(2)} s / total canvas ${t.total.toFixed(1)} s`);

// 2) Les extraits video, credites.
const CLIPS = [
  // Beau: « tu n'as pas pris les bonnes videos, tu as pris les vieilles qui
  // ne sont meme pas bien ». Exact — j'avais choisi les deux plus LEGERES
  // (1,7 et 8,5 Mo) parce qu'elles se telechargeaient d'une traite, pas les
  // meilleures. Les deux meilleures pesaient 30 et 19 Mo, d'ou leur abandon.
  // Recuperees par tranches de 8 Mo (requetes HTTP Range depuis la base,
  // status 206), puis recollees.
  //
  // Hegshair est recadree en haut du cadre: le bandeau musical de TikTok est
  // incruste en bas de sa video, et une pastille TikTok dans une publicite
  // Finjaro, ca n'a pas de sens. On coupe 160 px, la vendeuse reste centree.
  { f: `${SC}/reels/ngc.mov`, ss: 0.8, d: 2.6, crop: null,
    b: 'MAISON NGC · YAOUNDÉ', t: 'Robes, premier choix' },
  { f: `${SC}/reels/hegs-hd.mp4`, ss: 3.4, d: 3.0, crop: 'crop=720:1120:0:0',
    b: 'HEGSHAIR · STUTTGART', t: 'Mèches pour tissage' },
  { f: `${SC}/reels/ngc.mov`, ss: 8.4, d: 2.6, crop: null,
    b: 'MAISON NGC · YAOUNDÉ', t: 'Robes, premier choix' },
  { f: `${SC}/reels/hegs-hd.mp4`, ss: 17.0, d: 2.8, crop: 'crop=720:1120:0:0',
    b: 'HEGSHAIR · STUTTGART', t: 'Mèches pour tissage' },
  { f: `${SC}/reels/ngc.mov`, ss: 15.0, d: 2.4, crop: null,
    b: 'MAISON NGC · YAOUNDÉ', t: 'Robes, premier choix' },
];

// Le bandeau est dessine dans le navigateur (memes polices que le reste),
// exporte en PNG transparent, puis incruste par ffmpeg.
const nav2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg2 = await nav2.newPage({ viewport: { width: 1080, height: 1920 } });
await pg2.setContent(`<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@800&display=swap" rel="stylesheet">
<canvas id="c" width="1080" height="1920"></canvas><style>body{margin:0}</style>`);
await pg2.waitForTimeout(1500);
for (let i = 0; i < CLIPS.length; i++) {
  const png = await pg2.evaluate(({ b, t }) => {
    const g = document.getElementById('c').getContext('2d');
    g.clearRect(0, 0, 1080, 1920);
    const gr = g.createLinearGradient(0, 1920, 0, 1100);
    gr.addColorStop(0, 'rgba(14,11,9,.9)'); gr.addColorStop(1, 'rgba(14,11,9,0)');
    g.fillStyle = gr; g.fillRect(0, 1100, 1080, 820);
    g.font = '800 30px Inter, sans-serif';
    const w = g.measureText(b).width + 64;
    g.fillStyle = 'rgba(20,14,10,.55)';
    g.beginPath(); g.roundRect(60, 70, w, 74, 37); g.fill();
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(b, 92, 109);
    g.textBaseline = 'alphabetic';
    g.font = '600 68px Fraunces, Georgia, serif'; g.fillStyle = '#fff';
    g.fillText(t, 80, 1680);
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, CLIPS[i]);
  writeFileSync(`${SC}/ov-${i}.png`, Buffer.from(png, 'base64'));
}
await nav2.close();

for (let i = 0; i < CLIPS.length; i++) {
  const c = CLIPS[i];
  const chaine = [
    c.crop, 'scale=1080:1920:force_original_aspect_ratio=increase',
    'crop=1080:1920', 'setsar=1',
  ].filter(Boolean).join(',');
  ff(['-ss', String(c.ss), '-t', String(c.d), '-i', c.f, '-i', `${SC}/ov-${i}.png`,
    '-filter_complex', `[0:v]${chaine}[v];[v][1:v]overlay=0:0`, ...ENC, `${SC}/clip-${i}.mp4`]);
  console.log(`clip ${i} : ${c.b} ${c.d}s`);
}

// 3) Les deux morceaux de canvas.
const rendre = (from, to, out) => new Promise((res, rej) => {
  const p = spawn('node', [`${V}/render-v2.mjs`, `${V}/reel-v2.html`, out],
    { env: { ...process.env, PLAN_FROM: String(from), PLAN_TO: String(to) }, stdio: 'inherit' });
  p.on('close', (c) => (c === 0 ? res() : rej(new Error('rendu ' + c))));
});
await rendre(0, t.coupure, `${SC}/part1.mp4`);
await rendre(t.coupure, t.total, `${SC}/part2.mp4`);

// 4) Concatenation.
const liste = [`${SC}/part1.mp4`, ...CLIPS.map((_, i) => `${SC}/clip-${i}.mp4`), `${SC}/part2.mp4`];
writeFileSync(`${SC}/liste-concat.txt`, liste.map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', `${SC}/liste-concat.txt`, '-c', 'copy',
  `${V}/finjaro-top-boutiques.mp4`]);
console.log('MONTE:', `${V}/finjaro-top-boutiques.mp4`);
