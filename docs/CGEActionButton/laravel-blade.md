# CGEActionButton - Laravel Blade Integration Guide

This guide details how to integrate **CGEActionButton** into Laravel applications with custom reusable Blade components (`<x-cge-action-button>` and `<x-cge-delete-button>`), resource tables, and Livewire compatibility.

---

## 1. Asset Pipeline Setup

### A. Add Stylesheet to `resources/css/app.css`
```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGEActionButton stylesheet */
@import "tailtools/plugins/CGEActionButton/style.css";
```

### B. Initialize in `resources/js/app.js`
```javascript
import './bootstrap';
import { CGEActionButton, initTailTools } from 'tailtools';

// Automatically initializes global event delegation on document
initTailTools();

// Global access for Alpine.js or inline scripts
window.CGEActionButton = CGEActionButton;
```

### C. Verify CSRF Meta Tag in Layout (`resources/views/layouts/app.blade.php`)
```html
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Laravel CSRF Token (Auto-detected by CGEActionButton) -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

---

## 2. Reusable Blade Components

Create two lightweight, zero-dependency Blade components in your Laravel project:

### `<x-cge-action-button>` Component (`resources/views/components/cge-action-button.blade.php`)

```blade
@props([
    'action' => 'confirm',
    'url' => null,
    'method' => 'POST',
    'title' => null,
    'message' => null,
    'confirmText' => null,
    'cancelText' => null,
    'require' => null,
    'loadingText' => null,
    'lockGroup' => null,
    'successToast' => null,
    'errorToast' => null,
    'redirect' => null,
    'instant' => false,
    'class' => 'px-3 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer inline-flex items-center justify-center'
])

<button type="button"
        data-cge-action="{{ $action }}"
        @if($url) data-cge-url="{{ $url }}" @endif
        @if($method) data-cge-method="{{ $method }}" @endif
        @if($title) data-cge-title="{{ $title }}" @endif
        @if($message) data-cge-message="{{ $message }}" @endif
        @if($confirmText) data-cge-confirm-text="{{ $confirmText }}" @endif
        @if($cancelText) data-cge-cancel-text="{{ $cancelText }}" @endif
        @if($require) data-cge-require="{{ $require }}" @endif
        @if($loadingText) data-cge-loading-text="{{ $loadingText }}" @endif
        @if($lockGroup) data-cge-lock-group="{{ $lockGroup }}" @endif
        @if($successToast) data-cge-success-toast="{{ $successToast }}" @endif
        @if($errorToast) data-cge-error-toast="{{ $errorToast }}" @endif
        @if($redirect) data-cge-redirect="{{ $redirect }}" @endif
        @if($instant) data-cge-instant="true" @endif
        {{ $attributes->merge(['class' => $class]) }}>
    {{ $slot }}
</button>
```

### `<x-cge-delete-button>` Component (`resources/views/components/cge-delete-button.blade.php`)

```blade
@props([
    'url' => null,
    'form' => null,
    'title' => __('Delete Confirmation'),
    'message' => __('Are you sure you want to delete this item? This action cannot be undone.'),
    'confirmText' => __('Yes, Delete'),
    'cancelText' => __('Cancel'),
    'require' => null,
    'loadingText' => __('Deleting...'),
    'lockGroup' => 'row',
    'successToast' => __('Item successfully deleted.'),
    'class' => 'px-2.5 py-1.5 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer inline-flex items-center justify-center'
])

<button type="button"
        data-cge-action="delete"
        @if($url) data-cge-url="{{ $url }}" @endif
        @if($form) data-cge-form="{{ $form }}" @endif
        data-cge-method="DELETE"
        data-cge-title="{{ $title }}"
        data-cge-message="{{ $message }}"
        data-cge-confirm-text="{{ $confirmText }}"
        data-cge-cancel-text="{{ $cancelText }}"
        @if($require) data-cge-require="{{ $require }}" @endif
        data-cge-loading-text="{{ $loadingText }}"
        data-cge-lock-group="{{ $lockGroup }}"
        data-cge-success-toast="{{ $successToast }}"
        {{ $attributes->merge(['class' => $class]) }}>
    {{ $slot->isEmpty() ? __('Delete') : $slot }}
</button>
```

---

## 3. Practical Blade Patterns

### Pattern A: Laravel Resource Table (Row Action Protection)
Disables sibling actions in the same row while an action is executing:

```blade
<table class="w-full text-left text-xs">
    <tbody class="divide-y divide-slate-100">
        @foreach ($tenants as $tenant)
            <tr data-cge-action-group class="hover:bg-slate-50 transition">
                <td class="px-4 py-2 font-medium">{{ $tenant->name }}</td>
                <td class="px-4 py-2">{{ $tenant->created_at->format('M d, Y') }}</td>
                <td class="px-4 py-2 text-right space-x-2">
                    <a href="{{ route('tenants.edit', $tenant) }}" 
                       class="px-2.5 py-1.5 rounded-sm bg-slate-100 text-slate-700 font-semibold text-xs">
                        Edit
                    </a>

                    <x-cge-delete-button 
                        :url="route('tenants.destroy', $tenant)"
                        :title="__('Delete :name?', ['name' => $tenant->name])"
                        lockGroup="row" />
                </td>
            </tr>
        @endforeach
    </tbody>
</table>
```

### Pattern B: Critical Danger Zone (Type-to-Confirm)

```blade
<x-cge-delete-button 
    :url="route('workspace.purge', $workspace)"
    require="PURGE"
    :title="__('Permanently Purge Workspace')"
    :message="__('Type PURGE below to wipe all 16 database partitions.')"
    confirmText="Purge Workspace Now"
    class="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs">
    Purge Workspace
</x-cge-delete-button>
```

### Pattern C: Instant Administrative Command (No Modal)

```blade
<x-cge-action-button 
    action="direct"
    :url="route('admin.cache.clear')"
    method="POST"
    loadingText="Flushing Cache..."
    successToast="Application cache flushed!"
    class="px-3.5 py-2 rounded-sm bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold">
    Clear Cache
</x-cge-action-button>
```

---

## 4. Livewire & Inertia Compatibility

`CGEActionButton` uses **global event delegation on `document`**, which means:
- When Livewire morphs the DOM after a component update, all newly rendered `[data-cge-action]` buttons work immediately.
- Zero `wire:ignore` or manual component re-binding is necessary.
- Sibling lock groups automatically bind to the freshly morphed elements.

## Stability fixes (October 2026)

- Keep `<meta name="csrf-token" content="{{ csrf_token() }}">` in the layout. Without it the plugin falls back to the form `_token`, `window.csrfToken`, then the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN` (Laravel decrypts it), so a stale encrypted cookie no longer causes 419 through `X-CSRF-TOKEN`.
- A controller that answers an AJAX request with `return redirect()->route(...)` now navigates to the final page (`followRedirects`, default `true`). Returning `response()->json(['redirect' => $url])` keeps flash data for the next page; a followed redirect has already rendered (and consumed) it.
- `wire:click` / `@click` on a `data-cge-confirm` element runs once after confirmation. After Livewire morphs or Turbo visits call `CGEActionButton.destroyAll(root)` (or `destroyTailTools(root)`).
- `<button type="button">` inside a form no longer submits it implicitly; use a submit button, `data-cge-form`, or `data-cge-ajax`.
