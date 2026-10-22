/* Offline audio: original music, newly generated neural Mandarin performances and Web Audio effects. */
const Sound = (() => {
  // VOICE_CUES_START (kept in sync with docs/audio-cues.json by make-voices-v2.py)
  const voiceCues = {"yujian":["孙小果","御剑，去。"],"wanjian":["孙小果","万剑，随我！"],"wulei":["孙小果","五雷，诛邪！"],"sanmei":["孙小果","三昧真火，起！"],"bingxin":["孙小果","心定，剑不乱。"],"gudu":["孙小果","蛊雾，散。"],"jiushen":["孙小果","借酒，斩妖！"],"guanyin":["孙小果","一息尚存。"],"ult-heaven":["孙小果","以我一剑，破这天规！"],"ult-lotus":["孙小果","莲华开处，生死由我！"],"ult-river":["孙小果","命如江流，我偏逆行！"],"stage-0":["说书人","大圣失踪后，八十一难的名册开始自行改写。无籍剑仙孙小果循一截焦黑毫毛，踏入金蝉受贬的劫痕。"],"stage-1":["说书人","金色毫毛将孙小果引到陈府。门内每夜都传出婴儿的哭声，每到黎明，族谱便少一个名字。"],"stage-2":["说书人","孙小果顺洪江寻到一只永不腐烂的木板。血书上的字，每逢满月便会变成另一个人的笔迹。"],"boss-0":["缄口监院","你以为受贬的是金蝉？被贬的，是敢问价的人。"],"boss-1":["血诏司命","真假不在纸上，在谁活着盖印。"],"boss-2":["沉灯河伯","江水向东，账册向西。你要渡哪一边？"],"phase-0":["缄口监院","万声皆寂。诸戒，归身！"],"phase-1":["血诏司命","印还在，命就断不了。"],"phase-2":["沉灯河伯","借满江亡魂，再点一次灯。"],"victory":["孙小果","这一难，破了。"],"defeat":["孙小果","剑折，路未尽。"],"level":["孙小果","剑意，更进一步。"],"weakness-0":["孙小果","钟心露了，就是现在！"],"weakness-1":["孙小果","诏令断了，趁它收刀！"],"weakness-2":["孙小果","潮势已尽，斩它逆鳞！"],"omen-0":["孙小果","听，钟声歇了。等它落印。"],"omen-1":["孙小果","刀势未尽，先避开。"],"omen-2":["孙小果","潮里留着一线生路。"],"victory-0":["说书人","监院的铁面落地，里面没有舌头。三页证词写着同一个收讫人，却被金漆涂去姓名。"],"victory-1":["说书人","司命的面具后挂着一排空白官印。它从不问诏令真假，只问印泥是否够红。"],"victory-2":["说书人","河伯倒下，灯芯里传出大圣的一声冷笑。别沿着他们写好的路找我。"],"stage-3":["说书人","金毫落在五行山的断碑上。孙小果没有找到大圣，只看见六百道新凿的契痕。"],"boss-3":["压山石魁","山能压人，落款才能压住一个名字。"],"phase-3":["压山石魁","镇山契未断，群峰皆是牢！"],"victory-3":["说书人","石心碎开，里面不是金丹，而是一枚被反复刮去姓名的镇山印。大圣从未签过字。"],"omen-3":["孙小果","引它的重锤，砸断锁柱。"],"weakness-3":["孙小果","石心露了，斩断山契！"],"stage-4":["说书人","残籍驿每到黄昏便有一支空马队进山。它们载走证人，留下同样的空白名帖。"],"boss-4":["无籍追猎将","没有名字的人，也配向我问路？"],"phase-4":["无籍追猎将","三链问名，今夜换你！"],"victory-4":["说书人","面甲下是一叠湿透的路引。每夺一个名字，它就能多活一夜。"],"omen-4":["孙小果","金毫有影，只有这枚是真。"],"weakness-4":["孙小果","追链已尽，趁它收势！"],"stage-5":["说书人","鹰愁涧的水向两岸退去，露出一条布满锁鳞的龙骨桥。桥下的哭声，来自白蛟的喉中。"],"boss-5":["封喉白蛟","我吞下的每一字，都有人拿去换了功德。"],"phase-5":["封喉白蛟","愿契入水，雷潮封喉！"],"victory-5":["说书人","白蛟终于吐出一片袈裟。上面的名字都在呼吸，唯独收契者的名字是一块空白。"],"omen-5":["孙小果","冲岸露鳞，去干岸迎潮。"],"weakness-5":["孙小果","雷潮退去，斩开锁喉！"],"stage-6":["说书人","白蛟吐出的袈裟角，把孙小果引进一座永不天明的禅院。每烧掉一条许愿红绸，功德簿上便多一笔收入。"],"boss-6":["阴愿主使","有人替你受难，你的愿才算灵验。"],"phase-6":["阴愿主使","香火不灭，谁敢问价！"],"omen-6":["孙小果","三盏净灯已明，避过十字焚线。"],"weakness-6":["孙小果","收炉了，断它香火！"],"victory-6":["说书人","香炉裂开，里面没有神佛，只有一册转灾账。"],"stage-7":["说书人","黑风林的树都朝同一个方向弯腰。枝头挂着数千件无主袈裟，风一吹，便替人答应下一场劫。"],"boss-7":["披愿黑熊","我披的是他们的愿，压下来的却全是我的罪。"],"phase-7":["披愿黑熊","风钟不响，这衣就脱不了！"],"omen-7":["孙小果","双钟已响，避尽三爪。"],"weakness-7":["孙小果","爪势已尽，斩开袈裟！"],"victory-7":["说书人","袈裟落地，黑熊的背上钉满小小的木牌。它守的不是财宝，是没有资格求救的人。"],"stage-8":["说书人","石窟深处没有佛像，只有排列成佛形的白骨。焚愿老衲把死者的心愿刻在骨上，拿去抵消活人的罪。"],"boss-8":["焚愿老衲","生前不肯许的愿，死后总会答应。"],"phase-8":["焚愿老衲","把你最初的愿，也念给我听！"],"omen-8":["孙小果","一退，二进，三退。别信空愿的回声。"],"weakness-8":["孙小果","骨声已散，斩它本心！"],"victory-8":["说书人","最后一重回声散去，神木里露出大圣留下的半句。他们买卖的，从来不是功德。"]};
  // VOICE_CUES_END
  const defaults={music:.42,effects:.65,voice:.85,muted:false};
  let settings={...defaults};
  try{const saved=JSON.parse(localStorage.getItem('xunsheng-audio')||'null');if(saved)for(const k of ['music','effects','voice']){if(Number.isFinite(saved[k]))settings[k]=Math.max(0,Math.min(1,saved[k]));}if(saved)settings.muted=!!saved.muted;}catch(_){}
  const musicNames=['exile','birth','river','mountain','outpost','dragon','wish','windwood','bonewish','contract','wedding','yellowwind','sunken','whitebone','shadowcity','twinforge','lotusname','mirrorwell','oathwood','borrowflame','blackwater','thundercourt','icepass','goldring','lifemirror','scorpionecho','twinspring','ashfront','bloodrelic','nineledger','thornscript','falsebuddha','silkpledge','bonecitadel','sixivory','lifedeer','namelesspit','crownless','droughtgate','foldedarms','ownerless','returnstone'],music=new Map(),cooldowns=new Map(),voices=new Map(),captionOnly=new Set();
  let context=null,effectBus=null,compressor=null,reverb=null,activated=false,scene='start',stage=0,boss=false;
  let currentTrack='',voice=null,lastVoice=-Infinity,lastSync=0,lastStatus='',hidden=false,serial=0,noiseSeed=0x81ac;
  let subtitle=null,ordinaryCalls=0,storyVoice=null;
  const spokenSpells=new Set();
  const nodes=new Set();
  const clock=()=>performance.now()/1000;
  const random=()=>{noiseSeed^=noiseSeed<<13;noiseSeed^=noiseSeed>>>17;noiseSeed^=noiseSeed<<5;return (noiseSeed>>>0)/4294967296;};
  const permitted=()=>activated&&!settings.muted&&!hidden&&!['paused','journal','bench','map','character','station'].includes(scene);
  function persist(){try{localStorage.setItem('xunsheng-audio',JSON.stringify(settings));}catch(_){}updateControls();}
  function updateControls(){
    const button=document.getElementById('audioBtn');if(button){button.textContent=settings.muted?'♫ 已静音':'♫ 声音';button.setAttribute('aria-label',settings.muted?'声音设置，当前静音':'声音设置');}
    for(const [key,id] of [['music','musicVolume'],['effects','effectsVolume'],['voice','voiceVolume']]){
      const slider=document.getElementById(id),label=document.getElementById(id+'Value');
      if(slider)slider.value=Math.round(settings[key]*100);if(label)label.textContent=Math.round(settings[key]*100)+'%';
    }
    const mute=document.getElementById('muteAudioBtn');if(mute){mute.textContent=settings.muted?'开启全部声音':'静音全部声音';mute.setAttribute('aria-pressed',String(settings.muted));}
  }
  function statusLabel(text){if(text===lastStatus)return;lastStatus=text;const el=document.getElementById('audioStatus');if(el)el.textContent=text;}
  function activate(){
    if(!activated){
      activated=true;
      try{
        const Engine=window.AudioContext||window.webkitAudioContext;
        if(Engine){
          context=new Engine();effectBus=context.createGain();compressor=context.createDynamicsCompressor();
          compressor.threshold.value=-15;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.17;
          effectBus.connect(compressor);compressor.connect(context.destination);
          reverb=context.createConvolver();const impulse=context.createBuffer(2,Math.floor(context.sampleRate*.65),context.sampleRate);
          for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(random()*2-1)*(1-i/data.length)**3*.26;}
          reverb.buffer=impulse;const wet=context.createGain();wet.gain.value=.16;effectBus.connect(reverb);reverb.connect(wet);wet.connect(compressor);
        }
      }catch(_){context=null;}
    }
    if(context?.state==='suspended'&&!hidden)context.resume().catch(()=>{});
    sync(scene,stage,boss,true);
  }
  function track(id){
    if(music.has(id))return music.get(id);
    if(typeof Audio==='undefined')return null;
    const audio=new Audio('assets/audio/music/'+id+'.mp3');audio.loop=true;audio.preload='auto';audio.volume=0;
    const entry={audio,pending:false,failed:false,retryAt:0};music.set(id,entry);return entry;
  }
  function playMusic(entry){
    if(!entry||entry.pending||!entry.audio.paused||(entry.failed&&clock()<entry.retryAt))return;
    entry.pending=true;
    const attempt=entry.audio.play();
    Promise.resolve(attempt).then(()=>{entry.failed=false;}).catch(error=>{if(error?.name!=='AbortError'){entry.failed=true;entry.retryAt=clock()+5;statusLabel('点击声音按钮启用播放');}}).finally(()=>{entry.pending=false;});
  }
  function caption(id){
    if(!subtitle&&document.createElement&&document.body?.appendChild){
      subtitle=document.createElement('div');subtitle.id='voiceCaption';subtitle.setAttribute('role','status');subtitle.setAttribute('aria-live','polite');
      subtitle.style.cssText='position:fixed;z-index:48;left:50%;bottom:126px;transform:translateX(-50%);width:max-content;max-width:min(720px,calc(100vw - 42px));padding:10px 17px;border:1px solid #c3ae7150;border-radius:3px;background:linear-gradient(90deg,#071316b8,#071316ed,#071316b8);box-shadow:0 4px 24px #0007;color:#e8debf;font:14px/1.75 KaiTi,STKaiti,serif;text-align:center;letter-spacing:.8px;pointer-events:none;text-shadow:0 2px 3px #000;';
      document.body.appendChild(subtitle);
    }
    if(!subtitle)return;
    const cue=voiceCues[id];subtitle.hidden=!cue;subtitle.textContent=cue?cue[0]+' · '+cue[1]:'';
  }
  function stopVoice(){
    if(voice){voice.audio.pause();voice.audio.currentTime=0;voice=null;}
    caption(null);
  }
  function legacyCue(id){
    if(id.startsWith('victory-'))return 'victory';
    return id.startsWith('weakness-')||id.startsWith('omen-')?null:id;
  }
  function speak(id,priority=10,repeat=14,audition=false){
    if((!permitted()&&!(audition&&activated&&!settings.muted&&!hidden))||settings.voice<=0||typeof Audio==='undefined')return false;
    const now=clock();
    if(now-(cooldowns.get('voice:'+id)??-Infinity)<repeat)return false;
    if(voice&&priority<=voice.priority)return false;
    if(priority<70&&now-lastVoice<4.5)return false;
    stopVoice();
    if(captionOnly.has(id)){const token=++serial;caption(id);cooldowns.set('voice:'+id,now);setTimeout(()=>{if(serial===token)caption(null);},Math.max(3000,(voiceCues[id]?.[1].length||20)*170));return true;}
    let audio=voices.get(id);if(!audio){audio=new Audio('assets/audio/voice-v2/'+id+'.mp3');audio.preload='auto';voices.set(id,audio);}
    if(audio._legacyVoice){audio.src='assets/audio/voice-v2/'+id+'.mp3';audio._legacyVoice=false;}
    const token=++serial;audio.currentTime=0;audio.volume=settings.voice;voice={audio,id,priority,token,audition,fallback:false};lastVoice=now;cooldowns.set('voice:'+id,now);caption(id);
    const done=()=>{if(voice?.token===token){voice=null;caption(null);}};
    const fallback=()=>{
      if(voice?.token!==token)return;
      const legacy=legacyCue(id);
      if(voice.fallback||!legacy){done();return;}
      voice.fallback=true;audio._legacyVoice=true;audio.src='assets/audio/voice/'+legacy+'.mp3';audio.currentTime=0;
      // Old recordings have different words: do not present the new sentence as their subtitle.
      caption(null);Promise.resolve(audio.play()).catch(done);
    };
    audio.onended=done;audio.onerror=fallback;
    Promise.resolve(audio.play()).catch(error=>{if(error?.name==='NotSupportedError')fallback();else done();});return true;
  }
  function allow(id,seconds){const now=clock();if(now-(cooldowns.get('fx:'+id)??-Infinity)<seconds)return false;cooldowns.set('fx:'+id,now);return true;}
  function tone(frequency,duration,volume=.12,type='sine',endFrequency=null,delay=0,pan=0){
    if(!context||!permitted()||settings.effects<=0||nodes.size>72)return;
    const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,frequency),at);
    if(endFrequency)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),at+duration);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain);
    const panner=context.createStereoPanner?.();if(panner){panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);panner.connect(effectBus);}else gain.connect(effectBus);
    nodes.add(osc);osc.onended=()=>{nodes.delete(osc);osc.disconnect();gain.disconnect();panner?.disconnect();};osc.start(at);osc.stop(at+duration+.02);
  }
  function noise(duration,volume=.08,cutoff=1500,pan=0){
    if(!context||!permitted()||settings.effects<=0)return;
    const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(random()*2-1)*(1-i/data.length)**2;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=cutoff;filter.Q.value=.7;gain.gain.value=volume;
    source.connect(filter);filter.connect(gain);
    const panner=context.createStereoPanner?.();if(panner){panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);panner.connect(effectBus);}else gain.connect(effectBus);
    nodes.add(source);source.onended=()=>{nodes.delete(source);source.disconnect();filter.disconnect();gain.disconnect();panner?.disconnect();};source.start();
  }
  function effects(id,pan=0){
    if(!permitted()||settings.effects<=0||!allow(id,id==='hit'?.075:id==='step'?.23:.08))return;
    if(id==='yujian'||id==='dash'){noise(.2,id==='dash'?.17:.1,1800,pan);tone(950,.13,.045,'triangle',280,0,pan);}
    else if(id==='wulei'){noise(.4,.28,700,pan);tone(75,.48,.19,'sine',34);tone(2300,.1,.07,'sawtooth',100,0,pan);}
    else if(id==='sanmei'||id==='jiushen'){noise(.65,.25,id==='sanmei'?700:400,pan);tone(110,.55,.16,'sine',32,0,pan);}
    else if(id==='bingxin'||id==='guanyin'||id==='wanjian'){
      [0,7,12,19].forEach((n,i)=>tone(440*2**(n/12),.6,.055,'sine',null,i*.055,pan));
    }else if(id==='gudu'){noise(.6,.13,420,pan);tone(270,.5,.06,'sine',90,0,pan);}
    else if(id==='hit'){noise(.085,.13,2600,pan);tone(1700,.07,.035,'triangle',500,0,pan);}
    else if(id==='hurt'){noise(.18,.17,450);tone(115,.2,.14,'sine',55);}
    else if(id==='step'){noise(.06,.045,650,pan);}
    else if(id==='ult-charge'){[110,165,220,330].forEach((f,i)=>tone(f,.7,.08,'sine',f*2,i*.06));noise(.7,.13,1200);}
    else if(id==='ult-impact'){noise(.8,.35,650);tone(95,.8,.3,'sine',28);[440,660,880].forEach((f,i)=>tone(f,.9,.06,'triangle',null,i*.05));}
    else if(id==='ult-river'){noise(.3,.21,2100);[660,880,1320].forEach((f,i)=>tone(f,.3,.06,'triangle',f*.7,i*.04));}
    else if(id==='boss'||id==='phase'){tone(70,1.6,.2,'sine',45);tone(216,1.4,.09,'triangle',113);noise(.9,.17,400);}
    else if(id==='warning'){tone(660,.17,.06,'sine',440);}
    else if(id==='weakness'){tone(147,.5,.13,'sine',85);[523,784,1046].forEach((f,i)=>tone(f,.45,.06,'triangle',null,i*.045));noise(.18,.1,2400);}
    else if(id==='bell-impact'){[147,301,438,711].forEach((f,i)=>tone(f,.85,.075/(1+i*.4),'sine',f*.97,i*.016));noise(.16,.09,550,pan);}
    else if(id==='edict-impact'){noise(.25,.18,2200,pan);tone(420,.22,.07,'sawtooth',90,0,pan);}
    else if(id==='tide-impact'){noise(.7,.21,650,pan);tone(75,.6,.11,'sine',38,0,pan);}
    else if(id==='ascension'){tone(55,2.8,.15,'sine',82);noise(1.8,.11,280);[110,165,220,330,440,660].forEach((f,i)=>tone(f,2.4,.055,'sine',f*1.01,i*.14));}
    else if(id==='victory'||id==='level'||id==='chest'){
      [0,7,12,16,19].forEach((n,i)=>tone(330*2**(n/12),.8,.065,'triangle',null,i*.09));
    }else if(id==='defeat'){[220,174.6,146.8,110].forEach((f,i)=>tone(f,1.2,.07,'sine',null,i*.18));}
    else if(id==='ui'){tone(660,.07,.03,'sine',800);}
  }
  function spell(id){
    effects(id);
    // Automatic attacks carry their physical sound; sparse first-use calls leave room for the scene.
    if(id==='yujian'||boss||ordinaryCalls>=3||spokenSpells.has(id)||clock()-lastVoice<20)return;
    if(speak(id,20,60)){spokenSpells.add(id);ordinaryCalls++;}
  }
  function ultimate(id){speak('ult-'+id,100,8);effects('ult-charge');}
  function stageIntro(index){stage=index;currentTrack='';stopVoice();speak('stage-'+index,80,0);}
  // Story progression is driven by completion, never by an estimated audio duration.
  function narrateStory(text,index,onState,onEnd){
    stopNarration();stopVoice();
    const pack=typeof StoryVoicePack!=='undefined'?StoryVoicePack:null;
    const control={audio:null,text,voice:pack?.profile.voice||null,profile:'heavy',state:'loading',userPaused:false,cancelled:false,completed:false,started:false,silent:false};
    storyVoice=control;
    const active=()=>storyVoice===control&&!control.cancelled;
    const report=state=>{if(active()){control.state=state;onState(state);}};
    const waiting=()=>control.userPaused||hidden;
    const finish=()=>{if(!active())return;control.completed=true;if(waiting()){report('paused');return;}report('ended');onEnd();};
    control.cancel=()=>{control.cancelled=true;if(control.audio){control.audio.onended=control.audio.onerror=control.audio.onplaying=null;control.audio.pause();}};
    control.pause=()=>{control.audio?.pause();report('paused');};
    control.resume=()=>{
      if(!active()||waiting())return;
      if(control.silent){report('silent');return;}
      if(control.completed){finish();return;}
      if(control.audio){report('loading');Promise.resolve(control.audio.play()).catch(()=>report('blocked'));}
    };
    control.restart=()=>{const paused=control.userPaused,next=narrateStory(text,index,onState,onEnd);if(paused){next.userPaused=true;next.pause();}};
    control.silence=()=>{control.silent=true;control.audio?.pause();report('silent');};
    report('loading');
    if(settings.muted||settings.voice===0){control.silent=true;report('silent');return control;}
    if(!activated){report('blocked');return control;}
    const file=pack?.clips[text];
    if(typeof Audio==='undefined'||!file){report('unavailable');return control;}
    const audio=new Audio(file);control.audio=audio;audio.preload='auto';audio.volume=settings.voice;
    audio.onplaying=()=>{if(active()){control.started=true;if(waiting())control.pause();else report('playing');}};
    audio.onended=finish;audio.onerror=()=>report('unavailable');
    Promise.resolve(audio.play()).catch(error=>{if(active())report(error?.name==='NotAllowedError'?'blocked':'unavailable');});
    setTimeout(()=>{if(active()&&control.state==='loading'&&!control.started&&!waiting()&&!control.silent)report('blocked');},15000);
    return control;
  }
  function stopNarration(){if(storyVoice){storyVoice.cancel();storyVoice=null;}if(voice?.id.startsWith('stage-'))stopVoice();}
  function pauseNarration(paused){
    if(storyVoice){storyVoice.userPaused=paused;if(paused)storyVoice.pause();else storyVoice.resume();return;}
    if(!voice?.id.startsWith('stage-'))return;
    if(paused)voice.audio.pause();else Promise.resolve(voice.audio.play()).catch(stopVoice);
  }
  function guardian(index,phase=false){speak((phase?'phase-':'boss-')+index,115,0);effects(phase?'phase':'boss');}
  function weakness(index){effects('weakness');speak('weakness-'+index,120,18);}
  function omen(index){speak('omen-'+index,75,32);}
  function result(victory){stopVoice();effects(victory?'victory':'defeat');speak(victory?'victory-'+stage:'defeat',125,0);}
  function reset(){stopNarration();stopVoice();cooldowns.clear();spokenSpells.clear();ordinaryCalls=0;lastVoice=-Infinity;for(const node of nodes){try{node.stop();}catch(_){}}nodes.clear();}
  function sync(state=scene,index=stage,isBoss=boss,force=false){
    const now=clock(),dt=Math.min(.2,Math.max(.005,now-lastSync));lastSync=now;
    if((state==='playing'&&scene==='story'&&voice?.id.startsWith('stage-'))||(state==='playing'&&['win','dead'].includes(scene)))stopVoice();
    scene=state;stage=index;boss=isBoss;
    if(!activated)return;
    const playing=permitted(),duck=(voice&&!voice.audio.paused||storyVoice?.state==='playing') ? .38 : 1;
    if(effectBus&&context)effectBus.gain.setTargetAtTime(settings.muted||hidden||(!playing&&!voice?.audition)?0:settings.effects*((voice&&!voice.audio.paused) ? .72 : 1),context.currentTime,.04);
    if(voice)voice.audio.volume=settings.muted||hidden?0:settings.voice;
    if(!playing&&!voice?.audition)stopVoice();
    const combat=state==='playing'&&isBoss;
    const wanted=musicNames[Math.max(0,Math.min(musicNames.length-1,index))]+(combat?'-boss':'-field');
    currentTrack=wanted;
    const selected=playing&&settings.music>0?track(wanted):null;
    if(force&&selected){selected.failed=false;selected.retryAt=0;}
    if(selected)playMusic(selected);
    const sceneLevel=['start','story','levelup','chest','win','dead'].includes(state)?.65:1;
    for(const [id,entry] of music){
      const target=playing&&id===wanted?settings.music*duck*sceneLevel:0;
      const k=force?1:Math.min(1,dt*3.5);entry.audio.volume=Math.max(0,Math.min(1,entry.audio.volume+(target-entry.audio.volume)*k));
      if(target===0&&entry.audio.volume<.005&&!entry.audio.paused){entry.audio.pause();entry.audio.volume=0;}
    }
    if(!playing)statusLabel(settings.muted?'全部声音已静音':hidden?'窗口离开，声音已暂停':'声音已暂停');
    else if(selected&&!selected.failed)statusLabel((['失声禅庭','血诏陈府','夜渡洪江'][index]||'寻圣')+(combat?' · 守关曲':' · 行路曲'));
  }
  function set(key,value){
    if(key==='muted')settings.muted=!!value;
    else if(['music','effects','voice'].includes(key)&&Number.isFinite(Number(value)))settings[key]=Math.max(0,Math.min(1,Number(value)));
    else return;
    if(settings.muted||settings.voice===0)stopVoice();persist();sync(scene,stage,boss,true);
    if(storyVoice){if(settings.muted||settings.voice===0)storyVoice.silence();else if(storyVoice.silent)storyVoice.restart();else if(storyVoice.audio)storyVoice.audio.volume=settings.voice;}
  }
  function setHidden(value){hidden=!!value;if(hidden){storyVoice?.pause();stopVoice();for(const e of music.values())e.audio.pause();for(const n of nodes){try{n.stop();}catch(_){}}nodes.clear();context?.suspend().catch(()=>{});}else if(activated){context?.resume().catch(()=>{});storyVoice?.resume();}sync(scene,stage,boss,true);}
  function install(){
    document.addEventListener('pointerdown',activate,{capture:true});
    document.addEventListener('keydown',e=>{if(e.repeat)return;activate();if(e.key.toLowerCase()==='m'&&!['INPUT','TEXTAREA'].includes(e.target?.tagName)){e.preventDefault();set('muted',!settings.muted);}},{capture:true});
    document.addEventListener('visibilitychange',()=>setHidden(document.hidden));
    window.addEventListener('blur',()=>setHidden(true));window.addEventListener('focus',()=>setHidden(false));
    const button=document.getElementById('audioBtn'),panel=document.getElementById('audioPanel');
    if(button&&panel)button.onclick=()=>{activate();panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden&&typeof G!=='undefined'&&G.state==='playing')togglePause();};
    const close=document.getElementById('closeAudioBtn');if(close)close.onclick=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');};
    for(const [key,id] of [['music','musicVolume'],['effects','effectsVolume'],['voice','voiceVolume']]){const slider=document.getElementById(id);if(slider)slider.oninput=()=>set(key,Number(slider.value)/100);}
    const mute=document.getElementById('muteAudioBtn');if(mute)mute.onclick=()=>set('muted',!settings.muted);
    const preview=document.getElementById('previewVoiceBtn');if(preview){preview.textContent='试听厚重旁白';preview.onclick=()=>{
      activate();
      if(storyVoice){
        if(storyVoice.userPaused){const resume=document.getElementById('storyPauseBtn');if(resume?.onclick)resume.onclick();else {storyVoice.userPaused=false;storyVoice.resume();}}
        else storyVoice.restart();
        return;
      }
      if(typeof Journey!=='undefined'){const text=Journey.storyPages(stage,Journey.run.heroId)[0];narrateStory(text,stage,()=>{},()=>stopNarration());}
    };}
    updateControls();statusLabel('点击入劫后启用声音 · M 静音');
  }
  function status(){return {activated,settings:{...settings},scene,stage,boss,track:currentTrack,voice:voice?.id||null,narration:storyVoice?{state:storyVoice.state,text:storyVoice.text,source:storyVoice.audio?'recording':'unavailable',profile:storyVoice.profile,time:storyVoice.audio?.currentTime??null,duration:storyVoice.audio?.duration??null,voice:storyVoice.voice}:null,voicePack:'neural-v2',voiceSource:voice?.audio.src||null,subtitle:voice&&!voice.fallback?voiceCues[voice.id]?.[1]||null:null,ordinaryCalls,playingVoice:!!voice&&!voice.audio.paused,music:Array.from(music,([id,e])=>({id,playing:!e.audio.paused,volume:e.audio.volume,failed:e.failed,time:e.audio.currentTime,duration:e.audio.duration||0})),nodes:nodes.size,hidden};}
  install();
  // New prose can ship with captions and original local music without requesting remote TTS.
  function registerCaption(id,speaker,text){voiceCues[id]=[speaker,text];captionOnly.add(id);}
  return {activate,sync,spell,ultimate,stageIntro,narrateStory,pauseNarration,stopNarration,guardian,weakness,omen,result,effects,speak,reset,set,status,registerCaption};
})();
