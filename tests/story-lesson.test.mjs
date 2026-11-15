import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_LESSONS, STORY_CAST, STORY_NAMES, STORY_UNIT_SUMMARIES, WORD_VOICE, storyAudioItems } from '../data/story-lessons.js';
import { VOCAB } from '../data/vocab.js';

const lowerDe = s => s.toLocaleLowerCase('de-DE');
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

test('故事课：题目有效、id 不重复；隔天检查 3 道；第 0 课是字母表 + 小抄', () => {
  for (const l of texts) {
    const all = [l.listenQuestion, ...l.exercises, ...l.speak, ...l.reviews, l.reading.question, ...(l.wordPack?.exercises || [])];
    all.forEach(x => checkExercise(x, `${l.id}/${x.id}`)); uniqueIds(all, l.id);
    assert.equal(l.reviews.length, 3); assert(l.speak.length >= 2); assert(l.exercises.length >= 6);
  }
  const zero = STORY_LESSONS.find(l => l.kind === 'pron');
  // 轻量版（2026-11-14）：字母表 + 三张拼读小抄 + 门铃；不做辨音题，小抄后面是“先读再听”
  assert.equal(zero.stops.length, 5);
  const sheets = zero.stops.filter(s => s.rows);
  assert.equal(sheets.length, 3);
  for (const s of sheets) {
    assert(s.tries.length >= 2, `第 0 课 ${s.id} 要有先读再听的词`);
    for (const r of [...s.rows, ...s.tries]) assert(/\[.+?\]/.test(r.w), `第 0 课 ${s.id} ${r.w} 要标出读音`);
    for (const r of s.rows) assert(!/拼音|英语/.test(r.c), `第 0 课 ${s.id} ${r.s} 不拿拼音、英语做类比`);
  }
  const all = zero.stops.flatMap(s => s.exercises || []).filter(x => x.type !== 'try');
  all.forEach(x => checkExercise(x, `sl-00/${x.id}`)); uniqueIds(all, 'sl-00');
  for (const l of texts) for (const c of l.cards) if (c.kind === 'pron') assert(!/拼音|英语/.test(c.title + c.body), `${l.id} 发音点不拿拼音、英语做类比`);
  for (const u of STORY_UNIT_SUMMARIES) { assert(STORY_LESSONS.some(l => l.id === u.after)); u.exercises.forEach(x => checkExercise(x, `unit-${u.unit}/${x.id}`)); }
});

test('故事课：配音清单里每条都有固定的声音', () => {
  const items = storyAudioItems();
  assert(items.length > 100);
  assert(STORY_CAST[WORD_VOICE]);
  items.forEach(i => { assert(STORY_CAST[i.voice], `没有这个声音：${i.voice}`); assert(i.text.trim()); });
  for (const l of texts) l.lines.forEach(s => assert(items.some(i => i.voice === s.who && i.text === (s.say || s.de))));
});

test('首页名签放得下：课名或封面短名不超过 5 个字', () => {
  for (const l of STORY_LESSONS) assert.ok([...(l.cover || l.title)].length <= 5, `${l.id} 名签上的字太长：${l.cover || l.title}`);
});

test('先教后考：练习、隔天检查、开口题和单元总表里的德语词，前面都教过', () => {
  // “教过” = 之前的课文、预习词、重点词、口头语、词包、语法表里点亮过的格子、发音例词、第 0 课的例词、小材料的新词
  const known = new Set(FREE);
  const learn = s => tokens(String(s || '')).forEach(t => known.add(t));
  STORY_LESSONS.filter(l => l.kind === 'pron').forEach(l => l.stops.forEach(st => { (st.rows || []).forEach(r => learn(r.w)); (st.tries || []).forEach(t => learn(t.w)); (st.blind || []).forEach(b => learn(b[2] || b[0])); }));
  const german = x => x.type === 'match' ? x.pairs.map(p => p.de)
    : x.type === 'assemble' ? [x.answer, ...x.distractors]
    : x.type === 'response' ? [...x.answers, x.cue?.de]
    : [x.audioText, /[一-鿿]/.test(x.prompt) ? '' : x.prompt, ...x.options.filter(o => !/[一-鿿]/.test(o))];
  const bad = [];
  // 单个字母是拼写题，不算词
  // 教过的规则动词换一个教过的词尾（kochen → kochst）不算新词
  const ENDS = ['en', 'st', 'e', 't'];
  const sameVerb = t => ENDS.some(a => t.endsWith(a) && ENDS.some(b => known.has(t.slice(0, -a.length) + b)));
  const check = (x, where) => german(x).forEach(g => tokens(String(g || '')).forEach(t => { if (t.length > 1 && !known.has(t) && !sameVerb(t)) bad.push(`${where}：${t}`); }));
  for (const l of texts) {
    l.lines.forEach(x => learn(x.de));
    [...l.preview, ...l.words, ...(l.phrases || [])].forEach(w => learn(w.de));
    (l.wordPack?.items || []).forEach(w => learn(w.de));
    l.cards.forEach(c => { (c.on || []).forEach(i => c.table.rows[i].forEach(learn)); (c.drill || []).forEach(d => learn(d.no)); (c.pairs || []).forEach(learn); (c.contrast || []).flat().forEach(learn); learn(c.example); (c.words || []).forEach(learn); });
    [...(l.wordPack?.exercises || []), ...l.exercises, ...(l.speak || []), ...(l.reviews || [])].forEach(x => check(x, `${l.id} ${x.id}`));
    l.reading.newWords.forEach(w => w.forms.forEach(f => known.add(f)));
    const u = STORY_UNIT_SUMMARIES.find(s => s.after === l.id);
    if (!u) continue;
    // 总表里新出现的人称必须先有小对话和小空（intro），练习才能考
    if (u.intro) { u.intro.lines.forEach(x => learn(x.de)); u.intro.card.drill.forEach(d => { assert(u.intro.lines[d.line].de.includes(d.de) && d.de.includes(d.v), `单元 ${u.unit} 小空对不上原句：${d.de}`); learn(d.no); assert.equal(lowerDe(u.intro.card.table.rows[d.row][d.col || 1]), lowerDe(d.v), `单元 ${u.unit} 小空和表格对不上：${d.v}`); }); }
    // newRows 只是总表下面的例句，亮一下不算教过
    u.exercises.forEach(x => check(x, `单元 ${u.unit} 总表 ${x.id}`));
    if (u.quiz) [...u.quiz.questions, ...u.quiz.speak].forEach(x => check(x, `单元 ${u.unit} 小测 ${x.id}`));
  }
  assert.deepEqual(bad, [], `用了前面没教过的词：\n${bad.join('\n')}`);
});
