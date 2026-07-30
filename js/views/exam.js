// 单个题型的加练页（#/exam/<格子id>）。
//
// 这不是主路径。主路径上考试题只有两种出现方式：每日小测跟着今日文章走，
// 阶段测验每 5 格来一次。这一页是"我知道自己哪个题型虚，想专门再刷一遍"的入口，
// 只从全景图题型轴进得来，首页永远看不到它——首页只有一条路。
import { el, esc, icon, motionIn } from '../ui.js';
import { EXAM_CELLS, bandOf } from '../../data/panorama.js';
import { tasksForCell, examPart } from '../../data/exam.js';
import { examStrength, examSeen, examTaskReady } from '../exam.js';
import { mainlineProgress } from '../mainline.js';
import { allLessonStates, loadExam, loadSkills } from '../storage.js';
import { runExamShell } from '../exam-shell.js';

export function renderExam(host, cellId) {
  const cell = EXAM_CELLS.find(item => item.id === cellId);
  if (!cell) {
    host.appendChild(el(`<div class="empty-hint">没有这个题型</div>`));
    return;
  }
  const skills = loadSkills();
  const { done: cellsDone } = mainlineProgress(allLessonStates(), skills);
  const state = loadExam();
  const part = examPart(cellId) || {};
  const tasks = tasksForCell(cellId);
  const strength = examStrength(cellId, state);
  const band = bandOf(strength);

  host.appendChild(el(`<a class="back-link" href="#/panorama">‹ 全景图</a>`));
  host.appendChild(el(`<header class="exam-hero">
    <span class="eyebrow">PRÜFUNGSFORMAT · ${esc(cellId)}</span>
    <h1>${esc(cell.title)}</h1>
    <p class="meta">${esc(cell.sub || '')}${part.points ? ` · 真考试 ${part.count} 题 ${part.points} 分` : ''}</p>
    <div class="exam-hero-strength band-${band.key}">
      <b>${strength}%</b><span>题型熟练度 · ${esc(band.label)} · 练过 ${examSeen(cellId, state)} 道</span>
    </div>
  </header>`));

  if (!tasks.length) {
    host.appendChild(el(`<div class="empty-hint">这个题型还没有题库。全景图上它标的就是"还没有"，不是藏起来了。</div>`));
    return;
  }

  const list = el(`<div class="exam-list"></div>`);
  tasks.forEach(task => {
    const record = (state.tasks || {})[task.id];
    const ready = examTaskReady(task, cellsDone, skills);
    const need = task.prereq?.afterCell || 0;
    const row = el(`<button class="card exam-task${ready ? '' : ' is-locked'}" type="button">
      <div class="exam-task-title">${esc(task.titleZh)}</div>
      <div class="exam-task-sub">${esc(task.subZh || '')}</div>
      <div class="exam-task-meta">${ready
        ? (record ? `练过 ${record.done} 次 · 上次 ${record.lastScore}/${record.lastTotal}` : '还没做过')
        : `走到主线第 ${need} 格再来 —— 现在做只会得到"我不行"这个结论`}</div>
      ${ready ? `<span class="exam-task-go">${icon('arrow')}</span>` : ''}
    </button>`);
    if (ready) {
      row.addEventListener('click', () => {
        host.innerHTML = '';
        runExamShell(host, task, {
          onExit: () => { host.innerHTML = ''; renderExam(host, cellId); },
          onComplete: () => { host.innerHTML = ''; renderExam(host, cellId); },
        });
      });
    } else {
      row.disabled = true;
    }
    list.appendChild(row);
  });
  host.appendChild(list);
  motionIn(list, { y: 12 });
}
