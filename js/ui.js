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
export function micBtn(targetText, resultHost) {
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
