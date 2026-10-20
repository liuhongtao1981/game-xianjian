// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});

(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
const page=await browser.newPage({viewport:{width:1837,height:1040}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>Motion.status().heroine);
await page.locator('.journey-chapters').scrollIntoViewIfNeeded();
const desktop=await page.evaluate(()=>{const shelf=document.querySelector('.journey-chapters'),cards=[...shelf.children],b=shelf.getBoundingClientRect();return {width:b.width,viewport:innerWidth,columns:cards.filter(c=>Math.abs(c.getBoundingClientRect().top-cards[0].getBoundingClientRect().top)<2).length,lastRight:cards[cards.length-1].getBoundingClientRect().right,right:b.right};});
if(desktop.columns<=3||desktop.width<desktop.viewport*.85)throw Error('Desktop chapter grid does not fill available space: '+JSON.stringify(desktop));
await page.screenshot({path:path.join(output,'chapters-full-width-desktop.png')});
await page.locator('[data-stage="0"]').click();await page.getByRole('button',{name:'暂停播放',exact:true}).click();await page.getByRole('button',{name:'下一幕',exact:true}).click();
if(!await page.locator('.story-scene').textContent().then(t=>t.includes('每一难')))throw Error('Story next scene failed');
await page.getByRole('button',{name:'上一幕',exact:true}).click();await page.locator('.story-scene').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await page.screenshot({path:path.join(output,'chapter-story-desktop.png')});
if(!await page.evaluate(()=>G.state==='start'&&RunSave.snapshot()===null))throw Error('Story preview changed run');
await page.getByRole('button',{name:'返回全部关卡',exact:true}).click();await page.locator('#outerChallengeBtn').click();await page.locator('#enterStageBtn').click();
if(!await page.evaluate(()=>Journey.run.extramural&&World.active()&&G.boss.name.startsWith('域外')))throw Error('Outside CTA did not enter arena');
if(!await page.locator('#characterBtn').isVisible())throw Error('Leaving story kept character button hidden');
await page.locator('#characterBtn').click();await page.getByRole('button',{name:'关闭人物面板',exact:true}).click();
await page.evaluate(()=>{G.boss.hp=0;G.boss.killed=true;win();});
if(!await page.evaluate(()=>P.cultivation.materials.core1===1&&P.cultivation.materials.essence===4&&JourneyProgress.cleared()===0))throw Error('Outside rewards/progression mismatch');
await page.screenshot({path:path.join(output,'outside-victory-desktop.png')});
await page.reload();await page.locator('#continueRunBtn').click();if(!await page.evaluate(()=>G.state==='win'&&Journey.run.extramural&&P.cultivation.materials.core1===1))throw Error('Outside result did not survive browser refresh');
await page.locator('#againBtn').click();await page.locator('#enterStageBtn').click();await page.evaluate(()=>{G.boss.hp=0;G.boss.killed=true;win();});
if(!await page.evaluate(()=>P.cultivation.materials.core1===2&&P.cultivation.materials.essence===8))throw Error('Repeated outside rewards failed');
await page.locator('#menuBtn').click();
await page.evaluate(()=>{JourneyProgress.restore({version:1,cleared:12,entries:{}});P.cultivation.realm=3;G.state='playing';RunSave.save();Journey.menu();});
await page.locator('[data-stage="6"]').click();if(!await page.locator('.story-scene').textContent().then(t=>t.includes('焚愿袈裟角')))throw Error('Chapter 7 misses prior chapter clue');
await page.locator('.story-scene').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await page.screenshot({path:path.join(output,'chapter-linked-story-desktop.png')});await page.getByRole('button',{name:'返回全部关卡',exact:true}).click();
for(const width of [1440,1024,768,390]){await page.setViewportSize({width,height:844});await page.locator('.journey-chapters').scrollIntoViewIfNeeded();
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Menu overflows at '+width);
if(width===390){await page.screenshot({path:path.join(output,'chapters-full-width-mobile.png')});await page.locator('[data-stage="0"]').click();await page.getByRole('button',{name:'暂停播放',exact:true}).click();await page.locator('.story-scene').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await page.screenshot({path:path.join(output,'chapter-story-mobile.png')});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile story overflow');await page.getByRole('button',{name:'返回全部关卡',exact:true}).click();await page.locator('.outer-challenge').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'outside-entry-mobile.png')});}}
if(errors.length)throw Error(errors.join('\n'));console.log('Desktop responsive shelf: '+JSON.stringify(desktop));console.log('4 viewport sizes, linked story controls, outside victory/repeat/reload and mobile screenshots passed');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
