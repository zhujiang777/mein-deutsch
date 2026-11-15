> 以 [产品宪法](product.md) 为准；本文件只作字段参考。

# Mein Deutsch 内容数据规范

写给内容作者（含 AI agent）。内容只有两个文件：`data/story-lessons.js`（课文课）和 `data/vocab.js`（词库）。**以代码实现为准**（`heft/js/flow.js`、`heft/js/screens.js`、`heft/js/screens2.js`）。

约定：
- `?` 表示可选字段；无标记为必填。
- 德语文本改动后要补录音（见 §2.4），否则那一句没有声音。

---

## 1. 词库 `data/vocab.js`

`THEMES` 定义主题：`{ id, name, icon }`。`VOCAB` 每条词：

```js
{
  id: 'w001',                 // 'wNNN'，全局唯一（当前用 w() 工厂自动编号）
  de: 'Kaffee',              // 词条本身（名词写单数原形，不带冠词）
  art: 'der',                // 'der'|'die'|'das'|null（词性；决定颜色；非名词填 null）
  pl: 'Kaffees',             // 复数形式字符串，或 null
  zh: '咖啡',                // 中文义（也作检验干扰项来源、senses 缺省）
  ex: 'Ich trinke Kaffee.',  // 例句（sentences 缺省来源）
  exZh: '我喝咖啡。',        // 例句翻译
  theme: 'essen',            // 对应 THEMES 里的 id

  // ---- 以下为可选增强字段 ----
  senses: [{ pos: 'n.', zh: '咖啡' }],          // ? 多义项列表；pos 是词性缩写
  sentences: [                                   // ? 多例句
    { de: 'Ein Kaffee, bitte.', zh: '请来杯咖啡。', source: 'r04' }, // source=阅读 id，显示"出自课文"
  ],
  mnemonic: '🧩 联想助记文本',                    // ?
  valence: 'helfen + Dativ：jemandem helfen',     // ? 支配关系，词义下方浅金色小行显示

  // ---- 维度字段（2026-07 补全，tests/vocab-data.test.mjs 强制校验）----
  pos: 'v.',        // 非名词必填（名词由 art 隐含 n. 不填）。缩写集：v. adj. adv. num. prep. pron. interj. konj. phrase
  noPl: true,       // ? 确无复数的名词标记；名词必须 pl 或 noPl 二选一（互斥）
  forms: {          // 动词（pos:'v.'）必填。可分动词写分开形（ich:'stehe auf'）
    ich:'trinke', du:'trinkst', er:'trinkt', wir:'trinken', ihr:'trinkt', sie:'trinken',
    perfekt: 'hat getrunken',   // 完整含助动词；位移/状态变化动词用 ist
    praeteritum: 'trank',       // ? 仅 sein/haben/werden/情态动词填（A1 教学范围）
  },                            // 无人称动词（regnen/wehtun）只填 er + perfekt
  phrases: [{ de: 'eine Tasse Kaffee', zh: '一杯咖啡' }],  // ? 高频固定搭配，每词 ≤3 条
}
```

- 名词的 `spoken`（朗读用）自动拼成 `art + de`（如 "der Kaffee"）；因此音频管线会收录带冠词形式。
- `valence` 只做展示，无解析逻辑；写成便于记忆的一行即可（动词支配格、介词搭配等）。
- **新增词只能追加到 `VOCAB` 数组最末尾**——`id` 按位置自动生成，中插会让后续所有词的 id 位移、破坏 SRS 存档。主题归属靠 `theme` 字段，与数组位置无关。
- 词库现在只当“登记簿”用：课文里进入复习的词要能在这里查到（`tests/story-lesson.test.mjs` 校验）；词库本身不单独配音。

---

## 2. 课文课 `data/story-lessons.js`

按 30 课进度表写的连续故事，应用（`heft/`）直接读这个文件。`tests/story-lesson.test.mjs` 校验下面的硬规则。

`STORY_SYLLABUS` 是 30 课的语法进度（单元名 + 每课的语法点名），手帐页的语法地图用；写好的课以语法卡标题为准。

导出：`STORY_CAST`（角色 → 中文简介与固定配音）、`WORD_VOICE`（念单词用哪个角色的声音）、`STORY_NAMES`（人名地名，不算生词）、`STORY_LESSONS`、`STORY_UNIT_SUMMARIES`、`storyAudioItems()`。

### 2.1 课文课（第 1 课起）

一课一个对象：

| 字段 | 含义 |
|---|---|
| `lines` / `role` | 课文逐句（说话人、德语、中文）；`role` 是“我的角色” |
| `gloss` | 点词释义，课文和课后小材料里的每个词都要有 |
| `cards` | 语法卡、发音卡各 1 张，生活小贴士可选；`after` 是插在第几句之后 |
| `dictation` / `shadow` | 听写哪几句；跟读哪几句（只能是我的角色） |
| `reviews` / `reading` | 3 道隔天检查变式；课后小材料 + 1 道理解题 |
| `version` | 改了已上线的课文内容就加 1（学习记录按版本分开） |
| `n` / `unit` / `days` | 进度表里的课号、单元号；`days: 1` 表示 1 天学完（第 1 单元），其余为 2 |
| `cover` | ? 首页名签上的短名，5 个字以内；课名本身不超过 5 个字时不用填（名签放不下长课名） |
| `canDo` | 学完能做到什么（一条一句，进度证据用） |
| `cast` | 本课出场的其他角色，预习时“认人物”用 |
| `lines[].who` | 说话人，必须是 `STORY_CAST` 的键；音频按“角色 + 句子”生成 |
| `lines[].say` | ? 念出来的字和显示的字不一样时填（拼字母、数字、被打断的半句） |
| `preview` | 预习词 4–6 个：`{ de, zh, line, pic }`，`line` 是这个词出现在第几句（听到那句时亮出来），`pic` 是图标名 |
| `listenQuestion` | 听前问题（选择题）。`key` 是答案落在第几个预习词上 |
| `words` | 进复习的重点词 5–8 个：`{ id?, de, zh, line, form }`。`id` 只在词库里真有这个词时才填；没有 `id` 的是词库待补的词（自带 `zh`，可带 `art / pos`），接入时追加到 `vocab.js` 末尾 |
| `phrases` | 按整体短语学的口头语：`{ de, zh }` |
| `cards[].table` + `on` | 语法卡的整张小表（`{ head, rows }`）和本课点亮的行下标；`contrast` 是 du / Sie 之类的成对例句 |
| `cards[].shelf` | ? 小贴士在手帐页归到哪一类：`'grammar'` 或 `'pron'`；不填算文化 |
| `words[].more` | ? 复习词卡背面的补充：`{ col: [[搭配, 中文]], ex: [[例句, 中文]] }`，没有就不出那一块 |
| `cards[].words` | ? 小贴士卡下面列的例词（带冠词），按词性上色、点了能听 |
| `cards[].pics` | 发音卡的口型图（名字同第 0 课小抄的 `pic`）。一张图就写一个；和 `pairs` 一一对应时，点哪个词换哪张图（如第 1 课 ich / ach） |
| `cards[].drill` | 语法卡「先做后讲」的小题，一道点亮表里一格：`{ line, de, zh, v, no, sj, row, col? }`——`line` 课文第几句（必须不晚于这张卡的 `after`），`de` 那句里用来挖空的半句，`v` 正确的动词（按句中写法），`no` 干扰项，`sj` 主语（按句中写法），`row`/`col` 对应表里哪一格（`col` 默认 1）。语法卡必须有 `drill`；`body` 是最后留下的那句规则，用规范术语 |
| `exercises` | 轻快练习，顺序即出题顺序。类型：`choice`、`listenChoice`（带 `voice`、`audioText`，可带 `say`）、`match`、`assemble` |
| `speak` | 开口回应场景：`{ prompt, cue?: { who, de }, answers, model }`。`cue` 是对方先说的话，用该角色的声音 |
| `wordPack` | ? 词包：`{ title, items: [{ n, de }], refs, inText, exercises }`。`refs` 是词库里对应的词条，`inText` 是课文里真的出现的成员 |
| `reading.newWords` | 小材料里的新词 3–5 个：`{ de, zh, forms }`，`forms` 是文中出现的小写词形 |
| `reading.kind` | `'read'`（泛读）或 `'listen'`（泛听） |

选择题的正确项都写在第一个（`answer: 0`），页面负责打乱。

### 2.2 第 0 课（`kind: 'pron'`）

没有课文，按 `stops`（小站）排，轻量版（2026-11-14）共 5 站：字母表、三张拼读小抄、门铃名牌。每站 `{ id, title }`，内容三选一：`letters`（`{ l, name, say }`，字母表，另有 `cue` 一句说明和 `hard` 要标出的字母）；`rows`（拼读小抄，一行一个读音：`{ s, w, zh, c, gap? }`——`s` 读音，`w` 例词，用 `[ ]` 标出这个读音如 `der K[ä]se`，`c` 一句“嘴怎么动”，不用拼音、英语类比；`gap` 表示这一行上面画一道粗线分组；`pic` 可选，口型图的名字（`m-ae m-oe m-ue m-wv m-sch m-ich m-ach m-z`，画在 `heft/js/mouth-sprites.js`），点开这一行时和 `c` 一起展开），后面跟 `tries`（`{ w, zh }`，照小抄先自己读、再听原声的词，不判对错）；`blind`（门铃名牌，`{ de, zh, say? }`）。`exercises` 可选，第 0 课不放辨音题、不评分；`{ type: 'try', w, prompt, voice, say }` 是“先读再听”的单独一屏。

### 2.3 单元总表 `STORY_UNIT_SUMMARIES`

`{ unit, after, title, canDo, tables, newRows, exercises }`：`after` 是哪一课之后出现；`tables` 是整张变位表；`newRows` 是课文里没出现、在这里补齐的人称的例句。`rule` 是总表上方那一句规则（能照做的一句话）。

`quiz`（单元小测，宪法要求“没见过的听力 + 开口回应”）：
- `listen.lines`：一段新对话，写法同课文的 `lines`，只用本单元学过的词和已有的角色。
- `questions`：听后选择题，`type: 'heardChoice'`（页面带「再听一遍」）。
- `speak`：开口回应题（`response`），也可以放 `listenChoice`。
- 小测里每道题都要有 `can`：它检验的是 `canDo` 里的第几条（从 0 数）。结果页按条打勾，名下有一题答错的那条显示「再练一次」。每条 `canDo` 至少要有一题。

变位表的一格怎么念由 `rowSay(row, col)` 决定（`'er / sie'` + `'kommt'` → “er kommt”），页面和配音清单共用。

- `intro`：? 总表里第一次出现、课文没教过的格子，先教再考。`{ lines, card }`：`lines` 是 3–5 句小对话；`card` 是一张先做后讲的语法卡（`table`、`drill`，`all: true` 表示把小对话整段列出来），`drill[].line` 指 `intro.lines` 的下标。应用里的顺序：小对话 → 小空 → 总表 → 练习 → 小测

### 2.4 配音清单

`node tools/voice-script.mjs` 读 `storyAudioItems()`，把所有要念的字按角色分组写到 `tools/voice-script.json`（`{ id, lesson, kind, text }`，`id` 是“角色 + 文本”的指纹，可当文件名）。改了德语文本后重跑。批量生成前先抽听：字母名（`Ell, Ih, Enn` 这类写法）和 `BWL`。

---
