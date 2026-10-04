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
    <div class="cge-modal-dialog relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-sm" data-cge-modal-dialog>
      <h3 class="text-lg font-bold">Simple Dialog</h3>
      <p class="text-sm text-slate-400 mt-2">Zero-configuration modal with built-in Tailwind transitions.</p>
      <div class="mt-4 flex justify-end">
        <button type="button" data-cge-modal-close class="px-4 py-2 bg-slate-800 rounded-sm text-sm">Close</button>
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
  
  <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-md" data-cge-modal-backdrop></div>

  <div class="cge-modal-dialog relative z-10 w-full rounded-sm bg-slate-900 border border-indigo-500/30 p-6 shadow-2xl" data-cge-modal-dialog>
    <div class="flex justify-between items-center pb-3 border-b border-slate-800">
      <h3 class="text-lg font-bold text-indigo-400">Slide Up Animation</h3>
      <button type="button" data-cge-modal-close class="text-slate-400 hover:text-white">✕</button>
    </div>
    <p class="py-4 text-sm text-slate-300">
      Enters using <code>animate-slide-in-bottom</code> and exits using <code>animate-slide-out-bottom</code>!
    </p>
    <div class="pt-3 border-t border-slate-800 flex justify-end">
      <button type="button" data-cge-modal-close class="px-4 py-2 bg-indigo-600 text-white rounded-sm text-xs">
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
  <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-sm" data-cge-modal-backdrop></div>
  <div class="cge-modal-dialog relative z-10 w-full rounded-sm bg-slate-900 border border-slate-800 p-8 text-white shadow-2xl" data-cge-modal-dialog>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">Step 1 of 3: Workspace Profile</h2>
      <button type="button" data-cge-modal-close class="text-slate-400 hover:text-white">✕</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Workspace Name</label>
        <input type="text" autofocus class="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-indigo-500">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Organization URL</label>
        <input type="text" class="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-indigo-500">
      </div>
    </div>
    <div class="mt-8 pt-4 border-t border-slate-800 flex justify-between">
      <button type="button" data-cge-modal-close class="px-4 py-2 text-slate-400 text-sm">Cancel</button>
      <button type="button" class="px-6 py-2 bg-indigo-600 rounded-sm text-sm font-medium hover:bg-indigo-500">Next Step →</button>
    </div>
  </div>
</div>
```
