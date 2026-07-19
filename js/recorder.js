// 录音封装：一条 getUserMedia 音轨同时供 MediaRecorder 回放和 PCM 发音评分使用。
// PCM 分支失败不会影响原有的录音对比功能。

export const ASSESSMENT_SAMPLE_RATE = 16000;
export const MAX_RECORDING_MS = 20000;

export function recordingSupported() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

// iOS Safari 只认 mp4，其余浏览器用 webm 兜底；都不支持则交给浏览器决定。
function pickMimeType() {
  if (!window.MediaRecorder?.isTypeSupported) return '';
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
}

function mergeFloat32(chunks) {
  const length = chunks.reduce((n, chunk) => n + chunk.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

export function downsamplePcm(input, inputRate, outputRate = ASSESSMENT_SAMPLE_RATE) {
  if (!(input instanceof Float32Array) || !input.length) return new Float32Array();
  if (!Number.isFinite(inputRate) || inputRate <= 0 || outputRate <= 0) return new Float32Array();
  if (inputRate === outputRate) return new Float32Array(input);

  const ratio = inputRate / outputRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.max(start + 1, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    output[i] = sum / (end - start);
  }
  return output;
}

function writeAscii(view, offset, value) {
  for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}

export function encodePcm16Wav(samples, sampleRate = ASSESSMENT_SAMPLE_RATE) {
  const pcm = samples instanceof Float32Array ? samples : new Float32Array(samples || []);
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, pcm.length * 2, true);
  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    const value = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return buffer;
}

async function startPcmCapture(stream) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || !window.AudioWorkletNode) return null;
  let context;
  try {
    context = new AudioCtx();
    await context.resume();
    await context.audioWorklet.addModule(new URL('./pcm-capture-worklet.js', import.meta.url));
    const source = context.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(context, 'pcm-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
    });
    const silent = context.createGain();
    silent.gain.value = 0;
    const inputSampleRate = context.sampleRate;
    const chunks = [];
    node.port.onmessage = event => {
      if (event.data instanceof ArrayBuffer) chunks.push(new Float32Array(event.data));
    };
    source.connect(node);
    node.connect(silent);
    silent.connect(context.destination);
    let closed = false;

    async function close() {
      if (closed) return null;
      closed = true;
      node.port.onmessage = null;
      try { source.disconnect(); } catch {}
      try { node.disconnect(); } catch {}
      try { silent.disconnect(); } catch {}
      try { await context.close(); } catch {}
      if (!chunks.length) return null;
      const merged = mergeFloat32(chunks);
      const pcm16k = downsamplePcm(merged, inputSampleRate, ASSESSMENT_SAMPLE_RATE);
      if (!pcm16k.length) return null;
      return new Blob([encodePcm16Wav(pcm16k)], { type: 'audio/wav' });
    }

    return { stop: close, cancel: close };
  } catch {
    try { await context?.close(); } catch {}
    return null;
  }
}

/**
 * 开始录音。返回 { stop()→Promise<{url, blob, assessmentBlob}>, cancel() }。
 * assessmentBlob 是 16kHz/mono/PCM16 WAV；生成失败时为 null，但回放仍可用。
 */
export async function startRecording({ onLimit } = {}) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err) {
    const name = err?.name;
    if (name === 'NotAllowedError') throw new Error('请在浏览器设置中允许麦克风');
    if (name === 'NotFoundError') throw new Error('未检测到麦克风');
    throw new Error(err?.message || '无法录音');
  }

  const mimeType = pickMimeType();
  const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks = [];
  const pcmCapture = await startPcmCapture(stream);
  let finishPromise = null;
  let released = false;
  let limitTimer = null;

  rec.ondataavailable = event => {
    if (event.data?.size) chunks.push(event.data);
  };
  rec.start();

  const release = () => {
    if (released) return;
    released = true;
    stream.getTracks().forEach(track => track.stop());
  };

  async function finalize() {
    clearTimeout(limitTimer);
    release();
    const assessmentBlob = await pcmCapture?.stop() || null;
    const blob = chunks.length
      ? new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' })
      : null;
    return {
      url: blob ? URL.createObjectURL(blob) : null,
      blob,
      assessmentBlob,
    };
  }

  function stop() {
    if (finishPromise) return finishPromise;
    finishPromise = new Promise(resolve => {
      if (rec.state === 'inactive') {
        finalize().then(resolve);
        return;
      }
      rec.onstop = () => finalize().then(resolve);
      try { rec.stop(); }
      catch { finalize().then(resolve); }
    });
    return finishPromise;
  }

  limitTimer = setTimeout(() => {
    if (onLimit) onLimit();
    else stop();
  }, MAX_RECORDING_MS);

  return {
    stream,
    stop,
    cancel() {
      clearTimeout(limitTimer);
      try { rec.stop(); } catch {}
      pcmCapture?.cancel();
      release();
    },
  };
}
