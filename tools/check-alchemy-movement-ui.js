// Real keyboard/pointer integration with an isolated origin and browser profile.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(file!==root&&!file.startsWith(root+path.sep)){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const production=process.argv.includes('--production'),revision=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const url=production?'https://liuhongtao1981.github.io/game-xianjian/?v='+revision:'http://127.0.0.1:'+server.address().port+'/',errors=[],reports=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,isMobile:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/\.js|\.css/.test(r.url()))errors.push(r.status()+' '+r.url());});
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof Alchemy!=='undefined'&&typeof ImmortalMovement!=='undefined'&&Motion.status().hero);
  if(production)assert.equal(await page.evaluate(async()=> (await(await fetch('version.json',{cache:'no-store'})).json()).revision),revision);
  await page.keyboard.press('b');assert.equal(await page.evaluate(()=>G.state),'alchemy');assert.equal(await page.locator('#alchemyBrew').isDisabled(),true,'menu is a read-only preview');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.state),'start');
  await page.evaluate(()=>{update=()=>{};RunSave.start(0,false,false,false,true);G.enemies=[];World.camera(0,true);syncHUD();});
  await page.keyboard.down('d');await page.keyboard.down('Space');
  assert.equal(await page.evaluate(()=>P.mana),90);await page.evaluate(()=>{for(let i=0;i<60;i++)updatePlayer(1/60);syncHUD();});
  assert.ok(Math.abs(await page.evaluate(()=>P.mana)-70)<1e-6);assert.equal(await page.evaluate(()=>ImmortalMovement.status().held),true);
  await page.keyboard.press('b');assert.equal(await page.evaluate(()=>G.state),'alchemy');assert.equal(await page.evaluate(()=>ImmortalMovement.status().held),false,'opening modal releases sprint');
  await page.keyboard.up('Space');await page.keyboard.up('d');
  const before=await page.evaluate(()=>JSON.parse(JSON.stringify(P.alchemy)));
  await page.locator('#alchemyBrew').click();
  const after=await page.evaluate(()=>JSON.parse(JSON.stringify(P.alchemy)));assert.equal(after.attempts,before.attempts+1);assert.equal(after.materials.herb,before.materials.herb-2);assert.equal(after.materials.dew,before.materials.dew-1);
  assert.equal(await page.evaluate(()=>RunSave.snapshot().run.player.alchemy.attempts),after.attempts,'result is durable before reveal');
  await page.screenshot({path:path.join(output,'alchemy-interaction-'+(mobile?'phone':'desktop')+'.png')});
  await page.keyboard.press('b');assert.equal(await page.evaluate(()=>G.state),'playing');
  await page.keyboard.press('2');assert.equal(await page.evaluate(()=>P.mana),100);assert.equal(await page.evaluate(()=>P.alchemy.pills.spirit1),0);assert.equal(await page.evaluate(()=>P.alchemy.cooldown),18);
  await page.keyboard.press('c');await page.keyboard.press('b');assert.equal(await page.evaluate(()=>G.state),'alchemy');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.state),'character');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.state),'playing');
  await page.evaluate(()=>{P.mana=75;P.dashCd=0;syncHUD();});
  if(mobile){
   const button=await page.locator('#dashBtn').boundingBox();assert.ok(button&&button.height>=44&&button.x+button.width<=390);
   const session=await context.newCDPSession(page),x=button.x+button.width/2,y=button.y+button.height/2;
   // Keep the joystick touch clear of browser-adjusted button hit targets.
   const touch=(id,x,y)=>({id,x,y,radiusX:4,radiusY:4,force:1});
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,35,570)]});
   await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,65,555)]});
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,65,555),touch(2,x,y)]});
   const fingers=await page.evaluate(({x,y})=>({joy:{...joy},movement:ImmortalMovement.status(),state:G.state,button:document.elementFromPoint(x,y)?.outerHTML.slice(0,160),stick:document.elementFromPoint(35,570)?.outerHTML.slice(0,160)}),{x,y});
   assert.equal(fingers.joy.active&&fingers.movement.held,true,'real two-finger joystick and sprint coexist: '+JSON.stringify(fingers));
   await page.evaluate(()=>{for(let i=0;i<30;i++)updatePlayer(1/60);});
   assert.ok(await page.evaluate(()=>P.mana<65));
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[touch(2,x,y)]});
   assert.equal(await page.evaluate(()=>joy.active&&!ImmortalMovement.status().held),true,'lifting sprint finger preserves joystick');
   await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.evaluate(()=>joy.active||ImmortalMovement.status().held),false);
  }else{
   await page.locator('#dashBtn').hover();await page.mouse.down();assert.equal(await page.evaluate(()=>ImmortalMovement.status().held),true);await page.mouse.up();assert.equal(await page.evaluate(()=>P.mana),65,'pointer click spends dash once');
  }
  await page.evaluate(()=>{P.mana=37;RunSave.save('integration');});const saved=await page.evaluate(()=>({mana:P.mana,alchemy:JSON.parse(JSON.stringify(P.alchemy))}));
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof Alchemy!=='undefined');await page.evaluate(()=>{update=()=>{};RunSave.continueRun();});
  assert.deepEqual(await page.evaluate(()=>({mana:P.mana,alchemy:JSON.parse(JSON.stringify(P.alchemy))})),saved);assert.equal(await page.evaluate(()=>ImmortalMovement.status().held),false);
  reports.push({mobile,brew:after.lastResult,save:true,heldMovement:true,twoFinger:mobile});await context.close();
 }
 assert.deepEqual(errors,[]);const report={production,revision,reports,errors};fs.writeFileSync(path.join(output,'alchemy-movement-browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
