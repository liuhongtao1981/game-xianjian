const assert=require('node:assert/strict');
const {createHarness}=require('./game-harness');
let count=0;
const game=createHarness(),run=game.evaluate;
run(`
  function realVictory(){
    G.state='playing';P.x=World.bossPoint().x;P.y=World.bossPoint().y+150;World.enterBoss();P.crit=0;
    for(let cycle=0;cycle<12&&G.boss.hp>0;cycle++){
      for(const e of G.enemies.filter(e=>e.bossHelper&&e.hp>0))hurt(e,9999);
      for(let f=0;f<400&&G.boss.action!=='exposed';f++){
        updateEnemies(.04);const tide=G.telegraphs.find(t=>t.shape==='tide'),bell=G.telegraphs.find(t=>t.bossSkill==='bell');
        if(tide){P.x=tide.gap;P.y=tide.y}else if(bell){const a=World.arena();Object.assign(P,World.clipToArena({x:a.cx+Math.sign(a.cx-bell.x||1)*250,y:a.cy+Math.sign(a.cy-bell.y||1)*180},P.r))}else if(G.telegraphs.some(t=>t.shape==='line')){Object.assign(P,World.clipToArena({x:World.arena().x+40,y:World.arena().y+40},P.r))}
        updateTelegraphs(.04);
      }
      if(G.boss.action!=='exposed')return false;hurt(G.boss,1e6);if(G.boss.hp>0)updateEnemies(.02);
    }
    settleCombat();return G.state==='win';
  }
  function isolated(stage=0){Journey.run.stage=stage;Journey.run.difficulty='normal';Journey.run.checkpoint=null;reset()}
  function mobAt(type,distance){spawnEnemy(type,false,{x:P.x+distance,y:P.y});const e=G.enemies.at(-1);e.atkCd=0;e.skillCd=0;return e}
`);
function check(name,source,env=run){assert.equal(env(`(()=>{${source}})()`),true,name);console.log('PASS '+name);count++;}
check('fresh profile exposes only first chapter',`return JourneyProgress.cleared()===0&&JourneyProgress.canSelect(0)&&!JourneyProgress.canSelect(1)&&!JourneyProgress.canSelect(2)`);
check('direct start cannot bypass locked chapter',`Journey.begin(2);return Journey.run.stage===0&&Journey.run.checkpoint===null`);
check('fake results screen never unlocks chapter',`reset();Journey.showEnd(true);return JourneyProgress.cleared()===0`);
check('ordinary kills never unlock chapters',`reset();spawnEnemy('imp');killEnemy(G.enemies[0]);settleCombat();return JourneyProgress.cleared()===0`);
check('first actual guardian victory unlocks exactly next chapter',`reset();return realVictory()&&JourneyProgress.cleared()===1&&JourneyProgress.canSelect(1)&&!JourneyProgress.canSelect(2)`);
check('victory saves next entry before leaving result screen',`return !!JourneyProgress.snapshot().entries[1]&&JourneyProgress.snapshot().entries[1].build.hp>=84`);
check('reopening result cannot duplicate clear',`Journey.showEnd(true);return JourneyProgress.cleared()===1`);
check('camp reward carries build into unlocked chapter',`P.spells.wulei=2;P.equips=['mujian'];const expected=P.maxHp+20;return (G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('body')&&Journey.run.stage===1&&G.state==='story'&&P.maxHp===expected&&JourneyProgress.snapshot().entries[1].build.maxHp===expected`);
check('camp cannot grant free repeated reward',`const damage=P.dmg;return !(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power')&&P.dmg===damage&&Journey.run.stage===1`);
check('chapter arrival never unlocks the following chapter',`return JourneyProgress.cleared()===1&&!JourneyProgress.canSelect(2)`);
check('unlocked next chapter may be selected after predecessor victory',`Journey.begin(1);reset();return Journey.run.stage===1&&Math.abs(P.maxHp-(120*1.02**2+20))<.001&&P.spells.wulei===2`);
check('second actual guardian victory unlocks third chapter',`return realVictory()&&JourneyProgress.cleared()===2&&JourneyProgress.canSelect(2)&&!!JourneyProgress.snapshot().entries[2]`);
const reloaded=createHarness({storage:game.storage});
check('clears and next-entry snapshots survive reload',`return JourneyProgress.cleared()===2&&JourneyProgress.canSelect(2)&&!!JourneyProgress.snapshot().entries[2]`,reloaded.evaluate);
check('replay honors selected difficulty ultimate and saved build',`Journey.run.difficulty='story';Journey.run.ultimate='lotus';Journey.begin(1);reset();return Journey.run.stage===1&&Math.abs(P.maxHp-(120*1.02**2+60))<.001&&P.hp>=126&&Journey.run.ultimate==='lotus'&&P.spells.wulei===2`,reloaded.evaluate);
check('retry does not retain failed-stage loot',`P.dmg=99;P.spells.jiushen=5;reset();return P.dmg!==99&&!P.spells.jiushen`,reloaded.evaluate);
check('fresh expedition keeps permanent clears',`Journey.begin();return JourneyProgress.cleared()===2&&Journey.run.stage===0&&Journey.run.completed.length===0`);
check('third real victory completes campaign sequentially',`Journey.begin(2);reset();return realVictory()&&JourneyProgress.cleared()===3&&JourneyProgress.canSelect(2)`);
check('stage pressure compounds above each global difficulty',`return Object.keys(Journey.difficulties).every(id=>{Journey.run.difficulty=id;const values=[0,1,2].map(stage=>{Journey.run.stage=stage;return Journey.difficulty()});return values[2].damage>values[1].damage&&values[1].damage>values[0].damage&&values[2].spawn<values[1].spawn&&values[1].spawn<values[0].spawn&&values[2].speed>values[1].speed&&values[2].projectile>values[1].projectile&&values[2].warning<values[1].warning})`);
check('later guardians and soldiers have increasing health budgets',`return Journey.stages[2].bossHp>Journey.stages[1].bossHp&&Journey.stages[1].bossHp>Journey.stages[0].bossHp&&Journey.stages[2].mobScale>Journey.stages[1].mobScale`);
check('sixty themed soldiers match narrative records',`return new Set(Encounters.families.flatMap(f=>f.units.map(u=>u.name))).size===ChapterCatalog.playable*4&&Journey.stages.every((s,i)=>['imp','fox','snake','zombie'].every(k=>Encounters.unit(k,i).name===s.mobNames[k]))`);
check('spawned soldiers retain their own family',`isolated();const e=mobAt('fox',180);Journey.run.stage=1;return Encounters.unit(e.type,e.family).name==='焚卷狻猊'&&e.family===0`);
check('scripture projectile requires windup and has gold theme',`isolated();const e=mobAt('snake',250);updateEnemies(.01);const before=G.eshots.length;for(let i=0;i<40;i++)updateEnemies(.02);return before===0&&G.eshots.length===1&&G.eshots[0].theme===0`);
check('blood scribe releases three-decree fan after windup',`isolated(1);mobAt('snake',250);for(let i=0;i<42;i++)updateEnemies(.02);return G.eshots.length===3&&G.eshots.every(s=>s.theme===1)`);
check('river naga releases twin soul lanterns after windup',`isolated(2);mobAt('snake',250);for(let i=0;i<42;i++)updateEnemies(.02);return G.eshots.length===2&&G.eshots.every(s=>s.theme===2)`);
check('rush windup plants feet and deals no immediate damage',`isolated();const e=mobAt('fox',180),hp=P.hp;updateEnemies(.01);const x=e.x,y=e.y;updateEnemies(.3);return P.hp===hp&&e.action==='windup'&&e.x===x&&e.y===y&&e.actionDuration>=.65`);
check('melee requires windup before damaging player',`isolated();const e=mobAt('imp',40),hp=P.hp;updateEnemies(.01);const windup=P.hp;for(let i=0;i<34;i++)updateEnemies(.02);return windup===hp&&P.hp<hp&&e.action==='strike'`);
check('melee direction stays committed when player sidesteps',`isolated();const e=mobAt('imp',40);updateEnemies(.01);const angle=e.attackAngle;P.x=e.x+100;P.y=e.y+150;for(let i=0;i<34;i++)updateEnemies(.02);return P.hp===120&&e.attackAngle===angle`);
check('heavy attack visibly recovers before attacking again',`isolated();const e=mobAt('zombie',80);for(let i=0;i<65;i++)updateEnemies(.02);return e.action==='recover'&&e.actionDuration>.8`);
check('river guardian begins with optional lamps and continuous health damage',`isolated(2);spawnBoss();const hp=G.boss.hp;hurt(G.boss,100);return G.enemies.filter(e=>e.lantern&&e.bossHelper).length===2&&G.boss.hp<hp`);
check('static boss helpers stay fixed under crowd separation',`isolated();spawnBoss();const h=G.enemies.find(e=>e.bossHelper),x=h.x,y=h.y;spawnEnemy('imp',false,{x:x+1,y});updateEnemies(.01);return h.x===x&&h.y===y`);
check('impact effects stay bounded and reset with combat',`for(let i=0;i<100;i++)Encounters.effect('impact',{x:0,y:0,r:80,theme:0});const capped=Encounters.status().effects===64;reset();return capped&&Encounters.status().effects===0`);
check('resizing preserves world positions and tide geometry',`isolated(2);G.telegraphs=[{shape:'tide',x:2800,y:700,r:40,gap:2750,safe:160}];const x=P.x,y=P.y;window.innerWidth=800;window.innerHeight=600;resize();return P.x===x&&P.y===y&&G.telegraphs[0].gap===2750&&G.telegraphs[0].safe===160&&G.telegraphs[0].y===700`);
check('corrupt progress safely falls back to first chapter',`return JourneyProgress.cleared()===0&&!JourneyProgress.canSelect(2)`,createHarness({storage:new Map([['xunsheng-progress-v1','{bad json']])}).evaluate);
check('impossible progress cannot expose final chapter without entry history',`return JourneyProgress.cleared()===1&&!JourneyProgress.canSelect(2)`,createHarness({storage:new Map([['xunsheng-progress-v1',JSON.stringify({version:1,cleared:3,entries:{}})]])}).evaluate);
check('negative time cannot rewind combat',`isolated();const clock=G.time,charge=P.energy;update(-.02);return G.time===clock&&P.energy===charge`);
console.log(count+' campaign and encounter integration checks passed');
