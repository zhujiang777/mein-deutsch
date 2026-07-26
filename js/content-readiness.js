import { COURSE_CATALOG, contentVocabRefs, contentWordTotal } from '../data/content-index.js';
import { contentGrammarNeeds } from '../data/grammar-index.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
import { allLessonStates, loadSrs, loadSkills } from './storage.js';

const MILESTONES = ['u2l3', 'u5l3', 'u8l4', 'u9l3', 'u11l4', 'u12l4'];

// 低于这个掌握度就提示"先去补这一课"。定在 40 而不是更高：语法是接受性优先的，
// 看得懂不等于会用，读之前不必先练到熟。
const GRAMMAR_FLOOR = 40;
const GRAMMAR_BY_ID = new Map(GRAMMAR_LESSONS.map(lesson => [lesson.id, lesson]));

/** 一条语法的掌握度 = 它名下所有技能标签强度的平均值（和 lessonMastery 同口径）。 */
export function grammarStrength(grammarId, skills = loadSkills()) {
  const lesson = GRAMMAR_BY_ID.get(grammarId);
  if (!lesson?.skills?.length) return 0;
  const now = Date.now();
  const sum = lesson.skills.reduce((acc, id) => {
    const record = skills[id];
    if (!record) return acc;
    const idle = (now - record.last) / (30 * 86400000);
    return acc + record.s * Math.pow(0.8, Math.max(0, idle));
  }, 0);
  return Math.round(sum / lesson.skills.length);
}

function learnedWordIds(lessonStates, srs) {
  const learned = new Set();
  for (const unit of COURSE_CATALOG) {
    for (const lesson of unit.lessons) {
      if (!lessonStates[lesson.id]?.done) continue;
      for (const id of lesson.vocabRefs || []) learned.add(id);
    }
  }
  for (const [id, card] of Object.entries(srs || {})) {
    if (id.startsWith('w') && (card.reps > 0 || card.state === 'review')) learned.add(id);
  }
  return learned;
}

export function classifyReadiness(item, { lessonStates = {}, srs = {}, skills = {} } = {}) {
  // 分子用自动标注的实词（手写 vocabRefs 一篇只标 2–5 个，信号近似噪声）；
  // 分母用正文实词总数——只除以「有词卡的词」会漏掉 Unterführung 这类真生词，
  // 已知率必然接近 100%，标签会永远显示「适合复习」。
  const refs = contentVocabRefs(item);
  const total = contentWordTotal(item);
  const learned = learnedWordIds(lessonStates, srs);
  const known = refs.filter(id => learned.has(id)).length;
  const knownRatio = total ? known / total : 1;
  const stage = Number(String(item.skillStage || '').replace(/\D/g, '')) || 1;
  const courseStage = MILESTONES.reduce((highest, id, index) =>
    lessonStates[id]?.done ? index + 1 : highest, 0);
  const grammarReady = !item.recommendedAfter || !!lessonStates[item.recommendedAfter]?.done;

  let key;
  if (knownRatio >= 0.98 && courseStage > stage) key = 'review';
  else if (knownRatio >= 0.92 && grammarReady) key = 'right';
  else if (knownRatio >= 0.85 || courseStage + 1 >= stage) key = 'slight';
  else key = 'challenge';

  // 这篇声明需要、但你还没练到 GRAMMAR_FLOOR 的语法点。不参与难度分级——
  // 难度看词，语法给的是"读之前先补哪一课"的指路，两件事不要混。
  const grammarGaps = contentGrammarNeeds(item)
    .map(id => ({ id, strength: grammarStrength(id, skills), title: GRAMMAR_BY_ID.get(id)?.title || id }))
    .filter(entry => entry.strength < GRAMMAR_FLOOR);

  return {
    key,
    label: { right: '正合适', slight: '稍难', challenge: '挑战', review: '适合复习' }[key],
    known,
    total,
    knownRatio,
    grammarReady,
    grammarGaps,
  };
}

export function getContentReadiness(item) {
  return classifyReadiness(item, {
    lessonStates: allLessonStates(),
    srs: loadSrs(),
    skills: loadSkills(),
  });
}
