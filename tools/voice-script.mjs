// 配音清单：把故事课（data/story-lessons.js）里所有要念的字按角色分组，写到 tools/voice-script.json。
// 以后订阅 ElevenLabs 时照这份清单批量生成；改了课文后重跑：node tools/voice-script.mjs
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { STORY_CAST, storyAudioItems } from '../data/story-lessons.js';

const out = { note: '由 tools/voice-script.mjs 生成，勿手改。id = 角色+文本的指纹，可直接当音频文件名。', voices: {} };
for (const [role, c] of Object.entries(STORY_CAST)) out.voices[role] = { voice: c.voice, chars: 0, items: [] };
for (const { voice, text, kind, lesson } of storyAudioItems()) {
  const v = out.voices[voice];
  v.items.push({ id: createHash('sha1').update(`${voice}|${text}`).digest('hex').slice(0, 12), lesson, kind, text });
  v.chars += text.length;
}
writeFileSync(new URL('./voice-script.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
let total = 0;
for (const [role, v] of Object.entries(out.voices)) { total += v.chars; console.log(`${role}（${v.voice}）：${v.items.length} 条，${v.chars} 字符`); }
console.log(`合计 ${total} 字符`);
