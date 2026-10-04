# CGEDataGrid Practical Examples

Real-world implementation patterns for Tailwind CSS v4.3+ and Laravel Blade.

---

## 1. Blog Articles Grid with Dual Renderers & View Switcher

```html
<div id="blog-grid"></div>

<script type="module">
  import { CGEDataGrid } from 'tailtools';

  const posts = [
    {
      id: 101,
      title: 'Modern CSS Architectures in 2026',
      category: 'Frontend',
      author: 'Jane Doe',
      date: '2026-03-28',
      cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop',
      excerpt: 'Explore cascading layers, container queries, and native animations.',
    },
    {
      id: 102,
      title: 'Building Resilient Microservices with Laravel',
      category: 'Architecture',
      author: 'Alex Smith',
      date: '2026-03-30',
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop',
      excerpt: 'Distributed queues, database sharding, and real-time observability.',
    },
  ];

  new CGEDataGrid('#blog-grid', {
    source: 'json',
    data: posts,
    layoutMode: 'both',
    viewMode: 'grid',
    gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    perPage: 6,

    // Grid Card Renderer
    cardRendererGrid: (item) => `
      <article class="cge-card bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
        <div>
          <img src="${item.cover}" alt="${item.title}" class="w-full h-44 object-cover" />
          <div class="p-5">
            <span class="px-2.5 py-0.5 rounded-sm text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">${item.category}</span>
            <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base mt-2">${item.title}</h3>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">${item.excerpt}</p>
          </div>
        </div>
        <div class="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>${item.date}</span>
          <button type="button" data-cge-action="delete" data-cge-title="Delete ${item.title}?" class="text-rose-600 hover:underline">Delete</button>
        </div>
      </article>
    `,

    // List Row Renderer
    cardRendererList: (item) => `
      <article class="cge-card bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <img src="${item.cover}" alt="${item.title}" class="w-16 h-16 rounded-sm object-cover shrink-0" />
          <div class="min-w-0">
            <span class="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">${item.category}</span>
            <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm truncate mt-1">${item.title}</h3>
            <p class="text-xs text-slate-500 truncate">${item.excerpt}</p>
          </div>
        </div>
        <div class="flex items-center gap-4 shrink-0 text-xs">
          <span class="text-slate-400 hidden sm:inline">${item.date}</span>
          <button type="button" data-cge-action="delete" data-cge-title="Delete ${item.title}?" class="text-rose-600 hover:underline">Delete</button>
        </div>
      </article>
    `,
  });
</script>
```

---

## 2. Laravel Blade Pre-Rendered API Resources

### Laravel Resource (`app/Http/Resources/StudentResource.php`):

```php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'html_card' => view('students.partials._card', ['student' => $this->resource])->render(),
            'html_list' => view('students.partials._row', ['student' => $this->resource])->render(),
        ];
    }
}
```

### Laravel Blade View (`resources/views/students/index.blade.php`):

```html
<div class="max-w-7xl mx-auto px-4 py-8">
  <div id="students-grid"
       data-cge-datagrid
       data-cge-config='{
         "source": "ajax",
         "url": "/api/students",
         "layoutMode": "both",
         "viewMode": "grid",
         "selectable": true,
         "gridCols": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
       }'>
  </div>
</div>
```

---

## 3. Student Card Partial with Checkbox & Actions (`resources/views/students/partials/_card.blade.php`)

```html
<div class="cge-card relative bg-white dark:bg-slate-900 p-5 rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between">
  <div class="flex items-center gap-3">
    <img src="{{ $student->avatar }}" alt="{{ $student->name }}" class="w-12 h-12 rounded-sm object-cover" />
    <div class="min-w-0 flex-1">
      <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{{ $student->name }}</h4>
      <p class="text-xs text-slate-500 truncate">{{ $student->email }}</p>
      <span class="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700">
        {{ $student->status }}
      </span>
    </div>
  </div>
  <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
    <span class="text-slate-400">ID: #{{ $student->id }}</span>
    <button type="button"
            data-cge-action="delete"
            data-cge-title="Remove {{ $student->name }}?"
            data-cge-url="/api/students/{{ $student->id }}"
            class="text-rose-600 hover:underline font-medium">
      Remove
    </button>
  </div>
</div>
```

## Handling remote failures and teardown

```javascript
import { CGEDataGrid } from 'tailtools';
const collection = new CGEDataGrid('#student-grid', {
  source: 'ajax', url: '/api/users', driver: 'fetch', serverSide: true,
  // Authenticated POST endpoints: method: 'POST', headers: { 'X-CSRF-TOKEN': token }
});
collection.on('fetch-error', ({ error }) => console.error(error));
// Before replacing the containing Blade partial:
collection.destroy();
```

Supply a stable `id` in each API record. Persist deletion in your endpoint before removing an item from this local view; bulk removal has no built-in backend DELETE request.

## Laravel paginator with mobile navigation and loading

```javascript
const grid = new CGEDataGrid("#clusters-grid", {
  source: "ajax", url: "/api/clusters", driver: "fetch", serverSide: true, perPage: 6,
  translations: { loading: "Veriler yükleniyor...", prev: "Önceki", next: "Sonraki",
    "go-to-page": "Sayfaya git", jump: "Git", pagination: "Sayfalama" },
  cardRenderer: item => {
    const card = document.createElement("article");
    card.className = "p-4 border border-slate-200 rounded-sm";
    card.textContent = item.title;
    return card;
  }
});
// A refresh button can call grid.fetch() to reload the current page.
```

Return `{ data, current_page, last_page, total, per_page }` from the endpoint. Mobile page jumps, page-size changes and search automatically request the next result; loading is managed by the plugin. Import the Grid stylesheet alongside Tailwind to include reduced-motion and loading interaction styles.
