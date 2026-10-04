import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { CGEForm } from '../plugins/CGEForm/CGEForm.js';
import { CGEDropzone } from '../plugins/CGEDropzone/CGEDropzone.js';
import { CGEActionButton } from '../plugins/CGEActionButton/CGEActionButton.js';
import { CGELightbox } from '../plugins/CGELightbox/CGELightbox.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.XMLHttpRequest;
});

for (const method of ['PUT', 'PATCH', 'DELETE']) {
  test(`Fetch sends Blade _method=${method} over POST with multipart headers`, async () => {
    const form = Object.create(CGEForm.prototype);
    const data = new FormData();
    data.set('_method', method);
    let request;
    globalThis.fetch = async (url, options) => {
      request = options;
      return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
    };
    await form._sendFetch('/form', method, data, { 'Content-Type': 'multipart/form-data' });
    assert.equal(request.method, 'POST');
    assert.equal(request.body.get('_method'), method);
    assert.equal(request.headers['Content-Type'], undefined);
  });
}

test('XHR uses POST when _method already exists', async () => {
  let request;
  globalThis.XMLHttpRequest = class {
    upload = {};
    status = 200;
    responseText = '{}';
    open(method, url) { request = { method, url }; }
    setRequestHeader() {}
    getResponseHeader() { return 'application/json'; }
    send(body) { request.body = body; this.onload(); }
  };
  const data = new FormData();
  data.set('_method', 'PATCH');
  await CGEForm.prototype._sendXHR.call({}, '/form', 'PATCH', data, {});
  assert.equal(request.method, 'POST');
  assert.equal(request.body.get('_method'), 'PATCH');
});

test('Axios honors the resolved method instead of an outdated hidden _method', async () => {
  let request;
  globalThis.window = { axios: { request: async options => { request = options; return {}; } } };
  const data = new FormData();
  data.set('_method', 'DELETE');
  await CGEForm.prototype._sendAxios.call({ options: {} }, '/form', 'PATCH', data, {});
  assert.equal(request.method, 'POST');
  assert.equal(request.data.get('_method'), 'PATCH');
});

test('Dropzone Fetch deletion rejects server errors', async () => {
  globalThis.window = {};
  globalThis.fetch = async () => new Response('', { status: 500 });
  const dz = Object.create(CGEDropzone.prototype);
  dz._deleteControllers = new Set();
  dz.options = { removeUrl: '/delete', removeMethod: 'DELETE' };
  dz._buildHeaders = () => ({});
  dz._t = (_, values) => `HTTP ${values.statusCode}`;
  await assert.rejects(dz._sendDeleteRequest({ id: 'file', name: 'file.pdf' }), /500/);
});

test('Dropzone confirmation uses CGEAlert positional API', async () => {
  let args;
  globalThis.window = { CGEAlert: { confirm: async (...values) => { args = values; return { isConfirmed: true }; } } };
  assert.equal(await CGEDropzone.prototype._confirmAction.call({ _t: () => 'Delete file' }, 'Confirm deletion?'), true);
  assert.equal(args[0], 'Delete file');
  assert.equal(args[1], 'Confirm deletion?');
  assert.equal(typeof args[2], 'object');
});

test('ActionButton partial translations retain defaults', () => {
  const options = CGEActionButton.prototype._resolveOptions.call({ element: { dataset: {}, getAttribute: () => null } }, { translations: { loading: 'Bekleyin' } });
  assert.equal(options.translations.loading, 'Bekleyin');
  assert.equal(options.translations['confirm-title'], CGEActionButton.translations['confirm-title']);
});

test('Lightbox partial translations retain counter', () => {
  const lb = new CGELightbox({ translations: { close: 'Kapat' } });
  assert.equal(lb.options.translations.close, 'Kapat');
  assert.equal(lb.options.translations.counter, ':current / :total');
  CGELightbox.instances.delete(lb);
});
