/* Paused character sheet, inventory and explicit breakthrough confirmation. */
const CharacterUI=(()=>{
  let before='playing',tab='stats';
  const n=v=>Number(v.toFixed(2)).toLocaleString('zh-CN');
  function init(){document.getElementById('characterBtn').onclick=toggle;}
  function toggle(){
    if(G.state==='character'){close();return;}
    if(!['playing','paused'].includes(G.state))return;
    before=G.state;clearInput();G.state='character';tab='stats';draw();
  }
  function close(){if(G.state!=='character')return;clearInput();document.getElementById('overlay').classList.add('hidden');G.state=before==='paused'?'playing':before;if(before==='paused')togglePause();RunSave.save('关闭人物');}
  function draw(){
    const c=P.cultivation,r=Cultivation.recipe(),caps=Cultivation.caps(),ov=document.getElementById('overlay');
    ov.classList.remove('hidden','journey-screen','title-screen');
    const row=(name,current,limit,suffix='')=>`<div class="attribute-row"><span>${name}</span><b>${n(current)}${suffix}</b><small>上限 ${n(limit)}${suffix}</small></div>`;
    const stats=row('生命',P.hp,P.maxHp)+row('生命上限',P.maxHp,caps.maxHp)+row('护盾',P.shield,P.shieldMax)+row('护盾上限',P.shieldMax,caps.shieldMax)+row('伤害倍率',P.dmg,caps.dmg,'×')+row('暴击率',P.crit*100,caps.crit*100,'%')+row('受到伤害减免',P.armor*100,caps.armor*100,'%')+row('冷却缩减',(1-P.cdr)*100,(1-caps.cdr)*100,'%')+row('移速',P.speed,caps.speed)+row('拾取范围',P.pickup,caps.pickup)+row('护盾回复 / 秒',P.regen,caps.regen)+row('经验倍率',P.xpMul,caps.xpMul,'×');
    const spells=Object.entries(P.spells).map(([id,level])=>`<div class="inventory-item"><b>${SPELLS[id].name} · Lv.${level}</b><small>${SPELLS[id].desc(level)}</small></div>`).join('');
    const equips=P.equips.map(id=>{const e=EQUIPS.find(e=>e.id===id);return `<div class="inventory-item"><b>${e.name}</b><small>${e.desc}</small></div>`;}).join('')||'<p>暂无法宝</p>';
    const materials=[['essence','灵蕴精华'],...Cultivation.cores.map((name,i)=>['core'+(i+1),name])].map(([id,name])=>`<div class="material-item"><span>${name}</span><b>${c.materials[id]||0}</b></div>`).join('');
    let body=tab==='stats'?`<h3>人物属性 <small>当前值 / 本境上限</small></h3><div class="attribute-grid">${stats}</div><h3>已习术法</h3><div class="inventory-grid">${spells}</div><h3>携行法宝</h3><div class="inventory-grid">${equips}</div>`:tab==='bag'?`<h3>天材地宝</h3><p class="sheet-note">普通妖怪概率掉落灵蕴精华；精英保底 4 份，首领保底 8 份并可定向领取一份核心材料。本轮已领稀有奖励不会因刷新或死亡重发。</p><div class="material-grid">${materials}</div>`:'';
    if(tab==='break'){
      if(c.result){const outcome=c.result;body=`<div class="break-result ${outcome.success?'success':''}"><span class="overline">第 ${outcome.attempt} 次破境 · 已结算</span><h3>${outcome.success?'破境已成 · '+Cultivation.realms[outcome.target]:'气机未合 · 此次未成'}</h3><p>本次成功率 ${outcome.chance}% · 消耗修为 ${n(outcome.loss)}</p><p>${outcome.success?'境界、基础属性和上限已提高。':'只消耗本次投入材料与少量修为；境界、术法和法宝均保留。'}</p><button class="btn" id="ackBreakBtn">查看修炼状态</button></div>`;}
      else if(!r)body='<div class="break-result success"><h3>仙王 · 道圆</h3><p>已达第一卷修炼终境。继续寻圣与轮回，不再开放下一境突破。</p></div>';
      else {const core=Math.min(c.materials[r.core]||0,r.coreCount),essence=Math.min(c.materials.essence||0,r.essence);body=`<div class="break-heading"><span>${Cultivation.label()} →</span><h3>${Cultivation.realms[r.target]}</h3></div><p>突破修为 ${n(c.qi)} / ${n(r.qi)} · 失败损失 ${n(r.qi*.1)} 修为</p><div class="break-recipe"><label>${r.name}<small>背包 ${c.materials[r.core]||0} / 所需 ${r.coreCount}</small><input id="breakCore" aria-label="投入核心材料数量" type="number" min="0" max="${core}" value="${core}" step="1"></label><label>灵蕴精华<small>背包 ${c.materials.essence||0} / 所需 ${r.essence}</small><input id="breakEssence" aria-label="投入灵蕴精华数量" type="number" min="0" max="${essence}" value="${essence}" step="1"></label></div><p class="sheet-note">${r.name}：劫阶 ${r.target-1} 及以上的首领奖励可定向领取。材料备齐必成；减少投入可冒险，投入材料无论成败均消耗。</p><div class="break-preview"><strong id="breakChance"></strong><span>成功后：生命与护盾上限基础 +12% · 伤害 +8%</span><span>新生命上限封顶 ${n(Math.max(caps.maxHp,600*1.28**r.target))} · 新伤害倍率封顶 ${n(Math.max(caps.dmg,8*1.22**r.target))}×</span></div><p id="breakError" role="status"></p><button class="btn" id="attemptBreakBtn" ${!Cultivation.safe()||c.qi<r.qi||RunSave.conflicted()?'disabled':''}>投入上述材料 · 确认突破</button><p class="sheet-note">${World.active()?'首领战中不可突破。':!Cultivation.safe()?'附近尚有妖众交战，请脱离战斗后再突破。':c.qi<r.qi?'修为尚未达标，继续斩妖积累。':'当前处于安全状态。'} ${RunSave.status()}</p>`;}
    }
    ov.innerHTML=`<div class="panel character-panel"><header class="character-header"><div><span class="overline">无籍剑仙 · 孙小果</span><h2>${Cultivation.label()}</h2><p>等级 Lv.${P.level} · 经验 ${n(P.xp)} / ${n(P.xpNext)} · 剑意 ${n(P.energy)}%</p></div><button id="closeCharacterBtn" aria-label="关闭人物面板">×</button></header><div class="cultivation-meter"><i style="width:${r?Math.min(100,c.qi/r.qi*100):100}%"></i><span>${r?'突破修为 '+n(c.qi)+' / '+n(r.qi):'仙王道圆'}</span></div><nav class="character-tabs">${[['stats','人物状态'],['bag','天材地宝'],['break','境界突破']].map(([id,name])=>`<button data-sheet="${id}" aria-pressed="${id===tab}">${name}</button>`).join('')}</nav><section class="character-content">${body}</section><footer class="sheet-note">${RunSave.status()} · C / Esc 关闭 · 面板开启时战斗暂停</footer></div>`;
    document.getElementById('closeCharacterBtn').onclick=close;
    ov.querySelectorAll('[data-sheet]').forEach(button=>button.onclick=()=>{tab=button.dataset.sheet;draw();});
    if(tab==='break'&&c.result)document.getElementById('ackBreakBtn').onclick=()=>{c.result=null;RunSave.save('确认突破结果');draw();};
    else if(tab==='break'&&r){
      const a=document.getElementById('breakCore'),b=document.getElementById('breakEssence'),rate=document.getElementById('breakChance');
      const update=()=>{rate.textContent='本次成功率 '+Cultivation.chance(Math.max(0,Math.min(Number(a.value)||0,Number(a.max))),Math.max(0,Math.min(Number(b.value)||0,Number(b.max))))+'%';};a.oninput=b.oninput=update;update();
      document.getElementById('attemptBreakBtn').onclick=()=>{if(Cultivation.attempt(Number(a.value),Number(b.value)))draw();else document.getElementById('breakError').textContent=RunSave.conflicted()?'另一窗口已更新，请载入最新存档。':'突破未执行：请检查材料、修为、安全状态与存储权限。';};
    }
  }
  function coreRewardHTML(){if(!G.coreReward)return '';const target=G.coreReward.max;return `<div class="core-reward"><h3>守关天材地宝 · 选择一份</h3><p>本次劫阶 ${Journey.run.tier||0} · 领取后才可继续前行</p><select id="bossCoreSelect" aria-label="选择首领核心材料">${Cultivation.cores.slice(0,target).map((name,i)=>`<option value="${i+1}" ${i+1===target?'selected':''}>${name} ×1 · 用于突破${Cultivation.realms[i+1]}</option>`).join('')}</select><button class="btn" id="claimBossCoreBtn">收下所选天材地宝</button></div>`;}
  function bindCoreReward(){if(G.coreReward)document.getElementById('claimBossCoreBtn').onclick=()=>Cultivation.claimCore(Number(document.getElementById('bossCoreSelect').value));}
  function decorateMenu(){
    const ov=document.getElementById('overlay'),s=RunSave.summary();
    if(s){const slot=document.createElement('section');slot.className='continue-card';slot.innerHTML=`<div><span class="overline">自动保存的寻圣历程</span><strong>第${s.stage+1}难 · ${s.realm} · Lv.${s.level}</strong><small>${s.savedAt?new Date(s.savedAt).toLocaleString('zh-CN'):'旧版入口存档 · 将安全迁移'}</small></div><button class="btn" id="continueRunBtn">继续历程 →</button>`;ov.querySelector('.journey-menu').prepend(slot);document.getElementById('continueRunBtn').onclick=RunSave.continueRun;const saved=RunSave.snapshot();if(saved?.run.state==='win'&&saved.run.stage===2&&!saved.run.coreReward){const cycleButton=document.createElement('button');cycleButton.className='btn';cycleButton.textContent='开启新一轮 · 轮回重战';cycleButton.onclick=()=>RunSave.start(0,true);slot.append(cycleButton);}}
    if(s){const start=document.getElementById('startBtn'),saved=RunSave.snapshot();const pending=saved&&(saved.run.queue>0||saved.run.chestReward||saved.run.pendingLore!==null&&saved.run.pendingLore!==undefined||saved.run.coreReward);start.textContent=pending?'请先继续历程 · 处理待领奖励':'以当前人物重战所选章节 →';start.disabled=!!pending;}
  }
  return {init,toggle,close,draw,coreRewardHTML,bindCoreReward,decorateMenu};
})();
