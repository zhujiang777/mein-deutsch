import test from 'node:test';
import assert from 'node:assert/strict';
import { auditArticle, requiredSeedHits, ARTICLE_LIMITS } from '../coach-worker/src/a1-guard.js';
import { validateArticleRequest, normalizeArticle } from '../coach-worker/src/schema.js';
import { buildMessages, generateArticle } from '../coach-worker/src/index.js';
import {
  buildArticleRequest, fetchArticle, articleToLesson, pickSpeakIndex, todayStamp, reasonText,
} from '../js/daily-article.js';

const SEEDS = ['Bahnhof', 'fahren', 'Karte', 'kaufen'];

const GOOD = {
  sceneZh: '在火车站',
  titleDe: 'Am Bahnhof',
  titleZh: '在火车站',
  sentences: [
    { de: 'Ich bin am Bahnhof.', zh: '我在火车站。' },
    { de: 'Wo kaufe ich eine Karte?', zh: '我在哪儿买票？' },
    { de: 'Ich fahre nach Berlin.', zh: '我去柏林。' },
  ],
  question: { zh: '他在哪儿？', options: ['在火车站', '在超市'], answer: 0 },
};

/* ---------- 进出口 Schema ---------- */

test('请求只接收学习摘要，多一个字段就整份拒绝', () => {
  const base = { schemaVersion: 1, locale: 'de-DE', level: 'A1', seedWords: SEEDS };
  assert.ok(validateArticleRequest(base));
  // 不上传录音、聊天史、完整进度——多带任何字段都判无效，而不是静默丢掉。
  assert.equal(validateArticleRequest({ ...base, recording: 'xxx' }), null);
  assert.equal(validateArticleRequest({ ...base, level: 'B1' }), null);
  // 没有种子词就没有"给我今天写的"这回事。
  assert.equal(validateArticleRequest({ ...base, seedWords: ['Bahnhof'] }), null);
});

test('模型输出按白名单重建，缺件或多件都作废', () => {
  assert.ok(normalizeArticle(GOOD));
  assert.equal(normalizeArticle({ ...GOOD, extra: 1 }), null, '多一个字段就整份丢掉');
  assert.equal(normalizeArticle({ ...GOOD, question: { ...GOOD.question, answer: 5 } }), null);
  assert.equal(normalizeArticle({ ...GOOD, sentences: [{ de: 'Hallo' }] }), null, '缺中文翻译不收');
  assert.equal(normalizeArticle({ ...GOOD, titleZh: '' }), null);
});

/* ---------- 出口闸门 ---------- */

test('合格的文章能过闸', () => {
  const audit = auditArticle(GOOD, { seedWords: SEEDS, knownWords: ['Berlin'] });
  assert.equal(audit.ok, true, `不该有 flag：${audit.flags.join(',')}`);
  assert.ok(audit.knownRatio >= ARTICLE_LIMITS.minKnownRatio);
});

// 这是整个功能存在的理由：没用上今天的词，这篇跟别人预写好的没有任何区别。
test('没用上今天的词就不合格 —— 这是最硬的一条', () => {
  const off = {
    ...GOOD,
    sentences: [
      { de: 'Ich bin Anna.', zh: '我是安娜。' },
      { de: 'Ich komme aus China.', zh: '我来自中国。' },
      { de: 'Ich lerne Deutsch.', zh: '我学德语。' },
    ],
  };
  const audit = auditArticle(off, { seedWords: SEEDS });
  assert.equal(audit.ok, false);
  assert.ok(audit.flags.includes('seed-coverage-too-low'));
  assert.equal(requiredSeedHits(SEEDS), 2);
  assert.equal(requiredSeedHits([]), 0, '没有种子时这条不生效');
  // 词组没法按单词命中，不能计入门槛——否则词表里混几个词组就把好文章判死。
  assert.equal(requiredSeedHits(['Guten Morgen', 'Wie geht es Ihnen', 'Bahnhof']), 2);
});

test('词形变化算命中：fahren → fahre，Karte → Karten', () => {
  const audit = auditArticle({
    ...GOOD,
    sentences: [
      { de: 'Ich fahre nach Berlin.', zh: '我去柏林。' },
      { de: 'Ich kaufe zwei Karten.', zh: '我买两张票。' },
      { de: 'Der Bahnhof ist dort.', zh: '火车站在那边。' },
    ],
  }, { seedWords: SEEDS });
  assert.ok(audit.seedHits.length >= 3, `实际命中 ${audit.seedHits.join(',')}`);
});

test('A1 红线：从句 / 第二格 / 被动 / 过去时一律判不合格', () => {
  const cases = [
    ['Ich kaufe eine Karte, weil ich fahre.', 'subordinate-clause'],
    ['Wegen der Karte fahre ich zum Bahnhof.', 'genitive-preposition'],
    ['Ich fuhr zum Bahnhof und kaufe eine Karte.', 'preterite'],
  ];
  for (const [de, code] of cases) {
    const audit = auditArticle({ ...GOOD, sentences: [{ de, zh: '…' }, ...GOOD.sentences] }, { seedWords: SEEDS });
    assert.ok(audit.flags.includes(code), `${de} 应该命中 ${code}，实际 ${audit.flags.join(',')}`);
  }
});

test('句数和句长有上限', () => {
  const long = { de: 'Ich fahre heute mit dem Zug nach Berlin und kaufe dort eine Karte.', zh: '…' };
  assert.ok(auditArticle({ ...GOOD, sentences: [long, ...GOOD.sentences] }, { seedWords: SEEDS })
    .flags.includes('sentence-too-long'));
  assert.ok(auditArticle({ ...GOOD, sentences: GOOD.sentences.slice(0, 2) }, { seedWords: SEEDS })
    .flags.includes('too-few-sentences'));
});

/* ---------- Worker 行为 ---------- */

test('没配模型时直接放弃，不假装成功', async () => {
  const result = await generateArticle(validateArticleRequest({
    schemaVersion: 1, locale: 'de-DE', level: 'A1', seedWords: SEEDS,
  }), {});
  assert.equal(result.article, null);
  assert.equal(result.source, 'fallback');
  assert.equal(result.reason, 'not-configured');
});

test('提示词里写死了必须用上的词和必须练的语法', () => {
  const messages = buildMessages(validateArticleRequest({
    schemaVersion: 1, locale: 'de-DE', level: 'A1', seedWords: SEEDS, grammarZh: '用 wo 提问',
  }));
  const system = messages[0].content;
  assert.match(system, /Bahnhof/);
  assert.match(system, /用 wo 提问/);
  assert.match(system, /从句/, 'A1 红线要写进提示词，不能只靠出口闸门');
});

/* ---------- 客户端 ---------- */

test('客户端会自己再审一遍 —— 不合格的东西不进学习流程', async () => {
  const bad = {
    ...GOOD,
    sentences: [
      { de: 'Ich bin Anna.', zh: '我是安娜。' },
      { de: 'Ich lerne Deutsch.', zh: '我学德语。' },
      { de: 'Das ist gut.', zh: '这很好。' },
    ],
  };
  const fake = async () => ({ ok: true, json: async () => ({ article: bad, source: 'model' }) });
  const result = await fetchArticle(
    buildArticleRequest({ seedWords: SEEDS }), { endpoint: 'https://x', accessCode: 'y' }, fake);
  assert.equal(result.article, null);
  assert.match(result.reason, /seed-coverage/);
});

test('断网、没配置、服务出错都返回 null，由调用方退回库存', async () => {
  const req = buildArticleRequest({ seedWords: SEEDS });
  assert.equal((await fetchArticle(req, {})).reason, 'not-configured');
  const boom = async () => { throw new Error('offline'); };
  assert.equal((await fetchArticle(req, { endpoint: 'https://x', accessCode: 'y' }, boom)).reason, 'offline');
  const bad = async () => ({ ok: false, status: 500 });
  assert.equal((await fetchArticle(req, { endpoint: 'https://x', accessCode: 'y' }, bad)).reason, 'http-500');
  // 失败原因必须能说成人话，不能把 flag 直接甩给用户。
  assert.match(reasonText('offline'), /库里/);
  assert.match(reasonText('not-configured'), /设置/);
});

test('文章拼成三步课：读一遍 → 听写一句 → 跟读今天的词最多那句', () => {
  const lesson = articleToLesson(GOOD, { seedWords: SEEDS, skills: ['g-wo'] });
  assert.deepEqual(lesson.steps.map(step => step.type), ['observe', 'dictation', 'speak']);
  assert.equal(lesson.steps[0].lines.length, 3);
  assert.equal(lesson.steps[0].a, 0);
  assert.ok(lesson.steps[1].answer, '听写要有答案');
  assert.ok(lesson.steps.every(step => step.skills.includes('g-wo')), '每步都要挂技能标签，否则练了掌握度不动');
  // 跟读挑今天的词出现最多的那句
  assert.equal(pickSpeakIndex(GOOD.sentences, SEEDS), 1);
});

test('今天按本地日期算，不是 UTC', () => {
  assert.equal(todayStamp(new Date(2026, 6, 28, 23, 30)), '2026-07-28');
});
