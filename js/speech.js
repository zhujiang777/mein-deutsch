// 语音：TTS 朗读（speechSynthesis）+ 跟读识别（SpeechRecognition）
import { getSettings } from './storage.js';

/* ================= TTS ================= */
let voices = [];
function refreshVoices() {
  voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  refreshVoices();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

export function germanVoices() {
  refreshVoices();
  return voices.filter(v => v.lang.toLowerCase().startsWith('de'));
}

function pickVoice() {
  const list = germanVoices();
  if (!list.length) return null;
  const pref = getSettings().voiceURI;
  if (pref) {
    const hit = list.find(v => v.voiceURI === pref);
    if (hit) return hit;
  }
  // 优先本地高质量语音（iOS 上通常是 Anna）
  return list.find(v => v.localService && v.lang === 'de-DE')
    || list.find(v => v.lang === 'de-DE')
    || list[0];
}

export function ttsAvailable() {
  return 'speechSynthesis' in window;
}

export function speak(text, { slow = false, onend } = {}) {
  if (!ttsAvailable()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  const v = pickVoice();
  if (v) u.voice = v;
  const base = getSettings().rate || 1;
  u.rate = slow ? base * 0.6 : base;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (ttsAvailable()) speechSynthesis.cancel();
}

/* ================= 语音识别（跟读检测） ================= */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export function recognitionAvailable() {
  return !!SR;
}

// 识别一次，返回 {stop} 控制器；结果通过回调给出
export function recognizeOnce({ onResult, onError, onEnd }) {
  const rec = new SR();
  rec.lang = 'de-DE';
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.continuous = false;
  let ended = false;
  rec.onresult = (e) => {
    const alts = [];
    for (const alt of e.results[0]) alts.push(alt.transcript);
    onResult?.(alts);
  };
  rec.onerror = (e) => onError?.(e.error);
  rec.onend = () => { if (!ended) { ended = true; onEnd?.(); } };
  rec.start();
  return { stop: () => { try { rec.stop(); } catch {} } };
}

/* ================= 跟读比对 ================= */
function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:"„“”'’()\-–—]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// 最长公共子序列对齐：标记目标句中每个词是否被读出
function lcsMatch(target, spoken) {
  const n = target.length, m = spoken.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = target[i - 1] === spoken[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const ok = new Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (target[i - 1] === spoken[j - 1]) { ok[i - 1] = true; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return ok;
}

// 在多个候选识别结果里取匹配得分最高的
export function scoreSpeech(targetText, alternatives) {
  const target = normalizeWords(targetText);
  let best = { score: 0, ok: new Array(target.length).fill(false), heard: alternatives[0] || '' };
  for (const alt of alternatives) {
    const spoken = normalizeWords(alt);
    const ok = lcsMatch(target, spoken);
    const matched = ok.filter(Boolean).length;
    const score = target.length ? Math.round(100 * matched / target.length) : 0;
    if (score >= best.score) best = { score, ok, heard: alt };
  }
  // 返回目标句原始分词（保留大小写标点用于显示）
  const displayWords = targetText.split(/\s+/).filter(Boolean);
  return { ...best, displayWords };
}
