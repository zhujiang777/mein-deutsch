// 应用入口：hash 路由 + 首页
import { renderPron } from './views/pronunciation.js';
import { renderGrammar } from './views/grammar.js';
import { renderVocab } from './views/vocab.js';
import { renderReading } from './views/reading.js';
import { renderSettings } from './views/settings.js';
import { doneCount } from './storage.js';
import { srsStats } from './srs.js';
import { PRON_LESSONS } from '../data/pronunciation.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
import { VOCAB } from '../data/vocab.js';
import { READINGS } from '../data/readings.js';
import { el } from './ui.js';
import { stopSpeak } from './speech.js';

const app = document.getElementById('app');

function renderHome(host) {
  const stats = srsStats(VOCAB.map(w => w.id));
  const pronDone = doneCount('pron');
  const gramDone = doneCount('grammar');
  const readDone = doneCount('reading');
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Guten Morgen!' : hour < 18 ? 'Guten Tag!' : 'Guten Abend!';

  host.appendChild(el(`<div class="hero">
    <h1 class="de">${greet} 👋</h1>
    <p>坚持每天一点点，德语就是这样学会的。</p>
    <div class="hero-stats">
      <div class="hero-stat"><b>${stats.due}</b><span>待复习单词</span></div>
      <div class="hero-stat"><b>${stats.learned}</b><span>已学单词</span></div>
      <div class="hero-stat"><b>${pronDone + gramDone + readDone}</b><span>已完成课程</span></div>
    </div>
  </div>`));

  if (stats.due > 0) {
    host.appendChild(el(`<a class="card" href="#/vocab/study" style="display:flex;align-items:center;gap:12px">
      <span style="font-size:1.6rem">⏰</span>
      <div style="flex:1">
        <h3>今日复习</h3>
        <div class="meta">有 ${stats.due} 个单词到期了，趁热复习效果最好</div>
      </div>
      <span class="li-arrow">›</span>
    </a>`));
  }

  host.appendChild(el(`<div class="section-label">学习模块</div>`));
  const grid = el(`<div class="module-grid"></div>`);
  const modules = [
    { href: '#/pron', icon: '🗣️', title: '发音系统课', sub: `${pronDone}/${PRON_LESSONS.length} 课完成` },
    { href: '#/grammar', icon: '📐', title: '体系化语法', sub: `${gramDone}/${GRAMMAR_LESSONS.length} 课完成` },
    { href: '#/vocab', icon: '🃏', title: '词汇记忆', sub: `已学 ${stats.learned}/${stats.total}` },
    { href: '#/reading', icon: '📖', title: '分级阅读', sub: `${readDone}/${READINGS.length} 篇读完` },
    { href: '#/settings', icon: '⚙️', title: '设置', sub: '语音·同步·数据' },
  ];
  modules.forEach(m => grid.appendChild(el(`<a class="module-card" href="${m.href}">
    <div class="m-icon">${m.icon}</div>
    <div class="m-title">${m.title}</div>
    <div class="m-sub">${m.sub}</div>
  </a>`)));
  host.appendChild(grid);

  host.appendChild(el(`<div class="card" style="margin-top:16px">
    <h3>📅 建议的学习路径</h3>
    <div class="meta" style="line-height:1.8">
      ① 先用 <a href="#/pron">发音课</a> 打好拼读基础（德语见词能读，10 课就能入门）<br>
      ② 每天 10-15 分钟 <a href="#/vocab/study">词汇卡片</a>，积累核心词汇<br>
      ③ 按顺序学 <a href="#/grammar">语法课</a>，每课做完练习<br>
      ④ 语法学到第 3 课后开始 <a href="#/reading">阅读</a>：精读逐句弄懂，泛读只求大意<br>
      ⑤ 所有德语句子都可以点 🎤 跟读，检验发音
    </div>
  </div>`));
}

const routes = [
  { pattern: /^\/?$/, tab: 'home', render: (host) => renderHome(host) },
  { pattern: /^\/pron(?:\/(.+))?$/, tab: 'pron', render: (host, m) => renderPron(host, m[1]) },
  { pattern: /^\/grammar(?:\/(.+))?$/, tab: 'grammar', render: (host, m) => renderGrammar(host, m[1]) },
  { pattern: /^\/vocab(?:\/(.+))?$/, tab: 'vocab', render: (host, m) => renderVocab(host, m[1]) },
  { pattern: /^\/reading(?:\/(.+))?$/, tab: 'reading', render: (host, m) => renderReading(host, m[1]) },
  { pattern: /^\/settings$/, tab: 'home', render: (host) => renderSettings(host) },
];

function route() {
  stopSpeak();
  const path = location.hash.replace(/^#/, '') || '/';
  app.innerHTML = '';
  document.querySelector('.gloss-pop')?.remove();
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) {
      document.querySelectorAll('#tabbar a').forEach(a =>
        a.classList.toggle('active', a.dataset.tab === r.tab));
      r.render(app, m);
      window.scrollTo(0, 0);
      return;
    }
  }
  location.hash = '#/';
}

window.addEventListener('hashchange', route);
route();
