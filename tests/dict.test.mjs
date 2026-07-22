import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { VOCAB } from '../data/vocab.js';
import { DICT_GLOSSES } from '../data/dict-glosses.js';

globalThis.speechSynthesis = { addEventListener() {}, getVoices: () => [], cancel() {} };
globalThis.window = { dispatchEvent() {}, speechSynthesis: globalThis.speechSynthesis };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { lookup } = await import('../js/dict.js');
const { DICT_ENTRIES, DICT_FORMS, DICT_POS } = await import('../data/dict-core.js');

const hasLemma = (raw, lemma) => lookup(raw).some(entry => entry.lemma === lemma);

test('dictionary resolves direct lemmas, inflections, and unknown words', () => {
  assert.ok(hasLemma('fährt', 'fahren'));
  assert.ok(hasLemma('bist', 'sein'));
  assert.ok(hasLemma('gute', 'gut'));
  assert.ok(hasLemma('Brüder', 'Bruder'));
  assert.ok(hasLemma('Hallo', 'Hallo'));
  assert.deepEqual(lookup('qzxvnotawort'), []);
});

test('dictionary preserves casing and same-lemma multi-part-of-speech entries', () => {
  assert.equal(lookup('Morgen')[0].pos, 'n.');
  assert.equal(lookup('Morgen')[1].lemma, 'morgen');
  assert.equal(lookup('Morgen')[1].pos, 'adv.');
  assert.equal(lookup('morgen')[0].pos, 'adv.');
  assert.equal(lookup('Essen')[0].pos, 'n.');
  assert.equal(lookup('Essen')[1].lemma, 'essen');
  assert.equal(lookup('essen')[0].pos, 'v.');
  assert.equal(DICT_ENTRIES.an.length, 2);
  assert.deepEqual(DICT_POS.an, ['prep.', 'adv.']);
  assert.equal(lookup('Sie')[0].pos, 'pron.');
  assert.equal(lookup('Sie')[0].zh, '您；你们（敬称）');
  assert.equal(lookup('Sie')[1].pos, 'n.');
  assert.notEqual(lookup('Sie')[1].zh, lookup('Sie')[0].zh);
  assert.equal(lookup('Bitte')[0].pos, 'n.');
  assert.match(lookup('Bitte')[0].zh, /请求|恳求/);
  assert.equal(lookup('Bitte')[1].lemma, 'bitte');
  assert.equal(lookup('Bitte')[1].pos, 'adv.');
  assert.equal(lookup('bitte')[0].pos, 'adv.');
  assert.equal(lookup('deutsch')[0].pos, 'adj.');
  assert.equal(lookup('Deutsch')[0].pos, 'n.');
  assert.equal(lookup('’s')[0].lemma, '’s');
  assert.equal(lookup("'s")[0].lemma, '’s');
});

test('homographs keep exact and inflected meanings separate', () => {
  assert.deepEqual(lookup('weiß').map(entry => entry.lemma), ['weiß', 'wissen']);
  assert.deepEqual(lookup('weiß').map(entry => entry.zh), ['白色的', '知道（ich weiß）']);
  assert.deepEqual(lookup('weißen').map(entry => entry.lemma), ['weiß']);
  assert.equal(lookup('Klasse')[0].pos, 'n.');
  assert.equal(lookup('klasse')[0].pos, 'adj.');
});

test('formal Ihr inflections stay distinct from lowercase ihr forms', () => {
  for (const [formal, lowerForm] of [['Ihren', 'ihren'], ['Ihrem', 'ihrem'], ['Ihrer', 'ihrer'], ['Ihres', 'ihres']]) {
    assert.equal(lookup(formal)[0].lemma, 'Ihr');
    assert.match(lookup(formal)[0].zh, /敬称/);
    assert.equal(lookup(lowerForm)[0].lemma, 'ihr');
    assert.doesNotMatch(lookup(lowerForm)[0].zh, /敬称/);
  }
});

test('adjectives ending in e use real inflections rather than double-e forms', () => {
  assert.ok(hasLemma('bösen', 'böse'));
  assert.equal(DICT_FORMS.bösee, undefined);
  assert.ok(DICT_FORMS.bösem?.includes('böse'));
});

test('known irregular verbs do not receive invented regular forms', () => {
  assert.equal(DICT_FORMS.fahrst, undefined);
  assert.ok(DICT_FORMS.fährst?.includes('fahren'));
});

test('generated entries include every curated VOCAB lemma, including local phrases', () => {
  for (const word of VOCAB) assert.ok(DICT_ENTRIES[word.de], `missing ${word.de}`);
});

test('hand-written glosses exactly cover the Goethe entries missing from VOCAB', () => {
  const wortliste = JSON.parse(fs.readFileSync(new URL('../tools/wortliste.json', import.meta.url), 'utf8'));
  const vocabLemmas = new Set(VOCAB.map(word => word.de));
  const rawTargets = wortliste.filter(item =>
    !vocabLemmas.has(item.lemma) && !['Symbol', 'Affix'].includes(item.pos));
  const targetKeys = [...new Set(rawTargets.map(item => item.lemma))].sort();
  const glossKeys = Object.keys(DICT_GLOSSES).sort();
  assert.equal(rawTargets.length, 591);
  assert.equal(targetKeys.length, 582); // the source list contains repeated lemmas
  assert.deepEqual(glossKeys, targetKeys);
  assert.ok(Object.values(DICT_GLOSSES).every(value =>
    typeof value === 'string' ? value.trim() : value?.zh?.trim()));
  for (const lemma of glossKeys)
    assert.ok(lookup(lemma).some(entry => entry.lemma === lemma), `lookup lost ${lemma}`);
});
