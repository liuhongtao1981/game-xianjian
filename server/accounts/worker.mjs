/* The release builder prepends the shared AccountModel. All writes require a session. */
const model=globalThis.AccountModel,iterations=100000,sessionDuration=7*24*60*60*1000;
const hex=bytes=>Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const hash=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))));
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations},key,256)));}
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const userView=u=>({id:u.id,account:u.account,name:u.display_name,credentialVersion:u.credential_version});
function savedView(user){const value=user.save_json?JSON.parse(user.save_json):null;return {save:value?.legacyProgress?null:value,legacyProgress:value?.legacyProgress||null,revision:user.cloud_revision};}
function validProgress(p){return p?.version===1&&Number.isInteger(p.cleared)&&p.cleared>=0&&p.cleared<=42&&p.entries&&typeof p.entries==='object'&&!Array.isArray(p.entries)&&Object.entries(p.entries).every(([key,e])=>Number.isInteger(Number(key))&&Number(key)>=1&&Number(key)<=41&&e?.build?.cultivation&&Number.isInteger(e.build.cultivation.realm)&&e.build.cultivation.realm>=0&&e.build.cultivation.realm<=13&&Number.isInteger(e.build.cultivation.layer)&&e.build.cultivation.layer>=1&&e.build.cultivation.layer<=9);}
function validSave(s){
  const p=s?.run?.player,c=p?.cultivation,allowed=['yujian','wanjian','wulei','sanmei','bingxin','gudu','jiushen','guanyin'];
  return s?.version===3&&Number.isSafeInteger(s.revision)&&s.revision>=0&&s.progress?.version===1&&Number.isInteger(s.progress.cleared)&&s.progress.cleared>=0&&s.progress.cleared<=42&&Number.isInteger(s.run.stage)&&s.run.stage>=0&&s.run.stage<42&&['story','normal','hard','nightmare'].includes(s.run.difficulty)&&p&&Number.isInteger(p.level)&&p.level>=1&&p.level<=1e7&&Number.isInteger(c?.realm)&&c.realm>=0&&c.realm<=13&&Number.isInteger(c.layer)&&c.layer>=1&&c.layer<=9&&['maxHp','hp','shieldMax','speed','dmg','cdr','crit','armor','regen'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1e7)&&p.maxHp>=1&&p.hp<=p.maxHp&&p.dmg>0&&p.cdr>0&&p.spells&&Object.entries(p.spells).every(([k,l])=>allowed.includes(k)&&Number.isInteger(l)&&l>=1&&l<=Math.max(18,5+c.realm*3));
}
async function body(request){
  if(!request.headers.get('content-type')?.includes('application/json'))throw fail('请求格式应为 JSON',415);
  const reader=request.body?.getReader();if(!reader)return {};const chunks=[];let bytes=0;
  for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1600000){await reader.cancel();throw fail('存档超过大小限制',413);}chunks.push(value);}
  const all=new Uint8Array(bytes);let cursor=0;for(const chunk of chunks){all.set(chunk,cursor);cursor+=chunk.length;}try{const value=JSON.parse(new TextDecoder().decode(all));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw fail('请求内容无法读取');}
}
async function rate(env,request,kind,account='',limit=30,period=600000){
  const now=Date.now(),ip=request.headers.get('CF-Connecting-IP')||'local',bucket=await hash(kind+':'+ip+':'+account+':'+Math.floor(now/period));
  const row=await env.DB.prepare('INSERT INTO rate_limits(bucket, attempts, expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(bucket,now+period).first();
  if(row.attempts>limit)throw fail('尝试次数较多，请稍后再试',429);
  if(Math.random()<.02)await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
}
async function authenticated(env,request){
  const token=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!token)throw fail('请先登录',401);
  const tokenHash=await hash(token),user=await env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(tokenHash,Date.now()).first();if(!user)throw fail('登录已过期，请重新登录',401);return {user,tokenHash};
}
async function verify(user,password){
  const computed=await passwordHash(String(password??''),user.password_salt);let different=0;for(let i=0;i<computed.length;i++)different|=computed.charCodeAt(i)^user.password_hash.charCodeAt(i);if(different)throw fail('账号或密码不正确',401);
}
async function route(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/$/,'')||'/',method=request.method;
  if(path==='/health'){await env.DB.prepare('SELECT id FROM users LIMIT 1').first();return {ok:true,service:'xunsheng-accounts',version:1};}
  if(path==='/api/register'&&method==='POST'){
    const input=await body(request),account=model.normalizeAccount(input.account),name=String(input.name||account).trim(),error=model.accountError(account)||model.passwordError(input.password)||model.nameError(name);if(error)throw fail(error);
    await rate(env,request,'register','',20,3600000);const salt=random(),encoded=await passwordHash(String(input.password),salt),id=random(),now=Date.now();
    try{await env.DB.prepare('INSERT INTO users(id,account,display_name,password_salt,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,account,name,salt,encoded,now,now).run();}catch(error){if(String(error).includes('UNIQUE'))throw fail('该账号已注册，请登录或更换账号',409);throw error;}
    return {user:{id,account,name,credentialVersion:1}};
  }
  if(path==='/api/legacy'&&method==='POST'){
    const input=await body(request);if(!/^[a-f0-9]{64}$/.test(input.migrationId)||!/^[a-f0-9]{64}$/.test(input.migrationSecret)||!(validSave(input.save)||validProgress(input.progress)))throw fail('原有存档无法迁移，请保留本地备份');
    const secretHash=await hash(input.migrationSecret),existing=await env.DB.prepare('SELECT * FROM users WHERE migration_id=?').bind(input.migrationId).first();if(existing){if(existing.migration_secret_hash!==secretHash)throw fail('迁移凭据不匹配',403);return {user:userView(existing)};}
    await rate(env,request,'legacy','',10,3600000);const id=random(),account='legacy_'+input.migrationId.slice(0,16),salt=random(),encoded=await passwordHash('aaa',salt),now=Date.now(),stats=model.summary(input.save?.run.player||input.progress?.entries?.[Math.min(41,input.progress.cleared)]?.build);
    try{await env.DB.prepare('INSERT INTO users(id,account,display_name,password_salt,password_hash,created_at,updated_at,realm,layer,combat_level,power,save_json,cloud_revision,migration_id,migration_secret_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)').bind(id,account,'原有剑仙',salt,encoded,now,now,stats.realm,stats.layer,stats.level,stats.power,JSON.stringify(input.save||{legacyProgress:input.progress}),input.migrationId,secretHash).run();}catch(error){if(String(error).includes('UNIQUE')){const other=await env.DB.prepare('SELECT * FROM users WHERE migration_id=? AND migration_secret_hash=?').bind(input.migrationId,secretHash).first();if(other)return {user:userView(other)};}throw error;}
    return {user:{id,account,name:'原有剑仙',credentialVersion:1}};
  }
  if(path==='/api/login'&&method==='POST'){
    const input=await body(request),account=model.normalizeAccount(input.account),error=model.accountError(account)||model.passwordError(input.password);if(error)throw fail(error);
    await rate(env,request,'login-ip','',60);await rate(env,request,'login-account',account,15);
    const user=await env.DB.prepare('SELECT * FROM users WHERE account=?').bind(account).first();if(!user){await passwordHash(String(input.password),'missing-account-timing-salt');throw fail('账号或密码不正确',401);}await verify(user,input.password);
    const token=random(),tokenHash=await hash(token);await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(tokenHash,user.id,Date.now()+sessionDuration)]);
    return {token,user:userView(user),...savedView(user)};
  }
  if(path==='/api/leaderboard'&&method==='GET'){
    const mode=url.searchParams.get('mode')==='power'?'power':'realm',order=mode==='power'?'power DESC, realm DESC, layer DESC, account ASC':'realm DESC, layer DESC, power DESC, account ASC';
    const rows=await env.DB.prepare('SELECT id,account,display_name AS name,realm,layer,combat_level AS level,power,updated_at AS updatedAt FROM users ORDER BY '+order+' LIMIT 100').all();const total=await env.DB.prepare('SELECT COUNT(*) AS total FROM users').first();
    let mine=null;if(request.headers.get('Authorization'))try{const {user}=await authenticated(env,request);const ahead=mode==='power'?'power>? OR (power=? AND realm>?) OR (power=? AND realm=? AND layer>?) OR (power=? AND realm=? AND layer=? AND account<?)':'realm>? OR (realm=? AND layer>?) OR (realm=? AND layer=? AND power>?) OR (realm=? AND layer=? AND power=? AND account<?)';const values=mode==='power'?[user.power,user.power,user.realm,user.power,user.realm,user.layer,user.power,user.realm,user.layer,user.account]:[user.realm,user.realm,user.layer,user.realm,user.layer,user.power,user.realm,user.layer,user.power,user.account];const place=await env.DB.prepare('SELECT COUNT(*)+1 AS rank FROM users WHERE '+ahead).bind(...values).first();mine={rank:place.rank,...model.summary({cultivation:{realm:user.realm,layer:user.layer},level:user.combat_level}),power:user.power};}catch(error){if(error.status!==401)throw error;}
    return {rows:rows.results.map((r,i)=>({...r,rank:i+1})),total:total.total,mine,mode,updatedAt:Date.now()};
  }
  const {user,tokenHash}=await authenticated(env,request);
  if(path==='/api/me'&&method==='GET')return {user:userView(user),...savedView(user)};
  if(path==='/api/logout'&&method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash).run();return {ok:true};}
  if(path==='/api/profile'&&method==='POST'){
    const input=await body(request),name=String(input.name??user.display_name).trim();if(model.nameError(name))throw fail(model.nameError(name));let salt=user.password_salt,encoded=user.password_hash;
    if(input.password){if(model.passwordError(input.password))throw fail(model.passwordError(input.password));await rate(env,request,'password',user.id,15);await verify(user,input.currentPassword);salt=random();encoded=await passwordHash(String(input.password),salt);}
    const nextVersion=user.credential_version+(input.password?1:0),statements=[env.DB.prepare('UPDATE users SET display_name=?,password_salt=?,password_hash=?,credential_version=?,updated_at=? WHERE id=? AND credential_version=?').bind(name,salt,encoded,nextVersion,Date.now(),user.id,user.credential_version)];
    if(input.password)statements.push(env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(user.id,tokenHash));const result=await env.DB.batch(statements);if(!result[0].meta.changes)throw fail('账号刚刚在另一处更新，请重试',409);return {user:{...userView(user),name,credentialVersion:nextVersion}};
  }
  if(path==='/api/save'&&method==='PUT'){
    const input=await body(request);if(!Number.isSafeInteger(input.baseRevision)||input.baseRevision<0||!validSave(input.save))throw fail('存档校验未通过，本地进度已保留');
    const s=model.summary(input.save.run.player),saved=await env.DB.prepare('UPDATE users SET save_json=?,cloud_revision=cloud_revision+1,realm=?,layer=?,combat_level=?,power=?,updated_at=? WHERE id=? AND cloud_revision=?').bind(JSON.stringify(input.save),s.realm,s.layer,s.level,s.power,Date.now(),user.id,input.baseRevision).run();if(!saved.meta.changes)throw fail('云端已有更新的历程，请载入最新进度',409);return {revision:input.baseRevision+1};
  }
  if(path==='/api/account'&&method==='DELETE'){
    const input=await body(request);await verify(user,input.password);await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),env.DB.prepare('DELETE FROM users WHERE id=?').bind(user.id)]);return {ok:true};
  }
  throw fail('接口不存在',404);
}
export {validSave};
export default {async fetch(request,env){
  const origin=request.headers.get('Origin'),allowed=!origin||origin==='https://liuhongtao1981.github.io'||origin===new URL(request.url).origin||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
  if(origin&&allowed)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'});
  if(!allowed)return new Response(JSON.stringify({error:'此来源尚未授权'}),{status:403,headers});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(new URL(request.url).pathname==='/'&&request.method==='GET')return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>寻圣 · 仙籍服务</title><body style="background:#091d20;color:#e6d4a9;font:20px serif;padding:10vh 8vw"><h1>寻圣 · 仙籍服务</h1><p>账号、云端历程与全服修仙榜。</p><a style="color:#b6e4d5" href="https://liuhongtao1981.github.io/game-xianjian/">进入寻圣游戏 →</a></body></html>',{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
  try{return new Response(JSON.stringify(await route(request,env)),{headers});}catch(error){return new Response(JSON.stringify({error:error.status?error.message:'服务暂时繁忙，请稍后重试'}),{status:error.status||500,headers});}
}};
