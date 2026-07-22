// Global dictionary lookup and non-destructive text glossing.
import { DICT_ENTRIES, DICT_FORMS, DICT_POS } from '../data/dict-core.js';
import { VOCAB } from '../data/vocab.js';
import { addWordEntry, getWordbook } from './storage.js';
import { audioBtn, el, esc, toast } from './ui.js';

const normalize = (raw) => {
  const text = String(raw || '').trim();
  // Goethe lists the colloquial clitic ’s as a lemma. Preserve that one
  // leading apostrophe without making surrounding quotation marks lexical.
  if (/^[’']s$/i.test(text)) return `’${text.slice(1)}`;
  return text.replace(/^[\s.,!?;:"„“”'’()\[\]{}]+|[\s.,!?;:"„“”'’()\[\]{}]+$/g, '');
};
const lower = (value) => normalize(value).toLocaleLowerCase('de-DE');
const lowerEntryKeys = new Map();
for (const lemma of Object.keys(DICT_ENTRIES)) {
  const k = lower(lemma);
  lowerEntryKeys.set(k, [...new Set([...(lowerEntryKeys.get(k) || []), lemma])]);
}
const vocabExact = new Map(VOCAB.map(word => [word.de, word]));

function mergedEntry(lemma, core) {
  // Preserve lexical casing: Bitte/bitte and Deutsch/deutsch are distinct.
  const vocab = vocabExact.get(lemma);
  if (!vocab) return { lemma, ...core };
  return {
    lemma: vocab.de,
    ...core,
    ...vocab,
    pos: vocab.pos || core.pos || (vocab.art ? 'n.' : ''),
    art: vocab.art ?? core.art ?? null,
    pl: vocab.pl ?? core.pl ?? null,
    zh: vocab.zh || core.zh || '',
  };
}

function lemmasFor(raw) {
  const token = normalize(raw);
  if (!token) return [];
  const firstCap = token ? token[0].toLocaleUpperCase('de-DE') + token.slice(1) : token;
  const candidates = [];
  // Exact casing is ranked first, but a homographic inflection may still be a
  // useful second result (weiß adjective / wissen verb).
  const exact = DICT_ENTRIES[token];
  if (exact) candidates.push(...exact.map(core => ({ lemma: token, core, rank: 0 })));
  const lowerToken = lower(token);
  // A capitalized sentence token keeps the lowercase lexical homograph as a
  // second candidate (Bitte/bitte, Morgen/morgen) after the exact noun.
  if (token !== lowerToken && DICT_ENTRIES[lowerToken])
    candidates.push(...DICT_ENTRIES[lowerToken].map(core => ({ lemma: lowerToken, core, rank: 1 })));
  // Forgive a lowercase noun only when no exact lowercase lemma exists.
  if (!exact && token === lowerToken && firstCap !== token && DICT_ENTRIES[firstCap])
    candidates.push(...DICT_ENTRIES[firstCap].map(core => ({ lemma: firstCap, core, rank: 1 })));
  const fromForm = DICT_FORMS[lower(token)] || [];
  candidates.push(...fromForm.flatMap(lemma =>
    (DICT_ENTRIES[lemma] || []).map(core => ({ lemma, core, rank: 2 }))));
  if (candidates.length) return candidates.filter((candidate, index, list) =>
    list.findIndex(x => x.lemma === candidate.lemma && x.core.pos === candidate.core.pos) === index);
  // Conservative suffix fallback for words that are not in the generated form table.
  const word = lower(token);
  const suffixes = ['est', 'en', 'ern', 'em', 'er', 'es', 'st', 'te', 'e', 'n', 't', 's'];
  for (const suffix of suffixes) {
    if (word.length <= suffix.length + 2 || !word.endsWith(suffix)) continue;
    for (const lemma of lowerEntryKeys.get(word.slice(0, -suffix.length)) || [])
      for (const core of DICT_ENTRIES[lemma] || []) candidates.push({ lemma, core, rank: 3 });
  }
  return candidates.filter((candidate, index, list) =>
    list.findIndex(x => x.lemma === candidate.lemma && x.core.pos === candidate.core.pos) === index);
}

/** Return no more than two useful candidates. Sentence-initial capitalisation favours nouns. */
export function lookup(raw) {
  const token = normalize(raw);
  const isCapitalized = /^\p{Lu}/u.test(token);
  const candidates = lemmasFor(token).map(({ lemma, core, rank }) => ({ ...mergedEntry(lemma, core), _rank: rank }));
  candidates.sort((a, b) => {
    const formalSieBias = (x) => (token === 'Sie' && x.pos === 'pron.' ? -2 : 0);
    const formalIhrBias = (x) => /^Ihr/.test(token) && x.lemma === 'Ihr' ? -2
      : /^ihr/.test(token) && x.lemma === 'ihr' ? -2 : 0;
    const nounBias = (x) => (isCapitalized && (x.art || x.pos === 'n.') ? -1 : 0);
    return a._rank - b._rank
      || formalSieBias(a) - formalSieBias(b)
      || formalIhrBias(a) - formalIhrBias(b)
      || nounBias(a) - nounBias(b)
      || a.lemma.localeCompare(b.lemma, 'de');
  });
  return candidates.slice(0, 2).map(({ _rank, ...entry }) => entry);
}

function closePop(pop) {
  pop?.remove();
  document.removeEventListener('pointerdown', pop?._closeOutside, true);
}

export function clearDictPop() {
  const pop = document.querySelector('.gloss-pop');
  if (pop) closePop(pop);
}

function readingGlossResult(word, entry) {
  const global = lookup(word);
  if (global.length) {
    return global.map((candidate, index) => index === 0
      ? { ...candidate, zh: entry.zh || candidate.zh }
      : candidate);
  }
  const rawBase = String(entry.base || word).trim();
  const article = rawBase.match(/^(der|die|das)\s+/i)?.[1]?.toLowerCase() || null;
  const lemma = rawBase
    .replace(/^(der|die|das)\s+/i, '')
    .split(/[,=(（]/, 1)[0]
    .trim() || normalize(word);
  return [{ lemma, zh: entry.zh || '', art: entry.art || article, pl: entry.pl || null, pos: entry.pos || '' }];
}

/** Display one lookup result. A reading glossary entry may be passed as `entry`. */
export function showDictPop(word, { entry, sentence = '', source = '' } = {}) {
  clearDictPop();
  const result = entry?.base
    ? readingGlossResult(word, entry)
    : (entry ? [entry] : lookup(word));
  const first = result[0];
  const title = first?.lemma || normalize(word);
  const vocabWord = vocabExact.get(title);
  const wordbookId = `d:${title}`;
  const knownWord = !!vocabWord;
  const alreadyAdded = !!getWordbook()[wordbookId];
  const details = result.length
    ? result.map((item, index) => `<div class="dict-result${index ? ' dict-alt' : ''}">
        <div class="dict-lemma de">${item.art ? `<span class="dict-art ${esc(item.art)}">${esc(item.art)}</span> ` : ''}${esc(item.lemma)}</div>
        ${item.pl ? `<div class="dict-pl">复数 die ${esc(item.pl)}</div>` : ''}
        ${item.pos ? `<span class="wc-pos">${esc(item.pos)}</span>` : ''} ${esc(item.zh || '暂无中文释义')}
      </div>`).join('')
    : `<div class="dict-result"><div class="dict-lemma de">${esc(title)}</div><div>暂未收录，可到 DWDS 查询。</div></div>`;
  const pop = el(`<div class="gloss-pop dict-pop" role="dialog" aria-label="查词">
    <button class="dict-close" aria-label="关闭">✕</button>
    ${details}
    <div class="dict-actions"><span class="dict-audio"></span>
      <button class="btn small dict-add" ${knownWord || alreadyAdded || !first?.zh ? 'disabled' : ''}>${knownWord ? '✓ 课程词已收录' : alreadyAdded ? '✓ 已加入生词本' : '➕ 加入生词本'}</button>
      <a class="btn small${first ? ' secondary' : ''}" target="_blank" rel="noopener" href="https://www.dwds.de/wb/${encodeURIComponent(title)}">DWDS ›</a>
    </div>
  </div>`);
  pop.querySelector('.dict-audio')?.appendChild(audioBtn(first?.art ? `${first.art} ${title}` : title));
  pop.querySelector('.dict-close').addEventListener('click', () => closePop(pop));
  pop.querySelector('.dict-add')?.addEventListener('click', () => {
    if (!first?.zh || knownWord) return;
    addWordEntry({ lemma: title, zh: first.zh, art: first.art || null, pl: first.pl || null,
      pos: first.pos || '', sentence, source });
    pop.querySelector('.dict-add').disabled = true;
    pop.querySelector('.dict-add').textContent = '✓ 已加入生词本';
    toast('已加入生词本');
  });
  pop._closeOutside = (event) => { if (!pop.contains(event.target)) closePop(pop); };
  document.body.appendChild(pop);
  setTimeout(() => document.addEventListener('pointerdown', pop._closeOutside, true));
  setTimeout(() => closePop(pop), 10000);
  return pop;
}

function tokenAtPoint(event) {
  const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
  const pos = !range && document.caretPositionFromPoint?.(event.clientX, event.clientY);
  const node = range?.startContainer || pos?.offsetNode;
  const offset = range?.startOffset ?? pos?.offset;
  if (!node || node.nodeType !== Node.TEXT_NODE || typeof offset !== 'number') return '';
  const text = node.textContent || '';
  const left = text.slice(0, offset).match(/[\p{L}ÄÖÜäöüßẞ’'-]+$/u)?.[0] || '';
  const right = text.slice(offset).match(/^[\p{L}ÄÖÜäöüßẞ’'-]+/u)?.[0] || '';
  return `${left}${right}`;
}

/** Enable click-to-lookup without re-tokenising the rendered content. */
export function enableGloss(rootEl, { glossary = {}, sentenceSelector = '', source = '' } = {}) {
  rootEl?.addEventListener('click', (event) => {
    if (event.__dictHandled) return;
    if (event.target.closest('button,a,input,textarea,select,[data-no-gloss]')) return;
    const word = tokenAtPoint(event);
    if (!word) return; // browsers without a caret API degrade silently.
    event.__dictHandled = true;
    const sentenceEl = sentenceSelector ? event.target.closest(sentenceSelector) : null;
    const sentence = sentenceEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const glossaryEntry = glossary[lower(word)];
    showDictPop(word, { entry: glossaryEntry, sentence, source });
  });
}

export { DICT_POS };
