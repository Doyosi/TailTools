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
