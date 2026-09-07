# Mein Deutsch · 我的德语

面向初学者的德语学习网页应用，按日常交流能力组织课程，兼顾 A1。

当前分支是综合课程试学版：十二单元框架，前两个单元共八课，四份配套读听材料。尚未发布；人工音频抽听、真机录音和七天试学待验收。

| 入口 | 内容 |
|---|---|
| 学习 | 综合课程、课内复习、单元检查 |
| 单词 | 当前课程词表、到期复习、生词本、自主加练 |
| 读听 | 自由阅读/听力，按需进入练习 |
| 我的 | 记录、语法与旧资料、设置和备份 |

独立发音课暂停；核心课程不依赖 AI 配置。旧课程、词卡和学习数据保留，新课独立记录。详情见 [产品形态](docs/product-shape.md)、[课程框架](docs/integrated-curriculum.md) 与 [验收清单](docs/integrated-pilot-verification.md)。

## 技术说明

- 网页本体是纯静态前端（原生 ES Modules、无构建步骤）；发音评分单独使用一个无状态 Cloudflare Worker
- TTS 用 `speechSynthesis`（预生成 MP3 优先）；跟读使用同一条麦克风流生成本机回放和 16 kHz WAV，云端评分失败时自动保留录音对比
- 发音评测由 Azure Pronunciation Assessment 提供，Cloudflare Worker 负责保护密钥；短音频 REST 暂时漏分时，网页会使用 Worker 签发的短期令牌自动切换到同源托管的 Azure Speech SDK。免费部署步骤见 [worker/README.md](worker/README.md)
- 学习进度存 `localStorage`，设置页支持导出/导入以在手机、平板间同步
- 部署：GitHub Pages（main 分支根目录）

## 本地开发

```bash
python3 -m http.server 8420
# 打开 http://localhost:8420

# 运行 WAV、评分解析和 Worker 自动测试
npm test
```

## 内容扩展

所有学习内容在 `data/` 目录下，纯数据文件，直接编辑即可：

- `data/integrated-course.js` — 综合课、单元框架、读听材料与覆盖地图
- `data/pronunciation.js` — 已暂停的旧发音课
- `data/grammar.js` — 语法课
- `data/vocab.js` — 词汇（实际学习并练习后进入 SRS）
- `data/readings.js` — 阅读文章（glossary 的键 = 课文中的小写词形）
