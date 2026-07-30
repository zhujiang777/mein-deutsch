// 应试板块的记账与调度。产品形态见 docs/product-shape.md 第 6 条决策。
//
// 三层各自的触发在这里判定：
//   每日小测 —— 每天，题由今日文章带来（js/daily-article.js 的 quizToTask）
//   阶段测验 —— 每走完 5 格（第 5b 步接线）
//   毕业模考 —— 走到第 22 格且每个已实现的题型都练到 60（第 5f 步）
//
// 题型熟练度和语言掌握度是两回事，所以分两个 store：
//   答对答错喂 recordAnswer → md.skills.v1（推动全景图语法轴，联动是双向的）
//   题型自己的强度 → md.exam.v1（不污染 skills，否则语法轴百分比会被听力题稀释）
import { loadExam, saveExam, getSettings } from './storage.js';
import { EXAM_TASKS } from '../data/exam.js';
import { skillStrength } from './mastery.js';
import { GRAMMAR_FLOOR } from './content-readiness.js';

/** 强度公式和衰减完全抄 js/mastery.js —— 三条轴共用 bandOf() 的四档配色，口径必须一致。 */
const DAY = 86400000;

/** 每走完这么多格来一次阶段测验。26 格共 5 次。 */
export const STAGE_EVERY = 5;

/** 毕业模考的解锁线：地图走到这一格，且每个已实现的题型都练到这个强度。 */
export const MOCK_UNLOCK_CELL = 22;
export const MOCK_UNLOCK_STRENGTH = 60;

/** 设置里的三档开关。默认全开：用户要的是熟能生巧，不是又一个要自己找的入口。 */
export const EXAM_MODES = {
  off: { label: '关闭', daily: false, stage: false },
  stage: { label: '只做阶段测验', daily: false, stage: true },
  all: { label: '全开（推荐）', daily: true, stage: true },
};

export function examMode(settings = getSettings()) {
  return EXAM_MODES[settings?.examMode] ? settings.examMode : 'all';
}

/** 今天要不要出每日小测。到期错题不受开关影响，由调用方另判。 */
export function dailyQuizOn(settings = getSettings()) {
  return EXAM_MODES[examMode(settings)].daily;
}

/** 走完第 5、10、15、20、25 格的那天来一次阶段测验。 */
export function stageExamDue(cellsDone = 0, settings = getSettings()) {
  if (!EXAM_MODES[examMode(settings)].stage) return false;
  return cellsDone > 0 && cellsDone % STAGE_EVERY === 0;
}

/* ---------- 阶段测验挑题 ---------- */

/**
 * 这组题现在能不能出。两条与，缺一不出：
 *   afterCell —— 主线至少要走到这一格（材料里的场景才见过）
 *   skills    —— 这些语法点得练到 40（和 content-readiness 的 GRAMMAR_FLOOR 同一条线，
 *                不发明第二条门槛）
 * 门槛过不去时宁可不出：一场考完全不会的题，学的人只会得到"我不行"这个结论。
 */
export function examTaskReady(task, cellsDone = 0, skills = {}) {
  const pre = task?.prereq || {};
  if ((pre.afterCell || 0) > cellsDone) return false;
  return (pre.skills || []).every(tag => skillStrength(tag, skills) >= GRAMMAR_FLOOR);
}

/**
 * 阶段测验挑哪几组。**确定性规则，不用 AI。**
 *
 * recentSkills = 刚走过那 5 格的全部技能标签。挑标签重合最多的组，
 * 这就是用户要的"把全景图里学过的东西串联起来"——不用手写一张阶段↔题目的映射表，
 * 加一组新题它自己就会被排进合适的阶段。
 *
 * 三条排序，按重要性：没做过的优先 → 和刚学的重合多的优先 → id 兜底（结果稳定可测）。
 * 一次不给同一个题型两组：阶段测验要横着串，不是竖着刷同一种题。
 */
export function pickStageExam(cellsDone = 0, {
  skills = {}, recentSkills = [], max = 3, state = loadExam(), tasks = EXAM_TASKS,
} = {}) {
  const recent = new Set(recentSkills);
  const doneMap = state.tasks || {};
  const scored = tasks
    .filter(task => examTaskReady(task, cellsDone, skills))
    .map(task => {
      const tags = new Set([...(task.skills || []),
        ...(task.items || []).flatMap(item => item.skills || [])]);
      return {
        task,
        overlap: [...tags].filter(tag => recent.has(tag)).length,
        done: doneMap[task.id]?.done || 0,
      };
    })
    .sort((a, b) => (a.done - b.done) || (b.overlap - a.overlap)
      || a.task.id.localeCompare(b.task.id));

  const picked = [];
  const usedCells = new Set();
  for (const row of scored) {
    if (usedCells.has(row.task.cellId)) continue;
    usedCells.add(row.task.cellId);
    picked.push(row.task);
    if (picked.length >= max) break;
  }
  return picked;
}

/* ---------- 题型熟练度 ---------- */

export function recordExamAnswer(cellId, correct, state = loadExam()) {
  if (!cellId) return state;
  const cells = { ...(state.cells || {}) };
  const now = Date.now();
  const cell = cells[cellId] || { s: 0, seen: 0, ok: 0, last: now };
  cell.seen += 1;
  if (correct) {
    cell.ok += 1;
    cell.s = Math.min(100, cell.s + (100 - cell.s) * 0.2);
  } else {
    cell.s = Math.max(0, cell.s * 0.6);
  }
  cell.last = now;
  cells[cellId] = cell;
  const next = { ...state, cells };
  saveExam(next);
  return next;
}

/** 一次做完一组题后记一笔：练过几次、上次几分。给全景图那一格显示用。 */
export function recordExamTask(taskId, { correct = 0, total = 0 } = {}, state = loadExam()) {
  if (!taskId) return state;
  const tasks = { ...(state.tasks || {}) };
  const prev = tasks[taskId] || { done: 0 };
  tasks[taskId] = { done: prev.done + 1, lastScore: correct, lastTotal: total, last: Date.now() };
  const next = { ...state, tasks };
  saveExam(next);
  return next;
}

/** 读取时按 30 天 20% 衰减，和 skillStrength 同一条口径（不写回）。 */
export function examStrength(cellId, state = loadExam()) {
  const cell = (state.cells || {})[cellId];
  if (!cell) return 0;
  const idle = (Date.now() - cell.last) / (30 * DAY);
  return Math.round(cell.s * Math.pow(0.8, Math.max(0, idle)));
}

export function examSeen(cellId, state = loadExam()) {
  return (state.cells || {})[cellId]?.seen || 0;
}
