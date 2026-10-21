// Uses an isolated server and browser profile so the player's save is untouched.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>Motion.status().heroine);
 for(const [width,difficulty,expected] of [[1440,'normal',72],[1440,'nightmare',128],[390,'story',24],[390,'nightmare',64]]){
  await page.setViewportSize({width,height:900});await page.waitForFunction(w=>W===w,width);
  const result=await page.evaluate(({difficulty})=>{
   Journey.run.stage=0;Journey.run.difficulty=difficulty;Journey.run.checkpoint=null;reset();P.invuln=999;World.enterBoss();
   for(let i=0;i<1800;i++)EncounterDirector.update(.05);
   G.state='paused';World.camera(0,true);render();syncHUD();
   const status=EncounterDirector.status();return {alive:status.alive,cap:status.cap,wave:status.summons.wave,walkable:G.enemies.filter(e=>e.source==='boss').every(e=>World.isWalkable(e.x,e.y,e.r))};
  },{difficulty});
  assert.equal(result.alive,expected);assert.equal(result.cap,expected);assert.equal(result.walkable,true);assert.ok(result.wave>=24);
  await page.screenshot({path:path.join(output,`boss-summons-${width}-${difficulty}.png`)});
  await page.evaluate(()=>{G.state='playing';G.boss.hp=0;G.boss.killed=true;win();});
  assert.equal(await page.evaluate(()=>G.enemies.filter(e=>e.source==='boss').length),0);
  console.log('PASS browser mass summons '+JSON.stringify({width,difficulty,...result}));
 }
 assert.deepEqual(errors,[]);console.log('4 browser crowd rendering and victory cleanup checks passed');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
