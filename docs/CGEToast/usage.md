# CGEToast - Usage & API Reference

This guide covers all static helper methods, configuration options, instance methods, and event hooks provided by `CGEToast`.

---

## Static Helper API

`CGEToast` provides static shortcut methods for high-frequency notification workflows:

### `CGEToast.show(options)`
Launches a notification with complete configuration options:
```javascript
import { CGEToast } from 'tailtools';

const toast = CGEToast.show({
  message: 'Files uploaded successfully.',
  title: 'Upload Complete',
  variant: 'success',
  position: 'top-right',
  duration: 4000
});
```

### `CGEToast.success(message, options?)`
```javascript
CGEToast.success('Saved changes!', { duration: 3000 });
```

### `CGEToast.error(message, options?)`
```javascript
CGEToast.error('An unexpected server error occurred.', { title: '500 Server Error' });
```

### `CGEToast.warning(message, options?)`
```javascript
CGEToast.warning('Disk quota at 90% threshold.');
```

### `CGEToast.info(message, options?)`
```javascript
CGEToast.info('Version 1.2.0 is now available.');
```

### `CGEToast.dismissAll(position?)`
Dismisses all active toasts across all portals, or target a specific position:
```javascript
// Dismiss all toasts on page
CGEToast.dismissAll();

// Dismiss only toasts located in the top-right corner
CGEToast.dismissAll('top-right');
```

### `CGEToast.setTranslations(dict)`
Overrides the global translation dictionary at runtime:
```javascript
CGEToast.setTranslations({
  close: 'Kapat',
  undo: 'Geri Al',
  'success-title': 'Başarılı',
  'error-title': 'Hata',
  'warning-title': 'Uyarı',
  'info-title': 'Bilgilendirme'
});
```

### `CGEToast.init(root?)`
Scans the DOM for declarative `data-cge-toast` click triggers and `data-cge-toast-flash` session flash elements:
```javascript
// Automatically called by initTailTools() on DOMContentLoaded
CGEToast.init();

// Re-scan a dynamically updated subtree (e.g. after Alpine / Turbo fetch)
CGEToast.init(document.getElementById('content-area'));
```

---

## Configuration Options

All options can be passed to `CGEToast.show(options)` or `new CGEToast(options)`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Color theme mode: `'light'` (clean white card), `'dark'` (slate-900 card), or `'auto'` (system/`html.dark`). |
| `message` | `string` | `''` | **Required.** Notification text (supports trusted HTML markup). |
| `title` | `string \| null` | `null` | Optional bold header title. If omitted, uses localized default title for variant. |
| `variant` | `'success' \| 'error' \| 'warning' \| 'info' \| 'neutral'` | `'neutral'` | Visual theme and semantic coloring. |
| `position` | `CGEToastPosition` | `'top-right'` | Placement quadrant or banner mode (see positions below). |
| `duration` | `number \| false` | `5000` | Auto-dismiss countdown in milliseconds. Set to `false` or `0` for persistent toasts. |
| `progressBar` | `boolean` | `true` | Displays animated countdown progress bar at bottom of card. |
| `pauseOnHover` | `boolean` | `true` | Freezes the countdown timer when user cursor is hovered over toast card. |
| `dismissOnClick` | `boolean` | `false` | When `true`, clicking anywhere on the card dismisses the toast. |
| `dismissible` | `boolean` | `true` | Shows dedicated accessible close button. |
| `swipeToDismiss` | `boolean` | `true` | Enables touch swipe flick-away gesture on mobile viewports. |
| `icon` | `boolean \| string` | `true` | `true` for default variant SVG, `false` to disable, or a custom inline SVG string. |
| `image` | `CGEToastImage \| null` | `null` | Custom image/avatar object: `{ src, alt, class }`. |
| `actions` | `CGEToastAction[]` | `[]` | Array of interactive action buttons rendered inside card. |
| `newestOnTop` | `boolean` | `true` | When `true`, new toasts are prepended to top of container. |
| `maxToasts` | `number` | `5` | Maximum concurrent toasts in container. Oldest are auto-dismissed when exceeded. |
| `animationDriver`| `'auto' \| 'tailwind-animations' \| 'css' \| 'none'` | `'auto'` | Driver for entry and exit transitions. |
| `translations` | `Partial<CGEToastTranslations>` | `{}` | Per-instance translation overrides. |
| `onOpen` | `(toast) => void` | `null` | Lifecycle callback invoked immediately after toast mounts. |
| `onClose` | `(toast) => void` | `null` | Lifecycle callback invoked after exit animation completes and toast unmounts. |
| `onClick` | `(toast, e) => void` | `null` | Callback invoked when user clicks the toast body. |

---

## Positions Reference

| Position Value | Layout Type | Typical Screen Location |
| :--- | :--- | :--- |
| `'top-right'` *(Default)* | Floating | Top right corner, stacked vertically |
| `'top-left'` | Floating | Top left corner, stacked vertically |
| `'top-center'` | Floating | Centered horizontally along top edge |
| `'bottom-right'` | Floating | Bottom right corner, stacked vertically |
| `'bottom-left'` | Floating | Bottom left corner, stacked vertically |
| `'bottom-center'` | Floating | Centered horizontally along bottom edge |
| `'center'` | Floating | Dead center of viewport (ideal for urgent modal-like prompts) |
| `'top-full'` | Full Banner | 100vw edge-to-edge banner across top edge of screen |
| `'bottom-full'` | Full Banner | 100vw edge-to-edge banner across bottom edge of screen |

---

## Instance Methods & Properties

When creating or obtaining a toast reference:
```javascript
const toast = new CGEToast({
  message: 'Uploading archive...',
  duration: 10000
});

// Pause timer programmatically
toast.pause();

// Resume timer programmatically
toast.resume();

// Dismiss immediately with exit animation
await toast.dismiss();

// Inspect state
console.log(toast.isOpen);        // true / false
console.log(toast.isPaused);      // true / false
console.log(toast.remainingTime); // remaining ms
```

---

## DOM Custom Events

All notifications dispatch DOM CustomEvents on the global `document` element:

### Event Listeners:
```javascript
// Fired when toast card mounts
document.addEventListener('cge:toast:open', (event) => {
  const { toast, variant, message, position } = event.detail;
  console.log(`[CGEToast Opened] ${variant}: ${message}`);
});

// Fired after toast unmounts
document.addEventListener('cge:toast:close', (event) => {
  const { toast, variant, position } = event.detail;
  console.log(`[CGEToast Closed] ${position}`);
});

// Fired when user clicks card
document.addEventListener('cge:toast:click', (event) => {
  const { toast, event: mouseEvent } = event.detail;
  console.log('Toast clicked');
});
```

---

## Action Buttons Reference

Add interactive action buttons using the `actions` array:

```javascript
CGEToast.show({
  message: 'Conversation moved to Trash.',
  variant: 'neutral',
  duration: 6000,
  actions: [
    {
      label: 'Undo',
      class: 'bg-indigo-600 hover:bg-indigo-500 text-white font-medium',
      onClick: (toast, event) => {
        // Restore conversation logic
        CGEToast.success('Conversation restored.');
        toast.dismiss();
      }
    }
  ]
});
```


## Maintenance notes (2026-10-04)

A session flash DOM node is consumed only once across repeated initialization. New flash nodes still work. Declarative data-cge-duration="0"/"false" and data-cge-toast-duration="0"/"false" create persistent toasts.

Nested document/subtree delegation handles a single click only once.

## Extended maintenance contract (2026-10-04)

Repeated init consumes each session flash once; duration=0/false remains persistent. Nested root listeners process a click once. Toast rich messages and custom render content accept trusted HTML; keep untrusted user text escaped. Use dismiss/clear and the declared Toast API rather than adding a universal destroy method.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
