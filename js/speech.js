// 语音播放：预生成音频优先（真人级德语 MP3），设备 TTS 仅作德语语音回退。
// 跟读评分已移至 pronunciation-assessment.js，不再依赖浏览器 SpeechRecognition。
import { getSettings } from './storage.js';
import { AUDIO_MANIFEST } from '../data/audio-manifest.js';

/* ================= 播放：预生成音频 ================= */
let player = null; // 共享播放器，保证同时只放一个

function playFile(file, { slow = false, onend } = {}) {
  stopSpeak();
  player = new Audio(`audio/${file}`);
  // 慢速：降速不变调（现代浏览器 preservesPitch 默认开启，这里显式声明）
  player.preservesPitch = true;
  player.webkitPreservesPitch = true;
  player.playbackRate = slow ? 0.65 : 1;
  if (onend) player.onended = onend;
  player.play().catch(() => onend?.());
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
  u.rate = slow ? 0.6 : 1;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}

function notifyNoGerman() {
  import('./ui.js').then(({ toast }) => {
    toast('本机未安装德语语音（iOS：设置→辅助功能→朗读内容→声音→德语）', 3500);
  });
}

/* ================= 统一入口 ================= */
export function speak(text, opts = {}) {
  const key = (text || '').trim();
  const file = AUDIO_MANIFEST[key];
  if (file) return playFile(file, opts);
  return speakTTS(key, opts); // 内容库外的动态文本才走 TTS
}

export function stopSpeak() {
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
