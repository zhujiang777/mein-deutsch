// A1 教材驱动试点：6 个原创精听包。
// 教材只提供 data/syllabus-ref.json 中的抽象证据；正文、人物、答案和信息顺序均从空白页创作。
const ORIGINAL_PILOT = {
  kind: 'original',
  source: 'original',
  license: 'proprietary',
  adaptedFrom: {
    work: 'A1 abstract evidence matrix',
    borrowed: ['skill stage', 'genre', 'task mechanism', 'grammar boundary', 'information density'],
    statement: '仅采用页码可定位的能力约束；未复制或逐句改写教材原文、题干、选项、人物、情节或音频。',
  },
};

const refs = (evidenceIds, appliedConstraints) => ({
  evidenceIds,
  appliedConstraints,
  originalityStatement: '人物、地点、台词、选项与信息顺序均从空白页原创；出版商音频未进入产品。',
});

export const A1_PILOT_LISTENING = [
  {
    id: 'li-p01',
    pilot: true,
    audioStatus: 'ready',
    title: 'Stimmen aus dem Abendkurs',
    titleZh: '晚间班里的声音',
    level: 'A1',
    skillStage: 'L1',
    genre: 'multi-speaker-interview',
    topic: 'adult-learning-motives',
    register: 'neutral-spoken',
    grammarPrereqs: ['sein', 'haben', 'regular-verbs', 'w-questions'],
    recommendedAfter: 'u2l3',
    targetLemmas: ['heißen', 'kommen', 'wohnen', 'lernen', 'arbeiten', 'sprechen'],
    newLemmas: ['Köchin', 'Pflege', 'Reise'],
    properNouns: ['Awa', 'Dakar', 'Essen', 'Tomas', 'Brno', 'Neuss', 'Yuki', 'Osaka'],
    knownWordTarget: 0.92,
    vocabRefs: ['w016', 'w017', 'w018', 'w020', 'w112'],
    designReferences: refs(
      ['repo-s1-u2l3', 'passwort-a1-progression', 'dangdai-vorkurs-phonetics', 'hueber-h-a-contact', 'dib-ch1-interviews'],
      ['三位说话人分别给出身份、来源和学习目的', '首题必须依赖声音与说话人匹配']
    ),
    provenance: ORIGINAL_PILOT,
    func: ['Personen zuordnen', 'Herkunft und Lernzweck erkennen'],
    funcZh: ['匹配说话人', '听出来源和学习目的'],
    skills: ['listen-speaker', 'listen-gist'],
    intro: '三位学习者回答同样的三个问题。第一遍只分清声音，第二遍把来源和学习目的配回人物。',
    audio: { mode: 'sentences' },
    speakers: [
      { id: 'A', name: 'Awa', voice: 'de-DE-AmalaNeural', gender: 'f', accent: 'de-DE' },
      { id: 'T', name: 'Tomas', voice: 'de-DE-ConradNeural', gender: 'm', accent: 'de-DE' },
      { id: 'Y', name: 'Yuki', voice: 'de-DE-KatjaNeural', gender: 'f', accent: 'de-DE' }
    ],
    sentences: [
      { de: 'Ich heiße Awa und komme aus Dakar.', zh: '我叫阿瓦，来自达喀尔。', sp: 'A' },
      { de: 'Jetzt wohne ich in Essen und arbeite als Köchin.', zh: '我现在住在埃森，是一名厨师。', sp: 'A', newLemmas: ['Köchin'] },
      { de: 'Deutsch brauche ich bei der Arbeit.', zh: '工作中我需要德语。', sp: 'A' },
      { de: 'Mein Name ist Tomas, ich komme aus Brno.', zh: '我叫托马斯，来自布尔诺。', sp: 'T' },
      { de: 'Ich wohne in Neuss und arbeite in der Pflege.', zh: '我住在诺伊斯，从事护理工作。', sp: 'T', newLemmas: ['Pflege'] },
      { de: 'Ich lerne Deutsch für Gespräche mit Menschen.', zh: '我学德语是为了与人交谈。', sp: 'T' },
      { de: 'Ich bin Yuki aus Osaka und spreche auch Englisch.', zh: '我是来自大阪的由纪，也说英语。', sp: 'Y' },
      { de: 'Für meine nächste Reise lerne ich Deutsch.', zh: '我为了下一次旅行学习德语。', sp: 'Y', newLemmas: ['Reise'] }
    ],
    gist: {
      q: '哪位说话人学德语主要是为了旅行？',
      options: ['Awa', 'Tomas', 'Yuki'],
      a: 2,
      explain: 'Yuki 把学习目的和下一次旅行联系起来。'
    },
    dictation: [0, 4, 7],
    speakPractice: [2, 5],
    reproduce: [1]
  },
  {
    id: 'li-p02',
    pilot: true,
    audioStatus: 'ready',
    title: 'Anmeldung für B dreizehn',
    titleZh: '报名 B13 课程',
    level: 'A1',
    skillStage: 'L2',
    genre: 'registration-dialogue',
    topic: 'course-registration-codes',
    register: 'neutral-service',
    grammarPrereqs: ['noun-gender', 'ein-eine', 'kein-nicht', 'plural'],
    recommendedAfter: 'u5l3',
    targetLemmas: ['Name', 'Telefonnummer', 'Kurs', 'Nummer', 'schreiben', 'Raum'],
    newLemmas: ['buchstabieren', 'Kursnummer', 'wiederholen'],
    properNouns: ['Elif', 'Aydin'],
    knownWordTarget: 0.92,
    vocabRefs: ['w020', 'w043', 'w177'],
    designReferences: refs(
      ['repo-s2-u5l3', 'passwort-a1-progression', 'dangdai-vorkurs-phonetics', 'hueber-h-b-codes', 'goethe-a1-listening'],
      ['对话同时包含姓氏拼写、电话号码和课程编号', '设置 dreizehn/dreißig 与 vierzehn/vierzig 的听辨点']
    ),
    provenance: ORIGINAL_PILOT,
    func: ['Buchstaben und Zahlen notieren', 'ähnliche Zahlen unterscheiden'],
    funcZh: ['记录字母和数字', '区分相近数字'],
    skills: ['listen-spelling', 'listen-number'],
    intro: '报名对话里会出现一个姓氏、一串电话和两个容易混淆的课程数字。不要先看文字。',
    audio: { mode: 'sentences' },
    speakers: [
      { id: 'S', name: 'Service', voice: 'de-DE-ConradNeural', gender: 'm', accent: 'de-DE' },
      { id: 'E', name: 'Elif', voice: 'de-DE-KatjaNeural', gender: 'f', accent: 'de-DE' }
    ],
    sentences: [
      { de: 'Hallo. Ihr Name, bitte?', zh: '您好。请问您的姓名？', sp: 'S' },
      { de: 'Aydin ist mein Familienname. Ich buchstabiere: A, Y, D, I, N.', zh: '艾登是我的姓。我拼写一下：A、Y、D、I、N。', sp: 'E', newLemmas: ['buchstabieren'] },
      { de: 'Wie ist Ihre Telefonnummer?', zh: '您的电话号码是多少？', sp: 'S' },
      { de: 'Null eins sieben sechs, drei null vier, fünf null, eins acht.', zh: '0176 304 50 18。', sp: 'E' },
      { de: 'Ich wiederhole: null eins sieben sechs, drei null vier, fünf null, eins acht.', zh: '我重复一遍：0176 304 50 18。', sp: 'S', newLemmas: ['wiederholen'] },
      { de: 'Richtig. Meine Kursnummer ist B dreizehn, nicht B dreißig.', zh: '对。我的课程编号是 B13，不是 B30。', sp: 'E', newLemmas: ['Kursnummer'] },
      { de: 'B dreizehn ist heute in Raum vierzehn.', zh: 'B13 今天在14号教室。', sp: 'S' },
      { de: 'Nicht Raum vierzig, sondern Raum vierzehn?', zh: '不是40号，而是14号？', sp: 'E' },
      { de: 'Ja, genau.', zh: '是的，没错。', sp: 'S' }
    ],
    gist: {
      q: 'Elif 最终要去哪个课程和教室？',
      options: ['B30，40号教室', 'B13，14号教室', 'B14，13号教室'],
      a: 1,
      explain: '对话明确纠正为 B dreizehn 和 Raum vierzehn。'
    },
    dictation: [1, 3, 5, 7],
    speakPractice: [4, 7],
    reproduce: [6]
  },
  {
    id: 'li-p03',
    pilot: true,
    audioStatus: 'ready',
    title: 'Neue Zeit, neuer Saal',
    titleZh: '新时间，新教室',
    level: 'A1',
    skillStage: 'L3',
    genre: 'public-announcement',
    topic: 'community-class-change',
    register: 'formal-public',
    grammarPrereqs: ['time', 'separable-verbs', 'v2-word-order'],
    recommendedAfter: 'u8l4',
    targetLemmas: ['heute', 'beginnen', 'Uhr', 'Raum', 'kommen', 'Eingang'],
    newLemmas: ['normalerweise', 'verschieben', 'Aushang'],
    properNouns: ['Bürgerhaus'],
    knownWordTarget: 0.92,
    vocabRefs: ['w043', 'w177'],
    designReferences: refs(
      ['repo-s3-u8l4', 'passwort-a1-progression', 'hueber-h-b-time', 'goethe-a1-listening', 'vhs-a1-boundary'],
      ['通知同时呈现旧时间和新时间、旧教室和新教室', '题目要求排除旧信息']
    ),
    provenance: ORIGINAL_PILOT,
    func: ['Änderungen in einer Ansage erkennen', 'alte und neue Angaben trennen'],
    funcZh: ['识别通知中的变化', '区分旧信息和新信息'],
    skills: ['listen-announcement', 'listen-time'],
    intro: '一则公共广播先说原安排，再说变更。只记录最后有效的时间和地点。',
    audio: { mode: 'clip' },
    speakers: [{ id: 'A', name: 'Ansage', voice: 'de-DE-ConradNeural', gender: 'm', accent: 'de-DE' }],
    sentences: [
      { de: 'Achtung, eine Information zum Kurs im Bürgerhaus.', zh: '请注意，下面是市民中心课程的一则通知。', sp: 'A' },
      { de: 'Normalerweise beginnt der Kurs am Abend um sechs Uhr.', zh: '课程通常在晚上六点开始。', sp: 'A', newLemmas: ['normalerweise'] },
      { de: 'Heute beginnt er erst um halb sieben.', zh: '今天改为六点半才开始。', sp: 'A' },
      { de: 'Auch der Raum ist neu.', zh: '教室也有变化。', sp: 'A' },
      { de: 'Wir gehen nicht in Raum acht, sondern in Raum elf.', zh: '我们不去8号教室，而去11号教室。', sp: 'A' },
      { de: 'Wir verschieben den Kurs also um dreißig Minuten.', zh: '所以我们把课程推迟30分钟。', sp: 'A', newLemmas: ['verschieben'] },
      { de: 'Am Eingang finden Sie auch einen Aushang.', zh: '入口处也有一张公告。', sp: 'A', newLemmas: ['Aushang'] },
      { de: 'Vielen Dank.', zh: '非常感谢。', sp: 'A' }
    ],
    gist: {
      q: '学员最后应该何时去哪里？',
      options: ['18:00，8号教室', '18:30，11号教室', '18:30，8号教室'],
      a: 1,
      explain: '旧信息是六点和8号教室，新信息是六点半和11号教室。'
    },
    dictation: [1, 2, 4],
    speakPractice: [4, 6],
    reproduce: [5]
  },
  {
    id: 'li-p04',
    pilot: true,
    audioStatus: 'ready',
    title: 'Drei Ideen für Sonntag',
    titleZh: '周日的三个主意',
    level: 'A1',
    skillStage: 'L4',
    genre: 'leisure-plan-interview',
    topic: 'weekend-group-decision',
    register: 'informal-spoken',
    grammarPrereqs: ['modal-verbs', 'sentence-bracket'],
    recommendedAfter: 'u9l3',
    targetLemmas: ['Sonntag', 'wollen', 'können', 'gehen', 'treffen', 'machen', 'Vorschlag', 'Wunsch', 'Markt'],
    newLemmas: ['Flohmarkt', 'Ruderboot', 'Entscheidung'],
    properNouns: ['Radio West', 'Nela', 'Boris'],
    knownWordTarget: 0.92,
    vocabRefs: ['w114', 'w162', 'w198'],
    designReferences: refs(
      ['repo-s4-u9l3', 'passwort-a1-progression', 'hueber-h-g-leisure', 'dib-ch4-leisure', 'vhs-a1-boundary'],
      ['采访者分别询问建议、个人意愿和小组决定', '最终答案不能由第一项建议直接推出']
    ),
    provenance: ORIGINAL_PILOT,
    func: ['Vorschlag, Wunsch und Entscheidung trennen', 'Sprecherabsichten erkennen'],
    funcZh: ['区分建议、意愿与决定', '识别说话人意图'],
    skills: ['listen-intention', 'listen-turns'],
    intro: '短采访中会依次出现建议、个人偏好和最终决定。注意它们并不相同。',
    audio: { mode: 'sentences' },
    speakers: [
      { id: 'R', name: 'Radio West', voice: 'de-DE-ConradNeural', gender: 'm', accent: 'de-DE' },
      { id: 'N', name: 'Nela', voice: 'de-DE-KatjaNeural', gender: 'f', accent: 'de-DE' },
      { id: 'B', name: 'Boris', voice: 'de-DE-KillianNeural', gender: 'm', accent: 'de-DE' }
    ],
    sentences: [
      { de: 'Was kann man am Sonntag in der Stadt machen?', zh: '周日在城里可以做什么？', sp: 'R' },
      { de: 'Mein Vorschlag ist der Flohmarkt am Morgen.', zh: '我的建议是早上去跳蚤市场。', sp: 'N', newLemmas: ['Flohmarkt'] },
      { de: 'Ich möchte lieber ein Ruderboot nehmen.', zh: '我更想租一条划艇。', sp: 'B', newLemmas: ['Ruderboot'] },
      { de: 'Aber am Nachmittag soll es regnen.', zh: '但下午可能会下雨。', sp: 'R' },
      { de: 'Dann können wir zuerst zum Markt gehen.', zh: '那我们可以先去市场。', sp: 'N' },
      { de: 'Und später treffen wir uns im Kino.', zh: '之后我们在电影院碰面。', sp: 'B' },
      { de: 'Gut, dann ist die Entscheidung klar: zuerst Flohmarkt, dann Kino.', zh: '好，那就这么定：先去跳蚤市场，再去电影院。', sp: 'N', newLemmas: ['Entscheidung'] },
      { de: 'Das Ruderboot bleibt also nur mein Wunsch.', zh: '所以划艇只是我个人的愿望。', sp: 'B' }
    ],
    gist: {
      q: '小组最终决定了什么？',
      options: ['只去划艇', '先去市场，再去电影院', '下午一直在市场'],
      a: 1,
      explain: '划艇只是 Boris 的个人愿望；最后定下来的是先跳蚤市场、再电影院。'
    },
    dictation: [1, 2, 6],
    speakPractice: [4, 7],
    reproduce: [5]
  },
  {
    id: 'li-p05',
    pilot: true,
    audioStatus: 'ready',
    title: 'Zum Repair-Café',
    titleZh: '去维修咖啡馆',
    level: 'A1',
    skillStage: 'L5',
    genre: 'continuous-route-instruction',
    topic: 'repair-cafe-route',
    register: 'neutral-instructional',
    grammarPrereqs: ['accusative', 'dative', 'location-prepositions'],
    recommendedAfter: 'u11l4',
    targetLemmas: ['Bahnhof', 'Straße', 'links', 'rechts', 'gegenüber', 'Eingang'],
    newLemmas: ['Unterführung', 'Apotheke', 'Hinterhof'],
    properNouns: ['Repair-Café', 'Repair', 'Café', 'Marktstraße'],
    knownWordTarget: 0.92,
    vocabRefs: ['w151', 'w153'],
    designReferences: refs(
      ['repo-s5-u11l4', 'passwort-a1-progression', 'hueber-h-c-route', 'goethe-a1-listening', 'vhs-a1-boundary'],
      ['一位说话人连续给出完整路线', '听者必须还原三个地标的先后顺序和最终入口方位']
    ),
    provenance: ORIGINAL_PILOT,
    func: ['Einer Wegbeschreibung folgen', 'Landmarken in Reihenfolge bringen'],
    funcZh: ['跟随连续路线', '排列地标顺序'],
    skills: ['listen-route', 'listen-location'],
    intro: '连续路线没有问答提示。先画出移动方向，再排列地下通道、药店和院子的顺序。',
    audio: { mode: 'clip' },
    speakers: [{ id: 'G', name: 'Guide', voice: 'de-DE-KatjaNeural', gender: 'f', accent: 'de-DE' }],
    sentences: [
      { de: 'Gehen Sie am Bahnhof in die Unterführung.', zh: '请在车站进入地下通道。', sp: 'G', newLemmas: ['Unterführung'] },
      { de: 'Nehmen Sie dort den Ausgang Marktstraße.', zh: '在那里走“市场街”出口。', sp: 'G' },
      { de: 'Oben gehen Sie nach rechts bis zur Apotheke.', zh: '上去后向右走到药店。', sp: 'G', newLemmas: ['Apotheke'] },
      { de: 'Direkt hinter der Apotheke liegt ein kleiner Platz.', zh: '药店后面紧接着有一个小广场。', sp: 'G' },
      { de: 'Gehen Sie über den Platz und dann nach links.', zh: '穿过广场，然后左转。', sp: 'G' },
      { de: 'Gegenüber sehen Sie ein graues Haus.', zh: '对面有一栋灰色房子。', sp: 'G' },
      { de: 'Der Eingang zum Repair-Café ist im Hinterhof.', zh: '维修咖啡馆的入口在后院。', sp: 'G', newLemmas: ['Hinterhof'] },
      { de: 'Gehen Sie rechts am Haus vorbei in den Hinterhof.', zh: '请从房子右侧绕过去进入后院。', sp: 'G' }
    ],
    gist: {
      q: '三个关键地标按什么顺序出现？',
      options: ['药店—地下通道—灰房子', '地下通道—药店—灰房子', '灰房子—药店—地下通道'],
      a: 1,
      explain: '路线从地下通道开始，经过药店，最后到灰房子和后院入口。'
    },
    dictation: [0, 2, 6],
    speakPractice: [4, 7],
    reproduce: [5]
  },
  {
    id: 'li-p06',
    pilot: true,
    audioStatus: 'ready',
    title: 'Samstag am Kanal',
    titleZh: '运河边的星期六',
    level: 'A1',
    skillStage: 'L6',
    genre: 'weekend-micro-narrative',
    topic: 'canal-day-sequence',
    register: 'informal-narrative',
    grammarPrereqs: ['war-hatte', 'perfect-with-haben', 'perfect-with-sein'],
    recommendedAfter: 'u12l4',
    targetLemmas: ['Samstag', 'fahren', 'treffen', 'essen', 'machen', 'zurückkommen'],
    newLemmas: ['Kanal', 'Panne', 'Werkzeug'],
    properNouns: ['Mert', 'Lotte'],
    knownWordTarget: 0.92,
    vocabRefs: ['w116', 'w193', 'w212'],
    designReferences: refs(
      ['repo-s6-u12l4', 'passwort-a1-progression', 'hueber-h-g-narrative', 'nicos-m13-perfekt'],
      ['微叙事使用高频 haben/sein 完成时', '理解题要求按真实发生顺序重建四个事件']
    ),
    provenance: ORIGINAL_PILOT,
    func: ['Ereignisse ordnen', 'Perfektformen im Zusammenhang verstehen'],
    funcZh: ['排列事件', '在语境中理解完成时'],
    skills: ['listen-sequence', 'listen-narrative'],
    intro: '一段周末经历含一次意外。第一遍听结果，第二遍按发生顺序排列事件。',
    audio: { mode: 'clip' },
    speakers: [{ id: 'M', name: 'Mert', voice: 'de-DE-ConradNeural', gender: 'm', accent: 'de-DE' }],
    sentences: [
      { de: 'Am Samstag bin ich früh mit Lotte zum Kanal gefahren.', zh: '周六我一早和洛特去了运河边。', sp: 'M', newLemmas: ['Kanal'] },
      { de: 'Dort haben wir zuerst Kaffee getrunken.', zh: '我们先在那里喝了咖啡。', sp: 'M' },
      { de: 'Dann hat mein Fahrrad eine Panne gehabt.', zh: '然后我的自行车出了故障。', sp: 'M', newLemmas: ['Panne'] },
      { de: 'Lotte hat in ihrer Tasche Werkzeug gefunden.', zh: '洛特在包里找到了工具。', sp: 'M', newLemmas: ['Werkzeug'] },
      { de: 'Wir haben das Fahrrad zusammen repariert.', zh: '我们一起修好了自行车。', sp: 'M' },
      { de: 'Danach sind wir noch am Wasser gelaufen.', zh: '之后我们还沿着水边走了走。', sp: 'M' },
      { de: 'Am Abend sind wir müde zurückgekommen.', zh: '晚上我们疲惫地回来了。', sp: 'M' },
      { de: 'Die Panne war schlecht, aber der Tag war sehr schön.', zh: '故障很糟糕，但这一天仍然很美好。', sp: 'M' }
    ],
    gist: {
      q: '哪一项顺序正确？',
      options: ['修车—喝咖啡—散步', '喝咖啡—自行车故障—修车—散步', '散步—修车—喝咖啡'],
      a: 1,
      explain: '先喝咖啡，随后车坏，找到工具修车，最后散步。'
    },
    dictation: [0, 2, 6],
    speakPractice: [4, 7],
    reproduce: [3]
  }
];
