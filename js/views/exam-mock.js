// 毕业模考（#/exam/mock）：笔试整套 65 分钟，中间不给反馈，交卷后统一批改。
//
// 它只回答一个问题：**现在去考能不能过**。所以和平时的加练有三处不一样：
//   1. 逐题不给对错（feedback:'deferred'）—— 边做边知道答案，测不出真实水平
//   2. 八格一口气做完，中间不能停下来查
//   3. 结算给的是"各部分得分 + 60% 那条线"，不是"你真棒"
//
// 入口只在全景图题型轴底部，**不上首页**：首页永远只有一条路。
import { el, esc, icon, motionIn } from '../ui.js';
import { EXAM_TIMING } from '../../data/panorama.js';
import { examPart } from '../../data/exam.js';
import {
  PASS_RATIO, MOCK_UNLOCK_CELL, MOCK_UNLOCK_STRENGTH,
  mockUnlock, buildMockExam, scoreMock, recordMock, examStrength,
} from '../exam.js';
import { mainlineProgress } from '../mainline.js';
import { allLessonStates, loadExam, loadSkills } from '../storage.js';
import { runExamShell } from '../exam-shell.js';

/** 笔试总时长（分钟）：听 20 + 读 25 + 写 20 = 65。口试单独一场，不叠进来。 */
const WRITTEN_MINUTES = EXAM_TIMING.hoeren + EXAM_TIMING.lesen + EXAM_TIMING.schreiben;

const PART_LABEL = { hoeren: '听 Hören', lesen: '读 Lesen', schreiben: '写 Schreiben' };

export function renderExamMock(host) {
  const state = loadExam();
  const { done: cellsDone } = mainlineProgress(allLessonStates(), loadSkills());
  const gate = mockUnlock(cellsDone, state);

  host.appendChild(el(`<a class="back-link" href="#/panorama">‹ 全景图</a>`));
  host.appendChild(el(`<header class="exam-hero">
    <span class="eyebrow">ABSCHLUSSPRÜFUNG · 毕业模考</span>
    <h1>笔试整套 · ${WRITTEN_MINUTES} 分钟</h1>
    <p class="meta">听 ${EXAM_TIMING.hoeren} + 读 ${EXAM_TIMING.lesen} + 写 ${EXAM_TIMING.schreiben} 分钟，中间不停。
    逐题不给对错，交卷后统一批改。口试 ${EXAM_TIMING.sprechen} 分钟是单独一场，去题型轴的 P1–P3 各练。</p>
  </header>`));

  if (!gate.ok) {
    host.appendChild(el(`<div class="card mock-gate">
      <b>还没到能模考的时候</b>
      <ul>
        ${gate.cellsLeft ? `<li>主线还差 <b>${gate.cellsLeft}</b> 格（要走到第 ${MOCK_UNLOCK_CELL} 格）</li>` : ''}
        ${gate.weakCells.length ? `<li>还有 <b>${gate.weakCells.length}</b> 个题型没练到 ${MOCK_UNLOCK_STRENGTH}：${
          gate.weakCells.map(id => `<a href="#/exam/${esc(id)}">${esc(id)} ${examStrength(id, state)}%</a>`).join('、')
        }</li>` : ''}
      </ul>
      <p class="meta">没练过的题型混进模考，出来的分数说明不了任何事。先把上面这些补上，
      这一场才有意义。</p>
    </div>`));
    return;
  }

  const tasks = buildMockExam({ state });
  host.appendChild(el(`<div class="card mock-brief">
    <b>这一套：${tasks.length} 个部分，共 ${tasks.reduce((sum, task) => sum + task.items.length, 0)} 题</b>
    <p class="meta">开始之后中途退出这一场就作废，和真考试一样。准备好再点。</p>
  </div>`));
  const start = el(`<button class="btn block" type="button">开始模考 ${icon('arrow')}</button>`);
  start.addEventListener('click', () => runMock(host, tasks));
  host.appendChild(start);

  const history = (state.mocks || []).slice().reverse();
  if (history.length) {
    host.appendChild(el(`<div class="section-label">过去几次</div>`));
    host.appendChild(el(`<div class="exam-list">${history.map(row => `<div class="card exam-task">
      <div class="exam-task-title">${row.earned} / ${row.points} 分 · ${row.pass ? '过线' : '没过线'}</div>
      <div class="exam-task-meta">${new Date(row.at).toLocaleDateString('zh-CN')}</div>
    </div>`).join('')}</div>`));
  }
  motionIn(host, { y: 12 });
}

function runMock(host, tasks) {
  host.innerHTML = '';
  const deadline = Date.now() + WRITTEN_MINUTES * 60000;
  const results = [];
  let index = 0;

  const timer = el(`<div class="mock-timer"></div>`);
  const tick = () => {
    const left = deadline - Date.now();
    if (left <= 0) {
      timer.classList.add('is-over');
      // 不强制交卷：真考试到这里收卷，但这是练习——把事实说清楚比替你按下按钮有用。
      timer.textContent = '考试时间到了。真考试到这里就收卷了，你可以做完，但记住这个进度。';
      return;
    }
    const min = Math.floor(left / 60000);
    const sec = Math.floor(left % 60000 / 1000);
    timer.textContent = `剩余 ${min}:${String(sec).padStart(2, '0')}`;
  };
  tick();
  const clock = setInterval(tick, 1000);

  const next = () => {
    if (index >= tasks.length) {
      clearInterval(clock);
      return finish(host, results);
    }
    const task = tasks[index];
    host.innerHTML = '';
    host.appendChild(timer);
    const part = examPart(task.cellId) || {};
    host.appendChild(el(`<div class="flow-header">${esc(PART_LABEL[part.part] || '')} · Teil ${part.teil} · 第 ${index + 1}/${tasks.length} 部分</div>`));
    runExamShell(host, task, {
      feedback: 'deferred',
      onExit: () => { clearInterval(clock); host.innerHTML = ''; renderExamMock(host); },
      onComplete: ({ correct, total }) => {
        results.push({ cellId: task.cellId, correct, total });
        index += 1;
        next();
      },
    });
  };
  next();
}

function finish(host, results) {
  const summary = scoreMock(results);
  recordMock(summary);
  host.innerHTML = '';
  const pct = Math.round(summary.ratio * 100);
  host.appendChild(el(`<section class="mock-result ${summary.pass ? 'is-pass' : 'is-fail'}">
    <div class="completion-seal">${icon(summary.pass ? 'trophy' : 'arrow')}</div>
    <span class="eyebrow">ERGEBNIS · 成绩</span>
    <h2>${summary.earned} / ${summary.points} 分 · ${pct}%</h2>
    <p class="meta">${summary.pass
      ? `过了 ${Math.round(PASS_RATIO * 100)}% 这条线。按今天这个状态去考笔试，是能过的。`
      : `没到 ${Math.round(PASS_RATIO * 100)}% 这条线。下面哪一栏最低，就先回去练哪一栏。`}</p>
  </section>`));

  host.appendChild(el(`<div class="exam-list">${summary.parts.map(row => {
    const part = examPart(row.cellId) || {};
    const ratio = row.points ? Math.round(row.earned / row.points * 100) : 0;
    return `<a class="card exam-task" href="#/exam/${esc(row.cellId)}">
      <div class="exam-task-title">${esc(row.cellId)} · ${esc(PART_LABEL[part.part] || '')} Teil ${part.teil}</div>
      <div class="exam-task-meta">${row.correct}/${row.total} 题 · ${row.earned}/${row.points} 分 · ${ratio}%</div>
    </a>`;
  }).join('')}</div>`));

  // 不假装能给官方成绩单。口径写在脸上，比给一个看起来很准的假分数诚实。
  host.appendChild(el(`<div class="source-card">这里算的是「答对的分 ÷ 这套题的满分」。
  官方把四个模块换算成总分的权重我们没有公开依据，所以不给官方分，只给得分率和
  ${Math.round(PASS_RATIO * 100)}% 这条及格线。口试 ${EXAM_TIMING.sprechen} 分钟是单独一场，不算在这里。</div>`));
  host.appendChild(el(`<a class="btn block" href="#/panorama" style="margin-top:16px">回到全景图</a>`));
  motionIn(host, { y: 16 });
}
