// 今日学习：一键串流 词卡复习 → 错题巩固 → 新微步课 → 今日视频 → 听写跟读
import { el, esc, videoCard, toast } from '../ui.js';
import { COURSE, findLesson, nextLesson } from '../../data/course.js';
import { READINGS } from '../../data/readings.js';
import { VOCAB } from '../../data/vocab.js';
import { srsStats } from '../srs.js';
import { dueMistakes, rateMistake, mistakeRef, recordAnswer } from '../mastery.js';
import { allLessonStates, getVideoState, getDaily, getStreak } from '../storage.js';
import { runLesson } from './lesson.js';
import { runVocabSession } from './vocab.js';
import { renderExercise } from '../exercises.js';
import { stopSpeak } from '../speech.js';

/* 三档时长的队列配置 */
const PLANS = {
  5: { label: '5 分钟 · 只复习', maxDue: 20, maxNew: 0, mistakes: 5, lesson: false, video: false, dictation: 0 },
  15: { label: '15 分钟 · 标准', maxDue: 20, maxNew: 10, mistakes: 5, lesson: true, video: true, dictation: 2 },
  30: { label: '30 分钟 · 充实', maxDue: 40, maxNew: 15, mistakes: 8, lesson: true, video: true, dictation: 3 },
};

export function renderToday(host) {
  const stats = srsStats(VOCAB.map(w => w.id));
  const mistakes = dueMistakes(99).length;
  const daily = getDaily();
  const streak = getStreak();
  const next = nextLesson(allLessonStates());
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Guten Morgen!' : hour < 18 ? 'Guten Tag!' : 'Guten Abend!';

  host.appendChild(el(`<div class="hero">
    <h1 class="de">${greet} 👋</h1>
    <p>${daily.items > 0 ? `今天已练 ${daily.items} 题 · 连续学习 ${streak} 天 🔥` : streak > 1 ? `连续学习 ${streak} 天 🔥 今天继续！` : '每天一点点，德语就是这样学会的。'}</p>
    <div class="hero-stats">
      <div class="hero-stat"><b>${stats.due}</b><span>待复习词</span></div>
      <div class="hero-stat"><b>${mistakes}</b><span>待巩固错题</span></div>
      <div class="hero-stat"><b>${next ? esc(next.lesson.title) : '✓'}</b><span>下一课</span></div>
    </div>
  </div>`));

  host.appendChild(el(`<div class="section-label">今天有多少时间？</div>`));
  const timeRow = el(`<div class="time-grid"></div>`);
  Object.entries(PLANS).forEach(([min, plan]) => {
    const b = el(`<button class="time-card"><b>${min} 分钟</b><span>${plan.label.split('·')[1].trim()}</span></button>`);
    b.addEventListener('click', () => startFlow(host, parseInt(min, 10)));
    timeRow.appendChild(b);
  });
  host.appendChild(timeRow);

  host.appendChild(el(`<div class="section-label">或者单独练</div>`));
  const quick = el(`<div class="module-grid"></div>`);
  [
    { href: '#/vocab/study', icon: '🃏', title: '词汇', sub: `${stats.due} 到期 · ${Math.min(stats.fresh, 10)} 新` },
    { href: '#/path', icon: '🛤️', title: '课程路径', sub: next ? `下一课 ${next.lesson.title}` : '全部完成' },
    { href: '#/readlisten', icon: '📖', title: '读·听', sub: '阅读与听力' },
  ].forEach(m => quick.appendChild(el(`<a class="module-card" href="${m.href}">
    <div class="m-icon">${m.icon}</div><div class="m-title">${m.title}</div><div class="m-sub">${m.sub}</div>
  </a>`)));
  host.appendChild(quick);
}

/* ---- 串流执行 ---- */
function startFlow(host, minutes) {
  const plan = PLANS[minutes];
  const segments = [];

  const stats = srsStats(VOCAB.map(w => w.id));
  if (stats.due > 0 || (plan.maxNew > 0 && stats.fresh > 0)) {
    segments.push({ kind: 'vocab', title: '词汇复习与新词' });
  }
  const mistakes = dueMistakes(plan.mistakes);
  if (mistakes.length) segments.push({ kind: 'mistakes', title: '错题巩固', ids: mistakes });
  const next = plan.lesson ? nextLesson(allLessonStates()) : null;
  if (next) segments.push({ kind: 'lesson', title: `新课：${next.lesson.title}`, lessonId: next.lesson.id });
  if (plan.video) {
    const pending = pendingVideo();
    if (pending) segments.push({ kind: 'video', title: '今日视频', video: pending });
  }
  if (plan.dictation > 0) segments.push({ kind: 'dictation', title: '句子精听', count: plan.dictation });

  if (!segments.length) {
    toast('今天的任务都清空了 🎉 可以去读·听里泛听磨耳朵');
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
      host.appendChild(el(`<div class="lesson-done" style="margin-top:60px">
        <div class="lesson-done-emoji">🏆</div>
        <h2>今日学习完成！</h2>
        <p class="meta">共 ${daily.items} 题 · 正确 ${daily.ok} · 连续 ${getStreak()} 天</p>
        <a class="btn" style="margin-top:16px" href="#/">回到首页</a>
      </div>`));
      return;
    }
    const seg = segments[idx];
    const header = el(`<div class="flow-header">第 ${idx + 1}/${segments.length} 段 · ${esc(seg.title)}</div>`);

    if (seg.kind === 'vocab') {
      runVocabSession(host, {
        maxDue: plan.maxDue, maxNew: plan.maxNew,
        onDone: () => { idx++; run(); },
        onExit: () => { location.hash = '#/'; renderTodayFresh(host); },
      });
    } else if (seg.kind === 'lesson') {
      runLesson(host, seg.lessonId, {
        onComplete: () => { idx++; run(); },
        onExit: () => { renderTodayFresh(host); },
      });
    } else if (seg.kind === 'mistakes') {
      host.appendChild(header);
      runMistakeDrill(host, seg.ids, () => { idx++; run(); });
    } else if (seg.kind === 'video') {
      host.appendChild(header);
      const wrap = el(`<div style="margin-top:10px"></div>`);
      wrap.appendChild(videoCard(seg.video, { onWatched: () => toast('已记录 ✓') }));
      host.appendChild(wrap);
      const btn = el(`<button class="btn block" style="margin-top:14px">看完了，继续 ›</button>`);
      btn.addEventListener('click', () => { idx++; run(); });
      host.appendChild(btn);
    } else if (seg.kind === 'dictation') {
      host.appendChild(header);
      runDictationSet(host, seg.count, () => { idx++; run(); });
    }
  };
  run();
}

function renderTodayFresh(host) {
  document.body.classList.remove('immersive');
  host.innerHTML = '';
  renderToday(host);
}

function pendingVideo() {
  for (const unit of COURSE)
    for (const v of unit.videos || [])
      if (!getVideoState(v.yt).done) return v;
  return null;
}

/* 错题巩固：从课程步骤引用还原题目 */
function runMistakeDrill(host, ids, onDone) {
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
    const lesson = findLesson(lessonId);
    const step = lesson?.steps[stepIdx];
    if (!step) { rateMistake(id, true); i++; show(); return; } // 内容已变更，出池
    renderExercise(stage, step, {
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
export function runDictationSet(host, count, onDone) {
  document.body.classList.add('immersive');
  const pool = [];
  READINGS.forEach(r => r.sentences.forEach(s => {
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
    renderExercise(stage, { type: 'dictation', audioText: picks[i], distractors: [] }, {
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
