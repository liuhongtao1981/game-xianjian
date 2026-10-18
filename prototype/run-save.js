/* One atomic envelope owns the character, chapter progress and reward ledger. */
const RunSave=(()=>{
  const key='xunsheng-save-v2',backup=key+'-backup';
  const writer=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  let data=null,enabled=false,suppress=false,conflict=false,elapsed=0,message='自动存档待启用',bossEntry=null,ledger={},cycle=0,revision=0;
  const clone=v=>JSON.parse(JSON.stringify(v));
  function valid(d){
    if(!d||d.version!==2||!Number.isSafeInteger(d.revision)||d.revision<0||!Number.isFinite(d.savedAt)||typeof d.writer!=='string'||!d.progress||d.progress.version!==1||!Number.isInteger(d.progress.cleared)||d.progress.cleared<0||d.progress.cleared>3)return false;
    for(const e of Object.values(d.progress.entries||{}))if(!JourneyProgress.validBuild(e?.build)||!['story','normal','hard','nightmare'].includes(e.difficulty))return false;
    const s=d.run,b=s?.player;
    if(!s||!b||!JourneyProgress.validBuild({...b,hp:Math.max(1,b.hp)})||!Cultivation.valid(b.cultivation)||!Number.isFinite(b.hp)||b.hp<0||!Number.isInteger(s.stage)||s.stage<0||s.stage>2||!['story','normal','hard','nightmare'].includes(s.difficulty)||!['heaven','lotus','river'].includes(s.ultimate))return false;
    if(!Number.isInteger(s.tier)||s.tier<0||s.tier>13||!Number.isInteger(s.cycle)||s.cycle<0||!Number.isInteger(s.queue)||s.queue<0||s.queue>10000||!Array.isArray(s.choices)||s.choices.length>3)return false;
    if(!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x<0||s.x>3600||s.y<0||s.y>2600||!s.world||!Array.isArray(s.world.done)||s.world.done.length!==6||!s.world.done.every(v=>typeof v==='boolean'))return false;
    if(!s.director||!Array.isArray(s.director.camps)||s.director.camps.length!==9||!s.ledger||typeof s.ledger!=='object'||!Array.isArray(s.chests)||s.chests.length>30||!Array.isArray(s.completed)||!s.completed.every(v=>[0,1,2].includes(v)))return false;
    for(const c of s.director.camps)if(!c||!Number.isInteger(c.id)||c.id<0||c.id>8||!Number.isInteger(c.wave)||c.wave<0||c.wave>3||!['active','dormant','unseen','cleared'].includes(c.state)||!Array.isArray(c.slots)||c.slots.length>60||c.slots.some(p=>!['imp','fox','snake','zombie'].includes(p.type)||!['camp','rune'].includes(p.source)||!Number.isFinite(p.tier)))return false;
    if(s.bossSpawned&&s.state!=='win'&&(!s.bossEntry||!s.bossEntry.world||!s.bossEntry.director||!Number.isFinite(s.bossEntry.x)||!Number.isFinite(s.bossEntry.y)))return false;
    if(s.chestReward&&!['equip','spell','heal'].includes(s.chestReward.kind))return false;
    if(s.choices.some(c=>!['stat','up','new','recover'].includes(c.kind)||(c.kind==='stat'?!['atk','spd','hp','cd','crit','pick'].includes(c.id):c.kind==='recover'?false:!['yujian','wanjian','wulei','sanmei','bingxin','gudu','jiushen','guanyin'].includes(c.key))))return false;
    return true;
  }
  function read(k){try{const d=JSON.parse(localStorage.getItem(k));return valid(d)?d:null;}catch{return null;}}
  function migrateBuild(b){const p=clone(b),fraction=p.xp/Math.max(1,p.xpNext);p.xpNext=Cultivation.xpNeed(p.level);p.xp=Math.min(p.xpNext-.00001,fraction*p.xpNext);Cultivation.protectLegacy(p);return p;}
  function init(){
    const primary=read(key),fallback=primary?null:read(backup);data=primary||fallback;
    if(data){revision=data.revision;try{JourneyProgress.restore(data.progress);}catch{data=null;}message=fallback?'已恢复备份存档':'已有自动存档';}
    window.addEventListener('storage',event=>{if(event.key!==key||!event.newValue)return;try{receive(JSON.parse(event.newValue));}catch{}});
    window.addEventListener('pagehide',()=>save('离开网页'));window.addEventListener('beforeunload',()=>save('退出网页'));
    window.addEventListener('blur',()=>save('窗口失焦'));document.addEventListener('visibilitychange',()=>{if(document.hidden)save('切换网页');});
  }
  function receive(newer){if(valid(newer)&&newer.writer!==writer&&newer.revision>revision){conflict=true;message='另一窗口有新进度 · 请重新载入';clearInput();if(G.state!=='start'){G.state='save-conflict';const ov=document.getElementById('overlay');ov.classList.remove('hidden');ov.innerHTML='<div class="panel"><h2>历程已在另一窗口更新</h2><p>此窗口已停止保存，避免覆盖较新的成长。</p><button class="btn" id="reloadSaveBtn">载入最新存档</button></div>';document.getElementById('reloadSaveBtn').onclick=()=>{data=newer;revision=newer.revision;conflict=false;continueRun();};}}}
  function summary(){if(data)return {stage:data.run.stage,level:data.run.player.level,realm:Cultivation.label(data.run.player.cultivation),savedAt:data.savedAt};const old=JourneyProgress.snapshot(),stage=Math.min(2,old.cleared);const entry=old.entries[stage];return entry?{stage,level:entry.build.level,realm:'筑基·初期',savedAt:null}:null;}
  function capture(){
    return {version:2,revision:revision+1,writer,savedAt:Date.now(),progress:JourneyProgress.snapshot(),run:{cycle,tier:Journey.run.tier||0,ledger:clone(ledger),
      stage:Journey.run.stage,difficulty:Journey.run.difficulty,ultimate:Journey.run.ultimate,completed:[...Journey.run.completed],campaignTime:Journey.run.time,
      player:JourneyProgress.capture(P),checkpoint:clone(Journey.run.checkpoint),x:P.x,y:P.y,time:G.time,kills:G.kills,state:G.state,
      queue:G.queue,choices:clone(choicesCache),chestReward:clone(G.chestReward),pendingLore:G.pendingLore,coreReward:clone(G.coreReward),
      chests:G.chests.map(c=>({x:c.x,y:c.y,t:c.t||0,rewardId:c.rewardId||null})),world:World.exportState(),director:EncounterDirector.exportState(),bossSpawned:G.bossSpawned,bossEntry:clone(bossEntry)}};
  }
  function save(reason='自动保存'){
    if(suppress||!enabled||!P)return true;if(conflict)return false;if(G.state==='start')return true;
    const newer=read(key);if(newer&&newer.writer!==writer&&newer.revision>revision){receive(newer);return false;}
    try{const next=capture();if(!valid(next))throw new Error('Invalid runtime snapshot');const previous=read(key);if(previous)try{localStorage.setItem(backup,JSON.stringify(previous));}catch{}
      localStorage.setItem(key,JSON.stringify(next));revision=next.revision;data=next;elapsed=0;message='已保存 '+new Date(next.savedAt).toLocaleTimeString('zh-CN',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});return true;
    }catch{message='尚未保存 · 浏览器存储不可用';return false;}
  }
  function tick(dt){if(enabled&&G.state==='playing'&&!conflict){elapsed+=dt;if(elapsed>=5)save();}}
  function start(stage=0,newCycle=false){
    if(conflict)return false;
    const old=data?.run,legacy=JourneyProgress.replay(stage,Journey.run.difficulty,Journey.difficulties);
    if(old&&!newCycle&&(old.queue>0||old.chestReward||old.pendingLore!==null&&old.pendingLore!==undefined||old.coreReward))return false;
    let build=old?clone(old.player):legacy?migrateBuild(legacy):null;
    if(build){const prior=old?.difficulty||Journey.run.difficulty;build.maxHp+=Journey.difficulties[Journey.run.difficulty].hp-Journey.difficulties[prior].hp;build.hp=build.hp<=0?build.maxHp:Math.max(1,Math.min(build.maxHp,build.hp));}
    if(newCycle){const finale=G.state==='win'&&Journey.run.stage===2&&!G.coreReward||G.state==='start'&&old?.state==='win'&&old.stage===2&&!old.coreReward;if(JourneyProgress.cleared()<3||!finale)return false;cycle=(old?.cycle??cycle)+1;ledger={};}
    else if(old){cycle=old.cycle;ledger=clone(old.ledger);}
    suppress=true;enabled=true;Journey.begin(stage);Journey.run.tier=newCycle||!old?(build?.cultivation.realm||0):old.tier;Journey.run.checkpoint=build;reset();bossEntry=null;suppress=false;Journey.intro();save('开始历程');return true;
  }
  function continueRun(){
    if(!data){const s=summary();return s?start(s.stage):false;}
    const latest=read(key);if(latest&&latest.revision>data.revision)data=latest;
    const s=clone(data.run);conflict=false;suppress=true;enabled=true;revision=data.revision;cycle=s.cycle;ledger=s.ledger;bossEntry=s.bossEntry;
    JourneyProgress.restore(data.progress);Object.assign(Journey.run,{stage:s.stage,difficulty:s.difficulty,ultimate:s.ultimate,tier:s.tier,completed:s.completed,time:s.campaignTime,checkpoint:s.player});reset();Journey.run.checkpoint=s.checkpoint;
    const frame=s.bossSpawned&&s.state!=='win'&&s.state!=='dead'?s.bossEntry:s;
    World.importState(frame.world);EncounterDirector.importState(frame.director);P.x=frame.x;P.y=frame.y;World.resolve(P);World.camera(0,true);G.time=s.time;G.kills=s.kills;G.queue=s.queue;choicesCache=s.choices;G.chests=frame.chests||[];
    G.chestReward=s.chestReward;G.pendingLore=s.pendingLore??null;G.coreReward=s.coreReward;
    if(s.state==='win'){G.bossSpawned=true;G.boss={hp:0,killed:true};G.state='win';Journey.showEnd(true);}
    else if(s.state==='dead'){G.state='dead';Journey.showEnd(false);}
    else if(s.chestReward){G.state='playing';openChest(s.chestReward,true);}
    else if(G.pendingLore!==null)World.resumeLore(G.pendingLore);
    else if(G.queue>0)showLevelUp(s.choices.length?s.choices:null);
    else if(s.state==='story')Journey.intro();
    else {G.state='playing';togglePause();}
    suppress=false;renderSpells();renderEquips();syncHUD();return true;
  }
  function retry(){
    if(!['dead','paused'].includes(G.state))return false;const build=JourneyProgress.capture(P);build.hp=build.maxHp;build.shield=0;
    const queue=G.queue,offers=clone(choicesCache);Journey.run.checkpoint=build;reset();G.queue=queue;choicesCache=offers;bossEntry=null;Journey.intro();save('死亡重试');return true;
  }
  function prepareBoss(){bossEntry={x:P.x,y:P.y,world:World.exportState(),director:EncounterDirector.exportState(),chests:clone(G.chests)};}
  function stageChanged(){bossEntry=null;save('进入下一难');}
  function claim(id){if(!enabled)return true;if(ledger[id])return false;ledger[id]=true;return true;}
  return {key,backup,init,save,tick,start,continueRun,retry,prepareBoss,stageChanged,summary,receive,valid,
    active:()=>enabled,conflicted:()=>conflict,status:()=>message,claim,claimed:id=>enabled&&!!ledger[id],snapshot:()=>data?clone(data):null};
})();
