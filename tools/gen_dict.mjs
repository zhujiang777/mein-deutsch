// Generate the compact runtime dictionary. Do not edit data/dict-core.js by hand.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOCAB } from '../data/vocab.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const words = JSON.parse(fs.readFileSync(path.join(here, 'wortliste.json'), 'utf8'));
const glossPath = path.join(root, 'data/dict-glosses.js');
// P1 intentionally works before the hand-written gloss file exists.
const { DICT_GLOSSES: glosses = {} } = fs.existsSync(glossPath)
  ? await import(`../data/dict-glosses.js?dictgen=${Date.now()}`)
  : { DICT_GLOSSES: {} };

const clean = (value) => String(value || '').trim();
const key = (value) => clean(value).toLocaleLowerCase('de-DE');
const FALLBACK_POS = {
  all: 'adj.', allein: 'adj.', alleine: 'adv.', beide: 'num.', bis: 'prep.',
  ohne: 'prep.', seit: 'prep.', so: 'adv.',
};
const posFor = (pos, art, lemma = '') => {
  const source = clean(pos);
  if (art || /^(Nomen|Substantiv)/i.test(source)) return 'n.';
  if (/^(Adjektiv|partizipiales Adjektiv|Komparativ|Superlativ)$/i.test(source)) return 'adj.';
  if (/^Adverb$/i.test(source)) return 'adv.';
  if (/^Verb$/i.test(source)) return 'v.';
  if (/Pronomen/i.test(source)) return 'pron.';
  if (/^Pronominaladverb$/i.test(source)) return 'adv.';
  if (/^Präposition(?: \+ Artikel)?$/i.test(source)) return 'prep.';
  if (/^Konjunktion$/i.test(source)) return 'konj.';
  if (/^Interjektion$/i.test(source)) return 'interj.';
  if (/^(Kardinalzahlwort|Ordinalzahlwort)$/i.test(source)) return 'num.';
  if (/Artikel/i.test(source)) return 'pron.';
  if (/^Mehrwortausdruck/i.test(source)) return 'phrase';
  // A1 particles have no dedicated app badge; treat them as adverbs rather than leak source labels.
  if (/^Partikel$/i.test(source)) return 'adv.';
  return FALLBACK_POS[key(lemma)] || 'phrase';
};
const vocabExact = new Map(VOCAB.map(w => [w.de, w]));
const entries = {};
const forms = {};
const positions = {};
const conflicts = [];

function addForm(form, lemma) {
  const f = key(form);
  if (!f) return;
  const prior = forms[f] || [];
  if (!prior.includes(lemma)) {
    prior.push(lemma);
    forms[f] = prior;
    if (prior.length > 1) conflicts.push(`${form}: ${prior.join(' / ')}`);
  }
}

// Common A1 irregular forms not otherwise supplied by VOCAB.forms.
const IRREGULAR = {
  sein: ['bin', 'bist', 'ist', 'sind', 'seid', 'waren', 'war', 'wäre'],
  haben: ['habe', 'hast', 'hat', 'haben', 'habt', 'hatte', 'hatten'],
  werden: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'wurde', 'wurden'],
  können: ['kann', 'kannst', 'können', 'könnt', 'konnte', 'konnten'],
  müssen: ['muss', 'musst', 'müssen', 'müsst', 'musste', 'mussten'],
  wollen: ['will', 'willst', 'wollen', 'wollt', 'wollte', 'wollten'],
  sollen: ['soll', 'sollst', 'sollen', 'sollt', 'sollte', 'sollten'],
  dürfen: ['darf', 'darfst', 'dürfen', 'dürft', 'durfte', 'durften'],
  mögen: ['mag', 'magst', 'mögen', 'mögt', 'mochte', 'mochten'],
  fahren: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt'],
  sprechen: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht'],
  essen: ['esse', 'isst', 'essen', 'esst'],
  lesen: ['lese', 'liest', 'lesen', 'lest'],
  sehen: ['sehe', 'siehst', 'sieht', 'sehen', 'seht'],
  nehmen: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt'],
  geben: ['gebe', 'gibst', 'gibt', 'geben', 'gebt'],
  helfen: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft'],
  schlafen: ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft'],
  laufen: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft'],
  tragen: ['trage', 'trägst', 'trägt', 'tragen', 'tragt'],
  waschen: ['wasche', 'wäschst', 'wäscht', 'waschen', 'wascht'],
  treffen: ['treffe', 'triffst', 'trifft', 'treffen', 'trefft'],
  vergessen: ['vergesse', 'vergisst', 'vergisst', 'vergessen', 'vergesst'],
  halten: ['halte', 'hältst', 'hält', 'halten', 'haltet'],
  lassen: ['lasse', 'lässt', 'lässt', 'lassen', 'lasst'],
  tun: ['tue', 'tust', 'tut', 'tun', 'tut'],
  anfangen: ['fange an', 'fängst an', 'fängt an', 'fangen an', 'fangt an'],
  einladen: ['lade ein', 'lädst ein', 'lädt ein', 'laden ein', 'ladet ein'],
};

function regularVerbForms(lemma) {
  if (!lemma.endsWith('en') || lemma.includes(' ')) return [];
  const stem = lemma.slice(0, -2);
  const needsE = /[td]$/.test(stem);
  const shortDu = /[sßzx]$/.test(stem);
  const eln = stem.endsWith('el');
  return [
    eln ? `${stem.slice(0, -1)}le` : `${stem}e`,
    shortDu ? `${stem}t` : `${stem}${needsE ? 'est' : 'st'}`,
    `${stem}${needsE ? 'et' : 't'}`,
    lemma,
    `${stem}${needsE ? 'et' : 't'}`,
    lemma,
  ];
}

for (const item of words) {
  if (/^(Symbol|Affix)$/i.test(item.pos || '')) continue;
  const lemma = clean(item.lemma);
  // Case is lexical data in German: Bitte/bitte and Deutsch/deutsch have
  // different parts of speech, so only an exact curated lemma may override.
  const v = vocabExact.get(lemma);
  const supplied = glosses[lemma];
  const g = typeof supplied === 'string' ? { zh: supplied } : (supplied || {});
  const pos = v?.pos || posFor(item.pos, v?.art || item.article, lemma);
  const art = v?.art ?? item.article ?? null;
  const pl = v?.pl ?? g.pl ?? null;
  const zh = lemma === 'Sie' && pos === 'n.'
    ? '“Sie”这一称呼'
    : (v?.zh ?? g.zh ?? '');
  const entry = { pos, art, ...(pl ? { pl } : {}), ...(zh ? { zh } : {}) };
  entries[lemma] = entries[lemma] || [];
  if (!entries[lemma].some(existing => JSON.stringify(existing) === JSON.stringify(entry))) entries[lemma].push(entry);
  positions[lemma] = [...new Set([...(positions[lemma] || []), pos].filter(Boolean))];
  if (pos === 'v.') {
    const suppliedForms = Object.values(v?.forms || {});
    const irregularForms = IRREGULAR[key(lemma)] || [];
    for (const form of suppliedForms) addForm(form, lemma);
    for (const form of irregularForms) addForm(form, lemma);
    // Never invent regular forms such as *fahrst for a known irregular verb.
    if (!suppliedForms.length && !irregularForms.length)
      for (const form of regularVerbForms(lemma)) addForm(form, lemma);
  }
  if (pos === 'n.' && pl) addForm(pl, lemma);
  if (pos === 'adj.') {
    const stem = lemma.endsWith('e') ? lemma.slice(0, -1) : lemma;
    for (const ending of ['e', 'en', 'er', 'es', 'em']) addForm(`${stem}${ending}`, lemma);
  }
}

// The app's curated vocabulary is also a source of truth. Keep entries that are
// intentionally outside the Goethe list (phrases and recently added course words).
for (const v of VOCAB) {
  if (entries[v.de]) continue;
  const pos = v.pos || (v.art ? 'n.' : 'phrase');
  const entry = {
    pos,
    art: v.art ?? null,
    ...(v.pl ? { pl: v.pl } : {}),
    ...(v.zh ? { zh: v.zh } : {}),
  };
  entries[v.de] = [entry];
  positions[v.de] = [pos];
  if (pos === 'v.') {
    const suppliedForms = Object.values(v.forms || {});
    const irregularForms = IRREGULAR[key(v.de)] || [];
    for (const form of suppliedForms) addForm(form, v.de);
    for (const form of irregularForms) addForm(form, v.de);
    if (!suppliedForms.length && !irregularForms.length)
      for (const form of regularVerbForms(v.de)) addForm(form, v.de);
  }
  if (pos === 'n.' && v.pl) addForm(v.pl, v.de);
  if (pos === 'adj.') {
    const stem = v.de.endsWith('e') ? v.de.slice(0, -1) : v.de;
    for (const ending of ['e', 'en', 'er', 'es', 'em']) addForm(`${stem}${ending}`, v.de);
  }
}

// Article and possessive-pronoun declensions are useful even when the base form is absent.
const FUNCTION_FORMS = {
  der: ['der', 'den', 'dem', 'des', 'die', 'das'],
  die: ['die', 'der', 'den'], das: ['das', 'dem', 'des'],
  mein: ['mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines'],
  dein: ['dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines'],
  sein: ['sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines'],
  ihr: ['ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres'],
  Ihr: ['Ihr', 'Ihre', 'Ihren', 'Ihrem', 'Ihrer', 'Ihres'],
  unser: ['unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres'],
  euer: ['euer', 'eure', 'euren', 'eurem', 'eurer', 'eures'],
};
for (const [lemma, list] of Object.entries(FUNCTION_FORMS)) {
  if (!entries[lemma]) entries[lemma] = [{ pos: 'pron.', art: null }];
  positions[lemma] = [...new Set([...(positions[lemma] || []), 'pron.'])];
  for (const form of list) addForm(form, lemma);
}

// The Goethe source lists only the noun Klasse, while lowercase klasse is a
// common A1 predicative adjective/interjection and must not inherit noun data.
entries.klasse = [{ pos: 'adj.', art: null, zh: '很棒的；出色的' }];
positions.klasse = ['adj.'];

// The DWDS A1 scrape drops a batch of core function words (du/als/neben …).
// Without them the lookup popup stays silent on the commonest words in a text,
// and difficulty tooling is pushed into maintaining its own whitelist instead.
const A1_GAPS = {
  als: { pos: 'konj.', zh: '当……时；作为' },
  deshalb: { pos: 'adv.', zh: '因此；所以' },
  direkt: { pos: 'adj.', zh: '直接的；就在' },
  doch: { pos: 'adv.', zh: '可是；还是' },
  du: { pos: 'pron.', zh: '你' },
  erst: { pos: 'adv.', zh: '才；起初' },
  fallen: { pos: 'v.', zh: '落下；下降', forms: ['falle', 'fällst', 'fällt', 'fallen', 'fallt'] },
  früh: { pos: 'adj.', zh: '早的；早' },
  genau: { pos: 'adj.', zh: '准确的；正是' },
  gegenüber: { pos: 'prep.', zh: '在……对面' },
  hinter: { pos: 'prep.', zh: '在……后面' },
  mich: { pos: 'pron.', zh: '我（第四格）' },
  neben: { pos: 'prep.', zh: '在……旁边' },
  null: { pos: 'num.', zh: '零' },
  sondern: { pos: 'konj.', zh: '而是' },
  Stück: { pos: 'n.', art: 'das', pl: 'Stücke', zh: '块；个（量词）' },
  uns: { pos: 'pron.', zh: '我们（第三/四格）' },
  vorbei: { pos: 'adv.', zh: '过去了；经过' },
  Weg: { pos: 'n.', art: 'der', pl: 'Wege', zh: '路；道路' },
  Markt: { pos: 'n.', art: 'der', pl: 'Märkte', zh: '市场；集市' },
  Notiz: { pos: 'n.', art: 'die', pl: 'Notizen', zh: '便条；笔记' },
  Telefonnummer: { pos: 'n.', art: 'die', pl: 'Telefonnummern', zh: '电话号码' },
  Vorschlag: { pos: 'n.', art: 'der', pl: 'Vorschläge', zh: '建议' },
  Wohnort: { pos: 'n.', art: 'der', pl: 'Wohnorte', zh: '居住地' },
  Wunsch: { pos: 'n.', art: 'der', pl: 'Wünsche', zh: '愿望' },
  denken: { pos: 'v.', zh: '想；思考', forms: ['denke', 'denkst', 'denkt', 'denken', 'dachte', 'dachten'] },
  vergessen: { pos: 'v.', zh: '忘记', forms: ['vergesse', 'vergisst', 'vergessen', 'vergesst'] },
  ausgehen: { pos: 'v.', zh: '外出；出门', forms: ['gehe aus', 'gehst aus', 'geht aus', 'gehen aus'] },
  zurückkommen: { pos: 'v.', zh: '回来', forms: ['komme zurück', 'kommst zurück', 'kommt zurück', 'kommen zurück'] },
  zurückfahren: { pos: 'v.', zh: '返回（乘车）', forms: ['fahre zurück', 'fährst zurück', 'fährt zurück', 'fahren zurück'] },
};
for (const [lemma, spec] of Object.entries(A1_GAPS)) {
  if (entries[lemma]) continue; // 抓取里已经有了就不覆盖
  entries[lemma] = [{
    pos: spec.pos,
    art: spec.art ?? null,
    ...(spec.pl ? { pl: spec.pl } : {}),
    ...(spec.zh ? { zh: spec.zh } : {}),
  }];
  positions[lemma] = [spec.pos];
  if (spec.pl) addForm(spec.pl, lemma);
  for (const form of spec.forms || []) addForm(form, lemma);
}

// Partizip II. The source lists infinitives only, but every L6/R6 text is Perfekt,
// so without these the reader taps "gefahren" and gets nothing.
const PARTICIPLES = {
  angefangen: 'anfangen', aufgestanden: 'aufstehen', ausgegangen: 'ausgehen',
  eingeladen: 'einladen', mitgenommen: 'mitnehmen', zurückgekommen: 'zurückkommen',
  zurückgefahren: 'zurückfahren', gebracht: 'bringen', gedacht: 'denken',
  gefahren: 'fahren', gefallen: 'fallen', gefunden: 'finden', gegangen: 'gehen',
  gegeben: 'geben', gegessen: 'essen', geblieben: 'bleiben', gehabt: 'haben',
  geholfen: 'helfen', gekommen: 'kommen', gelaufen: 'laufen', gelesen: 'lesen',
  genommen: 'nehmen', geschlafen: 'schlafen', geschrieben: 'schreiben',
  gesehen: 'sehen', gesprochen: 'sprechen', gestanden: 'stehen', getroffen: 'treffen',
  getrunken: 'trinken', gewesen: 'sein', gewusst: 'wissen', geworden: 'werden',
  verstanden: 'verstehen', verschoben: 'verschieben',
  verloren: 'verlieren', begonnen: 'beginnen', gewonnen: 'gewinnen',
  geschlossen: 'schließen', geflogen: 'fliegen', gestiegen: 'steigen',
  gezogen: 'ziehen', angerufen: 'anrufen', geschwommen: 'schwimmen',
  gesungen: 'singen', gewaschen: 'waschen', getragen: 'tragen',
  gelassen: 'lassen', gehalten: 'halten', geheißen: 'heißen',
};
const PARTICIPLE_LEMMAS = new Set(Object.values(PARTICIPLES));
// 单独导出一份分词表：难度/语法审计要判断"这是不是完成时"，
// 靠 ge- 正则既漏掉 verschoben，又会误伤 Gesicht/Gebäude。
const participles = {};
const addParticiple = (form, lemma) => {
  // 「这是第二分词」是形态事实，与该动词是否属于 A1 词表无关：
  // verschieben 不在 A1 词库里，但 verschoben 仍然是完成时，审计必须看得见。
  participles[key(form)] = lemma;
  if (entries[lemma]) addForm(form, lemma);
};
for (const [form, lemma] of Object.entries(PARTICIPLES)) addParticiple(form, lemma);

// Regular Partizip II, built with the same restraint as the present tense above:
// never invented for a verb we already know to be irregular.
const SEPARABLE = ['ab', 'an', 'auf', 'aus', 'ein', 'mit', 'nach', 'vor', 'zurück', 'zusammen', 'weg', 'los', 'statt', 'fest'];
const INSEPARABLE = /^(be|emp|ent|er|ge|miss|ver|zer)/;
function regularParticiple(lemma) {
  if (!lemma.endsWith('en') || lemma.includes(' ')) return null;
  const suffix = stem => `${stem}${/[td]$/.test(stem) ? 'et' : 't'}`;
  const sep = SEPARABLE.find(p => lemma.startsWith(p) && lemma.length > p.length + 3);
  if (sep) return `${sep}ge${suffix(lemma.slice(sep.length, -2))}`;
  if (INSEPARABLE.test(lemma)) return suffix(lemma.slice(0, -2));
  return `ge${suffix(lemma.slice(0, -2))}`;
}
for (const [lemma, list] of Object.entries(entries)) {
  if (!list.some(entry => entry.pos === 'v.')) continue;
  if (PARTICIPLE_LEMMAS.has(lemma) || IRREGULAR[key(lemma)]) continue;
  const participle = regularParticiple(lemma);
  if (participle) addParticiple(participle, lemma);
}

const missing = Object.entries(entries).filter(([, list]) => list.some(entry => !entry.zh)).map(([lemma]) => lemma);
const output = `// Generated by tools/gen_dict.mjs. Do not edit manually.\nexport const DICT_ENTRIES = ${JSON.stringify(entries, null, 2)};\n\nexport const DICT_FORMS = ${JSON.stringify(forms, null, 2)};\n\nexport const DICT_POS = ${JSON.stringify(positions, null, 2)};\n\nexport const DICT_PARTICIPLES = ${JSON.stringify(participles, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'data/dict-core.js'), output);
console.log(`dict-core: ${Object.keys(entries).length} entries, ${Object.keys(forms).length} forms`);
console.log(`缺释义 (${missing.length}): ${missing.join(', ') || '无'}`);
console.log(`forms 冲突 (${conflicts.length}): ${conflicts.join('; ') || '无'}`);
