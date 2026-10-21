// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>Motion.status().hero);
 async function prepare(spells={yujian:1}){await page.evaluate(spells=>{RunSave.start(0);G.state='playing';G.enemies=[];P.spells=spells;P.cultivation=Cultivation.fresh();P.cultivation.realm=1;RunSave.save();CharacterUI.toggle();},spells);await page.locator('[data-sheet="spells"]').click();}
 for(const key of ['wanjian','wulei','sanmei','bingxin','gudu','jiushen','guanyin']){
  await prepare();const plus=page.locator(`[data-gift-plus="${key}"]`);if(!await plus.isEnabled()||!await plus.innerText().then(t=>t.includes('习得')))throw Error('Unlearned spell cannot be learned: '+key);
  await plus.click();if(!await page.locator('.gift-heading').innerText().then(t=>t.includes('剩余 2 点')))throw Error('Learning preview did not cost one point');
  await page.locator('#applyGiftBtn').click();if(!await page.evaluate(key=>P.spells[key]===1&&SpellGift.remaining()===2&&!SpellGift.base()[key]&&P.t[key]===SPELLS[key].cd*P.cdr,key))throw Error('Learning transaction failed: '+key);
  const text=await page.locator(`[data-gift-plus="${key}"]`).locator('..').locator('..').innerText();if(!text.includes('已习得 · Lv.1'))throw Error('Learned spell still marked unlearned');
  if(key==='wulei'){await page.locator('[data-gift-plus="wulei"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'gift-learn-thunder-desktop.png')});await page.locator(`[data-gift-plus="${key}"]`).click();await page.locator('#applyGiftBtn').click();if(!await page.evaluate(()=>P.spells.wulei===2&&SpellGift.remaining()===1))throw Error('Further upgrade did not cost exactly one additional point');
   await page.reload();await page.locator('#continueRunBtn').click();if(!await page.evaluate(()=>P.spells.wulei===2&&SpellGift.remaining()===1))throw Error('Learned spell lost on reload');}
  await page.evaluate(()=>{if(G.state==='character')CharacterUI.close();G.state='playing';Journey.menu();});
 }
 await page.setViewportSize({width:390,height:844});await prepare({yujian:1,wanjian:1,wulei:1,sanmei:1,bingxin:1});
 await page.locator('[data-gift-plus="gudu"]').click();await page.locator('#applyGiftBtn').click();
 for(const key of ['jiushen','guanyin']){if(!await page.locator('[data-gift-plus="'+key+'"]').isEnabled())throw Error('Gift learning blocked after six spells');await page.locator('[data-gift-plus="'+key+'"]').click();await page.locator('#applyGiftBtn').click();}if(!await page.evaluate(()=>Object.keys(P.spells).length===8&&SpellGift.remaining()===0))throw Error('Gift learning did not reach all eight spells');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Learning controls overflow mobile');
 await page.locator('[data-gift-plus="jiushen"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'gift-learn-eight-spells-mobile.png')});
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS all seven unlearned spells: one-point learning, learned state, one-point upgrades, full initial cooldown, reload persistence and eight-spell gift learning');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
