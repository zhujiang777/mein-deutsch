import test from 'node:test';
import assert from 'node:assert/strict';
import { getInsertionIndex } from '../js/chip-board.js';

const rect = (left, top, width = 80, height = 44) => ({
  left, top, right: left + width, bottom: top + height,
});

test('drag insertion chooses the correct position in one row', () => {
  const cells = [rect(20, 100), rect(110, 100), rect(200, 100)];
  assert.equal(getInsertionIndex(cells, 25, 120), 0);
  assert.equal(getInsertionIndex(cells, 160, 120), 2);
  assert.equal(getInsertionIndex(cells, 310, 120), 3);
});

test('drag insertion respects wrapped rows', () => {
  const cells = [rect(20, 100), rect(110, 100), rect(20, 154), rect(110, 154)];
  assert.equal(getInsertionIndex(cells, 25, 170), 2);
  assert.equal(getInsertionIndex(cells, 210, 170), 4);
});

test('empty answer zone accepts the first chip', () => {
  assert.equal(getInsertionIndex([], 100, 100), 0);
});
