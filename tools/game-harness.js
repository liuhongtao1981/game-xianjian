// Headless simulation uses the actual game scripts, a seeded RNG and inert browser nodes.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function createHarness(options={}){
  let seed=options.seed??20261018;
  const randomMath=Object.create(Math);randomMath.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const node=()=>({style:{},classList:{add(){},remove(){},toggle(){}},querySelector:()=>({textContent:'',prepend(){}}),setAttribute(){},querySelectorAll:()=>[],textContent:'',innerHTML:'',addEventListener(){}});
  const nodes=new Map(),canvas={...node(),getContext:()=>({setTransform(){}})};
  const storage=options.storage??new Map();
  const context={console,Math:randomMath,URLSearchParams,Set,Map,Path2D:class{moveTo(){}lineTo(){}closePath(){}},location:{search:''},performance:{now:()=>0},matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},Image:class {complete=false;naturalWidth=0;},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)},
    window:{innerWidth:options.width??1440,innerHeight:options.height??900,devicePixelRatio:1,addEventListener(){}},
    document:{body:node(),createElement:()=>node(),addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById(id){if(id==='game')return canvas;if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}}};
  vm.createContext(context);
  for(const file of ['sound.js','chapters.js','chapters-content.js','infant.js','infant-uv.js','huashen.js','huashen-uv.js','lianxu.js','lianxu-uv.js','growth.js','spell-combat.js','items.js','cultivation.js','combat-scaling.js','ultimate-arts.js','progress.js','golden-uv.js','encounters.js','journey.js','bosses.js','world-nav.js','world.js','director.js','motion.js','run-save.js','character.js','expedition.js','reward-cards.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../prototype',file),'utf8'),context);
  return {context,storage,evaluate:source=>vm.runInContext(source,context)};
}
module.exports={createHarness};
