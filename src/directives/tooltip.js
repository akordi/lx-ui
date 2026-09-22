// Handlers reference each other mutually (hide <-> unbindGlobals), so ordering cannot satisfy this
/* eslint-disable no-use-before-define */
import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';
import { safeMatchMedia } from '@/utils/accessibilityUtils';

// v-tooltip: LxTooltip-styled hover tooltip that does not wrap its trigger.
// Registered globally by createLx. See docs/Directives.md.

// Timings and distances mirror LxTooltip (src/components/Tooltip.vue)
export const OPEN_DELAY = 300;
export const CLOSE_DELAY = 100;
export const MOVE_THRESHOLD = 20;
// Pseudo height of the cursor – the panel is offset this far below the pointer
export const CURSOR_HEIGHT = 18;

const PANEL_ID = 'lx-tooltip-panel';
const MARKER_ATTR = 'data-lx-tooltip';
const HIGH_Z_INDEX = '9000';
const NESTED_TOOLTIP_SELECTOR = '.lx-info-wrapper-content.lx-tooltip-kind';

const registry = new WeakMap();
// Events already claimed by a nested trigger; weak so dispatched events stay collectable
const handledMoves = new WeakSet();

const state = {
  armedEl: null,
  currentEl: null,
  isOpen: false,
  openTimer: null,
  closeTimer: null,
  savedCursorPos: null,
  nodes: null,
  globalsBound: false,
  hitTestBound: false,
  hitTestFrame: null,
  disabledCount: 0,
};

function hasDocument() {
  return typeof document !== 'undefined';
}

function isElementDisabled(el) {
  return el.disabled === true || el.hasAttribute('disabled');
}

function normalizeValue(value) {
  let text = '';
  let suppressed = false;

  if (typeof value === 'string' || typeof value === 'number') {
    text = String(value);
  } else if (value && typeof value === 'object') {
    const raw = value.value;
    if (typeof raw === 'string' || typeof raw === 'number') text = String(raw);
    suppressed = Boolean(value.disabled);
  }

  return { text: text.trim() ? text : '', suppressed };
}

function isInert(el, entry) {
  if (!entry?.text || entry.suppressed) return true;
  // Touch devices never get a hover tooltip
  if (safeMatchMedia('(hover: none)')?.matches === true) return true;
  // Already inside an LxTooltip – let the component own the hover
  if (el.closest(NESTED_TOOLTIP_SELECTOR)) return true;
  return false;
}

function resolveContainer(el) {
  if (!hasDocument()) return null;
  return document.getElementById('poppers') || el.closest('.lx-layout') || document.body;
}

function ensureNodes() {
  if (state.nodes) return state.nodes;

  const popper = document.createElement('div');
  popper.className = 'popper higher-z-index';
  popper.style.position = 'fixed';

  const wrapper = document.createElement('div');
  wrapper.className = 'lx-info-wrapper lx-tooltip-kind';

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'lx-info-wrapper-panel';
  panel.setAttribute('role', 'tooltip');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.setProperty('--info-popper-spacer-size', '13px');

  const area = document.createElement('div');
  area.className = 'lx-info-wrapper-panel-area';

  const text = document.createElement('p');
  text.className = 'lx-tooltip-text';

  area.appendChild(text);
  panel.appendChild(area);
  wrapper.appendChild(panel);
  popper.appendChild(wrapper);

  // Moving the pointer onto the panel dismisses it, same as LxTooltip
  wrapper.addEventListener('mousemove', hide);
  wrapper.addEventListener('mouseleave', handleLeave);
  panel.addEventListener('click', onPanelClick);

  state.nodes = { popper, wrapper, panel, text };
  return state.nodes;
}

function positionPanel(x, y) {
  const { popper } = state.nodes;
  const viewportWidth = globalThis.innerWidth || 0;
  const viewportHeight = globalThis.innerHeight || 0;
  const popperWidth = popper.offsetWidth || 0;
  const popperHeight = popper.offsetHeight || 0;

  const left = Math.min(Math.max(x, 0), Math.max(viewportWidth - popperWidth, 0));
  const top = Math.min(Math.max(y, 0), Math.max(viewportHeight - popperHeight, 0));

  popper.style.left = `${left}px`;
  popper.style.top = `${top}px`;
}

function clearOpenTimer() {
  if (state.openTimer) {
    clearTimeout(state.openTimer);
    state.openTimer = null;
  }
  state.armedEl = null;
}

function clearCloseTimer() {
  if (state.closeTimer) {
    clearTimeout(state.closeTimer);
    state.closeTimer = null;
  }
}

function onKeydown(event) {
  // WCAG 1.4.13 – hover content must be dismissible without moving the pointer
  if (event.key === 'Escape') hide();
}

function bindGlobals() {
  if (state.globalsBound || !hasDocument()) return;
  document.addEventListener('scroll', hide, { capture: true, passive: true });
  document.addEventListener('contextmenu', hide);
  document.addEventListener('visibilitychange', hide);
  document.addEventListener('keydown', onKeydown);
  globalThis.addEventListener?.('resize', hide);
  state.globalsBound = true;
}

function unbindGlobals() {
  if (!state.globalsBound) return;
  document.removeEventListener('scroll', hide, { capture: true });
  document.removeEventListener('contextmenu', hide);
  document.removeEventListener('visibilitychange', hide);
  document.removeEventListener('keydown', onKeydown);
  globalThis.removeEventListener?.('resize', hide);
  state.globalsBound = false;
}

function show(el, cursorX, cursorY) {
  const entry = registry.get(el);
  if (!entry?.text) return;

  const container = resolveContainer(el);
  if (!container) return;

  const nodes = ensureNodes();

  nodes.text.textContent = entry.text;

  // LxButton already renders its own hidden description, so don't announce the text twice
  const ownsAria = !el.getAttribute('aria-describedby');
  entry.ownsAria = ownsAria;
  nodes.panel.setAttribute('aria-hidden', ownsAria ? 'false' : 'true');
  if (ownsAria) el.setAttribute('aria-describedby', PANEL_ID);

  // The z-index rules are scoped to `.lx .lx-layout .popper`; fall back to an inline value
  const styledByCss = Boolean(container.closest('.lx-layout')) && Boolean(container.closest('.lx'));
  nodes.popper.style.zIndex = styledByCss ? '' : HIGH_Z_INDEX;

  if (!nodes.popper.isConnected || nodes.popper.parentNode !== container) {
    container.appendChild(nodes.popper);
  }

  state.currentEl = el;
  state.isOpen = true;
  state.savedCursorPos = { x: cursorX, y: cursorY };

  // Must run after insertion – the clamp needs the panel's measured size
  positionPanel(cursorX, cursorY + CURSOR_HEIGHT);
}

function hide() {
  clearOpenTimer();
  clearCloseTimer();

  const el = state.currentEl;
  if (el) {
    const entry = registry.get(el);
    if (entry?.ownsAria) {
      el.removeAttribute('aria-describedby');
      entry.ownsAria = false;
    }
  }

  const { nodes } = state;
  if (nodes) {
    nodes.popper.remove();
    nodes.panel.setAttribute('aria-hidden', 'true');
    nodes.text.textContent = '';
  }

  state.currentEl = null;
  state.isOpen = false;
  state.savedCursorPos = null;

  unbindGlobals();
}

function scheduleClose() {
  clearCloseTimer();
  state.closeTimer = setTimeout(() => {
    state.closeTimer = null;
    hide();
  }, CLOSE_DELAY);
}

function handleMove(el, clientX, clientY) {
  const entry = registry.get(el);
  if (isInert(el, entry)) return false;

  clearCloseTimer();

  if (state.currentEl === el && state.isOpen) {
    const saved = state.savedCursorPos;
    if (saved && Math.hypot(saved.x - clientX, saved.y - clientY) > MOVE_THRESHOLD) {
      hide();
    }
    return true;
  }

  if (state.currentEl && state.currentEl !== el) hide();

  clearOpenTimer();
  state.armedEl = el;
  bindGlobals();
  state.openTimer = setTimeout(() => {
    state.openTimer = null;
    state.armedEl = null;
    show(el, clientX, clientY);
  }, OPEN_DELAY);

  return true;
}

function handleLeave(event) {
  clearOpenTimer();

  const related = event?.relatedTarget;
  const triggerEl = state.currentEl;
  const panelEl = state.nodes?.popper;

  // Moving between the trigger and its panel must not dismiss it
  const stayingInside =
    related instanceof Element &&
    ((triggerEl instanceof Element && triggerEl.contains(related)) ||
      (panelEl instanceof Element && panelEl.contains(related)));

  if (stayingInside) return;

  scheduleClose();
}

function onPanelClick(event) {
  event.preventDefault();
  hide();
}

function onTriggerMove(event) {
  // mousemove bubbles, so the nearest trigger claims the event and ancestors stand down
  if (handledMoves.has(event)) return;
  if (handleMove(event.currentTarget, event.clientX, event.clientY)) handledMoves.add(event);
}

function onTriggerLeave(event) {
  handleLeave(event);
}

function onTriggerBlur() {
  hide();
}

function runHitTest(clientX, clientY) {
  if (state.currentEl && !state.currentEl.isConnected) {
    hide();
    return;
  }

  const hit = document.elementFromPoint?.(clientX, clientY);
  const el = hit instanceof Element ? hit.closest(`[${MARKER_ATTR}]`) : null;

  if (el && registry.has(el) && isElementDisabled(el)) {
    handleMove(el, clientX, clientY);
    return;
  }

  // Disabled triggers get no mouseleave either, so dismiss from here as well
  if (state.currentEl && state.currentEl !== el && isElementDisabled(state.currentEl)) {
    scheduleClose();
  }
}

function onDocumentMove(event) {
  if (state.hitTestFrame) return;
  const { clientX, clientY } = event;
  state.hitTestFrame = globalThis.requestAnimationFrame(() => {
    state.hitTestFrame = null;
    runHitTest(clientX, clientY);
  });
}

function bindHitTest() {
  if (state.hitTestBound || !hasDocument() || !globalThis.requestAnimationFrame) return;
  document.addEventListener('mousemove', onDocumentMove, { passive: true });
  state.hitTestBound = true;
}

function unbindHitTest() {
  if (!state.hitTestBound) return;
  document.removeEventListener('mousemove', onDocumentMove);
  if (state.hitTestFrame) {
    globalThis.cancelAnimationFrame(state.hitTestFrame);
    state.hitTestFrame = null;
  }
  state.hitTestBound = false;
}

// Disabled elements never dispatch mouse events, so they need the document-level hit test.
// It is installed only while at least one such trigger is registered.
function syncDisabledTracking(el) {
  const entry = registry.get(el);
  if (!entry) return;

  const tracked = Boolean(entry.text) && !entry.suppressed && isElementDisabled(el);
  if (tracked === entry.tracked) return;

  entry.tracked = tracked;
  state.disabledCount += tracked ? 1 : -1;
  if (state.disabledCount < 0) state.disabledCount = 0;

  if (state.disabledCount > 0) bindHitTest();
  else unbindHitTest();
}

function applyEntry(el) {
  const entry = registry.get(el);
  if (!entry) return;

  if (entry.text && !entry.suppressed) el.setAttribute(MARKER_ATTR, entry.text);
  else el.removeAttribute(MARKER_ATTR);
  syncDisabledTracking(el);
}

function warnOnTitleConflict(el, entry) {
  if (!entry.text || !el.getAttribute('title')) return;
  logWarn(
    'v-tooltip: element also has a "title" attribute, so the browser will show its own tooltip on top. Remove the "title" attribute.',
    useLx().getGlobals()?.environment
  );
}

function mounted(el, binding) {
  const entry = { ...normalizeValue(binding.value), ownsAria: false, tracked: false };
  registry.set(el, entry);
  applyEntry(el);

  el.addEventListener('mousemove', onTriggerMove);
  el.addEventListener('mouseleave', onTriggerLeave);
  el.addEventListener('blur', onTriggerBlur);

  warnOnTitleConflict(el, entry);
}

function updated(el, binding) {
  const entry = registry.get(el);
  if (!entry) {
    mounted(el, binding);
    return;
  }

  const next = normalizeValue(binding.value);
  const textChanged = next.text !== entry.text;
  entry.text = next.text;
  entry.suppressed = next.suppressed;
  applyEntry(el);

  if (state.currentEl !== el) return;

  if (isInert(el, entry)) {
    hide();
    return;
  }

  if (textChanged && state.isOpen) {
    state.nodes.text.textContent = entry.text;
    const saved = state.savedCursorPos;
    // Re-clamp – the new text may have changed the panel's width
    if (saved) positionPanel(saved.x, saved.y + CURSOR_HEIGHT);
  }
}

function unmounted(el) {
  if (state.armedEl === el) clearOpenTimer();
  if (state.currentEl === el) hide();

  const entry = registry.get(el);
  if (entry) {
    entry.text = '';
    syncDisabledTracking(el);
  }

  el.removeEventListener('mousemove', onTriggerMove);
  el.removeEventListener('mouseleave', onTriggerLeave);
  el.removeEventListener('blur', onTriggerBlur);
  el.removeAttribute(MARKER_ATTR);
  registry.delete(el);

  if (!state.armedEl && !state.currentEl) unbindGlobals();
}

/** Dismisses the currently visible tooltip, if any. */
export function closeTooltip() {
  hide();
}

/** @type {import('vue').ObjectDirective<HTMLElement, string | number | { value?: string, disabled?: boolean }>} */
export const vTooltip = {
  mounted,
  updated,
  unmounted,
  getSSRProps: () => ({}),
};

export default vTooltip;
