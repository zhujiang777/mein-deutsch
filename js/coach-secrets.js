// 今日文章 Worker 的本机配置。
//
// 独立于 js/secrets.js（Azure 发音评测）：两个 Worker 的风险和密钥边界不该混在一起，
// 一个配错不应该让另一个也不能用。和那边一样，这个键不属于 storage.js 的 KEYS，
// 因此不会进入进度导出或 Gist 同步。
export const COACH_SECRETS_KEY = 'md.local.coach.v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(COACH_SECRETS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getCoachSecrets() {
  const value = load();
  return {
    endpoint: String(value.endpoint || '').replace(/\/+$/, ''),
    accessCode: String(value.accessCode || ''),
  };
}

export function setCoachSecrets({ endpoint, accessCode }) {
  localStorage.setItem(COACH_SECRETS_KEY, JSON.stringify({
    endpoint: String(endpoint || '').trim().replace(/\/+$/, ''),
    accessCode: String(accessCode || '').trim(),
  }));
}

export function coachConfigured() {
  const { endpoint, accessCode } = getCoachSecrets();
  return !!endpoint && !!accessCode;
}

export function clearCoachSecrets() {
  localStorage.removeItem(COACH_SECRETS_KEY);
}
