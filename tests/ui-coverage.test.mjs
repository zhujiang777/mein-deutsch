import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
  assert.match(css, /#tabbar\[data-active="4"\]::before/);
});

test('read and listen render as separate accessible panels', () => {
  assert.match(readlisten, /role="tablist"/);
  assert.match(readlisten, /renderReadingPanel/);
  assert.match(readlisten, /renderListeningPanel/);
  assert.match(readlisten, /默认|阅读|听力/);
});

test('bilingual font and transform progress tokens are present', () => {
  assert.match(index, /Noto\+Sans\+SC/);
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

test('main navigation keeps five rendered views and avoids mobile GPU-heavy effects', () => {
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
