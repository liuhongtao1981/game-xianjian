/* Account selection is the boundary for every save key and every playable entry. */
const AccountSession=(()=>{
  const sessionKey='xunsheng-account-session-v1',esc=AccountModel.escape;
  let vault=null,current=null,panel=null,previous=null,focusBefore=null,screen='login',rankMode='realm',notice='',busy=false,ready=false,legacy=null,suggestion='';
  let cloudRevision=0,queued=null,syncTimer=null,inFlight=null,cloudConflict=null,cloudMessage='',rankingCache={rows:[],total:0,mine:null},rankLoading=false,rankError='',rankToken=0;
  const canPlay=()=>ready&&!!current&&!cloudConflict;
  const overlayActive=()=>previous!==null;
  const storageKey=key=>vault?vault.storageKey(current?.id||'locked',key):'xunsheng-user-locked:'+key;
  const publicCurrent=()=>current?{...current}:null;
  function clearOverlays(){AscensionScene.cancel();if(Alchemy.active())Alchemy.close();ExperienceUI.close();if(EndingScene.active())EndingScene.close();}
  function remember(){vault.remember(current);}
  function activate(result,{force=false,useLocal=false}={}){
    const user=result.user,local=vault.localSave(user.id),meta=vault.meta(user.id),validLocal=local&&RunSave.valid(local),dirty=validLocal&&(meta.pending||local.revision>(meta.syncedLocalRevision||0));
    if(result.save&&!RunSave.valid(result.save))throw Error('云端历程未通过校验，本地进度已保留');
    if(!force&&dirty&&result.revision!==meta.revision){current=user;ready=true;cloudConflict={result,local};previous='start';G.state='account';screen='conflict';document.body.classList.add('in-account');panel.hidden=false;render();return;}
    ready=false;clearOverlays();cloudConflict=null;queued=null;clearTimeout(syncTimer);syncTimer=null;cloudRevision=result.revision;
    const pending=validLocal&&(useLocal||!force&&(dirty||!result.save&&!result.legacyProgress));
    if(!pending)vault.install(user.id,result,result.revision);else vault.setMeta(user.id,{...meta,revision:result.revision,pending:true});
    current=user;remember();ready=true;notice='';cloudMessage=pending?'本地进度等待同步':'云端历程已载入';
    clearInput();Sound.reset();RunSave.reloadAccount();
    Object.assign(Journey.run,{stage:0,difficulty:'normal',ultimate:'heaven',equippedUltimates:['heaven','lotus','river'],heroId:RunSave.snapshot()?.run.player.heroId||'xiaoguo',completed:[],time:0,checkpoint:null,tier:0,extramural:false,passage:null});
    reset();G.state='start';previous=null;panel.hidden=true;document.body.classList.remove('account-required','in-account');Journey.menu();sync();if(pending)onSaved(local);
  }
  async function init(){
    panel=document.createElement('aside');panel.id='accountPanel';panel.className='account-overlay';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','剑仙账号');document.body.appendChild(panel);
    const button=document.createElement('button');button.id='accountBtn';button.textContent='账号';button.onclick=()=>open('profile');document.querySelector('.window-controls')?.appendChild(button);
    const ranking=document.createElement('button');ranking.id='rankingBtn';ranking.textContent='修仙榜';ranking.onclick=()=>open('ranking');document.querySelector('.window-controls')?.appendChild(ranking);
    document.body.classList.add('account-required');open('login');
    window.addEventListener('online',()=>{if(current)flush().catch(()=>{});});
    try{
      if(!globalThis.crypto?.subtle)throw Error('此地址无法启用密码保护，请使用 HTTPS 或 localhost 打开游戏');
      vault=AccountStore.create();
      legacy=await vault.migrateLegacy({validSave:RunSave.valid,convertLegacy:RunSave.convertLegacy,validProgress:p=>p.version===1&&Number.isInteger(p.cleared)&&p.cleared>=0&&p.cleared<=42&&Object.values(p.entries||{}).every(e=>JourneyProgress.validBuild(e.build))});
      ready=true;const saved=await vault.restore();if(saved){activate(saved);return;}
      suggestion='';render();
    }catch(error){notice=error.message||'账号服务暂不可用，原有存档已保留';current=null;ready=true;render();}
  }
  function open(kind='profile'){
    if(!panel)return false;
    if(previous!==null){if(busy||cloudConflict)return false;screen=kind==='profile'&&!current?'login':kind;render();if(screen==='ranking')loadRanking();return true;}
    if(AscensionScene.active()||EndingScene.active()||Alchemy.active()||!['start','playing','paused','map','character','account'].includes(G.state))return false;
    if(current&&!RunSave.save('打开账号'))return false;
    previous=canPlay()?G.state:'start';focusBefore=document.activeElement;screen=kind==='profile'&&!current?'login':kind;G.state='account';clearInput();Sound.stopNarration();document.body.classList.add('in-account');panel.hidden=false;render();if(screen==='ranking')loadRanking();return true;
  }
  function close(){
    if(!canPlay()||busy||previous===null)return false;
    const restore=previous;previous=null;panel.hidden=true;document.body.classList.remove('in-account');clearInput();G.state=restore;last=performance.now();focusBefore?.focus?.();sync();return true;
  }
  function status(text,error=false){notice=text;const node=document.getElementById('accountMessage');if(node){node.textContent=text;node.dataset.error=String(error);}}
  function fillAccount(account){const field=document.getElementById('accountInput');if(field){field.value=account;field.focus();}}
  async function submit(form){
    if(busy||!ready)return;const values=new FormData(form);busy=true;const submit=form.querySelector('[type="submit"]');submit.disabled=true;status('正在处理…');
    try{
      if(screen==='register'){
        const user=await vault.register(values.get('account'),values.get('password'),values.get('name'));suggestion=user.account;screen='login';notice='注册成功，请输入密码登录：'+user.account;render();
      }else if(screen==='login'){
        const result=await vault.login(values.get('account'),values.get('password'));activate(result);
      }else if(screen==='profile'){
        current=await vault.profile(current.id,{name:values.get('name'),password:values.get('newPassword')||undefined,currentPassword:values.get('currentPassword')});remember();notice='名称与账号设置已保存';render();sync();
      }
    }catch(error){if(!ready){current=null;ready=true;}status(error.message||'未能保存，请重试',true);}finally{busy=false;const button=panel.querySelector('[type="submit"]');if(button)button.disabled=!ready;}
  }
  async function logout(){
    if(busy||!current)return false;if(!RunSave.save('退出账号')){status('当前历程尚未保存，请稍后再退出',true);return false;}
    busy=true;status('正在保存并退出…');let syncFailed=false;try{await flush();}catch{syncFailed=true;}if(cloudConflict||!current){busy=false;render();return false;}
    suggestion='';try{await vault.logout();}catch{}clearTimeout(syncTimer);queued=null;inFlight=null;current=null;busy=false;RunSave.reloadAccount();previous=null;document.body.classList.add('account-required');notice=syncFailed?'已退出。本机进度已保留，下次登录时继续同步':'已保存并退出，请登录后继续';G.state='start';open('login');sync();return true;
  }
  function onSaved(snapshot){
    if(!current||!vault||cloudConflict)return;
    queued=snapshot;cloudMessage='本地已保存 · 云端待同步';try{vault.setMeta(current.id,{...vault.meta(current.id),revision:cloudRevision,pending:true});}catch{cloudMessage='本地已保存 · 云同步标记未写入';}
    if(!syncTimer&&!inFlight)syncTimer=setTimeout(()=>{syncTimer=null;flush().catch(()=>{});},1500);
  }
  async function flush(){
    if(inFlight){await inFlight;if(queued)return flush();return;}
    if(!queued||!current||cloudConflict)return;
    const snapshot=queued,userId=current.id;queued=null;clearTimeout(syncTimer);syncTimer=null;cloudMessage='正在同步云端…';
    inFlight=(async()=>{
      try{
        const result=await vault.save(snapshot,cloudRevision);if(current?.id!==userId)return;cloudRevision=result.revision;vault.setMeta(userId,{revision:cloudRevision,pending:!!queued,syncedLocalRevision:snapshot.revision});cloudMessage=queued?'本地已保存 · 云端待同步':'云端已同步';
      }catch(error){
        if(current?.id!==userId)throw error;queued=queued||snapshot;cloudMessage=error.message;
        if(error.status===409){
          const result=await vault.restore();
          // A lost HTTP response can leave our exact snapshot committed already.
          if(JSON.stringify(result.save)===JSON.stringify(snapshot)){cloudRevision=result.revision;if(queued===snapshot)queued=null;vault.setMeta(userId,{revision:cloudRevision,pending:!!queued,syncedLocalRevision:snapshot.revision});cloudMessage=queued?'本地已保存 · 云端待同步':'云端已同步';return;}
          cloudConflict={result,local:vault.localSave(userId)};clearOverlays();clearInput();previous='start';screen='conflict';G.state='account';document.body.classList.add('in-account');panel.hidden=false;render();
        }
        else if(error.status===401){current=null;vault.forget();clearOverlays();previous='start';screen='login';G.state='account';document.body.classList.add('account-required','in-account');notice='登录已过期，请重新登录；本地进度已保留';panel.hidden=false;render();}
        else if(!syncTimer)syncTimer=setTimeout(()=>{syncTimer=null;flush().catch(()=>{});},30000);
        throw error;
      }finally{inFlight=null;}
    })();
    await inFlight;if(queued&&!cloudConflict)return flush();
  }
  async function loadRanking(){
    const token=++rankToken,mode=rankMode;rankLoading=true;rankError='';render();
    try{try{await flush();}catch{}const result=await vault.leaderboard(mode);if(token!==rankToken)return;rankingCache=result;}catch(error){if(token===rankToken)rankError=error.message;}finally{if(token===rankToken){rankLoading=false;if(screen==='ranking'&&overlayActive())render();}}
  }
  function conflictHTML(){
    const local=AccountModel.summary(cloudConflict.local?.run?.player),remote=AccountModel.summary(cloudConflict.result.save?.run.player);
    return `<section class="cloud-conflict"><h3>发现两份不同的修仙历程</h3><p>另一设备已更新云端，本机仍有未同步的进度。两份进度会先保留备份，请选择本次继续使用哪一份。</p><div class="cloud-options"><button id="useCloudSave"><b>使用云端历程</b><span>${AccountModel.realmLabel(remote)} · Lv.${remote.level} · 战力 ${remote.power}</span></button><button id="useLocalSave"><b>保留本机并同步</b><span>${AccountModel.realmLabel(local)} · Lv.${local.level} · 战力 ${local.power}</span></button></div></section>`;
  }
  function resolveConflict(useLocal){
    const conflict=cloudConflict;if(!conflict||busy)return;
    try{if(conflict.local)localStorage.setItem(vault.storageKey(conflict.result.user.id,'cloud-conflict-backup'),JSON.stringify(conflict.local));activate(conflict.result,{force:true,useLocal});}catch(error){status(error.message,true);}
  }
  function formHTML(){
    const registering=screen==='register';return `<form id="accountForm" class="account-form"><label>账号<div class="account-field-row"><input id="accountInput" name="account" autocomplete="username" minlength="3" maxlength="24" required value="${esc(suggestion)}" placeholder="至少3位"><button type="button" id="randomAccountBtn">随机生成</button></div><small>3至24位，可使用中文、字母、数字、下划线</small></label>${registering?'<label>修仙名称<input name="name" maxlength="20" placeholder="不填则使用账号名" autocomplete="nickname"></label>':''}<label>密码<input id="accountPassword" name="password" type="password" minlength="3" maxlength="128" autocomplete="${registering?'new-password':'current-password'}" required placeholder="至少3位"></label><button class="btn" type="submit" ${ready?'':'disabled'}>${registering?'注 册 账 号':'登 录 · 续 修 仙 途'}</button></form>`;
  }
  function profileHTML(){
    const save=RunSave.snapshot(),summary=AccountModel.summary(save?.run.player);return `<div class="account-summary"><span>${esc(current.account)}</span><strong>${esc(current.name)}</strong><p>${save?AccountModel.realmLabel(summary)+' · 战力 '+summary.power.toLocaleString('zh-CN'):'尚未启程 · 登录后可开始修行'}</p></div><form id="accountForm" class="account-form"><label>修仙名称<input name="name" value="${esc(current.name)}" maxlength="20" required autocomplete="nickname"></label><details class="password-settings"><summary>修改密码</summary><label>当前密码<input name="currentPassword" type="password" autocomplete="current-password"></label><label>新密码<input name="newPassword" type="password" minlength="3" maxlength="128" autocomplete="new-password" placeholder="至少3位，不修改请留空"></label></details><button class="btn" type="submit">保存名称与设置</button></form><button id="logoutAccountBtn" class="account-secondary">保存并退出登录</button>`;
  }
  function rankingHTML(){
    const rows=rankingCache.rows,mine=rankingCache.mine;
    return `<div class="ranking-toolbar"><div><h3>全服修仙排行榜</h3><p>所有玩家共享 · 共 ${rankingCache.total} 位剑仙${mine?' · 我的排名 '+mine.rank:''}</p></div><button id="refreshRankingBtn" ${rankLoading?'disabled':''}>${rankLoading?'载入中…':'刷新榜单'}</button></div><div class="ranking-tabs"><button data-rank="realm" aria-pressed="${rankMode==='realm'}">境界榜</button><button data-rank="power" aria-pressed="${rankMode==='power'}">战力榜</button></div><p class="ranking-rule">${rankMode==='realm'?'先按大境界、层数，再按战力排名':'先按战力，再按大境界、层数排名'}。同分按账号排序。展示前100位及我的全服排名。</p>${rankError?'<p class="account-error">'+esc(rankError)+'</p>':''}<div class="ranking-scroll"><table class="ranking-table"><thead><tr><th>名次</th><th>剑仙</th><th>境界</th><th>战力</th></tr></thead><tbody>${rows.map(row=>`<tr class="${row.id===current?.id?'ranking-mine':''}"><td><b class="rank-number">${row.rank}</b></td><td><strong>${esc(row.name)}</strong><small>${esc(row.account)}${row.id===current?.id?' · 我':''}</small></td><td>${AccountModel.realmLabel(row)}<small>Lv.${row.level}</small></td><td class="rank-power">${row.power.toLocaleString('zh-CN')}</td></tr>`).join('')||'<tr><td colspan="4" class="ranking-empty">'+(rankLoading?'正在读取全服榜单…':rankError?'暂未取得榜单，请重试':'尚无账号，注册后从筑基踏上仙途。')+'</td></tr>'}</tbody></table></div><p class="ranking-rule">战力依据生命与护盾上限、伤害、暴击、冷却和术法等常驻属性，由服务端统一计算。</p>`;
  }

  function render(){
    if(!panel||previous===null)return;const ranking=screen==='ranking';
    panel.innerHTML=`<section class="account-sheet ${ranking?'account-ranking':''}"><header class="account-header"><div><span class="overline">重 走 西 游 · 剑 仙 仙 籍</span><h1>${ranking?'仙 道 天 榜':screen==='profile'?'剑 仙 仙 籍':'执 籍 入 仙 途'}</h1><p>${current?'欢迎，道友 '+esc(current.name):'先注册，再登录 · 每位剑仙拥有独立历程'}</p></div>${canPlay()?'<button id="accountClose" aria-label="关闭账号面板">×</button>':''}</header><nav class="account-tabs">${(cloudConflict?[]:current?[['profile','我的账号'],['ranking','修仙排行榜']]:[['login','登录'],['register','注册'],['ranking','修仙排行榜']]).map(([kind,name])=>`<button data-account-screen="${kind}" aria-pressed="${screen===kind}">${name}</button>`).join('')}</nav><div class="account-content">${screen==='conflict'&&cloudConflict?conflictHTML():ranking?rankingHTML():screen==='profile'&&current?profileHTML():formHTML()}</div><footer class="account-footer"><p id="accountMessage" role="status" aria-live="polite">${esc(notice||(!ready?'正在检查账号与原有历程…':current?'修行进度随当前账号保存':'联网账号 · 云端保存历程 · 全服共享排行榜'))}</p><small>云端账号 · 各自独立历程</small></footer></section>`;
    panel.querySelectorAll('[data-account-screen]').forEach(button=>button.onclick=()=>{if(busy)return;screen=button.dataset.accountScreen;notice='';render();if(screen==='ranking')loadRanking();});
    panel.querySelectorAll('[data-rank]').forEach(button=>button.onclick=()=>{rankMode=button.dataset.rank;loadRanking();});
    const form=panel.querySelector('#accountForm');if(form)form.onsubmit=event=>{event.preventDefault();submit(form);};
    const random=panel.querySelector('#randomAccountBtn');if(random)random.onclick=()=>{if(!vault)return;fillAccount(vault.randomAccount());};
    const logoutButton=panel.querySelector('#logoutAccountBtn');if(logoutButton)logoutButton.onclick=logout;
    const closeButton=panel.querySelector('#accountClose');if(closeButton)closeButton.onclick=close;
    const refresh=panel.querySelector('#refreshRankingBtn');if(refresh)refresh.onclick=loadRanking;
    const cloud=panel.querySelector('#useCloudSave');if(cloud)cloud.onclick=()=>resolveConflict(false);
    const local=panel.querySelector('#useLocalSave');if(local)local.onclick=()=>resolveConflict(true);
  }
  function decorateMenu(){
    if(!current)return;const root=document.querySelector('.journey-menu');if(!root)return;const card=document.createElement('section');card.className='account-menu-card';const summary=AccountModel.summary(RunSave.snapshot()?.run.player);
    card.innerHTML=`<div><span class="overline">已登录</span><strong>${esc(current.name)}</strong><small>${RunSave.snapshot()?AccountModel.realmLabel(summary)+' · 战力 '+summary.power.toLocaleString('zh-CN'):'以此账号开启独立修仙历程'}</small></div><div><button id="menuProfileBtn">名称与账号</button><button id="menuRankingBtn">查看修仙榜 →</button></div>`;root.prepend(card);card.querySelector('#menuProfileBtn').onclick=()=>open('profile');card.querySelector('#menuRankingBtn').onclick=()=>open('ranking');
  }
  function sync(){const button=document.getElementById('accountBtn'),name=current?current.name:'登录';if(button&&button.textContent!==name)button.textContent=name;}
  function handleKey(event){
    if(previous===null)return false;
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){
      const nodes=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')].filter(n=>n.getClientRects().length),index=nodes.indexOf(document.activeElement);
      if(nodes.length&&(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===nodes.length-1)){event.preventDefault();nodes[event.shiftKey?nodes.length-1:0].focus();}
    }return true;
  }
  return {init,canPlay,storageKey,open,close,logout,handleKey,decorateMenu,sync,overlayActive,priorState:()=>previous,current:publicCurrent,ready:()=>ready,onSaved,flush,syncStatus:()=>cloudMessage};
})();
