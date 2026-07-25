// 把精听包与上一轮生成的音频索引一起吐成 JSON，供 tools/gen_listening_audio.py 消费。
// 单独一个脚本是因为 Python 侧没法解析 ES module，而重跑时需要读回旧的时间戳来实现幂等。
// 用法: node tools/dump_listening.mjs
import { LISTENING_PACKS } from '../data/listening.js';

let existing = {};
try {
  ({ LISTENING_AUDIO: existing } = await import('../data/listening-audio.js'));
} catch {
  // 首次运行还没有生成物，正常
}

process.stdout.write(JSON.stringify({ packs: LISTENING_PACKS, existing }));
