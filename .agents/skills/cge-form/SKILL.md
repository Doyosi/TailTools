---
name: cge-form
description: High-performance, reactive AJAX form handling plugin designed specifically for Laravel Blade and modern Tailwind CSS v4+ frontends. Features automated Laravel 422 JSON validation error binding with support for complex nested/array inputs, pluggable notification drivers (CGEToast, CGEAlert, native window dialogs, and external SweetAlert2), multi-driver HTTP requests (Axios default, Fetch, XHR), redirect interceptors, dual event binding (instance .on() + DOM CustomEvents), button loading spinners/states, intelligent field lock preservation, and an HTML-aware localization (i18n) engine.
---

# CGEForm Agent Skill

Use this skill when implementing, configuring, or debugging reactive AJAX forms, Laravel 422 JSON validation binding, form feedback alerts/toasts, array input validation, file upload progress, or declarative Blade form components using the **TailTools** `CGEForm` plugin.

---

## 1. When to Use CGEForm

Apply `CGEForm` whenever the user asks for:
- "Handle AJAX form submissions in Laravel Blade without page reloads."
- "Automatically bind Laravel 422 validation errors to inputs and show inline error messages."
- "Support validation errors for array fields like `choices[]`, `choices.0`, or keyed fields like `choices2[a]`."
- "Show toast or modal alert notifications on form success, validation failure, or server error."
- "Bridge AJAX form responses to CGEToast, CGEAlert, native dialogs, or SweetAlert2."
- "Disable inputs and show a loading spinner on the submit button during submission."
- "Ensure locked or pre-disabled inputs (e.g. user ID in profile edit) stay disabled even if validation fails."
- "Redirect automatically when the server returns a redirect URL in the JSON payload."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEForm/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEForm } from 'tailtools';

// Initializes all forms with [data-cge-form]
initTailTools();

// Expose globally on window
window.CGEForm = CGEForm;
```

---

## 3. Core API Quick Reference

### Programmatic Instantiation

```javascript
import { CGEForm } from 'tailtools';

const form = new CGEForm('#my-form', {
  driver: 'axios', // 'axios' | 'fetch' | 'xhr'
  feedback: {
    type: 'toast',
    onValidationError: 'toast',
    onError: 'alert'
  },
  resetOnSuccess: true
});

form.on('success', ({ data }) => {
  console.log('Saved:', data);
});

form.on('invalid', ({ errors }) => {
  console.warn('422 Validation errors:', errors);
});
```

### Declarative Blade Component Usage

```html
<form
  action="{{ route('users.store') }}"
  method="POST"
  data-cge-form
  data-cge-feedback="toast"
  data-cge-loading-text="Saving..."
>
  @csrf

  <div class="cge-form-group">
    <label for="name">Full Name</label>
    <input type="text" name="name" id="name" class="cge-input">
    <span class="cge-feedback hidden" data-cge-feedback="name"></span>
  </div>

  <div class="cge-form-group">
    <label for="choice_0">Choice Item #1</label>
    <input type="text" name="choices[]" id="choice_0" class="cge-input">
    <span class="cge-feedback hidden" data-cge-feedback="choices.0"></span>
  </div>

  <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-sm">
    Submit
  </button>
</form>
```

---

## 4. Laravel 422 Error Resolution Conventions

- Simple key `email` matches:
  - `<input name="email">`
  - `<span data-cge-feedback="email">`
- Numeric array key `choices.0` matches:
  - `<input name="choices[0]">` or the 0th item of `<input name="choices[]">`
  - `<span data-cge-feedback="choices.0">` or `<span data-cge-feedback="choices">`
- Keyed associative key `choices2.a` matches:
  - `<input name="choices2[a]">`
  - `<span data-cge-feedback="choices2.a">` or `<span data-cge-feedback="choices2[a]">`
- Deeply nested key `user.profile.bio` matches:
  - `<textarea name="user[profile][bio]">`
  - Container inside matching `.cge-form-group`

---

## 5. Notification Feedback Drivers

```javascript
// Route to CGEToast
feedback: 'toast'

// Route to CGEAlert modal dialog
feedback: 'alert'

// Route to external SweetAlert2 (if window.Swal exists)
feedback: 'sweetalert'

// Custom handler callback
feedback: {
  onSuccess: (status, message, payload, form) => {
    alert(message);
  }
}
```

---

## 6. DOM Events Dispatched

- `cge:form:submit` (`detail: { form, formData, url, method }`)
- `cge:form:success` (`detail: { form, response, data }`)
- `cge:form:invalid` (`detail: { form, errors, response }`)
- `cge:form:error` (`detail: { form, error, response }`)
- `cge:form:complete` (`detail: { form, ok, response }`)
- `cge:form:redirect` (`detail: { form, url, response }`)
- `cge:form:progress` (`detail: { form, percent, loaded, total }`)
