# CGEForm Usage & Configuration Guide

Comprehensive reference for configuring, extending, and operating `CGEForm`.

---

## 1. Options Reference

Pass options via programmatic initialization (`new CGEForm(form, options)`) or declaratively using `data-cge-*` attributes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `driver` | `'axios' \| 'fetch' \| 'xhr'` | `'axios'` | HTTP client engine. Falls back cleanly to `fetch` if `axios` is missing. |
| `axiosInstance` | `AxiosInstance \| null` | `null` | Axios instance used before `window.axios` by the `axios` driver. |
| `url` | `string \| null` | `null` | Target URL. Defaults to the form's `action` attribute or the current window URL. |
| `method` | `string \| null` | `null` | HTTP verb (`POST`, `GET`, `PUT`, `PATCH`, `DELETE`). Honors `<input name="_method">`. |
| `headers` | `Record<string, string>` | `{}` | Additional headers (they win). `X-Requested-With`, `Accept` and CSRF are automatic: meta / `_token` / `window.csrfToken` as `X-CSRF-TOKEN`, otherwise the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`. |
| `feedback` | `string \| object` | `{ type: 'toast' }` | Pluggable notification bridge configuration (see Section 2). |
| `autoClearErrors` | `boolean` | `true` | Automatically clear error styles and hide feedback messages as soon as the user types or changes the field. |
| `invalidClass` | `string` | Tailwind red classes | CSS classes applied to inputs on validation failure, and to their visible proxy: the CGESelect trigger of a hidden native select, or the element referenced by the field's `data-cge-error-target="selector"`. |
| `validClass` | `string` | `''` | CSS classes applied to valid inputs. |
| `groupErrorClass`| `string` | `'has-error'` | CSS class applied to the parent `.cge-form-group` on validation failure. |
| `showLoadingIndicator` | `boolean` | `true` | Transitions the submit button into a loading state during execution. |
| `loadingText` | `string \| null` | `null` | Override HTML or text for the submit button while processing. Defaults to localized spinner. |
| `freezeInputs` | `boolean` | `true` | Disables editable form fields during the request. |
| `resetOnSuccess` | `boolean` | `false` | Automatically resets form inputs to their initial values upon 2xx response. |
| `redirectDelay` | `number` | `0` | Milliseconds to wait before executing a server-guided redirect. The form stays frozen until the page unloads, so it cannot be resubmitted during the delay. |
| `followRedirects` | `boolean` | `true` | When fetch/XHR/axios transparently followed a Laravel `redirect()`, navigate to the final URL (with `onRedirect`, `redirect` event and `redirectDelay`). |
| `onRedirect` | `Function` | `null` | Interceptor callback `(url, payload) => boolean \| void`. Return `false` to abort redirection. |
| `translations` | `Record<string, string>`| `{}` | Per-instance translation overrides. |
| `beforeSubmit` | `Function` | `null` | Hook `(formData, formInstance) => boolean \| void \| CGEFormMockResponse` (or a Promise of it). Return `false` to cancel submission, or an object with `status` / `data` / `response` to skip the request and use it as the response. |

---

## 2. Pluggable Feedback & Notification Bridge

The `feedback` option allows routing server responses and validation feedback to various visual notification systems:

```javascript
new CGEForm('#my-form', {
  feedback: {
    type: 'toast', // Default driver
    options: { duration: 4000 },
    onSuccess: 'toast',
    onValidationError: 'toast',
    onError: 'alert' // Trigger a modal dialog on 500 server errors
  }
});
```

### Supported Drivers

1. `'toast'`: Triggers `CGEToast.show()`. Automatically applies semantic variants (`success`, `warning` for 422 errors, `error` for 500/network failures).
2. `'alert'`: Triggers `CGEAlert.fire()`. Displays an accessible modal dialog.
3. `'native'`: Browser `window.alert()`.
4. `'sweetalert'`: Integrates directly with `window.Swal` if SweetAlert2 is present in the host application without bundling it.
5. `'custom'`: Pass a callback `(status, message, payload, form) => void` for custom toast or alert mechanisms.
6. `'none'`: Disables all visual notification popups.

### Message Extraction Precedence
When an HTTP response arrives, messages are extracted in the following order:
1. `response.data.message` (e.g. Laravel's default validation message).
2. `response.data.status` (if provided as a string).
3. Localized dictionary fallback (`success-message`, `error-message`, `server-error`, `network-error`).

---

## 3. DOM Hierarchy & Complex Array Error Binding

### Standard Form Element Wrapper
`CGEForm` is optimized for this accessible hierarchy:

```html
<div class="cge-form-group">
  <label for="choices">Field Label</label>
  <input name="choices[]" id="choices_0" class="cge-input" />
  <span class="cge-feedback text-red-500 text-sm hidden" data-cge-feedback="choices"></span>
</div>
```

> **Design System Friendly (Zero-Opinionated):**
> `.cge-input`, `.cge-textarea`, and `.cge-select` are authored as non-destructive class hooks. They do **not** enforce opinionated background colors, borders, font-sizes, or paddings, ensuring total compatibility with your custom Tailwind classes, form component libraries (DaisyUI, Flowbite, Preline), or existing stylesheets without style collisions.

### Laravel Error Key Resolution Rules

| Laravel 422 JSON Key | Input Attributes Matched | Feedback Container Matched |
| :--- | :--- | :--- |
| `email` | `name="email"` | `[data-cge-feedback="email"]` |
| `choices.0` | `name="choices[0]"` or `name="choices[]"` (0th item) | `[data-cge-feedback="choices.0"]` or `[data-cge-feedback="choices"]` |
| `choices2.a` | `name="choices2[a]"` or `name="choices2.a"` | `[data-cge-feedback="choices2[a]"]` or `[data-cge-feedback="choices2.a"]` |
| `user.profile.bio` | `name="user[profile][bio]"` or `name="user.profile.bio"` | `[data-cge-feedback="user.profile.bio"]` or `.cge-feedback` in group |
| `items.0.name` | `name="items[0][name]"` | `[data-cge-feedback="items.0.name"]` or `[data-cge-feedback="items[0][name]"]` |
| `items.0.tags.1` | `name="items[0][tags][]"` (index 1) | `[data-cge-feedback="items.0.tags.1"]` |
| `tags` | `name="tags[]"` (all inputs) | `[data-cge-feedback="tags"]` or `[data-cge-feedback="tags[]"]` |

### Automatic Feedback Container Fallback
If an explicit `[data-cge-feedback]` element is omitted in your HTML, `CGEForm` searches for an unkeyed `.cge-feedback` / `.cge-error-feedback` within the field's `.cge-form-group`. Without a `.cge-form-group`, the parent element is only used when it contains no other field. Otherwise it generates one `<span class="cge-feedback text-red-500 text-xs mt-1 block" data-cge-feedback="<key>">` per error key, right after the field (after the label of a checkbox/radio, after the CGESelect wrapper, or after the last input of an array). Fields that share a parent therefore keep separate messages, and typing in one field only clears its own key. Generated spans get an `id` that is appended to `aria-describedby`; the author's original `aria-describedby` is restored when errors clear.

---

## 4. State Memory Guard

In modern web applications, certain fields may already be `disabled` or `readonly` on page load (e.g., an unchangeable user email or locked account ID in a profile view).

`CGEForm` maintains a **State Memory Guard**:
1. Prior to submitting the form, it snapshots all elements that were already disabled or readonly.
2. It disables editable inputs and switches the submit button to the loading state.
3. Upon completion or error, it **only** re-enables inputs that were originally editable. Pre-disabled fields remain locked.

---

## 5. HTML-Aware Localization (i18n) Engine

### Default Dictionary
```javascript
translations: {
  "success": "Success!",
  "success-message": "Operation completed successfully.",
  "error": "Error!",
  "error-message": "Please fix the highlighted errors and try again.",
  "server-error": "An unexpected server error occurred. Please try again later.",
  "network-error": "Network connection error. Check your internet connection.",
  "csrf-expired": "Your session has expired. Please refresh the page and try again.",
  "save-button": "Save",
  "update-button": "Update",
  "delete-button": "Delete",
  "loading-indicator": '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Loading...',
}
```

### Precedence Hierarchy (Highest to Lowest)
1. **Form Attribute Override:** `data-cge-i18n='{"loading-indicator": "Saving profile..."}'`
2. **Instance Options Override:** `new CGEForm('#form', { translations: { 'save-button': 'Kaydet' } })`
3. **Global Locale Override:** `CGEForm.setLocale('tr', { 'loading-indicator': 'Yükleniyor...' })` or `CGEForm.setTranslations({...})`
4. **Base Default Dictionary:** Default English entries.

### Translation Helper
```javascript
form.t('save-button'); // "Save"
form.t('welcome-user', { name: 'Alex' }); // Variable interpolation (:name or {name})
```

---

## 6. Public Methods

### `bindErrors(errors: Record<string, string[] | string>): void`
Programmatically binds validation errors to form elements and displays feedback messages.

### `clearErrors(): void`
Clears all invalid styles, removes `aria-invalid`, and hides all error feedback messages across the form.

### `reset(): void`
Resets all input values and invokes `clearErrors()`.

### `submit(): Promise<any>`
Programmatically triggers form submission following the exact same AJAX lifecycle.

### `on(event: string, callback: Function): this`
Registers an event listener for fluent chaining.

### `off(event: string, callback?: Function): this`
Removes an event listener.

### `destroy(): void`
Unbinds all event listeners, clears errors, and removes the form from `CGEForm.instances`.

---

## 7. Event Hooks & DOM CustomEvents

`CGEForm` fires both fluent instance callbacks and standard bubbling DOM CustomEvents on the form element and `document`.

| Event Name | DOM CustomEvent | Payload Properties |
| :--- | :--- | :--- |
| `'submit'` | `cge:form:submit` | `{ form, formData, url, method }` |
| `'success'` | `cge:form:success` | `{ form, response, data }` |
| `'invalid'` | `cge:form:invalid` | `{ form, errors, response, error }` |
| `'error'` | `cge:form:error` | `{ form, error, response }` |
| `'complete'` | `cge:form:complete` | `{ form, ok, response }` |
| `'redirect'` | `cge:form:redirect` | `{ form, url, response }` |
| `'progress'` | `cge:form:progress` | `{ form, percent, loaded, total }` |


## Maintenance notes (2026-10-04)

PUT/PATCH/DELETE forms use POST with `_method` across Axios, Fetch and XHR, including Blade forms that already contain `@method`. Concurrent submit calls are ignored until the active submission completes. `destroy()` removes delegated input/change handlers and removes `novalidate` only when added by the plugin.

## Extended maintenance contract (2026-10-04)

All drivers send Laravel multipart PUT/PATCH/DELETE as POST plus _method. FormData is captured before freezing and includes the SubmitEvent submitter. Concurrent submissions are prevented. Destroy aborts Axios/Fetch/XHR, cancels redirect timers, restores frozen controls and suppresses late callbacks/events; delayed beforeSubmit cannot start a request afterward. Input/change listeners and plugin-added novalidate are restored on teardown.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

## Stability fixes (October 2026)

- **CSRF:** shared Laravel helper; the encrypted `XSRF-TOKEN` cookie is only sent as `X-XSRF-TOKEN`. A 419 response emits `error` and shows the `csrf-expired` translation.
- **Axios:** `axiosInstance` wins over `window.axios`.
- **Followed redirects:** when a controller answers with `redirect()`, fetch/XHR/axios follow it silently; `followRedirects` (default `true`) detects this (`response.redirected` / `responseURL`) and navigates to the final URL instead of reporting success. Return JSON `{ "redirect": "..." }` when the next page must still see flash data.
- **Per-key feedback:** see *Automatic Feedback Container Fallback*; nested and array keys (`items.0.name`, `tags.1`) resolve to bracket names.
- **Visible invalid state:** invalid classes and `aria-invalid` are mirrored to the CGESelect trigger or to `data-cge-error-target`.
- **Submit button:** the spinner goes on `event.submitter` (the button that was clicked), not the first submit button; during `redirectDelay` the form stays frozen.
- **Lifecycle:** `CGEForm.destroyAll(root = document)` destroys instances inside `root` or disconnected; `CGEForm.init(root)` prunes disconnected instances first.
