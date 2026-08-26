// Rendu du reel des boutiques en VRAI fichier MP4, image par image.
//
// Beau: « je veux la vidéo ». Le voici servi: on reutilise le dessin canvas
// de reel-boutiques.html, mais au lieu de MediaRecorder (temps reel, fragile)
// on pilote la timeline NOUS-MEMES frame par frame — aucune image sautee,
// quel que soit le temps de rendu — et on pousse chaque frame dans ffmpeg.
//
// Les photos ont ete rapatriees par la base de donnees (extension http de
// Postgres) car le reseau de la session bloque le stockage en direct.
// Usage: node render-reel.mjs <data.json> <sortie.mp4> [duree_photo] [duree_carte] [intro] [outro]
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const FPS = 30;
const DATA_PATH = process.argv[2];
const OUT = process.argv[3];
const T_PHOTO = Number(process.argv[4] ?? 1.9);
const T_CARTE = Number(process.argv[5] ?? 2.4);
const T_INTRO = Number(process.argv[6] ?? 4.6);
const T_OUTRO = Number(process.argv[7] ?? 5.4);

const ASSETS = '/home/user/henribeaubayemi/video-work/assets';
const srv = createServer((req, res) => {
  const p = join(ASSETS, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  // Sans cet en-tete, la page recharge les photos sans CORS, le canvas est
  // « sali », et toDataURL est refuse — c'est exactement le garde-fou que la
  // page elle-meme affiche. Constate: la premiere passe s'est arretee a la
  // fin de l'intro (3,5 s), premiere frame qui touche une photo.
  res.writeHead(200, { 'content-type': p.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
    'access-control-allow-origin': '*' });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(4790, r));

// Page de rendu: le html public, avec les photos servies en local et les
// durees injectees. On retire la partie MediaRecorder (inutile ici).
let html = readFileSync('/home/user/henribeaubayemi/video-work/reel-boutiques.html', 'utf8');
html = html
  .replace(/const BASE = '[^']+';/, "const BASE = 'http://127.0.0.1:4790/';")
  .replace(/const DATA = \[[\s\S]*?\];\n/, 'const DATA = ' + readFileSync(DATA_PATH, 'utf8') + ';\n')
  .replace(/const T_INTRO = [^;]+;/, `const T_INTRO = ${T_INTRO}, T_CARTE = ${T_CARTE}, T_PHOTO = ${T_PHOTO}, T_OUTRO = ${T_OUTRO};`);
const TMP = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad/render-page.html';
writeFileSync(TMP, html);

const ffmpeg = spawn('/home/user/henribeaubayemi/node_modules/@ffmpeg-installer/linux-x64/ffmpeg', [
  '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT,
], { stdio: ['pipe', 'ignore', 'inherit'] });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 2000 } });
await page.goto('file://' + TMP, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.getElementById('go').disabled, { timeout: 180000 });
const charge = await page.evaluate(() => ({ etat: document.getElementById('etat').textContent, total: TOTAL }));
console.log(charge.etat, '| montage:', charge.total.toFixed(1), 's');

const FRAMES = Math.round(charge.total * FPS);
const t0 = Date.now();
for (let i = 0; i < FRAMES; i++) {
  const b64 = await page.evaluate((t) => {
    const [p, u] = planA(t);
    dessine(p, u);
    return document.getElementById('c').toDataURL('image/jpeg', 0.9).split(',')[1];
  }, Math.min(i / FPS, charge.total - 0.001));
  const buf = Buffer.from(b64, 'base64');
  await new Promise((res, rej) => ffmpeg.stdin.write(buf, (e) => (e ? rej(e) : res())));
  if (i % 300 === 0) console.log(`frame ${i}/${FRAMES} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on('close', r));
await browser.close();
srv.close();
console.log('ECRIT:', OUT);
