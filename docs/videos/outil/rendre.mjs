import { chromium } from '/home/user/henribeaubayemi/node_modules/playwright/index.mjs';
import fs from 'fs';
const FPS=24, sc=JSON.parse(fs.readFileSync('scenes.json','utf8')).map(s=>({...s,d:s.duree+(s.type==='fin'?1.5:0.8)}));
const total=sc.reduce((a,s)=>a+s.d,0), n=Math.ceil(total*FPS);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await (await b.newContext({viewport:{width:720,height:1280}})).newPage();
await p.goto('file:///tmp/claude-0/video/page.html'); await p.evaluate(s=>window.init(s),sc);
for(let i=0;i<n;i++){ await p.evaluate(t=>window.render(t),i/FPS); await p.screenshot({path:`frames/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:88}); }
fs.writeFileSync('scenes.final.json',JSON.stringify(sc)); console.log('frames',n,'duree',total.toFixed(1)); await b.close();
