const DRAG_THRESHOLD = 7;
const MOVE_DURATION = 220;

export function getInsertionIndex(rects, x, y) {
  if (!rects.length) return 0;
  const cells = rects.map((rect, index) => ({
    index,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    midX: (rect.left + rect.right) / 2,
    midY: (rect.top + rect.bottom) / 2,
  }));
  const rows = [];
  cells.forEach(cell => {
    const row = rows.find(candidate => Math.abs(candidate.midY - cell.midY) < Math.max(12, (cell.bottom - cell.top) * .55));
    if (row) {
      row.cells.push(cell);
      row.top = Math.min(row.top, cell.top);
      row.bottom = Math.max(row.bottom, cell.bottom);
      row.midY = (row.top + row.bottom) / 2;
    } else {
      rows.push({ cells: [cell], top: cell.top, bottom: cell.bottom, midY: cell.midY });
    }
  });
  rows.sort((a, b) => a.top - b.top);
  if (y < rows[0].top) return 0;
  if (y > rows.at(-1).bottom) return rects.length;
  const row = rows.reduce((best, candidate) =>
    Math.abs(candidate.midY - y) < Math.abs(best.midY - y) ? candidate : best, rows[0]);
  row.cells.sort((a, b) => a.left - b.left);
  const before = row.cells.find(cell => x < cell.midX);
  return before ? before.index : row.cells.at(-1).index + 1;
}

export function setupChipBoard({ line, bank, live, onChange, onDrop }) {
  const zones = [line, bank];
  const suppressedClicks = new WeakSet();
  let active = null;
  let locked = false;

  const chipsIn = zone => [...zone.children].filter(child => child.classList.contains('ex-chip'));
  const allChips = () => zones.flatMap(chipsIn);
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function announce(message) {
    if (!live) return;
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = message; });
  }

  function refresh() {
    chipsIn(line).forEach((chip, index, list) => {
      chip.setAttribute('aria-label', `${chip.textContent}，答案第 ${index + 1} 个，共 ${list.length} 个，可用左右方向键调整`);
      chip.setAttribute('aria-pressed', 'true');
    });
    chipsIn(bank).forEach(chip => {
      chip.setAttribute('aria-label', `${chip.textContent}，词库，按空格或回车加入答案`);
      chip.setAttribute('aria-pressed', 'false');
    });
    onChange?.();
  }

  function captureRects() {
    return new Map(allChips().filter(chip => chip !== active?.chip).map(chip => [chip, chip.getBoundingClientRect()]));
  }

  function animateLayout(before) {
    if (reducedMotion()) return;
    before.forEach((oldRect, chip) => {
      const nextRect = chip.getBoundingClientRect();
      const dx = oldRect.left - nextRect.left;
      const dy = oldRect.top - nextRect.top;
      if (Math.abs(dx) < .5 && Math.abs(dy) < .5) return;
      chip.animate([
        { transform: `translate3d(${dx}px,${dy}px,0)` },
        { transform: 'translate3d(0,0,0)' },
      ], { duration: MOVE_DURATION, easing: 'cubic-bezier(.2,.9,.25,1.12)' });
    });
  }

  function insertChip(chip, zone, index) {
    const candidates = chipsIn(zone).filter(candidate => candidate !== chip);
    const before = captureRects();
    zone.insertBefore(chip, candidates[index] || null);
    animateLayout(before);
  }

  function zoneAt(x, y) {
    return zones.find(zone => {
      const rect = zone.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
  }

  function startDrag(event) {
    const chip = active.chip;
    const rect = chip.getBoundingClientRect();
    const ghost = chip.cloneNode(true);
    ghost.className = 'chip-drag-ghost';
    ghost.removeAttribute('aria-label');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);
    chip.classList.add('is-drag-source');
    document.body.classList.add('chip-board-dragging');
    active.dragging = true;
    active.ghost = ghost;
    suppressedClicks.add(chip);
    moveGhost(event);
  }

  function moveGhost(event) {
    if (!active?.ghost) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    active.ghost.style.transform = `translate3d(${dx}px,${dy}px,0) scale(1.055)`;
  }

  function movePlaceholder(event) {
    const zone = zoneAt(event.clientX, event.clientY);
    active.validZone = zone;
    zones.forEach(item => item.classList.toggle('is-drop-target', item === zone));
    if (!zone) return;
    const candidates = chipsIn(zone).filter(chip => chip !== active.chip);
    const index = getInsertionIndex(candidates.map(chip => chip.getBoundingClientRect()), event.clientX, event.clientY);
    const current = chipsIn(zone).filter(chip => chip !== active.chip);
    const currentIndex = chipsIn(zone).indexOf(active.chip);
    if (active.chip.parentElement !== zone || currentIndex !== index) {
      insertChip(active.chip, zone, Math.min(index, current.length));
    }
  }

  function restoreSource() {
    const siblings = chipsIn(active.source).filter(chip => chip !== active.chip);
    insertChip(active.chip, active.source, Math.min(active.sourceIndex, siblings.length));
  }

  function revealAtDestination(cancelled) {
    const { chip, ghost } = active;
    const finish = () => {
      ghost?.remove();
      chip.classList.remove('is-drag-source');
      refresh();
    };
    if (!ghost || reducedMotion() || !ghost.animate) {
      finish();
      return;
    }
    const target = chip.getBoundingClientRect();
    const dx = target.left - active.originRect.left;
    const dy = target.top - active.originRect.top;
    ghost.animate([
      { transform: ghost.style.transform },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(1)` },
    ], { duration: cancelled ? 190 : 160, easing: 'cubic-bezier(.2,.9,.25,1.08)', fill: 'forwards' })
      .finished.then(finish, finish);
  }

  function finishDrag(cancelled = false) {
    if (!active) return;
    const wasDragging = active.dragging;
    if (wasDragging && (cancelled || !active.validZone)) restoreSource();
    zones.forEach(zone => zone.classList.remove('is-drop-target'));
    document.body.classList.remove('chip-board-dragging');
    if (wasDragging) {
      const accepted = !cancelled && !!active.validZone;
      if (accepted) onDrop?.();
      announce(accepted
        ? `${active.chip.textContent} 已放到${active.chip.parentElement === line ? '答案区' : '词库'}`
        : `${active.chip.textContent} 已回到原位`);
      revealAtDestination(!accepted);
    }
    active = null;
    removeDocumentListeners();
  }

  function onPointerMove(event) {
    if (!active || event.pointerId !== active.pointerId) return;
    const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY);
    if (!active.dragging && distance >= DRAG_THRESHOLD) startDrag(event);
    if (!active.dragging) return;
    event.preventDefault();
    moveGhost(event);
    movePlaceholder(event);
  }

  function onPointerUp(event) {
    if (!active || event.pointerId !== active.pointerId) return;
    finishDrag(false);
  }

  function onPointerCancel(event) {
    if (!active || event.pointerId !== active.pointerId) return;
    finishDrag(true);
  }

  function addDocumentListeners() {
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onWindowBlur);
  }

  function removeDocumentListeners() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('blur', onWindowBlur);
  }

  function onWindowBlur() { finishDrag(true); }

  function onPointerDown(event) {
    const chip = event.target.closest('.ex-chip');
    if (locked || !chip || chip.disabled || event.button !== 0 || active) return;
    active = {
      chip,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originRect: chip.getBoundingClientRect(),
      source: chip.parentElement,
      sourceIndex: chipsIn(chip.parentElement).indexOf(chip),
      validZone: chip.parentElement,
      dragging: false,
    };
    addDocumentListeners();
  }

  function onClickCapture(event) {
    const chip = event.target.closest('.ex-chip');
    if (!chip || !suppressedClicks.has(chip)) return;
    suppressedClicks.delete(chip);
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function onKeyDown(event) {
    const chip = event.target.closest('.ex-chip');
    if (locked || !chip || chip.parentElement !== line || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const chips = chipsIn(line);
    const index = chips.indexOf(chip);
    const next = Math.max(0, Math.min(chips.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1)));
    if (next === index) return;
    const without = chips.filter(item => item !== chip);
    const before = captureRects();
    without.splice(next, 0, chip);
    without.forEach(item => line.appendChild(item));
    animateLayout(before);
    refresh();
    chip.focus();
    announce(`${chip.textContent} 已移动到答案第 ${next + 1} 个`);
  }

  zones.forEach(zone => {
    zone.addEventListener('pointerdown', onPointerDown);
    zone.addEventListener('click', onClickCapture, true);
    zone.addEventListener('keydown', onKeyDown);
  });
  refresh();

  return {
    refresh,
    move(chip, zone) {
      if (locked || !zones.includes(zone)) return;
      insertChip(chip, zone, chipsIn(zone).filter(item => item !== chip).length);
      refresh();
      announce(`${chip.textContent} 已移到${zone === line ? '答案区' : '词库'}`);
    },
    lock() {
      locked = true;
      if (active) finishDrag(true);
      zones.forEach(zone => zone.classList.add('is-locked'));
    },
  };
}
