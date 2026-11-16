// 手帐页：桌上放着一本合上的手帐（和图标是同一本，A5 比例）。点右边的签翻开到那一类的目录——翻开后纸往下展开到屏幕底，好读；点一条就在本子里翻到那一页。
// 翻到具体一页时“凑近看”（2026-11-16）：签收起来，纸放宽到差不多整屏，「目录」挪到本子上方那一行，页面里只剩内容。
// 学习日历 2026-11-15 搬到「我的」页最上面（calendar 由 app.js 调用）。
// 内容全部来自课程数据，学到哪亮到哪。对照原型 lab/ds-explore/round28/t-cover.html。
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
export function calendar(state, ts, { numOf, findItem }) {
  const t0 = new Date(ts), mon = ts - ((t0.getDay() + 6) % 7) * DAY, todayK = dayKey(ts);
  const month = todayK.slice(0, 7), days = Object.keys(state.log).filter(k => k.startsWith(month)).length;
  const cells = [...Array(14)].map((_, i) => { const d = new Date(mon - 7 * DAY + i * DAY), k = dayKey(d.getTime()), log = state.log[k];
    const it = log?.map(e => e.type !== 'review' && findItem(e.id)).filter(Boolean).at(-1);
    const mark = it ? seal(it.kind === 'quiz' ? '测' : numOf(it), 'md-mini-seal').replace('<svg', `<svg style="--r:${[-8, 6, -4, 9, -6, 5, -9][i % 7]}deg"`) : log ? '<svg class="rv" viewBox="0 0 34 34"><use href="#cards"/></svg>' : '';
    return `<span class="d ${log ? 'on' : ''} ${k === todayK ? 'today' : ''}">${d.getDate()}${mark}</span>`; });
  return `<div class="al-h"><h2>${t0.getMonth() + 1} 月</h2><span>学了 <b>${days}</b> 天</span><a class="md-more" href="#/log"><u>全部</u>${ico('arrow')}</a></div>
    <div class="al-cal">${['一', '二', '三', '四', '五', '六', '日'].map(w => `<span class="w">${w}</span>`).join('')}${cells.join('')}</div>`;
}

const src = l => `<p class="src">第 ${l.n} 课 · ${esc(l.title)}</p>`;
const BACK = `<button type="button" class="bk-close bk" data-back>${ico('arrow')}目录</button>`;
const RULED = '<div class="rule"></div>';
const WS = c => c.words ? `<p class="ws">${c.words.map(w => `<span><small>${{ der: '阳性', die: '阴性', das: '中性' }[hlClass(w)] || ''}</small><button type="button" class="md-hl ${hlClass(w)}" data-say>${esc(w)}</button></span>`).join('')}</p>` : '';

/* 本子里的一页：每种内容怎么排。返回 { html, tables?, bind? } */
const LEAF = {
  grammar: ({ c, l }) => ({ tables: [c.table], html: `${src(l)}<h2>${esc(c.title)}</h2><p class="say">${esc(c.body)}</p>${buildTbl(c, new Set((c.drill || []).map(cellKey)), { full: true })}
    ${c.contrast ? `<div class="hf-contrast">${c.contrast.map(([a, b]) => `<div class="pr"><button type="button" class="md-paper" data-say>${esc(a)}</button><button type="button" class="md-paper" data-say>${esc(b)}</button></div>`).join('')}</div>` : ''}` }),
  unit: u => { const all = t => new Set(t.rows.flatMap((r, i) => r.slice(1).map((_, k) => `${i}:${k + 1}`)));
    return { tables: u.sum.tables, html: `<p class="src">第 ${u.n} 单元 · ${esc(u.name)}</p><h2>单元总表</h2><p class="say">${esc(u.sum.rule || '')}</p>${u.sum.tables.map(t => buildTbl({ table: t }, all(t), { full: true })).join('')}` }; },
  tip: ({ c, l }) => ({ html: `${src(l)}<h2>${esc(c.title)}</h2><p class="say">${esc(c.body)}</p>${WS(c)}${RULED}` }),
  pron: ({ c, l }) => ({ html: `${src(l)}<h2>${esc(c.title)}</h2><p class="say">${esc(c.body)}</p>${c.pics ? `<div class="md-mouth hf-mouth"><svg viewBox="0 0 240 180"><use href="#${c.pics[0]}"/></svg></div>` : ''}
      <div class="md-pair hf-pair">${(c.pairs || []).map((p, i) => `<button type="button" class="md-paper c" data-say="${esc(p)}" data-i="${i}"><p class="w">${esc(p)}</p>${key('a-spk', { cls: 's', aria: '听', r: -3 }).replace('<button', '<span').replace('</button>', '</span>')}</button>`).join('')}</div>`,
    bind: lf => lf.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b && c.pics?.[+b.dataset.i]) lf.querySelector('.hf-mouth use').setAttribute('href', `#${c.pics[+b.dataset.i]}`); }) }),
  crib: s => ({ html: cribHtml(s), cls: 'crib', bind: lf => bindCrib(lf, s) }),
  word: async ({ w, l }) => ({ html: await wordBack(l, w), cls: 'wd', bind: lf => { const map = wordActs(l, w); lf.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && map[b.dataset.act]) map[b.dataset.act](b); }); } }),
};

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
    wd: () => { const wli = (x, i) => { const e = entry(x.w.de); return `<button type="button" class="al-li got wd" data-wd="${i}"><span class="t">${e.art ? `<em class="md-art ${e.art}">${e.art}</em> ` : ''}<span class="h ${e.art || ''}">${esc(e.lemma)}</span></span><span class="ld"></span><span class="pg zh">${esc(x.w.zh)}</span></button>`; };
      const weak = A.words.map((x, i) => x.weak ? wli(x, i) : '').join('');
      const byLesson = [...new Set(A.words.map(x => x.l))].map(l => `<p class="al-uh">${l.n} <i>${esc(l.title)}</i></p>${A.words.map((x, i) => x.l === l ? wli(x, i) : '').join('')}`).join('');
      return `<h3>单词<small>已学 ${A.count.wd}</small></h3><p class="al-uh">不熟 <i>${A.count.weak}</i></p>${weak || none}${byLesson}`; },
    tp: () => `<h3>文化<small>已收 ${A.count.tp}</small></h3>${A.tips.map((x, i) => li(x.c.title, x.l.n, { act: `data-tp="${i}"`, small: x.c.body })).join('') || none}`,
  };
  const T = [['pr', '发音', A.count.pr], ['gm', '语法', `${A.count.gm}/${A.count.gmAll}`], ['tp', '文化', A.count.tp], ['wd', '单词', A.count.wd]];
  if (!T.some(([k]) => k === tab)) tab = 'gm';
  const CLOSE = '<button type="button" class="bk-close" data-close><svg viewBox="0 0 28 28"><use href="#t-heft"/></svg>合上</button>';

  // 进来先看到合上的本子；纸、签、封面都叠在同一个矩形里，翻开只动封面（transform / opacity）
  app.innerHTML = `<div class="md-page hf-page tabbed al-page">
    <div class="al-desk"><div class="bk-top"></div>
    <div class="bkwrap"><div class="al-book closed">
      <div class="edge e1"></div>
      <svg class="ribbon" viewBox="0 0 22 46"><path d="M2 2h18v42l-9-8-9 8Z" fill="#ef907d"/><path d="M2 2h18v42l-9-8-9 8Z" fill="none" stroke="#24272c" stroke-width="1.8" stroke-linejoin="round" filter="url(#rough-s)"/></svg>
      <div class="al-pg"></div>
      <div class="pgline"></div><div class="shade"></div>
      <div class="al-tabs">${T.map(([k, t, n]) => `<button type="button" data-t="${k}" aria-label="${t}"><span>${t}</span><small>${n}</small></button>`).join('')}</div>
      <button type="button" class="al-cover" data-cover aria-label="翻开手帐"><span class="spine"></span><span class="dots"></span><span class="sl"></span>
        <span class="lab"><b>我的手帐</b><small>Notizen</small></span></button>
    </div></div></div></div>`;
  hydrate(app);
  const desk = app.querySelector('.al-desk'), book = app.querySelector('.al-book'), pg = app.querySelector('.al-pg'), top = app.querySelector('.bk-top'), cover = app.querySelector('.al-cover');
  const order = T.map(x => x[0]), pageHtml = k => `<span class="md-tape"></span><div class="al-body">${bodies[k]()}</div>`;
  const fill = (el, k) => { el.innerHTML = pageHtml(k); el.scrollTop = 0; hydrate(el); };
  // 从具体一页退回目录：纸收回原来的宽度，签回来
  const unread = () => { book.querySelector('.al-leaf')?.remove(); if (desk.classList.contains('read')) { desk.classList.remove('read'); top.innerHTML = CLOSE; } };
  // 换一类。flip：像翻书——往后翻是这一页朝左翻走、露出下一页；往前翻是前一页从左边翻回来盖上
  const setTab = (k, flip = false) => {
    const fwd = order.indexOf(k) > order.indexOf(tab);
    tab = k; try { localStorage.setItem(TAB_KEY, tab); } catch { /* 记不住就算了 */ }
    unread(); book.querySelectorAll('.al-flip').forEach(x => x.remove()); stop();
    book.querySelectorAll('.al-tabs button').forEach(b => { const on = b.dataset.t === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    if (!flip) return fill(pg, k);
    const sheet = pg.cloneNode(true), at = pg.scrollTop, line = book.querySelector('.pgline');
    sheet.classList.add('al-flip', fwd ? 'fwd' : 'bwd'); sheet.setAttribute('aria-hidden', 'true');
    let done = false;
    const end = () => { if (done) return; done = true; if (!fwd && tab === k) fill(pg, k); sheet.remove(); };
    if (fwd) { book.insertBefore(sheet, line); sheet.scrollTop = at; fill(pg, k); } else { book.insertBefore(sheet, line); fill(sheet, k); }
    sheet.addEventListener('animationend', end, { once: true }); setTimeout(end, 700);
  };
  const settle = (from, to) => cover.addEventListener('animationend', () => book.classList.replace(from, to), { once: true });
  // 翻开时本子往上挪到「合上」那一行下面，纸往下展开到底栏上方：量一下上下各有多少空
  const room = () => { const d = desk.getBoundingClientRect(), b = book.getBoundingClientRect(), t = top.getBoundingClientRect();
    const up = Math.max(0, t.top - d.top - 4), down = Math.max(0, d.bottom - 14 - b.bottom);
    desk.style.setProperty('--up', `${up}px`); desk.style.setProperty('--ext', `${up + down}px`); book.style.height = `${b.height}px`; };
  const open = k => { if (book.classList.contains('closed')) room(); setTab(k); book.classList.remove('closed', 'closing'); book.classList.add('opening'); desk.classList.add('up'); top.innerHTML = CLOSE; settle('opening', 'open'); };
  const close = () => {
    unread(); stop();
    book.classList.remove('open', 'opening'); book.classList.add('closing'); desk.classList.remove('up'); top.innerHTML = ''; book.style.height = '';
    book.querySelectorAll('.al-tabs button').forEach(b => { b.classList.remove('on'); b.removeAttribute('aria-pressed'); });
    settle('closing', 'closed');
  };
  // 在本子里翻到那一页：盖在目录上面，本子上方的「目录」翻回去
  let turning = 0;
  const turnTo = async (kind, item) => {
    const mine = ++turning, leaf = await LEAF[kind](item);
    if (mine !== turning) return;
    book.querySelector('.al-leaf')?.remove();
    const lf = Object.assign(document.createElement('div'), { className: `al-leaf in ${leaf.cls || ''}`, innerHTML: leaf.html });
    book.insertBefore(lf, book.querySelector('.pgline')); hydrate(lf);
    desk.classList.add('read'); top.innerHTML = BACK; hydrate(top);
    lf.addEventListener('click', async e => {
      const say = e.target.closest('[data-say]'); if (say) return playWord(say.dataset.say || say.textContent);
      const r = e.target.closest('[data-act=row]'); if (!r || !leaf.tables) return;
      const t = leaf.tables[[...lf.querySelectorAll('.hf-btbl')].indexOf(r.closest('.hf-btbl'))], row = t.rows[+r.dataset.row], run = ++turning;
      for (let k = 1; k < row.length; k++) if (run !== turning || !await playWord(rowSay(row, k))) return;
    });
    leaf.bind?.(lf);
  };
  app.onclick = e => {
    const b = e.target.closest('[data-t],[data-cover],[data-close],[data-back],[data-g],[data-ge],[data-u],[data-pr],[data-tp],[data-crib],[data-wd]');
    if (!b || !app.querySelector('.al-page')) return;
    const d = b.dataset, lessonOf = n => A.units.flatMap(u => u.lessons).find(x => x.n === +n);
    if (d.t) { if (!book.classList.contains('open') && !book.classList.contains('opening')) open(d.t); else if (d.t !== tab) setTab(d.t, true); else if (book.querySelector('.al-leaf')) setTab(d.t); }
    else if ('cover' in d) open(tab);
    else if ('close' in d) close();
    else if ('back' in d) { turning++; stop(); unread(); }
    else if (d.g) turnTo('grammar', lessonOf(d.g).main);
    else if (d.ge) { const [n, k] = d.ge.split(':'); turnTo('tip', lessonOf(n).extra[+k]); }
    else if (d.u) turnTo('unit', A.units[+d.u - 1]);
    else if (d.pr) turnTo('pron', A.pron[+d.pr]);
    else if (d.tp) turnTo('tip', A.tips[+d.tp]);
    else if (d.crib) turnTo('crib', A.cribs[+d.crib].s);
    else if (d.wd) turnTo('word', A.words[+d.wd]);
  };
}
