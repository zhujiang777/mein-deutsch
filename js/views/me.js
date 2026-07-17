// 我的：学习统计 + 设置入口
import { el, esc } from '../ui.js';
import { getDaily, getStreak, todayKey, allLessonStates } from '../storage.js';
import { srsStats } from '../srs.js';
import { VOCAB } from '../../data/vocab.js';
import { COURSE } from '../../data/course.js';
import { syncConfigured } from '../sync.js';

export function renderMe(host) {
  const stats = srsStats(VOCAB.map(w => w.id));
  const streak = getStreak();
  const lessonStates = allLessonStates();
  const totalLessons = COURSE.reduce((n, u) => n + u.lessons.length, 0);
  const doneLessons = Object.values(lessonStates).filter(s => s.done).length;

  host.appendChild(el(`<h1 class="page-title">👤 我的</h1>`));

  host.appendChild(el(`<div class="card">
    <h3>📊 学习统计</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;margin-top:10px">
      <div><b style="font-size:1.5rem;color:var(--accent)">${streak}</b><div class="meta">连续天数</div></div>
      <div><b style="font-size:1.5rem;color:var(--green)">${stats.learned}</b><div class="meta">已学单词</div></div>
      <div><b style="font-size:1.5rem;color:var(--blue)">${doneLessons}/${totalLessons}</b><div class="meta">微步课</div></div>
    </div>
  </div>`));

  // 最近 7 天活动
  const week = el(`<div class="card"><h3>最近 7 天</h3><div class="week-row"></div></div>`);
  const row = week.querySelector('.week-row');
  for (let i = 6; i >= 0; i--) {
    const d = getDaily(todayKey(-i));
    const active = d.items > 0;
    const day = new Date(Date.now() - i * 86400000);
    row.appendChild(el(`<div class="week-day ${active ? 'active' : ''}">
      <span class="week-dot">${active ? d.items : '·'}</span>
      <span class="week-label">${'日一二三四五六'[day.getDay()]}</span>
    </div>`));
  }
  host.appendChild(week);

  host.appendChild(el(`<a class="list-item" href="#/settings">
    <span class="li-icon">⚙️</span>
    <div class="li-main"><div class="li-title">设置</div>
    <div class="li-sub">语音 · 每日新词 · ${syncConfigured() ? '同步已开启 ✅' : '跨设备同步（未配置）'}</div></div>
    <span class="li-arrow">›</span></a>`));

  host.appendChild(el(`<div class="section-label">学习方法与来源</div>`));
  host.appendChild(el(`<div class="card"><div class="meta" style="line-height:1.9">
    📖 词表：<a href="https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf" target="_blank" rel="noopener">歌德学院 Goethe-Zertifikat A1 官方词表</a><br>
    🎬 课程进度对标：<a href="https://learngerman.dw.com/zh/beginners/c-36519789" target="_blank" rel="noopener">德国之声 Nicos Weg A1</a>（免费官方课程）<br>
    🔊 发音：微软神经网络德语语音预生成，全设备一致<br>
    🧠 方法：微步教学 + 间隔重复 + 错题循环 + 可理解输入（精读/泛读/精听/泛听）
  </div></div>`));
}
