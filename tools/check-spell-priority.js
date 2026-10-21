const assert=require('node:assert/strict'),{createHarness}=require('./game-harness');
const h=createHarness({seed:20261021});
const sample=h.evaluate(`(()=>{const result=[];G.runChoices=10;for(const owned of [1,3,5]){P.spells=Object.fromEntries(Object.keys(SPELLS).slice(0,owned).map(key=>[key,1]));let offered=0,newFirst=0,otherFirst=0;const stats=STATS.filter(s=>Cultivation.canStat(s.id)).length;
 for(let i=0;i<15000;i++){const choices=buildChoices();if(choices.length!==3||new Set(choices.map(c=>c.kind+':'+(c.key||c.id))).size!==3)throw Error('Invalid choices');if(choices.some(c=>c.kind==='new'))offered++;if(choices[0].kind==='new')newFirst++;else otherFirst++;}
 result.push({owned,rate:offered/15000,relativeWeight:(newFirst/(Object.keys(SPELLS).length-owned))/(otherFirst/(owned+stats))});}return result;})()`);
for(const s of sample){assert.ok(s.rate>(s.owned===1?.98:s.owned===3?.95:.85),JSON.stringify(s));assert.ok(s.relativeWeight>3.5&&s.relativeWeight<4.5,JSON.stringify(s));console.log('PASS seeded new-spell sampling '+JSON.stringify(s));}
assert.equal(h.evaluate(`(()=>{P.spells=Object.fromEntries(Object.keys(SPELLS).slice(0,6).map(key=>[key,1]));for(let i=0;i<1000;i++)if(buildChoices().some(c=>c.kind==='new')||rollChestReward().kind==='spell')return false;return true;})()`),true);
console.log('PASS six-spell cap blocks new spells in upgrades and ordinary chests');
assert.equal(h.evaluate(`(()=>{P.spells={yujian:1};const random=Math.random;Math.random=()=>.599999;const a=rollChestReward();Math.random=()=>.6;const b=rollChestReward();Math.random=random;return a.kind==='spell'&&!P.spells[a.key]&&b.kind==='equip';})()`),true);
console.log('PASS ordinary chest new-spell chance has the exact 60 percent boundary');
assert.equal(h.evaluate(`(()=>{for(const owned of [1,5,6])for(let i=0;i<100;i++){P.spells=Object.fromEntries(Object.keys(SPELLS).slice(0,owned).map(key=>[key,1]));G.runChoices=1;const choices=buildChoices();if(choices.length!==3||new Set(choices.map(c=>c.kind+':'+(c.key||c.id))).size!==3)return false;if(owned<6&&['wanjian','sanmei'].some(key=>!P.spells[key])&&!choices.some(c=>['wanjian','sanmei'].includes(c.key)))return false;}return true;})()`),true);
console.log('PASS early area-spell guidance preserves unique options and available new spells');
const saved=createHarness();saved.evaluate(`RunSave.start(0);G.state='playing';gainXP(10);`);const offered=saved.evaluate('JSON.stringify(choicesCache)');
const restored=createHarness({storage:saved.storage});assert.equal(restored.evaluate('RunSave.continueRun()'),true);assert.equal(restored.evaluate('JSON.stringify(choicesCache)'),offered);
console.log('PASS real reload retains the exact saved offer instead of rerolling');
