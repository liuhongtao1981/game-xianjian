// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const production=process.argv.includes('--production'),base='https://liuhongtao1981.github.io/game-xianjian/',page=await browser.newPage({viewport:{width:1456,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(production?base+'?verify=gift-overflow-'+Date.now():'http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>Motion.status().hero);
 const version=production?await page.evaluate(async()=>await(await fetch('version.json?v='+Date.now())).json()):null;
 await page.evaluate(()=>{RunSave.start(0);G.state='playing';G.enemies=[];P.spells={yujian:1,wanjian:1,wulei:1,sanmei:1,jiushen:1,guanyin:1};P.cultivation=Cultivation.fresh();P.cultivation.realm=4;P.cultivation.layer=9;P.cultivation.qi=16000;CharacterUI.toggle();if(!SpellGift.apply({yujian:6}))throw Error('Could not prepare six-spell snapshot');CharacterUI.draw();});
 await page.locator('[data-sheet="spells"]').click();
 for(const [key,expected] of [['bingxin',5],['gudu',4]]){
  const button=page.locator(`[data-gift-plus="${key}"]`);if(!await button.isEnabled())throw Error('Six learned spells block '+key+'; points='+await page.evaluate(()=>SpellGift.remaining())+'; reason='+await button.getAttribute('title'));
  await button.scrollIntoViewIfNeeded();if(key==='bingxin')await page.screenshot({path:path.join(output,'gift-overflow-six-owned-ready.png')});
  await button.click();await page.locator('#applyGiftBtn').click();if(!await page.evaluate(({key,expected})=>P.spells[key]===1&&SpellGift.remaining()===expected,{key,expected}))throw Error('New spell did not consume exactly one point');
 }
 await page.locator('[data-gift-plus="gudu"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'gift-overflow-eight-learned.png')});await page.reload();await page.locator('#continueRunBtn').click();
 if(!await page.evaluate(()=>Object.keys(P.spells).length===8&&P.spells.bingxin===1&&P.spells.gudu===1&&SpellGift.remaining()===4))throw Error('Eight-spell save did not restore');
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({production,version,sixOwnedSixPoints:true,learnIce:true,learnPoison:true,costPerSpell:1,eightSpellsRestore:true,errors}));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
