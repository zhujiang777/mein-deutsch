// 体系化语法课：12 课，按 A1 大纲编排
// sections: { h?, p?, tip?, table?{head,rows}, examples?[{de,zh}] }
// exercises: { type:'choice', q, options, a(索引), explain } | { type:'fill', q, a:[答案], explain }
export const GRAMMAR_LESSONS = [
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
    title: '第10课 · 第三格 Dativ 与常用介词',
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
];
