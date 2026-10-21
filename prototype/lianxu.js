/* 炼虚篇：姓名、身体与影子，是同一本功德账的三种抵押物。 */
const LianxuChapters=[
  {id:'sunken',no:'拾叁',title:'流沙沉名',subtitle:'流沙沉名渡',place:'流沙河 · 沉名渡',color:'#82d4d9',background:'assets/lianxu-worlds.webp',artPosition:'0%',bossHp:55500,bossSpeed:69,mobScale:5.55,boss:'吞籍沙将',bossGlyph:'籍',bossRow:0,
    mobNames:{imp:'沉籍舟卒',fox:'逐名鳍獒',snake:'空牌渡师',zombie:'负锚河卫'},
    theme:'渡船不收路钱，只问你愿不愿意忘记自己。',
    story:['黄风劫印的碎片指向流沙河底。孙小果追上那艘逆行的船，发现每块空白名牌都连着一个还在呼吸的人。名字沉下去，活人便不再计入劫税。','吞籍沙将曾替亡者刻名，后来奉命刮去姓名，替天上的账房制造无主之身。河底的阴阳并蒂莲，一瓣记住生者，一瓣记住被抹去的死者。','小果在旧船板上认出大圣的棍痕：他们抹掉名字，是为了让债永远无人认领。沙将举起月牙铲，潮水把数千张空牌送向渡头。'],
    lore:['名牌背面都有两道价码：有名者需赎，失名者可卖。被刮掉的不是木屑，是活人的来处。','船工记着一个不肯留名的猴子。他把沉船推上岸，却没有带走任何一块名牌。','阴阳并蒂莲总向两个方向开。一瓣追着声音，一瓣追着没有声音的影子。'],
    tell:'吞名潮分三次：先进入青色内圈，再退到红圈外，最后回到青圈。依次完成进退可获3倍伤害；远离潮区可避伤，但不算破招。',
    mechanic:'退潮归名：进、退、进，认准青色安全圈与次序。',bossLine:'“没有名字，就没有人欠你一生。”',
    reveal:'月牙铲折断，名牌第一次浮在水面。沙将从喉中吐出一张送货单：白骨荒冢收货，货名是无主之身。',clue:{name:'白骨收身单',text:'河底的名字被运走，岸上的身体却仍有人使用。并蒂莲的阴瓣指向白骨荒冢，那里每个坟前，都站着三个自称死者的人。'},reward:'沉名渡已开。被忘记的人，也应有上岸的路。',regions:['逆舟旧埠','沉籍回湾','空牌孤洲','归名潮坛'],siteNames:['双价名牌','不留名的船工','双向莲铭','渡头沉匣','退潮药舟','归名潮坛'],
    layout:{spawn:[.16,.81],hub:[.43,.56],left:[.19,.19],right:[.80,.79],boss:[.80,.22],main:[[.16,.81],[.29,.74],[.25,.61],[.43,.56],[.54,.62],[.60,.46],[.70,.40],[.80,.22]],upper:[[.43,.56],[.33,.43],[.35,.29],[.19,.19]],lower:[[.43,.56],[.51,.76],[.66,.71],[.80,.79]]}},
  {id:'whitebone',no:'拾肆',title:'白骨换身',subtitle:'白骨荒冢',place:'白骨岭 · 三相荒冢',color:'#e0cbb4',background:'assets/lianxu-worlds.webp',artPosition:'50%',bossHp:64500,bossSpeed:71,mobScale:6.1,boss:'三相骨娘',bossGlyph:'相',bossRow:1,
    mobNames:{imp:'借骨刀客',fox:'赤瞳冢狼',snake:'骨针丧巫',zombie:'负棺魁卫'},
    theme:'三个人都记得同一生，究竟是谁偷了谁的身体？',
    story:['收身单把小果带入白骨荒冢。白幡下，一位母亲、一名商贩与一位老僧，都说自己曾是同一个人；他们连临终前的悔恨也一字不差。','三相骨娘把失名者的身体租给需要清白履历的人。买家换一张脸便能脱罪，原主的魂魄只能被封进心灯，替新主人继续受罚。','大圣曾在这里砸碎千面镜，却留下了一盏没有灭的灯：脸能买，骨能换，自己的疼却不能借。小果循着灯芯的金光，等待三相交替。'],
    lore:['母亲认得孩子的乳名，商贩认得欠账的笔迹，老僧认得祈愿的声音。三份记忆，都来自同一颗被切开的心。','租身契只写保修，不写归还。身体若毁，赔的是银钱，账上没有原主的性命。','千面镜的碎片照不见骨娘，只照见灯里的囚魂。大圣留下的裂口，仍让金光透进来。'],
    tell:'三相换身时，三座灯位只有带金色心核的青圈安全。连续跟随三次真灯换位，三相归一时可获3倍伤害；灰红灯位是借身假相。',
    mechanic:'认灯辨相：看金色心核，逐次移动至真正的心灯。',bossLine:'“脸是租的，债却是真的。你想替谁活下去？”',
    reveal:'三张脸同时碎裂，灯里走出的却是无数没有面孔的人。他们把最后一面镜子交给小果，镜背烙着宝象王城的黄袍印。',clue:{name:'宝象影籍镜',text:'换身只骗过活人，换影才能骗过天上的仙籍。阴阳并蒂莲的阳瓣映出宝象城：每一扇宫门，都把来者的影子留在门外。'},reward:'白骨不能证明谁有罪，记住自己受过的痛，才不会替恶人续命。',regions:['白幡葬阶','三相租身庭','千面镜坟','归骨心灯台'],siteNames:['三生同忆碑','不归还的租契','大圣碎镜痕','骨封遗匣','归魂药炉','归骨心灯台'],
    layout:{spawn:[.20,.82],hub:[.48,.50],left:[.18,.18],right:[.80,.76],boss:[.77,.21],main:[[.20,.82],[.35,.82],[.35,.65],[.48,.50],[.61,.50],[.61,.34],[.77,.21]],upper:[[.48,.50],[.33,.50],[.27,.33],[.18,.18]],lower:[[.48,.50],[.58,.67],[.70,.66],[.80,.76]]}},
  {id:'shadowcity',no:'拾伍',title:'宝象夺影',subtitle:'宝象失影城',place:'宝象国 · 失影王城',color:'#d9b5f1',background:'assets/lianxu-worlds.webp',artPosition:'100%',bossHp:74400,bossSpeed:73,mobScale:6.7,boss:'夺影黄袍使',bossGlyph:'影',bossRow:2,
    mobNames:{imp:'禁影刀侍',fox:'双尾影狞',snake:'镜弓星吏',zombie:'金镜殿卫'},
    theme:'仙籍上的圣人，为何踩着别人受苦的影子？',
    story:['宝象城的灯照着每一个人，却没有一个人留下影子。影籍镜映出城墙后的长廊：贵人的清白，正由贫民的影子跪着代偿。','夺影黄袍使以星官之名贩卖仙籍。他让借来的身体披上无罪的影，让真正的受难者在账册里永远作恶；流沙与白骨，原来都是他的货栈。','小果在御阶上找到大圣拒签的归名石。石上只有一句：若成佛要借别人的清白，这佛不成也罢。黄袍展开镜轮，试图把小果的剑与影分开。'],
    lore:['影税按灯油计算。灯越亮，被扣下的影越长；黑夜反倒成了城中唯一的藏身处。','御阶的仙籍没有生辰，只记替罪人。每多一位受封者，城外就少一扇有灯的窗。','归名石上留着猴毛，也留着两枚炉印。拒签的名字，将被送往平顶山的双炉重新炼过。'],
    tell:'黄袍在你脚下封影时先离开红印；第二拍金边青圈亮起，返回刚才的旧影。完成离影、归影后获得3倍伤害，别被延迟影矢逼乱步伐。',
    mechanic:'断灯归影：先离开脚下封印，再回旧影，不追着大妖跑。',bossLine:'“你杀得了一个我，杀得了仙籍上所有清白的人么？”',
    reveal:'镜轮崩裂，满城的影子越过灯火回到主人脚下。归名石上的两枚炉印开始发烫：账册的下一页，在平顶双炉谷。',clue:{name:'平顶双炉的归名石',text:'小果收起阴阳并蒂莲。名字、身体、影子终于重合，但双炉仍在替天改写姓名。合体篇已开启。修至炼虚九层圆满、突破合体后，可循炉印前往平顶双炉谷追查炼名买卖。'},reward:'炼虚篇已破。影子归来之后，众生终于能够站着说自己的名字。',regions:['扣影城门','无罪御街','镜税离宫','归名星殿'],siteNames:['灯油影税','无生辰仙籍','双炉归名石','离宫镜匣','复影灵泉','归名星殿'],
    layout:{spawn:[.17,.80],hub:[.46,.51],left:[.19,.18],right:[.81,.77],boss:[.80,.20],main:[[.17,.80],[.36,.80],[.36,.60],[.46,.51],[.63,.51],[.63,.30],[.80,.20]],upper:[[.46,.51],[.46,.29],[.31,.29],[.19,.18]],lower:[[.46,.51],[.59,.70],[.73,.70],[.81,.77]]}}
];
const LaterChapters=[...InfantChapters,...HuashenChapters,...LianxuChapters];

const LianxuArt=(()=>{
  const sheets=LianxuChapters.map(c=>{const im=new Image();im.src='assets/actors-'+c.id+'.webp';return im;}),props=new Image();props.src='assets/lianxu-props.webp';
  let uv=null,propUV=null;
  function configure(actors,objects){uv=actors;propUV=objects;}
  function drawActor(e,row,size){const i=(e.family??Journey.run.stage)-12,im=sheets[i];if(!im?.complete||!im.naturalWidth||!uv)return false;const col=e.action==='windup'?2:e.action==='strike'?3:e.moving?Math.floor((e.walkDistance||0)/30)%2:0,[x,y,w,h,px,py]=uv[i][row][col],scale=size/uv[i][row][0][3];ctx.drawImage(im,x,y,w,h,(x-px)*scale,(y-py)*scale,w*scale,h*scale);return true;}
  function drawProp(pen,o,stage){const i=stage-12,col={gate:0,tree:1,rock:1,lantern:2,shrine:3}[o.kind];if(col===undefined||!props.complete||!props.naturalWidth||!propUV)return false;const [x,y,w,h]=propUV[i][col],size=o.size||{gate:350,tree:300,rock:155,lantern:120,shrine:215}[o.kind],s=size/Math.max(w,h);pen.drawImage(props,x,y,w,h,-w*s/2,-h*s,w*s,h*s);return true;}
  function drawShot(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=2;
    if(s.theme===12){ctx.beginPath();ctx.moveTo(-19,8);ctx.quadraticCurveTo(0,-15,18,0);ctx.quadraticCurveTo(1,-5,-19,8);ctx.fill();}
    else if(s.theme===13){ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(13,-3);ctx.lineTo(19,0);ctx.lineTo(13,3);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(-13,0,4,0,Math.PI*2);ctx.stroke();}
    else {ctx.strokeStyle='#c8a665';ctx.beginPath();ctx.moveTo(-19,0);ctx.lineTo(18,0);ctx.lineTo(10,-5);ctx.moveTo(18,0);ctx.lineTo(10,5);ctx.stroke();ctx.fillStyle='#d7b0ef';ctx.fillRect(-10,-2,7,4);}ctx.restore();}
  function drawWard(t){if(G.telegraphs.some(q=>q.shape==='lianxu'&&q.life<t.life))return;const a=World.arena();ctx.save();ctx.strokeStyle='#ed8e80';ctx.fillStyle='#b8434d19';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.zoneRadius,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(t.markers)for(const m of t.markers){ctx.strokeStyle='#ac7d88';ctx.fillStyle='#5e263a50';ctx.beginPath();ctx.arc(m.x,m.y,t.safeRadius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#d3b4b0';ctx.font='24px KaiTi';ctx.textAlign='center';ctx.fillText('相',m.x,m.y+8);}
    const p=t.safe||t;ctx.strokeStyle='#b4ffe0';ctx.fillStyle='#62dcb02e';ctx.setLineDash([9,6]);ctx.lineWidth=3;
    if(t.safeMode==='outside'){ctx.strokeStyle='#f59f92';ctx.fillStyle='#ae3c433b';ctx.beginPath();ctx.arc(p.x,p.y,t.safeRadius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#a7eed4';ctx.beginPath();ctx.arc(p.x,p.y,t.safeRadius+48,0,Math.PI*2);ctx.stroke();}
    else {ctx.beginPath();ctx.arc(p.x,p.y,t.safeRadius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#f5d494';ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffdf9b';ctx.beginPath();ctx.arc(p.x,p.y,7+Math.sin(G.time*6)*2,0,Math.PI*2);ctx.fill();}
    ctx.setLineDash([]);const x=P.x,y=P.y-145;ctx.font='bold 16px KaiTi';ctx.textAlign='center';ctx.strokeStyle='#08151c';ctx.lineWidth=5;const label=t.label+' · '+Math.max(0,t.life).toFixed(1)+'秒';ctx.strokeText(label,x,y);ctx.fillStyle='#f3e5c9';ctx.fillText(label,x,y);
    if(t.safeMode!=='outside'&&Math.hypot(p.x-P.x,p.y-P.y)>t.safeRadius){const angle=Math.atan2(p.y-P.y,p.x-P.x);ctx.save();ctx.translate(P.x+Math.cos(angle)*80,P.y+Math.sin(angle)*80);ctx.rotate(angle);ctx.fillStyle='#b4ffe0';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-8);ctx.lineTo(-3,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.restore();}
    ctx.restore();}
  function drawEffect(e,p,fade){ctx.save();ctx.globalAlpha=fade*.7;ctx.strokeStyle=Journey.stages[e.chapterTheme].color;ctx.lineWidth=3;const r=Math.min(220,e.r||110)*(1+p*.4);
    if(e.chapterTheme===12){for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(e.x,e.y,r*(.5+i*.2),r*(.25+i*.1),0,0,Math.PI*2);ctx.stroke();}}
    else if(e.chapterTheme===13){for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*r*.3,e.y+Math.sin(a)*r*.3);ctx.lineTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r);ctx.stroke();}}
    else {ctx.translate(e.x,e.y);ctx.rotate(p*.5);ctx.strokeRect(-r*.65,-r*.65,r*1.3,r*1.3);ctx.rotate(Math.PI/4);ctx.strokeRect(-r*.5,-r*.5,r,r);}ctx.restore();}
  return {configure,drawActor,drawProp,drawShot,drawWard,drawEffect,loaded:()=>!!uv&&!!propUV&&sheets.every(s=>s.complete&&s.naturalWidth)&&props.complete&&props.naturalWidth};
})();

const LianxuGuardians=(()=>{
  const alive=e=>e&&e.hp>0&&!e.killed,point=(x,y)=>World.clipToArena({x,y},90);
  const inArena=p=>{const a=World.arena();return Math.hypot((p.x-a.cx)/a.rx,(p.y-a.cy)/a.ry)<=1;};
  function safe(t,p){const s=t.safe||t,d=Math.hypot(p.x-s.x,p.y-s.y);return t.safeMode==='outside'?d>t.safeRadius+(p.r||0):d<t.safeRadius-(p.r||0);}
  const wardHit=(t,p)=>inArena(p)&&Math.hypot(p.x-t.x,p.y-t.y)<t.zoneRadius+(p.r||0)&&!safe(t,p);
  function state(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=duration;e.attack=['windup','strike'].includes(name)?duration:0;}
  function clear(e){G.telegraphs=G.telegraphs.filter(t=>t.bossOwner!==e.id);G.eshots=G.eshots.filter(t=>t.bossOwner!==e.id);e.brain.pending=null;}
  function init(e){e.brain={round:1,breaks:0,attackIndex:0,token:0,pending:null,windowDamage:0,duelFailures:0};e.phase=1;state(e,'guard',1.6);}
  function hazard(e,p,o){const pending=e.brain.pending,life=Math.max(.65,o.life*Journey.difficulty().warning);Journey.hazard(p.x,p.y,{...o,life,total:life,boss:true,bossOwner:e.id,bossToken:pending.token,theme:Journey.run.stage%3,chapterTheme:Journey.run.stage,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1}});pending.expected++;pending.last=Math.max(pending.last,life);}
  function prepare(e,mechanism){const b=e.brain,local=Journey.run.stage-12,a=World.arena(),origin=point(P.x,P.y),angle=Math.atan2(P.y-e.y,P.x-e.x);e.attackAngle=angle;e.look=Math.cos(angle)<0?-1:1;
    b.pending={token:++b.token,kind:mechanism?['tides','faces','shadow'][local]:'assault',mechanism,expected:0,impacts:0,passed:true,last:0};b.mechanismReady=mechanism;
    if(mechanism&&local===0){for(let i=0;i<3;i++)hazard(e,{x:a.cx,y:a.cy},{shape:'lianxu',zoneRadius:900,r:180,safeMode:i===1?'outside':'inside',safeRadius:[170,265,190][i],dmg:52,life:3.5+i*2.5,label:['一潮 · 进入青圈','二潮 · 退出红圈','三潮 · 返回青圈'][i],bossSkill:'sunken-tides'});}
    else if(mechanism&&local===1){const markers=[0,1,2].map(i=>point(a.cx+Math.cos(-Math.PI/2+i*Math.PI*2/3)*255,a.cy+Math.sin(-Math.PI/2+i*Math.PI*2/3)*205));for(let i=0;i<3;i++)hazard(e,{x:a.cx,y:a.cy},{shape:'lianxu',zoneRadius:900,r:130,safeMode:'inside',safe:markers[(i+b.round-1)%3],safeRadius:115,markers,dmg:54,life:3.6+i*2.7,label:['初相 · 寻金色心灯','换相 · 跟随真灯','归相 · 守住心灯'][i],bossSkill:'whitebone-faces'});}
    else if(mechanism){hazard(e,origin,{shape:'lianxu',zoneRadius:900,r:150,safeMode:'outside',safeRadius:150,dmg:55,life:1.65,label:'封影 · 离开红印',bossSkill:'shadow-leave'});hazard(e,origin,{shape:'lianxu',zoneRadius:900,r:150,safeMode:'inside',safeRadius:150,dmg:58,life:4.1,label:'断灯 · 返回旧影',bossSkill:'shadow-return'});}
    else if(local===0){for(let i=0;i<2;i++)hazard(e,e,{shape:'line',angle:angle+(i?-.48:.48),length:470,r:42,dmg:48,life:1.15+i*.8,label:i?'回铲水刃 · 延迟横扫':'沉籍铲浪 · 方向锁定',bossSkill:'sunken-shovel'});if(e.phase===2)hazard(e,origin,{r:115,dmg:42,life:2.6,label:'沉名漩涡 · 离开落点'});}
    else if(local===1){for(let i=-1;i<=1;i++)hazard(e,e,{shape:'line',angle:angle+i*.45,length:455,r:27,dmg:47,life:1.3+Math.abs(i)*.5,label:'白骨三针 · 从扇隙穿过',bossSkill:'whitebone-needles'});if(e.phase===2)hazard(e,origin,{r:130,dmg:49,life:2.55,label:'借身骨牢 · 延迟落地'});}
    else {for(let i=0;i<2;i++)hazard(e,e,{shape:'line',angle:angle+i*Math.PI/2,length:500,r:37,dmg:51,life:1.25+i*.85,label:i?'镜轮回照 · 留意第二斩':'黄袍裂影 · 方向锁定',bossSkill:'shadow-mirror'});if(e.phase===2)hazard(e,origin,{r:140,dmg:50,life:2.8,label:'旧影反噬 · 勿留原地'});}
    state(e,'windup',Math.min(...G.telegraphs.filter(t=>t.bossOwner===e.id&&t.bossToken===b.pending.token).map(t=>t.life)));
    if(mechanism)Sound.omen(Journey.run.stage);
  }
  function finish(e){const b=e.brain,p=b.pending;if(p?.mechanism&&p.impacts===p.expected&&p.passed){clear(e);b.breaks++;b.windowDamage=0;state(e,'exposed',Bosses.profiles[Journey.run.difficulty].window);Sound.weakness(Journey.run.stage);addText(e.x,e.y-155,['潮退归名','三相归骨','旧影归身'][Journey.run.stage-12]+' · 伤害3倍',Journey.stage().color,20);Motion.emit('blast',e.x,e.y,{r:150,duration:.9,color:Journey.stage().color});return;}
    if(p?.mechanism){b.duelFailures++;addText(e.x,e.y-155,'破招未成 · 仍可持续攻击','#dec6ab',16);}b.pending=null;b.mechanismReady=false;state(e,'guard',e.phase===2?.85:1.25);}
  function update(e,dt){if(!e.brain)init(e);if(!alive(e))return;const b=e.brain;if(e.phase===1&&e.hp<=e.maxHp*.5){e.phase=2;Sound.guardian(Journey.run.stage,true);addText(e.x,e.y-160,Journey.stage().boss+' · 怒相',Journey.stage().color,20);}e.actionT+=dt;
    if(e.action==='exposed'){if(e.actionT>=e.actionDuration){b.round++;clear(e);b.mechanismReady=false;state(e,'guard',1.2);}return;}
    if(e.action==='guard'){const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);if(d>300){const old={x:e.x,y:e.y},v=World.steer(e,P.x,P.y);e.x+=v.x*e.speed*dt;e.y+=v.y*e.speed*dt;World.resolve(e);e.moving=true;}else e.moving=false;if(e.actionT>=e.actionDuration){e.moving=false;b.attackIndex++;prepare(e,b.attackIndex%3===0);}}
    else if(e.action==='windup'&&e.actionT>=e.actionDuration)state(e,'strike',Math.max(.4,b.pending.last-e.actionDuration+.2));
    else if(e.action==='strike'&&e.actionT>=e.actionDuration)state(e,'recover',.9);
    else if(e.action==='recover'&&e.actionT>=e.actionDuration)finish(e);
  }
  function onImpact(t,hit){const e=G.boss,p=e?.brain?.pending;if(!alive(e)||!p||t.bossOwner!==e.id||t.bossToken!==p.token)return;p.impacts++;p.passed=p.passed&&!hit;if(t.shape==='lianxu')p.passed=p.passed&&inArena(P)&&safe(t,P)&&Math.hypot(P.x-t.x,P.y-t.y)<t.zoneRadius;}
  function hud(e){const b=e?.brain;if(!b)return {title:'全程可攻击',hint:Journey.stage().tell,progress:0};const exposed=e.action==='exposed',p=b.pending,remaining=Math.max(0,e.actionDuration-e.actionT);return {title:exposed?'破绽 · 伤害3倍 · '+remaining.toFixed(1)+'秒':p?.mechanism?['吞名潮 · 进退进','三相换身 · 跟随金灯','断灯归影 · 离开再返回'][Journey.run.stage-12]:'可持续攻击 · 留意锁向与延迟招式',hint:Journey.stage().bonusTell,progress:exposed?remaining/e.actionDuration:p?.mechanism?p.impacts/p.expected:0,helpers:0,exposed,remaining:exposed?remaining:0,breaks:b.breaks,round:b.round,action:e.action};}
  return {init,update,onImpact,onHelperKilled(){},filterDamage:(e,d)=>e.locked?0:d,hud,wardHit,safe,inArena};
})();
LianxuChapters.forEach((c,i)=>{const s=i+12;Sound.registerCaption('stage-'+s,'说书人',c.story[0]);Sound.registerCaption('boss-'+s,c.boss,c.bossLine);Sound.registerCaption('phase-'+s,c.boss,['名字沉下去，谁还能为你作证？','三张脸都是真的，只有命不是自己的！','灯火由我，清白也由我！'][i]);Sound.registerCaption('omen-'+s,'剑仙',['进青圈，退红圈，再回青圈！','看金色心灯，跟上真身！','先离开脚下影印，再返回旧影！'][i]);Sound.registerCaption('weakness-'+s,'剑仙',['潮退了，把名字还回来！','三相归一，斩断租身契！','旧影归身，击碎仙籍镜！'][i]);Sound.registerCaption('victory-'+s,'说书人',c.reveal);});
