// 本地存储：学习进度、SRS 状态、设置，全部存 localStorage，可导出/导入
const KEYS = {
  progress: 'md.progress.v1',
  srs: 'md.srs.v1',
  settings: 'md.settings.v1',
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
}

/* ---- 进度（完成的课程/文章） ---- */
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

/* ---- SRS 卡片状态 ---- */
export function loadSrs() {
  return load(KEYS.srs, {});
}
export function saveSrs(state) {
  save(KEYS.srs, state);
}

/* ---- 设置 ---- */
const DEFAULT_SETTINGS = {
  voiceURI: '',      // 首选德语语音
  rate: 1,           // 语速
  newPerDay: 10,     // 每日新词数量
};
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) };
}
export function setSetting(key, value) {
  const s = getSettings();
  s[key] = value;
  save(KEYS.settings, s);
}

/* ---- 导出 / 导入（跨设备同步用） ---- */
export function exportAll() {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    progress: load(KEYS.progress, {}),
    srs: load(KEYS.srs, {}),
    settings: load(KEYS.settings, {}),
  });
}
export function importAll(json) {
  const data = JSON.parse(json); // 格式错误会抛异常，由调用方提示
  if (data.progress) save(KEYS.progress, data.progress);
  if (data.srs) save(KEYS.srs, data.srs);
  if (data.settings) save(KEYS.settings, data.settings);
}
export function resetAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
