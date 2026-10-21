> **已作废，仅供历史参考。** 与 [产品宪法](../product.md) 冲突时以宪法为准。

# 精听技术基线

> 本文件记录精听功能的**架构决策和理由**，不是内容生产清单。
> 内容边界、教材证据与生产门禁见 `docs/archive/a1-content-production-plan.md`；字段定义见 `docs/schema.md`。
> 两者冲突时，内容口径以生产计划为准，技术口径以本文件为准。
>
> 最近核对：2026-07-25。

## 1. 这块功能解决什么

精听最初的问题是：`#/dictation` 从阅读短文里随机抽 5 句听写，不计分、不入 SRS，
「盲听全文 → 逐句听写 → 对照 → 跟读」只落地了中间一步。
现在的形态是**五阶段完整流程 + 独立数据层 + 独立音频管线 + 错句回流 SRS**。

## 2. 数据层：手写与生成物分离

| 文件 | 性质 | 谁写 |
|---|---|---|
| `data/listening.js` | 手写 | 内容作者。包正文、说话人、题目、`dictation`/`speakPractice`/`reproduce` 句下标 |
| `data/a1-pilot-listening.js` | 手写 | A1 试点包，被 `listening.js` 合并进 `LISTENING_PACKS` |
| `data/listening-audio.js` | **生成物** | `tools/gen_listening_audio.py`。文件名、时长、句级时间戳 |

**为什么必须分开**：`tools/gen_audio.py` 是**全量重写** `data/audio-manifest.js` 的，
任何手工塞进去的外部条目下次跑管线就没了。沿用仓库已有的
`dict-glosses.js`（手写）+ `dict-core.js`（生成）成例。

时间戳不进手写文件：`LISTENING_AUDIO[packId] = { mode, key, file|files, dur, seg, voice }`，
`seg` 与 `sentences` 同序同长。`key` 是输入指纹（模式 + 音色 + 全部句子），用于幂等跳过。

## 3. 音频：两条互不相干的管线

这是最容易搞混的一点，单独说清楚。

| | `tools/gen_audio.py` | `tools/gen_listening_audio.py` |
|---|---|---|
| 服务对象 | 词卡、课程、阅读的单句发音 | 精听包 |
| 输出音频 | `audio/*.mp3`（约 3100 个） | `audio/listening/*.mp3` |
| 输出索引 | `data/audio-manifest.js`（**全量重写**） | `data/listening-audio.js` |
| 音色 | 单一 `de-DE-KatjaNeural` | 按 `speakers[].voice` 多音色 |
| 形态 | 逐句独立文件 | `sentences` 逐句 / `clip` 整段 + 时间戳 |

**两者的唯一交集是复用**：精听包里凡是用默认 Katja 音色、且主库已经生成过的句子，
`gen_listening_audio.py` 直接引用 `audio/<hash>.mp3`，不重复生成。
所以 `LISTENING_AUDIO` 的 `files` 数组里会混着 `listening/xxx.mp3` 和裸 `xxx.mp3` 两种路径——这是正常的。

已核对 `gen_audio.py` 的 `existing_file()` 与 `os.listdir` 均**非递归**，
所以 `audio/listening/` 子目录对旧管线完全透明，不会被它清理或覆盖。

反向的兜底：`tools/extract_texts.mjs` 会收集 `LISTENING_PACKS[].sentences[].de`，
保证每句德语在主库都有 Katja 兜底音频——查词弹窗、慢速单句、SRS 复现要用。

### 3.1 句级时间戳：用 TTS 的 WordBoundary，不切片不对齐

本机没有 `ffmpeg`/`ffprobe`，任何「切片 / 拼接算时长」方案都要先装工具链。
`edge_tts.Communicate(text, voice, boundary='WordBoundary')` 直接产出
`{type, offset, duration, text}`（100ns 刻度）——**服务端真值，不是估算**，顺带白得逐词高亮。

- `clip`：整段一次合成，按每句 token 数消费 word 事件切出 `seg[i]`，
  同时比对事件 `text` 与期望 token，不一致即整包降级 `sentences`。
- `sentences`：逐句独立文件，不需要时间戳。多说话人包只能走这条。

AB 复读只有在单文件里才能跨句自由取段，所以单音色包优先 `clip`；
但两种 mode 对外 API 完全一致，播放器内部 `clipBackend`/`sentencesBackend` 共用同一 UI。

`li-b02` 已用 `clip` 模式跑通，WordBoundary 路径是生产验证过的。

### 3.2 常用命令

```bash
python3 tools/gen_listening_audio.py                   # 增量，只处理指纹变了的包
python3 tools/gen_listening_audio.py --force           # 全部重生成
python3 tools/gen_listening_audio.py --mode sentences  # 强制降级，验证兜底路径
```

正文改了就要重跑——`key` 指纹包含全部句子，改一个字就会重新合成那个包。
生成后必须把该包的 `audioStatus` 改成 `ready`（或删掉该字段），
否则 `tests/listening-data.test.mjs` 会报「已有音频，应把 audioStatus 改为 ready」。

## 4. 播放器与速率

- `js/listening-player.js`：`createPackPlayer(pack, audio)` + `renderListenBar(host, ctl, opts)`。
- `js/audio-timing.js`：`SLOW_RATE = 0.75`、`RATE_STEPS`、`normalizeRate`、`nextRate`。
  单独成模块是因为 `speech.js` 顶层要摸 `window`，Node 测试进不去；纯函数才能单测。
- **慢速档只有这一个真相源**。历史上按钮标 `0.8×` 实际跑 `0.65`，标签与实际各自漂了很久。
  UI 标签一律从 `SLOW_RATE` 取。

两个必须遵守的约定：

1. 精听控制器一律用 `acquirePlayer(file)` 拿播放器。它内部先 `stopSpeak()`，
   这样 `lesson-shell` 切步和 `app.js` 换路由里**已有的** `stopSpeak()` 会自动掐掉精听音频，不需要新增清理逻辑。
2. `stopSpeak()` 只清 `player.onended`，所以控制器一律用 `addEventListener('ended', …)`——
   用 `onended` 会被外部 stop 误删。

## 5. 五阶段流程：复用课程外壳

`js/lesson-shell.js` 是从 `views/lesson.js` 抽出来的通用步骤外壳（去掉了 `data/course.js` 依赖，
否则精听路由会被 500KB 的 course.js 拖进来）。`views/lesson.js` 留薄壳并 `export { runLesson }`，现有调用点零改动。

`js/views/listening.js` 的 `buildListeningLesson(pack)` 合成一个伪 lesson 喂给外壳：

1. `listenFull`（display 步，**不自动播放**——iOS autoplay 门槛）
2. `choice` 大意题（计分）
3. `dictation` × N（复用全套：字符条 + 词级 diff + 词块退路，`audioPlay` 注入真实片段）
4. `listenReview`（display 步，逐句对照 + AB 复读）
5. `reproduce` 复述

外壳能力全部白拿：进度条、答错重排队、断点续学、结算页、`recordAnswer` 技能回写。
新增题型只有 2 个（`listenFull`/`listenReview`），其余 100% 复用。

`audioBtn(textOrFn)` 支持传函数，所以精听能把「播这句的真实片段」注入既有渲染器，
不需要给 exercises 引入新数据字段。`speakPractice` 的 `targetText` **保持字符串**
（Azure 评测参考文本，红线模块输入），只加可选 `{play}`。

## 6. 错句回流：`l:` 命名空间

**不能沿用 `m:`**：`runMistakeDrill` 拿 `m:` id 走 `mistakeRef` → `findLesson(lessonId)`，
精听包 id 在 course.js 里查不到，会被**静默判为已掌握并踢出池**，听错的句子人间蒸发。

- `js/mastery.js`：`addListenMiss(packId, i)` / `dueListenMisses()` / `listenRef(id)`，id 形如 `l:li-b01:5`。
  `rateMistake` 是 namespace-agnostic 的，原样复用。
- `lesson-shell` 的逃生口：`(lesson.onMistake || addMistake)(lessonId, stepIdx, step)`，默认行为不变。
- 复现路径必须能还原**听写和复述两种**步骤。二者都带 `sentenceIndex`、都会写 `l:`，
  而它们的句下标不一定重合（`li-b01` 复述在句 8，听写是 1/3/5/7/9）。
  找不到对应步骤时必须 `rateMistake(id, true)` 出池，否则该条目永远 due，永远占着首页的「待复习」计数。
- **进度用 `md.lessons.v1`，不要 `md.progress.v1`**：后者是 v1 遗留键，`markDone` 会再记一次
  `logActivity`，而外壳的 `finish()` 已经记过 → 首次完成 +10 XP 会领两遍。

## 7. 与原计划的偏差（记录在案）

| 原计划 | 实际 | 说明 |
|---|---|---|
| 删除 `runDictationSet` 与 `#/dictation`，三套循环收敛成两套 | 都还在，且新增了 `runListenMissDrill` | 现在是**四套** step 循环：`lesson-shell` + `runMistakeDrill` + `runListenMissDrill` + `runDictationSet`。方向走反了 |
| 错句复现组装伪 lesson 喂外壳 | `runListenMissDrill` 直接调 `renderExercise` | 绕过外壳，正是「找不到步骤不出池」那个 bug 的温床 |
| `SLOW_RATE` 放 `speech.js` | 放 `js/audio-timing.js`，speech.js 再导出 | 为了可单测，是更好的选择 |
| `/^\/listening$/` 列表路由 | 没加 | 列表在读·听面板里，够用 |
| 每日队列保留 `PLANS.dictation` 语义 | 换成了 `PLANS.listenMisses` | 结果是没有精听错句时，每日流程比以前少一个环节 |
| Tatoeba / Wikinews / Common Voice | 全部未做 | 见下节 |

## 8. 仍未收口

- **四套 step 循环**。至少应把 `runListenMissDrill` 和 `runMistakeDrill` 合并——
  两者结构几乎相同，只差 id 解析和步骤查找。
- `li-p05` 请求 `clip` 但时间戳对不齐（第 4 句「platz」对上了事件「Gehen」），已自动降级 `sentences`。
  降级本身是设计内的，但这个包因此没有 AB 复读的跨句自由取段。想恢复得调整该包的断句。
- **泛听仍然只有硬编码外链**，App 内零交互。
- 精读没有复用 `listening-player`，走的是自己的 `readingRoute` 五阶段。

## 9. 已延后（不是放弃）

Tatoeba（CC BY，自带中文对照与部分真人录音）、德语 Wikinews（CC BY 2.5）、
`tools/filter_a1.mjs` 词表覆盖率筛选——**等 12 份教材驱动试点人工验收之后再评估**。

Common Voice 明确不做：德语全量数据集几十 GB + 需接受条款走邮件门，
对「audio/ 已 49MB」的仓库不成立。多说话人改用 edge-tts 多音色。

三条当时定下、现在仍然有效的判断：
1. **Tatoeba 是孤立句**，只能当句子级听写题池和 SRS 复现源，不能拿来拼精听包正文——连贯语篇一律原创。
2. **CC BY 署名义务靠人记必漏** → 转成测试门槛（`tests/listening-data.test.mjs` 断言授权字段完整性 + license 白名单）。
3. **不逐句改写受版权原文**。App 是公开部署的，逐句改写属衍生作品。只拿事实层清单，句子从零写。

## 10. 改这块代码时的检查清单

```bash
node tools/extract_texts.mjs > /dev/null    # 数据文件语法自检
python3 tools/gen_listening_audio.py        # 仅当动了 data/listening.js 或试点包
npm test                                    # 现 90/90，不得下降
node tools/audit_a1_content.mjs             # 动了 A1 内容才需要
git status                                  # 确认 data/audio-manifest.js 零 diff
```

**`?v=` 缓存版本号必须同步升**（无 Service Worker，只受 Pages `max-age=600` 约束）：
改了 `css/style.css` 升 `index.html` 的 `?v=`；改了 `js/app.js` 同理；
改了 `js/views/*` 升 `app.js` 里对应那条；**改了 `js/exercises.js` 要升它全部三个引用方**
（`lesson-shell.js`、`views/today.js`、`views/vocab.js`）——历史上这三处漂成过不同版本号，
浏览器里同时存在两份 exercises 模块实例。

**红线**：不触碰 `pronunciation-assessment.js`、`azure-speech-sdk.js`、`secrets.js`、`worker/`；
`dict-core.js`、`audio-manifest.js`、`content-index.js` 只读不写（都是生成物，改生成器）。

## 11. iOS 音频约束

无调试工具，只能一次过，三条硬约束：

1. 长音频**绝不自动播放**。
2. `currentTime` 必须等 `loadedmetadata` 之后再设。
3. `timeupdate` 只有约 4Hz，AB 循环尾巴会溢出 ≤250ms →
   **仅在循环激活时**开 rAF 轮询，停止立刻 `cancelAnimationFrame`，不留常驻 rAF。
