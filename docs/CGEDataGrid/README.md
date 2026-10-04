# CGEDataGrid

High-performance, reactive, and modular **Card Grid & List Engine** tailored for **Tailwind CSS v4.3+** and **Laravel Blade**.

Instead of tabular rows, `CGEDataGrid` renders responsive, rich cards (Blog posts, User profiles, Student cards, Product cards) with customizable grid columns, list views, multi-card selection, decoupled sub-modules, and seamless `CGEActionButton` confirmation workflows.

---

## Key Features

- **Decoupled Modular Architecture:** Orchestrator connecting independent `CGEFilter`, `CGESort`, and `CGEPagination` sub-modules.
- **Layout Modes:** Configure `layoutMode: 'grid'`, `'list'`, or `'both'` with an interactive view switcher (🔲 Grid / ☰ List).
- **Dual Rendering Engine:**
  - **Direct Laravel API Resource HTML:** Directly renders pre-compiled Blade partials (`html_card`, `html_list`) returned by Laravel controllers.
  - **JavaScript Callback Renderers:** Dedicated `cardRendererGrid` and `cardRendererList` for client-side JSON datasets.
- **Card Selection Engine (`selectable: true`):** Checkbox selection, `.cge-card-selected` styling, floating bulk action bar, select all, clear, and bulk delete.
- **Automated CGEActionButton Integration:** Any action button inside a card (`data-cge-action="delete"`, etc.) automatically triggers confirmation dialogs and smoothly animates card deletion on success.
- **Multi-Format Ingestion:** DOM pre-rendered cards, in-memory JSON array, or remote Laravel `LengthAwarePaginator` API.
- **Zero Heavy Dependencies:** Native JavaScript (ES2022+), strict TypeScript definitions, and Tailwind CSS v4 styling.

---

## Quick Start

### Installation

```bash
npm install tailtools
```

### 1. Client-Side Blog Card Grid

```html
<div id="blog-grid"></div>

<script type="module">
  import { CGEDataGrid } from 'tailtools';

  new CGEDataGrid('#blog-grid', {
    source: 'json',
    data: [
      { id: 1, title: 'Mastering Tailwind v4', category: 'Design', cover: '/img1.jpg', date: '2026-03-15' },
      { id: 2, title: 'Laravel 12 Architecture', category: 'Backend', cover: '/img2.jpg', date: '2026-03-20' },
    ],
    layoutMode: 'both',
    viewMode: 'grid',
    cardRendererGrid: (item) => `
      <article class="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <img src="${item.cover}" class="w-full h-40 object-cover" />
        <div class="p-4">
          <span class="text-xs text-indigo-600 font-semibold">${item.category}</span>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">${item.title}</h3>
        </div>
      </article>
    `,
    cardRendererList: (item) => `
      <article class="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex items-center gap-4">
        <img src="${item.cover}" class="w-14 h-14 rounded-sm object-cover" />
        <div class="flex-1">
          <span class="text-xs text-indigo-600 font-semibold">${item.category}</span>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm">${item.title}</h3>
        </div>
      </article>
    `,
  });
</script>
```

### 2. Laravel Blade Pre-Rendered Resource

In your Laravel Resource:

```php
return [
    'id' => $this->id,
    'html_card' => view('students._card', ['student' => $this->resource])->render(),
    'html_list' => view('students._row', ['student' => $this->resource])->render(),
];
```

In your Blade view:

```html
<div id="student-grid"
     data-cge-datagrid
     data-cge-config='{"source":"ajax","url":"/api/students","layoutMode":"both","selectable":true}'>
</div>
```

---

## Documentation Links

- [Usage & Configuration Guide](usage.md)
- [Practical Examples & Blade Components](examples.md)
- [API Reference & TypeScript Typings](api.md)

## Maintenance contracts

Use stable unique IDs for remote data and enable `serverSide: true` for paginated endpoints. Removal methods update the local view. Cancellation, recreation and selection behavior are detailed in the [usage guide](usage.md#data-ownership-and-lifecycle). Regression checks run at [the browser test page](../../tests/regressions.html).

## Responsive pagination and loading

Like DataTable, the Grid footer switches at the Tailwind `sm` breakpoint: compact previous/current/next plus page jump on phones, numbered pages on larger screens. The loading overlay fades over existing cards while the next remote page loads. Try the 60-item simulated Laravel AJAX example and its Reload button in the demo.
