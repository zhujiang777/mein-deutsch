// 课文课页面：首页唯一的按钮、两天流程、复习。规则见 docs/product.md。
// 题型复用旧零件：听写/角色扮演走 exercises.js，选择/填空走综合课的 task()。
import { findTextLesson } from '../../data/text-lessons.js';
import { esc, audioBtn, speakPractice } from '../ui.js?v=2';
import { speak, stopSpeak } from '../speech.js?v=2';
import { renderExercise } from '../exercises.js?v=6';
import { logActivity } from '../storage.js?v=4';
import { lines, task, wordTask } from './integrated.js?v=3';
import { recordWord, wordQueue, canonicalWordId } from '../integrated.js';
import { todayStep, textProgress, patchText, completeDay, dueTextReviews, reviewActivity, submitTextReview, noteMissed, textSession, saveTextSession, studiedTextWords, textKey, dayKey } from '../text-lesson.js';

function el(html) {
  const template = document.createElement('template'); template.innerHTML = html.trim();
  if (template.content.childElementCount === 1) return template.content.firstElementChild;
  const group = document.createElement('div'); group.append(template.content); return group;
}
const button = (text, action, cls = 'btn') => { const b = el(`<button class="${cls}" type="button">${esc(text)}</button>`); b.addEventListener('click', action); return b; };
const link = (title, href, sub = '') => el(`<a class="plain-row" href="${esc(href)}"><span>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><span aria-hidden="true">›</span></a>`);

let cleanups = [];
export function disposeTextView() { cleanups.forEach(f => f()); cleanups = []; stopSpeak(); }
const track = practice => { if (practice?.dispose) cleanups.push(() => practice.dispose()); return practice; };

const DAY_NAMES = { 1: '听懂 + 看懂', 2: '写下来 + 说出来' };
const STEPS = {
  1: ['review', 'blind', 'read', 'checks', 'words', 'done'],
  2: ['review', 'listen', 'dictation', 'shadow', 'roleplay', 'done'],
};
const STEP_NAMES = { review: '复习', blind: '盲听', read: '精读', checks: '小检查', words: '词义快查', listen: '再听一遍', dictation: '逐句听写', shadow: '跟读', roleplay: '角色扮演', done: '完成' };
const ROUNDS = ['有中文提示', '不给提示', '换成你自己的名字'];

/** 词的复习：已学课文里到期的词，用课文原句填空。 */
function wordReviewItems(limit = 8) {
  const studied = studiedTextWords();
  const byId = new Map(studied.map(w => [canonicalWordId(w.id), w]));
  return wordQueue(studied.map(w => w.id)).filter(id => byId.has(id)).slice(0, limit).map(id => ({ kind: 'word', ...byId.get(id) }));
}
function buildReview() {
  return [...wordReviewItems(), ...dueTextReviews().slice(0, 3).map(r => ({ kind: 'text', key: r.key, lessonId: r.lessonId, stage: r.stage, attempts: r.attempts }))];
}
// 数据里正确项写在前面方便核对；显示时按题目 id 固定打乱，避免“总选第一个”。
function shuffled(a) {
  const offset = [...a.id].reduce((n, c) => n + c.charCodeAt(0), 0) % a.options.length;
  const options = [...a.options.slice(offset), ...a.options.slice(0, offset)];
  return { ...a, options, answer: options.indexOf(a.options[a.answer]) };
}
const reviewCount = () => wordReviewItems().length + Math.min(3, dueTextReviews().length);

function playAll(sentences) {
  const token = ++playAll.token;
  return sentences.reduce((chain, s) => chain.then(() => token === playAll.token && new Promise(resolve => speak(s.de, { onend: resolve }))), Promise.resolve());
}
playAll.token = 0;

/* ---------- 首页：只有一个按钮 ---------- */
export function renderHome(host) {
  host.append(el('<header class="plain-head"><h1>今天</h1></header>'));
  const step = todayStep(), reviews = reviewCount();
  const card = el('<section class="study-current"></section>');
  if (step.kind === 'day') {
    const { lesson, day } = step, started = textSession(`day:${textKey(lesson)}:${day}`);
    card.append(el(`<p class="plain-muted">第 ${lesson.unit} 单元 · 课文</p><h2>${esc(lesson.title)}</h2><p>第 ${day} 天：${DAY_NAMES[day]} · 约 15 分钟</p>${reviews ? `<p class="plain-muted">先复习 ${reviews} 项，再学课文</p>` : ''}`));
    card.append(el(`<a class="btn" href="#/text/${lesson.id}/${day}">${started ? '继续' : '开始'}</a>`));
  } else if (step.kind === 'rest') {
    const { lesson, day } = step.next;
    card.append(el(`<h2>今天的课学完了 ✓</h2><p>明天：${esc(lesson.title)} · 第 ${day} 天（${DAY_NAMES[day]}）</p>`));
    if (reviews) card.append(el(`<a class="btn" href="#/text-review">复习 · ${reviews} 项</a>`));
    card.append(link('想多学一点：提前开始', `#/text/${lesson.id}/${day}`));
  } else {
    card.append(el('<h2>已有的课文都学完了 ✓</h2><p>下一课正在制作中。</p>'));
    if (reviews) card.append(el(`<a class="btn" href="#/text-review">复习 · ${reviews} 项</a>`));
  }
  host.append(card);
  host.append(el('<p class="plain-muted">旧课程和资料在「我的 → 资料库」。</p>'));
}

/* ---------- 复习：词（课文原句填空）+ 隔天检查 ---------- */
function runReviewItem(stage, item, s, save, next) {
  if (item.kind === 'word') {
    const lesson = findTextLesson(item.lessonId), ln = lesson?.lines[item.line];
    if (!ln) { next(); return; }
    const a = { id: `rv-${item.id}`, type: 'response', prompt: ln.de.replace(item.form, '___'), answers: [item.form], model: ln.de, explain: ln.zh };
    stage.append(el(`<p class="plain-muted">课文原句填空 · ${esc(ln.zh)}</p>`));
    const area = el('<div></div>'); stage.append(area);
    task(area, a, { state: s.answers[a.id], patch: x => { s.answers[a.id] = x; save(); }, attempt: correct => recordWord(item.id, 'recall', correct, `tl-review:${s.startedAt}:${item.id}:recall`), done: next });
    return;
  }
  const lesson = findTextLesson(item.lessonId);
  if (!lesson) { next(); return; }
  const phaseKey = `${item.key}:phase`, phase = s.answers[phaseKey] || 0;
  const advance = () => { s.answers[phaseKey] = phase + 1; save(); next({ stay: true }); };
  const area = el('<div></div>');
  if (phase === 0) {
    stage.append(el(`<h2>课后小材料 · ${esc(lesson.reading.title)}</h2>`));
    lines(stage, lesson.reading.lines); stage.append(area);
    task(area, shuffled(lesson.reading.question), { state: s.answers[`${item.key}:q`], patch: x => { s.answers[`${item.key}:q`] = x; save(); }, done: advance });
    return;
  }
  if (phase === 1) {
    const activity = reviewActivity(item);
    stage.append(el(`<h2>隔天检查 · ${esc(lesson.title)}</h2><p class="plain-muted">这次尽量不看提示，第一次就做对才算“记住了”。</p>`)); stage.append(area);
    task(area, activity, { state: s.answers[`${item.key}:check`], patch: x => { s.answers[`${item.key}:check`] = x; save(); }, done: st => {
      if (!s.answers[`${item.key}:submitted`]) { submitTextReview(item.key, !!st.correct && !st.hinted && st.attempts === 1); s.answers[`${item.key}:submitted`] = true; }
      advance();
    } });
    return;
  }
  // 之后：上次听写写错的句子再写一遍（最多 3 句，不影响检查结果）
  // 进入这一段时冻结名单：写对的句子会从记录里移除，不能让后面的句子跟着错位
  const missedKey = `${item.key}:missed`;
  if (!s.answers[missedKey]) { s.answers[missedKey] = (textProgress(lesson).missed || []).slice(0, 3); save(); }
  const idx = s.answers[missedKey][phase - 2];
  if (idx === undefined) { next(); return; }
  stage.append(el('<h2>上次写错的句子，再听写一次</h2>')); stage.append(area);
  renderExercise(area, { type: 'dictation', answer: lesson.lines[idx].de, typeOnly: true }, { onSubmit: ok => {
    if (ok) patchText(lesson, { missed: (textProgress(lesson).missed || []).filter(i => i !== idx) });
    area.append(button('继续', advance));
  } });
}

function reviewStep(stage, s, save, onDone) {
  const items = s.review || [];
  if (s.sub >= items.length) { onDone(); return; }
  stage.append(el(`<p class="plain-muted">复习 ${s.sub + 1} / ${items.length}</p>`));
  runReviewItem(stage, items[s.sub], s, save, ({ stay } = {}) => { if (!stay) s.sub++; save(); onDone({ rerender: true }); });
}

export function renderTextReview(host) {
  const key = `review:${dayKey()}`;
  let s = textSession(key);
  if (!s || s.done) { s = { sub: 0, answers: {}, startedAt: Date.now(), review: buildReview() }; saveTextSession(key, s); }
  const save = () => saveTextSession(key, s);
  const show = () => {
    disposeTextView(); host.replaceChildren();
    host.append(link('返回首页', '#/'));
    host.append(el('<header class="plain-head"><h1>复习</h1></header>'));
    const stage = el('<section class="pilot-stage"></section>'); host.append(stage);
    reviewStep(stage, s, save, ({ rerender } = {}) => {
      if (rerender) { show(); return; }
      s.done = true; save();
      stage.replaceChildren(el('<p>复习完成 ✓</p>'), link('返回首页', '#/'));
    });
  };
  show();
}

/* ---------- 一课的某一天 ---------- */
export function renderTextDay(host, id, dayText) {
  const lesson = findTextLesson(id), day = Number(dayText);
  if (!lesson || !STEPS[day]) { host.append(el('<header class="plain-head"><h1>未找到课文</h1></header>'), link('返回首页', '#/')); return; }
  if (day === 2 && !textProgress(lesson).d1) { host.append(el('<header class="plain-head"><h1>先学第 1 天</h1></header>'), link('去学第 1 天', `#/text/${id}/1`)); return; }
  const key = `day:${textKey(lesson)}:${day}`;
  let s = textSession(key);
  if (!s) { s = { step: 0, sub: 0, answers: {}, startedAt: Date.now(), review: buildReview() }; saveTextSession(key, s); }
  const steps = STEPS[day], save = () => saveTextSession(key, s);
  const nextStep = () => { s.step++; s.sub = 0; save(); show(); };
  const nextSub = () => { s.sub++; save(); show(); };

  host.append(link('返回首页', '#/'));
  const header = el(`<header class="lesson-top"><h1>${esc(lesson.title)}</h1><span class="plain-muted"></span></header>`); host.append(header);
  const stage = el('<section class="pilot-stage"></section>'); host.append(stage);

  function show() {
    disposeTextView(); stage.replaceChildren();
    const name = steps[s.step];
    const visible = steps.filter(x => x !== 'done' && (x !== 'review' || s.review?.length));
    header.querySelector('span').textContent = name === 'done' ? `第 ${day} 天 · 完成` : `第 ${day} 天 · ${STEP_NAMES[name]}（${visible.indexOf(name) + 1} / ${visible.length}）`;
    STEP_VIEWS[name]();
  }

  const STEP_VIEWS = {
    review() { reviewStep(stage, s, save, ({ rerender } = {}) => rerender ? show() : nextStep()); },

    blind() {
      const plays = s.answers.blindPlays || 0;
      stage.append(el(`<h2>不看文字，先听两遍</h2><p class="plain-muted">${esc(lesson.scene)}</p><p class="plain-muted">已听 ${plays} 遍</p>`));
      const play = button(plays ? '再听一遍' : '播放全文', () => {
        play.disabled = true; play.textContent = '正在播放…（约 30 秒）';
        playAll(lesson.lines).then(done => { if (done !== false) { s.answers.blindPlays = plays + 1; save(); show(); } });
      });
      stage.append(play);
      if (!plays) return;
      const area = el('<div></div>'); stage.append(area);
      task(area, shuffled(lesson.gist), { state: s.answers.gist, patch: x => { s.answers.gist = x; save(); }, done: nextStep });
    },

    read() {
      const seq = lesson.lines.flatMap((_, i) => [{ line: i }, ...lesson.cards.filter(c => c.after === i).map(card => ({ card }))]);
      if (s.sub >= seq.length) { nextStep(); return; }
      const item = seq[s.sub], last = s.sub === seq.length - 1;
      const readSoFar = lesson.lines.slice(0, seq.slice(0, s.sub).filter(x => x.line !== undefined).length);
      if (readSoFar.length) stage.append(el(`<div class="tl-sofar">${readSoFar.map(l => `<p class="plain-muted"><b>${esc(l.who)}</b> ${esc(l.de)}</p>`).join('')}</div>`));
      if (item.card) {
        const c = item.card;
        stage.append(el(`<h2>${esc(c.title)}</h2><p class="rule-copy">${esc(c.body)}</p>`));
        if (c.pairs) { const row = el('<div class="plain-actions"></div>'); c.pairs.forEach(w => { const b = el(`<span class="de">${esc(w)} </span>`); b.append(audioBtn(w)); row.append(b); }); stage.append(row); }
        if (c.example) {
          stage.append(el(`<p class="de">${esc(c.example)}</p>`));
          if (c.kind === 'pron') track(speakPractice(stage, c.example)); else stage.append(audioBtn(c.example));
        }
        stage.append(button(last ? '读完了' : '继续', nextSub));
        return;
      }
      const ln = lesson.lines[item.line], mine = ln.who === lesson.role;
      const tokens = ln.de.split(/([A-Za-zÄÖÜäöüß]+)/).map(t => /^[A-Za-zÄÖÜäöüß]+$/.test(t) ? `<button type="button" class="tl-word" data-w="${esc(t.toLocaleLowerCase('de-DE'))}">${esc(t)}</button>` : esc(t)).join('');
      const box = el(`<div class="tl-sentence" data-no-gloss><p class="plain-muted">${esc(ln.who)}${mine ? '（你的角色）' : ''}</p><p class="de tl-line">${tokens}</p><p class="tl-gloss plain-muted" role="status">点句子里的词看意思</p><details><summary>整句中文</summary><p>${esc(ln.zh)}</p></details></div>`);
      box.querySelectorAll('.tl-word').forEach(b => b.addEventListener('click', () => { box.querySelector('.tl-gloss').textContent = `${b.textContent}：${lesson.gloss[b.dataset.w] || '看整句中文'}`; }));
      const audio = el('<div class="plain-actions"></div>'); audio.append(audioBtn(ln.de), audioBtn(ln.de, { slow: true })); box.append(audio);
      stage.append(box);
      stage.append(button(last ? '读完了' : '下一句', nextSub));
      speak(ln.de);
    },

    checks() {
      const a = lesson.checks[s.sub];
      if (!a) { nextStep(); return; }
      stage.append(el(`<p class="plain-muted">小检查 ${s.sub + 1} / ${lesson.checks.length}</p>`));
      const area = el('<div></div>'); stage.append(area);
      task(area, shuffled(a), { state: s.answers[a.id], patch: x => { s.answers[a.id] = x; save(); }, done: nextSub });
    },

    words() {
      const w = lesson.words[s.sub];
      if (!w) { nextStep(); return; }
      const a = wordTask(w.id, 'text', `wq-${w.id}`);
      if (!a) { nextSub(); return; }
      const ln = lesson.lines[w.line];
      stage.append(el(`<p class="plain-muted">词义快查 ${s.sub + 1} / ${lesson.words.length} · 课文里：${esc(ln.de)}</p>`));
      const area = el('<div></div>'); stage.append(area);
      task(area, a, { state: s.answers[a.id], patch: x => { s.answers[a.id] = x; save(); }, done: nextSub, attempt: correct => {
        const result = recordWord(w.id, 'text', correct, `tl:${textKey(lesson)}:d1:${w.id}:text`);
        if (!result.enrolled) stage.append(el('<p class="plain-muted">今天的新词额度已满，这个词会在之后的复习里加入。</p>'));
      } });
    },

    listen() {
      stage.append(el('<h2>看着文字，再听一遍全文</h2>'));
      lines(stage, lesson.lines);
      stage.append(button('开始听写', nextStep));
    },

    dictation() {
      const idx = lesson.dictation[s.sub];
      if (idx === undefined) { nextStep(); return; }
      const total = lesson.dictation.length, st = s.answers[`dx${idx}`] ||= { tries: 0 };
      const area = el('<div></div>'); stage.append(area);
      renderExercise(area, { type: 'dictation', answer: lesson.lines[idx].de, typeOnly: true, hideAnswer: st.tries === 0, q: `第 ${s.sub + 1} / ${total} 句：听音频，打出你听到的句子（标点可以不写）` }, { onSubmit: ok => {
        st.tries++; st.ok = ok;
        if (!ok && st.tries === 1) noteMissed(lesson, idx);
        save();
        const actions = el('<div class="plain-actions"></div>');
        if (!ok && st.tries < 2) actions.append(button('再听一次，重写', show, 'btn secondary'));
        actions.append(button(s.sub + 1 < total ? '下一句' : '听写完成', nextSub));
        area.append(actions);
      } });
    },

    shadow() {
      const idx = lesson.shadow[s.sub];
      if (idx === undefined) { nextStep(); return; }
      const ln = lesson.lines[idx];
      stage.append(el(`<h2>跟读你的台词</h2><p class="plain-muted">第 ${s.sub + 1} / ${lesson.shadow.length} 句 · 先听标准，再录自己的对照；评分只作参考</p><p class="de">${esc(ln.de)}</p><p class="plain-muted">${esc(ln.zh)}</p>`));
      track(speakPractice(stage, ln.de));
      stage.append(button(s.sub + 1 < lesson.shadow.length ? '下一句' : '跟读完成', nextSub));
    },

    roleplay() {
      const round = s.sub;
      if (round >= ROUNDS.length) { nextStep(); return; }
      const name = textProgress(lesson).myName;
      if (round === 2 && !name) {
        stage.append(el('<h2>最后一遍：换成你自己的名字</h2><p class="plain-muted">输入你在德国用的名字（拼音或英文名都可以）。</p>'));
        const input = el('<input class="dict-input" type="text" maxlength="20" autocomplete="off" aria-label="你的名字">'); stage.append(input);
        stage.append(button('开始', () => { const v = input.value.trim(); if (v) { patchText(lesson, { myName: v }); show(); } }));
        return;
      }
      const swap = text => round === 2 ? text.replace(/\bLin\b/g, name) : text;
      const userRole = round === 2 ? name : lesson.role;
      const roleLines = lesson.lines.map(ln => {
        const mine = ln.who === lesson.role;
        return { who: mine ? userRole : ln.who, de: swap(ln.de), zh: mine && round === 1 ? '轮到你了（这次不给中文提示）' : swap(ln.zh) };
      });
      const area = el('<div></div>'); stage.append(area);
      renderExercise(area, { type: 'roleplay', title: `第 ${round + 1} / 3 遍 · ${ROUNDS[round]}`, userRole, lines: roleLines }, { onSubmit: nextSub });
    },

    done() {
      if (!s.completed) {
        completeDay(lesson, day);
        logActivity({ items: day === 1 ? lesson.checks.length + lesson.words.length : lesson.dictation.length, ok: 0, lessons: day === 2 ? 1 : 0, completionId: key });
        s.completed = true; save();
      }
      if (day === 1) stage.append(el(`<h2>第 1 天完成 ✓</h2><p>今天的 ${lesson.words.length} 个词明天开始复习。</p><p class="plain-muted">明天：逐句听写 + 跟读 + 角色扮演，约 15–20 分钟。</p>`));
      else stage.append(el('<h2>这一课学完了 ✓</h2><p>两天后会出现一次不给提示的检查，做对才算“记住了”。</p>'));
      stage.append(link('返回首页', '#/'));
      stage.append(button('从头再练一遍', () => { saveTextSession(key, null); host.replaceChildren(); renderTextDay(host, id, dayText); }, 'btn secondary'));
    },
  };

  show();
}
