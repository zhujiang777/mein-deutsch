import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
};
globalThis.window = { dispatchEvent() {} };

const {
  getDaily, getRewards, logActivity, migrate, rewardSummary, setSetting,
} = await import('../js/storage.js');

test('v3 migration backfills XP and records existing lesson completions', () => {
  values.clear();
  localStorage.setItem('md.meta.v1', JSON.stringify({ schemaVersion: 2 }));
  localStorage.setItem('md.daily.v1', JSON.stringify({
    '2026-07-20': { items: 12, ok: 9, lessons: 1 },
  }));
  localStorage.setItem('md.lessons.v1', JSON.stringify({ u0l1: { done: true } }));

  migrate();

  const day = JSON.parse(localStorage.getItem('md.daily.v1'))['2026-07-20'];
  assert.equal(day.xp, 41);
  assert.equal(day.goalClaimed, true);
  assert.equal(getRewards().totalXp, 41);
  assert.equal(getRewards().completions['lesson:u0l1'], true);
});

test('activity reaches the daily target once and returns reward events', () => {
  values.clear();
  migrate();
  const result = logActivity({ items: 10, ok: 10 });
  assert.equal(result.xpDelta, 30);
  assert.equal(result.goalReached, true);
  assert.equal(getDaily().xp, 30);
  assert.equal(rewardSummary().totalXp, 30);

  const next = logActivity({ items: 1, ok: 1 });
  assert.equal(next.goalReached, false);
  assert.equal(next.xpDelta, 2);
});

test('completion bonus is idempotent', () => {
  values.clear();
  migrate();
  setSetting('dailyGoalXp', 100);
  const first = logActivity({ completionId: 'lesson:u0l2' });
  const repeat = logActivity({ completionId: 'lesson:u0l2' });
  assert.equal(first.xpDelta, 10);
  assert.equal(repeat.xpDelta, 0);
  assert.equal(getRewards().totalXp, 10);
});
