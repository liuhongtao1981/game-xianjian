/* 合体篇：天上的双炉，把被夺走的人生炼成了可以继承的身份。 */
const HetiChapters=[
  {id:'twinforge',no:'拾陆',title:'双炉炼名',subtitle:'平顶双炉谷',place:'平顶山 · 双炉谷',color:'#e7b16c',background:'assets/heti-worlds.webp',artPosition:'0%',bossHp:85500,bossSpeed:75,mobScale:7.35,boss:'金符童子',bossGlyph:'炉',bossRow:0,
    mobNames:{imp:'焚籍金面卒',fox:'铜骨烬獒',snake:'赤符摇铃使',zombie:'双釜重甲卫'},
    theme:'两座炉，一座烧掉来处，一座铸出清白。',
    story:['宝象城归还的影子仍在颤抖。孙小果带着双炉归名石来到平顶山，谷中不炼仙丹，只把活人的姓名投入金炉，再从银炉取出一张无罪仙籍。','金符童子说，身与魂合一才算完整。可炉边缝在一起的，是一个人的身体、另一个人的记忆，和买主从未受过苦的一生。七彩补天芝长在炉缝，替这些破碎的人保住最后一点自己。','大圣曾用金箍棒撑住炉门，放走一群不肯换名的人。童子却拿他们留下的空籍补了火。小果拾起炉门下的金毫：今天要烧的，是这张买卖人的账。'],
    lore:['金炉的灰不许落地。每一把灰里都有一个故乡，风若吹散，就再也找不到回去的人。','银炉的出货签写着功德圆满，背面却是另一人的十年劳役。清白从来不是炉火炼出来的。','炉门上有一道向外弯折的棍痕。大圣救人时没有留下名号，账房便称那一夜无人逃走。'],
    tell:'双炉依次喷焰，先进入左侧青色冷廊，再转入右侧冷廊，最后回到中央淬火圈。冷廊是狭长通道，站在廊外或走过尽头都不安全。三拍完成可获3倍伤害。',
    mechanic:'双炉换火：左冷廊、右冷廊、中央淬火，沿青色通道换位。',bossLine:'“名字烧干净了，谁还认得炉里的人？”',
    reveal:'金炉炸开，灰烬没有散去，而是落成一串串故乡的名字。童子的葫芦里滚出倒写的封签：失格之名，交莲花洞复核。',clue:{name:'莲花倒写封签',text:'金银双炉只负责炼名，真正决定谁能活成谁的人，在莲花洞里倒着念名。补天芝照出封签背后的孩子乳名，与仙籍上的尊号一一相对。'},reward:'炉门已开。被拆开的人生，应由原主带回家。',regions:['灰籍山口','金炉熔阶','银炉冷廊','双炉淬名台'],siteNames:['不落地的乡灰','功德出货签','向外弯的炉门','金炉封匣','冷廊药炉','双炉淬名台'],
    layout:{spawn:[.18,.82],hub:[.43,.53],left:[.18,.19],right:[.81,.78],boss:[.80,.20],main:[[.18,.82],[.28,.70],[.40,.70],[.43,.53],[.59,.53],[.67,.37],[.80,.20]],upper:[[.43,.53],[.32,.43],[.31,.28],[.18,.19]],lower:[[.43,.53],[.51,.68],[.67,.68],[.81,.78]]}},
  {id:'lotusname',no:'拾柒',title:'莲洞倒名',subtitle:'莲花倒名洞',place:'莲花洞 · 倒名司',color:'#c4b3ec',background:'assets/heti-worlds.webp',artPosition:'50%',bossHp:97900,bossSpeed:77,mobScale:8.05,boss:'银诏炉主',bossGlyph:'诵',bossRow:1,
    mobNames:{imp:'削名银面鬼',fox:'晶莲双尾狐',snake:'盲诏倒名僧',zombie:'倒钟禁名卫'},
    theme:'喊一声名字，答应的却是被卖掉的那个人。',
    story:['倒写封签引小果进入莲花洞。洞顶悬着无数名字，越尊贵的仙号挂得越高；地上的孩子一被叫到乳名，葫芦里就传出另一个人的应答。','银诏炉主替双炉验收成品。他倒念原主的姓名，把记忆锁进葫芦，再让买主正着应一声。仙籍便只认应声的人，连亲人的呼唤也成了夺命的凭据。','一只裂葫芦里留着大圣的笑声：不必答他们替你取的名。小果听见井水撞上石壁，许多被收走的记忆正往乌鸡国流去；先破倒名诏，才能把回家的路还给他们。'],
    lore:['封签的正面是仙号，反面是乳名。母亲认得的那两个字，在验收簿上被写成残次。','盲诏僧听不见哭声，只听应答。答错一次换一张脸，答对一次换一位买主。','裂葫芦装不住金色笑声。大圣将自己的名字留在壶外，让囚在里面的人先说完。'],
    tell:'倒名吸阵分三拍：先站进近处青色环带，再退入外层青色环带，最后进入中央止名圈。环带内沿与外沿都危险，留在金色中线附近；依次完成获得3倍伤害。',
    mechanic:'葫芦逆吸：近环、远环、中央，认准青色环带的内外边界。',bossLine:'“叫你一声，你敢认回原来的自己吗？”',
    reveal:'葫芦裂成两半，数千个乳名从洞顶落回人间。最底下却封着一份王诏：乌鸡国的新王，每夜都要从井底借一次记忆。',clue:{name:'井底借忆王诏',text:'旧王的记忆被装进新王的身体，百姓看见的仍是熟悉的明君。小果循着王诏走向乌鸡镜井宫，井里的倒影却比岸上的人更先开口。'},reward:'乳名回到亲人口中，就不再是囚人的咒。',regions:['逆字莲阶','悬名石窟','裂壶暗渠','止名莲坛'],siteNames:['两面的封签','应答验收簿','壶外的金色笑声','倒名玉匣','莲心药泉','止名莲坛'],
    layout:{spawn:[.19,.80],hub:[.49,.54],left:[.20,.18],right:[.81,.77],boss:[.79,.22],main:[[.19,.80],[.34,.80],[.34,.61],[.49,.54],[.60,.43],[.72,.43],[.79,.22]],upper:[[.49,.54],[.42,.37],[.28,.37],[.20,.18]],lower:[[.49,.54],[.61,.68],[.70,.62],[.81,.77]]}},
  {id:'mirrorwell',no:'拾捌',title:'镜井辨王',subtitle:'乌鸡镜井宫',place:'乌鸡国 · 镜井宫',color:'#88d9bb',background:'assets/heti-worlds.webp',artPosition:'100%',bossHp:111800,bossSpeed:79,mobScale:8.8,boss:'井底伪王',bossGlyph:'鉴',bossRow:2,
    mobNames:{imp:'无面镜禁军',fox:'碎鉴青狮',snake:'溺星宫占师',zombie:'玉棺殿斧卫'},
    theme:'他记得所有百姓，却不记得自己杀过谁。',
    story:['小果抵达乌鸡王宫，新王能叫出每个百姓的名字，也记得每户人家的苦。可每到深夜，井里就有一个声音替他念完白日未说的话。','旧王被沉在镜井，记忆每日被抽走一遍；伪王借这些记忆行善，把百姓的感激抵成了夺位的功德。双炉炼身，倒名锁魂，镜井合一，原来整条取经路都在制造无需悔过的善人。','井沿刻着大圣留下的问句：记得一个人的苦，就能占有他的一生吗？小果将补天芝放在水面，井底的旧王终于看清岸上那张自己的脸。真与假，都该当着活人的面说清。'],
    lore:['殿前功德碑逐日增长，井底水位逐夜下降。每一滴被抽走的水，都带着旧王的一段记忆。','伪王亲手赈灾，也亲手封井。账房只收善行的数目，不收善人不愿认领的罪。','井沿棍痕指向号山。一页烧焦的誓书卡在石缝里：记忆可以借，发过的誓却会找到原主。'],
    tell:'照王镜先后转向两片青色扇区，避开井心与外沿，跟随金色冠印换到对侧扇区；第三拍进入中央证身圈。连续完成可获3倍伤害，不要把整片圆圈当作安全区。',
    mechanic:'镜井对证：侧向扇区、对侧扇区、井心证身，辨认冠印。',bossLine:'“他们爱的是这张脸，谁在脸后面，有那么要紧吗？”',
    reveal:'镜井碎开，旧王踏上石阶，却没有立刻取回王冠。他先让百姓听完井下三年的证词。补天芝映出号山的火光，火里有人正把自己的誓言烧成另一个人的命。',clue:{name:'号山焚誓残书',text:'名字、身体与记忆终于不再分属三个主人。可天上的账房仍能把誓言折成寿命，号山正替他们守着另一座炉。大乘篇已开启。修至合体九层圆满、突破大乘后，可沿焚誓残书前往号山，追查把誓言折成寿命的买卖。'},reward:'合体篇已破。善行可以被记下，夺来的人生却不能因此一笔勾销。',regions:['无面朝门','借忆御街','沉王镜苑','对证井宫'],siteNames:['增长的功德碑','新王的封井诏','号山焚誓书','镜苑沉匣','清心井泉','对证井宫'],
    layout:{spawn:[.17,.81],hub:[.45,.49],left:[.18,.19],right:[.81,.76],boss:[.80,.20],main:[[.17,.81],[.31,.72],[.31,.55],[.45,.49],[.61,.49],[.61,.30],[.80,.20]],upper:[[.45,.49],[.43,.29],[.31,.29],[.18,.19]],lower:[[.45,.49],[.52,.64],[.68,.64],[.81,.76]]}}
];
LaterChapters.push(...HetiChapters);

const HetiArt=(()=>{
  const sheets=HetiChapters.map(c=>{const im=new Image();im.src='assets/actors-'+c.id+'.webp';return im;}),props=new Image();props.src='assets/heti-props.webp';
  let uv=null,propUV=null;
  function configure(actors,objects){uv=actors;propUV=objects;}
  function drawActor(e,row,size){const i=(e.family??Journey.run.stage)-15,im=sheets[i];if(!im?.complete||!im.naturalWidth||!uv)return false;const col=e.action==='windup'?2:e.action==='strike'?3:e.moving?Math.floor((e.walkDistance||0)/30)%2:0,[x,y,w,h,px,py]=uv[i][row][col],scale=size/uv[i][row][0][3];ctx.drawImage(im,x,y,w,h,(x-px)*scale,(y-py)*scale,w*scale,h*scale);return true;}
  function drawProp(pen,o,stage){const i=stage-15,col={gate:0,tree:1,rock:1,lantern:2,shrine:3}[o.kind];if(col===undefined||!props.complete||!props.naturalWidth||!propUV)return false;const [x,y,w,h]=propUV[i][col],size=o.size||{gate:350,tree:300,rock:155,lantern:120,shrine:215}[o.kind],s=size/Math.max(w,h);pen.drawImage(props,x,y,w,h,-w*s/2,-h*s,w*s,h*s);return true;}
  function drawShot(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=2;if(s.theme===15){ctx.rotate(Math.PI/4);ctx.fillRect(-8,-8,16,16);ctx.strokeStyle='#ffdf9d';ctx.strokeRect(-4,-4,8,8);}else if(s.theme===16){ctx.beginPath();ctx.ellipse(-5,0,7,5,0,0,Math.PI*2);ctx.ellipse(6,0,9,7,0,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(0,-8);ctx.lineTo(-12,0);ctx.lineTo(0,8);ctx.closePath();ctx.stroke();}ctx.restore();}
  function drawWard(t){if(G.telegraphs.some(q=>q.shape==='heti'&&q.life<t.life))return;ctx.save();ctx.fillStyle='#bd3c4c22';ctx.strokeStyle='#e88a83';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.zoneRadius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#64ddbb55';ctx.strokeStyle='#b5ffdb';ctx.lineWidth=4;const p=t.safe||t;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t.safeAngle||0);ctx.beginPath();
    if(t.safeMode==='strip')ctx.rect(-t.safeLength,-t.safeWidth,t.safeLength*2,t.safeWidth*2);
    else if(t.safeMode==='annulus'){ctx.arc(0,0,t.outerRadius,0,Math.PI*2);ctx.arc(0,0,t.innerRadius,0,Math.PI*2,true);}
    else if(t.safeMode==='sector'){ctx.arc(0,0,t.outerRadius,-t.halfAngle,t.halfAngle);ctx.arc(0,0,t.innerRadius,t.halfAngle,-t.halfAngle,true);ctx.closePath();}
    else ctx.arc(0,0,t.safeRadius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
    const target=HetiGuardians.safePoint(t);ctx.strokeStyle='#ffdc8a';ctx.beginPath();ctx.arc(target.x,target.y,20,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffdc8a';ctx.font='22px KaiTi';ctx.textAlign='center';ctx.fillText('证',target.x,target.y+8);
    if(!HetiGuardians.safe(t,P)){const a=Math.atan2(target.y-P.y,target.x-P.x);ctx.save();ctx.translate(P.x+Math.cos(a)*80,P.y+Math.sin(a)*80);ctx.rotate(a);ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-8);ctx.lineTo(-3,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fillStyle='#b4ffe0';ctx.fill();ctx.restore();}
    ctx.font='bold 16px KaiTi';ctx.lineWidth=5;ctx.strokeStyle='#08151c';const label=t.label+' · '+Math.max(0,t.life).toFixed(1)+'秒';ctx.strokeText(label,P.x,P.y-145);ctx.fillStyle='#f3e5c9';ctx.fillText(label,P.x,P.y-145);ctx.restore();}
  function drawEffect(e,p,fade){ctx.save();ctx.globalAlpha=fade*.7;ctx.strokeStyle=Journey.stages[e.chapterTheme].color;ctx.lineWidth=3;ctx.translate(e.x,e.y);const r=Math.min(200,e.r||100)*(1+p*.4);if(e.chapterTheme===15){ctx.rotate(p);ctx.strokeRect(-r*.7,-r*.7,r*1.4,r*1.4);}else if(e.chapterTheme===16){for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.ellipse(r*.35,0,r*.6,r*.2,0,0,Math.PI*2);ctx.stroke();}}else{for(const k of [1,.7,.4]){ctx.beginPath();ctx.ellipse(0,0,r*k,r*k*.65,0,0,Math.PI*2);ctx.stroke();}}ctx.restore();}
  return {configure,drawActor,drawProp,drawShot,drawWard,drawEffect,loaded:()=>!!uv&&!!propUV&&sheets.every(s=>s.complete&&s.naturalWidth)&&props.complete&&props.naturalWidth};
})();

const HetiGuardians=(()=>{
  const alive=e=>e&&e.hp>0&&!e.killed,point=(x,y)=>World.clipToArena({x,y},90);
  const inArena=p=>{const a=World.arena();return Math.hypot((p.x-a.cx)/a.rx,(p.y-a.cy)/a.ry)<=1;};
  function safe(t,p){const s=t.safe||t,x=p.x-s.x,y=p.y-s.y,r=p.r||0,d=Math.hypot(x,y),a=t.safeAngle||0,u=x*Math.cos(a)+y*Math.sin(a),v=-x*Math.sin(a)+y*Math.cos(a);if(t.safeMode==='strip')return Math.abs(u)<t.safeLength-r&&Math.abs(v)<t.safeWidth-r;if(t.safeMode==='annulus')return d>t.innerRadius+r&&d<t.outerRadius-r;if(t.safeMode==='sector'){const angle=Math.atan2(Math.sin(Math.atan2(y,x)-a),Math.cos(Math.atan2(y,x)-a));return d>t.innerRadius+r&&d<t.outerRadius-r&&Math.abs(angle)<t.halfAngle-Math.asin(Math.min(1,r/Math.max(1,d)));}return d<t.safeRadius-r;}
  function safePoint(t){const p=t.safe||t;if(t.safeMode==='annulus'||t.safeMode==='sector'){const a=t.safeAngle||0,r=(t.innerRadius+t.outerRadius)/2;return {x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};}return {x:p.x,y:p.y};}
  const wardHit=(t,p)=>inArena(p)&&Math.hypot(p.x-t.x,p.y-t.y)<t.zoneRadius+(p.r||0)&&!safe(t,p);
  function state(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=duration;e.attack=['windup','strike'].includes(name)?duration:0;}
  function clear(e){G.telegraphs=G.telegraphs.filter(t=>t.bossOwner!==e.id);G.eshots=G.eshots.filter(t=>t.bossOwner!==e.id);e.brain.pending=null;}
  function init(e){e.brain={round:1,breaks:0,attackIndex:0,token:0,pending:null,windowDamage:0,duelFailures:0};e.phase=1;state(e,'guard',1.5);}
  function hazard(e,p,o){const pending=e.brain.pending,life=Math.max(.65,o.life*Journey.difficulty().warning);Journey.hazard(p.x,p.y,{...o,life,total:life,boss:true,bossOwner:e.id,bossToken:pending.token,theme:Journey.run.stage%3,chapterTheme:Journey.run.stage,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1}});pending.expected++;pending.last=Math.max(pending.last,life);}
  function prepare(e,mechanism){const b=e.brain,local=Journey.run.stage-15,a=World.arena(),angle=Math.atan2(P.y-e.y,P.x-e.x),origin=point(P.x,P.y);e.attackAngle=angle;e.look=Math.cos(angle)<0?-1:1;b.pending={token:++b.token,kind:mechanism?['furnaces','inversion','testimony'][local]:'assault',mechanism,expected:0,impacts:0,passed:true,last:0};b.mechanismReady=mechanism;
    if(mechanism){const base={shape:'heti',zoneRadius:950,r:180,dmg:58+local*3};
      if(local===0){for(let i=0;i<2;i++)hazard(e,{x:a.cx,y:a.cy},{...base,safeMode:'strip',safe:point(a.cx+(i?210:-210),a.cy),safeAngle:Math.PI/2,safeLength:430,safeWidth:120,life:3.6+i*4,label:i?'银炉换火 · 右冷廊':'金炉喷焰 · 左冷廊',bossSkill:'twinforge-corridor'});}
      else if(local===1){for(let i=0;i<2;i++)hazard(e,{x:a.cx,y:a.cy},{...base,safeMode:'annulus',innerRadius:130+i*145,outerRadius:300+i*145,life:3.6+i*4,label:i?'倒名二吸 · 外环中线':'倒名初吸 · 近环中线',bossSkill:'lotusname-annulus'});}
      else{for(let i=0;i<2;i++)hazard(e,{x:a.cx,y:a.cy},{...base,safeMode:'sector',safeAngle:(b.round-1)*Math.PI/2+i*Math.PI,halfAngle:.65,innerRadius:130,outerRadius:450,life:3.6+i*4,label:i?'镜面翻转 · 对侧冠印':'照王镜起 · 跟随冠印',bossSkill:'mirrorwell-sector'});}
      hazard(e,{x:a.cx,y:a.cy},{...base,safeMode:'circle',safeRadius:175,life:11.6,label:['双炉熄火 · 中央淬名','止名封口 · 中央归身','井水照心 · 中央对证'][local],bossSkill:'heti-reunite'});
    }else if(local===0){for(let i=0;i<2;i++)hazard(e,e,{shape:'line',angle:angle+(i?Math.PI/2:0),length:530,r:44,dmg:53,life:1.25+i*.9,label:i?'银炉回焰 · 第二道锁向':'金炉出火 · 避开红线',bossSkill:'twinforge-cross'});if(e.phase===2)hazard(e,origin,{r:145,dmg:50,life:2.85,label:'炉灰复燃 · 离开原位'});}
    else if(local===1){for(let i=0;i<3;i++){const p=point(origin.x+(i-1)*175,origin.y+(i%2)*100);hazard(e,p,{r:112,dmg:54,life:1.45+i*.65,label:'倒诏落印 · 延迟三连',bossSkill:'lotusname-seals'});}if(e.phase===2)hazard(e,e,{shape:'line',angle,length:560,r:40,dmg:55,life:3.35,label:'裂壶银诏 · 锁定方向'});}
    else{for(let i=-1;i<=1;i++)hazard(e,e,{shape:'line',angle:angle+i*.75,length:550,r:34,dmg:57,life:1.4+Math.abs(i)*.65,label:'镜王三诘 · 穿过剑隙',bossSkill:'mirrorwell-interrogate'});if(e.phase===2)hazard(e,origin,{r:155,dmg:56,life:3.1,label:'借忆井涌 · 勿停旧影'});}
    state(e,'windup',Math.min(...G.telegraphs.filter(t=>t.bossOwner===e.id&&t.bossToken===b.pending.token).map(t=>t.life)));if(mechanism)Sound.omen(Journey.run.stage);
  }
  function finish(e){const b=e.brain,p=b.pending;if(p?.mechanism&&p.impacts===p.expected&&p.passed){clear(e);b.breaks++;b.windowDamage=0;state(e,'exposed',Bosses.profiles[Journey.run.difficulty].window);Sound.weakness(Journey.run.stage);addText(e.x,e.y-155,['双炉熄火','倒名诏碎','镜井对证'][Journey.run.stage-15]+' · 伤害3倍',Journey.stage().color,20);Motion.emit('blast',e.x,e.y,{r:180,duration:.9,color:Journey.stage().color});return;}if(p?.mechanism){b.duelFailures++;addText(e.x,e.y-155,'破招未成 · 仍可持续攻击','#dec6ab',16);}b.pending=null;b.mechanismReady=false;state(e,'guard',e.phase===2?.85:1.25);}
  function update(e,dt){if(!e.brain)init(e);if(!alive(e))return;const b=e.brain;if(e.phase===1&&e.hp<=e.maxHp*.5){e.phase=2;Sound.guardian(Journey.run.stage,true);addText(e.x,e.y-160,Journey.stage().boss+' · 怒相',Journey.stage().color,20);}e.actionT+=dt;
    if(e.action==='exposed'){if(e.actionT>=e.actionDuration){b.round++;clear(e);b.mechanismReady=false;state(e,'guard',1.2);}return;}
    if(e.action==='guard'){const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);if(d>300){const v=World.steer(e,P.x,P.y);e.x+=v.x*e.speed*dt;e.y+=v.y*e.speed*dt;World.resolve(e);e.moving=true;}else e.moving=false;if(e.actionT>=e.actionDuration){e.moving=false;b.attackIndex++;prepare(e,b.attackIndex%3===0);}}
    else if(e.action==='windup'&&e.actionT>=e.actionDuration)state(e,'strike',Math.max(.4,b.pending.last-e.actionDuration+.2));else if(e.action==='strike'&&e.actionT>=e.actionDuration)state(e,'recover',.9);else if(e.action==='recover'&&e.actionT>=e.actionDuration)finish(e);
  }
  function onImpact(t,hit){const e=G.boss,p=e?.brain?.pending;if(!alive(e)||!p||t.bossOwner!==e.id||t.bossToken!==p.token)return;p.impacts++;p.passed=p.passed&&!hit;if(t.shape==='heti')p.passed=p.passed&&inArena(P)&&safe(t,P)&&Math.hypot(P.x-t.x,P.y-t.y)<t.zoneRadius;}
  function hud(e){const b=e?.brain;if(!b)return {title:'全程可攻击',hint:Journey.stage().tell,progress:0};const exposed=e.action==='exposed',p=b.pending,remaining=Math.max(0,e.actionDuration-e.actionT);return {title:exposed?'破绽 · 伤害3倍 · '+remaining.toFixed(1)+'秒':p?.mechanism?['双炉换火 · 左右中','倒名吸阵 · 近远中','镜井对证 · 两侧归心'][Journey.run.stage-15]:'可持续攻击 · 避开锁向与延迟招式',hint:Journey.stage().bonusTell,progress:exposed?remaining/e.actionDuration:p?.mechanism?p.impacts/p.expected:0,helpers:0,exposed,remaining:exposed?remaining:0,breaks:b.breaks,round:b.round,action:e.action};}
  return {init,update,onImpact,onHelperKilled(){},filterDamage:(e,d)=>e.locked?0:d,hud,wardHit,safe,safePoint,inArena};
})();
HetiChapters.forEach((c,i)=>{const s=i+15;Sound.registerCaption('stage-'+s,'说书人',c.story[0]);Sound.registerCaption('boss-'+s,c.boss,c.bossLine);Sound.registerCaption('phase-'+s,c.boss,['炉火不灭，谁也别想认祖归宗！','正名倒名，都由我的葫芦应声！','我替他做尽好事，他还要认什么罪！'][i]);Sound.registerCaption('omen-'+s,'剑仙',['左冷廊，右冷廊，再回淬火圈！','近环，外环，最后回中央！','看冠印，换到对侧，再进井心！'][i]);Sound.registerCaption('weakness-'+s,'剑仙',['双炉熄火，把人生还给原主！','倒名诏碎，莫再替别人应声！','镜井对证，让活人自己作证！'][i]);Sound.registerCaption('victory-'+s,'说书人',c.reveal);});
