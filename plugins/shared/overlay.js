// Internal ownership only: public plugin APIs remain independent.
const stack = [];
const locks = new Map(); // owner -> element that keeps the lock alive
let originalBody = null;
const handledKeys = new WeakSet();

// Negative tabindex values are programmatic-only targets and must not receive restored focus.
export const FOCUSABLE_SELECTOR = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [contenteditable="true"], [tabindex]:not([tabindex^="-"])';

// A shared layer (one portal for several alerts) keeps its bump until its last entry leaves.
const restoreZ = entry => {
  if (stack.some(other => other.layer === entry.layer)) return;
  entry.layer.style.setProperty('z-index', entry.originalZ.value, entry.originalZ.priority);
};

function restoreBody() {
  if (locks.size !== 0 || !originalBody) return;
  document.body.style.overflow = originalBody.overflow;
  document.body.style.paddingRight = originalBody.padding;
  document.body.classList.toggle('overflow-hidden', originalBody.hidden);
  originalBody = null;
}

/**
 * Drops stack and scroll-lock entries whose element was removed without a close call
 * (Livewire morphing, Turbo navigation, innerHTML swaps) so the body lock always recovers.
 */
export function pruneOverlays() {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (!stack[i].element?.isConnected) restoreZ(stack.splice(i, 1)[0]);
  }
  for (const [owner, element] of Array.from(locks.entries())) {
    if (!element?.isConnected) locks.delete(owner);
  }
  restoreBody();
}

/**
 * @param {object} owner Plugin instance owning the overlay.
 * @param {HTMLElement} element Overlay root used for focus and connection checks.
 * @param {boolean} [lockScroll=true]
 * @param {HTMLElement} [layer=element] Element that creates the stacking context (e.g. a portal) and receives the z-index bump.
 */
export function acquireOverlay(owner, element, lockScroll = true, layer = element) {
  pruneOverlays();
  if (!stack.some(entry => entry.owner === owner)) {
    const sibling = stack.find(entry => entry.layer === layer);
    const previous = stack.findLast(entry => entry.layer !== layer)?.layer;
    const originalZ = sibling ? sibling.originalZ
      : { value: layer.style.zIndex, priority: layer.style.getPropertyPriority('z-index') };
    if (previous && !sibling) {
      const z = Math.max(parseInt(getComputedStyle(layer).zIndex, 10) || 0,
        (parseInt(getComputedStyle(previous).zIndex, 10) || 0) + 1);
      layer.style.setProperty('z-index', String(z));
    }
    stack.push({ owner, element, layer, originalZ });
  }
  if (!lockScroll || locks.has(owner)) return;
  if (locks.size === 0) {
    const body = document.body;
    originalBody = { overflow: body.style.overflow, padding: body.style.paddingRight,
      hidden: body.classList.contains('overflow-hidden') };
    const width = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (width) body.style.paddingRight = `${(parseFloat(getComputedStyle(body).paddingRight) || 0) + width}px`;
    body.style.overflow = 'hidden';
    body.classList.add('overflow-hidden');
  }
  locks.set(owner, element);
}

export function isTopOverlay(owner) {
  pruneOverlays();
  return stack.at(-1)?.owner === owner;
}

/** True when any modal overlay is registered (non-modal panels use this to yield keys). */
export function hasOverlay() {
  pruneOverlays();
  return stack.length > 0;
}

// One keyboard event belongs to one overlay even if closing is synchronous.
export function claimOverlayKey(owner, event) {
  if (!isTopOverlay(owner) || handledKeys.has(event)) return false;
  handledKeys.add(event);
  return true;
}

/** Claims a key for a panel that is not on the modal stack (non-modal drawer) when no modal overlay is open. */
export function claimFreeKey(event) {
  if (hasOverlay() || handledKeys.has(event)) return false;
  handledKeys.add(event);
  return true;
}

export function releaseOverlay(owner, focusTarget = null) {
  const index = stack.findIndex(entry => entry.owner === owner);
  const wasTop = index !== -1 && index === stack.length - 1;
  const removed = index === -1 ? null : stack.splice(index, 1)[0];
  // Preserve the underlying trigger if its owning overlay closes out of order.
  if (removed) {
    restoreZ(removed);
    for (const entry of stack) {
      const key = 'previousActiveElement' in entry.owner ? 'previousActiveElement' : '_triggerElement';
      if (removed.element?.contains(entry.owner[key])) entry.owner[key] = focusTarget;
    }
  }
  locks.delete(owner);
  pruneOverlays();
  if (!wasTop) return;
  const top = stack.at(-1)?.element;
  const target = top && !top.contains(focusTarget)
    ? top.querySelector(FOCUSABLE_SELECTOR) || top
    : focusTarget;
  if (target?.isConnected && typeof target.focus === 'function') target.focus();
}

/**
 * Focus-trap step shared by overlays: keeps Tab inside `container`, pulling focus back in
 * when it escaped or when the container has no focusable children.
 * @returns {boolean} true when the event was handled.
 */
export function trapTab(container, event, selector = FOCUSABLE_SELECTOR) {
  if (event.key !== 'Tab' || !container) return false;
  const focusables = Array.from(container.querySelectorAll(selector))
    .filter(el => !el.closest('[inert], [hidden]') && el.getClientRects().length > 0);
  const active = document.activeElement;
  if (focusables.length === 0) {
    event.preventDefault();
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
    container.focus();
    return true;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!container.contains(active) || active === container) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return true;
  }
  if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); return true; }
  if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); return true; }
  return false;
}
