// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const production=process.argv.includes('--production'),revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(production?'https://liuhongtao1981.github.io/game-xianjian/?v='+revision:'http://127.0.0.1:'+server.address().port+'/');
 if(production){const version=await page.evaluate(async revision=>(await fetch('version.json?v='+revision,{cache:'no-store'})).json(),revision);if(version.revision!==revision)throw Error('Stale deployed revision '+version.revision);}
 await page.waitForFunction(()=>Motion.status().hero&&InfantArt.loaded());
 if(await page.locator('[data-ultimate][aria-pressed="true"]').count()!==3)throw Error('Three arts not selected');
 await page.locator('[data-ultimate="lotus"]').click();if(await page.locator('[data-ultimate][aria-pressed="true"]').count()!==2)throw Error('Cannot change loadout');
 await page.locator('[data-ultimate="lotus"]').click();await page.locator('#startBtn').click();await page.locator('#enterStageBtn').click();
 await page.evaluate(()=>{G.enemies=[];P.spells={};P.cultivation.realm=13;P.spells.wanjian=18;P.cdr=.2;P.xp=0;P.xpNext=1000000;World.camera(0,true);syncHUD();});
 for(const [i,key] of ['q','r','t'].entries()){await page.keyboard.press(key);await page.waitForFunction(i=>G.ultimate?.kind===UltimateArts.loadout()[i],i);await page.waitForFunction(()=>!G.ultimate);}
 const combat=await page.evaluate(()=>({casts:G.ultimateCasts,arts:UltimateArts.snapshot(),rings:[0,1,2,3].map(l=>SpellCombat.orbit(P).filter(s=>s.layer===l).length)}));
 if(combat.casts!==3||combat.rings.join(',')!=='5,7,10,14'||Object.values(combat.arts).some(s=>s.energy>=100))throw Error('Three art rotation failed '+JSON.stringify(combat));
 await page.evaluate(()=>{G.enemies=[];P.spells={wanjian:18};delete P.cultivation.spellGift;RunSave.save('UI restore');G.state='paused';});
 await page.reload();await page.locator('#continueRunBtn').click();if(await page.evaluate(()=>UltimateArts.loadout().length)!==3)throw Error('Loadout lost on refresh');
 await page.locator('#resumeBtn').click();await page.evaluate(()=>{G.enemies=[];P.xp=0;P.xpNext=1000000;P.spells={wanjian:18};UltimateArts.charge(100);for(const s of Object.values(P.ultimateArts))s.cd=0;UltimateArts.sync();syncHUD();});
 await page.screenshot({path:path.join(output,'ultimate-arts-desktop.png')});
 await page.locator('#characterBtn').click();if(!await page.locator('.character-content').innerText().then(s=>s.includes('冷却缩减 · 含大招')&&s.includes('80%')&&s.includes('携行大招')))throw Error('Character stats incomplete');
 await page.screenshot({path:path.join(output,'ultimate-arts-character.png')});await page.locator('#closeCharacterBtn').click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'ultimate-arts-mobile.png')});
 const boxes=await page.locator('.ultimate-bar button').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,visible:!n.hidden};}));
 if(boxes.some(b=>!b.visible||b.x<0||b.x+b.w>390||b.h<44||b.y+b.h>844)||await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile action layout '+JSON.stringify(boxes));
 await page.locator('#ultimateBtn1').click();await page.waitForFunction(()=>!!G.ultimate);await page.waitForFunction(()=>!G.ultimate);
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({production,revision,combat,mobileButtons:boxes,errors}));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
