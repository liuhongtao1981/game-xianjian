// Integration regressions run the shipped simulation, including World and Bosses.
const assert=require('node:assert/strict');
const {createHarness}=require('./game-harness');
let count=0;
function fixture(stage=0,difficulty='normal'){
  const game=createHarness();
  game.evaluate(`Journey.begin();Journey.run.stage=${stage};Journey.run.difficulty='${difficulty}';Journey.run.ultimate='heaven';Journey.run.checkpoint=null;reset();P.crit=0;
    function challenge(){P.x=World.bossPoint().x;P.y=World.bossPoint().y+150;World.enterBoss()}
    function openWindow(){
      for(const e of G.enemies.filter(e=>e.bossHelper&&e.hp>0))hurt(e,9999);
      for(let f=0;f<400&&G.boss.action!=='exposed';f++){
        updateEnemies(.04);const tide=G.telegraphs.find(t=>t.shape==='tide'),bell=G.telegraphs.find(t=>t.bossSkill==='bell');
        if(tide){P.x=tide.gap;P.y=tide.y}else if(bell){const a=World.arena();Object.assign(P,World.clipToArena({x:a.cx+Math.sign(a.cx-bell.x||1)*250,y:a.cy+Math.sign(a.cy-bell.y||1)*180},P.r))}else if(G.telegraphs.some(t=>t.shape==='line')){Object.assign(P,World.clipToArena({x:World.arena().x+40,y:World.arena().y+40},P.r))}
        updateTelegraphs(.04);
      }
      return G.boss.action==='exposed';
    }
    function defeat(){for(let cycle=0;cycle<12&&G.boss.hp>0;cycle++){if(!openWindow())return false;hurt(G.boss,1e6);if(G.boss.hp>0)updateEnemies(.02)}settleCombat();return G.state==='win'}
  `);
  return game;
}
function check(name,source,stage=0,difficulty='normal'){
  assert.equal(fixture(stage,difficulty).evaluate(`(()=>{${source}})()`),true,name);console.log('PASS '+name);count++;
}
check('elapsed time never auto-spawns or completes guardian',`G.time=1200;updateSpawning(.01);win();return !G.bossSpawned&&G.state==='playing'`);
check('altar interaction unavailable from starting path',`World.update(.01);return !World.interact()&&!G.bossSpawned`);
check('nearby altar starts actual guardian fight',`const site=WorldNavData[0].sites.find(s=>s.kind==='boss');P.x=site.x*World.bounds().w;P.y=site.y*World.bounds().h;World.update(.01);return World.interact()&&World.active()&&G.bossSpawned&&G.state==='playing'`);
check('boss spawn is not victory',`challenge();win();return G.bossSpawned&&G.state==='playing'`);
check('only dead guardian completes stage',`challenge();return defeat()&&G.boss.killed&&Journey.run.completed.includes(0)`);
check('living players cannot lose',`die();return G.state==='playing'`);
check('zero HP ends run',`P.hp=1;hurtPlayer(1);return P.hp===0&&G.state==='dead'`);
check('death cannot be replaced by simultaneous victory',`challenge();P.hp=0;die();G.boss.hp=0;G.boss.killed=true;win();return G.state==='dead'`);
check('ordinary enemies never complete stage',`spawnEnemy('imp');hurt(G.enemies[0],999);settleCombat();return G.state==='playing'`);
check('guardian cannot spawn twice',`challenge();const n=G.enemies.length;spawnBoss();return G.enemies.length===n`);
check('guardian starts immune to chip and enormous hits',`challenge();const hp=G.boss.hp;hurt(G.boss,1);hurt(G.boss,999999);return G.boss.hp===hp`);
check('poison cannot bypass guardian protection',`challenge();G.boss.poison=3;G.boss.poisonTick=.49;const hp=G.boss.hp;updateEnemies(.02);return G.boss.hp===hp`);
check('guarded ultimate neither damages nor spends its ledger',`challenge();const hp=G.boss.hp,cast={bossDamage:0};hurt(G.boss,9999,'#ffffff',{ultimate:cast});return G.boss.hp===hp&&cast.bossDamage===0`);
check('basic swords break stronger bells but cannot skip the hammer',`challenge();for(const e of G.enemies.filter(e=>e.bossHelper)){for(let i=0;i<5;i++)hurt(e,26)}updateEnemies(.01);const hp=G.boss.hp;hurt(G.boss,999);return !G.enemies.some(e=>e.bossHelper&&e.hp>0)&&G.boss.action!=='exposed'&&G.boss.hp===hp`);
check('real hammer dodge after broken bells opens an earned window',`challenge();return openWindow()&&G.boss.brain.breaks===1&&G.boss.action==='exposed'&&P.hp===120`);
check('actual hammer hit denies the first-guardian window',`challenge();for(const e of G.enemies.filter(e=>e.bossHelper))hurt(e,9999);G.boss.actionT=2;updateEnemies(.01);const t=G.telegraphs[0];P.x=t.x;P.y=t.y;P.invuln=0;for(let i=0;i<80;i++){updateEnemies(.04);updateTelegraphs(.04)}return P.hp<120&&G.boss.brain.breaks===0&&G.boss.action!=='exposed'`);
check('exposure triples actual damage',`challenge();openWindow();const hp=G.boss.hp;hurt(G.boss,20);return hp-G.boss.hp===60`);
check('one normal window is capped at 24 percent HP',`challenge();openWindow();const hp=G.boss.hp;hurt(G.boss,1e6);hurt(G.boss,1e6);return hp-G.boss.hp===Math.ceil(G.boss.maxHp*.24)&&G.boss.hp>0`);
check('four perfect normal windows cannot kill',`challenge();for(let i=0;i<4;i++){openWindow();hurt(G.boss,1e6);updateEnemies(.01)}return G.boss.hp>0&&G.boss.brain.breaks===4`);
check('phase two follows earned damage windows',`challenge();for(let i=0;i<3;i++){openWindow();hurt(G.boss,1e6);updateEnemies(.01)}return G.boss.phase===2&&G.boss.brain.phaseAnnounced`);
check('guardian contact alone causes no damage',`challenge();P.x=G.boss.x;P.y=G.boss.y;updateEnemies(.01);return P.hp===120`);
check('ultimate spends charge and grants configured protection',`return tryUltimate()&&P.energy===0&&P.ultCd===Journey.ultimate().cd&&P.invuln>=Journey.ultimate().invuln`);
check('ultimate cannot be spammed',`tryUltimate();return !tryUltimate()`);
check('ultimate waits for visible impact',`spawnEnemy('imp',false,{x:P.x+60,y:P.y});tryUltimate();G.eshots=[{x:P.x,y:P.y}];updateUltimate(.6);return G.enemies[0].hp>0&&G.eshots.length===1`);
check('heaven hits nearby foes and clears hostile fire',`spawnEnemy('imp',false,{x:P.x+60,y:P.y});tryUltimate();G.eshots=[{x:P.x,y:P.y}];G.telegraphs=[{x:P.x,y:P.y}];updateUltimate(.91);return G.enemies[0].hp===0&&!G.eshots.length&&!G.telegraphs.length`);
check('low charge prevents ultimate',`P.energy=99;return !tryUltimate()`);
check('cooldown prevents ultimate',`P.ultCd=1;return !tryUltimate()`);
check('pause freezes simulation and prevents ultimate',`G.state='paused';const t=G.time;update(1);return !tryUltimate()&&G.time===t&&P.energy===100`);
check('nonpiercing projectile hits only one foe',`spawnEnemy('imp',false,{x:P.x,y:P.y});spawnEnemy('imp',false,{x:P.x,y:P.y});const hp=G.enemies[1].hp;G.shots=[{x:P.x,y:P.y,vx:0,vy:0,r:6,dmg:5,life:1,color:'#fff',hit:new Set(),pierce:0,trail:[]}];updateShots(.01);return G.enemies[1].hp===hp`);
check('telegraph damages only once after warning',`G.telegraphs=[{x:P.x,y:P.y,r:80,life:1,total:1,dmg:20}];updateTelegraphs(.5);const before=P.hp;updateTelegraphs(.6);return before===120&&P.hp===100&&!G.telegraphs.length`);
check('kill rewards cannot duplicate',`spawnEnemy('imp');killEnemy(G.enemies[0]);killEnemy(G.enemies[0]);return G.kills===1`);
check('victory takes priority over experience popup',`challenge();for(let i=0;i<4;i++){openWindow();hurt(G.boss,1e6);updateEnemies(.01)}openWindow();G.orbs=[{x:P.x,y:P.y,vx:0,vy:0,value:999,life:10}];hurt(G.boss,1e6);update(.01);return G.state==='win'&&P.level===1`);
check('restart resets ultimate boss and world',`challenge();tryUltimate();reset();return G.state==='playing'&&P.hp===120&&P.energy===100&&!G.ultimate&&!G.bossSpawned&&!World.active()`);
check('running advances distance-driven sprite frames',`keys.d=true;updatePlayer(.06);const a=Motion.frame(P,'hero');updatePlayer(.18);const b=Motion.frame(P,'hero');return a.state==='run'&&b.state==='run'&&a.col!==b.col`);
check('decelerating after release restores idle animation',`keys.d=true;updatePlayer(.1);clearInput();for(let i=0;i<20;i++)updatePlayer(.02);return Motion.frame(P,'hero').state==='idle'&&P.vx===0`);
check('sword projectile releases after actual windup',`spawnEnemy('imp',false,{x:P.x+200,y:P.y});SPELLS.yujian.cast(1);const before=G.shots.length;Motion.update(.13);const winding=G.shots.length;Motion.update(.02);return before===0&&winding===0&&G.shots.length===1`);
check('reset cancels casts queued by previous attempt',`spawnEnemy('imp',false,{x:P.x+200,y:P.y});SPELLS.yujian.cast(1);reset();Motion.update(.5);return !G.shots.length`);
check('attack animation progresses through poses',`Motion.cast('yujian',{x:P.x+100,y:P.y});const a=Motion.frame(P,'hero');updatePlayer(.18);const b=Motion.frame(P,'hero');return a.state==='attack'&&b.state==='attack'&&a.col!==b.col`);
check('moving left turns character',`keys.a=true;updatePlayer(.1);return P.look===-1`);
check('paused game freezes actor animation',`G.state='paused';const anim=P.animTime;update(.5);return P.animTime===anim`);
check('ultimate has casting pose',`tryUltimate();return Motion.frame(P,'hero').state==='ultimate'`);
check('restart clears lingering spell visuals',`Motion.emit('fire',10,10);reset();return Motion.status().effects===0`);
check('canonical ordeals remain ordered and visually distinct',`return Journey.stages.map(s=>s.title).join(',')==='金蝉遭贬,出胎几杀,满月抛江'&&new Set(Journey.stages.map(s=>s.background)).size===3`);
check('poison damages destructible helpers',`challenge();const seal=G.enemies.find(e=>e.seal),hp=seal.hp;seal.poison=1;seal.poisonTick=.49;updateEnemies(.02);return seal.hp<hp`);
check('ultimate respects exposure budget and accounts actual damage',`challenge();openWindow();const h=G.boss.hp,cast={bossDamage:0};hurt(G.boss,1e6,'#ffffff',{ultimate:cast});hurt(G.boss,1e6,'#ffffff',{ultimate:cast});return h-G.boss.hp===Math.ceil(G.boss.maxHp*.24)&&cast.bossDamage===h-G.boss.hp`);
check('lotus heals shields and creates persistent field',`Journey.run.ultimate='lotus';P.hp=40;tryUltimate();updateUltimate(.7);return P.hp>40&&P.shield===40&&G.pools.some(p=>p.ward)`);
check('lotus retains distant hostile projectiles',`Journey.run.ultimate='lotus';G.eshots=[{x:P.x+400,y:P.y}];tryUltimate();updateUltimate(.7);return G.eshots.length===1`);
check('river launches eighteen ultimate projectiles',`Journey.run.ultimate='river';tryUltimate();updateUltimate(1.1);return G.shots.length===18&&G.shots.every(s=>s.ultimate)`);
check('late ultimate kills cannot refund energy',`spawnEnemy('imp');P.energy=0;hurt(G.enemies[0],999,'#ffffff',{ultimate:{bossDamage:0}});return P.energy===0`);
check('uncleared stage cannot advance',`return !(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power')&&Journey.run.stage===0`);
check('victory carries build and camp reward into next ordeal',`challenge();P.spells.wulei=2;P.hp=15;defeat();const damage=P.dmg;return (G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power')&&Journey.run.stage===1&&P.dmg===damage*1.1&&P.spells.wulei===2&&P.hp>=P.maxHp*.7&&G.state==='story'`);
check('retry discards failed-stage loot',`challenge();defeat();(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power');const dmg=P.dmg;P.dmg=99;P.spells.jiushen=5;reset();return P.dmg===dmg&&!P.spells.jiushen&&Journey.run.stage===1`);
check('blood guardian needs broken decrees and actual dodged slashes',`challenge();return openWindow()&&G.boss.brain.breaks===1&&G.boss.action==='exposed'`,1);
check('river guardian needs broken lamps and two safe tide impacts',`challenge();return openWindow()&&G.boss.brain.breaks===1&&G.boss.action==='exposed'`,2);
check('tide cannot hit beyond its world bounds',`P.x=500;P.y=700;G.telegraphs=[{shape:'tide',x:2800,y:700,left:2170,right:3430,gap:2800,safe:150,r:50,dmg:30,life:.01}];updateTelegraphs(.02);return P.hp===120`,2);
check('final ordeal cannot advance beyond campaign',`challenge();defeat();return !(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power')&&Journey.run.stage===2&&Journey.run.completed.includes(2)`,2);
check('story difficulty grants larger health buffer',`return P.hp===160&&P.maxHp===160`,0,'story');
check('nightmare incoming damage is scaled',`hurtPlayer(20);return P.hp===90`,0,'nightmare');
check('warning duration retains readable minimum',`return Journey.warning(.2)>=.65`,2,'nightmare');
check('journal preserves paused state',`G.state='paused';Journey.journal();document.getElementById('closeJournalBtn').onclick();return G.state==='paused'`);
check('negative dt cannot rewind simulation',`const time=G.time,charge=P.energy;update(-.1);return G.time===time&&P.energy===charge`);
console.log(count+' combat integration checks passed');
