import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { CGEForm } from '../plugins/CGEForm/CGEForm.js';
import { CGEDropzone } from '../plugins/CGEDropzone/CGEDropzone.js';
import { CGEActionButton } from '../plugins/CGEActionButton/CGEActionButton.js';
import { CGELightbox } from '../plugins/CGELightbox/CGELightbox.js';
import { CGEPagination } from '../plugins/CGEDataTable/modules/CGEPagination.js';
import { CGEFilter } from '../plugins/CGEDataTable/modules/CGEFilter.js';
import { CGEFilter as CGEDataGridFilter } from '../plugins/CGEDataGrid/modules/CGEFilter.js';
import { CGESort as CGEDataGridSort } from '../plugins/CGEDataGrid/modules/CGESort.js';
import { CGEPagination as CGEDataGridPagination } from '../plugins/CGEDataGrid/modules/CGEPagination.js';
import { CGEDataGrid } from '../plugins/CGEDataGrid/CGEDataGrid.js';

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

test('CGEPagination computeWindow generates valid windows without duplicates', () => {
  const p = new CGEPagination({ total: 60, perPage: 5 }); // 12 pages
  for (let page = 1; page <= 12; page++) {
    p.goTo(page);
    const win = p.computeWindow();
    const numbers = win.filter(x => typeof x === 'number');
    for (let i = 1; i < numbers.length; i++) {
      assert(numbers[i] > numbers[i - 1], `Page ${page} window has non-increasing or duplicate numbers: ${win.join(', ')}`);
    }
    assert.equal(win[0], 1);
    assert.equal(win[win.length - 1], 12);
  }
});

test('CGEFilter supports single and multi-select column filtering', () => {
  const filter = new CGEFilter();
  const rows = [
    { id: 1, role: 'Admin', status: 'Active' },
    { id: 2, role: 'Developer', status: 'Active' },
    { id: 3, role: 'Editor', status: 'Suspended' },
    { id: 4, role: 'Admin', status: 'Pending' },
  ];

  // Single select filter
  filter.setColumnFilter('role', 'Admin');
  let result = filter.filterRows(rows);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(r => r.id), [1, 4]);

  // Multi-select / array filter
  filter.setColumnFilter('role', ['Developer', 'Editor']);
  result = filter.filterRows(rows);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(r => r.id), [2, 3]);

  // Clear via 'all'
  filter.setColumnFilter('role', 'all');
  result = filter.filterRows(rows);
  assert.equal(result.length, 4);
});

test('CGEDataGrid sub-modules filter, sort, and paginate data correctly', () => {
  const filter = new CGEDataGridFilter();
  const sort = new CGEDataGridSort();
  const pagination = new CGEDataGridPagination({ perPage: 2 });

  const cards = [
    { id: 1, title: 'Tailwind v4 Setup', category: 'CSS', stars: 45 },
    { id: 2, title: 'Laravel 12 Routing', category: 'PHP', stars: 120 },
    { id: 3, title: 'Alpine Component', category: 'JS', stars: 85 },
    { id: 4, title: 'Vite Build Plugins', category: 'JS', stars: 90 },
  ];

  // 1. Filter by category
  filter.setFilter('category', 'JS');
  let filtered = filter.filterData(cards);
  assert.equal(filtered.length, 2);
  assert.deepEqual(filtered.map(c => c.id), [3, 4]);

  // 2. Global query match
  filter.apply('Plugins');
  filtered = filter.filterData(cards);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 4);

  // Clear filter
  filter.clear();
  filtered = filter.filterData(cards);
  assert.equal(filtered.length, 4);

  // 3. Sort by stars descending
  sort.sortBy('stars', 'desc');
  const sorted = sort.sortData(filtered);
  assert.deepEqual(sorted.map(c => c.id), [2, 4, 3, 1]);

  // 4. Paginate top 2
  const paged = pagination.paginateData(sorted);
  assert.equal(paged.length, 2);
  assert.deepEqual(paged.map(c => c.id), [2, 4]);
  assert.equal(pagination.lastPage, 2);
  assert.deepEqual(pagination.getWindow(), [1, 2]);
});

test('CGEDataGrid supports dual renderers and selection state management', () => {
  const grid = Object.create(CGEDataGrid.prototype);
  grid.viewMode = 'grid';
  grid.layoutMode = 'both';
  grid.selectedIds = new Set();
  grid.options = {
    htmlCardKey: 'html_card',
    htmlListKey: 'html_list',
    ui: { cardSelected: 'cge-card-selected' },
    translations: { 'confirm-bulk-delete': 'Delete :count?' }
  };
  grid.data = [
    { id: 10, name: 'Alice', html_card: '<div class="card-grid">Alice Card</div>', html_list: '<div class="card-list">Alice List</div>' },
    { id: 20, name: 'Bob', html_card: '<div class="card-grid">Bob Card</div>', html_list: '<div class="card-list">Bob List</div>' },
  ];

  // Verify selection methods
  grid.getSelectedIds = CGEDataGrid.prototype.getSelectedIds;
  grid.getSelectedItems = CGEDataGrid.prototype.getSelectedItems;

  grid.selectedIds.add('10');
  assert.deepEqual(grid.getSelectedIds(), ['10']);
  assert.equal(grid.getSelectedItems().length, 1);
  assert.equal(grid.getSelectedItems()[0].name, 'Alice');

  grid.selectedIds.add('20');
  assert.equal(grid.getSelectedIds().length, 2);
  assert.equal(grid.getSelectedItems().length, 2);

  grid.selectedIds.clear();
  assert.equal(grid.getSelectedIds().length, 0);
  assert.equal(grid.getSelectedItems().length, 0);
});



