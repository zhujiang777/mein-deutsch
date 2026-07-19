const SDK_URL = new URL(
  '../vendor/azure-speech-sdk-1.50.0/microsoft.cognitiveservices.speech.sdk.bundle-min.js',
  import.meta.url,
).href;

let sdkPromise = null;

function sdkError(code, message) {
  const err = new Error(message);
  err.code = code;
  err.retryable = true;
  return err;
}

function finiteScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}

export function loadAzureSpeechSdk() {
  if (globalThis.SpeechSDK) return Promise.resolve(globalThis.SpeechSDK);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => globalThis.SpeechSDK
        ? resolve(globalThis.SpeechSDK)
        : reject(sdkError('sdk-load', 'Azure Speech SDK 加载后不可用'));
      script.onerror = () => reject(sdkError('sdk-load', '无法加载 Azure Speech SDK，请检查网络后重试'));
      document.head.appendChild(script);
    }).catch((err) => {
      sdkPromise = null;
      throw err;
    });
  }
  return sdkPromise;
}

// Speech SDK 的详细 JSON 与 REST 结果结构相同；聚合结果作为服务端
// 暂时不返回详细区块时的安全兜底。输出仍遵守前端统一 schema。
export function normalizeSpeechSdkResult(value, aggregate = {}, recognizedText = '') {
  const best = value?.NBest?.[0];
  const overall = best?.PronunciationAssessment || {};
  const pronunciation = finiteScore(overall.PronScore ?? aggregate.pronunciationScore);
  if (pronunciation == null) {
    throw sdkError('invalid-response', 'Azure Speech SDK 没有返回综合发音分');
  }
  return {
    schemaVersion: 1,
    recognizedText: String(best?.Display || value?.DisplayText || best?.Lexical || recognizedText || ''),
    overall: {
      pronunciation,
      accuracy: finiteScore(overall.AccuracyScore ?? aggregate.accuracyScore),
      fluency: finiteScore(overall.FluencyScore ?? aggregate.fluencyScore),
      completeness: finiteScore(overall.CompletenessScore ?? aggregate.completenessScore),
    },
    words: (best?.Words || []).map(item => ({
      word: String(item.Word || ''),
      accuracy: finiteScore(item.PronunciationAssessment?.AccuracyScore),
      errorType: String(item.PronunciationAssessment?.ErrorType || 'None'),
      phonemes: (item.Phonemes || []).map(phone => ({
        phoneme: String(phone.Phoneme || ''),
        accuracy: finiteScore(phone.PronunciationAssessment?.AccuracyScore),
      })).filter(phone => phone.phoneme),
    })).filter(item => item.word),
  };
}

export async function assessWithAzureSpeechSdk({ token, region, audioBlob, referenceText, timeoutMs = 20000 }) {
  const sdk = await loadAzureSpeechSdk();
  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
  speechConfig.speechRecognitionLanguage = 'de-DE';
  speechConfig.outputFormat = sdk.OutputFormat.Detailed;

  const file = new File([audioBlob], 'speech.wav', { type: 'audio/wav' });
  const audioConfig = sdk.AudioConfig.fromWavFileInput(file);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  const pronunciationConfig = sdk.PronunciationAssessmentConfig.fromJSON(JSON.stringify({
    referenceText: String(referenceText || '').trim(),
    gradingSystem: 'HundredMark',
    granularity: 'Phoneme',
    dimension: 'Comprehensive',
    enableMiscue: true,
  }));
  pronunciationConfig.applyTo(recognizer);
  let connection = null;
  try {
    connection = sdk.Connection.fromRecognizer(recognizer);
    connection.openConnection();
  } catch { /* SDK 会在 recognizeOnceAsync 时自行建连 */ }

  try {
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(sdkError('timeout', 'Azure Speech SDK 评分超时，请重试')), timeoutMs);
      recognizer.recognizeOnceAsync(
        value => { clearTimeout(timer); resolve(value); },
        reason => { clearTimeout(timer); reject(sdkError('service', `Azure Speech SDK 评分失败：${String(reason || 'unknown')}`)); },
      );
    });
    if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
      throw sdkError('no-speech', '没有检测到有效语音，请靠近麦克风再试');
    }
    let raw = {};
    try {
      const json = result.properties?.getProperty?.(sdk.PropertyId.SpeechServiceResponse_JsonResult);
      if (json) raw = JSON.parse(json);
    } catch { /* 聚合分仍可作为兜底 */ }
    const aggregate = sdk.PronunciationAssessmentResult.fromResult(result);
    return normalizeSpeechSdkResult(raw, aggregate, result.text);
  } finally {
    try { connection?.closeConnection(); } catch { /* 已由 recognizer 关闭 */ }
    recognizer.close();
    pronunciationConfig.close?.();
    audioConfig.close?.();
  }
}
