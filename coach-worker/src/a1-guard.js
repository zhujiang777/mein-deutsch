// Optional AI materials: separate level safety, learned-token coverage and pilot grammar scope.
import { VOCAB } from '../../data/vocab.js';

// 这些是级别允许词，不因此视作学习者已经学过。
const SAFE_WORDS = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'ihnen', 'ihn', 'mich', 'dich', 'uns',
  'mein', 'meine', 'meinen', 'dein', 'deine', 'sein', 'seine', 'unser', 'unsere',
  'ein', 'eine', 'einen', 'einem', 'einer', 'der', 'die', 'das', 'den', 'dem', 'des',
  'ist', 'bin', 'bist', 'sind', 'seid', 'war', 'nicht', 'kein', 'keine', 'ja', 'nein',
  'und', 'oder', 'aber', 'denn', 'auch', 'sehr', 'hier', 'dort', 'da', 'noch', 'schon',
  'in', 'an', 'auf', 'zu', 'zum', 'zur', 'mit', 'für', 'von', 'vom', 'bei', 'nach', 'um',
  'wie', 'was', 'wo', 'wer', 'wann', 'warum', 'wohin',
  'china', 'deutschland', 'berlin', 'münchen', 'anna', 'lena', 'zhu',
]);

function addWords(set, text) {
  String(text || '').toLocaleLowerCase('de-DE')
    .match(/[a-zäöüß]+/giu)?.forEach(word => set.add(word));
}

const A1_WORDS = new Set(SAFE_WORDS);
for (const word of VOCAB) {
  addWords(A1_WORDS, word.de);
  addWords(A1_WORDS, word.pl);
  Object.values(word.forms || {}).forEach(value => addWords(A1_WORDS, value));
  (word.phrases || []).forEach(item => addWords(A1_WORDS, item.de));
  (word.sentences || []).forEach(item => addWords(A1_WORDS, item.de));
}

// 当前短材料采用保守语法范围；这不是对完整 A1 考纲的定义。
const BANNED_GRAMMAR = [
  { code: 'subordinate-clause', re: /\b(weil|dass|obwohl|während|falls|sodass|wenn|damit)\b/iu },
  { code: 'genitive-preposition', re: /\b(trotz|wegen|innerhalb|außerhalb|aufgrund)\b/iu },
  { code: 'passive-voice', re: /\b(wird|werden|wurde|wurden)\s+\w+t\b/iu },
  { code: 'preterite', re: /\b(hatte|hatten|ging|kam|sah|sprach|machte|fuhr|gab)\b/iu },
];

export const ARTICLE_LIMITS = {
  minSentences: 3,
  maxSentences: 6,
  maxWordsPerSentence: 12,
  maxNewWords: 3,
  minKnownRatio: 0.9,
};

/**
 * 词组（Guten Morgen、Wie geht's）没法按单词命中，用整串匹配，匹配不上也不计入门槛——
 * 否则词表里混进几个词组，门槛就被凭空抬高，好文章也会被判不合格。
 */
function isPhrase(seed) {
  return /\s/u.test(String(seed || '').trim());
}

/**
 * 种子词是原形，文章里是变形。用前缀匹配收词形变化（fahren → fährt、Karte → Karten），
 * 短词要求全等，避免 wo 把 Wohnung 也算成命中。
 */
function hitsSeed(seed, words) {
  const stem = String(seed || '').toLocaleLowerCase('de-DE');
  if (!stem) return false;
  if (words.has(stem)) return true;
  if (stem.length < 5) return false;
  const prefix = stem.slice(0, Math.max(4, stem.length - 2));
  for (const word of words) if (word.startsWith(prefix)) return true;
  return false;
}

/** 今天必须命中的种子数：可匹配种子的一半，且至少 2 个。没有种子时这条不生效。 */
export function requiredSeedHits(seedWords) {
  const count = Array.isArray(seedWords)
    ? seedWords.filter(seed => seed && !isPhrase(seed)).length
    : Number(seedWords) || 0;
  if (!count) return 0;
  return Math.max(2, Math.ceil(count / 2));
}

/** 今天这一篇里"允许出现"的词：A1 词表 + 学习者已知词 + 今天的种子词。 */
export function allowedWords({ knownWords = [], seedWords = [] } = {}) {
  const allowed = new Set(A1_WORDS);
  knownWords.slice(0, 400).forEach(word => addWords(allowed, word));
  seedWords.slice(0, 40).forEach(word => addWords(allowed, word));
  return allowed;
}

// A finite set of taught clause shapes prevents familiar vocabulary from admitting
// new verb forms or case constructions. This intentionally rejects some valid German.
const NUMBER = '(?:null|ein|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|[0-9]|1[0-9]|20)';
const PILOT_CLAUSES = {
 name: ['hallo(?: [a-zäöüß]+)?','guten tag','tschüss(?: [a-zäöüß]+)?','ich heiße [a-zäöüß]+','wie heißt du','und du','ja','nein'],
 origin: ['ich komme aus [a-zäöüß]+','(?:und )?woher kommst du','kommst du (?:auch )?aus [a-zäöüß]+'],
 residence: ['ich wohne (?:auch )?in [a-zäöüß]+','wo wohnst du','wohnst du in [a-zäöüß]+'],
 quantity: [`(?:und )?${NUMBER} (?:brötchen|brot|wasser)(?: bitte)?`,'ja bitte','danke'],
 request: ['was möchten sie',`(?:ich möchte )?einen (?:kaffee|tee)(?: und ${NUMBER} brötchen)?(?: bitte)?`,'kaffee oder tee','ja bitte','danke'],
 price: [`(?:das kostet )?${NUMBER} euro`,'was kostet das','wie viel kostet das','wie bitte','auf wiedersehen','danke'],
};
function pilotGrammarAllows(text, tags) {
 const patterns=tags.flatMap(tag=>PILOT_CLAUSES[tag]||[]).map(pattern=>new RegExp(`^(?:${pattern})$`,'iu'));
 const clauses=text.split(/[.!?]+/u).map(s=>s.replace(/[,，]/gu,' ').replace(/\s+/gu,' ').trim()).filter(Boolean);
 return clauses.length>0&&clauses.every(clause=>patterns.some(re=>re.test(clause)));
}

export function auditArticle(article, { knownWords = [], seedWords = [], allowedGrammar } = {}) {
  const flags = [];
  const sentences = Array.isArray(article?.sentences) ? article.sentences : [];
  if (sentences.length < ARTICLE_LIMITS.minSentences) flags.push('too-few-sentences');
  if (sentences.length > ARTICLE_LIMITS.maxSentences) flags.push('too-many-sentences');

  const allowed = allowedWords({ knownWords, seedWords });

  const used = new Set();
  const unknown = new Set();
  const learned = new Set();
  knownWords.forEach(word => addWords(learned, word));
  let total = 0;
  let unknownTokens = 0;

  for (const sentence of sentences) {
    const de = String(sentence?.de || '');
    if (!de || !String(sentence?.zh || '')) flags.push('missing-translation');
    if (/[<>]|https?:\/\/|```|\[[^\]]+\]\(/u.test(de)) flags.push('unsafe-markup');
    const words = de.match(/[a-zäöüß]+/giu) || [];
    if (words.length > ARTICLE_LIMITS.maxWordsPerSentence) flags.push('sentence-too-long');
    words.forEach(word => {
      const normalized = word.toLocaleLowerCase('de-DE');
      used.add(normalized);
      total += 1;
      if (!allowed.has(normalized)) flags.push('outside-a1-vocabulary');
      if (!learned.has(normalized)) { unknown.add(normalized); unknownTokens++; }
    });
    BANNED_GRAMMAR.forEach(rule => { if (rule.re.test(de)) flags.push(rule.code); });
    if (Array.isArray(allowedGrammar)) {
      if (!pilotGrammarAllows(de,allowedGrammar)) flags.push('grammar-not-taught');
      const allowedSet = new Set(allowedGrammar);
      if (/\b(möchte|möchtest|möchten|einen|einem|einer)\b/iu.test(de) && !allowedSet.has('request')) flags.push('grammar-not-taught');
      if (/\b(wohne|wohnst|wohnt|wohnen)\b/iu.test(de) && !allowedSet.has('residence')) flags.push('grammar-not-taught');
      if (/\b(komme|kommst|kommt|kommen|aus)\b/iu.test(de) && !allowedSet.has('origin')) flags.push('grammar-not-taught');
      if (/\b(kostet|kosten|Euro)\b/iu.test(de) && !allowedSet.has('price')) flags.push('grammar-not-taught');
      // Pilot only: forbid advanced forms even if a word happens to be familiar.
      if (/\b(kann|kannst|können|muss|müssen|darf|dürfen|soll|sollen|würde|gewesen|gemacht|gegangen)\b/iu.test(de)) flags.push('grammar-not-taught');
    }
  }

  if (unknown.size > ARTICLE_LIMITS.maxNewWords) flags.push('too-many-new-words');
  const knownRatio = total ? (total - unknownTokens) / total : 0;
  if (total && knownRatio < ARTICLE_LIMITS.minKnownRatio) flags.push('known-ratio-too-low');

  // ⚠️ 最硬的一条：没用上今天的词，这篇就没有存在的理由。
  const seedHits = seedWords.filter(seed => (isPhrase(seed)
    ? sentences.some(sentence => String(sentence?.de || '').toLocaleLowerCase('de-DE')
        .includes(String(seed).toLocaleLowerCase('de-DE')))
    : hitsSeed(seed, used)));
  const need = requiredSeedHits(seedWords);
  if (seedHits.length < need) flags.push('seed-coverage-too-low');

  return {
    ok: flags.length === 0,
    flags: [...new Set(flags)],
    newWords: [...unknown].slice(0, 8),
    knownRatio: Math.round(knownRatio * 100) / 100,
    seedHits,
    seedNeed: need,
  };
}

/* ---------- 每日小测的闸门 ---------- */

export const QUIZ_LIMITS = {
  count: 2,                 // 官方 Lesen Teil 1 是 5 道；每日小测只取 2 道，控制在 1 分钟内
  maxWords: 12,             // 和文章句子同一条线
  // 陈述里至少要有这么多个实词（≥4 个字母）在文章里出现过。
  // 只要 1 个不是随便定的：真考试的陈述是**改写**，Falsch 那道尤其如此
  // （文章说"我买票"，陈述说"票很贵"），常常只共享一个名词。
  // 定成 2 会把合格的改写题一并判死。这道闸能拦的是"在说完全不相干的事"，
  // 至于"能不能判定"，机械规则本来就担保不了，别假装能。
  minAnchorWords: 1,
  minAnchorLength: 4,       // 实词门槛：ist/der/am 这类虚词不算锚
};

/**
 * 小测的三条硬规则，全部机械可判：
 *   1. 一真一假 —— 两道同真或同假时，蒙一个方向就能全对，题就白出了
 *   2. 可判定 —— 陈述里至少 2 个词在文章正文里出现过，否则它没在谈这篇文章
 *   3. 不超纲 —— 词表、句长、A1 红线语法与文章同一条闸
 *
 * 不合格只丢题不丢文章：文章是主线的一环，不能因为附带的两道题写砸了就让今天没得读。
 */
export function auditQuiz(quiz, article, { knownWords = [], seedWords = [] } = {}) {
  const flags = [];
  const items = Array.isArray(quiz) ? quiz : [];
  if (items.length !== QUIZ_LIMITS.count) return { ok: false, flags: ['quiz-wrong-count'] };

  // 一真一假
  if (items[0].answer === items[1].answer) flags.push('quiz-same-answer');

  const articleWords = new Set();
  for (const sentence of Array.isArray(article?.sentences) ? article.sentences : []) {
    addWords(articleWords, sentence?.de);
  }
  const allowed = allowedWords({ knownWords, seedWords });

  for (const item of items) {
    const de = String(item?.de || '');
    if (/[<>]|https?:\/\/|```/u.test(de)) flags.push('quiz-unsafe-markup');
    const words = (de.match(/[a-zäöüß]+/giu) || []).map(word => word.toLocaleLowerCase('de-DE'));
    if (!words.length) flags.push('quiz-empty');
    if (words.length > QUIZ_LIMITS.maxWords) flags.push('quiz-too-long');
    // 锚：实词，且允许词形变化（Karte → Karten、kaufe → kauft）
    const anchors = words.filter(word => word.length >= QUIZ_LIMITS.minAnchorLength
      && [...articleWords].some(other => other.startsWith(word.slice(0, 4))
        || word.startsWith(other.slice(0, 4))));
    if (anchors.length < QUIZ_LIMITS.minAnchorWords) flags.push('quiz-not-anchored');
    if (words.some(word => !allowed.has(word))) flags.push('quiz-new-words');
    BANNED_GRAMMAR.forEach(rule => { if (rule.re.test(de)) flags.push(`quiz-${rule.code}`); });
  }

  return { ok: flags.length === 0, flags: [...new Set(flags)] };
}
