// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>InfantArt.loaded()&&TerrainScene.loaded());
 for(let stage=6;stage<9;stage++){
  await page.evaluate(stage=>{RunSave.start(0);Journey.run.stage=stage;Journey.run.checkpoint=null;reset();P.cultivation.realm=2;P.cultivation.layer=6;Journey.intro();},stage);
  await page.screenshot({path:path.join(output,'infant-story-'+stage+'.png')});
  await page.getByRole('button',{name:/入 劫/}).click();
  await page.evaluate(()=>{G.state='paused';document.getElementById('overlay').classList.add('hidden');const p=TerrainScene.geometry(Journey.run.stage).plazas[1];P.x=p.x;P.y=p.y;World.resolve(P,true);for(let i=0;i<4;i++){spawnEnemy(['imp','fox','snake','zombie'][i],false,{x:P.x-250+i*130,y:P.y-130});}World.camera(0,true);render();});
  console.log('scene '+stage,await page.evaluate(()=>G.enemies.map(e=>({family:e.family,hp:e.hp,x:e.x,y:e.y,visible:World.visible(e,260)}))));
  await page.screenshot({path:path.join(output,'infant-field-'+stage+'.png')});
  await page.evaluate(()=>{G.state='playing';World.enterBoss();G.state='paused';G.boss.actionT=0;render();});
  await page.screenshot({path:path.join(output,'infant-boss-'+stage+'.png')});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>render());await page.screenshot({path:path.join(output,'infant-mobile-'+stage+'.png')});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow stage '+stage);
  await page.setViewportSize({width:1440,height:1000});
 }
 await page.setViewportSize({width:1440,height:1500});
 await page.evaluate(()=>{G.state='paused';const c=document.getElementById('game');c.style.cssText='position:fixed;inset:0;z-index:9999;width:1440px;height:1500px';c.width=1440;c.height=1500;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#15272c';ctx.fillRect(0,0,1440,1500);for(let stage=6;stage<9;stage++)for(let row=0;row<5;row++)for(let col=0;col<4;col++){ctx.save();ctx.translate((stage-6)*480+col*120+60,row*300+270);ctx.fillStyle='#cdddcf';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText((row===4?InfantChapters[stage-6].boss:Object.values(InfantChapters[stage-6].mobNames)[row])+' '+col,0,-240);InfantArt.drawActor({family:stage,action:['idle','walk','windup','strike'][col],moving:col===1,walkDistance:35},row,195);ctx.restore();}const gal=document.createElement('canvas');gal.width=1440;gal.height=1500;gal.style.cssText='position:fixed;inset:0;z-index:10000';document.body.append(gal);gal.getContext('2d').drawImage(c,0,0);});
 await page.screenshot({path:path.join(output,'infant-60-pose-gallery.png')});await page.reload();await page.waitForFunction(()=>InfantArt.loaded());
 const perf=await page.evaluate(()=>{const records=[];for(let stage=6;stage<9;stage++)for(const count of [24,48]){Journey.run.stage=stage;Journey.run.checkpoint=null;reset();const p=TerrainScene.geometry(stage).plazas[0];P.x=p.x;P.y=p.y;P.invuln=999;P.spells={};G.enemies=[];for(let i=0;i<count;i++){const a=i*Math.PI*2/count;spawnEnemy(['imp','fox','snake','zombie'][i%4],false,{x:p.x+Math.cos(a)*220,y:p.y+Math.sin(a)*160},{source:'patrol'});}const start=performance.now();for(let i=0;i<90;i++){G.state='playing';update(.016);render();}records.push({stage,count,ms:Number(((performance.now()-start)/90).toFixed(2)),valid:G.enemies.filter(e=>e.hp>0).every(e=>World.isWalkable(e.x,e.y,e.r))});}G.state='paused';return records;});if(perf.some(r=>!r.valid))throw Error('Crowd left ground');
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(output,'infant-browser-report.json'),JSON.stringify({errors,perf},null,2));console.log('Nine scenes, mobile layouts, 60 poses and crowd ground checks passed: '+JSON.stringify(perf));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
