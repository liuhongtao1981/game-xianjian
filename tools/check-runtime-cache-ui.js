// Real-browser smoke checks use an isolated origin and never touch the user's game save.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../prototype'),output=path.resolve(__dirname,'../output/playwright');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((q,r)=>{const file=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!file.startsWith(root+path.sep)&&file!==root){r.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{r.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(p)]||'application/octet-stream');r.writeHead(e?404:200);r.end(e?'missing':b);});});


const {execFileSync}=require('node:child_process');
const previousProgress=execFileSync('git',['show','HEAD:prototype/progress.js'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:860,height:1140}}),errors=[];let staleUsed=false;
 page.on('pageerror',e=>errors.push(e.message));
 // Reproduce a browser retaining the old unversioned progress module during a local update.
 await page.route('**/progress.js*',route=>{if(!new URL(route.request().url()).searchParams.has('v')){staleUsed=true;return route.fulfill({status:200,contentType:'text/javascript',body:previousProgress});}return route.continue();});
 await page.goto('http://127.0.0.1:'+server.address().port+'/?v=story-audio-sync');
 const menu=await page.locator('.journey-menu').count();
 if(menu!==1||errors.length)throw Error('Black-screen reproduction: '+JSON.stringify({menu,staleUsed,errors}));
 await page.locator('#startBtn').waitFor({state:'visible'});
 const resources=await page.locator('script[src],link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')||n.getAttribute('href')));
 if(resources.some(url=>!new URL(url,'http://localhost/').searchParams.has('v')))throw Error('Runtime resources still allow mixed cached versions');
 if(await page.locator('#outerChallengeBtn').count())throw Error('An uncleared realm exposed outside challenges');
 await page.screenshot({path:path.join(output,'runtime-cache-recovery.png')});
 console.log('PASS cached old scripts cannot break startup; menu is visible and outside gates remain enforced');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
