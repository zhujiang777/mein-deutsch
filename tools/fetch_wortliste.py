#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""抓取歌德 A1 官方考纲词表（机器可读版）。

数据源：DWDS 的 "Wortschatz Goethe-Zertifikat A1" 列表页。整份词表在单页内以
30 个字母块（<div class="wsg-letter-block">）呈现，无分页、无导出接口，因此
直接解析页面 HTML 是最稳的路径。

每个词条对应一个 <li class="sans"> 节点，模板固定为：
    <a href="/wb/LEMMA">显示词形</a>[, der|die|das] [– 词性]
- 显示词形可能带同形词上标（<sup>1</sup>aber），需剥离。
- 名词才有冠词（, der / , die / , das）；复数专用名词（Eltern 等）无冠词。
- 少数功能词（all/bis/ja…）在源页无词性标注。
- 该列表页不提供复数形式，故 plural 一律为 null，留待内容生产者补全。

输出 tools/wortliste.json：数组，每项 {lemma, pos, article, plural}。lemma 必有。
另写 tools/wortliste-README.md 记录来源 URL、抓取日期与统计（JSON 不能带注释）。

仅用标准库；幂等可重跑（每次重新抓取并覆盖输出）。
"""

import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

SOURCE_URL = "https://www.dwds.de/lemma/wortschatz-goethe-zertifikat/A1"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "MeinDeutsch-Wortliste/1.0 (educational, polite crawl)"
)
POLITE_DELAY = 0.5  # 每次请求前的礼貌间隔（秒）

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_JSON = os.path.join(HERE, "wortliste.json")
OUT_README = os.path.join(HERE, "wortliste-README.md")

# 冠词词性判定：出现在 </a> 之后、词性分隔符之前
_ARTICLE_RE = re.compile(r"^,\s*(der|die|das)\b")
# 每个词条 li 块
_LI_RE = re.compile(r'<li class="sans">(.*?)</li>', re.S)
# 词条内的锚文本（显示词形）与其后的尾部（冠词 + 词性）
_ANCHOR_RE = re.compile(r'<a\s+href="[^"]*">(.*?)</a>(.*)$', re.S)
# 同形词上标（<sup>1</sup>aber）——需连内容整体删除，否则会残留数字
_SUP_RE = re.compile(r"<sup>.*?</sup>", re.S)
# 其余任意 HTML 标签
_TAG_RE = re.compile(r"<[^>]+>")
# 词性分隔符是 en-dash（U+2013），德语词条内部不含该字符，可安全切分
EN_DASH = "–"


def polite_get(url):
    """带 UA 头、请求前 0.5s 间隔地抓取页面文本。"""
    time.sleep(POLITE_DELAY)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def _clean_text(fragment):
    """剥离同形词上标与标签、解码实体、归一化空白。"""
    text = _SUP_RE.sub("", fragment)
    text = _TAG_RE.sub("", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_entries(page_html):
    """从列表页 HTML 解析出词条数组。"""
    entries = []
    for block in _LI_RE.findall(page_html):
        m = _ANCHOR_RE.search(block)
        if not m:
            continue  # 不符合模板的行直接跳过（实测为 0 条）
        lemma = _clean_text(m.group(1))
        if not lemma:
            continue  # lemma 必须有
        tail = _clean_text(m.group(2))

        article = None
        am = _ARTICLE_RE.match(tail)
        if am:
            article = am.group(1)
            tail = tail[am.end():].strip()

        pos = None
        if EN_DASH in tail:
            pos = tail.split(EN_DASH, 1)[1].strip() or None

        entries.append(
            {
                "lemma": lemma,
                "pos": pos,
                "article": article,
                "plural": None,  # 列表页无复数信息，留待后续补全
            }
        )
    return entries


def write_readme(count, with_pos, with_article, fetched_at):
    lines = [
        "# Goethe-Zertifikat A1 词表（DWDS 抓取）",
        "",
        f"- 来源：{SOURCE_URL}",
        f"- 抓取日期（UTC）：{fetched_at}",
        f"- 词条总数：{count}",
        f"- 含词性(pos)：{with_pos}　含冠词(article)：{with_article}",
        "",
        "由 `tools/fetch_wortliste.py` 生成，幂等可重跑。输出 `tools/wortliste.json`",
        "为数组，每项字段 `{lemma, pos, article, plural}`。",
        "",
        "说明：该列表页不提供复数形式，故 `plural` 一律为 `null`，由内容生产者补全。",
        "DWDS 机器版比官方 PDF 更细粒度——拆分同形词（¹ab/¹aber 各计一条）、",
        "收录符号（%、& 等）与拼写变体（allein/alleine），故条目数高于约 650 的词头数。",
        "",
    ]
    with open(OUT_README, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    try:
        page_html = polite_get(SOURCE_URL)
    except (urllib.error.URLError, urllib.error.HTTPError) as e:
        print(f"抓取失败：{e}", file=sys.stderr)
        return 1

    entries = parse_entries(page_html)
    if not entries:
        print("未解析到任何词条，可能页面结构已变更。", file=sys.stderr)
        return 1

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
        f.write("\n")

    with_pos = sum(1 for e in entries if e["pos"])
    with_article = sum(1 for e in entries if e["article"])
    fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    write_readme(len(entries), with_pos, with_article, fetched_at)

    print(f"已写入 {OUT_JSON}：{len(entries)} 条")
    print(f"  含词性 {with_pos}，含冠词 {with_article}")
    print(f"已写入 {OUT_README}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
