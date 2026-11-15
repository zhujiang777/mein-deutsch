// 手帐页：学习日历 + 发音 / 语法 / 文化三类分开的合集。内容全部来自课程数据，学到哪亮到哪；点开一条就是那张卡，随时复习。
import { rowSay } from '../../data/story-lessons.js';
import { albumOf } from './flow.js';
import { key, hydrate, ico, seal } from './art.js';
import { esc, buildTbl, cellKey, hlClass } from './screens.js';
import { cribHtml, bindCrib, wordBack, wordActs } from './screens2.js';
import { entry } from './flow.js';
import { playWord, stop } from './audio.js';
import { dayKey } from './store.js';

const TAB_KEY = 'md.heft.album';
const DAY = 86400000;
const mouth = id => `<div class="md-mouth"><svg viewBox="0 0 240 180"><use href="#${id}"/></svg></div>`;
/* 顶上的日历：最近两周。学过的那天盖那一课的章，只复习的那天是复习卡，今天画圈。 */
function calendar(state, ts, { numOf, findItem }) {
  const t0 = new Date(ts), mon = ts - ((t0.getDay() + 6) % 7) * DAY, todayK = dayKey(ts);
  const month = todayK.slice(0, 7), days = Object.keys(state.log).filter(k => k.startsWith(month)).length;
  const cells = [...Array(14)].map((_, i) => { const d = new Date(mon - 7 * DAY + i * DAY), k = dayKey(d.getTime()), log = state.log[k];
    const it = log?.map(e => e.type !== 'review' && findItem(e.id)).filter(Boolean).at(-1);
    const mark = it ? seal(it.kind === 'quiz' ? '测' : numOf(it), 'md-mini-seal').replace('<svg', `<svg style="--r:${[-8, 6, -4, 9, -6, 5, -9][i % 7]}deg"`) : log ? '<svg class="rv" viewBox="0 0 34 34"><use href="#cards"/></svg>' : '';
    return `<span class="d ${log ? 'on' : ''} ${k === todayK ? 'today' : ''}">${d.getDate()}${mark}</span>`; });
  return `<div class="al-h"><h2>${t0.getMonth() + 1} 月</h2><span>学了 <b>${days}</b> 天</span><a class="md-more" href="#/log"><u>全部</u>${ico('arrow')}</a></div>
    <div class="al-cal">${['一', '二', '三', '四', '五', '六', '日'].map(w => `<span class="w">${w}</span>`).join('')}${cells.join('')}</div>`;
}

/* 从底下拉出一张纸。返回这张纸，调用方自己接事件。 */
function pull(html, cls = '') {
  document.querySelector('.md-pull')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="md-pull al-pull ${cls}"><div class="pp"><span class="md-tape"></span><button type="button" class="x" aria-label="关上"></button>${html}</div></div>`);
  const sh = document.body.lastElementChild; hydrate(sh);
  sh.addEventListener('click', e => { if (e.target === sh || e.target.closest('.x')) { stop(); sh.remove(); } });
  return sh;
}
const src = l => `<p class="src">第 ${l.n} 课 · ${esc(l.title)}</p>`;
// 整张表：每行的喇叭把这一行的每一列都念一遍
function bindRows(sh, tables) {
  let run = 0;
  sh.addEventListener('click', async e => { const b = e.target.closest('[data-act=row]'); if (!b) return;
    const t = tables[[...sh.querySelectorAll('.hf-btbl')].indexOf(b.closest('.hf-btbl'))], r = t.rows[+b.dataset.row], mine = ++run;
    for (let k = 1; k < r.length; k++) if (mine !== run || !await playWord(rowSay(r, k))) return; });
}
function openGrammar({ c, l }) {
  const lit = new Set((c.drill || []).map(cellKey));
  const sh = pull(`${src(l)}<h2>${esc(c.title)}</h2><p class="say">${esc(c.body)}</p>${buildTbl(c, lit, { full: true })}
    ${c.contrast ? `<div class="hf-contrast">${c.contrast.map(([a, b]) => `<div class="pr"><button type="button" class="md-paper" data-say>${esc(a)}</button><button type="button" class="md-paper" data-say>${esc(b)}</button></div>`).join('')}</div>` : ''}`);
  bindRows(sh, [c.table]); bindSay(sh);
}
function openUnit(u) {
  const all = t => new Set(t.rows.flatMap((r, i) => r.slice(1).map((_, k) => `${i}:${k + 1}`)));
  const sh = pull(`<p class="src">第 ${u.n} 单元 · ${esc(u.name)}</p><h2>单元总表</h2><p class="say">${esc(u.sum.rule || '')}</p>${u.sum.tables.map(t => buildTbl({ table: t }, all(t), { full: true })).join('')}`);
  bindRows(sh, u.sum.tables);
}
const bindSay = sh => sh.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) playWord(b.dataset.say || b.textContent); });
function openTip({ c, l }) {
  bindSay(pull(`${src(l)}<h2>${esc(c.title)}</h2><p class="say">${esc(c.body)}</p>${c.words ? `<p class="ws">${c.words.map(w => `<span><small>${{ der: '阳性', die: '阴性', das: '中性' }[hlClass(w)] || ''}</small><button type="button" class="md-hl ${hlClass(w)}" data-say>${esc(w)}</button></span>`).join('')}</p>` : ''}`));
}
function openPron({ c, l }) {
  const sh = pull(`${src(l)}<h2>${esc(c.title)}</h2><p class="say">${esc(c.body)}</p>${c.pics ? `<div class="md-mouth hf-mouth"><svg viewBox="0 0 240 180"><use href="#${c.pics[0]}"/></svg></div>` : ''}
    <div class="md-pair hf-pair">${(c.pairs || []).map((p, i) => `<button type="button" class="md-paper c" data-say="${esc(p)}" data-i="${i}"><p class="w">${esc(p)}</p>${key('a-spk', { cls: 's', aria: '听', r: -3 }).replace('<button', '<span').replace('</button>', '</span>')}</button>`).join('')}</div>`);
  bindSay(sh);
  sh.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b && c.pics?.[+b.dataset.i]) sh.querySelector('.hf-mouth use').setAttribute('href', `#${c.pics[+b.dataset.i]}`); });
}
async function openWord({ w, l }) {
  const sh = pull(await wordBack(l, w), 'al-word'); sh.querySelector('.pp > .md-tape').remove();
  const map = wordActs(l, w);
  sh.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && map[b.dataset.act]) map[b.dataset.act](b); });
}
function openCrib(s) {
  const sh = pull(cribHtml(s), 'hf-cribpull'); sh.querySelector('.md-tape').remove(); bindCrib(sh, s);
}

export function albumPage(app, state, ts, helpers) {
  const A = albumOf(state);
  let tab = 'gm';
  try { tab = localStorage.getItem(TAB_KEY) || 'gm'; } catch { /* 记不住就算了 */ }
  const li = (title, pg, { act = '', th = '', small = '' } = {}) => act
    ? `<button type="button" class="al-li got" ${act}><span class="t"><span class="h">${esc(title)}</span>${small ? `<small>${esc(small)}</small>` : ''}</span><span class="ld"></span>${pg !== '' ? `<span class="pg">${pg}</span>` : ''}${th}</button>`
    : `<div class="al-li no"><span class="t">${esc(title)}</span><span class="ld"></span><span class="pg">${pg}</span></div>`;
  const none = '<p class="md-cap al-none">还没有</p>';
  const bodies = {
    pr: () => `<h3>发音<small>已收 ${A.count.pr}</small></h3>
      <p class="al-uh">拼读小抄</p>${A.cribs.map((x, i) => li(x.s.title, '', x.got ? { act: `data-crib="${i}"`, th: `<span class="th">${mouth(x.s.rows.find(r => r.pic).pic)}</span>` } : {})).join('')}
      <p class="al-uh">各课发音点</p>${A.pron.map((x, i) => li(x.c.title, x.l.n, { act: `data-pr="${i}"`, th: x.c.pics ? `<span class="th">${mouth(x.c.pics[0])}</span>` : '' })).join('') || none}`,
    gm: () => `<h3>语法<small>已收 ${A.count.gm} / ${A.count.gmAll}</small></h3>
      ${A.units.map(u => u.lessons.some(x => x.got)
        ? `<p class="al-uh">${u.n} <i>${esc(u.name)}</i></p>${u.lessons.map(x => x.main
            ? li(x.main.c.title, x.n, { act: `data-g="${x.n}"` }) + x.extra.map((e, k) => li(e.c.title, x.n, { act: `data-ge="${x.n}:${k}"` })).join('')
            : li(x.plan || '综合运用', x.n)).join('')}${u.sum ? li('单元总表', '测', u.sumGot ? { act: `data-u="${u.n}"` } : {}) : ''}`
        : `<div class="al-ul"><b>${u.n}</b><div><span>${esc(u.name)}</span><em>${u.lessons.map(x => esc(x.plan)).filter(Boolean).join(' · ') || '综合运用'}</em></div></div>`).join('')}`,
    wd: () => { const wli = (x, i) => { const e = entry(x.w.de); return `<button type="button" class="al-li got wd" data-wd="${i}"><span class="t">${e.art ? `<em class="md-art ${e.art}">${e.art}</em> ` : ''}<span class="h">${esc(e.lemma)}</span></span><span class="ld"></span><span class="pg zh">${esc(x.w.zh)}</span></button>`; };
      const weak = A.words.map((x, i) => x.weak ? wli(x, i) : '').join('');
      const byLesson = [...new Set(A.words.map(x => x.l))].map(l => `<p class="al-uh">${l.n} <i>${esc(l.title)}</i></p>${A.words.map((x, i) => x.l === l ? wli(x, i) : '').join('')}`).join('');
      return `<h3>单词<small>已学 ${A.count.wd}</small></h3><p class="al-uh">不熟 <i>${A.count.weak}</i></p>${weak || none}${byLesson}`; },
    tp: () => `<h3>文化<small>已收 ${A.count.tp}</small></h3>${A.tips.map((x, i) => li(x.c.title, x.l.n, { act: `data-tp="${i}"`, small: x.c.body })).join('') || none}`,
  };
  const T = [['pr', '发音', A.count.pr], ['gm', '语法', `${A.count.gm}/${A.count.gmAll}`], ['tp', '文化', A.count.tp], ['wd', '单词', A.count.wd]];
  if (!T.some(([k]) => k === tab)) tab = 'gm';
  const draw = () => {
    app.innerHTML = `<div class="md-page hf-page tabbed al-page">${calendar(state, ts, helpers)}
      <div class="al-toc"><span class="md-tape"></span><div class="al-tabs">${T.map(([k, t, n]) => `<button type="button" class="${k === tab ? 'on' : ''}" data-t="${k}" aria-pressed="${k === tab}"><span>${t}</span><small>${n}</small></button>`).join('')}</div><div class="al-body">${bodies[tab]()}</div></div></div>`;
    hydrate(app);
  };
  // 换一类：只换纸上的内容（日历、底栏不动），新内容像翻过来一页那样滑进来
  const turn = () => {
    app.querySelectorAll('.al-tabs button').forEach(b => { const on = b.dataset.t === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const old = app.querySelector('.al-body'), body = old.cloneNode(false);
    body.innerHTML = bodies[tab](); old.replaceWith(body); hydrate(body);
  };
  draw();
  app.onclick = e => {
    const b = e.target.closest('[data-t],[data-g],[data-ge],[data-u],[data-pr],[data-tp],[data-crib],[data-wd]'); if (!b || !app.querySelector('.al-page')) return;
    const d = b.dataset, lessonOf = n => A.units.flatMap(u => u.lessons).find(x => x.n === +n);
    if (d.t) { if (d.t === tab) return; tab = d.t; try { localStorage.setItem(TAB_KEY, tab); } catch { /* 记不住就算了 */ } turn(); }
    else if (d.wd) openWord(A.words[+d.wd]);
    else if (d.g) openGrammar(lessonOf(d.g).main);
    else if (d.ge) { const [n, k] = d.ge.split(':'); openTip(lessonOf(n).extra[+k]); }
    else if (d.u) openUnit(A.units[+d.u - 1]);
    else if (d.pr) openPron(A.pron[+d.pr]);
    else if (d.tp) openTip(A.tips[+d.tp]);
    else if (d.crib) openCrib(A.cribs[+d.crib].s);
  };
}
