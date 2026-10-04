# CGESelect - TailTools Plugin

**CGESelect** is a versatile, accessible searchable select and multi-tag combobox plugin designed for **Tailwind CSS v4.3+** and **Laravel Blade** environments. It progressively enhances native HTML `<select>` elements into rich comboboxes while maintaining 100% transparent bidirectional synchronization with the underlying native element and its standard DOM events (`change`, `input`).

---

## Key Highlights

- **100% Native Form & Livewire Sync:** The original `<select>` remains in the DOM and receives real-time value changes and native bubbling `change`/`input` events. Seamlessly serialized by `FormData(form)` and integrated with `CGEForm` and Laravel Livewire.
- **Single & Multi-Select Tags:** Effortlessly switch between single select and multi-tag modes with dismissible badges, customizable tag caps (`maxItems`), and overflow counters (`maxTagsVisible`).
- **Headless UI Style Inheritance:** Automatically extracts design tokens and classes (border, background, ring, padding, `rounded-sm`) from the original `<select>`.
- **Popper / Auto-Flip Placement:** Dynamically measures viewport clearance and flips dropdown position between bottom and top to prevent clipping.
- **Remote Async Querying:** Pluggable remote querying engine with built-in debounce, Axios/Fetch drivers, loading spinner, and `AbortController` cancellation.
- **Rich Content Support:** Native parsing of `<option>` metadata: `data-image` (avatars), `data-icon` (SVGs), `data-subtext` (descriptions), and `data-badge` (status tags).
- **Grouped Hierarchies:** Automatically preserves and formats `<optgroup label="...">` sections with clean uppercase headers.
- **WAI-ARIA 1.2 Combobox Accessibility:** Full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`, `Tab`, `Home`, `End`, `Backspace`) and screen-reader compliant roles.
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
