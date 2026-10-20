/* Presentation and accessibility only; navigation never moves the character or alters rewards. */
const ExpeditionUI=(()=>{
  let filter='all',expanded=false;
  function decorateMenu(){
    const shelf=document.querySelector('.journey-chapters');if(!shelf)return;
    const toolbar=document.createElement('nav');toolbar.className='realm-filter';toolbar.setAttribute('aria-label','按修仙境界筛选章节');
    toolbar.innerHTML='<button data-realm="all">全部篇章</button>'+Array.from({length:Math.ceil(ChapterCatalog.playable/3)},(_,r)=>'<button data-realm="'+r+'">'+Cultivation.realms[r]+'<small>'+Math.max(0,Math.min(3,JourneyProgress.cleared()-r*3))+'/3</small></button>').join('');
    shelf.before(toolbar);
    function apply(){toolbar.querySelectorAll('[data-realm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.realm===filter)));shelf.querySelectorAll('[data-stage]').forEach(card=>{card.hidden=filter!=='all'&&Math.floor(Number(card.dataset.stage)/3)!==Number(filter);});}
    toolbar.querySelectorAll('[data-realm]').forEach(b=>b.onclick=()=>{filter=b.dataset.realm;apply();});
    shelf.querySelectorAll('[data-stage]').forEach(card=>{const chapter=ChapterCatalog.get(Number(card.dataset.stage)),chip=document.createElement('span');chip.className='realm-chip';chip.textContent=Cultivation.realms[chapter.realm]+'篇';card.prepend(chip);});
    apply();
  }
  function init(){
    const detail=document.getElementById('detailBtn');if(detail)detail.onclick=()=>{expanded=!expanded;sync();};
    document.getElementById('pauseBtn').onclick=()=>{if(['playing','paused'].includes(G.state))togglePause();};
    document.querySelectorAll('[data-guide]').forEach(button=>button.onclick=()=>{World.setGuide(button.dataset.guide);if(G.state==='map')World.toggleMap();sync();});
  }
  function sync(){
    const boss=World.active()&&G.boss?.hp>0;document.body.classList.toggle('in-boss',!!boss);document.body.classList.toggle('hud-expanded',expanded);
    const detail=document.getElementById('detailBtn');if(detail){detail.setAttribute('aria-expanded',String(expanded));detail.textContent=expanded?'收起战况':'展开战况';}
    const pause=document.getElementById('pauseBtn');if(pause)pause.textContent=G.state==='paused'?'继续':'暂停';
    document.querySelectorAll('[data-guide]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guide===World.guideMode())));
  }
  return {decorateMenu,init,sync};
})();
