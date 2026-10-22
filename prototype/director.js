/* One owner for camp challenges, endless exploration and guardian reinforcements. */
const EncounterDirector=(()=>{
  const offsets={story:-2,normal:0,hard:2,nightmare:4};
  const limits={story:36,normal:48,hard:56,nightmare:64};
  const summonProfiles={story:{wave:24,limit:48,phoneLimit:24,interval:14},normal:{wave:36,limit:72,phoneLimit:36,interval:12},hard:{wave:48,limit:96,phoneLimit:48,interval:10},nightmare:{wave:64,limit:128,phoneLimit:64,interval:8}};
  let camps=[],pending=[],mode='explore',idle=0,patrols=0,bossTimer=12,serial=0;
  let stats={spawned:0,killed:0,peak:0,patrols:0};
  const living=e=>e.hp>0&&!e.killed;
  const ordinary=e=>living(e)&&!e.boss&&!e.bossHelper&&!e.eventObjective;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const mobile=()=>W<650||matchMedia('(pointer: coarse)').matches;
  const summons=()=>{const p=summonProfiles[Journey.run.difficulty]||summonProfiles.normal;return {...p,cap:mobile()?p.phoneLimit:p.limit,interval:p.interval*Journey.difficulty().spawn};};
  const cap=()=>mode==='boss'?summons().cap:Math.min(limits[Journey.run.difficulty]||48,mobile()?24:Infinity);
  const owned=c=>G.enemies.filter(e=>living(e)&&e.encounterId===c.id);
  const queued=c=>pending.some(p=>p.encounterId===c.id);
  const isActive=c=>c.state==='active';
  const tier=id=>[0,9].includes(id)?1:[1,10].includes(id)?1.8:[2,4,5,11,12,13,14].includes(id)?4:6;
  const waveSize=()=>ChapterCatalog.get(Journey.run.stage).wave+(offsets[Journey.run.difficulty]||0);
  const bossAllowed=()=>G.boss?.hp>0&&G.boss.action!=='exposed'&&!G.boss.brain?.mechanismReady;
  function reset(){
    CombatScaling.reset();
    camps=WorldNavData[Journey.run.stage].camps.map(([x,y],id)=>({id,x:x*World.bounds().w,y:y*World.bounds().h,state:'unseen',wave:0,timer:null,
      kind:[3,11].includes(id)?'ritual':[7,15].includes(id)?'bounty':'camp',runesCreated:false,sleeping:[],sleepingPending:[],kills:0}));
    for(const c of camps){const p={x:c.x,y:c.y,r:45};World.resolve(p);c.x=p.x;c.y=p.y;}
    CampTactics.reset(camps);
    pending=[];mode='explore';idle=0;patrols=0;bossTimer=12;serial=0;stats={spawned:0,killed:0,peak:0,patrols:0};
  }
  function campPoint(c,index,radius=160,body=24){
    const a=index*2.399963+Math.random()*.2;
    const p={x:c.x+Math.cos(a)*radius,y:c.y+Math.sin(a)*radius*.8,r:body};
    World.resolve(p);
    return World.isWalkable(p.x,p.y,body)&&distance(p,c)<400?{x:p.x,y:p.y}:null;
  }
  function patrolPoint(){
    const v=World.view(),margin=55;
    for(let i=0;i<48;i++){
      const side=i%4,t=Math.random();
      const p=side<2?{x:side?v.x+v.w+margin:v.x-margin,y:v.y+t*v.h}:{x:v.x+t*v.w,y:side===2?v.y-margin:v.y+v.h+margin};
      if(distance(p,P)>=360&&World.isWalkable(p.x,p.y,28))return p;
    }return null;
  }
  function safePatrolPoint(p){
    return p&&distance(p,P)>=360&&!World.visible(p,30)&&World.isWalkable(p.x,p.y,28);
  }
  function schedule(c){
    c.wave++;c.timer=null;
    c.threat=CombatScaling.snapshot('camp',tier(c.id));
    const templates=c.id<2?['imp','imp','fox','imp','fox','imp','imp','fox']:['imp','fox','imp','snake','imp','fox','zombie','imp'];
    const count=waveSize();
    for(let i=0;i<count;i++)pending.push({encounterId:c.id,source:'camp',type:templates[(i+c.wave-1)%templates.length],
      elite:c.wave===3&&c.kind!=='camp'&&i===count-1,tier:tier(c.id),index:i,time:null,threat:c.threat,trait:CombatScaling.trait(templates[(i+c.wave-1)%templates.length],c.threat,c.wave===3&&c.kind!=='camp'&&i===count-1),rewardKey:'camp:'+c.id+':'+c.wave+':'+i});
    if(c.id>=2&&P.level>=3&&c.tactics.type!=='legacy'){
      const wave=pending.filter(p=>p.encounterId===c.id&&p.source==='camp');
      for(let i=0;i<3;i++)Object.assign(wave[i],{type:['imp','snake','fox'][i],trait:['breaker','volley','flank'][i]});
    }
    if(c.kind==='ritual'&&!c.runesCreated){
      c.runesCreated=true;
      for(let i=0;i<3;i++)pending.push({encounterId:c.id,source:'rune',type:'imp',index:i,time:null});
    }
  }
  function activate(c){
    c.state='active';
    if(c.sleeping.length||c.sleepingPending.length){
      for(const e of c.sleeping.filter(e=>!e.campBanner))pending.push({encounterId:c.id,source:e.eventObjective?'rune':'camp',snapshot:e,type:e.type,elite:e.elite,index:e.directorIndex||0,time:null});
      pending.push(...c.sleepingPending.map(p=>({...p,time:null,point:null})));
      c.sleeping=[];c.sleepingPending=[];
    }else if(!c.wave)schedule(c);
    CampTactics.activate(c);
  }
  function suspend(c){
    const units=owned(c);
    if(c.wave===3&&!units.length&&!queued(c))return;
    if(distance(c,P)<1150||units.some(e=>distance(e,P)<950))return;
    c.sleeping=units;c.sleepingPending=pending.filter(p=>p.encounterId===c.id);
    G.enemies=G.enemies.filter(e=>e.encounterId!==c.id);
    pending=pending.filter(p=>p.encounterId!==c.id);c.state='dormant';
  }
  function spawn(p){
    let e;
    if(p.snapshot){e=p.snapshot;e.x=p.point.x;e.y=p.point.y;e.worldX=e.x;e.worldY=e.y;G.enemies.push(e);}
    else{
      const elite=p.elite,kind=elite?(camps[p.encounterId]?.kind==='ritual'?'zombie':'fox'):p.type;
      e=spawnEnemy(kind,elite,p.point,{encounterId:p.encounterId,source:p.source,tier:p.tier||1.15,threat:p.threat,trait:p.trait,rewardKey:p.rewardKey});
      if(p.source==='rune')Object.assign(e,{name:'妖巢阵眼',eventObjective:true,seal:true,glyph:'阵',hp:Math.round((45+Journey.run.stage*15)*Journey.difficulty().mobHp),maxHp:Math.round((45+Journey.run.stage*15)*Journey.difficulty().mobHp),r:20,speed:0,dmg:0,xp:0});
      else {stats.spawned++;if(elite){notifyPickup('camp','精英出阵 · '+e.name+' · 第三波');Motion.emit('cast',e.x,e.y,{r:60,duration:1,color:Journey.stage().color});}}
    }
    e.directorIndex=p.index;e.spawnTier=p.tier||tier(p.encounterId);World.resolve(e);return e;
  }
  function bossSummonPoint(index){
    for(let attempt=0;attempt<16;attempt++){
      const angle=index*2.399963+serial*.61+attempt*.73,radius=260+(index%3)*65;
      const point=World.clipToArena({x:G.boss.x+Math.cos(angle)*radius,y:G.boss.y+Math.sin(angle)*radius*.8},35);
      if(distance(point,P)>=180&&World.isWalkable(point.x,point.y,30))return point;
    }
    return null;
  }
  function summonWave(){
    const count=summons().wave;
    if(cap()-G.enemies.filter(ordinary).length-pending.length<count)return;
    const roles=['imp','fox','imp','snake','imp','fox','zombie','imp'],threat=CombatScaling.bossProfile();serial++;
    for(let index=0;index<count;index++)pending.push({encounterId:-1,source:'boss',type:roles[(index+serial-1)%roles.length],index,tier:1.3,time:null,threat,trait:null,rewardKey:'guard:'+serial+':'+index});
    Encounters.effect('summon',{x:G.boss.x,y:G.boss.y,r:110,theme:Journey.run.stage});
    addText(G.boss.x,G.boss.y-150,'群妖听令 · 召唤 '+count+' 只',Journey.stage().color,20);
    bossTimer=summons().interval;
  }
  function pump(dt){
    if(mode==='boss'&&!bossAllowed()){
      for(const p of pending){p.time=null;p.point=null;}return;
    }
    let alive=G.enemies.filter(ordinary).length;
    let reserved=pending.filter(p=>p.source!=='rune'&&p.time!==null).length;
    for(const p of pending){
      if(p.time===null){
        if(p.source!=='rune'&&alive+reserved>=cap())continue;
        const c=camps[p.encounterId];
        if(p.source==='patrol'&&!safePatrolPoint(p.anchor))p.anchor=patrolPoint();
        let point=p.source==='patrol'?p.anchor:mode==='boss'?bossSummonPoint(p.index):campPoint(c,p.index,p.source==='rune'?200:130+(p.index%3)*45,p.elite?45:24);
        if(!point||!World.isWalkable(point.x,point.y,p.elite?40:20))continue;
        p.point=point;p.time=1.2;if(p.source!=='rune')reserved++;
      }else{
        p.time=Math.max(0,p.time-dt);
        if(p.source==='patrol'&&!safePatrolPoint(p.point)){p.time=null;p.point=null;continue;}
        if(p.time===0&&(p.source==='rune'||alive<cap())){
          spawn(p);p.finished=true;if(p.source!=='rune'){alive++;reserved--;}
        }
      }
    }
    pending=pending.filter(p=>!p.finished);stats.peak=Math.max(stats.peak,alive);
  }
  function update(dt){
    if(G.state!=='playing'||dt<=0)return;
    CampTactics.update(dt);
    if(mode==='boss'){
      if(!G.boss?.hp||G.boss.killed){pending=[];return;}
      bossTimer-=dt;
      if(bossTimer<=0&&bossAllowed()&&!pending.length)summonWave();
      pump(dt);return;
    }
    for(const c of camps.filter(isActive))suspend(c);
    const maxActive=P.level<3?1:2;
    const candidates=camps.filter(c=>['unseen','dormant'].includes(c.state)&&distance(c,P)<400).sort((a,b)=>distance(a,P)-distance(b,P));
    for(const c of candidates){if(camps.filter(isActive).length>=maxActive)break;activate(c);}
    for(const c of camps.filter(isActive)){
      const units=owned(c).filter(e=>!e.campBanner),fighters=units.filter(e=>!e.eventObjective);
      if(c.wave===3&&!units.length&&!queued(c)){
        c.state='cleared';CampTactics.complete(c);notifyPickup('camp','营地已清理 · '+(c.kind==='ritual'?'妖巢已破':c.kind==='bounty'?'悬赏完成':'道路暂安'));RunSave.save('营地清理');continue;
      }
      if(c.wave>=3||fighters.length>2||queued(c))continue;
      if(c.wave===2&&c.kind==='ritual'&&units.some(e=>e.eventObjective))continue;
      if(c.timer===null)c.timer=4;
      else {c.timer-=dt;if(c.timer<=0)schedule(c);}
    }
    // Exploration never runs out of ordinary enemies, even after all camps are clear.
    // Camp waves keep priority; a full population delays rather than deletes enemies.
    idle=Math.min(8,idle+dt);
    const available=cap()-G.enemies.filter(ordinary).length-pending.filter(p=>p.source!=='rune').length;
    if(idle>=8&&camps.filter(isActive).length<2&&available>0&&!pending.some(p=>p.source==='patrol')){
      const anchor=patrolPoint();
      if(anchor){
        const count=Math.min(4+patrols%3,available);patrols++;stats.patrols=patrols;
        const threat=CombatScaling.snapshot('patrol');
        for(let i=0;i<count;i++){
          const p={x:anchor.x+Math.cos(i)*25,y:anchor.y+Math.sin(i)*25};
          if(!safePatrolPoint(p))Object.assign(p,anchor);
          const type=['imp','fox','snake'][i%3];pending.push({encounterId:-serial++-1,source:'patrol',type,anchor:p,index:i,tier:1.15,time:null,threat,trait:CombatScaling.trait(type,threat),rewardKey:'patrol:'+patrols+':'+i});
        }idle=0;
      }
    }
    // Distant patrols leave without drops, freeing slots near the player's new location.
    G.enemies=G.enemies.filter(e=>e.source!=='patrol'||distance(e,P)<1300);
    pump(dt);
  }
  function onEnemyKilled(e){if(!e.eventObjective&&e.source)stats.killed++;const c=camps[e.encounterId];if(c&&!e.eventObjective)c.kills++;CampTactics.killed(e);}
  function beginBoss(){Targeting.reset();mode='boss';pending=[];idle=0;bossTimer=3;G.enemies=[];}
  function endBoss(){pending=[];bossTimer=0;G.enemies=G.enemies.filter(e=>e.source!=='boss');}
  function hud(){
    if(mode==='boss')return '大妖召众 '+G.enemies.filter(ordinary).length+'/'+cap()+' · 每轮'+summons().wave+'只 · '+(!bossAllowed()?'破招期间暂停召唤':pending.length?'召唤预警中':'下轮 '+Math.max(0,Math.ceil(bossTimer))+'秒');
    const active=camps.filter(isActive).sort((a,b)=>distance(a,P)-distance(b,P))[0];
    const cleared=camps.filter(c=>c.state==='cleared').length,elites=camps.filter(c=>c.kind!=='camp'&&c.state==='cleared').length;
    if(!active)return '营地 '+cleared+'/'+camps.length+' · 精英 '+elites+'/4 · 妖潮不断 '+G.enemies.filter(ordinary).length+'/'+cap();
    const units=owned(active),runes=units.filter(e=>e.eventObjective&&!e.campBanner).length;
    const title=active.kind==='ritual'?'破阵妖巢':active.kind==='bounty'?'精英悬赏':CampTactics.title(active);
    return title+' · 第'+active.wave+'/3波 · 妖众 '+units.filter(e=>!e.eventObjective).length+(runes?' · 阵眼 '+runes:active.timer!==null?' · 增援 '+Math.max(0,Math.ceil(active.timer))+'秒':'')+' · 已清 '+cleared+'/'+camps.length+' · 精英 '+elites+'/4';
  }
  function drawGround(){
    if(G.state==='start'||mode==='boss'&&!bossAllowed())return;
    CampTactics.draw();
    for(const p of pending){if(p.time===null||!p.point||!World.visible(p.point,60))continue;
      const color=Journey.stage().color,progress=1-p.time/1.2;
      ctx.save();ctx.translate(p.point.x,p.point.y);ctx.scale(1,.62);ctx.strokeStyle=rgba(color,.6);ctx.fillStyle=rgba(color,.08);ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,p.elite?45:27,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#f5e3b5';ctx.beginPath();ctx.arc(0,0,30,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();ctx.restore();
    }
  }
  function drawMap(x,y,w,h,full){
    ctx.save();
    for(const c of camps){
      const px=x+c.x/World.bounds().w*w,py=y+c.y/World.bounds().h*h,known=c.state!=='unseen';
      ctx.strokeStyle=c.state==='cleared'?'#8bbfa8':c.state==='active'?'#f4a272':'#c0b99b80';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;
      ctx.beginPath();ctx.rect(px-3,py-3,6,6);if(known)ctx.fill();else ctx.stroke();
      if(full&&c.kind!=='camp'){ctx.font=(W<650?'9':'12')+'px KaiTi,serif';ctx.textAlign=c.x>2500?'right':'left';ctx.fillText((c.kind==='ritual'?'破阵':'悬赏')+(c.state==='cleared'?' · 已净':''),px+(c.x>2500?-7:7),py-8);}
    }ctx.restore();
  }
  function status(){return {mode,cap:cap(),waveSize:waveSize(),summons:mode==='boss'?{...summons(),timer:bossTimer}:null,alive:G.enemies.filter(ordinary).length,pending:pending.length,warnings:pending.filter(p=>p.time!==null).map(p=>({x:p.point.x,y:p.point.y,time:p.time,source:p.source})),
    discovered:camps.filter(c=>c.state!=='unseen').length,cleared:camps.filter(c=>c.state==='cleared').length,patrols,stats:{...stats},
    camps:camps.map(c=>({id:c.id,x:c.x,y:c.y,state:c.state,kind:c.kind,title:CampTactics.title(c),detail:CampTactics.detail(c),tactics:CampTactics.snapshot(c),wave:c.wave,remaining:owned(c).filter(e=>!e.eventObjective).length,runes:owned(c).filter(e=>e.eventObjective&&!e.campBanner).length,sleeping:c.sleeping.length,pending:pending.filter(p=>p.encounterId===c.id).length,timer:c.timer}))};}
  function exportState(){
    const plan=p=>({type:p.type,source:p.source,elite:!!p.elite,index:p.index||0,tier:p.tier||1.15,threat:p.threat||null,trait:p.trait||null,rewardKey:p.rewardKey||null});
    const unit=e=>plan({type:e.type,source:e.eventObjective?'rune':'camp',elite:e.elite,index:e.directorIndex,tier:e.spawnTier,threat:e.threat,trait:e.trait,rewardKey:e.combatId});
    const patrolSlots=[...G.enemies.filter(e=>living(e)&&e.source==='patrol').map(e=>({...unit(e),source:'patrol',anchor:{x:e.x,y:e.y},encounterId:e.encounterId})),...pending.filter(p=>p.source==='patrol').map(p=>({...plan(p),anchor:p.anchor,encounterId:p.encounterId}))];
    return {idle,patrols,serial,patrolSlots,scaling:CombatScaling.exportState(),stats:{...stats},camps:camps.map(c=>({id:c.id,state:c.state,wave:c.wave,timer:c.timer,runesCreated:c.runesCreated,kills:c.kills,threat:c.threat||null,tactics:CampTactics.snapshot(c),
      slots:[...owned(c).filter(e=>!e.campBanner).map(unit),...c.sleeping.filter(e=>!e.campBanner).map(unit),...pending.filter(p=>p.encounterId===c.id&&!p.snapshot?.campBanner).map(p=>p.snapshot?unit(p.snapshot):plan(p)),...c.sleepingPending.filter(p=>!p.snapshot?.campBanner).map(p=>p.snapshot?unit(p.snapshot):plan(p))]}))};
  }
  function importState(s){
    if(!s||!Array.isArray(s.camps)||s.camps.length!==camps.length)throw new Error('Invalid encounters');
    reset();CombatScaling.importState(s.scaling);idle=Math.max(0,Math.min(8,s.idle||0));patrols=s.patrols||0;serial=s.serial||0;stats={...stats,...s.stats};
    for(const p of s.patrolSlots||[]){if(p.threat&&!CombatScaling.validSnapshot(p.threat))throw Error('Invalid patrol threat');pending.push({...p,source:'patrol',time:null,threat:p.threat||CombatScaling.snapshot('patrol')});}
    for(const value of s.camps){const c=camps[value.id];if(!c||!['unseen','active','dormant','cleared'].includes(value.state)||!Number.isInteger(value.wave)||value.wave<0||value.wave>3||!Array.isArray(value.slots)||value.slots.length>Math.max(60,Journey.stage().wave+12))throw new Error('Invalid camp');
      if(value.threat&&!CombatScaling.validSnapshot(value.threat))throw Error('Invalid camp threat');
      Object.assign(c,{wave:value.wave,timer:value.timer,runesCreated:!!value.runesCreated,kills:value.kills||0,state:value.state==='active'?'dormant':value.state,threat:value.threat||null});
      CampTactics.restore(c,value.tactics);
      let legacy=null;
      c.sleepingPending=value.slots.map(p=>{if(!['imp','fox','snake','zombie'].includes(p.type)||!['camp','rune'].includes(p.source)||!Number.isFinite(p.tier)||p.threat&&!CombatScaling.validSnapshot(p.threat)||p.trait&&!['breaker','volley','flank'].includes(p.trait))throw new Error('Invalid spawn');if(p.source!=='rune'&&!p.threat)legacy=legacy||c.threat||CombatScaling.snapshot('camp',tier(c.id));const threat=p.threat||legacy;return {...p,threat,trait:p.source==='rune'?null:p.trait===undefined?CombatScaling.trait(p.type,threat,p.elite):p.trait,rewardKey:p.rewardKey||'camp:'+c.id+':'+c.wave+':'+p.index,encounterId:c.id,time:null};});
    }
  }
  return {reset,update,onEnemyKilled,beginBoss,endBoss,hud,drawGround,drawMap,status,exportState,importState};
})();
