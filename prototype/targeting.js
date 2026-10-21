/* Transient targeting: shared by input, casting, animation and aim previews. */
const Targeting=(()=>{
  let locked=null,pointer=null;
  const distance=e=>Math.hypot(e.x-P.x,e.y-P.y);
  const height=e=>(e.campBanner?110:e.boss?230:({imp:78,fox:90,snake:96,zombie:103}[e.type]||80))*(e.elite?1.3:1);
  function current(){
    if(locked&&(!G.enemies.includes(locked)||!Bosses.targetable(locked)||!World.visible(locked,0)||distance(locked)>900))locked=null;
    return locked;
  }
  function worldPoint(x,y){const v=World.view();return {x:v.x+x/W*v.w,y:v.y+y/H*v.h};}
  function move(x,y){pointer=x>=0&&x<=W&&y>=0&&y<=H?{x,y}:null;}
  function pick(x,y){
    if(G.state!=='playing')return null;
    const p=worldPoint(x,y),v=World.view(),hit=G.enemies.filter(e=>Bosses.targetable(e)&&World.visible(e,0)&&distance(e)<=900)
      .map(e=>{const h=height(e);return {e,d:Math.hypot((p.x-e.x)/Math.max(28,e.r+12,h*.32),(p.y-(e.y-h*.48))/(h*.6))};})
      .filter(t=>t.d<=1+12*v.w/W/60).sort((a,b)=>a.d-b.d)[0]?.e||null;
    locked=locked===hit?null:hit;
    if(locked)ExperienceUI.teach('focus','已集火 '+(locked.name||'妖众')+' · 再次点击或点击空地取消');
    return locked;
  }
  function compare(a,b){const focus=current();return a===focus?-1:b===focus?1:distance(a)-distance(b);}
  function spellTarget(range){const focus=current();return focus&&distance(focus)<=range?focus:nearest(P.x,P.y,range);}
  function direction(){
    let target=ExperienceUI.settings().mouseAim&&pointer?worldPoint(pointer.x,pointer.y):current()||nearest(P.x,P.y,1800);
    return target&&Math.hypot(target.x-P.x,target.y-P.y)>2?Math.atan2(target.y-P.y,target.x-P.x):Math.atan2(P.facing.y,P.facing.x);
  }
  function draw(){
    if(G.state!=='playing')return;
    const e=current();ctx.save();
    if(e){
      ctx.strokeStyle='#fff0a4';ctx.fillStyle='#fff0a4';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(e.x,e.y,e.r+15,(e.r+15)*.55,0,0,Math.PI*2);ctx.stroke();
      for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(e.x+side*(e.r+24),e.y-14);ctx.lineTo(e.x+side*(e.r+14),e.y-22);ctx.lineTo(e.x+side*(e.r+24),e.y-30);ctx.stroke();}
      ctx.font='bold 14px Microsoft YaHei,sans-serif';ctx.textAlign='center';ctx.shadowColor='#00100e';ctx.shadowBlur=6;ctx.fillText('◎ 集火 · '+(e.name||'妖众'),e.x,e.y-height(e)-36);
    }
    if(pointer&&ExperienceUI.settings().mouseAim&&UltimateArts.loadout().includes('river')){
      const a=direction();ctx.translate(P.x,P.y);ctx.rotate(a);ctx.strokeStyle='#d8ecd477';ctx.lineWidth=1.5;ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(40,0);ctx.lineTo(132,0);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(122,-5);ctx.lineTo(132,0);ctx.lineTo(122,5);ctx.stroke();
    }ctx.restore();
  }
  return {current,pick,move,compare,spellTarget,direction,draw,worldPoint,clearPointer:()=>{pointer=null;},reset:()=>{locked=null;pointer=null;}};
})();
