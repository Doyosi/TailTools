# CGEAlert - Laravel Blade Integration

`CGEAlert` integrates directly with Laravel Blade. With declarative data-attributes (`data-cge-alert`), you can intercept destructive form submissions and navigation links with zero manual JavaScript.

---

## 1. Quick Laravel Setup

### Asset Bundling (Vite)

In your `resources/css/app.css`:
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEAlert/style.css";
```

In your `resources/js/app.js`:
```javascript
import './bootstrap';
import { initTailTools, CGEAlert } from 'tailtools';

// Expose globally for Alpine.js or inline scripts
window.CGEAlert = CGEAlert;

// Initialize declarative triggers across the document
document.addEventListener('DOMContentLoaded', () => {
    initTailTools();
});
```

---

## 2. Declarative Form Delete Buttons

In Laravel applications, destructive actions are typically sent via a `DELETE` HTTP request inside a `<form>`:

```blade
<form action="{{ route('posts.destroy', $post) }}" method="POST">
    @csrf
    @method('DELETE')

    <button type="submit"
            data-cge-alert="delete"
            data-cge-title="Delete Post?"
            data-cge-message="This article will be permanently removed."
            data-cge-confirm-text="Yes, delete it"
            data-cge-cancel-text="Cancel"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-sm">
        Delete Post
    </button>
</form>
```

### How It Works:
1. When the user clicks the button, `CGEAlert` intercepts the event (`preventDefault()`, `stopPropagation()`).
2. The user sees a confirmation dialog with destructive styling.
3. If the user clicks **Cancel** or outside, the dialog closes and the form is **not** submitted.
4. If the user clicks **Confirm**, `CGEAlert` executes `form.requestSubmit()` to submit the form to the Laravel backend seamlessly.

---

## 3. High-Security Declarative Confirmation

Add `data-cge-require` to enforce exact-match phrase confirmation:

```blade
<form action="{{ route('projects.destroy', $project) }}" method="POST">
    @csrf
    @method('DELETE')

    <button type="submit"
            data-cge-alert="delete"
            data-cge-title="Delete Project {{ $project->name }}"
            data-cge-message="This will immediately wipe all code and databases."
            data-cge-require="{{ $project->name }}"
            data-cge-confirm-text="Permanently Delete"
            class="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-sm">
        Destroy Project
    </button>
</form>
```

The user must type the project name exactly before the confirm button becomes active.

---

## 4. Reusable Blade Component (`<x-cge-alert-button />`)

Create `resources/views/components/cge-alert-button.blade.php`:

```blade
@props([
    'archetype' => 'confirm',
    'title' => 'Are you sure?',
    'message' => '',
    'confirmText' => null,
    'cancelText' => null,
    'require' => null,
    'size' => 'md',
    'type' => 'button',
])

<button type="{{ $type }}"
        data-cge-alert="{{ $archetype }}"
        data-cge-title="{{ $title }}"
        data-cge-message="{{ $message }}"
        @if ($confirmText) data-cge-confirm-text="{{ $confirmText }}" @endif
        @if ($cancelText) data-cge-cancel-text="{{ $cancelText }}" @endif
        @if ($require) data-cge-require="{{ $require }}" @endif
        data-cge-size="{{ $size }}"
        {{ $attributes->merge(['class' => 'cursor-pointer transition']) }}>
    {{ $slot }}
</button>
```

### Usage:
```blade
<x-cge-alert-button 
    type="submit"
    archetype="delete"
    title="Revoke API Key?"
    message="Any external services using this key will immediately fail."
    confirmText="Revoke Key"
    class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-sm text-xs font-semibold">
    Revoke Key
</x-cge-alert-button>
```

---

## 5. Livewire 3 Integration

In a Livewire component view:

```blade
<button type="button"
        wire:click="deleteRecord"
        wire:confirm="Are you sure?" {{-- Livewire default --}}
        class="...">
    Delete
</button>
```

Or trigger `CGEAlert` programmatically from Livewire:

```javascript
document.addEventListener('livewire:initialized', () => {
    Livewire.on('confirm-action', async (event) => {
        const payload = Array.isArray(event) ? event[0] : event;

        const result = await window.CGEAlert.fire({
            archetype: payload.archetype || 'confirm',
            title: payload.title || 'Are you sure?',
            message: payload.message || '',
            confirmButtonText: payload.confirmText || 'Confirm',
            requireInput: payload.require || null
        });

        if (result.isConfirmed) {
            Livewire.dispatch(payload.onConfirmed, { value: result.value });
        }
    });
});
```
