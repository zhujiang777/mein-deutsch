// 应试板块的数据层。产品形态见 docs/product-shape.md 第 6 条决策。
//
// 应试是三层，材料来源刻意不同：
//   每日小测 —— 当天的今日文章现出的 2 道判断对错（不在这个文件里，由 AI 随文章生成）
//   阶段测验 —— 这里的 EXAM_TASKS，全是没见过的新材料，每走完 5 格串联一次
//   毕业模考 —— 还是这里的 EXAM_TASKS，只是按 part + teil 串成整套
//
// 所以模考不是另一套数据，是同一套数据的另一种取用方式。别为它再建一张表。
//
// ⚠️ items[] 里写的必须是 js/exercises.js 的 renderExercise 能直接吃的对象。
// 题干字段名是 **prompt** 不是 q —— renderChoice 读的是 item.prompt，
// 而 js/ui.js 的 renderQuiz 读的是 ex.q，两套并存，写错了题干就是空白。
import { EXAM_CELLS } from './panorama.js';

/**
 * 11 格的权威口径。已按官方模考平台 bfu.goethe.de/a1_sd1/ 逐模块核实（2026-07）。
 * count/points 是官方题量与分值：一组题就得出满这个数，不能随手写三道充数
 * （tests/exam-data.test.mjs 会拦）。plays 是听力播放次数上限。
 */
export const EXAM_PARTS = EXAM_CELLS.map(cell => ({
  id: cell.id,
  part: cell.id[0] === 'H' ? 'hoeren' : cell.id[0] === 'L' ? 'lesen'
    : cell.id[0] === 'S' ? 'schreiben' : 'sprechen',
  teil: cell.teil,
  count: cell.count || 0,
  points: cell.points || 0,
  plays: cell.plays || 0,
  status: cell.status,
}));

const PART_BY_ID = new Map(EXAM_PARTS.map(part => [part.id, part]));
export function examPart(cellId) {
  return PART_BY_ID.get(cellId) || null;
}

/**
 * 阶段测验与模考的题库。第 5b 步开始填，现在是空的。
 *
 * 一条的形状：
 * {
 *   id: 'x-l3-01',            // x- 前缀，和 li- / rp- / u1l1 / v1 都不撞车
 *   cellId: 'L3',
 *   titleZh: '看三块告示牌，判断说法对不对',
 *   source: { kind: 'inline' }                       // 自带极短原创正文
 *         | { kind: 'reading', id: 'r03' }           // 精读原文原样铺出来
 *         | { kind: 'listening', id: 'li-b01', range: [2, 7] },
 *   stimulus: [{ layout: 'aushang', de, zh, newLemmas: [] }],   // inline 时才有
 *   prereq: { afterCell: 10, skills: ['nicht-kein'], sourceDone: true },
 *   skills: ['read-scan'],    // 组级默认，喂 recordAnswer；必须是课程里已存在的标签
 *   items: [{ type:'choice', prompt, options, a, explain, evidence?, skills? }],
 * }
 */
export const EXAM_TASKS = [];

const TASK_BY_ID = new Map(EXAM_TASKS.map(task => [task.id, task]));
export function findExamTask(id) {
  return TASK_BY_ID.get(id) || null;
}
export function tasksForCell(cellId) {
  return EXAM_TASKS.filter(task => task.cellId === cellId);
}
