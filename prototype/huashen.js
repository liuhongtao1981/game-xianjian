/* 化神篇：人券、婚契与伪造天劫；每关独立路线、怪群与破招规则。 */
const HuashenChapters=[
  {id:'contract',no:'拾',title:'高庄卖命',subtitle:'血契高庄',place:'高老庄 · 封券血庄',color:'#d99d81',background:'assets/huashen-worlds.webp',artPosition:'0%',bossHp:34000,bossSpeed:59,mobScale:4.05,boss:'人券庄主',bossGlyph:'券',bossRow:0,
    mobNames:{imp:'押券刀役',fox:'赤蜡契豺',snake:'朱印契师',zombie:'秤命仓卫'},
    theme:'签下卖身契的，是活人，还是被偷走的一生？',
    story:['愿骨洞的木简把孙小果引到高庄。门口不收银钱，只量人的影子；影长一寸，便能抵一年的粮。','人券庄主许诺替百姓免去天灾，条件是交出尚未活过的年岁。仓里没有粮，只有一卷卷会心跳的人券。','大圣曾拒绝在这里按印，庄主便把石猴的手印刻成章。小果展开元神，看见每张契纸背后，都有一道通向虚空的裂缝。'],
    lore:['庄口的秤砣没有重量，只有名字。名字越完整，能借到的粮越少。','封券仓里记着同一个赎契日：明日。庄主每夜都把这一页重新抄一遍。','大圣的指印只有四道纹。他从未按下第五指，是有人替他补成了认罪的掌印。'],
    tell:'把庄主锁定的朱印落点引到三座人券台，再离开印圈，让它反盖销契；三台销尽后避过两道断契横线，收印时获得3倍伤害。',mechanic:'反印销契：引朱印反盖人券台，再避尽双线；清除预警不能冒充反盖。',bossLine:'“活过的日子归你，没活过的日子归我。”',
    reveal:'最后一道印落下，所有人券同时变成白纸。庄主的影子缩成一枚铜钱，背面刻着喜堂的聘字。',clue:{name:'被抵押的婚帖',text:'福陵喜堂把寿数写成聘礼。孙小果带着虚空晶髓循红线入山：有人正用一场永不结束的婚宴，借走整个村庄的明天。'},reward:'虚空晶髓从伪契裂口凝成，归还的第一年，终于属于签字的人。',regions:['秤影庄口','封券仓院','赎契荒田','反印公堂'],siteNames:['秤命旧砣','明日赎契簿','残缺掌印','封券供匣','赎契药舍','反印公堂'],
    layout:{spawn:[.17,.80],hub:[.42,.58],left:[.20,.20],right:[.79,.78],boss:[.79,.21],main:[[.17,.80],[.30,.81],[.31,.64],[.42,.58],[.57,.62],[.61,.41],[.70,.29],[.79,.21]],upper:[[.42,.58],[.27,.48],[.32,.34],[.20,.20]],lower:[[.42,.58],[.54,.76],[.66,.81],[.79,.78]]}},
  {id:'wedding',no:'拾壹',title:'福陵借寿',subtitle:'福陵喜堂',place:'福陵山 · 借寿喜堂',color:'#e4a0b5',background:'assets/huashen-worlds.webp',artPosition:'50%',bossHp:40200,bossSpeed:63,mobScale:4.5,boss:'吞愿耙魇',bossGlyph:'耙',bossRow:1,
    mobNames:{imp:'迎煞喜仆',fox:'赤鬃奔豕',snake:'纸嫁缠魂',zombie:'抬轿魁卫'},
    theme:'百年好合的誓词，为何每天都要少一个人来念？',
    story:['福陵喜堂的灯从不熄灭。每到子夜，席上的客人便年轻一天，席下的村民却老去一年。','吞愿耙魇本是替人担债的山灵，被喜契锁成了永远迎亲的新郎。它每挥一次九齿耙，红绸便替它扣下一段别人的寿数。','孙小果看见大圣用酒划在桌上的字：让被借走的明日，自己回来。小果绕到红绸之后，等那柄不肯停下的耙。'],
    lore:['聘礼单上没有金银：新娘三十年，宾客各十年，证婚者终身。最后一栏仍空着。','婚席的酒碗映不出脸，只映出尚未来到的白发。喝得越多，失去的明日越长。','耙齿上缠着喜堂最初的红绸。山灵没有签过婚契，却被写成了所有借寿人的担保。'],
    tell:'站在红绸桩后诱导锁向耙沟，横移避开，让耙齿割断三条婚契；再避开交错迎亲斩与合卺震地，收耙时获得3倍伤害。',mechanic:'借耙断绸：锁向耙沟可割婚契，双斩震地后收耙露隙。',bossLine:'“我替他们担了一回，怎么就要担到天荒？”',
    reveal:'三条红绸落地，喜堂第一次响起散席的钟。耙魇把自己的獠牙折下，递给小果：风里还有更大的借条。',clue:{name:'黄风劫税单',text:'黄风岭把沙灾说成天罚，以献出元神换取背风石的位置。虚空晶髓的断面，映出一个仍在收税的天劫印。'},reward:'不是所有红线都通向姻缘；有的红线，终于可以亲手割断。',regions:['返龄山阶','借寿喜庭','红绸旧寨','合卺耙殿'],siteNames:['无金聘礼','照寿酒碗','旧绸耙痕','陪嫁漆匣','散席药炉','合卺耙殿'],
    layout:{spawn:[.22,.82],hub:[.49,.52],left:[.20,.18],right:[.81,.73],boss:[.76,.22],main:[[.22,.82],[.36,.73],[.32,.58],[.49,.52],[.54,.36],[.66,.38],[.76,.22]],upper:[[.49,.52],[.38,.42],[.30,.30],[.20,.18]],lower:[[.49,.52],[.60,.64],[.72,.59],[.81,.73]]}},
  {id:'yellowwind',no:'拾贰',title:'黄风窃神',subtitle:'黄风沙海',place:'黄风岭 · 窃神沙关',color:'#e8c57e',background:'assets/huashen-worlds.webp',artPosition:'100%',bossHp:47400,bossSpeed:66,mobScale:5,boss:'黄风听骨王',bossGlyph:'风',bossRow:2,
    mobNames:{imp:'沙税鼠卒',fox:'裂风砂狐',snake:'空喉风师',zombie:'负碑砂将'},
    theme:'所谓天罚，为何总在收完劫税后准时停下？',
    story:['黄风岭没有日历，只有一张张劫税单。沙暴按收税人的钟点升起，交不出元神的人，便被写成逆天者。','听骨王把众生的惊惧吹进空喉，借一枚伪造的天劫印发号施令。它听得见骨头，却听不见被风卷走的姓名。','三块背风石里压着大圣的掌痕。孙小果不再仰头问天，转身读风：灾若有价，就一定有人在操纵风向。'],
    lore:['沙关石碑刻着历年天罚。每一次风停，都比账簿的结算时刻晚一息。','背风石曾被凿去藏身的位置，逼人买路。大圣把缺口重新挖开，还留下三道逆风刻痕。','天劫印的内壁写着工匠姓名。所谓天意，竟也有制作者与验收官。'],
    tell:'辨认沙幕箭头，站在背风石下风侧的青色阴影内，连续避过三次换向黄风；切勿贴在迎风面或远离沙关。第三阵风尽时获得3倍伤害。',mechanic:'读风藏神：三阵黄风分别换向，三次真实站进背风阴影才算破招；闪避无敌和清屏不能代替读风。',bossLine:'“你们叫它天劫，我只管按时收账。”',
    reveal:'天劫印碎成虚空晶髓，黄风第一次没有依账簿停下。小果看见流沙河的方向，有一艘载满空白名牌的船正逆流而行。',clue:{name:'流沙沉名渡的空牌',text:'伪造天劫的晶髓来自流沙河底。修至化神九层圆满、突破炼虚后，下一段路将通向被沉没的姓名。炼虚篇制作中，尚未开放。'},reward:'化神篇已破。风停之后，人的姓名仍该由自己说出。',regions:['劫税沙关','刻风遗窟','听骨荒原','伪劫风坛'],siteNames:['天罚时刻碑','大圣逆风痕','天劫工匠铭','砂封晶匣','背风灵泉','伪劫风坛'],
    layout:{spawn:[.15,.75],hub:[.43,.47],left:[.18,.17],right:[.80,.80],boss:[.81,.23],main:[[.15,.75],[.29,.69],[.31,.53],[.43,.47],[.55,.51],[.66,.37],[.81,.23]],upper:[[.43,.47],[.32,.38],[.34,.25],[.18,.17]],lower:[[.43,.47],[.51,.65],[.64,.73],[.80,.80]]}}
];
const LaterChapters=[...InfantChapters,...HuashenChapters];

const HuashenArt=(()=>{
  const sheets=HuashenChapters.map(c=>{const im=new Image();im.src='assets/actors-'+c.id+'.webp';return im;}),props=new Image();props.src='assets/huashen-props.webp';
  let uv=null,propUV=null;
  function configure(actors,objects){uv=actors;propUV=objects;}
  function drawActor(e,row,size){const i=(e.family??Journey.run.stage)-9,im=sheets[i];if(!im?.complete||!im.naturalWidth||!uv)return false;const col=e.action==='windup'?2:e.action==='strike'?3:e.moving?Math.floor((e.walkDistance||0)/30)%2:0,rect=uv[i][row][col],[x,y,w,h,px,py]=rect,scale=size/uv[i][row][0][3];ctx.drawImage(im,x,y,w,h,(x-px)*scale,(y-py)*scale,w*scale,h*scale);return true;}
  function drawHelper(e){const local=e.family-9;ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle=HuashenChapters[local].color;ctx.fillStyle=local===2?'#78644a':'#33262b';ctx.lineWidth=2;
    if(!drawProp(ctx,{kind:local===0?'shrine':local===1?'lantern':'rock',size:local===0?115:150},e.family)){
    if(local===0){ctx.fillRect(-29,-18,58,20);ctx.strokeRect(-29,-18,58,20);ctx.fillStyle='#c5ad84';ctx.fillRect(-17,-59,34,40);ctx.strokeRect(-17,-59,34,40);ctx.strokeStyle='#a14e46';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-9,-50+i*10);ctx.lineTo(9,-50+i*10);ctx.stroke();}}
    else if(local===1){ctx.fillRect(-6,-90,12,94);ctx.strokeRect(-6,-90,12,94);ctx.strokeStyle='#e5a6b2';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-75);ctx.bezierCurveTo(-50,-115,50,-120,0,-75);ctx.stroke();ctx.strokeStyle='#e2738c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-75);ctx.quadraticCurveTo(Math.sin(G.time*2+e.id)*35,-40,19,-5);ctx.stroke();}
    else {ctx.beginPath();ctx.moveTo(-35,3);ctx.lineTo(-27,-57);ctx.lineTo(0,-87);ctx.lineTo(33,-60);ctx.lineTo(39,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#7dd3cf';ctx.beginPath();ctx.moveTo(-11,-13);ctx.lineTo(8,-32);ctx.lineTo(0,-56);ctx.lineTo(15,-68);ctx.stroke();}
    }
    ctx.fillStyle='#ecdbb6';ctx.textAlign='center';ctx.font='13px KaiTi';ctx.fillText(e.name,0,local===1?-113:-101);ctx.restore();}
  function drawProp(pen,o,stage){const i=stage-9,col={gate:0,tree:1,rock:1,lantern:2,shrine:3}[o.kind];if(col===undefined||!props.complete||!props.naturalWidth||!propUV)return false;const [x,y,w,h]=propUV[i][col],size=o.size||{gate:350,tree:330,rock:160,lantern:110,shrine:210}[o.kind],s=size/Math.max(w,h);pen.drawImage(props,x,y,w,h,-w*s/2,-h*s,w*s,h*s);return true;}
  function drawShot(s){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=2;if(s.theme===9){ctx.fillRect(-10,-7,20,14);ctx.strokeStyle='#734333';ctx.strokeRect(-5,-4,9,8);}else if(s.theme===10){ctx.beginPath();ctx.moveTo(-18,4);ctx.bezierCurveTo(-8,-14,7,12,16,-3);ctx.stroke();ctx.beginPath();ctx.arc(9,0,4,0,Math.PI*2);ctx.fill();}else {ctx.beginPath();ctx.moveTo(-17,7);ctx.quadraticCurveTo(17,-19,17,3);ctx.quadraticCurveTo(1,-2,-17,7);ctx.stroke();}ctx.restore();}
  function shade(t,p){return (t.shelters||[]).some(h=>{const dx=p.x-h.x,dy=p.y-h.y,a=t.windAngle,along=dx*Math.cos(a)+dy*Math.sin(a),across=-dx*Math.sin(a)+dy*Math.cos(a);return along>52+(p.r||0)&&along<218-(p.r||0)&&Math.abs(across)<76-(p.r||0);});}
  function drawStorm(t){if(G.telegraphs.some(q=>q.shape==='sandstorm'&&q.life<t.life))return;const a=World.arena(),p=1-t.life/t.total;ctx.save();ctx.fillStyle='#d0a75018';ctx.beginPath();ctx.ellipse(a.cx,a.cy,a.rx,a.ry,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e7c67c88';ctx.lineWidth=1.5;
    for(let i=0;i<(W<650?15:30);i++){const x=a.cx+Math.sin(i*7.3)*a.rx*.85,y=a.cy+Math.cos(i*4.3)*a.ry*.85,l=40+p*75;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(t.windAngle)*l,y+Math.sin(t.windAngle)*l);ctx.lineTo(x+Math.cos(t.windAngle)*l-Math.cos(t.windAngle-.5)*11,y+Math.sin(t.windAngle)*l-Math.sin(t.windAngle-.5)*11);ctx.stroke();}
    for(const h of t.shelters){ctx.save();ctx.translate(h.x,h.y);ctx.rotate(t.windAngle);ctx.fillStyle='#71ddc045';ctx.strokeStyle='#acffdf';ctx.fillRect(68,-62,135,124);ctx.strokeRect(68,-62,135,124);ctx.restore();}
    // Readable against bright sand, including at the mobile camera's scale.
    ctx.save();ctx.translate(P.x+94,P.y-95);ctx.fillStyle='#211c14eb';ctx.strokeStyle='#ecd18b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(t.windAngle);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.lineTo(7,-10);ctx.moveTo(18,0);ctx.lineTo(7,10);ctx.stroke();ctx.restore();ctx.fillStyle='#f4e1b0';ctx.textAlign='center';ctx.font='bold 14px KaiTi';ctx.strokeStyle='#211c14';ctx.lineWidth=4;ctx.strokeText('风向',P.x+94,P.y-52);ctx.fillText('风向',P.x+94,P.y-52);ctx.font='15px KaiTi';ctx.fillText(t.label,a.cx,a.cy-330);ctx.restore();}
  function drawEffect(e,p,fade){ctx.save();ctx.strokeStyle=Journey.stages[e.chapterTheme].color;ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=fade*.8;ctx.lineWidth=3;
    if(e.chapterTheme===9){ctx.translate(e.x,e.y);ctx.rotate(-.15);ctx.strokeRect(-45,-80-p*35,90,90);ctx.font='bold 44px KaiTi';ctx.textAlign='center';ctx.fillText('销',0,-20-p*35);}
    else if(e.chapterTheme===10){ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(-120,-90+i*22);ctx.bezierCurveTo(-10,-110+i*22,90,40+i*22,160,40+i*22);ctx.stroke();}}
    else {const r=e.r>1000?170:e.r||110;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7+p*3;ctx.beginPath();ctx.ellipse(e.x+Math.cos(angle)*r*.6,e.y+Math.sin(angle)*r*.45,55,15,angle,0,Math.PI*1.7);ctx.stroke();}}ctx.restore();}
  return {configure,drawActor,drawHelper,drawProp,drawShot,shade,drawStorm,drawEffect,loaded:()=>!!uv&&!!propUV&&sheets.every(s=>s.complete&&s.naturalWidth)&&props.complete&&props.naturalWidth};
})();

const HuashenGuardians=(()=>{
  const alive=e=>e&&e.hp>0&&!e.killed,config=()=>Bosses.profiles[Journey.run.difficulty]||Bosses.profiles.normal;
  const inArena=p=>{const a=World.arena();return Math.hypot((p.x-a.cx)/a.rx,(p.y-a.cy)/a.ry)<=1;};
  const stormHit=(t,p)=>inArena(p)&&!HuashenArt.shade(t,p);
  const helpers=e=>G.enemies.filter(h=>alive(h)&&h.bossHelper&&h.bossOwner===e.id),point=(x,y)=>World.clipToArena({x,y},80);
  function state(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=duration;e.attack=['windup','strike'].includes(name)?duration:0;}
  function say(e,text){addText(e.x,e.y-160,text,Journey.stage().color,18);}
  function clear(e){G.telegraphs=G.telegraphs.filter(t=>t.bossOwner!==e.id);G.eshots=G.eshots.filter(t=>t.bossOwner!==e.id);e.brain.pending=null;}
  function summon(e){const local=Journey.run.stage-9,a=World.arena();for(const h of G.enemies.filter(h=>h.bossHelper&&h.bossOwner===e.id)){h.hp=0;h.killed=true;}for(let i=0;i<3;i++){const angle=-Math.PI/2+i*Math.PI*2/3,p=point(a.cx+Math.cos(angle)*300,a.cy+Math.sin(angle)*240);G.enemies.push({id:G.uid++,type:'imp',family:Journey.run.stage,name:['人券台','婚契红绸','背风石'][local],bossHelper:true,bossOwner:e.id,locked:true,...p,r:local===2?38:25,hp:1,maxHp:1,xp:0,dmg:0,speed:0,flash:0,action:'guard'});}Object.assign(e.brain,{helperTotal:3,helperBroken:0,mechanismReady:false});}
  function init(e){e.brain={theme:Journey.run.stage%3,round:1,breaks:0,attackIndex:0,token:0,pending:null,helperTotal:3,helperBroken:0,mechanismReady:false,windowDamage:0,duelFailures:0};e.phase=1;state(e,'guard',1.5);summon(e);}
  function open(e){clear(e);e.brain.breaks++;e.brain.windowDamage=0;state(e,'exposed',config().window);Sound.weakness(Journey.run.stage);say(e,['反印销契 · 公堂露隙','红绸已断 · 收耙露隙','黄风已尽 · 伪劫露隙'][Journey.run.stage-9]);Motion.emit('blast',e.x,e.y,{r:130,duration:.9,color:Journey.stage().color});}
  function hazard(e,p,o){const b=e.brain.pending,life=Math.max(.65,o.life*Journey.difficulty().warning);Journey.hazard(p.x,p.y,{...o,life,total:life,boss:true,bossOwner:e.id,bossToken:b.token,theme:Journey.run.stage%3,chapterTheme:Journey.run.stage,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1}});b.expected++;b.last=Math.max(b.last,life);}
  function prepare(e,kind,mechanism=false){const b=e.brain,a=Math.atan2(P.y-e.y,P.x-e.x),p=point(P.x,P.y);e.attackAngle=a;e.look=Math.cos(a)<0?-1:1;b.pending={token:++b.token,kind,mechanism,expected:0,impacts:0,passed:true,last:0,origin:{x:e.x,y:e.y},age:0};
    if(kind==='stamp'){hazard(e,p,{r:126,dmg:42,life:1.25,label:'朱印锁定 · 引到券台后离圈',bossSkill:'contract-stamp'});if(e.phase===2)hazard(e,point(p.x+160,p.y-80),{r:88,dmg:36,life:1.95,label:'追债副印 · 延迟落章',bossSkill:'contract-after'});}
    else if(kind==='verdict'){for(let i=0;i<2;i++)hazard(e,e,{shape:'line',angle:a+i*Math.PI/2,length:480,r:42,dmg:44,life:1.25+i*.65,label:i?'断契纵线 · 等待收印':'断契横线 · 方向已锁',bossSkill:'contract-verdict'});}
    else if(kind==='rake'){const end=point(e.x+Math.cos(a)*680,e.y+Math.sin(a)*680),length=Math.hypot(end.x-e.x,end.y-e.y);b.pending.dash=end;hazard(e,{x:(end.x+e.x)/2,y:(end.y+e.y)/2},{shape:'line',angle:a,length:length/2,r:58,dmg:45,life:1.35,label:'九齿耙沟 · 引向红绸后横移',bossSkill:'wedding-rake'});}
    else if(kind==='feast'){for(let i=0;i<2;i++)hazard(e,e,{shape:'line',angle:a+(i?-.7:.7),length:440,r:42,dmg:42,life:1.3+i*.65,label:i?'送客回斩 · 勿急回身':'迎亲横斩 · 方向已锁',bossSkill:'wedding-feast'});hazard(e,p,{r:150,dmg:47,life:2.65,label:'合卺震地 · 避开落点',bossSkill:'wedding-feast'});}
    else if(kind==='sand'){hazard(e,p,{r:115,dmg:42,life:1.15,label:'窃神砂柱 · 离开落点',bossSkill:'wind-pillar'});for(let i=-1;i<=1;i++)hazard(e,e,{shape:'line',angle:a+i*.40,length:430,r:24,dmg:37,life:1.75,label:'听骨风刃 · 锁向三岔',bossSkill:'wind-blade'});}
    else if(kind==='storm'){const shelters=helpers(e).map(h=>({x:h.x,y:h.y}));for(let i=0;i<3;i++)hazard(e,World.bossPoint(),{shape:'sandstorm',r:2200,windAngle:[-.65,.55,2.1][(i+b.round-1)%3],shelters,dmg:48,life:1.65+i*1.75,label:['第一阵黄风 · 读箭头藏到石后','第二阵换向 · 重新寻找背风面','第三阵换向 · 风尽后反击'][i],bossSkill:'wind-storm'});}
    const first=Math.min(...G.telegraphs.filter(t=>t.bossOwner===e.id&&t.bossToken===b.pending.token).map(t=>t.life));state(e,'windup',first);say(e,{stamp:'反盖朱印',verdict:'双线断契',rake:'借耙断绸',feast:'迎亲送客',sand:'听骨窃神',storm:'黄风三转'}[kind]);}
  function finish(e){const b=e.brain,p=b.pending;if(p?.mechanism&&p.impacts===p.expected&&p.passed&&(Journey.run.stage===11||!helpers(e).length)){open(e);return;}if(p?.mechanism){b.duelFailures++;b.counterDue=true;say(e,'破招未成 · '+(Journey.run.stage===11?'须三次站进真实背风面':'避尽整轮再反击'));}b.pending=null;state(e,'guard',e.phase===2?.8:1.15);}
  function update(e,dt){if(!e.brain)init(e);if(!alive(e))return;const b=e.brain,local=Journey.run.stage-9;if(e.phase===1&&e.hp<=e.maxHp*.5){e.phase=2;Sound.guardian(Journey.run.stage,true);say(e,Journey.stage().boss+' · 怒相');}e.actionT+=dt;if(b.pending)b.pending.age+=dt;
    if(e.action==='exposed'){if(e.actionT>=e.actionDuration){b.round++;clear(e);state(e,'guard',1.2);summon(e);}return;}
    if(local!==2&&!helpers(e).length&&!b.mechanismReady){b.mechanismReady=true;Sound.omen(Journey.run.stage);}
    if(e.action==='guard'&&e.actionT>=e.actionDuration){b.attackIndex++;if(local===2){const storm=b.attackIndex%3===0&&!b.counterDue;b.counterDue=false;b.mechanismReady=storm;prepare(e,storm?'storm':'sand',storm);}else prepare(e,local===0?(b.mechanismReady?'verdict':'stamp'):(b.mechanismReady||b.attackIndex%3===0?'feast':'rake'),b.mechanismReady);}
    else if(e.action==='windup'&&e.actionT>=e.actionDuration)state(e,'strike',Math.max(.4,b.pending.last-e.actionDuration+.2));
    else if(e.action==='strike'){const p=b.pending;if(p?.dash){const t=Math.min(1,e.actionT/.45);e.x=p.origin.x+(p.dash.x-p.origin.x)*t;e.y=p.origin.y+(p.dash.y-p.origin.y)*t;}if(e.actionT>=e.actionDuration)state(e,'recover',1);}
    else if(e.action==='recover'&&e.actionT>=e.actionDuration)finish(e);
  }
  function onImpact(t,hit){const e=G.boss,p=e?.brain?.pending;if(!alive(e)||!p||t.bossOwner!==e.id||t.bossToken!==p.token)return;p.impacts++;p.passed=p.passed&&!hit;
    if(t.bossSkill==='contract-stamp')for(const h of helpers(e))if(Math.hypot(h.x-t.x,h.y-t.y)<t.r-h.r)killEnemy(h);
    if(t.bossSkill==='wedding-rake')for(const h of helpers(e)){const dx=h.x-t.x,dy=h.y-t.y;if(Math.abs(dx*Math.cos(t.angle)+dy*Math.sin(t.angle))<t.length+h.r&&Math.abs(-dx*Math.sin(t.angle)+dy*Math.cos(t.angle))<t.r+h.r)killEnemy(h);}
    if(t.bossSkill==='wind-storm')p.passed=p.passed&&HuashenArt.shade(t,P)&&inArena(P);
  }
  function onHelperKilled(h){const e=G.boss;if(e?.brain&&h.bossOwner===e.id)e.brain.helperBroken++;}
  function filterDamage(e,d){return e.locked?0:d;}
  function hud(e){const b=e?.brain;if(!b)return {title:'全程可攻击',hint:Journey.stage().tell,progress:0};const exposed=e.action==='exposed',left=helpers(e).length,storm=b.pending?.kind==='storm',remaining=Math.max(0,e.actionDuration-e.actionT);return {title:exposed?'破绽 · 伤害3倍 · '+remaining.toFixed(1)+'秒':Journey.run.stage===11?(storm?'三阵换向 · 守住青色背风面':'可攻击 · 留意下一轮黄风'):left?'可攻击 · '+['人券台','婚契红绸'][Journey.run.stage-9]+' '+left+'/3':'诱尽整轮 · 收势增伤',hint:'命中持续扣血 · '+(Journey.stage().bonusTell||Journey.stage().tell),progress:exposed?Math.max(0,1-e.actionT/e.actionDuration):storm?(b.pending.impacts||0)/3:(3-left)/3,helpers:left,exposed,remaining:exposed?remaining:0,breaks:b.breaks,round:b.round,action:e.action};}
  return {init,update,onImpact,onHelperKilled,filterDamage,hud,shade:HuashenArt.shade,stormHit};
})();

HuashenChapters.forEach((c,i)=>{const stage=i+9;Sound.registerCaption('stage-'+stage,'说书人',c.story[0]);Sound.registerCaption('boss-'+stage,c.boss,c.bossLine);Sound.registerCaption('phase-'+stage,c.boss,['一生已押，朱印追债！','婚契未散，谁能离席！','风向由我，天罚也由我！'][i]);Sound.registerCaption('omen-'+stage,'剑仙',['三台销尽，避过断契双线。','红绸已断，等它收耙。','看风向，去石后的青色阴影。'][i]);Sound.registerCaption('weakness-'+stage,'剑仙',['反印已成，斩断人券！','耙势已尽，把明日还来！','三阵风尽，斩碎伪劫印！'][i]);Sound.registerCaption('victory-'+stage,'说书人',c.reveal);});
