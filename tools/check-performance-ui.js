// Isolated, seeded real-browser frame-time regression. Does not touch user saves.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const options=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('='))),frames=Number(options.frames||240);
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof FinaleArt!=='undefined'&&FinaleArt.loaded()&&TerrainScene.loaded(),null,{timeout:90000});
 const rows=[];
 const navigation=await page.evaluate(verify=>{const rows=[];for(let stage=0;stage<ChapterCatalog.playable;stage++){Journey.run.stage=stage;reset();const cached=typeof NavigationCache!=='undefined'&&NavigationCache.get(stage,World.navigationKey());let equivalent=null;if(cached&&verify){const actual=World.navigationTopology();equivalent=actual.walk.every((value,i)=>value===cached.walk[i])&&actual.neighbors.every((row,i)=>row.length===cached.neighbors[i].length&&row.every((n,j)=>n===cached.neighbors[i][j]));}rows.push({stage,cached:!!cached,equivalent});}return rows;},!!options['verify-topology']);
 assert.ok(navigation.every(row=>row.cached),'A navigation cache did not match browser geometry');
 if(options['verify-topology'])assert.ok(navigation.every(row=>row.equivalent),'Baked navigation differs from browser walkability');
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>FinaleArt.loaded()&&TerrainScene.loaded(),null,{timeout:90000});
 for(const count of (options.counts||'0,64,128').split(',').map(Number)){
  const row=await page.evaluate(async({count,frames,profile,skip,noNavigationCache})=>{
   let seed=20261023;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   if(!window.__perfOriginal)window.__perfOriginal={update,render,spawn:updateSpawning,cacheGet:NavigationCache.get};
   NavigationCache.get=noNavigationCache?()=>null:window.__perfOriginal.cacheGet;
   update=window.__perfOriginal.update;render=window.__perfOriginal.render;updateSpawning=()=>{};
   RunSave.start(0);Journey.run.stage=41;Journey.run.difficulty='nightmare';Journey.run.checkpoint=null;reset();P.cultivation.realm=13;P.cultivation.layer=4;P.cultivation.qi=0;P.level=138;P.maxHp=100000;P.hp=P.maxHp;P.invuln=999;P.dmg=20;P.cdr=.45;P.armor=.5;P.spells={yujian:24,wanjian:24,wulei:23,sanmei:21,bingxin:20,guanyin:20,gudu:20,jiushen:20};
   const plaza=TerrainScene.geometry(41).plazas[1];P.x=plaza.x;P.y=plaza.y;World.resolve(P,true);G.enemies=[];G.queue=0;G.state='playing';document.getElementById('overlay').classList.add('hidden');
   for(let i=0;i<count;i++){const a=i*Math.PI*2/count,e=spawnEnemy(['imp','fox','snake','zombie'][i%4],false,{x:P.x+Math.cos(a)*230,y:P.y+Math.sin(a)*160},{source:'patrol'});e.hp=e.maxHp=1e9;}
   World.camera(0,true);joy.active=true;let frame=0,updateMs=0,renderMs=0;const samples=[],pieces={};
   const probes=[[RunSave,'tick','save'],[ExperienceUI,'tick','experience'],[Targeting,'current','targeting'],[TerrainScene,'draw','terrain'],[TerrainScene,'blocked','terrainCollision'],[World,'steer','steer'],[World,'resolve','resolve'],[Encounters,'attackMob','enemyAttack'],[Motion,'drawActor','actors'],[Motion,'update','motion'],[Cultivation,'update','cultivation'],[Journey,'updatePassage','passage'],...['updatePlayer','updateUltimate','updateSpells','updateShots','updateEnemies','updateTelegraphs','updatePools','updateOrbs','updateHeals','updateChests','updateFx'].map(key=>[window,key,key])];
   if(profile||skip){for(const [owner,key,label] of probes)if(typeof owner[key]==='function'){const fn=owner[key];pieces[label]={owner,key,fn,total:0,count:0,max:0};owner[key]=function(...args){const start=performance.now();try{return skip===label?undefined:fn.apply(this,args);}finally{const cost=performance.now()-start;pieces[label].total+=cost;pieces[label].count++;pieces[label].max=Math.max(pieces[label].max,cost);}};}}
   update=()=>{joy.dx=Math.cos(frame/70);joy.dy=Math.sin(frame/70);const start=performance.now();window.__perfOriginal.update(1/60);updateMs=performance.now()-start;};
   render=()=>{const start=performance.now();window.__perfOriginal.render();renderMs=performance.now()-start;};
   await new Promise(done=>{let prev=0;const next=now=>{frame++;if(frame>90)samples.push({frame:now-prev,update:updateMs,render:renderMs,cpu:updateMs+renderMs});prev=now;if(frame<frames+90)requestAnimationFrame(next);else done();};requestAnimationFrame(next);});
   const summary=key=>{const sorted=samples.map(x=>x[key]).sort((a,b)=>a-b),pct=p=>Number(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))].toFixed(2));return {p50:pct(.5),p95:pct(.95),p99:pct(.99),worst:pct(1),over50:sorted.filter(x=>x>50).length};};
   const profileRows=Object.fromEntries(Object.entries(pieces).map(([key,v])=>{v.owner[v.key]=v.fn;return [key,{mean:Number((v.total/v.count).toFixed(3)),max:Number(v.max.toFixed(3)),calls:v.count}];}));
   joy.active=false;G.state='paused';update=window.__perfOriginal.update;render=window.__perfOriginal.render;
   return {count,frames,navigationKey:World.navigationKey?.(),navigationCached:!noNavigationCache,actualMobs:G.enemies.filter(e=>e.hp>0).length,shots:G.shots.length,particles:G.parts.length,frame:summary('frame'),cpu:summary('cpu'),update:summary('update'),render:summary('render'),profile:profileRows};
  },{count,frames,profile:!!options.profile,skip:options.skip,noNavigationCache:!!options['no-navigation-cache']});rows.push(row);console.log(JSON.stringify(row));
 }
 const report={label:options.label||'current',viewport:{width:1440,height:1000},navigation,rows,errors};fs.writeFileSync(path.join(output,'performance-'+report.label+'.json'),JSON.stringify(report,null,2));assert.deepEqual(errors,[]);
 if(!options['record-only'])for(const row of rows){assert.ok(row.cpu.p99<25,'CPU p99 exceeds 25 ms: '+JSON.stringify(row));assert.ok(row.frame.p99<50,'Frame p99 exceeds 50 ms: '+JSON.stringify(row));assert.ok(row.cpu.worst<100,'Main-thread pause exceeds 100 ms: '+JSON.stringify(row));}
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e.message);server.close();process.exitCode=1;});
