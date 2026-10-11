// Node regressions for the October 2026 forms stability fixes (CGEForm, CGESelect, CGEDropzone, CGEActionButton).
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { CGEForm } from '../plugins/CGEForm/CGEForm.js';
import { CGESelect } from '../plugins/CGESelect/CGESelect.js';
import { CGEDropzone } from '../plugins/CGEDropzone/CGEDropzone.js';
import { CGEActionButton } from '../plugins/CGEActionButton/CGEActionButton.js';
import { HttpError } from '../plugins/shared/http.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.XMLHttpRequest;
});

const fakeDocument = ({ meta = null, cookie = '' } = {}) => ({
  cookie,
  querySelector: selector => (selector === 'meta[name="csrf-token"]' && meta ? { getAttribute: () => meta } : null)
});
const jsonResponse = (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json' } });
const header = (headers, name) => Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];

// Minimal DOM double that records whether content went through innerHTML or textContent.
class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.textContent = '';
    this.className = '';
    this.html = null;
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  }
  set innerHTML(value) { this.html = String(value); }
  get innerHTML() { return this.html ?? ''; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener() {}
  querySelector() { return null; }
}
const walk = element => [element, ...element.children.flatMap(walk)];
const fakeDomDocument = () => ({ createElement: tag => new FakeElement(tag), querySelector: () => null, cookie: '' });

function actionButton(options = {}, element = { tagName: 'BUTTON', type: 'button', dataset: {}, getAttribute: () => null, closest: () => null }) {
  const button = Object.create(CGEActionButton.prototype);
  button.element = element;
  button.options = { ...CGEActionButton.defaults, ...options, translations: { ...CGEActionButton.translations } };
  button._requestController = new AbortController();
  return button;
}

test('ActionButton sends the encrypted XSRF-TOKEN cookie only as X-XSRF-TOKEN', async () => {
  globalThis.window = { location: { href: 'https://app.test/users' } };
  globalThis.document = fakeDocument({ cookie: 'XSRF-TOKEN=eyJpdiI6%3D%3D' });
  let request;
  globalThis.fetch = async (url, options) => { request = options; return jsonResponse({ ok: true }); };
  await actionButton()._sendHttpRequest('/users/1', 'DELETE');
  assert.equal(header(request.headers, 'X-XSRF-TOKEN'), 'eyJpdiI6==');
  assert.equal(header(request.headers, 'X-CSRF-TOKEN'), undefined);
  assert.equal(header(request.headers, 'X-Requested-With'), 'XMLHttpRequest');
});

test('ActionButton prefers the meta token and lets configured headers win', async () => {
  globalThis.window = { location: { href: 'https://app.test/' } };
  globalThis.document = fakeDocument({ meta: 'plain-token', cookie: 'XSRF-TOKEN=enc' });
  let request;
  globalThis.fetch = async (url, options) => { request = options; return jsonResponse({}); };
  await actionButton({ headers: { Accept: 'text/html' } })._sendHttpRequest('/x', 'POST');
  assert.equal(header(request.headers, 'X-CSRF-TOKEN'), 'plain-token');
  assert.equal(header(request.headers, 'X-XSRF-TOKEN'), undefined);
  assert.equal(header(request.headers, 'Accept'), 'text/html');
});

test('ActionButton uses the configured axiosInstance before window.axios', async () => {
  let used = '';
  globalThis.window = { axios: { request: async () => { used = 'window'; return { data: {} }; } }, location: { href: 'https://app.test/' } };
  globalThis.document = fakeDocument();
  const axiosInstance = { request: async () => { used = 'instance'; return { data: { message: 'Done' } }; } };
  const result = await actionButton({ axiosInstance })._sendHttpRequest('/x', 'POST');
  assert.equal(used, 'instance');
  assert.equal(result.message, 'Done');
});

test('ActionButton turns a followed Laravel redirect into navigation', async () => {
  globalThis.window = { location: { href: 'https://app.test/users' } };
  globalThis.document = fakeDocument();
  globalThis.fetch = async () => ({
    ok: true, status: 200, redirected: true, url: 'https://app.test/dashboard',
    headers: { get: () => 'text/html' }, text: async () => '<html></html>'
  });
  const result = await actionButton()._sendHttpRequest('/users/1', 'DELETE');
  assert.deepEqual(result, { redirect: 'https://app.test/dashboard', redirected: true });
  const disabled = await actionButton({ followRedirects: false })._sendHttpRequest('/users/1', 'DELETE');
  assert.deepEqual(disabled, { success: true });
});

test('ActionButton surfaces Laravel 422/419 messages through HttpError', async () => {
  const toasts = [];
  globalThis.window = { location: { href: 'https://app.test/' }, CGEToast: { error: message => toasts.push(message) } };
  globalThis.document = fakeDocument();
  globalThis.fetch = async () => jsonResponse({ message: 'The given data was invalid.', errors: { name: ['Name is required.'] } }, { status: 422 });
  const button = actionButton();
  const error = await button._sendHttpRequest('/x', 'POST').catch(err => err);
  assert(error instanceof HttpError);
  assert.equal(error.status, 422);
  assert.equal(error.response.status, 422);
  const log = console.error; console.error = () => {};
  try {
    button._handleError(error);
    button._handleError(new HttpError(419, 'unknown status', { message: 'CSRF token mismatch.' }));
  } finally { console.error = log; }
  assert.deepEqual(toasts, ['Name is required.', CGEActionButton.translations['csrf-error']]);
});

test('ActionButton only toasts string messages and redirects on explicit keys', () => {
  const toasts = [];
  globalThis.window = { CGEToast: { success: message => toasts.push(message) }, location: {} };
  const button = actionButton({ redirectTimeout: 0 });
  button._handleSuccess({ success: true, url: '/users/1' });
  assert.deepEqual(toasts, []);
  assert.equal(button._isRedirecting, undefined);
  button._handleSuccess({ message: 'Deleted', redirect_url: '/users' });
  clearTimeout(button._redirectTimer);
  assert.deepEqual(toasts, ['Deleted']);
  assert.equal(button._isRedirecting, true);
});

test('ActionButton anchors navigate unless AJAX is explicit', () => {
  const anchor = dataset => ({ tagName: 'A', dataset, getAttribute: name => (name === 'href' ? '/users/1' : null) });
  const resolve = dataset => CGEActionButton.prototype._resolveOptions.call({ element: anchor(dataset) }, {});
  assert.equal(resolve({ cgeConfirm: 'Leave?' }).url, null);
  assert.equal(resolve({ cgeConfirm: 'Delete?', cgeAjax: '' }).url, '/users/1');
  assert.equal(resolve({ cgeConfirm: 'Delete?', cgeMethod: 'delete' }).url, '/users/1');
  assert.equal(resolve({ cgeConfirm: 'Delete?', cgeMethod: 'delete' }).method, 'DELETE');
  assert.equal(resolve({ cgeUrl: '/api/users/1' }).url, '/api/users/1');
});

test('ActionButton init accepts a root or selector without throwing and resets stale redirects', () => {
  const listeners = [];
  globalThis.document = { addEventListener: (...args) => listeners.push(args) };
  const bound = CGEActionButton._delegationBound;
  const selector = CGEActionButton._selector;
  CGEActionButton._delegationBound = false;
  try {
    assert.doesNotThrow(() => CGEActionButton.init(globalThis.document));
    assert.equal(CGEActionButton._selector, selector);
    assert.equal(listeners.length, 1);
    assert.equal(listeners[0][0], 'click');
    assert.equal(listeners[0][2], true, 'Delegation must use the capture phase');
    CGEActionButton.init('.custom-trigger');
    assert.equal(listeners.length, 1, 'Delegation bound twice');
    assert.equal(CGEActionButton._selector, '.custom-trigger');
  } finally {
    CGEActionButton._delegationBound = bound;
    CGEActionButton._selector = selector;
  }
  const button = actionButton();
  button._isRedirecting = true;
  button._clearRedirecting();
  assert.equal(button._isRedirecting, false);
});

test('Form builds Laravel CSRF headers from the cookie as X-XSRF-TOKEN', () => {
  globalThis.document = fakeDocument({ cookie: 'XSRF-TOKEN=enc%2Btoken' });
  const form = Object.create(CGEForm.prototype);
  form.form = { querySelector: () => null };
  form.options = { headers: { 'X-Custom': '1' } };
  const headers = form._buildHeaders();
  assert.equal(headers['X-XSRF-TOKEN'], 'enc+token');
  assert.equal(headers['X-CSRF-TOKEN'], undefined);
  assert.equal(headers['X-Custom'], '1');
});

test('Form axios driver prefers the configured axiosInstance', async () => {
  let used = '';
  globalThis.window = { axios: { request: async () => { used = 'window'; return {}; } } };
  const instance = { request: async () => { used = 'instance'; return {}; } };
  await CGEForm.prototype._sendAxios.call({ options: { axiosInstance: instance } }, '/form', 'POST', new FormData(), {});
  assert.equal(used, 'instance');
});

test('Form detects redirects followed by fetch, XHR and axios', async () => {
  globalThis.window = { location: { href: 'https://app.test/profile' } };
  globalThis.fetch = async () => Object.assign(new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }));
  const form = Object.create(CGEForm.prototype);
  form.options = { followRedirects: true };
  const normalized = await form._sendFetch('/profile', 'POST', new FormData(), {});
  assert.equal(normalized.requestUrl, '/profile');
  assert.equal(form._followedRedirect(normalized), null, 'Plain response treated as redirect');
  assert.equal(form._followedRedirect({ redirected: true, url: 'https://app.test/home' }), 'https://app.test/home');
  assert.equal(form._followedRedirect({ responseURL: 'https://app.test/home', requestUrl: '/profile' }), 'https://app.test/home');
  assert.equal(form._followedRedirect({ responseURL: 'https://app.test/profile', requestUrl: '/profile' }), null);
  assert.equal(form._followedRedirect({ request: { responseURL: 'https://api.test/v1/home' }, config: { url: 'users', baseURL: 'https://api.test/v1/' } }), 'https://api.test/v1/home');
  assert.equal(form._followedRedirect({ request: { responseURL: 'https://api.test/v1/users' }, config: { url: 'users', baseURL: 'https://api.test/v1/' } }), null);
  form.options.followRedirects = false;
  assert.equal(form._followedRedirect({ redirected: true, url: 'https://app.test/home' }), null);
});

test('Form shows the translated csrf-expired message on 419', async () => {
  const form = Object.create(CGEForm.prototype);
  const feedback = [];
  const events = [];
  Object.assign(form, {
    form: { dataset: {} },
    options: { ...CGEForm.defaults, translations: {} },
    _listeners: new Map(),
    _destroyed: false,
    _isSubmitting: false,
    clearErrors() {},
    _freezeForm() {},
    _unfreezeForm() {},
    _resolveUrl: () => '/save',
    _resolveMethod: () => 'POST',
    _buildHeaders: () => ({}),
    _dispatchDOMEvent() {},
    _emit: (name) => events.push(name),
    _triggerFeedback: (type, message) => feedback.push([type, message]),
    _sendRequest: async () => { const error = new Error('419'); error.response = { status: 419, data: { message: 'CSRF token mismatch.' } }; throw error; }
  });
  // Node's FormData cannot read a form element; the request itself is stubbed above.
  const NativeFormData = globalThis.FormData;
  globalThis.FormData = class extends NativeFormData { constructor() { super(); } };
  try { await form._handleSubmit(); } finally { globalThis.FormData = NativeFormData; }
  assert.deepEqual(feedback, [['error', CGEForm.translations.en['csrf-expired']]]);
  assert(events.includes('error') && !events.includes('invalid'));
});

test('Form maps nested and array names to Laravel error keys', () => {
  const form = Object.create(CGEForm.prototype);
  assert.equal(form._nameToKey('items[0][name]'), 'items.0.name');
  assert.equal(form._nameToKey('tags[]'), 'tags');
  assert.equal(form._keyToBracket('items.0.name'), 'items[0][name]');
  assert.equal(form._keyToBracket('email'), 'email');
});

test('Select async POST over fetch sends Laravel CSRF headers and asyncSource.headers', async () => {
  globalThis.window = { location: { origin: 'https://app.test' } };
  globalThis.document = fakeDocument({ meta: 'select-token' });
  let request;
  globalThis.fetch = async (url, options) => { request = { url, ...options }; return jsonResponse([{ id: 1, name: 'Ada' }]); };
  const select = Object.create(CGESelect.prototype);
  let rendered = false;
  Object.assign(select, {
    element: { form: null },
    options: { minSearchLength: 0, asyncSource: { url: '/users/search', method: 'POST', debounce: 0, headers: { 'X-Tenant': 'acme' } } },
    items: [], selectedValues: [], filteredItems: [], _searchVersion: 0, _destroyed: false,
    _renderLoadingState() {}, _renderEmptyState() {}, _renderOptionsList() { rendered = true; }
  });
  select._handleAsyncSearch('ad');
  for (let i = 0; i < 50 && !rendered; i++) await new Promise(resolve => setTimeout(resolve, 2));
  assert(rendered, 'Results were not rendered');
  assert.equal(request.method, 'POST');
  assert.equal(header(request.headers, 'X-CSRF-TOKEN'), 'select-token');
  assert.equal(header(request.headers, 'X-Tenant'), 'acme');
  assert.equal(header(request.headers, 'Content-Type'), 'application/json');
  assert.equal(JSON.parse(request.body).q, 'ad');
  assert.equal(select.filteredItems[0].label, 'Ada');
  assert.equal(select.filteredItems[0].iconHtml, false);
});

test('Select GET search does not attach CSRF headers', async () => {
  globalThis.window = { location: { origin: 'https://app.test' } };
  globalThis.document = fakeDocument({ meta: 'select-token' });
  let request;
  globalThis.fetch = async (url, options) => { request = { url, ...options }; return jsonResponse([]); };
  const select = Object.create(CGESelect.prototype);
  let done = false;
  Object.assign(select, {
    element: { form: null },
    options: { minSearchLength: 0, asyncSource: { url: '/users/search', debounce: 0 } },
    items: [], selectedValues: [], filteredItems: [], _searchVersion: 0, _destroyed: false,
    _renderLoadingState() {}, _renderEmptyState() { done = true; }, _renderOptionsList() { done = true; }
  });
  select._handleAsyncSearch('x');
  for (let i = 0; i < 50 && !done; i++) await new Promise(resolve => setTimeout(resolve, 2));
  assert(request.url.endsWith('/users/search?q=x'));
  assert.equal(header(request.headers, 'X-CSRF-TOKEN'), undefined);
});

test('Select renders remote icons as text or class names, never HTML', () => {
  globalThis.document = fakeDomDocument();
  const render = item => CGESelect.prototype._renderIcon.call({}, item);
  const attack = render({ icon: '<img src=x onerror=alert(1)>', iconHtml: false });
  assert.equal(attack.html, null);
  assert.equal(attack.textContent, '<img src=x onerror=alert(1)>');
  const glyph = render({ icon: 'fa-solid fa-user', iconHtml: false });
  assert.equal(glyph.html, null);
  assert.equal(glyph.children[0].className, 'fa-solid fa-user');
  const trusted = render({ icon: '<svg></svg>', iconHtml: true });
  assert.equal(trusted.html, '<svg></svg>');
});

test('Dropzone file names, extensions and errors never reach innerHTML', () => {
  globalThis.document = fakeDomDocument();
  const dz = Object.create(CGEDropzone.prototype);
  dz.options = { ...CGEDropzone.defaults, translations: { ...CGEDropzone.translations } };
  dz.previewsContainer = new FakeElement('div');
  const payload = '"><img src=x onerror=alert(1)>.<svg onload=alert(2)>';
  const fileItem = {
    id: 'f1', name: payload, type: 'application/octet-stream', formattedSize: '1 KB', status: 'error',
    progress: 0, isImage: false, previewUrl: null, errorMessage: '<b onclick=x>bad</b>', validationError: true
  };
  dz._renderFileCard(fileItem);
  const nodes = walk(dz.previewsContainer);
  for (const node of nodes) {
    assert(!String(node.html ?? '').includes('onerror') && !String(node.html ?? '').includes('onclick') && !String(node.html ?? '').includes('onload'), 'Untrusted data rendered as HTML');
  }
  assert(nodes.some(node => node.textContent === payload && node.title === payload));
  assert(nodes.some(node => node.textContent === '<b onclick=x>bad</b>'));
  const retry = nodes.find(node => node.tagName === 'BUTTON' && node.textContent === dz._t('dict-retry'));
  assert(retry.className.includes('hidden'), 'Retry shown for a client validation error');
});

test('Dropzone shows Laravel 422/419 upload errors from XHR', async () => {
  const dz = Object.create(CGEDropzone.prototype);
  dz.options = { ...CGEDropzone.defaults, paramName: 'avatar', translations: { ...CGEDropzone.translations } };
  const respond = (status, body, type = 'application/json') => {
    globalThis.XMLHttpRequest = class {
      upload = {};
      open() {}
      setRequestHeader() {}
      getResponseHeader() { return type; }
      send() { this.status = status; this.statusText = ''; this.responseText = body; this.onload(); }
    };
  };
  respond(422, JSON.stringify({ message: 'The avatar field must be an image.', errors: { avatar: ['The avatar field must be an image.'] } }));
  let error = await dz._uploadWithXHR('/upload', new FormData(), {}, {}).catch(err => err);
  assert.equal(error.status, 422);
  assert.equal(dz._uploadErrorMessage(error), 'The avatar field must be an image.');
  respond(419, JSON.stringify({ message: 'CSRF token mismatch.' }));
  error = await dz._uploadWithXHR('/upload', new FormData(), {}, {}).catch(err => err);
  assert.equal(dz._uploadErrorMessage(error), 'CSRF token mismatch.');
  respond(500, '<html>Server Error</html>', 'text/html');
  error = await dz._uploadWithXHR('/upload', new FormData(), {}, {}).catch(err => err);
  assert.equal(dz._uploadErrorMessage(error), 'Server responded with 500 code.');
  assert.equal(dz._uploadErrorMessage({ response: { status: 422, data: { errors: { 'avatar.0': ['Too large.'] } } } }), 'Too large.');
});

test('Dropzone instant mode writes server IDs instead of filling the file input', () => {
  const dz = Object.create(CGEDropzone.prototype);
  dz.options = { ...CGEDropzone.defaults, paramName: 'attachments' };
  assert.equal(dz._serverIdInputName(), 'attachments_ids[]');
  assert.equal(dz._extractServerId({ id: 7 }), '7');
  assert.equal(dz._extractServerId({ path: 'uploads/a.pdf' }), 'uploads/a.pdf');
  assert.equal(dz._extractServerId({ data: { id: 'abc' } }), 'abc');
  assert.equal(dz._extractServerId('ok'), null);
  dz.options.serverIdName = 'document_ids[]';
  assert.equal(dz._serverIdInputName(), 'document_ids[]');
  dz.options.serverIdName = false;
  assert.equal(dz._serverIdInputName(), null);
  dz.options = { ...CGEDropzone.defaults, uploadMode: 'form' };
  assert.equal(dz._serverIdInputName(), null);
  // Instant mode never touches the native input
  dz.options = { ...CGEDropzone.defaults };
  dz.hiddenInput = { set files(_value) { throw new Error('Instant mode filled the file input'); } };
  dz.files = [{ file: {}, status: 'success' }];
  assert.doesNotThrow(() => dz._syncFormInput());
});

test('Dropzone uses the configured axiosInstance and validation errors are not retryable', async () => {
  let used = '';
  globalThis.window = { axios: { request: async () => { used = 'window'; return { data: {} }; } } };
  const axiosInstance = { request: async config => { used = 'instance'; return { data: { id: 1, config } }; } };
  const dz = Object.create(CGEDropzone.prototype);
  dz.options = { ...CGEDropzone.defaults, axiosInstance };
  const result = await dz._uploadWithAxios('/upload', new FormData(), {}, {});
  assert.equal(used, 'instance');
  assert.equal(result.id, 1);
  let queued = 0;
  Object.assign(dz, { files: [{ id: 'a', status: 'error', validationError: true, file: new File(['x'], 'a.exe') }], _processQueue: () => queued++, _updateCardUI() {} });
  dz.retryUpload('a');
  assert.equal(dz.files[0].status, 'error');
  dz.files[0].validationError = false;
  dz.retryUpload('a');
  assert.equal(dz.files[0].status, 'queued');
  assert.equal(queued, 1, 'Retry bypassed the queue');
});

test('destroyAll and init pruning are available on every forms plugin', () => {
  for (const Plugin of [CGEForm, CGESelect, CGEDropzone, CGEActionButton]) {
    assert.equal(typeof Plugin.destroyAll, 'function', `${Plugin.name}.destroyAll missing`);
  }
  const destroyed = [];
  const element = { isConnected: false };
  const instance = { element, destroy() { destroyed.push(this); CGEDropzone.instances.delete(element); CGEDropzone.instances.delete('dz-id'); } };
  CGEDropzone.instances.set(element, instance);
  CGEDropzone.instances.set('dz-id', instance);
  globalThis.document = {};
  const hadNode = 'Node' in globalThis;
  if (!hadNode) globalThis.Node = class {};
  try {
    assert.deepEqual(CGEDropzone.destroyAll(globalThis.document), [instance]);
  } finally { if (!hadNode) delete globalThis.Node; }
  assert.equal(destroyed.length, 1, 'ID alias destroyed the instance twice');
  assert.equal(CGEDropzone.instances.size, 0);
});
