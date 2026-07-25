import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildWordExamples, buildWordExamplesSource, MAX_PER_WORD } from '../tools/word-examples.mjs';
import { VOCAB } from '../data/vocab.js';

const index = buildWordExamples();
const outputUrl = new URL('../data/word-examples.js', import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  writeFileSync(outputUrl, buildWordExamplesSource(index), 'utf8');
  const covered = Object.keys(index).length;
  const total = Object.values(index).reduce((sum, list) => sum + list.length, 0);
  console.log(`已更新 ${fileURLToPath(outputUrl)}`);
  console.log(`覆盖 ${covered}/${VOCAB.length} 个词（${(covered / VOCAB.length * 100).toFixed(0)}%），共 ${total} 条例句，每词上限 ${MAX_PER_WORD}`);
}
