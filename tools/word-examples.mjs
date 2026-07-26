// 每个词的「最佳例句」索引。
//
// 为什么不做全量反向索引：现在 22 份内容就有 440 对词-内容映射；语料层一旦接进来
// （几千句 × 每句 ~8 个实词），全量索引会到 MB 级，静态 PWA 吃不消。
// 所以只保留每词至多 MAX_PER_WORD 条，并且「选哪几条」用的就是推荐引擎那套标准——
// 一个引擎两个用途，不另造轮子。
import { COURSE } from '../data/course.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { words } from './a1-coverage.mjs';
import { vocabIdFor } from './auto-vocab-refs.mjs';

export const MAX_PER_WORD = 3;
const MIN_WORDS = 4;   // 太短没有语境，学不到搭配
const MAX_WORDS = 14;  // 太长了当例句读不动

// 来源分层：课程句子是被讲解过的，最适合当例句；精听句自带真人音频，其次；
// 精读句最多但没有单独音频。差距刻意做得小，主要还是让覆盖率决定。
const TIER = { lesson: 6, listening: 4, reading: 2 };

export function collectCandidates() {
  const out = [];
  const push = (de, zh, source, kind) => {
    if (!de || !zh) return;
    out.push({ de: de.trim(), zh: zh.trim(), source, kind });
  };
  for (const unit of COURSE) {
    for (const lesson of unit.lessons) {
      for (const step of lesson.steps || []) {
        for (const line of step.lines || []) push(line.de, line.zh, `lesson:${lesson.id}`, 'lesson');
      }
    }
  }
  for (const reading of READINGS) {
    for (const sentence of reading.sentences || []) push(sentence.de, sentence.zh, reading.id, 'reading');
  }
  for (const pack of LISTENING_PACKS) {
    for (const sentence of pack.sentences || []) push(sentence.de, sentence.zh, pack.id, 'listening');
  }
  return out;
}

/**
 * 句子质量分。核心是 i+1：句子里除目标词以外，其他词越是「学得到的词」，
 * 这句越适合当例句——生成时不知道用户学到哪，所以用「有多少词能在词汇站查到」
 * 作为静态代理。
 */
function scoreSentence(candidate, targetId) {
  const tokens = words(candidate.de).filter(word => word.length > 1);
  if (!tokens.length) return -1;
  let known = 0;
  for (const token of tokens) {
    const id = vocabIdFor(token);
    if (id && id !== targetId) known += 1;
  }
  const coverage = known / tokens.length;
  const lengthFit = tokens.length >= MIN_WORDS && tokens.length <= MAX_WORDS
    ? 1 - Math.abs(tokens.length - 8) / 10
    : 0;
  return coverage * 100 + lengthFit * 20 + (TIER[candidate.kind] || 0);
}

const tokenSet = text => new Set(words(text).map(word => word.toLowerCase()));

/** 两句话的 token 重合度（Jaccard）。1 = 完全相同，0 = 毫无交集。 */
function similarity(a, b) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  const union = a.size + b.size - shared;
  return union ? shared / union : 0;
}

/** { wordId: [{de, zh, source}] }，每词至多 MAX_PER_WORD 条，来源与语境都尽量不重复。 */
export function buildWordExamples(candidates = collectCandidates()) {
  const byWord = new Map();
  for (const candidate of candidates) {
    const seen = new Set();
    for (const token of words(candidate.de)) {
      const id = vocabIdFor(token);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      if (!byWord.has(id)) byWord.set(id, []);
      byWord.get(id).push(candidate);
    }
  }
  const out = {};
  for (const [wordId, list] of byWord) {
    const ranked = list
      .map(candidate => ({ candidate, score: scoreSentence(candidate, wordId) }))
      .filter(entry => entry.score >= 0)
      .sort((a, b) => b.score - a.score);
    const picked = [];
    const usedSources = new Set();
    const pickedTokens = [];
    // 先每个来源取最好的一条，保证语境不重复；不够再放宽。
    for (const pass of [true, false]) {
      for (const { candidate } of ranked) {
        if (picked.length >= MAX_PER_WORD) break;
        if (pass && usedSources.has(candidate.source)) continue;
        const tokens = tokenSet(candidate.de);
        // 课文里常有「Ich habe einen Termin um zehn Uhr.」和
        // 「Guten Tag! Ich habe einen Termin um zehn Uhr.」这种近重复，
        // 只做精确去重挡不住，两条占了位置却只给一个语境。
        if (pickedTokens.some(prev => similarity(prev, tokens) > 0.6)) continue;
        picked.push({ de: candidate.de, zh: candidate.zh, source: candidate.source });
        usedSources.add(candidate.source);
        pickedTokens.push(tokens);
      }
    }
    if (picked.length) out[wordId] = picked;
  }
  return out;
}

/**
 * 同一句话通常是好几个词的例句（"Wie komme ich zum Bahnhof?" 同时服务 kommen 和 Bahnhof），
 * 逐词存整句会把文件撑到三倍。改成句子表 + 下标引用。
 */
export function dedupe(index) {
  const sentences = [];
  const seen = new Map();
  const refs = {};
  for (const [wordId, list] of Object.entries(index)) {
    refs[wordId] = list.map(sentence => {
      const key = sentence.de;
      if (!seen.has(key)) {
        seen.set(key, sentences.length);
        sentences.push([sentence.de, sentence.zh, sentence.source]);
      }
      return seen.get(key);
    });
  }
  return { sentences, refs };
}

export function buildWordExamplesSource(index = buildWordExamples()) {
  const { sentences, refs } = dedupe(index);
  return `// 此文件由 scripts/gen_word_examples.mjs 自动生成，请勿手改。
// 每个词至多 ${MAX_PER_WORD} 条真实语境例句，选取标准见 tools/word-examples.mjs。
// EXAMPLE_SENTENCES 是 [de, zh, source] 三元组；WORD_EXAMPLES 存下标，避免同句重复存储。
export const EXAMPLE_SENTENCES = ${JSON.stringify(sentences)};

export const WORD_EXAMPLES = ${JSON.stringify(refs)};

/** 一个词的例句，展开成 {de, zh, source}。 */
export function wordExamples(wordId) {
  return (WORD_EXAMPLES[wordId] || []).map(index => {
    const [de, zh, source] = EXAMPLE_SENTENCES[index];
    return { de, zh, source };
  });
}
`;
}
