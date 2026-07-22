// 分级阅读：精读（点词查义 + 逐句翻译 + 注释）/ 泛读（理解题）
import { READINGS } from '../../data/readings.js';
import { el, esc, audioBtn, micBtn, renderQuiz, toast } from '../ui.js';
import { isDone, markDone } from '../storage.js';
import { enableGloss } from '../dict.js';

export function renderReading(host, id) {
  if (id) return renderText(host, id);

  host.appendChild(el(`<h1 class="page-title">📖 分级阅读</h1>`));
  host.appendChild(el(`<p class="page-sub"><b>精读</b>：逐句弄懂，点任意单词查词义，可显示逐句翻译。<b>泛读</b>：不查词，读懂大意即可，读完做理解题。建议精读:泛读 = 1:1 搭配。</p>`));

  const intensive = READINGS.filter(r => r.mode === 'intensiv');
  const extensive = READINGS.filter(r => r.mode === 'extensiv');

  host.appendChild(el(`<div class="section-label">精读 · Intensives Lesen</div>`));
  intensive.forEach(r => host.appendChild(item(r)));
  host.appendChild(el(`<div class="section-label">泛读 · Extensives Lesen</div>`));
  extensive.forEach(r => host.appendChild(item(r)));

  function item(r) {
    const done = isDone('reading', r.id);
    return el(`<a class="list-item" href="#/reading/${r.id}">
      <span class="li-icon">${done ? '✅' : r.mode === 'intensiv' ? '🔍' : '🛋️'}</span>
      <div class="li-main">
        <div class="li-title de">${esc(r.title)}</div>
        <div class="li-sub">${esc(r.titleZh)} · ${r.level} · ${r.sentences.length} 句</div>
      </div>
      <span class="li-arrow">›</span>
    </a>`);
  }
}

function renderText(host, id) {
  const r = READINGS.find(x => x.id === id);
  if (!r) { location.hash = '#/reading'; return; }

  host.appendChild(el(`<a class="back-link" href="#/reading">‹ 阅读列表</a>`));
  host.appendChild(el(`<h1 class="page-title de">${esc(r.title)}</h1>`));
  host.appendChild(el(`<p class="page-sub">${esc(r.titleZh)} · <span class="pill ${r.mode === 'intensiv' ? '' : 'blue'}">${r.mode === 'intensiv' ? '精读' : '泛读'}</span> <span class="pill green">${r.level}</span></p>`));
  if (r.intro) host.appendChild(el(`<div class="tip" style="background:var(--accent-soft);border-left:3px solid var(--accent);border-radius:8px;padding:10px 12px;font-size:.88rem;margin-bottom:12px">📌 ${esc(r.intro)}</div>`));

  const card = el(`<div class="card"></div>`);
  const textWrap = el(`<div class="reading-text"></div>`);

  r.sentences.forEach((s, si) => {
    const sent = el(`<span class="rt-sent"></span>`);
    // 保留分词/高亮；实际取词由 dict.js caret API 在父容器事件委托完成。
    s.de.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) { sent.appendChild(document.createTextNode(part)); return; }
      const tok = el(`<span class="tok de">${esc(part)}</span>`);
      sent.appendChild(tok);
    });
    const btns = el(`<span style="white-space:nowrap"> </span>`);
    const inline = audioBtn(s.de);
    inline.style.width = '26px'; inline.style.height = '26px'; inline.style.fontSize = '.8rem';
    btns.appendChild(inline);
    sent.appendChild(btns);

    const block = el(`<div></div>`);
    block.appendChild(sent);
    const zhLine = el(`<div class="rt-zh">${esc(s.zh)}${s.note ? ` <span class="rt-note">〔${esc(s.note)}〕</span>` : ''}</div>`);
    block.appendChild(zhLine);
    textWrap.appendChild(block);
  });
  card.appendChild(textWrap);
  host.appendChild(card);
  textWrap.addEventListener('click', (event) => {
    const tok = event.target.closest('.tok');
    if (!tok) return;
    textWrap.querySelectorAll('.tok-hl').forEach(t => t.classList.remove('tok-hl'));
    tok.classList.add('tok-hl');
  });
  enableGloss(textWrap, { glossary: r.glossary || {}, sentenceSelector: '.rt-sent', source: r.id });

  // 精读：翻译开关 + 全文朗读；泛读：只有全文朗读
  const controls = el(`<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"></div>`);
  if (r.mode === 'intensiv') {
    const toggle = el(`<button class="btn small secondary">显示逐句翻译</button>`);
    toggle.addEventListener('click', () => {
      textWrap.classList.toggle('show-zh');
      toggle.textContent = textWrap.classList.contains('show-zh') ? '隐藏翻译' : '显示逐句翻译';
    });
    controls.appendChild(toggle);
  }
  const readAll = el(`<button class="btn small secondary">🔊 全文朗读</button>`);
  readAll.addEventListener('click', () => {
    import('../speech.js').then(({ speak }) => speak(r.sentences.map(s => s.de).join(' ')));
  });
  controls.appendChild(readAll);
  host.insertBefore(controls, card);

  // 跟读练习（精读）：挑选每篇的跟读句
  if (r.mode === 'intensiv') {
    host.appendChild(el(`<div class="section-label">🎤 跟读这几句</div>`));
    const speakCard = el(`<div class="card"></div>`);
    const picks = r.speakPractice?.length ? r.speakPractice : [0, Math.floor(r.sentences.length / 2)];
    picks.forEach(i => {
      const s = r.sentences[i];
      if (!s) return;
      const row = el(`<div class="phrase-row">
        <div class="p-main">
          <div class="p-de de">${esc(s.de)}</div>
          <div class="p-zh">${esc(s.zh)}</div>
          <div class="p-result"></div>
        </div>
        <div class="p-btns"></div>
      </div>`);
      const btns = row.querySelector('.p-btns');
      btns.appendChild(audioBtn(s.de));
      btns.appendChild(micBtn(s.de, row.querySelector('.p-result')));
      speakCard.appendChild(row);
    });
    host.appendChild(speakCard);
  }

  // 泛读：理解题
  if (r.questions?.length) {
    host.appendChild(el(`<div class="section-label">✏️ 读懂了吗</div>`));
    const quizCard = el(`<div class="card"></div>`);
    renderQuiz(r.questions, quizCard, (correct, total) => {
      markDone('reading', id);
      toast(`理解题 ${correct}/${total} 🎉 本篇已标记读完`);
    });
    host.appendChild(quizCard);
  } else {
    const doneBtn = el(`<button class="btn block" style="margin-top:14px">${isDone('reading', id) ? '✅ 已读完' : '标记读完'}</button>`);
    doneBtn.addEventListener('click', () => {
      markDone('reading', id);
      toast('已记录 🎉');
      doneBtn.textContent = '✅ 已读完';
    });
    host.appendChild(doneBtn);
  }
}
