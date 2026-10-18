/* Offline audio: original music, newly generated neural Mandarin performances and Web Audio effects. */
const Sound = (() => {
  // VOICE_CUES_START (kept in sync with docs/audio-cues.json by make-voices-v2.py)
  const voiceCues = {"yujian":["孙小果","御剑，去。"],"wanjian":["孙小果","万剑，随我！"],"wulei":["孙小果","五雷，诛邪！"],"sanmei":["孙小果","三昧真火，起！"],"bingxin":["孙小果","心定，剑不乱。"],"gudu":["孙小果","蛊雾，散。"],"jiushen":["孙小果","借酒，斩妖！"],"guanyin":["孙小果","一息尚存。"],"ult-heaven":["孙小果","以我一剑，破这天规！"],"ult-lotus":["孙小果","莲华开处，生死由我！"],"ult-river":["孙小果","命如江流，我偏逆行！"],"stage-0":["说书人","大圣失踪后，八十一难的名册开始自行改写。无籍剑仙孙小果循一截焦黑毫毛，踏入金蝉受贬的劫痕。"],"stage-1":["说书人","金色毫毛将孙小果引到陈府。门内每夜都传出婴儿的哭声，每到黎明，族谱便少一个名字。"],"stage-2":["说书人","孙小果顺洪江寻到一只永不腐烂的木板。血书上的字，每逢满月便会变成另一个人的笔迹。"],"boss-0":["缄口监院","你以为受贬的是金蝉？被贬的，是敢问价的人。"],"boss-1":["血诏司命","真假不在纸上，在谁活着盖印。"],"boss-2":["沉灯河伯","江水向东，账册向西。你要渡哪一边？"],"phase-0":["缄口监院","万声皆寂。诸戒，归身！"],"phase-1":["血诏司命","印还在，命就断不了。"],"phase-2":["沉灯河伯","借满江亡魂，再点一次灯。"],"victory":["孙小果","这一难，破了。"],"defeat":["孙小果","剑折，路未尽。"],"level":["孙小果","剑意，更进一步。"],"weakness-0":["孙小果","钟心露了，就是现在！"],"weakness-1":["孙小果","诏令断了，趁它收刀！"],"weakness-2":["孙小果","潮势已尽，斩它逆鳞！"],"omen-0":["孙小果","听，钟声歇了。等它落印。"],"omen-1":["孙小果","刀势未尽，先避开。"],"omen-2":["孙小果","潮里留着一线生路。"],"victory-0":["说书人","监院的铁面落地，里面没有舌头。三页证词写着同一个收讫人，却被金漆涂去姓名。"],"victory-1":["说书人","司命的面具后挂着一排空白官印。它从不问诏令真假，只问印泥是否够红。"],"victory-2":["说书人","河伯倒下，灯芯里传出大圣的一声冷笑。别沿着他们写好的路找我。"]};
  // VOICE_CUES_END
  const defaults={music:.42,effects:.65,voice:.85,muted:false};
  let settings={...defaults};
  try{const saved=JSON.parse(localStorage.getItem('xunsheng-audio')||'null');if(saved)for(const k of ['music','effects','voice']){if(Number.isFinite(saved[k]))settings[k]=Math.max(0,Math.min(1,saved[k]));}if(saved)settings.muted=!!saved.muted;}catch(_){}
  const musicNames=['exile','birth','river'],music=new Map(),cooldowns=new Map(),voices=new Map();
  let context=null,effectBus=null,compressor=null,reverb=null,activated=false,scene='start',stage=0,boss=false;
  let currentTrack='',voice=null,lastVoice=-Infinity,lastSync=0,lastStatus='',hidden=false,serial=0,noiseSeed=0x81ac;
  let subtitle=null,ordinaryCalls=0;
  const spokenSpells=new Set();
  const nodes=new Set();
  const clock=()=>performance.now()/1000;
  const random=()=>{noiseSeed^=noiseSeed<<13;noiseSeed^=noiseSeed>>>17;noiseSeed^=noiseSeed<<5;return (noiseSeed>>>0)/4294967296;};
  const permitted=()=>activated&&!settings.muted&&!hidden&&!['paused','journal','bench','map'].includes(scene);
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
  function guardian(index,phase=false){speak((phase?'phase-':'boss-')+index,115,0);effects(phase?'phase':'boss');}
  function weakness(index){effects('weakness');speak('weakness-'+index,120,18);}
  function omen(index){speak('omen-'+index,75,32);}
  function result(victory){stopVoice();effects(victory?'victory':'defeat');speak(victory?'victory-'+stage:'defeat',125,0);}
  function reset(){stopVoice();cooldowns.clear();spokenSpells.clear();ordinaryCalls=0;lastVoice=-Infinity;for(const node of nodes){try{node.stop();}catch(_){}}nodes.clear();}
  function sync(state=scene,index=stage,isBoss=boss,force=false){
    const now=clock(),dt=Math.min(.2,Math.max(.005,now-lastSync));lastSync=now;
    if((state==='playing'&&scene==='story'&&voice?.id.startsWith('stage-'))||(state==='playing'&&['win','dead'].includes(scene)))stopVoice();
    scene=state;stage=index;boss=isBoss;
    if(!activated)return;
    const playing=permitted(),duck=(voice&&!voice.audio.paused) ? .38 : 1;
    if(effectBus&&context)effectBus.gain.setTargetAtTime(settings.muted||hidden||(!playing&&!voice?.audition)?0:settings.effects*((voice&&!voice.audio.paused) ? .72 : 1),context.currentTime,.04);
    if(voice)voice.audio.volume=settings.muted||hidden?0:settings.voice;
    if(!playing&&!voice?.audition)stopVoice();
    const combat=state==='playing'&&isBoss;
    const wanted=musicNames[Math.max(0,Math.min(2,index))]+(combat?'-boss':'-field');
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
  }
  function setHidden(value){hidden=!!value;if(hidden){stopVoice();for(const e of music.values())e.audio.pause();for(const n of nodes){try{n.stop();}catch(_){}}nodes.clear();context?.suspend().catch(()=>{});}else if(activated){context?.resume().catch(()=>{});}sync(scene,stage,boss,true);}
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
    const preview=document.getElementById('previewVoiceBtn');if(preview){preview.textContent='试听场景旁白';preview.onclick=()=>{activate();const previous=scene;scene='start';stopVoice();speak('stage-'+stage,130,0,true);scene=previous;};}
    updateControls();statusLabel('点击入劫后启用声音 · M 静音');
  }
  function status(){return {activated,settings:{...settings},scene,stage,boss,track:currentTrack,voice:voice?.id||null,voicePack:'neural-v2',voiceSource:voice?.audio.src||null,subtitle:voice&&!voice.fallback?voiceCues[voice.id]?.[1]||null:null,ordinaryCalls,playingVoice:!!voice&&!voice.audio.paused,music:Array.from(music,([id,e])=>({id,playing:!e.audio.paused,volume:e.audio.volume,failed:e.failed,time:e.audio.currentTime,duration:e.audio.duration||0})),nodes:nodes.size,hidden};}
  install();
  return {activate,sync,spell,ultimate,stageIntro,guardian,weakness,omen,result,effects,speak,reset,set,status};
})();
