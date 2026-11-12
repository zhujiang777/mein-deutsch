// 第 0 课的小站、隔天复习、单元总表与小测。约定和 screens.js 一样；对照原型：
// 复习卡 lab/ds-explore/round13/i-grammatik.html · 泛读/字母表/读音组/门铃 round16/l-chosen.html · 总表与小测 round15/k-chosen.html
import { STORY_LESSONS, rowSay } from '../../data/story-lessons.js';
import { RENDER, EX, esc, lower, row, wordEntry, acts, choiceUI, listenUI, hlClass } from './screens.js';
import { key, q, tick, seal, hydrate, picOf } from './art.js';
import { play, playLine, playWord, sfx } from './audio.js';
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
    hydrate(body);
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

/** 这一组练的是哪几个字母：'st / sp' → st、sp；'-er' → 词尾的 er；'ich'、'ach' → ch；中文标签（长 / 短 / 重音）不标字母。 */
function soundsOf(label) {
  if (label === 'ich' || label === 'ach') return ['ch'];
  if (/[^a-zäöüß/ -]/i.test(label)) return [];
  return label.split('/').map(t => t.trim().replace(/^-/, '')).filter(Boolean);
}
export function markSound(de, label) {
  const e = entry(de), low = lower(e.lemma), tail = label.startsWith('-');
  let at = -1, len = 0;
  for (const x of soundsOf(label)) { const i = tail ? low.lastIndexOf(x) : low.indexOf(x); if (i >= 0 && (at < 0 || i < at)) { at = i; len = x.length; } }
  const lemma = at < 0 ? esc(e.lemma) : `${esc(e.lemma.slice(0, at))}<b>${esc(e.lemma.slice(at, at + len))}</b>${esc(e.lemma.slice(at + len))}`;
  return `${e.art ? `<em class="md-art ${e.art}">${e.art}</em> ` : ''}${lemma}`;
}
function soundGroups({ step, body }) {
  const s = step.stop;
  body.innerHTML = `${head(s)}
    <div class="md-sounds hf-sounds">${s.groups.map((g, gi) => `<div class="gp"><p class="lb">${soundsOf(g.label).length ? `<span class="md-hl sound">${esc(g.label)}</span>` : `<span class="zl">${esc(g.label)}</span>`}${key('a-spk', { cls: 's', act: 'grp', aria: '听这一组', r: gi % 2 ? 3 : -4 })}</p>
      ${g.items.map(([de, zh], k) => `<button type="button" class="it" data-act="it" data-g="${gi}" data-n="${k}">${markSound(de, g.label)}<small>${esc(zh)}</small></button>`).join('')}</div>`).join('')}</div>`;
  const groups = [...body.querySelectorAll('.gp')];
  let run = 0;
  const one = async (gi, k) => {
    const el = groups[gi].querySelectorAll('.it')[k];
    body.querySelectorAll('.it.on').forEach(x => x.classList.remove('on')); el.classList.add('on');
    const ok = await playWord(s.groups[gi].items[k][0]); if (ok) el.classList.remove('on'); return ok;
  };
  acts(body, {
    it: b => { run++; one(+b.dataset.g, +b.dataset.n); },
    grp: async b => { const mine = ++run, gi = groups.indexOf(b.closest('.gp')); for (let k = 0; k < s.groups[gi].items.length; k++) { if (mine !== run || !await one(gi, k)) return; } },
  });
}

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
  (s.letters ? letterTable : s.groups ? soundGroups : doorbell)(ctx);
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
