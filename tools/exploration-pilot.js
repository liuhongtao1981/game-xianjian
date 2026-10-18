/* Runs in the real game's VM: ordinary input, pickups, card choices and altar entry. */
const ExplorationPilot=(()=>{
  const step=1/30,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function choose(){
    const scores={wanjian:10,guanyin:9,yujian:8,wulei:8,sanmei:7,bingxin:6,gudu:6,jiushen:5};
    let best=0,score=-1;
    choicesCache.forEach((c,i)=>{const value=c.kind==='stat'?({atk:5,hp:5,cd:7,crit:3,spd:3,pick:4}[c.id]||1):(scores[c.key]||2)+(c.kind==='new'?.2:0);if(value>score){score=value;best=i;}});pickCard(best);
  }
  function threat(e,x,y){
    if(!['windup','strike'].includes(e.action))return 0;
    const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy),a=e.attackAngle||0;
    if(e.attackKind==='rush'){
      const along=dx*Math.cos(a)+dy*Math.sin(a),across=-dx*Math.sin(a)+dy*Math.cos(a);
      return along>-35&&along<(e.attackDistance||290)+30&&Math.abs(across)<e.r+P.r+25?160:0;
    }
    if(e.attackKind==='ranged')return 0;
    const range=e.attackKind==='heavy'?130:92;
    return d<range&&Math.cos(Math.atan2(dy,dx)-a)>.15?(range-d)*5+60:0;
  }
  function exploreMove(goal){
    const enemies=G.enemies.filter(e=>e.hp>0&&!e.eventObjective&&dist(e,P)<700);
    const targets=G.enemies.filter(e=>e.hp>0&&dist(e,P)<650).sort((a,b)=>dist(a,P)-dist(b,P));
    const heals=G.heals.filter(h=>dist(h,P)<650).sort((a,b)=>dist(a,P)-dist(b,P));
    const orbs=G.orbs.filter(o=>dist(o,P)<300).sort((a,b)=>dist(a,P)-dist(b,P));
    const chest=G.chests.filter(c=>dist(c,P)<600).sort((a,b)=>dist(a,P)-dist(b,P))[0];
    let aim=goal;
    if(chest&&!enemies.length)aim=chest;
    else if(P.hp<P.maxHp*.75&&heals.length)aim=heals[0];
    else if(orbs.length)aim=orbs[0];
    else if(targets.length){
      const e=targets[0],d=dist(e,P)||1,range=P.spells.wanjian?70:180;
      aim={x:e.x+(P.x-e.x)/d*range,y:e.y+(P.y-e.y)/d*range};
    }
    const direction=World.steer(P,aim.x,aim.y),a=Math.atan2(direction.y,direction.x);
    const ahead=Math.min(P.speed*.34,Math.max(16,dist(P,aim)));
    let best={x:0,y:0},score=Infinity;
    const options=[{x:0,y:0},...Array.from({length:24},(_,i)=>({x:Math.cos(a+i*Math.PI/12),y:Math.sin(a+i*Math.PI/12)}))];
    for(const v of options){
      const x=P.x+v.x*ahead,y=P.y+v.y*ahead;
      let cost=Math.hypot(x-aim.x,y-aim.y)*.65;
      if(!World.isWalkable(x,y,P.r))cost+=3000;
      for(const e of enemies){cost+=threat(e,x,y);const d=Math.hypot(x-e.x,y-e.y);if(d<e.r+P.r+8)cost+=(e.r+P.r+8-d)*5;}
      for(const s of G.eshots){const d=Math.hypot(x-s.x-s.vx*.25,y-s.y-s.vy*.25)-P.r-s.r;if(d<35)cost+=(35-d)*7;}
      if(!enemies.length&&!orbs.length&&!chest)cost+=Math.hypot(v.x-direction.x,v.y-direction.y)*100;
      if(cost<score){score=cost;best=v;}
    }
    joy.active=true;joy.dx=best.x;joy.dy=best.y;
    const danger=enemies.some(e=>e.action==='windup'&&e.actionDuration-e.actionT<.2&&threat(e,P.x,P.y)>0)||G.eshots.some(s=>Math.hypot(P.x-s.x-s.vx*.1,P.y-s.y-s.vy*.1)<P.r+s.r+8);
    if(danger&&P.dashCd<=0&&Math.hypot(best.x,best.y)>0){P.facing={...best};tryDash();}
    if(P.energy>=100&&P.ultCd<=0&&(enemies.filter(e=>dist(e,P)<600).length>=5||enemies.some(e=>e.elite&&dist(e,P)<400))){
      if(targets.length){const d=dist(targets[0],P)||1;P.facing={x:(targets[0].x-P.x)/d,y:(targets[0].y-P.y)/d};}tryUltimate();
    }
  }
  function route(full){
    const ids=full?[0,1,2,3,4,5,6,7,8]:[0,1,2,4,3,7,8];
    const items=[];
    for(const id of ids){items.push({kind:'camp',id});if(id===0)items.push({kind:'site',id:3});if(id===2)items.push({kind:'site',id:0});if(id===4)items.push({kind:'site',id:4});if(full&&id===3)items.push({kind:'site',id:1});if(full&&id===7)items.push({kind:'site',id:2});}
    items.push({kind:'site',id:5});return items;
  }
  function run(options={}){
    Journey.begin();Journey.run.difficulty=options.difficulty||'normal';Journey.run.ultimate=options.ultimate||'heaven';reset();botMode=false;
    const rows=[];
    for(let stage=0;stage<(options.stages||3);stage++){
      G.state='playing';const path=route(options.full),read=new Set();let index=0,nextInput=0,beforeBoss=null,maxGap=0,gap=0,combatTime=0,damage=0,lastHp=P.hp;
      for(let frame=0;frame<(options.maxSeconds||1500)/step;frame++){
        if(G.state==='levelup'){choose();continue;}
        if(G.state==='chest'){closeChest();continue;}
        if(G.state==='journal'){document.getElementById('closeWorldLore').onclick();continue;}
        if(G.state!=='playing')break;
        if(G.time>=nextInput){
          if(World.active())GuardianPilot.steer();
          else{
            const s=EncounterDirector.status();let target=path[index];
            while(target&&target.kind==='camp'&&s.camps[target.id].state==='cleared'){index++;target=path[index];}
            if(!target)break;
            const point=target.kind==='camp'?s.camps[target.id]:{x:WorldNavData[Journey.run.stage].sites[target.id].x*3600,y:WorldNavData[Journey.run.stage].sites[target.id].y*2600};
            if(target.kind==='site'&&dist(point,P)<100){
              World.update(0);
              if(World.context()){
                if(target.id===5)beforeBoss={time:Math.round(G.time),level:P.level,hp:Math.round(P.hp),...EncounterDirector.status().stats,cleared:s.cleared,eliteCamps:s.camps.filter(c=>c.kind!=='camp'&&c.state==='cleared').length};
                if(World.interact()){read.add(target.id);index++;}
              }else if(read.has(target.id)){index++;}
            }
            if(G.state==='playing')exploreMove(point);
          }
          nextInput=G.time+.1;
        }
        const contact=G.enemies.some(e=>e.hp>0&&!e.eventObjective&&dist(e,P)<650);
        if(contact){combatTime+=step;gap=0;}else {gap+=step;maxGap=Math.max(maxGap,gap);}
        update(step);damage+=Math.max(0,lastHp-P.hp);lastHp=P.hp;
      }
      clearInput();const s=EncounterDirector.status();
      rows.push({stage:Journey.run.stage+1,state:G.state,time:Math.round(G.time),level:P.level,hp:Math.round(P.hp),damageTaken:Math.round(damage),kills:G.kills,combatSeconds:Math.round(combatTime),maxGapSeconds:Math.round(maxGap),routeIndex:index,routeLength:path.length,beforeBoss,spells:{...P.spells},equips:[...P.equips],director:s.stats,camps:s.camps.map(c=>({id:c.id,state:c.state,wave:c.wave,remaining:c.remaining,runes:c.runes}))});
      if(G.state!=='win'||stage===(options.stages||3)-1)break;(G.coreReward&&Cultivation.claimCore(G.coreReward.max),Journey.next)('power');
    }
    return {cleared:rows.filter(r=>r.state==='win').length,rows};
  }
  return {run};
})();
