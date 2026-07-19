# 已知问题

## 1. 安卓 Chrome 上跟读发音判定不出分（未解决，待修复）

**状态**：2026-07-19 排查三轮后封存。录音对比功能不受影响，判定当前仅桌面 Chrome 可用。

### 症状
三星手机 Chrome（用户主力设备）上，speak 跟读步骤录完音后判定区不出逐词标色和分数。三种路径全部失败：

1. **并发判定**（录音期间同时跑 SpeechRecognition）：识别收不到声音。
2. **喂轨修复**（commit c10d961）：把录音流克隆轨传给 `recognition.start(track)`——无效。
3. **单独判定按钮**（commit 4051f80，「🎤 单独读一遍打分」，只识别不录音）：**同样不出分**。

### 已确认的事实
- 线上部署的代码是最新的（curl 验证过 `sp-judging`/`start(track`/`clone()` 均在线上文件中）。
- 路径 1 失败的根因明确：安卓上 SpeechRecognition 与 MediaRecorder 无法共享麦克风（桌面 Chrome 可以）。
- 路径 2 无效的根因明确：`start(track)` 重载（[chromestatus 5178378197139456](https://chromestatus.com/feature/5178378197139456)）截至 2026-07 **仅桌面 Chrome 135 开发者试用（flag 后），安卓未上线**（chromestatus API：`shipped android: None`）。代码保留，安卓上会被当作无参调用忽略，无害且未来自动生效。
- **路径 3 失败原因未查明**——这是留给后续修复者的起点。单独识别不依赖录音、独占麦克风，理论上是安卓的可靠路径（本项目 v2 时代的纯识别模式即此路径）。它也失败说明问题可能在设备/系统层而非并发冲突。

### 给修复者的排查建议（按可能性排序）
1. **先看错误码**：判定区失败文案会区分错误类型（`js/ui.js` 的 `renderRecog` 错误分支）。让用户报告点击「单独读一遍打分」后判定区/状态栏显示的确切文字；必要时临时把原始 `r.error` 码显示出来（现在 `service-not-allowed`/`network`/`not-allowed` 之外的码折叠成通用文案）。
2. **设备语音服务**：安卓 Chrome 的 SpeechRecognition 委托系统 Google 语音服务。检查：Google App 是否被禁用/精简、系统语音输入引擎是否为 Samsung 自家（改为 Google）、de-DE 语言包、Chrome 版本。
3. **换识别语言实验**：临时把 `js/speech.js:recognizeOnce` 的 `lang` 改 `en-US` 测试——若英语能出结果，是 de-DE 语言包问题；若英语也不行，是识别服务本身不可用。
4. **最小复现页**：拿一个 10 行的裸 `webkitSpeechRecognition` demo 页在该手机上测（排除本项目代码的一切干扰）。

### 相关代码
- `js/speech.js` — `recognizeOnce({onResult,onError,onEnd,track})`（含 `start(track)` 喂轨）、`scoreSpeech`（LCS 逐词评分）、`SPEAK_PASS=70`
- `js/ui.js` — `speakPractice`（录音+判定状态机、5s 超时兜底、`addJudgeBtn` 单独判定入口）、`wireRecognitionOnly`（无录音设备退路）
- `js/recorder.js` — MediaRecorder 封装（暴露 `stream` 供克隆音频轨）
- 相关 commit：0b8a566（判定升级为一等公民）→ c10d961（喂轨）→ 4051f80（单独判定兜底）
