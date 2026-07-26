import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COURSE } from '../data/course.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { GRAMMAR_LESSONS, PREREQ_TO_GRAMMAR, grammarIdsForPrereqs } from '../data/grammar.js';
import {
  GRAMMAR_EXAMPLES, GRAMMAR_SENTENCES, CONTENT_GRAMMAR,
  grammarExamples, grammarLessonRefs, grammarContentRefs,
} from '../data/grammar-index.js';
import { buildGrammarIndexSource, MAX_PER_GRAMMAR } from '../tools/grammar-index.mjs';
import { detectGrammar, grammarIdsIn } from '../tools/grammar-detect.mjs';

const COURSE_SKILLS = new Set();
for (const unit of COURSE) {
  for (const lesson of unit.lessons) {
    for (const skill of lesson.skills || []) COURSE_SKILLS.add(skill);
    for (const step of lesson.steps || []) for (const skill of step.skills || []) COURSE_SKILLS.add(skill);
  }
}

test('语法课的 skills 都是课程里真实存在的标签', () => {
  // 写错一个字（v2-word-order vs v2-order）掌握度会永远是 0 且不报错，
  // 所以这条必须由测试守住。
  for (const lesson of GRAMMAR_LESSONS) {
    assert.ok(lesson.skills.length, `${lesson.id} 没有挂任何技能标签`);
    for (const skill of lesson.skills) {
      assert.ok(COURSE_SKILLS.has(skill), `${lesson.id} 的标签 ${skill} 在 course.js 里不存在`);
    }
  }
});

test('一个技能标签只归属一课语法课', () => {
  const owner = new Map();
  for (const lesson of GRAMMAR_LESSONS) {
    for (const skill of lesson.skills) {
      assert.equal(owner.get(skill), undefined,
        `${skill} 同时挂在 ${owner.get(skill)} 和 ${lesson.id}，掌握度会被重复计入`);
      owner.set(skill, lesson.id);
    }
  }
});

test('每个语法点都有真实实例句和教到它的微步课', () => {
  for (const lesson of GRAMMAR_LESSONS) {
    const examples = grammarExamples(lesson.id);
    assert.ok(examples.length >= 2, `${lesson.id} 只有 ${examples.length} 条实例句，联动等于没有`);
    assert.ok(examples.length <= MAX_PER_GRAMMAR, `${lesson.id} 超过上限 ${MAX_PER_GRAMMAR}`);
    assert.ok(grammarLessonRefs(lesson.id).length, `${lesson.id} 没有任何微步课在教它`);
  }
});

test('实例句确实含有该语法结构，且有出处', () => {
  for (const [grammarId, refs] of Object.entries(GRAMMAR_EXAMPLES)) {
    for (const index of refs) assert.ok(GRAMMAR_SENTENCES[index], `${grammarId} 引用了越界下标 ${index}`);
    for (const example of grammarExamples(grammarId)) {
      assert.ok(example.de && example.zh, `${grammarId} 的实例句缺德文或中文`);
      assert.ok(example.source, `${grammarId} 的实例句没有出处，页面上就跳不回原文`);
      assert.ok(grammarIdsIn(example.de).includes(grammarId),
        `${grammarId} 的实例句里检测不到该结构：${example.de}`);
    }
  }
});

test('句子表跨语法点复用，没有重复存储', () => {
  const texts = GRAMMAR_SENTENCES.map(([de]) => de);
  assert.equal(new Set(texts).size, texts.length, '句子表里有重复');
});

test('所有 grammarPrereqs 标签都在映射表里登记过', () => {
  const used = new Set();
  for (const item of [...READINGS, ...LISTENING_PACKS]) {
    for (const tag of item.grammarPrereqs || []) used.add(tag);
  }
  for (const tag of used) {
    assert.ok(tag in PREREQ_TO_GRAMMAR,
      `grammarPrereqs 用了 ${tag}，但 PREREQ_TO_GRAMMAR 没登记——它会被静默忽略`);
  }
});

test('声明了 grammarPrereqs 的内容能查到需要的语法课', () => {
  const declared = [...READINGS, ...LISTENING_PACKS].filter(item => item.grammarPrereqs?.length);
  assert.ok(declared.length >= 12, '试点内容应该都带 grammarPrereqs');
  for (const item of declared) {
    const [needs, shows] = CONTENT_GRAMMAR[item.id] || [[], []];
    assert.deepEqual(needs, grammarIdsForPrereqs(item.grammarPrereqs));
    assert.ok(needs.length, `${item.id} 的 grammarPrereqs 一个也没映射到语法课`);
    assert.ok(shows.length, `${item.id} 正文里一条语法都检测不到，检测器可能坏了`);
  }
});

test('检测器不误判：句尾 zu/auf 是形容词时不算可分动词', () => {
  assert.ok(!grammarIdsIn('Ja, die Tür ist zu.').includes('g09'));
  assert.ok(!grammarIdsIn('Der Supermarkt ist heute auf.').includes('g09'));
  assert.ok(grammarIdsIn('Zuerst stehe ich um acht Uhr auf.').includes('g09'));
});

test('检测器不误判：完成时的 ist 归 g12 不归 g01', () => {
  const perfect = grammarIdsIn('Sie ist nach Berlin gefahren.');
  assert.ok(perfect.includes('g12'));
  assert.ok(!perfect.includes('g01'), 'ist … gefahren 的主角是完成时，不是 sein 变位');
  assert.ok(grammarIdsIn('Er ist müde.').includes('g01'));
});

test('检测器按典型度排序：句框完整的情态动词句权重最高', () => {
  const hits = detectGrammar('Ich kann gut schwimmen.');
  assert.equal(hits[0].id, 'g08');
  assert.ok(hits[0].weight >= 3);
});

test('生成物与当前数据一致（改了课文或映射表要重跑 gen_grammar_index）', () => {
  const onDisk = readFileSync(new URL('../data/grammar-index.js', import.meta.url), 'utf8');
  assert.equal(onDisk, buildGrammarIndexSource());
});

test('每条语法都能找到练它的内容', () => {
  for (const lesson of GRAMMAR_LESSONS) {
    assert.ok(grammarContentRefs(lesson.id).length,
      `${lesson.id} 没有任何精读精听能练到，语法课仍然是孤岛`);
  }
});
