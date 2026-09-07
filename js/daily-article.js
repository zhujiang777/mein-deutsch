// 今日文章：把今天背的词 + 今天这一格语法，变成一段只属于今天的短文。
// 产品形态见 docs/product-shape.md；Worker 侧的闸门见 coach-worker/README.md
//
// 这是整个产品唯一别人做不到的东西——别的软件的文章是提前写好的，
// 所以它不可能正好用上你今天背的词。
//
// 三条硬边界：
// 1. 每天一篇，只能重生成一次。无限刷新会让人挑"看起来最舒服的"那份，
//    而那通常是最简单、学不到东西的一份。
// 2. 生成失败、超时、没配置、断网——任何情况下都退回库里的现成材料，
//    学习流程不能因为 AI 挂了而中断。
// 3. 生成的文章没有预生成音频，只能用浏览器语音合成朗读；界面上要说明这一点，
//    不能让人以为听到的是和课程一样的标准音。
import { auditArticle, auditQuiz } from '../coach-worker/src/a1-guard.js?v=2';
import { normalizeArticle } from '../coach-worker/src/schema.js';

export const ARTICLE_CACHE_KEY = 'md.article.today.v1';
export const REGEN_LIMIT = 1;
export const ARTICLE_LESSON_ID = 'daily-article';
export const QUIZ_TASK_ID = 'daily-quiz';

/** 本地日期，不是 UTC —— 跨时区时"今天"应该跟着人走。 */
export function todayStamp(now = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function buildArticleRequest({
  seedWords = [], knownWords = [], grammarZh = '', sceneHint = '', variant = 0, allowedGrammar,
} = {}) {
  return {
    schemaVersion: 1,
    locale: 'de-DE',
    level: 'A1',
    seedWords: seedWords.filter(Boolean).slice(0, 12),
    grammarZh,
    ...(Array.isArray(allowedGrammar) ? { allowedGrammar } : {}),
    sceneHint,
    knownWords: knownWords.filter(Boolean).slice(0, 400),
    variant,
  };
}

/** 挑一句来跟读：今天的词出现得最多的那句。同分取更短的——第一次开口不该是最长那句。 */
export function pickSpeakIndex(sentences, seedWords = []) {
  const stems = seedWords
    .map(word => String(word).toLocaleLowerCase('de-DE'))
    .map(word => word.slice(0, Math.max(4, word.length - 2)))
    .filter(Boolean);
  let best = 0;
  let bestHits = -1;
  sentences.forEach((sentence, index) => {
    const lower = String(sentence.de || '').toLocaleLowerCase('de-DE');
    const hits = stems.filter(stem => lower.includes(stem)).length;
    if (hits > bestHits || (hits === bestHits && sentence.de.length < sentences[best].de.length)) {
      best = index; bestHits = hits;
    }
  });
  return best;
}

/**
 * 把文章拼成 runLessonShell 认识的课。三步，约 7 分钟：
 *   读一遍（带理解题）→ 听写一句 → 跟读今天的词最多的那句
 * 复用现成的题型外壳，不为它发明新的播放器。
 */
export function articleToLesson(article, { seedWords = [], skills = ['reading'] } = {}) {
  const sentences = article.sentences;
  const speakIndex = pickSpeakIndex(sentences, seedWords);
  // 听写挑最短的一句：这一步考的是"从声音里认出今天的词"，不是记忆力。
  const dictIndex = sentences
    .map((sentence, index) => ({ index, len: sentence.de.length }))
    .sort((a, b) => a.len - b.len)[0].index;

  return {
    id: ARTICLE_LESSON_ID,
    title: article.titleZh,
    sub: article.sceneZh,
    skills,
    steps: [
      {
        type: 'observe',
        intro: `${article.sceneZh} · ${article.titleDe}`,
        lines: sentences.map(sentence => ({ de: sentence.de, zh: sentence.zh })),
        q: article.question.zh,
        options: article.question.options,
        a: article.question.answer,
        skills,
      },
      {
        type: 'dictation',
        q: '✍️ 听音，把这一句写出来',
        answer: sentences[dictIndex].de,
        skills,
      },
      {
        type: 'speak',
        q: '🎤 把今天的词说出口',
        de: sentences[speakIndex].de,
        zh: sentences[speakIndex].zh,
        cue: '慢一点，把今天背的那几个词读清楚',
        skills,
      },
    ],
  };
}

/**
 * 每日小测：把文章附带的两道判断对错拼成 exam-shell 认识的题组。
 * 形状对齐 Goethe Lesen Teil 1（短文 + 德语陈述判断对错），所以选项固定
 * ['Richtig', 'Falsch']，answer 0 = Richtig —— 和官方答题卡一个方向。
 * 没有题（AI 没出 / 没过闸 / 走的是库存材料）时返回 null，今天就没有小测。
 */
export function quizToTask(article, { skills = ['reading'] } = {}) {
  const quiz = Array.isArray(article?.quiz) ? article.quiz : [];
  if (!quiz.length) return null;
  return {
    id: QUIZ_TASK_ID,
    cellId: 'L1',
    titleZh: '今天这篇，判断对错',
    subZh: '和 Goethe A1 阅读第一部分同一种题',
    items: quiz.map(item => ({
      type: 'choice',
      prompt: item.de,
      options: ['Richtig', 'Falsch'],
      a: item.answer,
      explain: `${item.zh}　—— ${item.explainZh}`,
      skills,
    })),
  };
}

/* ---------- 缓存：每天一篇，只能重生成一次 ---------- */

export function loadArticleCache() {
  try {
    const value = JSON.parse(localStorage.getItem(ARTICLE_CACHE_KEY) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/** 今天已经生成好的那一篇；跨天自动作废。 */
export function cachedArticle(stamp = todayStamp()) {
  const cache = loadArticleCache();
  return cache?.stamp === stamp ? cache : null;
}

/** seedWords 一起存：跟读那一步要靠它挑"今天的词最多的那句"。 */
export function saveArticleCache(article, {
  stamp = todayStamp(), regens = 0, audit = null, seedWords = [],
} = {}) {
  localStorage.setItem(ARTICLE_CACHE_KEY, JSON.stringify({ stamp, article, regens, audit, seedWords }));
}

export function regensLeft(stamp = todayStamp()) {
  const cache = cachedArticle(stamp);
  return Math.max(0, REGEN_LIMIT - (cache?.regens || 0));
}

/* ---------- 取文章 ---------- */

/**
 * 向 Worker 要一篇。任何失败都返回 { article: null, reason }——
 * 调用方看到 null 就退回库存材料，不抛异常打断学习流程。
 * fetchImpl 显式传入，方便测试。
 */
export async function fetchArticle(request, secrets, fetchImpl = fetch) {
  const { endpoint, accessCode } = secrets || {};
  if (!endpoint || !accessCode) return { article: null, reason: 'not-configured' };

  let response;
  try {
    response = await fetchImpl(`${endpoint}/v1/article/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessCode}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    return { article: null, reason: 'offline' };
  }
  if (!response?.ok) return { article: null, reason: `http-${response?.status || 0}` };

  let payload;
  try { payload = await response.json(); }
  catch { return { article: null, reason: 'invalid-response' }; }
  if (!payload?.article) return { article: null, reason: payload?.reason || 'fallback' };

  // Worker 已经审过一遍，这里再审一遍：Worker 可能被换、被绕过、版本落后，
  // 而"不合格的内容不进学习流程"这条边界必须由客户端自己守住。
  const article = normalizeArticle(payload.article);
  if (!article) return { article: null, reason: 'schema-rejected-local' };
  const audit = auditArticle(article, {
    knownWords: request.knownWords, seedWords: request.seedWords,
  });
  if (!audit.ok) return { article: null, reason: `local-a1-${audit.flags[0]}` };

  // 小测同样再审一遍，同样只退题不退文章：不合格就把 quiz 清空，
  // 今天没有小测，但今日文章照常进学习流程。
  const quizAudit = auditQuiz(article.quiz, article, {
    knownWords: request.knownWords, seedWords: request.seedWords,
  });
  if (!quizAudit.ok) article.quiz = [];

  return { article, audit, quizAudit, source: payload.source || 'model' };
}

/** 说人话的失败原因——出问题时用户该知道是"没配置"还是"写出来不合格"。 */
export function reasonText(reason) {
  if (!reason) return '';
  if (reason === 'not-configured') return '还没配置今日文章（设置 → 今日文章）';
  if (reason === 'offline') return '连不上，已改用库里的材料';
  if (reason.startsWith('http-')) return '服务返回错误，已改用库里的材料';
  if (reason.includes('seed-coverage')) return '生成的文章没用上今天的词，已改用库里的材料';
  if (reason.includes('a1-')) return '生成的文章超出 A1 范围，已改用库里的材料';
  return '这次没生成成功，已改用库里的材料';
}
