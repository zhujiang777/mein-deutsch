import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COURSE } from '../data/course.js';
import { VOCAB } from '../data/vocab.js';

export function buildContentIndex() {
  return {
    course: COURSE.map(unit => ({
      id: unit.id,
      title: unit.title,
      icon: unit.icon,
      track: unit.track || 'grammar',
      intro: unit.intro || '',
      nicosWeg: unit.nicosWeg || null,
      videos: unit.videos || [],
      lessons: unit.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        skills: lesson.skills || [],
        stepCount: lesson.steps.length,
      })),
    })),
    vocabIds: VOCAB.map(word => word.id),
  };
}

export function buildContentIndexSource(index = buildContentIndex()) {
  return `// 此文件由 scripts/gen_content_index.mjs 自动生成，请勿手改。
export const COURSE_CATALOG = ${JSON.stringify(index.course, null, 2)};

export const VOCAB_IDS = ${JSON.stringify(index.vocabIds, null, 2)};

export function nextCatalogLesson(states = {}) {
  for (const unit of COURSE_CATALOG) {
    for (const lesson of unit.lessons) {
      if (!states[lesson.id]?.done) return { unit, lesson };
    }
  }
  return null;
}
`;
}

const outputUrl = new URL('../data/content-index.js', import.meta.url);
if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  writeFileSync(outputUrl, buildContentIndexSource(), 'utf8');
  console.log(`已更新 ${fileURLToPath(outputUrl)}`);
}
