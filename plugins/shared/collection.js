// Internal helpers shared by the grid and table. escapeHTML is re-exported publicly by both plugins
// so cell formatters and card renderers can escape values they interpolate into trusted HTML.
import { laravelHeaders, resolveAxios, nestParams, appendQuery, HttpError, parseBody, hasHeader, isSafeMethod } from './http.js';

export { escapeHTML } from './dom.js';
export { readCollectionResponse, resolveParamNames } from './collection-core.js';

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
  return timer;
}

export function frameCollection(owner, callback) {
  const frame = requestAnimationFrame(() => {
    owner._frames.delete(frame);
    if (!owner._destroyed) callback();
  });
  owner._frames.add(frame);
  return frame;
}

/**
 * Requests a collection page from Laravel. GET/HEAD send params as a query string (arrays as
 * key[]=a&key[]=b); other methods send nested JSON ({ filters: { role } }) with CSRF headers.
 * axiosInstance (or window.axios) is used for driver 'axios' and for 'auto' when available.
 * HTTP failures reject with HttpError carrying the status and the parsed Laravel body.
 */
export async function fetchCollection(options, params, signal, html = false) {
  const method = String(options.method || 'GET').toUpperCase();
  const bodyless = method === 'GET' || method === 'HEAD';
  const accept = html ? 'application/json, text/html' : 'application/json';
  const headers = laravelHeaders(options.headers, { accept, csrf: !isSafeMethod(method) });
  const driver = options.driver || 'auto';
  const axios = driver === 'fetch' ? null : resolveAxios(options.axiosInstance);
  if (driver === 'axios' || (driver === 'auto' && axios)) {
    if (!axios) throw new Error('Axios driver requires an axiosInstance option or window.axios.request');
    const nested = nestParams(params);
    try {
      const response = await axios.request({ url: options.url, method, headers, signal,
        params: bodyless ? nested : undefined, data: bodyless ? undefined : nested });
      return response.data;
    } catch (error) {
      if (error?.response) {
        const failure = new HttpError(error.response.status, error.response.statusText, error.response.data);
        failure.cause = error;
        throw failure;
      }
      throw error;
    }
  }
  const url = new URL(options.url, window.location.href);
  if (bodyless) appendQuery(url.searchParams, params);
  if (!bodyless && !hasHeader(headers, 'content-type')) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { method, headers, signal,
    body: bodyless ? undefined : JSON.stringify(nestParams(params)) });
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!response.ok) throw new HttpError(response.status, response.statusText, parseBody(text, contentType));
  if (html && !contentType.includes('json')) return text;
  return text ? JSON.parse(text) : null;
}
