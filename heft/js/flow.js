// 把一课的数据排成一屏一屏的步骤。纯逻辑，不碰页面。
// 一天课做全套（2026-11-11 定，2026-11-14 改听的顺序）：预习 → 带字幕听（不考）→ 精读 → 词包 → 练习 → 不看字幕再听并答题 → 听写 → 跟读 → 复述 → 开口回应 → 完成页。
// 每一步带 seg（属于哪一环节）：顶部是整课一条进度尺，刻度是各环节的分界，尺下写当前环节的名字。
import { STORY_LESSONS, STORY_UNIT_SUMMARIES, STORY_SYLLABUS } from '../../data/story-lessons.js';

export const SEGMENTS = { preview: '预习', listen: '听', read: '精读', pack: '词包', practice: '练习', relisten: '再听', dictation: '听写', shadow: '跟读', retell: '复述', speak: '开口', finish: '' };

/** 连线题一屏最多 5 对（多了线会乱）：超过的平均拆成几屏。 */
export const splitMatch = ex => {
  if (ex.type !== 'match' || ex.pairs.length <= 5) return [ex];
  const k = Math.ceil(ex.pairs.length / 5), size = Math.ceil(ex.pairs.length / k);
  return Array.from({ length: k }, (_, i) => ({ ...ex, id: `${ex.id}-${i + 1}`, pairs: ex.pairs.slice(i * size, (i + 1) * size) }));
};

/** 两天课（days: 2，第 2 单元起）第 1 天学到哪：预习、听、精读、词包；第 2 天是练习、再听、听写、跟读、复述、开口。 */
const DAY1 = ['preview', 'listen', 'read', 'pack'];

/** day：0 = 一口气全套（一天课，或学完后重学）；1 / 2 = 两天课的第几天。 */
export function buildLesson(lesson, day = 0) {
  if (lesson.kind === 'pron') return buildPron(lesson);
  const steps = [], add = (seg, type, extra = {}) => steps.push({ seg, type, ...extra });
  // 预习：先认本课出场的人（“你”也有一屏），再认 4–6 个词
  for (const who of [...(lesson.cast || []), lesson.role]) add('preview', 'who', { who });
  lesson.preview.forEach((item, i) => add('preview', 'word', { item, i }));
  // 第一遍：像看短剧一样带字幕听，不考
  add('listen', 'watch');
  // 精读：一句一屏；语法点、发音点、小贴士插在它 after 的那一句后面
  lesson.lines.forEach((_, i) => {
    add('read', 'line', { i });
    lesson.cards.filter(c => c.after === i).forEach(card => {
      if (!card.drill) return add('read', 'card', { card });
      // 语法卡先做后讲：课文原句 → 一格一道小题 → 整张表 → 规则
      add('read', 'card', { card, part: 'src' });
      card.drill.forEach((_, n) => add('read', 'card', { card, part: 'q', n }));
      add('read', 'card', { card, part: 'full' }); add('read', 'card', { card, part: 'rule' });
    });
  });
  if (lesson.wordPack) {
    add('pack', 'pack');
    lesson.wordPack.exercises.flatMap(splitMatch).forEach(ex => add('pack', 'ex', { ex }));
  }
  lesson.exercises.flatMap(splitMatch).forEach(ex => add('practice', 'ex', { ex }));
  // 学完了再合上字幕听一遍，回答一个问题：这时能听懂
  add('relisten', 'listen'); add('relisten', 'listenQ');
  (lesson.listenMore || []).forEach(q => add('relisten', 'listenQ', { q })); // 盲听的第 2、3 个问题
  lesson.dictation.forEach(i => add('dictation', 'dictate', { i }));
  lesson.shadow.forEach(i => add('shadow', 'shadow', { i }));
  lesson.lines.forEach((l, i) => { if (l.who === lesson.role) add('retell', 'retell', { i }); });
  (lesson.speak || []).forEach(item => add('speak', 'speak', { item }));
  add('finish', 'finish');
  if (day === 1) return [...steps.filter(s => DAY1.includes(s.seg)), { seg: 'finish', type: 'finish', day: 1 }];
  if (day === 2) return steps.filter(s => !DAY1.includes(s.seg));
  return steps;
}

function buildPron(lesson) {
  const steps = [];
  for (const stop of lesson.stops) {
    steps.push({ seg: stop.id, type: 'stop', stop });
    // 小抄后面：照着小抄先自己读、再听原声（不判对错）
    (stop.tries || []).forEach(item => steps.push({ seg: stop.id, type: 'try', item }));
    (stop.exercises || []).flatMap(splitMatch).forEach(ex => steps.push({ seg: stop.id, type: ex.type === 'try' ? 'try' : ex.type === 'response' ? 'speak' : 'ex', ex, item: ex }));
  }
  steps.push({ seg: 'finish', type: 'finish' });
  return steps;
}

/** 单元总表 + 小测：总表 → 表格练习 → 没见过的听力 → 开口回应 → 结果。 */
export function buildQuiz(unit) {
  const steps = [];
  // 总表里第一次出现的人称先教再考：小对话 → 一格一道小空 → 再看总表
  if (unit.intro) {
    const lesson = { lines: unit.intro.lines }, card = unit.intro.card;
    steps.push({ seg: 'table', type: 'card', lesson, card, part: 'src' });
    card.drill.forEach((_, n) => steps.push({ seg: 'table', type: 'card', lesson, card, part: 'q', n }));
  }
  steps.push({ seg: 'table', type: 'unitTable' });
  unit.exercises.flatMap(splitMatch).forEach(ex => steps.push({ seg: 'table', type: 'ex', ex }));
  if (unit.quiz) {
    steps.push({ seg: 'quiz', type: 'quizListen' });
    unit.quiz.questions.forEach(ex => steps.push({ seg: 'quiz', type: 'ex', ex, counts: true }));
    unit.quiz.speak.forEach(item => steps.push({ seg: 'quiz', type: item.type === 'response' ? 'speak' : 'ex', item, ex: item, counts: true }));
  }
  steps.push({ seg: 'finish', type: 'quizResult' });
  return steps;
}

/**
 * 今天的复习（queue 来自 store.reviewQueue）：到期的卡 → 课后小材料（读 + 一道题）→ 隔天检查（开口说一句）。
 * 每一步自己带着它属于哪一课（lesson），因为一次复习会跨好几课。
 */
export function buildReview(queue, lessonOf) {
  const steps = [];
  for (const q of queue) {
    const lesson = lessonOf(q.lessonId);
    if (q.type === 'card') steps.push({ seg: 'cards', type: 'rvCard', lesson, word: q.word, key: q.key });
    else if (q.type === 'reading') {
      steps.push({ seg: `read-${lesson.id}`, type: 'rvRead', lesson });
      steps.push({ seg: `read-${lesson.id}`, type: 'ex', lesson, ex: lesson.reading.question, read: lesson.id });
    } else steps.push({ seg: 'check', type: 'speak', lesson, item: q.item, check: lesson.id });
  }
  return steps;
}

const OTHER_SEGS = { cards: '复习', check: '开口', table: '总表', quiz: '小测' };
/**
 * 整课一条进度尺（2026-11-14 改：不再每一段清零）。
 * 返回 { p: 走到哪了 0–1, marks: 各环节的分界 0–1, name: 现在这一环节叫什么 }。完成页不占格。
 */
export function rulerOf(steps, at) {
  const last = steps.at(-1).type, n = Math.max(1, last === 'finish' || last === 'quizResult' ? steps.length - 1 : steps.length), marks = [0];
  for (let i = 1; i < n; i++) if (steps[i].seg !== steps[i - 1].seg) marks.push(i / n);
  marks.push(1);
  const seg = steps[at].seg;
  const name = SEGMENTS[seg] ?? steps.find(s => s.seg === seg).stop?.title ?? (seg.startsWith('read-') ? '读一读' : OTHER_SEGS[seg] ?? '');
  return { p: Math.min(1, at / n), marks, name };
}

const norm = s => s.toLocaleLowerCase('de-DE').replace(/[^a-zäöüß0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const sameText = (a, b) => norm(a) === norm(b);

const lev = (x, y) => { const d = Array.from({ length: x.length + 1 }, (_, i) => [i]); for (let j = 1; j <= y.length; j++) d[0][j] = j; for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); return d[x.length][y.length]; };
const letters = w => [...w].filter(c => /[a-zäöüß0-9]/i.test(c));
const bare = w => letters(w).join('').toLocaleLowerCase('de-DE');

/** 一个词里逐字母对齐（不分大小写）。ops: keep（to = 原句里的写法）/ miss（漏的）/ extra（多打或打错的）。 */
function charOps(typed, word) {
  const a = letters(typed), b = letters(word), m = a.length, n = b.length, eq = (p, q) => p.toLocaleLowerCase('de-DE') === q.toLocaleLowerCase('de-DE');
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < m && j < n) {
    if (eq(a[i], b[j])) ops.push({ t: 'keep', ch: a[i++], to: b[j++] });
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ t: 'extra', ch: a[i++] });
    else ops.push({ t: 'miss', ch: b[j++] });
  }
  while (i < m) ops.push({ t: 'extra', ch: a[i++] });
  while (j < n) ops.push({ t: 'miss', ch: b[j++] });
  return ops;
}

/**
 * 听写批改（2026-11-14 改）：大小写和标点不算错。先按词对齐，再看每个词：
 *   ok 一样 · fix 只差一两个字母（逐字母改，ops 见 charOps）· swap 错了一半以上（整词划掉）· miss 漏了一个词 · extra 多打了一个词
 * 返回 { ok, exact, items }；exact = 连大小写标点都一样。items 里 typed 是你打的、word 是原句里的写法。
 */
export function correct(input, target) {
  const split = s => s.trim().split(/\s+/).map(raw => ({ raw, key: bare(raw) })).filter(w => w.key);
  const a = split(input), b = split(target), m = a.length, n = b.length;
  const near = (x, y) => lev(x, y) * 2 <= Math.max(x.length, y.length);
  const sub = (x, y) => x === y ? 0 : near(x, y) ? 0.5 : 1.2;
  const D = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) D[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + sub(a[i - 1].key, b[j - 1].key));
  const items = []; let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + sub(a[i - 1].key, b[j - 1].key)) {
      const x = a[--i], y = b[--j];
      items.push(x.key === y.key ? { t: 'ok', typed: x.raw, word: y.raw } : near(x.key, y.key) ? { t: 'fix', typed: x.raw, word: y.raw, ops: charOps(x.raw, y.raw) } : { t: 'swap', typed: x.raw, word: y.raw });
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) items.push({ t: 'extra', typed: a[--i].raw });
    else items.push({ t: 'miss', word: b[--j].raw });
  }
  items.reverse();
  return { ok: items.every(o => o.t === 'ok'), exact: input.trim() === target.trim(), items };
}

/** 开口题有几种可接受的说法：挑和识别结果最接近的那一句来评分/展示。 */
export function closest(answers, heard) {
  const h = norm(heard || '');
  if (!h) return answers[0];
  return answers.map(a => [a, lev(norm(a), h)]).sort((p, q) => p[1] - q[1])[0][0];
}

/** 把一句德语切成“词 / 非词”片段，精读里点词用。 */
export function pieces(de) {
  return (de.match(/[A-Za-zÄÖÜäöüß]+|[^A-Za-zÄÖÜäöüß]+/g) || []).map(t => ({ t, word: /[A-Za-zÄÖÜäöüß]/.test(t) }));
}
/** 词条拆成冠词 + 词：'der Kaffee' → { art: 'der', lemma: 'Kaffee' }。 */
export function entry(de) {
  const m = de.match(/^(der|die|das) (.+)$/);
  return m ? { art: m[1], lemma: m[2] } : { art: '', lemma: de };
}

const low = s => s.toLocaleLowerCase('de-DE');
/** 复习卡挖空：词在原句里出现的那一段在哪。找不到返回 null（测试保证每个词都找得到）。 */
export function clozeAt(lineDe, form) {
  const f = form.replace(/[?!.…]+$/, ''), at = low(lineDe).indexOf(low(f));
  return at < 0 ? null : { at, len: f.length };
}
/**
 * 小测结果：每条“现在你能”过没过。它名下的题有一道答错就算没过（评分连不上记的是 null，不算错）。
 * 返回 [{ text, failed: [没过的步骤下标], model: 这一条的示范句 }]。
 */
export function quizOutcome(unit, steps, results) {
  return unit.canDo.map((text, i) => {
    const mine = steps.map((s, at) => ({ s, at })).filter(x => x.s.counts && x.s.ex.can === i);
    return { text, failed: mine.filter(x => results[x.at] === false).map(x => x.at), model: mine.map(x => x.s.ex).find(e => e.type === 'response')?.model || '' };
  });
}

/* ---------- 手帐页的内容 ---------- */
const shelfOf = c => c.kind === 'grammar' ? 'gm' : c.kind === 'pron' ? 'pr' : c.shelf === 'grammar' ? 'gm' : c.shelf === 'pron' ? 'pr' : 'tp';
const G_TOTAL = STORY_SYLLABUS.flatMap(u => u[1]).filter(([, name]) => name).length;

/** 手帐页：学过的内容里发音 / 语法 / 文化各有什么（state 只用到哪几课、哪几次小测做完了）。 */
export function albumOf(state) {
  const done = l => (state.lessons[l.id]?.done ?? state.lessons[l.id]?.d1) != null; // 两天课学完第 1 天就收进手帐
  const texts = STORY_LESSONS.filter(l => l.lines), zero = STORY_LESSONS.find(l => l.kind === 'pron');
  const cards = STORY_LESSONS.filter(l => l.lines && done(l)).flatMap(l => l.cards.map(c => ({ c, l, shelf: shelfOf(c) })));
  const cribs = zero.stops.filter(s => s.rows).map(s => ({ s, got: done(zero) }));
  const units = STORY_SYLLABUS.map(([name, list], u) => {
    const sum = STORY_UNIT_SUMMARIES.find(x => x.unit === u + 1);
    return { n: u + 1, name, sum, sumGot: !!sum && state.quiz[`unit-${u + 1}`]?.done != null,
      lessons: list.map(([n, plan]) => { const l = texts.find(x => x.n === n), got = !!l && done(l);
        return { n, plan, got, main: got ? cards.find(x => x.l === l && x.c.kind === 'grammar') : null, extra: got ? cards.filter(x => x.l === l && x.shelf === 'gm' && x.c.kind !== 'grammar') : [] }; }) };
  });
  // 单词：学过的课的重点词；最近一次复习没选「认识」的算不熟
  const words = STORY_LESSONS.filter(l => l.lines && done(l)).flatMap(l => l.words.map(w => ({ w, l, weak: !!state.cards[`${l.id}:${w.de}`]?.weak })));
  return { cribs, pron: cards.filter(x => x.shelf === 'pr'), tips: cards.filter(x => x.shelf === 'tp'), units, words,
    count: { pr: cribs.filter(x => x.got).length + cards.filter(x => x.shelf === 'pr').length, gm: cards.filter(x => x.c.kind === 'grammar').length, gmAll: G_TOTAL, tp: cards.filter(x => x.shelf === 'tp').length, wd: words.length, weak: words.filter(x => x.weak).length } };
}
