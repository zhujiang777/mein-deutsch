# Goethe-Zertifikat A1 词表（DWDS 抓取）

- 来源：https://www.dwds.de/lemma/wortschatz-goethe-zertifikat/A1
- 抓取日期（UTC）：2026-07-18 14:16:03Z
- 词条总数：849
- 含词性(pos)：840　含冠词(article)：400

由 `tools/fetch_wortliste.py` 生成，幂等可重跑。输出 `tools/wortliste.json`
为数组，每项字段 `{lemma, pos, article, plural}`。

说明：该列表页不提供复数形式，故 `plural` 一律为 `null`，由内容生产者补全。
DWDS 机器版比官方 PDF 更细粒度——拆分同形词（¹ab/¹aber 各计一条）、
收录符号（%、& 等）与拼写变体（allein/alleine），故条目数高于约 650 的词头数。
