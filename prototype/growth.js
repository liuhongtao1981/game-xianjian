/* One source for spell caps, bounded multi-hit budgets and cultivation visuals. */
const SpellGrowth=(()=>{
  const realm=()=>typeof P!=='undefined'&&P?P.cultivation.realm:0;
  const cap=(r=realm())=>5+r;
  function spec(id,level,r=realm()){
    const l=Math.max(1,Math.min(18,level)),base=Math.min(5,l),growth=1+.12*Math.max(0,l-5);
    const form=r>=11&&l>=16?3:r>=6&&l>=11?2:r>=1&&l>=6?1:0;
    const damage={yujian:18+8*base,wulei:20+10*base,sanmei:22+11*base,wanjian:10+6*base,gudu:9+5*base,jiushen:38+18*base};
    return {level:l,cap:cap(r),form,damage:(damage[id]||0)*growth,layers:id==='wanjian'?1+form:id==='gudu'?Math.min(3,1+form):1,
      count:id==='yujian'?Math.min(10,1+Math.floor(l/3)+Math.floor(r/4)):id==='wanjian'?Math.min(32,1+l+2*form):id==='wulei'?Math.min(12,1+Math.floor((l+1)/2)):1,
      radius:id==='wanjian'?62+base*3:id==='sanmei'?95+base*8+form*35:id==='gudu'?74+form*18:110+form*25,
      pulses:1+Math.min(2,form),shield:(18+12*base)*growth,heal:(8+6*base)*growth};
  }
  function describe(id,l){const s=spec(id,l),d=Math.round(s.damage);return ({yujian:`${s.count}柄飞剑 · 同目标剑轮伤害 ${d}`,wanjian:`${s.count}柄飞剑 · ${s.layers}层剑阵 · 每轮伤害 ${d}`,wulei:`至多${s.count}目标 · 每目标雷伤 ${d}`,sanmei:`${s.pulses}段真火 · 范围${s.radius} · 总伤害 ${d}`,bingxin:`${s.pulses}重冰纹 · 护盾 +${Math.round(s.shield)}`,gudu:`${s.layers}层毒域 · 每秒总伤害 ${d}`,jiushen:`${s.pulses}段余震 · 范围${s.radius} · 总伤害 ${d}`,guanyin:`${s.pulses}段回春 · 总回复 ${Math.round(s.heal)}`})[id];}
  return {cap,spec,describe};
})();
const RealmVisuals=(()=>{
  const colors=['#9adbd1','#e9c66e','#7cddc0','#bb9bea','#729eea','#d8a0d7','#a8e6df','#c6b0ff','#f1dfb3','#72c9cb','#e9bc55','#a6cfba','#c7a0ed','#fff0b0'];
  const motifs=['灵纹','金丹双环','元婴灵影','化神神轮','炼虚裂隙','合体双莲','大乘法相','渡劫雷纹','真仙仙绶','玄仙星轨','金仙羽带','太乙三花','大罗道轮','仙王王印'];
  const get=(c)=>({color:colors[c.realm],motif:motifs[c.realm],rings:c.realm?2+Math.floor(c.realm/4):1,detail:Math.floor((c.layer||1)/3)});
  function draw(c,x,y,time,scale=1){const v=get(c),r=31+c.realm*.8;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale*.46);ctx.strokeStyle=v.color;ctx.globalAlpha=.35;ctx.lineWidth=1.2;
    for(let k=0;k<v.rings;k++){ctx.beginPath();ctx.ellipse(0,0,r+k*10,r+k*10,0,0,Math.PI*2);ctx.stroke();}
    const count=4+v.detail*2+c.realm;for(let i=0;i<count;i++){const a=i*Math.PI*2/count+time*(c.realm%2?-.3:.25);ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r-5,-3);ctx.lineTo(r+5,0);ctx.lineTo(r-5,3);ctx.stroke();ctx.restore();}
    if(c.realm){ctx.rotate(-time*.15);ctx.strokeRect(-r*.6,-r*.6,r*1.2,r*1.2);}ctx.restore();
  }
  return {get,draw};
})();
