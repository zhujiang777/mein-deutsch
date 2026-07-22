import { VOCAB } from '../data/vocab.js';

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

/** Normalize old and new vocabulary records into one presentation model. */
export function normalizeWord(word) {
  if (!word) return null;
  return {
    ...word,
    senses: word.senses?.length ? word.senses : [{ pos: word.art ? 'n.' : '', zh: word.zh || '' }],
    sentences: word.sentences?.length ? word.sentences
      : word.ex ? [{ de: word.ex, zh: word.exZh || '', source: null }]
        : word.sentence ? [{ de: word.sentence, zh: '', source: word.source || null }]
          : [],
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
