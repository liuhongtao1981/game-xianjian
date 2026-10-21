const assert=require('node:assert/strict'),{createHarness}=require('./game-harness');
let passed=0;
function check(name,code,options){const h=createHarness(options);assert.equal(h.evaluate(`(()=>{
  function setup(stage=0,difficulty='normal'){Journey.run.stage=stage;Journey.run.difficulty=difficulty;reset();G.state='playing';World.enterBoss();}
  function tick(seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)EncounterDirector.update(.05);}
  ${code}
})()`),true,name);console.log('PASS '+name);passed++;}
for(const phone of [false,true])check((phone?'phone':'desktop')+' summons complete 24, 36, 48 and 64 enemy waves on all twelve maps',`
  for(let stage=0;stage<12;stage++)for(const [difficulty,count] of Object.entries({story:24,normal:36,hard:48,nightmare:64})){
    setup(stage,difficulty);tick(2.9);if(EncounterDirector.status().alive)return false;
    tick(.2);const warning=EncounterDirector.status();if(warning.warnings.length!==count||warning.alive)return false;
    for(const p of warning.warnings)if(p.source!=='boss'||p.time<1.05||Math.hypot(p.x-P.x,p.y-P.y)<180||!World.isWalkable(p.x,p.y,30))return false;
    tick(1.4);const s=EncounterDirector.status();if(s.alive!==count||s.pending||s.cap<count||G.enemies.filter(e=>e.source==='boss').some(e=>!World.isWalkable(e.x,e.y,e.r)))return false;
  }return true;`,phone?{width:390,height:844}:undefined);
check('desktop caps are 48, 72, 96 and 128 and never produce partial top-up waves',`
  for(const [difficulty,cap] of Object.entries({story:48,normal:72,hard:96,nightmare:128})){
    setup(0,difficulty);tick(90);const s=EncounterDirector.status();if(s.alive!==cap||s.cap!==cap||s.pending)return false;
    const mob=G.enemies.find(e=>e.source==='boss');mob.hp=0;mob.killed=true;tick(60);
    if(EncounterDirector.status().alive!==cap-1||EncounterDirector.status().pending)return false;
  }return true;`);
check('phone caps fit a complete difficulty-specific wave and wait for a full refill',`
  for(const [difficulty,cap] of Object.entries({story:24,normal:36,hard:48,nightmare:64})){
    setup(0,difficulty);tick(90);if(EncounterDirector.status().alive!==cap||EncounterDirector.status().cap!==cap)return false;
    G.enemies=G.enemies.filter(e=>e.source!=='boss');tick(1.5);if(EncounterDirector.status().alive!==cap)return false;
  }return true;`,{width:390,height:844});
check('summon warnings restart fully after an earned opening',`
  setup();tick(3.1);G.boss.action='exposed';tick(20);if(EncounterDirector.status().alive||EncounterDirector.status().warnings.length)return false;
  G.boss.action='guard';tick(.05);if(EncounterDirector.status().warnings.some(p=>p.time!==1.2))return false;
  tick(1);if(EncounterDirector.status().alive)return false;tick(.3);return EncounterDirector.status().alive===36;`);
check('pause and non-playing overlays freeze summon plans and countdowns',`
  setup();tick(3.1);const before=JSON.stringify(EncounterDirector.status());
  for(const state of ['paused','character','map','story','levelup','win','dead']){G.state=state;EncounterDirector.update(99);if(JSON.stringify(EncounterDirector.status())!==before)return false;}
  return true;`);
check('boss death cancels pending summons and clears adds without granting their loot',`
  setup();tick(5);tick(12);const before=JSON.stringify([P.cultivation,G.kills,G.orbs.length]);
  G.boss.hp=0;G.boss.killed=true;EncounterDirector.endBoss();tick(30);
  return !EncounterDirector.status().alive&&!EncounterDirector.status().pending&&JSON.stringify([P.cultivation,G.kills,G.orbs.length])===before;`);
check('refresh and retry reset the duel without retaining summoned enemies',`
  RunSave.start(0);G.state='playing';World.enterBoss();tick(5);if(EncounterDirector.status().alive!==36)return false;
  RunSave.save();if(!RunSave.continueRun()||G.bossSpawned||EncounterDirector.status().mode!=='explore'||G.enemies.some(e=>e.source==='boss'))return false;
  G.state='playing';World.enterBoss();tick(5);if(EncounterDirector.status().alive!==36)return false;
  P.hp=0;die();if(!RunSave.retry()||G.enemies.some(e=>e.source==='boss'))return false;
  return true;`);
check('outside guardians use the same difficulty-specific summoning rules',`
  for(const [difficulty,count] of Object.entries({story:24,normal:36,hard:48,nightmare:64})){
    Journey.run.extramural=true;setup(0,difficulty);tick(5);
    if(EncounterDirector.status().alive!==count)return false;
  }return true;`);
console.log(passed+' mass boss summoning checks passed');
