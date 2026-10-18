/* =========================================================
   重走西游 · 寻圣 — 剑仙孙小果，前三难篇章
   控制主角 → 杀妖 → 拾灵升级 → 三选一提卡 → 开宝箱得装备/术法
   ========================================================= */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;

function resize(){
  const oldW = W, oldH = H;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (oldW && oldH && typeof P!=='undefined' && P) World.camera(0,true);
}
window.addEventListener('resize', resize);
resize();

/* 卡通精灵（透明 SVG，加载失败时自动回退到字符圆盘） */
const IMG = {};
['hero','imp','fox','snake','zombie','boss','chest'].forEach(k => {
  const im = new Image();
  im.src = 'assets/' + k + '.svg';
  IMG[k] = im;
});
const BG = new Image();
BG.src = 'assets/arena-realistic.png';
BG.onerror = () => { BG.onerror = null; BG.src = 'assets/bg.svg'; };
const ATLAS = new Image();
ATLAS.src = 'assets/characters-realistic.png';
const SPRITE_CELL = { hero:[0,0], boss:[1,0], imp:[2,0], fox:[0,1], snake:[1,1], zombie:[2,1] };
function drawSprite(key, x, y, size){
  if (ATLAS.complete && ATLAS.naturalWidth && SPRITE_CELL[key]){
    const [col,row] = SPRITE_CELL[key], cw = ATLAS.naturalWidth / 3, ch = ATLAS.naturalHeight / 2;
    ctx.drawImage(ATLAS,col*cw,row*ch,cw,ch,x,y,size,size);
  } else ctx.drawImage(IMG[key],x,y,size,size);
}
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;

/* ---------------- 术法 ---------------- */

const SPELLS = {
  yujian: {
    name:'御剑术', glyph:'御', color:'#8fd8ef', cd:0.82, max:5,
    desc: l => '向最近妖物掷出飞剑，伤害 ' + Math.round(18 + l * 8) + '。',
    cast(l){
      const t = nearest(P.x, P.y, 900);
      if(!t)return;
      Motion.cast('yujian',t);
      const base = t ? Math.atan2(t.y - P.y, t.x - P.x) : rand(0, TAU);
      const count = 1 + Math.floor(l / 3);
      for (let i = 0; i < count; i++){
        const a = base + (i - (count - 1) / 2) * 0.16;
        G.shots.push({ x:P.x, y:P.y, vx:Math.cos(a) * 660, vy:Math.sin(a) * 660,
          r:6, dmg:18 + l * 8, life:1.1, color:'#8fd8ef', hit:new Set(), pierce:0, trail:[] });
      }
    }
  },
  wulei: {
    name:'五雷咒', glyph:'雷', color:'#dcc44e', cd:2.8, max:5,
    desc: l => '雷光在 ' + (1 + Math.floor((l + 1) / 2)) + ' 个妖物间跳跃，伤害 ' + Math.round(20 + l * 10) + '。',
    cast(l){
      const targets = 1 + Math.floor((l + 1) / 2);
      Motion.cast('wulei',nearest(P.x,P.y,460));
      let from = { x:P.x, y:P.y };
      const hit = new Set();
      for (let i = 0; i < targets; i++){
        const t = nearest(from.x, from.y, 460, hit);
        if (!t) break;
        hit.add(t.id);
        if(i>0)bolt(from.x, from.y, t.x, t.y, '#bba3ff');
        Motion.emit('thunder',t.x,t.y,{duration:.42,color:'#bca4ff'});
        hurt(t, 20 + l * 10, '#bba3ff');
        from = t;
      }
    }
  },
  sanmei: {
    name:'三昧真火', glyph:'火', color:'#e0704f', cd:3.6, max:5,
    desc: l => '周身燃起业火，范围 ' + (95 + l * 8) + '，伤害 ' + Math.round(22 + l * 11) + '。',
    cast(l){
      const r = 95 + l * 8;
      Motion.cast('sanmei');
      Motion.emit('fire',P.x,P.y,{r,duration:.85,color:'#ff8f4d'});
      for (const e of G.enemies){
        if (e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < r + e.r) hurt(e, 22 + l * 11, '#e0704f');
      }
      for (let i = 0; i < 18; i++){
        const a = rand(0, TAU);
        G.parts.push({ x:P.x + Math.cos(a) * rand(10, r), y:P.y + Math.sin(a) * rand(10, r),
          vx:Math.cos(a) * 40, vy:Math.sin(a) * 40 - 30, life:rand(.3,.6), color:'#e0704f', size:rand(2,4) });
      }
    }
  },
  wanjian: {
    name:'万剑诀', glyph:'剑', color:'#cfe7f2', cd:0.01, max:5,
    desc: l => (1 + l) + ' 柄飞剑绕身旋转，触敌伤害 ' + Math.round(10 + l * 6) + '。',
    cast(){}
  },
  bingxin: {
    name:'冰心诀', glyph:'冰', color:'#6fb6e8', cd:6.0, max:5,
    desc: l => '凝结护盾 ' + (18 + l * 12) + ' 点，持续抵挡伤害。',
    cast(l){ P.shield = Math.min(P.shieldMax, P.shield + 18 + l * 12); Motion.cast('bingxin');Motion.emit('ice',P.x,P.y,{r:50,duration:.8,color:'#83ddff'}); }
  },
  gudu: {
    name:'蛊毒', glyph:'蛊', color:'#7fbfa8', cd:3.4, max:5,
    desc: l => '在妖物脚下布下毒瘴，每秒 ' + Math.round(9 + l * 5) + ' 伤害，持续 4 秒。',
    cast(l){
      const t = nearest(P.x, P.y, 620);
      const x = t ? t.x : P.x + rand(-90, 90);
      const y = t ? t.y : P.y + rand(-90, 90);
      G.pools.push({ x, y, r: 74, life: 4, dps: 9 + l * 5, tick: 0, color:'#7fbfa8' });
      Motion.cast('gudu',t);
    }
  },
  jiushen: {
    name:'酒神咒', glyph:'酒', color:'#e8a04a', cd:5.2, max:5,
    desc: l => '酒气炸裂，范围 110，伤害 ' + Math.round(38 + l * 18) + '。',
    cast(l){
      const t = nearest(P.x, P.y, 560);
      const x = t ? t.x : P.x, y = t ? t.y : P.y;
      Motion.cast('jiushen',t);
      Motion.emit('blast',x,y,{r:110,duration:.8,color:'#ffb662'});
      for (const e of G.enemies){
        if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) < 110 + e.r) hurt(e, 38 + l * 18, '#e8a04a');
      }
      for (let i = 0; i < 16; i++){
        const a = rand(0, TAU);
        G.parts.push({ x, y, vx:Math.cos(a) * rand(60, 200), vy:Math.sin(a) * rand(60, 200),
          life:rand(.3,.7), color:'#e8a04a', size:rand(2,4) });
      }
    }
  },
  guanyin: {
    name:'观音咒', glyph:'愈', color:'#9fe3b8', cd:5.5, max:5,
    desc: l => '回复 ' + Math.round(8 + l * 6) + ' 点生命。',
    cast(l){
      heal(8 + l * 6);
      Motion.cast('guanyin');Motion.emit('heal',P.x,P.y,{r:58,duration:1,color:'#a4ffce'});
    }
  }
};

SpellCombat.install(SPELLS);
Motion.bindSpells?.(SPELLS);

/* ---------------- 强化卡 ---------------- */

const STATS = [
  { id:'atk', name:'剑意', glyph:'锋', color:'#e0a0a0', tag:'强化', desc:'所有伤害 +15%。', apply(){ P.dmg *= 1.15; } },
  { id:'spd', name:'疾行', glyph:'行', color:'#9fd8ef', tag:'强化', desc:'移动速度 +8%。', apply(){ P.speed *= 1.08; } },
  { id:'hp',  name:'铁骨', glyph:'骨', color:'#d9b877', tag:'强化', desc:'最大生命 +20，并回复 20。', apply(){ P.maxHp += 20; heal(20); } },
  { id:'cd',  name:'凝神', glyph:'凝', color:'#b8a0e0', tag:'强化', desc:'术法冷却 -8%。', apply(){ P.cdr = Math.max(Cultivation.caps().cdr, P.cdr * 0.92); } },
  { id:'crit',name:'会心', glyph:'心', color:'#f2dda8', tag:'强化', desc:'暴击率 +6%。', apply(){ P.crit = Math.min(Cultivation.caps().crit, P.crit + 0.06); } },
  { id:'pick',name:'聚灵', glyph:'灵', color:'#7fbfa8', tag:'强化', desc:'拾取范围 +30%。', apply(){ P.pickup *= 1.3; } }
];

/* ---------------- 装备 ---------------- */

const EQUIPS = [
  { id:'mujian', name:'木剑', glyph:'剑', color:'#d9b877', desc:'伤害 +20%。', apply(){ P.dmg *= 1.2; } },
  { id:'jifeng', name:'疾风靴', glyph:'风', color:'#9fd8ef', desc:'移动速度 +10%。', apply(){ P.speed *= 1.1; } },
  { id:'jiuhu', name:'酒葫芦', glyph:'酒', color:'#e8a04a', desc:'最大生命 +30，并回复 30。', apply(){ P.maxHp += 30; heal(30); } },
  { id:'wudu', name:'五毒珠', glyph:'毒', color:'#7fbfa8', desc:'攻击附带持续毒伤。', apply(){ P.poison = true; } },
  { id:'nvwa', name:'女娲血玉', glyph:'血', color:'#e0704f', desc:'每秒回复 3 点护盾。', apply(){ P.regen = 3; } },
  { id:'tiangang', name:'天罡战气', glyph:'罡', color:'#f2dda8', desc:'暴击率 +10%，伤害 +10%。', apply(){ P.crit += .1; P.dmg *= 1.1; } },
  { id:'juling', name:'聚灵珠', glyph:'珠', color:'#7fbfa8', desc:'拾取范围 +40%，灵气收益 +15%。', apply(){ P.pickup *= 1.4; P.xpMul *= 1.15; } },
  { id:'huxin', name:'护心镜', glyph:'护', color:'#b8a0e0', desc:'受到伤害 -15%。', apply(){ P.armor = Math.min(Cultivation.caps().armor, P.armor + 0.15); } }
];

/* ---------------- 敌人 ---------------- */

const ENEMY_TYPES = {
  imp:    { name:'小妖', glyph:'妖', color:'#7fbfa8', r:14, hp:26, speed:78, dmg:6, xp:5 },
  fox:    { name:'狐妖', glyph:'狐', color:'#e0704f', r:13, hp:22, speed:132, dmg:5, xp:6 },
  snake:  { name:'蛇妖', glyph:'蛇', color:'#6fb6e8', r:16, hp:34, speed:64, dmg:7, xp:8, ranged:true },
  zombie: { name:'僵尸', glyph:'尸', color:'#c09058', r:20, hp:80, speed:46, dmg:11, xp:13 }
};

/* ---------------- 状态 ---------------- */

const G = {
  state:'start', time:0, kills:0, shake:0, queue:0,
  P:null, enemies:[], shots:[], eshots:[], orbs:[], parts:[], texts:[],
  chests:[], pools:[], auras:[], bolts:[], heals:[],
  spawn:0, eliteT:45, chestT:60, boss:null, bossSpawned:false,
  uid:1, telegraphs:[], ultimate:null, ultimateCasts:0,pickups:[],chestReward:null,runChoices:0,pendingLore:null,coreReward:null
};

const keys = {};
const joy = { active:false, id:null, ox:0, oy:0, dx:0, dy:0 };
let P = null;
let choicesCache = [];

const QS = new URLSearchParams(location.search);
const GOD = QS.has('god');
const AUTOPICK = QS.has('autopick') || GOD;
const BOT = QS.has('bot');
const DEMO = QS.has('demo');
let botMode = BOT || QS.has('bench');
if (QS.has('noanim')) document.body.classList.add('noanim');

function newPlayer(){
  return {
    ...World.spawn(),vx:0,vy:0,r:15, hp:120, maxHp:120, shield:0, shieldMax:70,
    speed:238, dmg:1, cdr:1, crit:0.05, pickup:118, xpMul:1, armor:0, regen:0, poison:false,
    level:1, xp:0, xpNext:10,growthChoices:0,
    heroId:HeroIdentity.clean(Journey.run.heroId),spells:{ yujian:1 }, t:{ yujian:0.5 },
    orbitAngle:0, orbitHit:new Map(),
    dash:0, dashCd:0, invuln:0, facing:{ x:1, y:0 }, flash:0,
    equips:[], energy:100, ultCd:0, animTime:0,moving:false,attack:0,attackLength:.32,look:1,cultivation:Cultivation.fresh()
  };
}

function reset(){
  document.body.classList.remove('on-title');
  document.getElementById('overlay').classList.add('hidden');
  G.state='playing'; G.time=0; G.kills=0; G.shake=0; G.queue=0;
  G.enemies=[]; G.shots=[]; G.eshots=[]; G.orbs=[]; G.parts=[]; G.texts=[];
  G.chests=[]; G.spellPulses=[];G.pools=[]; G.auras=[]; G.bolts=[]; G.heals=[];
  G.telegraphs=[]; G.ultimate=null; G.ultimateCasts=0;
  G.pickups=[];G.chestReward=null;G.runChoices=0;
  G.pendingLore=null;G.coreReward=null;
  Motion.reset();
  Sound.reset();
  clearInput();
  G.spawn=0; G.eliteT=42; G.chestT=58; G.boss=null; G.bossSpawned=false; G.uid=1;
  G.P = newPlayer();
  P = G.P;
  Journey.restore(P);
  SpellGift.ensure();SpellGift.sync();
  G.runChoices=P.growthChoices;
  World.reset();
  EncounterDirector.reset();
  document.getElementById("overlay").classList.remove("journey-screen","title-screen");
  if (GOD){ P.maxHp = 99999; P.hp = 99999; }
  if (DEMO) P.armor = 1;
  renderSpells(); renderEquips(); syncHUD();
}

/* ---------------- 工具 ---------------- */

function nearest(x, y, maxD, exclude){
  let best = null, bd = maxD * maxD;
  for (const e of G.enemies){
    if (e.hp <= 0) continue;
    if(e.boss && Bosses.damageMultiplier(e)===0)continue;
    if (exclude && exclude.has(e.id)) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bd){ bd = d; best = e; }
  }
  return best;
}

function addText(x, y, txt, color, size){
  G.texts.push({ x, y, txt, color, size: size || 13, life: .8 });
}
function notifyPickup(kind,text,amount=0){
  if(kind==='xp'){
    const previous=G.pickups.findLast(n=>n.kind==='xp'&&G.time-n.updated<=.4);
    if(previous){previous.amount+=amount;previous.updated=G.time;previous.life=2.5;return;}
  }
  if(G.pickups.length>=3){const index=G.pickups.findIndex(n=>n.kind==='xp');G.pickups.splice(index>=0?index:G.pickups.length-1,1);}
  const entry={kind,text,amount,updated:G.time,life:2.5};
  if(['chest','rest','lore'].includes(kind))G.pickups.unshift(entry);else G.pickups.push(entry);
}
function updatePickupNotices(dt){
  if(!G.pickups.length)return;G.pickups[0].life-=dt;if(G.pickups[0].life<=0)G.pickups.shift();
}

function burst(x, y, color, n, sp){
  n=Math.max(0,Math.min(n,(W<650?180:420)-G.parts.length));
  for (let i = 0; i < n; i++){
    const a = rand(0, TAU), v = rand(sp * .3, sp);
    G.parts.push({ x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, life:rand(.25,.6), color, size:rand(1.5,3.5) });
  }
}

function bolt(x1, y1, x2, y2, color){
  const pts = [{ x:x1, y:y1 }];
  const seg = 4;
  for (let i = 1; i < seg; i++){
    const t = i / seg;
    pts.push({ x:x1 + (x2-x1)*t + rand(-16,16), y:y1 + (y2-y1)*t + rand(-16,16) });
  }
  pts.push({ x:x2, y:y2 });
  G.bolts.push({ pts, life:.18, color });
}

function heal(n){
  P.hp = Math.min(P.maxHp, P.hp + n);
  addText(P.x, P.y - 26, '+' + Math.round(n), '#9fe3b8', 14);
}

function rgba(hex, a){
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

/* ---------------- 伤害 ---------------- */

function hurt(e, base, color, options={}){
  if (e.hp <= 0 || e.killed || G.state !== 'playing' || P.hp <= 0) return;
  const crit = Math.random() < P.crit;
  let d = base * P.dmg * (crit ? 2 : 1) * Journey.damageMultiplier(e);
  d = Math.max(2, Math.round(d));
  if(options.ultimate&&e.boss){
    const cast=options.ultimate,remaining=e.maxHp*.25-(cast.bossDamage||0);
    d=Math.min(d,remaining);if(d<=0)return;
  }
  d=Bosses.filterDamage(e,d);if(d<=0)return;
  if(options.ultimate&&e.boss)options.ultimate.bossDamage=(options.ultimate.bossDamage||0)+d;
  e.hp -= d;
  if (!G.ultimate&&!options.ultimate) P.energy = Math.min(100, P.energy + .2);
  e.flash = .12;
  Sound.effects('hit',Math.max(-1,Math.min(1,World.screen(e.x,e.y).x/Math.max(1,W)*2-1)));
  Motion.emit('hit',e.x,e.y-e.r,{duration:.24,color:color&&color.length===7?color:'#b9eeff'});
  addText(e.x + rand(-8,8), e.y - e.r - 6, (crit ? '暴 ' : '') + d, crit ? '#f2dda8' : (color || '#fff'), crit ? 17 : 13);
  if (Math.random() < .65) burst(e.x, e.y - e.r * .4, color || '#ffffff', 2, 90);
  if (crit) G.auras.push({ x:e.x, y:e.y, r:0, max:36, life:.26, color: color || '#f2dda8' });
  if (!e.boss){
    const a = Math.atan2(e.y - P.y, e.x - P.x);
    e.kx = Math.cos(a); e.ky = Math.sin(a); e.kb = 80;
  }
  if (P.poison) e.poison = Math.max(e.poison || 0, 3);
  if (e.hp <= 0) killEnemy(e,!!options.ultimate);
}

function killEnemy(e, fromUltimate=false){
  if (e.killed) return;
  e.killed = true;
  e.hp = 0;
  EncounterDirector.onEnemyKilled(e);
  if(e.eventObjective){burst(e.x,e.y,Journey.stage().color,12,100);Sound.effects('chest');return;}
  Bosses.onHelperKilled(e);
  const essence=P.cultivation.materials.essence;const rare=Cultivation.onKill(e);
  G.kills++;
  if (!G.ultimate&&!fromUltimate) P.energy = Math.min(100, P.energy + (e.elite ? 8 : 2));
  P.orbitHit.delete(e.id);
  burst(e.x, e.y, e.color, e.boss ? 60 : (e.elite ? 28 : 12), e.boss ? 280 : 160);
  const n = e.boss ? 10 : (e.elite ? 5 : 1);
  for (let i = 0; i < n; i++){
    G.orbs.push({ x:e.x + rand(-14,14), y:e.y + rand(-14,14), vx:rand(-60,60), vy:rand(-60,60),
      value: Math.max(0, e.xp / n), life: 20 });
  }
  if (e.elite&&rare) spawnChest(e.x, e.y);
  if (Math.random() < .035 || e.elite) G.heals.push({ x:e.x + rand(-10,10), y:e.y + rand(-10,10), life:20 });
  if(!e.boss&&!e.bossHelper&&(e.elite||essence!==P.cultivation.materials.essence))RunSave.save('拾取材料');
}

function hurtPlayer(dmg){
  if (P.invuln > 0 || G.state !== 'playing') return;
  dmg = Math.round(dmg * (1 - P.armor) * Journey.difficulty().damage);
  if (P.shield > 0){
    const a = Math.min(P.shield, dmg);
    P.shield -= a; dmg -= a;
  }
  if (dmg > 0){
    P.hp -= dmg;
    P.invuln = .7;
    P.flash = .18;
    G.shake = Math.min(10, 4 + dmg * .3);
    Sound.effects('hurt');
    addText(P.x, P.y - 26, '-' + dmg, '#ff9d86', 15);
  }
  if (P.hp <= 0){ P.hp = 0; die(); }
}

/* ---------------- 生成 ---------------- */

function edgePos(){
  const a=rand(0,TAU),radius=Math.min(650,Math.max(420,W*.55));
  const p={x:P.x+Math.cos(a)*radius,y:P.y+Math.sin(a)*radius,r:20};World.resolve(p);return p;
}

function spawnEnemy(typeKey, elite,point,options={}){
  const t = Encounters.unit(typeKey);
  const pos = point || edgePos();
  const mul = (options.tier||1) * Journey.stage().mobScale * Journey.difficulty().mobHp;
  const hp = Math.round(t.hp * mul * (elite ? 5 : 1));
  G.enemies.push({
    id:G.uid++, type:typeKey, name:t.name, family:Journey.run.stage, glyph:t.glyph, color:t.color,
    x:pos.x, y:pos.y, r:t.r * (elite ? 1.7 : 1), hp, maxHp:hp,
    speed:t.speed * Journey.difficulty().speed * (elite ? .85 : 1), dmg:Math.round(t.dmg * (elite ? 1.4 : 1)),
    xp:t.xp * (elite ? 4 : .35), elite:!!elite, boss:false,encounterId:options.encounterId,source:options.source,
    skillCd:rand(4,8),atkCd:rand(1,2.5), hitCd:0, flash:0, poison:0,animTime:rand(0,2),look:pos.x<P.x?1:-1
  });
  return G.enemies.at(-1);
}

function spawnWave(){
  const t = G.time;
  const pool = ['imp'];
  if (t > 20) pool.push('fox');
  if (t > 32) pool.push('snake');
  if (t > 50) pool.push('zombie');
  const n = Math.min(G.bossSpawned?3:6,1 + Math.floor(t / 30) + (Math.random() < .3 ? 1 : 0));
  for (let i = 0; i < n; i++) spawnEnemy(pick(pool));
}

function spawnElite(){
  const pool = G.time > 70 ? ['zombie','snake'] : ['imp','fox'];
  spawnEnemy(pick(pool), true);
}

function spawnChest(x, y){
  const point={x:x!==undefined?x:P.x+rand(-160,160),y:y!==undefined?y:P.y+rand(-160,160),r:12};
  World.resolve(point);G.chests.push({x:point.x,y:point.y,t:0});
}

function spawnBoss(){
  if (G.bossSpawned) return;
  G.bossSpawned = true;
  const s=Journey.stage(),hp=Math.round(s.bossHp*Journey.difficulty().bossHp);
  const b = {
    id:G.uid++, type:'boss', name:s.boss, glyph:s.bossGlyph, color:s.color,
    ...World.bossPoint(),r:48, hp, maxHp:hp, speed:s.bossSpeed, dmg:24, xp:60,
    elite:false, boss:true, atkCd:2.5, hitCd:0, flash:0, poison:0, summonCd:6, slamCd:4, phase:1
  };
  G.enemies.push(b);
  G.boss = b;
  Bosses.init(b);
  Sound.sync(G.state,Journey.run.stage,true);
  Sound.guardian(Journey.run.stage);
  addText(P.x, P.y-100, s.boss+' · 守劫', s.color, 28);
  G.shake = 12;
}

/* ---------------- 更新 ---------------- */

function update(dt){
  if (G.state !== 'playing' || dt <= 0) return;
  G.time += dt;
  RunSave.tick(dt);
  if(G.queue>0){showLevelUp(choicesCache.length?choicesCache:null);return;}
  updatePickupNotices(dt);
  G.shake = Math.max(0, G.shake - dt * 26);

  updatePlayer(dt);
  updateSpawning(dt);
  updateUltimate(dt);
  updateSpells(dt);
  Motion.update(dt);
  updateShots(dt);
  if (settleCombat()) return;
  updateEnemies(dt);
  if (G.state !== 'playing' || settleCombat()) return;
  updateTelegraphs(dt);
  if (G.state !== 'playing' || settleCombat()) return;
  updatePools(dt);
  if (settleCombat()) return;
  updateOrbs(dt);
  if (G.state !== 'playing') return;
  updateHeals(dt);
  updateChests(dt);
  updateFx(dt);
  World.camera(dt);
}
function settleCombat(){
  if (P.hp <= 0){ die(); return true; }
  if (G.bossSpawned && G.boss && G.boss.killed && G.boss.hp <= 0){ win(); return true; }
  return G.state !== 'playing';
}

function updatePlayer(dt){
  const oldX=P.x,oldY=P.y;
  let mx = 0, my = 0;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (joy.active){ mx = joy.dx; my = joy.dy; }

  if (botMode && G.state === 'playing'){
    if (G.boss || G.enemies.filter(e=>e.hp>0).length>=8) tryUltimate();
    let bd = Infinity, tx = 0, ty = 0;
    for (const o of G.orbs){
      const d = (o.x - P.x) ** 2 + (o.y - P.y) ** 2;
      if (d < bd){ bd = d; tx = o.x; ty = o.y; }
    }
    if (bd < Infinity){ mx = tx - P.x; my = ty - P.y; }
    else {
      const target=World.active()?World.bossPoint():{x:2810,y:1050};mx=target.x-P.x;my=target.y-P.y;
    }
    if(P.hp<P.maxHp*.7 && G.heals.length){
      const h=G.heals.reduce((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?a:b);
      mx=h.x-P.x;my=h.y-P.y;
    }
    const aim=Math.hypot(mx,my)||1;mx/=aim;my/=aim;
    let danger=false;
    for(const e of G.enemies){
      if(e.hp<=0)continue;
      const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,range=e.boss?200:110;
      if(d<range){const force=(1-d/range)*4;mx+=dx/d*force;my+=dy/d*force;if(d<e.r+65)danger=true;}
    }
    for(const t of G.telegraphs){
      const dx=P.x-t.x,dy=P.y-t.y,d=Math.hypot(dx,dy)||1;
      if(t.shape==='line'){
        const across=-dx*Math.sin(t.angle)+dy*Math.cos(t.angle),along=dx*Math.cos(t.angle)+dy*Math.sin(t.angle);
        if(Math.abs(across)<t.r+35&&Math.abs(along)<t.length+35){const sign=across<0?-1:1;mx-=Math.sin(t.angle)*sign*6;my+=Math.cos(t.angle)*sign*6;danger=true;}continue;
      }
      if(t.shape==='tide'){
        if(Math.abs(dy)<t.r+40&&Math.abs(P.x-t.gap)>t.safe/2-25){my+=(dy<0?-1:1)*8;danger=true;}continue;
      }
      if(d<t.r+40){mx+=(dx/d||1)*5;my+=dy/d*5;danger=true;}
    }
    for(const s of G.eshots){
      const dx=P.x-s.x,dy=P.y-s.y,d=Math.hypot(dx,dy)||1;
      if(d<75){mx+=dx/d*2;my+=dy/d*2;if(d<35)danger=true;}
    }
    const box=World.active()?World.arena():World.bounds();
    if(P.x<box.x+75)mx+=2;if(P.x>box.x+box.w-75)mx-=2;
    if(P.y<box.y+100)my+=2;if(P.y>box.y+box.h-100)my-=2;
    if(danger){const n=Math.hypot(mx,my)||1;P.facing={x:mx/n,y:my/n};tryDash();}
  }

  const len = Math.hypot(mx, my);
  if (len > 0.08){
    mx /= len; my /= len;
    P.facing.x = mx; P.facing.y = my;
  } else { mx = 0; my = 0; }

  P.dash = Math.max(0, P.dash - dt);
  P.dashCd = Math.max(0, P.dashCd - dt);
  P.invuln = Math.max(0, P.invuln - dt);
  P.flash = Math.max(0, P.flash - dt);
  P.energy = Math.min(100, P.energy + dt * 2 * Journey.difficulty().charge);
  P.ultCd = Math.max(0, P.ultCd - dt);

  if (P.dash > 0){
    P.vx=P.facing.x*980;P.vy=P.facing.y*980;
  } else {
    const commitment=P.attack>0?.78:1,accel=1-Math.exp(-dt*(len>.08?18:26));
    P.vx+=(mx*P.speed*commitment-P.vx)*accel;P.vy+=(my*P.speed*commitment-P.vy)*accel;
    if(len<=.08&&Math.hypot(P.vx,P.vy)<4){P.vx=0;P.vy=0;}
  }
  P.x+=P.vx*dt;P.y+=P.vy*dt;World.resolve(P);

  if (P.regen > 0) P.shield = Math.min(P.shieldMax, P.shield + P.regen * dt);
  Motion.step(P,dt,P.x-oldX,P.y-oldY);
  if(P.moving&&P.dash<=0)Sound.effects('step');
  if(P.dash>0)Motion.echo(P);
}

function tryDash(){
  if (G.state !== 'playing' || !P || P.dashCd > 0) return;
  P.dash = .14; P.dashCd = 2.1; P.invuln = Math.max(P.invuln, .32);
  Sound.effects('dash');
  for (let i = 0; i < 10; i++){
    G.parts.push({ x:P.x, y:P.y, vx:rand(-90,90), vy:rand(-90,90), life:rand(.2,.45), color:'#8fd8ef', size:rand(2,4) });
  }
}

function tryUltimate(){
  if (G.state !== 'playing' || !P || P.hp <= 0 || P.energy < 100 || P.ultCd > 0 || G.ultimate) return false;
  const spec=Journey.ultimate(),target=nearest(P.x,P.y,1800);
  P.energy=0; P.ultCd=spec.cd; P.invuln=Math.max(P.invuln,spec.invuln);
  G.ultimate={x:P.x,y:P.y,age:0,struck:false,kind:Journey.run.ultimate,bossDamage:0,pulses:0,angle:target?Math.atan2(target.y-P.y,target.x-P.x):Math.atan2(P.facing.y,P.facing.x)};
  G.ultimateCasts++;
  Sound.ultimate(Journey.run.ultimate);
  return true;
}
function updateUltimate(dt){
  const u=G.ultimate;
  if (!u) return;
  u.age+=dt;
  const spec=Journey.ultimates[u.kind];
  if(u.kind==='river'){
    while(u.pulses<3&&u.age>=spec.windup+u.pulses*.28){
      for(let i=0;i<6;i++){
        const a=u.angle+(i-2.5)*.065;
        G.shots.push({x:P.x,y:P.y-15,vx:Math.cos(a)*760,vy:Math.sin(a)*760,r:8,dmg:spec.damage(P.level),life:1.2,color:spec.color,hit:new Set(),pierce:2,trail:[],ultimate:u});
      }
      G.eshots=G.eshots.filter(s=>{const a=Math.atan2(s.y-P.y,s.x-P.x)-u.angle;return Math.cos(a)<.82||Math.hypot(s.x-P.x,s.y-P.y)>600;});
      Motion.emit('slash',P.x,P.y-18,{angle:u.angle,duration:.3,r:75,color:spec.color});u.pulses++;
      Sound.effects('ult-river');
    }
  }else if(u.age>=spec.windup&&!u.struck){
    u.struck=true; G.shake=REDUCED_MOTION?0:u.kind==='heaven'?12:4;
    Sound.effects(u.kind==='heaven'?'ult-impact':'guanyin');
    const range=u.kind==='lotus'?250:760;
    G.eshots=G.eshots.filter(s=>Math.hypot(s.x-u.x,s.y-u.y)>range);
    G.telegraphs=G.telegraphs.filter(s=>Math.hypot(s.x-u.x,s.y-u.y)>range);
    const targets=G.enemies.filter(e=>e.hp>0 && Math.hypot(e.x-u.x,e.y-u.y)<=range+e.r);
    for(const e of targets){Motion.emit('blast',e.x,e.y,{r:e.boss?80:40,duration:.65,color:spec.color});hurt(e,spec.damage(P.level),spec.color,{ultimate:u});}
    if(u.kind==='lotus'){
      heal(P.maxHp*.24);P.shield=Math.min(P.shieldMax,P.shield+40);
      G.pools.push({x:u.x,y:u.y,r:150,life:4,dps:25,tick:.5,color:spec.color,ultimate:u,ward:true});
      Motion.emit('heal',u.x,u.y,{r:130,duration:1.3,color:spec.color});
    }
    burst(u.x,u.y,spec.color,45,320);
  }
  if(u.age>spec.duration) G.ultimate=null;
}
function updateTelegraphs(dt){
  for(const t of G.telegraphs){
    t.life-=dt;
    if(t.life<=0 && !t.struck){
      t.struck=true;
      G.auras.push({x:t.x,y:t.y,r:0,max:t.r,life:.45,color:'#df956c'});
      burst(t.x,t.y,'#df956c',18,160);
      const dx=P.x-t.x,dy=P.y-t.y;
      let hit=Math.hypot(dx,dy)<t.r+P.r;
      if(t.shape==='line'){const along=dx*Math.cos(t.angle)+dy*Math.sin(t.angle),across=-dx*Math.sin(t.angle)+dy*Math.cos(t.angle);hit=Math.abs(along)<t.length+P.r&&Math.abs(across)<t.r+P.r;}
      if(t.shape==='tide')hit=P.x>(t.left??0)-P.r&&P.x<(t.right??World.bounds().w)+P.r&&Math.abs(dy)<t.r+P.r&&Math.abs(P.x-t.gap)>Math.max(0,t.safe/2-P.r);
      Encounters.impact(t);
      Bosses.onImpact(t,hit&&P.invuln<=0);
      if(hit)hurtPlayer(t.dmg);
    }
  }
  G.telegraphs=G.telegraphs.filter(t=>t.life>0);
}

function updateSpawning(dt){
  World.update(dt);
  EncounterDirector.update(dt);
}

function updateSpells(dt){
  for (const key in P.spells){
    if (key === 'wanjian') continue;
    const lvl = P.spells[key];
    P.t[key] = (P.t[key] || 0) - dt;
    if (P.t[key] <= 0){
      SPELLS[key].cast(lvl);
      P.t[key] = SPELLS[key].cd * P.cdr;
    }
  }
  SpellCombat.update(dt);
  if(P.spells.wanjian){P.orbitAngle+=(1.6+Math.min(5,P.spells.wanjian)*.18)*dt;for(const sword of SpellCombat.orbit(P))for(const e of G.enemies){if(e.hp<=0)continue;if(Math.hypot(e.x-sword.x,e.y-sword.y)<e.r+9&&G.time-(P.orbitHit.get(e.id)??-9)>.45){P.orbitHit.set(e.id,G.time);hurt(e,sword.damage,'#cfe7f2');}}}
}

function updateShots(dt){
  for (const s of G.shots){
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    s.trail.push({ x:s.x, y:s.y });
    if (s.trail.length > 9) s.trail.shift();
    for (const e of G.enemies){
      if (e.hp <= 0 || s.hit.has(e.id)||s.volleyHits?.has(e.id)) continue;
      if (Math.hypot(e.x - s.x, e.y - s.y) < e.r + s.r){
        s.hit.add(e.id);s.volleyHits?.add(e.id);
        hurt(e, s.dmg, s.color,{ultimate:s.ultimate});
        if (s.pierce-- <= 0){ s.life = 0; break; }
      }
    }
    if (s.x < -40 || s.x > World.bounds().w + 40 || s.y < -40 || s.y > World.bounds().h + 40) s.life = 0;
  }
  G.shots = G.shots.filter(s => s.life > 0);

  for (const s of G.eshots){
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if(s.trail){s.trail.push({x:s.x,y:s.y});if(s.trail.length>7)s.trail.shift();}
    if (Math.hypot(P.x - s.x, P.y - s.y) < P.r + s.r){
      s.life = 0;
      hurtPlayer(s.dmg);
    }
  }
  G.eshots = G.eshots.filter(s => s.life > 0);
}

function updateEnemies(dt){
  for (const e of G.enemies){
    if (G.state !== 'playing') break;
    if (e.hp <= 0) continue;
    Motion.step(e,dt,e.x-(e.motionX??e.x),e.y-(e.motionY??e.y));
    e.motionX=e.x;e.motionY=e.y;
    e.flash = Math.max(0, e.flash - dt);
    e.hitCd = Math.max(0, e.hitCd - dt);
    if (e.poison > 0){
      e.poison -= dt;
      e.poisonTick = (e.poisonTick || 0) + dt;
      if (e.poisonTick > .5){
        e.poisonTick = 0;
        hurt(e, 2, '#7fbfa8');
        if (e.hp <= 0) continue;
      }
    }

    if(e.bossHelper||e.seal||e.lantern)continue;
    const dx = P.x - e.x, dy = P.y - e.y;
    const d = Math.hypot(dx, dy) || 1;

    if (e.kb > 0){
      e.x += e.kx * e.kb * dt;
      e.y += e.ky * e.kb * dt;
      e.kb = Math.max(0, e.kb - 380 * dt);
    }

    if(e.boss){ Bosses.update(e,dt);World.resolve(e);continue; }
    if(d>1100)continue;

    Encounters.attackMob(e,dt,dx,dy,d);
    World.resolve(e);
  }

  for (let i = 0; i < G.enemies.length; i++){
    const a = G.enemies[i];
    if (a.hp <= 0) continue;
    for (let j = i + 1; j < G.enemies.length; j++){
      const b = G.enemies[j];
      if (b.hp <= 0) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = (a.r + b.r) * 1.55;
      if (d < min){
        const push = (min - d) * .6;
        const nx = dx / d, ny = dy / d;
        if (!a.boss&&!a.bossHelper&&!a.seal&&!a.lantern){ a.x += nx * push; a.y += ny * push; }
        if (!b.boss&&!b.bossHelper&&!b.seal&&!b.lantern){ b.x -= nx * push; b.y -= ny * push; }
      }
    }
  }

  G.enemies = G.enemies.filter(e => e.hp > 0);
  for(const e of G.enemies)if(!e.bossHelper)World.resolve(e);
}

function updatePools(dt){
  for (const p of G.pools){
    p.life -= dt;
    p.tick -= dt;
    if (!p.poisonPool&&p.tick <= 0){
      p.tick = .5;
      for (const e of G.enemies){
        if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < p.r + e.r) hurt(e, p.dps * .5, p.color,{ultimate:p.ultimate});
      }
    }
  }
  for(const e of G.enemies){if(e.hp<=0||(e.poolNext??0)>G.time)continue;const touching=G.pools.filter(p=>p.poisonPool&&p.life>0&&Math.hypot(e.x-p.x,e.y-p.y)<p.r+e.r);if(touching.length){e.poolNext=G.time+.5;hurt(e,Math.max(...touching.map(p=>p.dps))*.5,'#7fbfa8');}}
  G.pools = G.pools.filter(p => p.life > 0);
}

function updateOrbs(dt){
  for (const o of G.orbs){
    o.life -= dt;
    const d = Math.hypot(P.x - o.x, P.y - o.y);
    if (d < P.pickup){
      const f = 1 - d / P.pickup;
      o.x += (P.x - o.x) * (3 + f * 9) * dt;
      o.y += (P.y - o.y) * (3 + f * 9) * dt;
    } else {
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.vx *= .96; o.vy *= .96;
    }
    if (d < 24){
      o.life = 0;
      notifyPickup('xp','',o.value*P.xpMul);
      gainXP(o.value);
    }
  }
  G.orbs = G.orbs.filter(o => o.life > 0);
}

function updateHeals(dt){
  for (const h of G.heals){
    h.life -= dt;
    const d = Math.hypot(P.x - h.x, P.y - h.y);
    if (d < P.pickup){
      const f = 1 - d / P.pickup;
      h.x += (P.x - h.x) * (3 + f * 10) * dt;
      h.y += (P.y - h.y) * (3 + f * 10) * dt;
    }
    if (d < 24){
      h.life = 0;
      const before=P.hp;
      heal(15);
      notifyPickup('heal',P.hp>before?'拾取灵药 · 生命 +'+Math.round(P.hp-before):'拾取灵药 · 生命已满');
      burst(h.x, h.y, '#9fe3b8', 6, 90);
    }
  }
  G.heals = G.heals.filter(h => h.life > 0);
}

function updateChests(dt){
  for (const c of G.chests){
    c.t += dt;
    if (Math.hypot(P.x - c.x, P.y - c.y) < 40) c.open = true;
  }
  const opened = G.chests.find(c => c.open);
  if (opened){
    G.chests = G.chests.filter(c => c !== opened);
    openChest();
  }
}

function updateFx(dt){
  for (const p of G.parts){
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= .94; p.vy *= .94;
  }
  G.parts = G.parts.filter(p => p.life > 0);
  if(G.parts.length>650) G.parts.splice(0,G.parts.length-650);

  for (const t of G.texts){ t.life -= dt; t.y -= 26 * dt; }
  G.texts = G.texts.filter(t => t.life > 0);
  if(G.texts.length>100) G.texts.splice(0,G.texts.length-100);

  for (const a of G.auras){ a.life -= dt; a.r += (a.max - a.r) * Math.min(1, dt * 12); }
  G.auras = G.auras.filter(a => a.life > 0);

  for (const b of G.bolts) b.life -= dt;
  G.bolts = G.bolts.filter(b => b.life > 0);
}

/* ---------------- 经验 / 升级 ---------------- */

function gainXP(v){
  P.xp += v * P.xpMul;
  while (P.xp >= P.xpNext){
    P.xp -= P.xpNext;
    P.level++;
    P.xpNext = Cultivation.xpNeed(P.level);
    G.queue++;
    heal(8);
  }
  if (G.queue > 0 && G.state === 'playing') showLevelUp();
  if(G.queue>0)RunSave.save('经验成长');
}

function showLevelUp(restoredChoices=null){
  Sound.effects('level');
  Sound.speak('level',25,30);
  choicesCache = restoredChoices||buildChoices();
  G.state = 'levelup';
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  ov.innerHTML = `
    <div class="panel">
      <h2>等 级 提 升</h2>
      <p class="sub">三 选 一</p>
      <div class="choices">
        ${choicesCache.map((c, i) => cardHTML(c, i)).join('')}
      </div>
      <p class="hintline">点击卡牌，或按 1 / 2 / 3</p>
    </div>`;
  ov.querySelectorAll('.upcard').forEach(node => {
    node.onclick = () => pickCard(Number(node.dataset.i));
  });
  if (AUTOPICK) setTimeout(() => { if (G.state === 'levelup') pickCard(0); }, 30);
  RunSave.save('待选升级');
}

function cardHTML(c, i){
  const color = c.color || '#d9b877';
  return `<div class="upcard" data-i="${i}" style="--c:${color}">
    <div class="tag">${c.tag}</div>
    <div class="glyph">${c.glyph}</div>
    <div class="uname">${c.name}</div>
    <div class="udesc">${c.desc}</div>
    <div class="ulvl">${c.lvl || ''}</div>
  </div>`;
}

function buildChoices(){
  const pool = [];
  for (const k in SPELLS){
    const owned = P.spells[k];
    if (owned){
      if (owned < SPELLS[k].max){
        pool.push({ kind:'up', key:k, name:SPELLS[k].name, glyph:SPELLS[k].glyph, color:SPELLS[k].color,
          tag:'术法 · 精进', desc:SPELLS[k].desc(owned + 1), lvl:'Lv.' + owned + ' → ' + (owned + 1) });
      }
    } else if (Object.keys(P.spells).length < 6){
      pool.push({ kind:'new', key:k, name:SPELLS[k].name, glyph:SPELLS[k].glyph, color:SPELLS[k].color,
        tag:'术法 · 新', desc:SPELLS[k].desc(1), lvl:'Lv.1' });
    }
  }
  for (const s of STATS){
    if(!Cultivation.canStat(s.id))continue;
    pool.push({ kind:'stat', id:s.id, name:s.name, glyph:s.glyph, color:s.color, tag:s.tag, desc:s.desc, lvl:'' });
  }
  shuffle(pool);
  const out = [], used = new Set();
  for (const c of pool){
    const key = c.kind + ':' + (c.key || c.id);
    if (used.has(key)) continue;
    used.add(key);
    out.push(c);
    if (out.length === 3) break;
  }
  while (out.length < 3){
    const available=STATS.filter(s=>Cultivation.canStat(s.id));
    if(!available.length){out.push({kind:'recover',name:'调息',glyph:'息',color:'#9cecc3',tag:'恢复',desc:'当前强化均已封顶，回复 20 生命。',lvl:''});continue;}
    const s = pick(available);
    out.push({ kind:'stat', id:s.id, name:s.name, glyph:s.glyph, color:s.color, tag:s.tag, desc:s.desc, lvl:'' });
  }
  if(G.runChoices<3&&!out.some(c=>c.kind==='new'||c.kind==='up')){
    const spell=pool.find(c=>c.kind==='new'||c.kind==='up');if(spell)out[0]=spell;
  }
  if(G.runChoices===1){
    const area=pool.find(c=>['wanjian','sanmei'].includes(c.key));
    if(area&&!out.some(c=>c.key===area.key))out[0]=area;
  }
  return out;
}

function shuffle(a){
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCard(i){
  if (G.state !== 'levelup') return;
  const c = choicesCache[i];
  if (!c) return;
  Sound.effects('ui');
  applyChoice(c);
  G.runChoices++;
  P.growthChoices=G.runChoices;
  G.queue--;
  RunSave.save('升级已选');
  if (G.queue > 0){ showLevelUp(); return; }
  document.getElementById('overlay').classList.add('hidden');
  G.state = 'playing';
  syncHUD();
}

function applyChoice(c){
  if (c.kind === 'new'){
    if(c.key==='wanjian')Sound.spell('wanjian');
    SpellGift.permanent(c.key);
    P.t[c.key] = .2;
    addText(P.x, P.y - 40, '习得 ' + c.name, c.color, 17);
  } else if (c.kind === 'up'){
    if(P.spells[c.key]<SPELLS[c.key].max)SpellGift.permanent(c.key);
  } else if(c.kind==='recover'){
    heal(20);
  } else {
    const s = STATS.find(x => x.id === c.id);
    if (s) s.apply();
  }
  Cultivation.constrain();
  renderSpells();
  syncHUD();
}

/* ---------------- 宝箱 ---------------- */

function openChest(restoredReward=null,alreadyApplied=false){
  Sound.effects('chest');
  G.state = 'chest';
  const reward = restoredReward||rollChestReward();
  G.chestReward=reward;
  if(!alreadyApplied)applyReward(reward);
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  ov.innerHTML = `
    <div class="panel treasure-panel">
      <div class="reward-casket">${ItemCatalog.icon('elite-chest','宝箱已开启')}</div>
      <h2>宝 箱 · 已开启</h2>
      <p class="sub">${reward.kind === 'equip' ? '法 宝' : (reward.kind === 'spell' ? '术 法' : '丹 药')}</p>
      <div class="reward" style="--c:${reward.color}">
        <div class="cicon">${reward.kind==='equip'?ItemCatalog.icon(reward.id,reward.name):reward.kind==='heal'?ItemCatalog.icon('potion',reward.name):reward.glyph}</div>
        <div>
          <div class="cname">${reward.name}</div>
          <div class="cdesc">${reward.desc}</div>
        </div>
      </div>
      <button class="btn" id="takeBtn">收 下</button>
      <p class="hintline">按 空格 / 回车 继续</p>
    </div>`;
  document.getElementById('takeBtn').onclick = closeChest;
  if (AUTOPICK) setTimeout(() => { if (G.state === 'chest') closeChest(); }, 30);
  RunSave.save('宝箱奖励');
}

function rollChestReward(){
  const unowned = EQUIPS.filter(e => !P.equips.includes(e.id));
  const spellKeys = Object.keys(SPELLS).filter(k => !P.spells[k]);
  const canSpell = Object.keys(P.spells).length < 6 && spellKeys.length > 0;

  if (canSpell && Math.random() < .35){
    const key = pick(spellKeys);
    return { kind:'spell', key, name:SPELLS[key].name, glyph:SPELLS[key].glyph,
      color:SPELLS[key].color, desc:'习得新术法：' + SPELLS[key].desc(1) };
  }
  if (unowned.length){
    const e = pick(unowned);
    return { kind:'equip', id:e.id, name:e.name, glyph:e.glyph, color:e.color, desc:e.desc };
  }
  return { kind:'heal', name:'九转还魂丹', glyph:'丹', color:'#9fe3b8', desc:'回复 50 点生命。' };
}

function applyReward(r){
  if (r.kind === 'equip'){
    P.equips.push(r.id);
    const e = EQUIPS.find(x => x.id === r.id);
    if (e) e.apply();
    renderEquips();
  } else if (r.kind === 'spell'){
    SpellGift.permanent(r.key);
    P.t[r.key] = .2;
    renderSpells();
  } else {
    heal(50);
  }
  Cultivation.constrain();
}

function closeChest(){
  if(G.state!=='chest')return false;
  if(G.chestReward){notifyPickup('chest','已获得：'+G.chestReward.name);G.chestReward=null;}
  document.getElementById('overlay').classList.add('hidden');
  if (G.queue > 0){ showLevelUp(); return; }
  G.state = 'playing';
  syncHUD();
  RunSave.save('宝箱已收下');
}

/* ---------------- 结束 ---------------- */

function die(){
  if (G.state !== 'playing' || P.hp > 0) return;
  G.state = 'dead';
  burst(P.x, P.y, '#d0604c', 40, 260);
  showEnd(false);
}

function win(){
  if (G.state !== 'playing' || P.hp<=0 || !G.bossSpawned || !G.boss || !G.boss.killed || G.boss.hp>0) return;
  G.state = 'win';
  burst(P.x, P.y, '#f2dda8', 60, 300);
  showEnd(true);
}

function showEnd(victory){ Sound.sync(victory?'win':'dead',Journey.run.stage,false);Sound.result(victory);Journey.showEnd(victory); }

function fmt(t){
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/* ---------------- 渲染 ---------------- */

function render(){
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (G.shake > 0 && !REDUCED_MOTION) ctx.translate(rand(-G.shake, G.shake) * .5, rand(-G.shake, G.shake) * .5);
  World.apply();
  World.drawBackground();
  World.drawGround();
  EncounterDirector.drawGround();
  drawPools();
  drawTelegraphs();
  Motion.drawGround();
  drawChests();
  drawOrbs();
  drawHeals();
  World.drawProps();
  drawEnemies();
  drawShots();
  drawAuras();
  drawBolts();
  drawParticles();
  Motion.drawOver();
  drawUltimate();
  drawTexts();
  World.drawLabels();
  ctx.restore();
  drawAtmosphere();
  drawVignette();
  Motion.drawScreen?.();
  World.drawScreen();
}

function drawBackground(){
  const scene=Journey.background();
  const bg=scene.complete&&scene.naturalWidth?scene:BG;
  if (bg.complete && bg.naturalWidth){
    const s = Math.max(W / bg.width, H / bg.height);
    const dw = bg.width * s, dh = bg.height * s;
    ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.fillStyle = 'rgba(5,15,19,.10)';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const g = ctx.createRadialGradient(W * .5, H * .35, 60, W * .5, H * .5, Math.max(W, H) * .8);
  g.addColorStop(0, '#121a20');
  g.addColorStop(.55, '#0a0f13');
  g.addColorStop(1, '#05070a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = .05;
  for (let i = 0; i < 5; i++){
    const t = G.time * (.02 + i * .006) + i * 1.7;
    const x = W * .5 + Math.cos(t) * W * .32;
    const y = H * .5 + Math.sin(t * .8 + i) * H * .26;
    const r = 160 + i * 70;
    const cg = ctx.createRadialGradient(x, y, 0, x, y, r);
    cg.addColorStop(0, '#9fd8ef');
    cg.addColorStop(1, 'transparent');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = .07;
  ctx.strokeStyle = '#d9b877';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++){
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 120 * i + Math.sin(G.time * .3) * 4, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPools(){ for(const pool of G.pools)Motion.drawPool(pool); }

function drawChests(){
  for (const c of G.chests){
    if(ItemCatalog.draw('elite-chest',c.x,c.y,80,c.t))continue;
    const bob = Math.sin(c.t * 2.4) * 3;
    const g = ctx.createRadialGradient(c.x, c.y + bob, 2, c.x, c.y + bob, 44);
    g.addColorStop(0, 'rgba(242,221,168,.45)');
    g.addColorStop(1, 'rgba(242,221,168,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y + bob, 44, 0, TAU); ctx.fill();

    if (IMG.chest && IMG.chest.complete && IMG.chest.naturalWidth){
      ctx.drawImage(IMG.chest, c.x - 36, c.y + bob - 54, 72, 72);
    } else {
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.fillStyle = '#3a2c18';
      ctx.strokeStyle = '#e6c87f';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-14, -10, 28, 20, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e6c87f';
      ctx.fillRect(-14, -2, 28, 3);
      ctx.beginPath(); ctx.arc(0, -2, 3, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
}

function drawOrbs(){
  for (const o of G.orbs){
    ctx.save();
    ctx.globalAlpha = o.life < 3 ? Math.min(1, o.life / 3) : 1;
    ctx.fillStyle = '#7fd8ef';
    ctx.shadowColor = '#7fd8ef'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y - 5); ctx.lineTo(o.x + 4, o.y); ctx.lineTo(o.x, o.y + 5); ctx.lineTo(o.x - 4, o.y);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawHeals(){
  for (const h of G.heals){
    if(ItemCatalog.draw('potion',h.x,h.y,32,G.time))continue;
    ctx.save();
    ctx.globalAlpha = h.life < 3 ? Math.min(1, h.life / 3) : 1;
    ctx.fillStyle = '#9fe3b8';
    ctx.shadowColor = '#9fe3b8'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(h.x, h.y, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a1410';
    ctx.fillRect(h.x - 3, h.y - 1, 6, 2);
    ctx.fillRect(h.x - 1, h.y - 3, 2, 6);
    ctx.restore();
  }
}

function drawEnemies(){
  const sorted=G.enemies.filter(e=>e.hp>0&&World.visible(e,260)).concat(P?[P]:[]).sort((a,b)=>a.y-b.y);
  for(const e of sorted){
    if(e===P){drawPlayer();continue;}
    const size=(e.boss?230:({imp:78,fox:90,snake:96,zombie:103}[e.type]||80))*(e.elite?1.3:1);
    const sw=e.boss?70:e.elite?35:22;
    ctx.save();ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(e.x,e.y+5,sw,sw*.3,0,0,TAU);ctx.fill();ctx.restore();
    Motion.drawActor(e,e.type,size);
    if(e.elite){ctx.fillStyle='#080e10';ctx.fillRect(e.x-25,e.y-size*.82,50,3);ctx.fillStyle='#dfc58a';ctx.fillRect(e.x-25,e.y-size*.82,50*e.hp/e.maxHp,3);}
  }
}

function drawShots(){
  for(const s of G.shots)Motion.drawProjectile(s);
  for(const s of G.eshots)Encounters.drawShot(s);
}

function drawPlayer(){
  if(!P)return;
  const p=P;
  ctx.save();
  const shadow=ctx.createRadialGradient(p.x,p.y+5,2,p.x,p.y+5,34);
  shadow.addColorStop(0,'#0009');shadow.addColorStop(1,'#0000');ctx.fillStyle=shadow;
  ctx.beginPath();ctx.ellipse(p.x,p.y+5,34,11,0,0,TAU);ctx.fill();ctx.restore();
  RealmVisuals.draw(p.cultivation,p.x,p.y,G.time);
  if(p.spells.wanjian)for(const sword of SpellCombat.orbit(p))Motion.sword(sword.x,sword.y,sword.a+Math.PI/2,40,RealmVisuals.get(p.cultivation).color);
  Motion.drawActor(p,'hero',116);
  Motion.drawShield(p);
}

function drawAuras(){
  for (const a of G.auras){
    const l = Math.max(0, a.life / .5);
    ctx.save();
    const g = ctx.createRadialGradient(a.x, a.y, a.r * .55, a.x, a.y, a.r);
    g.addColorStop(0, rgba(a.color, 0));
    g.addColorStop(.82, rgba(a.color, .18 * l));
    g.addColorStop(1, rgba(a.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();

    ctx.globalAlpha = l * .9;
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = a.color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

function drawBolts(){
  for (const b of G.bolts){
    const l = Math.max(0, b.life / .18);
    ctx.save();
    ctx.shadowColor = b.color; ctx.shadowBlur = 16;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    ctx.globalAlpha = l * .22;
    ctx.strokeStyle = b.color; ctx.lineWidth = 9;
    ctx.beginPath();
    b.pts.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
    ctx.stroke();

    ctx.globalAlpha = l * .9;
    ctx.lineWidth = 3;
    ctx.beginPath();
    b.pts.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
    ctx.stroke();

    ctx.globalAlpha = l;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    b.pts.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
    ctx.stroke();

    const end = b.pts[b.pts.length - 1];
    ctx.globalAlpha = l * .55;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(end.x, end.y, 10, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

function drawParticles(){
  for (const p of G.parts){
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

function drawTexts(){
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of G.texts){
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 2.2));
    ctx.fillStyle = t.color;
    ctx.font = '700 ' + t.size + 'px "Kaiti SC", KaiTi, serif';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
    ctx.fillText(t.txt, t.x, t.y);
    ctx.restore();
  }
}

function drawVignette(){
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawAtmosphere(){
  ctx.save();
  for(let i=0;i<5;i++){
    const x=((i*.249*W+G.time*(i%2?5:-4))%(W+300)+W+300)%(W+300)-150;
    const y=H*(.22+i*.17), r=W*.27;
    const fog=ctx.createRadialGradient(x,y,0,x,y,r);
    fog.addColorStop(0,'#adcfc60b');fog.addColorStop(1,'#adcfc600');
    ctx.fillStyle=fog;ctx.fillRect(0,y-r,W,r*2);
  }
  for(let i=0;i<24;i++){
    const x=(i*137.3+Math.sin(G.time*.25+i)*23)%W;
    const y=(i*91.7-G.time*(3+i%4)+H*100)%H;
    ctx.globalAlpha=.15+(Math.sin(G.time+i)+1)*.12;
    ctx.fillStyle=i%3?'#c9d9cd':'#ffce89';
    ctx.fillRect(x,y,1.5,1.5);
  }
  ctx.restore();
}
function drawTelegraphs(){
  for(const t of G.telegraphs){
    const progress=1-t.life/t.total,color=t.color||'#e69a75';
    ctx.save();ctx.fillStyle=rgba(color,.14+progress*.16);ctx.strokeStyle=rgba(color,.8);ctx.lineWidth=2;
    if(t.shape==='tide'){
      const left=t.gap-t.safe/2,right=t.gap+t.safe/2,edgeLeft=t.left??0,edgeRight=t.right??World.bounds().w;
      ctx.fillRect(edgeLeft,t.y-t.r,Math.max(0,left-edgeLeft),t.r*2);ctx.strokeRect(edgeLeft,t.y-t.r,Math.max(0,left-edgeLeft),t.r*2);
      ctx.fillRect(right,t.y-t.r,Math.max(0,edgeRight-right),t.r*2);ctx.strokeRect(right,t.y-t.r,Math.max(0,edgeRight-right),t.r*2);
      ctx.fillStyle='#b9edcc22';ctx.fillRect(left,t.y-t.r,t.safe,t.r*2);ctx.fillStyle='#c5f2d3';ctx.font='12px KaiTi,serif';ctx.textAlign='center';ctx.fillText('留隙 · 安全',t.gap,t.y+4);
    }else if(t.shape==='line'){
      ctx.translate(t.x,t.y);ctx.rotate(t.angle);ctx.fillRect(-t.length,-t.r,t.length*2,t.r*2);ctx.strokeRect(-t.length,-t.r,t.length*2,t.r*2);
      ctx.fillStyle=rgba(color,.35);ctx.fillRect(-t.length,-t.r,t.length*2*progress,t.r*2);
      ctx.fillStyle='#ffe5bd';ctx.font='11px KaiTi,serif';ctx.textAlign='center';ctx.fillText(t.label||'追斩',0,-t.r-7);
    }else{
      ctx.translate(t.x,t.y);ctx.beginPath();ctx.arc(0,0,t.r,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffe5aa';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,t.r,-Math.PI/2,-Math.PI/2+TAU*progress);ctx.stroke();
      ctx.fillStyle='#eedcbe';ctx.font='11px KaiTi,serif';ctx.textAlign='center';ctx.fillText(t.label||'落印 · 避',0,4);
    }
    ctx.restore();
  }
}
function paintSword(x,y,angle,length,alpha){ Motion.sword(x,y,angle-Math.PI/2,length,'#ffe0a1',alpha); }
function drawUltimate(){ Motion.drawUltimate(); }

/* ---------------- HUD ---------------- */

function syncHUD(){
  if (!P) return;
  document.body.classList.toggle('in-dialog',!['playing','map'].includes(G.state));
  document.body.classList.toggle('character-open',G.state==='character');
  const notice=document.getElementById('pickupNotice'),item=G.pickups[0];
  notice.hidden=G.state!=='playing'||!item;
  if(item)notice.textContent=item.kind==='xp'?'灵蕴 +'+Number(item.amount.toFixed(1)):item.text;
  document.getElementById('encounterStatus').textContent=EncounterDirector.hud();
  document.getElementById('hpFill').style.width = Math.max(0, P.hp / P.maxHp * 100) + '%';
  document.getElementById('hpText').textContent = Math.ceil(P.hp) + ' / ' + Math.ceil(P.maxHp);
  document.getElementById('xpFill').style.width = Math.min(100, P.xp / P.xpNext * 100) + '%';
  document.getElementById('lvl').textContent = P.level;
  document.getElementById('shieldTxt').textContent = '护盾 ' + Math.round(P.shield);
  document.getElementById('cultivationLabel').textContent=Cultivation.label();
  const recipe=Cultivation.recipe();document.getElementById('cultivationQi').textContent='本境修为 '+Math.floor(P.cultivation.qi)+' / '+Cultivation.need()+' · '+P.cultivation.layer+'/9层';
  const saveStatus=document.getElementById('saveStatus');saveStatus.textContent=RunSave.status();saveStatus.setAttribute('data-error',String(RunSave.status().includes('尚未保存')||RunSave.conflicted()));
  document.getElementById('timer').textContent = fmt(G.time);
  document.getElementById('kills').textContent = '斩妖 ' + G.kills;
  const ready=G.state==='playing' && P.energy>=100 && P.ultCd<=0 && !G.ultimate;
  const ult=document.getElementById('ultimateBtn');
  ult.disabled=!ready;ult.classList.toggle('ready',ready);
  document.getElementById('ultFill').style.height=P.energy+'%';
  const ultSpec=Journey.ultimate();
  document.getElementById('ultStatus').textContent=P.ultCd>0?'冷却 '+Math.ceil(P.ultCd)+'s':(P.energy>=100?'Q · '+ultSpec.short:'剑意 '+Math.floor(P.energy)+'%');
  ult.querySelector('span').textContent=ultSpec.glyph;
  ult.setAttribute('aria-label','释放大招：'+ultSpec.name);
  document.getElementById('dashBtn').disabled=G.state!=='playing'||P.dashCd>0;
  document.getElementById('dashStatus').textContent=P.dashCd>0?P.dashCd.toFixed(1)+'s':'空格 · 闪避';
  const stage=Journey.stage(),profile=Journey.difficulty();
  document.getElementById('chapterTitle').textContent=stage.no+' · '+stage.title;
  document.getElementById('heroName').textContent=HeroIdentity.get(P.heroId).name;
  document.getElementById('heroGlyph').textContent=HeroIdentity.get(P.heroId).glyph;
  document.getElementById('identitySub').textContent='无籍剑仙 · '+profile.name;
  document.getElementById('locationTitle').textContent=stage.place+' · '+World.region();
  document.getElementById('locationSubtitle').textContent=stage.subtitle+' · 轮回劫阶 '+(Journey.run.tier||0)+' · 累积劫压 '+Journey.run.stage+' · 寻圣线索 '+JourneyProgress.cleared()+'/3';
  document.getElementById('objectiveText').textContent=G.state==='win'?stage.title+' · 已破':(G.bossSpawned?'击杀守关 · '+stage.boss:'自由探路 · 寻找守关祭坛');
  const helpers=G.enemies.filter(e=>(e.seal||e.clerk||e.lantern)&&e.hp>0).length;
  document.getElementById('objectiveDetail').textContent=G.boss&&G.boss.hp>0?Bosses.hud(G.boss).hint:World.objective();
  const weakness=document.getElementById('bossWeakness');if(weakness){weakness.hidden=!G.boss||G.boss.hp<=0;if(G.boss){const status=Bosses.hud(G.boss);weakness.textContent=status.title;weakness.className=status.exposed?'boss-weakness exposed':'boss-weakness';}}
  const interact=document.getElementById('interactBtn');if(interact&&G.state!=='playing')interact.hidden=true;

  const bw = document.getElementById('bossWrap');
  if (G.boss && G.boss.hp > 0){
    bw.classList.remove('hidden');
    document.getElementById('bossFill').style.width = (G.boss.hp / G.boss.maxHp * 100) + '%';
    document.getElementById('bossHealth').textContent=(G.boss.phase===2?'变相 · ':'守关 · ')+stage.boss+' '+Math.ceil(G.boss.hp)+' / '+G.boss.maxHp;
  } else {
    bw.classList.add('hidden');
    document.getElementById('bossHealth').textContent='';
  }
}

function renderSpells(){
  document.getElementById('spells').innerHTML = Object.keys(P.spells).map(k => {
    const s = SPELLS[k];
    return `<div class="ic" style="--c:${s.color}" title="${s.name} Lv.${P.spells[k]}"><span>${s.glyph}</span><em>${P.spells[k]}</em></div>`;
  }).join('');
}

function renderEquips(){
  document.getElementById('equips').innerHTML = P.equips.map(id => {
    const e = EQUIPS.find(x => x.id === id);
    return `<div class="ic eq" style="--c:${e.color}" title="${e.name}：${e.desc}"><span>${e.glyph}</span></div>`;
  }).join('');
}

/* ---------------- 输入 ---------------- */

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  keys[k] = true;
  if(k==='f'&&!e.repeat){e.preventDefault();toggleFullscreen();return;}
  if(e.repeat && ['Escape','KeyQ','Space','Enter'].includes(e.code)) return;
  if(k==='tab'){e.preventDefault();if(!e.repeat)World.toggleMap();return;}
  if(k==='c'&&!e.repeat){e.preventDefault();CharacterUI.toggle();return;}
  if(G.state==='character'&&e.key==='Escape'){e.preventDefault();CharacterUI.close();return;}
  if(k==='e'&&!e.repeat){e.preventDefault();World.interact();return;}
  if(G.state==='map'&&e.key==='Escape'){e.preventDefault();World.toggleMap();return;}
  if(k==='q'){ e.preventDefault();tryUltimate(); }
  if (e.key === 'Escape'){ e.preventDefault(); togglePause(); return; }
  if (e.code === 'Space'){
    e.preventDefault();
    if (G.state === 'playing') tryDash();
    else if (G.state === 'chest') closeChest();
  }
  if (e.key === 'Enter' && G.state === 'chest') closeChest();
  if (G.state === 'levelup' && ['1','2','3'].includes(e.key)) pickCard(Number(e.key) - 1);
  if (k === 'r' && G.state === 'dead') RunSave.retry();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function clearInput(){
  for(const k in keys) delete keys[k];
  joy.active=false;joy.id=null;joy.dx=0;joy.dy=0;
}
window.addEventListener('blur',()=>{ clearInput(); if(G.state==='playing')togglePause(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ clearInput();if(G.state==='playing')togglePause(); } });
document.getElementById('ultimateBtn').onclick=tryUltimate;
document.getElementById('dashBtn').onclick=tryDash;
document.getElementById('journalBtn').onclick=Journey.journal;
document.getElementById('mapBtn').onclick=World.toggleMap;
document.getElementById('interactBtn').onclick=World.interact;
async function toggleFullscreen(){
  const notice=document.getElementById('screenNotice');
  notice.textContent='';
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    else notice.textContent='当前预览不支持全屏，请点击「独立窗口」。';
  }catch(_){notice.textContent='当前预览限制了全屏，请点击「独立窗口」。';}
}
document.getElementById('fullscreenBtn').onclick=toggleFullscreen;
document.addEventListener('fullscreenchange',()=>{
  document.getElementById('fullscreenBtn').innerHTML=document.fullscreenElement?'⛶ 退出全屏 <kbd>F</kbd>':'⛶ 全屏 <kbd>F</kbd>';
  resize();
});

canvas.addEventListener('pointerdown', e => {
  if (G.state !== 'playing') return;
  if (e.clientX < W * .45){
    joy.active = true; joy.id = e.pointerId;
    joy.ox = e.clientX; joy.oy = e.clientY;
    joy.dx = 0; joy.dy = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch(_) {}
  } else {
    tryDash();
  }
});
canvas.addEventListener('pointermove', e => {
  if (!joy.active || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
  const d = Math.hypot(dx, dy);
  const max = 58;
  if (d > max){ dx = dx / d * max; dy = dy / d * max; }
  joy.dx = dx / max; joy.dy = dy / max;
});
function endJoy(e){
  if (e.pointerId !== joy.id) return;
  joy.active = false; joy.dx = 0; joy.dy = 0;
}
canvas.addEventListener('pointerup', endJoy);
canvas.addEventListener('pointercancel', endJoy);

/* ---------------- 开场 / 循环 ---------------- */

function startGame(){ RunSave.start(Journey.selected()); }

function togglePause(){
  if (G.state === 'playing'){
    clearInput();
    G.state = 'paused';
    const ov = document.getElementById('overlay');
    ov.classList.remove('hidden');
    ov.innerHTML = `
      <div class="panel">
        <h2>暂 停</h2>
        <p class="sub">ESC 继 续</p>
        <p class="desc">历劫 ${fmt(G.time)} · 等级 Lv.${P.level} · ${Cultivation.label()} · 斩妖 ${G.kills}</p>
        <button class="btn" id="resumeBtn">继 续</button>
        <button class="linkbtn" id="restartBtn" style="margin-left:10px">重入本关 · 保留成长</button>
        <button class="linkbtn" id="pauseMenuBtn">返回卷首 · 重新出征</button>
        <p class="hintline">Esc 返回战斗</p>
      </div>`;
    document.getElementById('resumeBtn').onclick = togglePause;
    document.getElementById('pauseMenuBtn').onclick=Journey.menu;
    document.getElementById('restartBtn').onclick = () => {
      ov.classList.add('hidden');
      RunSave.retry();
    };
  } else if (G.state === 'paused'){
    document.getElementById('overlay').classList.add('hidden');
    G.state = 'playing';
    last = performance.now();
  }
}

function startScreen(){ Journey.menu(); }

let last = performance.now();
function loop(now){
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000));
  last = now;
  if (G.state === 'playing') update(dt);
  Sound.sync(G.state,Journey.run.stage,G.bossSpawned&&!!G.boss&&G.boss.hp>0);
  render();
  CharacterUI.frame(now/1000);
  HeroIdentity.frame(now/1000);
  syncHUD();
  drawJoystick();
  requestAnimationFrame(loop);
}

function drawJoystick(){
  if (!joy.active||G.state!=='playing') return;
  ctx.save();
  ctx.globalAlpha = .28;
  ctx.strokeStyle = '#d9b877';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 58, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#d9b877';
  ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 58, joy.oy + joy.dy * 58, 22, 0, TAU); ctx.fill();
  ctx.restore();
}

function bench(n, sec){
  const previousBotMode=botMode;
  botMode=true;
  const rows = [];
  for (let i = 0; i < n; i++){
    reset();
    for (let f = 0; f < sec * 60; f++){
      if (G.state === 'playing') update(1 / 60);
      else if (G.state === 'levelup') pickCard(0);
      else if (G.state === 'chest') closeChest();
      else break;
    }
    rows.push({ t: Math.floor(G.time), lvl: P.level, kills: G.kills, win: G.state === 'win' });
  }
  const wins = rows.filter(r => r.win).length;
  const avg = rows.reduce((a, r) => a + r.t, 0) / rows.length;
  G.state = 'bench';
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  ov.innerHTML = '<div class="panel"><h2>模 拟 结 果</h2>' +
    '<p class="sub">' + n + ' 局 · 上限 ' + sec + ' 秒</p>' +
    '<div class="statline"><span>通关 <b>' + wins + '</b></span><span>平均存活 <b>' + Math.round(avg) + ' 秒</b></span></div>' +
    '<p class="desc" style="font-size:12px;line-height:1.9">' +
    rows.map((r, i) => '#' + (i + 1) + ' ' + (r.win ? '胜' : '败') + ' · ' + r.t + '秒 · 境界' + r.lvl + ' · 斩妖' + r.kills).join('<br>') +
    '</p></div>';
  botMode=previousBotMode;
  return rows;
}

/* 启动 */
RunSave.init();
reset();
CharacterUI.init();
G.state = 'start';
if ('ontouchstart' in window){
  document.querySelector('.hint').innerHTML = '<kbd>左侧拖动</kbd> 移动 <kbd>右侧点击</kbd> 闪避 <kbd>天剑按钮</kbd> 大招';
}
if (QS.has('bench')){
  bench(Math.max(1, Math.min(12, Number(QS.get('bench')) || 6)), 200);
} else if (QS.has('auto')){
  startGame();
  document.getElementById('enterStageBtn').onclick();
  if (QS.has('warp')){
    const sec = Math.max(0, Math.min(240, Number(QS.get('warp')) || 0));
    for (let i = 0; i < sec * 60; i++){
      if (G.state === 'playing') update(1 / 60);
      else if (G.state === 'levelup') pickCard(0);
      else if (G.state === 'chest') closeChest();
      else break;
    }
  }
  if (QS.has('cards')) showLevelUp();
  if (QS.has('chest')) openChest();
  if (QS.has('pause')) togglePause();
  if (QS.has('allspells')){
    for (const k in SPELLS){ P.spells[k] = 3; P.t[k] = .1; }
    renderSpells();
  }
  if (QS.has('fx')){
    for (const k in P.spells) SPELLS[k].cast(P.spells[k]);
  }
  if (QS.has('freeze')) G.state = 'paused';
} else {
  startScreen();
}
requestAnimationFrame(loop);
