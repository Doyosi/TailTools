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
    <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-sm" data-cge-modal-backdrop></div>

    <!-- Dialog Card Container -->
    <div class="cge-modal-dialog relative z-10 w-full rounded-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col justify-between"
         data-cge-modal-dialog>
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            @if(isset($header))
                {{ $header }}
            @elseif($title)
                <h3 id="{{ $id }}-title" class="text-lg font-bold text-white tracking-tight">
                    {{ $title }}
                </h3>
            @endif

            <!-- Standard Close Button -->
            <button type="button"
                    data-cge-modal-close
                    class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    aria-label="Close modal">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Body / Content -->
        <div class="py-4 text-sm text-slate-300">
            {{ $slot }}
        </div>

        <!-- Footer -->
        @if(isset($footer))
            <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
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
<x-cge-modal id="welcome-modal" title="Welcome to the Platform" size="md">
    <p>
        Your account setup is complete. Explore your analytics or invite colleagues to collaborate on new projects.
    </p>

    <x-slot:footer>
        <button type="button" data-cge-modal-close class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-sm">
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
        <button type="button" data-cge-modal-close class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-sm">
            Cancel
        </button>
        <form action="{{ route('projects.destroy', $project->id) }}" method="POST">
            @csrf
            @method('DELETE')
            <button type="submit" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-sm">
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
    <form action="{{ route('customers.store') }}" method="POST" class="space-y-4">
        @csrf
        <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
            <input type="text" name="company" autofocus required
                   class="w-full px-3 py-2 rounded-sm bg-slate-950 border border-slate-800 text-white text-xs focus:ring-1 focus:ring-emerald-500">
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Contact Email</label>
                <input type="email" name="email" required
                       class="w-full px-3 py-2 rounded-sm bg-slate-950 border border-slate-800 text-white text-xs focus:ring-1 focus:ring-emerald-500">
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">Subscription Tier</label>
                <select name="tier" class="w-full px-3 py-2 rounded-sm bg-slate-950 border border-slate-800 text-white text-xs focus:ring-1 focus:ring-emerald-500">
                    <option value="starter">Starter</option>
                    <option value="pro">Professional</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>
        </div>

        <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" data-cge-modal-close class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-sm">
                Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-sm">
                Create Customer
            </button>
        </div>
    </form>
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
