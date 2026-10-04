# CGEDrawer - Usage Guide

Comprehensive documentation for options, data attributes, instance methods, static controls, events, and gestures in **CGEDrawer**.

---

## Configuration Options

When creating a new instance (`new CGEDrawer(target, options)`), you can customize the following parameters:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `placement` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'left'` | Edge of the viewport where the drawer originates. |
| `size` | `string` | `'md'` | Sizing preset (`sm`, `md`, `lg`, `xl`, `full`, `auto`) or custom Tailwind class (e.g. `w-96`, `max-w-md`). |
| `backdrop` | `boolean \| 'static'` | `true` | Display modal backdrop overlay. Set to `false` for persistent non-modal docking. |
| `backdropClose` | `boolean` | `true` | Close drawer when clicking backdrop. If `false`, outside clicks trigger tactile directional bounce feedback. |
| `escapeClose` | `boolean` | `true` | Close drawer when pressing the `Escape` key. |
| `animationDriver` | `'auto' \| 'tailwind-animations' \| 'css' \| 'none'` | `'auto'` | Preferred animation engine. In `'auto'`, auto-detects `tailwind-animations`. |
| `swipeClose` | `boolean` | `true` | Enable real-time touch swipe-to-dismiss gesture tracking. |
| `swipeThreshold` | `number` | `0.3` | Ratio of drawer dimension (0.0 to 1.0) or velocity (> 0.45px/ms) required to snap shut. |
| `pushContentSelector` | `string \| HTMLElement \| null` | `null` | Target element to push aside along the drawer's orientation axis when opened. |
| `mini` | `boolean` | `false` | Enable collapsed mini-dock rail mode instead of hiding completely offscreen. |
| `miniWidth` | `string` | `'w-16'` | Tailwind width class applied when collapsed in mini mode. |
| `lockScroll` | `boolean` | `true` | Lock document body scroll while modal drawer is active (with scrollbar-gutter compensation). |
| `focusTrap` | `boolean` | `true` | Trap `Tab` and `Shift+Tab` keyboard navigation within the drawer dialog. |
| `autoFocus` | `boolean \| string` | `true` | Autofocus first actionable element or target selector on open. |
| `restoreFocus` | `boolean` | `true` | Return focus to the trigger button that opened the drawer. |
| `duration` | `number` | `300` | Transition duration in milliseconds. |
| `translations` | `Object` | `{ ... }` | Localization dictionary for screen readers and labels. |

---

## Declarative HTML Data Attributes

All configuration options can be specified directly in HTML or Laravel Blade markup via `data-cge-*` attributes:

| Attribute | Accepted Values | Description |
| :--- | :--- | :--- |
| `data-cge-placement` | `left`, `right`, `top`, `bottom` | Directional screen placement. |
| `data-cge-size` | `sm`, `md`, `lg`, `xl`, `full`, `auto`, `w-*`, `h-*` | Sizing preset or utility class. |
| `data-cge-backdrop` | `true`, `false`, `static` | Backdrop behavior. |
| `data-cge-backdrop-close` | `true`, `false` | Close on backdrop click. |
| `data-cge-escape-close` | `true`, `false` | Close on Escape key press. |
| `data-cge-animation-driver` | `auto`, `tailwind-animations`, `css`, `none` | Animation driver. |
| `data-cge-swipe-close` | `true`, `false` | Touch swipe-to-dismiss gesture. |
| `data-cge-push-content` | `#selector`, `.selector` | Element to push on open. |
| `data-cge-mini` | `true`, `false` | Mini dock rail mode. |
| `data-cge-mini-width` | `w-16`, `w-20` | Collapsed width class. |
| `data-cge-drawer-target` | `#drawer-id`, `drawer-id` | Click trigger to open target drawer. |
| `data-cge-drawer-close` | None | Click trigger to close active drawer. |
| `data-cge-drawer-toggle` | `#drawer-id`, `drawer-id` | Click trigger to toggle target drawer. |

---

## Static Methods

The `CGEDrawer` class exposes static helper methods for global control:

### `CGEDrawer.init(root = document)`
Discovers all declarative drawers in `root` and binds global click delegation for `[data-cge-drawer-target]`, `[data-cge-drawer-close]`, and `[data-cge-drawer-toggle]`.

### `CGEDrawer.get(target)`
Retrieves an existing instance by ID, selector, or DOM element.
```javascript
const drawer = CGEDrawer.get('#my-drawer');
```

### `CGEDrawer.open(target, options = {})`
Retrieves or instantiates the drawer and opens it.
```javascript
await CGEDrawer.open('#my-drawer');
```

### `CGEDrawer.close(target)`
Closes the drawer instance.
```javascript
await CGEDrawer.close('#my-drawer');
```

### `CGEDrawer.toggle(target, options = {})`
Toggles between open and closed states.
```javascript
await CGEDrawer.toggle('#my-drawer');
```

### `CGEDrawer.setTranslations(dictionary)`
Updates global default translations.
```javascript
CGEDrawer.setTranslations({
  'close-button': 'Kapat',
  'drawer-label': 'Gezinme Menüsü'
});
```

---

## Instance Methods

### `drawer.open(trigger = null)`
Opens the drawer with animation. Returns `Promise<void>`.
```javascript
await drawer.open();
```

### `drawer.close()`
Closes the drawer with animation. Returns `Promise<void>`.
```javascript
await drawer.close();
```

### `drawer.toggle(trigger = null)`
Toggles the open/closed state. Returns `Promise<void>`.
```javascript
await drawer.toggle();
```

### `drawer.isOpen()`
Returns `true` if currently open, `false` otherwise.

### `drawer.on(eventName, callback)`
Subscribes to an instance lifecycle event. Chainable.

### `drawer.off(eventName, callback)`
Unsubscribes from an instance lifecycle event. Chainable.

### `drawer.destroy()`
Cleans up listeners, unlocks scroll, and removes instance from registry.

---

## Events & Lifecycle Hooks

You can listen for events via the instance `.on()` API or native DOM CustomEvents:

| Event Name | DOM CustomEvent | Detail Payload | Description |
| :--- | :--- | :--- | :--- |
| `open` | `cge:drawer:open` | `{ drawer }` | Emitted immediately when open sequence starts. |
| `opened` | `cge:drawer:opened` | `{ drawer }` | Emitted after entry transition completes. |
| `close` | `cge:drawer:close` | `{ drawer }` | Emitted immediately when close sequence starts. |
| `closed` | `cge:drawer:closed` | `{ drawer }` | Emitted after exit transition completes. |
| `backdropClick` | `cge:drawer:backdrop-click` | `{ drawer, event }` | Emitted whenever the backdrop or outer container is clicked. |
| `swipe` | `cge:drawer:swipe` | `{ direction, distance, progress, event }` | Emitted during active touch swipe drag. |

### Event Listening Example:
```javascript
const drawer = new CGEDrawer('#cart-drawer');

drawer.on('swipe', ({ progress, distance }) => {
  console.log(`Swipe progress: ${(progress * 100).toFixed(0)}% (${distance}px)`);
});

document.addEventListener('cge:drawer:opened', (e) => {
  console.log('Opened drawer:', e.detail.drawer.id);
});
```

---

## Gestures & Mobile Bottom Sheets

### Real-Time Touch Dragging
On touch-capable devices, dragging the drawer panel along its originating axis tracks the user's finger in real time:
- For `bottom` sheets: Dragging downward displaces the drawer. Dragging upward has dampening resistance.
- For `left` drawers: Dragging leftward dismisses the drawer.
- For `right` drawers: Dragging rightward dismisses the drawer.

### Threshold & Velocity Snapping
Upon `touchend`, if the swipe distance exceeds `swipeThreshold` (default: 30%) **or** the drag velocity exceeds `0.45 px/ms`, the drawer smoothly snaps shut. Otherwise, it springs back open.

---

## Directional Tactile Bounce Physics

When configured with `backdropClose: false` or `data-cge-backdrop="static"`:
1. Clicking outside the drawer **will not close it**.
2. Instead, an axis-aligned spring animation is triggered:
   - Left drawer nudges right (+14px) and snaps back.
   - Right drawer nudges left (-14px) and snaps back.
   - Top drawer nudges down (+14px) and snaps back.
   - Bottom drawer nudges up (-14px) and snaps back.
3. This provides clear tactile feedback that an explicit action is required inside the drawer.

## Extended maintenance contract (2026-10-04)

Destroy removes click, key and touch listeners, cancels animation work and restores layout-push inline styles. Recreating on the same DOM is supported. Partial translations preserve defaults and data-cge-duration="0" is valid. Static toggle accepts an optional third trigger argument. Overlay ownership is shared with Modal, Alert and Lightbox.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
