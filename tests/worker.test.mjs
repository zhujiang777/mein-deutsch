import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {
  buildPronunciationHeader,
  normalizeAzureResponse,
  validateAssessmentWav,
} from '../worker/src/index.js';
import { encodePcm16Wav } from '../js/recorder.js';

const origin = 'https://zhujiang777.github.io';
const env = {
  ALLOWED_ORIGINS: origin,
  MAX_AUDIO_BYTES: '1048576',
  APP_ACCESS_TOKEN: 'test-access-code',
  AZURE_SPEECH_KEY: 'azure-secret',
  AZURE_SPEECH_REGION: 'germanywestcentral',
};

function authHeaders(extra = {}) {
  return { Origin: origin, Authorization: 'Bearer test-access-code', ...extra };
}

function azureResult() {
  return {
    RecognitionStatus: 'Success',
    DisplayText: 'Guten Morgen.',
    NBest: [{
      Display: 'Guten Morgen.',
      PronunciationAssessment: {
        PronScore: 82.2,
        AccuracyScore: 80.1,
        FluencyScore: 86,
        CompletenessScore: 100,
      },
      Words: [{
        Word: 'Guten',
        PronunciationAssessment: { AccuracyScore: 78.4, ErrorType: 'None' },
        Phonemes: [{ Phoneme: 'g', PronunciationAssessment: { AccuracyScore: 75.2 } }],
      }],
    }],
  };
}

test('builds a UTF-8 pronunciation header with scripted phoneme scoring', () => {
  const decoded = JSON.parse(Buffer.from(buildPronunciationHeader('Grüß dich!'), 'base64').toString('utf8'));
  assert.equal(decoded.ReferenceText, 'Grüß dich!');
  assert.equal(decoded.Granularity, 'Phoneme');
  assert.equal(decoded.Dimension, 'Comprehensive');
  assert.equal(decoded.EnableMiscue, true);
});

test('validates exactly the WAV format sent to Azure', () => {
  const wav = encodePcm16Wav(new Float32Array(160));
  assert.equal(validateAssessmentWav(wav), true);
  const invalid = wav.slice(0);
  new DataView(invalid).setUint32(24, 48000, true);
  assert.equal(validateAssessmentWav(invalid), false);
});

test('normalizes Azure detailed results without exposing the raw response', () => {
  const result = normalizeAzureResponse(azureResult());
  assert.deepEqual(result.overall, { pronunciation: 82, accuracy: 80, fluency: 86, completeness: 100 });
  assert.deepEqual(result.words[0], {
    word: 'Guten', accuracy: 78, errorType: 'None', phonemes: [{ phoneme: 'g', accuracy: 75 }],
  });
  assert.equal('NBest' in result, false);
});

test('health requires the personal access code and returns CORS headers', async () => {
  const denied = await worker.fetch(new Request('https://worker.test/v1/health', {
    headers: { Origin: origin },
  }), env);
  assert.equal(denied.status, 401);

  const ok = await worker.fetch(new Request('https://worker.test/v1/health', {
    headers: authHeaders(),
  }), env);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), origin);
});

test('answers CORS preflight without exposing the access code', async () => {
  const res = await worker.fetch(new Request('https://worker.test/v1/pronunciation/assess', {
    method: 'OPTIONS',
    headers: { Origin: origin },
  }), env);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Headers'), 'Authorization, Content-Type');
});

test('assessment forwards WAV to Azure and returns the stable schema', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /language=de-DE/);
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'azure-secret');
    assert.equal(options.headers['Content-Type'], 'audio/wav; codecs=audio/pcm; samplerate=16000');
    return new Response(JSON.stringify(azureResult()), { status: 200 });
  };
  try {
    const form = new FormData();
    form.append('audio', new Blob([encodePcm16Wav(new Float32Array(1600))], { type: 'audio/wav' }), 'speech.wav');
    form.append('referenceText', 'Guten Morgen.');
    form.append('locale', 'de-DE');
    const res = await worker.fetch(new Request('https://worker.test/v1/pronunciation/assess', {
      method: 'POST', headers: authHeaders(), body: form,
    }), env);
    assert.equal(res.status, 200);
    const value = await res.json();
    assert.equal(value.schemaVersion, 1);
    assert.equal(value.overall.pronunciation, 82);
    assert.equal(JSON.stringify(value).includes('azure-secret'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('issues a short-lived Speech SDK token without exposing the Azure key', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /southeastasia\.api\.cognitive\.microsoft\.com\/sts\/v1\.0\/issueToken/);
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'azure-secret');
    return new Response('temporary-speech-token', { status: 200 });
  };
  try {
    const res = await worker.fetch(new Request('https://worker.test/v1/speech/token', {
      method: 'POST', headers: authHeaders(),
    }), { ...env, AZURE_SPEECH_REGION: 'southeastasia' });
    assert.equal(res.status, 200);
    const value = await res.json();
    assert.equal(value.token, 'temporary-speech-token');
    assert.equal(value.region, 'southeastasia');
    assert.equal(JSON.stringify(value).includes('azure-secret'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('maps a successful recognition without assessment to the SDK fallback signal', async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  console.warn = () => {};
  globalThis.fetch = async () => new Response(JSON.stringify({
    RecognitionStatus: 'Success',
    NBest: [{ Display: 'Guten Morgen.' }],
  }), { status: 200 });
  try {
    const form = new FormData();
    form.append('audio', new Blob([encodePcm16Wav(new Float32Array(1600))], { type: 'audio/wav' }), 'speech.wav');
    form.append('referenceText', 'Guten Morgen.');
    form.append('locale', 'de-DE');
    const res = await worker.fetch(new Request('https://worker.test/v1/pronunciation/assess', {
      method: 'POST', headers: authHeaders(), body: form,
    }), env);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).error.code, 'provider-assessment-missing');
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test('rejects unknown origins and invalid audio before calling Azure', async () => {
  const badOrigin = await worker.fetch(new Request('https://worker.test/v1/health', {
    headers: { Origin: 'https://attacker.example', Authorization: 'Bearer test-access-code' },
  }), env);
  assert.equal(badOrigin.status, 403);

  const form = new FormData();
  form.append('audio', new Blob(['not wav'], { type: 'audio/wav' }), 'speech.wav');
  form.append('referenceText', 'Guten Morgen.');
  form.append('locale', 'de-DE');
  const invalid = await worker.fetch(new Request('https://worker.test/v1/pronunciation/assess', {
    method: 'POST', headers: authHeaders(), body: form,
  }), env);
  assert.equal(invalid.status, 422);
});

test('maps Azure free-tier throttling to a stable 429 response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 429 });
  try {
    const form = new FormData();
    form.append('audio', new Blob([encodePcm16Wav(new Float32Array(160))], { type: 'audio/wav' }), 'speech.wav');
    form.append('referenceText', 'Hallo!');
    form.append('locale', 'de-DE');
    const res = await worker.fetch(new Request('https://worker.test/v1/pronunciation/assess', {
      method: 'POST', headers: authHeaders(), body: form,
    }), env);
    assert.equal(res.status, 429);
    assert.equal((await res.json()).error.code, 'quota');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
