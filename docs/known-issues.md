# 已知问题

## 1. 安卓 Chrome 上旧版跟读判定不出分（已绕过，待真机验收）

**状态**：2026-07-19 已从产品链路移除浏览器 `SpeechRecognition`。新版使用同一次录音生成回放和 16 kHz PCM WAV，停止后将 WAV 交给 Azure `de-DE` Pronunciation Assessment。评分服务未配置或不可用时保留录音对比，不再显示文字匹配分。

云端部署前仍需按照 `worker/README.md` 创建 Azure Speech F0 与 Cloudflare Worker，并在三星 Chrome 和 Mac Chrome 上完成真机验收。因此这里记录为“已绕过”，不宣称旧接口的设备层根因已经查明。

### Azure 短音频 REST 偶发缺少评分区块

2026-07-19 真机测试发现：Azure 能成功识别德语文本，但 REST 响应可能缺少整个 `PronunciationAssessment`，因此没有 `PronScore`。新版保留 REST 快速路径；检测到该结构后自动通过 Worker 获取短期令牌，改用随站点固定版本发布的 Azure Speech SDK 对同一段 WAV 评分。诊断只记录 `hasNBest / hasAssessment / hasPronScore` 等结构布尔值，不记录参考文本、识别文本或音频。

### 旧版症状（历史记录）
三星手机 Chrome（用户主力设备）上，speak 跟读步骤录完音后判定区不出逐词标色和分数。三种路径全部失败：

1. **并发判定**（录音期间同时跑 SpeechRecognition）：识别收不到声音。
2. **喂轨修复**（commit c10d961）：把录音流克隆轨传给 `recognition.start(track)`——无效。
3. **单独判定按钮**（commit 4051f80，「🎤 单独读一遍打分」，只识别不录音）：**同样不出分**。

### 已确认的事实
- 线上部署的代码是最新的（curl 验证过 `sp-judging`/`start(track`/`clone()` 均在线上文件中）。
- 路径 1 失败的根因明确：安卓上 SpeechRecognition 与 MediaRecorder 无法共享麦克风（桌面 Chrome 可以）。
- 路径 2 无效的根因明确：`start(track)` 重载（[chromestatus 5178378197139456](https://chromestatus.com/feature/5178378197139456)）截至 2026-07 **仅桌面 Chrome 135 开发者试用（flag 后），安卓未上线**（chromestatus API：`shipped android: None`）。该兼容代码当时被保留，新版已经随旧识别链路一起移除。
- **路径 3 失败原因仍未查明**。单独识别不依赖录音、独占麦克风，理论上应是安卓的可靠路径；它也失败，说明旧问题可能在设备/系统层而非并发冲突。新版不再依赖这一结论。

### 新链路的验收重点
1. 设置页填写 Worker 地址与个人访问码后，连接测试应成功。
2. 三星 Chrome 停止录音后应立即出现“标准 / 我的录音”，随后出现综合发音、音素准确、流利度、完整度及逐词反馈。
3. 网络断开、访问码错误、免费额度耗尽时不得卡住；评分区应显示可读错误，录音回放继续可用。
4. Google 翻译德语麦克风测试只用于追查旧接口，不再影响新版评分。

### 新版相关代码
- `js/recorder.js` / `js/pcm-capture-worklet.js` — 同一音轨生成回放与 Azure 所需 WAV，最长 20 秒
- `js/pronunciation-assessment.js` — 前端 API、超时、错误映射、稳定响应解析与 70 分练习线
- `js/ui.js` — 录音对比、异步评分、逐词/音素反馈和同一录音重试
- `worker/src/index.js` — 访问码、CORS、WAV 校验、Azure 转发与响应脱敏
- 旧版相关 commit：0b8a566 → c10d961 → 4051f80；保留本节作为失败链路的历史证据
