/* Geometry is authored once and shared by the final guardians' warnings and hit tests. */
const FinaleGeometry=(()=>{
 const turn=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
 const polygon=vertices=>({type:'polygon',vertices});
 function ellipse(x,y,rx,ry=rx,angle=0){return polygon(Array.from({length:64},(_,i)=>{const p=turn({x:Math.cos(i*Math.PI/32)*rx,y:Math.sin(i*Math.PI/32)*ry},angle);return {x:x+p.x,y:y+p.y};}));}
 function regular(x,y,r,n,angle=-Math.PI/2){return polygon(Array.from({length:n},(_,i)=>({x:x+Math.cos(angle+i*Math.PI*2/n)*r,y:y+Math.sin(angle+i*Math.PI*2/n)*r})));}
 const transform=(vertices,x,y,angle=0)=>polygon(vertices.map(([u,v])=>{const p=turn({x:u,y:v},angle);return {x:x+p.x,y:y+p.y};}));
 const rectangle=(x,y,l,w,angle=0)=>transform([[-l,-w],[l,-w],[l,w],[-l,w]],x,y,angle);
 const sector=(x,y,inner,outer,angle,half)=>({type:'sector',x,y,inner,outer,angle,half});
 const union=items=>({type:'union',items}),intersection=items=>({type:'intersection',items}),corridor=(path,width=90)=>({type:'corridor',path,width});
 function segment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,k=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy);}
 function inside(g,p){const r=p.r||0;if(g.type==='union')return g.items.some(v=>inside(v,p));if(g.type==='intersection')return g.items.every(v=>inside(v,p));if(g.type==='corridor')return g.path.slice(1).some((b,i)=>segment(p,g.path[i],b)<g.width-r);
  if(g.type==='sector'){const d=Math.hypot(p.x-g.x,p.y-g.y),a=Math.atan2(Math.sin(Math.atan2(p.y-g.y,p.x-g.x)-g.angle),Math.cos(Math.atan2(p.y-g.y,p.x-g.x)-g.angle));return d>g.inner+r&&d<g.outer-r&&(g.half>=Math.PI||Math.abs(a)<g.half-Math.asin(Math.min(1,r/Math.max(1,d))));}
  let area=0;const v=g.vertices;for(let i=0;i<v.length;i++){const a=v[i],b=v[(i+1)%v.length];area+=a.x*b.y-b.x*a.y;}const sign=area>=0?1:-1;return v.every((a,i)=>{const b=v[(i+1)%v.length],dx=b.x-a.x,dy=b.y-a.y;return sign*(dx*(p.y-a.y)-dy*(p.x-a.x))>r*Math.hypot(dx,dy);});
 }
 function path(pen,g){pen.beginPath();if(g.type==='polygon'){g.vertices.forEach((p,i)=>i?pen.lineTo(p.x,p.y):pen.moveTo(p.x,p.y));pen.closePath();}else if(g.type==='sector'){pen.arc(g.x,g.y,g.outer,g.angle-g.half,g.angle+g.half);pen.lineTo(g.x+Math.cos(g.angle+g.half)*g.inner,g.y+Math.sin(g.angle+g.half)*g.inner);pen.arc(g.x,g.y,g.inner,g.angle+g.half,g.angle-g.half,true);pen.closePath();}}
 function draw(pen,g){if(g.type==='union'){g.items.forEach(v=>draw(pen,v));return;}if(g.type==='intersection'){pen.save();for(const v of g.items){path(pen,v);pen.clip();}const v=g.items[0].vertices,minX=Math.min(...v.map(p=>p.x)),minY=Math.min(...v.map(p=>p.y));pen.fillRect(minX,minY,Math.max(...v.map(p=>p.x))-minX,Math.max(...v.map(p=>p.y))-minY);g.items.forEach(v=>{path(pen,v);pen.stroke();});pen.restore();return;}
  if(g.type==='corridor'){pen.save();pen.beginPath();g.path.forEach((p,i)=>i?pen.lineTo(p.x,p.y):pen.moveTo(p.x,p.y));pen.lineJoin=pen.lineCap='round';pen.lineWidth=g.width*2;pen.stroke();pen.strokeStyle=pen.fillStyle;pen.lineWidth=g.width*2-8;pen.stroke();pen.restore();return;}path(pen,g);pen.fill();pen.stroke();}
 return {polygon,ellipse,regular,transform,rectangle,sector,union,intersection,corridor,inside,draw};
})();

const FinaleGuardians=(()=>{
 const alive=e=>e&&e.hp>0&&!e.killed,point=(x,y)=>World.clipToArena({x,y},90),geo=FinaleGeometry;
 const inArena=p=>{const a=World.arena();return Math.hypot((p.x-a.cx)/a.rx,(p.y-a.cy)/a.ry)<=1;};
 const safe=(t,p)=>geo.inside(t.region,p),safePoint=t=>t.target;
 const wardHit=(t,p)=>inArena(p)&&Math.hypot(p.x-t.x,p.y-t.y)<t.zoneRadius+(p.r||0)&&!safe(t,p);
 const kinds=['reflection','antidote','confluence','ashcorridor','returnpearl','ninegrid','scriptpath','openmercy','silktracks','bonehex','ivoryspokes','lifebalance','namewells','crownsteps','raindrops','weaponfold','triplestamp','lastcontract'];
 function state(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=duration;e.attack=['windup','strike'].includes(name)?duration:0;}
 function clear(e){G.telegraphs=G.telegraphs.filter(t=>t.bossOwner!==e.id);G.eshots=G.eshots.filter(t=>t.bossOwner!==e.id);e.brain.pending=null;}
 function init(e){e.brain={round:1,breaks:0,attackIndex:0,token:0,pending:null,windowDamage:0,duelFailures:0};e.phase=1;state(e,'guard',1.6);}
 function hazard(e,p,o){const pending=e.brain.pending,life=Math.max(.65,o.life*Journey.difficulty().warning);Journey.hazard(p.x,p.y,{...o,life,total:life,boss:true,bossOwner:e.id,bossToken:pending.token,theme:Journey.run.stage%3,chapterTheme:Journey.run.stage,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1}});pending.expected++;pending.last=Math.max(pending.last,life);}
 function geometry(local,beat,a,phase=1){const x=a.cx,y=a.cy,at=(dx,dy)=>point(x+dx,y+dy),circle=(q,r)=>geo.ellipse(q.x,q.y,r),q=at(0,0),out=(region,target,label)=>({region,target,label});
  const triple=q=>geo.intersection(Array.from({length:3},(_,i)=>circle({x:q.x+Math.cos(i*Math.PI*2/3)*90,y:q.y+Math.sin(i*Math.PI*2/3)*90},215)));
  const spokes=angle=>geo.union(Array.from({length:6},(_,i)=>geo.sector(x,y,145,370,angle+i*Math.PI/3,.27)));
  if(local===17){if(phase===1)return geometry(0,beat,a);if(phase===2){if(beat===2)return out(geo.regular(x,y,180,6),q,'断衡归中 · 六角印心');const angle=beat*Math.PI/6;return out(spokes(angle),at(Math.cos(angle)*260,Math.sin(angle)*260),'断衡六辐 · 跟随转隙');}const t=at([-220,220,0][beat],0);return out(triple(t),t,'归名三印 · '+['左交心','右交心','中央交心'][beat]);}
  if(local===0){if(beat===2)return out(geo.ellipse(x,y,210,125),q,'返照合镜 · 中央扁圆');const angle=beat*Math.PI;return out(geo.sector(x,y,170,350,angle,.78),at(Math.cos(angle)*260,0),beat?'返照左弧 · 弯月中段':'返照右弧 · 弯月中段');}
  if(local===1){const angle=[-Math.PI/4,Math.PI/4,Math.PI/2][beat];return out(geo.sector(x,y,110,350,angle,.50),at(Math.cos(angle)*230,Math.sin(angle)*230),'还言解毒 · 第'+(beat+1)+'片扇面');}
  if(local===2){if(beat===2)return out(geo.intersection([circle(at(-75,0),200),circle(at(75,0),200)]),q,'双泉合流 · 两泉交集');const t=at(beat?230:-230,0);return out(geo.ellipse(t.x,t.y,200,115),t,beat?'右泉自择 · 横泉内部':'左泉自择 · 横泉内部');}
  if(local===3){const t=at(beat===2?0:beat?220:-220,0);return out(geo.rectangle(t.x,t.y,430,100,beat===2?0:Math.PI/2),t,['左纵冷廊','右纵冷廊','中央横冷廊'][beat]);}
  if(local===4){if(beat===2)return out(geo.regular(x,y,220,3,Math.PI/2),q,'还珠归心 · 倒三角印');const t=at(beat?230:-230,70*(beat?-1:1));return out(circle(t,155),t,beat?'还珠右坛':'还珠左坛');}
  if(local===5){const cells=beat===2?[4]:beat?[1,3,5,7]:[0,2,4,6,8],center=i=>at((i%3-1)*190,(Math.floor(i/3)-1)*190),t=center(beat===1?1:4);return out(geo.union(cells.map(i=>{const p=center(i);return geo.rectangle(p.x,p.y,77,77);})),t,['九宫五印 · 只站亮格','九宫四印 · 换入亮格','九宫归账 · 中央一格'][beat]);}
  if(local===6){if(beat===2)return out(geo.rectangle(x,y,170,170),q,'解字归义 · 中央方印');const sign=beat?-1:1,path=[[-320,160],[-100,160],[-100,-160],[270,-160]].map(([u,v])=>at(u*sign,v*sign));return out(geo.corridor(path,95),path[1],beat?'反向字脉 · 青色折线':'前文字脉 · 青色折线');}
  if(local===7){if(beat===2)return out(circle(q,170),q,'解钵归心 · 中央圈');const angle=beat*Math.PI;return out(geo.sector(x,y,180,350,angle,2.35),at(Math.cos(angle)*260,0),beat?'左侧慈环 · 避开缺口':'右侧慈环 · 避开缺口');}
  if(local===8){if(beat===2)return out(circle(q,145),q,'双向解结 · 中央圈');const angle=beat?-Math.PI/4:Math.PI/4,offset=beat?-220:220,t=at(-Math.sin(angle)*offset,Math.cos(angle)*offset);return out(geo.union([-220,0,220].map(v=>geo.rectangle(x-Math.sin(angle)*v,y+Math.cos(angle)*v,420,68,angle))),t,beat?'反斜丝轨 · 青色轨内':'斜向丝轨 · 青色轨内');}
  if(local===9){if(beat===2)return out(geo.regular(x,y,175,6),q,'还城归中 · 六角印');const cells=beat?[1,3,5]:[0,2,4],center=i=>at(Math.cos(i*Math.PI/3)*270,Math.sin(i*Math.PI/3)*270),t=center(beat?3:0);return out(geo.union(cells.map(i=>{const p=center(i);return geo.regular(p.x,p.y,115,6);})),t,beat?'第二组骨印 · 只进青印':'第一组骨印 · 只进青印');}
  if(local===10){const angle=beat*Math.PI/6;return out(spokes(angle),at(Math.cos(angle)*260,Math.sin(angle)*260),'六牙轮隙 · 第'+(beat+1)+'拍');}
  if(local===11){const rx=beat===0?350:beat===1?110:180,ry=beat===0?110:beat===1?350:180;const vertices=Array.from({length:64},(_,i)=>{const c=Math.cos(i*Math.PI/32),s=Math.sin(i*Math.PI/32);return {x:x+Math.sign(c)*Math.sqrt(Math.abs(c))*rx,y:y+Math.sign(s)*Math.sqrt(Math.abs(s))*ry};});return out(geo.polygon(vertices),at(beat===0?-220:0,beat===1?-220:0),['横向还年台 · 左端','纵向还年台 · 上端','寿秤归衡 · 中央方台'][beat]);}
  if(local===12){const t=at([-180,180,0][beat],beat===2?-70:0),target={x:t.x,y:t.y+(beat===1?-220:220)};return out(geo.sector(t.x,t.y,150,300,0,Math.PI),target,'移井留名 · '+['左环带','右环带','归名环带'][beat]);}
  if(local===13){if(beat===2)return out(geo.regular(x,y,195,4),q,'无冕直立 · 中央菱印');const t=at(beat?190:-190,0);return out(geo.transform([[-260,-180],[260,-180],[140,180],[-140,180]],t.x,t.y,beat*Math.PI),t,beat?'断冠倒梯台 · 斜边以内':'断冠正梯台 · 斜边以内');}
  if(local===14){const t=at([-230,230,0][beat],0),angle=beat===2?Math.PI:0;return out(geo.transform([[0,-185],[112,-40],[135,65],[75,150],[0,175],[-75,150],[-135,65],[-112,-40]],t.x,t.y,angle),at(t.x-x,t.y-y+(beat===2?-35:35)),'开雨三滴 · '+['左滴','右滴','中央倒滴'][beat]);}
  if(local===15){if(beat===2)return out(geo.regular(x,y,180,6),q,'归兵入印 · 中央六角');const sign=beat?-1:1,path=[[-310,170],[0,-130],[310,170]].map(([u,v])=>at(u,v*sign));return out(geo.corridor(path,95),path[1],beat?'反折归兵 · 沿青线':'正折归兵 · 沿青线');}
  const t=at([-220,220,0][beat],0);return out(triple(t),t,'三印互证 · '+['左交心','右交心','中央交心'][beat]);
 }
 function ritual(e,local,a){for(let beat=0;beat<3;beat++){const g=geometry(local,beat,a,e.phase);hazard(e,{x:a.cx,y:a.cy},{...g,shape:'finale',zoneRadius:1100,r:180,dmg:70+Math.floor(local/3)*3,life:4.6+beat*4.8,bossSkill:'finale-'+kinds[local],beat});}}
 function assault(e,local,a,angle,origin){
  const line=(offset,life=1.65,r=35,length=650,p=e)=>hazard(e,p,{shape:'line',angle:angle+offset,length,r,dmg:66+Math.floor(local/3)*2,life,label:Journey.stage().bossGlyph+'势锁向 · 从红线间隙穿过',bossSkill:'finale-assault-'+local});
  const blast=(p,r,life)=>hazard(e,p,{r,dmg:69,life,label:Journey.stage().bossGlyph+'印落地 · 离开已锁定位置',bossSkill:'finale-assault-'+local});
  const ring=(p,r,life,width=40)=>hazard(e,p,{shape:'annulus',r,width,dmg:70,life,label:Journey.stage().bossGlyph+'环扩散 · 避开环带',bossSkill:'finale-assault-'+local});
  if(local===0){line(-.5,1.6);line(.5,2.3);}
  else if(local===1){for(let i=0;i<3;i++)blast(point(origin.x+(i-1)*185,origin.y+(i%2)*100),105,1.6+i*.7);}
  else if(local===2){ring(e,240,1.7);ring(e,410,2.9);}
  else if(local===3){line(0,1.7,45);line(Math.PI/2,2.7,45);}
  else if(local===4){for(let i=0;i<3;i++)blast(point(a.cx+Math.cos(i*Math.PI*2/3)*260,a.cy+Math.sin(i*Math.PI*2/3)*220),125,1.7+i*.6);}
  else if(local===5){for(let i=-4;i<=4;i++)line(i*.5,1.85+(i+4)%3*.8,23,620);}
  else if(local===6){line(-.55,1.6,30);line(.15,2.2,30);line(.85,2.8,30);}
  else if(local===7){ring(e,310,1.8,43);ring(e,150,3.0,35);}
  else if(local===8){for(let i=-1;i<=1;i++)line(i*Math.PI/3,1.8+Math.abs(i)*.65,28,720);}
  else if(local===9){blast(point(origin.x-150,origin.y),120,1.65);blast(point(origin.x+150,origin.y),120,2.35);blast(origin,100,3.1);}
  else if(local===10){for(let i=0;i<6;i++)line(i*Math.PI/3,1.9,26,690);}
  else if(local===11){line(Math.PI/2,1.7,48);line(0,2.65,48);}
  else if(local===12){ring(origin,210,1.9);ring(origin,370,3.1);}
  else if(local===13){for(let i=-1;i<=1;i++)line(i*.72,1.8+Math.abs(i)*.6,31);}
  else if(local===14){for(let i=0;i<4;i++)blast(point(origin.x+Math.cos(i*Math.PI/2)*175,origin.y+Math.sin(i*Math.PI/2)*175),100,1.7+(i%2)*1.1);}
  else if(local===15){for(const side of [-1,1])line(0,1.8,40,620,point(e.x-Math.sin(angle)*side*160,e.y+Math.cos(angle)*side*160));line(Math.PI/2,3.1,33);}
  else if(local===16){for(let i=0;i<3;i++)blast(point(origin.x+Math.cos(i*Math.PI*2/3)*150,origin.y+Math.sin(i*Math.PI*2/3)*150),105,1.8+i*.6);}
  else if(e.phase===1){line(-.65,1.8);line(.65,2.6);ring(e,350,3.4);}
  else if(e.phase===2){for(let i=0;i<6;i++)line(i*Math.PI/3,1.9,25);ring(origin,250,3.3);}
  else{blast(origin,130,1.9);line(-.7,2.75,33);line(.7,3.45,33);ring(e,390,4.3);}
  if(e.phase>=2&&local!==17)blast(origin,140,3.9);
 }
 function prepare(e,mechanism){const b=e.brain,local=Journey.run.stage-24,a=World.arena(),angle=Math.atan2(P.y-e.y,P.x-e.x),origin=point(P.x,P.y);e.attackAngle=angle;e.look=Math.cos(angle)<0?-1:1;b.pending={token:++b.token,kind:mechanism?kinds[local]:'assault',mechanism,phase:e.phase,expected:0,impacts:0,passed:true,last:0};b.mechanismReady=mechanism;
  if(mechanism)ritual(e,local,a);else assault(e,local,a,angle,origin);state(e,'windup',Math.min(...G.telegraphs.filter(t=>t.bossOwner===e.id&&t.bossToken===b.pending.token).map(t=>t.life)));if(mechanism)Sound.omen(Journey.run.stage);
 }
 function finish(e){const b=e.brain,p=b.pending;if(p?.mechanism&&p.impacts===p.expected&&p.passed){clear(e);b.breaks++;b.windowDamage=0;state(e,'exposed',Bosses.profiles[Journey.run.difficulty].window);Sound.weakness(Journey.run.stage);addText(e.x,e.y-155,Journey.stage().bossGlyph+'印已解 · 伤害3倍',Journey.stage().color,20);Motion.emit('blast',e.x,e.y,{r:205,duration:1,color:Journey.stage().color});return;}if(p?.mechanism){b.duelFailures++;addText(e.x,e.y-155,'破招未成 · 仍可持续攻击','#dec6ab',16);}b.pending=null;b.mechanismReady=false;state(e,'guard',e.phase>=2?.95:1.3);}
 function update(e,dt){if(!e.brain)init(e);if(!alive(e))return;const local=Journey.run.stage-24,b=e.brain,next=local===17?(e.hp<=e.maxHp/3?3:e.hp<=e.maxHp*2/3?2:1):e.hp<=e.maxHp*.5?2:1;
  if(next>e.phase){e.phase=next;Sound.guardian(Journey.run.stage,true);addText(e.x,e.y-165,local===17?['','照面相','断衡相','归名相'][e.phase]+' · 终契显形':Journey.stage().boss+' · 怒相',Journey.stage().color,22);Motion.emit('blast',e.x,e.y,{r:250,duration:1.2,color:Journey.stage().color});}e.actionT+=dt;
  if(e.action==='exposed'){if(e.actionT>=e.actionDuration){b.round++;clear(e);b.mechanismReady=false;state(e,'guard',1.25);}return;}
  if(e.action==='guard'){const d=Math.hypot(P.x-e.x,P.y-e.y);if(d>310){const v=World.steer(e,P.x,P.y);e.x+=v.x*e.speed*dt;e.y+=v.y*e.speed*dt;World.resolve(e);e.moving=true;}else e.moving=false;if(e.actionT>=e.actionDuration){e.moving=false;b.attackIndex++;prepare(e,b.attackIndex%3===0);}}
  else if(e.action==='windup'&&e.actionT>=e.actionDuration)state(e,'strike',Math.max(.4,b.pending.last-e.actionDuration+.2));else if(e.action==='strike'&&e.actionT>=e.actionDuration)state(e,'recover',1);else if(e.action==='recover'&&e.actionT>=e.actionDuration)finish(e);
 }
 function onImpact(t,hit){const e=G.boss,p=e?.brain?.pending;if(!alive(e)||!p||t.bossOwner!==e.id||t.bossToken!==p.token)return;p.impacts++;p.passed=p.passed&&!hit;if(t.shape==='finale')p.passed=p.passed&&inArena(P)&&safe(t,P)&&Math.hypot(P.x-t.x,P.y-t.y)<t.zoneRadius;}
 function hud(e){const b=e?.brain;if(!b)return {title:'全程可攻击',hint:Journey.stage().tell,progress:0};const exposed=e.action==='exposed',p=b.pending,remaining=Math.max(0,e.actionDuration-e.actionT),phase=Journey.run.stage===41?' · '+['','照面相','断衡相','归名相'][p?.phase||e.phase]:'';return {title:exposed?'破绽 · 伤害3倍 · '+remaining.toFixed(1)+'秒':p?.mechanism?Journey.stage().mechanic+phase:'可持续攻击 · 避开锁向与延迟招式'+phase,hint:Journey.stage().bonusTell,progress:exposed?remaining/e.actionDuration:p?.mechanism?p.impacts/p.expected:0,helpers:0,exposed,remaining:exposed?remaining:0,breaks:b.breaks,round:b.round,action:e.action};}
 return {init,update,onImpact,onHelperKilled(){},filterDamage:(e,d)=>e.locked?0:d,hud,wardHit,safe,safePoint,inArena,geometry,kinds};
})();

const FinaleArt=(()=>{
 const sheets=FinaleChapters.map(c=>{const im=new Image();im.src='assets/actors-'+c.id+'.webp';return im;}),props=['zhenxian','xuanxian','jinxian','taiyi','daluo','xianwang'].map(name=>{const im=new Image();im.src='assets/'+name+'-props.webp';return im;});let uv=null,propUV=null;
 function configure(actors,objects){uv=actors;propUV=objects;}
 function drawActor(e,row,size){const i=(e.family??Journey.run.stage)-24,im=sheets[i];if(!im?.complete||!im.naturalWidth||!uv)return false;const col=e.action==='windup'?2:e.action==='strike'?3:e.moving?Math.floor((e.walkDistance||0)/30)%2:0,[x,y,w,h,px,py]=uv[i][row][col],scale=size/uv[i][row][0][3];if(row===4&&i===17){ctx.save();ctx.strokeStyle=FinaleChapters[i].color;ctx.globalAlpha=.23;ctx.lineWidth=2;for(let n=0;n<(e.phase||1);n++){ctx.beginPath();ctx.ellipse(0,-size*.5,size*(.65+n*.1),size*(.28+n*.08),n*Math.PI/3,0,Math.PI*2);ctx.stroke();}ctx.restore();}ctx.drawImage(im,x,y,w,h,(x-px)*scale,(y-py)*scale,w*scale,h*scale);return true;}
 function drawProp(pen,o,stage){const i=stage-24,g=Math.floor(i/3),col={gate:0,tree:1,rock:1,lantern:2,shrine:3}[o.kind],im=props[g];if(col===undefined||!im?.complete||!im.naturalWidth||!propUV)return false;const [x,y,w,h]=propUV[g][i%3][col],size=o.size||{gate:350,tree:300,rock:155,lantern:120,shrine:215}[o.kind],s=size/Math.max(w,h);pen.drawImage(im,x,y,w,h,-w*s/2,-h*s,w*s,h*s);return true;}
 function drawShot(s){const i=(s.theme-24)%6;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.fillStyle=s.color;ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.beginPath();if(i===0){ctx.ellipse(0,0,13,6,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(18,0);ctx.stroke();}else if(i===1){ctx.moveTo(-15,7);ctx.quadraticCurveTo(7,9,12,-5);ctx.lineTo(20,0);ctx.stroke();}else if(i===2){ctx.moveTo(17,0);ctx.lineTo(0,-7);ctx.lineTo(-16,0);ctx.lineTo(0,7);ctx.closePath();ctx.fill();}else if(i===3){ctx.rect(-12,-5,24,10);ctx.stroke();ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.stroke();}else if(i===4){for(let n=0;n<3;n++){ctx.moveTo(-15,n*5-5);ctx.lineTo(16,0);}ctx.stroke();}else{ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(4,0,5,0,Math.PI*2);ctx.fill();}ctx.restore();}
 function drawWard(t){if(G.telegraphs.some(q=>q.shape==='finale'&&q.life<t.life))return;ctx.save();ctx.fillStyle='#b9434920';ctx.strokeStyle='#df958b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.zoneRadius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#5fdcb34b';ctx.strokeStyle='#b5ffdb';ctx.lineWidth=4;FinaleGeometry.draw(ctx,t.region);const q=t.target;ctx.fillStyle=ctx.strokeStyle='#ffdf96';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,20,0,Math.PI*2);ctx.stroke();ctx.font='21px KaiTi';ctx.textAlign='center';ctx.fillText(Journey.stage().bossGlyph,q.x,q.y+7);
  if(!FinaleGuardians.safe(t,P)){const a=Math.atan2(q.y-P.y,q.x-P.x);ctx.save();ctx.translate(P.x+Math.cos(a)*80,P.y+Math.sin(a)*80);ctx.rotate(a);ctx.fillStyle='#b4ffe0';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-8);ctx.lineTo(-3,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.restore();}const label=t.label+' · '+Math.max(0,t.life).toFixed(1)+'秒';ctx.font='bold 16px KaiTi';ctx.strokeStyle='#08151c';ctx.lineWidth=5;ctx.strokeText(label,P.x,P.y-145);ctx.fillStyle='#f5e6cb';ctx.fillText(label,P.x,P.y-145);ctx.restore();}
 function drawEffect(e,p,fade){ctx.save();ctx.globalAlpha=fade*.6;ctx.strokeStyle=Journey.stages[e.chapterTheme].color;ctx.lineWidth=3;ctx.translate(e.x,e.y);ctx.rotate(p*.3);const i=e.chapterTheme-24,r=Math.min(220,e.r||110)*(1+p*.4),n=3+Math.floor(i/3);for(let k=0;k<n;k++){const a=k*Math.PI*2/n;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.4,Math.sin(a)*r*.4);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}ctx.beginPath();ctx.ellipse(0,0,r,r*.65,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 return {configure,drawActor,drawProp,drawShot,drawWard,drawEffect,loaded:()=>!!uv&&!!propUV&&sheets.every(s=>s.complete&&s.naturalWidth)&&props.every(s=>s.complete&&s.naturalWidth)};
})();
FinaleChapters.forEach((c,i)=>{const s=i+24;for(const [id,who,text] of [['stage','说书人',c.story[0]],['boss',c.boss,c.bossLine],['phase',c.boss,c.phaseLine],['omen','剑仙',c.omen],['weakness','剑仙',c.weakness],['victory','说书人',c.reveal]])Sound.registerCaption(id+'-'+s,who,text);});
