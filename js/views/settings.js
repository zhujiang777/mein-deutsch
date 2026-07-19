// 设置：语音选择、语速、每日新词、Gist 同步、进度导出/导入
import { el, esc, toast } from '../ui.js';
import { germanVoices, speak, ttsAvailable, recognitionAvailable } from '../speech.js';
import { getSettings, setSetting, exportAll, importAll, resetAll } from '../storage.js';
import { pullMerge, pushNow, syncConfigured } from '../sync.js';

export function renderSettings(host) {
  const s = getSettings();
  host.appendChild(el(`<a class="back-link" href="#/me">‹ 我的</a>`));
  host.appendChild(el(`<h1 class="page-title">⚙️ 设置</h1>`));

  /* 跨设备同步 */
  const syncCard = el(`<div class="card"><h3>☁️ 跨设备同步（GitHub Gist）</h3>
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
      toast('同步已开启 ✅ 进度已上传');
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      toast(`同步失败：${e.message}`, 4000);
    }
  });
  syncCard.appendChild(tokenRow);
  if (syncConfigured()) {
    const row = el(`<div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn small secondary">⬇️ 立即拉取</button>
      <button class="btn small secondary">⬆️ 立即推送</button>
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
  const voiceCard = el(`<div class="card"><h3>🔊 德语语音</h3>
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

  if (!ttsAvailable()) voiceCard.appendChild(el(`<p class="meta" style="margin-top:8px">⚠️ 当前浏览器不支持语音合成</p>`));
  voiceCard.appendChild(el(`<p class="meta" style="margin-top:8px">${recognitionAvailable() ? '✅ 支持发音判定（跟读时自动逐词打分；识别服务异常会自动改用录音对比）' : '⚠️ 本浏览器不支持发音判定，跟读将使用录音对比模式（iPad 上各浏览器均为 WebKit 内核，识别多不可用，属正常）'}</p>`));
  host.appendChild(voiceCard);

  /* 学习偏好 */
  const prefCard = el(`<div class="card"><h3>📚 学习偏好</h3></div>`);
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
  const dataCard = el(`<div class="card"><h3>💾 进度同步（手机 ⇄ 平板）</h3>
    <p class="meta">进度保存在设备本地。换设备时：在旧设备"导出"，复制文本发给自己（微信/备忘录），在新设备粘贴后"导入"。</p></div>`);
  const ta = el(`<textarea class="io-area" placeholder="导出的进度会显示在这里；导入时把文本粘贴到这里"></textarea>`);
  const btnRow = el(`<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div>`);
  const expBtn = el(`<button class="btn small">导出进度</button>`);
  expBtn.addEventListener('click', async () => {
    ta.value = exportAll();
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
      toast('已导出并复制到剪贴板 ✅');
    } catch {
      toast('已导出，请手动全选复制');
    }
  });
  const impBtn = el(`<button class="btn small secondary">导入进度</button>`);
  impBtn.addEventListener('click', () => {
    if (!ta.value.trim()) { toast('请先把导出的文本粘贴到输入框'); return; }
    try {
      importAll(ta.value.trim());
      toast('导入成功 ✅');
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

  host.appendChild(el(`<p class="meta" style="text-align:center;margin-top:20px">Mein Deutsch · 专属德语学习 · 数据仅存本机</p>`));
}
