---
name: cge-modal
description: High-performance, accessible native JavaScript modal plugin for Tailwind CSS v4.3+ and Laravel Blade environments. Supports optional integration with tailwind-animations, built-in fallback CSS transitions, backdrop dismissal controls, static backdrop shake effect, multiple sizing presets, and complete keyboard/focus management.
---

# CGEModal Agent Skill

Use this skill when implementing, styling, or troubleshooting modals and dialog overlays using the **TailTools** `CGEModal` plugin in Tailwind CSS v4.3+ or Laravel Blade projects.

---

## 1. When to Use CGEModal

Apply `CGEModal` whenever the user asks for:
- "Add a modal / dialog / popup in Tailwind or Laravel."
- "Show an alert or confirmation dialog with backdrop."
- "Create an accessible form modal with Tab focus trapping."
- "Implement a static backdrop that shakes when the user clicks outside."
- "Use `tailwind-animations` (e.g., `animate-zoom-in`, `animate-fade-in`) for modal entry/exit."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEModal/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEModal } from 'tailtools';

// Declarative auto-initialization for data-cge-* attributes
initTailTools();

// Expose to window for Alpine.js or inline scripts if needed
window.CGEModal = CGEModal;
```

---

## 3. Declarative HTML Markup Pattern

```html
<!-- Trigger Button -->
<button type="button" 
        data-cge-modal-target="#my-modal" 
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-sm font-medium transition cursor-pointer">
    Open Modal
</button>

<!-- Modal Container -->
<div id="my-modal"
     class="cge-modal fixed inset-0 z-50 hidden items-center justify-center p-4 sm:p-6 overflow-y-auto"
     role="dialog"
     aria-modal="true"
     aria-labelledby="my-modal-title"
     data-cge-size="lg"
     data-cge-backdrop="true"
     data-cge-animation="zoom"
     data-cge-animation-driver="auto">

    <!-- Backdrop Overlay -->
    <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-sm" data-cge-modal-backdrop></div>

    <!-- Dialog Card -->
    <div class="cge-modal-dialog relative z-10 w-full rounded-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col justify-between"
         data-cge-modal-dialog>
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 id="my-modal-title" class="text-lg font-bold text-white">Modal Title</h3>
            <button type="button" data-cge-modal-close class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" aria-label="Close">
                ✕
            </button>
        </div>

        <!-- Body -->
        <div class="py-4 text-sm text-slate-300">
            Modal body content goes here.
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" data-cge-modal-close class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-sm transition cursor-pointer">
                Cancel
            </button>
            <button type="button" data-cge-modal-close class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-sm transition cursor-pointer">
                Confirm
            </button>
        </div>
    </div>
</div>
```

---

## 4. Laravel Blade Component Pattern (`<x-cge-modal>`)

Component file: `resources/views/components/cge-modal.blade.php`:

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

    <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-sm" data-cge-modal-backdrop></div>

    <div class="cge-modal-dialog relative z-10 w-full rounded-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col justify-between"
         data-cge-modal-dialog>
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            @if(isset($header))
                {{ $header }}
            @elseif($title)
                <h3 id="{{ $id }}-title" class="text-lg font-bold text-white tracking-tight">
                    {{ $title }}
                </h3>
            @endif

            <button type="button" data-cge-modal-close class="w-8 h-8 rounded-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" aria-label="Close modal">
                ✕
            </button>
        </div>

        <div class="py-4 text-sm text-slate-300">
            {{ $slot }}
        </div>

        @if(isset($footer))
            <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
                {{ $footer }}
            </div>
        @endif
    </div>
</div>
```

---

## 5. Sizing Matrix Presets

| Size | Class Equivalent | Typical Usage |
| :--- | :--- | :--- |
| `xs` | `max-w-xs` (320px) | Simple prompt / OTP input |
| `sm` | `max-w-sm` (384px) | Delete / Warning alert |
| `md` | `max-w-md` (448px) | Login / Signup dialog |
| `lg` (Default) | `max-w-lg` (512px) | Standard content / User profile |
| `xl` | `max-w-xl` (576px) | Form with 2-column grid |
| `2xl` | `max-w-2xl` (672px) | Multi-step wizard |
| `3xl` | `max-w-3xl` (768px) | Dashboard preview |
| `4xl` | `max-w-4xl` (896px) | Split pane / file manager |
| `5xl` | `max-w-5xl` (1024px) | Large data table / report |
| `full` | `max-w-full` (100%) | Full-screen immersive view |

---

## 6. Static Backdrop & Tactile Shake Alert

To enforce that a user must take an explicit action and prevent accidental outside clicks:

```html
<div id="static-modal"
     class="cge-modal ..."
     data-cge-backdrop="static"
     data-cge-escape-close="false">
    ...
</div>
```

When the user clicks the dark backdrop or presses Escape:
1. Dismissal is prevented.
2. The dialog card shakes via `animate-shake` (or fallback `.cge-modal-shake`).
3. Custom event `cge:modal:shake` is dispatched.

---

## 7. Programmatic JavaScript API

```javascript
import { CGEModal } from 'tailtools';

// 1. Get or create instance
const modal = CGEModal.getOrCreateInstance('#my-modal', {
  size: 'xl',
  backdrop: 'static',
  animationDriver: 'tailwind-animations'
});

// 2. Open / Close / Toggle
await modal.open();
await modal.close();
modal.toggle();

// 3. Trigger tactile shake alert
modal.shake();

// 4. Dynamically change size
modal.setSize('3xl');

// 5. Check visibility
console.log(modal.isOpen); // true or false

// 6. Listen to lifecycle events
modal.modal.addEventListener('cge:modal:open', (e) => {
  // Can call e.preventDefault() to cancel opening!
});

modal.modal.addEventListener('cge:modal:closed', (e) => {
  console.log('Modal dismissed');
});
```

---

## 8. Common Troubleshooting & Rules

1. **Modal does not open when clicking button:**
   - Ensure the trigger button has `data-cge-modal-target="#modal-id"`.
   - Ensure `initTailTools()` was called after DOM is ready.
2. **Backdrop layout shift:**
   - `CGEModal` calculates scrollbar width on open and compensates body padding before adding `overflow-hidden`. Do not add custom conflicting body overflow styles.
3. **Focus trap not focusing input:**
   - Add `autofocus` or `data-cge-modal-autofocus` to the desired `<input>` element inside the dialog card.
4. **Animation flickering:**
   - If using `animationDriver: 'tailwind-animations'`, ensure `@import "tailwind-animations";` is loaded in your CSS bundle.
