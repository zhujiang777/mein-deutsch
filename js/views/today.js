// 今天走一条路：背词 → 学一格 → 今日文章。产品形态见 docs/product-shape.md
//
// 主路径上只有一个动作。时长选择被删掉了——"减少选择"的第一步不该是一道选择题；
// 想少学的人走底部那一条旁路（只复习）。两个出口，不是六个入口。
// 组装规则和今日文章的选材见 js/today-plan.js
import { el, esc, icon, motionIn, toast } from '../ui.js';
import { COURSE_CATALOG, VOCAB_IDS, nextCatalogLesson } from '../../data/content-index.js';
import { srsStats, buildQueue } from '../srs.js';
import {
  dueMistakes, dueListenMisses, rateMistake, mistakeRef, listenRef, recordAnswer
} from '../mastery.js';
import { allLessonStates, getDaily, getStreak, getWordbook, loadSrs, loadSkills, rewardSummary } from '../storage.js';
import { stopSpeak } from '../speech.js';
import { panoramaBanner } from '../panorama-banner.js';
import { ROUTES, STAGE_LABELS, pickMaterial, buildTodayPlan } from '../today-plan.js';

const vocabIds = () => [...Object.keys(getWordbook()), ...VOCAB_IDS];

/** 今天真的会背到的词：到期的 + 今天放进来的新词。 */
function todayWords() {
  const { due, fresh } = buildQueue(vocabIds());
  return [...due.slice(0, ROUTES.full.maxDue), ...fresh.slice(0, ROUTES.full.maxNew)];
}

/**
 * 今日文章的选材种子是**双输入**：今天要背的词 + 今天这一格用到的词。
 * 这一条就是"这篇是给我今天写的"和"系统随便给了我一篇"的全部区别。
 */
const todayMaterial = (nextLesson) => pickMaterial({
  lessonStates: allLessonStates(), srs: loadSrs(), skills: loadSkills(),
  todayWordIds: [...todayWords(), ...(nextLesson?.vocabRefs || [])],
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

  // 主路径只有一个按钮。上面那三行是"今天会发生什么"的说明，不是可点的分支——
  // 一路走到底，中间不做任何选择。
  const material = todayMaterial(next?.lesson);
  const wordCount = Math.min(stats.due, ROUTES.full.maxDue) + Math.min(stats.fresh, ROUTES.full.maxNew);
  const steps = [
    { label: STAGE_LABELS.words, text: `${wordCount} 个词${mistakes + listenMisses ? ` · ${mistakes + listenMisses} 道错题` : ''}`, on: wordCount + mistakes + listenMisses > 0 },
    { label: STAGE_LABELS.learn, text: next ? next.lesson.title : '这条线已经走完', on: !!next },
    { label: STAGE_LABELS.article, text: material?.ready ? (material.pack.titleZh || material.pack.title) : '今天还配不上一篇', on: !!material?.ready },
  ];
  const launcher = el(`<section class="mission-launcher">
    <div class="mission-head"><div><span>今天的学习</span><b>约 25 分钟，一路走到底</b></div></div>
    <ol class="today-road">${steps.map(step => `<li class="road-step${step.on ? '' : ' is-off'}">
      <span class="road-stage">${esc(step.label)}</span><span class="road-text">${esc(step.text)}</span></li>`).join('')}</ol>
    ${material ? `<p class="tm-why${material.ready ? '' : ' is-blocked'}">${esc(material.reason)}</p>` : ''}
    <button class="btn block journey-start">开始今天的学习 ${icon('arrow')}</button>
    <button class="today-bypass" type="button">今天只想复习 ›</button>
  </section>`);
  const start = (routeKey, btn, label) => async () => {
    btn.disabled = true;
    btn.textContent = '正在准备今日路线…';
    try {
      await startFlow(host, routeKey);
    } catch (error) {
      btn.disabled = false;
      btn.innerHTML = label;
      toast('内容加载失败，请检查网络后重试');
      console.error(error);
    }
  };
  const startBtn = launcher.querySelector('.journey-start');
  const bypassBtn = launcher.querySelector('.today-bypass');
  startBtn.addEventListener('click', start('full', startBtn, `开始今天的学习 ${icon('arrow')}`));
  bypassBtn.addEventListener('click', start('review', bypassBtn, '今天只想复习 ›'));
  host.appendChild(launcher);
  // 横幅退到开始按钮之后：全景图是"还差多远"的进度表，是看的东西，不该挡在动作前面。
  host.appendChild(panoramaBanner());

  // 主页只留一个旁路入口：想多背词的时候进去加练。其余一切在仓库里，不占主路径。
  const quick = el(`<div class="module-grid"></div>`);
  quick.appendChild(el(`<a class="module-card" href="#/vocab/study">
    <div class="m-icon">${icon('cards')}</div><div class="m-title">背单词 · 加练</div>
    <div class="m-sub">${stats.due} 到期 · ${stats.learned} 已学</div><span class="m-arrow">${icon('arrow')}</span>
  </a>`));
  host.appendChild(quick);
  [...host.querySelectorAll('.journey-hero,.mission-launcher,.module-card')].forEach((node, i) =>
    motionIn(node, { y: 12, delay: i * 32, skipOnCoarse: true }));
}

/* ---- 串流执行 ---- */
async function startFlow(host, routeKey) {
  const runtime = await loadTodayRuntime();
  const stats = srsStats(vocabIds());
  const nextLesson = nextCatalogLesson(allLessonStates())?.lesson || null;
  const { segments } = buildTodayPlan(routeKey, {
    nextLesson,
    material: todayMaterial(nextLesson),
    counts: {
      due: stats.due, fresh: stats.fresh,
      mistakes: dueMistakes(99), listenMisses: dueListenMisses(99),
    },
  });

  if (!segments.length) {
    toast('今天的任务都清空了 🎉 明天再来');
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
