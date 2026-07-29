import { findPack } from '../../data/listening.js';
import { LISTENING_AUDIO } from '../../data/listening-audio.js';
import { createPackPlayer, renderListenBar } from '../listening-player.js';
import { runLessonShell } from '../lesson-shell.js';
import { el, esc } from '../ui.js';
import { getContentReadiness } from '../content-readiness.js';
import { grammarChips } from '../grammar-links.js';
import { addListenMiss } from '../mastery.js';

export function buildListeningLesson(pack) {
  if (!pack) return null;
  const audio = LISTENING_AUDIO[pack.id];
  if (!audio) return null;
  const player = createPackPlayer(pack, audio);
  const renderPlayer = (host, showText) =>
    renderListenBar(host, player, { sentences: pack.sentences, showText });
  const steps = [
    {
      type: 'listenFull',
      player,
      renderPlayer,
      prompt: '不看文字完整听两遍。第一遍抓大意，第二遍抓信息变化。'
    },
    {
      type: 'choice',
      // renderChoice 读的是 prompt，写成 q 会让题干整个渲染不出来（曾经就是这样）
      prompt: pack.gist.q,
      options: pack.gist.options,
      a: pack.gist.a,
      explain: pack.gist.explain,
      skills: pack.skills
    },
    ...(pack.dictation || []).map(index => ({
      type: 'dictation',
      sentenceIndex: index,
      audioText: pack.sentences[index].de,
      audioPlay: ({ slow = false, onend } = {}) => player.playSentence(index, { slow, onend }),
      skills: pack.skills
    })),
    {
      type: 'listenReview',
      player,
      renderPlayer,
      prompt: '现在显示逐句文本。定位连读、弱读或误切分的位置，用 A/B 循环复听。'
    },
    ...(pack.reproduce || []).map(index => ({
      type: 'reproduce',
      sentenceIndex: index,
      de: pack.sentences[index].de,
      zh: pack.sentences[index].zh,
      audioPlay: ({ slow = false, onend } = {}) => player.playSentence(index, { slow, onend }),
      skills: pack.skills
    }))
  ];
  return {
    id: pack.id,
    title: pack.title,
    skills: pack.skills,
    steps,
    player,
    onMistake: (_lessonId, _stepIdx, step) => {
      if (Number.isInteger(step.sentenceIndex)) addListenMiss(pack.id, step.sentenceIndex);
    }
  };
}

export function findListeningLesson(id) {
  const pack = findPack(id);
  return pack ? buildListeningLesson(pack) : null;
}

export function renderListening(host, id) {
  const pack = findPack(id);
  if (!pack) { location.hash = '#/readlisten'; return; }
  const readiness = getContentReadiness(pack);
  const lesson = buildListeningLesson(pack);

  host.appendChild(el(`<a class="back-link" href="#/readlisten">‹ 读·听</a>`));
  host.appendChild(el(`<header class="page-head listening-head">
    <span class="eyebrow">INTENSIVES HÖREN · ${esc(pack.skillStage || 'A1')}</span>
    <h1 class="page-title de">${esc(pack.title)}</h1>
    <p class="page-sub">${esc(pack.titleZh)} ·
      <span class="readiness-chip ${readiness.key}">${readiness.label}</span>
      <span class="pill">${esc(pack.genre || '')}</span>
    </p>
    <p class="meta">${esc(pack.intro || '')}</p>
  </header>`));

  const chips = grammarChips(pack);
  if (chips) host.appendChild(chips);

  if (!lesson) {
    host.appendChild(el(`<div class="empty-hint">这份精听的原创音频尚未生成。</div>`));
    return;
  }

  runLessonShell(host, lesson, {
    onExit: () => {
      lesson.player.destroy();
      location.hash = '#/readlisten';
    },
    onComplete: () => {
      lesson.player.destroy();
      location.hash = '#/readlisten';
    }
  });
}
