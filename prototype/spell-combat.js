/* Forms spend one cast budget per target, not one full budget per visual sword. */
const SpellCombat=(()=>{
  function pulse(id,x,y,s){
    G.spellPulses.push({id,x,y,s,left:s.pulses,timer:0});
  }
  function install(spells){
    for(const [id,spell] of Object.entries(spells)){
      Object.defineProperty(spell,'max',{get:()=>SpellGrowth.cap()});spell.desc=l=>SpellGrowth.describe(id,l);
      spell.cast=l=>{
        const s=SpellGrowth.spec(id,l),target=nearest(P.x,P.y,s.range);
        if(id==='wanjian')return;if(id==='yujian'&&!target)return;Motion.cast(id,target);
        if(id==='yujian'){
          const a=Math.atan2(target.y-P.y,target.x-P.x),volleyHits=new Set(),targets=G.enemies.filter(e=>Bosses.targetable(e)&&Math.hypot(e.x-P.x,e.y-P.y)<s.range).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
          for(let i=0;i<s.count;i++){const t=targets[i%targets.length]||target,offset=(i-(s.count-1)/2)*7,x=P.x-Math.sin(a)*offset,y=P.y+Math.cos(a)*offset,angle=Math.atan2(t.y-y,t.x-x);G.shots.push({x,y,vx:Math.cos(angle)*660,vy:Math.sin(angle)*660,r:6,dmg:s.damage,life:1.35,color:spell.color,hit:new Set(),volleyHits,pierce:s.form?1:0,trail:[]});}
        }else if(id==='wulei'){
          let from=P;const chosen=new Set();
          for(let i=0;i<s.count;i++){const candidates=G.enemies.filter(e=>Bosses.targetable(e)&&!chosen.has(e.id)&&Math.hypot(e.x-P.x,e.y-P.y)<=900&&Math.hypot(e.x-from.x,e.y-from.y)<=460);candidates.sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));const t=candidates[0];if(!t)break;chosen.add(t.id);bolt(from.x,from.y,t.x,t.y,spell.color);Motion.emit('thunder',t.x,t.y,{duration:.42,color:spell.color});hurt(t,s.damage,spell.color);from=t;}
        }else if(id==='gudu'){
          const x=target?.x??P.x,y=target?.y??P.y;
          for(let i=0;i<s.layers;i++)G.pools.push({x:x+Math.cos(i*2.1)*i*24,y:y+Math.sin(i*2.1)*i*24,r:s.radius,life:4,dps:s.damage,tick:0,color:spell.color,poisonPool:true});
        }else if(id==='bingxin'){
          P.shield=Math.min(P.shieldMax,P.shield+s.shield);Motion.emit('ice',P.x,P.y,{r:s.radius,duration:.8,color:spell.color});
          G.eshots=G.eshots.filter(shot=>Math.hypot(shot.x-P.x,shot.y-P.y)>s.radius+(shot.r||0));
        }else if(id==='sanmei')pulse(id,P.x,P.y,s);
        else if(id==='jiushen')pulse(id,target?.x??P.x,target?.y??P.y,s);
        else if(id==='guanyin')pulse(id,P.x,P.y,s);
      };
    }
  }
  function update(dt){for(const p of G.spellPulses){p.timer-=dt;if(p.timer>0)continue;p.timer+=p.id==='guanyin'?.5:.36;p.left--;const color=SPELLS[p.id].color;if(p.id==='guanyin'){if(Math.hypot(P.x-p.x,P.y-p.y)<=p.s.radius)heal(p.s.heal/p.s.pulses);Motion.emit('heal',p.x,p.y,{r:p.s.radius,duration:.65,color});}else{Motion.emit(p.id==='sanmei'?'fire':'blast',p.x,p.y,{r:p.s.radius,duration:.65,color});for(const e of G.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<p.s.radius+e.r)hurt(e,p.s.damage/p.s.pulses,color);}}G.spellPulses=G.spellPulses.filter(p=>p.left>0);}
  function drawGround(){for(const p of G.spellPulses.filter(p=>p.id==='guanyin')){ctx.save();ctx.fillStyle='#9fe3b80b';ctx.strokeStyle='#9fe3b866';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p.x,p.y,p.s.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}}
  function orbit(p){const s=SpellGrowth.spec('wanjian',p.spells.wanjian);return Array.from({length:s.count},(_,i)=>{const layer=i%s.layers,count=Math.ceil((s.count-layer)/s.layers),a=p.orbitAngle*(layer%2?-1:1)+Math.floor(i/s.layers)*Math.PI*2/count;return {x:p.x+Math.cos(a)*(s.radius+layer*30),y:p.y+Math.sin(a)*(s.radius+layer*30),a,layer,damage:s.damage};});}
  return {install,update,orbit,drawGround};
})();
