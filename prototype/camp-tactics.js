/* Optional v3 camp state. No tactic can grant growth or bypass a reward claim. */
const CampTactics=(()=>{
  let camps=[];
  const blank=c=>({type:ChapterCatalog.camp(Journey.run.stage,c.id).type,charges:3,cooldown:0,arming:0,destroyed:false,hp:0,maxHp:0,rewards:{xp:0,qi:0,essence:0}});
  function reset(list){camps=list;for(const c of camps)c.tactics=blank(c);}
  function valid(t){return t===undefined||!!t&&['siege','banner','trap','elite','legacy'].includes(t.type)&&Number.isInteger(t.charges)&&t.charges>=0&&t.charges<=3&&['cooldown','arming','hp','maxHp'].every(k=>Number.isFinite(t[k])&&t[k]>=0)&&t.cooldown<=6&&t.arming<=.8&&typeof t.destroyed==='boolean'&&t.hp<=t.maxHp&&(!t.rewards||['xp','qi','essence'].every(k=>Number.isFinite(t.rewards[k])&&t.rewards[k]>=0));}
  function restore(c,t){
    if(!valid(t))throw Error('Invalid camp tactics');
    c.tactics=t?{...t,rewards:{xp:0,qi:0,essence:0,...t.rewards},arming:t.arming>0?.8:0}:c.wave||c.state==='cleared'?{...blank(c),type:'legacy'}:blank(c);
  }
  function position(c){if(c.tacticPoint)return c.tacticPoint;const p={x:c.x+75,y:c.y-70,r:24};World.resolve(p);c.tacticPoint=p;return p;}
  function actor(c){return [...G.enemies,...c.sleeping].find(e=>e.campBanner&&e.encounterId===c.id&&e.hp>0);}
  function activate(c){
    const t=c.tactics;if(t.type!=='banner'||t.destroyed||actor(c))return;
    const point=position(c),hp=t.maxHp||Math.max(90+Journey.run.stage*24,(c.threat?.output||0)*1.4);
    const e=spawnEnemy('imp',false,point,{source:'rune',encounterId:c.id});
    Object.assign(e,{campBanner:true,eventObjective:true,seal:true,name:ChapterCatalog.camp(Journey.run.stage,c.id).banner,r:25,hp:t.maxHp?t.hp:hp,maxHp:hp,speed:0,dmg:0,xp:0});
    t.hp=e.hp;t.maxHp=hp;
    ExperienceUI.teach('banner','断援营地：集火妖幡，可打断所属远程妖众并延后攻击 3 秒。');
  }
  function interrupt(e,delay=0){e.action='idle';e.actionT=0;e.attack=0;e.castLock=0;e.followup=null;e.atkCd=Math.max(e.atkCd||0,delay);e.skillCd=Math.max(e.skillCd||0,delay);}
  function killed(e){if(!e.campBanner)return;const c=camps[e.encounterId];if(!c)return;c.tactics.destroyed=true;c.tactics.hp=0;
    for(const unit of G.enemies)if(unit.encounterId===c.id&&unit.type==='snake'&&!unit.eventObjective)interrupt(unit,3);
    notifyPickup('camp','妖幡已断 · 所属远程蓄力打断，停攻 3 秒');RunSave.save('摧毁妖幡');
  }
  function cooldown(e){const c=camps[e.encounterId];return !World.active()&&e.type==='snake'&&c?.tactics.type==='banner'&&!c.tactics.destroyed?.8:1;}
  function speed(e){return (e.tacticSlowUntil||0)>G.time?.5:1;}
  function nearby(){if(World.active())return null;return camps.filter(c=>c.state==='active'&&c.tactics.type==='trap').map(c=>({c,p:position(c)})).filter(({p})=>Math.hypot(p.x-P.x,p.y-P.y)<125).sort((a,b)=>Math.hypot(a.p.x-P.x,a.p.y-P.y)-Math.hypot(b.p.x-P.x,b.p.y-P.y))[0]?.c||null;}
  function prompt(c){const t=c.tactics;return ChapterCatalog.camp(Journey.run.stage,c.id).trap+' · '+(t.arming?'发动中':!t.charges?'次数用尽':t.cooldown>0?Math.ceil(t.cooldown)+'秒':'E 引动 · 剩余'+t.charges+'次');}
  function interact(){const c=nearby();if(!c||G.state!=='playing')return false;const t=c.tactics;if(!t.charges||t.cooldown||t.arming){notifyPickup('camp',prompt(c));return true;}t.charges--;t.cooldown=6;t.arming=.8;clearInput();RunSave.save('引动场景机关');return true;}
  function update(dt){if(G.state!=='playing'||World.active()||dt<=0)return;
    for(const c of camps){if(c.state!=='active')continue;const t=c.tactics;t.cooldown=Math.max(0,t.cooldown-dt);if(t.type==='banner'){const e=actor(c);if(e)t.hp=Math.max(0,e.hp);}
      if(t.arming>0){t.arming=Math.max(0,t.arming-dt);if(!t.arming){const p=position(c);for(const e of G.enemies)if(e.hp>0&&!e.boss&&!e.eventObjective&&Math.hypot(e.x-p.x,e.y-p.y)<=220){e.tacticSlowUntil=G.time+3;if(!e.elite)interrupt(e,.8);}Motion.emit('ice',p.x,p.y,{r:220,duration:.7,color:Journey.stage().color});notifyPickup('camp','禁纹发动 · 范围内妖众减速 50%，持续 3 秒');}}
    }
  }
  function snapshot(c){const t=c.tactics,e=t.type==='banner'?actor(c):null;return {...t,hp:t.destroyed?0:e?Math.max(0,e.hp):t.hp,rewards:{...t.rewards}};}
  function reward(id,key,value){const c=camps[id];if(c&&Number.isFinite(value)&&value>0)c.tactics.rewards[key]+=value;}
  function complete(c){G.enemies=G.enemies.filter(e=>!(e.campBanner&&e.encounterId===c.id));c.tactics.arming=0;ExperienceUI.campCleared(c);}
  function title(c){return ({siege:'围剿营地',banner:'断援营地',trap:'借势营地',elite:c.kind==='ritual'?'破阵妖巢':'精英悬赏',legacy:'妖众营地'})[c.tactics?.type]||'妖众营地';}
  function detail(c){const t=c.tactics;return t.type==='banner'?(t.destroyed?'妖幡已毁 · 远程恢复正常':'妖幡增幅 · 远程间隔 −20%'):t.type==='trap'?'机关 '+t.charges+'/3 · '+(t.cooldown?Math.ceil(t.cooldown)+'秒':'可引动'):c.kind==='ritual'?'击碎三枚阵眼，迎战精英':c.kind==='bounty'?'第三波精英带队':'清理三波妖众';}
  function prop(stage,color,charged){
    ctx.save();ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,8,30,10,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=charged?color:'#6d776d';ctx.fillStyle='#223c35';ctx.lineWidth=2;
    if([0,2,7,10,14].includes(stage)){
      ctx.fillRect(-7,-46,14,42);ctx.strokeRect(-7,-46,14,42);ctx.fillStyle='#16292a';ctx.fillRect(-22,-79,44,36);ctx.strokeRect(-22,-79,44,36);ctx.beginPath();ctx.moveTo(-30,-79);ctx.lineTo(0,-98);ctx.lineTo(30,-79);ctx.closePath();ctx.fill();ctx.stroke();if(charged){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,-60,8,14,0,0,Math.PI*2);ctx.fill();}
    }else if([1,4,9].includes(stage)){
      ctx.fillStyle='#503234';ctx.fillRect(-27,-61,54,45);ctx.strokeRect(-27,-61,54,45);ctx.strokeRect(-20,-54,40,31);ctx.fillStyle='#bca76f';ctx.fillRect(-13,-76,26,15);
    }else if([3,5,11].includes(stage)){
      ctx.fillStyle=charged?rgba(color,.45):'#34413d';ctx.beginPath();ctx.moveTo(-25,-15);ctx.lineTo(-21,-57);ctx.lineTo(3,-91);ctx.lineTo(24,-55);ctx.lineTo(28,-13);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(3,-91);ctx.lineTo(0,-20);ctx.lineTo(24,-55);ctx.stroke();
    }else if([6,8].includes(stage)){
      ctx.fillRect(-22,-24,44,17);ctx.strokeRect(-22,-24,44,17);if(charged){ctx.fillStyle=rgba(color,.6);ctx.beginPath();ctx.moveTo(-20,-25);ctx.quadraticCurveTo(-35,-55,0,-88);ctx.quadraticCurveTo(-4,-55,17,-63);ctx.quadraticCurveTo(39,-39,20,-25);ctx.closePath();ctx.fill();ctx.stroke();}
    }else{
      ctx.fillStyle='#35453e';ctx.beginPath();ctx.ellipse(0,-15,33,18,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-15,23,11,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*35,Math.sin(a)*18-15);ctx.lineTo(Math.cos(a)*48,Math.sin(a)*25-15);ctx.stroke();}
    }ctx.restore();
  }
  function draw(){if(World.active())return;for(const c of camps){if(c.state!=='active'||c.tactics.type!=='trap')continue;const p=position(c);if(!World.visible(p,250))continue;const t=c.tactics,color=Journey.stage().color;ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=t.charges?color:'#656e67';ctx.fillStyle='#0c2424';ctx.lineWidth=2;
      ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*30,Math.sin(a)*22);}ctx.closePath();ctx.fill();ctx.stroke();prop(Journey.run.stage,color,t.charges>0);ctx.font='bold 18px KaiTi';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(ChapterCatalog.camp(Journey.run.stage,c.id).glyph,0,18);
      if(t.arming){ctx.strokeStyle='#b6f5d9';ctx.fillStyle='#87ebc715';ctx.beginPath();ctx.arc(0,0,220,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,220,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-t.arming/.8));ctx.stroke();}
      ctx.font='14px Microsoft YaHei';ctx.fillStyle='#e9dfc0';ctx.fillText(prompt(c),0,-115);ctx.restore();}}
  function drawBanner(e){ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle='#d5b678';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,-105);ctx.stroke();ctx.fillStyle='#432432';ctx.strokeStyle=Journey.stage().color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-100);ctx.lineTo(45,-95);ctx.lineTo(39,-48);ctx.lineTo(0,-55);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#f6d99a';ctx.font='22px KaiTi';ctx.fillText('援',9,-69);ctx.fillStyle='#111d1c';ctx.fillRect(-30,-125,60,5);ctx.fillStyle='#f3b675';ctx.fillRect(-30,-125,60*e.hp/e.maxHp,5);ctx.font='12px Microsoft YaHei';ctx.textAlign='center';ctx.fillStyle='#f8d4a5';ctx.fillText('可击毁 · 妖幡',0,-137);ctx.restore();}
  return {reset,valid,restore,activate,killed,cooldown,speed,nearby,prompt,interact,update,snapshot,reward,complete,title,detail,draw,drawBanner};
})();
