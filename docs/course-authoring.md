# 课程开发约定

- 尽量只改 `data/*.js`，不改评分链路和密钥配置。
- 口语练习使用现有 `speak` / `reproduce` / `roleplay`，它们已接入 Azure 评分。
- 新口语题型复用 `speakPractice()` 或 `micBtn()`，不使用 `SpeechRecognition`。
- `scene` 和 🔊 只播放，不评分。
- 改课程或词汇数据后先运行 `npm run content:index`；改德语文本后再运行 `python3 tools/gen_audio.py`，最后运行 `npm test`。
- 需要查字段格式时再读 `docs/schema.md`。
