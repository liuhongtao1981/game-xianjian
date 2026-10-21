// Isolated browser contexts leave the player's own saved game untouched.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const production=process.argv.includes('--production'),revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),url=production?'https://liuhongtao1981.github.io/game-xianjian/?v='+revision:'http://127.0.0.1:'+server.address().port+'/',rows=[],errors=[];
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/assets|\.js|\.css/.test(r.url()))errors.push(r.status()+' '+r.url());});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>typeof RewardCards!=='undefined'&&Motion.status().hero,null,{timeout:90000});
  if(production)assert.equal(await page.evaluate(async rev=>(await(await fetch('version.json?v='+rev,{cache:'no-store'})).json()).revision,revision),revision);
  await page.evaluate(()=>{window.__normalUpdate=update;update=()=>{};RunSave.start(0);document.getElementById('enterStageBtn').onclick();G.enemies=[];P.cultivation.realm=2;P.cultivation.qi=0;P.spells={wulei:7};P.dmg=1;P.crit=0;G.state='playing';World.camera(0,true);syncHUD();});
  const result=await page.evaluate(()=>{const a=spawnEnemy('imp',false,{x:P.x+60,y:P.y}),b=spawnEnemy('imp',false,{x:P.x-90,y:P.y}),v=World.view(),off=spawnEnemy('imp',false,{x:v.x+v.w+20,y:P.y});for(const e of [a,b,off])e.hp=e.maxHp=10000;SPELLS.wulei.cast(7);Motion.update(.23);const d=Math.round(SpellGrowth.spec('wulei',7).damage);return {damage:[a.maxHp-a.hp,b.maxHp-b.hp,off.maxHp-off.hp],expected:[4*d,3*d,0],bolts:G.bolts.length};});
  assert.deepEqual(result.damage,result.expected);assert.equal(result.bolts,7);rows.push({viewport,...result});
  await page.screenshot({path:path.join(output,'thunder-concentration-'+viewport.width+'.png')});
  await page.evaluate(()=>{G.enemies=[];G.queue=1;showLevelUp([{kind:'up',key:'wulei',...SPELLS.wulei,lvl:'Lv.7 → 8',tag:'术法 · 精进'}]);syncHUD();});
  const card=page.locator('.upcard');assert.ok((await card.innerText()).includes('单体全中基础总伤'));assert.ok((await card.innerText()).includes('余雷均分集中'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await card.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'thunder-upgrade-'+viewport.width+'.png')});await card.click();assert.equal(await page.evaluate(()=>P.spells.wulei),8);
  await context.close();
 }
 assert.deepEqual(errors,[]);const report={production,revision,rows,errors};fs.writeFileSync(path.join(output,'thunder-browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
