// 每一种步骤怎么画。样式和结构照设计系统（css/ds.css 的 md-* 组件）和 lab/ds-explore 里对应的原型。
// 约定：render(ctx)。ctx = { lesson, step, body, foot(label, fn, opts), next(), result(ok) }。
// 界面上只写“要做什么”，不写教学法说明、安慰或提示性废话。
import { STORY_CAST, STORY_LESSONS, rowSay } from '../../data/story-lessons.js';
import { avatar, key, q, tick, seal, hydrate, NAME, picOf } from './art.js';
import { play, playLine, playWord, playUrl, stop, duration, sayOf, sfx } from './audio.js';
import { canRecord, record, score } from './speech.js';
import { correct, pieces, entry, sameText } from './flow.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const tilt = i => [-1.2, 1, -0.6, 1.4, -1, 0.7][i % 6];
export const hlClass = de => entry(de).art || 'word';
export const lower = s => s.toLocaleLowerCase('de-DE');

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
  acts(body, { word: () => playWord(item.de), say: () => playLine(line) });
  foot('继续', next, { arrow: true });
  playWord(item.de);
};

/* ---------- 带着一个问题听全文 ---------- */
const TL_COLOR = { Lena: 'var(--illus-ochre)', Tom: 'var(--illus-sky)', Lin: 'var(--char-lin)', Krause: '#b9c7a4' };
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
RENDER.listen = ctx => listenUI(ctx, { lesson: ctx.lesson, head: `<p class="hf-task">听完回答：</p><p class="hf-qq">${esc(ctx.lesson.listenQuestion.prompt)}</p>` });
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
  const paint = (i, done) => {
    cast.forEach(c => c.classList.toggle('on', i >= 0 && c.dataset.who === lesson.lines[i]?.who));
    const before = durs.slice(0, Math.max(i, 0)).reduce((a, b) => a + b, 0) + (done ? durs[i] || 0 : 0);
    bar.style.width = `${Math.min(100, before / total * 100)}%`; nowEl.textContent = mmss(before);
    const pv = i >= 0 && (lesson.preview || []).find(p => p.line === i);
    flash.innerHTML = pv ? `<span class="md-hl ${hlClass(pv.de)}">${esc(pv.de)}</span>` : '';
  };
  async function start(from = 0) {
    const mine = ++run; playing = true; setToggle(true);
    for (let i = from; i < lesson.lines.length; i++) {
      paint(i, false);
      const ok = await playLine(lesson.lines[i], { slow });
      if (mine !== run) return;
      if (!ok) { playing = false; setToggle(false); return; }
      paint(i, true);
    }
    playing = false; setToggle(false); paint(-1, false); bar.style.width = '100%'; nowEl.textContent = mmss(total);
    flags.heard = true; foot('回答问题', next);
  }
  acts(body, {
    toggle: () => { if (playing) { run++; playing = false; stop(); setToggle(false); } else start(0); },
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
  const { lesson } = ctx;
  const all = async () => { for (const l of lesson.lines) if (!await playLine(l)) return; };
  choiceUI(ctx, {
    ex: lesson.listenQuestion, replay: all,
    head: `<p class="hf-task">听完回答：</p><p class="hf-qq">${esc(lesson.listenQuestion.prompt)}</p>`,
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
RENDER.card = ({ lesson, step, body, foot, next }) => {
  const c = step.card, src = lesson.lines[c.after];
  const exLine = c.example ? { who: 'Lena', de: c.example, zh: '' } : null;
  let html = '';
  if (c.kind === 'tip') {
    html = `<div class="md-note hf-note"><span class="md-tape"></span><p>${esc(c.title)}</p><p class="b">${esc(c.body)}</p></div>`;
  } else if (c.kind === 'grammar') {
    html = `<h2 class="hf-gname">${esc(c.title)}</h2><p class="md-rule">${esc(c.body)}</p>
      <div class="hf-src">${row(src, {})}</div>${tableHtml(c.table, c.on)}
      ${c.contrast ? `<div class="hf-contrast">${c.contrast.map(([a, b]) => `<div class="pr"><button type="button" class="md-paper" data-act="con">${esc(a)}</button><button type="button" class="md-paper" data-act="con">${esc(b)}</button></div>`).join('')}</div>` : ''}`;
  } else {
    html = `<h2 class="hf-gname">${esc(c.title)}</h2><p class="md-rule">${esc(c.body)}</p>
      <div class="md-pair hf-pair">${c.pairs.map(p => `<button type="button" class="md-paper c" data-act="pair"><p class="w">${esc(p)}</p>${key('a-spk', { cls: 's', aria: '听', r: -3 }).replace('<button', '<span').replace('</button>', '</span>')}</button>`).join('')}</div>
      <div class="hf-src">${exLine ? `<div class="md-ln say"><span></span><div><p class="md-ctx">${q(esc(c.example))}</p></div>${key('a-spk', { cls: 's', act: 'ex', aria: '听', r: -4 })}</div>` : ''}</div>`;
  }
  body.innerHTML = html;
  const lit = c.table ? c.on.map(i => c.table.rows[i]) : [];
  acts(body, {
    say: () => playLine(src),
    ex: () => playWord(c.example),
    row: b => { const r = lit[[...body.querySelectorAll('[data-act=row]')].indexOf(b)]; playWord(rowSay(r)); },
    pair: b => playWord(c.pairs[[...body.querySelectorAll('[data-act=pair]')].indexOf(b)]),
    con: b => playWord(b.textContent),
  });
  foot('继续', next, { arrow: true });
};

/* ---------- 词包：成套的词一屏给全 ---------- */
RENDER.pack = ({ lesson, body, foot, next }) => {
  const p = lesson.wordPack;
  body.innerHTML = `<p class="hf-task">${esc(p.title)}</p>
    <div class="md-pack hf-pack">${p.items.map((it, i) => `<button type="button" class="r" data-act="it" data-i="${i}"><span class="n">${esc(it.n)}</span><span class="w">${p.inText.includes(it.de) ? `<span class="md-hl word">${esc(it.de)}</span>` : esc(it.de)}</span></button>`).join('')}</div>
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
        [l, r].forEach(x => x.classList.add('done', 'tick')); link(l, r); sfx('ok');
        if (--left_ === 0) { result?.(wrong === 0); foot('继续', next, { arrow: true }); }
      } else { wrong++; [a, b].forEach(x => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 380); }); sfx('no'); }
    },
  });
  foot('继续', next, { off: true, arrow: true });
};

EX.assemble = ({ step, body, foot, next, result }) => {
  const { ex } = step, words = ex.answer.split(' ');
  const bank = shuffle([...words.map((t, i) => ({ t, id: i })), ...ex.distractors.map((t, i) => ({ t, id: 100 + i }))]);
  body.innerHTML = `<p class="hf-task">把词排成句子</p><p class="md-rule hf-zhq">${esc(ex.zh)}</p>
    <div class="hf-sb"></div><div class="hf-bank">${bank.map((w, k) => `<button type="button" class="md-paper hf-wc" data-act="w" data-id="${w.id}" style="--r:${tilt(k)}deg">${esc(w.t)}</button>`).join('')}</div>
    <div class="hf-fix" hidden><p class="md-fixed">${esc(ex.answer)}</p>${key('a-spk', { cls: 's', act: 'say', aria: '听', r: -4 })}</div>`;
  const sb = body.querySelector('.hf-sb'), picked = [];
  let done = false;
  const draw = () => {
    sb.innerHTML = picked.map(w => `<button type="button" class="md-paper hf-wc" data-act="back" data-id="${w.id}">${esc(w.t)}</button>`).join('');
    body.querySelectorAll('.hf-bank .hf-wc').forEach(b => b.classList.toggle('ghost', picked.some(w => w.id === +b.dataset.id)));
    foot('检查', check, { off: !picked.length });
  };
  const check = () => {
    done = true;
    const ok = picked.map(w => w.t).join(' ') === ex.answer;
    sb.classList.add(ok ? 'ok' : 'no'); if (ok) sb.insertAdjacentHTML('beforeend', tick('hf-tick'));
    body.querySelector('.hf-fix').hidden = false; body.querySelector('.hf-bank').hidden = true;
    sfx(ok ? 'ok' : 'no'); result?.(ok); playWord(ex.answer);
    foot('继续', next, { arrow: true });
  };
  acts(body, {
    w: b => { if (done || b.classList.contains('ghost')) return; picked.push(bank.find(w => w.id === +b.dataset.id)); sfx('tap'); draw(); },
    back: b => { if (done) return; picked.splice(picked.findIndex(w => w.id === +b.dataset.id), 1); draw(); },
    say: () => playWord(ex.answer),
  });
  draw();
};

/* ---------- 打字：听写一句 / 听拼写打词 ---------- */
function typing({ body, foot, next, result }, { task, target, zh, say }) {
  body.innerHTML = `<p class="hf-task">${task}</p>
    <div class="hf-ctl top">${key('a-spk', { label: '播放', act: 'play', r: -5 })}${key('a-slow', { label: '慢速', act: 'slow', r: 4 })}</div>
    <div class="hf-answer"><div class="md-input hf-inp"><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="${task}"></div>
      <div class="md-umlaut hf-acc">${['ä', 'ö', 'ü', 'ß'].map(c => `<button type="button" class="md-paper u" data-act="ch">${c}</button>`).join('')}<button type="button" class="md-btn" data-act="check">检查</button></div></div>`;
  const input = body.querySelector('input');
  const check = () => {
    if (!input.value.trim()) return;
    const r = correct(input.value, target); let ti = 0;
    const written = r.ops.map(o => o.t === 'keep' ? esc(o.ch) : o.t === 'miss' ? `<span class="md-ins"><b>${esc(o.ch === ' ' ? '␣' : o.ch)}</b><svg viewBox="0 0 14 11"><path d="M1.5 10 7 2l5.5 8"/></svg></span>` : `<s>${esc(o.ch)}</s>`).join('');
    const fixed = r.ops.filter(o => o.t !== 'extra').map(o => (ti++, o.t === 'miss' ? `<u>${esc(o.ch)}</u>` : esc(o.ch))).join('');
    body.querySelector('.hf-answer').innerHTML = `<p class="md-input hf-written">${written}${r.ok ? tick('hf-tick') : ''}</p>
      ${r.ok ? '' : `<p class="md-fixed">${fixed}</p>`}${zh ? `<p class="md-zh">${esc(zh)}</p>` : ''}`;
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
RENDER.dictate = ctx => { const line = ctx.lesson.lines[ctx.step.i]; typing(ctx, { task: '听写这一句', target: line.de, zh: line.zh, say: slow => playLine(line, { slow }) }); };
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
      scoreEl.innerHTML = `<span>${ctx.step.detail && r.message ? esc(r.message) : r.reason === 'not-configured' ? '还没设置发音评分' : '评分暂时连不上'}</span>`;
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
RENDER.finish = ({ lesson, body, foot, next }) => {
  const unit = STORY_LESSONS.filter(l => l.unit === lesson.unit), nextLesson = STORY_LESSONS[STORY_LESSONS.indexOf(lesson) + 1];
  const panel = l => {
    if (l.n <= lesson.n) return `<div class="p f"><span class="no">${l.n}</span><p class="tt">${esc(l.title)}</p>${seal(l.n)}</div>`;
    if (l === nextLesson) return `<div class="p e nx"><span class="no">${l.n} · 明天</span>${avatar(l.cast?.[0] || 'Lena')}<p class="tt">${esc(l.title)}</p></div>`;
    return `<div class="p e sm"><span class="no">${l.n}</span></div>`;
  };
  body.innerHTML = `<div class="hf-rh"><h2>${lesson.n ? `第 ${lesson.n} 课学完了` : `${esc(lesson.title)}学完了`}</h2></div>
    ${lesson.unit ? `<div class="md-story hf-story">${unit.map(panel).join('')}</div>` : `<div class="hf-solo">${seal(0, 'hf-bigseal')}</div>`}
    <div class="md-can plain hf-can"><h3>现在你能</h3>${lesson.canDo.map(c => `<div class="i"><p class="c">${esc(c)}</p>${tick()}</div>`).join('')}</div>`;
  sfx('stamp');
  foot('完成', next);
};
