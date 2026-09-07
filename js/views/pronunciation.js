// 拼读 6 格：列表 + 卡片流。规格见 docs/learning-formats.md 第二节
//
// 旧版是可滚动的讲解文章 + 一个"标记本课完成"按钮，没有一道题，学不下去。
// 现在复用微步课外壳（进度条、一屏一个动作、答错重排队），讲解只剩每张卡上的一行 cue，
// 成段的规则表降级成课末可展开的参考资料——参考资料写长没关系，主路径不能长。
import { PRON_LESSONS, findPronLesson } from '../../data/pronunciation.js';
import { runLessonShell } from '../lesson-shell.js';
import { el, esc, icon } from '../ui.js';
import { allLessonStates } from '../storage.js?v=4';
import { lessonMastery } from '../mastery.js';

export function renderPron(host, id) {
  if (id) return renderLesson(host, id);

  host.appendChild(el(`<header class="page-head">
    <span class="eyebrow">AUSSPRACHE · 入门解码课</span>
    <h1 class="page-title">一次通关，见词能读</h1>
    <p class="page-sub">德语拼写和读音一一对应，规则总共不到 30 条——所以德语词典一般不标音标。六关约 40 分钟，走完你能读出任何生词、听到生词能拼出来。中途退出会记住进度。</p>
  </header>`));

  // 完成状态必须读 lesson 状态：runLessonShell 写的是 setLessonState，
  // 而旧版列表读的是 module/id 那套独立存储——两边不通，完成勾永远不会出现。
  const states = allLessonStates();

  // 主路径只有一个动作：接着上次那一关往下走。下面的列表是地图，不是入口。
  const doneCount = PRON_LESSONS.filter(lesson => states[lesson.id]?.done).length;
  const nextLesson = PRON_LESSONS.find(lesson => !states[lesson.id]?.done);
  host.appendChild(el(nextLesson
    ? `<a class="btn block" style="margin-bottom:16px" href="#/pron/${nextLesson.id}">${doneCount ? `继续通关 · ${esc(nextLesson.title)}` : '开始通关 · 约 40 分钟'} ›</a>`
    : `<a class="btn block" style="margin-bottom:16px" href="#/panorama">六关全部通关 ✓ 去全景图看看 ›</a>`));

  PRON_LESSONS.forEach((lesson, index) => {
    const done = !!states[lesson.id]?.done;
    const mastery = lessonMastery(lesson);
    const cards = lesson.steps.length;
    host.appendChild(el(`<a class="list-item" href="#/pron/${lesson.id}">
      <span class="li-icon">${done ? icon('check') : `${index + 1}`}</span>
      <div class="li-main">
        <div class="li-title">${esc(lesson.title)}</div>
        <div class="li-sub">${esc(lesson.sub)} · ${cards} 张卡${mastery > 0 ? ` · 掌握度 ${mastery}%` : ''}</div>
      </div>
      <span class="li-arrow">${icon('arrow')}</span>
    </a>`));
  });

  host.appendChild(el(`<div class="source-card">这六关同时是 A1 全景图最上面一行，通关会在<a href="#/panorama">全景图</a>上亮起。</div>`));
}

/** 规则表：成段讲解的归宿。默认折叠，是回头查的参考，不是学习路径。 */
function ruleCard(lesson) {
  if (!lesson.rule) return null;
  const wrap = el(`<details class="rule-details">
    <summary>${icon('book')} 这一关的规则表（随时回来查）</summary>
  </details>`);
  const table = el(`<table class="gram-table"></table>`);
  table.appendChild(el(`<tr>${lesson.rule.head.map(head => `<th>${esc(head)}</th>`).join('')}</tr>`));
  lesson.rule.rows.forEach(row =>
    table.appendChild(el(`<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`)));
  const scroller = el(`<div class="gram-table-wrap"></div>`);
  scroller.appendChild(table);
  wrap.appendChild(scroller);
  return wrap;
}

function renderLesson(host, id) {
  const lesson = findPronLesson(id);
  if (!lesson) { location.hash = '#/pron'; return; }

  const index = PRON_LESSONS.findIndex(item => item.id === id);
  const next = PRON_LESSONS[index + 1];

  runLessonShell(host, lesson, {
    onExit: () => { location.hash = '#/pron'; },
    onComplete: () => {
      host.innerHTML = '';
      host.appendChild(el(`<div class="lesson-done" style="margin-top:48px">
        <div class="completion-seal">${icon('trophy')}</div>
        <span class="eyebrow">AUSSPRACHE</span>
        <h2>${esc(lesson.title)} 完成</h2>
        <p class="meta">${esc(lesson.sub)}</p>
      </div>`));
      const rule = ruleCard(lesson);
      if (rule) host.appendChild(rule);
      host.appendChild(el(`<a class="btn block" style="margin-top:14px" href="${next ? `#/pron/${next.id}` : '#/panorama'}">${next ? `下一关：${esc(next.title)} ›` : '六关通关，去全景图看看 ›'}</a>`));
      host.appendChild(el(`<a class="btn secondary block" style="margin-top:10px" href="#/pron">回到关卡地图</a>`));
    },
  });
}
