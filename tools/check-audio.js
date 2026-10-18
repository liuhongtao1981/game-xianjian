const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
let time=0,count=0;
const allAudio=[],storage=new Map(),documentEvents={},windowEvents={};
const nodes=new Map();
const node=()=>({textContent:'',value:0,hidden:true,style:{},setAttribute(){}});
class FakeAudio {
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;allAudio.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
}
const env={console,Audio:FakeAudio,performance:{now:()=>time*1000},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  window:{addEventListener:(k,fn)=>windowEvents[k]=fn},
  document:{hidden:false,addEventListener:(k,fn)=>documentEvents[k]=fn,getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}}};
vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../prototype/sound.js'),'utf8'),env);
const run=s=>vm.runInContext(s,env);
async function check(name,source){await new Promise(resolve=>setImmediate(resolve));assert.equal(run(source),true,name);console.log('PASS '+name);count++;}
async function main(){
await check('audio is silent before first user gesture',`Sound.status().activated===false && Sound.speak('yujian')===false`);
await check('user gesture unlocks the first theme',`Sound.activate();Sound.status().activated && Sound.status().music[0].playing && Sound.status().track==='exile-field'`);
await check('spell voice can play after activation',`Sound.sync('playing',0,false,true);Sound.speak('yujian')===true && Sound.status().voice==='yujian'`);
await check('ordinary voices never overlap',`Sound.speak('wulei')===false && Sound.status().voice==='yujian'`);
await check('ultimate voice interrupts lower priority callouts',`Sound.ultimate('heaven');Sound.status().voice==='ult-heaven'`);
await check('music ducks beneath dialogue',`Sound.sync('playing',0,false,true);Math.abs(Sound.status().music[0].volume-.42*.38)<.001`);
await check('mute stops voices and music',`Sound.set('muted',true);Sound.status().voice===null && Sound.status().music.every(m=>!m.playing)`);
await check('muted speech cannot restart audio',`Sound.speak('yujian',100,0)===false`);
await check('unmuting resumes the selected track',`Sound.set('muted',false);Sound.status().music.some(m=>m.playing)`);
await check('guardian arrival selects this stage boss score',`Sound.sync('playing',1,true,true);Sound.status().track==='birth-boss' && Sound.status().music.filter(m=>m.playing).length===1`);
await check('changing stages replaces the old score',`Sound.sync('story',2,false,true);Sound.status().track==='river-field' && Sound.status().music.filter(m=>m.playing).length===1`);
await check('pause silences combat and music',`Sound.sync('paused',2,false,true);Sound.status().music.every(m=>!m.playing) && Sound.speak('gudu')===false`);
await check('voice audition works while combat remains paused',`Sound.speak('ult-heaven',100,0,true);Sound.sync('paused',2,false,true);Sound.status().voice==='ult-heaven' && Sound.status().scene==='paused'`);
await check('voice volume zero immediately silences dialogue',`Sound.set('voice',0);Sound.status().voice===null && Sound.speak('wulei',100,0)===false`);
await check('volume input clamps unsafe values',`Sound.set('voice',8);Sound.status().settings.voice===1`);
await check('volume values persist across reloads',`Sound.set('music',.24);JSON.parse(localStorage.getItem('xunsheng-audio')).music===.24`);
windowEvents.blur();
await check('losing focus immediately pauses all media',`Sound.status().hidden && Sound.status().music.every(m=>!m.playing) && Sound.status().voice===null`);
windowEvents.focus();run(`Sound.sync('playing',2,false,true);Sound.reset();`);
time=20;
await check('normal voice has a global anti-spam gap',`Sound.speak('sanmei')`);
const finishVoice=()=>{const active=allAudio.findLast(a=>!a.paused&&/\/voice(?:-v2)?\//.test(a.src));if(active){active.paused=true;active.onended();}};
finishVoice();
time=21;
await check('finished clips cannot create immediate repeated callouts',`Sound.speak('bingxin')===false`);
time=26;
await check('normal voice can resume after the gap',`Sound.speak('bingxin')===true`);
await check('runtime uses newly generated neural media and matching dialogue',`Sound.status().voiceSource==='assets/audio/voice-v2/bingxin.mp3' && Sound.status().subtitle==='心定，剑不乱。'`);
run(`Sound.reset();Sound.sync('playing',0,false,true);`);time=50;
await check('automatic basic swords do not repeatedly shout',`Sound.spell('yujian');Sound.status().voice===null && Sound.status().ordinaryCalls===0`);
await check('a newly used spell has a sparse first-use call',`Sound.spell('wulei');Sound.status().voice==='wulei' && Sound.status().ordinaryCalls===1`);
finishVoice();time=80;
await check('the same automatic spell stays quiet after its first call',`Sound.spell('wulei');Sound.status().voice===null`);
run(`Sound.spell('sanmei');`);finishVoice();time=110;run(`Sound.spell('bingxin');`);finishVoice();time=140;
await check('ordinary callouts have a per-stage budget',`Sound.spell('gudu');Sound.status().voice===null && Sound.status().ordinaryCalls===3`);
run(`Sound.reset();Sound.sync('playing',1,true,true);`);time=180;
await check('automatic spells leave boss fights sonically clear',`Sound.spell('sanmei');Sound.status().voice===null`);
await check('boss dialogue takes priority over an ultimate call',`Sound.guardian(1);Sound.ultimate('heaven');Sound.status().voice==='boss-1'`);
await check('a real opening has the highest combat voice priority',`Sound.weakness(1);Sound.status().voice==='weakness-1'`);
finishVoice();time=185;
await check('repeated openings do not spam spoken instructions',`Sound.weakness(1);Sound.status().voice===null`);
run(`Sound.reset();Sound.sync('story',0,false,true);`);
await check('story narration voices the visible setting paragraph',`Sound.stageIntro(0);Sound.status().voice==='stage-0' && Sound.status().subtitle.startsWith('大圣失踪后')`);
await check('entering combat ends the scene narration cleanly',`Sound.sync('playing',0,false,true);Sound.status().voice===null`);
await check('victory uses this stage revelation',`Sound.sync('win',2,false,true);Sound.result(true);Sound.status().voice==='victory-2'`);
const current=allAudio.findLast(a=>!a.paused&&a.src.includes('/voice-v2/'));current.onerror();
await check('a missing neural clip falls back to the retained recording',`Sound.status().voiceSource==='assets/audio/voice/victory.mp3' && Sound.status().subtitle===null`);
current.onerror();
await check('a missing fallback stops cleanly without a retry loop',`Sound.status().voice===null`);
run(`Sound.reset();Sound.sync('playing',0,true,true);Sound.weakness(0);`);
allAudio.findLast(a=>!a.paused&&a.src.includes('/voice-v2/')).onerror();
await check('new cues without a legacy recording fail silently',`Sound.status().voice===null`);
run(`Sound.reset();Sound.sync('bench',0,false,true);`);
await check('headless balance mode stays silent',`Sound.status().music.every(m=>!m.playing) && Sound.speak('yujian')===false`);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audio-cues.json'),'utf8'));
const musicManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../prototype/assets/audio/music/manifest.json'),'utf8'));
const neuralManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../prototype/assets/audio/voice-v2/manifest.json'),'utf8'));
assert.equal(manifest.cues.length,50);assert.equal(musicManifest.tracks.length,12);assert.equal(neuralManifest.clips.length,manifest.cues.length);
for(const cue of manifest.cues){
  const clip=neuralManifest.clips.find(c=>c.id===cue.id);assert.ok(clip,cue.id);assert.equal(clip.text,cue.text);assert.equal(clip.voice,manifest.profiles[cue.role].voice);
  for(const [file,key] of [[clip.file,'mixed_sha256'],[clip.source,'source_sha256']])assert.equal(createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../prototype',file))).digest('hex'),clip[key],file);
}
const legacy=fs.readdirSync(path.join(__dirname,'../prototype/assets/audio/voice')).filter(f=>f.endsWith('.mp3')).map(f=>'assets/audio/voice/'+f);
const files=[...manifest.cues.map(c=>'assets/audio/voice-v2/'+c.id+'.mp3'),...musicManifest.tracks.map(t=>t.file),...legacy];
for(const file of files){
  const full=path.join(__dirname,'../prototype',file);assert.ok(fs.statSync(full).size>1000,file);
  const result=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',full],{encoding:'utf8'});assert.equal(result.status,0,file);assert.ok(Number(JSON.parse(result.stdout).format.duration)>.2,file);
  const decoded=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-i',full,'-f','null','-'],{encoding:'utf8'});assert.equal(decoded.status,0,file+' decodes');
}
console.log(`PASS 50 neural clips, ${legacy.length} retained legacy clips and 12 music tracks decode successfully`);
console.log(`${count} audio behavior checks plus ${files.length} media file checks and 100 provenance hashes passed`);

}
main().catch(error=>{console.error(error);process.exitCode=1;});
