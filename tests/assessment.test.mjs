import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessPronunciation,
  clearSdkPreference,
  parseAssessmentResponse,
  preparePronunciationAssessment,
  sdkPreferenceActive,
  shouldFallbackToSdk,
  SPEAK_PASS,
} from '../js/pronunciation-assessment.js';
import { normalizeSpeechSdkResult } from '../js/azure-speech-sdk.js';
import { getAssessmentSecrets, setAssessmentSecrets } from '../js/secrets.js';
import { exportAll } from '../js/storage.js';

function localStorageMock() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
  };
}

test('normalizes the public assessment response and clamps scores', () => {
  const result = parseAssessmentResponse({
    schemaVersion: 1,
    recognizedText: 'Guten Morgen',
    overall: { pronunciation: 81.6, accuracy: 102, fluency: 75.4, completeness: -2 },
    words: [{
      word: 'Guten', accuracy: 77.5, errorType: 'None',
      phonemes: [{ phoneme: 'g', accuracy: 88.2 }],
    }],
  });
  assert.deepEqual(result.overall, { pronunciation: 82, accuracy: 100, fluency: 75, completeness: 0 });
  assert.equal(result.words[0].phonemes[0].accuracy, 88);
  assert.equal(SPEAK_PASS, 70);
});

test('rejects a response without a real pronunciation score', () => {
  assert.throws(() => parseAssessmentResponse({ schemaVersion: 1, overall: {}, words: [] }), /综合发音分/);
});

test('normalizes Speech SDK aggregate scores when REST detail is missing', () => {
  const result = normalizeSpeechSdkResult({}, {
    pronunciationScore: 79.6,
    accuracyScore: 76.2,
    fluencyScore: 84.4,
    completenessScore: 100,
  }, 'Guten Morgen');
  assert.deepEqual(result.overall, {
    pronunciation: 80,
    accuracy: 76,
    fluency: 84,
    completeness: 100,
  });
  assert.equal(result.recognizedText, 'Guten Morgen');
  assert.deepEqual(result.words, []);
});

test('keeps endpoint and access code out of progress export', () => {
  globalThis.localStorage = localStorageMock();
  setAssessmentSecrets({
    endpoint: 'https://example.workers.dev/',
    accessCode: 'private-access-code',
  });
  assert.deepEqual(getAssessmentSecrets(), {
    endpoint: 'https://example.workers.dev',
    accessCode: 'private-access-code',
  });
  const exported = exportAll();
  assert.equal(exported.includes('private-access-code'), false);
  assert.equal(exported.includes('example.workers.dev'), false);
});

function fakeSpeechSdk({ fail = false } = {}) {
  let recognitionCount = 0;
  return {
    sdk: {
      SpeechConfig: { fromAuthorizationToken: () => ({}) },
      AudioConfig: { fromWavFileInput: () => ({ close() {} }) },
      SpeechRecognizer: class {
        recognizeOnceAsync(resolve, reject) {
          recognitionCount++;
          if (fail) reject('simulated sdk failure');
          else resolve({
            reason: 'recognized',
            text: 'Hallo',
            properties: {
              getProperty: () => JSON.stringify({
                NBest: [{
                  Display: 'Hallo',
                  PronunciationAssessment: {
                    PronScore: 88, AccuracyScore: 87, FluencyScore: 89, CompletenessScore: 100,
                  },
                  Words: [],
                }],
              }),
            },
          });
        }
        close() {}
      },
      PronunciationAssessmentConfig: {
        fromJSON: () => ({ applyTo() {}, close() {} }),
      },
      PronunciationAssessmentResult: {
        fromResult: () => ({
          pronunciationScore: 88, accuracyScore: 87, fluencyScore: 89, completenessScore: 100,
        }),
      },
      Connection: { fromRecognizer: () => ({ openConnection() {}, closeConnection() {} }) },
      OutputFormat: { Detailed: 'detailed' },
      ResultReason: { RecognizedSpeech: 'recognized' },
      PropertyId: { SpeechServiceResponse_JsonResult: 'json' },
    },
    recognitionCount: () => recognitionCount,
  };
}

test('provider timeout automatically reuses the recording with SDK and remembers it for 24 hours', async () => {
  globalThis.localStorage = localStorageMock();
  clearSdkPreference();
  setAssessmentSecrets({ endpoint: 'https://fallback.test', accessCode: 'fallback-code' });
  const fake = fakeSpeechSdk();
  globalThis.SpeechSDK = fake.sdk;
  const originalFetch = globalThis.fetch;
  let restCalls = 0;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/v1/pronunciation/assess')) {
      restCalls++;
      return new Response(JSON.stringify({
        error: { code: 'provider-timeout', message: 'Azure 评分响应超时' },
      }), { status: 504, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      schemaVersion: 1, token: 'temporary-token', region: 'germanywestcentral', expiresIn: 540,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const stages = [];
    const input = { audioBlob: new Blob(['wav']), referenceText: 'Hallo', onStage: stage => stages.push(stage) };
    const first = await assessPronunciation(input);
    const second = await assessPronunciation(input);
    assert.equal(first.overall.pronunciation, 88);
    assert.equal(second.overall.pronunciation, 88);
    assert.deepEqual(stages.slice(0, 2), ['rest', 'fallback']);
    assert.equal(stages.at(-1), 'sdk');
    assert.equal(restCalls, 1);
    assert.equal(fake.recognitionCount(), 2);
    assert.equal(sdkPreferenceActive('https://fallback.test'), true);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.SpeechSDK;
    clearSdkPreference();
  }
});

test('explicit authentication errors do not switch to SDK', async () => {
  globalThis.localStorage = localStorageMock();
  clearSdkPreference();
  setAssessmentSecrets({ endpoint: 'https://auth-error.test', accessCode: 'wrong-code' });
  const fake = fakeSpeechSdk();
  globalThis.SpeechSDK = fake.sdk;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: 'unauthorized', message: '访问码不正确' },
  }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  try {
    await assert.rejects(
      assessPronunciation({ audioBlob: new Blob(['wav']), referenceText: 'Hallo' }),
      error => error.code === 'unauthorized',
    );
    assert.equal(fake.recognitionCount(), 0);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.SpeechSDK;
  }
});

test('client timeout and missing REST score are automatic fallback signals', () => {
  assert.equal(shouldFallbackToSdk({ code: 'timeout' }), true);
  assert.equal(shouldFallbackToSdk({ code: 'provider-assessment-missing' }), true);
  assert.equal(shouldFallbackToSdk({ code: 'quota' }), false);
});

test('SDK token and bundle preheating is reused for the same endpoint', async () => {
  globalThis.localStorage = localStorageMock();
  setAssessmentSecrets({ endpoint: 'https://preheat.test', accessCode: 'preheat-code' });
  globalThis.SpeechSDK = fakeSpeechSdk().sdk;
  const originalFetch = globalThis.fetch;
  let tokenCalls = 0;
  globalThis.fetch = async () => {
    tokenCalls++;
    return new Response(JSON.stringify({
      schemaVersion: 1, token: 'preheated-token', region: 'germanywestcentral', expiresIn: 540,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const first = preparePronunciationAssessment({ force: true });
    const second = preparePronunciationAssessment({ force: true });
    assert.equal(first, second);
    assert.equal(await first, true);
    assert.equal(tokenCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.SpeechSDK;
  }
});

test('a failed SDK fallback clears the persistent transport preference', async () => {
  globalThis.localStorage = localStorageMock();
  clearSdkPreference();
  setAssessmentSecrets({ endpoint: 'https://double-failure.test', accessCode: 'double-code' });
  globalThis.SpeechSDK = fakeSpeechSdk({ fail: true }).sdk;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => String(url).endsWith('/v1/pronunciation/assess')
    ? new Response(JSON.stringify({ error: { code: 'provider-timeout', message: 'slow' } }), {
        status: 504, headers: { 'Content-Type': 'application/json' },
      })
    : new Response(JSON.stringify({
        schemaVersion: 1, token: 'temporary-token', region: 'germanywestcentral', expiresIn: 540,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    await assert.rejects(
      assessPronunciation({ audioBlob: new Blob(['wav']), referenceText: 'Hallo' }),
      error => error.code === 'service',
    );
    assert.equal(sdkPreferenceActive('https://double-failure.test'), false);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.SpeechSDK;
  }
});
