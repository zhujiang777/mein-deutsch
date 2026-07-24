// 应用入口 v4：五个主页面常驻缓存，深层页面按需加载
import { renderToday, runDictationSet } from './views/today.js?v=9';
import { renderPath } from './views/path.js?v=9';
import { renderVocab } from './views/vocab.js?v=9';
import { renderReadListen } from './views/readlisten.js?v=9';
import { renderMe } from './views/me.js?v=9';
import { getSettings, migrate } from './storage.js';
import { initSync } from './sync.js';
import { stopSpeak } from './speech.js';
import { el, motionIn, toast } from './ui.js';

migrate();

export function applyTheme(theme = getSettings().theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}
applyTheme();

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
const tabIndexes = { today: 0, path: 1, vocab: 2, readlisten: 3, me: 4 };
const glossOptions = { sentenceSelector: '.rt-sent,.wc-sentence,.phrase-row,.ex-prompt,.step-p,p' };
const rootPaths = new Set(['/', '/path', '/vocab', '/readlisten', '/me']);
const rootViews = new Map();
const rootScroll = new Map();
let transientView = null;
let dictModule = null;
let dictPromise = null;

function loadDictionary() {
  if (!dictPromise) {
    dictPromise = import('./dict.js?v=4').then(module => {
      dictModule = module;
      return module;
    }).catch(error => {
      dictPromise = null;
      throw error;
    });
  }
  return dictPromise;
}

// 不在启动或导航时预载词典。只有用户真的点击正文词语才加载并处理本次点击。
app.addEventListener('click', event => {
  if (event.target.closest('button,a,input,textarea,select,[data-no-gloss]')) return;
  loadDictionary()
    .then(module => module.handleGlossClick(event, glossOptions))
    .catch(() => {});
});

const routes = [
  { pattern: /^\/?$/, tab: 'today', root: true, render: (h) => renderToday(h) },
  { pattern: /^\/path$/, tab: 'path', root: true, render: (h) => renderPath(h) },
  { pattern: /^\/vocab$/, tab: 'vocab', root: true, render: (h) => renderVocab(h) },
  { pattern: /^\/readlisten$/, tab: 'readlisten', root: true, render: (h) => renderReadListen(h) },
  { pattern: /^\/me$/, tab: 'me', root: true, render: (h) => renderMe(h) },
  { pattern: /^\/lesson\/(.+)$/, tab: 'path', load: () => import('./views/lesson.js?v=9'), render: (m, h, hit) => m.renderLessonRoute(h, hit[1]) },
  { pattern: /^\/vocab\/word\/(.+)$/, tab: 'vocab', load: () => import('./views/vocab.js?v=9'), render: (m, h, hit) => m.renderVocab(h, `word-${hit[1]}`) },
  { pattern: /^\/vocab\/(.+)$/, tab: 'vocab', load: () => import('./views/vocab.js?v=9'), render: (m, h, hit) => m.renderVocab(h, hit[1]) },
  { pattern: /^\/reading\/(.+)$/, tab: 'readlisten', load: () => import('./views/reading.js?v=9'), render: (m, h, hit) => m.renderReading(h, hit[1]) },
  { pattern: /^\/dictation$/, tab: 'readlisten', render: async (_m, h) => {
      h.appendChild(el(`<a class="back-link" href="#/readlisten">‹ 读·听</a>`));
      await runDictationSet(h, 5, () => { location.hash = '#/readlisten'; });
    } },
  { pattern: /^\/settings$/, tab: 'me', load: () => import('./views/settings.js?v=9'), render: (m, h) => m.renderSettings(h) },
  // 旧版模块（内容迁移期间保留）
  { pattern: /^\/pron(?:\/(.+))?$/, tab: 'path', load: () => import('./views/pronunciation.js?v=9'), render: (m, h, hit) => m.renderPron(h, hit[1]) },
  { pattern: /^\/grammar(?:\/(.+))?$/, tab: 'path', load: () => import('./views/grammar.js?v=9'), render: (m, h, hit) => m.renderGrammar(h, hit[1]) },
];

let activePath = '';
let routeRun = 0;

function hideRootViews() {
  rootViews.forEach(view => {
    view.hidden = true;
    view.inert = true;
  });
}

function clearRootViews() {
  rootViews.forEach(view => view.remove());
  rootViews.clear();
  rootScroll.clear();
}

function showRootView(path, selected) {
  transientView?.remove();
  transientView = null;
  hideRootViews();

  let view = rootViews.get(path);
  const cached = !!view;
  if (!view) {
    view = el(`<section class="route-view" data-route-view="${path}"></section>`);
    view.hidden = true;
    app.appendChild(view);
    selected.render(view);
    rootViews.set(path, view);
  }
  view.hidden = false;
  view.inert = false;
  if (cached && !matchMedia('(pointer: coarse)').matches) {
    view.classList.remove('route-view-enter');
    requestAnimationFrame(() => view.classList.add('route-view-enter'));
  }
  window.scrollTo(0, rootScroll.get(path) || 0);
}

async function showDeepView(selected, hit, run) {
  hideRootViews();
  transientView?.remove();
  transientView = el('<section class="route-view route-view-deep"></section>');
  app.appendChild(transientView);
  app.classList.add('route-loading');
  app.setAttribute('aria-busy', 'true');
  try {
    const module = selected.load ? await selected.load() : null;
    if (run !== routeRun) return;
    await selected.render(module, transientView, hit);
    if (run !== routeRun) return;
    window.scrollTo(0, 0);
    motionIn(transientView, { x: 8, y: 0 });
  } finally {
    if (run === routeRun) {
      app.classList.remove('route-loading');
      app.removeAttribute('aria-busy');
    }
  }
}

async function route() {
  const run = ++routeRun;
  // 快速连点导航时，立即解除上一条异步深层路由留下的忙碌状态。
  app.classList.remove('route-loading');
  app.removeAttribute('aria-busy');
  stopSpeak();
  dictModule?.clearDictPop();
  document.body.classList.remove('immersive');
  const path = location.hash.replace(/^#/, '') || '/';
  const routeMatch = routes.map(routeItem => ({ routeItem, hit: path.match(routeItem.pattern) }))
    .find(item => item.hit);
  if (!routeMatch) {
    location.hash = '#/';
    return;
  }

  const { routeItem: selected, hit } = routeMatch;
  if (rootPaths.has(activePath)) rootScroll.set(activePath, window.scrollY);
  document.body.dataset.section = selected.tab;
  tabbar.dataset.active = String(tabIndexes[selected.tab] ?? 0);
  document.querySelectorAll('#tabbar a').forEach(link =>
    link.classList.toggle('active', link.dataset.tab === selected.tab));

  try {
    if (selected.root) {
      // 深层学习会改变进度；回到主导航时刷新一次，普通五栏切换始终复用 DOM。
      if (activePath && !rootPaths.has(activePath)) clearRootViews();
      showRootView(path, selected);
    } else {
      await showDeepView(selected, hit, run);
    }
    if (run === routeRun) activePath = path;
  } catch (error) {
    if (run !== routeRun) return;
    console.error(error);
    transientView?.remove();
    transientView = el('<section class="route-view"><div class="empty-hint">页面加载失败，请检查网络后重试。</div></section>');
    app.appendChild(transientView);
  }
}

window.addEventListener('hashchange', route);
route();

// 同步拉取会改变所有统计和解锁状态，因此丢弃主页面缓存后重绘当前页。
initSync({
  onPulled: () => {
    toast('已从云端同步最新进度 ☁️');
    clearRootViews();
    activePath = '';
    route();
  },
});
