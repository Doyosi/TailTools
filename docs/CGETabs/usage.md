# CGETabs Usage Guide

This guide covers options, methods, event hooks, deep linking modes, Ajax mechanics, and customization patterns for `CGETabs`.

---

## Configuration Options

Options can be supplied via the constructor, passed to `CGETabs.init()`, or provided declaratively on the container element using `data-cge-tabs='{...}'` or individual `data-cge-*` attributes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `urlSync` | `'hash' \| 'query' \| false` | `'hash'` | Deep linking strategy: namespaced URL hash (`#<hashKey>=<tab>`), URL query param (`?tab=...`), or disabled. |
| `hashKey` | `string \| null` | `null` | Key of this group in the namespaced hash. Defaults to the element `id`. Also `data-cge-hash-key`. |
| `queryParamKey` | `string` | `'tab'` | Query parameter key when `urlSync` is set to `'query'` (e.g., `?tab=billing`). |
| `historyMode` | `'replace' \| 'push'` | `'replace'` | Browser history manipulation method. `'replace'` avoids polluting history; `'push'` creates history steps. |
| `storage` | `'localStorage' \| 'sessionStorage' \| false` | `false` | Client-side storage driver to persist last active tab across page reloads. |
| `storageKey` | `string \| null` | `null` | Key name for client storage. Defaults to `cge-tabs-${element.id}`. |
| `defaultTab` | `string \| null` | `null` | Explicit tab identifier to activate if not found in URL or storage. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Tablist orientation for ARIA attributes and directional arrow key navigation. |
| `indicator` | `boolean \| 'line' \| 'pill'` | `true` | Dynamic sliding active indicator mode: underline bar (`'line'`), pill badge (`'pill'`), or disabled. |
| `cacheAjax` | `boolean` | `true` | When true, loaded Ajax panels are cached in memory and not re-fetched on subsequent switches. |
| `ajaxDriver` | `'auto' \| 'axios' \| 'fetch'` | `'auto'` | HTTP client for remote partials. `'auto'` uses Axios if available, falling back to native Fetch. |
| `ajaxHeaders` | `Record<string, string>` | `{}` | Additional HTTP headers merged over the Laravel defaults (`Accept`, `X-Requested-With`, and `X-CSRF-TOKEN`/`X-XSRF-TOKEN` for non-GET methods). |
| `ajaxTabs` | `Record<string, string \| AjaxConfig>` | `{}` | Programmatic remote endpoints for tabs without inline `data-cge-ajax` attributes. |
| `axiosInstance` | `AxiosLike \| null` | `null` | Configured axios instance; wins over `window.axios` for the `'auto'` and `'axios'` drivers. |
| `sanitize` | `(html, tabId) => string \| Node` | `null` | Applied to every AJAX response before it is injected (e.g. `DOMPurify.sanitize`). |
| `initPanel` | `(panel, tabId, instance) => void` | `null` | Initializes nested plugins in a loaded panel; overrides `CGETabs.setPanelInitializer()`. |
| `destroyPanel` | `(panel, instance) => void` | `null` | Tears nested plugins down before panel content is replaced or restored. |
| `manual` | `boolean` | `false` | When true, arrow keys only move focus, requiring Enter or Space to activate the tab. |
| `transition` | `boolean` | `true` | Enables animated transitions when switching panels. |
| `animationIn` | `string` | `'animate-fade-in'` | CSS animation or Tailwind utility class applied when a panel becomes visible. |
| `ui` | `Partial<CGETabsUIConfig>` | `{...}` | Headless CSS class slots for container, tabs, panels, indicator, and loaders. |
| `translations` | `Partial<CGETabsTranslations>` | `{...}` | Localization dictionary for loading, error, and retry messages. |
| `onShow` | `Function \| null` | `null` | Hook fired immediately when tab activation begins. |
| `onShown` | `Function \| null` | `null` | Hook fired after tab and panel have transitioned into active view. |
| `onAjaxStart` | `Function \| null` | `null` | Hook fired when remote partial request starts. |
| `onAjaxLoaded` | `Function \| null` | `null` | Hook fired when remote partial HTML has been injected and child plugins bound. |
| `onAjaxError` | `Function \| null` | `null` | Hook fired when remote partial request fails. |

---

## Headless UI Slots (`ui`)

Customize class mappings for complete visual freedom:

```javascript
const tabs = new CGETabs('#my-tabs', {
  ui: {
    tabList: 'flex border-b border-slate-200 dark:border-slate-800 gap-2 relative',
    tab: 'px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer',
    activeTab: 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600',
    inactiveTab: 'text-slate-500',
    disabledTab: 'opacity-50 cursor-not-allowed pointer-events-none',
    indicator: 'absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 pointer-events-none',
    panelContainer: 'mt-4',
    panel: 'hidden focus:outline-hidden',
    activePanel: 'block',
    loadingContainer: 'py-12 flex flex-col justify-center items-center gap-2 text-slate-400',
    errorContainer: 'py-8 text-center text-sm text-rose-500 flex flex-col items-center gap-2'
  }
});
```

---

## Public Methods

### Static Methods

- `CGETabs.init(selectorOrRoot, options, root)`: Initializes all matching tabs within the given root element (defaults to `document`) and returns **every** instance under root (new and existing). Instances whose element left the DOM are destroyed first; instances whose plugin attributes were stripped by a Livewire morph are rebuilt.
- `CGETabs.get(elementOrId)`: Retrieves an existing `CGETabs` instance by DOM element or ID string, or `null`.
- `CGETabs.destroyAll(root = document)`: Destroys instances inside `root` or no longer connected (Livewire/Turbo teardown). Returns the destroyed instances.
- `CGETabs.setPanelInitializer(init, destroy?)`: Registers how nested plugins inside loaded AJAX panels are initialized (and optionally destroyed). `tailtools/auto` registers `initTailTools` automatically.

### Instance Methods

- `tabs.show(tabId, options)`: Activates the specified tab. Options: `{ focus?: boolean, updateHistory?: boolean }`. Returns `true` if activated, `false` if cancelled or disabled.
- `tabs.next()`: Activates the next available tab (wraps around).
- `tabs.prev()`: Activates the previous available tab (wraps around).
- `tabs.first()`: Activates the first non-disabled tab.
- `tabs.last()`: Activates the last non-disabled tab.
- `tabs.getActiveTab()`: Returns the string ID of the currently active tab, or `null`.
- `tabs.getTab(tabId)`: Returns the trigger `HTMLElement` for a tab ID.
- `tabs.getPanel(tabId)`: Returns the panel `HTMLElement` for a tab ID.
- `tabs.updateIndicator()`: Manually triggers dynamic indicator geometry recalculation.
- `tabs.loadAjaxTab(tabId, force)`: Loads remote HTML for an Ajax tab. If `force = true`, bypasses cache.
- `tabs.on(event, callback)`: Subscribes an instance event listener.
- `tabs.off(event, callback)`: Unsubscribes an instance event listener.
- `tabs.destroy()`: Complete teardown, unbinding listeners, aborting pending requests, and removing generated elements.

---

## Event Hooks & CustomEvents

### Instance Events (`.on()`) and DOM CustomEvents

`CGETabs` emits both instance-level callbacks and native DOM CustomEvents that bubble up the DOM tree:

| Event Name | Detail Payload | Description |
| :--- | :--- | :--- |
| `cge:tabs:show` | `{ tabId, previousTabId, panel, trigger, instance }` | Cancelable with `event.preventDefault()`. Fired before tab switches. |
| `cge:tabs:shown` | `{ tabId, previousTabId, panel, trigger, instance }` | Fired after tab and panel have activated. |
| `cge:tabs:ajax-start` | `{ tabId, panel, instance }` | Fired when a remote Ajax tab request initiates. |
| `cge:tabs:ajax-loaded` | `{ tabId, panel, response, instance }` | Fired after remote HTML is inserted and child plugins bridged. |
| `cge:tabs:ajax-error` | `{ tabId, error, instance }` | Fired when a remote Ajax request encounters an error. |
| `cge:tabs:destroyed` | `{ instance }` | Fired upon instance destruction. |

Example:
```javascript
tabs.element.addEventListener('cge:tabs:show', (event) => {
  if (event.detail.tabId === 'billing' && !userHasPermission) event.preventDefault();
});

// DOM CustomEvent
document.addEventListener('cge:tabs:shown', (e) => {
  console.log('Switched to tab:', e.detail.tabId);
});
```

---

## Deep Linking & Browser History

`CGETabs` synchronizes navigation state seamlessly:

### Hash Mode (`urlSync: 'hash'`)
- Every tab group writes only its own entry: selecting "Billing" in `<div id="account" data-cge-tabs>` produces `https://example.com/page#account=billing`. A second group adds its entry instead of overwriting: `#account=billing&help=faq`.
- Keys and values are URI-encoded. The key is the element `id` unless `hashKey` / `data-cge-hash-key` is set.
- Legacy links such as `#billing` still work: the group that owns a `billing` tab activates it.
- Nested groups: `#inner=invoices` (or the legacy `#invoices`) activates the inner tab **and** the outer tab whose panel contains the inner group, regardless of initialization order. An explicit outer entry (`#outer=profile&inner=invoices`) wins over the nested one.
- Page reloading automatically restores every group.
- With `historyMode: 'push'`, Back and Forward switch tabs without reloads; going Back to an entry without the group's state restores the initial tab (storage → `defaultTab` → pre-selected → first). The default replace mode does not create new history entries and ignores unrelated hash changes.

### Query Param Mode (`urlSync: 'query'`)
- Useful when deep linking within dashboard sub-sections: `https://example.com/admin/settings?tab=security`.
- Configurable parameter name: `queryParamKey: 'section'`.

---

## Ajax Lazy Loading & CGE Auto-Lifecycle Bridge

When an Ajax tab is selected:
1. An animated loading spinner is displayed inside the panel.
2. In-flight requests are tracked per tab with `AbortController`; a new request for the same tab cancels its predecessor.
3. On completion, the HTML partial is injected into the panel.
4. **Response contract:** `text/html` (or `text/plain`) bodies are injected; JSON is accepted only as `{ "html": "..." }`. Any other JSON, unsupported content types and HTTP errors render the error/Retry state and pass a `TypeError` or `HttpError` (`status`, `data`, Laravel `errors`) to `onAjaxError` / `cge:tabs:ajax-error`. The optional `sanitize(html, tabId)` hook runs before injection.
5. **CGE Auto-Lifecycle Bridge:**
   Nested plugins inside the freshly loaded panel are initialized by the first available of: the `initPanel` option, `CGETabs.setPanelInitializer(fn)` (registered by `tailtools/auto`), `window.TailTools.init`, or global `CGE*` classes. With plain ESM imports and no registration only nested `CGETabs` are initialized, so register one:

   ```javascript
   import { CGETabs, initTailTools } from 'tailtools';
   CGETabs.setPanelInitializer(panel => initTailTools(panel));
   ```

   The global `cge:tabs:loaded` event is dispatched afterwards.


## Precise configuration and loading behavior
Options resolve as defaults → `data-cge-tabs` JSON → individual attributes → explicit JavaScript options. `ui.tabList`, `ui.tab` and `ui.panelContainer` apply when explicitly configured; their default layout stays in consumer markup. The panel-container slot applies to the shared immediate parent of all owned panels. Other state/indicator/loading slots retain their existing defaults. `animationIn` can contain multiple whitespace-separated classes.

AJAX controllers are tracked per tab. Reloading a tab cancels its previous request, and late responses from canceled requests cannot replace current content. Switching to a different panel allows the first panel's independent request to finish and cache; `destroy()` aborts all requests. `cacheAjax: false` reloads on reactivation. A failed forced reload invalidates the previous loaded marker/cache so later activation can recover. The panel uses `aria-busy` and the loader uses `role="status"`; HTTP errors display `role="alert"` and a delegated Retry button. Translation strings are rendered as text. Endpoint HTML is trusted application/Blade markup; pass `sanitize` when a partial can contain user-generated HTML.

The lifecycle bridge calls one initializer per load (see the priority above). The global fallback calls standalone scoped init APIs, with document delegates for ActionButton/Lightbox, and includes Tabs, Accordion and Collapse. Registry-backed child instances (including Select WeakMap entries) are destroyed before AJAX replacement and on Tabs destroy. Original panel nodes are restored; call init again if restored markup requires child-plugin initialization.

Horizontal tablists with default visible overflow use `overflow-x: auto`. Existing explicit overflow styles are preserved, and destroy restores the original style. Keyboard focus scrolls off-screen tabs into view; the indicator is remeasured after focus. Failed child initialization destroys partial instances, clears loaded/cache state and exposes the normal error/retry flow.

## Keyboard

Arrow keys move between tabs (Left/Right for horizontal lists, Up/Down for vertical lists), Home/End jump to the first/last enabled tab and Enter/Space activate in manual mode. In right-to-left layouts (`dir="rtl"`) Left/Right are mirrored. Key presses with Alt, Ctrl or Meta are ignored so browser and application shortcuts keep working. Disabled classes from `ui.disabledTab` are removed again when a tab is re-enabled and activated (only classes the plugin added are removed).

## Livewire, Turbo and dynamic DOM

- Call `CGETabs.init(root)` again after DOM updates; it prunes detached instances and rebuilds morphed ones. `tailtools/auto` does this on `livewire:navigated`, after Livewire commits and on `turbo:load`.
- Call `CGETabs.destroyAll(root)` before removing a region yourself.
- Wrap tab groups whose markup Livewire should never touch in `wire:ignore` to keep the client state (active tab, loaded panels) across component updates.
