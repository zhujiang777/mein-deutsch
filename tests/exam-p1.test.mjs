// P1 自我介绍：题是用学习者档案现拼的，所以门禁得对着生成器验，不是对着题库。
// 全景图把 P1 标成"已具备"，靠的就是这一组测试（tests/exam-data.test.mjs 的
// 双向锁对动态格子放行，放行的前提是这里守住）。
import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
};
globalThis.window = { dispatchEvent() {} };

const {
  P1_FIELDS, P1_CARDS, spellGerman, digitsGerman, introSentences,
  profileComplete, buildP1Task, saveProfile, getProfile,
} = await import('../js/exam-p1.js');
const { examPart } = await import('../data/exam.js');

const PROFILE = {
  vorname: 'Jiang', nachname: 'Zhu', alter: '25', land: 'China', wohnort: 'Hangzhou',
  sprachen: 'Chinesisch und Englisch', beruf: 'Student', hobby: 'Musik',
  telefon: '0176 4432891',
};

test('七张关键词卡就是官方那七项，一项不多一项不少', () => {
  assert.deepEqual(P1_CARDS.map(card => card.de),
    ['Name', 'Alter', 'Land', 'Wohnort', 'Sprachen', 'Beruf', 'Hobby']);
  assert.equal(examPart('P1').teil, 1);
  // 表单要能填满这七项 + 拼名字用的姓 + 报号码用的电话
  const keys = P1_FIELDS.map(field => field.key);
  ['vorname', 'nachname', 'alter', 'land', 'wohnort', 'sprachen', 'beruf', 'hobby', 'telefon']
    .forEach(key => assert.ok(keys.includes(key), `表单缺 ${key}`));
});

test('拼名字用德语字母名，不是英文字母名', () => {
  assert.equal(spellGerman('Zhu'), 'Zett Ha U');
  assert.equal(spellGerman('Wang'), 'We A Enn Ge');
  assert.equal(spellGerman('Müller'), 'Emm U-Umlaut Ell Ell E Err');
  // 认不出的字符直接丢掉，不让参考文本里混进乱码——Azure 拿到乱码会整段判废
  assert.equal(spellGerman("O'Neil"), 'O Enn E I Ell');
  assert.equal(spellGerman(''), '');
});

test('报号码逐位念，不整段当数字念', () => {
  assert.equal(digitsGerman('0176 44'), 'null eins sieben sechs vier vier');
  assert.equal(digitsGerman('+49 30'), 'vier neun drei null');
  assert.equal(digitsGerman('abc'), '');
});

test('七句自我介绍拼得出来，而且都是 A1 能说的句子', () => {
  const lines = introSentences(PROFILE);
  assert.equal(lines.length, 7, '七张卡对应七句');
  lines.forEach(line => {
    assert.ok(line.endsWith('.'), `这句没有句号：${line}`);
    assert.ok(!/\b(weil|dass|wenn|obwohl)\b/i.test(line), `这句用了 A1 没有的从句：${line}`);
    // A1 口语的句子必须短，长了自己也说不出来
    assert.ok(line.split(/\s+/).length <= 8, `这句太长了：${line}`);
  });
  assert.ok(lines[0].includes('Zhu') && lines[3].includes('Hangzhou'));
});

test('档案没填完就没有题 —— 不拿 Max Mustermann 凑一份', () => {
  assert.equal(profileComplete({}), false);
  assert.equal(buildP1Task({}), null);
  assert.equal(buildP1Task({ ...PROFILE, telefon: '' }), null, '缺一项就拼不出完整的一套');
  assert.equal(profileComplete(PROFILE), true);
});

test('拼出来的三段：介绍 · 拼姓 · 报号码，专名从计分里剔除', () => {
  const task = buildP1Task(PROFILE);
  assert.equal(task.cellId, 'P1');
  assert.match(task.id, /^x-/);
  assert.equal(task.items.length, 3);
  task.items.forEach(item => {
    assert.equal(item.type, 'speak');
    assert.ok(item.de, '朗读评测必须有参考文本，没有文本 Azure 就打不了分');
    assert.ok(item.explain, '考试题不讲为什么等于没做');
    assert.ok(!('q' in item && item.prompt), '口语题用 q 作提示语，不该同时写 prompt');
  });
  // 自己的名字和城市名会被 Azure 按德语音素判错，必须剔除
  assert.deepEqual(task.items[0].excludeWords, ['Jiang', 'Zhu', 'Hangzhou']);
  assert.equal(task.items[1].de, 'Zett Ha U');
  assert.equal(task.items[2].de, digitsGerman(PROFILE.telefon));
  // 拼字母和报数字本身就是德语词，正常计分
  assert.ok(!task.items[1].excludeWords);
  assert.ok(!task.items[2].excludeWords);
});

test('档案存在设置里，会跟着进度同步出去 —— 界面上必须说明这件事', async () => {
  values.clear();
  saveProfile(PROFILE);
  assert.deepEqual(getProfile(), PROFILE);
  assert.ok(values.get('md.settings.v1').includes('Hangzhou'), '档案要落在 md.settings.v1 里');

  const { readFileSync } = await import('node:fs');
  const view = readFileSync(new URL('../js/views/exam.js', import.meta.url), 'utf8');
  assert.match(view, /Gist/, 'P1 表单必须写明这些真人信息会同步到 Gist');
});
