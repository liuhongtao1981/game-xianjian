// Uses isolated browser storage; never opens or changes the player's existing profile.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const production=process.argv.includes('--production'),revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),url=production?'https://liuhongtao1981.github.io/game-xianjian/?v='+revision:'http://127.0.0.1:'+server.address().port+'/',rows=[],errors=[];
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:390,height:844},{width:844,height:390}]){
  const mobile=viewport.width===390||viewport.height===390,context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&/assets|\.js|\.css/.test(r.url()))errors.push(r.status()+' '+r.url());});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>typeof ExperienceUI!=='undefined'&&Motion.status().hero,null,{timeout:90000});
  if(production)assert.equal(await page.evaluate(async rev=>(await(await fetch('version.json?v='+rev,{cache:'no-store'})).json()).revision,revision),revision);
  async function capture(name){await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));await page.screenshot({path:path.join(output,'experience-'+name+'-'+viewport.width+'.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' horizontal overflow');}
  await capture('menu');
  await page.evaluate(()=>{window.__normalUpdate=update;update=()=>{};RunSave.start(0);document.getElementById('enterStageBtn').onclick();G.enemies=[];P.level=3;P.spells={yujian:5,wanjian:5,wulei:5,sanmei:3,gudu:2,guanyin:2};World.camera(0,true);renderSpells();syncHUD();});
  // Real pointer events: mouse does not drive touch joystick or spend dash.
  await page.mouse.click(viewport.width*.75,viewport.height*.48);assert.deepEqual(await page.evaluate(()=>[P.dashCd,joy.active]),[0,false]);
  const point=await page.evaluate(()=>{window.__focusEnemy=spawnEnemy('snake',false,{x:P.x+90,y:P.y+70});__focusEnemy.hp=__focusEnemy.maxHp=10000;return World.screen(__focusEnemy.x,__focusEnemy.y-__focusEnemy.r*.7);});
  await page.mouse.click(point.x,point.y,{button:'right'});assert.equal(await page.evaluate(()=>Targeting.current()===__focusEnemy),true);
  await capture('battle');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.state),'paused');await page.locator('#preferencesBtn').click();
  await page.locator('[data-preference="scale"]').selectOption('120');await page.locator('[data-preference="effects"]').selectOption('simple');await capture('settings');
  assert.equal(await page.locator('#experienceDone').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.state),'paused');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.state),'playing');
  await page.evaluate(()=>ExperienceUI.set('scale',100));
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>G.state),'map');
  const mapPoint=await page.evaluate(()=>{World.update(.01);const m=World.markers()[0],b=World.mapLayout();return {x:b.x+m.x/World.bounds().w*b.w,y:b.y+m.y/World.bounds().h*b.h};});
  await page.mouse.click(mapPoint.x,mapPoint.y);assert.equal(await page.locator('#setMapGoal').isVisible(),true);await capture('map');await page.locator('#setMapGoal').click();assert.equal(await page.evaluate(()=>G.state),'playing');
  await page.keyboard.press('c');assert.equal(await page.evaluate(()=>G.state),'character');await capture('character');
  await page.locator('[data-sheet="spells"]').click();await capture('gift');const gift=await page.locator('#applyGiftBtn').boundingBox();assert.ok(gift&&gift.y>=0&&gift.y+gift.height<=viewport.height&&gift.height>=44,'gift confirmation reachable');await page.keyboard.press('Escape');
  if(mobile){const touch=await page.evaluate(()=>{const c=document.getElementById('game'),x=innerWidth*.2,y=innerHeight*.8;function send(type,id,x,y){c.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));}send('pointerdown',31,x,y);send('pointermove',31,x+30,y-20);const left=joy.active;const p=World.screen(__focusEnemy.x,__focusEnemy.y-__focusEnemy.r*.7);send('pointerdown',32,p.x,p.y);send('pointerup',32,p.x,p.y);const independent=joy.active&&joy.id===31;send('pointercancel',31,x,y);return {left,independent,ended:!joy.active,dash:P.dashCd};});assert.deepEqual(touch,{left:true,independent:true,ended:true,dash:0});}
  // Resume a real optional camp state through the stored v3 envelope.
  await page.evaluate(()=>{G.enemies=[];P.level=3;const c=EncounterDirector.status().camps[5];Object.assign(P,{x:c.x,y:c.y});World.camera(0,true);EncounterDirector.update(.05);CampTactics.interact();P.xp=3.5;RunSave.save('浏览器检查');});
  const saved=await page.evaluate(()=>({charges:RunSave.snapshot().run.director.camps[5].tactics.charges,xp:P.xp}));assert.equal(saved.charges,2);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof ExperienceUI!=='undefined');await page.evaluate(()=>{window.__normalUpdate=update;update=()=>{};RunSave.continueRun();});
  assert.deepEqual(await page.evaluate(()=>({charges:EncounterDirector.status().camps[5].tactics.charges,xp:P.xp})),saved);await capture('resume');
  const perf=await page.evaluate(async()=>{
    const draw=render;render=()=>{};document.getElementById('overlay').classList.add('hidden');G.state='playing';ExperienceUI.set('effects',matchMedia('(pointer: coarse)').matches?'simple':'standard');G.enemies=[];P.level=60;P.cultivation.realm=4;P.cultivation.qi=0;P.spells={yujian:12,wanjian:12,wulei:12,sanmei:9,gudu:9,bingxin:9};P.maxHp=P.hp=1200;P.shieldMax=P.shield=500;P.dmg=5;P.cdr=.5;G.queue=0;G.eshots=[];World.camera(0,true);
    const cap=EncounterDirector.status().cap,spawns=['imp','fox','snake','zombie'];for(let i=0;i<cap;i++){const a=i*Math.PI*2/cap;spawnEnemy(spawns[i%4],false,{x:P.x+Math.cos(a)*260,y:P.y+Math.sin(a)*200});}
    renderSpells();let frames=[];for(let i=0;i<100;i++)await new Promise(resolve=>requestAnimationFrame(()=>{const before=performance.now();if(G.state==='levelup')pickCard(0);if(G.state==='chest')closeChest();__normalUpdate(1/60);draw();syncHUD();frames.push(performance.now()-before);resolve();}));frames=frames.slice(10).sort((a,b)=>a-b);render=draw;
    return {preset:ExperienceUI.settings().effects,cap,meanMs:Number((frames.reduce((a,b)=>a+b,0)/frames.length).toFixed(2)),p95Ms:Number(frames[Math.floor(frames.length*.95)].toFixed(2)),peakEnemies:EncounterDirector.status().stats.peak};
  });
  await capture('crowd');
  await page.evaluate(()=>{G.state='playing';G.queue=0;Journey.run.checkpoint=JourneyProgress.capture(P);Journey.run.stage=12;reset();World.enterBoss();syncHUD();});await capture('boss');
  await page.evaluate(()=>{G.boss.hp=0;G.boss.killed=true;G.state='win';Journey.showEnd(true);syncHUD();});await capture('result');assert.ok((await page.locator('.result-growth').innerText()).includes('材料缺口'));
  rows.push({viewport,mobile,focus:true,map:true,settings120:true,save:saved,perf});await context.close();
 }
 assert.deepEqual(errors,[]);const report={production,revision,rows,errors};fs.writeFileSync(path.join(output,'experience-browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
