import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COURSE } from '../data/course.js';
import { VOCAB } from '../data/vocab.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
import {
  PRON_CELLS, GRAMMAR_GROUPS, GRAMMAR_CELLS, VOCAB_AXIS, EXAM_CELLS, bandOf,
} from '../data/panorama.js';
import { PRON_LESSONS } from '../data/pronunciation.js';

/** course.js 里真实用过的技能标签 */
function courseSkills() {
  const found = new Set();
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.skills)) node.skills.forEach(skill => found.add(skill));
    Object.values(node).forEach(walk);
  };
  COURSE.forEach(walk);
  return found;
}

test('全景图的格子数与规格一致', () => {
  assert.equal(PRON_CELLS.length, 6, '拼读轴应为 6 格');
  assert.equal(GRAMMAR_CELLS.length, 20, '语法轴应为 20 格');
  assert.equal(EXAM_CELLS.length, 11, '题型轴应为 11 格');
});

test('格子 id 全局唯一', () => {
  const ids = [...PRON_CELLS, ...GRAMMAR_CELLS, ...EXAM_CELLS].map(cell => cell.id);
  assert.equal(new Set(ids).size, ids.length, `重复的格子 id：${ids.join(',')}`);
});

test('每个技能标签都真实存在于 course.js —— 拼错只会让那一格永远 0%', () => {
  const known = courseSkills();
  for (const cell of [...PRON_CELLS, ...GRAMMAR_CELLS]) {
    for (const skill of cell.skills || []) {
      assert.ok(known.has(skill), `${cell.id}《${cell.title}》引用了不存在的技能标签 ${skill}`);
    }
  }
});

test('同一个技能标签不被两个格子重复计入', () => {
  const owner = new Map();
  for (const cell of [...PRON_CELLS, ...GRAMMAR_CELLS]) {
    for (const skill of cell.skills || []) {
      assert.ok(!owner.has(skill),
        `${skill} 同时属于 ${owner.get(skill)} 和 ${cell.id}，掌握度会被数两遍`);
      owner.set(skill, cell.id);
    }
  }
});

test('lessons / pronLessons 指向真实存在的课程', () => {
  const grammarIds = new Set(GRAMMAR_LESSONS.map(lesson => lesson.id));
  const pronIds = new Set(PRON_LESSONS.map(lesson => lesson.id));
  GRAMMAR_CELLS.forEach(cell => (cell.lessons || []).forEach(id =>
    assert.ok(grammarIds.has(id), `${cell.id} 指向不存在的语法课 ${id}`)));
  PRON_CELLS.forEach(cell => (cell.pronLessons || []).forEach(id =>
    assert.ok(pronIds.has(id), `${cell.id} 指向不存在的发音课 ${id}`)));
});

test('12 课语法体系全部落进格子，一课不漏', () => {
  const covered = new Set(GRAMMAR_CELLS.flatMap(cell => cell.lessons || []));
  GRAMMAR_LESSONS.forEach(lesson =>
    assert.ok(covered.has(lesson.id), `${lesson.id}《${lesson.title}》没有对应的全景图格子`));
});

test('6 个空白格如实标记为缺系统讲解', () => {
  // 规格记录的缺口：A6 命令式 · D1 代词 · D2 介词 · D3 时间 · D4 man/es · E1 形容词 · E2 副词 · E3 连词
  const gaps = GRAMMAR_CELLS.filter(cell => !(cell.lessons || []).length).map(cell => cell.id);
  assert.deepEqual(gaps, ['A6', 'D1', 'D2', 'D3', 'D4', 'E1', 'E2', 'E3']);
  // E3 并列连词至今没有任何技能标签——这一格是真空，不能假装它只是"没讲解"。
  assert.equal(GRAMMAR_CELLS.find(cell => cell.id === 'E3').skills.length, 0);
});

test('词汇轴的三个数字与 Goethe 词表实时对得上', () => {
  const wortliste = JSON.parse(readFileSync(new URL('../tools/wortliste.json', import.meta.url), 'utf8'));
  const CONTENT_POS = new Set(['Substantiv', 'Verb', 'Adjektiv', 'Adverb',
    'partizipiales Adjektiv', 'Substantiv (nur im Plural)']);
  const norm = word => String(word).toLowerCase().replace(/^(der|die|das)\s+/, '').trim();
  const content = wortliste.filter(entry => CONTENT_POS.has(entry.pos));
  const mine = new Set(VOCAB.map(word => norm(word.de)));
  const covered = content.filter(entry => mine.has(norm(entry.lemma))).length;

  assert.equal(VOCAB_AXIS.goetheContentWords, content.length);
  assert.equal(VOCAB_AXIS.appCovered, covered);
  assert.equal(VOCAB_AXIS.appTotal, VOCAB.length);
});

test('分档边界不留缝：0 也必须落进某一档', () => {
  assert.equal(bandOf(100).key, 'strong');
  assert.equal(bandOf(70).key, 'strong');
  assert.equal(bandOf(69).key, 'ok');
  assert.equal(bandOf(40).key, 'ok');
  assert.equal(bandOf(1).key, 'weak');
  assert.equal(bandOf(0).key, 'none');
});

test('全景图视图与样式接线正确', () => {
  const view = readFileSync(new URL('../js/views/panorama.js', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
  const banner = readFileSync(new URL('../js/panorama-banner.js', import.meta.url), 'utf8');
  const today = readFileSync(new URL('../js/views/today.js', import.meta.url), 'utf8');

  assert.match(app, /\/panorama\$/, 'app.js 缺少 #/panorama 路由');
  assert.match(view, /export function renderPanorama/);
  // 100+ 个标签逐个读 localStorage 会拖慢首屏，必须传入已加载的 skills。
  assert.match(view, /skillStrength\(id, skills\)/);
  assert.match(banner, /href="#\/panorama"/);
  // 横幅必须在主页第一屏：打开就知道"还差多远"，不用先想去哪找。
  assert.match(today, /panoramaBanner\(\)/);
  for (const selector of ['.pano-grid', '.pano-cell', '.pano-cell.is-gap', '.pano-banner', '.band-strong']) {
    assert.ok(css.includes(selector), `缺少样式 ${selector}`);
  }
});

test('题型轴如实反映"写"和"口语自由表达"是空的', () => {
  const byId = new Map(EXAM_CELLS.map(cell => [cell.id, cell]));
  ['S1', 'S2', 'P2', 'P3', 'H2', 'H3', 'L2', 'L3'].forEach(id =>
    assert.equal(byId.get(id).status, 'none', `${id} 目前并没有实现，不能标成已具备`));
  assert.ok(EXAM_CELLS.every(cell => ['ready', 'partial', 'none'].includes(cell.status)));
});
