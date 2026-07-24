// 共享 UI 组件：音频按钮、跟读麦克风、练习题渲染、toast
import { speak, stopSpeak } from './speech.js';
import { recordingSupported, startRecording } from './recorder.js';
import {
  assessPronunciation,
  assessmentConfigured,
  assessmentErrorMessage,
  preparePronunciationAssessment,
  SPEAK_PASS,
} from './pronunciation-assessment.js';

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
  route: '<path d="M6 3v18M18 3v18M6 7c4 0 8 2 12 2M6 15c4 0 8-2 12-2"/><circle cx="6" cy="7" r="2"/><circle cx="18" cy="13" r="2"/>',
  cards: '<rect x="4" y="5" width="13" height="16" rx="2"/><path d="m8 5 1-2h11v15l-3 1"/><path d="M8 10h5M8 14h5"/>',
  book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  flame: '<path d="M12 22c4.2 0 7-3 7-7.2 0-3.1-1.8-5.8-5.2-8.8.1 2.5-1.1 4-2.2 4.8.2-3.8-1.8-6.6-4.1-8.8.2 3.7-2.5 6.3-2.5 10.2C5 17.8 7.9 22 12 22Z"/><path d="M9.5 18.5c0-2 1.2-3.3 2.8-4.8.1 1.5.8 2.2 1.5 3 .5.5.7 1.1.7 1.8a2.5 2.5 0 0 1-5 0Z"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  play: '<path d="m9 7 8 5-8 5Z"/>',
  speaker: '<path d="M5 10v4h3l4 3V7l-4 3Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 12a6.5 6.5 0 0 0 13 0M12 18.5V22M9 22h6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ui-icon ${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;
}

export function guideBear() {
  return `<svg class="guide-bear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>
  </svg>`;
}

export function haptic(kind = 'tap') {
  if (!navigator.vibrate) return;
  navigator.vibrate(kind === 'error' ? [18, 35, 18] : kind === 'success' ? 16 : 8);
}

export function motionIn(node, { x = 0, y = 12, delay = 0, skipOnCoarse = false } = {}) {
  if (!node?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (skipOnCoarse && matchMedia('(max-width: 700px) and (pointer: coarse)').matches) return;
  node.animate([
    { opacity: 0, transform: `translate3d(${x}px, ${y}px, 0) scale(.985)` },
    { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
  ], { duration: 180, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
}

export function setProgress(node, value) {
  if (!node) return;
  const progress = Math.min(1, Math.max(0, Number(value) || 0));
  node.style.transform = `scaleX(${progress})`;
  const track = node.parentElement;
  if (track?.getAttribute('role') === 'progressbar') {
    track.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  }
}

export function rewardBurst(host, label = '+2 XP') {
  const burst = el(`<span class="reward-burst">${esc(label)}</span>`);
  host.appendChild(burst);
  haptic('success');
  setTimeout(() => burst.remove(), 900);
}

export function toast(msg, ms = 2200) {
  document.querySelector('.toast')?.remove();
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/* ---- 播放按钮（正常速 + 可选慢速） ---- */
export function audioBtn(text, { slow = false } = {}) {
  const b = el(`<button class="audio-btn${slow ? ' slow' : ''}" aria-label="${slow ? '慢速朗读' : '朗读'}" title="${slow ? '慢速朗读' : '朗读'}">${slow ? '0.8×' : icon('speaker')}</button>`);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.audio-btn.playing').forEach(x => x.classList.remove('playing'));
    b.classList.add('playing');
    speak(text, { slow, onend: () => b.classList.remove('playing') });
    setTimeout(() => b.classList.remove('playing'), 8000);
  });
  return b;
}

/* ---- 跟读练习组件：一次录音同时生成回放和 16k WAV；
   停止后立即给出录音对比，并异步请求真正的德语发音评测。 */
export function speakPractice(host, targetText, { onScore, onRecorded } = {}) {
  const wrap = el(`<div class="speak-practice">
    <div class="sp-controls">
      <button class="sp-btn sp-listen">${icon('speaker')} 听标准</button>
    </div>
    <div class="sp-status"></div>
    <div class="sp-recog"></div>
    <div class="sp-compare"></div>
  </div>`);
  const controls = wrap.querySelector('.sp-controls');
  const status = wrap.querySelector('.sp-status');
  const compare = wrap.querySelector('.sp-compare');
  const recogHost = wrap.querySelector('.sp-recog');

  controls.querySelector('.sp-listen').addEventListener('click', (e) => {
    e.stopPropagation(); stopSpeak(); speak(targetText);
  });

  // 云端评测以录音为输入；没有录音能力时只保留标准音。
  if (!recordingSupported()) {
    status.textContent = '本设备不支持录音，可听标准音后自己朗读';
    host.appendChild(wrap);
    return wrap;
  }

  const recordBtn = el(`<button class="sp-btn sp-record">${icon('mic')} 录我的</button>`);
  controls.appendChild(recordBtn);

  let recorderCtl = null;
  let phase = 'idle'; // idle | recording | stopping | judging | judged
  let myUrl = null;
  let assessmentBlob = null;
  let assessmentRun = 0;

  const errorLabels = {
    Mispronunciation: '发音需改进',
    Omission: '漏读',
    Insertion: '多读',
    UnexpectedBreak: '停顿异常',
    MissingBreak: '缺少停顿',
  };

  function scoreMetric(label, value, main = false) {
    const shown = value == null ? '—' : value;
    return `<div class="pa-metric${main ? ' main' : ''}"><b>${shown}</b><span>${label}</span></div>`;
  }

  function renderAssessment(result) {
    phase = 'judged';
    const score = result.overall.pronunciation;
    const pass = score >= SPEAK_PASS;
    const words = result.words.map(item => {
      const missed = item.errorType !== 'None' || (item.accuracy != null && item.accuracy < 60);
      const label = errorLabels[item.errorType] || (missed ? '发音需改进' : '准确');
      const phones = item.phonemes.length
        ? `<div class="pa-phonemes">${item.phonemes.map(phone =>
            `<span>${esc(phone.phoneme)} ${phone.accuracy ?? '—'}</span>`).join('')}</div>`
        : '';
      return `<div class="pa-word ${missed ? 'miss' : 'ok'}">
        <b>${esc(item.word)}</b><span>${item.accuracy ?? '—'} · ${esc(label)}</span>${phones}
      </div>`;
    }).join('');
    const heard = result.recognizedText
      ? `<div class="pa-heard">识别到：${esc(result.recognizedText)}</div>` : '';
    recogHost.innerHTML = `<div class="speak-result ${pass ? 'pass' : 'fail'}">
      <div class="pa-summary">
        ${scoreMetric('综合发音', score, true)}
        ${scoreMetric('音素准确', result.overall.accuracy)}
        ${scoreMetric('流利度', result.overall.fluency)}
        ${scoreMetric('完整度', result.overall.completeness)}
      </div>
      ${heard}
      ${words ? `<div class="pa-words">${words}</div>` : ''}
      <div class="score-line"><b>${score} 分</b> ${pass ? '已达到本次练习线' : '再听标准音练一次'}</div>
      <div class="pa-note">评分用于练习参考；德语暂不提供英语专属的韵律分。</div>
    </div>`;
    onScore?.(score);
  }

  function renderAssessmentError(err) {
    phase = 'judged';
    const canRetry = assessmentBlob && err?.code !== 'not-configured' && err?.code !== 'unauthorized';
    recogHost.innerHTML = `<div class="sp-recog-msg">
      ${esc(assessmentErrorMessage(err))}，录音对比仍可使用。
      <div class="pa-error-actions">
        ${canRetry ? '<button class="sp-btn sp-retry">重新评分这段录音</button>' : ''}
        ${err?.code === 'not-configured' || err?.code === 'unauthorized'
          ? '<a class="sp-btn" href="#/settings">去设置发音评分</a>' : ''}
      </div>
    </div>`;
    recogHost.querySelector('.sp-retry')?.addEventListener('click', requestAssessment);
  }

  async function requestAssessment(e) {
    e?.stopPropagation?.();
    if (!assessmentBlob) {
      renderAssessmentError({ code: 'audio-unavailable', message: '本设备未能生成评分音频' });
      return;
    }
    if (!assessmentConfigured()) {
      renderAssessmentError({ code: 'not-configured', message: '请先到设置中配置发音评分' });
      return;
    }
    const run = ++assessmentRun;
    phase = 'judging';
    const stageText = {
      rest: '正在提交评分…',
      slow: '服务器响应较慢，正在准备备用评分…',
      fallback: '服务器响应较慢，正在切换备用评分…',
      sdk: '正在使用备用评分通道…',
    };
    recogHost.innerHTML = `<div class="sp-judging">${stageText.rest}</div>`;
    try {
      const result = await assessPronunciation({
        audioBlob: assessmentBlob,
        referenceText: targetText,
        onStage: stage => {
          if (run !== assessmentRun) return;
          const judging = recogHost.querySelector('.sp-judging');
          if (judging) judging.textContent = stageText[stage] || stageText.rest;
        },
      });
      if (run === assessmentRun) renderAssessment(result);
    } catch (err) {
      if (run === assessmentRun) renderAssessmentError(err);
    }
  }

  function renderCompare(url) {
    compare.innerHTML = '';
    const std = el(`<button class="sp-cmp"><span class="sp-cmp-icon">▶</span><span>标准</span></button>`);
    std.addEventListener('click', (e) => { e.stopPropagation(); stopSpeak(); speak(targetText); });
    compare.appendChild(std);
    if (url) {
      const audio = new Audio(url);
      const mine = el(`<button class="sp-cmp mine"><span class="sp-cmp-icon">▶</span><span>我的录音</span></button>`);
      mine.addEventListener('click', (e) => {
        e.stopPropagation(); stopSpeak(); audio.currentTime = 0; audio.play().catch(() => {});
      });
      compare.appendChild(mine);
    }
  }

  async function startRec() {
    status.textContent = '';
    compare.innerHTML = '';
    recogHost.innerHTML = '';
    assessmentRun++;
    if (myUrl) { URL.revokeObjectURL(myUrl); myUrl = null; }
    assessmentBlob = null;
    // 若本标签页已确认 Azure REST 漏分，利用用户朗读时间预热 SDK 和短期令牌。
    preparePronunciationAssessment().catch(() => {});
    phase = 'recording';
    recordBtn.disabled = true; // 等待 stream 就绪，防重复点击
    try {
      recorderCtl = await startRecording({ onLimit: () => stopRec() });
    } catch (err) {
      recordBtn.disabled = false;
      phase = 'idle';
      status.textContent = err.message || '无法录音';
      return;
    }
    recordBtn.disabled = false;
    recordBtn.classList.add('recording');
    recordBtn.textContent = '⏹ 停止';
    status.textContent = '录音中…请朗读（最长 20 秒）';
  }

  async function stopRec() {
    if (phase !== 'recording') return;
    phase = 'stopping';
    recordBtn.disabled = true;
    recordBtn.classList.remove('recording');
    recordBtn.textContent = '处理中…';
    status.textContent = '正在准备录音…';
    const res = recorderCtl ? await recorderCtl.stop() : null;
    recorderCtl = null;
    recordBtn.disabled = false;
    recordBtn.textContent = '🔁 重录';
    status.textContent = '';
    if (res?.url) { myUrl = res.url; renderCompare(res.url); }
    assessmentBlob = res?.assessmentBlob || null;
    onRecorded?.({ url: res?.url || null, assessmentAvailable: !!assessmentBlob });
    requestAssessment();
  }

  recordBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (recordBtn.classList.contains('recording')) stopRec();
    else startRec();
  });

  host.appendChild(wrap);
  return wrap;
}

/* ---- 兼容包装：micBtn 返回 🎤 按钮，点击后在 resultHost 里展开跟读练习组件 ----
   历史调用点（reading.js / grammar.js / phraseRow）沿用不动 */
export function micBtn(targetText, resultHost, opts = {}) {
  const b = el(`<button class="mic-btn" aria-label="跟读练习" title="跟读练习">${icon('mic')}</button>`);
  let shown = false;
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (shown) return;
    shown = true;
    b.classList.add('active');
    resultHost.innerHTML = '';
    speakPractice(resultHost, targetText, opts);
  });
  return b;
}

/* ---- 例句/短语行：德语 + 中文 + 播放/慢速/跟读 ---- */
export function phraseRow({ de, ipa, zh, tip, mic = true, slowBtn = true }) {
  const row = el(`<div class="phrase-row">
    <div class="p-main">
      <div class="p-de de">${esc(de)}</div>
      ${ipa ? `<div class="p-ipa">${esc(ipa)}</div>` : ''}
      ${zh ? `<div class="p-zh">${esc(zh)}</div>` : ''}
      ${tip ? `<div class="p-tip"><b>提示</b> · ${esc(tip)}</div>` : ''}
      <div class="p-result"></div>
    </div>
    <div class="p-btns"></div>
  </div>`);
  const btns = row.querySelector('.p-btns');
  const result = row.querySelector('.p-result');
  btns.appendChild(audioBtn(de));
  if (slowBtn) btns.appendChild(audioBtn(de, { slow: true }));
  if (mic) btns.appendChild(micBtn(de, result));
  return row;
}

/* ---- YouTube 视频组件：懒加载 facade + IFrame API 进度追踪 ----
   videoId 记录观看状态；播放 ≥80% 自动记已看，手动"我看完了"兜底 */
import { getVideoState, setVideoState } from './storage.js';

let ytApiPromise = null;
function loadYtApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
      setTimeout(resolve, 6000); // API 加载失败也不阻塞
    });
  }
  return ytApiPromise;
}

export function videoCard(video, { onWatched } = {}) {
  // video: { yt, title, note?, duration? }
  const state = getVideoState(video.yt);
  const card = el(`<div class="video-card">
    <div class="video-facade" role="button" tabindex="0" aria-label="播放视频">
      <img loading="lazy" src="https://i.ytimg.com/vi/${esc(video.yt)}/hqdefault.jpg" alt="">
      <span class="video-play">${icon('play')}</span>
    </div>
    <div class="video-meta">
      <div class="video-title">${esc(video.title)}${state.done ? ' <span class="pill green">已看完 ✓</span>' : ''}</div>
      ${video.note ? `<div class="meta">${esc(video.note)}</div>` : ''}
      <button class="btn small secondary video-done-btn" style="margin-top:6px">${state.done ? '重新标记' : '我看完了（手动确认）'}</button>
    </div>
  </div>`);

  const facade = card.querySelector('.video-facade');
  const markWatched = () => {
    setVideoState(video.yt, { done: true, pct: 100 });
    card.querySelector('.video-title').innerHTML = `${esc(video.title)} <span class="pill green">已看完 ✓</span>`;
    onWatched?.();
  };
  card.querySelector('.video-done-btn').addEventListener('click', markWatched);

  facade.addEventListener('click', async () => {
    const holder = el(`<div class="video-embed"><div id="yt-${video.yt}-${Date.now()}"></div></div>`);
    facade.replaceWith(holder);
    await loadYtApi();
    if (window.YT?.Player) {
      const p = new YT.Player(holder.firstElementChild.id, {
        videoId: video.yt,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => p.playVideo(),
          onStateChange: () => {
            // 轮询累计进度
            if (!p._tracker) {
              p._tracker = setInterval(() => {
                try {
                  const dur = p.getDuration();
                  const cur = p.getCurrentTime();
                  if (dur > 0) {
                    const pct = Math.round(100 * cur / dur);
                    const prev = getVideoState(video.yt).pct || 0;
                    if (pct > prev) setVideoState(video.yt, { pct });
                    if (pct >= 80 && !getVideoState(video.yt).done) markWatched();
                  }
                } catch {}
              }, 5000);
            }
          },
        },
      });
    } else {
      // API 加载失败：普通 iframe 兜底（手动确认按钮仍可用）
      holder.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/${esc(video.yt)}?rel=0&autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
  });
  return card;
}

/* ---- 练习题渲染，全部答对/答完后回调 onFinish(correct, total) ---- */
export function renderQuiz(exercises, host, onFinish) {
  let answered = 0, correct = 0;
  const check = () => {
    if (answered === exercises.length) onFinish?.(correct, exercises.length);
  };
  exercises.forEach((ex, idx) => {
    const item = el(`<div class="quiz-item">
      <div class="quiz-q">${idx + 1}. ${esc(ex.q)}</div>
      <div class="quiz-body"></div>
      <div class="quiz-explain">${esc(ex.explain || '')}</div>
    </div>`);
    const body = item.querySelector('.quiz-body');
    const explain = item.querySelector('.quiz-explain');

    if (ex.type === 'choice') {
      const opts = el(`<div class="quiz-opts"></div>`);
      ex.options.forEach((opt, oi) => {
        const btn = el(`<button class="quiz-opt">${esc(opt)}</button>`);
        btn.addEventListener('click', () => {
          if (item.dataset.done) return;
          item.dataset.done = '1';
          answered++;
          if (oi === ex.a) { correct++; btn.classList.add('correct'); }
          else {
            btn.classList.add('wrong');
            opts.children[ex.a].classList.add('correct');
          }
          [...opts.children].forEach(b => b.disabled = true);
          if (ex.explain) explain.classList.add('show');
          check();
        });
        opts.appendChild(btn);
      });
      body.appendChild(opts);
    } else if (ex.type === 'fill') {
      const wrap = el(`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input class="quiz-fill-input" type="text" autocapitalize="off" autocomplete="off" placeholder="输入答案">
        <button class="btn small secondary">检查</button>
      </div>`);
      const input = wrap.querySelector('input');
      const btn = wrap.querySelector('button');
      const submit = () => {
        if (item.dataset.done) return;
        const val = input.value.trim().toLowerCase();
        if (!val) return;
        item.dataset.done = '1';
        answered++;
        const ok = ex.a.some(ans => ans.toLowerCase() === val);
        input.classList.add(ok ? 'correct' : 'wrong');
        input.disabled = true;
        btn.disabled = true;
        if (ok) correct++;
        else {
          explain.textContent = `正确答案：${ex.a[0]}${ex.explain ? '。' + ex.explain : ''}`;
        }
        explain.classList.add('show');
        check();
      };
      btn.addEventListener('click', submit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      body.appendChild(wrap);
    }
    host.appendChild(item);
  });
}
