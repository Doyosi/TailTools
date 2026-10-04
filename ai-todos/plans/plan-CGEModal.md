# Technical Plan: CGEModal Plugin

**Plugin:** `CGEModal`  
**Package:** `tailtools`  
**Target Environment:** Tailwind CSS v4.3+, Native JavaScript (ES2022+), TypeScript, Laravel Blade & Vite  
**Status:** In Progress  

---

## 1. Executive Summary & Objective

`CGEModal` is a lightweight, dependency-free, high-performance modal/dialog plugin designed for Tailwind CSS v4.3+ and Laravel Blade. It bridges the gap between clean declarative HTML attributes (`data-cge-modal-*`) and an expressive programmatic JavaScript API (`new CGEModal(...)`).

### Key Capabilities:
1. **Dual-Mode Animation Pipeline:**
   - **Mode A (Tailwind Animations):** Native CSS utility integration with `@import "tailwind-animations"` (e.g., `animate-fade-in`, `animate-zoom-in`, `animate-slide-up`, `animate-zoom-out`, `animate-fade-out`).
   - **Mode B (Standard Fallback):** Zero-dependency Tailwind v4 transition classes using opacity and scale transforms (`transition-all duration-200 opacity-0 scale-95 -> opacity-100 scale-100`).
2. **Static Backdrop & Tactile Shake Effect:**
   - When configured with `backdrop: 'static'` or `backdropClose: false`, outside clicks and restricted keys reject dismissal by triggering a haptic shake animation (`animate-shake` or custom fallback `@keyframes cge-modal-shake`) on the dialog container and firing a `cge:modal:shake` event.
3. **Responsive Sizing Presets:**
   - First-class support for `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `full`, plus custom responsive width modifiers via `data-cge-size` or `setSize()`.
4. **Comprehensive Accessibility (a11y) & Focus Management:**
   - Focus trap cycling using `Tab` and `Shift + Tab` over interactive elements.
   - Initial focus placement (autofocus element or modal dialog).
   - Prior active element restoration upon dismissal.
   - Background scroll lock (`overflow-hidden` toggle with layout shift prevention).
   - Strict ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-hidden="true/false"`, `aria-labelledby`, `aria-describedby`).
5. **Laravel Blade & Vite Synergy:**
   - Declarative data attributes (`data-cge-modal-target`, `data-cge-modal-close`, `data-cge-backdrop`, `data-cge-animation`).
   - Ready-to-use `<x-cge-modal>` Blade component template.

---

## 2. API Specification

### 2.1 Constructor & Options
```typescript
const modal = new CGEModal('#myModal', options);
```

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `backdrop` | `boolean \| 'static'` | `true` | If `true`, clicking backdrop closes modal. If `'static'`, outside clicks shake dialog. If `false`, no backdrop dismissal. |
| `backdropClose` | `boolean` | `true` | Shorthand alias for backdrop closing behavior. |
| `escapeClose` | `boolean` | `true` | Closes modal on `Escape` key. If `false` and static, triggers shake. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| '5xl' \| 'full' \| string` | `'lg'` | Dialog width preset or custom Tailwind max-width class. |
| `animationDriver`| `'auto' \| 'tailwind-animations' \| 'css' \| 'none'` | `'auto'` | Selects animation strategy. |
| `animation` | `'zoom' \| 'fade' \| 'slide-up' \| 'slide-down' \| string` | `'zoom'` | Entry/exit animation preset. |
| `focusTrap` | `boolean` | `true` | Locks Tab key navigation inside the modal. |
| `autoFocus` | `boolean \| string` | `true` | Focuses first interactive element or selector on open. |
| `restoreFocus` | `boolean` | `true` | Returns focus to trigger element after close. |
| `lockScroll` | `boolean` | `true` | Prevents background document scrolling while open. |
| `duration` | `number` | `250` | Animation transition duration in ms for cleanup timers. |

### 2.2 Public Methods
- `modal.open()`: Opens the modal dialog, activates focus trap, locks scroll, and dispatches `cge:modal:open` and `cge:modal:opened`.
- `modal.close()`: Closes the modal, performs exit animation, unlocks scroll, restores focus, and dispatches `cge:modal:close` and `cge:modal:closed`.
- `modal.toggle()`: Toggles current modal visibility state.
- `modal.shake()`: Triggers tactile shake animation on dialog card and dispatches `cge:modal:shake`.
- `modal.setSize(newSize)`: Updates size preset dynamically.
- `modal.isOpen`: Getter returning boolean visibility state.
- `modal.destroy()`: Cleans up listeners, removes mutation observers, unlocks body scroll, and de-registers instance.

### 2.3 Static Methods
- `CGEModal.getInstance(target)`: Retrieves existing instance attached to DOM node.
- `CGEModal.getOrCreateInstance(target, options)`: Returns existing instance or creates a new one.
- `CGEModal.init(root)`: Scans DOM for `[data-cge-modal]` elements and triggers and binds them.
- `CGEModal.closeAll()`: Closes any currently opened CGEModal instances.

### 2.4 Custom Events
- `cge:modal:open` (Cancelable via `event.preventDefault()`)
- `cge:modal:opened`
- `cge:modal:close` (Cancelable via `event.preventDefault()`)
- `cge:modal:closed`
- `cge:modal:shake`

---

## 3. DOM & Data Attribute Architecture

### 3.1 Modal HTML Markup
```html
<div id="demoModal"
     class="cge-modal fixed inset-0 z-50 hidden overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center"
     role="dialog"
     aria-modal="true"
     aria-hidden="true"
     data-cge-size="lg"
     data-cge-backdrop="true">
  
  <!-- Backdrop Overlay -->
  <div class="cge-modal-backdrop fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity" data-cge-modal-backdrop></div>

  <!-- Dialog Card -->
  <div class="cge-modal-dialog relative z-10 w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100" data-cge-modal-dialog>
    <!-- Close Button -->
    <button type="button" data-cge-modal-close class="absolute top-4 right-4 text-slate-400 hover:text-white" aria-label="Close modal">
      <svg ...></svg>
    </button>
    <h3 class="text-xl font-bold">Modal Title</h3>
    <div class="mt-4">Content here</div>
  </div>
</div>
```

### 3.2 Trigger Buttons
```html
<button type="button" data-cge-modal-target="#demoModal" class="btn">Open Modal</button>
```

---

## 4. Implementation Steps & Milestones

1. **Plan & Checklist Generation:** Author technical plan and phase checklist.
2. **Core Implementation (`plugins/CGEModal/CGEModal.js`):**
   - Class construction, options parsing, data attribute extraction.
   - Animation manager (Tailwind-animations vs. standard CSS transition fallback).
   - Static backdrop click interception & shake triggering.
   - Focus trap logic (`keydown` Tab navigation loop).
   - Lifecycle event dispatchers and teardown.
3. **TypeScript Typings (`plugins/CGEModal/CGEModal.d.ts`):** Complete interfaces for options, methods, events.
4. **Plugin Styles (`plugins/CGEModal/style.css`):**
   - Base display & visibility utilities.
   - Fallback `@keyframes cge-modal-shake`.
   - Size presets map.
5. **Barrel Export (`plugins/CGEModal/index.js`) & Library Integration (`src/index.ts`):**
   - Re-export `CGEModal`.
   - Wire declarative trigger discovery into `initTailTools()`.
6. **Testing & Validation (`index.html`):**
   - Basic modal with standard transitions.
   - Animated modal using `tailwind-animations`.
   - Static backdrop with shake-on-outside-click test.
   - Form modal with interactive inputs for focus trap test.
   - Sizing presets array.
7. **Documentation Suite (`docs/CGEModal/`):**
   - `README.md`, `usage.md`, `laravel-blade.md`, `examples.md`, `api.md`.
   - Update `docs/installing.md`, `docs/developing.md`, `docs/versioning.md`.
8. **AI Consumer Skill:**
   - `.agents/skills/cge-modal-skill.md` and `.agents/skills/cge-modal/SKILL.md`.
