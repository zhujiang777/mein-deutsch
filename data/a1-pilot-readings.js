// A1 教材驱动试点：6 篇原创精读。
const ORIGINAL_READING = {
  kind: 'original',
  source: 'original',
  license: 'proprietary',
  statement: '仅采用页码可定位的抽象文体与任务约束；正文、题目、选项、人物和信息顺序均从空白页原创。',
};

const refs = (evidenceIds, appliedConstraints) => ({
  evidenceIds,
  appliedConstraints,
  originalityStatement: '正文从空白页原创，未复制或逐句改写教材课文、题干、选项、人物、情节或信息顺序。',
});

export const A1_PILOT_READINGS = [
  {
    id: 'rp-a1-01',
    pilot: true,
    title: 'Anmeldung in der Fotogruppe',
    titleZh: '摄影小组登记',
    level: 'A1',
    mode: 'intensiv',
    skillStage: 'R1',
    genre: 'form-and-profile',
    topic: 'photography-club-profile',
    register: 'neutral-written',
    grammarPrereqs: ['sein', 'haben', 'regular-verbs', 'w-questions'],
    recommendedAfter: 'u2l3',
    targetLemmas: ['Name', 'Land', 'Wohnort', 'sprechen', 'lernen', 'Arbeit', 'Gruppe'],
    newLemmas: ['Geburtsort', 'Muttersprache', 'Lernziel'],
    properNouns: ['Ines', 'Pereira', 'Porto', 'Mainz', 'Portugiesisch', 'Nord', 'Fotogruppe'],
    knownWordTarget: 0.92,
    vocabRefs: ['w018', 'w020', 'w021', 'w112'],
    designReferences: refs(
      ['repo-s1-u2l3', 'passwort-a1-progression', 'hueber-r-a-persons', 'dib-ch1-interviews', 'vhs-a1-boundary'],
      ['先扫描表格字段，再用简介验证和重组信息', '概括任务要求脱离字段顺序介绍人物']
    ),
    provenance: ORIGINAL_READING,
    skills: ['read-scan', 'read-profile'],
    intro: '先只看字段，预测哪些信息会出现在简介里；再把零散信息重组成一段人物介绍。',
    readingRoute: {
      prediction: '登记表通常会问哪些个人信息？',
      focus: '区分字段标签、填写值和后面的完整句。',
      summaryPrompt: '不照抄字段顺序，用两句德语介绍 Ines。'
    },
    sentences: [
      { de: 'Fotogruppe Nord – Anmeldung', zh: '北区摄影小组——登记', note: '表格标题：先看它，就知道整张表在问什么' },
      { de: 'Name: Ines Pereira', zh: '姓名：伊内斯·佩雷拉', note: '「字段名 + 冒号 + 填写值」是表格最常见的形式' },
      { de: 'Geburtsort: Porto; Wohnort: Mainz', zh: '出生地：波尔图；居住地：美因茨', note: 'Geburtsort ≠ Wohnort：一个是从哪来，一个是现在住哪——考试常在这里设陷阱' },
      { de: 'Muttersprache: Portugiesisch; Deutsch: ein bisschen', zh: '母语：葡萄牙语；德语：一点点', note: 'ein bisschen 一点点，用来说水平还不高' },
      { de: 'Ines arbeitet in Mainz und macht gern Fotos.', zh: '伊内斯在美因茨工作，喜欢拍照。', note: 'gern 放在动词后面：macht gern = 喜欢做' },
      { de: 'Ihr Lernziel ist klar: Sie spricht in der Gruppe Deutsch.', zh: '她的学习目标很明确：在小组里说德语。', note: 'ihr 这里是「她的」（物主代词），不是「你们」' },
      { de: 'Sie ist neu in der Gruppe und lernt am Abend Deutsch.', zh: '她刚加入小组，晚上学德语。', note: 'am Abend 在晚上；am + 时间段是固定搭配' }
    ],
    speakPractice: [4, 5],
    glossary: {
      geburtsort: { base: 'der Geburtsort, -e', zh: '出生地' },
      muttersprache: { base: 'die Muttersprache, -n', zh: '母语' },
      lernziel: { base: 'das Lernziel, -e', zh: '学习目标' }
    },
    questions: [
      { type: 'choice', q: '哪两项需要组合后才能说明 Ines 从哪里来、现在住哪里？', options: ['姓名与语言', '出生地与居住地', '小组与爱好'], a: 1, explain: 'Geburtsort 是 Porto，Wohnort 是 Mainz。' },
      { type: 'choice', q: '她加入小组后想用德语做什么？', options: ['和组员交谈', '写摄影教材', '给游客上课'], a: 0, explain: 'Lernziel 那句写的是 in der Gruppe Deutsch sprechen。' }
    ]
  },
  {
    id: 'rp-a1-02',
    pilot: true,
    title: 'Kleine Helfer für den Schreibtisch',
    titleZh: '书桌上的小帮手',
    level: 'A1',
    mode: 'intensiv',
    skillStage: 'R2',
    genre: 'labels-and-mini-catalogue',
    topic: 'desk-accessories-catalogue',
    register: 'commercial-informational',
    grammarPrereqs: ['noun-gender', 'ein-eine', 'kein-nicht', 'plural'],
    recommendedAfter: 'u5l3',
    targetLemmas: ['Stift', 'Lampe', 'Buch', 'klein', 'kosten', 'brauchen', 'Notiz', 'Wort'],
    newLemmas: ['Klammer', 'Notizblock', 'Kabel'],
    properNouns: ['Lumo'],
    knownWordTarget: 0.92,
    vocabRefs: ['w183', 'w334'],
    designReferences: refs(
      ['repo-s2-u5l3', 'passwort-a1-progression', 'hueber-r-b-things', 'goethe-a1-reading', 'vhs-a1-boundary'],
      ['每个商品同时提供名称、复数或数量、价格与用途', '理解题需跨商品比较而非只翻译单句']
    ),
    provenance: ORIGINAL_READING,
    skills: ['read-labels', 'read-compare'],
    intro: '先扫商品名和价格，再把冠词、复数、用途对应起来。',
    readingRoute: {
      prediction: '迷你目录中哪些信息通常最醒目？',
      focus: '把商品、数量或复数、价格和用途放进四列。',
      summaryPrompt: '选一件商品，用价格和用途说明你为什么买它。'
    },
    sentences: [
      { de: 'Die Klammern: sechs Stück, 2 Euro.', zh: '夹子：6个，2欧元。', note: 'die Klammern 是复数（单数 die Klammer）；Stück 说数量时不变复数：sechs Stück' },
      { de: 'Sie sind gut für Papier und kleine Notizen.', zh: '它们适合夹纸张和小便条。', note: 'sie 指上一句的复数 die Klammern，不是「她」' },
      { de: 'Der Notizblock: 80 Seiten, 3 Euro 50.', zh: '便笺本：80页，3.50欧元。', note: 'der Notizblock 阳性；价格口语说成 3 Euro 50' },
      { de: 'Er ist gut für neue Wörter.', zh: '它很适合记新单词。', note: 'er 回指 der Notizblock——德语用冠词性别决定代词，不是「他」' },
      { de: 'Die Lampe Lumo: klein und leicht, 12 Euro.', zh: 'Lumo台灯：小巧轻便，12欧元。', note: 'die Lampe 阴性；Lumo 是牌子名，不影响冠词' },
      { de: 'Sie ist leicht und braucht kein Kabel.', zh: '它很轻，而且不需要电线。', note: 'kein 用来否定名词：das Kabel → kein Kabel（不是 nicht ein Kabel）' },
      { de: 'Das sind unsere Preise.', zh: '以上是我们的价格。', note: 'das sind + 复数；只有一件时要说 das ist' }
    ],
    speakPractice: [3, 5],
    glossary: {
      klammer: { base: 'die Klammer, -n', zh: '夹子' },
      notizblock: { base: 'der Notizblock, ¨-e', zh: '便笺本' },
      kabel: { base: 'das Kabel, -', zh: '电线；数据线' }
    },
    questions: [
      { type: 'choice', q: '哪件商品适合记录新词？', options: ['夹子', '便笺本', '台灯'], a: 1, explain: '便笺本那句写的是 gut für neue Wörter。' },
      { type: 'choice', q: '哪件商品最贵，而且用起来不需要纸？', options: ['夹子', '便笺本', '台灯'], a: 2, explain: '台灯12欧元最贵；夹子夹 Papier、便笺本有 Seiten，只有台灯与纸无关。' }
    ]
  },
  {
    id: 'rp-a1-03',
    pilot: true,
    title: 'Mittwoch im Lernzentrum',
    titleZh: '学习中心的星期三',
    level: 'A1',
    mode: 'intensiv',
    skillStage: 'R3',
    genre: 'schedule-with-message',
    topic: 'learning-workshop-change',
    register: 'public-and-informal',
    grammarPrereqs: ['time', 'separable-verbs', 'v2-word-order'],
    recommendedAfter: 'u8l4',
    targetLemmas: ['Mittwoch', 'Uhr', 'beginnen', 'Pause', 'Raum', 'treffen', 'Wort'],
    newLemmas: ['Lernzentrum', 'Strom', 'stattfinden'],
    properNouns: ['Ada', 'Noah'],
    knownWordTarget: 0.92,
    vocabRefs: ['w043', 'w177'],
    designReferences: refs(
      ['repo-s3-u8l4', 'passwort-a1-progression', 'hueber-r-c-daily', 'goethe-a1-reading', 'dib-ch2-time-housing'],
      ['正文包含原日程和之后发送的短消息', '读者必须用短消息原因修正日程中的地点']
    ),
    provenance: ORIGINAL_READING,
    skills: ['read-schedule', 'read-link-reason'],
    intro: '先读日程，再读后来收到的消息。最终安排必须把两份文本合起来判断。',
    readingRoute: {
      prediction: '短消息可能会改变日程表中的哪类信息？',
      focus: '先标原时间地点，再用消息中的原因和新地点修正。',
      summaryPrompt: '用 deshalb 概括下午活动为什么换教室。'
    },
    sentences: [
      { de: 'Lernzentrum am Mittwoch', zh: '学习中心星期三安排', note: '日程表标题：先定位「星期几」，再往下读时间' },
      { de: '09:00 Wörter lernen – Raum 2; 10:30 Pause.', zh: '9:00 在2号教室学单词；10:30 休息。', note: '09:00 读作 neun Uhr；日程表里常省略动词' },
      { de: '11:00 Gespräch mit Ada; 14:00 Film – Raum 5.', zh: '11:00 与阿达交谈；14:00 在5号教室看电影。', note: '分号把两项活动隔开；先记下「Film = Raum 5」，等下要改' },
      { de: 'Noah schreibt: Im Raum 5 gibt es heute keinen Strom.', zh: '诺亚写道：5号教室今天停电。', note: 'es gibt + 第四格 = 有；keinen Strom 是 der Strom 的第四格否定' },
      { de: 'Der Film findet deshalb in Raum 7 statt.', zh: '因此电影改在7号教室举行。', note: 'stattfinden 是可分动词，statt 被甩到句尾；deshalb 占第一位，所以 findet 排第二' },
      { de: 'Wir treffen uns um zehn vor zwei am Eingang.', zh: '我们13:50在入口集合。', note: 'zehn vor zwei = 差十分两点 = 13:50；vor 表示「差…分」' },
      { de: 'Der Tag endet um vier Uhr.', zh: '当天活动四点结束。', note: 'um + 时间点，表示「在几点」' }
    ],
    speakPractice: [4, 5],
    glossary: {
      lernzentrum: { base: 'das Lernzentrum, -zentren', zh: '学习中心' },
      strom: { base: 'der Strom', zh: '电；电力' },
      findet: { base: 'stattfinden', zh: '举行；举办（可分动词）' },
      statt: { base: 'stattfinden', zh: '举行；举办（可分动词的前缀）' }
    },
    questions: [
      { type: 'choice', q: '电影最终在哪里播放？', options: ['2号教室', '5号教室', '7号教室'], a: 2, explain: '短消息把电影从 Raum 5 改到了 Raum 7。' },
      { type: 'choice', q: '为什么需要换教室？', options: ['原教室没有电', 'Ada 没来', '咖啡休息延长'], a: 0, explain: '消息明确说 Raum 5 没有 Strom。' }
    ]
  },
  {
    id: 'rp-a1-04',
    pilot: true,
    title: 'Samstag im Kulturhof',
    titleZh: '文化庭院的星期六',
    level: 'A1',
    mode: 'intensiv',
    skillStage: 'R4',
    genre: 'leisure-programme',
    topic: 'community-leisure-options',
    register: 'public-informational',
    grammarPrereqs: ['modal-verbs', 'sentence-bracket'],
    recommendedAfter: 'u9l3',
    targetLemmas: ['Samstag', 'Musik', 'Film', 'essen', 'können', 'Uhr'],
    newLemmas: ['Töpfern', 'Eintritt', 'Teilnehmer'],
    properNouns: ['Kulturhof'],
    knownWordTarget: 0.92,
    vocabRefs: ['w114', 'w193', 'w212'],
    designReferences: refs(
      ['repo-s4-u9l3', 'passwort-a1-progression', 'hueber-r-f-programme', 'dib-ch4-leisure', 'goethe-a1-reading'],
      ['节目单至少提供时间、价格、报名和室内外条件', '答案需要同时满足两个以上条件']
    ),
    provenance: ORIGINAL_READING,
    skills: ['read-conditions', 'read-compare'],
    intro: '三项活动各有不同时间、价格和条件。不要逐句翻译，直接用条件筛选。',
    readingRoute: {
      prediction: '选择活动时，你会先看时间、价格还是地点？',
      focus: '为每项活动标出时间、费用、是否报名和室内外。',
      summaryPrompt: '为“下午有空、怕下雨、不想花钱”的朋友推荐一项活动并说明理由。'
    },
    sentences: [
      { de: '10:00 Töpfern im Garten; 8 Euro; nur mit Anmeldung.', zh: '10:00 在花园做陶艺；8欧元；仅限报名者。', note: '节目单三要素：时间 / 价格 / 条件，用分号隔开——三项活动逐列对齐着读' },
      { de: 'Bei Regen fällt der Kurs aus.', zh: '下雨时课程取消。', note: 'bei Regen 下雨时；ausfallen 可分动词，aus 甩到句尾 = 取消' },
      { de: '14:00 Musik im Haus; der Eintritt ist frei.', zh: '14:00 室内音乐活动；免费入场。', note: 'frei 这里是「免费」不是「自由」；der Eintritt ist frei 是固定说法' },
      { de: 'Alle Teilnehmer können zusammen Musik machen.', zh: '所有参加者都可以一起做音乐。', note: 'können + 动词原形，原形放句尾——这就是框型结构' },
      { de: '18:00 kurzer Film; 4 Euro; ohne Anmeldung.', zh: '18:00 短片放映；4欧元；无需报名。', note: 'ohne Anmeldung 正好和第一项的 nur mit Anmeldung 相反' },
      { de: 'Nach dem Film kann man im Garten zusammen essen.', zh: '电影后可以在花园里一起吃东西。', note: 'nach + 第三格：nach dem Film 电影之后' }
    ],
    speakPractice: [2, 5],
    glossary: {
      töpfern: { base: 'töpfern', zh: '做陶艺' },
      eintritt: { base: 'der Eintritt', zh: '入场；门票' },
      teilnehmer: { base: 'der Teilnehmer, -', zh: '参加者' }
    },
    questions: [
      { type: 'choice', q: '下午两点有空、没有报名、又不想付费的人应选什么？', options: ['陶艺', '音乐活动', '短片'], a: 1, explain: '音乐活动14点开始、免费，且未要求报名。' },
      { type: 'choice', q: '哪项活动会受天气直接影响？', options: ['陶艺', '音乐活动', '短片'], a: 0, explain: '陶艺在花园，下雨时不能举行。' }
    ]
  },
  {
    id: 'rp-a1-05',
    pilot: true,
    title: 'Zwei Zimmer am Stadtrand',
    titleZh: '城郊的两个房间',
    level: 'A1',
    mode: 'intensiv',
    skillStage: 'R5',
    genre: 'dual-housing-notices',
    topic: 'housing-option-comparison',
    register: 'commercial-informational',
    grammarPrereqs: ['accusative', 'dative', 'location-prepositions'],
    recommendedAfter: 'u11l4',
    targetLemmas: ['Zimmer', 'Küche', 'Bad', 'Bus', 'Bahnhof', 'Miete'],
    newLemmas: ['Dachgeschoss', 'Innenhof', 'möbliert'],
    properNouns: ['Ried', 'Lindenweg'],
    knownWordTarget: 0.92,
    vocabRefs: ['w151', 'w153'],
    designReferences: refs(
      ['repo-s5-u11l4', 'passwort-a1-progression', 'hueber-r-e-housing', 'dib-ch2-time-housing', 'goethe-a1-reading'],
      ['两则住房信息分别包含位置、设施、交通和价格', '比较题要求把居住偏好映射到不同房源']
    ),
    provenance: ORIGINAL_READING,
    skills: ['read-housing', 'read-compare'],
    intro: '两则房源信息各有优缺点。先做地点和设施表，再根据需求选择。',
    readingRoute: {
      prediction: '住房广告中哪些信息适合横向比较？',
      focus: '分别标出位置、家具、交通、安静程度和月租。',
      summaryPrompt: '用 näher、aber 或 ruhiger 比较两个房间。'
    },
    sentences: [
      { de: 'Zimmer A: im Dachgeschoss am Bahnhof Ried, möbliert, 390 Euro.', zh: '房间A：位于里德车站旁的顶层，带家具，390欧元。', note: 'möbliert 带家具——租房广告里最影响价格的一个词' },
      { de: 'Die Küche ist neben dem Zimmer, das Bad ist im ersten Stock.', zh: '厨房在房间旁边，浴室在二楼。', note: '⚠️ der erste Stock 是中国说的「二楼」；德国的「一楼」叫 Erdgeschoss。neben dem Zimmer 用第三格表位置' },
      { de: 'Der Bus hält direkt vor dem Haus, aber die Straße ist laut.', zh: '公交就在房前停靠，但街道很吵。', note: 'vor dem Haus 第三格表静止位置；aber 之后才是这则广告的缺点' },
      { de: 'Zimmer B: im Lindenweg, nicht möbliert, 340 Euro.', zh: '房间B：位于菩提树路，不带家具，340欧元。', note: 'nicht möbliert 与 A 正好相反——比较题就靠这一组词' },
      { de: 'Küche und Bad liegen gegenüber vom Zimmer.', zh: '厨房和浴室在房间对面。', note: 'gegenüber von + 第三格 = 在……对面' },
      { de: 'Das Fenster geht zum Innenhof; zum Bahnhof fährt man zehn Minuten mit dem Bus.', zh: '窗户朝向内院；乘公交到车站要10分钟。', note: 'zum = zu + dem，表方向；朝内院 = 安静，这是回答第二题的关键' }
    ],
    speakPractice: [2, 5],
    glossary: {
      dachgeschoss: { base: 'das Dachgeschoss, -e', zh: '顶层；阁楼层' },
      innenhof: { base: 'der Innenhof, ¨-e', zh: '内院' },
      möbliert: { base: 'möbliert', zh: '带家具的' }
    },
    questions: [
      { type: 'choice', q: '没有家具、预算不超过350欧元的人适合哪个房间？', options: ['A', 'B', '两个都可以'], a: 1, explain: 'B 不带家具，月租340欧元。' },
      { type: 'choice', q: '想要安静、可以接受坐公交去车站的人更适合哪个房间？', options: ['A', 'B', '都不适合'], a: 1, explain: 'B 朝向内院，但到车站需要坐10分钟公交。' }
    ]
  },
  {
    id: 'rp-a1-06',
    pilot: true,
    title: 'Ein Tag am Fluss: zwei Berichte',
    titleZh: '河边的一天：两种复述',
    level: 'A1',
    mode: 'intensiv',
    skillStage: 'R6',
    genre: 'paired-trip-reports',
    topic: 'river-trip-perspectives',
    register: 'informal-narrative',
    grammarPrereqs: ['war-hatte', 'perfect-with-haben', 'perfect-with-sein'],
    recommendedAfter: 'u12l4',
    targetLemmas: ['fahren', 'laufen', 'essen', 'Foto', 'Wetter', 'zurückkommen'],
    newLemmas: ['Ufer', 'Aussichtspunkt', 'anstrengend', 'Aussicht'],
    properNouns: ['Mara', 'Kenan', 'Bergheim'],
    knownWordTarget: 0.92,
    vocabRefs: ['w116', 'w193', 'w198', 'w219'],
    designReferences: refs(
      ['repo-s6-u12l4', 'passwort-a1-progression', 'hueber-r-fg-travel', 'nicos-m13-perfekt'],
      ['两段复述共享同一旅行事实但评价重点不同', '问题分别检查共同事实、顺序差异和个人评价']
    ),
    provenance: ORIGINAL_READING,
    skills: ['read-sequence', 'read-perspective'],
    intro: 'Mara 和 Kenan 写的是同一次旅行。先找共同事实，再区分他们选择的顺序和评价。',
    readingRoute: {
      prediction: '同一段旅行在两个人笔下可能有哪些不同？',
      focus: '用两种颜色标共同事实和个人评价，再画各自事件顺序。',
      summaryPrompt: '用 beide 和 aber 写两句，概括共同点和不同评价。'
    },
    sentences: [
      { de: 'Mara: Wir sind am Samstag mit dem Zug nach Bergheim gefahren.', zh: '玛拉：周六我们坐火车去了贝格海姆。', note: 'sind … gefahren：表示位移的动词，完成时用 sein，不用 haben' },
      { de: 'Zuerst haben wir am Ufer gegessen, dann sind wir zum Aussichtspunkt gelaufen.', zh: '我们先在河岸吃东西，然后走到观景点。', note: 'zuerst … dann 是顺序标记；essen 配 haben，laufen 配 sein，同一句里两种都出现了' },
      { de: 'Der Weg war lang, aber oben war die Aussicht wunderbar.', zh: '路很长，但上面的景色非常美。', note: 'war 是 sein 的过去式；描述状态德国人用 war，不说 ist gewesen' },
      { de: 'Kenan: Nach dem Zug sind wir direkt zum Aussichtspunkt gegangen.', zh: '凯南：坐完火车后，我们直接去了观景点。', note: '同一天，Kenan 的顺序和 Mara 不一样——direkt 这个词是关键' },
      { de: 'Später haben wir am Ufer gegessen und viele Fotos gemacht.', zh: '后来我们在河岸吃东西，拍了很多照片。', note: 'später 占第一位，动词 haben 排第二（V2）；gemacht 是 machen 的第二分词' },
      { de: 'Der Weg war anstrengend, doch das Essen am Wasser war mein bester Moment.', zh: '路走得很累，但水边的用餐是我最喜欢的时刻。', note: 'doch 这里等于 aber；这句是个人评价，不是两人共同的事实' }
    ],
    speakPractice: [1, 5],
    glossary: {
      ufer: { base: 'das Ufer, -', zh: '岸；河岸' },
      aussichtspunkt: { base: 'der Aussichtspunkt, -e', zh: '观景点' },
      anstrengend: { base: 'anstrengend', zh: '累人的；费力的' },
      aussicht: { base: 'die Aussicht, -en', zh: '景色；视野' }
    },
    questions: [
      { type: 'choice', q: '两人都确认了哪些共同事实？', options: ['坐火车、去观景点、在河岸吃东西', '坐公交、游泳、买礼物', '下雨、迷路、住旅馆'], a: 0, explain: '两段都包含火车、观景点和河岸用餐。' },
      { type: 'choice', q: '两段在什么地方不同？', options: ['目的地完全不同', '事件叙述顺序和最看重的体验不同', '同行者人数不同'], a: 1, explain: 'Mara 先写河岸用餐，Kenan 先写观景点；评价重点也不同。' }
    ]
  }
];
