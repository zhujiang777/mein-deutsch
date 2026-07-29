// 应试板块的数据门禁。规格见 docs/product-shape.md 第 6 条 + docs/a1-panorama.md 题型轴。
//
// 这套门禁在第一阶段（题库还是空的）就建齐，是因为它拦的是"内容烂掉"，
// 而内容烂掉总是从第一条开始的。等写满了再补测试，前面那些就没人查了。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EXAM_CELLS } from '../data/panorama.js';
import { EXAM_PARTS, EXAM_TASKS, examPart, tasksForCell } from '../data/exam.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';

/* ---------- 官方口径 ---------- */

// 这张表是从官方模考平台 bfu.goethe.de/a1_sd1/ 抄下来的（2026-07 核实）。
// 它就是"准不准"的唯一答案：内容和界面文案都以它为准，改这张表之前先去官网核对。
const OFFICIAL = {
  H1: { teil: 1, count: 6, points: 6, plays: 2 },
  H2: { teil: 2, count: 4, points: 4, plays: 1 },
  H3: { teil: 3, count: 5, points: 5, plays: 2 },
  L1: { teil: 1, count: 5, points: 5 },
  L2: { teil: 2, count: 5, points: 5 },
  L3: { teil: 3, count: 5, points: 5 },
  S1: { teil: 1, count: 5, points: 5 },
  S2: { teil: 2, count: 1, points: 10 },
  P1: { teil: 1 },
  P2: { teil: 2 },
  P3: { teil: 3 },
};

test('11 格的题量、分值、播放次数与官方一致', () => {
  assert.equal(EXAM_PARTS.length, 11);
  for (const [id, spec] of Object.entries(OFFICIAL)) {
    const part = examPart(id);
    assert.ok(part, `缺少题型格 ${id}`);
    assert.equal(part.teil, spec.teil, `${id} 的 Teil 号不对`);
    if (spec.count !== undefined) assert.equal(part.count, spec.count, `${id} 的题量不对`);
    if (spec.points !== undefined) assert.equal(part.points, spec.points, `${id} 的分值不对`);
    if (spec.plays !== undefined) assert.equal(part.plays, spec.plays, `${id} 的播放次数不对`);
  }
  // 每个部分内部 Teil 号连续，不重不漏
  for (const part of ['hoeren', 'lesen', 'schreiben', 'sprechen']) {
    const teils = EXAM_PARTS.filter(item => item.part === part).map(item => item.teil).sort();
    assert.deepEqual(teils, teils.map((_, index) => index + 1), `${part} 的 Teil 号不连续`);
  }
});

test('三处曾经写错的题型描述，现在写对了', () => {
  const text = new Map(EXAM_CELLS.map(cell => [cell.id, `${cell.title} ${cell.sub || ''}`]));
  // 官方 Hören Teil 1 是三选一，不是判断对错
  assert.match(text.get('H1'), /三选一/);
  assert.ok(!/判断对错/.test(text.get('H1')));
  // 公共广播是判断对错，而且只播一遍 —— 全场唯一一处
  assert.match(text.get('H2'), /判断对错/);
  assert.match(text.get('H2'), /一遍/);
  assert.equal(EXAM_CELLS.filter(cell => cell.plays === 1).length, 1, '只播一遍的应该只有一处');
  // L2 是两个来源二选一，不是"从多条里找匹配的那条"
  assert.match(text.get('L2'), /二选一/);
  assert.ok(!/找匹配/.test(text.get('L2')));
});

test('文档里的题型表和数据对得上，且写明了核实来源', () => {
  const docs = readFileSync(new URL('../docs/a1-panorama.md', import.meta.url), 'utf8');
  const rows = docs.split('\n').filter(line => /^\|\s*(\*\*[听读写说]\*\*\s*)?[HLSP]\d\s*\|/.test(line));
  assert.equal(rows.length, 11, '题型表应该正好 11 行');
  const row = id => rows.find(line => line.includes(` ${id} |`));
  assert.match(row('H1'), /三选一/);
  assert.match(row('H2'), /判断对错/);
  assert.match(row('H2'), /一遍/);
  assert.match(row('L2'), /二选一/);
  // 核实来源必须写在文档里，否则下一个人不知道该信哪一版
  assert.ok(docs.includes('bfu.goethe.de'));
});

/* ---------- 题库门禁（第 5b 步开始填） ---------- */

test('每组考题的形状：id / 题量 / 选项 / 讲解 / 出处', () => {
  const ids = new Set();
  const cellIds = new Set(EXAM_CELLS.map(cell => cell.id));
  const readingIds = new Set(READINGS.map(item => item.id));
  const listeningIds = new Set(LISTENING_PACKS.map(item => item.id));

  for (const task of EXAM_TASKS) {
    assert.match(task.id, /^x-/, `${task.id} 必须用 x- 前缀，否则会和课程 / 精听的 id 撞车`);
    assert.ok(!ids.has(task.id), `重复的题组 id ${task.id}`);
    ids.add(task.id);
    assert.ok(cellIds.has(task.cellId), `${task.id} 指向不存在的题型格 ${task.cellId}`);

    const part = examPart(task.cellId);
    assert.equal(task.items.length, part.count,
      `${task.id} 有 ${task.items.length} 道题，官方 ${task.cellId} 是 ${part.count} 道——按官方题量出，不要随手写几道`);

    for (const item of task.items) {
      assert.ok(item.explain, `${task.id} 有题没有 explain——考试题不讲为什么等于没做`);
      if (item.type === 'choice') {
        assert.ok(Array.isArray(item.options) && item.options.length >= 2, `${task.id} 的选项不足`);
        assert.ok(Number.isInteger(item.a) && item.a >= 0 && item.a < item.options.length,
          `${task.id} 的答案下标越界`);
        // 判断对错题的两个选项恒定，界面和真考试答题卡才对得上
        if (item.options.length === 2 && item.options.includes('Richtig')) {
          assert.deepEqual(item.options, ['Richtig', 'Falsch']);
        }
      }
      assert.ok(!('q' in item), `${task.id} 用了 q 字段——renderChoice 读的是 prompt，写成 q 题干就是空白`);
    }

    const source = task.source || {};
    if (source.kind === 'reading') assert.ok(readingIds.has(source.id), `${task.id} 引用了不存在的精读 ${source.id}`);
    if (source.kind === 'listening') {
      assert.ok(listeningIds.has(source.id), `${task.id} 引用了不存在的精听包 ${source.id}`);
      const pack = LISTENING_PACKS.find(item => item.id === source.id);
      if (source.range) {
        assert.ok(source.range[0] >= 0 && source.range[1] < pack.sentences.length,
          `${task.id} 的句子区间越界`);
      }
    }
  }
});

// 双向诚实锁：说了"已具备"就必须真有题，说了"完全没有"就必须真的一组都没有。
// 全景图那一栏是产品的体检报告，报告造假比缺项严重得多。
test('题型格的 status 与题库互相对得上', () => {
  for (const cell of EXAM_CELLS) {
    const tasks = tasksForCell(cell.id);
    if (cell.status === 'ready') {
      assert.ok(tasks.length, `${cell.id} 标成已具备，却一组题都没有`);
    } else if (cell.status === 'none') {
      assert.equal(tasks.length, 0, `${cell.id} 标成完全没有，却已经有 ${tasks.length} 组题`);
    }
  }
});
