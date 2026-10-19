/* Guardians use readable commitments and earned damage windows, never passive chip damage. */
const Bosses=(()=>{
  const profiles={
    story:{window:6.4,quota:.30,helper:.82,pace:1.13},
    normal:{window:5.6,quota:.24,helper:1,pace:1},
    hard:{window:5,quota:.22,helper:1.12,pace:.93},
    nightmare:{window:4.6,quota:.20,helper:1.22,pace:.87}
  };
  const names=[['镇音重锤','八律封口','金刚踏庭'],['断籍横斩','血诏追印','双诏问斩'],['回澜枪','沉灯追魂','逆流夺魂潮']];
  const tells=[
    '先破三枚钟心，再避开镇音重锤、等它收锤。重锤也能砸碎钟心。',
    '先断两枚血诏，再侧移避开两段问斩，待它收刀。',
    '先灭两盏河灯；随后连续两次站进洪潮青色缺口。'
  ];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const config=()=>profiles[Journey.run.difficulty]||profiles.normal;
  const arena=()=>typeof World!=='undefined'?World.arena():{x:0,y:0,w:W,h:H,cx:W/2,cy:H/2};
  const alive=e=>e&&e.hp>0&&!e.killed;
  const helpers=e=>G.enemies.filter(h=>alive(h)&&h.bossHelper&&h.bossOwner===e.id&&!h.phantom);
  const bound=(point,pad=70)=>{if(typeof World!=='undefined'&&World.clipToArena)return World.clipToArena(point,pad);const a=arena();return {x:clamp(point.x,a.x+pad,a.x+a.w-pad),y:clamp(point.y,a.y+pad,a.y+a.h-pad)};};
  function say(e,text,size=18){addText(e.x,e.y-135,text,Journey.stage().color,size);}
  function action(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=Math.max(.05,duration);e.attack=name==='windup'||name==='strike'?e.actionDuration:0;}
  function clearAttacks(e){G.telegraphs=G.telegraphs.filter(t=>t.bossOwner!==e.id);G.eshots=G.eshots.filter(t=>t.bossOwner!==e.id);e.brain.pending=null;}
  function summonHelpers(e){
    const b=e.brain,theme=b.theme,scale=config().helper;
    const count=Journey.run.stage===4?3:theme===0?3:2;const real=Math.floor(Math.random()*3);
    const center=bound({x:e.x,y:e.y},245);
    for(let i=0;i<count;i++){
      let p;
      if(theme===0){const angle=-Math.PI/2+i*Math.PI*2/3;p=bound({x:center.x+Math.cos(angle)*200,y:center.y+Math.sin(angle)*170});}
      else p=bound({x:center.x+(i?190:-190),y:center.y+(theme===1?40:85)});
      const hp=Math.round((theme===0?130:theme===1?180:220)*scale*(e.threat?.helper||1)*(1+(b.round-1)*.055));
      const h={id:G.uid++,type:theme===1?'zombie':theme===2?'snake':'imp',name:Journey.run.stage===3?'镇山锁柱':Journey.run.stage===4?(i===real?'金毫实印':'空影幻印'):Journey.run.stage===5?'锁喉龙鳞':theme===0?'缄言钟心':theme===1?'续命血诏':'锁魂河灯',
        locked:Journey.run.stage===3,phantom:Journey.run.stage===4&&i!==real,family:Journey.run.stage,color:Journey.stage().color,glyph:Journey.run.stage===3?'柱':Journey.run.stage===4?(i===real?'真':'幻'):Journey.run.stage===5?'鳞':['钟','诏','灯'][theme],x:p.x,y:p.y,r:23,hp,maxHp:hp,speed:0,dmg:0,xp:0,threat:e.threat,
        boss:false,elite:false,bossHelper:true,bossOwner:e.id,seal:theme===0,clerk:theme===1,lantern:theme===2,
        atkCd:999,skillCd:999,hitCd:0,flash:0,poison:0,animTime:0,look:1,action:'guard',actionT:0,actionDuration:1};
      G.enemies.push(h);Encounters.effect('summon',{x:h.x,y:h.y,r:40,theme});
    }
    b.helperTotal=Journey.run.stage===4?1:count;b.charged=false;b.helperBroken=0;b.mechanismReady=false;b.duelFailures=0;
    say(e,b.round===1?['先破钟心 · 诱锤收势','断双诏 · 侧避问斩','灭河灯 · 连渡潮隙','诱重砸 · 断镇山锁柱','辨实印 · 诱尽三段追链','破锁鳞 · 冲岸迎雷潮'][Journey.run.stage]:'护体重结 · 再寻破绽',16);
  }
  function init(e){
    const theme=Journey.run.stage%3;
    e.brain={theme,round:1,breaks:0,attackIndex:0,token:0,pending:null,helperTotal:0,helperBroken:0,mechanismReady:false,windowDamage:0,windowRemaining:0,blockedNotice:0,exhausted:false,phaseAnnounced:false};
    e.phase=1;e.attackAngle=Math.atan2(P.y-e.y,P.x-e.x);e.speed=Journey.stage().bossSpeed*1.65*Journey.difficulty().speed;
    action(e,'guard',1.5);summonHelpers(e);
  }
  function open(e){
    const b=e.brain;if(!alive(e)||e.action==='exposed')return;
    clearAttacks(e);b.breaks++;b.exhausted=false;b.windowDamage=0;b.windowRemaining=Math.ceil(e.maxHp*config().quota);
    action(e,'exposed',config().window);e.attack=0;e.kb=0;
    say(e,['锤势已尽 · 钟身破绽','血诏已断 · 收刀破绽','潮势已尽 · 逆鳞破绽'][b.theme],22);
    Sound.weakness?.(Journey.run.stage);Encounters.effect('phase',{x:e.x,y:e.y,r:125,theme:b.theme});
    G.shake=Math.max(G.shake,7);
  }
  function close(e){
    const b=e.brain;b.round++;b.exhausted=false;b.windowRemaining=0;b.windowDamage=0;
    if(e.hp<=e.maxHp*.5&&!b.phaseAnnounced){e.phase=2;b.phaseAnnounced=true;Sound.guardian(Journey.run.stage,true);say(e,Journey.stage().boss+' · 怒相',21);}
    action(e,'guard',1.3*config().pace);summonHelpers(e);
  }
  function hazard(e,point,options){
    const b=e.brain,token=b.pending.token;
    const life=options.life??Journey.warning(1.1);
    Journey.hazard(point.x,point.y,{...options,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1},life,total:life,boss:true,bossOwner:e.id,bossToken:token,theme:b.theme});
    b.pending.expected++;b.pending.lastImpact=Math.max(b.pending.lastImpact,life);
  }
  function prepare(e,kind,mechanism=false){
    const b=e.brain,a=arena(),dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
    e.attackAngle=Math.atan2(dy,dx);e.look=dx>=0?1:-1;
    b.pending={token:++b.token,kind,mechanism,expected:0,impacts:0,passed:true,lastImpact:0,projectiles:false,dash:null,origin:{x:e.x,y:e.y},age:0};
    let warning=Journey.warning((kind==='tide'?1.65:kind==='duel'?1.22:1.12)*config().pace),recovery=.85;
    const target=bound({x:P.x,y:P.y});
    if(kind==='bell'){
      hazard(e,target,{r:e.phase===2?108:94,dmg:32,life:warning,label:Journey.run.stage===3?(mechanism?'裂山终锤 · 躲开后斩石心':'镇山重砸 · 引向锁柱'):mechanism?'镇音重锤 · 避开后等收锤':'镇音重锤 · 引向钟心',bossSkill:'bell'});
      say(e,names[0][0]);
    }else if(kind==='ring'){
      hazard(e,{x:e.x,y:e.y},{r:125,dmg:24,life:warning,label:'八律封口 · 离开钟身',bossSkill:'ring'});
      b.pending.projectiles=true;say(e,e.phase===2?'十二律 · 禁音':names[0][1]);
    }else if(kind==='slash'||kind==='duel'||kind==='rush'){
      const length=kind==='duel'?270:kind==='rush'?290:235;
      const mid={x:e.x+Math.cos(e.attackAngle)*length*.65,y:e.y+Math.sin(e.attackAngle)*length*.65};
      hazard(e,mid,{shape:'line',angle:e.attackAngle,length,r:kind==='rush'?38:32,dmg:kind==='duel'?34:30,life:warning,label:kind==='duel'?'第一诏 · 向侧面闪避':kind==='rush'?(b.theme===2?'回澜枪 · 侧身躲开':'金刚踏庭 · 侧身躲开'):'断籍横斩',bossSkill:kind});
      if(kind==='duel'){
        hazard(e,mid,{shape:'line',angle:e.attackAngle+.64,length:250,r:35,dmg:36,life:warning+.6,label:'第二诏 · 仍须避开',bossSkill:kind});
        if(Journey.run.stage===4)hazard(e,mid,{shape:'line',angle:e.attackAngle-.64,length:300,r:36,dmg:38,life:warning+1.2,label:'第三追链 · 横向脱身',bossSkill:kind});
        recovery=1.1;
      }
      const end=bound({x:e.x+dx/d*Math.min(d,kind==='rush'?350:190),y:e.y+dy/d*Math.min(d,kind==='rush'?350:190)});
      b.pending.dash={x:end.x,y:end.y,duration:.32};
      say(e,kind==='duel'?names[1][2]:kind==='rush'?(b.theme===0?names[0][2]:names[2][0]):names[1][0]);
    }else if(kind==='edict'){
      hazard(e,target,{r:85,dmg:28,life:warning,label:'血诏追印 · 离开诏印',bossSkill:'edict'});
      if(e.phase===2)hazard(e,bound({x:P.x+Math.cos(e.attackAngle+Math.PI/2)*120,y:P.y+Math.sin(e.attackAngle+Math.PI/2)*120}),{r:75,dmg:25,life:warning+.35,label:'余诏 · 延迟落印',bossSkill:'edict'});
      say(e,names[1][1]);
    }else if(kind==='lantern'){
      hazard(e,target,{r:78,dmg:27,life:warning,label:'沉灯追魂 · 灯落即潮',bossSkill:'lantern'});
      b.pending.projectiles=true;say(e,names[2][1]);
    }else if(kind==='tide'){
      const safe=Journey.run.difficulty==='story'?190:Journey.run.difficulty==='normal'?160:Journey.run.difficulty==='hard'?144:130;
      const gap=clamp(P.x+(P.x<a.cx?80:-80),a.x+safe/2+45,a.x+a.w-safe/2-45),y=clamp(P.y,a.y+90,a.y+a.h-90);
      for(let i=0;i<2;i++)hazard(e,{x:a.cx,y},{shape:'tide',left:a.x,right:a.x+a.w,arenaX:a.x,arenaWidth:a.w,r:58,gap,safe,dmg:38+i*3,life:warning+i*.8,label:i?'第二重潮 · 守住青色缺口':'逆流断潮 · 进入青色缺口',bossSkill:'tide'});
      recovery=1.05;say(e,Journey.run.stage===5?'导雷双潮 · 守住干岸':names[2][2]);
    }
    b.pending.recovery=recovery;
    action(e,'windup',warning);Encounters.effect('summon',{x:e.x,y:e.y,r:75,theme:b.theme});
  }
  function projectiles(e,pending){
    const theme=e.brain.theme,profile=Journey.difficulty();
    const angles=theme===0?Array.from({length:e.phase===2?12:9},(_,i)=>e.attackAngle+i*Math.PI*2/(e.phase===2?12:9)):[-.36,-.18,0,.18,.36].map(x=>e.attackAngle+x);
    for(const angle of angles)G.eshots.push({x:e.x,y:e.y-18,vx:Math.cos(angle)*(theme===0?205:245)*profile.projectile,vy:Math.sin(angle)*(theme===0?205:245)*profile.projectile,r:theme===0?7:8,dmg:theme===0?16:19,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1},life:4,color:Journey.stage().color,theme,trail:[],bossOwner:e.id});
  }
  function finishAttack(e){
    const b=e.brain,p=b.pending;if(!p){action(e,'guard',.7);return;}
    // A removed warning (for example an ultimate clearing it) is not a successful dodge.
    const earned=p.mechanism&&p.impacts===p.expected&&p.passed&&!helpers(e).length;
    if(earned){open(e);return;}
    if(Journey.run.stage===5&&b.mechanismReady&&p.kind==='rush'&&p.passed&&p.impacts===p.expected){b.charged=true;say(e,'冲岸露鳞 · 迎两重导雷潮',18);}
    if(p.mechanism){b.duelFailures++;say(e,['须避开重锤落地 · 再诱一锤','未能诱尽双斩 · 再避一轮','须在青色潮隙内接过两重洪潮'][b.theme],15);}
    b.pending=null;action(e,'guard',(e.phase===2?.7:1.15)*config().pace);
  }
  function update(e,dt){
    if(!e.brain)init(e);if(!alive(e))return;
    const b=e.brain;b.blockedNotice=Math.max(0,b.blockedNotice-dt);
    e.actionT+=dt;e.attack=e.action==='windup'||e.action==='strike'?Math.max(.05,e.actionDuration-e.actionT):0;
    if(b.pending)b.pending.age+=dt;
    if(e.action==='exposed'){
      if(e.actionT>=e.actionDuration||b.exhausted)close(e);
      return;
    }
    if(!helpers(e).length&&!b.mechanismReady){b.mechanismReady=true;say(e,['钟心碎 · 诱锤落地，避开后等收锤','血诏断 · 引出双斩再侧移','河灯灭 · 站进两重潮的青色缺口'][b.theme],18);Sound.omen?.(Journey.run.stage);}
    if(e.action==='guard'){
      const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
      e.look=dx>=0?1:-1;
      if(d>240){const p=bound({x:e.x+dx/d*e.speed*dt,y:e.y+dy/d*e.speed*dt});e.x=p.x;e.y=p.y;}
      if(e.actionT>=e.actionDuration){
        if(b.mechanismReady){if(Journey.run.stage===5&&!b.charged)prepare(e,'rush');else prepare(e,['bell','duel','tide'][b.theme],true);}
        else {const list=b.theme===0?['bell','ring','bell','rush']:b.theme===1?['slash','edict','duel']:['rush','lantern','lantern'];prepare(e,list[b.attackIndex++%list.length]);}
      }
      return;
    }
    if(e.action==='windup'&&e.actionT>=e.actionDuration){
      const p=b.pending;if(!p){action(e,'guard',.8);return;}
      if(p.projectiles)projectiles(e,p);
      action(e,'strike',Math.max(.35,p.lastImpact-e.actionDuration+.14));
    }else if(e.action==='strike'){
      const p=b.pending;
      if(p?.dash){const amount=clamp(e.actionT/p.dash.duration,0,1);e.x=p.origin.x+(p.dash.x-p.origin.x)*amount;e.y=p.origin.y+(p.dash.y-p.origin.y)*amount;}
      if(e.actionT>=e.actionDuration)action(e,'recover',p?.recovery??.85);
    }else if(e.action==='recover'&&e.actionT>=e.actionDuration)finishAttack(e);
  }
  function onImpact(t,hitPlayer=false){
    const e=G.boss;if(!alive(e)||!e.brain||t.bossOwner!==e.id)return;
    const b=e.brain,p=b.pending;if(!p||p.token!==t.bossToken)return;
    p.impacts++;p.passed=p.passed&&!hitPlayer;
    if(t.bossSkill==='tide'&&p.mechanism){
      const insideBand=Math.abs(P.y-t.y)<=t.r-P.r;
      const insideGap=Math.abs(P.x-t.gap)<=t.safe/2-P.r;
      p.passed=p.passed&&insideBand&&insideGap;
    }
    if(t.bossSkill==='bell'){
      // The player can bait the monitor into breaking its own bells, or use ordinary swords.
      for(const h of helpers(e))if(Math.hypot(h.x-t.x,h.y-t.y)<t.r+h.r)killEnemy(h);
    }
  }
  function onHelperKilled(h){
    if(!h.bossHelper)return;
    const e=G.boss;if(!alive(e)||!e.brain||h.bossOwner!==e.id)return;
    e.brain.helperBroken++;if(Journey.run.stage===4)for(const ghost of G.enemies.filter(x=>x.phantom)){ghost.hp=0;ghost.killed=true;}
    Encounters.effect('phase',{x:h.x,y:h.y,r:55,theme:e.brain.theme});
  }
  function damageMultiplier(e){return e.boss?(e.brain&&e.action==='exposed'&&!e.brain.exhausted?3:0):1;}
  function filterDamage(e,damage){
    if(e.locked)return 0;
    if(e.phantom){if((e.phantomCd||0)<G.time){e.phantomCd=G.time+3;for(let i=0;i<2&&G.enemies.filter(h=>h.hp>0&&!h.boss&&!h.bossHelper).length<6;i++)spawnEnemy('fox',false,World.clipToArena({x:e.x+60*i,y:e.y+40},55),{source:'boss',encounterId:-1,tier:1.3,threat:e.threat,trait:null});addText(e.x,e.y-55,'幻印反噬 · 追猎来袭',Journey.stage().color,15);}return 0;}
    if(!e.boss)return damage;
    const b=e.brain;
    if(!b||e.action!=='exposed'||b.exhausted){
      if(b&&b.blockedNotice<=0){b.blockedNotice=1.2;addText(e.x,e.y-90,b.mechanismReady?'护体 · 诱招待收势':'护体 · 先破机关',Journey.stage().color,15);}
      return 0;
    }
    const allowed=Math.max(0,Math.min(Math.round(damage),b.windowRemaining,e.hp));
    b.windowRemaining-=allowed;b.windowDamage+=allowed;
    if(b.windowRemaining<=0)b.exhausted=true;
    return allowed;
  }
  function hud(e){
    if(!e?.brain)return {title:'寻其破绽',hint:tells[Journey.run.stage],progress:0,exposed:false,remaining:0,breaks:0};
    const b=e.brain,exposed=e.action==='exposed'&&!b.exhausted,remaining=Math.max(0,e.actionDuration-e.actionT);
    const total=b.helperTotal,left=helpers(e).length;
    let title,hint;
    if(exposed){title='破绽 '+remaining.toFixed(1)+' 秒';hint='全力攻本体 · 本轮伤害已用 '+Math.round(b.windowDamage/e.maxHp*100)+'%';}
    else if(left){title=['钟心护体','血诏护体','河灯护体','山契锁柱','真假籍印','锁喉龙鳞'][Journey.run.stage]+' · '+left+'/'+total;hint=Journey.stage().tell||tells[b.theme];}
    else {title=['钟心已裂 · 诱锤后闪避','诱尽双斩，等它收刀','青色潮隙 · 连渡两重','三柱已断 · 诱终锤收势','实印已破 · 诱尽三段追链','锁鳞已破 · 冲岸后迎雷潮'][Journey.run.stage];hint=Journey.run.stage>=3?Journey.stage().tell:['等金色落点锁定，离开重锤范围；收招才露钟身。','两段刀线均已锁定方向；横向走位或闪避。','站入两重洪潮的青色缺口，逆鳞才会显露。'][b.theme];}
    return {title,hint,progress:exposed?clamp(remaining/e.actionDuration,0,1):(total-left)/Math.max(1,total),exposed,remaining:exposed?remaining:0,breaks:b.breaks,round:b.round,helpers:left,action:e.action};
  }
  return {init,update,onImpact,onHelperKilled,damageMultiplier,filterDamage,hud,profiles};
})();
