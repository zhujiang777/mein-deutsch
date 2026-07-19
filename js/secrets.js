// 仅限当前设备的敏感配置。这个键不属于 storage.js 的 KEYS，
// 因此不会进入进度导出或 Gist 同步。
export const LOCAL_SECRETS_KEY = 'md.local.secrets.v1';

function loadSecrets() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SECRETS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSecrets(value) {
  localStorage.setItem(LOCAL_SECRETS_KEY, JSON.stringify(value));
}

export function getAssessmentSecrets() {
  const value = loadSecrets();
  return {
    endpoint: String(value.assessmentEndpoint || '').replace(/\/+$/, ''),
    accessCode: String(value.assessmentAccessCode || ''),
  };
}

export function setAssessmentSecrets({ endpoint, accessCode }) {
  const value = loadSecrets();
  value.assessmentEndpoint = String(endpoint || '').trim().replace(/\/+$/, '');
  value.assessmentAccessCode = String(accessCode || '').trim();
  saveSecrets(value);
}

export function clearLocalSecrets() {
  localStorage.removeItem(LOCAL_SECRETS_KEY);
}
