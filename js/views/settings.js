// 设置：语音选择、语速、每日新词、进度导出/导入
import { el, esc, toast } from '../ui.js';
import { germanVoices, speak, ttsAvailable, recognitionAvailable } from '../speech.js';
import { getSettings, setSetting, exportAll, importAll, resetAll } from '../storage.js';

export function renderSettings(host) {
  const s = getSettings();
  host.appendChild(el(`<a class="back-link" href="#/">‹ 首页</a>`));
  host.appendChild(el(`<h1 class="page-title">⚙️ 设置</h1>`));

  /* 语音 */
  const voiceCard = el(`<div class="card"><h3>🔊 德语语音</h3></div>`);
  const voiceRow = el(`<div class="settings-row"><label>朗读语音</label></div>`);
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
  voiceCard.appendChild(el(`<p class="meta" style="margin-top:8px">${recognitionAvailable() ? '✅ 支持跟读语音识别' : '⚠️ 当前浏览器不支持语音识别（跟读功能不可用），推荐 iPhone/iPad 用 Safari、安卓用 Chrome'}</p>`));
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
