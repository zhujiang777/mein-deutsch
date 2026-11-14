// 声音：按“角色 + 要念的字”找预先配好的录音（audio/story/<指纹>.mp3，指纹算法和 tools/voice-script.mjs 一致）。
// 慢速 = 同一条录音放慢。答对/答错的提示音现场合成，不用文件。
import { STORY_CAST, WORD_VOICE } from '../../data/story-lessons.js';

const BASE = new URL('../../audio/story/', import.meta.url);
export const SLOW = 0.72;
let manifest = null, player = null, token = 0;

/** 录音清单：{ 指纹: 时长秒 }。没有清单（还没配音）时返回空表。 */
export async function loadManifest() {
  if (manifest) return manifest;
  try { const r = await fetch(new URL('manifest.json', BASE), { cache: 'no-cache' }); manifest = r.ok ? await r.json() : {}; } catch { manifest = {}; }
  return manifest;
}
export const hasAudio = () => !!manifest && Object.keys(manifest).length > 0;

const ids = new Map();
export async function audioId(voice, text) {
  const k = `${voice}|${text}`;
  if (!ids.has(k)) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(k));
    ids.set(k, [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12));
  }
  return ids.get(k);
}
export const sayOf = line => line.say || line.de;
export const wordText = de => de.replace('…', '').trim();

/** 这条录音有多长（秒）。清单里没有就按字数估。 */
export async function duration(voice, text) {
  await loadManifest();
  return manifest[await audioId(voice, text)] || Math.max(1, text.length * 0.075);
}

/** 正在放的这条录音放到第几秒了（按录音本身的时间算，慢速不影响）。 */
export const position = () => player ? player.currentTime : 0;

export function stop() {
  token++;
  if (player) { player.pause(); player = null; }
  globalThis.speechSynthesis?.cancel();
}

/**
 * 播放一条。返回 Promise<boolean>：true = 播完了，false = 被打断或放不出来。
 * 没有录音文件时（开发阶段）退回浏览器自带的德语朗读，正式配音生成后不会走到这里。
 */
export async function play(voice, text, { slow = false } = {}) {
  stop();
  const mine = ++token;
  await loadManifest();
  const id = await audioId(voice, text);
  if (mine !== token) return false;
  if (!manifest[id]) { console.warn('缺录音', voice, text); return fallbackSpeak(text, slow, mine); }
  return new Promise(resolve => {
    const a = player = new Audio(new URL(`${id}.mp3`, BASE));
    a.playbackRate = slow ? SLOW : 1; a.preservesPitch = true;
    a.onended = () => resolve(mine === token);
    a.onerror = () => resolve(false);
    a.onpause = () => { if (!a.ended) resolve(false); };
    a.play().catch(() => resolve(false));
  });
}
function fallbackSpeak(text, slow, mine) {
  const synth = globalThis.speechSynthesis;
  if (!synth) return Promise.resolve(false);
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE'; u.rate = slow ? 0.6 : 0.9;
    u.onend = () => resolve(mine === token); u.onerror = () => resolve(false);
    synth.speak(u);
  });
}
export const playLine = (line, opts) => play(line.who, sayOf(line), opts);
export const playWord = (de, opts) => play(WORD_VOICE, wordText(de), opts);
export const voiceName = who => STORY_CAST[who]?.voice;

/** 放学习者自己的录音。 */
export function playUrl(url) {
  stop();
  const mine = ++token;
  return new Promise(resolve => {
    const a = player = new Audio(url);
    a.onended = () => resolve(mine === token); a.onerror = () => resolve(false);
    a.onpause = () => { if (!a.ended) resolve(false); };
    a.play().catch(() => resolve(false));
  });
}

// ---- 提示音 ----
let ctx = null;
function tone(freq, at, len, gain = 0.07, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len + 0.02);
}
export function sfx(kind) {
  try {
    ctx ||= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (kind === 'ok') { tone(660, 0, 0.14); tone(880, 0.09, 0.22); }
    else if (kind === 'no') { tone(220, 0, 0.2, 0.06, 'triangle'); }
    else if (kind === 'stamp') { tone(120, 0, 0.12, 0.12, 'triangle'); tone(90, 0.03, 0.16, 0.08); }
    else tone(520, 0, 0.05, 0.03);
  } catch { /* 没声音不影响学习 */ }
}
