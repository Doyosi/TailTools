import { CGEDataGrid } from '../plugins/CGEDataGrid/index.js';
import { CGEDataTable, CGEFilter, CGESort, CGEResponsive, escapeHTML } from '../plugins/CGEDataTable/index.js';

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
      let aliases = 0;
      instance.on('fetch-error', () => errors++);
      instance.on('error', () => aliases++);
      window.fetch = async () => new Response('Failure', { status: 422 });
      let rejected = null;
      try { await instance.fetch(); } catch (error) { rejected = error; }
      assert(rejected?.status === 422 && rejected.message.includes('422'), 'fetch() did not reject with the HttpError');
      assert(errors === 1 && aliases === 1 && !instance.loading && (kind === 'Grid' ? instance.data : instance.rawRows).length === 3, 'Failure damaged data/loading');
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
  for (const kind of ['Grid', 'Table']) {
    await check(`${kind}: emits both Table and Grid event names`, () => {
      const instance = create(kind, { data: rows, selectable: true });
      const seen = [];
      for (const name of ['render', 'rendered', 'selection-change', 'selection:change', 'destroy', 'destroyed']) instance.on(name, () => seen.push(name));
      instance.refresh();
      kind === 'Grid' ? instance.toggleSelect('0', true) : instance.toggleSelectRow('0', true);
      instance.destroy();
      for (const name of ['render', 'rendered', 'selection-change', 'selection:change', 'destroy', 'destroyed']) assert(seen.includes(name), `Missing ${name}`);
    });
    await check(`${kind}: server rows without IDs do not share selection across pages`, async () => {
      const instance = create(kind, { url: '/collection', driver: 'fetch', serverSide: true, selectable: true, perPage: 2 });
      instance.options.source = 'ajax';
      const warn = console.warn; let warnings = 0; console.warn = () => warnings++;
      try {
        window.fetch = async url => {
          const page = Number(new URL(url).searchParams.get('page'));
          return response({ data: [{ name: `P${page} first` }, { name: `P${page} second` }], total: 6, current_page: page, per_page: 2 });
        };
        await instance.fetch();
        const firstId = (kind === 'Grid' ? instance.cardsContainer.querySelector('.cge-card') : instance.tbody.querySelector('tr')).dataset.cgeId;
        kind === 'Grid' ? instance.toggleSelect(firstId, true) : instance.toggleSelectRow(firstId, true);
        kind === 'Grid' ? instance.pagination.nextPage() : instance.pagination.next();
        await wait(20);
        const checkbox = (kind === 'Grid' ? instance.cardsContainer : instance.tbody).querySelector('input[type="checkbox"]');
        assert(instance.pagination.page === 2 && checkbox && !checkbox.checked, 'Page 2 row inherited the page 1 selection');
        assert(instance.getSelectedIds().length === 1 && /^p1/.test(instance.getSelectedIds()[0]), 'Fallback ID not page-scoped');
        assert(warnings === 1, 'Missing one-time ID warning');
      } finally { console.warn = warn; }
    });
    await check(`${kind}: destroyAll tears down instances inside a root and detached instances`, () => {
      const host = mount(kind === 'Grid' ? '<section><div data-cge-datagrid></div></section>' : '<section><table data-cge-datatable><thead><tr><th>Name</th></tr></thead><tbody></tbody></table></section>');
      const Class = kind === 'Grid' ? CGEDataGrid : CGEDataTable;
      const instance = Class.init(host)[0];
      assert(instance && !instance._destroyed, 'Instance not created');
      const destroyed = Class.destroyAll(host);
      assert(instance._destroyed && destroyed.includes(instance) && !Class.instances.has(kind === 'Grid' ? instance.root : instance.tableElement), 'destroyAll skipped instance');
      const detached = track(Class.init(host)[0]);
      host.remove();
      Class.init(document.createElement('div'));
      assert(detached._destroyed, 'init() did not prune a detached instance');
    });
  }
  await check('Table: raw cell values render as text; formatter HTML stays trusted', () => {
    const payload = '<img src=x onerror="window.__cgeXss=1">';
    const instance = create('Table', { data: [{ id: 1, name: payload, role: payload }], columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role', formatter: value => `<strong class="badge">${escapeHTML(value)}</strong>` },
    ] });
    const cells = instance.tbody.querySelectorAll('td');
    assert(!instance.tbody.querySelector('img') && cells[0].textContent === payload, 'Raw value parsed as HTML');
    assert(cells[1].querySelector('strong.badge')?.textContent === payload, 'Formatter HTML or escaping broken');
    const node = document.createElement('em'); node.textContent = 'node';
    instance.columns[1].formatter = () => node; instance.refresh();
    assert(instance.tbody.querySelector('em') === node, 'Formatter Node not appended');
    assert(window.__cgeXss === undefined, 'Payload executed');
  });
  await check('Table: html columns render server markup and stay out of global search', () => {
    const button = '<button type="button" data-cge-action="delete">Cancel</button>';
    const instance = create('Table', { data: [{ id: 1, name: 'Stripe', actions: button }, { id: 2, name: 'Vercel', actions: button }], columns: [
      { key: 'name', label: 'Name' },
      { key: 'actions', label: 'Actions', html: true, sortable: false },
    ] });
    assert(instance.tbody.querySelectorAll('button[data-cge-action="delete"]').length === 2, 'html column rendered as text');
    instance.filter.apply('Cancel');
    assert(instance.tbody.querySelectorAll('tr[data-cge-id]').length === 0, 'Markup in html column was searchable');
    instance.filter.apply('Stripe');
    assert(instance.tbody.querySelectorAll('button').length === 1, 'Search over text columns broke');
    const th = mount('<table><thead><tr><th data-cge-key="name">Name</th><th data-cge-key="actions" data-cge-html>Actions</th></tr></thead><tbody></tbody></table>');
    const declarative = track(new CGEDataTable(th, { source: 'json', autoBindActions: false, data: [{ id: 3, name: 'A', actions: button }] }));
    assert(declarative.columns.find(c => c.key === 'actions')?.html === true && declarative.tbody.querySelector('button'), 'data-cge-html ignored');
  });
  await check('Grid: renderer output is trusted while default cards stay text', () => {
    const payload = '<img src=x onerror="window.__cgeXss=1">';
    const instance = create('Grid', { data: [{ id: 1, title: payload }],
      cardRenderer: item => `<article><h3>${escapeHTML(item.title)}</h3></article>` });
    assert(!instance.cardsContainer.querySelector('img') && instance.cardsContainer.querySelector('h3').textContent === payload, 'Renderer escaping failed');
    const plain = create('Grid', { data: [{ id: 2, title: payload }] });
    assert(!plain.cardsContainer.querySelector('img'), 'Fallback card parsed HTML');
  });
  await check('Table: API Resource meta, simplePaginate and All selection stay in sync', () => {
    const instance = create('Table', { serverSide: true, perPageOptions: [10, 'All'] });
    instance.options.source = 'ajax';
    instance._handleServerResponse({ data: rows, meta: { current_page: 2, last_page: 4, per_page: 10, total: 33 }, links: { next: '?page=3' } });
    assert(instance.pagination.total === 33 && instance.pagination.page === 2 && instance.pagination.lastPage === 4, 'Resource meta ignored');
    instance._handleServerResponse({ data: rows, current_page: 3, per_page: 10, next_page_url: null, prev_page_url: '?page=2' });
    assert(instance.pagination.mode === 'simple' && instance.pagination.lastPage === 3 && instance.paginationControls.querySelector('[data-cge-page-action="next"]').disabled, 'simplePaginate end not detected');
    const select = instance.headerBar.querySelector('[data-cge-per-page-select]');
    select.value = 'All';
    instance.pagination.perPage = 0;
    instance._handleServerResponse({ data: rows, total: 3, current_page: 1, per_page: 3 });
    assert(select.value === 'All' && instance.pagination.serialize().per_page === -1, 'All selection desynced');
  });
  await check('Grid: field filter reads initial Blade value and fetch rejection is handled on init', async () => {
    const root = mount('<div><select data-cge-filter="category"><option value="all">All</option><option value="JS" selected>JS</option></select></div>');
    const instance = track(new CGEDataGrid(root, { source: 'json', autoBindActions: false,
      data: [{ id: 1, title: 'A', category: 'JS' }, { id: 2, title: 'B', category: 'PHP' }] }));
    assert(instance.processedData.length === 1 && instance.processedData[0].id === 1, 'Initial select value ignored');
    const filterSelect = root.querySelector('select[data-cge-filter]'); filterSelect.value = 'all'; filterSelect.dispatchEvent(new Event('change'));
    assert(instance.processedData.length === 2, "'all' did not clear the filter");
    let unhandled = 0; const onUnhandled = () => unhandled++;
    window.addEventListener('unhandledrejection', onUnhandled);
    window.fetch = async () => new Response('Down', { status: 500 });
    track(new CGEDataGrid(mount('<div></div>'), { source: 'ajax', url: '/collection', driver: 'fetch', autoBindActions: false }));
    await wait(50); window.removeEventListener('unhandledrejection', onUnhandled);
    assert(unhandled === 0, 'init() left an unhandled rejection');
  });
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
  await check('Grid: responsive pagination jump works locally with translated controls', () => {
    const instance = create('Grid', { data: Array.from({ length: 60 }, (_, id) => ({ id, name: `Item ${id}` })), perPage: 6,
      translations: { prev: 'Önceki', next: 'Sonraki', 'go-to-page': 'Sayfaya git', jump: 'Git', pagination: 'Sayfalama' } });
    const compact = instance.paginationEl.querySelector('.cge-pagination-compact');
    const desktop = instance.paginationEl.querySelector('.cge-pagination-desktop');
    assert(compact && desktop && instance.paginationEl.getAttribute('aria-label') === 'Sayfalama', 'Responsive layouts/label missing');
    assert(compact.querySelector('[data-cge-page-action="prev"]').disabled, 'Previous boundary enabled');
    const input = compact.querySelector('[data-cge-jump-input]'); input.value = '8';
    compact.querySelector('[data-cge-jump-btn]').click();
    assert(instance.pagination.page === 8 && instance.cardsContainer.querySelector('.cge-card').dataset.cgeId === '42', 'Mobile jump failed');
    const desktopInput = instance.paginationEl.querySelector('.cge-pagination-desktop input'); desktopInput.value = '999';
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }); desktopInput.dispatchEvent(enter);
    assert(enter.defaultPrevented && instance.pagination.page === 10, 'Enter jump/clamp failed');
    assert(instance.paginationEl.querySelector('[aria-current="page"]').textContent === '10', 'Active page not announced');
    assert(instance.paginationEl.querySelector('.cge-pagination-compact [data-cge-page-action="next"]').disabled, 'Last-page boundary enabled');
  });
  await check('Grid: mobile jump requests the correct server page', async () => {
    const instance = create('Grid', { url: '/collection', driver: 'fetch', serverSide: true, perPage: 6 });
    instance.options.source = 'ajax'; let requestedPage;
    window.fetch = async url => {
      requestedPage = Number(new URL(url).searchParams.get('page'));
      return response({ data: [{ id: requestedPage, name: `Page ${requestedPage}` }], total: 60, current_page: requestedPage, per_page: 6 });
    };
    await instance.fetch();
    const compact = instance.paginationEl.querySelector('.cge-pagination-compact');
    compact.querySelector('input').value = '4'; compact.querySelector('[data-cge-jump-btn]').click();
    await wait(20);
    assert(requestedPage === 4 && instance.pagination.page === 4 && instance.cardsContainer.textContent.includes('Page 4'), 'Server jump failed');
  });
  await check('Grid: fading loading preserves cards and cancels an old hide timer', async () => {
    const instance = create('Grid', { data: rows, translations: { loading: 'Loading <items>' } });
    const card = instance.cardsContainer.querySelector('.cge-card');
    instance.setLoading(true); await wait(30);
    assert(instance.loadingEl.getAttribute('role') === 'status' && instance.loadingEl.textContent.includes('Loading <items>'), 'Loading status/translation missing');
    assert(!instance.loadingEl.classList.contains('hidden') && !instance.loadingEl.classList.contains('opacity-0'), 'Overlay did not fade in');
    assert(instance.cardsContainer.contains(card) && instance.cardsContainer.getAttribute('aria-busy') === 'true', 'Loading replaced cards');
    instance.setLoading(false); await wait(50); instance.setLoading(true); await wait(220);
    assert(!instance.loadingEl.classList.contains('hidden') && instance.loading, 'Old fade timer hid new loading');
    instance.setLoading(false);
    assert(getComputedStyle(instance.loadingEl).pointerEvents === 'none', 'Fading overlay blocks completed page');
    await wait(220); assert(instance.loadingEl.classList.contains('hidden'), 'Overlay did not finish fade out');
  });
  await check('Grid: destroy cancels pending loading frame and fade cleanup', async () => {
    const instance = create('Grid', { data: rows });
    instance.setLoading(true); instance.setLoading(false);
    const overlay = instance.loadingEl; const classes = overlay.className;
    instance.destroy(); await wait(220);
    assert(overlay.className === classes && instance._frames.size === 0 && instance._timers.size === 0, 'Loading work ran after destroy');
  });
}
