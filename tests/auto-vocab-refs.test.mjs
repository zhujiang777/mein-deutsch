import test from 'node:test';
import assert from 'node:assert/strict';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { VOCAB } from '../data/vocab.js';
import { CONTENT_VOCAB, contentVocabRefs } from '../data/content-index.js';
import { autoVocabRefs, vocabIdFor, buildContentVocab } from '../tools/auto-vocab-refs.mjs';

const ALL = [...READINGS, ...LISTENING_PACKS];
const VOCAB_IDS = new Set(VOCAB.map(word => word.id));

test('生成的索引与当前内容一致（改了正文要重跑 npm run content:index）', () => {
  assert.deepEqual(CONTENT_VOCAB, buildContentVocab(ALL));
});

test('每个标注出来的 id 都是真实词条', () => {
  for (const [contentId, ids] of Object.entries(CONTENT_VOCAB)) {
    for (const id of ids) assert.ok(VOCAB_IDS.has(id), `${contentId} 引用了不存在的词 ${id}`);
  }
});

test('变位与合并词条都能反查到词', () => {
  // 变位形：wohne → wohnen
  assert.equal(vocabIdFor('wohne'), vocabIdFor('wohnen'));
  // 合并词条 "eins, zwei, drei" 里的任一个都要能命中同一条
  assert.ok(vocabIdFor('drei'));
  assert.equal(vocabIdFor('drei'), vocabIdFor('eins'));
});

test('自动标注的信号强度显著高于手写 vocabRefs', () => {
  // 这条测试守的是本次改动的理由：手挑一篇只标 2–5 个词，
  // 推荐引擎和 readiness 标签都建立在这个信号上，覆盖不足就等于没信号。
  const hand = ALL.reduce((sum, item) => sum + (item.vocabRefs || []).length, 0);
  const auto = ALL.reduce((sum, item) => sum + autoVocabRefs(item).length, 0);
  assert.ok(auto > hand * 3, `自动标注只有 ${auto}，手写 ${hand}，信号没有变强`);
  // 精听包过去一个词都没标，对推荐完全隐形
  for (const pack of LISTENING_PACKS) {
    assert.ok(contentVocabRefs(pack).length > 0, `${pack.id} 没有任何词汇标注`);
  }
});

test('没有索引时回退到手写 vocabRefs，不返回 undefined', () => {
  assert.deepEqual(contentVocabRefs({ id: 'nicht-vorhanden', vocabRefs: ['w001'] }), ['w001']);
  assert.deepEqual(contentVocabRefs({ id: 'nicht-vorhanden' }), []);
  assert.deepEqual(contentVocabRefs(null), []);
});
