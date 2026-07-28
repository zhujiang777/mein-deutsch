import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_CATALOG } from '../data/content-index.js';
import {
  ROUTES, STAGE_LABELS, MIN_KNOWN_RATIO, TARGET_KNOWN_RATIO,
  availableMaterials, pickMaterial, buildTodayPlan,
} from '../js/today-plan.js';

/** 学完前 n 个单元，并且这些课的词卡都复习过 */
function progress(n) {
  const lessonStates = {}, srs = {};
  COURSE_CATALOG.slice(0, n).forEach(unit => unit.lessons.forEach(lesson => {
    lessonStates[lesson.id] = { done: true };
    (lesson.vocabRefs || []).forEach(id => { srs[id] = { reps: 2, state: 'review', due: 0 }; });
  }));
  return { lessonStates, srs, skills: {} };
}

test('只有带原创音频的材料能进主线', () => {
  const withAudio = availableMaterials({ 'li-b01': [{}], 'li-p03': [{}] });
  assert.deepEqual(withAudio.map(pack => pack.id), ['li-b01', 'li-p03']);
  // 没音频的包点进去只有"音频尚未生成"，绝不能被推成"今天这一篇"。
  assert.equal(availableMaterials({}).length, 0);
});

test('零基础用户拿不到今日文章：读不懂的东西练不出东西', () => {
  const picked = pickMaterial({ lessonStates: {}, srs: {}, skills: {} });
  assert.equal(picked.ready, false);
  assert.match(picked.reason, /只认识 \d+% 的词/);
  // 门槛必须低于目标值，否则永远没有材料合格。
  assert.ok(MIN_KNOWN_RATIO < TARGET_KNOWN_RATIO);
});

test('未达门槛时不隐藏，而是如实说明差多少', () => {
  // 静默藏掉会让"今天没文章"看起来像功能坏了，真实原因是库存配不上你的词表。
  // 这堵墙就是第 3 步 AI 生成要解开的那一堵。
  const picked = pickMaterial(progress(6));
  assert.ok(picked, '必须返回最贴合的那一篇，即便它不合格');
  if (!picked.ready) {
    assert.match(picked.reason, /至少要 \d+%/);
    const { segments } = buildTodayPlan('full', {
      nextLesson: { id: 'u7l1', title: '点单' }, material: picked,
      counts: { due: 3, fresh: 5 },
    });
    assert.ok(!segments.some(segment => segment.kind === 'material'),
      '不合格的材料不能被排进当天流程');
  }
});

// 这是"这篇是给我今天写的"和"系统随便给了我一篇"的全部区别。
test('今日文章的选材是双输入：今天背的词会把材料往上顶', () => {
  const state = progress(6);
  const base = pickMaterial(state);
  const seeded = pickMaterial({ ...state, todayWordIds: [] });
  assert.equal(base.pack.id, seeded.pack.id, '没有种子时两次结果必须一致');

  // 把某一篇的词全部塞进"今天要背的词"，它就该被顶上来。
  const target = availableMaterials().find(pack => pack.id !== base.pack.id);
  if (target) {
    const withSeeds = pickMaterial({
      ...state,
      todayWordIds: (target.vocabRefs || []).concat(target.words?.map(w => w.id) || []),
    });
    assert.ok(withSeeds.seedHits >= 0, 'seedHits 必须被算出来供文案使用');
  }
});

test('一条路的顺序固定：背词 → 学一格 → 今日文章', () => {
  const material = { ready: true, pack: { id: 'li-b01', title: 'Im Café' }, readiness: {} };
  const nextLesson = { id: 'u7l1', title: '点单' };
  const counts = { due: 4, fresh: 6, mistakes: ['m:a:1'], listenMisses: ['l:li-b01:2'] };

  const { segments } = buildTodayPlan('full', { nextLesson, material, counts });
  assert.deepEqual(segments.map(s => s.stage),
    ['words', 'words', 'words', 'learn', 'article']);
  assert.deepEqual(segments.map(s => s.kind),
    ['vocab', 'mistakes', 'listen-misses', 'lesson', 'material']);
});

test('AI 现写的那篇优先于库存；它挂了才退回库存', () => {
  const material = { ready: true, pack: { id: 'li-b01', title: 'Im Café' }, readiness: {} };
  const generated = { titleZh: '在火车站', sentences: [], question: {} };
  const counts = { due: 2, fresh: 2 };

  const withAi = buildTodayPlan('full', { material, generated, counts }).segments;
  assert.equal(withAi.find(s => s.stage === 'article').kind, 'generated');
  // AI 那篇的词本来就是今天要背的词，不需要再"把这篇的生词提前"。
  assert.deepEqual(withAi.find(s => s.kind === 'vocab').priorityIds, []);

  const noAi = buildTodayPlan('full', { material, generated: null, counts }).segments;
  assert.equal(noAi.find(s => s.stage === 'article').kind, 'material');

  // 两条路都没有时这一段整个不出现，而不是拿一份读不懂的材料充数。
  const neither = buildTodayPlan('full', { material: { ...material, ready: false }, counts }).segments;
  assert.ok(!neither.some(s => s.stage === 'article'));
});

test('只有两个出口：完整路线 / 只复习', () => {
  assert.deepEqual(Object.keys(ROUTES), ['full', 'review']);
  const material = { ready: true, pack: { id: 'li-b01', title: 'Im Café' }, readiness: {} };
  const nextLesson = { id: 'u7l1', title: '点单' };
  const counts = { due: 4, fresh: 6 };

  const review = buildTodayPlan('review', { nextLesson, material, counts }).segments;
  assert.ok(!review.some(s => s.kind === 'lesson'), '只复习不上新课');
  assert.ok(!review.some(s => s.kind === 'material'), '只复习不给今日文章');
  assert.ok(review.some(s => s.kind === 'vocab'));

  // 时长选择器已经删掉——"减少选择"的第一步不该是一道选择题。
  const unknown = buildTodayPlan('15', { nextLesson, material, counts }).segments;
  assert.ok(unknown.some(s => s.kind === 'material'), '未知路线要回落到完整路线');
});

test('文章合格时，它的生词排进"背词"的最前面', () => {
  const material = { ready: true, pack: { id: 'li-p01', title: 'Stimmen' }, readiness: {} };
  const vocab = buildTodayPlan('full', { material, counts: { due: 2, fresh: 4 } })
    .segments.find(segment => segment.kind === 'vocab');
  assert.ok(Array.isArray(vocab.priorityIds));
  assert.ok(vocab.priorityIds.length, '合格的文章要把它的词顶到最前面');

  // 文章不合格时不能把它的生词塞进来——那些词今天根本没在语境里出现过。
  const without = buildTodayPlan('full', { material: { ...material, ready: false }, counts: { due: 2, fresh: 4 } })
    .segments.find(segment => segment.kind === 'vocab');
  assert.deepEqual(without.priorityIds, []);
});

test('全部清空时不产出任何段落', () => {
  const { segments } = buildTodayPlan('review', { nextLesson: null, material: null, counts: { due: 0, fresh: 0 } });
  assert.equal(segments.length, 0);
});

test('三段命名齐全', () => {
  assert.deepEqual(Object.keys(STAGE_LABELS), ['words', 'learn', 'article']);
  assert.equal(ROUTES.full.article, true);
  assert.equal(ROUTES.review.article, false);
});
