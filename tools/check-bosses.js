// Exercise the actual guardian state machine without art/audio or a running browser.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../prototype/bosses.js'),'utf8');
let checks=0;
function fixture(stage=0,difficulty='normal'){
  const context={console,Math,W:980,H:720};vm.createContext(context);
  vm.runInContext(`
    const G={enemies:[],telegraphs:[],eshots:[],uid:1,shake:0};
    const P={x:2500,y:1950,r:15,hp:120,invuln:0};
    const World={arena:()=>({x:2000,y:1500,w:1000,h:750,cx:2500,cy:1875})};
    const Journey={run:{stage:${stage},difficulty:'${difficulty}'},stages:[{color:'#d8ba73',boss:'缄口监院',bossSpeed:42},{color:'#d78575',boss:'血诏司命',bossSpeed:54},{color:'#8acbd0',boss:'沉灯河伯',bossSpeed:48}],
      stage(){return this.stages[this.run.stage]},difficulty:()=>({speed:1,projectile:1}),warning:n=>Math.max(.65,n),hazard(x,y,options){G.telegraphs.push({x,y,...options})}};
    const Sound={weakness(){},omen(){},guardian(){}};
    const Encounters={effect(){}};
    function addText(){}
    function killEnemy(e){if(e.killed)return;e.killed=true;e.hp=0;Bosses.onHelperKilled(e)}
  `,context);
  vm.runInContext(source,context);
  vm.runInContext(`
    const boss={id:G.uid++,x:2500,y:1750,hp:2000,maxHp:2000,r:48,speed:40,boss:true,phase:1};G.boss=boss;G.enemies.push(boss);Bosses.init(boss);
    function helperList(){return G.enemies.filter(e=>e.bossHelper&&e.hp>0)}
    function breakHelpers(){for(const e of helperList())killEnemy(e);Bosses.update(boss,.01)}
    function step(dt=.02){
      Bosses.update(boss,dt);
      for(const t of G.telegraphs){t.life-=dt;if(t.life<=0&&!t.struck){t.struck=true;Bosses.onImpact(t,false)}}
      G.telegraphs=G.telegraphs.filter(t=>t.life>0);
    }
    function waitFor(action,limit=12){for(let t=0;t<limit;t+=.02){if(boss.action===action)return true;step()}return boss.action===action}
    function earnBellWindow(){breakHelpers();return waitFor('exposed')}
    function deal(n){const actual=Bosses.filterDamage(boss,Math.max(2,Math.round(n*Bosses.damageMultiplier(boss))));boss.hp-=actual;return actual}
  `,context);
  return code=>vm.runInContext(code,context);
}
function check(name,execute){assert.equal(execute(),true,name);checks++;console.log('PASS '+name);}

check('guardian begins fully protected, with three attackable bells',()=>fixture()(`boss.action==='guard'&&helperList().length===3&&helperList().every(e=>e.seal&&e.hp>0)`));
check('guard blocks even rounded minimum damage and enormous ultimate damage',()=>fixture()(`deal(1)===0&&deal(1e9)===0&&boss.hp===2000`));
check('basic swords can destroy all stronger mechanics within nine ordinary hits',()=>[0,1,2].every(stage=>fixture(stage)(`helperList().every(e=>Math.ceil(e.hp/26)<=9)`)));
check('breaking only part of a bell ward does not expose boss',()=>fixture()(`killEnemy(helperList()[0]);Bosses.update(boss,.1);boss.action!=='exposed'&&deal(1000)===0`));
check('destroying three bells alone cannot expose the guardian',()=>fixture()(`breakHelpers();boss.action!=='exposed'&&deal(1e9)===0&&boss.brain.mechanismReady`));
check('destroyed bells plus an actually dodged hammer earn output after recovery',()=>fixture()(`earnBellWindow();boss.action==='exposed'&&Bosses.damageMultiplier(boss)===3&&Bosses.hud(boss).remaining>5`));
check('one window has a hard cap and subsequent hits cannot chip through',()=>fixture()(`earnBellWindow();const damage=deal(1e9);damage===480&&deal(1000)===0&&boss.hp===1520`));
check('four perfect standard windows cannot kill the guardian',()=>fixture()(`for(let i=0;i<4;i++){earnBellWindow();deal(1e9);Bosses.update(boss,.01)}boss.hp===80&&boss.brain.breaks===4`));
check('the fifth earned standard window permits victory',()=>fixture()(`for(let i=0;i<5;i++){earnBellWindow();deal(1e9);if(boss.hp>0)Bosses.update(boss,.01)}boss.hp===0&&boss.brain.breaks===5`));
check('an unused window expires and requires new mechanics',()=>fixture()(`earnBellWindow();Bosses.update(boss,7);boss.action==='guard'&&helperList().length===3&&deal(100)===0`));
check('phase two is announced only after a completed window',()=>fixture()(`earnBellWindow();boss.hp=900;Bosses.update(boss,7);boss.phase===2&&boss.brain.phaseAnnounced`));
check('boss has no immediate collision contact damage',()=>fixture()(`P.x=boss.x;P.y=boss.y;Bosses.update(boss,.2);P.hp===120`));
check('windup locks direction before the player moves',()=>fixture(1)(`boss.actionT=2;Bosses.update(boss,.01);const angle=boss.attackAngle,x=boss.x,y=boss.y;P.x-=500;Bosses.update(boss,.1);boss.action==='windup'&&boss.attackAngle===angle&&boss.x===x&&boss.y===y`));
check('boss warnings last at least 0.65 seconds',()=>[0,1,2].every(stage=>fixture(stage,'nightmare')(`boss.actionT=2;Bosses.update(boss,.01);G.telegraphs.length>0&&G.telegraphs.every(t=>t.life>=.65)`)));
check('a baited hammer can break its own bell',()=>fixture()(`const bell=helperList()[0];P.x=bell.x;P.y=bell.y;boss.actionT=2;Bosses.update(boss,.01);const t=G.telegraphs[0];Bosses.onImpact(t,false);bell.killed&&helperList().length===2`));
check('a hammer before breaking the last bell cannot count as the ritual',()=>fixture()(`boss.actionT=2;Bosses.update(boss,.01);breakHelpers();const t=G.telegraphs[0];Bosses.onImpact(t,false);t.struck=true;G.telegraphs=[];for(let f=0;f<140;f++)Bosses.update(boss,.02);boss.brain.breaks===0`));
check('being hit by the required hammer denies exposure',()=>fixture()(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);Bosses.onImpact(G.telegraphs[0],true);G.telegraphs=[];for(let f=0;f<140;f++)Bosses.update(boss,.02);boss.brain.breaks===0&&deal(1000)===0`));
check('clearing the hammer warning does not fake a successful dodge',()=>fixture()(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);G.telegraphs=[];for(let f=0;f<140;f++)Bosses.update(boss,.02);boss.brain.breaks===0&&deal(1000)===0`));
check('cancelled hammer retries without a deadlock',()=>fixture()(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);G.telegraphs=[];for(let f=0;f<260;f++)Bosses.update(boss,.02);G.telegraphs.some(t=>t.bossSkill==='bell'&&t.bossToken>1)&&boss.brain.breaks===0`));
check('actual hammer impact must finish recovery before exposure',()=>fixture()(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);Bosses.onImpact(G.telegraphs[0],false);G.telegraphs=[];Bosses.update(boss,1.13);const before=boss.action;Bosses.update(boss,.36);const recovering=boss.action;Bosses.update(boss,.86);before==='strike'&&recovering==='recover'&&boss.action==='exposed'`));
check('destroying blood decrees alone does not open a window',()=>fixture(1)(`breakHelpers();boss.action!=='exposed'&&deal(100)===0`));
check('decree duel must have two actual attack impacts',()=>fixture(1)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);boss.brain.pending.mechanism&&G.telegraphs.length===2&&G.telegraphs.every(t=>t.bossSkill==='duel')`));
check('dodging both locked slashes opens recovery vulnerability',()=>fixture(1)(`breakHelpers();waitFor('exposed');boss.action==='exposed'&&boss.brain.breaks===1`));
check('being struck by either slash denies the output window',()=>fixture(1)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);for(const t of G.telegraphs){Bosses.onImpact(t,true);t.struck=true}G.telegraphs=[];for(let t=0;t<4;t+=.02)Bosses.update(boss,.02);boss.brain.breaks===0&&deal(1000)===0`));
check('cleared telegraphs do not falsely count as a successful dodge',()=>fixture(1)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);G.telegraphs=[];for(let t=0;t<4;t+=.02)Bosses.update(boss,.02);boss.brain.breaks===0&&boss.action!=='exposed'`));
check('a cleared ritual retries without soft locking',()=>fixture(1)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);G.telegraphs=[];for(let t=0;t<5;t+=.02)Bosses.update(boss,.02);G.telegraphs.some(t=>t.bossSkill==='duel'&&t.bossToken>1)`));
check('breaking lamps alone does not expose the river guardian',()=>fixture(2)(`breakHelpers();boss.action!=='exposed'&&helperList().length===0&&deal(1000)===0`));
check('tides are bounded in world coordinates rather than viewport width',()=>fixture(2)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);G.telegraphs.length===2&&G.telegraphs.every(t=>t.shape==='tide'&&t.left===2000&&t.right===3000&&t.gap>t.left&&t.gap<t.right&&t.safe>P.r*2+50)`));
check('fleeing outside the tide band does not complete its ritual',()=>fixture(2)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);P.y=1500;for(const t of G.telegraphs){Bosses.onImpact(t,false);t.struck=true}G.telegraphs=[];for(let t=0;t<5;t+=.02)Bosses.update(boss,.02);boss.brain.breaks===0`));
check('standing in both tide gaps reveals the reverse scale',()=>fixture(2)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);P.x=G.telegraphs[0].gap;P.y=G.telegraphs[0].y;waitFor('exposed');boss.action==='exposed'&&boss.brain.breaks===1`));
check('an old attack cannot satisfy a new mechanism',()=>fixture(1)(`breakHelpers();boss.actionT=2;Bosses.update(boss,.01);const stale={...G.telegraphs[0],bossToken:0};Bosses.onImpact(stale,false);boss.brain.pending.impacts===0`));
check('story difficulty retains four required openings',()=>fixture(0,'story')(`for(let i=0;i<3;i++){earnBellWindow();deal(1e9);Bosses.update(boss,.01)}boss.hp>0&&boss.brain.breaks===3`));
check('nightmare openings are shorter and helpers take more hits',()=>fixture(0,'nightmare')(`const hp=helperList()[0].hp;earnBellWindow();boss.actionDuration<5&&hp>130&&boss.brain.windowRemaining===400`));
check('HUD describes the live mechanism and window state',()=>fixture(2)(`let h=Bosses.hud(boss);h.helpers===2&&!h.exposed&&h.hint.includes('青色')`));
console.log(checks+' guardian state-machine checks passed');
