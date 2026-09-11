// Planche-contact: node planche.mjs liste.json sortie.png  — liste = [{i, l}]
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
const ASSETS='/home/user/henribeaubayemi/video-work/assets';
const items = JSON.parse(readFileSync(process.argv[2],'utf8'));
const srv = createServer((q,s)=>{ const p=join(ASSETS,decodeURIComponent(q.url.split('?')[0])); if(!existsSync(p)){s.writeHead(404);return s.end();} s.writeHead(200,{'access-control-allow-origin':'*'}); s.end(readFileSync(p)); });
await new Promise(r=>srv.listen(4795,r));
const COLS=5, T=300;
const html = `<style>body{margin:0;background:#222;font:12px sans-serif;color:#eee}.g{display:grid;grid-template-columns:repeat(${COLS},${T}px);gap:6px;padding:6px}.c{background:#000;height:${T+34}px;overflow:hidden}.c img{width:${T}px;height:${T}px;object-fit:contain;background:#111;display:block}.c div{padding:3px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style><div class="g">`+
 items.map((it,n)=>`<div class="c"><img src="http://127.0.0.1:4795/${it.i}"><div>${n}. ${it.l}</div></div>`).join('')+`</div>`;
const br = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport:{ width: COLS*(T+6)+6, height: 800 } });
await pg.setContent(html); await pg.waitForTimeout(2500);
await pg.screenshot({ path: process.argv[3], fullPage: true });
await br.close(); srv.close(); console.log('planche:', process.argv[3]);
