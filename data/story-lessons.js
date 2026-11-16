// 故事课（新版课文课）：固定人物的连续故事。第 0 课发音入门 + 第 1 单元 4 课。
// 应用（heft/）直接读这个文件。字段说明见 docs/schema.md §2，写课规则见 docs/course-authoring.md。
// lines 的下标被 preview.line / cards.after / words.line / dictation / shadow 引用；改课文顺序时一起改，并升级 version。
// 选择题的正确项都写在第一个（answer: 0），页面负责打乱。

const line = (who, de, zh, say) => (say ? { who, de, zh, say } : { who, de, zh });
const choice = (id, prompt, options, extra = {}) => ({ id, type: 'choice', prompt, options, answer: 0, ...extra });
const listen = (id, voice, audioText, prompt, options, extra = {}) => ({ id, type: 'listenChoice', voice, audioText, prompt, options, answer: 0, ...extra });
const match = (id, pairs) => ({ id, type: 'match', pairs: pairs.map(([de, zh]) => ({ de, zh })) });
const assemble = (id, zh, answer, distractors = []) => ({ id, type: 'assemble', zh, answer, distractors });
const reply = (id, prompt, answers, cue) => ({ id, type: 'response', prompt, answers, model: answers[0], ...(cue ? { cue: { who: cue[0], de: cue[1] } } : {}) });

// 角色 → 固定配音（ElevenLabs 声音名，用户 2026-11-09 选定）。hi 是预习“认人物”时听的那句自我介绍。WORD_VOICE 读单词、词包和发音例词。
export const STORY_CAST = {
  Lin: { zh: '你 · 新加坡来的交换生，学 BWL（会计）', voice: 'Jonas Falk', me: true, hi: 'Hallo! Ich bin Lin.' },
  Lena: { zh: 'Lena Vogel · 学医，来自 Leipzig，永远在赶时间', voice: 'Lea', hi: 'Hallo! Ich bin Lena.' },
  Tom: { zh: 'Tom Becker · 哲学读了六年，来自 Köln，爱做饭不洗碗', voice: 'Dylan Carter', hi: 'Hallo! Ich bin Tom.' },
  Krause: { zh: 'Herr Krause · 宿舍管理员，只说 Sie', voice: 'Erich Steiner', hi: 'Guten Tag. Mein Name ist Krause.' },
  // 第 2 单元起：面包店、咖啡馆（以后超市、药店）共用的店员
  Verk: { zh: '店员 · 面包店、咖啡馆里招呼你的人', voice: 'Petra', hi: 'Guten Morgen! Bitte schön?' },
};
export const WORD_VOICE = 'Lena';
// 人名地名：不算生词，也不要求出现在词库里
export const STORY_NAMES = ['lin', 'lena', 'tom', 'tim', 'mia', 'mai', 'mira', 'krause', 'becker', 'vogel', 'köln', 'leipzig', 'singapur', 'china', 'japan', 'korea'];

const SEIN = { head: ['', 'sein'], rows: [['ich', 'bin'], ['du', 'bist'], ['er / sie', 'ist'], ['wir', 'sind'], ['ihr', 'seid'], ['sie / Sie', 'sind']] };
/** 变位表里一格怎么念：'er / sie' + 'kommt' → “er kommt”。页面和配音清单共用。 */
export const rowSay = (row, col = 1) => `${row[0].split(' / ')[0]} ${row[col]}`.trim(); // 冠词表的行头是空的（行名写在 table.labels），念的就是那一格：“der Kuchen”
const PERS = ['ich', 'du', 'er / sie', 'wir', 'ihr', 'sie / Sie'];
/** 规则动词现在时的变位表：词干 + -e -st -t -en -t -en。 */
const reg = (...inf) => ({ head: ['', ...inf], rows: PERS.map((p, i) => [p, ...inf.map(v => v.slice(0, -2) + ['e', 'st', 't', 'en', 't', 'en'][i])]) });
const REGULAR = reg('kommen', 'wohnen');
const STUDIEREN = reg('studieren', 'kochen');
const SEIN_KOCHEN = { head: ['', 'sein', 'kochen'], rows: PERS.map((p, i) => [p, SEIN.rows[i][1], STUDIEREN.rows[i][2]]) };
const SEIN_WOHNEN = { head: ['', 'sein', 'wohnen'], rows: PERS.map((p, i) => [p, SEIN.rows[i][1], REGULAR.rows[i][2]]) };
/** 语法卡小题（drill）里那一组怎么写、怎么念：'Bist' + 'du' → “du bist”；尊称保留大写 “Sie sind”。 */
export const drillSay = d => d.say || `${d.sj === 'Sie' && d.row === 5 ? 'Sie' : d.sj.toLowerCase()} ${d.v.toLowerCase()}`; // 不是“主语 + 动词”的小题（冠词、否定）自己写 say：'das Brot'

/* ================= 第 0 课：发音入门 ================= */
const L = (l, name, say) => ({ l, name, say });
const R = (s, w, zh, c, gap, pic) => ({ s, w, zh, c, ...(gap ? { gap } : {}), ...(pic ? { pic } : {}) });
const T = (w, zh) => ({ w, zh });
/** 小抄和“先读再听”里的词去掉标读音的方括号：'der K[ä]se' → 'der Käse'。页面和配音清单共用。 */
export const plainWord = w => w.replace(/[[\]]/g, '');
const LESSON_0 = {
  id: 'sl-00', version: 1, unit: 0, n: 0, kind: 'pron', days: 1,
  title: '发音入门', titleDe: 'Das Alphabet',
  scene: '搬进来之前，你站在宿舍楼下：Schillerstraße 8。门铃上三个名牌——Krause、Becker、Vogel。先把它们读出来。',
  canDo: ['看到没见过的词能读出来', '能把自己的名字拼给别人听'],
  role: 'Lin', cast: ['Lena', 'Krause'],
  stops: [
    {
      id: 'abc', title: '字母表', hard: ['A', 'E', 'I', 'J', 'V', 'W', 'Y', 'Z'], // 字母名最容易读错的，表里标出来
      cue: '26 个字母，加 ä ö ü ß。标出来的 8 个，字母名和英语不一样。',
      letters: [
        L('A', 'a', 'Ah'), L('B', 'be', 'Beh'), L('C', 'ce', 'Tseh'), L('D', 'de', 'Deh'), L('E', 'e', 'Eh'), L('F', 'ef', 'Eff'),
        L('G', 'ge', 'Geh'), L('H', 'ha', 'Hah'), L('I', 'i', 'Ih'), L('J', 'jot', 'Jott'), L('K', 'ka', 'Kah'), L('L', 'el', 'Ell'),
        L('M', 'em', 'Emm'), L('N', 'en', 'Enn'), L('O', 'o', 'Oh'), L('P', 'pe', 'Peh'), L('Q', 'ku', 'Kuh'), L('R', 'er', 'Err'),
        L('S', 'es', 'Ess'), L('T', 'te', 'Teh'), L('U', 'u', 'Uh'), L('V', 'vau', 'Fau'), L('W', 'we', 'Weh'), L('X', 'ix', 'Iks'),
        L('Y', 'ypsilon', 'Ypsilon'), L('Z', 'zett', 'Zett'), L('Ä', 'a-Umlaut', 'Ä'), L('Ö', 'o-Umlaut', 'Ö'), L('Ü', 'u-Umlaut', 'Ü'), L('ß', 'Eszett', 'Eszett'),
      ],
      exercises: [
        listen('a1', 'Lena', 'E', '听到的是哪个字母？', ['E', 'I', 'A'], { say: 'Eh' }),
        listen('a3', 'Lena', 'W', '听到的是哪个字母？', ['W', 'V', 'B'], { say: 'Weh' }),
        listen('a6', 'Lena', 'L – I – N', '拼的是哪个名字？', ['Lin', 'Len', 'Lien'], { say: 'Ell, Ih, Enn.' }),
        listen('a7', 'Lena', 'T – O – M', '拼的是哪个名字？', ['Tom', 'Tim', 'Tor'], { say: 'Teh, Oh, Emm.' }),
        { id: 'a8', type: 'try', w: 'L – I – N', zh: '', prompt: '把你的名字拼出来，再听原声', voice: 'Lin', say: 'Ell, Ih, Enn' },
      ],
    },
    // 拼读小抄：一行一个读音，配一个课里会学到的词（[ ] 里是这个读音）和一句“嘴怎么动”。不用拼音、英语做类比。
    // tries：照着小抄先自己读、再听原声的词，不判对错。
    {
      id: 'vokale', title: 'ä ö ü · ei ie eu au',
      rows: [
        R('ä', 'der K[ä]se', '奶酪', '先发 e，嘴再张大一点', false, 'm-ae'),
        R('ö', 'sch[ö]n', '美、好', '先发 e，舌头不动，嘴唇收圆、往前伸', false, 'm-oe'),
        R('ü', 'Tsch[ü]ss!', '拜拜', '先发 i，舌头不动，嘴唇收圆、往前伸', false, 'm-ue'),
        R('ei', 'n[ei]n', '不', '从 a 滑到 i', true),
        R('ie', 'S[ie]', '您', '长的 i，e 不发音'),
        R('eu', 'n[eu]', '新的', '从 o 滑到 i'),
        R('au', '[au]s', '来自', '从 a 滑到 u'),
      ],
      tries: [T('D[eu]tsch', '德语'), T('die K[ü]che', '厨房'), T('h[ei]ßen', '叫（名字）')],
    },
    {
      id: 'konsonant', title: 'r w v z j s ß',
      rows: [
        R('r', '[r]ichtig', '对的', '舌尖贴着下牙不动，舌头后部抬向嘴的最里面，气流擦过时喉咙振动', false, 'm-r'),
        R('r', 'hie[r]', '这里', '在元音后面不摩擦，读成很轻的 a'),
        R('w', '[w]ohnen', '住', '上牙轻碰下唇，喉咙振动', true, 'm-wv'),
        R('v', '[v]ier', '四', '嘴形同 w，喉咙不振动', false, 'm-wv'),
        R('z', 'das [Z]immer', '房间', 't 和 s 连成一个音', false, 'm-z'),
        R('j', '[j]a', '是', '很短的 i，马上接后面的元音'),
        R('s', '[S]ie', '您', '在元音前，喉咙振动', true),
        R('ß', 'die Stra[ß]e', '街', '喉咙不振动'),
      ],
      tries: [T('F[r]au K[r]ause', '克劳泽女士'), T('das [W]a[ss]er', '水'), T('[z]ehn', '十'), T('[J]apan', '日本')],
    },
    {
      id: 'kombi', title: 'ch sch st sp · 词尾',
      rows: [
        R('ch', 'i[ch]', '我', 'i、e 后面：摆好 i 的嘴形，不出声，只送气', false, 'm-ich'),
        R('ch', 'au[ch]', '也', 'a、o、u 后面：舌头后部抬起，在嘴的最里面送气', false, 'm-ach'),
        R('sch', '[sch]ön', '美、好', '嘴唇收圆往前伸，舌尖不卷', false, 'm-sch'),
        R('st', 'der [St]udent', '大学生', '在词的开头，s 读成 sch', true),
        R('sp', 'der [Sp]ort', '运动', '在词的开头，s 读成 sch'),
        R('-er', 'das Zimm[er]', '房间', '在词尾读成又短又轻的 a', true),
        R('-g', 'der Ta[g]', '天', '词尾的 b、d、g 读成 p、t、k'),
      ],
      tries: [T('[sp]re[ch]en', '说话'), T('das Bu[ch]', '书'), T('Guten Ta[g]!', '你好（白天）')],
    },
    {
      id: 'klingel', title: '门铃名牌',
      // blind：不给音、不给意思，先自己读，再点开听
      blind: [['Krause', '管理员的姓'], ['Becker', 'Tom 的姓'], ['Vogel', 'Lena 的姓'], ['Schillerstraße 8', '宿舍地址', 'Schillerstraße acht'], ['Zimmer 3', '三号房间', 'Zimmer drei']]
        .map(([de, zh, say]) => (say ? { de, zh, say } : { de, zh })),
    },
  ],
};

/* ================= 第 1 课 ================= */
const LESSON_1 = {
  id: 'sl-01', version: 1, unit: 1, n: 1, days: 1,
  title: '厨房里的第一面', cover: '厨房初见', titleDe: 'Neu hier',
  scene: '早上，宿舍的公用厨房。你拖着箱子走进来。Lena 叼着面包在找钥匙，Tom 在煮咖啡。',
  canDo: ['自我介绍', '名字被听错时纠正并拼出来'],
  role: 'Lin', cast: ['Lena', 'Tom'],
  lines: [
    line('Lena', 'Oh, hallo! Bist du neu hier?', '哦，你好！你是新来的？'),
    line('Lin', 'Ja. Hallo! Ich bin Lin.', '对。你好！我是 Lin。'),
    line('Lena', 'Wie bitte? Tim?', '什么？Tim？'),
    line('Lin', 'Nein, Lin. L – I – N.', '不是，Lin。L、I、N。', 'Nein, Lin. Ell, Ih, Enn.'),
    line('Lena', 'Ah, Lin! Ich bin Lena. Und das ist Tom.', '啊，Lin！我是 Lena。这是 Tom。'),
    line('Tom', 'Hallo, Lin! Willkommen! Kaffee?', '你好 Lin！欢迎！来杯咖啡？'),
    line('Lin', 'Ja, bitte. Danke!', '好的，谢谢！'),
    line('Lena', 'Oh nein, mein Bus! Tschüss!', '糟了，我的公交！拜拜！'),
    line('Tom', 'Tschüss, Lena! … Sie ist immer so.', '拜，Lena！……她总是这样。'),
    line('Lin', 'Ach so.', '原来如此。'),
  ],
  preview: [
    { de: 'neu', zh: '新的', line: 0, pic: 'neu' },
    { de: 'Wie bitte?', zh: '什么？没听清', line: 2, pic: 'frage' },
    { de: 'der Kaffee', zh: '咖啡', line: 5, pic: 'kaffee' },
    { de: 'der Bus', zh: '公交车', line: 7, pic: 'bus' },
    { de: 'Tschüss!', zh: '拜拜', line: 7, pic: 'raus' },
  ],
  listenQuestion: choice('hq', 'Tom 请 Lin 喝什么？', ['咖啡', '茶', '水'], { key: 2 }),
  words: [
    { id: 'w218', de: 'neu', zh: '新的', line: 0, form: 'neu' },
    { id: 'w247', de: 'hier', zh: '这里', line: 0, form: 'hier' },
    { id: 'w254', de: 'Wie bitte?', zh: '什么？请再说一遍', line: 2, form: 'Wie bitte?' },
    { de: 'willkommen', zh: '欢迎', pos: 'adj.', line: 5, form: 'Willkommen' },
    { id: 'w081', de: 'der Kaffee', zh: '咖啡', line: 5, form: 'Kaffee' },
    { id: 'w153', de: 'der Bus', zh: '公交车', line: 7, form: 'Bus' },
    { id: 'w006', de: 'Tschüss!', zh: '拜拜', line: 7, form: 'Tschüss' },
    { id: 'w249', de: 'immer', zh: '总是', line: 8, form: 'immer' },
  ],
  phrases: [
    { de: 'Ich bin …', zh: '我是……' }, { de: 'Das ist …', zh: '这是……（介绍别人）' }, { de: 'Ja, bitte.', zh: '好的，麻烦了' },
    { de: 'Oh nein!', zh: '糟了！' }, { de: 'Ach so.', zh: '原来如此' }, { de: 'Sie ist immer so.', zh: '她总是这样' },
  ],
  gloss: {
    oh: '哦', hallo: '你好', bist: '是（du 用 bist，原形 sein）', du: '你', neu: '新的', hier: '这里', ja: '是的、好的',
    ich: '我', bin: '是（ich 用 bin，原形 sein）', lin: '你的名字', wie: 'Wie bitte? = 什么？请再说一遍', bitte: '请；Ja, bitte. = 好的，麻烦了',
    tim: '人名', nein: '不、不是', l: '字母 L', i: '字母 I', n: '字母 N', ah: '啊', lena: '人名', und: '和；那……呢',
    das: 'Das ist … = 这是……', ist: '是（er / sie 用 ist，原形 sein）', tom: '人名', willkommen: '欢迎', kaffee: 'der Kaffee 咖啡',
    danke: '谢谢', mein: '我的', bus: 'der Bus 公交车', 'tschüss': '拜拜（口语）', sie: '她', immer: '总是', so: '这样', ach: 'Ach so. = 原来如此',
    in: '在……里', der: '冠词（der Kaffee；in der WG 整体看）', wg: 'die WG 合租公寓', im: '= in dem；im Bus = 在公交车上',
    bis: 'Bis später! = 回头见', 'später': '晚些时候；Bis später! = 回头见',
  },
  cards: [
    { after: 1, kind: 'grammar', title: 'sein：ich bin · du bist', body: 'sein 是不规则动词，变位要逐个记：ich bin，du bist。', table: SEIN, on: [0, 1], example: 'Ich bin Lin. Bist du neu hier?',
      drill: [
        { line: 0, de: 'Bist du neu hier?', zh: '你是新来的？', v: 'Bist', no: 'Bin', sj: 'du', row: 1 },
        { line: 1, de: 'Ich bin Lin.', zh: '我是 Lin。', v: 'bin', no: 'bist', sj: 'Ich', row: 0 },
      ] },
    { after: 5, kind: 'tip', shelf: 'grammar', title: 'der · die · das', body: '名词分三种性，颜色表示性：阳性 der 蓝，阴性 die 红，中性 das 绿。记名词时连冠词一起记。', words: ['der Kaffee', 'die Küche', 'das Zimmer'] },
    { after: 9, kind: 'pron', title: 'ich 和 ach 里的 ch', body: 'ich 的 ch：摆好 i 的嘴形，不出声，只送气。ach 的 ch：舌头后部抬起，在嘴的最里面送气。', pairs: ['ich', 'Ach so.'], example: 'Ich bin Lin.', pics: ['m-ich', 'm-ach'] },
  ],
  exercises: [
    match('x1', [['neu', '新的'], ['hier', '这里'], ['der Kaffee', '咖啡'], ['der Bus', '公交车'], ['immer', '总是'], ['willkommen', '欢迎']]),
    choice('x2', '___ du neu hier?', ['Bist', 'Bin']),
    choice('x3', 'Ich ___ Lena.', ['bin', 'bist']),
    listen('x4', 'Lena', 'Wie bitte?', '她的意思是……', ['没听清，请再说一遍', '很高兴认识你', '谢谢你']),
    choice('x5', 'Lena 为什么突然说 Tschüss？', ['她的公交要走了', '她不想喝咖啡', '她不认识 Lin']),
    assemble('x6', '这是 Tom。', 'Das ist Tom.', ['bin', 'du']),
    assemble('x7', '你是新来的吗？', 'Bist du neu hier?', ['bin', 'ich']),
    choice('x8', 'Tom 问 “Kaffee?”，你想喝。你说：', ['Ja, bitte.', 'Ach so.', 'Wie bitte?']),
    listen('x9', 'Lena', 'M – I – A', '拼的是哪个名字？', ['Mia', 'Mai', 'Mira'], { say: 'Emm, Ih, Ah.' }),
    listen('x10', 'Tom', 'Willkommen!', '他的意思是……', ['欢迎', '再见', '谢谢']),
    choice('x11', 'Lena 要走了，她说：', ['Tschüss!', 'Willkommen!', 'Ja, bitte.']),
    choice('x12', 'Oh nein, mein ___! Tschüss!', ['Bus', 'Kaffee', 'Hallo']),
    assemble('x13', '她总是这样。', 'Sie ist immer so.', ['bin', 'du']),
  ],
  dictation: [0, 1, 2, 6],
  shadow: [1, 3, 6, 9],
  speak: [
    reply('s1', '回答她，并说出你的名字。', ['Ja. Ich bin Lin.', 'Ja, ich bin Lin.', 'Ja. Hallo! Ich bin Lin.'], ['Lena', 'Hallo! Bist du neu hier?']),
    reply('s2', '纠正他，再把名字拼一遍。', ['Nein, Lin. L – I – N.'], ['Tom', 'Wie bitte? Tim?']),
    reply('s3', '接受，并道谢。', ['Ja, bitte. Danke!', 'Ja, bitte.', 'Ja, danke!'], ['Tom', 'Kaffee?']),
  ],
  reviews: [
    reply('r1', '没听清对方说什么，请他再说一遍。', ['Wie bitte?']),
    reply('r2', '向新认识的同学介绍自己。', ['Ich bin Lin.', 'Hallo! Ich bin Lin.', 'Hallo, ich bin Lin.']),
    reply('r3', '把 Tom 介绍给别人：“这是 Tom。”', ['Das ist Tom.']),
  ],
  reading: {
    title: '冰箱门上的便利贴', kind: 'read',
    lines: [
      line('Lena', 'Hallo, Lin!', '嗨，Lin！'),
      line('Lena', 'Willkommen in der WG!', '欢迎来到我们的合租公寓！'),
      line('Lena', 'Der Kaffee ist hier.', '咖啡在这儿。'),
      line('Lena', 'Tom ist immer hier.', 'Tom 总在这儿。'),
      line('Lena', 'Ich bin immer im Bus.', '我总在公交车上。'),
      line('Lena', 'Bis später!', '回头见！'),
    ],
    newWords: [
      { de: 'die WG', zh: '合租公寓', forms: ['wg'] },
      { de: 'in', zh: '在……里（in der WG、im Bus）', forms: ['in', 'im'] },
      { de: 'Bis später!', zh: '回头见', forms: ['bis', 'später'] },
    ],
    question: choice('q', 'Lena 说自己总是在哪儿？', ['公交车上', '厨房里', '房间里']),
  },
};

/* ================= 第 2 课 ================= */
const LESSON_2 = {
  id: 'sl-02', version: 1, unit: 1, n: 2, days: 1,
  title: '你从哪来', titleDe: 'Woher kommst du?',
  scene: '晚上，厨房。Tom 一边切菜一边打量你。他不让你回答，非要自己猜。',
  canDo: ['说自己来自哪、住在哪', '反问对方'],
  role: 'Lin', cast: ['Tom'],
  lines: [
    line('Tom', 'Lin, woher kommst du?', 'Lin，你是哪里人？'),
    line('Lin', 'Ich komme aus –', '我来自——', 'Ich komme aus …'),
    line('Tom', 'Moment! Nicht sagen! Aus China?', '等等！别说！中国？'),
    line('Lin', 'Nein.', '不是。'),
    line('Tom', 'Aus Japan?', '日本？'),
    line('Lin', 'Nein.', '不是。'),
    line('Tom', 'Aus Korea?', '韩国？'),
    line('Lin', 'Nein! Ich komme aus Singapur.', '不是！我来自新加坡。'),
    line('Tom', 'Ah, Singapur! Klar.', '啊，新加坡！当然当然。'),
    line('Lin', 'Und du? Woher kommst du?', '你呢？你是哪里人？'),
    line('Tom', 'Aus Köln. Aber ich wohne hier.', '科隆。不过我住这儿。'),
    line('Lin', 'Und wo wohne ich?', '那我住哪儿？'),
    line('Tom', 'Du wohnst auch hier!', '你也住这儿！'),
    line('Lin', 'Richtig!', '答对了！'),
    line('Tom', 'Na endlich!', '可算对了！'),
  ],
  preview: [
    { de: 'Woher?', zh: '从哪里', line: 0, pic: 'woher' },
    { de: 'kommen aus …', zh: '来自……', line: 7, pic: 'pfeil' },
    { de: 'China', zh: '中国', line: 2, pic: 'land' },
    { de: 'Singapur', zh: '新加坡', line: 7, pic: 'land' },
    { de: 'Wo?', zh: '在哪里', line: 11, pic: 'ort' },
    { de: 'wohnen', zh: '住', line: 10, pic: 'haus' },
  ],
  listenQuestion: choice('hq', 'Lin 来自哪个国家？', ['新加坡', '中国', '日本'], { key: 3 }),
  words: [
    { id: 'w235', de: 'woher', zh: '从哪里', line: 0, form: 'woher' },
    { id: 'w017', de: 'kommen', zh: '来', line: 7, form: 'komme' },
    { de: 'aus', zh: '从……来；来自', pos: 'prep.', line: 7, form: 'aus' },
    { id: 'w243', de: 'aber', zh: '但是', line: 10, form: 'Aber' },
    { id: 'w018', de: 'wohnen', zh: '住', line: 10, form: 'wohne' },
    { id: 'w234', de: 'wo', zh: '在哪里', line: 11, form: 'wo' },
    { id: 'w245', de: 'auch', zh: '也', line: 12, form: 'auch' },
    { id: 'w229', de: 'richtig', zh: '对的', line: 13, form: 'Richtig' },
  ],
  phrases: [
    { de: 'Moment!', zh: '等一下！' }, { de: 'Nicht sagen!', zh: '别说！' }, { de: 'Und du?', zh: '你呢？' },
    { de: 'Klar.', zh: '当然' }, { de: 'Na endlich!', zh: '总算！' },
  ],
  gloss: {
    lin: '你的名字', woher: '从哪里', kommst: '来（du 用 kommst，原形 kommen）', du: '你', ich: '我', komme: '来（ich 用 komme，原形 kommen）',
    aus: '从……来；来自', moment: 'Moment! = 等一下', nicht: '不；Nicht sagen! = 别说', sagen: '说；Nicht sagen! = 别说',
    china: '中国', nein: '不、不是', japan: '日本', korea: '韩国', singapur: '新加坡', ah: '啊', klar: '当然、明白',
    und: '和；那……呢', 'köln': '科隆（德国城市）', aber: '但是', wohne: '住（ich 用 wohne，原形 wohnen）', hier: '这里',
    wo: '在哪里', wohnst: '住（du 用 wohnst，原形 wohnen）', auch: '也', richtig: '对的', na: 'Na endlich! = 总算', endlich: '终于；Na endlich! = 总算',
    hallo: '你好', zusammen: '一起；Hallo zusammen! = 大家好', bin: '是（ich 用 bin）', neu: '新的', jetzt: '现在', in: '在……里', zimmer: 'das Zimmer 房间',
  },
  cards: [
    { after: 11, kind: 'tip', shelf: 'grammar', title: 'Woher? · Wo?', body: 'Woher 问来源（从哪里来），Wo 问位置（在哪里）。' },
    { after: 12, kind: 'grammar', title: '规则动词：ich -e · du -st', body: '规则动词的现在时 = 词干 + 人称词尾：ich → -e，du → -st。', table: REGULAR, on: [0, 1], example: 'Woher kommst du? – Ich komme aus Singapur.',
      drill: [
        { line: 7, de: 'Ich komme aus Singapur.', zh: '我来自新加坡。', v: 'komme', no: 'kommst', sj: 'Ich', row: 0, col: 1 },
        { line: 9, de: 'Woher kommst du?', zh: '你是哪里人？', v: 'kommst', no: 'komme', sj: 'du', row: 1, col: 1 },
        { line: 12, de: 'Du wohnst auch hier!', zh: '你也住这儿！', v: 'wohnst', no: 'wohne', sj: 'Du', row: 1, col: 2 },
      ] },
    { after: 0, kind: 'pron', title: 'w：上牙碰下唇', body: '上牙轻碰下唇，喉咙振动。嘴唇不要收圆。', pairs: ['wo', 'woher', 'wohnen', 'Wie bitte?'], example: 'Wo wohne ich?', pics: ['m-wv'] },
    { after: 2, kind: 'tip', shelf: 'pron', title: 'China', body: '德语的 China 开头读 ich 里的 ch；南德也有人读成 k。' },
  ],
  exercises: [
    match('x1', [['Woher?', '从哪里'], ['Wo?', '在哪里'], ['kommen aus', '来自'], ['wohnen', '住'], ['auch', '也'], ['aber', '但是'], ['richtig', '对的']]),
    choice('x2', 'Woher ___ du?', ['kommst', 'komme']),
    choice('x3', 'Ich ___ hier.', ['wohne', 'wohnst']),
    choice('x4', '“Wo wohnst du?” 问的是……', ['你住在哪', '你从哪来', '你叫什么']),
    listen('x5', 'Tom', 'Woher kommst du?', '选出合适的回答。', ['Ich komme aus Singapur.', 'Ich wohne hier.', 'Ich bin Lin.']),
    listen('x6', 'Tom', 'Wo wohnst du?', '选出合适的回答。', ['Ich wohne hier.', 'Ich komme aus Köln.', 'Ja, bitte.']),
    assemble('x7', '我来自新加坡。', 'Ich komme aus Singapur.', ['kommst', 'wohne']),
    assemble('x8', '你也住这儿！', 'Du wohnst auch hier!', ['wohne', 'aus']),
    choice('x9', 'Tom 是哪里人？', ['科隆 Köln', '柏林 Berlin', '慕尼黑 München']),
    choice('x10', 'Tom 最后猜对了什么？', ['Lin 住在哪', 'Lin 来自哪个国家', 'Lin 的名字']),
    choice('x11', 'Ich komme aus Singapur. ___ ich wohne hier.', ['Aber', 'Woher', 'Richtig']),
    choice('x12', '对方说对了，你说：', ['Richtig!', 'Nein!', 'Wie bitte?']),
  ],
  dictation: [0, 7, 11, 12],
  shadow: [7, 9, 11, 13],
  speak: [
    reply('s1', '告诉他你来自新加坡。', ['Ich komme aus Singapur.', 'Aus Singapur.'], ['Tom', 'Woher kommst du?']),
    reply('s2', '你就住这儿。', ['Ich wohne hier.', 'Hier.'], ['Lena', 'Und wo wohnst du?']),
    reply('s3', '问 Lena 是哪里人。', ['Woher kommst du?', 'Lena, woher kommst du?', 'Und du? Woher kommst du?']),
  ],
  reviews: [
    reply('r1', '有人问你是哪里人。回答。', ['Ich komme aus Singapur.', 'Aus Singapur.']),
    reply('r2', '问新同学住在哪。', ['Wo wohnst du?']),
    reply('r3', '“我也住这儿。”', ['Ich wohne auch hier.']),
  ],
  reading: {
    title: '宿舍群里的消息', kind: 'read',
    lines: [
      line('Lin', 'Hallo zusammen!', '大家好！'),
      line('Lin', 'Ich bin Lin und ich bin neu hier.', '我是 Lin，新来的。'),
      line('Lin', 'Ich komme aus Singapur.', '我来自新加坡。'),
      line('Lin', 'Ich wohne jetzt in Zimmer 3.', '我现在住三号房间。', 'Ich wohne jetzt in Zimmer drei.'),
      line('Tom', 'Hallo, Lin! Ich wohne auch hier.', '嗨，Lin！我也住这儿。'),
    ],
    newWords: [
      { de: 'Hallo zusammen!', zh: '大家好', forms: ['zusammen'] },
      { de: 'jetzt', zh: '现在', forms: ['jetzt'] },
      { de: 'das Zimmer', zh: '房间', forms: ['zimmer'] },
    ],
    question: choice('q', 'Lin 现在住在哪？', ['三号房间', '科隆', '公交车上']),
  },
};

/* ================= 第 3 课 ================= */
const LESSON_3 = {
  id: 'sl-03', version: 1, unit: 1, n: 3, days: 1,
  title: '她学医，他读了六年', cover: '读了六年', titleDe: 'Was studierst du?',
  scene: '厨房。你和 Tom 聊起专业。Tom 正说到 Lena，Lena 刚好推门进来。',
  canDo: ['说自己学什么', '介绍别人学什么、做什么', '数 0–12'],
  role: 'Lin', cast: ['Tom', 'Lena'],
  lines: [
    line('Lin', 'Tom, was studierst du?', 'Tom，你学什么专业？'),
    line('Tom', 'Philosophie. Und du?', '哲学。你呢？'),
    line('Lin', 'Ich studiere BWL. Und Lena? Was studiert sie?', '我学 BWL。Lena 呢？她学什么？'),
    line('Tom', 'Sie studiert Medizin. Sie lernt und lernt und lernt.', '她学医。她学啊学啊学。'),
    line('Lena', 'Hallo! Und Tom? Er studiert schon sechs Jahre!', '嗨！那 Tom 呢？他都读了六年了！'),
    line('Lin', 'Sechs Jahre?', '六年？'),
    line('Tom', 'Na und? Ich koche gut!', '那又怎样？我做饭好吃！'),
    line('Lena', 'Stimmt. Er kocht gut.', '这倒是。他做饭确实好。'),
  ],
  preview: [
    { de: 'studieren', zh: '上大学；学（专业）', line: 0, pic: 'uni' },
    { de: 'lernen', zh: '学习、用功', line: 3, pic: 'buch' },
    { de: 'sechs Jahre', zh: '六年', line: 4, pic: 'kalender' },
    { de: 'kochen', zh: '做饭', line: 6, pic: 'topf' },
    { de: 'gut', zh: '好', line: 6, pic: 'daumen' },
  ],
  listenQuestion: choice('hq', 'Tom 读了几年？', ['六年', '三年', '两年'], { key: 2 }),
  words: [
    { id: 'w233', de: 'was', zh: '什么', line: 0, form: 'was' },
    { id: 'w405', de: 'studieren', zh: '上大学；学（专业）', line: 2, form: 'studiere' },
    { id: 'w112', de: 'lernen', zh: '学习、用功', line: 3, form: 'lernt' },
    { id: 'w433', de: 'schon', zh: '已经', line: 4, form: 'schon' },
    { id: 'w036', de: 'sechs', zh: '六', line: 5, form: 'Sechs' },
    { id: 'w029', de: 'das Jahr', zh: '年（复数 Jahre）', line: 5, form: 'Jahre' },
    { id: 'w117', de: 'kochen', zh: '做饭', line: 7, form: 'kocht' },
    { id: 'w214', de: 'gut', zh: '好', line: 7, form: 'gut' },
  ],
  phrases: [
    { de: 'Und du?', zh: '你呢？' }, { de: 'Na und?', zh: '那又怎样？' }, { de: 'Stimmt.', zh: '没错' },
    { de: 'Sie lernt und lernt und lernt.', zh: '她学啊学啊学（动词重复 = 一直在做）' },
  ],
  gloss: {
    tom: '人名', was: '什么', studierst: '学（专业）（du 用 studierst，原形 studieren）', du: '你', philosophie: 'die Philosophie 哲学',
    und: '和；那……呢', ich: '我', studiere: '学（专业）（ich 用 studiere，原形 studieren）', bwl: '企业管理（Betriebswirtschaftslehre 的缩写，按字母读）',
    lena: '人名', studiert: '学（专业）（er / sie 用 studiert，原形 studieren）', sie: '她', medizin: 'die Medizin 医学',
    lernt: '学习、用功（er / sie 用 lernt，原形 lernen）', hallo: '你好', er: '他', schon: '已经', sechs: '六', jahre: 'das Jahr 年（复数 Jahre）',
    na: 'Na und? = 那又怎样', koche: '做饭（ich 用 koche，原形 kochen）', gut: '好', stimmt: 'Stimmt. = 没错', kocht: '做饭（er / sie 用 kocht，原形 kochen）',
    das: 'Das ist … = 这是……', ist: '是（er / sie 用 ist）', kommt: '来（er / sie 用 kommt，原形 kommen）', aus: '来自', 'köln': '科隆（德国城市）',
    aber: '但是', 'spült': '洗碗（原形 spülen）', nicht: '不', leipzig: '莱比锡（德国城市）', viel: '很多', lin: '你的名字', singapur: '新加坡',
    rechnungswesen: 'das Rechnungswesen 会计', neu: '新的', hier: '这里',
  },
  cards: [
    { after: 7, kind: 'grammar', title: 'er / sie：词尾 -t', body: '第三人称单数（er / sie）：词干 + -t。sein 不规则：er / sie ist。', table: STUDIEREN, on: [2], example: 'Sie studiert Medizin. Er kocht gut.',
      drill: [
        { line: 3, de: 'Sie studiert Medizin.', zh: '她学医。', v: 'studiert', no: 'studiere', sj: 'Sie', row: 2, col: 1 },
        { line: 7, de: 'Er kocht gut.', zh: '他做饭确实好。', v: 'kocht', no: 'koche', sj: 'Er', row: 2, col: 2 },
      ] },
    { after: 2, kind: 'pron', title: '词首的 st、sp', body: 'st、sp 在词的开头，s 读成 sch：studieren、Sport。sch 嘴唇收圆往前伸，舌尖不卷。', pairs: ['studieren', 'der Student', 'Stimmt.', 'der Sport'], example: 'Was studierst du?', pics: ['m-sch'] },
    { after: 2, kind: 'tip', title: 'BWL', body: '会计（Rechnungswesen）在德国大学归在 BWL 下面，自我介绍说 “Ich studiere BWL.”，三个字母按字母名读：Be-We-El。' },
  ],
  // 词包：整套给全，课文里只出现其中一两个
  wordPack: {
    id: 'zahlen-0-12', title: '数字 0–12', refs: ['w035', 'w036', 'w037', 'w038'], inText: ['sechs'],
    items: [['0', 'null'], ['1', 'eins'], ['2', 'zwei'], ['3', 'drei'], ['4', 'vier'], ['5', 'fünf'], ['6', 'sechs'], ['7', 'sieben'], ['8', 'acht'], ['9', 'neun'], ['10', 'zehn'], ['11', 'elf'], ['12', 'zwölf']]
      .map(([n, de]) => ({ n, de })),
    exercises: [
      match('p1', [['null', '0'], ['drei', '3'], ['fünf', '5'], ['acht', '8'], ['zehn', '10'], ['elf', '11']]),
      listen('p2', 'Lena', 'sieben', '听到的是几？', ['7', '6', '9']),
      listen('p3', 'Lena', 'zwölf', '听到的是几？', ['12', '11', '2']),
      listen('p4', 'Lena', 'zwei', '听到的是几？', ['2', '3', '12']),
      assemble('p5', '从 1 数到 5。', 'eins zwei drei vier fünf', ['sechs']),
      choice('p6', 'sechs + zwei = ?', ['acht', 'neun', 'sieben']),
      choice('p7', 'zwölf − eins = ?', ['elf', 'zehn', 'zwei']),
      listen('p8', 'Lena', 'null, eins, sieben, sechs, drei, neun', '听到的是哪串数字？', ['0 1 7 6 3 9', '0 1 7 3 6 9', '0 7 1 6 3 9']),
    ],
  },
  exercises: [
    match('x1', [['was', '什么'], ['studieren', '上大学'], ['lernen', '学习、用功'], ['kochen', '做饭'], ['gut', '好'], ['schon', '已经'], ['das Jahr', '年']]),
    choice('x2', 'Sie ___ Medizin.', ['studiert', 'studiere', 'studierst']),
    choice('x3', 'Er ___ gut.', ['kocht', 'koche', 'kochst']),
    choice('x4', 'Was ___ du?', ['studierst', 'studiert', 'studiere']),
    choice('x5', 'Lena 学什么专业？', ['医学', '哲学', '企业管理']),
    choice('x6', 'Tom 说 “Na und?”，他拿什么给自己撑腰？', ['他做饭好', '他学得快', '他年纪小']),
    assemble('x7', '她学医。', 'Sie studiert Medizin.', ['studiere', 'er']),
    assemble('x8', '他已经读了六年了！', 'Er studiert schon sechs Jahre!', ['studierst', 'gut']),
    listen('x9', 'Lena', 'Er kocht gut.', '她在说谁？', ['一个男生', '一个女生', '她自己']),
    listen('x10', 'Tom', 'Sie lernt und lernt und lernt.', 'Tom 说 Lena 怎么样？', ['一直在学习', '做饭很好', '住在这儿']),
  ],
  dictation: [0, 3, 5, 7],
  shadow: [0, 2, 5],
  speak: [
    reply('s1', '告诉她你的专业。', ['Ich studiere BWL.', 'BWL.'], ['Lena', 'Was studierst du?']),
    reply('s2', '告诉他 Lena 学医。', ['Sie studiert Medizin.', 'Medizin.'], ['Tom', 'Und Lena? Was studiert sie?']),
    reply('s3', '替 Tom 说句好话：他做饭好。', ['Er kocht gut.', 'Tom kocht gut.'], ['Lena', 'Tom studiert schon sechs Jahre!']),
  ],
  reviews: [
    reply('r1', '问对方学什么专业。', ['Was studierst du?']),
    reply('r2', '“她学医。”', ['Sie studiert Medizin.']),
    reply('r3', '“他做饭好。”', ['Er kocht gut.']),
  ],
  reading: {
    title: '冰箱门上的室友档案', kind: 'read',
    lines: [
      line('Lena', 'Das ist Tom.', '这是 Tom。'),
      line('Lena', 'Er kommt aus Köln und studiert Philosophie.', '他来自科隆，学哲学。'),
      line('Lena', 'Er kocht gut, aber er spült nicht.', '他做饭好，但是不洗碗。'),
      line('Lena', 'Das ist Lena.', '这是 Lena。'),
      line('Lena', 'Sie kommt aus Leipzig und studiert Medizin.', '她来自莱比锡，学医。'),
      line('Lena', 'Sie lernt viel.', '她学得很多。'),
      line('Lena', 'Das ist Lin.', '这是 Lin。'),
      line('Lena', 'Er kommt aus Singapur und studiert BWL: Rechnungswesen.', '他来自新加坡，学 BWL：会计。'),
      line('Lena', 'Er ist neu hier.', '他是新来的。'),
    ],
    newWords: [
      { de: 'spülen', zh: '洗碗', forms: ['spült'] },
      { de: 'viel', zh: '很多', forms: ['viel'] },
      { de: 'das Rechnungswesen', zh: '会计', forms: ['rechnungswesen'] },
    ],
    question: choice('q', '谁做饭好，但是不洗碗？', ['Tom', 'Lena', 'Lin']),
  },
};

/* ================= 第 4 课 ================= */
const LESSON_4 = {
  id: 'sl-04', version: 1, unit: 1, n: 4, days: 1,
  title: '管理员来了', titleDe: 'Guten Tag, Herr Krause',
  scene: '有人敲门。Tom 从猫眼里看了一眼，立刻躲到门后。门外是宿舍管理员 Herr Krause。',
  canDo: ['分清什么时候说 du、什么时候说 Sie', '应对正式的提问'],
  role: 'Lin', cast: ['Tom', 'Krause'],
  lines: [
    line('Tom', 'Oh nein, Herr Krause! Ich bin nicht da!', '糟了，Krause 先生！我不在！'),
    line('Krause', 'Guten Tag. Mein Name ist Krause. Sind Sie neu hier?', '您好。我姓 Krause。您是新来的？'),
    line('Lin', 'Guten Tag! Ja. Ich bin Lin.', '您好！是的。我是 Lin。'),
    line('Krause', 'Wohnen Sie in Zimmer drei?', '您住三号房间？'),
    line('Lin', 'Ja, Zimmer drei.', '对，三号房间。'),
    line('Krause', 'Gut. Hier ist Ihr Schlüssel.', '好。这是您的钥匙。'),
    line('Lin', 'Danke schön!', '非常感谢！'),
    line('Krause', 'Ist Herr Becker auch da?', 'Becker 先生也在吗？'),
    line('Lin', 'Tom? Äh … nein. Er ist nicht da.', 'Tom？呃……不在。他不在。'),
    line('Krause', 'So, so. Auf Wiedersehen.', '是嘛。再见。'),
    line('Lin', 'Auf Wiedersehen!', '再见！'),
    line('Tom', 'Puh! Danke, Lin!', '呼！谢了，Lin！'),
  ],
  preview: [
    { de: 'Guten Tag!', zh: '您好（白天）', line: 1, pic: 'hand' },
    { de: 'Herr …', zh: '……先生', line: 0, pic: 'person' },
    { de: 'das Zimmer', zh: '房间', line: 3, pic: 'tuer' },
    { de: 'der Schlüssel', zh: '钥匙', line: 5, pic: 'schluessel' },
    { de: 'nicht da', zh: '不在', line: 8, pic: 'leer' },
    { de: 'Auf Wiedersehen!', zh: '再见（正式）', line: 9, pic: 'raus' },
  ],
  listenQuestion: choice('hq', 'Herr Krause 给了 Lin 什么？', ['钥匙', '咖啡', '一封信'], { key: 3 }),
  words: [
    { de: 'Herr', zh: '先生（Herr + 姓）', art: 'der', line: 7, form: 'Herr' },
    { id: 'w003', de: 'Guten Tag!', zh: '您好（白天）', line: 1, form: 'Guten Tag' },
    { id: 'w020', de: 'der Name', zh: '名字', line: 1, form: 'Name' },
    { id: 'w137', de: 'das Zimmer', zh: '房间', line: 3, form: 'Zimmer' },
    { id: 'w146', de: 'der Schlüssel', zh: '钥匙', line: 5, form: 'Schlüssel' },
    { id: 'w244', de: 'nicht', zh: '不', line: 8, form: 'nicht' },
    { de: 'da', zh: '在（这儿、那儿）', pos: 'adv.', line: 8, form: 'da' },
    { id: 'w007', de: 'Auf Wiedersehen!', zh: '再见（正式）', line: 9, form: 'Auf Wiedersehen' },
  ],
  phrases: [
    { de: 'Mein Name ist …', zh: '我姓……／我叫……（正式）' }, { de: 'Hier ist Ihr Schlüssel.', zh: '这是您的钥匙（Ihr = 您的）' },
    { de: 'Danke schön!', zh: '非常感谢' }, { de: 'nicht da', zh: '不在' }, { de: 'So, so.', zh: '是嘛（不太相信）' },
  ],
  gloss: {
    oh: '哦', nein: '不、不是', herr: '先生（Herr + 姓）', krause: '人名（姓）', ich: '我', bin: '是（ich 用 bin）', nicht: '不',
    da: '在（这儿、那儿）；nicht da = 不在', guten: 'Guten Tag. = 您好（白天）', tag: 'der Tag 天；Guten Tag. = 您好', mein: '我的',
    name: 'der Name 名字', ist: '是（er / sie 用 ist）', sind: '是（Sie 用 sind，原形 sein）', sie: 'Sie（大写）= 您；sie（小写）= 她',
    neu: '新的', hier: '这里', ja: '是的', lin: '你的名字', wohnen: '住（Sie 用 wohnen）', in: '在……里', zimmer: 'das Zimmer 房间',
    drei: '三', gut: '好', ihr: 'Ihr（大写）= 您的', 'schlüssel': 'der Schlüssel 钥匙', danke: '谢谢', 'schön': 'Danke schön! = 非常感谢',
    becker: '人名（Tom 的姓）', auch: '也', tom: '人名', 'äh': '呃', er: '他', so: 'So, so. = 是嘛（不太相信）',
    auf: 'Auf Wiedersehen! = 再见（正式）', wiedersehen: 'Auf Wiedersehen! = 再见（正式）', puh: '呼（松一口气）',
    nie: '从不', die: '冠词（die Küche）', 'küche': 'die Küche 厨房', sauber: '干净的', morgen: '明天', im: '= in dem；im Büro = 在办公室', 'büro': 'das Büro 办公室',
  },
  cards: [
    { after: 3, kind: 'grammar', title: '尊称 Sie', body: '尊称 Sie 永远大写；动词与不定式同形：Sie wohnen。sein 用 sind。', table: SEIN_WOHNEN, on: [5],
      drill: [
        { line: 1, de: 'Sind Sie neu hier?', zh: '您是新来的？', v: 'Sind', no: 'Bist', sj: 'Sie', row: 5, col: 1 },
        { line: 3, de: 'Wohnen Sie in Zimmer drei?', zh: '您住三号房间？', v: 'Wohnen', no: 'Wohnst', sj: 'Sie', row: 5, col: 2 },
      ],
      contrast: [['Bist du neu hier?', 'Sind Sie neu hier?'], ['Wohnst du hier?', 'Wohnen Sie hier?'], ['Tschüss!', 'Auf Wiedersehen!']], example: 'Sind Sie neu hier? Wohnen Sie in Zimmer drei?' },
    { after: 3, kind: 'pron', title: 'z 和 s', body: 'z：t 和 s 连成一个音，短而干脆。s 在元音前，喉咙振动。', pairs: ['das Zimmer', 'Sie', 'zehn', 'so'], example: 'Wohnen Sie in Zimmer drei?', pics: ['m-z'] },
    { after: 7, kind: 'tip', shelf: 'grammar', title: '一般疑问句', body: '没有疑问词的问句，动词放在句首：Sind Sie neu hier? Ist Herr Becker auch da?' },
    { after: 9, kind: 'tip', title: 'du 还是 Sie', body: '同学、室友之间说 du；对管理员、老师、办事窗口、店员说 Sie。拿不准就先说 Sie。' },
  ],
  exercises: [
    match('x1', [['Guten Tag!', '您好'], ['Auf Wiedersehen!', '再见（正式）'], ['der Schlüssel', '钥匙'], ['das Zimmer', '房间'], ['der Name', '名字'], ['nicht da', '不在']]),
    choice('x2', '“Bist du neu hier?” 可以对谁说？', ['新来的同学', '管理员 Herr Krause', '面包店的店员']),
    choice('x3', '___ Sie in Zimmer drei?', ['Wohnen', 'Wohnst', 'Wohne']),
    choice('x4', 'Er ___ nicht da.', ['ist', 'bist', 'sind']),
    choice('x5', '和 Herr Krause 告别，你说：', ['Auf Wiedersehen!', 'Tschüss, Krause!', 'Hallo!']),
    choice('x6', '用 Sie 问：“您来自科隆吗？”', ['Kommen Sie aus Köln?', 'Kommst Sie aus Köln?', 'Kommen du aus Köln?']),
    assemble('x7', '您住三号房间吗？', 'Wohnen Sie in Zimmer drei?', ['du', 'wohnst']),
    assemble('x8', '他不在。', 'Er ist nicht da.', ['bin', 'hier']),
    listen('x9', 'Krause', 'Ist Herr Becker auch da?', '他在问什么？', ['Tom 在不在', 'Lin 住几号房间', '钥匙在哪']),
    choice('x10', 'Tom 真的不在吗？', ['在，他躲起来了', '不在，他去坐公交了', '不在，他在做饭']),
    choice('x11', 'Mein ___ ist Krause.', ['Name', 'Schlüssel', 'Zimmer']),
    choice('x12', 'Zimmer drei? Gut. Hier ist Ihr ___.', ['Schlüssel', 'Name', 'Tag']),
  ],
  dictation: [3, 5, 8, 10],
  shadow: [2, 4, 6, 8, 10],
  speak: [
    reply('s1', '礼貌回应，并说出名字。', ['Guten Tag! Ja. Ich bin Lin.', 'Guten Tag! Ja, ich bin Lin.', 'Ja. Ich bin Lin.', 'Ja, ich bin Lin.'], ['Krause', 'Guten Tag. Sind Sie neu hier?']),
    reply('s2', '对，三号房间。', ['Ja, Zimmer drei.', 'Ja.', 'Ja, ich wohne in Zimmer drei.'], ['Krause', 'Wohnen Sie in Zimmer drei?']),
    reply('s3', '替 Tom 挡一下：他不在。', ['Nein, er ist nicht da.', 'Nein. Er ist nicht da.', 'Er ist nicht da.'], ['Krause', 'Ist Herr Becker auch da?']),
  ],
  reviews: [
    reply('r1', '白天遇到管理员，向他问好。', ['Guten Tag!', 'Guten Tag, Herr Krause!']),
    reply('r2', '“他不在。”', ['Er ist nicht da.']),
    reply('r3', '用 Sie 问：“您是新来的吗？”', ['Sind Sie neu hier?']),
  ],
  reading: {
    title: '门上的便条', kind: 'read',
    lines: [
      line('Krause', 'Guten Tag, Herr Becker!', '您好，Becker 先生！'),
      line('Krause', 'Sie sind nie da.', '您从来不在。'),
      line('Krause', 'Die Küche ist nicht sauber.', '厨房不干净。'),
      line('Krause', 'Ich bin morgen im Büro.', '我明天在办公室。'),
      line('Krause', 'Auf Wiedersehen!', '再见！'),
    ],
    newWords: [
      { de: 'nie', zh: '从不', forms: ['nie'] },
      { de: 'die Küche', zh: '厨房', forms: ['küche'] },
      { de: 'sauber', zh: '干净的', forms: ['sauber'] },
      { de: 'morgen', zh: '明天', forms: ['morgen'] },
      { de: 'das Büro', zh: '办公室', forms: ['büro'] },
    ],
    question: choice('q', 'Herr Krause 为什么找 Tom？', ['厨房不干净', 'Tom 没拿钥匙', 'Tom 是新来的']),
  },
};

/* ================= 第 2 单元：数量与简单购买（一课两天） ================= */
/** 冠词表：行头是空的，行名写在 labels；一格就是“冠词 + 名词”，念出来是 der Kuchen。 */
const ARTIKEL_5 = { head: ['', '定冠词'], labels: ['阳性', '阴性', '中性'], rows: [['', 'der Kuchen'], ['', 'die Brezel'], ['', 'das Brot']] };
const LESSON_5 = {
  id: 'sl-05', version: 1, unit: 2, n: 5, days: 2,
  title: '面包店', titleDe: 'In der Bäckerei',
  scene: '早上，宿舍楼下的面包店。你第一次自己买早餐。',
  canDo: ['听懂价格', '在面包店说要什么'],
  role: 'Lin', cast: ['Verk'],
  lines: [
    line('Verk', 'Guten Morgen! Bitte schön?', '早上好！您要点什么？'),
    line('Lin', 'Guten Morgen! Was kostet das Brot?', '早上好！这个面包多少钱？'),
    line('Verk', 'Das Brot kostet drei Euro zwanzig.', '面包三欧二十。'),
    line('Lin', 'Und die Brezel?', '那碱水结呢？'),
    line('Verk', 'Die Brezel kostet neunzig Cent. Der Kuchen ist heute sehr gut!', '碱水结九十分。今天的蛋糕特别好！'),
    line('Lin', 'Nein, danke. Das Brot und die Brezel, bitte.', '不用了，谢谢。要面包和碱水结。'),
    line('Verk', 'Gern. Das macht vier Euro zehn.', '好的。一共四欧十分。'),
    line('Lin', 'Wie bitte? Vierzehn Euro?!', '什么？十四欧？！'),
    line('Verk', 'Nein, nein! Vier Euro zehn.', '不不！四欧十分。'),
    line('Lin', 'Ach so! Hier, bitte.', '原来如此！给您。'),
    line('Verk', 'Danke. Hier ist die Tüte. Tschüss!', '谢谢。这是袋子。拜拜！'),
    line('Lin', 'Danke schön! Tschüss!', '非常感谢！拜拜！'),
  ],
  preview: [
    { de: 'das Brot', zh: '面包', line: 1, pic: 'brot' },
    { de: 'die Brezel', zh: '碱水结', line: 3, pic: 'brezel' },
    { de: 'der Kuchen', zh: '蛋糕', line: 4, pic: 'kuchen' },
    { de: 'Was kostet …?', zh: '……多少钱？', line: 1, pic: 'preis' },
    { de: 'der Euro', zh: '欧元', line: 2, pic: 'euro' },
    { de: 'Das macht …', zh: '一共……', line: 6, pic: 'kasse' },
  ],
  listenQuestion: choice('hq', 'Lin 买了什么？', ['面包和碱水结', '蛋糕', '面包和蛋糕'], { key: 0 }),
  listenMore: [
    choice('hq2', '一共多少钱？', ['4,10 €', '14 €', '4,01 €']),
    choice('hq3', '店员推荐了什么？', ['蛋糕', '碱水结', '咖啡']),
  ],
  words: [
    { id: 'w129', de: 'kosten', zh: '价格是、值……钱', line: 1, form: 'kostet' },
    { id: 'w078', de: 'das Brot', zh: '面包', line: 1, form: 'Brot' },
    { de: 'die Brezel', zh: '碱水结', line: 3, form: 'Brezel' },
    { id: 'w377', de: 'der Kuchen', zh: '蛋糕', line: 4, form: 'Kuchen' },
    { de: 'die Tüte', zh: '袋子', line: 10, form: 'Tüte' },
    { id: 'w364', de: 'der Euro', zh: '欧元', line: 2, form: 'Euro' },
    { de: 'der Cent', zh: '分（欧元的百分之一）', line: 4, form: 'Cent' },
    { id: 'w057', de: 'heute', zh: '今天', line: 4, form: 'heute' },
    { id: 'w246', de: 'sehr', zh: '很、非常', line: 4, form: 'sehr' },
    { de: 'Das macht …', zh: '一共……', line: 6, form: 'Das macht' },
  ],
  phrases: [
    { de: 'Guten Morgen!', zh: '早上好' }, { de: 'Bitte schön?', zh: '您要点什么？（店员招呼客人）' },
    { de: 'Hier, bitte.', zh: '给您' }, { de: 'Gern.', zh: '好的、乐意' },
  ],
  gloss: {
    guten: 'Guten Morgen! = 早上好', morgen: 'der Morgen 早上；Guten Morgen! = 早上好', bitte: '请；Bitte schön? = 您要点什么？', 'schön': 'Bitte schön? = 您要点什么？Danke schön! = 非常感谢',
    was: '什么；Was kostet …? = ……多少钱？', kostet: '价格是（er / sie / es 用 kostet，原形 kosten）', das: '定冠词（中性）：das Brot；Das macht … = 一共……', brot: 'das Brot 面包',
    drei: '三', euro: 'der Euro 欧元', zwanzig: '二十', und: '和；那……呢', die: '定冠词（阴性）：die Brezel', brezel: 'die Brezel 碱水结', neunzig: '九十', cent: 'der Cent 分',
    der: '定冠词（阳性）：der Kuchen', kuchen: 'der Kuchen 蛋糕', ist: '是', heute: '今天', sehr: '很、非常', gut: '好', nein: '不', danke: '谢谢', gern: '好的、乐意',
    macht: 'Das macht … = 一共……（原形 machen）', vier: '四', zehn: '十', wie: 'Wie bitte? = 什么？请再说一遍', vierzehn: '十四', ach: 'Ach so! = 原来如此', so: 'Ach so! = 原来如此',
    hier: '这里；Hier, bitte. = 给您', 'tüte': 'die Tüte 袋子', 'tschüss': '拜拜',
    im: '= in dem；im Angebot = 在优惠中', angebot: 'das Angebot 优惠', kaffee: 'der Kaffee 咖啡', zusammen: '一起', nur: '只', frisch: '新鲜的',
  },
  cards: [
    { after: 2, kind: 'tip', title: '价格里的逗号', body: '德语的小数点写成逗号：3,20 €，读 drei Euro zwanzig。' },
    { after: 5, kind: 'grammar', title: '定冠词 der · die · das', body: '名词有三种性，定冠词随性变化：阳性 der，阴性 die，中性 das。', table: ARTIKEL_5, on: [0, 1, 2],
      drill: [
        { line: 2, de: 'Das Brot kostet drei Euro zwanzig.', zh: '面包三欧二十。', v: 'Das', no: ['Der', 'Die'], sj: 'Brot', row: 2, col: 1, say: 'das Brot', hint: 'Brot 是中性名词，用 das' },
        { line: 4, de: 'Die Brezel kostet neunzig Cent.', zh: '碱水结九十分。', v: 'Die', no: ['Der', 'Das'], sj: 'Brezel', row: 1, col: 1, say: 'die Brezel', hint: 'Brezel 是阴性名词，用 die' },
        { line: 4, de: 'Der Kuchen ist heute sehr gut!', zh: '今天的蛋糕特别好！', v: 'Der', no: ['Die', 'Das'], sj: 'Kuchen', row: 0, col: 1, say: 'der Kuchen', hint: 'Kuchen 是阳性名词，用 der' },
      ],
      example: 'Das Brot und die Brezel, bitte.' },
    { after: 6, kind: 'pron', title: '词尾 -ig', body: '-ig 在词尾，g 读成 ich 里的 ch：摆好 i 的嘴形，只送气。', pairs: ['zwanzig', 'neunzig', 'dreißig', 'richtig'], example: 'Das Brot kostet drei Euro zwanzig.', pics: ['m-ich'] },
  ],
  wordPack: {
    id: 'zahlen-13-100', title: '数字 13–100', refs: ['w413', 'w039', 'w040', 'w041'], inText: ['zwanzig', 'neunzig', 'vierzehn'],
    // 三组，一组一个规律；方括号里是这一组共同的那一段
    groups: [
      { title: '13–19', rule: '个位数 + zehn。sechzehn、siebzehn 的前半截缩短了：sechs → sech-，sieben → sieb-。' },
      { title: '整十：20–100', rule: '个位数 + zig。zwanzig、dreißig 单独记；sechzig、siebzig 同样缩短。' },
      { title: '21–99', rule: '先说个位，再说十位，中间加 und。eins 在这里说成 ein：einundzwanzig。' },
    ],
    items: [[0, '13', 'drei[zehn]'], [0, '14', 'vier[zehn]'], [0, '15', 'fünf[zehn]'], [0, '16', 'sech[zehn]'], [0, '17', 'sieb[zehn]'], [0, '18', 'acht[zehn]'], [0, '19', 'neun[zehn]'],
      [1, '20', 'zwan[zig]'], [1, '30', 'drei[ßig]'], [1, '40', 'vier[zig]'], [1, '50', 'fünf[zig]'], [1, '60', 'sech[zig]'], [1, '70', 'sieb[zig]'], [1, '80', 'acht[zig]'], [1, '90', 'neun[zig]'], [1, '100', 'hundert'],
      [2, '21', 'ein[und]zwanzig'], [2, '35', 'fünf[und]dreißig'], [2, '67', 'sieben[und]sechzig'], [2, '99', 'neun[und]neunzig']].map(([g, n, mark]) => ({ g, n, de: plainWord(mark), mark })),
    exercises: [
      { ...match('p1', [['dreizehn', '13'], ['sechzehn', '16'], ['siebzehn', '17'], ['neunzehn', '19']]), g: 0 },
      listen('p2', 'Lena', 'vierzehn', '听到的是几？', ['14', '15', '19'], { g: 0 }),
      { ...match('p3', [['zwanzig', '20'], ['dreißig', '30'], ['sechzig', '60'], ['siebzig', '70'], ['hundert', '100']]), g: 1 },
      listen('p4', 'Lena', 'dreißig', '听到的是几？', ['30', '13', '3'], { g: 1 }),
      listen('p5', 'Lena', 'vierzig', '听到的是几？', ['40', '14', '4'], { g: 1 }),
      choice('p6', 'fünfunddreißig = ?', ['35', '53', '530'], { g: 2 }),
      listen('p7', 'Lena', 'einundzwanzig', '听到的是几？', ['21', '12', '20'], { g: 2 }),
      listen('p8', 'Lena', 'siebenundsechzig', '听到的是几？', ['67', '76', '617'], { g: 2 }),
      listen('p9', 'Verk', 'Das macht zwei Euro fünfzig.', '一共多少钱？', ['2,50 €', '12,50 €', '2,15 €']),
      listen('p10', 'Verk', 'neunundneunzig Cent', '听到的价格是？', ['0,99 €', '0,90 €', '9,90 €']),
      choice('p11', '3,20 € 怎么读？', ['drei Euro zwanzig', 'dreizehn Euro zwanzig', 'drei Euro zwölf']),
    ],
  },
  exercises: [
    match('x1', [['das Brot', '面包'], ['die Brezel', '碱水结'], ['der Kuchen', '蛋糕'], ['die Tüte', '袋子'], ['heute', '今天'], ['sehr', '很']]),
    choice('x2', '___ Brot kostet drei Euro zwanzig.', ['Das', 'Der', 'Die']),
    choice('x3', '___ Kuchen ist sehr gut.', ['Der', 'Die', 'Das']),
    choice('x4', '___ Tüte ist hier.', ['Die', 'Der', 'Das']),
    choice('x5', '___ Bus ist da.', ['Der', 'Die', 'Das']),
    choice('x6', '___ Zimmer ist neu.', ['Das', 'Der', 'Die']),
    listen('x7', 'Verk', 'Das macht vier Euro zehn.', '一共多少钱？', ['4,10 €', '14 €', '40 €']),
    listen('x8', 'Verk', 'Die Brezel kostet neunzig Cent.', '碱水结多少钱？', ['0,90 €', '0,19 €', '9 €']),
    assemble('x9', '这个面包多少钱？', 'Was kostet das Brot?', ['die', 'kommt']),
    assemble('x10', '今天的蛋糕很好。', 'Der Kuchen ist heute sehr gut.', ['das', 'kostet']),
    choice('x11', '店员说 “Das macht vier Euro zehn.” 意思是：', ['一共 4.10 欧', '找你 4.10 欧', '面包 4.10 欧']),
    choice('x12', '“Guten Morgen!” 什么时候说？', ['早上见面', '晚上见面', '告别']),
  ],
  dictation: [1, 2, 6, 8],
  shadow: [1, 3, 5, 9],
  speak: [
    reply('s1', '问面包多少钱。', ['Was kostet das Brot?', 'Guten Morgen! Was kostet das Brot?'], ['Verk', 'Guten Morgen! Bitte schön?']),
    reply('s2', '谢绝，要面包和碱水结。', ['Nein, danke. Das Brot und die Brezel, bitte.', 'Das Brot und die Brezel, bitte.'], ['Verk', 'Der Kuchen ist heute sehr gut!']),
    reply('s3', '没听清，请她再说一遍。', ['Wie bitte?'], ['Verk', 'Das macht vier Euro zehn.']),
  ],
  reviews: [
    reply('r1', '问碱水结多少钱。', ['Was kostet die Brezel?']),
    reply('r2', '“今天的蛋糕很好。”', ['Der Kuchen ist heute sehr gut.']),
    reply('r3', '早上进店，向店员问好。', ['Guten Morgen!']),
  ],
  reading: {
    title: '面包店门口的小黑板', kind: 'read',
    lines: [
      line('Verk', 'Heute im Angebot!', '今日优惠！'),
      line('Verk', 'Das Brot ist heute frisch: 3,20 Euro.', '面包今天新鲜出炉：3.20 欧。', 'Das Brot ist heute frisch: drei Euro zwanzig.'),
      line('Verk', 'Die Brezel: 90 Cent.', '碱水结：90 分。', 'Die Brezel: neunzig Cent.'),
      line('Verk', 'Der Kuchen: 2,50 Euro.', '蛋糕：2.50 欧。', 'Der Kuchen: zwei Euro fünfzig.'),
      line('Verk', 'Der Kaffee: 1,80 Euro.', '咖啡：1.80 欧。', 'Der Kaffee: ein Euro achtzig.'),
      line('Verk', 'Kaffee und Kuchen zusammen: nur 4 Euro!', '咖啡加蛋糕一起：只要 4 欧！', 'Kaffee und Kuchen zusammen: nur vier Euro!'),
    ],
    newWords: [
      { de: 'das Angebot', zh: '优惠', forms: ['angebot'] },
      { de: 'frisch', zh: '新鲜的', forms: ['frisch'] },
      { de: 'nur', zh: '只', forms: ['nur'] },
    ],
    question: choice('q', '咖啡和蛋糕一起买，便宜多少？', ['30 分', '50 分', '1 欧']),
  },
};

/** 冠词表第二列：不定冠词。 */
const ARTIKEL_6 = { head: ['', '定冠词', '不定冠词'], labels: ['阳性', '阴性', '中性'], rows: [['', 'der Kaffee', 'ein Kaffee'], ['', 'die Tasse', 'eine Tasse'], ['', 'das Stück', 'ein Stück']] };
const LESSON_6 = {
  id: 'sl-06', version: 1, unit: 2, n: 6, days: 2,
  title: '一杯咖啡', titleDe: 'Heute zahle ich!',
  scene: '下午，学校的咖啡馆。Tom 拉着你进来，说要请客。',
  canDo: ['点单', '付钱：一起付还是分开付'],
  role: 'Lin', cast: ['Tom', 'Verk'],
  lines: [
    line('Tom', 'Komm, Lin! Heute zahle ich.', '走，Lin！今天我请。'),
    line('Lin', 'Wirklich? Danke, Tom!', '真的？谢谢你，Tom！'),
    line('Verk', 'Hallo! Bitte schön?', '你们好！要点什么？'),
    line('Tom', 'Was kostet ein Kaffee?', '一杯咖啡多少钱？'),
    line('Verk', 'Zwei Euro fünfzig.', '两欧五十。'),
    line('Tom', 'Gut. Ich möchte eine Tasse Kaffee und ein Stück Kuchen.', '好。我要一杯咖啡和一块蛋糕。'),
    line('Lin', 'Ich möchte ein Wasser und eine Brezel, bitte.', '我要一杯水和一个碱水结。'),
    line('Verk', 'Gern. Zusammen oder getrennt?', '好的。一起付还是分开付？'),
    line('Tom', 'Zusammen!', '一起！'),
    line('Verk', 'Das macht acht Euro fünfzig.', '一共八欧五十。'),
    line('Tom', 'Moment … Oh nein! Mein Geldbeutel ist nicht da!', '等等……糟了！我的钱包不在！'),
    line('Lin', 'Tom! Wirklich?!', 'Tom！真的假的？！'),
    line('Tom', 'Äh … Zahlst du heute? Morgen zahle ich!', '呃……今天你付行吗？明天我付！'),
    line('Lin', 'Na gut. Hier, bitte.', '好吧。给您。'),
  ],
  preview: [
    { de: 'Ich möchte …', zh: '我想要……', line: 5, pic: 'bestellen' },
    { de: 'zahlen', zh: '付钱', line: 0, pic: 'zahlen' },
    { de: 'das Wasser', zh: '水', line: 6, pic: 'wasser' },
    { de: 'die Tasse', zh: '杯子', line: 5, pic: 'tasse' },
    { de: 'der Geldbeutel', zh: '钱包', line: 10, pic: 'geldbeutel' },
    { de: 'Zusammen oder getrennt?', zh: '一起付还是分开付？', line: 7, pic: 'getrennt' },
  ],
  listenQuestion: choice('hq', 'Tom 找不到什么了？', ['钱包', '钥匙', '杯子'], { key: 4 }),
  listenMore: [
    choice('hq2', '一共多少钱？', ['8,50 €', '5,80 €', '18,50 €']),
    choice('hq3', '最后谁付的钱？', ['Lin', 'Tom', '各付各的']),
  ],
  words: [
    { id: 'w258', de: 'möchten', zh: '想要', line: 5, form: 'möchte' },
    { id: 'w407', de: 'zahlen', zh: '付钱', line: 0, form: 'zahle' },
    { de: 'die Tasse', zh: '杯子', line: 5, form: 'Tasse' },
    { de: 'das Stück', zh: '块、件', line: 5, form: 'Stück' },
    { id: 'w080', de: 'das Wasser', zh: '水', line: 6, form: 'Wasser' },
    { id: 'w440', de: 'zusammen', zh: '一起', line: 7, form: 'Zusammen' },
    { id: 'w290', de: 'getrennt', zh: '分开', line: 7, form: 'getrennt' },
    { id: 'w242', de: 'oder', zh: '还是、或者', line: 7, form: 'oder' },
    { de: 'wirklich', zh: '真的', pos: 'adv.', line: 1, form: 'Wirklich' },
    { de: 'der Geldbeutel', zh: '钱包', line: 10, form: 'Geldbeutel' },
  ],
  phrases: [
    { de: 'Komm!', zh: '走吧、来' }, { de: 'Heute zahle ich.', zh: '今天我请' },
    { de: 'Ich möchte …', zh: '我想要……（点单时礼貌的说法）' }, { de: 'Na gut.', zh: '好吧（勉强答应）' },
  ],
  gloss: {
    komm: 'Komm! = 走吧、来（原形 kommen）', lin: '你的名字', heute: '今天', zahle: '付钱（ich 用 zahle，原形 zahlen）', ich: '我', wirklich: '真的', danke: '谢谢', tom: '人名',
    hallo: '你好', bitte: '请；Bitte schön? = 要点什么？', 'schön': 'Bitte schön? = 要点什么？', was: '什么；Was kostet …? = ……多少钱？', kostet: '价格是（原形 kosten）',
    ein: '不定冠词（阳性、中性）：ein Kaffee、ein Stück', kaffee: 'der Kaffee 咖啡', zwei: '二', euro: 'der Euro 欧元', 'fünfzig': '五十', gut: '好',
    'möchte': '想要（ich 用 möchte，原形 möchten）', eine: '不定冠词（阴性）：eine Tasse', tasse: 'die Tasse 杯子', und: '和', 'stück': 'das Stück 块、件', kuchen: 'der Kuchen 蛋糕',
    wasser: 'das Wasser 水', brezel: 'die Brezel 碱水结', gern: '好的、乐意', zusammen: '一起', oder: '还是、或者', getrennt: '分开', das: 'Das macht … = 一共……', macht: 'Das macht … = 一共……',
    acht: '八', moment: 'Moment! = 等一下', oh: '哦', nein: '不；Oh nein! = 糟了', mein: '我的', geldbeutel: 'der Geldbeutel 钱包（das Geld 钱）', ist: '是', nicht: '不', da: '在；nicht da = 不在',
    'äh': '呃', zahlst: '付钱（du 用 zahlst，原形 zahlen）', du: '你', morgen: '明天', na: 'Na gut. = 好吧', hier: '这里；Hier, bitte. = 给您',
    wieder: '又、重新；wieder da = 回来了、找到了', wo: '在哪里', im: '= in dem；im Kühlschrank = 在冰箱里', 'kühlschrank': 'der Kühlschrank 冰箱', 'für': '给、为了；für zwei = 两人份',
  },
  cards: [
    { after: 5, kind: 'tip', shelf: 'grammar', title: 'ich möchte', body: 'ich möchte + 想要的东西，是点单时礼貌的说法。按整体短语学。' },
    { after: 5, kind: 'pron', title: 'ö', body: '舌头摆在 e 的位置不动，嘴唇收圆往前伸。', pairs: ['möchte', 'schön', 'Köln', 'zwölf'], example: 'Ich möchte eine Tasse Kaffee.', pics: ['m-oe'] },
    { after: 6, kind: 'grammar', title: '不定冠词 ein · eine', body: '不定冠词表示“一个”或第一次提到：阳性、中性用 ein，阴性用 eine。', table: ARTIKEL_6, on: [0, 1, 2],
      drill: [
        { line: 3, de: 'Was kostet ein Kaffee?', zh: '一杯咖啡多少钱？', v: 'ein', no: ['eine'], sj: 'Kaffee', row: 0, col: 2, say: 'ein Kaffee', hint: 'Kaffee 是阳性名词（der），用 ein' },
        { line: 5, de: 'Ich möchte eine Tasse Kaffee', zh: '我要一杯咖啡', v: 'eine', no: ['ein'], sj: 'Tasse', row: 1, col: 2, say: 'eine Tasse', hint: 'Tasse 是阴性名词（die），用 eine' },
        { line: 5, de: 'ein Stück Kuchen.', zh: '一块蛋糕。', v: 'ein', no: ['eine'], sj: 'Stück', row: 2, col: 2, say: 'ein Stück', hint: 'Stück 是中性名词（das），用 ein' },
      ],
      example: 'Ich möchte ein Wasser und eine Brezel, bitte.' },
    { after: 7, kind: 'tip', title: 'Zusammen oder getrennt?', body: '结账时店员常这么问：一起付还是分开付。同学朋友之间各付各的（getrennt）很平常。' },
  ],
  wordPack: {
    id: 'getraenke', title: '饮料与点心', refs: ['w082', 'w083', 'w084', 'w079'], inText: ['wasser'],
    // 两组，一组一屏：先喝的，再吃的
    groups: [{ title: '喝的' }, { title: '吃的' }],
    items: [[0, 'der Tee', '茶'], [0, 'der Saft', '果汁'], [0, 'die Milch', '牛奶'], [0, 'die Cola', '可乐'], [0, 'das Wasser', '水'], [0, 'das Bier', '啤酒'],
      [1, 'das Brötchen', '小面包'], [1, 'das Croissant', '牛角包'], [1, 'das Eis', '冰淇淋'], [1, 'die Schokolade', '巧克力']].map(([g, de, zh]) => ({ g, n: '', de, zh })),
    exercises: [
      { ...match('p1', [['der Tee', '茶'], ['der Saft', '果汁'], ['die Milch', '牛奶'], ['das Bier', '啤酒'], ['die Cola', '可乐']]), g: 0 },
      { ...match('p2', [['das Brötchen', '小面包'], ['das Croissant', '牛角包'], ['das Eis', '冰淇淋'], ['die Schokolade', '巧克力']]), g: 1 },
      listen('p3', 'Lena', 'das Brötchen', '听到的是哪个？', ['小面包', '牛角包', '面包'], { g: 1 }),
      choice('p4', 'Das ist ___ Tee.', ['ein', 'eine']),
      choice('p5', 'Das ist ___ Cola.', ['eine', 'ein']),
      choice('p6', 'Ich möchte ___ Brötchen.', ['ein', 'eine']),
    ],
  },
  exercises: [
    match('x1', [['zahlen', '付钱'], ['die Tasse', '杯子'], ['das Stück', '块'], ['das Wasser', '水'], ['der Geldbeutel', '钱包'], ['wirklich', '真的']]),
    choice('x2', 'Was kostet ___ Kaffee?', ['ein', 'eine', 'das']),
    choice('x3', 'Ich möchte ___ Tasse Kaffee.', ['eine', 'ein', 'der']),
    choice('x4', 'Ich möchte ___ Stück Kuchen.', ['ein', 'eine', 'die']),
    choice('x5', 'Ich möchte ___ Brezel.', ['eine', 'ein', 'das']),
    choice('x6', 'Das ist ___ Schlüssel.', ['ein', 'eine', 'die']),
    choice('x7', '___ Wasser kostet zwei Euro.', ['Das', 'Der', 'Die']),
    assemble('x8', '我要一杯水和一个碱水结。', 'Ich möchte ein Wasser und eine Brezel.', ['kostet', 'der']),
    assemble('x9', '今天你付吗？', 'Zahlst du heute?', ['zahle', 'ich']),
    listen('x10', 'Verk', 'Zusammen oder getrennt?', '她在问什么？', ['一起付还是分开付', '在这吃还是带走', '要不要袋子']),
    listen('x11', 'Verk', 'Das macht acht Euro fünfzig.', '一共多少钱？', ['8,50 €', '8,15 €', '18,50 €']),
    choice('x12', '店员问 “Zusammen oder getrennt?”，你们各付各的：', ['Getrennt, bitte.', 'Zusammen, bitte.', 'Nein, danke.']),
    choice('x13', '“Wirklich?” 的意思是：', ['真的吗？', '多少钱？', '没关系']),
  ],
  dictation: [3, 6, 9, 12],
  shadow: [1, 6, 11, 13],
  speak: [
    reply('s1', '要一杯水和一个碱水结。', ['Ich möchte ein Wasser und eine Brezel, bitte.', 'Ich möchte ein Wasser und eine Brezel.'], ['Verk', 'Hallo! Bitte schön?']),
    reply('s2', '一起付。', ['Zusammen, bitte.', 'Zusammen.'], ['Verk', 'Zusammen oder getrennt?']),
    reply('s3', '勉强答应。', ['Na gut.'], ['Tom', 'Zahlst du heute? Morgen zahle ich!']),
  ],
  reviews: [
    reply('r1', '问一杯咖啡多少钱。', ['Was kostet ein Kaffee?']),
    reply('r2', '点一块蛋糕。', ['Ich möchte ein Stück Kuchen, bitte.', 'Ich möchte ein Stück Kuchen.']),
    reply('r3', '结账时：各付各的。', ['Getrennt, bitte.', 'Getrennt.']),
  ],
  reading: {
    title: 'Tom 贴在冰箱上的便条', kind: 'read',
    lines: [
      line('Tom', 'Lin!', 'Lin！'),
      line('Tom', 'Mein Geldbeutel ist wieder da.', '我的钱包找到了。'),
      line('Tom', 'Wo? Im Kühlschrank!', '在哪？在冰箱里！'),
      line('Tom', 'Morgen zahle ich. Wirklich!', '明天我请。真的！'),
      line('Tom', 'Kaffee und Kuchen für zwei.', '咖啡加蛋糕，两人份。'),
    ],
    newWords: [
      { de: 'wieder', zh: '又、重新', forms: ['wieder'] },
      { de: 'der Kühlschrank', zh: '冰箱', forms: ['kühlschrank'] },
      { de: 'für', zh: '给、为了（für zwei = 两人份）', forms: ['für'] },
    ],
    question: choice('q', '钱包在哪找到的？', ['冰箱里', '房间里', '咖啡馆里']),
  },
};

/** 否定：kein 跟着名词的性变，nicht 管其他成分。 */
const NEG_7 = { head: ['', '否定'], labels: ['阳性', '阴性', '中性', '形容词'], rows: [['', 'kein Fehler'], ['', 'keine Panik'], ['', 'kein Problem'], ['', 'nicht richtig']] };
const LESSON_7 = {
  id: 'sl-07', version: 1, unit: 2, n: 7, days: 2,
  title: '押金瓶', titleDe: 'Was ist Pfand?',
  scene: '小超市门口。你手里拿着刚买的可乐和小票，越看越不对。',
  canDo: ['说“没有、不是”', '问“这是什么”', '看懂小票上的押金'],
  role: 'Lin', cast: [],
  lines: [
    line('Lin', 'Moment. Was ist das?', '等等。这是什么？'),
    line('Lin', 'Die Cola kostet zwei Euro fünfundzwanzig.', '可乐是两欧二十五。'),
    line('Lin', 'Aber hier steht: zwei Euro fünfzig!', '可这上面写着：两欧五十！'),
    line('Lin', 'Das ist nicht richtig!', '这不对！'),
    line('Lin', 'Ist das ein Fehler?', '是算错了吗？'),
    line('Lin', 'Keine Panik, Lin.', '别慌，Lin。'),
    line('Lin', 'Hier steht auch: Pfand, fünfundzwanzig Cent.', '这儿还写着：Pfand，二十五分。'),
    line('Lin', 'Pfand? Ich verstehe das nicht.', 'Pfand？我不明白。'),
    line('Lin', 'Oh, ein Automat! Flasche zurück – Geld zurück.', '哦，有台机器！瓶子退回——钱退回。'),
    line('Lin', 'Ach so! Das Pfand kommt zurück.', '原来如此！押金会退回来。'),
    line('Lin', 'Das ist kein Fehler.', '这不是错误。'),
    line('Lin', 'Kein Problem!', '没问题！'),
    line('Lin', 'Aber fünfundzwanzig Cent sind auch Geld. Die Flasche kommt morgen zurück!', '不过二十五分也是钱。瓶子明天就拿回来退！'),
  ],
  preview: [
    { de: 'Was ist das?', zh: '这是什么？', line: 0, pic: 'frage' },
    { de: 'die Flasche', zh: '瓶子', line: 8, pic: 'flasche' },
    { de: 'der Fehler', zh: '错误', line: 4, pic: 'fehler' },
    { de: 'das Geld', zh: '钱', line: 8, pic: 'geld' },
    { de: 'zurück', zh: '回来、退回', line: 8, pic: 'zurueck' },
  ],
  listenQuestion: choice('hq', '小票上多出来的 25 分是什么？', ['瓶子的押金', '算错了', '袋子的钱'], { key: 1 }),
  listenMore: [
    choice('hq2', '可乐本身多少钱？', ['2,25 €', '2,50 €', '2,15 €']),
    choice('hq3', '瓶子退回去会怎样？', ['钱退回来', '换一瓶新的', '没有用']),
  ],
  words: [
    { de: 'das Pfand', zh: '押金', line: 6, form: 'Pfand' },
    { de: 'die Flasche', zh: '瓶子', line: 8, form: 'Flasche' },
    { de: 'der Fehler', zh: '错误', line: 4, form: 'Fehler' },
    { id: 'w184', de: 'das Geld', zh: '钱', line: 8, form: 'Geld' },
    { de: 'das Problem', zh: '问题', line: 11, form: 'Problem' },
    { id: 'w125', de: 'verstehen', zh: '明白、理解', line: 7, form: 'verstehe' },
    { de: 'zurück', zh: '回来、退回', pos: 'adv.', line: 9, form: 'zurück' },
    { de: 'der Automat', zh: '自动机器', line: 8, form: 'Automat' },
    { id: 'w283', de: 'stehen', zh: '写着；站着', line: 2, form: 'steht' },
  ],
  phrases: [
    { de: 'Was ist das?', zh: '这是什么？' }, { de: 'Hier steht …', zh: '这上面写着……' },
    { de: 'Keine Panik!', zh: '别慌！' }, { de: 'Kein Problem!', zh: '没问题！' },
  ],
  gloss: {
    moment: 'Moment. = 等一下', was: '什么', ist: '是', das: '这；定冠词（中性）', die: '定冠词（阴性）', cola: 'die Cola 可乐', kostet: '价格是（原形 kosten）', zwei: '二', euro: 'der Euro 欧元',
    'fünfundzwanzig': '二十五', aber: '但是', hier: '这里', steht: '写着（原形 stehen）；Hier steht … = 这上面写着……', 'fünfzig': '五十', nicht: '不', richtig: '对的',
    ein: '不定冠词（阳性、中性）', fehler: 'der Fehler 错误', keine: '没有、不是（否定阴性名词）；Keine Panik! = 别慌', panik: 'die Panik 慌张；Keine Panik! = 别慌', lin: '你的名字',
    auch: '也', pfand: 'das Pfand 押金', cent: 'der Cent 分', ich: '我', verstehe: '明白（ich 用 verstehe，原形 verstehen）', oh: '哦', automat: 'der Automat 自动机器',
    flasche: 'die Flasche 瓶子', 'zurück': '回来、退回', geld: 'das Geld 钱', ach: 'Ach so! = 原来如此', so: 'Ach so! = 原来如此', kommt: '来（原形 kommen）；kommt zurück = 回来、退回来',
    kein: '没有、不是（否定阳性、中性名词）', problem: 'das Problem 问题；Kein Problem! = 没问题', sind: '是（复数用 sind）', morgen: '明天',
    an: 'an alle = 致所有人', alle: '所有人', in: '在……里；in Ordnung = 可以、合规', der: '定冠词', wg: 'die WG 合租公寓', 'küche': 'die Küche 厨房', lager: 'das Lager 仓库',
    flaschen: 'die Flaschen 瓶子（Flasche 的复数）', zwanzig: '二十', ordnung: 'die Ordnung 秩序；in Ordnung = 可以、合规', bitte: '请', bringen: '拿、带；zurückbringen = 拿回去', sie: 'Sie（大写）= 您',
  },
  cards: [
    { after: 7, kind: 'pron', title: 'pf', body: '先闭紧双唇，松开时上牙马上碰下唇送气，两个音连成一个。', pairs: ['Pfand', 'Pfand zurück', 'der Pfandautomat'], example: 'Das Pfand kommt zurück.' },
    { after: 9, kind: 'tip', title: 'Pfand', body: '德国的饮料瓶和易拉罐大多带押金，一次性塑料瓶和罐是 25 分。空瓶拿到超市的退瓶机，机器出一张小票，结账时抵钱。' },
    { after: 11, kind: 'grammar', title: 'kein · nicht', body: '否定名词用 kein，词尾和 ein 一样：kein、keine、kein。否定动词、形容词等其他成分用 nicht。', table: NEG_7, on: [0, 1, 2, 3],
      drill: [
        { line: 3, de: 'Das ist nicht richtig!', zh: '这不对！', v: 'nicht', no: ['kein'], sj: 'richtig', row: 3, col: 1, say: 'nicht richtig', hint: 'richtig 是形容词，否定用 nicht' },
        { line: 5, de: 'Keine Panik, Lin.', zh: '别慌，Lin。', v: 'Keine', no: ['Kein', 'Nicht'], sj: 'Panik', row: 1, col: 1, say: 'keine Panik', hint: 'Panik 是阴性名词，用 keine' },
        { line: 10, de: 'Das ist kein Fehler.', zh: '这不是错误。', v: 'kein', no: ['nicht', 'keine'], sj: 'Fehler', row: 0, col: 1, say: 'kein Fehler', hint: 'Fehler 是阳性名词，用 kein' },
        { line: 11, de: 'Kein Problem!', zh: '没问题！', v: 'Kein', no: ['Keine', 'Nicht'], sj: 'Problem', row: 2, col: 1, say: 'kein Problem', hint: 'Problem 是中性名词，用 kein' },
      ],
      example: 'Das ist kein Fehler. Ich verstehe das nicht.' },
  ],
  exercises: [
    match('x1', [['das Pfand', '押金'], ['die Flasche', '瓶子'], ['der Fehler', '错误'], ['das Geld', '钱'], ['verstehen', '明白'], ['zurück', '回来、退回']]),
    choice('x2', 'Das ist ___ Fehler.', ['kein', 'nicht', 'keine']),
    choice('x3', 'Das ist ___ richtig.', ['nicht', 'kein', 'keine']),
    choice('x4', 'Ich verstehe das ___.', ['nicht', 'kein', 'keine']),
    choice('x5', 'Das ist ___ Cola. Das ist Wasser.', ['keine', 'kein', 'nicht']),
    choice('x6', '___ Problem!', ['Kein', 'Keine', 'Nicht']),
    choice('x7', 'Tom ist ___ da.', ['nicht', 'kein', 'keine']),
    choice('x8', 'Das ist ___ Kaffee. Das ist Tee.', ['kein', 'keine', 'nicht']),
    assemble('x9', '这不是错误。', 'Das ist kein Fehler.', ['nicht', 'keine']),
    assemble('x10', '我不明白。', 'Ich verstehe das nicht.', ['kein', 'ist']),
    listen('x11', 'Lin', 'Das Pfand kommt zurück.', '这句话的意思是：', ['押金会退回来', '押金不退', '瓶子要洗']),
    choice('x12', 'Was ist das? – Das ist ___ Automat.', ['ein', 'eine']),
    choice('x13', 'Hier ___: zwei Euro fünfzig.', ['steht', 'kostet', 'kommt']),
    choice('x14', '小票上的 “Pfand 0,25” 是：', ['瓶子的押金', '税', '袋子的钱']),
  ],
  dictation: [0, 3, 7, 10],
  shadow: [2, 4, 9, 11],
  retell: [0, 3, 7, 10, 11],
  speak: [
    reply('s1', '小票上有个不认识的词。问：“这是什么？”', ['Was ist das?']),
    reply('s2', '告诉他：不是错误，是押金。', ['Nein, das ist kein Fehler. Das ist Pfand.', 'Das ist kein Fehler. Das ist Pfand.', 'Nein, das ist kein Fehler.'], ['Tom', 'Ist das ein Fehler?']),
    reply('s3', '你没明白，告诉她。', ['Ich verstehe das nicht.', 'Ich verstehe nicht.'], ['Verk', 'Das macht zwei Euro fünfzig.']),
  ],
  reviews: [
    reply('r1', '“这不对。”', ['Das ist nicht richtig.']),
    reply('r2', '“没问题！”', ['Kein Problem!']),
    reply('r3', '“我不明白。”', ['Ich verstehe das nicht.', 'Ich verstehe nicht.']),
  ],
  reading: {
    title: 'Herr Krause 贴在厨房的通知', kind: 'read',
    lines: [
      line('Krause', 'An alle in der WG:', '致合租公寓全体：'),
      line('Krause', 'Die Küche ist kein Lager!', '厨房不是仓库！'),
      line('Krause', 'Hier sind 20 Flaschen. Zwanzig!', '这里有 20 个瓶子。二十个！', 'Hier sind zwanzig Flaschen. Zwanzig!'),
      line('Krause', 'Das ist nicht in Ordnung.', '这不合规矩。'),
      line('Krause', 'Bitte bringen Sie die Flaschen zurück.', '请把瓶子拿去退掉。'),
      line('Krause', 'Das Pfand: 5 Euro.', '押金：5 欧。', 'Das Pfand: fünf Euro.'),
    ],
    newWords: [
      { de: 'an alle', zh: '致所有人', forms: ['an', 'alle'] },
      { de: 'das Lager', zh: '仓库', forms: ['lager'] },
      { de: 'die Flaschen', zh: '瓶子（Flasche 的复数）', forms: ['flaschen'] },
      { de: 'in Ordnung', zh: '可以、合规', forms: ['ordnung'] },
      { de: 'bringen', zh: '拿、带', forms: ['bringen'] },
    ],
    question: choice('q', '这些瓶子能退多少钱？', ['5 欧', '20 欧', '25 分']),
  },
};

export const STORY_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5, LESSON_6, LESSON_7];

// 单元总表：每个单元结束时出一次，把本单元零散学到的语法收成整张表，和小测放在一起
// 复习词卡背面的搭配和例句（2026-11-15 作者定：课文是根，这里是生枝长叶的地方——换地方、换人称、换成问句，让人能举一反三；和课文原句一样的不放）。
// 允许带少量课外常用词，整句都有中文。键是 课号 → 词条。
const WORD_MORE = {
  'sl-01': {
    'neu': { col: [['neu hier', '新来的'], ['ganz neu', '全新的']], ex: [['Bist du auch neu hier?', '你也是新来的吗？'], ['Das Zimmer ist neu.', '房间是新的。'], ['Was ist neu?', '有什么新鲜事？']] },
    'hier': { col: [['Hier, bitte.', '给，请拿好。'], ['hier und da', '这儿那儿、到处']], ex: [['Ich bin hier!', '我在这儿！'], ['Ist Lena hier?', 'Lena 在这儿吗？']] },
    'Wie bitte?': { col: [], ex: [['Wie bitte? Noch einmal, bitte.', '什么？请再说一遍。'], ['Entschuldigung, wie bitte?', '不好意思，您说什么？']] },
    'willkommen': { col: [['Herzlich willkommen!', '热烈欢迎！'], ['Willkommen in Deutschland!', '欢迎来到德国！']], ex: [['Willkommen in der WG!', '欢迎来到合租公寓！'], ['Willkommen, Lin!', '欢迎你，Lin！']] },
    'der Kaffee': { col: [['einen Kaffee trinken', '喝杯咖啡'], ['Kaffee mit Milch', '加奶的咖啡']], ex: [['Ich trinke Kaffee.', '我喝咖啡。'], ['Kaffee oder Tee?', '咖啡还是茶？'], ['Der Kaffee ist gut.', '这咖啡不错。']] },
    'der Bus': { col: [['mit dem Bus', '坐公交车'], ['im Bus', '在公交车上']], ex: [['Der Bus kommt!', '公交车来了！'], ['Wo ist der Bus?', '公交车在哪儿？'], ['Ich bin im Bus.', '我在公交车上。']] },
    'Tschüss!': { col: [['Tschüss, bis später!', '拜，回头见！'], ['Tschüss, bis morgen!', '拜，明天见！']], ex: [['Tschüss, Tom! Bis morgen!', '拜，Tom！明天见！']] },
    'immer': { col: [['immer so', '总是这样'], ['wie immer', '和往常一样']], ex: [['Tom ist immer in der Küche.', 'Tom 总在厨房里。'], ['Kaffee? – Wie immer!', '咖啡？——老样子！']] },
  },
  'sl-02': {
    'woher': { col: [['Woher kommen Sie?', '您从哪里来？']], ex: [['Woher kommt Lena?', 'Lena 是哪里人？'], ['Woher ist das?', '这是哪儿来的？']] },
    'kommen': { col: [['aus China kommen', '来自中国'], ['aus Deutschland kommen', '来自德国']], ex: [['Ich komme aus China.', '我来自中国。'], ['Kommst du aus Deutschland?', '你来自德国吗？'], ['Kommst du? – Ja, ich komme!', '你来吗？——来，我这就来！']] },
    'aus': { col: [['aus China', '来自中国'], ['aus Deutschland', '来自德国'], ['aus Berlin', '来自柏林']], ex: [['Ich bin aus Singapur.', '我是新加坡人。'], ['Lena ist aus Leipzig.', 'Lena 是莱比锡人。']] },
    'aber': { col: [], ex: [['Ich bin neu hier, aber Tom nicht.', '我是新来的，但 Tom 不是。'], ['Ja, aber nicht jetzt.', '好，但不是现在。']] },
    'wohnen': { col: [['in Berlin wohnen', '住在柏林'], ['in Deutschland wohnen', '住在德国'], ['in der WG wohnen', '住在合租公寓']], ex: [['Ich wohne in Berlin.', '我住在柏林。'], ['Wo wohnst du?', '你住哪儿？'], ['Wohnst du auch in der WG?', '你也住合租公寓吗？']] },
    'wo': { col: [['Wo wohnst du?', '你住哪儿？'], ['Wo bist du?', '你在哪儿？']], ex: [['Wo ist der Bus?', '公交车在哪儿？'], ['Wo ist mein Zimmer?', '我的房间在哪儿？'], ['Wo ist das?', '那在哪儿？']] },
    'auch': { col: [['Ich auch!', '我也是！'], ['Ich auch nicht.', '我也不。']], ex: [['Ich komme auch aus Singapur.', '我也来自新加坡。'], ['Kommst du auch?', '你也来吗？']] },
    'richtig': { col: [['Das ist richtig.', '这是对的。'], ['nicht richtig', '不对']], ex: [['Ist das richtig?', '这样对吗？'], ['Ja, richtig!', '对，没错！']] },
  },
  'sl-03': {
    'was': { col: [['Was ist das?', '这是什么？'], ['Was machst du?', '你在做什么？']], ex: [['Was kochst du?', '你在做什么菜？'], ['Was lernst du?', '你在学什么？']] },
    'studieren': { col: [['Medizin studieren', '学医'], ['in Berlin studieren', '在柏林上大学']], ex: [['Ich studiere in Deutschland.', '我在德国上大学。'], ['Studierst du auch?', '你也是大学生吗？'], ['Was studiert Tom?', 'Tom 学什么专业？']] },
    'lernen': { col: [['Deutsch lernen', '学德语'], ['viel lernen', '学得很多']], ex: [['Ich lerne Deutsch.', '我在学德语。'], ['Lernst du auch Deutsch?', '你也在学德语吗？'], ['Wir lernen zusammen.', '我们一起学。']] },
    'schon': { col: [['schon lange', '已经很久了'], ['Schon gut!', '好了好了，没事。']], ex: [['Tom ist schon hier.', 'Tom 已经到了。'], ['Ich wohne schon zwei Jahre hier.', '我在这儿住了两年了。']] },
    'sechs': { col: [['Zimmer sechs', '六号房间'], ['um sechs', '六点钟']], ex: [['Ich wohne in Zimmer sechs.', '我住六号房间。'], ['Der Bus kommt um sechs.', '公交车六点来。']] },
    'das Jahr': { col: [['ein Jahr', '一年'], ['zwei Jahre', '两年'], ['dieses Jahr', '今年']], ex: [['Ich bin ein Jahr hier.', '我在这儿待一年。'], ['Lena wohnt schon drei Jahre hier.', 'Lena 在这儿住了三年了。']] },
    'kochen': { col: [['zusammen kochen', '一起做饭'], ['Kaffee kochen', '煮咖啡']], ex: [['Ich koche, du spülst.', '我做饭，你洗碗。'], ['Was kochst du heute?', '你今天做什么菜？'], ['Wir kochen zusammen.', '我们一起做饭。']] },
    'gut': { col: [['sehr gut', '很好'], ['Alles gut?', '一切都好吗？']], ex: [['Das ist gut.', '这很好。'], ['Der Kaffee ist sehr gut.', '咖啡很好喝。'], ['Ja, alles gut.', '嗯，都好。']] },
  },
  'sl-04': {
    'Herr': { col: [['Herr und Frau Krause', 'Krause 先生和太太']], ex: [['Wo ist Herr Krause?', 'Krause 先生在哪儿？'], ['Entschuldigung, Herr Krause!', '打扰一下，Krause 先生！']] },
    'Guten Tag!': { col: [['Guten Morgen!', '早上好！'], ['Guten Abend!', '晚上好！']], ex: [['Guten Tag, Frau Vogel!', '您好，Vogel 女士！'], ['Guten Tag. Mein Name ist Lin.', '您好，我叫 Lin。']] },
    'der Name': { col: [['Wie ist Ihr Name?', '您贵姓？'], ['Wie ist dein Name?', '你叫什么名字？']], ex: [['Mein Name ist Lin.', '我叫 Lin。'], ['Der Name ist richtig.', '名字是对的。']] },
    'das Zimmer': { col: [['mein Zimmer', '我的房间'], ['ein Zimmer in der WG', '合租公寓里的一个房间']], ex: [['Das ist mein Zimmer.', '这是我的房间。'], ['Wo ist Zimmer vier?', '四号房间在哪儿？'], ['Ist das dein Zimmer?', '这是你的房间吗？']] },
    'der Schlüssel': { col: [['mein Schlüssel', '我的钥匙']], ex: [['Wo ist mein Schlüssel?', '我的钥匙在哪儿？'], ['Das ist nicht mein Schlüssel.', '这不是我的钥匙。'], ['Ist das Ihr Schlüssel?', '这是您的钥匙吗？']] },
    'nicht': { col: [['nicht gut', '不好'], ['nicht hier', '不在这儿'], ['noch nicht', '还没有']], ex: [['Ich bin nicht neu hier.', '我不是新来的。'], ['Das ist nicht richtig.', '这不对。'], ['Ich wohne nicht hier.', '我不住这儿。']] },
    'da': { col: [['Ich bin gleich da.', '我马上到。'], ['Wer ist da?', '谁在那儿？']], ex: [['Ist Lena da?', 'Lena 在吗？'], ['Ich bin da!', '我在！']] },
    'Auf Wiedersehen!': { col: [['Vielen Dank und auf Wiedersehen!', '多谢，再见！']], ex: [['Auf Wiedersehen, Frau Vogel!', '再见，Vogel 女士！'], ['Danke schön. Auf Wiedersehen!', '非常感谢，再见！']] },
  },
  'sl-05': {
    'kosten': { col: [['Was kostet das?', '这个多少钱？'], ['Das kostet viel.', '这个很贵。']], ex: [['Was kostet der Kaffee?', '咖啡多少钱？'], ['Was kostet das Zimmer?', '房间多少钱？']] },
    'das Brot': { col: [['Brot und Butter', '面包和黄油'], ['das Brot hier', '这里的面包']], ex: [['Das Brot ist sehr gut.', '这面包很好。'], ['Wo ist das Brot?', '面包在哪？']] },
    'die Brezel': { col: [['Brezel und Kaffee', '碱水结配咖啡'], ['die Brezel hier', '这个碱水结']], ex: [['Was kostet die Brezel?', '碱水结多少钱？'], ['Die Brezel ist sehr gut.', '这个碱水结很好。']] },
    'der Kuchen': { col: [['Kaffee und Kuchen', '咖啡配蛋糕（德国人的下午茶）'], ['der Kuchen von Tom', 'Tom 做的蛋糕']], ex: [['Wo ist der Kuchen?', '蛋糕在哪？'], ['Tom, der Kuchen ist sehr gut!', 'Tom，蛋糕很好吃！']] },
    'die Tüte': { col: [['Tüte? Ja, bitte.', '要袋子吗？——要。'], ['die Tüte hier', '这个袋子']], ex: [['Die Tüte kostet zwanzig Cent.', '袋子二十分。'], ['Wo ist die Tüte?', '袋子在哪？']] },
    'der Euro': { col: [['zwei Euro fünfzig', '2.50 欧'], ['zehn Euro', '十欧（Euro 不加复数词尾）']], ex: [['Das Brot kostet drei Euro.', '面包三欧。'], ['Das macht zwanzig Euro.', '一共二十欧。']] },
    'der Cent': { col: [['fünfzig Cent', '五十分'], ['zwei Euro und zehn Cent', '两欧零十分']], ex: [['Das kostet nur fünfzig Cent.', '这个只要五十分。'], ['Die Tüte kostet zehn Cent.', '袋子十分。']] },
    'heute': { col: [['heute Morgen', '今天早上'], ['bis heute', '到今天为止']], ex: [['Heute ist Lena nicht da.', '今天 Lena 不在。'], ['Ich koche heute.', '今天我做饭。']] },
    'sehr': { col: [['sehr gut', '很好'], ['Danke sehr!', '非常感谢！']], ex: [['Tom kocht sehr gut.', 'Tom 做饭很好。'], ['Das Zimmer ist sehr sauber.', '房间很干净。']] },
    'Das macht …': { col: [['Das macht zusammen zehn Euro.', '一共十欧。'], ['Was macht das?', '一共多少钱？']], ex: [['Das macht zwei Euro fünfzig.', '一共两欧五十。'], ['Das macht zwölf Euro, bitte.', '一共十二欧。']] },
  },
  'sl-06': {
    'möchten': { col: [['Ich möchte zahlen.', '我想结账。'], ['Was möchtest du?', '你想要什么？']], ex: [['Ich möchte ein Brötchen.', '我要一个小面包。'], ['Möchtest du eine Cola?', '你要可乐吗？']] },
    'zahlen': { col: [['Zahlen, bitte!', '买单！'], ['zusammen zahlen', '一起付']], ex: [['Ich zahle heute.', '今天我付。'], ['Tom zahlt nie.', 'Tom 从来不付钱。']] },
    'die Tasse': { col: [['eine Tasse Tee', '一杯茶'], ['die Tasse hier', '这个杯子']], ex: [['Ich möchte eine Tasse Tee.', '我要一杯茶。'], ['Die Tasse ist nicht sauber.', '杯子不干净。']] },
    'das Stück': { col: [['ein Stück Brot', '一块面包'], ['zwei Stück Kuchen', '两块蛋糕（Stück 作量词不变复数）']], ex: [['Ich möchte ein Stück Brot.', '我要一块面包。'], ['Ein Stück Kuchen kostet drei Euro.', '一块蛋糕三欧。']] },
    'das Wasser': { col: [['ein Glas Wasser', '一杯水'], ['stilles Wasser', '不带气的水']], ex: [['Das Wasser kostet zwei Euro.', '水两欧。'], ['Möchtest du Wasser oder Cola?', '你要水还是可乐？']] },
    'zusammen': { col: [['Zusammen, bitte.', '一起付。'], ['Hallo zusammen!', '大家好！']], ex: [['Wir zahlen zusammen.', '我们一起付。'], ['Wir kochen heute zusammen.', '我们今天一起做饭。']] },
    'getrennt': { col: [['Getrennt, bitte.', '分开付。'], ['getrennt zahlen', '分开付']], ex: [['Wir zahlen getrennt.', '我们各付各的。'], ['Zusammen? Nein, getrennt.', '一起吗？不，分开。']] },
    'oder': { col: [['Kaffee oder Tee?', '咖啡还是茶？'], ['Ja oder nein?', '是还是不是？']], ex: [['Kommst du aus China oder aus Japan?', '你来自中国还是日本？'], ['Möchtest du Brot oder Kuchen?', '你要面包还是蛋糕？']] },
    'wirklich': { col: [['Wirklich?', '真的吗？'], ['wirklich gut', '真的很好']], ex: [['Der Kuchen ist wirklich gut.', '蛋糕真的很好吃。'], ['Kommst du wirklich aus Köln?', '你真的是科隆人？']] },
    'der Geldbeutel': { col: [['mein Geldbeutel', '我的钱包'], ['der Geldbeutel von Tom', 'Tom 的钱包']], ex: [['Wo ist mein Geldbeutel?', '我的钱包在哪？'], ['Der Geldbeutel ist neu.', '这钱包是新的。']] },
  },
  'sl-07': {
    'das Pfand': { col: [['mit Pfand', '带押金'], ['ohne Pfand', '不带押金']], ex: [['Ist das mit Pfand?', '这个带押金吗？'], ['Das Pfand kostet fünfundzwanzig Cent.', '押金二十五分。']] },
    'die Flasche': { col: [['eine Flasche Wasser', '一瓶水'], ['eine Flasche Cola', '一瓶可乐']], ex: [['Ich möchte eine Flasche Wasser.', '我要一瓶水。'], ['Die Flasche ist nicht da.', '瓶子不在这。']] },
    'der Fehler': { col: [['ein Fehler', '一个错误'], ['mein Fehler', '我的错']], ex: [['Das ist mein Fehler.', '是我的错。'], ['Ist hier ein Fehler?', '这里有错吗？']] },
    'das Geld': { col: [['viel Geld', '很多钱'], ['kein Geld', '没钱']], ex: [['Das kostet viel Geld.', '这要花很多钱。'], ['Tom, wo ist das Geld?', 'Tom，钱呢？']] },
    'das Problem': { col: [['ein Problem', '一个问题'], ['Was ist das Problem?', '问题出在哪？']], ex: [['Das ist kein Problem.', '这不是问题。'], ['Ist das ein Problem?', '这有问题吗？']] },
    'verstehen': { col: [['Ich verstehe.', '我明白了。'], ['Ich verstehe nicht.', '我不明白。']], ex: [['Verstehst du das?', '你明白吗？'], ['Tom versteht Lena nicht.', 'Tom 不懂 Lena。']] },
    'zurück': { col: [['Geld zurück', '退钱'], ['Ich bin zurück!', '我回来了！']], ex: [['Lena ist zurück.', 'Lena 回来了。'], ['Zwei Euro zurück.', '找您两欧。']] },
    'der Automat': { col: [['der Pfandautomat', '退瓶机'], ['der Kaffeeautomat', '咖啡机']], ex: [['Wo ist der Automat?', '机器在哪？'], ['Der Automat ist kaputt.', '机器坏了。']] },
    'stehen': { col: [['Was steht hier?', '这上面写的什么？'], ['Hier steht mein Name.', '这上面写着我的名字。']], ex: [['Hier steht: Zimmer drei.', '这上面写着：三号房间。'], ['Was steht da?', '那上面写的什么？']] },
  },
};
STORY_LESSONS.forEach(l => (l.words || []).forEach(w => { const m = WORD_MORE[l.id]?.[w.de]; if (m) w.more = m; }));

// 30 课语法进度（docs/course-authoring.md 的进度表）：手帐页的语法地图用。写好的课以语法卡标题为准，没写的用这里的名字。
export const STORY_SYLLABUS = [
  ['认识彼此', [[1, 'sein'], [2, '规则动词'], [3, 'er / sie'], [4, '尊称 Sie']]],
  ['数量与简单购买', [[5, '数字 13–100 · der / die / das'], [6, 'ein / eine · ich möchte'], [7, 'kein / nicht']]],
  ['家人与物品', [[8, 'mein / dein'], [9, 'haben + 第四格'], [10, '复数 · sein + 形容词']]],
  ['日常作息', [[11, '钟点 · 动词第二位'], [12, '可分动词'], [13, '换音动词']]],
  ['兴趣与邀约', [[14, 'gern / lieber'], [15, 'können / möchten']]],
  ['城市出行', [[16, 'mit + 第三格'], [17, '方向词 + 命令式']]],
  ['住所', [[18, 'es gibt + 第四格'], [19, 'in / auf / unter + 第三格']]],
  ['饮食与购物', [[20, '数量词 · wie viel'], [21, 'müssen / wollen'], [22, '第四格代词']]],
  ['身体与求助', [[23, 'mir / dir'], [24, 'sollen / dürfen']]],
  ['预约与留言', [[25, '日期与序数词'], [26, 'und / aber / denn']]],
  ['近期经历', [[27, 'war / hatte'], [28, '完成时 + haben'], [29, '完成时 + sein']]],
  ['日常综合交流', [[30, '']]],
];

export const STORY_UNIT_SUMMARIES = [
  {
    unit: 1, after: 'sl-04', title: '第 1 单元 · 认识彼此', titleDe: 'Präsens',
    canDo: ['自我介绍，纠正并拼出名字', '说来自哪、住在哪', '介绍别人学什么、做什么', '分清 du / Sie，应对正式提问', '数 0–12'],
    rule: '动词随主语变位。规则动词（kommen、wohnen）：词干 + 人称词尾；sein 不规则，整列记。',
    tables: [SEIN, REGULAR],
    // 先教再考：课文里没出现的 wir / ihr，先用一小段对话带出来、做几个小空，再看总表、做练习
    intro: {
      lines: [
        line('Lena', 'Hallo! Seid ihr da?', '喂！你们在吗？'),
        line('Tom', 'Ja, wir sind hier!', '在，我们在这儿！'),
        line('Lena', 'Was kocht ihr?', '你们在做什么菜？'),
        line('Lin', 'Wir kochen nicht. Wir lernen.', '我们没在做饭，我们在学习。'),
        line('Lena', 'Tom lernt? Wie bitte?!', 'Tom 在学习？什么？！'),
      ],
      card: { kind: 'grammar', title: 'wir · ihr', all: true, table: SEIN_KOCHEN,
        drill: [
          { line: 0, de: 'Seid ihr da?', v: 'Seid', no: 'Sind', sj: 'ihr', row: 4 },
          { line: 1, de: 'Ja, wir sind hier!', v: 'sind', no: 'seid', sj: 'wir', row: 3 },
          { line: 2, de: 'Was kocht ihr?', v: 'kocht', no: 'kochen', sj: 'ihr', row: 4, col: 2 },
          { line: 3, de: 'Wir kochen nicht.', zh: '我们没在做饭。', v: 'kochen', no: 'kocht', sj: 'Wir', row: 3, col: 2 },
        ] },
    },
    // 本单元课文里没出现、在总表里补齐的人称
    newRows: [
      { de: 'Wir wohnen hier.', zh: '我们住这儿。' },
      { de: 'Wohnt ihr auch hier?', zh: '你们也住这儿吗？' },
      { de: 'Tom und Lena kommen aus Deutschland.', zh: 'Tom 和 Lena 来自德国。' },
    ],
    exercises: [
      match('z1', [['ich', 'bin'], ['du', 'bist'], ['er / sie', 'ist'], ['ihr', 'seid'], ['wir', 'sind']]),
      choice('z2', 'Wir ___ neu hier.', ['sind', 'seid', 'bin']),
      choice('z3', '___ ihr auch hier?', ['Wohnt', 'Wohnen', 'Wohnst']),
      choice('z4', 'Tom und Lena ___ hier.', ['wohnen', 'wohnt', 'wohne']),
      choice('z5', 'Woher ___ Sie, Herr Krause?', ['kommen', 'kommst', 'kommt']),
      assemble('z6', '我们住这儿。', 'Wir wohnen hier.', ['wohnt', 'ich']),
    ],
    // 小测（用户 2026-11-11 审过）：一段没见过的听力 + 开口回应。每题的 can 指向它检验的那条 canDo（下标）。
    quiz: {
      listen: {
        lines: [
          line('Krause', 'Guten Tag, Herr Becker!', '您好，Becker 先生！'),
          line('Tom', 'Oh … Guten Tag, Herr Krause.', '哦……您好，Krause 先生。'),
          line('Krause', 'Wohnen Sie in Zimmer vier?', '您住四号房间吗？'),
          line('Tom', 'Nein, in Zimmer zwei. Lena wohnt in Zimmer vier.', '不，二号房间。Lena 住四号房间。'),
          line('Krause', 'Ach so. Und was studieren Sie?', '原来如此。您学什么？'),
          line('Tom', 'Philosophie.', '哲学。'),
          line('Krause', 'Schon sechs Jahre, richtig?', '已经六年了，对吧？'),
          line('Tom', 'Äh … ja. Aber ich koche gut!', '呃……对。但是我做饭好！'),
          line('Krause', 'So, so. Auf Wiedersehen.', '是嘛。再见。'),
        ],
      },
      questions: [
        { ...choice('q1', 'Tom 住几号房间？', ['2 号', '4 号', '6 号']), type: 'heardChoice', can: 4 },
        { ...choice('q2', 'Lena 住几号房间？', ['4 号', '2 号', '6 号']), type: 'heardChoice', can: 4 },
        { ...choice('q3', 'Herr Krause 问 Tom 什么？', ['学什么专业', '从哪里来', '是不是新来的']), type: 'heardChoice', can: 3 },
      ],
      speak: [
        { ...reply('k1', '向他问好，并说出你的名字。', ['Guten Tag. Ja, ich bin Lin.', 'Guten Tag! Ich bin Lin.', 'Guten Tag. Ich bin Lin.', 'Ja. Ich bin Lin.'], ['Krause', 'Guten Tag. Sind Sie neu hier?']), can: 0 },
        { ...reply('k2', '纠正他，再把名字拼一遍。', ['Nein, Lin. L – I – N.'], ['Krause', 'Wie bitte? Tim?']), can: 0 },
        { ...reply('k3', '回答她。', ['Ich komme aus Singapur.', 'Aus Singapur.'], ['Lena', 'Woher kommst du?']), can: 1 },
        { ...reply('k4', '回答她。', ['Er studiert Philosophie.', 'Philosophie.', 'Tom studiert Philosophie.'], ['Lena', 'Was studiert Tom?']), can: 2 },
        { ...reply('k5', '问 Herr Krause：您也住这儿吗？', ['Wohnen Sie auch hier?']), can: 3 },
        { ...listen('k6', 'Lena', 'Zimmer vier, Zimmer neun, Zimmer zwölf.', '听到的是哪三个房间号？', ['4 · 9 · 12', '4 · 5 · 12', '5 · 9 · 2']), can: 4 },
      ],
    },
  },
];

export const findStoryLesson = id => STORY_LESSONS.find(l => l.id === id) || null;

// 配音清单：每条 { voice, text, kind, lesson }。text 是要念的字（有 say 用 say）。tools/voice-script.mjs 用它生成清单。
export function storyAudioItems() {
  const seen = new Set(), out = [];
  const add = (voice, text, kind, lesson) => {
    if (!text) return;
    const key = `${voice}|${text}`;
    if (!seen.has(key)) { seen.add(key); out.push({ voice, text, kind, lesson }); }
  };
  const fromExercise = (x, id) => {
    if (x.type === 'listenChoice' || x.type === 'spell') add(x.voice, x.say || x.audioText, 'exercise', id);
    if (x.type === 'assemble') add(WORD_VOICE, x.answer, 'exercise', id);
    if (x.type === 'response') { if (x.cue) add(x.cue.who, x.cue.de, 'cue', id); add('Lin', x.model.replace(/L – I – N/, 'Ell, Ih, Enn'), 'model', id); }
  };
  for (const [who, c] of Object.entries(STORY_CAST)) add(who, c.hi, 'intro', 'cast');
  for (const l of STORY_LESSONS) {
    (l.lines || []).forEach(s => add(s.who, s.say || s.de, 'line', l.id));
    (l.preview || []).forEach(p => add(WORD_VOICE, p.de.replace('…', '').trim(), 'word', l.id));
    (l.words || []).forEach(w => add(WORD_VOICE, w.de, 'word', l.id));
    (l.words || []).forEach(w => [...(w.more?.col || []), ...(w.more?.ex || [])].forEach(([de]) => add(WORD_VOICE, de.replace('…', '').trim(), 'word', l.id)));
    (l.phrases || []).forEach(p => add(WORD_VOICE, p.de.replace('…', '').trim(), 'word', l.id));
    (l.cards || []).forEach(c => { if (c.drill) { c.table.rows.forEach(r => r.slice(1).forEach((_, k) => add(WORD_VOICE, rowSay(r, k + 1), 'card', l.id))); c.drill.forEach(d => add(WORD_VOICE, drillSay(d), 'card', l.id)); } (c.on || []).forEach(i => add(WORD_VOICE, rowSay(c.table.rows[i]), 'card', l.id)); add(WORD_VOICE, c.example, 'card', l.id); (c.pairs || []).forEach(t => add(WORD_VOICE, t, 'card', l.id)); (c.contrast || []).flat().forEach(t => add(WORD_VOICE, t, 'card', l.id)); });
    if (l.wordPack) { l.wordPack.items.forEach(i => add(WORD_VOICE, i.de, 'pack', l.id)); l.wordPack.exercises.forEach(x => fromExercise(x, l.id)); }
    [...(l.exercises || []), ...(l.speak || []), ...(l.reviews || [])].forEach(x => fromExercise(x, l.id));
    if (l.reading) { l.reading.lines.forEach(s => add(s.who, s.say || s.de, 'reading', l.id)); l.reading.newWords.forEach(w => add(WORD_VOICE, w.de, 'word', l.id)); }
    for (const s of l.stops || []) {
      (s.letters || []).forEach(x => add(WORD_VOICE, x.say, 'letter', l.id));
      (s.rows || []).forEach(r => add(WORD_VOICE, plainWord(r.w), 'word', l.id));
      [...(s.tries || []), ...(s.exercises || []).filter(x => x.type === 'try')].forEach(t => add(t.voice || WORD_VOICE, t.say || plainWord(t.w), 'word', l.id));
      (s.blind || []).forEach(b => add(WORD_VOICE, b.say || b.de, 'word', l.id));
      (s.exercises || []).forEach(x => fromExercise(x, l.id));
    }
  }
  for (const u of STORY_UNIT_SUMMARIES) {
    u.newRows.forEach(r => add(WORD_VOICE, r.de, 'card', `unit-${u.unit}`));
    if (u.intro) {
      u.intro.lines.forEach(x => add(x.who, x.say || x.de, 'line', `unit-${u.unit}`));
      u.intro.card.table.rows.forEach(r => r.slice(1).forEach((_, c) => add(WORD_VOICE, rowSay(r, c + 1), 'card', `unit-${u.unit}`)));
      u.intro.card.drill.forEach(d => add(WORD_VOICE, drillSay(d), 'card', `unit-${u.unit}`));
    }
    u.tables.forEach(t => t.rows.forEach(r => r.slice(1).forEach((_, c) => add(WORD_VOICE, rowSay(r, c + 1), 'card', `unit-${u.unit}`))));
    u.exercises.forEach(x => fromExercise(x, `unit-${u.unit}`));
    if (u.quiz) {
      u.quiz.listen.lines.forEach(s => add(s.who, s.say || s.de, 'line', `unit-${u.unit}`));
      [...u.quiz.questions, ...u.quiz.speak].forEach(x => fromExercise(x, `unit-${u.unit}`));
    }
  }
  return out;
}
