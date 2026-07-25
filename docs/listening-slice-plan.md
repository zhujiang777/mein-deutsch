# 精听垂直切片：真实语料 + 完整流程

## Context

用户对「精听 / 精读 / 泛听」两方面不满：**语料全是 AI 自撰**、**学习形式没达到效果**。代码层面完全坐实：

- **语料**：`data/readings.js` 仅 8 篇 A1 短文共 490 词，全部 content-producer 自撰（agent 定义里写着「禁止复制任何教材/DW 文本」）。全库无 `source`/`license`/`attribution` 字段。音频是 3089 个 edge-tts `de-DE-KatjaNeural` **单一女声**句级 mp3，无真人、无时间戳。
- **精听没有数据层**：`#/dictation` 从那 8 篇文章里筛 3–8 词的句子**随机抽 5 句**（`js/views/today.js:249`），不计分、不写 localStorage、不入 SRS。原设计的「盲听全文 → 逐句听写 → 对照 → 跟读」只落地了中间一步。
- **泛听不存在**：`js/views/readlisten.js:106` 三条硬编码外链，App 内零交互。
- **精读**：中文译文是整篇 `.show-zh` 开关而非逐句揭示；精读连一道理解题都没有。
- **播放器**：无 AB 复读 / 逐句循环；慢速按钮标 `0.8×`，`js/speech.js:34` 实际是 `0.65`。
- **架构债**：并存 3 套 step 循环（`lesson.js:47 runLesson` 有完整外壳；`today.js:208`、`today.js:246` 是丢掉外壳的简化复制）。

**目标**：以精听为垂直切片，跑通「真实语料 → 授权标注 → A1 筛选 → 五阶段交互 → 计分/SRS 闭环」全链路，验证满意后再复制到精读与泛听。

### 已定决策

1. **语料双轨**
   - **A 轨（可内嵌，带授权字段）**：Tatoeba（CC BY，母语者撰写审核，自带中文对照，部分有**真人录音**）、德语 Wikinews（CC BY 2.5，可整篇内嵌）。用 `DICT_ENTRIES`/`DICT_FORMS` 做**词表覆盖率筛选**解决「开源语料难度杂」。
   - **B 轨（改编）**：从中德/中英教材与 DW 提取**话题清单 / 交际功能 / 词表 / 语法点 / 听力题型**（事实层），据此**原创重写**。红线：不逐句改写受版权原文（App 是公开部署的，逐句改写属衍生作品）。
2. **Common Voice v1 不做**：德语全量数据集几十 GB + 需接受条款走邮件门，对「audio/ 已 49MB」的仓库不成立。多说话人/多口音改用 **edge-tts 多音色**（`de-DE-Katja/Conrad/Amala/Killian`、`de-AT-Ingrid`、`de-CH-Leni`），真人音频缺口由 **Tatoeba CC0/CC BY 录音**补。留 `tools/fetch_commonvoice.md` 记录 v2 方案。
3. **Tatoeba 是孤立句**，定位为**句子级听写题池 + SRS 复现源**，不拿它拼「精听包正文」——连贯语篇一律走 B 轨原创。首包必须用 B 轨验证流程。

---

## 架构方案

### 1. 数据层：`data/listening.js`（手写）+ `data/listening-audio.js`（生成物）

拆分理由：`tools/gen_audio.py:141` 是**全量重写** `data/audio-manifest.js` 的，任何塞进去的外部条目下次跑管线就没了。沿用仓库已有的 `dict-glosses.js`(手写) + `dict-core.js`(生成) 成例。

**核心字段**（`docs/schema.md` 新增 §5 同步）：

| 字段 | 说明 |
|---|---|
| `id` | **必须 `li-` 前缀**——同时是路由、`md.lessons.v1` key、SRS 命名空间段，与 `u1l1`/`sa-l1` 永不撞车 |
| `topic` / `func` / `skills` / `speakers[]` | 话题、交际功能、技能标签（喂 `recordAnswer`）、`{id,name,voice,gender,accent}` |
| **`provenance`** | **测试强制校验**。`kind: 'corpus'\|'original'\|'tts'`；`kind≠original` 必填 `license`(白名单)/`licenseUrl`/`attribution`/`originalUrl`/`retrievedAt`/`modified`+`modifiedNote`；`kind='original'` 必填 `adaptedFrom:{work,unit,borrowed[],statement}`，`borrowed` **只列事实层**（话题/功能/词表/语法/题型），`statement` 含原创重写声明 |
| `audio.mode` | `'clip'`（单文件+时间戳）\| `'sentences'`（逐句独立文件） |
| `sentences[]` | `{de, zh, sp?, note?, srcId?, srcAudio?, newLemmas?}`。`newLemmas` = 超出 A1 词表的生词，**未声明的生词测试报错** |
| `dictation` / `speakPractice` / `reproduce` | 句下标数组（`speakPractice` 故意与 `data/readings.js` 同名同义） |
| `gist` | 盲听后大意题 `{q, options[], a, explain?}`，计分 |
| `vocabRefs` | 复用 `js/recur.js:21 scoreText` 推荐引擎 |

时间戳不进手写文件，进生成物：`LISTENING_AUDIO[packId] = { mode, file, dur, seg:[[start,end],…], words?, voice, builtAt }`，`seg` 与 `sentences` 同序同长。

### 2. 句级时间戳：用 edge-tts boundary 事件，不切片不对齐

本机 **`ffmpeg`/`ffprobe` 均不存在**，任何「切片/拼接算时长」方案都要先装工具链。而 `edge_tts.Communicate(text, voice, boundary="WordBoundary").stream()` 直接产出 `{type, offset, duration, text}`（100ns 刻度）——**服务端真值，不是估算**，顺带白得逐词跟随高亮。

- `mode:'clip'`（单音色包，主路径）：整段一次合成，按每句 token 数消费 word 事件切出 `seg[i]`，同时比对事件 `text` 与期望 token，不一致即报警并整包降级。
- `mode:'sentences'`（多音色包、Tatoeba 真人句，**兜底路径，先实现**）：逐句独立文件，不需要时间戳。

AB 复读只有在单文件里才能跨句自由取段，所以主推 `clip`；但两种 mode **对外 API 完全一致**。

### 3. 语料管线（`tools/`，下载物落 `tools/corpus-cache/` 并 gitignore）

- **`tools/fetch_tatoeba.mjs`**：下载 `downloads.tatoeba.org/exports/per_language/deu/` 的句子表 + `deu-cmn_links`（白拿中文对照）+ `sentences_with_audio.csv`（逐条录音授权）。**法务硬门**：只接受 `CC0`/`CC BY` 的录音，其余不下载。首次运行打印实际目录清单（Tatoeba 改过导出布局）。
- **`tools/fetch_wikinews.mjs`**：MediaWiki API（`generator=categorymembers` + `explaintext` + `inprop=url`），记 `originalUrl`/`retrievedAt`。真实新闻普遍高于 A1，需人工缩写 → `modified:true` + `modifiedNote`。
- **`tools/filter_a1.mjs`**：复用 `DICT_FORMS`（变位/变格→lemma 反查，小写键）+ `DICT_ENTRIES`（926 lemma）算覆盖率。CLI flag：`--min-coverage`(0.92) `--max-unknown`(1) `--min/max-words`(4/14) `--require-zh` `--require-audio` `--reject-grammar`(内置 A1 外语法正则：`obwohl|während|nachdem|damit|falls|sobald|welcher|dessen|deren`、被动、非 sein/haben/情态的 Präteritum)。数字与专名白名单计为已知。去重：SHA1 精确 + token 多重集 Jaccard≥0.8 近重复（倒排索引，避免 O(n²)）。**产出候选池 JSON，不自动生成 pack**——pack 需要话题/语序/题目，那是 content-producer 的活。

**音频并存**（不破坏现有 3089 条）：新增 `audio/listening/` 子目录 + `tools/gen_listening_audio.py`。已核对 `gen_audio.py:43 existing_file()` 与 `os.listdir` 均**非递归** → 子目录对现有管线完全透明。`gen_listening_audio.py` 先读 `audio-manifest.js`，默认音色且已存在的句子直接复用 `audio/<hash>.mp3`，零字节重复。文件名带内容哈希 `li-b01-<sha1(voice+全文)前8>.mp3` 保证幂等，避免 git 每次翻倍。
`tools/extract_texts.mjs` 补一段收 `LISTENING_PACKS[].sentences[].de`，保证查词弹窗/慢速单句/SRS 复现永远有 Katja 兜底。

### 4. 播放器基建：`js/listening-player.js`（新）

```js
export function createPackPlayer(pack, audio)
// → { play, pause, stop, playAll, playSentence(i,{loop}), playRange(a,b,{loop}),
//     setRate, seekSentence, current(), on/off('sentence'|'time'|'end'|'state'), destroy }
export function renderListenBar(host, ctl, { sentences, showText })
// ▶/⏸ · ⟲5s · 速率 chip(0.6/0.75/1.0) · A/B 标记 · 🔁逐句循环 · 句列表跟随高亮
```
内部 `clipBackend` / `sentencesBackend` 共用同一 UI。

**`js/speech.js` 三处小改**（都在现有 singleton 上）：
1. `export const SLOW_RATE = 0.75; export const RATE_STEPS = [0.6, 0.75, 1];`，`speech.js:34` 的硬编码 `0.65` 改用常量 —— **标签与实际永久绑定，不可能再漂**。
2. `export function acquirePlayer(file)`：内部 `stopSpeak()` 后返回新 Audio。精听控制器必须走它，这样 `lesson.js:92 showStep()` 和 `app.js:159 route()` 里**已有的** `stopSpeak()` 自动掐掉精听音频，无需新增清理逻辑。
3. `export function resolveFile(text)`：暴露 manifest 命中的文件名。

⚠️ `stopSpeak()`（speech.js:104）只清 `player.onended` → 控制器一律用 `addEventListener('ended', …)`，否则外部 stop 会误删回调。

**`js/ui.js:92 audioBtn`**：标签改用导入的 `SLOW_RATE`；支持 `audioBtn(textOrFn, opts)`，函数则调用它而非 `speak()`。这样精听可把「播这句的真实音频片段」注入既有渲染器，**不需要给 exercises 引入新数据字段**。
**`js/exercises.js`** 每个渲染器开头加 `const play = item.play || (o => speak(answer, o));`，涉及 `renderChoice`(66)/`renderAssemble`(99)/`renderSpeak`(259)/`renderDictation`(288)/`renderReproduce`(435)，约 8 行。
`ui.js:106 speakPractice` 的 `targetText` **保持字符串**（Azure 评测参考文本，红线模块输入），只加可选 `{play}`。

### 5. 五阶段流程：复用 `runLesson`，**不写第 4 套循环**

已验证 `runLesson` 能承载：`lesson.js:100` 按 `EXERCISE_TYPES` 分派，`DISPLAY_TYPES`（`lesson.js:11`，含 `scene`/`roleplay`）在 `onSubmit` 里直接推进不计分——「盲听全文」语义上就是 display step。

| 阻塞点 | 改法 | 量 |
|---|---|---|
| `lesson.js:48` 硬调 `findLesson(lessonId)`，只认 course.js | `typeof arg === 'string' ? findLesson(arg) : arg` | 2 行 |
| 新阶段被当 infoStep | `EXERCISE_TYPES`/`DISPLAY_TYPES` 各加 `listenFull`/`listenReview` | 2 行 |
| `lesson.js:7` 静态 import `data/course.js`(500KB) 会被精听路由拖进来 | **抽 `js/lesson-shell.js`**：`runLesson` 逐字迁移、去 course 依赖；`js/views/lesson.js` 留薄壳并 `export { runLesson }` 回去 → 现有调用点零改动 | 移动 |

外壳能力全部白拿：进度条、x/y 计数、XP 头、答错重排队(`lesson.js:121`)、断点续学(`getLessonState/setLessonState`)、结算页、`recordAnswer` 技能回写。

`js/views/listening.js` 的 `buildListeningSteps(pack, ctl, results)` 合成伪 lesson 喂 `runLesson`：
1. `listenFull`（display，**不自动播放**——iOS autoplay 门槛）→ 2. `choice` 大意题（计分）→ 3. `dictation` × N（复用全套：ä/ö/ü/ß 字符条 + 词级 diff + 「改用词块」退路，`play` 注入真实片段）→ 4. `listenReview`（display，逐句对照、错句词级标色 + AB 复读重听）→ 5. `speak` 跟读评分 + `reproduce` 复述。

**新增题型仅 2 个**（`renderListenFull`/`renderListenReview`），其余 100% 复用。

**路由**：`js/app.js` 加 `/^\/listening$/` 与 `/^\/listening\/(.+)$/`（tab `readlisten`，动态 import）；`readlisten.js:96` 那张 `is-disabled` 占位卡换成真列表；切片验证通过后**删除 `#/dictation` 与 `runDictationSet`**，消灭第 3 套循环。

### 6. 计分与 SRS 闭环

**必须新开 `l:` 命名空间，不能沿用 `m:`**：`today.js:220 runMistakeDrill` 拿 `m:` id 走 `mistakeRef` → `findLesson(lessonId)`，精听包 id 在 course.js 查不到 → `today.js:223` 会**静默判为已掌握并踢出池**，听错的句子人间蒸发。

- `js/mastery.js` 新增 `addListenMiss(packId,i)` / `dueListenMisses()` / `listenRef(id)`（id 形如 `l:li-b01:5`，与 `addMistake` 同形；`rateMistake` 是 namespace-agnostic 的可原样复用）。已核对 `dueMistakes` 过滤 `startsWith('m:')`、`srs.buildQueue` 只吃传入 ids，互不污染。
- `lesson.js:119` 加逃生口：`(lesson.onMistake || addMistake)(lessonId, stepIdx, step)` —— **1 行，默认行为不变**。否则会产出无法解析的 `m:li-b01:5`。
- 复现不写新循环：`runListenReview(host, ids)` 把 due 的 `l:` 组装成伪 lesson 再喂 `runLesson`，接进 `today.js` 每日队列（替换 `runDictationSet` 的位置，`PLANS.dictation` 字段语义不变）。
- **进度用 `md.lessons.v1`，不要 `md.progress.v1`**：后者是 v1 遗留键，`markDone` 会**再次** `logActivity({completionId:'listening:'+id})`，而 `runLesson.finish()` 已用 `'lesson:'+id` 记过 → 首次完成 **+10 XP 领两遍**。`nextCatalogLesson` 只遍历 `COURSE_CATALOG`，多出的 `li-*` 键被忽略，无副作用。
- XP 用 `finish()` 现成口径，零改动。12 句包 ≈ 26 XP + 首次 10 XP ≈ 1.5 节微步课。

---

## 落地批次（按 5 小时会话切分）

**切分铁律**：每个会话**必须以「可提交 + 可部署 + `npm test` 全绿」结束**——被 Pro 限额打断时，工作区永远处于健康状态，不留半成品。每会话末尾固定动作：升 `?v=` → `npm test` → commit → push → 更新 checkpoint。
每个会话内部标了**中断安全点**：如果时间不够，停在这里也能提交。

### S0 · 准备（本轮立即交付，不写代码）
| 产出 | 说明 |
|---|---|
| `docs/textbook-extraction-guide.md` | **Codex 用的教材知识提取指导文件**（详见下节） |
| `docs/listening-slice-plan.md` | 本方案落盘进仓库（脱离 `~/.claude/plans/`，让 subagent 能读） |
| 更新 checkpoint | `~/.claude/checkpoints/2026-07-25-listening-slice.md` |

### S1 · 播放器基建 + 外壳抽取（原 B1+B2）
**为什么放一起**：都是纯引擎改造，零内容生产，且**不改变任何现有行为**（唯一可见变化是慢速按钮标签变诚实）。

- `js/speech.js`：`SLOW_RATE`/`RATE_STEPS` 常量化 + `acquirePlayer()` + `resolveFile()`，修掉 `0.65` 硬编码
- `js/ui.js:92 audioBtn`：标签绑定 `SLOW_RATE`；支持传函数
- `js/listening-player.js`（新，最大件 ≈400 行）：`clipBackend` / `sentencesBackend` + `createPackPlayer` + `renderListenBar`
- `css/style.css`：`.listen-bar` 等
- ⏸ **中断安全点**：以上完成即可提交（新模块无人引用，零风险）
- `js/lesson-shell.js`：`runLesson` 逐字迁移；`views/lesson.js` 留薄壳；lesson 对象入参 + 2 类型入 Set + `onMistake` 钩子（共 5 行）
- 顺手修 `exercises.js` 导入版本号三处不一致

**验收**：`npm test` 61→64（新增 `tests/listening-player.test.mjs` 纯算法：句范围解析 / AB 边界 / 速率合法性）；真机**旧页面回归**——阅读页、词卡、课程 speak 步的慢速按钮显示 `0.75×` 且听感相符；随便跑一节微步课，进度条 / 答错重排队 / 退出续学 / 结算页四项无变化。

### S2 · 数据层 + 音频管线 + 首包（原 B3）
- `data/listening.js` schema 定稿 + `docs/schema.md` §5
- `tools/gen_listening_audio.py`：**先实现 `mode:'sentences'` 兜底路径**，再实现 `clip` + WordBoundary 时间戳（顺序不能反）
- ⏸ **中断安全点**：`sentences` 模式跑通即可提交
- `data/listening-audio.js` 生成 + `extract_texts.mjs` 补段
- 首包 `li-b01`（12 句，B 轨原创，单音色）— content-producer 写内容
- `tests/listening-data.test.mjs`：授权字段完整性 + license 白名单 + 下标越界 + `newLemmas` 声明

**验收**：生成脚本打印句数与 `seg` 校验通过；**`git status` 确认 `data/audio-manifest.js` 零 diff**；`npm test` 不下降。

### S3 · 五阶段 UI（原 B4）—— 最大最核心，独占一个会话
- `js/exercises.js`：`renderListenFull` / `renderListenReview` 两个新渲染器 + 5 处 `item.play` 注入
- ⏸ **中断安全点**：两个渲染器 + 注入完成即可提交（未接路由，不影响线上）
- `js/views/listening.js`：`buildListeningSteps` + `renderListeningRoute` + 列表页
- `js/app.js` 两条路由；`readlisten.js:96` 占位卡换真列表

**验收（真机核心）**：`#/listening/li-b01` 跑通盲听 → 大意 → 听写 → 对照 → 跟读 → 复述；AB 复读 / 逐句循环 / 三档速率 / 跟随高亮逐项确认；中途退出再进能续学。

### S4 · 计分闭环 + 清理旧循环（原 B5）
- `js/mastery.js`：`addListenMiss` / `dueListenMisses` / `listenRef`（`l:` 命名空间）
- `runListenReview` + `today.js` 每日队列接入
- ⏸ **中断安全点**：以上完成即可提交
- 删除 `runDictationSet`（`today.js:246-281`）与 `#/dictation` 路由，三套循环收敛成两套

**验收**：故意错 3 句 → localStorage 出现 3 条 `l:li-b01:*` → 次日「今日」出现精听巩固 → 做对后 due 后延；XP 与首次完成各只加一次（**重点查不要 +10 领两遍**）。

### S5 · 语料管线 + A 轨首包（原 B6+B7）
- `tools/fetch_tatoeba.mjs` + `tools/filter_a1.mjs` + `.gitignore` 加 `tools/corpus-cache/`
- ⏸ **中断安全点**：候选池能产出即可提交
- `tools/fetch_tatoeba_audio.mjs`（法务硬门：只收 CC0/CC BY）+ `tools/fetch_wikinews.mjs` + `tools/fetch_commonvoice.md`
- Tatoeba 真人音频**句子池** + 1 个 Wikinews 改编包

**验收**：人工抽查 30 条候选；**打印阈值-留存条数曲线**（0.85/0.90/0.92/0.95 各留多少条）——把「筛完剩多少」变成一次性实测，据此定默认阈值；真机听 5 条真人录音音量/采样一致。

### S6+ · 复制到精读与泛听（原 B8，另开切片）
复用 `lesson-shell` + `listening-player`，精读改逐句揭示、泛听落地。**等 S1–S5 真机验收满意后再启动**，届时重新规划。

---

## 验证与门槛

每批提交前：
```
node tools/extract_texts.mjs > /dev/null    # 数据文件语法自检
python3 tools/gen_listening_audio.py        # 仅当动了 data/listening.js
npm test                                    # 现 61/61，不得下降
git status                                  # 确认 data/audio-manifest.js 零 diff
```

**`?v=` 同步**（已全量 grep）：`css/style.css` → `index.html:19` v12→13；`js/app.js` → `index.html:31` v13→14；`js/views/*` → `app.js:2,5,58` v9→10。
⚠️ **顺手修一个既有 bug**：`exercises.js` 的导入版本号三处不一致 —— `views/lesson.js:4` `?v=2`、`views/today.js:25` `?v=3`、`views/vocab.js:7` `?v=2`，浏览器里同时存在两份 exercises 模块实例。统一升到 `?v=4`。
无 Service Worker（已确认），未版本化模块的陈旧窗口只受 Pages `max-age=600` 约束（≤10 分钟）。

**红线复核**：不触碰 `pronunciation-assessment.js`、`azure-speech-sdk.js`、`secrets.js`、`worker/`；`dict-core.js`/`audio-manifest.js`/`content-index.js` 只读不写。

---

## 风险

1. **Tatoeba 拼不出语篇**（最可能翻车）：孤立句硬拼成「文章」会前言不搭后语，一听就穿帮。→ 已定位为句池 + SRS 源；B3 首包必须 B 轨。
2. **CC BY 署名义务靠人记必漏** → 转成测试门槛（`tests/listening-data.test.mjs` 断言授权字段完整性 + license 白名单），UI 每包固定渲染授权行，抓取脚本硬拒绝非 CC0/CC BY 录音。
3. **iOS 音频坑（无调试工具，只能一次过）**：长音频绝不自动播；`currentTime` 须等 `loadedmetadata`；`timeupdate` 仅 ~4Hz，AB 循环尾巴溢出 ≤250ms → **仅在循环激活时**开 rAF 轮询，停止即 `cancelAnimationFrame`（刚修完导航卡顿，不留常驻 rAF）。
4. **git 膨胀**：单个 45s 包 ≈ 270KB，30 包 ≈ 8MB 可控；真风险是重跑脚本产出字节不同的同名文件 → 文件名带内容哈希 + 幂等跳过，语料缓存全 gitignore。
5. **A1 筛完剩多少未知** → B6 强制输出阈值-留存曲线；若 0.92 留存 <500 条，降到 0.88 并收紧 `--max-unknown` + 强制 `newLemmas` 声明。
6. **boundary 事件与我们的句子切分对不齐**（TTS 按标点断句，`Guten Tag! Was möchten Sie?` 会被切成 2 句）→ 用 `WordBoundary` 按 token 数消费 + 逐个比对事件 `text`，不匹配整包降级 `mode:'sentences'`。**降级路径先于主路径实现**。
7. **慢速 0.65→0.75 是产品改动不只是改标签**：0.65 在 24kHz/48kbps 上明显糊，A1 慢速通行值 0.7–0.8。默认取 0.75，速率 chip 保留 0.6 档，B1 交付时真机 A/B 一次。

---

## 需要你提供

**教材素材（B 轨原创重写的骨架来源）** —— 要的是**事实层那几页**，不是课文正文：
- 目录页（话题序列 + 每课交际功能）
- 每课词表页
- 语法总览 / 进度表
- 听力任务单 / 题型说明页

提取工作交给 Codex，规则见 **`docs/textbook-extraction-guide.md`**（S0 已交付）：白名单/黑名单、判定原则、输出 schema、提交前自检清单。产出 `data/syllabus-ref.json`（纯事实层，入库），供 content-producer 按真实教材的话题-功能-词表-语法顺序**原创重写**，既贴教学法又不碰版权。

给 Codex 的话直接说：「读 `docs/textbook-extraction-guide.md`，按它处理 `<教材 PDF 路径>` 的第 X–Y 页」。
