/* Persistent cultivation is independent of combat level and skill slots. */
const Cultivation=(()=>{
  const realms=['筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫','真仙','玄仙','金仙','太乙金仙','大罗金仙','仙王'];
  const cores=['凝丹莲实','九曲灵参','养魂神木','虚空晶髓','阴阳并蒂莲','七彩补天芝','九霄雷液','羽化仙露','太玄玉髓','金曜仙砂','太乙道莲','混元道果','鸿蒙仙髓'];
  const upper=['maxHp','shieldMax','dmg','speed','crit','armor','pickup','regen','xpMul'];
  const fresh=()=>({realm:0,layer:1,qi:0,qiRemainder:0,materials:{essence:0},floors:{},attempts:0,result:null});
  function valid(c){return !!c&&Number.isInteger(c.realm)&&c.realm>=0&&c.realm<=13&&Number.isFinite(c.qi)&&c.qi>=0&&c.qi<=125440&&(c.qiRemainder===undefined||Number.isFinite(c.qiRemainder)&&c.qiRemainder>=0&&c.qiRemainder<1)&&Number.isInteger(c.layer)&&c.layer>=1&&c.layer<=9&&c.materials&&typeof c.materials==='object'&&!Array.isArray(c.materials)&&Object.entries(c.materials).every(([k,v])=>(k==='essence'||/^core([1-9]|1[0-3])$/.test(k))&&Number.isInteger(v)&&v>=0&&v<=1e7)&&c.floors&&typeof c.floors==='object'&&Number.isInteger(c.attempts)&&c.attempts>=0&&(c.spellGift===undefined||SpellGift.valid(c.spellGift,c.realm));}
  function clean(c){
    const n=fresh();if(!c||typeof c!=='object')return n;
    n.realm=Number.isInteger(c.realm)&&c.realm>=0&&c.realm<14?c.realm:0;
    n.qi=Number.isFinite(c.qi)?Math.max(0,Math.min(125440,c.qi)):0;
    n.qiRemainder=n.qi-Math.floor(n.qi);
    n.layer=Math.max(1,Math.min(9,Number.isInteger(c.layer)?c.layer:1+Math.floor(Math.min(8,n.qi/(320*(n.realm+1)**2)*9))));
    for(const k of ['essence',...cores.map((_,i)=>'core'+(i+1))])n.materials[k]=Number.isInteger(c.materials?.[k])?Math.max(0,Math.min(1e7,c.materials[k])):0;
    for(const k of [...upper,'cdr'])if(Number.isFinite(c.floors?.[k])&&c.floors[k]>0&&c.floors[k]<1e9)n.floors[k]=c.floors[k];
    n.attempts=Number.isInteger(c.attempts)?Math.max(0,c.attempts):0;
    if(c.spellGift&&SpellGift.valid(c.spellGift,n.realm))n.spellGift=JSON.parse(JSON.stringify(c.spellGift));
    if(c.result&&typeof c.result.success==='boolean')n.result={success:c.result.success,target:Math.min(13,Math.max(1,Number(c.result.target)||1)),chance:Number(c.result.chance)||0,loss:Number(c.result.loss)||0,attempt:n.attempts,automatic:c.result.automatic===true};
    return n;
  }
  const recipe=(realm=P.cultivation.realm)=>realm>=13?null:{target:realm+1,core:'core'+(realm+1),name:cores[realm],coreCount:2*(realm+1),essence:8*(realm+1),qi:320*(realm+1)**2};
  const lootLabel=realm=>realm>=13?'仙王道圆 · 修为与灵蕴':cores[realm]+' · 30%掉落';
  const outsideReward=realm=>realm>=13?{core:null,coreCount:0,essence:56,qi:31360}:{core:'core'+(realm+1),coreCount:realm+1,essence:4*(realm+1),qi:150};
  const outsideText=realm=>realm>=13?'灵蕴精华 ×56、修为31,360；仙王已无后续境界，可继续修至九层道圆。':cores[realm]+' ×'+(realm+1)+'、灵蕴精华 ×'+(4*(realm+1))+'，各为突破'+realms[realm+1]+'所需的50%。修为仍须自行积累。';
  const need=(c=P.cultivation)=>320*(c.realm+1)**2;
  function label(c=P.cultivation){const layer=c.layer||Math.min(9,1+Math.floor(c.qi/need(c)*9));return realms[c.realm]+'·'+['一','二','三','四','五','六','七','八','九'][layer-1]+'层'+(c.qi>=need(c)?c.realm===13?'·道圆':'·圆满':'');}
  function caps(p=P){const r=p.cultivation.realm+((p.cultivation.layer||1)-1)/9,f=p.cultivation.floors;
    const v={maxHp:Math.floor(600*1.28**r),shieldMax:Math.floor(250*1.25**r),dmg:8*1.22**r,speed:Math.min(520,380+10*r),crit:.6+.01*r,armor:.6+.008*r,cdr:.2,pickup:Math.min(650,360+20*r),regen:6+r,xpMul:3};
    for(const k of upper)v[k]=Math.max(v[k],f[k]||0);return v;
  }
  function protectLegacy(p){p.cultivation=clean(p.cultivation);for(const k of [...upper,'cdr'])p.cultivation.floors[k]=p[k];}
  function constrain(p=P){const v=caps(p);for(const k of upper)p[k]=Math.min(p[k],v[k]);p.cdr=Math.max(v.cdr,p.cdr);p.hp=Math.min(p.hp,p.maxHp);p.shield=Math.min(p.shield,p.shieldMax);}
  function canStat(id){const key={atk:'dmg',spd:'speed',hp:'maxHp',cd:'cdr',crit:'crit',pick:'pickup'}[id],v=caps();return key==='cdr'?P.cdr>v.cdr+.00001:P[key]<v[key]-.00001;}
  function xpNeed(level){let x=10;for(let l=1;l<Math.min(level,15);l++)x=Math.floor(x*1.32+4);return level<=15?x:x+80*(level-15)+8*(level-15)**2;}
  function settle(p=P){const c=p.cultivation,target=Math.min(9,1+Math.floor(c.qi/need(c)*9));while(c.layer<target){const hp=p.maxHp;c.layer++;p.maxHp*=1.02;p.shieldMax*=1.02;p.dmg*=1.01;const limit=caps(p);for(const k of upper)p[k]=Math.min(p[k],limit[k]);p.hp=Math.min(p.maxHp,p.hp+p.maxHp-hp);}return c.layer;}
  function advanceLayers(save=true){if(!autoStates.includes(G.state)||AscensionScene.active()||P.hp<=0||RunSave.conflicted())return false;const old=P.cultivation.layer;settle();if(P.cultivation.layer===old)return false;notifyPickup('cultivation','修炼精进 · '+label());if(save)RunSave.save('自动升层');RealmVisuals.advance(false,{fromLayer:old});return true;}
  function qi(amount,save=true){const c=P.cultivation;c.qi=Math.min(need(c)*(c.realm===13?1:2),c.qi+amount);c.qiRemainder=c.qi-Math.floor(c.qi);advanceLayers(save);}
  function addMaterial(key,n){P.cultivation.materials[key]=(P.cultivation.materials[key]||0)+n;notifyPickup('material',(key==='essence'?'灵蕴精华':cores[Number(key.slice(4))-1])+' +'+n);}
  function onKill(e){
    if(e.eventObjective||e.bossHelper||e.boss)return false;
    const risk=CombatRewards.forEnemy(e);qi((e.elite?30:2)*risk.qi,false);
    const rare=!e.elite||RunSave.claim('elite:'+Journey.run.stage+':'+e.encounterId);
    if(e.elite&&rare)addMaterial('essence',Math.ceil(4*risk.qi));else if(!e.elite&&Math.random()<risk.essence)addMaterial('essence',1);
    return rare;
  }
  function victory(){
    if(Journey.run.extramural){
      if(RunSave.claim('outer:boss:'+Journey.run.stage)){
        const r=outsideReward(ChapterCatalog.get(Journey.run.stage).realm);
        if(r.core)addMaterial(r.core,r.coreCount);addMaterial('essence',r.essence);
        qi(r.qi,false);
      }
      return;
    }
    const reward=ChapterCatalog.reward(Journey.run.stage);
    const risk=CombatRewards.forEnemy(G.boss),first=RunSave.claim('boss:'+Journey.run.stage);
    if(first){if(G.boss?.xp)gainXP(G.boss.xp,false);const initial=RunSave.claim('first:boss:'+Journey.run.stage);qi((initial?reward.qi:150)*risk.qi,false);addMaterial('essence',Math.ceil((initial?reward.essence:8)*risk.qi));
      // The boss claim records both successful and failed rolls, so reload cannot reroll loot.
      if(reward.core&&Math.random()<.3){addMaterial(reward.core,Math.max(1,reward.count));RunSave.claim('drop:'+Journey.run.stage+':realm');}
    }
  }
  function claimCore(target){
    if(G.state!=='win'||!G.coreReward||!Number.isInteger(target)||target<1||target>G.coreReward.max)return false;
    if(!RunSave.claim('core:'+Journey.run.stage))return false;
    addMaterial('core'+target,G.coreReward.count||1);G.coreReward=null;RunSave.save('首领材料');Journey.showEnd(true);return true;
  }
  function chance(core,essence){const r=recipe();if(!r)return 0;const q=.7*Math.min(1,core/r.coreCount)+.3*Math.min(1,essence/r.essence);return q>=1?100:Number((5+95*q**3).toFixed(1));}
  function safe(){return !!G.boss?.killed||!World.active()&&!G.enemies.some(e=>e.hp>0&&!e.eventObjective&&Math.hypot(e.x-P.x,e.y-P.y)<650);}
  let autoDelay=0;
  const autoStates=['playing','win','story','character','levelup','chest','journal','map','station'];
  function ready(){const r=recipe();return !!r&&P.cultivation.layer===9&&P.cultivation.qi>=r.qi&&(P.cultivation.materials[r.core]||0)>=r.coreCount&&(P.cultivation.materials.essence||0)>=r.essence;}
  function autoStatus(){if(AscensionScene.active())return '破境演出中 · 完成后返回原内容';if(!recipe())return P.cultivation.layer===9&&P.cultivation.qi>=need()?'仙王九层道圆':'修为达标自动升层';if(ready())return RunSave.conflicted()?'存档冲突 · 自动突破已暂停':autoStates.includes(G.state)?'条件已齐 · 即将播放破境演出':'条件已齐 · 继续历程后自动破境';return P.cultivation.qi>=need()?'修为已满 · 材料备齐自动破境':'修为达标自动升层';}
  function update(dt){
    if(dt<=0||!autoStates.includes(G.state)||AscensionScene.active()||!P||P.hp<=0||RunSave.conflicted())return false;
    advanceLayers();
    autoDelay=Math.max(0,autoDelay-dt);if(autoDelay>0||!ready()||RealmVisuals.status()?.major)return false;
    autoDelay=1;const r=recipe();if(!attempt(r.coreCount,r.essence,true))return false;
    notifyPickup('cultivation','自动破境 · '+label()+' · 术法赠礼 +3');
    syncHUD();return true;
  }
  function attempt(core,essence,automatic=false){
    const r=recipe(),c=P.cultivation;
    if(!automatic||!autoStates.includes(G.state)||AscensionScene.active()||P.hp<=0||!r||c.layer!==9||c.qi<r.qi||RunSave.conflicted())return false;
    if(!Number.isInteger(core)||!Number.isInteger(essence)||core<0||essence<0||core>Math.min(r.coreCount,c.materials[r.core]||0)||essence>Math.min(r.essence,c.materials.essence||0))return false;
    if(automatic&&(core!==r.coreCount||essence!==r.essence||!ready()))return false;
    CombatScaling.observe();
    const scaling=CombatScaling.exportState(),before=JSON.parse(JSON.stringify(c)),stats=Object.fromEntries([...upper,'cdr','hp'].map(k=>[k,P[k]]));
    const rate=100,success=true,loss=r.qi;
    c.materials[r.core]=(c.materials[r.core]||0)-core;c.materials.essence-=essence;c.qi=Math.max(0,c.qi-loss);c.attempts++;
    if(success){const hp=P.maxHp;c.realm++;c.layer=1;P.maxHp*=1.12;P.shieldMax*=1.12;P.dmg*=1.08;constrain();P.hp=Math.min(P.maxHp,P.hp+P.maxHp-hp);c.qi=Math.min(c.qi,need(c)*(c.realm===13?1:2));settle();}
    c.qiRemainder=c.qi-Math.floor(c.qi);
    c.result={success,target:r.target,chance:rate,loss,attempt:c.attempts,automatic};
    if(RunSave.active()&&!RunSave.save('突破结果')){P.cultivation=before;Object.assign(P,stats);CombatScaling.importState(scaling);return false;}
    if(success){CombatScaling.observe();RealmVisuals.advance(true);AscensionScene.begin({fromRealm:before.realm,stats});}
    return true;
  }
  return {realms,cores,fresh,valid,clean,recipe,lootLabel,outsideReward,outsideText,need,settle,label,caps,protectLegacy,constrain,canStat,xpNeed,qi,addMaterial,onKill,victory,claimCore,chance,safe,ready,autoStatus,update,attempt,resetAutomation(){autoDelay=0;}};
})();
