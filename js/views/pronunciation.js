// 发音系统课：课程列表 + 课程详情（讲解 + 示范朗读 + 跟读）
import { PRON_LESSONS } from '../../data/pronunciation.js';
import { el, esc, icon, phraseRow, toast } from '../ui.js';
import { isDone, markDone } from '../storage.js';

export function renderPron(host, id) {
  if (id) return renderLesson(host, id);

  host.appendChild(el(`<h1 class="page-title">发音系统课</h1>`));
  host.appendChild(el(`<p class="page-sub">德语拼读非常规律，学完这 ${PRON_LESSONS.length} 课你就能“见词能读”。每个示范都支持正常朗读、慢速朗读和跟读检测。</p>`));

  PRON_LESSONS.forEach((lesson, i) => {
    const done = isDone('pron', lesson.id);
    host.appendChild(el(`<a class="list-item" href="#/pron/${lesson.id}">
      <span class="li-icon">${done ? icon('check') : `${i + 1}`}</span>
      <div class="li-main">
        <div class="li-title">${esc(lesson.title)}</div>
        <div class="li-sub">${esc(lesson.sub)}</div>
      </div>
      <span class="li-arrow">${icon('arrow')}</span>
    </a>`));
  });
}

function renderLesson(host, id) {
  const idx = PRON_LESSONS.findIndex(l => l.id === id);
  const lesson = PRON_LESSONS[idx];
  if (!lesson) { location.hash = '#/pron'; return; }

  host.appendChild(el(`<a class="back-link" href="#/pron">‹ 发音课列表</a>`));
  host.appendChild(el(`<h1 class="page-title">${esc(lesson.title)}</h1>`));

  const body = el(`<div class="lesson-body"></div>`);
  lesson.sections.forEach(sec => {
    if (sec.h) body.appendChild(el(`<h2>${esc(sec.h)}</h2>`));
    if (sec.p) sec.p.split('\n').forEach(t => body.appendChild(el(`<p>${esc(t)}</p>`)));
    if (sec.items) {
      const card = el(`<div class="card"></div>`);
      sec.items.forEach(it => card.appendChild(phraseRow(it)));
      body.appendChild(card);
    }
    if (sec.tip) body.appendChild(el(`<div class="tip"><b>提示</b> · ${esc(sec.tip)}</div>`));
  });
  host.appendChild(body);

  const doneBtn = el(`<button class="btn block" style="margin-top:16px">${isDone('pron', id) ? `${icon('check')} 已完成` : '标记本课完成'}</button>`);
  doneBtn.addEventListener('click', () => {
    const reward = markDone('pron', id);
    toast(reward ? `已完成 · +${reward.xpDelta} XP` : '已经记录过这节课');
    doneBtn.innerHTML = `${icon('check')} 已完成`;
  });
  host.appendChild(doneBtn);

  if (idx < PRON_LESSONS.length - 1) {
    host.appendChild(el(`<a class="btn secondary block" style="margin-top:10px" href="#/pron/${PRON_LESSONS[idx + 1].id}">下一课：${esc(PRON_LESSONS[idx + 1].title)} ›</a>`));
  }
}
