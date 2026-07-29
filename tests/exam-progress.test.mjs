// 应试板块的记账与触发规则。规格见 docs/product-shape.md 第 6 条决策。
import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
};
globalThis.window = { dispatchEvent() {} };

const {
  EXAM_MODES, STAGE_EVERY, examMode, dailyQuizOn, stageExamDue,
  recordExamAnswer, recordExamTask, examStrength, examSeen,
} = await import('../js/exam.js');
const { addExamMiss, dueExamMisses, examRef } = await import('../js/mastery.js');
const { loadExam } = await import('../js/storage.js');

test('三档开关：默认全开，认不出的值也回落到全开', () => {
  assert.deepEqual(Object.keys(EXAM_MODES), ['off', 'stage', 'all']);
  assert.equal(examMode({}), 'all', '没设置过就是全开——用户要的是熟能生巧，不是又一个要自己找的入口');
  assert.equal(examMode({ examMode: 'nonsense' }), 'all');
  assert.equal(dailyQuizOn({ examMode: 'all' }), true);
  assert.equal(dailyQuizOn({ examMode: 'stage' }), false, '只做阶段测验时没有每日小测');
  assert.equal(dailyQuizOn({ examMode: 'off' }), false);
});

test('阶段测验每走完 5 格来一次，关掉就不来', () => {
  assert.equal(STAGE_EVERY, 5);
  const on = { examMode: 'all' };
  assert.equal(stageExamDue(0, on), false, '一格没走时不该考');
  assert.equal(stageExamDue(4, on), false);
  assert.equal(stageExamDue(5, on), true);
  assert.equal(stageExamDue(10, on), true);
  assert.equal(stageExamDue(11, on), false);
  assert.equal(stageExamDue(5, { examMode: 'off' }), false);
  // 只做阶段测验这一档，阶段测验照来
  assert.equal(stageExamDue(5, { examMode: 'stage' }), true);
});

test('题型熟练度和语言掌握度分开存，公式与 skillStrength 同一条口径', () => {
  values.clear();
  recordExamAnswer('L1', true);
  assert.equal(examStrength('L1'), 20, '第一次答对：0 + (100-0)*0.2');
  recordExamAnswer('L1', true);
  assert.equal(examStrength('L1'), 36);
  recordExamAnswer('L1', false);
  assert.equal(examStrength('L1'), 22, '答错乘 0.6，掉得比涨得快');
  assert.equal(examSeen('L1'), 3);
  assert.equal(examStrength('H1'), 0, '没练过的题型是 0，不是 undefined');

  // 存在自己的 store 里，不污染技能掌握度
  assert.ok(values.has('md.exam.v1'));
  assert.equal(values.has('md.skills.v1'), false, '题型熟练度不该写进 md.skills.v1');
});

test('一组题做完记一笔：练过几次、上次几分', () => {
  values.clear();
  recordExamTask('x-l3-01', { correct: 4, total: 5 });
  recordExamTask('x-l3-01', { correct: 5, total: 5 });
  const state = loadExam();
  assert.equal(state.tasks['x-l3-01'].done, 2);
  assert.equal(state.tasks['x-l3-01'].lastScore, 5);
  assert.equal(state.tasks['x-l3-01'].lastTotal, 5);
});

test('考试错题进 x: 池，和课程错题 m: / 精听错句 l: 互不干扰', () => {
  values.clear();
  addExamMiss('x-l3-01', 2);
  const due = dueExamMisses();
  assert.equal(due.length, 0, '刚记下的错题明天才到期，不该当场再考一遍');

  // 把到期时间拨到过去，模拟第二天
  const srs = JSON.parse(values.get('md.srs.v1'));
  srs['x:x-l3-01:2'].due = Date.now() - 1000;
  values.set('md.srs.v1', JSON.stringify(srs));
  assert.deepEqual(dueExamMisses(), ['x:x-l3-01:2']);
  assert.deepEqual(examRef('x:x-l3-01:2'), { taskId: 'x-l3-01', itemIndex: 2 });

  // 非法输入不该悄悄写进池子
  addExamMiss('', 0);
  addExamMiss('x-l3-01', -1);
  assert.equal(Object.keys(JSON.parse(values.get('md.srs.v1'))).length, 1);
});
