import { CGEDataGrid } from '../plugins/CGEDataGrid/index.js';
import { CGEDataTable, CGEFilter, CGESort, CGEResponsive } from '../plugins/CGEDataTable/index.js';

export async function collectionRegressions({ check, mount, track, assert, wait, deferred }) {
  const response = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  const create = (kind, options = {}) => track(kind === 'Grid'
    ? new CGEDataGrid(mount('<div></div>'), { source: 'json', autoBindActions: false, ...options })
    : new CGEDataTable(mount('<table></table>'), { source: 'json', autoBindActions: false,
      columns: [{ key: 'name', label: 'Name' }], ...options }));
  const rows = [{ id: 0, name: 'Zulu' }, { id: 'a"[x]', name: 'Alpha' }, { id: 2, name: 'Beta' }];
  for (const kind of ['Grid', 'Table']) {
    await check(`${kind}: one module change produces one render`, () => {
      const instance = create(kind, { data: rows, perPage: 1 });
      let rendered = 0;
      instance.on(kind === 'Grid' ? 'render' : 'rendered', () => rendered++);
      instance.filter.apply('Alpha');
      assert(rendered === 1, `Filter rendered ${rendered} times`);
      rendered = 0; instance.filter.clear();
      assert(rendered === 1, 'Clear notification duplicated');
      rendered = 0; instance.sort.sortBy('name');
      assert(rendered === 1, 'Sort notification duplicated');
      rendered = 0;
      kind === 'Grid' ? instance.pagination.nextPage() : instance.pagination.next();
      assert(rendered === 1, 'Pagination notification duplicated');
    });
    await check(`${kind}: zero and quoted IDs select and remove the correct data`, async () => {
      const instance = create(kind, { data: rows, selectable: true, perPage: 1 });
      const toggle = id => kind === 'Grid' ? instance.toggleSelect(id, true) : instance.toggleSelectRow(id, true);
      toggle('0');
      assert((kind === 'Grid' ? instance.getSelectedItems() : instance.getSelectedRows())[0].id === 0, 'Zero ID lost');
      kind === 'Grid' ? instance.pagination.nextPage() : instance.pagination.next();
      toggle('a"[x]');
      const checkbox = (kind === 'Grid' ? instance.cardsContainer : instance.tbody).querySelector('input[type="checkbox"]');
      assert(checkbox.checked && (checkbox.getAttribute('data-cge-select-id') || checkbox.getAttribute('data-row-id')) === 'a"[x]', 'Quoted ID corrupted');
      kind === 'Grid' ? instance.removeCard('a"[x]') : instance.removeRow('a"[x]');
      await wait(280);
      assert((kind === 'Grid' ? instance.data : instance.rawRows).length === 2, 'Wrong row removed');
      assert(!(kind === 'Grid' ? instance.cardsContainer : instance.tbody).textContent.includes('Alpha'), 'Removed row remains visible');
    });
    await check(`${kind}: latest AJAX response wins and loading belongs to latest request`, async () => {
      const instance = create(kind, { data: rows, url: '/collection', driver: 'fetch', serverSide: true });
      instance.options.source = 'ajax';
      const requests = [];
      window.fetch = (url, options) => { const pending = deferred(); requests.push({ ...pending, options }); return pending.promise; };
      const first = instance.fetch(); const second = instance.fetch();
      assert(requests[0].options.signal.aborted, 'Previous request not aborted');
      requests[0].resolve(response({ data: [{ id: 1, name: 'Old' }], total: 20 }));
      await first;
      assert(instance.loading, 'Old response cleared active loading');
      requests[1].resolve(response({ data: [{ id: 2, name: 'New' }], total: 30, current_page: 2, per_page: 10 }));
      await second;
      assert(!instance.loading && instance.pagination.total === 30 && instance.pagination.page === 2, 'Latest metrics not applied');
      assert((kind === 'Grid' ? instance.cardsContainer : instance.tbody).textContent.includes('New'), 'Latest data not rendered');
    });
    await check(`${kind}: client AJAX applies local pagination and filter`, async () => {
      const instance = create(kind, { url: '/collection', driver: 'fetch', perPage: 1 });
      instance.options.source = 'ajax';
      window.fetch = async () => response({ data: rows, total: 90, current_page: 8, per_page: 30 });
      await instance.fetch();
      assert(instance.pagination.total === 3 && instance.pagination.lastPage === 3, 'Client metrics used remote total');
      instance.filter.apply('Alpha');
      assert(instance.pagination.total === 1, 'Client filter not applied');
    });
    await check(`${kind}: HTTP failure preserves data and emits one error`, async () => {
      const instance = create(kind, { data: rows, url: '/collection', driver: 'fetch' });
      let errors = 0;
      instance.on(kind === 'Grid' ? 'fetch-error' : 'error', () => errors++);
      window.fetch = async () => new Response('Failure', { status: 422 });
      try { await instance.fetch(); } catch (error) { assert(kind === 'Table' && error.message.includes('422'), 'Unexpected fetch error'); }
      assert(errors === 1 && !instance.loading && (kind === 'Grid' ? instance.data : instance.rawRows).length === 3, 'Failure damaged data/loading');
    });
    await check(`${kind}: destroy aborts late responses and restores original DOM once`, async () => {
      const instance = create(kind, { data: rows, url: '/collection', driver: 'fetch' });
      const original = kind === 'Grid' ? instance.root : instance.rawElement;
      let destroyed = 0;
      instance.on(kind === 'Grid' ? 'destroyed' : 'destroy', () => destroyed++);
      const pending = deferred(); let signal;
      window.fetch = (url, options) => { signal = options.signal; return pending.promise; };
      const request = instance.fetch(); instance.destroy(); instance.destroy();
      const restored = original.outerHTML;
      pending.resolve(response(rows)); await request; await wait(280);
      assert(signal.aborted && destroyed === 1 && original.outerHTML === restored && original.children.length === 0, 'Destroy allowed late DOM work');
    });
    await check(`${kind}: destroy cancels pending removal and recreation has one handler`, async () => {
      const instance = create(kind, { data: rows, selectable: true });
      const original = kind === 'Grid' ? instance.root : instance.rawElement;
      let deleted = 0;
      instance.on(kind === 'Grid' ? 'card-removed' : 'row:deleted', () => deleted++);
      kind === 'Grid' ? instance.removeCard('0') : instance.removeRow('0');
      instance.destroy(); await wait(280);
      assert(deleted === 0, 'Removal ran after destroy');
      const replacement = track(kind === 'Grid' ? new CGEDataGrid(original, { source: 'json', data: rows, selectable: true })
        : new CGEDataTable(original, { source: 'json', data: rows, selectable: true, columns: [{ key: 'name' }] }));
      let events = 0;
      replacement.on(kind === 'Grid' ? 'selection-change' : 'selection:change', () => events++);
      const checkbox = (kind === 'Grid' ? replacement.cardsContainer : replacement.tbody).querySelector('input[type="checkbox"]');
      checkbox.click();
      assert(events === 1 && replacement.getSelectedIds()[0] === '0', 'Recreated instance duplicated/lost selection handler');
    });
    await check(`${kind}: declarative discovery includes matching root and recreates DOM data`, () => {
      const element = mount(kind === 'Grid' ? '<div data-cge-datagrid><div class="cge-grid-items"><article class="cge-card" data-cge-id="a">Alpha</article></div></div>'
        : '<table data-cge-datatable><thead><tr><th data-cge-key="name">Name</th></tr></thead><tbody><tr data-cge-id="a"><td>Alpha</td></tr></tbody></table>');
      const initialHTML = element.outerHTML;
      const Class = kind === 'Grid' ? CGEDataGrid : CGEDataTable;
      const instance = track(Class.init(element)[0]);
      assert(instance && (kind === 'Grid' ? instance.data : instance.rawRows).length === 1, 'Root skipped');
      instance.destroy();
      assert(element.outerHTML === initialHTML, 'Original DOM not restored');
      const replacement = track(Class.init(element)[0]);
      assert((kind === 'Grid' ? replacement.data : replacement.rawRows).length === 1, 'DOM rows lost on recreation');
    });
    await check(`${kind}: new data cancels old removals and parallel removals both finish`, async () => {
      const instance = create(kind, { data: rows, selectable: true });
      const remove = id => kind === 'Grid' ? instance.removeCard(id) : instance.removeRow(id);
      remove('0'); instance.setData(rows); await wait(280);
      assert((kind === 'Grid' ? instance.data : instance.rawRows).length === 3, 'Old timer removed replacement data');
      remove('0'); remove('2'); await wait(280);
      assert((kind === 'Grid' ? instance.data : instance.rawRows).length === 1, 'Parallel removal skipped a row');
    });
  }
  await check('Grid: idless selection stays stable through pagination, sorting and deletion', async () => {
    const instance = create('Grid', { data: rows.map(({ name }) => ({ name })), perPage: 1, selectable: true });
    instance.pagination.nextPage(); instance.toggleSelect('item-1', true);
    assert(instance.getSelectedItems()[0].name === 'Alpha', 'Page used slice index as ID');
    instance.sort.sortBy('name'); instance.filter.apply('Alpha');
    assert(instance.cardsContainer.querySelector('.cge-card').dataset.cgeId === 'item-1', 'Sort/filter changed ID');
    instance.removeCard('item-1'); await wait(280); instance.filter.clear();
    assert(instance.data.length === 2 && instance.data.every(item => item.name !== 'Alpha'), 'Wrong idless item removed');
  });
  await check('Grid: fixed list mode and real CGEAlert positional confirmation', async () => {
    const instance = create('Grid', { data: rows, layoutMode: 'list', selectable: true });
    instance.setViewMode('grid'); assert(instance.viewMode === 'list', 'Fixed layout ignored');
    const calls = [];
    window.CGEAlert = { confirm: async (...args) => { calls.push(args); return { isConfirmed: false }; } };
    instance.toggleSelect('0', true);
    assert(await instance.deleteSelected() === 0 && instance.data.length === 3, 'Cancel removed cards');
    window.CGEAlert.confirm = async (...args) => { calls.push(args); return { isConfirmed: true }; };
    assert(await instance.deleteSelected() === 1 && instance.data.length === 2, 'Confirmed deletion failed');
    assert(typeof calls[0][0] === 'string' && typeof calls[0][1] === 'string'
      && calls[0][2].archetype === 'delete', 'Wrong CGEAlert signature');
  });
  await check('Table: cancelled toolbar confirmation does not delete rows', async () => {
    const instance = create('Table', { data: rows, selectable: true });
    window.CGEAlert = { delete: async () => ({ isConfirmed: false }) };
    instance.toggleSelectRow('0', true);
    instance.selectionBar.querySelector('[data-cge-delete-selected]').click(); await wait(280);
    assert(instance.rawRows.length === 3, 'Dismissed result treated as true');
  });
  await check('Table: sort header keyboard, non-sortable columns and standalone teardown', () => {
    const instance = create('Table', { data: rows, selectable: true, columns: [{ key: 'name' }, { key: 'id', sortable: false }] });
    const header = instance.thead.querySelector('[data-cge-key="name"]');
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert(instance.pagedRows[0].name === 'Alpha' && header.getAttribute('aria-sort') === 'ascending', 'Keyboard sort failed');
    assert(!instance.thead.querySelector('[data-cge-key="id"]').hasAttribute('tabindex'), 'Non-sortable column bound');
    const original = mount('<table><thead><tr><th data-cge-key="name" tabindex="2" class="custom">Name</th></tr></thead></table>');
    const th = original.querySelector('th'); const html = th.outerHTML;
    const sort = new CGESort(); sort.attachHeaders(original); sort.attachHeaders(original); sort.destroy();
    th.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    assert(sort.rules.length === 0 && th.outerHTML === html, 'Sort teardown leaked keyboard/attributes');
  });
  await check('Table: Blade HTML and paginator IDs work across later refresh', () => {
    const instance = create('Table', { selectable: true, serverSide: true });
    instance.options.source = 'ajax';
    instance._handleServerResponse({ full: '<tr data-cge-id="a"><td>Alpha</td></tr>', total: 100, current_page: 2, per_page: 10 });
    instance.toggleSelectRow('a', true);
    assert(instance.getSelectedRows()[0].name === 'Alpha' && instance.pagination.total === 100, 'HTML not ingested into data');
    instance._handleServerResponse({ data: rows, total: 3, current_page: 1, per_page: 10 });
    instance.toggleSelectRow('0', true);
    assert(instance.tbody.querySelector('tr').dataset.cgeId === '0' && instance.getSelectedRows().some(row => row.id === 0), 'Paginator ID mismatch');
  });
  await check('Table: responsive child links to parent and releases rows and scroll classes', () => {
    const instance = create('Table', { data: rows, columns: [{ key: 'name', priority: 1 }, { key: 'id', priority: 3 }] });
    instance.responsive._getContainerWidth = () => 400; instance.responsive.refresh();
    const row = instance.tbody.querySelector('tr'); instance.responsive.expandRow(row);
    assert(row.nextElementSibling.dataset.parentRow === '0', 'Child row lost parent ID');
    instance.setData(rows); assert(instance.responsive.expandedRows.size === 0, 'Detached rows retained');
    const containerClasses = instance.tableContainer.className;
    instance.responsive.setMode('scroll'); instance.responsive.setMode('collapse');
    assert(!instance.thead.classList.contains('sticky') && instance.tableContainer.className === containerClasses, 'Scroll classes remained');
    const element = mount('<div class="base"><table><thead><tr><th>Name</th></tr></thead></table></div>');
    const html = element.outerHTML;
    const responsive = new CGEResponsive({ table: element.querySelector('table'), mode: 'scroll' }); responsive.destroy();
    assert(element.outerHTML === html, 'Standalone responsive failed to restore classes');
  });
  await check('Grid: successful restore action keeps card; delete action removes it', async () => {
    const instance = create('Grid', { data: [{ id: 1, html_card: '<article><button data-cge-action="restore">Restore</button></article>' }], autoBindActions: true });
    const button = instance.cardsContainer.querySelector('button');
    button.dispatchEvent(new CustomEvent('cge:action:success', { bubbles: true, detail: { action: 'restore' } }));
    await wait(280); assert(instance.data.length === 1, 'Restore deleted card');
    button.setAttribute('data-cge-action', 'delete');
    button.dispatchEvent(new CustomEvent('cge:action:success', { bubbles: true, detail: { action: 'delete' } }));
    await wait(280); assert(instance.data.length === 0, 'Delete did not remove card');
  });
  await check('Table: module replacement rebinds search and releases custom extensions', async () => {
    const instance = create('Table', { data: rows });
    instance.use(CGEFilter, { debounce: 0 });
    let rendered = 0; instance.on('rendered', () => rendered++);
    const input = instance.headerBar.querySelector('input'); input.value = 'Alpha';
    input.dispatchEvent(new Event('input')); await wait(20);
    assert(rendered === 1 && instance.pagedRows[0].name === 'Alpha', 'Replaced search binding failed');
    let destroyed = 0;
    instance.use(class { destroy() { destroyed++; } }); instance.destroy();
    assert(destroyed === 1, 'Custom extension not destroyed');
  });
  await check('Table: select-all with no filter matches leaves selection empty', () => {
    const instance = create('Table', { data: rows, selectable: true });
    instance.filter.apply('No match'); instance.selectAll();
    assert(instance.getSelectedIds().length === 0, 'Selected hidden rows after empty filter');
  });
  await check('Grid: existing controls rebind, and original consumer listeners survive destroy', () => {
    const root = mount('<div><div class="cge-datagrid-header"><div class="cge-datagrid-controls"><div class="cge-view-switcher"><button data-cge-view="list">List</button></div><select class="cge-datagrid-perpage"><option value="1">1</option></select></div></div></div>');
    const button = root.querySelector('button'); let clicks = 0;
    button.addEventListener('click', () => clicks++);
    const instance = track(new CGEDataGrid(root, { source: 'json', data: rows }));
    button.click(); assert(instance.viewMode === 'list', 'Existing view button unbound');
    root.querySelector('select').dispatchEvent(new Event('change'));
    assert(instance.pagination.perPage === 1, 'Existing per-page select unbound');
    instance.destroy(); button.click(); assert(clicks === 2, 'Consumer listener lost');
  });
  for (const kind of ['Grid', 'Table']) await check(`${kind}: delayed confirmation cannot modify a destroyed instance`, async () => {
    const instance = create(kind, { data: rows, selectable: true });
    const pending = deferred(); let confirmations = 0;
    window.CGEAlert = { confirm: () => { confirmations++; return pending.promise; }, delete: () => { confirmations++; return pending.promise; } };
    kind === 'Grid' ? instance.toggleSelect('0', true) : instance.toggleSelectRow('0', true);
    let result;
    if (kind === 'Grid') { result = instance.deleteSelected(); await instance.deleteSelected(); }
    else { const button = instance.selectionBar.querySelector('[data-cge-delete-selected]'); button.click(); button.click(); }
    instance.destroy(); pending.resolve({ isConfirmed: true });
    await result; await wait(280);
    assert(confirmations === 1 && (kind === 'Grid' ? instance.data : instance.rawRows).length === 3, 'Pending confirmation deleted destroyed data');
  });
  for (const kind of ['Grid', 'Table']) await check(`${kind}: confirmed bulk removal uses the selection shown in the dialog`, async () => {
    const instance = create(kind, { data: rows, selectable: true });
    const pending = deferred();
    window.CGEAlert = { confirm: () => pending.promise, delete: () => pending.promise };
    const toggle = id => kind === 'Grid' ? instance.toggleSelect(id, true) : instance.toggleSelectRow(id, true);
    toggle('0');
    const result = kind === 'Grid' ? instance.deleteSelected() : instance.selectionBar.querySelector('[data-cge-delete-selected]').click();
    instance.clearSelection(); toggle('2'); pending.resolve({ isConfirmed: true });
    await result; await wait(280);
    const data = kind === 'Grid' ? instance.data : instance.rawRows;
    assert(data.length === 2 && data.some(item => item.id === 2) && !data.some(item => item.id === 0), 'Dialog deleted a later selection');
  });
}
