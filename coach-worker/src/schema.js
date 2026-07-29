// 今日文章的进出口 Schema。纯函数，前后端共用，也是 tests/coach-article.test.mjs 的被测对象。
//
// 两个方向都收窄到最小：
//   进：只接收学习摘要（今天的词、今天这一格、已知词表）。不上传录音、不上传聊天史。
//   出：模型的输出先按白名单重建一遍，多一个字段就整份丢掉——
//       不能让模型往学习流程里塞我们没设计过的东西。

const REQUEST_KEYS = new Set([
  'schemaVersion', 'locale', 'level', 'seedWords', 'grammarZh', 'sceneHint', 'knownWords', 'variant',
]);

export function cleanText(value, max) {
  const text = String(value == null ? '' : value).replace(/\s+/gu, ' ').trim();
  return text.length <= max ? text : '';
}

function cleanList(value, max, itemMax) {
  return Array.isArray(value)
    ? value.map(item => cleanText(item, itemMax)).filter(Boolean).slice(0, max)
    : [];
}

export function validateArticleRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.keys(value).some(key => !REQUEST_KEYS.has(key))) return null;
  if (value.schemaVersion !== 1 || value.locale !== 'de-DE' || value.level !== 'A1') return null;

  const seedWords = cleanList(value.seedWords, 12, 40);
  // 没有种子词就没有"给我今天写的"这回事，这个请求本身没有意义。
  if (seedWords.length < 2) return null;

  return {
    schemaVersion: 1,
    locale: 'de-DE',
    level: 'A1',
    seedWords,
    grammarZh: cleanText(value.grammarZh, 60),
    sceneHint: cleanText(value.sceneHint, 40),
    knownWords: cleanList(value.knownWords, 400, 40),
    variant: Number.isInteger(value.variant) && value.variant >= 0 && value.variant <= 3 ? value.variant : 0,
  };
}

/**
 * 每日小测：2 道德语判断对错，形状对齐 Goethe Lesen Teil 1。
 * answer 0 = Richtig，1 = Falsch，和 options ['Richtig','Falsch'] 的下标一致。
 *
 * 单独一个函数、单独作废：题不合格只丢题，不丢文章 —— 文章是主线的一环，
 * 不能因为附带的两道题写砸了就让今天没得读。
 */
export function normalizeQuiz(value) {
  const allowedKeys = new Set(['de', 'zh', 'answer', 'explainZh']);
  if (!Array.isArray(value) || value.length !== 2) return [];
  const items = value.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (Object.keys(item).some(key => !allowedKeys.has(key))) return null;
    const de = cleanText(item.de, 120);
    const zh = cleanText(item.zh, 120);
    const explainZh = cleanText(item.explainZh, 120);
    if (!de || !zh || !explainZh) return null;
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 1) return null;
    return { de, zh, answer: item.answer, explainZh };
  });
  return items.every(Boolean) ? items : [];
}

/** 按白名单重建模型输出。多一个键、少一个必填键，整份作废（quiz 除外，见 normalizeQuiz）。 */
export function normalizeArticle(value) {
  const allowedTop = new Set(['sceneZh', 'titleDe', 'titleZh', 'sentences', 'question', 'quiz']);
  const allowedQuestion = new Set(['zh', 'options', 'answer']);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.keys(value).some(key => !allowedTop.has(key))) return null;

  const sceneZh = cleanText(value.sceneZh, 30);
  const titleDe = cleanText(value.titleDe, 60);
  const titleZh = cleanText(value.titleZh, 40);
  if (!sceneZh || !titleDe || !titleZh) return null;

  if (!Array.isArray(value.sentences)) return null;
  const sentences = value.sentences
    .map(item => (item && typeof item === 'object' && !Array.isArray(item))
      ? { de: cleanText(item.de, 160), zh: cleanText(item.zh, 160) }
      : null)
    .filter(item => item && item.de && item.zh);
  if (sentences.length !== value.sentences.length) return null;

  const question = value.question;
  if (!question || typeof question !== 'object' || Array.isArray(question)) return null;
  if (Object.keys(question).some(key => !allowedQuestion.has(key))) return null;
  const zh = cleanText(question.zh, 120);
  const options = cleanList(question.options, 2, 80);
  if (!zh || options.length !== 2) return null;
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 1) return null;

  return {
    sceneZh, titleDe, titleZh, sentences,
    question: { zh, options, answer: question.answer },
    quiz: normalizeQuiz(value.quiz),
  };
}
