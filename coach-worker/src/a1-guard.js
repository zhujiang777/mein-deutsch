// 今日文章的出口闸门。规格见 docs/product-shape.md 第 4 条。
//
// AI 生成的东西一律不可信，所以它的产物必须过这道闸才能进学习流程：
// 过不了就重生成，连续过不了就退回库里的现成材料——学习流程任何时候都不能中断。
//
// 最硬的一条是 seed-coverage：文章必须真的用上今天背的词。
// 一篇通顺但没用上今天那些词的 A1 短文，跟成熟软件里预写好的那些没有任何区别，
// 也就没有存在的理由。
import { VOCAB } from '../../data/vocab.js';

// 结构词与专名：它们不在词卡里，但零基础从第一天就见得到，不该算成"新词"。
const SAFE_WORDS = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'ihnen', 'ihn', 'mich', 'dich', 'uns',
  'mein', 'meine', 'meinen', 'dein', 'deine', 'sein', 'seine', 'unser', 'unsere',
  'ein', 'eine', 'einen', 'einem', 'einer', 'der', 'die', 'das', 'den', 'dem', 'des',
  'ist', 'bin', 'bist', 'sind', 'seid', 'war', 'nicht', 'kein', 'keine', 'ja', 'nein',
  'und', 'oder', 'aber', 'denn', 'auch', 'sehr', 'hier', 'dort', 'da', 'noch', 'schon',
  'in', 'an', 'auf', 'zu', 'zum', 'zur', 'mit', 'für', 'von', 'vom', 'bei', 'nach', 'um',
  'wie', 'was', 'wo', 'wer', 'wann', 'warum', 'wohin',
  'china', 'deutschland', 'berlin', 'münchen', 'anna', 'lena', 'zhu',
]);

function addWords(set, text) {
  String(text || '').toLocaleLowerCase('de-DE')
    .match(/[a-zäöüß]+/giu)?.forEach(word => set.add(word));
}

const A1_WORDS = new Set(SAFE_WORDS);
for (const word of VOCAB) {
  addWords(A1_WORDS, word.de);
  addWords(A1_WORDS, word.pl);
  Object.values(word.forms || {}).forEach(value => addWords(A1_WORDS, value));
  (word.phrases || []).forEach(item => addWords(A1_WORDS, item.de));
  (word.sentences || []).forEach(item => addWords(A1_WORDS, item.de));
}

// Goethe A1 考纲里没有从句：连词只有 und/oder/aber/denn/also/auch。
// 第二格介词、被动、Präteritum 同理——见到即判不合格，不讨价还价。
const BANNED_GRAMMAR = [
  { code: 'subordinate-clause', re: /\b(weil|dass|obwohl|während|falls|sodass|wenn|damit)\b/iu },
  { code: 'genitive-preposition', re: /\b(trotz|wegen|innerhalb|außerhalb|aufgrund)\b/iu },
  { code: 'passive-voice', re: /\b(wird|werden|wurde|wurden)\s+\w+t\b/iu },
  { code: 'preterite', re: /\b(hatte|hatten|ging|kam|sah|sprach|machte|fuhr|gab)\b/iu },
];

export const ARTICLE_LIMITS = {
  minSentences: 3,
  maxSentences: 6,
  maxWordsPerSentence: 12,
  maxNewWords: 3,
  minKnownRatio: 0.9,
};

/**
 * 词组（Guten Morgen、Wie geht's）没法按单词命中，用整串匹配，匹配不上也不计入门槛——
 * 否则词表里混进几个词组，门槛就被凭空抬高，好文章也会被判不合格。
 */
function isPhrase(seed) {
  return /\s/u.test(String(seed || '').trim());
}

/**
 * 种子词是原形，文章里是变形。用前缀匹配收词形变化（fahren → fährt、Karte → Karten），
 * 短词要求全等，避免 wo 把 Wohnung 也算成命中。
 */
function hitsSeed(seed, words) {
  const stem = String(seed || '').toLocaleLowerCase('de-DE');
  if (!stem) return false;
  if (words.has(stem)) return true;
  if (stem.length < 5) return false;
  const prefix = stem.slice(0, Math.max(4, stem.length - 2));
  for (const word of words) if (word.startsWith(prefix)) return true;
  return false;
}

/** 今天必须命中的种子数：可匹配种子的一半，且至少 2 个。没有种子时这条不生效。 */
export function requiredSeedHits(seedWords) {
  const count = Array.isArray(seedWords)
    ? seedWords.filter(seed => seed && !isPhrase(seed)).length
    : Number(seedWords) || 0;
  if (!count) return 0;
  return Math.max(2, Math.ceil(count / 2));
}

export function auditArticle(article, { knownWords = [], seedWords = [] } = {}) {
  const flags = [];
  const sentences = Array.isArray(article?.sentences) ? article.sentences : [];
  if (sentences.length < ARTICLE_LIMITS.minSentences) flags.push('too-few-sentences');
  if (sentences.length > ARTICLE_LIMITS.maxSentences) flags.push('too-many-sentences');

  const allowed = new Set(A1_WORDS);
  knownWords.slice(0, 400).forEach(word => addWords(allowed, word));
  seedWords.slice(0, 40).forEach(word => addWords(allowed, word));

  const used = new Set();
  const unknown = new Set();
  let total = 0;

  for (const sentence of sentences) {
    const de = String(sentence?.de || '');
    if (!de || !String(sentence?.zh || '')) flags.push('missing-translation');
    if (/[<>]|https?:\/\/|```|\[[^\]]+\]\(/u.test(de)) flags.push('unsafe-markup');
    const words = de.match(/[a-zäöüß]+/giu) || [];
    if (words.length > ARTICLE_LIMITS.maxWordsPerSentence) flags.push('sentence-too-long');
    words.forEach(word => {
      const normalized = word.toLocaleLowerCase('de-DE');
      used.add(normalized);
      total += 1;
      if (!allowed.has(normalized)) unknown.add(normalized);
    });
    BANNED_GRAMMAR.forEach(rule => { if (rule.re.test(de)) flags.push(rule.code); });
  }

  if (unknown.size > ARTICLE_LIMITS.maxNewWords) flags.push('too-many-new-words');
  const knownRatio = total ? (total - unknown.size) / total : 0;
  if (total && knownRatio < ARTICLE_LIMITS.minKnownRatio) flags.push('known-ratio-too-low');

  // ⚠️ 最硬的一条：没用上今天的词，这篇就没有存在的理由。
  const seedHits = seedWords.filter(seed => (isPhrase(seed)
    ? sentences.some(sentence => String(sentence?.de || '').toLocaleLowerCase('de-DE')
        .includes(String(seed).toLocaleLowerCase('de-DE')))
    : hitsSeed(seed, used)));
  const need = requiredSeedHits(seedWords);
  if (seedHits.length < need) flags.push('seed-coverage-too-low');

  return {
    ok: flags.length === 0,
    flags: [...new Set(flags)],
    newWords: [...unknown].slice(0, 8),
    knownRatio: Math.round(knownRatio * 100) / 100,
    seedHits,
    seedNeed: need,
  };
}
