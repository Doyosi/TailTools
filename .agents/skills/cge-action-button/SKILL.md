---
name: cge-action-button
description: High-performance, declarative action button and confirmation interceptor plugin designed specifically for Laravel Blade and Tailwind CSS v4.3+. Bridges UI buttons directly with confirmation modals (CGEAlert), background command execution (Axios, Fetch), form submissions, dynamic loading spinner states, and toast notifications. Handles destructive actions (delete, restore, purge) via confirmation dialogs or triggers instant background actions (logout, cache clear, webhook ping, queue restart) with a single HTML data attribute.
---

# CGEActionButton Agent Skill

Use this skill when implementing, configuring, or debugging declarative action buttons, confirmation interceptors, table row action guards, and background command execution in **TailTools** with Tailwind CSS v4.3+ and Laravel Blade.

---

## 1. When to Use CGEActionButton

Activate this skill when the user requests:
- "Add a confirmation dialog before executing a delete or restore button."
- "Implement exact type-to-confirm verification (e.g. `data-cge-require="DELETE"`)."
- "Add loading spinners to buttons that automatically disable during async execution."
- "Prevent double-submitting forms or double-clicking table action buttons."
- "Lock sibling action buttons in a table row when one action is active (`data-cge-lock-group="row"`)."
- "Create direct background command buttons (logout, clear cache, ping webhook) that trigger instant loading spinners and toast notifications."
- "Support dynamic elements loaded via Livewire, Alpine, Vue, Turbo, or Datatables pagination without re-binding JavaScript."
- "Create reusable Laravel Blade components `<x-cge-action-button>` or `<x-cge-delete-button>`."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEActionButton/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEActionButton } from 'tailtools';

// Automatically initializes global event delegation on document
initTailTools();

// Global access for Alpine.js or inline scripts
window.CGEActionButton = CGEActionButton;
```

---

## 3. Core Declarative Markup Patterns

### A. Destructive Delete Action with CGEAlert Dialog
```html
<button type="button"
        data-cge-action="delete"
        data-cge-url="/admin/tenants/42"
        data-cge-method="DELETE"
        data-cge-title="Delete Tenant #42?"
        data-cge-message="All services and user accounts will be permanently suspended."
        data-cge-confirm-text="Yes, Delete"
        data-cge-loading-text="Deleting..."
        data-cge-success-toast="Tenant #42 has been deleted."
        class="px-3 py-1.5 rounded-sm bg-rose-600 text-white text-xs font-semibold cursor-pointer">
    Delete Tenant
</button>
```

### B. High-Security Critical Action (Type-to-Confirm)
```html
<button type="button"
        data-cge-action="delete"
        data-cge-require="PURGE"
        data-cge-url="/api/clusters/us-east-1"
        data-cge-method="DELETE"
        data-cge-title="Purge Production Cluster"
        data-cge-message="Type PURGE to verify permanent deletion:"
        data-cge-loading-text="Purging Cluster..."
        data-cge-success-toast="Cluster successfully purged!"
        class="px-4 py-2 rounded-sm bg-rose-600 text-white text-xs font-semibold cursor-pointer">
    Purge Cluster
</button>
```

### C. Direct Background Command (Instant Action, No Dialog)
```html
<button type="button"
        data-cge-action="direct"
        data-cge-url="/admin/commands/cache-clear"
        data-cge-method="POST"
        data-cge-loading-text="Clearing Cache..."
        data-cge-success-toast="Application cache successfully purged!"
        class="px-3.5 py-2 rounded-sm bg-slate-900 text-white text-xs font-semibold cursor-pointer">
    Clear Cache
</button>
```

### D. Table Row Sibling Lock Protection
```html
<tr data-cge-action-group>
  <td>Acme Corp</td>
  <td>
    <a href="/edit" data-cge-action="link" class="px-2 py-1 bg-slate-100 rounded-sm">Edit</a>
    <!-- Locking sibling action buttons in row while active -->
    <button type="button"
            data-cge-action="delete"
            data-cge-lock-group="row"
            data-cge-url="/tenants/1"
            data-cge-method="DELETE"
            class="px-2 py-1 bg-rose-50 text-rose-700 rounded-sm">
      Delete
    </button>
  </td>
</tr>
```

---

## 4. Programmatic JavaScript API

```javascript
import { CGEActionButton } from 'tailtools';

// Execute action on any button programmatically
const btn = CGEActionButton.getOrCreate('#my-button');
await btn.execute();

// Or static shorthand:
await CGEActionButton.execute('#my-button');

// Event hooks
btn.on('confirm', ({ action }) => console.log('Confirmed:', action));
btn.on('success', ({ result }) => console.log('Succeeded:', result));
btn.on('error', ({ error }) => console.error('Failed:', error));
```

---

## 5. Declarative Attributes Reference

| Attribute | Accepted Values | Description |
| :--- | :--- | :--- |
| `data-cge-action` | `delete`, `restore`, `confirm`, `danger`, `direct`, `link` | Action mode / archetype. |
| `data-cge-require` | `string` | Exact phrase required to confirm (e.g. `'DELETE'`). |
| `data-cge-url` | `string` (URL) | Direct async target endpoint. |
| `data-cge-method` | `POST`, `DELETE`, `PUT`, `PATCH`, `GET` | HTTP method. |
| `data-cge-form` | `#selector` | Target form to submit. |
| `data-cge-ajax` | `true`, `false` | Submit form via async AJAX. |
| `data-cge-loading-text` | `string` | Text displayed beside spinner. |
| `data-cge-lock-group` | `row`, `#selector` | Disables sibling buttons in row during action. |
| `data-cge-success-toast` | `string` | Notification message on success. |
| `data-cge-error-toast` | `string` | Error notification message override. |
| `data-cge-redirect` | `string` (URL) | Redirect URL upon success. |
| `data-cge-instant` | `true`, `false` | Bypasses dialog even for delete/danger actions. |
| `data-cge-simulate` | `number` (ms) | Simulated network latency for UI testing / demos (e.g. `1000`). |

---

## 6. Strict Design System Rule
- **Strict Border Radius:** Always apply **`rounded-sm`** for buttons, badges, inputs, cards, and modal dialogs.
- **Forbidden:** Never use `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or `rounded-xl`.
