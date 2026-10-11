# CGEAccordion Usage Guide

Complete reference for configuration options, programmatic instance methods, lifecycle events, and headless UI theming for `CGEAccordion` and `CGECollapse`.

---

## Configuration Options

Pass options as a JavaScript object into `new CGEAccordion(element, options)` or via declarative `data-cge-*` HTML attributes on the container element.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `exclusive` | `boolean` | `true` | When `true`, opening one item collapses sibling items in the same container. |
| `alwaysOpen` | `boolean` | `false` | When `true`, prevents closing the active item if it is the only one currently open. |
| `defaultOpen` | `string \| string[] \| null` | `null` | Item ID or array of item IDs to expand initially on page load. |
| `urlSync` | `'hash' \| false` | `'hash'` | Enables deep linking via URL hash (e.g. `#billing`). Automatically expands matching item on load or `hashchange`. |
| `updateHash` | `boolean` | `false` | When `true`, toggling an item updates `window.location.hash` without scrolling. |
| `scrollIntoView` | `boolean` | `false` | When `true`, smoothly scrolls the target item into view upon deep-link activation. |
| `storage` | `'localStorage' \| 'sessionStorage' \| false` | `false` | Persists open item IDs across page reloads in browser web storage. |
| `storageKey` | `string \| null` | `null` | Storage key name. Defaults to `cge_accordion_${id}`. |
| `duration` | `number` | `300` | Transition duration in milliseconds. |
| `animation` | `string \| false` | `false` | Optional additional animation class (e.g. `animate-fade-in` from `tailwind-animations`). |
| `keyboard` | `boolean` | `true` | Enables WAI-ARIA compliant arrow key navigation (`ArrowDown`, `ArrowUp`, `Home`, `End`). |
| `onOpen` | `Function` | `null` | Callback fired when an item opens: `(itemId, itemEl) => void`. |
| `onClose` | `Function` | `null` | Callback fired when an item closes: `(itemId, itemEl) => void`. |
| `onToggle` | `Function` | `null` | Callback fired on open/close: `(itemId, isOpen, itemEl) => void`. |
| `ui` | `Object` | See below | Slot class dictionary for headless styling. |

---

## Headless UI Theming (`ui`)

Customize any structural slot using modern Tailwind CSS v4 utility classes:

```javascript
const acc = new CGEAccordion('#faq', {
  ui: {
    item: 'border-b border-zinc-200 dark:border-zinc-800 transition-colors',
    trigger: 'flex justify-between items-center w-full py-4 text-left font-medium text-zinc-900 dark:text-zinc-100 hover:text-primary-600 transition-colors cursor-pointer',
    activeTrigger: 'text-primary-600 dark:text-primary-400 font-semibold',
    icon: 'w-4 h-4 transition-transform duration-300',
    activeIcon: 'rotate-180',
    wrapper: 'grid grid-rows-[0fr] transition-all duration-300 ease-out',
    activeWrapper: 'grid-rows-[1fr]',
    content: 'overflow-hidden min-h-0 text-sm text-zinc-600 dark:text-zinc-400 py-0',
    activeContent: 'pb-4'
  }
});
```

---

## Programmatic Instance API (`CGEAccordion`)

### Instance Methods

```javascript
const acc = new CGEAccordion('#my-accordion');

// Open a specific item by its data-cge-item ID or element ID
acc.open('item-1');

// Close a specific item
acc.close('item-1');

// Toggle item state
acc.toggle('item-1');

// Open all items (in non-exclusive mode)
acc.openAll();

// Close all items (respects alwaysOpen)
acc.closeAll();

// Check if an item is open
const isOpen = acc.isOpen('item-1'); // true | false

// Retrieve all direct item descriptors
const items = acc.getItems();

// Retrieve specific item descriptor
const item = acc.getItem('item-1');
// { id: 'item-1', el: HTMLElement, trigger: HTMLElement, wrapper: HTMLElement, content: HTMLElement, icon: HTMLElement, isOpen: boolean }

// Destroy instance and release listeners
acc.destroy();
```

### Static Methods

```javascript
import { CGEAccordion } from 'tailtools';

// Auto-initialize all [data-cge-accordion] containers; returns every instance (new and existing)
const all = CGEAccordion.init();

// Scope auto-initialization to a specific container (safe to repeat after DOM updates:
// detached instances are destroyed, Livewire-morphed ones are rebuilt)
CGEAccordion.init(document.querySelector('#sidebar'));

// Retrieve existing instance by element or selector (null when unknown)
const instance = CGEAccordion.get('#faq-accordion');

// Destroy every accordion inside a region (or detached from the DOM)
CGEAccordion.destroyAll(document.querySelector('#sidebar'));
CGECollapse.destroyAll(document.querySelector('#sidebar'));
```

---

## Events & Callbacks

### Instance Event Subscription (`on` / `off`)

```javascript
const acc = new CGEAccordion('#faq');

acc.on('open', ({ itemId, itemEl }) => {
  console.log('Opened item:', itemId);
});

acc.on('close', ({ itemId, itemEl }) => {
  console.log('Closed item:', itemId);
});

acc.on('toggle', ({ itemId, isOpen, itemEl }) => {
  console.log(`Item ${itemId} toggled. Open: ${isOpen}`);
});
```

### DOM CustomEvents

All state transitions dispatch native DOM CustomEvents that bubble up the DOM tree:

| Event Name | Dispatched On | Payload (`e.detail`) | Description |
| :--- | :--- | :--- | :--- |
| `cge:accordion:open` | Container & Item | `{ instance, itemId, itemEl, isOpen: true }` | Fired when an item expands. |
| `cge:accordion:close` | Container & Item | `{ instance, itemId, itemEl, isOpen: false }` | Fired when an item collapses. |
| `cge:accordion:toggle` | Container & Item | `{ instance, itemId, itemEl, isOpen }` | Fired whenever an item toggles. |
| `cge:accordion:destroy` | Container | `{ instance, id }` | Fired upon instance destruction. |

```javascript
document.addEventListener('cge:accordion:open', (e) => {
  console.log('Accordion item opened:', e.detail.itemId);
});
```

---

## Standalone CGECollapse Usage

For isolated collapsible panels without a parent accordion container:

```javascript
import { CGECollapse } from 'tailtools';

// Target can be the trigger button or the collapsible panel
const collapse = new CGECollapse('#panel-wrapper', {
  defaultOpen: false,
  duration: 300,
  storage: 'localStorage',
  storageKey: 'user_filter_panel'
});

// Methods:
collapse.open();
collapse.close();
collapse.toggle();
collapse.isOpen();
collapse.destroy();

// Event listeners:
collapse.on('toggle', ({ isOpen }) => {
  console.log('Collapse toggled:', isOpen);
});

// Static initialization (returns every collapse under root):
CGECollapse.init();
```


## State and lifecycle details
Options resolve as defaults → data attributes → explicit JavaScript options. Initial Accordion state resolves from a matching decoded hash, persisted array (including an empty array), `defaultOpen` and DOM markup. Invalid IDs are filtered before enforcing `exclusive`/`alwaysOpen`. `data-cge-open="false"` does not mark an item open. `updateHash` writes an encoded hash on opening and preserves `history.state`.

`keyboard: false` disables directional navigation; Enter/Space still activate non-button controls. Native buttons without a type become `type="button"` for form safety. Storage read/write failures are ignored. Use stable container IDs or an explicit `storageKey` to persist across page reloads.

`CGECollapse.triggers` lists all controls for the panel; `trigger` remains the first control. `init(root)` includes a matching trigger root and skips missing targets. Direct construction with an unresolved target throws a clear error. Collapse accepts `data-cge-default-open`, `data-cge-duration`, `data-cge-storage` and `data-cge-storage-key` on the construction target; explicit JS options override them. Initial open markup includes `grid-rows-[1fr]` or `aria-expanded="true"`. Its duration, animation, storage and DOM restoration behave like Accordion. A newly inserted control can be bound by calling `CGECollapse.init(newControl)`. Collapses placed inside accordion bodies are initialized; only controls that are an accordion item's own trigger are skipped. `cge:collapse:open|close|toggle` is dispatched once on the panel and bubbles, so a document listener receives each transition exactly once.

Lifecycle callbacks may destroy their instance. Opening a sibling stops if a close callback destroys the accordion; Collapse stops after callback-driven destroy and preserves the restored DOM.

## Triggers with nested controls

Clicks on a `button`, `a`, `input`, `select`, `textarea` or any `[data-cge-no-toggle]` element nested inside an accordion trigger (or a non-button Collapse trigger) keep their own behavior and do not toggle the item:

```html
<div data-cge-trigger tabindex="0" class="flex justify-between">
  <span>Invoice #42</span>
  <button type="button" onclick="editInvoice(42)">Edit</button>
  <span data-cge-no-toggle title="Info">i</span>
</div>
```

## Keyboard and motion

Arrow Up/Down, Home and End move focus between enabled triggers; Enter/Space toggle non-button triggers. Key presses with Alt, Ctrl or Meta are ignored. With `prefers-reduced-motion: reduce` the stylesheet removes transitions, the optional `animation` class is not added and `scrollIntoView` jumps instead of scrolling smoothly.

## Livewire, Turbo and dynamic DOM

`tailtools/auto` calls `initTailTools()` on `livewire:navigated`, after Livewire commits and on `turbo:load`; `CGEAccordion.init()` / `CGECollapse.init()` then destroy detached instances (no leaked `hashchange` listeners) and rebuild instances whose attributes were reset by a morph. A rebuilt accordion resolves its open items again (hash → storage → `defaultOpen` → markup). Wrap groups in `wire:ignore` when the client-side open state must survive component updates.
