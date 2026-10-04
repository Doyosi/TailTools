# CGEAlert - Promise-Based Alert, Confirmation & Dialog System

`CGEAlert` is a lightweight, promise-based native JavaScript alert, confirmation, and dialog plugin created specifically for **Tailwind CSS v4.3+** and **Laravel Blade** applications. Engineered as a zero-dependency alternative to SweetAlert2, it provides rich semantic archetypes, high-security type-to-confirm safety verification, prompt inputs with inline validation, focus-trapping accessibility, tactile static backdrop shake alerts, and declarative form interception.

**Zero external runtime dependencies.**

---

## Key Features

- **Promise-Based Async/Await API:**
  Every alert or confirmation method returns a standard JavaScript Promise resolving to a clean result object:
  ```javascript
  const { isConfirmed, isDenied, isDismissed, value } = await CGEAlert.confirm('Save Draft?');
  ```
- **Built-in Archetypes:**
  - `confirm`: Brand/indigo action button + Cancel button with question icon.
  - `delete`: Destructive red styling for primary action, trash/warning icon, explicit confirmation labels ("Delete", "Cancel").
  - `restore`: Emerald recovery styling, counter-clockwise restore arrow icon, recovery messaging.
  - `info`, `success`, `warning`, `error`: Semantic alert dialogs with tailored SVG icons.
  - `prompt`: Input dialogs (`text`, `textarea`, `email`, `password`, `select`, `number`) with async or sync validators.
  - `custom`: Tri-action layout (Confirm, Deny, Cancel).
- **High-Security Type-to-Confirm:**
  Protect destructive actions (such as database purges or cluster teardowns) via `requireInput: "DELETE"`. The confirm button remains strictly disabled until the user types the exact matching phrase.
- **Declarative Laravel Blade Form Interception:**
  Attach `data-cge-alert="delete"` to any HTML submit button or link. CGEAlert automatically intercepts the submission or navigation until the user confirms.
- **Dual Animation Pipeline:**
  - Uses `tailwind-animations` (`animate-zoom-in`, `animate-zoom-out`, `animate-fade-in`, `animate-fade-out`) when detected.
  - Seamless fallback mode with standard Tailwind v4 opacity and scale transitions.
  - Tactile shake animation (`animate-shake`) on clicks outside when `backdropClose: false`.
- **Strict Accessibility (a11y):**
  Body scroll locking with scrollbar width compensation, focus trapping (`Tab` and `Shift+Tab`), autofocus on confirm or input, and prior focus restoration upon closure.
- **Internationalization (i18n):**
  Customizable translation dictionary with runtime overrides for buttons, input placeholders, and helper prompts.

---

## Archetypes Matrix

| Archetype | Icon | Default Confirm Style | Buttons Shown | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `alert` / `info` | Sky Info Circle | Cyan / Sky (`#0ea5e9`) | OK | System announcements, software update notices |
| `success` | Emerald Checkmark | Emerald (`#10b981`) | OK | Successful transactions, profile updates |
| `warning` | Amber Triangle | Amber (`#f59e0b`) | OK | Quota warnings, pending expiration alerts |
| `error` | Rose Octagon | Rose (`#f43f5e`) | OK | Network failures, payment declines |
| `confirm` | Indigo Question | Indigo (`#6366f1`) | Confirm + Cancel | Save confirmation, publishing content |
| `delete` | Rose Trash / Warning | Rose (`#e11d48`) | Delete + Cancel | Destroying records, dropping tables, revoking keys |
| `restore` | Emerald Undo Arrow | Emerald (`#059669`) | Restore + Cancel | Reinstating archived or soft-deleted items |
| `prompt` | Cyan Edit Pen | Cyan (`#0891b2`) | Confirm + Cancel | Dynamic inputs (email, name, role select) |

---

## Quick Start

### 1. Import Stylesheet
In your main CSS bundle (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGEAlert stylesheet */
@import "tailtools/plugins/CGEAlert/style.css";
```

### 2. Basic JavaScript Usage

```javascript
import { CGEAlert } from 'tailtools';

// Simple Alert
await CGEAlert.alert('Update Complete', 'All systems are functioning normally.');

// Confirmation Dialog
const res = await CGEAlert.confirm('Publish Article?', 'The post will be visible immediately.');
if (res.isConfirmed) {
  console.log('User confirmed!');
}

// Destructive Delete with Type-to-Confirm
const deleteRes = await CGEAlert.delete('Delete Database?', 'This cannot be undone.', {
  requireInput: 'DELETE'
});
if (deleteRes.isConfirmed) {
  console.log('Database purged!');
}
```

### 3. Declarative Blade Markup

```html
<form action="/posts/42" method="POST">
    <!-- Intercepts submit until user confirms -->
    <button type="submit"
            data-cge-alert="delete"
            data-cge-title="Delete Post?"
            data-cge-message="Are you sure you want to remove this post?"
            data-cge-confirm-text="Yes, delete it"
            class="px-4 py-2 bg-rose-600 text-white rounded-sm text-xs font-semibold">
        Delete Post
    </button>
</form>
```

---

## Documentation Index

- [Usage & API Reference](usage.md) - Methods, option schemas, validators, and lifecycle callbacks.
- [Laravel Blade Integration](laravel-blade.md) - Form submission interception, delete triggers, and `<x-cge-alert-trigger>` component.
- [Practical Examples](examples.md) - Real-world patterns (type-to-confirm, prompt inputs, tri-action dialogs, spinners).
- [TypeScript API Specification](api.md) - Full TypeScript interfaces and event contracts.
