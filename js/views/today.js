// 今日学习：三段围绕同一份材料 —— 学（微步课）→ 用（精听五阶段）→ 记（本篇生词 + 到期复习）
// 组装规则和材料挑选见 js/today-plan.js
import { el, esc, icon, motionIn, toast } from '../ui.js';
import { COURSE_CATALOG, VOCAB_IDS, nextCatalogLesson } from '../../data/content-index.js';
import { srsStats } from '../srs.js';
import {
  dueMistakes, dueListenMisses, rateMistake, mistakeRef, listenRef, recordAnswer
} from '../mastery.js';
import { allLessonStates, getDaily, getStreak, getWordbook, loadSrs, loadSkills, rewardSummary } from '../storage.js';
import { stopSpeak } from '../speech.js';
import { panoramaBanner } from '../panorama-banner.js';
import { PLANS, STAGE_LABELS, pickMaterial, buildTodayPlan } from '../today-plan.js';

/* 三档时长的配置见 js/today-plan.js —— 那里也定义了"学/用/记"三段怎么组装 */
const vocabIds = () => [...Object.keys(getWordbook()), ...VOCAB_IDS];
const todayMaterial = () => pickMaterial({
  lessonStates: allLessonStates(), srs: loadSrs(), skills: loadSkills(),
});
let todayRuntimePromise;

function loadTodayRuntime() {
  if (!todayRuntimePromise) {
    todayRuntimePromise = Promise.all([
      import('../../data/course.js'),
      import('../../data/readings.js'),
      import('./lesson.js'),
      import('./vocab.js'),
      import('../exercises.js?v=5'),
      import('./listening.js?v=2'),
      import('../lesson-shell.js'),
    ]).then(([course, readings, lessonView, vocabView, exercises, listeningView, shell]) => ({
      COURSE: course.COURSE,
      READINGS: readings.READINGS,
      findLesson: course.findLesson,
      nextLesson: course.nextLesson,
      runLesson: lessonView.runLesson,
      runVocabSession: vocabView.runVocabSession,
      renderExercise: exercises.renderExercise,
      findListeningLesson: listeningView.findListeningLesson,
      runLessonShell: shell.runLessonShell,
    }));
  }
  return todayRuntimePromise;
}

export function renderToday(host) {
  const stats = srsStats(vocabIds());
  const mistakes = dueMistakes(99).length;
  const listenMisses = dueListenMisses(99).length;
  const daily = getDaily();
  const streak = getStreak();
  const next = nextCatalogLesson(allLessonStates());
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Guten Morgen!' : hour < 18 ? 'Guten Tag!' : 'Guten Abend!';
  const reward = rewardSummary();
  const remaining = Math.max(0, reward.dailyGoalXp - reward.dailyXp);

  const top = el(`<header class="today-topbar">
    <div class="brand-lockup"><span class="brand-mark">M</span><div><small>MEIN DEUTSCH</small><b>${greet}</b></div></div>
    <div class="status-cluster">
      <span class="status-chip flame">${icon('flame')}<b>${streak}</b></span>
      <span class="status-chip">${icon('star')}<b>${reward.totalXp}</b></span>
      <a class="status-chip status-me" href="#/me" aria-label="我的：统计与设置">${icon('user')}</a>
    </div>
  </header>`);
  host.appendChild(top);

  const hero = el(`<section class="journey-hero" style="--goal:${reward.dailyPct}">
    <div class="journey-copy">
      <span class="journey-kicker">第 ${reward.level} 级 · 每日德语目标</span>
      <h1>${next ? esc(next.lesson.title) : '今天的路线已完成'}</h1>
      <p>${remaining > 0 ? `再获得 ${remaining} XP，完成今日学习目标` : `今日目标已达成 · 已练习 ${daily.items} 项`}</p>
    </div>
    <div class="goal-orbit" aria-label="今日目标完成 ${reward.dailyPct}%">
      <div><b>${reward.dailyXp}</b><span>/${reward.dailyGoalXp} XP</span></div>
    </div>
  </section>`);
  host.appendChild(hero);

  // 开始按钮必须在第一屏就能点到，所以"今天做什么"和"花多久"合成同一张卡：
  // 读到的东西和要按的按钮在一起，不用为了先说明再滚一屏。
  const material = todayMaterial();
  const stageLine = material?.ready
    ? `学一课 · 用《${esc(material.pack.titleZh || material.pack.title)}》· 记住它`
    : '学一课 · 记住它';
  const launcher = el(`<section class="mission-launcher">
    <div class="mission-head"><div><span>今天的学习</span><b>${stageLine}</b></div><span class="mission-count">${stats.due + mistakes + listenMisses} 项待复习</span></div>
    ${material ? `<p class="tm-why${material.ready ? '' : ' is-blocked'}">${esc(material.reason)}</p>` : ''}
    <div class="time-grid" role="group" aria-label="学习时长"></div>
    <button class="btn block journey-start">开始今天的学习 ${icon('arrow')}</button>
  </section>`);
  const timeRow = launcher.querySelector('.time-grid');
  const startBtn = launcher.querySelector('.journey-start');
  let selectedMinutes = 15;
  Object.entries(PLANS).forEach(([min, plan]) => {
    const value = parseInt(min, 10);
    const b = el(`<button class="time-card${value === selectedMinutes ? ' active' : ''}" aria-pressed="${value === selectedMinutes}"><b>${min}</b><span>分钟 · ${plan.label.split('·')[1].trim()}</span></button>`);
    b.addEventListener('click', () => {
      selectedMinutes = value;
      [...timeRow.children].forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
    });
    timeRow.appendChild(b);
  });
  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = '正在准备今日路线…';
    try {
      await startFlow(host, selectedMinutes);
    } catch (error) {
      startBtn.disabled = false;
      startBtn.innerHTML = `开始今天的学习 ${icon('arrow')}`;
      toast('内容加载失败，请检查网络后重试');
      console.error(error);
    }
  });
  host.appendChild(launcher);
  // 横幅退到开始按钮之后：它回答"还差多远"，是看的东西，不该挡在动作前面。
  host.appendChild(panoramaBanner());

  host.appendChild(el(`<div class="section-label">短途练习</div>`));
  const quick = el(`<div class="module-grid"></div>`);
  [
    { href: '#/vocab/study', icon: 'cards', title: '词汇站', sub: `${stats.due} 到期 · ${Math.min(stats.fresh, 10)} 新` },
    { href: '#/path', icon: 'route', title: '城市路线', sub: next ? `下一站 · ${next.lesson.title}` : '全部完成' },
    { href: '#/readlisten', icon: 'book', title: '书店与电台', sub: '阅读 · 听力 · 听写' },
  ].forEach(m => quick.appendChild(el(`<a class="module-card" href="${m.href}">
    <div class="m-icon">${icon(m.icon)}</div><div class="m-title">${m.title}</div><div class="m-sub">${m.sub}</div><span class="m-arrow">${icon('arrow')}</span>
  </a>`)));
  host.appendChild(quick);
  [...host.querySelectorAll('.journey-hero,.mission-launcher,.module-card')].forEach((node, i) =>
    motionIn(node, { y: 12, delay: i * 32, skipOnCoarse: true }));
}

/* ---- 串流执行 ---- */
async function startFlow(host, minutes) {
  const runtime = await loadTodayRuntime();
  const stats = srsStats(vocabIds());
  const { segments } = buildTodayPlan(minutes, {
    nextLesson: nextCatalogLesson(allLessonStates())?.lesson || null,
    material: todayMaterial(),
    counts: {
      due: stats.due, fresh: stats.fresh,
      mistakes: dueMistakes(99), listenMisses: dueListenMisses(99),
    },
  });

  if (!segments.length) {
    toast('今天的任务都清空了 🎉 可以去仓库里泛听磨耳朵');
    return;
  }

  let idx = 0;
  const run = () => {
    host.innerHTML = '';
    window.scrollTo(0, 0);
    stopSpeak();
    if (idx >= segments.length) {
      document.body.classList.remove('immersive');
      const daily = getDaily();
      const reward = rewardSummary();
      host.appendChild(el(`<div class="lesson-done" style="margin-top:60px">
        <div class="completion-seal">${icon('trophy')}</div>
        <span class="eyebrow">TAGESZIEL</span>
        <h2>今日路线完成</h2>
        <div class="completion-stats"><div><b>${daily.items}</b><span>练习</span></div><div><b>${daily.ok}</b><span>答对</span></div><div><b>${reward.dailyXp}</b><span>XP</span></div></div>
        <p class="meta">连续学习 ${getStreak()} 天</p>
        <a class="btn" style="margin-top:16px" href="#/">回到首页</a>
      </div>`));
      return;
    }
    const seg = segments[idx];
    const header = el(`<div class="flow-header">${esc(STAGE_LABELS[seg.stage] || '')} · ${esc(seg.title)}</div>`);

    if (seg.kind === 'vocab') {
      runtime.runVocabSession(host, {
        maxDue: seg.maxDue, maxNew: seg.maxNew, quickForms: seg.quickForms,
        priorityIds: seg.priorityIds,
        onDone: () => { idx++; run(); },
        onExit: () => { location.hash = '#/'; renderTodayFresh(host); },
      });
    } else if (seg.kind === 'lesson') {
      runtime.runLesson(host, seg.lessonId, {
        onComplete: () => { idx++; run(); },
        onExit: () => { renderTodayFresh(host); },
      });
    } else if (seg.kind === 'material') {
      const lesson = runtime.findListeningLesson(seg.packId);
      if (!lesson) { idx++; run(); return; }
      host.appendChild(header);
      runtime.runLessonShell(host, lesson, {
        onComplete: () => { idx++; run(); },
        onExit: () => { renderTodayFresh(host); },
      });
    } else if (seg.kind === 'mistakes') {
      host.appendChild(header);
      runMistakeDrill(host, seg.ids, () => { idx++; run(); }, runtime);
    } else if (seg.kind === 'listen-misses') {
      host.appendChild(header);
      runListenMissDrill(host, seg.ids, () => { idx++; run(); }, runtime);
    }
  };
  run();
}

/* 精听错句复现：按 l: 引用还原原包、原句和原音频。 */
function runListenMissDrill(host, ids, onDone, runtime) {
  document.body.classList.add('immersive');
  const stage = el(`<div class="lesson-stage" style="margin-top:10px"></div>`);
  const bottom = el(`<div class="lesson-bottom"></div>`);
  host.appendChild(stage);
  host.appendChild(bottom);
  let i = 0;
  let activeLesson = null;

  const show = () => {
    activeLesson?.player?.destroy();
    activeLesson = null;
    stage.innerHTML = ''; bottom.innerHTML = '';
    if (i >= ids.length) {
      document.body.classList.remove('immersive');
      onDone();
      return;
    }
    const id = ids[i];
    const { packId, sentenceIndex } = listenRef(id);
    activeLesson = runtime.findListeningLesson(packId);
    // 错句可能来自听写，也可能来自复述；听写优先，两者都没有才算内容已变更。
    const at = type => activeLesson?.steps.find(item =>
      item.type === type && item.sentenceIndex === sentenceIndex);
    const step = at('dictation') || at('reproduce');
    if (!step) { rateMistake(id, true); i++; show(); return; } // 内容已变更，出池
    runtime.renderExercise(stage, step, {
      onSubmit: (correct, correctText) => {
        if (correct !== null) {
          rateMistake(id, correct);
          recordAnswer(step.skills || [], correct);
        }
        const fb = el(`<div class="feedback ${correct === false ? 'bad' : 'good'}">
          <div class="feedback-text"><b>${correct === false ? '✗ 明天再听' : '✓ 这句已巩固'}</b>
            ${correct === false ? `<div class="feedback-ans de">${esc(correctText)}</div>` : ''}
          </div>
          <button class="btn">继续</button>
        </div>`);
        fb.querySelector('button').addEventListener('click', () => { i++; show(); });
        bottom.appendChild(fb);
      },
    });
  };
  show();
}

function renderTodayFresh(host) {
  document.body.classList.remove('immersive');
  host.innerHTML = '';
  renderToday(host);
}

/* 错题巩固：从课程步骤引用还原题目 */
function runMistakeDrill(host, ids, onDone, runtime) {
  document.body.classList.add('immersive');
  const stage = el(`<div class="lesson-stage" style="margin-top:10px"></div>`);
  const bottom = el(`<div class="lesson-bottom"></div>`);
  host.appendChild(stage);
  host.appendChild(bottom);
  let i = 0;

  const show = () => {
    stage.innerHTML = ''; bottom.innerHTML = '';
    if (i >= ids.length) { document.body.classList.remove('immersive'); onDone(); return; }
    const id = ids[i];
    const { lessonId, stepIdx } = mistakeRef(id);
    const lesson = runtime.findLesson(lessonId) || runtime.findListeningLesson(lessonId);
    const step = lesson?.steps[stepIdx];
    if (!step) { rateMistake(id, true); i++; show(); return; } // 内容已变更，出池
    runtime.renderExercise(stage, step, {
      onSubmit: (correct, correctText) => {
        if (correct !== null) {
          rateMistake(id, correct);
          recordAnswer(step.skills || [], correct);
        }
        const fb = el(`<div class="feedback ${correct === false ? 'bad' : 'good'}">
          <div class="feedback-text"><b>${correct === false ? '✗ 再记一次' : '✓ 巩固成功'}</b>
            ${correct === false ? `<div class="feedback-ans de">${esc(correctText)}</div>` : ''}
            ${step.explain ? `<div class="feedback-explain">${esc(step.explain)}</div>` : ''}
          </div>
          <button class="btn">继续</button>
        </div>`);
        fb.querySelector('button').addEventListener('click', () => { i++; show(); });
        bottom.appendChild(fb);
      },
    });
  };
  show();
}

/* 句子精听：从阅读文章随机抽句做听写 */
export async function runDictationSet(host, count, onDone, suppliedRuntime = null) {
  const runtime = suppliedRuntime || await loadTodayRuntime();
  document.body.classList.add('immersive');
  const pool = [];
  runtime.READINGS.forEach(r => r.sentences.forEach(s => {
    const words = s.de.split(/\s+/).length;
    if (words >= 3 && words <= 8) pool.push(s.de);
  }));
  const picks = [];
  while (picks.length < count && pool.length) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  const stage = el(`<div class="lesson-stage" style="margin-top:10px"></div>`);
  const bottom = el(`<div class="lesson-bottom"></div>`);
  host.appendChild(stage);
  host.appendChild(bottom);
  let i = 0;
  const show = () => {
    stage.innerHTML = ''; bottom.innerHTML = '';
    if (i >= picks.length) { document.body.classList.remove('immersive'); onDone(); return; }
    runtime.renderExercise(stage, { type: 'dictation', audioText: picks[i], distractors: [] }, {
      onSubmit: (correct, correctText) => {
        const fb = el(`<div class="feedback ${correct === false ? 'bad' : 'good'}">
          <div class="feedback-text"><b>${correct === false ? '✗ 对照一下' : '✓ 听得很准！'}</b>
            <div class="feedback-ans de">${esc(correctText)}</div>
          </div>
          <button class="btn">继续</button>
        </div>`);
        fb.querySelector('button').addEventListener('click', () => { i++; show(); });
        bottom.appendChild(fb);
      },
    });
  };
  show();
}
