// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>Motion.status().hero);
 async function prepare(stage,ready=true){await page.evaluate(({stage,ready})=>{
  window.__cultivationUpdate=window.__cultivationUpdate||Cultivation.update;Cultivation.update=()=>false;
  Sound.stopNarration();RunSave.start(0);JourneyProgress.restore({version:1,cleared:stage,entries:{}});P.cultivation.realm=Math.floor(stage/3);RunSave.save();RunSave.start(stage);G.state='playing';P.spells={};P.invuln=999;
  P.cultivation.layer=9;const r=Cultivation.recipe();P.cultivation.qi=r.qi;P.cultivation.materials[r.core]=ready?r.coreCount:0;P.cultivation.materials.essence=r.essence;
  World.enterBoss();G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();
 },{stage,ready});}
 for(const stage of [2,5,8])for(const reward of ['power','body','focus']){
  await prepare(stage);if(await page.locator('[data-camp]').count()!==3)throw Error('Missing camp selections');
  if(!await page.evaluate(()=>G.state==='win'&&P.cultivation.realm===Math.floor(Journey.run.stage/3)))throw Error('Cultivation advanced in result screen');
  await page.locator(`[data-camp="${reward}"]`).click();
  if(!await page.evaluate(({stage,reward})=>G.state==='playing'&&Journey.run.stage===stage&&Journey.run.passage.reward===reward,{stage,reward}))throw Error('Selection was ignored at '+stage+' '+reward);
  await page.evaluate(()=>{Cultivation.update=window.__cultivationUpdate;});
  await page.waitForFunction(stage=>P.cultivation.realm===Math.floor(stage/3)+1,stage);
  if(stage===8&&reward==='focus'){await page.waitForTimeout(1000);await page.screenshot({path:path.join(output,'realm-passage-spirit-ascension.png')});}
  await page.evaluate(()=>AscensionScene.update(5.3));await page.waitForFunction(stage=>Journey.run.stage===stage+1&&G.state==='story',stage);
  if(!await page.evaluate(()=>Journey.run.passage===null&&P.cultivation.result.automatic))throw Error('Passage not finalized');
  console.log('PASS real camp click stage '+(stage+1)+' '+reward+' ascends and opens chapter '+(stage+2));
 }
 await page.setViewportSize({width:390,height:844});await prepare(8,false);await page.locator('[data-camp="body"]').click();
 await page.evaluate(()=>{Cultivation.update=window.__cultivationUpdate;});
 if(!await page.locator('#objectiveDetail').innerText().then(t=>t.includes('已选养生')&&t.includes('尚缺')))throw Error('Missing material feedback hidden');
 await page.screenshot({path:path.join(output,'realm-passage-missing-materials-mobile.png')});
 await page.evaluate(()=>RunSave.save());await page.reload();await page.locator('#continueRunBtn').click();
 if(!await page.evaluate(()=>G.state==='paused'&&Journey.run.passage.reward==='body'))throw Error('Pending selection lost on reload');
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{RunSave.save();RunSave.start(7,false,false,true);});
 for(let i=0;i<2;i++){
  if(i)await page.locator('#againBtn').click();
  await page.locator('#enterStageBtn').click();await page.evaluate(()=>{G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();});
  if(!await page.evaluate(()=>Journey.run.passage.reward==='body'&&RunSave.valid(RunSave.snapshot())))throw Error('Outside farming lost selected ration');
 }
 await page.locator('#endCultivateBtn').click();await page.waitForFunction(()=>P.cultivation.realm===3);
 await page.evaluate(()=>AscensionScene.update(5.3));await page.waitForFunction(()=>Journey.run.stage===9&&G.state==='story');
 await page.getByRole('button',{name:'暂停播放',exact:true}).click();await page.screenshot({path:path.join(output,'realm-passage-next-chapter-mobile.png')});
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS mobile missing-material feedback, reload and earned automatic next chapter; no browser errors');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
