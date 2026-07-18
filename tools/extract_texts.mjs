// 提取所有需要发音的德语文本，输出 JSON 数组到 stdout
// 用法: node tools/extract_texts.mjs
import { PRON_LESSONS } from '../data/pronunciation.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
import { VOCAB } from '../data/vocab.js';
import { READINGS } from '../data/readings.js';
import { COURSE } from '../data/course.js';

const texts = new Set();
const add = (t) => { if (t && t.trim()) texts.add(t.trim()); };

// 发音课：示范条目
for (const lesson of PRON_LESSONS)
  for (const sec of lesson.sections || [])
    for (const item of sec.items || []) add(item.de);

// 语法课：例句（练习题含空格，不生成）
for (const lesson of GRAMMAR_LESSONS)
  for (const sec of lesson.sections || [])
    for (const ex of sec.examples || []) add(ex.de);

// 词汇：朗读形式（冠词+词）+ 例句
for (const w of VOCAB) {
  add(w.art ? `${w.art} ${w.de}` : w.de);
  add(w.ex);
}

// 阅读：逐句 + 全文（全文朗读按钮用）
for (const r of READINGS) {
  for (const s of r.sentences || []) add(s.de);
  add((r.sentences || []).map(s => s.de).join(' '));
}

// 课程路径：步骤里的示例句、听力文本、拼句答案、跟读句、正确答案反馈音
for (const unit of COURSE)
  for (const lesson of unit.lessons || [])
    for (const step of lesson.steps || []) {
      if (step.example) add(step.example.de);
      add(step.audioText);
      add(step.answer);
      add(step.de); // speak / reproduce
      if (step.type === 'choice' && step.options) add(step.options[step.a]);
      if ((step.type === 'fill' || step.type === 'translate') && step.a) add(step.a[0]);
      if (step.type === 'match' && step.pairs) step.pairs.forEach(p => add(p.de));
      // scene / observe / roleplay：逐句德语进音频清单
      if (Array.isArray(step.lines)) step.lines.forEach(l => add(l.de));
    }

process.stdout.write(JSON.stringify([...texts], null, 0));
