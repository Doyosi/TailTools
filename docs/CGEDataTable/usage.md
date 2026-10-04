# CGEDataTable Usage Guide

## 1. Core Options Reference

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `source` | `'dom' \| 'json' \| 'ajax'` | `'dom'` | Data ingestion mode. |
| `data` | `any[] \| null` | `null` | In-memory dataset (when `source: 'json'`). |
| `url` | `string \| null` | `null` | Endpoint URL (when `source: 'ajax'`). |
| `method` | `string` | `'GET'` | HTTP method for Ajax requests. |
| `headers` | `Record<string, string>` | `{}` | Extra HTTP headers for Ajax requests. |
| `driver` | `'auto' \| 'axios' \| 'fetch'` | `'auto'` | HTTP client driver (`auto` uses `window.axios` if present, falls back to `fetch`). |
| `columns` | `CGEDataTableColumn[]` | `[]` | Explicit column configurations (keys, labels, priority, sortable, types). |
| `serverSide` | `boolean` | `false` | Whether sorting, filtering, and pagination execute on the remote server. |
| `perPage` | `number \| string` | `10` | Default number of records per page (or `'All'`). |
| `perPageOptions` | `Array<number \| string>` | `[10, 25, 50, 100, 'All']` | Selectable per-page options. |
| `responsiveMode` | `'collapse' \| 'scroll'` | `'collapse'` | Adaptive layout strategy on small viewports. |
| `autoBindActions` | `boolean` | `true` | Automatically calls `CGEActionButton.init()` on newly injected row elements. |
| `ui` | `CGEDataTableUIConfig` | `{...}` | Tailwind CSS v4 class slot mapping. |
| `translations` | `CGEDataTableTranslations` | `{...}` | Localization dictionary. |

---

## 2. Public Methods

### Core Orchestrator (`CGEDataTable`)
- `table.refresh()`: Re-runs the active data pipeline (`filter -> sort -> paginate -> render`).
- `table.setData(data: any[])`: Ingests an in-memory array and refreshes the table.
- `table.fetch(extraParams?: Record<string, any>)`: Executes an Ajax request and updates rows and pagination metrics.
- `table.setLoading(isLoading: boolean)`: Toggles the loading overlay and spin indicator.
- `table.use(PluginClass, options)`: Registers a custom or override sub-module.
- `table.on(event, handler)`: Registers an event listener on the instance.
- `table.off(event, handler)`: Removes an event listener.
- `table.destroy()`: Cleans up sub-modules, event listeners, and DOM modifications.

### Sub-Module 1: CGEFilter (`table.filter`)
- `filter.apply(query: string)`: Applies global search term with debounce.
- `filter.attachSearchInput(input: HTMLInputElement | string)`: Binds a global search input.
- `filter.attachColumnFilter(colKey: string, inputOrSelect: HTMLElement | string)`: Binds a column-specific `<select>` or `<input>`. Supports single select, `<select multiple>`, and `CGESelect`.
- `filter.setColumnFilter(colKey: string, value: any)`: Sets or removes column filter (supports string, regex, number range, or array of selected values). Passing `""` or `'all'` clears the column filter.
- `filter.getColumnFilter(colKey: string)`: Retrieves active filter for a column.
- `filter.clear()`: Resets all global and column filters to empty.
- `filter.serialize()`: Returns query parameters `{ search: '...', 'filters[key]': '...' }`.
- `filter.filterRows(rows, columns)`: Client-side row filtering utility.

### Sub-Module 2: CGESort (`table.sort`)
- `sort.sortBy(columnKey: string, direction?: 'asc' | 'desc' | 'none', multi?: boolean)`: Sets sorting for a column.
- `sort.cycleSort(columnKey: string, multi?: boolean)`: Cycles through `asc` -> `desc` -> `none`.
- `sort.getDirection(columnKey: string)`: Returns `'asc'`, `'desc'`, or `'none'`.
- `sort.reset()`: Clears all active sort rules.
- `sort.serialize()`: Returns `{ sort_by: '...', sort_dir: '...' }`.
- `sort.sortRows(rows, columns)`: Client-side row sorting utility.

### Sub-Module 3: CGEPagination (`table.pagination`)
- `pagination.goTo(page: number | string)`: Navigates to a specific page.
- `pagination.next()`: Moves to next page if available.
- `pagination.prev()`: Moves to previous page if available.
- `pagination.first()`: Navigates to page 1.
- `pagination.last()`: Navigates to the final page.
- `pagination.setPerPage(limit: number | string)`: Updates per-page limit and resets to page 1.
- `pagination.setMetrics(metrics)`: Updates `{ page, perPage, total, lastPage }`.
- `pagination.computeWindow(delta?: number)`: Generates sliding window array `[1, '...', 4, 5, 6, '...', 50]`.
- `pagination.getMetricsString()`: Formats string `"Showing 1 to 15 of 180 entries"`.
- `pagination.serialize()`: Returns `{ page: 1, per_page: 10 }`.

### Sub-Module 4: CGEResponsive (`table.responsive`)
- `responsive.refresh()`: Recalculates column visibility, accordion toggles, or mobile card state.
- `responsive.setMode(mode: 'collapse' | 'scroll')`: Switches the adaptive layout mode.
- `responsive.toggleRow(tr: HTMLTableRowElement)`: Toggles child-row accordion expansion.
- `responsive.expandRow(tr: HTMLTableRowElement)`: Expands child row showing hidden columns.
- `responsive.collapseRow(tr: HTMLTableRowElement)`: Collapses child row.
- `responsive.collapseAll()`: Collapses all open child rows.

---

## 3. Events

`CGEDataTable` dispatches both instance callbacks via `table.on(event, handler)` and standard DOM CustomEvents (`cge:datatable:*`):

```javascript
const table = new CGEDataTable('#users-table');

table.on('rendered', (detail) => {
  console.log(`Rendered ${detail.rows.length} rows out of ${detail.total} total`);
});

document.addEventListener('cge:datatable:filter', (e) => {
  console.log('Active filter query:', e.detail.query);
});
```

| Event Name | Detail Payload | Description |
| :--- | :--- | :--- |
| `init` | `{ instance }` | Fired when the instance completes setup. |
| `loading` | `{ loading: boolean, instance }` | Fired when loading state changes. |
| `rendered` | `{ rows: any[], total: number, instance }` | Fired when rows and controls are re-rendered. |
| `filter` | `{ query: string, columns: Record<string, any>, instance }` | Fired when search filter changes. |
| `sort` | `{ rules: Array<{ key, direction }>, instance }` | Fired when column sorting changes. |
| `page` | `{ page: number, perPage: number, instance }` | Fired when page or limit changes. |
| `refresh` | `{ instance }` | Fired when refresh pipeline executes. |
| `error` | `{ error: Error, instance }` | Fired when remote Ajax request fails. |
| `destroy` | `{ instance }` | Fired when the instance is torn down. |

---

## 4. Headless UI Class Slot Customization

You can customize every element of `CGEDataTable` using Tailwind CSS v4 utility classes:

```javascript
new CGEDataTable('#table', {
  ui: {
    wrapper: 'flex flex-col gap-4 font-mono',
    table: 'w-full divide-y divide-violet-200 dark:divide-violet-900',
    thead: 'bg-violet-50 text-violet-900 font-bold',
    th: 'p-3 text-xs uppercase',
    pageButtonActive: 'bg-violet-600 text-white font-bold',
  }
});
```

---

## 5. Localization (i18n)

```javascript
CGEDataTable.setTranslations({
  'search-placeholder': 'Kayıtlarda ara...',
  'per-page': ':count kayıt göster',
  info: ':total kayıttan :from - :to arası gösteriliyor',
  'no-data': 'Eşleşen kayıt bulunamadı',
  loading: 'Veriler yükleniyor...',
  prev: 'Önceki',
  next: 'Sonraki',
  'go-to-page': 'Sayfaya git',
  all: 'Tümü',
  jump: 'Git',
  'collapse-details': 'Detaylar',
});
```

## Data ownership and lifecycle

- Give remote records a stable unique `id` (including zero); Table also accepts `_id`. Fallback IDs for local records stay attached to their records through filtering/sorting/paging. After `setData()` replaces a local dataset, selection resets. Remote selection IDs may persist across pages, while selected data getters return only records in the current response.
- With `source: 'ajax', serverSide: false`, the response is treated as the complete dataset and filtered/sorted/paginated locally. Set `serverSide: true` when the endpoint already returns one Laravel paginator page. The server then owns total/page metrics. Switching the Grid view reuses the loaded page.
- Only the newest request may render or clear loading. A new request aborts the previous one. `destroy()` aborts requests, cancels timers/frames, unbinds controls and restores original DOM nodes/attributes. Calling destroy twice is safe; the same root can be initialized again. Original consumer DOM listeners are retained.
- Fetch/Axios respect the HTTP method. GET/HEAD send query parameters; other methods send JSON with Fetch or request data with Axios. Explicit Axios mode requires `window.axios.request`. Provide Laravel CSRF headers for authenticated POST requests.
- HTML renderers/formatters and Blade snippets accept trusted application HTML. Escape user text when building these strings. A Grid renderer should return one wrapping element.
- Bulk removal and `removeCard()/removeRow()` change the local view only; they do not send DELETE requests to the server. Use your backend endpoint or CGEActionButton for persistence. Only destructive action successes remove a card/row; restore and unrelated actions keep it.

## Selection and standalone modules

Set `selectable: true` (default false) to add row checkboxes and the selection toolbar. `selectAll(): this` selects the visible page, `clearSelection(): this` clears IDs, `toggleSelectRow(id: string | number, state?: boolean): this` toggles one, `getSelectedIds(): string[]` and `getSelectedRows(): any[]` read selection. `deleteSelected(): this` removes selected rows locally after 250 ms; its toolbar prompts first. `removeRow(idOrElement): this` removes one row. Dismissing CGEAlert never deletes data.

Selection events: `selection:change` carries `{ selectedIds, count, instance }`; `rows:deleted` carries `{ ids, instance }`; `row:deleted` carries `{ rowId, element, instance }`. DOM names prepend `cge:datatable:`.

Standalone filter/sort/pagination notifications use their constructor `onChange(payload)` callback, not an `.on()` method. When both callback and parent reference exist, the callback is used once. `use()` releases the replaced module and rebinds its controls; custom extensions with a destroy method are released with the table.

`fetch()` emits `error` and rejects HTTP/network failures. Internal automatic calls consume that rejection after emitting it; explicit calls should use try/catch. Aborted/stale requests are silent. Header Enter/Space sorts once, `data-cge-sortable="false"` disables sorting and selection headers are never sortable. Loading sets `aria-busy`.
