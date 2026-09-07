// 语音播放：预生成音频优先（真人级德语 MP3），设备 TTS 仅作德语语音回退。
// 跟读评分已移至 pronunciation-assessment.js，不再依赖浏览器 SpeechRecognition。
import { getSettings } from './storage.js?v=4';
import { SLOW_RATE, RATE_STEPS } from './audio-timing.js';

// 速率档位定义在 audio-timing.js（纯模块，可单测），这里转出去方便调用方就近取用。
export { SLOW_RATE, RATE_STEPS };

/* ================= 播放：预生成音频 ================= */
let player = null; // 共享播放器，保证同时只放一个
let audioManifest = null;
let audioManifestPromise = null;
let speakRequest = 0;

function loadAudioManifest() {
  if (audioManifest) return Promise.resolve(audioManifest);
  if (!audioManifestPromise) {
    audioManifestPromise = import('../data/audio-manifest.js?v=2')
      .then(module => (audioManifest = module.AUDIO_MANIFEST))
      .catch(error => {
        audioManifestPromise = null;
        throw error;
      });
  }
  return audioManifestPromise;
}

export function preloadSpeechAssets() {
  return loadAudioManifest().then(() => true).catch(() => false);
}

function playFile(file, { slow = false, onend } = {}) {
  const node = acquirePlayer(file);
  node.playbackRate = slow ? SLOW_RATE : 1;
  let settled = false;
  const finish = failed => {
    if (settled) return;
    settled = true;
    if (failed) import('./ui.js?v=2').then(({ toast }) => toast('音频暂不可用，可以查看文字继续。'));
    onend?.();
  };
  node.onended = () => finish(false);
  node.onerror = () => finish(true);
  node.play().catch(() => finish(true));
}

/**
 * 交出共享播放器给调用方自行控制（精听的句级定位 / AB 复读用）。
 * 走这里而不是自己 new Audio()，是为了让路由切换与课程换步里已有的 stopSpeak()
 * 自动掐掉长音频，调用点无需新增清理逻辑。
 * 注意：stopSpeak() 会清掉 .onended，调用方一律用 addEventListener('ended')。
 */
export function acquirePlayer(file) {
  stopSpeak();
  player = new Audio(`audio/${file}`);
  // 慢速：降速不变调（现代浏览器 preservesPitch 默认开启，这里显式声明）
  player.preservesPitch = true;
  player.webkitPreservesPitch = true;
  return player;
}

/** 查 manifest 里这段德语文本对应的音频文件名；未收录返回 null。 */
export function resolveFile(text) {
  const key = (text || '').trim();
  return loadAudioManifest().then(manifest => manifest[key] || null).catch(() => null);
}

/* ================= 回退：设备 TTS（仅限德语语音） ================= */
let voices = [];
function refreshVoices() {
  if ('speechSynthesis' in window) voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

export function germanVoices() {
  refreshVoices();
  return voices.filter(v => v.lang.toLowerCase().startsWith('de'));
}

function pickGermanVoice() {
  const list = germanVoices();
  if (!list.length) return null;
  const pref = getSettings().voiceURI;
  if (pref) {
    const hit = list.find(v => v.voiceURI === pref);
    if (hit) return hit;
  }
  return list.find(v => v.localService && v.lang === 'de-DE')
    || list.find(v => v.lang === 'de-DE')
    || list[0];
}

function speakTTS(text, { slow = false, onend } = {}) {
  if (!('speechSynthesis' in window)) return notifyNoGerman();
  const v = pickGermanVoice();
  // 关键原则：宁可不发音，也不用非德语语音硬读
  if (!v) return notifyNoGerman();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.voice = v;
  u.rate = slow ? SLOW_RATE : 1; // 与 MP3 路径同档，保证按钮标签在两条路径下都诚实
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}

function notifyNoGerman() {
  import('./ui.js?v=2').then(({ toast }) => {
    toast('本机未安装德语语音（iOS：设置→辅助功能→朗读内容→声音→德语）', 3500);
  });
}

/* ================= 统一入口 ================= */
export function speak(text, opts = {}) {
  const key = (text || '').trim();
  const request = ++speakRequest;
  return loadAudioManifest().then(manifest => {
    if (request !== speakRequest) return;
    const file = manifest[key];
    if (file) return playFile(file, opts);
    return speakTTS(key, opts); // 内容库外的动态文本才走 TTS
  }).catch(() => {
    if (request === speakRequest) speakTTS(key, opts);
  });
}

export function stopSpeak() {
  speakRequest++;
  if (player) {
    player.onended = null;
    player.pause();
    player = null;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function ttsAvailable() {
  return 'speechSynthesis' in window;
}
