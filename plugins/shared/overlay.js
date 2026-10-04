// Internal ownership only: public plugin APIs remain independent.
const stack = [];
const locks = new Set();
let originalBody = null;
const handledKeys = new WeakSet();

export function acquireOverlay(owner, element, lockScroll = true) {
  if (!stack.some(entry => entry.owner === owner)) {
    const previous = stack.at(-1)?.element;
    const originalZ = { value: element.style.zIndex, priority: element.style.getPropertyPriority('z-index') };
    if (previous) {
      const z = Math.max(parseInt(getComputedStyle(element).zIndex, 10) || 0,
        (parseInt(getComputedStyle(previous).zIndex, 10) || 0) + 1);
      element.style.setProperty('z-index', String(z));
    }
    stack.push({ owner, element, originalZ });
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
  locks.add(owner);
}

export function isTopOverlay(owner) { return stack.at(-1)?.owner === owner; }

// One keyboard event belongs to one overlay even if closing is synchronous.
export function claimOverlayKey(owner, event) {
  if (!isTopOverlay(owner) || handledKeys.has(event)) return false;
  handledKeys.add(event);
  return true;
}

export function releaseOverlay(owner, focusTarget = null) {
  const index = stack.findIndex(entry => entry.owner === owner);
  const wasTop = index !== -1 && index === stack.length - 1;
  const removed = index === -1 ? null : stack.splice(index, 1)[0];
  // Preserve the underlying trigger if its owning overlay closes out of order.
  if (removed) {
    removed.element.style.setProperty('z-index', removed.originalZ.value, removed.originalZ.priority);
    for (const entry of stack) {
      const key = 'previousActiveElement' in entry.owner ? 'previousActiveElement' : '_triggerElement';
      if (removed.element?.contains(entry.owner[key])) entry.owner[key] = focusTarget;
    }
  }
  if (locks.delete(owner) && locks.size === 0 && originalBody) {
    document.body.style.overflow = originalBody.overflow;
    document.body.style.paddingRight = originalBody.padding;
    document.body.classList.toggle('overflow-hidden', originalBody.hidden);
    originalBody = null;
  }
  if (!wasTop) return;
  const top = stack.at(-1)?.element;
  const target = top && !top.contains(focusTarget)
    ? top.querySelector('button:not([disabled]), input:not([disabled]), [tabindex]') || top
    : focusTarget;
  if (target?.isConnected && typeof target.focus === 'function') target.focus();
}
