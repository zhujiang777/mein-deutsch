import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
};
globalThis.window = { dispatchEvent() {} };

let now = 1_800_000_000_000;
const realNow = Date.now;
Date.now = () => now;

const {
  addListenMiss, dueListenMisses, listenRef, rateMistake
} = await import('../js/mastery.js');

test('listening misses use the l namespace and retain their sentence reference', () => {
  values.clear();
  addListenMiss('li-p03', 4);
  const stored = JSON.parse(localStorage.getItem('md.srs.v1'));
  assert.ok(stored['l:li-p03:4']);
  assert.equal(Object.keys(stored).some(id => id.startsWith('m:li-p03')), false);
  assert.deepEqual(listenRef('l:li-p03:4'), { packId: 'li-p03', sentenceIndex: 4 });
  assert.deepEqual(dueListenMisses(), []);

  now += 86400000;
  assert.deepEqual(dueListenMisses(), ['l:li-p03:4']);
  rateMistake('l:li-p03:4', false);
  assert.equal(JSON.parse(localStorage.getItem('md.srs.v1'))['l:li-p03:4'].lapses, 2);
});

test.after(() => { Date.now = realNow; });
