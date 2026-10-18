const assert=require('node:assert/strict');const {createHarness}=require('./game-harness');let passed=0;
for(let stage=0;stage<6;stage++){
 const h=createHarness();h.evaluate(`Journey.run.stage=${stage};reset();`);
 const check=(name,code)=>{assert.equal(h.evaluate(`(()=>{${code}})()`),true,`chapter ${stage+1}: ${name}`);passed++;console.log('PASS chapter '+(stage+1)+' '+name);};
 check('dimensions are chapter-owned and entrance is walkable',`const b=World.bounds(),s=World.spawn(),c=ChapterCatalog.get(Journey.run.stage);return b.w===c.width&&b.h===c.height&&P.x===s.x&&P.y===s.y&&World.isWalkable(P.x,P.y,20);`);
 check('all normalized polygon vertices are finite',`return WorldNavData[Journey.run.stage].polygons.every(p=>p.length>=3&&p.every(v=>v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<=1)));`);
 check('resizing never moves world actors projectiles or warnings',`G.shots=[{x:P.x+50,y:P.y,trail:[]}];G.telegraphs=[{x:P.x,y:P.y,r:40}];const old=JSON.stringify([P.x,P.y,G.shots,G.telegraphs]);window.innerWidth=390;window.innerHeight=844;resize();return old===JSON.stringify([P.x,P.y,G.shots,G.telegraphs])&&World.bounds().w===ChapterCatalog.get(Journey.run.stage).width;`);
 check('boss ellipse and actors remain on actual land',`const a=World.arena();for(let i=0;i<48;i++){const t=i*Math.PI/24;if(!World.isWalkable(a.cx+Math.cos(t)*a.rx,a.cy+Math.sin(t)*a.ry,20))return false;}return true;`);
 check('altar is deliberate and boss camera keeps hero visible',`const gate=WorldNavData[Journey.run.stage].sites[5];P.x=gate.x*World.bounds().w;P.y=gate.y*World.bounds().h;World.update(0);if(!World.interact()||!World.active())return false;const p=World.screen(P.x,P.y);return G.bossSpawned&&p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H;`);
}
console.log(passed+' world geometry and viewport checks passed');
