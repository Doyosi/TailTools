# CGEDataGrid Usage Guide

This guide covers options, methods, event hooks, and customization patterns for `CGEDataGrid`.

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `source` | `'dom' \| 'json' \| 'ajax'` | `'dom'` | Data ingestion strategy. |
| `data` | `any[] \| null` | `null` | In-memory dataset for `source: 'json'`. |
| `url` | `string \| null` | `null` | Remote endpoint URL for `source: 'ajax'`. |
| `driver` | `'auto' \| 'axios' \| 'fetch'` | `'auto'` | HTTP client driver for Ajax requests (`auto` uses `axiosInstance`/`window.axios` when present). |
| `axiosInstance` | `{ request(config) } \| null` | `null` | Configured axios instance; wins over `window.axios`. |
| `serverSide` | `boolean` | `false` | Whether filtering, sorting, and pagination are handled by remote API. |
| `perPage` | `number \| string` | `12` | Items per page (`'All'` or `0` for unlimited). |
| `perPageOptions`| `Array<number \| string>` | `[6, 12, 24, 48, 'All']` | Per-page dropdown options. |
| `allValue` | `number \| string` | `-1` | `per_page` value sent for **All** (previously the literal `'All'`). |
| `paramNames` | `{ page, perPage, sort, direction, search, filters, cursor }` | `{}` | Renames request parameters. |
| `responseAdapter` | `(response) => ({ rows, total, page, perPage, lastPage, hasMore })` | `null` | Maps a custom API response; Laravel paginators work without it. |
| `searchKeys` | `string[] \| null` | `null` | Fields searched by the global query. Default: primitive fields except `_*`, `html_*`/`*_html` and the configured HTML keys (DOM cards search their `text`). |
| `locale` | `string \| null` | `<html lang>` | Locale for case/accent-insensitive search and text sorting (`'tr'` handles İ/ı). |
| `layoutMode` | `'grid' \| 'list' \| 'both'`| `'both'` | Layout modes allowed. `'both'` renders a view switcher toggle. |
| `viewMode` | `'grid' \| 'list'` | `'grid'` | Initial active view mode. |
| `gridCols` | `string` | `'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'` | Tailwind grid column classes. |
| `listGap` | `string` | `'gap-3'` | Tailwind gap class in list view. |
| `cardRendererGrid` | `Function \| null` | `null` | `(item, index) => string \| HTMLElement` for grid view. |
| `cardRendererList` | `Function \| null` | `null` | `(item, index) => string \| HTMLElement` for list view. |
| `cardRenderer` | `Function \| null` | `null` | Fallback renderer `(item, index, viewMode) => string \| HTMLElement`. Renderer strings are trusted HTML: escape item values with the exported `escapeHTML`. Without a renderer the fallback card shows the record as text. |
| `htmlCardKey` | `string` | `'html_card'` | Resource key for direct grid HTML string. |
| `htmlListKey` | `string` | `'html_list'` | Resource key for direct list HTML string. |
| `selectable` | `boolean` | `false` | Enables card checkboxes, selection glow, and bulk action toolbar. |
| `selectOnClick` | `boolean` | `false` | Allows clicking anywhere on card to toggle selection. |
| `autoBindActions`| `boolean` | `true` | Automatically binds `CGEActionButton` and animates deleted cards. |
| `ui` | `Partial<CGEDataGridUIConfig>` | `{...}` | Custom Tailwind CSS class mappings. |
| `translations` | `Partial<CGEDataGridTranslations>` | `{...}` | Localization dictionary. |

---

## Public Methods

### Data Management
- `setData(data: any[]): this`  
  Replaces current dataset and triggers local re-render.
- `fetch(extraParams?: Record<string, any>): Promise<any>`  
  Requests data from remote endpoint syncing filter, sort, and pagination query params.
- `refresh(): this`  
  Re-filters, sorts, paginates, and renders active view.
- `setLoading(isLoading: boolean): this`  
  Toggles loading overlay with blur backdrop.

### Layout & Views
- `setViewMode(mode: 'grid' | 'list'): this`  
  Switches between card grid and horizontal list views.

### Selection Engine
- `selectAll(): this`  
  Selects all items currently matching filters.
- `clearSelection(): this`  
  Clears all active selections.
- `toggleSelect(id: string | number, force?: boolean): this`  
  Toggles or sets selection state for an individual card.
- `getSelectedIds(): string[]`  
  Returns array of selected IDs.
- `getSelectedItems(): any[]`  
  Returns array of full data objects currently selected.
- `deleteSelected(): Promise<number>`  
  Prompts user confirmation and deletes all selected items.
- `removeCard(target: HTMLElement | string): boolean`  
  Smoothly animates card removal from DOM and dataset.

### Sub-Modules
- `grid.filter: CGEFilter` - Access debounced search and column/field filters.
- `grid.sort: CGESort` - Access field sorting and sort dropdown bindings.
- `grid.pagination: CGEPagination` - Access page navigation, sliding window, and limits.

Grid and Table share one module implementation, so both method families work: `goToPage`/`goTo`, `nextPage`/`next`, `prevPage`/`prev`, `getWindow`/`computeWindow`, `formatInfo`/`getMetricsString`, `setFilter`/`setColumnFilter`, `attachFieldFilter`/`attachColumnFilter`, `filterData`/`filterRows`, `toggleSort`/`cycleSort`, `clear`/`reset`, `sortData`/`sortRows`. `setFilter(key, 'all' | '')` clears a filter; `[data-cge-filter]` controls apply their initial value (Blade `old()`), text inputs are debounced per element, and `getWindow()` never hides a single page behind `...`. Sorting detects one type per field and only treats real dates (`YYYY-MM-DD`, `DD.MM.YYYY`, `DD/MM/YYYY`) as dates, so codes like `A-10` sort as text.

### Teardown
- `destroy(): void`  
  Removes DOM event listeners, cleans sub-modules, and removes instance registry.
- `CGEDataGrid.init(root?)`: Destroys instances whose root left the DOM, then initializes `[data-cge-datagrid]` inside `root`.
- `CGEDataGrid.destroyAll(root = document)`: Destroys instances inside `root` (and detached ones) before Livewire/Turbo replaces markup.
- `CGEDataGrid.get(target)`: Returns the instance for a root element or selector.

---

## Event Hooks

You can listen for events using `.on(event, handler)` or DOM CustomEvents:

```javascript
const grid = new CGEDataGrid('#my-grid', { ... });

// Instance callback
grid.on('viewmode', (detail) => {
  console.log('Switched to view:', detail.viewMode);
});

// DOM CustomEvent
document.querySelector('#my-grid').addEventListener('cge:datagrid:selection-change', (e) => {
  console.log('Selected count:', e.detail.selectedIds.length);
});
```

| Event | DOM Event | Payload |
| :--- | :--- | :--- |
| `init` | `cge:datagrid:init` | `{ instance }` |
| `render` (alias `rendered`) | `cge:datagrid:render` | `{ items, total, instance }` |
| `viewmode` | `cge:datagrid:viewmode` | `{ viewMode, instance }` |
| `selection-change` (alias `selection:change`) | `cge:datagrid:selection-change` | `{ selectedIds, selectedItems, instance }` |
| `fetch-error` (alias `error`) | `cge:datagrid:fetch-error` | `{ error, instance }` |
| `data-loaded` | `cge:datagrid:data-loaded` | `{ data, raw, instance }` |
| `bulk-delete` | `cge:datagrid:bulk-delete` | `{ deletedCount, deletedIds, instance }` |
| `card-removed` | `cge:datagrid:card-removed` | `{ id, card, instance }` |
| `destroyed` (alias `destroy`) | `cge:datagrid:destroyed` | `{ instance }` |

Aliases are emitted with the same payload (and as `cge:datagrid:<alias>` DOM events) so Grid and Table listeners are interchangeable.

## Data ownership and lifecycle

- Give remote records a stable unique `id` (including zero); Table also accepts `_id`. Fallback IDs for local records stay attached to their records through filtering/sorting/paging. After `setData()` replaces a local dataset, selection resets. Remote selection IDs may persist across pages, while selected data getters return only records in the current response. With `serverSide: true`, items without `id` get page-scoped IDs (`p2-item-0`) and a one-time console warning, so a selection never leaks to another page.
- With `source: 'ajax', serverSide: false`, the response is treated as the complete dataset and filtered/sorted/paginated locally. Set `serverSide: true` when the endpoint already returns one Laravel paginator page. The server then owns total/page metrics. Switching the Grid view reuses the loaded page.
- Only the newest request may render or clear loading. A new request aborts the previous one. `destroy()` aborts requests, cancels timers/frames, unbinds controls and restores original DOM nodes/attributes. Calling destroy twice is safe; the same root can be initialized again. Original consumer DOM listeners are retained.
- Fetch/Axios respect the HTTP method. GET/HEAD send query parameters (arrays as `key[]`); other methods send nested JSON and Laravel CSRF headers automatically. Explicit Axios mode requires `axiosInstance` or `window.axios.request`. HTTP failures reject with `HttpError` (`status`, `data`, `errors`).
- Laravel `paginate()`, API Resource collections (`{ data, meta, links }`), `simplePaginate()` (no total; prev/next and "Showing :from to :to items") and `cursorPaginate()` (prev/next only) are read automatically; use `responseAdapter` for other APIs. "All" is sent as `per_page=-1` and stays selected when the server answers with `per_page = total`.
- Renderer output and Blade `html_card`/`html_list` snippets are trusted application HTML. Escape user text with `escapeHTML` (`import { escapeHTML } from 'tailtools/CGEDataGrid'`). A Grid renderer should return one wrapping element.
- Bulk removal and `removeCard()/removeRow()` change the local view only; they do not send DELETE requests to the server. Use your backend endpoint or CGEActionButton for persistence. Only destructive action successes remove a card/row; restore and unrelated actions keep it.

Grid `layoutMode: 'grid' | 'list'` fixes the allowed view; `both` permits switching. `deleteSelected()` uses positional CGEAlert confirmation, returns the actual removed count, and preserves data on dismissal. Fetch errors emit `fetch-error` and `error` and **reject** (changed: previously resolved); the current dataset is retained and automatic fetches from `init`/`refresh()` handle the rejection, so only explicit `await grid.fetch()` calls need try/catch.

| Additional option | Type | Default |
| --- | --- | --- |
| `method` | `string` | `GET` |
| `headers` | `Record<string, string>` | `{}` |

The `fetch-error` DOM event is `cge:datagrid:fetch-error` with `{ error, instance }`. View buttons have `aria-pressed`, paging boundaries are disabled and loading sets `aria-busy`.

## Responsive footer and loading feedback

Both footer layouts exist in the DOM. Tailwind `sm:hidden` / `hidden sm:flex` select the visible layout automatically after resizing, without a refetch. The mobile layout includes previous/next, current/total, numeric page jump and a Go button; it wraps on narrow screens. Desktop shows numbered pages and a jump control when there are more than five pages. Button and Enter jumps clamp to valid page bounds and use the local or server-side pipeline.

`setLoading(true)` retains existing cards, marks the root/cards container `aria-busy` and fades in a backdrop with an accessible status. `setLoading(false)` fades out for 200 ms; the transparent overlay immediately stops intercepting clicks. Re-entering loading cancels a pending hide timer. Destroy cancels both timers and animation frames. Reduced-motion styles disable the overlay transition/spinner.

Translations: `loading`, `prev`, `next`, `go-to-page`, `jump`, `pagination` and `info-simple` (used when the server total is unknown). Style slots remain `paginationWrapper`, `pageButton`, `pageButtonActive`, `pageButtonDisabled`, `jumpWrapper`, `jumpInput`, `jumpButton` and `loadingOverlay`. The default animation duration is 200 ms.
