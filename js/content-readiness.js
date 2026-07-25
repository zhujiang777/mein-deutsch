import { COURSE_CATALOG, contentVocabRefs, contentWordTotal } from '../data/content-index.js';
import { allLessonStates, loadSrs } from './storage.js';

const MILESTONES = ['u2l3', 'u5l3', 'u8l4', 'u9l3', 'u11l4', 'u12l4'];

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

export function classifyReadiness(item, { lessonStates = {}, srs = {} } = {}) {
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

  return {
    key,
    label: { right: '正合适', slight: '稍难', challenge: '挑战', review: '适合复习' }[key],
    known,
    total,
    knownRatio,
    grammarReady,
  };
}

export function getContentReadiness(item) {
  return classifyReadiness(item, { lessonStates: allLessonStates(), srs: loadSrs() });
}
