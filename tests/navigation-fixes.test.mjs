import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHashState, serializeHashState, updateHashState, panelHtmlFromResponse, hasCommandModifier
} from '../plugins/shared/navigation.js';
import { CGETabs } from '../plugins/CGETabs/CGETabs.js';
import { CGEAccordion, CGECollapse } from '../plugins/CGEAccordion/CGEAccordion.js';
import { HttpError } from '../plugins/shared/http.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.getComputedStyle;
  if (globalThis.Node?.name === 'FakeNode') delete globalThis.Node;
});

// Minimal tab group without a DOM: triggers expose only what the handlers read.
const fakeTabs = (ids, extra = {}) => {
  const tabs = ids.map(id => ({ id, panel: null, trigger: { hasAttribute: () => false, getAttribute: name => (name === 'data-cge-tab' ? id : null) } }));
  const instance = Object.assign(Object.create(CGETabs.prototype), {
    tabs, activeTabId: ids[0], _hashKey: 'group', _destroyed: false, _initialTabId: ids[0], tabList: {}, element: {},
    options: { urlSync: 'hash', historyMode: 'push', orientation: 'horizontal', manual: false, ajaxHeaders: {}, ...extra }
  });
  instance.shown = [];
  instance.show = function (id) { this.shown.push(id); this.activeTabId = id; return true; };
  return instance;
};

test('Namespaced hash state parses, serializes and keeps other groups', () => {
  const state = parseHashState('#outer=billing&inner=invoice%20list');
  assert.deepEqual([...state.entries], [['outer', 'billing'], ['inner', 'invoice list']]);
  assert.equal(state.plain, null);
  assert.equal(parseHashState('#legacy%20tab').plain, 'legacy tab');
  assert.equal(parseHashState('').plain, null);
  assert.equal(parseHashState('#bad%E0%A4%A').plain, 'bad%E0%A4%A');
  assert.equal(serializeHashState(new Map([['tabs:one', 'a b'], ['empty', '']])), '#tabs%3Aone=a%20b');
  assert.equal(updateHashState('#outer=o1&inner=i1', 'inner', 'i2'), '#outer=o1&inner=i2');
  assert.equal(updateHashState('#legacy', 'outer', 'o2'), '#outer=o2');
  assert.equal(updateHashState('#outer=o1', 'outer', null), '');
  const mixed = parseHashState('#anchor&group=x');
  assert.equal(mixed.plain, 'anchor');
  assert.equal(mixed.entries.get('group'), 'x');
});

test('Tabs read their own namespaced entry and accept legacy plain hashes', () => {
  const tabs = fakeTabs(['a', 'b']);
  globalThis.window = { location: { hash: '#other=a&group=b' } };
  assert.equal(tabs._readUrlState(), 'b');
  globalThis.window.location.hash = '#other=b';
  assert.equal(tabs._readUrlState(), null, 'Another group entry must not drive this group');
  globalThis.window.location.hash = '#b';
  assert.equal(tabs._readUrlState(), 'b');
  globalThis.window.location.hash = '#unrelated-anchor';
  assert.equal(tabs._readUrlState(), null);
});

test('Tabs push history: Back to a URL without tab state restores the initial tab', () => {
  const tabs = fakeTabs(['a', 'b']);
  tabs.activeTabId = 'b';
  globalThis.window = { location: { hash: '' } };
  tabs._handleLocationChange();
  assert.deepEqual(tabs.shown, ['a']);
  const replace = fakeTabs(['a', 'b'], { historyMode: 'replace' });
  replace.activeTabId = 'b';
  replace._handleLocationChange();
  assert.deepEqual(replace.shown, [], 'Replace mode must not reset on unrelated anchors');
});

test('AJAX tab JSON without a string html property is rejected, html JSON and HTML are accepted', async () => {
  assert.equal(panelHtmlFromResponse('<p>x</p>', 'text/html; charset=UTF-8'), '<p>x</p>');
  assert.equal(panelHtmlFromResponse('plain', 'text/plain'), 'plain');
  assert.equal(panelHtmlFromResponse('{"html":"<b>ok</b>"}', 'application/json'), '<b>ok</b>');
  assert.equal(panelHtmlFromResponse({ html: '<i>axios</i>' }), '<i>axios</i>');
  assert.equal(panelHtmlFromResponse('[note] text', 'text/html'), '[note] text');
  for (const [body, type] of [['{"message":"<img src=x onerror=alert(1)>"}', 'application/json'],
    ['{"message":"<img src=x onerror=alert(1)>"}', ''], ['{"html":42}', 'text/html'], [{ data: 1 }, ''],
    ['"<img>"', 'application/json'], ['<x/>', 'application/xml']]) {
    assert.throws(() => panelHtmlFromResponse(body, type), TypeError, `${JSON.stringify(body)} was accepted`);
  }

  const tabs = fakeTabs(['a']);
  globalThis.fetch = async () => new Response('{"message":"<img src=x onerror=alert(1)>"}', { headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(tabs._requestPanel('/x', 'GET', 'fetch'), TypeError);
  globalThis.fetch = async () => new Response('{"html":"<p>ok</p>"}', { headers: { 'Content-Type': 'application/json' } });
  assert.equal(await tabs._requestPanel('/x', 'GET', 'fetch'), '<p>ok</p>');
});

test('AJAX tabs use Laravel headers, CSRF only for unsafe methods and HttpError failures', async () => {
  globalThis.document = { querySelector: selector => (selector.includes('csrf-token') ? { getAttribute: () => 'token-1' } : null), cookie: '' };
  globalThis.window = {};
  const tabs = fakeTabs(['a'], { ajaxHeaders: { 'X-Custom': '1' } });
  const requests = [];
  globalThis.fetch = async (url, init) => { requests.push(init); return new Response('<p>ok</p>', { headers: { 'Content-Type': 'text/html' } }); };
  await tabs._requestPanel('/x', 'GET', 'fetch');
  await tabs._requestPanel('/x', 'POST', 'fetch');
  assert.equal(requests[0].headers['X-CSRF-TOKEN'], undefined);
  assert.equal(requests[1].headers['X-CSRF-TOKEN'], 'token-1');
  assert.equal(requests[1].headers['X-Requested-With'], 'XMLHttpRequest');
  assert.equal(requests[1].headers['X-Custom'], '1');

  globalThis.fetch = async () => new Response('{"message":"Gone"}', { status: 410, headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(tabs._requestPanel('/x', 'GET', 'fetch'), error => error instanceof HttpError && error.status === 410 && error.message === 'Gone');
});

test('Configured axiosInstance wins over window.axios and failures become HttpError', async () => {
  let used = null;
  globalThis.window = { axios: { request: async () => { used = 'window'; return { data: '<p>w</p>' }; } } };
  const instance = { request: async config => { used = 'instance'; assert.equal(config.responseType, 'text'); return { data: '{"html":"<p>i</p>"}', headers: { 'Content-Type': 'application/json' } }; } };
  const tabs = fakeTabs(['a'], { axiosInstance: instance });
  assert.equal(await tabs._requestPanel('/x', 'GET', 'auto'), '<p>i</p>');
  assert.equal(used, 'instance');
  tabs.options.axiosInstance = { request: async () => { const error = new Error('fail'); error.response = { status: 419, statusText: '', data: '{}', headers: {} }; throw error; } };
  await assert.rejects(tabs._requestPanel('/x', 'POST', 'axios'), error => error instanceof HttpError && error.status === 419);
  tabs.options.axiosInstance = { request: async () => ({ data: { message: '<img>' }, headers: { 'content-type': 'application/json' } }) };
  await assert.rejects(tabs._requestPanel('/x', 'GET', 'axios'), TypeError);
});

test('Tabs keyboard ignores modifier shortcuts and mirrors arrows for RTL', () => {
  assert.equal(hasCommandModifier({ ctrlKey: true }), true);
  assert.equal(hasCommandModifier({ shiftKey: true }), false);
  const tabs = fakeTabs(['a', 'b', 'c']);
  let prevented = 0;
  const event = (key, extra = {}) => ({ key, preventDefault: () => prevented++, ...extra });
  globalThis.document = { activeElement: tabs.tabs[0].trigger };
  globalThis.getComputedStyle = () => ({ direction: 'ltr' });
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) tabs._handleKeydown(event('ArrowRight', { [modifier]: true }));
  assert.equal(prevented, 0);
  assert.deepEqual(tabs.shown, []);
  tabs._handleKeydown(event('ArrowRight'));
  assert.deepEqual(tabs.shown, ['b']);
  globalThis.document.activeElement = tabs.tabs[0].trigger;
  globalThis.getComputedStyle = () => ({ direction: 'rtl' });
  tabs._handleKeydown(event('ArrowLeft'));
  assert.equal(tabs.shown.at(-1), 'b', 'RTL ArrowLeft must move to the next tab');
  tabs._handleKeydown(event('ArrowRight'));
  assert.equal(tabs.shown.at(-1), 'c', 'RTL ArrowRight must move to the previous (wrapping) tab');
});

test('Navigation get() returns null and destroyAll removes detached or contained instances', () => {
  assert.equal(CGETabs.get({}), null);
  assert.equal(CGEAccordion.get({}), null);
  assert.equal(CGECollapse.get({}), null);
  globalThis.document = { nodeType: 9 };
  globalThis.Node ??= class FakeNode {};
  for (const Plugin of [CGETabs, CGEAccordion]) {
    let destroyed = 0;
    const element = { isConnected: false };
    const fake = { element, destroy: () => destroyed++ };
    Plugin.instances.set(element, fake);
    Plugin.instances.set('fake-id', fake);
    const result = Plugin.destroyAll();
    assert.deepEqual(result, [fake]);
    assert.equal(Plugin.instances.size, 0);
    assert(destroyed >= 1);
  }
  const wrapper = { isConnected: false };
  const collapse = { wrapper, destroy() {} };
  CGECollapse.instances.set(wrapper, collapse);
  CGECollapse.instances.set('panel', collapse);
  assert.deepEqual(CGECollapse.destroyAll(), [collapse]);
  assert.equal(CGECollapse.instances.size, 0);
});

test('setPanelInitializer registers and clears the AJAX panel initializer', () => {
  const previous = [CGETabs._panelInitializer, CGETabs._panelDestroyer];
  try {
    const init = () => {}, destroy = () => {};
    CGETabs.setPanelInitializer(init, destroy);
    assert.equal(CGETabs._panelInitializer, init);
    assert.equal(CGETabs._panelDestroyer, destroy);
    CGETabs.setPanelInitializer(null);
    assert.equal(CGETabs._panelInitializer, null);
    assert.equal(CGETabs._panelDestroyer, null);
  } finally {
    CGETabs.setPanelInitializer(...previous);
  }
});
