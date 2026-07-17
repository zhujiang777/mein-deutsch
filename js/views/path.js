// 课程路径：单元 → 课，顺序解锁 + 掌握度 + 视频门槛
import { COURSE } from '../../data/course.js';
import { el, esc, videoCard, toast } from '../ui.js';
import { allLessonStates, setLessonState, getVideoState } from '../storage.js';
import { lessonMastery } from '../mastery.js';

export function renderPath(host) {
  host.appendChild(el(`<h1 class="page-title">🛤️ 课程路径</h1>`));
  host.appendChild(el(`<p class="page-sub">按顺序解锁。每课 = 练习达标 + 对应视频看完，两者都绿才算真正掌握。课程顺序对齐德国之声 <a href="https://learngerman.dw.com/zh/beginners/c-36519789" target="_blank" rel="noopener">Nicos Weg A1</a>。</p>`));

  const states = allLessonStates();
  let unlocked = true; // 第一课解锁；之后每课依赖前一课完成

  COURSE.forEach(unit => {
    const unitEl = el(`<div class="unit-block">
      <div class="unit-head">
        <span class="unit-icon">${unit.icon || '📘'}</span>
        <div>
          <div class="unit-title">${esc(unit.title)}</div>
          ${unit.intro ? `<div class="meta">${esc(unit.intro)}</div>` : ''}
        </div>
      </div>
    </div>`);

    unit.lessons.forEach(lesson => {
      const st = states[lesson.id];
      const done = !!st?.done;
      const thisUnlocked = unlocked;
      if (!done) unlocked = false; // 后面的课锁住

      const mastery = lessonMastery(lesson);
      const row = el(`<div class="list-item lesson-row ${thisUnlocked ? '' : 'locked'}">
        <span class="li-icon">${done ? '✅' : thisUnlocked ? '▶️' : '🔒'}</span>
        <div class="li-main">
          <div class="li-title">${esc(lesson.title)}</div>
          <div class="li-sub">${done ? `已完成 · 正确率 ${st.score ?? '–'}%` : thisUnlocked ? (st?.step ? '继续上次进度' : `${lesson.steps.length} 步`) : '完成上一课后解锁'}
            ${mastery > 0 ? ` · 掌握度 ${mastery}%` : ''}</div>
        </div>
        ${thisUnlocked || done ? '<span class="li-arrow">›</span>' : `<button class="skip-btn" title="跳过">跳过</button>`}
      </div>`);

      if (thisUnlocked || done) {
        row.addEventListener('click', () => { location.hash = `#/lesson/${lesson.id}`; });
      } else {
        row.querySelector('.skip-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`确定跳过《${lesson.title}》？只有已经掌握了这个知识点才建议跳过。`)) {
            setLessonState(lesson.id, { done: true, step: 0, score: null, skipped: true });
            toast('已标记跳过');
            host.innerHTML = '';
            renderPath(host);
          }
        });
      }
      unitEl.appendChild(row);
    });

    // 单元视频（掌握门槛的一部分）
    (unit.videos || []).forEach(v => {
      const watched = getVideoState(v.yt).done;
      const wrap = el(`<div class="unit-video ${watched ? 'watched' : ''}"></div>`);
      wrap.appendChild(videoCard(v, { onWatched: () => toast('视频已记录 ✓') }));
      unitEl.appendChild(wrap);
    });

    if (unit.nicosWeg) {
      unitEl.appendChild(el(`<div class="source-card">📚 对标来源：<a href="${esc(unit.nicosWeg.url)}" target="_blank" rel="noopener">${esc(unit.nicosWeg.name)}</a>（免费官方课程，建议配合学习）</div>`));
    }
    host.appendChild(unitEl);
  });

  host.appendChild(el(`<div class="section-label">更多单元制作中 · 先用旧版课程</div>`));
  host.appendChild(el(`<a class="list-item" href="#/pron"><span class="li-icon">🗣️</span><div class="li-main"><div class="li-title">发音系统课（旧版）</div><div class="li-sub">10 课拼读规则，迁移为微步课中</div></div><span class="li-arrow">›</span></a>`));
  host.appendChild(el(`<a class="list-item" href="#/grammar"><span class="li-icon">📐</span><div class="li-main"><div class="li-title">语法课（旧版）</div><div class="li-sub">12 课 A1 语法，迁移为微步课中</div></div><span class="li-arrow">›</span></a>`));
}
