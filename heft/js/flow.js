// 把一课的数据排成一屏一屏的步骤。纯逻辑，不碰页面。
// 一天课做全套（2026-11-11 定）：预习 → 带问题听 → 精读 → 词包 → 练习 → 听写 → 跟读 → 复述 → 开口回应 → 完成页。
// 每一步带 seg（属于哪一段），顶部进度尺按“这一段第几步”画。

export const SEGMENTS = { preview: '预习', listen: '听', read: '精读', pack: '词包', practice: '练习', dictation: '听写', shadow: '跟读', retell: '复述', speak: '开口', finish: '' };

export function buildLesson(lesson) {
  if (lesson.kind === 'pron') return buildPron(lesson);
  const steps = [], add = (seg, type, extra = {}) => steps.push({ seg, type, ...extra });
  // 预习：先认本课出场的人（“你”也有一屏），再认 4–6 个词
  for (const who of [...(lesson.cast || []), lesson.role]) add('preview', 'who', { who });
  lesson.preview.forEach((item, i) => add('preview', 'word', { item, i }));
  // 带着一个问题听全文
  add('listen', 'listen'); add('listen', 'listenQ');
  // 精读：一句一屏；语法点、发音点、小贴士插在它 after 的那一句后面
  lesson.lines.forEach((_, i) => {
    add('read', 'line', { i });
    lesson.cards.filter(c => c.after === i).forEach(card => add('read', 'card', { card }));
  });
  if (lesson.wordPack) {
    add('pack', 'pack');
    lesson.wordPack.exercises.forEach(ex => add('pack', 'ex', { ex }));
  }
  lesson.exercises.forEach(ex => add('practice', 'ex', { ex }));
  lesson.dictation.forEach(i => add('dictation', 'dictate', { i }));
  lesson.shadow.forEach(i => add('shadow', 'shadow', { i }));
  lesson.lines.forEach((l, i) => { if (l.who === lesson.role) add('retell', 'retell', { i }); });
  (lesson.speak || []).forEach(item => add('speak', 'speak', { item }));
  add('finish', 'finish');
  return steps;
}

function buildPron(lesson) {
  const steps = [];
  for (const stop of lesson.stops) {
    steps.push({ seg: stop.id, type: 'stop', stop });
    stop.exercises.forEach(ex => steps.push({ seg: stop.id, type: ex.type === 'response' ? 'speak' : 'ex', ex, item: ex }));
  }
  steps.push({ seg: 'finish', type: 'finish' });
  return steps;
}

/** 单元总表 + 小测：总表 → 表格练习 → 没见过的听力 → 开口回应 → 结果。 */
export function buildQuiz(unit) {
  const steps = [{ seg: 'table', type: 'unitTable' }];
  unit.exercises.forEach(ex => steps.push({ seg: 'table', type: 'ex', ex }));
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

/** 这一步在它那一段里是第几格、一共几格。 */
export function rulerOf(steps, at) {
  const seg = steps[at].seg;
  let first = at; while (first > 0 && steps[first - 1].seg === seg) first--;
  let last = at; while (last < steps.length - 1 && steps[last + 1].seg === seg) last++;
  return { n: last - first + 1, k: at - first };
}

const norm = s => s.toLocaleLowerCase('de-DE').replace(/[^a-zäöüß0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const sameText = (a, b) => norm(a) === norm(b);

/**
 * 听写批改：把学习者打的字和原句逐字符对齐。
 * 返回 { ok, ops }，ops 是 [{ t: 'keep'|'miss'|'extra', ch }]：miss = 原句有、你漏了（红笔补），extra = 你多打或打错的。
 * 大小写和标点也算（德语名词大写是要学的），首尾空格不算。
 */
export function correct(input, target) {
  const a = [...input.trim()], b = [...target.trim()];
  const m = a.length, n = b.length, dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { ops.push({ t: 'keep', ch: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ t: 'extra', ch: a[i++] });
    else ops.push({ t: 'miss', ch: b[j++] });
  }
  while (i < m) ops.push({ t: 'extra', ch: a[i++] });
  while (j < n) ops.push({ t: 'miss', ch: b[j++] });
  return { ok: ops.every(o => o.t === 'keep'), ops };
}

/** 开口题有几种可接受的说法：挑和识别结果最接近的那一句来评分/展示。 */
export function closest(answers, heard) {
  const h = norm(heard || '');
  if (!h) return answers[0];
  const dist = (x, y) => { const d = Array.from({ length: x.length + 1 }, (_, i) => [i]); for (let j = 1; j <= y.length; j++) d[0][j] = j; for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); return d[x.length][y.length]; };
  return answers.map(a => [a, dist(norm(a), h)]).sort((p, q) => p[1] - q[1])[0][0];
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
