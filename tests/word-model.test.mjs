import test from 'node:test';
import assert from 'node:assert/strict';
import { conjugationRows, getVocabWord, normalizeWord } from '../js/word-model.js';

test('shared word model exposes complete verb content', () => {
  const word = normalizeWord(getVocabWord('w016'));
  assert.equal(word.de, 'heißen');
  assert.equal(word.spoken, 'heißen');
  assert.ok(word.sentences.length >= 3);
  assert.ok(word.phrases.length >= 1);

  const forms = conjugationRows(word);
  assert.deepEqual(forms.persons.map(row => row.label), ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']);
  assert.equal(forms.persons[0].value, 'heiße');
  assert.equal(forms.extras[0].label, 'Perfekt');
  assert.equal(forms.extras[0].value, 'hat geheißen');
});

test('shared word model safely omits unavailable optional sections', () => {
  const word = normalizeWord({ id: 'demo', de: 'heute', zh: '今天', pos: 'adv.' });
  assert.deepEqual(word.phrases, []);
  assert.deepEqual(word.sentences, []);
  assert.equal(word.forms, null);
  assert.equal(word.mnemonic, null);
  assert.deepEqual(conjugationRows(word), { persons: [], extras: [] });
});

test('shared word model includes the article in noun pronunciation', () => {
  const word = normalizeWord({ id: 'demo-n', de: 'Tisch', zh: '桌子', art: 'der', pl: 'Tische' });
  assert.equal(word.spoken, 'der Tisch');
  assert.equal(word.senses[0].pos, 'n.');
});
