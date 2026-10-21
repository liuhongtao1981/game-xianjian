// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});


(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.locator('[data-stage="0"]').click();
await page.waitForFunction(()=>Sound.status().narration?.state==='playing');
const first=await page.evaluate(()=>Sound.status().narration);if(first.source!=='recording')throw Error('Existing narration recording not used');
await page.waitForTimeout(7800);
if(!await page.locator('.story-copy>.overline').textContent().then(t=>t.includes('1 / 3')))throw Error('Scene advanced before the 10.7s recording ended');
console.log('PASS real recording remains on scene 1 beyond the old 7.2s deadline');
await page.waitForFunction(()=>Sound.status().narration?.text.includes('每一难，都须有人付命')&&Sound.status().narration?.state==='playing',{timeout:20000});
const second=await page.evaluate(()=>Sound.status().narration);
if(!second.text.includes('每一难，都须有人付命'))throw Error('Second scene speech does not match text');
if(second.source!=='recording'||second.profile!=='heavy'||second.voice!==first.voice)throw Error('Narrator changed across scenes');console.log('PASS both scenes use the same heavy recorded narrator: '+second.voice);
await page.locator('#storyPauseBtn').click();const pausedText=await page.locator('.story-scene').textContent();await page.waitForTimeout(1800);
if(!await page.evaluate(()=>Sound.status().narration.state==='paused')||await page.locator('.story-scene').textContent()!==pausedText)throw Error('Pause lost story position');
await page.locator('#storyPauseBtn').click();await page.waitForFunction(()=>Sound.status().narration?.state==='playing');
await page.evaluate(()=>window.dispatchEvent(new Event('blur')));if(!await page.evaluate(()=>Sound.status().narration.state==='paused'))throw Error('Blur did not pause narration');
await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>Sound.status().narration?.state==='playing');
await page.locator('#storyNextBtn').click();await page.waitForFunction(()=>Sound.status().narration?.state==='playing');
await page.setViewportSize({width:390,height:844});await page.locator('#storyPauseBtn').click();await page.locator('.story-scene').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
await page.screenshot({path:path.join(output,'story-audio-synchronized-mobile.png')});
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile narration UI overflow');
await page.locator('#backChaptersBtn').click();if(!await page.evaluate(()=>Sound.status().narration===null))throw Error('Narration continued after closing story');
if(errors.length)throw Error(errors.join('\n'));
console.log('PASS pause/resume, focus change, final-scene narration, mobile display and cancellation');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
