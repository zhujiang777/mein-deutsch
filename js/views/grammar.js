// 体系化语法课：列表 + 详情（讲解、表格、例句、练习题、真实语境实例）
import { GRAMMAR_LESSONS } from '../../data/grammar.js';
import { grammarExamples, grammarLessonRefs, grammarContentRefs } from '../../data/grammar-index.js';
import { COURSE_CATALOG } from '../../data/content-index.js';
import { READINGS } from '../../data/readings.js';
import { LISTENING_PACKS } from '../../data/listening.js';
// icon 一直被用却从没 import 过——语法课列表页因此每次渲染都抛 ReferenceError。
import { el, esc, audioBtn, icon, micBtn, renderQuiz, toast } from '../ui.js';
import { isDone, markDone } from '../storage.js';
import { lessonMastery, recordAnswer } from '../mastery.js';

export function renderGrammar(host, id) {
  if (id) return renderLesson(host, id);

  host.appendChild(el(`<h1 class="page-title">体系化语法</h1>`));
  host.appendChild(el(`<p class="page-sub">按 A1 大纲编排，中文讲解，建议按顺序学习。掌握度来自你在所有模块里的答题——微步课、语法课、精读精听共用同一套技能标签。</p>`));

  GRAMMAR_LESSONS.forEach((lesson, i) => {
    const done = isDone('grammar', lesson.id);
    const mastery = lessonMastery(lesson);
    host.appendChild(el(`<a class="list-item" href="#/grammar/${lesson.id}">
      <span class="li-icon">${done ? icon('check') : `${i + 1}`}</span>
      <div class="li-main">
        <div class="li-title">${esc(lesson.title)}</div>
        <div class="li-sub">${esc(lesson.sub)}${mastery > 0 ? ` · 掌握度 ${mastery}%` : ''}</div>
      </div>
      <span class="li-arrow">${icon('arrow')}</span>
    </a>`));
  });
}

const LESSON_TITLES = new Map(
  COURSE_CATALOG.flatMap(unit => unit.lessons.map(lesson => [lesson.id, lesson.title])),
);
const CONTENT_TITLES = new Map([
  ...READINGS.map(item => [item.id, { title: item.titleZh || item.title, href: `#/reading/${item.id}` }]),
  ...LISTENING_PACKS.map(item => [item.id, { title: item.titleZh || item.title, href: `#/listening/${item.id}` }]),
]);

function sourceLink(source) {
  if (!source) return '';
  if (source.startsWith('lesson:')) {
    const lessonId = source.slice(7);
    return `<a class="wc-source" href="#/lesson/${esc(lessonId)}">${esc(LESSON_TITLES.get(lessonId) || '课程')} ›</a>`;
  }
  const hit = CONTENT_TITLES.get(source);
  if (!hit) return '';
  return `<a class="wc-source" href="${hit.href}">${esc(hit.title)} ›</a>`;
}

/** 语法点 ↔ 其余模块的接线：真实实例句 + 教到它的微步课 + 能练到它的读·听内容。 */
function renderLinkage(host, grammarId) {
  const examples = grammarExamples(grammarId);
  const lessons = grammarLessonRefs(grammarId).filter(id => LESSON_TITLES.has(id));
  const contents = grammarContentRefs(grammarId).filter(id => CONTENT_TITLES.has(id));
  if (!examples.length && !lessons.length && !contents.length) return;

  host.appendChild(el(`<h2 class="practice-title">在真实语境里见过它</h2>`));

  if (examples.length) {
    const card = el(`<div class="card"></div>`);
    examples.forEach(example => {
      const row = el(`<div class="example-row">
        <div style="flex:1">
          <div class="ex-de de">${esc(example.de)}</div>
          <div class="ex-zh">${esc(example.zh)}</div>
          <div class="p-result"></div>
          ${sourceLink(example.source)}
        </div>
      </div>`);
      const btns = el(`<div style="display:flex;gap:6px;flex-shrink:0"></div>`);
      btns.appendChild(audioBtn(example.de));
      btns.appendChild(micBtn(example.de, row.querySelector('.p-result')));
      row.appendChild(btns);
      card.appendChild(row);
    });
    host.appendChild(card);
  }

  if (lessons.length) {
    host.appendChild(el(`<p class="page-sub" style="margin-top:14px">练这条语法的微步课（${lessons.length} 节）</p>`));
    const wrap = el(`<div class="chip-row"></div>`);
    lessons.forEach(lessonId => wrap.appendChild(
      el(`<a class="chip" href="#/lesson/${esc(lessonId)}">${esc(LESSON_TITLES.get(lessonId))}</a>`)));
    host.appendChild(wrap);
  }

  if (contents.length) {
    host.appendChild(el(`<p class="page-sub" style="margin-top:14px">用得到它的精读精听（${contents.length} 份）</p>`));
    const wrap = el(`<div class="chip-row"></div>`);
    contents.forEach(contentId => {
      const hit = CONTENT_TITLES.get(contentId);
      wrap.appendChild(el(`<a class="chip" href="${hit.href}">${esc(hit.title)}</a>`));
    });
    host.appendChild(wrap);
  }
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
    if (sec.tip) body.appendChild(el(`<div class="tip"><b>提示</b> · ${esc(sec.tip)}</div>`));
  });
  host.appendChild(body);

  if (lesson.exercises?.length) {
    host.appendChild(el(`<h2 class="practice-title">练习</h2>`));
    const quizCard = el(`<div class="card"></div>`);
    renderQuiz(lesson.exercises, quizCard, (correct, total) => {
      const reward = markDone('grammar', id);
      toast(`练习完成：${correct}/${total}${reward ? ` · +${reward.xpDelta} XP` : ' · 已记录'}`);
    // 语法课以前不喂掌握度：练完 g08 情态动词，微步课里的 modal-* 强度纹丝不动。
    // 现在共用同一套 skills 标签，两边互相累积。
    }, ok => recordAnswer(lesson.skills || [], ok));
    host.appendChild(quizCard);
  }

  renderLinkage(host, id);

  if (idx < GRAMMAR_LESSONS.length - 1) {
    host.appendChild(el(`<a class="btn secondary block" style="margin-top:14px" href="#/grammar/${GRAMMAR_LESSONS[idx + 1].id}">下一课：${esc(GRAMMAR_LESSONS[idx + 1].title)} ›</a>`));
  }
}
