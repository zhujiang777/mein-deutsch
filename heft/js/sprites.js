// Mein Deutsch · 共用插画与手绘行为（人物头像、场景、插画贴纸按键、手画进度尺、注解勾线）
// 用法：<i class="md-pt" data-p="lena|tom|lin|krause"></i>、<span data-i="x|arrow"></span>、<div class="md-ruler" data-n="12" data-k="4"></div>
(function(){
// 第 8 轮共用插画：手绘线稿 + 丝网印刷式错版色块 + 网点。三个方向共用同一套人物和场景。
const INK = '#24272c';
const C = { ochre: '#e8b35e', coral: '#ef907d', sky: '#94c3e8', mint: '#a5d3b6', paper: '#fffdf8', bread: '#cf9455' };

const face = 'M16 23C16 17 19.5 14 24 14S32 17 32 23 28.5 32.5 24 32.5 16 29 16 23Z';
const shoulders = 'M7.5 48C8.5 39.5 15 35.6 24 35.6S39.5 39.5 40.5 48';
const neck = 'M20.6 30.6 20.9 35.7M27.4 30.6 27.1 35.7';

function person(id, bg, hair, shirt, extra, eyes) {
  return `<symbol id="${id}" viewBox="0 0 48 48">
  <rect width="48" height="48" style="fill:${bg}"/>
  <path d="${shoulders}Z" transform="translate(1.2 1)" style="fill:${shirt}"/>
  <path d="${shoulders}Z" style="fill:url(#dots-ink);opacity:.18" clip-path="url(#half-r)"/>
  <path d="${face}" style="fill:${C.paper}"/>
  ${hair}
  <g style="fill:none;stroke:${INK};stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)">
    <path d="${shoulders}"/><path d="${neck}"/><path d="${face}"/>${extra}
  </g>
  ${eyes}
</symbol>`;
}
const dotEyes = (y) => `<circle cx="21" cy="${y}" r=".95" style="fill:${INK}"/><circle cx="27" cy="${y}" r=".95" style="fill:${INK}"/>`;

const lena = person('lena', '#f6ebd6',
  `<g transform="translate(1 .8)" style="fill:${C.ochre}"><circle cx="24" cy="9.6" r="4.3"/><path d="M15.4 24C14.4 15 18.5 11.6 24 11.6S33.6 15 32.6 24C31 19 28 16.9 24 16.9S17 19 15.4 24Z"/></g>`,
  C.mint,
  `<circle cx="24" cy="9.6" r="4.3"/><path d="M15.4 24C14.4 15 18.5 11.6 24 11.6S33.6 15 32.6 24C31 19 28 16.9 24 16.9S17 19 15.4 24Z"/><path d="M21.6 27.6C23 28.8 25 28.8 26.4 27.6"/>`,
  dotEyes(23.6));

const tom = person('tom', '#e3eff7',
  `<path transform="translate(1 .8)" style="fill:${C.coral}" d="M15.8 21.5C15 14 18.5 11 23 11 24 9.4 27 9.4 28.1 11.2 31.6 12.2 33.1 15.6 32.1 21.5 30.6 17.6 27.6 16.6 24.5 17.3 21 18.1 18 18.8 15.8 21.5Z"/>`,
  C.sky,
  `<path d="M15.8 21.5C15 14 18.5 11 23 11 24 9.4 27 9.4 28.1 11.2 31.6 12.2 33.1 15.6 32.1 21.5 30.6 17.6 27.6 16.6 24.5 17.3 21 18.1 18 18.8 15.8 21.5Z"/><circle cx="20.6" cy="23.8" r="2.9"/><circle cx="27.4" cy="23.8" r="2.9"/><path d="M23.5 23.6h1"/><path d="M22 28.4C23.3 29.3 24.7 29.3 26 28.4"/><path d="M21 35.8 24 39 27 35.8"/>`,
  `<circle cx="20.8" cy="24" r=".8" style="fill:${INK}"/><circle cx="27.2" cy="24" r=".8" style="fill:${INK}"/>`);

const linHair = 'M15 28.5C13.6 18 17 11.2 24 11.2S34.4 18 33 28.5C32 28.6 31.4 28.6 30.6 28.4 31.4 23 31 19.5 29.6 17.6 27 19.6 21.5 19.8 18.2 17.9 17 20.5 16.8 24.5 17.4 28.4 16.6 28.6 15.8 28.6 15 28.5Z';
const lin = person('lin', '#ecece8',
  `<path d="${linHair}" style="fill:#3a3d43"/>`,
  C.ochre,
  `<path d="${linHair}"/><path d="M22 28C23.3 28.9 24.7 28.9 26 28"/>`,
  dotEyes(24.2));

// Herr Krause：灰白鬓发、小胡子、衬衫领（第 15 轮新增）
const krause = `<symbol id="krause" viewBox="0 0 48 48"><rect width="48" height="48" style="fill:#eceee6"/><path d="M7.5 48C8.5 39.5 15 35.6 24 35.6S39.5 39.5 40.5 48Z" transform="translate(1.2 1)" style="fill:#b9c7a4"/><path d="M16 23C16 17 19.5 14 24 14S32 17 32 23 28.5 32.5 24 32.5 16 29 16 23Z" style="fill:#fffdf8"/><path d="M15.6 22.5C15 17.5 16.5 15.4 18.4 15.2 18.6 17.5 18.2 19.5 17.6 22.4ZM32.4 22.5C33 17.5 31.5 15.4 29.6 15.2 29.4 17.5 29.8 19.5 30.4 22.4Z" transform="translate(.8 .6)" style="fill:#c9c6bd"/><path d="M20.3 27.4C22 26.2 26 26.2 27.7 27.4 26 28.4 22 28.4 20.3 27.4Z" style="fill:#a9a59b"/><g style="fill:none;stroke:#24272c;stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><path d="M7.5 48C8.5 39.5 15 35.6 24 35.6S39.5 39.5 40.5 48"/><path d="M20.6 30.6 20.9 35.7M27.4 30.6 27.1 35.7"/><path d="M16 23C16 17 19.5 14 24 14S32 17 32 23 28.5 32.5 24 32.5 16 29 16 23Z"/><path d="M15.6 22.5C15 17.5 16.5 15.4 18.4 15.2 18.6 17.5 18.2 19.5 17.6 22.4ZM32.4 22.5C33 17.5 31.5 15.4 29.6 15.2 29.4 17.5 29.8 19.5 30.4 22.4Z"/><path d="M20.3 27.4C22 26.2 26 26.2 27.7 27.4"/><path d="M19 35.8 24 40.5 29 35.8"/><path d="M19.4 21.6h3.2M25.4 21.6h3.2"/></g><circle cx="21" cy="23.8" r=".9" style="fill:#24272c"/><circle cx="27" cy="23.8" r=".9" style="fill:#24272c"/></symbol>`;
// 店员：面包店、咖啡馆共用（第 2 单元起）
const verk = `<symbol id="verk" viewBox="0 0 48 48"><rect width="48" height="48" style="fill:#f7e7e0"/><path d="M7.5 48C8.5 39.5 15 35.6 24 35.6S39.5 39.5 40.5 48Z" transform="translate(1.2 1)" style="fill:#fffdf8"/><path d="M18.4 48 19.8 39.2H28.2L29.6 48Z" transform="translate(1.2 1)" style="fill:#ef907d"/><path d="M7.5 48C8.5 39.5 15 35.6 24 35.6S39.5 39.5 40.5 48Z" style="fill:url(#dots-ink);opacity:.18" clip-path="url(#half-r)"/><path d="M16 23C16 17 19.5 14 24 14S32 17 32 23 28.5 32.5 24 32.5 16 29 16 23Z" style="fill:#fffdf8"/><path d="M15.2 27.8C13.4 18.2 17.2 11.4 24.2 11.4S34.8 18 33 27.8C32.1 28.1 31.2 28.1 30.4 27.8 30.9 24 31 21.4 30.5 19.4 27 21.2 21.6 20.6 19 17.8 18 20.4 17.6 23.6 17.8 27.6 16.9 28 16 28 15.2 27.8Z" transform="translate(.8 .6)" style="fill:#8a6450"/><g style="fill:none;stroke:#24272c;stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><path d="M7.5 48C8.5 39.5 15 35.6 24 35.6S39.5 39.5 40.5 48"/><path d="M20.6 30.6 20.9 35.7 19.8 39.2M27.4 30.6 27.1 35.7 28.2 39.2"/><path d="M18.4 48 19.8 39.2H28.2L29.6 48"/><path d="M21.8 43.4h4.4"/><path d="M16 23C16 17 19.5 14 24 14S32 17 32 23 28.5 32.5 24 32.5 16 29 16 23Z"/><path d="M15.2 27.8C13.4 18.2 17.2 11.4 24.2 11.4S34.8 18 33 27.8C32.1 28.1 31.2 28.1 30.4 27.8 30.9 24 31 21.4 30.5 19.4 27 21.2 21.6 20.6 19 17.8 18 20.4 17.6 23.6 17.8 27.6 16.9 28 16 28 15.2 27.8Z"/><path d="M21.3 27.6C22.8 29.1 25.2 29.1 26.7 27.6"/></g><g style="fill:none;stroke:#24272c;stroke-width:.8;stroke-linecap:round;opacity:.4"><path d="M19.6 27c-.3.6-.2 1.2.2 1.7M28.4 27c.3.6.2 1.2-.2 1.7"/></g><circle cx="21" cy="23.6" r=".95" style="fill:#24272c"/><circle cx="27" cy="23.6" r=".95" style="fill:#24272c"/></symbol>`;

// 第 16 轮：冰箱磁铁、门铃按钮、铅笔小勾、复习卡、拔开的插头
const batch3 = `<symbol id="a-mag" viewBox="0 0 40 40"><circle transform="translate(1.2 1)" cx="20" cy="20" r="13" style="fill:#ef907d"/><path d="M14 15c2-2.6 5-3.4 8-2.6" style="fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round"/><circle cx="20" cy="20" r="13" style="fill:none;stroke:#2f3237;stroke-width:1.8" filter="url(#rough-s)"/></symbol><symbol id="a-bell" viewBox="0 0 40 40"><rect transform="translate(1.2 1)" x="7" y="6" width="26" height="28" rx="5" style="fill:#e3eef8"/><circle transform="translate(1 1)" cx="20" cy="20" r="6.5" style="fill:#e8b35e"/><g style="fill:none;stroke:#2f3237;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><rect x="7" y="6" width="26" height="28" rx="5"/><circle cx="20" cy="20" r="6.5"/></g><circle cx="18" cy="18" r="1.4" style="fill:#fff"/></symbol><symbol id="pen-tick" viewBox="0 0 26 24"><path d="M4 13c2.2 1.5 3.8 3.4 5.2 5.6C12.8 11.6 17 6.8 22 4" fill="none" stroke="#8e8d87" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol><symbol id="cards" viewBox="0 0 34 34"><rect x="9" y="7" width="18" height="22" rx="2.5" transform="rotate(8 18 18)" style="fill:#fffdf6;stroke:#8e8d87;stroke-width:1.4"/><rect x="7" y="6" width="18" height="22" rx="2.5" transform="rotate(-6 16 17)" style="fill:#fffdf6;stroke:#2f3237;stroke-width:1.5"/><path d="M11 13h9M11 17h6" transform="rotate(-6 16 17)" style="stroke:#8e8d87;stroke-width:1.4;stroke-linecap:round"/></symbol><symbol id="a-plug" viewBox="0 0 60 40"><g transform="translate(1 1)"><rect x="6" y="13" width="15" height="14" rx="3" style="fill:#e8b35e"/><rect x="38" y="12" width="16" height="16" rx="3" style="fill:#a5cfee"/></g><g style="fill:none;stroke:#2f3237;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><path d="M1 20h5"/><rect x="6" y="13" width="15" height="14" rx="3"/><path d="M21 16.5h5M21 23.5h5"/><rect x="38" y="12" width="16" height="16" rx="3"/><path d="M54 20h5"/><path d="M41 17.5h3M41 22.5h3"/></g><g style="fill:none;stroke:#9a9b97;stroke-width:1.5;stroke-linecap:round"><path d="M30 10l1.5 3.5M33.5 8.5l-.5 4M28 30l2-3M33 31.5l-.6-3.6"/></g></symbol>`;

// 今天这一课的场景：桌上一杯咖啡、一个 Brezel、新家的钥匙
const pretzel = 'M163 140C185 124 210 102 217 94 227 82 250 94 243 117 237 140 210 152 195 152 180 152 153 140 147 117 140 94 163 82 173 94 180 102 205 124 227 140';
const mugBody = 'M40 92H98L94 150C93.5 153.5 44.5 153.5 44 150Z';
const scene = `<symbol id="scene" viewBox="0 0 300 190">

  <g transform="translate(2 1.6)">
    <path d="${mugBody}" style="fill:${C.sky}"/>
    <path d="M41.3 108H96.7L96.2 116H41.8Z" style="fill:${C.coral}"/>
    <circle cx="64" cy="172" r="12" style="fill:${C.ochre}"/>
  </g>
  <path d="M44 92C44 89 94 89 94 92S44 95 44 92Z" style="fill:#5a4334"/>
  <path d="${pretzel}" style="fill:none;stroke:${INK};stroke-width:12.5;stroke-linecap:round" filter="url(#rough)"/>
  <path d="${pretzel}" transform="translate(1.4 1.2)" style="fill:none;stroke:${C.bread};stroke-width:9.2;stroke-linecap:round"/>
  <path d="M172 99C176 96 180 97 183 100M232 92C236 92 239 95 240 99M150 113C150 109 152 105 155 103" style="fill:none;stroke:#f3d7ae;stroke-width:1.6;stroke-linecap:round"/>
  <g style="fill:#fff;stroke:${INK};stroke-width:.7"><circle cx="190" cy="148.5" r="1.4"/><circle cx="238" cy="104" r="1.3"/><circle cx="152" cy="126" r="1.3"/><circle cx="205" cy="111" r="1.2"/></g>
  <g style="fill:none;stroke:${INK};stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough)">
    <path d="M14 156C80 154.5 220 155.5 286 156"/>
    <path d="${mugBody}"/><path d="M40 92C40 86 98 86 98 92S40 98 40 92Z"/>
    <path d="M97.6 104C115 102 116 133 95.2 135"/><path d="M97 111.5C106.5 110.5 106.5 126 95.8 127.5"/>
    <path d="M60 80C55 72 65 66 60 56M76 80C71 72 81 66 76 56"/>
    <circle cx="64" cy="172" r="12"/><circle cx="64" cy="172" r="4"/>
    <path d="M76 172H150M134 172V182H140V172M144 172V179H150V172"/>
  </g>
</symbol>`;

const icons = `
<symbol id="spk" viewBox="0 0 24 24"><path d="M4.2 9.6c1.2-.1 2.3 0 3.4-.1l4.3-3.4c.2 3.9.1 7.9 0 11.8L7.7 14.6c-1.2 0-2.3.1-3.5 0-.2-1.6-.2-3.4 0-5z"/><path d="M15.4 9.2c1.3 1.6 1.3 3.9.1 5.6"/><path d="M18 6.8c2.6 3 2.5 7.5.1 10.4"/></symbol>
<symbol id="slow" viewBox="0 0 24 24"><path d="M4.5 15.5c.3-4.3 3.2-7 6.8-7s6.3 2.6 6.6 7c-4.4.4-9 .4-13.4 0z"/><path d="M8 15.5c.3-2 1.6-3.6 3.3-3.6s3 1.6 3.3 3.6"/><path d="M17.9 14c1.2 0 2.4-.8 2.5-2-.6-.6-1.6-.7-2.4-.3"/><path d="M6.5 16v2M15.8 16v2"/></symbol>
<symbol id="again" viewBox="0 0 24 24"><path d="M5 12.3c-.2-4 3-7.1 7-7.2 3.9 0 7 3.1 7 7s-3 7-7 7c-2 0-3.9-.8-5.2-2.2"/><path d="M4 8.6l.9 3.7 3.6-1.1"/></symbol>
<symbol id="arrow" viewBox="0 0 28 16"><path d="M2 8.6c7.6-.4 15.4-.5 23-.4"/><path d="M19.5 2.8c2 1.8 3.9 3.6 5.6 5.4-1.9 1.7-3.8 3.4-5.7 5"/></symbol>
<symbol id="x" viewBox="0 0 24 24"><path d="M6.5 6.8c3.6 3.3 7.4 6.9 11 10.6M17.6 6.5c-3.7 3.6-7.4 7.4-11 11.1"/></symbol>`;

const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="rough" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="rough-s" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="1.1" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="rough-box" x="-2%" y="-10%" width="104%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="1" seed="9"/><feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="sticker" x="-8%" y="-8%" width="116%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/><feGaussianBlur in="d" stdDeviation="2.2"/><feOffset dy="2" result="bo"/><feFlood flood-color="#2a2a26" flood-opacity=".16"/><feComposite in2="bo" operator="in" result="sh"/><feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <pattern id="dots-coral" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2" cy="2" r="1.05" fill="${C.coral}"/></pattern>
  <pattern id="dots-ink" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="1.2" cy="1.2" r=".55" fill="${INK}"/></pattern>
  <clipPath id="half-r"><rect x="27" y="36" width="21" height="12"/></clipPath>
  ${icons}${lena}${tom}${lin}${krause}${verk}${batch3}${scene}
</defs></svg>`;
document.body.insertAdjacentHTML('afterbegin', defs);

// 角色头像：<i class="pt" data-p="lena"></i>
document.querySelectorAll('[data-p]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 48 48"><use href="#${el.dataset.p}" width="48" height="48"/></svg>`;
});
document.querySelectorAll('[data-i]').forEach(el => {
  const vb = el.dataset.i === 'arrow' ? '0 0 28 16' : '0 0 24 24';
  el.innerHTML = `<svg class="ico" viewBox="${vb}"><use href="#${el.dataset.i}"/></svg>`;
});
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="wash2" x="-6%" y="-14%" width="112%" height="128%"><feTurbulence type="fractalNoise" baseFrequency=".03 .07" numOctaves="3" seed="21" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".7" result="b"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 1.25" result="m"/><feComposite in="b" in2="m" operator="in"/></filter><symbol id="a-spk" viewBox="0 0 40 40"><path transform="translate(1.1 1)" d="M5.5 14.5H12v11H5.5z" style="fill:#e8b35e"/><path transform="translate(1.1 1)" d="M12 14.5 21.5 7.5v25L12 25.5z" style="fill:#a5cfee"/><path d="M7.6 17.2v5.6" style="stroke:#fff;stroke-width:1.3;stroke-linecap:round"/><g style="fill:none;stroke:#2f3237;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><path d="M5.5 14.5H12v11H5.5z"/><path d="M12 14.5 21.5 7.5v25L12 25.5z"/><path d="M16.6 11.2v17.6"/><path d="M26 15c2.2 2.8 2.2 7.2 0 10"/><path d="M30 11c4.2 4.8 4.2 13.2 0 18"/></g></symbol><symbol id="a-slow" viewBox="0 0 40 40"><path transform="translate(1 1)" d="M3.5 32C3.5 30 5.5 29.3 8 29.3H27V21.5C27 18 29 16.5 31 16.5S35 18 35 21.5V27.5C35 30.6 33 32 30 32Z" style="fill:#a5d3b6"/><circle transform="translate(1.2 1)" cx="16.5" cy="20.5" r="9.5" style="fill:#e8b35e"/><g style="fill:none;stroke:#2f3237;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><path d="M3.5 32C3.5 30 5.5 29.3 8 29.3H27V21.5C27 18 29 16.5 31 16.5S35 18 35 21.5V27.5C35 30.6 33 32 30 32Z"/><circle cx="16.5" cy="20.5" r="9.5"/><path d="M16.5 20.5c1.2-.6 2.2.6 1.6 1.7-.9 1.6-3.6 1.3-4.3-.5-.9-2.4 1.3-4.6 3.8-4.4 3.4.3 5.1 3.9 3.6 6.9"/><path d="M30.5 16.6 29 10.8M33.4 17.2l1.8-5.4"/></g><circle cx="28.8" cy="10.4" r="1.3" style="fill:#2f3237"/><circle cx="35.4" cy="11.2" r="1.3" style="fill:#2f3237"/><circle cx="32.6" cy="21.6" r="1" style="fill:#2f3237"/></symbol><symbol id="a-pause" viewBox="0 0 40 40"><g transform="translate(1.2 1.2)" style="fill:#a5cfee"><rect x="10.5" y="8" width="7" height="24" rx="2"/><rect x="22.5" y="8" width="7" height="24" rx="2"/></g><g style="fill:none;stroke:#2f3237;stroke-width:1.9;stroke-linejoin:round" filter="url(#rough-s)"><rect x="10.5" y="8" width="7" height="24" rx="2"/><rect x="22.5" y="8" width="7" height="24" rx="2"/></g></symbol><symbol id="a-mine" viewBox="0 0 40 40"><rect transform="translate(1 1)" x="13" y="5" width="14" height="21" rx="7" style="fill:#9fb3cf"/><g style="fill:none;stroke:#2f3237;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><rect x="13" y="5" width="14" height="21" rx="7"/><path d="M30 12c2 2.2 2 6 0 8.2M33.5 9c3.4 4 3.4 10.4 0 14.4"/><path d="M20 26v7M15 34h10"/></g></symbol><symbol id="a-mic" viewBox="0 0 40 40"><rect transform="translate(1.1 1)" x="14" y="4" width="12" height="19" rx="6" style="fill:#a5d3b6"/><path d="M16.5 10.5h7M16.5 14h7M16.5 17.5h7" style="stroke:#fff;stroke-width:1.3;stroke-linecap:round"/><g style="fill:none;stroke:#2f3237;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round" filter="url(#rough-s)"><rect x="14" y="4" width="12" height="19" rx="6"/><path d="M9.5 17.5v1.5a10.5 10.5 0 0 0 21 0v-1.5"/><path d="M20 29.5v5.5M14 35.5h12"/></g></symbol></defs></svg>`);
// 插画贴纸按键：<span class="md-key" data-k="a-spk|a-slow|a-pause|a-mic|a-mine" data-r="-4"></span>
document.querySelectorAll('[data-k]').forEach(el => { const r = el.dataset.r || 0; el.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 40 40" style="transform:rotate(${r}deg)"><use href="#${el.dataset.k}"/></svg>`); });
// 手画进度尺：一句一格，走过的部分像马克笔涂过，当前句一道深色刻度
document.querySelectorAll('.md-ruler').forEach((el, j) => {
  let s = 7 + j * 13; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - .5);
  const W = el.clientWidth, n = +el.dataset.n, k = +el.dataset.k, y = 12, x0 = 3, step = (W - 6) / (n - 1);
  let base = `M${x0} ${y + r()}`; for (let x = x0 + 30; x < W - 18; x += 30) base += ` Q${x - 15} ${y + r() * 2.2} ${x} ${y + r()}`; base += ` L${W - 3} ${y + r()}`;
  let ticks = ''; for (let i = 0; i < n; i++) { if (i === k) continue; const x = x0 + i * step + r(), h = 3 + Math.abs(r()) * 3; ticks += `M${x} ${y - h}L${x + r() * 1.4} ${y + h * .8}`; }
  const xe = x0 + k * step; let done = `M${x0 + 1} ${y + .6}`; for (let x = x0 + 24; x < xe; x += 24) done += ` Q${x - 12} ${y + r() * 2} ${x} ${y + r()}`; done += ` L${xe} ${y - .4}`;
  el.innerHTML = `<svg width="${W}" height="24" viewBox="0 0 ${W} 24" style="display:block;overflow:visible"><g filter="url(#rough)" stroke-linecap="round" fill="none">
    <path d="${base}" stroke="#b4b3ac" stroke-width="1.3"/>
    <path d="${done}" stroke="#c3d9ec" stroke-width="10" opacity=".85"/><path d="${done}" transform="translate(4 1.2)" stroke="#b3cfe8" stroke-width="6" opacity=".6"/>
    <path d="${ticks}" stroke="#8e8d87" stroke-width="1.3"/>
    <path d="M${xe} ${y - 8}L${xe + .6} ${y + 7}" stroke="#2f3237" stroke-width="2"/></g></svg>`;
});
// 注解勾线：从荧光词下方引出，沿句子左侧空白走到词条，不穿过文字
document.querySelectorAll('.md-cur').forEach(cur => {
  const de = cur.querySelector('.md-de'), hl = cur.querySelector('.md-de .md-hl'), en = cur.querySelector('.md-entry .md-lm'); if (!de || !hl || !en) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'md-link'); cur.appendChild(svg);
  const c = cur.getBoundingClientRect(), a = de.getBoundingClientRect(), h = hl.getBoundingClientRect(), b = en.getBoundingClientRect();
  const x = a.left - c.left - 12, hx = h.left - c.left + h.width * .5, hy = h.bottom - c.top + 1, x2 = b.left - c.left - 9, y2 = b.top - c.top + b.height / 2;
  svg.innerHTML = `<path d="M${hx} ${hy}C${hx - 4} ${hy + 6} ${x + 10} ${hy + 3} ${x + 2} ${hy + 10}S${x} ${hy + 20} ${x} ${hy + 30}L${x + .5} ${y2 - 12}C${x + .5} ${y2 - 3} ${x + 4} ${y2} ${x2} ${y2}"/><path d="M${x2 - 6} ${y2 - 5}L${x2} ${y2}L${x2 - 6} ${y2 + 4.5}"/>`;
});
})();
