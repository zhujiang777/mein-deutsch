// A1 全景图入口横幅（共享）：课程进度回答"走了多远"，全景图回答"还差多远"。
// 后者才是学下去的动力，所以它放在主页——打开就看见，不用先想去哪找。
import { PRON_CELLS, GRAMMAR_CELLS } from '../data/panorama.js';
import { el, icon } from './ui.js';
import { loadSkills } from './storage.js';
import { skillStrength } from './mastery.js';

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
  const { total, overall, strong, untouched } = panoramaSummary();
  return el(`<a class="pano-banner" href="#/panorama">
    <div class="pano-banner-ring" style="--pct:${overall}"><b>${overall}<i>%</i></b></div>
    <div class="li-main">
      <div class="li-title">A1 全景 · ${strong}/${total} 格已稳</div>
      <div class="li-sub">按 Goethe A1 考纲的拼读与语法格子 · 还有 ${untouched} 格没碰过</div>
    </div>
    <span class="li-arrow">${icon('arrow')}</span>
  </a>`);
}
