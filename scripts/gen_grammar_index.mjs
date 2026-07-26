import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildGrammarIndexSource } from '../tools/grammar-index.mjs';

const outputUrl = new URL('../data/grammar-index.js', import.meta.url);
writeFileSync(outputUrl, buildGrammarIndexSource(), 'utf8');
console.log(`已更新 ${fileURLToPath(outputUrl)}`);
