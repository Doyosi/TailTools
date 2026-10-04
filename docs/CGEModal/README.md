# CGEModal - Native Tailwind CSS v4 & Laravel Modal Plugin

`CGEModal` is a high-performance, accessible native JavaScript modal dialog plugin created specifically for **Tailwind CSS v4.3+** and **Laravel Blade** environments. It pairs zero-dependency Vanilla JavaScript with full TypeScript support, dual-mode CSS animations, tactile static backdrop alerts, and robust focus management.

---

## Key Features

- **Dual-Mode Animation Pipeline:**
  - **Mode A (`tailwind-animations`):** Native hardware-accelerated animations using Midudev's `tailwind-animations` utilities (`animate-fade-in`, `animate-zoom-in`, `animate-slide-up`, `animate-zoom-out`).
  - **Mode B (Standard Tailwind Transitions):** Smooth fallback using standard utility classes (`opacity-0 scale-95` to `opacity-100 scale-100`).
- **Static Backdrop & Tactile Shake Effect:** When configured with `backdrop: 'static'` or `data-cge-backdrop="static"`, clicks outside the modal or restricted keyboard presses trigger a tactile shake animation (`animate-shake` or `@keyframes cge-modal-shake`) to alert the user.
- **Full Sizing Presets Matrix:** Out-of-the-box support for `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, and `full` presets.
- **Strict Accessibility (a11y):** Built-in Tab navigation focus trapping, autofocus support, scroll locking with layout shift compensation, and prior focus restoration.
- **Laravel Blade Ready:** Declarative markup API (`data-cge-modal-target`, `data-cge-modal-close`, `data-cge-backdrop`) for effortless integration into Blade templates.

---

## Sizing Matrix

| Preset | Max Width | Target Use Case |
| :--- | :--- | :--- |
| `xs` | `max-w-xs` (320px) | Alerts, micro-prompts, PIN/OTP inputs |
| `sm` | `max-w-sm` (384px) | Confirmation dialogues, single-field forms |
| `md` | `max-w-md` (448px) | Authentication modals, short survey cards |
| `lg` (Default) | `max-w-lg` (512px) | Standard content dialogues, profile edit forms |
| `xl` | `max-w-xl` (576px) | Multi-column forms, checkout previews |
| `2xl` | `max-w-2xl` (672px) | Data tables, media previews, wizards |
| `3xl` | `max-w-3xl` (768px) | Rich text editors, dashboard drawers |
| `4xl` | `max-w-4xl` (896px) | Split-view dialogues, file managers |
| `5xl` | `max-w-5xl` (1024px) | Large data sheets, analytics modals |
| `full` | `max-w-full` (100%) | Full-screen applications, document viewers |

---

## Quick Start

### 1. Stylesheet Setup (Tailwind CSS v4)
In your main CSS file (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGEModal stylesheet */
@import "tailtools/plugins/CGEModal/style.css";
```

### 2. Declarative HTML / Blade Markup

```html
<!-- Trigger Button -->
<button type="button" 
        data-cge-modal-target="#my-modal" 
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-sm font-medium">
    Open Modal
</button>

<!-- Modal Container -->
<div id="my-modal"
     class="cge-modal fixed inset-0 z-50 hidden items-center justify-center p-4 overflow-y-auto"
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title"
     data-cge-size="md">
    
    <!-- Backdrop Overlay -->
    <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/75 backdrop-blur-sm" data-cge-modal-backdrop></div>

    <!-- Dialog Card -->
    <div class="cge-modal-dialog relative z-10 w-full rounded-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100" data-cge-modal-dialog>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 id="modal-title" class="text-lg font-bold">Hello World</h3>
            <button type="button" data-cge-modal-close class="text-slate-400 hover:text-white" aria-label="Close">✕</button>
        </div>
        <div class="py-4 text-sm text-slate-300">
            Welcome to CGEModal with Tailwind CSS v4!
        </div>
        <div class="pt-3 border-t border-slate-800 flex justify-end">
            <button type="button" data-cge-modal-close class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-xs">
                Close
            </button>
        </div>
    </div>
</div>
```

### 3. JavaScript Initialization

```javascript
import { initTailTools } from 'tailtools';

// Automatically initializes all modals and trigger buttons on DOM load
initTailTools();
```

Or initialize programmatically:

```javascript
import { CGEModal } from 'tailtools';

const modal = new CGEModal('#my-modal', {
  size: 'lg',
  backdrop: 'static',
  animationDriver: 'tailwind-animations',
});

// Programmatic control
modal.open();
```

---

## Documentation Links

- [Usage & Configuration Guide](usage.md)
- [Laravel Blade Integration](laravel-blade.md)
- [Code Examples](examples.md)
- [TypeScript API Reference](api.md)

## Extended maintenance contract (2026-10-04)

Destroy cancels animation frames/timers and settles pending animation promises. Modal, Drawer, Alert and Lightbox share body scroll, focus and stacking ownership. Only the top overlay handles keyboard events. Nested init roots process each trigger click once.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
