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
import { logActivity, rewardSummary } from './storage.js?v=4';

/**
 * 一块考试材料（邮件 / 通知 / 告示牌 / 表格说明）。
 * 中文默认收起：真考试没有译文，先自己读一遍才有意义；读不动再展开，
 * 不是把翻译摆在旁边让人顺着看。
 */
function docBlock({ layout = 'mail', title = '', de = '', zh = '' } = {}) {
  return el(`<div class="exam-doc exam-doc-${esc(layout)}">
    ${title ? `<div class="exam-doc-title">${esc(title)}</div>` : ''}
    <div class="exam-doc-body de">${esc(de)}</div>
    ${zh ? `<details class="exam-doc-zh"><summary>看中文</summary><div>${esc(zh)}</div></details>` : ''}
  </div>`);
}

/**
 * 一道题自带的材料：可能是一块（告示牌），也可能是并排两块（L2 的 a / b 两个来源）。
 */
function itemDocs(stimulus) {
  return Array.isArray(stimulus) ? stimulus : stimulus ? [stimulus] : [];
}

/**
 * S2 短信写作：**全场唯一一道机器判不了的题**。
 *
 * 这一版是离线自评：写 → 看范文 → 自己对着三条标准打勾。为什么不先接 AI 批改：
 * 写作要等 AI 才能练，等于把唯一一道最该天天写的题变成了「联网才能做」。
 * 自评版任何时候都能用，AI 批改是它的增强，不是它的前提。
 *
 * 三条标准照搬官方评分维度：三个要点写全 / 有称呼与结尾 / 语言在 A1 范围内。
 * 判定权在学的人手上 —— 机械规则担保不了作文对不对，别假装能。
 */
function renderWrite(host, item, ctx) {
  const min = item.minWords || 25;
  host.appendChild(el(`<div class="ex-prompt"><div class="ex-q">${esc(item.prompt)}</div></div>`));
  host.appendChild(el(`<ul class="write-points">${(item.points || [])
    .map(point => `<li><b>${esc(point.de)}</b><span>${esc(point.zh)}</span></li>`).join('')}</ul>`));

  const pad = el(`<div class="write-pad">
    <textarea class="write-input" rows="7" placeholder="Liebe/r …" spellcheck="false"></textarea>
    <div class="write-count">0 个词 · 目标约 ${min} 词</div>
    <button class="btn block" type="button">写完了，看范文</button>
  </div>`);
  const input = pad.querySelector('textarea');
  const count = pad.querySelector('.write-count');
  const submit = pad.querySelector('button');
  const words = () => (input.value.match(/[\p{L}\p{N}]+/giu) || []).length;
  input.addEventListener('input', () => {
    count.textContent = `${words()} 个词 · 目标约 ${min} 词`;
  });
  host.appendChild(pad);
  setTimeout(() => input.focus(), 100);

  submit.addEventListener('click', () => {
    if (host.dataset.done) return;
    if (!words()) { input.focus(); return; }
    host.dataset.done = '1';
    input.disabled = true;
    submit.remove();

    const enough = words() >= min;
    const review = el(`<div class="write-review">
      <div class="exam-doc">
        <div class="exam-doc-title">参考范文 · 不是标准答案</div>
        <div class="exam-doc-body de">${esc(item.model?.de || '')}</div>
        <details class="exam-doc-zh"><summary>看中文</summary><div>${esc(item.model?.zh || '')}</div></details>
      </div>
      <div class="write-check">
        <div class="write-check-head">对着这三条给自己打勾 —— 真考试就是按这三条给分</div>
        ${['三个要点都写到了', '有称呼，也有结尾问候', '句子都是简单句，没用 weil / dass 这类从句']
          .map((label, index) => `<label><input type="checkbox" data-i="${index}"><span>${esc(label)}</span></label>`).join('')}
        <div class="write-check-words${enough ? ' is-ok' : ''}">${enough
          ? `字数够了（${words()} 词）`
          : `只有 ${words()} 词，真考试要约 ${min} 词 —— 字数不够会直接扣分`}</div>
      </div>
      <button class="btn block" type="button">记下我的自评</button>
    </div>`);
    host.appendChild(review);
    review.querySelector('button').addEventListener('click', () => {
      const ticked = [...review.querySelectorAll('input')].filter(box => box.checked).length;
      ctx.onSubmit(ticked === 3 && enough, '');
    });
  });
}

/** 写作题没有"正确答案"这回事，反馈条的口径要跟着换。 */
function writeFeedback(correct) {
  return correct
    ? '<b>三条都达标</b><div class="feedback-explain">照这个标准写，S2 这 10 分是拿得到的。</div>'
    : '<b>还有没达标的</b><div class="feedback-explain">哪条没打勾，下次写的时候就先补哪条。范文可以往回翻。</div>';
}

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

    // 材料：整组共用的（一封信）每道题都重铺一次，真考试里那张纸也一直在眼前；
    // 每题自带的（一块告示牌）只跟着自己那道题走。
    (task.stimulus || []).forEach(block => stage.appendChild(docBlock(block)));
    const docs = itemDocs(item.stimulus);
    if (docs.length > 1) {
      // L2 的两个来源要并排看得见，题目问的就是"这两条里哪一条合你的需求"。
      const pair = el(`<div class="exam-doc-pair"></div>`);
      docs.forEach(block => pair.appendChild(docBlock(block)));
      stage.appendChild(pair);
    } else {
      docs.forEach(block => stage.appendChild(docBlock(block)));
    }

    const render = item.type === 'write' ? renderWrite : renderExercise;
    render(stage, item, {
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
            ${item.type === 'write' ? writeFeedback(correct) : `
            <b>${correct === false ? '这道错了' : correct === null ? '已跳过' : '回答正确'}</b>
            ${correct === false ? `<div class="feedback-ans">正确答案：<span class="de">${esc(correctText)}</span></div>` : ''}
            ${item.explain ? `<div class="feedback-explain">${esc(item.explain)}</div>` : ''}`}
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
    // 口语题没录音就走"跳过"（correct === null）。跳过不是答错：它没进错题池，
    // 也没扣题型强度，结算屏就不能说"错了 N 道"。
    const graded = answered.filter(entry => entry.correct !== null).length;
    const wrong = graded - correctCount;
    const skipped = total - graded;
    cleanup();
    stage.innerHTML = '';
    bottom.innerHTML = '';
    stage.appendChild(el(`<div class="lesson-done">
      <div class="completion-seal">${icon('check')}</div>
      <span class="eyebrow">PRÜFUNGSFORMAT</span>
      <h2>${esc(task.titleZh || '考试题')}</h2>
      <div class="completion-stats">
        <div><b>${correctCount}<i>/${graded || total}</i></b><span>答对</span></div>
        <div><b>+${reward.xpDelta}</b><span>获得 XP</span></div>
        <div><b>${before} → ${after}</b><span>这个题型的强度</span></div>
      </div>
      <p class="meta">${wrong ? `错的 ${wrong} 道明天会再出现一次。`
        : !graded ? '这一组没有录音，所以没有分。口语题只有开口才算练过。'
        : after >= 70 ? '这个题型你已经稳了，继续保持。'
        : '全对。这个题型的强度要多练几组才上得来，一次全对还说明不了什么。'}
        ${skipped && graded ? `另有 ${skipped} 道跳过了，跳过不算错，也不算练过。` : ''}</p>
    </div>`));
    const btn = el(`<button class="btn block">继续</button>`);
    btn.addEventListener('click', () => onComplete?.({ correct: correctCount, total }));
    bottom.appendChild(btn);
    motionIn(stage, { y: 18 });
    haptic('success');
  }

  showItem();
}
