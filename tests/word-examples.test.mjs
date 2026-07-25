import test from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB } from '../data/vocab.js';
import { EXAMPLE_SENTENCES, WORD_EXAMPLES, wordExamples } from '../data/word-examples.js';
import { buildWordExamples, buildWordExamplesSource, MAX_PER_WORD } from '../tools/word-examples.mjs';
import { normalizeWord, getVocabWord } from '../js/word-model.js';
import { vocabIdFor } from '../tools/auto-vocab-refs.mjs';
import { words } from '../tools/a1-coverage.mjs';
import { readFileSync } from 'node:fs';

const VOCAB_IDS = new Set(VOCAB.map(word => word.id));

test('生成物与当前内容一致（改了课文/精读/精听要重跑 gen_word_examples）', () => {
  const onDisk = readFileSync(new URL('../data/word-examples.js', import.meta.url), 'utf8');
  assert.equal(onDisk, buildWordExamplesSource());
});

test('每词例句不超过上限，且都指向真实词条', () => {
  for (const [wordId, refs] of Object.entries(WORD_EXAMPLES)) {
    assert.ok(VOCAB_IDS.has(wordId), `${wordId} 不是真实词条`);
    assert.ok(refs.length <= MAX_PER_WORD, `${wordId} 有 ${refs.length} 条，超过上限 ${MAX_PER_WORD}`);
    for (const index of refs) assert.ok(EXAMPLE_SENTENCES[index], `${wordId} 引用了越界下标 ${index}`);
  }
});

test('例句里确实出现了这个词，中德文都不为空', () => {
  // 用和生成器同一套反查来断言，否则 Bruder → Brüder 这种变元音复数会被误判。
  for (const [wordId, refs] of Object.entries(WORD_EXAMPLES)) {
    const word = getVocabWord(wordId);
    for (const example of wordExamples(wordId)) {
      assert.ok(example.de && example.zh, `${wordId} 的例句缺德文或中文`);
      assert.ok(example.source, `${wordId} 的例句没有出处，词卡上就跳不回原文`);
      const hit = words(example.de).some(token => vocabIdFor(token) === wordId);
      assert.ok(hit, `${word.de} 的例句里找不到它：${example.de}`);
    }
    assert.ok(refs.length, `${wordId} 有键但没有例句`);
  }
});

test('去重后同一句话只存一份', () => {
  const texts = EXAMPLE_SENTENCES.map(([de]) => de);
  assert.equal(new Set(texts).size, texts.length, '句子表里有重复');
  const refs = Object.values(WORD_EXAMPLES).flat().length;
  assert.ok(refs > texts.length, '句子没有被跨词复用，去重没有起作用');
});

test('词卡把真实语境例句合并进来，且不与手写例句近重复', () => {
  const jaccard = (a, b) => {
    const A = new Set((a.match(/\p{L}+/gu) || []).map(w => w.toLowerCase()));
    const B = new Set((b.match(/\p{L}+/gu) || []).map(w => w.toLowerCase()));
    let shared = 0;
    for (const t of A) if (B.has(t)) shared += 1;
    return shared / (A.size + B.size - shared || 1);
  };
  let linked = 0;
  for (const word of VOCAB) {
    const model = normalizeWord(word);
    const texts = model.sentences.map(sentence => sentence.de);
    assert.equal(new Set(texts).size, texts.length, `${word.de} 合并后出现完全重复的例句`);
    for (let i = 0; i < texts.length; i += 1) {
      for (let j = i + 1; j < texts.length; j += 1) {
        assert.ok(jaccard(texts[i], texts[j]) <= 0.6,
          `${word.de} 的例句近重复：「${texts[i]}」/「${texts[j]}」`);
      }
    }
    if (model.sentences.some(sentence => sentence.source)) linked += 1;
  }
  // 守住联动本身：多数词卡要能跳回它真实出现过的地方。
  assert.ok(linked / VOCAB.length > 0.7, `只有 ${linked}/${VOCAB.length} 个词卡有出处链接`);
});

test('覆盖率达标：多数词能在真实语料里找到例句', () => {
  const covered = Object.keys(buildWordExamples()).length;
  assert.ok(covered / VOCAB.length > 0.7,
    `只有 ${covered}/${VOCAB.length} 个词有真实例句，语料覆盖不足`);
});
