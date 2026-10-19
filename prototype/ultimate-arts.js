/* Three equipped arts keep independent charge/cooldowns inside the same save. */
const UltimateArts=(()=>{
  const keys=['heaven','lotus','river'],hotkeys=['Q','R','T'];
  const validLoadout=a=>Array.isArray(a)&&a.length>=1&&a.length<=3&&new Set(a).size===a.length&&a.every(k=>keys.includes(k));
  function loadout(){const a=validLoadout(Journey.run.equippedUltimates)?Journey.run.equippedUltimates:keys;return [Journey.run.ultimate,...a.filter(k=>k!==Journey.run.ultimate)].filter(k=>a.includes(k));}
  const cooldown=p=>Math.max(.2,Math.min(1,p.cdr));
  const realmScale=p=>1.28**(p.cultivation.realm+((p.cultivation.layer||1)-1)/9);
  const damage=(id,p=P)=>Journey.ultimates[id].damage(p.level)*realmScale(p);
  function validState(a){return !!a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).every(k=>keys.includes(k))&&Object.values(a).every(s=>s&&Number.isFinite(s.energy)&&s.energy>=0&&s.energy<=100&&Number.isFinite(s.cd)&&s.cd>=0&&s.cd<1e7);}
  function ensure(p=P,primary=Journey.run.ultimate){
    if(!validState(p.ultimateArts))p.ultimateArts={};
    for(const id of keys)if(!p.ultimateArts[id])p.ultimateArts[id]={energy:id===primary?(p.energy??100):100,cd:id===primary?(p.ultCd||0):0};
    // Keep the original fields as the primary art's aliases for old checkpoints.
    const main=p.ultimateArts[primary];
    if(p.ultimatePrimary&&p.ultimatePrimary!==primary){p.energy=main.energy;p.ultCd=main.cd;}
    p.ultimatePrimary=primary;main.energy=p.energy??main.energy;main.cd=p.ultCd??main.cd;
    return p.ultimateArts;
  }
  function sync(p=P){const s=p.ultimateArts[Journey.run.ultimate];p.energy=s.energy;p.ultCd=s.cd;}
  function charge(amount,p=P){const states=ensure(p);for(const s of Object.values(states))s.energy=Math.min(100,s.energy+amount);sync(p);}
  function tick(dt){const states=ensure();for(const s of Object.values(states)){s.cd=Math.max(0,s.cd-dt);s.energy=Math.min(100,s.energy+dt*2*Journey.difficulty().charge/cooldown(P));}sync();}
  function ready(id){const s=ensure()[id];return loadout().includes(id)&&s.energy>=100&&s.cd<=0;}
  function spend(id){if(!ready(id))return false;const s=P.ultimateArts[id];s.energy=0;s.cd=Journey.ultimates[id].cd*cooldown(P);sync();return true;}
  function floor(e,d,cast){
    if(!cast||e.boss||e.bossHelper||e.eventObjective||!Number.isFinite(e.maxHp)||e.maxHp<=0)return d;
    cast.minimumApplied??=new Set();if(cast.minimumApplied.has(e.id))return d;
    cast.minimumApplied.add(e.id);return Math.max(d,Math.ceil(e.maxHp*.4));
  }
  function snapshot(p=P,primary=Journey.run.ultimate){return JSON.parse(JSON.stringify(ensure(p,primary)));}
  function hud(){
    const selected=loadout(),states=ensure();
    for(let i=0;i<3;i++){
      const suffix=i||'',button=document.getElementById('ultimateBtn'+suffix),id=selected[i];button.hidden=!id;if(!id)continue;
      const spec=Journey.ultimates[id],s=states[id],can=G.state==='playing'&&P.hp>0&&ready(id)&&!G.ultimate;
      button.disabled=!can;button.classList.toggle('ready',can);button.style.setProperty?.('--art-color',spec.color);
      document.getElementById('ultFill'+suffix).style.height=s.energy+'%';
      document.getElementById('ultStatus'+suffix).textContent=s.cd>0?'冷却 '+s.cd.toFixed(1)+'s':s.energy>=100?hotkeys[i]+' · '+spec.short:'剑意 '+Math.floor(s.energy)+'%';
      button.querySelector('span').textContent=spec.glyph;button.setAttribute('aria-label','释放大招：'+spec.name);button.title=spec.name+' · 本境基础伤害 '+Math.round(damage(id))+' · 冷却 '+(spec.cd*cooldown(P)).toFixed(1)+'秒 · 非大妖首击至少40%最大生命';
    }
  }
  function sheet(){return loadout().map(id=>{const u=Journey.ultimates[id],s=ensure()[id];return `<div class="inventory-item"><b>${u.name}</b><small>本境基础伤害 ${Math.round(damage(id))}${id==='river'?' / 柄':''} × 面板伤害倍率 · 冷却 ${(u.cd*cooldown(P)).toFixed(1)}秒 · 独立剑意 ${Math.floor(s.energy)}%</small><small>非大妖首次命中至少削去40%最大生命；大妖按实际伤害结算。${u.desc}</small></div>`;}).join('');}
  return {keys,hotkeys,validLoadout,loadout,cooldown,realmScale,damage,validState,ensure,sync,charge,tick,ready,spend,floor,snapshot,hud,sheet};
})();
