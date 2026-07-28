import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRON_LESSONS, findPronLesson } from '../data/pronunciation.js';

import { VOCAB } from '../data/vocab.js';
import { AUDIO_MANIFEST } from '../data/audio-manifest.js';
import { PRON_CELLS } from '../data/panorama.js';

const allSteps = PRON_LESSONS.flatMap(lesson => lesson.steps);
// 不能 import exercises.js：它连带加载 ui.js → speech.js，后者顶层访问 window。
const exercisesSrc = readFileSync(new URL('../js/exercises.js', import.meta.url), 'utf8');
const EXERCISE_TYPES = JSON.parse(
  exercisesSrc.match(/export const EXERCISE_TYPES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));

test('六关，每关都是卡片流而不是文章', () => {
  assert.equal(PRON_LESSONS.length, 6);
  assert.deepEqual(PRON_LESSONS.map(lesson => lesson.id), ['v1', 'v2', 'v3', 'v4', 'v5', 'v6']);
  // 旧版 10 课 0 道练习题，唯一交互是"标记本课完成"——这是它学不下去的头号原因。
  PRON_LESSONS.forEach(lesson => {
    assert.ok(lesson.steps.length >= 6, `${lesson.id} 卡片太少（${lesson.steps.length}）`);
    const speaks = lesson.steps.filter(step => step.type === 'speak').length;
    const picks = lesson.steps.filter(step => step.type === 'listenChoice').length;
    assert.ok(speaks >= 4, `${lesson.id} 跟读卡不足：${speaks}`);
    assert.ok(picks >= 1, `${lesson.id} 缺听辨题——听不出区别就一定发不出区别`);
  });
});

// 目标 ①：见词能读。规格见 docs/decoding-course.md
test('每关必有生词挑战卡 —— 这是"见词能读"唯一诚实的验证', () => {
  PRON_LESSONS.forEach(lesson => {
    const blind = lesson.steps.filter(step => step.type === 'speak' && step.blind);
    assert.ok(blind.length >= 1,
      `${lesson.id} 缺 blind 生词挑战卡——能先听到答案的题，测不出你会不会读`);
    blind.forEach(step => {
      assert.ok(step.zh, `${step.de} 缺 zh：揭晓时要给意思`);
      assert.ok(step.ipa, `${step.de} 缺 ipa：揭晓时要给读法`);
    });
  });
});

// 目标 ②：听词能写。德语拼写高度规则，音 → 字母这个方向可以练成。
test('每关必有听写卡 —— 拼写是解码的另一半', () => {
  PRON_LESSONS.forEach(lesson => {
    const dict = lesson.steps.filter(step => step.type === 'dictation');
    assert.ok(dict.length >= 1, `${lesson.id} 缺听写卡`);
    dict.forEach(step => assert.ok(step.answer, `${lesson.id} 的听写卡缺 answer`));
  });
});

// ⚠️ 上一版最大的失败：让零基础去判断"舌位不移动，声带连续振动两拍"。
// 那考的不是耳朵，是能不能把声音翻译成发音学术语——没有人能这样判断。
test('选择题不许考发音学术语，只许考声音本身', () => {
  const JARGON = ['舌位', '声带', '摩擦', '塞擦', '闭塞', '唇齿', '软腭', '小舌', '气流', '音素'];
  allSteps.filter(step => Array.isArray(step.options)).forEach(step => {
    step.options.forEach(option => {
      const hit = JARGON.find(word => option.includes(word));
      assert.ok(!hit, `${step.q || step.audioText} 的选项里出现术语"${hit}"：${option}`);
    });
  });
});

test('每种题型都是 exercises.js 认识的，否则运行时显示"未知题型"', () => {
  allSteps.forEach(step =>
    assert.ok(EXERCISE_TYPES.includes(step.type), `未注册的题型 ${step.type}`));
});

test('跟读卡的字段齐全，且讲解只允许一行', () => {
  PRON_LESSONS.flatMap(l => l.steps).filter(step => step.type === 'speak').forEach(step => {
    assert.ok(step.de, '跟读卡缺 de');
    assert.ok(step.cue, `${step.de} 缺 cue —— 每张卡必须给一行动作提示`);
    // 硬约束：成段讲解去课末规则表，主路径上的讲解不许超过一行。
    assert.ok(step.cue.length <= 46, `${step.de} 的 cue 太长（${step.cue.length} 字）：${step.cue}`);
  });
});

test('听辨题的正确答案下标有效', () => {
  allSteps.filter(step => step.type === 'listenChoice' || step.type === 'observe').forEach(step => {
    assert.ok(Array.isArray(step.options) && step.options.length >= 2, `${step.type} 选项不足`);
    assert.ok(Number.isInteger(step.a) && step.a >= 0 && step.a < step.options.length,
      `${step.audioText || step.q} 的答案下标越界`);
    assert.ok(step.audioText || step.lines, `${step.type} 必须有音频或示范行`);
  });
});

test('例词都是真实词表里的词 —— 顺带积累词汇，不用无意义音节', () => {
  const ids = new Set(VOCAB.map(word => word.id));
  PRON_LESSONS.forEach(lesson => {
    assert.ok((lesson.vocabRefs || []).length >= 3, `${lesson.id} 的 vocabRefs 太少`);
    lesson.vocabRefs.forEach(id =>
      assert.ok(ids.has(id), `${lesson.id} 引用了不存在的词卡 ${id}`));
  });
});

test('所有德语文本都有预生成音频 —— 发音课不能靠浏览器 TTS', () => {
  // 浏览器 TTS 在 iOS 上德语音色不一定存在，发音课靠它等于没有标准音可对照。
  const texts = new Set();
  allSteps.forEach(step => {
    if (step.de) texts.add(step.de);
    if (step.audioText) texts.add(step.audioText);
    if (step.answer) texts.add(step.answer);
    (step.lines || []).forEach(line => texts.add(line.de));
  });
  const missing = [...texts].filter(text => !AUDIO_MANIFEST[text]);
  assert.deepEqual(missing, [], `缺音频（跑 python3 tools/gen_audio.py）：${missing.join(' | ')}`);
});

test('技能标签与全景图拼读 6 格完全对上', () => {
  const byCell = new Map(PRON_CELLS.map(cell => [cell.id, cell]));
  PRON_LESSONS.forEach((lesson, index) => {
    const cell = byCell.get(`V${index + 1}`);
    assert.deepEqual([...lesson.skills].sort(), [...cell.skills].sort(),
      `${lesson.id} 与全景图 ${cell.id} 的技能标签不一致——其中一边练了另一边不会亮`);
    assert.deepEqual(cell.pronLessons, [lesson.id]);
  });
});

test('每张卡都挂了技能标签，否则练了掌握度不动', () => {
  allSteps.forEach(step =>
    assert.ok(step.skills?.length, `${step.de || step.audioText || step.q} 没有 skills`));
});

test('课末规则表存在，成段讲解有归宿', () => {
  PRON_LESSONS.forEach(lesson => {
    assert.ok(lesson.rule?.head?.length, `${lesson.id} 缺规则表`);
    assert.ok(lesson.rule.rows.length >= 3, `${lesson.id} 规则表太薄`);
    lesson.rule.rows.forEach(row =>
      assert.equal(row.length, lesson.rule.head.length, `${lesson.id} 规则表列数不齐`));
  });
});

test('视图用卡片流外壳，且完成状态读写同一套存储', () => {
  const view = readFileSync(new URL('../js/views/pronunciation.js', import.meta.url), 'utf8');
  assert.match(view, /runLessonShell\(host, lesson/);
  // runLessonShell 写 setLessonState，列表若读 isDone('pron', …) 则完成勾永远不出现。
  assert.doesNotMatch(view, /isDone\(['"]pron/);
  assert.doesNotMatch(view, /import \{[^}]*\bisDone\b[^}]*\} from/);
  assert.match(view, /allLessonStates\(\)/);
  assert.equal(findPronLesson('v3').id, 'v3');
  assert.equal(findPronLesson('p01'), null, '旧的 p01–p10 id 已废弃');
});
