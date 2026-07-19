// 词汇 v2："不背单词"式沉浸学习：全屏词卡（例句为主角）→ 回想式检验
import { VOCAB, THEMES } from '../../data/vocab.js';
import { el, esc, audioBtn, toast } from '../ui.js';
import { speak, stopSpeak } from '../speech.js';
import { buildQueue, rate, srsStats, markKnown } from '../srs.js';
import { logActivity } from '../storage.js';

const byId = Object.fromEntries(VOCAB.map(w => [w.id, w]));

/* 兼容层：现有 schema → 词卡视图模型（Phase 4 换歌德词表后自然增强） */
function wordModel(w) {
  return {
    ...w,
    senses: w.senses || [{ pos: w.art ? 'n.' : '', zh: w.zh }],
    sentences: w.sentences || (w.ex ? [{ de: w.ex, zh: w.exZh || '', source: null }] : []),
    mnemonic: w.mnemonic || null,
    spoken: w.art ? `${w.art} ${w.de}` : w.de,
  };
}

function wordHead(m, { big = true } = {}) {
  const artHtml = m.art ? `<span style="color:var(--${m.art})">${m.art}</span> ` : '';
  return `<div class="wc-word de${big ? '' : ' wc-word-small'}">${artHtml}${esc(m.de)}</div>
    ${m.pl ? `<div class="wc-pl">复数 die ${esc(m.pl)}</div>` : ''}`;
}

/* 例句出处：'lesson:<id>' → 课程课；其他非空字符串 → 阅读文章；null/缺省 → 不显示 */
function sourceLink(source) {
  if (!source) return '';
  if (source.startsWith('lesson:'))
    return `<a class="wc-source" href="#/lesson/${esc(source.slice(7))}">出自课程 ›</a>`;
  return `<a class="wc-source" href="#/reading/${esc(source)}">出自课文 ›</a>`;
}

/* ================= 概览页 ================= */
export function renderVocab(host, sub) {
  if (sub === 'study') return startSession(host);
  if (sub?.startsWith('theme-')) return renderTheme(host, sub.slice(6));

  const stats = srsStats(VOCAB.map(w => w.id));
  host.appendChild(el(`<h1 class="page-title">🃏 词汇</h1>`));
  host.appendChild(el(`<p class="page-sub">词源：歌德学院 Goethe-Zertifikat A1 官方考纲词表（对齐中，当前 ${VOCAB.length} 词）。例句为主角，像"不背单词"一样在语境里记。</p>`));

  host.appendChild(el(`<div class="card">
    <div style="display:flex;gap:16px;text-align:center;margin-bottom:12px">
      <div style="flex:1"><b style="font-size:1.4rem;color:var(--red)">${stats.due}</b><div class="meta">待复习</div></div>
      <div style="flex:1"><b style="font-size:1.4rem;color:var(--blue)">${stats.fresh}</b><div class="meta">未学习</div></div>
      <div style="flex:1"><b style="font-size:1.4rem;color:var(--green)">${stats.learned}</b><div class="meta">已学习</div></div>
    </div>
    <a class="btn block" href="#/vocab/study">开始学习</a>
  </div>`));

  host.appendChild(el(`<div class="section-label">按主题浏览</div>`));
  THEMES.forEach(t => {
    const words = VOCAB.filter(w => w.theme === t.id);
    if (!words.length) return;
    host.appendChild(el(`<a class="list-item" href="#/vocab/theme-${t.id}">
      <span class="li-icon">${t.icon}</span>
      <div class="li-main"><div class="li-title">${esc(t.name)}</div><div class="li-sub">${words.length} 个词</div></div>
      <span class="li-arrow">›</span>
    </a>`));
  });
}

function renderTheme(host, themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) { location.hash = '#/vocab'; return; }
  host.appendChild(el(`<a class="back-link" href="#/vocab">‹ 词汇</a>`));
  host.appendChild(el(`<h1 class="page-title">${theme.icon} ${esc(theme.name)}</h1>`));
  const card = el(`<div class="card"></div>`);
  VOCAB.filter(w => w.theme === themeId).forEach(w => {
    const m = wordModel(w);
    const row = el(`<div class="vocab-word-row">
      <div class="vw-de de">${m.art ? `<span style="color:var(--${m.art});font-weight:700">${m.art}</span> ` : ''}${esc(m.de)}</div>
      <div class="vw-zh">${esc(m.zh)}</div>
    </div>`);
    row.prepend(audioBtn(m.spoken));
    card.appendChild(row);
  });
  host.appendChild(card);
}

/* ================= 学习会话 ================= */
function startSession(host) {
  runVocabSession(host, {
    onDone: () => { location.hash = '#/vocab'; },
    onExit: () => { location.hash = '#/vocab'; },
  });
}

export function runVocabSession(host, { onDone, onExit, maxNew, maxDue } = {}) {
  const q = buildQueue(VOCAB.map(w => w.id));
  const fresh = q.fresh.slice(0, maxNew ?? q.fresh.length);
  const due = q.due.slice(0, maxDue ?? q.due.length);

  if (!fresh.length && !due.length) {
    host.appendChild(el(`<div class="empty-hint">🎉 词汇任务清空了！明天再来。<br><a class="btn" style="margin-top:14px" href="#/vocab">返回</a></div>`));
    return;
  }

  document.body.classList.add('immersive');
  const cleanup = () => { document.body.classList.remove('immersive'); stopSpeak(); };

  // 队列：新词卡片 → 检验（新词 + 到期），答错重排队
  const steps = [
    ...fresh.map(id => ({ kind: 'card', id })),
    ...fresh.map(id => ({ kind: 'test', id, isNew: true })),
    ...due.map(id => ({ kind: 'test', id })),
  ];
  let pos = 0, answered = 0, okCount = 0;
  const rated = new Set(); // 每词只计一次 SRS 评分

  const shell = el(`<div class="lesson-shell">
    <div class="lesson-top">
      <button class="lesson-x">✕</button>
      <div class="lesson-progress"><div></div></div>
      <span class="lesson-counter"></span>
    </div>
    <div class="lesson-stage"></div>
    <div class="lesson-bottom"></div>
  </div>`);
  host.appendChild(shell);
  const stage = shell.querySelector('.lesson-stage');
  const bottom = shell.querySelector('.lesson-bottom');
  const bar = shell.querySelector('.lesson-progress > div');
  const counter = shell.querySelector('.lesson-counter');
  shell.querySelector('.lesson-x').addEventListener('click', () => { cleanup(); onExit?.(); });

  const applyRate = (id, rating) => {
    if (rated.has(id)) { if (rating === 'again') rate(id, 'again'); return; }
    rated.add(id);
    rate(id, rating);
  };

  function show() {
    stage.innerHTML = ''; bottom.innerHTML = '';
    stopSpeak();
    bar.style.width = `${Math.round(100 * pos / steps.length)}%`;
    counter.textContent = `${Math.min(pos, steps.length)}/${steps.length}`;
    if (pos >= steps.length) return finish();
    const step = steps[pos];
    if (step.kind === 'card') showCard(step);
    else showTest(step);
  }

  /* --- 新词卡（不背单词式：例句主角 + 助记 + 标熟） --- */
  function showCard(step) {
    const m = wordModel(byId[step.id]);
    const card = el(`<div class="wordcard">
      <div class="wc-head">${wordHead(m)}
        <div class="wc-audio"></div>
      </div>
      <div class="wc-senses">${m.senses.map(s => `<div class="wc-sense"><span class="wc-pos">${esc(s.pos || '')}</span> ${esc(s.zh)}</div>`).join('')}</div>
      ${m.valence ? `<div class="wc-valence">${esc(m.valence)}</div>` : ''}
      <div class="wc-sentences"></div>
      ${m.mnemonic ? `<div class="wc-mnemonic">🧩 ${esc(m.mnemonic)}</div>` : ''}
      <div class="wc-actions">
        <button class="wc-known">已经认识，标熟 ✓</button>
      </div>
    </div>`);
    const audioWrap = card.querySelector('.wc-audio');
    audioWrap.appendChild(audioBtn(m.spoken));

    const sentWrap = card.querySelector('.wc-sentences');
    m.sentences.forEach(s => {
      const sEl = el(`<div class="wc-sentence">
        <div class="wc-sent-de de"></div>
        <div class="wc-sent-zh">${esc(s.zh)}</div>
        ${sourceLink(s.source)}
      </div>`);
      // 目标词高亮
      const re = new RegExp(`(${m.de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
      sEl.querySelector('.wc-sent-de').innerHTML = esc(s.de).replace(re, '<mark>$1</mark>');
      const play = audioBtn(s.de);
      play.style.width = '28px'; play.style.height = '28px'; play.style.fontSize = '.8rem';
      sEl.querySelector('.wc-sent-de').appendChild(document.createTextNode(' '));
      sEl.querySelector('.wc-sent-de').appendChild(play);
      sentWrap.appendChild(sEl);
    });

    card.querySelector('.wc-known').addEventListener('click', () => {
      markKnown(step.id);
      rated.add(step.id);
      // 移除该词的后续检验
      for (let i = steps.length - 1; i > pos; i--)
        if (steps[i].id === step.id) steps.splice(i, 1);
      toast('已标熟，不再安排复习');
      pos++; show();
    });

    stage.appendChild(card);
    setTimeout(() => speak(m.spoken), 300);
    const btn = el(`<button class="btn block">下一词</button>`);
    btn.addEventListener('click', () => { pos++; show(); });
    bottom.appendChild(btn);
  }

  /* --- 回想式检验：先回想，再选择；想不起来看答案 --- */
  function showTest(step) {
    const m = wordModel(byId[step.id]);
    const distractors = pickDistractors(step.id, 3);
    const options = shuffleArr([{ zh: m.zh, ok: true }, ...distractors.map(d => ({ zh: d, ok: false }))]);

    const box = el(`<div class="wordcard">
      <div class="wc-head">${wordHead(m)}
        <div class="wc-audio"></div>
      </div>
      <p class="wc-recall-hint">先回想词义，再选择</p>
      <div class="wc-options"></div>
    </div>`);
    box.querySelector('.wc-audio').appendChild(audioBtn(m.spoken));
    const optWrap = box.querySelector('.wc-options');
    setTimeout(() => speak(m.spoken), 300);

    let done = false;
    options.forEach(o => {
      const b = el(`<button class="wc-opt">${esc(o.zh)}</button>`);
      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        answered++;
        [...optWrap.children].forEach(x => x.disabled = true);
        if (o.ok) {
          okCount++;
          b.classList.add('correct');
          applyRate(step.id, 'good');
          continueBar(true, m);
        } else {
          b.classList.add('wrong');
          [...optWrap.children].find(x => x.textContent === m.zh)?.classList.add('correct');
          applyRate(step.id, 'again');
          steps.push({ kind: 'test', id: step.id, retry: true }); // 本轮再考
          continueBar(false, m);
        }
      });
      optWrap.appendChild(b);
    });
    stage.appendChild(box);

    const peek = el(`<button class="btn secondary block">想不起来，看答案</button>`);
    peek.addEventListener('click', () => {
      if (done) return;
      done = true;
      answered++;
      [...optWrap.children].forEach(x => {
        x.disabled = true;
        if (x.textContent === m.zh) x.classList.add('correct');
      });
      applyRate(step.id, 'again');
      steps.push({ kind: 'test', id: step.id, retry: true });
      continueBar(null, m);
    });
    bottom.appendChild(peek);

    function continueBar(ok, m) {
      bottom.innerHTML = '';
      const fb = el(`<div class="feedback ${ok === false ? 'bad' : 'good'}">
        <div class="feedback-text">
          <b>${ok ? '✓ 正确！' : ok === false ? '✗ 记住它' : '看看答案'}</b>
          <div class="feedback-ans de">${m.spoken} — ${esc(m.zh)}</div>
          ${m.sentences[0] ? `<div class="feedback-explain de">${esc(m.sentences[0].de)}</div>` : ''}
        </div>
        <button class="btn">继续</button>
      </div>`);
      fb.querySelector('button').addEventListener('click', () => { pos++; show(); });
      bottom.appendChild(fb);
      if (m.sentences[0]) speak(m.sentences[0].de);
    }
  }

  function finish() {
    logActivity({ items: answered, ok: okCount });
    cleanup();
    stage.innerHTML = ''; bottom.innerHTML = '';
    stage.appendChild(el(`<div class="lesson-done">
      <div class="lesson-done-emoji">🃏</div>
      <h2>词汇完成</h2>
      <p class="meta">新词 ${fresh.length} · 复习 ${due.length} · 正确率 ${answered ? Math.round(100 * okCount / answered) : 100}%</p>
    </div>`));
    const btn = el(`<button class="btn block">继续</button>`);
    btn.addEventListener('click', () => onDone?.());
    bottom.appendChild(btn);
  }

  show();
}

function pickDistractors(id, n) {
  const w = byId[id];
  const sameTheme = VOCAB.filter(x => x.id !== id && x.theme === w.theme).map(x => x.zh);
  const others = VOCAB.filter(x => x.id !== id && x.theme !== w.theme).map(x => x.zh);
  const pool = [...shuffleArr(sameTheme), ...shuffleArr(others)];
  const out = [];
  for (const zh of pool) {
    if (zh !== w.zh && !out.includes(zh)) out.push(zh);
    if (out.length === n) break;
  }
  return out;
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
