// 口语第一部分「自我介绍」：题目用**你自己的信息**现拼。
//
// 为什么不能像别的题型那样预写：Azure 只能做**朗读评测**——必须先有参考文本，
// 才能判你读得准不准；它不能听你自由说一段然后打分。
//
// 但真考试 P1 说的本来就是自己的信息（名字、年龄、国家、住哪、会什么语言、
// 职业、爱好），所以让你先把这七项填一次，用固定模板拼成德语当参考文本，
// 这不是绕过限制，是把这道题做对了——你练的就是考场上要说的那几句。
//
// 三个坑，三条对策：
//   1. 专名（自己的名字、Hangzhou 这类城市名）会被判错音 → 从平均分里剔除
//      （renderSpeak 的 excludeWords）
//   2. 拼名字要用**德语字母名**（Zhu → Zett Ha U），不是英文字母名
//   3. 报号码要**逐位念德语数字**，不是把 0176 当成"一百七十六"
import { getSettings, setSetting } from './storage.js';

/** 表单字段。label 是中文提示，example 是德语示例——填的内容必须是德语。 */
export const P1_FIELDS = [
  { key: 'vorname', label: '名', example: 'Jiang', de: 'Name' },
  { key: 'nachname', label: '姓', example: 'Zhu', de: 'Name' },
  { key: 'alter', label: '年龄（数字）', example: '25', de: 'Alter' },
  { key: 'land', label: '来自哪国（德语）', example: 'China', de: 'Land' },
  { key: 'wohnort', label: '住在哪座城市', example: 'Hangzhou', de: 'Wohnort' },
  { key: 'sprachen', label: '会说什么语言（德语）', example: 'Chinesisch und Englisch', de: 'Sprachen' },
  { key: 'beruf', label: '职业（德语）', example: 'Student', de: 'Beruf' },
  { key: 'hobby', label: '爱好（德语）', example: 'Musik', de: 'Hobby' },
  { key: 'telefon', label: '电话号码', example: '0176 4432891', de: 'Telefonnummer' },
];

export function getProfile(settings = getSettings()) {
  return settings?.profile || {};
}

export function saveProfile(profile) {
  setSetting('profile', profile);
  return profile;
}

export function profileComplete(profile = getProfile()) {
  return P1_FIELDS.every(field => String(profile?.[field.key] || '').trim());
}

/* ---------- 两个转换器 ---------- */

// 德语字母名。拼名字时念的是这些，不是英文字母名——考官听的是德语。
const LETTER_NAMES = {
  a: 'A', b: 'Be', c: 'Ce', d: 'De', e: 'E', f: 'Eff', g: 'Ge', h: 'Ha', i: 'I',
  j: 'Jott', k: 'Ka', l: 'Ell', m: 'Emm', n: 'Enn', o: 'O', p: 'Pe', q: 'Ku',
  r: 'Err', s: 'Ess', t: 'Te', u: 'U', v: 'Vau', w: 'We', x: 'Ix', y: 'Ypsilon',
  z: 'Zett', ä: 'A-Umlaut', ö: 'O-Umlaut', ü: 'U-Umlaut', ß: 'Eszett',
};

/** 'Zhu' → 'Zett Ha U'。认不出的字符直接丢掉，不让参考文本里混进乱码。 */
export function spellGerman(word) {
  return String(word || '').toLocaleLowerCase('de-DE').split('')
    .map(char => LETTER_NAMES[char]).filter(Boolean).join(' ');
}

const DIGIT_NAMES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf',
  'sechs', 'sieben', 'acht', 'neun'];

/**
 * '0176 4432891' → 'null eins sieben sechs vier vier drei zwei acht neun eins'。
 * 逐位念是德语报号码的标准做法；整段当数字念（"一百七十六"）考官会听不懂。
 */
export function digitsGerman(value) {
  return String(value || '').replace(/\D/g, '').split('')
    .map(digit => DIGIT_NAMES[Number(digit)]).join(' ');
}

/* ---------- 拼题 ---------- */

/** 官方 P1 给的就是这七张关键词卡，顺序也是这个。 */
export const P1_CARDS = [
  { de: 'Name', zh: '姓名' }, { de: 'Alter', zh: '年龄' }, { de: 'Land', zh: '国家' },
  { de: 'Wohnort', zh: '住哪' }, { de: 'Sprachen', zh: '语言' },
  { de: 'Beruf', zh: '职业' }, { de: 'Hobby', zh: '爱好' },
];

/** 七张卡拼成的自我介绍。改这里等于改所有人的考试答案，动之前想清楚。 */
export function introSentences(profile) {
  return [
    `Ich heiße ${profile.vorname} ${profile.nachname}.`,
    `Ich bin ${profile.alter} Jahre alt.`,
    `Ich komme aus ${profile.land}.`,
    `Ich wohne in ${profile.wohnort}.`,
    `Ich spreche ${profile.sprachen}.`,
    `Ich bin ${profile.beruf}.`,
    `Mein Hobby ist ${profile.hobby}.`,
  ];
}

/**
 * 用档案拼出 P1 这一组题。档案没填完返回 null——没有信息就没有题，
 * 不拿占位符凑一份"Ich heiße Max Mustermann"，那练的不是你自己的考试。
 */
export function buildP1Task(profile = getProfile()) {
  if (!profileComplete(profile)) return null;
  const intro = introSentences(profile);
  // 专名：自己的名字和城市名。国家 / 职业 / 爱好填的是德语词，正常计分。
  const proper = [profile.vorname, profile.nachname, profile.wohnort]
    .flatMap(value => String(value).split(/\s+/)).filter(Boolean);

  return {
    id: 'x-p1-01',
    cellId: 'P1',
    titleZh: '口语第一部分 · 介绍你自己',
    subZh: '七张关键词卡 ＋ 拼出你的姓 ＋ 报出你的电话',
    skills: ['greet-intro', 'sein-sg'],
    items: [
      {
        type: 'speak',
        q: '看着七张卡，把自己介绍一遍',
        cards: P1_CARDS,
        de: intro.join(' '),
        zh: '这七句就是考场上要说的。先听一遍标准音，再自己说。',
        excludeWords: proper,
        skills: ['greet-intro'],
        explain: '真考试是看着这七张卡自己组织，不是背稿。先按这个模板练顺，再试着换词。',
      },
      {
        type: 'speak',
        q: '考官会说 "Buchstabieren Sie bitte." —— 用德语字母把你的姓拼出来',
        de: spellGerman(profile.nachname),
        zh: `拼的是 ${profile.nachname}。念的是德语字母名，不是英文字母名。`,
        skills: ['alphabet'],
        explain: '德语字母名和英文差很多：H 念 Ha 不是 "aitch"，J 念 Jott，W 念 We，Z 念 Zett。',
      },
      {
        type: 'speak',
        q: '考官会问 "Wie ist Ihre Telefonnummer?" —— 逐位报出来',
        de: digitsGerman(profile.telefon),
        zh: `报的是 ${profile.telefon}。德语报号码是一位一位念，不整段当数字念。`,
        skills: ['numbers-1-20'],
        explain: '逐位念是德语的标准做法。把 0176 念成"一百七十六"，考官听不出你在说号码。',
      },
    ],
  };
}
