// heft/js/art-lessons.js —— 试学课插画：首页窗口小场景 + 预习词贴纸。纯数据，无副作用。
// 画法同设计系统 sprites.js：手绘线稿（rough 抖线）+ 错版色块（illus-* 往右下错开 ~2）+ 网点（dots-ink）。
// 依赖页面里已有 sprites.js 的 defs：filter #rough #rough-s #sticker，pattern #dots-ink。
// 自带的 id 只有 sl-01 的 clipPath #al-sl01-win（同一页面里 sl-01 只放一次即可）。
// 颜色全部是 tokens.css 的变量（带回退值）。
//
// SCENES[id] = { svg, labels }
//   svg：viewBox 0 0 300 220，引线已画在图里。
//   labels：[{ de, art, x, y }]，x/y = 这条词「左上角」在场景里的相对位置（0–1）。
//           按首页窗口的排法设计：场景宽约 232px、词 15px 时刚好不压物品。art 为 null 表示专有名词（不上色）。
// PICS[name] = svg：viewBox 0 0 96 96，自带白色贴纸边（#sticker），图形留出 10 以上的边距。

const V = (n, f) => `var(--${n},${f})`;
const K = {
  ink: V('ink', '#24272c'), ink2: V('ink-2', '#3b3e44'),
  ochre: V('illus-ochre', '#e8b35e'), sky: V('illus-sky', '#94c3e8'),
  mint: V('illus-mint', '#a5d3b6'), coral: V('illus-coral', '#ef907d'),
  card: V('card', '#fffdf6'), wash: V('wash', '#e3eef8'),
  skyInk: V('sky-ink', '#3f7aa8'), white: V('sticker-edge', '#ffffff'),
};
const FONT = V('font-sans', '"Instrument Sans",system-ui,sans-serif');

const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
// 错版色块：整组往右下错开
const off = (body, dx = 2, dy = 1.6) => `<g transform="translate(${dx} ${dy})">${body}</g>`;
const f = (d, c) => `<path d="${d}" style="fill:${c}"/>`;
const dots = (d, o = 0.16) => `<path d="${d}" style="fill:url(#dots-ink);opacity:${o}"/>`;
const ink = (w, body, flt = 'rough') =>
  `<g style="fill:none;stroke:${K.ink};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round" filter="url(#${flt})">${body}</g>`;
const p = d => `<path d="${d}"/>`;
const lead = (...ds) =>
  `<g style="fill:none;stroke:${K.ink2};stroke-width:1.3;stroke-linecap:round" filter="url(#rough-s)">${ds.map(p).join('')}</g>`;
const txt = (x, y, s, size, color = K.ink, w = 600, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" style="font-family:${FONT};font-size:${size}px;font-weight:${w};fill:${color}">${s}</text>`;
const hi = d => `<path d="${d}" style="fill:none;stroke:${K.white};stroke-width:1.6;stroke-linecap:round"/>`;

/* ---------- 场景 ---------- */

// sl-00 楼下：路牌 Schillerstraße、门牌 8、对讲门铃三个名牌、大门
const bellRow = (y, name) => `
  ${off(`<circle cx="52" cy="${y}" r="8.5" style="fill:${K.ochre}"/>`, 1.2, 1)}
  <path d="M68 ${y - 12}H160V${y + 12}H68Z" style="fill:${K.card}"/>
  ${txt(114, y + 6, name, 17, K.ink)}`;
const bellRowInk = y => `<circle cx="52" cy="${y}" r="8.5"/><path d="M68 ${y - 12}H160V${y + 12}H68Z"/>`;
const sl00 = svg('0 0 300 220', `
  ${off(`
    <path d="M30 60H174V198H30Z" style="fill:${K.wash}"/>
    <path d="M198 54H286V206H198Z" style="fill:${K.sky}"/>
    <path d="M222 12H258V42H222Z" style="fill:${K.skyInk}"/>`)}
  ${dots('M246 54H286V206H246Z', 0.14)}
  <path d="M212 70H272V134H212Z" style="fill:${K.wash}"/>
  ${hi('M220 80l10-6M220 92l18-12')}
  <path d="M16 12H160V40H16Z" style="fill:${K.card}"/>
  ${txt(88, 32, 'Schillerstraße', 16, K.ink)}
  ${txt(240, 35, '8', 23, K.white, 700)}
  ${bellRow(108, 'Krause')}${bellRow(140, 'Becker')}${bellRow(172, 'Vogel')}
  <g style="fill:${K.ink}">${[0, 1, 2].map(r => [0, 1, 2, 3, 4, 5].map(c => `<circle cx="${80 + c * 9}" cy="${72 + r * 7}" r="1.4"/>`).join('')).join('')}</g>
  ${ink(1.7, `
    <path d="M10 206C90 205 210 206.5 292 206"/>
    <path d="M30 60H174V198H30Z"/>
    ${bellRowInk(108)}${bellRowInk(140)}${bellRowInk(172)}
    <path d="M198 206V54H286V206"/><path d="M212 70H272V134H212Z"/>
    <path d="M208 150h16M210 150v8"/>
    <path d="M222 12H258V42H222Z"/>
    <path d="M16 12H160V40H16Z"/>`)}
  ${ink(1, '<path d="M20 16H156V36H20Z"/>', 'rough-s')}`);

// sl-01 厨房：窗外公交开过去（被窗框切掉一截），窗边一片窗帘，桌上一杯咖啡，行李箱刚拖进来、还斜着
const mug = 'M146 128H198L194 182C193.5 185.5 150.5 185.5 150 182Z';
const BUS = 'M56 94V64C56 60 58 58 62 58H200V94Z';
const CASE = 'M237 118H279C282 118 284 120 284 123V174C284 177 282 179 279 179H237C234 179 232 177 232 174V123C232 120 234 118 237 118Z';
const sl01 = svg('0 0 300 220', `
  <defs><clipPath id="al-sl01-win"><path d="M24 38H130V104H24Z"/></clipPath></defs>
  ${off(`<path d="M22 36H132V106H22Z" style="fill:${K.wash}"/>`)}
  <g clip-path="url(#al-sl01-win)">
    ${off(`<path d="${BUS}" style="fill:${K.ochre}"/>`)}
    <path d="M62 64H76V82H62Z" style="fill:${K.card}"/><path d="M84 64H160V76H84Z" style="fill:${K.card}"/>
    <circle cx="78" cy="96" r="6" style="fill:${K.ink2}"/>
    ${ink(1.7, `<path d="${BUS}"/><path d="M62 64H76V82H62ZM84 64H160V76H84ZM106 64V76M128 64V76"/><circle cx="78" cy="96" r="6"/>`)}
  </g>
  ${hi('M30 48l10-8M30 60l18-14')}
  ${off(`<path d="M108 36H132V106H124C122 94 128 84 124 74C115 68 110 54 108 36Z" style="fill:${K.mint}"/>`, 1.6, 1.2)}
  ${dots('M108 36H132V106H124C122 94 128 84 124 74C115 68 110 54 108 36Z', 0.14)}
  ${ink(1.7, `<path d="M108 36C110 54 115 68 124 74C128 84 122 94 124 106"/><path d="M119 71C122 67 128 67 131 71" style="stroke-width:1.3"/>
    <path d="M118 42C120 50 122 57 126 63M126 84C127 92 127 99 128 104" style="stroke-width:1.1"/>`)}
  <g transform="rotate(-6 284 183)">
    ${off(`<path d="${CASE}" style="fill:${K.coral}"/><path d="M241 118H247V179H241ZM269 118H275V179H269Z" style="fill:${K.ochre}"/>`)}
    ${dots('M266 118H284V179H266Z', 0.15)}
    ${hi('M237 126v14')}
    <path d="M252 106L262 110L258 120L248 116Z" style="fill:${K.card}"/>
    ${ink(1.7, `<path d="${CASE}"/><path d="M249 118V111C249 109 250 108 252 108H264C266 108 267 109 267 111V118"/>
      <circle cx="240" cy="183" r="3.4"/><circle cx="276" cy="183" r="3.4"/>
      <path d="M252 106L262 110L258 120L248 116Z" style="stroke-width:1.2"/>`)}
  </g>
  ${off(`<path d="${mug}" style="fill:${K.sky}"/><path d="M147.2 143H196.8L196.3 150H147.7Z" style="fill:${K.coral}"/>`)}
  <path d="M150 128C150 125 194 125 194 128S150 131 150 128Z" style="fill:${K.ink2}"/>
  ${ink(1.7, `
    <path d="M10 186C90 185 210 186.5 292 186"/>
    <path d="M22 36H132V106H22Z"/><path d="M16 109H138"/>
    <path d="${mug}"/><path d="M146 128C146 122 198 122 198 128S146 134 146 128Z"/>
    <path d="M197.6 139C213 137 214 165 195.4 167"/><path d="M197 146C205.5 145 205.5 159 196 160.5"/>
    <path d="M174 116C169 110 179 106 174 98M188 116C183 110 193 106 188 98"/>`)}
  ${lead('M44 28C52 38 60 46 68 56', 'M164 72C162 90 158 106 154 122')}`);

// sl-02 地图：折叠地图，两枚图钉 Köln → Singapur，虚线连起来
const pin = (x, y, c) => off(`<path d="M${x} ${y}C${x - 4} ${y - 9} ${x - 10} ${y - 14} ${x - 10} ${y - 21}A10 10 0 0 1 ${x + 10} ${y - 21}C${x + 10} ${y - 14} ${x + 4} ${y - 9} ${x} ${y}Z" style="fill:${c}"/>`, 1.4, 1.2);
const pinInk = (x, y) => `<path d="M${x} ${y}C${x - 4} ${y - 9} ${x - 10} ${y - 14} ${x - 10} ${y - 21}A10 10 0 0 1 ${x + 10} ${y - 21}C${x + 10} ${y - 14} ${x + 4} ${y - 9} ${x} ${y}Z"/><circle cx="${x}" cy="${y - 21}" r="3.6"/>`;
const mapP = 'M14 46L82 40L148 46L214 40V200L148 206L82 200L14 206Z';
const sl02 = svg('0 0 300 220', `
  ${off(`<path d="${mapP}" style="fill:${K.wash}"/>`)}
  ${off(`
    <path d="M34 66C46 56 64 58 72 64C78 72 76 82 68 90C58 96 44 96 38 88C30 82 28 72 34 66Z"/>
    <path d="M44 104C58 98 78 102 84 112C88 126 82 146 74 160C68 172 60 176 56 166C52 150 44 140 40 126C38 116 38 108 44 104Z"/>
    <path d="M86 70C104 56 140 54 168 60C186 66 196 78 194 92C190 104 178 110 170 112C166 122 162 130 158 134C154 130 152 122 148 116C138 118 124 120 112 114C100 108 90 98 88 90C84 82 84 76 86 70Z"/>
    <path d="M178 168C184 160 198 160 204 166C208 174 202 182 194 184C184 186 176 178 178 168Z"/>
    <path d="M170 136C174 134 180 136 182 140C178 142 172 142 170 136Z"/>`.replace(/<path /g, `<path style="fill:${K.mint}" `), 2.2, 1.8)}
  ${dots('M82 40L148 46V206L82 200Z', 0.12)}
  ${pin(62, 78, K.coral)}${pin(160, 136, K.ochre)}
  ${ink(1.7, `
    <path d="${mapP}"/><path d="M82 40V200M148 46V206"/>
    ${pinInk(62, 78)}${pinInk(160, 136)}`)}
  <path d="M68 60C96 30 150 50 154 108" style="fill:none;stroke:${K.ink2};stroke-width:1.6;stroke-linecap:round;stroke-dasharray:1 6" filter="url(#rough-s)"/>
  ${lead('M44 26C50 32 56 38 60 48', 'M218 98C200 104 184 110 172 114')}`);

// sl-03 厨房：墙上的日历（das Jahr）、医学书摞在书上、一口锅冒着气
const pot = 'M206 132H278V164C278 172 272 178 264 178H220C212 178 206 172 206 164Z';
const sl03 = svg('0 0 300 220', `
  ${off(`
    <path d="M22 26H104V118H22Z" style="fill:${K.card}"/>
    <path d="M22 26H104V48H22Z" style="fill:${K.coral}"/>
    <path d="M96 150H186V178H96Z" style="fill:${K.coral}"/>
    <path d="M104 128H178V150H104Z" style="fill:${K.mint}"/>
    <path d="${pot}" style="fill:${K.sky}"/>
    <path d="M202 126C202 118 282 118 282 126Z" style="fill:${K.card}"/>
    <circle cx="242" cy="113" r="5" style="fill:${K.ochre}"/>`)}
  <path d="M22 26H104V118H22Z" style="fill:${K.card}"/>
  ${off('<path d="M22 26H104V48H22Z"/>'.replace('<path', `<path style="fill:${K.coral}"`), 2, 1.6)}
  <g style="fill:${K.ink2}">${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => `<rect x="${32 + c * 14}" y="${58 + r * 14}" width="6" height="4" rx="1"/>`).join('')).join('')}</g>
  <path d="M130 158V170M124 164H136" style="fill:none;stroke:${K.white};stroke-width:3.4;stroke-linecap:round"/>
  ${dots('M252 132H278V164C278 172 272 178 264 178H252Z', 0.16)}
  ${dots('M160 150H186V178H160Z', 0.14)}
  ${ink(1.7, `
    <path d="M10 180C90 179 210 180.5 292 180"/>
    <path d="M22 26H104V118H22Z"/><path d="M22 48H104"/>
    <path d="M40 20V32M86 20V32"/>
    <path d="M57 86A10 10 0 1 0 77 86A10 10 0 1 0 57 86" style="stroke:${K.coral};stroke-width:1.5"/>
    <path d="M96 150H186V178H96Z"/><path d="M104 128H178V150H104Z"/>
    <path d="M178 154H186M178 160H186M178 166H186" style="stroke-width:1.1"/>
    <path d="M110 133H150" style="stroke-width:1.2"/>
    <path d="${pot}"/><path d="M202 126C202 118 282 118 282 126Z"/><path d="M200 127H284"/>
    <circle cx="242" cy="113" r="5"/>
    <path d="M206 140C198 140 196 148 206 148M278 140C286 140 288 148 278 148"/>
    <path d="M226 104C221 98 231 92 226 84M242 98C237 92 247 86 242 76M258 104C253 98 263 92 258 84"/>`)}
  ${lead('M146 22C130 26 118 32 108 40')}`);

// sl-04 门口：3 号房门（猫眼、门把手）、一把大钥匙
const door = 'M40 14H150V206H40Z';
const keyBow = '<circle cx="196" cy="132" r="18"/>';
const keyBit = 'M212 127H282V137H276V149H268V141H262V151H254V137H212Z';
const sl04 = svg('0 0 300 220', `
  ${off(`
    <path d="${door}" style="fill:${K.ochre}"/>
    <path d="M78 38H112V64H78Z" style="fill:${K.card}"/>
    <g transform="translate(0 -34) rotate(-14 236 140)">${keyBow.replace('<circle', `<circle style="fill:${K.ochre}"`)}<path d="${keyBit}" style="fill:${K.ochre}"/></g>`)}
  ${dots('M118 14H150V206H118Z', 0.14)}
  <path d="M124 110H136V148H124Z" style="fill:${K.card}"/>
  <circle cx="95" cy="84" r="4" style="fill:${K.ink2}"/>
  ${txt(95, 59, '3', 21, K.ink, 700)}
  ${ink(1.7, `
    <path d="M10 206C90 205 210 206.5 292 206"/>
    <path d="M34 206V8H156V206"/><path d="${door}"/>
    <path d="M56 100H134V188H56Z" style="stroke-width:1.3"/>
    <path d="M78 38H112V64H78Z"/><circle cx="95" cy="84" r="4"/>
    <path d="M124 110H136V148H124Z"/><path d="M130 118H114"/><circle cx="130" cy="138" r="2"/>
    <g transform="translate(0 -34) rotate(-14 236 140)">${keyBow}<circle cx="196" cy="132" r="6"/><path d="${keyBit}"/></g>`)}
  <g transform="translate(0 -34)">${hi('M184 118c4-4 9-5 13-4')}</g>
  ${lead('M166 30C148 36 132 42 116 48', 'M214 148C212 140 208 134 204 128')}`);

export const SCENES = {
  'sl-00': { svg: sl00, labels: [] },
  'sl-01': { svg: sl01, labels: [
    { de: 'der Kaffee', art: 'der', x: 0.52, y: 0.22 },
    { de: 'der Bus', art: 'der', x: 0.05, y: 0.03 },
  ] },
  'sl-02': { svg: sl02, labels: [
    { de: 'Köln', art: null, x: 0.05, y: 0.02 },
    { de: 'Singapur', art: null, x: 0.73, y: 0.38 },
  ] },
  'sl-03': { svg: sl03, labels: [
    { de: 'das Jahr', art: 'das', x: 0.50, y: 0.03 },
  ] },
  'sl-04': { svg: sl04, labels: [
    { de: 'das Zimmer', art: 'das', x: 0.56, y: 0.06 },
    { de: 'der Schlüssel', art: 'der', x: 0.56, y: 0.67 },
  ] },
};

/* ---------- 预习词贴纸 ---------- */

const pic = body => svg('0 0 96 96', `<g filter="url(#sticker)">${body}</g>`);
const W = 2.3; // 贴纸线宽

const PIC_MUG = 'M22 36H64L61 78C60.6 81 25.4 81 25 78Z';
const kaffee = pic(`
  ${off(`<path d="${PIC_MUG}" style="fill:${K.sky}"/><path d="M23 47H63L62.5 53H23.5Z" style="fill:${K.coral}"/>`)}
  <path d="M26 36C26 34 60 34 60 36S26 38 26 36Z" style="fill:${K.ink2}"/>
  ${ink(W, `<path d="${PIC_MUG}"/><path d="M22 36C22 32 64 32 64 36S22 40 22 36Z"/>
    <path d="M63.6 44C78 43 78 68 61.8 69"/><path d="M63 50C70 49.5 70 63 62.3 63.5"/>
    <path d="M36 26C32 21 40 18 36 11M50 26C46 21 54 18 50 11"/>`)}`);

const bus = pic(`
  ${off(`<path d="M12 24H82C85 24 86 26 86 30V66H12Z" style="fill:${K.ochre}"/>`)}
  <path d="M18 32H62V48H18Z" style="fill:${K.card}"/><path d="M68 32H80V54H68Z" style="fill:${K.card}"/>
  ${dots('M12 56H86V66H12Z', 0.18)}
  <circle cx="28" cy="68" r="7.5" style="fill:${K.ink2}"/><circle cx="70" cy="68" r="7.5" style="fill:${K.ink2}"/>
  ${ink(W, `<path d="M12 66V28C12 26 13 24 16 24H82C85 24 86 26 86 30V66Z"/>
    <path d="M18 32H62V48H18ZM33 32V48M48 32V48M68 32H80V54H68Z"/>
    <circle cx="28" cy="68" r="7.5"/><circle cx="70" cy="68" r="7.5"/><path d="M86 60H89"/>`)}
  <circle cx="28" cy="68" r="2.2" style="fill:${K.card}"/><circle cx="70" cy="68" r="2.2" style="fill:${K.card}"/>`);

const BOOK_L = 'M48 30C38 23 24 21 12 24V72C24 69 38 71 48 78Z';
const BOOK_R = 'M48 30C58 23 72 21 84 24V72C72 69 58 71 48 78Z';
const buch = pic(`
  ${off(`<path d="M9 28V76C24 73 38 75 48 82C58 75 72 73 87 76V28Z" style="fill:${K.sky}"/>`, 2, 2)}
  <path d="${BOOK_L}" style="fill:${K.card}"/><path d="${BOOK_R}" style="fill:${K.card}"/>
  ${ink(W, `<path d="${BOOK_L}"/><path d="${BOOK_R}"/><path d="M9 28V76C24 73 38 75 48 82C58 75 72 73 87 76V28"/>`)}
  ${ink(1.4, '<path d="M19 36C27 35 34 36 41 39M19 45C27 44 34 45 41 48M19 54C25 53 30 54 35 56M55 39C62 36 69 35 77 36M55 48C62 45 69 44 77 45M55 57C62 54 69 53 77 54"/>', 'rough-s')}`);

const PIC_POT = 'M18 46H78V70C78 78 72 82 64 82H32C24 82 18 78 18 70Z';
const topf = pic(`
  ${off(`<path d="${PIC_POT}" style="fill:${K.sky}"/><path d="M14 41C14 32 82 32 82 41Z" style="fill:${K.card}"/><circle cx="48" cy="29" r="4.5" style="fill:${K.ochre}"/>`)}
  ${dots('M58 46H78V70C78 78 72 82 64 82H58Z', 0.18)}
  ${ink(W, `<path d="${PIC_POT}"/><path d="M14 41C14 32 82 32 82 41Z"/><path d="M12 42H84"/><circle cx="48" cy="29" r="4.5"/>
    <path d="M18 54C10 54 9 62 18 62M78 54C86 54 87 62 78 62"/>
    <path d="M34 22C30 18 37 15 34 9M62 22C58 18 65 15 62 9"/>`)}`);

const tuer = pic(`
  ${off(`<path d="M28 12H68V86H28Z" style="fill:${K.ochre}"/>`)}
  <path d="M39 18H57V34H39Z" style="fill:${K.card}"/>
  ${dots('M56 12H68V86H56Z', 0.16)}
  ${txt(48, 31, '3', 13, K.ink, 700)}
  ${ink(W, `<path d="M22 86V7H74V86"/><path d="M28 12H68V86H28Z"/><path d="M39 18H57V34H39Z"/>
    <path d="M60 52H52M60 49V56"/><path d="M14 86H82"/>`)}
  ${ink(1.4, '<path d="M35 42H61V78H35Z"/>', 'rough-s')}`);

const haus = pic(`
  ${off(`<path d="M12 46L48 16L84 46Z" style="fill:${K.coral}"/><path d="M42 62H56V84H42Z" style="fill:${K.sky}"/>`)}
  <path d="M20 44H76V84H20Z" style="fill:${K.card}"/>
  ${off(`<path d="M42 62H56V84H42Z" style="fill:${K.sky}"/>`, 1, 1)}
  <path d="M26 54H38V66H26ZM60 54H70V66H60Z" style="fill:${K.wash}"/>
  ${ink(W, `<path d="M12 46L48 16L84 46"/><path d="M20 42V84H76V42"/><path d="M62 30V19H70V37"/>
    <path d="M42 84V62H56V84"/><path d="M26 54H38V66H26ZM60 54H70V66H60ZM32 54V66M65 54V66"/><path d="M10 84H86"/>`)}`);

const uni = pic(`
  ${off(`<path d="M48 20L86 36L48 52L10 36Z" style="fill:${K.sky}"/><path d="M26 44V62C34 70 62 70 70 62V44L48 53Z" style="fill:${K.sky}"/>`)}
  ${dots('M48 52L70 44V62C64 67 56 68.5 48 68.5Z', 0.2)}
  ${off(`<path d="M76 40V62L72 70H82L78 62V40Z" style="fill:${K.ochre}"/>`, 1, 1)}
  ${ink(W, `<path d="M48 20L86 36L48 52L10 36Z"/><path d="M26 44V62C34 70 62 70 70 62V44"/>
    <path d="M48 36L77 40V62"/><path d="M73 70L77 61L81 70Z"/>`)}
  <circle cx="48" cy="36" r="2.4" style="fill:${K.ink}"/>`);

const kalender = pic(`
  ${off(`<path d="M16 22H80V82H16Z" style="fill:${K.card}"/><path d="M16 22H80V38H16Z" style="fill:${K.coral}"/>`)}
  <path d="M16 22H80V82H16Z" style="fill:${K.card}"/>
  ${off(`<path d="M16 22H80V38H16Z" style="fill:${K.coral}"/>`, 1.6, 1.2)}
  <g style="fill:${K.ink2}">${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${24 + c * 13}" y="${48 + r * 11}" width="7" height="4" rx="1"/>`).join('')).join('')}</g>
  ${ink(W, `<path d="M16 22H80V82H16Z"/><path d="M16 38H80"/><path d="M32 14V28M64 14V28"/>`)}`);

const schluessel = pic(`<g transform="rotate(-32 48 48)">
  ${off(`<circle cx="26" cy="48" r="14" style="fill:${K.ochre}"/><path d="M38 44H86V52H82V62H76V56H70V64H64V52H38Z" style="fill:${K.ochre}"/>`)}
  ${ink(W, '<circle cx="26" cy="48" r="14"/><circle cx="26" cy="48" r="4.5"/><path d="M39.5 44H86V52H82V62H76V56H70V64H64V52H39.5"/>')}
  ${hi('M17 40c3-3 7-4 10-3.5')}</g>`);

const HAND = 'M36 86L34 70C28 64 20 57 19 51C18 45 25 43 29 47L34 53V27C34 21 42 21 42 27V45V22C42 16 50 16 50 22V45V25C50 19 58 19 58 25V48V33C58 28 65 28 65 33V64C65 76 62 82 62 86Z';
const hand = pic(`
  ${off(`<path d="M35 80H63V90H35Z" style="fill:${K.mint}"/>`, 1.4, 1.2)}
  <path d="${HAND}" style="fill:${K.card}"/>
  ${dots('M58 48V33C58 28 65 28 65 33V64C65 76 62 82 62 86H54Z', 0.12)}
  ${ink(W, `<path d="${HAND}"/><path d="M35 80H63V90H35Z"/>
    <path d="M14 30C11 25 12 19 16 15M76 22C81 26 82 33 79 38"/>`)}`);

const THUMB = 'M30 50C30 46 33 44 36 44L37 20C37 13 47 13 47 20L46 42H62C67 42 68 48 64 50C69 51 69 57 64 58C69 59 69 65 64 66C68 67 67 74 62 74L36 76C32 76 30 73 30 70Z';
const daumen = pic(`
  ${off(`<path d="M16 44H30V78H16Z" style="fill:${K.sky}"/>`, 1.4, 1.2)}
  <path d="${THUMB}" style="fill:${K.card}"/>
  ${dots('M46 58H64C69 59 69 65 64 66C68 67 67 74 62 74L46 75Z', 0.12)}
  ${ink(W, `<path d="${THUMB}"/><path d="M46 50H63M46 58H64M46 66H63"/><path d="M16 44H30V78H16Z"/>`)}`);

const MAP_S = 'M12 28L36 24L60 28L84 24V76L60 80L36 76L12 80Z';
const land = pic(`
  ${off(`<path d="${MAP_S}" style="fill:${K.wash}"/>`)}
  ${off(`<path d="M18 38C24 32 34 33 36 38C38 44 34 50 28 52C22 54 16 46 18 38Z" style="fill:${K.mint}"/>
    <path d="M40 36C50 30 66 31 74 36C78 42 74 52 64 54C58 60 56 64 54 60C50 54 44 52 40 48C38 44 38 40 40 36Z" style="fill:${K.mint}"/>
    <path d="M24 58C30 56 36 58 36 64C36 70 32 74 28 72C24 70 22 62 24 58Z" style="fill:${K.mint}"/>`, 1.8, 1.4)}
  ${dots('M36 24L60 28V80L36 76Z', 0.12)}
  ${off('<path d="M58 54C55 47 50 44 50 38A8 8 0 0 1 66 38C66 44 61 47 58 54Z"/>'.replace('<path', `<path style="fill:${K.coral}"`), 1.2, 1)}
  ${ink(W, `<path d="${MAP_S}"/><path d="M36 24V76M60 28V80"/>
    <path d="M58 54C55 47 50 44 50 38A8 8 0 0 1 66 38C66 44 61 47 58 54Z"/><circle cx="58" cy="38" r="2.8"/>`)}`);

export const PICS = { kaffee, bus, buch, topf, tuer, haus, uni, kalender, schluessel, hand, daumen, land };
// 不画（用无图版式）：neu、frage、raus、woher、pfeil、ort、person、leer —— 画出来只会是抽象符号。
