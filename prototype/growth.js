/* Appearance is cosmetic; every identity shares the same combat and growth rules. */
const HeroIdentity=(()=>{
  const all=[{id:'xiaoguo',name:'孙小果',short:'小果',glyph:'果',gender:'男剑仙',color:'#d8bd81',desc:'循毫寻圣 · 白衣执剑'},
    {id:'tinglan',name:'沈听澜',short:'听澜',glyph:'澜',gender:'女剑仙',color:'#a0dcd5',desc:'听澜问道 · 月白青衣'}];
  const valid=id=>all.some(h=>h.id===id),clean=id=>valid(id)?id:'xiaoguo';
  const get=(id)=>all.find(h=>h.id===clean(id))||all[0];
  const text=(s,id)=>clean(id)==='tinglan'?s.replaceAll('孙小果','沈听澜').replaceAll('小果','听澜'):s;
  const stories=new Map();
  function stage(s,id){if(clean(id)==='xiaoguo')return s;const key=s.id+':'+id;if(!stories.has(key))stories.set(key,{...s,story:s.story.map(t=>text(t,id)),reveal:text(s.reveal,id),clue:{...s.clue,text:text(s.clue.text,id)}});return stories.get(key);}
  function frame(time){if(G.state!=='start')return;for(const h of all){const canvas=document.getElementById('heroChoice-'+h.id);if(!canvas?.getContext)continue;const p=canvas.getContext('2d');p.setTransform(2,0,0,2,0,0);p.clearRect(0,0,160,190);Motion.drawHero(p,{x:80,y:178,heroId:h.id,cultivation:{realm:0,layer:1},look:1},145,time,1,{row:2,col:Math.floor(time*1.6)%2,state:'idle'});}}
  return {all,valid,clean,get,text,stage,frame};
})();
/* One source for spell caps, bounded multi-hit budgets and cultivation visuals. */
const SpellGrowth=(()=>{
  const realm=()=>typeof P!=='undefined'&&P?(P.cultivation?.realm||0):0;
  const cap=(r=realm())=>5+r;
  function spec(id,level,r=realm()){
    const l=Math.max(1,Math.min(18,level)),base=Math.min(5,l),growth=1+.12*Math.max(0,l-5);
    const form=r>=11&&l>=16?3:r>=6&&l>=11?2:r>=1&&l>=6?1:0;
    const damage={yujian:18+8*base,wulei:20+10*base,sanmei:22+11*base,wanjian:10+6*base,gudu:9+5*base,jiushen:38+18*base};
    return {level:l,cap:cap(r),form,damage:(damage[id]||0)*growth,layers:id==='wanjian'?1+form:id==='gudu'?Math.min(3,1+form):1,
      count:id==='yujian'?Math.min(10,l+Math.floor(r/4)):id==='wanjian'?Math.min(32,1+l+2*form):id==='wulei'?l:1,
      radius:id==='wanjian'?62+base*3:id==='sanmei'?95+l*8+form*35:id==='gudu'?74+(l-1)*8+form*18:id==='bingxin'?50+(l-1)*10+form*12:id==='guanyin'?58+(l-1)*12+form*25:110+(l-1)*10+form*25,
      range:(['gudu','jiushen'].includes(id)?620:900)+(['gudu','jiushen'].includes(id)?(l-1)*26:0),
      pulses:id==='guanyin'?3:1+Math.min(2,form),shield:(18+12*base)*growth,heal:(8+6*base)*growth};
  }
  function describe(id,l){const s=spec(id,l),d=Math.round(s.damage);return ({yujian:`${s.count}柄飞剑 · 同目标剑轮伤害 ${d}`,wanjian:`${s.count}柄飞剑 · ${s.layers}层剑阵 · 每轮伤害 ${d}`,wulei:`${s.count}道落雷 · 至多${s.count}个不同目标 · 每目标雷伤 ${d}`,sanmei:`${s.pulses}段真火 · 半径${s.radius} · 总伤害 ${d}`,bingxin:`护域半径${s.radius} · 驱散域内飞弹 · 护盾 +${Math.round(s.shield)}`,gudu:`施法距离${s.range} · 毒域半径${s.radius} · ${s.layers}层 · 每秒总伤害 ${d}`,jiushen:`施法距离${s.range} · ${s.pulses}段余震 · 半径${s.radius} · 总伤害 ${d}`,guanyin:`回春半径${s.radius} · 域内${s.pulses}段回复 · 共${Math.round(s.heal)}生命`})[id];}
  function focus(id){return ['yujian','wanjian'].includes(id)?'强化方向：飞剑数量':id==='wulei'?'强化方向：落雷数量':'强化方向：作用距离 / 范围';}
  function change(id,from,to){
    if(!to)return from?'撤回后移除术法':'投入一次赠礼即可习得';
    const a=from?spec(id,from):null,b=spec(id,to),quantity=['yujian','wanjian','wulei'].includes(id);
    const value=s=>quantity?s.count:s.radius,unit=id==='wulei'?'道':quantity?'柄':'世界单位',label=quantity?(id==='wulei'?'落雷数量':'飞剑数量'):'作用半径';
    if(from===to){if(to>=cap())return label+' '+value(b)+unit+' · 已达本境等级上限';const next=spec(id,to+1);return '下一级：'+label+' '+value(b)+' → '+value(next)+unit+(quantity&&value(next)===value(b)?'（数量封顶）':'');}
    return '本次：'+label+' '+(a?value(a):0)+' → '+value(b)+unit+(!quantity&&['gudu','jiushen'].includes(id)?' · 施法距离 '+(a?a.range:0)+' → '+b.range:'');
  }
  return {cap,spec,describe,focus,change};
})();
/* Gift levels have a separate provenance; P.spells remains the combat-facing view. */
const SpellGift=(()=>{
  const keys=['yujian','wanjian','wulei','sanmei','bingxin','gudu','jiushen','guanyin'];
  const copy=o=>JSON.parse(JSON.stringify(o));
  function valid(g,realm){return !!g&&g.version===1&&[g.base,g.levels].every(o=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([k,v])=>keys.includes(k)&&Number.isInteger(v)&&v>=1&&v<=18))&&Object.values(g.levels).reduce((a,b)=>a+b,0)<=3*realm&&new Set([...Object.keys(g.base),...Object.keys(g.levels)]).size<=6&&keys.every(k=>(g.base[k]||0)+(g.levels[k]||0)<=Math.max(5+realm,g.base[k]||0));}
  function ensure(p=P){
    const c=p.cultivation||(p.cultivation=Cultivation.fresh());
    if(!c.spellGift)c.spellGift={version:1,base:{...p.spells},levels:{}};
    return c.spellGift;
  }
  const base=(p=P)=>ensure(p).base;
  function effective(levels=ensure().levels,p=P){const out={};for(const k of keys){const l=(base(p)[k]||0)+(levels[k]||0);if(l)out[k]=l;}return out;}
  function remaining(levels=ensure().levels,p=P){return 3*p.cultivation.realm-Object.values(levels).reduce((a,b)=>a+b,0);}
  function canAdd(levels,key){return keys.includes(key)&&remaining(levels)>0&&(effective(levels)[key]||0)<SpellGrowth.cap()&&(effective(levels)[key]||Object.keys(effective(levels)).length<6);}
  function sync(p=P){p.spells=effective(ensure(p).levels,p);}
  function reconcile(p){
    const g=ensure(p);for(const key of keys){const actual=p.spells[key]||0;if(actual!==((g.base[key]||0)+(g.levels[key]||0))){const gift=Math.min(actual,g.levels[key]||0),permanent=actual-gift;if(gift)g.levels[key]=gift;else delete g.levels[key];if(permanent)g.base[key]=permanent;else delete g.base[key];}}
  }
  function permanent(key){const g=ensure();g.base[key]=(g.base[key]||0)+1;sync();}
  function safe(){return !(World.active()&&G.boss?.hp>0)&&!G.enemies.some(e=>e.hp>0&&!e.eventObjective&&Math.hypot(e.x-P.x,e.y-P.y)<650);}
  function apply(levels){
    if(G.state!=='character'||!safe()||RunSave.conflicted())return false;
    const g=ensure(),next={version:1,base:{...g.base},levels:{...levels}};
    if(!valid(next,P.cultivation.realm))return false;
    CombatScaling.observe();
    const old={gift:copy(g),spells:{...P.spells},t:{...P.t}};
    P.cultivation.spellGift=next;sync();
    for(const key of Object.keys(P.spells))if(!old.spells[key])P.t[key]=Math.max(P.t[key]||0,SPELLS[key].cd*P.cdr);
    const pressure=CombatScaling.exportState();CombatScaling.observe();
    if(!RunSave.save('境界赠送术法升级')){P.cultivation.spellGift=old.gift;P.spells=old.spells;P.t=old.t;CombatScaling.importState(pressure);return false;}
    Motion.cancelSpells(keys.filter(k=>old.spells[k]!==P.spells[k]));
    // Casts already in flight retain their previous parameters; no new immediate cast.
    renderSpells();syncHUD();return true;
  }
  return {keys,valid,ensure,base,effective,remaining,canAdd,sync,reconcile,permanent,safe,apply};
})();
const RealmVisuals=(()=>{
  const colors=['#9adbd1','#e9c66e','#7cddc0','#bb9bea','#729eea','#d8a0d7','#a8e6df','#c6b0ff','#f1dfb3','#72c9cb','#e9bc55','#a6cfba','#c7a0ed','#fff0b0'];
  const motifs=['灵纹','金丹归元','元婴灵影','化神神轮','炼虚裂隙','双相合体','大乘法相','渡劫雷纹','真仙仙绶','玄仙星轨','五气归元','太乙三花','大罗道轮','王印法相'];
  let transition=null,pendingAdvance=null;
  const get=(c)=>({color:colors[c.realm],motif:motifs[c.realm],rings:c.realm?2+Math.floor(c.realm/4):1,detail:Math.floor((c.layer||1)/3),layer:c.layer||1});
  const ascensions=['灵脉初成','金丹凝轮','灵婴出窍','元神开轮','虚空裂变','双相归一','琉璃莲生','九霄雷冠','仙羽临身','星宿归位','五气归元','三花绽顶','大罗道轮','仙王敕印'];
  function advance(major,details={}){const next={age:0,duration:major?2.6:1.2,major,realm:P.cultivation.realm,layer:P.cultivation.layer,fromLayer:details.fromLayer??P.cultivation.layer};if(!major&&transition?.realm===next.realm){if(transition.major){pendingAdvance={...next,fromLayer:Math.min(pendingAdvance?.fromLayer??next.fromLayer,next.fromLayer)};return;}transition.layer=next.layer;transition.fromLayer=Math.min(transition.fromLayer,next.fromLayer);return;}transition=next;pendingAdvance=null;}
  function update(dt){if(transition&&dt>0&&['playing','win','story','character'].includes(G.state)){transition.age+=dt;if(transition.age>=transition.duration){transition=pendingAdvance;pendingAdvance=null;}}}
  function advancement(p,c,front=false){
    const t=transition;if(!t||t.realm!==c.realm)return;const progress=t.age/t.duration,alpha=Math.sin(progress*Math.PI),color=t.major?colors[c.realm]:'#b9f3ea';
    p.save();p.globalCompositeOperation='lighter';p.globalAlpha*=alpha*.9;p.strokeStyle=color;p.fillStyle=color+'30';p.lineWidth=1.7;
    if(!t.major){
      if(!front){p.save();p.scale(1,.38);for(let i=0;i<2;i++){p.beginPath();p.arc(0,-10,25+progress*45+i*10,0,Math.PI*2);p.stroke();}p.restore();}
      else {for(const side of [-1,0,1]){const y=-12-progress*85;path(p,[[side*18,-8],[side*14,y],[0,y-12]]);}p.fillStyle='#fff3bf';p.beginPath();p.arc(0,-65,4+alpha*3,0,Math.PI*2);p.fill();}
      p.restore();return;
    }
    if(front){p.lineWidth=2.2;path(p,[[0,-15],[0,-62],[-18,-76],[-28,-50]]);path(p,[[0,-62],[18,-76],[28,-50]]);p.restore();return;}
    p.translate(0,-64);const spin=progress*Math.PI*2,r=32+alpha*20;
    const wheel=(radius,n,rotation)=>{p.save();p.rotate(rotation);p.beginPath();p.arc(0,0,radius,0,Math.PI*2);p.stroke();for(let i=0;i<n;i++){p.rotate(Math.PI*2/n);path(p,[[radius-6,-4],[radius+5,0],[radius-6,4]]);}p.restore();};
    const spirit=(x,scale)=>{p.save();p.translate(x,0);p.scale(scale,scale);p.beginPath();p.ellipse(0,-33,9,12,0,0,Math.PI*2);p.moveTo(-8,-20);p.lineTo(-28,9);p.lineTo(-13,3);p.lineTo(-18,48);p.quadraticCurveTo(0,61,18,48);p.lineTo(13,3);p.lineTo(28,9);p.lineTo(8,-20);p.closePath();p.fill();p.stroke();p.restore();};
    switch(c.realm){
      case 0: wheel(r,6,-spin);break;
      case 1: for(let i=0;i<3;i++)wheel(r+(1-progress)*20+i*7,8,spin*(i%2?-1:1));p.beginPath();p.arc(0,0,9+alpha*6,0,Math.PI*2);p.fill();break;
      case 2: spirit(0,.55+progress*.6);wheel(r,9,-spin*.3);break;
      case 3: wheel(r+12,12,spin*.35);wheel(r,8,-spin*.4);spirit(0,.9);break;
      case 4: for(let i=0;i<8;i++){const a=i*Math.PI/4+spin*.2;path(p,[[Math.cos(a)*18,Math.sin(a)*18],[Math.cos(a+.18)*38,Math.sin(a+.18)*38],[Math.cos(a)*55,Math.sin(a)*55],[Math.cos(a-.12)*67,Math.sin(a-.12)*67]]);}break;
      case 5: spirit(-(1-progress)*37,1);spirit((1-progress)*37,1);wheel(r,6,-spin*.25);break;
      case 6: for(let i=0;i<8;i++)petal(p,0,38,55+alpha*13,i*Math.PI/4+spin*.12,color);spirit(0,1);break;
      case 7: for(let i=0;i<7;i++){const a=i*Math.PI/4+spin*.1;path(p,[[0,8],[Math.cos(a)*24,Math.sin(a)*24],[Math.cos(a+.2)*43,Math.sin(a+.2)*43],[Math.cos(a)*65,Math.sin(a)*65]]);}wheel(r,7,0);break;
      case 8: for(const side of [-1,1]){p.save();p.scale(side,1);for(let i=0;i<5;i++)petal(p,8,18,48+i*4,.45+i*.20+alpha*.1,color);p.restore();}break;
      case 9: {const pts=Array.from({length:12},(_,i)=>[Math.cos(i*2.4+spin*.1)*(30+i%3*10),Math.sin(i*2.4+spin*.1)*(30+i%3*10)]);path(p,[...pts,pts[0]]);for(const [x,y] of pts){p.beginPath();p.arc(x,y,2.3,0,Math.PI*2);p.fill();}break;}
      case 10: for(let i=0;i<5;i++){p.strokeStyle=['#a9efda','#f1d28a','#f0a8a0','#aebffc','#dcc1f3'][i];p.beginPath();p.ellipse(0,0,r+12,13+alpha*7,i*Math.PI/5+spin*.3,0,Math.PI*2);p.stroke();}break;
      case 11: for(let i=0;i<3;i++)for(let j=0;j<6;j++)petal(p,(i-1)*27,-24-(i===1?19:0),15+alpha*5,j*Math.PI/3+spin*.2,color);path(p,[[-27,-24],[0,16],[0,-43],[0,16],[27,-24]]);break;
      case 12: for(let i=0;i<4;i++)wheel(25+i*11,8+i*2,spin*(i%2?-.17:.17));break;
      case 13: spirit(0,1.2);p.save();p.translate(0,-47);p.rotate(Math.sin(spin)*.06);p.strokeRect(-17,-17,34,34);path(p,[[-11,-8],[11,-8],[0,-8],[0,10],[-11,10],[11,10],[-9,1],[9,1]]);p.restore();wheel(r+10,9,spin*.12);break;
    }
    p.restore();
  }
  function notice(){const box=document.getElementById('cultivationNotice');if(!box)return;box.hidden=!transition||!['playing','win','story','character'].includes(G.state);if(box.hidden)return;const t=transition;box.classList.toggle('major',t.major);box.classList.toggle('minor',!t.major);box.style.setProperty?.('--ascension-color',t.major?colors[t.realm]:'#b9f3ea');document.getElementById('cultivationNoticeTitle').textContent=t.major?'破境 · '+Cultivation.realms[t.realm]:'修为精进 · '+Cultivation.realms[t.realm]+'第'+t.layer+'层';document.getElementById('cultivationNoticeDetail').textContent=t.major?ascensions[t.realm]+' · 术法赠礼 +3':(t.layer-t.fromLayer>1?'连升 '+(t.layer-t.fromLayer)+' 层 · ':'')+'灵脉贯通 · 生命、护盾与伤害提高';const canvas=document.getElementById('cultivationNoticeArt');if(canvas?.getContext){const pen=canvas.getContext('2d');pen.clearRect(0,0,110,130);pen.save();pen.translate(55,110);pen.scale(.72,.72);advancement(pen,{realm:t.realm},false);advancement(pen,{realm:t.realm},true);pen.restore();}}

  function path(p,points){p.beginPath();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.stroke();}
  function petal(p,x,y,r,a,color){p.save();p.translate(x,y);p.rotate(a);const g=p.createLinearGradient(0,0,0,-r);g.addColorStop(0,color+'08');g.addColorStop(.6,color+'55');g.addColorStop(1,'#f5efcfaa');p.fillStyle=g;p.beginPath();p.moveTo(0,0);p.bezierCurveTo(-r*.55,-r*.3,-r*.32,-r*.8,0,-r);p.bezierCurveTo(r*.32,-r*.8,r*.55,-r*.3,0,0);p.fill();p.stroke();p.restore();}
  function danger(){if(typeof G==='undefined'||typeof P==='undefined'||!P)return false;
    return G.telegraphs.some(t=>{const dx=P.x-t.x,dy=P.y-t.y;if(t.shape==='annulus')return Math.abs(Math.hypot(dx,dy)-t.r)<t.width+110;if(t.shape==='line')return Math.abs(dx*Math.cos(t.angle)+dy*Math.sin(t.angle))<(t.length||300)+100&&Math.abs(-dx*Math.sin(t.angle)+dy*Math.cos(t.angle))<(t.r||40)+100;if(t.shape==='tide')return Math.abs(dy)<(t.r||60)+100&&Math.abs(P.x-t.gap)>(t.safe||160)/2-50;return Math.hypot(dx,dy)<(t.r||80)+110;})||G.eshots.some(s=>Math.hypot(s.x-P.x,s.y-P.y)<180)||G.enemies.some(e=>e.hp>0&&e.action==='windup'&&Math.hypot(e.x-P.x,e.y-P.y)<330);}
  function presentation(c,preview=false){return {preview,decoration:preview||!danger()?1:.4,radius:preview?120:87,height:preview?230:185.6,mobile:!preview&&(W<650||matchMedia('(pointer: coarse)').matches)};}
  // Feet-relative body anchors follow the same recoil, lunge, facing and frame as the sprite.
  function body(p,c,time,pose,front=false,moving=false,oldPass=false,options={}){
    const v=get(c),r=c.realm,l=v.layer,color=v.color,breath=.84+Math.sin(time*2.1)*.12,arm=pose==='attack'?-12:pose==='ultimate'?-26:0;
    const mode=presentation(c,!!options.preview),inherited=p.globalAlpha??1,age=transition&&transition.realm===r?transition.age:10;
    if(!front&&!oldPass&&transition?.major&&r>0&&age<.7){p.save();p.globalAlpha=inherited*(1-age/.7)*.55;const shrink=1-age*.65;p.scale(shrink,shrink);body(p,{realm:r-1,layer:9},time,pose,false,moving,true,options);p.restore();}
    p.save();if(!mode.preview){p.beginPath();p.rect(-87,-185.6,174,195.6);p.clip();}p.globalCompositeOperation='lighter';p.lineWidth=1.05;p.shadowColor=color;p.shadowBlur=mode.mobile?3:7;p.strokeStyle=color+'88';
    if(!front){
      if(!oldPass&&transition?.major&&age<2){const bloom=.82+.18*Math.min(1,age/1.2);p.scale(bloom,bloom);}
      const size=mode.preview?1+r*.025+l*.009:Math.min(1.12,1+r*.007+l*.004);p.translate(0,-61);p.scale(size,size);
      const halo=p.createRadialGradient(0,0,7,0,0,75);halo.addColorStop(0,color+'3c');halo.addColorStop(.65,color+'19');halo.addColorStop(1,color+'00');p.globalAlpha=inherited*mode.decoration;p.fillStyle=halo;p.fillRect(-75,-75,150,150);
      p.globalAlpha=inherited*breath*(.62+l*.035)*mode.decoration*(!oldPass&&transition?.major?Math.min(1,.25+age/1.2):1);p.strokeStyle=color+'dd';
      if(r>0){p.save();p.rotate(time*.045);const radius=38+Math.min(13,r)*1.3;for(let k=0;k<2;k++){p.beginPath();p.arc(0,-4,radius+k*6,0,Math.PI*2);p.stroke();}for(let i=0;i<9;i++){const a=i*Math.PI*2/9;p.save();p.rotate(a);p.globalAlpha*=i<l?1:.2;p.fillStyle=color;p.fillRect(radius-2,-1,4,2);if(i<l)path(p,[[radius-4,-4],[radius+4,0],[radius-4,4]]);p.restore();}p.restore();}
      if(r>0){p.save();p.globalAlpha=inherited*.12*mode.decoration;p.strokeStyle=colors[r-1];p.beginPath();p.ellipse(0,3,23,43,0,0,Math.PI*2);p.stroke();p.restore();}
      if(r===0){p.beginPath();p.ellipse(0,3,23,43,0,0,Math.PI*2);p.stroke();}
      if([1,3,8,12,13].includes(r)){
        const radius=32+r*1.25;p.save();p.rotate(time*(r%2?.06:-.04));
        for(let k=0;k<2+(l>=4?1:0);k++){p.beginPath();p.arc(0,-4,radius+k*5,0,Math.PI*2);p.stroke();}
        const count=8+(l>=6?4:0);for(let i=0;i<count;i++){p.save();p.rotate(i*Math.PI*2/count);path(p,[[radius-3,-2],[radius+4,0],[radius-3,2]]);if(l>=8)path(p,[[radius+9,-4],[radius+12,0],[radius+9,4]]);p.restore();}p.restore();
      }
      if([2,3,5,6,13].includes(r)){
        p.save();p.translate(0,r===2?-13:-8);p.scale(r===2?.7:1.25,r===2?.7:1.25);
        p.fillStyle=color+'0d';p.beginPath();p.ellipse(0,-19,9,12,0,0,Math.PI*2);p.fill();p.stroke();
        p.beginPath();p.moveTo(-8,-7);p.bezierCurveTo(-24,0,-31,17,-35,31);p.lineTo(-18,23);p.lineTo(-13,48);p.quadraticCurveTo(0,57,13,48);p.lineTo(18,23);p.lineTo(35,31);p.bezierCurveTo(31,17,24,0,8,-7);p.closePath();p.fill();p.stroke();
        if(l>=4){path(p,[[-8,1],[-17,18],[-3,27],[0,45],[3,27],[17,18],[8,1]]);}p.restore();
      }
      if(r===4){for(let i=0;i<3+(l>=6?2:0);i++){p.globalAlpha=inherited*(.3+i*.06)*breath*mode.decoration;p.beginPath();p.ellipse(Math.sin(time+i)*5,0,26+i*6,46+i*3,Math.sin(i)*.2,Math.PI*.2,Math.PI*1.7);p.stroke();}path(p,[[-43,-25],[-30,-20],[-36,-7],[-25,5]]);}
      if([5,8,10].includes(r))for(let side of [-1,1]){p.save();p.scale(side,1);for(let i=0;i<3+(l>=4?2:0);i++)petal(p,12,18,42+i*7,.5+i*.16,color);p.restore();}
      if(r===7){for(let i=0;i<5+(l>=6?3:0);i++){const a=i*Math.PI*2/8+time*.08,x=Math.cos(a)*43,y=Math.sin(a)*43;path(p,[[x*.65,y*.65],[x,y],[x*.88+5,y+6],[x*1.25,y*1.25]]);}}
      if(r===9){const count=7+(l>=4?5:0);const pts=Array.from({length:count},(_,i)=>[Math.cos(i*2.4+time*.04)*(30+i%3*9),Math.sin(i*2.4+time*.04)*(30+i%3*9)]);path(p,[...pts,pts[0]]);for(const [x,y] of pts){p.fillStyle='#e8ffff';p.beginPath();p.arc(x,y,1.4,0,Math.PI*2);p.fill();}}
      if(r===10)for(let i=0;i<5;i++){p.strokeStyle=['#b3e6dc','#ddc481','#e4bbb3','#b7c8f2','#cbb5df'][i];p.beginPath();p.ellipse(0,0,39,13,i*Math.PI/5+time*.08,0,Math.PI*2);p.stroke();}
      if(r===11){for(let i=0;i<3;i++){const x=(i-1)*23,y=-36-(i===1?16:0);for(let j=0;j<5;j++)petal(p,x,y,13+(l>=6?3:0),j*Math.PI*2/5+time*.05,color);}}
      if(r===12){for(let i=0;i<6;i++)petal(p,0,0,47,i*Math.PI/3+time*.035,color);}
      if(r===13){p.save();p.translate(0,-67);p.fillStyle='#ffe6a618';p.fillRect(-13,-13,26,26);p.strokeRect(-13,-13,26,26);path(p,[[-8,-5],[8,-5],[0,-5],[0,8],[-9,8],[9,8]]);p.restore();}
      if(l>=7&&moving){for(let i=0;i<(W<650?2:4);i++)path(p,[[-19-i*5,38],[-25-i*7,53],[-32-i*6,67+Math.sin(time*5+i)*6]]);}
      if(l>=9){p.lineWidth=.5;p.strokeStyle=color+'55';p.beginPath();p.ellipse(0,0,56+r,65+r*.5,0,0,Math.PI*2);p.stroke();}
    }else{
      p.shadowBlur=mode.mobile?3:6;p.globalAlpha=inherited*breath;p.fillStyle=color+'d9';p.strokeStyle=color+'d0';
      const core=p.createRadialGradient(0,-65,0,0,-65,8+r*.12);core.addColorStop(0,'#fff9e2e8');core.addColorStop(.2,color+'bb');core.addColorStop(1,color+'00');p.fillStyle=core;p.fillRect(-11,-77,22,24);
      if(l>=2)path(p,[[0,-57],[0,-69],[-11,-75],[-17,-68]]);
      if(l>=3){path(p,[[0,-69],[12,-75],[19,-64+arm],[27,-48+arm]]);path(p,[[-11,-75],[-18,-62],[-25,-48]]);}
      if(l>=4){p.beginPath();p.ellipse(0,-65,7,5,0,0,Math.PI*2);p.stroke();}
      if(l>=5){const t=(time*.45)%1;p.fillStyle='#f7fff6';p.beginPath();p.arc(17+t*10,-65+17*t+arm,1.2,0,Math.PI*2);p.fill();}
      if(l>=6){p.beginPath();p.arc(27,-48+arm,4,0,Math.PI*2);p.stroke();}
      if(l>=7){path(p,[[0,-57],[-4,-41],[-11,-19]]);path(p,[[0,-57],[5,-39],[12,-17]]);}
      if(l>=8){p.strokeStyle=color+'66';path(p,[[-18,-73],[-25,-56],[-18,-38],[-22,-15]]);}
      if(l>=9){p.fillStyle=color+'aa';for(let i=0;i<(mode.mobile?5:9);i++){const a=time*.5+i*Math.PI*2/9;p.beginPath();p.arc(Math.cos(a)*33,-56+Math.sin(a)*37,1.1,0,Math.PI*2);p.fill();}}

    }
    if(!oldPass)advancement(p,c,front);
    p.restore();
  }
  function draw(c,x,y,time,scale=1){const v=get(c),r=31+c.realm*.8;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale*.46);ctx.strokeStyle=v.color;ctx.globalAlpha=.55*presentation(c).decoration;ctx.lineWidth=1.2;
    for(let k=0;k<v.rings;k++){ctx.beginPath();ctx.ellipse(0,0,r+k*10,r+k*10,0,0,Math.PI*2);ctx.stroke();}
    const count=4+v.detail*2+c.realm;for(let i=0;i<count;i++){const a=i*Math.PI*2/count+time*(c.realm%2?-.3:.25);ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r-5,-3);ctx.lineTo(r+5,0);ctx.lineTo(r-5,3);ctx.stroke();ctx.restore();}
    if(c.realm){ctx.rotate(-time*.15);ctx.strokeRect(-r*.6,-r*.6,r*1.2,r*1.2);}ctx.restore();
  }
  return {get,draw,body,advance,advancement,update,notice,ascensions,status:()=>transition?{...transition}:null,danger,presentation,reset(){transition=null;pendingAdvance=null;}};
})();
