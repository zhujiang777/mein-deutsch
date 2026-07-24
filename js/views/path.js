// 课程路径：三泳道（语法主线 / 发音入门 / 场景口语），各自顺序解锁 + 掌握度 + 视频门槛
import { COURSE_CATALOG } from '../../data/content-index.js';
import { el, esc, icon, motionIn, videoCard, toast } from '../ui.js';
import { allLessonStates, setLessonState, getVideoState } from '../storage.js';
import { lessonMastery } from '../mastery.js';

const TRACKS = [
  { id: 'grammar', label: '语法主线', icon: 'route' },
  { id: 'pron', label: '发音入门', icon: 'speaker' },
  { id: 'scene', label: '场景口语', icon: 'mic' },
];

export function renderPath(host) {
  host.appendChild(el(`<header class="page-head path-head"><span class="eyebrow">STADTPLAN · 城市学习路线</span><h1 class="page-title">下一站，德语生活</h1><p class="page-sub">沿着三条线路前进。完成当前站，下一段路线就会亮起。</p></header>`));

  // 顶部分段切换：移动端单手可点，两条线互不干扰
  const seg = el(`<div class="track-seg"></div>`);
  const pane = el(`<div class="track-pane"></div>`);
  let active = TRACKS[0].id;
  seg.dataset.index = '0';

  TRACKS.forEach((t, index) => {
    const b = el(`<button class="track-tab${t.id === active ? ' active' : ''}">${icon(t.icon)}<span>${t.label}</span></button>`);
    b.addEventListener('click', () => {
      if (active === t.id) return;
      active = t.id;
      seg.dataset.index = String(index);
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
    const units = COURSE_CATALOG.filter(u => (u.track || 'grammar') === active);
    if (!units.length) {
      pane.appendChild(el(`<div class="empty-hint">这条线的课程还在制作中。</div>`));
      return;
    }

    let unlocked = true; // 每条线第一课解锁；之后每课依赖前一课完成

    units.forEach(unit => {
      const unitEl = el(`<section class="unit-block district-block">
        <div class="unit-head district-head">
          <span class="unit-number">${String(units.indexOf(unit) + 1).padStart(2, '0')}</span>
          <div>
            <div class="unit-title">${esc(unit.title)}</div>
            ${unit.intro ? `<div class="meta">${esc(unit.intro)}</div>` : ''}
          </div>
        </div>
        <div class="route-stops"></div>
      </section>`);
      const stops = unitEl.querySelector('.route-stops');

      unit.lessons.forEach((lesson, lessonIndex) => {
        const st = states[lesson.id];
        const done = !!st?.done;
        const thisUnlocked = unlocked;
        if (!done) unlocked = false; // 后面的课锁住

        const mastery = lessonMastery(lesson);
        const cardTag = thisUnlocked || done ? 'a' : 'div';
        const cardAttrs = thisUnlocked || done ? `href="#/lesson/${lesson.id}"` : '';
        const row = el(`<div class="route-stop ${lessonIndex % 2 ? 'right' : 'left'} ${done ? 'done' : thisUnlocked ? 'current' : 'locked'}">
          <button class="route-node" ${thisUnlocked || done ? '' : 'disabled'} aria-label="${done ? '已完成' : thisUnlocked ? '开始' : '未解锁'}：${esc(lesson.title)}">${icon(done ? 'check' : thisUnlocked ? 'play' : 'lock')}</button>
          <${cardTag} class="route-card" ${cardAttrs}>
          <div class="li-main">
            <div class="li-title">${esc(lesson.title)}</div>
            <div class="li-sub">${done ? `已完成 · 正确率 ${st.score ?? '–'}%` : thisUnlocked ? (st?.step ? '继续上次进度' : `${lesson.stepCount} 步`) : '完成上一课后解锁'}
              ${mastery > 0 ? ` · 掌握度 ${mastery}%` : ''}</div>
          </div>
          ${thisUnlocked || done ? `<span class="li-arrow">${icon('arrow')}</span>` : `<button class="skip-btn" title="跳过">已经会了</button>`}
          </${cardTag}>
        </div>`);

        if (thisUnlocked || done) {
          row.querySelector('.route-node').addEventListener('click', () => { location.hash = `#/lesson/${lesson.id}`; });
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
        stops.appendChild(row);
      });

      // 单元视频（掌握门槛的一部分）
      (unit.videos || []).forEach(v => {
        const watched = getVideoState(v.yt).done;
        const wrap = el(`<div class="unit-video ${watched ? 'watched' : ''}"></div>`);
        wrap.appendChild(videoCard(v, { onWatched: () => toast('视频已记录 ✓') }));
        unitEl.appendChild(wrap);
      });

      if (unit.nicosWeg) {
        unitEl.appendChild(el(`<div class="source-card">课程参照 · <a href="${esc(unit.nicosWeg.url)}" target="_blank" rel="noopener">${esc(unit.nicosWeg.name)}</a></div>`));
      }
      pane.appendChild(unitEl);
      motionIn(unitEl, { y: 12, delay: Math.min(120, units.indexOf(unit) * 24), skipOnCoarse: true });
    });

    // 旧版模块入口：内容迁移期间保留，各自挂在对应泳道下
    if (active === 'grammar') {
      pane.appendChild(el(`<div class="section-label">更多单元制作中 · 先用旧版课程</div>`));
      pane.appendChild(el(`<a class="list-item" href="#/grammar"><span class="li-icon">${icon('route')}</span><div class="li-main"><div class="li-title">语法课（旧版）</div><div class="li-sub">12 课 A1 语法，迁移为微步课中</div></div><span class="li-arrow">${icon('arrow')}</span></a>`));
    }
    if (active === 'pron') {
      pane.appendChild(el(`<div class="section-label">新课覆盖前先用旧版对照</div>`));
      pane.appendChild(el(`<a class="list-item" href="#/pron"><span class="li-icon">${icon('speaker')}</span><div class="li-main"><div class="li-title">发音系统课（旧版）</div><div class="li-sub">10 课拼读规则，迁移为微步课中</div></div><span class="li-arrow">${icon('arrow')}</span></a>`));
    }
  }

  renderPane();
}
