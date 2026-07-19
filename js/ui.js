// 共享 UI 组件：音频按钮、跟读麦克风、练习题渲染、toast
import { speak, stopSpeak } from './speech.js';
import { recordingSupported, startRecording } from './recorder.js';
import {
  assessPronunciation,
  assessmentConfigured,
  assessmentErrorMessage,
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

export function toast(msg, ms = 2200) {
  document.querySelector('.toast')?.remove();
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

/* ---- 播放按钮（正常速 + 可选慢速） ---- */
export function audioBtn(text, { slow = false } = {}) {
  const b = el(`<button class="audio-btn${slow ? ' slow' : ''}" title="${slow ? '慢速朗读' : '朗读'}">${slow ? '慢' : '🔊'}</button>`);
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
export function speakPractice(host, targetText, { onScore } = {}) {
  const wrap = el(`<div class="speak-practice">
    <div class="sp-controls">
      <button class="sp-btn sp-listen">🔊 听标准</button>
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

  const recordBtn = el(`<button class="sp-btn sp-record">🎤 录我的</button>`);
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
      <div class="score-line"><b>${score} 分</b> ${pass ? '👍 已达到本次练习线' : '💪 再听标准音练一次'}</div>
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
    recogHost.innerHTML = `<div class="sp-judging">🧐 正在分析音素、流利度和完整度…</div>`;
    try {
      const result = await assessPronunciation({ audioBlob: assessmentBlob, referenceText: targetText });
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
  const b = el(`<button class="mic-btn" title="跟读练习">🎤</button>`);
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
      ${tip ? `<div class="p-tip">💡 ${esc(tip)}</div>` : ''}
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
      <span class="video-play">▶</span>
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
