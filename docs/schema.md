# Mein Deutsch 内容数据规范

写给内容作者（含 AI agent）。目标：只改 `data/*.js`，就能安全地扩充课程、词汇、阅读。
**以代码实现为准**；本文所有字段都与 `js/exercises.js`、`js/views/lesson.js`、`js/views/vocab.js`、
`js/views/reading.js`、`js/recur.js` 的实际读取一致。

约定：
- `?` 表示可选字段；无标记为必填。
- 所有德语文本改动后，必须重跑音频管线（见文末「音频管线」），否则新句子会退回设备 TTS。
- 不要手改 `data/audio-manifest.js`（自动生成）。

---

## 1. 课程 `data/course.js`

结构：`COURSE`（单元数组）→ `unit.lessons`（微步课数组）→ `lesson.steps`（步骤数组）。

### 1.1 单元 unit

```js
{
  id: 'u1',                       // 全局唯一
  title: '第1单元 · Hallo! 我是谁',
  icon: '👋',                     // ? 单元图标 emoji，默认 📘
  track: 'grammar',               // 'grammar'(语法主线) | 'pron'(发音入门) | 'scene'(场景口语)；缺省按 'grammar'
  intro: '一句话说明本单元学什么', // ?
  nicosWeg: { name: '...', url: 'https://...' }, // ? 对标官方课程来源卡
  videos: [                       // ? 单元视频（掌握门槛的一部分）
    { yt: 'YOUTUBE_ID', title: '标题', note: '?说明', duration: '?12:00' },
  ],
  lessons: [ /* 见 1.2 */ ],
}
```

- `track` 决定单元落在「📐 语法主线」「🔤 发音入门」还是「🗣️ 场景口语」泳道。三条线**各自独立顺序解锁**。
- 路径页按 `track` 分组，泳道内按 `COURSE` 里的先后顺序解锁：前一课 `done` 后，下一课才解锁。

### 1.2 微步课 lesson

```js
{
  id: 'u1l1',                     // 全局唯一，路由 #/lesson/u1l1
  title: 'ich bin · du bist',
  skills: ['sein-sg', 'pron-sg'], // ? 技能标签，用于掌握度聚合（lessonMastery）
  steps: [ /* 见 1.3 */ ],
}
```

- `skills` 是自定义字符串标签。答题时 `step.skills`（优先）或 `lesson.skills` 计入掌握度。

### 1.3 步骤 step（按 type 区分）

步骤分三类：**信息卡**（展示）、**练习**（计分）、**展示/复述**（新增）。
所有练习类 step 都支持可选 `skills: [...]` 和 `explain`（答后在反馈条显示）。

#### 信息卡：`teach` / `example` / `recap`

三者渲染完全相同（`renderInfoStep`），仅语义不同。底部固定「继续」按钮，不计分。

```js
{
  type: 'teach',        // 或 'example' / 'recap'
  h: '小标题',          // ?
  p: '正文。\n用 \\n 分段。', // ? 每个 \n 拆成一个 <p>
  table: {              // ? 变位/对照表
    head: ['人称', 'sein', '例'],
    rows: [['ich', 'bin', 'Ich bin müde.'], ['du', 'bist', 'Du bist nett.']],
  },
  example: {            // ? 内嵌例句卡（进入时自动朗读 de）
    de: 'Ich bin Anna.',
    zh: '我是安娜。',
    note: '?补充说明',
  },
  tip: '?一句提示（高亮框）',
}
```

#### 练习：`choice` 单选

```js
{ type: 'choice', prompt: 'Ich ___ Student.（我是大学生。）',
  options: ['bin', 'bist', 'ist'], a: 0,   // a = 正确项下标
  audioText: '?Ich bin Student.',          // ? 有则显示朗读按钮
  explain: '?ich 永远配 bin。', skills: ['sein-sg'] }
```

#### 练习：`listenChoice` 听音单选

```js
{ type: 'listenChoice', audioText: 'Ich bin müde.',   // 进入时自动播放
  options: ['我累了。', '你很好。', '我是学生。'], a: 0,  // 选项常为中文义
  explain: '?müde = 疲惫的。', skills: ['sein-sg'] }
```

#### 练习：`assemble` 词块拼句（中→德）

```js
{ type: 'assemble', zh: '我是学生。', answer: 'Ich bin Student.',
  distractors: ['bist'],           // ? 干扰词块
  explain: '?', skills: ['sein-sg','v2-order'] }
```

- 判定忽略大小写/标点/ß≈ss/多空格。

#### 练习：`dictation` 听写（默认打字）

```js
{ type: 'dictation', audioText: 'Ich bin Anna.',
  mode: 'type',                    // ? 'type'(默认，打字) | 'blocks'(词块拼句)
  distractors: ['bist','du'],      // ? 仅 blocks 模式用
  explain: '?', skills: ['sein-sg'] }
```

- 打字模式：输入框 + 特殊字符条 `[ä ö ü ß ẞ Ä Ö Ü]`；判定忽略大小写/标点/ß≈ss/多空格。
  仅大小写差异仍算对，但提示「注意名词大写」。答错显示 diff。右下角可临场「改用词块」。
- `answer` 与 `audioText` 二选一即可（缺 `answer` 时用 `audioText` 当正确答案）。

#### 练习：`fill` 填空打字

```js
{ type: 'fill', prompt: 'Du ___ mein Freund.（你是我的朋友。）',
  a: ['bist'],                     // 接受答案数组（任一命中即对）
  hint: '?占位提示', explain: '?', skills: ['sein-sg'] }
```

#### 练习：`match` 词义配对

```js
{ type: 'match',
  pairs: [ { de: 'ich bin', zh: '我是' }, { de: 'du bist', zh: '你是' } ],
  skills: ['sein-sg'] }
```

- 全部配对成功才算完成；中途配错会记为本题出错。

#### 练习：`translate` 中译德打字

```js
{ type: 'translate', zh: '我们是大学生。',
  a: ['Wir sind Studenten', 'Wir sind Studenten.'],  // 接受答案数组
  explain: '?', skills: ['sein-pl'] }
```

#### 练习：`speak` 跟读（云端发音评测 + 录音对比）

```js
{ type: 'speak', de: 'Ich bin Anna und du bist Max.', zh: '?我是安娜，你是马克斯。' }
```

- 一次录音同时生成本机回放和 16 kHz PCM WAV；停止后立即并排回放「标准 / 我的录音」，
  再异步显示综合发音、音素准确、流利度、完整度和逐词反馈（综合分 ≥70 通过）。
- 通过 → 底部按钮变「✓ 继续」，提交记为正确（计入统计，从不计错）；
  未通过 → 提示重录，但「完成，继续」永远可点（跳过不计）。
- 云端未配置 / 失败 → 无感退化为纯录音对比，不生成文字匹配分。数据格式不变 `{type:'speak', de, zh}`。

#### 展示：`scene` 对话展示步（新增）

```js
{ type: 'scene', title: '?在咖啡馆',
  lines: [
    { who: 'Kellner', de: 'Guten Tag! Was möchten Sie?', zh: '您好！想点什么？' },
    { who: 'Anna',    de: 'Einen Kaffee, bitte.',        zh: '请来杯咖啡。' },
  ] }
```

- 逐句展示（说话人加粗、德语大字、中文可整体开关），每句有朗读按钮，顶部「▶ 连播」。
  纯展示，底部「继续」推进，不计分。`who` 用于区分说话人标签。

#### 展示/练习：`observe` 语法观察步（新增，计分）

```js
{ type: 'observe',
  intro: '?观察下面两句里 möchte 的位置',
  lines: [
    { de: 'Ich möchte einen Kaffee.', zh: '我想要一杯咖啡。', hl: 'möchte' }, // hl 首次出现处高亮
    { de: 'Möchten Sie auch etwas?',  zh: '您也想要点什么吗？', hl: 'Möchten' },
  ],
  q: '动词 möchte 出现在句子的第几位？',
  options: ['第一位', '第二位', '句尾'], a: 1,
  explain: '?陈述句里变位动词永远在第二位。', skills: ['?'] }
```

- 先展示对话片段（`hl` 为要高亮的**子串**，转义后首次出现处包 `<mark>`），再答引导选择题。
  计入答题统计，`explain` 在答后的反馈条显示。

#### 复述：`reproduce` 整句复述（新增，计分 + 重排队）

```js
{ type: 'reproduce', de: 'Ich möchte einen Kaffee, bitte.', zh: '我想要一杯咖啡，谢谢。' }
```

- 初始只显示 `zh` 和 🔊（德语文本隐藏）→ 听后录音复现 → 停止显示 `de` + 对比回放 →
  自评「✅ 复现出来了 / 🔁 还不行」。选「还不行」会把该步重排到队尾再练。
  无麦克风时降级：听 → 心里复述 → 显示文本自评。

#### 收尾：`roleplay` 角色扮演步（新增）

```js
{ type: 'roleplay', title: '?点一杯咖啡', userRole: 'Gast',
  lines: [
    { who: 'Kellner', de: 'Was möchten Sie?',        zh: '您想要什么？' },
    { who: 'Gast',    de: 'Einen Kaffee, bitte.',    zh: '（你）请来杯咖啡。' },
    { who: 'Kellner', de: 'Sonst noch etwas?',       zh: '还要别的吗？' },
    { who: 'Gast',    de: 'Nein, danke.',            zh: '（你）不用了，谢谢。' },
  ] }
```

- 逐句推进：`who !== userRole` 的句子自动播放并显示文本；轮到 `userRole` 时显示中文提示，
  用户录音说德语 → 停止后显示参考 `de` + 对比回放 → 下一句。全部完成算通过。
  无麦克风降级为「看中文说德语 → 点击显示参考」。`userRole` 必须与某些 `lines[].who` 精确相等。

### 1.4 判定与统计口径（作者需知）

- 判对宽容度（choice/match 用下标精确匹配；文本类忽略大小写/标点/ß≈ss/多余空格）。
- 答错的**练习**会复制到队尾反复出，直到做对；成绩只记首次。
- `scene`/`roleplay` 为展示步，不计分、不弹反馈条；`observe`/`reproduce` 计分。
- 首答错的练习进入错题池，次日在「今日学习」复现。

---

## 2. 词汇 `data/vocab.js`

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

  // ---- 以下为可选增强字段（词卡 wordcard 会用；不填则从上面缺省派生）----
  senses: [{ pos: 'n.', zh: '咖啡' }],          // ? 多义项列表；pos 是词性缩写
  sentences: [                                   // ? 多例句
    { de: 'Ein Kaffee, bitte.', zh: '请来杯咖啡。', source: 'r04' }, // source=阅读 id，显示"出自课文"
  ],
  mnemonic: '🧩 联想助记文本',                    // ?
  valence: 'helfen + Dativ：jemandem helfen',     // ? 支配关系，词义下方浅金色小行显示
}
```

- 名词的 `spoken`（朗读用）自动拼成 `art + de`（如 "der Kaffee"）；因此音频管线会收录带冠词形式。
- `valence` 只做展示，无解析逻辑；写成便于记忆的一行即可（动词支配格、介词搭配等）。
- 新增词请追加到对应主题分组内，保持 `id` 连续。

---

## 3. 阅读 `data/readings.js`

```js
{
  id: 'r01',
  title: 'Hallo, ich bin Anna',   // 德语标题
  titleZh: '你好，我是安娜',
  level: 'A1',
  mode: 'intensiv',               // 'intensiv'(精读) | 'extensiv'(泛读)
  vocabRefs: ['w016','w017','w018'], // ? 文中确实出现的词的 vocab id，3-8 个，宁缺毋滥
  intro: '?导读一句话',
  sentences: [
    { de: 'Hallo! Ich heiße Anna.', zh: '你好！我叫安娜。', note: '?heißen 叫……' },
  ],
  speakPractice: [0, 2, 6],       // ? 仅 intensiv：挑哪几句做跟读（句子下标）
  glossary: {                     // ? 主要 intensiv 用：点词查义
    // 键 = 课文中出现的小写词形（含变位/复数形式）
    heiße: { base: 'heißen', zh: '叫（名字）' },
    heißt: { base: 'heißen', zh: '叫（名字）' },
  },
  questions: [                    // ? 主要 extensiv 用：读后理解题（choice）
    { type: 'choice', q: 'Wie alt ist Bruno?', options: ['zwei','drei','vier'], a: 1, explain: '?' },
  ],
}
```

- `vocabRefs` 驱动「读·听」页顶部的**为你推荐**：`js/recur.js` 计算 `vocabRefs` 与用户
  「最近学的词 + 到期复习词」的重叠数，取重叠最高的前 2 篇推荐，标注「复现你最近学的 N 个词」。
  所以只填**文中真的出现**、且在 `vocab.js` 里有对应词条的 id（对照 `de` 找 id）。无重叠时该篇不推荐。
- `glossary` 键必须是小写、与课文中实际词形一致（含变位）；点词时按去标点小写匹配。

---

## 4. 音频管线（改德语文本后必做）

- 播放逻辑（`js/speech.js`）：`speak(text)` 先查 `data/audio-manifest.js`，命中就放
  预生成的 `audio/<hash>.mp3`（真人级 de-DE 神经语音）；未命中回退设备德语 TTS（音质差、可能无声）。
- 因此**任何德语文本新增/修改后**，在项目根运行：

  ```bash
  python3 tools/gen_audio.py
  ```

  幂等：已存在的音频跳过，只补新增；同时重写 `data/audio-manifest.js`（勿手改）。
- 需要发音的文本由 `tools/extract_texts.mjs` 统一提取，已覆盖：
  发音/语法课例句、词汇（带冠词形式 + 例句）、阅读逐句 + 全文、
  课程步骤的 `example.de` / `audioText` / `answer` / `de`（speak·reproduce）/
  choice 正确项 / fill·translate 首个答案 / match 的 `de` /
  **scene·observe·roleplay 的 `lines[].de`**。
  新增题型若引入新的德语文本字段，需同步更新 `extract_texts.mjs` 再跑 `gen_audio.py`。
- 自检：`node tools/extract_texts.mjs > /dev/null && echo OK` 应通过（数据文件语法正确）。
