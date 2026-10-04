# CGETabs - Laravel Blade Integration Guide

This guide details best practices for integrating **CGETabs** into **Laravel 10 / 11+** applications using native Blade components, controller partial responses, and Vite asset bundling.

---

## 1. Reusable Blade Component: `<x-cge-tabs>`

Create the component template file at:  
`resources/views/components/cge-tabs.blade.php`

```blade
@props([
    'id' => 'tabs-' . uniqid(),
    'urlSync' => 'hash', // 'hash' | 'query' | false
    'queryParamKey' => 'tab',
    'indicator' => 'line', // 'line' | 'pill' | false
    'orientation' => 'horizontal',
    'storage' => false,
])

<div id="{{ $id }}"
     data-cge-tabs
     data-cge-url-sync="{{ $urlSync === false ? 'false' : $urlSync }}"
     data-cge-query-param-key="{{ $queryParamKey }}"
     data-cge-indicator="{{ $indicator === false ? 'false' : $indicator }}"
     data-cge-orientation="{{ $orientation }}"
     {{ $attributes->merge(['class' => 'cge-tabs-container w-full']) }}>
    
    <!-- Tablist Navigation -->
    <div role="tablist" class="flex border-b border-slate-200 dark:border-slate-800 gap-2 relative">
        {{ $triggers }}
    </div>

    <!-- Tab Panels Container -->
    <div class="mt-4">
        {{ $slot }}
    </div>
</div>
```

---

## 2. Reusable Tab Trigger Component: `<x-cge-tab-trigger>`

Create at:  
`resources/views/components/cge-tab-trigger.blade.php`

```blade
@props([
    'name',
    'active' => false,
    'ajax' => null,
    'icon' => null,
])

<button type="button"
        data-cge-tab="{{ $name }}"
        @if($ajax) data-cge-ajax="{{ $ajax }}" @endif
        {{ $attributes->merge(['class' => 'px-4 py-2.5 text-sm font-medium transition cursor-pointer flex items-center gap-2 ' . ($active ? 'text-indigo-600 dark:text-indigo-400 font-semibold active' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')]) }}>
    @if($icon)
        <span>{!! $icon !!}</span>
    @endif
    <span>{{ $slot }}</span>
</button>
```

---

## 3. Reusable Tab Panel Component: `<x-cge-tab-panel>`

Create at:  
`resources/views/components/cge-tab-panel.blade.php`

```blade
@props([
    'name',
    'active' => false,
])

<div data-cge-panel="{{ $name }}"
     @if(!$active) hidden @endif
     {{ $attributes->merge(['class' => 'focus:outline-hidden']) }}>
    {{ $slot }}
</div>
```

---

## 4. Full Usage Example in Blade View

```blade
<x-cge-tabs id="user-management-tabs" urlSync="hash" indicator="line">
    <x-slot:triggers>
        <x-cge-tab-trigger name="overview" :active="true">
            Overview
        </x-cge-tab-trigger>

        <x-cge-tab-trigger name="security">
            Security & 2FA
        </x-cge-tab-trigger>

        <!-- Ajax Tab: Loaded only when clicked -->
        <x-cge-tab-trigger name="activity-logs" :ajax="route('users.logs-partial', $user->id)">
            Activity Logs
        </x-cge-tab-trigger>
    </x-slot:triggers>

    <!-- Overview Panel (Pre-rendered) -->
    <x-cge-tab-panel name="overview" :active="true">
        <h3 class="font-bold text-lg text-slate-900 dark:text-slate-100">User Profile</h3>
        <p class="text-sm text-slate-500">Name: {{ $user->name }} ({{ $user->email }})</p>
    </x-cge-tab-panel>

    <!-- Security Panel (Pre-rendered) -->
    <x-cge-tab-panel name="security">
        <h3 class="font-bold text-lg text-slate-900 dark:text-slate-100">Two-Factor Authentication</h3>
        <p class="text-sm text-slate-500">Status: Enabled</p>
    </x-cge-tab-panel>

    <!-- Activity Logs Panel (Lazy loaded via Ajax) -->
    <x-cge-tab-panel name="activity-logs">
        <!-- Content will be injected dynamically on tab activation -->
    </x-cge-tab-panel>
</x-cge-tabs>
```

---

## 5. Laravel Controller Handling for Ajax Partials

In your Laravel controller:

```php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Returns Blade partial for on-demand tab loading.
     */
    public function logsPartial(Request $request, User $user)
    {
        $logs = $user->activityLogs()->latest()->limit(20)->get();

        // Returning partial Blade view directly:
        return view('admin.users.partials.logs', compact('user', 'logs'));
    }
}
```

And in `resources/views/admin/users/partials/logs.blade.php`:

```blade
<div class="space-y-3">
    <h4 class="text-sm font-semibold text-slate-800">Recent Audit Logs</h4>
    <ul class="divide-y divide-slate-100 text-xs">
        @forelse($logs as $log)
            <li class="py-2 flex justify-between">
                <span>{{ $log->description }}</span>
                <span class="text-slate-400 font-mono">{{ $log->created_at->diffForHumans() }}</span>
            </li>
        @empty
            <li class="py-4 text-center text-slate-400">No activity recorded.</li>
        @endforelse
    </ul>
</div>
```

---

## 6. Livewire & Alpine.js Interoperability

When switching tabs inside Livewire or Alpine.js components, `CGETabs` works seamlessly without conflicting with the DOM:

```blade
<div x-data="{ currentTab: 'billing' }">
    <x-cge-tabs id="alpine-tabs" urlSync="query" queryParamKey="section">
        ...
    </x-cge-tabs>
</div>
```


## Dynamic panel cleanup
Use unique tab/panel names per component. AJAX endpoints should return trusted rendered Blade HTML. Replacing an AJAX panel destroys its registered child plugins; Tabs destroy restores the original panel nodes and attributes. For explicit page/Livewire removal, call the instance's `destroy()` before removing its container, then initialize the inserted subtree. To cancel navigation, listen for the DOM `cge:tabs:show` event and call `preventDefault()`.
