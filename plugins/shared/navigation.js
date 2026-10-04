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
