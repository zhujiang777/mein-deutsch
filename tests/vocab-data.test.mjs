import test from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, THEMES } from '../data/vocab.js';

const POS_SET = new Set(['v.', 'adj.', 'adv.', 'num.', 'prep.', 'pron.', 'interj.', 'konj.', 'phrase']);
// 无人称/仅第三人称动词：forms 只要求 er 形
const IMPERSONAL = new Set(['regnen', 'wehtun']);

test('id 连续且唯一（wNNN 按位置生成）', () => {
  VOCAB.forEach((w, i) => {
    assert.equal(w.id, 'w' + String(i + 1).padStart(3, '0'), `${w.de} 的 id 应为位置序号`);
  });
});

test('每条有 de/zh/theme，theme 均已注册', () => {
  const themeIds = new Set(THEMES.map(t => t.id));
  for (const w of VOCAB) {
    assert.ok(w.de && w.zh, `${w.id} 缺 de/zh`);
    assert.ok(themeIds.has(w.theme), `${w.id} ${w.de} 的 theme '${w.theme}' 未注册`);
  }
});

test('名词：art 合法且 pl/noPl 二选一', () => {
  for (const w of VOCAB) {
    if (!w.art) continue;
    assert.ok(['der', 'die', 'das'].includes(w.art), `${w.id} ${w.de} 冠词非法`);
    assert.ok(w.pl || w.noPl, `${w.id} ${w.de} 既无复数也未标 noPl`);
    assert.ok(!(w.pl && w.noPl), `${w.id} ${w.de} pl 与 noPl 互斥`);
  }
});

test('非名词：pos 必填且在缩写集内', () => {
  for (const w of VOCAB) {
    if (w.art) continue;
    assert.ok(POS_SET.has(w.pos), `${w.id} ${w.de} 的 pos '${w.pos}' 非法或缺失`);
  }
});

test('动词：forms 六人称齐全，perfekt/praeteritum 至少其一', () => {
  for (const w of VOCAB) {
    if (w.pos !== 'v.') continue;
    assert.ok(w.forms, `${w.id} ${w.de} 缺 forms`);
    const keys = IMPERSONAL.has(w.de) ? ['er'] : ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];
    for (const k of keys) assert.ok(w.forms[k], `${w.id} ${w.de} forms 缺 ${k}`);
    assert.ok(w.forms.perfekt || w.forms.praeteritum, `${w.id} ${w.de} 缺 perfekt/praeteritum`);
  }
});

test('sentences/phrases 各项 de/zh 非空', () => {
  for (const w of VOCAB) {
    for (const s of w.sentences || []) assert.ok(s.de && s.zh, `${w.id} ${w.de} 有空例句`);
    for (const p of w.phrases || []) assert.ok(p.de && p.zh, `${w.id} ${w.de} 有空词组`);
    if (w.phrases) assert.ok(w.phrases.length <= 3, `${w.id} ${w.de} 词组超过 3 条`);
  }
});
