// 精读/精听 → 语法课的跳转条。
//
// needs = 作者声明的前置语法（grammarPrereqs），掌握度不够就标红提示先去补；
// shows = 正文里检测到、但作者没列的语法，标成"顺带练到"。
// 两者分开显示：一个是读之前的门槛，一个是读完的收获，混在一起就没法据此决定先做什么。
import { contentGrammarNeeds, contentGrammarShows } from '../data/grammar-index.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
import { grammarStrength } from './content-readiness.js';
import { el, esc } from './ui.js';

const TITLES = new Map(GRAMMAR_LESSONS.map(lesson => [lesson.id, lesson.sub || lesson.title]));
const WEAK = 40;

/** 一份内容的语法跳转条；没有可显示的语法点时返回 null。 */
export function grammarChips(item) {
  const needs = contentGrammarNeeds(item);
  const extra = contentGrammarShows(item).filter(id => !needs.includes(id));
  if (!needs.length && !extra.length) return null;

  const wrap = el(`<div class="grammar-links"></div>`);
  if (needs.length) {
    const row = el(`<div class="chip-row"></div>`);
    row.appendChild(el(`<span class="grammar-links-label">需要的语法</span>`));
    needs.forEach(id => {
      const strength = grammarStrength(id);
      const state = strength >= WEAK ? 'is-strong' : 'is-weak';
      row.appendChild(el(`<a class="chip ${state}" href="#/grammar/${esc(id)}">${esc(TITLES.get(id) || id)} · ${strength}%</a>`));
    });
    wrap.appendChild(row);
  }
  if (extra.length) {
    const row = el(`<div class="chip-row" style="margin-top:8px"></div>`);
    row.appendChild(el(`<span class="grammar-links-label">顺带练到</span>`));
    extra.forEach(id => row.appendChild(
      el(`<a class="chip" href="#/grammar/${esc(id)}">${esc(TITLES.get(id) || id)}</a>`)));
    wrap.appendChild(row);
  }
  return wrap;
}
