// Original 16-bar pentatonic scores. No samples, copyrighted recordings or network services.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const output=path.join(__dirname,'../prototype/assets/audio/music');fs.mkdirSync(output,{recursive:true});
const sr=22050,tau=Math.PI*2;
let seed=81;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
const freq=n=>440*2**((n-69)/12);
const scores=[
  {id:'exile',title:'失声禅庭·断钟',bpm:72,root:50,scale:[0,3,5,7,10],motif:[0,2,1,4,3,2,0,null,2,3,4,2,1,0,1,null]},
  {id:'birth',title:'血诏陈府·夜诏',bpm:86,root:48,scale:[0,3,5,7,10],motif:[0,1,0,3,2,null,1,0,3,4,3,1,2,0,1,null]},
  {id:'river',title:'夜渡洪江·逆水',bpm:68,root:43,scale:[0,2,5,7,9],motif:[0,null,3,2,1,null,4,3,2,1,null,0,3,2,1,null]}
];
scores.push(
 {id:'mountain',title:'五行断契',bpm:74,root:45,scale:[0,2,5,7,10],motif:[0,null,1,3,2,0,4,null,0,3,2,1,4,2,1,null]},
 {id:'outpost',title:'两界追名',bpm:88,root:47,scale:[0,3,5,7,10],motif:[0,2,3,1,2,4,3,0,1,3,4,2,0,1,3,null]},
 {id:'dragon',title:'鹰涧解喉',bpm:70,root:42,scale:[0,2,5,7,9],motif:[0,3,null,2,1,4,3,null,2,1,0,3,4,null,2,0]});
scores.push(
 {id:'wish',title:'焚愿禅院·净灯',bpm:76,battleBpm:112,root:46,scale:[0,3,5,7,10],motif:[0,null,4,2,1,3,0,1,4,null,2,0,3,1,2,null]},
 {id:'windwood',title:'黑风密林·风钟',bpm:82,battleBpm:122,root:43,scale:[0,2,5,7,10],motif:[0,3,1,null,4,2,3,1,0,4,null,3,2,1,3,0]},
 {id:'bonewish',title:'愿骨石窟·归声',bpm:70,battleBpm:116,root:41,scale:[0,3,5,7,10],motif:[0,null,1,4,null,3,2,0,4,1,3,null,2,1,0,null]});
scores.push(
 {id:'contract',title:'血契高庄·秤影',bpm:80,battleBpm:118,root:44,scale:[0,3,5,7,10],motif:[0,1,null,3,2,4,1,null,3,0,4,2,1,3,null,0]},
 {id:'wedding',title:'福陵喜堂·散席',bpm:78,battleBpm:124,root:49,scale:[0,2,5,7,9],motif:[0,4,3,null,2,1,0,3,4,2,null,1,3,2,1,0]},
 {id:'yellowwind',title:'黄风沙海·窃神',bpm:84,battleBpm:128,root:40,scale:[0,2,3,7,10],motif:[0,null,2,4,1,3,2,null,4,3,1,0,2,1,3,0]});
scores.push(
 {id:'sunken',title:'流沙沉名·逆舟',bpm:66,battleBpm:114,root:38,scale:[0,2,5,7,10],motif:[0,null,3,1,4,null,2,0,1,null,4,3,2,0,null,1]},
 {id:'whitebone',title:'白骨换身·心灯',bpm:74,battleBpm:120,root:45,scale:[0,1,5,7,10],motif:[0,1,null,4,3,1,0,null,2,4,3,null,1,0,4,null]},
 {id:'shadowcity',title:'宝象夺影·归名',bpm:82,battleBpm:126,root:42,scale:[0,3,5,8,10],motif:[0,3,4,1,null,2,4,3,0,2,1,4,3,null,2,0]});
function render(score,battle){
  const bpm=battle?(score.battleBpm||[100,112,104,108,120,106][scores.indexOf(score)]):score.bpm,beat=60/bpm,duration=64*beat;
  const length=Math.ceil(duration*sr),left=new Float32Array(length),right=new Float32Array(length);
  function mix(start,dur,fn,volume,pan=0){
    const from=Math.floor(start*sr),count=Math.floor(dur*sr),gl=Math.sqrt((1-pan)*.5),gr=Math.sqrt((1+pan)*.5);
    for(let j=0;j<count;j++){
      const at=from+j;if(at<0||at>=length)continue;
      const t=j/sr,sample=fn(t,j)*volume;
      left[at]+=sample*gl;right[at]+=sample*gr;
    }
  }
  function pluck(time,n,volume,pan){
    const f=freq(n),nString=Math.round(sr/f),ring=new Float32Array(nString);for(let i=0;i<nString;i++)ring[i]=noise()*.7;
    let last=0;
    mix(time,3.5,(t,j)=>{const p=j%nString,a=ring[p];ring[p]=(a+last)*.496;last=a;return a*Math.exp(-t*.5)*Math.min(1,t*700);},volume,pan);
    mix(time+.012,2.8,t=>(Math.sin(tau*f*t)+.22*Math.sin(tau*f*2.003*t))*Math.exp(-t*2.5)*Math.min(1,t*300),volume*.2,pan*.5);
  }
  function flute(time,n,dur,volume,pan){const f=freq(n);mix(time,dur,t=>{
    const env=Math.min(1,t/.2,Math.max(0,(dur-t)/.3)),phase=tau*f*t+.0016*f*Math.sin(tau*4.6*t)*Math.min(1,t*2);
    return (Math.sin(phase)+.18*Math.sin(phase*2)+noise()*.025)*env*.65;
  },volume,pan);}
  function bell(time,n,volume){const f=freq(n);mix(time,6,t=>(Math.sin(tau*f*t)*Math.exp(-t*.8)+.42*Math.sin(tau*f*2.706*t)*Math.exp(-t*1.6)+.2*Math.sin(tau*f*5.42*t)*Math.exp(-t*2.5))*Math.min(1,t*130),volume,-.18);}
  function drum(time,accent,taiko=false){mix(time,taiko?1:.45,t=>{
    const env=Math.exp(-t*(taiko?5:13)),f=(taiko?45:82)+(taiko?80:95)*Math.exp(-t*35);
    return (Math.sin(tau*f*t)*.8+noise()*.18*Math.exp(-t*65))*env*Math.min(1,t*1500);
  },accent,.05);}
  // Underlying low bowed fifth: gradual attack, slight bow noise, stable harmonic bed.
  for(let bar=0;bar<16;bar++){
    const root=score.root+([0,0,3,0,5,0,3,0][bar%8]),start=bar*4*beat;
    for(const [interval,amp,pan] of [[-12,.07,-.35],[7,.025,.35]]){
      const f=freq(root+interval),dur=4*beat;
      mix(start,dur,t=>{const env=Math.sin(Math.PI*t/dur)**.6;return (Math.sin(tau*f*t)+.2*Math.sin(tau*f*2*t)+.08*Math.sin(tau*f*3*t))*env;},amp*(battle?1.35:1),pan);
    }
    const p=score.scale;
    pluck(start,root+12,.19,-.35);pluck(start+beat*1.5,root+p[(bar+2)%5]+12,.1,.32);
    if(bar%2===0)pluck(start+beat*3,root+p[(bar+3)%5]+12,.1,.12);
    const melodyIndex=(bar%8)*2;
    for(let k=0;k<2;k++){
      const degree=score.motif[(melodyIndex+k)%16];if(degree===null)continue;
      const n=score.root+12+p[degree%5]+(bar>=8?12:0),time=start+k*beat*2;
      if(score.id==='river'||score.id==='windwood'||bar%4>=2)flute(time,n,beat*(battle?1.35:1.8),battle?.11:.10,.22);
      else pluck(time,n,.16,-.12);
    }
    if(bar%4===0)bell(start,score.root+24,.09);
    if(battle){
      for(let k=0;k<4;k++)drum(start+k*beat,k===0?.3:.13,k%2===0);
      for(let k=0;k<8;k++){const time=start+k*beat*.5;mix(time,.07,t=>noise()*Math.exp(-t*70),.028,k%2?.4:-.4);}
      if(bar%4===3){drum(start+beat*3.5,.15);drum(start+beat*3.75,.11);}
    }else if(score.id==='birth'){drum(start,.11,true);drum(start+beat*2.5,.065);}
    else if(bar%2===0)drum(start,.055,true);
  }
  // Independent air layer: filtered noise; river breathes slowly, temple feels still.
  let filtered=0;
  for(let i=0;i<length;i++){filtered=filtered*.985+noise()*.015;const air=filtered*.1*(.6+.4*Math.sin(i/sr*.17));left[i]+=air;right[i]+=air*.85;}
  // Room reflections remain bounded, avoiding feedback runaway. Edges fade for click-free looping.
  for(const [delay,amount] of [[.113,.12],[.237,.08],[.419,.035]]){
    const d=Math.round(delay*sr);for(let i=length-1;i>=d;i--){left[i]+=right[i-d]*amount;right[i]+=left[i-d]*amount;}
  }
  let peak=0;for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
  const gain=.78/Math.max(.01,peak),wave=Buffer.alloc(44+length*4);
  wave.write('RIFF');wave.writeUInt32LE(wave.length-8,4);wave.write('WAVEfmt ',8);wave.writeUInt32LE(16,16);wave.writeUInt16LE(1,20);wave.writeUInt16LE(2,22);wave.writeUInt32LE(sr,24);wave.writeUInt32LE(sr*4,28);wave.writeUInt16LE(4,32);wave.writeUInt16LE(16,34);wave.write('data',36);wave.writeUInt32LE(length*4,40);
  let rms=0;for(let i=0;i<length;i++){const edge=Math.min(1,i/(sr*.04),(length-1-i)/(sr*.04));for(let ch=0;ch<2;ch++){const sample=Math.tanh((ch?right[i]:left[i])*gain)*edge;wave.writeInt16LE(Math.round(sample*32767),44+i*4+ch*2);rms+=sample*sample;}}
  const stem=score.id+(battle?'-boss':'-field'),wav=path.join(output,stem+'.wav'),mp3=path.join(output,stem+'.mp3');fs.writeFileSync(wav,wave);
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',wav,'-codec:a','libmp3lame','-b:a','128k',mp3],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);fs.unlinkSync(wav);
  console.log(`${stem}: ${duration.toFixed(1)}s, peak ${peak.toFixed(2)}, RMS ${Math.sqrt(rms/length/2).toFixed(3)}`);
  return {file:'assets/audio/music/'+stem+'.mp3',title:score.title+(battle?'·守关':'·行路'),bpm,duration:Number(duration.toFixed(3)),original:true};
}
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7).split(',');
const made=scores.filter(s=>!only||only.includes(s.id)).flatMap(s=>[render(s,false),render(s,true)]);
const previous=fs.existsSync(path.join(output,'manifest.json'))?JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8')).tracks:[];
const tracks=[...previous.filter(t=>!made.some(n=>n.file===t.file)),...made];
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({composer:'Project-authored procedural pentatonic score; Karplus–Strong plucked strings, flute, harmonic drone, bells and drums.',tracks},null,2));
