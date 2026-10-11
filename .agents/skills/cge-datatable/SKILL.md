---
name: cge-datatable
description: High-performance, tree-shakeable data grid engine designed for Tailwind CSS v4.3+ and Laravel Blade. Features a decoupled modular architecture (CGEFilter, CGESort, CGEPagination, CGEResponsive), multi-format data ingestion (DOM table, in-memory JSON, Laravel LengthAwarePaginator Ajax, and server-rendered Blade HTML rows), adaptive responsive layouts (priority collapse with child row accordions, sticky scroll), and automated lifecycle binding for CGEActionButton.
---

# CGEDataTable Agent Skill

Use this skill when designing, implementing, configuring, or debugging high-performance data grids, sortable tables, searchable lists, remote pagination, and mobile-adaptive tabular interfaces in **TailTools** with Tailwind CSS v4.3+ and Laravel Blade.

---

## 1. When to Use CGEDataTable

Activate this skill when the user requests:
- "Build a data table with search, sorting, and pagination in Tailwind CSS and Laravel."
- "Implement server-side Ajax pagination using Laravel `LengthAwarePaginator` JSON."
- "Create responsive data tables that collapse low-priority columns into an interactive child-row accordion (`+ / -`)."
- "Inject server-rendered Blade HTML table rows (`data.full`) via Ajax without page refresh."
- "Ensure row-level action buttons (like delete, restore, forceDelete) trigger confirmation dialogs (`CGEActionButton` / `CGEAlert`) and re-bind automatically."
- "Use standalone sub-modules (`CGEFilter`, `CGESort`, `CGEPagination`, `CGEResponsive`) on custom tables or lists."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEDataTable/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEDataTable } from 'tailtools';

// Automatically scans and initializes all [data-cge-datatable] elements
initTailTools();

// Global registration
window.CGEDataTable = CGEDataTable;
```

---

## 3. Declarative Markup Patterns

### A. Static DOM Table with Sorting, Search, and Priority Collapse

```html
<table data-cge-datatable
       data-cge-per-page="10"
       data-cge-responsive="collapse">
    <thead>
        <tr>
            <th data-cge-key="name" data-cge-priority="1">User</th>
            <th data-cge-key="email" data-cge-priority="2">Email Address</th>
            <th data-cge-key="role" data-cge-priority="3">Role</th>
            <th data-cge-key="created" data-cge-type="date" data-cge-priority="3">Joined</th>
            <th data-cge-key="balance" data-cge-type="currency" data-cge-priority="2">Balance</th>
            <th data-cge-key="actions" data-cge-priority="1">Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="font-semibold text-slate-900">Sarah Jenkins</td>
            <td>sarah.j@example.com</td>
            <td><span class="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">Admin</span></td>
            <td>2026-03-15</td>
            <td data-cge-val="1420.50">$1,420.50</td>
            <td>
                <button type="button"
                        data-cge-action="delete"
                        data-cge-url="/api/users/1"
                        data-cge-title="Delete Sarah Jenkins?"
                        data-cge-message="This user will be permanently deleted."
                        class="px-2.5 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Delete
                </button>
            </td>
        </tr>
    </tbody>
</table>
```

### B. Remote Ajax with Laravel Pagination (`serverSide: true`)

```html
<div id="users-datatable"></div>

<script type="module">
    import { CGEDataTable, escapeHTML } from 'tailtools/CGEDataTable';

    const table = new CGEDataTable('#users-datatable', {
        source: 'ajax',
        url: '/api/users',
        serverSide: true,
        perPage: 15,
        responsiveMode: 'collapse',
        columns: [
            { key: 'id', label: 'ID', priority: 1, type: 'number' },
            { key: 'name', label: 'Name', priority: 1, type: 'string' },
            { key: 'email', label: 'Email', priority: 2, type: 'string' },
            { key: 'role', label: 'Role', priority: 3, type: 'string' },
            {
                key: 'created_at',
                label: 'Joined',
                priority: 3,
                type: 'date',
                formatter: (val) => new Date(val).toLocaleDateString()
            },
            {
                key: 'actions',
                label: 'Actions',
                priority: 1,
                // Formatter strings are trusted HTML: escape every interpolated value.
                formatter: (_, row) => `
                    <button type="button"
                            data-cge-action="delete"
                            data-cge-url="/api/users/${escapeHTML(row.id)}"
                            data-cge-title="Delete #${escapeHTML(row.id)}?"
                            class="px-2 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">
                        Delete
                    </button>
                `
            }
        ]
    });
</script>
```

---

## 4. Sub-Modules (Standalone Usage)

### CGEFilter (`modules/CGEFilter.js`)
Independent filtering engine with configurable debounce and server serialization:
```javascript
import { CGEFilter } from 'tailtools/plugins/CGEDataTable/modules/CGEFilter.js';

const filter = new CGEFilter({
    debounce: 300,
    onChange: ({ global, serialized }) => {
        // serialized: { search: global, 'filters[status]': 'active' }
    }
});
filter.attachSearchInput('#search-input');
filter.attachColumnFilter('status', '#status-select'); // Supports <select>, <select multiple>, and CGESelect
```

### CGESort (`modules/CGESort.js`)
Independent sorting engine with natural type detection and SVG arrow indicators:
```javascript
import { CGESort } from 'tailtools/plugins/CGEDataTable/modules/CGESort.js';

const sort = new CGESort({ defaultDirection: 'asc' });
sort.attachHeaders('#my-table th');
```

### CGEPagination (`modules/CGEPagination.js`)
Independent pagination engine with sliding window computation:
```javascript
import { CGEPagination } from 'tailtools/plugins/CGEDataTable/modules/CGEPagination.js';

const pager = new CGEPagination({ page: 1, perPage: 10, total: 120 });
const windowPages = pager.computeWindow(); // [1, 2, 3, 4, 5, '...', 12]
```

### CGEResponsive (`modules/CGEResponsive.js`)
Adaptive collapse and horizontal scroll:
```javascript
import { CGEResponsive } from 'tailtools/plugins/CGEDataTable/modules/CGEResponsive.js';

const resp = new CGEResponsive({ mode: 'collapse', table: '#my-table' });
```

---

## 5. Automated Lifecycle Binding with CGEActionButton

`CGEDataTable` automatically invokes `CGEActionButton.init()` on newly injected row elements across page swaps, search queries, column sorting, and server-rendered HTML injections.

No manual event binding is required when rows contain action buttons with `data-cge-action="delete"` or confirmation dialogs.

## Maintenance contracts

- Keep the shipped API and existing theme. Use stable unique `id` values for remote records; zero is a valid ID. Set `serverSide: true` for a paginated Laravel endpoint, or false for a complete array processed locally.
- Standalone module callbacks use constructor `onChange`, not `.on()`. Filter/Sort/Pagination are one shared implementation (`plugins/shared/collection-{filter,sort,pagination}.js`) re-exported by both plugin module paths, so Grid and Table names both work (`setFilter`/`setColumnFilter`, `goToPage`/`goTo`, `getWindow`/`computeWindow`, `filterData`/`filterRows`, `toggleSort`/`cycleSort`, `clear`/`reset`). Fix collection behavior once in the shared core.
- New requests abort the previous request; stale responses cannot render or clear loading. Destroy cancels requests, timers, frames and listeners, restores original DOM, and permits recreation. Update all four plugin docs and verify browser regressions after maintenance.
- Removal methods are local view operations; persist deletions with your own backend endpoint or CGEActionButton. A restore success must not remove the card/row. CGEActionButton.init() takes a selector string; global delegation covers future rows, so do not pass an HTMLElement.
- CGEAlert methods take positional title/message/options and return an object with `isConfirmed`; dismissal is not confirmation. Grid deleteSelected returns a Promise<number>; Table deleteSelected returns the table and its toolbar asks first.

## Stability rules (October 2026)

- XSS: raw values render as text. Server-rendered markup in a JSON/AJAX field (Blade action buttons) needs an explicit per-column `html: true` / `<th data-cge-html>`; such columns are excluded from global search. Column `formatter` output is trusted developer HTML; always escape interpolated values with `escapeHTML` (exported from `tailtools/CGEDataTable`). Never pass user data to innerHTML.
- Laravel: `paginate()`, API Resource `{ data, meta, links }`, `simplePaginate()` (hasMore, no total) and `cursorPaginate()` (prev/next only) are parsed by `readCollectionResponse`; use `responseAdapter` for other APIs and `paramNames` for different query names. `setMetrics({ lastPage })` is honored.
- "All" sends `per_page=-1` (`allValue`). Server examples must cast/clamp `per_page`, whitelist `sort_by` and validate `sort_dir` (never `orderBy($request->sort_by)`).
- Requests: non-GET sends CSRF (`laravelHeaders`) and nested JSON (`nestParams`); GET arrays use `key[]` (`appendQuery`); `axiosInstance` beats `window.axios`; failures are `HttpError`. `fetch()` emits `error` + `fetch-error` and rejects; internal callers must `.catch()`.
- Search folds case/accents with `locale` (default `<html lang>`), so İstanbul/istanbul/ISTANBUL and IĞDIR/igdir match. Each text filter has its own debounce timer; selects apply immediately and their initial (Blade `old()`) value is applied; `''`/`'all'`/`[]` clear a filter.
- Sorting resolves one type per column (number incl. `1.234,50`, date only for `YYYY-MM-DD`/`DD.MM.YYYY`/`DD/MM/YYYY`, otherwise `Intl.Collator` numeric text), keeps empty values last and is stable. Codes like `A-10` are text.
- Both plugins emit both event names (`rendered`/`render`, `selection:change`/`selection-change`, `destroy`/`destroyed`, `error`/`fetch-error`). Use `destroyAll(root)` before Livewire/Turbo swaps; `init(root)` prunes detached instances. Server rows without IDs get page-scoped fallback IDs.
- `docs/CGEDataTable/api.md` must contain the exact `CGEDataTable.d.ts`; regenerate it after changing declarations. Node regressions live in `tests/collection-fixes.test.mjs`.
