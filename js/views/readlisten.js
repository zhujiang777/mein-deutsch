// 读·听：阅读（分级课文）+ 听力（三层阶梯）
import { READINGS } from '../../data/readings.js';
import { el, esc } from '../ui.js';
import { isDone } from '../storage.js';

export function renderReadListen(host) {
  host.appendChild(el(`<h1 class="page-title">📖 读 · 听</h1>`));
  host.appendChild(el(`<p class="page-sub">可理解输入是语言习得的核心。精读弄懂每句，泛读泛听只求大意。</p>`));

  /* ---- 听力三层 ---- */
  host.appendChild(el(`<div class="section-label">🎧 听力训练</div>`));

  const dictCard = el(`<a class="list-item" href="#/dictation">
    <span class="li-icon">✍️</span>
    <div class="li-main">
      <div class="li-title">句子精听（听写）</div>
      <div class="li-sub">听音频拼句子 · 可无限重听/慢速 · 练"把声音切成词"</div>
    </div><span class="li-arrow">›</span>
  </a>`);
  host.appendChild(dictCard);

  host.appendChild(el(`<div class="list-item" style="opacity:.65">
    <span class="li-icon">🎬</span>
    <div class="li-main">
      <div class="li-title">真实语料精听包</div>
      <div class="li-sub">Nicos Weg 剧集 / Easy German / Deutschtrainer · 制作中，随课程单元陆续解锁</div>
    </div>
  </div>`));

  const extCard = el(`<div class="card">
    <h3>🛋️ 泛听磨耳朵（第三层）</h3>
    <p class="meta" style="margin-bottom:10px">真实德语资源。A1 阶段目标是每天 5 分钟熟悉语音语调，<b>不求听懂</b>——这不是学习失败，是正常过程。</p>
    <div class="ext-links">
      <a href="https://www.dw.com/de/deutsch-lernen/nachrichten/s-8030" target="_blank" rel="noopener">📻 DW 慢速新闻 Langsam gesprochene Nachrichten — 每日真新闻慢速朗读，学德语者的经典 ›</a>
      <a href="https://slowgerman.com" target="_blank" rel="noopener">🎙️ Slow German 播客 — 慢速德语讲生活话题 ›</a>
      <a href="https://www.youtube.com/@EasyGerman" target="_blank" rel="noopener">📺 Easy German 频道 — 街头真实德语，双语字幕 ›</a>
    </div>
  </div>`);
  host.appendChild(extCard);

  /* ---- 阅读 ---- */
  const intensive = READINGS.filter(r => r.mode === 'intensiv');
  const extensive = READINGS.filter(r => r.mode === 'extensiv');
  host.appendChild(el(`<div class="section-label">🔍 精读 · 点词查义 + 逐句翻译</div>`));
  intensive.forEach(r => host.appendChild(item(r)));
  host.appendChild(el(`<div class="section-label">🛋️ 泛读 · 读大意做理解题</div>`));
  extensive.forEach(r => host.appendChild(item(r)));

  function item(r) {
    const done = isDone('reading', r.id);
    return el(`<a class="list-item" href="#/reading/${r.id}">
      <span class="li-icon">${done ? '✅' : r.mode === 'intensiv' ? '🔍' : '🛋️'}</span>
      <div class="li-main">
        <div class="li-title de">${esc(r.title)}</div>
        <div class="li-sub">${esc(r.titleZh)} · ${r.level} · ${r.sentences.length} 句</div>
      </div>
      <span class="li-arrow">›</span>
    </a>`);
  }
}
