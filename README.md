# Mein Deutsch · 我的德语

给中文母语初学者的德语学习应用：一篇课文就是一课，每天 15–20 分钟。**产品方向以 [产品宪法](docs/product.md) 为准。**

手机试用：https://zhujiang777.github.io/mein-deutsch/

## 目录

| 位置 | 内容 |
|---|---|
| `heft/` | 应用本体（手帐本版界面） |
| `data/story-lessons.js` | 课文课内容；`data/vocab.js` 是词库 |
| `audio/story/` | 课文、单词、字母的录音 |
| `js/` | 录音与发音评分（应用共用） |
| `worker/` | 发音评分服务（Cloudflare Worker → Azure Speech），部署见 `worker/README.md` |
| `tools/` | 配音清单与录音生成 |
| `docs/` | 产品宪法、写课规则与逐课大纲、数据字段、界面插画做法、工程与发布说明 |

## 技术说明

- 纯静态网页（原生 ES Modules、无构建步骤），部署在 GitHub Pages（main 分支根目录）
- 学习进度存在浏览器本地
- 录音预先生成（ElevenLabs），密钥只放在本机，不进仓库

## 本地开发

```bash
python3 -m http.server 8420
```

打开 http://localhost:8420/heft/

```bash
npm test
```
