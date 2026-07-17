// 跨设备同步：私有 GitHub Gist（无服务器）
// 打开时拉取合并（整包 lastModified 新者胜），数据变更后防抖推送
import { getSettings, setSetting, exportAll, mergeRemote } from './storage.js';

const FILE = 'mein-deutsch-progress.json';
const API = 'https://api.github.com';

function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

export function syncConfigured() {
  return !!getSettings().gistToken;
}

export async function pullMerge() {
  const { gistToken, gistId } = getSettings();
  if (!gistToken || !gistId) return 'not-configured';
  const res = await fetch(`${API}/gists/${gistId}`, { headers: headers(gistToken) });
  if (res.status === 404) return 'gist-missing';
  if (!res.ok) throw new Error(`拉取失败 HTTP ${res.status}`);
  const gist = await res.json();
  const content = gist.files?.[FILE]?.content;
  if (!content) return 'empty';
  return mergeRemote(content); // 'pulled' | 'local-newer'
}

export async function pushNow() {
  const { gistToken, gistId } = getSettings();
  if (!gistToken) return 'not-configured';
  const body = {
    description: 'Mein Deutsch 学习进度（自动同步）',
    files: { [FILE]: { content: exportAll() } },
  };
  if (gistId) {
    const res = await fetch(`${API}/gists/${gistId}`, {
      method: 'PATCH', headers: headers(gistToken), body: JSON.stringify(body),
    });
    if (res.status === 404) { setSetting('gistId', ''); return pushNow(); }
    if (!res.ok) throw new Error(`推送失败 HTTP ${res.status}`);
    return 'pushed';
  }
  const res = await fetch(`${API}/gists`, {
    method: 'POST', headers: headers(gistToken),
    body: JSON.stringify({ ...body, public: false }),
  });
  if (!res.ok) throw new Error(`创建 Gist 失败 HTTP ${res.status}（令牌需要 gist 权限）`);
  const gist = await res.json();
  setSetting('gistId', gist.id);
  return 'created';
}

let pushTimer = null;
let started = false;

export function initSync({ onPulled } = {}) {
  if (started || !syncConfigured()) return;
  started = true;

  // 启动拉取
  pullMerge().then(r => {
    if (r === 'pulled') onPulled?.();
  }).catch(() => {});

  // 数据变更 → 防抖 15s 推送
  window.addEventListener('md-data-changed', () => {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushNow().catch(() => {}); }, 15000);
  });

  // 离开页面前尽量推一把
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearTimeout(pushTimer);
      pushNow().catch(() => {});
    }
  });
}
