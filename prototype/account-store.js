/* Network identity and shared rankings; only cached game snapshots stay on this device. */
globalThis.AccountStore=(()=>{
  const sessionKey='xunsheng-account-session-v1',migrationKey='xunsheng-account-migration-v1';
  const defaultURL='https://xunsheng-xianjian-accounts-1981.tender-mint-0697.chatgpt.site';
  const saveKeys=['xunsheng-save-v3','xunsheng-save-v3-backup','xunsheng-save-v2','xunsheng-save-v2-backup','xunsheng-progress-v1'];
  function create({storage=localStorage,session=sessionStorage,fetchAPI=globalThis.fetch.bind(globalThis),cryptoAPI=crypto,apiURL=globalThis.AccountConfig?.apiURL||defaultURL}={}){
    let token=null;try{token=JSON.parse(session.getItem(sessionKey))?.token||null;}catch{}
    const storageKey=(uid,key)=>'xunsheng-user-'+uid+':'+key;
    const parse=s=>{try{return JSON.parse(s);}catch{return null;}};
    const random=()=>Array.from(cryptoAPI.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
    async function request(route,{method='GET',data,auth=token}={}){
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000),headers={'Content-Type':'application/json'};if(auth)headers.Authorization='Bearer '+auth;
      try{
        const response=await fetchAPI(apiURL.replace(/\/$/,'')+'/api/'+route,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal,cache:'no-store'});
        let result;try{result=await response.json();}catch{throw Object.assign(Error('账号服务返回异常，请稍后重试'),{status:response.status});}
        if(!response.ok)throw Object.assign(Error(result.error||'账号服务暂不可用'),{status:response.status});return result;
      }catch(error){if(error.status)throw error;throw Object.assign(Error('暂时无法连接账号服务，请检查网络后重试'),{network:true});}finally{clearTimeout(timeout);}
    }
    function remember(user){session.setItem(sessionKey,JSON.stringify({token,user}));}
    function forget(){token=null;session.removeItem(sessionKey);}
    async function register(account,password,name){account=AccountModel.normalizeAccount(account);const error=AccountModel.accountError(account)||AccountModel.passwordError(password)||(name&&AccountModel.nameError(name));if(error)throw Error(error);return (await request('register',{method:'POST',data:{account,password,name},auth:null})).user;}
    async function login(account,password){const result=await request('login',{method:'POST',data:{account:AccountModel.normalizeAccount(account),password},auth:null});token=result.token;remember(result.user);return result;}
    async function restore(){if(!token)return null;try{return await request('me');}catch(error){if(error.status===401)forget();throw error;}}
    async function profile(uid,values){const result=await request('profile',{method:'POST',data:values});remember(result.user);return result.user;}
    async function logout(){try{if(token)await request('logout',{method:'POST',data:{}});}finally{forget();}}
    async function migrateLegacy({validSave,validProgress,convertLegacy}={}){
      let marker=parse(storage.getItem(migrationKey));if(marker?.user)return marker.user;
      const original=Object.fromEntries(saveKeys.map(key=>[key,storage.getItem(key)]));let save=null;
      for(const key of saveKeys.slice(0,4)){let candidate=parse(original[key]);if(candidate?.version===2)candidate=convertLegacy(candidate);if(candidate&&validSave(candidate)){save=candidate;break;}}
      const progress=parse(original['xunsheng-progress-v1']);if(!save&&!(progress?.cleared>0&&validProgress(progress)))return null;
      if(!marker){marker={migrationId:random(),migrationSecret:random()};storage.setItem(migrationKey,JSON.stringify(marker));}
      const result=await request('legacy',{method:'POST',auth:null,data:{...marker,...(save?{save}:{progress})}});
      marker.user=result.user;storage.setItem(migrationKey,JSON.stringify(marker));return result.user;
    }
    function meta(uid){return parse(storage.getItem(storageKey(uid,'cloud-meta')))||{revision:0,pending:false};}
    function setMeta(uid,value){storage.setItem(storageKey(uid,'cloud-meta'),JSON.stringify(value));}
    function localSave(uid){return parse(storage.getItem(storageKey(uid,'xunsheng-save-v3')));}
    function install(uid,{save,legacyProgress},revision){
      const key=storageKey(uid,'xunsheng-save-v3'),old=storage.getItem(key);
      if(save){if(old&&old!==JSON.stringify(save))storage.setItem(storageKey(uid,'cloud-previous-save'),old);storage.setItem(key,JSON.stringify(save));storage.setItem(storageKey(uid,'xunsheng-save-v3-backup'),JSON.stringify(save));storage.setItem(storageKey(uid,'xunsheng-progress-v1'),JSON.stringify(save.progress));}
      else if(legacyProgress)storage.setItem(storageKey(uid,'xunsheng-progress-v1'),JSON.stringify(legacyProgress));
      setMeta(uid,{revision,pending:false,syncedLocalRevision:save?.revision||0});
    }
    return {storageKey,randomAccount:()=>'xx_'+random().slice(0,10),register,login,restore,profile,logout,migrateLegacy,remember,forget,meta,setMeta,localSave,install,request,leaderboard:mode=>request('leaderboard?mode='+mode),save:(save,baseRevision)=>request('save',{method:'PUT',data:{save,baseRevision}}),token:()=>token};
  }
  return {create,sessionKey,migrationKey,saveKeys};
})();
if(typeof module!=='undefined')module.exports=globalThis.AccountStore;
