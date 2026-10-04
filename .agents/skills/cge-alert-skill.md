---
name: cge-alert
description: Promise-based native JavaScript alert, confirmation, and dialog plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features built-in archetypes (info alert, confirmation, destructive delete, restore, prompt input), dynamic multi-button layouts, type-to-confirm safety verification, focus-trapping accessibility, customizable i18n translation dictionary, and declarative data-attribute triggers for Laravel Blade actions.
---

# CGEAlert Skill

Universal agent guide for Antigravity, Claude Code, Cursor, and Codex when integrating or maintaining **CGEAlert** inside TailTools.

---

## 1. Core Architecture
- **Plugin Path:** `plugins/CGEAlert/`
- **Source Files:**
  - `CGEAlert.js`: Native ES2022 class with Promise resolution and portal isolation.
  - `CGEAlert.d.ts`: Comprehensive TypeScript interfaces.
  - `style.css`: Tailwind v4 portal z-index and shake keyframes.
  - `index.js`: Barrel export.
- **Dependencies:** 0 runtime external dependencies.

---

## 2. Quick Setup

```javascript
import { CGEAlert } from 'tailtools';

// Simple Alert
await CGEAlert.alert('Notice', 'System backup initiated.');

// Standard Confirmation
const res = await CGEAlert.confirm('Save Draft?');
if (res.isConfirmed) {
  save();
}

// Destructive Deletion with Type-to-Confirm
const del = await CGEAlert.delete('Purge Data', 'Irreversible action.', {
  requireInput: 'PURGE'
});
if (del.isConfirmed) {
  purge();
}
```

---

## 3. Archetypes
- `confirm`: Brand action button + Cancel button.
- `delete`: Destructive red styling for primary action, warning icon.
- `restore`: Emerald recovery styling with undo icon.
- `prompt`: Input dialog (`text`, `textarea`, `email`, `password`, `select`, `number`) with `inputValidator`.
- `info`, `success`, `warning`, `error`: Notification dialogs with appropriate SVG icons.
- `custom`: Up to 3 buttons (Confirm, Deny, Cancel).

---

## 4. Laravel Blade Form Interception

```blade
<form action="/items/1" method="POST">
    @csrf
    @method('DELETE')
    <button type="submit"
            data-cge-alert="delete"
            data-cge-title="Delete Item?"
            data-cge-message="This cannot be undone."
            data-cge-confirm-text="Yes, delete it">
        Delete
    </button>
</form>
```
CGEAlert automatically intercepts submit, prompts the user, and if confirmed, completes `form.requestSubmit()`.
