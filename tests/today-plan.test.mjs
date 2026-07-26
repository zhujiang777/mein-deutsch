import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_CATALOG } from '../data/content-index.js';
import {
  PLANS, STAGE_LABELS, MIN_KNOWN_RATIO, TARGET_KNOWN_RATIO,
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

test('只有带原创音频的精听包能进主线', () => {
  const withAudio = availableMaterials({ 'li-b01': [{}], 'li-p03': [{}] });
  assert.deepEqual(withAudio.map(pack => pack.id), ['li-b01', 'li-p03']);
  // 没音频的包点进去只有"音频尚未生成"，绝不能被推成"今天这一份"。
  assert.equal(availableMaterials({}).length, 0);
});

test('零基础用户拿不到材料：听不懂的东西练不出听力', () => {
  const picked = pickMaterial({ lessonStates: {}, srs: {}, skills: {} });
  assert.equal(picked.ready, false);
  assert.match(picked.reason, /只认识 \d+% 的词/);
  // 门槛必须低于目标值，否则永远没有材料合格。
  assert.ok(MIN_KNOWN_RATIO < TARGET_KNOWN_RATIO);
});

test('未达门槛时不隐藏，而是如实说明差多少', () => {
  // 静默藏掉会让"今天没材料"看起来像功能坏了，真实原因是内容的课程词复用率不够。
  const picked = pickMaterial(progress(6));
  assert.ok(picked, '必须返回最贴合的那一份，即便它不合格');
  if (!picked.ready) {
    assert.match(picked.reason, /至少要 \d+%/);
    const { segments } = buildTodayPlan(30, {
      nextLesson: { id: 'u7l1', title: '点单' }, material: picked,
      counts: { due: 3, fresh: 5 },
    });
    assert.ok(!segments.some(segment => segment.kind === 'material'),
      '不合格的材料不能被排进当天流程');
  }
});

test('三档时长决定有哪几段', () => {
  const material = { ready: true, pack: { id: 'li-b01', title: 'Im Café' }, readiness: {} };
  const nextLesson = { id: 'u7l1', title: '点单' };
  const counts = { due: 4, fresh: 6, mistakes: ['m:a:1'], listenMisses: ['l:li-b01:2'] };

  const five = buildTodayPlan(5, { nextLesson, material, counts }).segments;
  assert.ok(!five.some(s => s.kind === 'lesson'), '5 分钟只复习，不上新课');
  assert.ok(!five.some(s => s.kind === 'material'));

  const fifteen = buildTodayPlan(15, { nextLesson, material, counts }).segments;
  assert.ok(fifteen.some(s => s.kind === 'lesson'));
  assert.ok(!fifteen.some(s => s.kind === 'material'), '15 分钟放不下一份完整材料');

  const thirty = buildTodayPlan(30, { nextLesson, material, counts }).segments;
  assert.deepEqual(thirty.map(s => s.stage), ['learn', 'use', 'remember', 'remember', 'remember']);
  assert.deepEqual(thirty.map(s => s.kind), ['lesson', 'material', 'vocab', 'mistakes', 'listen-misses']);
});

test('材料合格时，它的生词排进"记"的最前面', () => {
  const material = { ready: true, pack: { id: 'li-p01', title: 'Stimmen' }, readiness: {} };
  const vocab = buildTodayPlan(30, { material, counts: { due: 2, fresh: 4 } })
    .segments.find(segment => segment.kind === 'vocab');
  assert.ok(Array.isArray(vocab.priorityIds));
  assert.match(vocab.title, /Stimmen/, '这一段的标题要指明是哪份材料的生词');

  // 材料不合格时不能把它的生词塞进来——那些词今天根本没在语境里出现过。
  const without = buildTodayPlan(30, { material: { ...material, ready: false }, counts: { due: 2, fresh: 4 } })
    .segments.find(segment => segment.kind === 'vocab');
  assert.deepEqual(without.priorityIds, []);
});

test('全部清空时不产出任何段落', () => {
  const { segments } = buildTodayPlan(5, { nextLesson: null, material: null, counts: { due: 0, fresh: 0 } });
  assert.equal(segments.length, 0);
});

test('三档配置和三段命名齐全', () => {
  assert.deepEqual(Object.keys(PLANS), ['5', '15', '30']);
  assert.deepEqual(Object.keys(STAGE_LABELS), ['learn', 'use', 'remember']);
  assert.equal(PLANS[30].material, true);
  assert.equal(PLANS[15].material, false);
});
