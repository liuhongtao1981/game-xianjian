/* Sprite state machine and layered spell renderer. Simulation time drives every frame. */
const Motion = (() => {
  const hero = new Image(), enemies = new Image();
  const golden=new Image();golden.src='assets/golden-guardians.webp';const goldenUV=[[[9, 8, 331, 354, 174.5, 362], [435, 18, 289, 344, 579.5, 362], [724, 6, 362, 356, 905.0, 362], [1086, 76, 348, 286, 1260.0, 362]], [[27, 362, 335, 362, 194.5, 724], [362, 362, 362, 362, 543.0, 724], [732, 362, 354, 362, 909.0, 724], [1086, 362, 355, 327, 1263.5, 689]], [[59, 724, 291, 341, 204.5, 1065], [378, 724, 324, 346, 540.0, 1070], [727, 724, 359, 343, 906.5, 1067], [1086, 726, 359, 291, 1265.5, 1017]]];
  const bosses = new Image();bosses.src='assets/journey-bosses.png';
  const bossAttacks = new Image();bossAttacks.src='assets/bosses-attack.png';
  const bossWalk = new Image();bossWalk.src='assets/bosses-walk.png';
  // Measured transparent bounds and foot support points; cells are not assumed uniform.
  const bossAttackUV=[[[80,128,232,215,219,340],[440,127,229,217,522,341],[766,158,261,188,900,343],[1154,165,211,181,1255,343]],[[108,440,219,225,215,662],[427,443,272,218,565,658],[771,474,291,191,880,662],[1149,479,231,182,1265,658]],[[97,759,215,238,210,994],[426,761,270,232,499,990],[783,773,266,218,913,988],[1159,749,217,249,1287,995]]];
  const bossWalkUV=[[[66,98,253,284,234,379],[416,99,258,285,589,381],[784,100,245,287,955,384],[1131,97,253,285,1318,379]],[[34,438,287,278,240,713],[410,440,281,276,615,713],[765,444,284,272,974,713],[1117,438,263,277,1332,712]],[[49,747,272,273,213,1017],[435,744,255,281,567,1022],[780,746,254,281,916,1024],[1128,747,260,273,1269,1017]]];
  function drawBossFrame(sheet,rect,size,height){
    const [sx,sy,sw,sh,px,py]=rect,scale=size/height;
    ctx.drawImage(sheet,sx,sy,sw,sh,(sx-px)*scale,(sy-py)*scale,sw*scale,sh*scale);
  }
  hero.src = 'assets/hero-motion.png';
  enemies.src = 'assets/enemy-motion.png';
  const rows = {boss:0,imp:1,fox:2,snake:3,zombie:4};
  // Explicit UV rectangles and ground pivots: generated poses are not perfectly uniform grids.
  // [source x, source y, width, height, ground pivot x, ground pivot y]
  const enemyRects=[
    [[18,35,305,260,195,283],[324,40,254,252,454,283],[579,42,267,252,713,283],[846,35,276,260,986,283]],
    [[30,301,254,270,160,558],[302,301,273,270,445,558],[586,301,263,275,716,558],[855,300,267,275,990,558]],
    [[8,573,325,240,184,799],[334,573,241,240,457,799],[580,573,285,240,727,799],[865,573,257,240,998,799]],
    [[25,817,279,248,170,1055],[309,817,269,248,450,1055],[588,817,263,248,718,1055],[851,817,271,248,987,1055]],
    [[8,1072,274,305,164,1355],[283,1072,291,305,448,1355],[578,1072,273,305,716,1355],[851,1072,271,305,994,1355]]
  ];
  function sourceRect(key,f,sheet){
    if(key!=='hero')return enemyRects[f.row][f.col];
    const x=f.col*362;
    if(f.row===0)return [x,16,362,338,x+190,343];
    if(f.row===1){
      const left=f.col===3?1144:x, right=f.col===2?1144:(f.col+1)*362;
      return [left,386,right-left,315,x+190,696];
    }
    return [x,700,362,386,x+181,1058];
  }
  const effects = [], echoes = [], pendingCasts=[];
  let releasingCast=false,activeCast=null;
  const palettes={yujian:'#8ce8ff',wulei:'#bba3ff',sanmei:'#ff924c',bingxin:'#8de4ff',gudu:'#8cebb1',jiushen:'#ffd18a',guanyin:'#b0ffe0'};
  const tau = Math.PI*2;
  function emit(type,x,y,options={}){
    const e={type,x,y,age:0,duration:.5,seed:Math.random()*100,...options};
    effects.push(e);if(effects.length>150)effects.shift();return e;
  }
  function cast(key,target){
    if(releasingCast){if(target){P.attackAngle=Math.atan2(target.y-P.y,target.x-P.x);P.look=target.x>=P.x?1:-1;}return;}
    if(key==='yujian' && !target)return;
    Sound.spell(key);
    P.attack=key==='yujian'?.44:.62;
    P.attackLength=P.attack;
    P.attackRelease=key==='yujian'?.14:.22;
    P.attackAngle=target?Math.atan2(target.y-P.y,target.x-P.x):Math.atan2(P.facing.y,P.facing.x);
    if(target)P.look=target.x>=P.x?1:-1;
    if(key!=='yujian')emit('cast',P.x,P.y,{duration:.55,r:46,color:palettes[key]});
  }
  function bindSpells(spells){
    for(const [key,spec] of Object.entries(spells)){
      if(key==='wanjian'||spec.motionBound)continue;
      const release=spec.cast;spec.motionBound=true;
      spec.cast=function(level){
        if(activeCast?.key===key||pendingCasts.some(c=>c.key===key))return;
        const target=nearest(P.x,P.y,key==='yujian'?900:620);
        if(key==='yujian'&&!target)return;
        pendingCasts.push({key,level,release});
        if(!activeCast&&!G.ultimate)beginQueuedCast();
      };
    }
  }
  function castTarget(key){
    const ranges={yujian:900,wulei:460,gudu:620,jiushen:560};
    return ranges[key]?nearest(P.x,P.y,ranges[key]):null;
  }
  function beginQueuedCast(){
    if(!pendingCasts.length||G.ultimate)return;
    activeCast=pendingCasts.shift();activeCast.remaining=activeCast.key==='yujian'?.14:.22;activeCast.released=false;
    cast(activeCast.key,castTarget(activeCast.key));
  }
  function frame(actor,key){
    if(key==='hero'){
      if(G.ultimate && G.ultimate.age<.88)return {row:2,col:3,state:'ultimate'};
      if(actor.flash>0)return {row:1,col:0,state:'hurt'};
      if(actor.attack>0){const t=actor.attackLength-actor.attack,release=actor.attackRelease||.14;return {row:1,col:t<release?0:t<release+.09?1:t<release+.2?2:3,state:'attack'};}
      if(actor.moving || actor.dash>0)return {row:0,col:Math.floor((actor.walkDistance||0)/27)%4,state:'run'};
      return {row:2,col:Math.floor((actor.animTime||0)*1.6)%2,state:'idle'};
    }
    return {row:rows[key],col:actor.moving?Math.floor((actor.walkDistance||0)/24)%4:0,state:actor.moving?'move':'idle'};
  }
  function drawActor(actor,key,size,alpha=1){
    if(actor.bossHelper&&actor.family>=3){
      ctx.save();ctx.translate(actor.x,actor.y);const color=actor.family===3?'#d9bd77':actor.family===4?(actor.phantom?'#9e6c69':'#ffe097'):'#bcece4';
      ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,4,30,10,0,0,Math.PI*2);ctx.fill();
      const g=ctx.createLinearGradient(-25,0,25,-70);g.addColorStop(0,'#182b29');g.addColorStop(.5,actor.family===3?'#776c45':'#527a75');g.addColorStop(1,'#172e2d');ctx.fillStyle=g;ctx.strokeStyle=color;ctx.lineWidth=2;
      if(actor.family===3){ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(-25,-60);ctx.lineTo(-12,-76);ctx.lineTo(18,-70);ctx.lineTo(24,-4);ctx.closePath();ctx.fill();ctx.stroke();for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,-14-i*17,25,7,0,0,Math.PI*2);ctx.stroke();}}
      else {const bob=Math.sin(G.time*2+actor.id)*3;ctx.translate(0,-36+bob);ctx.rotate(actor.family===4?Math.PI/4:0);ctx.beginPath();ctx.moveTo(0,-31);ctx.quadraticCurveTo(35,-14,20,9);ctx.lineTo(0,32);ctx.lineTo(-20,9);ctx.quadraticCurveTo(-35,-14,0,-31);ctx.fill();ctx.stroke();ctx.rotate(actor.family===4?-Math.PI/4:0);}
      ctx.fillStyle=color;ctx.font='22px KaiTi,serif';ctx.textAlign='center';ctx.fillText(actor.glyph,0,actor.family===3?-27:7);ctx.restore();
      ctx.fillStyle='#0b1d1d';ctx.fillRect(actor.x-24,actor.y-85,48,4);ctx.fillStyle=color;ctx.fillRect(actor.x-24,actor.y-85,48*actor.hp/actor.maxHp,4);return;
    }
    if(actor.lantern){
      const y=actor.y-30+Math.sin(G.time*3+actor.id)*4;
      ctx.save();ctx.strokeStyle='#abe7dc';ctx.lineWidth=2;Motion.glow(actor.x,y,40,'#8cebe2',.2);
      ctx.fillStyle='#15464c';ctx.beginPath();ctx.ellipse(actor.x,y,18,25,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#d8ffdb';ctx.fillRect(actor.x-2,y-12,4,24);ctx.beginPath();ctx.moveTo(actor.x,y+25);ctx.lineTo(actor.x,y+36);ctx.stroke();
      ctx.fillStyle='#092125';ctx.fillRect(actor.x-24,y-39,48,4);ctx.fillStyle='#a4e4d7';ctx.fillRect(actor.x-24,y-39,48*actor.hp/actor.maxHp,4);ctx.restore();return;
    }
    if(actor.seal){
      ctx.save();ctx.translate(actor.x,actor.y-18+Math.sin(G.time*3+actor.id)*4);ctx.rotate(Math.PI/4);ctx.fillStyle='#40331d';ctx.strokeStyle='#e4cd8a';ctx.lineWidth=2;ctx.fillRect(-15,-15,30,30);ctx.strokeRect(-15,-15,30,30);ctx.rotate(-Math.PI/4);ctx.fillStyle='#f0dca2';ctx.textAlign='center';ctx.font='19px KaiTi,serif';ctx.fillText(actor.glyph||(actor.eventObjective?'阵':'戒'),0,7);ctx.restore();
      ctx.fillStyle='#182320';ctx.fillRect(actor.x-22,actor.y-45,44,3);ctx.fillStyle='#e5cf91';ctx.fillRect(actor.x-22,actor.y-45,44*actor.hp/actor.maxHp,3);return;
    }
    const sheet=key==='hero'?hero:enemies;
    const f=frame(actor,key),count=key==='hero'?3:5;
    const flip=(actor.look || 1)<0?-1:1;
    const recoil=actor.flash>0?Math.sin(actor.flash*35)*2:0;
    const attackProgress=actor.attackLength?1-(actor.attack||0)/actor.attackLength:0;
    const lunge=key==='hero'&&actor.attack>0?Math.sin(Math.min(1,attackProgress)*Math.PI)*5:0;
    ctx.save();ctx.translate(actor.x+recoil+Math.cos(actor.attackAngle||0)*lunge,actor.y+Math.sin(actor.attackAngle||0)*lunge);ctx.scale(flip,1);ctx.globalAlpha=alpha;
    if(actor.flash>0)ctx.filter='brightness(1.55)';
    else if(key==='hero'&&actor.cultivation?.realm>0){ctx.filter='drop-shadow(0px 0px 2px '+RealmVisuals.get(actor.cultivation).color+')';}
    else if(actor.clerk){ctx.globalAlpha*=.7;ctx.filter='sepia(.6) hue-rotate(320deg)';}
    if(actor.boss&&Journey.run.stage>=3&&golden.complete&&golden.naturalWidth){const row=Journey.run.stage-3,phase=actor.action||'guard',col=phase==='windup'?2:phase==='strike'?3:actor.moving?Math.floor((actor.walkDistance||0)/36)%2:0;drawBossFrame(golden,goldenUV[row][col],size,350);Encounters.ornament(actor,size);
    }else if(actor.boss&&bossWalk.complete&&bossWalk.naturalWidth&&(!['windup','strike','recover','exposed'].includes(actor.action)||!bossAttacks.complete||!bossAttacks.naturalWidth)){
      const row=actor.family??Journey.stage().bossRow,col=actor.moving?Math.floor((actor.walkDistance||0)/33)%4:0;
      drawBossFrame(bossWalk,bossWalkUV[row][col],size,[285,277,277][row]);
      Encounters.ornament(actor,size);
    }else if(actor.boss&&bossAttacks.complete&&bossAttacks.naturalWidth){
      const row=actor.family??Journey.stage().bossRow;
      const phase=actor.action||'guard',p=Math.min(1,(actor.actionT||0)/(actor.actionDuration||1));
      const col=phase==='windup'?0:phase==='strike'?(p<.55?1:2):phase==='recover'||phase==='exposed'?3:0;
      drawBossFrame(bossAttacks,bossAttackUV[row][col],size*(row===2?1:1.12),[202,205,235][row]);
      Encounters.ornament(actor,size);
    }else if(actor.boss&&bosses.complete&&bosses.naturalWidth){
      const cw=bosses.naturalWidth/3,ch=bosses.naturalHeight/2,col=Journey.stage().bossRow,row=actor.action==='windup'||actor.action==='strike'?1:0;
      ctx.drawImage(bosses,col*cw,row*ch,cw,ch,-size*.5,-size*.85,size,size);
      Encounters.ornament(actor,size);
    }else if(key!=='hero'&&Encounters.drawActor(actor,key,size)){
      // Themed walk cycles are driven by the same actor animation clock.
    }else if(sheet.complete && sheet.naturalWidth){
      const [sx,sy,sw,sh,px,py]=sourceRect(key,f,sheet),scale=size/(key==='hero'?362:280);
      ctx.drawImage(sheet,sx,sy,sw,sh,(sx-px)*scale,(sy-py)*scale,sw*scale,sh*scale);
    }
    else drawSprite(key,-size*.5,-size*.85,size);
    ctx.restore();
  }
  function step(actor,dt,dx,dy){
    const distance=Math.hypot(dx,dy),planted=actor.action==='windup'||actor.action==='recover'||actor.action==='exposed';
    actor.moving=distance>.15&&!planted;
    if(actor.moving)actor.walkDistance=(actor.walkDistance||0)+distance;
    actor.animTime=(actor.animTime||0)+dt;
    actor.motionSpeed=distance/Math.max(.001,dt);
    if(Math.abs(dx)>.15&&!actor.action?.match(/windup|strike|recover|exposed/) && !(actor.attack>0))actor.look=dx<0?-1:1;
    actor.attack=Math.max(0,(actor.attack||0)-dt);
  }
  function update(dt){
    // All damage/projectiles are created on the release pose, after visible anticipation.
    if(G.state==='playing'&&P?.hp>0&&!G.ultimate){
      if(!activeCast)beginQueuedCast();
      if(activeCast){
        const c=activeCast;c.remaining-=dt;
        if(!c.released&&P.attack<=0){cast(c.key,castTarget(c.key));c.remaining=c.key==='yujian'?.14:.22;}
        if(c.remaining<=0&&!c.released){
          const target=castTarget(c.key);
          if(target){P.attackAngle=Math.atan2(target.y-P.y,target.x-P.x);P.look=target.x>=P.x?1:-1;}
          // The new cast was queued after Motion.step: explicitly synchronize this frame.
          P.attack=Math.min(P.attack,P.attackLength-P.attackRelease);
          c.released=true;c.remaining=.11;releasingCast=true;
          try{c.release(c.level);if(c.key==='yujian')emit('slash',P.x,P.y-20,{angle:P.attackAngle,duration:.24,r:58,color:palettes.yujian});}
          finally{releasingCast=false;}
        }else if(c.remaining<=0&&c.released){activeCast=null;beginQueuedCast();}
      }
    }
    Encounters.update(dt);
    for(let i=effects.length-1;i>=0;i--){effects[i].age+=dt;if(effects[i].age>effects[i].duration)effects.splice(i,1);}
    for(let i=echoes.length-1;i>=0;i--){echoes[i].age+=dt;if(echoes[i].age>.3)echoes.splice(i,1);}
  }
  function echo(actor){echoes.push({actor:{...actor},age:0});if(echoes.length>12)echoes.shift();}
  function glow(x,y,r,color,alpha){
    if(r<=0 || alpha<=0)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,rgba(color,alpha));g.addColorStop(.3,rgba(color,alpha*.5));g.addColorStop(1,rgba(color,0));
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function rune(x,y,r,alpha,color,rotation=0){
    ctx.save();ctx.translate(x,y);ctx.scale(1,.62);ctx.rotate(rotation);ctx.globalAlpha=alpha;
    ctx.strokeStyle=color;ctx.lineWidth=1.5;
    for(const radius of [r*.78,r,r*1.07]){ctx.beginPath();ctx.arc(0,0,radius,0,tau);ctx.stroke();}
    for(let i=0;i<12;i++){
      const a=i*tau/12;ctx.save();ctx.rotate(a);ctx.fillStyle=color;ctx.fillRect(r*.87,-2,6,4);ctx.restore();
      if(i%2===0){ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.77,Math.sin(a)*r*.77);ctx.lineTo(Math.cos(a+tau/3)*r*.77,Math.sin(a+tau/3)*r*.77);ctx.stroke();}
    }ctx.restore();
  }
  function sword(x,y,a,length,color,alpha=1){
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=alpha;ctx.globalCompositeOperation='lighter';
    glow(-length*.25,0,length*.65,color,.08);
    const half=Math.max(2.7,Math.min(17,length*.035)),guard=Math.max(6,length*.06);
    const g=ctx.createLinearGradient(-length,0,length*.55,0);g.addColorStop(0,rgba(color,0));g.addColorStop(.55,rgba(color,.6));g.addColorStop(1,'#ffffff');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(length*.56,0);ctx.lineTo(length*.4,half);ctx.lineTo(-length*.28,half);ctx.lineTo(-length*.28,-half);ctx.lineTo(length*.4,-half);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f3ffff';ctx.beginPath();ctx.moveTo(length*.56,0);ctx.lineTo(-length*.26,half*.28);ctx.lineTo(-length*.26,-half*.28);ctx.closePath();ctx.fill();
    ctx.fillStyle=color;ctx.fillRect(-length*.3,-guard,Math.max(2.5,length*.015),guard*2);ctx.fillRect(-length*.45,-half*.35,length*.15,half*.7);ctx.restore();
  }
  function drawGround(){
    Encounters.drawGround();
    for(const e of effects){
      const p=e.age/e.duration,a=Math.sin(Math.PI*p);
      if(['cast','heal','ice','fire','blast'].includes(e.type)){
        const color=e.color||'#a6f1df';
        glow(e.x,e.y,e.r||80,color,a*.2);
        if(e.type==='cast'||e.type==='heal'||e.type==='ice')rune(e.x,e.y,(e.r||70)*(1+p*.2),a*.65,color,e.age*.6);
        else {ctx.save();ctx.translate(e.x,e.y);ctx.scale(1,.65);ctx.strokeStyle=rgba(color,(1-p)*.9);ctx.lineWidth=(1-p)*9+1;ctx.beginPath();ctx.arc(0,0,Math.max(1,e.r*p),0,tau);ctx.stroke();ctx.restore();}
      }
    }
    for(const e of echoes)drawActor(e.actor,'hero',116,(1-e.age/.3)*.23);
  }
  function drawOver(){
    Encounters.drawOver();
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const e of effects){
      const p=e.age/e.duration,a=1-p,color=e.color||'#b9eeff';
      if(e.type==='slash'){
        ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.scale(1,.65);
        const start=-1.5+p*1.8,end=start+1.25;
        for(const [w,opacity] of [[22,.12],[10,.35],[3,.95]]){ctx.lineWidth=w;ctx.strokeStyle=rgba(color,a*opacity);ctx.beginPath();ctx.arc(0,0,e.r,start,end);ctx.stroke();}
        ctx.restore();
      } else if(e.type==='hit'){
        glow(e.x,e.y,26*a,color,a*.65);
        ctx.lineWidth=1.5;ctx.strokeStyle=rgba(color,a);
        for(let i=0;i<7;i++){const a0=i*tau/7+e.seed;const d=p*35;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a0)*d,e.y+Math.sin(a0)*d*.7);ctx.lineTo(e.x+Math.cos(a0)*(d+12*a),e.y+Math.sin(a0)*(d+12*a)*.7);ctx.stroke();}
      } else if(e.type==='fire'||e.type==='blast'){
        ctx.globalCompositeOperation='source-over';
        for(let i=0;i<20;i++){
          const angle=i*tau/20+e.seed,dist=e.r*Math.min(1,p*2.8)*(i%3?.86:.65);
          const x=e.x+Math.cos(angle)*dist,y=e.y+Math.sin(angle)*dist*.62;
          const height=(25+(i%5)*7)*Math.sin(Math.PI*p);
          const fire=ctx.createLinearGradient(x,y,x,y-height);fire.addColorStop(0,rgba(color,a*.7));fire.addColorStop(.5,rgba('#ffd78c',a*.8));fire.addColorStop(1,rgba('#fff3c4',0));
          ctx.fillStyle=fire;ctx.beginPath();ctx.moveTo(x-8*a,y);ctx.quadraticCurveTo(x-12,y-height*.55,x+Math.sin(e.age*10+i)*8,y-height);ctx.quadraticCurveTo(x+13,y-height*.3,x+7*a,y);ctx.closePath();ctx.fill();
        }
        ctx.globalCompositeOperation='lighter';
      } else if(e.type==='heal'||e.type==='ice'){
        for(let i=0;i<12;i++){
          const angle=i*tau/12+e.age,rad=(e.r||60)*(.7+p*.2),x=e.x+Math.cos(angle)*rad,y=e.y+Math.sin(angle)*rad*.5-p*80;
          ctx.fillStyle=rgba(color,a*.8);ctx.beginPath();ctx.moveTo(x,y-10);ctx.quadraticCurveTo(x+9,y-2,x,y+6);ctx.quadraticCurveTo(x-9,y-2,x,y-10);ctx.fill();
        }
      } else if(e.type==='thunder'){
        const top=e.y-230;
        glow(e.x,e.y-10,90,color,a*.35);
        for(let branch=0;branch<3;branch++){
          ctx.beginPath();ctx.moveTo(e.x+(branch-1)*65,top);
          for(let i=1;i<=8;i++){const t=i/8;ctx.lineTo(e.x+(branch-1)*65*(1-t)+Math.sin(i*17+e.seed)*24*(1-t),top+t*230);}
          ctx.strokeStyle=rgba(color,a*.2);ctx.lineWidth=14;ctx.stroke();ctx.strokeStyle=rgba('#e8e3ff',a);ctx.lineWidth=2;ctx.stroke();
        }
      }
    }ctx.restore();
  }
  function drawProjectile(s){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    const trail=s.trail||[];
    if(trail.length>1){for(let j=1;j<trail.length;j++){const a=j/trail.length;ctx.strokeStyle=rgba(s.color,a*.5);ctx.lineWidth=a*5;ctx.beginPath();ctx.moveTo(trail[j-1].x,trail[j-1].y);ctx.lineTo(trail[j].x,trail[j].y);ctx.stroke();}}
    sword(s.x,s.y,Math.atan2(s.vy,s.vx),38,s.color);ctx.restore();
  }
  function drawShield(p){
    if(p.shield<=0)return;
    const x=p.x,y=p.y-33,r=49;
    ctx.save();ctx.globalCompositeOperation='lighter';
    glow(x,y,r*1.1,'#71dfff',.06+Math.min(.08,p.shield/700));
    ctx.strokeStyle='#9ceaff';ctx.lineWidth=1;ctx.globalAlpha=.4;
    ctx.beginPath();ctx.ellipse(x,y,r*.74,r,0,0,tau);ctx.stroke();
    for(let i=0;i<6;i++){const a=G.time*.5+i*tau/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.74,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a+tau/6)*r*.74,y+Math.sin(a+tau/6)*r);ctx.stroke();}
    ctx.restore();
  }
  function drawPool(pool){
    ctx.save();ctx.translate(pool.x,pool.y);ctx.scale(1,.65);ctx.globalCompositeOperation='lighter';
    const fade=Math.min(1,pool.life);glow(0,0,pool.r,'#57c98d',.22*fade);
    for(let i=0;i<3;i++){ctx.strokeStyle=rgba('#8be9a5',.25*fade);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,pool.r*(.5+i*.2),G.time*(i%2?-1:1)+i,G.time*(i%2?-1:1)+i+4.2);ctx.stroke();}
    for(let i=0;i<12;i++){const a=i*tau/12+G.time*.3,r=pool.r*(.3+(i%3)*.2),rise=(G.time*24+i*7)%50;glow(Math.cos(a)*r,Math.sin(a)*r-rise,6,'#abffcb',.3*fade*(1-rise/50));}
    ctx.restore();
  }
  function drawUltimate(){
    const u=G.ultimate;if(!u)return;
    if(u.kind==='lotus'){
      const p=u.age/1.6,alpha=Math.sin(Math.PI*p);
      rune(u.x,u.y,155,alpha*.8,'#b4edc8',u.age*.3);
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<9;i++){const a=i*tau/9+u.age*.3;sword(u.x+Math.cos(a)*110,u.y+Math.sin(a)*65-p*25,a-Math.PI/2,60,'#b0efc9',alpha);}
      glow(u.x,u.y-35,140,'#aaf0c4',alpha*.18);ctx.restore();
      return;
    }
    if(u.kind==='river'){
      const alpha=Math.min(1,u.age*5,(1.8-u.age)*3);
      ctx.save();ctx.translate(P.x,P.y);ctx.rotate(u.angle);ctx.globalAlpha=alpha;
      const trail=ctx.createLinearGradient(0,0,500,0);trail.addColorStop(0,'#98dfff28');trail.addColorStop(1,'#98dfff00');ctx.fillStyle=trail;ctx.fillRect(0,-65,500,130);
      ctx.strokeStyle='#a5e4ff88';ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(0,i*14);ctx.quadraticCurveTo(250,i*18,500,i*27);ctx.stroke();}ctx.restore();return;
    }
    const t=u.age,fade=Math.min(1,t*4,(2.15-t)*2.5),r=Math.min(W,H)*.3;
    rune(u.x,u.y,r,fade*.65,'#9cdef2',-t*.25);
    rune(u.x,u.y,r*.7,fade*.85,'#ffe6ad',t*.45);
    ctx.save();ctx.globalCompositeOperation='lighter';
    if(t<.9){
      const gather=Math.min(1,t/.72);
      for(let i=0;i<14;i++){
        const angle=i*tau/14+t*.7,rad=r*(1.25-gather*.5);
        sword(u.x+Math.cos(angle)*rad,u.y+Math.sin(angle)*rad*.48-45,angle+Math.PI,62,'#adebff',fade);
      }
      glow(u.x,u.y-95,130,'#9ae5ff',gather*.25);
      if(t>.62){const appear=(t-.62)/.28;const length=Math.min(430,H*.6);sword(u.x,u.y-length*.56+(1-appear)*-250,Math.PI/2,length,'#ffdf9b',appear);}
    }else{
      const impact=t-.9;
      glow(u.x,u.y,Math.max(60,impact*700),'#ffdd9e',Math.max(0,.22-impact*.3));
      const length=Math.min(430,H*.6);
      sword(u.x,u.y-length*.56,Math.PI/2,length,'#f5e0a8',Math.max(0,1-impact*1.5));
      for(let i=0;i<18;i++){
        const angle=i*tau/18,dist=100+impact*600;
        sword(u.x+Math.cos(angle)*dist,u.y+Math.sin(angle)*dist*.65,angle,60,'#9ee9ff',Math.max(0,1-impact)*Math.min(1,impact*5));
      }
      for(let j=0;j<3;j++){
        const rr=(impact-j*.08)*650;if(rr<=0)continue;
        ctx.save();ctx.translate(u.x,u.y);ctx.scale(1,.65);ctx.strokeStyle=rgba(j?'#9feaff':'#ffe5ad',Math.max(0,(1-impact)*(.8-j*.18)));ctx.lineWidth=8-j*2;ctx.beginPath();ctx.arc(0,0,rr,0,tau);ctx.stroke();ctx.restore();
      }
    }
    ctx.restore();
  }
  function drawScreen(){
    const u=G.ultimate;if(!u||u.kind!=='heaven')return;
    const fade=Math.min(1,u.age*4,(2.15-u.age)*2.5);
    ctx.save();ctx.fillStyle=rgba('#020b16',fade*.18);ctx.fillRect(0,0,W,H);ctx.globalAlpha=fade;ctx.fillStyle='#f4e3ba';ctx.textAlign='center';ctx.font='28px KaiTi,serif';ctx.shadowBlur=16;ctx.shadowColor='#74cced';ctx.fillText('天 剑 · 归 一',W/2,H*.25);ctx.font='10px Microsoft YaHei,sans-serif';ctx.fillStyle='#bfe4ed';ctx.fillText(u.age<.9?'聚 天 地 灵 气':'一 剑 镇 万 邪',W/2,H*.25+25);ctx.restore();
  }
  function resize(sx,sy){Encounters.resize(sx,sy);for(const e of effects){e.x*=sx;e.y*=sy;}for(const e of echoes){e.actor.x*=sx;e.actor.y*=sy;}}
  function preview(pen,time,c){
    pen.clearRect(0,0,340,430);const color=RealmVisuals.get(c).color;const g=pen.createRadialGradient(170,230,5,170,230,150);g.addColorStop(0,color+'18');g.addColorStop(1,color+'00');pen.fillStyle=g;pen.fillRect(0,0,340,430);
    pen.save();pen.translate(170,345);pen.scale(1,.38);pen.strokeStyle=color;pen.lineWidth=1.3;for(let k=0;k<RealmVisuals.get(c).rings;k++){pen.beginPath();pen.arc(0,0,90+k*12,0,Math.PI*2);pen.stroke();}pen.rotate(time*.2);for(let i=0;i<9;i++){pen.rotate(Math.PI*2/9);pen.fillStyle=i<(c.layer||1)?color:'#3d4842';pen.fillRect(100,-3,10,6);}pen.restore();
    if(hero.complete&&hero.naturalWidth){const col=Math.floor(time*1.6)%2,rect=sourceRect('hero',{row:2,col},hero),[sx,sy,sw,sh,px,py]=rect,scale=.76;pen.drawImage(hero,sx,sy,sw,sh,170+(sx-px)*scale,335+(sy-py)*scale+Math.sin(time*2)*2,sw*scale,sh*scale);}
    for(let i=0;i<Math.min(6,2+c.realm);i++){const a=time*.6+i*Math.PI*2/Math.min(6,2+c.realm),x=170+Math.cos(a)*100,y=260+Math.sin(a)*45;pen.save();pen.translate(x,y);pen.rotate(a+.7);pen.fillStyle=color;pen.beginPath();pen.moveTo(0,-23);pen.lineTo(4,9);pen.lineTo(0,5);pen.lineTo(-4,9);pen.closePath();pen.fill();pen.restore();}
  }
  return {preview,emit,cast,bindSpells,frame,drawActor,step,update,echo,glow,rune,sword,drawGround,drawOver,drawProjectile,drawShield,drawPool,drawUltimate,drawScreen,resize,reset(){Encounters.reset();effects.length=0;echoes.length=0;pendingCasts.length=0;activeCast=null;releasingCast=false;},status(){return {hero:hero.complete&&hero.naturalWidth>0,enemies:enemies.complete&&enemies.naturalWidth>0,bossWalk:bossWalk.complete&&bossWalk.naturalWidth>0,bossAttacks:bossAttacks.complete&&bossAttacks.naturalWidth>0,effects:effects.length,pendingCasts:pendingCasts.length+(activeCast&&!activeCast.released?1:0),activeCast:activeCast?.key||null};}};
})();
