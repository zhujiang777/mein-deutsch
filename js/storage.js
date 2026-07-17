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
  if ((m.schemaVersion || 1) >= 2) return;
  // v1 词卡状态原样兼容；v1 完成标记保留在 progress 键，供路径初始化参考
  m.schemaVersion = 2;
  localStorage.setItem(KEYS.meta, JSON.stringify(m));
}

/* ---- 设置 ---- */
const DEFAULT_SETTINGS = {
  voiceURI: '',
  rate: 1,
  newPerDay: 10,       // 每日新词
  gistToken: '',       // Gist 同步令牌
  gistId: '',          // 进度存储的 gist id（首次推送时创建）
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

/* ---- 每日日志 / streak ---- */
export function todayKey(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return d.toISOString().slice(0, 10);
}
export function logActivity({ items = 0, ok = 0, lessons = 0 } = {}) {
  const all = load(KEYS.daily, {});
  const k = todayKey();
  const d = all[k] || { items: 0, ok: 0, lessons: 0 };
  d.items += items; d.ok += ok; d.lessons += lessons;
  all[k] = d;
  save(KEYS.daily, all);
}
export function getDaily(k = todayKey()) {
  return load(KEYS.daily, {})[k] || { items: 0, ok: 0, lessons: 0 };
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
  p[module] = p[module] || {};
  p[module][id] = Date.now();
  save(KEYS.progress, p);
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
}
