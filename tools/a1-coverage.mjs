// A1 词表覆盖率：判断一句德语里有多少词落在我们的词库内。
// 用途一：精听/阅读包的生词把关（tests/listening-data.test.mjs）。
// 用途二：从 Tatoeba / Wikinews 几十万句里筛出 A1 可用句（tools/filter_a1.mjs，S5）。
//
// 判定是「难度估算」不是「词法分析」——宁可偶尔把 teile 归到 Teil 名下，
// 也不要因为词典缺一个变位形就把一句正常的 A1 德语判成超纲。
import { DICT_ENTRIES, DICT_FORMS } from '../data/dict-core.js';

const LEMMAS = new Set(Object.keys(DICT_ENTRIES).map(k => k.toLowerCase()));

// 介词+冠词缩合。词典只收词根，这些形式永远查不到。
export const CONTRACTIONS = {
  im: 'in', ins: 'in', am: 'an', ans: 'an', beim: 'bei', zum: 'zu', zur: 'zu',
  vom: 'von', aufs: 'auf', fürs: 'für', durchs: 'durch', ums: 'um', hinters: 'hinter',
};

// 冠词/物主代词的格变化：词干 + 格尾。
const DET_STEMS = ['ein', 'kein', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer'];
const DET_SUFFIXES = ['en', 'em', 'es', 'er', 'e'];

// 保守的后缀剥离：复数、三格 -e、常见动词人称尾。只剥不加。
const STRIP = ['en', 'er', 'st', 'te', 'n', 'e', 's', 't'];

/** 一句话切成词（含 ä/ö/ü/ß，排除数字与标点）。 */
export function words(text) {
  return String(text || '').match(/\p{L}+/gu) || [];
}

/** 一个词形可能对应的词典键，按可信度排序。 */
export function candidates(word) {
  const low = String(word || '').toLowerCase();
  const out = [low];
  if (CONTRACTIONS[low]) out.push(CONTRACTIONS[low]);
  for (const stem of DET_STEMS) {
    if (low === stem) break;
    for (const suffix of DET_SUFFIXES) {
      if (low === stem + suffix) out.push(stem);
    }
  }
  for (const suffix of STRIP) {
    if (low.length > suffix.length + 2 && low.endsWith(suffix)) {
      out.push(low.slice(0, -suffix.length));
    }
  }
  return out;
}

/** 这个词形在词库里吗（含变位反查与上述归一化）。 */
export function isKnown(word) {
  for (const form of candidates(word)) {
    if (LEMMAS.has(form) || DICT_FORMS[form]) return true;
  }
  return false;
}

// 可分动词前缀。声明了 stattfinden，被甩到句尾的 statt 就不是另一个生词。
const SEPARABLE_PREFIXES = ['ab', 'an', 'auf', 'aus', 'ein', 'mit', 'nach', 'vor',
  'zurück', 'zusammen', 'weg', 'los', 'statt', 'fest'];

/** 已声明 lemma 的常规屈折形。只按德语构词加尾，不做前缀模糊匹配。 */
function declaredForms(lemma) {
  const low = String(lemma || '').toLowerCase();
  const out = new Set([low]);
  for (const suffix of ['n', 'en', 'e', 'er', 'es', 's', 't', 'st', 'et']) out.add(low + suffix);
  if (low.endsWith('en')) {                       // 动词：规则变位
    const stem = low.slice(0, -2);
    for (const suffix of ['e', 'st', 't', 'et', 'est']) out.add(stem + suffix);
    const prefix = SEPARABLE_PREFIXES.find(p => low.startsWith(p) && low.length > p.length + 3);
    if (prefix) out.add(prefix);
  }
  return out;
}

/**
 * coverage(text, { declared, proper })
 *   declared —— 作者已显式声明的生词（精听包的 newLemmas）
 *   proper   —— 专名白名单
 * 返回 { total, known, ratio, unknown[] }
 */
export function coverage(text, { declared = [], proper = [] } = {}) {
  const skip = new Set(proper.map(w => String(w).toLowerCase()));
  for (const lemma of declared) for (const form of declaredForms(lemma)) skip.add(form);
  const list = words(text);
  const unknown = [];
  let known = 0;
  for (const word of list) {
    // 单个字母是拼读练习的产物（"A, Y, D, I, N"），不构成词汇负担。
    const declaredKnown = word.length === 1
      || skip.has(word.toLowerCase())
      || candidates(word).some(form => skip.has(form));
    if (declaredKnown || isKnown(word)) known++;
    else unknown.push(word);
  }
  return { total: list.length, known, ratio: list.length ? known / list.length : 1, unknown };
}
