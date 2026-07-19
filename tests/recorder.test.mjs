import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSESSMENT_SAMPLE_RATE,
  MAX_RECORDING_MS,
  downsamplePcm,
  encodePcm16Wav,
} from '../js/recorder.js';

test('downsamples one second of 48 kHz PCM to 16 kHz', () => {
  const input = new Float32Array(48000);
  for (let i = 0; i < input.length; i++) input[i] = Math.sin(2 * Math.PI * 440 * i / 48000);
  const output = downsamplePcm(input, 48000);
  assert.equal(output.length, ASSESSMENT_SAMPLE_RATE);
  assert.ok(output.some(value => Math.abs(value) > 0.1));
});

test('encodes the Azure assessment WAV contract', () => {
  const wav = encodePcm16Wav(new Float32Array(1600).fill(0.25));
  const view = new DataView(wav);
  const text = (offset, length) => String.fromCharCode(...new Uint8Array(wav, offset, length));
  assert.equal(text(0, 4), 'RIFF');
  assert.equal(text(8, 4), 'WAVE');
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 3200);
});

test('keeps the recording hard limit at 20 seconds', () => {
  assert.equal(MAX_RECORDING_MS, 20000);
});
