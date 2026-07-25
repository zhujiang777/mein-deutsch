import { READINGS } from '../../data/readings.js';
import { LISTENING_PACKS } from '../../data/listening.js';
import { el, esc, icon, motionIn } from '../ui.js';
import { getLessonState, isDone } from '../storage.js';
import { scoreText } from '../recur.js';
import { getContentReadiness } from '../content-readiness.js';
import { contentVocabRefs } from '../../data/content-index.js';

const PANELS = [
  { id: 'read', label: '阅读', icon: 'book' },
  { id: 'listen', label: '听力', icon: 'speaker' },
];

export function renderReadListen(host) {
  host.appendChild(el(`<header class="page-head readlisten-head">
    <span class="eyebrow">LESEN & HÖREN · 可理解输入</span>
    <h1 class="page-title">读 · 听</h1>
    <p class="page-sub">阅读负责看懂语境，听力负责把声音切成词。一次只练一种能力。</p>
  </header>`));

  const seg = el(`<div class="track-seg media-seg" role="tablist" aria-label="选择阅读或听力"></div>`);
  const pane = el(`<section class="media-pane" aria-live="polite"></section>`);
  let active = 'read';
  seg.dataset.index = '0';

  PANELS.forEach((panel, index) => {
    const button = el(`<button class="track-tab${index === 0 ? ' active' : ''}" role="tab"
      aria-selected="${index === 0}" aria-controls="media-panel">${icon(panel.icon)}<span>${panel.label}</span></button>`);
    button.addEventListener('click', () => {
      if (active === panel.id) return;
      const direction = index > PANELS.findIndex(item => item.id === active) ? 1 : -1;
      active = panel.id;
      seg.dataset.index = String(index);
      [...seg.children].forEach((child, childIndex) => {
        const selected = childIndex === index;
        child.classList.toggle('active', selected);
        child.setAttribute('aria-selected', String(selected));
      });
      renderPanel(direction);
    });
    seg.appendChild(button);
  });

  host.appendChild(seg);
  host.appendChild(pane);

  function renderPanel(direction = 1) {
    pane.innerHTML = '';
    pane.id = 'media-panel';
    pane.setAttribute('role', 'tabpanel');
    if (active === 'read') renderReadingPanel(pane);
    else renderListeningPanel(pane);
    motionIn(pane, { x: 12 * direction, y: 0 });
  }

  renderPanel();
}

function renderReadingPanel(host) {
  const scored = READINGS
    .map(reading => ({ reading, score: scoreText(contentVocabRefs(reading)) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length) {
    host.appendChild(el(`<div class="section-label">为你推荐 · 复现最近学的词</div>`));
    scored.forEach(({ reading, score }) => {
      const done = isDone('reading', reading.id);
      host.appendChild(el(`<a class="list-item" href="#/reading/${reading.id}">
        <span class="li-icon">${done ? icon('check') : icon('star')}</span>
        <div class="li-main">
          <div class="li-title de">${esc(reading.title)}</div>
          <div class="li-sub">${esc(reading.titleZh)} · <span class="recur-tag">复现你最近学的 ${score} 个词</span></div>
        </div>
        <span class="li-arrow">${icon('arrow')}</span>
      </a>`));
    });
  }

  const pilots = READINGS.filter(reading => reading.pilot);
  const intensive = READINGS.filter(reading => reading.mode === 'intensiv' && !reading.pilot);
  const extensive = READINGS.filter(reading => reading.mode === 'extensiv');
  host.appendChild(el(`<div class="section-label">A1 精读试点 · 6/24</div>`));
  pilots.forEach(reading => host.appendChild(readingItem(reading)));
  host.appendChild(el(`<div class="section-label">现有精读 · 点词查义 + 逐句翻译</div>`));
  intensive.forEach(reading => host.appendChild(readingItem(reading)));
  host.appendChild(el(`<div class="section-label">泛读 · 先读大意，再做理解题</div>`));
  extensive.forEach(reading => host.appendChild(readingItem(reading)));
}

function renderListeningPanel(host) {
  // 精听包过去没有 vocabRefs，对推荐引擎完全隐形；自动标注后才进得了这个排序。
  const recommended = LISTENING_PACKS
    .map(pack => ({ pack, score: scoreText(contentVocabRefs(pack)) }))
    .filter(item => item.score > 0 && item.pack.audioStatus !== 'pending-tts')
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  if (recommended.length) {
    host.appendChild(el(`<div class="section-label">为你推荐 · 用耳朵复现最近学的词</div>`));
    recommended.forEach(({ pack, score }) => {
      host.appendChild(el(`<a class="list-item" href="#/listening/${pack.id}">
        <span class="li-icon">${icon('star')}</span>
        <div class="li-main">
          <div class="li-title de">${esc(pack.title)}</div>
          <div class="li-sub">${esc(pack.titleZh)} · <span class="recur-tag">复现你最近学的 ${score} 个词</span></div>
        </div>
        <span class="li-arrow">${icon('arrow')}</span>
      </a>`));
    });
  }

  const pilots = LISTENING_PACKS.filter(pack => pack.pilot);
  host.appendChild(el(`<div class="section-label">A1 精听试点 · 6/24 · 五阶段训练</div>`));
  pilots.forEach(pack => {
    const readiness = getContentReadiness(pack);
    const done = !!getLessonState(pack.id)?.done;
    // 原创 TTS 未生成前不可进入：进去也只有空壳，不如在列表上说清楚。
    const pending = pack.audioStatus && pack.audioStatus !== 'ready';
    const body = `<span class="li-icon">${done ? icon('check') : icon('play')}</span>
      <div class="li-main">
        <div class="li-title de">${esc(pack.title)}</div>
        <div class="li-sub">${esc(pack.titleZh)} · <span class="stage-chip">${esc(pack.skillStage)}</span>
          ${pending ? '<span class="pill">音频生成中</span>' : `<span class="readiness-chip ${readiness.key}">${readiness.label}</span>`}</div>
      </div>`;
    host.appendChild(el(pending
      ? `<div class="list-item is-disabled" aria-disabled="true">${body}</div>`
      : `<a class="list-item" href="#/listening/${pack.id}">${body}<span class="li-arrow">${icon('arrow')}</span></a>`));
  });

  host.appendChild(el(`<div class="section-label">句子听写 · 快速巩固</div>`));
  host.appendChild(el(`<a class="list-item listen-primary" href="#/dictation">
    <span class="li-icon">${icon('edit')}</span>
    <div class="li-main">
      <div class="li-title">句子精听（听写）</div>
      <div class="li-sub">反复听、慢速听，再把听到的德语写下来</div>
    </div><span class="li-arrow">${icon('arrow')}</span>
  </a>`));

  host.appendChild(el(`<div class="section-label">泛听 · 每天五分钟熟悉语调</div>`));
  host.appendChild(el(`<div class="card listening-resources">
    <p class="meta">A1 阶段不要求每句都听懂。先熟悉节奏、重音和常见声音组合。</p>
    <div class="ext-links">
      <a href="https://www.dw.com/de/deutsch-lernen/nachrichten/s-8030" target="_blank" rel="noopener">DW 慢速新闻 <span>Langsam gesprochene Nachrichten</span></a>
      <a href="https://slowgerman.com" target="_blank" rel="noopener">Slow German <span>慢速德语生活播客</span></a>
      <a href="https://www.youtube.com/@EasyGerman" target="_blank" rel="noopener">Easy German <span>真实街头德语与双语字幕</span></a>
    </div>
  </div>`));
}

function readingItem(reading) {
  const done = isDone('reading', reading.id);
  const readiness = reading.skillStage ? getContentReadiness(reading) : null;
  return el(`<a class="list-item" href="#/reading/${reading.id}">
    <span class="li-icon">${done ? icon('check') : icon('book')}</span>
    <div class="li-main">
      <div class="li-title de">${esc(reading.title)}</div>
      <div class="li-sub">${esc(reading.titleZh)} · ${reading.level} · ${reading.sentences.length} 句
        ${reading.skillStage ? ` · <span class="stage-chip">${esc(reading.skillStage)}</span> <span class="readiness-chip ${readiness.key}">${readiness.label}</span>` : ''}</div>
    </div>
    <span class="li-arrow">${icon('arrow')}</span>
  </a>`);
}
