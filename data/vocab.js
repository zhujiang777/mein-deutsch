// A1 核心词汇：按主题分组，名词带冠词(art)和复数(pl)
// 学习顺序建议：按 THEMES 顺序，配合语法课进度
export const THEMES = [
  { id: 'gruss', name: '问候与常用语', icon: '👋' },
  { id: 'person', name: '自我介绍', icon: '🙋' },
  { id: 'zahl', name: '数字与时间', icon: '🔢' },
  { id: 'familie', name: '家庭与人', icon: '👨‍👩‍👧' },
  { id: 'essen', name: '食物与饮料', icon: '🍞' },
  { id: 'verb1', name: '高频动词 I', icon: '🏃' },
  { id: 'verb2', name: '高频动词 II', icon: '✍️' },
  { id: 'wohnen', name: '居住与家', icon: '🏠' },
  { id: 'stadt', name: '城市与交通', icon: '🚌' },
  { id: 'arbeit', name: '工作与学习', icon: '💼' },
  { id: 'koerper', name: '身体与健康', icon: '🧑‍⚕️' },
  { id: 'wetter', name: '天气与时间词', icon: '🌤️' },
  { id: 'adj', name: '常用形容词', icon: '🎨' },
  { id: 'frage', name: '疑问词与小词', icon: '❓' },
];

let n = 0;
const w = (de, art, pl, zh, ex, exZh, theme, extra) =>
  ({ id: 'w' + String(++n).padStart(3, '0'), de, art, pl, zh, ex, exZh, theme, ...extra });

export const VOCAB = [
  /* 👋 问候与常用语 */
  w('Hallo', null, null, '你好', 'Hallo, wie geht’s?', '你好，最近怎么样？', 'gruss', {
    sentences: [
      { de: 'Hallo, wie geht’s?', zh: '你好，最近怎么样？', source: null },
      { de: 'Hallo! Ich bin Anna.', zh: '你好！我是安娜。', source: 'lesson:u1l1' },
    ],
  }),
  w('Guten Morgen', null, null, '早上好', 'Guten Morgen, Frau Schmidt!', '早上好，施密特女士！', 'gruss', {
    sentences: [
      { de: 'Guten Morgen, Frau Schmidt!', zh: '早上好，施密特女士！', source: null },
      { de: 'Guten Morgen! Wie geht es Ihnen?', zh: '早上好！您好吗？', source: 'lesson:u0l8' },
    ],
  }),
  w('Guten Tag', null, null, '你好（白天）', 'Guten Tag, Herr Müller!', '您好，米勒先生！', 'gruss', {
    sentences: [
      { de: 'Guten Tag, Herr Müller!', zh: '您好，米勒先生！', source: null },
      { de: 'Guten Tag! Wie heißen Sie?', zh: '您好！您叫什么名字？', source: 'lesson:sa-l1' },
      { de: 'Guten Tag! Ich habe einen Termin um zehn Uhr.', zh: '您好！我预约了十点。', source: 'lesson:sb-l3' },
    ],
  }),
  w('Guten Abend', null, null, '晚上好', 'Guten Abend zusammen!', '大家晚上好！', 'gruss', {
    sentences: [
      { de: 'Guten Abend zusammen!', zh: '大家晚上好！', source: null },
      { de: 'Guten Abend! Wie geht es Ihnen?', zh: '晚上好！您好吗？', source: null },
    ],
  }),
  w('Gute Nacht', null, null, '晚安', 'Gute Nacht, schlaf gut!', '晚安，睡个好觉！', 'gruss', {
    sentences: [
      { de: 'Gute Nacht, schlaf gut!', zh: '晚安，睡个好觉！', source: null },
      { de: 'Ich bin müde. Gute Nacht!', zh: '我累了。晚安！', source: null },
    ],
  }),
  w('Tschüss', null, null, '再见（口语）', 'Tschüss, bis morgen!', '再见，明天见！', 'gruss', {
    sentences: [
      { de: 'Tschüss, bis morgen!', zh: '再见，明天见！', source: null },
    ],
  }),
  w('Auf Wiedersehen', null, null, '再见（正式）', 'Auf Wiedersehen, Herr Doktor!', '再见，医生先生！', 'gruss', {
    sentences: [
      { de: 'Auf Wiedersehen, Herr Doktor!', zh: '再见，医生先生！', source: null },
      { de: 'Danke schön! Auf Wiedersehen!', zh: '非常感谢！再见！', source: 'lesson:sa-l2' },
    ],
  }),
  w('danke', null, null, '谢谢', 'Danke schön!', '非常感谢！', 'gruss', {
    sentences: [
      { de: 'Danke schön!', zh: '非常感谢！', source: null },
      { de: 'Sehr gut, danke!', zh: '很好，谢谢！', source: 'lesson:sa-l2' },
    ],
  }),
  w('bitte', null, null, '请；不客气', 'Bitte schön!', '不客气！', 'gruss', {
    senses: [{ pos: '', zh: '不客气（回应感谢）' }, { pos: '', zh: '请（礼貌用语，点单/请求时）' }],
    sentences: [
      { de: 'Bitte schön!', zh: '不客气！', source: null },
      { de: 'Ich hätte gern einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。', source: 'lesson:sa-l2' },
      { de: 'Zehn Äpfel, bitte!', zh: '请来十个苹果！', source: 'lesson:u0l7' },
    ],
  }),
  w('Entschuldigung', 'die', 'Entschuldigungen', '对不起；打扰一下', 'Entschuldigung, wo ist der Bahnhof?', '打扰一下，火车站在哪？', 'gruss', {
    senses: [{ pos: 'n.', zh: '打扰一下（引起注意/问路时）' }, { pos: 'n.', zh: '对不起（道歉时）' }],
    sentences: [
      { de: 'Entschuldigung, wo ist der Bahnhof?', zh: '打扰一下，火车站在哪？', source: null },
      { de: 'Entschuldigung, wo finde ich Brot?', zh: '打扰一下，面包在哪儿？', source: 'lesson:sa-l3' },
    ],
    mnemonic: 'Entschuldigung = ent-(去除)+Schuld(过错)+-igung(名词后缀) → 消除过错，即"对不起"',
  }),
  w('ja', null, null, '是', 'Ja, gern!', '是的，乐意！', 'gruss', {
    sentences: [
      { de: 'Ja, gern!', zh: '是的，乐意！', source: null },
      { de: 'Ja, ich bin Studentin. Und du?', zh: '是的，我是大学生。你呢？', source: 'lesson:u1l1' },
    ],
  }),
  w('nein', null, null, '不', 'Nein, danke.', '不，谢谢。', 'gruss', {
    sentences: [
      { de: 'Nein, danke.', zh: '不，谢谢。', source: null },
      { de: 'Nein, ich bin nicht müde.', zh: '不，我不累。', source: 'lesson:u1l1' },
    ],
  }),
  w('vielleicht', null, null, '也许', 'Vielleicht morgen.', '也许明天吧。', 'gruss', {
    sentences: [
      { de: 'Vielleicht morgen.', zh: '也许明天吧。', source: null },
    ],
  }),
  w('gern', null, null, '乐意地', 'Ich helfe dir gern.', '我很乐意帮你。', 'gruss', {
    sentences: [
      { de: 'Ich helfe dir gern.', zh: '我很乐意帮你。', source: null },
      { de: 'Ich trinke gern Wein.', zh: '我喜欢喝葡萄酒。', source: 'lesson:u0l4' },
    ],
  }),
  w('bis bald', null, null, '回头见', 'Mach’s gut, bis bald!', '保重，回头见！', 'gruss', {
    sentences: [
      { de: 'Mach’s gut, bis bald!', zh: '保重，回头见！', source: null },
    ],
  }),

  /* 🙋 自我介绍 */
  w('heißen', null, null, '叫（名字）', 'Ich heiße Lena.', '我叫莱娜。', 'person', {
    sentences: [
      { de: 'Ich heiße Lena.', zh: '我叫莱娜。', source: null },
      { de: 'Ich heiße Mia. Ich komme aus China.', zh: '我叫米娅，我来自中国。', source: 'lesson:sa-l1' },
      { de: 'Ich heiße Mia Wang.', zh: '我叫王米娅。', source: 'lesson:sb-l2' },
    ],
    mnemonic: 'heißen 与 heiß（热的）拼写相近但无关，heißen 意为"叫（名字）"',
  }),
  w('kommen', null, null, '来', 'Ich komme aus China.', '我来自中国。', 'person', {
    sentences: [
      { de: 'Ich komme aus China.', zh: '我来自中国。', source: null },
      { de: 'Woher kommst du?', zh: '你从哪儿来？', source: 'lesson:sa-l1' },
    ],
    mnemonic: 'kommen ≈ 英语 come，同源好记',
  }),
  w('wohnen', null, null, '居住', 'Ich wohne in Peking.', '我住在北京。', 'person', {
    sentences: [
      { de: 'Ich wohne in Peking.', zh: '我住在北京。', source: null },
      { de: 'Ich wohne in der Stadt.', zh: '我住在城市里。', source: 'lesson:u0l2' },
    ],
  }),
  w('sprechen', null, null, '说（语言）', 'Sprechen Sie Deutsch?', '您说德语吗？', 'person', {
    sentences: [
      { de: 'Sprechen Sie Deutsch?', zh: '您说德语吗？', source: null },
      { de: 'Ich spreche ein bisschen Deutsch.', zh: '我会说一点德语。', source: 'lesson:u0l5' },
    ],
    mnemonic: 'sprechen ≈ 英语 speech，同根好记',
  }),
  w('Name', 'der', 'Namen', '名字', 'Wie ist Ihr Name?', '您贵姓？', 'person', {
    sentences: [
      { de: 'Wie ist Ihr Name?', zh: '您贵姓？', source: null },
      { de: 'Guten Tag! Wie ist Ihr Name?', zh: '您好！您叫什么名字？', source: 'lesson:sb-l2' },
    ],
    mnemonic: 'Name ≈ 英语 name，同源好记',
  }),
  w('Land', 'das', 'Länder', '国家', 'Aus welchem Land kommst du?', '你来自哪个国家？', 'person', {
    sentences: [
      { de: 'Aus welchem Land kommst du?', zh: '你来自哪个国家？', source: null },
      { de: 'Deutschland ist ein sehr schönes Land.', zh: '德国是一个很美的国家。', source: null },
    ],
    mnemonic: 'Land ≈ 英语 land，同源好记',
  }),
  w('China', 'das', null, '中国', 'Ich komme aus China.', '我来自中国。', 'person', {
    sentences: [
      { de: 'Ich komme aus China.', zh: '我来自中国。', source: null },
      { de: 'Wir sind Studenten aus China.', zh: '我们是来自中国的大学生。', source: 'lesson:u1l3' },
    ],
  }),
  w('Deutschland', 'das', null, '德国', 'Deutschland ist schön.', '德国很美。', 'person', {
    sentences: [
      { de: 'Deutschland ist schön.', zh: '德国很美。', source: null },
      { de: 'Ich komme aus Deutschland.', zh: '我来自德国。', source: 'lesson:sa-l1' },
      { de: 'Wir sind Studenten aus Deutschland.', zh: '我们是来自德国的大学生。', source: 'lesson:u1l3' },
    ],
  }),
  w('Sprache', 'die', 'Sprachen', '语言', 'Deutsch ist eine schöne Sprache.', '德语是一门美丽的语言。', 'person', {
    sentences: [
      { de: 'Deutsch ist eine schöne Sprache.', zh: '德语是一门美丽的语言。', source: null },
      { de: 'Ich lerne gern neue Sprachen.', zh: '我喜欢学习新语言。', source: null },
    ],
    mnemonic: 'Sprache 来自动词 sprechen（说）→ "说出来的东西"，即语言',
  }),
  w('Deutsch', 'das', null, '德语', 'Ich lerne Deutsch.', '我在学德语。', 'person', {
    sentences: [
      { de: 'Ich lerne Deutsch.', zh: '我在学德语。', source: null },
      { de: 'Ich spreche ein bisschen Deutsch, aber ich lerne jeden Tag.', zh: '我会说一点德语，但我每天都在学。', source: 'lesson:u0l8' },
    ],
  }),
  w('Chinesisch', 'das', null, '中文', 'Chinesisch ist meine Muttersprache.', '中文是我的母语。', 'person', {
    sentences: [
      { de: 'Chinesisch ist meine Muttersprache.', zh: '中文是我的母语。', source: null },
    ],
    mnemonic: 'Chinesisch = China + -isch（构成语言/形容词的后缀）',
  }),
  w('Englisch', 'das', null, '英语', 'Er spricht gut Englisch.', '他英语说得好。', 'person', {
    sentences: [
      { de: 'Er spricht gut Englisch.', zh: '他英语说得好。', source: null },
    ],
    mnemonic: 'Englisch ≈ English，同源；-isch 是德语构成"…语言"的常见后缀',
  }),
  w('alt', null, null, '老的；…岁的', 'Wie alt bist du?', '你多大了？', 'person', {
    senses: [{ pos: 'adj.', zh: '老的' }, { pos: 'adj.', zh: '…岁（问/说年龄）' }],
    sentences: [
      { de: 'Wie alt bist du?', zh: '你多大了？', source: null },
      { de: 'Mein Bruder ist zehn Jahre alt.', zh: '我弟弟十岁。', source: null },
    ],
  }),
  w('Jahr', 'das', 'Jahre', '年；岁', 'Ich bin 25 Jahre alt.', '我 25 岁。', 'person', {
    sentences: [
      { de: 'Ich bin 25 Jahre alt.', zh: '我 25 岁。', source: null },
      { de: 'Mein Bruder ist zehn Jahre alt.', zh: '我弟弟十岁。', source: null },
    ],
  }),
  w('Hobby', 'das', 'Hobbys', '爱好', 'Was sind deine Hobbys?', '你有什么爱好？', 'person', {
    sentences: [
      { de: 'Was sind deine Hobbys?', zh: '你有什么爱好？', source: null },
    ],
    mnemonic: 'Hobby ≈ 英语 hobby，直接同源',
  }),
  w('Musik', 'die', null, '音乐', 'Ich höre gern Musik.', '我喜欢听音乐。', 'person', {
    sentences: [
      { de: 'Ich höre gern Musik.', zh: '我喜欢听音乐。', source: null },
      { de: 'Ich studiere Musik.', zh: '我学音乐专业。', source: 'lesson:sa-l1' },
    ],
    mnemonic: 'Musik ≈ 英语 music，同源好记',
  }),
  w('Sport', 'der', null, '体育运动', 'Ich mache gern Sport.', '我喜欢运动。', 'person', {
    sentences: [
      { de: 'Ich mache gern Sport.', zh: '我喜欢运动。', source: null },
      { de: 'Ich studiere Sport.', zh: '我学体育专业。', source: 'lesson:sa-l1' },
    ],
    mnemonic: 'Sport ≈ 英语 sport，同源好记',
  }),
  w('Freund', 'der', 'Freunde', '朋友（男）', 'Er ist mein bester Freund.', '他是我最好的朋友。', 'person', {
    sentences: [
      { de: 'Er ist mein bester Freund.', zh: '他是我最好的朋友。', source: null },
      { de: 'Gut, wir sind jetzt Freunde!', zh: '太好了，我们现在是朋友了！', source: 'lesson:u1l3' },
    ],
    mnemonic: 'Freund ≈ 英语 friend，同源好记',
  }),
  w('Freundin', 'die', 'Freundinnen', '朋友（女）', 'Meine Freundin wohnt in Berlin.', '我的女性朋友住在柏林。', 'person', {
    sentences: [
      { de: 'Meine Freundin wohnt in Berlin.', zh: '我的女性朋友住在柏林。', source: null },
      { de: 'Sie ist meine Freundin. Sie ist sehr nett.', zh: '她是我的朋友。她人很好。', source: 'lesson:u1l2' },
    ],
    mnemonic: 'Freundin = Freund + -in（阴性名词后缀），同类词还有 Studentin、Lehrerin',
  }),

  /* 🔢 数字与时间 */
  w('eins, zwei, drei', null, null, '一、二、三', 'Eins, zwei, drei, los!', '一、二、三，开始！', 'zahl', {
    sentences: [
      { de: 'Eins, zwei, drei, los!', zh: '一、二、三，开始！', source: null },
      { de: 'Der Kuchen kostet drei Euro.', zh: '蛋糕三欧元。', source: 'lesson:sa-l2' },
    ],
  }),
  w('vier, fünf, sechs', null, null, '四、五、六', 'Ich habe vier Bücher.', '我有四本书。', 'zahl', {
    sentences: [
      { de: 'Ich habe vier Bücher.', zh: '我有四本书。', source: null },
      { de: 'Ich habe fünf Brüder.', zh: '我有五个兄弟。', source: 'lesson:u0l3' },
    ],
  }),
  w('sieben, acht, neun, zehn', null, null, '七、八、九、十', 'Es ist zehn Uhr.', '现在十点。', 'zahl', {
    sentences: [
      { de: 'Es ist zehn Uhr.', zh: '现在十点。', source: null },
      { de: 'Ich habe einen Termin um zehn Uhr.', zh: '我预约了十点。', source: 'lesson:sb-l3' },
    ],
  }),
  w('elf, zwölf', null, null, '十一、十二', 'Es ist zwölf Uhr.', '十二点了。', 'zahl', {
    sentences: [
      { de: 'Es ist zwölf Uhr.', zh: '十二点了。', source: null },
    ],
  }),
  w('zwanzig', null, null, '二十', 'Sie ist zwanzig Jahre alt.', '她二十岁。', 'zahl', {
    sentences: [
      { de: 'Sie ist zwanzig Jahre alt.', zh: '她二十岁。', source: null },
    ],
  }),
  w('dreißig', null, null, '三十', 'Der Bus kommt um halb dreißig... nein, um halb acht!', '公交七点半来！', 'zahl', {
    sentences: [
      { de: 'Der Bus kommt um halb dreißig... nein, um halb acht!', zh: '公交七点半来！', source: null },
    ],
  }),
  w('hundert', null, null, '一百', 'Das kostet hundert Euro.', '这个一百欧元。', 'zahl', {
    sentences: [
      { de: 'Das kostet hundert Euro.', zh: '这个一百欧元。', source: null },
    ],
  }),
  w('tausend', null, null, '一千', 'Tausend Dank!', '万分感谢！', 'zahl', {
    sentences: [
      { de: 'Tausend Dank!', zh: '万分感谢！', source: null },
    ],
  }),
  w('Uhr', 'die', 'Uhren', '钟；…点钟', 'Es ist acht Uhr.', '现在八点。', 'zahl', {
    senses: [{ pos: 'n.', zh: '钟；手表' }, { pos: '', zh: '…点钟（报时）' }],
    sentences: [
      { de: 'Es ist acht Uhr.', zh: '现在八点。', source: null },
      { de: 'Ich habe einen Termin um zehn Uhr.', zh: '我预约了十点。', source: 'lesson:sb-l3' },
    ],
  }),
  w('Zeit', 'die', null, '时间', 'Hast du Zeit?', '你有时间吗？', 'zahl', {
    sentences: [
      { de: 'Hast du Zeit?', zh: '你有时间吗？', source: null },
      { de: 'Ich habe heute keine Zeit.', zh: '我今天没时间。', source: null },
    ],
    mnemonic: 'Zeit 与英语 tide 同源（如 time and tide），引申为"时间"',
  }),
  w('Stunde', 'die', 'Stunden', '小时', 'Der Kurs dauert zwei Stunden.', '课程持续两小时。', 'zahl', {
    sentences: [
      { de: 'Der Kurs dauert zwei Stunden.', zh: '课程持续两小时。', source: null },
    ],
  }),
  w('Minute', 'die', 'Minuten', '分钟', 'Fünf Minuten, bitte!', '请等五分钟！', 'zahl', {
    sentences: [
      { de: 'Fünf Minuten, bitte!', zh: '请等五分钟！', source: null },
      { de: 'Zu Fuß sind es zehn Minuten.', zh: '走路十分钟。', source: 'lesson:sb-l1' },
    ],
  }),
  w('Tag', 'der', 'Tage', '天；日', 'Der Tag hat 24 Stunden.', '一天有 24 小时。', 'zahl', {
    sentences: [
      { de: 'Der Tag hat 24 Stunden.', zh: '一天有 24 小时。', source: null },
      { de: 'Ich spreche ein bisschen Deutsch, aber ich lerne jeden Tag.', zh: '我会说一点德语，但我每天都在学。', source: 'lesson:u0l8' },
    ],
    mnemonic: 'Tag ≈ 英语 day，同源（辅音 t↔d 音变）',
  }),
  w('Woche', 'die', 'Wochen', '周', 'Bis nächste Woche!', '下周见！', 'zahl', {
    sentences: [
      { de: 'Bis nächste Woche!', zh: '下周见！', source: null },
    ],
  }),
  w('Monat', 'der', 'Monate', '月', 'Der Kurs beginnt nächsten Monat.', '课程下个月开始。', 'zahl', {
    sentences: [
      { de: 'Der Kurs beginnt nächsten Monat.', zh: '课程下个月开始。', source: null },
    ],
    mnemonic: 'Monat ≈ 英语 month，同源',
  }),
  w('Montag', 'der', 'Montage', '周一', 'Am Montag arbeite ich.', '周一我上班。', 'zahl', {
    sentences: [
      { de: 'Am Montag arbeite ich.', zh: '周一我上班。', source: null },
    ],
    mnemonic: 'Montag = Mond(月亮)+Tag(天) → "月亮日"，和英语 Monday 逻辑一致',
  }),
  w('Dienstag', 'der', 'Dienstage', '周二', 'Am Dienstag habe ich Deutschkurs.', '周二我有德语课。', 'zahl', {
    sentences: [
      { de: 'Am Dienstag habe ich Deutschkurs.', zh: '周二我有德语课。', source: null },
    ],
    mnemonic: 'Dienstag 源自战神 Ziu/Tyr 之日，和英语 Tuesday(Tiw’s day) 逻辑一致',
  }),
  w('Mittwoch', 'der', 'Mittwoche', '周三', 'Mittwoch ist die Mitte der Woche.', '周三是一周的中间。', 'zahl', {
    sentences: [
      { de: 'Mittwoch ist die Mitte der Woche.', zh: '周三是一周的中间。', source: null },
    ],
    mnemonic: 'Mittwoch = Mitte(中间)+Woche(周) → 一周的中间，即周三',
  }),
  w('Donnerstag', 'der', 'Donnerstage', '周四', 'Am Donnerstag gehe ich einkaufen.', '周四我去购物。', 'zahl', {
    sentences: [
      { de: 'Am Donnerstag gehe ich einkaufen.', zh: '周四我去购物。', source: null },
    ],
    mnemonic: 'Donnerstag = Donner(雷)+Tag → "雷神日"，和英语 Thursday(Thor\'s day) 逻辑一致',
  }),
  w('Freitag', 'der', 'Freitage', '周五', 'Endlich Freitag!', '终于周五了！', 'zahl', {
    sentences: [
      { de: 'Endlich Freitag!', zh: '终于周五了！', source: null },
    ],
    mnemonic: '注意：Freitag 源自女神 Freya 之日，和 frei（自由的）只是拼写巧合，没有关系',
  }),
  w('Samstag', 'der', 'Samstage', '周六', 'Am Samstag schlafe ich lange.', '周六我睡懒觉。', 'zahl', {
    sentences: [
      { de: 'Am Samstag schlafe ich lange.', zh: '周六我睡懒觉。', source: null },
    ],
    mnemonic: 'Samstag 源自 Sabbat（安息日），德语南部/瑞士常用 Samstag，北部也说 Sonnabend',
  }),
  w('Sonntag', 'der', 'Sonntage', '周日', 'Am Sonntag sind die Geschäfte zu.', '周日商店关门。', 'zahl', {
    sentences: [
      { de: 'Am Sonntag sind die Geschäfte zu.', zh: '周日商店关门。', source: null },
    ],
    mnemonic: 'Sonntag = Sonne(太阳)+Tag → "太阳日"，和英语 Sunday 逻辑一致',
  }),
  w('heute', null, null, '今天', 'Was machst du heute?', '你今天做什么？', 'zahl', {
    sentences: [
      { de: 'Was machst du heute?', zh: '你今天做什么？', source: null },
      { de: 'Ich bin heute müde.', zh: '我今天很累。', source: 'lesson:u0l4' },
    ],
  }),
  w('morgen', null, null, '明天', 'Bis morgen!', '明天见！', 'zahl', {
    sentences: [
      { de: 'Bis morgen!', zh: '明天见！', source: null },
      { de: 'Morgen fahre ich nach Berlin.', zh: '我明天去柏林。', source: null },
    ],
    mnemonic: '小写 morgen=明天（副词），大写 Morgen=早晨（名词），靠大小写区分',
  }),
  w('gestern', null, null, '昨天', 'Gestern war ich müde.', '昨天我很累。', 'zahl', {
    sentences: [
      { de: 'Gestern war ich müde.', zh: '昨天我很累。', source: null },
    ],
    mnemonic: 'gestern 和英语 yesterday 的 yester- 同源',
  }),
  w('jetzt', null, null, '现在', 'Ich muss jetzt gehen.', '我现在得走了。', 'zahl', {
    sentences: [
      { de: 'Ich muss jetzt gehen.', zh: '我现在得走了。', source: null },
      { de: 'Gut, wir sind jetzt Freunde!', zh: '太好了，我们现在是朋友了！', source: 'lesson:u1l3' },
    ],
  }),

  /* 👨‍👩‍👧 家庭与人 */
  w('Familie', 'die', 'Familien', '家庭', 'Meine Familie ist groß.', '我家人很多。', 'familie', {
    sentences: [
      { de: 'Meine Familie ist groß.', zh: '我家人很多。', source: null },
    ],
    mnemonic: 'Familie ≈ 英语 family，同源好记',
  }),
  w('Vater', 'der', 'Väter', '爸爸', 'Mein Vater ist Arzt.', '我爸爸是医生。', 'familie', {
    sentences: [
      { de: 'Mein Vater ist Arzt.', zh: '我爸爸是医生。', source: null },
      { de: 'Mein Vater trinkt gern Wasser.', zh: '我爸爸喜欢喝水。', source: 'lesson:u0l7' },
    ],
    mnemonic: 'Vater ≈ 英语 father（辅音规律 v↔f 对应），同源好记',
  }),
  w('Mutter', 'die', 'Mütter', '妈妈', 'Meine Mutter kocht gern.', '我妈妈喜欢做饭。', 'familie', {
    sentences: [
      { de: 'Meine Mutter kocht gern.', zh: '我妈妈喜欢做饭。', source: null },
      { de: 'Meine Mutter ist zu Hause.', zh: '我妈妈在家。', source: 'lesson:u0l6' },
    ],
    mnemonic: 'Mutter ≈ 英语 mother，同源好记',
  }),
  w('Eltern', 'die', null, '父母（只有复数）', 'Meine Eltern wohnen in Shanghai.', '我父母住在上海。', 'familie', {
    sentences: [
      { de: 'Meine Eltern wohnen in Shanghai.', zh: '我父母住在上海。', source: null },
    ],
    mnemonic: 'Eltern 与 alt（老的）同根，本义是"年长者"',
  }),
  w('Bruder', 'der', 'Brüder', '兄弟', 'Mein Bruder ist jünger als ich.', '我弟弟比我小。', 'familie', {
    sentences: [
      { de: 'Mein Bruder ist jünger als ich.', zh: '我弟弟比我小。', source: null },
      { de: 'Ich habe fünf Brüder.', zh: '我有五个兄弟。', source: 'lesson:u0l3' },
      { de: 'Der Bruder trinkt Wasser.', zh: '哥哥在喝水。', source: 'lesson:u0l6' },
    ],
    mnemonic: 'Bruder ≈ 英语 brother，同源好记',
  }),
  w('Schwester', 'die', 'Schwestern', '姐妹', 'Meine Schwester studiert Medizin.', '我姐姐学医。', 'familie', {
    sentences: [
      { de: 'Meine Schwester studiert Medizin.', zh: '我姐姐学医。', source: null },
    ],
    mnemonic: 'Schwester ≈ 英语 sister，同源（sch↔s 音变）',
  }),
  w('Kind', 'das', 'Kinder', '孩子', 'Das Kind spielt im Garten.', '孩子在花园里玩。', 'familie', {
    sentences: [
      { de: 'Das Kind spielt im Garten.', zh: '孩子在花园里玩。', source: null },
    ],
    mnemonic: '注意 Kind ≠ 英语 kind（友善的），拼写相似但意思不同：德语 Kind 指"孩子"',
  }),
  w('Sohn', 'der', 'Söhne', '儿子', 'Ihr Sohn ist fünf Jahre alt.', '她儿子五岁。', 'familie', {
    sentences: [
      { de: 'Ihr Sohn ist fünf Jahre alt.', zh: '她儿子五岁。', source: null },
    ],
    mnemonic: 'Sohn ≈ 英语 son，同源好记',
  }),
  w('Tochter', 'die', 'Töchter', '女儿', 'Unsere Tochter geht zur Schule.', '我们的女儿在上学。', 'familie', {
    sentences: [
      { de: 'Unsere Tochter geht zur Schule.', zh: '我们的女儿在上学。', source: null },
    ],
    mnemonic: 'Tochter ≈ 英语 daughter，同源（t↔d，ch↔gh 音变）',
  }),
  w('Mann', 'der', 'Männer', '男人；丈夫', 'Ihr Mann arbeitet viel.', '她丈夫工作很忙。', 'familie', {
    senses: [{ pos: 'n.', zh: '男人' }, { pos: 'n.', zh: '丈夫' }],
    sentences: [
      { de: 'Ihr Mann arbeitet viel.', zh: '她丈夫工作很忙。', source: null },
    ],
    mnemonic: 'Mann ≈ 英语 man，同源好记',
  }),
  w('Frau', 'die', 'Frauen', '女人；妻子；女士', 'Frau Schmidt ist Lehrerin.', '施密特女士是老师。', 'familie', {
    senses: [{ pos: 'n.', zh: '女人' }, { pos: 'n.', zh: '妻子' }, { pos: 'n.', zh: '女士（用于姓氏前）' }],
    sentences: [
      { de: 'Frau Schmidt ist Lehrerin.', zh: '施密特女士是老师。', source: null },
      { de: 'Sind Sie Frau Müller?', zh: '您是米勒女士吗？', source: 'lesson:u1l2' },
    ],
  }),
  w('Großvater', 'der', 'Großväter', '爷爷/外公', 'Mein Großvater erzählt gern Geschichten.', '我爷爷喜欢讲故事。', 'familie', {
    sentences: [
      { de: 'Mein Großvater erzählt gern Geschichten.', zh: '我爷爷喜欢讲故事。', source: null },
    ],
    mnemonic: 'Großvater = groß(大)+Vater(父亲) → 祖父',
  }),
  w('Großmutter', 'die', 'Großmütter', '奶奶/外婆', 'Meine Großmutter backt Kuchen.', '我奶奶烤蛋糕。', 'familie', {
    sentences: [
      { de: 'Meine Großmutter backt Kuchen.', zh: '我奶奶烤蛋糕。', source: null },
    ],
    mnemonic: 'Großmutter = groß(大)+Mutter(母亲) → 祖母',
  }),
  w('Leute', 'die', null, '人们（只有复数）', 'Die Leute sind freundlich.', '这里的人很友好。', 'familie', {
    sentences: [
      { de: 'Die Leute sind freundlich.', zh: '这里的人很友好。', source: null },
    ],
  }),
  w('Mensch', 'der', 'Menschen', '人', 'Er ist ein guter Mensch.', '他是个好人。', 'familie', {
    sentences: [
      { de: 'Er ist ein guter Mensch.', zh: '他是个好人。', source: null },
    ],
    mnemonic: 'Mensch 词根也用于 menschlich（人性的）、Menschheit（人类）',
  }),
  w('Baby', 'das', 'Babys', '婴儿', 'Das Baby schläft.', '宝宝在睡觉。', 'familie', {
    sentences: [
      { de: 'Das Baby schläft.', zh: '宝宝在睡觉。', source: null },
    ],
  }),

  /* 🍞 食物与饮料 */
  w('Essen', 'das', null, '食物；吃饭', 'Das Essen schmeckt gut.', '饭菜很好吃。', 'essen', {
    senses: [{ pos: 'n.', zh: '食物；饭菜' }, { pos: 'n.', zh: '吃饭（动词 essen 名词化）' }],
    sentences: [
      { de: 'Das Essen schmeckt gut.', zh: '饭菜很好吃。', source: null },
    ],
  }),
  w('Brot', 'das', 'Brote', '面包', 'Ich kaufe ein Brot.', '我买一个面包。', 'essen', {
    sentences: [
      { de: 'Ich kaufe ein Brot.', zh: '我买一个面包。', source: null },
      { de: 'Entschuldigung, wo finde ich Brot?', zh: '打扰一下，面包在哪儿？', source: 'lesson:sa-l3' },
      { de: 'Das Brot ist dort links.', zh: '面包在那边左侧。', source: 'lesson:sa-l3' },
    ],
  }),
  w('Brötchen', 'das', 'Brötchen', '小面包', 'Zum Frühstück esse ich Brötchen.', '早餐我吃小面包。', 'essen', {
    sentences: [
      { de: 'Zum Frühstück esse ich Brötchen.', zh: '早餐我吃小面包。', source: null },
    ],
    mnemonic: 'Brötchen = Brot(面包)+-chen(小称后缀) → 小面包',
  }),
  w('Wasser', 'das', null, '水', 'Ein Glas Wasser, bitte.', '请来一杯水。', 'essen', {
    sentences: [
      { de: 'Ein Glas Wasser, bitte.', zh: '请来一杯水。', source: null },
      { de: 'Das Wasser ist geradeaus.', zh: '水在直走的地方。', source: 'lesson:sa-l3' },
      { de: 'Trinken Sie viel Wasser und schlafen Sie gut.', zh: '多喝水，好好休息。', source: 'lesson:sb-l3' },
    ],
    mnemonic: 'Wasser ≈ 英语 water，同源（ss↔t 音变）',
  }),
  w('Kaffee', 'der', 'Kaffees', '咖啡', 'Ich trinke morgens Kaffee.', '我早上喝咖啡。', 'essen', {
    sentences: [
      { de: 'Ich trinke morgens Kaffee.', zh: '我早上喝咖啡。', source: null },
      { de: 'Ich hätte gern einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。', source: 'lesson:sa-l2' },
    ],
    mnemonic: 'Kaffee ≈ 英语 coffee，同源好记',
  }),
  w('Tee', 'der', 'Tees', '茶', 'Möchtest du Tee?', '你想喝茶吗？', 'essen', {
    sentences: [
      { de: 'Möchtest du Tee?', zh: '你想喝茶吗？', source: null },
      { de: 'Ich hätte gern einen Tee, bitte.', zh: '我想要一杯茶，谢谢。', source: 'lesson:sa-l2' },
    ],
    mnemonic: 'Tee ≈ 英语 tea，同源好记',
  }),
  w('Milch', 'die', null, '牛奶', 'Der Kaffee ist mit Milch.', '咖啡加了牛奶。', 'essen', {
    sentences: [
      { de: 'Der Kaffee ist mit Milch.', zh: '咖啡加了牛奶。', source: null },
      { de: 'Wo finde ich Milch?', zh: '牛奶在哪儿能找到？', source: 'lesson:sa-l3' },
    ],
    mnemonic: 'Milch ≈ 英语 milk，同源（ch↔k 音变）',
  }),
  w('Bier', 'das', 'Biere', '啤酒', 'Ein Bier, bitte!', '请来一杯啤酒！', 'essen', {
    sentences: [
      { de: 'Ein Bier, bitte!', zh: '请来一杯啤酒！', source: null },
    ],
    mnemonic: 'Bier ≈ 英语 beer，同源好记',
  }),
  w('Wein', 'der', 'Weine', '葡萄酒', 'Der Wein kommt aus Frankreich.', '这酒产自法国。', 'essen', {
    sentences: [
      { de: 'Der Wein kommt aus Frankreich.', zh: '这酒产自法国。', source: null },
      { de: 'Ich trinke gern Wein.', zh: '我喜欢喝葡萄酒。', source: 'lesson:u0l4' },
    ],
    mnemonic: 'Wein ≈ 英语 wine，同源好记',
  }),
  w('Apfel', 'der', 'Äpfel', '苹果', 'Der Apfel ist süß.', '这苹果很甜。', 'essen', {
    sentences: [
      { de: 'Der Apfel ist süß.', zh: '这苹果很甜。', source: null },
      { de: 'Zehn Äpfel, bitte!', zh: '请来十个苹果！', source: 'lesson:u0l7' },
    ],
    mnemonic: 'Apfel ≈ 英语 apple，同源好记',
  }),
  w('Ei', 'das', 'Eier', '鸡蛋', 'Ich esse zwei Eier.', '我吃两个鸡蛋。', 'essen', {
    sentences: [
      { de: 'Ich esse zwei Eier.', zh: '我吃两个鸡蛋。', source: null },
    ],
    mnemonic: 'Ei ≈ 英语 egg，同源好记',
  }),
  w('Käse', 'der', null, '奶酪', 'Brot mit Käse, bitte.', '请来面包加奶酪。', 'essen', {
    sentences: [
      { de: 'Brot mit Käse, bitte.', zh: '请来面包加奶酪。', source: null },
      { de: 'Der Käse ist lecker.', zh: '奶酪很好吃。', source: 'lesson:u0l3' },
      { de: 'Ja, der Käse ist hier rechts.', zh: '有，奶酪在这边右侧。', source: 'lesson:sa-l3' },
    ],
    mnemonic: 'Käse ≈ 英语 cheese，同源（拉丁词源 caseus）',
  }),
  w('Fleisch', 'das', null, '肉', 'Ich esse kein Fleisch.', '我不吃肉。', 'essen', {
    sentences: [
      { de: 'Ich esse kein Fleisch.', zh: '我不吃肉。', source: null },
    ],
    mnemonic: 'Fleisch ≈ 英语 flesh，同源好记',
  }),
  w('Fisch', 'der', 'Fische', '鱼', 'Der Fisch ist frisch.', '鱼很新鲜。', 'essen', {
    sentences: [
      { de: 'Der Fisch ist frisch.', zh: '鱼很新鲜。', source: null },
    ],
    mnemonic: 'Fisch ≈ 英语 fish，同源（sch↔sh）',
  }),
  w('Reis', 'der', null, '米饭', 'Wir essen oft Reis.', '我们常吃米饭。', 'essen', {
    sentences: [
      { de: 'Wir essen oft Reis.', zh: '我们常吃米饭。', source: null },
    ],
    mnemonic: 'Reis ≈ 英语 rice，同源好记',
  }),
  w('Gemüse', 'das', null, '蔬菜', 'Gemüse ist gesund.', '蔬菜很健康。', 'essen', {
    sentences: [
      { de: 'Gemüse ist gesund.', zh: '蔬菜很健康。', source: null },
    ],
    mnemonic: 'Gemüse = Ge-(集合前缀)+Mus(酱糊) → 蔬菜类食物',
  }),
  w('Obst', 'das', null, '水果', 'Ich kaufe Obst auf dem Markt.', '我在市场买水果。', 'essen', {
    sentences: [
      { de: 'Ich kaufe Obst auf dem Markt.', zh: '我在市场买水果。', source: null },
    ],
  }),
  w('Frühstück', 'das', null, '早餐', 'Was isst du zum Frühstück?', '你早餐吃什么？', 'essen', {
    sentences: [
      { de: 'Was isst du zum Frühstück?', zh: '你早餐吃什么？', source: null },
    ],
    mnemonic: 'Frühstück = früh(早)+Stück(一份) → 早上的一份，即早餐',
  }),
  w('Mittagessen', 'das', null, '午餐', 'Das Mittagessen ist fertig.', '午饭好了。', 'essen', {
    sentences: [
      { de: 'Das Mittagessen ist fertig.', zh: '午饭好了。', source: null },
    ],
    mnemonic: 'Mittagessen = Mittag(中午)+Essen(吃饭) → 午餐',
  }),
  w('Abendessen', 'das', null, '晚餐', 'Zum Abendessen gibt es Suppe.', '晚餐有汤。', 'essen', {
    sentences: [
      { de: 'Zum Abendessen gibt es Suppe.', zh: '晚餐有汤。', source: null },
    ],
    mnemonic: 'Abendessen = Abend(晚上)+Essen(吃饭) → 晚餐',
  }),
  w('Restaurant', 'das', 'Restaurants', '餐馆', 'Wir gehen ins Restaurant.', '我们去餐馆。', 'essen', {
    sentences: [
      { de: 'Wir gehen ins Restaurant.', zh: '我们去餐馆。', source: null },
    ],
    mnemonic: 'Restaurant ≈ 英语 restaurant，同源（法语借词）',
  }),
  w('Speisekarte', 'die', 'Speisekarten', '菜单', 'Die Speisekarte, bitte!', '请给我菜单！', 'essen', {
    sentences: [
      { de: 'Die Speisekarte, bitte!', zh: '请给我菜单！', source: null },
    ],
    mnemonic: 'Speisekarte = Speise(食物/菜肴)+Karte(单子) → 菜单',
  }),
  w('Rechnung', 'die', 'Rechnungen', '账单', 'Die Rechnung, bitte!', '请结账！', 'essen', {
    sentences: [
      { de: 'Die Rechnung, bitte!', zh: '请结账！', source: null },
    ],
    mnemonic: 'Rechnung 来自动词 rechnen（计算）→ 账单',
  }),
  w('lecker', null, null, '美味的', 'Das ist sehr lecker!', '这个非常好吃！', 'essen', {
    sentences: [
      { de: 'Das ist sehr lecker!', zh: '这个非常好吃！', source: null },
      { de: 'Der Käse ist lecker.', zh: '奶酪很好吃。', source: 'lesson:u0l3' },
    ],
  }),
  w('Hunger', 'der', null, '饥饿', 'Ich habe Hunger.', '我饿了。', 'essen', {
    sentences: [
      { de: 'Ich habe Hunger.', zh: '我饿了。', source: null },
    ],
    mnemonic: 'Hunger ≈ 英语 hunger，同源好记',
  }),
  w('Durst', 'der', null, '口渴', 'Hast du Durst?', '你渴吗？', 'essen', {
    sentences: [
      { de: 'Hast du Durst?', zh: '你渴吗？', source: null },
    ],
    mnemonic: 'Durst ≈ 英语 thirst，同源（d↔th 音变）',
  }),

  /* 🏃 高频动词 I */
  w('machen', null, null, '做', 'Was machst du?', '你在做什么？', 'verb1', {
    sentences: [
      { de: 'Was machst du?', zh: '你在做什么？', source: null },
      { de: 'Das macht sechs Euro.', zh: '一共六欧元。', source: 'lesson:sa-l2' },
    ],
  }),
  w('gehen', null, null, '走；去', 'Ich gehe nach Hause.', '我回家。', 'verb1', {
    sentences: [
      { de: 'Ich gehe nach Hause.', zh: '我回家。', source: null },
      { de: 'Gehen Sie hier geradeaus und dann links.', zh: '您这里直走，然后往左拐。', source: 'lesson:sb-l1' },
    ],
  }),
  w('essen', null, null, '吃（er isst）', 'Er isst einen Apfel.', '他在吃苹果。', 'verb1', {
    sentences: [
      { de: 'Er isst einen Apfel.', zh: '他在吃苹果。', source: null },
      { de: 'Ich esse zwei Eier.', zh: '我吃两个鸡蛋。', source: null },
      { de: 'Ich esse kein Fleisch.', zh: '我不吃肉。', source: null },
    ],
  }),
  w('trinken', null, null, '喝', 'Wir trinken Tee.', '我们喝茶。', 'verb1', {
    sentences: [
      { de: 'Wir trinken Tee.', zh: '我们喝茶。', source: null },
      { de: 'Mein Vater trinkt gern Wasser.', zh: '我爸爸喜欢喝水。', source: 'lesson:u0l7' },
      { de: 'Trinken Sie viel Wasser und schlafen Sie gut.', zh: '多喝水，好好休息。', source: 'lesson:sb-l3' },
    ],
  }),
  w('sehen', null, null, '看（er sieht）', 'Siehst du das Haus?', '你看见那房子了吗？', 'verb1', {
    sentences: [
      { de: 'Siehst du das Haus?', zh: '你看见那房子了吗？', source: null },
    ],
    mnemonic: 'sehen ≈ 英语 see，同源好记',
  }),
  w('hören', null, null, '听', 'Ich höre Musik.', '我在听音乐。', 'verb1', {
    sentences: [
      { de: 'Ich höre Musik.', zh: '我在听音乐。', source: null },
    ],
    mnemonic: 'hören ≈ 英语 hear，同源好记',
  }),
  w('lesen', null, null, '读（er liest）', 'Sie liest eine Zeitung.', '她在读报纸。', 'verb1', {
    sentences: [
      { de: 'Sie liest eine Zeitung.', zh: '她在读报纸。', source: null },
      { de: 'Am Abend lese ich.', zh: '晚上我看书。', source: null },
    ],
  }),
  w('schreiben', null, null, '写', 'Ich schreibe eine E-Mail.', '我在写邮件。', 'verb1', {
    sentences: [
      { de: 'Ich schreibe eine E-Mail.', zh: '我在写邮件。', source: null },
      { de: 'Ich schreibe oft E-Mails.', zh: '我经常写邮件。', source: null },
    ],
    mnemonic: 'schreiben ≈ 英语 script/scribe，同源（拉丁词根 scribere）',
  }),
  w('kaufen', null, null, '买', 'Er kauft ein Auto.', '他买了一辆车。', 'verb1', {
    sentences: [
      { de: 'Er kauft ein Auto.', zh: '他买了一辆车。', source: null },
      { de: 'Ich kaufe ein Brot.', zh: '我买一个面包。', source: null },
      { de: 'Ich kaufe Obst auf dem Markt.', zh: '我在市场买水果。', source: null },
    ],
  }),
  w('lernen', null, null, '学习', 'Wir lernen zusammen Deutsch.', '我们一起学德语。', 'verb1', {
    sentences: [
      { de: 'Wir lernen zusammen Deutsch.', zh: '我们一起学德语。', source: null },
      { de: 'Wir lernen Deutsch.', zh: '我们在学德语。', source: 'lesson:u1l1' },
    ],
    mnemonic: 'lernen ≈ 英语 learn，同源好记',
  }),
  w('arbeiten', null, null, '工作', 'Sie arbeitet in einem Büro.', '她在办公室工作。', 'verb1', {
    sentences: [
      { de: 'Sie arbeitet in einem Büro.', zh: '她在办公室工作。', source: null },
      { de: 'Am Montag arbeite ich.', zh: '周一我上班。', source: null },
    ],
  }),
  w('spielen', null, null, '玩；演奏', 'Die Kinder spielen Fußball.', '孩子们在踢足球。', 'verb1', {
    sentences: [
      { de: 'Die Kinder spielen Fußball.', zh: '孩子们在踢足球。', source: null },
      { de: 'Die Kinder spielen im Garten.', zh: '孩子们在花园玩。', source: null },
    ],
    mnemonic: '英语借用了德语词 Spiel（游戏），spielen 就是"玩/做游戏"',
  }),
  w('schlafen', null, null, '睡觉（er schläft）', 'Das Baby schläft gut.', '宝宝睡得香。', 'verb1', {
    sentences: [
      { de: 'Das Baby schläft gut.', zh: '宝宝睡得香。', source: null },
      { de: 'In der Nacht schlafe ich.', zh: '夜里我睡觉。', source: null },
    ],
  }),
  w('fahren', null, null, '乘（车）；驾驶（er fährt）', 'Ich fahre mit dem Fahrrad.', '我骑自行车去。', 'verb1', {
    sentences: [
      { de: 'Ich fahre mit dem Fahrrad.', zh: '我骑自行车去。', source: null },
      { de: 'Der Bus fährt direkt zum Bahnhof.', zh: '这趟车直达火车站。', source: 'lesson:sb-l1' },
    ],
    mnemonic: 'fahren 与英语 fare（如 thoroughfare）同源，本义"行进/乘坐"',
  }),
  w('kochen', null, null, '做饭', 'Mein Vater kocht heute.', '今天我爸爸做饭。', 'verb1', {
    sentences: [
      { de: 'Mein Vater kocht heute.', zh: '今天我爸爸做饭。', source: null },
      { de: 'Die Mutter kocht gut.', zh: '妈妈做饭做得好。', source: 'lesson:u0l2' },
    ],
    mnemonic: 'kochen ≈ 英语 cook，同源（拉丁词源 coquere）',
  }),
  w('wissen', null, null, '知道（ich weiß）', 'Ich weiß es nicht.', '我不知道。', 'verb1', {
    sentences: [
      { de: 'Ich weiß es nicht.', zh: '我不知道。', source: null },
    ],
    mnemonic: 'wissen 与英语 wit/wisdom 同源，本义"知道"',
  }),

  /* ✍️ 高频动词 II */
  w('geben', null, null, '给（er gibt）', 'Gibst du mir das Buch?', '你把书给我好吗？', 'verb2', {
    sentences: [
      { de: 'Gibst du mir das Buch?', zh: '你把书给我好吗？', source: null },
    ],
    mnemonic: 'geben ≈ 英语 give，同源好记',
  }),
  w('nehmen', null, null, '拿；取（er nimmt）', 'Ich nehme den Bus.', '我坐公交。', 'verb2', {
    sentences: [
      { de: 'Ich nehme den Bus.', zh: '我坐公交。', source: null },
      { de: 'Nehmen Sie es zweimal am Tag.', zh: '请每天服用两次。', source: 'lesson:sb-l3' },
    ],
  }),
  w('finden', null, null, '找到；觉得', 'Ich finde Deutsch interessant.', '我觉得德语有意思。', 'verb2', {
    senses: [{ pos: 'v.', zh: '觉得（表达看法）' }, { pos: 'v.', zh: '找到' }],
    sentences: [
      { de: 'Ich finde Deutsch interessant.', zh: '我觉得德语有意思。', source: null },
      { de: 'Wo finde ich Brot?', zh: '面包在哪儿能找到？', source: 'lesson:sa-l3' },
    ],
  }),
  w('helfen', null, null, '帮助（+三格）', 'Kannst du mir helfen?', '你能帮我吗？', 'verb2', {
    valence: 'helfen + Dativ：jemandem helfen',
    sentences: [
      { de: 'Kannst du mir helfen?', zh: '你能帮我吗？', source: null },
      { de: 'Ich helfe meiner Mutter in der Küche.', zh: '我在厨房里帮我妈妈。', source: null },
    ],
  }),
  w('fragen', null, null, '问', 'Darf ich etwas fragen?', '我能问个问题吗？', 'verb2', {
    sentences: [
      { de: 'Darf ich etwas fragen?', zh: '我能问个问题吗？', source: null },
    ],
  }),
  w('antworten', null, null, '回答', 'Er antwortet nicht.', '他不回答。', 'verb2', {
    sentences: [
      { de: 'Er antwortet nicht.', zh: '他不回答。', source: null },
    ],
    mnemonic: 'antworten 由 Antwort（回答）而来，字面有"对着话回应"的意思',
  }),
  w('verstehen', null, null, '理解', 'Ich verstehe das nicht.', '我不明白。', 'verb2', {
    sentences: [
      { de: 'Ich verstehe das nicht.', zh: '我不明白。', source: null },
      { de: 'Wie bitte? Ich verstehe das nicht.', zh: '请再说一遍？我没听懂。', source: 'lesson:u0l4' },
    ],
    mnemonic: 'verstehen = ver-(不可分前缀)+stehen(站) → 理解',
  }),
  w('brauchen', null, null, '需要', 'Ich brauche Hilfe.', '我需要帮助。', 'verb2', {
    sentences: [
      { de: 'Ich brauche Hilfe.', zh: '我需要帮助。', source: null },
    ],
  }),
  w('suchen', null, null, '寻找', 'Ich suche meinen Schlüssel.', '我在找钥匙。', 'verb2', {
    sentences: [
      { de: 'Ich suche meinen Schlüssel.', zh: '我在找钥匙。', source: null },
    ],
    mnemonic: 'suchen ≈ 英语 seek，同源（ch↔k 音变）',
  }),
  w('bezahlen', null, null, '付款', 'Ich möchte bezahlen.', '我要买单。', 'verb2', {
    sentences: [
      { de: 'Ich möchte bezahlen.', zh: '我要买单。', source: null },
    ],
    mnemonic: 'bezahlen = be-(动词前缀)+zahlen(付钱) → 付清钱款',
  }),
  w('kosten', null, null, '值…钱', 'Was kostet das?', '这个多少钱？', 'verb2', {
    sentences: [
      { de: 'Was kostet das?', zh: '这个多少钱？', source: null },
      { de: 'Was kostet der Kuchen?', zh: '蛋糕多少钱？', source: 'lesson:sa-l2' },
      { de: 'Das kostet fünf Euro.', zh: '五欧元。', source: 'lesson:sb-l3' },
    ],
    mnemonic: 'kosten ≈ 英语 cost，同源好记',
  }),
  w('aufstehen', null, null, '起床（可分）', 'Ich stehe um sieben auf.', '我七点起床。', 'verb2', {
    sentences: [
      { de: 'Ich stehe um sieben auf.', zh: '我七点起床。', source: null },
    ],
    mnemonic: 'aufstehen = auf(向上)+stehen(站) → 起床',
  }),
  w('einkaufen', null, null, '购物（可分）', 'Wir kaufen im Supermarkt ein.', '我们在超市购物。', 'verb2', {
    sentences: [
      { de: 'Wir kaufen im Supermarkt ein.', zh: '我们在超市购物。', source: null },
    ],
    mnemonic: 'einkaufen = ein-(可分前缀)+kaufen(买) → 去买东西，购物',
  }),
  w('anrufen', null, null, '打电话（可分）', 'Ruf mich an!', '给我打电话！', 'verb2', {
    sentences: [
      { de: 'Ruf mich an!', zh: '给我打电话！', source: null },
    ],
    mnemonic: 'anrufen = an-(可分前缀，"朝着")+rufen(喊) → 打电话',
  }),
  w('fernsehen', null, null, '看电视（可分）', 'Abends sehe ich fern.', '晚上我看电视。', 'verb2', {
    sentences: [
      { de: 'Abends sehe ich fern.', zh: '晚上我看电视。', source: null },
    ],
    mnemonic: 'fernsehen = fern(远的)+sehen(看) → 看电视，字面"远距离看"',
  }),
  w('mitkommen', null, null, '一起来（可分）', 'Kommst du mit?', '你一起来吗？', 'verb2', {
    sentences: [
      { de: 'Kommst du mit?', zh: '你一起来吗？', source: null },
    ],
    mnemonic: 'mitkommen = mit-(可分前缀，"一起")+kommen(来) → 一起来',
  }),

  /* 🏠 居住与家 */
  w('Haus', 'das', 'Häuser', '房子', 'Das Haus hat einen Garten.', '这房子有个花园。', 'wohnen', {
    sentences: [
      { de: 'Das Haus hat einen Garten.', zh: '这房子有个花园。', source: null },
      { de: 'Meine Mutter ist zu Hause.', zh: '我妈妈在家。', source: 'lesson:u0l6' },
    ],
    mnemonic: 'Haus ≈ 英语 house，同源好记',
  }),
  w('Wohnung', 'die', 'Wohnungen', '住宅；公寓', 'Die Wohnung ist hell.', '这套公寓很明亮。', 'wohnen', {
    sentences: [
      { de: 'Die Wohnung ist hell.', zh: '这套公寓很明亮。', source: null },
    ],
    mnemonic: 'Wohnung 来自动词 wohnen（居住）→ 住所/公寓',
  }),
  w('Zimmer', 'das', 'Zimmer', '房间', 'Mein Zimmer ist klein.', '我的房间很小。', 'wohnen', {
    sentences: [
      { de: 'Mein Zimmer ist klein.', zh: '我的房间很小。', source: null },
    ],
  }),
  w('Küche', 'die', 'Küchen', '厨房', 'Die Küche ist modern.', '厨房很现代。', 'wohnen', {
    sentences: [
      { de: 'Die Küche ist modern.', zh: '厨房很现代。', source: null },
    ],
    mnemonic: 'Küche ≈ 英语 kitchen，同源好记',
  }),
  w('Bad', 'das', 'Bäder', '浴室', 'Das Bad ist links.', '浴室在左边。', 'wohnen', {
    sentences: [
      { de: 'Das Bad ist links.', zh: '浴室在左边。', source: null },
    ],
    mnemonic: 'Bad ≈ 英语 bath，同源好记',
  }),
  w('Tisch', 'der', 'Tische', '桌子', 'Das Buch liegt auf dem Tisch.', '书在桌上。', 'wohnen', {
    sentences: [
      { de: 'Das Buch liegt auf dem Tisch.', zh: '书在桌上。', source: null },
    ],
  }),
  w('Stuhl', 'der', 'Stühle', '椅子', 'Der Stuhl ist bequem.', '这椅子很舒服。', 'wohnen', {
    sentences: [
      { de: 'Der Stuhl ist bequem.', zh: '这椅子很舒服。', source: null },
    ],
    mnemonic: 'Stuhl ≈ 英语 stool，同源好记',
  }),
  w('Bett', 'das', 'Betten', '床', 'Ich gehe ins Bett.', '我去睡觉了。', 'wohnen', {
    sentences: [
      { de: 'Ich gehe ins Bett.', zh: '我去睡觉了。', source: null },
    ],
    mnemonic: 'Bett ≈ 英语 bed，同源好记',
  }),
  w('Lampe', 'die', 'Lampen', '灯', 'Die Lampe ist an.', '灯开着。', 'wohnen', {
    sentences: [
      { de: 'Die Lampe ist an.', zh: '灯开着。', source: null },
    ],
    mnemonic: 'Lampe ≈ 英语 lamp，同源好记',
  }),
  w('Fenster', 'das', 'Fenster', '窗户', 'Mach bitte das Fenster auf!', '请把窗户打开！', 'wohnen', {
    sentences: [
      { de: 'Mach bitte das Fenster auf!', zh: '请把窗户打开！', source: null },
    ],
    mnemonic: 'Fenster 源自拉丁语 fenestra，和英语 window 没有关系，别混着记',
  }),
  w('Tür', 'die', 'Türen', '门', 'Die Tür ist zu.', '门关着。', 'wohnen', {
    sentences: [
      { de: 'Die Tür ist zu.', zh: '门关着。', source: null },
    ],
    mnemonic: 'Tür ≈ 英语 door，同源（t↔d 音变）',
  }),
  w('Schlüssel', 'der', 'Schlüssel', '钥匙', 'Wo ist mein Schlüssel?', '我的钥匙在哪？', 'wohnen', {
    sentences: [
      { de: 'Wo ist mein Schlüssel?', zh: '我的钥匙在哪？', source: null },
      { de: 'Willkommen! Hier ist Ihr Schlüssel.', zh: '欢迎！这是您的钥匙。', source: 'lesson:sa-l1' },
    ],
    mnemonic: 'Schlüssel 来自动词 schließen（关/锁）→ 用来锁的工具，即钥匙',
  }),
  w('Garten', 'der', 'Gärten', '花园', 'Die Kinder spielen im Garten.', '孩子们在花园玩。', 'wohnen', {
    sentences: [
      { de: 'Die Kinder spielen im Garten.', zh: '孩子们在花园玩。', source: null },
      { de: 'Das Kind spielt im Garten.', zh: '孩子在花园里玩。', source: null },
    ],
    mnemonic: 'Garten ≈ 英语 garden，同源好记',
  }),
  w('Miete', 'die', 'Mieten', '房租', 'Die Miete ist hoch.', '房租很贵。', 'wohnen', {
    sentences: [
      { de: 'Die Miete ist hoch.', zh: '房租很贵。', source: null },
    ],
    mnemonic: '注意区分 Miete（房租，长音 ie）和 Mitte（中间，短音 tt）',
  }),

  /* 🚌 城市与交通 */
  w('Stadt', 'die', 'Städte', '城市', 'Berlin ist eine große Stadt.', '柏林是座大城市。', 'stadt', {
    sentences: [
      { de: 'Berlin ist eine große Stadt.', zh: '柏林是座大城市。', source: null },
      { de: 'Ich wohne in der Stadt.', zh: '我住在城市里。', source: 'lesson:u0l2' },
      { de: 'Die Stadt ist schön.', zh: '这座城市很美。', source: 'lesson:u0l3' },
    ],
  }),
  w('Straße', 'die', 'Straßen', '街道', 'Ich wohne in der Hauptstraße.', '我住在主街。', 'stadt', {
    sentences: [
      { de: 'Ich wohne in der Hauptstraße.', zh: '我住在主街。', source: null },
    ],
    mnemonic: 'Straße ≈ 英语 street，同源（拉丁词源 strata）',
  }),
  w('Bahnhof', 'der', 'Bahnhöfe', '火车站', 'Der Bahnhof ist weit.', '火车站很远。', 'stadt', {
    sentences: [
      { de: 'Der Bahnhof ist weit.', zh: '火车站很远。', source: null },
      { de: 'Wie komme ich zum Bahnhof?', zh: '我怎么去火车站？', source: 'lesson:sb-l1' },
      { de: 'Der Bus fährt direkt zum Bahnhof.', zh: '这趟车直达火车站。', source: 'lesson:sb-l1' },
    ],
    mnemonic: 'Bahnhof = Bahn(轨道/铁路)+Hof(场地) → 火车站',
  }),
  w('Zug', 'der', 'Züge', '火车', 'Der Zug fährt um acht.', '火车八点开。', 'stadt', {
    sentences: [
      { de: 'Der Zug fährt um acht.', zh: '火车八点开。', source: null },
    ],
    mnemonic: 'Zug 来自动词 ziehen（拉/牵引）→ "被牵引的东西"，即火车',
  }),
  w('Bus', 'der', 'Busse', '公交车', 'Ich nehme den Bus.', '我坐公交。', 'stadt', {
    sentences: [
      { de: 'Ich nehme den Bus.', zh: '我坐公交。', source: null },
      { de: 'Welcher Bus fährt zum Bahnhof?', zh: '哪路车到火车站？', source: 'lesson:sb-l1' },
    ],
    mnemonic: 'Bus ≈ 英语 bus，同源（国际借词）',
  }),
  w('U-Bahn', 'die', 'U-Bahnen', '地铁', 'Die U-Bahn kommt gleich.', '地铁马上来。', 'stadt', {
    sentences: [
      { de: 'Die U-Bahn kommt gleich.', zh: '地铁马上来。', source: null },
    ],
    mnemonic: 'U-Bahn = U(untergrund，地下)+Bahn(轨道) → 地铁',
  }),
  w('Auto', 'das', 'Autos', '汽车', 'Das Auto ist neu.', '这辆车是新的。', 'stadt', {
    sentences: [
      { de: 'Das Auto ist neu.', zh: '这辆车是新的。', source: null },
    ],
    mnemonic: 'Auto ≈ 英语 auto(mobile)，国际通用词',
  }),
  w('Fahrrad', 'das', 'Fahrräder', '自行车', 'Ich fahre gern Fahrrad.', '我喜欢骑车。', 'stadt', {
    sentences: [
      { de: 'Ich fahre gern Fahrrad.', zh: '我喜欢骑车。', source: null },
    ],
    mnemonic: 'Fahrrad = fahren(骑/驾驶)+Rad(轮子) → 自行车',
  }),
  w('Flughafen', 'der', 'Flughäfen', '机场', 'Wir fahren zum Flughafen.', '我们去机场。', 'stadt', {
    sentences: [
      { de: 'Wir fahren zum Flughafen.', zh: '我们去机场。', source: null },
    ],
    mnemonic: 'Flughafen = Flug(飞行，来自 fliegen)+Hafen(港口) → 机场',
  }),
  w('Supermarkt', 'der', 'Supermärkte', '超市', 'Der Supermarkt ist um die Ecke.', '超市就在拐角。', 'stadt', {
    sentences: [
      { de: 'Der Supermarkt ist um die Ecke.', zh: '超市就在拐角。', source: null },
    ],
    mnemonic: 'Supermarkt = super(超级)+Markt(市场)，构词和英语 supermarket 一致',
  }),
  w('Geschäft', 'das', 'Geschäfte', '商店', 'Das Geschäft öffnet um neun.', '商店九点开门。', 'stadt', {
    sentences: [
      { de: 'Das Geschäft öffnet um neun.', zh: '商店九点开门。', source: null },
    ],
  }),
  w('Bank', 'die', 'Banken', '银行', 'Die Bank ist heute geschlossen.', '银行今天关门。', 'stadt', {
    sentences: [
      { de: 'Die Bank ist heute geschlossen.', zh: '银行今天关门。', source: null },
    ],
    mnemonic: 'Bank ≈ 英语 bank，同源好记',
  }),
  w('Post', 'die', null, '邮局', 'Wo ist die Post?', '邮局在哪？', 'stadt', {
    sentences: [
      { de: 'Wo ist die Post?', zh: '邮局在哪？', source: null },
    ],
    mnemonic: 'Post ≈ 英语 post(office)，国际借词',
  }),
  w('Park', 'der', 'Parks', '公园', 'Wir gehen in den Park.', '我们去公园。', 'stadt', {
    sentences: [
      { de: 'Wir gehen in den Park.', zh: '我们去公园。', source: null },
    ],
    mnemonic: 'Park ≈ 英语 park，同源好记',
  }),
  w('Ticket', 'das', 'Tickets', '票', 'Ein Ticket nach München, bitte.', '请来一张去慕尼黑的票。', 'stadt', {
    sentences: [
      { de: 'Ein Ticket nach München, bitte.', zh: '请来一张去慕尼黑的票。', source: null },
      { de: 'Ein Ticket zum Bahnhof, bitte.', zh: '请给我一张到火车站的票。', source: 'lesson:sb-l1' },
    ],
    mnemonic: 'Ticket ≈ 英语 ticket，直接借词',
  }),
  w('links', null, null, '左边', 'Das Café ist links.', '咖啡馆在左边。', 'stadt', {
    sentences: [
      { de: 'Das Café ist links.', zh: '咖啡馆在左边。', source: null },
      { de: 'Gehen Sie hier geradeaus und dann links.', zh: '您这里直走，然后往左拐。', source: 'lesson:sb-l1' },
      { de: 'Das Brot ist dort links.', zh: '面包在那边左侧。', source: 'lesson:sa-l3' },
    ],
  }),
  w('rechts', null, null, '右边', 'Gehen Sie rechts!', '请往右走！', 'stadt', {
    sentences: [
      { de: 'Gehen Sie rechts!', zh: '请往右走！', source: null },
      { de: 'Ja, der Käse ist hier rechts.', zh: '有，奶酪在这边右侧。', source: 'lesson:sa-l3' },
    ],
  }),
  w('geradeaus', null, null, '直走', 'Immer geradeaus!', '一直直走！', 'stadt', {
    sentences: [
      { de: 'Immer geradeaus!', zh: '一直直走！', source: null },
      { de: 'Das Wasser ist geradeaus.', zh: '水在直走的地方。', source: 'lesson:sa-l3' },
    ],
  }),

  /* 💼 工作与学习 */
  w('Arbeit', 'die', null, '工作', 'Ich gehe zur Arbeit.', '我去上班。', 'arbeit', {
    sentences: [
      { de: 'Ich gehe zur Arbeit.', zh: '我去上班。', source: null },
    ],
  }),
  w('Beruf', 'der', 'Berufe', '职业', 'Was sind Sie von Beruf?', '您做什么工作？', 'arbeit', {
    sentences: [
      { de: 'Was sind Sie von Beruf?', zh: '您做什么工作？', source: null },
    ],
    mnemonic: 'Beruf 来自动词 rufen（喊/召唤）→ 被"召唤"去做的事，即职业',
  }),
  w('Lehrer', 'der', 'Lehrer', '老师（男）', 'Der Lehrer erklärt die Grammatik.', '老师在讲语法。', 'arbeit', {
    sentences: [
      { de: 'Der Lehrer erklärt die Grammatik.', zh: '老师在讲语法。', source: null },
      { de: 'Sie sind Lehrer.', zh: '他们是老师。', source: 'lesson:u1l3' },
    ],
  }),
  w('Lehrerin', 'die', 'Lehrerinnen', '老师（女）', 'Meine Lehrerin kommt aus Wien.', '我的老师来自维也纳。', 'arbeit', {
    sentences: [
      { de: 'Meine Lehrerin kommt aus Wien.', zh: '我的老师来自维也纳。', source: null },
      { de: 'Sie ist meine Lehrerin.', zh: '她是我的老师。', source: 'lesson:u1l2' },
    ],
  }),
  w('Arzt', 'der', 'Ärzte', '医生（男）', 'Ich muss zum Arzt.', '我得去看医生。', 'arbeit', {
    sentences: [
      { de: 'Ich muss zum Arzt.', zh: '我得去看医生。', source: null },
      { de: 'Einen Moment, bitte. Der Arzt kommt gleich.', zh: '请稍等，医生马上就来。', source: 'lesson:sb-l3' },
    ],
  }),
  w('Ärztin', 'die', 'Ärztinnen', '医生（女）', 'Die Ärztin ist sehr nett.', '这位医生很和气。', 'arbeit', {
    sentences: [
      { de: 'Die Ärztin ist sehr nett.', zh: '这位医生很和气。', source: null },
    ],
  }),
  w('Student', 'der', 'Studenten', '大学生（男）', 'Er ist Student in Berlin.', '他在柏林上大学。', 'arbeit', {
    sentences: [
      { de: 'Er ist Student in Berlin.', zh: '他在柏林上大学。', source: null },
      { de: 'Ich bin auch Student.', zh: '我也是大学生。', source: 'lesson:u1l1' },
    ],
  }),
  w('Studentin', 'die', 'Studentinnen', '大学生（女）', 'Sie ist Studentin.', '她是大学生。', 'arbeit', {
    sentences: [
      { de: 'Sie ist Studentin.', zh: '她是大学生。', source: null },
      { de: 'Ja, ich bin Studentin. Und du?', zh: '是的，我是大学生。你呢？', source: 'lesson:u1l1' },
    ],
  }),
  w('Schule', 'die', 'Schulen', '学校', 'Die Kinder gehen zur Schule.', '孩子们去上学。', 'arbeit', {
    sentences: [
      { de: 'Die Kinder gehen zur Schule.', zh: '孩子们去上学。', source: null },
    ],
    mnemonic: 'Schule ≈ 英语 school，同源（拉丁词源 schola）',
  }),
  w('Universität', 'die', 'Universitäten', '大学', 'Die Universität ist berühmt.', '这所大学很有名。', 'arbeit', {
    sentences: [
      { de: 'Die Universität ist berühmt.', zh: '这所大学很有名。', source: null },
      { de: 'Willkommen an der Universität, Frau Wang!', zh: '欢迎来到大学，王女士！', source: 'lesson:sb-l2' },
    ],
    mnemonic: 'Universität ≈ 英语 university，同源',
  }),
  w('Kurs', 'der', 'Kurse', '课程', 'Der Deutschkurs macht Spaß.', '德语课很有趣。', 'arbeit', {
    sentences: [
      { de: 'Der Deutschkurs macht Spaß.', zh: '德语课很有趣。', source: null },
      { de: 'Danke schön! Wo ist Raum 205? Ich habe dort einen Kurs.', zh: '非常感谢！205教室在哪？我在那里有节课。', source: 'lesson:sb-l2' },
    ],
  }),
  w('Büro', 'das', 'Büros', '办公室', 'Er arbeitet im Büro.', '他在办公室工作。', 'arbeit', {
    sentences: [
      { de: 'Er arbeitet im Büro.', zh: '他在办公室工作。', source: null },
    ],
    mnemonic: 'Büro ≈ 英语 bureau，同源（法语借词）',
  }),
  w('Firma', 'die', 'Firmen', '公司', 'Die Firma ist groß.', '这家公司很大。', 'arbeit', {
    sentences: [
      { de: 'Die Firma ist groß.', zh: '这家公司很大。', source: null },
    ],
    mnemonic: 'Firma ≈ 英语 firm，同源',
  }),
  w('Computer', 'der', 'Computer', '电脑', 'Der Computer ist kaputt.', '电脑坏了。', 'arbeit', {
    sentences: [
      { de: 'Der Computer ist kaputt.', zh: '电脑坏了。', source: null },
    ],
  }),
  w('Handy', 'das', 'Handys', '手机', 'Mein Handy ist neu.', '我的手机是新的。', 'arbeit', {
    sentences: [
      { de: 'Mein Handy ist neu.', zh: '我的手机是新的。', source: null },
    ],
    mnemonic: 'Handy 是德语自造词，看着像英语，其实英语手机不叫 handy（该说 mobile phone）',
  }),
  w('E-Mail', 'die', 'E-Mails', '电子邮件', 'Ich schreibe dir eine E-Mail.', '我给你写邮件。', 'arbeit', {
    sentences: [
      { de: 'Ich schreibe dir eine E-Mail.', zh: '我给你写邮件。', source: null },
    ],
  }),
  w('Buch', 'das', 'Bücher', '书', 'Das Buch ist spannend.', '这本书很精彩。', 'arbeit', {
    sentences: [
      { de: 'Das Buch ist spannend.', zh: '这本书很精彩。', source: null },
    ],
    mnemonic: 'Buch ≈ 英语 book，同源好记',
  }),
  w('Geld', 'das', null, '钱', 'Ich habe kein Geld dabei.', '我没带钱。', 'arbeit', {
    sentences: [
      { de: 'Ich habe kein Geld dabei.', zh: '我没带钱。', source: null },
    ],
    mnemonic: '注意 Geld（钱）≠ Gold（金子），拼写相近但意思不同',
  }),

  /* 🧑‍⚕️ 身体与健康 */
  w('Kopf', 'der', 'Köpfe', '头', 'Mein Kopf tut weh.', '我头疼。', 'koerper', {
    sentences: [
      { de: 'Mein Kopf tut weh.', zh: '我头疼。', source: null },
      { de: 'Mein Kopf tut weh und ich habe Fieber.', zh: '我头疼，还发烧。', source: 'lesson:sb-l3' },
    ],
  }),
  w('Auge', 'das', 'Augen', '眼睛', 'Sie hat blaue Augen.', '她有蓝色的眼睛。', 'koerper', {
    sentences: [
      { de: 'Sie hat blaue Augen.', zh: '她有蓝色的眼睛。', source: null },
    ],
  }),
  w('Hand', 'die', 'Hände', '手', 'Wasch dir die Hände!', '把手洗了！', 'koerper', {
    sentences: [
      { de: 'Wasch dir die Hände!', zh: '把手洗了！', source: null },
    ],
    mnemonic: 'Hand ≈ 英语 hand，同源好记',
  }),
  w('Fuß', 'der', 'Füße', '脚', 'Ich gehe zu Fuß.', '我步行去。', 'koerper', {
    sentences: [
      { de: 'Ich gehe zu Fuß.', zh: '我步行去。', source: null },
      { de: 'Nein, das ist nicht weit. Zu Fuß sind es zehn Minuten.', zh: '不远，走路十分钟。', source: 'lesson:sb-l1' },
    ],
  }),
  w('Bauch', 'der', 'Bäuche', '肚子', 'Mein Bauch tut weh.', '我肚子疼。', 'koerper', {
    sentences: [
      { de: 'Mein Bauch tut weh.', zh: '我肚子疼。', source: null },
    ],
  }),
  w('Zahn', 'der', 'Zähne', '牙齿', 'Der Zahn tut weh.', '牙疼。', 'koerper', {
    sentences: [
      { de: 'Der Zahn tut weh.', zh: '牙疼。', source: null },
    ],
    mnemonic: 'Zahn ≈ 英语 tooth，同源（辅音 z↔t 音变，同 zehn≈ten）',
  }),
  w('krank', null, null, '生病的', 'Ich bin heute krank.', '我今天病了。', 'koerper', {
    sentences: [
      { de: 'Ich bin heute krank.', zh: '我今天病了。', source: null },
    ],
  }),
  w('gesund', null, null, '健康的', 'Obst ist gesund.', '水果有益健康。', 'koerper', {
    sentences: [
      { de: 'Obst ist gesund.', zh: '水果有益健康。', source: null },
    ],
  }),
  w('müde', null, null, '疲惫的', 'Ich bin sehr müde.', '我很累。', 'koerper', {
    sentences: [
      { de: 'Ich bin sehr müde.', zh: '我很累。', source: null },
      { de: 'Bist du müde?', zh: '你累吗？', source: 'lesson:u1l1' },
    ],
  }),
  w('wehtun', null, null, '疼（可分）', 'Wo tut es weh?', '哪里疼？', 'koerper', {
    sentences: [
      { de: 'Wo tut es weh?', zh: '哪里疼？', source: null },
      { de: 'Was tut Ihnen weh?', zh: '您哪里疼？', source: 'lesson:sb-l3' },
    ],
  }),
  w('Schmerzen', 'die', null, '疼痛（复数）', 'Ich habe Kopfschmerzen.', '我头疼。', 'koerper', {
    sentences: [
      { de: 'Ich habe Kopfschmerzen.', zh: '我头疼。', source: null },
    ],
  }),
  w('Medikament', 'das', 'Medikamente', '药', 'Nehmen Sie das Medikament!', '请服用这个药！', 'koerper', {
    sentences: [
      { de: 'Nehmen Sie das Medikament!', zh: '请服用这个药！', source: null },
    ],
  }),
  w('Termin', 'der', 'Termine', '预约', 'Ich habe einen Termin beim Arzt.', '我约了医生。', 'koerper', {
    sentences: [
      { de: 'Ich habe einen Termin beim Arzt.', zh: '我约了医生。', source: null },
    ],
  }),

  /* 🌤️ 天气与时间词 */
  w('Wetter', 'das', null, '天气', 'Wie ist das Wetter heute?', '今天天气怎么样？', 'wetter', {
    sentences: [
      { de: 'Wie ist das Wetter heute?', zh: '今天天气怎么样？', source: null },
    ],
    mnemonic: 'Wetter ≈ 英语 weather，同源',
  }),
  w('Sonne', 'die', null, '太阳', 'Die Sonne scheint.', '阳光明媚。', 'wetter', {
    sentences: [
      { de: 'Die Sonne scheint.', zh: '阳光明媚。', source: null },
    ],
    mnemonic: 'Sonne ≈ 英语 sun，同源',
  }),
  w('Regen', 'der', null, '雨', 'Morgen gibt es Regen.', '明天有雨。', 'wetter', {
    sentences: [
      { de: 'Morgen gibt es Regen.', zh: '明天有雨。', source: null },
    ],
    mnemonic: 'Regen ≈ 英语 rain，同源',
  }),
  w('regnen', null, null, '下雨', 'Es regnet schon wieder.', '又下雨了。', 'wetter', {
    sentences: [
      { de: 'Es regnet schon wieder.', zh: '又下雨了。', source: null },
    ],
    mnemonic: 'regnen 由名词 Regen（雨）派生：Regen+-en → 下雨',
  }),
  w('Schnee', 'der', null, '雪', 'Im Winter gibt es Schnee.', '冬天下雪。', 'wetter', {
    sentences: [
      { de: 'Im Winter gibt es Schnee.', zh: '冬天下雪。', source: null },
    ],
    mnemonic: 'Schnee ≈ 英语 snow，同源',
  }),
  w('Wind', 'der', 'Winde', '风', 'Der Wind ist stark.', '风很大。', 'wetter', {
    sentences: [
      { de: 'Der Wind ist stark.', zh: '风很大。', source: null },
    ],
    mnemonic: 'Wind ≈ 英语 wind，同源好记',
  }),
  w('warm', null, null, '温暖的', 'Heute ist es warm.', '今天很暖和。', 'wetter', {
    sentences: [
      { de: 'Heute ist es warm.', zh: '今天很暖和。', source: null },
    ],
  }),
  w('kalt', null, null, '寒冷的', 'Im Winter ist es kalt.', '冬天很冷。', 'wetter', {
    sentences: [
      { de: 'Im Winter ist es kalt.', zh: '冬天很冷。', source: null },
    ],
    mnemonic: 'kalt ≈ 英语 cold，同源（辅音 k↔c，t↔d 音变）',
  }),
  w('heiß', null, null, '炎热的', 'Der Sommer ist heiß.', '夏天很热。', 'wetter', {
    sentences: [
      { de: 'Der Sommer ist heiß.', zh: '夏天很热。', source: null },
    ],
    mnemonic: 'heiß（热的）和 heißen（叫……名字）拼写相近但完全无关，别搞混',
  }),
  w('Frühling', 'der', null, '春天', 'Im Frühling blühen die Blumen.', '春天百花盛开。', 'wetter', {
    sentences: [
      { de: 'Im Frühling blühen die Blumen.', zh: '春天百花盛开。', source: null },
    ],
    mnemonic: 'Frühling = früh(早)+-ling(名词后缀) → 一年中最早的季节，即春天',
  }),
  w('Sommer', 'der', null, '夏天', 'Im Sommer fahren wir ans Meer.', '夏天我们去海边。', 'wetter', {
    sentences: [
      { de: 'Im Sommer fahren wir ans Meer.', zh: '夏天我们去海边。', source: null },
    ],
    mnemonic: 'Sommer ≈ 英语 summer，同源',
  }),
  w('Herbst', 'der', null, '秋天', 'Der Herbst ist bunt.', '秋天色彩缤纷。', 'wetter', {
    sentences: [
      { de: 'Der Herbst ist bunt.', zh: '秋天色彩缤纷。', source: null },
    ],
    mnemonic: 'Herbst 与英语 harvest 同源，本义"收获的季节"，即秋天',
  }),
  w('Winter', 'der', null, '冬天', 'Der Winter ist lang.', '冬天很长。', 'wetter', {
    sentences: [
      { de: 'Der Winter ist lang.', zh: '冬天很长。', source: null },
    ],
  }),
  w('Morgen', 'der', null, '早晨', 'Am Morgen trinke ich Kaffee.', '早晨我喝咖啡。', 'wetter', {
    sentences: [
      { de: 'Am Morgen trinke ich Kaffee.', zh: '早晨我喝咖啡。', source: null },
      { de: 'Guten Morgen! Wie geht es Ihnen?', zh: '早上好！您好吗？', source: 'lesson:u0l8' },
    ],
    mnemonic: 'Morgen（早晨，名词，大写）≠ morgen（明天，副词，小写），拼写相同靠大小写区分',
  }),
  w('Abend', 'der', 'Abende', '晚上', 'Am Abend lese ich.', '晚上我看书。', 'wetter', {
    sentences: [
      { de: 'Am Abend lese ich.', zh: '晚上我看书。', source: null },
    ],
  }),
  w('Nacht', 'die', 'Nächte', '夜晚', 'In der Nacht schlafe ich.', '夜里我睡觉。', 'wetter', {
    sentences: [
      { de: 'In der Nacht schlafe ich.', zh: '夜里我睡觉。', source: null },
    ],
    mnemonic: 'Nacht ≈ 英语 night，同源（ch↔gh 音变）',
  }),

  /* 🎨 常用形容词 */
  w('gut', null, null, '好的', 'Das ist eine gute Idee.', '这是个好主意。', 'adj', {
    sentences: [
      { de: 'Das ist eine gute Idee.', zh: '这是个好主意。', source: null },
      { de: 'Die Mutter kocht gut.', zh: '妈妈做饭做得好。', source: 'lesson:u0l2' },
    ],
  }),
  w('schlecht', null, null, '坏的', 'Das Wetter ist schlecht.', '天气很糟。', 'adj', {
    sentences: [
      { de: 'Das Wetter ist schlecht.', zh: '天气很糟。', source: null },
    ],
  }),
  w('groß', null, null, '大的；高的', 'Er ist sehr groß.', '他个子很高。', 'adj', {
    sentences: [
      { de: 'Er ist sehr groß.', zh: '他个子很高。', source: null },
    ],
    mnemonic: 'groß ≈ 英语 gross（原意"大量的"），同源',
  }),
  w('klein', null, null, '小的', 'Die Wohnung ist klein.', '这公寓很小。', 'adj', {
    sentences: [
      { de: 'Die Wohnung ist klein.', zh: '这公寓很小。', source: null },
    ],
  }),
  w('neu', null, null, '新的', 'Ich habe ein neues Handy.', '我有一部新手机。', 'adj', {
    sentences: [
      { de: 'Ich habe ein neues Handy.', zh: '我有一部新手机。', source: null },
    ],
    mnemonic: 'neu ≈ 英语 new，同源好记',
  }),
  w('schön', null, null, '美的', 'Die Stadt ist schön.', '这城市很美。', 'adj', {
    sentences: [
      { de: 'Die Stadt ist schön.', zh: '这城市很美。', source: null },
      { de: 'Die Stadt ist schön.', zh: '这座城市很美。', source: 'lesson:u0l3' },
    ],
  }),
  w('teuer', null, null, '贵的', 'Das Auto ist zu teuer.', '这车太贵了。', 'adj', {
    sentences: [
      { de: 'Das Auto ist zu teuer.', zh: '这车太贵了。', source: null },
    ],
  }),
  w('billig', null, null, '便宜的', 'Das T-Shirt ist billig.', '这件T恤很便宜。', 'adj', {
    sentences: [
      { de: 'Das T-Shirt ist billig.', zh: '这件T恤很便宜。', source: null },
    ],
  }),
  w('schnell', null, null, '快的', 'Der Zug ist schnell.', '火车很快。', 'adj', {
    sentences: [
      { de: 'Der Zug ist schnell.', zh: '火车很快。', source: null },
    ],
  }),
  w('langsam', null, null, '慢的', 'Sprechen Sie bitte langsam!', '请说慢一点！', 'adj', {
    sentences: [
      { de: 'Sprechen Sie bitte langsam!', zh: '请说慢一点！', source: null },
      { de: 'Kein Problem, ich spreche langsam.', zh: '没问题，我说慢一点。', source: 'lesson:sb-l2' },
    ],
    mnemonic: 'langsam = lang(长的)+-sam(形容词后缀) → 拖得久的，即"慢的"',
  }),
  w('einfach', null, null, '简单的', 'Die Aufgabe ist einfach.', '这道题很简单。', 'adj', {
    sentences: [
      { de: 'Die Aufgabe ist einfach.', zh: '这道题很简单。', source: null },
    ],
    mnemonic: 'einfach = ein(一)+-fach(……倍/……重) → 单一层的，即"简单的"',
  }),
  w('schwer', null, null, '难的；重的', 'Deutsch ist nicht so schwer.', '德语没那么难。', 'adj', {
    sentences: [
      { de: 'Deutsch ist nicht so schwer.', zh: '德语没那么难。', source: null },
    ],
  }),
  w('interessant', null, null, '有趣的', 'Das Buch ist interessant.', '这本书很有趣。', 'adj', {
    sentences: [
      { de: 'Das Buch ist interessant.', zh: '这本书很有趣。', source: null },
    ],
  }),
  w('langweilig', null, null, '无聊的', 'Der Film ist langweilig.', '这电影很无聊。', 'adj', {
    sentences: [
      { de: 'Der Film ist langweilig.', zh: '这电影很无聊。', source: null },
    ],
    mnemonic: 'langweilig = lang(长)+Weile(一段时间)+-ig → 觉得时间过得很长，即"无聊的"',
  }),
  w('nett', null, null, '友好的', 'Die Nachbarn sind nett.', '邻居们很友好。', 'adj', {
    sentences: [
      { de: 'Die Nachbarn sind nett.', zh: '邻居们很友好。', source: null },
      { de: 'Du bist nett.', zh: '你人真好。', source: 'lesson:u1l1' },
    ],
    mnemonic: 'nett ≈ 英语 neat，同源，引申为"友好的"',
  }),
  w('richtig', null, null, '正确的', 'Die Antwort ist richtig.', '答案正确。', 'adj', {
    sentences: [
      { de: 'Die Antwort ist richtig.', zh: '答案正确。', source: null },
    ],
    mnemonic: 'richtig 与 Recht（法/权利）同根，和英语 right 同源，引申为"正确的"',
  }),
  w('falsch', null, null, '错误的', 'Das ist leider falsch.', '可惜这是错的。', 'adj', {
    sentences: [
      { de: 'Das ist leider falsch.', zh: '可惜这是错的。', source: null },
    ],
    mnemonic: 'falsch ≈ 英语 false，同源',
  }),
  w('glücklich', null, null, '幸福的', 'Ich bin sehr glücklich.', '我很幸福。', 'adj', {
    sentences: [
      { de: 'Ich bin sehr glücklich.', zh: '我很幸福。', source: null },
    ],
    mnemonic: 'glücklich = Glück(幸运/幸福)+-lich(形容词后缀) → 有幸福感的，即"幸福的"',
  }),

  /* ❓ 疑问词与小词 */
  w('wer', null, null, '谁', 'Wer ist das?', '这是谁？', 'frage', {
    sentences: [
      { de: 'Wer ist das?', zh: '这是谁？', source: null },
    ],
    mnemonic: '德语 W-疑问词对应英语 Wh-：wer=who，was=what，wo=where，wann=when，warum=why',
  }),
  w('was', null, null, '什么', 'Was ist das?', '这是什么？', 'frage', {
    sentences: [
      { de: 'Was ist das?', zh: '这是什么？', source: null },
      { de: 'Was kostet der Kuchen?', zh: '蛋糕多少钱？', source: 'lesson:sa-l2' },
    ],
  }),
  w('wo', null, null, '在哪里', 'Wo wohnst du?', '你住在哪？', 'frage', {
    sentences: [
      { de: 'Wo wohnst du?', zh: '你住在哪？', source: null },
      { de: 'Wo finde ich Brot?', zh: '面包在哪儿能找到？', source: 'lesson:sa-l3' },
    ],
  }),
  w('woher', null, null, '从哪里来', 'Woher kommen Sie?', '您从哪里来？', 'frage', {
    sentences: [
      { de: 'Woher kommen Sie?', zh: '您从哪里来？', source: null },
      { de: 'Woher kommst du?', zh: '你从哪儿来？', source: 'lesson:sa-l1' },
    ],
    mnemonic: 'woher = wo(哪里)+her(朝这边而来) → 从哪里来',
  }),
  w('wohin', null, null, '到哪里去', 'Wohin fährst du?', '你去哪？', 'frage', {
    sentences: [
      { de: 'Wohin fährst du?', zh: '你去哪？', source: null },
    ],
    mnemonic: 'wohin = wo(哪里)+hin(朝那边而去) → 到哪里去，和 woher(从哪里来) 方向相反',
  }),
  w('wann', null, null, '什么时候', 'Wann beginnt der Kurs?', '课程什么时候开始？', 'frage', {
    sentences: [
      { de: 'Wann beginnt der Kurs?', zh: '课程什么时候开始？', source: null },
    ],
  }),
  w('wie', null, null, '如何', 'Wie geht es dir?', '你好吗？', 'frage', {
    sentences: [
      { de: 'Wie geht es dir?', zh: '你好吗？', source: null },
      { de: 'Wie heißt du?', zh: '你叫什么名字？', source: 'lesson:sa-l1' },
    ],
  }),
  w('warum', null, null, '为什么', 'Warum lernst du Deutsch?', '你为什么学德语？', 'frage', {
    sentences: [
      { de: 'Warum lernst du Deutsch?', zh: '你为什么学德语？', source: null },
    ],
    mnemonic: 'warum 由古体 wor-(哪)+um(关于) 构成，字面"关于什么"，即为什么',
  }),
  w('wie viel', null, null, '多少', 'Wie viel kostet das?', '这个多少钱？', 'frage', {
    sentences: [
      { de: 'Wie viel kostet das?', zh: '这个多少钱？', source: null },
    ],
  }),
  w('und', null, null, '和', 'Kaffee und Kuchen.', '咖啡和蛋糕。', 'frage', {
    sentences: [
      { de: 'Kaffee und Kuchen.', zh: '咖啡和蛋糕。', source: null },
      { de: 'Ich bin Anna und du bist Max.', zh: '我是安娜，你是马克斯。', source: 'lesson:u1l1' },
    ],
  }),
  w('oder', null, null, '或者', 'Tee oder Kaffee?', '茶还是咖啡？', 'frage', {
    sentences: [
      { de: 'Tee oder Kaffee?', zh: '茶还是咖啡？', source: null },
    ],
  }),
  w('aber', null, null, '但是', 'Klein, aber fein.', '小而精。', 'frage', {
    sentences: [
      { de: 'Klein, aber fein.', zh: '小而精。', source: null },
      { de: 'Ich spreche ein bisschen Deutsch, aber ich lerne jeden Tag.', zh: '我会说一点德语，但我每天都在学。', source: 'lesson:u0l8' },
    ],
  }),
  w('nicht', null, null, '不', 'Ich weiß nicht.', '我不知道。', 'frage', {
    sentences: [
      { de: 'Ich weiß nicht.', zh: '我不知道。', source: null },
      { de: 'Nein, ich bin nicht müde.', zh: '不，我不累。', source: 'lesson:u1l1' },
    ],
  }),
  w('auch', null, null, '也', 'Ich auch!', '我也是！', 'frage', {
    sentences: [
      { de: 'Ich auch!', zh: '我也是！', source: null },
      { de: 'Freut mich auch! Bist du Studentin?', zh: '我也是！你是大学生吗？', source: 'lesson:u1l1' },
    ],
  }),
  w('sehr', null, null, '非常', 'Danke sehr!', '非常感谢！', 'frage', {
    sentences: [
      { de: 'Danke sehr!', zh: '非常感谢！', source: null },
      { de: 'Du bist sehr nett.', zh: '你非常好。', source: 'lesson:u1l1' },
    ],
  }),
  w('hier', null, null, '这里', 'Hier ist mein Haus.', '这是我家。', 'frage', {
    sentences: [
      { de: 'Hier ist mein Haus.', zh: '这是我家。', source: null },
      { de: 'Ja, der Käse ist hier rechts.', zh: '有，奶酪在这边右侧。', source: 'lesson:sa-l3' },
    ],
  }),
  w('dort', null, null, '那里', 'Dort ist der Bahnhof.', '火车站在那边。', 'frage', {
    sentences: [
      { de: 'Dort ist der Bahnhof.', zh: '火车站在那边。', source: null },
      { de: 'Das Brot ist dort links.', zh: '面包在那边左侧。', source: 'lesson:sa-l3' },
    ],
    mnemonic: 'dort ≈ 英语 there，同源（d↔th 音变，同 Tür≈door）',
  }),
  w('immer', null, null, '总是', 'Er kommt immer zu spät.', '他总是迟到。', 'frage', {
    sentences: [
      { de: 'Er kommt immer zu spät.', zh: '他总是迟到。', source: null },
    ],
  }),
  w('oft', null, null, '经常', 'Wir essen oft zusammen.', '我们常一起吃饭。', 'frage', {
    sentences: [
      { de: 'Wir essen oft zusammen.', zh: '我们常一起吃饭。', source: null },
    ],
    mnemonic: 'oft ≈ 英语 oft(en)，同源好记',
  }),
  w('manchmal', null, null, '有时', 'Manchmal koche ich selbst.', '有时我自己做饭。', 'frage', {
    sentences: [
      { de: 'Manchmal koche ich selbst.', zh: '有时我自己做饭。', source: null },
    ],
    mnemonic: 'manchmal = manch(有些)+Mal(次/回) → 有些次，即"有时"',
  }),

  /* 🗨 高频固定表达（id 按数组位置生成，新词条只能追加在末尾，勿插入中间） */
  w('Kein Problem', null, null, '没问题', 'Kein Problem, ich spreche langsam.', '没问题，我说慢一点。', 'gruss', {
    sentences: [
      { de: 'Kein Problem, ich spreche langsam.', zh: '没问题，我说慢一点。', source: null },
      { de: 'Ja, kein Problem.', zh: '可以，没问题。', source: 'lesson:sb-l2' },
    ],
  }),
  w('Einen Moment, bitte', null, null, '请稍等', 'Einen Moment, bitte. Der Arzt kommt gleich.', '请稍等，医生马上就来。', 'gruss', {
    sentences: [
      { de: 'Einen Moment, bitte. Der Arzt kommt gleich.', zh: '请稍等，医生马上就来。', source: null },
    ],
  }),
  w('Wie bitte?', null, null, '请再说一遍？', 'Wie bitte? Ich verstehe das nicht.', '请再说一遍？我没听懂。', 'gruss', {
    sentences: [
      { de: 'Wie bitte? Ich verstehe das nicht.', zh: '请再说一遍？我没听懂。', source: null },
    ],
  }),
  w('Gute Besserung', null, null, '祝早日康复', 'Gute Besserung!', '祝早日康复！', 'koerper', {
    sentences: [
      { de: 'Gute Besserung!', zh: '祝早日康复！', source: null },
    ],
  }),
];
