# CGETabs Implementation Plan

High-performance, accessible tabs and segmented control plugin designed for Tailwind CSS v4.3+ and Laravel Blade. Features dual navigation state persistence (URL Hash and URL Query Param deep linking), on-demand Ajax / Blade partial lazy loading with caching, WAI-ARIA compliant keyboard navigation, dynamic animated sliding indicators, headless UI theming, and automated lifecycle re-binding for internal CGE plugins.

---

## 1. Architecture & Protocol Compliance

- **Class Name:** `CGETabs`
- **Location:** `plugins/CGETabs/`
- **Files:**
  - `CGETabs.js`: Native ESM JavaScript implementation (ES2022+), zero external runtime dependencies.
  - `CGETabs.d.ts`: Full TypeScript definitions and event payload maps.
  - `index.js`: Plugin barrel export (`export { CGETabs }; export default CGETabs;`).
  - `index.d.ts`: Type definition barrel (`export * from './CGETabs.js'; export { CGETabs as default } from './CGETabs.js';`).
  - `style.css`: Tailwind CSS v4 `@utility` / CSS variables, sliding indicator styles, and fallback animations.
- **Static Registry & Methods:**
  - `CGETabs.instances`: `Map<HTMLElement, CGETabs>`
  - `CGETabs.defaults`: Default configuration options.
  - `CGETabs.init(selectorOrRoot, options, root)`: Declarative auto-initialization.
  - `CGETabs.get(elementOrId)`: Retrieves existing instance by ID or DOM element.
- **Instance API:**
  - `new CGETabs(elementOrSelector, options)`
  - `tabs.show(tabId, options)`
  - `tabs.next()`
  - `tabs.prev()`
  - `tabs.first()`
  - `tabs.last()`
  - `tabs.loadAjaxTab(tabId, force)`
  - `tabs.getActiveTab()`
  - `tabs.getTab(tabId)`
  - `tabs.getPanel(tabId)`
  - `tabs.updateIndicator()`
  - `tabs.destroy()`
  - `tabs.on(eventName, callback)` / `tabs.off(eventName, callback)`

---

## 2. Tab Activation & State Synchronization

- **Deep Linking Modes:**
  - `urlSync: 'hash' | 'query' | false` (Default: `'hash'`).
  - `queryParamKey: string` (Default: `'tab'`).
  - `historyMode: 'replace' | 'push'` (Default: `'replace'`).
- **Deep Linking Mechanics:**
  - Initial Load: Reads URL hash or URL query parameter; if it matches a known tab, that tab is activated immediately.
  - Runtime Updates: Updates URL via `history.replaceState` or `history.pushState` when switching tabs, without triggering jarring page jumps.
  - Browser History Traversal: Listens to `popstate` and `hashchange` events on `window` to seamlessly switch tabs when user clicks Back/Forward.
- **State Storage Persistence:**
  - `storage: 'localStorage' | 'sessionStorage' | false` (Default: `false`).
  - `storageKey?: string` (Default: `cge-tabs-${id}`).
  - Persists last active tab across reloads even if URL sync is disabled.

---

## 3. Ajax & Lazy-Load Tab Panels (Laravel Blade Partials)

- **On-Demand Loading:**
  - Declarative attribute: `<button data-cge-tab="logs" data-cge-ajax="/admin/users/12/logs-partial">Logs</button>`.
  - Configurable via `ajaxTabs: { [tabId: string]: string | AjaxConfig }`.
  - `cacheAjax: boolean` (Default: `true`): Caches HTML content in memory; subsequent switches do not re-query.
  - `ajaxDriver: 'auto' | 'axios' | 'fetch'` (Default: `'auto'`).
  - Integrated loading state: renders an animated spinner and `translations.loading`.
  - Error state: displays `translations['ajax-error']` with a retry button.
  - Cancellation: Aborts active in-flight request on tab switch or teardown (`AbortController`).
- **CGE Auto-Lifecycle Bridge:**
  - On HTML insertion:
    1. Triggers `window.TailTools?.init?.(panelEl)`.
    2. Initializes active plugins if loaded: `CGEActionButton.init(panelEl)`, `CGEForm.init(panelEl)`, `CGESelect.init('select[data-cge-select]', {}, panelEl)`, `CGEModal.init(panelEl)`, `CGEDropzone.init(panelEl)`, `CGEDataTable.init(panelEl)`, `CGEDataGrid.init(panelEl)`.
    3. Dispatches global DOM CustomEvent: `cge:tabs:loaded` with `{ tabId, panel, instance }`.

---

## 4. UI, Transitions & Animated Sliding Indicator

- **Sliding Indicator:**
  - `indicator: boolean | 'line' | 'pill'` (Default: `true`).
  - Dynamic indicator bar/pill positioned absolute in `role="tablist"` container.
  - Animates `transform: translateX(...)` and `width` (or `translateY` and `height` for vertical tabs).
  - Listens to container resize via `ResizeObserver` and `window` resize to guarantee alignment across responsive breakpoints.
- **Panel Transitions:**
  - `transition: boolean | string` (Default: `true`).
  - `animationIn: string` (e.g. `'animate-fade-in'` or `'transition-opacity duration-200'`).
  - Supports `tailwind-animations` classes or pure Tailwind CSS v4 transitions.
- **Headless UI Slot Config (`ui`):**
  - Full control over CSS utility classes for `tabList`, `tab`, `activeTab`, `inactiveTab`, `disabledTab`, `indicator`, `panelContainer`, `panel`, `activePanel`, `loadingContainer`, `errorContainer`.

---

## 5. Accessibility & Keyboard Navigation (WAI-ARIA)

- **ARIA Roles & Attributes:**
  - Tablist: `role="tablist"`, `aria-orientation="horizontal" | "vertical"`.
  - Triggers: `role="tab"`, `aria-selected="true|false"`, `aria-controls="panel-id"`, `id="tab-id"`, `tabindex="0"` (active) / `"-1"` (inactive).
  - Panels: `role="tabpanel"`, `aria-labelledby="tab-id"`, `tabindex="0"`, `hidden` attribute or class.
- **Keyboard Navigation:**
  - Horizontal: `ArrowRight` (next), `ArrowLeft` (previous).
  - Vertical: `ArrowDown` (next), `ArrowUp` (previous).
  - `Home`: First tab.
  - `End`: Last tab.
  - `manual: boolean` (Default: `false` -> auto activation on focus; `true` -> arrow keys focus, `Enter`/`Space` activates).
  - Skips disabled tabs (`[disabled]`, `[data-cge-disabled]`, `aria-disabled="true"`).

---

## 6. Events & Lifecycle

- **Callbacks:** `onShow(tabId, panelEl, tabBtn)`, `onShown(tabId, panelEl, tabBtn)`, `onAjaxStart(tabId, panelEl)`, `onAjaxLoaded(tabId, panelEl, response)`, `onAjaxError(tabId, error)`.
- **Instance Emitter:** `.on(event, callback)`, `.off(event, callback)`.
- **DOM CustomEvents:**
  - `cge:tabs:show` (cancelable with `event.preventDefault()`)
  - `cge:tabs:shown`
  - `cge:tabs:ajax-start`
  - `cge:tabs:ajax-loaded`
  - `cge:tabs:ajax-error`
  - `cge:tabs:destroyed`

---

## 7. Localization (i18n)

- Fallback dictionary:
  ```json
  {
    "loading": "Loading content...",
    "ajax-error": "Failed to load tab content. Please try again.",
    "retry": "Retry"
  }
  ```

---

## 8. Integration & Testing Plan

1. Create files in `plugins/CGETabs/`.
2. Register exports in `package.json`, `src/index.ts`, `src/index.d.ts`, `src/style.css`, `styles.css`.
3. Add consumer typing checks in `tests/types/consumer.mts`.
4. Create full docs in `docs/CGETabs/` (`README.md`, `usage.md`, `examples.md`, `api.md`, `laravel-blade.md`) and update repository docs.
5. Create AI consumer skills (`.agents/skills/cge-tabs/SKILL.md` and `.agents/skills/cge-tabs-skill.md`).
6. Add interactive testing section to `index.html`.
7. Verify all test suites (`npm run test`, `npm run test:package`).


## Scoped maintenance — 2026-10-04
Preserve public API, visual defaults and CSS Grid transitions. Verify programmatic and nested ownership, keyboard/hidden-panel access, initial/URL/storage state, duration and reduced motion, scoped init/get and DOM restoration. For Tabs verify AJAX cancellation/cache/retry and nested plugin lifecycle. Update declarations, four docs, consumer skill, browser/package checks and REPORTS.md.

Completed 2026-10-05. Scoped fixes, docs/skills/types and 30 navigation regressions delivered. Validation: 27 Node / 116 Chrome, native mobile/desktop demo, NodeNext/Bundler, build, ESM/UMD and npm archive; see REPORTS.md.

## Stability fixes (October 2026)
Source: TailTools stability plan (Phase 1 S5, Phase 5). Namespaced hash state (`#group=tab&other=tab`, legacy `#tab` read) with parent-panel activation for nested deep links; push-mode Back without state restores the initial tab; AJAX JSON without a string `html` is an error, optional `sanitize(html, tabId)`, Laravel headers/CSRF for non-GET, `axiosInstance`, `HttpError`; `destroyAll(root)`, pruning/morph rebuild in `init`, `get()` returns null; disabled classes removed on re-enable; modifier keys ignored and RTL arrows; `initPanel`/`destroyPanel` options and `CGETabs.setPanelInitializer()` so ESM imports do not depend on globals; `animationIn` skipped for reduced motion.
