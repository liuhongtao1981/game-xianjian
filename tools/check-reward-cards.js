const assert=require('node:assert/strict'),{createHarness}=require('./game-harness');let passed=0;
function test(name,source){const h=createHarness();assert.equal(h.evaluate(`(()=>{RunSave.start(0);G.state='playing';${source}})()`),true,name);console.log('PASS '+name);passed++;}
test('all stat previews match actual capped application and never mutate combat or save state',`
 for(const stat of STATS)for(const nearCap of [false,true]){
  reset();G.state='playing';if(nearCap){const caps=Cultivation.caps();P.dmg=caps.dmg-.01;P.speed=caps.speed-.5;P.maxHp=caps.maxHp-5;P.hp=P.maxHp-2;P.cdr=.205;P.crit=caps.crit-.01;P.pickup=caps.pickup-.5;}
  const original=JSON.stringify([P,G.parts,G.texts,G.state,RunSave.snapshot()]),a=RewardCards.previewChoice({kind:'stat',id:stat.id});
  if(original!==JSON.stringify([P,G.parts,G.texts,G.state,RunSave.snapshot()]))return false;
  stat.apply();Cultivation.constrain();const values={'伤害倍率':P.dmg,'移动速度':P.speed,'生命上限':P.maxHp,'当前生命':P.hp,'冷却缩减 · 含大招':(1-P.cdr)*100,'暴击率':P.crit*100,'拾取范围':P.pickup};
  if(a.rows.some(r=>r.label in values&&Math.abs(r.after-values[r.label])>1e-9))return false;
 }return true;`);
test('cooldown preview includes equipped ultimate and respects eighty percent ceiling',`
 P.cdr=.205;const a=RewardCards.previewChoice({kind:'stat',id:'cd'});return Math.abs(a.rows[0].after-80)<1e-8&&a.rows[1].after===Journey.ultimates[UltimateArts.loadout()[0]].cd*.2&&P.cdr===.205;`);
test('all eight spell previews read real quantity layers range and damage at form transitions',`
 for(const key of SpellGift.keys)for(const from of [0,1,4,5,10,15,20,43]){const rows=RewardCards.spellRows(key,from,from+1),a=SpellGrowth.spec(key,from+1);if(rows[0].before!==from||rows[0].after!==from+1)return false;for(const [label,k] of [['飞剑数量','count'],['落雷数量','count'],['剑阵圈数','layers'],['作用半径','radius'],['护域半径','radius'],['施法距离','range']]){const row=rows.find(r=>r.label===label);if(row&&row.after!==a[k])return false;}}return true;`);
test('wanjian reveals five to seven circle unlock with total and per-circle counts',`
 const rows=RewardCards.spellRows('wanjian',5,6);return rows.find(r=>r.label==='飞剑数量').before===9&&rows.find(r=>r.label==='飞剑数量').after===12&&rows.find(r=>r.label==='剑阵圈数').after===2&&rows.find(r=>r.label==='各圈飞剑').after==='5 / 7';`);
test('every equipment chest shows values captured before application',`
 for(const e of EQUIPS){reset();G.state='playing';P.hp=50;const before=JSON.stringify(P);const preview=RewardCards.previewReward({kind:'equip',id:e.id});if(JSON.stringify(P)!==before)return false;openChest({kind:'equip',...e});if(JSON.stringify(G.chestReward.preview)!==JSON.stringify(preview)||!document.getElementById('overlay').innerHTML.includes('获得前'))return false;}return true;`);
test('saved chest comparisons survive reload without applying rewards twice',`
 P.dmg=1.5;openChest({kind:'equip',id:'mujian',name:'木剑',color:'#d9b877',desc:'伤害 +20%'});const preview=JSON.stringify(G.chestReward.preview),damage=P.dmg;RunSave.save();
 if(!RunSave.continueRun()||G.state!=='chest'||P.dmg!==damage||JSON.stringify(G.chestReward.preview)!==preview)return false;
 closeChest();return P.dmg===damage&&P.equips.filter(k=>k==='mujian').length===1;`);
test('legacy applied chest never invents before values or reapplies the effect',`
 P.dmg=1.2;P.equips=['mujian'];openChest({kind:'equip',id:'mujian',name:'木剑',color:'#d9b877',desc:'伤害 +20%'},true);return P.dmg===1.2&&P.equips.length===1&&!G.chestReward.preview&&document.getElementById('overlay').innerHTML.includes('旧版');`);
test('material and healing rewards report capped actual amounts',`
 P.cultivation.materials.essence=9999998;const m=RewardCards.previewReward({kind:'material',materials:{essence:8}});P.hp=P.maxHp-3;const h=RewardCards.previewReward({kind:'heal'});return m.rows[0].before===9999998&&m.rows[0].after===10000000&&h.rows[0].after===P.maxHp;`);
test('gift respec comparisons show removal and preserve current build before confirmation',`
 P.spells={yujian:3};const before=JSON.stringify(P);const html=RewardCards.spellHTML('yujian',3,0);return before===JSON.stringify(P)&&html.includes('调整后')&&RewardCards.spellRows('yujian',3,0).find(r=>r.label==='飞剑数量').after===0;`);
test('all ration previews match capped actual travel effects',`
 P.cdr=.205;P.dmg=Cultivation.caps().dmg-.01;for(const id of ['power','body','focus']){const p=JSON.stringify(P),html=RewardCards.campHTML(id);if(JSON.stringify(P)!==p||!html.includes('提升前')||!html.includes('提升后'))return false;const clone=JSON.parse(p);if(!RewardCards.applyCamp(id,clone))return false;Cultivation.constrain(clone);if(id==='focus'&&clone.cdr!==.2||id==='power'&&clone.dmg!==Cultivation.caps().dmg)return false;}return !RewardCards.applyCamp('bad');`);
test('native keyboard-selectable cards preserve option indices and escape stored text',`
 const html=RewardCards.choiceHTML({kind:'stat',id:'atk',name:'<img onerror=x>',tag:'强化',color:'#abc',glyph:'剑'},2);return html.startsWith('<button')&&html.includes('data-i="2"')&&html.includes('&lt;img')&&!html.includes('<img onerror');`);
console.log(passed+' reward projection and save checks passed');
