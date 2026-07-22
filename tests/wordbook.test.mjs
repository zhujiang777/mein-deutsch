import test from 'node:test';
import assert from 'node:assert/strict';

const data = new Map();
globalThis.localStorage = {
  getItem: (key) => data.has(key) ? data.get(key) : null,
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: (key) => data.delete(key),
};
globalThis.window = { dispatchEvent() {} };

const { addWordEntry, getWordbook, removeWordEntry, loadSrs, saveSrs, exportAll, importAll } = await import('../js/storage.js');

test('wordbook uses d namespace and deleting it removes matching SRS state', () => {
  data.clear();
  const id = addWordEntry({ lemma: 'Abfahrt', zh: '出发', art: 'die', pl: 'Abfahrten', sentence: 'Die Abfahrt ist um acht.' });
  assert.equal(id, 'd:Abfahrt');
  assert.equal(getWordbook()[id].zh, '出发');
  saveSrs({ [id]: { state: 'learn', due: 1 } });
  assert.equal(removeWordEntry(id), true);
  assert.equal(getWordbook()[id], undefined);
  assert.equal(loadSrs()[id], undefined);
});

test('wordbook survives progress export and import', () => {
  data.clear();
  const id = addWordEntry({ lemma: 'Bahnsteig', zh: '站台', art: 'der' });
  const exported = exportAll();
  data.clear();
  importAll(exported);
  assert.equal(getWordbook()[id].lemma, 'Bahnsteig');
  assert.ok(id.startsWith('d:'));
});
