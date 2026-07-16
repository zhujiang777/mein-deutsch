// 词汇模块：概览（主题列表 + 今日任务）、学习（SRS 卡片）、浏览
import { VOCAB, THEMES } from '../../data/vocab.js';
import { el, esc, audioBtn, toast } from '../ui.js';
import { speak } from '../speech.js';
import { buildQueue, rate, srsStats, RATINGS } from '../srs.js';

export function renderVocab(host, sub) {
  if (sub === 'study') return renderStudy(host);
  if (sub?.startsWith('theme-')) return renderTheme(host, sub.slice(6));

  const stats = srsStats(VOCAB.map(w => w.id));
  host.appendChild(el(`<h1 class="page-title">🃏 词汇记忆</h1>`));
  host.appendChild(el(`<p class="page-sub">间隔重复算法（类 Anki）：答"记得"的词会隔越来越久才出现，答"忘了"的词马上重来。名词请连同冠词一起记：<span style="color:var(--der);font-weight:700">der</span> / <span style="color:var(--die);font-weight:700">die</span> / <span style="color:var(--das);font-weight:700">das</span>。</p>`));

  host.appendChild(el(`<div class="card">
    <div style="display:flex;gap:16px;text-align:center;margin-bottom:12px">
      <div style="flex:1"><b style="font-size:1.4rem;color:var(--red)">${stats.due}</b><div class="meta">待复习</div></div>
      <div style="flex:1"><b style="font-size:1.4rem;color:var(--blue)">${Math.min(stats.fresh, 999)}</b><div class="meta">未学习</div></div>
      <div style="flex:1"><b style="font-size:1.4rem;color:var(--green)">${stats.learned}</b><div class="meta">已学习</div></div>
    </div>
    <a class="btn block" href="#/vocab/study">开始今日学习</a>
  </div>`));

  host.appendChild(el(`<div class="section-label">按主题浏览</div>`));
  THEMES.forEach(t => {
    const words = VOCAB.filter(w => w.theme === t.id);
    host.appendChild(el(`<a class="list-item" href="#/vocab/theme-${t.id}">
      <span class="li-icon">${t.icon}</span>
      <div class="li-main">
        <div class="li-title">${esc(t.name)}</div>
        <div class="li-sub">${words.length} 个词</div>
      </div>
      <span class="li-arrow">›</span>
    </a>`));
  });
}

/* ---- 主题词表浏览 ---- */
function renderTheme(host, themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) { location.hash = '#/vocab'; return; }
  const words = VOCAB.filter(w => w.theme === themeId);

  host.appendChild(el(`<a class="back-link" href="#/vocab">‹ 词汇</a>`));
  host.appendChild(el(`<h1 class="page-title">${theme.icon} ${esc(theme.name)}</h1>`));
  const card = el(`<div class="card"></div>`);
  words.forEach(w => {
    const row = el(`<div class="vocab-word-row">
      <div class="vw-de de">${formatWord(w)}</div>
      <div class="vw-zh">${esc(w.zh)}</div>
    </div>`);
    row.prepend(audioBtn(spokenForm(w)));
    card.appendChild(row);
  });
  host.appendChild(card);
}

function formatWord(w) {
  if (w.art) return `<span class="art-${w.art}" style="color:var(--${w.art});font-weight:700">${w.art}</span> ${esc(w.de)}`;
  return esc(w.de);
}
function spokenForm(w) {
  return w.art ? `${w.art} ${w.de}` : w.de;
}

/* ---- SRS 学习流程 ---- */
function renderStudy(host) {
  const { due, fresh } = buildQueue(VOCAB.map(w => w.id));
  const queue = [...due, ...fresh];
  const byId = Object.fromEntries(VOCAB.map(w => [w.id, w]));

  host.appendChild(el(`<a class="back-link" href="#/vocab">‹ 词汇</a>`));

  if (!queue.length) {
    host.appendChild(el(`<div class="empty-hint">🎉 今天的任务完成了！<br>没有到期的卡片。明天再来，或去<a href="#/reading">阅读</a>巩固一下。</div>`));
    return;
  }

  let pos = 0, done = 0;
  const total = queue.length;
  const header = el(`<div class="page-sub" style="margin-bottom:8px"></div>`);
  const cardHost = el(`<div></div>`);
  host.appendChild(header);
  host.appendChild(cardHost);

  function show() {
    header.textContent = `本轮进度 ${done}/${total} · 复习 ${due.length} + 新词 ${fresh.length}`;
    cardHost.innerHTML = '';
    if (pos >= queue.length) {
      cardHost.appendChild(el(`<div class="empty-hint">🎉 本轮学习完成！共 ${total} 张卡片。<br><a class="btn" style="margin-top:14px" href="#/vocab">返回词汇页</a></div>`));
      return;
    }
    const w = byId[queue[pos]];
    let revealed = false;

    const card = el(`<div class="flashcard">
      <div class="fc-word de">${formatWord(w)}</div>
      <div class="fc-back" style="display:none">
        ${w.pl ? `<div class="fc-pl">复数：die ${esc(w.pl)}</div>` : ''}
        <div class="fc-zh">${esc(w.zh)}</div>
        ${w.ex ? `<div class="fc-ex de">${esc(w.ex)}</div><div class="fc-ex-zh">${esc(w.exZh || '')}</div>` : ''}
      </div>
      <div class="fc-audio"></div>
    </div>`);
    card.querySelector('.fc-audio').appendChild(audioBtn(spokenForm(w)));
    cardHost.appendChild(card);

    const revealBtn = el(`<button class="btn block">显示答案</button>`);
    const ratings = el(`<div class="rating-row" style="display:none"></div>`);
    RATINGS.forEach(r => {
      const b = el(`<button class="rating-btn ${r.cls}">${r.label}</button>`);
      b.addEventListener('click', () => {
        const state = rate(w.id, r.key);
        // 忘了的卡片 10 分钟后到期，本轮排到队尾再考一次
        if (r.key === 'again') queue.push(w.id);
        else done++;
        pos++;
        show();
      });
      ratings.appendChild(b);
    });
    revealBtn.addEventListener('click', () => {
      if (revealed) return;
      revealed = true;
      card.querySelector('.fc-back').style.display = '';
      revealBtn.style.display = 'none';
      ratings.style.display = '';
      speak(spokenForm(w));
    });
    // 自动朗读正面
    speak(spokenForm(w));
    cardHost.appendChild(revealBtn);
    cardHost.appendChild(ratings);
  }
  show();
}
