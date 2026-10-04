---
name: cge-datagrid
description: High-performance, reactive, and modular card grid and list engine designed for Tailwind CSS v4.3+ and Laravel Blade. Features dual rendering modes (grid vs list), direct Laravel Blade HTML resource ingestion (html_card, html_list), multi-card selection engine, decoupled sub-modules (CGEFilter, CGESort, CGEPagination), and automated lifecycle binding for CGEActionButton.
---

# CGEDataGrid Agent Skill

Use this skill when designing, implementing, configuring, or debugging responsive card grids, user directories, blog cards, product grids, view mode switchers (🔲 Grid / ☰ List), and card selection interfaces in **TailTools** with Tailwind CSS v4.3+ and Laravel Blade.

---

## 1. When to Use CGEDataGrid

Activate this skill when the user requests:
- "Build a card grid with search, sorting, and pagination in Tailwind CSS and Laravel."
- "Display data as custom cards (blog cards, user cards, product cards) instead of tabular rows."
- "Provide a view mode switcher between Grid view (`grid-cols-*`) and List view (`flex-col`)."
- "Consume Laravel API Resource JSON containing pre-rendered Blade HTML (`html_card`, `html_list`)."
- "Implement multi-card selection with bulk actions (Select All, Clear, Delete Selected)."
- "Ensure card action buttons (like delete or revoke) integrate with confirmation dialogs (`CGEActionButton` / `CGEAlert`)."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEDataGrid/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEDataGrid } from 'tailtools';

// Automatically scans and initializes all [data-cge-datagrid] elements
initTailTools();

// Global registration
window.CGEDataGrid = CGEDataGrid;
```

---

## 3. Implementation Patterns

### Pattern A: Client JSON Dataset with Dual Renderers & View Switcher
```javascript
new CGEDataGrid('#articles-grid', {
  source: 'json',
  data: articles,
  layoutMode: 'both', // 'grid' | 'list' | 'both'
  viewMode: 'grid',
  gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  perPage: 12,

  cardRendererGrid: (item) => `
    <article class="cge-card bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
      <img src="${item.cover}" class="w-full h-44 object-cover" />
      <div class="p-5 flex-1">
        <span class="text-xs font-semibold text-indigo-600">${item.category}</span>
        <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base mt-2">${item.title}</h3>
      </div>
      <div class="p-4 border-t flex justify-between text-xs">
        <span>${item.date}</span>
        <button data-cge-action="delete" class="text-rose-600">Delete</button>
      </div>
    </article>
  `,

  cardRendererList: (item) => `
    <article class="cge-card bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img src="${item.cover}" class="w-16 h-16 rounded-sm object-cover" />
        <div>
          <span class="text-xs font-semibold text-indigo-600">${item.category}</span>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm">${item.title}</h3>
        </div>
      </div>
      <button data-cge-action="delete" class="text-rose-600 text-xs">Delete</button>
    </article>
  `,
});
```

### Pattern B: Direct Laravel API Resource HTML (Pre-Rendered Blade Partials)
In Laravel Controller or API Resource:
```php
return [
    'id' => $this->id,
    'html_card' => view('students.partials._card', ['student' => $this->resource])->render(),
    'html_list' => view('students.partials._row', ['student' => $this->resource])->render(),
];
```

In Blade template:
```html
<div id="students-grid"
     data-cge-datagrid
     data-cge-config='{
       "source": "ajax",
       "url": "/api/students",
       "layoutMode": "both",
       "selectable": true
     }'>
</div>
```

---

## 4. Key Options Reference

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `layoutMode` | `'grid' \| 'list' \| 'both'` | `'both'` | Allowed views. `'both'` includes a view toggle switch. |
| `viewMode` | `'grid' \| 'list'` | `'grid'` | Initial active view. |
| `gridCols` | `string` | `'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'` | CSS Grid columns. |
| `selectable` | `boolean` | `false` | Enables card checkboxes and bulk action bar. |
| `selectOnClick` | `boolean` | `false` | Toggles selection by clicking anywhere on card. |
| `autoBindActions` | `boolean` | `true` | Auto binds `CGEActionButton` on rendered cards. |

## Maintenance contracts

- Keep the shipped API and existing theme. Use stable unique `id` values for remote records; zero is a valid ID. Set `serverSide: true` for a paginated Laravel endpoint, or false for a complete array processed locally.
- Standalone module callbacks use constructor `onChange`, not `.on()`. Grid module names differ from Table (`setFilter`, `goToPage`, `getWindow` versus `setColumnFilter`, `goTo`, `computeWindow`); check the appropriate declaration before using a subpath.
- New requests abort the previous request; stale responses cannot render or clear loading. Destroy cancels requests, timers, frames and listeners, restores original DOM, and permits recreation. Update all four plugin docs and verify browser regressions after maintenance.
- Removal methods are local view operations; persist deletions with your own backend endpoint or CGEActionButton. A restore success must not remove the card/row. CGEActionButton.init() takes a selector string; global delegation covers future rows, so do not pass an HTMLElement.
- CGEAlert methods take positional title/message/options and return an object with `isConfirmed`; dismissal is not confirmation. Grid deleteSelected returns a Promise<number>; Table deleteSelected returns the table and its toolbar asks first.
