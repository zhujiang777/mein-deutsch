// 体系化语法课：20 课，按 A1 大纲编排
// sections: { h?, p?, tip?, table?{head,rows}, examples?[{de,zh}] }
// exercises: { type:'choice', q, options, a(索引), explain } | { type:'fill', q, a:[答案], explain }
const RAW_LESSONS = [
  {
    id: 'g01',
    title: '第1课 · 人称代词与 sein',
    sub: '我是、你是、他是——最重要的动词',
    sections: [
      {
        p: '德语和英语一样，动词要跟着主语变化（我是 ich bin，你是 du bist）。第一步：记住人称代词 + 最常用的动词 sein（是）。',
      },
      {
        h: '人称代词',
        table: {
          head: ['单数', '含义', '复数', '含义'],
          rows: [
            ['ich', '我', 'wir', '我们'],
            ['du', '你（熟人）', 'ihr', '你们（熟人）'],
            ['er / sie / es', '他 / 她 / 它', 'sie', '他们'],
            ['Sie', '您（尊称，永远大写）', 'Sie', '您们'],
          ],
        },
        tip: 'du 用于朋友、家人、小孩；对陌生成年人、正式场合用 Sie。sie 一词三义（她/他们/您），靠动词变位和大小写区分。',
      },
      {
        h: 'sein（是）的现在时变位',
        p: 'sein 是德语最不规则也最常用的动词，必须直接背熟：',
        table: {
          head: ['人称', 'sein', '例子'],
          rows: [
            ['ich', 'bin', 'Ich bin Student.'],
            ['du', 'bist', 'Du bist nett.'],
            ['er/sie/es', 'ist', 'Er ist müde.'],
            ['wir', 'sind', 'Wir sind hier.'],
            ['ihr', 'seid', 'Ihr seid jung.'],
            ['sie/Sie', 'sind', 'Sie sind Lehrer.'],
          ],
        },
      },
      {
        h: '例句跟读',
        examples: [
          { de: 'Ich bin Anna.', zh: '我是安娜。' },
          { de: 'Du bist sehr nett.', zh: '你人很好。' },
          { de: 'Das ist mein Bruder. Er ist Student.', zh: '这是我哥哥。他是大学生。' },
          { de: 'Wir sind aus China.', zh: '我们来自中国。' },
          { de: 'Sind Sie Frau Müller?', zh: '您是米勒女士吗？' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: 'Ich ___ müde.（我累了。）', options: ['bin', 'bist', 'ist', 'sind'], a: 0, explain: 'ich → bin。' },
      { type: 'choice', q: 'Du ___ mein Freund.（你是我的朋友。）', options: ['bin', 'bist', 'ist', 'seid'], a: 1, explain: 'du → bist。' },
      { type: 'choice', q: 'Er ___ Lehrer.（他是老师。）', options: ['sind', 'bist', 'ist', 'bin'], a: 2, explain: 'er/sie/es → ist。' },
      { type: 'choice', q: '___ Sie Herr Wang?（您是王先生吗？）', options: ['Bist', 'Ist', 'Seid', 'Sind'], a: 3, explain: '尊称 Sie 永远配 sind。' },
      { type: 'fill', q: 'Wir ___ Studenten.（我们是大学生。）', a: ['sind'], explain: 'wir → sind。' },
      { type: 'fill', q: 'Ihr ___ jung.（你们很年轻。）', a: ['seid'], explain: 'ihr → seid，是 sein 里最容易忘的一个。' },
    ],
  },
  {
    id: 'g02',
    title: '第2课 · 规则动词变位与 haben',
    sub: '掌握一条规则 = 会变几千个动词',
    sections: [
      {
        p: '德语动词原形几乎都以 -en 结尾（lernen 学、kommen 来、wohnen 住）。变位方法：去掉 -en 得到词干，再按人称加词尾。这套词尾适用于绝大多数动词：',
      },
      {
        h: '规则动词词尾（以 lernen 为例）',
        table: {
          head: ['人称', '词尾', 'lernen 学习', 'kommen 来'],
          rows: [
            ['ich', '-e', 'lerne', 'komme'],
            ['du', '-st', 'lernst', 'kommst'],
            ['er/sie/es', '-t', 'lernt', 'kommt'],
            ['wir', '-en', 'lernen', 'kommen'],
            ['ihr', '-t', 'lernt', 'kommt'],
            ['sie/Sie', '-en', 'lernen', 'kommen'],
          ],
        },
        tip: '记忆口诀：e / st / t / en / t / en。wir 和 sie/Sie 的形式永远和原形一样。',
      },
      {
        h: '小变体',
        p: '词干以 -t/-d 结尾的动词（arbeiten 工作、finden 觉得），du/er/ihr 加词尾前补一个 e：du arbeitest, er arbeitet。\n词干以 -s/-ß/-z 结尾的（heißen 叫），du 只加 -t：du heißt。',
      },
      {
        h: 'haben（有）——第二个必背动词',
        table: {
          head: ['人称', 'haben', '例子'],
          rows: [
            ['ich', 'habe', 'Ich habe Zeit.'],
            ['du', 'hast', 'Du hast Recht.'],
            ['er/sie/es', 'hat', 'Sie hat Hunger.'],
            ['wir', 'haben', 'Wir haben Unterricht.'],
            ['ihr', 'habt', 'Ihr habt Glück.'],
            ['sie/Sie', 'haben', 'Sie haben Fragen.'],
          ],
        },
        tip: 'du hast、er hat 少了 b，是 haben 唯一的不规则处。',
      },
      {
        h: '例句跟读',
        examples: [
          { de: 'Ich lerne Deutsch.', zh: '我学德语。' },
          { de: 'Woher kommst du?', zh: '你来自哪里？' },
          { de: 'Sie wohnt in Berlin.', zh: '她住在柏林。' },
          { de: 'Ich habe eine Frage.', zh: '我有一个问题。' },
          { de: 'Er arbeitet heute.', zh: '他今天上班。' },
        ],
      },
    ],
    exercises: [
      { type: 'fill', q: 'Ich ___ (wohnen) in Shanghai.', a: ['wohne'], explain: 'ich → 词干 + e。' },
      { type: 'fill', q: 'Du ___ (kommen) aus China.', a: ['kommst'], explain: 'du → 词干 + st。' },
      { type: 'fill', q: 'Er ___ (lernen) Englisch.', a: ['lernt'], explain: 'er → 词干 + t。' },
      { type: 'fill', q: 'Sie (她) ___ (arbeiten) viel.', a: ['arbeitet'], explain: '词干以 t 结尾 → 补 e：arbeitet。' },
      { type: 'choice', q: 'Wir ___ Deutsch.（我们学德语。）', options: ['lerne', 'lernst', 'lernt', 'lernen'], a: 3, explain: 'wir → 和原形相同。' },
      { type: 'choice', q: 'Du ___ Hunger.（你饿了。）', options: ['habe', 'hast', 'hat', 'haben'], a: 1, explain: 'haben 不规则：du hast。' },
    ],
  },
  {
    id: 'g03',
    title: '第3课 · 名词的性与冠词（第一格）',
    sub: 'der / die / das：德语的"三扇门"',
    sections: [
      {
        p: '每个德语名词都有语法上的"性"：阳性(der)、阴性(die)、中性(das)。这决定冠词、代词、形容词的形式，是德语的地基。名词的性大多没有道理可讲（"女孩 das Mädchen"是中性！），所以背单词必须连冠词一起背。',
        tip: '本应用的词汇卡片用颜色帮你记：der 蓝色、die 红色、das 绿色。',
      },
      {
        h: '定冠词与不定冠词（第一格 Nominativ）',
        table: {
          head: ['', '阳性', '阴性', '中性', '复数'],
          rows: [
            ['定冠词（这个）', 'der Mann', 'die Frau', 'das Kind', 'die Kinder'],
            ['不定冠词（一个）', 'ein Mann', 'eine Frau', 'ein Kind', '— Kinder'],
          ],
        },
        tip: '复数一律用 die，没有"不定冠词复数"（就像英语没有 a books）。',
      },
      {
        h: '一些有规律的线索',
        p: '虽然多数要死记，但有些结尾很可靠：\n• 阴性：-ung, -heit, -keit, -ion, -e（多数）→ die Zeitung, die Information\n• 中性：-chen, -lein（小称）→ das Mädchen；动词原形作名词 → das Essen\n• 阳性：-er（表人）、日/月/季节 → der Lehrer, der Montag',
      },
      {
        h: '人称代词替换名词',
        p: '再提一次逻辑：代词跟"语法性"走，不跟自然性别走。der Tisch（桌子）→ er（它/他）；die Tür（门）→ sie；das Buch → es。',
        examples: [
          { de: 'Das ist ein Tisch. Der Tisch ist neu. Er ist neu.', zh: '这是一张桌子。这张桌子是新的。它是新的。' },
          { de: 'Das ist eine Lampe. Die Lampe ist schön.', zh: '这是一盏灯。这盏灯很漂亮。' },
          { de: 'Das Kind ist klein. Es ist drei Jahre alt.', zh: '这孩子很小。他三岁。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: '___ Frau ist Lehrerin.', options: ['Der', 'Die', 'Das'], a: 1, explain: 'Frau 阴性 → die。' },
      { type: 'choice', q: '___ Buch ist interessant.', options: ['Der', 'Die', 'Das'], a: 2, explain: 'Buch 中性 → das。' },
      { type: 'choice', q: 'Das ist ___ Mann.（这是一个男人。）', options: ['ein', 'eine', 'einen'], a: 0, explain: '阳性第一格 → ein。' },
      { type: 'choice', q: 'Das ist ___ Zeitung.（这是一份报纸。）', options: ['ein', 'eine', 'einen'], a: 1, explain: '-ung 结尾 → 阴性 → eine。' },
      { type: 'choice', q: 'Die Mädchen? 错了吗？——"das Mädchen"是什么性？', options: ['阳性', '阴性', '中性'], a: 2, explain: '-chen 结尾一律中性，哪怕指女孩。' },
      { type: 'fill', q: 'Der Tisch ist alt. → ___ ist alt.（用代词替换）', a: ['er'], explain: 'der → er。' },
    ],
  },
  {
    id: 'g04',
    title: '第4课 · 名词复数',
    sub: '五种复数词尾一次看懂',
    sections: [
      {
        p: '德语复数不像英语加 s 那么统一，主要有 5 种方式。好消息：复数形式跟单词一起背即可（词汇卡片里都标了），这里先建立整体认识：',
      },
      {
        h: '五种复数类型',
        table: {
          head: ['类型', '例子', '备注'],
          rows: [
            ['-e（可带变音）', 'der Tisch → die Tische', '很多阳性词'],
            ['-(e)n', 'die Lampe → die Lampen', '绝大多数阴性词'],
            ['-er（常带变音）', 'das Kind → die Kinder', '很多中性词'],
            ['-s', 'das Auto → die Autos', '外来词'],
            ['不变（可带变音）', 'der Lehrer → die Lehrer', '-er/-el/-en 结尾的词'],
          ],
        },
        tip: '不管单数是什么性，复数的定冠词一律是 die。',
      },
      {
        h: '变元音很常见',
        examples: [
          { de: 'der Mann → die Männer', zh: '男人 → 男人们' },
          { de: 'die Mutter → die Mütter', zh: '妈妈 → 妈妈们' },
          { de: 'das Buch → die Bücher', zh: '书 → 书（复数）' },
          { de: 'der Apfel → die Äpfel', zh: '苹果 → 苹果（复数）' },
        ],
      },
      {
        h: '句子练习',
        examples: [
          { de: 'Das Kind spielt. Die Kinder spielen.', zh: '孩子在玩。孩子们在玩。' },
          { de: 'Ich habe zwei Brüder und eine Schwester.', zh: '我有两个兄弟和一个姐妹。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: 'das Auto 的复数是？', options: ['die Auten', 'die Autos', 'die Autoen'], a: 1, explain: '外来词 → -s。' },
      { type: 'choice', q: 'die Frau 的复数是？', options: ['die Fraus', 'die Fräue', 'die Frauen'], a: 2, explain: '阴性多加 -(e)n。' },
      { type: 'choice', q: 'der Lehrer 的复数是？', options: ['die Lehrer', 'die Lehrers', 'die Lehreren'], a: 0, explain: '-er 结尾表人 → 不变。' },
      { type: 'fill', q: 'das Buch → die ___', a: ['bücher'], explain: '中性常 -er + 变音：Bücher。' },
      { type: 'choice', q: '复数名词配哪个定冠词？', options: ['der', 'die', 'das'], a: 1, explain: '复数一律 die。' },
    ],
  },
  {
    id: 'g05',
    title: '第5课 · 语序：动词永远在第二位',
    sub: '德语句子的黄金规则',
    sections: [
      {
        p: '这是德语语法里最重要的一条规则：陈述句中，变位动词永远占据"第二个位置"。注意"第二位"数的是成分不是单词——把时间、地点提前，动词也纹丝不动地待在第二位，主语则挪到动词后面。',
      },
      {
        h: '动词第二位（V2）',
        table: {
          head: ['第一位', '第二位=动词', '其余'],
          rows: [
            ['Ich', 'lerne', 'heute Deutsch.'],
            ['Heute', 'lerne', 'ich Deutsch.'],
            ['Deutsch', 'lerne', 'ich heute.'],
          ],
        },
        tip: '三句意思一样（强调点不同）。第一位放什么都行，但动词必须第二、主语必须紧贴动词。“Heute ich lerne...”是最典型的中式/英式错误！',
      },
      {
        h: '是非疑问句：动词提到第一位',
        p: '能用 ja/nein 回答的问题，把动词放到句首，主语第二：',
        examples: [
          { de: 'Lernst du Deutsch? – Ja, ich lerne Deutsch.', zh: '你学德语吗？——是的。' },
          { de: 'Kommen Sie aus China?', zh: '您来自中国吗？' },
          { de: 'Hast du Zeit?', zh: '你有时间吗？' },
        ],
      },
      {
        h: 'W- 疑问句：疑问词第一，动词第二',
        table: {
          head: ['疑问词', '含义', '例句'],
          rows: [
            ['wer', '谁', 'Wer bist du?'],
            ['was', '什么', 'Was machst du?'],
            ['wo', '在哪里', 'Wo wohnst du?'],
            ['woher', '从哪里来', 'Woher kommst du?'],
            ['wohin', '到哪里去', 'Wohin gehst du?'],
            ['wann', '什么时候', 'Wann kommst du?'],
            ['wie', '如何/多么', 'Wie heißt du?'],
            ['warum', '为什么', 'Warum lernst du Deutsch?'],
          ],
        },
      },
      {
        h: '例句跟读',
        examples: [
          { de: 'Heute habe ich keine Zeit.', zh: '今天我没有时间。' },
          { de: 'Am Montag arbeite ich.', zh: '周一我上班。' },
          { de: 'Wo wohnen Sie?', zh: '您住在哪里？' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: '"今天我学德语"正确的语序是？', options: ['Heute ich lerne Deutsch.', 'Heute lerne ich Deutsch.', 'Ich heute lerne Deutsch.'], a: 1, explain: 'Heute 占第一位后，动词仍在第二位，主语后移。' },
      { type: 'choice', q: '哪句是正确的是非疑问句？', options: ['Du kommst aus China?', 'Kommst du aus China?', 'Aus China du kommst?'], a: 1, explain: '是非问句动词放第一位。（第一句口语可用但不是标准问句）' },
      { type: 'choice', q: '"你叫什么名字？"', options: ['Wie heißt du?', 'Was heißt du?', 'Wer heißt du?'], a: 0, explain: '问名字用 wie（"你如何被称呼"）。' },
      { type: 'choice', q: '"你住在哪里？"', options: ['Woher wohnst du?', 'Wohin wohnst du?', 'Wo wohnst du?'], a: 2, explain: 'wo 在哪 / woher 从哪来 / wohin 去哪。' },
      { type: 'fill', q: 'Am Wochenende ___ (spielen) wir Fußball.', a: ['spielen'], explain: '动词第二位，wir → spielen。' },
    ],
  },
  {
    id: 'g06',
    title: '第6课 · 第四格 Akkusativ（宾语）',
    sub: '只有阳性会变：den / einen',
    sections: [
      {
        p: '德语靠"格"表示名词在句中的角色。主语用第一格（前面学的 der/die/das），直接宾语（动作的承受者）用第四格 Akkusativ。好消息：第四格只有阳性变形，阴性、中性、复数都和第一格一模一样。',
      },
      {
        h: '第四格冠词表',
        table: {
          head: ['', '阳性', '阴性', '中性', '复数'],
          rows: [
            ['第一格（主语）', 'der / ein', 'die / eine', 'das / ein', 'die / —'],
            ['第四格（宾语）', 'den / einen', 'die / eine', 'das / ein', 'die / —'],
          ],
        },
        tip: '只要记住：阳性 der→den、ein→einen，其他照旧。',
      },
      {
        h: '例句对比',
        examples: [
          { de: 'Der Mann ist nett. – Ich sehe den Mann.', zh: '这个男人很好（主语）。——我看见这个男人（宾语）。' },
          { de: 'Ich habe einen Bruder.', zh: '我有一个哥哥。（haben 永远接第四格）' },
          { de: 'Ich trinke einen Kaffee, sie trinkt eine Cola.', zh: '我喝一杯咖啡，她喝一杯可乐。' },
          { de: 'Er kauft das Buch.', zh: '他买这本书。（中性不变）' },
        ],
      },
      {
        h: '否定冠词 kein：否定名词用它',
        p: 'kein 的变化和 ein 完全一样（kein/keine/kein，第四格阳性 keinen），意思是"没有/不是一个"。否定带 ein 的名词或无冠词名词时用 kein，不用 nicht：',
        examples: [
          { de: 'Ich habe keinen Bruder.', zh: '我没有哥哥。' },
          { de: 'Das ist keine gute Idee.', zh: '这不是个好主意。' },
          { de: 'Ich trinke keinen Kaffee.', zh: '我不喝咖啡。' },
        ],
      },
      {
        h: '人称代词的第四格',
        table: {
          head: ['第一格', '第四格', '例句'],
          rows: [
            ['ich', 'mich', 'Er sieht mich. 他看见我。'],
            ['du', 'dich', 'Ich liebe dich. 我爱你。'],
            ['er / sie / es', 'ihn / sie / es', 'Ich sehe ihn. 我看见他。'],
            ['wir / ihr', 'uns / euch', 'Sie besucht uns. 她拜访我们。'],
            ['sie / Sie', 'sie / Sie', 'Ich verstehe Sie. 我懂您（的话）。'],
          ],
        },
      },
    ],
    exercises: [
      { type: 'choice', q: 'Ich sehe ___ Mann.（我看见这个男人。）', options: ['der', 'den', 'dem'], a: 1, explain: '阳性宾语 → den。' },
      { type: 'choice', q: 'Sie hat ___ Hund.（她有一只狗。Hund 阳性）', options: ['ein', 'eine', 'einen'], a: 2, explain: 'haben + 第四格，阳性 → einen。' },
      { type: 'choice', q: 'Er kauft ___ Lampe.（他买一盏灯。Lampe 阴性）', options: ['eine', 'einen', 'ein'], a: 0, explain: '阴性第四格不变 → eine。' },
      { type: 'choice', q: 'Ich habe ___ Zeit.（我没有时间。）', options: ['nicht', 'keine', 'kein'], a: 1, explain: '否定无冠词名词用 kein；Zeit 阴性 → keine。' },
      { type: 'fill', q: 'Ich liebe ___.（我爱你。）', a: ['dich'], explain: 'du 的第四格是 dich。' },
      { type: 'choice', q: 'Wo ist Peter? Ich sehe ___ nicht.（我看不见他。）', options: ['er', 'ihm', 'ihn'], a: 2, explain: 'er 的第四格 → ihn。' },
    ],
  },
  {
    id: 'g07',
    title: '第7课 · 不规则动词与换音',
    sub: 'du 和 er 变身：e→i, e→ie, a→ä',
    sections: [
      {
        p: '一批常用动词在 du 和 er/sie/es 变位时词干元音会"换音"，其余人称完全规则。只有三种换法：',
      },
      {
        h: '三种换音',
        table: {
          head: ['类型', '原形', 'du', 'er/sie/es', '含义'],
          rows: [
            ['e → i', 'sprechen', 'sprichst', 'spricht', '说'],
            ['e → i', 'essen', 'isst', 'isst', '吃'],
            ['e → i', 'geben', 'gibst', 'gibt', '给'],
            ['e → ie', 'sehen', 'siehst', 'sieht', '看'],
            ['e → ie', 'lesen', 'liest', 'liest', '读'],
            ['a → ä', 'fahren', 'fährst', 'fährt', '乘/驾驶'],
            ['a → ä', 'schlafen', 'schläfst', 'schläft', '睡'],
          ],
        },
        tip: '只影响 du 和 er/sie/es！ich spreche、wir sprechen 都不换音。',
      },
      {
        h: '两个特殊大户：werden 和 wissen',
        table: {
          head: ['人称', 'werden 变成', 'wissen 知道'],
          rows: [
            ['ich', 'werde', 'weiß'],
            ['du', 'wirst', 'weißt'],
            ['er/sie/es', 'wird', 'weiß'],
            ['wir', 'werden', 'wissen'],
          ],
        },
      },
      {
        h: '例句跟读',
        examples: [
          { de: 'Sprichst du Deutsch?', zh: '你说德语吗？' },
          { de: 'Er isst gern Pizza.', zh: '他喜欢吃披萨。' },
          { de: 'Sie liest ein Buch.', zh: '她在读一本书。' },
          { de: 'Der Zug fährt um acht Uhr.', zh: '火车八点开。' },
          { de: 'Ich weiß es nicht.', zh: '我不知道。' },
        ],
      },
    ],
    exercises: [
      { type: 'fill', q: 'Er ___ (sprechen) gut Englisch.', a: ['spricht'], explain: 'e→i：spricht。' },
      { type: 'fill', q: 'Du ___ (lesen) viel.', a: ['liest'], explain: 'e→ie：liest。' },
      { type: 'fill', q: 'Sie (她) ___ (fahren) nach Berlin.', a: ['fährt'], explain: 'a→ä：fährt。' },
      { type: 'choice', q: 'Wir ___ heute Fisch.（essen）', options: ['essen', 'isst', 'esst'], a: 0, explain: 'wir 不换音，= 原形。' },
      { type: 'fill', q: 'Das Kind ___ (schlafen) schon.', a: ['schläft'], explain: 'a→ä：schläft。' },
    ],
  },
  {
    id: 'g08',
    title: '第8课 · 情态动词与"句框"',
    sub: 'können, müssen, wollen… + 动词原形站句尾',
    sections: [
      {
        p: '情态动词（能、必须、想要…）是 A1 的重点。它带来德语最有特色的结构——"句框"（Satzklammer）：情态动词占第二位，动词原形被"踢"到句子最末尾，两者像括号一样框住整句。',
      },
      {
        h: '句框结构',
        table: {
          head: ['位置1', '位置2=情态动词', '中间', '句尾=动词原形'],
          rows: [
            ['Ich', 'kann', 'gut', 'schwimmen.'],
            ['Er', 'muss', 'heute lange', 'arbeiten.'],
            ['Wir', 'wollen', 'nach Deutschland', 'fahren.'],
          ],
        },
        tip: '中文思维"我能游泳"动词挨着；德语要习惯"我 能 (很好地) 游泳←句尾"。中间塞多少东西，原形都在最后。',
      },
      {
        h: '六个情态动词的变位（单数不规则）',
        table: {
          head: ['', 'können 能', 'müssen 必须', 'wollen 想要', 'dürfen 可以', 'sollen 应该', 'mögen 喜欢'],
          rows: [
            ['ich', 'kann', 'muss', 'will', 'darf', 'soll', 'mag'],
            ['du', 'kannst', 'musst', 'willst', 'darfst', 'sollst', 'magst'],
            ['er/sie/es', 'kann', 'muss', 'will', 'darf', 'soll', 'mag'],
            ['wir/sie/Sie', 'können', 'müssen', 'wollen', 'dürfen', 'sollen', 'mögen'],
          ],
        },
        tip: '规律：ich 和 er/sie/es 形式相同且无词尾；单数元音常变化。',
      },
      {
        h: 'möchten：最礼貌的"想要"',
        p: 'möchte（想要，mögen 的虚拟式）在点餐、购物时天天用：ich möchte, du möchtest, er möchte, wir möchten。',
        examples: [
          { de: 'Ich möchte einen Kaffee, bitte.', zh: '我想要一杯咖啡。' },
          { de: 'Möchten Sie etwas trinken?', zh: '您想喝点什么吗？' },
        ],
      },
      {
        h: '例句跟读',
        examples: [
          { de: 'Kannst du mir helfen?', zh: '你能帮我吗？' },
          { de: 'Ich muss jetzt gehen.', zh: '我现在必须走了。' },
          { de: 'Hier darf man nicht rauchen.', zh: '这里不许吸烟。' },
          { de: 'Was willst du heute machen?', zh: '你今天想做什么？' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: '"我会游泳"正确语序是？', options: ['Ich kann schwimmen gut.', 'Ich kann gut schwimmen.', 'Ich schwimmen kann gut.'], a: 1, explain: '情态动词第二位，原形句尾。' },
      { type: 'choice', q: 'Er ___ heute arbeiten.（他今天必须上班。）', options: ['müssen', 'musst', 'muss'], a: 2, explain: 'er → muss（无词尾）。' },
      { type: 'choice', q: 'Ich ___ einen Tee, bitte.', options: ['möchte', 'möchten', 'möchtest'], a: 0, explain: 'ich möchte。' },
      { type: 'fill', q: '___ du Deutsch sprechen?（你会说德语吗？）', a: ['kannst'], explain: 'du → kannst，放句首构成疑问句。' },
      { type: 'choice', q: '"这里不可以拍照"用哪个情态动词？', options: ['können', 'dürfen', 'sollen'], a: 1, explain: '表允许/禁止用 dürfen：Hier darf man nicht fotografieren.' },
    ],
  },
  {
    id: 'g09',
    title: '第9课 · 可分动词',
    sub: 'aufstehen：前缀飞到句尾',
    sections: [
      {
        p: '德语有一大批"可分动词"：前缀 + 动词（auf + stehen = aufstehen 起床）。在现在时句子里，动词部分正常变位放第二位，前缀被甩到句子最末尾——又是一个"句框"！',
      },
      {
        h: '拆分示范',
        table: {
          head: ['原形', '句子', '含义'],
          rows: [
            ['aufstehen 起床', 'Ich stehe um 7 Uhr auf.', '我 7 点起床。'],
            ['einkaufen 购物', 'Wir kaufen am Samstag ein.', '我们周六购物。'],
            ['anrufen 打电话', 'Er ruft mich an.', '他给我打电话。'],
            ['fernsehen 看电视', 'Sie sieht abends fern.', '她晚上看电视。'],
            ['mitkommen 一起来', 'Kommst du mit?', '你一起来吗？'],
          ],
        },
        tip: '常见可分前缀：ab- an- auf- aus- ein- mit- nach- vor- zu-。它们都重读（还记得发音第 10 课吗）。',
      },
      {
        h: '和情态动词连用时不拆',
        p: '有情态动词时，可分动词以完整原形待在句尾：',
        examples: [
          { de: 'Ich muss morgen früh aufstehen.', zh: '我明天必须早起。' },
          { de: 'Willst du mitkommen?', zh: '你想一起来吗？' },
        ],
      },
      {
        h: '不可分前缀',
        p: 'be- ge- er- ver- ent- emp- zer- 是不可分前缀（不重读、不拆分）：Ich verstehe dich. / Sie bezahlt.',
        examples: [
          { de: 'Ich verstehe das nicht.', zh: '我不明白。' },
          { de: 'Er bezahlt das Essen.', zh: '他付饭钱。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: '"我 7 点起床"（aufstehen）', options: ['Ich aufstehe um 7 Uhr.', 'Ich stehe um 7 Uhr auf.', 'Ich stehe auf um 7 Uhr.'], a: 1, explain: '前缀 auf 放句子最末尾。' },
      { type: 'choice', q: '"你今晚看电视吗？"（fernsehen）', options: ['Siehst du heute Abend fern?', 'Fernsiehst du heute Abend?', 'Siehst du fern heute Abend?'], a: 0, explain: '动词第一位（疑问句），前缀句尾。' },
      { type: 'fill', q: 'Er ruft seine Mutter ___.（anrufen，他给妈妈打电话）', a: ['an'], explain: '前缀 an 在句尾。' },
      { type: 'choice', q: 'Ich muss jetzt ___.（einkaufen，和情态动词连用）', options: ['kaufen ein', 'einkaufen', 'ein kaufen'], a: 1, explain: '有情态动词时可分动词整体放句尾，不拆。' },
      { type: 'choice', q: '下面哪个动词是不可分的？', options: ['mitkommen', 'aufstehen', 'verstehen'], a: 2, explain: 'ver- 是不可分前缀。' },
    ],
  },
  {
    id: 'g10',
    // 介词的横向对照搬到了第19课，这一课专心讲"第三格长什么样"。
    title: '第10课 · 第三格 Dativ',
    sub: 'dem / der / dem / den +n',
    sections: [
      {
        p: '第三格 Dativ 用于间接宾语（"给谁"、"对谁"）和一批固定介词之后。它是 A1 最后一块"格"的拼图。',
      },
      {
        h: '第三格冠词表',
        table: {
          head: ['', '阳性', '阴性', '中性', '复数'],
          rows: [
            ['第一格', 'der / ein', 'die / eine', 'das / ein', 'die'],
            ['第四格', 'den / einen', 'die / eine', 'das / ein', 'die'],
            ['第三格', 'dem / einem', 'der / einer', 'dem / einem', 'den + 名词加 -n'],
          ],
        },
        tip: '口诀"dem der dem den"。复数第三格名词还要加 -n：mit den Kindern。',
      },
      {
        h: '人称代词第三格',
        table: {
          head: ['第一格', '第三格', '例句'],
          rows: [
            ['ich → mir', 'du → dir', 'Kannst du mir helfen?（helfen 接三格）'],
            ['er → ihm', 'sie → ihr', 'Ich gebe ihm das Buch.'],
            ['wir → uns', 'ihr → euch', 'Das gehört uns.'],
            ['sie/Sie → ihnen/Ihnen', '', 'Wie geht es Ihnen?'],
          ],
        },
      },
      {
        h: '永远接第三格的介词（必背）',
        p: 'aus（从…出来）、bei（在…那里）、mit（和/用）、nach（去/在…之后）、seit（自从）、von（从/的）、zu（到…去）——口诀连读：aus-bei-mit-nach-seit-von-zu。',
        examples: [
          { de: 'Ich komme aus dem Supermarkt.', zh: '我从超市出来。' },
          { de: 'Sie wohnt bei ihrer Familie.', zh: '她住在家人那里。' },
          { de: 'Wir fahren mit dem Bus.', zh: '我们坐公交去。' },
          { de: 'Nach dem Essen gehe ich zur Arbeit.', zh: '饭后我去上班。（zur = zu der）' },
        ],
      },
      {
        h: '常用缩写',
        p: 'zu dem = zum，zu der = zur，bei dem = beim，von dem = vom，in dem = im，an dem = am。',
        examples: [
          { de: 'Ich gehe zum Arzt.', zh: '我去看医生。' },
          { de: 'Am Montag bin ich im Büro.', zh: '周一我在办公室。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: 'Ich fahre mit ___ Bus.（Bus 阳性）', options: ['der', 'den', 'dem'], a: 2, explain: 'mit 永远接第三格，阳性 → dem。' },
      { type: 'choice', q: 'Sie kommt aus ___ Schweiz.（Schweiz 阴性）', options: ['der', 'die', 'dem'], a: 0, explain: 'aus + 第三格，阴性 → der。' },
      { type: 'fill', q: 'Kannst du ___ helfen?（帮我）', a: ['mir'], explain: 'helfen 接第三格：mir。' },
      { type: 'choice', q: 'Wie geht es ___?（您好吗？）', options: ['Sie', 'Ihnen', 'Ihr'], a: 1, explain: 'es geht + 第三格：Ihnen。' },
      { type: 'choice', q: 'Ich gehe ___ Arzt.', options: ['zum', 'zur', 'zu'], a: 0, explain: 'Arzt 阳性：zu dem → zum。' },
      { type: 'fill', q: 'Er spielt mit den Kinder___.（和孩子们玩）', a: ['n'], explain: '复数第三格名词加 -n：Kindern。' },
    ],
  },
  {
    id: 'g11',
    title: '第11课 · 物主冠词与否定',
    sub: 'mein dein sein ihr… + nicht vs kein',
    sections: [
      {
        h: '物主冠词（我的、你的…）',
        table: {
          head: ['人称', '物主冠词', '例子'],
          rows: [
            ['ich', 'mein', 'mein Vater 我爸爸'],
            ['du', 'dein', 'dein Buch 你的书'],
            ['er/es', 'sein', 'sein Auto 他的车'],
            ['sie（她）', 'ihr', 'ihr Bruder 她哥哥'],
            ['wir', 'unser', 'unsere Familie 我们的家'],
            ['ihr', 'euer', 'euer Haus 你们的房子'],
            ['sie/Sie', 'ihr / Ihr', 'Ihre Frage 您的问题'],
          ],
        },
        tip: '物主冠词的词尾变化和 ein/kein 完全一样：阴性/复数加 -e（meine Mutter），阳性第四格加 -en（meinen Vater）。所以它们统称"ein 类词"。',
      },
      {
        h: '例句',
        examples: [
          { de: 'Das ist meine Schwester.', zh: '这是我妹妹。（阴性 +e）' },
          { de: 'Ich besuche meinen Bruder.', zh: '我去看我哥哥。（阳性第四格 +en）' },
          { de: 'Wie ist Ihre Telefonnummer?', zh: '您的电话号码是多少？' },
          { de: 'Seine Frau kommt aus Spanien.', zh: '他的妻子来自西班牙。' },
        ],
      },
      {
        h: 'nicht 还是 kein？一张表分清',
        table: {
          head: ['否定对象', '用词', '例子'],
          rows: [
            ['动词/形容词/整句', 'nicht', 'Ich rauche nicht. / Das ist nicht gut.'],
            ['带定冠词/物主冠词的名词', 'nicht', 'Das ist nicht mein Auto.'],
            ['带 ein 的名词', 'kein', 'Das ist kein Problem.'],
            ['无冠词名词', 'kein', 'Ich habe keine Zeit.'],
          ],
        },
        tip: 'nicht 的位置：否定整句时尽量靠后（Ich verstehe das nicht.），否定某个成分时放它前面（nicht heute, sondern morgen）。',
      },
      {
        h: '例句',
        examples: [
          { de: 'Ich verstehe das nicht.', zh: '我不明白。' },
          { de: 'Er hat kein Auto.', zh: '他没有车。' },
          { de: 'Das ist nicht meine Tasche.', zh: '这不是我的包。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: 'Das ist ___ Mutter.（我妈妈）', options: ['mein', 'meine', 'meinen'], a: 1, explain: 'Mutter 阴性 → meine。' },
      { type: 'choice', q: 'Ich besuche ___ Vater.（我看望我爸爸）', options: ['mein', 'meine', 'meinen'], a: 2, explain: '阳性第四格 → meinen。' },
      { type: 'choice', q: '"她的哥哥"是？', options: ['sein Bruder', 'ihr Bruder', 'dein Bruder'], a: 1, explain: '她的 → ihr。' },
      { type: 'choice', q: 'Ich habe ___ Hunger.', options: ['nicht', 'keinen', 'kein'], a: 1, explain: '无冠词名词用 kein；Hunger 阳性、haben 接四格 → keinen。' },
      { type: 'choice', q: 'Das ist ___ mein Handy.（这不是我的手机）', options: ['kein', 'keine', 'nicht'], a: 2, explain: '带物主冠词的名词用 nicht 否定。' },
      { type: 'fill', q: 'Wie ist ___ Name?（您贵姓？用尊称）', a: ['ihr'], explain: '尊称物主冠词 Ihr（大写）：Wie ist Ihr Name?' },
    ],
  },
  {
    id: 'g12',
    title: '第12课 · 完成时 Perfekt 入门',
    sub: '德语口语的"过去时"',
    sections: [
      {
        p: '德语口语里说过去的事，几乎都用完成时 Perfekt（书面语才多用过去时）。结构又是句框：haben/sein 变位放第二位 + 过去分词(Partizip II)放句尾。',
      },
      {
        h: '结构',
        table: {
          head: ['主语', '助动词(第二位)', '中间', '过去分词(句尾)'],
          rows: [
            ['Ich', 'habe', 'Deutsch', 'gelernt.'],
            ['Wir', 'haben', 'Pizza', 'gegessen.'],
            ['Sie', 'ist', 'nach Berlin', 'gefahren.'],
          ],
        },
      },
      {
        h: '过去分词怎么构成？',
        p: '规则动词（弱变化）：ge + 词干 + t → lernen→gelernt, machen→gemacht, kaufen→gekauft。\n不规则动词（强变化）：ge + 变化词干 + en → essen→gegessen, trinken→getrunken, sehen→gesehen（背词表）。\n可分动词：ge 插在前缀后 → einkaufen→eingekauft, aufstehen→aufgestanden。\n不可分前缀/-ieren 动词：没有 ge → verstehen→verstanden, studieren→studiert。',
      },
      {
        h: 'haben 还是 sein？',
        p: '绝大多数动词用 haben。用 sein 的是两类："位置移动"（gehen, fahren, kommen, fliegen）和"状态变化"（aufstehen, einschlafen），外加 sein/bleiben 本身。',
        examples: [
          { de: 'Ich habe ein Buch gekauft.', zh: '我买了一本书。' },
          { de: 'Was hast du gestern gemacht?', zh: '你昨天做了什么？' },
          { de: 'Er ist um sieben Uhr aufgestanden.', zh: '他七点起的床。' },
          { de: 'Wir sind nach Hause gegangen.', zh: '我们回家了。' },
          { de: 'Ich habe das nicht verstanden.', zh: '我（刚才）没听懂。' },
        ],
      },
      {
        h: '高频不规则分词（先背这几个）',
        table: {
          head: ['原形', '分词', '助动词', '含义'],
          rows: [
            ['essen', 'gegessen', 'haben', '吃'],
            ['trinken', 'getrunken', 'haben', '喝'],
            ['sehen', 'gesehen', 'haben', '看'],
            ['lesen', 'gelesen', 'haben', '读'],
            ['sprechen', 'gesprochen', 'haben', '说'],
            ['gehen', 'gegangen', 'sein', '走'],
            ['fahren', 'gefahren', 'sein', '乘/驾'],
            ['kommen', 'gekommen', 'sein', '来'],
          ],
        },
        tip: '学完这课，你已经可以谈论昨天发生的事了——这是 A1 语法的一个里程碑 🎉',
      },
    ],
    exercises: [
      { type: 'fill', q: 'Ich habe gestern Deutsch ___.（lernen）', a: ['gelernt'], explain: '规则动词：ge+lern+t。' },
      { type: 'choice', q: 'Wir ___ Pizza gegessen.', options: ['sind', 'haben', 'hat'], a: 1, explain: 'essen 用 haben；wir → haben。' },
      { type: 'choice', q: 'Sie ___ nach München gefahren.', options: ['hat', 'ist', 'haben'], a: 1, explain: 'fahren 是位置移动 → sein；sie(她) → ist。' },
      { type: 'choice', q: 'einkaufen 的过去分词是？', options: ['geeinkauft', 'eingekauft', 'einkauft'], a: 1, explain: '可分动词：ge 插中间 → eingekauft。' },
      { type: 'choice', q: 'studieren 的过去分词是？', options: ['gestudiert', 'studiert', 'gestudieren'], a: 1, explain: '-ieren 动词没有 ge-：studiert。' },
      { type: 'fill', q: 'Was hast du gestern ___?（machen）', a: ['gemacht'], explain: 'ge+mach+t。' },
    ],
  },
  {
    id: 'g13',
    title: '第13课 · 并列连词',
    sub: 'und oder aber denn also——A1 只有这一种连接方式',
    sections: [
      {
        p: 'A1 到这里为止说的都是短句。要把两句话接成一句，德语 A1 只给你一套工具：并列连词。它们最大的好处是不改变任何一边的语序——接上去之后，两边还是原来的样子。',
      },
      {
        h: '四个基本连词',
        table: {
          head: ['连词', '意思', '例句'],
          rows: [
            ['und', '和 / 然后', 'Ich gehe ins Kino und ich esse eine Pizza.'],
            ['oder', '或者', 'Trinkst du Kaffee oder Tee?'],
            ['aber', '但是', 'Ich möchte auch, aber ich habe keine Zeit.'],
            ['denn', '因为', 'Ich bleibe zu Hause, denn ich bin müde.'],
          ],
        },
        tip: 'aber 和 denn 前面要打逗号；und、oder 前面一般不打。',
      },
      {
        h: 'denn 后面动词不动',
        p: '这是最容易被英语和"以后会学到的 weil"带偏的一点。denn 只是把两个完整的句子接起来，它自己不占任何位置，所以后面照旧是「主语 + 动词」：',
        examples: [
          { de: 'Ich bin müde.', zh: '我累了。' },
          { de: 'Ich bleibe zu Hause, denn ich bin müde.', zh: '我待在家，因为我累了。' },
        ],
        tip: '会把动词踢到句尾的是 weil（Ich bleibe zu Hause, weil ich müde bin），那是 A2 的内容。Goethe A1 考纲里没有任何从句，看到 weil/dass/wenn 都可以先放过。',
      },
      {
        h: 'also 是唯一的例外',
        p: 'also（所以）表示结果。它和上面四个不同：also 自己算句子的第一位，所以后面要「动词 + 主语」。',
        examples: [
          { de: 'Ich bin müde, also gehe ich nach Hause.', zh: '我累了，所以我回家。' },
          { de: 'Es regnet, also bleiben wir hier.', zh: '下雨了，所以我们待在这儿。' },
        ],
        tip: '一句话记住：und/oder/aber/denn 后面「主语+动词」，also 后面「动词+主语」。',
      },
    ],
    exercises: [
      { type: 'choice', q: 'Ich bleibe zu Hause, ___ ich bin müde.（我待在家，因为我累了。）', options: ['denn', 'weil', 'aber', 'oder'], a: 0, explain: 'A1 的"因为"是 denn，后面语序不变。weil 是 A2。' },
      { type: 'choice', q: '哪一句是对的？', options: ['Ich bleibe zu Hause, denn ich müde bin.', 'Ich bleibe zu Hause, denn ich bin müde.', 'Ich bleibe zu Hause, denn bin ich müde.'], a: 1, explain: 'denn 后面还是「主语+动词」：ich bin。' },
      { type: 'choice', q: 'Ich bin müde, ___ gehe ich nach Hause.（所以）', options: ['denn', 'und', 'also', 'aber'], a: 2, explain: 'also = 所以，而且它后面动词要提前（gehe ich）。' },
      { type: 'choice', q: 'Trinkst du Kaffee ___ Tee?（还是）', options: ['und', 'oder', 'aber', 'denn'], a: 1, explain: '二选一用 oder。' },
      { type: 'fill', q: 'Ich möchte auch, ___ ich habe keine Zeit.（但是）', a: ['aber'], explain: 'aber 前面打逗号，后面语序不变。' },
      { type: 'fill', q: 'Es regnet, ___ bleiben wir hier.（所以）', a: ['also'], explain: 'also 占第一位，所以是 bleiben wir 而不是 wir bleiben。' },
    ],
  },
  {
    id: 'g14',
    title: '第14课 · 数字 · 钟点 · 日期',
    sub: '约时间、报电话、听懂车站广播，全靠这一课',
    sections: [
      {
        p: '数字是 A1 里唯一每天都要用、而且一错就误事的东西：约几点见面、报电话号码、听站台广播。德语数字有两个坑——两位数倒着念，报时围着整点说。',
      },
      {
        h: '0–12 与整十',
        table: {
          head: ['数', '德语', '数', '德语'],
          rows: [
            ['0 / 1', 'null / eins', '20', 'zwanzig'],
            ['2 / 3', 'zwei / drei', '30', 'dreißig'],
            ['4 / 5', 'vier / fünf', '40', 'vierzig'],
            ['6 / 7', 'sechs / sieben', '50', 'fünfzig'],
            ['8 / 9', 'acht / neun', '60', 'sechzig'],
            ['10 / 11 / 12', 'zehn / elf / zwölf', '100', 'hundert'],
          ],
        },
        tip: '13–19 都是「个位 + zehn」：dreizehn, vierzehn……只有 16 sechzehn 和 17 siebzehn 掉了字母，要单独记。',
      },
      {
        h: '两位数倒着念',
        p: '21 不是「二十一」，而是「一和二十」：ein + und + zwanzig，连成一个词写。',
        examples: [
          { de: 'Ich bin einundzwanzig Jahre alt.', zh: '我二十一岁。' },
          { de: 'Das Buch kostet siebenundvierzig Euro.', zh: '这本书四十七欧。' },
        ],
        tip: '德国人报电话号码常两位两位地念，所以「倒着念」必须练到不用想。',
      },
      {
        h: '几点了：口语围着整点说',
        table: {
          head: ['时间', '口语', '正式（24 小时制）'],
          rows: [
            ['8:15', 'Viertel nach acht', 'acht Uhr fünfzehn'],
            ['8:30', 'halb neun', 'acht Uhr dreißig'],
            ['8:45', 'Viertel vor neun', 'acht Uhr fünfundvierzig'],
            ['14:30', 'halb drei', 'vierzehn Uhr dreißig'],
          ],
        },
        tip: 'halb neun 是 8:30 不是 9:30——halb X 的意思是「还有半小时到 X 点」。车站、机场、广播一律用正式说法，数字依次读出。',
      },
      {
        h: '哪一天用 am，几点用 um',
        examples: [
          { de: 'Hast du am Montag Zeit?', zh: '你星期一有空吗？' },
          { de: 'Wir kommen am Montag um achtzehn Uhr.', zh: '我们星期一十八点来。' },
          { de: 'Ich habe am dritten Mai Geburtstag.', zh: '我五月三号生日。' },
        ],
        tip: '说「天」用 an（几乎都缩合成 am），说「钟点」用 um。日期要用序数词，跟 am 连用时词尾是 -en；1/3/7/8 的词干是特例：ersten, dritten, siebten, achten。',
      },
    ],
    exercises: [
      { type: 'choice', q: 'halb neun 是几点？', options: ['8:30', '9:30', '8:45', '9:15'], a: 0, explain: 'halb X = 还有半小时到 X 点，所以 halb neun 是 8:30。' },
      { type: 'choice', q: '47 怎么念？', options: ['vierundsiebzig', 'siebenundvierzig', 'vierzigsieben', 'siebzigvier'], a: 1, explain: '个位在前：sieben + und + vierzig。' },
      { type: 'choice', q: 'Der Zug fährt ___ acht Uhr.（八点开）', options: ['am', 'um', 'an', 'in'], a: 1, explain: '钟点用 um。' },
      { type: 'choice', q: '___ Montag habe ich Zeit.（星期一）', options: ['Um', 'Am', 'In', 'Von'], a: 1, explain: '星期几属于「天」，用 an → am。' },
      { type: 'fill', q: 'Es ist ___ neun.（8:30）', a: ['halb'], explain: 'halb 指向下一个整点。' },
      { type: 'fill', q: 'Ich bin ___ Jahre alt.（21 岁）', a: ['einundzwanzig'], explain: '个位在前，连写成一个词。' },
    ],
  },
  {
    id: 'g15',
    title: '第15课 · 命令式',
    sub: 'Sie / du / ihr 三种形式——问路、请求、指示都用它',
    sections: [
      {
        p: '命令式不只用来「命令」。问路得到的回答、店员的指示、说明书上的每一句，全是命令式。先把 Sie 形式练熟：它对陌生人永远不会失礼。',
      },
      {
        h: 'Sie 形式：原形 + Sie（最常用）',
        p: '动词原形放句首，紧跟着 Sie。形状和 Sie 的陈述句一模一样，只是动词被提到了最前面。',
        examples: [
          { de: 'Gehen Sie hier geradeaus und dann links.', zh: '您这里一直走，然后左转。' },
          { de: 'Nehmen Sie bitte Platz.', zh: '请您坐。' },
          { de: 'Warten Sie bitte einen Moment.', zh: '请您稍等一下。' },
        ],
        tip: '加一个 bitte，语气立刻从「指令」变成「请求」。位置很自由，句中句尾都行。',
      },
      {
        h: 'du 形式：拿 du 的变位去掉 -st',
        table: {
          head: ['原形', 'du 形式', '命令式'],
          rows: [
            ['kommen', 'du kommst', 'Komm!'],
            ['warten', 'du wartest', 'Warte!'],
            ['essen', 'du isst', 'Iss!'],
            ['nehmen', 'du nimmst', 'Nimm!'],
            ['fahren', 'du fährst', 'Fahr!'],
            ['sein', 'du bist', 'Sei!'],
          ],
        },
        tip: '换音动词有个分岔：e→i / e→ie 的换音**保留**（Iss! Nimm! Lies! Sprich!），但 a→ä 的换音**不保留**（Fahr! Schlaf!）。sein 是特例：Sei! / Seien Sie!',
      },
      {
        h: 'ihr 形式：把 ihr 去掉就行',
        examples: [
          { de: 'Kommt bitte um acht!', zh: '你们八点来！' },
          { de: 'Nehmt eure Bücher mit!', zh: '你们把书带上！' },
        ],
        tip: '三种里 ihr 形最省事：ihr kommt → Kommt!，动词一个字母都不改。',
      },
    ],
    exercises: [
      { type: 'choice', q: '问路时对方要说「您一直走」，是哪一句？', options: ['Gehen Sie geradeaus.', 'Gehst du geradeaus.', 'Geht geradeaus Sie.'], a: 0, explain: 'Sie 命令式 = 原形 + Sie，动词在句首。' },
      { type: 'choice', q: '对朋友说「吃吧！」', options: ['Ess!', 'Iss!', 'Isst!', 'Esse!'], a: 1, explain: 'du isst → 去掉 -st = Iss!，e→i 换音保留。' },
      { type: 'choice', q: '对朋友说「开车吧！」', options: ['Fähr!', 'Fährst!', 'Fahr!'], a: 2, explain: 'a→ä 的换音在命令式里不保留，用回 a。' },
      { type: 'choice', q: '对陌生人最得体的说法是？', options: ['Warten!', 'Warte!', 'Warten Sie bitte einen Moment.'], a: 2, explain: '对陌生人用 Sie 形式，再加 bitte。' },
      { type: 'fill', q: '___ Sie bitte Platz.（请您坐，nehmen）', a: ['Nehmen', 'nehmen'], explain: '原形 nehmen 放句首 + Sie。' },
      { type: 'fill', q: '___ bitte pünktlich!（你要准时，sein）', a: ['Sei', 'sei'], explain: 'sein 的 du 命令式是特例 Sei!。' },
    ],
  },
  {
    id: 'g16',
    title: '第16课 · 形容词作表语 · 比较',
    sub: 'A1 的形容词不变格；gut→besser，gern→lieber',
    sections: [
      {
        p: 'A1 的形容词有个大好消息：只要它跟在 sein 后面，就永远是原形，不管名词是什么性、是单数还是复数。（放在名词前面才要变词尾，那是 A2 的事。）',
      },
      {
        h: 'sein + 形容词：一个字母都不改',
        table: {
          head: ['句子', '中文'],
          rows: [
            ['Der Kaffee ist heiß.', '咖啡很烫。'],
            ['Die Lampe ist schön.', '这盏灯很好看。'],
            ['Das Zimmer ist groß.', '这房间很大。'],
            ['Die Bücher sind teuer.', '这些书很贵。'],
          ],
        },
        tip: '对比着记：ein schöner Tisch 里的 schön 要变词尾，Der Tisch ist schön. 里不用。A1 只考后一种。',
      },
      {
        h: '程度：sehr 和 zu',
        examples: [
          { de: 'Du bist sehr nett.', zh: '你人很好。' },
          { de: 'Der Kaffee ist zu heiß.', zh: '咖啡太烫了。' },
          { de: 'Sie ist schön, aber sie ist zu teuer.', zh: '它很好看，但太贵了。' },
        ],
        tip: 'sehr = 很（中性评价），zu = 太……了（几乎都在抱怨）。两个都不变格。',
      },
      {
        h: '比较：形容词 + -er + als',
        table: {
          head: ['原级', '比较级', '例句'],
          rows: [
            ['alt', 'älter', 'Er ist älter als ich.'],
            ['groß', 'größer', 'Er ist größer als ich.'],
            ['teuer', 'teurer', 'Der Computer ist teurer als das Buch.'],
            ['gut', 'besser', 'Er kocht besser als ich.'],
            ['gern', 'lieber', 'Ich koche lieber.'],
            ['viel', 'mehr', 'Ich mag Bücher mehr als Computer.'],
          ],
        },
        tip: 'als = 「比」。短单词常顺手带上变元音（alt→älter, groß→größer, jung→jünger）。gut / gern / viel 三个完全不规则，直接背。',
      },
      {
        h: '最高级：认识就够了',
        p: 'A1 不要求你主动造最高级，但菜单和广告上到处是它：am besten（最好）、am liebsten（最喜欢）、am größten（最大）。',
        examples: [
          { de: 'Ich trinke am liebsten Kaffee.', zh: '我最喜欢喝咖啡。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: 'Die Bücher sind ___.（这些书很贵）', options: ['teure', 'teuren', 'teuer', 'teurer'], a: 2, explain: 'sein 后面的形容词永远是原形，复数也不变。' },
      { type: 'choice', q: 'Der Kaffee ist ___ heiß.（太烫了）', options: ['sehr', 'zu', 'viel', 'mehr'], a: 1, explain: 'zu = 太……了，带负面语气。' },
      { type: 'choice', q: 'Er ist älter ___ ich.', options: ['als', 'wie', 'denn', 'so'], a: 0, explain: '比较用 als。' },
      { type: 'choice', q: 'gut 的比较级是？', options: ['guter', 'gutter', 'besser', 'mehr'], a: 2, explain: 'gut → besser，完全不规则。' },
      { type: 'fill', q: 'Ich koche gern, aber ich esse ___.（更喜欢）', a: ['lieber'], explain: 'gern → lieber。' },
      { type: 'fill', q: 'Der Computer ist ___ als das Buch.（更贵，teuer）', a: ['teurer'], explain: 'teuer → teurer，中间的 e 掉了。' },
    ],
  },
  {
    id: 'g17',
    title: '第17课 · 频率与地点副词',
    sub: 'immer oft nie · zuerst dann danach · links rechts geradeaus',
    sections: [
      {
        p: '这些小词不影响对错，却决定别人听不听得懂你在说什么时候、在说哪儿。它们都不变形，学起来只有两件事：意思，和放在句子的哪个位置。',
      },
      {
        h: '多常做：从 100% 到 0%',
        table: {
          head: ['副词', '大概频率', '例句'],
          rows: [
            ['immer', '总是', 'Ich stehe immer um sieben auf.'],
            ['oft', '经常', 'Wir lernen oft zusammen.'],
            ['manchmal', '有时', 'Manchmal koche ich zu Hause.'],
            ['selten', '很少', 'Ich trinke selten Bier.'],
            ['nie', '从不', 'Er kommt nie zu spät.'],
          ],
        },
        tip: '默认位置在变位动词后面。要强调时可以提到句首，但句首之后动词必须紧跟着——动词永远第二位：Manchmal koche ich…（不是 Manchmal ich koche…）。',
      },
      {
        h: '按顺序讲事情：zuerst · dann · danach',
        examples: [
          { de: 'Zuerst stehe ich auf, dann trinke ich Kaffee.', zh: '我先起床，然后喝咖啡。' },
          { de: 'Danach gehe ich zur Arbeit.', zh: '之后我去上班。' },
        ],
        tip: '这三个词最常放句首，于是每次都触发倒装：zuerst stehe ich，不是 zuerst ich stehe。讲一天的日程时它们是主干。',
      },
      {
        h: '在哪儿 · 往哪走',
        table: {
          head: ['词', '意思', '常见场合'],
          rows: [
            ['hier / dort', '这儿 / 那儿', 'Die Uhr ist dort links.'],
            ['links / rechts', '左 / 右', 'Gehen Sie dann links.'],
            ['geradeaus', '一直往前', 'Gehen Sie hier geradeaus.'],
            ['oben / unten', '上面 / 下面', 'Das Bad ist oben.'],
          ],
        },
        tip: '问路听到的答案基本就是这几个词加命令式，练熟这一组，问路就不会站在原地不敢动。',
      },
    ],
    exercises: [
      { type: 'choice', q: '「我从不喝咖啡」', options: ['Ich nie trinke Kaffee.', 'Ich trinke nie Kaffee.', 'Nie ich trinke Kaffee.'], a: 1, explain: '频率副词放在变位动词后面。' },
      { type: 'choice', q: 'Manchmal ___ ich zu Hause.', options: ['ich koche', 'koche', 'kochen', 'kocht'], a: 1, explain: '句首被 Manchmal 占了，动词必须第二位：Manchmal koche ich…' },
      { type: 'choice', q: '哪个表示「经常」？', options: ['nie', 'selten', 'oft', 'immer'], a: 2, explain: 'oft = 经常，比 immer 少、比 selten 多。' },
      { type: 'choice', q: '问路时听到「一直往前走」，关键词是？', options: ['links', 'rechts', 'geradeaus', 'oben'], a: 2, explain: 'geradeaus = 一直往前。' },
      { type: 'fill', q: '___ stehe ich auf, dann trinke ich Kaffee.（先）', a: ['Zuerst', 'zuerst'], explain: 'zuerst 放句首，后面立刻是动词。' },
      { type: 'fill', q: 'Ich stehe ___ um sieben auf.（总是）', a: ['immer'], explain: 'immer 放在变位动词 stehe 后面。' },
    ],
  },
  {
    id: 'g18',
    title: '第18课 · 人称代词的三种格',
    sub: '代词也要变格：ich → mich → mir',
    sections: [
      {
        p: '「我」在德语里有三个样子：ich（我做事）、mich（事情落在我身上）、mir（东西给我）。这一课之前，代词的三种格散在 sein、第四格、第三格三课里，从来没有一处把它们摆在一起——现在摆在一起。',
      },
      {
        h: '一张总表，背下来一劳永逸',
        table: {
          head: ['第一格（谁做）', '第四格（对谁做）', '第三格（给谁）'],
          rows: [
            ['ich 我', 'mich', 'mir'],
            ['du 你', 'dich', 'dir'],
            ['er 他', 'ihn', 'ihm'],
            ['sie 她', 'sie', 'ihr'],
            ['es 它', 'es', 'ihm'],
            ['wir 我们', 'uns', 'uns'],
            ['ihr 你们', 'euch', 'euch'],
            ['sie 他们', 'sie', 'ihnen'],
            ['Sie 您', 'Sie', 'Ihnen'],
          ],
        },
        tip: '真正要背的只有左边三行：ich/du/er 这一列变化最大。wir / ihr 的两个格长得一样，sie/Sie 只在第三格才变。',
      },
      {
        h: '什么时候用哪个',
        p: '被动作直接作用的那个东西 → 第四格；接受东西、受益的那个人 → 第三格。',
        examples: [
          { de: 'Wo ist Tom? Siehst du ihn?', zh: '汤姆在哪？你看见他了吗？' },
          { de: 'Kannst du mich morgen anrufen?', zh: '你明天能给我打电话吗？' },
          { de: 'Kannst du mir helfen?', zh: '你能帮我一下吗？' },
        ],
        tip: 'helfen、danken、gefallen 这几个动词只带第三格，跟中文的直觉正好相反：帮「我」是 mir 不是 mich。这是必须硬记的一小撮。',
      },
      {
        h: '代词替名词，要跟着名词的性走',
        p: '德语的「它」不是一个词。桌子是阳性，所以桌子是 er；灯是阴性，所以灯是 sie。',
        examples: [
          { de: 'Wo ist der Tisch? Er ist dort.', zh: '桌子在哪？它在那儿。' },
          { de: 'Die Uhr ist neu. Sie ist auch teuer.', zh: '这块表是新的。它也很贵。' },
        ],
        tip: '所以名词的性不是背着玩的——性错了，后面整段话的代词就全错。',
      },
      {
        h: '反身：动作绕回自己',
        p: '有些动词固定带一个「自己」，A1 见得最多的是 sich freuen（高兴）和 sich interessieren für（对……感兴趣）。',
        examples: [
          { de: 'Ich interessiere mich für Musik.', zh: '我对音乐感兴趣。' },
          { de: 'Wir freuen uns auf das Wochenende.', zh: '我们很期待周末。' },
        ],
      },
    ],
    exercises: [
      { type: 'choice', q: 'Wo ist Tom? Siehst du ___?', options: ['er', 'ihn', 'ihm', 'sein'], a: 1, explain: '「看见他」他是被看的对象 → 第四格 ihn。' },
      { type: 'choice', q: 'Kannst du ___ helfen?（帮我）', options: ['mich', 'mir', 'ich', 'mein'], a: 1, explain: 'helfen 只带第三格，所以是 mir。' },
      { type: 'choice', q: 'Wo ist die Uhr? ___ ist dort.', options: ['Er', 'Es', 'Sie', 'Ihr'], a: 2, explain: 'die Uhr 是阴性，代词用 sie。' },
      { type: 'choice', q: 'Kannst du ___ morgen anrufen?（给我打电话）', options: ['mir', 'mich', 'ich', 'mein'], a: 1, explain: 'anrufen 带第四格：打给我 = mich。和 helfen 正好相反，两个一起记。' },
      { type: 'fill', q: 'Ich interessiere ___ für Musik.', a: ['mich'], explain: 'sich interessieren 是反身动词，ich 对应 mich。' },
      { type: 'fill', q: 'Der Film gefällt ___ sehr.（我很喜欢这部电影）', a: ['mir'], explain: 'gefallen 只带第三格：这电影让「我」喜欢。' },
    ],
  },
  {
    id: 'g19',
    title: '第19课 · 介词',
    sub: '第三格介词 · 在哪儿 vs 往哪走 · 缩合形式',
    sections: [
      {
        p: '介词是 A1 里最容易「每个词都认识、连起来说不出」的地方。原因是它决定后面名词用哪个格。好消息：A1 要求的绝大多数介词，后面固定用第三格。',
      },
      {
        h: '固定第三格的七个介词',
        table: {
          head: ['介词', '意思', '例句'],
          rows: [
            ['aus', '来自 / 出自', 'Ich komme aus China.'],
            ['bei', '在……那儿', 'Ich wohne bei meiner Familie.'],
            ['mit', '和 / 用', 'Zahlen Sie mit Karte?'],
            ['nach', '往（城市国家）/ 之后', 'Wir fahren nach Berlin.'],
            ['seit', '自从', 'Ich lerne seit einem Jahr Deutsch.'],
            ['von', '从 / 属于', 'Das ist der Schlüssel von Anna.'],
            ['zu', '去（人或场所）', 'Ich gehe zum Arzt.'],
          ],
        },
        tip: '背成一串顺口的：aus – bei – mit – nach – seit – von – zu。它们后面永远第三格，没有例外。',
      },
      {
        h: '缩合：说话时几乎都会合起来',
        table: {
          head: ['原形', '缩合', '例子'],
          rows: [
            ['zu dem', 'zum', 'zum Bahnhof'],
            ['zu der', 'zur', 'zur Universität'],
            ['in dem', 'im', 'im Zimmer'],
            ['an dem', 'am', 'am Montag'],
            ['bei dem', 'beim', 'beim Arzt'],
            ['von dem', 'vom', 'vom Bahnhof'],
          ],
        },
        tip: '不缩合语法上也不算错，但听力里德国人 100% 缩合。听不出 zum / zur，就会漏掉半句话。',
      },
      {
        h: '在哪儿（wo）用第三格',
        examples: [
          { de: 'Die Uhr ist auf dem Tisch.', zh: '表在桌子上。' },
          { de: 'Sie lernt im Zimmer.', zh: '她在房间里学习。' },
          { de: 'Der Supermarkt ist neben der Bank.', zh: '超市在银行旁边。' },
        ],
        tip: 'in / an / auf / neben / vor / hinter / unter / über 这一组是「两面派」：回答 wo（在哪儿）用第三格，回答 wohin（往哪儿）用第四格。A1 主要考 wo。',
      },
      {
        h: 'zu 还是 nach？',
        p: '这是中国学习者最常出错的一对：去城市、国家用 nach；去人、去具体场所用 zu。',
        examples: [
          { de: 'Wir fahren nach Berlin.', zh: '我们去柏林。' },
          { de: 'Ich gehe zum Bahnhof.', zh: '我去火车站。' },
          { de: 'Ich gehe nach Hause.', zh: '我回家。' },
        ],
        tip: 'nach Hause（回家）和 zu Hause（在家）是固定搭配，一起背。',
      },
    ],
    exercises: [
      { type: 'choice', q: 'Ich komme ___ China.', options: ['von', 'aus', 'zu', 'nach'], a: 1, explain: '来自某个国家用 aus。' },
      { type: 'choice', q: 'Wir fahren ___ Berlin.', options: ['zu', 'nach', 'in', 'bei'], a: 1, explain: '去城市用 nach。' },
      { type: 'choice', q: 'Ich gehe ___ Arzt.（去看医生）', options: ['nach dem', 'zum', 'zur', 'im'], a: 1, explain: 'der Arzt 是阳性 → zu dem = zum。' },
      { type: 'choice', q: 'Die Uhr ist auf ___ Tisch.', options: ['der', 'den', 'dem', 'das'], a: 2, explain: '回答「在哪儿」用第三格：dem Tisch。' },
      { type: 'fill', q: 'Ich fahre ___ Universität.（去大学，die Universität）', a: ['zur'], explain: '阴性 → zu der = zur。' },
      { type: 'fill', q: 'Zahlen Sie ___ Karte?（用卡付）', a: ['mit'], explain: 'mit = 用，后面永远第三格。' },
    ],
  },
  {
    id: 'g20',
    title: '第20课 · man · es gibt · 虚位 es',
    sub: '不说是谁做的，怎么说',
    sections: [
      {
        p: '德语有一小撮句子没有真正的主语——「有一家超市」「下雨了」「八点了」。中文这些句子干脆不要主语，德语必须摆一个词在那儿占位。占位的就是 es 和 man。',
      },
      {
        h: 'es gibt + 第四格 = 「有」',
        p: 'es gibt 是一个整体，不管后面是一个还是一堆，永远是 es gibt。后面的名词一律用第四格。',
        examples: [
          { de: 'Es gibt einen Supermarkt hier.', zh: '这儿有一家超市。' },
          { de: 'Gibt es hier ein Restaurant?', zh: '这儿有餐馆吗？' },
        ],
        tip: '别用 haben 说「某地有什么」。「这儿有一家超市」不是 Hier hat einen Supermarkt，德语必须 Es gibt。',
      },
      {
        h: 'man = 泛指的「人们 / 大家 / 你」',
        p: 'man 不是「男人」（那是 der Mann，两个 n）。它指不特定的任何人，动词按第三人称单数变位。',
        examples: [
          { de: 'Was kann man am Sonntag in der Stadt machen?', zh: '周日在城里可以做什么？' },
          { de: 'Nach dem Film kann man im Garten zusammen essen.', zh: '看完电影可以在花园里一起吃饭。' },
        ],
        tip: '规则、告示、说明书几乎句句是 man：Hier darf man nicht rauchen.（这里不许抽烟。）看到 man 就想成中文里省略掉的那个「你/大家」。',
      },
      {
        h: '天气和时间：es 只是占位',
        examples: [
          { de: 'Es regnet.', zh: '下雨了。' },
          { de: 'Es ist schon spät. Es ist halb elf.', zh: '已经很晚了。十点半了。' },
        ],
        tip: '这里的 es 不指任何东西，但一个字也不能省——德语句子必须有主语。',
      },
    ],
    exercises: [
      { type: 'choice', q: '「这儿有一家超市。」', options: ['Hier hat einen Supermarkt.', 'Es gibt einen Supermarkt hier.', 'Hier ist einen Supermarkt.'], a: 1, explain: '「某地有什么」用 es gibt，不用 haben。' },
      { type: 'choice', q: 'Es gibt ___ Restaurant hier.', options: ['ein', 'einen', 'einem', 'eines'], a: 0, explain: 'es gibt 后面用第四格；das Restaurant 是中性，第四格还是 ein。' },
      { type: 'choice', q: 'Was kann ___ am Sonntag machen?', options: ['man', 'Mann', 'men', 'jemand'], a: 0, explain: 'man = 泛指的人，一个 n，小写。' },
      { type: 'choice', q: 'man 后面的动词用哪种变位？', options: ['像 ich', '像 du', '像 er/sie/es', '像 wir'], a: 2, explain: 'man 按第三人称单数走：man kann, man macht。' },
      { type: 'fill', q: '___ regnet.（下雨了）', a: ['Es', 'es'], explain: '天气句用虚位 es，不能省。' },
      { type: 'fill', q: '___ gibt hier ein Restaurant?（这儿有餐馆吗？）', a: ['Gibt', 'gibt'], explain: '疑问句把 gibt 提到最前：Gibt es…？' },
    ],
  },
];

/* ==========================================================================
 * 语法课 ↔ 其余模块的接线表
 *
 * 全站早就有一套技能标签（course.js 每道题上的 skills，喂 md.skills.v1 掌握度），
 * 但体系化语法课一直不在里面——练完 g08 情态动词，掌握度纹丝不动。
 * 下表把 g## 挂到**已经存在**的标签上，于是：
 *   · 语法课练习开始喂掌握度，语法课列表能显示真实进度
 *   · 语法课 ↔ 微步课自动连通（共享标签即可，不需要再手写一张课程映射表）
 *   · 精读精听靠 grammarPrereqs → g## → 标签，能查"这篇需要的语法你掌握了没"
 *
 * 硬约束：只能写 course.js 里真实出现过的标签。写错一个字（v2-word-order vs
 * v2-order）掌握度就永远是 0，且不会报错——所以 tests/grammar-link.test.mjs
 * 会逐个校验标签存在。
 * ========================================================================== */
const GRAMMAR_SKILLS = {
  g01: ['sein-sg', 'sein-pl', 'pron-sg', 'sie-formal', 'du-vs-sie', 'du-sie'],
  g02: ['verb-reg', 'haben-conj', 'kommen-wohnen'],
  g03: ['noun-gender', 'def-article', 'indef-article'],
  g04: ['plural'],
  g05: ['v2-order', 'w-frage', 'w-frage-basic', 'frag-order'],
  g06: ['akk-masc-only', 'akk-review', 'kein-basic'],
  g07: ['vowel-change-ei', 'vowel-change-ae', 'wissen'],
  g08: ['modal-koennen-wollen', 'modal-muessen-sollen', 'modal-duerfen', 'moechten', 'satzklammer', 'modal-bracket'],
  g09: ['separable-verbs', 'separable-verb'],
  g10: ['dativ-dem-der', 'gefallen-dat'],
  g11: ['possessive-basic', 'possessive-agree', 'nicht-kein'],
  g12: ['perfekt-intro', 'perfekt-haben', 'perfekt-sein', 'perfekt-narrate', 'war-hatte'],
  g13: ['conj-coord', 'conj-denn'],
  // g14–g20 补齐全景图上原本"缺系统讲解"的七格。
  // 其中 g18 / g19 是横向汇总课：代词的三个格原本散在 g03 / g06 / g10，
  // 介词原本挂在 g10 名下。标签跟着讲解课搬家，一个标签只能归一课，
  // 否则同一次答题会被两课同时计入掌握度（tests/grammar-link.test.mjs 会拦）。
  g14: ['numbers-1-20', 'numbers-tens', 'numbers-compound', 'numbers-large',
    'prep-time-an-um', 'time-formal', 'time-informal', 'ordinal-date'],
  g15: ['imperative-du'],
  g16: ['pred-adj', 'zu-adj', 'comparative'],
  g17: ['sequence-adverbs'],
  g18: ['pronoun-replace', 'pronoun-akk', 'pronoun-dativ', 'reflexive-prep'],
  g19: ['prep-dativ-zu', 'zu-dativ', 'location-dativ'],
  g20: ['es-impersonal'],
};

/** 精读/精听的 grammarPrereqs 自由文本标签 → 讲这个点的语法课。 */
export const PREREQ_TO_GRAMMAR = {
  sein: ['g01'],
  haben: ['g02'],
  'regular-verbs': ['g02'],
  'noun-gender': ['g03'],
  'ein-eine': ['g03'],
  plural: ['g04'],
  'w-questions': ['g05'],
  'v2-word-order': ['g05'],
  accusative: ['g06'],
  'kein-nicht': ['g06', 'g11'],
  'separable-verbs': ['g09'],
  dative: ['g10'],
  // 地点介词要求第三格，所以两课都算前置：g10 讲格，g19 讲介词本身。
  'location-prepositions': ['g10', 'g19'],
  'modal-verbs': ['g08'],
  'sentence-bracket': ['g08'],
  'war-hatte': ['g12'],
  'perfect-with-haben': ['g12'],
  'perfect-with-sein': ['g12'],
  // 时间表达（um/am、halb、序数日期）原来没有对应的讲解课，只能登记为空。
  // g14 补上之后它有了真正的去处。
  time: ['g14'],
};

// 曾经有一张 GRAMMAR_GAPS 表，记录"微步课在教、但 12 课语法体系没讲"的语法点。
// g14–g20 补齐之后这张表全空了，删掉——留着一张永远为空的表比没有更容易误导。

export const GRAMMAR_LESSONS = RAW_LESSONS.map(lesson => ({
  ...lesson,
  skills: GRAMMAR_SKILLS[lesson.id] || [],
}));

/** 某个技能标签属于哪一课语法课（没有对应课则返回 null）。 */
const SKILL_TO_GRAMMAR = new Map();
for (const [id, skills] of Object.entries(GRAMMAR_SKILLS)) {
  for (const skill of skills) SKILL_TO_GRAMMAR.set(skill, id);
}
export function grammarIdForSkill(skill) {
  return SKILL_TO_GRAMMAR.get(skill) || null;
}

/** 一份内容的 grammarPrereqs → 去重后的语法课 id，按课序排列。 */
export function grammarIdsForPrereqs(prereqs = []) {
  const out = new Set();
  for (const tag of prereqs) for (const id of PREREQ_TO_GRAMMAR[tag] || []) out.add(id);
  return [...out].sort();
}
