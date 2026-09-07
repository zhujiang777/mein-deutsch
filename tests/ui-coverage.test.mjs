import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const exercises = readFileSync(new URL('../js/exercises.js', import.meta.url), 'utf8');
const chipBoard = readFileSync(new URL('../js/chip-board.js', import.meta.url), 'utf8');
const readlisten = readFileSync(new URL('../js/views/readlisten.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const speech = readFileSync(new URL('../js/speech.js', import.meta.url), 'utf8');
const lessonView = readFileSync(new URL('../js/views/lesson.js', import.meta.url), 'utf8');
const lessonShell = readFileSync(new URL('../js/lesson-shell.js', import.meta.url), 'utf8');
const listeningPlayer = readFileSync(new URL('../js/listening-player.js', import.meta.url), 'utf8');

test('critical deep-page components retain explicit style coverage', () => {
  const selectors = [
    '.lesson-shell', '.lesson-top', '.lesson-progress', '.lesson-bottom', '.feedback',
    '.ex-options', '.ex-line', '.ex-match', '.dict-input', '.scene-bubble',
    '.gram-table', '.reading-text', '.rt-zh', '.settings-row', '.secret-label',
    '.word-detail-page', '.wc-form-grid', '.wc-form-extra', '.wc-phrase', '.wc-mnemonic',
    '.speak-practice', '.pa-summary', '.gloss-pop', '.wordbook-row',
    '.listen-bar', '.lb-controls', '.lb-track', '.lb-sent', '.lb-dot',
  ];
  selectors.forEach(selector => assert.ok(css.includes(selector), `missing CSS selector ${selector}`));
});

test('liquid glass stays on functional layers with accessible fallbacks', () => {
  assert.match(css, /--glass-bg:/);
  assert.match(css, /backdrop-filter:/);
  assert.match(css, /prefers-reduced-transparency/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@supports not \(\(-webkit-backdrop-filter/);
  assert.match(css, /--glass-blur: 32px/);
  assert.match(css, /body::before, body::after/);
  // 三栏导航（今天/全景/仓库）：滑块只到 2，宽度是 1/3
  assert.match(css, /#tabbar\[data-active="1"\]::before/);
  // 两栏导航：全景已从 tab 降级成今天页横幅，第三格的位移规则必须一起删掉。
  assert.doesNotMatch(css, /#tabbar\[data-active="[234]"\]/);
  assert.match(css, /width: calc\(\(100% - 16px\) \/ 2\)/);
});

test('read and listen render as separate accessible panels', () => {
  assert.match(readlisten, /role="tablist"/);
  assert.match(readlisten, /renderReadingPanel/);
  assert.match(readlisten, /renderListeningPanel/);
  assert.match(readlisten, /默认|阅读|听力/);
});

test('bilingual font and transform progress tokens are present', () => {
  const plain = readFileSync(new URL('../css/plain.css', import.meta.url), 'utf8');
  assert.match(plain, /system-ui/);
  assert.doesNotMatch(index, /fonts.googleapis.com/);
  assert.match(css, /--font-zh:/);
  assert.match(css, /--progress-fill:/);
  assert.match(css, /transform: scaleX\(0\)/);
});

test('assemble exercises provide pointer drag and keyboard reorder', () => {
  assert.match(exercises, /setupChipBoard/);
  assert.match(chipBoard, /pointermove/);
  assert.match(chipBoard, /ArrowLeft/);
  assert.match(chipBoard, /pointercancel/);
});

test('vocabulary detail has a stable deep-link route', () => {
  assert.match(app, /\/vocab\\\/word\\\/\(\.\+\)/);
});

test('main navigation keeps three rendered views and avoids mobile GPU-heavy effects', () => {
  assert.doesNotMatch(app, /setTimeout\([\s\S]{0,180}120\)/);
  assert.match(app, /const rootViews = new Map\(\)/);
  assert.match(app, /rootViews\.get\(path\)/);
  assert.match(app, /view\.hidden = false/);
  assert.match(app, /app\.classList\.remove\('route-loading'\)/);
  assert.doesNotMatch(app, /requestIdleCallback[\s\S]{0,120}loadDictionary/);
  assert.match(css, /max-width:\s*700px\)\s*and\s*\(pointer:\s*coarse/);
  assert.match(css, /--glass-blur:\s*0px/);
  assert.match(css, /backdrop-filter:\s*none/);
  // 不用 content-visibility：懒渲染的高度估算会在切到旅程页时让长列表下坠回流。
  assert.doesNotMatch(css, /content-visibility:\s*auto/);
  // 底部导航切换恢复方向横滑淡入（含触屏），不再对 coarse 指针禁用。
  assert.match(app, /routeMotion\(view/);
});

test('slow-playback label is derived from the rate constant, never hardcoded', () => {
  // 曾经按钮写死 "0.8×" 而 speech.js 实际用 0.65，标签与实际各自漂移。
  assert.match(ui, /\$\{SLOW_RATE\}×/);
  assert.doesNotMatch(ui, /['"`]0\.\d+×/);
  assert.doesNotMatch(speech, /playbackRate = slow \? 0\./);
  assert.match(speech, /playbackRate = slow \? SLOW_RATE/);
  // 常量取自 audio-timing.js（新文件），避免新 ui.js 撞上浏览器缓存里的旧 speech.js。
  assert.match(ui, /import \{ SLOW_RATE \} from '\.\/audio-timing\.js'/);
});

test('every exercises.js import agrees on one version so only one module instance exists', () => {
  const sources = { lessonShell, today: readFileSync(new URL('../js/views/today.js', import.meta.url), 'utf8'), vocab: readFileSync(new URL('../js/views/vocab.js', import.meta.url), 'utf8') };
  const versions = new Set();
  for (const [name, src] of Object.entries(sources)) {
    const hit = src.match(/exercises\.js\?v=(\d+)/);
    assert.ok(hit, `${name} should import exercises.js with an explicit version`);
    versions.add(hit[1]);
  }
  assert.equal(versions.size, 1, `exercises.js imported at mismatched versions: ${[...versions].join(', ')}`);
});

test('lesson shell is reusable: takes a lesson object and lets callers own mistake routing', () => {
  // 精听要复用这套外壳（进度条/答错重排队/断点续学/结算），不能再抄第四份循环。
  assert.match(lessonShell, /export function runLessonShell\(host, lesson,/);
  assert.doesNotMatch(lessonShell, /^import .*course\.js/m, 'shell must not drag 500KB of course data into unrelated routes');
  assert.match(lessonShell, /\(lesson\.onMistake \|\| addMistake\)/);
  assert.match(lessonShell, /'listenFull', 'listenReview'/);
  // 路由层继续接受课程 id，现有调用点零改动。
  assert.match(lessonView, /findLesson\(lessonOrId\)/);
  assert.match(lessonView, /runLessonShell\(host, lesson, opts\)/);
});

test('listening player never leaves a frame loop running', () => {
  assert.match(listeningPlayer, /cancelAnimationFrame/);
  assert.match(listeningPlayer, /if \(playing\) startWatch\(\); else stopWatch\(\);/);
  // iOS：loadedmetadata 之前写 currentTime 会被静默忽略。
  assert.match(listeningPlayer, /readyState < 1/);
  // stopSpeak() 只清 .onended，控制器必须用 addEventListener。
  assert.doesNotMatch(listeningPlayer, /\.onended\s*=/);
});

test('视图模块用到的 ui.js 帮手都 import 了', () => {
  // js/views/grammar.js 用 icon() 却没 import，列表页每次渲染直接抛 ReferenceError，
  // 而且静态检查和单测都发现不了——这类漏 import 必须由测试兜住。
  const helpers = ['el', 'esc', 'icon', 'guideBear', 'haptic', 'motionIn', 'setProgress',
    'rewardBurst', 'toast', 'audioBtn', 'speakPractice', 'micBtn', 'phraseRow',
    'videoCard', 'renderQuiz'];
  const files = [
    ...readdirSync(new URL('../js/views/', import.meta.url)).map(name => `js/views/${name}`),
    ...readdirSync(new URL('../js/', import.meta.url))
      .filter(name => name.endsWith('.js')).map(name => `js/${name}`),
  ];
  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const imported = new Set([
      // 静态 import { … } from './ui.js'
      ...[...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*ui\.js(?:\?v=\d+)?['"]/g)],
      // 动态 import('./ui.js').then(({ … }) => …)（speech.js 用这种，避免循环依赖）
      ...[...source.matchAll(/import\(['"][^'"]*ui\.js(?:\?v=\d+)?['"]\)\.then\(\(\{([^}]*)\}/g)],
    ].flatMap(hit => hit[1].split(',').map(name => name.trim().split(/\s+as\s+/).pop())));
    for (const helper of helpers) {
      if (!new RegExp(`\\b${helper}\\(`).test(source)) continue;
      if (imported.has(helper)) continue;
      if (new RegExp(`(function|const|let)\\s+${helper}\\b`).test(source)) continue;
      assert.fail(`${file} 调用了 ${helper}() 但没有从 ui.js import`);
    }
  }
});

test('语法联动的样式有覆盖', () => {
  for (const selector of ['.chip-row', '.chip {', '.chip.is-weak', '.grammar-links']) {
    assert.ok(css.includes(selector), `缺少样式 ${selector}`);
  }
});

test('四栏导航与资料路由高亮自洽', () => {
 const indexed = new Set([...app.match(/const tabIndexes = \{([^}]*)\}/)[1].matchAll(/([a-z]+):/g)].map(hit=>hit[1]));
 const inBar = new Set([...index.matchAll(/data-tab="([a-z]+)"/g)].map(hit=>hit[1]));
 assert.deepEqual([...inBar].sort(), ['me','readlisten','today','vocab']);
 for(const hit of app.matchAll(/tab:\s*'([a-z]+)'/g)) assert(indexed.has(hit[1]),hit[1]);
 assert(app.includes("{library:'me',panorama:'me'}"));
 assert(app.includes('renderPilotLesson'));assert(app.includes('renderWordStudy'));assert(app.includes('pronunciationPaused'));
});

test('同一个模块在所有引用点的版本号必须一致', () => {
  // 版本号不一致 = 浏览器里同时存在两份模块实例，各自持有独立的模块级状态
  // （vocab.js 的 SRS 队列、listening.js 的播放器）。曾经只守着 exercises.js，
  // 但这个坑对任何带 ?v= 的模块都成立，所以改成全仓扫描。
  const files = [
    ...readdirSync(new URL('../js/views/', import.meta.url)).map(name => `js/views/${name}`),
    ...readdirSync(new URL('../js/', import.meta.url)).filter(name => name.endsWith('.js')).map(name => `js/${name}`),
    'index.html',
  ];
  const seen = new Map(); // 模块名 → Map(版本 → [引用它的文件])
  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const hit of source.matchAll(/([\w./-]+\.(?:js|css))\?v=(\d+)/g)) {
      const module = hit[1].replace(/^.*\//, '');
      if (!seen.has(module)) seen.set(module, new Map());
      const byVersion = seen.get(module);
      if (!byVersion.has(hit[2])) byVersion.set(hit[2], []);
      byVersion.get(hit[2]).push(file);
    }
  }
  for (const [module, byVersion] of seen) {
    assert.equal(byVersion.size, 1,
      `${module} 被以多个版本引用：${[...byVersion].map(([v, files]) => `v${v}(${files.join(',')})`).join(' vs ')}`);
  }
});
