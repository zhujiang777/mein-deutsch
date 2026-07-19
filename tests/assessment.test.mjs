import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAssessmentResponse, SPEAK_PASS } from '../js/pronunciation-assessment.js';
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
