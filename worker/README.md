# 德语发音评分 Worker

这个 Worker 验证个人访问码、把短 WAV 录音转发给 Azure Pronunciation Assessment、整理固定响应，并在 Azure REST 已识别语音却漏掉评分区块时签发约 9 分钟有效的 Speech SDK 临时令牌。长期 Azure Key 始终只存在 Worker Secret 中。Worker 不会保存录音、参考文本或评分结果。

接口包括：`GET /v1/health`、`POST /v1/pronunciation/assess` 和供自动兼容回退使用的 `POST /v1/speech/token`。

## 1. 创建免费资源

1. 在 Azure Portal 创建 **Speech service**，计费层选择 **Free F0**，记下 `Key 1` 和资源区域。
2. 注册 Cloudflare 免费账号，并安装或直接使用 `npx wrangler`。
3. 在项目根目录登录：`npx wrangler login`。

不要把 Azure 密钥、访问码或 `.dev.vars` 提交到 Git。

## 2. 本地验证

复制 `worker/.dev.vars.example` 为 `worker/.dev.vars` 并填写三个值，然后在项目根目录执行：

```bash
npm run worker:dev
```

本地命令会临时允许 `http://localhost:8420`；生产配置只允许正式 GitHub Pages 来源。线上域名改变时，需要同步修改 `worker/wrangler.toml` 的 `ALLOWED_ORIGINS`。

## 3. 部署

以下三个值均通过 Cloudflare Secret 设置，不会写入仓库：

```bash
npx wrangler secret put AZURE_SPEECH_KEY --config worker/wrangler.toml
npx wrangler secret put AZURE_SPEECH_REGION --config worker/wrangler.toml
npx wrangler secret put APP_ACCESS_TOKEN --config worker/wrangler.toml
npm run worker:deploy
```

部署成功后，将终端显示的 `https://….workers.dev` 地址和同一个 `APP_ACCESS_TOKEN` 填入网页“我的 → 设置 → 德语发音评分”，点击“保存并测试连接”。每台设备各配置一次；这些值不会参与 Gist 同步。

## 4. 免费额度边界

- Azure 必须保持在 F0 层；额度用尽时接口返回 429，网页自动保留录音对比模式。
- Cloudflare Worker 使用 Free 方案，不启用付费升级。
- 建议在 Azure 建立用量提醒，但不要把 F0 改为 S0。
