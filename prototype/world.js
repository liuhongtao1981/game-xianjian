/* A persistent world in world units; resizing a viewport never moves its inhabitants. */
const World=(()=>{
  let width=6400,height=4600;const cam={x:0,y:0,zoom:1};
  const data=()=>WorldNavData[Journey.run.stage];
  const point=p=>({x:p.x*width,y:p.y*height});
  const land=WorldNavData.map(d=>d.polygons.map(poly=>{
    const vertices=poly.map(([x,y])=>[x*d.width,y*d.height]);
    return {vertices,left:Math.min(...vertices.map(p=>p[0])),right:Math.max(...vertices.map(p=>p[0])),top:Math.min(...vertices.map(p=>p[1])),bottom:Math.max(...vertices.map(p=>p[1]))};
  }));
  let combat;
  const images=ChapterCatalog.released().map(()=>new Image());
  function terrain(){const c=ChapterCatalog.get(Journey.run.stage),image=images[c.index];if(!image.src)image.src=c.realm===7?'assets/dujie-worlds.webp':c.realm===6?'assets/dacheng-worlds.webp':c.realm===5?'assets/heti-worlds.webp':c.realm===4?'assets/lianxu-worlds.webp':c.realm===3?'assets/huashen-worlds.webp':c.realm===2?'assets/infant-worlds.webp':'assets/world-'+c.id+(c.realm?'.jpg':'-v3.jpg');return image;}
  const titles=[['入山旧道','焚卷碑林','断钟外庭','封口禅坛'],['陈府后巷','血书偏院','废印长廊','司命刑庭'],['旧渡石径','沉灯浅湾','缚舟栈道','河伯祭台']];
  let sites=[],active=false,mapOpen=false,near=null,visited=0,nav=null;
  let guide='camp',guideTarget=null,guideHeading=null,guideUntil=0;
  function setGuide(mode){if(!['camp','elite','rest','boss','off'].includes(mode))return false;guide=mode;routeCache=null;guideTarget=null;guideHeading=null;guideUntil=0;return true;}
  let routeCache=null;
  function markers(){
    const camp=EncounterDirector.status().camps.filter(c=>c.state!=='unseen').map(c=>({...c,key:'camp:'+c.id,name:c.title+' '+(c.id+1),detail:c.state==='cleared'?'已清理 · 本次挑战不再刷新':c.detail+' · 第'+c.wave+'/3波 · 剩余'+c.remaining}));
    return [...camp,...sites.filter(s=>!s.done&&s.discovered).map(s=>({...s,key:'site:'+s.id,unlocked:s.kind==='station'&&stationUnlocked(s),detail:s.kind==='station'?(stationUnlocked(s)?'已点亮 · 靠近后按 E，在安全状态下传送':'清理周围营地后点亮'):s.kind==='boss'?'可自由入坛 · 大妖全程可受伤，破招获得增伤':s.kind==='rest'?'补给 · 恢复45%生命，剑意 +35':s.kind==='chest'?'宝箱 · 术法、法宝或恢复奖励':'证词 · 收录劫痕，参悟灵蕴 +35'}))];
  }
  function guideTo(key){if(!markers().some(m=>m.key===key))return false;guide='selected';guideTarget=key;guideHeading=null;guideUntil=0;routeCache=null;return true;}
  function mapLayout(){const scale=Math.min((W-48)/width,(H-260)/height),w=width*scale,h=height*scale;return {x:(W-w)/2,y:65+Math.max(0,(H-260-h)/2),w,h};}
  function selectMap(x,y){if(G.state!=='map')return false;const box=mapLayout(),found=markers().map(m=>({m,d:Math.hypot(box.x+m.x/width*box.w-x,box.y+m.y/height*box.h-y)})).filter(p=>p.d<22).sort((a,b)=>a.d-b.d)[0];if(!found)return false;ExperienceUI.mapDetail(found.m);return true;}
  function route(){
    const goal=guidance();if(!goal)return [];
    if(routeCache&&routeCache.key===goal.key&&Math.hypot(P.x-routeCache.x,P.y-routeCache.y)<90)return routeCache.points;
    const start={x:P.x,y:P.y},points=[start];
    if(lineClear(start.x,start.y,goal.x,goal.y,23))points.push({x:goal.x,y:goal.y});
    else{
      steer({...start,r:23},goal.x,goal.y);
      if(nav){const cell=64,cols=Math.ceil(width/cell);let first=-1,score=Infinity;
        for(let i=0;i<nav.walk.length;i++){if(!nav.walk[i]||nav.dist[i]<0)continue;const x=i%cols*cell,y=Math.floor(i/cols)*cell,d=Math.hypot(x-start.x,y-start.y);if(d<240&&nav.dist[i]*cell+d<score&&lineClear(start.x,start.y,x,y,23)){score=nav.dist[i]*cell+d;first=i;}}
        let node=first;for(let step=0;node>=0&&step<400;step++){const point={x:node%cols*cell,y:Math.floor(node/cols)*cell};points.push(point);if(nav.dist[node]===0){if(lineClear(point.x,point.y,goal.x,goal.y,23))points.push({x:goal.x,y:goal.y});break;}node=nav.neighbors[node].filter(n=>nav.dist[n]>=0&&nav.dist[n]<nav.dist[node]).sort((a,b)=>nav.dist[a]-nav.dist[b])[0]??-1;}
      }
    }
    const unique=points.filter((p,i)=>!i||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)>.01);
    routeCache={key:goal.key,x:P.x,y:P.y,points:unique};return unique;
  }
  function guidance(){
    if(active||guide==='off')return null;
    const camps=EncounterDirector.status().camps;
    const choices=guide==='selected'?markers().filter(m=>m.key===guideTarget):guide==='camp'||guide==='elite'?camps.filter(c=>c.state!=='cleared'&&(guide!=='elite'||c.kind!=='camp')).map(c=>({...c,key:'camp:'+c.id,name:(c.kind==='camp'?'妖众营地':'精英挑战')+' '+(c.id+1)})):sites.filter(s=>!s.done&&s.kind===(guide==='rest'?'rest':'boss')).map(s=>({...s,key:'site:'+s.id}));
    if(!choices.length){guideTarget=null;return null;}
    const target=choices.find(c=>c.key===guideTarget)||choices.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
    guideTarget=target.key;return {...target,distance:Math.hypot(target.x-P.x,target.y-P.y)};
  }
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function bounds(){return {x:0,y:0,w:width,h:height};}
  function arena(){const a=data().bossArena,c=point(a),rx=a.rx*width,ry=a.ry*height;return {x:c.x-rx,y:c.y-ry,w:rx*2,h:ry*2,cx:c.x,cy:c.y,rx,ry};}
  function bossPoint(){return point(data().boss);}
  function spawn(){return {x:data().spawn.x*data().width,y:data().spawn.y*data().height};}
  function clipToArena(p,pad=15){
    const a=arena(),dx=p.x-a.cx,dy=p.y-a.cy,d=Math.hypot(dx/(a.rx-pad),dy/(a.ry-pad));
    return d>1?{x:a.cx+dx/d,y:a.cy+dy/d}:{...p};
  }
  function inside(x,y){
    return land[Journey.run.stage].some(p=>{
      if(x<p.left||x>p.right||y<p.top||y>p.bottom)return false;
      let hit=false;const v=p.vertices;
      for(let i=0,j=v.length-1;i<v.length;j=i++){
        const [xi,yi]=v[i],[xj,yj]=v[j];
        if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
      }return hit;
    });
  }
  function isWalkable(x,y,r=0){
    if(!inside(x,y)||TerrainScene.blocked(Journey.run.stage,x,y,r))return false;if(!r)return true;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;if(!inside(x+Math.cos(a)*r,y+Math.sin(a)*r))return false;}return true;
  }
  function project(x,y,r){
    if(isWalkable(x,y,r))return {x,y};
    for(let radius=20;radius<1000;radius+=20)for(let i=0;i<24;i++){
      const a=i*Math.PI/12,px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;
      if(isWalkable(px,py,r))return {x:px,y:py};
    }
    // Older scenes may have saved a position far from a newly curved deck.
    const scene=TerrainScene.geometry(Journey.run.stage);let best=null,distance=Infinity;
    const consider=(px,py)=>{const d=(px-x)**2+(py-y)**2;if(d<distance&&isWalkable(px,py,r)){best={x:px,y:py};distance=d;}};
    for(const route of scene.routes)for(const p of route.points)consider(p[0],p[1]);
    for(const p of scene.plazas){const dx=x-p.x,dy=y-p.y,f=Math.max(1,Math.hypot(dx/(p.rx-r-10),dy/(p.ry-r-10)));consider(p.x+dx/f,p.y+dy/f);consider(p.x,p.y);}
    return best||spawn();
  }
  function lineClear(x,y,tx,ty,r=18){
    const steps=Math.ceil(Math.hypot(tx-x,ty-y)/16);
    for(let i=1;i<=steps;i++)if(!isWalkable(x+(tx-x)*i/steps,y+(ty-y)*i/steps,r))return false;
    return true;
  }
  function steer(e,tx,ty){
    let dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1;
    if(active||d<40||lineClear(e.x,e.y,tx,ty,e.r||18))return {x:dx/d,y:dy/d};
    // One shared distance field guides nearby foes around shores and walls.
    const cell=64,cols=Math.ceil(width/cell),rows=Math.ceil(height/cell),id=(x,y)=>Math.round(y/cell)*cols+Math.round(x/cell);
    if(!nav){
      const walk=new Uint8Array(cols*rows),neighbors=Array.from({length:cols*rows},()=>[]);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)walk[y*cols+x]=isWalkable(x*cell,y*cell,23)?1:0;
      for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(walk[y*cols+x])for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){
        if(!(xx||yy)||!walk[(y+yy)*cols+x+xx])continue;
        if(xx&&yy&&(!walk[y*cols+x+xx]||!walk[(y+yy)*cols+x]))continue;
        if(lineClear(x*cell,y*cell,(x+xx)*cell,(y+yy)*cell,23))neighbors[y*cols+x].push((y+yy)*cols+x+xx);
      }
      nav={walk,neighbors,until:0,target:-1,dist:new Int16Array(cols*rows)};
    }
    let target=id(tx,ty);
    if(!nav.walk[target]){
      let best=Infinity;for(let i=0;i<nav.walk.length;i++)if(nav.walk[i]){const delta=Math.hypot(i%cols*cell-tx,Math.floor(i/cols)*cell-ty);if(delta<best){best=delta;target=i;}}
    }
    if(nav.target!==target||G.time>=nav.until){
      nav.dist.fill(-1);nav.dist[target]=0;const queue=[target];
      for(let i=0;i<queue.length;i++)for(const n of nav.neighbors[queue[i]])if(nav.dist[n]<0){nav.dist[n]=nav.dist[queue[i]]+1;queue.push(n);}
      nav.target=target;nav.until=G.time+.6;
    }
    const here=id(e.x,e.y);let best=Infinity,goal=null;
    const options=[here,...(nav.neighbors[here]||[])];
    // An actor may stand on a valid shore outside the centers of the coarse grid.
    // Rejoin a reachable nearby cell rather than steering straight into the bank.
    if(!nav.walk[here]||nav.dist[here]<0){
      const gx=Math.round(e.x/cell),gy=Math.round(e.y/cell);
      for(let yy=-4;yy<=4;yy++)for(let xx=-4;xx<=4;xx++){
        if(gx+xx<0||gx+xx>=cols||gy+yy<0||gy+yy>=rows)continue;
        options.push((gy+yy)*cols+gx+xx);
      }
    }
    for(const n of options){
      if(nav.dist[n]<0||!nav.walk[n])continue;
      const x=n%cols*cell,y=Math.floor(n/cols)*cell,score=nav.dist[n]*cell+Math.hypot(x-e.x,y-e.y)*.2;
      if(score<best&&lineClear(e.x,e.y,x,y,e.r||18)){best=score;goal={x,y};}
    }
    if(goal){dx=goal.x-e.x;dy=goal.y-e.y;d=Math.hypot(dx,dy)||1;}
    return {x:dx/d,y:dy/d};
  }
  function view(){return {x:cam.x,y:cam.y,w:W/cam.zoom,h:H/cam.zoom};}
  function screen(x,y){return {x:(x-cam.x)*cam.zoom,y:(y-cam.y)*cam.zoom};}
  function camera(dt=0,snap=false){
    cam.zoom=W<650?(active?.66:.78):H<580&&W<1100?(active?.7:.8):(active&&W<1100?.9:1);
    // Give the guardian's raised weapon room without losing the player's position.
    const foe=active&&G.boss?.hp>0?G.boss:null;
    const focusX=P.x+(foe?clamp((foe.x-P.x)*.28,-W/cam.zoom*.12,W/cam.zoom*.12):0);
    const focusY=P.y+(foe?clamp((foe.y-90-P.y)*.35,-H/cam.zoom*(W<650?.12:.18),H/cam.zoom*.1):0);
    const x=clamp(focusX-W/cam.zoom*.5,0,Math.max(0,width-W/cam.zoom));
    const y=clamp(focusY-H/cam.zoom*.57,0,Math.max(0,height-H/cam.zoom));
    const ease=snap?1:1-Math.exp(-dt*9);cam.x+=(x-cam.x)*ease;cam.y+=(y-cam.y)*ease;
  }
  function reset(){
    guideTarget=null;guideHeading=null;guideUntil=0;routeCache=null;
    width=data().width;height=data().height;terrain();active=false;mapOpen=false;near=null;visited=0;nav=null;combat=arena();document.body.classList.remove('on-map');
    const lore=[
      ['残碑写着：钟声掩住的，是未曾入册的证词。','先破三枚钟心，再避过镇音重锤，收锤才露破绽。','重锤可反噬钟心；每次收势后，可重新诱招争取增伤。'],
      ['密诏没有名字，只有反复加盖的红印。','斩断血诏之后，须诱尽两段问斩。','刀势锁定时向侧面避开；收刀，才是破绽。'],
      ['灯里封着没有名字的人，潮水替他们记账。','灭去河灯，再连渡两重洪潮的青色缺口。','只逃离洪潮，不能引出逆鳞；须迎潮守隙。']
    ][Journey.run.stage]||Journey.stage().lore||Journey.stage().story;
    sites=data().sites.map((s,id)=>({...s,id,...point(s),text:lore[s.loreIndex],done:false,discovered:false,name:s.kind==='boss'?'挑战 · '+Journey.stage().boss:s.name}));
    for(const s of sites)if(!['boss','station'].includes(s.kind))s.done=RunSave.claimed('site:'+Journey.run.stage+':'+s.id);
    visited=sites.filter(s=>s.done).length;
    Object.assign(P,project(P.x,P.y,P.r||15));
    for(const s of sites)if(!isWalkable(s.x,s.y,36))Object.assign(s,project(s.x,s.y,36));
    P.worldX=P.x;P.worldY=P.y;
    for(const s of sites)s.discovered=s.done||Math.hypot(s.x-P.x,s.y-P.y)<650;
    camera(0,true);
  }
  function resolve(e,teleport=false){
    const r=e.r||15;
    if(active){
      const rx=combat.rx-r,ry=combat.ry-r,dx=e.x-combat.cx,dy=e.y-combat.cy,d=Math.hypot(dx/rx,dy/ry);
      if(d>1){e.x=combat.cx+dx/d;e.y=combat.cy+dy/d;}
    }else if(!teleport&&Number.isFinite(e.worldX)&&isWalkable(e.worldX,e.worldY,r)&&!lineClear(e.worldX,e.worldY,e.x,e.y,r)){
        const ox=e.worldX,oy=e.worldY,tx=e.x,ty=e.y,steps=Math.ceil(Math.hypot(tx-ox,ty-oy)/12);let low=0,high=1;
        for(let i=1;i<=steps;i++)if(!isWalkable(ox+(tx-ox)*i/steps,oy+(ty-oy)*i/steps,r)){low=(i-1)/steps;high=i/steps;break;}
        for(let i=0;i<9;i++){const m=(low+high)/2;if(isWalkable(ox+(tx-ox)*m,oy+(ty-oy)*m,r))low=m;else high=m;}
        e.x=ox+(tx-ox)*low;e.y=oy+(ty-oy)*low;
        if(lineClear(e.x,e.y,tx,e.y,r))e.x=tx;
        if(lineClear(e.x,e.y,e.x,ty,r))e.y=ty;
    }else if(!isWalkable(e.x,e.y,r))Object.assign(e,project(e.x,e.y,r));
    e.worldX=e.x;e.worldY=e.y;
  }
  function visible(e,pad=180){const v=view();return e.x>v.x-pad&&e.x<v.x+v.w+pad&&e.y>v.y-pad&&e.y<v.y+v.h+pad;}
  function enterBoss(){
    if(active||G.bossSpawned)return false;
    CombatScaling.lockBoss();RunSave.prepareBoss();
    active=true;mapOpen=false;near=null;
    const button=document.getElementById('interactBtn');if(button)button.hidden=true;
    // Crossing the altar is a deliberate commitment. Nearby camps cannot flood the duel.
    EncounterDirector.beginBoss();
    G.shots=[];G.eshots=[];G.telegraphs=[];
    Object.assign(P,clipToArena({x:combat.cx,y:combat.cy+Math.min(350,combat.ry*.6)},P.r));resolve(P);spawnBoss();camera(0,true);RunSave.save('进入祭坛');return true;
  }
  function update(dt){
    for(const s of sites)if(Math.hypot(s.x-P.x,s.y-P.y)<650)s.discovered=true;
    near=null;
    if(!active)near=sites.filter(s=>!s.done&&Math.hypot(P.x-s.x,P.y-s.y)<125).sort((a,b)=>Math.hypot(P.x-a.x,P.y-a.y)-Math.hypot(P.x-b.x,P.y-b.y))[0]||null;
    const button=document.getElementById('interactBtn');
    if(button){const available=CampTactics.nearby(),trap=available&&(!near||near.kind!=='boss'&&available.tactics.charges>0)?available:null;button.hidden=(!near&&!trap)||G.state!=='playing';button.textContent=trap?CampTactics.prompt(trap):near?(near.kind==='boss'?'入坛挑战':'查看 · '+near.name)+'  E':'';}
    camera(dt);
  }
  function interact(){
    if(G.state!=='playing')return false;if(near?.kind==='boss')return enterBoss();const trap=CampTactics.nearby();if((!near||trap?.tactics.charges>0)&&CampTactics.interact())return true;if(!near)return false;
    const s=near;if(s.kind==='boss')return enterBoss();if(s.kind==='station')return stationMenu(s);
    if(s.kind!=='lore'&&!RunSave.claim('site:'+Journey.run.stage+':'+s.id)){s.done=true;near=null;return false;}
    s.done=true;near=null;visited++;
    if(s.kind==='lore'){
      G.pendingLore=s.id;
      clearInput();G.state='journal';const ov=document.getElementById('overlay');ov.classList.remove('hidden','journey-screen','title-screen');
      ov.innerHTML=`<div class="panel chronicle-panel world-lore"><span class="overline">${Journey.stage().place} · 劫痕证词</span><h2>${s.name}</h2><p class="end-narrative">${s.text}</p><p class="hintline">参悟灵蕴 +35 · 恢复 12% 生命</p><button class="btn" id="closeWorldLore">收 下 证 词 · 继 续 探 路</button></div>`;
      const close=document.getElementById('closeWorldLore');close.onclick=()=>{if(G.state!=='journal'||G.pendingLore===null)return;G.pendingLore=null;clearInput();ov.classList.add('hidden');G.state='playing';last=performance.now();if(RunSave.claim('site:'+Journey.run.stage+':'+s.id)){gainXP(35);heal(P.maxHp*.12);notifyPickup('lore','证词已收录 · 灵蕴 +'+Number((35*P.xpMul).toFixed(1)));Sound.effects('chest');}RunSave.save('收录证词');};close.focus?.();
    }else if(s.kind==='rest'){
      const hp=P.hp,energy=P.energy;heal(P.maxHp*.45);UltimateArts.charge(35);
      notifyPickup('rest','补给已领取 · '+(P.hp>hp?'生命 +'+Math.round(P.hp-hp):'生命已满')+' · '+(P.energy>energy?'剑意 +'+Math.round(P.energy-energy):'剑意已满'));Sound.effects('guanyin');
    }
    else {openChest();}
    RunSave.save('领取事件');return true;
  }
  function stationUnlocked(s){
    if(s.region===0)return true;
    const nearby=EncounterDirector.status().camps.filter(c=>Math.hypot(c.x-s.x,c.y-s.y)<Math.max(width,height)*.20);
    return nearby.length>0&&nearby.every(c=>c.state==='cleared');
  }
  function drawStation(s){ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle='#243831';ctx.strokeStyle=stationUnlocked(s)?'#9ee3c3':'#786e55';ctx.lineWidth=2;ctx.fillRect(-24,-65,48,65);ctx.strokeRect(-24,-65,48,65);ctx.beginPath();ctx.moveTo(-34,-65);ctx.lineTo(0,-86);ctx.lineTo(34,-65);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e7d8af';ctx.font='25px KaiTi';ctx.textAlign='center';ctx.fillText('驿',0,-28);ctx.restore();}
  function stationMenu(source){
    if(!stationUnlocked(source)){notifyPickup('camp','清理周围营地后可点亮此驿站');return false;}
    if(!Cultivation.safe()){notifyPickup('camp','附近仍有妖众，脱离战斗后再使用驿站');return false;}
    G.state='station';clearInput();const ov=document.getElementById('overlay');ov.classList.remove('hidden');
    ov.innerHTML=`<div class="panel chronicle-panel"><span class="overline">四境驿路</span><h2>沿旧路而行</h2><p>已清理区域可安全返回。战斗与首领阶段不能传送。</p>${sites.filter(s=>s.kind==='station').map(s=>`<button class="station-choice" data-station="${s.id}" ${!stationUnlocked(s)?'disabled':''}>${s.name} · ${stationUnlocked(s)?'已点亮':'待清理周围营地'}</button>`).join('')}<button class="btn" id="closeStationBtn">继续探路</button></div>`;
    const close=()=>{G.state='playing';ov.classList.add('hidden');clearInput();last=performance.now();};
    document.getElementById('closeStationBtn').onclick=close;
    ov.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>{const target=sites[Number(b.dataset.station)];if(!target||!stationUnlocked(target))return;P.x=target.x;P.y=target.y;resolve(P,true);camera(0,true);close();RunSave.save('驿站返回');});return true;
  }
  function exportState(){return {terrainVersion:TerrainScene.version,done:sites.map(s=>s.done),discovered:sites.map(s=>s.discovered),visited};}
  function importState(s){if(!s||!Array.isArray(s.done)||s.done.length!==sites.length||!s.done.every(v=>typeof v==='boolean'))throw new Error('Invalid world');sites.forEach((p,i)=>{p.done=s.done[i];p.discovered=p.discovered||p.done||s.discovered?.[i]===true;});visited=s.done.filter(Boolean).length;}
  function resumeLore(id){const s=sites[id];if(!s||s.kind!=='lore')throw new Error('Invalid lore');near=s;G.state='playing';if(s.done)visited--;s.done=false;return interact();}
  function toggleMap(){
    if(G.state==='map'){clearInput();mapOpen=false;document.body.classList.remove('on-map');G.state='playing';last=performance.now();return;}
    if(G.state!=='playing')return;clearInput();mapOpen=true;document.body.classList.add('on-map');G.state='map';
  }
  function apply(){ctx.scale(cam.zoom,cam.zoom);ctx.translate(-cam.x,-cam.y);}
  function drawBackground(){
    TerrainScene.draw(ctx,Journey.run.stage,view(),G.time);
  }
  function drawGround(){
    if(window.__terrainDebug||location.search.includes('collision=1'))TerrainScene.drawCollision(ctx,Journey.run.stage);
    for(const s of sites){
      if(!visible(s)||s.done||(active&&s.kind==='boss'))continue;const color=s.kind==='boss'?Journey.stage().color:'#ddc58f';
      ctx.save();ctx.translate(s.x,s.y);ctx.scale(1,.6);ctx.strokeStyle=rgba(color,s.done?.25:.65);ctx.lineWidth=s.kind==='boss'?3:1.5;
      ctx.beginPath();ctx.arc(0,0,s.kind==='boss'?95:39,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(active){
      ctx.save();ctx.strokeStyle=rgba(Journey.stage().color,.65);ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(combat.cx,combat.cy,combat.rx,combat.ry,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=rgba(Journey.stage().color,.18);ctx.lineWidth=20;ctx.stroke();ctx.restore();
    }
  }
  function drawProps(){
    TerrainScene.drawProps(ctx,Journey.run.stage,view(),G.time);
    for(const s of sites){
      if(!visible(s)||s.kind==='boss'||s.done&&s.kind!=='lore')continue;
      if(s.kind==='station'){drawStation(s);continue;}
      if(s.kind==='chest'&&ItemCatalog.draw('chest',s.x,s.y,82,G.time))continue;
      if(s.kind==='rest'&&ItemCatalog.draw('potion',s.x,s.y,58,G.time))continue;
      ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=s.done?'#34423a':'#646653';ctx.strokeStyle='#ad9c6f';ctx.lineWidth=2;
      if(s.kind==='lore'){ctx.beginPath();ctx.moveTo(-22,4);ctx.lineTo(-19,-61);ctx.lineTo(10,-72);ctx.lineTo(23,-57);ctx.lineTo(26,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#d6c69b';ctx.font='20px KaiTi,serif';ctx.textAlign='center';ctx.fillText('证',1,-30);}
      else if(s.kind==='chest'){
        ctx.fillStyle='#392c21';ctx.beginPath();ctx.moveTo(-26,-23);ctx.lineTo(15,-18);ctx.lineTo(15,8);ctx.lineTo(-26,1);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#705638';ctx.beginPath();ctx.moveTo(-26,-23);ctx.lineTo(-10,-37);ctx.lineTo(31,-32);ctx.lineTo(15,-18);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#241f18';ctx.beginPath();ctx.moveTo(15,-18);ctx.lineTo(31,-32);ctx.lineTo(31,-7);ctx.lineTo(15,8);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.strokeStyle='#c7a75f';ctx.lineWidth=4;for(const x of [-17,4]){ctx.beginPath();ctx.moveTo(x,-1);ctx.lineTo(x,-21);ctx.lineTo(x+16,-35);ctx.stroke();}ctx.fillStyle='#d6c18a';ctx.fillRect(-8,-15,5,8);
      }else{
        ctx.fillStyle='#263c3c';ctx.beginPath();ctx.ellipse(0,-3,31,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        const g=ctx.createLinearGradient(0,-35,0,0);g.addColorStop(0,'#5a7367');g.addColorStop(1,'#182d2d');ctx.fillStyle=g;
        ctx.beginPath();ctx.moveTo(-25,-28);ctx.lineTo(-18,-5);ctx.quadraticCurveTo(0,8,18,-5);ctx.lineTo(25,-28);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-28,25,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(!s.done){Motion.glow(0,-37,30,'#a7e5cd',.22);ctx.strokeStyle='#d6efe0aa';for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(j*10,-26);ctx.quadraticCurveTo(j*10+Math.sin(G.time+j)*9,-43,j*10-3,-58);ctx.stroke();}}
      }
      ctx.restore();
    }
  }
  function drawLabels(){
    for(const s of sites){if(!visible(s)||s.done||(active&&s.kind==='boss'))continue;
      ctx.save();ctx.textAlign='center';ctx.font='14px KaiTi,serif';ctx.fillStyle=Journey.stage().color;ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(s.name,s.x,s.y-(s.kind==='boss'?25:88));ctx.restore();
    }
  }
  function mapDraw(x,y,w,h,full=false){
    const image=terrain();ctx.save();ctx.fillStyle='#07161bea';ctx.fillRect(x-5,y-5,w+10,h+10);
    TerrainScene.drawMap(ctx,Journey.run.stage,x,y,w,h);
    ctx.strokeStyle='#c9b57d88';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
    const px=v=>x+v/width*w,py=v=>y+v/height*h;
    for(const s of sites){if(s.done||!s.discovered)continue;ctx.fillStyle=s.kind==='boss'?'#f49d7a':'#e3c788';ctx.beginPath();ctx.arc(px(s.x),py(s.y),full?5:2.5,0,Math.PI*2);ctx.fill();if(full){ctx.font=(W<650?'10':'13')+'px Microsoft YaHei,sans-serif';ctx.textAlign=s.x>width*.7?'right':'left';ctx.fillText(s.name,px(s.x)+(s.x>width*.7?-9:9),py(s.y)+4);}}
    EncounterDirector.drawMap(x,y,w,h,full);
    if(full){const points=route();ctx.strokeStyle='#bcf7d7bb';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(px(p.x),py(p.y)):ctx.moveTo(px(p.x),py(p.y)));ctx.stroke();ctx.setLineDash([]);}
    const goal=guidance();if(goal){ctx.strokeStyle='#bbffe0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px(goal.x),py(goal.y),full?12:6,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle='#ec987d';ctx.beginPath();ctx.ellipse(px(combat.cx),py(combat.cy),combat.rx/width*w,combat.ry/height*h,0,0,Math.PI*2);ctx.stroke();
    const v=view();ctx.strokeStyle='#e4ead180';ctx.strokeRect(px(v.x),py(v.y),v.w/width*w,v.h/height*h);
    ctx.fillStyle='#c2ffff';ctx.beginPath();ctx.arc(px(P.x),py(P.y),full?6:3.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawScreen(){
    if(['start','story','win','dead'].includes(G.state))return;
    const short=H<580&&W<1100,mw=W<650?96:short?110:156,mh=mw*height/width,mx=W-mw-(W<650||short?12:30),my=W<650?224:short?115:185;
    if(!mapOpen){
      mapDraw(mx,my,mw,mh);
      const goal=guidance();
      if(goal&&goal.distance>100){
        // Reuse collision-aware route steering at a bounded rate, never auto-move.
        if(!guideHeading||G.time>=guideUntil){guideHeading=steer(P,goal.x,goal.y);guideUntil=G.time+.6;}
        const p=screen(P.x,P.y),angle=Math.atan2(guideHeading.y,guideHeading.x),x=p.x+Math.cos(angle)*80,y=p.y+Math.sin(angle)*72;
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#c5efcf';ctx.strokeStyle='#0b2927';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-6);ctx.lineTo(-3,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
        ctx.save();ctx.textAlign='center';ctx.font='11px Microsoft YaHei';ctx.fillStyle='#c5efcf';ctx.strokeStyle='#071b21';ctx.lineWidth=4;const label=goal.name+' · '+Math.round(goal.distance/10)+'丈';ctx.strokeText(label,p.x,p.y+108);ctx.fillText(label,p.x,p.y+108);ctx.restore();
      }
      ctx.save();ctx.font='10px Microsoft YaHei,sans-serif';ctx.textAlign='right';ctx.fillStyle='#ded0ab';ctx.fillText(active?'守关祭坛 · Tab 舆图':'自由探索 · Tab 舆图',mx+mw,my+mh+18);ctx.restore();
      if(active&&G.boss?.hp>0){
        const s=screen(G.boss.x,G.boss.y);
        if(s.x<40||s.x>W-40||s.y<230||s.y>H-140){
          const p=screen(P.x,P.y),a=Math.atan2(s.y-p.y,s.x-p.x),x=clamp(s.x,40,W-40);let y=clamp(s.y,235,H-150);
          if(x>mx-28&&y>my-24&&y<my+mh+38)y=my+mh+49;
          ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=Journey.stage().color;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-7,-7);ctx.lineTo(-3,0);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.restore();
          ctx.save();ctx.textAlign=x>W/2?'right':'left';ctx.font='12px KaiTi,serif';ctx.fillStyle='#f4d9aa';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(Journey.stage().boss,x,y+23);ctx.restore();
        }
      }
    }
    if(mapOpen){
      ctx.save();ctx.fillStyle='#031018f5';ctx.fillRect(0,0,W,H);const {x,y,w,h}=mapLayout();
      mapDraw(x,y,w,h,true);ctx.fillStyle='#ead9af';ctx.font='24px KaiTi,serif';ctx.textAlign='center';ctx.fillText(Journey.stage().place+' · 舆图',W/2,Math.max(55,y-30));ctx.font=(W<650?'10':'12')+'px Microsoft YaHei,sans-serif';ctx.fillText('点击已发现标记查看详情 · 选定路线沿可走地面显示',W/2,H-159);ctx.fillText('营地：空心待探 · 赤色交战 · 青色已净',W/2,H-139);ctx.restore();
    }
  }
  function region(){if(active)return data().regions[3];const anchors=[data().spawn,data().sites[1],data().sites[2],data().sites[4]];let best=0,dist=Infinity;anchors.forEach((p,i)=>{const d=Math.hypot(P.x-p.x*width,P.y-p.y*height);if(d<dist){best=i;dist=d;}});return data().regions[best];}
  function objective(){
    if(active)return '攻击持续扣血 · 识破'+Journey.stage().boss+'招式可获3倍伤害';
    const distance=Math.round(Math.hypot(P.x-sites[5].x,P.y-sites[5].y)/10);
    return '自由寻路 · '+distance+'丈外可挑战守关者 · E 交互 / Tab 舆图';
  }
  return {bounds,arena,bossPoint,spawn,clipToArena,view,screen,camera,reset,resolve,isWalkable,steer,visible,enterBoss,update,interact,toggleMap,setGuide,guidance,guideMode:()=>guide,apply,drawBackground,drawGround,drawProps,drawLabels,drawScreen,region,objective,
    exportState,importState,resumeLore,stationUnlocked,markers,guideTo,route,mapLayout,selectMap,active:()=>active,context:()=>near,status:()=>({width,height,camera:{...cam},active,mapOpen,visited,camps:EncounterDirector.status().discovered,loaded:images.map(i=>!!(i.complete&&i.naturalWidth))})};
})();
