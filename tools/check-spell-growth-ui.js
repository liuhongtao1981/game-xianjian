// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});

(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const production=process.argv.includes('--production'),revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(production?'https://liuhongtao1981.github.io/game-xianjian/?v='+revision:'http://127.0.0.1:'+server.address().port+'/');
 if(production){const version=await page.evaluate(async revision=>(await fetch('version.json?v='+revision,{cache:'no-store'})).json(),revision);if(version.revision!==revision)throw Error('Stale deployment '+version.revision);}
 await page.waitForFunction(()=>Motion.status().hero&&InfantArt.loaded());
 await page.locator('#startBtn').click();await page.locator('#enterStageBtn').click();
 await page.evaluate(()=>{G.enemies=[];P.cultivation.realm=2;P.cultivation.qi=0;P.spells={yujian:7,wanjian:7,wulei:7};delete P.cultivation.spellGift;CharacterUI.toggle();});
 await page.locator('[data-sheet="spells"]').click();
 if(!await page.locator('.sheet-note').allTextContents().then(a=>a.some(s=>s.includes('上限 Lv.11')&&s.includes('下一境开放至 Lv.14'))))throw Error('Realm cap progression missing');
 for(let i=0;i<4;i++)await page.locator('[data-gift-plus="yujian"]').click();
 if(!await page.locator('[data-gift-plus="yujian"]').isDisabled()||await page.evaluate(()=>P.spells.yujian)!==7)throw Error('Preview bypassed cap or applied early');
 if(!await page.locator('.gift-card').first().innerText().then(s=>s.includes('7 → 11柄')&&s.includes('上限 11级')))throw Error('Quantity preview incorrect');
 await page.screenshot({path:path.join(output,'spell-growth-desktop.png')});
 await page.locator('#applyGiftBtn').click();if(await page.evaluate(()=>P.spells.yujian)!==11)throw Error('Apply did not use eleven real swords');
 await page.reload();await page.locator('#continueRunBtn').click();
 if(await page.evaluate(()=>P.spells.yujian)!==11)throw Error('Refresh lost expanded spell level');
 if(await page.locator('#resumeBtn').count())await page.locator('#resumeBtn').click();
 await page.evaluate(()=>{G.enemies=[];G.state='playing';P.cultivation.realm=13;P.cultivation.qi=0;P.spells={wanjian:44,yujian:44,wulei:44};delete P.cultivation.spellGift;P.xpNext=1e6;World.camera(0,true);CharacterUI.toggle();});
 await page.locator('[data-sheet="spells"]').click();
 if(!await page.locator('.gift-card').nth(1).innerText().then(s=>s.includes('9圈剑阵')&&s.includes('共204柄')&&s.includes('上限 44级')))throw Error('Dynamic high-realm circles missing');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'spell-growth-mobile.png')});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)||await page.locator('.gift-card').evaluateAll(nodes=>nodes.some(n=>n.scrollWidth>n.clientWidth)))throw Error('Spell panel overflows mobile viewport');
 await page.locator('#closeCharacterBtn').click();
 const result=await page.evaluate(()=>{const s=SpellCombat.orbit(P);return {level:P.spells.wanjian,count:s.length,circles:new Set(s.map(x=>x.layer)).size,finite:s.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)),saved:RunSave.save('expanded spell browser check')};});
 if(result.count!==204||result.circles!==9||!result.finite||!result.saved)throw Error(JSON.stringify(result));
 await page.waitForFunction(()=>G.time>1);await page.screenshot({path:path.join(output,'spell-growth-nine-circles-mobile.png')});
 await page.reload();await page.locator('#continueRunBtn').click();if(await page.evaluate(()=>P.spells.wanjian)!==44)throw Error('High realm save failed on refresh');
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({production,revision,result,errors}));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
