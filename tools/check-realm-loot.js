const assert=require('node:assert/strict');
const {createHarness}=require('./game-harness');
let passed=0;
function check(name,source){const h=createHarness();assert.equal(h.evaluate(`(()=>{${source}})()`),true,name);console.log('PASS '+name);passed++;}
check('each realm requires all three main-story clears before its outside challenges unlock',`
  RunSave.start(0);P.cultivation.realm=3;RunSave.save();
  for(let realm=0;realm<4;realm++)for(let count=0;count<=3;count++){
    JourneyProgress.restore({version:1,cleared:realm*3+count,entries:{}});RunSave.save();
    for(let local=0;local<3;local++)if(JourneyProgress.outsideUnlocked(realm*3+local)!==(count===3))return false;
    const before=JSON.stringify(RunSave.snapshot()),started=RunSave.start(realm*3,false,false,true);
    if(started!==(count===3)||count<3&&JSON.stringify(RunSave.snapshot())!==before)return false;
  }
  return [-1,ChapterCatalog.playable,42,1.5,NaN].every(i=>!JourneyProgress.outsideUnlocked(i));`);
check('menu and result entries appear only after the actual third guardian victory',`
  RunSave.start(0);Journey.menu();const ov=document.getElementById('overlay');if(ov.innerHTML.includes('outerChallengeBtn'))return false;
  RunSave.start(0);
  for(let stage=0;stage<3;stage++){
    G.state='playing';World.enterBoss();G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();
    if(ov.innerHTML.includes('endOuterBtn')!==(stage===2))return false;
    if(stage<2&&!Journey.next('power'))return false;
  }
  Journey.menu();return ov.innerHTML.includes('outerChallengeBtn')&&!JourneyProgress.outsideUnlocked(3);`);
check('older unqualified outside saves return to the main story without losing materials',`
  RunSave.start(0);Journey.run.extramural=true;P.cultivation.materials.core1=1;P.cultivation.materials.essence=4;
  G.state='playing';World.enterBoss();RunSave.save();
  if(!RunSave.continueRun())return false;
  return !Journey.run.extramural&&!G.bossSpawned&&G.state==='story'&&P.cultivation.materials.core1===1&&P.cultivation.materials.essence===4&&JourneyProgress.cleared()===0&&!RunSave.snapshot().run.extramural;`);
check('all released bosses roll at the exact 30 percent boundary for their own realm',`
  RunSave.start(0);JourneyProgress.restore({version:1,cleared:ChapterCatalog.playable,entries:{}});P.cultivation.realm=Math.floor((ChapterCatalog.playable-1)/3);RunSave.save();const random=Math.random;
  for(let stage=0;stage<ChapterCatalog.playable;stage++)for(const roll of [.299999,.3,.999]){
    RunSave.start(stage,false,true);G.state='win';G.boss={xp:0};
    const r=ChapterCatalog.reward(stage),before=P.cultivation.materials[r.core]||0;
    Math.random=()=>roll;Cultivation.victory();Math.random=random;
    if((P.cultivation.materials[r.core]||0)-before!==(roll<.3?Math.max(1,r.count):0)||G.coreReward)return false;
    const amount=P.cultivation.materials[r.core]||0;Cultivation.victory();
    if((P.cultivation.materials[r.core]||0)!==amount)return false;
  }return true;`);
check('failed drop rolls survive reload without a second roll',`
  RunSave.start(0);G.state='playing';World.enterBoss();const random=Math.random;
  Math.random=()=>.99;G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();Math.random=random;
  if((P.cultivation.materials.core1||0)!==0||!RunSave.continueRun())return false;
  Math.random=()=>0;Cultivation.victory();Math.random=random;
  return (P.cultivation.materials.core1||0)===0&&JourneyProgress.cleared()===1;`);
check('two outside victories provide exactly one full material recipe without advancing the story',`
  RunSave.start(0);for(let i=0;i<3;i++)JourneyProgress.clear(i);RunSave.save();
  for(let n=1;n<=2;n++){
    if(!RunSave.start(0,false,false,true))return false;
    document.getElementById('enterStageBtn').onclick();
    if(!World.active()||!G.boss||!Journey.run.extramural)return false;
    G.boss.hp=0;G.boss.killed=true;win();
    const before=JSON.stringify(P.cultivation.materials);Journey.showEnd(true);Cultivation.victory();
    if(before!==JSON.stringify(P.cultivation.materials)||P.cultivation.materials.core1!==n||P.cultivation.materials.essence!==4*n||JourneyProgress.cleared()!==3||Journey.next('power'))return false;
    if(!RunSave.continueRun()||!Journey.run.extramural||G.state!=='win'||P.cultivation.materials.core1!==n)return false;
  }return true;`);
check('each released realm receives half its own recipe even when the hero is stronger',`
  RunSave.start(0);JourneyProgress.restore({version:1,cleared:ChapterCatalog.playable,entries:{}});P.cultivation.realm=Math.floor((ChapterCatalog.playable-1)/3);RunSave.save();
  for(let stage=0;stage<ChapterCatalog.playable;stage++){
    if(!RunSave.start(stage,false,false,true))return false;
    const r=Cultivation.recipe(ChapterCatalog.get(stage).realm),a=P.cultivation.materials[r.core]||0,b=P.cultivation.materials.essence;
    G.state='win';Cultivation.victory();RunSave.save();
    if((P.cultivation.materials[r.core]||0)-a!==r.coreCount/2||P.cultivation.materials.essence-b!==r.essence/2)return false;
  }return true;`);
check('outside boss health and actual damage are twice normal across all difficulties',`
  for(const difficulty of Object.keys(Journey.difficulties)){
    Journey.run.difficulty=difficulty;Journey.run.extramural=false;Journey.run.stage=0;reset();World.enterBoss();
    const hp=G.boss.maxHp,low=CombatScaling.hit(1,{kind:'boss',scale:1}).damage,high=CombatScaling.hit(1e9,{kind:'boss',scale:1}).damage;
    Journey.run.extramural=true;G.enemies=[];G.boss=null;G.bossSpawned=false;spawnBoss();
    if(G.boss.maxHp!==hp*2||CombatScaling.hit(1,{kind:'boss',scale:1}).damage!==low*2||CombatScaling.hit(1e9,{kind:'boss',scale:1}).damage!==high*2)return false;
    if(CombatScaling.hit(10,{kind:'ordinary',scale:1}).damage!==CombatScaling.hit(10,{kind:'environment',scale:1}).damage)return false;
  }return true;`);
check('outside refresh and death retry preserve mode, loot and direct arena entry',`
  RunSave.start(0);for(let i=0;i<3;i++)JourneyProgress.clear(i);RunSave.save();
  RunSave.start(0,false,false,true);document.getElementById('enterStageBtn').onclick();RunSave.save();
  if(!RunSave.continueRun()||G.state!=='story'||!Journey.run.extramural)return false;
  document.getElementById('enterStageBtn').onclick();if(!World.active()||!G.boss.name.startsWith('域外'))return false;
  P.hp=0;die();if(!RunSave.retry()||!Journey.run.extramural)return false;
  document.getElementById('enterStageBtn').onclick();return World.active()&&(P.cultivation.materials.core1||0)===0;`);
check('outside entries respect progression locks and malformed modes are rejected',`
  if(RunSave.start(3,false,false,true))return false;RunSave.start(0);const s=RunSave.snapshot();
  delete s.run.extramural;if(!RunSave.valid(s))return false;s.run.extramural='true';return !RunSave.valid(s);`);
check('returning to normal play clears the outside multiplier',`
  RunSave.start(0);for(let i=0;i<3;i++)JourneyProgress.clear(i);RunSave.save();
  RunSave.start(0,false,false,true);Journey.menu();if(!RunSave.start(0))return false;
  return !Journey.run.extramural&&!RunSave.snapshot().run.extramural;`);
check('elite and full-build chests cannot bypass boss core acquisition',`
  RunSave.start(0);Cultivation.onKill({elite:true,encounterId:4});
  P.equips=EQUIPS.map(e=>e.id);P.spells=Object.fromEntries(SpellGift.keys.slice(0,6).map(k=>[k,SPELLS[k].max]));
  const r=CombatRewards.enhancedChest();return !(P.cultivation.materials.core1||0)&&r.kind==='material'&&JSON.stringify(r.materials)==='{"essence":8}';`);
check('click preview plays linked scenes while preserving the active saved run',`
  RunSave.start(0);RunSave.save();Journey.menu();const saved=JSON.stringify(RunSave.snapshot());
  for(let stage=0;stage<ChapterCatalog.playable;stage++){
    Journey.playStory(stage,true);const ov=document.getElementById('overlay');
    if(stage&&!ov.innerHTML.includes(Journey.stages[stage-1].clue.name))return false;
    document.getElementById('storyPauseBtn').onclick();document.getElementById('storyNextBtn').onclick();
    if(!ov.innerHTML.includes('2 / '))return false;
    document.getElementById('backChaptersBtn').onclick();
  }return JSON.stringify(RunSave.snapshot())===saved&&G.state==='start';`);
check('story autoplay advances scenes, pauses and cancels stale timers on exit',`
  Sound.set('muted',true);const pending=[];setTimeout=(fn,delay)=>pending.push({fn,delay});
  Journey.playStory(0,true);const ov=document.getElementById('overlay'),first=pending.pop();
  if(first.delay<6500)return false;first.fn();if(!ov.innerHTML.includes('2 / 3'))return false;
  const stale=pending.pop();document.getElementById('storyPauseBtn').onclick();stale.fn();
  if(!ov.innerHTML.includes('2 / 3'))return false;
  document.getElementById('storyPauseBtn').onclick();const resumed=pending.pop();
  resumed.fn();if(!ov.innerHTML.includes('3 / 3'))return false;
  Journey.playStory(0,true);const exited=pending.pop();Journey.menu();const menu=ov.innerHTML;
  exited.fn();return ov.innerHTML===menu;`);
console.log(passed+' realm loot, outside challenge and linked story checks passed');
