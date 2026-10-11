// Internal rendering helpers: text is escaped by default, HTML is an explicit opt-in.
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Writes trusted HTML only when allowed; everything else becomes a text node.
export function setContent(element, value, allowHTML = false) {
  if (value instanceof Node) element.replaceChildren(value);
  else if (allowHTML) element.innerHTML = String(value ?? '');
  else element.textContent = String(value ?? '');
  return element;
}

// Attribute values are decoded by the browser, so data-* content is always treated as text.
export function readDataText(element, name) {
  return element.hasAttribute(name) ? element.getAttribute(name) : null;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Destroys registered instances whose element is inside root or no longer connected.
export function destroyInstances(instances, root = document, elementOf = (key, instance) => key) {
  const destroyed = [];
  for (const [key, instance] of Array.from(instances.entries())) {
    const element = elementOf(key, instance);
    const inside = element instanceof Node && (root === document ? true : root.contains(element));
    if (!element?.isConnected || inside) {
      instance?.destroy?.();
      instances.delete(key);
      destroyed.push(instance);
    }
  }
  return destroyed;
}

// Removes instances detached by Livewire morphing, Turbo or innerHTML swaps.
export function pruneInstances(instances, elementOf = (key, instance) => key) {
  for (const [key, instance] of Array.from(instances.entries())) {
    const element = elementOf(key, instance);
    if (!element?.isConnected) {
      instance?.destroy?.();
      instances.delete(key);
    }
  }
}
