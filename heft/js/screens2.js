// 第 0 课的小站、隔天复习、单元总表与小测。约定和 screens.js 一样；对照原型：
// 复习卡 lab/ds-explore/round13/i-grammatik.html · 泛读/字母表/读音组/门铃 round16/l-chosen.html · 总表与小测 round15/k-chosen.html
import { STORY_LESSONS, rowSay, plainWord } from '../../data/story-lessons.js';
import { RENDER, EX, esc, lower, row, wordEntry, acts, choiceUI, listenUI, hlClass, fitEntry, TL_COLOR, mmss } from './screens.js';
import { key, q, tick, seal, hydrate, picOf, avatar, NAME } from './art.js';
import { play, playLine, playWord, sfx, stop, duration, sayOf, position } from './audio.js';
import { pieces, entry, clozeAt, quizOutcome } from './flow.js';

const artDe = de => { const e = entry(de); return `${e.art ? `<em class="md-art ${e.art}">${e.art}</em> ` : ''}${esc(e.lemma)}`; };

/* ---------- 复习卡：课文原句挖空 → 看答案 → 没记住 / 记住了 ---------- */
RENDER.rvCard = ({ step, body, foot, foot2, next, result }) => {
  const { lesson, word } = step, line = lesson.lines[word.line], c = clozeAt(line.de, word.form);
  const pv = lesson.preview.find(p => p.de === word.de), pic = pv ? picOf(pv.pic) : '';
  const sentence = shown => !c ? esc(line.de)
    : `${esc(line.de.slice(0, c.at))}<span class="md-gap ${shown ? 'filled' : ''}" style="min-width:${Math.max(3, c.len) * 0.62}em">${shown ? esc(line.de.slice(c.at, c.at + c.len)) : ''}</span>${esc(line.de.slice(c.at + c.len))}`;
  const draw = shown => {
    body.innerHTML = `<p class="hf-task">空里填什么？</p>
      <div class="hf-rv">${row(line, { html: sentence(shown), big: true, spk: shown })}</div>
      ${shown ? `<div class="hf-got">${pic ? `<div class="hf-pic sm">${pic}</div>` : ''}${wordEntry(word.de, word.zh, 'l')}</div>` : ''}`;
    hydrate(body); fitEntry(body);
  };
  acts(body, { say: () => playLine(line), word: () => playWord(word.de) });
  draw(false);
  foot('看答案', () => {
    draw(true); playWord(word.de);
    foot2(['没记住', () => { result(false); next(); }], ['记住了', () => { result(true); next(); }]);
  });
};

/* ---------- 课后小材料：读一读，点词看意思 ---------- */
RENDER.rvRead = ({ step, body, foot, next }) => {
  const { lesson } = step, rd = lesson.reading;
  const newOf = t => rd.newWords.find(w => w.forms.includes(lower(t)));
  // 同一个人连着写的几行算一张便利贴（宿舍群里的消息会有两张）
  const notes = [];
  rd.lines.forEach((l, i) => { const g = notes.at(-1); if (g && g.who === l.who) g.lines.push(i); else notes.push({ who: l.who, lines: [i] }); });
  const lineHtml = i => `<p class="fl" data-l="${i}">${pieces(rd.lines[i].de).map(p => p.word ? `<span class="hf-w ${newOf(p.t) ? 'md-new' : ''}" data-act="gloss" data-w="${esc(lower(p.t))}">${esc(p.t)}</span>` : esc(p.t)).join('')}</p>`;
  body.innerHTML = `<p class="hf-task">读一读，点词看意思</p>
    ${notes.map((n, k) => `<div class="md-fridge hf-fridge" style="--r:${k % 2 ? 1.1 : -1.4}deg"><svg class="mag" viewBox="0 0 40 40"><use href="#a-mag"/></svg>
      ${n.lines.map(lineHtml).join('')}<p class="sig">– ${n.who === 'Krause' ? 'Herr Krause' : n.who}</p></div>`).join('')}`;
  let say = null;
  const close = () => {
    body.querySelectorAll('.md-gloss').forEach(x => x.remove());
    body.querySelectorAll('.hf-w.on').forEach(x => x.classList.remove('on', 'md-hl', 'der', 'die', 'das', 'word'));
  };
  acts(body, {
    gloss: b => {
      const was = b.classList.contains('on'); close();
      if (was) return;
      const nw = newOf(b.textContent), g = lesson.gloss[b.dataset.w], p = b.closest('.fl');
      if (!nw && !g) return;
      // 新词：整条词条（Bis später! 两个词一起亮）；旧词：只给这一个词的意思
      const same = nw ? [...body.querySelectorAll('.hf-w')].filter(x => newOf(x.textContent) === nw && x.closest('.fl') === p) : [b];
      same.forEach(x => x.classList.add('on', 'md-hl', nw ? hlClass(nw.de) : 'word'));
      p.insertAdjacentHTML('afterend', `<div class="md-gloss hf-gloss" style="--x:${Math.max(18, Math.min(b.offsetLeft + b.offsetWidth / 2 - 7, p.offsetWidth - 40))}px"><div><p class="lm">${nw ? artDe(nw.de) : esc(b.textContent)}</p><p class="mn">${esc(nw ? nw.zh : g)}</p></div>${key('a-spk', { cls: 's', act: 'gl', aria: '听', r: 4 })}</div>`);
      hydrate(body);
      say = nw ? () => playWord(nw.de) : () => playLine(rd.lines[+p.dataset.l]);
    },
    gl: () => say?.(),
  });
  foot('回答问题', next);
};

/* ---------- 第 0 课：字母表 / 一组读音 / 门铃名牌 ---------- */
const head = (s, all) => `<div class="hf-ph"><h2 class="hf-gname">${esc(s.title)}</h2>${all ? key('a-spk', { label: '播放', act: 'all', r: -4 }) : ''}</div><p class="md-rule">${esc(s.cue)}</p>`;

function letterTable({ step, body }) {
  const s = step.stop;
  body.innerHTML = `${head(s, true)}
    <div class="md-abc hf-abc">${s.letters.map((x, i) => `<button type="button" class="lt ${s.hard?.includes(x.l) ? 'dif' : ''}" data-act="lt" data-i="${i}"><b>${x.l}</b>${/Umlaut/.test(x.name) ? '' : `<span>${esc(x.name)}</span>`}</button>`).join('')}</div>`;
  const cells = [...body.querySelectorAll('.lt')];
  let run = 0;
  const light = i => cells.forEach((c, k) => c.classList.toggle('on', k === i));
  const one = async i => { light(i); const ok = await playWord(s.letters[i].say); if (ok) light(-1); return ok; };
  acts(body, {
    lt: b => { run++; one(+b.dataset.i); },
    all: async () => { const mine = ++run; for (let i = 0; i < s.letters.length; i++) { if (mine !== run || !await one(i)) return; } },
  });
}

/* 拼读小抄（设计系统 CribSheet / ReadFirst；原型 lab/ds-explore/round23/s-sounds.html）：一张贴了纸胶带的纸，一行一个读音，点一行听那个词。 */
const sound = w => esc(entry(w).lemma).replace(/\[(.+?)\]/g, '<b>$1</b>');
export function cribHtml(s) {
  return `<div class="md-crib hf-crib"><span class="md-tape"></span><h2>${esc(s.title).replace(/ · /g, ' <i>·</i> ')}</h2>
    ${s.rows.map((r, i) => `<button type="button" class="r ${r.gap ? 'gap' : ''}" data-act="crib" data-i="${i}"><span class="s">${esc(r.s)}</span><span><span class="w">${sound(r.w)}<small>${esc(r.zh)}</small></span><span class="c">${esc(r.c)}</span></span>${key('a-spk', { cls: 's', r: i % 2 ? 4 : -3 }).replace('<button', '<span').replace('</button>', '</span>')}</button>`).join('')}</div>`;
}
export function bindCrib(root, s) {
  const rows = [...root.querySelectorAll('.md-crib .r')];
  root.addEventListener('click', async e => {
    const r = e.target.closest('[data-act=crib]'); if (!r) return;
    rows.forEach(x => x.classList.toggle('on', x === r));
    if (await playWord(plainWord(s.rows[+r.dataset.i].w))) r.classList.remove('on');
  });
}
function cribSheet({ step, body }) {
  body.innerHTML = `<p class="hf-task">点一下听，跟着读</p>${cribHtml(step.stop)}`;
  bindCrib(body, step.stop);
}
/* 你先读，再听原声：一个词大字居中，不判对错；听过原声才出中文、才能继续 */
RENDER.try = ({ step, body, foot, next }) => {
  const t = step.item, e = entry(t.w);
  body.innerHTML = `<p class="hf-task">${esc(t.prompt || '先自己读出来，再听原声')}</p>
    <div class="md-try hf-try"><p class="big">${e.art ? `<em class="md-art ${e.art}">${e.art}</em>` : ''}${sound(t.w)}</p><p class="mn"></p>${key('a-spk', { label: '听原声', act: 'hear', r: -4 })}</div>`;
  const mn = body.querySelector('.mn');
  acts(body, { hear: () => { mn.textContent = t.zh; mn.classList.add('in'); sfx('tap'); play(t.voice || 'Lena', t.say || plainWord(t.w)); foot('继续', next, { arrow: true }); } });
  foot('继续', next, { arrow: true, off: true });
};

function doorbell({ step, body }) {
  const s = step.stop;
  body.innerHTML = `<p class="hf-task">先读出来，再按门铃听</p>
    <div class="md-door hf-door"><div class="grill"></div>
      ${s.blind.map((b, i) => `<div class="bl"><div class="win"><p class="nm">${artDe(b.de)}</p></div>${key('a-bell', { act: 'bell', aria: '按门铃听', r: [-3, 2, -2, 3][i % 4] })}<p class="zh" hidden>${esc(b.zh)}</p></div>`).join('')}</div>`;
  const rows = [...body.querySelectorAll('.bl')];
  acts(body, { bell: b => { const i = rows.indexOf(b.closest('.bl')), it = s.blind[i]; rows[i].querySelector('.zh').hidden = false; sfx('tap'); playWord(it.say || it.de); } });
}
RENDER.stop = ctx => {
  const s = ctx.step.stop;
  (s.letters ? letterTable : s.rows ? cribSheet : doorbell)(ctx);
  ctx.foot('继续', ctx.next, { arrow: true });
};

/* ---------- 单元总表：这个单元零散学到的变位收成一整张 ---------- */
RENDER.unitTable = ({ unit, body, foot, next }) => {
  const heads = unit.tables.flatMap(t => t.head.slice(1));
  const rows = unit.tables[0].rows.map((r, i) => [r[0], ...unit.tables.flatMap(t => t.rows[i].slice(1))]);
  // 哪几行是这个单元的课文里没点亮过、在总表里第一次见的
  const seen = new Set();
  STORY_LESSONS.filter(l => l.unit === unit.unit).forEach(l => (l.cards || []).forEach(c => (c.on || []).forEach(i => seen.add(i))));
  const cell = (v, h) => { const stem = h.endsWith('en') && h !== 'sein' ? h.slice(0, -2) : ''; return stem && v.startsWith(stem) ? `${esc(stem)}<span class="md-hl word">${esc(v.slice(stem.length))}</span>` : esc(v); };
  body.innerHTML = `<h2 class="hf-gname sm">${heads.map(esc).join(' · ')}</h2><p class="md-rule">${esc(unit.rule || '')}</p>
    <div class="md-unit hf-unit" style="--cols:${heads.map((h, c) => `${Math.max(h.length, ...rows.map(r => r[c + 1].length))}fr`).join(' ')}">
      <div class="h"><span></span><span></span>${heads.map(h => `<span>${esc(h)}</span>`).join('')}<span></span></div>
      ${rows.map((r, i) => `<div class="r">${seen.has(i) ? '<span></span>' : '<span class="tag">新</span>'}<span class="p">${esc(r[0])}</span>${r.slice(1).map((v, c) => `<span>${cell(v, heads[c])}</span>`).join('')}${key('a-spk', { cls: 's', act: 'row', aria: '听这一行', r: i % 2 ? 3 : -4 })}</div>`).join('')}</div>
    <div class="md-note hf-newrows"><span class="md-tape"></span>${unit.newRows.map((r, i) => `<button type="button" data-act="nr" data-i="${i}"><b>${esc(r.de)}</b><small>${esc(r.zh)}</small></button>`).join('')}</div>`;
  let run = 0;
  acts(body, {
    row: async b => { const mine = ++run, i = [...body.querySelectorAll('[data-act=row]')].indexOf(b); for (let c = 1; c < rows[i].length; c++) { if (mine !== run || !await playWord(rowSay(rows[i], c))) return; } },
    nr: b => { run++; playWord(unit.newRows[+b.dataset.i].de); },
  });
  foot('继续', next, { arrow: true });
};

/* ---------- 小测：没见过的听力 + 开口回应 → 结果 ---------- */
RENDER.quizListen = ctx => listenUI(ctx, { lesson: { lines: ctx.unit.quiz.listen.lines }, head: '<p class="hf-task">听一段新对话，再回答问题</p>' });
EX.heardChoice = ctx => {
  const lines = ctx.unit.quiz.listen.lines;
  choiceUI(ctx, {
    ex: ctx.step.ex, replay: async () => { for (const l of lines) if (!await playLine(l)) return; },
    head: `<p class="hf-task">听完回答：</p><p class="hf-qq">${esc(ctx.step.ex.prompt)}</p>`,
    after: `<p class="hf-again">${key('a-spk', { cls: 's', act: 'replay', label: '再听一遍', r: -4 })}</p>`,
  });
};

RENDER.quizResult = ({ unit, body, foot, next, results, steps, redo, flags }) => {
  const [t1, t2] = unit.title.split(' · '), out = quizOutcome(unit, steps, results);
  const say = t => t.replace(/L – I – N/, 'Ell, Ih, Enn');
  body.innerHTML = `<div class="hf-rh q"><div><h2>${esc(t1)}</h2><p>${esc(t2 || '')}</p></div>${seal(unit.unit, 'hf-bigseal q')}</div>
    <div class="md-can hf-res"><h3>现在你能</h3>${out.map((o, i) => `<div class="i ${o.failed.length ? 'not' : ''}">${o.failed.length ? '<span></span>' : tick()}
      <div><p class="c">${esc(o.text)}</p>${o.model ? `<p class="g">${q(esc(o.model))}</p>` : ''}${o.failed.length ? `<button type="button" class="md-paper md-redo" data-act="redo" data-i="${i}">再练一次</button>` : ''}</div>
      ${o.model ? key('a-spk', { cls: 's', act: 'say', aria: '听', r: i % 2 ? 3 : -4 }) : '<span></span>'}</div>`).join('')}</div>`;
  const rowsEl = [...body.querySelectorAll('.i')];
  acts(body, {
    say: b => play('Lin', say(out[rowsEl.indexOf(b.closest('.i'))].model)),
    redo: b => redo(out[+b.dataset.i].failed),
  });
  if (!flags.seen) { flags.seen = true; sfx('stamp'); }
  foot('完成', next);
};

/* ---------- 带字幕听全文（2026-11-14：第一遍不考；作者选的 B 字幕版，原型 lab/ds-explore/round23/s-listen.html） ---------- */
// 屏幕上只留当前这一句（大字 + 水彩）和上一句（淡）。中文翻译由右上角的小开关控制，记住上次的选择。
const ZH_KEY = 'md.heft.zh';
const zhOn = () => { try { return localStorage.getItem(ZH_KEY) !== '0'; } catch { return true; } };
RENDER.watch = async ({ lesson, body, foot, next, flags }) => {
  const lines = lesson.lines, speakers = [...new Set(lines.map(l => l.who))];
  const durs = await Promise.all(lines.map(l => duration(l.who, sayOf(l))));
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0)), total = durs.reduce((a, b) => a + b, 0);
  let zh = zhOn();
  body.classList.toggle('nozh', !zh);
  body.innerHTML = `<div class="sx-head"><p class="hf-task">听一遍</p>
      <button type="button" class="md-paper sx-zh ${zh ? 'on' : ''}" aria-pressed="${zh}" data-act="zh"><span class="bx"><svg viewBox="0 0 26 24"><path d="M3 13.5c2.4 1.6 4.4 3.8 6 6.5C13 12 17.6 6.6 23.5 3" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>中文</button></div>
    <div class="sx-cast">${speakers.map(w => `<div class="c" data-who="${w}">${avatar(w)}<span>${NAME[w]}</span><b style="background:${TL_COLOR[w]}"></b></div>`).join('')}</div>
    <div class="sx-sub" aria-live="polite"><div class="prev"></div><div class="cur" hidden></div></div>
    <div class="sx-ctl"><div class="hf-tl"><div class="bar">${lines.map((l, i) => `<i style="flex:${durs[i]};background:${TL_COLOR[l.who]}"></i>`).join('')}<u></u></div>
        <div class="t"><span class="now">0:00</span><span>${mmss(total)}</span></div></div>
      <div class="hf-ctl">${key('a-slow', { label: '慢速', act: 'slow', r: 4 })}${key('a-spk', { label: '播放', act: 'toggle', r: -5 })}</div></div>`;
  const $ = sel => body.querySelector(sel);
  const cast = [...body.querySelectorAll('.sx-cast .c')], bar = $('.hf-tl u'), nowEl = $('.now'), toggle = $('[data-act=toggle]'), prevEl = $('.sx-sub .prev'), curEl = $('.sx-sub .cur');
  let shown = -2, playing = false, slow = false, run = 0, at = 0, cur = -1;
  function showLine(i) {
    cast.forEach(c => c.classList.toggle('on', playing && i >= 0 && i < lines.length && c.dataset.who === lines[i].who));
    if (i === shown) return;
    shown = i;
    const p = lines[i - 1], c = lines[i];
    prevEl.innerHTML = p ? `<p>${q(esc(p.de))}</p><p class="md-zh">${esc(p.zh)}</p>` : '';
    curEl.hidden = !c;
    if (c) { curEl.classList.remove('in'); void curEl.offsetWidth; curEl.classList.add('in'); curEl.innerHTML = `<span class="md-name">${NAME[c.who]}</span><p class="md-de">${q(esc(c.de))}</p><p class="md-zh">${esc(c.zh)}</p>`; }
  }
  const setCursor = t => { bar.style.width = `${Math.min(100, t / total * 100)}%`; nowEl.textContent = mmss(t); };
  const setToggle = on => { toggle.dataset.k = on ? 'a-pause' : 'a-spk'; toggle.innerHTML = on ? '暂停' : '播放'; hydrate(toggle.parentNode); };
  const frame = () => { if (!body.isConnected) return; if (cur >= 0) setCursor(starts[cur] + Math.min(durs[cur], position())); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  async function start(from) {
    const mine = ++run; playing = true; setToggle(true);
    for (let i = from; i < lines.length; i++) {
      at = i; cur = i; showLine(i);
      const ok = await playLine(lines[i], { slow });
      if (mine !== run) return;
      if (!ok) { playing = false; cur = -1; setToggle(false); return; }
      await new Promise(r => setTimeout(r, 260)); // 两句之间留一口气
      if (mine !== run) return;
    }
    playing = false; cur = -1; at = 0; setToggle(false); setCursor(total); cast.forEach(c => c.classList.remove('on'));
    flags.heard = true; foot('继续', next, { arrow: true });
  }
  const halt = () => { run++; playing = false; cur = -1; stop(); };
  acts(body, {
    toggle: () => { if (playing) { halt(); setToggle(false); setCursor(starts[at]); showLine(at); } else start(at); }, // 暂停后从这一句开头接着放
    slow: b => { slow = !slow; b.classList.toggle('on', slow); if (playing) { halt(); start(at); } },
    zh: b => { zh = !zh; b.classList.toggle('on', zh); b.setAttribute('aria-pressed', zh); body.classList.toggle('nozh', !zh); try { localStorage.setItem(ZH_KEY, zh ? '1' : '0'); } catch { /* 记不住就算了 */ } },
  });
  $('.hf-tl').addEventListener('click', e => { // 点时间线跳到那一句
    const r = $('.hf-tl .bar').getBoundingClientRect(), i = Math.max(0, starts.findLastIndex(x => x <= (e.clientX - r.left) / r.width * total));
    if (playing) { halt(); start(i); } else { at = i; showLine(i); setCursor(starts[i]); }
  });
  foot('继续', next, { arrow: true, off: !flags.heard });
};
