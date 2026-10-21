const assert=require('node:assert/strict'),{createHarness}=require('./game-harness');
let passed=0;
function check(name,code){const h=createHarness();h.evaluate(`function clearedBoundary(stage=8,ready=true){
 RunSave.start(0);JourneyProgress.restore({version:1,cleared:stage,entries:{}});P.cultivation.realm=Math.floor(stage/3);RunSave.save();RunSave.start(stage);G.state='playing';
 P.cultivation.layer=9;const r=Cultivation.recipe();P.cultivation.qi=r.qi;P.cultivation.materials[r.core]=ready?r.coreCount:0;P.cultivation.materials.essence=r.essence;
 World.enterBoss();G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();
}`);assert.equal(h.evaluate(`(()=>{${code}})()`),true,name);console.log('PASS '+name);passed++;}
check('each camp selection at the third chapter leads through gameplay breakthrough into the next chapter',`
 for(const stage of [2,5,8])for(const reward of ['power','body','focus']){
  clearedBoundary(stage);if(!Journey.next(reward)||G.state!=='playing'||Journey.run.stage!==stage)return false;
  Cultivation.update(.1);if(P.cultivation.realm!==Math.floor(stage/3)+1||!RealmVisuals.status()?.major)return false;
  Journey.updatePassage();if(Journey.run.stage!==stage)return false;
  const before={dmg:P.dmg,maxHp:P.maxHp,cdr:P.cdr};AscensionScene.update(5.3);Journey.updatePassage();if(Journey.run.stage!==stage+1||G.state!=='story')return false;
  if(Math.abs(P.dmg-before.dmg*(reward==='power'?1.1:1))>1e-8||P.maxHp!==before.maxHp+(reward==='body'?20:0)||Math.abs(P.cdr-Math.max(.2,before.cdr*(reward==='focus'?.92:1)))>1e-8)return false;
  const after=JSON.stringify(JourneyProgress.capture(P));Journey.updatePassage();if(Journey.next(reward)||after!==JSON.stringify(JourneyProgress.capture(P)))return false;
 }return true;`);
check('missing materials keep the selected ration and show exact progress until earned',`
 clearedBoundary(8,false);if(!Journey.next('body')||!Journey.passageStatus().includes('尚缺')||!Journey.passageStatus().includes('养魂神木'))return false;
 const hp=P.maxHp;if(Cultivation.update(.1)||Journey.updatePassage()||Journey.run.stage!==8||P.maxHp!==hp)return false;
 const r=Cultivation.recipe();Cultivation.addMaterial(r.core,r.coreCount);Cultivation.update(1.1);AscensionScene.update(5.3);Journey.updatePassage();return Journey.run.stage===9&&P.cultivation.attempts===1;`);
check('paused dead title and preview freeze growth and pending travel',`
 for(const state of ['paused','dead','start','character-preview']){clearedBoundary();Journey.next('power');G.state=state;if(Cultivation.update(99)||Journey.updatePassage()||P.cultivation.realm!==2||Journey.run.stage!==8)return false;}return true;`);
check('panel ascensions preserve their context and resume travel only after returning to gameplay',`
 for(const state of ['character','map','journal','story','levelup','chest']){clearedBoundary();Journey.next('power');G.state=state;if(!Cultivation.update(.1)||Journey.updatePassage()||P.cultivation.realm!==3||Journey.run.stage!==8||!AscensionScene.active())return false;AscensionScene.update(5.3);if(Journey.updatePassage()||G.state!==state)return false;G.state='playing';if(!Journey.updatePassage()||Journey.run.stage!==9)return false;}return true;`);
check('pending boss upgrades and core claims block camp selection without losing the result',`
 clearedBoundary();G.queue=1;if(Journey.next('power')||G.state!=='win')return false;G.queue=0;G.coreReward={max:3,count:1};if(Journey.next('focus'))return false;G.coreReward=null;return Journey.next('focus');`);
check('failed save keeps the result and does not apply the selected ration',`
 clearedBoundary();const before=JSON.stringify(JourneyProgress.capture(P));localStorage.setItem=()=>{throw Error('quota');};return !Journey.next('power')&&G.state==='win'&&Journey.run.passage===null&&before===JSON.stringify(JourneyProgress.capture(P));`);
check('save validation rejects a forged or cross-chapter pending ration',`
 clearedBoundary();Journey.next('focus');const saved=RunSave.snapshot();if(!RunSave.valid(saved))return false;const clone=()=>JSON.parse(JSON.stringify(saved));
 for(const change of [d=>d.run.passage.reward='unknown',d=>d.run.passage.stage=5,d=>d.run.stage=7,d=>d.progress.cleared=8]){const bad=clone();change(bad);if(RunSave.valid(bad))return false;}return true;`);
check('outside farming preserves the selected ration and resumes the cleared main chapter',`
 clearedBoundary(8,false);Journey.next('focus');
 for(let i=0;i<2;i++){if(!RunSave.start(7,false,false,true)||Journey.run.passage.reward!=='focus'||!Journey.run.extramural)return false;document.getElementById('enterStageBtn').onclick();G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();if(!RunSave.valid(RunSave.snapshot()))return false;}
 if(!Journey.resumePassage()||Journey.run.stage!==8||Journey.run.extramural||P.cultivation.realm!==2)return false;
 Cultivation.update(.1);AscensionScene.update(5.3);return Journey.updatePassage()&&Journey.run.stage===9&&P.cultivation.realm===3;`);
check('already ascended characters enter the next story directly',`
 clearedBoundary();G.state='playing';Cultivation.update(.1);AscensionScene.update(5.3);RealmVisuals.reset();G.state='win';return Journey.next('body')&&Journey.run.stage===9&&G.state==='story'&&!Journey.run.passage;`);
check('replaying the main boss for missing cores retains both loot and the pending ration',`
 clearedBoundary(8,false);Journey.next('power');if(!RunSave.start(8,false,true))return false;document.getElementById('enterStageBtn').onclick();
 const before=P.cultivation.materials.core3||0;World.enterBoss();G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;const random=Math.random;Math.random=()=>0;win();Math.random=random;
 return P.cultivation.materials.core3===before+ChapterCatalog.reward(8).count&&Journey.run.passage.reward==='power'&&RunSave.valid(RunSave.snapshot());`);
{
 const h=createHarness();h.evaluate(`RunSave.start(0);JourneyProgress.restore({version:1,cleared:9,entries:{}});P.cultivation.realm=2;RunSave.save();RunSave.start(8);G.state='playing';P.cultivation.layer=9;P.cultivation.qi=2880;P.cultivation.materials.core3=6;P.cultivation.materials.essence=24;World.enterBoss();G.boss.xp=0;G.boss.hp=0;G.boss.killed=true;win();Journey.next('focus');`);
 let next=createHarness({storage:h.storage});assert.equal(next.evaluate(`RunSave.continueRun()&&G.state==='paused'&&Journey.run.passage.reward==='focus'&&P.cultivation.realm===2`),true);
 next.evaluate(`G.state='playing';Cultivation.update(.1);RunSave.save();`);const afterAscension=next.evaluate('P.cdr');
 next=createHarness({storage:h.storage});assert.equal(next.evaluate(`RunSave.continueRun()&&P.cultivation.realm===3&&P.cultivation.attempts===1&&Journey.run.passage.reward==='focus'`),true);
 assert.equal(next.evaluate(`G.state='playing';Journey.updatePassage()&&Journey.run.stage===9&&P.cultivation.attempts===1&&Math.abs(P.cdr-${afterAscension}*.92)<1e-8`),true);
 next=createHarness({storage:h.storage});assert.equal(next.evaluate(`RunSave.continueRun()&&Journey.run.stage===9&&Journey.run.passage===null&&P.cultivation.attempts===1&&Math.abs(P.cdr-${afterAscension}*.92)<1e-8`),true);
 console.log('PASS real reload before and after ascension preserves the choice and applies it exactly once');passed++;
}
console.log(passed+' realm passage checks passed');
