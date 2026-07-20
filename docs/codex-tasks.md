# Codex 任务清单（2026-07-20 移交）

> 本文档是 Codex 的唯一任务来源，自包含、可直接执行。另有独立任务：安卓发音判定问题见 `docs/known-issues.md`（不变）。
> 完成任一任务后跑完「验收流程」一节再提交。

## 背景与当前基线

Mein Deutsch：纯静态德语学习 PWA（GitHub Pages），无构建步骤，ES Modules 直接跑。当前 main 基线：

- `data/vocab.js`：**267 条**词条（w001-w267，id 按数组位置生成）。近期已全量补齐：顶层 `pos`（非名词）、`pl`/`noPl`（名词）、`forms` 动词变位（六人称+perfekt，sein/haben/werden/情态动词带 praeteritum）、`valence` 22 条、`phrases` 53 词 60 条。字段规范见 `docs/schema.md` 第 2 节。
- `tools/wortliste.json`：歌德 A1 词表 849 条 `{lemma, pos, article, plural}`（plural 全为 null，复数唯一来源是 VOCAB.pl）。
- `tests/vocab-data.test.mjs`：强制校验词条数据规范（id 连续、名词 pl‖noPl、非名词 pos、动词 forms 等），`npm test` 必须全绿。
- 音频管线：`node tools/extract_texts.mjs` 提取全部待读德语文本 → `python3 tools/gen_audio.py` 增量生成 `audio/*.mp3` 并重写 `data/audio-manifest.js`（勿手改）。`js/speech.js` 的 `speak()` 命中 manifest 播文件，未命中退设备 TTS。

## 红线（所有任务通用）

1. **勿碰 Azure 发音评分链路**：`js/pronunciation-assessment.js`、`js/azure-speech-sdk.js`、`js/secrets.js`、`worker/` 及其密钥配置。口语题型只复用 `speakPractice()`（js/ui.js）/`micBtn()`。
2. **`data/vocab.js` 新词条只能追加数组末尾**，绝不中插（id 按位置生成，中插会位移后续 id、破坏 SRS 存档）。
3. 德语文本改动后必跑 `extract_texts.mjs` + `gen_audio.py`；提交前 `npm test` 全绿。
4. `data/audio-manifest.js`、`data/dict-core.js`（任务 1 产物）是生成文件，勿手改。

---

## 任务 1：全局查词 + 生词本 + 记忆增强 + 词卡跟读

### P1 词典引擎

- **新建 `tools/gen_dict.mjs`**：读 wortliste.json + vocab.js(pl/de) + dict-glosses.js(补充 pl + 打印缺失清单)。内嵌手工表：~30 个 A1 不规则动词现在时全变位（sein/haben/werden/情态/fahren/sprechen/essen/lesen/sehen/nehmen/geben/helfen/schlafen/laufen/tragen/waschen/treffen/vergessen/halten/lassen/tun/anfangen/einladen 等；**vocab.js 里 48 个动词已带 forms 字段，可直接读取复用**）+ 冠词/物主代词全词尾表。规则生成：规则动词六人称变位（词干 t/d→-est/-et、s/ß/z/x→du 只加 -t、-eln 收缩）、名词复数（VOCAB.pl+glosses.pl）、形容词 e/en/er/es/em 词尾。输出 `data/dict-core.js`（`DICT_ENTRIES` 词条骨架 {pos, art} + `DICT_FORMS` 小写词形→lemma，一形多解为数组 + `DICT_POS`）+ stdout 打印缺释义清单/forms 冲突表。
- **新建 `js/dict.js`**：
  - `lookup(raw)`：去标点→lemma 精确（原样/首字母大写/全小写）→DICT_FORMS→启发式去词尾（e/en/n/st/t/er/es/em/s）→[]。最多 2 候选，句中大写 token 优先名词。VOCAB 的 zh/senses 运行时合并覆盖（vocab 为单一事实源，多词短语也可查）。
  - `showDictPop(word, {entry, sentence, source})`：弹窗复用 `.gloss-pop` 基类（保住 app.js 路由清理）+`.dict-pop` 修饰。内容：冠词着色 lemma+复数+pos+zh；动作：🔊 speak、「➕ 加入生词本」（VOCAB 词显示已收录禁用）、DWDS 外链（查不到时为主按钮）。✕/外点/10s 关闭。
  - `enableGloss(rootEl, {glossary, sentenceSelector})`：事件委托 + caretRangeFromPoint/caretPositionFromPoint（不分词重渲染）；`closest('button,a,input,textarea,select,[data-no-gloss]')` 直接忽略→不干扰 choice/audioBtn/assemble/dictation；语境句从 sentenceSelector 捕获。两 API 皆无则静默降级。
- **js/reading.js**：保留分词+高亮，删本地 showGloss，tok 点击改调 showDictPop（per-article glossary 优先、全局兜底）。

### P2 生词本

- **js/storage.js**：KEYS 加 `wordbook: 'md.wordbook.v1'`（exportAll/importAll/Gist 同步自动生效）；`getWordbook()/addWordEntry(entry)/removeWordEntry(id)`（后者连删 md.srs.v1 同 id 记录）。条目：`{ 'd:Abfahrt': { lemma, zh, art, pl, pos, sentence, source, addedAt } }`。id `d:` 命名空间与 w*/m:* 不冲突。
- **js/views/vocab.js 合流**：`buildQueue([...wordbookIds(), ...VOCAB ids])`（生词优先学）；`getWord(id)` 按前缀分发 wordbookModel/wordModel；概览页统计并入 + 「📒 生词本」入口；新增 `renderWordbook` 子页（#/vocab/wordbook，列表+删除）；today.js 统计同口径。

### P3 记忆增强

- **队列**（js/views/vocab.js runVocabSession）：cards → 新词 tests → due tests → 新词第二轮 tests。applyRate 的 rated 集语义已核实：二轮答对不重复计分、答错 again 穿透生效。
- **题型分发**（showTest 顶部）：`hearable = manifest 命中 || germanVoices()>0` 守卫；retry→de2zh；second→listen/zh2de；新词首测→de2zh（现状）；复习按 `reps % 3` 轮换 listen→zh2de→spell（5 分钟档 quickForms:true 禁 spell）。
  - `zh2de`：镜像四选一（中文题干+4 德语词按钮，答后朗读；保留 peek），干扰项同主题优先。
  - `listen`：renderExercise `{type:'listenChoice', audioText:m.spoken, options:[zh×4], a}`。
  - `spell`：renderExercise `{type:'dictation', audioText:m.spoken, answer:m.spoken, mode:'type'}`（答案含冠词，顺带记词性）。
  - 适配器：onSubmit ok→applyRate good；错→again+push retry。listen/spell 无 peek。
- **continueBar**：加 `${m.mnemonic ? '🧩 助记行' : ''}`（现 146 词有助记，全题型可见）。
- **js/srs.js rate() 学习阶梯**：`LEARN_STEPS=[10min, 1天, 3天]`；again→step 归零 due+10min；new/learn 且 good/hard→爬一级（hard 额外 ease-0.15），3 天档发出即毕业 review/ivl=3；easy 直接毕业 3 天；review 分支一字不改。存量卡兼容：learn 卡无 step 字段 `?? 0` 从头爬；markKnown 不动。

### P4 词卡跟读

- showCard `.wc-head` 后插 `<div class="wc-speak">`，`micBtn(m.spoken, speakHost)` 点击原地展开 speakPractice。评分链路零改动。

### 其他

- **tools/extract_texts.mjs**：追加 DICT_ENTRIES 全部 lemma 朗读形（art+lemma），生词本词卡/听力题有真人音频（~+600 条短 MP3）。
- **css**：.dict-pop/.feedback-mnemonic/.wc-speak/生词本列表 ~40 行。
- **docs/schema.md**：附录 dict-glosses 格式 + gen_dict 重跑时机（改 vocab.js de/pl/forms 或词表后必重跑）。
- **新增测试**：tests/srs.test.mjs（阶梯断言含存量兼容）、tests/dict.test.mjs（lookup 链：fährt→fahren、bist→sein、gute→gut、brüder→Bruder、Hallo、乱词→[]）。

## 任务 2：`data/dict-glosses.js` 中文释义（手写内容）

覆盖范围：wortliste.json 中**不精确等于任何 VOCAB.de** 且 pos∉{Symbol, Affix} 的全部词（原估 628，VOCAB 扩到 267 后约 616——以 `node tools/gen_dict.mjs` 打印的精确清单为准，先做 P1 拿清单）。

格式契约：

```js
export const DICT_GLOSSES = {
  'Abend': '晚上；傍晚',
  'Bahn': { zh: '铁路；城铁', pl: 'Bahnen' },   // 有把握的名词顺带补复数
};
```

- 键 = wortliste lemma **原样**（大小写、变体拆分照抄）
- 值 = 简短中文（或 {zh, pl}）；风格对齐 VOCAB.zh：短到能直接当四选一检验的干扰项，多义用「；」分隔，不写例句不写语法说明
- 释义德语理解零容错；无把握的复数宁缺勿错

## 任务 3：词卡阶段二渲染（依赖已入库的维度数据）

**排在任务 1 P3/P4 合并之后做**（同样改 js/views/vocab.js，避免自我冲突）。

- `wordModel/wordHead`（js/views/vocab.js）：非名词词头显示顶层 `pos` 徽标（w.pos 直接可用）；名词 `noPl: true` → 复数行显示「只用单数」（现在 pl 为 null 时不显示复数行，noPl 词条应显式标出）。
- `showCard` 新增两个区块：
  - `.wc-forms`：动词变位紧凑表——六人称两列三行 + Perfekt/Präteritum 一行（`w.forms` 形状：`{ich,du,er,wir,ihr,sie,perfekt?,praeteritum?}`；regnen/wehtun 只有 er，渲染时按存在的键显示）
  - `.wc-phrases`：词组列表（`w.phrases: [{de,zh}]`），每条带 🔊 speak(p.de)
- **tools/extract_texts.mjs**：VOCAB 循环里追加提取 `w.phrases[].de`（60 条现在无音频）；`forms` 的完整变位形也建议提取（ich/du/er 形至少要，供将来变位听写题用）→ 重跑 `python3 tools/gen_audio.py`。
- css ~30 行（.wc-forms 表格、.wc-phrases 行、pos 徽标、「只用单数」灰字）。
- 参考：valence 已有渲染先例（词义下方浅金色小行），新区块风格与 .wc-sentences/.wc-mnemonic 对齐。

## 验收流程（每个任务提交前）

1. `node tools/gen_dict.mjs`（任务 1/2）：缺释义清单为空、forms 冲突表核过
2. `node tools/extract_texts.mjs` 无报错 → `python3 tools/gen_audio.py` 跑完（**必须跑完再发**，否则新词条/词组无音频、listen 题被 hearable 守卫排除）
3. `npm test` 全绿（含 vocab-data.test.mjs 与新增测试套件）
4. 本地 `python3 -m http.server 8420` 抽查：阅读页点词三态（收录/变位/未收录→DWDS）、**choice 选项不弹词典**（关键回归项）、生词本闭环（加→列表→删→优先入队）、词卡变位表/词组/跟读、5 分钟档无 spell 题
5. 风险备忘：caret API Chrome 均支持（用户全设备 Chrome）；一形多解（meine/Essen）最多展示 2 候选不消歧；旧客户端 Gist 同步会抹 wordbook 字段（单用户 PWA 窗口小，known-issues.md 记一笔）；dict-core ~200KB 源码 gzip 后可接受
