// 课程路径：单元 → 微步课 → 步骤
// 对齐 Nicos Weg A1 章节进度（learngerman.dw.com），讲解原创中文
// 步骤类型：teach / example(内嵌) / recap 为信息卡；
// 练习：choice / listenChoice / assemble / dictation / fill / match / translate / speak
// 展示/复述：scene / observe / reproduce / roleplay
// unit.track: 'grammar'（语法主线）| 'scene'（场景口语），双泳道各自顺序解锁
// 数据字段规范见 docs/schema.md

export const COURSE = [
  {
    id: 'u1',
    title: '第1单元 · Hallo! 我是谁',
    icon: '👋',
    track: 'grammar',
    intro: '学会用德语介绍自己：动词 sein（是）的全部变位。',
    nicosWeg: { name: 'Nicos Weg A1 · Hallo! / Wie heißt du?', url: 'https://learngerman.dw.com/zh/beginners/c-36519789' },
    videos: [],
    lessons: [
      {
        id: 'u1l1',
        title: 'ich bin · du bist',
        skills: ['sein-sg', 'pron-sg'],
        steps: [
          { type: 'scene', title: '安娜认识马克斯', lines: [
            { who: 'Anna', de: 'Hallo! Ich bin Anna.', zh: '你好！我是安娜。' },
            { who: 'Max', de: 'Hallo, Anna! Ich bin Max.', zh: '你好，安娜！我是马克斯。' },
            { who: 'Anna', de: 'Freut mich, Max!', zh: '很高兴认识你，马克斯！' },
            { who: 'Max', de: 'Freut mich auch! Bist du Studentin?', zh: '我也是！你是大学生吗？' },
            { who: 'Anna', de: 'Ja, ich bin Studentin. Und du?', zh: '是的，我是大学生。你呢？' },
            { who: 'Max', de: 'Ich bin auch Student.', zh: '我也是大学生。' },
            { who: 'Anna', de: 'Bist du müde?', zh: '你累吗？' },
            { who: 'Max', de: 'Nein, ich bin nicht müde.', zh: '不，我不累。' },
          ] },
          { type: 'observe',
            intro: '观察 ich 和 du 后面配的 sein 动词一样吗？',
            lines: [
              { de: 'Ich bin Anna.', zh: '我是安娜。', hl: 'bin' },
              { de: 'Bist du Studentin?', zh: '你是大学生吗？', hl: 'Bist' },
            ],
            q: 'ich 和 du 搭配的 sein 动词形式一样吗？',
            options: ['一样，都用 bin', '不一样，ich 配 bin，du 配 bist', '不一样，ich 配 bist，du 配 bin'], a: 1,
            explain: '德语动词随主语变化：ich 永远配 bin，du 永远配 bist——这就是这节课要练熟的重点。',
            skills: ['sein-sg'] },
          { type: 'teach', h: '德语动词会"变身"', p: '德语和英语一样，动词跟着主语变化：I am / you are → ich bin / du bist。\n这节课只学两个：我(ich) 和 你(du) 配上动词 sein（是）。', tip: '一次只记一点，马上就练——这是最快的路。' },
          { type: 'teach', h: 'ich bin = 我是', example: { de: 'Ich bin Anna.', zh: '我是安娜。' } },
          { type: 'choice', prompt: 'Ich ___ Student.（我是大学生。）', options: ['bin', 'bist', 'ist'], a: 0, explain: 'ich 永远配 bin。', skills: ['sein-sg'] },
          { type: 'teach', h: 'du bist = 你是', p: 'du 用于朋友、家人、同学之间。', example: { de: 'Du bist nett.', zh: '你人真好。' } },
          { type: 'choice', prompt: 'Du ___ nett.（你人真好。）', options: ['bin', 'bist', 'ist'], a: 1, explain: 'du 永远配 bist。', skills: ['sein-sg'] },
          { type: 'listenChoice', audioText: 'Ich bin müde.', options: ['我累了。', '你很好。', '我是学生。'], a: 0, explain: 'müde = 疲惫的。', skills: ['sein-sg'] },
          { type: 'assemble', zh: '我是学生。', answer: 'Ich bin Student.', distractors: ['bist'], explain: 'ich + bin，动词第二位。', skills: ['sein-sg', 'v2-order'] },
          { type: 'fill', prompt: 'Du ___ mein Freund.（你是我的朋友。）', a: ['bist'], explain: 'du → bist。', skills: ['sein-sg'] },
          { type: 'assemble', zh: '你非常好。', answer: 'Du bist sehr nett.', distractors: ['bin'], skills: ['sein-sg', 'v2-order'] },
          { type: 'dictation', audioText: 'Ich bin Anna.', distractors: ['bist', 'du'], skills: ['sein-sg'] },
          { type: 'speak', de: 'Ich bin Anna und du bist Max.', zh: '我是安娜，你是马克斯。' },
          { type: 'reproduce', de: 'Ich bin auch Student.', zh: '我也是大学生。' },
          { type: 'reproduce', de: 'Bist du müde?', zh: '你累吗？' },
          { type: 'recap', h: '这课你学会了', p: 'ich bin（我是）· du bist（你是）\n下一课：他/她是、以及对陌生人怎么说"您"。', tip: '错过的题明天会自动出现在"今日学习"里。' },
        ],
      },
      {
        id: 'u1l2',
        title: 'er/sie ist · Sie sind（尊称）',
        skills: ['sein-sg', 'sie-formal'],
        steps: [
          { type: 'scene', title: '安娜介绍新朋友', lines: [
            { who: 'Anna', de: 'Max, das ist Lena.', zh: '马克斯，这是莱娜。' },
            { who: 'Max', de: 'Hallo Lena! Bist du auch Studentin?', zh: '你好，莱娜！你也是大学生吗？' },
            { who: 'Lena', de: 'Ja, ich bin Studentin.', zh: '是的，我是大学生。' },
            { who: 'Anna', de: 'Sie ist meine Freundin. Sie ist sehr nett.', zh: '她是我的朋友。她人很好。' },
            { who: 'Max', de: 'Freut mich, Lena!', zh: '很高兴认识你，莱娜！' },
            { who: 'Anna', de: 'Guten Tag, Frau Müller! Sind Sie Lehrerin?', zh: '您好，米勒女士！您是老师吗？' },
            { who: 'Frau Müller', de: 'Ja, ich bin die Lehrerin.', zh: '是的，我是老师。' },
            { who: 'Max', de: 'Freut mich, Frau Müller!', zh: '很高兴认识您，米勒女士！' },
          ] },
          { type: 'observe',
            intro: '观察这两句里的 sie 和 Sie：都表示同一个意思吗？',
            lines: [
              { de: 'Sie ist meine Freundin.', zh: '她是我的朋友。', hl: 'Sie ist' },
              { de: 'Sind Sie Lehrerin?', zh: '您是老师吗？', hl: 'Sind Sie' },
            ],
            q: '这两句里的 Sie 是同一个词吗？',
            options: ['是同一个词，都指"你们"', '不是：第一句 sie=她，第二句 Sie=您（尊称）', '不是：两句都是"她们"'], a: 1,
            explain: '拼写一样的 sie/Sie 靠动词区分：她 sie 配 ist，尊称 Sie 配 sind。句首大写不算数，只有真正表示"您"的 Sie 才是敬称。',
            skills: ['sie-formal', 'sein-sg'] },
          { type: 'teach', h: '他是 / 她是 / 它是', p: 'er（他）、sie（她）、es（它）都配 ist。', example: { de: 'Er ist Student.', zh: '他是大学生。' } },
          { type: 'choice', prompt: 'Sie (她) ___ nett.（她人很好。）', options: ['bin', 'bist', 'ist'], a: 2, explain: 'er/sie/es 配 ist。', skills: ['sein-sg'] },
          { type: 'example', h: '', example: { de: 'Das ist mein Bruder. Er ist müde.', zh: '这是我哥哥。他累了。', note: '先用 Das ist… 引出人，再用 er/sie 指代。' } },
          { type: 'fill', prompt: 'Das ___ meine Schwester.（这是我妹妹。）', a: ['ist'], explain: 'das 也配 ist。', skills: ['sein-sg'] },
          { type: 'teach', h: '对陌生人说"您"：Sie', p: '对陌生成年人、正式场合用 Sie（永远大写），配 sind。\n这是德国文化的重要礼节：店员、司机、老师，第一次见都用 Sie。', example: { de: 'Sind Sie Frau Müller?', zh: '您是米勒女士吗？' } },
          { type: 'choice', prompt: '___ Sie Herr Wang?（您是王先生吗？）', options: ['Bist', 'Ist', 'Sind'], a: 2, explain: '尊称 Sie 永远配 sind。', skills: ['sie-formal'] },
          { type: 'choice', prompt: '在面包店问店员，用哪个"你/您"？', options: ['du', 'Sie'], a: 1, explain: '对陌生人一律用 Sie，用 du 会显得失礼。', skills: ['sie-formal'] },
          { type: 'assemble', zh: '她是我的老师。', answer: 'Sie ist meine Lehrerin.', distractors: ['sind', 'bist'], skills: ['sein-sg'] },
          { type: 'listenChoice', audioText: 'Er ist sehr nett.', options: ['他人很好。', '她很累。', '您好吗？'], a: 0, skills: ['sein-sg'] },
          { type: 'dictation', audioText: 'Sind Sie Frau Müller?', distractors: ['ist', 'bist'], skills: ['sie-formal'] },
          { type: 'speak', de: 'Das ist mein Bruder. Er ist Student.', zh: '这是我哥哥。他是大学生。' },
          { type: 'reproduce', de: 'Sie ist meine Freundin.', zh: '她是我的朋友。' },
          { type: 'reproduce', de: 'Sind Sie Lehrerin?', zh: '您是老师吗？' },
          { type: 'recap', h: '这课你学会了', p: 'er/sie/es ist（他/她/它是）· Sie sind（您是，尊称大写）\n口诀：单数配 ist，尊称配 sind。' },
        ],
      },
      {
        id: 'u1l3',
        title: 'wir sind · ihr seid · sie sind',
        skills: ['sein-pl', 'sein-sg'],
        steps: [
          { type: 'scene', title: '两组朋友互相认识', lines: [
            { who: 'Anna', de: 'Wir sind Studenten aus China.', zh: '我们是来自中国的大学生。' },
            { who: 'Max', de: 'Wir lernen Deutsch.', zh: '我们在学德语。' },
            { who: 'Lena', de: 'Wir sind Studenten aus Deutschland.', zh: '我们是来自德国的大学生。' },
            { who: 'Tom', de: 'Ihr seid auch Studenten!', zh: '你们也是大学生！' },
            { who: 'Anna', de: 'Ja! Und ihr seid Studenten aus Deutschland.', zh: '是的！你们是来自德国的大学生。' },
            { who: 'Max', de: 'Gut, wir sind jetzt Freunde!', zh: '太好了，我们现在是朋友了！' },
            { who: 'Lena', de: 'Ja, wir sind Freunde!', zh: '是的，我们是朋友！' },
            { who: 'Tom', de: 'Anna und Max sind auch nett!', zh: '安娜和马克斯也很友好！' },
          ] },
          { type: 'observe',
            intro: '观察这组对话：wir 和 ihr 各配哪个 sein 形式？',
            lines: [
              { de: 'Wir sind Studenten aus China.', zh: '我们是来自中国的大学生。', hl: 'sind' },
              { de: 'Ihr seid auch Studenten!', zh: '你们也是大学生！', hl: 'seid' },
            ],
            q: 'wir 和 ihr 搭配的 sein 形式一样吗？',
            options: ['一样，都用 sind', '不一样，wir 配 sind，ihr 配 seid', '不一样，wir 配 seid，ihr 配 sind'], a: 1,
            explain: 'wir 配 sind，ihr 配 seid——ihr seid 是全表最容易忘的一个，多说几遍就记住了。',
            skills: ['sein-pl'] },
          { type: 'teach', h: '复数三兄弟', p: 'wir（我们）→ sind\nihr（你们）→ seid\nsie（他们）→ sind\n注意"她 sie ist"和"他们 sie sind"拼写一样，靠动词区分！', example: { de: 'Wir sind aus China.', zh: '我们来自中国。' } },
          { type: 'choice', prompt: 'Wir ___ Studenten.（我们是大学生。）', options: ['sind', 'seid', 'ist'], a: 0, explain: 'wir → sind。', skills: ['sein-pl'] },
          { type: 'fill', prompt: 'Ihr ___ jung.（你们很年轻。）', a: ['seid'], explain: 'ihr → seid，全表最容易忘的一个！', skills: ['sein-pl'] },
          { type: 'choice', prompt: 'Sie ___ Lehrer.（他们是老师。）', options: ['ist', 'sind', 'seid'], a: 1, explain: '他们 sie → sind。', skills: ['sein-pl'] },
          { type: 'teach', h: '全表完整版', table: { head: ['人称', 'sein', '例'], rows: [['ich', 'bin', 'Ich bin müde.'], ['du', 'bist', 'Du bist nett.'], ['er/sie/es', 'ist', 'Er ist Student.'], ['wir', 'sind', 'Wir sind hier.'], ['ihr', 'seid', 'Ihr seid jung.'], ['sie/Sie', 'sind', 'Sie sind Lehrer.']] }, tip: '口诀：bin bist ist，sind seid sind。' },
          { type: 'match', pairs: [ { de: 'ich bin', zh: '我是' }, { de: 'du bist', zh: '你是' }, { de: 'wir sind', zh: '我们是' }, { de: 'ihr seid', zh: '你们是' } ], skills: ['sein-sg', 'sein-pl'] },
          { type: 'assemble', zh: '我们来自中国。', answer: 'Wir sind aus China.', distractors: ['seid', 'bin'], skills: ['sein-pl'] },
          { type: 'listenChoice', audioText: 'Wir sind aus China.', options: ['我们来自中国。', '你们很年轻。', '他们是老师。'], a: 0, skills: ['sein-pl'] },
          { type: 'dictation', audioText: 'Ihr seid jung.', distractors: ['sind', 'ist'], skills: ['sein-pl'] },
          { type: 'translate', zh: '我们是大学生。', a: ['Wir sind Studenten', 'Wir sind Studenten.'], explain: 'wir + sind + 复数名词。', skills: ['sein-pl'] },
          { type: 'speak', de: 'Wir sind aus China und wir lernen Deutsch.', zh: '我们来自中国，我们在学德语。' },
          { type: 'reproduce', de: 'Wir sind Studenten aus China.', zh: '我们是来自中国的大学生。' },
          { type: 'reproduce', de: 'Ihr seid auch Studenten!', zh: '你们也是大学生！' },
          { type: 'recap', h: '恭喜！sein 全部拿下', p: '你已经掌握德语最重要的动词。sein 的六个形态会在后面所有课程里反复出现，忘了也没关系——系统会安排复习。' },
        ],
      },
    ],
  },

  /* ===== 场景口语线：初来乍到（S1-S3） ===== */
  {
    id: 's-a',
    title: '初来乍到',
    icon: '🗣️',
    track: 'scene',
    intro: '跟着交换生 Mia 的第一周：认识室友、去咖啡馆、逛超市——把最常用的场景对话练到脱口而出。',
    lessons: [
      {
        id: 'sa-l1',
        title: '打招呼与自我介绍 Kennenlernen',
        skills: ['greet-intro', 'du-sie'],
        vocabRefs: ['w016', 'w235', 'w017', 'w022', 'w023', 'w031', 'w032', 'w003'],
        steps: [
          { type: 'scene', title: '到宿舍的第一天', lines: [
            { who: 'Herr Berger', de: 'Guten Tag! Wie heißen Sie?', zh: '您好！您叫什么名字？' },
            { who: 'Mia', de: 'Guten Tag! Ich heiße Mia.', zh: '您好！我叫米娅。' },
            { who: 'Herr Berger', de: 'Woher kommen Sie?', zh: '您从哪儿来？' },
            { who: 'Mia', de: 'Ich komme aus China.', zh: '我来自中国。' },
            { who: 'Herr Berger', de: 'Willkommen! Hier ist Ihr Schlüssel.', zh: '欢迎！这是您的钥匙。' },
            { who: 'Mia', de: 'Danke schön!', zh: '非常感谢！' },
            { who: 'Jonas', de: 'Hallo! Ich bin Jonas. Wie heißt du?', zh: '嗨！我是约纳斯。你叫什么名字？' },
            { who: 'Mia', de: 'Ich heiße Mia. Ich komme aus China.', zh: '我叫米娅，我来自中国。' },
            { who: 'Jonas', de: 'Freut mich! Ich komme aus Deutschland.', zh: '很高兴认识你！我来自德国。' },
            { who: 'Mia', de: 'Ich studiere Musik. Und du?', zh: '我学音乐专业，你呢？' },
            { who: 'Jonas', de: 'Ich studiere Sport.', zh: '我学体育专业。' },
            { who: 'Mia', de: 'Schön, freut mich!', zh: '太好了，很高兴认识你！' },
          ] },
          { type: 'teach', h: '认识新朋友的开场语', table: {
            head: ['词块', '例句', '中文'],
            rows: [
              ['Ich heiße …', 'Ich heiße Mia.', '我叫……'],
              ['Freut mich!', 'Freut mich, Mia!', '很高兴认识你！'],
              ['Und du?', 'Ich komme aus China. Und du?', '那你呢？（对同龄人）'],
              ['Wie heißt du?', 'Hallo! Wie heißt du?', '你叫什么名字？（对同龄人）'],
            ],
          }, example: { de: 'Ich heiße Mia. Freut mich!', zh: '我叫米娅，很高兴认识你！' } },
          { type: 'teach', h: '说说你从哪来、学什么', table: {
            head: ['词块', '例句', '中文'],
            rows: [
              ['Ich komme aus …', 'Ich komme aus China.', '我来自……'],
              ['Ich studiere …', 'Ich studiere Musik.', '我学……专业'],
              ['Wie heißen Sie?', 'Guten Tag! Wie heißen Sie?', '您叫什么名字？（正式）'],
            ],
          }, example: { de: 'Ich komme aus China. Ich studiere Musik.', zh: '我来自中国，我学音乐专业。' } },
          { type: 'observe',
            intro: '跟 Herr Berger（管理员，正式场合）和跟 Jonas（同龄同学）打招呼，问名字的说法一样吗？',
            lines: [
              { de: 'Wie heißen Sie?', zh: '您叫什么名字？', hl: 'heißen Sie' },
              { de: 'Wie heißt du?', zh: '你叫什么名字？', hl: 'heißt du' },
            ],
            q: '对管理员 Herr Berger 和对同学 Jonas，用的"你/您"一样吗？',
            options: ['一样，都用 heißen Sie', '不一样：对 Herr Berger 用 Sie，对 Jonas 用 du', '不一样，但两个都是错的'], a: 1,
            explain: '对不熟悉的成年人、正式场合（管理员、老师、店员）用 Sie；对同龄人、朋友用 du。两种问法配的动词形式也不同：heißen Sie／heißt du。',
            skills: ['du-sie'] },
          { type: 'choice', prompt: '自我介绍"我叫米娅"，德语怎么说？', options: ['Ich heiße Mia.', 'Ich komme Mia.', 'Ich bin aus Mia.'], a: 0, explain: 'heißen 表示"叫……名字"，heißen 后面直接接名字。', skills: ['greet-intro'] },
          { type: 'listenChoice', audioText: 'Freut mich!', options: ['很高兴认识你！', '你从哪儿来？', '再见！'], a: 0, explain: 'Freut mich! 是认识新朋友时的固定说法。', skills: ['greet-intro'] },
          { type: 'fill', prompt: 'Ich ___ aus China.（我来自中国。）', a: ['komme'], hint: 'komm…', explain: 'ich komme（第一人称变位）。', skills: ['greet-intro'] },
          { type: 'assemble', zh: '你从哪儿来？', answer: 'Woher kommst du?', distractors: ['kommt'], explain: '疑问词 woher 打头，动词第二位；kommt 是错误的变位（配 er/sie/es）。', skills: ['greet-intro', 'v2-order'] },
          { type: 'choice', prompt: '你想礼貌地问一位教授"您叫什么名字"，该怎么说？', options: ['Wie heißt du?', 'Wie heißen Sie?', 'Wie heiße ich?'], a: 1, explain: '对教授这样的长辈、权威人物用 Sie。', skills: ['du-sie'] },
          { type: 'dictation', audioText: 'Ich studiere Musik.', skills: ['greet-intro'] },
          { type: 'fill', prompt: 'Wie ___ Sie?（您叫什么名字？）', a: ['heißen'], explain: 'Sie 配 heißen，和复数变位一样。', skills: ['du-sie'] },
          { type: 'assemble', zh: '我学音乐专业。', answer: 'Ich studiere Musik.', distractors: ['studierst'], explain: 'ich studiere；studierst 是错误的变位（配 du）。', skills: ['greet-intro'] },
          { type: 'reproduce', de: 'Ich heiße Mia. Ich komme aus China.', zh: '我叫米娅，我来自中国。' },
          { type: 'reproduce', de: 'Ich studiere Musik.', zh: '我学音乐专业。' },
          { type: 'roleplay', title: '向新室友自我介绍', userRole: 'Mia', lines: [
            { who: 'Jonas', de: 'Hallo! Ich bin Jonas. Wie heißt du?', zh: '嗨！我是约纳斯。你叫什么名字？' },
            { who: 'Mia', de: 'Ich heiße Mia. Ich komme aus China.', zh: '（你）我叫米娅，我来自中国。' },
            { who: 'Jonas', de: 'Freut mich! Ich komme aus Deutschland.', zh: '很高兴认识你！我来自德国。' },
            { who: 'Mia', de: 'Ich studiere Musik. Und du?', zh: '（你）我学音乐专业，你呢？' },
            { who: 'Jonas', de: 'Ich studiere Sport.', zh: '我学体育专业。' },
            { who: 'Mia', de: 'Schön, freut mich!', zh: '（你）太好了，很高兴认识你！' },
          ] },
          { type: 'recap', h: '这课你学会了', p: 'Ich heiße…（我叫……）· Ich komme aus…（我来自……）· Ich studiere…（我学……专业）· Freut mich!（很高兴认识你！）\n记住：对陌生长辈、正式场合用 Sie，对同龄朋友用 du。', tip: '语法细节（sein/du-Sie变位）在语法主线第1单元系统讲过，这里只练脱口而出。' },
        ],
      },
      {
        id: 'sa-l2',
        title: '咖啡馆点单 Im Café',
        skills: ['polite-order'],
        vocabRefs: ['w003', 'w233', 'w014', 'w011', 'w009', 'w214', 'w008', 'w007'],
        steps: [
          { type: 'scene', title: '在咖啡馆', lines: [
            { who: 'Lisa', de: 'Guten Tag! Was möchten Sie?', zh: '您好！您想要点什么？' },
            { who: 'Mia', de: 'Ich hätte gern einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。' },
            { who: 'Lisa', de: 'Möchten Sie auch einen Kuchen?', zh: '您也要蛋糕吗？' },
            { who: 'Mia', de: 'Ja, gern! Was kostet der Kuchen?', zh: '好呀！蛋糕多少钱？' },
            { who: 'Lisa', de: 'Der Kuchen kostet drei Euro.', zh: '蛋糕三欧元。' },
            { who: 'Mia', de: 'Sehr gut, danke!', zh: '很好，谢谢！' },
            { who: 'Lisa', de: 'Bitte schön!', zh: '不客气！' },
            { who: 'Mia', de: 'Zahlen, bitte!', zh: '买单，谢谢！' },
            { who: 'Lisa', de: 'Das macht sechs Euro.', zh: '一共六欧元。' },
            { who: 'Mia', de: 'Hier sind sechs Euro. Stimmt so!', zh: '给您六欧元，不用找了！' },
            { who: 'Lisa', de: 'Danke schön! Auf Wiedersehen!', zh: '非常感谢！再见！' },
            { who: 'Mia', de: 'Auf Wiedersehen!', zh: '再见！' },
          ] },
          { type: 'teach', h: '点单与买单词块', table: {
            head: ['词块', '例句', '中文'],
            rows: [
              ['Ich hätte gern …', 'Ich hätte gern einen Kaffee.', '我想要……（礼貌点单）'],
              ['Was kostet …?', 'Was kostet der Kuchen?', '……多少钱？'],
              ['Zahlen, bitte!', 'Zahlen, bitte!', '买单，谢谢！'],
              ['Stimmt so.', 'Hier sind sechs Euro. Stimmt so!', '不用找了（小费用语）'],
            ],
          }, example: { de: 'Ich hätte gern einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。' }, tip: '先把整句背下来就能用，hätte gern 背后的虚拟式语法以后再学。' },
          { type: 'teach', h: '更多点单说法', table: {
            head: ['词块', '例句', '中文'],
            rows: [
              ['Ich möchte …', 'Ich möchte einen Tee.', '我想要……（也常用）'],
              ['Die Rechnung, bitte!', 'Die Rechnung, bitte!', '请给我账单！'],
            ],
          } },
          { type: 'observe',
            intro: '对比 Mia 和 Lisa 的说法：hätte gern 和 möchte 都能点单，但哪个更客气？',
            lines: [
              { de: 'Ich hätte gern einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。', hl: 'hätte gern' },
              { de: 'Was möchten Sie?', zh: '您想要什么？', hl: 'möchten' },
            ],
            q: '在正式场合点单，哪种说法听起来更客气？',
            options: ['Ich hätte gern …', 'Ich möchte …', '两者完全一样，随便用'], a: 0,
            explain: 'hätte gern 语气比 möchte 更委婉客气，适合对服务员、陌生人。背后是虚拟式语法，语法主线后面会讲，这里先整句记住。',
            skills: ['polite-order'] },
          { type: 'choice', prompt: '在咖啡馆礼貌点单，"我想要一杯咖啡"怎么说？', options: ['Ich hätte gern einen Kaffee.', 'Ich koste einen Kaffee.', 'Ich zahle einen Kaffee.'], a: 0, explain: 'hätte gern + 名词 = 礼貌点单。', skills: ['polite-order'] },
          { type: 'listenChoice', audioText: 'Was kostet der Kuchen?', options: ['蛋糕多少钱？', '买单，谢谢！', '不用找了。'], a: 0, skills: ['polite-order'] },
          { type: 'fill', prompt: '___, bitte!（买单，谢谢！）', a: ['Zahlen'], hint: 'Z…', explain: '"Zahlen, bitte!" 是餐馆买单的固定说法。', skills: ['polite-order'] },
          { type: 'assemble', zh: '蛋糕多少钱？', answer: 'Was kostet der Kuchen?', distractors: ['kosten'], explain: 'was kostet + 单数名词；kosten 是错误的变位（配复数主语）。', skills: ['polite-order'] },
          { type: 'choice', prompt: '服务员找零，你不需要找零，该说：', options: ['Stimmt so.', 'Das kostet nichts.', 'Ich hätte gern.'], a: 0, explain: 'Stimmt so. = 不用找了，是德国常见的给小费方式。', skills: ['polite-order'] },
          { type: 'dictation', audioText: 'Ich hätte gern einen Tee, bitte.', skills: ['polite-order'] },
          { type: 'fill', prompt: 'Ich ___ gern einen Kaffee.（我想要一杯咖啡。）', a: ['hätte'], explain: '固定搭配 hätte gern，先整句背。', skills: ['polite-order'] },
          { type: 'assemble', zh: '请给我账单！', answer: 'Die Rechnung, bitte!', distractors: ['Kaffee'], explain: 'Rechnung 是阴性名词，配 die；Kaffee 是阳性名词（der Kaffee），搭不上 die。', skills: ['polite-order'] },
          { type: 'reproduce', de: 'Ich hätte gern einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。' },
          { type: 'reproduce', de: 'Zahlen, bitte! Stimmt so.', zh: '买单，谢谢！不用找了。' },
          { type: 'roleplay', title: '在咖啡馆点单到结账', userRole: 'Mia', lines: [
            { who: 'Lisa', de: 'Guten Tag! Was möchten Sie?', zh: '您好！您想要点什么？' },
            { who: 'Mia', de: 'Ich hätte gern einen Kaffee, bitte.', zh: '（你）我想要一杯咖啡，谢谢。' },
            { who: 'Lisa', de: 'Möchten Sie auch einen Kuchen?', zh: '您也要蛋糕吗？' },
            { who: 'Mia', de: 'Ja, gern!', zh: '（你）好呀！' },
            { who: 'Lisa', de: 'Das macht sechs Euro.', zh: '一共六欧元。' },
            { who: 'Mia', de: 'Zahlen, bitte! Stimmt so.', zh: '（你）买单，谢谢！不用找了。' },
            { who: 'Lisa', de: 'Danke schön!', zh: '非常感谢！' },
          ] },
          { type: 'recap', h: '这课你学会了', p: 'Ich hätte gern…（我想要……，礼貌点单）· Was kostet…?（……多少钱？）· Zahlen, bitte!（买单！）· Stimmt so.（不用找了）\n小贴士：在德国给小费，直接说 Stimmt so 就是最自然的方式。' },
        ],
      },
      {
        id: 'sa-l3',
        title: '超市购物 Im Supermarkt',
        skills: ['shop-chunks', 'frag-order'],
        vocabRefs: ['w010', 'w234', 'w121', 'w078', 'w080', 'w166', 'w088', 'w165'],
        steps: [
          { type: 'scene', title: '在超市', lines: [
            { who: 'Mia', de: 'Entschuldigung, wo finde ich Brot?', zh: '打扰一下，面包在哪儿？' },
            { who: 'Paul', de: 'Das Brot ist dort links.', zh: '面包在那边左侧。' },
            { who: 'Mia', de: 'Danke! Wo finde ich Wasser?', zh: '谢谢！那水在哪儿？' },
            { who: 'Paul', de: 'Das Wasser ist geradeaus.', zh: '水在直走的地方。' },
            { who: 'Mia', de: 'Danke schön! Haben Sie auch Käse?', zh: '谢谢！你们有奶酪吗？' },
            { who: 'Paul', de: 'Ja, der Käse ist hier rechts.', zh: '有，奶酪在这边右侧。' },
            { who: 'Mia', de: 'Sehr gut, danke!', zh: '太好了，谢谢！' },
            { who: 'Paul', de: 'Zahlen Sie mit Karte?', zh: '您刷卡付款吗？' },
            { who: 'Mia', de: 'Ja, mit Karte, bitte.', zh: '是的，刷卡，谢谢。' },
            { who: 'Paul', de: 'Eine Tüte auch?', zh: '要袋子吗？' },
            { who: 'Mia', de: 'Ja, eine Tüte, bitte.', zh: '要，请给我一个袋子。' },
            { who: 'Paul', de: 'Das macht zehn Euro. Das Wasser hat Pfand.', zh: '一共十欧元。这瓶水有押金。' },
          ] },
          { type: 'teach', h: '找东西问位置', table: {
            head: ['词块', '例句', '中文'],
            rows: [
              ['Wo finde ich …?', 'Wo finde ich Milch?', '……在哪儿能找到？'],
              ['Haben Sie …?', 'Haben Sie Käse?', '你们有……吗？（问店员）'],
            ],
          }, example: { de: 'Entschuldigung, wo finde ich Brot?', zh: '打扰一下，面包在哪儿？' } },
          { type: 'teach', h: '结账词块', table: {
            head: ['词块', '例句', '中文'],
            rows: [
              ['Eine Tüte, bitte.', 'Eine Tüte, bitte.', '请给我一个袋子。'],
              ['mit Karte zahlen', 'Ich zahle mit Karte.', '用银行卡付款'],
            ],
          }, example: { de: 'Ich zahle mit Karte, bitte.', zh: '我想刷卡付款，谢谢。' }, tip: '文化小贴士：德国超市买瓶装水/饮料常有 Pfand（押金），退瓶机能换回钱。' },
          { type: 'observe',
            intro: '对比这两句：动词的位置有什么不同？',
            lines: [
              { de: 'Das macht zehn Euro.', zh: '一共十欧元。', hl: 'macht' },
              { de: 'Zahlen Sie mit Karte?', zh: '您刷卡付款吗？', hl: 'Zahlen' },
            ],
            q: '和陈述句相比，疑问句 "Zahlen Sie mit Karte?" 里动词跑到了第几位？',
            options: ['第一位（提前了）', '还是第二位', '跑到句尾了'], a: 0,
            explain: '德语的是非疑问句（能用"是/不是"回答）动词提到句首第一位；陈述句动词永远在第二位。细节见语法主线的疑问句课。',
            skills: ['frag-order'] },
          { type: 'choice', prompt: '"你们有奶酪吗？"用德语怎么问？', options: ['Haben Sie Käse?', 'Sie haben Käse.', 'Käse haben Sie?'], a: 0, explain: '是非疑问句：动词提到第一位。', skills: ['frag-order'] },
          { type: 'listenChoice', audioText: 'Wo finde ich Wasser?', options: ['水在哪儿能找到？', '水多少钱？', '请给我一瓶水。'], a: 0, skills: ['shop-chunks'] },
          { type: 'fill', prompt: 'Wo ___ ich Brot?（面包在哪儿能找到？）', a: ['finde'], explain: 'wo + finde + ich，疑问词后动词紧跟。', skills: ['shop-chunks', 'frag-order'] },
          { type: 'assemble', zh: '您刷卡付款吗？', answer: 'Zahlen Sie mit Karte?', distractors: ['zahlt'], explain: '是非疑问句动词提前到第一位；zahlt 是错误的变位（不配 Sie）。', skills: ['frag-order'] },
          { type: 'choice', prompt: '结账时想要个袋子，怎么说？', options: ['Eine Tüte, bitte.', 'Ein Pfand, bitte.', 'Eine Karte, bitte.'], a: 0, explain: 'Tüte = 购物袋。', skills: ['shop-chunks'] },
          { type: 'dictation', audioText: 'Haben Sie Käse?', skills: ['shop-chunks', 'frag-order'] },
          { type: 'fill', prompt: 'Ich zahle mit ___.（我用卡付款。）', a: ['Karte'], explain: 'mit Karte zahlen = 刷卡付款。', skills: ['shop-chunks'] },
          { type: 'assemble', zh: '面包在哪儿能找到？', answer: 'Wo finde ich Brot?', distractors: ['findet'], explain: 'findet 是错误的变位（配 er/sie/es，不配 ich）。', skills: ['shop-chunks'] },
          { type: 'reproduce', de: 'Wo finde ich Brot?', zh: '面包在哪儿能找到？' },
          { type: 'reproduce', de: 'Ich zahle mit Karte. Eine Tüte, bitte.', zh: '我刷卡付款。请给我一个袋子。' },
          { type: 'roleplay', title: '在超市找三样东西并结账', userRole: 'Mia', lines: [
            { who: 'Mia', de: 'Entschuldigung, wo finde ich Brot?', zh: '（你）打扰一下，面包在哪儿？' },
            { who: 'Paul', de: 'Das Brot ist dort links.', zh: '面包在那边左侧。' },
            { who: 'Mia', de: 'Danke! Haben Sie auch Käse?', zh: '（你）谢谢！你们有奶酪吗？' },
            { who: 'Paul', de: 'Ja, der Käse ist hier rechts.', zh: '有，奶酪在这边右侧。' },
            { who: 'Mia', de: 'Und wo finde ich Wasser?', zh: '（你）那水在哪儿？' },
            { who: 'Paul', de: 'Das Wasser ist geradeaus.', zh: '水在直走的地方。' },
            { who: 'Mia', de: 'Danke schön! Ich zahle mit Karte.', zh: '（你）谢谢！我刷卡付款。' },
            { who: 'Paul', de: 'Eine Tüte auch?', zh: '要袋子吗？' },
            { who: 'Mia', de: 'Ja, eine Tüte, bitte.', zh: '（你）要，请给我一个袋子。' },
          ] },
          { type: 'recap', h: '这课你学会了', p: 'Wo finde ich…?（……在哪儿？）· Haben Sie…?（你们有……吗？）· Eine Tüte, bitte.（请给我一个袋子）· mit Karte zahlen（刷卡付款）\n小贴士：德国超市买瓶装水/饮料常有 Pfand 押金，退瓶机能换回钱。' },
        ],
      },
    ],
  },
];

export function findLesson(id) {
  for (const unit of COURSE)
    for (const lesson of unit.lessons)
      if (lesson.id === id) return lesson;
  return null;
}

export function findUnitOfLesson(id) {
  for (const unit of COURSE)
    if (unit.lessons.some(l => l.id === id)) return unit;
  return null;
}

// 路径上第一个未完成的课（顺序解锁）
export function nextLesson(lessonStates) {
  for (const unit of COURSE)
    for (const lesson of unit.lessons)
      if (!lessonStates[lesson.id]?.done) return { unit, lesson };
  return null;
}
