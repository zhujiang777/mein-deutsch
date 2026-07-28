// 主线引擎：全景图决定今天学哪一格。产品形态见 docs/product-shape.md
//
// 以前"学一格"是顺着课表 u0 → u1 → … 往下走。能走，但有三个问题：
//   1. 没有终点。"还剩 43 节课"不是一个人能盯着走完的数字。
//   2. 不能跳。在别处已经练熟的东西，课表还是会一节不落地推给你。
//   3. 它交给今日文章的"今天这一格语法"其实是课表标题（比如「字母表与拼读总则」），
//      那根本不是一个语法点——第 3 步实测时这个字段就是这么发出去的。
//
// 现在主线走的是地图本身：拼读 6 格 + 语法 20 格 = 26 格，走完就是 A1 走完一遍。
// 地图仍然只度量、不产内容：每一格里跑的还是既有的微步课和解码课。
import { PRON_CELLS, GRAMMAR_CELLS, MAINLINE_ORDER } from '../data/panorama.js';
import { COURSE_CATALOG } from '../data/content-index.js';
import { PRON_LESSONS } from '../data/pronunciation.js';
import { skillStrength } from './mastery.js';

/** 掌握度到这条线就算这一格已经走过，主线不再往回推。和全景图的"稳了"同一条线。 */
export const CLEAR_FLOOR = 70;

// 三类课不参与"属于哪一格"：
//   u0l*   —— 旧的发音微步课，已被入门解码课（v1–v6）取代，留在仓库里备查；
//   s?-l*  —— 场景课是应用，不教新格子；
//   u13l3  —— 结业综合测验横跨 11 格，塞进任何一格都会让那一格提前"走完"。
const OFF_MAINLINE = /^(u0l|s[a-g]-l|u13l3$)/;

const ORDERED_CELLS = MAINLINE_ORDER
  .map(id => GRAMMAR_CELLS.find(cell => cell.id === id))
  .filter(Boolean);

/**
 * 一节微步课只能属于一格，否则同一节课会让两格同时前进，"还剩几格"就不再是真的。
 * 归属规则：命中这格技能标签最多的那格；平局归主线上更靠前的那格
 * （u1l1 同时命中 A1 和 D1，它显然属于 A1——D1 的重头在 u10/u11）。
 */
function assignHomes() {
  const home = new Map(ORDERED_CELLS.map(cell => [cell.id, []]));
  for (const unit of COURSE_CATALOG) {
    for (const lesson of unit.lessons) {
      if (OFF_MAINLINE.test(lesson.id)) continue;
      let best = null;
      let bestHits = 0;
      for (const cell of ORDERED_CELLS) {
        const hits = (lesson.skills || []).filter(skill => cell.skills.includes(skill)).length;
        if (hits > bestHits) { best = cell; bestHits = hits; }
      }
      if (best) home.get(best.id).push(lesson);
    }
  }
  return home;
}

const HOME = assignHomes();

/** 主线的 26 格，按走的顺序。kind 决定这一格里跑的是解码课还是微步课。 */
export const MAINLINE_CELLS = [
  ...PRON_CELLS.map(cell => ({
    cell, kind: 'pron',
    lessons: (cell.pronLessons || [])
      .map(id => PRON_LESSONS.find(lesson => lesson.id === id)).filter(Boolean),
  })),
  ...ORDERED_CELLS.map(cell => ({ cell, kind: 'lesson', lessons: HOME.get(cell.id) })),
];

export function cellStrength(cell, skills = {}) {
  if (!cell.skills?.length) return 0;
  const sum = cell.skills.reduce((acc, id) => acc + skillStrength(id, skills), 0);
  return Math.round(sum / cell.skills.length);
}

/**
 * 今天学哪一格。"走完"有两条定义，满足任意一条就往前走：
 *   ① 这一格的课都做完了 —— 确定性的，保证主线永远推得动，不会卡死在某一格；
 *   ② 掌握度已经到 CLEAR_FLOOR —— 让在别处（错题、精听、今日文章）已经练熟的人跳过去。
 * 一格没有任何课时（内容还没写）也算走完：宁可少一格，不能让主线断在这里。
 */
export function nextMainlineStep(states = {}, skills = {}) {
  for (let index = 0; index < MAINLINE_CELLS.length; index++) {
    const entry = MAINLINE_CELLS[index];
    const lesson = entry.lessons.find(item => !states[item.id]?.done);
    if (!lesson) continue;
    if (cellStrength(entry.cell, skills) >= CLEAR_FLOOR) continue;
    return {
      cell: entry.cell,
      kind: entry.kind,
      lesson,
      // 只有语法格才有"今天这一格语法"可以交给今日文章；拼读格给了也没用。
      grammarZh: entry.kind === 'lesson' ? entry.cell.title : '',
      index: index + 1,
      total: MAINLINE_CELLS.length,
    };
  }
  return null;
}

/** 首页和横幅上的"第 N / 26 格"。走完时 step 为 null。 */
export function mainlineProgress(states = {}, skills = {}) {
  const step = nextMainlineStep(states, skills);
  return {
    step,
    total: MAINLINE_CELLS.length,
    done: step ? step.index - 1 : MAINLINE_CELLS.length,
  };
}
