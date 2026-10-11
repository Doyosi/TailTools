// Internal helpers for navigation widgets; restore only owned attributes.
export function captureAttributes(...nodes) {
  const snapshots = [...new Set(nodes.filter(Boolean))].map(node =>
    [node, Array.from(node.attributes, attr => [attr.name, attr.value])]);
  return () => {
    for (const [node, attributes] of snapshots) {
      for (const attr of Array.from(node.attributes)) node.removeAttribute(attr.name);
      for (const [name, value] of attributes) node.setAttribute(name, value);
    }
  };
}

export function ownsNode(root, node, selector, instances) {
  for (let parent = node; parent; parent = parent.parentElement) {
    if (parent === root) return true;
    if (parent.matches(selector) || instances.has(parent)) return false;
  }
  return false;
}

export function readHash() {
  const value = window.location.hash.slice(1);
  try { return decodeURIComponent(value); } catch { return value; }
}

export function registeredInstance(instances, target) {
  if (instances.has(target)) return instances.get(target);
  if (typeof target !== 'string') return null;
  let element = document.getElementById(target);
  if (!element) try { element = document.querySelector(target); } catch {}
  return instances.get(element) || null;
}

export function setPanelAccess(panel, open, trigger) {
  if (!open && panel.contains(document.activeElement)) trigger?.focus();
  panel.inert = !open;
  panel.setAttribute('aria-hidden', String(!open));
}

export function applyDuration(wrapper, icons, value) {
  const duration = Number.isFinite(value) && value >= 0 ? value : 300;
  wrapper.style.setProperty('--cge-accordion-duration', `${duration}ms`);
  for (const node of [wrapper, ...icons.filter(Boolean)]) node.style.transitionDuration = `${duration}ms`;
}

/**
 * Namespaced hash state shared by every tab group on the page:
 *   #outer=billing&inner=invoices
 * Each entry is "<groupKey>=<tabId>" (both URI-encoded) joined with "&". A legacy hash
 * without "=" (#billing) is kept as `plain` so old deep links still resolve.
 * @param {string} raw - location.hash with or without the leading "#"
 * @returns {{ entries: Map<string, string>, plain: string | null }}
 */
export function parseHashState(raw = '') {
  const decode = value => { try { return decodeURIComponent(value); } catch { return value; } };
  const entries = new Map();
  let plain = null;
  const hash = String(raw ?? '').replace(/^#/, '');
  if (!hash) return { entries, plain };
  if (!hash.includes('=')) return { entries, plain: decode(hash) };
  for (const segment of hash.split('&')) {
    if (!segment) continue;
    const index = segment.indexOf('=');
    if (index === -1) { if (plain === null) plain = decode(segment); continue; }
    const key = decode(segment.slice(0, index));
    if (key) entries.set(key, decode(segment.slice(index + 1)));
  }
  return { entries, plain };
}

/** Serializes namespaced entries back to "#a=1&b=2" ("" when empty). */
export function serializeHashState(entries) {
  const parts = [];
  for (const [key, value] of entries) {
    if (value == null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return parts.length ? `#${parts.join('&')}` : '';
}

/** Returns a new hash with one group entry replaced (null removes it); legacy plain ids are dropped. */
export function updateHashState(raw, key, value) {
  const { entries } = parseHashState(raw);
  if (value == null || value === '') entries.delete(key);
  else entries.set(key, value);
  return serializeHashState(entries);
}

/** Keyboard shortcuts with Alt/Ctrl/Meta belong to the browser or app, never to the widget. */
export const hasCommandModifier = event => Boolean(event?.altKey || event?.ctrlKey || event?.metaKey);

/** Resolves text direction from computed style, falling back to the closest dir attribute. */
export function isRtl(element) {
  if (!element) return false;
  const direction = typeof getComputedStyle === 'function' ? getComputedStyle(element).direction : '';
  if (direction) return direction === 'rtl';
  return element.closest?.('[dir]')?.getAttribute('dir')?.toLowerCase() === 'rtl';
}

/** Interactive controls nested inside a trigger keep their own click behavior. */
export const NESTED_INTERACTIVE = 'button, a, input, select, textarea, [data-cge-no-toggle]';

export function nestedInteractive(trigger, target) {
  const node = target instanceof Element ? target.closest(NESTED_INTERACTIVE) : null;
  return Boolean(node && node !== trigger && trigger.contains(node));
}

/**
 * Returns injectable HTML for an AJAX tab panel. HTML/text bodies are returned as-is; JSON
 * bodies (by content type or shape) must carry a string `html` property, anything else throws
 * so raw JSON is never written into innerHTML.
 * @param {unknown} body - response text or an already parsed object (axios)
 * @param {string} [contentType='']
 * @returns {string}
 */
export function panelHtmlFromResponse(body, contentType = '') {
  const type = String(contentType || '').toLowerCase();
  const invalid = () => new TypeError('[CGETabs] JSON tab responses must contain a string "html" property.');
  if (body && typeof body === 'object') {
    if (typeof body.html === 'string') return body.html;
    throw invalid();
  }
  const text = body == null ? '' : String(body);
  const looksJson = /^\s*[[{]/.test(text);
  if (type.includes('json') || looksJson) {
    let parsed;
    try { parsed = JSON.parse(text); } catch {
      if (type.includes('json')) throw invalid();
      return text;
    }
    if (parsed && typeof parsed === 'object' && typeof parsed.html === 'string') return parsed.html;
    throw invalid();
  }
  if (!type || type.includes('html') || type.includes('text/plain')) return text;
  throw new TypeError(`[CGETabs] Unsupported tab response content type "${contentType}".`);
}
