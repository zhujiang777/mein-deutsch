#!/usr/bin/env python3
"""精听包音频管线。

读 data/listening.js，为每个包生成音频与句级时间戳，写出 data/listening-audio.js。
与 tools/gen_audio.py 完全隔离：本脚本只写 audio/listening/ 子目录，
绝不碰 data/audio-manifest.js（那个文件由 gen_audio.py 全量重写）。

两种形态：
  sentences —— 逐句独立文件。多说话人包走这条，也是 clip 对不齐时的降级路径。
               默认音色且 gen_audio.py 已生成过的句子直接复用 audio/<hash>.mp3，零字节重复。
  clip      —— 整段一次合成 + WordBoundary 事件切出句级时间戳，支持 AB 复读与逐词高亮。
               本机没有 ffmpeg，所以不做切片/拼接；时间戳取自 TTS 服务端，不是估算。

幂等：文件名带内容哈希，输入不变则文件名不变、直接跳过并沿用上一轮的时间戳。

用法:
  python3 tools/gen_listening_audio.py                # 增量
  python3 tools/gen_listening_audio.py --force        # 全部重生成
  python3 tools/gen_listening_audio.py --mode sentences  # 强制降级，用于验证兜底路径
"""
import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, 'audio')
LISTEN_DIR = os.path.join(AUDIO_DIR, 'listening')
OUT_PATH = os.path.join(ROOT, 'data', 'listening-audio.js')
DEFAULT_VOICE = 'de-DE-KatjaNeural'  # 与 gen_audio.py 一致，决定哪些句子能复用
CONCURRENCY = 4
RETRIES = 3
TAIL = 0.25   # 句尾留白，让 AB 复读听起来不被切掉
LEAD = 0.02   # 与下一句起点之间保留的最小间隙

WORD_RE = re.compile(r"[^\W\d_]+", re.UNICODE)


def sha8(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:8]


def tokens(text):
    """按词切分并归一化，用于把 WordBoundary 事件对回我们的句子。"""
    return [w.lower() for w in WORD_RE.findall(text)]


def load_packs():
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'dump_listening.mjs')],
                         capture_output=True, text=True, cwd=ROOT)
    if out.returncode != 0:
        print('❌ 读取 data/listening.js 失败:', out.stderr, file=sys.stderr)
        sys.exit(1)
    data = json.loads(out.stdout)
    return data['packs'], data.get('existing') or {}


def voice_of(pack, sentence):
    speakers = pack.get('speakers') or []
    by_id = {s['id']: s for s in speakers if s.get('id')}
    sp = sentence.get('sp')
    if sp and sp in by_id and by_id[sp].get('voice'):
        return by_id[sp]['voice']
    if speakers and speakers[0].get('voice'):
        return speakers[0]['voice']
    return DEFAULT_VOICE


def pack_voices(pack):
    return {voice_of(pack, s) for s in pack['sentences']}


def build_key(pack, mode):
    """输入指纹：模式 + 全部音色 + 全部句子。变了才重新生成。"""
    parts = [mode]
    for s in pack['sentences']:
        parts.append(voice_of(pack, s) + '|' + s['de'])
    return sha8('\n'.join(parts))


async def synth(text, voice, path):
    """普通合成，用于 sentences 模式。"""
    import edge_tts
    for attempt in range(RETRIES):
        try:
            await edge_tts.Communicate(text, voice=voice).save(path)
            if os.path.getsize(path) > 1000:
                return True
            os.remove(path)
        except Exception:
            if os.path.exists(path):
                os.remove(path)
            await asyncio.sleep(1.5 * (attempt + 1))
    return False


async def synth_with_words(text, voice, path):
    """整段合成并收集 WordBoundary 事件。返回 (ok, words)，words 元素为 (start, dur, text)。"""
    import edge_tts
    for attempt in range(RETRIES):
        audio = bytearray()
        words = []
        try:
            comm = edge_tts.Communicate(text, voice=voice, boundary='WordBoundary')
            async for chunk in comm.stream():
                if chunk['type'] == 'audio':
                    audio += chunk['data']
                elif chunk['type'] == 'WordBoundary':
                    words.append((chunk['offset'] / 1e7, chunk['duration'] / 1e7, chunk['text']))
            if len(audio) > 1000 and words:
                with open(path, 'wb') as fh:
                    fh.write(bytes(audio))
                return True, words
        except Exception:
            pass
        await asyncio.sleep(1.5 * (attempt + 1))
    return False, []


def align(pack, words):
    """把 WordBoundary 事件按每句 token 数消费，切出句级 [start, end]。

    TTS 是按标点断句的（"Guten Tag! Was möchten Sie?" 会被切成两句），
    所以只能按词对齐，不能用 SentenceBoundary。任何一处对不上就整包降级。
    """
    seg = []
    cursor = 0
    for i, sentence in enumerate(pack['sentences']):
        want = tokens(sentence['de'])
        if cursor + len(want) > len(words):
            return None, '第 %d 句词数超出事件总数' % (i + 1)
        got = words[cursor:cursor + len(want)]
        for expected, event in zip(want, got):
            if tokens(event[2])[:1] != [expected]:
                return None, '第 %d 句「%s」对不上事件「%s」' % (i + 1, expected, event[2])
        start = 0.0 if i == 0 else got[0][0]
        end = got[-1][0] + got[-1][1] + TAIL
        cursor += len(want)
        if cursor < len(words):
            end = min(end, words[cursor][0] - LEAD)
        end = max(end, got[-1][0] + got[-1][1] + 0.02)
        seg.append([round(start, 3), round(end, 3)])
    if cursor != len(words):
        return None, '剩余 %d 个事件没有归属' % (len(words) - cursor)
    return seg, None


async def build_sentences(pack, key, force):
    """逐句独立文件。默认音色且主库已有的直接复用。"""
    files = [None] * len(pack['sentences'])
    todo = []
    for i, sentence in enumerate(pack['sentences']):
        voice = voice_of(pack, sentence)
        if voice == DEFAULT_VOICE:
            shared = sha8(sentence['de']) + '.mp3'
            if os.path.exists(os.path.join(AUDIO_DIR, shared)):
                files[i] = shared  # 复用 gen_audio.py 的产物，零字节重复
                continue
        name = os.path.join('listening', sha8(voice + '|' + sentence['de']) + '.mp3')
        files[i] = name
        path = os.path.join(AUDIO_DIR, name)
        if force or not os.path.exists(path):
            todo.append((sentence['de'], voice, path))

    if todo:
        sem = asyncio.Semaphore(CONCURRENCY)

        async def worker(text, voice, path):
            async with sem:
                if not await synth(text, voice, path):
                    print('   ❌ 合成失败:', text)
                    return False
                return True

        results = await asyncio.gather(*(worker(*item) for item in todo))
        if not all(results):
            return None
    print('   %s：%d 句（新生成 %d，复用主库 %d）'
          % (pack['id'], len(files), len(todo),
             sum(1 for f in files if not f.startswith('listening/'))))
    return {'mode': 'sentences', 'key': key, 'files': files}


async def build_clip(pack, key, force):
    """整段合成 + 句级时间戳。对不齐返回 None，由调用方降级。"""
    voices = pack_voices(pack)
    if len(voices) > 1:
        print('   %s：%d 种音色，clip 模式无法承载，降级 sentences' % (pack['id'], len(voices)))
        return None
    voice = voices.pop()
    name = os.path.join('listening', '%s-%s.mp3' % (pack['id'], key))
    path = os.path.join(AUDIO_DIR, name)
    text = ' '.join(s['de'] for s in pack['sentences'])

    ok, words = await synth_with_words(text, voice, path)
    if not ok:
        print('   %s：整段合成失败，降级 sentences' % pack['id'])
        return None

    seg, why = align(pack, words)
    if seg is None:
        print('   %s：时间戳对不齐（%s），降级 sentences' % (pack['id'], why))
        if os.path.exists(path):
            os.remove(path)
        return None

    print('   %s：clip %d 句 / %.1fs / %d 个词事件'
          % (pack['id'], len(seg), seg[-1][1], len(words)))
    return {
        'mode': 'clip', 'key': key, 'file': name, 'voice': voice,
        'dur': round(seg[-1][1], 3), 'seg': seg,
    }


def entry_is_fresh(entry, key):
    """上一轮的产物还能用吗：指纹一致，且引用的文件都还在。"""
    if not entry or entry.get('key') != key:
        return False
    names = [entry['file']] if entry.get('mode') == 'clip' else (entry.get('files') or [])
    return all(name and os.path.exists(os.path.join(AUDIO_DIR, name)) for name in names)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--force', action='store_true', help='忽略缓存全部重生成')
    parser.add_argument('--mode', choices=['sentences'], help='强制降级模式，用于验证兜底路径')
    args = parser.parse_args()

    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print('❌ 需要 edge-tts：pip3 install edge-tts', file=sys.stderr)
        sys.exit(1)

    os.makedirs(LISTEN_DIR, exist_ok=True)
    packs, existing = load_packs()
    print('共 %d 个精听包' % len(packs))

    out = {}
    for pack in packs:
        wanted = args.mode or (pack.get('audio') or {}).get('mode') or 'sentences'
        key = build_key(pack, wanted)
        cached = existing.get(pack['id'])
        if not args.force and entry_is_fresh(cached, key):
            print('   %s：未变化，沿用上一轮' % pack['id'])
            out[pack['id']] = cached
            continue

        entry = None
        if wanted == 'clip':
            entry = await build_clip(pack, key, args.force)
        if entry is None:
            entry = await build_sentences(pack, build_key(pack, 'sentences'), args.force)
        if entry is None:
            print('❌ %s 生成失败' % pack['id'], file=sys.stderr)
            sys.exit(1)
        out[pack['id']] = entry

    with open(OUT_PATH, 'w', encoding='utf-8') as fh:
        fh.write('// 自动生成，勿手改。python3 tools/gen_listening_audio.py 重新生成\n')
        fh.write('// key 是输入指纹（模式+音色+全部句子）；seg 与 sentences 同序同长，单位秒。\n')
        fh.write('export const LISTENING_AUDIO = ')
        fh.write(json.dumps(out, ensure_ascii=False, indent=1, sort_keys=True))
        fh.write(';\n')

    total = 0
    for name in os.listdir(LISTEN_DIR):
        if name.endswith('.mp3'):
            total += os.path.getsize(os.path.join(LISTEN_DIR, name))
    print('✅ 完成：%d 个包，audio/listening/ 共 %.1f MB' % (len(out), total / 1024 / 1024))


if __name__ == '__main__':
    asyncio.run(main())
