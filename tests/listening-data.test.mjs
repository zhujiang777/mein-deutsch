import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { LISTENING_PACKS, findPack } from '../data/listening.js';
import { LISTENING_AUDIO } from '../data/listening-audio.js';
import { coverage } from '../tools/a1-coverage.mjs';
import { segUsable } from '../js/audio-timing.js';

// 授权白名单。要加新来源必须同时在这里登记，逼作者想清楚授权条款。
const LICENSES = new Set(['CC0-1.0', 'CC BY 2.0 FR', 'CC BY 2.5', 'CC BY 4.0', 'CC BY-SA 4.0', 'proprietary']);
// 专名与数字不在 A1 词表里也不算生词。
const PROPER = new Set(['berlin', 'anna', 'deutschland', 'wiedersehen']);

const audioUrl = name => new URL(`../audio/${name}`, import.meta.url);

test('pack ids are unique, li-prefixed, and findable', () => {
  const ids = LISTENING_PACKS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length, '重复的 pack id');
  for (const id of ids) {
    // 前缀保证 pack id 与课程 id（u1l1 / sa-l1）在 md.lessons.v1 和 SRS 里永不撞车
    assert.match(id, /^li-/, `${id} 必须以 li- 开头`);
    assert.equal(findPack(id)?.id, id);
  }
  assert.equal(findPack('nope'), null);
});

test('provenance is complete enough to satisfy the licence it claims', () => {
  for (const pack of LISTENING_PACKS) {
    const p = pack.provenance;
    assert.ok(p, `${pack.id} 缺 provenance`);
    assert.ok(['corpus', 'original', 'tts'].includes(p.kind), `${pack.id} kind 非法：${p.kind}`);
    assert.ok(LICENSES.has(p.license), `${pack.id} license 不在白名单：${p.license}`);

    if (p.kind === 'original') {
      // 原创包必须交代边界，否则没人说得清它是不是抄的
      assert.ok(p.adaptedFrom?.statement?.trim(), `${pack.id} 缺 adaptedFrom.statement`);
      if (p.adaptedFrom.work) {
        assert.ok(Array.isArray(p.adaptedFrom.borrowed) && p.adaptedFrom.borrowed.length,
          `${pack.id} 声明了取材教材就必须列出 borrowed 事实层清单`);
      }
    } else {
      // CC BY 系列要求署名 + 声明是否改动，靠人记必漏，所以变成测试门槛
      for (const field of ['licenseUrl', 'attribution', 'originalUrl', 'retrievedAt']) {
        assert.ok(p[field]?.trim(), `${pack.id} 外部语料缺 ${field}`);
      }
      assert.equal(typeof p.modified, 'boolean', `${pack.id} 必须声明 modified`);
      if (p.modified) assert.ok(p.modifiedNote?.trim(), `${pack.id} 改动了就必须写 modifiedNote`);
      assert.match(p.retrievedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});

test('sentences, speakers and step indices all line up', () => {
  for (const pack of LISTENING_PACKS) {
    assert.ok(pack.sentences?.length, `${pack.id} 没有句子`);
    const speakerIds = new Set((pack.speakers || []).map(s => s.id));
    pack.sentences.forEach((s, i) => {
      assert.ok(s.de?.trim(), `${pack.id}[${i}] de 为空`);
      assert.ok(s.zh?.trim(), `${pack.id}[${i}] zh 为空`);
      if (s.sp) assert.ok(speakerIds.has(s.sp), `${pack.id}[${i}] sp="${s.sp}" 没有对应 speaker`);
    });
    for (const field of ['dictation', 'speakPractice', 'reproduce']) {
      for (const i of pack[field] || []) {
        assert.ok(Number.isInteger(i) && i >= 0 && i < pack.sentences.length,
          `${pack.id}.${field} 下标 ${i} 越界`);
      }
    }
    if (pack.gist) {
      assert.ok(pack.gist.options?.length >= 2, `${pack.id} gist 选项不足`);
      assert.ok(pack.gist.options[pack.gist.a] !== undefined, `${pack.id} gist.a 指向不存在的选项`);
    }
  }
});

test('every word is either in the A1 dictionary or declared as new', () => {
  const undeclared = [];
  for (const pack of LISTENING_PACKS) {
    for (const [i, s] of pack.sentences.entries()) {
      const { unknown } = coverage(s.de, {
        declared: pack.pilot
          ? [...(pack.targetLemmas || []), ...(pack.newLemmas || [])]
          : (s.newLemmas || []),
        proper: [...PROPER, ...(pack.properNouns || [])]
      });
      unknown.forEach(word => undeclared.push(`${pack.id}[${i}] ${word}`));
    }
  }
  assert.deepEqual(undeclared, [],
    '这些词既不在 A1 词表也没写进 newLemmas —— 要么换词，要么显式声明为生词');
});

test('new-word density stays sane for an A1 pack', () => {
  for (const pack of LISTENING_PACKS) {
    const declared = new Set();
    let total = 0;
    for (const s of pack.sentences) {
      (s.newLemmas || []).forEach(w => declared.add(w.toLowerCase()));
      total += coverage(s.de).total;
    }
    // 生词太多就不是精听而是查词了；这个上限逼作者要么换词要么拆包
    const ratio = declared.size / Math.max(total, 1);
    assert.ok(ratio <= 0.12,
      `${pack.id} 生词密度 ${(ratio * 100).toFixed(1)}%（${declared.size}/${total} 词）偏高`);
  }
});

test('pilot packs carry the production metadata and introduce 3-6 lemmas', () => {
  const pilots = LISTENING_PACKS.filter(pack => pack.pilot);
  assert.deepEqual(pilots.map(pack => pack.skillStage), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']);
  for (const pack of pilots) {
    for (const field of ['genre', 'topic', 'register', 'recommendedAfter', 'designReferences', 'provenance']) {
      assert.ok(pack[field], `${pack.id} 缺 ${field}`);
    }
    assert.ok(Array.isArray(pack.grammarPrereqs) && pack.grammarPrereqs.length, `${pack.id} 缺 grammarPrereqs`);
    assert.ok(Array.isArray(pack.targetLemmas) && pack.targetLemmas.length, `${pack.id} 缺 targetLemmas`);
    assert.ok(pack.newLemmas.length >= 3 && pack.newLemmas.length <= 6, `${pack.id} 生词应为 3-6 个`);
    assert.equal(pack.knownWordTarget, 0.92, `${pack.id} knownWordTarget 应为 0.92`);
    const declared = new Set(pack.sentences.flatMap(s => s.newLemmas || []).map(x => x.toLowerCase()));
    assert.deepEqual([...declared].sort(), pack.newLemmas.map(x => x.toLowerCase()).sort(),
      `${pack.id} 句级 newLemmas 与材料级清单不一致`);
  }
});

test('generated audio matches every pack and actually exists on disk', () => {
  for (const pack of LISTENING_PACKS) {
    const entry = LISTENING_AUDIO[pack.id];
    if (pack.audioStatus === 'pending-tts') {
      assert.equal(entry, undefined, `${pack.id} 已有音频，应把 audioStatus 改为 ready`);
      continue;
    }
    assert.ok(entry, `${pack.id} 没有生成音频，跑 python3 tools/gen_listening_audio.py`);
    const n = pack.sentences.length;

    if (entry.mode === 'clip') {
      assert.ok(segUsable(entry.seg, n), `${pack.id} 时间戳不可用（应已自动降级 sentences）`);
      assert.ok(existsSync(audioUrl(entry.file)), `${pack.id} 音频文件缺失：${entry.file}`);
    } else {
      assert.equal(entry.mode, 'sentences');
      assert.equal(entry.files?.length, n, `${pack.id} 文件数与句数不符`);
      entry.files.forEach((f, i) => {
        assert.ok(existsSync(audioUrl(f)), `${pack.id}[${i}] 音频文件缺失：${f}`);
      });
    }
    assert.ok(entry.key, `${pack.id} 缺输入指纹 key，幂等判断会失效`);
  }
});

test('listening audio never leaks into the shared manifest pipeline', async () => {
  // audio-manifest.js 由 gen_audio.py 全量重写；精听的多音色/整段文件必须待在
  // audio/listening/ 子目录里，否则下次跑主管线就没了。
  const { AUDIO_MANIFEST } = await import('../data/audio-manifest.js');
  for (const file of Object.values(AUDIO_MANIFEST)) {
    assert.doesNotMatch(file, /^listening\//, `主 manifest 混入了精听文件：${file}`);
  }
  // 反过来，每句德语都应该在主库里有 Katja 兜底（查词弹窗与 SRS 复现要用）
  for (const pack of LISTENING_PACKS) {
    if (pack.audioStatus === 'pending-tts') continue;
    for (const s of pack.sentences) {
      assert.ok(AUDIO_MANIFEST[s.de], `${pack.id} 的「${s.de}」缺主库兜底音频`);
    }
  }
});
