// 课文课主线：一篇课文 = 一课，两天学完。产品规则见 docs/product.md，写课规则见 docs/course-authoring.md。
// lines 的下标被 cards.after / dictation / shadow / words.line 引用；改课文顺序时要一起改，并升级 version。

const line = (who, de, zh) => ({ who, de, zh });
const choice = (id, prompt, options, answer, extra = {}) => ({ id, type: 'choice', prompt, options, answer, ...extra });
const response = (id, prompt, answers, extra = {}) => ({ id, type: 'response', prompt, answers, model: answers[0], ...extra });

export const TEXT_LESSONS = [
  {
    id: 'tl-01', version: 1, unit: 1, title: '宿舍厨房里的第一面',
    scene: '你刚搬进学生宿舍，第一次在公用厨房碰到室友 Lena，接着 Tom 也进来了。',
    role: 'Lin',
    lines: [
      line('Lena', 'Hallo!', '你好！'),
      line('Lin', 'Hallo!', '你好！'),
      line('Lena', 'Ich heiße Lena. Wie heißt du?', '我叫 Lena。你叫什么？'),
      line('Lin', 'Ich heiße Lin.', '我叫 Lin。'),
      line('Lena', 'Wie bitte?', '什么？请再说一遍？'),
      line('Lin', 'Lin. Ich heiße Lin.', 'Lin。我叫 Lin。'),
      line('Lena', 'Ah, Lin! Freut mich.', '啊，Lin！很高兴认识你。'),
      line('Lin', 'Freut mich auch.', '我也很高兴。'),
      line('Tom', 'Hallo! Ich bin Tom.', '你好！我是 Tom。'),
      line('Lena', 'Tom, das ist Lin.', 'Tom，这是 Lin。'),
      line('Tom', 'Hallo, Lin! Freut mich.', '你好，Lin！很高兴认识你。'),
      line('Lin', 'Hallo, Tom!', '你好，Tom！'),
      line('Lena', 'Tschüss, Lin!', '再见，Lin！'),
      line('Lin', 'Tschüss!', '再见！'),
    ],
    // 点句子里的词时显示的释义；键是小写词形
    gloss: {
      hallo: '你好', ich: '我', du: '你',
      heiße: '叫（ich 用 heiße，原形 heißen）', heißt: '叫（du 用 heißt，原形 heißen）',
      wie: '怎么、如何', bitte: '请；Wie bitte? = 请再说一遍？', ah: '啊',
      freut: '整体短语 Freut mich. = 很高兴认识你', mich: '整体短语 Freut mich. = 很高兴认识你',
      auch: '也', bin: '整体短语 Ich bin … = 我是……', das: '整体短语 Das ist … = 这是……',
      ist: '整体短语 Das ist … = 这是……', tschüss: '再见（口语）',
      lena: '人名', lin: '人名（你的角色）', tom: '人名', paul: '人名',
    },
    // 进入复习的词；line + form 用来出“课文原句填空”
    words: [
      { id: 'w001', line: 11, form: 'Hallo' },
      { id: 'w016', line: 3, form: 'heiße' },
      { id: 'w238', line: 2, form: 'Wie' },
      { id: 'w245', line: 7, form: 'auch' },
      { id: 'w006', line: 12, form: 'Tschüss' },
      { id: 'w254', line: 4, form: 'Wie bitte?' },
    ],
    phrases: ['Wie bitte?', 'Freut mich.', 'Ich bin …', 'Das ist …'],
    gist: choice('gist', '对话里一共有几个人？谁是新来的？', ['三个人，Lin 是新来的', '两个人，Lena 是新来的'], 0, { explain: 'Lena、Lin、Tom 三个人；Lena 在问 Lin 的名字，Lin 是新来的。' }),
    cards: [
      { after: 2, kind: 'grammar', title: '语法：ich heiße / du heißt',
        body: '介绍自己：Ich heiße …；问对方：Wie heißt du? 动词结尾跟着“谁在说”变：ich 后面加 -e（heiße）；du 后面本来加 -st，但 heißen 的词干已经以 ß 结尾，所以只加 -t（heißt）。',
        example: 'Ich heiße Lena. Wie heißt du?' },
      { after: 2, kind: 'pron', title: '发音：ei 和 ie',
        body: 'ei 读起来像英语的 eye（heißen）；ie 读起来像英语 see 里拉长的 ee（wie）。“Wie heißt du?” 一句里两个都有。先听标准音，再录下自己的对照。',
        pairs: ['heißen', 'wie'], example: 'Wie heißt du?' },
      { after: 9, kind: 'tip', title: '生活小贴士',
        body: '同龄学生之间说 “Ich bin Tom.” 比 “Ich heiße Tom.” 更常见，两种都对。宿舍里大家直接用 du。没听清时就说 “Wie bitte?”——这是你在德国最常用的救命句。“Freut mich.” 和 “Das ist …” 先按整体短语记。' },
    ],
    checks: [
      choice('c1', 'Ich ___ Lin.', ['heiße', 'heißt'], 0, { explain: 'ich 配 heiße。' }),
      choice('c2', '听音，选出你听到的句子。', ['Wie heißt du?', 'Wie bitte?'], 0, { audioText: 'Wie heißt du?', explain: 'Wie heißt du? = 你叫什么？' }),
      choice('c3', 'Lena 说 “Wie bitte?”，是因为……', ['她没听清 Lin 的名字', '她想知道 Lin 住在哪里'], 0, { explain: 'Wie bitte? 用在没听清、请对方再说一遍时。' }),
    ],
    dictation: [2, 3, 4, 6, 7, 8, 9, 12],
    shadow: [1, 3, 5, 7, 11, 13],
    // 隔天检查：不给提示，做对才算“记住了”
    reviews: [
      response('r1', '你没听清对方说什么，礼貌地请他再说一遍。', ['Wie bitte?']),
      response('r2', '用德语问新室友叫什么名字。', ['Wie heißt du?']),
      response('r3', '你叫 Mia：先介绍自己，再说“很高兴认识你”。', ['Ich heiße Mia. Freut mich.', 'Ich bin Mia. Freut mich.']),
    ],
    // 课后小材料：只用本课已教的词
    reading: {
      title: '宿舍群里的一条消息',
      lines: [line('Paul', 'Hallo! Ich heiße Paul.', '大家好！我叫 Paul。'), line('Paul', 'Wie heißt du?', '你叫什么？')],
      question: choice('q', 'Paul 想知道什么？', ['你的名字', '你住在哪里'], 0, { explain: 'Wie heißt du? 问的是名字。' }),
    },
  },
];

export const findTextLesson = id => TEXT_LESSONS.find(l => l.id === id) || null;

export function textLessonAudioTexts() {
  const texts = new Set();
  for (const l of TEXT_LESSONS) {
    l.lines.forEach(s => texts.add(s.de));
    l.reading.lines.forEach(s => texts.add(s.de));
    l.cards.forEach(c => { if (c.example) texts.add(c.example); (c.pairs || []).forEach(t => texts.add(t)); });
    [...l.checks, l.gist, l.reading.question].forEach(c => { if (c.audioText) texts.add(c.audioText); });
    l.reviews.forEach(r => r.answers.forEach(t => texts.add(t)));
  }
  return [...texts];
}
