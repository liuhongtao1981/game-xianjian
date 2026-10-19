/* 元婴篇：章节、独立地图布局与三种可验证的守关仪式。 */
const InfantChapters=[
  {id:'wish',no:'柒',title:'禅院焚愿',subtitle:'焚愿禅院',place:'观音禅院 · 焚愿禅院',color:'#e6a26d',background:'assets/infant-worlds.webp',artPosition:'0%',bossHp:19000,bossSpeed:60,mobScale:2.9,boss:'阴愿主使',bossGlyph:'愿',bossRow:0,
    mobNames:{imp:'燃愿沙弥',fox:'灰绸火狐',snake:'香灰咒师',zombie:'执烛法卫'},
    theme:'人们求来的平安，为何都写成了别人的灾？',
    story:['白蛟吐出的袈裟角，把孙小果引进一座永不天明的禅院。每烧掉一条许愿红绸，功德簿上便多一笔收入。','阴愿主使以香火换平安，却把灾祸转给没有姓名的人。大圣留下的剑痕指向地下：账不在佛前，在灯下。','一株养魂神木从灰烬里长出，树皮记着被抹掉的愿。小果护住新芽：今日先让这些人，把自己的愿认回去。'],
    lore:['香客的愿签被裁成两半：上半写平安，下半写抵命。两半从来不交给同一个人。','净灯台的旧刻记着大圣的话：灯若照不见人，只照得见账，便该熄了。','神木年轮里藏着数百道童声。有人以为它们在诵经，其实是在报自己的姓名。'],
    tell:'靠近三盏净愿灯持续净化，扰乱香火阵；随后躲过两道锁向十字焚线，待主使收炉露出破绽。',mechanic:'净灯断香：近身净化三灯，再避过完整十字焚线；清掉预警不算破招。',bossLine:'“有人替你受难，你的愿才算灵验。”',
    reveal:'香炉裂开，里面没有神佛，只有一册被火烫卷的转灾账。大圣在末页画了一只向西的眼睛。',clue:{name:'转灾账与黑风铃',text:'收愿人的印记来自黑风林。披袈裟的熊守着一口不准响的钟。'},reward:'灰烬不再吞名，养魂神木吐出了第一片新叶。',regions:['灰阶山门','净灯藏院','焚愿回廊','主使香火坛'],siteNames:['转灾残签','净灯旧刻','神木年轮','灰烬供匣','未焚药庐','净愿香火坛'],
    layout:{spawn:[.17,.81],hub:[.43,.54],left:[.20,.20],right:[.78,.75],boss:[.76,.20],main:[[.17,.81],[.31,.72],[.29,.61],[.43,.54],[.58,.53],[.62,.35],[.76,.20]],upper:[[.43,.54],[.34,.44],[.36,.29],[.20,.20]],lower:[[.43,.54],[.55,.66],[.68,.60],[.78,.75]]}},
  {id:'windwood',no:'捌',title:'黑风借衣',subtitle:'黑风密林',place:'黑风山 · 借衣密林',color:'#91c9a4',background:'assets/infant-worlds.webp',artPosition:'50%',bossHp:23500,bossSpeed:64,mobScale:3.25,boss:'披愿黑熊',bossGlyph:'熊',bossRow:1,
    mobNames:{imp:'缠根山役',fox:'黑雾獠狼',snake:'竹笛魇师',zombie:'空心木卫'},
    theme:'袈裟披在谁身上，谁就能替神佛收账吗？',
    story:['黑风林的树都朝同一个方向弯腰。枝头挂着数千件无主袈裟，风一吹，便替人答应下一场劫。','披愿黑熊说它盗的不是袈裟，是一条能让山民活命的路。可每一次替人挡灾，它的身上便多缠一张卖命契。','大圣曾在两口风钟里封住真话。熊不能自己撞钟，只能一遍遍扑向来人。小果收剑侧身：借你一扑，把这哑钟撞醒。'],
    lore:['根缚旧寨留下半碗冷粥。寨民不是被熊吃了，而是被钟声里许下的太平带走。','两口风钟刻着同一句话：替人还债的人，最后也会被写成债主。','树冠里挂着一截金毫。大圣没有斩熊，只在它的袈裟内衬划开一道缝。'],
    tell:'风钟免疫剑伤。站到风钟后引黑熊锁向扑击，横向闪开令它撞钟；两钟齐响后躲过三段爪风，撕开袈裟破绽。',mechanic:'诱扑撞钟：用锁向扑击击碎两口风钟，再避过三段爪风。',bossLine:'“我披的是他们的愿，压下来的却全是我的罪。”',
    reveal:'袈裟落地，黑熊的背上钉满小小的木牌。它守的不是财宝，是已经没有资格求救的人。',clue:{name:'愿骨洞的回声图',text:'黑熊交出一段养魂木根：不要信洞里的第一个声音，那里有人把愿刻进了骨头。'},reward:'风钟终于响起。林中每一株神木，都记住了还债者的名字。',regions:['倒风林口','根缚旧寨','悬钟树径','借衣风钟坪'],siteNames:['旧寨冷粥','风钟铭文','树冠金毫','根藏木匣','林泉药灶','双钟风坪'],
    layout:{spawn:[.16,.74],hub:[.42,.46],left:[.18,.17],right:[.78,.77],boss:[.81,.22],main:[[.16,.74],[.28,.79],[.34,.63],[.42,.46],[.56,.42],[.67,.30],[.81,.22]],upper:[[.42,.46],[.32,.36],[.37,.23],[.18,.17]],lower:[[.42,.46],[.53,.60],[.65,.57],[.70,.69],[.78,.77]]}},
  {id:'bonewish',no:'玖',title:'愿骨归声',subtitle:'愿骨石窟',place:'黑风山腹 · 愿骨石窟',color:'#c1acd9',background:'assets/infant-worlds.webp',artPosition:'100%',bossHp:28500,bossSpeed:57,mobScale:3.65,boss:'焚愿老衲',bossGlyph:'骨',bossRow:2,
    mobNames:{imp:'骨面行脚',fox:'愿骨瘦犬',snake:'空腔诵骨',zombie:'肋甲护龛'},
    theme:'被迫许下的愿，死后还算自己的愿吗？',
    story:['石窟深处没有佛像，只有排列成佛形的白骨。焚愿老衲把死者的心愿刻在骨上，拿去抵消活人的罪。','三座愿碑同时呼唤孙小果的名字，只有一座的金色木脉仍在跳动。那不是经声，是尚未死去的元神。','大圣的声音从最深处传来：别替他们把这段经念完。小果以元婴守住识海，循着真愿，拔剑斩向借骨说法的人。'],
    lore:['白骨龛里装的不是舍利，是被迫签下的生前愿。每多念一遍，收账的人就多一日寿数。','空碑只会复述你的名字；有声的真愿却记得自己的名字。金色木脉，是活着的证据。','老衲曾经也想救人。功德簿第一次替他记功时，便悄悄换走了他最初的愿。'],
    tell:'辨认带金色脉线的真愿碑，空碑受击会反噬。断真愿后按“一退、二进、三退”越过三重骨声，收声时本体暴露。',mechanic:'辨声断愿：斩真碑，三重骨声须依次处在外侧、内侧、外侧；躲在远处或清屏都不能开启破绽。',bossLine:'“生前不肯许的愿，死后总会答应。”',
    reveal:'最后一重回声散去，老衲的影子却还跪在账前。神木里露出大圣留下的半句：他们买卖的，从来不是功德……',clue:{name:'高庄的人券',text:'半截木简标着高老庄。愿契之后，账册开始拿人的一生作价。化神篇将在后续开放。'},reward:'元婴篇已破。养魂神木归于本心，高庄的新账尚未揭封。',regions:['白骨洞门','回声支窟','神木根廊','归声骨愿殿'],siteNames:['白骨愿龛','真愿木脉','老衲旧愿','封骨石匣','神木灵泉','归声骨殿'],
    layout:{spawn:[.19,.80],hub:[.48,.53],left:[.19,.20],right:[.81,.75],boss:[.78,.22],main:[[.19,.80],[.28,.65],[.41,.69],[.48,.53],[.42,.40],[.61,.30],[.78,.22]],upper:[[.48,.53],[.29,.48],[.31,.31],[.19,.20]],lower:[[.48,.53],[.64,.52],[.71,.61],[.81,.75]]}}
];

const InfantArt=(()=>{
  const sheets=InfantChapters.map(c=>{const im=new Image();im.src='assets/actors-'+c.id+'.webp';return im;});
  const props=new Image();props.src='assets/infant-props.webp';
  let uv=null;
  function configure(value){uv=value;}
  function drawActor(e,row,size){const index=(e.family??Journey.run.stage)-6,im=sheets[index];if(!im?.complete||!im.naturalWidth||!uv)return false;
    const action=e.action||'idle',col=action==='windup'?2:action==='strike'?3:e.moving?Math.floor((e.walkDistance||0)/30)%2:0;
    const [x,y,w,h,px,py]=uv[index][row][col],height=uv[index][row][0][3],s=size/height;
    ctx.drawImage(im,x,y,w,h,(x-px)*s,(y-py)*s,w*s,h*s);return true;
  }
  function drawHelper(e){ctx.save();ctx.translate(e.x,e.y);const stage=e.family,color=e.phantom?'#7d748b':stage===6?'#efb978':stage===7?'#a9d5ae':'#e6d9b0';
    ctx.fillStyle='#111b22';ctx.strokeStyle=color;ctx.lineWidth=2;
    if(stage===6){ctx.fillRect(-20,-35,40,35);ctx.beginPath();ctx.ellipse(0,-37,24,9,0,0,Math.PI*2);ctx.stroke();Motion.glow(0,-46,35,color,.25);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-72);ctx.quadraticCurveTo(-18,-46,0,-39);ctx.quadraticCurveTo(15,-48,0,-72);ctx.fill();if(e.purity>0){ctx.beginPath();ctx.arc(0,0,78,-Math.PI/2,-Math.PI/2+Math.PI*2*e.purity/1.1);ctx.stroke();}}
    else if(stage===7){ctx.fillRect(-5,-74,10,76);ctx.beginPath();ctx.moveTo(-32,-26);ctx.quadraticCurveTo(-30,-85,0,-88);ctx.quadraticCurveTo(30,-85,32,-26);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-27,32,8,0,0,Math.PI*2);ctx.stroke();}
    else {ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(-20,-63);ctx.lineTo(0,-80);ctx.lineTo(22,-62);ctx.lineTo(23,0);ctx.closePath();ctx.fill();ctx.stroke();if(!e.phantom){ctx.strokeStyle='#f4da8e';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-5,-29);ctx.lineTo(7,-48);ctx.lineTo(0,-67);ctx.stroke();Motion.glow(0,-40,45,color,.15+.08*Math.sin(G.time*4));}}
    if(stage===8&&!e.phantom){ctx.fillStyle='#0c151c';ctx.fillRect(-24,-88,48,4);ctx.fillStyle=color;ctx.fillRect(-24,-88,48*e.hp/e.maxHp,4);}
    ctx.fillStyle=color;ctx.font='14px KaiTi';ctx.textAlign='center';ctx.fillText(e.name,0,-96);ctx.restore();
  }
  function drawProp(pen,o,stage,time){const col={gate:0,tree:1,lantern:2,shrine:3}[o.kind];if(col===undefined||!props.complete||!props.naturalWidth)return false;const [x,y,w,h]=InfantPropUV[stage-6][col],size={gate:360,tree:370,lantern:110,shrine:230}[o.kind],scale=size/Math.max(w,h);pen.drawImage(props,x,y,w,h,-w*scale/2,-h*scale,w*scale,h*scale);if(col===2){const color=InfantChapters[stage-6].color,g=pen.createRadialGradient(0,-60,0,0,-60,40);g.addColorStop(0,color+'40');g.addColorStop(1,color+'00');pen.fillStyle=g;pen.fillRect(-40,-100,80,80);}return true;}
  function drawShot(s){const angle=Math.atan2(s.vy,s.vx),stage=s.theme,color=InfantChapters[stage-6].color;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=7;ctx.lineWidth=1.7;if(stage===6){ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-6);ctx.lineTo(-3,0);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();}else if(stage===7){ctx.beginPath();ctx.ellipse(0,0,14,5,0,Math.PI*.15,Math.PI*1.85);ctx.stroke();ctx.beginPath();ctx.moveTo(-15,2);ctx.lineTo(7,-3);ctx.stroke();}else {ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-9,-4);ctx.lineTo(-4,0);ctx.lineTo(-9,4);ctx.closePath();ctx.fill();ctx.strokeStyle='#f5eecc';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(9,0);ctx.stroke();}ctx.restore();}
  return {configure,drawActor,drawHelper,drawProp,drawShot,loaded:()=>sheets.every(s=>s.complete&&s.naturalWidth)&&props.complete&&props.naturalWidth,sheets};
})();

const InfantGuardians=(()=>{
  const alive=e=>e&&e.hp>0&&!e.killed;
  const helpers=e=>G.enemies.filter(h=>alive(h)&&h.bossHelper&&h.bossOwner===e.id&&!h.phantom);
  const config=()=>Bosses.profiles[Journey.run.difficulty]||Bosses.profiles.normal;
  const point=(x,y)=>World.clipToArena({x,y},75);
  function state(e,name,duration){e.action=name;e.actionT=0;e.actionDuration=duration;e.attack=['windup','strike'].includes(name)?duration:0;}
  function say(e,text){addText(e.x,e.y-150,text,Journey.stage().color,18);}
  function summon(e){const b=e.brain,stage=Journey.run.stage,a=World.arena(),count=stage===7?2:3,real=(b.round-1)%3;
    for(let i=0;i<count;i++){const angle=-Math.PI/2+i*Math.PI*2/count,p=point(a.cx+Math.cos(angle)*240,a.cy+Math.sin(angle)*195),hp=Math.round((stage===6?175:stage===7?220:260)*(e.threat?.helper||1)*config().helper);
      G.enemies.push({id:G.uid++,type:'imp',family:stage,bossHelper:true,bossOwner:e.id,threat:e.threat,name:stage===6?'净愿灯':stage===7?'缄声风钟':i===real?'有声真愿':'空愿回音',glyph:stage===6?'净':stage===7?'钟':i===real?'愿':'空',...p,r:24,hp,maxHp:hp,xp:0,dmg:0,speed:0,locked:stage!==8,phantom:stage===8&&i!==real,purity:0,flash:0,action:'guard',actionT:0,actionDuration:1});}
    b.helperTotal=stage===8?1:count;b.helperBroken=0;b.mechanismReady=false;
    say(e,stage===6?'靠近净愿灯 · 守心净化':stage===7?'风钟拒剑 · 引扑撞钟':'辨金色木脉 · 斩有声真愿');
  }
  function init(e){e.brain={theme:Journey.run.stage%3,round:1,breaks:0,attackIndex:0,token:0,pending:null,helperBroken:0,helperTotal:0,mechanismReady:false,windowDamage:0,duelFailures:0};e.phase=1;e.attackAngle=0;state(e,'guard',1.5);summon(e);}
  function clear(e){G.telegraphs=G.telegraphs.filter(t=>t.bossOwner!==e.id);G.eshots=G.eshots.filter(t=>t.bossOwner!==e.id);e.brain.pending=null;}
  function open(e){clear(e);const b=e.brain;b.breaks++;b.windowDamage=0;state(e,'exposed',config().window);say(e,['香火已断 · 收炉破绽','爪势已尽 · 袈裟破绽','真愿归声 · 法身破绽'][Journey.run.stage-6]);Sound.weakness?.(Journey.run.stage);Motion.emit('blast',e.x,e.y,{r:110,duration:.8,color:Journey.stage().color});}
  function close(e){const b=e.brain;b.round++;clear(e);state(e,'guard',1.2);summon(e);}
  function hazard(e,p,options){const pending=e.brain.pending,life=Math.max(.65,options.life*Journey.difficulty().warning);Journey.hazard(p.x,p.y,{...options,life,total:life,boss:true,bossOwner:e.id,bossToken:pending.token,theme:Journey.run.stage%3,chapterTheme:Journey.run.stage,damageContext:{kind:'boss',scale:e.threat?.damage||1,shieldFactor:1}});pending.expected++;pending.last=Math.max(pending.last,life);}
  function prepare(e,kind,mechanism=false){const b=e.brain,a=Math.atan2(P.y-e.y,P.x-e.x),target=point(P.x,P.y);e.attackAngle=a;e.look=Math.cos(a)<0?-1:1;b.pending={token:++b.token,kind,mechanism,expected:0,impacts:0,passed:true,last:0,origin:{x:e.x,y:e.y},age:0};
    if(kind==='fire'){hazard(e,target,{r:95,dmg:31,life:1.05,label:'焚愿香烬 · 离开金色落点',bossSkill:'wish-fire'});if(e.phase===2)hazard(e,point(target.x+Math.cos(a+1.57)*150,target.y+Math.sin(a+1.57)*150),{r:85,dmg:29,life:1.7,label:'余烬复燃 · 延迟落火',bossSkill:'wish-fire'});}
    else if(kind==='cross'){for(let i=0;i<2;i++)hazard(e,{x:e.x,y:e.y},{shape:'line',angle:a+i*Math.PI/2,length:460,r:34,dmg:38,life:1.2+i*.55,label:i?'第二焚线 · 继续侧移':'十字焚线 · 方向已锁',bossSkill:'wish-cross'});}
    else if(kind==='pounce'){const d=Math.min(650,Math.max(320,Math.hypot(P.x-e.x,P.y-e.y)+100)),end=point(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d),length=Math.hypot(end.x-e.x,end.y-e.y);b.pending.dash=end;hazard(e,{x:(e.x+end.x)/2,y:(e.y+end.y)/2},{shape:'line',angle:a,length:length/2,r:43,dmg:39,life:1.25,label:'黑风扑钟 · 锁向后横移',bossSkill:'bear-pounce'});}
    else if(kind==='claws'){for(let i=0;i<3;i++)hazard(e,{x:e.x,y:e.y},{shape:'line',angle:a+(i-1)*.60,length:400,r:36,dmg:35+i*2,life:1.2+i*.55,label:['左爪风 · 方向已锁','中爪风 · 勿急回身','右爪风 · 收爪才露隙'][i],bossSkill:'bear-claws'});}
    else if(kind==='bone'){hazard(e,target,{r:90,dmg:34,life:1.1,label:'骨愿追声 · 离开回音',bossSkill:'bone-mark'});hazard(e,point(target.x+130,target.y-80),{r:85,dmg:32,life:1.8,label:'空愿余响 · 延迟骨刺',bossSkill:'bone-mark'});}
    else if(kind==='echo'){for(let i=0;i<3;i++)hazard(e,{x:e.x,y:e.y},{shape:'annulus',r:180,width:30,dmg:39,life:1.3+i*1.15,side:i===1?'inside':'outside',label:['一退 · 离开骨声圈','二进 · 踏入骨声内圈','三退 · 再离声圈'][i],bossSkill:'bone-echo'});}
    state(e,'windup',Math.min(...G.telegraphs.filter(t=>t.bossOwner===e.id&&t.bossToken===b.pending.token).map(t=>t.life)));say(e,kind==='cross'?'焚愿十字':kind==='pounce'?'黑风锁扑':kind==='claws'?'裂衣三爪':kind==='echo'?'三愿归声':'愿火不灭');
  }
  function finish(e){const b=e.brain,p=b.pending;if(p?.mechanism&&p.impacts===p.expected&&p.passed&&!helpers(e).length){open(e);return;}if(p?.mechanism){b.duelFailures++;b.counterDue=Journey.run.stage===8;say(e,'未成破招 · '+(Journey.run.stage===8?'须一退二进三退':'避尽整轮招式再攻'));}b.pending=null;state(e,'guard',e.phase===2?.8:1.2);}
  function update(e,dt){if(!e.brain)init(e);if(!alive(e))return;const b=e.brain;if(e.hp<=e.maxHp*.5&&e.phase===1){e.phase=2;Sound.guardian(Journey.run.stage,true);say(e,Journey.stage().boss+' · 怒相');}e.actionT+=dt;if(b.pending)b.pending.age+=dt;
    if(Journey.run.stage===6)for(const h of helpers(e)){if(Math.hypot(P.x-h.x,P.y-h.y)<95){h.purity=Math.min(1.1,h.purity+dt);if(h.purity>=1.1)killEnemy(h);}else h.purity=Math.max(0,h.purity-dt*.35);}
    if(e.action==='exposed'){if(e.actionT>=e.actionDuration)close(e);return;}
    if(!helpers(e).length&&!b.mechanismReady){b.mechanismReady=true;Sound.omen?.(Journey.run.stage);}
    if(e.action==='guard'&&e.actionT>=e.actionDuration){const stage=Journey.run.stage;if(b.counterDue){b.counterDue=false;prepare(e,'bone',false);}else {b.attackIndex++;const kind=stage===6?(b.mechanismReady?'cross':'fire'):stage===7?(b.mechanismReady||b.attackIndex%3===0?'claws':'pounce'):(b.mechanismReady?'echo':'bone');prepare(e,kind,b.mechanismReady);}}
    else if(e.action==='windup'&&e.actionT>=e.actionDuration)state(e,'strike',Math.max(.4,b.pending.last-e.actionDuration+.2));
    else if(e.action==='strike'){const p=b.pending;if(p?.dash){const t=Math.min(1,e.actionT/.38);e.x=p.origin.x+(p.dash.x-p.origin.x)*t;e.y=p.origin.y+(p.dash.y-p.origin.y)*t;}if(e.actionT>=e.actionDuration)state(e,'recover',1);}
    else if(e.action==='recover'&&e.actionT>=e.actionDuration)finish(e);
  }
  function onImpact(t,hit){const e=G.boss,p=e?.brain?.pending;if(!alive(e)||!p||t.bossOwner!==e.id||t.bossToken!==p.token)return;p.impacts++;p.passed=p.passed&&!hit;
    if(t.bossSkill==='bear-pounce')for(const h of helpers(e)){const dx=h.x-t.x,dy=h.y-t.y,along=dx*Math.cos(t.angle)+dy*Math.sin(t.angle),across=-dx*Math.sin(t.angle)+dy*Math.cos(t.angle);if(Math.abs(along)<t.length+h.r&&Math.abs(across)<t.r+h.r)killEnemy(h);}
    if(t.bossSkill==='bone-echo'){const d=Math.hypot(P.x-t.x,P.y-t.y);p.passed=p.passed&&(t.side==='inside'?d<t.r-t.width-P.r:d>t.r+t.width+P.r)&&d<550;}
  }
  function onHelperKilled(h){const e=G.boss;if(!e?.brain||h.bossOwner!==e.id)return;e.brain.helperBroken++;if(Journey.run.stage===8&&!h.phantom)for(const q of G.enemies.filter(q=>q.bossHelper&&q.phantom&&q.bossOwner===e.id)){q.hp=0;q.killed=true;}}
  function filterDamage(e,damage){if(e.bossHelper){if(e.locked)return 0;if(e.phantom){if((e.retortAt||0)<=G.time){e.retortAt=G.time+3;const b=G.boss;if(b)Journey.hazard(P.x,P.y,{r:90,dmg:34,life:Math.max(.65,1.1*Journey.difficulty().warning),total:Math.max(.65,1.1*Journey.difficulty().warning),boss:true,bossOwner:b.id,chapterTheme:8,theme:2,bossSkill:'bone-retort',label:'空愿反噬 · 离开回音',damageContext:{kind:'boss',scale:b.threat?.damage||1,shieldFactor:1}});addText(e.x,e.y-100,'空愿反噬 · 认准金色木脉','#ddaccf',15);}return 0;}return damage;}
    return e.boss?Math.max(0,Math.min(Math.round(damage),e.hp)):damage;
  }
  function hud(e){const b=e?.brain;if(!b)return {title:'寻其破绽',hint:'命中持续扣血 · 破招后伤害3倍。'+(Journey.stage().bonusTell||Journey.stage().tell),progress:0};const exposed=e.action==='exposed',left=helpers(e).length;return {title:exposed?'破绽 · 伤害3倍 · '+Math.max(0,e.actionDuration-e.actionT).toFixed(1)+' 秒':left?'可攻击 · '+['净愿灯尚存','风钟尚存','有声真愿尚存'][Journey.run.stage-6]+' · '+left:Journey.run.stage===8?'骨声一退 · 二进 · 三退':'诱尽整轮，等待收势',hint:'命中持续扣血 · 破招后伤害3倍。'+(Journey.stage().bonusTell||Journey.stage().tell),progress:exposed?Math.max(0,1-e.actionT/e.actionDuration):(b.helperTotal-left)/b.helperTotal,exposed,remaining:exposed?Math.max(0,e.actionDuration-e.actionT):0,breaks:b.breaks,helpers:left,round:b.round,action:e.action};}
  return {init,update,onImpact,onHelperKilled,filterDamage,hud};
})();
