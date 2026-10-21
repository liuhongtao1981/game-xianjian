const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {createHarness}=require('./game-harness');
const root=path.join(__dirname,'../prototype');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/voice-heavy/manifest.json'),'utf8'));
const h=createHarness();
assert.equal(manifest.profile.voice,'zh-CN-YunyangNeural');
assert.equal(manifest.profile.rate,'-12%');assert.equal(manifest.profile.pitch,'-10Hz');
const actual=h.evaluate(`Journey.stages.flatMap((_,i)=>['xiaoguo','tinglan'].flatMap(hero=>[false,true].flatMap(outer=>Journey.storyPages(i,hero,outer))))`);
for(const text of actual){
  const clip=manifest.clips.find(c=>c.text===text);assert.ok(clip,'Missing heavy narration: '+text);
  assert.equal(clip.voice,manifest.profile.voice);assert.equal(clip.rate,manifest.profile.rate);assert.equal(clip.pitch,manifest.profile.pitch);
  assert.ok(clip.duration>.3);assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,clip.file))).digest('hex'),clip.sha256);
  assert.equal(h.evaluate(`StoryVoicePack.clips[${JSON.stringify(text)}]`),clip.file+'?v='+clip.sha256.slice(0,16));
}
h.evaluate(`Audio=class{constructor(src){this.src=src;this.paused=true;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};window.speechSynthesis={getVoices(){throw Error('System voice must not replace the heavy narrator');}};Sound.activate();`);
for(let stage=0;stage<h.evaluate('ChapterCatalog.playable');stage++)for(const hero of ['xiaoguo','tinglan'])for(const outer of [false,true]){
  for(const text of h.evaluate(`Journey.storyPages(${stage},'${hero}',${outer})`)){
    h.evaluate(`Sound.narrateStory(${JSON.stringify(text)},${stage},()=>{},()=>{});`);
    const status=h.evaluate('Sound.status().narration');
    assert.equal(status.source,'recording');assert.equal(status.voice,'zh-CN-YunyangNeural');assert.equal(status.profile,'heavy');
  }
}
console.log('PASS '+manifest.clips.length+' heavy recordings cover every scene, both heroes, links and outside challenges with one consistent narrator');
