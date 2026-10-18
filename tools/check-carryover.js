const assert=require('node:assert/strict');
const {createHarness}=require('./game-harness');
let passed=0;
function check(name,source,h=createHarness()){
  assert.equal(h.evaluate(`(()=>{${source}})()`),true,name);
  console.log('PASS '+name);passed++;
}
const seed=`Journey.begin(0);reset();
  P.level=9;P.xp=17.5;P.xpNext=240;P.maxHp=190;P.hp=151;P.shieldMax=110;P.shield=63;
  P.speed=270;P.dmg=1.8;P.cdr=.72;P.crit=.24;P.pickup=170;P.xpMul=1.35;
  P.armor=.18;P.regen=1.5;P.poison=true;P.spells={yujian:4,wanjian:3,bingxin:2};
  P.equips=['mujian','wudu'];P.energy=27;P.ultCd=8.4;P.dashCd=.7;
  P.t={yujian:.6,bingxin:4.2};P.growthChoices=8;G.runChoices=8;`;
const victory=`spawnBoss();G.boss.hp=0;G.boss.killed=true;win();`;
const h=createHarness();
check('victory saves all growth, shield, charge and cooldowns before reward selection',`${seed}${victory}
  const b=JourneyProgress.snapshot().entries[1].build;
  return b.level===9&&b.xp===17.5&&b.xpNext===240&&b.shield===63&&b.energy===27&&b.ultCd===8.4&&b.dashCd===.7&&b.t.bingxin===4.2&&b.growthChoices===8&&b.poison&&b.armor===.18&&b.spells.wanjian===3;`,h);
check('real next-stage reset preserves the complete build and applies only the chosen reward',`
  if(G.coreReward)Cultivation.claimCore(G.coreReward.max);const expected=JourneyProgress.capture(P);expected.dmg*=1.1;expected.hp=Math.min(expected.maxHp,Math.max(expected.hp,expected.maxHp*.55)+expected.maxHp*.15);
  if(!(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power'))return false;
  return Journey.run.stage===1&&JSON.stringify(JourneyProgress.capture(P))===JSON.stringify(expected)&&G.runChoices===8&&G.state==='story';`,h);
check('third chapter inherits the second chapter upgrades and current resources',`
  G.state='playing';P.level=11;P.xp=23.25;P.xpNext=400;P.spells.wanjian=4;P.shield=18;P.energy=0;P.ultCd=11;P.t.bingxin=2;P.growthChoices=10;
  ${victory}const expectedHp=P.maxHp+20;if(!(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('body'))return false;
  return Journey.run.stage===2&&P.level===11&&P.xp===23.25&&P.xpNext===400&&P.spells.wanjian===4&&P.maxHp===expectedHp&&P.shield===18&&P.energy===0&&P.ultCd===11&&P.t.bingxin===2&&G.runChoices===10;`,h);
check('chapter entry restores the full saved build after browser reload',`
  Journey.begin(2);reset();return P.level===11&&P.xp===23.25&&P.shield===18&&P.energy===0&&P.ultCd===11&&P.t.bingxin===2&&P.equips.includes('wudu')&&G.runChoices===10;`,createHarness({storage:h.storage}));
check('retry restores independent entry timers without retaining failed-stage changes',`
  const old=JourneyProgress.capture(P);G.state='playing';P.level=99;P.energy=100;P.t.bingxin=0;P.spells.wanjian=1;P.equips.length=0;reset();
  return JSON.stringify(JourneyProgress.capture(P))===JSON.stringify(old);`,h);
check('upgrades selected in gameplay increment the inherited choice counter',`
  reset();gainXP(10);if(G.state!=='levelup')return false;pickCard(0);Journey.saveBuild(P);reset();
  return P.level===2&&P.growthChoices===1&&G.runChoices===1;`);
const oldStorage=new Map(h.storage);
const legacy=JSON.parse(oldStorage.get('xunsheng-progress-v1'));
for(const entry of Object.values(legacy.entries))for(const key of ['shield','energy','ultCd','dashCd','growthChoices','t'])delete entry.build[key];
oldStorage.set('xunsheng-progress-v1',JSON.stringify(legacy));
check('legacy version-one saves retain levels spells and unlocks with safe missing-field defaults',`
  Journey.begin(2);reset();return JourneyProgress.cleared()===2&&P.level===11&&P.spells.wanjian===4&&P.energy===100&&P.shield===0&&P.ultCd===0&&G.runChoices===10&&Object.keys(P.t).length===0;`,createHarness({storage:oldStorage}));
check('saved timers spells and equipment never alias the live player',`${seed}
  Journey.saveBuild(P);P.t.bingxin=0;P.spells.yujian=1;P.equips.length=0;reset();
  P.t.bingxin=1;P.spells.yujian=2;P.equips.pop();reset();return P.t.bingxin===4.2&&P.spells.yujian===4&&P.equips.length===2;`);
console.log(passed+' cross-chapter state checks passed');
