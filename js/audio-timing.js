// 音频速率档位与句级时间戳计算。纯函数、无 DOM 依赖，可直接单测。
// 放在独立模块而不是 speech.js 里，是因为 speech.js 顶层要摸 window，Node 测试进不去。

// 慢速档是唯一真相源：UI 标签必须从这里取，否则标签与实际速率会各自漂移。
export const SLOW_RATE = 0.75;
// 精听播放器的速率档；数组顺序即 UI 上点击循环切换的顺序。
export const RATE_STEPS = [0.6, SLOW_RATE, 1];

/** 把任意速率贴到最近的合法档位，保证不会出现标签之外的速率。 */
export function normalizeRate(rate) {
  const value = Number(rate);
  if (!Number.isFinite(value)) return 1;
  return RATE_STEPS.reduce(
    (best, step) => (Math.abs(step - value) < Math.abs(best - value) ? step : best),
    RATE_STEPS[0],
  );
}

/** 速率 chip 点一下走到下一档，到头回环。 */
export function nextRate(rate) {
  const index = RATE_STEPS.indexOf(normalizeRate(rate));
  return RATE_STEPS[(index + 1) % RATE_STEPS.length];
}

/** 归一化 AB 区间：允许倒着标（B 标在 A 前面），越界夹回有效范围。 */
export function clampRange(a, b, count) {
  if (!Number.isFinite(count) || count <= 0) return null;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const fit = value => Math.max(0, Math.min(Math.trunc(value), count - 1));
  return { from: fit(Math.min(a, b)), to: fit(Math.max(a, b)) };
}

/**
 * 播放头落在第几句。句间空隙归给上一句，避免跟随高亮闪回。
 * seg 必须按起点升序（生成脚本保证）。播放头在首句之前返回 -1。
 */
export function sentenceAt(seg, time) {
  if (!Array.isArray(seg) || !seg.length) return -1;
  if (!(time >= seg[0][0])) return -1; // NaN 也落到这里
  let lo = 0, hi = seg.length - 1, hit = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (seg[mid][0] <= time) { hit = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return hit;
}

/**
 * 时间戳是否可信：条数要与句数一致，且每段 start<end、整体升序。
 * 任何一条不满足就整包降级到逐句独立文件，宁可没有 AB 复读也不能错位。
 */
export function segUsable(seg, count) {
  if (!Array.isArray(seg) || seg.length !== count || !count) return false;
  let prev = -Infinity;
  for (const pair of seg) {
    if (!Array.isArray(pair) || pair.length < 2) return false;
    const [start, end] = pair;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    if (start < prev || end <= start) return false;
    prev = start;
  }
  return true;
}
