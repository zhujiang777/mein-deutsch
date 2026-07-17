// 共享 UI 组件：音频按钮、跟读麦克风、练习题渲染、toast
import { speak, recognitionAvailable, recognizeOnce, scoreSpeech } from './speech.js';

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

/* ---- 跟读麦克风：点击 → 识别 → 逐词比对结果渲染到 resultHost ---- */
export function micBtn(targetText, resultHost, opts = {}) {
  const b = el(`<button class="mic-btn" title="跟读检测">🎤</button>`);
  if (!recognitionAvailable()) {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      toast('当前浏览器不支持语音识别，请使用 Safari 或 Chrome');
    });
    return b;
  }
  let ctl = null;
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (b.classList.contains('listening')) { ctl?.stop(); return; }
    b.classList.add('listening');
    b.textContent = '⏹';
    resultHost.innerHTML = `<div class="speak-result"><span class="heard">请开始朗读…</span></div>`;
    let got = false;
    ctl = recognizeOnce({
      onResult: (alts) => {
        got = true;
        const r = scoreSpeech(targetText, alts);
        const words = r.displayWords.map((w, i) =>
          `<span class="${r.ok[i] ? 'w-ok' : 'w-miss'}">${esc(w)}</span>`).join(' ');
        const emoji = r.score >= 90 ? '🎉 非常好！' : r.score >= 70 ? '👍 不错，再练练标红的词' : '💪 再试一次，注意标红的词';
        resultHost.innerHTML = `<div class="speak-result">
          <div>${words}</div>
          <div class="heard">识别到：${esc(r.heard)}</div>
          <div class="score-line"><b>${r.score}%</b> ${emoji}</div>
        </div>`;
        opts.onScore?.(r.score);
      },
      onError: (err) => {
        got = true;
        const msg = err === 'not-allowed' ? '请在浏览器设置中允许使用麦克风'
          : err === 'no-speech' ? '没有听到声音，请再试一次'
          : `识别出错（${err}），请重试`;
        resultHost.innerHTML = `<div class="speak-result"><span class="heard">${esc(msg)}</span></div>`;
      },
      onEnd: () => {
        b.classList.remove('listening');
        b.textContent = '🎤';
        if (!got) resultHost.innerHTML = `<div class="speak-result"><span class="heard">没有听清，请靠近麦克风再试</span></div>`;
      },
    });
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
