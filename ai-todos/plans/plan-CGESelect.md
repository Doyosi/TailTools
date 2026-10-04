# Architectural Plan: CGESelect Plugin

## 1. Executive Summary & Problem Space
**CGESelect** is a high-performance, accessible searchable select and multi-tag combobox plugin designed for Tailwind CSS v4.3+ and Laravel Blade environments. It progressively enhances native HTML `<select>` elements into rich comboboxes while maintaining 100% transparent bidirectional synchronization with the underlying native element and its standard DOM events (`change`, `input`).

### Key Value Propositions
- **Native Synchronization Guarantee:** The original `<select>` remains in the DOM (hidden from view) and receives all value updates and native bubbling `change` and `input` events, ensuring zero breaking changes for `CGEForm`, standard form submissions, and Laravel Livewire listeners.
- **Dual Operating Modes:** Single select with rich metadata and multi-select with interactive tags/badges, tag limits, and overflow counters.
- **Headless UI Class Inheritance:** Automatically extracts design tokens and classes (border, background, ring, padding, `rounded-sm`) from the original `<select>`.
- **Popper / Auto-Flip Calculation:** Dynamically checks viewport clearance to flip dropdown direction between bottom and top.
- **Remote Async Querying:** Pluggable search engine supporting debounce, Axios/Fetch drivers, pagination, loading states, and cancellation via `AbortController`.
- **Full WAI-ARIA 1.2 Combobox Accessibility:** Full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`, `Tab`, `Home`, `End`, `Backspace`), ARIA attributes, and focus trapping.
- **Design System Compliance:** Strictly uses `rounded-sm` across all generated trigger boxes, dropdown panels, tags, badges, and avatars.

---

## 2. API Specification

### Static Methods
- `CGESelect.init(selector?: string, options?: CGESelectOptions): CGESelect[]`
- `CGESelect.get(target: string | HTMLElement): CGESelect | null`
- `CGESelect.getOrCreate(target: string | HTMLElement, options?: CGESelectOptions): CGESelect`
- `CGESelect.setTranslations(dict: Partial<CGESelectTranslations>): void`

### Instance Methods
- `select.open(): this`
- `select.close(): this`
- `select.toggle(): this`
- `select.getValue(): string | string[]`
- `select.setValue(val: string | string[], triggerChange?: boolean): this`
- `select.clear(triggerChange?: boolean): this`
- `select.select(val: string): this`
- `select.deselect(val: string): this`
- `select.disable(): this`
- `select.enable(): this`
- `select.refresh(): this`
- `select.destroy(): void`
- `select.on(event: string, callback: Function): this`
- `select.off(event: string, callback: Function): this`

### Events Emitted
| Event Name | Target | Detail Payload |
| :--- | :--- | :--- |
| `cge:select:open` | Wrapper & `<select>` | `{ instance, element }` |
| `cge:select:opened` | Wrapper & `<select>` | `{ instance, element }` |
| `cge:select:close` | Wrapper & `<select>` | `{ instance, element }` |
| `cge:select:closed` | Wrapper & `<select>` | `{ instance, element }` |
| `cge:select:change` | Wrapper & `<select>` | `{ instance, element, value, selectedItems }` |
| `cge:select:clear` | Wrapper & `<select>` | `{ instance, element }` |
| `cge:select:search` | Wrapper & `<select>` | `{ instance, element, query }` |

---

## 3. Configuration Options

```typescript
export interface CGESelectOptions {
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  closeOnSelect?: boolean; // defaults: true for single, false for multi
  maxItems?: number | null;
  maxTagsVisible?: number | null;
  minSearchLength?: number;
  asyncSource?: {
    url: string;
    driver?: 'axios' | 'fetch';
    method?: 'GET' | 'POST';
    param?: string;
    debounce?: number;
    transform?: (response: any) => CGESelectItem[];
  } | null;
  renderOption?: (item: CGESelectItem) => string;
  renderTag?: (item: CGESelectItem) => string;
  renderSelection?: (item: CGESelectItem) => string;
  ui?: Partial<CGESelectUIConfig>;
  translations?: Partial<CGESelectTranslations>;
}
```

---

## 4. DOM Structure & Headless Style Inheritance

```html
<div class="cge-select-wrapper relative w-full" data-cge-select-instance>
  <!-- Hidden native select for form submission and Livewire sync -->
  <select style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;" tabindex="-1" aria-hidden="true">...</select>

  <!-- Trigger Box -->
  <button type="button" class="cge-select-trigger ..." role="combobox" aria-expanded="false" aria-haspopup="listbox">
    <!-- Single Select Content OR Multi-Select Tags -->
    <div class="cge-select-selection flex-1 flex flex-wrap items-center gap-1">...</div>
    <div class="cge-select-controls flex items-center gap-1.5 shrink-0">
      <button type="button" class="cge-select-clear ...">&times;</button>
      <span class="cge-select-arrow ..."><svg ...></svg></span>
    </div>
  </button>

  <!-- Dropdown Panel -->
  <div class="cge-select-dropdown hidden absolute z-50 w-full bg-white border rounded-sm shadow-lg ..." role="listbox">
    <!-- Optional Search Input -->
    <div class="cge-select-search-wrapper p-2 border-b">
      <input type="text" class="cge-select-search-input w-full px-2.5 py-1.5 text-xs rounded-sm ..." placeholder="Search..." autocomplete="off">
    </div>

    <!-- Options Scroll Container -->
    <div class="cge-select-options max-h-60 overflow-y-auto p-1">
      <!-- Options and Optgroups -->
    </div>
  </div>
</div>
```

---

## 5. Implementation Roadmap
1. `ai-todos/plans/plan-CGESelect.md` (this file)
2. `ai-todos/todo-checks/check-CGESelect.md`
3. `plugins/CGESelect/CGESelect.js`
4. `plugins/CGESelect/CGESelect.d.ts`
5. `plugins/CGESelect/style.css`
6. `plugins/CGESelect/index.js`
7. `src/index.ts` & `src/style.css`
8. `index.html` Interactive Sandbox
9. Full Documentation Suite (`docs/CGESelect/`)
10. AI Skill Files (`.agents/skills/cge-select/SKILL.md`)
11. Build Validation (`npm run build`)
