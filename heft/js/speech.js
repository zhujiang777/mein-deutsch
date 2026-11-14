// 开口题：按住录音 → 机器评分（项目原有的 Azure 德语发音评分）→ 红笔标出没读准的词 + 总分。
// 评分服务连不上或没配置时不卡课：退回「听原声 / 听我的」自己对比。
import { recordingSupported, startRecording } from '../../js/recorder.js';
import { assessPronunciation, assessmentConfigured, SPEAK_PASS } from '../../js/pronunciation-assessment.js';
import { closest, sameText } from './flow.js';

export { SPEAK_PASS, assessmentConfigured };
export const canRecord = () => recordingSupported();
export const WORD_PASS = 60; // 单个词低于这个准确度就用红笔划出来

/** 开始录音。返回 { stop(): Promise<{ url, blob, assessmentBlob }>, cancel() }。 */
export const record = opts => startRecording(opts);

/**
 * 给一次录音评分。answers 是可接受的几种说法（第一句是示范）。
 * 返回 { ok: true, score, pass, target, words: [{ word, bad }] }，
 * 或 { ok: false, reason }（没配置 / 连不上 / 设备不支持）——调用方退回自己对比。
 */
export async function score(rec, answers) {
  if (!assessmentConfigured()) return { ok: false, reason: 'not-configured' };
  if (!rec?.assessmentBlob) return { ok: false, reason: 'audio-unavailable' };
  try {
    let target = answers[0];
    const ask = text => assessPronunciation({ audioBlob: rec.assessmentBlob, referenceText: text.replace(/\s–\s/g, ' ') }); // 拼字母的“L – I – N”按三个字母评
    let r = await ask(target);
    // 说的是另一种可接受的说法：按那一句再评一次，免得被当成“漏词”
    const alt = closest(answers, r.recognizedText);
    if (alt !== target && sameText(alt, r.recognizedText)) { target = alt; r = await ask(target); }
    const total = r.overall.pronunciation;
    return {
      ok: true, score: total, pass: total >= SPEAK_PASS, target, heard: r.recognizedText,
      words: r.words.map(w => ({ word: w.word, bad: w.errorType !== 'None' || (w.accuracy ?? 100) < WORD_PASS })),
    };
  } catch (err) {
    return { ok: false, reason: err?.code || 'failed', message: err?.message || '' };
  }
}

/** 评分没成功时，用一句人话说出卡在哪（2026-11-14：原来一律写“评分暂时连不上”，查不出原因）。 */
export function whyFailed(r) {
  const m = r.message || '';
  if (r.reason === 'not-configured') return '还没设置发音评分';
  if (r.reason === 'unauthorized') return '访问码不对，到「我的」里重填';
  if (r.reason === 'provider-error' && /HTTP 40[13]/.test(m)) return '评分服务里的 Azure 密钥失效了，要换新的';
  if (r.reason === 'quota') return '这个月的评分额度用完了';
  if (r.reason === 'no-speech') return '没听到声音，靠近话筒再说一次';
  if (r.reason === 'network' || r.reason === 'timeout') return '网络连不上评分服务';
  if (r.reason === 'audio-unavailable') return '这台设备录不出评分用的声音';
  return m || '评分暂时连不上';
}
