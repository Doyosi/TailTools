# CGEToast - Laravel Blade & Session Flash Integration

`CGEToast` is designed from the ground up for seamless integration into Laravel applications. It supports native Blade session flash banners, dedicated Blade components, and Livewire / Alpine.js reactive triggers.

---

## 1. Quick Laravel Setup

### Asset Bundling (Vite)

In your `resources/css/app.css`:
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEToast/style.css";
```

In your `resources/js/app.js`:
```javascript
import './bootstrap';
import { initTailTools, CGEToast } from 'tailtools';

// Expose on window for inline scripts or Alpine.js
window.CGEToast = CGEToast;

// Initialize declarative triggers and session flashes
document.addEventListener('DOMContentLoaded', () => {
    initTailTools();
});
```

---

## 2. Session Flash Messaging Component

Laravel controllers commonly redirect back with flash messages:
```php
// In your Laravel Controller
public function update(ProfileRequest $request)
{
    $request->user()->update($request->validated());

    return redirect()->route('profile.edit')->with('success', 'Profile updated successfully!');
}
```

### Create `<x-cge-toast />` Component

Create `resources/views/components/cge-toast.blade.php`:

```blade
@props([
    'position' => 'top-right',
    'duration' => 5000,
])

{{-- Success Flash --}}
@if (session('success'))
    <div data-cge-toast-flash
         data-cge-variant="success"
         data-cge-title="{{ session('title', 'Success') }}"
         data-cge-message="{{ session('success') }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="{{ $duration }}">
    </div>
@endif

{{-- Error Flash --}}
@if (session('error'))
    <div data-cge-toast-flash
         data-cge-variant="error"
         data-cge-title="{{ session('title', 'Error') }}"
         data-cge-message="{{ session('error') }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="{{ $duration }}">
    </div>
@endif

{{-- Warning Flash --}}
@if (session('warning'))
    <div data-cge-toast-flash
         data-cge-variant="warning"
         data-cge-title="{{ session('title', 'Warning') }}"
         data-cge-message="{{ session('warning') }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="{{ $duration }}">
    </div>
@endif

{{-- Info / Status Flash --}}
@if (session('status'))
    <div data-cge-toast-flash
         data-cge-variant="info"
         data-cge-title="{{ session('title', 'Notice') }}"
         data-cge-message="{{ session('status') }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="{{ $duration }}">
    </div>
@endif

{{-- Validation Errors Summary --}}
@if ($errors->any())
    <div data-cge-toast-flash
         data-cge-variant="error"
         data-cge-title="Validation Error"
         data-cge-message="{{ $errors->first() }}"
         data-cge-position="{{ $position }}"
         data-cge-duration="7000">
    </div>
@endif
```

### Include in Layout Template

In `resources/views/layouts/app.blade.php`:

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans antialiased bg-slate-950 text-slate-100">
    
    {{-- Global Flash Toast Renderer --}}
    <x-cge-toast position="top-right" :duration="5000" />

    <main>
        {{ $slot }}
    </main>
</body>
</html>
```

When your page loads, `CGEToast.init()` will detect the `data-cge-toast-flash` tags, dispatch the notifications into isolated portals, and remove the flash placeholders.

---

## 3. Declarative HTML Button Triggers

You can trigger toasts directly from Blade buttons without writing JavaScript:

```blade
<button type="button"
        data-cge-toast="Link copied to clipboard!"
        data-cge-toast-variant="success"
        data-cge-toast-position="top-right"
        class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-sm font-medium">
    Copy Invite Link
</button>
```

Supported declarative attributes:
- `data-cge-toast="Message text"`
- `data-cge-toast-variant="success|error|warning|info|neutral"`
- `data-cge-toast-title="Header Title"`
- `data-cge-toast-position="top-right|top-full|bottom-left|..."`
- `data-cge-toast-duration="6000"`

---

## 4. Livewire 3 Integration

In a Livewire component:
```php
namespace App\Livewire;

use Livewire\Component;

class EditUserProfile extends Component
{
    public $username;

    public function save()
    {
        // save logic...
        
        $this->dispatch('toast', [
            'type' => 'success',
            'message' => 'Profile updated successfully!',
            'title' => 'Saved'
        ]);
    }

    public function render()
    {
        return view('livewire.edit-user-profile');
    }
}
```

In your main JavaScript or layout template, register the Livewire event listener:

```javascript
document.addEventListener('livewire:initialized', () => {
    Livewire.on('toast', (event) => {
        const payload = Array.isArray(event) ? event[0] : event;
        const variant = payload.type || payload.variant || 'info';
        
        window.CGEToast.show({
            message: payload.message,
            title: payload.title || null,
            variant: variant,
            position: payload.position || 'top-right',
            duration: payload.duration || 5000
        });
    });
});
```

---

## 5. Alpine.js Integration

Trigger toasts with Alpine `@click`:

```blade
<div x-data="{ copied: false }">
    <button @click="
        navigator.clipboard.writeText('API_KEY_12345');
        window.CGEToast.success('API key copied to clipboard!', { title: 'Copied' });
    " class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-semibold">
        Copy API Key
    </button>
</div>
```
