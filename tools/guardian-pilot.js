/* Loaded inside the real game's VM; uses player-accessible input during combat. */
const GuardianPilot=(()=>{
  const step=1/30,reaction=.1;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function danger(t,x,y){
    const dx=x-t.x,dy=y-t.y;
    if(t.shape==='heti'){const p={x,y,r:P.r};if(HetiGuardians.safe(t,p))return 100;const target=HetiGuardians.safePoint(t);return -Math.hypot(x-target.x,y-target.y);}
    if(t.shape==='lianxu'){const q=t.safe||t,d=Math.hypot(x-q.x,y-q.y);return t.safeMode==='outside'?d-t.safeRadius-P.r:t.safeRadius-P.r-d;}
    if(t.shape==='sandstorm')return HuashenArt.shade(t,{x,y,r:P.r})?80:-80;
    if(t.shape==='annulus')return Math.abs(Math.hypot(dx,dy)-t.r)-t.width-P.r;
    if(t.shape==='line')return Math.max(Math.abs(dx*Math.cos(t.angle)+dy*Math.sin(t.angle))-t.length-P.r,Math.abs(-dx*Math.sin(t.angle)+dy*Math.cos(t.angle))-t.r-P.r);
    if(t.shape==='tide'){
      if(x<t.left||x>t.right)return 999;
      return Math.max(Math.abs(dy)-t.r-P.r,t.safe/2-Math.abs(x-t.gap)-P.r);
    }
    return Math.hypot(dx,dy)-t.r-P.r;
  }
  function destination(){
    const boss=G.boss,live=G.enemies.filter(e=>e.hp>0),helpers=live.filter(e=>e.bossHelper&&!e.phantom);
    const tide=G.telegraphs.find(t=>t.shape==='tide'&&t.bossSkill==='tide');
    if(tide)return {x:tide.gap,y:tide.y,ritual:true};
    if(boss.action==='exposed')return {x:boss.x,y:boss.y+55};
    if(Journey.run.stage>=15){const t=G.telegraphs.filter(t=>t.shape==='heti').sort((a,b)=>a.life-b.life)[0];if(t)return {...HetiGuardians.safePoint(t),ritual:true};return {x:boss.x,y:boss.y+160};}
    if(Journey.run.stage>=12){const t=G.telegraphs.filter(t=>t.shape==='lianxu').sort((a,b)=>a.life-b.life)[0];if(t){const s=t.safe||t,a=Math.atan2(P.y-s.y,P.x-s.x),r=t.safeMode==='outside'?t.safeRadius+75:0;return {x:s.x+Math.cos(a)*r,y:s.y+Math.sin(a)*r,ritual:true};}return {x:boss.x,y:boss.y+160};}
    if(Journey.run.stage===11){const t=G.telegraphs.filter(t=>t.shape==='sandstorm').sort((a,b)=>a.life-b.life)[0];if(t){const choices=t.shelters.map(h=>({x:h.x+Math.cos(t.windAngle)*135,y:h.y+Math.sin(t.windAngle)*135,ritual:true}));choices.sort((a,b)=>distance(a,P)-distance(b,P));return choices[0];}return {x:boss.x,y:boss.y+160};}
    if(Journey.run.stage===9&&helpers.length){const t=G.telegraphs.find(t=>t.bossSkill==='contract-stamp');if(t){const a=Math.atan2(P.y-t.y,P.x-t.x);return {x:t.x+Math.cos(a)*210,y:t.y+Math.sin(a)*210};}}
    if(Journey.run.stage===10&&helpers.length){const attack=boss.brain.pending;if(attack?.kind==='rake'){const a=boss.attackAngle,side=Math.sign(Math.cos(a)*(P.y-attack.origin.y)-Math.sin(a)*(P.x-attack.origin.x))||1;return {x:attack.origin.x-Math.sin(a)*side*260,y:attack.origin.y+Math.cos(a)*side*260};}helpers.sort((a,b)=>distance(a,P)-distance(b,P));const h=helpers[0],d=distance(h,boss)||1;return {x:h.x+(h.x-boss.x)/d*85,y:h.y+(h.y-boss.y)/d*85};}
    if(Journey.run.stage===7&&helpers.length){
      const attack=boss.brain.pending;
      if(attack?.kind==='pounce'){const a=boss.attackAngle,side=Math.sign(Math.cos(a)*(P.y-attack.origin.y)-Math.sin(a)*(P.x-attack.origin.x))||1;return {x:attack.origin.x-Math.sin(a)*side*220,y:attack.origin.y+Math.cos(a)*side*220};}
      helpers.sort((a,b)=>distance(a,P)-distance(b,P));const h=helpers[0],d=distance(h,boss)||1;return {x:h.x+(h.x-boss.x)/d*85,y:h.y+(h.y-boss.y)/d*85};
    }
    if(Journey.run.stage===8){const echo=G.telegraphs.filter(t=>t.bossSkill==='bone-echo').sort((a,b)=>a.life-b.life)[0];if(echo){const a=Math.atan2(P.y-boss.y,P.x-boss.x),r=echo.side==='inside'?85:290;return {x:boss.x+Math.cos(a)*r,y:boss.y+Math.sin(a)*r,ritual:true};}}

    if(helpers.length){helpers.sort((a,b)=>distance(a,P)-distance(b,P));const e=helpers[0],d=distance(e,P)||1;return {x:e.x+(P.x-e.x)/d*66,y:e.y+(P.y-e.y)/d*66};}
    const attack=boss.brain.pending;
    if(attack?.kind==='duel'){
      const a=boss.attackAngle,side=Math.sign(Math.cos(a)*(P.y-attack.origin.y)-Math.sin(a)*(P.x-attack.origin.x))||1;
      return {x:attack.origin.x-Math.sin(a)*side*170,y:attack.origin.y+Math.cos(a)*side*170};
    }
    return {x:boss.x,y:boss.y+170};
  }
  function chooseCard(){
    const priorities={yujian:7,wanjian:5,wulei:5,guanyin:8,bingxin:6,sanmei:3,gudu:3,jiushen:4};
    let best=0,score=-1;
    choicesCache.forEach((c,i)=>{const value=c.kind==='stat'?({atk:5,hp:P.hp<P.maxHp*.5?7:4,cd:6,crit:2,spd:2,pick:1}[c.id]||1):(priorities[c.key]||2)+(c.kind==='new'?.4:0);if(value>score){score=value;best=i}});
    pickCard(best);
  }
  function steer(){
    const goal=destination(),arena=World.arena();
    let best={x:0,y:0},score=Infinity;
    const desired=Math.atan2(goal.y-P.y,goal.x-P.x);
    const candidates=[{x:0,y:0},...Array.from({length:24},(_,i)=>({x:Math.cos(desired+i*Math.PI/12),y:Math.sin(desired+i*Math.PI/12)}))];
    for(const v of candidates){
      const x=P.x+v.x*P.speed*.42,y=P.y+v.y*P.speed*.42;
      let cost=Math.hypot(x-goal.x,y-goal.y)*.65;
      const ellipse=Math.hypot((x-arena.cx)/(arena.rx-P.r-12),(y-arena.cy)/(arena.ry-P.r-12));
      if(ellipse>.98)cost+=1000+(ellipse-.98)*2000;
      if(!World.isWalkable(x,y,P.r))cost+=2000;
      for(const t of G.telegraphs){
        if(t.shape==='heti'&&G.telegraphs.some(q=>q.shape==='heti'&&q.life<t.life))continue;
        if(t.shape==='lianxu'&&G.telegraphs.some(q=>q.shape==='lianxu'&&q.life<t.life))continue;
        if(t.shape==='sandstorm'&&G.telegraphs.some(q=>q.shape==='sandstorm'&&q.life<t.life))continue;
        const d=danger(t,x,y),weight=t.shape==='annulus'?(t.life<.40?1:0):t.life<.75?1:.35;
        if(d<30)cost+=(30-d)*weight*9;
      }
      for(const s of G.eshots){
        const sx=s.x+s.vx*.32,sy=s.y+s.vy*.32,d=Math.hypot(x-sx,y-sy)-(P.r+s.r);
        if(d<50)cost+=(50-d)*5;
      }
      for(const e of G.enemies){
        if(e.boss||e.bossHelper||e.hp<=0)continue;
        const d=Math.hypot(x-e.x,y-e.y);
        if(d<85&&['windup','strike'].includes(e.action))cost+=(85-d)*2;
      }
      if(cost<score){score=cost;best=v;}
    }
    joy.active=true;joy.dx=best.x;joy.dy=best.y;
    const imminent=G.telegraphs.some(t=>t.life<.23&&danger(t,P.x,P.y)<5)||G.eshots.some(s=>Math.hypot(P.x-(s.x+s.vx*.15),P.y-(s.y+s.vy*.15))<P.r+s.r+5);
    // Never dash out of the green tide gap; the ritual requires being physically inside it.
    if(imminent&&!goal.ritual&&Math.hypot(best.x,best.y)>0&&P.dashCd<=0){P.facing.x=best.x;P.facing.y=best.y;tryDash();}
    if(G.boss.action==='exposed'&&G.boss.actionDuration-G.boss.actionT>1.3&&distance(P,G.boss)<420&&!G.ultimate&&UltimateArts.loadout().some(id=>UltimateArts.ready(id))){
      const d=distance(P,G.boss)||1;P.facing.x=(G.boss.x-P.x)/d;P.facing.y=(G.boss.y-P.y)/d;const id=UltimateArts.loadout().find(id=>UltimateArts.ready(id));if(id)tryUltimate(id);
    }
  }
  function uninformed(){
    // Counterfactual button-mashing policy: approach the boss, cast when ready,
    // never read warning geometry or deliberately solve a guardian's ritual.
    const dx=G.boss.x-P.x,dy=G.boss.y+55-P.y,d=Math.hypot(dx,dy);
    joy.active=true;joy.dx=d>25?dx/d:0;joy.dy=d>25?dy/d:0;
    const id=UltimateArts.loadout().find(id=>UltimateArts.ready(id));if(id)tryUltimate(id);
  }
  function run(options){
    Journey.begin();Journey.run.difficulty=options.difficulty;Journey.run.ultimate=options.ultimate;botMode=false;reset();
    P.level=6;P.xp=0;P.xpNext=10;for(let i=1;i<6;i++)P.xpNext=Math.floor(P.xpNext*1.32+4);
    P.spells={yujian:3,wanjian:2,wulei:1};
    if(options.realm){P.cultivation.realm=options.realm;Journey.run.tier=options.realm;const limits=Cultivation.caps();P.level=50;P.xpNext=Cultivation.xpNeed(50);P.maxHp=P.hp=limits.maxHp*.7;P.shieldMax=limits.shieldMax*.7;P.dmg=limits.dmg*.7;P.cdr=limits.cdr;P.crit=.4;P.spells={yujian:5,wanjian:5,wulei:5,sanmei:5,bingxin:5,guanyin:5};}
    const stages=[];
    for(let stage=0;stage<3;stage++){
      G.state='playing';
      const site=WorldNavData[Journey.run.stage].sites.find(s=>s.kind==='boss');
      P.x=site.x*World.bounds().w;P.y=site.y*World.bounds().h;World.update(0);
      if(!World.interact())throw Error('Pilot could not interact with the actual altar');
      let nextReaction=0,minHp=P.hp,damageTaken=0,lastHp=P.hp,stationary=0,oldX=P.x,oldY=P.y,mechanismFailures=0,lastFailures=0;
      for(let frame=0;frame<options.maxSeconds/step;frame++){
        if(G.state==='levelup'){chooseCard();continue}
        if(G.state==='chest'){closeChest();continue}
        if(G.state!=='playing')break;
        if(G.time>=nextReaction){if(options.policy==='uninformed')uninformed();else steer();nextReaction=G.time+reaction}
        update(step);minHp=Math.min(minHp,P.hp);damageTaken+=Math.max(0,lastHp-P.hp);lastHp=P.hp;
        const failures=G.boss.brain.duelFailures;mechanismFailures+=Math.max(0,failures-lastFailures);lastFailures=failures;
        if(Math.hypot(P.x-oldX,P.y-oldY)<.2)stationary+=step;oldX=P.x;oldY=P.y;
      }
      clearInput();
      stages.push({stage:Journey.run.stage+1,state:G.state,time:Math.round(G.time*10)/10,hp:Math.round(P.hp),minHp:Math.round(minHp),damageTaken:Math.round(damageTaken),level:P.level,spells:{...P.spells},bossRemaining:Math.round(G.boss.hp),bossMax:G.boss.maxHp,earnedOpenings:G.boss.brain.breaks,round:G.boss.brain.round,mechanismFailures,helpers:G.enemies.filter(e=>e.bossHelper&&e.hp>0).length,casts:G.ultimateCasts,stationarySeconds:Math.round(stationary)});
      if(G.state!=='win'||stage===2)break;
      if(G.coreReward)Cultivation.claimCore(G.coreReward.max);while(G.queue>0){showLevelUp();chooseCard();}Journey.next('power');
    }
    return {cleared:stages.filter(s=>s.state==='win').length,stages};
  }
  return {run,steer,chooseCard,uninformed};
})();
