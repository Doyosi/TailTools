# CGEModal Usage Guide

Complete reference for options, methods, events, and declarative data attributes for `CGEModal`.

---

## 1. Options Reference

Options can be supplied via the constructor `new CGEModal(target, options)` or via declarative `data-cge-*` HTML attributes on the modal root element.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `backdrop` | `boolean \| 'static'` | `true` | `true`: Clicking backdrop closes modal.<br>`'static'`: Clicking outside shakes dialog.<br>`false`: Backdrop click ignored. |
| `backdropClose` | `boolean` | `true` | Boolean alias for backdrop dismissal. If `false`, outside clicks trigger shake. |
| `escapeClose` | `boolean` | `true` | Whether pressing the <kbd>Escape</kbd> key dismisses the modal. If `false` and static, triggers shake. |
| `size` | `CGEModalSize` | `'lg'` | Sizing preset (`'xs'` through `'5xl'`, `'full'`) or custom Tailwind max-width class. |
| `animationDriver`| `'auto' \| 'tailwind-animations' \| 'css' \| 'none'` | `'auto'` | Engine used for transitions. Auto-detects `tailwind-animations` if available, falls back to CSS utilities. |
| `animation` | `string` | `'zoom'` | Animation preset name: `'zoom'`, `'fade'`, `'slide-up'`, `'slide-down'`, or custom utility class. |
| `focusTrap` | `boolean` | `true` | Traps <kbd>Tab</kbd> and <kbd>Shift+Tab</kbd> keyboard focus inside the modal dialog. |
| `autoFocus` | `boolean \| string` | `true` | Focuses the first interactive element or selector matching this string upon opening. |
| `restoreFocus` | `boolean` | `true` | Returns browser focus to the element that triggered the modal upon dismissal. |
| `lockScroll` | `boolean` | `true` | Prevents document body scrolling while open and compensates for scrollbar layout shift. |
| `duration` | `number` | `250` | Transition duration in milliseconds for animation cleanup timers. |

---

## 2. Declarative Data Attributes

Configure modals and triggers purely in HTML or Blade markup without writing custom JavaScript:

| Attribute | Applied To | Description | Example |
| :--- | :--- | :--- | :--- |
| `data-cge-modal-target` | Trigger Button | Selector of modal to open/toggle | `data-cge-modal-target="#user-modal"` |
| `data-cge-target` | Trigger Button | Universal target attribute | `data-cge-target="#user-modal"` |
| `data-cge-modal-close` | Button / Element | Closes the ancestor or targeted modal | `<button data-cge-modal-close>` |
| `data-cge-modal-dialog` | Inner Container | Marks the dialog card element | `<div data-cge-modal-dialog>` |
| `data-cge-modal-backdrop` | Backdrop Overlay| Marks the backdrop overlay element | `<div data-cge-modal-backdrop>` |
| `data-cge-backdrop` | Modal Root | Backdrop behavior (`true`, `false`, `static`) | `data-cge-backdrop="static"` |
| `data-cge-size` | Modal Root | Sizing preset key | `data-cge-size="2xl"` |
| `data-cge-animation-driver` | Modal Root | Animation driver (`tailwind-animations` / `css`) | `data-cge-animation-driver="tailwind-animations"` |
| `data-cge-animation` | Modal Root | Preset animation name | `data-cge-animation="slide-up"` |
| `data-cge-escape-close` | Modal Root | Escape key behavior (`true` / `false`) | `data-cge-escape-close="false"` |
| `data-cge-autofocus` | Modal Root | Autofocus mode or element selector | `data-cge-autofocus="input[name='email']"` |

---

## 3. Instance Methods

### `modal.open(triggerElement?: HTMLElement): Promise<boolean>`
Opens the modal dialog, locks scroll, initiates entry animations, and shifts focus. Returns `true` if opened, or `false` if prevented by a `cge:modal:open` event listener.

```javascript
const modal = CGEModal.getInstance('#checkout-modal');
await modal.open();
```

### `modal.close(): Promise<boolean>`
Closes the modal dialog, initiates exit animations, restores body scroll, and returns focus to the prior trigger. Returns `true` if closed, or `false` if prevented by a `cge:modal:close` listener.

```javascript
await modal.close();
```

### `modal.toggle(triggerElement?: HTMLElement): Promise<boolean>`
Toggles the open/closed state of the modal.

```javascript
modal.toggle();
```

### `modal.shake(): void`
Triggers the tactile haptic shake animation on the dialog card and dispatches the `cge:modal:shake` event. Useful for validation errors or restricted actions.

```javascript
modal.shake();
```

### `modal.setSize(newSize: string): CGEModal`
Dynamically updates the dialog sizing preset or applies custom classes.

```javascript
modal.setSize('3xl');
```

### `modal.isOpen: boolean`
Getter indicating whether the modal is currently open.

```javascript
if (modal.isOpen) {
  console.log('Modal is active');
}
```

### `modal.destroy(): void`
Completely cleans up the instance: restores body scroll, removes all attached event listeners, resets ARIA attributes, and de-registers from the internal cache.

```javascript
modal.destroy();
```

---

## 4. Static Methods

### `CGEModal.getInstance(target: string | HTMLElement): CGEModal | undefined`
Retrieves an existing instance attached to a modal DOM node or CSS selector.

### `CGEModal.getOrCreateInstance(target: string | HTMLElement, options?: object): CGEModal`
Retrieves the existing instance, or instantiates a new one if not yet initialized.

### `CGEModal.closeAll(): void`
Closes all currently open `CGEModal` instances across the page.

### `CGEModal.init(root?: Document | HTMLElement): void`
Scans the DOM subtree for declarative `data-cge-modal-target` buttons and `.cge-modal` containers and wires their behaviors automatically.

---

## 5. Custom Event Hooks

Every CGEModal dispatches bubbling CustomEvents on its root element:

| Event Name | Cancelable | Description | Event `detail` Payload |
| :--- | :--- | :--- | :--- |
| `cge:modal:open` | **Yes** | Fired immediately before opening begins | `{ instance, modal, dialog, trigger }` |
| `cge:modal:opened` | No | Fired after opening transition completes | `{ instance, modal, dialog, trigger }` |
| `cge:modal:close` | **Yes** | Fired immediately before closing begins | `{ instance, modal, dialog }` |
| `cge:modal:closed` | No | Fired after closing transition finishes | `{ instance, modal, dialog }` |
| `cge:modal:shake` | No | Fired when shake animation triggers | `{ instance, modal, dialog }` |

### Listening to Events

```javascript
const modalEl = document.querySelector('#delete-confirm-modal');

// Intercept close if conditions are not met
modalEl.addEventListener('cge:modal:close', (event) => {
  if (hasUnsavedData()) {
    event.preventDefault(); // Cancels dismissal!
    event.detail.instance.shake(); // Alert the user
  }
});

// React after modal is opened
modalEl.addEventListener('cge:modal:opened', (event) => {
  console.log('Modal fully displayed:', event.detail.modal.id);
});
```

## Extended maintenance contract (2026-10-04)

Destroy cancels animation frames/timers and settles pending animation promises. Modal, Drawer, Alert and Lightbox share body scroll, focus and stacking ownership. Only the top overlay handles keyboard events. Nested init roots process each trigger click once.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
