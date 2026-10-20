// Timing and movement checks execute the actual actor modules with an isolated arena.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={console,Math,Image:class{complete=false;naturalWidth=0;},
  Journey:{run:{stage:0},difficulty:()=>({warning:1,projectile:1}),stage:()=>({bossRow:0})},
  Sound:{spell(){},effects(){},registerCaption(){}},
  P:{x:50,y:0,r:12,hp:100,facing:{x:1,y:0}},
  G:{state:'playing',time:0,enemies:[],eshots:[],telegraphs:[],ultimate:null},
  hurtPlayer(damage){context.P.hp-=damage;context.hits++;},hits:0,
  nearest:()=>({x:150,y:0}),W:1000,H:800};
vm.createContext(context);
for(const file of ['chapters.js','chapters-content.js','infant.js','infant-uv.js','huashen.js','huashen-uv.js','lianxu.js','lianxu-uv.js','growth.js','golden-uv.js','encounters.js','motion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../prototype',file),'utf8'),context);
const run=code=>vm.runInContext(code,context);
let passed=0;
function check(name,code){assert.equal(run(code),true,name);passed++;console.log('PASS',name);}
run(`function enemy(type='imp'){return {id:1,type,family:0,x:0,y:0,r:16,hp:100,dmg:10,speed:80,atkCd:0,skillCd:0};}
function tick(e,dt){const dx=P.x-e.x,dy=P.y-e.y;Encounters.attackMob(e,dt,dx,dy,Math.hypot(dx,dy)||1);}
function arena(){P.x=50;P.y=0;P.hp=100;hits=0;G.eshots=[];G.enemies=[];Motion.reset();}`);
check('touching a melee enemy starts a visible windup without damage',`arena();var e=enemy();tick(e,.01);e.action==='windup'&&P.hp===100`);
check('melee remains harmless throughout anticipation',`tick(e,.3);e.action==='windup'&&P.hp===100`);
check('melee damage occurs exactly as the strike pose starts',`tick(e,.36);e.action==='strike'&&P.hp===88&&hits===1`);
check('one melee swing cannot damage twice',`tick(e,.1);tick(e,.1);e.action==='recover'&&hits===1`);
check('melee feet remain planted during recovery',`const old=e.x;tick(e,.3);e.x===old&&e.action==='recover'`);
check('dodging out of a locked attack direction avoids the hit',`arena();e=enemy();tick(e,.01);P.y=100;tick(e,.66);P.hp===100`);
check('moving behind an enemy avoids its forward swing',`arena();e=enemy();tick(e,.01);P.x=-50;tick(e,.66);P.hp===100`);
check('ranged enemies prepare their cast before spawning projectiles',`arena();P.x=300;e=enemy('snake');tick(e,.01);tick(e,.4);e.action==='windup'&&G.eshots.length===0`);
check('ranged shots spawn on release and keep the locked aim',`P.y=100;tick(e,.37);G.eshots.length===1&&Math.abs(G.eshots[0].vy)<.001`);
check('rush movement cannot start during its warning',`arena();P.x=200;e=enemy('fox');tick(e,.01);tick(e,.5);e.x===0&&e.action==='windup'&&hits===0`);
check('rush swept collision catches crossing but damages only once',`tick(e,.39);P.x=75;tick(e,.2);tick(e,.2);hits===1&&e.action==='recover'`);
check('sidestepping the warned charge avoids damage',`arena();P.x=200;e=enemy('fox');tick(e,.01);P.y=80;tick(e,.9);tick(e,.4);hits===0`);
check('heavy strikes cannot leave an independent delayed damage zone',`arena();e=enemy('zombie');tick(e,.01);tick(e,.6);G.telegraphs.length===0&&P.hp===100&&e.action==='windup'`);
check('heavy damage is synchronized with the weapon impact',`tick(e,.43);e.action==='strike'&&P.hp===83.5`);
check('walk animation follows distance rather than elapsed time',`var a={x:0,y:0},b={x:0,y:0};Motion.step(a,.1,60,0);Motion.step(b,.5,60,0);Motion.frame(a,'hero').col===Motion.frame(b,'hero').col`);
check('a stationary actor never advances its walking distance',`var walked=a.walkDistance;Motion.step(a,1,0,0);a.walkDistance===walked&&Motion.frame(a,'hero').state==='idle'`);
check('a braced enemy keeps its foot animation planted when pushed',`e.action='windup';e.walkDistance=20;Motion.step(e,.2,10,0);e.walkDistance===20&&!e.moving`);
check('hero spell damage waits for the release animation',`arena();var releases=0;var spells={yujian:{cast(){releases++;Motion.cast('yujian',{x:150,y:0});}}};Motion.bindSpells(spells);spells.yujian.cast(1);Motion.update(.13);releases===0&&Motion.frame(P,'hero').col===0`);
check('hero spell releases once exactly on its visible strike pose',`Motion.update(.02);releases===1&&Motion.frame(P,'hero').col===1&&Motion.status().pendingCasts===0`);
check('reset discards unfinished casts',`Motion.update(.12);spells.yujian.cast(1);Motion.reset();Motion.update(.5);releases===1`);
check('simultaneous spells queue without overwriting the current release pose',`arena();var order=[];var paired={yujian:{cast(){order.push('sword');}},wulei:{cast(){order.push('thunder');}}};Motion.bindSpells(paired);paired.yujian.cast(1);paired.wulei.cast(1);Motion.update(.15);order.join(',')==='sword'&&P.attackRelease===.14&&Motion.frame(P,'hero').col===1&&Motion.status().pendingCasts===1`);
check('the queued spell receives its own anticipation after recovery',`Motion.update(.12);Motion.update(.1);order.length===1&&Motion.status().activeCast==='wulei'&&Motion.frame(P,'hero').col===0`);
check('release updates facing to the actual retargeted enemy',`Motion.update(.13);Motion.reset();paired.yujian.cast(1);nearest=()=>({x:P.x-150,y:P.y});Motion.update(.15);P.look===-1&&Math.abs(P.attackAngle-Math.PI)<.001&&Motion.frame(P,'hero').col===1`);
check('an ultimate delays normal casts and restores their windup after it ends',`Motion.reset();paired.yujian.cast(1);const previous=order.length;G.ultimate={age:0};Motion.step(P,1,0,0);Motion.update(1);G.ultimate=null;Motion.update(.01);order.length===previous&&Motion.frame(P,'hero').col===0`);
console.log(`${passed} actor timing and movement checks passed.`);
