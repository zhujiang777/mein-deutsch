// 一次性脚本：把官方 A1 词表里「内容已经用到、但词汇站没有」的实词补进 data/vocab.js。
// 例句不手写——从现有课文/精读/精听里挑最合适的一句，顺带证明这些词确实在语境中出现过。
import { readFileSync, writeFileSync } from 'node:fs';
import { COURSE } from '../data/course.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { VOCAB } from '../data/vocab.js';
import { words } from '../tools/a1-coverage.mjs';
import { candidates } from '../tools/a1-coverage.mjs';
import { DICT_FORMS } from '../data/dict-core.js';

// art:null 表示非名词，此时 pos 必填；名词必须给 pl 或 noPl。
const NOUNS = [
  ['Achtung', 'die', null, '注意；当心', 'gruss', true],
  ['Ausgang', 'der', 'Ausgänge', '出口', 'stadt'],
  ['Blume', 'die', 'Blumen', '花', 'wohnen'],
  ['Café', 'das', 'Cafés', '咖啡馆', 'stadt'],
  ['Dank', 'der', null, '感谢', 'gruss', true],
  ['Eingang', 'der', 'Eingänge', '入口', 'stadt'],
  ['Eintritt', 'der', 'Eintritte', '入场；门票', 'zahl'],
  ['Ende', 'das', 'Enden', '结尾；结束', 'zahl'],
  ['Euro', 'der', 'Euro', '欧元', 'zahl'],
  ['Familienname', 'der', 'Familiennamen', '姓', 'person'],
  ['Film', 'der', 'Filme', '电影', 'arbeit'],
  ['Foto', 'das', 'Fotos', '照片', 'arbeit'],
  ['Geburtsort', 'der', 'Geburtsorte', '出生地', 'person'],
  ['Gespräch', 'das', 'Gespräche', '谈话；对话', 'arbeit'],
  ['Gruppe', 'die', 'Gruppen', '小组；团体', 'person'],
  ['Hund', 'der', 'Hunde', '狗', 'wohnen'],
  ['Information', 'die', 'Informationen', '信息', 'arbeit'],
  ['Karte', 'die', 'Karten', '卡片；票；地图', 'arbeit'],
  ['Kasse', 'die', 'Kassen', '收银台', 'stadt'],
  ['Kilo', 'das', 'Kilo', '公斤', 'zahl'],
  ['Kino', 'das', 'Kinos', '电影院', 'stadt'],
  ['Kuchen', 'der', 'Kuchen', '蛋糕', 'essen'],
  ['Mittag', 'der', 'Mittage', '中午', 'zahl'],
  ['Moment', 'der', 'Momente', '片刻；时刻', 'zahl'],
  ['Nachmittag', 'der', 'Nachmittage', '下午', 'zahl'],
  ['Papier', 'das', 'Papiere', '纸；文件', 'arbeit'],
  ['Pause', 'die', 'Pausen', '休息；课间', 'zahl'],
  ['Preis', 'der', 'Preise', '价格；奖', 'zahl'],
  ['Raum', 'der', 'Räume', '房间；空间', 'wohnen'],
  ['Reise', 'die', 'Reisen', '旅行', 'stadt'],
  ['Stock', 'der', 'Stockwerke', '楼层', 'wohnen'],
  ['Tasche', 'die', 'Taschen', '包；口袋', 'wohnen'],
  ['Teil', 'der', 'Teile', '部分', 'zahl'],
  ['Unterricht', 'der', null, '课；教学', 'arbeit', true],
  ['Wiedersehen', 'das', null, '再见；重逢', 'gruss', true],
  ['Wochenende', 'das', 'Wochenenden', '周末', 'zahl'],
  ['Wort', 'das', 'Wörter', '词；单词', 'arbeit'],
];

// [不定式, 中文, ich, du, er, wir, ihr, sie, perfekt]
const VERBS = [
  ['besuchen', '拜访；上（学）', 'besuche', 'besuchst', 'besucht', 'besuchen', 'besucht', 'besuchen', 'hat besucht'],
  ['bitten', '请求', 'bitte', 'bittest', 'bittet', 'bitten', 'bittet', 'bitten', 'hat gebeten'],
  ['buchstabieren', '拼写', 'buchstabiere', 'buchstabierst', 'buchstabiert', 'buchstabieren', 'buchstabiert', 'buchstabieren', 'hat buchstabiert'],
  ['enden', '结束', 'ende', 'endest', 'endet', 'enden', 'endet', 'enden', 'hat geendet'],
  ['frühstücken', '吃早餐', 'frühstücke', 'frühstückst', 'frühstückt', 'frühstücken', 'frühstückt', 'frühstücken', 'hat gefrühstückt'],
  ['halten', '拿着；停靠', 'halte', 'hältst', 'hält', 'halten', 'haltet', 'halten', 'hat gehalten'],
  ['laufen', '跑；走', 'laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen', 'ist gelaufen'],
  ['lieben', '爱', 'liebe', 'liebst', 'liebt', 'lieben', 'liebt', 'lieben', 'hat geliebt'],
  ['liegen', '位于；躺', 'liege', 'liegst', 'liegt', 'liegen', 'liegt', 'liegen', 'hat gelegen'],
  ['mieten', '租', 'miete', 'mietest', 'mietet', 'mieten', 'mietet', 'mieten', 'hat gemietet'],
  ['reisen', '旅行', 'reise', 'reist', 'reist', 'reisen', 'reist', 'reisen', 'ist gereist'],
  ['sagen', '说', 'sage', 'sagst', 'sagt', 'sagen', 'sagt', 'sagen', 'hat gesagt'],
  ['studieren', '上大学；攻读', 'studiere', 'studierst', 'studiert', 'studieren', 'studiert', 'studieren', 'hat studiert'],
  ['wiederholen', '重复；复习', 'wiederhole', 'wiederholst', 'wiederholt', 'wiederholen', 'wiederholt', 'wiederholen', 'hat wiederholt'],
  ['zahlen', '支付', 'zahle', 'zahlst', 'zahlt', 'zahlen', 'zahlt', 'zahlen', 'hat gezahlt'],
];

// [词, pos, 中文, theme]
const OTHERS = [
  ['alle', 'pron.', '所有的；全部', 'frage'],
  ['best', 'adj.', '最好的（gut 的最高级）', 'adj'],
  ['bis', 'prep.', '直到；到……为止', 'frage'],
  ['bisschen', 'adv.', '一点儿', 'frage'],
  ['braun', 'adj.', '棕色的', 'adj'],
  ['dreizehn', 'num.', '十三', 'zahl'],
  ['erste', 'num.', '第一（的）', 'zahl'],
  ['fünfzig', 'num.', '五十', 'zahl'],
  ['grau', 'adj.', '灰色的', 'adj'],
  ['halb', 'adj.', '一半的；……点半', 'zahl'],
  ['hell', 'adj.', '明亮的；浅色的', 'adj'],
  ['klar', 'adj.', '清楚的；当然', 'adj'],
  ['kurz', 'adj.', '短的；简短的', 'adj'],
  ['lang', 'adj.', '长的；长时间的', 'adj'],
  ['laut', 'adj.', '大声的；吵的', 'adj'],
  ['leicht', 'adj.', '容易的；轻的', 'adj'],
  ['lieb', 'adj.', '亲爱的；可爱的', 'adj'],
  ['lieber', 'adv.', '更愿意；宁可', 'frage'],
  ['lustig', 'adj.', '有趣的；滑稽的', 'adj'],
  ['mehr', 'adv.', '更多；更', 'frage'],
  ['nächst', 'adj.', '下一个的；最近的', 'adj'],
  ['noch', 'adv.', '还；仍然', 'frage'],
  ['nur', 'adv.', '只；仅仅', 'frage'],
  ['oben', 'adv.', '在上面', 'frage'],
  ['ohne', 'prep.', '没有；不带', 'frage'],
  ['schon', 'adv.', '已经', 'frage'],
  ['seit', 'prep.', '自从', 'frage'],
  ['so', 'adv.', '这样；如此', 'frage'],
  ['viel', 'adj.', '许多的', 'frage'],
  ['vierzehn', 'num.', '十四', 'zahl'],
  ['vierzig', 'num.', '四十', 'zahl'],
  ['wunderbar', 'adj.', '极好的；美妙的', 'adj'],
  ['zusammen', 'adv.', '一起', 'frage'],
];

/* ---- 从现有语料里挑例句，不手写 ---- */
const corpus = [];
for (const unit of COURSE) for (const lesson of unit.lessons) for (const step of lesson.steps || [])
  for (const line of step.lines || []) if (line.de && line.zh)
    corpus.push({ de: line.de.trim(), zh: line.zh.trim(), source: `lesson:${lesson.id}` });
for (const reading of READINGS) for (const s of reading.sentences || []) if (s.de && s.zh)
  corpus.push({ de: s.de.trim(), zh: s.zh.trim(), source: reading.id });
for (const pack of LISTENING_PACKS) for (const s of pack.sentences || []) if (s.de && s.zh)
  corpus.push({ de: s.de.trim(), zh: s.zh.trim(), source: pack.id });

const formsOf = word => {
  const set = new Set(candidates(word));
  for (const c of candidates(word)) for (const l of DICT_FORMS[c] || []) set.add(l.toLowerCase());
  return set;
};
function bestExample(lemma) {
  const target = lemma.toLowerCase();
  const hits = corpus.filter(entry => words(entry.de).some(w => formsOf(w).has(target)));
  if (!hits.length) return null;
  // 短句优先（8 词左右最适合当例句），课程句优先于内容句
  return hits.sort((a, b) => {
    const la = words(a.de).length, lb = words(b.de).length;
    const fa = Math.abs(la - 8) - (a.source.startsWith('lesson:') ? 2 : 0);
    const fb = Math.abs(lb - 8) - (b.source.startsWith('lesson:') ? 2 : 0);
    return fa - fb;
  })[0];
}

let nextId = VOCAB.length;
const entries = [];
const skipped = [];
const push = (de, base) => {
  const example = bestExample(de);
  if (!example) { skipped.push(de); return; }
  nextId += 1;
  entries.push({
    id: `w${String(nextId).padStart(3, '0')}`,
    de, art: null, pl: null,
    ...base,
    ex: example.de, exZh: example.zh,
    sentences: [{ de: example.de, zh: example.zh, source: example.source }],
  });
};
for (const [de, art, pl, zh, theme, noPl] of NOUNS)
  push(de, { art, ...(noPl ? { noPl: true } : { pl }), zh, theme });
for (const [de, zh, ich, du, er, wir, ihr, sie, perfekt] of VERBS)
  push(de, { zh, theme: 'verb2', pos: 'v.', forms: { ich, du, er, wir, ihr, sie, perfekt } });
for (const [de, pos, zh, theme] of OTHERS)
  push(de, { zh, theme, pos });

const path = new URL('../data/vocab.js', import.meta.url);
let src = readFileSync(path, 'utf8');
const marker = src.lastIndexOf('];');
const block = entries.map(entry => `  ${JSON.stringify(entry)},`).join('\n');
src = `${src.slice(0, marker)}\n  /* ---- A1 官方词表补全：内容中已出现但词汇站缺失的实词 ---- */\n${block}\n${src.slice(marker)}`;
writeFileSync(path, src, 'utf8');
console.log(`已追加 ${entries.length} 个词条（w${String(VOCAB.length + 1).padStart(3, '0')} 起）`);
if (skipped.length) console.log(`语料中找不到例句、已跳过：${skipped.join(' ')}`);
