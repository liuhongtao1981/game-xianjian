/* Immortal power belongs to movement, independently of the three ultimate arts. */
const ImmortalMovement=(()=>{
  const controls=new Set(),dashCost=10,drain=20,regen=16,multiplier=1.7;
  let exhausted=false,recovery=0,echo=0,sprinting=false;
  const max=(p=P)=>100+8*Math.max(0,Math.min(13,p?.cultivation?.realm||0));
  function ensure(p=P){if(p)p.mana=Number.isFinite(p.mana)?Math.max(0,Math.min(max(p),p.mana)):max(p);return p?.mana||0;}
  function press(source='keyboard'){
    if(!P||P.hp<=0||G.state!=='playing'||controls.has(source))return false;
    if(!controls.size)exhausted=ensure()<1;
    controls.add(source);return true;
  }
  function release(source){if(source===undefined)controls.clear();else controls.delete(source);if(!controls.size){sprinting=false;exhausted=false;}}
  function reset(){release();recovery=0;echo=0;}
  function spendDash(){if(ensure()<dashCost)return false;P.mana-=dashCost;recovery=.75;return true;}
  function restore(amount){const before=ensure();P.mana=Math.min(max(),before+Math.max(0,Number(amount)||0));return P.mana-before;}
  function update(dt,moving){
    ensure();sprinting=false;if(G.state!=='playing'||dt<=0)return 1;
    if(controls.size&&moving&&!exhausted&&P.mana>0){
      const powered=Math.min(dt,P.mana/drain);P.mana=Math.max(0,P.mana-drain*dt);recovery=.75;sprinting=true;
      echo-=dt;if(echo<=0){echo=.08;Motion.echo(P);}
      if(P.mana<=.00001){P.mana=0;exhausted=true;}
      // The last partial frame spends only the power actually available.
      return 1+(multiplier-1)*powered/dt;
    }
    const recovering=Math.max(0,dt-recovery);recovery=Math.max(0,recovery-dt);
    if(!controls.size||!moving)restore(recovering*regen);
    return 1;
  }
  function bind(button){
    button.addEventListener('pointerdown',e=>{if(e.button!==0||G.state!=='playing')return;e.preventDefault();if(press('pointer:'+e.pointerId))tryDash();try{button.setPointerCapture(e.pointerId);}catch{}});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>release('pointer:'+e.pointerId));
    // Keyboard/assistive activation has no pointerdown; a real click already dashed.
    button.onclick=e=>{if(!e||e.detail===0)tryDash();};
  }
  function sync(){
    if(!P)return;const value=ensure(),button=document.getElementById('dashBtn');
    document.getElementById('manaBar').style.width=value/max()*100+'%';
    document.getElementById('manaText').textContent='仙力 '+Math.ceil(value)+' / '+max();
    button.disabled=G.state!=='playing';button.classList.toggle('sprinting',sprinting);button.setAttribute('aria-pressed',String(controls.size>0));
    document.getElementById('dashStatus').textContent=exhausted?'松开回气':sprinting?'疾行 · 耗仙力':P.dashCd>0?'闪避 '+P.dashCd.toFixed(1)+'秒':value<dashCost?'仙力恢复中':'点按闪 · 按住疾行';
  }
  return {max,ensure,press,release,reset,restore,spendDash,update,bind,sync,status:()=>({held:controls.size>0,sprinting,exhausted}),dashCost,drain,regen,multiplier};
})();
