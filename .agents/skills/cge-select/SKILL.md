---
name: cge-select
description: Versatile, accessible searchable select and multi-tag combobox plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Seamlessly transforms native <select> elements while keeping the original input and its native events in sync. Features single and multi-select modes, remote async querying (Axios / Fetch) with debounce, rich option rendering (images, SVG icons, badges, descriptions), UI style inheritance, floating placement calculation, and full WAI-ARIA 1.2 keyboard navigation.
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
select.on('change', (value, selectedItems) => {
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
| `data-cge-clearable` | Boolean | `false` | Shows a single-click "X" clear button in the trigger. |
| `data-cge-max-items` | Number | `Infinity` | Max items selectable in multi mode. |
| `data-cge-max-tags-visible`| Number | `Infinity` | Truncates visible tags and displays a `+N more` badge. |
| `data-cge-close-on-select` | Boolean | `true` (single) / `false` (multi) | Auto-closes dropdown on selection. |
| `data-cge-async-url` | String | `null` | Remote JSON endpoint for debounced queries. |
| `data-cge-async-driver` | `'fetch' \| 'axios'` | `'fetch'` | Async transport client. |
| `data-cge-async-param` | String | `'q'` | Query string parameter name sent to API. |
| `data-cge-async-debounce` | Number | `300` | Input debounce delay in milliseconds. |

---

## 6. Options Configuration Reference

```typescript
interface CGESelectOptions {
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  closeOnSelect?: boolean;
  maxItems?: number;
  maxTagsVisible?: number;
  minSearchLength?: number;
  asyncSource?: {
    url: string;
    driver?: 'fetch' | 'axios';
    method?: 'GET' | 'POST';
    param?: string;
    debounce?: number;
  };
  ui?: {
    wrapper?: string;
    trigger?: string;
    dropdown?: string;
    searchBox?: string;
    searchInput?: string;
    optionsList?: string;
    optgroupLabel?: string;
    option?: string;
    optionActive?: string;
    optionSelected?: string;
    tag?: string;
    tagRemove?: string;
    empty?: string;
    loading?: string;
  };
  renderOption?: (item: CGESelectItem) => string;
  renderTag?: (item: CGESelectItem) => string;
  translations?: Partial<CGESelectTranslations>;
}
```

---

## 7. Strict Design System Rules
- **Strict Border Radius:** Always apply **`rounded-sm`** for buttons, dropdown menus, multi-select tag badges, search inputs, and avatar thumbnails.
- **Forbidden:** Never use `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or `rounded-xl`.
- **Zero Runtime Dependencies:** Native browser APIs only (with peer support for optional Axios).
- **Native Select Sync:** The original hidden `<select>` must stay in DOM with off-screen positioning so standard form submits, `FormData`, and `CGEForm` continue serializing properly.
