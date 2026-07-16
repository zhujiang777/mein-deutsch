// 体系化语法课：列表 + 详情（讲解、表格、例句、练习题）
import { GRAMMAR_LESSONS } from '../../data/grammar.js';
import { el, esc, audioBtn, micBtn, renderQuiz, toast } from '../ui.js';
import { isDone, markDone } from '../storage.js';

export function renderGrammar(host, id) {
  if (id) return renderLesson(host, id);

  host.appendChild(el(`<h1 class="page-title">📐 体系化语法</h1>`));
  host.appendChild(el(`<p class="page-sub">按 A1 大纲编排，中文讲解，建议按顺序学习。每课后的练习做完（正确率不限）即算完成。</p>`));

  GRAMMAR_LESSONS.forEach((lesson, i) => {
    const done = isDone('grammar', lesson.id);
    host.appendChild(el(`<a class="list-item" href="#/grammar/${lesson.id}">
      <span class="li-icon">${done ? '✅' : `${i + 1}.`}</span>
      <div class="li-main">
        <div class="li-title">${esc(lesson.title)}</div>
        <div class="li-sub">${esc(lesson.sub)}</div>
      </div>
      <span class="li-arrow">›</span>
    </a>`));
  });
}

function renderLesson(host, id) {
  const idx = GRAMMAR_LESSONS.findIndex(l => l.id === id);
  const lesson = GRAMMAR_LESSONS[idx];
  if (!lesson) { location.hash = '#/grammar'; return; }

  host.appendChild(el(`<a class="back-link" href="#/grammar">‹ 语法课列表</a>`));
  host.appendChild(el(`<h1 class="page-title">${esc(lesson.title)}</h1>`));

  const body = el(`<div class="lesson-body"></div>`);
  lesson.sections.forEach(sec => {
    if (sec.h) body.appendChild(el(`<h2>${esc(sec.h)}</h2>`));
    if (sec.p) sec.p.split('\n').forEach(t => body.appendChild(el(`<p>${esc(t)}</p>`)));
    if (sec.table) {
      const wrap = el(`<div class="gram-table-wrap"></div>`);
      const table = el(`<table class="gram-table"></table>`);
      table.appendChild(el(`<tr>${sec.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`));
      sec.table.rows.forEach(r =>
        table.appendChild(el(`<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`)));
      wrap.appendChild(table);
      body.appendChild(wrap);
    }
    if (sec.examples) {
      const card = el(`<div class="card"></div>`);
      sec.examples.forEach(ex => {
        const row = el(`<div class="example-row">
          <div style="flex:1">
            <div class="ex-de de">${esc(ex.de)}</div>
            <div class="ex-zh">${esc(ex.zh)}</div>
            <div class="p-result"></div>
          </div>
        </div>`);
        const btns = el(`<div style="display:flex;gap:6px;flex-shrink:0"></div>`);
        btns.appendChild(audioBtn(ex.de));
        btns.appendChild(micBtn(ex.de, row.querySelector('.p-result')));
        row.appendChild(btns);
        card.appendChild(row);
      });
      body.appendChild(card);
    }
    if (sec.tip) body.appendChild(el(`<div class="tip">💡 ${esc(sec.tip)}</div>`));
  });
  host.appendChild(body);

  if (lesson.exercises?.length) {
    host.appendChild(el(`<h2 style="font-size:1.15rem;margin:20px 0 8px;color:var(--accent)">✏️ 练习</h2>`));
    const quizCard = el(`<div class="card"></div>`);
    renderQuiz(lesson.exercises, quizCard, (correct, total) => {
      markDone('grammar', id);
      toast(`练习完成：${correct}/${total} 🎉 本课已标记完成`);
    });
    host.appendChild(quizCard);
  }

  if (idx < GRAMMAR_LESSONS.length - 1) {
    host.appendChild(el(`<a class="btn secondary block" style="margin-top:14px" href="#/grammar/${GRAMMAR_LESSONS[idx + 1].id}">下一课：${esc(GRAMMAR_LESSONS[idx + 1].title)} ›</a>`));
  }
}
