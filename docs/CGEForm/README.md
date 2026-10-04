# CGEForm

High-performance, reactive AJAX form handling plugin engineered specifically for **Laravel Blade** and modern **Tailwind CSS v4+** frontends.

`CGEForm` streamlines form submission and validation handling by automating Laravel 422 JSON validation error binding (with full support for nested objects and array field notation), connecting pluggable response notifications (CGEToast, CGEAlert, native browser alerts, or external SweetAlert2), managing multi-driver HTTP requests (Axios, Fetch, or XHR), preserving disabled field states during retries, and providing a layered, HTML-aware localization (i18n) engine.

---

## Key Features

- ⚡ **Multi-Driver HTTP Engine:** Choose between `axios` (default, with auto-fallback to `fetch`), native `fetch`, or `xhr` with upload progress events.
- 🎯 **Automated Laravel 422 Error Binding:** Automatically parses and binds validation errors to form fields, with full resolution for:
  - Simple fields (`email` -> `name="email"`)
  - Numeric arrays (`choices.0` -> `name="choices[]"` or `name="choices[0]"`)
  - Keyed / associative arrays (`choices2.a` -> `name="choices2[a]"`)
  - Deeply nested objects (`user.profile.bio` -> `name="user[profile][bio]"`)
- 🛡️ **State Memory Guard:** Freezes inputs and transforms submit buttons during requests while remembering pre-disabled/readonly fields (e.g. locked email or user ID in edit views) so they are **never** accidentally re-enabled upon validation errors.
- 🔔 **Pluggable Feedback Bridge:** Route success, validation error, and server error messages directly to `CGEToast`, `CGEAlert`, native `window.alert()`, external `SweetAlert2` (bridged without bundling), or custom callbacks.
- 🌐 **HTML-Aware Localization (i18n):** Layered translation resolution supporting custom SVG loading spinners, localized button labels, and variable placeholders (e.g. `:field`).
- 🔄 **Redirect Interceptor:** Automatically honors server-guided redirects (`payload.redirect` or `payload.data.redirect`) with configurable delays and cancellation hooks.
- 📡 **Dual Event Binding:** Listen via fluent instance chaining (`form.on('success', callback)`) or standard bubbling DOM CustomEvents (`cge:form:success`).

---

## Quick Start

### 1. Installation & Setup

```bash
npm install tailtools
```

In your main entry file (`resources/js/app.js` or `src/index.ts`):

```javascript
import 'tailtools/style.css';
import { CGEForm } from 'tailtools';

// Automatically initializes all forms marked with [data-cge-form]
CGEForm.init();
```

### 2. Declarative Usage in Laravel Blade

```html
<form
  action="{{ route('users.store') }}"
  method="POST"
  data-cge-form
  data-cge-feedback="toast"
  data-cge-loading-text="Saving..."
>
  @csrf

  <!-- Standard Form Group Wrapper -->
  <div class="cge-form-group">
    <label for="name">Full Name</label>
    <input type="text" name="name" id="name" class="cge-input" placeholder="Alex Rivera">
    <span class="cge-feedback hidden" data-cge-feedback="name"></span>
  </div>

  <div class="cge-form-group">
    <label for="email">Email Address</label>
    <input type="email" name="email" id="email" class="cge-input" placeholder="alex@example.com">
    <span class="cge-feedback hidden" data-cge-feedback="email"></span>
  </div>

  <button type="submit" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-sm">
    Save User
  </button>
</form>
```

### 3. Programmatic Instantiation

```javascript
import { CGEForm } from 'tailtools';

const form = new CGEForm('#user-form', {
  driver: 'axios', // or 'fetch', 'xhr'
  feedback: {
    type: 'toast',
    onValidationError: 'alert' // use modal alert for validation errors
  },
  resetOnSuccess: true
});

form.on('success', ({ data }) => {
  console.log('Saved successfully:', data);
});

form.on('invalid', ({ errors }) => {
  console.warn('Validation failed:', errors);
});
```

---

## Documentation Navigation

- 📖 [**usage.md**](./usage.md): Comprehensive configuration options, API methods, and event hooks.
- 🎨 [**laravel-blade.md**](./laravel-blade.md): Reusable Blade components (`<x-cge-form>`, `<x-cge-form-group>`), array validation, and CSRF patterns.
- 💡 [**examples.md**](./examples.md): Practical recipes including array fields, file uploads, feedback drivers, SweetAlert2 bridge, and i18n switching.
- ⚙️ [**api.md**](./api.md): Full TypeScript interfaces, constructor options, and DOM CustomEvent specifications.


## Maintenance notes (2026-10-04)

PUT/PATCH/DELETE forms use POST with `_method` across Axios, Fetch and XHR, including Blade forms that already contain `@method`. Concurrent submit calls are ignored until the active submission completes. `destroy()` removes delegated input/change handlers and removes `novalidate` only when added by the plugin.

## Extended maintenance contract (2026-10-04)

All drivers send Laravel multipart PUT/PATCH/DELETE as POST plus _method. FormData is captured before freezing and includes the SubmitEvent submitter. Concurrent submissions are prevented. Destroy aborts Axios/Fetch/XHR, cancels redirect timers, restores frozen controls and suppresses late callbacks/events; delayed beforeSubmit cannot start a request afterward. Input/change listeners and plugin-added novalidate are restored on teardown.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.
