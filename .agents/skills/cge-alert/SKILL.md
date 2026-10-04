---
name: cge-alert
description: Promise-based native JavaScript alert, confirmation, and dialog plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features built-in archetypes (info alert, confirmation, destructive delete, restore, prompt input), dynamic multi-button layouts, type-to-confirm safety verification, focus-trapping accessibility, customizable i18n translation dictionary, and declarative data-attribute triggers for Laravel Blade actions.
---

# CGEAlert Agent Skill

Use this skill when implementing, configuring, or debugging alert dialogs, confirmation prompts, destructive deletion verifications, or declarative Blade button triggers using the **TailTools** `CGEAlert` plugin.

---

## 1. When to Use CGEAlert

Apply `CGEAlert` whenever the user asks for:
- "Add a confirmation dialog before deleting an item in Laravel or Tailwind."
- "Show an alert or confirm prompt returning a JavaScript Promise (`await CGEAlert.confirm()`)."
- "Require the user to type 'DELETE' or a confirmation phrase before clicking confirm (type-to-confirm)."
- "Create an input prompt dialog asking for an email, password, or choice with validation."
- "Intercept Laravel Blade form submissions declaratively (`data-cge-alert='delete'`)."
- "Provide a modal with Save, Don't Save, and Cancel buttons."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGEAlert/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGEAlert } from 'tailtools';

// Initializes declarative triggers across document
initTailTools();

// Expose globally on window
window.CGEAlert = CGEAlert;
```

---

## 3. Core API Quick Reference

### Promise-Based Execution

```javascript
import { CGEAlert } from 'tailtools';

// Simple Alert
await CGEAlert.alert('Backup Finished', 'All database tables were exported.');

// Standard Confirmation
const res = await CGEAlert.confirm('Publish Post?', 'Visible to everyone immediately.');
if (res.isConfirmed) {
  publishPost();
}

// Destructive Deletion
const deleteRes = await CGEAlert.delete('Delete API Key?', 'All integrations will break.');
if (deleteRes.isConfirmed) {
  revokeKey();
}

// Restore / Recover Item
const restoreRes = await CGEAlert.restore('Restore Document?', 'Restores document to workspace.');
```

### High-Security Type-to-Confirm

```javascript
const res = await CGEAlert.delete('Delete Production Cluster', 'This will destroy cluster "prod-01".', {
  requireInput: 'DELETE',
  confirmButtonText: 'Permanently Destroy'
});

if (res.isConfirmed) {
  destroyCluster();
}
```

### Prompt Input with Validator

```javascript
const res = await CGEAlert.prompt('New Branch Name', {
  input: 'text',
  inputPlaceholder: 'feature/user-auth',
  inputValidator: (val) => {
    if (!val) return 'Branch name cannot be empty.';
    if (val.includes(' ')) return 'Branch name cannot contain spaces.';
    return null;
  }
});

if (res.isConfirmed) {
  createBranch(res.value);
}
```

---

## 4. Declarative Laravel Blade Triggers

Intercept form submissions or link navigations with zero custom JS:

```blade
<form action="{{ route('users.destroy', $user) }}" method="POST">
    @csrf
    @method('DELETE')

    <button type="submit"
            data-cge-alert="delete"
            data-cge-title="Delete User {{ $user->name }}?"
            data-cge-message="This will wipe all account settings and logs."
            data-cge-confirm-text="Delete Account"
            data-cge-require="{{ $user->name }}"
            class="px-4 py-2 bg-rose-600 text-white rounded-sm text-xs font-semibold">
        Delete User
    </button>
</form>
```

Supported declarative attributes:
- `data-cge-alert="delete|confirm|prompt|alert|restore"`
- `data-cge-theme="light|dark|auto"`
- `data-cge-title="Heading text"`
- `data-cge-message="Description text"`
- `data-cge-confirm-text="Button text"`
- `data-cge-cancel-text="Cancel text"`
- `data-cge-require="EXACT_PHRASE"`
- `data-cge-size="sm|md|lg|xl"`

---

## 5. Result Payload Structure

```typescript
const result = await CGEAlert.confirm('Title', 'Message');
// result = {
//   isConfirmed: boolean,
//   isDenied: boolean,
//   isDismissed: boolean,
//   dismissReason?: 'backdrop' | 'cancel' | 'close' | 'esc',
//   value?: any
// }
```

---

## 6. DOM CustomEvents

```javascript
document.addEventListener('cge:alert:open', (e) => console.log('Opened:', e.detail.archetype));
document.addEventListener('cge:alert:confirm', (e) => console.log('Confirmed with:', e.detail.value));
document.addEventListener('cge:alert:cancel', (e) => console.log('Dismissed reason:', e.detail.reason));
document.addEventListener('cge:alert:close', (e) => console.log('Closed'));
```

## Verified maintenance contract (2026-10-04)

Declarative confirmation uses a valid submit button with requestSubmit, supports external form-associated buttons, and removes temporary name/value inputs for other triggers. Repeated clicks while confirmation waits cannot bypass it. Dismissed async validators/preConfirm cannot deliver late confirmation. Alert owns scroll/focus only while its overlay is active; use dismiss/close and await the result Promise rather than assuming an instance destroy API.

Use the current compact Alert defaults: rounded-xl card, rounded-md controls, inline semantic icon and restrained shadows. Keep the other plugins’ existing visual defaults. The canonical API is [CGEAlert.d.ts](../../../plugins/CGEAlert/CGEAlert.d.ts).


## Compact UI defaults (2026-10-05)
The dialog uses an inline 40px semantic badge, 16px title and 13px body text, with 16px mobile / 20px desktop padding. Actions are 32px minimum on desktop and 36px below 640px; long labels wrap. The tinted footer is omitted when all action buttons are hidden by configuration. Icon:false removes the icon column. Default helper emphasis inherits the active theme. Existing button class options, light/dark/auto, size presets, validation, promises and declarative selectors stay unchanged. CSS provides visible keyboard focus and reduced-motion support. See [usage](../../../docs/CGEAlert/usage.md).
