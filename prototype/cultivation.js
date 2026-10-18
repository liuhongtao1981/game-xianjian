/* Persistent cultivation is independent of combat level and skill slots. */
const Cultivation=(()=>{
  const realms=['筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫','真仙','玄仙','金仙','太乙金仙','大罗金仙','仙王'];
  const cores=['凝丹莲实','九曲灵参','养魂神木','虚空晶髓','阴阳并蒂莲','七彩补天芝','九霄雷液','羽化仙露','太玄玉髓','金曜仙砂','太乙道莲','混元道果','鸿蒙仙髓'];
  const upper=['maxHp','shieldMax','dmg','speed','crit','armor','pickup','regen','xpMul'];
  const fresh=()=>({realm:0,qi:0,materials:{essence:0},floors:{},attempts:0,result:null});
  function valid(c){return !!c&&Number.isInteger(c.realm)&&c.realm>=0&&c.realm<=13&&Number.isFinite(c.qi)&&c.qi>=0&&c.qi<=108160&&c.materials&&typeof c.materials==='object'&&!Array.isArray(c.materials)&&Object.entries(c.materials).every(([k,v])=>(k==='essence'||/^core([1-9]|1[0-3])$/.test(k))&&Number.isInteger(v)&&v>=0&&v<=1e7)&&c.floors&&typeof c.floors==='object'&&Number.isInteger(c.attempts)&&c.attempts>=0;}
  function clean(c){
    const n=fresh();if(!c||typeof c!=='object')return n;
    n.realm=Number.isInteger(c.realm)&&c.realm>=0&&c.realm<14?c.realm:0;
    n.qi=Number.isFinite(c.qi)?Math.max(0,Math.min(108160,c.qi)):0;
    for(const k of ['essence',...cores.map((_,i)=>'core'+(i+1))])n.materials[k]=Number.isInteger(c.materials?.[k])?Math.max(0,Math.min(1e7,c.materials[k])):0;
    for(const k of [...upper,'cdr'])if(Number.isFinite(c.floors?.[k])&&c.floors[k]>0&&c.floors[k]<1e9)n.floors[k]=c.floors[k];
    n.attempts=Number.isInteger(c.attempts)?Math.max(0,c.attempts):0;
    if(c.result&&typeof c.result.success==='boolean')n.result={success:c.result.success,target:Math.min(13,Math.max(1,Number(c.result.target)||1)),chance:Number(c.result.chance)||0,loss:Number(c.result.loss)||0,attempt:n.attempts};
    return n;
  }
  const recipe=(realm=P.cultivation.realm)=>realm>=13?null:{target:realm+1,core:'core'+(realm+1),name:cores[realm],coreCount:2*(realm+1),essence:8*(realm+1),qi:320*(realm+1)**2};
  function label(c=P.cultivation){const r=recipe(c.realm);return realms[c.realm]+'·'+(r?['初期','中期','后期','圆满'][Math.min(3,Math.floor(c.qi/r.qi*4))]:'道圆');}
  function caps(p=P){const r=p.cultivation.realm,f=p.cultivation.floors;
    const v={maxHp:Math.floor(600*1.28**r),shieldMax:Math.floor(250*1.25**r),dmg:8*1.22**r,speed:Math.min(520,380+10*r),crit:.6+.01*r,armor:.6+.008*r,cdr:Math.max(.35,.55-.015*r),pickup:Math.min(650,360+20*r),regen:6+r,xpMul:3};
    for(const k of upper)v[k]=Math.max(v[k],f[k]||0);v.cdr=Math.min(v.cdr,f.cdr??1);return v;
  }
  function protectLegacy(p){p.cultivation=clean(p.cultivation);for(const k of [...upper,'cdr'])p.cultivation.floors[k]=p[k];}
  function constrain(p=P){const v=caps(p);for(const k of upper)p[k]=Math.min(p[k],v[k]);p.cdr=Math.max(v.cdr,p.cdr);p.hp=Math.min(p.hp,p.maxHp);p.shield=Math.min(p.shield,p.shieldMax);}
  function canStat(id){const key={atk:'dmg',spd:'speed',hp:'maxHp',cd:'cdr',crit:'crit',pick:'pickup'}[id],v=caps();return key==='cdr'?P.cdr>v.cdr+.00001:P[key]<v[key]-.00001;}
  function xpNeed(level){let x=10;for(let l=1;l<Math.min(level,15);l++)x=Math.floor(x*1.32+4);return level<=15?x:x+80*(level-15)+8*(level-15)**2;}
  function qi(amount){const r=recipe();if(r)P.cultivation.qi=Math.min(2*r.qi,P.cultivation.qi+amount);}
  function addMaterial(key,n){P.cultivation.materials[key]=(P.cultivation.materials[key]||0)+n;notifyPickup('material',(key==='essence'?'灵蕴精华':cores[Number(key.slice(4))-1])+' +'+n);}
  function onKill(e){
    if(e.eventObjective||e.bossHelper||e.boss)return false;
    qi(e.elite?30:2);
    const rare=!e.elite||RunSave.claim('elite:'+Journey.run.stage+':'+e.encounterId);
    if(e.elite&&rare)addMaterial('essence',4);else if(!e.elite&&Math.random()<.05)addMaterial('essence',1);
    return rare;
  }
  function victory(){
    if(RunSave.claim('boss:'+Journey.run.stage)){qi(150);addMaterial('essence',8);}
    if(!RunSave.claimed('core:'+Journey.run.stage))G.coreReward={max:Math.min(13,(Journey.run.tier||0)+1)};
  }
  function claimCore(target){
    if(G.state!=='win'||!G.coreReward||!Number.isInteger(target)||target<1||target>G.coreReward.max)return false;
    if(!RunSave.claim('core:'+Journey.run.stage))return false;
    addMaterial('core'+target,1);G.coreReward=null;RunSave.save('首领材料');Journey.showEnd(true);return true;
  }
  function chance(core,essence){const r=recipe();if(!r)return 0;const q=.7*Math.min(1,core/r.coreCount)+.3*Math.min(1,essence/r.essence);return q>=1?100:Number((5+95*q**3).toFixed(1));}
  function safe(){return !World.active()&&!G.enemies.some(e=>e.hp>0&&!e.eventObjective&&Math.hypot(e.x-P.x,e.y-P.y)<650);}
  function attempt(core,essence){
    const r=recipe(),c=P.cultivation;
    if(G.state!=='character'||!safe()||!r||c.result||c.qi<r.qi||RunSave.conflicted())return false;
    if(!Number.isInteger(core)||!Number.isInteger(essence)||core<0||essence<0||core>Math.min(r.coreCount,c.materials[r.core]||0)||essence>Math.min(r.essence,c.materials.essence||0))return false;
    const before=JSON.parse(JSON.stringify(c)),stats=Object.fromEntries([...upper,'cdr','hp'].map(k=>[k,P[k]]));
    const rate=chance(core,essence),success=rate===100||Math.random()*100<rate,loss=success?r.qi:r.qi*.1;
    c.materials[r.core]=(c.materials[r.core]||0)-core;c.materials.essence-=essence;c.qi=Math.max(0,c.qi-loss);c.attempts++;
    if(success){const hp=P.maxHp;c.realm++;P.maxHp*=1.12;P.shieldMax*=1.12;P.dmg*=1.08;constrain();P.hp=Math.min(P.maxHp,P.hp+P.maxHp-hp);const next=recipe();if(next)c.qi=Math.min(c.qi,next.qi*2);}
    c.result={success,target:r.target,chance:rate,loss,attempt:c.attempts};
    if(RunSave.active()&&!RunSave.save('突破结果')){P.cultivation=before;Object.assign(P,stats);return false;}
    Sound.effects(success?'level':'hit');return true;
  }
  return {realms,cores,fresh,valid,clean,recipe,label,caps,protectLegacy,constrain,canStat,xpNeed,qi,addMaterial,onKill,victory,claimCore,chance,safe,attempt};
})();
