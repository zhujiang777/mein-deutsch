// 课程路径：双泳道（语法主线 / 场景口语），各自顺序解锁 + 掌握度 + 视频门槛
import { COURSE } from '../../data/course.js';
import { el, esc, videoCard, toast } from '../ui.js';
import { allLessonStates, setLessonState, getVideoState } from '../storage.js';
import { lessonMastery } from '../mastery.js';

const TRACKS = [
  { id: 'grammar', label: '📐 语法主线' },
  { id: 'scene', label: '🗣️ 场景口语' },
];

export function renderPath(host) {
  host.appendChild(el(`<h1 class="page-title">🛤️ 课程路径</h1>`));
  host.appendChild(el(`<p class="page-sub">两条线各自独立解锁。语法主线对齐德国之声 <a href="https://learngerman.dw.com/zh/beginners/c-36519789" target="_blank" rel="noopener">Nicos Weg A1</a>；场景口语线练开口。</p>`));

  // 顶部分段切换：移动端单手可点，两条线互不干扰
  const seg = el(`<div class="track-seg"></div>`);
  const pane = el(`<div class="track-pane"></div>`);
  let active = TRACKS[0].id;

  TRACKS.forEach(t => {
    const b = el(`<button class="track-tab${t.id === active ? ' active' : ''}">${t.label}</button>`);
    b.addEventListener('click', () => {
      if (active === t.id) return;
      active = t.id;
      [...seg.children].forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderPane();
    });
    seg.appendChild(b);
  });
  host.appendChild(seg);
  host.appendChild(pane);

  function renderPane() {
    pane.innerHTML = '';
    const states = allLessonStates();
    const units = COURSE.filter(u => (u.track || 'grammar') === active);
    if (!units.length) {
      pane.appendChild(el(`<div class="empty-hint">这条线的课程还在制作中。</div>`));
      return;
    }

    let unlocked = true; // 每条线第一课解锁；之后每课依赖前一课完成

    units.forEach(unit => {
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
              renderPane();
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
      pane.appendChild(unitEl);
    });

    // 旧版模块入口挂在语法主线下（内容迁移期间保留）
    if (active === 'grammar') {
      pane.appendChild(el(`<div class="section-label">更多单元制作中 · 先用旧版课程</div>`));
      pane.appendChild(el(`<a class="list-item" href="#/pron"><span class="li-icon">🗣️</span><div class="li-main"><div class="li-title">发音系统课（旧版）</div><div class="li-sub">10 课拼读规则，迁移为微步课中</div></div><span class="li-arrow">›</span></a>`));
      pane.appendChild(el(`<a class="list-item" href="#/grammar"><span class="li-icon">📐</span><div class="li-main"><div class="li-title">语法课（旧版）</div><div class="li-sub">12 课 A1 语法，迁移为微步课中</div></div><span class="li-arrow">›</span></a>`));
    }
  }

  renderPane();
}
