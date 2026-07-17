// 题型组件库：统一接口 renderExercise(host, item, { onSubmit })
// onSubmit(correct: boolean, correctText: string) 每题只调用一次
// 题型: choice / assemble / fill / listenChoice / dictation / match / translate / speak
import { el, esc, audioBtn, micBtn } from './ui.js';
import { speak } from './speech.js';

function norm(s) {
  return s.toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:"„“”'’()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- choice：单选（文字或听音提示） ---------- */
function renderChoice(host, item, ctx, { audioPrompt = false } = {}) {
  const head = el(`<div class="ex-prompt"></div>`);
  if (audioPrompt) {
    head.appendChild(el(`<div class="ex-audio-big"></div>`));
    const play = audioBtn(item.audioText);
    play.classList.add('big');
    head.querySelector('.ex-audio-big').appendChild(play);
    head.appendChild(audioBtn(item.audioText, { slow: true }));
    setTimeout(() => speak(item.audioText), 250);
  } else {
    head.appendChild(el(`<div class="ex-q">${esc(item.prompt)}</div>`));
    if (item.audioText) head.appendChild(audioBtn(item.audioText));
  }
  host.appendChild(head);

  const opts = el(`<div class="ex-options"></div>`);
  item.options.forEach((opt, i) => {
    const b = el(`<button class="ex-opt">${esc(opt)}</button>`);
    b.addEventListener('click', () => {
      if (host.dataset.done) return;
      host.dataset.done = '1';
      const ok = i === item.a;
      b.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) opts.children[item.a].classList.add('correct');
      [...opts.children].forEach(x => x.disabled = true);
      ctx.onSubmit(ok, item.options[item.a]);
    });
    opts.appendChild(b);
  });
  host.appendChild(opts);
}

/* ---------- assemble / dictation：词块拼句 ---------- */
function renderAssemble(host, item, ctx, { dictation = false } = {}) {
  const answer = item.answer || item.audioText;
  const tokens = answer.split(/\s+/);

  if (dictation) {
    const head = el(`<div class="ex-prompt">
      <div class="ex-q">听音频，拼出你听到的句子</div>
      <div class="ex-audio-row"></div>
    </div>`);
    const row = head.querySelector('.ex-audio-row');
    row.appendChild(audioBtn(answer));
    row.appendChild(audioBtn(answer, { slow: true }));
    host.appendChild(head);
    setTimeout(() => speak(answer), 250);
  } else {
    host.appendChild(el(`<div class="ex-prompt">
      <div class="ex-q">拼出德语：<b>${esc(item.zh)}</b></div>
    </div>`));
  }

  const line = el(`<div class="ex-line" aria-label="你的答案"></div>`);
  const bank = el(`<div class="ex-bank"></div>`);
  host.appendChild(line);
  host.appendChild(bank);

  const chips = shuffle([...tokens, ...(item.distractors || [])]);
  chips.forEach(word => {
    const chip = el(`<button class="ex-chip">${esc(word)}</button>`);
    chip.addEventListener('click', () => {
      if (host.dataset.done) return;
      if (chip.parentElement === bank) line.appendChild(chip);
      else bank.appendChild(chip);
      checkBtn.disabled = !line.children.length;
    });
    bank.appendChild(chip);
  });

  const checkBtn = el(`<button class="btn block" style="margin-top:14px" disabled>检查</button>`);
  checkBtn.addEventListener('click', () => {
    if (host.dataset.done) return;
    host.dataset.done = '1';
    const built = [...line.children].map(c => c.textContent).join(' ');
    const ok = norm(built) === norm(answer);
    line.classList.add(ok ? 'line-correct' : 'line-wrong');
    checkBtn.remove();
    [...bank.children, ...line.children].forEach(c => c.disabled = true);
    ctx.onSubmit(ok, answer);
  });
  host.appendChild(checkBtn);
}

/* ---------- fill：填空打字 ---------- */
function renderFill(host, item, ctx) {
  host.appendChild(el(`<div class="ex-prompt"><div class="ex-q">${esc(item.prompt)}</div></div>`));
  const wrap = el(`<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:8px">
    <input class="quiz-fill-input" type="text" autocapitalize="off" autocomplete="off" autocorrect="off"
      placeholder="${item.hint ? esc(item.hint) + '…' : '输入答案'}">
    <button class="btn small secondary">检查</button>
  </div>`);
  const input = wrap.querySelector('input');
  const btn = wrap.querySelector('button');
  const submit = () => {
    if (host.dataset.done) return;
    const val = input.value.trim();
    if (!val) return;
    host.dataset.done = '1';
    const ok = item.a.some(ans => norm(ans) === norm(val));
    input.classList.add(ok ? 'correct' : 'wrong');
    input.disabled = true; btn.disabled = true;
    ctx.onSubmit(ok, item.a[0]);
  };
  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  host.appendChild(wrap);
  setTimeout(() => input.focus(), 100);
}

/* ---------- match：词义配对 ---------- */
function renderMatch(host, item, ctx) {
  host.appendChild(el(`<div class="ex-prompt"><div class="ex-q">配对：点一个德语词，再点它的意思</div></div>`));
  const grid = el(`<div class="ex-match"></div>`);
  const left = el(`<div class="ex-match-col"></div>`);
  const right = el(`<div class="ex-match-col"></div>`);
  grid.appendChild(left); grid.appendChild(right);
  host.appendChild(grid);

  let sel = null;
  let solved = 0;
  let anyError = false;
  const total = item.pairs.length;

  shuffle(item.pairs).forEach(p => {
    const b = el(`<button class="ex-chip ex-match-de">${esc(p.de)}</button>`);
    b.dataset.key = p.de;
    b.addEventListener('click', () => {
      if (b.disabled) return;
      document.querySelectorAll('.ex-match-de.sel').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      sel = b;
      speak(p.de);
    });
    left.appendChild(b);
  });
  shuffle(item.pairs).forEach(p => {
    const b = el(`<button class="ex-chip">${esc(p.zh)}</button>`);
    b.addEventListener('click', () => {
      if (b.disabled || !sel) return;
      const pair = item.pairs.find(x => x.de === sel.dataset.key);
      if (pair.zh === p.zh) {
        sel.disabled = true; b.disabled = true;
        sel.classList.add('matched'); b.classList.add('matched');
        sel.classList.remove('sel');
        sel = null;
        solved++;
        if (solved === total && !host.dataset.done) {
          host.dataset.done = '1';
          ctx.onSubmit(!anyError, item.pairs.map(x => `${x.de}=${x.zh}`).join('，'));
        }
      } else {
        anyError = true;
        b.classList.add('shake');
        setTimeout(() => b.classList.remove('shake'), 400);
      }
    });
    right.appendChild(b);
  });
}

/* ---------- translate：中译德打字 ---------- */
function renderTranslate(host, item, ctx) {
  host.appendChild(el(`<div class="ex-prompt"><div class="ex-q">翻译成德语：<b>${esc(item.zh)}</b></div></div>`));
  const wrap = el(`<div style="margin-top:8px">
    <textarea class="io-area" style="min-height:60px;font-size:1rem" autocapitalize="off" autocorrect="off" placeholder="输入德语句子"></textarea>
    <button class="btn block" style="margin-top:10px" disabled>检查</button>
  </div>`);
  const input = wrap.querySelector('textarea');
  const btn = wrap.querySelector('button');
  input.addEventListener('input', () => { btn.disabled = !input.value.trim(); });
  btn.addEventListener('click', () => {
    if (host.dataset.done) return;
    host.dataset.done = '1';
    const ok = item.a.some(ans => norm(ans) === norm(input.value));
    input.style.borderColor = ok ? 'var(--green)' : 'var(--red)';
    input.disabled = true; btn.disabled = true;
    ctx.onSubmit(ok, item.a[0]);
  });
  host.appendChild(wrap);
}

/* ---------- speak：跟读（可跳过，不计错题） ---------- */
function renderSpeak(host, item, ctx) {
  host.appendChild(el(`<div class="ex-prompt">
    <div class="ex-q">🎤 跟读这句</div>
    <div class="ex-de de" style="font-size:1.3rem;font-weight:700;margin:10px 0 4px">${esc(item.de)}</div>
    <div class="meta">${esc(item.zh || '')}</div>
  </div>`));
  const row = el(`<div style="display:flex;gap:10px;justify-content:center;margin:14px 0"></div>`);
  row.appendChild(audioBtn(item.de));
  row.appendChild(audioBtn(item.de, { slow: true }));
  const result = el(`<div style="min-height:60px"></div>`);
  const mic = micBtn(item.de, result, {
    onScore: (score) => {
      if (host.dataset.done) return;
      if (score >= 70) {
        host.dataset.done = '1';
        ctx.onSubmit(true, item.de);
      }
      // 低于 70 不锁定，可反复尝试
    },
  });
  row.appendChild(mic);
  host.appendChild(row);
  host.appendChild(result);
  const skip = el(`<button class="btn small secondary" style="margin-top:8px">跳过（麦克风不便时）</button>`);
  skip.addEventListener('click', () => {
    if (host.dataset.done) return;
    host.dataset.done = '1';
    ctx.onSubmit(null, item.de); // null = 不计入统计
  });
  host.appendChild(skip);
  setTimeout(() => speak(item.de), 250);
}

export function renderExercise(host, item, ctx) {
  delete host.dataset.done; // 宿主元素跨题复用，必须清除上一题的锁定标记
  switch (item.type) {
    case 'choice': return renderChoice(host, item, ctx);
    case 'listenChoice': return renderChoice(host, item, ctx, { audioPrompt: true });
    case 'assemble': return renderAssemble(host, item, ctx);
    case 'dictation': return renderAssemble(host, item, ctx, { dictation: true });
    case 'fill': return renderFill(host, item, ctx);
    case 'match': return renderMatch(host, item, ctx);
    case 'translate': return renderTranslate(host, item, ctx);
    case 'speak': return renderSpeak(host, item, ctx);
    default:
      host.appendChild(el(`<p>未知题型 ${esc(item.type)}</p>`));
      ctx.onSubmit(null, '');
  }
}

export const EXERCISE_TYPES = ['choice', 'listenChoice', 'assemble', 'dictation', 'fill', 'match', 'translate', 'speak'];
