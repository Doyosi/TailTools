# CGEActionButton - Declarative Action Button & Confirmation Interceptor

`CGEActionButton` is a high-performance, declarative action button and confirmation interceptor plugin designed specifically for **Tailwind CSS v4.3+** and **Laravel Blade** environments.

It bridges UI buttons directly with confirmation modals (`CGEAlert`), background async commands (`Axios`, `Fetch`), form submissions, dynamic loading spinner states, and toast notifications (`CGEToast`) with zero custom JavaScript.

---

## Key Features

- **Mode 1: Confirmation Gatekeeper (Dialog First):**
  - Seamlessly intercepts clicks on destructive (`delete`, `danger`), recovery (`restore`), or general (`confirm`, `warning`) buttons.
  - Triggers rich confirmation dialogs via `CGEAlert` with automatic fallback to native dialogs.
  - Supports high-security exact-match verification (`data-cge-require="DELETE"`).
- **Mode 2: Direct Command Execution (Instant Action):**
  - Instant background action execution (`data-cge-action="direct"` or `data-cge-instant="true"`): logout, cache clearing, webhook triggering, queue restart.
- **Form Submitter & Laravel Method Spoofing:**
  - Injects hidden `<input type="hidden" name="_method" value="DELETE">` for Laravel resource routes.
  - Submits forms natively or asynchronously (`data-cge-ajax="true"`).
- **Direct Async Endpoint Target:**
  - Dispatches HTTP requests (`POST`, `DELETE`, `PUT`, `PATCH`, `GET`) without requiring a `<form>` wrapper.
  - Automatically attaches `X-CSRF-TOKEN` from `<meta name="csrf-token">` or cookie.
  - Dispatches using `window.axios` if available or native `fetch()`.
- **Dynamic Button States & Loading Spinners:**
  - Automatically disables button and sets `aria-busy="true"` on execution to prevent duplicate clicks.
  - Preserves button layout dimensions (`minWidth`) to eliminate layout shifts.
  - Replaces button content with an animated SVG spinner and localized loading label.
  - Locks sibling action buttons in table rows (`data-cge-lock-group="row"`).
- **Global Event Delegation Engine:**
  - Global listener on `document` ensures dynamically injected buttons (Livewire, Datatables, Turbo Drive, Vue, Alpine) work immediately with zero manual re-binding.
- **Strict Design System Compliance:**
  - Strictly follows the **`rounded-sm`** border radius standard.

---

## Quick Start

### 1. Stylesheet Setup (Tailwind CSS v4)
In your main CSS file (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGEActionButton stylesheet */
@import "tailtools/plugins/CGEActionButton/style.css";
```

### 2. Auto-Initialization
In your JavaScript entry (`src/index.ts` or `resources/js/app.js`):

```javascript
import { initTailTools, CGEActionButton } from 'tailtools';

// Automatically initializes global event delegation on document
initTailTools();

// Or manual standalone initialization:
CGEActionButton.init();
```

---

## Declarative HTML Syntax Examples

### 1. Destructive Delete Button with Confirmation Dialog
```html
<button type="button"
        data-cge-action="delete"
        data-cge-url="/admin/users/42"
        data-cge-method="DELETE"
        data-cge-title="Delete User Account?"
        data-cge-message="All personal profile data will be permanently purged."
        data-cge-confirm-text="Yes, Delete Account"
        data-cge-success-toast="User account has been deleted."
        class="px-3 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
    Delete User
</button>
```

### 2. Critical Action with Type-to-Confirm Requirement
```html
<button type="button"
        data-cge-action="delete"
        data-cge-require="PURGE"
        data-cge-url="/api/clusters/us-east-1"
        data-cge-method="DELETE"
        data-cge-title="Purge Production Cluster"
        data-cge-message="This action cannot be undone. Type PURGE to confirm:"
        data-cge-loading-text="Purging Cluster..."
        data-cge-success-toast="Production cluster successfully purged!"
        class="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
    Purge Production Cluster
</button>
```

### 3. Direct Async Command (No Modal, Instant Spinner)
```html
<button type="button"
        data-cge-action="direct"
        data-cge-url="/admin/commands/cache-clear"
        data-cge-method="POST"
        data-cge-loading-text="Clearing Cache..."
        data-cge-success-toast="Application cache successfully purged!"
        class="px-4 py-2 rounded-sm bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer">
    Clear Application Cache
</button>
```

---

## Documentation Index

- [Usage Guide (`usage.md`)](usage.md) - Configuration options, data attributes, error handling, and API methods.
- [Laravel Blade Guide (`laravel-blade.md`)](laravel-blade.md) - Reusable Blade components `<x-cge-action-button>` and `<x-cge-delete-button>`.
- [Examples & Recipes (`examples.md`)](examples.md) - Practical patterns for Datatables, Livewire, and command buttons.
- [API Reference (`api.md`)](api.md) - TypeScript interfaces, options schema, and DOM event payloads.


## Maintenance notes (2026-10-04)

Repeated execute calls while confirmation is pending are ignored, preventing duplicate dialogs/requests. Canceling or failing confirmation releases the guard. Partial per-instance translations retain global defaults.

## Extended maintenance contract (2026-10-04)

Confirmation is serialized. AJAX FormData is captured before freezing and includes the clicked button name/value exactly once. Multipart PUT/PATCH/DELETE uses POST + _method; GET uses query parameters, with no request body. Direct requests without FormData keep their requested method. Destroy cancels requests, delays and redirects and prevents late actions/results. Partial translations keep defaults.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

## Stability fixes (October 2026)

Confirmation now intercepts clicks in the capture phase (inline `onclick`, Alpine `@click` and `wire:click` run once, after confirmation), confirmed form submits go through `requestSubmit()` (CGEForm AJAX and submitter values work), plain anchors navigate after confirmation unless `data-cge-ajax` / `data-cge-method` / `data-cge-url` is set, and the encrypted `XSRF-TOKEN` cookie is only sent as `X-XSRF-TOKEN`. New options: `followRedirects`, `redirectTimeout`, `axiosInstance`; new static `destroyAll(root)`; `init()` accepts a root or selector. Only `redirect` / `redirect_url` JSON keys redirect and only string `message` values are toasted. See [usage](usage.md#stability-fixes-october-2026).
