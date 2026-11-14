// 试学课入口：首页手帐本 → 一课一屏一屏走 → 完成页。产品规则见 docs/product.md，界面规范见设计系统 README。
import { load, save, clock, today, course, findItem, reviewQueue, completeLesson, completeQuiz, rateCard, submitCheck, markRead, savePlace, placeOf, blank, dayKey, KEY } from './store.js';
import { buildLesson, buildQuiz, buildReview, rulerOf } from './flow.js';
import { hydrate, lessonRuler, artReady, sceneOf, seal, ico } from './art.js';
import { RENDER } from './screens.js';
import './screens2.js';
import { getAssessmentSecrets, setAssessmentSecrets } from '../../js/secrets.js';
import { checkAssessmentConnection, assessmentConfigured, assessmentErrorMessage } from '../../js/pronunciation-assessment.js';
import { loadManifest, stop, sfx } from './audio.js';

const app = document.getElementById('app');
let state = load();
const now = () => clock(state);
const commit = () => save(state);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
const UNIT_COLOR = ['#e8b35e', '#ef907d', '#a5d3b6', '#94c3e8']; // 书签带：颜色跟单元走（illus-* 四色轮换）
const titleOf = item => item.kind === 'quiz' ? `第 ${item.unit.unit} 单元小测` : item.lesson.title;
const coverOf = item => item.kind === 'quiz' ? '单元小测' : (item.lesson.cover || item.lesson.title); // 名签上的短名
const numOf = item => item.kind === 'quiz' ? item.unit.unit : item.lesson.n;
const unitOf = item => item.kind === 'quiz' ? item.unit.unit : item.lesson.unit;
const shortOf = item => item.kind === 'quiz' ? '小测' : `第 ${item.lesson.n} 课`;
function planOf(item, hasReview) {
  const steps = item.kind === 'quiz' ? ['总表', '小测'] : item.lesson.kind === 'pron' ? ['字母', '读音', '门铃名牌'] : ['预习', '听', '精读', '听写', '跟读'];
  const mins = item.kind === 'quiz' ? 10 : 20;
  return [...(hasReview ? ['复习'] : []), ...steps].join('<i>→</i>') + `<i>·</i>约 ${mins} 分钟`;
}

// 底栏只画一次、固定在屏幕底部：三页切换时它不动，只有选中的那团蓝色滑过去（2026-11-17 改，原来首页的底栏画在会缩放的画布里，和另两页对不上）
const nav = document.body.appendChild(Object.assign(document.createElement('nav'), { className: 'hf-tabs', hidden: true }));
nav.innerHTML = `<i class="blob"></i>${[['today', '今天', '#/'], ['log', '记录', '#/log'], ['me', '我的', '#/me']].map(([k, t, href]) => `<a class="tab" data-tab="${k}" href="${href}"><svg viewBox="0 0 28 28"><use href="#t-${k}"/></svg>${t}</a>`).join('')}`;
function setTab(on) {
  const first = nav.hidden; nav.hidden = !on; nav.classList.remove('away');
  if (!on) return;
  const tab = nav.querySelector(`[data-tab=${on}]`), blob = nav.firstChild;
  nav.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === tab));
  if (first) blob.style.transition = 'none';
  blob.style.transform = `translateX(${tab.offsetLeft + tab.offsetWidth / 2 - 22}px)`;
  if (first) { blob.offsetWidth; blob.style.transition = ''; }
}

/* ================= 首页：画出来的一整本手帐 ================= */
const WIN = 'M89 266H323a7 7 0 0 1 7 7V509a7 7 0 0 1 -7 7H89a7 7 0 0 1 -7 -7V273a7 7 0 0 1 7 -7Z';
const COVER = 'M32 96H352a10 10 0 0 1 10 10V556a10 10 0 0 1 -10 10H32a10 10 0 0 1 -10 -10V106a10 10 0 0 1 10 -10Z';
function home() {
  const t = today(state, now()), items = course();
  const item = t.kind === 'go' ? t.item : (t.item || items.at(-1));
  // 今天的课学完了（或全部学完了）但还有到期的复习：按钮只剩「复习」
  const reviewOnly = t.kind === 'rest' && t.reviews > 0;
  const resting = t.kind === 'rest' && !reviewOnly, d = new Date(now());
  const scene = sceneOf(item.id);
  const art = scene
    ? `${scene.svg}${(scene.labels || []).map(l => `<span class="note" style="left:${l.x * 100}%;top:${l.y * 100}%">${l.art ? `<b class="md-art ${l.art}">${l.art}</b> ` : ''}${esc(l.de.replace(/^(der|die|das) /, ''))}</span>`).join('')}`
    : '<svg viewBox="0 0 300 158" style="height:174px"><use href="#scene" width="300" height="190"/></svg>';
  const resume = item.kind === 'lesson' && placeOf(state, item.id) > 0;
  const label = reviewOnly ? (t.cards ? `复习 ${t.cards} 张卡` : '复习') : t.reviews ? (t.cards ? `先复习 ${t.cards} 张卡` : '先复习') : resume ? '接着学' : '开始今天的课';
  const plan = reviewOnly ? '复习<i>·</i>约 5 分钟' : planOf(item, t.reviews > 0);
  const stamped = t.kind === 'rest' && t.item; // 今天真的学完了一课，才盖日期章
  const days = item.kind === 'lesson' && item.lesson.days > 1 ? '<p class="s">第 1 天</p>' : '';
  app.innerHTML = `<div class="hf-stagewrap"><div class="hf-stage nb">
    <div class="inner"><div class="nbart">${art}</div>
      <svg class="thick" viewBox="0 0 390 844"><defs><clipPath id="wclip2"><path d="${WIN}"/></clipPath></defs><path d="${WIN}" clip-path="url(#wclip2)" fill="none" stroke="#b6d5ef" stroke-width="5" transform="translate(2 2.5)"/></svg></div>
    <div class="cover"><svg class="nbsvg" viewBox="0 0 390 844" aria-hidden="true">
      <g filter="url(#rough-s)" stroke="#2f3237" stroke-width="1.4" stroke-linejoin="round">
        <path d="M42 104H359a10 10 0 0 1 10 10V563a10 10 0 0 1 -10 10H42a10 10 0 0 1 -10 -10V114a10 10 0 0 1 10 -10Z" fill="#fffdf8"/>
        <path d="M38 100H355.5a10 10 0 0 1 10 10V559.5a10 10 0 0 1 -10 10H38a10 10 0 0 1 -10 -10V110a10 10 0 0 1 10 -10Z" fill="#fffdf8"/></g>
      <path d="M290 104V52l9 7 9 -7V104z" fill="${UNIT_COLOR[unitOf(item) % 4]}" transform="translate(1.6 1.2)"/>
      <path d="M296 62V102" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>
      <g fill="none" stroke="#2f3237" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" filter="url(#rough-s)"><path d="M290 102V52l9 7 9 -7V102"/></g>
      <path d="${COVER}" transform="translate(2.4 2)" fill="#9cc6e8"/>
      <path d="M34 98V564" stroke="#83b3dc" stroke-width="22" transform="translate(2.4 0)"/>
      <path d="${COVER}" fill="url(#dots-ink)" opacity=".045"/>
      <g fill="none" stroke="#2f3237" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" filter="url(#rough-box)">
        <path d="${COVER}"/><path d="M46 99C46.6 246 45.6 396 46.4 563"/><path d="${WIN}"/></g>
      <text x="328" y="544" text-anchor="end" class="nbprint">MEIN DEUTSCH</text></svg>
      <div class="nblabel"><p class="t">${esc(coverOf(item))}</p>${days}
        ${stamped
          ? `<svg class="erl2" viewBox="0 0 118 62"><g filter="url(#rough-s)" fill="none" stroke="#9c6214"><rect x="2" y="2" width="114" height="58" rx="4" stroke-width="2.2" stroke-dasharray="70 2 90 3 60 2 200"/><rect x="6" y="6" width="106" height="50" rx="2" stroke-width=".9"/></g><text x="59" y="27" text-anchor="middle" class="e1" filter="url(#rough-s)">ERLEDIGT</text><text x="59" y="47" text-anchor="middle" class="e2" filter="url(#rough-s)">${d.getDate()}. ${MONTHS[d.getMonth()]}</text></svg>`
          : seal(numOf(item), 'stamp')}</div>
      ${resting
        ? `<p class="donel">${t.item ? '今天学完了' : '都学完了'}${t.next ? `<small>明天 · ${shortOf(t.next)}</small>` : ''}</p>`
        : `<div class="foot"><p class="plan ${t.reviews > 0 && !reviewOnly ? 'tight' : ''}">${plan}</p><button type="button" class="md-btn wide go">${label} ${ico('arrow')}</button></div>`}
      </div></div></div>`;
  hydrate(app); fitStage();
  // 课名按名签宽度收小；收到 22px 还放不下就换成两行（设计稿按 4 个字的课名画的，实际课名最长 9 个字）
  const tt = app.querySelector('.nblabel .t');
  for (let fs = 32; fs > 22 && tt.scrollWidth > tt.clientWidth; fs -= 2) tt.style.cssText = `font-size:${fs - 2}px;line-height:${fs + 4}px`;
  if (tt.scrollWidth > tt.clientWidth) tt.classList.add('wrap');
  if (stamped && sessionStorage.getItem('hf.stamp')) { sessionStorage.removeItem('hf.stamp'); setTimeout(() => sfx('stamp'), 560); } else app.querySelector('.erl2')?.classList.add('still');
  app.querySelector('.go')?.addEventListener('click', () => {
    const nb = app.querySelector('.nb'); sfx('tap');
    nb.classList.add('press'); nav.classList.add('away');
    setTimeout(() => nb.classList.add('open'), 70);
    setTimeout(() => { location.hash = t.reviews ? '#/review' : `#/${item.kind}/${item.id}`; }, 640);
  });
}
function fitStage() {
  const st = app.querySelector('.hf-stage'); if (!st) return;
  const k = Math.min(innerWidth / 390, (innerHeight - nav.offsetHeight) / 764); // 画布最下面 80 高原来是底栏的位置，现在底栏在画布外面
  st.style.transform = `scale(${k})`; st.parentNode.style.setProperty('--k', k);
}
addEventListener('resize', fitStage);

/* ================= 一课：一屏一屏走 ================= */
// keep：中途退出记住停在哪一步（只有课文课需要）。onStep(step, ok)：离开一步时把这一步的结果交出去（复习用它记卡片）。
function run({ id, steps, lesson = null, unit = null, start = 0, keep = false, back = '#/', onStep, onFinish }) {
  let at = Math.min(start, steps.length - 1), cleanups = [], detour = [];
  const results = {}, flags = {};
  app.innerHTML = `<div class="md-page hf-page"><div class="md-top"><button type="button" class="x" aria-label="关闭" data-i="x"></button><div class="hf-rul"></div></div>
    <div class="hf-body"></div><div class="hf-foot"></div></div>`;
  const page = app.firstChild, body = page.querySelector('.hf-body'), footEl = page.querySelector('.hf-foot'), rul = page.querySelector('.hf-rul');
  const R = lessonRuler(rul, rulerOf(steps, 0).marks);
  const leave = () => { cleanups.forEach(f => f()); cleanups = []; stop(); };
  page.querySelector('.x').addEventListener('click', () => { leave(); if (keep) { savePlace(state, id, at); commit(); } location.hash = back; });
  function foot(label, fn, { arrow = false, off = false } = {}) {
    if (!label) { footEl.innerHTML = ''; return; }
    footEl.innerHTML = `<button type="button" class="md-btn wide" ${off ? 'disabled' : ''}>${label}${arrow ? ` ${ico('arrow')}` : ''}</button>`;
    hydrate(footEl);
    footEl.firstChild.addEventListener('click', () => { if (fn) fn(); }, { once: true });
  }
  // 两个并排的按钮（复习卡的「没记住 / 记住了」）：左边白、右边蓝
  function foot2(a, b) {
    footEl.innerHTML = `<div class="md-two"><button type="button" class="md-btn sec">${a[0]}</button><button type="button" class="md-btn">${b[0]}</button></div>`;
    [a, b].forEach(([, fn], i) => footEl.querySelectorAll('button')[i].addEventListener('click', fn, { once: true }));
  }
  function next() {
    leave(); onStep?.(steps[at], results[at]);
    if (detour.length) at = detour.shift(); else at++;
    if (at >= steps.length) { onFinish(results); return; }
    if (keep) { savePlace(state, id, at); commit(); }
    show();
  }
  // 小测结果页的「再练一次」：把没过的那几题重做一遍，再回到结果页
  const redo = list => { if (!list.length) return; detour = [...list, at]; next(); };
  async function show() {
    const step = steps[at], r = rulerOf(steps, at);
    // 每一屏换一个新的容器：上一屏挂的点击监听跟着旧容器一起丢掉
    const fresh = body.cloneNode(false); page.replaceChild(fresh, page.querySelector('.hf-body'));
    rul.style.visibility = step.type === 'finish' || step.type === 'quizResult' ? 'hidden' : ''; R.set(r.p, r.name);
    footEl.innerHTML = ''; page.dataset.step = step.type; scrollTo(0, 0);
    const mine = at;
    await RENDER[step.type]({ lesson: step.lesson || lesson, unit, step, body: fresh, foot, foot2, redo, next: () => { if (mine === at) next(); }, flags: (flags[at] ||= {}), result: ok => { results[at] = ok; }, results, steps, cleanup: f => cleanups.push(f) });
    hydrate(page);
  }
  show();
}

function lessonPage(id, at) {
  const item = findItem(id); if (!item) { location.hash = '#/'; return; }
  const lesson = item.lesson, done = state.lessons[id]?.done != null;
  run({
    id, lesson, keep: true, steps: buildLesson(lesson), start: at != null ? +at : done ? 0 : placeOf(state, id), // #/lesson/sl-01/12 直接跳到第 12 步（调试用）
    onFinish: () => { if (!done) sessionStorage.setItem('hf.stamp', '1'); completeLesson(state, lesson, now()); commit(); location.hash = '#/'; },
  });
}
function quizPage(id, at) {
  const item = findItem(id); if (!item) { location.hash = '#/'; return; }
  const steps = buildQuiz(item.unit);
  run({ id, unit: item.unit, steps, start: +at || 0, onFinish: results => { completeQuiz(state, item.unit, steps.map((s, i) => s.counts ? results[i] ?? null : undefined).filter(x => x !== undefined), now()); commit(); location.hash = '#/'; } });
}

/* ================= 记录、我的 ================= */
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function logPage() {
  const days = Object.keys(state.log).sort().reverse(), todayK = dayKey(now());
  const entry = e => {
    if (e.type === 'review') return `<div class="e"><span class="ic"><svg viewBox="0 0 34 34"><use href="#cards"/></svg></span><div>${e.n ? `复习 ${e.n} 张卡` : '复习'}</div></div>`;
    const it = findItem(e.id); if (!it) return '';
    return `<div class="e"><span class="ic">${seal(numOf(it), 'md-mini-seal')}</span><div>${it.kind === 'quiz' ? esc(titleOf(it)) : `${shortOf(it)} · ${esc(it.lesson.title)}`}</div></div>`;
  };
  // 只列学过的日子，按月分组；没学的日子不出现
  const months = [];
  for (const k of days) {
    const d = new Date(`${k}T12:00`), m = k.slice(0, 7);
    if (months.at(-1)?.m !== m) months.push({ m, d, rows: [] });
    months.at(-1).rows.push(`<div class="lg ${k === todayK ? 'today' : ''}"><div class="dt"><b>${d.getDate()}</b><span>${k === todayK ? '今天' : WEEK[d.getDay()]}</span></div><div>${state.log[k].map(entry).join('')}</div></div>`);
  }
  app.innerHTML = `<div class="md-page hf-page tabbed">${months.length ? months.map(g => `<div class="hf-calh"><h2>${g.d.getMonth() + 1} 月</h2><span>${g.d.getFullYear()}</span></div><div class="md-log">${g.rows.join('')}</div>`).join('') : '<div class="hf-calh"><h2>学习记录</h2></div><p class="md-cap">还没有记录</p>'}
    </div>`;
  hydrate(app);
}
function mePage() {
  const sec = getAssessmentSecrets();
  app.innerHTML = `<div class="md-page hf-page tabbed"><h1 class="hf-h1">课程</h1>
    <div class="hf-toc">${course().map(i => { const done = (i.kind === 'quiz' ? state.quiz[i.id] : state.lessons[i.id])?.done != null; return `<a class="it ${done ? 'done' : ''}" href="#/${i.kind}/${i.id}"><span class="n">${i.kind === 'quiz' ? '测' : numOf(i)}</span><span class="t">${esc(titleOf(i))}</span>${done ? `<svg class="tick" viewBox="0 0 26 24"><use href="#tick"/></svg>` : ''}</a>`; }).join('')}</div>
    <h1 class="hf-h1 sub">发音评分</h1>
    <p class="md-cap hf-as" aria-live="polite">${assessmentConfigured() ? '已设置' : '还没设置'}</p>
    <div class="hf-dev"><button type="button" class="md-btn sec" data-act="test">测试评分</button><button type="button" class="md-btn sec" data-act="set">设置</button></div>
    <form class="hf-set" hidden><label>服务地址<input name="endpoint" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(sec.endpoint)}"></label>
      <label>访问码<input name="code" type="password" autocomplete="off" placeholder="${sec.accessCode ? '已保存，不改就留空' : ''}"></label><button type="submit" class="md-btn">保存</button></form>
    <h1 class="hf-h1 sub">试学</h1>
    <div class="hf-dev"><button type="button" class="md-btn sec" data-act="day">进入下一天</button><button type="button" class="md-btn sec" data-act="reset">清空试学进度</button><a class="md-btn sec" href="hoertest.html">选声音</a></div>
    <p class="md-cap hf-devcap">${state.shift ? `已往后拨 ${state.shift} 天` : ''}</p>
    </div>`;
  const status = app.querySelector('.hf-as'), form = app.querySelector('.hf-set');
  app.querySelector('[data-act=day]').addEventListener('click', () => { state.shift = (state.shift || 0) + 1; commit(); location.hash = '#/'; });
  app.querySelector('[data-act=reset]').addEventListener('click', () => { if (confirm('清空试学课的全部进度？')) { localStorage.removeItem(KEY); state = blank(); location.hash = '#/'; } });
  app.querySelector('[data-act=set]').addEventListener('click', () => { form.hidden = !form.hidden; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    setAssessmentSecrets({ endpoint: form.endpoint.value, accessCode: form.code.value || getAssessmentSecrets().accessCode });
    form.hidden = true; form.code.value = ''; status.textContent = assessmentConfigured() ? '已保存' : '还没设置';
  });
  // 先看服务通不通（地址、访问码），通了再去说一句真的评一次
  app.querySelector('[data-act=test]').addEventListener('click', async () => {
    status.textContent = '正在连接';
    try { await checkAssessmentConnection(); location.hash = '#/me/score'; }
    catch (err) { status.textContent = assessmentErrorMessage(err); if (err?.code === 'not-configured') form.hidden = false; }
  });
  hydrate(app);
}
function scoreTest() {
  const lesson = { role: 'Lin', lines: [{ who: 'Lin', de: 'Hallo! Ich bin Lin.', zh: '嗨！我是 Lin。' }] };
  run({ id: 'score-test', lesson, back: '#/me', steps: [{ seg: 'test', type: 'shadow', i: 0, detail: true }], onFinish: () => { location.hash = '#/me'; } });
}

/* ================= 复习：到期的卡 → 课后小材料 → 隔天检查，做完直接进今天的课 ================= */
function reviewPage() {
  const queue = reviewQueue(state, now());
  const after = () => { const t = today(state, now()); location.replace(t.kind === 'go' ? `#/${t.item.kind}/${t.item.id}` : '#/'); };
  if (!queue.length) { after(); return; }
  run({
    id: 'review', steps: buildReview(queue, id => findItem(id).lesson), onFinish: after,
    onStep: (step, ok) => {
      if (step.type === 'rvCard') { if (ok != null) rateCard(state, step.key, ok, now()); }
      else if (step.read) markRead(state, step.read, now());
      else if (step.check) submitCheck(state, step.check, ok !== false, now()); // 评分连不上不算没过
      commit();
    },
  });
}

/* ================= 路由 ================= */
function route() {
  stop();
  const [, name, id, at] = location.hash.split('/');
  setTab(!name ? 'today' : name === 'log' ? 'log' : name === 'me' && id !== 'score' ? 'me' : '');
  if (name === 'lesson') lessonPage(id, at);
  else if (name === 'quiz') quizPage(id, at);
  else if (name === 'log') logPage();
  else if (name === 'me') (id === 'score' ? scoreTest : mePage)();
  else if (name === 'review') reviewPage();
  else home();
}
addEventListener('hashchange', route);
Promise.all([artReady, loadManifest(), document.fonts?.ready]).then(route);
