# Laravel Blade Integration Guide for CGEModal

This guide demonstrates how to build and use reusable Blade components for **CGEModal** inside Laravel 10 / 11 / 12 projects using Vite and Tailwind CSS v4.

---

## 1. Vite & Asset Configuration

### A. CSS Entry Point (`resources/css/app.css`)
```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import TailTools plugin styles */
@import "tailtools/plugins/CGEModal/style.css";
```

### B. JavaScript Entry Point (`resources/js/app.js`)
```javascript
import './bootstrap';
import '../css/app.css';

import { initTailTools, CGEModal } from 'tailtools';

// Expose globally for Alpine.js or inline view scripts
window.CGEModal = CGEModal;

document.addEventListener('DOMContentLoaded', () => {
    initTailTools();
});
```

---

## 2. Reusable Blade Component (`<x-cge-modal>`)

Save this component template as `resources/views/components/cge-modal.blade.php`:

```blade
@props([
    'id',
    'title' => null,
    'size' => 'lg',
    'theme' => 'dark', // Markup theme only: light | dark
    'backdrop' => 'true',
    'animation' => 'zoom',
    'animationDriver' => 'auto',
    'escapeClose' => 'true',
])

<div id="{{ $id }}"
     {{ $attributes->merge([
         'class' => 'cge-modal fixed inset-0 z-50 hidden items-center justify-center p-4 sm:p-6 overflow-y-auto',
     ]) }}
     role="dialog"
     aria-modal="true"
     aria-hidden="true"
     @if($title) aria-labelledby="{{ $id }}-title" @endif
     data-cge-size="{{ $size }}"
     data-cge-backdrop="{{ $backdrop }}"
     data-cge-animation="{{ $animation }}"
     data-cge-animation-driver="{{ $animationDriver }}"
     data-cge-escape-close="{{ $escapeClose }}">

    <!-- Backdrop Overlay -->
    <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/40 backdrop-blur-sm" data-cge-modal-backdrop></div>

    <!-- Dialog Card Container -->
    <div class="cge-modal-dialog cge-modal-surface {{ $theme === 'dark' ? 'cge-modal-dark' : 'cge-modal-light' }} relative z-10 w-full rounded-sm"
         data-cge-modal-dialog>
        
        <!-- Header -->
        <div class="cge-modal-header">
            @if(isset($header))
                {{ $header }}
            @elseif($title)
                <h3 id="{{ $id }}-title" class="cge-modal-title">
                    {{ $title }}
                </h3>
            @endif

            <!-- Standard Close Button -->
            <button type="button"
                    data-cge-modal-close
                    class="cge-modal-close rounded-sm"
                    aria-label="Close modal"><svg class="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <!-- Body / Content -->
        <div class="cge-modal-body">
            {{ $slot }}
        </div>

        <!-- Footer -->
        @if(isset($footer))
            <div class="cge-modal-footer">
                {{ $footer }}
            </div>
        @endif
    </div>
</div>
```

---

## 3. Blade Usage Examples

### Example A: Basic Information Modal
```blade
{{-- Trigger Button --}}
<button type="button" 
        data-cge-modal-target="#welcome-modal"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-sm font-medium transition shadow-lg shadow-indigo-600/20">
    View Welcome Guide
</button>

{{-- Component --}}
<x-cge-modal id="welcome-modal" title="Welcome to the Platform" size="md" theme="light">
    <p>
        Your account setup is complete. Explore your analytics or invite colleagues to collaborate on new projects.
    </p>

    <x-slot:footer>
        <button type="button" data-cge-modal-close class="cge-modal-action cge-modal-action-secondary rounded-sm">
            Got it
        </button>
    </x-slot:footer>
</x-cge-modal>
```

---

### Example B: Static Backdrop Shake Confirmation (Delete Action)
```blade
<button type="button" 
        data-cge-modal-target="#confirm-delete-modal"
        class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-sm text-sm font-medium transition shadow-lg shadow-rose-600/20">
    Delete Project
</button>

<x-cge-modal id="confirm-delete-modal" 
             title="Delete Project?" 
             size="sm" 
             backdrop="static" 
             escapeClose="false">
    <div class="p-3 rounded-sm bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-3">
        ⚠️ This action cannot be undone. All repository data will be removed.
    </div>
    <p class="text-xs text-slate-400">
        Clicking outside will shake the card. You must explicitly confirm or cancel.
    </p>

    <x-slot:footer>
        <button type="button" data-cge-modal-close class="cge-modal-action cge-modal-action-secondary rounded-sm">
            Cancel
        </button>
        <form action="{{ route('projects.destroy', $project->id) }}" method="POST" class="min-w-0 max-w-full">
            @csrf
            @method('DELETE')
            <button type="submit" class="cge-modal-action rounded-sm bg-rose-600 hover:bg-rose-500 text-white">
                Yes, Delete Permanently
            </button>
        </form>
    </x-slot:footer>
</x-cge-modal>
```

---

### Example C: Interactive Form Modal with Validation
```blade
<button type="button" 
        data-cge-modal-target="#create-customer-modal"
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-sm font-medium transition shadow-lg shadow-emerald-600/20">
    Add New Customer
</button>

<x-cge-modal id="create-customer-modal" title="Add Customer" size="xl">
    <form id="create-customer-form" action="{{ route('customers.store') }}" method="POST" class="space-y-3">
        @csrf
        <div>
            <label class="block text-xs font-medium mb-1">Company Name</label>
            <input type="text" name="company" autofocus required
                   class="cge-modal-input rounded-sm">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-medium mb-1">Contact Email</label>
                <input type="email" name="email" required
                       class="cge-modal-input rounded-sm">
            </div>
            <div>
                <label class="block text-xs font-medium mb-1">Subscription Tier</label>
                <select name="tier" class="cge-modal-input rounded-sm">
                    <option value="starter">Starter</option>
                    <option value="pro">Professional</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>
        </div>

    </form>
    <x-slot:footer>
        <button type="button" data-cge-modal-close class="cge-modal-action cge-modal-action-secondary rounded-sm">Cancel</button>
        <button type="submit" form="create-customer-form" class="cge-modal-action rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white">Create Customer</button>
    </x-slot:footer>
</x-cge-modal>
```

---

## 4. Alpine.js Interoperability

If you are using Alpine.js alongside TailTools in Laravel:

```html
<div x-data="{
    openModal() {
        window.CGEModal.getInstance('#my-modal').open();
    }
}">
    <button @click="openModal()" class="btn">
        Open with Alpine
    </button>
</div>
```

## Compact surface (2026-10-05)

Use `cge-modal-surface` on the dialog and `cge-modal-header`, `cge-modal-body`, `cge-modal-footer` for its slots. The surface defaults to light; add `cge-modal-dark` for dark colors (`cge-modal-light` is an explicit light marker). This is a markup/CSS choice, not a JavaScript theme option. Keep `rounded-sm`; all built-in compact controls use `var(--radius-sm, 0.25rem)`.

Header/body spacing is 16 px on mobile and 20 px on desktop; titles are 16 px and body text 13 px. Footer spacing is 12 px vertically. Actions are at least 32 px high, or 36 px below 640 px; close targets are 32 px. Long labels wrap. The body scrolls within a viewport-bounded surface while header/footer remain visible. A form wrapping all slots must use `cge-modal-layout`; a submit button must not carry `data-cge-modal-close` (close after successful submission).

Use `cge-modal-action` for sizing and add your Tailwind color classes; `cge-modal-action-secondary` provides a theme-aware neutral action. `cge-modal-close`, `cge-modal-input` and `cge-modal-description` are optional. Existing consumer markup without these surface/slot classes keeps its own styling. Public options, sizing presets, events and declarations are unchanged. Import the plugin stylesheet or `tailtools/style.css`.
