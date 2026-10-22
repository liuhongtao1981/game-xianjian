/* Shared account rules and stable rankings; power never depends on current wounds. */
globalThis.AccountModel=(()=>{
  const realms=['筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫','真仙','玄仙','金仙','太乙金仙','大罗金仙','仙王'];
  const length=s=>Array.from(s).length;
  const normalizeAccount=value=>String(value??'').normalize('NFKC').trim().toLowerCase();
  function accountError(value){const account=normalizeAccount(value);return length(account)<3?'账号至少需要3位':length(account)>24?'账号最多24位':!/^[-_\p{L}\p{N}]+$/u.test(account)?'账号可使用中文、字母、数字、下划线和短横线':'';}
  function passwordError(value){const s=String(value??'');return length(s)<3?'密码至少需要3位':length(s)>128?'密码最多128位':'';}
  function nameError(value){const s=String(value??'').trim();return !s?'请设置修仙名称':length(s)>20?'修仙名称最多20位':/[\u0000-\u001f\u007f]/.test(s)?'名称不能包含控制字符':'';}
  const bounded=(n,low,high,fallback)=>Number.isFinite(n)?Math.max(low,Math.min(high,n)):fallback;
  function power(p){
    if(!p)return 0;
    const realm=bounded(p.cultivation?.realm,0,13,0),layer=bounded(p.cultivation?.layer,1,9,1);
    const survival=(bounded(p.maxHp,1,1e7,120)+bounded(p.shieldMax,0,1e7,70)*.8)*(1+bounded(p.armor,0,.95,0)) + bounded(p.regen,0,10000,0)*25;
    const levels=Object.values(p.spells||{}).reduce((sum,n)=>sum+bounded(n,0,44,0),0);
    const offense=bounded(p.dmg,.01,1e7,1)*(1+bounded(p.crit,0,1,0)*.75)/bounded(p.cdr,.2,2,1)*(80+levels*14);
    return Math.round(Math.min(1e12,(survival+offense+bounded(p.speed,0,600,238)*.25)*(1+realm*.12+(layer-1)*.012)));
  }
  function summary(player){return {realm:Math.floor(bounded(player?.cultivation?.realm,0,13,0)),layer:Math.floor(bounded(player?.cultivation?.layer,1,9,1)),level:Math.floor(bounded(player?.level,1,1e7,1)),power:power(player)};}
  function compare(mode='realm'){return (a,b)=>(mode==='power'?b.power-a.power||b.realm-a.realm||b.layer-a.layer:b.realm-a.realm||b.layer-a.layer||b.power-a.power)||String(a.account).localeCompare(String(b.account),'en');}
  function ranking(rows,mode='realm'){return rows.slice().sort(compare(mode)).map((row,index)=>({...row,rank:index+1}));}
  const realmLabel=row=>realms[row.realm]+'·'+['一','二','三','四','五','六','七','八','九'][row.layer-1]+'层';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return {realms,normalizeAccount,accountError,passwordError,nameError,power,summary,compare,ranking,realmLabel,escape};
})();
if(typeof module!=='undefined')module.exports=globalThis.AccountModel;
