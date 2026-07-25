// 内容 → 词汇 id 的自动标注。
//
// 为什么不手写：作者手挑 2–5 个 id 时，一篇 60 词的文章只有 3 个词进推荐信号，
// 强度接近噪声——js/recur.js 的推荐引擎和 readiness 标签都建立在这个信号上，
// 信号假了，上层再精巧也没用。实测自动标注后信号量是手挑的 4.9 倍，
// 而且"刚背完住房主题"这类场景下能把对应内容真正排到前面（手挑时全是 0 分并列）。
import { VOCAB } from '../data/vocab.js';
import { DICT_FORMS, DICT_POS } from '../data/dict-core.js';
import { candidates, words } from './a1-coverage.mjs';

// 词形 → VOCAB id。合并词条（"eins, zwei, drei"）与多词短语都拆开登记，
// 否则 buildQueue 里线性推进的那些词永远匹配不上正文。
const FORM_TO_ID = new Map();
for (const entry of VOCAB) {
  for (const part of String(entry.de).split(/[,，/]/)) {
    const whole = part.trim().toLowerCase();
    if (whole && !FORM_TO_ID.has(whole)) FORM_TO_ID.set(whole, entry.id);
    for (const token of part.match(/\p{L}+/gu) || []) {
      const key = token.toLowerCase();
      // 2 字母以下的碎片（"ist" 之类的介词残片）匹配噪声太大，跳过。
      if (key.length > 2 && !FORM_TO_ID.has(key)) FORM_TO_ID.set(key, entry.id);
    }
  }
}

/** 一个词形对应的 VOCAB id，找不到返回 null。含变位反查。 */
export function vocabIdFor(word) {
  for (const form of candidates(word)) {
    if (FORM_TO_ID.has(form)) return FORM_TO_ID.get(form);
    for (const lemma of DICT_FORMS[form] || []) {
      const id = FORM_TO_ID.get(lemma.toLowerCase());
      if (id) return id;
    }
  }
  return null;
}

const CONTENT_POS = /^(n\.|v\.|adj\.)$/;
const isContentWord = word => candidates(word).some(form => {
  const capitalized = form.charAt(0).toUpperCase() + form.slice(1);
  const tags = DICT_POS[form] || DICT_POS[capitalized] || [];
  if (tags.some(tag => CONTENT_POS.test(tag))) return true;
  return (DICT_FORMS[form] || []).some(lemma =>
    (DICT_POS[lemma] || []).some(tag => CONTENT_POS.test(tag)));
});

/**
 * 一份内容正文里实际出现的 VOCAB id（按首次出现排序）。
 * 只收实词：推荐"复现你最近学的 und"没有意义，而且分子收功能词、
 * 分母只数实词会让 readiness 算出超过 100% 的已知率。
 */
export function autoVocabRefs(item) {
  const ids = new Set();
  for (const sentence of item.sentences || []) {
    for (const word of words(sentence.de)) {
      if (word.length < 2 || !isContentWord(word)) continue;
      const id = vocabIdFor(word);
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

/**
 * 正文里的实词总数（去重）。这是 readiness 的正确分母：
 * 只数「有词卡的词」会让分母漏掉 Unterführung/Apotheke 这类真正造成困难的生词，
 * 算出来的已知率必然接近 100%，标签永远显示「适合复习」。
 */
export function contentWordCount(item) {
  const seen = new Set();
  for (const sentence of item.sentences || []) {
    for (const word of words(sentence.de)) {
      if (word.length < 2 || !isContentWord(word)) continue;
      seen.add(vocabIdFor(word) || word.toLowerCase());
    }
  }
  return seen.size;
}

/** { contentId: [wordId…] } 与 { contentId: 实词总数 }，供 gen_content_index 写进生成物。 */
export function buildContentVocab(items) {
  const out = {};
  for (const item of items) {
    const refs = autoVocabRefs(item);
    if (refs.length) out[item.id] = refs;
  }
  return out;
}

export function buildContentWordCounts(items) {
  const out = {};
  for (const item of items) {
    const total = contentWordCount(item);
    if (total) out[item.id] = total;
  }
  return out;
}
