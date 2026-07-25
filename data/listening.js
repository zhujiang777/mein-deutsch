// 精听包。规范见 docs/schema.md §5。
// 音频与句级时间戳由 tools/gen_listening_audio.py 生成到 data/listening-audio.js，
// 不要手写时间戳。改动本文件后必须重跑：
//   node tools/extract_texts.mjs > /dev/null && python3 tools/gen_audio.py && python3 tools/gen_listening_audio.py
//
// provenance 是硬门槛，tests/listening-data.test.mjs 会校验：
//   kind:'corpus'   —— 外部语料内嵌，署名/授权/原文链接/抓取日期/是否改动 全部必填
//   kind:'original' —— 原创撰写，必须有 adaptedFrom.statement 声明来源边界

const ORIGINAL_FROM_OWN_SYLLABUS = {
  kind: 'original',
  source: 'original',
  license: 'proprietary',
  adaptedFrom: {
    statement: '脚本依据本项目自有大纲（docs/scene-track-plan.md）与 Goethe-Zertifikat A1 词表（DWDS，tools/wortliste.json）原创撰写，未参考或复制任何教材、DW 或第三方 App 的文本。',
  },
};

export const LISTENING_PACKS = [
  {
    id: 'li-b01',
    title: 'Im Café',
    titleZh: '在咖啡馆',
    level: 'A1',
    topic: 'gastronomie',
    func: ['bestellen', 'nach dem Preis fragen', 'bezahlen'],
    funcZh: ['点单', '问价格', '买单'],
    skills: ['listen-detail', 'scene-cafe'],
    intro: '服务员和客人的一段完整点单。先整体听两遍，抓住「点了什么、多少钱、怎么付」。',
    provenance: ORIGINAL_FROM_OWN_SYLLABUS,
    // 两个说话人 → 逐句独立文件，各用各的音色
    audio: { mode: 'sentences' },
    speakers: [
      { id: 'K', name: 'Kellner', voice: 'de-DE-ConradNeural', gender: 'm', accent: 'de-DE' },
      { id: 'G', name: 'Gast', voice: 'de-DE-KatjaNeural', gender: 'f', accent: 'de-DE' },
    ],
    sentences: [
      { de: 'Guten Tag! Was möchten Sie trinken?', zh: '您好！您想喝点什么？', sp: 'K' },
      { de: 'Guten Tag. Ich möchte einen Kaffee, bitte.', zh: '您好。我想要一杯咖啡，谢谢。', sp: 'G', note: 'einen 是 der Kaffee 的第四格——「要一杯」是动作的对象。' },
      { de: 'Gern. Mit Milch und Zucker?', zh: '好的。加牛奶和糖吗？', sp: 'K', newLemmas: ['Zucker'] },
      { de: 'Nur mit Milch, bitte.', zh: '只加牛奶，谢谢。', sp: 'G' },
      { de: 'Möchten Sie auch etwas essen?', zh: '您还想吃点什么吗？', sp: 'K', newLemmas: ['etwas'], note: 'etwas essen 连读时 etwas 的 -s 会接到 essen 上。' },
      { de: 'Ja, ein Stück Kuchen. Was haben Sie?', zh: '好，来一块蛋糕。你们有什么？', sp: 'G', newLemmas: ['Stück'] },
      { de: 'Wir haben Apfelkuchen und Käsekuchen.', zh: '我们有苹果蛋糕和奶酪蛋糕。', sp: 'K', newLemmas: ['Apfelkuchen', 'Käsekuchen'] },
      { de: 'Dann nehme ich den Apfelkuchen.', zh: '那我要苹果蛋糕。', sp: 'G', newLemmas: ['Apfelkuchen'], note: 'den 是第四格阳性——上一句是「有什么」，这句才是「我要哪个」。' },
      { de: 'Sehr gern. Das macht sechs Euro fünfzig.', zh: '好的。一共六欧五十。', sp: 'K', note: 'Das macht … 是结账固定说法，不是「制作」。' },
      { de: 'Kann ich mit Karte zahlen?', zh: '我可以刷卡吗？', sp: 'G' },
      { de: 'Natürlich. Hier bitte.', zh: '当然。请这边。', sp: 'K', newLemmas: ['natürlich'] },
      { de: 'Danke schön! Auf Wiedersehen.', zh: '谢谢！再见。', sp: 'G' },
    ],
    gist: {
      q: '客人最后点了什么？',
      options: ['一杯加牛奶的咖啡和一块苹果蛋糕', '一杯加牛奶加糖的咖啡和奶酪蛋糕', '只要一块奶酪蛋糕'],
      a: 0,
      explain: '第 4 句 Nur mit Milch（只加牛奶），第 8 句 nehme ich den Apfelkuchen。',
    },
    dictation: [1, 3, 5, 7, 9],
    speakPractice: [1, 9],
    reproduce: [8],
  },

  {
    id: 'li-b02',
    title: 'Mein Zimmer im Wohnheim',
    titleZh: '我在学生宿舍的房间',
    level: 'A1',
    topic: 'wohnen',
    func: ['ein Zimmer beschreiben', 'über Miete sprechen'],
    funcZh: ['描述房间', '谈租金'],
    skills: ['listen-detail', 'scene-wohnen'],
    intro: '一段独白。听的时候在脑子里画出房间：什么东西在哪边。',
    provenance: ORIGINAL_FROM_OWN_SYLLABUS,
    // 单音色 → 整段一次合成，带句级时间戳，支持 AB 复读
    audio: { mode: 'clip' },
    speakers: [
      { id: 'A', name: 'Anna', voice: 'de-DE-KatjaNeural', gender: 'f', accent: 'de-DE' },
    ],
    sentences: [
      { de: 'Ich wohne jetzt in Berlin.', zh: '我现在住在柏林。' },
      { de: 'Mein Zimmer ist im Wohnheim.', zh: '我的房间在学生宿舍里。', newLemmas: ['Wohnheim'] },
      { de: 'Es ist klein, aber sehr hell.', zh: '房间小，但是很亮。' },
      { de: 'Links steht mein Bett, rechts steht ein Schreibtisch.', zh: '左边是我的床，右边是一张书桌。', newLemmas: ['Schreibtisch'], note: 'steht 不是「站」——德语说家具「立在」某处。' },
      { de: 'Vor dem Fenster habe ich zwei Blumen.', zh: '窗前我放了两盆花。', note: 'Vor dem Fenster 在句首，动词 habe 必须排第二位。' },
      { de: 'Die Küche teile ich mit vier Studenten.', zh: '厨房我和四个学生共用。' },
      { de: 'Wir kochen oft zusammen am Abend.', zh: '我们晚上常常一起做饭。' },
      { de: 'Das Bad ist leider oft nicht frei.', zh: '浴室可惜常常没空。' },
      { de: 'Die Miete kostet dreihundert Euro im Monat.', zh: '房租每月三百欧。', newLemmas: ['dreihundert'] },
      { de: 'Der Bus zur Universität fährt alle zehn Minuten.', zh: '去大学的公交每十分钟一班。', note: 'alle zehn Minuten 是「每十分钟」，不是「所有十分钟」。' },
      { de: 'Am Wochenende gehe ich gern in den Park.', zh: '周末我喜欢去公园。' },
      { de: 'Ich bin hier schon fast zu Hause.', zh: '我在这儿已经快像在家了。', newLemmas: ['fast'] },
    ],
    gist: {
      q: '关于这个房间，下面哪一项是对的？',
      options: ['房间小但采光好，厨房是共用的', '房间大而且有独立厨房', '房间小而且很暗，浴室随时能用'],
      a: 0,
      explain: '第 3 句 klein, aber sehr hell；第 6 句 Die Küche teile ich mit vier Studenten。',
    },
    dictation: [0, 2, 4, 6, 8, 10],
    speakPractice: [3, 9],
    reproduce: [4],
  },
];

export function findPack(id) {
  return LISTENING_PACKS.find(pack => pack.id === id) || null;
}
