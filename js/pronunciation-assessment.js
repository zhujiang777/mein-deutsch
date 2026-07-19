import { getAssessmentSecrets } from './secrets.js';

export const SPEAK_PASS = 70;
const REQUEST_TIMEOUT_MS = 15000;

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
    return value?.error?.message || value?.message || '';
  } catch {
    return '';
  }
}

function statusError(status, detail = '') {
  if (status === 401) return new AssessmentError('unauthorized', '访问码不正确，请到设置中重新填写', { status });
  if (status === 413) return new AssessmentError('audio-too-large', '录音过长，请控制在 20 秒内', { status });
  if (status === 422) return new AssessmentError('no-speech', detail || '没有检测到有效语音，请靠近麦克风再试', { status, retryable: true });
  if (status === 429) return new AssessmentError('quota', '本月免费额度或当前请求频率已达到限制', { status, retryable: true });
  return new AssessmentError('service', detail || `评分服务暂时不可用（HTTP ${status}）`, { status, retryable: status >= 500 });
}

async function fetchWithTimeout(url, options = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), REQUEST_TIMEOUT_MS);
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

export async function checkAssessmentConnection() {
  const { endpoint, accessCode } = getAssessmentSecrets();
  if (!endpoint || !accessCode) throw new AssessmentError('not-configured', '请先填写 Worker 地址和访问码');
  const res = await fetchWithTimeout(`${endpoint}/v1/health`, {
    headers: authHeaders(accessCode),
  });
  if (!res.ok) throw statusError(res.status, await readError(res));
  return true;
}

export async function assessPronunciation({ audioBlob, referenceText }) {
  const { endpoint, accessCode } = getAssessmentSecrets();
  if (!endpoint || !accessCode) throw new AssessmentError('not-configured', '请先到设置中配置发音评分');
  if (!(audioBlob instanceof Blob) || !audioBlob.size) {
    throw new AssessmentError('audio-unavailable', '本设备未能生成评分音频，请使用录音对比自查');
  }

  const body = new FormData();
  body.append('audio', audioBlob, 'speech.wav');
  body.append('referenceText', String(referenceText || '').trim());
  body.append('locale', 'de-DE');

  const res = await fetchWithTimeout(`${endpoint}/v1/pronunciation/assess`, {
    method: 'POST',
    headers: authHeaders(accessCode),
    body,
  });
  if (!res.ok) throw statusError(res.status, await readError(res));
  return parseAssessmentResponse(await res.json());
}

export function assessmentErrorMessage(err) {
  return err?.message || '发音评分暂时不可用，请稍后重试';
}
