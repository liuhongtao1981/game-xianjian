const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHarness}=require('./game-harness');
let checks=0;
function setup(options={}){
  const h=createHarness(options);
  if(h.evaluate('typeof Alchemy')==='undefined')h.evaluate(fs.readFileSync(path.join(__dirname,'../prototype/alchemy.js'),'utf8'));
  if(!options.resume)h.evaluate(`RunSave.start(0,false,false,false,true);G.state='playing';G.enemies=[];G.telegraphs=[];G.boss=null;P.alchemy=Alchemy.fresh();`);
  return h;
}
function check(name,fn){fn();checks++;console.log('PASS '+name);}
const obj=(h,source)=>JSON.parse(h.evaluate('JSON.stringify('+source+')'));
const provision=`P.alchemy.materials={herb:500,dew:500,crystal:500,ember:500};P.alchemy.pills={vitality1:10,spirit1:10,insight1:10,ward1:10,vitality2:4,spirit2:4,insight2:4,ward2:4};`;
function seedFor(success,chance){for(let seed=1;seed<10000;seed++){const roll=((Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;if((roll<chance/100)===success)return seed;}throw Error('seed not found');}

check('twelve coherent recipes, bounded success chances, grade and quantity gates',()=>{
  const h=setup();assert.equal(h.evaluate('Alchemy.recipes.length'),12);
  assert.equal(h.evaluate('new Set(Alchemy.recipes.map(r=>r.id)).size'),12);
  assert.equal(h.evaluate('Alchemy.valid(Alchemy.fresh())'),true);
  h.evaluate(provision);assert.match(h.evaluate(`Alchemy.brewReason('vitality2')`),/化神/);
  assert.equal(h.evaluate(`Alchemy.probability('vitality1')`),86);
  h.evaluate('P.cultivation.realm=13;P.alchemy.proficiency=1000;');
  assert.equal(h.evaluate('Math.max(...Alchemy.recipes.map(r=>Alchemy.probability(r.id)))'),98);
  assert.equal(h.evaluate('Math.min(...Alchemy.recipes.map(r=>Alchemy.probability(r.id)))'),80);
  h.evaluate('P.alchemy.pills.vitality1=1;');assert.match(h.evaluate(`Alchemy.brewReason('vitality2')`),/×2/);
});
check('successful brew commits ingredients, proficiency, pill and result exactly once',()=>{
  const h=setup();h.evaluate(provision+'P.alchemy.seed='+seedFor(true,86)+';');
  assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),true);
  assert.deepEqual(obj(h,'({herb:P.alchemy.materials.herb,dew:P.alchemy.materials.dew,pills:P.alchemy.pills.vitality1,attempts:P.alchemy.attempts,proficiency:P.alchemy.proficiency,success:P.alchemy.lastResult.success})'),{herb:498,dew:499,pills:11,attempts:1,proficiency:3,success:true});
  const after=h.evaluate('JSON.stringify(P.alchemy)');assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),false);assert.equal(h.evaluate('JSON.stringify(P.alchemy)'),after);
  assert.equal(h.evaluate('RunSave.snapshot().run.player.alchemy.attempts'),1);
});
check('failed fusion consumes disclosed materials and two lower pills without producing a pill',()=>{
  const h=setup();h.evaluate(provision+'P.cultivation.realm=3;P.alchemy.seed='+seedFor(false,70)+';');
  assert.equal(h.evaluate(`Alchemy.brew('vitality2',0)`),true);
  assert.deepEqual(obj(h,'({herb:P.alchemy.materials.herb,dew:P.alchemy.materials.dew,base:P.alchemy.pills.vitality1,output:P.alchemy.pills.vitality2,attempts:P.alchemy.attempts,proficiency:P.alchemy.proficiency,success:P.alchemy.lastResult.success})'),{herb:496,dew:498,base:8,output:4,attempts:1,proficiency:1,success:false});
});
check('successful and failed results survive actual reload and cannot reroll their settled attempt',()=>{
  for(const success of [true,false]){
    const h=setup();h.evaluate(provision+'P.alchemy.seed='+seedFor(success,86)+';');
    h.evaluate(`Alchemy.brew('vitality1',0)`);const after=obj(h,'P.alchemy');
    const reload=setup({storage:h.storage,resume:true});assert.equal(reload.evaluate('RunSave.continueRun()'),true);reload.evaluate(`G.state='playing';G.enemies=[];G.telegraphs=[];G.boss=null;`);
    assert.deepEqual(obj(reload,'P.alchemy'),after);assert.equal(reload.evaluate(`Alchemy.brew('vitality1',0)`),false);assert.deepEqual(obj(reload,'P.alchemy'),after);
  }
});
check('storage failure rolls back both crafting outcome and deterministic random stream',()=>{
  const h=setup();h.evaluate(provision+'P.alchemy.seed='+seedFor(false,86)+';');const before=obj(h,'P.alchemy');
  h.context.localStorage.setItem=()=>{throw Error('quota');};
  assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),false);assert.deepEqual(obj(h,'P.alchemy'),before);
  h.context.localStorage.setItem=(key,value)=>h.storage.set(key,String(value));
  assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),true);assert.equal(h.evaluate('P.alchemy.lastResult.success'),false);
});
check('combat blocks brewing, allows survival pills, and rejects no-op use',()=>{
  const h=setup();h.evaluate(provision+`G.enemies=[{hp:10,x:P.x+50,y:P.y}];P.hp=P.maxHp;P.shield=P.shieldMax;ImmortalMovement.ensure();P.mana=ImmortalMovement.max();`);
  assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),false);
  for(const id of ['vitality1','spirit1','ward1'])assert.equal(h.evaluate(`Alchemy.consume('${id}')`),false);
  h.evaluate('P.hp=P.maxHp*.2;');assert.equal(h.evaluate(`Alchemy.consume('vitality1')`),true);assert.equal(h.evaluate('P.hp/P.maxHp'),.45);
  assert.equal(h.evaluate(`Alchemy.consume('ward1')`),false);assert.equal(h.evaluate('P.alchemy.cooldown'),18);
  assert.equal(h.evaluate('P.alchemy.pills.vitality1'),9);
});
check('an active boss blocks the furnace while a cleared victory altar permits brewing',()=>{
  const h=setup();h.evaluate('World.enterBoss();');assert.equal(h.evaluate('World.active()'),true);assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),false);
  h.evaluate(`G.boss.killed=true;G.boss.hp=0;G.enemies=[];G.telegraphs=[];G.state='win';`);
  assert.equal(h.evaluate('World.active()'),true,'the world intentionally retains the altar state after victory');
  assert.equal(h.evaluate('Alchemy.safe()'),true);assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),true);
  h.evaluate(`G.enemies=[{hp:10,x:P.x+50,y:P.y}];`);assert.equal(h.evaluate('Alchemy.safe()'),false,'remaining hostile units still block the furnace');
});
check('mana and shield restoration are bounded; quick-use selects a sufficient grade',()=>{
  const h=setup();h.evaluate(provision+`ImmortalMovement.ensure();P.mana=ImmortalMovement.max()*.8;P.shield=P.shieldMax*.9;P.hp=P.maxHp*.9;`);
  assert.equal(h.evaluate(`Alchemy.quickUse('vitality')`),true);assert.equal(h.evaluate('P.hp'),h.evaluate('P.maxHp'));assert.equal(h.evaluate('P.alchemy.pills.vitality1'),9);assert.equal(h.evaluate('P.alchemy.pills.vitality2'),4);
  h.evaluate('Alchemy.update(18);');assert.equal(h.evaluate(`Alchemy.consume('spirit2')`),true);assert.equal(h.evaluate('P.mana'),h.evaluate('ImmortalMovement.max()'));
  h.evaluate('Alchemy.update(18);');assert.equal(h.evaluate(`Alchemy.consume('ward1')`),true);assert.equal(h.evaluate('P.shield'),h.evaluate('P.shieldMax'));
});
check('potion persistence failure refunds the item, effects and shared cooldown',()=>{
  const h=setup();h.evaluate(provision+'P.hp=10;');const before=obj(h,'({alchemy:P.alchemy,hp:P.hp,shield:P.shield,mana:P.mana})');
  h.context.localStorage.setItem=()=>{throw Error('quota');};assert.equal(h.evaluate(`Alchemy.consume('vitality1')`),false);
  assert.deepEqual(obj(h,'({alchemy:P.alchemy,hp:P.hp,shield:P.shield,mana:P.mana})'),before);
});
check('insight buffs only elapsed combat time, do not stack, and expire exactly',()=>{
  const h=setup();h.evaluate(provision);assert.equal(h.evaluate(`Alchemy.consume('insight1')`),true);assert.equal(h.evaluate('Alchemy.qiMultiplier()'),1.15);
  h.evaluate(`G.state='paused';Alchemy.update(90);`);assert.equal(h.evaluate('P.alchemy.insight.remaining'),45);assert.equal(h.evaluate('P.alchemy.cooldown'),18);
  h.evaluate(`G.state='playing';Alchemy.update(18);`);assert.equal(h.evaluate(`Alchemy.consume('insight2')`),false);
  h.evaluate('Alchemy.update(27);');assert.equal(h.evaluate('Alchemy.qiMultiplier()'),1);assert.equal(h.evaluate('P.alchemy.insight.bonus'),0);
});
check('insight is wired to actual kill cultivation and never multiplies boss settlement',()=>{
  const h=setup();h.evaluate(provision+'P.cultivation.qi=0;Cultivation.onKill({});');const plain=h.evaluate('P.cultivation.qi');
  h.evaluate(`Alchemy.consume('insight1');P.cultivation.qi=0;Cultivation.onKill({});`);assert.ok(Math.abs(h.evaluate('P.cultivation.qi')-plain*1.15)<1e-9);
  const ordinary=setup();ordinary.evaluate('Cultivation.victory();');const reward=ordinary.evaluate('P.cultivation.qi');
  const boosted=setup();boosted.evaluate(provision+`Alchemy.consume('insight1');Cultivation.victory();`);assert.equal(boosted.evaluate('P.cultivation.qi'),reward);
});
check('camp and named monster drops have ledger deduplication and exclude summoned helpers',()=>{
  const h=setup();h.evaluate('P.alchemy.materials={herb:0,dew:0,crystal:0,ember:0};');
  assert.equal(h.evaluate('Alchemy.onCampCleared({id:2})'),true);assert.equal(h.evaluate('Alchemy.onCampCleared({id:2})'),false);
  assert.equal(h.evaluate(`Alchemy.onKill({elite:true,combatId:'camp:1:3:5'})`),true);assert.equal(h.evaluate(`Alchemy.onKill({elite:true,combatId:'camp:1:3:5'})`),false);
  const after=obj(h,'P.alchemy.materials');for(const flag of ['boss','bossHelper','eventObjective'])assert.equal(h.evaluate(`Alchemy.onKill({${flag}:true,elite:true,combatId:'ignored'})`),false);
  assert.deepEqual(obj(h,'P.alchemy.materials'),after);assert.deepEqual(after,{herb:4,dew:2,crystal:1,ember:2});
  h.evaluate('RunSave.save();');const reload=setup({storage:h.storage,resume:true});reload.evaluate(`RunSave.continueRun();G.state='playing';`);assert.equal(reload.evaluate('Alchemy.onCampCleared({id:2})'),false);assert.deepEqual(obj(reload,'P.alchemy.materials'),after);
});
check('legacy builds migrate safely and malformed inventory cannot enter a save',()=>{
  const h=setup();assert.equal(h.evaluate('Alchemy.valid(Alchemy.clean(undefined))'),true);
  for(const mutation of ['a.pills.vitality1=-1','a.materials.herb=Infinity','a.pills.unknown=2','a.seed=0','a.insight.bonus=2','a.cooldown=20'])assert.equal(h.evaluate(`(()=>{const a=Alchemy.fresh();${mutation};return Alchemy.valid(a)})()`),false);
  assert.equal(h.evaluate(`(()=>{const a=Alchemy.clean({seed:10,attempts:0,materials:{herb:-1},pills:{unknown:3}});return Alchemy.valid(a)&&a.materials.herb===0&&!a.pills.unknown})()`),true);
  assert.equal(h.evaluate(`(()=>{const p=JourneyProgress.capture(P);delete p.alchemy;return JourneyProgress.validBuild(p)&&Alchemy.valid(JourneyProgress.capture(p).alchemy)})()`),true);
  assert.equal(h.evaluate(`(()=>{const a=Alchemy.fresh(),random=Math.random;let calls=0;Math.random=()=>{calls++;return .5;};Alchemy.clean(a);Math.random=random;return calls;})()`),0,'copying a valid inventory must not change the combat random stream');
});
check('save conflicts, death, title menu and ending all refuse transactions',()=>{
  for(const state of ['start','dead','story','save-conflict']){const h=setup();h.evaluate(provision+`G.state='${state}';P.hp=20;`);const before=obj(h,'P.alchemy');assert.equal(h.evaluate(`Alchemy.brew('vitality1',0)`),false);assert.equal(h.evaluate(`Alchemy.consume('vitality1')`),false);assert.deepEqual(obj(h,'P.alchemy'),before);}
});
check('read-only menu furnace and nested settings cannot overwrite an active run',()=>{
  const h=setup();h.evaluate(`Journey.menu();`);const before=obj(h,'RunSave.snapshot()');
  h.evaluate(`Journey.run.difficulty='nightmare';Alchemy.open();RunSave.save('切换网页');`);
  assert.deepEqual(obj(h,'RunSave.snapshot()'),before,'menu preview must preserve revision, original difficulty and full run');
  h.evaluate(`ExperienceUI.open('settings');RunSave.save('窗口失焦');`);
  assert.equal(h.evaluate('G.state'),'alchemy','settings cannot nest inside a furnace session');
  assert.deepEqual(obj(h,'RunSave.snapshot()'),before,'nested menu settings must preserve the same saved run');
  h.evaluate('ExperienceUI.close();Alchemy.close();');assert.equal(h.evaluate('G.state'),'start');
});
check('returning from the furnace refreshes character attributes and retains sheet scroll',()=>{
  const h=setup();h.evaluate(`P.hp=40;CharacterUI.toggle();document.getElementById('overlay').scrollTop=136;`);
  const before=h.evaluate(`document.getElementById('overlay').innerHTML`);
  h.evaluate(`Alchemy.open();Alchemy.consume('vitality1');Alchemy.close();`);
  assert.equal(h.evaluate('G.state'),'character');assert.equal(h.evaluate('P.hp'),70);
  assert.notEqual(h.evaluate(`document.getElementById('overlay').innerHTML`),before,'character health must redraw after potion use');
  assert.equal(h.evaluate(`document.getElementById('overlay').scrollTop`),136);
});
console.log(checks+' alchemy transaction and persistence checks passed');
