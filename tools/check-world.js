// Independent terrain geometry checks plus integration checks against the real game.
// Storage belongs to each VM harness; these checks never alter browser/player saves.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHarness}=require('./game-harness');
const width=3600,height=2600,radius=20,cell=10;
const source=fs.readFileSync(path.join(__dirname,'../prototype/world-nav.js'),'utf8');
const maps=JSON.parse(JSON.stringify(vm.runInNewContext(source+';WorldNavData')));
let passed=0,failed=0;
function check(name,fn){
  try{fn();console.log('PASS '+name);passed++;}
  catch(error){console.error('FAIL '+name+': '+error.message);failed++;}
}
function evaluate(harness,body){return harness.evaluate('(function(){'+body+'})()');}
function truth(harness,body,message){assert.equal(evaluate(harness,body),true,message);}
function pointInPolygon(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function onLand(map,x,y,r=0,samples=16){
  const contains=(px,py)=>map.polygons.some(p=>pointInPolygon(px/width,py/height,p));
  if(!contains(x,y))return false;
  for(let i=0;r>0&&i<samples;i++){
    const a=i/samples*Math.PI*2;
    if(!contains(x+Math.cos(a)*r,y+Math.sin(a)*r))return false;
  }
  return true;
}
function navigationGrid(map){
  const nx=width/cell,ny=height/cell,walk=new Uint8Array(nx*ny),seen=new Uint8Array(nx*ny);
  let walkable=0;
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
    const i=y*nx+x;
    if(onLand(map,(x+.5)*cell,(y+.5)*cell,radius,8)){walk[i]=1;walkable++;}
  }
  const index=p=>Math.floor(p.y*ny)*nx+Math.floor(p.x*nx);
  const start=index(map.spawn),queue=walk[start]?[start]:[];
  if(queue.length)seen[start]=1;
  for(let h=0;h<queue.length;h++){
    const i=queue[h],x=i%nx,y=Math.floor(i/nx);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const xx=x+dx,yy=y+dy,j=yy*nx+xx;
      if(xx<0||yy<0||xx>=nx||yy>=ny||seen[j]||!walk[j])continue;
      seen[j]=1;queue.push(j);
    }
  }
  return {walkable,reachable:queue.length,reaches:p=>seen[index(p)]===1};
}
const outsideExamples=[
  [[.50,.84],[.06,.39],[.96,.62]],
  [[.48,.91],[.06,.34],[.88,.56]],
  [[.50,.81],[.80,.51],[.48,.15],[.05,.40]]
];
check('three terrain maps preserve chapter order',()=>{
  assert.deepEqual(maps.map(m=>m.id),['exile','birth','river']);
});
for(const [stage,map] of maps.entries()){
  const label=map.id;
  check(label+' polygons contain finite normalized coordinates',()=>{
    assert.ok(map.polygons.length>=4);
    for(const polygon of map.polygons){
      assert.ok(polygon.length>=3);
      for(const point of polygon)assert.ok(point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<=1));
    }
  });
  check(label+' provides three clues, chest, rest and a deliberate boss entrance',()=>{
    assert.deepEqual(map.sites.map(s=>s.kind),['lore','lore','lore','chest','rest','boss']);
    assert.deepEqual(map.sites.slice(0,3).map(s=>s.loreIndex),[0,1,2]);
  });
  const anchors=[{name:'spawn',...map.spawn},{name:'boss',...map.boss},...map.sites,
    ...map.camps.map(([x,y],i)=>({name:'camp '+i,x,y}))];
  check(label+' every anchor fits a radius-20 actor on land',()=>{
    for(const p of anchors)assert.ok(onLand(map,p.x*width,p.y*height,radius,32),p.name);
  });
  const grid=navigationGrid(map);
  check(label+' entire radius-20 walkable map is connected',()=>{
    assert.ok(grid.walkable>0);
    assert.equal(grid.reachable,grid.walkable);
    for(const p of anchors)assert.ok(grid.reaches(p),'unreachable '+p.name);
  });
  check(label+' free exploration covers more than two desktop viewports',()=>{
    assert.ok(grid.walkable*cell*cell>1280*720*2);
  });
  check(label+' river bays and cliff examples are blocked',()=>{
    for(const [x,y] of outsideExamples[stage])assert.equal(onLand(map,x*width,y*height),false);
  });
  check(label+' boss arena has room for mechanics and stays inside terrain',()=>{
    const a=map.bossArena;
    assert.equal(a.shape,'ellipse');
    assert.ok(a.rx*width*2>=1100&&a.ry*height*2>=900);
    for(let i=0;i<72;i++){
      const angle=i*Math.PI*2/72;
      assert.ok(onLand(map,(a.x+Math.cos(angle)*a.rx)*width,(a.y+Math.sin(angle)*a.ry)*height,radius,16));
    }
  });
}

for(const [stage,map] of maps.entries()){
  const h=createHarness();
  evaluate(h,'Journey.run.stage='+stage+';Journey.run.checkpoint=null;reset();');
  const label=map.id+' integration';
  check(label+' uses a persistent 3600 by 2600 world',()=>{
    truth(h,"const b=World.bounds();return b.x===0&&b.y===0&&b.w===3600&&b.h===2600&&b.w>W&&b.h>H;");
  });
  check(label+' spawns the player at this chapter terrain entrance',()=>{
    truth(h,"const s=World.spawn(),n=WorldNavData[Journey.run.stage].spawn;return Math.abs(s.x-n.x*3600)<.01&&Math.abs(s.y-n.y*2600)<.01&&P.x===s.x&&P.y===s.y&&World.isWalkable(P.x,P.y,20);");
  });
  check(label+' world collision agrees on all chapter anchors',()=>{
    truth(h,"const n=WorldNavData[Journey.run.stage];return [n.spawn,n.boss,...n.sites,...n.camps.map(([x,y])=>({x,y}))].every(p=>World.isWalkable(p.x*3600,p.y*2600,20));");
  });
  check(label+' projects actors away from water and out of world bounds',()=>{
    const points=outsideExamples[stage].map(([x,y])=>({x:x*width,y:y*height,r:20}));
    points.push({x:-120,y:-120,r:20},{x:3800,y:2900,r:20});
    truth(h,"const points="+JSON.stringify(points)+";return points.every(p=>{World.resolve(p);return Number.isFinite(p.x)&&Number.isFinite(p.y)&&World.isWalkable(p.x,p.y,p.r);});");
  });
  check(label+' time alone cannot summon or defeat the guardian',()=>{
    truth(h,"G.time=600;updateSpawning(.01);return !G.bossSpawned&&!World.active()&&G.state==='playing';");
  });
  check(label+' camera follows exploration while retaining world coordinates',()=>{
    truth(h,"P.x=World.bossPoint().x;P.y=World.bossPoint().y;const x=P.x,y=P.y;World.camera(0,true);const v=World.view(),s=World.screen(x,y),b=World.bounds();return P.x===x&&P.y===y&&v.x>0&&v.x+v.w<=b.w+.01&&v.y>=0&&v.y+v.h<=b.h+.01&&s.x>=0&&s.x<=W&&s.y>=0&&s.y<=H&&World.visible(P,0);");
  });
  check(label+' mobile resize never rescales actors, spells or hazards',()=>{
    truth(h,"G.shots=[{x:2300,y:900,trail:[{x:2290,y:900}]}];G.telegraphs=[{x:2400,y:1000,shape:'tide',gap:2450,safe:170}];const before=JSON.stringify({p:[P.x,P.y],e:G.enemies,s:G.shots,t:G.telegraphs});window.innerWidth=390;window.innerHeight=844;resize();const v=World.view(),p=World.screen(P.x,P.y);return before===JSON.stringify({p:[P.x,P.y],e:G.enemies,s:G.shots,t:G.telegraphs})&&World.bounds().w===3600&&World.bounds().h===2600&&v.w<W*2&&p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H;");
  });
  check(label+' ordinary pursuit navigates around the central terrain to the remote branch',()=>{
    truth(h,"reset();const s=WorldNavData[Journey.run.stage].sites[2],target={x:s.x*3600,y:s.y*2600},e={...World.spawn(),r:20};for(let i=0;i<1200;i++){G.time+=1/30;const v=World.steer(e,target.x,target.y);e.x+=v.x*7;e.y+=v.y*7;World.resolve(e);if(!World.isWalkable(e.x,e.y,e.r))return false;if(Math.hypot(e.x-target.x,e.y-target.y)<40)return true;}return false;");
  });
  check(label+' reading a lore stone pauses for its text and grants its reward once',()=>{
    truth(h,"reset();const s=WorldNavData[Journey.run.stage].sites[0];P.x=s.x*3600;P.y=s.y*2600;World.update(0);const oldLevel=P.level,time=G.time;if(!World.interact()||G.state!=='journal'||P.level!==oldLevel)return false;update(2);if(G.time!==time||!document.getElementById('overlay').innerHTML.includes('劫痕证词'))return false;document.getElementById('closeWorldLore').onclick();if(P.level<=oldLevel)return false;G.state='playing';World.update(0);return World.interact()===false&&World.status().visited===1;");
  });
  check(label+' opening the full map pauses combat and movement',()=>{
    truth(h,"reset();keys.w=true;const before={time:G.time,x:P.x,y:P.y,energy:P.energy};World.toggleMap();update(2);return G.state==='map'&&World.status().mapOpen&&G.time===before.time&&P.x===before.x&&P.y===before.y&&P.energy===before.energy&&!keys.w;");
  });
  check(label+' closing the full map resumes without losing the world position',()=>{
    truth(h,"const x=P.x,y=P.y;World.toggleMap();return G.state==='playing'&&!World.status().mapOpen&&P.x===x&&P.y===y;");
  });
  check(label+' map input does not dismiss story or reward screens',()=>{
    truth(h,"for(const state of ['story','levelup','chest','win','dead']){G.state=state;World.toggleMap();if(G.state!==state)return false;}G.state='playing';return true;");
  });
  check(label+' altar requires interaction and then spawns exactly one guardian',()=>{
    truth(h,"reset();const gate=WorldNavData[Journey.run.stage].sites.find(s=>s.kind==='boss');P.x=gate.x*3600;P.y=gate.y*2600;World.update(.01);if(G.bossSpawned||World.context()?.kind!=='boss')return false;G.state='map';if(World.interact()!==false||G.bossSpawned)return false;G.state='playing';const first=World.interact();World.interact();return first===true&&World.active()&&G.bossSpawned&&G.enemies.filter(e=>e.boss).length===1&&G.state==='playing';");
  });
  check(label+' active duel confines actors to the actual stone arena',()=>{
    truth(h,"const n=WorldNavData[Journey.run.stage].bossArena;for(let i=0;i<16;i++){const a=i*Math.PI/8,e={x:n.x*3600+Math.cos(a)*1800,y:n.y*2600+Math.sin(a)*1400,r:20};World.resolve(e);if(!World.isWalkable(e.x,e.y,e.r))return false;for(let j=0;j<8;j++){const b=j*Math.PI/4,x=(e.x+Math.cos(b)*e.r-n.x*3600)/(n.rx*3600),y=(e.y+Math.sin(b)*e.r-n.y*2600)/(n.ry*2600);if(x*x+y*y>1.001)return false;}}return true;");
  });
}

const progress=createHarness();
check('a river-bank position outside navigation cell centers can rejoin the route',()=>{
  const h=createHarness();truth(h,"Journey.run.stage=2;reset();P.x=1277.7605816749349;P.y=872.9973434219874;World.resolve(P);const goal={x:2844,y:1872};for(let i=0;i<1100;i++){G.time+=1/30;const v=World.steer(P,goal.x,goal.y);P.x+=v.x*7;P.y+=v.y*7;World.resolve(P);if(Math.hypot(P.x-goal.x,P.y-goal.y)<40)return true;}return false;");
});
check('fresh saves only permit the first chapter',()=>{
  truth(progress,"return JourneyProgress.canSelect(0)&&!JourneyProgress.canSelect(1)&&!JourneyProgress.canSelect(2)&&!JourneyProgress.canSelect(-1)&&!JourneyProgress.canSelect(3)&&!JourneyProgress.canSelect(.5);");
});
check('locked chapter start falls back to the first chapter',()=>{
  truth(progress,"Journey.begin(2);return Journey.run.stage===0&&JourneyProgress.cleared()===0;");
});
check('title screen marks later chapters as locked',()=>{
  truth(progress,"Journey.menu();const html=document.getElementById('overlay').innerHTML;return /data-stage=\"1\"[^>]*disabled/.test(html)&&/data-stage=\"2\"[^>]*disabled/.test(html);");
});
check('skipping a victory or requesting travel cannot unlock later chapters',()=>{
  truth(progress,"reset();JourneyProgress.clear(2);Journey.showEnd(true);return JourneyProgress.cleared()===0&&Journey.next('power')===false&&!JourneyProgress.canSelect(1);");
});
check('player death leaves the following chapter locked',()=>{
  truth(progress,"reset();P.hp=0;die();return G.state==='dead'&&!JourneyProgress.canSelect(1);");
});
check('first guardian victory unlocks exactly the second chapter and records its build',()=>{
  truth(progress,"Journey.begin(0);reset();P.spells.wulei=2;spawnBoss();G.boss.hp=0;G.boss.killed=true;win();const s=JourneyProgress.snapshot();return G.state==='win'&&s.cleared===1&&JourneyProgress.canSelect(1)&&!JourneyProgress.canSelect(2)&&s.entries[1].build.spells.wulei===2;");
});
check('newly unlocked chapter survives reload before selecting a camp reward',()=>{
  const reloaded=createHarness({storage:progress.storage});
  truth(reloaded,"Journey.begin(1);reset();return Journey.run.stage===1&&P.spells.wulei===2&&P.hp>=P.maxHp*.7&&!JourneyProgress.canSelect(2);");
});
check('replaying first-chapter result cannot unlock the third chapter',()=>{
  truth(progress,"Journey.showEnd(true);JourneyProgress.clear(0);Journey.begin(2);return JourneyProgress.cleared()===1&&Journey.run.stage===0&&!JourneyProgress.canSelect(2);");
});
check('second guardian victory unlocks the third chapter only after the first',()=>{
  truth(progress,"Journey.begin(1);reset();spawnBoss();G.boss.hp=0;G.boss.killed=true;win();return JourneyProgress.cleared()===2&&JourneyProgress.canSelect(0)&&JourneyProgress.canSelect(1)&&JourneyProgress.canSelect(2)&&!!JourneyProgress.snapshot().entries[2];");
});
check('third chapter and both completed replays remain available after reload',()=>{
  const reloaded=createHarness({storage:progress.storage});
  truth(reloaded,"Journey.begin(2);reset();return Journey.run.stage===2&&P.hp>0&&[0,1,2].every(JourneyProgress.canSelect)&&!JourneyProgress.canSelect(3);");
});
check('starting a fresh expedition retains earned chapter access',()=>{
  truth(progress,"Journey.begin(0);return Journey.run.stage===0&&Journey.run.completed.length===0&&JourneyProgress.cleared()===2&&JourneyProgress.canSelect(2);");
});
console.log(passed+' world/navigation/progression checks passed; '+failed+' failed');
if(failed)process.exitCode=1;
