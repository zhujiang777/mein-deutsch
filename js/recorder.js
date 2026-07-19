// 录音封装：MediaRecorder + getUserMedia
// 跟读的可靠底座是录音对比：SpeechRecognition 依赖浏览器背后的语音服务
// （Chrome→Google，iPad 各浏览器均 WebKit 内核多不支持），随时可能因网络/权限/抢麦克风失败——
// 录音回放不依赖任何在线服务，识别失败时无感兜底。

export function recordingSupported() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

// iOS Safari 只认 mp4，其余浏览器用 webm 兜底；都不支持则不传 mimeType 交给浏览器决定
function pickMimeType() {
  if (!window.MediaRecorder?.isTypeSupported) return '';
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
}

/**
 * 开始录音。返回 { stop()→Promise<{url, blob}>, cancel() }。
 * 出错时抛出带可读中文 message 的 Error。
 * 注意：生成的 object URL 由调用方负责 revokeObjectURL。
 */
export async function startRecording() {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    const name = err?.name;
    if (name === 'NotAllowedError') throw new Error('请在浏览器设置中允许麦克风');
    if (name === 'NotFoundError') throw new Error('未检测到麦克风');
    throw new Error(err?.message || '无法录音');
  }

  const mimeType = pickMimeType();
  const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.start();

  // 用完必须释放麦克风，否则浏览器一直显示"录音中"占用指示
  const release = () => stream.getTracks().forEach(t => t.stop());

  return {
    stream, // 暴露给调用方克隆音频轨喂识别器（避免识别与录音抢麦克风）
    stop() {
      return new Promise((resolve) => {
        rec.onstop = () => {
          release();
          const blob = new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' });
          resolve({ url: URL.createObjectURL(blob), blob });
        };
        try { rec.stop(); }
        catch { release(); resolve({ url: null, blob: null }); }
      });
    },
    cancel() {
      try { rec.stop(); } catch {}
      release();
    },
  };
}
