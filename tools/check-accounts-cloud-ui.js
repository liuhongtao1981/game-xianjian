const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {createAccountTestServer}=require('./account-test-server.cjs');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const endpoint=require('../server/accounts/deployment.json').api_url;
(async()=>{const local=await createAccountTestServer(),browser=await chromium.launch({headless:true,channel:'msedge'}),account='qa_'+crypto.randomBytes(6).toString('hex'),password=crypto.randomBytes(12).toString('hex'),errors=[];let token=null;
 try{
  const url=process.argv.includes('--production')?'https://liuhongtao1981.github.io/game-xianjian/?v='+require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim():local.url;
  const a=await browser.newContext({viewport:{width:1440,height:1000}}),page=await a.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>AccountSession.ready());
  await page.locator('[data-account-screen=register]').click();await page.locator('#accountInput').fill(account);await page.locator('[name=name]').fill('验收剑仙');await page.locator('#accountPassword').fill(password);await page.locator('#accountForm [type=submit]').click();await page.waitForFunction(()=>document.getElementById('accountMessage').textContent.includes('注册成功'));
  await page.locator('#accountPassword').fill(password);await page.locator('#accountForm [type=submit]').click();await page.waitForFunction(()=>AccountSession.canPlay());token=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('xunsheng-account-session-v1')).token);
  await page.evaluate(async()=>{update=()=>{};RunSave.start(0,false,false,false,true);P.level=4;P.cultivation.realm=1;P.cultivation.layer=2;RunSave.save();await AccountSession.flush();});
  const b=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),phone=await b.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url,{waitUntil:'domcontentloaded'});await phone.waitForFunction(()=>AccountSession.ready());await phone.locator('#accountInput').fill(account);await phone.locator('#accountPassword').fill(password);await phone.locator('#accountForm [type=submit]').click();await phone.waitForFunction(()=>AccountSession.canPlay());assert.equal(await phone.evaluate(()=>RunSave.snapshot().run.player.level),4);
  await phone.locator('#menuRankingBtn').click();await phone.waitForFunction(()=>document.querySelector('.ranking-table tbody').innerText.includes('验收剑仙'));assert.ok((await phone.locator('.ranking-table').innerText()).includes('金丹'));assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  const report={production:process.argv.includes('--production'),endpoint,crossOrigin:true,registerLogin:true,cloudSave:true,twoBrowsers:true,globalRanking:true,errors};fs.writeFileSync(path.resolve(__dirname,'../output/playwright/accounts-cloud-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await a.close();await b.close();
 }finally{
  // Remove only the account created by this test, using its own password and session.
  if(!token){const login=await fetch(endpoint+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account,password})});if(login.ok)token=(await login.json()).token;}
  if(token){const deleted=await fetch(endpoint+'/api/account',{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({password})});assert.equal(deleted.status,200,'temporary QA account cleanup');}
  await browser.close();await local.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
