import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COURSE_CATALOG } from '../data/content-index.js';
import { GRAMMAR_CELLS, MAINLINE_ORDER } from '../data/panorama.js';
import { MAINLINE_CELLS, nextMainlineStep, mainlineProgress, CLEAR_FLOOR } from '../js/mainline.js';

const done = ids => Object.fromEntries(ids.map(id => [id, { done: true }]));
const strong = skills => Object.fromEntries(
  skills.map(id => [id, { s: 100, last: Date.now() }]));

test('主线 = 地图本身：拼读 6 格 + 语法 20 格，走完就是走完 A1', () => {
  assert.equal(MAINLINE_CELLS.length, 26);
  assert.equal(MAINLINE_CELLS.filter(entry => entry.kind === 'pron').length, 6);
  assert.deepEqual(MAINLINE_ORDER.slice().sort(), GRAMMAR_CELLS.map(cell => cell.id).sort(),
    'MAINLINE_ORDER 必须正好是 20 格的一个排列，多一格少一格都会让"还剩几格"说谎');
});

// 这一条是整个改动的理由：课表走法没有终点，也不知道自己走到了哪个知识点上。
test('每一格都有课可上 —— 主线不能停在一个空格子上', () => {
  const empty = MAINLINE_CELLS.filter(entry => !entry.lessons.length).map(entry => entry.cell.id);
  assert.deepEqual(empty, [], `这些格子没有任何课：${empty.join(',')}`);
});

test('一节课只属于一格，否则同一节课会让两格一起前进', () => {
  const owner = new Map();
  for (const entry of MAINLINE_CELLS) {
    for (const lesson of entry.lessons) {
      assert.ok(!owner.has(lesson.id),
        `${lesson.id} 同时属于 ${owner.get(lesson.id)} 和 ${entry.cell.id}`);
      owner.set(lesson.id, entry.cell.id);
    }
  }
  // u1l1 同时命中 A1 和 D1：它显然属于 A1，D1 的重头在 u10/u11。
  assert.equal(owner.get('u1l1'), 'A1');
  assert.equal(owner.get('u11l4'), 'D1');
  // 结业综合测验横跨 11 格，进任何一格都会让那格提前"走完"，所以谁都不属于。
  assert.equal(owner.has('u13l3'), false);
  // 场景课是应用，不教新格子，所以不占主线。
  assert.equal(owner.has('sa-l1'), false);
});

test('主线顺序不和既有课表打架：格子按各自第一节课的先后排', () => {
  const position = new Map();
  let index = 0;
  for (const unit of COURSE_CATALOG) for (const lesson of unit.lessons) position.set(lesson.id, index++);
  const firsts = MAINLINE_CELLS
    .filter(entry => entry.kind === 'lesson')
    .map(entry => position.get(entry.lessons[0].id));
  for (let i = 1; i < firsts.length; i++) {
    assert.ok(firsts[i] > firsts[i - 1],
      `第 ${i + 1} 格的第一节课排在上一格前面，主线会把人往回拽`);
  }
});

test('零基础从解码课第一关开始，不是从语法开始', () => {
  const step = nextMainlineStep({}, {});
  assert.equal(step.index, 1);
  assert.equal(step.kind, 'pron');
  assert.equal(step.lesson.id, 'v1');
  // 拼读格没有语法点可以交给今日文章，给了反而会让它写出跑题的东西。
  assert.equal(step.grammarZh, '');
});

test('交给今日文章的是真正的语法点，不是课表标题', () => {
  const step = nextMainlineStep(done(['v1', 'v2', 'v3', 'v4', 'v5', 'v6']), {});
  assert.equal(step.cell.id, 'A1');
  assert.equal(step.grammarZh, 'sein / haben');
  assert.equal(step.lesson.id, 'u1l1');
});

test('一格的课上完就往前走，且掌握度够高可以整格跳过', () => {
  const base = done(['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'u1l1', 'u1l2', 'u1l3', 'u2l2']);
  assert.equal(nextMainlineStep(base, {}).cell.id, 'A2');
  // 在别处已经练熟 A1 那一格的人，主线不该再把 u1l1 推回给他。
  const skipped = nextMainlineStep(
    done(['v1', 'v2', 'v3', 'v4', 'v5', 'v6']),
    strong(GRAMMAR_CELLS.find(cell => cell.id === 'A1').skills));
  assert.equal(skipped.cell.id, 'A2');
  assert.ok(CLEAR_FLOOR <= 100);
});

test('走完 26 格后返回 null，而不是永远卡在最后一格', () => {
  const all = done(MAINLINE_CELLS.flatMap(entry => entry.lessons.map(lesson => lesson.id)));
  assert.equal(nextMainlineStep(all, {}), null);
  assert.deepEqual(mainlineProgress(all, {}), { step: null, total: 26, done: 26 });
  assert.equal(mainlineProgress({}, {}).done, 0);
});

test('今天页和横幅都走主线，不再各算各的', () => {
  const today = readFileSync(new URL('../js/views/today.js', import.meta.url), 'utf8');
  const banner = readFileSync(new URL('../js/panorama-banner.js', import.meta.url), 'utf8');
  assert.match(today, /nextMainlineStep/);
  assert.doesNotMatch(today, /nextCatalogLesson/, '课表走法必须彻底换掉，不能两套并存');
  // 拼读格跑的是解码课，没有这个分支主线会在第 1 格直接卡死。
  assert.match(today, /seg\.kind === 'pron'/);
  assert.match(today, /findPronLesson/);
  assert.match(banner, /mainlineProgress/);
});
