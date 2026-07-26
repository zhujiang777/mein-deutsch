# 课程开发约定

- 尽量只改 `data/*.js`，不改评分链路和密钥配置。
- 口语练习使用现有 `speak` / `reproduce` / `roleplay`，它们已接入 Azure 评分。
- 新口语题型复用 `speakPractice()` 或 `micBtn()`，不使用 `SpeechRecognition`。
- `scene` 和 🔊 只播放，不评分。
- 改课程或词汇数据后按序重跑：`npm run content:index` → `npm run content:examples` → `npm run content:grammar`；
  改德语文本后再运行 `python3 tools/gen_audio.py`，最后运行 `npm test`。三个生成物都有一致性测试，漏跑会红。
- 精读/精听的 `grammarPrereqs` 只能用 `data/grammar.js` 里 `PREREQ_TO_GRAMMAR` 登记过的标签，
  否则该标签会被静默忽略（测试会拦）。新语法概念先在那张表里登记到某一课 g##，或显式登记为空数组。
- 题目上的 `skills` 标签要用 `course.js` 里已存在的写法。它同时喂掌握度、"语法课 ↔ 微步课"的连线
  和 A1 全景图的格子，拼错（`v2-word-order` vs `v2-order`）不会报错，只会让强度永远是 0。
- 新增技能标签后，记得挂进 `data/panorama.js` 的某一格，否则它练了也不会在全景图上体现。
  同一个标签只能属于一格（测试会拦），否则掌握度被数两遍。格子定义见 `docs/a1-panorama.md`。
- 需要查字段格式时再读 `docs/schema.md`。
