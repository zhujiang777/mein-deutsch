# A1 精听 / 精读教材驱动实施与审查交接

> 用途：供 Claude 或其他审查者独立核对本轮实现是否真正参考教材、是否遵守版权边界，以及是否满足 A1 内容生产计划。
>
> 当前状态：12 份试点正文和相关基础设施已完成；第二阶段 36 份未启动。自动测试全绿，但私有教材 OCR 检查和原创 TTS 尚未完成，因此正式审计门禁仍为 `incomplete`。

## 1. 本轮目标

本轮不是直接生产全部 48 份内容，而是完成正式计划的第一阶段：

- 保留已有播放器、课程外壳、推荐标签和五阶段交互；
- 废弃原来 12 份缺少教材证据的试点正文；
- 先建立教材证据矩阵；
- 按证据矩阵重新生产：
  - 6 个精听试点：L1–L6 各 1 个；
  - 6 篇精读试点：R1–R6 各 1 篇；
- 接通精听错句复习和阅读技能回写；
- 完成结构、难度、证据和原创性自动审计；
- 等待人工验收后，才决定是否生产剩余 36 份。

## 2. 实际做了什么

### 2.1 建立教材证据矩阵

重建了 `data/syllabus-ref.json`，主要包含：

- `sources`：来源版本、用途、定位方式、版权类型和复用边界；
- `evidenceUnits`：页码、练习号、音轨号、文体、任务机制、语法和适用阶段；
- `stageProfiles`：L1–L6 / R1–R6 的推荐课次、语法前置和硬性能力规格。

每份试点的 `designReferences` 改为：

```js
{
  evidenceIds: ['可在 syllabus-ref.json 定位的证据 ID'],
  appliedConstraints: ['本材料实际采用的任务约束'],
  originalityStatement: '正文从空白页原创，未复制或逐句改写教材内容。'
}
```

测试要求每份材料至少覆盖：

1. 仓库课程进度；
2. 《走遍德国》或《当代大学德语》的主课/语音进度；
3. 对应 Hueber 技能书；
4. 至少一个公开校准来源。

### 2.2 重写 12 份试点正文

沿用原试点 ID，避免破坏路由和学习状态，但正文、人物、题目、选项和信息顺序全部重新设计。

精听：

| ID | 阶段 | 新内容 | 核心声音任务 |
|---|---|---|---|
| `li-p01` | L1 | 三位晚间班学习者 | 匹配声音、来源和学习目的 |
| `li-p02` | L2 | 课程报名对话 | 听辨姓氏拼写、电话、B13/B30、14/40 |
| `li-p03` | L3 | 市民中心课程通知 | 排除旧时间和旧教室，记录新安排 |
| `li-p04` | L4 | 周日休闲计划采访 | 区分建议、个人愿望和最终决定 |
| `li-p05` | L5 | 去维修咖啡馆的连续路线 | 还原地下通道、药店、灰房子和后院顺序 |
| `li-p06` | L6 | 运河边周末经历 | 用完成时重建事件顺序 |

精读：

| ID | 阶段 | 新内容 | 核心篇章任务 |
|---|---|---|---|
| `rp-a1-01` | R1 | 摄影俱乐部登记表与简介 | 扫描字段并重组人物信息 |
| `rp-a1-02` | R2 | 书桌用品迷你目录 | 比较冠词、复数、价格和用途 |
| `rp-a1-03` | R3 | 学习工坊日程加短消息 | 用变更原因修正原日程 |
| `rp-a1-04` | R4 | 文化庭院活动节目单 | 按时间、价格、报名和天气筛选 |
| `rp-a1-05` | R5 | 两则住房信息 | 比较地点、家具、交通、安静程度和价格 |
| `rp-a1-06` | R6 | 同一次河边旅行的两种复述 | 比较共同事实、事件顺序和个人评价 |

### 2.3 实现精听错句闭环

在 `js/mastery.js` 新增：

- `addListenMiss(packId, sentenceIndex)`；
- `dueListenMisses(limit)`；
- `listenRef(id)`。

精听错误使用：

```text
l:<packId>:<sentenceIndex>
```

例如：

```text
l:li-p03:4
```

听写和复述步骤都携带 `sentenceIndex`。首答错误写入 `l:`，每日路线根据包 ID 和句下标还原原句及原音频。

普通课程错题继续使用 `m:`，词汇和生词本命名空间不受影响。

### 2.4 明确阅读错误边界

`renderQuiz` 增加逐题回调，阅读理解题每答一题都会调用：

```js
recordAnswer(reading.skills, correct)
```

阅读错误只影响阅读技能强度和文章完成状态，不调用 `addMistake`，也不把整句写进词汇 SRS。

### 2.5 建立难度与原创性审计

新增 `tools/audit_a1_content.mjs`，检查：

- 12 份试点数量；
- `evidenceId` 是否存在；
- 三类教材证据是否齐全；
- `recommendedAfter` 和语法阶段；
- 3–6 个新 lemma；
- 作者侧基线覆盖率；
- 与现有课程、旧阅读和旧精听的五词/六词连续重合；
- 私有教材及出版商音频文件哈希；
- OCR、TTS 和最终门禁状态。

仓库内六词连续重合为 0，未批准五词重合为 0。五词白名单目前为空。

## 3. 实际参考了哪些教材内容

### 3.1 《走遍德国 A1》

本地文件：

```text
正版图书/走遍德国A1.pdf
```

实际核对：

- PDF 第 7–9 页目录；
- A1 十个单元的大体主题、语法和技能推进；
- 从个人信息逐步过渡到日常活动、时间、休闲和移动相关技能。

实际用途：

- 只用于六阶段课程推进和技能顺序的辅助校准；
- 没有使用课文、例句、练习题或人物。

限制：

- 本轮没有逐页提取整本书；
- 它在当前证据矩阵中属于宏观进度证据，不是每份试点的直接文体来源。

### 3.2 《当代大学德语 1》

本地文件：

```text
正版图书/当代大学德语.pdf
```

实际核对：

- PDF 第 8–12 页目录和语音预备阶段结构；
- 主课之前先进行语音、字母和基础辨音准备的安排。

实际用途：

- 支持 L1–L2 对声音区分、字母拼写和数字辨听的强调；
- 作为中国学习者语音训练顺序的辅助证据。

限制：

- 本轮没有系统提取书中的中国学习者错误分析；
- 当前“字母和数字应显式训练”的结论主要来自课程结构，而不是完整的实证错误清单。

### 3.3 Hueber《Hören & Sprechen A1》

本地文件：

```text
正版图书/Hoeren_und_SprechenA1Lehrer.ir.pdf
正版图书/官方MP3/hören.zip
```

实际核对：

- 目录、相关章节页面布局、练习编号和音轨编号范围；
- 常见任务机制：先听、匹配、选择、填写、复述和再次核对；
- 本地出版商压缩包中存在 60 条音轨。

阶段映射：

| 阶段 | 页码 | 练习 | 音轨 | 提取的抽象机制 |
|---|---:|---:|---:|---|
| L1 | 7–16 | 1–8 | 2–16 | 接触、来源、多说话人匹配 |
| L2 | 19–25 | 9–13 | 17–26 | 字母、数字和选择性听辨 |
| L3 | 25–31 | 14–15 | 27–30 | 时间、日期及相近数字 |
| L4 | 59–63 | 27–29 | 50–53 | 休闲短采访、偏好和计划 |
| L5 | 33–39 | 16–18 | 31–35 | 路线、地标和空间关系 |
| L6 | 63–65 | 30 | 54 | 已完成休闲经历和事件排序 |

限制：

- 没有复制对话、题干、选项或音频；
- 没有系统听完并分析全部 60 条音轨；
- 当前音轨证据主要是教材中的编号映射和本地文件存在性，不是完整的语速、停顿、说话人数和声学分析。

### 3.4 Hueber《Lesen & Schreiben A1》

本地文件：

```text
正版图书/Hueber Lesen & Schreiben A1.pdf
```

实际核对：

- 目录、相关章节页面布局、文体分布和阅读任务结构。

阶段映射：

| 阶段 | 页码 | 章节/练习范围 | 提取的抽象机制 |
|---|---:|---|---|
| R1 | 5–11 | A1–A4 | 人物表格、字段扫描、重组简介 |
| R2 | 12–18 | B1–B4 | 物品、冠词、复数、价格和用途 |
| R3 | 21–30 | C1–C5 | 日程、表格、邮件及信息连接 |
| R4 | 49–55 | F1–F3 | 休闲节目和多条件选择 |
| R5 | 40–46 | E1–E4 | 住房、设施和位置比较 |
| R6 | 58、66附近 | F4、G3 | 经历叙述、旅行信息和双文本比较 |

限制：

- 没有保存或使用教材正文；
- 当前试点只采用文体和篇章任务机制，没有复用教材人物、事件和信息顺序。

## 4. 公开校准来源

### 4.1 Goethe A1

来源：

```text
https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_uebungssatz02.pdf
```

实际参考：

- 听力第 6–12 页；
- 阅读第 14–22 页；
- 短对话、公共通知、短信、广告和告示的信息密度；
- 一个题目通常依赖一个决定性细节的 A1 上限。

只用于难度和任务校准，没有复制题目、选项或文本。

### 4.2 Deutsch im Blick

来源：

```text
https://coerll.utexas.edu/coerll/oer/deutsch-im-blick/
```

实际参考：

- 第一章人物和学习者访谈；
- 第二章时间、学生生活和住房主题；
- 第四章休闲活动和偏好主题。

虽然该资源采用开放许可，本轮仍只用于现代话题和多媒体形式校准，没有复制语料。

### 4.3 VHS-Lernportal A1

来源：

```text
https://www.vhs-lernportal.de/wws/bin/4007530-4015506-1-dvv_grammatiklisten_a1.pdf
```

实际参考：

- A1语法边界；
- 冠词、时间、情态动词、格和基本过去表达的阶段范围。

### 4.4 Nicos Weg A1

来源：

```text
https://static.dw.com/downloads/52718691/grammar-overview-nicos-weg-a1.pdf
```

实际参考：

- 第 13 模块附近的天气、假期和完成时范围；
- L6/R6只使用常见 `haben` / `sein` 完成时和具体事件顺序。

## 5. 没有参考或没有完成的内容

审查时请特别注意以下边界：

- 没有复制商业教材课文、对话、例句、题干、选项、图片或音频；
- 没有系统听完 Hueber 60 条出版商音轨；
- 没有对商业教材完成全文 OCR；
- 没有把 Deutsch im Blick 的 CC BY 正文直接用于产品；
- 没有实施 Tatoeba、Wikinews 或 Common Voice；
- 没有生成 6 个新精听包的原创 TTS；
- 没有进行 12 份人工自然度、声音依赖和独特性验收；
- 没有开始第二阶段 36 份内容；
- 没有提交、推送或发布。

## 6. OCR 与音频当前状态

### 6.1 OCR

新增：

```text
tools/ocr_reference_pages.swift
```

设计用途：

- 使用 macOS Vision 对指定扫描页执行 OCR；
- 结果写入 `正版图书/.distillation/ocr/`；
- OCR文本只供本地重合检查，不进入 Git。

实际执行结果：

- 本机 Swift 编译器与 macOS SDK 小版本不匹配；
- 工具尚未成功运行；
- `data/a1-audit-report.json` 因此记录：

```json
"privateOcrStatus": "blocked-toolchain"
```

这意味着当前只完成了页面结构人工核对和仓库文本查重，没有完成商业教材全文文字查重。

### 6.2 原创 TTS

6 个试点精听包当前均显式标记：

```js
audioStatus: 'pending-tts'
```

原因：

- 之前运行联网 TTS 和本机语音降级均未成功生成这批新音频；
- 没有使用出版商音轨替代。

需要注意：

- `npm test` 会接受显式的 `pending-tts` 状态；
- 因此测试全绿不代表精听音频已经可用；
- `data/a1-audit-report.json` 仍把 6 个待生成音频计入未完成门禁。

## 7. 自动检查结果

执行：

```bash
npm test
```

当前结果：

```text
85 tests
85 pass
0 fail
```

执行：

```bash
node tools/audit_a1_content.mjs --write-report
```

当前主要结果：

- 试点数量：12；
- 证据失败：0；
- 难度失败：0；
- 仓库内容六词重合：0；
- 未批准五词重合：0；
- 私有 OCR：`blocked-toolchain`；
- 待生成精听音频：6；
- 总门禁：`incomplete`。

`--strict` 模式目前应失败，这是预期行为：

```bash
node tools/audit_a1_content.mjs --strict
```

只有 OCR/替代抽样验证和原创音频完成后，才应考虑把门禁改为通过。

## 8. 文件地图

### 8.1 正式计划与教材规范

| 文件 | 作用 |
|---|---|
| `docs/a1-content-production-plan.md` | 正式内容生产计划和阶段门禁 |
| `docs/textbook-extraction-guide.md` | 商业教材提取、版权边界和私有目录规范 |
| `docs/listening-slice-plan.md` | 旧技术计划；已增加状态说明，只保留技术基线 |
| `docs/schema.md` | 内容字段、`designReferences`、音频状态和 `l:` 命名空间说明 |
| `docs/a1-pilot-review.md` | 12份试点的人工验收表和当前未完成项 |
| `docs/a1-content-review-handoff.md` | 本交接文件 |

### 8.2 教材证据与内容数据

| 文件 | 作用 |
|---|---|
| `data/syllabus-ref.json` | 来源、证据单元和六阶段硬规格 |
| `data/a1-pilot-listening.js` | 重写后的6个精听试点 |
| `data/a1-pilot-readings.js` | 重写后的6篇精读试点 |
| `data/listening.js` | 合并旧精听和新试点的入口 |
| `data/readings.js` | 合并旧阅读和新试点的入口 |
| `data/a1-overlap-whitelist.json` | 五词固定表达白名单；当前为空 |
| `data/a1-audit-report.json` | 来源哈希、内容哈希、难度、重合与总门禁报告 |

### 8.3 推荐、交互与学习闭环

| 文件 | 作用 |
|---|---|
| `js/content-readiness.js` | 课程完成度和SRS共同计算“正合适/稍难/挑战/复习” |
| `js/views/listening.js` | 五阶段精听组装、句下标和 `l:` 错句写入 |
| `js/mastery.js` | 普通错题 `m:`、精听错句 `l:` 和技能强度 |
| `js/views/today.js` | 每日路线中的 `l:` 精听错句复现 |
| `js/views/reading.js` | 精读预测、定位、理解题、概括和阅读技能回写 |
| `js/ui.js` | `renderQuiz` 逐题回调与跟读标准音注入 |
| `js/exercises.js` | 听写、复述和原精听音频播放 |
| `js/lesson-shell.js` | 复用的课程外壳及自定义错题入口 |
| `js/storage.js` | SRS命名空间说明 |
| `js/views/readlisten.js` | 精读/精听列表和推荐标签 |
| `js/app.js` | 精听路由 |

### 8.4 工具与测试

| 文件 | 作用 |
|---|---|
| `tools/a1-coverage.mjs` | A1词汇覆盖率和词形近似处理 |
| `tools/audit_a1_content.mjs` | 证据、难度、哈希和原创性审计 |
| `tools/ocr_reference_pages.swift` | 指定商业教材页面的Vision OCR工具 |
| `tools/gen_listening_audio.py` | 精听包音频和时间戳生成 |
| `tests/a1-pilot-content.test.mjs` | 数量、证据类型、阶段、课次和重合检查 |
| `tests/listening-data.test.mjs` | 精听结构、词汇、授权和音频状态检查 |
| `tests/listening-mastery.test.mjs` | `l:` 命名空间和调度测试 |

### 8.5 私有且禁止提交

```text
正版图书/
正版图书/.distillation/
正版图书/官方MP3/
```

`.gitignore` 已忽略整个 `正版图书/`。当前 `git ls-files "正版图书/**"` 无输出。

## 9. 建议 Claude 重点审查

### 9.1 教材证据是否过度声明

重点检查：

- `data/syllabus-ref.json` 中的页码、练习和音轨范围是否与教材一致；
- 当前抽象观察是否真的能从相关页面得出；
- 是否把“只看目录和页面结构”错误写成了“完整分析教材”；
- Hueber 音轨是否应在人工验收前抽听 L1–L6 各 1–2 条。

### 9.2 正文是否真正满足阶段任务

逐份检查：

- L2答案是否确实依赖字母和相近数字的声音；
- L3是否清楚区分旧信息和新信息；
- L4是否能区分建议、愿望和决定；
- L5是否必须听完整路线才能还原地标；
- L6完成时是否自然且没有超纲；
- R2/R4/R5是否真的需要跨字段比较；
- R6两段是否既有共同事实，又有顺序和评价差异。

### 9.3 难度估算是否过于宽松

`tools/a1-coverage.mjs` 为处理词典缺口增加了：

- 高频功能词和常见完成时词形；
- 对已声明 lemma 的保守前缀近似匹配。

需要审查：

- 这些规则是否把真实生词错误算成已知词；
- `targetLemmas` 是否真的来自推荐课次或已背词汇；
- 当前“基线覆盖率”是否应改成更严格的逐 token lemma 分析。

### 9.4 测试全绿与产品完成度的区别

当前测试允许：

```js
audioStatus: 'pending-tts'
```

因此：

- `npm test` 全绿只表示“未完成状态被正确表达”；
- 不表示6个新精听包已经能播放；
- 是否接受这种测试策略需要审查者明确判断。

### 9.5 OCR是否应继续作为硬门禁

可选方案：

- 保留全文OCR；
- 改为只OCR实际引用页；
- 改为引用页渲染＋人工/视觉模型抽样比较；
- 商业教材只做抽样，仓库和公开材料继续自动查重。

如果取消全文OCR，需同步修改：

- `docs/a1-content-production-plan.md`；
- `docs/textbook-extraction-guide.md`；
- `tools/audit_a1_content.mjs`；
- `data/a1-audit-report.json` 的门禁口径。

## 10. 建议审查顺序

1. 阅读本文件和 `docs/a1-content-production-plan.md`；
2. 检查 `data/syllabus-ref.json` 是否真实对应教材；
3. 抽查 `data/a1-pilot-listening.js` 与 `data/a1-pilot-readings.js`；
4. 检查 `tools/audit_a1_content.mjs` 的覆盖率和重合算法；
5. 检查 `js/mastery.js`、`js/views/listening.js` 和 `js/views/today.js` 的 `l:` 闭环；
6. 运行 `npm test`；
7. 运行 `node tools/audit_a1_content.mjs --write-report`；
8. 根据审查结论决定采用全文OCR还是引用页抽样；
9. 生成原创TTS并完成人工验收；
10. 只有正式批准12份试点后，才启动剩余36份。

## 11. 工作区边界

- `CLAUDE.md` 中存在用户自己的未提交修改，本轮未改动；

- 本轮没有自动提交、推送或发布；
- 工作区还包含此前为精听播放器、内容列表和推荐标签所做的相关修改，审查时应以 `git diff` 为准；
- 不应把教材、OCR、页面图片或出版商音频加入 Git。

## 12. 复核后的变更（2026-07-25）

以下内容在独立复核中被修改，本文件第 2–9 节的部分描述已因此过时，以本节为准。

**修复的缺陷**

- `runListenMissDrill` 只匹配 `dictation` 步骤，而 `reproduce` 步骤同样写 `l:`；找不到步骤时又不出池。实测 `li-b01` 的复述句下标 8 不在其听写列表内，自评失败一次就会永久占用「待复习」计数。现改为听写/复述都匹配，找不到时 `rateMistake(id, true)` 出池。
- `js/exercises.js` 新增了 `listenFull`/`listenReview` 但引用方仍是 `?v=4`，`today.js` 大改而 `app.js` 仍是 `?v=10`。已分别升到 `?v=5` / `?v=11`。
- `audioStatus !== 'ready'` 的精听包在读·听列表改为置灰「音频生成中」，不再给出点进去只有空壳的入口。

**内容返修**

- `rp-a1-05`：`im ersten Stock` 原译「一楼」（德语是二楼），已改正并加注释。
- `li-p03`：去掉 `sollte`（情态动词过去式）和 `ist … verschoben`（第二分词），两者都早于其 `grammarPrereqs`。
- `li-p06`：`Trotz der Panne` 二格介词改写；首句中文删去原文没有的「骑车」。
- `li-p04`：结尾由 `Wir wollen … abstimmen`（仍是意愿）改为明确决定句，否则与「区分建议/愿望/决定」的任务自相矛盾。
- `rp-a1-02`：去掉早于 R4 的 `man kann … Infinitiv`；第二题解析不再引用课文没有的信息。
- `Lernwunsch`/`Lernatelier`/`Ersatzraum`/`Fotoklub` 等低频自造复合词换成 `Lernziel`/`Lernzentrum`/`stattfinden`/`Muttersprache` 等真实高频词。
- 6 篇精读补齐逐句 `note`，与既有精读（`r01`）体例一致。

**审计工具**

- 删除 `tools/a1-coverage.mjs` 的 `A1_FORMS` 白名单（含 `trotz`）与 6 字符前缀近似匹配。词库缺的 A1 基础词改为补进 `tools/gen_dict.mjs` 的 `A1_GAPS` 与 `PARTICIPLES`，同时修好了查词弹窗对 `du`/`neben`/`gefahren` 无反应的问题（词条 945 → 956，含新导出的 `DICT_PARTICIPLES`）。
- `baselineKnownRatio` 原为 `(总token − 声明生词数)/总token`，是文本长度的函数而非难度度量。现改为真实覆盖率：分子只认词库与专名，`newLemmas` 按定义算未知，同一生词重复出现只罚第一次。12 份的分布从「全部 0.930–0.955」变成 0.927–0.985。
- `undeclaredWords` 改为只以 `newLemmas` 为声明来源，`targetLemmas` 不能再夹带词库外的词。据此补进词典的有 `Telefonnummer`/`Wohnort`/`Notiz`/`Vorschlag`/`Markt`/`Wunsch`。
- 新增 `grammarChecks()` 与 `report.grammar` 门禁，检测情态动词、第二分词、war/hatte、Präteritum 和二格介词，对 `Gebäude`/`Geschichten`/`gegen` 无误伤。**按"看懂 ≠ 会用"分两档**：只有超前结构落在要求听写/复述的句子里，或超前句超过全篇 1/3，才卡门禁；其余进 `receptiveNotes` 供人工判断。上面 `li-p03` 的两处（听写句 + 复述句）属于必须拦的一类。
- `tests/a1-pilot-content.test.mjs` 增加 3 组测试锁住上述行为（88 tests, 88 pass）。

**仍未完成（与第 5 节一致）**：原创 TTS、商业教材 OCR/抽样、12 份人工验收、第二阶段 36 份。`gate` 仍为 `incomplete`。
