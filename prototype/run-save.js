/* One atomic envelope owns the character, chapter progress and reward ledger. */
const RunSave=(()=>{
  const key='xunsheng-save-v3',backup=key+'-backup',legacyKey='xunsheng-save-v2';
  const writer=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  let data=null,enabled=false,suppress=false,conflict=false,elapsed=0,message='自动存档待启用',bossEntry=null,ledger={},cycle=0,revision=0;
  const clone=v=>JSON.parse(JSON.stringify(v));
  function valid(d){
    if(!d||d.version!==3||!Number.isSafeInteger(d.revision)||d.revision<0||!Number.isFinite(d.savedAt)||typeof d.writer!=='string'||!d.progress||d.progress.version!==1||!Number.isInteger(d.progress.cleared)||d.progress.cleared<0||d.progress.cleared>42)return false;
    for(const e of Object.values(d.progress.entries||{}))if(!JourneyProgress.validBuild(e?.build)||!['story','normal','hard','nightmare'].includes(e.difficulty))return false;
    const s=d.run,b=s?.player;
    if(s?.extramural!==undefined&&typeof s.extramural!=='boolean')return false;
    if(s?.passage!==undefined&&s.passage!==null){const p=s.passage;if(!Number.isInteger(p.stage)||p.stage<0||p.stage>=ChapterCatalog.playable-1||d.progress.cleared<=p.stage||!['power','body','focus'].includes(p.reward)||!Number.isInteger(s.stage)||s.stage<0||s.stage>=ChapterCatalog.playable||ChapterCatalog.get(p.stage).realm!==ChapterCatalog.get(s.stage).realm||!s.extramural&&p.stage!==s.stage)return false;}
    if(!s||!b||!JourneyProgress.validBuild({...b,hp:Math.max(1,b.hp)})||!Cultivation.valid(b.cultivation)||!Number.isFinite(b.hp)||b.hp<0||!Number.isInteger(s.stage)||s.stage<0||s.stage>=ChapterCatalog.playable||!['story','normal','hard','nightmare'].includes(s.difficulty)||!['heaven','lotus','river'].includes(s.ultimate))return false;
    if(s.equippedUltimates!==undefined&&(!UltimateArts.validLoadout(s.equippedUltimates)||!s.equippedUltimates.includes(s.ultimate)))return false;
    if(!Number.isInteger(s.tier)||s.tier<0||s.tier>13||!Number.isInteger(s.cycle)||s.cycle<0||!Number.isInteger(s.queue)||s.queue<0||s.queue>10000||!Array.isArray(s.choices)||s.choices.length>3)return false;
    if(!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<0||s.x>ChapterCatalog.get(s.stage).width||s.y<0||s.y>ChapterCatalog.get(s.stage).height||!s.world||!Array.isArray(s.world.done)||s.world.done.length!==WorldNavData[s.stage].sites.length||!s.world.done.every(v=>typeof v==='boolean'))return false;
    if(!s.director||!Array.isArray(s.director.camps)||s.director.camps.length!==WorldNavData[s.stage].camps.length||!s.ledger||typeof s.ledger!=='object'||!Array.isArray(s.chests)||s.chests.length>30||!Array.isArray(s.completed)||!s.completed.every(v=>Number.isInteger(v)&&v>=0&&v<ChapterCatalog.playable))return false;
    for(const c of s.director.camps)if(!c||!Number.isInteger(c.id)||c.id<0||c.id>=WorldNavData[s.stage].camps.length||!Number.isInteger(c.wave)||c.wave<0||c.wave>3||!['active','dormant','unseen','cleared'].includes(c.state)||!Array.isArray(c.slots)||c.slots.length>60||c.slots.some(p=>!['imp','fox','snake','zombie'].includes(p.type)||!['camp','rune'].includes(p.source)||!Number.isFinite(p.tier)))return false;
    if(s.bossSpawned&&s.state!=='win'&&(!s.bossEntry||!s.bossEntry.world||!s.bossEntry.director||!Number.isFinite(s.bossEntry.x)||!Number.isFinite(s.bossEntry.y)))return false;
    if(s.chestReward){const r=s.chestReward;if(!['equip','spell','spell-up','heal','material'].includes(r.kind))return false;if(['spell','spell-up'].includes(r.kind)&&!SpellGift.keys.includes(r.key))return false;if(r.kind==='material'&&(!r.materials||Object.entries(r.materials).some(([k,n])=>!(k==='essence'||/^core([1-9]|1[0-3])$/.test(k))||!Number.isInteger(n)||n<1||n>1000)))return false;}
    for(const f of [s,s.bossEntry].filter(Boolean)){if(f.director.scaling&&!CombatScaling.validState(f.director.scaling))return false;for(const c of f.director.camps){if(c.threat&&!CombatScaling.validSnapshot(c.threat))return false;for(const p of c.slots)if(!validSlot(p))return false;}if(f.director.patrolSlots&&(!Array.isArray(f.director.patrolSlots)||f.director.patrolSlots.length>64||f.director.patrolSlots.some(p=>!validSlot(p))))return false;}
    if(s.chests.some(c=>c.kind!==undefined&&c.kind!=='enhanced'))return false;
    if(s.choices.some(c=>!['stat','up','new','recover'].includes(c.kind)||(c.kind==='stat'?!['atk','spd','hp','cd','crit','pick'].includes(c.id):c.kind==='recover'?false:!['yujian','wanjian','wulei','sanmei','bingxin','gudu','jiushen','guanyin'].includes(c.key))))return false;
    return true;
  }
  function validSlot(p){return !!p&&['imp','fox','snake','zombie'].includes(p.type)&&['camp','rune','patrol'].includes(p.source)&&Number.isFinite(p.tier)&&p.tier>0&&p.tier<100&&(!p.anchor||Number.isFinite(p.anchor.x)&&Number.isFinite(p.anchor.y))&&(!p.threat||CombatScaling.validSnapshot(p.threat))&&(!p.trait||['breaker','volley','flank'].includes(p.trait))&&(!p.rewardKey||typeof p.rewardKey==='string'&&p.rewardKey.length<180);}
  function read(k){try{let d=JSON.parse(localStorage.getItem(k));if(k.startsWith(legacyKey)&&d?.version===2)d=migrateV2(d);return valid(d)?d:null;}catch{return null;}}
  function migrateV2(value){
    const d=clone(value),s=d.run;if(!s||!Number.isInteger(s.stage)||s.stage<0||s.stage>2||!s.world||!Array.isArray(s.world.done)||s.world.done.length!==6||!s.director||s.director.camps?.length!==9)return null;
    const chapter=ChapterCatalog.get(s.stage),map=WorldNavData[s.stage];
    const player=p=>{if(!p)return;p.cultivation=Cultivation.clean(p.cultivation);for(const k of ['maxHp','shieldMax','dmg','speed','crit','armor','pickup','regen','xpMul','cdr'])if(Number.isFinite(p[k]))p.cultivation.floors[k]=k==='cdr'?Math.min(p[k],p.cultivation.floors[k]??1):Math.max(p[k],p.cultivation.floors[k]||0);};
    const frame=f=>{if(!f)return;f.x=f.x/3600*chapter.width;f.y=f.y/2600*chapter.height;f.world.done.push(...Array(map.sites.length-6).fill(false));for(let i=9;i<map.camps.length;i++)f.director.camps.push({id:i,state:'unseen',wave:0,timer:null,runesCreated:false,kills:0,slots:[]});if(f.chests)for(const c of f.chests){c.x=c.x/3600*chapter.width;c.y=c.y/2600*chapter.height;}};
    frame(s);frame(s.bossEntry);player(s.player);player(s.checkpoint);for(const e of Object.values(d.progress?.entries||{}))player(e.build);s.chapterId=chapter.id;s.tier=0;d.version=3;
    for(let i=0;i<3;i++)if(s.ledger?.['boss:'+i])s.ledger['first:boss:'+i]=true;
    return d;
  }
  function migrateBuild(b){const p=clone(b),fraction=p.xp/Math.max(1,p.xpNext);p.xpNext=Cultivation.xpNeed(p.level);p.xp=Math.min(p.xpNext-.00001,fraction*p.xpNext);Cultivation.protectLegacy(p);return p;}
  function init(){
    const primary=read(key),fallback=primary?null:read(backup),old=primary||fallback?null:read(legacyKey)||read(legacyKey+'-backup');data=primary||fallback||old;
    if(data){revision=data.revision;try{JourneyProgress.restore(data.progress);}catch{data=null;}message=fallback?'已恢复备份存档':old?'旧档已安全迁移 · 九层历程':'已有自动存档';}
    Journey.run.heroId=HeroIdentity.clean(data?.run.player.heroId);
    window.addEventListener('storage',event=>{if(event.key!==key||!event.newValue)return;try{receive(JSON.parse(event.newValue));}catch{}});
    window.addEventListener('pagehide',()=>save('离开网页'));window.addEventListener('beforeunload',()=>save('退出网页'));
    window.addEventListener('blur',()=>save('窗口失焦'));document.addEventListener('visibilitychange',()=>{if(document.hidden)save('切换网页');});
  }
  function receive(newer){if(valid(newer)&&newer.writer!==writer&&newer.revision>revision){conflict=true;message='另一窗口有新进度 · 请重新载入';clearInput();if(G.state!=='start'){G.state='save-conflict';const ov=document.getElementById('overlay');ov.classList.remove('hidden');ov.innerHTML='<div class="panel"><h2>历程已在另一窗口更新</h2><p>此窗口已停止保存，避免覆盖较新的成长。</p><button class="btn" id="reloadSaveBtn">载入最新存档</button></div>';document.getElementById('reloadSaveBtn').onclick=()=>{data=newer;revision=newer.revision;conflict=false;continueRun();};}}}
  function summary(){if(data)return {stage:data.run.stage,level:data.run.player.level,realm:Cultivation.label(data.run.player.cultivation),savedAt:data.savedAt};const old=JourneyProgress.snapshot(),stage=Math.min(ChapterCatalog.playable-1,old.cleared);const entry=old.entries[stage];return entry?{stage,level:entry.build.level,realm:'筑基·一层',savedAt:null}:null;}
  function capture(){
    CombatScaling.observe();
    return {version:3,revision:revision+1,writer,savedAt:Date.now(),progress:JourneyProgress.snapshot(),run:{cycle,tier:Journey.run.tier||0,ledger:clone(ledger),
      chapterId:ChapterCatalog.get(Journey.run.stage).id,stage:Journey.run.stage,extramural:Journey.run.extramural===true,passage:clone(Journey.run.passage),difficulty:Journey.run.difficulty,ultimate:Journey.run.ultimate,equippedUltimates:UltimateArts.loadout(),completed:[...Journey.run.completed],campaignTime:Journey.run.time,
      player:JourneyProgress.capture(P),checkpoint:clone(Journey.run.checkpoint),x:P.x,y:P.y,time:G.time,kills:G.kills,state:G.state,
      queue:G.queue,choices:clone(choicesCache),chestReward:clone(G.chestReward),pendingLore:G.pendingLore,coreReward:clone(G.coreReward),
      chests:G.chests.map(c=>({x:c.x,y:c.y,t:c.t||0,kind:c.kind,rewardId:c.rewardId||null})),world:World.exportState(),director:EncounterDirector.exportState(),bossSpawned:G.bossSpawned,bossEntry:clone(bossEntry)}};
  }
  function save(reason='自动保存'){
    if(suppress||!enabled||!P)return true;if(conflict)return false;if(['start','character-preview'].includes(G.state))return true;
    const newer=read(key);if(newer&&newer.writer!==writer&&newer.revision>revision){receive(newer);return false;}
    try{const next=capture();if(!valid(next))throw new Error('Invalid runtime snapshot');const previous=read(key);if(previous)try{localStorage.setItem(backup,JSON.stringify(previous));}catch{}
      localStorage.setItem(key,JSON.stringify(next));revision=next.revision;data=next;elapsed=0;message='已保存 '+new Date(next.savedAt).toLocaleTimeString('zh-CN',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});return true;
    }catch{message='尚未保存 · 浏览器存储不可用';return false;}
  }
  function tick(dt){if(enabled&&G.state==='playing'&&!conflict){elapsed+=dt;if(elapsed>=5)save();}}
  function start(stage=0,newCycle=false,newReplay=false,extramural=false,skipIntro=false){
    if(conflict||!JourneyProgress.canSelect(stage)||extramural&&!JourneyProgress.outsideUnlocked(stage))return false;
    const old=data?.run,legacy=JourneyProgress.replay(stage,Journey.run.difficulty,Journey.difficulties);
    if(old&&!newCycle&&(old.queue>0||old.chestReward||old.pendingLore!==null&&old.pendingLore!==undefined||old.coreReward))return false;
    let build=old?clone(old.player):legacy?migrateBuild(legacy):null;
    if(build)build.heroId=HeroIdentity.clean(Journey.run.heroId);
    if(build){const prior=old?.difficulty||Journey.run.difficulty;build.maxHp+=Journey.difficulties[Journey.run.difficulty].hp-Journey.difficulties[prior].hp;build.hp=build.hp<=0?build.maxHp:Math.max(1,Math.min(build.maxHp,build.hp));}
    if(newCycle){const finale=G.state==='win'&&Journey.run.stage===41&&!G.coreReward||G.state==='start'&&old?.state==='win'&&old.stage===41&&!old.coreReward;if(JourneyProgress.cleared()<42||!finale)return false;cycle=(old?.cycle??cycle)+1;ledger={};}
    else if(old){cycle=old.cycle;ledger=clone(old.ledger);}
    if(extramural)delete ledger['outer:boss:'+stage];
    if(!extramural&&(newReplay||old?.state==='win'&&stage<JourneyProgress.cleared())){for(const k of Object.keys(ledger))if(!k.startsWith('first:')&&new RegExp('^(boss|core|site|elite|drop):'+stage+'(?::|$)').test(k))delete ledger[k];}
    const passage=old?.passage&&(extramural||stage===old.passage.stage)&&ChapterCatalog.get(stage).realm===ChapterCatalog.get(old.passage.stage).realm?clone(old.passage):null;
    suppress=true;Journey.begin(stage);enabled=true;Journey.run.stage=stage;Journey.run.extramural=extramural===true;Journey.run.passage=passage;Journey.run.tier=0;Journey.run.checkpoint=build;reset();bossEntry=null;suppress=false;Journey.intro(skipIntro);save('开始历程');return true;
  }
  function continueRun(heroId=null){
    const requested=HeroIdentity.valid(heroId)?heroId:null;
    if(requested)Journey.run.heroId=requested;
    if(!data){const s=summary();return s?start(s.stage):false;}
    const latest=read(key);if(latest&&latest.revision>data.revision)data=latest;
    const s=clone(data.run);conflict=false;suppress=true;enabled=true;revision=data.revision;cycle=s.cycle;ledger=s.ledger;bossEntry=s.bossEntry;
    const priorHero=HeroIdentity.clean(s.player.heroId);if(requested){s.player.heroId=requested;if(s.checkpoint)s.checkpoint.heroId=requested;}
    JourneyProgress.restore(data.progress);
    const lockedOutside=s.extramural&&!JourneyProgress.outsideUnlocked(s.stage);
    if(lockedOutside){
      // Older challenge saves keep character growth and rewards, then return to the main story.
      if(s.bossEntry)Object.assign(s,{x:s.bossEntry.x,y:s.bossEntry.y,world:s.bossEntry.world,director:s.bossEntry.director,chests:s.bossEntry.chests||[]});
      s.extramural=false;s.completed=[];s.bossSpawned=false;s.bossEntry=null;bossEntry=null;s.state=s.state==='dead'?'dead':'story';
    }
    Object.assign(Journey.run,{heroId:HeroIdentity.clean(s.player.heroId),stage:s.stage,extramural:s.extramural===true,passage:s.passage||null,difficulty:s.difficulty,ultimate:s.ultimate,equippedUltimates:s.equippedUltimates||[s.ultimate,...UltimateArts.keys.filter(k=>k!==s.ultimate)],tier:s.tier,completed:s.completed,time:s.campaignTime,checkpoint:s.player});reset();Journey.run.checkpoint=s.checkpoint;
    const postVictory=s.bossSpawned&&s.completed.includes(s.stage)&&s.state!=='dead';
    const frame=s.bossSpawned&&!postVictory&&s.state!=='win'&&s.state!=='dead'?s.bossEntry:s;
    World.importState(frame.world);EncounterDirector.importState(frame.director);P.x=frame.x;P.y=frame.y;World.resolve(P,true);World.camera(0,true);G.time=s.time;G.kills=s.kills;G.queue=s.queue;choicesCache=s.choices;G.chests=frame.chests||[];
    G.chestReward=s.chestReward;G.pendingLore=s.pendingLore??null;G.coreReward=s.coreReward;
    if(s.state==='win'||postVictory){G.bossSpawned=true;G.boss={hp:0,killed:true};G.state='win';if(s.state==='levelup'&&G.queue>0)showLevelUp(s.choices.length?s.choices:null);else{Journey.showEnd(true);if(s.passage&&!s.extramural&&!G.queue&&!G.coreReward)Journey.resumePassage();}}
    else if(s.state==='dead'){G.state='dead';Journey.showEnd(false);}
    else if(s.chestReward){G.state='playing';openChest(s.chestReward,true);}
    else if(G.pendingLore!==null)World.resumeLore(G.pendingLore);
    else if(G.queue>0)showLevelUp(s.choices.length?s.choices:null);
    else if(s.state==='story'||s.extramural)Journey.intro();
    else {G.state='playing';togglePause();}
    suppress=false;if(lockedOutside)save('域外解锁条件更新');if(requested&&requested!==priorHero&&!save('切换剑仙')){P.heroId=priorHero;Journey.run.heroId=priorHero;if(Journey.run.checkpoint)Journey.run.checkpoint.heroId=priorHero;if(G.state==='story')Journey.intro();}renderSpells();renderEquips();syncHUD();return true;
  }
  function retry(){
    if(!['dead','paused'].includes(G.state))return false;const build=JourneyProgress.capture(P);build.hp=build.maxHp;build.shield=0;
    const queue=G.queue,offers=clone(choicesCache);Journey.run.checkpoint=build;reset();G.queue=queue;choicesCache=offers;bossEntry=null;Journey.intro();save('死亡重试');return true;
  }
  function prepareBoss(){bossEntry={x:P.x,y:P.y,world:World.exportState(),director:EncounterDirector.exportState(),chests:clone(G.chests)};}
  function beginChapter(stage){if(stage<JourneyProgress.cleared())for(const k of Object.keys(ledger))if(!k.startsWith('first:')&&new RegExp('^(boss|core|site|elite|drop):'+stage+'(?::|$)').test(k))delete ledger[k];}
  function stageChanged(){bossEntry=null;save('进入下一难');}
  function claim(id){if(!enabled)return true;if(ledger[id])return false;ledger[id]=true;return true;}
  return {key,backup,init,save,tick,start,continueRun,retry,prepareBoss,beginChapter,stageChanged,summary,receive,valid,
    active:()=>enabled,conflicted:()=>conflict,status:()=>message,claim,claimed:id=>enabled&&!!ledger[id],snapshot:()=>data?clone(data):null};
})();
