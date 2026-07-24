import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const exercises = readFileSync(new URL('../js/exercises.js', import.meta.url), 'utf8');
const chipBoard = readFileSync(new URL('../js/chip-board.js', import.meta.url), 'utf8');
const readlisten = readFileSync(new URL('../js/views/readlisten.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('critical deep-page components retain explicit style coverage', () => {
  const selectors = [
    '.lesson-shell', '.lesson-top', '.lesson-progress', '.lesson-bottom', '.feedback',
    '.ex-options', '.ex-line', '.ex-match', '.dict-input', '.scene-bubble',
    '.gram-table', '.reading-text', '.rt-zh', '.settings-row', '.secret-label',
    '.word-detail-page', '.wc-form-grid', '.wc-form-extra', '.wc-phrase', '.wc-mnemonic',
    '.speak-practice', '.pa-summary', '.gloss-pop', '.wordbook-row',
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
