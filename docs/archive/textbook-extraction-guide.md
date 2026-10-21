> **已作废，仅供历史参考。** 与 [产品宪法](../product.md) 冲突时以宪法为准。

# A1 教材蒸馏与证据记录规范

本规范用于生成 `data/syllabus-ref.json` 的抽象证据。商业教材、页面渲染、OCR、出版商音频及教材原文只留在 `正版图书/.distillation/`；仓库只保存定位信息、抽象观察和原创内容。

## 1. 私有提取目录

```text
正版图书/.distillation/
├── renders/          # 指定页渲染
├── ocr/              # Vision OCR 原始结果
├── audio-analysis/   # 音轨时长、说话人数、任务结构
└── audit/            # 重合检查的私有明细
```

整个 `正版图书/` 已由 `.gitignore` 排除。不得把上述目录的文件复制到 `data/`、`docs/`、`audio/` 或提交记录中。

## 2. 提取步骤

1. 先看目录页，确定章节、页码、练习号和音轨范围。
2. 只渲染当前阶段需要的页面；需要全文检索时用 `tools/ocr_reference_pages.swift` 写入私有 OCR 目录。
3. 听出版商音轨只记录说话人数、语篇类型、信息密度、任务顺序与辨音难点，不转录台词。
4. 在 `evidenceUnits` 写入来源 ID、定位器和抽象观察；观察不得出现可还原练习的连续表达。
5. 在 `stageProfiles` 冻结硬约束后，内容作者离开教材页面，从空白页写原创稿。

OCR 示例：

```bash
swift tools/ocr_reference_pages.swift \
  "正版图书/Hueber Lesen & Schreiben A1.pdf" \
  "5-18,21-30" \
  "正版图书/.distillation/ocr/hueber-reading-a1.txt"
```

页码按 PDF 页序从 1 开始。工具输出仅供本地审计，绝不进入 Git。

## 3. 允许保存的抽象信息

- 语法、词汇域、语域、技能目标及先后顺序；
- 文体或语篇类型；
- 匹配、定位、比较、排序、概括等任务机制；
- 说话人数、时长区间、信息项数量等抽象参数；
- 页面、练习、音轨等定位器。

禁止保存教材正文、例句、对话、题干、选项、图片、人物、情节与信息顺序。“换词、同义改写或调序”仍不算原创。

## 4. 内容证据字段

```js
designReferences: {
  evidenceIds: [
    'repo-s3-u8l4',
    'passwort-a1-progression',
    'hueber-h-b-time',
    'goethe-a1-listening'
  ],
  appliedConstraints: [
    '公共通知先给旧信息，再给新时间和新地点',
    '答案依赖相近时间的听辨'
  ],
  originalityStatement: '人物、地点、句子、选项和信息顺序均从空白页原创。'
}
```

每份内容至少包含课程/主课进度、Hueber 技能证据和公开校准三类证据。`evidenceId` 必须能在 `data/syllabus-ref.json` 定位。

## 5. 原创性审计

正文冻结前运行：

```bash
node tools/audit_a1_content.mjs --write-report
```

审计范围包括当前课程、旧场景/读听内容及 `正版图书/.distillation/ocr/`。六词连续重合直接失败；五词重合只有属于固定表达、且在白名单写明理由时才允许。仓库报告只保存内容哈希、来源哈希、计数与结论，不保存私有 OCR 文本。

Deutsch im Blick 虽有开放许可，本批也只用于校准；Goethe、VHS 和 Nicos Weg 同样不得直接复制语料。
