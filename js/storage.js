// 本地存储层 v2：聚合学习状态（技能掌握度/错题池/课程断点/视频/词卡/日志）
// 全部存 localStorage；条目带 lastModified 供 Gist 同步合并（新者胜）
const KEYS = {
  progress: 'md.progress.v1',   // v1 遗留：完成标记（迁移用）
  srs: 'md.srs.v1',             // 词卡 + 错题池调度（id 命名空间: w=词卡, m=错题）
  settings: 'md.settings.v1',
  skills: 'md.skills.v1',       // 技能掌握度 { skillId: {s, seen, ok, last} }
  lessons: 'md.lessons.v1',     // 课程状态 { lessonId: {step, done, score, t} }
  videos: 'md.videos.v1',       // 视频观看 { videoId: {pct, done, t} }
  daily: 'md.daily.v1',         // 每日日志 { 'YYYY-MM-DD': {items, ok, lessons, minutes} }
  rewards: 'md.rewards.v1',     // XP / 等级 / 首次完成奖励 / 成就
  wordbook: 'md.wordbook.v1',   // 全局查词加入的自定义词条（d:lemma 命名空间）
  meta: 'md.meta.v1',           // { schemaVersion, lastSync }
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  touchMeta();
}
let metaTouching = false;
function touchMeta() {
  if (metaTouching) return; // 防递归
  metaTouching = true;
  const m = load(KEYS.meta, {});
  m.lastModified = Date.now();
  localStorage.setItem(KEYS.meta, JSON.stringify(m));
  metaTouching = false;
  // 通知同步层（防抖推送）
  window.dispatchEvent(new CustomEvent('md-data-changed'));
}

/* ---- v1 → v2 迁移 ---- */
export function migrate() {
  const m = load(KEYS.meta, {});
  const version = m.schemaVersion || 1;
  if (version < 2) {
    // v1 词卡状态原样兼容；v1 完成标记保留在 progress 键，供路径初始化参考
    m.schemaVersion = 2;
  }
  if (version < 3) {
    const daily = load(KEYS.daily, {});
    let totalXp = 0;
    for (const day of Object.values(daily)) {
      const base = Math.max(0, Number(day.items) || 0)
        + Math.max(0, Number(day.ok) || 0)
        + Math.max(0, Number(day.lessons) || 0) * 10;
      day.xp = Number.isFinite(day.xp) ? day.xp : base + (base >= 20 ? 10 : 0);
      day.goalClaimed = !!day.goalClaimed || base >= 20;
      totalXp += day.xp;
    }
    localStorage.setItem(KEYS.daily, JSON.stringify(daily));

    const completions = {};
    const lessons = load(KEYS.lessons, {});
    for (const [id, state] of Object.entries(lessons)) {
      if (state?.done) completions[`lesson:${id}`] = true;
    }
    const legacy = load(KEYS.progress, {});
    for (const [kind, values] of Object.entries(legacy)) {
      for (const id of Object.keys(values || {})) completions[`${kind}:${id}`] = true;
    }
    localStorage.setItem(KEYS.rewards, JSON.stringify({
      totalXp, completions, badges: {}, lastModified: Date.now(),
    }));
    m.schemaVersion = 3;
  }
  localStorage.setItem(KEYS.meta, JSON.stringify(m));
}

/* ---- 设置 ---- */
const DEFAULT_SETTINGS = {
  voiceURI: '',
  rate: 1,
  newPerDay: 10,       // 每日新词
  gistToken: '',       // Gist 同步令牌
  gistId: '',          // 进度存储的 gist id（首次推送时创建）
  theme: 'system',     // system | light | dark
  dailyGoalXp: 20,
};
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) };
}
export function setSetting(key, value) {
  const s = load(KEYS.settings, {});
  s[key] = value;
  save(KEYS.settings, s);
}

/* ---- SRS（词卡 + 错题共用） ---- */
export function loadSrs() { return load(KEYS.srs, {}); }
export function saveSrs(state) { save(KEYS.srs, state); }

/* ---- 生词本 ---- */
export function getWordbook() { return load(KEYS.wordbook, {}); }
export function addWordEntry(entry) {
  const lemma = String(entry?.lemma || '').trim();
  if (!lemma) return null;
  const id = `d:${lemma}`;
  const all = getWordbook();
  all[id] = {
    lemma, zh: entry.zh || '', art: entry.art || null, pl: entry.pl || null,
    pos: entry.pos || '', sentence: entry.sentence || '', source: entry.source || '',
    addedAt: all[id]?.addedAt || Date.now(),
  };
  save(KEYS.wordbook, all);
  return id;
}
export function removeWordEntry(id) {
  const all = getWordbook();
  if (!all[id]) return false;
  delete all[id];
  save(KEYS.wordbook, all);
  const srs = loadSrs();
  if (srs[id]) { delete srs[id]; saveSrs(srs); }
  return true;
}

/* ---- 技能掌握度 ---- */
export function loadSkills() { return load(KEYS.skills, {}); }
export function saveSkills(s) { save(KEYS.skills, s); }

/* ---- 课程状态 ---- */
export function getLessonState(id) {
  return load(KEYS.lessons, {})[id] || null;
}
export function setLessonState(id, state) {
  const all = load(KEYS.lessons, {});
  all[id] = { ...all[id], ...state, t: Date.now() };
  save(KEYS.lessons, all);
}
export function allLessonStates() { return load(KEYS.lessons, {}); }

/* ---- 视频观看 ---- */
export function getVideoState(id) {
  return load(KEYS.videos, {})[id] || { pct: 0, done: false };
}
export function setVideoState(id, state) {
  const all = load(KEYS.videos, {});
  all[id] = { ...all[id], ...state, t: Date.now() };
  save(KEYS.videos, all);
}

/* ---- 每日日志 / XP / streak ---- */
export function todayKey(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10);
}
export function getRewards() {
  return {
    totalXp: 0, completions: {}, badges: {},
    ...load(KEYS.rewards, {}),
  };
}

export function rewardSummary() {
  const rewards = getRewards();
  const goal = Math.max(5, Number(getSettings().dailyGoalXp) || 20);
  const today = getDaily();
  const level = Math.floor(rewards.totalXp / 100) + 1;
  return {
    totalXp: rewards.totalXp,
    level,
    levelXp: rewards.totalXp % 100,
    nextLevelXp: 100,
    dailyXp: today.xp || 0,
    dailyGoalXp: goal,
    dailyPct: Math.min(100, Math.round(100 * (today.xp || 0) / goal)),
    badges: rewards.badges || {},
  };
}

function unlockBadges(rewards) {
  const next = [];
  const checks = [
    ['first-step', rewards.totalXp > 0],
    ['streak-3', getStreak() >= 3],
    ['streak-7', getStreak() >= 7],
    ['level-5', rewards.totalXp >= 400],
  ];
  for (const [id, earned] of checks) {
    if (earned && !rewards.badges[id]) {
      rewards.badges[id] = Date.now();
      next.push(id);
    }
  }
  return next;
}

export function logActivity({ items = 0, ok = 0, lessons = 0, completionId = '' } = {}) {
  const all = load(KEYS.daily, {});
  const k = todayKey();
  const d = all[k] || { items: 0, ok: 0, lessons: 0, xp: 0, goalClaimed: false };
  const rewards = getRewards();
  const previousLevel = Math.floor(rewards.totalXp / 100) + 1;
  let xpDelta = Math.max(0, items) + Math.max(0, ok);

  if (completionId && !rewards.completions[completionId]) {
    rewards.completions[completionId] = true;
    xpDelta += 10;
  } else if (!completionId && lessons > 0) {
    xpDelta += lessons * 10;
  }
  d.items += items; d.ok += ok; d.lessons += lessons;
  d.xp = (d.xp || 0) + xpDelta;
  const goal = Math.max(5, Number(getSettings().dailyGoalXp) || 20);
  let goalReached = false;
  if (!d.goalClaimed && d.xp >= goal) {
    d.goalClaimed = true;
    d.xp += 10;
    xpDelta += 10;
    goalReached = true;
  }
  all[k] = d;
  save(KEYS.daily, all);
  rewards.totalXp += xpDelta;
  rewards.lastModified = Date.now();
  const newBadges = unlockBadges(rewards);
  save(KEYS.rewards, rewards);
  const level = Math.floor(rewards.totalXp / 100) + 1;
  return { xpDelta, goalReached, levelUp: level > previousLevel, level, newBadges };
}
export function getDaily(k = todayKey()) {
  return load(KEYS.daily, {})[k] || { items: 0, ok: 0, lessons: 0, xp: 0, goalClaimed: false };
}
export function getStreak() {
  const all = load(KEYS.daily, {});
  let streak = 0;
  for (let i = 0; ; i++) {
    const k = todayKey(-i);
    const d = all[k];
    if (d && d.items > 0) streak++;
    else if (i === 0) continue; // 今天还没学不打断连续
    else break;
  }
  return streak;
}

/* ---- v1 遗留完成标记（阅读等模块仍在用） ---- */
export function isDone(module, id) {
  const p = load(KEYS.progress, {});
  return !!(p[module] && p[module][id]);
}
export function markDone(module, id) {
  const p = load(KEYS.progress, {});
  const first = !(p[module] && p[module][id]);
  p[module] = p[module] || {};
  p[module][id] = Date.now();
  save(KEYS.progress, p);
  return first ? logActivity({ completionId: `${module}:${id}` }) : null;
}
export function doneCount(module) {
  const p = load(KEYS.progress, {});
  return p[module] ? Object.keys(p[module]).length : 0;
}

/* ---- 导出 / 导入 / 同步载荷 ---- */
export function exportAll() {
  const payload = { exportedAt: new Date().toISOString() };
  for (const [name, key] of Object.entries(KEYS)) payload[name] = load(key, {});
  return JSON.stringify(payload);
}
export function importAll(json) {
  const data = JSON.parse(json);
  for (const [name, key] of Object.entries(KEYS)) {
    if (data[name] && name !== 'meta') save(key, data[name]);
  }
}
// 同步合并：远端与本地按 meta.lastModified 新者胜（整包粒度，个人单用户场景足够）
export function mergeRemote(json) {
  const remote = JSON.parse(json);
  const localT = load(KEYS.meta, {}).lastModified || 0;
  const remoteT = remote.meta?.lastModified || 0;
  if (remoteT > localT) {
    importAll(json);
    return 'pulled';
  }
  return 'local-newer';
}
export function resetAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('md.local.secrets.v1');
}
