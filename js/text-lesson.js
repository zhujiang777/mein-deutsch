// 课文课的进度与复习安排（规则见 docs/product.md）：一篇课文两天学完，每天只给一个“下一步”。
// 机器发音评分不参与任何解锁；隔天检查不给提示、首次做对才算通过。
import { TEXT_LESSONS, findTextLesson } from '../data/text-lessons.js';
import { loadIntegrated, saveIntegrated } from './storage.js?v=4';

const DAY = 86400000;
export const REVIEW_GAPS = [2, 4]; // 第 2 天学完后 2 天首次检查，通过后再隔 4 天；两次通过 = 记住了

export const dayKey = (now = Date.now()) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const textKey = lesson => `${lesson.id}@${lesson.version}`;

const store = (data = loadIntegrated()) => data.text || {};
function write(fn) {
  const data = loadIntegrated();
  const t = data.text ||= {};
  t.lessons ||= {}; t.reviews ||= {}; t.sessions ||= {};
  fn(t);
  saveIntegrated(data);
  return t;
}

export function textProgress(lesson, data = loadIntegrated()) { return store(data).lessons?.[textKey(lesson)] || {}; }
export function patchText(lesson, patch) {
  return write(t => { t.lessons[textKey(lesson)] = { ...t.lessons[textKey(lesson)], ...patch }; }).lessons[textKey(lesson)];
}

/** 记录某一天学完；第 2 天学完即安排隔天检查。重复调用不改变原日期。 */
export function completeDay(lesson, day, now = Date.now()) {
  write(t => {
    const key = textKey(lesson), p = t.lessons[key] ||= {};
    if (p[`d${day}`]) return;
    p[`d${day}`] = dayKey(now);
    if (day === 2) t.reviews[key] = { lessonId: lesson.id, version: lesson.version, stage: 0, attempts: 0, due: now + REVIEW_GAPS[0] * DAY, done: false };
  });
}

export function dueTextReviews(data = loadIntegrated(), now = Date.now()) {
  return Object.entries(store(data).reviews || {})
    .filter(([, r]) => !r.done && r.due <= now && findTextLesson(r.lessonId)?.version === r.version)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([key, r]) => ({ key, ...r }));
}
export function reviewActivity(review) {
  const lesson = findTextLesson(review.lessonId);
  return lesson.reviews[(review.stage + review.attempts) % lesson.reviews.length];
}
export function submitTextReview(key, passed, now = Date.now()) {
  write(t => {
    const r = t.reviews[key];
    if (!r || r.done) return;
    r.attempts++; r.last = now; r.lastPassed = passed;
    if (passed) { r.stage++; r.done = r.stage >= REVIEW_GAPS.length; r.due = now + (REVIEW_GAPS[r.stage] || 0) * DAY; }
    else r.due = now + DAY;
  });
}
export const remembered = (lesson, data = loadIntegrated()) => !!store(data).reviews?.[textKey(lesson)]?.done;

/** 听写第一次写错的句子：之后的检查里再写一遍。 */
export function noteMissed(lesson, lineIndex) {
  write(t => { const p = t.lessons[textKey(lesson)] ||= {}; p.missed = [...new Set([...(p.missed || []), lineIndex])]; });
}

export function textSession(key) { return store().sessions?.[key] || null; }
export function saveTextSession(key, value) { write(t => { t.sessions[key] = value; }); }

/** 学过第 1 天的课文里，要进复习的词。 */
export function studiedTextWords(data = loadIntegrated()) {
  return TEXT_LESSONS.filter(l => textProgress(l, data).d1).flatMap(l => l.words.map(w => ({ ...w, lessonId: l.id })));
}

/**
 * 首页唯一的按钮。
 * - day：该学某课的第 1 / 2 天
 * - rest：今天的课已学完，明天继续（next 是明天要学的那一步）
 * - caughtUp：已有课文全部学完
 * reviews 只用来决定按钮上要不要提示“先复习”，不改变今天该学哪一步。
 */
export function todayStep(data = loadIntegrated(), now = Date.now()) {
  const today = dayKey(now);
  let learnedToday = false;
  for (const lesson of TEXT_LESSONS) {
    const p = textProgress(lesson, data);
    if (p.d2) { learnedToday ||= p.d2 === today; continue; }
    const day = p.d1 ? 2 : 1;
    if (learnedToday || p.d1 === today) return { kind: 'rest', next: { lesson, day } };
    return { kind: 'day', lesson, day };
  }
  return { kind: 'caughtUp' };
}
