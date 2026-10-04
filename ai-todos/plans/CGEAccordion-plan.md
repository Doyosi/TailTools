# CGEAccordion Implementation Plan (incorporating CGECollapse)

Ultra-smooth, accessible accordion and collapsible panel plugin engineered for Tailwind CSS v4.3+ and Laravel Blade. Utilizes modern CSS Grid row transitions (`grid-rows-[0fr]` to `grid-rows-[1fr]`) to eliminate laggy height/scrollHeight calculations. Features single-expand (exclusive accordion) and multi-expand (independent collapse) modes, URL hash/deep-linking activation, animated chevron/icon rotation, nested hierarchy support, and full WAI-ARIA keyboard navigation.

---

## 1. Architecture & Protocol Compliance

- **Class Names:** `CGEAccordion`, `CGECollapse`
- **Location:** `plugins/CGEAccordion/`
- **Files:**
  - `CGEAccordion.js`: Native ESM JavaScript implementation (ES2022+), zero external runtime dependencies.
  - `CGEAccordion.d.ts`: Full TypeScript definitions and event payload maps for both `CGEAccordion` and `CGECollapse`.
  - `index.js`: Plugin barrel export (`export { CGEAccordion, CGECollapse }; export default CGEAccordion;`).
  - `index.d.ts`: Type definition barrel (`export * from './CGEAccordion.js'; export { CGEAccordion as default } from './CGEAccordion.js';`).
  - `style.css`: Tailwind CSS v4 utility classes, CSS grid row transitions, icon rotation utilities, and fallback styling.
- **Dual Exposure:**
  - `CGEAccordion`: Manages group containers with shared state (exclusive mode or multi-mode).
  - `CGECollapse`: Standalone helper for isolated, independent toggles without a parent wrapper.
- **Static Registry & Methods:**
  - `CGEAccordion.instances`: `Map<HTMLElement | string, CGEAccordion>`
  - `CGEAccordion.defaults`: Default configuration options.
  - `CGEAccordion.init(selectorOrRoot, options)`: Declarative auto-initialization.
  - `CGEAccordion.get(elementOrId)`: Retrieves existing instance by ID or DOM element.
  - `CGECollapse.instances`: `Map<HTMLElement | string, CGECollapse>`
  - `CGECollapse.defaults`: Default configuration options for standalone collapse.
  - `CGECollapse.init(selectorOrRoot, options)`: Declarative auto-initialization for standalone collapse elements.
  - `CGECollapse.get(elementOrId)`: Retrieves existing instance.
- **Instance API (CGEAccordion):**
  - `new CGEAccordion(elementOrSelector, options)`
  - `acc.open(itemId)`: Expands a specific accordion item.
  - `acc.close(itemId)`: Collapses a specific accordion item.
  - `acc.toggle(itemId)`: Toggles an accordion item.
  - `acc.openAll()`: Expands all items (in multi-mode `exclusive: false`).
  - `acc.closeAll()`: Collapses all items (respecting `alwaysOpen: false`).
  - `acc.isOpen(itemId)`: Returns boolean indicating open state.
  - `acc.getItems()`: Returns list of discovered direct item descriptors.
  - `acc.getItem(itemId)`: Returns specific item descriptor `{ id, el, trigger, body, icon, isOpen }`.
  - `acc.destroy()`: Cleans up all listeners, storage bindings, and ARIA attributes.
  - `acc.on(eventName, callback)` / `acc.off(eventName, callback)` / `acc.emit(eventName, detail)`.
- **Instance API (CGECollapse):**
  - `new CGECollapse(triggerOrTarget, options)`
  - `col.open()`: Expands the collapsible panel.
  - `col.close()`: Collapses the collapsible panel.
  - `col.toggle()`: Toggles the collapsible panel.
  - `col.isOpen()`: Returns boolean indicating open state.
  - `col.destroy()`: Cleans up listeners and attributes.
  - `col.on(eventName, callback)` / `col.off(eventName, callback)` / `col.emit(eventName, detail)`.

---

## 2. Modern Transition & Animation Mechanics

- **Zero `scrollHeight` Dependency (Tailwind v4 CSS Grid Technique):**
  - Accordion body wrappers toggle between `grid grid-rows-[0fr] transition-all duration-300 ease-out` and `grid-rows-[1fr]`.
  - The direct child of the grid wrapper contains `min-h-0 overflow-hidden` (or `overflow-hidden text-sm py-0` and `pb-4` on active state) so content animates dynamically and smoothly regardless of internal padding, margins, or responsive resizing.
  - Prevents reflow/layout-thrashing caused by querying `element.scrollHeight` in JavaScript.
- **Chevron & Indicator Rotation:**
  - Target icon elements (`data-cge-icon` or `[data-cge-accordion-icon]` or `.cge-icon`) automatically rotate:
    - Base: `transition-transform duration-300`
    - Inactive: `rotate-0`
    - Active: `rotate-180` (or custom class in `ui.activeIcon`).
- **Dual Animation Driver Support:**
  - Native CSS Grid transitions work out of the box with zero external dependencies.
  - Optional `tailwind-animations` classes (e.g., `animate-fade-in` or custom reveal) can be attached via `options.animation`.

---

## 3. Operating Modes & Nested Support

- **Operating Modes:**
  - `exclusive: true` (Accordion Default): Opening an item automatically closes all other sibling items in the same container.
  - `exclusive: false` (Multi/Collapse Mode): Multiple panels can remain open independently.
  - `alwaysOpen: false`: When `true`, prevents closing the currently active panel if it's the only one open (ensures at least one panel is always open).
- **Nested Hierarchies:**
  - Fully supports accordions inside accordions (e.g. documentation sidebars, multi-level category trees).
  - DOM discovery scopes queries to direct children: elements whose closest `[data-cge-accordion]` is `this.element`.
  - Event delegation checks origin target: events from child accordions do not trigger parent accordion changes.

---

## 4. Deep Linking & State Persistence

- **Deep Linking:**
  - `urlSync: 'hash' | false` (Default: `'hash'`).
  - On page load, detects hash in URL (`window.location.hash`) matching item ID; automatically opens the item with optional smooth scroll into view (`scrollIntoView: true`).
  - Listens to `hashchange` on `window` to switch items when user navigates.
  - Option `updateHash: boolean` (Default: `false`) to update URL hash on manual toggle without page scroll.
- **Storage Persistence:**
  - `storage: 'localStorage' | 'sessionStorage' | false` (Default: `false`).
  - `storageKey?: string` (Default: `cge_accordion_${element.id || uid}`).
  - Remembers open items across page refreshes and navigations.

---

## 5. Accessibility & Keyboard Navigation (WAI-ARIA)

- **ARIA Roles & Attributes:**
  - Trigger: `role="button"` (if not `<button>`), `aria-expanded="true|false"`, `aria-controls="panel-id"`, `id="trigger-id"`.
  - Panel: `role="region"`, `aria-labelledby="trigger-id"`, `id="panel-id"`.
- **Keyboard Navigation:**
  - `ArrowDown`: Moves focus to next accordion trigger header in the container (cycles or clamps).
  - `ArrowUp`: Moves focus to previous accordion trigger header.
  - `Home`: Focuses first accordion trigger header.
  - `End`: Focuses last accordion trigger header.
  - `Enter` / `Space`: Toggles the focused panel.

---

## 6. Headless Design & Theming (`ui`)

- Customizable slots:
  - `item`: Wrapper container for each item.
  - `trigger`: Trigger button element.
  - `activeTrigger`: Classes added when item is active/open.
  - `icon`: Chevron / icon indicator element.
  - `activeIcon`: Classes added to icon when active (e.g. `rotate-180`).
  - `wrapper`: Collapsible grid wrapper (`grid grid-rows-[0fr] transition-all duration-300 ease-out`).
  - `activeWrapper`: Classes applied when active (`grid-rows-[1fr]`).
  - `content`: Inner content wrapper (`overflow-hidden min-h-0 text-sm text-zinc-600 dark:text-zinc-400 py-0`).
  - `activeContent`: Classes applied to content when active (`pb-4`).

---

## 7. Declarative HTML Structure (Laravel Blade Ready)

```html
<div id="faq-accordion" data-cge-accordion data-cge-exclusive="true">
  <div class="cge-accordion-item" data-cge-item="item-1">
    <h3>
      <button data-cge-trigger="item-1" class="cge-trigger">
        <span>How does billing work?</span>
        <svg data-cge-icon class="cge-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
        </svg>
      </button>
    </h3>
    <div data-cge-body="item-1" class="cge-wrapper">
      <div class="cge-content">
        We bill annually or monthly depending on your selected tier...
      </div>
    </div>
  </div>
</div>
```

---

## 8. Events & Lifecycle

- Callbacks: `onOpen(itemId, itemEl)`, `onClose(itemId, itemEl)`, `onToggle(itemId, isOpen, itemEl)`.
- Event Emitter: `acc.on('open', handler)`, `acc.on('close', handler)`, `acc.on('toggle', handler)`.
- DOM CustomEvents:
  - `cge:accordion:open`
  - `cge:accordion:close`
  - `cge:accordion:toggle`
  - `cge:collapse:open`
  - `cge:collapse:close`
  - `cge:collapse:toggle`


## Scoped maintenance — 2026-10-04
Preserve public API, visual defaults and CSS Grid transitions. Verify programmatic and nested ownership, keyboard/hidden-panel access, initial/URL/storage state, duration and reduced motion, scoped init/get and DOM restoration. For Tabs verify AJAX cancellation/cache/retry and nested plugin lifecycle. Update declarations, four docs, consumer skill, browser/package checks and REPORTS.md.

Completed 2026-10-05. Scoped fixes, docs/skills/types and 30 navigation regressions delivered. Validation: 27 Node / 116 Chrome, native mobile/desktop demo, NodeNext/Bundler, build, ESM/UMD and npm archive; see REPORTS.md.
