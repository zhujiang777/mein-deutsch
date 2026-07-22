// 设置：语音选择、语速、每日新词、Gist 同步、进度导出/导入
import { el, esc, icon, toast } from '../ui.js';
import { germanVoices, speak, ttsAvailable } from '../speech.js';
import { getSettings, setSetting, exportAll, importAll, resetAll } from '../storage.js';
import { pullMerge, pushNow, syncConfigured } from '../sync.js';
import { getAssessmentSecrets, setAssessmentSecrets } from '../secrets.js';
import { assessmentConfigured, checkAssessmentConnection } from '../pronunciation-assessment.js';

export function renderSettings(host) {
  const s = getSettings();
  host.appendChild(el(`<a class="back-link" href="#/me">‹ 我的</a>`));
  host.appendChild(el(`<span class="eyebrow">APP PREFERENCES · 应用偏好</span>`));
  host.appendChild(el(`<h1 class="page-title">设置</h1>`));

  /* 跨设备同步 */
  const syncCard = el(`<div class="card"><h3>${icon('route')} 跨设备同步（GitHub Gist）</h3>
    <p class="meta">进度自动保存到你的私有 Gist（免费、仅自己可见）。手机/平板各粘贴一次令牌即可无感接力。
    <br>令牌获取：github.com → Settings → Developer settings → Personal access tokens (classic) → Generate new token，<b>只勾选 gist 权限</b>。</p></div>`);
  const tokenRow = el(`<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
    <input type="password" class="quiz-fill-input" style="flex:1;min-width:180px" placeholder="粘贴 GitHub 令牌 (ghp_…)" value="${esc(s.gistToken || '')}">
    <button class="btn small">保存</button>
  </div>`);
  const tokenInput = tokenRow.querySelector('input');
  tokenRow.querySelector('button').addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    setSetting('gistToken', token);
    if (!token) { toast('已清除令牌，同步关闭'); return; }
    toast('正在验证并同步…');
    try {
      const pulled = await pullMerge();
      if (pulled === 'pulled') { toast('已拉取云端进度 ✅'); setTimeout(() => location.reload(), 900); return; }
      await pushNow();
      toast('同步已开启，进度已上传');
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      toast(`同步失败：${e.message}`, 4000);
    }
  });
  syncCard.appendChild(tokenRow);
  if (syncConfigured()) {
    const row = el(`<div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn small secondary">立即拉取</button>
      <button class="btn small secondary">立即推送</button>
    </div>`);
    const [pullBtn, pushBtn] = row.querySelectorAll('button');
    pullBtn.addEventListener('click', async () => {
      try {
        const r = await pullMerge();
        toast(r === 'pulled' ? '已拉取云端进度 ✅（刷新生效）' : '本地已是最新');
        if (r === 'pulled') setTimeout(() => location.reload(), 900);
      } catch (e) { toast(`拉取失败：${e.message}`, 4000); }
    });
    pushBtn.addEventListener('click', async () => {
      try { await pushNow(); toast('已推送 ✅'); }
      catch (e) { toast(`推送失败：${e.message}`, 4000); }
    });
    syncCard.appendChild(row);
    if (s.gistId) syncCard.appendChild(el(`<p class="meta" style="margin-top:8px">Gist ID: ${esc(s.gistId)}</p>`));
  }
  host.appendChild(syncCard);

  /* 语音 */
  const voiceCard = el(`<div class="card"><h3>${icon('speaker')} 德语语音</h3>
    <p class="meta" style="margin-bottom:6px">课程内容使用内置真人级德语音频（微软神经网络语音），所有设备发音一致。下面的设备语音仅在朗读内容库之外的文本时作为回退。</p></div>`);
  const voiceRow = el(`<div class="settings-row"><label>回退语音</label></div>`);
  const sel = el(`<select></select>`);
  function fillVoices() {
    const list = germanVoices();
    sel.innerHTML = '';
    if (!list.length) {
      sel.appendChild(el(`<option value="">（未检测到德语语音）</option>`));
      return;
    }
    sel.appendChild(el(`<option value="">自动选择</option>`));
    list.forEach(v => {
      const o = el(`<option value="${esc(v.voiceURI)}">${esc(v.name)} (${v.lang})</option>`);
      if (v.voiceURI === s.voiceURI) o.selected = true;
      sel.appendChild(o);
    });
  }
  fillVoices();
  speechSynthesis?.addEventListener?.('voiceschanged', fillVoices);
  sel.addEventListener('change', () => {
    setSetting('voiceURI', sel.value);
    speak('Guten Tag! Ich lerne Deutsch.');
  });
  voiceRow.appendChild(sel);
  voiceCard.appendChild(voiceRow);

  const rateRow = el(`<div class="settings-row"><label>语速</label></div>`);
  const rateSel = el(`<select>
    <option value="0.7">慢 (0.7×)</option>
    <option value="0.85">稍慢 (0.85×)</option>
    <option value="1">正常 (1×)</option>
    <option value="1.15">稍快 (1.15×)</option>
  </select>`);
  rateSel.value = String(s.rate);
  rateSel.addEventListener('change', () => {
    setSetting('rate', parseFloat(rateSel.value));
    speak('Guten Tag! Ich lerne Deutsch.');
  });
  rateRow.appendChild(rateSel);
  voiceCard.appendChild(rateRow);

  const testBtn = el(`<button class="btn small secondary" style="margin-top:8px">试听 Guten Tag!</button>`);
  testBtn.addEventListener('click', () => speak('Guten Tag! Ich lerne Deutsch.'));
  voiceCard.appendChild(testBtn);

  if (!ttsAvailable()) voiceCard.appendChild(el(`<p class="meta" style="margin-top:8px">当前浏览器不支持语音合成</p>`));
  host.appendChild(voiceCard);

  /* 发音评分：配置只保存在当前设备，不进入 Gist/导出 */
  const assessment = getAssessmentSecrets();
  const assessmentCard = el(`<div class="card"><h3>${icon('target')} 德语发音评分</h3>
    <p class="meta">一次录音会同时用于本机回放和 Azure 德语发音评测，返回综合发音、音素准确、流利度、完整度及逐词反馈。短录音仅在评分时发送，不写入学习进度或 Gist。</p>
    <div class="assessment-config" style="margin-top:10px">
      <label class="secret-label">Cloudflare Worker 地址
        <input type="url" class="quiz-fill-input assessment-endpoint" autocomplete="off" placeholder="https://….workers.dev" value="${esc(assessment.endpoint)}">
      </label>
      <label class="secret-label">个人访问码
        <input type="password" class="quiz-fill-input assessment-code" autocomplete="off" placeholder="仅保存在本机" value="${esc(assessment.accessCode)}">
      </label>
      <button class="btn small assessment-save">保存并测试连接</button>
      <span class="assessment-status meta">${assessmentConfigured() ? '已填写配置，尚未验证' : '未配置时跟读仍可录音对比，但不会打分'}</span>
    </div>
  </div>`);
  const endpointInput = assessmentCard.querySelector('.assessment-endpoint');
  const codeInput = assessmentCard.querySelector('.assessment-code');
  const saveAssessment = assessmentCard.querySelector('.assessment-save');
  const assessmentStatus = assessmentCard.querySelector('.assessment-status');
  saveAssessment.addEventListener('click', async () => {
    setAssessmentSecrets({ endpoint: endpointInput.value, accessCode: codeInput.value });
    if (!endpointInput.value.trim() || !codeInput.value.trim()) {
      assessmentStatus.textContent = '配置不完整，已保留录音对比模式';
      toast('请填写 Worker 地址和个人访问码');
      return;
    }
    saveAssessment.disabled = true;
    assessmentStatus.textContent = '正在连接…';
    try {
      await checkAssessmentConnection();
      assessmentStatus.textContent = '发音评分连接正常';
      toast('发音评分已开启');
    } catch (err) {
      assessmentStatus.textContent = `⚠️ ${err.message || '连接失败'}`;
      toast(`连接失败：${err.message || '请检查配置'}`, 4000);
    } finally {
      saveAssessment.disabled = false;
    }
  });
  host.appendChild(assessmentCard);

  /* 学习偏好 */
  const prefCard = el(`<div class="card"><h3>${icon('settings')} 学习偏好</h3></div>`);
  const themeRow = el(`<div class="settings-row"><label>界面主题</label></div>`);
  const themeSel = el(`<select><option value="system">跟随系统</option><option value="light">日间城市</option><option value="dark">夜间城市</option></select>`);
  themeSel.value = s.theme || 'system';
  themeSel.addEventListener('change', () => {
    setSetting('theme', themeSel.value);
    if (themeSel.value === 'light' || themeSel.value === 'dark') document.documentElement.dataset.theme = themeSel.value;
    else delete document.documentElement.dataset.theme;
  });
  themeRow.appendChild(themeSel);
  prefCard.appendChild(themeRow);

  const goalRow = el(`<div class="settings-row"><label>每日 XP 目标</label></div>`);
  const goalSel = el(`<select><option value="10">10 XP · 轻松</option><option value="20">20 XP · 标准</option><option value="30">30 XP · 充实</option></select>`);
  goalSel.value = String(s.dailyGoalXp || 20);
  goalSel.addEventListener('change', () => setSetting('dailyGoalXp', parseInt(goalSel.value, 10)));
  goalRow.appendChild(goalSel);
  prefCard.appendChild(goalRow);

  const newRow = el(`<div class="settings-row"><label>每日新词数</label></div>`);
  const newSel = el(`<select>
    <option value="5">5 个</option>
    <option value="10">10 个</option>
    <option value="15">15 个</option>
    <option value="20">20 个</option>
  </select>`);
  newSel.value = String(getSettings().newPerDay);
  newSel.addEventListener('change', () => setSetting('newPerDay', parseInt(newSel.value, 10)));
  newRow.appendChild(newSel);
  prefCard.appendChild(newRow);
  host.appendChild(prefCard);

  /* 数据同步 */
  const dataCard = el(`<div class="card"><h3>${icon('book')} 本地进度迁移</h3>
    <p class="meta">进度保存在设备本地。换设备时：在旧设备"导出"，复制文本发给自己（微信/备忘录），在新设备粘贴后"导入"。</p></div>`);
  const ta = el(`<textarea class="io-area" placeholder="导出的进度会显示在这里；导入时把文本粘贴到这里"></textarea>`);
  const btnRow = el(`<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div>`);
  const expBtn = el(`<button class="btn small">导出进度</button>`);
  expBtn.addEventListener('click', async () => {
    ta.value = exportAll();
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
      toast('已导出并复制到剪贴板');
    } catch {
      toast('已导出，请手动全选复制');
    }
  });
  const impBtn = el(`<button class="btn small secondary">导入进度</button>`);
  impBtn.addEventListener('click', () => {
    if (!ta.value.trim()) { toast('请先把导出的文本粘贴到输入框'); return; }
    try {
      importAll(ta.value.trim());
      toast('导入成功');
      setTimeout(() => location.reload(), 800);
    } catch {
      toast('导入失败：文本格式不对');
    }
  });
  btnRow.appendChild(expBtn);
  btnRow.appendChild(impBtn);
  dataCard.appendChild(ta);
  dataCard.appendChild(btnRow);

  const resetBtn = el(`<button class="btn small" style="margin-top:14px;background:var(--red)">清空全部学习记录</button>`);
  let armed = false;
  resetBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      resetBtn.textContent = '再点一次确认清空（不可恢复）';
      setTimeout(() => { armed = false; resetBtn.textContent = '清空全部学习记录'; }, 4000);
      return;
    }
    resetAll();
    toast('已清空');
    setTimeout(() => location.reload(), 800);
  });
  dataCard.appendChild(resetBtn);
  host.appendChild(dataCard);

  host.appendChild(el(`<p class="meta" style="text-align:center;margin-top:20px">Mein Deutsch · 学习进度默认存本机 · 评分时短录音发送至 Azure</p>`));
}
