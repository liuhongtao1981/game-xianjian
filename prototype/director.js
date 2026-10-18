/* One owner for camp challenges, endless exploration and guardian reinforcements. */
const EncounterDirector=(()=>{
  const offsets={story:-2,normal:0,hard:2,nightmare:4};
  const limits={story:24,normal:36,hard:44,nightmare:48};
  let camps=[],pending=[],mode='explore',idle=0,patrols=0,bossTimer=12,serial=0;
  let stats={spawned:0,killed:0,peak:0,patrols:0};
  const living=e=>e.hp>0&&!e.killed;
  const ordinary=e=>living(e)&&!e.boss&&!e.bossHelper&&!e.eventObjective;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const cap=()=>mode==='boss'?6:Math.min(limits[Journey.run.difficulty]||36,W<650?24:Infinity);
  const owned=c=>G.enemies.filter(e=>living(e)&&e.encounterId===c.id);
  const queued=c=>pending.some(p=>p.encounterId===c.id);
  const isActive=c=>c.state==='active';
  const tier=id=>id<2?1:[2,4,5].includes(id)?1.15:1.3;
  const waveSize=()=>8+Journey.run.stage*2+(offsets[Journey.run.difficulty]||0);
  const bossAllowed=()=>G.boss?.hp>0&&G.boss.action!=='exposed'&&!G.boss.brain?.mechanismReady;
  function reset(){
    camps=WorldNavData[Journey.run.stage].camps.map(([x,y],id)=>({id,x:x*3600,y:y*2600,state:'unseen',wave:0,timer:null,
      kind:id===3?'ritual':id===7?'bounty':'camp',runesCreated:false,sleeping:[],sleepingPending:[],kills:0}));
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
    const templates=c.id<2?['imp','imp','fox','imp','fox','imp','imp','fox']:['imp','fox','imp','snake','imp','fox','zombie','imp'];
    const count=waveSize();
    for(let i=0;i<count;i++)pending.push({encounterId:c.id,source:'camp',type:templates[(i+c.wave-1)%templates.length],
      elite:c.wave===3&&c.kind!=='camp'&&i===count-1,tier:tier(c.id),index:i,time:null});
    if(c.kind==='ritual'&&!c.runesCreated){
      c.runesCreated=true;
      for(let i=0;i<3;i++)pending.push({encounterId:c.id,source:'rune',type:'imp',index:i,time:null});
    }
  }
  function activate(c){
    c.state='active';
    if(c.sleeping.length||c.sleepingPending.length){
      for(const e of c.sleeping)pending.push({encounterId:c.id,source:e.eventObjective?'rune':'camp',snapshot:e,type:e.type,elite:e.elite,index:0,time:null});
      pending.push(...c.sleepingPending.map(p=>({...p,time:null,point:null})));
      c.sleeping=[];c.sleepingPending=[];
    }else if(!c.wave)schedule(c);
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
      e=spawnEnemy(kind,elite,p.point,{encounterId:p.encounterId,source:p.source,tier:p.tier||1.15});
      if(p.source==='rune')Object.assign(e,{name:'妖巢阵眼',eventObjective:true,seal:true,glyph:'阵',hp:Math.round((45+Journey.run.stage*15)*Journey.difficulty().mobHp),maxHp:Math.round((45+Journey.run.stage*15)*Journey.difficulty().mobHp),r:20,speed:0,dmg:0,xp:0});
      else stats.spawned++;
    }
    e.directorIndex=p.index;e.spawnTier=p.tier||tier(p.encounterId);World.resolve(e);return e;
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
        let point=p.source==='patrol'?p.anchor:mode==='boss'?World.clipToArena({x:G.boss.x+Math.cos(p.index*Math.PI+serial)*220,y:G.boss.y+Math.sin(p.index*Math.PI+serial)*180},65):campPoint(c,p.index,p.source==='rune'?200:130+(p.index%3)*45,p.elite?45:24);
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
    if(G.state!=='playing'||dt<0)return;
    if(mode==='boss'){
      if(!G.boss?.hp)return;
      bossTimer-=dt;
      if(bossTimer<=0&&bossAllowed()&&!pending.length&&G.enemies.filter(ordinary).length<6){
        const roles=[['imp','fox'],['imp','snake'],['imp','zombie']][serial++%3];
        roles.forEach((type,index)=>pending.push({encounterId:-1,source:'boss',type,index,tier:1.3,time:null}));bossTimer=12*Journey.difficulty().spawn;
      }
      pump(dt);return;
    }
    for(const c of camps.filter(isActive))suspend(c);
    const maxActive=P.level<3?1:2;
    const candidates=camps.filter(c=>['unseen','dormant'].includes(c.state)&&distance(c,P)<320).sort((a,b)=>distance(a,P)-distance(b,P));
    for(const c of candidates){if(camps.filter(isActive).length>=maxActive)break;activate(c);}
    for(const c of camps.filter(isActive)){
      const units=owned(c),fighters=units.filter(e=>!e.eventObjective);
      if(c.wave===3&&!units.length&&!queued(c)){
        c.state='cleared';notifyPickup('camp','营地已清理 · '+(c.kind==='ritual'?'妖巢已破':c.kind==='bounty'?'悬赏完成':'道路暂安'));continue;
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
    if(idle>=8&&available>0&&!pending.some(p=>p.source==='patrol')){
      const anchor=patrolPoint();
      if(anchor){
        const count=Math.min(4+patrols%3,available);patrols++;stats.patrols=patrols;
        for(let i=0;i<count;i++){
          const p={x:anchor.x+Math.cos(i)*25,y:anchor.y+Math.sin(i)*25};
          if(!safePatrolPoint(p))Object.assign(p,anchor);
          pending.push({encounterId:-serial++-1,source:'patrol',type:['imp','fox','snake'][i%3],anchor:p,index:i,tier:1.15,time:null});
        }idle=0;
      }
    }
    // Distant patrols leave without drops, freeing slots near the player's new location.
    G.enemies=G.enemies.filter(e=>e.source!=='patrol'||distance(e,P)<1300);
    pump(dt);
  }
  function onEnemyKilled(e){if(!e.eventObjective&&e.source)stats.killed++;const c=camps[e.encounterId];if(c)c.kills++;}
  function beginBoss(){mode='boss';pending=[];idle=0;bossTimer=12;G.enemies=[];}
  function hud(){
    if(mode==='boss')return '守关增援 '+G.enemies.filter(ordinary).length+'/6 · 诱招与破绽时停止增援';
    const active=camps.filter(isActive).sort((a,b)=>distance(a,P)-distance(b,P))[0];
    const cleared=camps.filter(c=>c.state==='cleared').length,elites=camps.filter(c=>c.kind!=='camp'&&c.state==='cleared').length;
    if(!active)return '营地 '+cleared+'/9 · 精英 '+elites+'/2 · 妖潮不断 '+G.enemies.filter(ordinary).length+'/'+cap();
    const units=owned(active),runes=units.filter(e=>e.eventObjective).length;
    const title=active.kind==='ritual'?'破阵妖巢':active.kind==='bounty'?'精英悬赏':'妖众营地';
    return title+' · 第'+active.wave+'/3波 · 妖众 '+units.filter(e=>!e.eventObjective).length+(runes?' · 阵眼 '+runes:active.timer!==null?' · 增援 '+Math.max(0,Math.ceil(active.timer))+'秒':'')+' · 已清 '+cleared+'/9 · 精英 '+elites+'/2';
  }
  function drawGround(){
    if(G.state==='start'||mode==='boss'&&!bossAllowed())return;
    for(const p of pending){if(p.time===null||!p.point||!World.visible(p.point,60))continue;
      const color=Journey.stage().color,progress=1-p.time/1.2;
      ctx.save();ctx.translate(p.point.x,p.point.y);ctx.scale(1,.62);ctx.strokeStyle=rgba(color,.6);ctx.fillStyle=rgba(color,.08);ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,p.elite?45:27,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#f5e3b5';ctx.beginPath();ctx.arc(0,0,30,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();ctx.restore();
    }
  }
  function drawMap(x,y,w,h,full){
    ctx.save();
    for(const c of camps){
      const px=x+c.x/3600*w,py=y+c.y/2600*h,known=c.state!=='unseen';
      ctx.strokeStyle=c.state==='cleared'?'#8bbfa8':c.state==='active'?'#f4a272':'#c0b99b80';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;
      ctx.beginPath();ctx.rect(px-3,py-3,6,6);if(known)ctx.fill();else ctx.stroke();
      if(full&&c.kind!=='camp'){ctx.font=(W<650?'9':'12')+'px KaiTi,serif';ctx.textAlign=c.x>2500?'right':'left';ctx.fillText((c.kind==='ritual'?'破阵':'悬赏')+(c.state==='cleared'?' · 已净':''),px+(c.x>2500?-7:7),py-8);}
    }ctx.restore();
  }
  function status(){return {mode,cap:cap(),waveSize:waveSize(),alive:G.enemies.filter(ordinary).length,pending:pending.length,warnings:pending.filter(p=>p.time!==null).map(p=>({x:p.point.x,y:p.point.y,time:p.time,source:p.source})),
    discovered:camps.filter(c=>c.state!=='unseen').length,cleared:camps.filter(c=>c.state==='cleared').length,patrols,stats:{...stats},
    camps:camps.map(c=>({id:c.id,x:c.x,y:c.y,state:c.state,kind:c.kind,wave:c.wave,remaining:owned(c).filter(e=>!e.eventObjective).length,runes:owned(c).filter(e=>e.eventObjective).length,sleeping:c.sleeping.length,pending:pending.filter(p=>p.encounterId===c.id).length,timer:c.timer}))};}
  function exportState(){
    const plan=p=>({type:p.type,source:p.source,elite:!!p.elite,index:p.index||0,tier:p.tier||1.15});
    const unit=e=>plan({type:e.type,source:e.eventObjective?'rune':'camp',elite:e.elite,index:e.directorIndex,tier:e.spawnTier});
    return {idle,patrols,serial,stats:{...stats},camps:camps.map(c=>({id:c.id,state:c.state,wave:c.wave,timer:c.timer,runesCreated:c.runesCreated,kills:c.kills,
      slots:[...owned(c).map(unit),...c.sleeping.map(unit),...pending.filter(p=>p.encounterId===c.id).map(p=>p.snapshot?unit(p.snapshot):plan(p)),...c.sleepingPending.map(p=>p.snapshot?unit(p.snapshot):plan(p))]}))};
  }
  function importState(s){
    if(!s||!Array.isArray(s.camps)||s.camps.length!==9)throw new Error('Invalid encounters');
    reset();idle=Math.max(0,Math.min(8,s.idle||0));patrols=s.patrols||0;serial=s.serial||0;stats={...stats,...s.stats};
    for(const value of s.camps){const c=camps[value.id];if(!c||!['unseen','active','dormant','cleared'].includes(value.state)||!Number.isInteger(value.wave)||value.wave<0||value.wave>3||!Array.isArray(value.slots)||value.slots.length>60)throw new Error('Invalid camp');
      Object.assign(c,{wave:value.wave,timer:value.timer,runesCreated:!!value.runesCreated,kills:value.kills||0,state:value.state==='active'?'dormant':value.state});
      c.sleepingPending=value.slots.map(p=>{if(!['imp','fox','snake','zombie'].includes(p.type)||!['camp','rune'].includes(p.source)||!Number.isFinite(p.tier))throw new Error('Invalid spawn');return {...p,encounterId:c.id,time:null};});
    }
  }
  return {reset,update,onEnemyKilled,beginBoss,hud,drawGround,drawMap,status,exportState,importState};
})();
