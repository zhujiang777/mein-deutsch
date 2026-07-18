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
          { type: 'recap', h: '这课你学会了', p: 'ich bin（我是）· du bist（你是）\n下一课：他/她是、以及对陌生人怎么说"您"。', tip: '错过的题明天会自动出现在"今日学习"里。' },
        ],
      },
      {
        id: 'u1l2',
        title: 'er/sie ist · Sie sind（尊称）',
        skills: ['sein-sg', 'sie-formal'],
        steps: [
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
          { type: 'recap', h: '这课你学会了', p: 'er/sie/es ist（他/她/它是）· Sie sind（您是，尊称大写）\n口诀：单数配 ist，尊称配 sind。' },
        ],
      },
      {
        id: 'u1l3',
        title: 'wir sind · ihr seid · sie sind',
        skills: ['sein-pl', 'sein-sg'],
        steps: [
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
          { type: 'recap', h: '恭喜！sein 全部拿下', p: '你已经掌握德语最重要的动词。sein 的六个形态会在后面所有课程里反复出现，忘了也没关系——系统会安排复习。' },
        ],
      },
    ],
  },

  /* ===== 场景口语线（占位，双泳道可见可测；内容制作中） ===== */
  {
    id: 's1',
    title: '生存场景 · 预告',
    icon: '🗣️',
    track: 'scene',
    intro: '按真实场景学口语：点餐、问路、购物……即将上线。',
    lessons: [
      {
        id: 's1l1',
        title: '场景课程制作中',
        steps: [
          { type: 'teach', h: '🗣️ 场景口语线', p: '这条线用真实对话（scene）+ 语法观察（observe）+ 复述（reproduce）+ 角色扮演（roleplay）带你开口说德语。\n内容正在制作中，先在语法主线打好基础吧。', tip: '两条线各自独立解锁，随时切换。' },
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
