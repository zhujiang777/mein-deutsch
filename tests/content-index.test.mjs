import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COURSE } from '../data/course.js';
import { VOCAB } from '../data/vocab.js';
import { COURSE_CATALOG, VOCAB_IDS } from '../data/content-index.js';
import { buildContentIndexSource } from '../scripts/gen_content_index.mjs';

test('lightweight content index matches the full Claude-authored content', async () => {
  assert.deepEqual(VOCAB_IDS, VOCAB.map(word => word.id));
  assert.deepEqual(
    COURSE_CATALOG.map(unit => ({
      id: unit.id,
      lessons: unit.lessons.map(lesson => ({ id: lesson.id, stepCount: lesson.stepCount })),
    })),
    COURSE.map(unit => ({
      id: unit.id,
      lessons: unit.lessons.map(lesson => ({ id: lesson.id, stepCount: lesson.steps.length })),
    })),
  );
  const generated = await readFile(new URL('../data/content-index.js', import.meta.url), 'utf8');
  assert.equal(generated, buildContentIndexSource());
});
