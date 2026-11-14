#!/usr/bin/env python3
"""给 Lena（也是念单词和字母的声音）挑新声音：几个候选各录同一组句子、词和最容易念错的字母，放到 audio/voice-test/，
由 heft/hoertest.html 试听页播放，作者在手机上听完选一个。选定后这个目录和试听页可以删。

密钥只从本机文件读：~/.config/mein-deutsch/elevenlabs.key（不进仓库、不进对话）。
用法: python3 tools/voice_candidates.py --dry   # 只看要花多少额度
      python3 tools/voice_candidates.py         # 生成（已有的文件跳过）
"""
import json, os, sys, urllib.request, urllib.error, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'audio', 'voice-test')
KEY_PATH = os.path.expanduser('~/.config/mein-deutsch/elevenlabs.key')
API = 'https://api.elevenlabs.io/v1'
MODEL = 'eleven_multilingual_v2'
SPEED = 0.85  # 2026-11-14：作者觉得整体偏快，放慢约一成半
# 候选：slug → (界面上的名字, 声音库里的 voice_id 或 My voices 里的名字开头)
CANDIDATES = {
    'a': ('A · 播音员', 'NX39CipaoYitJ3sMwH5I'),      # Franziska - Neutral and Trustworthy（新闻播音）
    'b': ('B · 老师', 'lzvBSKYbNWDD0a6BaJSK'),        # Petra - Confident and Pleasant（教学、吐字讲究）
    'c': ('C · 年轻清楚', 'pMrwpTuGOma7Nubxs5jo'),    # Lea - Warm and Supportive
    'd': ('D · 现在的声音放慢', 'Nadine Convo'),
}
LINES = ['Oh, hallo! Bist du neu hier?', 'Wie bitte? Tim?', 'Ah, Lin! Ich bin Lena. Und das ist Tom.', 'Oh nein, mein Bus! Tschüss!']
WORDS = ['der Kaffee', 'kommen aus', 'die Küche', 'Entschuldigung!']
LETTERS = [('A', 'Ah'), ('E', 'Eh'), ('I', 'Ih'), ('J', 'Jott'), ('V', 'Fau'), ('W', 'Weh'), ('Y', 'Ypsilon'), ('Z', 'Zett'), ('Ä', 'Ä'), ('Ö', 'Ö'), ('Ü', 'Ü'), ('ß', 'Eszett')]


def call(path, key, body=None, method=None):
    req = urllib.request.Request(API + path, headers={'xi-api-key': key, 'Content-Type': 'application/json'},
                                 data=json.dumps(body).encode() if body is not None else None, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{e.code} {e.read().decode("utf-8", "replace")[:300]}')


def resolve(key, ref):
    """声音库里的声音要先加到 My voices 才能用；已经在的直接用。返回可用的 voice_id。"""
    mine = json.loads(call('/voices', key)).get('voices', [])
    hit = next((v for v in mine if v['voice_id'] == ref or v['name'].lower().startswith(ref.lower())), None)
    if hit: return hit['voice_id']
    found = json.loads(call('/shared-voices?' + urllib.parse.urlencode({'search': ref, 'page_size': 5}), key)).get('voices', [])
    lib = next((v for v in found if v['voice_id'] == ref), None)
    if not lib: raise RuntimeError(f'声音库里没找到 {ref}')
    added = json.loads(call(f'/voices/add/{lib["public_owner_id"]}/{ref}', key, {'new_name': lib['name'][:60]}, 'POST'))
    return added['voice_id']


def main():
    items = [('line', t, t) for t in LINES] + [('word', t, t) for t in WORDS] + [('letter', show, say) for show, say in LETTERS]
    jobs = [(slug, i, it) for slug in CANDIDATES for i, it in enumerate(items) if not os.path.exists(os.path.join(OUT, slug, f'{i:02d}.mp3'))]
    print(f'要生成 {len(jobs)} 条，约 {sum(len(j[2][2]) for j in jobs)} 额度')
    index = {'speed': SPEED, 'items': [{'kind': k, 'show': show} for k, show, _ in items], 'voices': [{'slug': s, 'name': n} for s, (n, _) in CANDIDATES.items()]}
    os.makedirs(OUT, exist_ok=True)
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    if '--dry' in sys.argv or not jobs: return
    key = open(KEY_PATH).read().strip()
    ids = {slug: resolve(key, ref) for slug, (_, ref) in CANDIDATES.items() if any(j[0] == slug for j in jobs)}
    for n, (slug, i, (_, _, say)) in enumerate(jobs, 1):
        audio = call(f'/text-to-speech/{ids[slug]}?output_format=mp3_44100_128', key, {'text': say, 'model_id': MODEL, 'voice_settings': {'speed': SPEED}})
        os.makedirs(os.path.join(OUT, slug), exist_ok=True)
        open(os.path.join(OUT, slug, f'{i:02d}.mp3'), 'wb').write(audio)
        if n % 20 == 0: print(f'  {n}/{len(jobs)}')
    print('好了')


if __name__ == '__main__':
    main()
