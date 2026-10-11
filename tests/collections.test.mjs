import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCollection } from '../plugins/shared/collection.js';
import { CGEFilter, CGESort, CGEPagination } from '../plugins/CGEDataTable/index.js';
import { CGEFilter as GridFilter } from '../plugins/CGEDataGrid/modules/CGEFilter.js';
import { CGESort as GridSort } from '../plugins/CGEDataGrid/modules/CGESort.js';
import { CGEPagination as GridPagination } from '../plugins/CGEDataGrid/modules/CGEPagination.js';

const mockWindow = (t, value) => {
  const previous = globalThis.window;
  globalThis.window = value;
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
};

for (const [name, Class, action, parentMethod] of [
  ['Table filter', CGEFilter, module => module.apply('Alpha'), '_onFilterChange'],
  ['Table sort', CGESort, module => module.sortBy('name'), '_onSortChange'],
  ['Table pagination', CGEPagination, module => module.setPerPage(5), '_onPaginationChange'],
  ['Grid filter', GridFilter, module => module.apply('Alpha'), '_onFilterChange'],
  ['Grid sort', GridSort, module => module.sortBy('name'), '_onSortChange'],
  ['Grid pagination', GridPagination, module => module.setPerPage(5), '_onPaginationChange'],
]) test(`${name} notifies once when callback and parent are configured`, () => {
  let changes = 0;
  const module = new Class({ onChange: () => changes++ });
  module.table = { [parentMethod]: () => changes++ };
  action(module);
  assert.equal(changes, 1);
  module.options.onChange = null;
  action(module);
  // Pagination does not notify when the same limit is assigned twice.
  assert.equal(changes, name.includes('pagination') ? 1 : 2);
  module.destroy();
});

test('Table pagination clamps after shrinking totals and serializes All as allValue', () => {
  const pager = new CGEPagination({ total: 100, perPage: 10, page: 10 });
  pager.setMetrics({ total: 12 });
  assert.equal(pager.page, 2);
  assert.equal(pager.from, 11);
  pager.setPerPage('All');
  assert.deepEqual(pager.serialize(), { page: 1, per_page: -1 });
});

test('Table currency sort handles both decimal and thousands separators', () => {
  const sort = new CGESort(); sort.sortBy('price');
  const rows = [{ price: '$1,200.00' }, { price: '€45,00' }, { price: '₺1.234,56' }, { price: '$20.00' }];
  assert.deepEqual(sort.sortRows(rows, [{ key: 'price', type: 'currency' }]).map(row => row.price),
    ['$20.00', '€45,00', '$1,200.00', '₺1.234,56']);
});

test('Collection Fetch POST sends JSON, relative URLs and abort signal', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.href, 'https://example.test/app/rows');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { page: 2, search: 'a b' });
    assert(options.signal instanceof AbortSignal);
    return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  });
  mockWindow(t, { location: { href: 'https://example.test/app/index' } });
  await fetchCollection({ url: 'rows', method: 'post', driver: 'fetch' }, { page: 2, search: 'a b' }, new AbortController().signal);
});

test('Collection Fetch GET preserves existing query and rejects HTTP errors', async t => {
  mockWindow(t, { location: { href: 'https://example.test/app/index' } });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.searchParams.get('fixed'), '1');
    assert.equal(url.searchParams.get('search'), 'a b');
    assert.equal(options.body, undefined);
    return new Response('Invalid', { status: 422 });
  });
  await assert.rejects(fetchCollection({ url: '/rows?fixed=1', method: 'GET', driver: 'fetch' }, { search: 'a b' }), /422/);
});

test('Collection Axios respects method and body and forwards cancellation', async t => {
  const signal = new AbortController().signal;
  mockWindow(t, { axios: { request: async options => {
    assert.equal(options.method, 'POST'); assert.equal(options.signal, signal);
    assert.equal(options.params, undefined); assert.deepEqual(options.data, { page: 3 });
    return { data: [{ id: 1 }] };
  } } });
  assert.deepEqual(await fetchCollection({ url: '/rows', method: 'POST', driver: 'axios' }, { page: 3 }, signal), [{ id: 1 }]);
});
