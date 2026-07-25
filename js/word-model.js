import { VOCAB } from '../data/vocab.js';
import { wordExamples } from '../data/word-examples.js';

const vocabById = new Map(VOCAB.map(word => [word.id, word]));

export const FORM_LABELS = [
  ['ich', 'ich'],
  ['du', 'du'],
  ['er', 'er/sie/es'],
  ['wir', 'wir'],
  ['ihr', 'ihr'],
  ['sie', 'sie/Sie'],
];

export const EXTRA_FORM_LABELS = [
  ['perfekt', 'Perfekt'],
  ['praeteritum', 'Präteritum'],
];

export function getVocabWord(id) {
  return vocabById.get(id) || null;
}

const tokenSet = text => new Set((String(text).match(/\p{L}+/gu) || []).map(word => word.toLowerCase()));

function similarity(a, b) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  const union = a.size + b.size - shared;
  return union ? shared / union : 0;
}

const MAX_SENTENCES = 4;
// 手写例句最多占 2 条。否则例句丰富的词（Bahnhof 自带 4 条）会把位置占满，
// 真实语境例句永远显示不出来——偏偏这些词才是最该展示联动的。
const MAX_AUTHORED = 2;

/** 手写例句 + 真实语境例句，按文本去重，上限 MAX_SENTENCES。 */
function mergeSentences(word) {
  const authored = word.sentences?.length ? word.sentences
    : word.ex ? [{ de: word.ex, zh: word.exZh || '', source: null }]
      : word.sentence ? [{ de: word.sentence, zh: '', source: word.source || null }]
        : [];
  const out = [];
  const taken = [];
  const take = sentence => {
    const key = sentence.de?.trim();
    if (!key || out.length >= MAX_SENTENCES) return;
    const tokens = tokenSet(key);
    // 手写与真实语境例句常常撞车（"Wie komme ich zum Bahnhof?" 对
    // "Entschuldigung, wie komme ich zum Bahnhof?"），只比字符串挡不住。
    if (taken.some(prev => similarity(prev, tokens) > 0.6)) return;
    taken.push(tokens);
    out.push(sentence);
  };
  authored.slice(0, MAX_AUTHORED).forEach(take);
  wordExamples(word.id).forEach(take);
  authored.slice(MAX_AUTHORED).forEach(take);   // 还有空位再补回手写的
  return out;
}

/** Normalize old and new vocabulary records into one presentation model. */
export function normalizeWord(word) {
  if (!word) return null;
  return {
    ...word,
    senses: word.senses?.length ? word.senses : [{ pos: word.art ? 'n.' : '', zh: word.zh || '' }],
    // 手写例句优先（作者挑过的），再补真实语境里抽出来的。
    // 这条是「背单词 ↔ 语料」联动的落点：背到 Bahnhof 就能看到它在哪节课、
    // 哪篇精读里真的被用过，点进去就是原文。
    sentences: mergeSentences(word),
    mnemonic: word.mnemonic || null,
    spoken: word.art ? `${word.art} ${word.de}` : word.de,
    phrases: word.phrases || [],
    forms: word.forms || null,
    valence: word.valence || null,
  };
}

export function conjugationRows(word) {
  const model = normalizeWord(word);
  if (!model?.forms) return { persons: [], extras: [] };
  return {
    persons: FORM_LABELS
      .filter(([key]) => model.forms[key])
      .map(([key, label]) => ({ key, label, value: model.forms[key] })),
    extras: EXTRA_FORM_LABELS
      .filter(([key]) => model.forms[key])
      .map(([key, label]) => ({ key, label, value: model.forms[key] })),
  };
}
