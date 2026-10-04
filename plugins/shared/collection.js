// Internal helpers shared by the grid and table; no public API changes.
export const escapeHTML = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Keep original node identities and their consumer listeners when restoring DOM.
export function captureDOM(node) {
  const attributes = node.nodeType === 1 ? Array.from(node.attributes, a => [a.name, a.value]) : null;
  const children = Array.from(node.childNodes, captureDOM);
  const text = node.nodeValue;
  const state = {};
  for (const key of ['value', 'checked', 'selected']) {
    if (key in node && !(key === 'value' && node.tagName === 'SELECT')) state[key] = node[key];
  }
  return () => {
    if (attributes) {
      for (const attr of Array.from(node.attributes)) node.removeAttribute(attr.name);
      for (const [name, value] of attributes) node.setAttribute(name, value);
    } else node.nodeValue = text;
    node.replaceChildren?.(...children.map(child => child()));
    for (const [key, value] of Object.entries(state)) node[key] = value;
    return node;
  };
}

export function initializeCollection(owner, element) {
  owner._restoreDOM = captureDOM(element);
  owner._destroyed = false;
  owner._requestId = 0;
  owner._dataVersion = 0;
  owner._requestController = null;
  owner._timers = new Set();
  owner._frames = new Set();
}

export function cancelCollectionWork(owner) {
  ++owner._requestId;
  owner._requestController?.abort();
  for (const timer of owner._timers) clearTimeout(timer);
  owner._timers.clear();
  for (const frame of owner._frames) cancelAnimationFrame(frame);
  owner._frames.clear();
}

export function delayCollection(owner, callback, duration = 250) {
  const timer = setTimeout(() => {
    owner._timers.delete(timer);
    if (!owner._destroyed) callback();
  }, duration);
  owner._timers.add(timer);
}

export function frameCollection(owner, callback) {
  const frame = requestAnimationFrame(() => {
    owner._frames.delete(frame);
    if (!owner._destroyed) callback();
  });
  owner._frames.add(frame);
}

export async function fetchCollection(options, params, signal, html = false) {
  const method = String(options.method || 'GET').toUpperCase();
  const bodyless = method === 'GET' || method === 'HEAD';
  const headers = { Accept: html ? 'application/json, text/html' : 'application/json',
    'X-Requested-With': 'XMLHttpRequest', ...options.headers };
  if (options.driver === 'axios' || (options.driver === 'auto' && window.axios)) {
    if (!window.axios?.request) throw new Error('Axios driver requires window.axios.request');
    const response = await window.axios.request({ url: options.url, method, headers, signal,
      params: bodyless ? params : undefined, data: bodyless ? undefined : params });
    return response.data;
  }
  const url = new URL(options.url, window.location.href);
  if (bodyless) for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  if (!bodyless && !Object.keys(headers).some(key => key.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, { method, headers, signal,
    body: bodyless ? undefined : JSON.stringify(params) });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  return html && !(response.headers.get('content-type') || '').includes('json')
    ? response.text() : response.json();
}
