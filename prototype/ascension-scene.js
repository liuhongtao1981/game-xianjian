/* A presentation layer keeps the underlying game state and DOM alive. */
const AscensionScene=(()=>{
  const duration=5.2,labels={playing:'原地战斗',win:'通关结算',story:'当前剧情',character:'人物面板',levelup:'升级选卡',chest:'宝箱奖励',journal:'当前证词',map:'舆图',station:'驿站'};
  let session=null,blurred=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const number=v=>Number(v.toFixed(2)).toLocaleString('zh-CN');
  function active(){return !!session;}
  function release(s){for(const [node,inert] of s.inert)node.inert=inert;document.body.classList.remove('ascension-open');s.root.remove?.();}
  function cancel(){if(!session)return;const s=session;session=null;release(s);}
  function begin(details){
    if(session||!labels[G.state]||P.hp<=0||RunSave.conflicted())return false;
    const root=document.createElement('section'),state=G.state,focus=document.activeElement;
    const button=document.getElementById('storyPauseBtn'),storyWasPlaying=state==='story'&&button?.textContent.includes('暂停');
    if(storyWasPlaying)button.click();
    const c=P.cultivation,color=RealmVisuals.get(c).color,motif=RealmVisuals.ascensions[c.realm];
    root.id='ascensionScene';root.className='ascension-scene';root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','ascensionTitle');root.style.setProperty?.('--ascension',color);
    const before=details.stats,metrics=[['生命上限',before.maxHp,P.maxHp,''],['护盾上限',before.shieldMax,P.shieldMax,''],['伤害倍率',before.dmg,P.dmg,'×']];
    root.innerHTML=`<canvas id="ascensionCanvas" aria-hidden="true"></canvas><header><span class="ascension-overline">${Cultivation.realms[details.fromRealm]} · 九层圆满 → ${Cultivation.realms[c.realm]}</span><p id="ascensionPhase">引灵 · 凝聚天地气机</p><h1 id="ascensionTitle">${Cultivation.realms[c.realm]}</h1><div class="ascension-motif">${motif}</div></header><footer><div class="ascension-gains">${metrics.map(([name,a,b,unit])=>`<div><span>${name}</span><p><s>${number(a)}${unit}</s><i>→</i><b>${number(b)}${unit}</b></p></div>`).join('')}</div><p class="ascension-entitlement">境界赠送术法升级 +3 · ${RunSave.active()?'成长已保存':'境界已提升'}</p><div class="ascension-progress"><i id="ascensionProgress"></i></div><div class="ascension-return"><span>演出结束后返回：${labels[state]} · 战斗与计时已暂停</span><button id="skipAscensionBtn" disabled>跳过演出</button></div></footer>`;
    const nodes=[...document.querySelectorAll('body > *')].filter(n=>n.tagName!=='SCRIPT'&&n.tagName!=='STYLE'),inert=nodes.map(n=>[n,!!n.inert]);nodes.forEach(n=>n.inert=true);
    session={root,state,stage:Journey.run.stage,attempt:c.attempts,age:0,duration:reduced()?1.5:duration,realm:c.realm,layer:c.layer,fromRealm:details.fromRealm,heroId:P.heroId,focusId:focus?.id,focusChoice:focus?.dataset?.i,storyWasPlaying,inert,scroll:document.getElementById('overlay').scrollTop||0,contentScroll:document.querySelector('.character-content')?.scrollTop||0};
    document.body.classList.add('ascension-open');document.body.appendChild(root);clearInput();root.focus?.();
    document.getElementById('skipAscensionBtn').onclick=()=>{if(session&&session.age>=1.1)finish();};
    Sound.sync('ascension',Journey.run.stage,World.active());Sound.effects('ascension');return true;
  }
  function finish(){
    if(!session)return;const s=session;
    if(RunSave.conflicted()||G.state!==s.state||Journey.run.stage!==s.stage){cancel();return;}
    // Complete only the visual timer. Growth and materials were committed earlier.
    const fx=RealmVisuals.status();if(fx?.major)RealmVisuals.update(fx.duration-fx.age+.00001);
    session=null;release(s);clearInput();
    if(s.state==='character')CharacterUI.draw();
    else if(s.state==='win')Journey.showEnd(true);
    else if(s.state==='levelup')showLevelUp(choicesCache,true);
    const overlay=document.getElementById('overlay');overlay.scrollTop=s.scroll;
    const content=document.querySelector('.character-content');if(content)content.scrollTop=s.contentScroll;
    if(s.storyWasPlaying){const button=document.getElementById('storyPauseBtn');if(button?.textContent.includes('继续'))button.click();}
    const focus=s.focusId?document.getElementById(s.focusId):s.focusChoice!==undefined?document.querySelector('.upcard[data-i="'+s.focusChoice+'"]'):null;focus?.focus?.({preventScroll:true});
    Sound.sync(G.state,Journey.run.stage,World.active());RunSave.save('破境演出完成');syncHUD();
  }
  function update(dt){
    if(!session)return;const s=session;if(RunSave.conflicted()||G.state!==s.state||Journey.run.stage!==s.stage||P.cultivation.attempts!==s.attempt){cancel();return;}
    if(dt<=0||blurred||document.hidden)return;
    s.age=Math.min(s.duration,s.age+dt);const fx=RealmVisuals.status();if(fx?.major)RealmVisuals.update(dt*fx.duration/s.duration);
    document.getElementById('skipAscensionBtn').disabled=s.age<1.1;document.getElementById('ascensionProgress').style.width=(s.age/s.duration*100)+'%';
    document.getElementById('ascensionPhase').textContent=s.age/s.duration<.25?'引灵 · 凝聚天地气机':s.age/s.duration<.72?'破境 · '+RealmVisuals.ascensions[s.realm]:'道成 · 新境归身';
    if(s.age>=s.duration)finish();
  }
  function handleKey(e){if(!session)return false;if(e.code==='Tab'){e.preventDefault();const button=document.getElementById('skipAscensionBtn');(button.disabled?session.root:button).focus?.();}else if(e.repeat||!['Space','Enter'].includes(e.code)||e.target?.id!=='skipAscensionBtn')e.preventDefault();return true;}
  function frame(){
    if(!session)return;const s=session,canvas=document.getElementById('ascensionCanvas');if(!canvas?.getContext)return;
    const pen=canvas.getContext('2d'),w=window.innerWidth,h=window.innerHeight,dpr=Math.min(2,window.devicePixelRatio||1),compact=h<540,phone=w<650,t=s.age,p=t/s.duration,c={realm:s.realm,layer:s.layer},color=RealmVisuals.get(c).color,still=reduced();
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}pen.setTransform(dpr,0,0,dpr,0,0);pen.clearRect(0,0,w,h);
    const cx=compact?w*.44:w/2,feet=compact?h*.74:Math.min(h*.7,h-210),size=compact?170:phone?250:320,cy=feet-size*.55,reach=compact?125:phone?155:240,bloom=still?1:.38+.62*Math.min(1,p*3),fade=Math.min(1,p*6,(1-p)*8);
    const glow=pen.createRadialGradient(cx,cy,8,cx,cy,reach*1.7);glow.addColorStop(0,color+'25');glow.addColorStop(.5,color+'0e');glow.addColorStop(1,color+'00');pen.fillStyle=glow;pen.fillRect(0,0,w,h);
    pen.save();pen.globalAlpha=fade*.65;pen.strokeStyle=color;pen.lineWidth=1;pen.translate(cx,cy);pen.scale(bloom,bloom);
    for(let k=0;k<3+s.realm%3;k++){pen.save();pen.rotate(still?0:t*(k%2?-.08:.06));const r=reach*(.65+k*.12);pen.beginPath();pen.arc(0,0,r,0,Math.PI*2);pen.stroke();for(let i=0;i<8+s.realm;i++){const a=i*Math.PI*2/(8+s.realm);pen.beginPath();pen.moveTo(Math.cos(a)*(r-7),Math.sin(a)*(r-7));pen.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));pen.stroke();}pen.restore();}
    pen.restore();
    // Thirteen established realm emblems unfold behind the same animated hero.
    pen.save();pen.translate(cx,cy+(compact?90:reach*.24));pen.scale(compact?1.2:phone?2.25:2.6,compact?1.2:phone?2.25:2.6);RealmVisuals.advancement(pen,c,false);pen.restore();
    if(!still&&p<.2)Motion.drawHero(pen,{x:cx,y:feet,heroId:s.heroId,preview:true,noAdvancement:true,cultivation:{realm:s.fromRealm,layer:9},look:1},size*(1-p*.7),t,(1-p/.2)*.65,{row:2,col:0,state:'idle'});
    Motion.drawHero(pen,{x:cx,y:feet+(still?0:Math.sin(t*2)*3),heroId:s.heroId,preview:true,noAdvancement:true,cultivation:c,look:1},size,t,still?1:Math.min(1,p*5),{row:2,col:still?0:Math.floor(t*1.6)%2,state:'idle'});
    pen.save();pen.strokeStyle=color;pen.lineWidth=1.1;pen.globalAlpha=.6*fade;pen.translate(cx,feet+10);pen.scale(1,.3);for(let k=0;k<3;k++){pen.beginPath();pen.arc(0,0,reach*(.65+k*.16),0,Math.PI*2);pen.stroke();}pen.restore();
    if(!still){const count=phone?22:42;pen.save();pen.fillStyle=color;for(let i=0;i<count;i++){const q=(i/count+t*.14)%1,a=i*2.39996+s.realm,r=reach*(1-q*.5),x=cx+Math.cos(a)*r,y=feet-q*(size+reach*.5);pen.globalAlpha=Math.sin(q*Math.PI)*fade*.65;pen.beginPath();pen.arc(x,y,1+i%3*.5,0,Math.PI*2);pen.fill();}pen.restore();}
  }
  window.addEventListener('blur',()=>{blurred=true;});window.addEventListener('focus',()=>{blurred=false;});
  return {begin,active,update,frame,finish,cancel,handleKey,status:()=>session?{state:session.state,realm:session.realm,age:session.age,duration:session.duration,stage:session.stage}:null};
})();
