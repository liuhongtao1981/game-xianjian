/* Stable chapter identities are independent of art, encounters and guardian strategies. */
const ChapterCatalog=(()=>{
  const names=[['贬谪禅庭','血诏陈府','洪江夜渡'],['断契碑谷','残籍驿道','沉鳞龙渊'],['焚愿禅院','黑风密林','愿骨石窟'],['血契高庄','福陵喜堂','黄风沙海'],['流沙沉名渡','白骨荒冢','宝象失影城'],['平顶双炉谷','莲花倒名洞','乌鸡镜井宫'],['号山焚誓林','火云借命炉','黑水逆契府'],['车迟祭雷坛','通天冰封渡','金兜夺器洞'],['照命河','毒敌回声穴','解阳双生泉'],['火焰烬界关','祭赛血珠塔','碧波九首渊'],['荆棘缚字林','小雷音倒佛堂','盘丝缠愿坊'],['狮驼万骨关','六牙镇账殿','比丘寿账城'],['无底坠名窟','灭法断冠城','凤仙无雨门'],['玉华折兵原','灵山无主账殿','天外归名石庭']];
  const guardians=[['缄口监院','血诏司命','沉灯河伯'],['压山石魁','无籍追猎将','封喉白蛟'],['阴愿主使','披愿黑熊','焚愿老衲'],['人券庄主','吞愿耙魇','黄风听骨王'],['吞籍沙将','三相骨娘','夺影黄袍使'],['金符童子','银诏炉主','井底伪王'],['焚誓童君','三火监炉使','黑契鼍王'],['雷诏虎师','冻愿灵感王','缚兵青兕君'],['照命女相','钩魂蝎后','借阳真君'],['焚界牛君','假愿塔僧','九首账蛟'],['字狱木仙','黄眉司契','七弦蛛母'],['吞城青狮','六牙镇账象','寿契白鹿君'],['摄名地涌姬','无首断冠王','封雨玉衡使'],['九灵归账祖','无主功德相','执契天衡']];
  const ids=['exile','birth','river','mountain','outpost','dragon','wish','windwood','bonewish','contract','wedding','yellowwind','sunken','whitebone','shadowcity'];
  const all=names.flatMap((row,realm)=>row.map((name,local)=>({id:ids[realm*3+local]||'realm-'+realm+'-'+local,index:realm*3+local,realm,local,name,boss:guardians[realm][local],released:realm<5,width:realm?7200:6400,height:realm?5200:4600,wave:[12,14,16,16,18,20,22,24,26,28,30,32,34,36,38][realm*3+local]||20,art:ids[realm*3+local],strategy:['bell','edict','tide','stone','hunt','dragon','purify','pounce','echo','counterstamp','rake','shelter','tidesteps','trueheart','returnshadow'][realm*3+local]})));
  const get=index=>all[index],released=()=>all.filter(c=>c.released),indexOf=id=>all.findIndex(c=>c.id===id);
  function reward(index){const c=get(index),t=c.realm+1,n=Math.max(3,2*t),part=(total)=>Math.floor(total/3)+(c.local<total%3?1:0);return {core:'core'+Math.min(13,t),count:part(n),essence:part(8*t),qi:Math.round(320*t*t*[.25,.35,.4][c.local])};}
  return {all,get,released,indexOf,reward,count:42,playable:15};
})();
