// 技能掌握度 + 错题池
// 技能强度 0-100：答对渐进上升，答错显著下降，随时间轻微衰减
import { loadSkills, saveSkills, loadSrs, saveSrs } from './storage.js';

const DAY = 86400000;

export function recordAnswer(skillIds = [], correct) {
  if (!skillIds.length) return;
  const all = loadSkills();
  const now = Date.now();
  for (const id of skillIds) {
    const k = all[id] || { s: 0, seen: 0, ok: 0, last: now };
    k.seen += 1;
    if (correct) {
      k.ok += 1;
      k.s = Math.min(100, k.s + (100 - k.s) * 0.2);
    } else {
      k.s = Math.max(0, k.s * 0.6);
    }
    k.last = now;
    all[id] = k;
  }
  saveSkills(all);
}

// 读取时应用时间衰减（不写回，展示口径）：每 30 天不练衰减约 20%
export function skillStrength(id) {
  const k = loadSkills()[id];
  if (!k) return 0;
  const idle = (Date.now() - k.last) / (30 * DAY);
  return Math.round(k.s * Math.pow(0.8, Math.max(0, idle)));
}

export function lessonMastery(lesson) {
  if (!lesson.skills?.length) return 0;
  const sum = lesson.skills.reduce((acc, id) => acc + skillStrength(id), 0);
  return Math.round(sum / lesson.skills.length);
}

/* ---- 错题池：id 形如 m:<lessonId>:<stepIdx>，复用 SRS 存储 ---- */
export function addMistake(lessonId, stepIdx) {
  const id = `m:${lessonId}:${stepIdx}`;
  const all = loadSrs();
  const c = all[id] || { ivl: 0, ease: 2.3, reps: 0, lapses: 0, state: 'learn' };
  c.lapses += 1;
  c.due = Date.now() + DAY; // 明天进今日流
  all[id] = c;
  saveSrs(all);
}

export function dueMistakes(limit = 10) {
  const all = loadSrs();
  const now = Date.now();
  return Object.keys(all)
    .filter(id => id.startsWith('m:') && all[id].due <= now && all[id].state !== 'done')
    .sort((a, b) => all[a].due - all[b].due)
    .slice(0, limit);
}

// 错题答对：间隔翻倍（1→3→7 天后毕业出池）；答错：明天再来
export function rateMistake(id, correct) {
  const all = loadSrs();
  const c = all[id];
  if (!c) return;
  c.reps += 1;
  if (correct) {
    c.ivl = c.ivl >= 3 ? 7 : c.ivl >= 1 ? 3 : 1;
    if (c.ivl >= 7) c.state = 'done'; // 毕业
    c.due = Date.now() + c.ivl * DAY;
  } else {
    c.ivl = 0;
    c.lapses += 1;
    c.due = Date.now() + DAY;
  }
  all[id] = c;
  saveSrs(all);
}

export function mistakeRef(id) {
  const [, lessonId, stepIdx] = id.split(':');
  return { lessonId, stepIdx: parseInt(stepIdx, 10) };
}
