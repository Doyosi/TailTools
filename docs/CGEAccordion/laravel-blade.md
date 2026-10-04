# CGEAccordion with Laravel Blade

TailTools provides first-class support for Laravel Blade with declarative `data-cge-*` HTML attributes, zero unnecessary JavaScript boilerplate, and seamless Vite integration.

---

## 1. Declarative Markup Pattern

In your Blade templates, you can output pure HTML with declarative attributes:

```blade
{{-- resources/views/faq.blade.php --}}
<div id="faq-accordion"
     data-cge-accordion
     data-cge-exclusive="true"
     data-cge-url-sync="hash"
     class="divide-y divide-zinc-200 dark:divide-zinc-800">

    @foreach($faqs as $faq)
        <div class="cge-accordion-item" data-cge-item="{{ $faq->slug }}">
            <h3>
                <button type="button"
                        data-cge-trigger="{{ $faq->slug }}"
                        class="flex justify-between items-center w-full py-4 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 transition cursor-pointer">
                    <span>{{ $faq->question }}</span>
                    <svg data-cge-icon class="w-4 h-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                    </svg>
                </button>
            </h3>
            <div data-cge-body="{{ $faq->slug }}" class="grid grid-rows-[0fr] transition-all duration-300 ease-out">
                <div class="overflow-hidden min-h-0 text-sm text-zinc-600 dark:text-zinc-400 pb-4">
                    {!! $faq->answer_html !!}
                </div>
            </div>
        </div>
    @endforeach
</div>
```

---

## 2. Reusable Blade Components

Create dedicated reusable Blade components for clean, expressive markup:

### `<x-cge-accordion>`

Create `resources/views/components/cge-accordion.blade.php`:

```blade
@props([
    'id' => 'cge-accordion-' . uniqid(),
    'exclusive' => true,
    'alwaysOpen' => false,
    'urlSync' => 'hash',
    'storage' => false,
    'storageKey' => null,
])

<div id="{{ $id }}"
     data-cge-accordion
     data-cge-exclusive="{{ $exclusive ? 'true' : 'false' }}"
     data-cge-always-open="{{ $alwaysOpen ? 'true' : 'false' }}"
     data-cge-url-sync="{{ $urlSync ? $urlSync : 'false' }}"
     @if($storage) data-cge-storage="{{ $storage }}" @endif
     @if($storageKey) data-cge-storage-key="{{ $storageKey }}" @endif
     {{ $attributes->merge(['class' => 'divide-y divide-zinc-200 dark:divide-zinc-800']) }}>
    {{ $slot }}
</div>
```

### `<x-cge-accordion-item>`

Create `resources/views/components/cge-accordion-item.blade.php`:

```blade
@props([
    'id',
    'title',
    'open' => false,
])

<div {{ $attributes->merge(['class' => 'cge-accordion-item']) }}
     data-cge-item="{{ $id }}"
     @if($open) data-cge-open="true" @endif>
    <h3>
        <button type="button"
                data-cge-trigger="{{ $id }}"
                class="flex justify-between items-center w-full py-4 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 transition cursor-pointer">
            <span>{{ $title }}</span>
            <svg data-cge-icon class="w-4 h-4 transition-transform duration-300 {{ $open ? 'rotate-180' : '' }}" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
            </svg>
        </button>
    </h3>
    <div data-cge-body="{{ $id }}" class="grid {{ $open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]' }} transition-all duration-300 ease-out">
        <div class="overflow-hidden min-h-0 text-sm text-zinc-600 dark:text-zinc-400 pb-4">
            {{ $slot }}
        </div>
    </div>
</div>
```

---

## 3. Using the Components in Views

```blade
<x-cge-accordion id="billing-faq" exclusive="true" url-sync="hash">
    <x-cge-accordion-item id="tier-selection" title="How do I change my plan?">
        Navigate to Settings > Billing and pick your desired tier. Prorations apply instantly.
    </x-cge-accordion-item>

    <x-cge-accordion-item id="enterprise-invoicing" title="Do you support net-30 invoicing?">
        Yes! Enterprise contracts over $5,000/yr support PO and net-30 wire payment terms.
    </x-cge-accordion-item>
</x-cge-accordion>
```

---

## 4. Standalone `<x-cge-collapse>` Component

Create `resources/views/components/cge-collapse.blade.php`:

```blade
@props([
    'id' => 'collapse-' . uniqid(),
    'triggerText' => 'Toggle Panel',
    'open' => false,
])

<div>
    <button type="button"
            data-cge-collapse="#{{ $id }}"
            data-cge-default-open="{{ $open ? 'true' : 'false' }}"
            class="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer">
        <span>{{ $triggerText }}</span>
        <svg data-cge-icon class="w-3.5 h-3.5 transition-transform duration-300 {{ $open ? 'rotate-180' : '' }}" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
        </svg>
    </button>

    <div id="{{ $id }}" class="cge-wrapper {{ $open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]' }} mt-2">
        <div class="cge-content">
            {{ $slot }}
        </div>
    </div>
</div>
```

---

## 5. Livewire & Inertia.js Re-initialization

When components dynamically re-render (e.g., Livewire morph or Inertia navigation), call:

```javascript
document.addEventListener('livewire:navigated', () => {
    window.TailTools?.init?.();
});
```
