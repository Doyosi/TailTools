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
    <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/40 backdrop-blur-sm" data-cge-modal-backdrop></div>

    <!-- Dialog Card -->
    <div class="cge-modal-dialog cge-modal-surface cge-modal-dark relative z-10 w-full rounded-sm" data-cge-modal-dialog>
        <div class="cge-modal-header">
            <h3 id="modal-title" class="cge-modal-title">Hello World</h3>
            <button type="button" data-cge-modal-close class="cge-modal-close rounded-sm" aria-label="Close"><svg class="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div class="cge-modal-body">
            Welcome to CGEModal with Tailwind CSS v4!
        </div>
        <div class="cge-modal-footer">
            <button type="button" data-cge-modal-close class="cge-modal-action cge-modal-action-secondary rounded-sm">
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

## Compact surface (2026-10-05)

Use `cge-modal-surface` on the dialog and `cge-modal-header`, `cge-modal-body`, `cge-modal-footer` for its slots. The surface defaults to light; add `cge-modal-dark` for dark colors (`cge-modal-light` is an explicit light marker). This is a markup/CSS choice, not a JavaScript theme option. Keep `rounded-sm`; all built-in compact controls use `var(--radius-sm, 0.25rem)`.

Header/body spacing is 16 px on mobile and 20 px on desktop; titles are 16 px and body text 13 px. Footer spacing is 12 px vertically. Actions are at least 32 px high, or 36 px below 640 px; close targets are 32 px. Long labels wrap. The body scrolls within a viewport-bounded surface while header/footer remain visible. A form wrapping all slots must use `cge-modal-layout`; a submit button must not carry `data-cge-modal-close` (close after successful submission).

Use `cge-modal-action` for sizing and add your Tailwind color classes; `cge-modal-action-secondary` provides a theme-aware neutral action. `cge-modal-close`, `cge-modal-input` and `cge-modal-description` are optional. Existing consumer markup without these surface/slot classes keeps its own styling. Public options, sizing presets, events and declarations are unchanged. Import the plugin stylesheet or `tailtools/style.css`.
