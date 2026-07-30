// 提取所有需要发音的德语文本，输出 JSON 数组到 stdout
// 用法: node tools/extract_texts.mjs
import { PRON_LESSONS } from '../data/pronunciation.js';
import { GRAMMAR_LESSONS } from '../data/grammar.js';
import { VOCAB } from '../data/vocab.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { COURSE } from '../data/course.js';
import { DICT_ENTRIES } from '../data/dict-core.js';
import { EXAM_TASKS } from '../data/exam.js';

const texts = new Set();
const add = (t) => { if (t && t.trim()) texts.add(t.trim()); };

// 发音课：示范条目
// 拼读 6 格已改成卡片流（steps），不再是 sections/items 的文章结构。
for (const lesson of PRON_LESSONS)
  for (const step of lesson.steps || []) {
    add(step.de);        // speak 卡的例词/例句
    add(step.audioText); // listenChoice 的听辨音
    add(step.answer);    // dictation 的听写音
    if (Array.isArray(step.lines)) step.lines.forEach(line => add(line.de)); // observe 示范行
  }

// 语法课：例句（练习题含空格，不生成）
for (const lesson of GRAMMAR_LESSONS)
  for (const sec of lesson.sections || [])
    for (const ex of sec.examples || []) add(ex.de);

// 词汇：朗读形式（冠词+词）+ 例句
for (const w of VOCAB) {
  add(w.art ? `${w.art} ${w.de}` : w.de);
  add(w.ex);
  for (const s of w.sentences || []) add(s.de);
  for (const p of w.phrases || []) add(p.de);
  for (const form of Object.values(w.forms || {})) add(form);
}

// 全局查词的词条也可直接朗读；带冠词的名词与词卡口径一致。
for (const [lemma, candidates] of Object.entries(DICT_ENTRIES))
  for (const entry of candidates)
    add(entry.art ? `${entry.art} ${lemma}` : lemma);

// 阅读：逐句 + 全文（全文朗读按钮用）
for (const r of READINGS) {
  for (const s of r.sentences || []) add(s.de);
  add((r.sentences || []).map(s => s.de).join(' '));
}

// 精听包：逐句进主音频库做兜底（查词弹窗、慢速单句、SRS 错句复现都走 speak()）。
// 包本身的多音色 / 整段音频另由 tools/gen_listening_audio.py 生成，不进这里。
for (const pack of LISTENING_PACKS)
  for (const s of pack.sentences || []) add(s.de);

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

// 应试题库：只有听力题的 audioText 要发音。
// 阅读材料（邮件、告示牌）在真考试里本来就没有声音，不生成，也就不会白占音频体积。
for (const task of EXAM_TASKS)
  for (const item of task.items || []) add(item.audioText);

process.stdout.write(JSON.stringify([...texts], null, 0));
