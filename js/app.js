import { renderStudy, renderWords, renderWordStudy, renderReadingShelf, renderMaterial, renderPilotLesson, renderReview, renderCoverage, renderProfile, renderPilotWord, disposePilotView, pronunciationPaused } from './views/integrated.js?v=2';
// 四个主要入口，旧资料保留深层路由。
import { renderToday, runDictationSet } from './views/today.js?v=15';
import { renderLibrary } from './views/library.js?v=1';
import { renderPanorama } from './views/panorama.js?v=2';
import { getSettings, migrate } from './storage.js?v=4';
import { initSync } from './sync.js';
import { stopSpeak } from './speech.js?v=2';
import { el, motionIn, toast } from './ui.js?v=2';

migrate();

export function applyTheme(theme = getSettings().theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}
applyTheme();

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
// 资料页在“我的”下，综合课程独立记录推进。
const tabIndexes = { today: 0, vocab: 1, readlisten: 2, me: 3, panorama: 3, library: 3 };
const glossOptions = { sentenceSelector: '.rt-sent,.wc-sentence,.phrase-row,.ex-prompt,.step-p,p' };
const rootPaths = new Set(['/', '/vocab', '/readlisten', '/me']);
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
  if (event.target.closest('button,a,input,textarea,select,summary,[data-no-gloss]')) return;
  loadDictionary()
    .then(module => module.handleGlossClick(event, glossOptions))
    .catch(() => {});
});

const routes = [
  { pattern: /^\/?$/, tab: 'today', root: true, render: (h) => renderStudy(h) },
  { pattern: /^\/vocab$/, tab: 'vocab', root:true, render: h => renderWords(h) },
  { pattern: /^\/vocab\/study(?:\/(.+))?$/, tab: 'vocab', render: async (_m,h,hit)=>renderWordStudy(h,hit[1]||'current') },
  { pattern: /^\/readlisten(?:\/(read|listen))?$/, tab:'readlisten', render: async (_m,h,hit)=>renderReadingShelf(h,hit[1]||'read') },
  { pattern: /^\/material\/([^/]+)\/(read|listen)$/, tab:'readlisten', render: async (_m,h,hit)=>renderMaterial(h,hit[1],hit[2]) },
  { pattern: /^\/learn\/([^/]+)(\/speak)?$/, tab:'today', render: async (_m,h,hit)=>renderPilotLesson(h,hit[1],!!hit[2]) },
  { pattern: /^\/learn-review(?:\/(.+))?$/, tab:'today', render: async (_m,h,hit)=>renderReview(h,hit[1]) },
  { pattern: /^\/coverage$/, tab:'today', render: async (_m,h)=>renderCoverage(h) },
  { pattern: /^\/(?:reference\/)?panorama$/, tab:'me', render: async (_m,h)=>renderPanorama(h) },
  { pattern: /^\/(?:reference\/)?path$/, tab:'me', render: async (_m,h)=>renderLibrary(h,'path') },
  { pattern: /^\/reference\/readlisten$/, tab:'readlisten', render: async (_m,h)=>renderLibrary(h,'readlisten') },
  { pattern: /^\/lesson\/(.+)$/, tab: 'library', load: () => import('./views/lesson.js?v=10'), render: (m, h, hit) => m.renderLessonRoute(h, hit[1]) },
  { pattern: /^\/vocab\/word\/(.+)$/, tab: 'vocab', render: async (_m,h,hit)=>renderPilotWord(h,hit[1]) },
  { pattern: /^\/vocab\/(.+)$/, tab: 'vocab', load: () => import('./views/vocab.js?v=12'), render: (m, h, hit) => m.renderVocab(h, hit[1]) },
  { pattern: /^\/reading\/(.+)$/, tab: 'library', load: () => import('./views/reading.js?v=11'), render: (m, h, hit) => m.renderReading(h, hit[1]) },
  { pattern: /^\/listening\/(.+)$/, tab: 'library', load: () => import('./views/listening.js?v=2'), render: (m, h, hit) => m.renderListening(h, hit[1]) },
  { pattern: /^\/dictation$/, tab: 'library', render: async (_m, h) => {
      h.appendChild(el(`<a class="back-link" href="#/readlisten">‹ 读·听</a>`));
      await runDictationSet(h, 5, () => { location.hash = '#/readlisten'; });
    } },
  { pattern: /^\/me$/, tab:'me', root:true, render:h=>renderProfile(h) },
  { pattern: /^\/settings$/, tab: 'me', load: () => import('./views/settings.js?v=9'), render: (m, h) => m.renderSettings(h) },
  // 旧版模块（内容迁移期间保留）
  { pattern: /^\/pron(?:\/(.+))?$/, tab: 'library', load: () => import('./views/pronunciation.js?v=10'), render: (m, h, hit) => pronunciationPaused(h) },
  { pattern: /^\/grammar(?:\/(.+))?$/, tab: 'library', load: () => import('./views/grammar.js?v=10'), render: (m, h, hit) => m.renderGrammar(h, hit[1]) },
  // 题型加练与毕业模考：只从全景图题型轴进得来，首页永远看不到（首页只有一条路）。
  // mock 这条要排在通用规则前面，否则会被当成一个格子 id。
  { pattern: /^\/exam\/mock$/, tab: 'panorama', load: () => import('./views/exam-mock.js?v=1'), render: (m, h) => m.renderExamMock(h) },
  { pattern: /^\/exam\/(.+)$/, tab: 'panorama', load: () => import('./views/exam.js?v=1'), render: (m, h, hit) => m.renderExam(h, hit[1]) },
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

// 切页恢复滚动必须瞬间完成：全局 html{scroll-behavior:smooth} 会把它变成可见的
// 平滑滚动动画，从长页(读听)切到短页(我的)时表现为纵向"下抖"。临时压成 auto 再还原。
function scrollToInstant(top) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, top);
  html.style.scrollBehavior = prev;
}

// 底部导航专用过渡：纯滑动+淡入、无缩放。起始透明度较高（0.6）让整页"滑进来"看得见，
// 用匀柔的 standard 缓动（非 expo-out）避免"撞一下"，只有横向位移、绝不改变布局高度。
function routeMotion(view, direction) {
  if (document.body.classList.contains('plain-app') || !view.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const from = direction
    ? { opacity: 0.6, transform: `translate3d(${22 * direction}px,0,0)` }
    : { opacity: 0, transform: 'translate3d(0,8px,0)' };
  view.animate([from, { opacity: 1, transform: 'translate3d(0,0,0)' }], {
    duration: 320,
    easing: 'cubic-bezier(.4,0,.2,1)',
    fill: 'backwards',
  });
}

function showRootView(path, selected, hit, direction = 0) {
  transientView?.remove();
  transientView = null;
  hideRootViews();

  let view = rootViews.get(path);
  if (!view) {
    view = el(`<section class="route-view" data-route-view="${path}"></section>`);
    view.hidden = true;
    app.appendChild(view);
    selected.render(view, hit);
    rootViews.set(path, view);
  } else if (['/', '/vocab', '/me'].includes(path)) { view.replaceChildren(); selected.render(view, hit); }
  view.hidden = false;
  view.inert = false;
  scrollToInstant(rootScroll.get(path) || 0);
  // 方向横滑淡入：右移的标签从右侧滑入，左移从左侧；首帧/同 tab 走纯淡入上浮。
  routeMotion(view, direction);
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
    scrollToInstant(0);
    motionIn(transientView, { x: 8, y: 0 });
  } finally {
    if (run === routeRun) {
      app.classList.remove('route-loading');
      app.removeAttribute('aria-busy');
    }
  }
}

async function route() {
  disposePilotView();
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
  // 覆盖前先读旧标签位置，算横滑方向（右移从右来 +1，左移从左来 -1）。
  const prevIndex = Number(tabbar.dataset.active);
  const newIndex = tabIndexes[selected.tab] ?? 0;
  const direction = Number.isFinite(prevIndex) ? Math.sign(newIndex - prevIndex) : 0;
  document.body.dataset.section = selected.tab;
  tabbar.dataset.active = String(newIndex);
  document.querySelectorAll('#tabbar a').forEach(link =>
    link.classList.toggle('active', link.dataset.tab === ({library:'me',panorama:'me'}[selected.tab]||selected.tab)));

  try {
    if (selected.root) {
      // 深层学习会改变进度；回到主导航时刷新一次，主导航保留页面容器。
      if (activePath && !rootPaths.has(activePath)) clearRootViews();
      showRootView(path, selected, hit, direction);
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
