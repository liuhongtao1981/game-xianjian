/* Journey campaign: narrative, encounter rules and player-facing balance data. */
const Journey = (() => {
  const difficulties={
    story:{name:'寻路',tag:'故事',desc:'妖群较疏、容错更宽，保留完整剧情。适合初次寻圣。',hp:160,mobHp:.8,bossHp:.72,damage:.55,spawn:1.2,projectile:.85,warning:1.25,charge:1.25},
    normal:{name:'行者',tag:'标准',desc:'密集营地、巡逻与精英挑战，走位和构筑并重。',hp:120,mobHp:1,bossHp:1,damage:1,spawn:1,projectile:1,warning:1,charge:1},
    hard:{name:'劫火',tag:'困难',desc:'每波妖众更多，招式更快，交叉预警更紧。',hp:120,mobHp:1.15,bossHp:1.18,damage:1.25,spawn:.9,projectile:1.1,warning:.88,charge:1},
    nightmare:{name:'无间',tag:'极难',desc:'大群追击、短预警与更高伤害；完整剧情仍可体验。',hp:120,mobHp:1.25,bossHp:1.35,damage:1.5,spawn:.82,projectile:1.18,warning:.78,charge:.95}
  };
  const ultimates={
    heaven:{name:'破戒 · 天剑归一',short:'破戒',glyph:'天剑',color:'#f4d99b',cd:24,windup:.9,duration:2.15,invuln:1.4,
      desc:'0.9 秒聚剑，斩击周围760步并清弹，可破机关。无法穿透首领护体；破绽期使用才能伤及本体。',role:'爆发 / 清场',damage:l=>300+l*22},
    lotus:{name:'护生 · 莲华剑界',short:'护生',glyph:'莲界',color:'#9cecc3',cd:28,windup:.6,duration:1.6,invuln:.9,
      desc:'近身剑莲爆发，回复 24% 生命、获得 40 护盾，清除周围弹幕并留下 4 秒剑界。适合容错与近身构筑。',role:'续航 / 护身',damage:l=>150+l*16},
    river:{name:'逆命 · 断流十八剑',short:'逆命',glyph:'断流',color:'#97ddff',cd:22,windup:.45,duration:1.8,invuln:.75,
      desc:'锁定施放方向，分三轮打出十八柄穿透飞剑，切开前方弹幕。持续走位可引导剑路；有落空风险。',role:'方向 / 持续输出',damage:l=>24+l*3}
  };
  const stages=[
    {id:'exile',no:'壹',title:'金蝉遭贬',subtitle:'失声禅庭',theme:'被罚下界的，究竟是轻慢佛法的人，还是听见了真相的人？',
      place:'旧灵山 · 贬谪禅庭',background:'assets/journey-exile.png',color:'#d8ba73',bossTime:72,bossHp:2400,mobScale:1,boss:'缄口监院',bossGlyph:'戒',bossRow:0,bossSpeed:42,
      mobNames:{imp:'缄言小僧',fox:'焚卷狻猊',snake:'诵律卷灵',zombie:'镇钟金刚'},
      story:['大圣失踪后，八十一难的名册开始自行改写。无籍剑仙孙小果循一截焦黑毫毛，踏入金蝉受贬的劫痕。','禅庭说，金蝉是因轻慢教法而遭贬。可被烧掉的卷宗里，留着一句：每一难，都须有人付命。','监院愿给你大圣的下落，条件是将最后三页证词投入戒火。小果拔剑：先把你的嘴打开。'],
      tell:'先破三枚钟心，再避过随后落地的镇音重锤，收锤才露破绽。也可引锤砸钟。',
      reveal:'监院的铁面落地，里面没有舌头。三页证词写着同一个收讫人，却被金漆涂去姓名。',
      clue:{name:'被烧去的名册页',text:'“受难者不得知价，知价者不得成佛。”纸背有一缕未烧尽的金色毫毛，指向江州。'},
      bossLine:'“你以为受贬的是金蝉？被贬的，是敢问价的人。”',mechanic:'钟心护体：先破三钟，再诱重锤落空；收锤才是破绽。护体重结后，必须重新破钟诱招。',
      reward:'破戒之后，仍有人在替沉默收账。'},
    {id:'birth',no:'贰',title:'出胎几杀',subtitle:'血诏陈府',theme:'诏书要杀的，真是襁褓中的孩子吗？',
      place:'江州 · 陈府血诏庭',background:'assets/journey-birth.png',color:'#d78575',bossTime:80,bossHp:3600,mobScale:1.3,boss:'血诏司命',bossGlyph:'诏',bossRow:1,bossSpeed:54,
      mobNames:{imp:'伪诏刀役',fox:'赤绸诏魇',snake:'报命朱吏',zombie:'断籍禁卫'},
      story:['金色毫毛将孙小果引到陈府。门内每夜都传出婴儿的哭声，每到黎明，族谱便少一个名字。','血诏说：为免江州遭劫，须除掉这个孩子。可每张诏令的落款，竟与第一难的收讫人出自同一只手。','一名侍女把空襁褓交给小果：别信写在金纸上的慈悲。要找大圣，先问谁在替天杀人。'],
      tell:'先断两枚血诏，再向侧面避开两段问斩。等它收刀，集中输出。',
      reveal:'司命的面具后挂着一排空白官印。它从不问诏令真假，只问印泥是否够红。',
      clue:{name:'无主血诏',text:'诏令的墨中混有旧日香灰。小果辨出一行被刮掉的批注：“石猴曾拒签此令，去向封存于江底。”'},
      bossLine:'“真假不在纸上，在谁活着盖印。”',mechanic:'双诏问斩：断开两枚血诏后，完整躲过两段锁向斩击并等它收刀，才开启本体破绽。',
      reward:'没有署名的恶，也会借一枚官印行走人间。'},
    {id:'river',no:'叁',title:'满月抛江',subtitle:'夜渡洪江',theme:'江流救下了谁，又替谁埋住了姓名？',
      place:'洪江 · 无名夜渡',background:'assets/journey-river.png',color:'#8acbd0',bossTime:88,bossHp:5200,mobScale:1.6,boss:'沉灯河伯',bossGlyph:'渡',bossRow:2,bossSpeed:48,
      mobNames:{imp:'沉灯水鬼',fox:'逐浪獠妖',snake:'逆鳞江妖',zombie:'缚舟锚尸'},
      story:['孙小果顺洪江寻到一只永不腐烂的木板。血书上的字，每逢满月便会变成另一个人的笔迹。','河伯声称自己守护江流儿的旧事，可江底每一盏灯，都封着一个没能被写进灾难簿的人。','它答应放出大圣的消息，条件是留下小果的名字。小果将剑横在水面：名字可以不留，账不能不算。'],
      tell:'先灭两盏河灯，再连续两次站进洪潮的青色缺口，迫使河伯显露逆鳞。',
      reveal:'河伯倒下，灯芯里传出大圣的一声冷笑：“别沿着他们写好的路找我。”',
      clue:{name:'逆流金毫',text:'一根金毫逆水而上，指向五行山旧址。孙小果终于明白：大圣不是等人来救，是在等一个敢重走旧账的人。'},
      bossLine:'“江水向东，账册向西。你要渡哪一边？”',mechanic:'逆鳞锁魂：灭去河灯后，连续两次站进青色潮隙迎潮；逆鳞只在潮势尽时显露。逃离潮带不算破招。',
      reward:'前三难已破。五行山的石缝里，正有人替你磨剑。'}
  ];
  stages.push(...GoldenChapters);
  stages.forEach((s,i)=>Object.assign(s,ChapterCatalog.get(i),{title:s.title,name:s.subtitle}));
  const backgrounds=stages.map(s=>{const image=new Image();image.src=s.background;return image;});
  const run={stage:0,difficulty:'normal',ultimate:'heaven',completed:[],time:0,checkpoint:null,tier:0};
  let menuStage=0;
  const stage=()=>stages[run.stage];
  // Each ordeal compounds pressure on top of the chosen global difficulty.
  const pressure=()=>({damage:[1,1.12,1.25][run.stage%3]*(1+.22*Math.floor(run.stage/3)),spawn:Math.max(.8,1-.025*run.stage),projectile:Math.min(1.2,1+.025*run.stage),warning:Math.max(.85,1-.025*run.stage),speed:Math.min(1.2,1+.025*run.stage)});
  const difficulty=()=>{const base=difficulties[run.difficulty],p=pressure();return {...base,mobHp:base.mobHp*1.22**(run.tier||0),bossHp:base.bossHp*1.22**(run.tier||0),damage:base.damage*p.damage*1.18**(run.tier||0),spawn:base.spawn*p.spawn,projectile:base.projectile*p.projectile,warning:base.warning*p.warning,speed:p.speed};};
  const ultimate=()=>ultimates[run.ultimate];
  function build(p){return JourneyProgress.capture(p);}
  function saveBuild(p){run.checkpoint=build(p);}
  function restore(p){if(run.checkpoint){Object.assign(p,build(run.checkpoint));}else p.hp=p.maxHp=difficulty().hp;}
  function begin(selected=0){run.stage=JourneyProgress.canSelect(selected)?selected:0;run.completed=[];run.time=0;run.tier=0;run.checkpoint=JourneyProgress.replay(run.stage,run.difficulty,difficulties);}
  function selected(){return JourneyProgress.canSelect(menuStage)?menuStage:0;}
  function menu(){
    RunSave.save('返回卷首');
    G.state='start';clearInput();document.body.classList.add('on-title');
    Sound.reset();Sound.sync('start',run.stage,false);
    const ov=document.getElementById('overlay');ov.classList.remove('hidden','title-screen');ov.classList.add('journey-screen');
    menuStage=selected();const preview=stages[menuStage];
    const inherited=JourneyProgress.replay(menuStage,run.difficulty,difficulties);
    const inheritance=inherited?'继承等级 Lv.'+inherited.level+' · 术法 '+Object.keys(inherited.spells).length+' 门 · 法宝 '+inherited.equips.length+' 件 · 强化与剑意保留':'筑基一层 · 从等级 Lv.1 启程 · 成长永久保留';
    ov.innerHTML=`<div class="journey-menu"><div class="journey-heading"><div class="overline">重 走 西 游 · 八 十 一 难</div><h1>寻圣</h1><div class="subtitle">剑仙孙小果 · 第一卷<br>被删去的姓名</div><p>大圣不见了。取经路还在替人写结局。<br>你循一根金毫，走进四十二段未肯沉默的旧事，筑基与金丹六关现已开启。</p></div>
      <div class="journey-chapters">${stages.map((s,i)=>`<button class="chapter-card ${i===menuStage?'selected':''}" data-stage="${i}" ${JourneyProgress.canSelect(i)?'':'disabled'} aria-label="${s.title} · ${i<JourneyProgress.cleared()?'已通关，可重战':JourneyProgress.canSelect(i)?'可出征':'先通关'+stages[i-1].title}" aria-pressed="${i===menuStage}" style="--chapter:${s.color};background-image:linear-gradient(0deg,#071418f5,#07141812),url('${s.background}')"><span class="chapter-index">第 ${s.no} 难</span><strong>${s.title}</strong><span>${s.subtitle}</span><small>守关 · ${s.boss}</small><em class="chapter-lock">${i<JourneyProgress.cleared()?'已通关 · 可重战':JourneyProgress.canSelect(i)?(i===0?'由此启程':'前难已破 · 可出征'):i%3===0?'锁定 · 需'+Cultivation.realms[Math.floor(i/3)]+'及前篇通关':'锁定 · 先破前难'}</em></button>`).join('')}</div><details class="chapter-roadmap"><summary>十四境 · 四十二关历程 / 查看后续篇章</summary><div>${ChapterCatalog.all.slice(6).map(c=>`<span>${Cultivation.realms[c.realm]} · ${c.name} <small>制作中 · 未开放</small></span>`).join('')}</div></details>
      <div class="chapter-preview"><span>${preview.theme}</span><small>${preview.mechanic}</small><small>此难妖众：${Encounters.family(menuStage).units.map(e=>e.name).join(' · ')}</small><small>${inheritance}</small><small class="pressure-note">${menuStage===0?'劫压起点':'累积劫压 +'+menuStage+'：伤害 +'+Math.round((([1,1.12,1.25][menuStage%3]*(1+.22*Math.floor(menuStage/3)))-1)*100)+'% · 移速 +'+Math.round((Math.min(1.2,1+.025*menuStage)-1)*100)+'% · 增援更密，飞弹更快'}</small></div>
      <div class="journey-options"><section><h3>所历之难 <small>难度决定容错，不锁剧情</small></h3><div class="difficulty-options">${Object.entries(difficulties).map(([id,d])=>`<button data-difficulty="${id}" class="option ${run.difficulty===id?'selected':''}" aria-pressed="${run.difficulty===id}"><strong>${d.name}</strong><small>${d.tag}</small></button>`).join('')}</div><p>${difficulty().desc}</p></section>
      <section><h3>携行大招 <small>每次出征选择一种</small></h3><div class="ultimate-options">${Object.entries(ultimates).map(([id,u])=>`<button data-ultimate="${id}" class="option ${run.ultimate===id?'selected':''}" aria-pressed="${run.ultimate===id}"><strong>${u.short}</strong><small>${u.role}</small></button>`).join('')}</div><p>${ultimate().name}：${ultimate().desc}</p></section></div>
      <div class="journey-footer"><div><span>逐难前行 · 已破 ${JourneyProgress.cleared()} / 42 难 · 已开放6关</span><small>通关上一难，才可选择下一难；已破章节可随时重战。<br>WASD 移动 · 空格闪避 · Q 大招 · E 交互 · Tab 舆图 · F 全屏</small></div><button class="btn" id="startBtn">${menuStage===0?'循 金 毫 · 入 第 一 难':(menuStage<JourneyProgress.cleared()?'重 战 · ':'出 征 · ')+preview.title} →</button></div></div>`;
    ov.querySelectorAll('[data-stage]').forEach(n=>n.onclick=()=>{const index=Number(n.dataset.stage);if(!JourneyProgress.canSelect(index))return;menuStage=index;menu();});
    ov.querySelectorAll('[data-difficulty]').forEach(n=>n.onclick=()=>{run.difficulty=n.dataset.difficulty;menu();});
    ov.querySelectorAll('[data-ultimate]').forEach(n=>n.onclick=()=>{run.ultimate=n.dataset.ultimate;menu();});
    document.getElementById('startBtn').onclick=startGame;CharacterUI.decorateMenu();
  }
  function intro(){
    const s=stage();G.state='story';clearInput();document.body.classList.remove('on-title');
    Sound.sync('story',run.stage,false);Sound.stageIntro(run.stage);
    const ov=document.getElementById('overlay');ov.classList.remove('hidden','journey-screen','title-screen');
    ov.innerHTML=`<div class="panel story-panel" style="--story:${s.color}"><div class="story-art" style="background-image:linear-gradient(0deg,#081619,transparent),url('${s.background}')"></div><div class="story-copy"><span class="overline">第 ${s.no} 难 · ${s.subtitle}</span><h2>${s.title}</h2>${s.story.map(t=>`<p>${t}</p>`).join('')}<blockquote>${s.bossLine}</blockquote><div class="story-tactic"><b>此难要诀</b> ${s.tell}<br><b>累积劫压 ${run.stage}</b> ${run.stage?'叠加前难强度：伤害 +'+Math.round((pressure().damage-1)*100)+'% · 移速 +'+Math.round((pressure().speed-1)*100)+'% · 增援加密':'初入劫痕，学习预警与破招'}</div><button class="btn" id="enterStageBtn">入 劫 · ${difficulty().name}</button></div></div>`;
    document.getElementById('enterStageBtn').onclick=()=>{ov.classList.add('hidden');G.state='playing';last=performance.now();};
  }
  function showEnd(victory){
    const s=stage(),ov=document.getElementById('overlay');clearInput();ov.classList.remove('hidden','journey-screen','title-screen');
    Sound.sync(victory?'win':'dead',run.stage,false);
    if(victory&&G.state==='win'&&G.boss?.killed&&G.boss.hp<=0&&P.hp>0&&!run.completed.includes(run.stage)){run.completed.push(run.stage);run.time+=G.time;Cultivation.victory();if(run.stage<ChapterCatalog.playable-1){const entry=build(P);entry.hp=Math.max(entry.hp,entry.maxHp*.7);JourneyProgress.entry(run.stage+1,entry,run.difficulty);}JourneyProgress.clear(run.stage);}
    const finale=run.stage===ChapterCatalog.playable-1;
    ov.innerHTML=`<div class="panel chronicle-panel"><span class="overline">${victory?'劫 痕 已 破':'此 路 未 尽'} · ${difficulty().name}</span><h2>${victory?(finale?'金 丹 篇 已 破 · 禅 院 待 启':s.title+' · 已破'):'剑折 · 再寻'}</h2><div class="statline"><span>历劫 <b>${fmt(G.time)}</b></span><span>斩敌 <b>${G.kills}</b></span><span>等级 <b>${P.level}</b> · ${Cultivation.label()}</span></div><p class="end-narrative">${victory?s.reveal:'生命已归零。等级、经验、术法、法宝、修仙境界与材料永久保留；重试不重复发放本轮已领稀有奖励。'}</p>${victory?`<div class="clue-reward"><small>寻圣线索 ${run.stage+1} / 42</small><strong>${s.clue.name}</strong><p>${s.clue.text}</p></div>`:''}
      ${victory?CharacterUI.coreRewardHTML():''}${victory&&!finale?`<h3>带一份行粮，继续下一难</h3><div class="camp-rewards"><button data-camp="power"><strong>磨剑</strong><small>伤害 +10%</small></button><button data-camp="body"><strong>养生</strong><small>生命上限 +20</small></button><button data-camp="focus"><strong>静心</strong><small>术法冷却 -8%</small></button></div><p class="hintline">三选一后前往${stages[run.stage+1].title} · 构筑继承，生命至少恢复至 70%</p>`:`<button class="btn" id="againBtn">${victory?'重 战 当 前 章':'再 入 此 难'}</button>`}${victory?'<button class="linkbtn" id="endCharacterBtn">人物修炼 · 九层突破</button>':''}<button class="linkbtn" id="menuBtn">返回卷首 / 重选难度与大招</button></div>`;
    ov.querySelectorAll('[data-camp]').forEach(n=>n.onclick=()=>next(n.dataset.camp));
    const again=document.getElementById('againBtn');if(again)again.onclick=()=>{if(victory){RunSave.start(run.stage,false,true);}else{RunSave.retry();}};
    if(victory)document.getElementById('endCharacterBtn').onclick=CharacterUI.toggle;CharacterUI.bindCoreReward();RunSave.save(victory?'通关':'死亡');document.getElementById('menuBtn').onclick=()=>{RunSave.save('返回卷首');menu();};
  }
  function next(reward){
    if(G.state!=='win'||G.coreReward||run.stage>=ChapterCatalog.playable-1||!run.completed.includes(run.stage))return false;
    if(P.cultivation.realm<ChapterCatalog.get(run.stage+1).realm){notifyPickup('cultivation','请先修至九层圆满并突破'+Cultivation.realms[ChapterCatalog.get(run.stage+1).realm]);CharacterUI.toggle();return false;}
    if(reward==='power')P.dmg*=1.1;else if(reward==='body')P.maxHp+=20;else if(reward==='focus')P.cdr=Math.max(Cultivation.caps().cdr,P.cdr*.92);else return false;
    Cultivation.constrain();P.hp=Math.min(P.maxHp,Math.max(P.hp,P.maxHp*.55)+P.maxHp*.15);RunSave.beginChapter(run.stage+1);run.stage++;saveBuild(P);JourneyProgress.entry(run.stage,run.checkpoint,run.difficulty);reset();intro();RunSave.stageChanged();return true;
  }
  function journal(){
    if(['story','levelup','chest','journal','map'].includes(G.state))return;
    const before=G.state;if(before==='playing')clearInput();G.state='journal';
    const ov=document.getElementById('overlay');ov.classList.remove('hidden');
    ov.innerHTML=`<div class="panel chronicle-panel"><h2>寻 圣 残 卷</h2><p class="sub">大圣未归，账须有人重算</p>${stages.map((s,i)=>`<div class="clue-reward"><small>第 ${s.no} 难 · ${s.title}</small><strong>${i<JourneyProgress.cleared()?s.clue.name:'线索未得'}</strong><p>${i<JourneyProgress.cleared()?s.clue.text:s.theme}</p></div>`).join('')}<p class="hintline">取前三难之名为原典；孙小果、守关者与隐秘账册为独立原创演义。</p><button class="btn" id="closeJournalBtn">合 卷</button></div>`;
    document.getElementById('closeJournalBtn').onclick=()=>{if(before==='start')menu();else if(before==='win'||before==='dead'){G.state=before;showEnd(before==='win');}else if(before==='paused'){G.state='playing';togglePause();}else {ov.classList.add('hidden');G.state=before;last=performance.now();}};
  }
  function warning(base){return Math.max(.65,base*difficulty().warning);}
  function hazard(x,y,options={}){G.telegraphs.push({x,y,r:72,life:warning(1.15),total:warning(1.15),dmg:20,color:stage().color,theme:run.stage,boss:true,label:run.stage===0?'缄口钟印':run.stage===1?'血诏落印':'沉灯落潮',...options});Sound.effects('warning');}
  function attackBoss(e,dt){Bosses.update(e,dt);}
  function damageMultiplier(e){return Bosses.damageMultiplier(e);}
  return {run,stages,difficulties,ultimates,stage,difficulty,ultimate,background:()=>backgrounds[run.stage],begin,selected,pressure,restore,saveBuild,menu,intro,showEnd,next,journal,warning,hazard,attackBoss,damageMultiplier};
})();
