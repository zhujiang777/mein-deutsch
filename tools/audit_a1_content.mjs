#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync, readFileSync, readdirSync, statSync, writeFileSync
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSE } from '../data/course.js';
import { DICT_PARTICIPLES } from '../data/dict-core.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { READINGS } from '../data/readings.js';
import { words, coverage } from './a1-coverage.mjs';
import { reuseCheck } from './course-vocab.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DISTILLATION = join(ROOT, '正版图书', '.distillation');
const REPORT = join(ROOT, 'data', 'a1-audit-report.json');
const SYLLABUS = JSON.parse(readFileSync(join(ROOT, 'data', 'syllabus-ref.json'), 'utf8'));
const WHITELIST = JSON.parse(readFileSync(join(ROOT, 'data', 'a1-overlap-whitelist.json'), 'utf8'));
const PILOTS = [
  ...LISTENING_PACKS.filter(item => item.pilot),
  ...READINGS.filter(item => item.pilot)
];

const hash = value => createHash('sha256').update(value).digest('hex');
const normalize = text => (String(text).toLowerCase().match(/\p{L}+/gu) || []).join(' ');
const ngrams = (text, size) => {
  const tokens = normalize(text).split(' ').filter(Boolean);
  return Array.from({ length: Math.max(0, tokens.length - size + 1) },
    (_, index) => tokens.slice(index, index + size).join(' '));
};

function germanStrings(value, out = []) {
  if (Array.isArray(value)) value.forEach(item => germanStrings(item, out));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'de' && typeof item === 'string') out.push(item);
      else germanStrings(item, out);
    }
  }
  return out;
}

function textFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) textFiles(path, out);
    else if (/\.(txt|json)$/i.test(name)) out.push(path);
  }
  return out;
}

function sourceHashes() {
  const result = {};
  for (const source of SYLLABUS.sources) {
    if (!source.locator?.startsWith('正版图书/')) continue;
    const path = join(ROOT, source.locator);
    result[source.id] = existsSync(path)
      ? { sha256: hash(readFileSync(path)), bytes: statSync(path).size }
      : { missing: true };
    if (source.audioLocator) {
      const audioPath = join(ROOT, source.audioLocator);
      result[`${source.id}-publisher-audio`] = existsSync(audioPath)
        ? { sha256: hash(readFileSync(audioPath)), bytes: statSync(audioPath).size }
        : { missing: true };
    }
  }
  return result;
}

function evidenceChecks() {
  const evidenceById = new Map(SYLLABUS.evidenceUnits.map(unit => [unit.id, unit]));
  const sourceById = new Map(SYLLABUS.sources.map(source => [source.id, source]));
  const failures = [];
  for (const item of PILOTS) {
    const ids = item.designReferences?.evidenceIds || [];
    const units = ids.map(id => evidenceById.get(id));
    ids.forEach((id, index) => {
      if (!units[index]) failures.push(`${item.id}: unknown evidenceId ${id}`);
    });
    const sourceIds = new Set(units.filter(Boolean).map(unit => unit.sourceId));
    const kinds = new Set([...sourceIds].map(id => sourceById.get(id)?.kind));
    if (!sourceIds.has('course-repo')) failures.push(`${item.id}: missing repository progression evidence`);
    if (!sourceIds.has('passwort-a1') && !sourceIds.has('dangdai-1')) {
      failures.push(`${item.id}: missing main textbook progression evidence`);
    }
    if (![...sourceIds].some(id => id.startsWith('hueber-'))) {
      failures.push(`${item.id}: missing Hueber skill evidence`);
    }
    if (!kinds.has('public')) failures.push(`${item.id}: missing public calibration evidence`);
  }
  return failures;
}

/* 难度 = 学习者在推荐课次时真正认得多少词。
 * 分子只认词库（Goethe A1 + 课程词表）和专名；作者声明的生词按定义算未知，
 * 否则"声明一下"就能把任何词变成已知，指标就退化成文本长度的函数。
 * 唯一的让步：同一个生词重复出现只罚第一次——复现是刻意设计，不是额外负担。 */
export function difficultyChecks(items = PILOTS) {
  return items.map(item => {
    const text = item.sentences.map(sentence => sentence.de).join(' ');
    const proper = item.properNouns || [];
    const baseline = coverage(text, { declared: [], proper });
    const repeats = item.newLemmas.reduce((sum, lemma) => {
      const occurrences = baseline.unknown
        .filter(word => !coverage(word, { declared: [lemma], proper }).unknown.length);
      return sum + Math.max(0, occurrences.length - 1);
    }, 0);
    const effectiveUnknown = Math.max(0, baseline.unknown.length - repeats);
    const knownRatio = baseline.total ? (baseline.total - effectiveUnknown) / baseline.total : 1;
    // 未声明生词：既不在词库，也没写进 newLemmas —— targetLemmas 不能用来夹带。
    const undeclared = coverage(text, { declared: item.newLemmas, proper }).unknown;
    return {
      id: item.id,
      totalTokens: baseline.total,
      baselineKnownRatio: Number(knownRatio.toFixed(4)),
      newLemmaCount: item.newLemmas.length,
      undeclaredWords: [...new Set(undeclared)]
    };
  });
}

/* 语法边界。区分"看懂"和"会用"：没学过 kann + 不定式，照样能看懂
 * "Man kann die Lampe aufladen"——超前的输入是正常的语言接触，不该一律拦。
 * 真正要拦的只有两种情况：
 *   1. 学习者必须自己把这句**生成**出来（听写、复述）。此时语法是硬要求。
 *   2. 整篇都超前——那不是"偶尔遇到"，是难度定错了。
 * 其余一律降级为提示，进报告但不卡门禁。
 * 检测本身保持保守：只认有把握的形态，宁可漏报也不误伤。 */
const PRODUCED_TOLERANCE = 1 / 3;   // 超前句占比超过这个数就算难度错配
const MODAL_FORMS = new Set([
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
  'will', 'willst', 'wollen', 'wollt', 'soll', 'sollst', 'sollen', 'sollt',
  'darf', 'darfst', 'dürfen', 'dürft', 'mag', 'magst', 'mögen', 'mögt',
  'möchte', 'möchtest', 'möchten', 'möchtet'
]);
const PRETERITE = new Set([
  'konnte', 'konnten', 'wollte', 'wollten', 'sollte', 'sollten', 'musste', 'mussten',
  'durfte', 'durften', 'mochte', 'mochten', 'ging', 'gingen', 'kam', 'kamen',
  'fuhr', 'fuhren', 'sah', 'sahen', 'gab', 'gaben', 'nahm', 'nahmen', 'sprach',
  'las', 'blieb', 'stand', 'wurde', 'wurden', 'hieß', 'fand', 'dachte', 'wusste'
]);
const PAST_SEIN_HABEN = /^(war|warst|waren|hatte|hattest|hatten)$/;
const isParticiple = token => Boolean(DICT_PARTICIPLES[token]);

const GRAMMAR_RULES = [
  { id: 'modal-verbs', minStage: 4, label: '情态动词', hit: token => MODAL_FORMS.has(token) },
  { id: 'perfect', minStage: 6, label: '完成时第二分词', hit: isParticiple },
  { id: 'war-hatte', minStage: 6, label: 'war / hatte', hit: token => PAST_SEIN_HABEN.test(token) },
  { id: 'preterite', minStage: Infinity, label: 'Präteritum（A1 只用 war/hatte）', hit: token => PRETERITE.has(token) },
  { id: 'genitive-preposition', minStage: Infinity, label: '二格介词（超 A1）', hit: token => /^(trotz|wegen|während|aufgrund)$/.test(token) }
];

export function grammarChecks(items = PILOTS) {
  const blocking = [];
  const notes = [];
  for (const item of items) {
    const stage = Number(String(item.skillStage || '').replace(/\D/g, '')) || 0;
    // 听写和复述要求学习者自己生成这句；跟读是照着念，不需要懂语法。
    const mustProduce = new Set([...(item.dictation || []), ...(item.reproduce || [])]);
    const aheadSentences = new Set();
    for (const [index, sentence] of item.sentences.entries()) {
      for (const token of (sentence.de.toLowerCase().match(/\p{L}+/gu) || [])) {
        for (const rule of GRAMMAR_RULES) {
          if (stage >= rule.minStage || !rule.hit(token)) continue;
          aheadSentences.add(index);
          const where = `${item.id}[${index}] ${item.skillStage} 出现${rule.label}：${token}`;
          if (mustProduce.has(index)) blocking.push(`${where}——该句要求听写或复述，必须自己产出`);
          else notes.push(where);
        }
      }
    }
    if (aheadSentences.size > item.sentences.length * PRODUCED_TOLERANCE) {
      blocking.push(`${item.id}: ${aheadSentences.size}/${item.sentences.length} 句超出 ${item.skillStage} 语法边界，已不是偶尔遇到`);
    }
  }
  return { blocking: [...new Set(blocking)], notes: [...new Set(notes)] };
}

function overlapChecks() {
  const baselineTexts = [
    ...germanStrings(COURSE),
    ...germanStrings(LISTENING_PACKS.filter(item => !item.pilot)),
    ...germanStrings(READINGS.filter(item => !item.pilot))
  ];
  const privateFiles = textFiles(join(DISTILLATION, 'ocr'));
  const privateTexts = privateFiles.map(path => readFileSync(path, 'utf8'));
  const baselines = [
    ...baselineTexts.map(text => ({ source: 'repository', text })),
    ...privateTexts.map((text, index) => ({
      source: relative(ROOT, privateFiles[index]),
      text
    }))
  ];
  const six = new Map();
  const five = new Map();
  for (const base of baselines) {
    ngrams(base.text, 6).forEach(gram => six.set(gram, base.source));
    ngrams(base.text, 5).forEach(gram => five.set(gram, base.source));
  }
  const allowed = new Map(
    WHITELIST.entries.map(entry => [`${entry.itemId}:${normalize(entry.phrase)}`, entry.reason])
  );
  const sixWordCollisions = [];
  const fiveWordCollisions = [];
  for (const item of PILOTS) {
    for (const sentence of item.sentences) {
      for (const gram of ngrams(sentence.de, 6)) {
        if (six.has(gram)) sixWordCollisions.push({ itemId: item.id, gram, source: six.get(gram) });
      }
      for (const gram of ngrams(sentence.de, 5)) {
        if (!five.has(gram)) continue;
        const reason = allowed.get(`${item.id}:${gram}`);
        if (!reason) fiveWordCollisions.push({ itemId: item.id, gram, source: five.get(gram) });
      }
    }
  }
  return {
    privateOcrFiles: privateFiles.map(path => ({
      path: relative(ROOT, path),
      sha256: hash(readFileSync(path))
    })),
    privateOcrStatus: privateFiles.length ? 'checked' : 'blocked-toolchain',
    sixWordCollisions,
    unapprovedFiveWordCollisions: fiveWordCollisions
  };
}

const difficulties = difficultyChecks();
const overlaps = overlapChecks();
const evidenceFailures = evidenceChecks();
const grammarFailures = grammarChecks();
const reuse = PILOTS.map(reuseCheck);
const pendingAudio = LISTENING_PACKS
  .filter(item => item.pilot && item.audioStatus === 'pending-tts')
  .map(item => item.id);
const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  contentHash: hash(JSON.stringify(PILOTS)),
  pilotCount: PILOTS.length,
  sourceHashes: sourceHashes(),
  evidence: {
    failureCount: evidenceFailures.length,
    failures: evidenceFailures
  },
  // 课程词复用：正文里学习者在推荐课次时已学过的实词占比。
  // 这是「92% 已知率」看不见的一维——一篇可以全是 A1 词，同时全是学习者没见过的词。
  courseReuse: {
    failureCount: reuse.filter(item => !item.pass).length,
    items: reuse.map(({ id, floor, ratio, reused, contentWords, coldWords, pass }) => ({
      id, floor, ratio: Number(ratio.toFixed(4)), reused, contentWords, pass, coldWords,
    })),
  },
  grammar: {
    failureCount: grammarFailures.blocking.length,
    failures: grammarFailures.blocking,
    // 超前但只需看懂的结构：进报告供人工判断，不卡门禁。
    receptiveNotes: grammarFailures.notes
  },
  difficulty: {
    target: SYLLABUS.policy.knownWordTarget,
    items: difficulties,
    failureCount: difficulties.filter(item =>
      item.baselineKnownRatio < SYLLABUS.policy.knownWordTarget
      || item.newLemmaCount < 3
      || item.newLemmaCount > 6
      || item.undeclaredWords.length
    ).length
  },
  originality: overlaps,
  audio: {
    pendingCount: pendingAudio.length,
    pendingIds: pendingAudio
  },
  gate: (
    evidenceFailures.length === 0
    && grammarFailures.blocking.length === 0
    && reuse.every(item => item.pass)
    && difficulties.every(item =>
      item.baselineKnownRatio >= SYLLABUS.policy.knownWordTarget
      && item.newLemmaCount >= 3
      && item.newLemmaCount <= 6
      && item.undeclaredWords.length === 0)
    && overlaps.privateOcrStatus === 'checked'
    && overlaps.sixWordCollisions.length === 0
    && overlaps.unapprovedFiveWordCollisions.length === 0
    && pendingAudio.length === 0
  ) ? 'automated-pass' : 'incomplete'
};

export { report };

// 直接运行才产出报告；测试会 import grammarChecks，不应触发写盘和打印。
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--write-report')) {
    writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--strict') && report.gate !== 'automated-pass') process.exitCode = 1;
}
