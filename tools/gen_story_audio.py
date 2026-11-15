#!/usr/bin/env python3
"""故事课正式配音：照 tools/voice-script.json 的清单，一人一声批量生成到 audio/story/<指纹>.mp3。

密钥只从本机文件读取（不进仓库、不进对话）：~/.config/mein-deutsch/elevenlabs.key
已有的文件会跳过，所以改了课文只会补新的那几条。每次跑完都会重写 audio/story/manifest.json（指纹 → 时长秒）。

用法: python3 tools/gen_story_audio.py --dry              # 只看要生成多少条、多少字，不花额度
      python3 tools/gen_story_audio.py --lesson sl-01,cast # 只生成第 1 课和人物自我介绍
      python3 tools/gen_story_audio.py                    # 全部
      python3 tools/gen_story_audio.py --redo 5c7d62b450d2 # 重新生成某一条（读得不对时）
      python3 tools/gen_story_audio.py --all               # 全部重录（改了语速或换了声音时）
      python3 tools/gen_story_audio.py --role Lena         # 只重录一个角色的全部（换了她的声音时）
先跑 node tools/voice-script.mjs 让清单和课文一致。
"""
import json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio', 'story')
SCRIPT = os.path.join(ROOT, 'tools', 'voice-script.json')
KEY_PATH = os.path.expanduser('~/.config/mein-deutsch/elevenlabs.key')
API = 'https://api.elevenlabs.io/v1'
MODEL = 'eleven_multilingual_v2'
SPEED = 0.85  # 2026-11-14：作者试学后觉得三个人都偏快，整体放慢约一成半（蜗牛键在这个基础上再放慢）
BITRATE = 128000  # mp3_44100_128 是固定码率，时长 = 字节数 × 8 ÷ 码率


def call(path, key, body=None):
    req = urllib.request.Request(API + path, headers={'xi-api-key': key, 'Content-Type': 'application/json'},
                                 data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{e.code} {e.read().decode(errors="replace")[:240]}')


def arg(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def write_manifest():
    files = sorted(f for f in os.listdir(OUT) if f.endswith('.mp3')) if os.path.isdir(OUT) else []
    manifest = {f[:-4]: round(os.path.getsize(os.path.join(OUT, f)) * 8 / BITRATE, 2) for f in files}
    if files:
        with open(os.path.join(OUT, 'manifest.json'), 'w') as fh:
            json.dump(manifest, fh, separators=(',', ':'))
    return len(manifest)


def main():
    script = json.load(open(SCRIPT))['voices']
    lessons = set((arg('--lesson') or '').split(',')) - {''}
    redo = set((arg('--redo') or '').split(',')) - {''}
    roles = set((arg('--role') or '').split(',')) - {''}  # --role Lena：只重录这个角色的全部（换了她的声音时）
    jobs = []
    for role, v in script.items():
        for it in v['items']:
            if lessons and it['lesson'] not in lessons: continue
            path = os.path.join(OUT, it['id'] + '.mp3')
            if roles and role not in roles: continue
            if os.path.exists(path) and it['id'] not in redo and '--all' not in sys.argv and not roles: continue
            if redo and it['id'] not in redo: continue
            jobs.append((role, v['voice'], it, path))
    chars = sum(len(j[2]['text']) for j in jobs)
    print(f'要生成 {len(jobs)} 条，约 {chars} 额度')
    if '--dry' in sys.argv or not jobs:
        print('清单里已有录音', write_manifest(), '条')
        return
    if not os.path.exists(KEY_PATH): sys.exit(f'没找到密钥文件：{KEY_PATH}')
    key = open(KEY_PATH).read().strip()
    sub = json.loads(call('/user/subscription', key))
    left = sub.get('character_limit', 0) - sub.get('character_count', 0)
    print(f'套餐: {sub.get("tier")} · 本月剩余额度: {left}')
    if left < chars: sys.exit('额度不够，先不生成。')
    voices = json.loads(call('/voices', key)).get('voices', [])
    ids = {}
    for role, name in {j[0]: j[1] for j in jobs}.items():
        hit = next((v for v in voices if v['name'].lower().startswith(name.lower())), None)
        if not hit: sys.exit(f'声音还没加到 My voices：{name}')
        ids[role] = hit['voice_id']
        print(f'  {role} → {hit["name"]}（{hit["voice_id"]}）')
    os.makedirs(OUT, exist_ok=True)
    done = 0
    for role, _, it, path in jobs:
        for attempt in range(3):
            try:
                audio = call(f'/text-to-speech/{ids[role]}?output_format=mp3_44100_128', key, {'text': it['text'], 'model_id': MODEL, 'voice_settings': {'speed': SPEED}})
                break
            except RuntimeError as e:
                if str(e).startswith(('401', '402', '403')): write_manifest(); sys.exit(f'账户不让生成（多半是套餐不含这些声音）：{e}')
                if attempt == 2: write_manifest(); sys.exit(f'{it["id"]} {it["text"]!r} 生成失败：{e}')
                time.sleep(2 + attempt * 3)
        with open(path, 'wb') as fh: fh.write(audio)
        done += 1
        if done % 20 == 0: print(f'  {done}/{len(jobs)}')
    print(f'生成 {done} 条。清单里共有录音 {write_manifest()} 条')


if __name__ == '__main__':
    main()
