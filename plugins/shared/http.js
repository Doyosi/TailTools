// Internal Laravel-aware HTTP helpers shared by form, button, upload, select and collection plugins.

const readCookie = name => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Resolves Laravel CSRF headers. The plain token (meta, form _token or window.csrfToken)
 * is sent as X-CSRF-TOKEN; the encrypted XSRF-TOKEN cookie is only valid as X-XSRF-TOKEN.
 */
export function csrfHeaders(form = null) {
  if (typeof document === 'undefined') return {};
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    || form?.querySelector?.('input[name="_token"]')?.value
    || (typeof window !== 'undefined' && typeof window.csrfToken === 'string' ? window.csrfToken : null);
  if (token) return { 'X-CSRF-TOKEN': token };
  const cookie = readCookie('XSRF-TOKEN');
  return cookie ? { 'X-XSRF-TOKEN': cookie } : {};
}

export function hasHeader(headers, name) {
  const lower = name.toLowerCase();
  return Object.keys(headers || {}).some(key => key.toLowerCase() === lower);
}

/** Default request headers for Laravel JSON endpoints; caller headers win. */
export function laravelHeaders(extra = {}, { form = null, accept = 'application/json', csrf = true } = {}) {
  const headers = { Accept: accept, 'X-Requested-With': 'XMLHttpRequest' };
  if (csrf) Object.assign(headers, csrfHeaders(form));
  for (const [key, value] of Object.entries(extra || {})) {
    for (const existing of Object.keys(headers)) {
      if (existing.toLowerCase() === key.toLowerCase()) delete headers[existing];
    }
    headers[key] = value;
  }
  return headers;
}

export const isSafeMethod = method => ['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase());

/** Prefers an explicitly configured axios instance over Laravel's bootstrap window.axios. */
export function resolveAxios(instance) {
  if (instance && typeof instance.request === 'function') return instance;
  if (typeof window !== 'undefined' && window.axios && typeof window.axios.request === 'function') return window.axios;
  return null;
}

/**
 * Converts flat bracket keys ("filters[role]") and arrays into nested JSON so Laravel
 * reads them as filters.role.
 */
export function nestParams(params = {}) {
  const result = {};
  for (const [rawKey, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const parts = rawKey.replace(/\]/g, '').split('[').filter((part, index) => index === 0 || part !== '');
    let target = result;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) target[part] = value;
      else target = target[part] = target[part] && typeof target[part] === 'object' ? target[part] : {};
    });
  }
  return result;
}

/** Appends params to URLSearchParams; arrays become key[]=a&key[]=b like PHP expects. */
export function appendQuery(searchParams, params = {}) {
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    if (Array.isArray(value)) {
      searchParams.delete(key);
      for (const item of value) if (item != null && item !== '') searchParams.append(`${key}[]`, String(item));
    } else if (typeof value === 'object') {
      for (const [child, childValue] of Object.entries(value)) appendQuery(searchParams, { [`${key}[${child}]`]: childValue });
    } else searchParams.set(key, String(value));
  }
  return searchParams;
}

/** Error carrying the HTTP status and parsed Laravel payload ({ message, errors }). */
export class HttpError extends Error {
  constructor(status, statusText = '', data = null) {
    const fallback = status === 419 ? 'CSRF token mismatch.' : `HTTP Error: ${status} ${statusText}`.trim();
    super((data && typeof data === 'object' && typeof data.message === 'string' && data.message) || fallback);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.errors = data && typeof data === 'object' && data.errors && typeof data.errors === 'object' ? data.errors : null;
  }
}

export function parseBody(text, contentType = '') {
  if (!text) return null;
  if (contentType.includes('json') || /^\s*[[{]/.test(text)) {
    try { return JSON.parse(text); } catch { /* fall through */ }
  }
  return text;
}

/** First validation message for a field (supports "file", "file.0" and "file.*" keys). */
export function firstFieldError(errors, field) {
  if (!errors || typeof errors !== 'object') return null;
  const base = String(field || '').replace(/\[\]$/, '').replace(/\[(\w*)\]/g, '.$1');
  for (const [key, messages] of Object.entries(errors)) {
    if (key === base || key.startsWith(`${base}.`)) return Array.isArray(messages) ? messages[0] : String(messages);
  }
  const first = Object.values(errors)[0];
  return Array.isArray(first) ? first[0] : first ? String(first) : null;
}

/** Normalizes fetch, XHR and axios failures into a readable message. */
export function errorMessage(error, field = null) {
  const data = error?.data ?? error?.response?.data;
  const fieldMessage = firstFieldError(data?.errors, field);
  if (fieldMessage) return fieldMessage;
  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message) return data.message;
  const status = error?.status ?? error?.response?.status;
  if (status === 419) return 'CSRF token mismatch.';
  return error?.message || 'Request failed.';
}

/** True when fetch/XHR transparently followed a server redirect to another URL. */
export function wasRedirected(response, requestedUrl) {
  if (!response) return false;
  if (response.redirected) return true;
  const finalUrl = response.url || response.responseURL;
  if (!finalUrl || !requestedUrl || typeof window === 'undefined') return false;
  try {
    return new URL(finalUrl, window.location.href).href !== new URL(requestedUrl, window.location.href).href;
  } catch { return false; }
}
