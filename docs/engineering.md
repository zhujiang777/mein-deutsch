# 工程说明：代码在哪、怎么预览、怎么发布

给接手开发的人（或模型）看。产品是什么见 [产品宪法](product.md)；内容怎么写见 [怎么写一篇课文课](course-authoring.md)；字段见 [schema](schema.md)。

## 现状（2026-11-16）

- 纯静态网页，原生 ES Modules，没有构建步骤。部署在 GitHub Pages（`main` 分支根目录），根地址跳到 `heft/`。
- 线上：第 0–7 课、第 1–2 单元总表和小测。进度表共 30 课。
- 学习进度只存在这台手机的浏览器里（`localStorage` 的 `md.heft.v1`），清缓存就没了。
- 发音评分走 `worker/`（Cloudflare Worker → Azure Speech）。评分连不上时自动退回“听原声 / 听我的”，不卡课。目前卡在作者的 Azure 账户上，等他那边恢复。

## 文件地图

| 位置 | 做什么 |
|---|---|
| `data/story-lessons.js` | 全部课程内容：角色、每一课、词卡的搭配例句、单元总表和小测、要录音的清单 |
| `data/vocab.js` | 词库（复数、词性等），课里的重点词用 `id` 引用 |
| `heft/index.html` | 入口。里面的 `?v=N` 是缓存版本号 |
| `heft/js/flow.js` | 把一课排成一屏一屏的步骤（含两天课怎么切、手帐页的数据） |
| `heft/js/store.js` | 学习进度：今天该学什么、复习排期、学习日志 |
| `heft/js/app.js` | 路由、首页、「我的」、学习记录 |
| `heft/js/screens.js`、`screens2.js` | 每一种屏怎么画（`RENDER[type]`）、每一种题怎么做（`EX[type]`） |
| `heft/js/album.js` | 「手帐」页 |
| `heft/js/art.js`、`art-lessons.js`、`sprites*.js`、`mouth-sprites.js` | 头像、贴纸、封面场景、图标、口型图（见 `docs/design.md`） |
| `heft/js/audio.js` | 播放录音、音效 |
| `heft/css/` | `tokens.css`、`ds.css` 是设计系统拷贝；`heft.css` 是应用自己的 |
| `js/` | 录音和发音评分（应用共用） |
| `audio/story/` | 录音文件和清单 `manifest.json` |
| `tools/voice-script.mjs`、`tools/gen_story_audio.py` | 生成配音清单、批量录音 |
| `tests/` | `npm test`。`story-lesson.test.mjs` 查内容硬规则，`heft.test.mjs` 查流程和进度 |
| `lab/` | 原型、草稿、设计记录。**不进仓库** |

## 本机预览

```bash
python3 -m http.server 8423 --bind 127.0.0.1
```

打开 `http://localhost:8423/heft/`。直接跳到某一屏：

| 地址 | 去哪 |
|---|---|
| `#/lesson/sl-05/12` | 第 5 课的第 12 步（两天课按当前进度是第 1 天还是第 2 天来数） |
| `#/quiz/unit-2/0` | 第 2 单元总表和小测的第 0 步 |
| `#/review`、`#/heft`、`#/me`、`#/log` | 复习、手帐、我的、学习记录 |

预览时容易上当的三件事：

- **缓存**：改了文件，浏览器还在用旧的。先对改过的文件 `fetch(文件, { cache: 'reload' })`（带 `?v=N` 的要连参数一起），再刷新。
- **动画被冻住**：预览面板里动画和过渡会停在半路，截图看着像坏了。先 `document.getAnimations().forEach(a => a.finish())`，或者直接读页面状态来核对。
- **评分和麦克风**在本机测不了，评分服务只认线上地址。

要造一份学习进度来看后面的课：在页面里 `import('./js/store.js')`，用 `completeLesson` / `completeDay1` / `completeQuiz` 往前推，再 `save`。清空用 `localStorage.removeItem('md.heft.v1')`。

## 发布步骤

**提交和推送都要作者明确说了才做。** 每次推送前都问。

1. `npm test` 全绿。
2. 改过 `heft/` 下的 js 或 css：把 `heft/index.html` 里所有 `?v=N` 一起加 1。
3. 提交（提交说明用中文，说清对学习的人来说变了什么）。
4. 推到 `main`，等 Pages 发布完：
   ```bash
   gh api repos/zhujiang777/mein-deutsch/pages/builds/latest --jq '.status+" "+.commit'
   ```
   出现 `built <这次的提交号>` 才算发完。
5. 用 `curl` 核对线上：入口里的版本号、这次改动的一个特征字符串、一条新录音能取到。
6. 告诉作者上线了什么、哪些没验证（新录音没人听过、动作手感、没整课走完的部分），请他在手机上看。

## 录音

- 一人一声，声音名字写在 `data/story-lessons.js` 的 `STORY_CAST`；念单词用 `WORD_VOICE` 那个角色的声音。
- 改了任何要念的德语：`node tools/voice-script.mjs`，再 `python3 tools/gen_story_audio.py`（只补缺的；`--dry` 先看条数和额度，`--redo <id>` 重录一条，`--role <角色>` 重录一个角色）。
- **密钥只在本机的一个文件里，不进仓库，也不出现在对话里。** 评分服务的访问码和 Azure 的密钥同样只由作者自己填。
- 新角色的声音从作者声音库里现成的德语声音里挑，名字要和库里一致。

## 改代码时的规矩

- 课怎么上（步骤的顺序、两天怎么切）是产品宪法定的，不自己改；要改先问作者，并改宪法。
- 加一种新题型或新屏，等于改“一课的结构”，同样先问作者。
- 新字段要同时写进 `docs/schema.md`，新的硬规则尽量写成测试。
- 改已有的画法、样式，先在本机按手机宽度看；作者点名哪里就只改哪里。
- 分段做：每一段都能独立收尾（测试全绿、能提交、能上线），不要留半截。

## 已知没做完的

| 事 | 状态 |
|---|---|
| 发音评分 | 等作者的 Azure 账户恢复后重测 |
| 动效手感（封面翻开、翻页、拖拽） | 留到做 App 时用真机一起调，之前不零散改 |
| 进度只在本机 | 做 App 时加账号和同步；在那之前给外人试用要先有备份办法 |
| 矮屏（高度 640 左右） | 手帐页要稍微滚动才看全 |
| 第 8–30 课 | 大纲在 `docs/course-outline.md`，按单元写 |
