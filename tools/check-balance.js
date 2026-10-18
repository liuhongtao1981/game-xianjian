/* Deterministic guardian benchmark. The agent uses normal movement, spells and damage.
 * This intentionally starts with a declared, attainable level-six build at each first
 * altar; exploration routes and human reaction times are NOT represented by this data. */
const fs=require('node:fs');
const path=require('node:path');
const {createHarness}=require('./game-harness');
const quick=process.argv.includes('--quick');
const difficultyArg=process.argv.find(x=>x.startsWith('--difficulty='))?.split('=')[1];
const ultimateArg=process.argv.find(x=>x.startsWith('--ultimate='))?.split('=')[1];
const difficulties=difficultyArg?[difficultyArg]:['story','normal','hard','nightmare'];
const ultimates=ultimateArg?[ultimateArg]:quick?['heaven']:['heaven','lotus','river'];
const seeds=quick?[81]:[81,108,20261018],maxSeconds=240;
const rows=[];
const controls=[];
const pilot=fs.readFileSync(path.join(__dirname,'guardian-pilot.js'),'utf8');
for(const difficulty of difficulties)for(const ultimate of ultimates){
  for(const seed of seeds){
    const game=createHarness({seed});game.evaluate(pilot);
    const result=game.evaluate(`GuardianPilot.run(${JSON.stringify({difficulty,ultimate,maxSeconds})})`);
    rows.push({difficulty,ultimate,seed,...result});
  }
  const group=rows.filter(r=>r.difficulty===difficulty&&r.ultimate===ultimate);
  console.log(`${difficulty}/${ultimate}: ${group.filter(r=>r.cleared===3).length}/${group.length} guardian campaigns, ${group.reduce((n,r)=>n+r.cleared,0)} stages won`);
}
for(const difficulty of difficulties){
  const game=createHarness({seed:81});game.evaluate(pilot);
  controls.push({difficulty,ultimate:'heaven',seed:81,policy:'uninformed',...game.evaluate(`GuardianPilot.run(${JSON.stringify({difficulty,ultimate:'heaven',maxSeconds,policy:'uninformed'})})`)});
}
const report={
  generatedAt:new Date().toISOString(),
  note:'Deterministic state-aware scripted guardian benchmark, NOT human completion rates or full exploration campaign results. Normal simulation damage/cooldowns/collision and mechanism requirements remain intact. The pilot moves through joystick inputs and uses ordinary spells, dodge and ultimate; it never changes HP, enemy HP or exposure during a fight.',
  setup:{initialLevel:6,initialSpells:{yujian:3,wanjian:2,wulei:1},initialUpgradeCost:5,initialEquipment:[],difficultyHealth:'unmodified',stageTravel:'position at each altar only before entering; use actual World interaction',progression:'carry earned build, damage, charge rules and camp power reward between victories',reactionSeconds:.1,simulationHz:30,maxSecondsPerStage:maxSeconds,seeds},
  limitations:['Starts at the first altar with a specified plausible five-upgrade loadout; does not measure exploration loot distribution or navigation.','Reads complete live hazard geometry; predicts projectiles and responds faster and more consistently than most people.','Random upgrade offers are selected by a fixed heuristic. No retries or healing resets within a stage.','A timeout or loss is preserved as a failure; no simulation outcome is patched.'],
  runs:rows,
  controlsNote:'Same initial build and actual combat, but the control approaches the boss and casts ultimate whenever ready. It does not read telegraphs or seek the required recovery/tide mechanisms.',
  metricNotes:{damageTaken:'Actual HP lost after shields, counted over the entire fight; excludes absorbed shield damage.',mechanismFailures:'Cumulative failed ritual attempts across all guardian rounds, including cancelled warnings.'},
  controls
};
const name=quick?'寻圣-首领模拟-快速.json':'寻圣-平衡模拟.json';
fs.writeFileSync(path.join(__dirname,'../docs',name),JSON.stringify(report,null,2));
console.log('Saved docs/'+name);
