import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_LESSONS, STORY_CAST, STORY_NAMES, STORY_UNIT_SUMMARIES, WORD_VOICE, storyAudioItems } from '../data/story-lessons.js';
import { VOCAB } from '../data/vocab.js';

const tokens = s => (s.match(/[A-Za-zÄÖÜäöüß]+/g) || []).map(w => w.toLocaleLowerCase('de-DE'));
const texts = STORY_LESSONS.filter(l => l.kind !== 'pron');
const FREE = new Set([...STORY_NAMES, 'der', 'die', 'das', 'bwl']);
const checkExercise = (x, where) => {
  if (x.type === 'choice' || x.type === 'listenChoice') { assert(x.options.length >= 2 && x.answer < x.options.length, where); assert.equal(new Set(x.options).size, x.options.length, `${where} 选项重复`); }
  if (x.type === 'listenChoice' || x.type === 'spell') assert(STORY_CAST[x.voice], `${where} 没有这个声音：${x.voice}`);
  if (x.type === 'match') { assert(x.pairs.length >= 4, where); assert.equal(new Set(x.pairs.map(p => p.zh)).size, x.pairs.length, `${where} 配对右侧重复`); }
  if (x.type === 'assemble') assert(x.answer && x.distractors.every(d => !tokens(x.answer).includes(d.toLowerCase())), `${where} 干扰词出现在答案里`);
  if (x.type === 'response') { assert(x.answers.length >= 1 && x.model === x.answers[0], where); if (x.cue) assert(STORY_CAST[x.cue.who], where); }
};
const uniqueIds = (list, where) => assert.equal(new Set(list.map(x => x.id)).size, list.length, `${where} 题目 id 重复`);

test('故事课：课文长度、说话人、下标、预习与听前问题', () => {
  for (const l of texts) {
    const n = l.lines.length, count = l.lines.reduce((s, x) => s + tokens(x.de).length, 0);
    assert(count >= 30 && count <= 80, `${l.id} 有 ${count} 词`);
    assert.equal(l.days, l.unit === 1 ? 1 : 2, `${l.id} 天数`);
    l.lines.forEach(x => assert(STORY_CAST[x.who], `${l.id} 说话人 ${x.who}`));
    assert(l.lines.some(x => x.who === l.role));
    [...l.dictation, ...l.shadow, ...l.cards.map(c => c.after), ...l.words.map(w => w.line), ...l.preview.map(p => p.line)].forEach(i => assert(i >= 0 && i < n, `${l.id} 下标 ${i}`));
    l.shadow.forEach(i => assert.equal(l.lines[i].who, l.role, `${l.id} 跟读必须是我的台词`));
    assert(l.preview.length >= 4 && l.preview.length <= 6, `${l.id} 预习词 ${l.preview.length} 个`);
    assert(l.listenQuestion.key < l.preview.length, `${l.id} 听前问题的答案要落在预习词上`);
  }
});

test('故事课：每课重点词 5–8 个，引用的词库词条真实存在，原句能出填空', () => {
  for (const l of texts) {
    assert(l.words.length >= 5 && l.words.length <= 8, `${l.id} 重点词 ${l.words.length} 个`);
    for (const w of l.words) {
      if (w.id) assert(VOCAB.some(v => v.id === w.id), `${l.id} 词库没有 ${w.id}`);
      else assert(w.de && w.zh, `${l.id} 词库外的词要自带释义`);
      assert(l.lines[w.line].de.includes(w.form), `${l.id}：${w.form} 不在第 ${w.line} 句`);
    }
    if (l.wordPack) { l.wordPack.refs.forEach(id => assert(VOCAB.some(v => v.id === id), id)); l.wordPack.inText.forEach(t => assert(l.lines.some(x => tokens(x.de).includes(t)), `${l.id} 词包词 ${t} 没出现在课文里`)); }
  }
});

test('故事课：释义覆盖课文和小材料的每个词；语法卡、发音卡各 1 张且不超过两句', () => {
  for (const l of texts) {
    for (const x of [...l.lines, ...l.reading.lines]) tokens(x.de).forEach(t => assert(l.gloss[t], `${l.id} 缺释义：${t}`));
    for (const kind of ['grammar', 'pron']) {
      const cards = l.cards.filter(c => c.kind === kind);
      assert.equal(cards.length, 1, `${l.id} ${kind} 卡`);
      assert((cards[0].body.match(/。/g) || []).length <= 2, `${l.id} ${kind} 卡超过两句`);
    }
  }
});

test('故事课：课后小材料带 3–5 个新词，其余都是教过的词', () => {
  const known = new Set();
  for (const l of texts) {
    l.lines.forEach(x => tokens(x.de).forEach(t => known.add(t)));
    const fresh = new Set(l.reading.newWords.flatMap(w => w.forms));
    assert(l.reading.newWords.length >= 3 && l.reading.newWords.length <= 5, `${l.id} 小材料新词 ${l.reading.newWords.length} 个`);
    const used = l.reading.lines.flatMap(x => tokens(x.de));
    // 已教动词换个人称（komme → kommt）不算新词
    const sameVerb = t => /t$/.test(t) && ['e', 'st', 'en'].some(end => known.has(t.slice(0, -1) + end));
    used.forEach(t => assert(known.has(t) || fresh.has(t) || FREE.has(t) || sameVerb(t), `${l.id} 小材料用了没教的词：${t}`));
    fresh.forEach(t => assert(used.includes(t), `${l.id} 新词 ${t} 没出现在小材料里`));
    l.reading.lines.forEach(x => assert(STORY_CAST[x.who]));
    fresh.forEach(t => known.add(t));
  }
});

test('故事课：题目有效、id 不重复；隔天检查 3 道；第 0 课每站都有练习', () => {
  for (const l of texts) {
    const all = [l.listenQuestion, ...l.exercises, ...l.speak, ...l.reviews, l.reading.question, ...(l.wordPack?.exercises || [])];
    all.forEach(x => checkExercise(x, `${l.id}/${x.id}`)); uniqueIds(all, l.id);
    assert.equal(l.reviews.length, 3); assert(l.speak.length >= 2); assert(l.exercises.length >= 6);
  }
  const zero = STORY_LESSONS.find(l => l.kind === 'pron');
  assert(zero.stops.length >= 6);
  const all = zero.stops.flatMap(s => s.exercises);
  zero.stops.forEach(s => assert(s.exercises.length >= 3, `第 0 课 ${s.id} 练习太少`));
  all.forEach(x => checkExercise(x, `sl-00/${x.id}`)); uniqueIds(all, 'sl-00');
  for (const u of STORY_UNIT_SUMMARIES) { assert(STORY_LESSONS.some(l => l.id === u.after)); u.exercises.forEach(x => checkExercise(x, `unit-${u.unit}/${x.id}`)); }
});

test('故事课：配音清单里每条都有固定的声音', () => {
  const items = storyAudioItems();
  assert(items.length > 100);
  assert(STORY_CAST[WORD_VOICE]);
  items.forEach(i => { assert(STORY_CAST[i.voice], `没有这个声音：${i.voice}`); assert(i.text.trim()); });
  for (const l of texts) l.lines.forEach(s => assert(items.some(i => i.voice === s.who && i.text === (s.say || s.de))));
});
