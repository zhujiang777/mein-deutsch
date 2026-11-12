// 插画与手绘行为。图形定义来自设计系统的 sprites.js（页面加载时已注入），这里补上原型里的几个图标，
// 并把“头像 / 按键贴纸 / 进度尺 / 注解勾线”做成可以对任意一块页面重复调用的 hydrate()。
import { EXTRA } from './sprites-extra.js';

document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${EXTRA}</defs></svg>`);

export const PERSON = { Lin: 'lin', Lena: 'lena', Tom: 'tom', Krause: 'krause' };
export const NAME = { Lin: '你', Lena: 'Lena', Tom: 'Tom', Krause: 'Herr Krause' };

export const avatar = (who, cls = '') => `<i class="md-pt ${cls}" data-p="${PERSON[who]}"></i>`;
/** 插画贴纸按键。k: a-spk 播放 · a-slow 慢速 · a-pause 暂停 · a-mic 录音 · a-mine 听我的 · a-again 再来一次 */
export const key = (k, { label = '', cls = '', act = '', r = 0, aria = '' } = {}) =>
  `<button type="button" class="md-key ${cls}" data-k="${k}" data-r="${r}"${act ? ` data-act="${act}"` : ''} aria-label="${aria || label}">${label}</button>`;
export const ico = name => `<span data-i="${name}"></span>`;
export const ruler = (n, k) => `<div class="md-ruler" data-n="${n}" data-k="${k}"></div>`;
export const q = de => `<span class="md-q">„</span>${de}<span class="md-q">“</span>`;
export const tick = (cls = 'tick') => `<svg class="${cls}" viewBox="0 0 26 24"><use href="#tick"/></svg>`;
export const seal = (n, cls = 'md-seal') => `<svg class="${cls}" viewBox="0 0 66 66"><use href="#stampsym"/><text class="n" x="33" y="42" text-anchor="middle" filter="url(#rough-s)">${n}</text></svg>`;

let seed = 0;
function drawRuler(el) {
  const W = el.clientWidth, n = Math.max(2, +el.dataset.n), k = Math.min(+el.dataset.k, n - 1);
  if (!W) return;
  let s = 7 + (seed++ % 5) * 13; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - .5);
  const y = 12, x0 = 3, step = (W - 6) / (n - 1);
  let base = `M${x0} ${y + r()}`; for (let x = x0 + 30; x < W - 18; x += 30) base += ` Q${x - 15} ${y + r() * 2.2} ${x} ${y + r()}`; base += ` L${W - 3} ${y + r()}`;
  let ticks = ''; for (let i = 0; i < n; i++) { if (i === k) continue; const x = x0 + i * step + r(), h = 3 + Math.abs(r()) * 3; ticks += `M${x} ${y - h}L${x + r() * 1.4} ${y + h * .8}`; }
  const xe = x0 + k * step; let done = `M${x0 + 1} ${y + .6}`; for (let x = x0 + 24; x < xe; x += 24) done += ` Q${x - 12} ${y + r() * 2} ${x} ${y + r()}`; done += ` L${xe} ${y - .4}`;
  el.innerHTML = `<svg width="${W}" height="24" viewBox="0 0 ${W} 24" style="display:block;overflow:visible"><g filter="url(#rough)" stroke-linecap="round" fill="none">
    <path d="${base}" stroke="#b4b3ac" stroke-width="1.3"/>
    <path d="${done}" stroke="#c3d9ec" stroke-width="10" opacity=".85"/><path d="${done}" transform="translate(4 1.2)" stroke="#b3cfe8" stroke-width="6" opacity=".6"/>
    <path d="${ticks}" stroke="#8e8d87" stroke-width="1.3"/>
    <path d="M${xe} ${y - 8}L${xe + .6} ${y + 7}" stroke="#2f3237" stroke-width="2"/></g></svg>`;
}

function drawLink(cur) {
  const de = cur.querySelector('.md-de'), hl = cur.querySelector('.md-de .md-hl'), en = cur.querySelector('.md-entry .md-lm');
  cur.querySelector('.md-link')?.remove();
  if (!de || !hl || !en) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'md-link'); cur.appendChild(svg);
  if (cur.dataset.link) svg.style.stroke = `var(--${cur.dataset.link})`;
  const c = cur.getBoundingClientRect(), a = de.getBoundingClientRect(), h = hl.getBoundingClientRect(), b = en.getBoundingClientRect();
  const x = a.left - c.left - 12, hx = h.left - c.left + h.width * .5, hy = h.bottom - c.top + 1, x2 = b.left - c.left - 9, y2 = b.top - c.top + b.height / 2;
  svg.innerHTML = `<path d="M${hx} ${hy}C${hx - 4} ${hy + 6} ${x + 10} ${hy + 3} ${x + 2} ${hy + 10}S${x} ${hy + 20} ${x} ${hy + 30}L${x + .5} ${y2 - 12}C${x + .5} ${y2 - 3} ${x + 4} ${y2} ${x2} ${y2}"/><path d="M${x2 - 6} ${y2 - 5}L${x2} ${y2}L${x2 - 6} ${y2 + 4.5}"/>`;
}

/** 把一块刚写进页面的 HTML 里的头像、图标、贴纸按键、进度尺、勾线画出来。可重复调用。 */
export function hydrate(root = document) {
  root.querySelectorAll('[data-p]:empty').forEach(el => { el.innerHTML = `<svg viewBox="0 0 48 48"><use href="#${el.dataset.p}" width="48" height="48"/></svg>`; });
  root.querySelectorAll('[data-i]:empty').forEach(el => { el.innerHTML = `<svg class="ico" viewBox="${el.dataset.i === 'arrow' ? '0 0 28 16' : '0 0 24 24'}"><use href="#${el.dataset.i}"/></svg>`; });
  root.querySelectorAll('[data-k]').forEach(el => { if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 40 40" style="transform:rotate(${el.dataset.r || 0}deg)"><use href="#${el.dataset.k}"/></svg>`); });
  root.querySelectorAll('.md-ruler').forEach(drawRuler);
  root.querySelectorAll('.md-cur').forEach(drawLink);
}

// 每课的首页场景和预习词贴纸由设计对话画在 art-lessons.js 里；还没画好时用设计系统自带的场景占位、词用无图版式。
let lessonArt = { SCENES: {}, PICS: {} };
export const artReady = import('./art-lessons.js').then(m => { lessonArt = { SCENES: m.SCENES || {}, PICS: m.PICS || {} }; }).catch(() => {});
export const sceneOf = id => lessonArt.SCENES[id] || null;
export const picOf = name => lessonArt.PICS[name] || '';
