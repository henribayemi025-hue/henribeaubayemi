// Rendu image par image de compose.html → MP4 1080x1920 @30fps.
// Toutes les animations CSS sont mises en pause puis pilotées frame par
// frame via l'API Web Animations (currentTime), donc aucune image sautée
// quel que soit le temps de capture. Les JPEG partent directement dans
// ffmpeg par stdin — rien n'est écrit sur le disque.
import { chromium } from 'playwright';
import { spawn } from 'child_process';

// Usage: node render.mjs [compose.html] [durée en s] [sortie.mp4]
const FPS = 30;
const PAGE = process.argv[2] || '/home/user/henribeaubayemi/video-work/compose.html';
const DURATION = Number(process.argv[3]) || 45; // secondes
const TOTAL = FPS * DURATION;
const OUT = process.argv[4] || '/home/user/henribeaubayemi/video-work/finjaro-vendeuse.mp4';

const ffmpeg = spawn('ffmpeg', [
  '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT,
], { stdio: ['pipe', 'ignore', 'inherit'] });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + PAGE);
await page.waitForLoadState('networkidle');
// Attendre le décodage complet des captures (grosses images).
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
});
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));

const t0 = Date.now();
for (let i = 0; i < TOTAL; i++) {
  const ms = (i / FPS) * 1000;
  await page.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t; }), ms);
  const buf = await page.screenshot({ type: 'jpeg', quality: 88 });
  await new Promise((res, rej) => ffmpeg.stdin.write(buf, (e) => (e ? rej(e) : res())));
  if (i % 150 === 0) {
    const el = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`frame ${i}/${TOTAL} (${el}s écoulées)`);
  }
}
ffmpeg.stdin.end();
await new Promise((res) => ffmpeg.on('close', res));
await browser.close();
console.log('VIDEO PRÊTE:', OUT);
