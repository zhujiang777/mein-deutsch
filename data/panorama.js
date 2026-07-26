// A1 全景图格子定义 —— 规格见 docs/a1-panorama.md
//
// 四条轴：拼读 6 格 · 语法 20 格 · 词汇 · 题型 11 格。
// 全景图只是进度的**度量层**，不组织学习内容；主线按它的空白排序。
//
// 硬约束：skills 只能写 data/course.js 里真实存在的标签。
// 拼错不会报错，只会让那一格永远显示 0%——tests/panorama.test.mjs 会拦住。
// lessons 是"系统讲解这一格的语法课"，为空表示这一格只在微步课里零散练过、没有成体系的讲解。

/* ---------- 〇 拼读轴（6 格） ---------- */
// 按回报率排序（学完立刻能读出多少真词），不按字母表分类。
export const PRON_CELLS = [
  {
    id: 'V1', title: '元音长短',
    sub: 'a e i o u ＋ 三种长音标记 ＋ schwa 弱化',
    skills: ['vowel-length', 'spelling-rules'],
    reads: 'Name · Tag · fahren · Boot · bitte',
    pronLessons: ['v1'],
  },
  {
    id: 'V2', title: '双元音与英语陷阱',
    sub: 'ei ai au eu äu ie ＋ w=v · v=f · z=ts · s+元音=z ＋ 词尾清化',
    skills: ['diphthong', 'final-devoicing'],
    reads: 'zwei · Wein · sieben · heißen · und',
    pronLessons: ['v2'],
  },
  {
    id: 'V3', title: 'sch 家族与 ch',
    sub: 'sch · 词首 sp/st · ch 轻[ç]重[x] · -ig · tsch',
    skills: ['s-family', 'ch-sound'],
    reads: 'Deutsch · Student · sprechen · ich · auch',
    pronLessons: ['v3'],
  },
  {
    id: 'V4', title: '变元音与 r',
    sub: 'ä ö ü ＋ r（基础档：词尾读"呃"／进阶档：小舌音）',
    skills: ['umlaut', 'r-sound'],
    reads: 'Mädchen · schön · über · Bruder · Uhr',
    pronLessons: ['v4'],
  },
  {
    id: 'V5', title: '收尾辅音与硬起首',
    sub: 'h · pf · ng/nk · tz/ts · -tion · x · y ＋ Knacklaut',
    skills: ['misc-consonants'],
    reads: 'Apfel · Zeitung · Platz · Achtung',
    pronLessons: ['v5'],
  },
  {
    id: 'V6', title: '重音 · 语调 · 拼名字',
    sub: '词重音规则 ＋ 句子语调 ＋ 字母名（只学用得到的）',
    skills: ['word-stress', 'sentence-intonation', 'alphabet'],
    reads: '对接口语题型 P1',
    pronLessons: ['v6'],
  },
];

/* ---------- 一 语法轴（20 格） ---------- */
export const GRAMMAR_GROUPS = [
  {
    label: '动词与句子骨架',
    cells: [
      { id: 'A1', title: 'sein / haben', skills: ['sein-sg', 'sein-pl', 'haben-conj'], lessons: ['g01', 'g02'] },
      { id: 'A2', title: '现在时变位', sub: '规则 ＋ 换音 e→i / e→ie / a→ä',
        skills: ['verb-reg', 'kommen-wohnen', 'vowel-change-ei', 'vowel-change-ae', 'wissen'], lessons: ['g02', 'g07'] },
      { id: 'A3', title: '动词第二位 · 问句', skills: ['v2-order', 'w-frage', 'w-frage-basic', 'frag-order', 'nom-review'], lessons: ['g05'] },
      { id: 'A4', title: '情态动词 · 句框',
        skills: ['modal-koennen-wollen', 'modal-muessen-sollen', 'modal-duerfen', 'moechten', 'satzklammer', 'modal-bracket'], lessons: ['g08'] },
      { id: 'A5', title: '可分动词', skills: ['separable-verbs', 'separable-verb'], lessons: ['g09'] },
      { id: 'A6', title: '命令式', sub: 'Sie / du / ihr 三种形式', skills: ['imperative-du'], lessons: [] },
    ],
  },
  {
    label: '时态',
    cells: [
      { id: 'B1', title: '完成时 Perfekt', skills: ['perfekt-intro', 'perfekt-haben', 'perfekt-sein', 'perfekt-narrate'], lessons: ['g12'] },
      { id: 'B2', title: 'war / hatte', sub: 'A1 只有这两个动词用过去时', skills: ['war-hatte'], lessons: ['g12'] },
    ],
  },
  {
    label: '名词系统',
    cells: [
      { id: 'C1', title: '名词的性 · 冠词', skills: ['noun-gender', 'def-article', 'indef-article'], lessons: ['g03'] },
      { id: 'C2', title: '复数', skills: ['plural'], lessons: ['g04'] },
      { id: 'C3', title: '第四格 Akkusativ', skills: ['akk-masc-only', 'akk-review'], lessons: ['g06'] },
      { id: 'C4', title: '第三格 Dativ', skills: ['dativ-dem-der', 'gefallen-dat'], lessons: ['g10'] },
      { id: 'C5', title: '否定 · 物主冠词', sub: 'nicht vs kein ＋ mein dein sein',
        skills: ['nicht-kein', 'kein-basic', 'possessive-basic', 'possessive-agree', 'wessen-review'], lessons: ['g11'] },
    ],
  },
  {
    label: '小词',
    cells: [
      // 人称代词一/四/三格散在 g01 / g06 / g10 三课，从来没有一处集中讲"代词也要变格"。
      { id: 'D1', title: '人称代词三格 · 反身',
        skills: ['pron-sg', 'pronoun-replace', 'pronoun-akk', 'pronoun-dativ', 'sie-formal', 'du-vs-sie', 'du-sie', 'reflexive-prep'], lessons: [] },
      { id: 'D2', title: '介词', sub: '第四格 / 第三格 / 地点，缺横向对照',
        skills: ['prep-dativ-zu', 'zu-dativ', 'location-dativ'], lessons: [] },
      { id: 'D3', title: '数字 · 钟点 · 日期',
        skills: ['numbers-1-20', 'numbers-tens', 'numbers-compound', 'numbers-large',
          'prep-time-an-um', 'time-formal', 'time-informal', 'ordinal-date'], lessons: [] },
      { id: 'D4', title: 'man · es gibt · 不定代词', skills: ['es-impersonal'], lessons: [] },
    ],
  },
  {
    label: '描述与连接',
    cells: [
      { id: 'E1', title: '表语形容词 · 比较', sub: 'A1 不要求词尾变化；gut/besser, gern/lieber',
        skills: ['pred-adj', 'zu-adj', 'comparative'], lessons: [] },
      { id: 'E2', title: '频率与地点副词', sub: 'immer oft nie · hier links rechts',
        skills: ['sequence-adverbs'], lessons: [] },
      // 考纲连词只有 und/oder/aber/denn/also/auch，全是并列；weil/dass/wenn 不在 A1。
      { id: 'E3', title: '并列连词', sub: 'und oder aber denn also auch（A1 无从句）',
        skills: [], lessons: [] },
    ],
  },
];

export const GRAMMAR_CELLS = GRAMMAR_GROUPS.flatMap(group => group.cells);

/* ---------- 二 词汇轴 ---------- */
// 由 tools/wortliste.json（Goethe A1 官方词表 849 条）离线统计得出，
// tests/panorama.test.mjs 会重算并校验这三个数，词表或 vocab.js 变动时会红。
// 只算实词（名/动/形/副）：功能词归语法格子，否则同一件事被数两遍。
export const VOCAB_AXIS = {
  goetheContentWords: 694, // 考纲实词总数
  appCovered: 310,         // 应用已收录且命中考纲的实词
  appTotal: 440,           // data/vocab.js 词条总数
  // 14 个主题的分解还做不了：wortliste.json 没有主题标签。
  // 这不只是为了画进度环——主线挑今天用哪份材料，靠的就是"这个主题下我还差多少词"。
  themesPending: true,
};

/* ---------- 三 题型轴（11 格） ---------- */
// Goethe-Zertifikat A1 Start Deutsch 1 的真实题型。这条轴回答"应试目的"，也暴露产品缺口。
// status: ready 有完整题型 / partial 有素材但没题型 / none 完全没有
export const EXAM_GROUPS = [
  {
    label: '听 Hören', cells: [
      { id: 'H1', title: '日常短对话', sub: '判断对错', status: 'partial', note: '精听有素材，无考试题型' },
      { id: 'H2', title: '电话留言', sub: '三选一', status: 'none' },
      { id: 'H3', title: '公共广播', sub: '车站·商场·校园', status: 'none' },
    ],
  },
  {
    label: '读 Lesen', cells: [
      { id: 'L1', title: '短文 · 邮件', sub: '判断对错', status: 'partial', note: '精读有素材，无题型' },
      { id: 'L2', title: '小广告', sub: '找匹配的那一条', status: 'none' },
      { id: 'L3', title: '告示牌 · 通知', sub: 'Aushang', status: 'none' },
    ],
  },
  {
    label: '写 Schreiben', cells: [
      { id: 'S1', title: '填表格', sub: 'Formular：姓名·地址·生日', status: 'none', note: '成本极低，考试稳拿分' },
      { id: 'S2', title: '短信息', sub: '约 30 词：约时间·请假·道歉', status: 'none' },
    ],
  },
  {
    label: '说 Sprechen', cells: [
      { id: 'P1', title: '自我介绍', sub: '＋拼写名字＋报电话号码', status: 'partial', note: '只有跟读评分，不能说自己的信息' },
      { id: 'P2', title: '关键词卡提问', sub: '看卡片提问并回答', status: 'none' },
      { id: 'P3', title: '请求与回应', sub: '看图提出请求', status: 'none' },
    ],
  },
];

export const EXAM_CELLS = EXAM_GROUPS.flatMap(group => group.cells);

/* ---------- 展示口径 ---------- */
// 四档配色的分界线。和 content-readiness.js 的 GRAMMAR_FLOOR=40 保持一致。
export const BANDS = [
  { min: 70, key: 'strong', label: '稳了' },
  { min: 40, key: 'ok', label: '要巩固' },
  { min: 1, key: 'weak', label: '刚碰过' },
  { min: 0, key: 'none', label: '还没碰过' },
];

export function bandOf(strength) {
  return BANDS.find(band => strength >= band.min) || BANDS[BANDS.length - 1];
}
