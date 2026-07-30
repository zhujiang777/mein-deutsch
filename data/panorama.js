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
    id: 'V1', title: '五个致命陷阱',
    sub: 'w=v · v=f · z=ts · s+元音=z · ei/ie 正好反过来',
    skills: ['diphthong', 'spelling-rules'],
    reads: 'Wein · viel · Zeit · sagen · wie',
    pronLessons: ['v1'],
  },
  {
    id: 'V2', title: '元音长短',
    sub: '拼写线索决定长短 ＋ 不重读的 e 弱化',
    skills: ['vowel-length'],
    reads: 'Name · Tag · Jahr · Boot · bitte',
    pronLessons: ['v2'],
  },
  {
    id: 'V3', title: 'ch 与 sch 家族',
    sub: 'ch 两读 · sch · 词首 sp/st · -ig · tsch',
    skills: ['ch-sound', 's-family'],
    reads: 'ich · auch · Deutsch · Sprache · Student',
    pronLessons: ['v3'],
  },
  {
    id: 'V4', title: 'ä ö ü 与 r',
    sub: '变元音口诀 ＋ 词尾 -er 读"呃"不卷舌',
    skills: ['umlaut', 'r-sound'],
    reads: 'Käse · schön · über · Bruder · Uhr',
    pronLessons: ['v4'],
  },
  {
    id: 'V5', title: '词尾与重音',
    sub: '词尾清化 · pf · ng/nk · tz · -tion ＋ 重音在第一音节',
    skills: ['final-devoicing', 'misc-consonants', 'word-stress'],
    reads: 'Abend · Apfel · Zeitung · Frühstück',
    pronLessons: ['v5'],
  },
  {
    id: 'V6', title: '语调 · 拼名字 · 通关测',
    sub: '句尾升降 ＋ 字母名（只学用得到的）＋ 生词通关测',
    skills: ['sentence-intonation', 'alphabet'],
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
      { id: 'A6', title: '命令式', sub: 'Sie / du / ihr 三种形式', skills: ['imperative-du'], lessons: ['g15'] },
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
      // 人称代词一/四/三格原本散在 g01 / g06 / g10 三课，g18 把三个格摆到了一张表上。
      { id: 'D1', title: '人称代词三格 · 反身',
        skills: ['pron-sg', 'pronoun-replace', 'pronoun-akk', 'pronoun-dativ', 'sie-formal', 'du-vs-sie', 'du-sie', 'reflexive-prep'], lessons: ['g18'] },
      { id: 'D2', title: '介词', sub: '第三格介词 · 在哪儿 vs 往哪走 · 缩合',
        skills: ['prep-dativ-zu', 'zu-dativ', 'location-dativ'], lessons: ['g19'] },
      { id: 'D3', title: '数字 · 钟点 · 日期',
        skills: ['numbers-1-20', 'numbers-tens', 'numbers-compound', 'numbers-large',
          'prep-time-an-um', 'time-formal', 'time-informal', 'ordinal-date'], lessons: ['g14'] },
      { id: 'D4', title: 'man · es gibt · 不定代词', skills: ['es-impersonal'], lessons: ['g20'] },
    ],
  },
  {
    label: '描述与连接',
    cells: [
      { id: 'E1', title: '表语形容词 · 比较', sub: 'A1 不要求词尾变化；gut/besser, gern/lieber',
        skills: ['pred-adj', 'zu-adj', 'comparative'], lessons: ['g16'] },
      { id: 'E2', title: '频率与地点副词', sub: 'immer oft nie · hier links rechts',
        skills: ['sequence-adverbs'], lessons: ['g17'] },
      // 考纲连词只有 und/oder/aber/denn/also/auch，全是并列；weil/dass/wenn 不在 A1。
      { id: 'E3', title: '并列连词', sub: 'und oder aber denn also（A1 无从句）',
        skills: ['conj-coord', 'conj-denn'], lessons: ['g13'] },
    ],
  },
];

export const GRAMMAR_CELLS = GRAMMAR_GROUPS.flatMap(group => group.cells);

/**
 * 主线走格子的顺序。上面按主题分组是给人看的（"名词系统"放一起才找得到），
 * 但学的顺序不能按主题走——B1 完成时排在 C1 名词的性前面，人会学不下去。
 *
 * 这个顺序不是另拍脑袋定的：它等于每一格名下第一节微步课在课表里的先后。
 * 也就是说主线顺序 = 既有课表顺序，只是被重新切成 20 个有名字、有终点的格子。
 * tests/mainline.test.mjs 会拿课表重算一遍，内容挪位置时这里会红。
 */
export const MAINLINE_ORDER = [
  'A1', 'A2', 'D3', 'A3', 'C1', 'C5', 'C2', 'A6', 'E1', 'A5',
  'E2', 'A4', 'C3', 'D1', 'C4', 'D2', 'B2', 'B1', 'D4', 'E3',
];

/* ---------- 二 词汇轴 ---------- */
// 由 tools/wortliste.json（Goethe A1 官方词表 849 条）离线统计得出，
// tests/panorama.test.mjs 会重算并校验这三个数，词表或 vocab.js 变动时会红。
// 只算实词（名/动/形/副）：功能词归语法格子，否则同一件事被数两遍。
export const VOCAB_AXIS = {
  goetheContentWords: 694, // 考纲实词总数
  appCovered: 310,         // 应用已收录且命中考纲的实词
  appTotal: 442,           // data/vocab.js 词条总数
  // 14 个主题的分解还做不了：wortliste.json 没有主题标签。
  // 这不只是为了画进度环——主线挑今天用哪份材料，靠的就是"这个主题下我还差多少词"。
  themesPending: true,
};

/* ---------- 三 题型轴（11 格） ---------- */
// Goethe-Zertifikat A1 Start Deutsch 1 的真实题型。这条轴回答"应试目的"，也暴露产品缺口。
//
// 口径已按官方模考平台 bfu.goethe.de/a1_sd1/ 逐模块核实（2026-07）。
// 之前有三处是错的，改内容前请先看这三条，别照着旧描述出题：
//   · H1 短对话不是判断对错，是三选一；
//   · 公共广播不是三选一，是判断对错，而且**只播一遍**（全场唯一一处）；
//   · L2 不是"从多条里找匹配的那条"，是"两个来源二选一（a 还是 b）"。
// H2/H3 的内容也按官方 Teil 顺序对调过：Teil 2 是广播，Teil 3 才是电话留言。
//
// teil = 官方顺序；count/points = 官方题量与分值；plays = 听力播放次数。
// 笔试 65 分钟（听 20 + 读 25 + 写 20），口试 15 分钟单独一场。
// status: ready 有完整题型 / partial 有素材但没题型 / none 完全没有
export const EXAM_GROUPS = [
  {
    label: '听 Hören · 20 分钟', cells: [
      { id: 'H1', title: '日常短对话', sub: '三选一 a/b/c · 播两遍', teil: 1, count: 6, points: 6, plays: 2,
        status: 'ready' },
      { id: 'H2', title: '公共广播 Durchsagen', sub: '判断对错 · 只播一遍', teil: 2, count: 4, points: 4, plays: 1,
        status: 'ready', note: '全场唯一只播一遍的部分' },
      { id: 'H3', title: '电话留言 · 语音信箱', sub: '三选一 a/b/c · 播两遍', teil: 3, count: 5, points: 5, plays: 2,
        status: 'ready' },
    ],
  },
  {
    label: '读 Lesen · 25 分钟', cells: [
      { id: 'L1', title: '短信 · 邮件 · 通知', sub: '判断对错', teil: 1, count: 5, points: 5,
        status: 'ready' },
      { id: 'L2', title: '两个来源二选一', sub: '看需求，选 a 还是 b', teil: 2, count: 5, points: 5, status: 'ready' },
      { id: 'L3', title: '告示牌 Aushang', sub: '判断对错', teil: 3, count: 5, points: 5, status: 'ready' },
    ],
  },
  {
    label: '写 Schreiben · 20 分钟', cells: [
      { id: 'S1', title: '填表格 Formular', sub: '5 个空：姓名·地址·生日·职业', teil: 1, count: 5, points: 5,
        status: 'ready' },
      { id: 'S2', title: '短信息', sub: '约 30 词 · 3 个要点 + 称呼与结尾', teil: 2, count: 1, points: 10,
        status: 'ready', note: '写完看范文自评；AI 批改是下一版' },
    ],
  },
  {
    label: '说 Sprechen · 15 分钟', cells: [
      { id: 'P1', title: '自我介绍', sub: '7 个关键词 ＋拼写名字 ＋报号码', teil: 1,
        status: 'ready', note: '题用你自己的档案现拼 · 专名不计分' },
      { id: 'P2', title: '关键词卡提问', sub: '主题卡 + 关键词卡，提问并回答', teil: 2,
        status: 'ready', note: '降级实现：先选出对的问句，再说出来' },
      { id: 'P3', title: '请求与回应', sub: '看图卡提出请求并回应', teil: 3,
        status: 'ready', note: '降级实现：文字卡代替图卡，选 + 说两步' },
    ],
  },
];

/** 笔试各部分时长（分钟）。口试 15 分钟是单独一场，不叠在笔试里。 */
export const EXAM_TIMING = { hoeren: 20, lesen: 25, schreiben: 20, sprechen: 15 };

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
