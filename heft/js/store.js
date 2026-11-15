// 学习进度：今天该做哪一步、复习安排、学习日志。
// 规则见 docs/product.md：一天一课（第 1 单元），学完的课隔天起进复习；不惩罚、不计连续天数。
import { STORY_LESSONS, STORY_UNIT_SUMMARIES } from '../../data/story-lessons.js';

export const KEY = 'md.heft.v1';
const DAY = 86400000;
export const CARD_GAPS = [1, 3, 7, 16]; // 复习卡：记住一次往后推一档，四次记住就毕业
export const CHECK_GAPS = [1, 4]; // 隔天检查：学完第 2 天一次，过了再隔 4 天一次

export const blank = () => ({ lessons: {}, cards: {}, checks: {}, quiz: {}, log: {}, shift: 0 });
export function load(storage = globalThis.localStorage) {
  try { return { ...blank(), ...JSON.parse(storage.getItem(KEY) || '{}') }; } catch { return blank(); }
}
export function save(s, storage = globalThis.localStorage) { storage.setItem(KEY, JSON.stringify(s)); return s; }

/** 试学用的“进入下一天”：把时钟往后拨 shift 天。 */
export const clock = (s, real = Date.now()) => real + (s.shift || 0) * DAY;
export const dayNum = ts => { const d = new Date(ts); return Math.floor((ts - d.getTimezoneOffset() * 60000) / DAY); };
export const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** 课程顺序：课文一课接一课，单元最后一课之后跟一次“总表 + 小测”。 */
export function course() {
  const out = [];
  for (const lesson of STORY_LESSONS) {
    out.push({ kind: 'lesson', id: lesson.id, lesson });
    const unit = STORY_UNIT_SUMMARIES.find(u => u.after === lesson.id);
    if (unit) out.push({ kind: 'quiz', id: `unit-${unit.unit}`, unit });
  }
  return out;
}
export const findItem = id => course().find(i => i.id === id) || null;
const doneDay = (s, item) => (item.kind === 'quiz' ? s.quiz[item.id]?.done : s.lessons[item.id]?.done) ?? null;

/**
 * 首页唯一的按钮。
 * - go：今天该学 item
 * - rest：今天的已学完，next 是明天那一课（没有就是全部学完）
 * reviews：今天到期的复习条数（卡 + 小材料 + 隔天检查），cards 是其中的卡数。
 */
export function today(s, ts) {
  const d = dayNum(ts), items = course();
  const next = items.find(i => doneDay(s, i) == null) || null;
  const finishedToday = items.filter(i => doneDay(s, i) === d).pop() || null;
  const q = reviewQueue(s, ts);
  const base = { reviews: q.length, cards: q.filter(x => x.type === 'card').length };
  if (finishedToday) return { kind: 'rest', item: finishedToday, next, ...base };
  if (!next) return { kind: 'rest', item: null, next: null, ...base };
  return { kind: 'go', item: next, ...base };
}

export const cardKey = (lessonId, word) => `${lessonId}:${word.de}`;

/** 今天的复习：到期的卡 → 还没读的课后小材料 → 到期的隔天检查。 */
export function reviewQueue(s, ts) {
  const d = dayNum(ts), out = [];
  for (const lesson of STORY_LESSONS) {
    const p = s.lessons[lesson.id];
    if (p?.done == null || p.done >= d) continue;
    for (const word of lesson.words || []) {
      const c = s.cards[cardKey(lesson.id, word)];
      if (c && !c.grad && c.due <= d) out.push({ type: 'card', key: cardKey(lesson.id, word), lessonId: lesson.id, word });
    }
  }
  for (const lesson of STORY_LESSONS) {
    const p = s.lessons[lesson.id];
    if (p?.done == null || p.done >= d) continue;
    if (lesson.reading && !p.read) out.push({ type: 'reading', lessonId: lesson.id });
    const c = s.checks[lesson.id];
    if (c && !c.grad && c.due <= d && lesson.reviews?.length) out.push({ type: 'check', lessonId: lesson.id, item: lesson.reviews[(c.stage + c.tries) % lesson.reviews.length] });
  }
  return out;
}

function logDay(s, ts, entry, count = 0) {
  const k = dayKey(ts), list = s.log[k] ||= [];
  let e = list.find(x => x.type === entry.type && x.id === entry.id);
  if (!e) list.push(e = entry);
  if (count) e.n = (e.n || 0) + count; // 这一天复习了几张卡
}

export function completeLesson(s, lesson, ts) {
  const d = dayNum(ts), p = s.lessons[lesson.id] ||= {};
  if (p.done != null) return s; // 重学不改原日期、不重排复习
  p.done = d; delete p.at;
  for (const word of lesson.words || []) s.cards[cardKey(lesson.id, word)] = { due: d + CARD_GAPS[0], stage: 0 };
  if (lesson.reviews?.length) s.checks[lesson.id] = { due: d + CHECK_GAPS[0], stage: 0, tries: 0 };
  logDay(s, ts, { type: 'lesson', id: lesson.id });
  return s;
}
export function completeQuiz(s, unit, results, ts) {
  const q = s.quiz[`unit-${unit.unit}`] ||= {};
  q.results = results;
  if (q.done == null) q.done = dayNum(ts);
  logDay(s, ts, { type: 'quiz', id: `unit-${unit.unit}` });
  return s;
}
export function rateCard(s, key, ok, ts) {
  const c = s.cards[key]; if (!c) return s;
  // 模糊：不往后推也不清零，明天再来一次
  // 不熟：最近一次选的是「模糊」或「不认识」；下次选「认识」就摘掉（手帐页的单词签用）
  c.weak = ok !== true;
  if (ok === 'fuzzy') c.due = dayNum(ts) + 1;
  else if (ok) { c.stage++; c.grad = c.stage >= CARD_GAPS.length; c.due = dayNum(ts) + (CARD_GAPS[c.stage] || 0); }
  else { c.stage = 0; c.due = dayNum(ts) + 1; }
  logDay(s, ts, { type: 'review', id: 'cards' }, 1);
  return s;
}
export function submitCheck(s, lessonId, ok, ts) {
  const c = s.checks[lessonId]; if (!c) return s;
  c.tries++;
  if (ok) { c.stage++; c.grad = c.stage >= CHECK_GAPS.length; c.due = dayNum(ts) + (CHECK_GAPS[c.stage] || 0); }
  else c.due = dayNum(ts) + 1;
  logDay(s, ts, { type: 'review', id: 'cards' });
  return s;
}
export function markRead(s, lessonId, ts) { (s.lessons[lessonId] ||= {}).read = true; logDay(s, ts, { type: 'review', id: 'cards' }); return s; }
/** 学到一半退出：记住停在哪一步。 */
export function savePlace(s, id, at) { (s.lessons[id] ||= {}).at = at; return s; }
export const placeOf = (s, id) => s.lessons[id]?.at || 0;
