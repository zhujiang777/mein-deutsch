// 微步课播放器：一步一屏，答错重排队，断点续学，完成结算
import { el, esc, audioBtn, haptic, icon, motionIn, rewardBurst, setProgress } from '../ui.js';
import { speak, stopSpeak } from '../speech.js';
import { renderExercise } from '../exercises.js?v=2';
import { recordAnswer, addMistake } from '../mastery.js';
import { getLessonState, setLessonState, logActivity, rewardSummary } from '../storage.js';
import { findLesson } from '../../data/course.js';

const EXERCISE_TYPES = new Set(['choice', 'listenChoice', 'assemble', 'dictation', 'fill', 'match', 'translate', 'speak', 'scene', 'observe', 'reproduce', 'roleplay']);
// 展示/角色步：走 renderExercise 但不计分、不弹反馈条，onSubmit 后直接进下一步
const DISPLAY_TYPES = new Set(['scene', 'roleplay']);

/* 信息类步骤（teach / example / recap）渲染 */
function renderInfoStep(host, step) {
  const card = el(`<div class="step-info"></div>`);
  if (step.h) card.appendChild(el(`<h2 class="step-h">${esc(step.h)}</h2>`));
  if (step.p) step.p.split('\n').forEach(t => card.appendChild(el(`<p class="step-p">${esc(t)}</p>`)));
  if (step.table) {
    const wrap = el(`<div class="gram-table-wrap"></div>`);
    const table = el(`<table class="gram-table"></table>`);
    table.appendChild(el(`<tr>${step.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`));
    step.table.rows.forEach(r => table.appendChild(el(`<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`)));
    wrap.appendChild(table);
    card.appendChild(wrap);
  }
  if (step.example) {
    const exRow = el(`<div class="step-example">
      <div class="step-ex-de de">${esc(step.example.de)}</div>
      <div class="step-ex-zh">${esc(step.example.zh)}</div>
      ${step.example.note ? `<div class="step-ex-note">💡 ${esc(step.example.note)}</div>` : ''}
      <div class="step-ex-audio"></div>
    </div>`);
    const btns = exRow.querySelector('.step-ex-audio');
    btns.appendChild(audioBtn(step.example.de));
    btns.appendChild(audioBtn(step.example.de, { slow: true }));
    card.appendChild(exRow);
    setTimeout(() => speak(step.example.de), 300);
  }
  if (step.tip) card.appendChild(el(`<div class="tip">💡 ${esc(step.tip)}</div>`));
  host.appendChild(card);
}

/**
 * 运行一节微步课。
 * runLesson(host, lessonId, { onExit(pos), onComplete({correct,total}) })
 */
export function runLesson(host, lessonId, { onExit, onComplete } = {}) {
  const lesson = findLesson(lessonId);
  if (!lesson) { host.appendChild(el(`<p class="empty-hint">课程不存在</p>`)); return; }

  document.body.classList.add('immersive');
  const cleanup = () => document.body.classList.remove('immersive');

  // 队列：初始为所有步骤索引；答错的练习复制到队尾（只算首次成绩）
  const queue = lesson.steps.map((_, i) => i);
  const saved = getLessonState(lessonId);
  let pos = 0;
  if (saved && !saved.done && saved.step > 0 && saved.step < lesson.steps.length) {
    pos = saved.step;
  }
  let firstTotal = 0, firstCorrect = 0;
  const attempted = new Set(); // 首答过的原始步骤

  const shell = el(`<div class="lesson-shell">
    <div class="lesson-top">
      <button class="lesson-x" aria-label="退出"><span>✕</span></button>
      <div class="lesson-progress" role="progressbar" aria-label="课程进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div></div></div>
      <span class="lesson-counter"></span>
      <span class="lesson-xp">${icon('star')} ${rewardSummary().totalXp}</span>
    </div>
    <div class="lesson-stage"></div>
    <div class="lesson-bottom"></div>
  </div>`);
  host.appendChild(shell);
  const stage = shell.querySelector('.lesson-stage');
  const bottom = shell.querySelector('.lesson-bottom');
  const progressBar = shell.querySelector('.lesson-progress > div');
  const counter = shell.querySelector('.lesson-counter');

  shell.querySelector('.lesson-x').addEventListener('click', () => {
    // 保存断点：下一个未完成的原始步骤
    const nextOriginal = queue[pos] ?? lesson.steps.length;
    setLessonState(lessonId, { step: Math.min(nextOriginal, lesson.steps.length - 1) });
    cleanup();
    stopSpeak();
    onExit?.();
  });

  function showStep() {
    stage.innerHTML = '';
    bottom.innerHTML = '';
    stopSpeak();
    setProgress(progressBar, pos / queue.length);

    if (pos >= queue.length) return finish();
    const stepIdx = queue[pos];
    const step = lesson.steps[stepIdx];
    counter.textContent = `${Math.min(pos + 1, queue.length)}/${queue.length}`;

    if (!EXERCISE_TYPES.has(step.type)) {
      renderInfoStep(stage, step);
      const btn = el(`<button class="btn block">继续</button>`);
      btn.addEventListener('click', () => { pos++; showStep(); });
      bottom.appendChild(btn);
      motionIn(stage, { x: 14, y: 0 });
      return;
    }

    renderExercise(stage, step, {
      onSubmit: (correct, correctText) => {
        if (DISPLAY_TYPES.has(step.type)) { pos++; showStep(); return; }
        const isFirst = !attempted.has(stepIdx);
        if (correct !== null) {
          if (isFirst) {
            attempted.add(stepIdx);
            firstTotal++;
            if (correct) firstCorrect++;
            recordAnswer(step.skills || lesson.skills || [], correct);
            if (!correct) addMistake(lessonId, stepIdx);
          }
          if (!correct) queue.push(stepIdx); // 答错重排队尾，直到做对
        }
        const bar = el(`<div class="feedback ${correct === false ? 'bad' : 'good'}">
          <span class="feedback-mark">${icon(correct === false ? 'arrow' : 'check')}</span>
          <div class="feedback-text">
            <b>${correct === false ? '再看一次' : correct === null ? '已跳过' : '回答正确'}</b>
            ${correct === false ? `<div class="feedback-ans">正确答案：<span class="de">${esc(correctText)}</span></div>` : ''}
            ${step.explain ? `<div class="feedback-explain">${esc(step.explain)}</div>` : ''}
          </div>
          ${correct === true ? '<span class="feedback-xp">+2 XP</span>' : ''}
          <button class="btn ${correct === false ? 'feedback-btn-bad' : ''}" aria-label="继续">${icon('arrow')}</button>
        </div>`);
        bar.querySelector('button').addEventListener('click', () => { pos++; showStep(); });
        bottom.appendChild(bar);
        motionIn(bar, { y: 10 });
        if (correct === true) rewardBurst(stage, '+2 XP');
        else if (correct === false) haptic('error');
        if (correct === false && correctText && !correctText.includes('=')) speak(correctText);
      },
    });
    motionIn(stage, { x: 14, y: 0 });
  }

  function finish() {
    setLessonState(lessonId, { done: true, step: 0, score: firstTotal ? Math.round(100 * firstCorrect / firstTotal) : 100 });
    const reward = logActivity({ items: firstTotal, ok: firstCorrect, lessons: 1, completionId: `lesson:${lessonId}` });
    cleanup();
    stage.innerHTML = '';
    bottom.innerHTML = '';
    const pct = firstTotal ? Math.round(100 * firstCorrect / firstTotal) : 100;
    stage.appendChild(el(`<div class="lesson-done">
      <div class="completion-seal">${icon('trophy')}</div>
      <span class="eyebrow">STATION COMPLETE</span>
      <h2>完成《${esc(lesson.title)}》</h2>
      <div class="completion-stats"><div><b>${pct}%</b><span>正确率</span></div><div><b>+${reward.xpDelta}</b><span>获得 XP</span></div><div><b>${reward.level}</b><span>当前等级</span></div></div>
      <p class="meta">${pct < 70 ? '错题会进入明天的巩固路线。' : reward.goalReached ? '今天的学习目标已经完成。' : '下一站已经点亮。'}</p>
    </div>`));
    const btn = el(`<button class="btn block">继续</button>`);
    btn.addEventListener('click', () => onComplete?.({ correct: firstCorrect, total: firstTotal }));
    bottom.appendChild(btn);
    motionIn(stage, { y: 18 });
    haptic('success');
  }

  showStep();
}

/* 独立路由入口 #/lesson/<id> */
export function renderLessonRoute(host, id) {
  runLesson(host, id, {
    onExit: () => { location.hash = '#/path'; },
    onComplete: () => { location.hash = '#/path'; },
  });
}
