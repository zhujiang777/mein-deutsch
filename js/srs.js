// 间隔重复调度：简化版 SM-2
// 卡片状态: { due(ms), ivl(天), ease, reps, lapses, state: 'new'|'learn'|'review' }
import { loadSrs, saveSrs, getSettings } from './storage.js';

const DAY = 24 * 60 * 60 * 1000;
export const LEARN_STEPS = [10 * 60 * 1000, DAY, 3 * DAY];

export const RATINGS = [
  { key: 'again', label: '忘了', cls: 'rating-again' },
  { key: 'hard', label: '困难', cls: 'rating-hard' },
  { key: 'good', label: '记得', cls: 'rating-good' },
  { key: 'easy', label: '简单', cls: 'rating-easy' },
];

export function rate(id, rating) {
  const all = loadSrs();
  const now = Date.now();
  const c = all[id] || { ivl: 0, ease: 2.5, reps: 0, lapses: 0, state: 'new' };
  c.reps += 1;

  if (rating === 'again') {
    c.lapses += 1;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.ivl = 0;
    c.state = 'learn';
    c.step = 0;
    c.due = now + LEARN_STEPS[0];
  } else if (c.state === 'new' || c.state === 'learn') {
    // 新词/学习卡：10 分钟 → 1 天 → 3 天，最后一档发出即毕业。
    if (rating === 'hard') c.ease = Math.max(1.3, c.ease - 0.15);
    if (rating === 'easy') c.ease = Math.min(3.0, c.ease + 0.15);
    if (rating === 'easy') {
      c.step = LEARN_STEPS.length - 1;
      c.ivl = 3;
      c.state = 'review';
      c.due = now + 3 * DAY;
    } else {
      // Old learn cards do not have `step`; safely resume from the first rung.
      const step = (c.step ?? 0) + 1;
      if (step >= LEARN_STEPS.length - 1) {
        c.step = LEARN_STEPS.length - 1;
        c.ivl = 3;
        c.state = 'review';
        c.due = now + 3 * DAY;
      } else {
        c.step = step;
        c.ivl = 0;
        c.state = 'learn';
        c.due = now + LEARN_STEPS[step];
      }
    }
  } else {
    const factor = rating === 'hard' ? 1.2 : rating === 'good' ? c.ease : c.ease * 1.3;
    if (rating === 'hard') c.ease = Math.max(1.3, c.ease - 0.15);
    if (rating === 'easy') c.ease = Math.min(3.0, c.ease + 0.15);
    c.ivl = Math.max(1, Math.round(c.ivl * factor));
    c.due = now + c.ivl * DAY;
  }
  all[id] = c;
  saveSrs(all);
  return c;
}

// 标熟：已认识的词，长间隔后再抽查一次
export function markKnown(id) {
  const all = loadSrs();
  all[id] = { ivl: 180, ease: 2.8, reps: 1, lapses: 0, state: 'review', due: Date.now() + 180 * DAY };
  saveSrs(all);
}

// 组装今日学习队列：到期复习卡 + 每日限额内的新卡
export function buildQueue(allIds) {
  const all = loadSrs();
  const now = Date.now();
  const due = [];
  const fresh = [];
  for (const id of allIds) {
    const c = all[id];
    if (!c) fresh.push(id);
    else if (c.due <= now) due.push(id);
  }
  const newLimit = getSettings().newPerDay;
  return { due, fresh: fresh.slice(0, newLimit), freshTotal: fresh.length };
}

export function srsStats(allIds) {
  const all = loadSrs();
  const now = Date.now();
  let learned = 0, due = 0;
  for (const id of allIds) {
    const c = all[id];
    if (c) {
      learned += 1;
      if (c.due <= now) due += 1;
    }
  }
  return { total: allIds.length, learned, due, fresh: allIds.length - learned };
}
