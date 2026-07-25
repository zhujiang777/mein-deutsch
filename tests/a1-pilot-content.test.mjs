import test from 'node:test';
import assert from 'node:assert/strict';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { classifyReadiness } from '../js/content-readiness.js';
import { grammarChecks, difficultyChecks } from '../tools/audit_a1_content.mjs';
import { COURSE } from '../data/course.js';
import { readFileSync } from 'node:fs';

const SYLLABUS = JSON.parse(readFileSync(new URL('../data/syllabus-ref.json', import.meta.url)));
const EVIDENCE = new Map(SYLLABUS.evidenceUnits.map(unit => [unit.id, unit]));
const SOURCES = new Map(SYLLABUS.sources.map(source => [source.id, source]));

const REQUIRED = [
  'skillStage', 'genre', 'topic', 'register', 'grammarPrereqs', 'recommendedAfter',
  'targetLemmas', 'newLemmas', 'knownWordTarget', 'designReferences', 'provenance'
];

test('pilot contains one original listening and reading item for every A1 skill stage', () => {
  const listening = LISTENING_PACKS.filter(item => item.pilot);
  const reading = READINGS.filter(item => item.pilot);
  assert.equal(listening.length, 6);
  assert.equal(reading.length, 6);
  assert.deepEqual(listening.map(item => item.skillStage), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']);
  assert.deepEqual(reading.map(item => item.skillStage), ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);

  for (const item of [...listening, ...reading]) {
    for (const field of REQUIRED) assert.ok(item[field], `${item.id} 缺 ${field}`);
    assert.ok(item.newLemmas.length >= 3 && item.newLemmas.length <= 6, `${item.id} 生词不是 3-6 个`);
    assert.equal(item.knownWordTarget, 0.92);
    assert.equal(item.provenance.kind, 'original');
    assert.match(item.designReferences.originalityStatement, /原创/);
    assert.ok(item.designReferences.appliedConstraints.length >= 2, `${item.id} 缺实际采用的教材约束`);
    const units = item.designReferences.evidenceIds.map(id => EVIDENCE.get(id));
    assert.ok(units.every(Boolean), `${item.id} 有无法定位的 evidenceId`);
    const sourceIds = new Set(units.map(unit => unit.sourceId));
    assert.ok(sourceIds.has('course-repo'), `${item.id} 缺课程进度证据`);
    assert.ok(sourceIds.has('passwort-a1') || sourceIds.has('dangdai-1'), `${item.id} 缺主课教材证据`);
    assert.ok([...sourceIds].some(id => id.startsWith('hueber-')), `${item.id} 缺 Hueber 技能证据`);
    assert.ok([...sourceIds].some(id => SOURCES.get(id)?.kind === 'public'), `${item.id} 缺公开校准证据`);
  }
});

test('stage profiles point to real lessons and match pilot grammar boundaries', () => {
  const lessonIds = new Set(COURSE.flatMap(unit => unit.lessons.map(lesson => lesson.id)));
  const pilot = [
    ...LISTENING_PACKS.filter(item => item.pilot),
    ...READINGS.filter(item => item.pilot)
  ];
  for (const profile of SYLLABUS.stageProfiles) {
    assert.ok(lessonIds.has(profile.recommendedAfter), `${profile.listening}/${profile.reading} 课次不存在`);
    for (const item of pilot.filter(candidate =>
      candidate.skillStage === profile.listening || candidate.skillStage === profile.reading)) {
      assert.equal(item.recommendedAfter, profile.recommendedAfter);
      assert.deepEqual(item.grammarPrereqs, profile.grammarPrereqs);
    }
  }
});

test('pilot topics are not duplicated and all texts remain independently openable', () => {
  const pilot = [
    ...LISTENING_PACKS.filter(item => item.pilot),
    ...READINGS.filter(item => item.pilot)
  ];
  const counts = new Map();
  for (const item of pilot) counts.set(item.topic, (counts.get(item.topic) || 0) + 1);
  assert.ok([...counts.values()].every(count => count <= 2));
  assert.ok(pilot.every(item => item.id && item.sentences?.length));
});

test('readiness follows vocabulary and grammar thresholds without locking content', () => {
  const item = {
    skillStage: 'L2',
    recommendedAfter: 'u5l3',
    vocabRefs: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10',
      'w11', 'w12', 'w13', 'w14', 'w15', 'w16', 'w17', 'w18', 'w19', 'w20']
  };
  const srs = Object.fromEntries(item.vocabRefs.slice(0, 19).map(id => [id, { reps: 1, state: 'review' }]));
  assert.equal(classifyReadiness(item, { lessonStates: { u5l3: { done: true } }, srs }).label, '正合适');
  assert.equal(classifyReadiness({ ...item, skillStage: 'L1' }, { lessonStates: {}, srs: {} }).label, '稍难');
  assert.equal(classifyReadiness({ ...item, skillStage: 'L6' }, { lessonStates: {}, srs: {} }).label, '挑战');
});

const stub = (skillStage, ...lines) => ({
  id: `stub-${skillStage}`, skillStage, properNouns: [], newLemmas: [],
  sentences: lines.map(de => ({ de })),
});

test('pilot prose stays inside the grammar boundary of its own stage', () => {
  assert.deepEqual(grammarChecks().blocking, []);
});

test('超前语法只在"必须自己产出"时才拦，看懂就行的一律放行', () => {
  const ahead = 'Der Kurs sollte ursprünglich um sechs Uhr beginnen.';
  const filler = 'Der Kurs ist hier.';
  // 只需看懂：进提示，不卡门禁。
  const readOnly = grammarChecks([{ ...stub('L3', ahead, filler, filler), dictation: [1] }]);
  assert.deepEqual(readOnly.blocking, [], '只需看懂的超前语法不该拦');
  assert.equal(readOnly.notes.length, 1, '但要留痕供人工判断');
  // 同一句要求听写 → 必须自己写出来，拦。
  const dictated = grammarChecks([{ ...stub('L3', ahead, filler, filler), dictation: [0] }]);
  assert.equal(dictated.blocking.length, 1, '听写句里的超前语法必须拦');
  // 复述同理。
  assert.equal(grammarChecks([{ ...stub('L3', ahead, filler, filler), reproduce: [0] }]).blocking.length, 1);
  // 跟读是照着念，不需要懂语法 → 不拦。
  assert.deepEqual(grammarChecks([{ ...stub('L3', ahead, filler, filler), speakPractice: [0] }]).blocking, []);
});

test('整篇都超前仍然要拦——那是难度定错了，不是偶尔遇到', () => {
  const all = grammarChecks([stub('L1',
    'Ich kann das machen.', 'Wir sind gefahren.', 'Du musst hier bleiben.')]);
  assert.ok(all.blocking.some(f => f.includes('已不是偶尔遇到')), '整篇超前没有被拦下');
});

test('语法检测本身没有被削弱', () => {
  // 这四条是本轮返修前真实存在的越界形态，任何一条测不出来都说明检测器坏了。
  const detects = de => grammarChecks([{ ...stub('L3', de), dictation: [0] }]).blocking.length;
  assert.ok(detects('Der Kurs sollte ursprünglich um sechs Uhr beginnen.'), '漏掉情态动词过去式');
  assert.ok(detects('Der Kurs ist also um dreißig Minuten verschoben.'), '漏掉第二分词');
  assert.ok(detects('Trotz der Panne war der Tag schön.'), '漏掉二格介词');
  assert.ok(detects('Man kann ihn für neue Wörter benutzen.'), '漏掉情态动词');
  // 反向：合规文本不得误伤，尤其是 Ge- 开头的名词。
  const clean = de => grammarChecks([{ ...stub('L6', de), dictation: [0] }]).blocking;
  assert.deepEqual(clean('Wir sind gelaufen und haben Kaffee getrunken.'), []);
  assert.deepEqual(clean('Das Gebäude, die Geschichten und das Gespräch waren gestern gegen acht.'), []);
});

test('difficulty measures real vocabulary load, not text length', () => {
  const [easy] = difficultyChecks([stub('L1', 'Ich komme aus der Stadt und wohne hier.')]);
  assert.ok(easy.baselineKnownRatio > 0.95, '全是词库内的词却没算高分');
  // 声明成 newLemmas 不该把生词变成已知词——否则指标只是文本长度的函数。
  const [dense] = difficultyChecks([{
    ...stub('L1', 'Die Unterführung, der Hinterhof und die Apotheke.'),
    newLemmas: ['Unterführung', 'Hinterhof', 'Apotheke'],
  }]);
  assert.ok(dense.baselineKnownRatio < 0.92, `生词密度过高却判为达标：${dense.baselineKnownRatio}`);
  assert.deepEqual(dense.undeclaredWords, []);
  // targetLemmas 不能用来夹带词库里没有的词。
  const [smuggled] = difficultyChecks([{
    ...stub('L1', 'Der Aussichtspunkt ist schön.'), targetLemmas: ['Aussichtspunkt'],
  }]);
  assert.deepEqual(smuggled.undeclaredWords, ['Aussichtspunkt']);
});

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

function ngrams(text, size = 6) {
  const words = text.toLowerCase().match(/\p{L}+/gu) || [];
  return Array.from({ length: Math.max(0, words.length - size + 1) },
    (_, index) => words.slice(index, index + size).join(' '));
}

test('pilot prose has no six-word overlap with existing course or legacy texts', () => {
  const pilotItems = [
    ...LISTENING_PACKS.filter(item => item.pilot),
    ...READINGS.filter(item => item.pilot)
  ];
  const baseline = new Set([
    ...germanStrings(COURSE),
    ...germanStrings(LISTENING_PACKS.filter(item => !item.pilot)),
    ...germanStrings(READINGS.filter(item => !item.pilot))
  ].flatMap(text => ngrams(text)));
  const seen = new Map();
  const collisions = [];
  for (const item of pilotItems) {
    for (const gram of item.sentences.flatMap(sentence => ngrams(sentence.de))) {
      if (baseline.has(gram)) collisions.push(`${item.id}: ${gram}`);
      const owner = seen.get(gram);
      if (owner && owner !== item.id) collisions.push(`${owner}/${item.id}: ${gram}`);
      seen.set(gram, item.id);
    }
  }
  assert.deepEqual(collisions, []);
});
