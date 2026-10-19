/* A victory unlocks replay; reaching a chapter alone never unlocks it. */
const JourneyProgress=(()=>{
  const key='xunsheng-progress-v1',fields=['maxHp','hp','shieldMax','speed','dmg','cdr','crit','pickup','xpMul','armor','regen','level','xp','xpNext'];
  let data={version:1,cleared:0,entries:{}};
  const resources={shield:0,energy:100,ultCd:0,dashCd:0,shieldDelay:0};
  const spellKeys=['yujian','wanjian','wulei','sanmei','bingxin','gudu','jiushen','guanyin'];
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function cleanBuild(b){SpellGift.reconcile(b);return {...Object.fromEntries(fields.map(k=>[k,b[k]])),
    ...Object.fromEntries(Object.entries(resources).map(([k,v])=>[k,b[k]??v])),
    ...(b.ultimateArts?{ultimateArts:UltimateArts.snapshot(b,b.ultimatePrimary||'heaven'),ultimatePrimary:b.ultimatePrimary}:{}),heroId:HeroIdentity.clean(b.heroId),growthChoices:b.growthChoices??Math.max(0,Math.floor(b.level)-1),t:{...b.t},
    poison:b.poison===true,spells:{...b.spells},equips:[...b.equips],cultivation:Cultivation.clean(b.cultivation)};}
  function validBuild(b){
    return b&&fields.every(k=>Number.isFinite(b[k])&&Math.abs(b[k])<1e7)&&b.maxHp>0&&b.hp>0&&b.hp<=b.maxHp&&b.speed>0&&b.dmg>0&&b.cdr>0&&b.level>=1&&b.spells&&Object.entries(b.spells).every(([k,v])=>spellKeys.includes(k)&&Number.isInteger(v)&&v>=1&&v<=18)&&Array.isArray(b.equips)&&b.equips.length<=8&&b.equips.every(v=>['mujian','jifeng','jiuhu','wudu','nvwa','tiangang','juling','huxin'].includes(v))
      &&(b.ultimateArts===undefined||UltimateArts.validState(b.ultimateArts))&&(b.ultimatePrimary===undefined||UltimateArts.keys.includes(b.ultimatePrimary))
      &&(b.heroId===undefined||HeroIdentity.valid(b.heroId))
      &&Object.keys(resources).every(k=>b[k]===undefined||Number.isFinite(b[k])&&b[k]>=0&&b[k]<1e7)
      &&(b.shield===undefined||b.shield<=b.shieldMax)&&(b.energy===undefined||b.energy<=100)
      &&(b.growthChoices===undefined||Number.isInteger(b.growthChoices)&&b.growthChoices>=0&&b.growthChoices<1e7)
      &&(!b.cultivation?.spellGift||SpellGift.valid(b.cultivation.spellGift,b.cultivation.realm)&&SpellGift.keys.every(k=>(b.spells[k]||0)===(b.cultivation.spellGift.base[k]||0)+(b.cultivation.spellGift.levels[k]||0)))
      &&(b.t===undefined||b.t&&typeof b.t==='object'&&!Array.isArray(b.t)&&Object.entries(b.t).every(([k,v])=>spellKeys.includes(k)&&Number.isFinite(v)&&v>=0&&v<1e7));
  }
  try{
    const saved=JSON.parse(localStorage.getItem(key));
    if(saved?.version===1&&Number.isInteger(saved.cleared)&&saved.cleared>=0&&saved.cleared<=42){
      data.cleared=saved.cleared;
      for(const i of Array.from({length:41},(_,j)=>j+1)){const e=saved.entries?.[i];if(e&&['story','normal','hard','nightmare'].includes(e.difficulty)&&validBuild(e.build))data.entries[i]={difficulty:e.difficulty,build:cleanBuild(e.build)};}
      // Broken or older saves cannot expose a chapter without an entry build.
      if(data.cleared>1&&!data.entries[1])data.cleared=1;
      if(data.cleared>2&&!data.entries[2])data.cleared=2;
    }
  }catch{}
  function persist(){if(typeof RunSave!=='undefined'&&RunSave.active())return;try{localStorage.setItem(key,JSON.stringify(data));}catch{/* Session progression remains available. */}}
  function restore(saved){
    if(!saved||saved.version!==1||!Number.isInteger(saved.cleared)||saved.cleared<0||saved.cleared>42)throw new Error('Invalid chapter progress');
    const entries={};for(const i of Array.from({length:41},(_,j)=>j+1))if(saved.entries?.[i]){const e=saved.entries[i];if(!validBuild(e.build)||!['story','normal','hard','nightmare'].includes(e.difficulty))throw new Error('Invalid entry');entries[i]={difficulty:e.difficulty,build:cleanBuild(e.build)};}
    data={version:1,cleared:saved.cleared,entries};
  }
  function entry(stage,build,difficulty){if(stage<1||stage>=ChapterCatalog.playable||!validBuild(build))return;data.entries[stage]={difficulty,build:cleanBuild(build)};persist();}
  function clear(stage){if(stage===data.cleared){data.cleared=Math.min(42,data.cleared+1);persist();}}
  function canSelect(stage){const realm=typeof RunSave!=='undefined'&&RunSave.active()&&typeof P!=='undefined'&&P?P.cultivation.realm:typeof RunSave!=='undefined'?RunSave.snapshot()?.run.player.cultivation.realm||0:0;return Number.isInteger(stage)&&stage>=0&&stage<ChapterCatalog.playable&&stage<=data.cleared&&ChapterCatalog.get(stage).realm<=realm;}

  function replay(stage,difficulty,profiles){
    if(!canSelect(stage)||stage===0||!data.entries[stage])return null;
    const entry=data.entries[stage],build=copy(entry.build),fraction=build.hp/build.maxHp;
    build.maxHp=Math.max(1,build.maxHp+profiles[difficulty].hp-profiles[entry.difficulty].hp);
    build.hp=Math.min(build.maxHp,Math.max(build.maxHp*.7,build.maxHp*fraction));return build;
  }
  return {key,capture:cleanBuild,validBuild,restore,entry,clear,canSelect,replay,cleared:()=>data.cleared,snapshot:()=>copy(data)};
})();
