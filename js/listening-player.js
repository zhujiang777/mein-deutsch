// 精听播放控制器：句级定位、AB 复读、逐句循环、速率分档、跟随高亮。
// 两种音频形态共用同一套对外 API：
//   clip      —— 整段单文件 + 句级时间戳，AB 复读能跨句自由取段
//   sentences —— 逐句独立文件，多音色包与外部真人录音的兜底形态
// 时间戳一旦不可信就整包降级到 sentences，宁可没有 AB 复读也不能错位。
import { acquirePlayer, stopSpeak } from './speech.js';
import { RATE_STEPS, SLOW_RATE, clampRange, nextRate, normalizeRate, sentenceAt, segUsable } from './audio-timing.js';
import { el, esc, icon } from './ui.js';

export function createPackPlayer(pack, audio) {
  const sentences = pack?.sentences || [];
  const count = sentences.length;
  const seg = audio?.seg;
  const clip = audio?.mode === 'clip' && !!audio.file && segUsable(seg, count);
  const files = audio?.files || [];

  const listeners = new Map();
  let node = null;      // 当前 Audio：clip 模式全程一个，sentences 模式每句换一个
  let rate = 1;         // 用户选定的档位
  let override = null;  // 单次播放的临时速率（audioBtn 的慢速），播完即清
  let index = -1;
  let playing = false;
  let range = null;     // { from, to } 当前播放区间
  let looping = false;
  let ended = false;    // 区分「播完了」和「播到一半被暂停」，决定 play() 是续播还是重播
  let raf = 0;
  let dead = false;

  const effRate = () => override ?? rate;

  function emit(evt, payload) {
    // 单个监听器抛错不能拖垮播放
    (listeners.get(evt) || []).slice().forEach(fn => { try { fn(payload); } catch { /* ignore */ } });
  }
  function setIndex(next) {
    if (next === index) return;
    index = next;
    emit('sentence', index);
  }
  function setPlaying(next) {
    if (next === playing) return;
    playing = next;
    emit('state', { playing, rate: effRate() });
    if (playing) startWatch(); else stopWatch();
  }

  /* ---- 看门狗：只在播放中开 rAF，停止立刻撤，绝不留常驻帧循环 ---- */
  function startWatch() {
    if (raf || dead || typeof requestAnimationFrame !== 'function') return;
    const tick = () => {
      raf = 0;
      if (dead || !playing) return;
      watch();
      if (playing) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function stopWatch() {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0;
  }

  function watch() {
    if (!node) return;
    const t = node.currentTime;
    if (clip) {
      setIndex(sentenceAt(seg, t));
      if (range) {
        // timeupdate 只有 ~4Hz，AB 尾巴会溢出到 250ms；靠 rAF 才能压到一帧
        if (t >= seg[range.to][1] - 0.01) {
          if (looping) { seek(seg[range.from][0]); }
          else { node.pause(); finishRun(); }
        }
      }
    }
    emit('time', { t, index });
  }

  /* ---- 取播放器：统一走 speech.js 的共享单例，
     这样路由切换与课程换步里已有的 stopSpeak() 会自动掐掉长音频 ---- */
  function attach(file) {
    const next = acquirePlayer(file);
    node = next;
    next.playbackRate = effRate();
    // 外部 stopSpeak()（换路由/换步）也会走 pause。链播换文件时 node 已指向新元素，
    // 所以 node === next 这层判断能把「换句」和「被外部叫停」区分开。
    next.addEventListener('pause', () => {
      if (!dead && node === next) setPlaying(false);
    });
    return next;
  }

  function seek(time) {
    const current = node;
    if (!current) return;
    // iOS：loadedmetadata 之前写 currentTime 会被静默忽略
    if (current.readyState < 1) {
      current.addEventListener('loadedmetadata', () => { current.currentTime = time; }, { once: true });
      return;
    }
    current.currentTime = time;
  }

  function startAt(time) {
    const current = node;
    if (!current) return;
    const go = () => {
      current.currentTime = time;
      current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };
    if (current.readyState < 1) current.addEventListener('loadedmetadata', go, { once: true });
    else go();
  }

  function ensureClip() {
    if (node) return node;
    const current = attach(audio.file);
    current.addEventListener('ended', () => {
      if (dead || node !== current) return;
      if (looping && range) { seek(seg[range.from][0]); current.play().catch(() => {}); return; }
      finishRun();
    });
    return current;
  }

  /* ---- sentences 模式：按文件链播 ---- */
  function playFileAt(i) {
    const file = files[i];
    if (!file) { finishRun(); return; }
    const current = attach(file);
    setIndex(i);
    current.addEventListener('ended', () => {
      if (dead || node !== current) return;
      if (range && i < range.to) { playFileAt(i + 1); return; }
      if (looping && range) { playFileAt(range.from); return; }
      finishRun();
    });
    current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function finishRun() {
    override = null;
    ended = true;
    if (node) node.playbackRate = effRate();
    setPlaying(false);
    emit('end');
  }

  function once(evt, fn) {
    const wrap = payload => { ctl.off(evt, wrap); fn(payload); };
    ctl.on(evt, wrap);
  }

  const ctl = {
    get mode() { return clip ? 'clip' : 'sentences'; },
    get count() { return count; },
    get rate() { return rate; },
    get playing() { return playing; },
    current() { return { index, playing, rate: effRate(), range: range && { ...range }, looping }; },

    /** 播完了就重播当前区间，播到一半被暂停则就地续播。 */
    play() {
      if (node && node.paused && range && !ended) {
        node.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        return;
      }
      if (range) ctl.playRange(range.from, range.to, { loop: looping });
      else ctl.playAll();
    },
    pause() { node?.pause(); },
    stop() {
      stopSpeak();
      setPlaying(false);
      setIndex(-1);
      range = null; looping = false; override = null;
    },

    playAll(opts = {}) { ctl.playRange(0, count - 1, opts); },
    playSentence(i, opts = {}) { ctl.playRange(i, i, opts); },

    /**
     * 播放 [a, b] 区间。opts: { loop, slow, onend }
     * slow 只影响这一次播放，不改用户选定的档位（audioBtn 的慢速按钮用它）。
     */
    playRange(a, b, { loop = false, slow = false, onend } = {}) {
      const bounds = clampRange(a, b, count);
      if (!bounds) { onend?.(); return; }
      range = bounds;
      looping = !!loop;
      ended = false;
      override = slow ? SLOW_RATE : null;
      if (onend) once('end', onend);
      if (clip) {
        ensureClip();
        node.playbackRate = effRate();
        startAt(seg[bounds.from][0]);
      } else {
        playFileAt(bounds.from);
      }
    },

    setRate(value) {
      rate = normalizeRate(value);
      override = null;
      if (node) node.playbackRate = rate;
      emit('state', { playing, rate });
      return rate;
    },
    cycleRate() { return ctl.setRate(nextRate(rate)); },

    /** 只移动播放头，不改播放状态。 */
    seekSentence(i) {
      const bounds = clampRange(i, i, count);
      if (!bounds) return;
      if (clip) { ensureClip(); seek(seg[bounds.from][0]); setIndex(bounds.from); }
      else if (playing) playFileAt(bounds.from);
      else setIndex(bounds.from);
    },
    /** 相对跳转（后退 5 秒按钮）。sentences 模式没有连续时间轴，退到本句开头。 */
    nudge(seconds) {
      if (!node) return;
      if (clip) seek(Math.max(0, node.currentTime + seconds));
      else node.currentTime = 0;
    },

    on(evt, fn) {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
      return () => ctl.off(evt, fn);
    },
    off(evt, fn) {
      const list = listeners.get(evt);
      if (!list) return;
      const at = list.indexOf(fn);
      if (at >= 0) list.splice(at, 1);
    },

    destroy() {
      dead = true;
      stopWatch();
      stopSpeak();
      listeners.clear();
      node = null;
    },
  };

  return ctl;
}

/* ================= 播放条 UI ================= */

/**
 * renderListenBar(host, ctl, { sentences, showText })
 * showText=false 用圆点条（盲听阶段不泄题），true 用可点的句列表。
 * 返回的元素带 destroy()，视图卸载时调用以摘掉对 ctl 的监听。
 */
export function renderListenBar(host, ctl, { sentences = [], showText = false } = {}) {
  const bar = el(`<div class="listen-bar">
    <div class="lb-controls">
      <button class="lb-btn lb-play" aria-label="播放">${icon('play')}</button>
      <button class="lb-btn lb-back" aria-label="后退 5 秒">−5s</button>
      <button class="lb-btn lb-rate" aria-label="播放速度">1×</button>
      <button class="lb-btn lb-mark lb-a" aria-label="标记复读起点">A</button>
      <button class="lb-btn lb-mark lb-b" aria-label="标记复读终点">B</button>
      <button class="lb-btn lb-loop" aria-label="循环当前区间">${icon('loop')}</button>
    </div>
    <div class="lb-track"></div>
  </div>`);

  const playBtn = bar.querySelector('.lb-play');
  const rateBtn = bar.querySelector('.lb-rate');
  const aBtn = bar.querySelector('.lb-a');
  const bBtn = bar.querySelector('.lb-b');
  const loopBtn = bar.querySelector('.lb-loop');
  const track = bar.querySelector('.lb-track');

  let markA = null, markB = null;
  const cells = [];

  // 用显式类而不是 :has()——布局在渲染时就已确定，没必要押注选择器兼容性
  track.classList.add(showText ? 'has-text' : 'has-dots');

  const total = showText ? sentences.length : (ctl.count || sentences.length);
  for (let i = 0; i < total; i++) {
    const cell = showText
      ? el(`<button class="lb-sent" data-i="${i}"><span class="lb-n">${i + 1}</span><span class="de">${esc(sentences[i]?.de || '')}</span></button>`)
      : el(`<button class="lb-dot" data-i="${i}" aria-label="第 ${i + 1} 句"></button>`);
    cell.addEventListener('click', () => ctl.playSentence(i));
    track.appendChild(cell);
    cells.push(cell);
  }

  function paintMarks() {
    aBtn.textContent = markA === null ? 'A' : `A${markA + 1}`;
    bBtn.textContent = markB === null ? 'B' : `B${markB + 1}`;
    aBtn.classList.toggle('is-set', markA !== null);
    bBtn.classList.toggle('is-set', markB !== null);
    const { from, to } = clampRange(markA ?? 0, markB ?? 0, total) || {};
    cells.forEach((cell, i) => {
      const inRange = markA !== null && markB !== null && i >= from && i <= to;
      cell.classList.toggle('in-range', inRange);
    });
  }

  function activeIndex() {
    const at = ctl.current().index;
    return at >= 0 ? at : 0;
  }

  playBtn.addEventListener('click', () => {
    if (ctl.current().playing) ctl.pause();
    else if (markA !== null && markB !== null) ctl.playRange(markA, markB, { loop: true });
    else ctl.play();
  });
  bar.querySelector('.lb-back').addEventListener('click', () => ctl.nudge(-5));
  rateBtn.addEventListener('click', () => { rateBtn.textContent = `${ctl.cycleRate()}×`; });

  aBtn.addEventListener('click', () => {
    // 两端都标好之后再点 A，视为清除区间
    if (markA !== null && markB !== null) { markA = null; markB = null; paintMarks(); return; }
    markA = activeIndex();
    paintMarks();
  });
  bBtn.addEventListener('click', () => {
    markB = activeIndex();
    if (markA === null) markA = 0;
    paintMarks();
    ctl.playRange(markA, markB, { loop: true });
    loopBtn.classList.add('is-on');
  });
  loopBtn.addEventListener('click', () => {
    const on = !loopBtn.classList.contains('is-on');
    loopBtn.classList.toggle('is-on', on);
    if (!on) { ctl.pause(); return; }
    if (markA !== null && markB !== null) ctl.playRange(markA, markB, { loop: true });
    else ctl.playSentence(activeIndex(), { loop: true });
  });

  const offSentence = ctl.on('sentence', at => {
    cells.forEach((cell, i) => cell.classList.toggle('is-current', i === at));
    if (showText && at >= 0) cells[at]?.scrollIntoView({ block: 'nearest' });
  });
  const offState = ctl.on('state', ({ playing, rate }) => {
    playBtn.innerHTML = icon(playing ? 'pause' : 'play');
    playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
    if (rate) rateBtn.textContent = `${rate}×`;
  });

  rateBtn.textContent = `${ctl.rate}×`;
  paintMarks();
  host.appendChild(bar);

  bar.destroy = () => { offSentence(); offState(); };
  return bar;
}

export { RATE_STEPS, SLOW_RATE };
