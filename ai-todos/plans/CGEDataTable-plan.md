# CGEDataTable Implementation Plan (Modular Architecture)

## 1. Executive Summary & Architecture

`CGEDataTable` is a high-performance, tree-shakeable data grid engine engineered for modern web frontends using **Tailwind CSS v4.3+** and **Laravel Blade** applications.

It features a decoupled sub-module architecture consisting of a lightweight core orchestrator (`CGEDataTable.js`) connecting independent standalone modules:
1. **`CGEFilter.js`**: Independent filtering engine with global search, column filters, multi-mode matching, and server serialization.
2. **`CGESort.js`**: Independent sorting engine with single/multi-column sorting, natural data-type comparison, SVG indicators, and server serialization.
3. **`CGEPagination.js`**: Independent pagination engine with sliding window computation, direct jump input, per-page selector, and metrics formatting.
4. **`CGEResponsive.js`**: Adaptive responsive engine supporting priority-based column collapse with child row accordions, mobile card unrolling, and sticky horizontal scrolling.

Each sub-module can be consumed directly inside `CGEDataTable` or standalone on external tables and lists.

---

## 2. Directory Layout & File Structure

```text
plugins/CGEDataTable/
├── CGEDataTable.js          # Core orchestrator & state manager
├── CGEDataTable.d.ts        # TypeScript declarations for Core
├── style.css                # Tailwind CSS v4 styling & animations
├── index.js                 # Barrel export (CGEDataTable + sub-modules)
├── index.d.ts               # Barrel TypeScript declarations
└── modules/
    ├── CGEFilter.js         # Sub-module: Filtering engine
    ├── CGEFilter.d.ts       # TypeScript declarations for CGEFilter
    ├── CGESort.js           # Sub-module: Sorting engine
    ├── CGESort.d.ts         # TypeScript declarations for CGESort
    ├── CGEPagination.js     # Sub-module: Pagination engine
    ├── CGEPagination.d.ts   # TypeScript declarations for CGEPagination
    ├── CGEResponsive.js     # Sub-module: Adaptive responsive engine
    └── CGEResponsive.d.ts   # TypeScript declarations for CGEResponsive
```

---

## 3. Sub-Module Specifications

### A. CGEFilter (`modules/CGEFilter.js`)
- **Features:**
  - Global search field with configurable debounce (default: `300ms`).
  - Per-column filters (inputs, dropdown selects, date ranges, number ranges).
  - Multi-mode filtering: substring matching, case-insensitive check, number ranges (`>10`, `<100`, `10..50`), and regex.
  - Server-side parameter serialization: emits `{ search: query, 'filters[field]': value }`.
- **Public API:**
  - `filter.apply(query)`
  - `filter.setColumnFilter(colKey, value)`
  - `filter.getColumnFilter(colKey)`
  - `filter.clear()`
  - `filter.filterRows(rows, columns)`

### B. CGESort (`modules/CGESort.js`)
- **Features:**
  - Single-column and multi-column sorting (Shift+click).
  - Direction cycle: `asc` -> `desc` -> `none`.
  - Type-aware comparison: numbers, formatted currency (`$1,250.00`, `€ 49,99`), dates (`YYYY-MM-DD`, `MM/DD/YYYY`, timestamps), and strings with locale comparison.
  - Injects/updates animated SVG sort arrows in `<th>` elements.
  - Server-side serialization: emits `{ sort_by: 'name', sort_dir: 'asc' }`.
- **Public API:**
  - `sort.sortBy(columnKey, direction)`
  - `sort.cycleSort(columnKey, multiSort)`
  - `sort.reset()`
  - `sort.sortRows(rows, columns)`

### C. CGEPagination (`modules/CGEPagination.js`)
- **Features:**
  - Sliding numerical window (`Prev` `1` `...` `4` `[5]` `6` `...` `50` `Next`).
  - "Go to page" jump input with boundary validation (clamped between `1` and `lastPage`).
  - Per-page limit selector (`[10, 25, 50, 100, 'All']`).
  - Counter metrics generator with token substitution: `"Showing :from to :to of :total entries"`.
  - Server-side serialization: emits `{ page: 2, per_page: 25 }`.
- **Public API:**
  - `pagination.goTo(page)`
  - `pagination.next()`
  - `pagination.prev()`
  - `pagination.first()`
  - `pagination.last()`
  - `pagination.setPerPage(limit)`
  - `pagination.setMetrics(metrics)`
  - `pagination.paginateRows(rows)`

### D. CGEResponsive (`modules/CGEResponsive.js`)
- **Features:**
  - Responsive container observation via `ResizeObserver` with debounced measurement.
  - Mode 1 (`collapse`): Hides lower-priority columns (marked via `data-cge-priority="1|2|3"`) and injects an interactive child row accordion (`+ / -` toggle) to view hidden cell values.
  - Mode 2 (`cards`): Unrolls table `<tr>` rows into vertically stacked mobile cards on small screens (`< 640px`).
  - Mode 3 (`scroll`): Enforces smooth horizontal scroll container with sticky header and dynamic scroll shadow indicators.
- **Public API:**
  - `responsive.refresh()`
  - `responsive.setMode(mode)`
  - `responsive.destroy()`

---

## 4. Core Orchestrator & State (`CGEDataTable.js`)

### Data Ingestion Modes:
1. **Static DOM (`source: 'dom'`):** Extracts columns from `<thead> <th>` and rows from `<tbody> <tr> <td>`.
2. **In-Memory JSON (`source: 'json'`):** Ingests client-side array of objects or primitives.
3. **Ajax with Laravel Metadata (`source: 'ajax'`):** Consumes Laravel `LengthAwarePaginator` JSON: `{ data: [...], current_page: 1, last_page: 5, total: 100, per_page: 20 }`.
4. **Ajax without Metadata (`source: 'ajax'`):** Consumes flat array `[...]` or `{ data: [...] }`.
5. **Server-Rendered Blade HTML Rows (`source: 'ajax'` or `data.full`):** Injects server-rendered HTML rows from `data.full: "<tr>...</tr>"` or `data.html: { 1: "<tr>...</tr>" }`.

### Automated CGEActionButton Binding:
Whenever rows are rendered or re-rendered after pagination, sorting, or filtering, `CGEDataTable` automatically invokes `CGEActionButton.init(this.tbody || this.element)` to ensure all delete, restore, and action buttons work immediately without requiring page refresh.

### Headless UI Class Slot Customization:
Full Tailwind CSS v4 class slot mapping covering container, table, thead, tbody, th, td, search input, per-page dropdown, pagination buttons, child-row accordion, and mobile card layouts.

---

## 5. Shared Localization (i18n)

```javascript
translations: {
  "search-placeholder": "Search records...",
  "per-page": "Show :count entries",
  "info": "Showing :from to :to of :total entries",
  "no-data": "No matching records found",
  "loading": "Loading data...",
  "prev": "Previous",
  "next": "Next",
  "go-to-page": "Go to page",
  "all": "All",
  "collapse-details": "Details",
  "jump": "Go"
}
```

---

## 6. Execution Phases

- [ ] Phase 1: Planning and Architecture Design
- [ ] Phase 2: Sub-modules implementation (`CGEFilter`, `CGESort`, `CGEPagination`, `CGEResponsive`)
- [ ] Phase 3: Core Orchestrator implementation (`CGEDataTable.js`)
- [ ] Phase 4: TypeScript declarations (`.d.ts` for core and all sub-modules)
- [ ] Phase 5: Tailwind CSS v4 Stylesheet (`style.css`)
- [ ] Phase 6: Barrel export and package exports (`index.js`, `index.d.ts`, `package.json`, `styles.css`)
- [ ] Phase 7: Library entry integration (`src/index.ts`, `src/style.css`, `src/index.d.ts`)
- [ ] Phase 8: Interactive test sandbox in `index.html`
- [ ] Phase 9: Documentation suite in `docs/CGEDataTable/`
- [ ] Phase 10: AI skills generation in `.agents/skills/`
- [ ] Phase 11: Validation (`npm test`, `npm run test:package`, `npm run build`)
# Bakım incelemesi — 2026-10-04

Mevcut API ve görünüm korunacak. Tekil modül bildirimleri, erişilebilir başlık
sıralaması, AJAX istek sırası/iptali, Laravel HTML/JSON veri kimlikleri,
seçim/silme ve responsive/destroy temizliği düzeltilecek. Tipler, dokümanlar,
skill ve tarayıcı/paket testleri aynı bakım kapsamında doğrulanacak.

Bakım tamamlandı: Node 27/27, Chrome 82/82, strict NodeNext/Bundler, build ve paket kontrolleri geçti. Ayrıntılar: [REPORTS.md](../../REPORTS.md).
