const DEFAULT_ORIGIN = 'https://zhujiang777.github.io';
const DEFAULT_MAX_AUDIO_BYTES = 1024 * 1024;
const MAX_REFERENCE_CHARS = 500;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || DEFAULT_ORIGIN)
    .split(',')
    .map(value => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const normalized = String(origin || '').replace(/\/+$/, '');
  const allowed = allowedOrigins(env);
  const selected = allowed.includes(normalized) ? normalized : allowed[0];
  return {
    'Access-Control-Allow-Origin': selected,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(value, status, origin, env) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin, env),
    },
  });
}

function errorResponse(err, origin, env) {
  const status = err instanceof HttpError ? err.status : 500;
  const code = err instanceof HttpError ? err.code : 'internal';
  const message = err instanceof HttpError ? err.message : '评分服务内部错误';
  return jsonResponse({ error: { code, message } }, status, origin, env);
}

async function sameSecret(provided, expected) {
  if (!provided || !expected) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function requireAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!await sameSecret(token, env.APP_ACCESS_TOKEN)) {
    throw new HttpError(401, 'unauthorized', '访问码不正确');
  }
}

function utf8Base64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function buildPronunciationHeader(referenceText) {
  return utf8Base64(JSON.stringify({
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: true,
  }));
}

function ascii(view, offset, length) {
  let value = '';
  for (let i = 0; i < length; i++) value += String.fromCharCode(view.getUint8(offset + i));
  return value;
}

export function validateAssessmentWav(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 44) return false;
  const view = new DataView(buffer);
  return ascii(view, 0, 4) === 'RIFF'
    && ascii(view, 8, 4) === 'WAVE'
    && view.getUint16(20, true) === 1
    && view.getUint16(22, true) === 1
    && view.getUint32(24, true) === 16000
    && view.getUint16(34, true) === 16;
}

function score(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}

export function normalizeAzureResponse(value) {
  if (!value || value.RecognitionStatus !== 'Success') {
    const status = value?.RecognitionStatus || 'NoMatch';
    throw new HttpError(422, 'no-speech', `没有检测到有效语音（${status}）`);
  }
  const best = value.NBest?.[0];
  const overall = best?.PronunciationAssessment;
  const pronunciation = score(overall?.PronScore);
  if (!best || pronunciation == null) {
    throw new HttpError(502, 'invalid-provider-response', 'Azure 未返回有效的德语发音分');
  }

  return {
    schemaVersion: 1,
    recognizedText: String(best.Display || value.DisplayText || best.Lexical || ''),
    overall: {
      pronunciation,
      accuracy: score(overall.AccuracyScore),
      fluency: score(overall.FluencyScore),
      completeness: score(overall.CompletenessScore),
    },
    words: (best.Words || []).map(item => ({
      word: String(item.Word || ''),
      accuracy: score(item.PronunciationAssessment?.AccuracyScore),
      errorType: String(item.PronunciationAssessment?.ErrorType || 'None'),
      phonemes: (item.Phonemes || []).map(phone => ({
        phoneme: String(phone.Phoneme || ''),
        accuracy: score(phone.PronunciationAssessment?.AccuracyScore),
      })).filter(phone => phone.phoneme),
    })).filter(item => item.word),
  };
}

async function callAzure(audioBuffer, referenceText, env) {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) {
    throw new HttpError(503, 'not-configured', 'Worker 尚未配置 Azure Speech');
  }
  const region = String(env.AZURE_SPEECH_REGION).trim();
  if (!/^[a-z0-9-]+$/i.test(region)) {
    throw new HttpError(503, 'not-configured', 'Azure Speech 区域配置无效');
  }
  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=de-DE&format=detailed&profanity=raw`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Pronunciation-Assessment': buildPronunciationHeader(referenceText),
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Accept': 'application/json',
      },
      body: audioBuffer,
    });
  } catch {
    throw new HttpError(502, 'provider-network', '暂时无法连接 Azure Speech');
  }

  if (res.status === 429) {
    throw new HttpError(429, 'quota', 'Azure 免费额度或当前请求频率已达到限制');
  }
  if (!res.ok) {
    throw new HttpError(502, 'provider-error', `Azure Speech 请求失败（HTTP ${res.status}）`);
  }
  let value;
  try { value = await res.json(); }
  catch { throw new HttpError(502, 'invalid-provider-response', 'Azure 返回了无法解析的数据'); }
  return normalizeAzureResponse(value);
}

async function assess(request, env) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('multipart/form-data')) {
    throw new HttpError(400, 'invalid-content-type', '请求必须使用 multipart/form-data');
  }
  let form;
  try { form = await request.formData(); }
  catch { throw new HttpError(400, 'invalid-form', '无法读取评分请求'); }
  const audio = form.get('audio');
  const referenceText = String(form.get('referenceText') || '').trim();
  const locale = String(form.get('locale') || 'de-DE');
  if (!(audio instanceof File) || !audio.size) throw new HttpError(400, 'missing-audio', '缺少录音文件');
  if (!referenceText || referenceText.length > MAX_REFERENCE_CHARS) {
    throw new HttpError(400, 'invalid-reference', '参考文本必须为 1–500 个字符');
  }
  if (locale !== 'de-DE') throw new HttpError(400, 'invalid-locale', '当前仅支持 de-DE');
  const maxBytes = Number(env.MAX_AUDIO_BYTES) || DEFAULT_MAX_AUDIO_BYTES;
  if (audio.size > maxBytes) throw new HttpError(413, 'audio-too-large', '录音过长，请控制在 20 秒内');
  const audioBuffer = await audio.arrayBuffer();
  if (!validateAssessmentWav(audioBuffer)) {
    throw new HttpError(422, 'invalid-audio', '录音必须是 16 kHz、单声道、16-bit PCM WAV');
  }
  return callAzure(audioBuffer, referenceText, env);
}

async function handle(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (origin && !allowedOrigins(env).includes(origin.replace(/\/+$/, ''))) {
    throw new HttpError(403, 'origin-denied', '不允许的网页来源');
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
  }
  await requireAuth(request, env);
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/v1/health') {
    const azureConfigured = !!(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);
    if (!azureConfigured) throw new HttpError(503, 'not-configured', 'Worker 尚未配置 Azure Speech');
    return jsonResponse({ ok: true, azureConfigured }, 200, origin, env);
  }
  if (request.method === 'POST' && url.pathname === '/v1/pronunciation/assess') {
    return jsonResponse(await assess(request, env), 200, origin, env);
  }
  throw new HttpError(404, 'not-found', '接口不存在');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    try { return await handle(request, env); }
    catch (err) { return errorResponse(err, origin, env); }
  },
};
