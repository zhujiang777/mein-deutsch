# Mein Deutsch · 我的德语

专属定制的德语学习网页应用（A1 起步），针对多邻国的两大短板：**没有体系化语法讲解**、**没有系统的发音教学**，并加入了"精读+泛读"的阅读驱动学习法。

**在线使用：** https://zhujiang777.github.io/mein-deutsch/

手机/平板浏览器打开后，用"添加到主屏幕"即可像 App 一样使用。

## 功能模块

| 模块 | 说明 |
|------|------|
| 🗣️ 发音系统课 | 10 课：字母 → 长短元音 → 变元音 → 双元音 → 辅音组合 → 词重音与语调，全部配 TTS 朗读（正常/慢速）和跟读检测 |
| 📐 体系化语法 | 12 课按 A1 大纲：sein/haben → 动词变位 → 名词性与冠词 → V2 语序 → 四格/三格 → 情态动词句框 → 可分动词 → 完成时，每课带练习题 |
| 🃏 词汇记忆 | 约 250 个 A1 核心词，简化版 SM-2 间隔重复算法，名词按 der/die/das 颜色标注，全部带例句 |
| 📖 分级阅读 | 精读（点词查义 + 逐句翻译 + 语法注释）+ 泛读（理解题），精读:泛读 = 1:1 |
| 🎤 跟读检测 | 基于浏览器语音识别（de-DE），逐词标绿/标红 + 匹配度评分 |

## 技术说明

- 纯静态前端（原生 ES Modules），无构建步骤、无后端、无依赖
- TTS 用 `speechSynthesis`，跟读检测用 `SpeechRecognition`（iOS Safari / Android Chrome 均支持）
- 学习进度存 `localStorage`，设置页支持导出/导入以在手机、平板间同步
- 部署：GitHub Pages（main 分支根目录）

## 本地开发

```bash
python3 -m http.server 8420
# 打开 http://localhost:8420
```

## 内容扩展

所有学习内容在 `data/` 目录下，纯数据文件，直接编辑即可：

- `data/pronunciation.js` — 发音课
- `data/grammar.js` — 语法课
- `data/vocab.js` — 词汇（新增词条会自动进入 SRS 队列）
- `data/readings.js` — 阅读文章（glossary 的键 = 课文中的小写词形）
