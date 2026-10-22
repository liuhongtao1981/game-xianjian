/* The epilogue is a read-only view over a verified forty-two-chapter completion. */
const EndingScene=(()=>{
 const pages=[
  '天衡倒下之后，石庭没有升起另一张王座。孙小果把终契放在地上，先念出那些曾被写成数字的人名。风从裂缝里穿过，四十二道劫痕第一次不再指向一笔新的欠账。',
  '大圣站在新册旁，没有让众人跪下。他说自己也曾误信、迟到，也有没能救下的人；若寻到一个圣，只是为了让他替所有人永远作主，这一路便还没有真正走完。',
  '照命河的人翻过价镜，凤仙的百姓打开雨瓮，狮驼的家属找回门牌。有人留下，有人离开，有人决定重新履约，也有人要求把旧话的前后文补全。没有一张新的天条替他们预先决定。',
  '孙小果没有把所有账烧掉。姓名、经手与后果都留在册中，让受过伤的人仍有地方追问；那些不许改口、不许退出、不许解释的条款，被一页页划去。信任没有随终契一同消失，它终于需要活人彼此回答。',
  '天亮时，大圣把金毫放回人群，自己也沿那条细路走下石庭。新册最后空着一行，留给后来的人。寻圣四十二难，到此完结。愿你握住自己的剑，也记得把别人手中的笔，交还给他自己。'
 ];
 const titles=['天外无新王','大圣也是同行者','名字回到人间','留账，也留改写的路','众生归名 · 寻圣完结'];
 let view=null,serial=0;
 const active=()=>view!==null,priorState=()=>view?.before||G.state;
 function close(){if(!view)return;const before=view.before;view=null;serial++;document.body.classList.remove('in-ending');Sound.stopNarration();if(RunSave.conflicted())return;G.state=before;if(before==='start')Journey.menu();else Journey.showEnd(true);}
 function open(){if(view||JourneyProgress.cleared()!==42||RunSave.conflicted()||!['start','win'].includes(G.state)||G.state==='win'&&(Journey.run.stage!==41||Journey.run.extramural||G.queue>0||G.coreReward))return false;
  view={before:G.state,heroId:G.state==='start'?Journey.run.heroId:P.heroId,page:0,paused:false,state:'loading',reading:0};G.state='paused';clearInput();document.body.classList.remove('on-title');document.body.classList.add('in-ending');Sound.sync('story',41,false);draw();return true;
 }
 function draw(){if(!view)return;const v=view,token=++serial,last=v.page===pages.length-1;Sound.stopNarration();const ov=document.getElementById('overlay');ov.classList.remove('hidden','journey-screen','title-screen');ov.innerHTML=`<div class="panel story-panel story-player" id="endingPanel" style="--story:#d5dfeb"><div class="story-art" style="background-image:linear-gradient(0deg,#081619,transparent),url('assets/xianwang-worlds.webp');background-size:300% 100%;background-position:100% center"><span>四十二难 · 众生归名</span></div><div class="story-copy"><span class="overline">寻圣终章 · ${v.page+1} / ${pages.length}</span><h2>${titles[v.page]}</h2><p class="story-scene" aria-live="polite">${HeroIdentity.text(pages[v.page],v.heroId)}</p><blockquote>姓名归人，责任留册，笔还给活人。</blockquote><div class="story-progress">${pages.map((_,i)=>'<i class="'+(i<=v.page?'read':'')+'"></i>').join('')}</div><p id="endingVoiceStatus" class="story-voice-status" role="status"></p><div class="story-controls"><button id="endingPrevBtn" ${v.page?'':'disabled'}>上一幕</button><button id="endingPauseBtn">暂停播放</button><button id="endingNextBtn" ${last?'disabled':''}>下一幕</button></div><p>感谢同行。仍可重游四十二关、切换剑仙，或挑战各境已解锁的域外大妖。</p><button class="btn" id="endingCloseBtn">${last?'合卷 · 返回历程':'返回历程'}</button></div></div>`;
  const current=()=>view===v&&serial===token,move=delta=>{if(!current())return;v.reading++;v.page=Math.max(0,Math.min(pages.length-1,v.page+delta));v.paused=false;draw();};
  function status(state){if(!current())return;v.state=state;const labels={loading:'正在加载厚重旁白 · 播完后翻幕',playing:'正在讲述 · 播完后翻幕',paused:'语音已暂停',ended:last?'终章已讲完 · 感谢同行':'本幕讲述完毕',blocked:'语音未播放 · 点击重试',unavailable:'旁白暂不可用 · 可重试或手动翻幕',silent:'已静音 · 按阅读时间翻幕'};document.getElementById('endingVoiceStatus').textContent=labels[state]||'';document.getElementById('endingPauseBtn').textContent=['blocked','unavailable'].includes(state)?'重试语音':v.paused?'继续播放':'暂停播放';if(state==='silent'&&!v.paused&&!last){const reading=++v.reading;setTimeout(()=>{if(current()&&v.reading===reading&&!v.paused&&v.state==='silent')move(1);},Math.max(6500,pages[v.page].length*160));}}
  document.getElementById('endingPrevBtn').onclick=()=>move(-1);document.getElementById('endingNextBtn').onclick=()=>move(1);document.getElementById('endingCloseBtn').onclick=close;document.getElementById('endingPauseBtn').onclick=()=>{if(['blocked','unavailable'].includes(v.state)){Sound.activate();v.paused=false;draw();return;}v.paused=!v.paused;v.reading++;Sound.pauseNarration(v.paused);if(v.state==='silent'&&!v.paused)status('silent');};Sound.narrateStory(HeroIdentity.text(pages[v.page],v.heroId),41,status,()=>{if(current()&&!v.paused&&!last)move(1);});
 }
 function handleKey(e){if(!view)return false;if(e.key==='Escape'){e.preventDefault();close();}return true;}
 return {pages,titles,open,close,active,priorState,handleKey,status:()=>view?{page:view.page,paused:view.paused,state:view.state}:null};
})();
