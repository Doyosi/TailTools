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

```javascript
import { CGEDataTable } from 'tailtools';

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
        return `<span class="px-2 py-0.5 rounded text-[11px] font-semibold border ${colors[val] || 'bg-slate-100'}">${val.toUpperCase()}</span>`;
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
        $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    if ($sortBy = $request->query('sort_by')) {
        $query->orderBy($sortBy, $request->query('sort_dir', 'asc'));
    }

    return response()->json($query->paginate($request->query('per_page', 15)));
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

const sort = new CGESort({ defaultDirection: 'asc' });
sort.attachHeaders('#custom-table th');

sort.on('sort', (detail) => {
  console.log('Active sort rule:', detail.rules);
});
```

### Standalone CGEFilter with debounce:

```javascript
import { CGEFilter } from 'tailtools/plugins/CGEDataTable/modules/CGEFilter.js';

const filter = new CGEFilter({ debounce: 250 });
filter.attachSearchInput('#custom-search-input');

filter.on('filter', ({ global, serialized }) => {
  console.log('Searching for:', global);
});
```

### Standalone CGEPagination sliding window:

```javascript
import { CGEPagination } from 'tailtools/plugins/CGEDataTable/modules/CGEPagination.js';

const pager = new CGEPagination({ page: 5, perPage: 10, total: 500 });
console.log(pager.computeWindow());
// Output: [1, '...', 3, 4, 5, 6, 7, '...', 50]
```
