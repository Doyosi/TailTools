# CGEActionButton - Usage Guide

Comprehensive documentation for options, data attributes, operating modes, targets, loading states, events, and API methods in **CGEActionButton**.

---

## Configuration Options

When instantiating a button manually (`new CGEActionButton(element, options)`) or calling `CGEActionButton.execute(element, options)`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `action` | `string` | `'confirm'` | Action archetype: `'delete'`, `'restore'`, `'confirm'`, `'danger'`, `'warning'`, `'direct'`, or `'link'`. |
| `title` | `string \| null` | `null` | Dialog confirmation title. Falls back to localized archetype default. |
| `message` | `string \| null` | `null` | Dialog description or body message. |
| `confirmText` | `string \| null` | `null` | Label for confirmation button in modal. |
| `cancelText` | `string \| null` | `null` | Label for cancel button in modal. |
| `requireInput` | `string \| null` | `null` | Exact keyword phrase required to unlock confirmation (e.g. `'DELETE'`). |
| `url` | `string \| null` | `null` | Target HTTP URL endpoint for direct async execution. A plain `<a href>` navigates instead; its `href` is only used as the AJAX URL with `ajax: true` or an explicit `method`. |
| `method` | `string` | `'POST'` | HTTP method (`'POST'`, `'DELETE'`, `'PUT'`, `'PATCH'`, `'GET'`). |
| `form` | `string \| null` | `null` | Target form selector to submit upon confirmation (e.g. `'#user-form'`). Without it, submit buttons use their own form; anchors never do and `type="button"` controls only with `ajax`. |
| `ajax` | `boolean` | `false` | When submitting a form, whether to submit asynchronously via AJAX. |
| `loadingText` | `string \| null` | `null` | Label text displayed alongside the animated SVG spinner. |
| `lockGroup` | `string \| null` | `null` | Locks sibling action buttons in table rows (`'row'`) or matching container selector. |
| `successToast` | `string \| null` | `null` | Success notification message displayed via `CGEToast.success()`. |
| `errorToast` | `string \| null` | `null` | Custom error message override displayed on failure. |
| `redirect` | `string \| null` | `null` | Destination URL to navigate to upon successful completion (otherwise the JSON `redirect` / `redirect_url` keys). |
| `followRedirects` | `boolean` | `true` | When fetch/axios transparently followed a Laravel `redirect()`, navigate to the final URL. |
| `redirectTimeout` | `number` | `5000` | Milliseconds after which a pending navigation that never unloaded the page (download, `target="_blank"`) re-enables the button. `0` disables the recovery. |
| `instant` | `boolean` | `false` | Bypasses confirmation dialog and triggers execution immediately. |
| `simulate` | `number` | `0` | Simulated async latency in milliseconds (useful for prototyping, UI demos, or minimum spin time). |
| `headers` | `Object` | `{}` | Custom HTTP request headers sent with async requests (they win over the default Laravel headers). |
| `axiosInstance` | `AxiosInstance \| null` | `null` | Axios instance used before `window.axios`; `fetch()` is used when neither exists. |
| `translations` | `Object` | `{ ... }` | Localization dictionary overrides. |
| `onExecute` | `Function` | `null` | Custom execution handler: `(instance: CGEActionButton) => Promise<any>`. |

---

## Declarative HTML Data Attributes

All features can be declared directly in HTML or Laravel Blade markup without writing JavaScript:

| Attribute | Target Tag | Description | Example |
| :--- | :--- | :--- | :--- |
| `data-cge-action` | `<button>`, `<a>`, `<input>` | Action archetype (`'delete'`, `'restore'`, `'confirm'`, `'danger'`, `'direct'`, `'link'`). | `data-cge-action="delete"` |
| `data-cge-confirm` | `<button>`, `<a>`, `<input>` | Shorthand message to trigger confirmation gatekeeper. | `data-cge-confirm="Delete user?"` |
| `data-cge-title` | `<button>`, `<a>`, `<input>` | Custom modal dialog title. | `data-cge-title="Revoke Access?"` |
| `data-cge-message` | `<button>`, `<a>`, `<input>` | Custom modal dialog body message. | `data-cge-message="User will lose all access."` |
| `data-cge-confirm-text` | `<button>`, `<a>`, `<input>` | Custom confirmation button text in dialog. | `data-cge-confirm-text="Revoke Now"` |
| `data-cge-cancel-text` | `<button>`, `<a>`, `<input>` | Custom cancel button text in dialog. | `data-cge-cancel-text="Keep Access"` |
| `data-cge-require` | `<button>`, `<a>`, `<input>` | Phrase user must type to confirm critical actions. | `data-cge-require="REVOKE"` |
| `data-cge-url` | `<button>`, `<a>`, `<input>` | Target async endpoint URL. | `data-cge-url="/api/users/42"` |
| `data-cge-method` | `<button>`, `<a>`, `<input>` | HTTP method for async request or method spoofing. | `data-cge-method="DELETE"` |
| `data-cge-form` | `<button>`, `<input>` | CSS selector of target form to submit. | `data-cge-form="#delete-form"` |
| `data-cge-ajax` | `<button>`, `<input>` | Submit form via async AJAX instead of full page reload. | `data-cge-ajax="true"` |
| `data-cge-loading-text`| `<button>`, `<a>` | Custom text alongside spinner while active. | `data-cge-loading-text="Purging..."` |
| `data-cge-lock-group` | `<button>`, `<a>` | Disables sibling buttons in row (`'row'`) during action. | `data-cge-lock-group="row"` |
| `data-cge-success-toast`| `<button>`, `<a>` | Message displayed via `CGEToast` on completion. | `data-cge-success-toast="User revoked!"` |
| `data-cge-error-toast` | `<button>`, `<a>` | Error message override on failure. | `data-cge-error-toast="Revoke failed"` |
| `data-cge-redirect` | `<button>`, `<a>` | URL to redirect browser upon success. | `data-cge-redirect="/admin/users"` |
| `data-cge-instant` | `<button>`, `<a>` | Bypasses dialog even on destructive actions. | `data-cge-instant="true"` |
| `data-cge-simulate`| `<button>`, `<a>` | Simulated async duration (ms) for testing and UI prototyping. | `data-cge-simulate="1000"` |

---

## Operating Modes

### Mode 1: Confirmation Gatekeeper (Dialog First)
When `data-cge-action="delete"`, `"restore"`, `"confirm"`, `"danger"`, or when `data-cge-confirm` is present:
1. Intercepts the click and halts default execution.
2. Displays a `CGEAlert` modal (or fallback `window.confirm`).
3. If user cancels: emits `cge:action:cancel` and leaves button untouched.
4. If user confirms: proceeds to freeze button, render spinner, and execute action.

### Mode 2: Direct Command Execution (Instant Action)
When `data-cge-action="direct"` or `data-cge-instant="true"`:
1. Bypasses the confirmation dialog completely.
2. Instantly freezes the button, preserves layout width, and displays the animated spinner.
3. Fires the target async request or form submission.

---

## Execution Engines & Target Handlers

### 1. Direct Async Endpoint Target
Dispatches an asynchronous request directly without wrapping in a `<form>` element:

```html
<button type="button"
        data-cge-action="direct"
        data-cge-url="/admin/clear-cache"
        data-cge-method="POST"
        data-cge-loading-text="Clearing..."
        data-cge-success-toast="Cache cleared successfully!"
        class="px-3 py-1.5 rounded-sm bg-slate-900 text-white text-xs font-semibold">
    Clear Cache
</button>
```
- Attaches `X-CSRF-TOKEN` from `<meta name="csrf-token">`, the form `_token` or `window.csrfToken`; without a plain token the encrypted `XSRF-TOKEN` cookie is sent as `X-XSRF-TOKEN` (never as `X-CSRF-TOKEN`).
- Dispatches using `axiosInstance`, then `window.axios`, falling back to native `fetch()`.
- A followed Laravel `redirect()` navigates to the final URL (`followRedirects`). Toasts use string `message` values only; JSON `redirect` / `redirect_url` keys redirect (a generic `url` field does not).

### 2. Form Submitter Target with Laravel Method Spoofing
Submits a target form and automatically handles method spoofing for Laravel resource routes:

```html
<form id="user-delete-form" action="/users/14" method="POST">
    <button type="submit"
            data-cge-action="delete"
            data-cge-method="DELETE"
            data-cge-title="Delete User?"
            data-cge-message="User will be permanently deleted."
            class="px-3 py-1.5 rounded-sm bg-rose-600 text-white text-xs font-semibold">
        Delete User
    </button>
</form>
```
- Injects `<input type="hidden" name="_method" value="DELETE">` if not present.
- Submits with `form.requestSubmit(button)`: the `submit` event fires (CGEForm AJAX and 422 binding, Livewire `wire:submit`) and the clicked button's `name`/`value` is included. When a listener prevents the submit, the button is released immediately.

### 3. Browser Navigation Interceptor
Confirms before navigating an anchor tag. Every plain `<a href data-cge-confirm>` (or `data-cge-action="link"`) navigates after confirmation by replaying the click, so `target="_blank"`, `download` and `rel` keep working. Add `data-cge-ajax` or an explicit `data-cge-method` / `data-cge-url` to send an AJAX request instead:

```html
<a href="/admin/switch-account/12"
   data-cge-action="link"
   data-cge-title="Switch Account?"
   data-cge-message="You will be logged into the target account."
   class="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-xs font-semibold">
    Switch Account
</a>
```

---

## Sibling Lock Groups (`data-cge-lock-group`)

In tables or lists where each row has multiple action buttons (e.g. Edit, Delete, Restore):
- Set `data-cge-lock-group="row"` on the action buttons.
- When any button in that row is clicked, all sibling buttons in the same row are disabled and dimmed (`opacity-50`, `pointer-events-none`).
- Once the action completes (or dialog is cancelled), sibling buttons are re-enabled.

---

## Static Methods

### `CGEActionButton.init(target?)`
Initializes global delegated click listening on `document` in the **capture phase**, so the confirmation runs before inline `onclick`, Alpine `@click` and Livewire `wire:click`. After confirmation the click is replayed exactly once. `target` may be a custom trigger selector or a root element/document (the default selector is kept); disconnected instances are pruned on every call.
```javascript
import { CGEActionButton } from 'tailtools';

// Works automatically for all current and dynamically injected DOM elements (Livewire, Datatables)
CGEActionButton.init();
CGEActionButton.init(container); // safe: a root, not a selector
```

### `CGEActionButton.destroyAll(root = document)`
Destroys instances inside `root` or whose element was removed (Livewire morphing, Turbo visits).

### `CGEActionButton.execute(target, options)`
Programmatically executes an action button by selector or DOM element:
```javascript
await CGEActionButton.execute('#purge-btn');
```

### `CGEActionButton.setTranslations(dictionary)`
Updates global default translations:
```javascript
CGEActionButton.setTranslations({
  'loading': 'İşleniyor...',
  'delete-title': 'Silme Onayı',
  'delete-btn': 'Evet, Sil',
  'cancel-btn': 'İptal'
});
```

---

## Custom DOM Events

| Event Name | `detail` Payload | Description |
| :--- | :--- | :--- |
| `cge:action:start` | `{ instance, element, action }` | Fired when action execution begins (spinner displayed). |
| `cge:action:confirm` | `{ instance, element, action }` | Fired when user approves confirmation modal. |
| `cge:action:cancel` | `{ instance, element, action }` | Fired when user rejects/closes confirmation modal. |
| `cge:action:success` | `{ instance, element, action, result }` | Fired when execution completes successfully. |
| `cge:action:error` | `{ instance, element, action, error }` | Fired when execution fails or returns HTTP error. |
| `cge:action:complete` | `{ instance, element, action }` | Fired on completion (after success or error). |

```javascript
document.addEventListener('cge:action:success', (e) => {
  console.log(`Action [${e.detail.action}] succeeded on button:`, e.detail.element);
});
```


## Maintenance notes (2026-10-04)

Repeated execute calls while confirmation is pending are ignored, preventing duplicate dialogs/requests. Canceling or failing confirmation releases the guard. Partial per-instance translations retain global defaults.

## Extended maintenance contract (2026-10-04)

Confirmation is serialized. AJAX FormData is captured before freezing and includes the clicked button name/value exactly once. Multipart PUT/PATCH/DELETE uses POST + _method; GET uses query parameters, with no request body. Direct requests without FormData keep their requested method. Destroy cancels requests, delays and redirects and prevents late actions/results. Partial translations keep defaults.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

## Stability fixes (October 2026)

- **Capture-phase gating:** handlers on the trigger (inline `onclick`, Alpine, Livewire) never run before confirmation and run exactly once afterwards (the old code ran `onclick` before *and* after the dialog).
- **Native submits** use `requestSubmit()` instead of `HTMLFormElement.prototype.submit`, so CGEForm intercepts them and the submitter's `name`/`value` is kept.
- **Anchors navigate** (behavior change): `<a href data-cge-confirm>` no longer POSTs to its `href` unless `data-cge-ajax`, `data-cge-method` or `data-cge-url` is present.
- **Busy recovery:** `redirectTimeout` (5000 ms) re-enables the button when a navigation never unloads the page; every new `execute()` resets the previous redirect state.
- **CSRF / HTTP:** shared Laravel helper (cookie only as `X-XSRF-TOKEN`), configured `axiosInstance` first, failures become `HttpError` with `status`, `data.message` and `data.errors` (the first field error is toasted), followed redirects navigate.
- **Responses:** `{ success: true }` no longer toasts `"true"`; only `redirect` / `redirect_url` keys redirect (behavior change: a generic `url` key is ignored).
- **Styles:** the base transition lives in `@layer components` with zero specificity, so Tailwind `transition-*` utilities win.
- **Lifecycle:** `init(root | selector)` and `static destroyAll(root)`.
