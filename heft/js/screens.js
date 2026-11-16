// 每一种步骤怎么画。样式和结构照设计系统（css/ds.css 的 md-* 组件）和 lab/ds-explore 里对应的原型。
// 约定：render(ctx)。ctx = { lesson, step, body, foot(label, fn, opts), next(), result(ok) }。
// 界面上只写“要做什么”，不写教学法说明、安慰或提示性废话。
import { STORY_CAST, STORY_LESSONS, rowSay, drillSay } from '../../data/story-lessons.js';
import { avatar, key, q, tick, seal, hydrate, NAME, picOf, ico } from './art.js';
import { play, playLine, playWord, playUrl, stop, duration, sayOf, sfx, position } from './audio.js';
import { canRecord, record, score, whyFailed } from './speech.js';
import { correct, pieces, entry, sameText, clozeAt } from './flow.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const tilt = i => [-1.2, 1, -0.6, 1.4, -1, 0.7][i % 6];
export const hlClass = de => entry(de).art || 'word';
export const lower = s => s.toLocaleLowerCase('de-DE');
/** 系统开了「减少动态效果」：脚本里的位移动画也跳过。 */
export const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 在一句话里把某个词用荧光笔标出来（找不到就原样返回）。 */
export function mark(de, needle, cls) {
  const n = needle.replace(/[?!.…]+$/, ''), at = lower(de).indexOf(lower(n));
  if (at < 0) return esc(de);
  return `${esc(de.slice(0, at))}<span class="md-hl ${cls}">${esc(de.slice(at, at + n.length))}</span>${esc(de.slice(at + n.length))}`;
}
/** 一行台词：头像 + 名字 + 句子（+ 中文）（+ 喇叭）。 */
export function row(line, { html, zh = true, spk = true, cls = '', big = false, name = true } = {}) {
  return `<div class="md-ln ${spk ? 'say' : ''} ${cls}">${avatar(line.who)}<div>${name ? `<span class="md-name">${NAME[line.who]}</span>` : ''}
    <p class="${big ? 'md-de' : 'md-ctx'}">${q(html ?? esc(line.de))}</p>${zh ? `<p class="md-zh">${esc(line.zh)}</p>` : ''}</div>
    ${spk ? key('a-spk', { cls: 's', act: 'say', aria: '听这一句', r: -4 }) : ''}</div>`;
}
/** 词条（大 / 小号）：冠词 + 词（荧光笔）→ 中文。 */
export function wordEntry(de, zh, size = 's') {
  const e = entry(de);
  return `<div class="md-entry ${size}"><p class="md-lm">${e.art ? `<em class="md-art ${e.art}">${e.art}</em> ` : ''}<span class="md-hl ${e.art || 'word'}">${esc(e.lemma)}</span>${key('a-spk', { cls: 's', act: 'word', aria: '听这个词', r: 5 })}</p><p class="md-mn">${esc(zh)}</p></div>`;
}
/** 大词条一行放不下（如 kommen aus …）就收小字号保持一行：折成两行时荧光笔只会画在第二行。 */
export function fitEntry(root) {
  root.querySelectorAll('.md-entry.l .md-lm').forEach(lm => {
    const hl = lm.querySelector('.md-hl'); let size = 40;
    while (hl && hl.offsetHeight > (size + 10) * 1.4 && size > 24) { size -= 2; lm.style.fontSize = `${size}px`; lm.style.lineHeight = `${size + 10}px`; }
  });
}
/** 点 data-act 的统一入口。 */
export function acts(body, map) {
  body.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && map[b.dataset.act]) { e.preventDefault(); map[b.dataset.act](b); } });
}

export const RENDER = {};

/* ---------- 预习：认人物 ---------- */
RENDER.who = ({ lesson, step, body, foot, next }) => {
  const c = STORY_CAST[step.who], parts = c.zh.split(' · ')[1].split('，'), d2 = parts.pop();
  const all = [...(lesson.cast || []), lesson.role];
  body.innerHTML = `<div class="md-who hf-who">${avatar(step.who)}<h2>${step.who === lesson.role ? `你 · ${step.who}` : NAME[step.who]}</h2>
    <p class="d">${esc(parts.join(' · '))}</p><p class="d2">${esc(d2)}</p>
    <div class="md-hi">${key('a-spk', { act: 'hi', aria: '听他的声音', r: -4 })}<p class="md-ctx">${q(esc(c.hi))}</p></div></div>
    <div class="md-cast hf-castdots">${all.map(w => avatar(w, w === step.who ? 'on' : '')).join('')}</div>`;
  const hi = () => play(step.who, c.hi);
  acts(body, { hi });
  foot('继续', next, { arrow: true });
  hi();
};

/* ---------- 预习：先认识这个词 ---------- */
RENDER.word = ({ lesson, step, body, foot, next }) => {
  const { item } = step, line = lesson.lines[item.line], pic = picOf(item.pic);
  body.innerHTML = `<p class="hf-task">先认识这个词</p>
    <div class="hf-wd ${pic ? '' : 'noimg'}">${pic ? `<div class="hf-pic">${pic}</div>` : ''}${wordEntry(item.de, item.zh, 'l')}</div>
    <div class="hf-ex">${row(line, { html: mark(line.de, entry(item.de).lemma, hlClass(item.de)) })}</div>`;
  fitEntry(body);
  acts(body, { word: () => playWord(item.de), say: () => playLine(line) });
  foot('继续', next, { arrow: true });
  playWord(item.de);
};

/* ---------- 带着一个问题听全文 ---------- */
export const TL_COLOR = { Lena: 'var(--illus-ochre)', Tom: 'var(--illus-sky)', Lin: 'var(--char-lin)', Krause: '#b9c7a4' };
export const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
RENDER.listen = ctx => listenUI(ctx, { lesson: ctx.lesson, head: `<p class="hf-task">不看字幕，把这篇课文再听一遍</p><p class="hf-pre">听完回答：</p><p class="hf-qq">${esc(ctx.lesson.listenQuestion.prompt)}</p>` });
/** 听一整段对话：只看谁在说，不给原文。lesson 只用到 lines 和 preview（预习词听到时闪一下）。 */
export async function listenUI({ body, foot, next, flags }, { lesson, head }) {
  const speakers = [...new Set(lesson.lines.map(l => l.who))];
  const durs = await Promise.all(lesson.lines.map(l => duration(l.who, sayOf(l))));
  const total = durs.reduce((a, b) => a + b, 0);
  body.innerHTML = `${head}
    <div class="hf-cast">${speakers.map(w => `<div class="c" data-who="${w}">${avatar(w)}<span>${NAME[w]}</span><b style="background:${TL_COLOR[w]}"></b></div>`).join('')}</div>
    <p class="hf-flash" aria-live="polite"></p>
    <div class="hf-tl"><div class="bar">${lesson.lines.map((l, i) => `<i style="flex:${durs[i]};background:${TL_COLOR[l.who]}"></i>`).join('')}<u></u></div>
      <div class="t"><span class="now">0:00</span><span>${mmss(total)}</span></div></div>
    <div class="hf-ctl">${key('a-slow', { label: '慢速', act: 'slow', r: 4 })}${key('a-spk', { label: '播放', act: 'toggle', r: -5 })}</div>`;
  const cast = [...body.querySelectorAll('.hf-cast .c')], bar = body.querySelector('.hf-tl u'), nowEl = body.querySelector('.now'), flash = body.querySelector('.hf-flash');
  const toggle = body.querySelector('[data-act=toggle]');
  let playing = false, slow = false, run = 0;
  const setToggle = on => { toggle.dataset.k = on ? 'a-pause' : 'a-spk'; toggle.innerHTML = on ? '暂停' : '播放'; hydrate(toggle.parentNode); };
  // 游标跟着声音匀速走：每一帧按「前面几句的总长 + 这一句放到第几秒」算位置
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0));
  const at = t => { bar.style.width = `${Math.min(100, t / total * 100)}%`; nowEl.textContent = mmss(t); };
  let cur = -1;
  const tick = () => { if (!body.isConnected) return; if (cur >= 0) at(starts[cur] + Math.min(durs[cur], position())); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const paint = (i) => {
    cast.forEach(c => c.classList.toggle('on', i >= 0 && c.dataset.who === lesson.lines[i]?.who));
    cur = i;
    const pv = i >= 0 && (lesson.preview || []).find(p => p.line === i);
    flash.innerHTML = pv ? `<span class="md-hl ${hlClass(pv.de)}">${esc(pv.de)}</span>` : '';
  };
  async function start(from = 0) {
    const mine = ++run; playing = true; setToggle(true);
    for (let i = from; i < lesson.lines.length; i++) {
      paint(i);
      const ok = await playLine(lesson.lines[i], { slow });
      if (mine !== run) return;
      if (!ok) { playing = false; setToggle(false); return; }
    }
    playing = false; setToggle(false); paint(-1); at(total);
    flags.heard = true; foot('回答问题', next);
  }
  acts(body, {
    toggle: () => { if (playing) { run++; playing = false; stop(); setToggle(false); cur = -1; at(0); } else start(0); },
    slow: b => { slow = !slow; b.classList.toggle('on', slow); if (playing) { run++; stop(); start(0); } },
  });
  foot('回答问题', next, { off: !flags.heard });
}

/* ---------- 选择题（听后答题、练习、听音选） ---------- */
export function choiceUI({ body, foot, next, result }, { ex, head, after = '', replay }) {
  const opts = shuffle(ex.options.map((t, i) => ({ t, right: i === ex.answer })));
  const gap = ex.prompt.includes('___');
  body.innerHTML = `${head}<div class="hf-chs ${gap ? 'short' : ''}">${opts.map((o, i) => `<button type="button" class="md-paper md-opt ${gap ? '' : 'wide'}" style="--r:${tilt(i)}deg" data-act="pick" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>
    <p class="hf-hint" hidden></p>${after}`;
  const btns = [...body.querySelectorAll('.md-opt')];
  let sel = -1, done = false;
  const check = () => {
    done = true;
    const ok = opts[sel].right;
    btns.forEach((b, i) => { b.classList.remove('sel'); if (opts[i].right) b.classList.add(ok ? 'ok' : 'tick'); else if (i === sel) b.classList.add('no'); b.disabled = true; });
    const g = body.querySelector('.md-gap'); if (g) { g.textContent = ex.options[ex.answer]; g.classList.add('filled'); }
    if (!ok && ex.hint) { const h = body.querySelector('.hf-hint'); h.textContent = ex.hint; h.hidden = false; }
    sfx(ok ? 'ok' : 'no'); result?.(ok);
    foot('继续', next, { arrow: true });
  };
  acts(body, {
    pick: b => { if (done) return; sel = +b.dataset.i; btns.forEach(x => x.classList.toggle('sel', x === b)); sfx('tap'); foot('检查', check); },
    replay: () => replay?.(),
  });
  foot('检查', check, { off: true });
}
const promptHtml = p => p.includes('___') ? `<p class="hf-fill">${esc(p).replace('___', '<span class="md-gap"></span>')}</p>` : `<p class="hf-qq">${esc(p)}</p>`;

RENDER.listenQ = ctx => {
  const { lesson } = ctx, q = ctx.step.q || lesson.listenQuestion;
  const all = async () => { for (const l of lesson.lines) if (!await playLine(l)) return; };
  choiceUI(ctx, {
    ex: q, replay: all,
    head: `<p class="hf-task">听完回答：</p><p class="hf-qq">${esc(q.prompt)}</p>`,
    after: `<p class="hf-again">${key('a-spk', { cls: 's', act: 'replay', label: '再听一遍', r: -4 })}</p>`,
  });
};

/* ---------- 精读：一句一屏 ---------- */
RENDER.line = ({ lesson, step, body, foot, next }) => {
  const i = step.i, line = lesson.lines[i], words = lesson.words.filter(w => w.line === i);
  const formOf = t => words.find(w => lower(w.form).split(/\s+/).includes(lower(t)) || lower(w.form) === lower(t));
  const de = pieces(line.de).map(p => {
    if (!p.word) return esc(p.t);
    const w = formOf(p.t);
    return `<span class="hf-w ${w ? `md-hl ${hlClass(w.de)}` : ''}" data-act="gloss" data-w="${esc(lower(p.t))}">${esc(p.t)}</span>`;
  }).join('');
  const first = words[0];
  body.innerHTML = `<p class="hf-task">看懂这一句</p>
    <div class="hf-ctx">${lesson.lines.slice(Math.max(0, i - 2), i).map(l => row(l, { zh: false, spk: false, cls: 'prev' })).join('')}</div>
    <div class="md-cur"${first && entry(first.de).art ? ` data-link="${entry(first.de).art}"` : ' data-link="pencil"'}>
      ${row(line, { html: de, big: true })}
      ${words.map(w => wordEntry(w.de, w.zh)).join('')}
      <p class="hf-pop" hidden></p>
    </div>`;
  const pop = body.querySelector('.hf-pop');
  acts(body, {
    say: () => playLine(line),
    word: b => { const all = [...body.querySelectorAll('.md-entry [data-act=word]')]; playWord(words[all.indexOf(b)].de); },
    gloss: b => {
      const g = lesson.gloss[b.dataset.w]; if (!g) return;
      body.querySelectorAll('.hf-w.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
      pop.innerHTML = `<b>${esc(b.textContent)}</b> ${esc(g)}`; pop.hidden = false;
    },
  });
  foot('继续', next, { arrow: true });
  playLine(line);
};

/* ---------- 语法点 / 发音点 / 小贴士 ---------- */
function tableHtml(table, on) {
  return `<div class="md-tbl hf-tbl" style="--cols:${table.head.length - 1}">${table.rows.map((r, i) => {
    const lit = on.includes(i);
    return `<div class="r ${lit ? '' : 'off'}"><span class="p">${lit ? `<span class="md-sj">${esc(r[0])}</span>` : esc(r[0])}</span>${r.slice(1).map(v => `<span>${lit ? `<span class="md-hl word">${esc(v)}</span>` : esc(v)}</span>`).join('')}${lit ? key('a-spk', { cls: 's', act: 'row', aria: '听', r: 4 }) : '<span></span>'}</div>`;
  }).join('')}</div>`;
}
/* 语法卡「先做后讲」：课文原句 → 原句挖空选一个（答一道，表里亮一格）→ 整张表 → 规则一句 +「看整张表」。
   每一屏是一个步骤（step.part = src | q | full | rule），亮了哪几格由“做到第几道”算出来，不存状态。 */
export const cellKey = d => `${d.row}:${d.col || 1}`;
export function buildTbl(c, lit, { full = false, flash = -1, grow = false } = {}) {
  const t = c.table, cols = t.head.length - 1;
  return `<div class="md-tbl build hf-tbl hf-btbl" style="--cols:${cols}"><div class="r hd"><span></span>${t.head.slice(1).map(h => `<span>${esc(h)}</span>`).join('')}<span></span></div>${t.rows.map((r, i) => {
    const on = r.slice(1).map((_, k) => lit.has(`${i}:${k + 1}`));
    return `<div class="r ${on.some(Boolean) ? 'lit' : 'off'} ${i === flash ? 'flash' : ''} ${grow && !on.some(Boolean) ? 'grow' : ''}"><span class="p">${esc(t.labels?.[i] ?? r[0])}</span>${r.slice(1).map((v, k) => `<span class="v">${on[k] ? `<span class="md-hl ${t.labels ? hlClass(v) : 'word'}">${esc(v)}</span>` : full ? esc(v) : ''}</span>`).join('')}${key('a-spk', { cls: 's', act: 'row', aria: '听这一行', r: i % 2 ? 3 : -4 }).replace('data-act="row"', `data-act="row" data-row="${i}"`)}</div>`;
  }).join('')}</div>`;
}
function drillCard({ lesson, step, body, foot, next }) {
  const c = step.card, ds = c.drill, t = c.table;
  const litUpTo = n => new Set(ds.slice(0, n).map(cellKey));
  let run = 0;
  // 一行怎么念：亮着的那几格；整张表时每一列都念
  const sayRow = async (i, lit, full) => { const mine = ++run; for (let k = 1; k < t.head.length; k++) if (full || lit.has(`${i}:${k}`)) { if (mine !== run || !await playWord(rowSay(t.rows[i], k))) return; } };
  const sayAll = async () => { const mine = ++run; for (let k = 1; k < t.head.length; k++) for (const r of t.rows) { if (mine !== run || !await playWord(rowSay(r, k))) return; } };

  if (step.part === 'src') {
    const lines = c.all ? lesson.lines.map((_, i) => i) : [...new Set(ds.map(d => d.line))];
    // 只在小题用到的那半句里标：动词刷荧光笔，主语用铅笔圈
    const marked = i => { const de = lesson.lines[i].de, mine = ds.filter(d => d.line === i).map(d => ({ d, from: de.indexOf(d.de), seen: new Set() })); let at = 0;
      return pieces(de).map(p => { const pos = at; at += p.t.length;
        const m = mine.find(x => pos >= x.from && pos < x.from + x.d.de.length && (x.d.v === p.t || x.d.sj === p.t) && !x.seen.has(p.t)); if (!m) return esc(p.t);
        m.seen.add(p.t); return p.t === m.d.v ? `<span class="md-hl word">${esc(p.t)}</span>` : `<span class="md-sj">${esc(p.t)}</span>`; }).join(''); };
    body.innerHTML = `<p class="hf-task">听这${['', '', '两', '三', '四'][lines.length] || '几'}句，看标出来的词</p>
      <div class="hf-gsrc">${lines.map(i => `<div data-i="${i}">${row(lesson.lines[i], { html: marked(i) })}</div>`).join('')}</div>`;
    acts(body, { say: b => playLine(lesson.lines[+b.closest('[data-i]').dataset.i]) });
    foot('继续', next, { arrow: true });
    playLine(lesson.lines[lines[0]]);
    return;
  }
  if (step.part === 'q') {
    const d = ds[step.n], l = lesson.lines[d.line], at = d.de.indexOf(d.v), lit = litUpTo(step.n);
    const opts = shuffle([{ t: d.v, right: true }, ...[].concat(d.no).map(t => ({ t }))]); // no 可以是一个，也可以是两个（der / die / das 三选一）
    body.innerHTML = `<p class="hf-task">选一个填进去</p>
      <div class="hf-gq"><div class="md-ln">${avatar(l.who)}<div><span class="md-name">${NAME[l.who]}</span>
        <p class="gf">${q(`${esc(d.de.slice(0, at))}<span class="md-gap"></span>${esc(d.de.slice(at + d.v.length))}`)}</p><p class="md-zh">${esc(d.zh || l.zh)}</p></div></div></div>
      <div class="hf-chs short">${opts.map((o, i) => `<button type="button" class="md-paper md-opt" style="--r:${i ? 1.2 : -1}deg" data-act="pick" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>
      <p class="hf-hint" hidden>${d.hint ? esc(d.hint) : `主语是 ${esc(drillSay(d).split(' ')[0])}，动词用 ${esc(lower(d.v))}`}</p>
      <div class="hf-gslot">${buildTbl(c, lit)}</div>`;
    const btns = [...body.querySelectorAll('.md-opt')];
    let sel = -1, done = false;
    const check = () => {
      done = true;
      const ok = !!opts[sel].right;
      btns.forEach((b, i) => { b.classList.remove('sel'); b.disabled = true; if (opts[i].right) b.classList.add(ok ? 'ok' : 'tick'); else if (i === sel) b.classList.add('no'); });
      const g = body.querySelector('.md-gap'); g.textContent = d.v; g.classList.add('filled');
      if (!ok) body.querySelector('.hf-hint').hidden = false;
      sfx(ok ? 'ok' : 'no');
      lit.add(cellKey(d));
      const slot = body.querySelector('.hf-gslot'); slot.innerHTML = buildTbl(c, lit, { flash: d.row }); hydrate(slot);
      foot('继续', next, { arrow: true });
    };
    acts(body, {
      pick: b => { if (done) return; sel = +b.dataset.i; btns.forEach(x => x.classList.toggle('sel', x === b)); sfx('tap'); foot('检查', check); },
      row: b => sayRow(+b.dataset.row, lit),
    });
    foot('检查', check, { off: true });
    return;
  }
  const lit = litUpTo(ds.length);
  if (step.part === 'full') {
    body.innerHTML = `<div class="hf-ph"><p class="hf-task">听一遍整张表</p>${key('a-spk', { label: '播放', act: 'all', r: -4 })}</div>${buildTbl(c, lit, { full: true, grow: true })}`;
    acts(body, { all: sayAll, row: b => sayRow(+b.dataset.row, lit, true) });
    foot('继续', next, { arrow: true });
    return;
  }
  // 规则：本课这几组大字 + 一句规则；想细看再拉出整张表
  const three = [...new Map(ds.map(d => [drillSay(d), d])).values()];
  body.innerHTML = `<div class="hf-grule"><div class="md-three hf-three">${three.map((d, i) => `<p>${d.say ? `<span class="md-hl ${hlClass(d.say)}">${esc(lower(d.v))}</span> ${esc(d.sj)}` : `${esc(drillSay(d).split(' ')[0])} <span class="md-hl word">${esc(lower(d.v))}</span>`}${key('a-spk', { cls: 's', act: 'three', aria: '听', r: i % 2 ? 3 : -4 }).replace('data-act="three"', `data-act="three" data-n="${i}"`)}</p>`).join('')}</div>
    <p class="hf-gsay">${esc(c.body)}</p>
    ${c.contrast ? `<div class="hf-contrast">${c.contrast.map(([a, b]) => `<div class="pr"><button type="button" class="md-paper" data-act="con">${esc(a)}</button><button type="button" class="md-paper" data-act="con">${esc(b)}</button></div>`).join('')}</div>` : ''}
    <button type="button" class="md-more" data-act="more"><u>看整张表</u>${ico('arrow')}</button></div>`;
  acts(body, {
    three: b => playWord(drillSay(three[+b.dataset.n])),
    con: b => playWord(b.textContent),
    more: () => {
      document.body.insertAdjacentHTML('beforeend', `<div class="md-pull"><div class="pp"><span class="md-tape"></span><button type="button" class="x" aria-label="关上" data-i="x"></button><h2>${t.head.slice(1).map(esc).join(' · ')}</h2>${buildTbl(c, lit, { full: true })}</div></div>`);
      const sh = document.body.lastElementChild; hydrate(sh);
      sh.addEventListener('click', e => { const r = e.target.closest('[data-act=row]'); if (r) return sayRow(+r.dataset.row, lit, true); if (e.target === sh || e.target.closest('.x')) sh.remove(); });
    },
  });
  foot('继续', () => { document.querySelector('.md-pull')?.remove(); next(); }, { arrow: true });
}
RENDER.card = (ctx) => {
  if (ctx.step.part) return drillCard(ctx);
  const { lesson, step, body, foot, next } = ctx;
  const c = step.card, src = lesson.lines[c.after];
  const exLine = c.example ? { who: 'Lena', de: c.example, zh: '' } : null;
  let html = '';
  if (c.kind === 'tip') {
    html = `<div class="md-note hf-note"><span class="md-tape"></span><p>${esc(c.title)}</p><p class="b">${esc(c.body)}</p>${c.words ? `<p class="ws">${c.words.map(w => `<span><small>${{ der: '阳性', die: '阴性', das: '中性' }[hlClass(w)] || ''}</small><button type="button" class="md-hl ${hlClass(w)}" data-act="tw">${esc(w)}</button></span>`).join('')}</p>` : ''}</div>`;
  } else if (c.kind === 'grammar') {
    html = `<h2 class="hf-gname">${esc(c.title)}</h2><p class="md-rule">${esc(c.body)}</p>
      <div class="hf-src">${row(src, {})}</div>${tableHtml(c.table, c.on)}
      ${c.contrast ? `<div class="hf-contrast">${c.contrast.map(([a, b]) => `<div class="pr"><button type="button" class="md-paper" data-act="con">${esc(a)}</button><button type="button" class="md-paper" data-act="con">${esc(b)}</button></div>`).join('')}</div>` : ''}`;
  } else {
    html = `<h2 class="hf-gname">${esc(c.title)}</h2><p class="md-rule">${esc(c.body)}</p>
      ${c.pics ? `<div class="md-mouth hf-mouth"><svg viewBox="0 0 240 180"><use href="#${c.pics[0]}"/></svg></div>` : ''}
      <div class="md-pair hf-pair">${c.pairs.map(p => `<button type="button" class="md-paper c" data-act="pair"><p class="w">${esc(p)}</p>${key('a-spk', { cls: 's', aria: '听', r: -3 }).replace('<button', '<span').replace('</button>', '</span>')}</button>`).join('')}</div>
      <div class="hf-src">${exLine ? `<div class="md-ln say"><span></span><div><p class="md-ctx">${q(esc(c.example))}</p></div>${key('a-spk', { cls: 's', act: 'ex', aria: '听', r: -4 })}</div>` : ''}</div>`;
  }
  body.innerHTML = html;
  const lit = c.table ? c.on.map(i => c.table.rows[i]) : [];
  acts(body, {
    say: () => playLine(src),
    ex: () => playWord(c.example),
    row: b => { const r = lit[[...body.querySelectorAll('[data-act=row]')].indexOf(b)]; playWord(rowSay(r)); },
    pair: b => { const i = [...body.querySelectorAll('[data-act=pair]')].indexOf(b); if (c.pics?.[i]) body.querySelector('.hf-mouth use').setAttribute('href', `#${c.pics[i]}`); playWord(c.pairs[i]); },
    con: b => playWord(b.textContent),
    tw: b => playWord(b.textContent),
  });
  foot('继续', next, { arrow: true });
};

/* ---------- 词包：成套的词一屏给全 ---------- */
RENDER.pack = ({ lesson, body, foot, next }) => {
  const p = lesson.wordPack;
  body.innerHTML = `<p class="hf-task">${esc(p.title)}</p>
    <div class="md-pack hf-pack">${p.items.map((it, i) => `<button type="button" class="r ${it.de.length > 11 ? 'wide' : ''}" data-act="it" data-i="${i}"><span class="n">${esc(it.n)}</span><span class="w">${p.inText.includes(it.de) ? `<span class="md-hl word">${esc(it.de)}</span>` : esc(it.de)}</span></button>`).join('')}</div>
    <div class="hf-ctl">${key('a-spk', { label: '播放', act: 'all', r: -5 })}</div>`;
  let run = 0;
  acts(body, {
    it: b => { run++; playWord(p.items[+b.dataset.i].de); },
    all: async () => { const mine = ++run; for (const it of p.items) { if (mine !== run || !await playWord(it.de)) return; } },
  });
  foot('继续', next, { arrow: true });
};

/* ---------- 练习 ---------- */
RENDER.ex = ctx => (EX[ctx.step.ex.type] || EX.choice)(ctx);
export const EX = {};
EX.choice = ctx => choiceUI(ctx, { ex: ctx.step.ex, head: `<p class="hf-task">${ctx.step.ex.prompt.includes('___') ? '空里填什么？' : '选一个'}</p>${promptHtml(ctx.step.ex.prompt)}` });
EX.listenChoice = ctx => {
  const { ex } = ctx.step, say = slow => play(ex.voice, ex.say || ex.audioText, { slow });
  choiceUI(ctx, { ex, replay: () => say(false), head: `<p class="hf-task">${esc(ex.prompt)}</p><div class="hf-ctl top">${key('a-spk', { label: '播放', act: 'replay', r: -5 })}${key('a-slow', { label: '慢速', act: 'slowplay', r: 4 })}</div>` });
  ctx.body.addEventListener('click', e => { if (e.target.closest('[data-act=slowplay]')) say(true); });
  say(false);
};

EX.match = ({ step, body, foot, next, result }) => {
  const pairs = step.ex.pairs, left = shuffle(pairs.map((p, i) => ({ i, t: p.de }))), right = shuffle(pairs.map((p, i) => ({ i, t: p.zh })));
  const cell = (side, o, k) => `<button type="button" class="md-paper hf-mc" data-act="m" data-side="${side}" data-i="${o.i}" style="--r:${tilt(k + (side === 'r' ? 3 : 0))}deg">${side === 'l' && entry(o.t).art ? `<em class="md-art ${entry(o.t).art}">${entry(o.t).art}</em> ${esc(entry(o.t).lemma)}` : esc(o.t)}</button>`;
  body.innerHTML = `<p class="hf-task">把意思连起来</p><div class="hf-mt">${left.map((o, k) => cell('l', o, k) + cell('r', right[k], k)).join('')}<svg class="hf-lines"></svg></div>`;
  const svg = body.querySelector('.hf-lines'), box = body.querySelector('.hf-mt');
  let sel = null, left_ = pairs.length, wrong = 0;
  const link = (a, b) => {
    const c = box.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const x1 = ra.right - c.left - 4, y1 = ra.top - c.top + ra.height / 2, x2 = rb.left - c.left + 4, y2 = rb.top - c.top + rb.height / 2;
    svg.insertAdjacentHTML('beforeend', `<path d="M${x1} ${y1}C${x1 + 14} ${y1 - 3} ${x2 - 14} ${y2 + 3} ${x2} ${y2}"/>`);
  };
  acts(body, {
    m: b => {
      if (b.classList.contains('done')) return;
      if (!sel || sel.dataset.side === b.dataset.side) { sel?.classList.remove('sel'); sel = b; b.classList.add('sel'); sfx('tap'); return; }
      const a = sel; sel = null; a.classList.remove('sel');
      if (a.dataset.i === b.dataset.i) {
        const [l, r] = a.dataset.side === 'l' ? [a, b] : [b, a];
        // 连对的一对排到同一行：右边这张和左卡那一行的右卡换位置，线就是一小段横线，不会交叉
        const cells = [...box.querySelectorAll('.hf-mc')], x = cells[cells.indexOf(l) + 1];
        if (x !== r) {
          const was = [r, x].map(e => e.getBoundingClientRect()), ph = document.createComment('');
          r.replaceWith(ph); x.replaceWith(r); ph.replaceWith(x);
          const now_ = [r, x].map(e => e.getBoundingClientRect());
          [l, r].forEach(e => e.classList.add('done', 'tick')); link(l, r);
          if (!calm()) [r, x].forEach((e, k) => { const rot = `rotate(${e.style.getPropertyValue('--r') || '0deg'})`; e.animate([{ transform: `translate(${was[k].left - now_[k].left}px,${was[k].top - now_[k].top}px) ${rot}` }, { transform: rot }], { duration: 320, easing: 'cubic-bezier(.2,.8,.3,1)' }); });
        } else { [l, r].forEach(e => e.classList.add('done', 'tick')); link(l, r); }
        sfx('ok');
        if (--left_ === 0) { result?.(wrong === 0); foot('继续', next, { arrow: true }); }
      } else { wrong++; [a, b].forEach(x => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 380); }); sfx('no'); }
    },
  });
  foot('继续', next, { off: true, arrow: true });
};

/** 两串词的最长公共子序列：返回各自「对上了」的下标集合。排错句子时只划掉没对上的词。 */
export function lcsKeep(a, b) {
  const n = a.length, m = b.length, d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
  const ka = new Set(), kb = new Set();
  for (let i = 0, j = 0; i < n && j < m;) { if (a[i] === b[j]) { ka.add(i++); kb.add(j++); } else if (d[i + 1][j] >= d[i][j + 1]) i++; else j++; }
  return [ka, kb];
}

EX.assemble = ({ step, body, foot, next, result }) => {
  const { ex } = step, words = ex.answer.split(' ');
  const bank = shuffle([...words.map((t, i) => ({ t, id: i })), ...ex.distractors.map((t, i) => ({ t, id: 100 + i }))]);
  // 每张词卡在词堆里有一个固定的位子（留一张淡影占位）；卡片本身在「位子」和「句子那一行」之间搬来搬去
  body.innerHTML = `<p class="hf-task">把词排成句子</p><p class="md-rule hf-zhq">${esc(ex.zh)}</p>
    <div class="hf-sb"></div><div class="hf-bank">${bank.map((w, k) => `<span class="hf-slot" data-id="${w.id}" style="--r:${tilt(k)}deg"><span class="md-paper hf-wc ghost" aria-hidden="true">${esc(w.t)}</span><button type="button" class="md-paper hf-wc" data-id="${w.id}">${esc(w.t)}</button></span>`).join('')}</div>
    <div class="hf-fix" hidden><p class="md-fixed"></p>${key('a-spk', { cls: 's', act: 'say', aria: '听', r: -4 })}</div>`;
  const sb = body.querySelector('.hf-sb'), bankEl = body.querySelector('.hf-bank');
  const cards = [...bankEl.querySelectorAll('button.hf-wc')], slotOf = c => bankEl.querySelector(`.hf-slot[data-id="${c.dataset.id}"]`);
  const inSb = c => c.parentNode === sb, picked = () => [...sb.querySelectorAll('.hf-wc')];
  let done = false, drag = null, skipClick = false;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  // 卡片此刻「排版上」的位置：量到的位置减掉正在播的位移
  const shiftOf = c => { const t = getComputedStyle(c).translate; if (!t || t === 'none') return [0, 0]; const [x = 0, y = 0] = t.split(' ').map(parseFloat); return [x, y]; };
  const box = c => { const r = c.getBoundingClientRect(), [x, y] = shiftOf(c); return { l: r.left - x, t: r.top - y, w: r.width, h: r.height }; };
  // 搬动之后：每张挪了位置的卡片从原来的地方滑到新地方
  const move = change => {
    const before = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
    change();
    for (const c of cards) {
      if (c === drag?.c) continue;
      const a = before.get(c), b = box(c), dx = a.left - b.l, dy = a.top - b.t;
      if (Math.abs(dx) + Math.abs(dy) > 1) c.animate({ translate: [`${dx}px ${dy}px`, '0px 0px'] }, { duration: 220, easing: EASE });
    }
  };
  const sync = () => foot('检查', check, { off: !picked().length });
  const put = (c, before = null) => { sb.insertBefore(c, before); };
  const home = c => slotOf(c).append(c);
  // 手指在句子那一行里指着第几个位置
  const spot = (x, y, self) => picked().filter(c => c !== self).find(c => { const b = box(c); return y < b.t || (y < b.t + b.h && x < b.l + b.w / 2); }) || null;
  const check = () => {
    done = true;
    const mine = picked().map(c => c.textContent), ok = mine.join(' ') === ex.answer;
    const [keepMine, keepAns] = lcsKeep(mine, words);
    sb.classList.add(ok ? 'ok' : 'no');
    if (ok) sb.insertAdjacentHTML('beforeend', tick('hf-tick'));
    // 排错了：没对上的词用红笔划掉，正确的句子里把你缺的、放错的词划线标出来
    else picked().forEach((c, i) => c.classList.toggle('x', !keepMine.has(i)));
    body.querySelector('.md-fixed').innerHTML = words.map((w, i) => ok || keepAns.has(i) ? esc(w) : `<u>${esc(w)}</u>`).join(' ');
    body.querySelector('.hf-fix').hidden = false; bankEl.hidden = true;
    cards.forEach(c => { c.disabled = true; });
    sfx(ok ? 'ok' : 'no'); result?.(ok); playWord(ex.answer);
    foot('继续', next, { arrow: true });
  };
  // 点一下：词堆里的飞到句尾，句子里的飞回原位
  body.addEventListener('click', e => {
    const c = e.target.closest('button.hf-wc');
    if (!c || done) return;
    if (skipClick) { skipClick = false; return; }
    move(() => (inSb(c) ? home(c) : put(c)));
    sfx('tap'); sync();
  });
  // 按住拖：在句子里换位置、从词堆拖进句子、拖出句子放回去
  body.addEventListener('pointerdown', e => {
    const c = e.target.closest('button.hf-wc');
    if (!c || done || drag || (e.pointerType === 'mouse' && e.button)) return;
    const b = box(c);
    drag = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, gx: e.clientX - b.l, gy: e.clientY - b.t, on: false };
  });
  const follow = e => { const b = box(drag.c); drag.c.style.translate = `${e.clientX - drag.gx - b.l}px ${e.clientY - drag.gy - b.t}px`; };
  body.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { c } = drag;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
      drag.on = true; c.classList.add('drag'); c.getAnimations().forEach(a => a.cancel());
      try { c.setPointerCapture(e.pointerId); } catch {}
    }
    // 手指过了句子和词堆的中线算进句子，退回去算放回词堆
    const edge = (sb.getBoundingClientRect().bottom + bankEl.getBoundingClientRect().top) / 2;
    if (e.clientY < edge) {
      const before = spot(e.clientX, e.clientY, c);
      if (!inSb(c) || c.nextElementSibling !== before) move(() => put(c, before));
    } else if (inSb(c)) move(() => home(c));
    follow(e);
  });
  const drop = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { c, on } = drag; drag = null;
    if (!on) return;
    skipClick = true; setTimeout(() => { skipClick = false; }, 60);
    const from = c.style.translate; c.style.translate = ''; c.classList.remove('drag');
    c.animate({ translate: [from, '0px 0px'] }, { duration: 180, easing: EASE });
    sfx('tap'); sync();
  };
  body.addEventListener('pointerup', drop); body.addEventListener('pointercancel', drop);
  acts(body, { say: () => playWord(ex.answer) });
  sync();
};

/* ---------- 打字：听写一句 / 听拼写打词 ---------- */
function typing({ body, foot, next, result }, { task, target, zh, say, opt = '' }) {
  body.innerHTML = `<div class="hf-dhead"><p class="hf-task">${task}</p>${opt}</div>
    <div class="hf-ctl top">${key('a-spk', { label: '播放', act: 'play', r: -5 })}${key('a-slow', { label: '慢速', act: 'slow', r: 4 })}</div>
    <div class="hf-answer"><div class="md-input hf-inp"><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="${task}"></div>
      <div class="md-umlaut hf-acc">${['ä', 'ö', 'ü', 'ß'].map(c => `<button type="button" class="md-paper u" data-act="ch">${c}</button>`).join('')}<button type="button" class="md-btn" data-act="check">检查</button></div></div>`;
  const input = body.querySelector('input');
  const check = () => {
    if (!input.value.trim()) return;
    const r = correct(input.value, target);
    const caret = b => `<span class="md-ins">${b ? `<b>${esc(b)}</b>` : ''}<svg viewBox="0 0 14 11"><path d="M1.5 10 7 2l5.5 8"/></svg></span>`;
    // 你写的那一行：对的照抄；差一两个字母用红笔逐字母改；整词错的整词划掉；漏词只打一个插入号（正确的词看下面那一行）
    const written = r.items.map(o => o.t === 'ok' ? esc(o.typed)
      : o.t === 'fix' ? o.ops.map(c => c.t === 'keep' ? esc(c.ch) : c.t === 'miss' ? caret(c.ch) : `<s>${esc(c.ch)}</s>`).join('')
      : o.t === 'miss' ? caret('') : `<s>${esc(o.typed)}</s>`).join(' ');
    // 正确写法：错的词整词划线，差字母的只划那几个字母
    const fixedWord = o => { const ops = o.ops.filter(c => c.t !== 'extra'); let k = 0; return [...o.word].map(ch => /[a-zäöüß0-9]/i.test(ch) ? (ops[k++]?.t === 'miss' ? `<u>${esc(ch)}</u>` : esc(ch)) : esc(ch)).join(''); };
    const fixed = r.items.filter(o => o.t !== 'extra').map(o => o.t === 'ok' ? esc(o.word) : o.t === 'fix' ? fixedWord(o) : `<u>${esc(o.word)}</u>`).join(' ');
    body.querySelector('.hf-answer').innerHTML = `<p class="md-input hf-written">${written}${r.ok ? tick('hf-tick') : ''}</p>
      ${r.exact ? '' : `<p class="md-fixed">${r.ok ? esc(target) : fixed}</p>`}${zh ? `<p class="md-zh">${esc(zh)}</p>` : ''}`;
    sfx(r.ok ? 'ok' : 'no'); result?.(r.ok);
    foot('继续', next, { arrow: true });
  };
  acts(body, {
    play: () => say(false), slow: () => say(true),
    ch: b => { const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s; input.setRangeText(b.textContent, s, e, 'end'); input.focus(); },
    check,
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  input.addEventListener('keydown', e => { if (e.key === 'Shift') body.querySelectorAll('.u').forEach(u => { if (u.textContent !== 'ß') u.textContent = u.textContent.toUpperCase(); }); });
  input.addEventListener('keyup', e => { if (e.key === 'Shift') body.querySelectorAll('.u').forEach(u => { u.textContent = u.textContent.toLowerCase(); }); });
  foot('', null);
  say(false);
}
/* 听写可以只写重点词：勾上以后句子照常显示，只把这一句里要学的词挖空。选择记在本机。 */
const KEYS_KEY = 'md.heft.dictKeys';
const keysOn = () => { try { return localStorage.getItem(KEYS_KEY) === '1'; } catch { return false; } };
const CHECK_SVG = '<svg viewBox="0 0 26 24"><path d="M3 13.5c2.4 1.6 4.4 3.8 6 6.5C13 12 17.6 6.6 23.5 3" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/** 这一句里要挖的空：重点词在句中的位置，从左到右、互不重叠。 */
export function keyGaps(lesson, i) {
  const de = lesson.lines[i].de, out = [];
  for (const w of lesson.words.filter(w => w.line === i)) { const c = clozeAt(de, w.form); if (c && !out.some(o => c.at < o.at + o.len && o.at < c.at + c.len)) out.push(c); }
  return out.sort((a, b) => a.at - b.at);
}
RENDER.dictate = ctx => {
  const line = ctx.lesson.lines[ctx.step.i], gaps = keyGaps(ctx.lesson, ctx.step.i);
  const draw = () => {
    const on = keysOn(), box = document.createElement('div');
    ctx.body.replaceChildren(box);
    const opt = `<button type="button" class="md-paper sx-zh ${on ? 'on' : ''}" aria-pressed="${on}" data-act="keys"><span class="bx">${CHECK_SVG}</span>只写重点词</button>`;
    const c = { ...ctx, body: box }, say = slow => playLine(line, { slow });
    if (on && gaps.length) gapTyping(c, { line, gaps, opt, say });
    else typing(c, { task: '听写这一句', target: line.de, zh: line.zh, say, opt });
    hydrate(box);
    box.querySelector('[data-act=keys]').addEventListener('click', () => { try { localStorage.setItem(KEYS_KEY, on ? '0' : '1'); } catch { /* 记不住就算了 */ } stop(); draw(); });
  };
  draw();
};
function gapTyping({ body, foot, next, result }, { line, gaps, opt, say }) {
  const de = line.de;
  let html = '', at = 0;
  gaps.forEach((g, k) => { html += `${esc(de.slice(at, g.at))}<span class="hf-gapin" style="--w:${Math.max(3, g.len) + 1}ch"><input type="text" data-k="${k}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="${k === gaps.length - 1 ? 'done' : 'next'}" aria-label="第 ${k + 1} 个空"></span>`; at = g.at + g.len; });
  html += esc(de.slice(at));
  body.innerHTML = `<div class="hf-dhead"><p class="hf-task">听写空着的词</p>${opt}</div>
    <div class="hf-ctl top">${key('a-spk', { label: '播放', act: 'play', r: -5 })}${key('a-slow', { label: '慢速', act: 'slow', r: 4 })}</div>
    <div class="hf-answer"><p class="md-input hf-gapline">${html}</p>
      <div class="md-umlaut hf-acc">${['ä', 'ö', 'ü', 'ß'].map(c => `<button type="button" class="md-paper u" data-act="ch">${c}</button>`).join('')}<button type="button" class="md-btn" data-act="check">检查</button></div></div>`;
  const inputs = [...body.querySelectorAll('.hf-gapin input')];
  let last = inputs[0], done = false;
  const check = () => {
    if (done || inputs.every(i => !i.value.trim())) return;
    done = true;
    let all = true;
    inputs.forEach((inp, k) => {
      const want = de.slice(gaps[k].at, gaps[k].at + gaps[k].len), typed = inp.value.trim(), ok = sameText(typed, want);
      all &&= ok;
      // 写对的照抄；写错的用红笔划掉，正确的词写在后面并划线
      inp.parentNode.outerHTML = ok ? `<span class="hf-gapok">${esc(want)}</span>` : `<span class="hf-gapno">${typed ? `<s>${esc(typed)}</s> ` : ''}<u>${esc(want)}</u></span>`;
    });
    if (all) body.querySelector('.hf-gapline').insertAdjacentHTML('beforeend', tick('hf-tick'));
    body.querySelector('.hf-acc').remove();
    body.querySelector('.hf-answer').insertAdjacentHTML('beforeend', `<p class="md-zh">${esc(line.zh)}</p>`);
    sfx(all ? 'ok' : 'no'); result?.(all);
    foot('继续', next, { arrow: true });
  };
  acts(body, {
    play: () => say(false), slow: () => say(true),
    ch: b => { const s0 = last.selectionStart ?? last.value.length, e0 = last.selectionEnd ?? s0; last.setRangeText(b.textContent, s0, e0, 'end'); last.focus(); },
    check,
  });
  inputs.forEach((inp, k) => {
    inp.addEventListener('focus', () => { last = inp; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inputs[k + 1] ? inputs[k + 1].focus() : check(); } });
  });
  foot('', null);
  say(false);
}
EX.spell = ctx => { const { ex } = ctx.step; typing(ctx, { task: '听拼写，打出这个词', target: ex.answer, say: slow => play(ex.voice, ex.say, { slow }) }); };

/* ---------- 开口：跟读 / 复述 / 开口回应（按住说 → 评分 → 红笔批改） ---------- */
export function speakBox(ctx, { answers, ref, reveal, onShown }) {
  const { body, foot, next, result } = ctx;
  body.insertAdjacentHTML('beforeend', `<div class="hf-speak">
    <p class="hf-score" hidden></p>
    <div class="hf-cmp" hidden>${key('a-spk', { label: '听原声', act: 'orig', r: -4 })}${key('a-mine', { label: '听我的', act: 'mine', r: 5 })}</div>
    <button type="button" class="md-key mic hf-mic" data-k="a-mic" aria-label="按住说"><span class="ring"></span><span class="lb">按住说</span><span class="t"></span></button></div>`);
  const mic = body.querySelector('.hf-mic'), lb = mic.querySelector('.lb'), tEl = mic.querySelector('.t'), scoreEl = body.querySelector('.hf-score'), cmp = body.querySelector('.hf-cmp');
  hydrate(body);
  let ctl = null, starting = false, downAt = 0, lastUrl = null, tries = 0, timer = null, auto = null, sticky = false;
  const cancelAuto = () => { clearTimeout(auto); auto = null; };
  if (!canRecord()) { lb.textContent = '这台设备不能录音'; mic.disabled = true; foot('继续', next, { arrow: true }); return; }

  async function begin() {
    if (ctl || starting) return;
    starting = true; cancelAuto(); stop();
    // 麦克风用不了（没给权限、被别的应用占着）：说明原因，但不把人卡在这一步
    try { ctl = await record({ onLimit: () => end() }); } catch (err) { starting = false; downAt = 0; lb.textContent = err.message || '麦克风用不了'; result?.(null); foot('继续', next, { arrow: true }); return; }
    starting = false;
    mic.classList.add('rec'); lb.textContent = sticky ? '点一下结束' : '松开结束'; sfx('tap');
    const t0 = Date.now(); tEl.textContent = '0:00';
    timer = setInterval(() => { tEl.textContent = mmss((Date.now() - t0) / 1000); }, 250);
    if (!downAt && !sticky) end(); // 还没拿到麦克风手就松开了
  }
  async function end() {
    if (!ctl) return;
    const c = ctl; ctl = null; clearInterval(timer); tEl.textContent = '';
    mic.classList.remove('rec'); mic.classList.add('busy'); lb.textContent = '评分中';
    const rec = await c.stop(); lastUrl = rec?.url || null; tries++;
    const r = await score(rec, answers);
    mic.classList.remove('busy');
    const target = r.ok ? r.target : answers[0];
    reveal?.(target, r.ok ? r.words : null);
    cmp.hidden = false; scoreEl.hidden = false;
    mic.dataset.k = 'a-again'; mic.querySelector('svg')?.remove(); hydrate(body); lb.textContent = '再说一次';
    if (r.ok) {
      scoreEl.innerHTML = `<b>${r.score}</b>${r.pass ? tick('hf-tick') : ''}`;
      sfx(r.pass ? 'ok' : 'no');
      if (r.pass) { result?.(true); foot('继续', next, { arrow: true }); auto = setTimeout(next, 1700); }
      else { if (tries >= 2) result?.(false); foot('继续', next, { arrow: true, off: tries < 2 }); }
    } else {
      scoreEl.innerHTML = `<span>${esc(whyFailed(r))}${ctx.step.detail && r.message && r.message !== whyFailed(r) ? `<small>${esc(r.message)}</small>` : ''}</span>`;
      result?.(null); foot('继续', next, { arrow: true });
    }
    onShown?.();
  }
  mic.addEventListener('pointerdown', e => { e.preventDefault(); if (ctl && sticky) { sticky = false; end(); return; } downAt = Date.now(); begin(); });
  const up = () => { if (!downAt) return; const held = Date.now() - downAt; downAt = 0; if (held < 280) { sticky = true; if (ctl) lb.textContent = '点一下结束'; return; } end(); };
  mic.addEventListener('pointerup', up); mic.addEventListener('pointercancel', up); mic.addEventListener('pointerleave', up);
  mic.addEventListener('contextmenu', e => e.preventDefault());
  body.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'orig') { cancelAuto(); play(ref.who, ref.text); }
    if (b.dataset.act === 'mine' && lastUrl) { cancelAuto(); playUrl(lastUrl); }
  });
  foot('继续', next, { arrow: true, off: true });
  ctx.cleanup(() => { cancelAuto(); clearInterval(timer); ctl?.cancel?.(); });
}
/** 评分后把句子重画：没读准的词红笔划线。 */
export function graded(de, words) {
  if (!words) return esc(de);
  const bad = new Set(words.filter(w => w.bad).map(w => lower(w.word)));
  return pieces(de).map(p => p.word && bad.has(lower(p.t)) ? `<span class="hf-bad">${esc(p.t)}</span>` : esc(p.t)).join('');
}

RENDER.shadow = ctx => {
  const { lesson, step, body } = ctx, line = lesson.lines[step.i];
  body.innerHTML = `<p class="hf-task">跟着说你的台词</p><div class="hf-mine">${row(line, { big: true })}</div>`;
  body.addEventListener('click', e => { if (e.target.closest('[data-act=say]')) playLine(line); });
  speakBox(ctx, { answers: [line.de], ref: { who: line.who, text: sayOf(line) }, reveal: (t, words) => { body.querySelector('.hf-mine .md-de').innerHTML = q(graded(line.de, words)); } });
  playLine(line);
};

RENDER.retell = ctx => {
  const { lesson, step, body } = ctx, i = step.i, line = lesson.lines[i], before = lesson.lines.slice(Math.max(0, i - 3), i);
  body.innerHTML = `<p class="hf-task">说出你的台词</p>
    <div class="hf-rt">${before.map((l, k) => row(l, { zh: false, spk: k === before.length - 1, cls: k === before.length - 1 ? '' : 'prev' })).join('')}</div>
    <div class="md-cur hf-mine2"><div class="md-ln">${avatar(line.who)}<div><span class="md-name">你</span><p class="hf-hintzh">${esc(line.zh)}</p></div></div></div>`;
  const cue = before.at(-1);
  body.addEventListener('click', e => { if (e.target.closest('[data-act=say]') && cue) playLine(cue); });
  speakBox(ctx, {
    answers: [line.de], ref: { who: line.who, text: sayOf(line) },
    reveal: (t, words) => { body.querySelector('.hf-mine2 .md-ln > div').innerHTML = `<span class="md-name">你</span><p class="md-de">${q(graded(line.de, words))}</p><p class="md-zh">${esc(line.zh)}</p>`; },
  });
  if (cue) playLine(cue);
};

RENDER.speak = ctx => {
  const { step, body, lesson } = ctx, it = step.item, role = lesson?.role || 'Lin';
  body.innerHTML = `<p class="hf-task">${esc(it.prompt)}</p>
    <div class="hf-rt">${it.cue ? `<div class="md-hi hf-cue">${avatar(it.cue.who)}${key('a-spk', { act: 'cue', label: '播放', r: -4 })}${key('a-slow', { act: 'cueslow', label: '慢速', r: 4 })}</div>` : ''}</div>
    <div class="md-cur hf-mine2"><div class="md-ln">${avatar(role)}<div><span class="md-name">你</span><p class="hf-blank"></p></div></div></div>`;
  body.addEventListener('click', e => {
    if (e.target.closest('[data-act=cue]')) play(it.cue.who, it.cue.de);
    if (e.target.closest('[data-act=cueslow]')) play(it.cue.who, it.cue.de, { slow: true });
  });
  const refText = t => t.replace(/L – I – N/, 'Ell, Ih, Enn');
  speakBox(ctx, {
    answers: it.answers, ref: { who: role, text: refText(it.model) },
    reveal: (t, words) => { body.querySelector('.hf-mine2 .md-ln > div').innerHTML = `<span class="md-name">你</span><p class="md-de">${q(graded(t, words))}</p>`; },
  });
  if (it.cue) play(it.cue.who, it.cue.de);
};

/* ---------- 完成页：故事格 + 现在你能 ---------- */
RENDER.finish = ({ lesson, step, body, foot, next }) => {
  const half = step?.day === 1; // 两天课的第 1 天：这一课还没盖章，明天接着学
  const unit = STORY_LESSONS.filter(l => l.unit === lesson.unit), nextLesson = half ? lesson : STORY_LESSONS[STORY_LESSONS.indexOf(lesson) + 1];
  const panel = l => {
    if (l.n < lesson.n || (l === lesson && !half)) return `<div class="p f"><span class="no">${l.n}</span><p class="tt">${esc(l.title)}</p>${seal(l.n)}</div>`;
    if (l === nextLesson) return `<div class="p e nx"><span class="no">${l.n} · 明天</span>${avatar(l.cast?.[0] || 'Lena')}<p class="tt">${esc(l.title)}</p></div>`;
    return `<div class="p e sm"><span class="no">${l.n}</span></div>`;
  };
  if (half) { body.innerHTML = `<div class="hf-rh"><h2>第 ${lesson.n} 课 · 第 1 天学完了</h2></div><div class="md-story hf-story">${unit.map(panel).join('')}</div>`; return foot('完成', next); }
  body.innerHTML = `<div class="hf-rh"><h2>${lesson.n ? `第 ${lesson.n} 课学完了` : `${esc(lesson.title)}学完了`}</h2></div>
    ${lesson.unit ? `<div class="md-story hf-story">${unit.map(panel).join('')}</div>` : `<div class="hf-solo">${seal(0, 'hf-bigseal')}</div>`}
    <div class="md-can plain hf-can"><h3>现在你能</h3>${lesson.canDo.map(c => `<div class="i"><p class="c">${esc(c)}</p>${tick()}</div>`).join('')}</div>`;
  sfx('stamp');
  foot('完成', next);
};
