// Regression tests for the October 2026 CGEDataTable / CGEDataGrid stability fixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCollection } from '../plugins/shared/collection.js';
import { readCollectionResponse } from '../plugins/shared/collection-core.js';
import { HttpError } from '../plugins/shared/http.js';
import { CGEFilter, CGESort, CGEPagination, escapeHTML as tableEscape } from '../plugins/CGEDataTable/index.js';
import { escapeHTML as gridEscape } from '../plugins/CGEDataGrid/index.js';
import { CGEFilter as GridFilter } from '../plugins/CGEDataGrid/modules/CGEFilter.js';
import { CGESort as GridSort } from '../plugins/CGEDataGrid/modules/CGESort.js';
import { CGEPagination as GridPagination } from '../plugins/CGEDataGrid/modules/CGEPagination.js';

const mockGlobal = (t, name, value) => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, name);
  const previous = globalThis[name];
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  t.after(() => {
    if (had) Object.defineProperty(globalThis, name, { value: previous, configurable: true, writable: true });
    else delete globalThis[name];
  });
};

/** Minimal element double: records its listener so tests can fire input/change events. */
const fakeElement = (tagName, props = {}) => ({
  tagName, type: '', value: '', multiple: false, listeners: {},
  addEventListener(event, handler) { this.listeners[event] = handler; },
  removeEventListener(event) { delete this.listeners[event]; },
  fire(event, value) { if (value !== undefined) this.value = value; this.listeners[event]?.({ target: this }); },
  ...props,
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const json = (data, init = {}) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init });

test('escapeHTML is exported by both collection barrels', () => {
  assert.equal(tableEscape, gridEscape);
  assert.equal(tableEscape('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
});

test('Turkish search matches İ/i, I/ı and accents with and without a locale', () => {
  const rows = [{ city: 'İstanbul' }, { city: 'IĞDIR' }, { city: 'Ankara' }, { city: 'Çanakkale' }];
  for (const locale of ['tr', undefined, 'en']) {
    const filter = new CGEFilter({ locale });
    for (const [query, expected] of [['istanbul', 'İstanbul'], ['ISTANBUL', 'İstanbul'], ['İSTANBUL', 'İstanbul'],
      ['ığdır', 'IĞDIR'], ['igdir', 'IĞDIR'], ['Iğdır', 'IĞDIR'], ['canakkale', 'Çanakkale']]) {
      filter.globalQuery = query;
      assert.deepEqual(filter.filterRows(rows).map(row => row.city), [expected], `${locale}: ${query}`);
    }
    filter.globalQuery = '';
    filter.setColumnFilter('city', 'ISTANBUL');
    assert.equal(filter.filterRows(rows).length, 1);
  }
});

test('Search and column filter debounce with separate timers', async () => {
  let changes = 0;
  const filter = new CGEFilter({ debounce: 15, onChange: () => changes++ });
  const search = fakeElement('INPUT', { type: 'search' });
  const role = fakeElement('INPUT', { type: 'text' });
  filter.attachSearchInput(search);
  filter.attachColumnFilter('role', role);
  search.fire('input', 'Alpha');
  role.fire('input', 'admin');
  await wait(40);
  assert.equal(filter.globalQuery, 'Alpha', 'Column filter timer dropped the search');
  assert.equal(filter.columnFilters.role, 'admin');
  assert.equal(changes, 2);
  search.fire('input', 'Beta'); filter.destroy(); await wait(30);
  assert.equal(filter.globalQuery, 'Alpha', 'Destroy left a pending timer');
});

test('Grid filter treats all/empty as clear, reads initial select value and debounces text', async () => {
  const filter = new GridFilter({ debounce: 15 });
  filter.setFilter('category', 'JS');
  filter.setFilter('category', 'all');
  assert.equal('category' in filter.columnFilters, false);
  filter.setFilter('category', 'JS'); filter.setFilter('category', '');
  assert.equal('category' in filter.columnFilters, false);

  const select = fakeElement('SELECT', { value: 'PHP' });
  filter.attachFieldFilter('category', select);
  assert.equal(filter.columnFilters.category, 'PHP', 'Blade old() selection ignored');
  select.fire('change', 'all');
  assert.equal('category' in filter.columnFilters, false, "'all' did not clear the filter");

  const text = fakeElement('INPUT', { type: 'text' });
  let changes = 0;
  filter.options.onChange = () => changes++;
  filter.attachFieldFilter('title', text);
  text.fire('input', 'a'); text.fire('input', 'ab'); text.fire('input', 'abc');
  assert.equal(changes, 0, 'Text field filter was not debounced');
  await wait(40);
  assert.equal(changes, 1);
  assert.equal(filter.columnFilters.title, 'abc');
  filter.destroy();
});

test('Grid search ignores internal, markup and nested fields unless configured', () => {
  const rows = [{ id: 1, title: 'Alpha', html_card: '<div>secret</div>', card_html: 'secret', _domCard: { textContent: 'secret' }, meta: { note: 'secret' } }];
  const filter = new GridFilter();
  filter.apply('secret');
  assert.equal(filter.filterData(rows).length, 0);
  filter.apply('alpha');
  assert.equal(filter.filterData(rows).length, 1);
  filter.apply('secret');
  assert.equal(filter.filterData(rows, ['meta.note']).length, 1, 'Configured searchKeys ignored');
});

test('Filter serialize keeps arrays and clears all values', () => {
  const filter = new CGEFilter();
  filter.apply('a b');
  filter.setColumnFilter('tags', ['x', 'y']);
  filter.setColumnFilter('role', 'admin');
  filter.setColumnFilter('status', 'all');
  assert.deepEqual(filter.serialize(), { search: 'a b', 'filters[tags]': ['x', 'y'], 'filters[role]': 'admin' });
});

test('Laravel LengthAwarePaginator, API Resource meta, simplePaginate and cursorPaginate responses', () => {
  const rows = Array.from({ length: 10 }, (_, id) => ({ id }));
  const length = readCollectionResponse({ data: rows, total: 47, current_page: 2, per_page: 10, last_page: 5, links: [{ url: null }] });
  assert.deepEqual([length.total, length.page, length.perPage, length.lastPage, length.mode], [47, 2, 10, 5, undefined]);

  const resource = readCollectionResponse({ data: rows, links: { first: '?page=1', next: '?page=3' },
    meta: { current_page: 2, last_page: 5, per_page: 10, total: 47 } });
  assert.deepEqual([resource.rows.length, resource.total, resource.page, resource.lastPage], [10, 47, 2, 5]);
  const pager = new CGEPagination({ perPage: 10 });
  pager.setMetrics({ ...resource, count: resource.rows.length });
  assert.deepEqual([pager.page, pager.lastPage, pager.from, pager.to], [2, 5, 11, 20]);

  const simple = readCollectionResponse({ data: rows, current_page: 3, per_page: 10, next_page_url: '/u?page=4', prev_page_url: '/u?page=2' });
  assert.equal(simple.mode, 'simple'); assert.equal(simple.hasMore, true);
  pager.setMetrics({ ...simple, count: 10 });
  assert.deepEqual([pager.totalKnown, pager.lastPage, pager.from, pager.to], [false, 4, 21, 30]);
  assert.equal(pager.getMetricsString(), 'Showing 21 to 30');
  const resourceSimple = readCollectionResponse({ data: rows, links: { next: null }, meta: { current_page: 4, per_page: 10 } });
  pager.setMetrics({ ...resourceSimple, count: 10 });
  assert.deepEqual([pager.mode, pager.hasMore, pager.lastPage], ['simple', false, 4]);

  const cursor = readCollectionResponse({ data: rows, per_page: 10, next_cursor: 'eyJpZCI6MTB9', prev_cursor: null });
  const cursorPager = new CGEPagination({ perPage: 10 });
  let notified = 0;
  cursorPager.options.onChange = () => notified++;
  cursorPager.setMetrics({ ...cursor, count: 10 });
  assert.equal(cursorPager.mode, 'cursor');
  assert.deepEqual(cursorPager.serialize(), { per_page: 10 });
  cursorPager.next();
  assert.deepEqual(cursorPager.serialize(), { cursor: 'eyJpZCI6MTB9', per_page: 10 });
  assert.equal(cursorPager.page, 2); assert.equal(notified, 1);
  cursorPager.goTo(7); assert.equal(notified, 1, 'Cursor paginator jumped to an unknown page');
  assert.deepEqual(cursorPager.computeWindow(), [2]);
  cursorPager.resetPage(); assert.deepEqual(cursorPager.serialize(), { per_page: 10 });
});

test('setMetrics honors lastPage and responseAdapter results', () => {
  const pager = new CGEPagination({ perPage: 10 });
  pager.setMetrics({ total: 100, lastPage: 7, page: 9 });
  assert.equal(pager.lastPage, 7);
  assert.equal(pager.page, 7);
  pager.setMetrics({ total: 30 });
  assert.equal(pager.lastPage, 3, 'Stale server lastPage survived a local total');
  const adapted = readCollectionResponse({ items: [{ id: 1 }], pagination: { count: 41, current: 2 } },
    response => ({ rows: response.items, total: response.pagination.count, page: response.pagination.current, perPage: 20 }));
  assert.deepEqual([adapted.rows.length, adapted.total, adapted.page, adapted.perPage], [1, 41, 2, 20]);
  const more = readCollectionResponse({ items: [] }, () => ({ rows: [], hasMore: true }));
  assert.equal(more.mode, 'simple');
});

test('All is sent as allValue and survives a server per_page equal to the total', () => {
  const pager = new CGEPagination({ perPage: 'All' });
  assert.deepEqual(pager.serialize(), { page: 1, per_page: -1 });
  pager.setMetrics({ total: 230, per_page: undefined, perPage: 230, page: 1 });
  assert.equal(pager.perPage, 0, 'All was replaced by the server count');
  assert.deepEqual(pager.serialize(), { page: 1, per_page: -1 });
  pager.setPerPage(25); pager.setPerPage(-1);
  assert.equal(pager.perPage, 0);
  const custom = new GridPagination({ allValue: 'all', perPage: 'All', translations: { info: ':from-:to/:total' } });
  assert.deepEqual(custom.serialize(), { page: 1, per_page: 'all' });
  assert.equal(new GridPagination().perPage, 12, 'Grid defaults lost');
  assert.equal(custom.options.translations['per-page'], 'Show :count items');
  const clamped = new CGEPagination({ perPage: 500 });
  clamped.setMetrics({ total: 900, perPage: 100 });
  assert.equal(clamped.perPage, 100, 'Server-clamped per_page ignored');
});

test('Grid getWindow never hides a single page behind an ellipsis', () => {
  for (const Pager of [GridPagination, CGEPagination]) {
    const pager = new Pager({ total: 200, perPage: 10 });
    for (let page = 1; page <= 20; page++) {
      pager.goToPage(page);
      const window = pager.getWindow();
      window.forEach((item, index) => {
        if (item === '...') assert(window[index + 1] - window[index - 1] > 2, `Page ${page}: ${window.join(',')}`);
      });
    }
    pager.goToPage(5);
    assert.deepEqual(pager.getWindow().slice(0, 3), [1, 2, 3]);
  }
});

test('Sort treats codes as text, not dates', () => {
  const sort = new GridSort();
  sort.sortBy('code');
  const rows = ['A-10', 'B-1', 'A-2', 'A-1'].map(code => ({ code }));
  assert.deepEqual(sort.sortData(rows).map(row => row.code), ['A-1', 'A-2', 'A-10', 'B-1']);
  sort.sortBy('date', 'asc');
  assert.deepEqual(sort.sortData(['2026-01-02', '2025-12-31T10:00:00', '2026-01-01 08:00:00'].map(date => ({ date }))).map(r => r.date),
    ['2025-12-31T10:00:00', '2026-01-01 08:00:00', '2026-01-02']);
});

test('Sort parses DD.MM.YYYY and DD/MM/YYYY dates day-first', () => {
  const sort = new CGESort();
  sort.sortBy('date');
  const dotted = ['02.01.2026', '15.12.2025', '01.02.2026', '31.01.2026'].map(date => ({ date }));
  assert.deepEqual(sort.sortRows(dotted).map(row => row.date), ['15.12.2025', '02.01.2026', '31.01.2026', '01.02.2026']);
  const slashed = ['03/04/2026', '02/05/2026', '10/01/2026 14:30'].map(date => ({ date }));
  assert.deepEqual(sort.sortRows(slashed).map(row => row.date), ['10/01/2026 14:30', '03/04/2026', '02/05/2026']);
  const us = new CGESort({ dateOrder: 'mdy' }); us.sortBy('date');
  assert.deepEqual(us.sortRows(slashed).map(row => row.date), ['02/05/2026', '03/04/2026', '10/01/2026 14:30']);
});

test('Sort detects one numeric type per column with Turkish/EU separators', () => {
  const sort = new CGESort({ locale: 'tr' });
  sort.sortBy('amount');
  const rows = ['1.234,50', '999,00', '12,5', '₺ 2.000', '1.000.000,00'].map(amount => ({ amount }));
  assert.deepEqual(sort.sortRows(rows, [{ key: 'amount', type: 'auto' }]).map(row => row.amount),
    ['12,5', '999,00', '1.234,50', '₺ 2.000', '1.000.000,00']);
  const english = new CGESort({ locale: 'en' }); english.sortBy('amount');
  assert.deepEqual(english.sortRows(['1,234.50', '999.00', '$5'].map(amount => ({ amount }))).map(row => row.amount),
    ['$5', '999.00', '1,234.50']);
});

test('Sort keeps empty values last in both directions and is stable', () => {
  const rows = [{ id: 1, v: 3 }, { id: 2, v: null }, { id: 3, v: 1 }, { id: 4, v: '' }, { id: 5, v: 3 }, { id: 6 }];
  const sort = new CGESort();
  sort.sortBy('v', 'asc');
  assert.deepEqual(sort.sortRows(rows).map(row => row.id), [3, 1, 5, 2, 4, 6]);
  sort.sortBy('v', 'desc');
  assert.deepEqual(sort.sortRows(rows).map(row => row.id), [1, 5, 3, 2, 4, 6]);
  const text = new CGESort({ locale: 'tr' }); text.sortBy('name');
  assert.deepEqual(text.sortRows(['Zeynep', 'çağla', 'Can', 'item 10', 'item 9'].map(name => ({ name }))).map(r => r.name),
    ['Can', 'çağla', 'item 9', 'item 10', 'Zeynep']);
});

test('Collection POST sends CSRF and nested JSON; GET sends key[] arrays without CSRF', async t => {
  mockGlobal(t, 'window', { location: { href: 'https://app.test/users' } });
  mockGlobal(t, 'document', { cookie: '', querySelector: selector => selector.includes('csrf-token') ? { getAttribute: () => 'token-123' } : null });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => { requests.push({ url, options }); return json({ data: [] }); });
  const params = { page: 1, search: 'a b', 'filters[role]': 'admin', 'filters[tags]': ['x', 'y'] };

  await fetchCollection({ url: '/users', method: 'POST', driver: 'fetch' }, params);
  const post = requests[0].options;
  assert.equal(post.headers['X-CSRF-TOKEN'], 'token-123');
  assert.deepEqual(JSON.parse(post.body), { page: 1, search: 'a b', filters: { role: 'admin', tags: ['x', 'y'] } });

  await fetchCollection({ url: '/users?fixed=1', method: 'GET', driver: 'fetch' }, params);
  const get = requests[1];
  assert.equal(get.options.headers['X-CSRF-TOKEN'], undefined);
  assert.deepEqual(get.url.searchParams.getAll('filters[tags][]'), ['x', 'y']);
  assert.equal(get.url.searchParams.get('filters[role]'), 'admin');
  assert.equal(get.url.searchParams.get('fixed'), '1');
});

test('Collection HTTP errors are HttpError with the parsed Laravel body', async t => {
  mockGlobal(t, 'window', { location: { href: 'https://app.test/users' } });
  t.mock.method(globalThis, 'fetch', async () => json({ message: 'The role is invalid.', errors: { role: ['Invalid'] } }, { status: 422 }));
  await assert.rejects(fetchCollection({ url: '/users', driver: 'fetch' }, {}), error =>
    error instanceof HttpError && error.status === 422 && error.message === 'The role is invalid.' && error.errors.role[0] === 'Invalid');
});

test('Collection axios prefers axiosInstance, nests params and wraps errors', async t => {
  mockGlobal(t, 'window', { axios: { request: async () => { throw new Error('window.axios used'); } } });
  mockGlobal(t, 'document', { cookie: '', querySelector: () => ({ getAttribute: () => 'token-123' }) });
  const calls = [];
  const axiosInstance = { request: async config => { calls.push(config); return { data: { data: [] } }; } };
  await fetchCollection({ url: '/users', driver: 'auto', axiosInstance }, { 'filters[role]': 'admin', 'filters[tags]': ['x'] });
  assert.deepEqual(calls[0].params, { filters: { role: 'admin', tags: ['x'] } });
  assert.equal(calls[0].headers['X-CSRF-TOKEN'], undefined);
  await fetchCollection({ url: '/users', method: 'DELETE', driver: 'axios', axiosInstance }, { ids: [1, 2] });
  assert.equal(calls[1].headers['X-CSRF-TOKEN'], 'token-123');
  assert.deepEqual(calls[1].data, { ids: [1, 2] });
  const failing = { request: async () => { const error = new Error('Request failed'); error.response = { status: 419, statusText: '', data: { message: 'CSRF token mismatch.' } }; throw error; } };
  await assert.rejects(fetchCollection({ url: '/users', driver: 'axios', axiosInstance: failing }, {}), error =>
    error instanceof HttpError && error.status === 419 && error.message === 'CSRF token mismatch.');
});
