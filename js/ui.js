// 共享 UI 组件：音频按钮、跟读麦克风、练习题渲染、toast
import { speak, stopSpeak, recognitionAvailable, recognizeOnce, scoreSpeech } from './speech.js';
import { recordingSupported, startRecording } from './recorder.js';

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

/* ---- 跟读练习组件：🔊听标准 → 🎤录自己 → 并排对比（▶标准 | ▶我的）----
   录音对比为核心（随处可用）；SpeechRecognition 可用时额外附加逐词识别对照。
   录音和识别共用一次说话：录音期间同时启动识别，停止后一起展示。 */
export function speakPractice(host, targetText, { onScore } = {}) {
  const wrap = el(`<div class="speak-practice">
    <div class="sp-controls">
      <button class="sp-btn sp-listen">🔊 听标准</button>
    </div>
    <div class="sp-status"></div>
    <div class="sp-compare"></div>
    <div class="sp-recog"></div>
  </div>`);
  const controls = wrap.querySelector('.sp-controls');
  const status = wrap.querySelector('.sp-status');
  const compare = wrap.querySelector('.sp-compare');
  const recogHost = wrap.querySelector('.sp-recog');

  controls.querySelector('.sp-listen').addEventListener('click', (e) => {
    e.stopPropagation(); stopSpeak(); speak(targetText);
  });

  // 无录音能力：识别可用则退回纯识别，否则只保留"听标准"
  if (!recordingSupported()) {
    if (recognitionAvailable()) {
      const recBtn = el(`<button class="sp-btn sp-record">🎤 跟读（识别）</button>`);
      controls.appendChild(recBtn);
      wireRecognitionOnly(recBtn, targetText, recogHost, status, onScore);
    } else {
      status.textContent = '本设备不支持录音，可听标准音后自己朗读';
    }
    host.appendChild(wrap);
    return wrap;
  }

  const recordBtn = el(`<button class="sp-btn sp-record">🎤 录我的</button>`);
  controls.appendChild(recordBtn);

  let recorderCtl = null;   // 录音控制器
  let recogCtl = null;      // 识别控制器
  let recogResult = null;   // 识别结果（或 {error}）
  let stopped = false;
  let recogRendered = false;
  let myUrl = null;

  function renderRecog() {
    if (recogRendered || !stopped) return;
    if (!recognitionAvailable()) return;
    if (recogResult == null) return; // 还没回来
    recogRendered = true;
    const r = recogResult;
    if (r.error) {
      const msg = r.error === 'network'
          ? '语音识别服务无法连接（需要 Google 网络），已用录音对比模式'
        : r.error === 'not-allowed'
          ? '麦克风权限被拒，识别不可用（录音对比仍可用）'
        : r.error === 'no-speech'
          ? '' // 没听到，不打扰
          : `识别不可用（${r.error}），已用录音对比模式`;
      recogHost.innerHTML = msg ? `<div class="sp-recog-msg">${esc(msg)}</div>` : '';
      return;
    }
    const words = r.displayWords.map((w, i) =>
      `<span class="${r.ok[i] ? 'w-ok' : 'w-miss'}">${esc(w)}</span>`).join(' ');
    const emoji = r.score >= 90 ? '🎉' : r.score >= 70 ? '👍' : '💪';
    recogHost.innerHTML = `<div class="speak-result">
      <div>${words}</div>
      <div class="score-line"><b>${r.score}%</b> ${emoji} 逐词对照</div>
    </div>`;
    onScore?.(r.score);
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
    if (myUrl) { URL.revokeObjectURL(myUrl); myUrl = null; }
    stopped = false; recogRendered = false; recogResult = null;
    recordBtn.disabled = true; // 等待 stream 就绪，防重复点击
    try {
      recorderCtl = await startRecording();
    } catch (err) {
      recordBtn.disabled = false;
      status.textContent = err.message || '无法录音';
      return;
    }
    // 同时尝试识别（共用同一次说话）；部分浏览器会抢麦克风冲突，捕获后降级为纯录音
    if (recognitionAvailable()) {
      try {
        recogCtl = recognizeOnce({
          onResult: (alts) => { recogResult = scoreSpeech(targetText, alts); renderRecog(); },
          onError: (errCode) => { recogResult = { error: errCode }; renderRecog(); },
          onEnd: () => {},
        });
      } catch { recogCtl = null; }
    }
    recordBtn.disabled = false;
    recordBtn.classList.add('recording');
    recordBtn.textContent = '⏹ 停止';
    status.textContent = '录音中…请朗读';
  }

  async function stopRec() {
    recordBtn.classList.remove('recording');
    recordBtn.textContent = '🔁 重录';
    status.textContent = '';
    if (recogCtl) { try { recogCtl.stop(); } catch {} recogCtl = null; }
    const res = recorderCtl ? await recorderCtl.stop() : null;
    recorderCtl = null;
    if (res?.url) { myUrl = res.url; renderCompare(res.url); }
    stopped = true;
    renderRecog();
  }

  recordBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (recordBtn.classList.contains('recording')) stopRec();
    else startRec();
  });

  host.appendChild(wrap);
  return wrap;
}

// 纯识别模式（无录音能力时的退路）：点击 → 识别 → 逐词比对
function wireRecognitionOnly(btn, targetText, recogHost, status, onScore) {
  let ctl = null;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (btn.classList.contains('recording')) { ctl?.stop(); return; }
    btn.classList.add('recording');
    btn.textContent = '⏹ 停止';
    status.textContent = '识别中…请朗读';
    let got = false;
    ctl = recognizeOnce({
      onResult: (alts) => {
        got = true;
        const r = scoreSpeech(targetText, alts);
        const words = r.displayWords.map((w, i) =>
          `<span class="${r.ok[i] ? 'w-ok' : 'w-miss'}">${esc(w)}</span>`).join(' ');
        const emoji = r.score >= 90 ? '🎉' : r.score >= 70 ? '👍' : '💪';
        recogHost.innerHTML = `<div class="speak-result"><div>${words}</div>
          <div class="score-line"><b>${r.score}%</b> ${emoji}</div></div>`;
        onScore?.(r.score);
      },
      onError: (err) => {
        got = true;
        const msg = err === 'network' ? '语音识别服务无法连接（需要 Google 网络）'
          : err === 'not-allowed' ? '请在浏览器设置中允许使用麦克风'
          : err === 'no-speech' ? '没有听到声音，请再试一次'
          : `识别出错（${err}）`;
        recogHost.innerHTML = `<div class="sp-recog-msg">${esc(msg)}</div>`;
      },
      onEnd: () => {
        btn.classList.remove('recording');
        btn.textContent = '🎤 跟读（识别）';
        status.textContent = '';
        if (!got) recogHost.innerHTML = `<div class="sp-recog-msg">没有听清，请靠近麦克风再试</div>`;
      },
    });
  });
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
