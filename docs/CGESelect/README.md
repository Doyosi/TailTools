# CGESelect - TailTools Plugin

**CGESelect** is a searchable select and multi-tag combobox plugin for **Tailwind CSS v4.3+** and **Laravel Blade**. It enhances native select elements while synchronizing plugin selections, external native change events and form resets. After adding/removing native options, call refresh or dispatch change.

---

## Key Highlights

- **Native Form Sync:** The original select remains in the DOM and receives bubbling change/input events from plugin selection. FormData and CGEForm serialize its selected options. Livewire-specific DOM replacement still requires the application's lifecycle integration.
- **Single & Multi-Select Tags:** Effortlessly switch between single select and multi-tag modes with dismissible badges, customizable tag caps (`maxItems`), and overflow counters (`maxTagsVisible`).
- **Headless UI Style Inheritance:** Automatically extracts design tokens and classes (border, background, ring, padding, `rounded-sm`) from the original `<select>`.
- **Popper / Auto-Flip Placement:** Dynamically measures viewport clearance and flips dropdown position between bottom and top to prevent clipping.
- **Remote Async Querying:** Pluggable remote querying engine with built-in debounce, Axios/Fetch drivers, loading spinner, and `AbortController` cancellation.
- **Rich Content Support:** Native parsing of `<option>` metadata: `data-image` (avatars), `data-icon` (SVGs), `data-subtext` (descriptions), and `data-badge` (status tags).
- **Grouped Hierarchies:** Automatically preserves and formats `<optgroup label="...">` sections with clean uppercase headers.
- **Combobox keyboard and ARIA support:** ArrowUp/Down, Enter, Escape, Tab, Home/End and Backspace navigation, accessible labels, listbox/option roles, aria-controls and aria-activedescendant. Browser regressions verify these attributes; screen-reader certification is not claimed.
- **Design System Guarantee:** Strictly adheres to TailTools `rounded-sm` geometry across triggers, dropdowns, tags, badges, and avatars.

---

## Quick Start

### 1. Stylesheet Import

In your Tailwind CSS v4 entry point (`src/style.css` or `resources/css/app.css`):

```css
@import "tailwindcss";
@import "tailtools/plugins/CGESelect/style.css";
```

### 2. JavaScript / Vite Initialization

```javascript
import { initTailTools, CGESelect } from 'tailtools';

// Automatically discovers all select[data-cge-select] elements
initTailTools();

// Or manual instantiation:
const select = new CGESelect('#my-select', {
  placeholder: 'Choose an option...',
  searchable: true,
  clearable: true
});
```

### 3. Declarative HTML Markup

```html
<!-- Single Select with Rich Avatars and Subtext -->
<select id="user-select" name="user_id" data-cge-select class="w-full text-xs">
  <option value="" disabled selected data-placeholder>Select Team Member...</option>
  <option value="1" data-image="/avatars/sarah.jpg" data-subtext="Engineering Lead" data-badge="Admin">Sarah Connor</option>
  <option value="2" data-image="/avatars/alex.jpg" data-subtext="UI Designer" data-badge="Design">Alex Rivera</option>
</select>

<!-- Multi-Select Tags with Max Limits -->
<select name="skills[]" multiple data-cge-select data-cge-max-items="3" data-cge-max-tags-visible="2">
  <option value="tailwind" selected>Tailwind CSS</option>
  <option value="laravel" selected>Laravel Framework</option>
  <option value="vue">Vue.js</option>
  <option value="docker">Docker</option>
</select>
```

---

## Documentation Navigation

- [Usage Guide](usage.md) - Configuration options, data attributes, operating modes, and async endpoints.
- [Laravel Blade Guide](laravel-blade.md) - Reusable Blade components (`<x-cge-select>`), form validation binding, and Livewire integration.
- [Practical Examples](examples.md) - Complete code recipes for single, multi-tag, optgroups, and programmatic controllers.
- [TypeScript API Reference](api.md) - Full TypeScript interfaces, option types, and event payload definitions.


## Maintenance notes (2026-10-04)

Remote selections become native options and serialize through FormData. Native multiple is synchronized. Declarative async URL/driver/method/param/debounce and close-on-select attributes work. Async requests honor minSearchLength; POST uses a JSON query body. Superseded/destroyed requests cannot replace current results. Destroy restores original style/tabindex/aria-hidden/multiple attributes. Local search resets on reopening and disabled optgroups remain disabled. `CGESelect.init(selector, options, root)` accepts an optional discovery root and includes a matching root itself.

## Extended maintenance contract (2026-10-04)

The native select retains every remote/multiple value in FormData. Declarative async settings, stale-result guards, cancellation and scoped init are supported. The trigger is an HTMLDivElement combobox with sibling tag/clear button controls inside the layout, avoiding button-in-button markup; it has a label, aria-controls and aria-activedescendant. Native change and form reset refresh the UI. open/opened/close/closed all emit the declared detail object. Destroy restores original attributes and removes change/reset listeners.

See [API](api.md) for the exact declaration and [installation](../installing.md) for verified package paths.

## Stability fixes (October 2026)

POST async searches now send Laravel CSRF headers (custom `asyncSource.headers` supported), remote `icon` values render as text/class names unless `asyncSource.iconHtml: true`, form reset refreshes after the browser resets the control, the trigger mirrors `aria-invalid` (`ui.triggerInvalid`) so CGEForm errors are visible, and `CGESelect.destroyAll(root)` was added. See [usage](usage.md#stability-fixes-october-2026).
