import { FRAMEWORK, PILOT_LESSONS, PILOT_MATERIALS, KNOWLEDGE_MAP } from '../data/integrated-course.js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COURSE } from '../data/course.js';
import { VOCAB } from '../data/vocab.js';
import { READINGS } from '../data/readings.js';
import { LISTENING_PACKS } from '../data/listening.js';
import { buildContentVocab, buildContentWordCounts } from '../tools/auto-vocab-refs.mjs';

export function buildContentIndex() {
  return {
    integrated: { framework: FRAMEWORK, lessons: PILOT_LESSONS.map(({id,version,title,unit,needs,words,grammarRefs})=>({id,version,title,unit,needs,words,grammarRefs})), materials: PILOT_MATERIALS.map(({id,title,unit,after})=>({id,title,unit,after})), knowledge: KNOWLEDGE_MAP },
    contentVocab: buildContentVocab([...READINGS, ...LISTENING_PACKS]),
    contentWordCounts: buildContentWordCounts([...READINGS, ...LISTENING_PACKS]),
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
        vocabRefs: lesson.vocabRefs || [],
        stepCount: lesson.steps.length,
      })),
    })),
    vocabIds: VOCAB.map(word => word.id),
  };
}

export function buildContentIndexSource(index = buildContentIndex()) {
  return `// 此文件由 scripts/gen_content_index.mjs 自动生成，请勿手改。
export const INTEGRATED_CATALOG = ${JSON.stringify(index.integrated, null, 2)};
export const COURSE_CATALOG = ${JSON.stringify(index.course, null, 2)};

export const VOCAB_IDS = ${JSON.stringify(index.vocabIds, null, 2)};

// 精读/精听正文里实际出现的词（自动标注，见 tools/auto-vocab-refs.mjs）。
// 推荐排序与"正合适/稍难"标签都读这里，不要读内容文件里手写的 vocabRefs——
// 后者是作者标注意图，覆盖不全，当信号用会退化成噪声。
export const CONTENT_VOCAB = ${JSON.stringify(index.contentVocab, null, 1)};

// 正文实词总数。readiness 的分母必须是它，不是 CONTENT_VOCAB 的长度——
// 后者漏掉所有没有词卡的生词，算出的已知率会永远接近 100%。
export const CONTENT_WORD_COUNTS = ${JSON.stringify(index.contentWordCounts, null, 1)};

/** 一份内容实际覆盖的词 id；没有索引时回退到手写 vocabRefs。 */
export function contentVocabRefs(item) {
  return CONTENT_VOCAB[item?.id] || item?.vocabRefs || [];
}

/** 一份内容的实词总数；没有索引时退回已知词数，至少不会除以 0。 */
export function contentWordTotal(item) {
  return CONTENT_WORD_COUNTS[item?.id] || contentVocabRefs(item).length;
}

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
