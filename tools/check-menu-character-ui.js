// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>Motion.status().hero);
 for(const id of ['xiaoguo','tinglan']){
  await page.locator(`[data-hero="${id}"]`).click();if(!await page.evaluate(()=>G.state==='start'))throw Error('Single click opened status');
  await page.locator(`[data-hero="${id}"]`).dblclick();
  if(!await page.evaluate(()=>G.state==='character-preview')||!await page.locator('.character-header').innerText().then(t=>t.includes('Lv.1')))throw Error('Fresh character preview failed');
  await page.keyboard.press('Escape');if(!await page.locator(`[data-hero="${id}"]`).getAttribute('aria-pressed').then(v=>v==='true'))throw Error('Close lost selected hero');
 }
 if(await page.evaluate(()=>localStorage.getItem(RunSave.key)!==null))throw Error('Fresh preview created a game save');
 await page.evaluate(()=>{RunSave.start(0);G.state='playing';P.level=12;P.cultivation.realm=2;P.cultivation.layer=5;P.cultivation.qi=1500;P.cultivation.materials.essence=17;P.spells.yujian=9;RunSave.save();Journey.menu();});await page.reload();
 const saved=await page.evaluate(()=>localStorage.getItem(RunSave.key));
 await page.locator('[data-hero="tinglan"]').dblclick();
 if(!await page.locator('.character-header').innerText().then(t=>t.includes('沈听澜')&&t.includes('Lv.12')&&t.includes('元婴')))throw Error('Preview failed to use the saved build');
 if(!await page.locator('.inventory-grid').first().innerText().then(t=>t.includes('Lv.9')))throw Error('Saved spells missing');
 await page.evaluate(()=>{RunSave.save('窗口失焦');Cultivation.update(99);});
 if(await page.evaluate(()=>localStorage.getItem(RunSave.key))!==saved)throw Error('Preview mutated the save');
 await page.screenshot({path:path.join(output,'menu-character-status-desktop.png')});
 await page.getByRole('button',{name:'关闭人物面板',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.locator('[data-hero="xiaoguo"]').dblclick();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile preview overflow');
 await page.screenshot({path:path.join(output,'menu-character-status-mobile.png')});await page.keyboard.press('Escape');
 if(await page.evaluate(()=>localStorage.getItem(RunSave.key))!==saved)throw Error('Closing preview mutated the save');
 await page.locator('#continueRunBtn').click();if(!await page.evaluate(()=>P.level===12&&P.cultivation.realm===2&&P.spells.yujian===9&&G.state==='paused'))throw Error('Preview broke continue');
 await page.evaluate(()=>{CharacterUI.toggle();CharacterUI.close();});if(!await page.evaluate(()=>G.state==='paused'))throw Error('In-game character close regression');
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS both hero cards: single select, double-click status, saved build, Esc/close return, mobile layout, unchanged save and normal continue');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
