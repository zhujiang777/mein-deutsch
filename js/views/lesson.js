// 微步课路由：负责按 id 查课，外壳逻辑在 js/lesson-shell.js。
import { el } from '../ui.js';
import { runLessonShell } from '../lesson-shell.js';
import { findLesson } from '../../data/course.js';

/**
 * 运行一节微步课。
 * 兼容两种入参：课程 id（走 data/course.js 查找）或已经组装好的课对象。
 */
export function runLesson(host, lessonOrId, opts = {}) {
  const lesson = typeof lessonOrId === 'string' ? findLesson(lessonOrId) : lessonOrId;
  if (!lesson) { host.appendChild(el(`<p class="empty-hint">课程不存在</p>`)); return; }
  return runLessonShell(host, lesson, opts);
}

/* 独立路由入口 #/lesson/<id> */
export function renderLessonRoute(host, id) {
  runLesson(host, id, {
    onExit: () => { location.hash = '#/path'; },
    onComplete: () => { location.hash = '#/path'; },
  });
}
