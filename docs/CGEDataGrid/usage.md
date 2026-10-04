# CGEDataGrid Usage Guide

This guide covers options, methods, event hooks, and customization patterns for `CGEDataGrid`.

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `source` | `'dom' \| 'json' \| 'ajax'` | `'dom'` | Data ingestion strategy. |
| `data` | `any[] \| null` | `null` | In-memory dataset for `source: 'json'`. |
| `url` | `string \| null` | `null` | Remote endpoint URL for `source: 'ajax'`. |
| `driver` | `'auto' \| 'axios' \| 'fetch'` | `'auto'` | HTTP client driver for Ajax requests. |
| `serverSide` | `boolean` | `false` | Whether filtering, sorting, and pagination are handled by remote API. |
| `perPage` | `number \| string` | `12` | Items per page (`'All'` or `0` for unlimited). |
| `perPageOptions`| `Array<number \| string>` | `[6, 12, 24, 48, 'All']` | Per-page dropdown options. |
| `layoutMode` | `'grid' \| 'list' \| 'both'`| `'both'` | Layout modes allowed. `'both'` renders a view switcher toggle. |
| `viewMode` | `'grid' \| 'list'` | `'grid'` | Initial active view mode. |
| `gridCols` | `string` | `'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'` | Tailwind grid column classes. |
| `listGap` | `string` | `'gap-3'` | Tailwind gap class in list view. |
| `cardRendererGrid` | `Function \| null` | `null` | `(item, index) => string \| HTMLElement` for grid view. |
| `cardRendererList` | `Function \| null` | `null` | `(item, index) => string \| HTMLElement` for list view. |
| `cardRenderer` | `Function \| null` | `null` | Fallback renderer `(item, index, viewMode) => string \| HTMLElement`. |
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

### Teardown
- `destroy(): void`  
  Removes DOM event listeners, cleans sub-modules, and removes instance registry.

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
| `render` | `cge:datagrid:render` | `{ items, total, instance }` |
| `viewmode` | `cge:datagrid:viewmode` | `{ viewMode, instance }` |
| `selection-change` | `cge:datagrid:selection-change` | `{ selectedIds, selectedItems, instance }` |
| `data-loaded` | `cge:datagrid:data-loaded` | `{ data, raw, instance }` |
| `bulk-delete` | `cge:datagrid:bulk-delete` | `{ deletedCount, deletedIds, instance }` |
| `card-removed` | `cge:datagrid:card-removed` | `{ id, card, instance }` |
| `destroyed` | `cge:datagrid:destroyed` | `{ instance }` |
