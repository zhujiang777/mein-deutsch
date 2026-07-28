// 今天走一条路：背词 → 学一格 → 今日文章。产品形态见 docs/product-shape.md
//
// 上一版是"学一课 → 用一份 → 记住它"，方向对，但有两个问题：
//   1. 打开先让你选 5/15/30 分钟——"减少选择"的第一步却是一个选择题。
//   2. "用"那一份是纯按可理解度挑的，跟你今天背的词、今天学的语法没有关系，
//      所以它读起来像"系统随便给了我一篇"，而不是"这是给我今天写的"。
//
// 新版：
//   背词    —— SRS 到期 + 新词 + 错题，一次清干净（一天的燃料）
//   学一格  —— 全景图的下一格（一天的骨头）
//   今日文章 —— 前两段的汇合点：材料要同时装下"今天背的词"和"今天学的东西"
//
// 今日文章现在从库存里挑最贴合的一份（第 2 步，先不接 AI）。
// 第 3 步会把这个位置换成现场生成——**选材信号不变**，只是供给从"库里最接近的"
// 变成"照着这些词现写一篇"。库存这条路同时是 AI 挂了之后的回退路径。
import { LISTENING_PACKS } from '../data/listening.js';
import { LISTENING_AUDIO } from '../data/listening-audio.js';
import { contentVocabRefs } from '../data/content-index.js';
import { classifyReadiness } from './content-readiness.js';

// 可理解输入的目标：已知词约 92%，剩下的靠上下文猜。低于这个数会读不下去，
// 高于 98% 就没有新东西可学。
export const TARGET_KNOWN_RATIO = 0.92;

// 低于这条线不给材料，今天只背词 + 上课。
// 零基础用户的已知词是 0%，硬塞一份精听包就是听两分钟噪音然后卸载。
//
// ⚠️ 这条线正是 AI 要解开的那堵墙：人工内容永远配不上一个具体学习者的词表，
// 再写 200 份也总有人的词表和它们错开。生成式材料是唯一解（第 3 步）。
export const MIN_KNOWN_RATIO = 0.6;

// 两个出口，不是六个入口。主路径只有 full，review 是"今天不想学新的"的旁路。
export const ROUTES = {
  full: {
    label: '完整路线 · 约 25 分钟',
    maxDue: 20, maxNew: 10, mistakes: 5, listenMisses: 3,
    lesson: true, article: true,
  },
  review: {
    label: '今天只想复习 · 约 10 分钟',
    maxDue: 30, maxNew: 0, mistakes: 8, listenMisses: 5,
    lesson: false, article: false, quickForms: true,
  },
};

export const STAGE_LABELS = { words: '背词', learn: '学一格', article: '今日文章' };

/** 有原创音频的材料才能进主线：没音频的点进去只有一句"音频尚未生成"。 */
export function availableMaterials(audio = LISTENING_AUDIO) {
  return LISTENING_PACKS.filter(pack => audio[pack.id]);
}

/**
 * 挑今天这一篇。state 显式传入，方便测试。
 * todayWordIds = 今天要背的词 + 今天这一格用到的词 —— 这就是"双输入"里的词那一路。
 * 返回 { pack, readiness, reason, score, seedHits }，没有可用材料时返回 null。
 */
export function pickMaterial(state = {}, materials = availableMaterials()) {
  const { lessonStates = {}, srs = {}, skills = {}, todayWordIds = [] } = state;
  const seeds = new Set(todayWordIds);
  const scored = materials.map(pack => {
    const readiness = classifyReadiness(pack, { lessonStates, srs, skills });
    const done = !!lessonStates[pack.id]?.done;
    // 贴近 92% 是主要信号；能听懂是门槛，不是加分项，所以权重压过它。
    let score = -Math.abs(readiness.knownRatio - TARGET_KNOWN_RATIO) * 200;
    if (!done) score += 100;
    if (readiness.grammarReady) score += 40;
    if (!readiness.grammarGaps.length) score += 30;
    // 今天背的词出现得越多越好，但封顶——不能为了凑词去推一份听不懂的材料。
    const seedHits = contentVocabRefs(pack).filter(id => seeds.has(id)).length;
    score += Math.min(seedHits, 6) * 25;
    return { pack, readiness, done, seedHits, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;
  // 达不到下限时**不隐藏**，而是带 ready:false 返回：主页照样把这份和差多少显示出来。
  // 静默藏掉会让"今天没有文章"看起来像功能坏了，而真实原因是库存配不上你的词表。
  const ready = best.readiness.knownRatio >= MIN_KNOWN_RATIO;
  return { ...best, ready, reason: ready ? reasonFor(best) : shortfallFor(best) };
}

function shortfallFor({ readiness }) {
  const pct = Math.round(readiness.knownRatio * 100);
  const floor = Math.round(MIN_KNOWN_RATIO * 100);
  return `库里最贴合的一篇，你也只认识 ${pct}% 的词（至少要 ${floor}%）。`
    + '今天先背词 + 上课攒词汇量——读不懂的材料练不出东西。';
}

function reasonFor({ pack, readiness, done, seedHits }) {
  const pct = Math.round(readiness.knownRatio * 100);
  // 双输入命中优先说：这句话是"这篇是给我今天写的"唯一的证据。
  if (seedHits >= 2) return `这篇里有 ${seedHits} 个词正是你今天背的，趁热见一次`;
  if (done) return '再读一遍：上次做过，现在词汇量更大，能读出更多细节';
  if (readiness.grammarGaps.length) {
    return `这篇用得到「${readiness.grammarGaps[0].title}」，读之前先花两分钟补一下`;
  }
  if (readiness.key === 'right') return `你已经认识其中 ${pct}% 的词，剩下的正好能连蒙带猜`;
  if (readiness.key === 'review') return `词你都学过（${pct}%），这次专门练"从声音里听出来"`;
  return `认识 ${pct}% 的词，略有挑战。练的是：${pack.funcZh || '先抓大意'}`;
}

/**
 * 今天的执行段落。纯数据，不碰 DOM。
 * counts 由调用方从 SRS 读出：{ due, fresh, mistakes:[], listenMisses:[] }
 */
export function buildTodayPlan(routeKey, { nextLesson = null, material = null, counts = {} } = {}) {
  const route = ROUTES[routeKey] || ROUTES.full;
  const segments = [];

  // ① 背词 —— 一天的燃料。错题和精听错句也归这一段：对学习者来说都是"复习旧的"。
  const priorityIds = material?.ready ? contentVocabRefs(material.pack) : [];
  if ((counts.due || 0) > 0 || (route.maxNew > 0 && (counts.fresh || 0) > 0)) {
    segments.push({
      stage: 'words', kind: 'vocab', title: '今天的词',
      priorityIds, maxDue: route.maxDue, maxNew: route.maxNew, quickForms: !!route.quickForms,
    });
  }
  const mistakes = (counts.mistakes || []).slice(0, route.mistakes);
  if (mistakes.length) segments.push({ stage: 'words', kind: 'mistakes', title: '错题巩固', ids: mistakes });
  const listenMisses = (counts.listenMisses || []).slice(0, route.listenMisses);
  if (listenMisses.length) segments.push({ stage: 'words', kind: 'listen-misses', title: '错句复现', ids: listenMisses });

  // ② 学一格 —— 一天的骨头
  if (route.lesson && nextLesson) {
    segments.push({ stage: 'learn', kind: 'lesson', lessonId: nextLesson.id, title: nextLesson.title });
  }

  // ③ 今日文章 —— 前两段的汇合点
  if (route.article && material?.ready) {
    segments.push({ stage: 'article', kind: 'material', packId: material.pack.id, title: material.pack.title });
  }

  return { route, segments };
}
