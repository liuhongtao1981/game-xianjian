const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {createHarness}=require('./game-harness');
const h=createHarness(),lines=h.evaluate(`Journey.stages.flatMap((_,i)=>['xiaoguo','tinglan'].flatMap(hero=>[false,true].flatMap(outer=>Journey.storyPages(i,hero,outer))))`);
const cues=[...new Set(lines)].map(text=>({id:'narration-'+createHash('sha256').update(text).digest('hex').slice(0,16),text}));
const manifest={version:1,profile:{voice:'zh-CN-YunyangNeural',rate:'-12%',pitch:'-10Hz',body:2.2},cues};
fs.writeFileSync(path.join(__dirname,'../docs/story-voice-cues.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Exported '+cues.length+' unique story lines for one heavy narrator');
