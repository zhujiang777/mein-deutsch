// 词汇 v2："不背单词"式沉浸学习：全屏词卡（例句为主角）→ 回想式检验
import { VOCAB, THEMES } from '../../data/vocab.js';
import { AUDIO_MANIFEST } from '../../data/audio-manifest.js';
import { el, esc, audioBtn, haptic, icon, micBtn, motionIn, setProgress, toast } from '../ui.js';
import { speak, stopSpeak, germanVoices } from '../speech.js';
import { buildQueue, rate, srsStats, markKnown } from '../srs.js';
import { getWordbook, removeWordEntry, logActivity, loadSrs } from '../storage.js';
import { renderExercise } from '../exercises.js?v=2';
import { conjugationRows, getVocabWord, normalizeWord } from '../word-model.js';

const wordbookIds = () => Object.keys(getWordbook());
const allIds = () => [...wordbookIds(), ...VOCAB.map(w => w.id)];
const getWord = (id) => {
  if (!id.startsWith('d:')) return getVocabWord(id);
  const word = getWordbook()[id];
  return word ? { id, de: word.lemma, ...word, theme: 'wordbook' } : null;
};

function wordHead(m, { big = true } = {}) {
  const artHtml = m.art ? `<span style="color:var(--${m.art})">${m.art}</span> ` : '';
  return `<div class="wc-word de${big ? '' : ' wc-word-small'}">${artHtml}${esc(m.de)}</div>
    ${m.pl ? `<div class="wc-pl">复数 die ${esc(m.pl)}</div>` : m.noPl ? '<div class="wc-pl wc-no-pl">只用单数</div>' : ''}
    ${!m.art && m.pos ? `<span class="wc-pos wc-head-pos">${esc(m.pos)}</span>` : ''}`;
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
  if (sub === 'wordbook') return renderWordbook(host);
  if (sub?.startsWith('word-')) return renderWordDetail(host, sub.slice(5));
  if (sub?.startsWith('theme-')) return renderTheme(host, sub.slice(6));

  const bookIds = wordbookIds();
  const stats = srsStats(allIds());
  const themeIcons = {
    gruss: 'speaker', person: 'user', zahl: 'target', familie: 'user',
    essen: 'cards', verb1: 'flame', verb2: 'flame', wohnen: 'home',
    stadt: 'route', arbeit: 'book', koerper: 'target', wetter: 'star',
    adj: 'star', frage: 'book'
  };

  host.appendChild(el(`<h1 class="page-title">词汇学习</h1>`));
  host.appendChild(el(`<p class="page-sub">词源：歌德学院 Goethe-Zertifikat A1 官方考纲词表。例句为主角，在语境中自然记忆。</p>`));

  host.appendChild(el(`<div class="card">
    <div style="display:flex;gap:16px;text-align:center;margin-bottom:14px">
      <div style="flex:1"><b style="font-size:1.3rem;color:var(--red)">${stats.due}</b><div class="meta">待复习</div></div>
      <div style="flex:1"><b style="font-size:1.3rem;color:var(--blue)">${stats.fresh}</b><div class="meta">未学习</div></div>
      <div style="flex:1"><b style="font-size:1.3rem;color:var(--green)">${stats.learned}</b><div class="meta">已学习</div></div>
    </div>
    <a class="btn block" href="#/vocab/study">开始学习</a>
  </div>`));
  host.appendChild(el(`<a class="list-item" href="#/vocab/wordbook">
    <span class="li-icon">${icon('book')}</span><div class="li-main"><div class="li-title">生词本</div>
    <div class="li-sub">${bookIds.length ? `${bookIds.length} 个手动查词，优先进入学习队列` : '查词后可在这里集中复习'}</div></div><span class="li-arrow">${icon('arrow')}</span>
  </a>`));

  host.appendChild(el(`<div class="section-label">按主题浏览</div>`));
  THEMES.forEach(t => {
    const words = VOCAB.filter(w => w.theme === t.id);
    if (!words.length) return;
    host.appendChild(el(`<a class="list-item" href="#/vocab/theme-${t.id}">
      <span class="li-icon">${icon(themeIcons[t.id] || 'cards')}</span>
      <div class="li-main"><div class="li-title">${esc(t.name)}</div><div class="li-sub">${words.length} 个词</div></div>
      <span class="li-arrow">${icon('arrow')}</span>
    </a>`));
  });
}

function renderWordbook(host) {
  const entries = Object.entries(getWordbook()).sort((a, b) => b[1].addedAt - a[1].addedAt);
  host.appendChild(el(`<a class="back-link" href="#/vocab">‹ 词汇</a>`));
  host.appendChild(el('<span class="eyebrow">WORDBOOK · 自选词汇</span>'));
  host.appendChild(el('<h1 class="page-title">生词本</h1>'));
  if (!entries.length) {
    host.appendChild(el('<div class="empty-hint">还没有生词。阅读页点任意词后，选择「加入生词本」。</div>'));
    return;
  }
  const list = el('<div class="card wordbook-list"></div>');
  entries.forEach(([id, word]) => {
    const row = el(`<div class="wordbook-row"><div class="wb-main"><div class="de wb-de">${word.art ? `<span style="color:var(--${esc(word.art)})">${esc(word.art)}</span> ` : ''}${esc(word.lemma)}</div>
      <div class="wb-zh">${esc(word.zh)}</div>${word.pl ? `<div class="wc-pl">复数 die ${esc(word.pl)}</div>` : ''}</div><button class="btn small secondary">删除</button></div>`);
    row.querySelector('button').addEventListener('click', () => {
      removeWordEntry(id); row.remove();
      if (!list.children.length) { host.innerHTML = ''; renderVocab(host, 'wordbook'); }
    });
    list.appendChild(row);
  });
  host.appendChild(list);
}

function renderTheme(host, themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) { location.hash = '#/vocab'; return; }
  host.appendChild(el(`<a class="back-link" href="#/vocab">‹ 词汇</a>`));
  host.appendChild(el(`<span class="eyebrow">WORTSCHATZ · 主题词汇</span>`));
  host.appendChild(el(`<h1 class="page-title">${esc(theme.name)}</h1>`));
  const card = el(`<div class="card vocab-theme-list"></div>`);
  VOCAB.filter(w => w.theme === themeId).forEach(w => {
    const m = normalizeWord(w);
    const detailBits = [m.forms ? '含变位' : '', m.phrases.length ? `${m.phrases.length} 个搭配` : '', m.sentences.length ? `${m.sentences.length} 个例句` : ''].filter(Boolean);
    const row = el(`<div class="vocab-word-row">
      <span class="vw-audio"></span>
      <a class="vw-link" href="#/vocab/word/${esc(m.id)}">
        <span><span class="vw-de de">${m.art ? `<span style="color:var(--${m.art});font-weight:700">${m.art}</span> ` : ''}${esc(m.de)}</span>
        <span class="vw-zh">${esc(m.zh)}</span>${detailBits.length ? `<span class="vw-meta">${detailBits.join(' · ')}</span>` : ''}</span>
        <span class="li-arrow">${icon('arrow')}</span>
      </a>
    </div>`);
    row.querySelector('.vw-audio').appendChild(audioBtn(m.spoken));
    card.appendChild(row);
  });
  host.appendChild(card);
}

export function renderWordDetail(host, id) {
  const raw = getWord(id);
  if (!raw) { location.hash = '#/vocab'; return; }
  const m = normalizeWord(raw);
  const back = m.theme && m.theme !== 'wordbook' ? `#/vocab/theme-${m.theme}` : '#/vocab/wordbook';
  host.appendChild(el(`<a class="back-link" href="${back}">‹ 返回词汇</a>`));

  const article = el(`<article class="word-detail-page">
    <header class="word-detail-hero">
      <span class="eyebrow">WORTDETAIL · 完整词条</span>
      ${wordHead(m)}
      <div class="wc-senses">${m.senses.map(s => `<div class="wc-sense">${s.pos && !m.art && !m.pos ? `<span class="wc-pos">${esc(s.pos)}</span> ` : ''}${esc(s.zh)}</div>`).join('')}</div>
      <div class="wc-controls"><span class="wc-audio"></span><span class="wc-speak"></span></div>
    </header>
    <div class="word-detail-blocks"></div>
  </article>`);
  article.querySelector('.wc-audio').appendChild(audioBtn(m.spoken));
  article.querySelector('.wc-speak').appendChild(micBtn(m.spoken, article.querySelector('.wc-speak')));
  appendWordDetailBlocks(article.querySelector('.word-detail-blocks'), m);
  host.appendChild(article);
  motionIn(article, { y: 16 });
}

function appendWordDetailBlocks(host, m) {
  if (m.valence) host.appendChild(el(`<section class="word-info-block wc-valence"><div class="wc-block-title">支配关系</div><p>${esc(m.valence)}</p></section>`));

  const forms = conjugationRows(m);
  if (forms.persons.length || forms.extras.length) {
    host.appendChild(el(`<section class="word-info-block wc-forms">
      <div class="wc-block-title">动词变位</div>
      <div class="wc-form-grid">${forms.persons.map(row => `<div><span>${esc(row.label)}</span><b class="de">${esc(row.value)}</b></div>`).join('')}</div>
      <div class="wc-form-extras">${forms.extras.map(row => `<div class="wc-form-extra"><span>${esc(row.label)}</span><b class="de">${esc(row.value)}</b></div>`).join('')}</div>
    </section>`));
  }

  if (m.phrases.length) {
    const section = el(`<section class="word-info-block wc-phrases"><div class="wc-block-title">常用搭配</div><div class="wc-phrase-list"></div></section>`);
    m.phrases.forEach(p => {
      const row = el(`<div class="wc-phrase"><div><div class="de">${esc(p.de)}</div><div>${esc(p.zh)}</div></div><span></span></div>`);
      row.querySelector('span').appendChild(audioBtn(p.de));
      section.querySelector('.wc-phrase-list').appendChild(row);
    });
    host.appendChild(section);
  }

  if (m.sentences.length) {
    const section = el(`<section class="word-info-block"><div class="wc-block-title">语境例句</div><div class="wc-sentences"></div></section>`);
    const sentWrap = section.querySelector('.wc-sentences');
    m.sentences.forEach(s => sentWrap.appendChild(sentenceCard(m, s)));
    host.appendChild(section);
  }

  if (m.mnemonic) host.appendChild(el(`<aside class="wc-mnemonic"><span>${icon('star')}</span><div><b>记忆线索</b><p>${esc(m.mnemonic)}</p></div></aside>`));
}

function sentenceCard(m, sentence) {
  const node = el(`<div class="wc-sentence">
    <div class="wc-sent-de de"></div>
    <div class="wc-sent-zh">${esc(sentence.zh)}</div>
    ${sourceLink(sentence.source)}
  </div>`);
  const re = new RegExp(`(${m.de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  node.querySelector('.wc-sent-de').innerHTML = esc(sentence.de).replace(re, '<mark>$1</mark>');
  node.querySelector('.wc-sent-de').appendChild(document.createTextNode(' '));
  node.querySelector('.wc-sent-de').appendChild(audioBtn(sentence.de));
  return node;
}

/* ================= 学习会话 ================= */
function startSession(host) {
  runVocabSession(host, {
    onDone: () => { location.hash = '#/vocab'; },
    onExit: () => { location.hash = '#/vocab'; },
  });
}

export function runVocabSession(host, { onDone, onExit, maxNew, maxDue, quickForms = false } = {}) {
  const q = buildQueue(allIds());
  const fresh = q.fresh.slice(0, maxNew ?? q.fresh.length);
  const due = q.due.slice(0, maxDue ?? q.due.length);

  if (!fresh.length && !due.length) {
    host.appendChild(el(`<div class="empty-hint">🎉 词汇任务清空了！明天再来。<br><a class="btn" style="margin-top:14px" href="#/vocab">返回</a></div>`));
    return;
  }

  document.body.classList.add('immersive');
  const cleanup = () => { document.body.classList.remove('immersive'); stopSpeak(); };

  // 队列：新词卡片 → 新词首测 → 到期复习 → 新词二轮检验；答错重排队。
  const steps = [
    ...fresh.map(id => ({ kind: 'card', id })),
    ...fresh.map(id => ({ kind: 'test', id, isNew: true })),
    ...due.map(id => ({ kind: 'test', id })),
    ...fresh.map(id => ({ kind: 'test', id, second: true })),
  ];
  let pos = 0, answered = 0, okCount = 0;
  const rated = new Set(); // 每词只计一次 SRS 评分

  const shell = el(`<div class="lesson-shell">
    <div class="lesson-top">
      <button class="lesson-x" aria-label="退出词汇练习">✕</button>
      <div class="lesson-progress" role="progressbar" aria-label="词汇练习进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div></div></div>
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
    setProgress(bar, pos / steps.length);
    counter.textContent = `${Math.min(pos, steps.length)}/${steps.length}`;
    if (pos >= steps.length) return finish();
    const step = steps[pos];
    if (step.kind === 'card') showCard(step);
    else showTest(step);
  }

  /* --- 新词卡（不背单词式：例句主角 + 助记 + 标熟） --- */
  function showCard(step) {
    const m = normalizeWord(getWord(step.id));
    const card = el(`<div class="wordcard">
      <div class="wc-head" style="cursor:pointer" title="点击朗读">
        ${wordHead(m)}
      </div>
      <div class="wc-senses">${m.senses.map(s => `<div class="wc-sense" style="margin-top:12px;font-size:1.15rem;font-weight:600;color:var(--text)">${s.pos && !m.art && !m.pos ? `<span class="wc-pos">${esc(s.pos)}</span> ` : ''}${esc(s.zh)}</div>`).join('')}</div>
      <div class="wc-controls" style="display:flex;justify-content:center;gap:20px;margin:18px 0;">
        <div class="wc-audio"></div>
        <div class="wc-speak"></div>
      </div>
      <div class="word-detail-blocks"></div>
      <div class="wc-actions">
        <button class="wc-known">已经认识，标熟 ✓</button>
      </div>
    </div>`);

    // 允许点击大词直接朗读
    card.querySelector('.wc-head').addEventListener('click', () => {
      speak(m.spoken);
    });

    const audioWrap = card.querySelector('.wc-audio');
    audioWrap.appendChild(audioBtn(m.spoken));
    const speakHost = card.querySelector('.wc-speak');
    speakHost.appendChild(micBtn(m.spoken, speakHost));

    appendWordDetailBlocks(card.querySelector('.word-detail-blocks'), m);

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
    const m = normalizeWord(getWord(step.id));
    const heard = !!AUDIO_MANIFEST[m.spoken] || germanVoices().length > 0;
    const reps = loadSrs()[step.id]?.reps || 0;
    let kind = step.retry ? 'de2zh'
      : step.second ? (heard ? 'listen' : 'zh2de')
      : step.isNew ? 'de2zh'
      : (reps % 3 === 0 ? 'listen' : reps % 3 === 1 ? 'zh2de' : 'spell');
    if ((kind === 'listen' || kind === 'spell') && !heard) kind = 'zh2de';
    if ((kind === 'listen' || kind === 'spell') && quickForms) kind = 'zh2de';

    const complete = (ok) => {
      answered++;
      if (ok) { okCount++; applyRate(step.id, 'good'); }
      else { applyRate(step.id, 'again'); steps.push({ kind: 'test', id: step.id, retry: true }); }
      continueBar(ok, m);
    };

    if (kind === 'listen' || kind === 'spell') {
      const box = el(`<div class="wordcard"><div class="wc-test-label">${kind === 'listen' ? '听音辨义' : '听写（含冠词）'}</div><div class="wc-exercise"></div></div>`);
      stage.appendChild(box);
      const distractors = pickDistractors(step.id, 3).map(d => d.zh);
      const item = kind === 'listen'
        ? { type: 'listenChoice', audioText: m.spoken, options: shuffleArr([m.zh, ...distractors]), a: 0 }
        : { type: 'dictation', audioText: m.spoken, answer: m.spoken, mode: 'type' };
      if (kind === 'listen') item.a = item.options.indexOf(m.zh);
      renderExercise(box.querySelector('.wc-exercise'), item, { onSubmit: (ok) => complete(ok) });
      return;
    }

    const distractors = pickDistractors(step.id, 3);
    const options = kind === 'zh2de'
      ? shuffleArr([{ label: m.de, ok: true }, ...distractors.map(d => ({ label: d.de, ok: false }))])
      : shuffleArr([{ label: m.zh, ok: true }, ...distractors.map(d => ({ label: d.zh, ok: false }))]);

    const box = el(`<div class="wordcard">
      <div class="wc-test-label">${kind === 'zh2de' ? '看中文，想德语' : '先回想词义，再选择'}</div>
      <div class="wc-head">${kind === 'zh2de' ? `<div class="wc-word wc-word-small">${esc(m.zh)}</div>` : wordHead(m)}
        <div class="wc-audio"></div>
      </div>
      <div class="wc-options"></div>
    </div>`);
    if (kind !== 'zh2de') box.querySelector('.wc-audio').appendChild(audioBtn(m.spoken));
    const optWrap = box.querySelector('.wc-options');
    if (kind !== 'zh2de') setTimeout(() => speak(m.spoken), 300);

    let done = false;
    options.forEach(o => {
      const b = el(`<button class="wc-opt${kind === 'zh2de' ? ' de' : ''}">${esc(o.label)}</button>`);
      b.addEventListener('click', () => {
        if (done) return;
        done = true;
        [...optWrap.children].forEach(x => x.disabled = true);
        if (o.ok) {
          b.classList.add('correct');
          if (kind === 'zh2de') speak(m.spoken);
          complete(true);
        } else {
          b.classList.add('wrong');
          [...optWrap.children].find(x => x.textContent === (kind === 'zh2de' ? m.de : m.zh))?.classList.add('correct');
          complete(false);
        }
      });
      optWrap.appendChild(b);
    });
    stage.appendChild(box);

    const peek = el(`<button class="btn secondary block">想不起来，看答案</button>`);
    peek.addEventListener('click', () => {
      if (done) return;
      done = true;
      [...optWrap.children].forEach(x => {
        x.disabled = true;
        if (x.textContent === (kind === 'zh2de' ? m.de : m.zh)) x.classList.add('correct');
      });
      complete(false);
    });
    bottom.appendChild(peek);

    function continueBar(ok, m) {
      bottom.innerHTML = '';
      const fb = el(`<div class="feedback ${ok === false ? 'bad' : 'good'}">
        <div class="feedback-text">
          <b>${ok ? '✓ 正确！' : ok === false ? '✗ 记住它' : '看看答案'}</b>
          <div class="feedback-ans de">${m.spoken} — ${esc(m.zh)}</div>
          ${m.sentences[0] ? `<div class="feedback-explain de">${esc(m.sentences[0].de)}</div>` : ''}
          ${m.mnemonic ? `<div class="feedback-mnemonic">🧩 助记行：${esc(m.mnemonic)}</div>` : ''}
        </div>
        <button class="btn">继续</button>
      </div>`);
      fb.querySelector('button').addEventListener('click', () => { pos++; show(); });
      bottom.appendChild(fb);
      if (m.sentences[0]) speak(m.sentences[0].de);
    }
  }

  function finish() {
    const reward = logActivity({ items: answered, ok: okCount });
    cleanup();
    stage.innerHTML = ''; bottom.innerHTML = '';
    stage.appendChild(el(`<div class="lesson-done">
      <div class="completion-seal">${icon('cards')}</div>
      <span class="eyebrow">VOCABULARY STOP</span>
      <h2>词汇完成</h2>
      <div class="completion-stats"><div><b>${fresh.length}</b><span>新词</span></div><div><b>${due.length}</b><span>复习</span></div><div><b>+${reward.xpDelta}</b><span>XP</span></div></div>
      <p class="meta">正确率 ${answered ? Math.round(100 * okCount / answered) : 100}%${reward.goalReached ? ' · 今日目标完成' : ''}</p>
    </div>`));
    const btn = el(`<button class="btn block">继续</button>`);
    btn.addEventListener('click', () => onDone?.());
    bottom.appendChild(btn);
    motionIn(stage, { y: 18 });
    haptic('success');
  }

  show();
}

function pickDistractors(id, n) {
  const w = getWord(id);
  const poolWords = [...Object.values(getWordbook()).map(word => ({ ...word, de: word.lemma, id: `d:${word.lemma}`, theme: 'wordbook' })), ...VOCAB];
  const sameTheme = poolWords.filter(x => x.id !== id && x.theme === w.theme);
  const others = poolWords.filter(x => x.id !== id && x.theme !== w.theme);
  const pool = [...shuffleArr(sameTheme), ...shuffleArr(others)];
  const out = [];
  for (const item of pool) {
    if (item.zh !== w.zh && !out.some(x => x.zh === item.zh)) out.push(normalizeWord(item));
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
