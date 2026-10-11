# CGEDataTable

High-performance, tree-shakeable data grid engine engineered for **Tailwind CSS v4.3+** and **Laravel Blade** applications.

Built with a decoupled sub-module architecture: a lightweight core orchestrator (`CGEDataTable.js`) connecting independent standalone modules for **Filtering** (`CGEFilter.js`), **Sorting** (`CGESort.js`), **Pagination** (`CGEPagination.js`), and **Adaptive Layout** (`CGEResponsive.js`).

---

## Architecture Overview

```text
               ┌───────────────────────────────┐
               │         CGEDataTable          │  ◄── Core Orchestrator & State Store
               └───────────────┬───────────────┘
                               │
       ┌───────────────┬───────┴───────┬───────────────┐
       ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  CGEFilter  │ │   CGESort   │ │CGEPagination│ │CGEResponsive│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
  Global Search   Single/Multi    Sliding Window  Priority Collapse
  Column Filters  Natural Type    Jump Input      Child Rows
  Number Ranges   SVG Indicators  Per-Page Select Sticky Scroll
  Serialization   Serialization   Counter Metrics ResizeObserver
```

---

## Key Features

1. **Decoupled Modular Architecture:**
   - Consume the bundled `CGEDataTable` or import individual sub-modules (`CGEFilter`, `CGESort`, `CGEPagination`, `CGEResponsive`) standalone on external tables or lists.
2. **Multi-Format Data Ingestion:**
   - **Static DOM Table (`source: 'dom'`):** Ingests existing `<thead>` and `<tbody>` rows with zero configuration.
   - **In-Memory JSON (`source: 'json'`):** Client-side rendering, instant client sorting, filtering, and pagination.
   - **Laravel Paginated Ajax (`source: 'ajax'`):** Native support for Laravel `LengthAwarePaginator` (`data`, `current_page`, `last_page`, `total`, `per_page`), API Resource collections (`meta`), `simplePaginate` and `cursorPaginate`; `responseAdapter` for custom APIs.
   - **Flat Ajax (`source: 'ajax'`):** Ingests unpaginated arrays with client-side or remote pagination.
   - **Server-Rendered Blade HTML Rows:** Seamlessly injects pre-rendered row strings (`data.full: "<tr>...</tr>"` or `data.html: { 1: "<tr>...</tr>" }`).
3. **Automated `CGEActionButton` Binding:**
   - Whenever rows are rendered or refreshed after pagination, sorting, or filtering, newly injected row elements automatically trigger `CGEActionButton.init()` to ensure destructive actions (`delete`, `restore`, `forceDelete`) work seamlessly with confirmation modals.
4. **Adaptive Responsive Views:**
   - **Mode 1 (`collapse`):** Priority-based column reduction with an interactive child-row accordion (`+ / -` toggle) to reveal hidden column data.
   - **Mode 2 (`scroll`):** Horizontal scroll container with sticky header.
5. **Headless UI Customization:**
   - Complete Tailwind CSS v4 class slot mapping across container, header, search input, per-page dropdown, table, thead, tbody, tr, td, and pagination buttons.
6. **Built-in Localization (i18n):**
   - Configurable translation dictionary with token substitution (`:from`, `:to`, `:total`, `:count`).

---

## Quick Start

### 1. Bundle Import

```javascript
import { CGEDataTable } from 'tailtools';

// Declarative automatic initialization
CGEDataTable.init();

// Programmatic initialization
const table = new CGEDataTable('#users-table', {
  source: 'ajax',
  url: '/api/users',
  perPage: 25,
  responsiveMode: 'collapse',
});
```

### 2. Standalone Sub-Module Imports (Tree-Shakeable)

```javascript
import { CGEFilter } from 'tailtools/plugins/CGEDataTable/modules/CGEFilter.js';
import { CGESort } from 'tailtools/plugins/CGEDataTable/modules/CGESort.js';
import { CGEPagination } from 'tailtools/plugins/CGEDataTable/modules/CGEPagination.js';
import { CGEResponsive } from 'tailtools/plugins/CGEDataTable/modules/CGEResponsive.js';

// Standalone sorting on an external HTML table
const sort = new CGESort({ defaultDirection: 'asc' });
sort.attachHeaders('#my-custom-table th');

// Standalone filtering
const filter = new CGEFilter({ debounce: 300 });
filter.attachSearchInput('#custom-search-input');
```

---

## Documentation Links

- [Complete Usage Guide](usage.md)
- [Code Examples (HTML, Tailwind v4 & Ajax)](examples.md)
- [Laravel Blade Components](laravel-blade.md)
- [TypeScript API Reference](api.md)

## Maintenance contracts

Use stable unique IDs for remote data and enable `serverSide: true` for paginated endpoints. Removal methods update the local view. Cancellation, recreation and selection behavior are detailed in the [usage guide](usage.md#data-ownership-and-lifecycle). Regression checks run at [the browser test page](../../tests/regressions.html).

## Stability fixes (October 2026)

- **Safer default:** raw values are rendered as text. Column `formatter` output and server Blade markup stay trusted HTML; escape interpolated values with the exported `escapeHTML`.
- Laravel `paginate()`, API Resource `{ data, meta, links }`, `simplePaginate()` and `cursorPaginate()` responses are read automatically; `responseAdapter` maps custom APIs and `paramNames` renames request parameters.
- **Changed default:** "All" is sent as `per_page=-1` (`allValue`) instead of `'All'`. Clamp and whitelist on the server (see the examples).
- Non-GET requests send Laravel CSRF headers and nested JSON; GET arrays use `key[]`; `axiosInstance` wins over `window.axios`; failures reject with `HttpError`.
- Search is case/accent-insensitive with `locale` (Turkish İ/ı); sorting detects one type per column (`1.234,50`, `DD.MM.YYYY`), keeps empty values last and is stable.
- Filter/Sort/Pagination are one shared implementation for Table and Grid with both method names; both plugins emit both event names.
- `CGEDataTable.destroyAll(root)` and pruning `init(root)` support Livewire/Turbo; server rows without IDs use page-scoped fallback IDs.
