// Aperçus fixes: capture la composition à des instants donnés.
import { chromium } from 'playwright';
const [page_, ...times] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + page_);
await page.waitForLoadState('networkidle');
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
});
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
const base = page_.replace(/.*\//, '').replace('.html', '');
for (const t of times) {
  await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), Number(t) * 1000);
  await page.screenshot({ path: `preview-${base}-${t}s.jpg`, type: 'jpeg', quality: 80 });
  console.log(`preview-${base}-${t}s.jpg`);
}
await browser.close();
