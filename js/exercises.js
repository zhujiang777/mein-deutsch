// 题型组件库：统一接口 renderExercise(host, item, { onSubmit })
// onSubmit(correct: boolean, correctText: string) 每题只调用一次
// 题型: choice / assemble / fill / listenChoice / dictation / match / translate / speak
//       + 微步课展示/复述步: scene / observe / reproduce / roleplay
import { el, esc, audioBtn, speakPractice, toast } from './ui.js';
import { speak, stopSpeak } from './speech.js';
import { recordingSupported, startRecording } from './recorder.js';

// 德语特殊字符输入条（dictation 打字模式用）
const SPECIAL_CHARS = ['ä', 'ö', 'ü', 'ß', 'ẞ', 'Ä', 'Ö', 'Ü'];

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

// 转义后把 hl 子串的首次出现包成 <mark>（observe 步高亮用）
function highlightHtml(de, hl) {
  const safe = esc(de);
  if (!hl) return safe;
  const safeHl = esc(hl);
  const idx = safe.indexOf(safeHl);
  if (idx < 0) return safe;
  return safe.slice(0, idx) + '<mark>' + safeHl + '</mark>' + safe.slice(idx + safeHl.length);
}

// 逐句顺序播放（scene 连播）；靠 speak 的 onend 串起来
function sequencePlay(texts, i = 0) {
  if (i >= texts.length) return;
  speak(texts[i], { onend: () => sequencePlay(texts, i + 1) });
}

// 并排对比回放：▶标准 | ▶我的录音（reproduce/roleplay 共用）
function playbackCompare(targetText, myUrl) {
  const row = el(`<div class="sp-compare"></div>`);
  const std = el(`<button class="sp-cmp"><span class="sp-cmp-icon">▶</span><span>标准</span></button>`);
  std.addEventListener('click', () => { stopSpeak(); speak(targetText); });
  row.appendChild(std);
  if (myUrl) {
    const audio = new Audio(myUrl);
    const mine = el(`<button class="sp-cmp mine"><span class="sp-cmp-icon">▶</span><span>我的录音</span></button>`);
    mine.addEventListener('click', () => { stopSpeak(); audio.currentTime = 0; audio.play().catch(() => {}); });
    row.appendChild(mine);
  }
  return row;
}

// 录音按钮：切换 录音/停止；停止后回调 onDone(url|null, err?)。object URL 由调用方管理
function recordButton(onDone) {
  const btn = el(`<button class="btn sp-record">🎤 录音</button>`);
  let ctl = null;
  btn.addEventListener('click', async () => {
    if (btn.classList.contains('recording')) {
      btn.disabled = true;
      const res = ctl ? await ctl.stop() : null;
      ctl = null;
      btn.classList.remove('recording');
      btn.disabled = false;
      btn.textContent = '🔁 重录';
      onDone(res?.url || null);
      return;
    }
    btn.disabled = true;
    try { ctl = await startRecording(); }
    catch (err) { btn.disabled = false; onDone(null, err); return; }
    btn.disabled = false;
    btn.classList.add('recording');
    btn.textContent = '⏹ 停止';
  });
  return btn;
}

function insertAtCursor(input, ch) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, start) + ch + input.value.slice(end);
  const pos = start + ch.length;
  input.setSelectionRange(pos, pos);
  input.focus();
}

// 打字判定用归一化：忽略大小写、标点、多余空格；ß≈ss 宽容
function normType(s) {
  return s.toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:"„“”'’()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

/* ---------- speak：跟读（录音对比为主，可跳过，不计错题） ---------- */
function renderSpeak(host, item, ctx) {
  host.appendChild(el(`<div class="ex-prompt">
    <div class="ex-q">🎤 跟读这句</div>
    <div class="ex-de de" style="font-size:1.3rem;font-weight:700;margin:10px 0 4px">${esc(item.de)}</div>
    <div class="meta">${esc(item.zh || '')}</div>
  </div>`));
  const practiceHost = el(`<div style="margin-top:8px"></div>`);
  speakPractice(practiceHost, item.de, {
    onScore: (score) => {
      // 识别可用且达标时自动通过；否则靠下方"完成"按钮
      if (host.dataset.done) return;
      if (score >= 70) { host.dataset.done = '1'; ctx.onSubmit(true, item.de); }
    },
  });
  host.appendChild(practiceHost);
  const done = el(`<button class="btn block secondary" style="margin-top:12px">完成，继续 ›</button>`);
  done.addEventListener('click', () => {
    if (host.dataset.done) return;
    host.dataset.done = '1';
    ctx.onSubmit(null, item.de); // null = 不计入统计
  });
  host.appendChild(done);
  setTimeout(() => speak(item.de), 250);
}

/* ---------- dictation：默认打字，可切词块 ---------- */
function renderDictation(host, item, ctx) {
  if ((item.mode || 'type') === 'blocks') return renderAssemble(host, item, ctx, { dictation: true });

  const answer = item.answer || item.audioText;
  const head = el(`<div class="ex-prompt">
    <div class="ex-q">听音频，打出你听到的句子</div>
    <div class="ex-audio-row"></div>
  </div>`);
  const row = head.querySelector('.ex-audio-row');
  row.appendChild(audioBtn(answer));
  row.appendChild(audioBtn(answer, { slow: true }));
  host.appendChild(head);
  setTimeout(() => speak(answer), 250);

  const input = el(`<input class="dict-input de" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="在这里输入…">`);
  const charBar = el(`<div class="dict-charbar"></div>`);
  SPECIAL_CHARS.forEach(ch => {
    const b = el(`<button class="dict-char" type="button">${ch}</button>`);
    b.addEventListener('click', () => insertAtCursor(input, ch));
    charBar.appendChild(b);
  });
  const feedback = el(`<div class="dict-feedback"></div>`);
  const checkBtn = el(`<button class="btn block" style="margin-top:12px" disabled>检查</button>`);
  const toBlocks = el(`<button class="dict-toblocks" type="button">改用词块 ›</button>`);

  input.addEventListener('input', () => { checkBtn.disabled = !input.value.trim(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !checkBtn.disabled) checkBtn.click(); });

  checkBtn.addEventListener('click', () => {
    if (host.dataset.done) return;
    const val = input.value.trim();
    if (!val) return;
    host.dataset.done = '1';
    const ok = normType(val) === normType(answer);
    input.disabled = true; checkBtn.remove(); toBlocks.remove();
    input.classList.add(ok ? 'correct' : 'wrong');
    if (ok) {
      // 判对了，但若只差在大小写（名词没大写），温和提示一下
      const stripP = s => s.replace(/[.,!?;:"„“”'’()\-–—]/g, '').replace(/\s+/g, ' ').trim();
      const a2 = stripP(answer), u2 = stripP(val);
      if (a2.toLowerCase() === u2.toLowerCase() && a2 !== u2) {
        feedback.innerHTML = `<div class="dict-note">✓ 正确！注意：德语名词首字母大写</div>`;
      }
    } else {
      const ansSet = new Set(answer.split(/\s+/).map(normType));
      const userHtml = val.split(/\s+/).map(w =>
        `<span class="${ansSet.has(normType(w)) ? '' : 'dict-wrong'}">${esc(w)}</span>`).join(' ');
      feedback.innerHTML = `<div class="dict-diff">
        <div class="dict-diff-line">正确：<span class="de">${esc(answer)}</span></div>
        <div class="dict-diff-line">你写的：<span class="de">${userHtml}</span></div>
      </div>`;
    }
    ctx.onSubmit(ok, answer);
  });

  toBlocks.addEventListener('click', () => {
    host.innerHTML = '';
    delete host.dataset.done;
    renderAssemble(host, item, ctx, { dictation: true });
  });

  host.appendChild(input);
  host.appendChild(charBar);
  host.appendChild(feedback);
  host.appendChild(checkBtn);
  const toBlocksWrap = el(`<div class="dict-toblocks-wrap"></div>`);
  toBlocksWrap.appendChild(toBlocks);
  host.appendChild(toBlocksWrap);
  setTimeout(() => input.focus(), 120);
}

/* ---------- scene：对话展示步（逐句 + 连播 + 中文开关） ---------- */
function renderScene(host, item, ctx) {
  const card = el(`<div class="scene-step"></div>`);
  if (item.title) card.appendChild(el(`<h2 class="step-h">${esc(item.title)}</h2>`));
  const bar = el(`<div class="scene-bar"></div>`);
  const playAll = el(`<button class="btn small secondary">▶ 连播</button>`);
  const zhToggle = el(`<button class="btn small secondary">隐藏中文</button>`);
  bar.appendChild(playAll); bar.appendChild(zhToggle);
  card.appendChild(bar);

  const lines = el(`<div class="scene-lines"></div>`);
  item.lines.forEach(ln => {
    const rowEl = el(`<div class="scene-line">
      <div class="scene-who">${esc(ln.who || '')}</div>
      <div class="scene-bubble">
        <div class="scene-de de">${esc(ln.de)}</div>
        <div class="scene-zh">${esc(ln.zh || '')}</div>
      </div>
    </div>`);
    const play = audioBtn(ln.de);
    play.style.width = '28px'; play.style.height = '28px'; play.style.fontSize = '.8rem';
    rowEl.querySelector('.scene-bubble').appendChild(play);
    lines.appendChild(rowEl);
  });
  card.appendChild(lines);
  host.appendChild(card);

  playAll.addEventListener('click', () => sequencePlay(item.lines.map(l => l.de)));
  zhToggle.addEventListener('click', () => {
    lines.classList.toggle('hide-zh');
    zhToggle.textContent = lines.classList.contains('hide-zh') ? '显示中文' : '隐藏中文';
  });

  const cont = el(`<button class="btn block" style="margin-top:16px">继续</button>`);
  cont.addEventListener('click', () => { if (host.dataset.done) return; host.dataset.done = '1'; ctx.onSubmit(null, ''); });
  host.appendChild(cont);
}

/* ---------- observe：语法观察步（片段 + 高亮 + 引导选择） ---------- */
function renderObserve(host, item, ctx) {
  const card = el(`<div class="observe-step"></div>`);
  if (item.intro) card.appendChild(el(`<p class="step-p">${esc(item.intro)}</p>`));
  const lines = el(`<div class="observe-lines"></div>`);
  item.lines.forEach(ln => {
    const rowEl = el(`<div class="observe-line">
      <div class="observe-de de">${highlightHtml(ln.de, ln.hl)}</div>
      <div class="observe-zh">${esc(ln.zh || '')}</div>
    </div>`);
    const play = audioBtn(ln.de);
    play.style.width = '28px'; play.style.height = '28px'; play.style.fontSize = '.8rem';
    rowEl.querySelector('.observe-de').appendChild(document.createTextNode(' '));
    rowEl.querySelector('.observe-de').appendChild(play);
    lines.appendChild(rowEl);
  });
  card.appendChild(lines);
  card.appendChild(el(`<div class="observe-q ex-q">${esc(item.q)}</div>`));

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
  card.appendChild(opts);
  host.appendChild(card);
}

/* ---------- reproduce：整句复述（听→录→揭示原文→自评） ---------- */
function renderReproduce(host, item, ctx) {
  const card = el(`<div class="reproduce-step">
    <div class="ex-q">听德语 → 自己复述出来</div>
    <div class="reproduce-zh">${esc(item.zh)}</div>
    <div class="reproduce-controls"></div>
    <div class="reproduce-reveal"></div>
  </div>`);
  const controls = card.querySelector('.reproduce-controls');
  const reveal = card.querySelector('.reproduce-reveal');
  controls.appendChild(audioBtn(item.de));
  controls.appendChild(audioBtn(item.de, { slow: true }));
  host.appendChild(card);
  setTimeout(() => speak(item.de), 300);

  const finishReveal = (url) => {
    controls.querySelectorAll('.sp-record').forEach(b => b.remove());
    reveal.innerHTML = '';
    reveal.appendChild(el(`<div class="reproduce-de de">${esc(item.de)}</div>`));
    reveal.appendChild(el(`<div class="reproduce-zh2">${esc(item.zh)}</div>`));
    reveal.appendChild(playbackCompare(item.de, url));
    const assess = el(`<div class="reproduce-assess"></div>`);
    const ok = el(`<button class="btn">✅ 复现出来了</button>`);
    const no = el(`<button class="btn secondary">🔁 还不行</button>`);
    ok.addEventListener('click', () => { if (host.dataset.done) return; host.dataset.done = '1'; ctx.onSubmit(true, item.de); });
    no.addEventListener('click', () => { if (host.dataset.done) return; host.dataset.done = '1'; ctx.onSubmit(false, item.de); });
    assess.appendChild(ok); assess.appendChild(no);
    reveal.appendChild(assess);
  };

  if (recordingSupported()) {
    controls.appendChild(recordButton((url, err) => { if (err) toast(err.message || '无法录音'); finishReveal(url); }));
  } else {
    const showBtn = el(`<button class="btn">听完了，看原文自评</button>`);
    showBtn.addEventListener('click', () => finishReveal(null));
    controls.appendChild(showBtn);
  }
}

/* ---------- roleplay：角色扮演收尾步（逐句推进） ---------- */
function renderRoleplay(host, item, ctx) {
  const card = el(`<div class="roleplay-step"></div>`);
  if (item.title) card.appendChild(el(`<h2 class="step-h">${esc(item.title)}</h2>`));
  card.appendChild(el(`<p class="step-p">你的角色：<b>${esc(item.userRole)}</b> · 轮到你时用德语说</p>`));
  const log = el(`<div class="roleplay-log"></div>`);
  const area = el(`<div class="roleplay-area"></div>`);
  card.appendChild(log);
  card.appendChild(area);
  host.appendChild(card);

  let i = 0;
  const otherRow = (ln, mine = false) => {
    const rowEl = el(`<div class="scene-line ${mine ? 'me' : 'other'}">
      <div class="scene-who">${esc(ln.who || '')}${mine ? '（你）' : ''}</div>
      <div class="scene-bubble"><div class="scene-de de">${esc(ln.de)}</div>${mine ? '' : `<div class="scene-zh">${esc(ln.zh || '')}</div>`}</div>
    </div>`);
    if (!mine) {
      const play = audioBtn(ln.de);
      play.style.width = '28px'; play.style.height = '28px'; play.style.fontSize = '.8rem';
      rowEl.querySelector('.scene-bubble').appendChild(play);
    }
    return rowEl;
  };

  const next = () => {
    area.innerHTML = '';
    if (i >= item.lines.length) {
      const done = el(`<button class="btn block">完成，继续 ›</button>`);
      done.addEventListener('click', () => { if (host.dataset.done) return; host.dataset.done = '1'; ctx.onSubmit(true, ''); });
      area.appendChild(done);
      return;
    }
    const ln = item.lines[i];
    if (ln.who !== item.userRole) {
      log.appendChild(otherRow(ln));
      speak(ln.de);
      const nx = el(`<button class="btn block">下一句 ›</button>`);
      nx.addEventListener('click', () => { i++; next(); });
      area.appendChild(nx);
    } else {
      const turn = el(`<div class="roleplay-turn">
        <div class="scene-who">${esc(ln.who)}（你）</div>
        <div class="roleplay-cue">${esc(ln.zh || '看提示，用德语说出来')}</div>
        <div class="roleplay-controls"></div>
        <div class="roleplay-reveal"></div>
      </div>`);
      const rc = turn.querySelector('.roleplay-controls');
      const rv = turn.querySelector('.roleplay-reveal');
      area.appendChild(turn);
      const revealRef = (url) => {
        rc.querySelectorAll('.sp-record, .roleplay-show').forEach(b => b.remove());
        rv.innerHTML = '';
        rv.appendChild(el(`<div class="reproduce-de de">${esc(ln.de)}</div>`));
        rv.appendChild(playbackCompare(ln.de, url));
        log.appendChild(otherRow(ln, true));
        const nx = el(`<button class="btn block" style="margin-top:10px">下一句 ›</button>`);
        nx.addEventListener('click', () => { i++; next(); });
        rv.appendChild(nx);
      };
      if (recordingSupported()) {
        rc.appendChild(recordButton((url, err) => { if (err) toast(err.message || '无法录音'); revealRef(url); }));
      } else {
        const showBtn = el(`<button class="btn roleplay-show">看中文说德语 → 显示参考</button>`);
        showBtn.addEventListener('click', () => revealRef(null));
        rc.appendChild(showBtn);
      }
    }
  };
  next();
}

export function renderExercise(host, item, ctx) {
  delete host.dataset.done; // 宿主元素跨题复用，必须清除上一题的锁定标记
  switch (item.type) {
    case 'choice': return renderChoice(host, item, ctx);
    case 'listenChoice': return renderChoice(host, item, ctx, { audioPrompt: true });
    case 'assemble': return renderAssemble(host, item, ctx);
    case 'dictation': return renderDictation(host, item, ctx);
    case 'fill': return renderFill(host, item, ctx);
    case 'match': return renderMatch(host, item, ctx);
    case 'translate': return renderTranslate(host, item, ctx);
    case 'speak': return renderSpeak(host, item, ctx);
    case 'scene': return renderScene(host, item, ctx);
    case 'observe': return renderObserve(host, item, ctx);
    case 'reproduce': return renderReproduce(host, item, ctx);
    case 'roleplay': return renderRoleplay(host, item, ctx);
    default:
      host.appendChild(el(`<p>未知题型 ${esc(item.type)}</p>`));
      ctx.onSubmit(null, '');
  }
}

export const EXERCISE_TYPES = ['choice', 'listenChoice', 'assemble', 'dictation', 'fill', 'match', 'translate', 'speak', 'scene', 'observe', 'reproduce', 'roleplay'];
