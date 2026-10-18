const fs=require('node:fs'),path=require('node:path');
const {createHarness}=require('./game-harness');
const full=process.argv.includes('--full'),quick=process.argv.includes('--quick');
const difficulty=process.argv.find(x=>x.startsWith('--difficulty='))?.split('=')[1]||'normal';
const rows=[];
for(const seed of quick?[81]:[81,108,20261018]){
  const h=createHarness({seed});
  h.evaluate(fs.readFileSync(path.join(__dirname,'guardian-pilot.js'),'utf8'));
  h.evaluate(fs.readFileSync(path.join(__dirname,'exploration-pilot.js'),'utf8'));
  const result=h.evaluate(`ExplorationPilot.run(${JSON.stringify({difficulty,full,stages:quick?1:3,maxSeconds:1500})})`);
  rows.push({seed,...result});console.log(JSON.stringify({seed,cleared:result.cleared,stages:result.rows.map(r=>({stage:r.stage,state:r.state,time:r.time,level:r.level,kills:r.kills,peak:r.director.peak,eliteCamps:r.beforeBoss?.eliteCamps}))}));
}
const report={generatedAt:new Date().toISOString(),setup:{difficulty,route:full?'all camps and all lore':'main route plus both elite challenges',initialLevel:1,initialSpells:{yujian:1},initialEquipment:[],reactionSeconds:.1,simulationHz:30,fullCampaign:!quick},
  limitations:['Scripted navigation and complete live enemy-attack geometry; not human playtesting.','No HP, damage, enemy health, cooldown, camp or wave edits during a fight.','Choices and existing pickups use normal game rules. Timings exclude time spent reading upgrade and reward screens.','Timeouts and deaths are preserved, without retries or healing resets.'],runs:rows};
const file='寻圣-探索模拟-'+difficulty+'-'+(full?'全图':'主路')+(quick?'-快速':'')+'.json';
fs.writeFileSync(path.join(__dirname,'../docs',file),JSON.stringify(report,null,2));
console.log('Saved docs/'+file);
if(rows.some(r=>r.cleared!==(quick?1:3)))process.exitCode=1;
