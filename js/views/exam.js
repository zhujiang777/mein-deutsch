// 单个题型的加练页（#/exam/<格子id>）。
//
// 这不是主路径。主路径上考试题只有两种出现方式：每日小测跟着今日文章走，
// 阶段测验每 5 格来一次。这一页是"我知道自己哪个题型虚，想专门再刷一遍"的入口，
// 只从全景图题型轴进得来，首页永远看不到它——首页只有一条路。
import { el, esc, icon, motionIn, toast } from '../ui.js';
import { EXAM_CELLS, bandOf } from '../../data/panorama.js';
import { tasksForCell, examPart, DYNAMIC_CELLS } from '../../data/exam.js';
import {
  P1_FIELDS, getProfile, saveProfile, profileComplete, buildP1Task, introSentences,
} from '../exam-p1.js';
import { examStrength, examSeen, examTaskReady } from '../exam.js';
import { mainlineProgress } from '../mainline.js';
import { allLessonStates, loadExam, loadSkills } from '../storage.js?v=4';
import { runExamShell } from '../exam-shell.js';

/**
 * P1 专属：先填自己的档案，再用它拼出考题。
 * 档案存在 md.settings.v1 里，所以它会跟着进度一起同步到 Gist —— 界面上说清楚，
 * 这是真人信息，不能让人在不知情的情况下同步出去。
 */
function renderProfileP1(host, cellId) {
  const profile = { ...getProfile() };
  const form = el(`<section class="card p1-form">
    <div class="p1-form-head">
      <b>先填一次你自己的信息</b>
      <p class="meta">P1 说的就是你自己 —— 这七项填完，题目会用它们拼成你考场上要说的那几句。
      国家 / 语言 / 职业 / 爱好请填<b>德语词</b>。</p>
    </div>
    <div class="p1-grid">${P1_FIELDS.map(field => `<label>
      <span>${esc(field.label)}<i>${esc(field.de)}</i></span>
      <input data-key="${field.key}" type="text" autocapitalize="off" autocomplete="off"
        placeholder="${esc(field.example)}" value="${esc(profile[field.key] || '')}">
    </label>`).join('')}</div>
    <p class="p1-privacy">这些是真人信息。它存在应用设置里，会跟着学习进度一起同步到你自己的 Gist。</p>
    <button class="btn block" type="button">保存，生成我的口语题</button>
  </section>`);
  host.appendChild(form);

  const preview = el(`<div class="p1-preview"></div>`);
  host.appendChild(preview);

  const paint = () => {
    preview.innerHTML = '';
    const task = buildP1Task(profile);
    if (!task) {
      preview.appendChild(el(`<div class="empty-hint">九项都填上，题目就出来了。缺一项就拼不出完整的自我介绍。</div>`));
      return;
    }
    preview.appendChild(el(`<div class="exam-doc">
      <div class="exam-doc-title">你的自我介绍 · 考场上要说的就是这七句</div>
      <div class="exam-doc-body de">${esc(introSentences(profile).join('\n'))}</div>
    </div>`));
    // 这几句是按你的信息现拼的，不在预生成音频库里——和今日文章同一个已知限制，说清楚。
    preview.appendChild(el(`<p class="p1-privacy">这几句是现拼的，没有预录的标准音，「听标准」用的是设备合成音。</p>`));
    const go = el(`<button class="btn block" type="button">开始练（说三段：介绍 · 拼姓 · 报号码）</button>`);
    go.addEventListener('click', () => {
      host.innerHTML = '';
      runExamShell(host, task, {
        onExit: () => { host.innerHTML = ''; renderExam(host, cellId); },
        onComplete: () => { host.innerHTML = ''; renderExam(host, cellId); },
      });
    });
    preview.appendChild(go);
  };

  form.querySelector('button').addEventListener('click', () => {
    form.querySelectorAll('input').forEach(input => {
      profile[input.dataset.key] = input.value.trim();
    });
    saveProfile(profile);
    toast(profileComplete(profile) ? '已保存' : '还有没填的');
    paint();
  });
  paint();
  motionIn(form, { y: 12 });
}

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

  // P1 的题用你自己的信息现拼，所以这一格先要有档案。
  if (DYNAMIC_CELLS.has(cellId)) {
    renderProfileP1(host, cellId);
    return;
  }

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
