# CGEDataTable Practical Examples

## 1. Declarative Static DOM Table

Enhance a standard HTML table with search, sorting, sliding window pagination, and responsive child-row accordions using HTML data-attributes:

```html
<table data-cge-datatable
       data-cge-per-page="5"
       data-cge-responsive="collapse">
  <thead>
    <tr>
      <th data-cge-key="name" data-cge-priority="1">Customer Name</th>
      <th data-cge-key="email" data-cge-priority="2">Email Address</th>
      <th data-cge-key="role" data-cge-priority="3">Role</th>
      <th data-cge-key="spent" data-cge-type="currency" data-cge-priority="2">Total Spent</th>
      <th data-cge-key="actions" data-cge-priority="1">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sarah Jenkins</td>
      <td>sarah.j@example.com</td>
      <td><span class="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">Admin</span></td>
      <td data-cge-val="12450.00">$12,450.00</td>
      <td>
        <button type="button"
                data-cge-action="delete"
                data-cge-title="Delete Customer?"
                data-cge-message="Are you sure you want to remove Sarah Jenkins?"
                class="px-2.5 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">
          Delete
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

---

## 2. In-Memory JSON with Custom Column Formatters

Values without a formatter are rendered as text. Formatter strings are trusted HTML, so escape every interpolated value with `escapeHTML`:

```javascript
import { CGEDataTable, escapeHTML } from 'tailtools/CGEDataTable';

const table = new CGEDataTable('#orders-table', {
  source: 'json',
  perPage: 10,
  columns: [
    { key: 'id', label: 'Order #', type: 'number', priority: 1 },
    { key: 'customer', label: 'Customer', type: 'string', priority: 1 },
    {
      key: 'amount',
      label: 'Amount',
      type: 'currency',
      priority: 2,
      formatter: (val) => `<span class="font-mono font-bold">$${Number(val).toFixed(2)}</span>`
    },
    {
      key: 'status',
      label: 'Status',
      priority: 3,
      formatter: (val) => {
        const colors = {
          completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          pending: 'bg-amber-50 text-amber-700 border-amber-200',
          canceled: 'bg-rose-50 text-rose-700 border-rose-200',
        };
        return `<span class="px-2 py-0.5 rounded text-[11px] font-semibold border ${colors[val] || 'bg-slate-100'}">${escapeHTML(String(val).toUpperCase())}</span>`;
      }
    }
  ],
  data: [
    { id: 1001, customer: 'Alex Rivera', amount: 129.50, status: 'completed' },
    { id: 1002, customer: 'Marcus Vance', amount: 890.00, status: 'pending' },
    { id: 1003, customer: 'Elena Rostova', amount: 45.20, status: 'canceled' },
  ]
});
```

---

## 3. Remote Laravel Ajax Pagination (`LengthAwarePaginator`)

Laravel Controllers returning paginated Eloquent resources:

```php
// app/Http/Controllers/Api/UserController.php
public function index(Request $request)
{
    $query = User::query();

    if ($search = $request->query('search')) {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // filters[role]=admin or filters[roles][]=admin&filters[roles][]=editor
    $filters = (array) $request->query('filters', []);
    if (! empty($filters['role'])) {
        $query->whereIn('role', (array) $filters['role']);
    }

    // Never pass a raw request column to orderBy(): whitelist columns and directions.
    $sortable = ['id', 'name', 'email', 'created_at'];
    $sortBy = $request->query('sort_by');
    $sortDir = strtolower($request->query('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
    if (in_array($sortBy, $sortable, true)) {
        $query->orderBy($sortBy, $sortDir);
    } else {
        $query->latest('id');
    }

    // "All" is sent as per_page=-1 (allValue); clamp everything else.
    $perPage = (int) $request->input('per_page', 15);
    $perPage = $perPage === -1 ? max($query->count(), 1) : min(max($perPage, 1), 100);

    return response()->json($query->paginate($perPage)->withQueryString());
    // Also supported: UserResource::collection($query->paginate($perPage)) ({ data, meta, links }),
    // $query->simplePaginate($perPage) and $query->cursorPaginate($perPage).
}
```

Frontend initialization:

```javascript
import { CGEDataTable } from 'tailtools';

const table = new CGEDataTable('#ajax-table', {
  source: 'ajax',
  url: '/api/users',
  serverSide: true,
  perPage: 15,
  perPageOptions: [15, 50, 100, 'All'], // All => per_page=-1 (allValue)
  locale: 'tr', // or <html lang="tr">
  responsiveMode: 'collapse',
  columns: [
    { key: 'id', label: 'ID', priority: 1 },
    { key: 'name', label: 'Name', priority: 1 },
    { key: 'email', label: 'Email', priority: 2 },
    { key: 'created_at', label: 'Joined', type: 'date', priority: 3 },
  ]
});
```

---

## 4. Server-Rendered Blade HTML Rows (`data.full`)

When the server returns pre-rendered Blade rows:

```php
// Backend returning pre-rendered HTML rows
return response()->json([
    'full' => view('users._rows', compact('users'))->render(),
    'total' => $users->total(),
    'current_page' => $users->currentPage(),
    'per_page' => $users->perPage(),
    'last_page' => $users->lastPage(),
]);
```

Frontend consumes the HTML string and renders directly into `<tbody>`:

```javascript
const table = new CGEDataTable('#blade-rows-table', {
  source: 'ajax',
  url: '/users/rendered-rows',
  serverSide: true,
  autoBindActions: true, // Automatically re-binds CGEActionButton on newly injected rows
});
```

---

## 5. Tree-Shakeable Standalone Sub-Modules

### Standalone CGESort on an external HTML table:

```javascript
import { CGESort } from 'tailtools/plugins/CGEDataTable/modules/CGESort.js';

const sort = new CGESort({
  defaultDirection: 'asc',
  locale: 'tr',
  onChange: (detail) => console.log('Active sort rule:', detail.rules),
});
sort.attachHeaders('#custom-table th');

// One type per column, Turkish numbers and DD.MM.YYYY dates, empty values last:
sort.sortBy('date');
sort.sortRows([{ date: '02.01.2026' }, { date: '' }, { date: '15.12.2025' }]);
// => 15.12.2025, 02.01.2026, ''
```

### Standalone CGEFilter with debounce:

```javascript
import { CGEFilter } from 'tailtools/plugins/CGEDataTable/modules/CGEFilter.js';

const filter = new CGEFilter({
  debounce: 250,
  locale: 'tr', // 'istanbul' matches 'İstanbul', 'igdir' matches 'IĞDIR'
  onChange: ({ global, serialized }) => console.log('Searching for:', global, serialized),
});
filter.attachSearchInput('#custom-search-input');
filter.attachColumnFilter('role', '#role-filter'); // own debounce timer, initial value applied
```

### Standalone CGEPagination sliding window:

```javascript
import { CGEPagination } from 'tailtools/plugins/CGEDataTable/modules/CGEPagination.js';

const pager = new CGEPagination({ page: 10, perPage: 10, total: 500 });
console.log(pager.computeWindow());
// Output: [1, '...', 8, 9, 10, 11, 12, '...', 50]
pager.goTo(5);
console.log(pager.computeWindow());
// Output: [1, 2, 3, 4, 5, 6, 7, '...', 50] (a single hidden page is never an ellipsis)

pager.setPerPage('All');
pager.serialize(); // { page: 1, per_page: -1 }
```

## Handling remote failures and teardown

```javascript
import { CGEDataTable } from 'tailtools';
const collection = new CGEDataTable('#users-table', {
  source: 'ajax', url: '/api/users', driver: 'fetch', serverSide: true,
  // POST endpoints send nested JSON and the CSRF token from <meta name="csrf-token"> automatically.
});
collection.on('error', ({ error }) => console.error(error.status, error.errors)); // HttpError
// Before replacing the containing Blade partial (Livewire/Turbo):
CGEDataTable.destroyAll(document.querySelector('#users-panel'));

// Custom APIs:
new CGEDataTable('#orders', {
  source: 'ajax', url: '/api/orders', serverSide: true,
  responseAdapter: (res) => ({ rows: res.items, total: res.pagination.count,
    page: res.pagination.page, perPage: res.pagination.size }),
  paramNames: { perPage: 'limit', search: 'q' },
});
```

Supply a stable `id` in each API record. Persist deletion in your endpoint before removing an item from this local view; bulk removal has no built-in backend DELETE request.
