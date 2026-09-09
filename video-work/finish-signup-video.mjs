// Assemblage: capture réelle (webm) + carte de fin (canvas) → MP4 final.
import { execFileSync } from 'child_process';
import { writeFileSync, readdirSync } from 'fs';

const FF = '/home/user/henribeaubayemi/node_modules/@ffmpeg-installer/linux-x64/ffmpeg';
const SC = '/tmp/claude-0/-home-user-henribeaubayemi/46c5ddec-5d8e-5943-95aa-4e0c79f09944/scratchpad';
const V = '/home/user/henribeaubayemi/video-work';
const ff = (args) => execFileSync(FF, ['-y', ...args], { stdio: ['ignore', 'inherit', 'pipe'] });

const rec = readdirSync(`${SC}/rec`).find((f) => f.endsWith('.webm'));
const RAW = `${SC}/rec/${rec}`;

const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
  '-r', '30', '-vsync', 'cfr', '-an'];

// 1) Le webm capturé (540x960) monté à la résolution standard 1080x1920.
ff(['-i', RAW, '-vf', 'scale=1080:1920:flags=lanczos', ...ENC, `${SC}/part-signup.mp4`]);
console.log('part-signup.mp4 prêt');

// 2) Carte de fin — mêmes polices (Fraunces/Inter) que le reste des vidéos.
const { chromium } = await import('playwright');
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.setContent(`
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@500;800&display=swap" rel="stylesheet">
<canvas id="c" width="1080" height="1920"></canvas><style>body{margin:0}</style>`);
await pg.waitForTimeout(1500);
const png = await pg.evaluate(() => {
  const g = document.getElementById('c').getContext('2d');
  // Fond crème, exactement la teinte de l'app (--base), pas un dégradé inventé.
  g.fillStyle = '#FAF6EF';
  g.fillRect(0, 0, 1080, 1920);
  const gr = g.createRadialGradient(540, 700, 100, 540, 700, 900);
  gr.addColorStop(0, 'rgba(194,94,56,.10)');
  gr.addColorStop(1, 'rgba(194,94,56,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);

  g.textAlign = 'center';
  g.fillStyle = '#C25E38';
  g.font = '600 64px Fraunces, Georgia, serif';
  g.fillText('Finjaro', 540, 760);

  g.fillStyle = '#211B14';
  g.font = '600 84px Fraunces, Georgia, serif';
  g.fillText('Rejoins Finjaro.', 540, 920);

  g.fillStyle = '#5B5347';
  g.font = '500 42px Inter, sans-serif';
  g.fillText('Achète. Vends. Où que tu sois.', 540, 1010);

  g.fillStyle = '#8C6A3D';
  g.font = '800 46px Inter, sans-serif';
  g.fillText('finjaro.net', 540, 1150);

  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});
await nav.close();
writeFileSync(`${SC}/carte-fin.png`, Buffer.from(png, 'base64'));

// Image fixe tenue 3.2s, léger fondu d'entrée pour ne pas arriver en coupure sèche.
ff(['-loop', '1', '-i', `${SC}/carte-fin.png`, '-t', '3.2', '-vf', 'fade=t=in:st=0:d=0.4', ...ENC, `${SC}/part-fin.mp4`]);
console.log('part-fin.mp4 prêt');

// 3) Concaténation.
const liste = [`${SC}/part-signup.mp4`, `${SC}/part-fin.mp4`];
writeFileSync(`${SC}/liste-signup.txt`, liste.map((f) => `file '${f}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', `${SC}/liste-signup.txt`, '-c', 'copy',
  `${V}/finjaro-creer-un-compte.mp4`]);
console.log('MONTÉ:', `${V}/finjaro-creer-un-compte.mp4`);
