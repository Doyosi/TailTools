---
name: cge-action-button-skill
description: Universal agent operational guide for CGEActionButton, a declarative action button and confirmation interceptor plugin designed specifically for Laravel Blade and Tailwind CSS v4.3+. Bridges UI buttons directly with CGEAlert confirmation dialogs, async command execution, loading spinner states, sibling row guards, and CGEToast notifications.
---

# CGEActionButton Universal Agent Skill

This skill guides AI assistants (Antigravity, Cursor, Codex, Claude Code) in implementing, styling, and debugging the `CGEActionButton` plugin from **TailTools**.

---

## Architecture Overview

- **Source Code:** `plugins/CGEActionButton/CGEActionButton.js`
- **TypeScript Types:** `plugins/CGEActionButton/CGEActionButton.d.ts`
- **Tailwind v4 Styles:** `plugins/CGEActionButton/style.css`
- **Documentation:** `docs/CGEActionButton/` (`README.md`, `usage.md`, `laravel-blade.md`, `examples.md`, `api.md`)
- **Zero Runtime Dependencies:** Zero external npm packages required (peer dependency on `axios` if selected).

---

## Core Capabilities

1. **Confirmation Gatekeeper:**
   - Detects `data-cge-action="delete|restore|confirm|danger|warning"` or `data-cge-confirm`.
   - Triggers `CGEAlert` dialogs with customizable titles, descriptions, and confirm/cancel button text.
   - Supports `data-cge-require="KEYWORD"` for type-to-confirm safety.
2. **Direct Command Execution:**
   - Instant action execution (`data-cge-action="direct"` or `data-cge-instant="true"`).
   - Skips confirmation dialog and immediately engages loading state.
3. **Execution Engines:**
   - **Form Submitter:** Injects Laravel `_method` spoofing inputs and submits natively or via AJAX.
   - **Direct Async Endpoint:** Dispatches HTTP requests with automatic CSRF token attachment (`X-CSRF-TOKEN`).
   - **Link Interceptor:** Confirms before navigating anchor links.
4. **Dynamic States & Sibling Locks:**
   - Freezes button (`disabled = true`, `aria-busy = "true"`).
   - Preserves width (`minWidth = offsetWidth`) to prevent layout shifts.
   - Swaps content with SVG spinner and localized loading label.
   - `data-cge-lock-group="row"` disables all other action buttons in the same row during active operations.
5. **Feedback Bridge:**
   - Triggers `CGEToast.success()` on success.
   - Handles automatic redirects (`data-cge-redirect` or response `{ redirect: '/url' }`).
   - Catches errors and triggers `CGEToast.error()`.
6. **Global Event Delegation:**
   - Automatically supports dynamically injected elements (Livewire, Datatables, Turbo Drive, Alpine/Vue).
7. **Strict Styling Constraint:**
   - Always use **`rounded-sm`** for buttons, badges, inputs, and cards.

---

## Declarative Quick Reference

```html
<!-- Destructive Delete with CGEAlert Confirm -->
<button data-cge-action="delete"
        data-cge-url="/api/users/12"
        data-cge-method="DELETE"
        data-cge-title="Delete User?"
        data-cge-success-toast="User deleted."
        class="px-3 py-1.5 rounded-sm bg-rose-600 text-white text-xs font-semibold cursor-pointer">
  Delete User
</button>

<!-- Direct Background Command (No Dialog) -->
<button data-cge-action="direct"
        data-cge-url="/admin/cache-clear"
        data-cge-method="POST"
        data-cge-loading-text="Clearing Cache..."
        data-cge-success-toast="Cache cleared!"
        class="px-3 py-1.5 rounded-sm bg-slate-900 text-white text-xs font-semibold cursor-pointer">
  Clear Cache
</button>
```
