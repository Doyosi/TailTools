# CGEDataGrid Architecture & Implementation Plan

**Plugin Name:** `CGEDataGrid`  
**Location:** `plugins/CGEDataGrid/`  
**Purpose:** High-performance, reactive, and modular Card Grid & List engine designed for Tailwind CSS v4.3+ and Laravel Blade. Renders data items as rich responsive cards (Blog cards, User profile cards, Product cards, Student cards) rather than tabular rows, while maintaining the same robust decoupled filtering, sorting, pagination, and action-binding pipeline as `CGEDataTable`.

---

## 1. Core Architecture & Philosophy

`CGEDataGrid` mirrors the architecture of `CGEDataTable` with a decoupled sub-module design:

```text
plugins/CGEDataGrid/
├── CGEDataGrid.js          # Core orchestrator, state manager, template engine, pipeline runner
├── CGEDataGrid.d.ts        # Comprehensive TypeScript declarations
├── index.js                # Barrel export
├── style.css               # Tailwind CSS v4 grid, list, selection, and card transitions
└── modules/
    ├── CGEFilter.js        # Filter engine (global search + field/select filters + CGESelect integration)
    ├── CGESort.js          # Sorting engine (field-based sort with dropdown/pills)
    └── CGEPagination.js    # Sliding window + compact mobile pagination engine
```

### Key Comparison: `CGEDataTable` vs `CGEDataGrid`
| Feature | `CGEDataTable` | `CGEDataGrid` |
| :--- | :--- | :--- |
| **DOM Root** | `<table>`, `<thead>`, `<tbody>`, `<tr>` | CSS Grid / Flex container (`<div class="cge-grid-items">`) |
| **Item Representation** | Tabular cells (`<td>`) | Self-contained cards (`<div class="cge-card">`) |
| **Layout Flexibility** | Fixed table columns | **`layoutMode`**: `'grid'`, `'list'`, or `'both'` (with built-in View Mode Switcher 🔲 / ☰) |
| **Card Rendering** | Column cell formatters | **Dual Renderers**: `cardRendererGrid` + `cardRendererList`, OR direct Laravel Resource HTML (`html_card`, `html_list`) |
| **Sorting UI** | Clickable `<th>` table headers | Dropdown select (`Sort by: Date, Name, Rating`) or pill buttons |
| **Selection Engine** | Row checkboxes (`selectable`) | Card checkboxes / click-to-select (`selectable`), floating bulk action bar |

---

## 2. Layout Flexibility & View Modes

The layout flexibility supports selecting **grid only**, **list only**, or **both with a switcher**:

```javascript
new CGEDataGrid('#student-grid', {
  layoutMode: 'both', // 'grid' | 'list' | 'both'
  viewMode: 'grid',   // Active initial view: 'grid' | 'list'
  gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  listGap: 'gap-3',
  // ...
});
```

- When `layoutMode: 'grid'`, only the card grid is rendered; no view toggle is displayed.
- When `layoutMode: 'list'`, only the list view is rendered; no view toggle is displayed.
- When `layoutMode: 'both'`, a view mode switcher toggle (🔲 Grid / ☰ List) is automatically included in the header toolbar, and users can toggle between views instantly with smooth CSS transitions.
- Programmatic switching via `grid.setViewMode('grid' | 'list')` dispatches `cge:datagrid:viewmode`.

---

## 3. Dual Rendering Engine: Client Functions & Direct Laravel HTML Resources

### Pattern 1: Direct Laravel API Resource HTML (Server-Rendered Blade Partials)
Directly consumes rendered Blade partials from Laravel API resources without any client-side `<template>` requirement:

```php
// In Laravel StudentResource or Controller:
return [
    'id' => $this->id,
    'name' => $this->name,
    'email' => $this->email,
    'html_list' => view('Dashboard::Sections.Students.Partials._student_row', [
        'student' => $this->resource,
    ])->render(),
    'html_card' => view('Dashboard::Sections.Students.Partials._student_card', [
        'student' => $this->resource,
    ])->render(),
];
```

In `CGEDataGrid`:
- In **Grid View**: renders `item.html_card` (or `item.html_grid` / `item.card_html`).
- In **List View**: renders `item.html_list` (or `item.html_row` / `item.list_html`).
- Configurable resource keys:
  ```javascript
  new CGEDataGrid('#students-container', {
    source: 'ajax',
    url: '/api/students',
    htmlCardKey: 'html_card',
    htmlListKey: 'html_list',
  });
  ```

### Pattern 2: JavaScript Callback Renderers
For JSON / client-side datasets, developers define tailored renderers for each view mode:

```javascript
new CGEDataGrid('#blog-grid', {
  source: 'json',
  data: blogPosts,
  layoutMode: 'both',
  viewMode: 'grid',
  
  // Dedicated Grid Card Renderer
  cardRendererGrid: (item, index) => `
    <article class="cge-card bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col">
      <img src="${item.cover}" alt="${item.title}" class="w-full h-44 object-cover" />
      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span class="px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">${item.category}</span>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base mt-2">${item.title}</h3>
          <p class="text-xs text-slate-500 mt-1 line-clamp-2">${item.excerpt}</p>
        </div>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span>${item.date}</span>
          <button type="button" data-cge-action="delete" data-cge-title="Delete post?" class="text-rose-600 hover:underline">Delete</button>
        </div>
      </div>
    </article>
  `,

  // Dedicated List Row / Horizontal Card Renderer
  cardRendererList: (item, index) => `
    <article class="cge-card bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <img src="${item.cover}" alt="${item.title}" class="w-16 h-16 rounded-sm object-cover shrink-0" />
        <div class="min-w-0">
          <span class="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-indigo-50 text-indigo-700">${item.category}</span>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm truncate mt-1">${item.title}</h3>
          <p class="text-xs text-slate-500 truncate">${item.excerpt}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 shrink-0 text-xs">
        <span class="text-slate-400 hidden sm:inline">${item.date}</span>
        <button type="button" data-cge-action="delete" data-cge-title="Delete post?" class="text-rose-600 hover:underline">Delete</button>
      </div>
    </article>
  `,
});
```

---

## 4. Card Selection & Bulk Actions (`selectable: false` by default)

Like `CGEDataTable`, selection is configurable via `selectable: boolean`:

```javascript
new CGEDataGrid('#users-grid', {
  selectable: true, // Default: false
  selectOnClick: false, // true = clicking card toggles selection; false = only checkbox
  // ...
});
```

When `selectable: true`:
1. **Card Checkbox & Visual Glow:**
   - Injected or bound checkbox `<input type="checkbox" class="cge-card-checkbox" data-cge-select-id="${item.id}">`.
   - Card receives `.cge-card-selected` styling (vibrant border ring `ring-2 ring-indigo-500/50` + subtle tinted background).
2. **Bulk Action Toolbar:**
   - Appears or activates when cards are selected.
   - Displays: `"X items selected"`, **Select All** button, **Clear Selection** button, and **Delete Selected** button.
   - Triggers `cge:datagrid:selection-change` on every selection change.
3. **Programmatic Selection API:**
   - `grid.selectAll()`
   - `grid.clearSelection()`
   - `grid.toggleSelect(id)`
   - `grid.getSelectedIds(): string[]`
   - `grid.getSelectedItems(): any[]`
   - `grid.deleteSelected(): Promise<number>` (with `CGEAlert` confirmation)

---

## 5. Filter & Sort UI Integration (`<select>` & `CGESelect`)

1. **Toolbar Header:**
   - Global debounced search box (`translations['search-placeholder']`).
   - Category / status filters: Native `<select data-cge-filter="category">` or enhanced with `CGESelect`. Supports single and multi-select filters.
   - Sort selector: `<select data-cge-sort>` with options:
     - `<option value="date:desc">Newest First</option>`
     - `<option value="date:asc">Oldest First</option>`
     - `<option value="title:asc">Title (A-Z)</option>`
     - `<option value="title:desc">Title (Z-A)</option>`
   - View mode toggle buttons (🔲 Grid / ☰ List) when `layoutMode: 'both'`.
   - Per-page limit selector (`[6, 12, 24, 48, 'All']`).

2. **Automated `CGEActionButton` Integration:**
   - Any card action button (`data-cge-action="delete"`, `revoke`, etc.) automatically binds to confirmation modals.
   - When confirmed, `cge:action:success` smoothly animates the card out (scale-down + fade-out) and removes it from the grid dataset.

---

## 6. Public API Specification

```typescript
export interface CGEDataGridOptions {
  source?: 'dom' | 'json' | 'ajax';
  data?: any[];
  url?: string;
  driver?: 'auto' | 'axios' | 'fetch';
  serverSide?: boolean;
  perPage?: number | string;
  perPageOptions?: Array<number | string>;
  
  // Layout & View Mode
  layoutMode?: 'grid' | 'list' | 'both'; // Default: 'both'
  viewMode?: 'grid' | 'list'; // Default: 'grid'
  gridCols?: string; // Default: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  listGap?: string; // Default: 'gap-3'
  
  // Renderers & Resource Keys
  cardRendererGrid?: (item: any, index: number) => string | HTMLElement;
  cardRendererList?: (item: any, index: number) => string | HTMLElement;
  cardRenderer?: (item: any, index: number, viewMode: 'grid' | 'list') => string | HTMLElement;
  htmlCardKey?: string; // Default: 'html_card' (fallback: 'html_grid', 'card_html')
  htmlListKey?: string; // Default: 'html_list' (fallback: 'html_row', 'list_html')
  
  // Selection
  selectable?: boolean; // Default: false
  selectOnClick?: boolean; // Default: false
  
  autoBindActions?: boolean; // Default: true
  ui?: Partial<CGEDataGridUIConfig>;
  translations?: Partial<CGEDataGridTranslations>;
}

export declare class CGEDataGrid {
  constructor(element: HTMLElement | string, options?: CGEDataGridOptions);
  
  refresh(): this;
  setData(data: any[]): this;
  fetch(extraParams?: Record<string, any>): Promise<any>;
  setViewMode(mode: 'grid' | 'list'): this;
  setLoading(isLoading: boolean): this;
  
  // Selection
  selectAll(): this;
  clearSelection(): this;
  toggleSelect(id: string | number): this;
  getSelectedIds(): string[];
  getSelectedItems(): any[];
  deleteSelected(): Promise<number>;
  removeCard(target: HTMLElement | string): boolean;
  
  // Sub-modules
  filter: CGEFilter;
  sort: CGESort;
  pagination: CGEPagination;
  
  destroy(): void;
}
```

---

## 7. Interactive Testbed Showcase in `index.html`

1. **Showcase 1: Blog Articles (Client JSON + JS Renderers):**
   - Uses `cardRendererGrid` and `cardRendererList`.
   - Features: Search, category `<select>` filter, sort dropdown (`date:desc`, `title:asc`), layout switcher (🔲 / ☰), pagination.
2. **Showcase 2: Student / User Directory with Direct Blade HTML Resources & Selection:**
   - Ingests pre-rendered `html_card` and `html_list` objects (replicating Laravel `StudentResource`).
   - Features: `selectable: true`, selection count, Select All, Clear Selection, bulk delete, single card delete with `CGEActionButton`.
3. **Showcase 3: Simulated Laravel LengthAwarePaginator Ajax Cards:**
   - Remote paginator endpoint with 60 card items, simulating server-side pagination, search, and sorting.
# Bakım incelemesi — 2026-10-04

Mevcut API ve görünüm korunacak. AJAX istek sırası/iptali, yerel pipeline,
kararlı seçim kimlikleri, CGEAlert/CGEActionButton uyumu ve destroy sonrası
DOM/listener/timer temizliği düzeltilecek. Tipler, dört doküman, skill ve
tarayıcı/paket testleri aynı bakım kapsamında doğrulanacak.

Bakım tamamlandı: Node 27/27, Chrome 82/82, strict NodeNext/Bundler, build ve paket kontrolleri geçti. Ayrıntılar: [REPORTS.md](../../REPORTS.md).

## Grid pagination/loading uyumu — 2026-10-04

Table'ın Laravel AJAX demosundaki CSS breakpoint ile değişen compact/desktop
pagination Grid'e taşınacak. Mobil jump input + Go, erişilebilir sayfa durumu,
local/server navigation ve resize sonrası doğru görünüm korunacak. Grid loading,
Table ile aynı fade + backdrop feedback yaklaşımını kullanacak; eski kartlar
korunacak ve timer/RAF'lar destroy veya yeni loading aşamasında iptal edilecek.
Demo, docs, tipler ve skill eşitlenip mobil/desktop görsel kontrol yapılacak.

Tamamlandı: 27/27 Node, 86/86 Chrome, 5 viewport görsel kontrolü, demo AJAX/All, strict tipler, build, npm pack ve ESM/UMD doğrulaması geçti. [REPORTS.md](../../REPORTS.md) güncellendi.
