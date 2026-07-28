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
