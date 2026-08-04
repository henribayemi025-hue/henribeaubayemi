import { chromium } from 'playwright';
const times = [2.5, 7, 9.5, 13, 16.5, 20, 24, 27.5, 31.6, 33, 37, 43];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file:///home/user/henribeaubayemi/video-work/compose.html');
await page.waitForLoadState('networkidle');
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((im) => im.decode().catch(() => {}))); });
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
for (const t of times) {
  await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), t * 1000);
  await page.screenshot({ path: `/home/user/henribeaubayemi/video-work/prev-${t}.png` });
}
await browser.close();
console.log('previews ok');
