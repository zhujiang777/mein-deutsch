import test from 'node:test';
import assert from 'node:assert/strict';

const data = new Map();
globalThis.localStorage = {
  getItem: (key) => data.has(key) ? data.get(key) : null,
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: (key) => data.delete(key),
};
globalThis.window = { dispatchEvent() {} };

const { rate, LEARN_STEPS } = await import('../js/srs.js');

test('learning ladder progresses 1 day → 3 days and graduates', () => {
  data.clear();
  const before = Date.now();
  const first = rate('w001', 'good');
  assert.equal(first.state, 'learn');
  assert.equal(first.step, 1);
  assert.ok(first.due >= before + LEARN_STEPS[1] - 30);

  const second = rate('w001', 'good');
  assert.equal(second.state, 'review');
  assert.equal(second.step, 2);
  assert.equal(second.ivl, 3);
  assert.ok(second.due >= before + LEARN_STEPS[2] - 30);
});

test('again resets a card to the ten-minute rung', () => {
  data.clear();
  const before = Date.now();
  const card = rate('w002', 'again');
  assert.equal(card.state, 'learn');
  assert.equal(card.step, 0);
  assert.equal(card.ivl, 0);
  assert.ok(card.due >= before + LEARN_STEPS[0] - 30);
});

test('legacy learn card without a step resumes safely', () => {
  data.clear();
  localStorage.setItem('md.srs.v1', JSON.stringify({ w003: {
    due: 0, ivl: 0, ease: 2.5, reps: 1, lapses: 0, state: 'learn',
  } }));
  const card = rate('w003', 'hard');
  assert.equal(card.state, 'learn');
  assert.equal(card.step, 1);
  assert.ok(card.ease < 2.5);
});

test('easy graduates a new card directly at three days', () => {
  data.clear();
  const card = rate('w004', 'easy');
  assert.equal(card.state, 'review');
  assert.equal(card.ivl, 3);
  assert.equal(card.step, 2);
});

test('review interval behavior remains unchanged', () => {
  data.clear();
  localStorage.setItem('md.srs.v1', JSON.stringify({ w005: {
    due: 0, ivl: 10, ease: 2.5, reps: 4, lapses: 0, state: 'review',
  } }));
  const card = rate('w005', 'good');
  assert.equal(card.state, 'review');
  assert.equal(card.ivl, 25);
});
