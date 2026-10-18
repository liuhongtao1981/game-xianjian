// Economy-only simulation uses actual qi, loot recipes, probability and breakthrough code.
// Fixed kill/route rates are stated assumptions, not measured human playtime.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHarness}=require('./game-harness');
const strategies=[{name:'主路与双精英',minutes:27,kills:900,elite:6,bosses:3,gamble:false},
  {name:'完整探索',minutes:36,kills:1400,elite:6,bosses:3,gamble:false},
  {name:'普通怪刷取与缺材冒险',minutes:1,kills:35,elite:0,bosses:0,gamble:true}];
const runs=[];
for(const seed of [81,108,20261018])for(const strategy of strategies){
 const h=createHarness({seed});
 const result=h.evaluate(`(()=>{
   const config=${JSON.stringify(strategy)};G.state='character';G.enemies=[];
   let time=0,rounds=0,tier=0,kills=0,failures=0;const reached=[];
   for(time=1;time<=30000&&P.cultivation.realm<13;time++){
     if((time-1)%config.minutes===0){tier=P.cultivation.realm;rounds++;}
     const count=Math.floor(config.kills*(time%config.minutes||config.minutes)/config.minutes)-Math.floor(config.kills*((time-1)%config.minutes)/config.minutes);
     for(let i=0;i<count;i++){Cultivation.onKill({});kills++;}
     if(config.bosses&&time%(config.minutes/config.bosses)===0){
       for(let i=0;i<config.elite/config.bosses;i++)Cultivation.onKill({elite:true,encounterId:3+i});
       Cultivation.qi(150);Cultivation.addMaterial('essence',8);Cultivation.addMaterial('core'+Math.min(13,tier+1),1);
     }
     let r=Cultivation.recipe();
     while(r&&P.cultivation.qi>=r.qi){
       const a=Math.min(P.cultivation.materials[r.core]||0,r.coreCount),b=Math.min(P.cultivation.materials.essence||0,r.essence);
       if(!config.gamble&&(a<r.coreCount||b<r.essence))break;
       const prior=P.cultivation.realm;P.cultivation.result=null;
       if(!Cultivation.attempt(a,b))throw new Error('Economy transaction refused');
       if(P.cultivation.realm>prior)reached.push({realm:Cultivation.realms[P.cultivation.realm],minutes:time,rounds,kills});else failures++;
       P.cultivation.result=null;r=Cultivation.recipe();
     }
   }
   return {realm:Cultivation.realms[P.cultivation.realm],minutes:time-1,hours:Number(((time-1)/60).toFixed(2)),rounds,kills,failures,reached};
 })()`);
 assert.equal(result.realm,'仙王');assert.ok(result.hours>=20,'Economy must exceed twenty assumed active hours');
 runs.push({seed,strategy:strategy.name,...result});console.log(JSON.stringify({seed,strategy:strategy.name,hours:result.hours,rounds:result.rounds,failures:result.failures}));
}
const report={generatedAt:new Date().toISOString(),kind:'economy-only',assumptions:strategies,
 limitations:['Uses actual cultivation/loot/probability logic with fixed kill and route rates.','Does not simulate navigation, damage, deaths, skill choices or human decisions.','Twenty-hour targets need human playtesting; this report is not a completion-time promise.'],runs};
fs.writeFileSync(path.join(__dirname,'../docs/寻圣-修仙经济模拟.json'),JSON.stringify(report,null,2));
console.log('9 cultivation economy simulations passed');
