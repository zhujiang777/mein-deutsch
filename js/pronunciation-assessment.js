import { getAssessmentSecrets } from './secrets.js';
import { assessWithAzureSpeechSdk, loadAzureSpeechSdk } from './azure-speech-sdk.js';

export const SPEAK_PASS = 70;
export const ASSESSMENT_TIMEOUTS = Object.freeze({
  health: 8000,
  token: 8000,
  rest: 12000,
  sdk: 20000,
  preloadAfter: 6000,
});
const SDK_PREFERENCE_KEY = 'md.pa.sdk-preferred.v2';
const SDK_PREFERENCE_MS = 24 * 60 * 60 * 1000;

let tokenCache = null;
let sdkPreparation = null;
let sdkPreparationKey = '';

export class AssessmentError extends Error {
  constructor(code, message, { status = 0, retryable = false } = {}) {
    super(message);
    this.name = 'AssessmentError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function assessmentConfigured() {
  const { endpoint, accessCode } = getAssessmentSecrets();
  return !!(endpoint && accessCode);
}

function finiteScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}

export function parseAssessmentResponse(value) {
  if (!value || value.schemaVersion !== 1 || !value.overall || !Array.isArray(value.words)) {
    throw new AssessmentError('invalid-response', '评分服务返回了无法识别的数据', { retryable: true });
  }
  const pronunciation = finiteScore(value.overall.pronunciation);
  if (pronunciation == null) {
    throw new AssessmentError('invalid-response', '评分服务没有返回综合发音分', { retryable: true });
  }
  return {
    schemaVersion: 1,
    recognizedText: String(value.recognizedText || ''),
    overall: {
      pronunciation,
      accuracy: finiteScore(value.overall.accuracy),
      fluency: finiteScore(value.overall.fluency),
      completeness: finiteScore(value.overall.completeness),
    },
    words: value.words.map(item => ({
      word: String(item.word || ''),
      accuracy: finiteScore(item.accuracy),
      errorType: String(item.errorType || 'None'),
      phonemes: Array.isArray(item.phonemes) ? item.phonemes.map(phone => ({
        phoneme: String(phone.phoneme || ''),
        accuracy: finiteScore(phone.accuracy),
      })).filter(phone => phone.phoneme) : [],
    })).filter(item => item.word),
  };
}

async function readError(res) {
  try {
    const value = await res.json();
    return {
      code: String(value?.error?.code || ''),
      message: String(value?.error?.message || value?.message || ''),
    };
  } catch {
    return { code: '', message: '' };
  }
}

function statusError(status, detail = {}) {
  const message = typeof detail === 'string' ? detail : detail.message;
  const providerCode = typeof detail === 'object' ? detail.code : '';
  if (status === 401) return new AssessmentError('unauthorized', '访问码不正确，请到设置中重新填写', { status });
  if (status === 413) return new AssessmentError('audio-too-large', '录音过长，请控制在 20 秒内', { status });
  if (status === 422) return new AssessmentError('no-speech', message || '没有检测到有效语音，请靠近麦克风再试', { status, retryable: true });
  if (status === 429) return new AssessmentError('quota', '本月免费额度或当前请求频率已达到限制', { status, retryable: true });
  return new AssessmentError(providerCode || 'service', message || `评分服务暂时不可用（HTTP ${status}）`, { status, retryable: status >= 500 });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = ASSESSMENT_TIMEOUTS.rest) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctl.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new AssessmentError('timeout', '评分等待超时，请检查网络后重试', { retryable: true });
    }
    throw new AssessmentError('network', '无法连接发音评分服务，请检查网络', { retryable: true });
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(accessCode) {
  return { Authorization: `Bearer ${accessCode}` };
}

export function sdkPreferenceActive(endpoint) {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(SDK_PREFERENCE_KEY) || 'null');
    return value?.endpoint === endpoint && Number(value?.until) > Date.now();
  } catch { return false; }
}

export function rememberSdkPreference(endpoint, now = Date.now()) {
  try {
    globalThis.localStorage?.setItem(SDK_PREFERENCE_KEY, JSON.stringify({
      endpoint,
      until: now + SDK_PREFERENCE_MS,
    }));
  } catch { /* 非关键性能提示，存储不可用时忽略 */ }
}

export function clearSdkPreference() {
  try { globalThis.localStorage?.removeItem(SDK_PREFERENCE_KEY); }
  catch { /* 存储不可用时忽略 */ }
}

export function shouldFallbackToSdk(error) {
  return ['provider-timeout', 'provider-assessment-missing', 'timeout', 'invalid-response'].includes(error?.code);
}

export async function checkAssessmentConnection() {
  const { endpoint, accessCode } = getAssessmentSecrets();
  if (!endpoint || !accessCode) throw new AssessmentError('not-configured', '请先填写 Worker 地址和访问码');
  const res = await fetchWithTimeout(`${endpoint}/v1/health`, {
    headers: authHeaders(accessCode),
  }, ASSESSMENT_TIMEOUTS.health);
  if (!res.ok) throw statusError(res.status, await readError(res));
  return true;
}

async function getSpeechSdkToken(endpoint, accessCode) {
  if (tokenCache?.endpoint === endpoint
      && tokenCache?.accessCode === accessCode
      && tokenCache.expiresAt > Date.now()) {
    return tokenCache.credentials;
  }
  const res = await fetchWithTimeout(`${endpoint}/v1/speech/token`, {
    method: 'POST',
    headers: authHeaders(accessCode),
  }, ASSESSMENT_TIMEOUTS.token);
  if (!res.ok) throw statusError(res.status, await readError(res));
  let value;
  try { value = await res.json(); }
  catch { throw new AssessmentError('invalid-response', 'Worker 没有返回可用的 Azure 临时令牌', { retryable: true }); }
  if (value?.schemaVersion !== 1 || !value.token || !value.region) {
    throw new AssessmentError('invalid-response', 'Worker 返回的 Azure 临时令牌无效', { retryable: true });
  }
  const credentials = { token: String(value.token), region: String(value.region) };
  tokenCache = {
    endpoint,
    accessCode,
    credentials,
    expiresAt: Date.now() + Math.min(Number(value.expiresIn) || 540, 540) * 1000,
  };
  return credentials;
}

// 已确认 REST 漏分的当前标签页，在用户录音期间提前加载 SDK 并获取短期令牌。
// 不预热仍可用 REST 的新会话，避免不必要的 456KB 下载。
export function preparePronunciationAssessment({ force = false } = {}) {
  const { endpoint, accessCode } = getAssessmentSecrets();
  if (!endpoint || !accessCode || (!force && !sdkPreferenceActive(endpoint))) return Promise.resolve(false);
  const preparationKey = `${endpoint}|${accessCode}`;
  if (!sdkPreparation || sdkPreparationKey !== preparationKey) {
    sdkPreparationKey = preparationKey;
    sdkPreparation = Promise.all([
      getSpeechSdkToken(endpoint, accessCode),
      loadAzureSpeechSdk(),
    ]).then(() => true).catch((err) => {
      sdkPreparation = null;
      sdkPreparationKey = '';
      throw err;
    });
  }
  return sdkPreparation;
}

async function assessWithSdkFallback({ endpoint, accessCode, audioBlob, referenceText }) {
  try {
    const [credentials] = await Promise.all([
      getSpeechSdkToken(endpoint, accessCode),
      loadAzureSpeechSdk(),
    ]);
    return parseAssessmentResponse(await assessWithAzureSpeechSdk({
      ...credentials,
      audioBlob,
      referenceText,
      timeoutMs: ASSESSMENT_TIMEOUTS.sdk,
    }));
  } catch (err) {
    clearSdkPreference();
    if (err instanceof AssessmentError) throw err;
    throw new AssessmentError(err?.code || 'service', err?.message || 'Azure Speech SDK 评分失败', {
      retryable: err?.retryable !== false,
    });
  }
}

export async function assessPronunciation({ audioBlob, referenceText, onStage }) {
  const { endpoint, accessCode } = getAssessmentSecrets();
  if (!endpoint || !accessCode) throw new AssessmentError('not-configured', '请先到设置中配置发音评分');
  if (!(audioBlob instanceof Blob) || !audioBlob.size) {
    throw new AssessmentError('audio-unavailable', '本设备未能生成评分音频，请使用录音对比自查');
  }

  if (sdkPreferenceActive(endpoint)) {
    onStage?.('sdk');
    const result = await assessWithSdkFallback({ endpoint, accessCode, audioBlob, referenceText });
    rememberSdkPreference(endpoint);
    return result;
  }

  const body = new FormData();
  body.append('audio', audioBlob, 'speech.wav');
  body.append('referenceText', String(referenceText || '').trim());
  body.append('locale', 'de-DE');

  onStage?.('rest');
  let preparation = null;
  const preloadTimer = setTimeout(() => {
    onStage?.('slow');
    preparation = preparePronunciationAssessment({ force: true }).catch(() => false);
  }, ASSESSMENT_TIMEOUTS.preloadAfter);

  let restError = null;
  try {
    const res = await fetchWithTimeout(`${endpoint}/v1/pronunciation/assess`, {
      method: 'POST',
      headers: authHeaders(accessCode),
      body,
    }, ASSESSMENT_TIMEOUTS.rest);
    if (!res.ok) {
      const detail = await readError(res);
      if (detail.code === 'provider-timeout' || detail.code === 'provider-assessment-missing') {
        restError = new AssessmentError(detail.code, detail.message || '主评分服务响应较慢', {
          status: res.status,
          retryable: true,
        });
      } else {
        throw statusError(res.status, detail);
      }
    } else {
      try {
        return parseAssessmentResponse(await res.json());
      } catch (error) {
        if (!shouldFallbackToSdk(error)) throw error;
        restError = error;
      }
    }
  } catch (error) {
    if (!shouldFallbackToSdk(error)) throw error;
    restError = error;
  } finally {
    clearTimeout(preloadTimer);
  }

  if (!shouldFallbackToSdk(restError)) throw restError;
  onStage?.('fallback');
  if (!preparation) preparation = preparePronunciationAssessment({ force: true }).catch(() => false);
  await preparation;
  const result = await assessWithSdkFallback({ endpoint, accessCode, audioBlob, referenceText });
  rememberSdkPreference(endpoint);
  return result;
}

export function assessmentErrorMessage(err) {
  return err?.message || '发音评分暂时不可用，请稍后重试';
}
