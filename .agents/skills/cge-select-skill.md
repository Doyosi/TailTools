---
name: cge-select-skill
description: Universal agent operational guide for CGESelect, a versatile, accessible searchable select and multi-tag combobox plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Transforms native <select> elements, maintains two-way native DOM sync, and supports single/multi modes, tag badges, async search, and rich metadata options.
---

# CGESelect Universal Agent Skill

This skill guides AI coding assistants (Antigravity, Cursor, Codex, Claude Code) in implementing, configuring, styling, and debugging the `CGESelect` plugin from **TailTools**.

---

## Architecture Overview

- **Source Code:** `plugins/CGESelect/CGESelect.js`
- **TypeScript Types:** `plugins/CGESelect/CGESelect.d.ts`
- **Tailwind v4 Styles:** `plugins/CGESelect/style.css`
- **Barrel Export:** `plugins/CGESelect/index.js`
- **Documentation:** `docs/CGESelect/` (`README.md`, `usage.md`, `laravel-blade.md`, `examples.md`, `api.md`)
- **Zero Runtime Dependencies:** Native browser JavaScript (peer-dependency on `axios` if selected).

---

## Core Capabilities

1. **Native `<select>` Synchronization & Transparent Event Bridging:**
   - Hides the original `<select>` accessible off-screen (`clip: rect(0,0,0,0)`), ensuring standard `<form>` submissions, `new FormData(form)`, and `CGEForm` serialize correctly without special adapters.
   - Dispatches bubbling native `change` and `input` events directly onto the hidden `<select>`.
   - Also emits CustomEvents (`cge:select:change`, `cge:select:open`, `cge:select:close`, `cge:select:clear`, `cge:select:search`).
   - Seamlessly compatible with Laravel Livewire listeners attached to `#select`.

2. **Headless Style Extraction & Inheritance:**
   - Extracts CSS classes (padding, borders, background, dark-mode variants, font sizes) from the source `<select>` and applies them to the trigger button so it automatically matches existing forms.
   - Customizable slots via the `ui` option.

3. **Multi-Select Tag Management:**
   - Automatically detects `<select multiple>` or `multiple: true`.
   - Renders selected items as dismissible badge pills inside the trigger box.
   - Supports `maxItems` to restrict selections and `maxTagsVisible` with a "+N more" overflow badge.
   - Pressing `Backspace` removes the last selected tag when the search input is empty.

4. **Rich Metadata & Option Rendering:**
   - Reads HTML attributes: `data-image`, `data-icon`, `data-subtext`, `data-badge`, and handles `<optgroup label="...">`.
   - Configurable render functions: `renderOption(item)` and `renderTag(item)`.

5. **Local Fuzzy & Remote Async Search:**
   - Client-side filtering matches labels, values, and subtext.
   - Remote async querying (`asyncSource: { url, driver: 'fetch'|'axios', param: 'q', debounce: 300 }`) with cancelable `AbortController` and animated spinner.

6. **WAI-ARIA 1.2 Combobox Accessibility:**
   - Uses `role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, and `aria-selected`.
   - Full keyboard navigation: `ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Tab`, `Backspace`, `Home`, `End`.

7. **Strict Styling Constraint:**
   - Always enforce **`rounded-sm`** for buttons, tag badges, dropdown containers, search boxes, and avatars.
   - Never use `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, or `rounded-xl`.

---

## Quick Declarative Reference

```html
<!-- Single Select with Rich Avatars & Clear Button -->
<select data-cge-select
        data-cge-searchable="true"
        data-cge-clearable="true"
        data-cge-placeholder="Select Team Member"
        name="user_id"
        class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm">
  <option value="1" data-image="/avatars/sarah.jpg" data-subtext="Lead Engineer" data-badge="Active">Sarah Connor</option>
  <option value="2" data-image="/avatars/alex.jpg" data-subtext="UI Designer" data-badge="Away">Alex Mercer</option>
</select>

<!-- Multi-Select Tags with Max Limits -->
<select data-cge-select
        multiple
        data-cge-max-items="3"
        data-cge-max-tags-visible="2"
        data-cge-placeholder="Select up to 3 tags..."
        name="skills[]"
        class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm">
  <option value="tailwind" selected>Tailwind CSS</option>
  <option value="laravel" selected>Laravel</option>
  <option value="alpine">Alpine.js</option>
  <option value="livewire">Livewire</option>
</select>
```
