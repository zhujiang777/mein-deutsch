// 考试题外壳。产品形态见 docs/product-shape.md 第 6 条决策。
//
// 为什么不直接用 runLessonShell —— 四处冲突，而且每一处都是"记账口径"不同，
// 不是渲染不同：
//   1. 微步课答错会把那一步排回队尾让你重做到对。考试要的是"记下来明天再见"，
//      当场重做会把首答成绩变成安慰剂。
//   2. 微步课完成写 md.lessons.v1。那是 allLessonStates() 的来源，被主线引擎和
//      readiness 读；把 daily-quiz 这种非课表 id 塞进去是污染。
//   3. 微步课完成算 logActivity({lessons:1})，两道判断题给"完成一节课"的 XP 是通胀。
//   4. 结算屏的口径不同：考试要说"2 题对 1 · 错的那道明天会再出现"。
//
// 渲染完全复用：renderExercise 一行不改，CSS 类名全部沿用 lesson-shell 的，
// 所以样式表和 tests/ui-coverage.test.mjs 的选择器清单都不用动。
import { el, esc, haptic, icon, motionIn, rewardBurst, setProgress } from './ui.js';
import { speak, stopSpeak } from './speech.js';
import { renderExercise } from './exercises.js?v=5';
import { recordAnswer, addExamMiss } from './mastery.js';
import { recordExamAnswer, recordExamTask, examStrength } from './exam.js';
import { logActivity, rewardSummary } from './storage.js';

/**
 * 跑一组考试题。
 * runExamShell(host, task, { onExit, onComplete({correct,total}), feedback })
 *
 * task = { id, cellId, titleZh, subZh?, skills?, items: [renderExercise 能吃的对象] }
 * feedback: 'immediate' 每题当场给反馈（散题练习）
 *           'deferred'  做完统一批改（毕业模考，第 5f 步用）
 */
export function runExamShell(host, task, { onExit, onComplete, feedback = 'immediate' } = {}) {
  const items = Array.isArray(task?.items) ? task.items : [];
  if (!items.length) { host.appendChild(el(`<p class="empty-hint">这组题还没有内容</p>`)); return; }

  document.body.classList.add('immersive');
  const cleanup = () => document.body.classList.remove('immersive');

  const before = examStrength(task.cellId);
  let pos = 0;
  let correctCount = 0;
  const answered = [];

  const shell = el(`<div class="lesson-shell">
    <div class="lesson-top">
      <button class="lesson-x" aria-label="退出"><span>✕</span></button>
      <div class="lesson-progress" role="progressbar" aria-label="考试题进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div></div></div>
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

  // 考试题没有断点续学：一组两三道题，中途退出下次重来才是对的口径。
  shell.querySelector('.lesson-x').addEventListener('click', () => {
    cleanup();
    stopSpeak();
    onExit?.();
  });

  function showItem() {
    stage.innerHTML = '';
    bottom.innerHTML = '';
    stopSpeak();
    setProgress(progressBar, pos / items.length);
    if (pos >= items.length) return finish();

    const item = items[pos];
    counter.textContent = `${pos + 1}/${items.length}`;
    if (pos === 0 && task.titleZh) {
      stage.appendChild(el(`<div class="exam-head">
        <span class="eyebrow">PRÜFUNGSFORMAT · 考试题型</span>
        <div class="exam-head-title">${esc(task.titleZh)}</div>
        ${task.subZh ? `<div class="exam-head-sub">${esc(task.subZh)}</div>` : ''}
      </div>`));
    }

    renderExercise(stage, item, {
      onSubmit: (correct, correctText) => {
        const index = pos;
        if (correct !== null) {
          if (correct) correctCount += 1;
          recordAnswer(item.skills || task.skills || [], correct);
          recordExamAnswer(task.cellId, correct);
          // 答错不重排队 —— 进 x: 池，明天再见。
          if (!correct) addExamMiss(task.id, index);
        }
        answered.push({ index, correct, correctText });

        if (feedback === 'deferred') { pos++; showItem(); return; }
        const bar = el(`<div class="feedback ${correct === false ? 'bad' : 'good'}">
          <span class="feedback-mark">${icon(correct === false ? 'arrow' : 'check')}</span>
          <div class="feedback-text">
            <b>${correct === false ? '这道错了' : correct === null ? '已跳过' : '回答正确'}</b>
            ${correct === false ? `<div class="feedback-ans">正确答案：<span class="de">${esc(correctText)}</span></div>` : ''}
            ${item.explain ? `<div class="feedback-explain">${esc(item.explain)}</div>` : ''}
          </div>
          ${correct === true ? '<span class="feedback-xp">+2 XP</span>' : ''}
          <button class="btn ${correct === false ? 'feedback-btn-bad' : ''}" aria-label="继续">${icon('arrow')}</button>
        </div>`);
        bar.querySelector('button').addEventListener('click', () => { pos++; showItem(); });
        bottom.appendChild(bar);
        motionIn(bar, { y: 10 });
        if (correct === true) rewardBurst(stage, '+2 XP');
        else if (correct === false) haptic('error');
      },
    });
    motionIn(stage, { x: 14, y: 0 });
  }

  function finish() {
    const total = items.length;
    recordExamTask(task.id, { correct: correctCount, total });
    // 按题计 XP，不传 lessons —— 这不是"完成一节课"。
    const reward = logActivity({ items: total, ok: correctCount });
    const after = examStrength(task.cellId);
    const wrong = total - correctCount;
    cleanup();
    stage.innerHTML = '';
    bottom.innerHTML = '';
    stage.appendChild(el(`<div class="lesson-done">
      <div class="completion-seal">${icon('check')}</div>
      <span class="eyebrow">PRÜFUNGSFORMAT</span>
      <h2>${esc(task.titleZh || '考试题')}</h2>
      <div class="completion-stats">
        <div><b>${correctCount}<i>/${total}</i></b><span>答对</span></div>
        <div><b>+${reward.xpDelta}</b><span>获得 XP</span></div>
        <div><b>${before} → ${after}</b><span>这个题型的强度</span></div>
      </div>
      <p class="meta">${wrong ? `错的 ${wrong} 道明天会再出现一次。` : '这个题型你已经稳了，继续保持。'}</p>
    </div>`));
    const btn = el(`<button class="btn block">继续</button>`);
    btn.addEventListener('click', () => onComplete?.({ correct: correctCount, total }));
    bottom.appendChild(btn);
    motionIn(stage, { y: 18 });
    haptic('success');
  }

  showItem();
}
