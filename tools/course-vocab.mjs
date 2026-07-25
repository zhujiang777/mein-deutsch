// 课程词复用率：一篇精读/精听里，学习者**在推荐课次时已经学过**的实词占多少。
//
// 与 a1-coverage.mjs 的分工：
//   a1-coverage —— 比的是整个 A1 词库（Goethe 词表 + 课程词表），管「不超纲」。
//   course-vocab —— 比的是到 recommendedAfter 为止课程真正教过的词，管「够熟悉」。
// 两者都要过：一篇可以 95% 都是 A1 词，同时 95% 学习者没见过——这两件事不矛盾。
import { COURSE_CATALOG } from '../data/content-index.js';
import { VOCAB } from '../data/vocab.js';
import { DICT_FORMS, DICT_POS } from '../data/dict-core.js';
import { candidates, words } from './a1-coverage.mjs';

const VOCAB_BY_ID = new Map(VOCAB.map(word => [word.id, word.de.toLowerCase()]));
const LESSONS = COURSE_CATALOG.flatMap(unit => unit.lessons);
// 实词才计入。功能词（ich/und/in/der）由语法课教，不进词汇卡，算进来只会稀释指标。
// 副词也排除：dort/noch/nur/erst/zusammen 这类是跟着语法和句型走的，不是词汇卡的内容。
const CONTENT_POS = /^(n\.|v\.|adj\.)$/;

// 语法前置带来的词。sein/haben/情态动词由语法课教，词汇卡挂在很后面的课次，
// 但学习者在对应语法课就已经天天用了——按词汇卡算会把 ist/bin/kann 全判成生词。
const GRAMMAR_LEMMAS = {
  sein: ['sein'],
  haben: ['haben'],
  'war-hatte': ['sein', 'haben'],
  'perfect-with-haben': ['haben'],
  'perfect-with-sein': ['sein'],
  'modal-verbs': ['können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen', 'möchten'],
  'regular-verbs': ['machen', 'gehen'],
};

function grammarTaught(prereqs = []) {
  const out = new Set();
  for (const tag of prereqs) for (const lemma of GRAMMAR_LEMMAS[tag] || []) out.add(lemma);
  return out;
}

/** 到某一课为止，课程教过的全部词（小写 lemma）。课次不存在时返回空集。 */
export function taughtUpTo(lessonId) {
  const taught = new Set();
  let found = false;
  for (const lesson of LESSONS) {
    for (const id of lesson.vocabRefs || []) {
      const word = VOCAB_BY_ID.get(id);
      if (word) taught.add(word);
    }
    if (lesson.id === lessonId) { found = true; break; }
  }
  return found ? taught : new Set();
}

/** 一个词形可能对应的 lemma（含变位反查）。 */
export function lemmasOf(word) {
  const out = new Set(candidates(word));
  for (const form of candidates(word)) {
    for (const lemma of DICT_FORMS[form] || []) out.add(lemma.toLowerCase());
  }
  return out;
}

/** 是实词吗（名词/动词/形容词/副词）。查不到词性的一律不算，宁可少算。 */
export function isContentWord(word) {
  for (const lemma of lemmasOf(word)) {
    const capitalized = lemma.charAt(0).toUpperCase() + lemma.slice(1);
    const tags = DICT_POS[lemma] || DICT_POS[capitalized] || [];
    if (tags.some(tag => CONTENT_POS.test(tag))) return true;
  }
  return false;
}

/**
 * reuseStats(text, lessonId, { proper, newLemmas })
 * 分母不含专名，也不含作者已声明的生词——生词本来就是要教的新东西，
 * 把它算进分母等于因为「引入新词」而惩罚内容，那是 newLemmaRange 该管的事。
 */
export function reuseStats(text, lessonId, { proper = [], newLemmas = [], grammarPrereqs = [] } = {}) {
  const taught = taughtUpTo(lessonId);
  for (const lemma of grammarTaught(grammarPrereqs)) taught.add(lemma);
  const properSet = new Set(proper.map(word => String(word).toLowerCase()));
  const newSet = new Set(newLemmas.map(word => String(word).toLowerCase()));
  const reused = [];
  const cold = [];
  let declaredNew = 0;
  for (const word of words(text)) {
    const low = word.toLowerCase();
    if (word.length < 2 || properSet.has(low) || !isContentWord(word)) continue;
    const lemmas = [...lemmasOf(word)];
    if (lemmas.some(lemma => newSet.has(lemma))) { declaredNew += 1; continue; }
    if (lemmas.some(lemma => taught.has(lemma))) reused.push(word);
    else cold.push(word);
  }
  const total = reused.length + cold.length;
  return {
    taughtCount: taught.size,
    contentWords: total,
    reused: reused.length,
    declaredNew,
    coldWords: [...new Set(cold)],
    ratio: total ? reused.length / total : 1,
  };
}

// 早期阶段课程词池很小（L1/R1 只有 21 词），要求和后期一样高就只能写出病句。
// 门槛跟着可用词池走，但每一档都要求「多数实词是学过的」。
const STAGE_FLOOR = { 1: 0.45, 2: 0.55, 3: 0.55, 4: 0.7, 5: 0.7, 6: 0.7 };

export function reuseFloor(skillStage) {
  const stage = Number(String(skillStage || '').replace(/\D/g, '')) || 1;
  return STAGE_FLOOR[stage] ?? 0.7;
}

/** 一篇内容的课程词复用是否达标。 */
export function reuseCheck(item) {
  const text = item.sentences.map(sentence => sentence.de).join(' ');
  const stats = reuseStats(text, item.recommendedAfter, {
    proper: item.properNouns,
    newLemmas: item.newLemmas,
    grammarPrereqs: item.grammarPrereqs,
  });
  const floor = reuseFloor(item.skillStage);
  return { id: item.id, floor, ...stats, pass: stats.ratio >= floor };
}
