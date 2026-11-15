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
};
export const WORD_VOICE = 'Lena';
// 人名地名：不算生词，也不要求出现在词库里
export const STORY_NAMES = ['lin', 'lena', 'tom', 'tim', 'mia', 'krause', 'becker', 'vogel', 'köln', 'leipzig', 'singapur', 'china', 'japan', 'korea'];

const SEIN = { head: ['', 'sein'], rows: [['ich', 'bin'], ['du', 'bist'], ['er / sie', 'ist'], ['wir', 'sind'], ['ihr', 'seid'], ['sie / Sie', 'sind']] };
/** 变位表里一格怎么念：'er / sie' + 'kommt' → “er kommt”。页面和配音清单共用。 */
export const rowSay = (row, col = 1) => `${row[0].split(' / ')[0]} ${row[col]}`;
const PERS = ['ich', 'du', 'er / sie', 'wir', 'ihr', 'sie / Sie'];
/** 规则动词现在时的变位表：词干 + -e -st -t -en -t -en。 */
const reg = (...inf) => ({ head: ['', ...inf], rows: PERS.map((p, i) => [p, ...inf.map(v => v.slice(0, -2) + ['e', 'st', 't', 'en', 't', 'en'][i])]) });
const REGULAR = reg('kommen', 'wohnen');
const STUDIEREN = reg('studieren', 'kochen');
const SEIN_WOHNEN = { head: ['', 'sein', 'wohnen'], rows: PERS.map((p, i) => [p, SEIN.rows[i][1], REGULAR.rows[i][2]]) };
/** 语法卡小题（drill）里那一组怎么写、怎么念：'Bist' + 'du' → “du bist”；尊称保留大写 “Sie sind”。 */
export const drillSay = d => `${d.sj === 'Sie' && d.row === 5 ? 'Sie' : d.sj.toLowerCase()} ${d.v.toLowerCase()}`;

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
    { after: 11, kind: 'tip', title: 'Woher? · Wo?', body: 'Woher 问来源（从哪里来），Wo 问位置（在哪里）。' },
    { after: 12, kind: 'grammar', title: '规则动词：ich -e · du -st', body: '规则动词的现在时 = 词干 + 人称词尾：ich → -e，du → -st。', table: REGULAR, on: [0, 1], example: 'Woher kommst du? – Ich komme aus Singapur.',
      drill: [
        { line: 7, de: 'Ich komme aus Singapur.', zh: '我来自新加坡。', v: 'komme', no: 'kommst', sj: 'Ich', row: 0, col: 1 },
        { line: 9, de: 'Woher kommst du?', zh: '你是哪里人？', v: 'kommst', no: 'komme', sj: 'du', row: 1, col: 1 },
        { line: 12, de: 'Du wohnst auch hier!', zh: '你也住这儿！', v: 'wohnst', no: 'wohne', sj: 'Du', row: 1, col: 2 },
      ] },
    { after: 0, kind: 'pron', title: 'w：上牙碰下唇', body: '上牙轻碰下唇，喉咙振动。嘴唇不要收圆。', pairs: ['wo', 'woher', 'wohnen', 'Wie bitte?'], example: 'Wo wohne ich?', pics: ['m-wv'] },
    { after: 2, kind: 'tip', title: 'China', body: '德语的 China 开头读 ich 里的 ch；南德也有人读成 k。' },
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
    { after: 7, kind: 'tip', title: '一般疑问句', body: '没有疑问词的问句，动词放在句首：Sind Sie neu hier? Ist Herr Becker auch da?' },
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

export const STORY_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3, LESSON_4];

// 单元总表：每个单元结束时出一次，把本单元零散学到的语法收成整张表，和小测放在一起
export const STORY_UNIT_SUMMARIES = [
  {
    unit: 1, after: 'sl-04', title: '第 1 单元 · 认识彼此', titleDe: 'Präsens',
    canDo: ['自我介绍，纠正并拼出名字', '说来自哪、住在哪', '介绍别人学什么、做什么', '分清 du / Sie，应对正式提问', '数 0–12'],
    rule: '动词随主语变位。规则动词（kommen、wohnen）：词干 + 人称词尾；sein 不规则，整列记。',
    tables: [SEIN, REGULAR],
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
    u.tables.forEach(t => t.rows.forEach(r => r.slice(1).forEach((_, c) => add(WORD_VOICE, rowSay(r, c + 1), 'card', `unit-${u.unit}`))));
    u.exercises.forEach(x => fromExercise(x, `unit-${u.unit}`));
    if (u.quiz) {
      u.quiz.listen.lines.forEach(s => add(s.who, s.say || s.de, 'line', `unit-${u.unit}`));
      [...u.quiz.questions, ...u.quiz.speak].forEach(x => fromExercise(x, `unit-${u.unit}`));
    }
  }
  return out;
}
