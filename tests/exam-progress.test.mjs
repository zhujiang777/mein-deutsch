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

const examModule = await import('../js/exam.js');
const {
  EXAM_MODES, STAGE_EVERY, examMode, dailyQuizOn, stageExamDue,
  recordExamAnswer, recordExamTask, examStrength, examSeen,
  examTaskReady, pickStageExam,
} = examModule;
const { EXAM_TASKS } = await import('../data/exam.js');
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

/* ---------- 阶段测验挑题 ---------- */

// 满分技能表：让所有 prereq.skills 都过 40 这条线，好把变量留给 afterCell 和标签重合
const ALL_STRONG = Object.fromEntries(
  EXAM_TASKS.flatMap(task => task.prereq.skills || [])
    .map(tag => [tag, { s: 100, last: Date.now() }]));

test('前置门槛：主线没走到就不出，语法没练到 40 也不出', () => {
  const task = EXAM_TASKS.find(item => item.prereq.skills?.length);
  const need = task.prereq.afterCell;
  assert.equal(examTaskReady(task, need - 1, ALL_STRONG), false, '主线还没走到就不该出这组');
  assert.equal(examTaskReady(task, need, ALL_STRONG), true);
  assert.equal(examTaskReady(task, need, {}), false, '语法点没练到 40 就不出——考全不会的题只会得到"我不行"');
});

test('阶段测验：挑没做过的、和刚学的重合最多的，且一次不给同题型两组', () => {
  values.clear();
  const picked = pickStageExam(26, { skills: ALL_STRONG, recentSkills: [] });
  assert.ok(picked.length >= 2 && picked.length <= 3, '一次 2–3 组');
  assert.equal(new Set(picked.map(task => task.cellId)).size, picked.length,
    '同一个题型不该在一场阶段测验里出现两次——阶段测验是横着串，不是竖着刷');

  // 只有一组挂着 renting 这个标签，刚走过的格子用到它，那一组就该被顶到第一位
  const only = EXAM_TASKS.filter(task => [...(task.skills || []),
    ...task.items.flatMap(item => item.skills || [])].includes('renting'));
  assert.equal(only.length, 1, '这条测试依赖 renting 是独一份的标签');
  const withRecent = pickStageExam(26, { skills: ALL_STRONG, recentSkills: ['renting'], max: 1 });
  assert.equal(withRecent[0].id, only[0].id,
    '标签重合最多的那组必须排第一，这才叫"把刚学过的串起来"');

  // 做过的往后排
  recordExamTask(withRecent[0].id, { correct: 5, total: 5 });
  const again = pickStageExam(26, { skills: ALL_STRONG, recentSkills: ['renting'], max: 1 });
  assert.notEqual(again[0].id, withRecent[0].id, '做过的组要让位给没做过的');
});

test('刚起步时挑得出题，但只挑门槛最低的那几组', () => {
  values.clear();
  const early = pickStageExam(5, { skills: ALL_STRONG, recentSkills: [] });
  assert.ok(early.length, '走完 5 格就该有得考，否则第一次阶段测验是空的');
  early.forEach(task => assert.ok(task.prereq.afterCell <= 5, `${task.id} 的门槛超过 5 格`));
});

/* ---------- 毕业模考 ---------- */

test('模考两条与：地图走到 22 格 + 笔试八格都练到 60', () => {
  values.clear();
  const { MOCK_CELLS, MOCK_UNLOCK_CELL, mockUnlock } = examModule;
  assert.deepEqual(MOCK_CELLS, ['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'S1', 'S2'],
    '模考只考笔试八格，口试是单独一场');

  let gate = mockUnlock(0);
  assert.equal(gate.ok, false);
  assert.equal(gate.cellsLeft, MOCK_UNLOCK_CELL);
  assert.equal(gate.weakCells.length, 8, '一格都没练过时，八格全是弱项');

  // 把八格全练到 60 以上：答对 5 次约到 67
  MOCK_CELLS.forEach(id => { for (let i = 0; i < 5; i++) recordExamAnswer(id, true); });
  gate = mockUnlock(MOCK_UNLOCK_CELL);
  assert.deepEqual(gate.weakCells, []);
  assert.equal(gate.ok, true);

  // 少走一格就不解锁 —— 两条是与，不是或
  assert.equal(mockUnlock(MOCK_UNLOCK_CELL - 1).ok, false);
});

test('模考是同一批题的另一种取用方式，每格挑一组，优先没做过的', () => {
  values.clear();
  const { MOCK_CELLS, buildMockExam } = examModule;
  const first = buildMockExam();
  assert.deepEqual(first.map(task => task.cellId), MOCK_CELLS, '按官方顺序每格一组');

  recordExamTask(first[0].id, { correct: 6, total: 6 });
  const second = buildMockExam();
  assert.notEqual(second[0].id, first[0].id,
    '做过的那组要让位——同一套题考第二遍就是在背答案');
});

test('模考算的是得分率，60% 是唯一一条硬线，不假装能给官方分', () => {
  const { scoreMock, PASS_RATIO, recordMock } = examModule;
  assert.equal(PASS_RATIO, 0.6);
  values.clear();

  // 全对：45 分满分（6+4+5+5+5+5+5+10）
  const perfect = scoreMock([
    { cellId: 'H1', correct: 6, total: 6 }, { cellId: 'H2', correct: 4, total: 4 },
    { cellId: 'H3', correct: 5, total: 5 }, { cellId: 'L1', correct: 5, total: 5 },
    { cellId: 'L2', correct: 5, total: 5 }, { cellId: 'L3', correct: 5, total: 5 },
    { cellId: 'S1', correct: 5, total: 5 }, { cellId: 'S2', correct: 1, total: 1 },
  ]);
  assert.equal(perfect.points, 45);
  assert.equal(perfect.earned, 45);
  assert.equal(perfect.pass, true);

  // 一半：正好卡在及格线下
  const half = scoreMock([{ cellId: 'H1', correct: 3, total: 6 }]);
  assert.equal(half.earned, 3);
  assert.equal(half.points, 6);
  assert.equal(half.pass, false, '50% 不到 60%');

  recordMock(perfect);
  const mocks = JSON.parse(values.get('md.exam.v1')).mocks;
  assert.equal(mocks.length, 1);
  assert.equal(mocks[0].pass, true);
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
