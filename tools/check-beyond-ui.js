// Isolated browser origin; no user saves or external services are modified.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/assets|\.js/.test(r.url()))errors.push(r.status()+' '+r.url());});
 const production=process.argv.includes('--production'),revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),url=production?'https://liuhongtao1981.github.io/game-xianjian/?v='+revision:'http://127.0.0.1:'+server.address().port+'/';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>typeof BeyondArt!=='undefined'&&BeyondArt.loaded()&&TerrainScene.loaded(),null,{timeout:90000});
 await page.evaluate(()=>{window.__realUpdate=update;update=()=>{};});
 if(production){const v=await page.evaluate(async rev=>(await fetch('version.json?v='+rev,{cache:'no-store'})).json(),revision);assert.equal(v.revision,revision);}
 await page.evaluate(()=>{RunSave.start(0);P.cultivation.realm=7;for(let s=0;s<24;s++)JourneyProgress.clear(s);RunSave.save();Journey.menu();});
 assert.equal(await page.locator('.chapter-card').count(),42);
 await page.locator('[data-realm="6"]').click();assert.equal(await page.locator('.chapter-card:visible').count(),3);await page.locator('.realm-filter').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'beyond-chapter-shelf.png')});
 await page.locator('[data-stage="18"]').click();assert.ok(await page.locator('.story-panel').isVisible());assert.ok((await page.locator('.story-scene').innerText()).includes('号山'));
 const scenes=[];
 for(let stage=18;stage<24;stage++){
  await page.evaluate(stage=>{Journey.run.stage=stage;Journey.run.checkpoint=null;Journey.run.extramural=false;reset();P.cultivation.realm=7;P.cultivation.layer=6;Journey.intro();},stage);
  await page.locator('.story-panel').evaluate(async element=>{await Promise.all(element.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});await page.screenshot({path:path.join(output,'beyond-story-'+stage+'.png')});await page.getByRole('button',{name:/入 劫/}).click();
  await page.evaluate(()=>{G.state='playing';document.getElementById('overlay').classList.add('hidden');const p=TerrainScene.geometry(Journey.run.stage).plazas[1];P.x=p.x;P.y=p.y;World.resolve(P,true);for(let i=0;i<4;i++)spawnEnemy(['imp','fox','snake','zombie'][i],false,{x:P.x-250+i*130,y:P.y-160});World.camera(0,true);render();});
  await page.screenshot({path:path.join(output,'beyond-field-'+stage+'.png')});
  await page.evaluate(()=>{G.state='playing';World.toggleMap();render();});await page.locator('[data-guide="elite"]').click();
  assert.equal(await page.evaluate(()=>World.guideMode()),'elite');assert.equal(await page.evaluate(()=>G.state),'playing');
  await page.locator('#pauseBtn').click();assert.equal(await page.evaluate(()=>G.state),'paused');await page.locator('#resumeBtn').click();
  await page.evaluate(()=>{G.state='playing';World.enterBoss();P.invuln=999;for(let i=0;i<1500;i++){updateEnemies(.02);updateTelegraphs(.02);if(G.boss.brain.pending?.mechanism)break;}const t=G.telegraphs.filter(t=>t.shape==='beyond').sort((a,b)=>a.life-b.life)[0],s=BeyondGuardians.safePoint(t);P.x=s.x;P.y=s.y;G.auras=[];G.parts=[];G.texts=[];Motion.reset();G.state='playing';World.camera(0,true);render();});
  await page.screenshot({path:path.join(output,'beyond-boss-'+stage+'.png')});
  for(const viewport of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>{World.camera(0,true);render();});await page.screenshot({path:path.join(output,'beyond-'+(viewport.width===390?'phone':'landscape')+'-'+stage+'.png')});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(viewport.width===390){const hit=await page.locator('#dashBtn').boundingBox();assert.ok(hit.width>=44&&hit.height>=44);await page.locator('#detailBtn').click();assert.equal(await page.locator('#detailBtn').getAttribute('aria-expanded'),'true');await page.locator('#detailBtn').click();}
  }
  scenes.push(await page.evaluate(()=>({stage:Journey.run.stage,boss:G.boss.name,ritual:G.boss.brain.pending.kind,safety:G.telegraphs.filter(t=>t.shape==='beyond').map(t=>t.safeMode),geometry:TerrainScene.geometry(Journey.run.stage).routes.length})));
  await page.setViewportSize({width:1440,height:1000});
 }
 for(let group=0;group<2;group++){
 await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(group=>{G.state='paused';const gallery=document.createElement('canvas');gallery.width=2160;gallery.height=1500;const source=document.getElementById('game');source.width=2160;source.height=1500;gallery.style.cssText='position:fixed;inset:0;z-index:10000;width:1440px;height:1000px';document.body.append(gallery);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#13262b';ctx.fillRect(0,0,2160,1500);for(let i=0;i<3;i++)for(let row=0;row<5;row++)for(let col=0;col<4;col++){const local=group*3+i;ctx.save();ctx.translate(i*720+col*180+90,row*300+265);ctx.fillStyle='#cdddcf';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText((row===4?BeyondChapters[local].boss:Object.values(BeyondChapters[local].mobNames)[row])+' '+col,0,-230);BeyondArt.drawActor({family:local+18,action:['idle','walk','windup','strike'][col],moving:col===1,walkDistance:35},row,110);ctx.restore();}gallery.getContext('2d').drawImage(source,0,0);},group);
 await page.screenshot({path:path.join(output,'beyond-60-pose-gallery-'+group+'.png')});await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>BeyondArt.loaded()&&TerrainScene.loaded());
 }
 const perf=await page.evaluate(()=>{const rows=[];for(let stage=18;stage<24;stage++)for(const count of [24,48,64]){Journey.run.stage=stage;Journey.run.difficulty=count===64?'nightmare':'normal';Journey.run.checkpoint=null;reset();const p=TerrainScene.geometry(stage).plazas[0];P.x=p.x;P.y=p.y;P.invuln=999;P.spells={};G.enemies=[];for(let i=0;i<count;i++){const a=i*Math.PI*2/count;spawnEnemy(['imp','fox','snake','zombie'][i%4],false,{x:p.x+Math.cos(a)*220,y:p.y+Math.sin(a)*160},{source:'patrol'});}const start=performance.now();for(let i=0;i<60;i++){G.state='playing';update(.016);render();}rows.push({stage,count,ms:Number(((performance.now()-start)/60).toFixed(2)),valid:G.enemies.filter(e=>e.hp>0).every(e=>World.isWalkable(e.x,e.y,e.r))});}G.state='paused';return rows;});
 assert.ok(perf.every(r=>r.valid));assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'beyond-browser-report.json'),JSON.stringify({production,revision,errors,scenes,perf},null,2));console.log(JSON.stringify({production,revision,scenes,perf}));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
