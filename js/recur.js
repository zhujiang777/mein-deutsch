// 复现引擎：把"最近学的词"和"到期复习的词"与阅读文章的 vocabRefs 做重叠，
// 推荐能让新学词汇在真实语境里再次出现的文章。
import { loadSrs } from './storage.js';

const DAY = 86400000;

// 最近学习/评分过的词 id（w 命名空间）。
// SRS 卡没有独立时间戳，用"间隔还短"或"已到期待复习"近似"最近还在鲜活记忆里"。
export function recentWordIds(days = 7) {
  const all = loadSrs();
  const now = Date.now();
  const out = [];
  for (const [id, c] of Object.entries(all)) {
    if (!id.startsWith('w')) continue; // m: 是错题命名空间，跳过
    if ((c.ivl ?? 0) <= days || (c.due ?? 0) <= now) out.push(id);
  }
  return out;
}

// 文章 vocabRefs 与"最近词 + 到期词"的重叠计数
export function scoreText(vocabRefs = []) {
  if (!vocabRefs.length) return 0;
  const recent = new Set(recentWordIds(7)); // recentWordIds 已含到期词
  let count = 0;
  for (const id of vocabRefs) if (recent.has(id)) count++;
  return count;
}
