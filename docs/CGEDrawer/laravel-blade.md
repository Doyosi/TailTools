# CGEDrawer - Laravel Blade Integration Guide

This guide details best practices for integrating **CGEDrawer** into **Laravel 10 / 11+** applications using native Blade components, Alpine.js, and Livewire.

---

## 1. Reusable Blade Component: `<x-cge-drawer>`

Create the component template file at:  
`resources/views/components/cge-drawer.blade.php`

```blade
@props([
    'id' => 'drawer-' . uniqid(),
    'placement' => 'left', // left | right | top | bottom
    'size' => 'md', // sm | md | lg | xl | full | auto
    'backdrop' => true, // true | false | static
    'backdropClose' => true,
    'escapeClose' => true,
    'swipeClose' => true,
    'title' => null,
    'pushContent' => null,
    'mini' => false,
])

@php
    $isVertical = in_array($placement, ['top', 'bottom']);
    $sizePresets = [
        'left' => ['sm' => 'w-64', 'md' => 'w-80', 'lg' => 'w-96', 'xl' => 'w-1/2', 'full' => 'w-screen'],
        'right' => ['sm' => 'w-64', 'md' => 'w-80', 'lg' => 'w-96', 'xl' => 'w-1/2', 'full' => 'w-screen'],
        'top' => ['sm' => 'h-48', 'md' => 'h-80', 'lg' => 'h-1/2', 'full' => 'h-screen'],
        'bottom' => ['sm' => 'h-48', 'md' => 'h-80', 'lg' => 'h-1/2', 'full' => 'h-screen', 'auto' => 'max-h-[90vh] h-auto'],
    ];
    $sizeClass = $sizePresets[$placement][$size] ?? $size;
@endphp

<div id="{{ $id }}"
     class="cge-drawer fixed inset-0 z-50 hidden {{ $backdrop ? '' : 'pointer-events-none' }}"
     data-cge-placement="{{ $placement }}"
     data-cge-size="{{ $sizeClass }}"
     data-cge-backdrop="{{ is_bool($backdrop) ? ($backdrop ? 'true' : 'false') : $backdrop }}"
     data-cge-backdrop-close="{{ $backdropClose ? 'true' : 'false' }}"
     data-cge-escape-close="{{ $escapeClose ? 'true' : 'false' }}"
     data-cge-swipe-close="{{ $swipeClose ? 'true' : 'false' }}"
     @if($pushContent) data-cge-push-content="{{ $pushContent }}" @endif
     @if($mini) data-cge-mini="true" @endif
     {{ $attributes }}>

    {{-- Optional Backdrop Overlay --}}
    @if($backdrop)
        <div class="cge-drawer-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" data-cge-drawer-backdrop></div>
    @endif

    {{-- Drawer Panel --}}
    <div class="cge-drawer-dialog {{ $backdrop ? '' : 'pointer-events-auto' }} bg-white border-slate-200 shadow-2xl flex flex-col justify-between {{ $placement === 'bottom' ? 'rounded-t-sm border-t' : '' }} {{ $placement === 'left' ? 'border-r' : '' }} {{ $placement === 'right' ? 'border-l' : '' }} {{ $placement === 'top' ? 'border-b' : '' }}"
         data-cge-drawer-dialog>
        
        {{-- Mobile Drag Handle for Bottom Sheets --}}
        @if($placement === 'bottom')
            <div class="pt-3">
                <div class="cge-drawer-handle"></div>
            </div>
        @endif

        {{-- Header Slot --}}
        @if(isset($header) || $title)
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
                @if(isset($header))
                    {{ $header }}
                @else
                    <h3 class="text-sm font-bold text-slate-900">{{ $title }}</h3>
                @endif
                <button type="button" data-cge-drawer-close class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer" aria-label="Close">
                    ✕
                </button>
            </div>
        @endif

        {{-- Body Slot --}}
        <div class="p-5 flex-1 overflow-y-auto">
            {{ $slot }}
        </div>

        {{-- Footer Slot --}}
        @if(isset($footer))
            <div class="p-4 border-t border-slate-100 bg-slate-50/50">
                {{ $footer }}
            </div>
        @endif
    </div>
</div>
```

---

## 2. Practical Blade Use Cases

### Example 1: E-Commerce Slide-Over Cart
```blade
{{-- Trigger Button --}}
<button type="button" 
        data-cge-drawer-target="#cart-drawer" 
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-semibold flex items-center gap-2">
    <span>🛒</span> View Cart ({{ $cartCount }})
</button>

{{-- Drawer Instance --}}
<x-cge-drawer id="cart-drawer" placement="right" size="lg" title="Your Shopping Cart">
    <div class="space-y-3">
        @forelse($cartItems as $item)
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                <div>
                    <div class="font-semibold text-xs text-slate-900">{{ $item->title }}</div>
                    <div class="text-[11px] text-slate-500">Qty: {{ $item->quantity }}</div>
                </div>
                <span class="font-bold text-xs text-indigo-600">${{ number_format($item->price, 2) }}</span>
            </div>
        @empty
            <div class="text-center py-8 text-slate-400 text-xs">Your cart is currently empty.</div>
        @endforelse
    </div>

    <x-slot:footer>
        <div class="flex items-center justify-between text-xs font-semibold mb-3">
            <span class="text-slate-500">Subtotal:</span>
            <span class="text-base font-bold text-slate-900">${{ number_format($cartTotal, 2) }}</span>
        </div>
        <a href="{{ route('checkout') }}" class="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-sm text-center">
            Proceed to Checkout →
        </a>
    </x-slot:footer>
</x-cge-drawer>
```

---

### Example 2: Mobile Bottom Action Sheet
```blade
<button type="button" data-cge-drawer-target="#actions-sheet" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-sm">
    More Options
</button>

<x-cge-drawer id="actions-sheet" placement="bottom" size="auto">
    <div class="text-center mb-4">
        <h3 class="font-bold text-sm text-slate-900">Document Actions</h3>
        <p class="text-xs text-slate-500">Swipe downward to dismiss</p>
    </div>
    
    <div class="space-y-2">
        <button type="button" wire:click="shareDocument" data-cge-drawer-close class="w-full py-2.5 px-3 rounded-sm bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-2">
            <span>🔗</span> Share Document
        </button>
        <button type="button" wire:click="archiveDocument" data-cge-drawer-close class="w-full py-2.5 px-3 rounded-sm bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-2">
            <span>📦</span> Archive
        </button>
        <button type="button" wire:click="deleteDocument" data-cge-drawer-close class="w-full py-2.5 px-3 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
            <span>🗑️</span> Delete Permanently
        </button>
    </div>
</x-cge-drawer>
```

---

### Example 3: Static Confirmation Drawer (Directional Nudge)
```blade
<button type="button" data-cge-drawer-target="#delete-confirm-drawer" class="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-sm text-xs font-semibold">
    Delete Organization
</button>

<x-cge-drawer id="delete-confirm-drawer" placement="left" size="md" backdrop="static" title="Critical Action Confirmation">
    <div class="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-sm mb-4">
        <strong>High Security Notice:</strong> This action cannot be dismissed by clicking outside. You must confirm or cancel below.
    </div>
    <p class="text-xs text-slate-600 leading-relaxed">
        All member repositories, audit logs, and webhooks will be deleted.
    </p>

    <x-slot:footer>
        <div class="flex items-center justify-end gap-2">
            <button type="button" data-cge-drawer-close class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-sm">
                Cancel
            </button>
            <button type="submit" form="delete-form" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-sm">
                Confirm Deletion
            </button>
        </div>
    </x-slot:footer>
</x-cge-drawer>
```

---

## 3. Alpine.js & Livewire Interoperability

You can seamlessly synchronize drawer states with Alpine.js or Livewire:

```html
<div x-data="{ open: false }">
    <button type="button" @click="CGEDrawer.toggle('#alpine-drawer')" class="px-4 py-2 bg-indigo-600 text-white rounded-sm text-xs font-semibold">
        Toggle with Alpine
    </button>
</div>
```

Or trigger from Livewire events:
```javascript
document.addEventListener('livewire:initialized', () => {
    Livewire.on('open-cart', () => {
        CGEDrawer.open('#cart-drawer');
    });
    Livewire.on('close-cart', () => {
        CGEDrawer.close('#cart-drawer');
    });
});
```
