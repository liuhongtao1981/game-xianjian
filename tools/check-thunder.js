const assert=require('node:assert/strict'),{createHarness}=require('./game-harness');let passed=0;
function check(name,source,options={}){
  const h=createHarness(options);
  assert.equal(h.evaluate(`(()=>{reset();G.state='playing';G.enemies=[];P.spells={wulei:7};P.cultivation.realm=2;P.crit=0;P.dmg=1;World.camera(0,true);
    function foe(dx,dy=0,hp=100000){const e=spawnEnemy('imp',false,{x:P.x+dx,y:P.y+dy});e.hp=e.maxHp=hp;return e;}
    function cast(l=7){SPELLS.wulei.cast(l);Motion.update(.3);Motion.update(.12);}
    const damage=Math.round(SpellGrowth.spec('wulei',7).damage);
    ${source}})()`),true,name);
  console.log('PASS '+name);passed++;
}
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  check('seven strikes split four and three on '+viewport.width+'px screen',`const a=foe(60),b=foe(-90);cast();return a.maxHp-a.hp===4*damage&&b.maxHp-b.hp===3*damage&&G.bolts.length===7;`,viewport);
  check('offscreen enemies do not steal concentrated strikes on '+viewport.width+'px screen',`const a=foe(60),v=World.view(),b=foe(0);b.x=v.x+v.w+20;b.y=P.y;cast();return a.maxHp-a.hp===7*damage&&b.hp===b.maxHp;`,viewport);
}
check('seven strikes cover seven of eight visible enemies once',`const foes=Array.from({length:8},(_,i)=>foe(60+i*25));cast();return foes.filter(e=>e.hp<e.maxHp).length===7&&foes.every(e=>e.maxHp-e.hp===damage||e.hp===e.maxHp);`);
check('dead locked and phantom targets cannot absorb spare strikes',`const a=foe(120),b=foe(20),c=foe(30),d=foe(40);b.hp=0;c.locked=true;d.phantom=true;cast();return a.maxHp-a.hp===7*damage&&c.hp===c.maxHp&&d.hp===d.maxHp;`);
check('remaining lightning retargets survivors after a kill',`const a=foe(40,0,1),b=foe(90),kills=G.kills,qi=P.cultivation.qi,earned=2*CombatRewards.forEnemy(a).qi;cast();return a.killed&&b.maxHp-b.hp===6*damage&&G.kills===kills+1&&Math.abs(P.cultivation.qi-qi-earned)<1e-8&&G.bolts.length===7;`);
check('killing every target stops without duplicate kills or rewards',`const foes=[foe(40,0,1),foe(60,0,1),foe(80,0,1)],kills=G.kills,qi=P.cultivation.qi,earned=foes.reduce((sum,e)=>sum+2*CombatRewards.forEnemy(e).qi,0);cast();return foes.every(e=>e.killed)&&G.kills===kills+3&&Math.abs(P.cultivation.qi-qi-earned)<1e-8&&G.bolts.length===3;`);
check('empty screen and out-of-range targets produce no phantom hits',`const a=foe(950);cast();return a.hp===a.maxHp&&G.bolts.length===0;`,{width:2400,height:1200});
check('farther visible enemies are covered without the old short chain limit',`const a=foe(-300),b=foe(300);cast();return a.maxHp-a.hp===4*damage&&b.maxHp-b.hp===3*damage;`);
check('queued lightning waits for release and freezes during pause',`const a=foe(70);SPELLS.wulei.cast(7);Motion.update(.1);if(a.hp!==a.maxHp)return false;G.state='paused';update(2);if(a.hp!==a.maxHp||G.bolts.length)return false;G.state='playing';Motion.update(.13);return a.maxHp-a.hp===7*damage;`);
check('all forty-four high-realm strikes concentrate with real bolts',`P.cultivation.realm=13;const a=foe(90);cast(44);const d=Math.round(SpellGrowth.spec('wulei',44).damage);return a.maxHp-a.hp===44*d&&G.bolts.length===44&&G.bolts.every(b=>b.pts.length>1&&Math.hypot(b.pts[0].x-b.pts.at(-1).x,b.pts[0].y-b.pts.at(-1).y)>0);`);
check('concentrated lightning damages guardians and preserves opening bonuses',`for(const action of ['guard','exposed']){reset();G.state='playing';World.enterBoss();const b=G.boss;G.enemies=[b];P.x=b.x-100;P.y=b.y;P.crit=0;P.dmg=1;World.camera(0,true);b.action=action;b.hp=b.maxHp=100000;cast();if(b.maxHp-b.hp!==7*Math.round(SpellGrowth.spec('wulei',7).damage*(action==='exposed'?3:1)))return false;}return true;`);
check('per-strike damage still uses character multiplier and critical hits',`P.dmg=2;P.crit=1;const a=foe(80);cast();return a.maxHp-a.hp===7*Math.round(SpellGrowth.spec('wulei',7).damage*4);`);
check('shared previews distinguish per-strike and fully concentrated damage',`const a=SpellGrowth.spec('wulei',7),b=SpellGrowth.spec('wulei',8),rows=RewardCards.spellRows('wulei',7,8),total=rows.find(r=>r.label==='单体全中基础总伤');return total.before===Math.round(a.damage)*a.count&&total.after===Math.round(b.damage)*b.count&&rows.some(r=>r.label==='每道基础雷伤')&&SpellGrowth.describe('wulei',7).includes('余雷均分集中')&&RewardCards.previewChoice({kind:'up',key:'wulei'}).note.includes('余雷均分集中');`);
check('new encounter power estimates include real concentrated lightning damage',`P.spells={wulei:6};const a=CombatScaling.scores().output;P.spells.wulei=7;const b=CombatScaling.scores().output,s=SpellGrowth.spec('wulei',7),old=SpellGrowth.spec('wulei',6),expected=(s.damage*7-old.damage*6)/SPELLS.wulei.cd*(1+P.crit);return Math.abs(b-a-expected)<1e-8;`);
console.log(passed+' lightning concentration checks passed');
