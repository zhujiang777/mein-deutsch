import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RATE_STEPS, SLOW_RATE,
  clampRange, nextRate, normalizeRate, segUsable, sentenceAt,
} from '../js/audio-timing.js';

test('slow rate is a real step and stays the single source of truth', () => {
  assert.ok(RATE_STEPS.includes(SLOW_RATE));
  assert.deepEqual(RATE_STEPS, [...RATE_STEPS].sort((a, b) => a - b));
  assert.equal(RATE_STEPS[RATE_STEPS.length - 1], 1);
});

test('rates snap to a legal step so the label can never lie', () => {
  assert.equal(normalizeRate(0.62), 0.6);
  assert.equal(normalizeRate(0.8), SLOW_RATE);
  assert.equal(normalizeRate(2), 1);
  assert.equal(normalizeRate('nope'), 1);
  assert.equal(normalizeRate(undefined), 1);
});

test('rate chip cycles through every step and wraps', () => {
  const seen = [];
  let rate = RATE_STEPS[0];
  for (let i = 0; i < RATE_STEPS.length; i++) { seen.push(rate); rate = nextRate(rate); }
  assert.deepEqual(seen, RATE_STEPS);
  assert.equal(rate, RATE_STEPS[0], 'wraps back to the first step');
});

test('AB range accepts marks in either order and clamps to the pack', () => {
  assert.deepEqual(clampRange(1, 4, 10), { from: 1, to: 4 });
  assert.deepEqual(clampRange(4, 1, 10), { from: 1, to: 4 }, 'B marked before A still yields a forward range');
  assert.deepEqual(clampRange(-3, 99, 10), { from: 0, to: 9 });
  assert.deepEqual(clampRange(2, 2, 10), { from: 2, to: 2 }, 'single sentence loop');
  assert.equal(clampRange(0, 1, 0), null, 'empty pack has no range');
  assert.equal(clampRange(NaN, 1, 10), null);
});

const SEG = [[0, 2.31], [2.66, 5.12], [5.47, 9.03]];

test('playhead maps to the right sentence, gaps stay with the previous one', () => {
  assert.equal(sentenceAt(SEG, 0), 0);
  assert.equal(sentenceAt(SEG, 2.3), 0);
  assert.equal(sentenceAt(SEG, 2.4), 0, 'inter-sentence gap must not flicker back');
  assert.equal(sentenceAt(SEG, 2.66), 1);
  assert.equal(sentenceAt(SEG, 100), 2, 'past the end stays on the last sentence');
  assert.equal(sentenceAt(SEG, -1), -1);
  assert.equal(sentenceAt([], 1), -1);
});

test('unusable timestamps are rejected so the pack degrades instead of desyncing', () => {
  assert.ok(segUsable(SEG, 3));
  assert.equal(segUsable(SEG, 4), false, 'segment count must match sentence count');
  assert.equal(segUsable([[0, 2], [1.5, 4]], 2), true, 'slight overlap is tolerated');
  assert.equal(segUsable([[0, 2], [1.5, 1.2]], 2), false, 'end before start is not');
  assert.equal(segUsable([[2, 4], [0, 1]], 2), false, 'out-of-order starts are not');
  assert.equal(segUsable([[0, 'x']], 1), false);
  assert.equal(segUsable(undefined, 3), false);
});
