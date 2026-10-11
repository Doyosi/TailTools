# CGEAlert - Usage & API Reference

This guide covers all static helper methods, configuration options, input validators, lifecycle hooks, and DOM events provided by `CGEAlert`.

---

## Static Helper API

`CGEAlert` exposes intuitive, promise-based static shortcuts:

### `CGEAlert.fire(options): Promise<CGEAlertResult>`
Primary method that accepts the complete options object:
```javascript
import { CGEAlert } from 'tailtools';

const result = await CGEAlert.fire({
  title: 'Export Data',
  message: 'Generate a downloadable CSV archive?',
  archetype: 'confirm',
  confirmButtonText: 'Export Now',
  showCancelButton: true
});

if (result.isConfirmed) {
  // proceed with export
}
```

### `CGEAlert.alert(title, message?, options?): Promise<CGEAlertResult>`
Displays a simple alert with an OK acknowledge button:
```javascript
await CGEAlert.alert('Session Expired', 'Please sign in again to continue.');
```

### `CGEAlert.confirm(title, message?, options?): Promise<CGEAlertResult>`
Displays a standard confirmation dialog with Confirm and Cancel buttons:
```javascript
const { isConfirmed } = await CGEAlert.confirm('Save Draft?', 'You have unsaved changes.');
if (isConfirmed) {
  saveDraft();
}
```

### `CGEAlert.delete(title, message?, options?): Promise<CGEAlertResult>`
Displays a destructive deletion dialog with Rose/Red confirm styling:
```javascript
const { isConfirmed } = await CGEAlert.delete(
  'Delete Repository?',
  'This action will permanently delete all branches and commit history.',
  {
    confirmButtonText: 'Yes, delete repository'
  }
);
```

### `CGEAlert.restore(title, message?, options?): Promise<CGEAlertResult>`
Displays a recovery dialog with Emerald confirm styling and an undo arrow:
```javascript
const { isConfirmed } = await CGEAlert.restore(
  'Restore Document?',
  'The document will be moved back into your active workspace.'
);
```

### `CGEAlert.prompt(title, inputOptions?): Promise<CGEAlertResult>`
Displays an input dialog for collecting text, passwords, emails, or choices:
```javascript
const { isConfirmed, value } = await CGEAlert.prompt('Workspace Name', {
  input: 'text',
  inputPlaceholder: 'e.g. Acme Corp',
  inputValidator: (val) => (!val ? 'Workspace name is required.' : null)
});

if (isConfirmed) {
  console.log('Created workspace:', value);
}
```

### `CGEAlert.close(dismissReason?)`
Programmatically dismisses the active alert:
```javascript
CGEAlert.close('close');
```

### `CGEAlert.showLoading()` & `CGEAlert.hideLoading()`
Controls the spinner state on the primary confirm button:
```javascript
CGEAlert.showLoading();
// ...perform asynchronous operation...
CGEAlert.hideLoading();
```

---

## Result Payload (`CGEAlertResult`)

Every promise resolves to an object with the following fields:

```typescript
interface CGEAlertResult<T = any> {
  isConfirmed: boolean;     // true if user clicked primary confirm button
  isDenied: boolean;        // true if user clicked secondary deny button
  isDismissed: boolean;     // true if user dismissed dialog
  dismissReason?: 'backdrop' | 'cancel' | 'close' | 'esc';
  value?: T;                // input field value or preConfirm return value
}
```

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Theme mode: `'light'` (clean white card), `'dark'` (slate-900 card), or `'auto'` (system/`html.dark`). |
| `title` | `string \| null` | `null` | Primary header heading (plain text, HTML is escaped). |
| `message` | `string` | `''` | Plain text message description (HTML is escaped). |
| `html` | `string \| null` | `null` | Trusted custom HTML markup (overrides `message`). The only HTML option besides `icon`; never pass user input. |
| `archetype` | `CGEAlertArchetype` | `'alert'` | Archetype: `'alert' \| 'confirm' \| 'delete' \| 'restore' \| 'info' \| 'success' \| 'warning' \| 'error' \| 'prompt' \| 'custom'`. |
| `icon` | `boolean \| string` | `true` | Renders default archetype SVG icon, custom SVG string, or `false` to disable. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Dialog width preset (`sm` = 384px, `md` = 448px, `lg` = 512px, `xl` = 576px). |
| `showConfirmButton` | `boolean` | `true` | Displays primary action button. |
| `confirmButtonText` | `string \| null` | Localized | Text label for confirm button. |
| `confirmButtonClass`| `string` | Archetype-based | Custom Tailwind classes for confirm button. |
| `showDenyButton` | `boolean` | `false` | Displays secondary Deny button. |
| `denyButtonText` | `string \| null` | Localized | Text label for deny button. |
| `denyButtonClass` | `string` | Amber styling | Custom Tailwind classes for deny button. |
| `showCancelButton` | `boolean` | `false`* | Displays Cancel button (*automatically `true` for confirm, delete, restore, prompt). |
| `cancelButtonText` | `string \| null` | Localized | Text label for cancel button. |
| `cancelButtonClass` | `string` | Slate styling | Custom Tailwind classes for cancel button. |
| `showCloseButton` | `boolean` | `true` | Displays "✕" close button in top-right corner. |
| `backdropClose` | `boolean` | `true` | When `false`, clicking outside triggers tactile shake vibration instead of closing. |
| `allowEscapeKey` | `boolean` | `true` | When `false`, pressing Escape triggers shake vibration instead of closing. |
| `focusConfirm` | `boolean` | `true` | Automatically focuses confirm button on open. |
| `trapFocus` | `boolean` | `true` | Traps keyboard Tab cycle within the dialog card. |
| `input` | `CGEAlertInputType` | `null` | Input type: `'text' \| 'textarea' \| 'email' \| 'password' \| 'select' \| 'number'`. |
| `inputValue` | `string` | `''` | Initial value in the input field. |
| `inputPlaceholder` | `string` | Localized | Input field placeholder text. |
| `inputOptions` | `Record<string, string> \| Array` | `null` | Key-value mapping or `{ value, label }[]` for select inputs. |
| `inputValidator` | `Function` | `null` | `(value) => string \| null \| Promise<string \| null>`. Return error string to prevent confirmation. |
| `requireInput` | `string \| null` | `null` | High-security exact phrase confirmation (e.g. `'DELETE'`). |
| `requireInputCaseSensitive` | `boolean` | `true` | Whether phrase matching is case-sensitive. |
| `animationDriver` | `'auto' \| 'tailwind-animations' \| 'css' \| 'none'` | `'auto'` | Animation driver. |
| `preConfirm` | `Function` | `null` | Async hook before confirming: `async (val) => { ... }`. Return `false` to prevent closure. |

---

## High-Security Type-to-Confirm

For critical irreversible actions:

```javascript
const res = await CGEAlert.delete('Delete Production Cluster', 'All customer instances will be terminated.', {
  requireInput: 'DELETE',
  confirmButtonText: 'Permanently Destroy'
});

if (res.isConfirmed) {
  // Only reached if user typed "DELETE" exactly
}
```

---

## Async Pre-Confirm Hook

Perform network requests or validation inside the dialog with a native spinner:

```javascript
const res = await CGEAlert.confirm('Deploy to Production', 'Trigger webhook deploy now?', {
  preConfirm: async () => {
    try {
      const response = await fetch('/api/deploy', { method: 'POST' });
      if (!response.ok) throw new Error('Deployment failed');
      return await response.json();
    } catch (err) {
      throw new Error(err.message); // Displays inline error and shakes dialog
    }
  }
});

if (res.isConfirmed) {
  console.log('Deployed data:', res.value);
}
```

---

## DOM Custom Events

`CGEAlert` dispatches events directly on `document`:

```javascript
document.addEventListener('cge:alert:open', (e) => {
  console.log('Alert opened, archetype:', e.detail.archetype);
});

document.addEventListener('cge:alert:confirm', (e) => {
  console.log('Confirmed with value:', e.detail.value);
});

document.addEventListener('cge:alert:deny', (e) => {
  console.log('Denied (Don\'t Save):', e.detail.archetype);
});

document.addEventListener('cge:alert:cancel', (e) => {
  console.log('Cancelled reason:', e.detail.reason);
});

document.addEventListener('cge:alert:close', (e) => {
  console.log('Alert closed:', e.detail);
});
```

## Extended maintenance contract (2026-10-04)

Declarative confirmation uses a valid submit button with requestSubmit, supports external form-associated buttons, and removes temporary name/value inputs for other triggers. Repeated clicks while confirmation waits cannot bypass it. Dismissed async validators/preConfirm cannot deliver late confirmation. Alert owns scroll/focus only while its overlay is active; use dismiss/close and await the result Promise. For Livewire/Turbo teardown use `CGEAlert.destroyAll(root)`.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.


## Layout and styling
The default body padding is 16px below sm and 20px at sm+. Desktop actions have a 32px minimum height; below 640px the minimum is 36px. Long titles, descriptions, helper phrases and button labels wrap within the card. The close button stays clear of the title; icon:false removes the icon column. Dialogs without confirm/deny/cancel actions omit the footer. Type-to-confirm helper emphasis inherits the current theme so the required phrase is readable in light mode.

Use the existing confirmButtonClass/cancelButtonClass/denyButtonClass options to customize button colors. Default palettes retain semantic colors with softer shadows. Explicit light/dark themes are supported independently of the page's .dark class. The stylesheet supplies visible keyboard focus and honors prefers-reduced-motion. There is no new density or layout option.

## Stability fixes (October 2026)

- **Escaping:** `title`, `message`, `requireInput` (inside the trusted helper translation and the placeholder), `inputValue`, `inputPlaceholder`, select option values/labels and button texts are escaped. Only `html` and `icon` accept HTML. Declarative `data-cge-*` attributes are always text (the browser already decoded Blade's escaping).
- **Enter key:** confirms only when focus is on the single-line input or the dialog itself, and never for a held/repeated key. Focused buttons (Cancel, Deny, Close, Confirm) activate natively, so Enter on Cancel cancels.
- **Loading lock:** while `preConfirm` or `inputValidator` runs, Escape, backdrop clicks and the close button are ignored (the close button is disabled too).
- **Declarative gate:** `[data-cge-alert]` delegation runs in the **capture phase** with `preventDefault()` + `stopImmediatePropagation()`, so `wire:click`, `@click`, inline `onclick`, links and submits never run before confirmation. After confirmation the click is replayed once: element handlers run, links navigate and submit buttons submit natively; other triggers inside a form use `requestSubmit` (with name/value), and triggers without a form or link receive `cge:confirmed`. A handler that calls `preventDefault()` on the replayed click stops the follow-up action.
- **Accessibility:** the card is `role="alertdialog"` with `aria-modal`, `aria-labelledby` (only when a title exists, otherwise `aria-label`) and `aria-describedby` for the message.
- **Focus trap:** Tab pulls focus back inside even when it escaped the dialog.
- **Stacking:** the shared portal is bumped above any open overlay (for example CGELightbox).
- **Translations:** per-instance `translations` now also label archetype buttons (`delete-button`, `cancel-button`, ...).
- **Reduced motion:** `prefers-reduced-motion: reduce` disables entry/exit animation and shake.
- **Lifecycle:** `CGEAlert.destroyAll(root = document)` closes the active alert and removes delegation bound to `root`, roots inside it or detached roots. `CGEAlert.init(root)` drops delegation of detached roots before binding. `CGEAlert.optionsFromTrigger(el)` exposes the declarative option parsing.
