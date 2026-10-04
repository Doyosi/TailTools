# CGEForm Implementation Plan

## 1. Executive Overview
`CGEForm` is a high-performance, reactive AJAX form handling plugin engineered specifically for Laravel Blade and modern Tailwind CSS v4+ frontends. It bridges client-side interactions with Laravel's backend validation responses, featuring automatic 422 JSON error binding (with full support for nested and array field notations), pluggable notification drivers (CGEToast, CGEAlert, native dialogs, and SweetAlert2), multi-driver HTTP requests (Axios, Fetch, XHR), field state preservation (preventing accidental re-enabling of locked fields), and an HTML-aware localization engine.

---

## 2. Architecture & Design Principles

### 2.1 File Architecture
- `plugins/CGEForm/CGEForm.js`: Core ES2022+ class with zero external dependencies (peer-dependency on `axios`).
- `plugins/CGEForm/CGEForm.d.ts`: Complete TypeScript declarations for options, handlers, and event structures.
- `plugins/CGEForm/style.css`: Tailwind CSS v4 styling rules for form groups, validation feedback, error outlines, and animations.
- `plugins/CGEForm/index.js`: Clean barrel export for ES module bundlers and tree-shaking.

### 2.2 HTTP Multi-Driver Engine
- **Drivers:**
  - `'axios'`: Default. Leverages `window.axios` or imported Axios instance. Cleanly falls back to `fetch` if Axios is unavailable.
  - `'fetch'`: Standard browser `window.fetch`.
  - `'xhr'`: Native `XMLHttpRequest` with upload progress event support.
- **HTTP Methods:** `POST`, `GET`, `PUT`, `PATCH`, `DELETE` (honoring Laravel `_method` spoofing input).
- **Header Automation:**
  - `X-CSRF-TOKEN`: Extracted from `<meta name="csrf-token">` or `<input name="_token">`.
  - `X-Requested-With`: `'XMLHttpRequest'`.
  - `Accept`: `'application/json'`.
- **Multipart & File Uploads:** Detects file inputs or `multipart/form-data` and delegates to browser-managed `FormData` boundaries.

### 2.3 Pluggable Feedback & Notification Bridge
- Visual notification drivers for success, validation errors, and server errors:
  - `'toast'`: Triggers `CGEToast` (`success`, `error`, `warning`).
  - `'alert'`: Triggers `CGEAlert` dialogs.
  - `'native'`: Browser `window.alert()`.
  - `'sweetalert'`: Integrates with `window.Swal` if present without bundling SweetAlert2.
  - `'custom'`: User-provided callback `(status, message, payload, form) => void`.
  - `'none'`: Silent execution.
- Message resolution order: `response.data.message` -> `response.data.status` -> i18n fallback.

### 2.4 Laravel 422 Error Binding & DOM Hierarchy
Standard wrapper hierarchy:
```html
<div class="cge-form-group">
  <label for="choices">Field Label</label>
  <input name="choices[]" id="choice_0" class="cge-input" />
  <span class="cge-feedback text-red-500 text-sm hidden" data-cge-feedback="choices"></span>
</div>
```
- **Name & Array/Dot Notation Resolution:**
  - Simple: `email` -> `name="email"` and `[data-cge-feedback="email"]`.
  - Numeric arrays: `choices.0` or `choices` -> matches `choices[]` or `choices[0]`.
  - Keyed/associative arrays: `choices2.a` -> matches `choices2[a]` or `choices2.a`.
  - Nested associative: `user.profile.bio` -> matches `user[profile][bio]`.
- **Feedback Container Discovery:** Explicit `[data-cge-feedback="..."]` -> `.cge-feedback` -> dynamic fallback creation inside `.cge-form-group`.
- **Live Input Clearing:** Automatically clears error state and hides feedback message when user interacts with the input.

### 2.5 HTML-Aware Localization (i18n) Engine
- Hierarchical resolution:
  1. Form element data-attribute (`data-cge-i18n='{...}'`).
  2. Instance configuration options (`new CGEForm(form, { translations: {...} })`).
  3. Global translations (`CGEForm.setTranslations({...})` or `CGEForm.setLocale('tr', {...})`).
  4. Default dictionary with fallback strings and SVG spinners.
- Dynamic variable interpolation (`form.t('key', { name: 'Value' })`).

### 2.6 State Management & Memory Guard
- Freezes form fields and switches submit button to `loading-indicator` during request.
- **State Memory Guard:** Records pre-disabled and readonly inputs before submission using a Set/WeakSet; only re-enables inputs that were originally editable.

### 2.7 Dual Event Dispatching
- Fluent instance methods: `form.on('submit' | 'success' | 'error' | 'invalid' | 'complete', callback)`.
- DOM CustomEvents: `cge:form:submit`, `cge:form:success`, `cge:form:error`, `cge:form:invalid`, `cge:form:complete`, `cge:form:redirect`.

---

## 3. Implementation Steps & Milestones
1. Write architectural plan (`ai-todos/plans/plan-CGEForm.md`).
2. Write phase checklist (`ai-todos/todo-checks/check-CGEForm.md`).
3. Implement `plugins/CGEForm/CGEForm.js`.
4. Implement `plugins/CGEForm/CGEForm.d.ts`.
5. Implement `plugins/CGEForm/style.css`.
6. Implement `plugins/CGEForm/index.js`.
7. Integrate into `src/index.ts` and `src/style.css`.
8. Create full documentation suite in `docs/CGEForm/`.
9. Create AI agent skill in `.agents/skills/cge-form/SKILL.md` and `.agents/skills/cge-form-skill.md`.
10. Integrate interactive test sandbox in `index.html` and verify in browser.

## Maintenance audit — 2026-10-04
Laravel method spoofing across all drivers; prevent concurrent submissions; remove delegated error listeners on destroy.
Preserve existing public methods, CSS, Blade markup and exports. Verify programmatic and declarative behavior with regression fixtures; update docs and consumer guidance. No new dependencies or redesign.

## 2026-10-04 ek bakım planı
REPORTS.md içindeki tüm bakım adaylarını mevcut API ve tasarımı koruyarak uygulama: lifecycle/abort, ortak overlay sahipliği, erişilebilirlik, form verisi, paket/type doğrulaması ve belge tekilleştirme. Plugin özelindeki davranışlar regresyonlarla doğrulanacak.
