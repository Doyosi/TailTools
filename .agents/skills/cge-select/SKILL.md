---
name: cge-select
description: Versatile, accessible searchable select and multi-tag combobox plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Seamlessly transforms native <select> elements while keeping the original input and its native events in sync. Features single and multi-select modes, remote async querying (Axios / Fetch) with debounce, rich option rendering (images, SVG icons, badges, descriptions), UI style inheritance, floating placement calculation, and keyboard navigation with combobox/listbox ARIA roles and active-option linkage.
---

# CGESelect Agent Skill

Use this skill when implementing, configuring, or debugging searchable selects, multi-tag comboboxes, async remote autocomplete pickers, and rich dropdowns in **TailTools** with Tailwind CSS v4.3+ and Laravel Blade.

---

## 1. When to Use CGESelect

Activate this skill when the user requests:
- "Transform a standard HTML `<select>` into a modern searchable dropdown or combobox."
- "Implement a multi-select tag picker with dismissible badges and maximum selection limits (`maxItems`)."
- "Add a '+N more' overflow badge when multiple tags exceed `maxTagsVisible`."
- "Load dropdown options dynamically from a remote API endpoint via Axios or Fetch with debounced search."
- "Render rich dropdown items with user avatars, SVG icons, badges, and secondary subtext descriptions."
- "Preserve grouped hierarchical options (`<optgroup>`)."
- "Ensure transparent synchronization with HTML `<form>` submissions, `CGEForm`, and Laravel Livewire listeners."
- "Support full keyboard accessibility (Arrow Up/Down, Enter, Escape, Backspace, Home, End)."
- "Create reusable Laravel Blade components `<x-cge-select :options="$items" />`."

---

## 2. Quick Setup & Imports

### Tailwind CSS v4 Entry (`src/style.css` or `resources/css/app.css`):
```css
@import "tailwindcss";
@import "tailwind-animations";
@import "tailtools/plugins/CGESelect/style.css";
```

### JavaScript / Vite Entry (`src/index.ts` or `resources/js/app.js`):
```javascript
import { initTailTools, CGESelect } from 'tailtools';

// Automatically initializes all <select data-cge-select> on DOMContentLoaded
initTailTools();

// Global registration for Alpine.js or inline scripts
window.CGESelect = CGESelect;
```

---

## 3. Core Declarative Markup Patterns

### A. Rich Single Select with Avatars & Badges
```html
<select data-cge-select
        data-cge-searchable="true"
        data-cge-placeholder="Choose Team Member..."
        data-cge-clearable="true"
        name="assignee_id"
        class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
  <option value="">Choose Team Member...</option>
  <option value="1" 
          data-image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
          data-subtext="Engineering Lead"
          data-badge="Online">Sarah Connor</option>
  <option value="2" 
          data-image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
          data-subtext="Product Designer"
          data-badge="Away">Alex Mercer</option>
</select>
```

### B. Multi-Select Tag Combobox with Limits
```html
<select data-cge-select
        multiple
        data-cge-max-items="3"
        data-cge-max-tags-visible="2"
        data-cge-placeholder="Select up to 3 technologies..."
        name="technologies[]"
        class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm">
  <option value="tailwind" selected>Tailwind CSS</option>
  <option value="laravel" selected>Laravel</option>
  <option value="vite">Vite</option>
  <option value="typescript">TypeScript</option>
</select>
```

### C. Remote Async Search (Axios / Fetch)
```html
<select data-cge-select
        data-cge-async-url="/api/users/search"
        data-cge-async-driver="fetch"
        data-cge-async-param="q"
        data-cge-async-debounce="300"
        data-cge-placeholder="Type 2+ chars to query remote API..."
        name="remote_user_id"
        class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm">
</select>
```

---

## 4. Programmatic JavaScript API

```javascript
import { CGESelect } from 'tailtools';

// Instantiate
const select = new CGESelect('#my-select', {
  searchable: true,
  clearable: true,
  multiple: true,
  maxItems: 4,
  maxTagsVisible: 2,
  asyncSource: {
    url: '/api/v1/tags',
    driver: 'fetch',
    param: 'query',
    debounce: 250
  }
});

// Get & Set value
select.setValue(['tailwind', 'laravel']);
const currentVal = select.getValue(); // ['tailwind', 'laravel']

// Open / Close / Toggle
select.open();
select.close();

// Clear selections
select.clear();

// Disable / Enable
select.disable();
select.enable();

// Listen to events
select.on('change', ({ value, selectedItems }) => {
  console.log('Value changed:', value, selectedItems);
});
select.on('open', () => console.log('Dropdown opened'));
select.on('close', () => console.log('Dropdown closed'));
select.on('clear', () => console.log('Cleared'));

// Cleanup
select.destroy();
```

---

## 5. Declarative Attributes Reference

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `data-cge-select` | Marker | - | Marks element for auto-initialization by `CGESelect.init()`. |
| `data-cge-searchable` | Boolean | `true` | Enables or disables the live filter search bar. |
| `data-cge-placeholder` | String | `'Select an option...'` | Trigger placeholder when nothing is selected. |
| `data-cge-clearable` | Boolean | `true` | Shows a single-click "X" clear button in the trigger. |
| `data-cge-max-items` | Number | `null` | Max items selectable in multi mode. |
| `data-cge-max-tags-visible`| Number | `null` | Truncates visible tags and displays a `+N more` badge. |
| `data-cge-close-on-select` | Boolean | `true` (single) / `false` (multi) | Auto-closes dropdown on selection. |
| `data-cge-async-url` | String | `null` | Remote JSON endpoint for debounced queries. |
| `data-cge-async-driver` | `'fetch' \| 'axios'` | `'fetch'` | Async transport client. |
| `data-cge-async-param` | String | `'q'` | Query string parameter name sent to API. |
| `data-cge-async-debounce` | Number | `300` | Input debounce delay in milliseconds. |

---

## 6. Options Configuration Reference

See `plugins/CGESelect/CGESelect.d.ts` and `docs/CGESelect/api.md` for complete interfaces. UI slots include `searchWrapper`, `optionFocused`, `emptyState` and `loadingState`.

---

## 7. Strict Design System Rules


- **Zero Runtime Dependencies:** Native browser APIs only (with peer support for optional Axios).
- **Native Select Sync:** The original hidden `<select>` must stay in DOM with off-screen positioning so standard form submits, `FormData`, and `CGEForm` continue serializing properly.


## Verified maintenance guidance (2026-10-04)

Remote selections become native options and serialize through FormData. Native multiple is synchronized. Declarative async URL/driver/method/param/debounce and close-on-select attributes work. Async requests honor minSearchLength; POST uses a JSON query body. Superseded/destroyed requests cannot replace current results. Destroy restores original style/tabindex/aria-hidden/multiple attributes. Local search resets on reopening and disabled optgroups remain disabled. `CGESelect.init(selector, options, root)` accepts an optional discovery root and includes a matching root itself.

## Verified maintenance contract (2026-10-04)

The native select retains every remote/multiple value in FormData. Declarative async settings, stale-result guards, cancellation and scoped init are supported. The trigger is an HTMLDivElement combobox with separate tag/clear buttons in its layout, avoiding button-in-button markup; it has a label, aria-controls and aria-activedescendant. Native change and form reset refresh the UI. open/opened/close/closed all emit the declared detail object. Destroy restores original attributes and removes change/reset listeners.

Use the existing plugin radius/theme defaults. New markup may prefer rounded-sm; do not replace Dropzone rounded-xl or circular avatar defaults during maintenance. The canonical API is [CGESelect.d.ts](../../../../plugins/CGESelect/CGESelect.d.ts).

## Stability fixes (October 2026)

- POST `asyncSource` requests send Laravel CSRF headers; `asyncSource.headers` and `asyncSource.axiosInstance` are supported; failures are `HttpError`.
- Remote `icon` values are class names/text unless `asyncSource.iconHtml: true`; `<option data-icon>` author markup stays HTML; custom `render*` output is trusted HTML, so escape remote values in it.
- Reset refresh runs in `setTimeout(0)`; the trigger mirrors the native select's `aria-invalid` with `ui.triggerInvalid`. Badge padding uses `py-0.5`.
- Use `CGESelect.destroyAll(root)`; `init()` prunes removed selects.
