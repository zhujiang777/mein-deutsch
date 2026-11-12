#!/usr/bin/env python3
"""ElevenLabs 配音试生成：第 1 课新课文，一人一声，输出整段对话到 lab/voice-samples/。

密钥只从本机文件读取（不进仓库、不进对话）：~/.config/mein-deutsch/elevenlabs.key
用法: python3 tools/voice_sample.py            # 生成试听
      python3 tools/voice_sample.py --check    # 只检查密钥、额度和 4 个声音是否就绪（不花额度）
"""
import json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'lab', 'voice-samples')
KEY_PATH = os.path.expanduser('~/.config/mein-deutsch/elevenlabs.key')
API = 'https://api.elevenlabs.io/v1'
# 角色 → 声音名开头（用户 2026-11-09 在声音库里选定）
CAST = {'Lin': 'Jonas Falk', 'Lena': 'Nadine Convo', 'Tom': 'Dylan Carter', 'Krause': 'Erich Steiner'}
# 试两个模型：v2 稳定；v3 更有情绪（套餐不支持就跳过）
MODELS = {'稳定版': 'eleven_multilingual_v2', '情绪版': 'eleven_v3'}
LANG_OK = {'eleven_v3', 'eleven_flash_v2_5', 'eleven_turbo_v2_5'}
LINES = [
    ('Lena', 'Oh, hallo! Bist du neu hier?'),
    ('Lin', 'Ja. Hallo! Ich bin Lin.'),
    ('Lena', 'Wie bitte? Tim?'),
    ('Lin', 'Nein, Lin. L, I, N.'),
    ('Lena', 'Ah, Lin! Ich bin Lena. Und das ist Tom.'),
    ('Tom', 'Hallo, Lin! Willkommen! Kaffee?'),
    ('Lin', 'Ja, bitte. Danke!'),
    ('Lena', 'Oh nein, mein Bus! Tschüss!'),
    ('Tom', 'Tschüss, Lena! Sie ist immer so.'),
    ('Lin', 'Ach so.'),
]


def call(path, key, body=None):
    req = urllib.request.Request(API + path, headers={'xi-api-key': key, 'Content-Type': 'application/json'},
                                 data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{e.code} {e.read().decode("utf-8", "replace")[:300]}')


def main():
    if not os.path.exists(KEY_PATH):
        sys.exit(f'没找到密钥文件：{KEY_PATH}')
    key = open(KEY_PATH).read().strip()
    sub = json.loads(call('/user/subscription', key))
    left = sub.get('character_limit', 0) - sub.get('character_count', 0)
    print(f'套餐: {sub.get("tier")} · 本月剩余额度: {left}')
    voices = json.loads(call('/voices', key)).get('voices', [])
    ids, missing = {}, []
    for role, name in CAST.items():
        hit = next((v for v in voices if v['name'].lower().startswith(name.lower())), None)
        if hit: ids[role] = hit['voice_id']
        else: missing.append(name)
    print('已就绪的声音:', ', '.join(f'{r}={CAST[r]}' for r in ids) or '无')
    if missing: print('还没加到 My voices:', ', '.join(missing))
    need = sum(len(t) for _, t in LINES)
    print(f'生成一版需要约 {need} 额度')
    if '--check' in sys.argv: return
    if any(w not in ids for w, _ in LINES): sys.exit('第 1 课要用的声音还没齐，先在网页上点 Add。')
    os.makedirs(OUT, exist_ok=True)
    for label, model in MODELS.items():
        parts = []
        try:
            for who, text in LINES:
                body = {'text': text, 'model_id': model}
                if model in LANG_OK: body['language_code'] = 'de'
                parts.append(call(f'/text-to-speech/{ids[who]}?output_format=mp3_44100_128', key, body))
        except RuntimeError as e:
            print(f'{label}（{model}）没生成成功: {e}')
            continue
        path = os.path.join(OUT, f'第1课-{label}.mp3')
        open(path, 'wb').write(b''.join(parts))
        print('已生成', path, sum(map(len, parts)))


if __name__ == '__main__':
    main()
