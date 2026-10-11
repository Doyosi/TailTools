# Architectural Plan: CGEActionButton Plugin

## 1. Executive Summary & Mission
**CGEActionButton** is a high-performance, declarative action button and confirmation interceptor plugin designed specifically for **Tailwind CSS v4.3+** and **Laravel Blade** applications.
It bridges UI buttons with confirmation dialogs (CGEAlert), background async command execution (Axios, Fetch), form submissions, dynamic loading spinner states, and toast notifications (CGEToast).
It allows developers to execute destructive actions (delete, restore, purge) or instant background actions (logout, cache clear, webhook ping, queue restart) via pure HTML data attributes with zero bespoke JavaScript.

---

## 2. Technical Baseline & Constraints
- **Runtime:** Native ECMAScript 2022+ (zero mandatory runtime dependencies).
- **Type Safety:** Full TypeScript declarations in `plugins/CGEActionButton/CGEActionButton.d.ts`.
- **CSS Architecture:** Tailwind CSS v4 CSS-first (`@import "tailwindcss";`, `@import "tailwind-animations";`).
- **Design System Rule:** Strictly **`rounded-sm`** for all buttons, dialog inputs, badges, and feedback components.
- **Global Event Delegation:** Listens on `document` so dynamically injected DOM nodes (Livewire, Datatables, Turbo Drive, Vue, Alpine) work immediately with zero manual re-binding.

---

## 3. Core Architecture & Operating Modes

### Mode 1: Confirmation Gatekeeper (Dialog First)
- Intercepts clicks on elements with `data-cge-action="delete|restore|confirm|danger|warning"` or `data-cge-confirm`.
- Triggers a rich `CGEAlert` dialog:
  - Destructive delete: `CGEAlert.delete(title, message, options)`
  - Restore action: `CGEAlert.restore(title, message, options)`
  - Exact match verification: `data-cge-require="DELETE"` passes `requireInput: "DELETE"` to `CGEAlert`.
  - General confirm: `CGEAlert.confirm(title, message, options)`.
  - Fallback: `window.confirm()` if `CGEAlert` is absent.
- On Cancel: restores button state, dispatches `cge:action:cancel`.
- On Confirm: transitions to loading state, dispatches `cge:action:confirm`, executes action.

### Mode 2: Direct Command Execution (Instant Action)
- For actions marked `data-cge-action="direct"` or `data-cge-instant="true"`:
- Bypasses confirmation dialog, immediately activates button loading spinner, and fires target request.

---

## 4. Execution Targets & Engines

1. **Form Submitter Target:**
   - If placed inside a `<form>` or linked via `data-cge-form="#selector"`:
   - Injects method spoofing if `data-cge-method="DELETE|PUT|PATCH"` (`<input type="hidden" name="_method" value="...">`).
   - Dispatches form submission or handles via AJAX if `data-cge-ajax="true"`.
2. **Direct Async Endpoint Target:**
   - Elements with `data-cge-url="/api/action"` or `href="/api/action"`:
   - Automatically retrieves `X-CSRF-TOKEN` from `<meta name="csrf-token">`.
   - Uses `window.axios` if present, falls back to native `fetch()`.
   - Handles JSON response `{ message, redirect }`.
3. **Browser Navigation Interceptor:**
   - Elements with `<a>` tag and `data-cge-action="link"`:
   - Confirms navigation before setting `window.location.href`.

---

## 5. Dynamic Button States & Loading Spinners
- **State Locking:** Sets `button.disabled = true`, `aria-busy = "true"`.
- **Lock Group:** If `data-cge-lock-group="row"`, disables all sibling action buttons in the same container.
- **Dimension Lock & Spinner:** Locks `minWidth` to avoid layout shifts, replaces innerHTML with SVG spinner + `data-cge-loading-text` (or localized default).
- **Restoration:** Restores cached innerHTML, unlocks button and siblings on completion or cancellation.

---

## 6. Feedback Bridge (Toasts & Alerts)
- **Success:** Triggers `CGEToast.success(msg)` or uses `data-cge-success-toast`.
- **Redirect:** Automatically navigates if payload contains `redirect` or HTTP redirect header.
- **Error:** Catches server exceptions and displays `CGEToast.error()` or `CGEAlert.alert()`.

---

## 7. Deliverables & File Tree
```text
TailTools/
├── plugins/CGEActionButton/
│   ├── CGEActionButton.js
│   ├── CGEActionButton.d.ts
│   ├── style.css
│   └── index.js
├── docs/CGEActionButton/
│   ├── README.md
│   ├── usage.md
│   ├── laravel-blade.md
│   ├── examples.md
│   └── api.md
├── .agents/skills/
│   ├── cge-action-button/SKILL.md
│   └── cge-action-button-skill.md
├── ai-todos/
│   ├── plans/plan-CGEActionButton.md & CGEActionButton-plan.md
│   └── todo-checks/check-CGEActionButton.md & todo-cheks/CGEActionButton-checklist.md
├── index.html (Sandbox demo with Data Table, Direct Commands, and Dynamic Elements)
└── src/ (Core export & style import)
```

## Maintenance audit — 2026-10-04
Prevent parallel confirmation workflows; preserve default translations when partially overridden.
Preserve existing public methods, CSS, Blade markup and exports. Verify programmatic and declarative behavior with regression fixtures; update docs and consumer guidance. No new dependencies or redesign.

## 2026-10-04 ek bakım planı
REPORTS.md içindeki tüm bakım adaylarını mevcut API ve tasarımı koruyarak uygulama: lifecycle/abort, ortak overlay sahipliği, erişilebilirlik, form verisi, paket/type doğrulaması ve belge tekilleştirme. Plugin özelindeki davranışlar regresyonlarla doğrulanacak.

## Stability fixes (October 2026)

Scope: capture-phase delegation with single click replay, `requestSubmit` via `submitConfirmedForm`, anchors navigate unless AJAX is explicit, `_isRedirecting` reset + `redirectTimeout`, shared CSRF helper (`X-XSRF-TOKEN` for cookies), `followRedirects`, `axiosInstance`, string-only toasts and `redirect`/`redirect_url` keys, `init(root | selector)`, `destroyAll(root)`, base transition in `@layer components`.
