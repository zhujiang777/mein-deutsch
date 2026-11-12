import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_LESSONS, STORY_UNIT_SUMMARIES } from '../data/story-lessons.js';
import { blank, course, today, reviewQueue, findItem, completeLesson, completeQuiz, rateCard, submitCheck, markRead, dayNum, CARD_GAPS } from '../heft/js/store.js';
import { buildLesson, buildQuiz, buildReview, rulerOf, correct, closest, pieces, entry, sameText, clozeAt, quizOutcome } from '../heft/js/flow.js';

const DAY = 86400000, T0 = new Date(2026, 10, 12, 9).getTime();
const L1 = STORY_LESSONS[1];

test('课程顺序：第 0 课 → 第 1–4 课 → 第 1 单元总表与小测', () => {
  assert.deepEqual(course().map(i => i.id), ['sl-00', 'sl-01', 'sl-02', 'sl-03', 'sl-04', 'unit-1']);
});

test('一天一课：学完今天这课就休息，明天才给下一课', () => {
  const s = blank();
  assert.equal(today(s, T0).item.id, 'sl-00');
  completeLesson(s, STORY_LESSONS[0], T0);
  const rest = today(s, T0 + 3600000);
  assert.equal(rest.kind, 'rest'); assert.equal(rest.item.id, 'sl-00'); assert.equal(rest.next.id, 'sl-01');
  const t = today(s, T0 + DAY);
  assert.equal(t.kind, 'go'); assert.equal(t.item.id, 'sl-01');
});

test('学完的课隔天进复习：卡 + 课后小材料 + 隔天检查', () => {
  const s = blank();
  completeLesson(s, L1, T0);
  assert.equal(reviewQueue(s, T0).length, 0, '当天不复习');
  const q = reviewQueue(s, T0 + DAY);
  assert.equal(q.filter(x => x.type === 'card').length, L1.words.length);
  assert.equal(q.filter(x => x.type === 'reading').length, 1);
  assert.equal(q.filter(x => x.type === 'check').length, 1);
  assert.equal(today(s, T0 + DAY).cards, L1.words.length);
});

test('复习卡：记住往后推，没记住明天再来，四次记住毕业', () => {
  const s = blank(); completeLesson(s, L1, T0);
  const [a, b] = reviewQueue(s, T0 + DAY).filter(x => x.type === 'card');
  rateCard(s, a.key, true, T0 + DAY); rateCard(s, b.key, false, T0 + DAY);
  assert.equal(s.cards[a.key].due, dayNum(T0 + DAY) + CARD_GAPS[1]);
  assert.equal(s.cards[b.key].due, dayNum(T0 + DAY) + 1);
  for (let i = 1; i < CARD_GAPS.length; i++) rateCard(s, a.key, true, T0 + DAY);
  assert.equal(s.cards[a.key].grad, true);
  assert.ok(!reviewQueue(s, T0 + 400 * DAY).some(x => x.key === a.key));
});

test('小材料读过不再出现；隔天检查两次通过后结束', () => {
  const s = blank(); completeLesson(s, L1, T0);
  markRead(s, L1.id, T0 + DAY);
  assert.ok(!reviewQueue(s, T0 + DAY).some(x => x.type === 'reading'));
  submitCheck(s, L1.id, false, T0 + DAY);
  assert.ok(reviewQueue(s, T0 + 2 * DAY).some(x => x.type === 'check'), '没过，第二天再查');
  submitCheck(s, L1.id, true, T0 + 2 * DAY); submitCheck(s, L1.id, true, T0 + 6 * DAY);
  assert.equal(s.checks[L1.id].grad, true);
});

test('重学一课不改原日期；学习日志只记学过的日子', () => {
  const s = blank(); completeLesson(s, L1, T0); completeLesson(s, L1, T0 + 5 * DAY);
  assert.equal(s.lessons[L1.id].done, dayNum(T0));
  assert.equal(Object.keys(s.log).length, 1);
});

test('全部学完后首页是休息态、没有下一课', () => {
  const s = blank();
  STORY_LESSONS.forEach((l, i) => completeLesson(s, l, T0 + i * DAY));
  assert.equal(today(s, T0 + 5 * DAY).item.id, 'unit-1');
  completeQuiz(s, STORY_UNIT_SUMMARIES[0], [], T0 + 5 * DAY);
  const t = today(s, T0 + 6 * DAY);
  assert.equal(t.kind, 'rest'); assert.equal(t.next, null);
});

test('一天课做全套：预习 → 听 → 精读 → 练习 → 听写 → 跟读 → 复述 → 开口 → 完成', () => {
  const steps = buildLesson(L1), segs = [...new Set(steps.map(s => s.seg))];
  assert.deepEqual(segs, ['preview', 'listen', 'read', 'practice', 'dictation', 'shadow', 'retell', 'speak', 'finish']);
  assert.equal(steps.filter(s => s.type === 'who').length, L1.cast.length + 1, '“你”也有一屏');
  assert.equal(steps.filter(s => s.type === 'line').length, L1.lines.length);
  assert.equal(steps.filter(s => s.type === 'card').length, L1.cards.length, '每张卡都排进去了');
  assert.equal(steps.filter(s => s.type === 'retell').length, L1.lines.filter(l => l.who === 'Lin').length);
  assert.ok(buildLesson(STORY_LESSONS[3]).some(s => s.type === 'pack'), '第 3 课带词包');
});

test('语法卡紧跟它 after 的那一句', () => {
  const steps = buildLesson(L1);
  for (const card of L1.cards) {
    const at = steps.findIndex(s => s.card === card);
    let k = at - 1; while (steps[k].type === 'card') k--;
    assert.equal(steps[k].i, card.after);
  }
});

test('第 0 课按小站排，每站先讲后练；每课最后一步都是完成页', () => {
  const steps = buildLesson(STORY_LESSONS[0]);
  assert.equal(steps.filter(s => s.type === 'stop').length, STORY_LESSONS[0].stops.length);
  for (const l of STORY_LESSONS) assert.equal(buildLesson(l).at(-1).type, 'finish');
  assert.equal(buildQuiz(STORY_UNIT_SUMMARIES[0]).at(-1).type, 'quizResult');
});

test('进度尺：按这一段的步数走', () => {
  const steps = buildLesson(L1), at = steps.findIndex(s => s.type === 'dictate');
  assert.deepEqual(rulerOf(steps, at), { n: L1.dictation.length, k: 0 });
  assert.deepEqual(rulerOf(steps, at + 2), { n: L1.dictation.length, k: 2 });
});

test('听写批改：漏的字母标 miss，多打的标 extra，全对才算对', () => {
  assert.equal(correct(' Wie bitte? Tim? ', 'Wie bitte? Tim?').ok, true);
  const r = correct('Das ist die Küe', 'Das ist die Küche');
  assert.equal(r.ok, false);
  assert.deepEqual(r.ops.filter(o => o.t === 'miss').map(o => o.ch), ['c', 'h']);
  assert.deepEqual(correct('Tschüßs', 'Tschüss').ops.filter(o => o.t !== 'keep').map(o => o.t + o.ch), ['extraß', 'misss']);
  assert.equal(correct('bist du neu hier?', 'Bist du neu hier?').ok, false, '大小写要对');
});

test('开口题：挑最接近的那句标准答案；点词切分与词条拆冠词', () => {
  assert.equal(closest(['Ja. Ich bin Lin.', 'Ja. Hallo! Ich bin Lin.'], 'ja hallo ich bin lin'), 'Ja. Hallo! Ich bin Lin.');
  assert.equal(closest(['A', 'B'], ''), 'A');
  assert.ok(sameText('Ja, bitte. Danke!', 'ja bitte danke'));
  assert.deepEqual(pieces('Oh nein, mein Bus!').filter(p => p.word).map(p => p.t), ['Oh', 'nein', 'mein', 'Bus']);
  assert.deepEqual(entry('der Kaffee'), { art: 'der', lemma: 'Kaffee' });
  assert.deepEqual(entry('Wie bitte?'), { art: '', lemma: 'Wie bitte?' });
});

test('每条要念的字都有正式录音（改了课文要重跑 voice-script.mjs 和 gen_story_audio.py）', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { createHash } = await import('node:crypto');
  const { storyAudioItems } = await import('../data/story-lessons.js');
  const dir = new URL('../audio/story/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'));
  for (const { voice, text } of storyAudioItems()) {
    const id = createHash('sha1').update(`${voice}|${text}`).digest('hex').slice(0, 12);
    assert.ok(manifest[id] > 0 && existsSync(new URL(`${id}.mp3`, dir)), `缺录音：${voice}「${text}」`);
  }
});

test('复习排成一步步：卡 → 小材料（读 + 一道题）→ 隔天检查；复习了几张卡记进日志', () => {
  const s = blank(); completeLesson(s, L1, T0);
  const steps = buildReview(reviewQueue(s, T0 + DAY), id => findItem(id).lesson);
  assert.deepEqual([...new Set(steps.map(x => x.type))], ['rvCard', 'rvRead', 'ex', 'speak']);
  assert.equal(steps.filter(x => x.type === 'rvCard').length, L1.words.length);
  assert.ok(steps.every(x => x.lesson === L1), '每一步都带着它属于哪一课');
  assert.equal(steps.at(-1).check, L1.id);
  const cards = reviewQueue(s, T0 + DAY).filter(x => x.type === 'card');
  rateCard(s, cards[0].key, true, T0 + DAY); rateCard(s, cards[1].key, false, T0 + DAY);
  const day = Object.keys(s.log).sort().at(-1);
  assert.equal(s.log[day].find(e => e.type === 'review').n, 2);
});

test('复习卡挖空：每个词都能在它那句课文里找到', () => {
  for (const l of STORY_LESSONS) for (const w of l.words || []) assert.ok(clozeAt(l.lines[w.line].de, w.form), `${l.id} ${w.de} 在第 ${w.line} 句里找不到「${w.form}」`);
  assert.deepEqual(clozeAt('Wie bitte? Tim?', 'Wie bitte?'), { at: 0, len: 9 });
});

test('单元小测：总表 → 表格练习 → 新听力 → 开口；每条“现在你能”都有题检验，错一道就要再练', () => {
  const unit = STORY_UNIT_SUMMARIES[0], steps = buildQuiz(unit);
  assert.deepEqual([...new Set(steps.map(x => x.seg))], ['table', 'quiz', 'finish']);
  assert.equal(steps.filter(x => x.type === 'quizListen').length, 1);
  const counted = steps.filter(x => x.counts);
  assert.equal(counted.length, unit.quiz.questions.length + unit.quiz.speak.length);
  unit.canDo.forEach((c, i) => assert.ok(counted.some(x => x.ex.can === i), `没有题检验「${c}」`));
  assert.ok(counted.every(x => x.ex.can >= 0 && x.ex.can < unit.canDo.length));
  const results = {}; steps.forEach((x, at) => { if (x.counts) results[at] = true; });
  assert.ok(quizOutcome(unit, steps, results).every(o => !o.failed.length));
  const bad = steps.findIndex(x => x.counts && x.ex.can === 2), skipped = steps.findIndex(x => x.counts && x.ex.can === 0);
  results[bad] = false; results[skipped] = null; // null = 评分连不上，不算错
  const out = quizOutcome(unit, steps, results);
  assert.deepEqual(out.map(o => o.failed.length), [0, 0, 1, 0, 0]);
  assert.deepEqual(out[2].failed, [bad]);
  assert.equal(out[1].model, 'Ich komme aus Singapur.');
});
