/* Stage families share combat roles, but own their silhouettes, spells and tells. */
const Encounters=(()=>{
  const keys=['imp','fox','snake','zombie'];
  const families=[
    {id:'exile',color:'#e7c579',units:[
      {name:'缄言小僧',role:'melee',glyph:'僧',hp:27,speed:77,dmg:6,r:14,xp:5},
      {name:'焚卷狻猊',role:'rush',glyph:'焚',hp:25,speed:104,dmg:6,r:16,xp:7},
      {name:'诵律卷灵',role:'ranged',glyph:'律',hp:34,speed:61,dmg:7,r:16,xp:8},
      {name:'镇钟金刚',role:'heavy',glyph:'钟',hp:78,speed:43,dmg:10,r:21,xp:13}]},
    {id:'birth',color:'#ee897f',units:[
      {name:'伪诏刀役',role:'melee',glyph:'役',hp:27,speed:80,dmg:6,r:14,xp:5},
      {name:'赤绸诏魇',role:'rush',glyph:'绸',hp:25,speed:108,dmg:6,r:16,xp:7},
      {name:'报命朱吏',role:'ranged',glyph:'诏',hp:35,speed:60,dmg:7,r:16,xp:8},
      {name:'断籍禁卫',role:'heavy',glyph:'刑',hp:80,speed:45,dmg:11,r:21,xp:13}]},
    {id:'river',color:'#8edee6',units:[
      {name:'沉灯水鬼',role:'melee',glyph:'灯',hp:28,speed:78,dmg:6,r:14,xp:5},
      {name:'逐浪獠妖',role:'rush',glyph:'浪',hp:26,speed:110,dmg:6,r:16,xp:7},
      {name:'逆鳞江妖',role:'ranged',glyph:'鳞',hp:36,speed:63,dmg:7,r:16,xp:8},
      {name:'缚舟锚尸',role:'heavy',glyph:'锚',hp:82,speed:44,dmg:11,r:21,xp:13}]}
  ];
  const sheets=families.map(f=>{const img=new Image();img.src='assets/bestiary-'+f.id+'.png';return img;});
  const attackSheets=families.map(f=>{const img=new Image();img.src='assets/bestiary-'+f.id+'-attack.png';return img;});
  const attackUV=[[[[41,97,215,233,160,327],[358,116,237,211,487,324],[676,119,251,210,790,326],[1013,142,204,183,1131,322]],[[50,393,240,230,176,620],[347,394,276,196,478,587],[663,405,263,231,809,633],[984,422,235,206,1114,625]],[[48,672,233,243,167,912],[353,677,250,235,458,909],[669,679,268,234,784,910],[1002,677,211,252,1098,926]],[[57,933,212,249,168,1179],[362,958,272,227,475,1182],[669,969,281,216,793,1182],[1009,968,208,227,1124,1192]]],[[[80,86,173,192,173,275],[373,97,247,176,476,270],[663,115,247,159,765,271],[997,112,182,160,1098,269]],[[71,373,182,213,164,583],[331,370,274,216,466,583],[640,369,291,217,774,583],[998,373,185,213,1094,583]],[[61,680,204,202,182,879],[337,682,303,199,456,878],[681,679,250,202,789,878],[1000,687,187,195,1107,879]],[[76,949,199,215,186,1161],[372,974,215,184,480,1155],[674,982,213,180,794,1159],[1002,980,186,180,1113,1157]]],[[[84,110,170,185,164,292],[371,125,211,170,460,292],[675,121,244,173,768,291],[1007,136,167,159,1089,292]],[[87,401,173,182,158,580],[367,398,235,182,417,577],[670,408,244,163,773,568],[1012,405,176,176,1102,578]],[[76,674,181,195,166,866],[366,666,219,208,461,871],[659,668,307,209,775,874],[1011,668,177,206,1105,871]],[[78,952,181,195,175,1144],[376,950,224,197,463,1144],[674,981,226,166,782,1144],[1003,984,173,161,1091,1142]]]];
  const attackHeights=[[211,218,239,227],[168,215,201,182],[172,179,207,181]];
  const effects=[];
  function family(index=Journey.run.stage){return families[index];}
  function unit(key,index=Journey.run.stage){return {...family(index).units[keys.indexOf(key)],color:family(index).color};}
  function projectile(e,angle,speed=190,offset=0){
    const theme=e.family??Journey.run.stage,color=family(theme).color;
    G.eshots.push({x:e.x,y:e.y-15,vx:Math.cos(angle+offset)*speed*Journey.difficulty().projectile,vy:Math.sin(angle+offset)*speed*Journey.difficulty().projectile,r:6,dmg:e.dmg,life:4.5,color,theme,trail:[]});
  }
  // Combat phases own both the pose and the hit. Proximity alone never deals damage.
  const attacks={
    melee:{windup:.46,strike:.18,recover:.48,range:72,arc:1.18,cooldown:.58},
    rush:{windup:.88,strike:.40,recover:.82,range:290,arc:.35,cooldown:5.4},
    ranged:{windup:.76,strike:.16,recover:.46,range:540,arc:0,cooldown:2.5},
    heavy:{windup:1.02,strike:.24,recover:.92,range:108,arc:1.42,cooldown:1.65}
  };
  function setAction(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=duration;e.attack=duration;e.castLock=duration;}
  function beginAttack(e,kind,angle,d){
    const spec=attacks[kind];e.attackKind=kind;e.attackAngle=angle;e.attackOrigin={x:e.x,y:e.y};
    e.attackDistance=kind==='rush'?Math.min(spec.range,Math.max(120,d+38)):spec.range;
    e.strikeHit=false;e.look=Math.cos(angle)<0?-1:1;e.moving=false;e.attackLength=spec.windup+spec.strike+spec.recover;
    setAction(e,'windup',Math.max(.32,spec.windup*Journey.difficulty().warning));
  }
  function hitArc(e,spec){
    const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx)-e.attackAngle;
    return d<spec.range+P.r&&Math.cos(a)>Math.cos(spec.arc+Math.asin(Math.min(1,P.r/Math.max(1,d))));
  }
  function strike(e){
    const theme=e.family??Journey.run.stage,kind=e.attackKind,spec=attacks[kind],color=family(theme).color;
    e.strikeHit=false;
    if(kind==='ranged'){
      const spread=theme===0?[0]:theme===1?[-.15,0,.15]:[-.09,.09];
      for(const angle of spread)projectile(e,e.attackAngle,theme===0?195:215,angle);
      effect('summon',{x:e.x,y:e.y,r:32,theme});return;
    }
    if(kind==='rush')return;
    const hit=hitArc(e,spec);e.strikeHit=true;
    Motion.emit('slash',e.x,e.y-16,{angle:e.attackAngle,duration:spec.strike+.13,r:spec.range*.82,color});
    if(kind==='heavy')effect('impact',{x:e.x+Math.cos(e.attackAngle)*55,y:e.y+Math.sin(e.attackAngle)*55,r:52,theme,duration:.55});
    if(hit)hurtPlayer(e.dmg*(kind==='heavy'?1.65:1.2));
  }
  function rushStep(e,dt){
    const oldX=e.x,oldY=e.y,speed=e.attackDistance/attacks.rush.strike;
    e.x+=Math.cos(e.attackAngle)*speed*dt;e.y+=Math.sin(e.attackAngle)*speed*dt;
    if(!e.strikeHit){
      const vx=e.x-oldX,vy=e.y-oldY,t=Math.max(0,Math.min(1,((P.x-oldX)*vx+(P.y-oldY)*vy)/(vx*vx+vy*vy||1)));
      if(Math.hypot(P.x-oldX-vx*t,P.y-oldY-vy*t)<P.r+e.r+7){hurtPlayer(e.dmg*1.5);e.strikeHit=true;}
    }
    if((e.actionT% .08)<dt)Motion.emit('hit',e.x,e.y,{duration:.2,color:family(e.family??Journey.run.stage).color});
  }
  function attackMob(e,dt,dx,dy,d){
    const role=unit(e.type,e.family??Journey.run.stage).role;
    e.atkCd=(e.atkCd??0)-dt;e.skillCd=(e.skillCd??1.5)-dt;
    if(e.action==='windup'||e.action==='strike'||e.action==='recover'){
      const spec=attacks[e.attackKind];
      if(!spec){e.action='idle';return;}
      const phaseDt=Math.min(dt,Math.max(0,e.actionDuration-e.actionT));
      if(e.action==='strike'&&e.attackKind==='rush')rushStep(e,phaseDt);
      e.actionT+=dt;e.attack=Math.max(0,e.actionDuration-e.actionT);e.castLock=e.attack;
      if(e.actionT>=e.actionDuration){
        if(e.action==='windup'){setAction(e,'strike',spec.strike);strike(e);}
        else if(e.action==='strike')setAction(e,'recover',spec.recover);
        else{e.action='idle';e.attack=0;e.castLock=0;e.atkCd=spec.cooldown;if(e.attackKind==='rush')e.skillCd=spec.cooldown;}
      }
      return;
    }
    e.action='idle';e.castLock=0;
    let kind=null;
    if(role==='ranged'&&e.atkCd<=0&&d<540)kind='ranged';
    else if(role==='heavy'&&e.atkCd<=0&&d<116)kind='heavy';
    else if(role==='rush'&&e.skillCd<=0&&d>90&&d<340)kind='rush';
    else if(role!=='ranged'&&e.atkCd<=0&&d<74)kind='melee';
    if(kind){beginAttack(e,kind,Math.atan2(dy,dx),d);return;}
    // Ranged foes plant their feet in casting distance; melee slows naturally before contact.
    const desired=role==='ranged'?(d<205?-.55:d>330?1:0):(d>e.r+P.r+14?1:0);
    const direction=desired>0&&typeof World!=='undefined'&&World.steer?World.steer(e,P.x,P.y):{x:dx/d,y:dy/d};
    const speed=e.speed*desired;e.x+=direction.x*speed*dt;e.y+=direction.y*speed*dt;
  }
  function effect(kind,data){effects.push({kind,age:0,duration:kind==='phase'?1.25:.72,...data});if(effects.length>64)effects.shift();}
  function impact(t){effect('impact',{...t,theme:t.theme??Journey.run.stage});Sound.effects(['bell-impact','edict-impact','tide-impact'][t.theme??Journey.run.stage]);}
  function update(dt){for(let i=effects.length-1;i>=0;i--){effects[i].age+=dt;if(effects[i].age>=effects[i].duration)effects.splice(i,1);}}
  function drawActor(e,key,size){
    const theme=e.family??Journey.run.stage,acting=['windup','strike','recover'].includes(e.action),attackSheet=attackSheets[theme];
    const attacking=acting&&attackSheet.complete&&attackSheet.naturalWidth,sheet=attacking?attackSheet:sheets[theme];
    if(!sheet.complete||!sheet.naturalWidth)return false;
    const row=keys.indexOf(key);if(row<0)return false;
    const p=(e.actionT||0)/(e.actionDuration||1);
    const frame=attacking?(e.action==='windup'?0:e.action==='strike'?(p<.55?1:2):3):(e.moving?Math.floor((e.walkDistance||0)/(e.type==='fox'?29:24))%4:0),cw=sheet.naturalWidth/4,ch=sheet.naturalHeight/4;
    // Attack frames use measured foot pivots and uniform body scale within each row.
    if(attacking){
      const [sx,sy,sw,sh,px,py]=attackUV[theme][row][frame],scale=size*1.18/attackHeights[theme][row];
      const lift=e.attackKind==='rush'&&e.action==='strike'?Math.sin(Math.PI*Math.min(1,p))*12:0;
      ctx.drawImage(sheet,sx,sy,sw,sh,(sx-px)*scale,(sy-py)*scale-lift,sw*scale,sh*scale);
    }else ctx.drawImage(sheet,frame*cw,row*ch,cw,ch,-size*.63,-size*1.2,size*1.26,size*1.26);
    return true;
  }
  function drawShot(s){
    const theme=s.theme??Journey.run.stage,a=Math.atan2(s.vy,s.vx),color=s.color;
    ctx.save();ctx.globalCompositeOperation='lighter';
    const trail=s.trail||[];
    for(let i=1;i<trail.length;i++){ctx.strokeStyle=rgba(color,i/trail.length*.45);ctx.lineWidth=theme===1?3:2;ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);ctx.stroke();}
    Motion.glow(s.x,s.y,23,color,.24);ctx.translate(s.x,s.y);ctx.rotate(a);ctx.strokeStyle=color;ctx.fillStyle=rgba(color,.65);ctx.lineWidth=1.6;
    if(theme===0){ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.stroke();ctx.rotate(G.time*2);ctx.strokeRect(-4,-4,8,8);}
    else if(theme===1){ctx.fillRect(-10,-4,20,8);ctx.strokeStyle='#ffe5bd';ctx.strokeRect(-8,-4,17,8);for(let j=-4;j<7;j+=4){ctx.beginPath();ctx.moveTo(j,-2);ctx.lineTo(j,2);ctx.stroke();}}
    else{ctx.beginPath();ctx.ellipse(0,0,6,9,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d9fff1';ctx.fillRect(-1,-5,2,10);ctx.beginPath();ctx.moveTo(-5,8);ctx.quadraticCurveTo(-10,14,-17,Math.sin(G.time*8)*5);ctx.stroke();}
    ctx.restore();
  }
  function ornament(e,size){
    const theme=Journey.run.stage,color=family(theme).color,t=G.time;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(color,.6);ctx.fillStyle=rgba(color,.22);ctx.lineWidth=1.4;
    if(theme===0){
      for(let i=0;i<3;i++){const a=t*.4+i*Math.PI*2/3,x=Math.cos(a)*size*.3,y=-size*.36+Math.sin(a)*size*.12;ctx.beginPath();ctx.moveTo(0,-size*.6);ctx.quadraticCurveTo(x*.5,-size*.2,x,y);ctx.stroke();ctx.beginPath();ctx.ellipse(x,y,9,12,0,Math.PI,Math.PI*2);ctx.lineTo(x+13,y+8);ctx.lineTo(x-13,y+8);ctx.closePath();ctx.fill();ctx.stroke();}
    }else if(theme===1){
      for(let i=0;i<4;i++){const x=(i-1.5)*size*.2,y=-size*.4+Math.sin(t*2+i)*8;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t+i)*.16);ctx.fillStyle='#af363c99';ctx.fillRect(-8,-32,16,43);ctx.strokeRect(-8,-32,16,43);ctx.fillStyle='#f6cc99';ctx.font='12px KaiTi,serif';ctx.textAlign='center';ctx.fillText('诏',0,-12);ctx.restore();}
    }else{
      for(let i=0;i<3;i++){const a=t*.55+i*Math.PI*2/3,x=Math.cos(a)*size*.34,y=-size*.25+Math.sin(a)*size*.12;Motion.glow(x,y,19,color,.18);ctx.beginPath();ctx.ellipse(x,y,8,13,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d8ffdf';ctx.fillRect(x-1,y-6,2,12);ctx.beginPath();ctx.moveTo(x,y+13);ctx.quadraticCurveTo(x-15,y+23,x+Math.sin(t*3+i)*12,y+31);ctx.stroke();}
    }ctx.restore();
  }
  function drawGround(){
    for(const e of G.enemies){
      if(e.hp<=0||e.boss||e.action!=='windup')continue;
      const spec=attacks[e.attackKind];if(!spec)continue;
      const color=family(e.family??Journey.run.stage).color,p=Math.min(1,e.actionT/e.actionDuration);
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.attackAngle);ctx.strokeStyle=rgba(color,.6+p*.3);ctx.fillStyle=rgba(color,.06+p*.1);ctx.lineWidth=1.5;
      if(e.attackKind==='rush'){
        ctx.fillRect(0,-e.r-7,e.attackDistance,(e.r+7)*2);ctx.strokeRect(0,-e.r-7,e.attackDistance,(e.r+7)*2);
        ctx.fillStyle=rgba(color,.25);ctx.fillRect(0,-e.r-7,e.attackDistance*p,(e.r+7)*2);
        ctx.beginPath();ctx.moveTo(e.attackDistance-16,-9);ctx.lineTo(e.attackDistance,0);ctx.lineTo(e.attackDistance-16,9);ctx.stroke();
      }else if(e.attackKind==='ranged'){
        ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(105,0);ctx.setLineDash([4,6]);ctx.stroke();Motion.glow(30,-14,18,color,p*.4);
      }else{
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,spec.range,-spec.arc,spec.arc);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,spec.range,-spec.arc,-spec.arc+spec.arc*2*p);ctx.stroke();
      }
      ctx.restore();
    }
    for(const e of effects){
      const p=e.age/e.duration,fade=1-p,color=family(e.theme).color;
      if(e.kind==='summon'){Motion.rune(e.x,e.y,30+p*15,fade*.7,color);continue;}
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(color,fade*.9);ctx.fillStyle=rgba(color,fade*.18);ctx.lineWidth=2+fade*4;
      if(e.shape==='tide'){
        const segments=[[e.left??0,e.gap-e.safe/2],[e.gap+e.safe/2,e.right??W]];
        for(const [left,right] of segments)for(let n=0;n<4;n++){ctx.beginPath();for(let x=left;x<=right;x+=12){const y=e.y+(n-1.5)*e.r*.45+Math.sin(x*.035-e.age*12+n)*7*fade;if(x===left)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
      }else if(e.shape==='line'){
        ctx.translate(e.x,e.y);ctx.rotate(e.angle);const w=e.r*2;
        const g=ctx.createLinearGradient(0,-w,0,w);g.addColorStop(0,rgba(color,0));g.addColorStop(.5,rgba(color,fade*.65));g.addColorStop(1,rgba(color,0));ctx.fillStyle=g;ctx.fillRect(-e.length,-e.r,e.length*2,e.r*2);
        ctx.beginPath();ctx.moveTo(-e.length,0);ctx.lineTo(e.length,0);ctx.stroke();
      }else{
        const r=e.r||80;ctx.beginPath();ctx.arc(e.x,e.y,r*(.6+p*.4),0,Math.PI*2);ctx.stroke();Motion.rune(e.x,e.y,r,fade*.65,color,p*.3);
      }ctx.restore();
    }
    // Visible chains explain the monitor's actual damage reduction.
    const boss=G.boss;
    if(boss&&boss.hp>0&&boss.action==='exposed'){
      const pulse=.55+Math.sin(G.time*9)*.15;
      Motion.rune(boss.x,boss.y,boss.r+26,pulse,'#b7f3d5',-G.time*.5);
      ctx.save();ctx.fillStyle='#d2ffe0';ctx.font='bold 13px KaiTi,serif';ctx.textAlign='center';ctx.fillText('破 绽',boss.x,boss.y-boss.r-140);ctx.restore();
    }
    if(boss&&boss.hp>0&&Journey.run.stage===0)for(const s of G.enemies.filter(e=>e.seal&&e.hp>0)){
      ctx.save();ctx.strokeStyle='#ead48c99';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(boss.x,boss.y-65);ctx.quadraticCurveTo((boss.x+s.x)/2,(boss.y+s.y)/2+30,s.x,s.y-18);ctx.stroke();ctx.restore();
    }
    if(boss&&boss.hp>0&&Journey.run.stage===1)for(const s of G.enemies.filter(e=>e.clerk&&e.hp>0)){
      ctx.save();ctx.strokeStyle='#f2798388';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y-40);ctx.quadraticCurveTo(boss.x,s.y-90,boss.x,boss.y-60);ctx.stroke();ctx.restore();
    }
  }
  function drawOver(){
    for(const e of effects){
      if(e.kind==='summon')continue;
      const p=e.age/e.duration,fade=1-p,color=family(e.theme).color;
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(color,fade*.8);ctx.fillStyle=rgba(color,fade*.25);ctx.lineWidth=2;
      if(e.theme===0){
        const rise=p*55,r=e.r||65;Motion.glow(e.x,e.y-40,r,color,fade*.15);
        ctx.save();ctx.translate(e.x,e.y-rise-20);ctx.scale(1,Math.max(.2,fade));
        ctx.beginPath();ctx.moveTo(-r*.38,0);ctx.bezierCurveTo(-r*.4,-r*.9,r*.4,-r*.9,r*.38,0);ctx.lineTo(r*.5,12);ctx.lineTo(-r*.5,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,-r*.7,7,Math.PI,0);ctx.stroke();ctx.restore();
        for(let i=0;i<8;i++){const a=i*Math.PI/4+p*.3;ctx.save();ctx.translate(e.x+Math.cos(a)*r*.8,e.y+Math.sin(a)*r*.6-rise);ctx.fillStyle=rgba(color,fade);ctx.font='15px KaiTi,serif';ctx.fillText(['戒','律','缄','言'][i%4],-7,0);ctx.restore();}
      }else if(e.theme===1){
        const angle=e.angle??-.7;ctx.translate(e.x,e.y-20);ctx.rotate(angle);const length=e.length||e.r||90;
        for(let i=0;i<3;i++){ctx.lineWidth=(3-i)*4*fade;ctx.strokeStyle=rgba(i?'#ffccac':color,fade*(.8-i*.2));ctx.beginPath();ctx.moveTo(-length,-25+i*9);ctx.bezierCurveTo(-length*.3,-100*p,length*.3,80*p,length,15-i*9);ctx.stroke();}
        for(let i=0;i<8;i++){const x=(i/7-.5)*length*1.8,y=Math.sin(i*8+p*4)*45;ctx.save();ctx.translate(x,y-p*35);ctx.rotate(i+p*3);ctx.fillStyle=rgba('#e1b38c',fade*.8);ctx.fillRect(-5,-10,10,20);ctx.fillStyle=rgba('#9c3438',fade);ctx.fillRect(-2,-7,4,12);ctx.restore();}
      }else{
        const r=e.r||70;
        if(e.shape==='tide'){
          for(const [l,h] of [[e.left??0,e.gap-e.safe/2],[e.gap+e.safe/2,e.right??W]])for(let x=l+12;x<h;x+=42){const height=45*fade+Math.sin(x*.05+p*6)*14;ctx.beginPath();ctx.moveTo(x-22,e.y+e.r);ctx.quadraticCurveTo(x-18,e.y-height*2,x+12,e.y-height);ctx.quadraticCurveTo(x+2,e.y-height*.4,x+24,e.y+e.r);ctx.stroke();}
        }else{
          for(let i=0;i<10;i++){const a=i*Math.PI/5+p*2,x=e.x+Math.cos(a)*r*.7,y=e.y+Math.sin(a)*r*.55;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a)*25,y-100*fade,x+Math.cos(a)*35,y-60*fade);ctx.stroke();}
          ctx.beginPath();ctx.ellipse(e.x,e.y-40-p*35,22,32,0,0,Math.PI*2);ctx.stroke();Motion.glow(e.x,e.y-40-p*35,55,color,fade*.25);
        }
      }ctx.restore();
    }
  }
  function reset(){effects.length=0;}
  function resize(sx,sy){for(const e of effects){e.x*=sx;e.y*=sy;if(e.shape==='tide'){e.gap*=sx;e.safe*=sx;}}}
  return {families,family,unit,attackMob,projectile,effect,impact,update,drawActor,drawShot,ornament,drawGround,drawOver,reset,resize,status:()=>({loaded:sheets.map(i=>!!(i.complete&&i.naturalWidth)),attacks:attackSheets.map(i=>!!(i.complete&&i.naturalWidth)),effects:effects.length})};
})();
