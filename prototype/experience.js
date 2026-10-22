/* Presentation preferences and nested overlays never mutate combat or award rewards. */
const ExperienceUI=(()=>{
  const key='xunsheng-experience-v1';let prefs,seen={},panel=null,previous=null,focus=null,summary=null,tip=null,mapSelection=null;
  const defaults=()=>({scale:100,effects:matchMedia('(pointer: coarse)').matches?'simple':'standard',shake:!matchMedia('(prefers-reduced-motion: reduce)').matches,mouseAim:true});
  function settings(){if(!prefs){prefs=defaults();try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s){if([90,100,110,120].includes(s.scale))prefs.scale=s.scale;if(['simple','standard'].includes(s.effects))prefs.effects=s.effects;for(const k of ['shake','mouseAim'])if(typeof s[k]==='boolean')prefs[k]=s[k];seen=s.seen||{};}}catch(_){}}return prefs;}
  function apply(){document.body.style.setProperty?.('--ui-scale',settings().scale/100);document.body.classList.toggle('simple-effects',settings().effects==='simple');}
  function persist(){try{localStorage.setItem(key,JSON.stringify({...prefs,seen}));return true;}catch(_){return false;}}
  function set(name,value){if(name==='scale'&&![90,100,110,120].includes(value)||name==='effects'&&!['standard','simple'].includes(value)||['shake','mouseAim'].includes(name)&&typeof value!=='boolean')return false;if(!['scale','effects','shake','mouseAim'].includes(name))return false;settings()[name]=value;apply();return persist();}
  function init(){
    settings();apply();panel=document.createElement('aside');panel.id='experiencePanel';panel.className='experience-overlay';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');document.body.appendChild(panel);
    const btn=document.createElement('button');btn.id='experienceBtn';btn.textContent='设置';btn.onclick=()=>open('settings');document.querySelector('.window-controls')?.appendChild(btn);
    const toast=document.createElement('aside');toast.id='combatFeedback';toast.setAttribute('aria-live','polite');toast.hidden=true;document.body.appendChild(toast);
    const info=document.createElement('aside');info.id='mapDetail';info.hidden=true;document.body.appendChild(info);
  }
  function open(kind='settings'){
    if(AscensionScene.active()||previous!==null)return;previous=G.state;focus=document.activeElement;G.state=kind;clearInput();
    panel.hidden=false;panel.innerHTML=`<section class="experience-sheet"><header><div><span class="overline">寻圣 · 行旅手册</span><h2>${kind==='help'?'战 斗 与 探 路':'画 面 与 操 作'}</h2></div><button id="experienceClose" aria-label="关闭，返回之前内容">×</button></header>${kind==='help'?helpHTML():settingsHTML()}<footer><span id="preferenceStatus" role="status">设置保存在此浏览器 · 战斗已暂停</span><button class="btn" id="experienceDone">返回之前内容 <kbd>Esc</kbd></button></footer></section>`;
    document.getElementById('experienceClose').onclick=close;document.getElementById('experienceDone').onclick=close;
    panel.querySelectorAll('[data-preference]').forEach(n=>n.onchange=()=>{const name=n.dataset.preference,value=n.type==='checkbox'?n.checked:name==='scale'?Number(n.value):n.value;document.getElementById('preferenceStatus').textContent=set(name,value)?'设置已保存':'尚未保存 · 本次设置仍可使用';});
    document.getElementById('experienceClose').focus?.();
  }
  function settingsHTML(){const s=settings();return `<p class="sheet-lead">保留危险预警与真实攻击，按设备选择装饰细节。</p><label class="preference-row"><span>界面缩放<small>文字、按钮与面板尺寸</small></span><select data-preference="scale" aria-label="界面缩放">${[90,100,110,120].map(v=>`<option value="${v}" ${s.scale===v?'selected':''}>${v}%</option>`).join('')}</select></label><label class="preference-row"><span>装饰特效<small>简化粒子与拖影，攻击和奖励保持一致</small></span><select data-preference="effects" aria-label="装饰特效"><option value="standard" ${s.effects==='standard'?'selected':''}>标准</option><option value="simple" ${s.effects==='simple'?'selected':''}>简化</option></select></label><label class="preference-row"><span>屏幕震动<small>低动态偏好默认关闭</small></span><input type="checkbox" data-preference="shake" ${s.shake?'checked':''}></label><label class="preference-row"><span>鼠标瞄准剑河<small>关闭后朝集火目标、最近敌人或人物朝向释放</small></span><input type="checkbox" data-preference="mouseAim" ${s.mouseAim?'checked':''}></label>`;}
  function helpHTML(){return `<div class="help-grid"><article><b>01 · 移动与集火</b><p>WASD 移动，空格闪避。右键妖怪设为集火目标；再次点击或右键空地取消。目标离开画面或超过900距离后解除。</p><p>手机：左侧拖动摇杆，右侧轻点妖怪集火，用独立按钮闪避。</p></article><article><b>02 · 三式大招</b><p>Q / R / T 使用携行大招。剑河朝鼠标方向，施放后方向锁定。五雷先覆盖不同敌人，再集中剩余雷击，集火目标优先。</p></article><article><b>03 · 因地制敌</b><p>断援：先击毁妖幡，打断远程妖众。借势：靠近机关按 E，0.8秒后令范围内妖众减速；每营3次，间隔6秒。</p><p>破障妖众消耗护盾，联射远程错峰攻击，侧袭妖众绕行。危险轮廓收满前离开。</p></article><article><b>04 · 探路与成长</b><p>Tab 开舆图，点击已发现标记查看详情、设定路线。已点亮驿站可在安全时传送。C 查看人物、术法赠礼和破境材料。</p><p>Esc 返回上层内容；面板期间战斗暂停。守关大妖始终受伤，成功破招可造成更高伤害。</p></article></div>`;}
  function close(){if(previous===null)return;panel.hidden=true;G.state=RunSave.conflicted()?'save-conflict':previous;previous=null;clearInput();last=performance.now();if(!RunSave.conflicted())focus?.focus?.();}
  function handleKey(e){
    const audio=document.getElementById('audioPanel');if(previous===null&&e.key==='Escape'&&audio?.hidden===false){e.preventDefault();document.getElementById('closeAudioBtn')?.onclick?.();return true;}
    if(previous!==null){if(e.key==='Escape'){e.preventDefault();close();}else if(e.code==='Tab'){const nodes=[...panel.querySelectorAll('button,select,input')].filter(n=>!n.disabled);const index=nodes.indexOf(document.activeElement);if(nodes.length&&(e.shiftKey&&index<=0||!e.shiftKey&&index===nodes.length-1)){e.preventDefault();nodes[e.shiftKey?nodes.length-1:0].focus();}}return true;}
    if(e.key==='Escape'&&G.state==='station'){e.preventDefault();document.getElementById('closeStationBtn')?.onclick?.();return true;}
    if(e.key==='Escape'&&G.state==='chest'){e.preventDefault();closeChest();return true;}
    if(e.key==='Escape'&&G.state==='journal'){const btn=document.getElementById('closeWorldLore')||document.getElementById('closeJournalBtn');if(btn?.onclick){e.preventDefault();btn.onclick();return true;}}
    return false;
  }
  function teach(id,text){settings();if(seen[id])return;seen[id]=true;persist();tip={text,until:G.time+7};}
  function tick(){if(G.state!=='playing')return;teach('controls','右键集火 · 空格闪避 · Q / R / T 大招 · E 机关 · Tab 路线 · Esc 操作手册');}
  function campCleared(c){summary={title:CampTactics.title(c)+' '+(c.id+1)+' · 已清理',text:'斩妖 '+c.kills+' · 已拾取灵蕴 '+Math.round(c.tactics.rewards.xp)+' · 修为 +'+Math.round(c.tactics.rewards.qi)+' · 精华 +'+c.tactics.rewards.essence,until:G.time+9};const stations=World.markers().filter(s=>s.kind==='station').sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));if(stations[0])summary.text+=' · '+stations[0].name+(stations[0].unlocked?'已点亮':'尚待清理周围营地');}
  function sync(){
    if(!P)return;if(previous!==null&&RunSave.conflicted())close();const c=EncounterDirector.status().camps.filter(c=>c.state==='active').sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
    if(G.state==='playing'&&!World.active()&&c)document.getElementById('objectiveText').textContent=c.title+' · 第'+c.wave+'/3波 · 剩余 '+c.remaining;
    document.getElementById('shieldTxt').textContent='护盾 '+Math.ceil(P.shield)+' / '+Math.ceil(P.shieldMax);
    const toast=document.getElementById('combatFeedback'),item=summary?.until>G.time?summary:tip?.until>G.time?tip:null;
    if(toast){toast.hidden=G.state!=='playing'||!item;if(item){const content=(item.title?'<strong>'+item.title+'</strong>':'')+'<span>'+item.text+'</span>'+(item.title?'<button id="nextCampGoal">下一目标 →</button>':'');if(toast.innerHTML!==content){toast.innerHTML=content;const b=document.getElementById('nextCampGoal');if(b)b.onclick=()=>{World.setGuide('camp');summary=null;};}}}
    const info=document.getElementById('mapDetail');if(info)info.hidden=G.state!=='map'||!mapSelection;
    document.querySelectorAll('.ic[data-spell]').forEach(n=>n.setAttribute('aria-label',n.title));
  }
  function mapDetail(marker){mapSelection=marker;const info=document.getElementById('mapDetail');info.hidden=false;info.innerHTML=`<div><span class="overline">舆图 · 路线目标</span><strong>${marker.name}</strong><p>${marker.detail}</p></div><button class="btn" id="setMapGoal">沿路前往 →</button><button id="closeMapDetail" aria-label="关闭目标详情">×</button>`;document.getElementById('setMapGoal').onclick=()=>{World.guideTo(marker.key);World.toggleMap();mapSelection=null;};document.getElementById('closeMapDetail').onclick=()=>{mapSelection=null;info.hidden=true;};}
  function resultHTML(){const before=Journey.run.checkpoint,recipe=Cultivation.recipe(),materials=P.cultivation.materials;let text='';if(recipe){const missing=Math.max(0,recipe.coreCount-(materials[recipe.core]||0)),essence=Math.max(0,recipe.essence-materials.essence);text='<p>下次突破材料缺口：'+Cultivation.cores[P.cultivation.realm]+' ×'+missing+' · 灵蕴精华 ×'+essence+'</p><small>本境三关全部通关后开放对应域外挑战；大妖强度 ×2，胜利必得半份突破材料。</small>';}
    const gain=Object.entries(materials).filter(([k,n])=>n>(before?.cultivation?.materials?.[k]||0)).map(([k,n])=>(k==='essence'?'灵蕴精华':Cultivation.cores[Number(k.slice(4))-1])+' +'+(n-(before?.cultivation?.materials?.[k]||0))).join(' · ');
    return '<section class="result-growth"><span class="overline">本次历程 · 当前结存变化</span><div class="result-values"><b>等级 '+(before?.level||P.level)+' → '+P.level+'</b><b>伤害 '+Number(before?.dmg||P.dmg).toFixed(2)+'× → '+P.dmg.toFixed(2)+'×</b><b>生命上限 '+Math.round(before?.maxHp||P.maxHp)+' → '+Math.round(P.maxHp)+'</b></div><p>'+(gain||'当前材料结存未增加（突破消耗已计入）')+'</p>'+text+'</section>';
  }
  function menu(){const shelf=document.querySelector('.journey-chapters');if(!shelf)return;shelf.querySelectorAll('[data-stage]').forEach(n=>{const c=ChapterCatalog.get(Number(n.dataset.stage));if(n.querySelector('.chapter-material'))return;const line=document.createElement('small');line.className='chapter-material';line.textContent='◇ '+Cultivation.lootLabel(c.realm);n.appendChild(line);});}
  function damageText(e,damage,crit,color){
    const prior=G.texts.find(t=>t.target===e.id&&t.crit===crit&&G.time-t.stamp<.14&&t.life>0);
    if(prior){prior.total+=damage;prior.txt=(crit?'暴 ':'')+prior.total+(e.hp<=0?' · 斩':'');prior.life=Math.max(prior.life,.65);return;}
    addText(e.x,e.y-e.r-6,(crit?'暴 ':'')+damage+(e.hp<=0?' · 斩':''),crit?'#ffe69a':color,crit?24:18);const t=G.texts[G.texts.length-1];if(t)Object.assign(t,{target:e.id,crit,total:damage,stamp:G.time});
  }
  function danger(){return G.telegraphs.some(t=>Math.hypot(t.x-P.x,t.y-P.y)<(t.r||150)+200)||G.enemies.some(e=>e.action==='windup'&&Math.hypot(e.x-P.x,e.y-P.y)<450);}
  function friendly(fn){ctx.save();if(danger())ctx.globalAlpha*=.4;fn();ctx.restore();}
  function reset(){summary=null;tip=null;mapSelection=null;Targeting.reset();}
  return {init,settings,set,open,close,handleKey,teach,tick,sync,campCleared,mapDetail,resultHTML,menu,damageText,friendly,reset,saveState:()=>EndingScene.active()?EndingScene.priorState():previous||G.state};
})();
