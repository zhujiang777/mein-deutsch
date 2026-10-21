# Mein Deutsch · 我的德语

面向初学者的德语学习网页应用，按日常交流能力组织课程，兼顾 A1。

**产品方向以 [产品宪法](docs/product.md) 为准**：主线是"一篇课文就是一课"，两天学完一篇，首页只有一个按钮。下表是当前线上版本（GPT 综合课试学版，8 课）的入口，将在课文课上线后调整。

| 入口 | 内容 |
|---|---|
| 学习 | 综合课程、课内复习、单元检查 |
| 单词 | 当前课程词表、到期复习、生词本、自主加练 |
| 读听 | 自由阅读/听力，按需进入练习 |
| 我的 | 记录、语法与旧资料、设置和备份 |

旧课程、词卡和学习数据保留；`docs/archive/` 里的旧设计文档均已作废。

手机试用：https://zhujiang777.github.io/mein-deutsch/

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
