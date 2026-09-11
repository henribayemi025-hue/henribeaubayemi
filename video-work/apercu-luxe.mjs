// Aperçu: quelques images du montage à des instants choisis, en planche.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
const ASSETS='/home/user/henribeaubayemi/video-work/assets';
const srv=createServer((q,s)=>{const p=join(ASSETS,decodeURIComponent(q.url.split('?')[0]));if(!existsSync(p)){s.writeHead(404);return s.end();}s.writeHead(200,{'access-control-allow-origin':'*'});s.end(readFileSync(p));});
await new Promise(r=>srv.listen(4790,r));
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await br.newPage({viewport:{width:600,height:1000}});
pg.on('console',m=>{ if(m.type()!=='log') console.log('console:',m.text()); });
await pg.goto('file:///home/user/henribeaubayemi/video-work/reel-luxe.html',{waitUntil:'domcontentloaded'});
await pg.waitForFunction(()=>!document.getElementById('go').disabled,{timeout:120000});
console.log(await pg.evaluate(()=>document.getElementById('etat').textContent));
const T=process.argv.slice(2).map(Number);
const frames=[];
for(const t of T){
  const b64=await pg.evaluate((t)=>{const [p,u]=planA(t);dessine(p,u);return document.getElementById('c').toDataURL('image/jpeg',.85).split(',')[1];},t);
  frames.push(b64);
}
// planche 4 colonnes
const html=`<style>body{margin:0;background:#222}.g{display:grid;grid-template-columns:repeat(4,270px);gap:8px;padding:8px}img{width:270px;height:480px;display:block}.l{color:#ccc;font:12px sans-serif;padding:2px 0}</style><div class="g">`+frames.map((f,i)=>`<div><img src="data:image/jpeg;base64,${f}"><div class="l">t=${T[i]}s</div></div>`).join('')+`</div>`;
const p2=await br.newPage({viewport:{width:4*278+8,height:1000}}); await p2.setContent(html); await p2.waitForTimeout(500);
await p2.screenshot({path:process.env.OUT||'/tmp/apercu.png',fullPage:true});
await br.close(); srv.close(); console.log('aperçu écrit');
