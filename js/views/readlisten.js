import { READINGS } from '../../data/readings.js';
import { el, esc, icon, motionIn } from '../ui.js';
import { isDone } from '../storage.js';
import { scoreText } from '../recur.js';

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
    .map(reading => ({ reading, score: scoreText(reading.vocabRefs) }))
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

  const intensive = READINGS.filter(reading => reading.mode === 'intensiv');
  const extensive = READINGS.filter(reading => reading.mode === 'extensiv');
  host.appendChild(el(`<div class="section-label">精读 · 点词查义 + 逐句翻译</div>`));
  intensive.forEach(reading => host.appendChild(readingItem(reading)));
  host.appendChild(el(`<div class="section-label">泛读 · 先读大意，再做理解题</div>`));
  extensive.forEach(reading => host.appendChild(readingItem(reading)));
}

function renderListeningPanel(host) {
  host.appendChild(el(`<div class="section-label">声音拆解 · 从句子开始</div>`));
  host.appendChild(el(`<a class="list-item listen-primary" href="#/dictation">
    <span class="li-icon">${icon('edit')}</span>
    <div class="li-main">
      <div class="li-title">句子精听（听写）</div>
      <div class="li-sub">反复听、慢速听，再把听到的德语写下来</div>
    </div><span class="li-arrow">${icon('arrow')}</span>
  </a>`));

  host.appendChild(el(`<div class="list-item is-disabled" aria-disabled="true">
    <span class="li-icon">${icon('play')}</span>
    <div class="li-main">
      <div class="li-title">真实语料精听包</div>
      <div class="li-sub">Nicos Weg、Easy German 与 Deutschtrainer，随课程单元陆续解锁</div>
    </div>
  </div>`));

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
  return el(`<a class="list-item" href="#/reading/${reading.id}">
    <span class="li-icon">${done ? icon('check') : icon('book')}</span>
    <div class="li-main">
      <div class="li-title de">${esc(reading.title)}</div>
      <div class="li-sub">${esc(reading.titleZh)} · ${reading.level} · ${reading.sentences.length} 句</div>
    </div>
    <span class="li-arrow">${icon('arrow')}</span>
  </a>`);
}
