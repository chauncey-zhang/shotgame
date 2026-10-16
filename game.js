/* ============================================================
   深渊猎手 / Abyss Hunter — 单机多关卡打怪游戏
   纯原生 JavaScript + Canvas，零依赖，双击 index.html 即可玩。
   ============================================================ */
'use strict';

/* ---------------- 工具 ---------------- */
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a, b, t) => a + (b - a) * t;
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---------------- 关卡配置 ---------------- */
const LEVELS = [
  { id:1, name:'枯骨荒原', desc:'最低层的坟场，骷髅在风沙中游荡。', tags:['新手','骷髅','近战'],
    bg:['#1a1730','#2b2148'], accent:'#c8a2ff',
    enemyPool:['skeleton','skeleton','slime'], waves:4,
    waveSize:(w)=>7+w*3, hpMul:.55, dmgMul:.18, speedMul:.62,
    boss:{ type:'boneKing', name:'骸骨之王' } },

  { id:2, name:'幽绿水道', desc:'腐水没膝，粘稠的东西在暗处蠕动。', tags:['远程','腐蚀','分散'],
    bg:['#0d2028','#14403c'], accent:'#6ff0d0',
    enemyPool:['slime','spitter','slime','bat'], waves:4,
    waveSize:(w)=>9+w*3, hpMul:.66, dmgMul:.21, speedMul:.66,
    boss:{ type:'slimeQueen', name:'腐沼母巢' } },

  { id:3, name:'流沙古墓', desc:'黄沙之下埋着会动的石棺，风里全是干燥的骨粉。', tags:['沙虫','突进','包围'],
    bg:['#2a2213','#54401f'], accent:'#ffd479',
    enemyPool:['skeleton','bat','bomber','skeleton'], waves:4,
    waveSize:(w)=>10+w*3, hpMul:.76, dmgMul:.24, speedMul:.68,
    boss:{ type:'sandWyrm', name:'噬沙巨虫' } },

  { id:4, name:'霜封回廊', desc:'寒冰拖慢脚步，冷酷的法师藏于雪幕。', tags:['减速','法师','瞬移'],
    bg:['#101c33','#26456e'], accent:'#9fe8ff',
    enemyPool:['wraith','spitter','skeleton','wraith'], waves:5,
    waveSize:(w)=>11+w*3, hpMul:.88, dmgMul:.27, speedMul:.70,
    boss:{ type:'frostLord', name:'霜噬领主' } },

  { id:5, name:'雷鸣穹顶', desc:'乌云压得很低，雷光顺着金属骨架一路爬到你脚下。', tags:['闪电','连锁','高机动'],
    bg:['#151a2e','#33305c'], accent:'#a8c8ff',
    enemyPool:['wraith','imp','spitter','bat'], waves:5,
    waveSize:(w)=>12+w*3, hpMul:1.0, dmgMul:.30, speedMul:.72,
    boss:{ type:'stormHerald', name:'雷暴先驱' } },

  { id:6, name:'熔核熔炉', desc:'岩浆翻涌，火元素在铁砧上重铸自己。', tags:['高伤','爆炸','冲锋'],
    bg:['#2a0f12','#53211a'], accent:'#ff9a5c',
    enemyPool:['imp','imp','bomber','skeleton'], waves:6,
    waveSize:(w)=>13+w*3, hpMul:1.14, dmgMul:.33, speedMul:.74,
    boss:{ type:'magmaTitan', name:'熔核泰坦' } },

  { id:7, name:'磐石圣殿', desc:'古老的守卫从墙壁里站起，把整座殿都变成它的躯干。', tags:['重甲','震地','召唤'],
    bg:['#1d2119','#3d4432'], accent:'#c9d6a0',
    enemyPool:['slime','imp','summoner','bomber'], waves:6,
    waveSize:(w)=>14+w*3, hpMul:1.28, dmgMul:.36, speedMul:.76,
    boss:{ type:'stoneWarden', name:'磐石守卫' } },

  { id:8, name:'血色钟楼', desc:'钟声一响，血影便从镜中爬出。', tags:['召唤','瞬移','群战'],
    bg:['#240a1e','#4a1136'], accent:'#ff7ec1',
    enemyPool:['wraith','bat','imp','summoner'], waves:6,
    waveSize:(w)=>15+w*3, hpMul:1.42, dmgMul:.39, speedMul:.78,
    boss:{ type:'bloodCountess', name:'血影伯爵夫人' } },

  { id:9, name:'虚空镜廊', desc:'无数面镜子复制了你的动作，也复制了你打不过的东西。', tags:['镜像','传送','狂暴'],
    bg:['#0d0a1d','#241a4a'], accent:'#7ff0ff',
    enemyPool:['wraith','summoner','imp','spitter','bomber'], waves:6,
    waveSize:(w)=>16+w*3, hpMul:1.56, dmgMul:.42, speedMul:.80,
    boss:{ type:'voidMirror', name:'虚空镜灵' } },

  { id:10, name:'深渊王座', desc:'一切阴影的源头，它已在王座上等你很久。', tags:['终局','多阶段','精英'],
    bg:['#0a0715','#1e0f3d'], accent:'#b98cff',
    enemyPool:['wraith','imp','bomber','summoner','spitter'], waves:7,
    waveSize:(w)=>17+w*3, hpMul:1.70, dmgMul:.45, speedMul:.82,
    boss:{ type:'abyssKing', name:'深渊之王' } }

];

/* ---------------- 怪物定义 ----------------
   ai: chase 追击 / weave 蛇形 / ranged 远程 / teleport 瞬移法师
       dash 冲刺 / suicide 自爆 / summon 召唤            */
const ENEMY_TYPES = {
  skeleton:{ name:'骷髅兵',    hp:26, dmg:8,  speed:78,  radius:15, xp:7,  coin:3, color:'#e6e9f5', color2:'#8d94ab', ai:'chase',    shape:'skull',  atkCd:1.0, knock:1 },
  slime:   { name:'泥沼怪',    hp:44, dmg:10, speed:52,  radius:19, xp:10, coin:4, color:'#6ff0a8', color2:'#2a7d55', ai:'chase',    shape:'blob',   atkCd:1.1, knock:.7 },
  bat:     { name:'噬血蝠',    hp:20, dmg:7,  speed:132, radius:13, xp:8,  coin:3, color:'#c9a7ff', color2:'#6b3fb0', ai:'weave',    shape:'bat',    atkCd:.75, knock:.6 },
  spitter: { name:'酸液喷吐者', hp:34, dmg:11, speed:46, radius:16, xp:13, coin:5, color:'#b6ff6a', color2:'#4c7d17', ai:'ranged',   shape:'blob',   atkCd:1.9, knock:.8, projSpeed:230, range:300 },
  wraith:  { name:'幽魂术士',  hp:38, dmg:12, speed:62,  radius:16, xp:15, coin:6, color:'#9fe8ff', color2:'#3b6ea8', ai:'teleport', shape:'ghost',  atkCd:1.6, knock:.9, projSpeed:250, range:340, attack:'burst3' },
  imp:     { name:'炎魔小鬼',  hp:60, dmg:15, speed:104, radius:16, xp:18, coin:7, color:'#ff9a5c', color2:'#a32f14', ai:'dash',     shape:'imp',    atkCd:1.4, knock:1,  dashSpeed:430 },
  bomber:  { name:'自爆虫',    hp:30, dmg:26, speed:96,  radius:15, xp:14, coin:5, color:'#ffd36a', color2:'#c9491c', ai:'suicide',  shape:'bomb',   atkCd:99,  knock:.5, fuseRange:54 },
  summoner:{ name:'唤灵祭司',  hp:70, dmg:10, speed:50,  radius:18, xp:22, coin:9, color:'#ff7ec1', color2:'#7d1c58', ai:'summon',   shape:'priest', atkCd:3.2, knock:1,  spawnType:'bat', spawnCount:3, range:420 }
};

/* ---------------- 首领定义（多阶段） ---------------- */
const BOSS_TYPES = {
  boneKing:{ name:'骸骨之王', hp:900, dmg:20, speed:66, radius:38, xp:180, coin:120,
    color:'#f0f3ff', color2:'#7a6ba8', shape:'king', phases:[
      { until:1,    shots:0,  spawn:'skeleton', spawnCd:5.5, spawnCount:3, dash:false },
      { until:.5,   shots:8,  spawn:'skeleton', spawnCd:4.5, spawnCount:4, dash:false },
      { until:-1,   shots:12, spawn:'skeleton', spawnCd:3.6, spawnCount:5, dash:true } ] },

  slimeQueen:{ name:'腐沼母巢', hp:1500, dmg:22, speed:52, radius:44, xp:240, coin:160,
    color:'#8affc0', color2:'#1f6b4a', shape:'queen', phases:[
      { until:1,    shots:6,  spawn:'slime', spawnCd:5.0, spawnCount:3, dash:false, lob:true },
      { until:.55,  shots:10, spawn:'slime', spawnCd:4.0, spawnCount:4, dash:false, lob:true },
      { until:-1,   shots:14, spawn:'slime', spawnCd:3.2, spawnCount:5, dash:true,  lob:true } ] },

  frostLord:{ name:'霜噬领主', hp:2100, dmg:25, speed:74, radius:38, xp:320, coin:210,
    color:'#bfe9ff', color2:'#2f5f96', shape:'lord', phases:[
      { until:1,    shots:7,  spawn:'wraith',  spawnCd:5.2, spawnCount:2, dash:false },
      { until:.5,   shots:11, spawn:'spitter', spawnCd:4.2, spawnCount:3, dash:true },
      { until:-1,   shots:15, spawn:'wraith',  spawnCd:3.4, spawnCount:4, dash:true, ring:true } ] },

  magmaTitan:{ name:'熔核泰坦', hp:2900, dmg:30, speed:64, radius:46, xp:420, coin:270,
    color:'#ff9a5c', color2:'#8a2a10', shape:'titan', phases:[
      { until:1,    shots:9,  spawn:'imp',    spawnCd:4.8, spawnCount:3, dash:false, explode:true },
      { until:.5,   shots:13, spawn:'bomber', spawnCd:4.0, spawnCount:3, dash:true,  explode:true },
      { until:-1,   shots:17, spawn:'imp',    spawnCd:3.2, spawnCount:4, dash:true,  explode:true, ring:true } ] },

  sandWyrm:{ name:'噬沙巨虫', hp:1250, dmg:21, speed:58, radius:42, xp:200, coin:135,
    color:'#ffd479', color2:'#7a5218', shape:'wyrm', phases:[
      { until:1,    shots:5,  spawn:'bat',      spawnCd:5.4, spawnCount:3, dash:false, lob:true },
      { until:.55,  shots:9,  spawn:'skeleton', spawnCd:4.4, spawnCount:4, dash:true,  lob:true },
      { until:-1,   shots:13, spawn:'bat',      spawnCd:3.4, spawnCount:5, dash:true,  lob:true, ring:true } ] },

  stormHerald:{ name:'雷暴先驱', hp:2400, dmg:27, speed:82, radius:38, xp:360, coin:235,
    color:'#a8c8ff', color2:'#2a3a86', shape:'herald', phases:[
      { until:1,    shots:8,  spawn:'wraith', spawnCd:5.0, spawnCount:3, dash:false, teleport:true },
      { until:.5,   shots:12, spawn:'imp',    spawnCd:4.0, spawnCount:4, dash:true,  teleport:true },
      { until:-1,   shots:16, spawn:'bat',    spawnCd:3.2, spawnCount:6, dash:true,  teleport:true, ring:true, rage:true } ] },

  stoneWarden:{ name:'磐石守卫', hp:3400, dmg:32, speed:54, radius:48, xp:480, coin:310,
    color:'#c9d6a0', color2:'#4b5535', shape:'warden', phases:[
      { until:1,    shots:8,  spawn:'slime',    spawnCd:5.0, spawnCount:4, dash:false, ring:true },
      { until:.5,   shots:12, spawn:'bomber',   spawnCd:4.0, spawnCount:3, dash:false, ring:true, explode:true },
      { until:-1,   shots:16, spawn:'summoner', spawnCd:3.2, spawnCount:3, dash:true,  ring:true, explode:true, heal:true } ] },

  voidMirror:{ name:'虚空镜灵', hp:4600, dmg:38, speed:88, radius:40, xp:700, coin:450,
    color:'#7ff0ff', color2:'#123a6b', shape:'mirror', phases:[
      { until:1,    shots:11, spawn:'wraith',   spawnCd:4.2, spawnCount:4, dash:true, teleport:true },
      { until:.66,  shots:15, spawn:'summoner', spawnCd:3.8, spawnCount:3, dash:true, teleport:true, ring:true },
      { until:.33,  shots:19, spawn:'imp',      spawnCd:3.2, spawnCount:5, dash:true, teleport:true, ring:true, rage:true },
      { until:-1,   shots:24, spawn:'bomber',   spawnCd:2.8, spawnCount:5, dash:true, teleport:true, ring:true, rage:true, heal:true } ] },

  bloodCountess:{ name:'血影伯爵夫人', hp:3800, dmg:34, speed:86, radius:36, xp:540, coin:340,
    color:'#ff9ecd', color2:'#7d1247', shape:'countess', phases:[
      { until:1,    shots:10, spawn:'bat',      spawnCd:4.4, spawnCount:4, dash:true, teleport:true },
      { until:.5,   shots:14, spawn:'wraith',   spawnCd:3.8, spawnCount:4, dash:true, teleport:true, ring:true },
      { until:-1,   shots:18, spawn:'summoner', spawnCd:3.2, spawnCount:3, dash:true, teleport:true, ring:true, heal:true } ] },

  abyssKing:{ name:'深渊之王', hp:5200, dmg:40, speed:78, radius:48, xp:900, coin:600,
    color:'#c9a2ff', color2:'#3b1878', shape:'abyss', phases:[
      { until:1,     shots:12, spawn:'wraith',   spawnCd:4.4, spawnCount:4, dash:true, ring:true, teleport:true },
      { until:.66,   shots:16, spawn:'imp',      spawnCd:3.8, spawnCount:4, dash:true, ring:true, teleport:true, explode:true },
      { until:.33,   shots:20, spawn:'summoner', spawnCd:3.4, spawnCount:3, dash:true, ring:true, teleport:true, heal:true },
      { until:-1,    shots:26, spawn:'bomber',   spawnCd:2.8, spawnCount:5, dash:true, ring:true, teleport:true, heal:true, rage:true } ] }
};

/* ---------------- 升级池（每次升级三选一） ---------------- */
const UPGRADES = [
  { id:'dmg',       name:'锋刃',   max:99, desc:'攻击力 +14%',              apply:p=>p.dmgMul*=1.14 },
  { id:'aspd',      name:'疾攻',   max:8,  desc:'攻击速度 +12%',            apply:p=>p.atkSpeedMul*=1.12 },
  { id:'hp',        name:'铁躯',   max:99, desc:'生命上限 +20，并回满等量生命', apply:p=>{p.maxHp+=20;p.hp+=20;} },
  { id:'spd',       name:'疾行',   max:8,  desc:'移动速度 +8%',             apply:p=>p.speedMul*=1.08 },
  { id:'crit',      name:'精准',   max:99, desc:'暴击率 +7%',               apply:p=>p.crit+=.07 },
  { id:'critdmg',   name:'致命',   max:99, desc:'暴击伤害 +30%',            apply:p=>p.critMul+=.30 },
  { id:'regen',     name:'再生',   max:8,  desc:'每秒回复 +0.6 生命',       apply:p=>p.regen+=.6 },
  { id:'dash',      name:'瞬步',   max:5,  desc:'闪避冷却 -15%',            apply:p=>p.dashCdMax*=.85 },
  { id:'radius',    name:'长兵',   max:6,  desc:'攻击判定 +12%',            apply:p=>p.atkRange*=1.12 },
  { id:'pierce',    name:'穿透',   max:4,  desc:'挥击多命中 1 个；追猎命中后溅射 1 道', apply:p=>p.pierce+=1 },
  { id:'lifesteal', name:'吸血',   max:8,  desc:'每次命中回复 0.6 生命',     apply:p=>p.lifesteal+=.6 },
  { id:'thorn',     name:'尖刺',   max:8,  desc:'反伤 +6',                  apply:p=>p.thorn+=6 },
  { id:'cdr',       name:'专注',   max:8,  desc:'技能冷却 -12%',            apply:p=>p.cdr*=.88 },
  { id:'proj',      name:'裂空',   max:3,  desc:'追猎伤害 +35%',           apply:p=>p.projCount+=1 },
  { id:'pickup',    name:'磁力',   max:5,  desc:'拾取范围 +35%',            apply:p=>p.pickupRange*=1.35 },
  { id:'shield',    name:'护盾',   max:3,  desc:'每关开始多 1 层护盾',     apply:p=>p.shieldStart+=1 }
];
const UPGRADE_MAP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

/* ---------------- 商店强化（金币永久累积，价格逐次上涨） ---------------- */
const SHOP_ITEMS = [
  { id:'s_maxhp',    name:'生命强化', base:60,  grow:1.5,  desc:'生命上限 +25，并回复等量生命' },
  { id:'s_dmg',      name:'攻击强化', base:70,  grow:1.5,  desc:'攻击力 +8%' },
  { id:'s_aspd',     name:'攻速强化', base:80,  grow:1.55, desc:'攻击速度 +8%' },
  { id:'s_crit',     name:'暴击强化', base:75,  grow:1.5,  desc:'暴击率 +5%' },
  { id:'s_critdmg',  name:'暴伤强化', base:85,  grow:1.55, desc:'暴击伤害 +25%' },
  { id:'s_spd',      name:'疾行强化', base:70,  grow:1.5,  desc:'移动速度 +6%' },
  { id:'s_dashcd',   name:'闪避强化', base:95,  grow:1.6,  desc:'闪避冷却 -12%' },
  { id:'s_cdr',      name:'专注强化', base:100, grow:1.6,  desc:'技能冷却 -10%' },
  { id:'s_regen',    name:'再生强化', base:110, grow:1.6,  desc:'每秒回复 +0.8 生命' },
  { id:'s_thorn',    name:'尖刺强化', base:90,  grow:1.55, desc:'反伤 +8' },
  { id:'s_lifesteal',name:'吸血强化', base:120, grow:1.6,  desc:'每次命中回复 +0.8 生命' },
  { id:'s_range',    name:'长兵强化', base:90,  grow:1.55, desc:'攻击判定 +10%' }
];

/* ---------------- 画布与自适应 ---------------- */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  /* 取 #wrap 的实际渲染尺寸：竖屏兜底旋转时 #wrap 已被换成横屏幅面，
     用它才能拿到与显示一致的逻辑视口，避免主角/怪物被画到可视区外。 */
  const wrap = document.getElementById('wrap');
  const rw = wrap && wrap.clientWidth ? wrap.clientWidth : 0;
  const rh = wrap && wrap.clientHeight ? wrap.clientHeight : 0;
  W = rw || cv.clientWidth || window.innerWidth;
  H = rh || cv.clientHeight || window.innerHeight;
  /* 兜底旋转下 #wrap 的宽高来自 vh/vw，个别浏览器 clientWidth 会滞后，
     用 window 尺寸交叉校正一次 */
  if (!W || !H) { W = window.innerWidth; H = window.innerHeight; }
  cv.width = Math.max(1, Math.floor(W * DPR));
  cv.height = Math.max(1, Math.floor(H * DPR));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);

const SAVE_KEY = 'abyss_hunter_save_v1';
const INVULN_SEC = 1.0;

const state = {
  mode: 'menu', levelIndex: 0, player: null,
  enemies: [], projectiles: [], particles: [], orbs: [], texts: [], zones: [],
  wave: 0, waveTimer: 0, pendingSpawn: 0, spawnTimer: 0, wavePhase: 'intro',
  boss: null, bossActive: false, bossDone: false,
  time: 0, shakeT: 0, shakeMag: 0, hitStop: 0, announceT: 0,
  kills: 0, runCoins: 0, levelUpQueue: 0,
  eliteWave: false, shieldGiven: false, relaxProtectT: 0,
  save: null
};

/* ---------------- 存档 ---------------- */
function defaultSave() { return { unlocked: 1, coins: 0, best: {}, permanent: {} }; }
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const s = JSON.parse(raw);
    return { unlocked: s.unlocked || 1, coins: s.coins || 0, best: s.best || {}, permanent: s.permanent || {} };
  } catch (e) { return defaultSave(); }
}
function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.save)); } catch (e) {}
}
state.save = loadSave();

/* ---------------- 输入 ---------------- */
const keys = Object.create(null);
const mouse = { x: 0, y: 0, down: false };
const touch = {
  active: false, stickId: null,
  move: { x: 0, y: 0 },
  ox: 0, oy: 0,
  holding: Object.create(null),   // 当前按住攻击的手指数（用于 按住=回旋斩）
};
/* 触摸控件自适应当前视口。
   思路：在“短边 320px（小手机）”到“短边 1100px（大平板）”之间做平滑映射，
   映射区间 [0.86, 1.42] 经过缓动，避免小屏过小、大平板过早顶到上限。
   只写 --tscale，其余尺寸/间距全部由 CSS 变量推导，避免样式失配。 */
let TS = 1;
let STICK_R = 56;
function computeTS() {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const lo = 320, hi = 1100;                       // 短边参考区间
  let t = (vmin - lo) / (hi - lo);
  t = Math.max(0, Math.min(1, t));
  t = t * t * (3 - 2 * t);                         // smoothstep 缓动，过渡更自然
  return 0.86 + t * (1.42 - 0.86);
}
function updateTouchScale() {
  TS = computeTS();
  document.documentElement.style.setProperty('--tscale', TS.toFixed(3));
  STICK_R = 56 * TS;                               // 摇杆可拖拽半径随尺寸缩放
  const s = document.getElementById('stick');
  if (s && touch.stickId !== null) {               // 拖拽中尺寸变化，按新半径重新居中
    const r = s.offsetWidth / 2 || 66 * TS;
    s.style.left = (touch.ox - r) + 'px';
    s.style.top = (touch.oy - r) + 'px';
  }
}
updateTouchScale();

function detectTouch() {
  const coarse = window.matchMedia && window.matchMedia('(hover:none) and (pointer:coarse)').matches;
  return !!coarse || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}
touch.active = detectTouch();
document.documentElement.classList.toggle('is-touch', touch.active);

function stickEl() { return document.getElementById('stick'); }
function knobEl() { return document.getElementById('stickKnob'); }

function stickShow(x, y) {
  const s = stickEl(); if (!s) return;
  const r = s.offsetWidth / 2 || 66 * TS;   // 按实际渲染半径居中，适配任意尺寸
  s.style.left = (x - r) + 'px';
  s.style.top = (y - r) + 'px';
  s.classList.add('on');
  const k = knobEl();
  if (k) k.style.transform = 'translate(0,0)';
}
function stickHide() {
  const s = stickEl(); if (!s) return;
  s.classList.remove('on');
}
function stickUpdate(dx, dy) {
  const d = Math.hypot(dx, dy);
  let kx = dx, ky = dy;
  if (d > STICK_R) { kx = dx / d * STICK_R; ky = dy / d * STICK_R; }
  const k = knobEl();
  if (k) k.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
  const nx = kx / STICK_R, ny = ky / STICK_R;
  const nl = Math.hypot(nx, ny);
  const dead = .18;
  if (nl < dead) { touch.move.x = 0; touch.move.y = 0; return; }
  const sc = Math.min(1, (nl - dead) / (1 - dead)) / nl;
  touch.move.x = nx * sc;
  touch.move.y = ny * sc;
}

function onTouchStart(e) {
  if (!touch.active || state.mode !== 'playing') return;
  const r = cv.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const pt = mapPointer(t.clientX - r.left, t.clientY - r.top);
    const x = pt.x, y = pt.y;
    if (x < W * .5) {
      if (touch.stickId !== null) continue;
      touch.stickId = t.identifier;
      touch.ox = x; touch.oy = y;
      stickShow(x, y);
    } else {
      mouse.x = x; mouse.y = y; mouse.down = true;
      touch.holding[t.identifier] = true;
    }
  }
  e.preventDefault();
}
function onTouchMove(e) {
  if (!touch.active || state.mode !== 'playing') return;
  const r = cv.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const pt = mapPointer(t.clientX - r.left, t.clientY - r.top);
    const x = pt.x, y = pt.y;
    if (t.identifier === touch.stickId) stickUpdate(x - touch.ox, y - touch.oy);
    else {
      mouse.x = x; mouse.y = y; mouse.down = true;
      touch.holding[t.identifier] = true;
    }
  }
  e.preventDefault();
}
function onTouchEnd(e) {
  if (!touch.active) return;
  for (const t of e.changedTouches) {
    if (t.identifier === touch.stickId) {
      touch.stickId = null;
      touch.move.x = 0; touch.move.y = 0;
      stickHide();
    } else {
      delete touch.holding[t.identifier];
      mouse.down = Object.keys(touch.holding).length > 0;
    }
  }
}

cv.addEventListener('touchstart', onTouchStart, { passive: false });
cv.addEventListener('touchmove', onTouchMove, { passive: false });
cv.addEventListener('touchend', onTouchEnd, { passive: false });
cv.addEventListener('touchcancel', onTouchEnd, { passive: false });

/* 右侧虚拟按钮：按下即触发，避免 click 300ms 延迟 */
function bindTouchBtn(id, onDown, onUp) {
  const el = document.getElementById(id);
  if (!el) return;
  let held = false;
  const down = (e) => {
    if (held) return;
    held = true;
    el.classList.add('held');
    if (onDown) onDown();
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  };
  const up = (e) => {
    if (!held) return;
    held = false;
    el.classList.remove('held');
    if (onUp) onUp();
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
  };
  el.addEventListener('touchstart', down, { passive: false });
  el.addEventListener('touchend', up, { passive: false });
  el.addEventListener('touchcancel', up, { passive: false });
  el.addEventListener('mousedown', down);
  el.addEventListener('mouseup', up);
  el.addEventListener('mouseleave', up);
}
function initTouchControls() {
  if (!document.getElementById('tbQ')) return;
  bindTouchBtn('tbQ', () => { if (state.mode === 'playing') useSkill(0); });
  bindTouchBtn('tbE', () => { if (state.mode === 'playing') useSkill(1); });
  bindTouchBtn('tbR', () => { if (state.mode === 'playing') useSkill(2); });
  bindTouchBtn('tbDash', () => { if (state.mode === 'playing') tryDash(); });
  bindTouchBtn('tbPause', () => { togglePause(); });
  const wrap = document.getElementById('touchBtns');
  if (wrap) wrap.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}
function touchMoveVector() {
  if (!touch.active || touch.stickId === null) return null;
  if (touch.move.x === 0 && touch.move.y === 0) return null;
  return touch.move;
}

/* 默认横屏：能锁就锁（Screen Orientation API），锁不了就用 CSS 兜底旋转 90 度，
   竖屏设备也直接以横屏画面呈现，不需要玩家自己切换方向。 */
function applyOrientation() {
  const portrait = window.innerHeight > window.innerWidth;
  const changed = document.documentElement.classList.contains('portrait-fallback') !== portrait;
  document.documentElement.classList.toggle('portrait-fallback', portrait);
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});   // 需全屏/受信任环境，失败则静默兜底
  }
  /* 兜底旋转改变了 #wrap 的宽高幅面，必须重算画布尺寸与逻辑视口，
     否则 W/H 仍是竖屏值，主角与怪物会被绘制到可视区之外。 */
  resize();
  if (changed) {
    /* 布局（vh/vw 解析）在本帧后稳定，下一帧再校正一次尺寸 */
    requestAnimationFrame(() => { resize(); if (state.player && state.mode === 'playing') {
      state.player.x = Math.min(state.player.x, W - state.player.radius);
      state.player.y = Math.min(state.player.y, H - state.player.radius);
    } });
  }
}
/* 兜底旋转后，屏幕坐标系旋转了 90 度：把指针/触摸换算回逻辑坐标，保证操作准确 */
function mapPointer(cx, cy) {
  const w = window.innerWidth, h = window.innerHeight;
  if (document.documentElement.classList.contains('portrait-fallback')) {
    return { x: cy, y: w - cx, width: h, height: w };
  }
  return { x: cx, y: cy, width: w, height: h };
}
function applyOrientationSoon() { setTimeout(applyOrientation, 60); }
window.addEventListener('orientationchange', () => { updateTouchScale(); applyOrientationSoon(); });
window.addEventListener('resize', () => { updateTouchScale(); applyOrientationSoon(); });
setTimeout(() => { updateTouchScale(); applyOrientation(); }, 60);
document.addEventListener('visibilitychange', () => { if (!document.hidden) applyOrientation(); });
document.addEventListener('fullscreenchange', () => applyOrientation());

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (keys[k]) return;
  keys[k] = true;
  if (k === 'p' || k === 'escape') { togglePause(); return; }
  if (state.mode === 'playing') {
    if (k === 'q') useSkill(0);
    if (k === 'e') useSkill(1);
    if (k === 'r') useSkill(2);
    if (k === 'shift') tryDash();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  mouse.down = false;
  touch.stickId = null; touch.move.x = 0; touch.move.y = 0; stickHide();
});
cv.addEventListener('mousemove', (e) => {
  const r = cv.getBoundingClientRect();
  const pt = mapPointer(e.clientX - r.left, e.clientY - r.top);
  mouse.x = pt.x; mouse.y = pt.y;
});
cv.addEventListener('mousedown', (e) => { if (e.button === 0 && state.mode === 'playing') mouse.down = true; });
window.addEventListener('mouseup', () => { mouse.down = false; });
cv.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------------- 音效（WebAudio 实时合成，无音频文件） ---------------- */
let actx = null;
function audio() {
  if (actx) return actx;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
  return actx;
}
function beep(freq, dur, type = 'sine', vol = .035, slideTo = null) {
  const a = audio(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), a.currentTime + dur);
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch (e) {}
}
const sfx = {
  hit:  () => beep(rand(360, 480), .07, 'sine', .018, 300),
  crit: () => beep(560, .12, 'triangle', .028, 420),
  hurt: () => beep(240, .14, 'sine', .028, 180),
  levelup: () => { beep(520, .12, 'sine', .03); setTimeout(() => beep(780, .18, 'sine', .03), 100); },
  dash: () => beep(560, .10, 'sine', .018, 820),
  skill: () => beep(320, .16, 'sine', .026, 560),
  boom: () => beep(120, .26, 'sine', .03, 72),
  boss: () => { beep(180, .38, 'sine', .03, 120); setTimeout(() => beep(140, .42, 'sine', .026, 96), 220); },
  die:  () => beep(300, .30, 'sine', .026, 170),
  win:  () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .20, 'sine', .032), i * 140)),
  coin: () => beep(880, .05, 'sine', .014, 1040)
};

/* ---------------- 屏幕效果 / 飘字 / 粒子 ---------------- */
function shake(mag, dur) { state.shakeMag = Math.max(state.shakeMag, mag); state.shakeT = Math.max(state.shakeT, dur); }
function hitStop(d) { state.hitStop = Math.max(state.hitStop, d); }
function addText(x, y, text, color, size = 14, vy = -46) {
  state.texts.push({ x, y, text, color, size, t: 0, life: .85, vy });
}
function spawnParticles(x, y, n, color, speed = 150, life = .5, size = 3) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(speed * .3, speed);
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rand(life * .5, life), color, size: rand(size * .6, size * 1.5) });
  }
}

/* ---------------- 玩家 ---------------- */
function makePlayer(prev) {
  const p = {
    x: W / 2, y: H / 2, vx: 0, vy: 0, radius: 16,
    level: 1, xp: 0, xpNext: 12,
    maxHp: 320, hp: 320,
    baseDmg: 36, dmgMul: 1, atkSpeedMul: 1.15, speedMul: 1,
    crit: .08, critMul: 1.6,
    regen: 2.2, lifesteal: 0, thorn: 0, cdr: .8,
    atkRange: 96, pierce: 2, projCount: 1, pickupRange: 105,
    /* 刀身与判定分离：刀只画到 swordLen，命中判定用 atkRange（刀短了但更准） */
    swordLen: 58, knockForce: 430, blockMax: 5, block: 5, blockCd: 0,
    parryT: 0, atkCd: 0, combo: 0, comboWindow: 0, spinBonus: 0,
    dashCdMax: 1.1, dashCd: 0, dashT: 0, dashDur: .16, dashDir: { x: 1, y: 0 },
    invuln: 0, shield: 0, shieldStart: 0,
    atkTimer: 0, atkAnim: 0, facing: { x: 1, y: 0 },
    skills: [
      { name:'斩击', cd: 2.4, t: 0, key:'Q' },
      { name:'旋风', cd: 6.5, t: 0, key:'E' },
      { name:'追猎', cd: 9.0, t: 0, key:'R' }
    ],
    upgrades: {}, hurtFlash: 0
  };
  if (prev) {
    p.level = prev.level; p.xp = prev.xp; p.xpNext = prev.xpNext;
    p.maxHp = prev.maxHp;
    p.baseDmg = prev.baseDmg; p.dmgMul = prev.dmgMul; p.atkSpeedMul = prev.atkSpeedMul;
    p.speedMul = prev.speedMul; p.crit = prev.crit; p.critMul = prev.critMul;
    p.regen = prev.regen; p.lifesteal = prev.lifesteal; p.thorn = prev.thorn; p.cdr = prev.cdr;
    p.atkRange = prev.atkRange; p.swordLen = prev.swordLen; p.knockForce = prev.knockForce;
    p.blockMax = prev.blockMax; p.block = prev.blockMax;
    p.pickupRange = prev.pickupRange; p.dashCdMax = prev.dashCdMax;
    p.upgrades = Object.assign({}, prev.upgrades);
    p.shieldStart = prev.shieldStart;
  }
  p.hp = p.maxHp;
  p.shield = p.shieldStart;
  return p;
}
const playerDmg = (p) => p.baseDmg * p.dmgMul;
const playerSpeed = (p) => 250 * p.speedMul;
/* 基础攻速：连击越长挥刀越快，最后一刀略慢但击退更强 */
const playerAtkCd = (p) => (p.combo === 2 ? .30 : .25) / p.atkSpeedMul;

/* ---------------- 怪物生成 ---------------- */
function spawnEnemy(type, x, y, opts = {}) {
  const base = ENEMY_TYPES[type];
  const li = state.levelIndex;
  const elite = !!opts.elite;
  const hpMul = opts.hpMul != null ? opts.hpMul : LEVELS[li].hpMul;
  const dmgMul = opts.dmgMul != null ? opts.dmgMul : LEVELS[li].dmgMul;
  const spMul = opts.spMul != null ? opts.spMul : LEVELS[li].speedMul;
  const e = Object.assign({}, base, {
    type, x, y,
    maxHp: base.hp * hpMul * (elite ? 1.9 : 1),
    speed: base.speed * spMul,
    dmg: base.dmg * dmgMul * (elite ? 1.3 : 1),
    atkTimer: rand(0, .6), hurt: 0, knockX: 0, knockY: 0,
    wob: rand(0, Math.PI * 2),
    dashCd: rand(2.2, 3.6), dashing: 0, fuse: 0,
    spawnCd: rand(1.6, 3.2), attackTimer: base.atkCd, teleCd: rand(1.5, 3),
    touchCd: 0, thornTick: 0, hpBar: 0, elite, dead: false, isBoss: false
  });
  e.hp = e.maxHp;
  state.enemies.push(e);
  return e;
}
function spawnBoss() {
  const def = BOSS_TYPES[LEVELS[state.levelIndex].boss.type];
  const li = state.levelIndex;
  const b = {
    type:'boss', isBoss:true, name:def.name, shape:def.shape,
    x: W / 2, y: H * .25,
    maxHp: def.hp * (1 + li * .06) * .62, dmg: def.dmg * (1 + li * .05) * .22,
    speed: def.speed * .68, radius: def.radius,
    color: def.color, color2: def.color2,
    phases: def.phases, phaseIdx: 0,
    angle: 0, shotCd: 1.8, spawnCd: 3.5, dashCd: 3.2, dashing: 0, teleCd: 4,
    hurt: 0, knockX: 0, knockY: 0, touchCd: 0,
    xp: def.xp, coin: def.coin, spawnAnim: 1.4, dead: false
  };
  b.hp = b.maxHp;
  state.boss = b;
  state.bossActive = true;
  sfx.boss();
  announce(def.name, '首 领 降 临');
}
function currentPhase(b) {
  const r = b.hp / b.maxHp;
  for (const ph of b.phases) if (r > ph.until) return ph;
  return b.phases[b.phases.length - 1];
}

/* ---------------- 伤害结算 ---------------- */
/* 找出离某个坐标最近的活怪（含激活中的首领）；没有就返回 null */
function nearestEnemyTo(x, y) {
  let best = null, bd = Infinity;
  for (const e of state.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bd) { bd = d; best = e; }
  }
  if (state.boss && state.bossActive && !state.boss.dead) {
    const d = Math.hypot(state.boss.x - x, state.boss.y - y);
    if (d < bd) { bd = d; best = state.boss; }
  }
  return best;
}
function damageEnemy(e, dmg, opts = {}) {
  if (e.dead) return;
  const crit = !!opts.crit;
  const final = Math.max(1, Math.round(dmg * (crit ? state.player.critMul : 1)));
  e.hp = Math.max(0, e.hp - final); e.hurt = .12; e.hpBar = 2.2;
  if (opts.knock && state.player) {
    const a = Math.atan2(e.y - opts.ky, e.x - opts.kx);
    const kf = e.isBoss ? .16 : 1;
    e.knockX = Math.cos(a) * (opts.knockForce || 190) * kf;
    e.knockY = Math.sin(a) * (opts.knockForce || 190) * kf;
  }
  addText(e.x + rand(-8, 8), e.y - e.radius - 6, String(final), crit ? '#ffe066' : '#ffffff', crit ? 18 : 14);
  spawnParticles(e.x, e.y, crit ? 8 : 4, crit ? '#ffe066' : e.color, 150, .35, 2.6);
  if (state.player.lifesteal > 0) healPlayer(state.player.lifesteal, false);
  if (crit) sfx.crit(); else sfx.hit();
  if (e.hp <= 0) killEnemy(e);
}
function healPlayer(v, show = true) {
  const p = state.player;
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + v);
  if (show && p.hp - before > .5) addText(p.x, p.y - 26, '+' + Math.round(p.hp - before), '#7dffa5', 14);
}
function damagePlayer(dmg) {
  const p = state.player;
  if (!p || state.mode !== 'playing') return;
  if (p.invuln > 0 || p.dashT > 0) return;
  if (state.relaxProtectT > 0) return;   // 减压保护：本关开局前 3 秒不受伤害
  if (p.shield > 0) {
    p.shield--; p.invuln = .8;
    addText(p.x, p.y - 28, '护盾抵消', '#7fe6ff', 15);
    spawnParticles(p.x, p.y, 14, '#7fe6ff', 190, .45, 3);
    beep(500, .14, 'sine', .05, 900);
    return;
  }
  p.hp -= dmg; p.hurtFlash = .3; p.invuln = INVULN_SEC;
  shake(7, .22); hitStop(.05); sfx.hurt();
  addText(p.x, p.y - 28, '-' + Math.round(dmg), '#ff7a90', 15);
  spawnParticles(p.x, p.y, 8, '#ff5470', 170, .4, 3);
  if (p.hp <= 0) { p.hp = 0; playerDie(); }
}
function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  state.kills++;
  spawnParticles(e.x, e.y, e.isBoss ? 60 : 12, e.color, e.isBoss ? 380 : 190, e.isBoss ? 1.1 : .55, e.isBoss ? 5 : 3);
  state.orbs.push({ x:e.x, y:e.y, vx:rand(-60,60), vy:rand(-60,60), t:0, xp:e.xp, coin:e.coin, r:e.isBoss ? 16 : 7 });
  if (e.isBoss) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      state.orbs.push({ x:e.x, y:e.y, vx:Math.cos(a)*150, vy:Math.sin(a)*150, t:0, xp:Math.round(e.xp/12), coin:Math.round(e.coin/12), r:9 });
    }
    state.bossActive = false;
    state.bossDone = true;
    shake(18, .6);
    setTimeout(() => { if (state.mode === 'playing') levelCleared(); }, 950);
  } else {
    sfx.die();
  }
  state.enemies = state.enemies.filter(x => x !== e);
}

function explodeEnemy(e) {
  const p = state.player;
  if (p && dist(e, p) < 92) damagePlayer(e.dmg);
  state.zones.push({ x:e.x, y:e.y, r:0, rMax:92, t:0, life:.34, color:'#ffb04d', kind:'boom' });
  spawnParticles(e.x, e.y, 26, '#ffb04d', 260, .55, 4);
  shake(8, .22); sfx.boom();
  e.dead = true;
  state.orbs.push({ x:e.x, y:e.y, vx:0, vy:0, t:0, xp:e.xp, coin:e.coin, r:7 });
  state.enemies = state.enemies.filter(x => x !== e);
}

/* ---------------- 界面切换 ---------------- */
const screens = {
  menu: document.getElementById('menu'),
  levelSelect: document.getElementById('levelSelect'),
  shop: document.getElementById('shop'),
  pause: document.getElementById('pause'),
  gameOver: document.getElementById('gameOver')
};
/* luPanel 不是整屏界面，它嵌在商店（结算页）里，由 openLevelUp/closeLevelUp 单独控制。 */
function showScreen(name) {
  for (const k in screens) {
    screens[k].classList.toggle('hidden', k !== name);
  }
  const hud = document.getElementById('hud');
  hud.style.opacity = name ? '0' : '1';
  hud.style.pointerEvents = 'none';
  document.getElementById('skillBar').style.display = name ? 'none' : 'flex';
}
function announce(title, sub) {
  const c = document.getElementById('center');
  document.getElementById('centerTitle').textContent = title;
  document.getElementById('centerSub').textContent = sub || '';
  c.style.display = 'block';
  c.style.opacity = '1';
  state.announceT = 2.2;
}
function fillStats(pairs) {
  document.getElementById('goStats').innerHTML =
    pairs.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
}
function togglePause() {
  if (state.mode === 'playing') {
    state.mode = 'pause'; closeLevelUp(); showScreen('pause');
  } else if (state.mode === 'pause') {
    state.mode = 'playing'; showScreen(null);
    /* 升级只在通关结算里选，恢复战斗时不再挂面板。 */
  }
}

/* ---------------- 玩家技能（普攻 / 闪避 / QER） ---------------- */
/* 是否"按住"攻击：鼠标左键、空格或触屏按住。
   未按住时按单次朝向挥刀，按住时进入整圈回旋斩。 */
function isHeldAttack() {
  if (keys[" "] || mouse.down) return true;
  /* 触屏：右半屏按住即回旋斩。不额外要求"左手没在推摇杆"，
     否则边移动边长按时会打不出整圈攻击。 */
  if (touch.active) {
    const held = touch.holding;
    if (held) { for (const k in held) if (held[k]) return true; }
  }
  return false;
}
/* 挥刀：按住不动时化身回旋斩——伤害与击退覆盖身周整整一圈，
   把靠近的怪全部甩到圈外；单点/短按仍是朝向前方的一道快刀。
   连击：第 1/2 刀更快，第 3 刀更慢但击退翻倍。 */
function playerAttack() {
  const p = state.player;
  if (!p || p.atkCd > 0) return;
  p.combo = p.comboWindow > 0 ? (p.combo + 1) % 3 : 0;
  p.comboWindow = .48;
  p.atkCd = playerAtkCd(p);
  p.atkAnim = 1;
  /* 按住不动 = 回旋斩：整圈覆盖 */
  const spin = isHeldAttack();
  if (spin) p.spinBonus = Math.min(1.2, p.spinBonus + .18);   // 连续回旋越转越猛，最多 +120%
  const range = p.atkRange * (spin ? 1.55 : 1.35);
  const arc = spin ? Math.PI * 2 : Math.PI * 1.25;            // 一圈 或 前方扇区
  const fa = Math.atan2(p.facing.y, p.facing.x);
  const heavy = p.combo === 2;                                // 第 3 刀为重击
  const knock = p.knockForce * (heavy ? 2.1 : 1) * (1 + p.spinBonus);
  let hits = 0;
  const maxHits = (spin ? 18 : 10) + p.pierce;                  // 回旋斩能同时甩开更多目标
  const targets = state.enemies.slice();
  if (state.boss && state.bossActive) targets.push(state.boss);
  for (const e of targets) {
    if (hits >= maxHits) break;
    const d = dist(e, p);
    if (d > range + e.radius) continue;
    if (!spin) {                                              // 非回旋时只打身前扇区
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const diff = Math.abs(((a - fa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (diff > arc / 2) continue;
    }
    hits++;
    damageEnemy(e, playerDmg(p) * (heavy ? 1.25 : 1), { crit: Math.random() < p.crit, knock: !e.isBoss, kx: p.x, ky: p.y, knockForce: knock });
  }
  const guard = lungeGuard(p, fa, spin);                     // 挥刀即格挡（回旋时整圈推挤）
  /* 特效：回旋斩画出完整一圈刀光，普通刀只画身前弧光 */
  if (spin) {
    state.particles.push({ slash:true, x:p.x, y:p.y, ang:0, t:0, life:.2, vx:0, vy:0, color:'#dff0ff', size:p.atkRange * 1.9, full:true });
  } else {
    state.particles.push({ slash:true, x:p.x + p.facing.x * 26, y:p.y + p.facing.y * 26, ang:fa, t:0, life:.16, vx:0, vy:0, color:'#dff0ff', size:p.atkRange * .78 });
  }
  if (hits > 0 || guard > 0) { hitStop(.03); shake(spin ? 3.6 : 2.8, .08); }
}

/* 主动格挡：把扇形（回旋时整圈）内的目标推开，并给很短的无敌帧与招架窗口。
   格挡槽耗尽时退化为普通击退，保证普攻永远可用、不会卡死。 */
function lungeGuard(p, fa, fullCircle) {
  const pushR = p.atkRange * (fullCircle ? 1.18 : .92);
  const pushArc = fullCircle ? Math.PI * 2 : Math.PI * .84;
  const active = p.block > 0 && p.blockCd <= 0;
  let n = 0;
  const targets = state.enemies.slice();
  if (state.boss && state.bossActive) targets.push(state.boss);
  for (const e of targets) {
    const d = dist(e, p);
    if (d > pushR + e.radius) continue;
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    const diff = Math.abs(((a - fa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (diff > pushArc / 2) continue;
    const kf = (active ? p.knockForce * 1.5 : p.knockForce) * (e.isBoss ? .2 : 1);
    e.knockX = Math.cos(a) * kf; e.knockY = Math.sin(a) * kf;
    if (active) { spawnParticles(e.x, e.y, 3, '#9fe8ff', 120, .3, 2.4); n++; }
  }
  if (active) {
    p.block--; p.blockCd = .32;
    p.parryT = .26;                                  // 招架窗口：反弹飞行道具
    p.invuln = Math.max(p.invuln, .18);
  }
  return n;
}
function tryDash() {
  const p = state.player;
  if (!p || p.dashCd > 0) return;
  let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  const tmv = touchMoveVector();
  if (tmv) { dx += tmv.x; dy += tmv.y; }
  if (!dx && !dy) { dx = p.facing.x; dy = p.facing.y; }
  const len = Math.hypot(dx, dy) || 1;
  p.dashDir = { x: dx / len, y: dy / len };
  p.dashT = p.dashDur;
  p.dashCd = p.dashCdMax;
  p.invuln = Math.max(p.invuln, p.dashDur + .08);
  sfx.dash();
  spawnParticles(p.x, p.y, 12, '#9fe8ff', 160, .35, 2.6);
}
function useSkill(i) {
  const p = state.player;
  if (!p) return;
  const s = p.skills[i];
  if (!s || s.t > 0) return;
  s.t = s.cd * p.cdr;
  const dmg = playerDmg(p);
  const fa = Math.atan2(p.facing.y, p.facing.x);

  if (i === 0) {                              // Q：前方大范围斩击 + 击退
    sfx.skill();
    const range = p.atkRange * 1.7, arc = Math.PI * 1.15;
    const targets = state.enemies.slice();
    if (state.boss && state.bossActive) targets.push(state.boss);
    for (const e of targets) {
      const d = dist(e, p);
      if (d > range + e.radius) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      if (Math.abs(((a - fa + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > arc / 2) continue;
      damageEnemy(e, dmg * 2.2, { crit: Math.random() < p.crit, knock: !e.isBoss, kx: p.x, ky: p.y, knockForce: 520 * (1 + p.spinBonus) });
    }
    lungeGuard(p, fa);
    p.block = Math.min(p.blockMax, p.block + 1);      // 主动技能回一格格挡
    state.zones.push({ x:p.x, y:p.y, rMax:range, t:0, life:.28, color:'#cfe6ff', kind:'ring' });
    shake(6, .18);
  } else if (i === 1) {                       // E：自身周围持续旋风
    sfx.skill();
    state.zones.push({ x:p.x, y:p.y, r:p.atkRange * 1.5, rMax:p.atkRange * 1.5, t:0, life:.85, color:'#9fe8ff', kind:'spin', follow:true, tick:0, dmg:dmg * .9, knock:p.knockForce * .9 });
    p.block = Math.min(p.blockMax, p.block + 1);
    p.invuln = Math.max(p.invuln, .22);
    shake(5, .2);
  } else {                                    // R：锁定全场，点一下自动命中所有怪物
    sfx.skill();
    /* 目标清单：屏幕上的全部小怪 + 激活中的首领（首领不重复计） */
    const targets = state.enemies.filter(e => !e.dead);
    if (state.boss && state.bossActive && !state.boss.dead) targets.push(state.boss);
    if (!targets.length) {                     // 场上没怪时只放一道朝向前方的空斩，避免"点了没反应"
      const a = Math.atan2(p.facing.y, p.facing.x);
      state.projectiles.push({ friendly:true, x:p.x, y:p.y, vx:Math.cos(a)*520, vy:Math.sin(a)*520,
        r:16, dmg:dmg * 1.5, pierce:0, t:0, life:.5, color:'#9fe8ff', wave:true });
      shake(6, .2);
      return;
    }
    /* 每只怪都锁定一道追踪光刃：home 目标、必中、命中后分裂出额外光刃（穿透强化继续生效） */
    const extra = Math.max(0, p.pierce);
    const mult = 1.5 + (p.projCount - 1) * .35;   // 裂空：命中伤害随之提高
    for (const e of targets) {
      state.projectiles.push({
        friendly:true, homing:true, target:e, x:p.x, y:p.y,
        vx:Math.cos(Math.atan2(e.y - p.y, e.x - p.x)) * 620,
        vy:Math.sin(Math.atan2(e.y - p.y, e.x - p.x)) * 620,
        r:15, dmg:dmg * mult, pierce:0, extraSplits:extra,
        t:0, life:1.6, color:'#9fe8ff', wave:true, trail:[]
      });
    }
    shake(7, .24);
  }
}

/* ---------------- 敌人 AI ---------------- */
function enemyShoot(e, ang) {
  state.projectiles.push({ friendly:false, x:e.x, y:e.y,
    vx:Math.cos(ang) * (e.projSpeed || 220), vy:Math.sin(ang) * (e.projSpeed || 220),
    r:9, dmg:e.dmg, t:0, life:3.2, color:e.color });
  beep(360, .07, 'sine', .012, 280);
}
function updateEnemy(e, dt) {
  const p = state.player;
  if (!p) return;
  const d = dist(e, p);
  e.wob += dt * 3;
  if (e.hurt > 0) e.hurt -= dt;
  if (e.hpBar > 0) e.hpBar -= dt;
  if (e.touchCd > 0) e.touchCd -= dt;

  e.x += e.knockX * dt; e.y += e.knockY * dt;
  e.knockX *= Math.pow(.001, dt); e.knockY *= Math.pow(.001, dt);

  if (e.dashing > 0) {
    e.dashing -= dt;
    e.x += e.dashVX * dt; e.y += e.dashVY * dt;
  } else {
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    switch (e.ai) {
      case 'chase':
        e.x += Math.cos(ang) * e.speed * dt;
        e.y += Math.sin(ang) * e.speed * dt;
        break;
      case 'weave': {
        const perp = ang + Math.PI / 2, s = Math.sin(e.wob) * .7;
        e.x += (Math.cos(ang) + Math.cos(perp) * s) * e.speed * dt;
        e.y += (Math.sin(ang) + Math.sin(perp) * s) * e.speed * dt;
        break;
      }
      case 'ranged': {
        const want = (e.range || 300) * .62;
        const dir = d > want ? 1 : -1;
        e.x += Math.cos(ang) * e.speed * dir * dt;
        e.y += Math.sin(ang) * e.speed * dir * dt;
        e.attackTimer -= dt;
        if (e.attackTimer <= 0 && d < (e.range || 300)) { e.attackTimer = e.atkCd; enemyShoot(e, ang); }
        break;
      }
      case 'teleport': {
        const want = (e.range || 320) * .6;
        if (d > want) { e.x += Math.cos(ang) * e.speed * dt; e.y += Math.sin(ang) * e.speed * dt; }
        e.attackTimer -= dt;
        e.teleCd -= dt;
        if (e.teleCd <= 0) {
          e.teleCd = rand(2.4, 4.2);
          spawnParticles(e.x, e.y, 10, e.color, 140, .4, 2.6);
          const na = rand(0, Math.PI * 2), nd = rand(140, 240);
          e.x = clamp(p.x + Math.cos(na) * nd, 40, W - 40);
          e.y = clamp(p.y + Math.sin(na) * nd, 40, H - 40);
          spawnParticles(e.x, e.y, 10, e.color, 140, .4, 2.6);
        }
        if (e.attackTimer <= 0 && d < (e.range || 340)) {
          e.attackTimer = e.atkCd;
          const n = e.attack === 'burst3' ? 3 : 1;
          for (let i = 0; i < n; i++) enemyShoot(e, ang + (i - (n - 1) / 2) * .2);
        }
        break;
      }
      case 'dash': {
        e.x += Math.cos(ang) * e.speed * dt;
        e.y += Math.sin(ang) * e.speed * dt;
        e.dashCd -= dt;
        if (e.dashCd <= 0 && d < 320) {
          e.dashCd = rand(2.2, 3.6);
          e.dashing = .26;
          e.dashVX = Math.cos(ang) * (e.dashSpeed || 400);
          e.dashVY = Math.sin(ang) * (e.dashSpeed || 400);
          spawnParticles(e.x, e.y, 8, e.color, 150, .3, 2.6);
        }
        break;
      }
      case 'suicide':
        e.x += Math.cos(ang) * e.speed * dt;
        e.y += Math.sin(ang) * e.speed * dt;
        if (d < (e.fuseRange || 54)) {
          e.fuse += dt;
          if (e.fuse > .55) { explodeEnemy(e); return; }
        } else e.fuse = Math.max(0, e.fuse - dt * .6);
        break;
      case 'summon': {
        const want = (e.range || 420) * .7;
        const dir = d > want ? 1 : -1;
        e.x += Math.cos(ang) * e.speed * dir * dt;
        e.y += Math.sin(ang) * e.speed * dir * dt;
        e.spawnCd -= dt;
        if (e.spawnCd <= 0 && state.enemies.length < 42) {
          e.spawnCd = e.atkCd;
          for (let i = 0; i < (e.spawnCount || 3); i++) {
            const a = rand(0, Math.PI * 2), dd = rand(30, 70);
            spawnEnemy(e.spawnType || 'bat', e.x + Math.cos(a) * dd, e.y + Math.sin(a) * dd, { hpMul:.8 });
          }
          state.zones.push({ x:e.x, y:e.y, rMax:80, t:0, life:.4, color:e.color, kind:'ring' });
        }
        break;
      }
    }
  }

  /* 舒适圈：怪物进入主角附近会被柔和推开，避免贴脸堆叠。 */
  const comfortR = p.radius + 56;
  if (d < comfortR + e.radius) {
    const pa = Math.atan2(e.y - p.y, e.x - p.x);
    const push = Math.min(1, (comfortR + e.radius - d) / 46) * 120;
    e.x += Math.cos(pa) * push * dt;
    e.y += Math.sin(pa) * push * dt;
  }

  if (d < e.radius + p.radius && e.ai !== 'suicide' && e.touchCd <= 0) {
    e.touchCd = .7;
    damagePlayer(e.dmg);
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    p.vx += Math.cos(a) * 160; p.vy += Math.sin(a) * 160;
  }
  e.x = clamp(e.x, e.radius, W - e.radius);
  e.y = clamp(e.y, e.radius, H - e.radius);
}

/* ---------------- BOSS AI（阶段 / 弹幕 / 召唤 / 冲锋 / 瞬移） ---------------- */
function bossShoot(b, a, ph) {
  const speed = ph.lob ? rand(200, 300) : 260;
  state.projectiles.push({ friendly:false,
    x:b.x + Math.cos(a) * b.radius * .7, y:b.y + Math.sin(a) * b.radius * .7,
    vx:Math.cos(a) * speed, vy:Math.sin(a) * speed,
    r:ph.lob ? 12 : 10, dmg:b.dmg * .55, t:0, life:5,
    color:b.color, explode:!!ph.explode });
}
function updateBoss(b, dt) {
  const p = state.player;
  if (!p) return;
  if (b.spawnAnim > 0) { b.spawnAnim -= dt; return; }
  if (b.hurt > 0) b.hurt -= dt;
  if (b.touchCd > 0) b.touchCd -= dt;
  b.angle += dt * .8;
  b.x += b.knockX * dt; b.y += b.knockY * dt;
  b.knockX *= Math.pow(.002, dt); b.knockY *= Math.pow(.002, dt);

  const ph = currentPhase(b);
  const idx = b.phases.indexOf(ph);
  if (idx !== b.phaseIdx) {
    b.phaseIdx = idx;
    shake(14, .5); sfx.boss();
    addText(b.x, b.y - b.radius - 30, '第 ' + (idx + 1) + ' 阶段', '#ffd479', 20, -30);
    spawnParticles(b.x, b.y, 40, b.color, 300, .8, 5);
    if (ph.heal) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * .04);
  }

  const d = dist(b, p);
  const ang = Math.atan2(p.y - b.y, p.x - b.x);

  if (b.dashing > 0) {
    b.dashing -= dt;
    b.x += b.dashVX * dt; b.y += b.dashVY * dt;
  } else {
    const sp = b.speed * (ph.rage ? 1.25 : 1);
    if (d > 100) { b.x += Math.cos(ang) * sp * dt; b.y += Math.sin(ang) * sp * dt; }
    b.dashCd -= dt;
    if (ph.dash && b.dashCd <= 0 && d < 420) {
      b.dashCd = rand(2.6, 4.2);
      b.dashing = .42;
      b.dashVX = Math.cos(ang) * 560; b.dashVY = Math.sin(ang) * 560;
      spawnParticles(b.x, b.y, 18, b.color, 220, .45, 4);
      beep(180, .20, 'sine', .020, 120);
    }
    if (ph.teleport) {
      b.teleCd -= dt;
      if (b.teleCd <= 0) {
        b.teleCd = rand(3.4, 5.2);
        spawnParticles(b.x, b.y, 24, b.color, 200, .5, 4);
        const na = rand(0, Math.PI * 2), nd = rand(180, 300);
        b.x = clamp(p.x + Math.cos(na) * nd, 60, W - 60);
        b.y = clamp(p.y + Math.sin(na) * nd, 60, H - 60);
        spawnParticles(b.x, b.y, 24, b.color, 200, .5, 4);
      }
    }
  }

  b.shotCd -= dt;
  if (b.shotCd <= 0 && ph.shots > 0) {
    b.shotCd = rand(1.5, 2.3) * (ph.rage ? .7 : 1);
    const n = ph.shots;
    if (ph.ring) for (let i = 0; i < n; i++) bossShoot(b, (i / n) * Math.PI * 2 + b.angle, ph);
    else for (let i = 0; i < n; i++) bossShoot(b, ang + (i - (n - 1) / 2) * .16, ph);
    beep(280, .10, 'sine', .014, 210);
  }

  b.spawnCd -= dt;
  if (b.spawnCd <= 0 && state.enemies.length < 40) {
    b.spawnCd = ph.spawnCd;
    for (let i = 0; i < ph.spawnCount; i++) {
      const a = rand(0, Math.PI * 2), dd = rand(60, 150);
      spawnEnemy(ph.spawn, clamp(b.x + Math.cos(a) * dd, 40, W - 40), clamp(b.y + Math.sin(a) * dd, 40, H - 40), { hpMul:.9 });
    }
    state.zones.push({ x:b.x, y:b.y, rMax:160, t:0, life:.5, color:b.color, kind:'ring' });
    spawnParticles(b.x, b.y, 22, b.color, 240, .6, 4);
  }

  if (d < b.radius + p.radius && b.touchCd <= 0) {
    b.touchCd = .8;
    damagePlayer(b.dmg);
    p.vx += Math.cos(ang) * 220; p.vy += Math.sin(ang) * 220;
  }
  b.x = clamp(b.x, b.radius, W - b.radius);
  b.y = clamp(b.y, b.radius, H - b.radius);
}

/* ---------------- 经验 / 范围伤害 ---------------- */
function gainXp(n) {
  const p = state.player;
  p.xp += n;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = Math.round(p.xpNext * 1.32 + 4);
    state.levelUpQueue++;   // 只记账，战斗中完全不打扰玩家
  }
  /* 升级强化统一挪到通关结算时选择，战斗中不再弹窗。 */
}
function burstAt(x, y, radius, dmg) {
  state.zones.push({ x, y, rMax:radius, t:0, life:.3, color:'#ffb04d', kind:'boom' });
  spawnParticles(x, y, 16, '#ffb04d', 220, .5, 3.4);
  for (const e of state.enemies.slice()) if (dist(e, { x, y }) < radius + e.radius) damageEnemy(e, dmg, {});
}

/* ---------------- 主更新 ---------------- */
function update(dt) {
  state.time += dt;
  if (state.relaxProtectT > 0) state.relaxProtectT -= dt;
  if (state.hitStop > 0) { state.hitStop -= dt; dt *= .18; }
  if (state.shakeT > 0) { state.shakeT -= dt; if (state.shakeT <= 0) state.shakeMag = 0; }

  const p = state.player;
  if (!p) return;

  /* 移动 */
  let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  const tmv = touchMoveVector();
  if (tmv) { dx += tmv.x; dy += tmv.y; }
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len; dy /= len;
    p.facing.x = dx; p.facing.y = dy;
  }
  if (p.dashT > 0) {
    p.dashT -= dt;
    p.x += p.dashDir.x * 900 * dt;
    p.y += p.dashDir.y * 900 * dt;
    if (Math.random() < .7) spawnParticles(p.x, p.y, 1, '#9fe8ff', 60, .3, 3);
  } else {
    p.vx = lerp(p.vx, dx * playerSpeed(p), 1 - Math.pow(.0001, dt));
    p.vy = lerp(p.vy, dy * playerSpeed(p), 1 - Math.pow(.0001, dt));
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  p.x = clamp(p.x, p.radius, W - p.radius);
  p.y = clamp(p.y, p.radius, H - p.radius);

  /* 计时器 */
  if (p.atkTimer > 0) p.atkTimer -= dt;
  if (p.atkAnim > 0) p.atkAnim -= dt * 5;
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.hurtFlash > 0) p.hurtFlash -= dt;
  for (const s of p.skills) if (s.t > 0) s.t = Math.max(0, s.t - dt);
  if (p.regen > 0) healPlayer(p.regen * dt, false);

  /* 瞄准：位移时朝向移动方向，平时始终朝向鼠标（触屏跟随手指/准星） */
  if (len > 0) {
    p.facing.x = dx; p.facing.y = dy;
  } else if (Math.hypot(mouse.x - p.x, mouse.y - p.y) > 10) {
    const a = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    p.facing.x = Math.cos(a); p.facing.y = Math.sin(a);
  }
  if (p.atkCd > 0) p.atkCd -= dt;
  if (p.blockCd > 0) p.blockCd -= dt;
  else if (p.block < p.blockMax) p.block = Math.min(p.blockMax, p.block + dt * 1.2);  // 格挡槽自动回复
  if (p.parryT > 0) p.parryT -= dt;                                                  // 招架窗口
  p.comboWindow -= dt;
  if (!isHeldAttack() && p.spinBonus > 0) p.spinBonus = Math.max(0, p.spinBonus - dt * .9);  // 回旋加成缓慢消退
  if (p.comboWindow <= 0) p.combo = 0;                                               // 连击窗口超时重置
  playerAttack();   // 减压休闲版：自动攻击，不需要一直按攻击键

  /* 怪物与首领 */
  for (const e of state.enemies.slice()) updateEnemy(e, dt);
  if (state.boss && state.bossActive) updateBoss(state.boss, dt);

  /* 投射物 */
  for (const pr of state.projectiles.slice()) {
    pr.t += dt;
    /* 追踪光刃：每帧朝锁定目标转向，目标没了/死了就改锁最近的活怪，
       保证点一下就一定命中，不会擦着边飞过去。 */
    if (pr.homing) {
      if (!pr.target || pr.target.dead || pr.target.hp <= 0) {
        pr.target = nearestEnemyTo(pr.x, pr.y);
        if (!pr.target) { state.projectiles = state.projectiles.filter(x => x !== pr); continue; }
      }
      const ta = Math.atan2(pr.target.y - pr.y, pr.target.x - pr.x);
      const ca = Math.atan2(pr.vy, pr.vx);
      let da = ((ta - ca + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const turn = Math.min(Math.abs(da), 7.5 * dt) * Math.sign(da || 1);
      const na = ca + turn;
      const spd = Math.hypot(pr.vx, pr.vy) || 620;
      pr.vx = Math.cos(na) * spd; pr.vy = Math.sin(na) * spd;
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (pr.homing) {                              // 拖尾采样，画一道追踪光刃
      if (!pr.trail) pr.trail = [];
      pr.trail.push({ x: pr.x, y: pr.y });
      if (pr.trail.length > 9) pr.trail.shift();
    }
    if (pr.t > pr.life || pr.x < -60 || pr.x > W + 60 || pr.y < -60 || pr.y > H + 60) {
      state.projectiles = state.projectiles.filter(x => x !== pr);
      continue;
    }
    if (pr.friendly) {
      /* 追踪光刃：锁定目标必然命中（不依赖位置重叠），命中后收束 */
      if (pr.homing) {
        const tgt = pr.target;
        if (tgt && !tgt.dead && dist(pr, tgt) < pr.r + tgt.radius + 26) {
          damageEnemy(tgt, pr.dmg, { crit:Math.random() < state.player.crit,
            knock:!tgt.isBoss, kx:state.player.x, ky:state.player.y, knockForce:tgt.isBoss ? 40 : 200 });
          spawnParticles(tgt.x, tgt.y, 12, '#9fe8ff', 240, .4, 3.2);
          /* 裂空强化：命中后向附近其他怪分裂出额外光刃 */
          if (pr.extraSplits > 0) {
            let split = 0;
            const claimed = new Set([tgt]);
            for (const e of state.enemies.slice()) {
              if (split >= pr.extraSplits) break;
              if (e.dead || claimed.has(e)) continue;
              claimed.add(e);
              state.projectiles.push({ friendly:true, homing:true, target:e, x:tgt.x, y:tgt.y,
                vx:0, vy:0, r:13, dmg:pr.dmg * .8, pierce:0, extraSplits:0, t:0, life:1.2,
                color:'#9fe8ff', wave:true, trail:[] });
              split++;
            }
          }
          state.projectiles = state.projectiles.filter(x => x !== pr);
          continue;
        }
      } else {
        /* 普通穿透弹（含招架反弹回来的）：按位置重叠判定，打满穿透次数后消失 */
        for (const e of state.enemies.slice()) {
          if (pr.pierce <= 0) break;
          if (dist(pr, e) < pr.r + e.radius) {
            damageEnemy(e, pr.dmg, {});
            if (pr.explode) burstAt(pr.x, pr.y, 70, pr.dmg * .6);
            pr.pierce--;
          }
        }
        if (state.boss && state.bossActive && pr.pierce > 0 && dist(pr, state.boss) < pr.r + state.boss.radius) {
          damageEnemy(state.boss, pr.dmg, {});
          pr.pierce--;
        }
        if (pr.pierce <= 0) state.projectiles = state.projectiles.filter(x => x !== pr);
      }
    } else {
      if (dist(pr, p) < pr.r + p.radius + 8) {
        if (p.parryT > 0 && !pr.reflected) {              // 招架：反弹回敌方
          pr.reflected = true; pr.friendly = true; pr.dmg *= 1.4;
          pr.homing = false; pr.target = null; pr.trail = null;   // 反弹后按直线走
          const a = Math.atan2(pr.vy, pr.vx) + Math.PI;
          pr.vx = Math.cos(a) * 560; pr.vy = Math.sin(a) * 560;
          pr.pierce = 3; pr.color = '#ffd479'; pr.life = 1.6;
          addText(p.x, p.y - 30, '招架！', '#ffd479', 16);
          beep(880, .1, 'triangle', .05, 1400);
        } else {
          damagePlayer(pr.dmg);
          if (pr.explode) {
            state.zones.push({ x:pr.x, y:pr.y, rMax:80, t:0, life:.3, color:'#ffb04d', kind:'boom' });
            spawnParticles(pr.x, pr.y, 18, '#ffb04d', 220, .5, 3.5);
            shake(6, .18); sfx.boom();
          }
          state.projectiles = state.projectiles.filter(x => x !== pr);
        }
      }
    }
  }

  /* 技能区域 */
  for (const z of state.zones.slice()) {
    z.t += dt;
    if (z.follow) { z.x = p.x; z.y = p.y; }
    if (z.kind === 'spin') {
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = .14;
        for (const e of state.enemies.slice()) {
          if (dist(e, z) < z.r + e.radius) {
            damageEnemy(e, z.dmg, { knock: !e.isBoss, kx: z.x, ky: z.y, knockForce: (z.knock || 180) });
          }
        }
        if (state.boss && state.bossActive && dist(state.boss, z) < z.r + state.boss.radius) damageEnemy(state.boss, z.dmg, {});
      }
    }
    if (z.t > z.life) state.zones = state.zones.filter(x => x !== z);
  }

  /* 反伤 */
  if (p.thorn > 0) {
    for (const e of state.enemies.slice()) {
      if (dist(e, p) < e.radius + p.radius + 2) {
        e.thornTick -= dt;
        if (e.thornTick <= 0) { e.thornTick = .5; damageEnemy(e, p.thorn, { knock:true, kx:p.x, ky:p.y, knockForce:120 }); }
      }
    }
  }

  /* 经验/金币球 */
  for (const o of state.orbs.slice()) {
    o.t += dt;
    const dd = dist(o, p);
    if (dd < p.pickupRange * 2.6) {
      const a = Math.atan2(p.y - o.y, p.x - o.x);
      const pull = clamp(760 / Math.max(dd, 16), 3, 30);
      o.vx += Math.cos(a) * pull; o.vy += Math.sin(a) * pull;
    }
    o.x += o.vx * dt; o.y += o.vy * dt;
    o.vx *= Math.pow(.25, dt); o.vy *= Math.pow(.25, dt);
    if (dd < p.radius + o.r + 6) {
      gainXp(o.xp);
      state.runCoins += o.coin;
      sfx.coin();
      state.orbs = state.orbs.filter(x => x !== o);
    }
  }

  /* 粒子与飘字 */
  for (const q of state.particles.slice()) {
    q.t += dt;
    if (!q.slash) {
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.vx *= Math.pow(.2, dt); q.vy *= Math.pow(.2, dt);
    }
    if (q.t > q.life) state.particles = state.particles.filter(x => x !== q);
  }
  for (const t of state.texts.slice()) {
    t.t += dt; t.y += t.vy * dt; t.vy *= Math.pow(.3, dt);
    if (t.t > t.life) state.texts = state.texts.filter(x => x !== t);
  }

  updateWaves(dt);
  updateHud();
}

/* ---------------- 关卡流程 ---------------- */
function startLevel(idx, opts = {}) {
  state.levelIndex = idx;
  state.enemies = []; state.projectiles = []; state.particles = [];
  state.orbs = []; state.texts = []; state.zones = [];
  state.boss = null; state.bossActive = false; state.bossDone = false;
  state.wave = 0; state.waveTimer = 0; state.pendingSpawn = 0; state.spawnTimer = 0;
  state.wavePhase = 'intro';
  state.kills = 0; state.runCoins = 0; state.time = 0;
  /* 上一关结算时没选完的升级先自动生效，不能因为玩家直接开下一关就白丢。 */
  drainLevelUpQueue();
  closeLevelUp();
  state.eliteWave = false; state.shieldGiven = false;
  state.relaxProtectT = 3;
  state.player = makePlayer(opts.keepPlayer ? state.player : null);
  state.player.x = W / 2; state.player.y = H / 2;
  mouse.x = W / 2; mouse.y = H / 2 - 120;
  state.mode = 'playing';
  showScreen(null);
  const L = LEVELS[idx];
  document.getElementById('hintKeys').textContent = '自动攻击 · WASD/摇杆移动 · 按住攻击=大圈回旋 · R=全场命中 · 前几秒免伤';
  announce('第 ' + L.id + ' 关 · ' + L.name, L.desc);
  state.waveTimer = 1.8;
}
function edgeSpawnPos() {
  const m = 56, side = randInt(0, 3);
  if (side === 0) return { x: rand(m, W - m), y: m };
  if (side === 1) return { x: W - m, y: rand(m, H - m) };
  if (side === 2) return { x: rand(m, W - m), y: H - m };
  return { x: m, y: rand(m, H - m) };
}
function updateWaves(dt) {
  const L = LEVELS[state.levelIndex];

  // 中央公告淡出
  if (state.announceT > 0) {
    state.announceT -= dt;
    const c = document.getElementById('center');
    if (state.announceT < .5) c.style.opacity = String(clamp(state.announceT / .5, 0, 1));
    if (state.announceT <= 0) c.style.display = 'none';
  }

  const clearedField = state.pendingSpawn <= 0 && state.enemies.length === 0;

  if (state.wavePhase === 'intro' || state.wavePhase === 'gap') {
    // 开场/波间倒计时：时间到且场上清空才开下一波
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      if (state.wave >= L.waves) {
        if (!state.bossActive && !state.bossDone) {
          state.wavePhase = 'boss';
          spawnBoss();
        }
      } else if (clearedField || state.wavePhase === 'intro') {
        state.wave++;
        state.pendingSpawn = L.waveSize(state.wave);
        state.spawnTimer = 0;
        state.eliteWave = state.wave === L.waves;
        state.wavePhase = 'spawning';
        announce('第 ' + state.wave + ' / ' + L.waves + ' 波', state.eliteWave ? '精英潮汐即将到来' : '');
      } else {
        state.waveTimer = .3;   // 场上还有怪，稍后再检查
      }
    }
  }

  // 波次刷怪并发控制
  if (state.pendingSpawn > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.enemies.length < 46) {
      state.spawnTimer = Math.max(.22, .75 - state.wave * .06);
      state.pendingSpawn--;
      const pos = edgeSpawnPos();
      spawnEnemy(pick(L.enemyPool), pos.x, pos.y, { elite: state.eliteWave && Math.random() < .22 });
    }
  }

  // 刷完且场上清空 -> 进入波间隔
  if (state.wavePhase === 'spawning' && state.pendingSpawn <= 0 && state.enemies.length === 0) {
    state.wavePhase = 'gap';
    state.waveTimer = state.wave >= L.waves ? 1.5 : 2.6;
  }

  // BOSS 被击杀后标记收尾（killEnemy -> levelCleared 已处理关卡结算）
  if (state.wavePhase === 'boss' && state.bossDone && state.mode === 'playing') {
    state.wavePhase = 'done';
  }
}

/* ---------------- HUD ---------------- */
function updateHud() {
  const p = state.player; if (!p) return;
  document.getElementById('hpFill').style.width = clamp(p.hp / p.maxHp, 0, 1) * 100 + '%';
  document.getElementById('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp) + (p.shield > 0 ? '  盾x' + p.shield : '');
  document.getElementById('xpFill').style.width = clamp(p.xp / p.xpNext, 0, 1) * 100 + '%';
  document.getElementById('xpTxt').textContent = 'Lv.' + p.level + '   ' + p.xp + ' / ' + p.xpNext;
  document.getElementById('stFill').style.width = (p.dashCd <= 0 ? 100 : clamp(1 - p.dashCd / p.dashCdMax, 0, 1) * 100) + '%';
  document.getElementById('stTxt').textContent = p.dashCd <= 0 ? '就绪' : p.dashCd.toFixed(1) + 's';
  /* 格挡槽 */
  const blkFill = document.getElementById('blkFill'), blkTxt = document.getElementById('blkTxt');
  if (blkFill) blkFill.style.width = clamp(p.block / p.blockMax, 0, 1) * 100 + '%';
  if (blkTxt) blkTxt.textContent = p.block + ' / ' + p.blockMax;
  document.getElementById('lvNum').textContent = LEVELS[state.levelIndex].id;
  document.getElementById('coinNum').textContent = state.runCoins;
  document.getElementById('waveInfo').textContent =
    '第 ' + state.wave + ' / ' + LEVELS[state.levelIndex].waves + ' 波 · 场上 ' +
    (state.enemies.length + state.pendingSpawn) + (state.bossActive ? ' · 首领战' : '') +
    '   |   金币 ' + state.save.coins;

  const tbIds = ['tbQ', 'tbE', 'tbR'];
  for (let i = 0; i < 3; i++) {
    const s = p.skills[i], el = document.getElementById('sk' + i);
    const cd = el.querySelector('.cd');
    const tv = s.t > 0 ? s.t.toFixed(1) : '';
    if (s.t > 0) { cd.style.display = 'flex'; cd.textContent = tv; el.classList.remove('ready'); }
    else { cd.style.display = 'none'; el.classList.add('ready'); }
    // 同步触摸按钮冷却
    const tb = document.getElementById(tbIds[i]);
    if (tb) {
      const tcd = tb.querySelector('.tcd');
      if (s.t > 0) { tb.classList.add('cool'); tcd.textContent = Math.ceil(s.t); }
      else { tb.classList.remove('cool'); }
    }
  }
  // 闪避按钮冷却
  const tbd = document.getElementById('tbDash');
  if (tbd) {
    const dcd = tbd.querySelector('.tcd');
    if (p.dashCd > 0) { tbd.classList.add('cool'); dcd.textContent = p.dashCd.toFixed(1); }
    else tbd.classList.remove('cool');
  }
  const bb = document.getElementById('bossBar');
  if (state.boss && state.bossActive) {
    bb.style.display = 'block';
    document.getElementById('bossName').textContent = state.boss.name;
    document.getElementById('bossFill').style.width = clamp(state.boss.hp / state.boss.maxHp, 0, 1) * 100 + '%';
  } else bb.style.display = 'none';
}

/* ---------------- 绘制 ---------------- */
function drawGrid() {
  const S = 64;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.045)';
  ctx.lineWidth = 1;
  for (let x = ((state.time * 4) % S) - S; x < W + S; x += S) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = ((state.time * 4) % S) - S; y < H + S; y += S) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.max(W, H) * .75);
  rg.addColorStop(0, 'rgba(0,0,0,0)');
  rg.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function drawZone(z) {
  const k = clamp(z.t / z.life, 0, 1);
  ctx.save();
  ctx.globalAlpha = (1 - k) * .8;
  if (z.kind === 'ring') {
    const r = z.rMax * (.25 + k * .85);
    ctx.strokeStyle = z.color; ctx.lineWidth = 4 + (1 - k) * 6;
    ctx.beginPath(); ctx.arc(z.x, z.y, r, 0, Math.PI * 2); ctx.stroke();
  } else if (z.kind === 'boom') {
    const r = z.rMax * (.3 + k * .8);
    const rg = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, r);
    rg.addColorStop(0, 'rgba(255,230,160,.95)');
    rg.addColorStop(.5, 'rgba(255,150,60,.55)');
    rg.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(z.x, z.y, r, 0, Math.PI * 2); ctx.fill();
  } else if (z.kind === 'spin') {
    ctx.strokeStyle = z.color; ctx.lineWidth = 5;
    const base = state.time * 16;
    for (let i = 0; i < 3; i++) {
      const a0 = base + i * (Math.PI * 2 / 3);
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, a0, a0 + 1.1); ctx.stroke();
    }
    ctx.globalAlpha = .18 * (1 - k);
    ctx.fillStyle = z.color;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawOrb(o) {
  ctx.save();
  const pulse = 1 + Math.sin(state.time * 8 + o.x * .05) * .12;
  const rg = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2.4 * pulse);
  rg.addColorStop(0, 'rgba(180,240,255,.95)');
  rg.addColorStop(.4, 'rgba(110,170,255,.5)');
  rg.addColorStop(1, 'rgba(90,120,255,0)');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 2.4 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dff4ff';
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r * .55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* 大刀绘制：长度由 swordLen 决定（固定、克制的刀身），命中判定另由 atkRange 决定 */
function drawBigSword(ctx, swordLen, glow) {
  const grip = 6;
  const len = clamp(swordLen, 34, 96);   // 刀身固定且克制，判定仍由 atkRange 决定
  const tipW = len * .30;
  const g = glow || 0;

  // 握柄
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(grip - 6, 7); ctx.lineTo(grip + 12, 6); ctx.stroke();

  // 护手
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(grip + 12, -8); ctx.lineTo(grip + 12, 20); ctx.stroke();

  // 刀身
  const x0 = grip + 14, x1 = x0 + len;
  ctx.beginPath();
  ctx.moveTo(x0, -tipW * .28);
  ctx.quadraticCurveTo(x0 + len * .45, -tipW * .62, x1, -tipW * .12);
  ctx.lineTo(x1 + tipW * .52, tipW * .10);
  ctx.quadraticCurveTo(x0 + len * .42, tipW * .58, x0, tipW * .30);
  ctx.closePath();

  const bg = ctx.createLinearGradient(x0, -tipW * .5, x1, tipW * .5);
  bg.addColorStop(0, '#8fa6cc');
  bg.addColorStop(.45, '#e8f2ff');
  bg.addColorStop(.55, '#ffffff');
  bg.addColorStop(1, '#a9c2e8');
  ctx.fillStyle = bg;
  if (g > 0) { ctx.shadowColor = 'rgba(150,210,255,' + (.85 * g) + ')'; ctx.shadowBlur = 20 * g; }
  ctx.fill();
  ctx.shadowBlur = 0;

  // 刃口高光
  ctx.strokeStyle = 'rgba(255,255,255,' + (.55 + .45 * g) + ')';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x0 + 2, tipW * .27);
  ctx.quadraticCurveTo(x0 + len * .42, tipW * .54, x1 + tipW * .46, tipW * .09);
  ctx.stroke();

  // 刀背暗线
  ctx.strokeStyle = 'rgba(40,60,100,.5)'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x0 + 2, -tipW * .25);
  ctx.quadraticCurveTo(x0 + len * .45, -tipW * .58, x1, -tipW * .11);
  ctx.stroke();

  // 挥砍弧光
  if (g > 0) {
    ctx.strokeStyle = 'rgba(180,225,255,' + (.65 * g) + ')';
    ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, len * .96, -Math.PI * .52, Math.PI * .52);
    ctx.stroke();
  }
}
function drawPlayer(p) {
  const blink = p.invuln > 0 && p.dashT <= 0 && Math.floor(state.time * 22) % 2 === 0;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + p.radius * .85, p.radius * .95, p.radius * .42, 0, 0, Math.PI * 2); ctx.fill();

  if (p.dashT > 0) {
    ctx.globalAlpha = .4;
    ctx.fillStyle = '#9fe8ff';
    ctx.beginPath(); ctx.arc(p.x - p.dashDir.x * 18, p.y - p.dashDir.y * 18, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.translate(p.x, p.y);
  if (blink) ctx.globalAlpha = .45;
  const ang = Math.atan2(p.facing.y, p.facing.x);
  ctx.rotate(ang);

  const bodyG = ctx.createLinearGradient(-p.radius, -p.radius, p.radius, p.radius);
  bodyG.addColorStop(0, p.hurtFlash > 0 ? '#ffb0bd' : '#dfe9ff');
  bodyG.addColorStop(1, p.hurtFlash > 0 ? '#ff5f7a' : '#6f8cff');
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(p.radius * .85, 0); ctx.lineTo(p.radius * .2, -6); ctx.lineTo(p.radius * .2, 6);
  ctx.closePath(); ctx.fill();

  /* ---- 大刀 ---- */
  const swing = p.atkAnim > 0 ? ((1 - p.atkAnim) * 1.7 - .85) : 0.32;
  ctx.save();
  ctx.rotate(swing);
  drawBigSword(ctx, p.swordLen, p.atkAnim > 0 ? Math.min(1, p.atkAnim * 1.6) : .45);
  ctx.restore();
  ctx.restore();

  if (p.shield > 0) {
    ctx.save();
    ctx.globalAlpha = .55 + Math.sin(state.time * 6) * .15;
    ctx.strokeStyle = '#7fe6ff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  /* 舒适圈：淡淡的柔光边界，提示怪物不会贴脸 */
  ctx.save();
  ctx.globalAlpha = .10 + Math.sin(state.time * 2.2) * .035;
  const comfort = ctx.createRadialGradient(p.x, p.y, p.radius + 6, p.x, p.y, p.radius + 56);
  comfort.addColorStop(0, 'rgba(160,230,255,0)');
  comfort.addColorStop(.72, 'rgba(160,230,255,.35)');
  comfort.addColorStop(1, 'rgba(190,245,255,.12)');
  ctx.fillStyle = comfort;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 56, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(0, e.radius * .9, e.radius * .9, e.radius * .38, 0, 0, Math.PI * 2); ctx.fill();

  if (e.elite) {
    ctx.strokeStyle = 'rgba(255,220,120,.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
  const hurt = e.hurt > 0;
  const c1 = hurt ? '#ffffff' : e.color;
  const c2 = hurt ? '#ffb0b0' : e.color2;
  ctx.translate(0, Math.sin(state.time * 4 + e.wob) * 1.6);

  switch (e.shape) {
    case 'skull': {
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c2;
      ctx.fillRect(-e.radius * .5, e.radius * .35, e.radius, e.radius * .55);
      ctx.fillStyle = '#151226';
      ctx.beginPath();
      ctx.arc(-5, -2, 3.4, 0, Math.PI * 2);
      ctx.arc(5, -2, 3.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'blob': {
      const g = ctx.createRadialGradient(0, -3, 2, 0, 0, e.radius);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const r = e.radius * (1 + Math.sin(a * 3 + state.time * 4) * .07);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0d2018';
      ctx.beginPath();
      ctx.arc(-4, -3, 2.6, 0, Math.PI * 2);
      ctx.arc(4, -3, 2.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bat': {
      const flap = Math.sin(state.time * 18 + e.wob) * .5;
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-e.radius * 1.8, -e.radius + flap * 12, -e.radius * 2.2, flap * 14);
      ctx.quadraticCurveTo(-e.radius * 1.1, e.radius * .3, 0, e.radius * .5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(e.radius * 1.8, -e.radius + flap * 12, e.radius * 2.2, -flap * 14);
      ctx.quadraticCurveTo(e.radius * 1.1, e.radius * .3, 0, e.radius * .5);
      ctx.fill();
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(0, 0, e.radius * .72, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(-3, -2, 2.2, 0, Math.PI * 2);
      ctx.arc(3, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ghost': {
      ctx.globalAlpha = .82;
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, -e.radius * .25, e.radius, Math.PI, 0);
      ctx.lineTo(e.radius, e.radius * .6);
      for (let i = 0; i < 4; i++) {
        const x = e.radius - (i + .5) * (e.radius * 2 / 4);
        ctx.quadraticCurveTo(x + e.radius / 4, e.radius * .95 + Math.sin(state.time * 6 + i) * 3, x, e.radius * .6);
      }
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0f1a2a';
      ctx.beginPath();
      ctx.arc(-4, -e.radius * .3, 3, 0, Math.PI * 2);
      ctx.arc(4, -e.radius * .3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'imp': {
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.moveTo(-4, -e.radius * .8); ctx.lineTo(-e.radius * .55, -e.radius * 1.7); ctx.lineTo(2, -e.radius * 1.1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -e.radius * .8); ctx.lineTo(e.radius * .55, -e.radius * 1.7); ctx.lineTo(-2, -e.radius * 1.1); ctx.fill();
      const g = ctx.createLinearGradient(0, -e.radius, 0, e.radius);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe9b0';
      ctx.beginPath();
      ctx.arc(-4, -2, 3, 0, Math.PI * 2);
      ctx.arc(4, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bomb': {
      const pulse = 1 + (e.fuse > 0 ? Math.sin(state.time * 40) * .12 : 0);
      ctx.scale(pulse, pulse);
      const g = ctx.createRadialGradient(-3, -4, 2, 0, 0, e.radius);
      g.addColorStop(0, '#fff5c2'); g.addColorStop(.6, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = e.fuse > 0 ? '#ff4d3d' : '#8a4a10'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, e.radius + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3a1a06';
      ctx.beginPath();
      ctx.arc(-4, -2, 2.6, 0, Math.PI * 2);
      ctx.arc(4, -2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'priest': {
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(0, -e.radius * 1.2); ctx.lineTo(e.radius * .95, e.radius * .95); ctx.lineTo(-e.radius * .95, e.radius * .95);
      ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, -e.radius, 0, e.radius);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, e.radius * .78, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#12010c';
      ctx.beginPath();
      ctx.arc(-4, -3, 3, 0, Math.PI * 2);
      ctx.arc(4, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .7;
      ctx.strokeStyle = c1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.radius + 8 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    default: {
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  if (e.hp < e.maxHp) {
    const w = e.radius * 2.1, hp = clamp(e.hp / e.maxHp, 0, 1);
    ctx.save();
    ctx.globalAlpha = e.hpBar > 0 ? 1 : .5;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 13, w, 4.5);
    ctx.fillStyle = e.elite ? '#ffd479' : '#ff5f7a';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 13, w * hp, 4.5);
    ctx.restore();
  }
}
function drawBoss(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = 'rgba(0,0,0,.42)';
  ctx.beginPath(); ctx.ellipse(0, b.radius * .9, b.radius * 1.05, b.radius * .4, 0, 0, Math.PI * 2); ctx.fill();

  if (b.spawnAnim > 0) {
    ctx.globalAlpha = clamp(1 - b.spawnAnim / 1.4, 0, 1);
    const s = 1 + b.spawnAnim * .4;
    ctx.scale(s, s);
  }
  const hurt = b.hurt > 0;
  const c1 = hurt ? '#ffffff' : b.color;
  const c2 = hurt ? '#ffb0b0' : b.color2;
  const breathe = 1 + Math.sin(state.time * 2.4) * .03;
  ctx.scale(breathe, breathe);

  const halo = ctx.createRadialGradient(0, 0, b.radius * .4, 0, 0, b.radius * 2.1);
  halo.addColorStop(0, 'rgba(0,0,0,0)');
  halo.addColorStop(.6, hexA(b.color, .18));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, b.radius * 2.1, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.rotate(b.angle * .6);
  ctx.strokeStyle = hexA(b.color, .8); ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * b.radius * 1.18, Math.sin(a) * b.radius * 1.18);
    ctx.lineTo(Math.cos(a) * b.radius * 1.62, Math.sin(a) * b.radius * 1.62);
    ctx.stroke();
  }
  ctx.restore();

  const g = ctx.createLinearGradient(0, -b.radius, 0, b.radius);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.stroke();

  ctx.save();
  ctx.shadowColor = c1; ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff2a8';
  ctx.beginPath();
  ctx.arc(-b.radius * .28, -b.radius * .12, b.radius * .12, 0, Math.PI * 2);
  ctx.arc(b.radius * .28, -b.radius * .12, b.radius * .12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = hexA(b.color, .95);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * b.radius * .42 - 7, -b.radius * .82);
    ctx.lineTo(i * b.radius * .42, -b.radius * 1.5);
    ctx.lineTo(i * b.radius * .42 + 7, -b.radius * .82);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawProjectile(pr) {
  ctx.save();
  /* 追踪光刃：先画一条渐隐拖尾，视觉上能看出是"飞过去咬住怪"的 */
  if (pr.homing && pr.trail && pr.trail.length > 1) {
    ctx.lineCap = 'round';
    for (let i = 1; i < pr.trail.length; i++) {
      const k = i / pr.trail.length;
      ctx.strokeStyle = hexA(pr.color, k * .55);
      ctx.lineWidth = 2 + k * 7;
      ctx.beginPath();
      ctx.moveTo(pr.trail[i - 1].x, pr.trail[i - 1].y);
      ctx.lineTo(pr.trail[i].x, pr.trail[i].y);
      ctx.stroke();
    }
  }
  const r = pr.r * (pr.wave ? 1 + Math.sin(state.time * 22) * .12 : 1);
  const rg = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, r * 2);
  rg.addColorStop(0, '#ffffff');
  rg.addColorStop(.45, hexA(pr.color, .9));
  rg.addColorStop(1, hexA(pr.color, 0));
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(pr.x, pr.y, r * 2, 0, Math.PI * 2); ctx.fill();
  if (pr.explode) {
    ctx.strokeStyle = '#ffb04d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, r + 3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
function drawParticle(q) {
  ctx.save();
  if (q.slash) {
    const k2 = clamp(q.t / q.life, 0, 1);
    if (q.full) {                                     // 回旋斩：完整一圈刀光
      ctx.globalAlpha = (1 - k2) * .8;
      ctx.translate(q.x, q.y);
      ctx.strokeStyle = q.color; ctx.lineWidth = 18 * (1 - k2) + 3;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(0, 0, q.size * .52, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = (1 - k2) * .35;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, q.size * .70, 0, Math.PI * 2); ctx.stroke();
    } else {
    const k = clamp(q.t / q.life, 0, 1);
    ctx.globalAlpha = (1 - k) * .75;
    ctx.translate(q.x, q.y); ctx.rotate(q.ang);
    ctx.strokeStyle = q.color; ctx.lineWidth = 14 * (1 - k) + 3;
    ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, q.size * .55, -1.0, 1.0); ctx.stroke();
    }
  } else {
    ctx.globalAlpha = clamp(1 - q.t / q.life, 0, 1);
    ctx.fillStyle = q.color;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1 - q.t / q.life * .5), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function draw() {
  const L = LEVELS[state.levelIndex] || LEVELS[0];
  ctx.save();
  if (state.shakeT > 0) {
    const m = state.shakeMag * (state.shakeT / .6 + .4);
    ctx.translate(rand(-m, m), rand(-m, m));
  }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, L.bg[0]); g.addColorStop(1, L.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(-40, -40, W + 80, H + 80);
  drawGrid();

  for (const z of state.zones) drawZone(z);
  for (const o of state.orbs) drawOrb(o);
  for (const e of state.enemies) drawEnemy(e);
  if (state.boss && state.bossActive) drawBoss(state.boss);
  for (const pr of state.projectiles) drawProjectile(pr);
  if (state.player) drawPlayer(state.player);
  for (const q of state.particles) drawParticle(q);

  for (const t of state.texts) {
    ctx.save();
    ctx.globalAlpha = clamp(1 - t.t / t.life, 0, 1);
    ctx.fillStyle = t.color;
    ctx.font = '800 ' + t.size + 'px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.65)';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------- 升级强化：只在通关结算时选择 ---------------- */
/* 纯逻辑消化：不进结算页时（比如直接开下一关）把待选升级随机生效，
   避免玩家已经升级、却因为没进结算页而白丢强化。 */
function drainLevelUpQueue() {
  let guard = 0;
  while (state.levelUpQueue > 0 && guard++ < 999) {
    const p = state.player;
    const used = p ? (p.upgrades || {}) : {};
    let pool = UPGRADES.filter(u => (used[u.id] || 0) < u.max);
    if (!pool.length) pool = UPGRADES.slice();
    const u = pool[Math.floor(Math.random() * pool.length)];
    if (p) { u.apply(p); p.upgrades[u.id] = (p.upgrades[u.id] || 0) + 1; }
    state.levelUpQueue = Math.max(0, state.levelUpQueue - 1);
  }
}
/* 战斗中升级不再弹窗打断玩家，只把待选次数记进 state.levelUpQueue，
   等通关进入补给站（结算页）时再一次性选完，不想选的可以点"全部随机"。 */
function openLevelUp() {
  if (state.levelUpQueue <= 0) { closeLevelUp(); return; }
  renderLevelUpCards();
  const panel = document.getElementById('luPanel');
  if (panel) { panel.classList.remove('hidden', 'luDone'); }
  sfx.levelup();
}
/* 生成三选一卡片（可反复调用：队列里还有几级就刷新出下一组选项） */
function renderLevelUpCards() {
  const p = state.player;
  const used = p.upgrades || {};
  let pool = UPGRADES.filter(u => (used[u.id] || 0) < u.max);
  if (pool.length < 3) pool = UPGRADES.slice();
  const opts = [];
  const tmp = pool.slice();
  while (opts.length < 3 && tmp.length) opts.push(tmp.splice(Math.floor(Math.random() * tmp.length), 1)[0]);

  const titleEl = document.getElementById('luTitle');
  if (titleEl) titleEl.textContent = '升 级 强 化 · 待选 ' + state.levelUpQueue + ' 项';
  const tipEl = document.getElementById('luTip');
  if (tipEl) tipEl.textContent = '本关共提升 ' + state.levelUpQueue + ' 级，逐项选完即可进入补给站';
  const panel = document.getElementById('luPanel');
  if (panel) panel.classList.remove('luDone');
  const box = document.getElementById('luCards');
  if (!box) return;
  box.innerHTML = '';
  for (const u of opts) {
    const lv = used[u.id] || 0;
    const el = document.createElement('div');
    el.className = 'card lu-card';
    el.innerHTML =
      '<div class="h"><b>' + u.name + '</b><span class="cost">' + lv + '/' + u.max + '</span></div>' +
      '<div class="d">' + u.desc + '</div>';
    el.onclick = (ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      pickLevelUp(u.id);
    };
    box.appendChild(el);
  }
}
/* 选中一项强化：队列里还有就刷新下一组选项，选完提示可以进补给站 */
function pickLevelUp(id) {
  applyUpgrade(id);
  state.levelUpQueue = Math.max(0, state.levelUpQueue - 1);
  if (state.levelUpQueue > 0) renderLevelUpCards();
  else finishingLevelUp();
}
/* 队列清空：不隐藏面板，改为提示"选完了，可以进补给站"，
   避免玩家点完最后一张卡后整个区块突然消失、不知道下一步该干嘛。 */
function finishingLevelUp() {
  const panel = document.getElementById('luPanel');
  if (!panel) return;
  const cards = document.getElementById('luCards');
  if (cards) cards.innerHTML = '';
  const titleEl = document.getElementById('luTitle');
  if (titleEl) titleEl.textContent = '升 级 强 化 · 已 完 成';
  const tipEl = document.getElementById('luTip');
  if (tipEl) tipEl.textContent = '强化已全部生效，可以继续强化装备或进入下一关';
  panel.classList.remove('hidden');
  panel.classList.add('luDone');
}
function closeLevelUp() {
  const panel = document.getElementById('luPanel');
  if (panel) { panel.classList.add('hidden'); panel.classList.remove('luDone'); }
}
/* 一键随机消化掉本关全部待选升级 */
function autoPickLevelUps() {
  let guard = 0;
  while (state.levelUpQueue > 0 && guard++ < 999) {
    const p = state.player;
    const used = p.upgrades || {};
    let pool = UPGRADES.filter(u => (used[u.id] || 0) < u.max);
    if (!pool.length) pool = UPGRADES.slice();
    const u = pool[Math.floor(Math.random() * pool.length)];
    applyUpgrade(u.id, true);
    state.levelUpQueue = Math.max(0, state.levelUpQueue - 1);
  }
  sfx.levelup();
  if (state.levelUpQueue > 0) { renderLevelUpCards(); return; }
  finishingLevelUp();
}
function applyUpgrade(id, silent) {
  const u = UPGRADE_MAP[id];
  if (!u) return;
  const p = state.player;
  u.apply(p);
  p.upgrades[id] = (p.upgrades[id] || 0) + 1;
  if (silent) return;
  sfx.levelup();
  addText(p.x, p.y - 30, u.name, '#ffe066', 18);
  spawnParticles(p.x, p.y, 26, '#ffe066', 220, .7, 3.4);
}

/* ---------------- 商店 ---------------- */
function shopCost(item) {
  const bought = state.save.permanent[item.id] || 0;
  return Math.round(item.base * Math.pow(item.grow, bought));
}
function openShop() {
  state.mode = 'shop';
  closeLevelUp();
  document.getElementById('shopTitle').textContent = '结算 · 第 ' + LEVELS[state.levelIndex].id + ' 关通过';
  const nxt = state.levelIndex + 1;
  document.getElementById('btnNextLevel').textContent =
    nxt < LEVELS.length ? '进入第 ' + LEVELS[nxt].id + ' 关：' + LEVELS[nxt].name : '返回主菜单';
  renderShop();
  showScreen('shop');
  /* 本关攒下的升级，在这里一次性选完；没有再隐藏整个区块。 */
  if (state.levelUpQueue > 0) openLevelUp();
  else closeLevelUp();
}
function renderShop() {
  const p = state.player;
  document.getElementById('coinLine').textContent = '金币：' + state.save.coins;

  const stats = [
    ['生命', Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp)],
    ['等级', 'Lv.' + p.level],
    ['攻击力', Math.round(playerDmg(p))],
    ['攻速', p.atkSpeedMul.toFixed(2) + 'x'],
    ['暴击率', Math.round(p.crit * 100) + '%'],
    ['暴击伤害', Math.round(p.critMul * 100) + '%'],
    ['移速', Math.round(playerSpeed(p))],
    ['每秒回复', p.regen.toFixed(1)],
    ['吸血', p.lifesteal.toFixed(1)],
    ['反伤', Math.round(p.thorn)],
    ['技能冷却', Math.round((1 - p.cdr) * 100) + '% 减少'],
    ['闪避冷却', p.dashCdMax.toFixed(2) + 's'],
    ['开局护盾', p.shieldStart],
    ['攻击判定', Math.round(p.atkRange)],
    ['格挡', p.blockMax + ' 格 · 招架 0.26s']
  ];
  document.getElementById('statGrid').innerHTML =
    stats.map(([k, v]) => '<div class="stat"><span>' + k + '</span><b>' + v + '</b></div>').join('');

  const box = document.getElementById('shopCards');
  box.innerHTML = '';
  for (const item of SHOP_ITEMS) {
    const cost = shopCost(item);
    const bought = state.save.permanent[item.id] || 0;
    const can = state.save.coins >= cost;
    const el = document.createElement('div');
    el.className = 'card' + (can ? '' : ' off');
    el.innerHTML =
      '<div class="h"><b>' + item.name + '</b><span class="cost">' + cost + ' 金币</span></div>' +
      '<div class="d">' + item.desc + '</div><div class="lvtag">已购买 ' + bought + ' 次</div>';
    if (can) el.onclick = () => buyShopItem(item);
    box.appendChild(el);
  }

  const rb = document.getElementById('shopRecover');
  rb.innerHTML = '';
  const healCost = Math.max(20, Math.round((p.maxHp - p.hp) * 1.1));
  const rec = [
    { name:'简单治疗', cost:healCost, desc:'恢复生命 +' + Math.max(0, Math.round(p.maxHp - p.hp)) + '点', act:() => { p.hp = p.maxHp; } },
    { name:'深度治疗', cost:Math.round(p.maxHp * 1.5), desc:'回满生命，并立即刷新所有技能与闪避', act:() => { p.hp = p.maxHp; p.skills.forEach(s => s.t = 0); p.dashCd = 0; } }
  ];
  for (const r of rec) {
    const can = state.save.coins >= r.cost;
    const el = document.createElement('div');
    el.className = 'card' + (can ? '' : ' off');
    el.innerHTML = '<div class="h"><b>' + r.name + '</b><span class="cost">' + r.cost + ' 金币</span></div><div class="d">' + r.desc + '</div>';
    if (can) el.onclick = () => {
      state.save.coins -= r.cost;
      r.act(); writeSave(); renderShop();
      beep(660, .12, 'sine', .05, 990);
    };
    rb.appendChild(el);
  }
}
function buyShopItem(item) {
  const cost = shopCost(item);
  if (state.save.coins < cost) return;
  state.save.coins -= cost;
  state.save.permanent[item.id] = (state.save.permanent[item.id] || 0) + 1;
  const p = state.player;
  switch (item.id) {
    case 's_maxhp':     p.maxHp += 25; p.hp += 25; break;
    case 's_dmg':       p.dmgMul *= 1.08; break;
    case 's_aspd':      p.atkSpeedMul *= 1.08; break;
    case 's_crit':      p.crit += .05; break;
    case 's_critdmg':   p.critMul += .25; break;
    case 's_spd':       p.speedMul *= 1.06; break;
    case 's_dashcd':    p.dashCdMax *= .88; break;
    case 's_cdr':       p.cdr *= .90; break;
    case 's_regen':     p.regen += .8; break;
    case 's_thorn':     p.thorn += 8; break;
    case 's_lifesteal': p.lifesteal += .8; break;
    case 's_range':     p.atkRange *= 1.10; break;
  }
  beep(720, .12, 'triangle', .045, 1100);
  writeSave();
  renderShop();
}

/* ---------------- 关卡选择 ---------------- */
function renderLevelSelect() {
  const list = document.getElementById('levelList');
  list.innerHTML = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    const unlocked = (i + 1) <= state.save.unlocked;
    const best = state.save.best[String(L.id)];
    const el = document.createElement('div');
    el.className = 'lv' + (unlocked ? '' : ' locked');
    el.innerHTML =
      '<div class="no">LEVEL ' + L.id + '</div>' +
      '<div class="nm">' + (unlocked ? L.name : '未 解 锁') + '</div>' +
      '<div class="ds">' + (unlocked ? L.desc : '先 通 关 前 一 关 才 能 挑 战') + '</div>' +
      '<div class="tags">' + L.tags.map(t => '<span class="tag">' + t + '</span>').join('') + '</div>' +
      (best ? '<div class="best">最高 ' + best.score + '</div>' : '');
    if (unlocked) el.onclick = () => startLevel(i);
    list.appendChild(el);
  }
}

/* ---------------- 结束 / 通关 ---------------- */
function playerDie() {
  /* 减压休闲版：血量见底也只结算收益，不弹失败界面。 */
  state.save.coins += state.runCoins;
  writeSave();
  state.btnRetryThisLevel = true;
  state.mode = 'shop';
  drainLevelUpQueue();
  closeLevelUp();
  setTimeout(() => {
    document.getElementById('shopTitle').textContent = '休整 · 第 ' + LEVELS[state.levelIndex].id + ' 关';
    document.getElementById('btnNextLevel').textContent = '再试本关';
    renderShop();
    showScreen('shop');
  }, 500);
}
function levelCleared() {
  const L = LEVELS[state.levelIndex];
  const key = String(L.id);
  const rec = state.save.best[key] || { score: 0 };
  const score = Math.round(state.player.hp + state.runCoins * 2 + state.kills * 3);
  if (score > rec.score) rec.score = score;
  state.save.best[key] = rec;
  state.save.coins += state.runCoins;
  writeSave();
  const isLast = state.levelIndex + 1 >= LEVELS.length;
  state.save.unlocked = isLast ? LEVELS.length : Math.max(state.save.unlocked, state.levelIndex + 2);
  writeSave();
  sfx.win();

  if (isLast) {
    state.mode = 'victory';
    drainLevelUpQueue();   // 全通关没有结算页，把没选的升级直接生效
    closeLevelUp();
    document.getElementById('goTitle').textContent = '深 渊 已 净 化';
    document.getElementById('goSub').textContent = '你已击溃全部 ' + LEVELS.length + ' 层守卫，成为真正的深渊猎手。';
    document.getElementById('btnGoShop').style.display = 'none';
    fillStats([
      ['击杀数', state.kills],
      ['本关金币', state.runCoins],
      ['人物等级', 'Lv.' + state.player.level],
      ['通关进度', LEVELS.length + ' / ' + LEVELS.length]
    ]);
    showScreen('gameOver');
  } else {
    state.mode = 'shop';
    openShop();
  }
}

/* ---------------- 按钮绑定 ---------------- */
document.getElementById('btnStart').onclick = () => {
  audio();
  startLevel(clamp(state.save.unlocked - 1, 0, LEVELS.length - 1));
};
document.getElementById('btnLevels').onclick = () => { state.mode = 'menu'; renderLevelSelect(); showScreen('levelSelect'); };
document.getElementById('btnBackMenu').onclick = () => { state.mode = 'menu'; showScreen('menu'); };
document.getElementById('btnReset').onclick = () => {
  if (confirm('确定要清除所有进度、金币与强化记录吗？')) {
    state.save = defaultSave();
    writeSave();
    renderLevelSelect();
    alert('存档已清除。');
  }
};
document.getElementById('btnResume').onclick = () => togglePause();
document.getElementById('btnRestart').onclick = () => startLevel(state.levelIndex);
document.getElementById('btnPauseMenu').onclick = () => { state.mode = 'menu'; showScreen('menu'); };
document.getElementById('btnRetry').onclick = () => startLevel(state.levelIndex, { keepPlayer: true });
document.getElementById('btnGoMenu').onclick = () => { state.mode = 'menu'; renderLevelSelect(); showScreen('menu'); };
document.getElementById('btnGoShop').onclick = () => openShop();
document.getElementById('btnNextLevel').onclick = () => {
  const next = state.levelIndex + 1;
  if (next >= LEVELS.length) { state.mode = 'menu'; showScreen('menu'); return; }
  if (state.btnRetryThisLevel) { state.btnRetryThisLevel = false; startLevel(state.levelIndex, { keepPlayer: true }); return; }
  startLevel(next, { keepPlayer: true });
};
document.getElementById('btnShopMenu').onclick = () => { state.mode = 'menu'; renderLevelSelect(); showScreen('menu'); };
const _luAuto = document.getElementById('btnLuAuto');
if (_luAuto) _luAuto.onclick = () => { audio(); autoPickLevelUps(); renderShop(); };

/* ---------------- 主循环 ---------------- */
let last = performance.now();
function loop(now) {
  let dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  if (state.mode === 'playing') update(dt);
  else if (state.mode === 'dead' || state.mode === 'victory') update(dt * .3);
  draw();
  requestAnimationFrame(loop);
}
resize();
state.player = makePlayer(null);
renderLevelSelect();
initTouchControls();
showScreen('menu');
requestAnimationFrame(loop);
