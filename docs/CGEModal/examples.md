# CGEModal Examples

Practical code recipes and patterns for integrating `CGEModal` into real-world applications.

---

## 1. Minimal HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/src/style.css">
</head>
<body class="bg-slate-950 text-white p-8">

  <!-- Trigger -->
  <button type="button" data-cge-modal-target="#simple-modal" class="px-4 py-2 bg-blue-600 rounded-sm">
    Launch Modal
  </button>

  <!-- Modal -->
  <div id="simple-modal" class="cge-modal fixed inset-0 z-50 hidden items-center justify-center p-4">
    <div class="cge-modal-backdrop fixed inset-0 bg-black/60 backdrop-blur-sm" data-cge-modal-backdrop></div>
    <div class="cge-modal-dialog cge-modal-surface cge-modal-dark relative z-10 w-full rounded-sm" data-cge-modal-dialog>
      <div class="cge-modal-header"><h3 class="cge-modal-title">Simple Dialog</h3></div>
      <div class="cge-modal-body">Zero-configuration modal with built-in Tailwind transitions.</div>
      <div class="cge-modal-footer">
        <button type="button" data-cge-modal-close class="cge-modal-action cge-modal-action-secondary rounded-sm">Close</button>
      </div>
    </div>
  </div>

  <script type="module" src="/src/index.ts"></script>
</body>
</html>
```

---

## 2. Animated Modal (`tailwind-animations`)

Take full advantage of Midudev’s `@import "tailwind-animations";` for entry and exit transitions:

```html
<button type="button" data-cge-modal-target="#animated-modal" class="btn">
  Animated Modal
</button>

<div id="animated-modal" 
     class="cge-modal fixed inset-0 z-50 hidden items-center justify-center p-4"
     data-cge-animation-driver="tailwind-animations"
     data-cge-animation="slide-up"
     data-cge-size="xl">
  
  <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/40 backdrop-blur-sm" data-cge-modal-backdrop></div>

  <div class="cge-modal-dialog cge-modal-surface cge-modal-dark relative z-10 w-full rounded-sm" data-cge-modal-dialog>
    <div class="cge-modal-header">
      <h3 class="cge-modal-title">Slide Up Animation</h3>
      <button type="button" data-cge-modal-close class="cge-modal-close rounded-sm" aria-label="Close modal"><svg class="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>
    <p class="cge-modal-body">
      Enters using <code>animate-slide-in-bottom</code> and exits using <code>animate-slide-out-bottom</code>!
    </p>
    <div class="cge-modal-footer">
      <button type="button" data-cge-modal-close class="cge-modal-action rounded-sm bg-indigo-600 text-white">
        Done
      </button>
    </div>
  </div>
</div>
```

---

## 3. Dynamic Programmatic Modal Creation

Create and manage modals on-the-fly using JavaScript:

```javascript
import { CGEModal } from 'tailtools';

// Target an existing element
const modal = new CGEModal('#my-dynamic-modal', {
  size: '2xl',
  backdrop: 'static',
  escapeClose: false,
  autoFocus: true,
  restoreFocus: true
});

// Open modal
await modal.open();

// Dynamically change size
modal.setSize('4xl');

// Shake the dialog card (e.g., failed form validation)
modal.shake();

// Listen to lifecycle events
modal.modal.addEventListener('cge:modal:closed', () => {
  console.log('User closed modal');
});
```

---

## 4. Multi-Step Wizard Modal

Focus trap ensures keyboard navigation cycles cleanly between step inputs:

```html
<div id="wizard-modal" class="cge-modal fixed inset-0 z-50 hidden items-center justify-center p-4" data-cge-size="2xl">
  <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/40 backdrop-blur-sm" data-cge-modal-backdrop></div>
  <div class="cge-modal-dialog cge-modal-surface cge-modal-dark relative z-10 w-full rounded-sm" data-cge-modal-dialog>
    <div class="cge-modal-header">
      <h2 class="cge-modal-title">Step 1 of 3: Workspace Profile</h2>
      <button type="button" data-cge-modal-close class="cge-modal-close rounded-sm" aria-label="Close modal"><svg class="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>
    <div class="cge-modal-body space-y-4">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Workspace Name</label>
        <input type="text" autofocus class="cge-modal-input rounded-sm">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Organization URL</label>
        <input type="text" class="cge-modal-input rounded-sm">
      </div>
    </div>
    <div class="cge-modal-footer">
      <button type="button" data-cge-modal-close class="cge-modal-action cge-modal-action-secondary rounded-sm">Cancel</button>
      <button type="button" class="cge-modal-action rounded-sm bg-indigo-600 text-white hover:bg-indigo-500">Next Step →</button>
    </div>
  </div>
</div>
```

## Extended maintenance contract (2026-10-04)

Destroy cancels animation frames/timers and settles pending animation promises. Modal, Drawer, Alert and Lightbox share body scroll, focus and stacking ownership. Only the top overlay handles keyboard events. Nested init roots process each trigger click once.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

```javascript
await modal.open(trigger);
await drawer.open();
await drawer.close(); // modal retains its scroll/focus ownership
await modal.close();
```

## Compact surface (2026-10-05)

Use `cge-modal-surface` on the dialog and `cge-modal-header`, `cge-modal-body`, `cge-modal-footer` for its slots. The surface defaults to light; add `cge-modal-dark` for dark colors (`cge-modal-light` is an explicit light marker). This is a markup/CSS choice, not a JavaScript theme option. Keep `rounded-sm`; all built-in compact controls use `var(--radius-sm, 0.25rem)`.

Header/body spacing is 16 px on mobile and 20 px on desktop; titles are 16 px and body text 13 px. Footer spacing is 12 px vertically. Actions are at least 32 px high, or 36 px below 640 px; close targets are 32 px. Long labels wrap. The body scrolls within a viewport-bounded surface while header/footer remain visible. A form wrapping all slots must use `cge-modal-layout`; a submit button must not carry `data-cge-modal-close` (close after successful submission).

Use `cge-modal-action` for sizing and add your Tailwind color classes; `cge-modal-action-secondary` provides a theme-aware neutral action. `cge-modal-close`, `cge-modal-input` and `cge-modal-description` are optional. Existing consumer markup without these surface/slot classes keeps its own styling. Public options, sizing presets, events and declarations are unchanged. Import the plugin stylesheet or `tailtools/style.css`.
