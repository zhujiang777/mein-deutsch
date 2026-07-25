# 教材知识提取指导（给 Codex）

> 用途：从中德 / 中英德语教材中提取**教学事实层**信息，产出 `data/syllabus-ref.json`，供本项目 content-producer **原创重写**精听 / 精读内容使用。
> 本项目公开部署在 GitHub Pages，因此**不得**把任何受版权保护的表达搬进仓库。
> 相关：`docs/listening-slice-plan.md`（消费方）、`docs/schema.md`（数据规范）、`tools/wortliste.json`（Goethe A1 官方词表，交叉验证用）

---

## 0. 一句话原则

> **换一本同级别教材也会长得差不多的 → 事实层，可提取。**
> **这本书特有的措辞、例句、人物、情节 → 表达层，不可提取。**

版权保护「表达」不保护「事实与思想」。
「第 4 课教餐饮点单、用 `möchte`、要求学会问价」——这是教学事实，可提取。
「Guten Tag, was möchten Sie?」——这是表达，不可提取。

我们提取前者，自己写后者。拿不准的一律**归入黑名单不提取**，缺一条信息的成本远低于一次侵权。

---

## 1. 白名单：可以提取

| # | 类别 | 具体内容 |
|---|---|---|
| 1 | **话题序列** | 每课的话题标签（餐饮 / 问路 / 居住 / 购物…）及其在全书中的先后顺序 |
| 2 | **交际功能** | Sprachhandlungen 清单：点单、问价、自我介绍、约时间… 用德语功能名 + 中文 |
| 3 | **词表** | lemma + 词性 + 冠词 + 复数形式。**仅这四个语言学属性** |
| 4 | **语法点与顺序** | 「Präsens 规则动词 → sein/haben → Akkusativ 冠词 → 情态动词」这类清单与出现次序 |
| 5 | **任务类型** | 听力/阅读题型名称与结构模式：「三选一大意题 + 5 空细节填空」 |
| 6 | **规格参数** | 每课音频时长、句数、语速、说话人数、生词密度 |
| 7 | **场景要素** | 角色类型（服务员 / 顾客）、地点、典型交际步骤顺序 |

---

## 2. 黑名单：禁止提取、复制或改写

1. **课文与对话原文** —— 任何长度，**包括单句**
2. **讲解文字**、语法说明的措辞
3. **例句原文** —— 哪怕只有 3 个词
4. **练习题原题干与选项**
5. **书中虚构人物姓名、情节、连续故事线**（如 DW Nicos Weg 的 Nico、Lisa 一线人物）
6. **插图、排版、图表、页面截图**

⚠️ **「改写 / 换词 / 调整语序」不是安全出口**——逐句改写受版权原文仍属衍生作品。安全路径只有一条：**只拿清单，句子自己从零写**。

---

## 3. 词表的特殊说明（重要）

单词本身是事实，不受版权保护。但**词表的选择与编排**在部分法域受汇编著作权（compilation copyright / Datenbankwerk）保护。因此：

1. **只取 lemma 用于难度对齐与筛选**，不把该书的编排顺序直接当作产品的课程结构。
2. **与 `tools/wortliste.json`（DWDS 抓的 849 条 Goethe A1 官方词表）交叉验证**，每条标 `inGoetheA1: true|false`。落在官方词表内的词等于被独立来源证实，风险归零。
3. 书中独有、不在官方词表内的词 → 标 `inGoetheA1: false` 并**默认不进产品**，仅作参考。
4. 产品的课程顺序以我们自己的 `docs/grammar-track-plan.md` / `docs/scene-track-plan.md` 为准，教材顺序只作对照。

---

## 4. 输出格式：`data/syllabus-ref.json`

```json
{
  "meta": {
    "generatedAt": "2026-07-25",
    "note": "仅事实层教学信息（话题/功能/词表/语法/题型规格）。不含任何教材正文、例句、讲解或练习原文。"
  },
  "sources": [
    {
      "id": "dxdy1",
      "work": "当代大学德语 1",
      "edition": "第2版",
      "publisher": "外语教学与研究出版社",
      "isbn": "978-7-...",
      "pagesRead": "目录 iv-viii, 词表 231-248, 语法总览 249-252",
      "note": "仅提取事实层清单，未复制任何正文"
    }
  ],
  "units": [
    {
      "srcId": "dxdy1",
      "unit": "Lektion 4",
      "topic": "gastronomie",
      "topicZh": "餐饮点单",
      "func": ["etwas bestellen", "nach dem Preis fragen", "bezahlen"],
      "funcZh": ["点单", "问价格", "买单"],
      "grammar": ["möchte-Formen", "Akkusativ bestimmter Artikel"],
      "lemmas": [
        { "lemma": "Kaffee", "pos": "noun", "article": "der", "plural": "Kaffees", "inGoetheA1": true },
        { "lemma": "zahlen", "pos": "verb", "inGoetheA1": true }
      ],
      "listeningTask": {
        "type": "gist-choice + detail-gap",
        "options": 3, "gaps": 5, "durationSec": 45, "speakers": 2
      },
      "sceneRoles": ["Kellner", "Gast"],
      "place": "Café"
    }
  ]
}
```

**字段约束**
- `topic` 用小写英文 slug，与 `data/listening.js` 的 `topic` 字段共用同一套取值
- `func` / `grammar` 用**术语短语**，不是完整句子（`möchte-Formen` ✅ / `Man benutzt möchte, um höflich zu bestellen.` ❌）
- `lemmas[]` **只允许** `lemma` / `pos` / `article` / `plural` / `inGoetheA1` 五个键。**没有 `example`，没有 `translation`**——中文释义走本项目自己的 `data/dict-glosses.js`
- `pagesRead` 必填，便于复核

同时产出 **`docs/extraction-log.md`**：记录处理了哪些页、跳过了哪些、以及任何拿不准而主动丢弃的条目。

---

## 5. 工作流程

1. **只读这几类页面**：目录页、词表页、语法总览 / 进度表、听力任务说明页。**不要打开课文页与练习页**——不读就不会误抄。
2. 每个单元产出一条 `units[]` 记录。
3. 词表与 `tools/wortliste.json` 比对，逐条标 `inGoetheA1`（大小写不敏感匹配 lemma）。
4. 跑第 6 节自检。
5. 写 `docs/extraction-log.md`。
6. **不要**改动 `data/listening.js`、`data/course.js` 或任何其他数据文件——本任务只产出 `data/syllabus-ref.json` 与日志。

---

## 6. 提交前自检清单（必须全过）

- [ ] `data/syllabus-ref.json` 中不存在任何 **≥3 词的连续德语文本**（例外：术语短语如 `möchte-Formen`、`Akkusativ bestimmter Artikel`；这些是语法术语不是句子）
- [ ] 无任何**带变位动词的德语句子**（判定：含 `ist|sind|hat|haben|möchte|kann|ich|du|Sie` 且长度 ≥3 词 → 检查是不是抄了例句）
- [ ] 无教材中文讲解句的复制
- [ ] 每条 `lemmas[]` 只有那五个键，无例句、无该书的释义措辞
- [ ] 无虚构人物姓名、无情节描述
- [ ] `sources[]` 完整（work / edition / isbn / pagesRead / note）
- [ ] `topic` slug 与 `data/listening.js` 现有取值一致，新增的在 log 中说明
- [ ] 未修改除 `data/syllabus-ref.json` 与 `docs/extraction-log.md` 之外的任何文件

建议实现一个 `tools/check_syllabus_ref.mjs` 把前四条做成可跑的断言，接进 `npm test`。

---

## 7. 下游怎么用（给 content-producer 看）

读 `syllabus-ref.json` 的一条 `unit` → 按其 `topic` / `func` / `grammar` / `lemmas` / `listeningTask` 规格**从零原创**写 12 句对话 → 写进 `data/listening.js`，`provenance` 填：

```js
provenance: {
  kind: 'original', source: 'original', license: 'proprietary',
  adaptedFrom: {
    work: '当代大学德语 1', unit: 'Lektion 4',
    borrowed: ['话题:餐饮点单', '交际功能:点单/问价/买单',
               '词表:Kaffee,Kuchen,zahlen,Rechnung', '语法:möchte 情态动词',
               '听力题型:大意选择+细节听写'],
    statement: '脚本为依据上述事实层清单原创重写，未复制原文任何句子。',
  },
}
```

`borrowed[]` **只列事实层条目**。如果你发现自己想往里写一个句子，说明流程哪里错了——回到第 0 节。
