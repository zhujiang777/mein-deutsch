// 句子 → 它实际演示了哪些语法点（g01–g20）。
//
// 用途一：给 gen_grammar_index 挑"你在哪儿真见过这条语法"的实例句。
// 用途二：审计工具判断正文有没有越过 grammarPrereqs（audit_a1_content.mjs）。
//
// 口径必须保守：宁可漏判，不可误判。索引里出现一句其实不含该结构的例句，
// 比少一句更糟——学习者会照着错的样本归纳规则。
// 每条规则带 weight（这次命中有多"典型"）：sein 几乎句句都有，权重就低；
// 句尾可分前缀极少见且一望即知，权重就高。排序时靠它把最能说明问题的句子顶上来。
import { DICT_PARTICIPLES } from '../data/dict-core.js';
import { VOCAB } from '../data/vocab.js';

// 复数没法靠词形规则判——Lehrer 的复数还是 Lehrer。用词表里手工核对过的 pl 字段，
// 且只收「复数≠单数」的那些，否则每个 der Lehrer 都会被当成复数实例。
const PLURAL_FORMS = new Set(
  VOCAB.filter(word => word.art && word.pl && word.pl.toLowerCase() !== word.de.toLowerCase())
    .map(word => word.pl.toLowerCase()),
);

const tokens = text => (String(text).match(/[A-Za-zÄÖÜäöüß]+/g) || []);
const lower = text => tokens(text).map(word => word.toLowerCase());

const SEIN = new Set(['bin', 'bist', 'ist', 'sind', 'seid']);
const HABEN = new Set(['habe', 'hast', 'hat', 'haben', 'habt']);
const MODALS = new Set([
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
  'will', 'willst', 'wollen', 'wollt', 'darf', 'darfst', 'dürfen', 'dürft',
  'soll', 'sollst', 'sollen', 'sollt', 'mag', 'magst', 'mögen', 'mögt',
  'möchte', 'möchtest', 'möchten', 'möchtet',
]);
// e→i / e→ie / a→ä 换音后的 du / er 形式。只收 A1 范围内的高频动词。
const STEM_CHANGE = new Set([
  'sprichst', 'spricht', 'isst', 'esst', 'gibst', 'gibt', 'nimmst', 'nimmt',
  'hilfst', 'hilft', 'triffst', 'trifft', 'siehst', 'sieht', 'liest',
  'fährst', 'fährt', 'schläfst', 'schläft', 'läufst', 'läuft', 'hältst', 'hält',
  'trägst', 'trägt', 'gefällt', 'wirst', 'wird', 'weiß', 'weißt',
]);
const W_WORDS = new Set([
  'wer', 'wen', 'wem', 'was', 'wo', 'woher', 'wohin', 'wann', 'wie',
  'warum', 'welche', 'welcher', 'welches', 'welchen', 'wessen', 'wieviel',
]);
// 句首不是主语的成分：后面紧跟变位动词才叫 V2 倒装（Heute lerne ich…）。
const FRONTED = new Set([
  'heute', 'morgen', 'gestern', 'jetzt', 'dann', 'danach', 'zuerst', 'später',
  'am', 'um', 'im', 'nach', 'vor', 'hier', 'dort', 'manchmal', 'immer', 'oft', 'abends',
]);
const SEPARABLE_PARTICLE = new Set([
  'ab', 'an', 'auf', 'aus', 'ein', 'mit', 'nach', 'vor', 'zu',
  'fern', 'los', 'weg', 'zurück', 'zusammen', 'vorbei', 'statt', 'fest', 'mit',
]);
// 这几个既能当可分前缀又能当表语形容词（Der Laden ist auf/zu）。
const AMBIGUOUS_TAIL = new Set(['zu', 'auf', 'aus', 'an']);
const AKK = new Set(['den', 'einen', 'keinen', 'meinen', 'deinen', 'seinen', 'ihren', 'ihn', 'mich', 'dich']);
const DAT_PREP = new Set(['aus', 'bei', 'mit', 'seit', 'von', 'zu', 'zum', 'zur', 'beim', 'vom']);
const DAT_PRONOUN = new Set(['mir', 'dir', 'ihm', 'ihnen', 'dem', 'einem', 'einer']);
const POSSESSIVE = new Set([
  'mein', 'meine', 'meinen', 'meiner', 'meinem', 'dein', 'deine', 'deinen',
  'sein', 'seine', 'seinen', 'ihre', 'ihren', 'unser', 'unsere', 'euer', 'eure',
]);
// ihr 一词三义（她的/你们/您的），且"habt ihr Wasser?"和"Wie ist Ihr Name?"
// 无论看大小写、看前后词性都分不开——两句都是 finite verb + ihr + 大写名词。
// 所以 ihr 一律不认。宁可 g11 少一个物主冠词变体，也不能往索引里塞错例句。
const PAST_SEIN_HABEN = new Set(['war', 'warst', 'waren', 'wart', 'hatte', 'hattest', 'hatten', 'hattet']);
const INFINITIVE = /(?:[a-zäöüß]{2,}(?:en|ern|eln))$/;

/* ---- g14–g20 用的词表 ---- */
const NUMBER_WORD = new Set([
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun',
  'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn',
  'achtzehn', 'neunzehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig',
  'siebzig', 'achtzig', 'neunzig', 'hundert', 'tausend',
]);
// einundzwanzig / siebenundvierzig 这类合写的两位数
const COMPOUND_NUMBER = /^[a-zäöüß]+und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/;
const WEEKDAY = new Set(['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag']);
const ORDINAL_DATE = /\b(ersten|zweiten|dritten|vierten|fünften|sechsten|siebten|achten|neunten|zehnten|elften|zwölften|\d{1,2}\.)\s+(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/;
// Sie 命令式和 Sie 的是非疑问句长得一模一样（Gehen Sie …），只有标点分得开，
// 所以这条规则必须看原文而不是分词结果。
const SIE_IMPERATIVE = /^(Bitte,?\s+)?[A-ZÄÖÜ][a-zäöüß]+e?n\s+Sie\b/;
const COMPARATIVE = new Set([
  'besser', 'lieber', 'älter', 'jünger', 'größer', 'kleiner', 'teurer', 'billiger',
  'schneller', 'langsamer', 'länger', 'kürzer', 'schöner', 'wärmer', 'kälter', 'höher',
]);
const PRED_DEGREE = new Set(['sehr', 'zu']);
const FREQ_ADVERB = new Set(['immer', 'oft', 'manchmal', 'selten', 'nie', 'meistens']);
const SEQ_ADVERB = new Set(['zuerst', 'dann', 'danach', 'später']);
const PLACE_ADVERB = new Set(['links', 'rechts', 'geradeaus', 'oben', 'unten', 'vorne', 'hinten']);
// 非主格人称代词。sie/es/Sie 主宾同形，看不出格，一律不认。
const OBJECT_PRONOUN = new Set(['mich', 'dich', 'ihn', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihnen']);
const CONTRACTION = new Set(['zum', 'zur', 'im', 'am', 'beim', 'vom', 'ins', 'ans']);
const FIXED_DATIV_PREP = new Set(['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu']);

/** 句尾（去掉标点后）最后一个词。 */
const lastWord = list => list[list.length - 1] || '';

function hasParticiple(list) {
  return list.some(word => Boolean(DICT_PARTICIPLES[word]));
}

/* 每条规则：命中即返回 weight。weight 越高＝这句越能说明这条语法。 */
const RULES = [
  {
    id: 'g01', label: 'sein 变位',
    test: list => {
      if (!list.some(word => SEIN.has(word))) return 0;
      // "ist … gefahren" 是完成时，主角是 g12 不是 sein 本身
      return hasParticiple(list) ? 0 : (list.length <= 6 ? 1 : 0.6);
    },
  },
  {
    id: 'g02', label: 'haben / 规则动词变位',
    test: list => (list.some(word => HABEN.has(word)) && !hasParticiple(list) ? 1 : 0),
  },
  {
    id: 'g03', label: '名词的性与冠词',
    // "Das ist ein/eine …" 是这一课的标准展示句型，其余冠词用例太弥散，不认。
    test: list => (list[0] === 'das' && list[1] === 'ist' && (list[2] === 'ein' || list[2] === 'eine') ? 2 : 0),
  },
  {
    id: 'g04', label: '名词复数',
    test: list => {
      const index = list.findIndex(word => PLURAL_FORMS.has(word));
      if (index < 0) return 0;
      return list[index - 1] === 'die' ? 2 : 1.2;   // die + 复数名词最能说明问题
    },
  },
  {
    id: 'g05', label: 'V2 语序 / W- 疑问句',
    test: list => {
      if (W_WORDS.has(list[0])) return 2;
      // 句首状语 + 变位动词 + 主语 → 教科书式倒装
      if (FRONTED.has(list[0]) && list.length > 2) return 1.5;
      return 0;
    },
  },
  {
    id: 'g06', label: '第四格 Akkusativ',
    test: list => (list.some(word => AKK.has(word)) ? 1.2 : 0),
  },
  {
    id: 'g07', label: '不规则动词换音',
    test: list => (list.some(word => STEM_CHANGE.has(word)) ? 2.5 : 0),
  },
  {
    id: 'g08', label: '情态动词与句框',
    test: list => {
      if (!list.some(word => MODALS.has(word))) return 0;
      // 句尾是原形 → 句框完整，最典型
      return INFINITIVE.test(lastWord(list)) ? 3 : 1.5;
    },
  },
  {
    id: 'g09', label: '可分动词',
    test: list => {
      const tail = lastWord(list);
      if (list.length <= 2 || !SEPARABLE_PARTICLE.has(tail)) return 0;
      // "Die Tür ist zu."——这里的 zu/auf/aus/an 是表语形容词（关着/开着），不是前缀。
      // 判据：句中只有 sein 作谓语时，句尾这几个词一定是形容词。
      if (AMBIGUOUS_TAIL.has(tail) && list.some(word => SEIN.has(word))) return 0;
      return 3;
    },
  },
  {
    id: 'g10', label: '第三格 Dativ',
    test: list => {
      const prep = list.some(word => DAT_PREP.has(word));
      const pron = list.some(word => DAT_PRONOUN.has(word));
      if (prep && pron) return 2;
      return prep || pron ? 1.2 : 0;
    },
  },
  {
    id: 'g11', label: '物主冠词与否定',
    test: list => {
      if (list.some(word => POSSESSIVE.has(word))) return 1.5;
      if (list.some(word => word === 'nicht' || word.startsWith('kein'))) return 1.2;
      return 0;
    },
  },
  {
    id: 'g12', label: '完成时 Perfekt',
    test: list => {
      if (hasParticiple(list)) return 3;
      if (list.some(word => PAST_SEIN_HABEN.has(word))) return 2;
      return 0;
    },
  },
  {
    id: 'g13', label: '并列连词',
    test: list => {
      // 标点被分词器吃掉了，所以只能看位置：连词在句中、后面还剩得下一个完整分句，
      // 才是"把两句接起来"。这样能把语气词 denn（Was ist denn los?）挡在外面。
      const joins = word => {
        const at = list.indexOf(word);
        return at > 0 && at < list.length - 2;
      };
      if (joins('denn')) return 3;
      if (joins('also')) return 2.5;
      if (joins('aber')) return 2;
      // und / oder 太常见了，"Käse und Äpfel" 只是并列名词，不演示句子连接。
      return list.includes('und') || list.includes('oder') ? 0.8 : 0;
    },
  },
  {
    id: 'g14', label: '数字 · 钟点 · 日期',
    test: (list, raw, text) => {
      // "Ja, das ist eine Uhr." 里的 Uhr 是钟表这件东西，不是钟点。
      // 只有前面挂着数字（um acht Uhr / vierzehn Uhr）才算报时。
      const clock = list.some((word, index) => word === 'uhr'
        && (NUMBER_WORD.has(list[index - 1]) || COMPOUND_NUMBER.test(list[index - 1] || '') || /^\d+$/.test(list[index - 1] || '')));
      if (clock) return 3;
      if (list.includes('halb') || list.includes('viertel')) return 2.6;
      if (ORDINAL_DATE.test(text)) return 2.4;
      if (list.some((word, index) => word === 'am' && WEEKDAY.has(list[index + 1] || ''))) return 2.2;
      if (list.some(word => COMPOUND_NUMBER.test(word))) return 2;
      return list.some(word => NUMBER_WORD.has(word)) ? 1 : 0;
    },
  },
  {
    id: 'g15', label: '命令式',
    test: (list, raw, text) => {
      const trimmed = String(text).trim();
      // 问号一出现就不是命令（Möchten Sie auch etwas essen?）。
      if (/\?/.test(trimmed)) return 0;
      if (SIE_IMPERATIVE.test(trimmed)) return 3;
      // du / ihr 命令式：动词打头、句尾感叹号。名词也可能大写打头，
      // 所以要求首词不是已知的变位动词形式，且句子确实以 ! 收尾。
      if (/!/.test(trimmed) && /^[A-ZÄÖÜ][a-zäöüß]{1,}\b/.test(trimmed)) {
        const first = list[0];
        if (SEIN.has(first) || HABEN.has(first) || MODALS.has(first) || W_WORDS.has(first)) return 0;
        if (first === 'sei' || first === 'seid') return 3;
        // 只认课程里真的教过的那批换音命令式，避免把 "Hallo!" "Danke!" 算进来。
        if (['komm', 'kommt', 'iss', 'esst', 'nimm', 'nehmt', 'lies', 'sprich', 'fahr', 'geh', 'warte', 'schlaf'].includes(first)) return 3;
      }
      return 0;
    },
  },
  {
    id: 'g16', label: '表语形容词 · 比较',
    test: (list, raw) => {
      const hasAls = list.includes('als');
      if (list.some(word => COMPARATIVE.has(word))) return hasAls ? 3.5 : 2;
      if (list.includes('mehr') && hasAls) return 3;
      if (list[0] === 'am' && (list[1] === 'liebsten' || list[1] === 'besten')) return 2.4;
      // sein + sehr/zu + 形容词：这一课的另一半（形容词作表语不变格）。
      // 后面必须是小写词才是形容词——"zu Hause"（在家）里的 zu 是介词，不是"太"。
      const degree = list.some((word, index) => PRED_DEGREE.has(word)
        && /^[a-zäöüß]/.test(raw[index + 1] || ''));
      if (degree && list.some(word => SEIN.has(word))) return 1.5;
      return 0;
    },
  },
  {
    id: 'g17', label: '频率与地点副词',
    test: list => {
      if (list.some(word => FREQ_ADVERB.has(word))) return 2.2;
      if (list.some(word => PLACE_ADVERB.has(word))) return 2;
      // zuerst/dann/danach 放句首才是"讲顺序"，句中的 dann 常常只是语气词。
      if (SEQ_ADVERB.has(list[0])) return 2;
      return 0;
    },
  },
  {
    id: 'g18', label: '人称代词的三种格',
    test: list => {
      const hits = list.filter(word => OBJECT_PRONOUN.has(word)).length;
      if (!hits) return 0;
      return hits > 1 ? 2.6 : 2;
    },
  },
  {
    id: 'g19', label: '介词',
    test: list => {
      const contraction = list.some(word => CONTRACTION.has(word));
      // 介词 + 第三格冠词（auf dem Tisch / neben der Bank）是这一课最典型的样子
      const withDative = list.some((word, index) => FIXED_DATIV_PREP.has(word)
        || (DAT_PREP.has(word) && DAT_PRONOUN.has(list[index + 1] || '')));
      if (contraction && withDative) return 2.4;
      if (contraction) return 2;
      return withDative ? 1.5 : 0;
    },
  },
  {
    id: 'g20', label: 'man · es gibt · 虚位 es',
    test: (list, raw, text) => {
      if (/\bes gibt\b|\bgibt es\b/i.test(text)) return 3;
      if (list.includes('man')) return 2.6;
      // 天气与时间的虚位 es：es regnet / es ist halb elf
      if (list[0] === 'es' && (list[1] === 'regnet' || list[1] === 'schneit')) return 2.4;
      return 0;
    },
  },
];

/** 这句话演示了哪些语法点 → [{ id, label, weight }]，按 weight 降序。 */
export function detectGrammar(text) {
  const raw = tokens(text);
  const list = raw.map(word => word.toLowerCase());
  if (!list.length) return [];
  return RULES
    .map(rule => ({ id: rule.id, label: rule.label, weight: rule.test(list, raw, String(text)) }))
    .filter(hit => hit.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

/** 只要 id 集合，用于门禁类判断。 */
export function grammarIdsIn(text) {
  return detectGrammar(text).map(hit => hit.id);
}

export { tokens as grammarTokens };
