// Mein Deutsch · 口型图（第 24 轮终稿，2026-11-15）。8 个 <symbol>，统一 viewBox 0 0 240 180（4:3，以后可原位换成同比例的短视频）。
// 用法：<div class="md-mouth"><svg viewBox="0 0 240 180"><use href="#m-oe"/></svg></div>
//
//   symbol   画的是什么                                  依赖（设计系统 sprites.js 里已有的）
//   m-ae     e → ä 正面嘴形                              filter #rough-s · pattern #dots-ink
//   m-oe     e → ö 正面（圆嘴）                          filter #rough-s · pattern #dots-ink
//   m-ue     i → ü 正面（圆嘴，口更小）                  filter #rough-s · pattern #dots-ink
//   m-wv     w / v 正面（上牙碰下唇；w 喉咙振动弧）     filter #rough-s · pattern #dots-ink
//   m-sch    sch 正面圆嘴 + 正中剖面（舌尖不卷）         filter #rough-s · pattern #dots-ink
//   m-ich    ich 的 ch：正面扁嘴 + 正中剖面              filter #rough-s · pattern #dots-ink
//   m-ach    auch 的 ch：只有正中剖面（放大）            filter #rough-s · pattern #dots-ink
//   m-z      z：t（堵住）→ s（留缝）两张小剖面           filter #rough-s · pattern #dots-ink
//
// 其余都在本文件里自带、不需要外部定义：
//   · clipPath（嘴里的牙，id = mclip1、mclip2…，按调用顺序生成）和 linearGradient（舌头渐隐，id = tg-ich / tg-ach / tg-sch / tg-t / tg-s）写在各自的 symbol 里；
//     并进 sprites.js 时只要保证这些 id 在页面上不和别的重名。
//   · 剖面图上的小字「上颚」「舌头」用 Instrument Sans / PingFang SC（heft/fonts/fonts.css 已加载）。
//   · 颜色写死在下面的常量里（和 tokens 对应：CORAL = illus-coral、AIR = sky-ink、TEETH/PAPER = 纸色、HEAD = 很淡的赭黄、TONGUE2 = 淡粉）。
// 并进 heft/js/sprites.js：把下面 IIFE 里生成的 S 数组拼进 sprites.js 已有的 <defs> 即可（本文件末尾是单独插一个隐藏 <svg>，效果一样）。
(function () {
const INK = '#24272c', CORAL = '#ef907d', TEETH = '#fffdf8', CAV = '#3b3e44', AIR = '#3f7aa8', HI = '#fbd3c8';
const LN = `fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#rough-s)"`;
let uid = 0;
const lab = (x, t, y = 171) => `<text x="${x}" y="${y}" text-anchor="middle" style="font:600 18px 'Instrument Sans',sans-serif;fill:${INK}">${t}</text>`;
const then = (x, y = 80) => `<path d="M${x - 9} ${y}h17m-5 -4.5 5 4.5 -5 4.5" ${LN} stroke="#8e9096"/>`;
// “关键在这里”：sky-ink 小圈
const ring = (x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${AIR}" stroke-width="1.5" filter="url(#rough-s)"/>`;

/* ---------- 正面嘴形 ---------- */
function lens(cx, cy, w, h) { const x0 = cx - w / 2, x1 = cx + w / 2; return `M${x0} ${cy}C${x0 + w * .22} ${cy - h} ${x1 - w * .22} ${cy - h} ${x1} ${cy}C${x1 - w * .22} ${cy + h} ${x0 + w * .22} ${cy + h} ${x0} ${cy}Z`; }
function lipsSpread(cx, cy, w, h) {
  const x0 = cx - w / 2 - 7, x1 = cx + w / 2 + 7, t = cy - h - 15, b = cy + h + 17;
  return `M${x0} ${cy}C${x0 + 10} ${t + 4} ${cx - 20} ${t} ${cx - 7} ${t + 1}C${cx - 3} ${t + 1} ${cx - 2} ${t + 4} ${cx} ${t + 4}C${cx + 2} ${t + 4} ${cx + 3} ${t + 1} ${cx + 7} ${t + 1}C${cx + 20} ${t} ${x1 - 10} ${t + 4} ${x1} ${cy}C${x1 - 10} ${b} ${x0 + 10} ${b} ${x0} ${cy}Z`;
}
// 收圆往前伸的嘴：口小而圆；唇厚、鼓，上唇有唇峰，下唇更饱满；嘴角往里收（两道小弧）
function roundOpen(cx, cy, rx, ry, sq = 0) {   // sq>0：口形略方（sch）
  const k = .552 + sq * .2, f = n => n.toFixed(2);
  return `M${f(cx - rx)} ${cy}C${f(cx - rx)} ${f(cy - ry * k)} ${f(cx - rx * k)} ${f(cy - ry)} ${cx} ${f(cy - ry)}C${f(cx + rx * k)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ry * k)} ${f(cx + rx)} ${cy}C${f(cx + rx)} ${f(cy + ry * k)} ${f(cx + rx * k)} ${f(cy + ry)} ${cx} ${f(cy + ry)}C${f(cx - rx * k)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * k)} ${f(cx - rx)} ${cy}Z`;
}
function lipsRound(cx, cy, R, T, B) {
  return `M${cx - R} ${cy + 1}C${cx - R} ${cy - T * .62} ${cx - R * .62} ${cy - T} ${cx - 7} ${cy - T}C${cx - 3} ${cy - T} ${cx - 1.5} ${cy - T + 3.2} ${cx} ${cy - T + 3.2}C${cx + 1.5} ${cy - T + 3.2} ${cx + 3} ${cy - T} ${cx + 7} ${cy - T}C${cx + R * .62} ${cy - T} ${cx + R} ${cy - T * .62} ${cx + R} ${cy + 1}C${cx + R} ${cy + B * .72} ${cx + R * .55} ${cy + B} ${cx} ${cy + B}C${cx - R * .55} ${cy + B} ${cx - R} ${cy + B * .72} ${cx - R} ${cy + 1}Z`;
}
function teeth(id, cx, top, bot, w) {
  let d = ''; for (let x = cx - w / 2 + w / 6; x < cx + w / 2 - 1; x += w / 6) d += `M${x.toFixed(1)} ${top}V${bot}`;
  return `<g clip-path="url(#${id})"><rect x="${cx - w / 2}" y="${top}" width="${w}" height="${bot - top}" fill="${TEETH}"/><path d="${d}" stroke="${INK}" stroke-width=".8" opacity=".5"/></g>`;
}
function face(cx, cy, chin, nose = 37) {
  return `<path d="M${cx - 15} ${cy - nose}C${cx - 9} ${cy - nose + 5} ${cx - 4} ${cy - nose + 4} ${cx} ${cy - nose + 6}C${cx + 4} ${cy - nose + 4} ${cx + 9} ${cy - nose + 5} ${cx + 15} ${cy - nose}" ${LN} opacity=".7"/>
    <path d="M${cx - 30} ${chin - 12}C${cx - 22} ${chin + 2} ${cx + 22} ${chin + 2} ${cx + 30} ${chin - 12}" ${LN} opacity=".7"/>`;
}
function front(cx, cy, o) {
  const id = `mclip${++uid}`;
  const open = lens(cx, cy, o.w, o.h), outer = lipsSpread(cx, cy, o.w, o.h);
  const top = cy - o.h, bot = cy + o.h, tw = o.w * .62;
  return `<defs><clipPath id="${id}"><path d="${open}"/></clipPath></defs>
    ${face(cx, cy, o.chin)}
    <path d="${outer}${open}" fill-rule="evenodd" fill="${CORAL}" transform="translate(1.6 1.4)"/>
    <path d="${outer}${open}" fill-rule="evenodd" fill="url(#dots-ink)" opacity=".14"/>
    <path d="${open}" fill="${CAV}"/>
    ${o.tongue ? `<g clip-path="url(#${id})"><ellipse cx="${cx}" cy="${bot + 2}" rx="${tw * .62}" ry="${(bot - top) * .42}" fill="${CORAL}"/></g>` : ''}
    ${o.tu ? teeth(id, cx, top - 2, top + (bot - top) * (o.tuh || .32), tw) : ''}
    ${o.tl ? teeth(id, cx, bot - (bot - top) * (o.tlh || .3), bot + 2, tw * .9) : ''}
    <path d="${outer}" ${LN}/><path d="${open}" ${LN} stroke-width="1.2"/>`;
}
// 收圆的嘴：就是左边那张扁嘴收拢了——唇厚和扁嘴一样，宽度收到扁嘴的一半左右；
// 上唇保留唇峰，两边嘴角各有一道上下唇的合缝；中间只开一个小口，隐约露一点上牙；轮廓略带手绘的不规则，不是正圆
function frontRound(cx, cy, o) {
  const id = `mclip${++uid}`, R = o.R, T = o.ry + 12, B = o.ry + 14, rx = o.rx, ry = o.ry;
  const outer = `M${cx - R} ${cy + 1}C${cx - R} ${cy - T * .55} ${cx - R * .55} ${cy - T} ${cx - 5} ${cy - T + .5}C${cx - 2.5} ${cy - T + .5} ${cx - 1.5} ${cy - T + 3} ${cx} ${cy - T + 3}C${cx + 1.5} ${cy - T + 3} ${cx + 3} ${cy - T + .2} ${cx + 5.5} ${cy - T + .2}C${cx + R * .58} ${cy - T - .5} ${cx + R + .8} ${cy - T * .5} ${cx + R + .6} ${cy + .5}C${cx + R + .4} ${cy + B * .6} ${cx + R * .5} ${cy + B + .6} ${cx - .5} ${cy + B}C${cx - R * .55} ${cy + B - .4} ${cx - R - .6} ${cy + B * .62} ${cx - R} ${cy + 1}Z`;
  const open = `M${cx - rx} ${cy + .3}C${cx - rx} ${cy - ry * .7} ${cx - rx * .5} ${cy - ry} ${cx + .3} ${cy - ry}C${cx + rx * .6} ${cy - ry + .2} ${cx + rx + .3} ${cy - ry * .6} ${cx + rx} ${cy + .2}C${cx + rx - .2} ${cy + ry * .75} ${cx + rx * .5} ${cy + ry} ${cx - .2} ${cy + ry}C${cx - rx * .6} ${cy + ry - .1} ${cx - rx} ${cy + ry * .7} ${cx - rx} ${cy + .3}Z`;
  const sl = (R - rx) * .5, seam = `M${cx - rx} ${cy + .3}C${cx - rx - sl * .4} ${cy + .6} ${cx - rx - sl * .8} ${cy + 1.4} ${cx - rx - sl} ${cy + 2}M${cx + rx} ${cy + .2}C${cx + rx + sl * .4} ${cy + .5} ${cx + rx + sl * .8} ${cy + 1.2} ${cx + rx + sl} ${cy + 1.8}`;   // 嘴角合缝：只画一半，往下微弯
  const tw = rx * 2 + 2;
  return `<defs><clipPath id="${id}"><path d="${open}"/></clipPath></defs>
    ${face(cx, cy, o.chin)}
    <path d="${outer}${open}" fill-rule="evenodd" fill="${CORAL}" transform="translate(1.6 1.4)"/>
    <path d="${outer}${open}" fill-rule="evenodd" fill="url(#dots-ink)" opacity=".14"/>
    <path d="${open}" fill="${CAV}"/>
    ${o.tu ? teeth(id, cx, cy - ry - 1, cy - ry + ry * (o.tuh || .7), tw) : ''}
    ${o.tl ? teeth(id, cx, cy + ry - ry * .6, cy + ry + 1, tw) : ''}
    <path d="${outer}" ${LN}/><path d="${seam}" ${LN} stroke-width="1.1" opacity=".6"/><path d="${open}" ${LN} stroke-width="1.15"/>`;
}
function lipTeeth(cx, cy) {
  const id = `mclip${++uid}`, w = 66;
  const upper = `M${cx - w / 2 - 7} ${cy + 2}C${cx - 26} ${cy - 22} ${cx - 16} ${cy - 25} ${cx - 7} ${cy - 24}C${cx - 3} ${cy - 24} ${cx - 2} ${cy - 21} ${cx} ${cy - 21}C${cx + 2} ${cy - 21} ${cx + 3} ${cy - 24} ${cx + 7} ${cy - 24}C${cx + 16} ${cy - 25} ${cx + 26} ${cy - 22} ${cx + w / 2 + 7} ${cy + 2}C${cx + 22} ${cy - 9} ${cx - 22} ${cy - 9} ${cx - w / 2 - 7} ${cy + 2}Z`;
  const lower = `M${cx - w / 2 - 7} ${cy + 2}C${cx - 20} ${cy + 1} ${cx + 20} ${cy + 1} ${cx + w / 2 + 7} ${cy + 2}C${cx + 24} ${cy + 24} ${cx - 24} ${cy + 24} ${cx - w / 2 - 7} ${cy + 2}Z`;
  const gap = `M${cx - w / 2 - 6} ${cy + 2}C${cx - 22} ${cy - 9} ${cx + 22} ${cy - 9} ${cx + w / 2 + 6} ${cy + 2}C${cx + 20} ${cy + 3} ${cx - 20} ${cy + 3} ${cx - w / 2 - 6} ${cy + 2}Z`;
  return `<defs><clipPath id="${id}"><path d="${gap}"/></clipPath></defs>${face(cx, cy, cy + 44)}
    <path d="${gap}" fill="${CAV}"/>${teeth(id, cx, cy - 10, cy + 4, 40)}
    <path d="${upper}" fill="${CORAL}" transform="translate(1.6 1.4)"/><path d="${lower}" fill="${CORAL}" transform="translate(1.6 1.4)"/>
    <path d="${upper}" fill="url(#dots-ink)" opacity=".14"/><path d="${upper}" ${LN}/><path d="${lower}" ${LN}/>`;
}

/* ---------- 侧面舌位（脸朝左；本地坐标 x 0–150，y -25–125） ---------- */
// 第六稿：一眼看得出是“侧脸”——额头、眼睛、鼻子、上下嘴唇（和正面一样的珊瑚色）、下巴画完整；
// 舌头有圆圆的舌尖、往后变厚、舌根收到下面去，周围留空；颜色比嘴唇浅；小字标「舌头」（需要时「上颚」「上牙」）。
const TONGUE = '#f6b4a8', QUIET = '#6b6e74';
function profile(p) {
  const x = 22 - p;
  return `M40 -25C33 -19 30 -10 31 -1C31.5 3 30 6 27.5 10C24 16 18 23 14 28.5C12.5 31 14 34 18 34.6C22 35.2 27 35.2 30 36C28 42 ${x} 50 ${x} 57C${x} 60 ${x + 2} 62 28 63M28 65C${x + 2} 66 ${x} 68 ${x} 71C${x} 75 28 78 30 80C28 88 28 96 34 100C44 104 56 104 66 102C72 108 74 116 75 125`;
}
const lipsSide = p => { const x = 22 - p; return [
  `M31.5 49.5C${x + 3} 50.5 ${x} 54 ${x} 57C${x} 60 ${x + 2} 62 28 63C30.5 62.4 31.6 60.4 31.6 57.4Z`,
  `M28 65C${x + 2} 66 ${x} 68 ${x} 71C${x} 75 27 77 30 78C31.4 75 31.4 69 28 65Z`]; };
const TU = 'M36 46C35 52 34 57 33.5 61C35 62.2 37 62.2 38.4 61C38.8 56 39 51 39.2 46Z';
const TL = 'M33.2 66.5C33.6 70 34 74 35 79L38.6 79C38 74 37.6 70 37.2 66.5C36 65.4 34.4 65.4 33.2 66.5Z';
const PALATE = 'M39 46C40.5 44 42.5 42 46 41.5C55 38.5 64 33 76 31.5C86 30.5 94 31 100 33C108 36 114 41 117 48C118 52 117.5 55 116 57';
const WALL = 'M126 28C129 56 129 92 127 125';
// 舌根：从舌背往下收到喉咙前面，再从下面绕回舌尖（下边是弧，不是平的）
const ROOT = 'C110 79 111 88 109 96C107.5 101 104 103 100 102C96 100 92 95 86 92C76 88 62 86 52 84';
const T = {
  // 舌尖在下齿后面；舌面拱起的最高点在上颚中段偏前，后部落下
  ich: `M41.5 70C44.5 61 51 51 59 45C63 41.5 67 39.5 71 39.6C77 40 83 44 89 50C96 57 103 64 108 72${ROOT}C46 82 41.6 78.5 40.7 75C40.3 73 40.6 71.2 41.5 70Z`,
  // 舌尖、舌前部放低；舌头后部拱向后面软的上颚
  ach: `M41.5 72C46 68 54 66 62 65C72 64 82 60 92 52C98 47 103 43.4 107.5 43C111 43 113 46.5 113.5 52C114 62 112 84 109 96C107.5 101 104 103 100 102C96 100 92 95 86 92C76 88 62 86 52 84C46 82 41.6 79 40.7 76C40.3 74 40.6 72.6 41.5 72Z`,
  // 舌尖不卷、朝前；舌面前部靠近齿龈后面
  sch: `M42.5 54C45 49.5 50 47.2 56 46.8C64 46.6 72 49 80 54C90 60 100 64 106 70${ROOT}C46 82 42 76 41.2 68C40.8 62 41.2 57 42.5 54Z`,
  // t：舌尖和舌面最前面贴住上牙后面的齿龈，堵死
  t: `M40.2 46.6C42 43.6 44.5 42.2 47.2 41.8C51 41.6 54 43 57 46C63 52 70 56 80 59C92 62.5 102 66 107 72${ROOT}C45 81.5 41 74 40 64C39.6 57 39.6 51 40.2 46.6Z`,
  // s：舌尖离开一点，和齿龈之间留一道窄缝
  s: `M41 54.5C43 51 46 49.4 50 49.4C54 49.8 58 51.8 62 54.8C70 59 80 62 92 64.5C102 66.5 106 70 108 74${ROOT}C45 81.5 41.5 74 40.8 66C40.5 61 40.5 57.5 41 54.5Z`,
};
// 气流：只画从窄缝出嘴的那一段 + 箭头
const AIRP = {
  ich: 'M86 38C77 35.6 70 35.3 63 36.4C55 38 49 43 45 49C41.5 55 39 60 36 63.5C31 64 24 64 15 64',
  ach: 'M117 52C114 44 110 39.6 105.5 39.4C99 40.4 92 46 78 53C62 59 46 61 38 63.5C31 64 24 64 15 64',
  sch: 'M72 46.5C62 44 53 43.4 47.5 44.6C43 47.5 40 55 36 63.5C29 64 20 64 9 64',
  s: 'M68 52C59 49 51.5 47.2 46 47.6C42.6 49.6 40 56 36.5 63.5C30 64 23 64 15 64',
  t: 'M80 52C72 49 63 45.6 55 43.6',
};
const arrowAt = (x, y) => `M${x + 5} ${y - 4}L${x} ${y}L${x + 5} ${y + 4}`;
// 手写小标注：小字 + 一道细引线，quiet 色
const note = (t, tx, ty, px, py) => `<path d="M${px} ${py}L${tx} ${py > ty ? ty + 8 : ty - 9}" stroke="${QUIET}" stroke-width=".8" stroke-linecap="round" fill="none" opacity=".8"/>
  <text x="${tx}" y="${ty + 4.5}" text-anchor="middle" style="font:500 12px 'Instrument Sans','PingFang SC',sans-serif;fill:${QUIET}">${t}</text>`;
function side(tongue, air, o = {}) {
  const [ul, ll] = lipsSide(o.push || 0);
  return `<path d="${tongue}" fill="${TONGUE}"/>
    <path d="${TU}" fill="${TEETH}"/><path d="${TL}" fill="${TEETH}"/>
    <path d="${ul}" fill="${CORAL}" transform="translate(.8 .6)"/><path d="${ll}" fill="${CORAL}" transform="translate(.8 .6)"/>
    <path d="${ul}" fill="url(#dots-ink)" opacity=".14"/><path d="${ll}" fill="url(#dots-ink)" opacity=".14"/>
    <path d="${profile(o.push || 0)}" ${LN}/><path d="${PALATE}" ${LN}/><path d="${WALL}" ${LN} opacity=".6"/>
    <circle cx="39.5" cy="3" r="1.5" fill="${INK}"/>
    <path d="${TU}" ${LN} stroke-width="1.1"/><path d="${TL}" ${LN} stroke-width="1.1"/><path d="${tongue}" ${LN} stroke-width="1.3"/>
    ${air ? `<path d="${air}" fill="none" stroke="${AIR}" stroke-width="1.6" stroke-dasharray="4 3.2" stroke-linecap="round"/>` : ''}
    ${o.head ? `<path d="${o.head}" fill="none" stroke="${AIR}" stroke-width="${o.bar ? 2.6 : 1.7}" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${o.ring ? ring(...o.ring) : ''}${(o.notes || []).map(n => note(...n)).join('')}`;
}
const crop = (x, y, w, h, body) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="2 -16 128 140" overflow="hidden">${body}</svg>`;

/* ---------- 正中剖面（第七稿，ich / auch 用）：把头从中间切开，脸朝左 ----------
   头是一整块实心的浅赭黄；嘴里的空腔和喉咙是从里面“挖”出来的纸色通道；
   舌头从嘴底长上来（淡粉，往下渐渐融进下巴的浅色里），只有要用的那一段抬向上面、收成一道窄缝。
   本地坐标 x 0–160，y 0–150。 */
const HEAD = '#f4e4c6', TONGUE2 = '#f4b2a6', PAPER = '#fffdf6', OCHRE = '#e8b35e';
// p：嘴唇往前伸多少（sch 用），只移动唇的那一段
const FACE_TOP = 'M37 -30C36 -14 35 -5 34 0C31 8 24 16 15 24C11 27 12 31 17 32C21 33 25 33 27 34';
const lipsUp = p => `C${26.5 - p * .4} 39 ${25 - p} 44 ${21.5 - p} 47C${19.5 - p} 49 ${20 - p} 51.5 ${23 - p} 52.8`;
const lipsLow = p => `M${24 - p} 55.8C${21 - p} 56.5 ${19.5 - p} 59 ${21.5 - p} 62C${23.5 - p} 65 ${26 - p * .6} 66 26.5 68`;
const FACE_LOW = 'C23 74 22 82 24 88C26 94 31 97 38 98C50 99 62 100 70 104C76 110 78 125 78 150L79 210';
const headD = p => `${FACE_TOP}${lipsUp(p)}L27 53.6L27 55.6L${24 - p} 55.8${lipsLow(p).slice(lipsLow(p).indexOf('C'))}${FACE_LOW}L240 210L240 -30Z`;
const faceLine = p => `${FACE_TOP}${lipsUp(p)}${lipsLow(p)}${FACE_LOW}`;
const lipU = p => `M25.6 41C${24 - p} 45 ${21 - p} 46.5 ${20.6 - p} 49.5C${20.4 - p} 51.5 ${21.5 - p} 52.6 ${23.5 - p} 53L30.5 53.4C31 49 29.6 44 25.6 41Z`;
const lipL = p => `M${24 - p} 55.8L30.5 55.6C31 60 29.6 64.5 26.5 67.6C${23 - p} 65.5 ${20 - p} 62 ${20.3 - p} 59C${20.6 - p} 57 ${22 - p} 56 ${24 - p} 55.8Z`;
const INC_U = 'M33.6 42C34 46 34.2 50 33.4 54.6C35 55.6 37.4 55.4 38.6 54C39.2 50 39.4 46 39 41.6Z';
const INC_L = 'M33.8 67C34 63 34.3 60 34.6 57C35.8 56 37.6 56.2 38.4 57.2C38.4 60 38.2 63.5 38 67Z';
// 空腔上沿：前段（两唇之间 → 上牙后面的小坎）+ 后段（拱起的上颚 → 软的那段和小舌 → 喉咙后壁往下）
const roofF = p => `M${22 - p} 54.6C${26 - p * .5} 53.8 30 53.4 33.5 53.3C34 50 35 46 38 44C41 42.6 44 41.6 46 41`;
const ROOF_B = 'C53 38 62 33 74 31.6C86 30.6 96 31.2 103 34C110 37 115 43 117 50C118 53.5 117.6 56.5 115.6 57.4C114.6 55 116.5 51 120 47.5C123 44.5 126 43 128.5 43C130 70 130.5 110 130 150L130.4 210L117 210L117 150';
const lower = p => `C37.6 62 37 58.8 36.2 56.6C33 56 29 56 ${24 - p} 56C${22.8 - p} 55.8 ${22 - p} 55.2 ${22 - p} 54.6Z`;
// 舌面（空腔下沿）：从喉咙底往上、往前，到舌尖（38.5 64.6，下门牙后面）
const SURF = {
  // 舌尖贴下齿；舌面在上颚中段偏前拱起，后部落下
  ich: 'C117 130 116.5 112 115 100C113 86 108 74 100 64C93 55 86 47 78 42.6C72 39.6 66 38.8 61 39.8C54 41.2 48 47 44.5 54C42.5 58 41.5 61 41.2 63C40.8 64.6 39.6 65.2 38.5 64.6',
  // 舌尖、前部放低；后部拱向后面软的那段
  ach: 'C117 128 116.5 110 115.5 98C115 88 114.5 72 113 62C112 55 111.5 50 110 46.6C108.5 43.4 105.4 42.4 101.6 43.6C92 47 80 54 66 58.6C56 61.4 48 62.2 43 63C41.4 63.4 40 64 38.6 64.6',
  // 舌尖不卷、朝前；舌面前部靠近小坎的后方，比 ich 靠前、比 t / s 靠后
  sch: 'C117 130 116.5 114 115 104C113 92 108 82 100 74C92 67 82 61 72 56.6C64 53 57 48.6 51.6 45.6C48.6 44.4 45.6 45.2 43.6 47.8C41.6 50.6 40.4 55 39.8 59.4C39.4 62 39 63.8 38.5 64.6',
  // s：舌尖离开小坎一点，留一道窄缝
  s: 'C117 130 116.5 112 115 100C113 86 108 74 100 66C92 59 80 56 68 53.5C58 51.2 51 48.6 47 47.6C44 46.9 41.6 48.6 40.6 52C40 56 39.6 61 38.5 64.6',
  // t：舌尖顶在上门牙后面的小坎上（到这里为止，下面接舌头前面）
  t: 'C117 130 116.5 112 115 100C113 86 108 74 100 66C92 59 80 55 68 52C58 49 50.5 45.6 46.2 41.2',
};
const T_FRONT = 'C42.4 43.4 39.8 49 39.2 55C38.8 59.4 38.7 62.6 38.5 64.6';   // t：舌头前面从接触点往下到舌尖底
const TONGUE_BODY = 'C38 70 40 80 50 90C62 98 84 102 100 108C108 114 110 130 110 150Z';
const AIR2 = {
  ich: 'M76 36.2C68 35.6 59 37 51.5 41C45.5 44.6 41 50 37 54.6C31 55 24 55 14 55',
  ach: 'M108.6 41C101.6 39.4 95 41.4 86 45C72 50 56 52.4 46 53.6C40 54.4 35 55 29 55C24 55 19 55 14 55',
  sch: 'M64 46C58 43.4 53 41.8 48.6 42C44.4 43.4 41 48.6 37.4 54.6C31 55 22 55 10 55',
  s: 'M66 49.4C58 47.2 51 45.4 46 44.8C42.4 45.4 40 49.4 37.4 54.6C31 55 24 55 14 55',
  t: 'M84 49.6C76 48 68 46.4 60 45',   // t：气流到这里被堵住
};
const note2 = (t, tx, ty, px, py, fs = 13) => `<path d="M${px} ${py}L${tx} ${py > ty ? ty + fs * .6 : ty - fs * .75}" stroke="${INK}" stroke-width=".7" stroke-linecap="round" fill="none" opacity=".55"/>
  <text x="${tx}" y="${ty + fs * .38}" text-anchor="middle" style="font:500 ${fs}px 'Instrument Sans','PingFang SC',sans-serif;fill:#55585e">${t}</text>`;
function section(kind, o = {}) {
  const p = o.push || 0, surf = SURF[kind], g = `tg-${kind}`, t = kind === 't';
  const tongueTop = t ? surf + T_FRONT : surf;
  const cavity = t
    ? `<path d="M46.2 41.2${ROOF_B}${surf}Z" fill="${PAPER}"/><path d="${roofF(p)}L46.2 41.2C43 43.4 40.2 48 39.4 53.4C36.4 53.4 34 53.4 33.5 53.3Z" fill="${PAPER}"/><path d="M${22 - p} 54.6C26 53.8 30 53.4 33.5 53.3L36.2 56.6C33 56 29 56 ${24 - p} 56C${22.8 - p} 55.8 ${22 - p} 55.2 ${22 - p} 54.6Z" fill="${PAPER}"/>`
    : `<path d="${roofF(p)}${ROOF_B}${surf}${lower(p)}" fill="${PAPER}"/>`;
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="${TONGUE2}"/><stop offset=".62" stop-color="${TONGUE2}" stop-opacity="0"/></linearGradient></defs>
    <path d="${headD(p)}" fill="${OCHRE}" opacity=".45" transform="translate(2 1.6)"/>
    <path d="${headD(p)}" fill="${HEAD}"/>
    <path d="M117 150${tongueTop}${TONGUE_BODY}" fill="url(#${g})"/>
    ${cavity}
    <path d="${lipU(p)}" fill="${CORAL}"/><path d="${lipL(p)}" fill="${CORAL}"/>
    <path d="${lipU(p)}" fill="url(#dots-ink)" opacity=".14"/><path d="${lipL(p)}" fill="url(#dots-ink)" opacity=".14"/>
    <path d="${INC_U}" fill="${TEETH}"/><path d="${INC_L}" fill="${TEETH}"/>
    <path d="${faceLine(p)}" ${LN}/>
    <path d="${roofF(p)}${ROOF_B}" ${LN} stroke-width="1.35"/><path d="M117 210L117 150${tongueTop}" ${LN} stroke-width="1.35"/>
    <path d="M38.5 64.6${lower(p).slice(0, -1)}" ${LN} stroke-width="1.1" opacity=".7"/>
    <path d="${INC_U}" ${LN} stroke-width="1.1"/><path d="${INC_L}" ${LN} stroke-width="1.1"/>
    <path d="${AIR2[kind]}" fill="none" stroke="${AIR}" stroke-width="1.6" stroke-dasharray="4 3.2" stroke-linecap="round"/>
    ${t ? `<path d="M58.6 40.2l2.6 9.4" fill="none" stroke="${AIR}" stroke-width="2.8" stroke-linecap="round"/>`
        : `<path d="M${19 - p} 51L${14 - p} 55L${19 - p} 59" fill="none" stroke="${AIR}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`}
    ${ring(...o.ring)}${(o.notes || []).map(n => note2(...n)).join('')}`;
}
// 并排的小剖面（z 用）：裁到 160×150 的头部区域
const panel = (x, y, w, body) => `<svg x="${x}" y="${y}" width="${w}" height="${w * 108 / 124}" viewBox="8 14 124 108" overflow="hidden">${body}</svg>`;   // 只取鼻底到下巴、喉咙上段

/* ---------- 喉咙振动（w）与气流（v） ---------- */
function neck(cx, top, buzz) {
  const waves = buzz ? [0, 1, 2].map(i => `M${cx - 22 - i * 6} ${top + 14 - i * 3}C${cx - 27 - i * 6} ${top + 24} ${cx - 27 - i * 6} ${top + 34} ${cx - 22 - i * 6} ${top + 44 + i * 3}M${cx + 22 + i * 6} ${top + 14 - i * 3}C${cx + 27 + i * 6} ${top + 24} ${cx + 27 + i * 6} ${top + 34} ${cx + 22 + i * 6} ${top + 44 + i * 3}`).join('') : '';
  return `<path d="M${cx - 15} ${top}C${cx - 14} ${top + 20} ${cx - 15} ${top + 38} ${cx - 17} ${top + 56}M${cx + 15} ${top}C${cx + 14} ${top + 20} ${cx + 15} ${top + 38} ${cx + 17} ${top + 56}" ${LN} opacity=".75"/>
    <path d="M${cx - 5} ${top + 24}C${cx - 3} ${top + 21} ${cx + 3} ${top + 21} ${cx + 5} ${top + 24}" ${LN} opacity=".6"/>
    ${buzz ? `<path d="${waves}" fill="none" stroke="${AIR}" stroke-width="1.6" stroke-linecap="round"/>` : ''}`;
}
const puff = (cx, cy) => `<path d="M${cx - 12} ${cy + 18}l-6 10M${cx} ${cy + 20}v12M${cx + 12} ${cy + 18}l6 10" fill="none" stroke="${AIR}" stroke-width="1.6" stroke-dasharray="3.5 3" stroke-linecap="round"/>`;

/* ---------- 8 张 ---------- */
const sym = (id, body) => `<symbol id="${id}" viewBox="0 0 240 180">${body}</symbol>`;
const S = [
  sym('m-ae', front(62, 78, { w: 74, h: 11, tu: 1, chin: 124 }) + then(120) + front(178, 78, { w: 70, h: 25, tu: 1, tuh: .26, tongue: 1, chin: 140 }) + lab(62, 'e') + lab(178, 'ä')),
  // e → ö，右边小侧面：嘴唇往前伸
  sym('m-oe', front(62, 78, { w: 74, h: 11, tu: 1, chin: 124 }) + then(120) + frontRound(178, 78, { rx: 6.5, ry: 5.2, R: 21, tu: 1, tuh: .55, chin: 124 }) + lab(62, 'e') + lab(178, 'ö')),
  // i → ü：口比 ö 更小
  sym('m-ue', front(62, 78, { w: 82, h: 6.5, tu: 1, tl: 1, tuh: .45, tlh: .4, chin: 120 }) + then(120) + frontRound(178, 78, { rx: 4, ry: 3.4, R: 18, chin: 120 }) + lab(62, 'i') + lab(178, 'ü')),
  sym('m-wv', lipTeeth(62, 52) + neck(62, 106, true) + lipTeeth(178, 52) + neck(178, 106, false) + puff(178, 52) + lab(62, 'w') + lab(178, 'v')),
  sym('m-sch', frontRound(46, 78, { rx: 8.5, ry: 6.2, R: 22, tu: 1, tl: 1, tuh: .5, chin: 126 })
    + `<g transform="translate(89 15) scale(.94)">${section('sch', { push: 4, ring: [49.4, 42.4, 6.5], notes: [['舌头', 82, 118, 82, 68]] })}</g>`),
  sym('m-ich', front(46, 78, { w: 60, h: 8, tu: 1, tl: 1, tuh: .45, tlh: .4, chin: 122 })
    + `<g transform="translate(89 15) scale(.94)">${section('ich', { ring: [64, 36, 6.5], notes: [['上颚', 74, 14, 74, 30.5], ['舌头', 82, 118, 80, 62]] })}</g>`),
  // 只留侧面，放大
  sym('m-ach', `<g transform="translate(26 2) scale(1.18)">${section('ach', { ring: [107, 39.6, 6.5], notes: [['上颚', 74, 14, 74, 30.5], ['舌头', 72, 118, 72, 70]] })}</g>`),
  // 只看嘴里：t 贴住、气流被挡住 → s 留缝、气流出来
  // t：舌尖顶死在小坎上、通道断开 → s：舌尖离开一点、留缝出气
  sym('m-z', panel(0, 18, 114, section('t', { ring: [44.6, 41.8, 6.5], notes: [['舌头', 86, 110, 82, 62, 15]] }))
    + then(120, 66)
    + panel(126, 18, 114, section('s', { ring: [44, 45, 6.5] })) + lab(57, 't', 140) + lab(183, 's', 140)),
];
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${S.join('')}</defs></svg>`);
})();
