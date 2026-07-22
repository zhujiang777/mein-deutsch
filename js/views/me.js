// 我的：学习统计 + 设置入口
import { el, guideBear, icon, motionIn } from '../ui.js';
import { getDaily, getStreak, todayKey, allLessonStates, rewardSummary } from '../storage.js';
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
  const reward = rewardSummary();

  host.appendChild(el(`<header class="journey-hero">
    <div class="journey-copy">
      <span class="journey-kicker">MEIN LERNPASS</span>
      <h1>我的德语成长护照</h1>
      <p>记录你掌握的每一个词汇与每一次开口表达。</p>
    </div>
    <div class="level-card" style="margin-top: 16px;">
      <div style="display:flex; justify-space-between; align-items:center; font-size: 0.85rem; font-weight: 600;"><span>等级 ${reward.level}</span><b>${reward.totalXp} XP</b></div>
      <div class="progress-bar" style="margin: 8px 0;"><div style="width:${reward.levelXp}%"></div></div>
      <small style="opacity: 0.8; font-size: 0.75rem;">距离下一级还有 ${100 - reward.levelXp} XP</small>
    </div>
  </header>`));

  host.appendChild(el(`<section class="passport-stats">
    <div><span class="stat-icon">${icon('flame')}</span><b>${streak}</b><small>连续天数</small></div>
    <div><span class="stat-icon">${icon('cards')}</span><b>${stats.learned}</b><small>已学单词</small></div>
    <div><span class="stat-icon">${icon('route')}</span><b>${doneLessons}/${totalLessons}</b><small>课程站点</small></div>
  </section>`));

  // 最近 7 天活动
  const week = el(`<section class="card week-card"><div class="card-title"><span>本周足迹</span><small>${streak ? `连续 ${streak} 天` : '今天开始第一步'}</small></div><div class="week-row"></div></section>`);
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

  const badges = [
    ['first-step', '第一张车票', '完成一次学习', reward.totalXp > 0, 'star'],
    ['streak-3', '周末不停站', '连续学习 3 天', streak >= 3, 'flame'],
    ['streak-7', '城市常客', '连续学习 7 天', streak >= 7, 'trophy'],
    ['words-50', '随身词典', '学会 50 个词', stats.learned >= 50, 'cards'],
    ['lessons-10', '十站通行', '完成 10 节课', doneLessons >= 10, 'route'],
    ['level-5', '街区探索者', '达到第 5 级', reward.level >= 5, 'target'],
  ];
  const badgeSection = el(`<section class="card badge-section"><div class="card-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span style="font-weight:750;font-size:1.05rem">城市印章</span><small style="color:var(--text-2);font-size:0.8rem">${badges.filter(x => x[3]).length}/${badges.length} 已获得</small></div><div class="badge-grid"></div></section>`);
  badges.forEach(([, title, sub, earned, iconName]) => badgeSection.querySelector('.badge-grid').appendChild(el(`<div class="badge-item ${earned ? 'earned' : 'locked'}"><span>${icon(iconName)}</span><b>${title}</b><small>${sub}</small></div>`)));
  host.appendChild(badgeSection);

  host.appendChild(el(`<a class="list-item settings-link" href="#/settings">
    <span class="li-icon">${icon('settings')}</span>
    <div class="li-main"><div class="li-title">设置</div>
    <div class="li-sub">语音 · 每日新词 · ${syncConfigured() ? '同步已开启 ✅' : '跨设备同步（未配置）'}</div></div>
    <span class="li-arrow">${icon('arrow')}</span></a>`));

  host.appendChild(el(`<div class="section-label">学习方法与来源</div>`));
  host.appendChild(el(`<div class="card source-list"><ul>
    <li><b>词表</b><a href="https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf" target="_blank" rel="noopener">歌德学院 Goethe-Zertifikat A1 官方词表</a></li>
    <li><b>课程对标</b><a href="https://learngerman.dw.com/zh/beginners/c-36519789" target="_blank" rel="noopener">德国之声 Nicos Weg A1</a></li>
    <li><b>发音</b><span>微软神经网络德语语音预生成，全设备一致</span></li>
    <li><b>方法</b><span>微步教学、间隔重复、错题循环与可理解输入</span></li>
  </ul></div>`));
  [...host.querySelectorAll('.passport-hero,.passport-stats,.week-card,.badge-section,.settings-link')].forEach((node, i) => motionIn(node, { y: 14, delay: i * 55 }));
}
