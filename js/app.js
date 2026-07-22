// 应用入口 v2：hash 路由 + Gist 同步启动
import { renderToday, runDictationSet } from './views/today.js';
import { renderPath } from './views/path.js';
import { renderLessonRoute } from './views/lesson.js';
import { renderVocab } from './views/vocab.js';
import { renderReadListen } from './views/readlisten.js';
import { renderReading } from './views/reading.js';
import { renderPron } from './views/pronunciation.js';
import { renderGrammar } from './views/grammar.js';
import { renderMe } from './views/me.js';
import { renderSettings } from './views/settings.js';
import { getSettings, migrate } from './storage.js';
import { initSync } from './sync.js';
import { stopSpeak } from './speech.js';
import { el, motionIn, toast } from './ui.js';
import { clearDictPop, enableGloss } from './dict.js';

migrate();

export function applyTheme(theme = getSettings().theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}
applyTheme();

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
const tabIndexes = { today: 0, path: 1, vocab: 2, readlisten: 3, me: 4 };
enableGloss(app, { sentenceSelector: '.rt-sent,.wc-sentence,.phrase-row,.ex-prompt,.step-p,p' });

const routes = [
  { pattern: /^\/?$/, tab: 'today', render: (h) => renderToday(h) },
  { pattern: /^\/path$/, tab: 'path', render: (h) => renderPath(h) },
  { pattern: /^\/lesson\/(.+)$/, tab: 'path', render: (h, m) => renderLessonRoute(h, m[1]) },
  { pattern: /^\/vocab\/word\/(.+)$/, tab: 'vocab', render: (h, m) => renderVocab(h, `word-${m[1]}`) },
  { pattern: /^\/vocab(?:\/(.+))?$/, tab: 'vocab', render: (h, m) => renderVocab(h, m[1]) },
  { pattern: /^\/readlisten$/, tab: 'readlisten', render: (h) => renderReadListen(h) },
  { pattern: /^\/reading\/(.+)$/, tab: 'readlisten', render: (h, m) => renderReading(h, m[1]) },
  { pattern: /^\/dictation$/, tab: 'readlisten', render: (h) => {
      h.appendChild(el(`<a class="back-link" href="#/readlisten">‹ 读·听</a>`));
      runDictationSet(h, 5, () => { location.hash = '#/readlisten'; });
    } },
  { pattern: /^\/me$/, tab: 'me', render: (h) => renderMe(h) },
  { pattern: /^\/settings$/, tab: 'me', render: (h) => renderSettings(h) },
  // 旧版模块（内容迁移期间保留）
  { pattern: /^\/pron(?:\/(.+))?$/, tab: 'path', render: (h, m) => renderPron(h, m[1]) },
  { pattern: /^\/grammar(?:\/(.+))?$/, tab: 'path', render: (h, m) => renderGrammar(h, m[1]) },
];

let activePath = '';
let routeRun = 0;

function route() {
  stopSpeak();
  document.body.classList.remove('immersive');
  const path = location.hash.replace(/^#/, '') || '/';
  app.innerHTML = '';
  clearDictPop();
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) {
      document.body.dataset.section = r.tab;
      tabbar.dataset.active = String(tabIndexes[r.tab] ?? 0);
      document.querySelectorAll('#tabbar a').forEach(a =>
        a.classList.toggle('active', a.dataset.tab === r.tab));
      r.render(app, m);
      window.scrollTo(0, 0);
      const direction = path === '/' || path.split('/').length < activePath.split('/').length ? -1 : 1;
      motionIn(app, { x: 12 * direction, y: 0 });
      activePath = path;
      return;
    }
  }
  location.hash = '#/';
}

window.addEventListener('hashchange', () => {
  const run = ++routeRun;
  if (!app.children.length || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    route();
    return;
  }
  app.classList.add('route-leaving');
  setTimeout(() => {
    if (run !== routeRun) return;
    app.classList.remove('route-leaving');
    route();
  }, 120);
});
route();

// 同步：启动拉取（拉到新数据就刷新当前页）
initSync({
  onPulled: () => {
    toast('已从云端同步最新进度 ☁️');
    route();
  },
});
