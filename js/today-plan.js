// 今天学什么：一节课 + 一份材料 + 一次复习
//
// 旧版今日是个**播放列表**：词卡 → 错题 → 微步课 → 视频 → 听写，五个不相干的东西排成队。
// 它是其他几个 tab 的混合视图，所以用户感觉不到自己在学"一件事"。
//
// 新版是三段，围绕同一份材料：
//   学 —— 下一节微步课（教）
//   用 —— 一份精听材料的完整五阶段（听→大意→听写→复听→复述）
//   记 —— 这份材料的生词排在最前，再接上今天到期的复习
//
// 材料不是随机挑的：先要求"能听懂"（前置课已完成、需要的语法都到位），
// 再在这些里挑已知词比例最贴近 92% 的那一份。练薄弱语法交给"记"之后的语法卡，
// 不靠给你一份听不懂的材料来实现——那只会让人放弃。
import { LISTENING_PACKS } from '../data/listening.js';
import { LISTENING_AUDIO } from '../data/listening-audio.js';
import { contentVocabRefs } from '../data/content-index.js';
import { classifyReadiness } from './content-readiness.js';

// 可理解输入的目标：已知词约 92%，剩下的靠上下文猜。低于这个数会读不下去，
// 高于 98% 就没有新东西可学。
export const TARGET_KNOWN_RATIO = 0.92;

// 低于这条线不给材料，今天只上课 + 复习。
// 零基础用户的已知词是 0%，硬塞一份精听包就是听两分钟噪音然后卸载——
// 这正是"破冰期"要拦住的情况（见 docs/a1-panorama.md 第四节）。
export const MIN_KNOWN_RATIO = 0.6;

export const PLANS = {
  5: { label: '5 分钟 · 只复习', maxDue: 20, maxNew: 0, quickForms: true, mistakes: 5, listenMisses: 2, lesson: false, material: false },
  15: { label: '15 分钟 · 标准', maxDue: 20, maxNew: 10, mistakes: 5, listenMisses: 3, lesson: true, material: false },
  30: { label: '30 分钟 · 充实', maxDue: 40, maxNew: 15, mistakes: 8, listenMisses: 5, lesson: true, material: true },
};

export const STAGE_LABELS = { learn: '学', use: '用', remember: '记' };

/** 有原创音频的精听包才能进主线：没音频的点进去只有一句"音频尚未生成"。 */
export function availableMaterials(audio = LISTENING_AUDIO) {
  return LISTENING_PACKS.filter(pack => audio[pack.id]);
}

/**
 * 挑今天这一份。state 显式传入，方便测试。
 * 返回 { pack, readiness, reason, score }，没有可用材料时返回 null。
 */
export function pickMaterial(state = {}, materials = availableMaterials()) {
  const { lessonStates = {}, srs = {}, skills = {} } = state;
  const scored = materials.map(pack => {
    const readiness = classifyReadiness(pack, { lessonStates, srs, skills });
    const done = !!lessonStates[pack.id]?.done;
    // 贴近 92% 是主要信号；能听懂是门槛，不是加分项，所以权重压过它。
    let score = -Math.abs(readiness.knownRatio - TARGET_KNOWN_RATIO) * 200;
    if (!done) score += 100;
    if (readiness.grammarReady) score += 40;
    if (!readiness.grammarGaps.length) score += 30;
    return { pack, readiness, done, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;
  // 达不到下限时**不隐藏**，而是带 ready:false 返回：主页照样把这份和差多少显示出来。
  // 静默藏掉会让"今天没有材料"看起来像功能坏了，而真实原因是内容的课程词复用率不够——
  // 那是内容供给问题（见备忘录：课程词复用率 10/12 不达标），不能靠调阈值掩盖。
  const ready = best.readiness.knownRatio >= MIN_KNOWN_RATIO;
  return { ...best, ready, reason: ready ? reasonFor(best) : shortfallFor(best) };
}

function shortfallFor({ readiness }) {
  const pct = Math.round(readiness.knownRatio * 100);
  const floor = Math.round(MIN_KNOWN_RATIO * 100);
  return `现有材料里最贴合的一份，你也只认识 ${pct}% 的词（至少要 ${floor}%）。`
    + '今天先上课攒词汇量——听不懂的材料练不出听力。';
}

function reasonFor({ pack, readiness, done }) {
  const pct = Math.round(readiness.knownRatio * 100);
  if (done) return '再听一遍：上次做过，现在词汇量更大，能听出更多细节';
  if (readiness.grammarGaps.length) {
    return `这份用得到「${readiness.grammarGaps[0].title}」，练之前先花两分钟补一下`;
  }
  if (readiness.key === 'right') return `你已经认识其中 ${pct}% 的词，剩下的正好能连蒙带猜`;
  if (readiness.key === 'review') return `词你都学过（${pct}%），这次专门练"从声音里听出来"`;
  return `认识 ${pct}% 的词，略有挑战。练的是：${pack.funcZh || '先抓大意'}`;
}

/**
 * 今天的执行段落。纯数据，不碰 DOM。
 * counts 由调用方从 SRS 读出：{ due, fresh, mistakes:[], listenMisses:[] }
 */
export function buildTodayPlan(minutes, { nextLesson = null, material = null, counts = {} } = {}) {
  const plan = PLANS[minutes] || PLANS[15];
  const segments = [];

  if (plan.lesson && nextLesson) {
    segments.push({ stage: 'learn', kind: 'lesson', lessonId: nextLesson.id, title: nextLesson.title });
  }
  if (plan.material && material?.ready) {
    segments.push({ stage: 'use', kind: 'material', packId: material.pack.id, title: material.pack.title });
  }
  // 记：这份材料的生词排最前，再接今天到期的复习。三者都归到同一段名下，
  // 因为对学习者来说它们是一件事——把今天遇到的东西留住。
  const priorityIds = material?.ready ? contentVocabRefs(material.pack) : [];
  if ((counts.due || 0) > 0 || (plan.maxNew > 0 && (counts.fresh || 0) > 0)) {
    segments.push({
      stage: 'remember', kind: 'vocab', title: material?.ready ? `${material.pack.title} 的生词与复习` : '词汇复习与新词',
      priorityIds, maxDue: plan.maxDue, maxNew: plan.maxNew, quickForms: !!plan.quickForms,
    });
  }
  const mistakes = (counts.mistakes || []).slice(0, plan.mistakes);
  if (mistakes.length) segments.push({ stage: 'remember', kind: 'mistakes', title: '错题巩固', ids: mistakes });
  const listenMisses = (counts.listenMisses || []).slice(0, plan.listenMisses);
  if (listenMisses.length) segments.push({ stage: 'remember', kind: 'listen-misses', title: '精听错句复现', ids: listenMisses });

  return { plan, segments };
}
