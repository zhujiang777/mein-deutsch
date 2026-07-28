// A1 全景图：我学到哪了、还差什么。规格见 docs/a1-panorama.md
// 这一页不教任何东西，只度量。它是主线排序的输入，也是"离完整 A1 还有多远"的唯一答案。
import {
  PRON_CELLS, GRAMMAR_GROUPS, GRAMMAR_CELLS, VOCAB_AXIS, EXAM_GROUPS, bandOf,
} from '../../data/panorama.js';
import { VOCAB_IDS } from '../../data/content-index.js';
import { el, esc, toast } from '../ui.js';
import { skillStrength } from '../mastery.js';
import { loadSkills, getWordbook } from '../storage.js';
import { srsStats } from '../srs.js';

const EXAM_STATUS = {
  ready: { label: '已具备', key: 'strong' },
  partial: { label: '有素材·缺题型', key: 'ok' },
  none: { label: '完全没有', key: 'none' },
};

/** 一格的掌握度 = 该格全部技能标签的平均强度。没有标签的格子恒为 0（= 还没教过）。 */
function cellStrength(cell, skills) {
  if (!cell.skills?.length) return 0;
  const sum = cell.skills.reduce((acc, id) => acc + skillStrength(id, skills), 0);
  return Math.round(sum / cell.skills.length);
}

function cellNode(cell, strength, href, gapLabel) {
  const band = bandOf(strength);
  const tag = href ? 'a' : 'button';
  const node = el(`<${tag} class="pano-cell band-${band.key}${gapLabel ? ' is-gap' : ''}"${href ? ` href="${href}"` : ' type="button"'}>
    <div class="pano-cell-top">
      <span class="pano-id">${esc(cell.id)}</span>
      <span class="pano-pct">${strength}%</span>
    </div>
    <div class="pano-cell-title">${esc(cell.title)}</div>
    ${cell.sub ? `<div class="pano-cell-sub">${esc(cell.sub)}</div>` : ''}
    <div class="pano-bar"><i style="width:${strength}%"></i></div>
    ${gapLabel ? `<div class="pano-gap">${esc(gapLabel)}</div>` : ''}
  </${tag}>`);
  if (!href) {
    node.addEventListener('click', () => toast(
      cell.skills?.length
        ? `${cell.title}：微步课里练过，但还没有成体系的讲解课。`
        : `${cell.title}：这一格还完全没有内容。`));
  }
  return node;
}

function section(host, label, hint) {
  host.appendChild(el(`<div class="section-label">${esc(label)}</div>`));
  if (hint) host.appendChild(el(`<p class="pano-hint">${esc(hint)}</p>`));
  const grid = el(`<div class="pano-grid"></div>`);
  host.appendChild(grid);
  return grid;
}

export function renderPanorama(host) {
  const skills = loadSkills();
  const pron = PRON_CELLS.map(cell => ({ cell, strength: cellStrength(cell, skills) }));
  const grammar = GRAMMAR_CELLS.map(cell => ({ cell, strength: cellStrength(cell, skills) }));
  const all = [...pron, ...grammar];
  const strong = all.filter(entry => entry.strength >= 70).length;
  const untouched = all.filter(entry => entry.strength === 0).length;
  const overall = Math.round(all.reduce((acc, entry) => acc + entry.strength, 0) / all.length);

  host.appendChild(el(`<header class="page-head">
    <span class="eyebrow">ÜBERBLICK · A1 全景</span>
    <h1 class="page-title">离完整的 A1 还有多远</h1>
    <p class="page-sub">按 Goethe-Zertifikat A1 考纲编排。掌握度来自你在所有模块里的答题——微步课、语法课、精读精听共用同一套技能标签。</p>
  </header>`));

  host.appendChild(el(`<div class="pano-summary">
    <div class="pano-stat"><b>${overall}%</b><span>总体掌握度</span></div>
    <div class="pano-stat"><b>${strong}<i>/${all.length}</i></b><span>格已稳</span></div>
    <div class="pano-stat"><b>${untouched}</b><span>格没碰过</span></div>
  </div>`));

  /* ---- 拼读 ---- */
  const pronGrid = section(host, '拼读 · 6 关', '地基。不会拼读，听力和口语都无从谈起。');
  pron.forEach(({ cell, strength }) => {
    const target = cell.pronLessons?.[0];
    pronGrid.appendChild(cellNode(cell, strength, target ? `#/pron/${target}` : null, null));
  });

  /* ---- 语法 ---- */
  host.appendChild(el(`<div class="section-label">语法 · 20 格</div>`));
  host.appendChild(el(`<p class="pano-hint">虚线格 = 微步课里零散练过，但没有成体系的讲解课。</p>`));
  GRAMMAR_GROUPS.forEach(group => {
    host.appendChild(el(`<div class="pano-group-label">${esc(group.label)}</div>`));
    const grid = el(`<div class="pano-grid"></div>`);
    group.cells.forEach(cell => {
      const strength = cellStrength(cell, skills);
      const lesson = cell.lessons?.[0];
      grid.appendChild(cellNode(cell, strength, lesson ? `#/grammar/${lesson}` : null,
        lesson ? null
          : cell.skills?.length ? '缺系统讲解' : '完全没有'));
    });
    host.appendChild(grid);
  });

  /* ---- 词汇 ---- */
  const vocabIds = [...Object.keys(getWordbook()), ...VOCAB_IDS];
  const stats = srsStats(vocabIds);
  const learnedPct = Math.round(stats.learned / Math.max(1, stats.total) * 100);
  const appPct = Math.round(VOCAB_AXIS.appCovered / VOCAB_AXIS.goetheContentWords * 100);
  host.appendChild(el(`<div class="section-label">词汇</div>`));
  host.appendChild(el(`<div class="card pano-vocab">
    <div class="pano-cell-top"><span class="pano-id">你学过的</span><span class="pano-pct">${stats.learned} / ${stats.total}</span></div>
    <div class="pano-bar"><i style="width:${learnedPct}%"></i></div>
    <p class="pano-hint" style="margin-top:10px">应用收录的 ${VOCAB_AXIS.appTotal} 个词里，有 ${VOCAB_AXIS.appCovered} 个命中 Goethe A1 考纲实词表（共 ${VOCAB_AXIS.goetheContentWords} 个），覆盖 ${appPct}%。剩下的缺口要靠后续内容补。</p>
    <p class="pano-hint">按 14 个主题分解还没做——考纲词表缺主题标签。这不只影响这个进度环，主线挑今天用哪份材料也要靠它。</p>
  </div>`));

  /* ---- 题型 ---- */
  host.appendChild(el(`<div class="section-label">考试题型 · 11 格</div>`));
  host.appendChild(el(`<p class="pano-hint">Goethe A1 的真实题型。这一栏不算掌握度，只回答"我们有没有这个东西"。</p>`));
  EXAM_GROUPS.forEach(group => {
    host.appendChild(el(`<div class="pano-group-label">${esc(group.label)}</div>`));
    const grid = el(`<div class="pano-grid"></div>`);
    group.cells.forEach(cell => {
      const status = EXAM_STATUS[cell.status] || EXAM_STATUS.none;
      grid.appendChild(el(`<div class="pano-cell pano-exam band-${status.key}">
        <div class="pano-cell-top"><span class="pano-id">${esc(cell.id)}</span><span class="pano-pct">${esc(status.label)}</span></div>
        <div class="pano-cell-title">${esc(cell.title)}</div>
        ${cell.sub ? `<div class="pano-cell-sub">${esc(cell.sub)}</div>` : ''}
        ${cell.note ? `<div class="pano-gap">${esc(cell.note)}</div>` : ''}
      </div>`));
    });
    host.appendChild(grid);
  });

  // 不在这里调 motionIn：app.js 的深层路由已经对整个 route-view 做过入场动画，再来一次会叠。
  host.appendChild(el(`<div class="source-card">格子定义与依据见 <code>docs/a1-panorama.md</code>，权威词表为 Goethe A1 官方 Wortliste。</div>`));
}
