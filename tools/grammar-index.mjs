import { PILOT_LESSONS } from '../data/integrated-course.js';
// 语法点的反向索引：把 g01–g20 从孤岛接回其余模块。
//
// 生成三张表：
//   GRAMMAR_EXAMPLES —— 每条语法在课文/精读/精听里的真实实例句（"你在哪儿见过它"）
//   GRAMMAR_LESSON_REFS —— 哪些微步课在教它（靠共享 skills 标签求交集，不手写映射）
//   CONTENT_GRAMMAR —— 每份内容需要哪些语法（needs，作者声明）、演示了哪些（shows，检测得出）
//
// 上限与 word-examples 同理：语料层接进来后全量索引会膨胀，每条语法封顶
// MAX_PER_GRAMMAR 条，选哪几条用同一套 i+1 打分。
import { COURSE } from '../data/course.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { GRAMMAR_LESSONS, grammarIdsForPrereqs } from '../data/grammar.js';
import { detectGrammar } from './grammar-detect.mjs';
import { collectCandidates } from './word-examples.mjs';
import { words } from './a1-coverage.mjs';
import { vocabIdFor } from './auto-vocab-refs.mjs';

export const MAX_PER_GRAMMAR = 6;
export const MAX_SHOWS = 4;
const MIN_WORDS = 4;
const MAX_WORDS = 14;
const TIER = { lesson: 6, listening: 4, reading: 2 };

/**
 * 例句质量分。weight 是「这句有多典型地演示了该语法」（见 grammar-detect），
 * 权重给得比词汇例句高——语法例句选错了，学习者会照着归纳出错的规则。
 */
// 课表/清单类片段（"09:00 Wörter lernen – Raum 2; 10:30 Pause."）语法上没毛病，
// 但当例句读不出结构。数字组超过一处就当它不是句子。
const isFragment = text => (String(text).match(/\d+/g) || []).length >= 2;

function scoreSentence(candidate, weight) {
  if (isFragment(candidate.de)) return -1;
  const tokens = words(candidate.de).filter(word => word.length > 1);
  if (!tokens.length) return -1;
  let known = 0;
  for (const token of tokens) if (vocabIdFor(token)) known += 1;
  const coverage = known / tokens.length;
  const lengthFit = tokens.length >= MIN_WORDS && tokens.length <= MAX_WORDS
    ? 1 - Math.abs(tokens.length - 8) / 10
    : 0;
  return weight * 40 + coverage * 50 + lengthFit * 20 + (TIER[candidate.kind] || 0);
}

const tokenSet = text => new Set(words(text).map(word => word.toLowerCase()));

function similarity(a, b) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  const union = a.size + b.size - shared;
  return union ? shared / union : 0;
}

/** { g##: [{de, zh, source}] }，每条语法至多 MAX_PER_GRAMMAR 条。 */
export function buildGrammarExamples(candidates = collectCandidates()) {
  const byGrammar = new Map();
  for (const candidate of candidates) {
    for (const hit of detectGrammar(candidate.de)) {
      if (!byGrammar.has(hit.id)) byGrammar.set(hit.id, []);
      byGrammar.get(hit.id).push({ candidate, weight: hit.weight });
    }
  }
  const out = {};
  for (const [grammarId, list] of byGrammar) {
    const ranked = list
      .map(entry => ({ ...entry, score: scoreSentence(entry.candidate, entry.weight) }))
      .filter(entry => entry.score >= 0)
      .sort((a, b) => b.score - a.score);
    const picked = [];
    const usedSources = new Set();
    const pickedTokens = [];
    // 先每个来源取最好的一条，语境不重复；不够再放宽。
    for (const pass of [true, false]) {
      for (const { candidate } of ranked) {
        if (picked.length >= MAX_PER_GRAMMAR) break;
        if (pass && usedSources.has(candidate.source)) continue;
        const tokens = tokenSet(candidate.de);
        if (pickedTokens.some(prev => similarity(prev, tokens) > 0.6)) continue;
        picked.push({ de: candidate.de, zh: candidate.zh, source: candidate.source });
        usedSources.add(candidate.source);
        pickedTokens.push(tokens);
      }
    }
    if (picked.length) out[grammarId] = picked;
  }
  return out;
}

/** { g##: [微步课 id] }：课的 skills 与语法课 skills 有交集即算在教它。 */
export function buildGrammarLessonRefs() {
  const out = {};
  for (const grammar of GRAMMAR_LESSONS) {
    const wanted = new Set(grammar.skills);
    const hits = [];
    for (const unit of COURSE) {
      for (const lesson of unit.lessons) {
        const lessonSkills = new Set([
          ...(lesson.skills || []),
          ...(lesson.steps || []).flatMap(step => step.skills || []),
        ]);
        if ([...lessonSkills].some(skill => wanted.has(skill))) hits.push(lesson.id);
      }
    }
    if (hits.length) out[grammar.id] = hits;
  }
  return out;
}

/**
 * { 内容 id: { needs, shows } }
 *   needs —— 作者在 grammarPrereqs 里声明的前置语法（门禁口径，可为空）
 *   shows —— 正文里检测到的语法（"这篇能练到什么"，永远来自真实文本）
 * 两者刻意分开：needs 是承诺，shows 是事实，混在一起就分不清哪个是哪个了。
 */
export function buildContentGrammar(items = [...READINGS, ...LISTENING_PACKS]) {
  const out = {};
  for (const item of items) {
    const weights = new Map();
    for (const sentence of item.sentences || []) {
      for (const hit of detectGrammar(sentence.de)) {
        weights.set(hit.id, (weights.get(hit.id) || 0) + hit.weight);
      }
    }
    const shows = [...weights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SHOWS)
      .map(([id]) => id)
      .sort();
    const needs = grammarIdsForPrereqs(item.grammarPrereqs || []);
    if (needs.length || shows.length) out[item.id] = { needs, shows };
  }
  return out;
}

export function buildGrammarIndex() {
  return {
    examples: buildGrammarExamples(),
    lessonRefs: buildGrammarLessonRefs(),
    contentGrammar: buildContentGrammar(),
  };
}

/** 同一句常常同时演示好几条语法，存句子表 + 下标，避免重复存储。 */
export function dedupe(examples) {
  const sentences = [];
  const seen = new Map();
  const refs = {};
  for (const [grammarId, list] of Object.entries(examples)) {
    refs[grammarId] = list.map(sentence => {
      if (!seen.has(sentence.de)) {
        seen.set(sentence.de, sentences.length);
        sentences.push([sentence.de, sentence.zh, sentence.source]);
      }
      return seen.get(sentence.de);
    });
  }
  return { sentences, refs };
}

export function buildGrammarIndexSource(index = buildGrammarIndex()) {
  const { sentences, refs } = dedupe(index.examples);
  const contentGrammar = {};
  for (const [id, entry] of Object.entries(index.contentGrammar)) {
    contentGrammar[id] = [entry.needs, entry.shows];
  }
  return `// 此文件由 scripts/gen_grammar_index.mjs 自动生成，请勿手改。
// 改了 data/grammar.js 的 skills / PREREQ_TO_GRAMMAR、或改了任何课文正文，都要重跑。
export const INTEGRATED_GRAMMAR_REFS = ${JSON.stringify(Object.fromEntries(GRAMMAR_LESSONS.map(g=>[g.id,PILOT_LESSONS.filter(l=>l.grammarRefs.includes(g.id)).map(l=>({id:l.id,title:l.title}))])))};

export const GRAMMAR_SENTENCES = ${JSON.stringify(sentences)};

// 每条语法至多 ${MAX_PER_GRAMMAR} 条真实实例句，存 GRAMMAR_SENTENCES 的下标。
export const GRAMMAR_EXAMPLES = ${JSON.stringify(refs)};

// 哪些微步课在教这条语法（由 skills 标签交集算出，不是手写的）。
export const GRAMMAR_LESSON_REFS = ${JSON.stringify(index.lessonRefs)};

// 内容 id → [needs, shows]：needs 是作者声明的前置语法，shows 是正文里检测到的。
export const CONTENT_GRAMMAR = ${JSON.stringify(contentGrammar)};

/** 一条语法的实例句，展开成 {de, zh, source}。 */
export function grammarExamples(grammarId) {
  return (GRAMMAR_EXAMPLES[grammarId] || []).map(index => {
    const [de, zh, source] = GRAMMAR_SENTENCES[index];
    return { de, zh, source };
  });
}

/** 一条语法在哪些微步课里被教到。 */
export function grammarLessonRefs(grammarId) {
  return GRAMMAR_LESSON_REFS[grammarId] || [];
}

/** 一份内容需要的语法（作者声明）。 */
export function contentGrammarNeeds(item) {
  return CONTENT_GRAMMAR[item?.id]?.[0] || [];
}

/** 一份内容正文里实际演示的语法。 */
export function contentGrammarShows(item) {
  return CONTENT_GRAMMAR[item?.id]?.[1] || [];
}

/** 哪些内容能练到这条语法（needs 或 shows 命中都算）。 */
export function grammarContentRefs(grammarId) {
  return Object.entries(CONTENT_GRAMMAR)
    .filter(([, [needs, shows]]) => needs.includes(grammarId) || shows.includes(grammarId))
    .map(([id]) => id);
}
`;
}
