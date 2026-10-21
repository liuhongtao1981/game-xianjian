/* Read-only projections use the same effects and spell parameters as the game. */
const RewardCards=(()=>{
  const copy=p=>JSON.parse(JSON.stringify(p)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=n=>Number.isFinite(n)?Number(n.toFixed(2)).toLocaleString('zh-CN'):'—';
  const row=(label,before,after,unit='',limit)=>({label,before,after,unit,...(limit===undefined?{}:{limit})});
  const fields={hp:['当前生命',''],maxHp:['生命上限',''],shieldMax:['护盾上限',''],dmg:['伤害倍率','×'],speed:['移动速度',''],crit:['暴击率','%'],armor:['伤害减免','%'],cdr:['冷却缩减 · 含大招','%'],pickup:['拾取范围',''],regen:['护盾回复 / 秒',''],xpMul:['经验倍率','×'],poison:['攻击附毒','']};
  function value(p,k){return k==='cdr'?(1-p.cdr)*100:['crit','armor'].includes(k)?p[k]*100:k==='poison'?(p.poison?'已开启':'未开启'):p[k];}
  function attributeRows(a,b,keys){const caps=Cultivation.caps(b);return keys.map(k=>{const [name,unit]=fields[k],limit=k==='hp'?b.maxHp:k==='poison'?undefined:k==='cdr'?(1-caps.cdr)*100:['crit','armor'].includes(k)?caps[k]*100:caps[k];return row(name,value(a,k),value(b,k),unit,limit);});}
  function spellRows(key,from,to){
    const a=from?SpellGrowth.spec(key,from):null,b=to?SpellGrowth.spec(key,to):null,get=(s,k)=>s?.[k]||0,r=[row('术法等级',from,to,'级')];
    if(['yujian','wanjian','wulei'].includes(key))r.push(row(key==='wulei'?'落雷数量':'飞剑数量',get(a,'count'),get(b,'count'),key==='wulei'?'道':'柄'));
    if(key==='wanjian'){r.push(row('剑阵圈数',get(a,'layers'),get(b,'layers'),'圈'));r.push(row('各圈飞剑',a?.ringCounts.join(' / ')||'—',b?.ringCounts.join(' / ')||'—','柄'));}
    if(!['yujian','wulei','wanjian'].includes(key))r.push(row(key==='bingxin'?'护域半径':'作用半径',get(a,'radius'),get(b,'radius')));
    if(['gudu','jiushen'].includes(key))r.push(row('施法距离',get(a,'range'),get(b,'range')));
    if(key==='gudu')r.push(row('毒域层数',get(a,'layers'),get(b,'layers'),'层'));
    if(['sanmei','jiushen','guanyin'].includes(key))r.push(row(key==='guanyin'?'回复段数':'攻击段数',get(a,'pulses'),get(b,'pulses'),'段'));
    if(key==='bingxin')r.push(row('单次护盾',Math.round(get(a,'shield')),Math.round(get(b,'shield'))));
    else if(key==='guanyin')r.push(row('单次总回复',Math.round(get(a,'heal')),Math.round(get(b,'heal'))));
    else r.push(row(key==='wanjian'?'剑轮基础伤害':key==='gudu'?'每秒基础伤害':key==='wulei'?'每道基础雷伤':'基础伤害',Math.round(get(a,'damage')),Math.round(get(b,'damage'))));
    if(key==='wulei')r.push(row('单体全中基础总伤',Math.round(get(a,'damage'))*get(a,'count'),Math.round(get(b,'damage'))*get(b,'count')));
    return r;
  }
  function projected(effect,p=P){const after=copy(p);effect(after);Cultivation.constrain(after);return after;}
  function previewChoice(c){
    if(c.kind==='new'||c.kind==='up')return {rows:spellRows(c.key,P.spells[c.key]||0,(P.spells[c.key]||0)+1),note:(c.key==='wulei'?'优先覆盖画面内目标，余雷均分集中 · ':'按当前术法参数计算 · ')+'基础伤害未计角色倍率与暴击'};
    if(c.kind==='recover')return {rows:[row('当前生命',P.hp,Math.min(P.maxHp,P.hp+20),'',P.maxHp)],note:'强化均已达上限 · 调息恢复生命'};
    const stat=STATS.find(s=>s.id===c.id);if(!stat)return {rows:[],note:''};
    const after=projected(p=>stat.apply(p)),keys={atk:['dmg'],spd:['speed'],hp:['maxHp','hp'],cd:['cdr'],crit:['crit'],pick:['pickup']}[c.id];
    const rows=attributeRows(P,after,keys);if(c.id==='cd'){const id=UltimateArts.loadout()[0];rows.push(row(Journey.ultimates[id].short+'冷却',Journey.ultimates[id].cd*UltimateArts.cooldown(P),Journey.ultimates[id].cd*UltimateArts.cooldown(after),'秒'));}
    return {rows,note:'已按当前境界上限计算实际收益'};
  }
  function materialRows(materials){return Object.entries(materials).map(([key,n])=>row(key==='essence'?'灵蕴精华':Cultivation.cores[Number(key.slice(4))-1],P.cultivation.materials[key]||0,Math.min(1e7,(P.cultivation.materials[key]||0)+n),'份'));}
  function previewReward(r){
    if(['spell','spell-up'].includes(r.kind))return {version:1,...previewChoice({kind:P.spells[r.key]?'up':'new',key:r.key})};
    if(r.kind==='material')return {version:1,rows:materialRows(r.materials),note:'已计入天材地宝背包'};
    if(r.kind==='heal')return {version:1,rows:[row('当前生命',P.hp,Math.min(P.maxHp,P.hp+50),'',P.maxHp)],note:'以实际恢复值为准'};
    const equip=EQUIPS.find(e=>e.id===r.id);if(!equip)return {version:1,rows:[],note:r.desc};
    const after=projected(p=>equip.apply(p)),keys={mujian:['dmg'],jifeng:['speed'],jiuhu:['maxHp','hp'],wudu:['poison'],nvwa:['regen'],tiangang:['crit','dmg'],juling:['pickup','xpMul'],huxin:['armor']}[r.id];
    return {version:1,rows:attributeRows(P,after,keys),note:'法宝效果已生效 · 已按境界上限结算'};
  }
  function applyCamp(id,p=P){if(id==='power')p.dmg*=1.1;else if(id==='body')p.maxHp+=20;else if(id==='focus')p.cdr=Math.max(Cultivation.caps(p).cdr,p.cdr*.92);else return false;return true;}
  function campRows(id){const after=projected(p=>applyCamp(id,p));return attributeRows(P,after,{power:['dmg'],body:['maxHp'],focus:['cdr']}[id]);}
  function rowsHTML(rows,labels=['提升前','提升后']){
    return `<div class="gain-table" role="table" aria-label="${esc(labels.join('与'))}"><div class="gain-columns" role="row"><span>属性</span><span>${esc(labels[0])}</span><span></span><span>${esc(labels[1])}</span></div>${rows.map(r=>{const same=r.before===r.after,format=v=>(typeof v==='number'?number(v):esc(v))+esc(r.unit),limit=Number.isFinite(r.limit)?`${r.label==='当前生命'?'生命上限':'本境上限'} ${number(r.limit)}${esc(r.unit)}`:'';return `<div class="gain-row ${same?'unchanged':'changed'} ${r.label==='各圈飞剑'?'series':''}" role="row"><span class="gain-label" role="cell">${esc(r.label)}${limit?`<small>${limit}</small>`:''}</span><span class="gain-before" role="cell">${format(r.before)}</span><span class="gain-arrow" aria-hidden="true">→</span><strong class="gain-after" role="cell">${format(r.after)}</strong></div>`;}).join('')}</div>`;
  }
  function emblem(key,glyph){
    const paths={yujian:'M50 14l8 49-8 15-8-15z M38 64h24 M50 78v10',wanjian:'M50 14v66 M28 28v40 M72 28v40 M41 70h18 M20 58h16 M64 58h16',wulei:'M57 13L29 56h22l-8 32 30-45H51z',sanmei:'M52 13c10 26-14 30-4 42 9-4 10-13 10-13 27 28 6 47-10 44-27-4-33-25-18-43-3 16 6 18 9 14-9-18 14-22 13-44z',bingxin:'M50 15v70 M20 32l60 36 M20 68l60-36 M41 22l9 9 9-9 M41 78l9-9 9 9',gudu:'M30 35q20-20 40 0L62 77H38z M35 45h30 M43 27v-8h14v8 M44 56l12 12m0-12L44 68',jiushen:'M41 16h18v12c0 9 20 16 20 35 0 29-58 29-58 0 0-19 20-26 20-35z M35 56h30 M50 44v26',guanyin:'M50 27c-10-18-29 0-20 17l20 27 20-27c9-17-10-35-20-17z M25 78h50',atk:'M30 78l40-56-6 32-25 31z M32 60l20 14',spd:'M20 34h38 M15 49h31 M24 65h22 M59 24l21 23-21 28',hp:'M50 15l29 12v24c0 18-29 34-29 34S21 69 21 51V27z M50 33v28 M36 47h28',cd:'M77 40a29 29 0 1 0 0 23 M77 22v18H59 M50 33v20l12 8',crit:'M50 15l11 23 25 4-18 18 4 26-22-12-22 12 4-26-18-18 25-4z',pick:'M23 29l27-15 27 15v38L50 84 23 67z M23 29l27 16 27-16 M50 45v39'};
    return `<span class="card-emblem" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="39" stroke-dasharray="2 7"/><path d="${paths[key]||paths.hp}"/></svg><span>${esc(glyph)}</span></span>`;
  }
  function choiceHTML(c,i){const preview=previewChoice(c),key=c.key||c.id||'hp';return `<button type="button" class="upcard reward-card" data-i="${i}" style="--c:${esc(c.color||'#d9b877')}" aria-label="选择${esc(c.name)}"><span class="card-topline"><span class="tag">${esc(c.tag)}</span><span class="card-sequence">${['壹','贰','叁'][i]||i+1}</span></span>${emblem(key,c.glyph)}<span class="card-title"><span class="uname">${esc(c.name)}</span><span class="ulvl">${esc(c.lvl||'属性精进')}</span></span>${rowsHTML(preview.rows)}<span class="card-note">${esc(preview.note)}</span><span class="card-pick">选择此道 <kbd>${i+1}</kbd></span></button>`;}
  function rewardHTML(r){return `<div class="treasure-gains">${r.preview?.version===1?rowsHTML(r.preview.rows,['获得前','获得后']):'<p class="card-note">此奖励已在旧版领取并存档，当前效果保留。</p>'}<p class="card-note">${esc(r.preview?.note||'刷新不会重复领取奖励')}</p></div>`;}
  function spellHTML(key,from,to){return `<div class="gift-visual">${emblem(key,SPELLS[key].glyph)}<span>${esc(SpellGrowth.focus(key))}</span></div>${rowsHTML(spellRows(key,from,to),['当前','调整后'])}`;}
  function campHTML(id){const [name,glyph,key]={power:['磨剑','锋','atk'],body:['养生','养','hp'],focus:['静心','凝','cd']}[id];return `${emblem(key,glyph)}<strong>${name}</strong>${rowsHTML(campRows(id))}<span class="card-note">${id==='focus'?'术法与大招同步受益':'按本境上限结算'}</span>`;}
  function coreHTML(target,count){return rowsHTML(materialRows({['core'+target]:count}),['背包已有','领取后']);}
  return {previewChoice,previewReward,spellRows,rowsHTML,emblem,choiceHTML,rewardHTML,spellHTML,campHTML,coreHTML,applyCamp};
})();
