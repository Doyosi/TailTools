# CGEDataTable in Laravel Blade

`CGEDataTable` is purpose-built for Laravel Blade applications and Vite asset bundling.

---

## 1. Blade Component Patterns

### Basic Blade Table (`<x-cge-datatable>`)

```blade
{{-- resources/views/components/cge-datatable.blade.php --}}
@props([
    'source' => 'dom',
    'url' => null,
    'perPage' => 15,
    'responsive' => 'collapse',
])

<div class="cge-datatable-wrapper">
    <table data-cge-datatable
           data-cge-source="{{ $source }}"
           @if($url) data-cge-url="{{ $url }}" @endif
           data-cge-per-page="{{ $perPage }}"
           data-cge-responsive="{{ $responsive }}"
           {{ $attributes->merge(['class' => 'w-full text-xs text-left']) }}>
        <thead>
            {{ $header ?? '' }}
        </thead>
        <tbody>
            {{ $slot }}
        </tbody>
    </table>
</div>
```

### Usage in Blade Views

```blade
<x-cge-datatable perPage="10" responsive="collapse">
    <x-slot:header>
        <tr>
            <th data-cge-key="id" data-cge-priority="1">ID</th>
            <th data-cge-key="name" data-cge-priority="1">Customer</th>
            <th data-cge-key="email" data-cge-priority="2">Email</th>
            <th data-cge-key="role" data-cge-priority="3">Role</th>
            <th data-cge-key="actions" data-cge-priority="1">Actions</th>
        </tr>
    </x-slot:header>

    @foreach ($users as $user)
        <tr>
            <td>#{{ $user->id }}</td>
            <td class="font-semibold text-slate-900">{{ $user->name }}</td>
            <td>{{ $user->email }}</td>
            <td>
                <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {{ ucfirst($user->role) }}
                </span>
            </td>
            <td>
                {{-- Integrated CGEActionButton with automated re-binding --}}
                <button type="button"
                        data-cge-action="delete"
                        data-cge-url="{{ route('users.destroy', $user) }}"
                        data-cge-title="Delete {{ $user->name }}?"
                        data-cge-message="This user will be permanently deleted."
                        class="px-2.5 py-1 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Delete
                </button>
            </td>
        </tr>
    @endforeach
</x-cge-datatable>
```

---

## 2. Laravel Eloquent Controller (Remote Ajax)

```php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if ($request->wantsJson()) {
            $query = User::query();

            // CGEFilter global search
            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // CGEFilter column filters
            if ($filters = $request->query('filters')) {
                if (!empty($filters['role'])) {
                    $query->where('role', $filters['role']);
                }
            }

            // CGESort parameters
            if ($sortBy = $request->query('sort_by')) {
                $sortDir = $request->query('sort_dir', 'asc');
                $query->orderBy($sortBy, $sortDir);
            } else {
                $query->latest('id');
            }

            // CGEPagination per-page limit
            $perPage = (int) $request->query('per_page', 15);

            return response()->json($query->paginate($perPage));
        }

        return view('users.index');
    }
}
```

---

## 3. Server-Rendered Blade HTML Rows Strategy

For apps requiring Blade components inside dynamically loaded rows:

```php
// Return Blade row partial in JSON
return response()->json([
    'full' => view('users._rows', ['users' => $paginator])->render(),
    'total' => $paginator->total(),
    'current_page' => $paginator->currentPage(),
    'per_page' => $paginator->perPage(),
    'last_page' => $paginator->lastPage(),
]);
```

`CGEDataTable` injects the HTML rows into `<tbody>` and immediately invokes `CGEActionButton.init()` so all delete, restore, and modal triggers function instantly.
