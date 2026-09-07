// A1 全景图入口横幅（共享）：课程进度回答"走了多远"，全景图回答"还差多远"。
// 后者才是学下去的动力，所以它放在主页——打开就看见，不用先想去哪找。
import { PRON_CELLS, GRAMMAR_CELLS } from '../data/panorama.js';
import { el, icon } from './ui.js';
import { allLessonStates, loadSkills } from './storage.js?v=4';
import { skillStrength } from './mastery.js';
import { mainlineProgress } from './mainline.js';

export function panoramaSummary() {
  const skills = loadSkills();
  const cells = [...PRON_CELLS, ...GRAMMAR_CELLS];
  const strengths = cells.map(cell => (cell.skills?.length
    ? Math.round(cell.skills.reduce((acc, id) => acc + skillStrength(id, skills), 0) / cell.skills.length)
    : 0));
  return {
    total: cells.length,
    overall: Math.round(strengths.reduce((acc, value) => acc + value, 0) / strengths.length),
    strong: strengths.filter(value => value >= 70).length,
    untouched: strengths.filter(value => value === 0).length,
  };
}

export function panoramaBanner() {
  const { total, overall, strong } = panoramaSummary();
  // "走到第几格"和"稳了几格"是两件事：前者是主线的进度，后者是掌握度。
  // 两个都要说——只说走了多远会让人以为走过就等于学会了。
  const { done } = mainlineProgress(allLessonStates(), loadSkills());
  return el(`<a class="pano-banner" href="#/panorama">
    <div class="pano-banner-ring" style="--pct:${overall}"><b>${overall}<i>%</i></b></div>
    <div class="li-main">
      <div class="li-title">A1 地图 · 已走到第 ${Math.min(done + 1, total)}/${total} 格</div>
      <div class="li-sub">按 Goethe A1 考纲的拼读与语法格子 · 其中 ${strong} 格掌握度已经稳了</div>
    </div>
    <span class="li-arrow">${icon('arrow')}</span>
  </a>`);
}
