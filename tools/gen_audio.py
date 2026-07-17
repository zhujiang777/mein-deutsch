#!/usr/bin/env python3
"""预生成德语音频管线。

从 data/*.js 提取全部德语文本（经 tools/extract_texts.mjs），
为每条唯一文本生成 audio/<sha1前8>.mp3，并写出 data/audio-manifest.js。
幂等：已存在的音频文件跳过；内容更新后重跑只补新增。

生成器两级：
  1. edge-tts（微软神经网络语音 de-DE-KatjaNeural，真人级）
  2. 失败回退 macOS `say -v Anna` + afconvert 转 m4a

用法: python3 tools/gen_audio.py
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, 'audio')
MANIFEST_PATH = os.path.join(ROOT, 'data', 'audio-manifest.js')
VOICE = 'de-DE-KatjaNeural'
CONCURRENCY = 6
RETRIES = 3


def text_hash(text: str) -> str:
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:8]


def extract_texts() -> list:
    out = subprocess.run(
        ['node', os.path.join(ROOT, 'tools', 'extract_texts.mjs')],
        capture_output=True, text=True, cwd=ROOT)
    if out.returncode != 0:
        print('❌ 文本提取失败:', out.stderr, file=sys.stderr)
        sys.exit(1)
    return json.loads(out.stdout)


def existing_file(h: str):
    for ext in ('.mp3', '.m4a'):
        if os.path.exists(os.path.join(AUDIO_DIR, h + ext)):
            return h + ext
    return None


async def gen_edge(text: str, path: str) -> bool:
    import edge_tts
    for attempt in range(RETRIES):
        try:
            await edge_tts.Communicate(text, voice=VOICE).save(path)
            if os.path.getsize(path) > 1000:
                return True
            os.remove(path)
        except Exception:
            if os.path.exists(path):
                os.remove(path)
            await asyncio.sleep(1.5 * (attempt + 1))
    return False


def gen_say(text: str, h: str):
    """macOS 备用链：say -v Anna → afconvert aac(m4a)"""
    aiff = os.path.join(AUDIO_DIR, h + '.aiff')
    m4a = os.path.join(AUDIO_DIR, h + '.m4a')
    try:
        subprocess.run(['say', '-v', 'Anna', '-o', aiff, text], check=True,
                       capture_output=True)
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '48000',
                        aiff, m4a], check=True, capture_output=True)
        return h + '.m4a'
    except subprocess.CalledProcessError:
        return None
    finally:
        if os.path.exists(aiff):
            os.remove(aiff)


async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    texts = extract_texts()
    print(f'共 {len(texts)} 条唯一文本')

    manifest = {}
    todo = []
    for t in texts:
        h = text_hash(t)
        f = existing_file(h)
        if f:
            manifest[t] = f
        else:
            todo.append((t, h))
    print(f'已存在 {len(manifest)}，待生成 {len(todo)}')

    try:
        import edge_tts  # noqa: F401
        edge_ok = True
    except ImportError:
        edge_ok = False
        print('⚠️ 未安装 edge-tts，直接使用 say/Anna 备用链')

    failed = []
    if edge_ok and todo:
        sem = asyncio.Semaphore(CONCURRENCY)
        done_count = 0

        async def worker(t, h):
            nonlocal done_count
            async with sem:
                path = os.path.join(AUDIO_DIR, h + '.mp3')
                ok = await gen_edge(t, path)
                done_count += 1
                if done_count % 50 == 0:
                    print(f'  … {done_count}/{len(todo)}')
                if ok:
                    manifest[t] = h + '.mp3'
                else:
                    failed.append((t, h))

        await asyncio.gather(*(worker(t, h) for t, h in todo))
    else:
        failed = list(todo)

    if failed:
        print(f'edge-tts 失败 {len(failed)} 条，改用 say/Anna 备用链…')
        still_failed = []
        for t, h in failed:
            f = gen_say(t, h)
            if f:
                manifest[t] = f
            else:
                still_failed.append(t)
        if still_failed:
            print('❌ 以下文本两种方式都失败：')
            for t in still_failed:
                print('   -', t)

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as fh:
        fh.write('// 自动生成，勿手改。python3 tools/gen_audio.py 重新生成\n')
        fh.write('export const AUDIO_MANIFEST = ')
        fh.write(json.dumps(manifest, ensure_ascii=False, indent=0))
        fh.write(';\n')

    total_size = sum(
        os.path.getsize(os.path.join(AUDIO_DIR, f))
        for f in os.listdir(AUDIO_DIR) if f.endswith(('.mp3', '.m4a')))
    print(f'✅ 完成：manifest {len(manifest)} 条，音频总计 {total_size/1024/1024:.1f} MB')


if __name__ == '__main__':
    asyncio.run(main())
