import { chromium } from '/home/user/henribeaubayemi/node_modules/playwright/index.mjs';
import fs from 'fs';
const map={}; for (const l of fs.readFileSync('liste.txt','utf8').trim().split('\n')) { const [path,nom]=l.split('|'); const uuid=path.split('/')[1].replace(/\.(webp|jpg)$/,''); const ext=path.endsWith('.webp')?'webp':'jpg'; map[uuid]=[`photos/${nom}.${ext}`,ext==='webp'?'image/webp':'image/jpeg']; }
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
async function ctxPour(tz,loc){
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:loc,timezoneId:tz});
  await ctx.addInitScript(()=>{try{localStorage.setItem('finjaro:intro-seen','1')}catch{}});
  await ctx.route(/\/img\/products\//,route=>{ const u=route.request().url(); const m=u.match(/\/([0-9a-f-]{36})(?:_thumb)?\.(?:webp|jpg)/); if(m&&map[m[1]]){ return route.fulfill({status:200,contentType:map[m[1]][1],body:fs.readFileSync(map[m[1]][0])}); } return route.continue(); });
  return ctx;
}
async function pas(p){ for(const t of ['Refuser','Passer','Plus tard','Non merci','Fermer']){const l=p.getByRole('button',{name:t}); if(await l.count()) await l.first().click().catch(()=>{});} }
async function attendre(p){ await p.waitForFunction(()=>[...document.images].every(i=>i.complete),{timeout:12000}).catch(()=>{}); await p.waitForTimeout(1500); }
const url='https://finjaro.net/product/b64dfa71-5c84-4129-9501-494a18d36958';
for (const [nom,tz,loc] of [['douala','Africa/Douala','fr-FR'],['paris','Europe/Paris','fr-FR']]) {
  const ctx=await ctxPour(tz,loc); const p=await ctx.newPage();
  await p.goto(url,{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(3000); await pas(p); await attendre(p);
  await p.screenshot({path:`art-${nom}.png`});
  if(nom==='douala'){ await p.goto('https://finjaro.net/',{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(3000); await pas(p);
    await p.getByText('Devenir vendeur sur Finjaro').first().scrollIntoViewIfNeeded().catch(()=>{}); await p.waitForTimeout(1500); await attendre(p); await p.screenshot({path:'vendeur.png'}); }
  await ctx.close();
}
await b.close(); console.log('ok');
