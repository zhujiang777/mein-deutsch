# 今日文章 Worker

把「今天背的词 + 今天这一格语法」写成一段能读的短文。**只做生成，不做编排**——
下一格是哪格、今天背哪些词，全部由前端的确定性规则决定（`js/today-plan.js`）。

和 `worker/`（Azure 发音评测）完全独立：两种风险、两套密钥，不混在一起。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/v1/health` | 返回 `{ok, configured}`，用来在设置页测连接 |
| POST | `/v1/article/generate` | 生成今日文章 |

请求体（`src/schema.js` 是权威定义，多一个字段就整份拒绝）：

```json
{ "schemaVersion": 1, "locale": "de-DE", "level": "A1",
  "seedWords": ["Bahnhof", "fahren", "Karte"],
  "grammarZh": "用 wo 提问", "sceneHint": "火车站",
  "knownWords": ["Hallo", "…"], "variant": 0 }
```

**不上传**录音、聊天记录、完整学习进度。只有上面这些。

## 出口闸门

生成结果必须过 `src/a1-guard.js` 才会返回，过不了就重生成一次，两次都不行返回
`article: null`，前端退回库里的现成材料。闸门检查：

- 3–6 句，每句 ≤ 12 词，句句有中文
- 已知词率 ≥ 90%，新词 ≤ 3 个
- A1 红线：无从句 / 无第二格介词 / 无被动 / 无 Präteritum
- **seed-coverage**：必须真的用上今天的词（一半以上，至少 2 个）

最后一条最硬。一篇通顺但没用上今天那些词的 A1 短文，跟成熟软件里预写好的没有区别，
也就没有存在的理由。

## 部署

```bash
cd coach-worker
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put APP_ACCESS_TOKEN
npx wrangler deploy
```

`OPENAI_BASE_URL` / `OPENAI_MODEL` 在 `wrangler.toml` 里改，任何 OpenAI 兼容供应商都行。
部署后把 Worker 地址和访问码填进 App 的「设置 → 今日文章」。

当前配的是**通义千问 `qwen3.7-max`**。选 max 档不是为了省钱——一天只调一次，
哪一档都是每月几毛——是为了**过闸率**：flash 档在德语冠词性别和变格上翻车更多，
而那恰好是闸门会拦下来的。

⚠️ **通义的 JSON 模式要求提示词里出现 "JSON" 这个词**（system 或 user 皆可，不区分大小写），
否则直接报错。`src/index.js` 的系统提示已经满足；改那段提示词时别把这个词删了。
