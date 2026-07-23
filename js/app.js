// 应用入口 v3：即时 hash 路由 + 页面模块按需加载
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
let dictModule = null;
let dictPromise = null;

function loadDictionary() {
  if (!dictPromise) {
    dictPromise = import('./dict.js?v=3').then(module => {
      dictModule = module;
      module.enableGloss(app, glossOptions);
      return module;
    }).catch(error => {
      dictPromise = null;
      throw error;
    });
  }
  return dictPromise;
}

// 查词资源约 300KB：空闲时预取；用户先触碰正文时立即启动，不阻塞首页。
app.addEventListener('pointerover', () => { loadDictionary().catch(() => {}); }, { once: true, passive: true });
app.addEventListener('pointerdown', () => { loadDictionary().catch(() => {}); }, { once: true, capture: true, passive: true });
const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 1600));
idle(() => { loadDictionary().catch(() => {}); }, { timeout: 2500 });

const routes = [
  { pattern: /^\/?$/, tab: 'today', load: () => import('./views/today.js?v=8'), render: (m, h) => m.renderToday(h) },
  { pattern: /^\/path$/, tab: 'path', load: () => import('./views/path.js?v=8'), render: (m, h) => m.renderPath(h) },
  { pattern: /^\/lesson\/(.+)$/, tab: 'path', load: () => import('./views/lesson.js?v=8'), render: (m, h, hit) => m.renderLessonRoute(h, hit[1]) },
  { pattern: /^\/vocab\/word\/(.+)$/, tab: 'vocab', load: () => import('./views/vocab.js?v=8'), render: (m, h, hit) => m.renderVocab(h, `word-${hit[1]}`) },
  { pattern: /^\/vocab(?:\/(.+))?$/, tab: 'vocab', load: () => import('./views/vocab.js?v=8'), render: (m, h, hit) => m.renderVocab(h, hit[1]) },
  { pattern: /^\/readlisten$/, tab: 'readlisten', load: () => import('./views/readlisten.js?v=8'), render: (m, h) => m.renderReadListen(h) },
  { pattern: /^\/reading\/(.+)$/, tab: 'readlisten', load: () => import('./views/reading.js?v=8'), render: (m, h, hit) => m.renderReading(h, hit[1]) },
  { pattern: /^\/dictation$/, tab: 'readlisten', load: () => import('./views/today.js?v=8'), render: async (m, h) => {
      h.appendChild(el(`<a class="back-link" href="#/readlisten">‹ 读·听</a>`));
      await m.runDictationSet(h, 5, () => { location.hash = '#/readlisten'; });
    } },
  { pattern: /^\/me$/, tab: 'me', load: () => import('./views/me.js?v=8'), render: (m, h) => m.renderMe(h) },
  { pattern: /^\/settings$/, tab: 'me', load: () => import('./views/settings.js?v=8'), render: (m, h) => m.renderSettings(h) },
  // 旧版模块（内容迁移期间保留）
  { pattern: /^\/pron(?:\/(.+))?$/, tab: 'path', load: () => import('./views/pronunciation.js?v=8'), render: (m, h, hit) => m.renderPron(h, hit[1]) },
  { pattern: /^\/grammar(?:\/(.+))?$/, tab: 'path', load: () => import('./views/grammar.js?v=8'), render: (m, h, hit) => m.renderGrammar(h, hit[1]) },
];

let activePath = '';
let routeRun = 0;

async function route() {
  const run = ++routeRun;
  stopSpeak();
  document.body.classList.remove('immersive');
  const path = location.hash.replace(/^#/, '') || '/';
  const routeMatch = routes.map(route => ({ route, hit: path.match(route.pattern) })).find(item => item.hit);
  if (!routeMatch) {
    location.hash = '#/';
    return;
  }

  const { route: selected, hit } = routeMatch;
  document.body.dataset.section = selected.tab;
  tabbar.dataset.active = String(tabIndexes[selected.tab] ?? 0);
  document.querySelectorAll('#tabbar a').forEach(link =>
    link.classList.toggle('active', link.dataset.tab === selected.tab));
  dictModule?.clearDictPop();

  app.classList.add('route-loading');
  app.setAttribute('aria-busy', 'true');
  if (!app.children.length) {
    app.appendChild(el(`<div class="route-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>`));
  }

  try {
    const module = await selected.load();
    if (run !== routeRun) return;
    app.innerHTML = '';
    await selected.render(module, app, hit);
    if (run !== routeRun) return;
    window.scrollTo(0, 0);
    const direction = path === '/' || path.split('/').length < activePath.split('/').length ? -1 : 1;
    motionIn(app, { x: 10 * direction, y: 0 });
    activePath = path;
  } catch (error) {
    if (run !== routeRun) return;
    console.error(error);
    app.innerHTML = '<div class="empty-hint">页面加载失败，请检查网络后重试。</div>';
  } finally {
    if (run === routeRun) {
      app.classList.remove('route-loading');
      app.removeAttribute('aria-busy');
    }
  }
}

window.addEventListener('hashchange', route);
route();

// 同步：启动拉取（拉到新数据就刷新当前页）
initSync({
  onPulled: () => {
    toast('已从云端同步最新进度 ☁️');
    route();
  },
});
