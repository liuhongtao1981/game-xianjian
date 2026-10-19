/* Encounter-local power and rewards. Nothing here reads the player's current HP. */
const CombatScaling=(()=>{
  const exponents={story:[.45,.50],normal:[.60,.65],hard:[.65,.70],nightmare:[.70,.75]};
  const copy=o=>JSON.parse(JSON.stringify(o));
  const limits={story:[.10,.22,.35],normal:[.15,.30,.45],hard:[.18,.35,.55],nightmare:[.22,.40,.65]};
  let peak=null,boss=null,current=null,serial=0;
  function scores(p=P,reference=false){
    const r=p.cultivation.realm,spells=p.spells,rows=Object.entries(spells).map(([id,l])=>({id,s:SpellGrowth.spec(id,l,r),rate:id==='wanjian'?0:1/Math.max(.25,SPELLS[id].cd*p.cdr)}));
    const total=rows.reduce((n,x)=>n+x.rate,0),budget=Math.min(1,3/Math.max(.001,total));let output=0,sustain=p.regen||0;
    for(const {id,s,rate} of rows){
      const f=rate*budget;
      if(id==='wanjian')output+=s.damage/.45;
      else if(id==='gudu')output+=s.damage*Math.min(1,4*f);
      else if(id==='bingxin')sustain+=s.shield*f;
      else if(id==='guanyin')sustain+=s.heal*f;
      else output+=s.damage*f;
    }
    const u=reference?{damage:l=>300+l*22,cd:24}:Journey.ultimate(),kind=reference?'heaven':Journey.run.ultimate;
    // Estimate three aimed salvos with at most three useful hits each, rather than
    // counting every decorative/sideways sword as a guaranteed single-target hit.
    const ultimateDamage=u.damage(p.level)*(kind==='river'?9:1)+(kind==='lotus'?100:0);
    if(kind==='lotus')sustain+=(p.maxHp*.24+40)/u.cd*.35;
    output=(output+ultimateDamage/u.cd*.35)*p.dmg*(1+Math.min(1,Math.max(0,p.crit)));
    return {output:Math.max(.01,output),survival:(p.maxHp+.6*p.shieldMax)/Math.max(.15,1-p.armor),sustain:Math.min(30,Math.max(0,sustain)),realm:r+((p.cultivation.layer||1)-1)/9};
  }
  const reference=()=>scores({maxHp:120,shieldMax:70,armor:.05,regen:0,dmg:1,crit:.05,cdr:1,level:1,spells:{yujian:1},cultivation:{realm:0,layer:1}},true);
  function observe(p=P){const value=scores(p);if(!peak)peak=value;else for(const key of ['output','survival','sustain','realm'])peak[key]=Math.max(peak[key],value[key]);return {...peak};}
  function reset(){peak=null;boss=null;current=null;serial=0;observe();}
  function rewards(risk){const log=Math.log2(Math.max(1,risk));return {xp:Math.min(4,1+.7*log),qi:Math.min(2.5,1+.35*log),essence:Math.min(.25,.05*(1+.5*log)),medicine:Math.min(.06,.035+.005*log),chest:risk>=2?Math.min(.015,.002+.003*log):0,core:Math.min(.5,.15*log)};}
  function snapshot(kind='camp',tier=1){
    const p=observe(),ref=reference(),ratio=Math.max(1,p.output/ref.output),difficulty=Journey.run.difficulty,[hpExp,defExp]=exponents[difficulty]||exponents.normal;
    const hp=Math.max(1,ratio**(kind==='boss'?.50:hpExp)),helper=Math.max(1,ratio**.45);
    const damage=Math.max(1,(p.survival/ref.survival)**defExp*(1+p.sustain/12)**.35*(1+.08*p.realm));
    const stage=kind==='camp'?(tier>=6?1.30:tier>=4?1.15:1):1;
    const risk=Math.max(1,Math.sqrt(hp*damage)*stage*({story:1,normal:1,hard:1.2,nightmare:1.4}[difficulty]||1));
    const value={version:1,id:++serial,kind,output:p.output,hp,helper,damage,risk,rewards:rewards(risk)};current=value;return copy(value);
  }
  function lockBoss(){if(!boss)boss=snapshot('boss');return copy(boss);}
  function bossProfile(){return boss?copy(boss):lockBoss();}
  function trait(type,s,elite=false){return !elite&&s.risk>=2&&Math.random()<.15?(type==='snake'?'volley':type==='fox'?'flank':'breaker'):null;}
  function decorate(e,s=null,options={}){
    s=s||(options.source==='boss'?bossProfile():snapshot(options.source==='patrol'?'patrol':'camp',options.tier||1));
    e.threat=copy(s);e.hp=e.maxHp=Math.round(Math.max(e.hp*s.hp,s.output*.7*(e.elite?5:1)));e.xp*=s.rewards.xp;
    e.trait=options.trait===undefined?trait(e.type,s,e.elite):options.trait;
    e.combatId=options.rewardKey||'enemy:'+s.id+':'+e.id;return e;
  }
  function context(e={}){return e.kind?e:{kind:e.boss?'boss':e.elite?'elite':'ordinary',scale:e.threat?.damage||1,shieldFactor:e.trait==='breaker'?1.5:1};}
  function hit(amount,source=null){
    const c=source?context(source):{kind:'environment',scale:1,shieldFactor:1};
    let damage=Math.max(0,Math.round(amount*(c.scale||1)*Math.max(0,1-P.armor)*Journey.difficulty().damage));
    const index=['ordinary','elite','boss'].indexOf(c.kind);if(index>=0)damage=Math.min(damage,P.maxHp*(limits[Journey.run.difficulty]||limits.normal)[index]);
    return {damage,shieldFactor:c.shieldFactor||1,kind:c.kind};
  }
  function regenState(p=P){const wait=Math.max(0,p.shieldDelay||0),engaged=G.enemies.some(e=>e.hp>0&&!e.eventObjective&&!e.bossHelper&&Math.hypot(e.x-p.x,e.y-p.y)<650);return {wait,engaged,normal:p.regen,combat:p.regen*.25,rate:wait?0:p.regen*(engaged?.25:1)};}
  function validSnapshot(s){return !!s&&s.version===1&&Number.isInteger(s.id)&&s.id>=1&&['camp','patrol','boss'].includes(s.kind)&&['output','hp','helper','damage','risk'].every(k=>Number.isFinite(s[k])&&s[k]>0&&s[k]<=1e12)&&s.hp>=1&&s.helper>=1&&s.damage>=1&&s.risk>=1&&s.rewards&&['xp','qi','essence','medicine','chest','core'].every(k=>Number.isFinite(s.rewards[k])&&Math.abs(s.rewards[k]-rewards(s.risk)[k])<1e-8);}
  function validState(s){return !!s&&Number.isInteger(s.serial)&&s.serial>=0&&s.peak&&['output','survival','sustain','realm'].every(k=>Number.isFinite(s.peak[k])&&s.peak[k]>=0&&s.peak[k]<=1e12)&&(!s.boss||validSnapshot(s.boss))&&(!s.current||validSnapshot(s.current));}
  function exportState(){return {peak:{...peak},boss:boss?copy(boss):null,current:current?copy(current):null,serial};}
  function importState(s){if(!s){observe();return;}if(!validState(s))throw Error('Invalid threat state');peak={...s.peak};boss=s.boss?copy(s.boss):null;current=s.current?copy(s.current):null;serial=s.serial;observe();}
  function status(){const s=current;return {risk:s?.risk||1,rewards:s?.rewards||rewards(1),peak:{...peak}};}
  function hud(){const s=status();return '劫压 '+s.risk.toFixed(1)+'× · 经验 '+s.rewards.xp.toFixed(1)+'× · 灵材 '+Math.round(s.rewards.essence*100)+'%';}
  return {scores,observe,reset,rewards,snapshot,lockBoss,bossProfile,trait,decorate,context,hit,regenState,validSnapshot,validState,exportState,importState,status,hud};
})();

const CombatRewards=(()=>{
  const forEnemy=e=>e?.threat?.rewards||CombatScaling.rewards(1);
  function coreBonus(e){return Math.random()<forEnemy(e).core?1:0;}
  function enhancedChest(){
    const unowned=P.equips.length<8?EQUIPS.filter(e=>!P.equips.includes(e.id)):[];
    if(unowned.length){const e=pick(unowned);return {kind:'equip',id:e.id,name:e.name,glyph:e.glyph,color:e.color,desc:e.desc};}
    const upgrades=Object.keys(P.spells).filter(k=>P.spells[k]<SPELLS[k].max);
    if(upgrades.length){const key=pick(upgrades);return {kind:'spell-up',key,name:SPELLS[key].name+' · 精进一级',glyph:SPELLS[key].glyph,color:SPELLS[key].color,desc:SPELLS[key].desc(P.spells[key]+1)};}
    const learn=Object.keys(SPELLS).filter(k=>!P.spells[k]);
    if(Object.keys(P.spells).length<6&&learn.length){const key=pick(learn);return {kind:'spell',key,name:SPELLS[key].name,glyph:SPELLS[key].glyph,color:SPELLS[key].color,desc:SPELLS[key].desc(1)};}
    const r=ChapterCatalog.reward(Journey.run.stage),materials={essence:8,[r.core]:1},name='灵蕴精华 ×8 · '+Cultivation.cores[Number(r.core.slice(4))-1]+' ×1';
    return {kind:'material',materials,name,glyph:'晶',color:'#c7dba0',desc:'术法与法宝已满，封印匣化作本章突破材料。'};
  }
  return {forEnemy,coreBonus,enhancedChest};
})();
