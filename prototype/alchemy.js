/* The furnace, inventory and its random stream share the character's atomic save. */
const Alchemy=(()=>{
  const materialNames={herb:'青灵草',dew:'寒泉露',crystal:'净魄砂',ember:'赤焰髓'};
  const families={vitality:{name:'回春丹',glyph:'生',color:'#93caa8',detail:'回复生命',amount:[.25,.45,.65]},spirit:{name:'归元丹',glyph:'元',color:'#9ac8eb',detail:'补充仙力',amount:[.35,.6,1]},insight:{name:'悟道丹',glyph:'悟',color:'#cfb5ed',detail:'斩妖修为增益',amount:[.15,.25,.35]},ward:{name:'护脉丹',glyph:'护',color:'#ddc38b',detail:'修复护盾',amount:[.3,.5,.75]}};
  const grades=['下品','中品','上品'],requiredRealm=[0,3,7],baseChance=[86,70,54],cooldownSeconds=18;
  const recipes=Object.entries(families).flatMap(([family,spec])=>grades.map((grade,i)=>{
    const cost=family==='vitality'?{herb:2+i*2,dew:1+i}:family==='spirit'?{dew:2+i*2,crystal:1+i}:family==='insight'?{herb:1+i,crystal:2+i*2}:{herb:1+i,ember:1+i};
    if(i===2)cost.ember=(cost.ember||0)+1;
    return {id:family+(i+1),family,grade:i+1,name:grade+'·'+spec.name,glyph:spec.glyph,color:spec.color,realm:requiredRealm[i],materials:cost,precursor:i?family+i:null,precursorCount:i?2:0,amount:spec.amount[i],duration:family==='insight'?45+i*15:0};
  }));
  const recipeById=Object.fromEntries(recipes.map(r=>[r.id,r]));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
  const number=(n,max=1e7)=>Number.isFinite(n)&&n>=0&&n<=max;
  const count=n=>Number.isInteger(n)&&number(n,1e6);
  let panel=null,before=null,focusBefore=null,readOnly=false,preview=null,tab='recipes',selected='vitality1',message='',busy=false;

  function fresh(){return {version:1,seed:Math.floor(Math.random()*4294967295)||1,attempts:0,proficiency:0,materials:{herb:4,dew:3,crystal:2,ember:1},pills:{vitality1:2,spirit1:1},cooldown:0,insight:{remaining:0,bonus:0},lastResult:null};}
  function valid(a){
    return plain(a)&&a.version===1&&Number.isInteger(a.seed)&&a.seed>0&&a.seed<=4294967295&&count(a.attempts)&&Number.isInteger(a.proficiency)&&number(a.proficiency,1000)
      &&plain(a.materials)&&Object.entries(a.materials).every(([k,n])=>Object.hasOwn(materialNames,k)&&count(n))
      &&plain(a.pills)&&Object.entries(a.pills).every(([k,n])=>Object.hasOwn(recipeById,k)&&count(n))
      &&number(a.cooldown,cooldownSeconds)&&plain(a.insight)&&number(a.insight.remaining,75)&&number(a.insight.bonus,.35)
      &&(a.lastResult===null||plain(a.lastResult)&&Object.hasOwn(recipeById,a.lastResult.id)&&typeof a.lastResult.success==='boolean'&&Number.isInteger(a.lastResult.attempt)&&a.lastResult.attempt===a.attempts&&number(a.lastResult.chance,98));
  }
  function clean(a){
    if(!a)return fresh();
    if(valid(a))return clone(a);
    const n=fresh();n.materials={herb:0,dew:0,crystal:0,ember:0};n.pills={};
    if(!plain(a))return n;
    if(Number.isInteger(a.seed)&&a.seed>0&&a.seed<=4294967295)n.seed=a.seed;
    if(count(a.attempts))n.attempts=a.attempts;
    if(Number.isInteger(a.proficiency)&&number(a.proficiency,1000))n.proficiency=a.proficiency;
    for(const key of Object.keys(materialNames))if(count(a.materials?.[key]))n.materials[key]=a.materials[key];
    for(const key of Object.keys(recipeById))if(count(a.pills?.[key]))n.pills[key]=a.pills[key];
    if(number(a.cooldown,cooldownSeconds))n.cooldown=a.cooldown;
    if(number(a.insight?.remaining,75)&&number(a.insight?.bonus,.35))n.insight={remaining:a.insight.remaining,bonus:a.insight.bonus};
    if(plain(a.lastResult)&&Object.hasOwn(recipeById,a.lastResult.id)&&typeof a.lastResult.success==='boolean'&&a.lastResult.attempt===n.attempts&&number(a.lastResult.chance,98))n.lastResult={id:a.lastResult.id,success:a.lastResult.success,attempt:n.attempts,chance:a.lastResult.chance};
    return n;
  }
  function ensure(p=P){if(!p.alchemy)p.alchemy=fresh();return p.alchemy;}
  function probability(id,p=P){const r=recipeById[id];if(!r)return 0;const a=ensure(p);return Math.min(98,baseChance[r.grade-1]+Math.min(16,Math.floor(a.proficiency/25))+Math.min(10,Math.max(0,p.cultivation.realm-r.realm)*2));}
  function effectText(r){const amount=Math.round(r.amount*100);return r.family==='insight'?r.duration+'秒内，斩妖修为 +'+amount+'%（不含大妖结算）':families[r.family].detail+' '+amount+'%'+(r.family==='spirit'?'最大仙力':r.family==='ward'?'最大护盾':'最大生命');}
  function safe(){
    const defeated=!!G.boss?.killed&&G.boss.hp<=0;
    if(G.boss&&!defeated||World.active()&&!defeated)return false;
    return !(G.enemies||[]).some(e=>e.hp>0&&!e.eventObjective&&Math.hypot(e.x-P.x,e.y-P.y)<650)&&!(G.telegraphs||[]).some(t=>Math.hypot((t.x??P.x)-P.x,(t.y??P.y)-P.y)<(t.r||200)+250);
  }
  function allowed(){return !!P&&P.hp>0&&RunSave.active()&&!RunSave.conflicted()&&!AscensionScene.active()&&!EndingScene.active()&&['playing','paused','character','station','map','win','alchemy'].includes(G.state)&&!(G.state==='alchemy'&&readOnly);}
  function brewReason(id,p=P){
    const r=recipeById[id];if(!r)return '丹方不存在';
    if(!allowed())return '继续历程后可以炼制';
    if(!safe())return '附近有妖或正在迎战大妖，安全后方可开炉';
    if(p.cultivation.realm<r.realm)return Cultivation.realms[r.realm]+'境开放此品阶';
    const a=ensure(p);if((a.pills[r.id]||0)>=1e6||a.attempts>=1e6)return '丹囊已满';
    if(r.precursor&&(a.pills[r.precursor]||0)<r.precursorCount)return '需'+recipeById[r.precursor].name+' ×'+r.precursorCount;
    for(const [key,n]of Object.entries(r.materials))if((a.materials[key]||0)<n)return materialNames[key]+'不足';
    return '';
  }
  function brew(id,expectedAttempt=ensure().attempts){
    if(busy||brewReason(id)||expectedAttempt!==ensure().attempts)return false;
    busy=true;const a=ensure(),previous=clone(a),r=recipeById[id],chance=probability(id);
    // The next roll depends only on the persisted stream. Failed writes restore it too.
    a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;if(a.seed===0)a.seed=1;
    const success=a.seed/4294967296<chance/100;
    for(const [key,n]of Object.entries(r.materials))a.materials[key]-=n;
    if(r.precursor)a.pills[r.precursor]-=r.precursorCount;
    if(success)a.pills[id]=(a.pills[id]||0)+1;
    a.attempts++;a.proficiency=Math.min(1000,a.proficiency+(success?3:1));a.lastResult={id,success,chance,attempt:a.attempts};
    if(!RunSave.save('炼丹结果')){P.alchemy=previous;message='此次开炉未保存，药材与丹药已原数保留。';busy=false;return false;}
    message=success?'丹成 · '+r.name+' ×1，已存入丹囊。':'丹火未合 · 此炉材料已消耗，炼丹熟练 +1。';
    if(typeof notifyPickup==='function')notifyPickup('material',success?r.name+' +1':'炼丹失败 · 熟练 +1');
    if(typeof Sound!=='undefined')Sound.effects(success?'chest':'click');
    busy=false;return true;
  }
  function consumeReason(id){
    const r=recipeById[id];if(!r)return '丹药不存在';if(!allowed())return '请先继续历程';
    const a=ensure();if(!(a.pills[id]>0))return '丹囊暂无此丹';if(a.cooldown>0)return '药力调息中 · '+Math.ceil(a.cooldown)+'秒';
    if(r.family==='vitality'&&P.hp>=P.maxHp)return '生命已满';
    if(r.family==='spirit'&&(typeof ImmortalMovement==='undefined'||P.mana>=ImmortalMovement.max()))return '仙力已满';
    if(r.family==='ward'&&(P.shieldMax<=0||P.shield>=P.shieldMax))return '护盾已满';
    if(r.family==='insight'&&a.insight.remaining>0)return '悟道药力尚在，不可叠加';
    return '';
  }
  function consume(id){
    if(busy||consumeReason(id))return false;busy=true;
    const a=ensure(),previous=clone(a),stats={hp:P.hp,shield:P.shield,mana:P.mana},r=recipeById[id];
    a.pills[id]--;a.cooldown=cooldownSeconds;
    if(r.family==='vitality')P.hp=Math.min(P.maxHp,P.hp+P.maxHp*r.amount);
    else if(r.family==='spirit')ImmortalMovement.restore(ImmortalMovement.max()*r.amount);
    else if(r.family==='ward')P.shield=Math.min(P.shieldMax,P.shield+P.shieldMax*r.amount);
    else a.insight={remaining:r.duration,bonus:r.amount};
    if(!RunSave.save('服用丹药')){P.alchemy=previous;Object.assign(P,stats);message='服药未保存，丹药已退回。';busy=false;return false;}
    message='已服用'+r.name+' · '+effectText(r);if(typeof notifyPickup==='function')notifyPickup('heal',r.name+' · '+effectText(r));
    if(typeof syncHUD==='function')syncHUD();busy=false;return true;
  }
  function quickUse(family){
    if(!Object.hasOwn(families,family)||!P)return false;const a=ensure();
    const options=recipes.filter(r=>r.family===family&&a.pills[r.id]>0);
    const missing=family==='vitality'?Math.max(0,1-P.hp/P.maxHp):family==='spirit'&&typeof ImmortalMovement!=='undefined'?Math.max(0,1-P.mana/ImmortalMovement.max()):family==='ward'?Math.max(0,1-P.shield/Math.max(1,P.shieldMax)):0;
    const r=options.find(r=>r.amount>=missing)||options[options.length-1];return r?consume(r.id):false;
  }
  function update(dt){if(G.state!=='playing'||!P||dt<=0)return;const a=ensure();a.cooldown=Math.max(0,a.cooldown-dt);a.insight.remaining=Math.max(0,a.insight.remaining-dt);if(a.insight.remaining===0)a.insight.bonus=0;}
  function qiMultiplier(){return P&&ensure().insight.remaining>0?1+ensure().insight.bonus:1;}
  function award(materials){const a=ensure();for(const[key,n]of Object.entries(materials))a.materials[key]=Math.min(1e6,(a.materials[key]||0)+n);}
  function hash(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;}
  function onKill(e){
    if(!P||!RunSave.active()||e.boss||e.bossHelper||e.eventObjective||!e.combatId)return false;
    const h=hash(Journey.run.stage+':'+e.combatId),rare=e.elite;
    if(!rare&&h%100>=24)return false;
    if(!RunSave.claim('drop:'+Journey.run.stage+':alchemy:'+e.combatId))return false;
    const keys=Object.keys(materialNames),key=rare?'crystal':keys[(h>>>8)%4],materials=rare?{herb:2,dew:1,crystal:1,ember:1}:{[key]:1};award(materials);
    if(rare)notifyPickup('material','采得丹材 · 净魄砂、赤焰髓');return true;
  }
  function onCampCleared(c){if(!P||!RunSave.active()||!Number.isInteger(c?.id)||!RunSave.claim('drop:'+Journey.run.stage+':alchemy:camp:'+c.id))return false;award({herb:2,dew:1,...(c.id%3===2?{ember:1}:{})});return true;}
  function onVictory(){if(!P||!RunSave.active())return false;const extra=Journey.run.extramural?2:1;award({herb:6*extra,dew:4*extra,crystal:3*extra,ember:2*extra});notifyPickup('material','守关丹材 · 青灵草、寒泉露、净魄砂、赤焰髓');return true;}

  function init(){
    if(panel)return;panel=document.createElement('aside');panel.id='alchemyPanel';panel.className='alchemy-overlay';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','丹药合炼');document.body.appendChild(panel);
    const button=document.createElement('button');button.id='pillBtn';button.textContent='丹炉 B';button.setAttribute('aria-label','打开丹药合炼，快捷键 B');button.onclick=()=>open();document.querySelector('.window-controls')?.appendChild(button);
    const quick=document.createElement('div');quick.id='quickPills';quick.className='quick-pills';quick.setAttribute('aria-label','快捷服用丹药');quick.innerHTML='<button id="quickHealBtn" class="quick-pill" aria-label="服用回春丹，回复生命"><span>回春</span><small>1 · 2枚</small></button><button id="quickManaBtn" class="quick-pill" aria-label="服用归元丹，回复仙力"><span>归元</span><small>2 · 1枚</small></button>';document.querySelector('.actions')?.appendChild(quick);
    document.getElementById('quickHealBtn').onclick=()=>quickUse('vitality');document.getElementById('quickManaBtn').onclick=()=>quickUse('spirit');sync();
  }
  function open(){
    if(before!==null)return false;if(AscensionScene.active()||EndingScene.active()||RunSave.conflicted()||!['start','playing','paused','character','station','map','win'].includes(G.state))return false;
    init();before=G.state;readOnly=G.state==='start'||!RunSave.active();preview=readOnly?clone(RunSave.snapshot()?.run.player||P||newPlayer()):null;if(preview)ensure(preview);
    focusBefore=document.activeElement;clearInput();G.state='alchemy';document.body.classList.add('in-alchemy');panel.hidden=false;message='';tab='recipes';render();panel.querySelector('#alchemyClose')?.focus?.();return true;
  }
  function close(){
    if(before===null)return false;
    const restore=before,overlay=document.getElementById('overlay'),scroll=overlay.scrollTop||0,contentScroll=document.querySelector('.character-content')?.scrollTop||0;
    before=null;panel.hidden=true;document.body.classList.remove('in-alchemy');clearInput();G.state=RunSave.conflicted()?'save-conflict':restore;preview=null;readOnly=false;
    if(!RunSave.conflicted()){
      if(restore==='character'){CharacterUI.draw();overlay.scrollTop=scroll;const content=document.querySelector('.character-content');if(content)content.scrollTop=contentScroll;}
      const focus=restore==='character'?(focusBefore?.id?document.getElementById(focusBefore.id):focusBefore?.dataset?.sheet?overlay.querySelector('[data-sheet="'+focusBefore.dataset.sheet+'"]'):document.getElementById('closeCharacterBtn')):focusBefore;
      focus?.focus?.({preventScroll:true});
    }
    if(typeof last!=='undefined')last=performance.now();return true;
  }
  function render(){
    if(before===null)return;const p=preview||P,a=ensure(p),r=recipeById[selected],chance=probability(r.id,p),reason=readOnly?'继续历程后可以炼制':brewReason(r.id,p),result=a.lastResult;
    panel.innerHTML=`<section class="alchemy-sheet"><header class="alchemy-header"><div><span class="overline">丹火承命 · 药石济身</span><h2>天 工 丹 炉</h2><p>炼丹熟练 ${a.proficiency} / 1000 · 已开 ${a.attempts} 炉 · ${readOnly?'存档预览':'历程已暂停'}</p></div><button id="alchemyClose" aria-label="关闭丹炉，返回原界面">×</button></header><div class="alchemy-materials">${Object.entries(materialNames).map(([key,name])=>`<div><i aria-hidden="true">${key==='herb'?'葉':key==='dew'?'露':key==='crystal'?'砂':'髓'}</i><span>${name}<b>${a.materials[key]||0}</b></span></div>`).join('')}</div><div class="alchemy-layout"><aside class="alchemy-furnace"><div class="alchemy-vessel" aria-hidden="true"><div class="alchemy-vessel-lid"></div><div class="alchemy-vessel-body"><span>丹</span></div><div class="alchemy-fire"></div></div><span class="overline">合 炼 所 选</span><h3>${r.name}</h3><p>${effectText(r)}</p><div class="alchemy-chance"><strong>${chance}<small>%</small></strong><span>本炉成功率</span></div><p class="alchemy-formula">基础 ${baseChance[r.grade-1]}% + 熟练 ${Math.min(16,Math.floor(a.proficiency/25))}% + 境界 ${Math.min(10,Math.max(0,p.cultivation.realm-r.realm)*2)}%<br>最终成功率上限 98%</p><ul class="alchemy-cost">${(r.precursor?[[r.precursor,r.precursorCount]]:[]).concat(Object.entries(r.materials)).map(([key,n])=>{const owned=recipeById[key]?a.pills[key]||0:a.materials[key]||0;return `<li class="${owned<n?'short':''}"><span>${recipeById[key]?.name||materialNames[key]}</span><b>${owned} / ${n}</b></li>`;}).join('')}</ul><p class="alchemy-risk">每炉产出 1 枚。失败也会消耗本炉全部药材${r.precursor?'与合炼底丹':''}；成功熟练 +3，失败 +1。</p><button id="alchemyBrew" class="btn" ${reason?'disabled':''}>${reason?'暂不能开炉':'开炉合炼 · '+chance+'%'}</button><p class="alchemy-reason">${reason||'此炉材料齐备，可开炉'}</p>${result?`<div class="alchemy-last ${result.success?'success':'failure'}">第 ${result.attempt} 炉 · ${recipeById[result.id].name}<br>${result.success?'丹成，已收入丹囊':'失败，材料已消耗'} · 当炉成功率 ${result.chance}%</div>`:''}</aside><section class="alchemy-catalog"><nav class="alchemy-tabs" aria-label="丹炉内容"><button data-alchemy-tab="recipes" aria-pressed="${tab==='recipes'}">炼制方谱 · 十二方</button><button data-alchemy-tab="inventory" aria-pressed="${tab==='inventory'}">携行丹囊 · ${Object.values(a.pills).reduce((s,n)=>s+n,0)}</button></nav><div class="alchemy-cards">${recipes.filter(r=>tab==='recipes'||a.pills[r.id]>0).map(item=>`<article class="alchemy-card ${selected===item.id?'selected':''}" style="--pill:${item.color}"><div class="alchemy-pill" aria-hidden="true">${item.glyph}<small>${'·'.repeat(item.grade)}</small></div><div class="alchemy-card-copy"><span>${grades[item.grade-1]} · ${Cultivation.realms[item.realm]}境开放</span><h3>${item.name}</h3><p>${effectText(item)}</p><small>持有 ${a.pills[item.id]||0} 枚${tab==='recipes'?' · 成功率 '+probability(item.id,p)+'%':''}</small></div><div class="alchemy-card-actions"><button data-alchemy-select="${item.id}" aria-label="查看${item.name}丹方" aria-pressed="${selected===item.id}">查看丹方</button><button data-alchemy-use="${item.id}" ${readOnly||consumeReason(item.id)?'disabled':''} title="${readOnly?'继续历程后可服用':consumeReason(item.id)||effectText(item)}">服用一枚</button></div></article>`).join('')||'<p class="alchemy-empty">丹囊已空。采集药材后可在方谱开炉。</p>'}</div></section></div><footer class="alchemy-footer"><p id="alchemyMessage" role="status" aria-live="polite">${message||'药材来源：斩妖采集、清理营地、击败守关大妖。中品 / 上品各需要两枚同系低阶丹合炼。'}</p><small>丹药共用 18 秒调息；悟道效果不可叠加。1 回春 · 2 归元 · B / Esc 返回</small></footer></section>`;
    panel.querySelector('#alchemyClose').onclick=close;
    const attempt=a.attempts;panel.querySelector('#alchemyBrew').onclick=()=>{brew(selected,attempt);render();panel.querySelector('#alchemyBrew')?.focus?.();};
    panel.querySelectorAll('[data-alchemy-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.alchemyTab;render();panel.querySelector('[data-alchemy-tab="'+tab+'"]')?.focus?.();});
    panel.querySelectorAll('[data-alchemy-select]').forEach(button=>button.onclick=()=>{selected=button.dataset.alchemySelect;render();panel.querySelector('[data-alchemy-select="'+selected+'"]')?.focus?.();});
    panel.querySelectorAll('[data-alchemy-use]').forEach(button=>button.onclick=()=>{const id=button.dataset.alchemyUse;consume(id);render();panel.querySelector('[data-alchemy-select="'+id+'"]')?.focus?.();});
  }
  function sync(){
    if(before!==null&&(RunSave.conflicted()||G.state!=='alchemy'))close();
    const bar=document.getElementById('quickPills');if(!bar)return;bar.hidden=G.state!=='playing'||!P;if(bar.hidden)return;
    const a=ensure();for(const[family,id,key]of[['vitality','quickHealBtn','1'],['spirit','quickManaBtn','2']]){
      const button=document.getElementById(id),options=recipes.filter(r=>r.family===family&&a.pills[r.id]>0),amount=options.reduce((sum,r)=>sum+a.pills[r.id],0),ready=options.some(r=>!consumeReason(r.id));
      if(!button)continue;button.disabled=!ready;const label=button.querySelector('small'),text=a.cooldown>0?Math.ceil(a.cooldown)+'秒':key+' · '+amount+'枚';if(label&&label.textContent!==text)label.textContent=text;button.title=options.length?consumeReason(options[0].id)||'服用合适品阶'+families[family].name:'暂无'+families[family].name;
    }
  }
  function handleKey(e){
    if(before!==null){if(e.key==='Escape'||e.code==='KeyB'){e.preventDefault();close();}else if(!readOnly&&!e.repeat&&['Digit1','Digit2'].includes(e.code)){e.preventDefault();quickUse(e.code==='Digit1'?'vitality':'spirit');render();panel.querySelector('#alchemyClose')?.focus?.();}else if(e.code==='Tab'||e.key==='Tab'){const nodes=[...panel.querySelectorAll('button:not(:disabled),[tabindex="0"]')];const index=nodes.indexOf(document.activeElement);if(nodes.length&&(e.shiftKey&&index<=0||!e.shiftKey&&(index===nodes.length-1||index<0))){e.preventDefault();nodes[e.shiftKey?nodes.length-1:0].focus();}}return true;}
    if(e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return false;
    if(e.code==='KeyB'){e.preventDefault();return open();}
    if(G.state==='playing'&&['Digit1','Digit2'].includes(e.code)){e.preventDefault();quickUse(e.code==='Digit1'?'vitality':'spirit');return true;}return false;
  }
  return {recipes,families,materialNames,fresh,clean,valid,ensure,probability,effectText,safe,brewReason,brew,consumeReason,consume,quickUse,update,qiMultiplier,onKill,onCampCleared,onVictory,init,open,close,handleKey,sync,active:()=>before!==null,priorState:()=>before,inventory:(p=P)=>clone(ensure(p))};
})();
