const assert=require('node:assert/strict');
const {createHarness}=require('./game-harness');let passed=0;
async function check(name,code){const h=createHarness();h.evaluate(`
  globalThis.audioClips=[];globalThis.timers=[];
  Audio=class{constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.duration=40;audioClips.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
  window.speechSynthesis={getVoices(){throw Error('The story must use the heavy recordings exclusively');}};
  setTimeout=(fn,delay)=>timers.push({fn,delay});Sound.activate();Journey.playStory(0,true);
  globalThis.scene=()=>document.getElementById('overlay').innerHTML;
  globalThis.narrations=()=>audioClips.filter(a=>a.src.includes('/voice-heavy/'));
  globalThis.narration=()=>narrations().at(-1);
`);await new Promise(ok=>setImmediate(ok));assert.equal(await h.evaluate(`(()=>{${code}})()`),true,name);console.log('PASS '+name);passed++;}
(async()=>{
await check('slow loading and a forty-second recording never advance on a text timer',`
  if(!narration())return false;for(const t of timers.splice(0))t.fn();if(!scene().includes('1 / 3'))return false;
  narration().onplaying();for(const t of timers.splice(0))t.fn();return scene().includes('1 / 3')&&Sound.status().narration.state==='playing';`);
await check('all three scene recordings use one heavy voice and advance only on completion',`
  const end=narration().onended;end();if(!scene().includes('2 / 3')||narrations().length!==2)return false;
  if(narration().src!==StoryVoicePack.clips[Journey.stages[0].story[1]])return false;
  end();if(narrations().length!==2)return false;narration().onended();
  return scene().includes('3 / 3')&&narration().src===StoryVoicePack.clips[Journey.stages[0].story[2]]&&Sound.status().narration.voice==='zh-CN-YunyangNeural';`);
await check('pause retains the recording position and delays completed-scene progression',`
  const clip=narration();clip.onplaying();clip.currentTime=5;document.getElementById('storyPauseBtn').onclick();
  if(!clip.paused||clip.currentTime!==5)return false;clip.onended();if(!scene().includes('1 / 3'))return false;
  document.getElementById('storyPauseBtn').onclick();return scene().includes('2 / 3');`);
await check('later recordings resume without creating a second simultaneous narrator',`
  narration().onended();narration().onplaying();const count=narrations().length;
  document.getElementById('storyPauseBtn').onclick();if(!narration().paused)return false;
  document.getElementById('storyPauseBtn').onclick();return !narration().paused&&narrations().length===count;`);
await check('manual next and menu exit invalidate stale completion callbacks',`
  const end=narration().onended;document.getElementById('storyNextBtn').onclick();end();if(!scene().includes('2 / 3'))return false;
  const late=narration().onended;Journey.menu();const menu=scene();late();return scene()===menu&&Sound.status().narration===null;`);
await check('result overlays cancel old narration without cancelling the victory voice',`
  const end=narration().onended;G.state='win';G.boss={hp:0,killed:true};Sound.result(true);Journey.showEnd(true);const result=scene();end();
  return scene()===result&&Sound.status().narration===null&&Sound.status().voice==='victory-0';`);
await check('missing recordings hold the scene and never substitute another voice',`
  narration().onerror();for(const t of timers.splice(0))t.fn();
  return scene().includes('1 / 3')&&Sound.status().narration.state==='unavailable'&&narrations().length===1&&document.getElementById('storyPauseBtn').textContent==='重试语音';`);
await check('browser playback rejection holds the scene until retry',`
  return(async()=>{const play=Audio.prototype.play;Audio.prototype.play=()=>Promise.reject({name:'NotAllowedError'});Journey.playStory(0,true);
  await Promise.resolve();await Promise.resolve();for(const t of timers.splice(0))t.fn();if(!scene().includes('1 / 3')||Sound.status().narration.state!=='blocked')return false;
  Audio.prototype.play=play;document.getElementById('storyPauseBtn').onclick();return Sound.status().narration.state==='loading';})();`);
await check('explicit mute uses reading time and unmute returns to the heavy recording',`
  Sound.set('muted',true);document.getElementById('storyPauseBtn').onclick();for(const t of timers.splice(0))t.fn();if(!scene().includes('1 / 3'))return false;
  document.getElementById('storyPauseBtn').onclick();timers.find(t=>t.delay>=6500&&t.delay<15000).fn();if(!scene().includes('2 / 3'))return false;
  Sound.set('muted',false);return narration().src===StoryVoicePack.clips[Journey.stages[0].story[1]];`);
await check('the audition reuses the heavy narrator with no overlapping second speaker',`
  document.getElementById('previewVoiceBtn').onclick();if(narrations().filter(a=>!a.paused).length!==1||Sound.status().voice!==null)return false;
  Sound.stopNarration();document.getElementById('previewVoiceBtn').onclick();return narrations().filter(a=>!a.paused).length===1&&Sound.status().narration.profile==='heavy';`);
await check('audition resumes a paused scene instead of layering a second voice',`
  narration().onplaying();document.getElementById('storyPauseBtn').onclick();const count=narrations().length;
  document.getElementById('previewVoiceBtn').onclick();return !narration().paused&&narrations().length===count&&narrations().filter(a=>!a.paused).length===1;`);
await check('both hero identities and every chapter use the exact recorded text',`
  for(const hero of ['xiaoguo','tinglan'])for(let i=0;i<12;i++){Journey.run.heroId=hero;Journey.playStory(i,true);
    const status=Sound.status().narration;if(status.profile!=='heavy'||narration().src!==StoryVoicePack.clips[status.text]||!scene().includes(status.text))return false;}
  return true;`);
console.log(passed+' heavy story voice and synchronization checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
