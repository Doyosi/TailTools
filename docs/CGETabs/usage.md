# CGETabs Usage Guide

This guide covers options, methods, event hooks, deep linking modes, Ajax mechanics, and customization patterns for `CGETabs`.

---

## Configuration Options

Options can be supplied via the constructor, passed to `CGETabs.init()`, or provided declaratively on the container element using `data-cge-tabs='{...}'` or individual `data-cge-*` attributes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `urlSync` | `'hash' \| 'query' \| false` | `'hash'` | Deep linking strategy: updates URL hash (`#tab`), URL query param (`?tab=...`), or disabled. |
| `queryParamKey` | `string` | `'tab'` | Query parameter key when `urlSync` is set to `'query'` (e.g., `?tab=billing`). |
| `historyMode` | `'replace' \| 'push'` | `'replace'` | Browser history manipulation method. `'replace'` avoids polluting history; `'push'` creates history steps. |
| `storage` | `'localStorage' \| 'sessionStorage' \| false` | `false` | Client-side storage driver to persist last active tab across page reloads. |
| `storageKey` | `string \| null` | `null` | Key name for client storage. Defaults to `cge-tabs-${element.id}`. |
| `defaultTab` | `string \| null` | `null` | Explicit tab identifier to activate if not found in URL or storage. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Tablist orientation for ARIA attributes and directional arrow key navigation. |
| `indicator` | `boolean \| 'line' \| 'pill'` | `true` | Dynamic sliding active indicator mode: underline bar (`'line'`), pill badge (`'pill'`), or disabled. |
| `cacheAjax` | `boolean` | `true` | When true, loaded Ajax panels are cached in memory and not re-fetched on subsequent switches. |
| `ajaxDriver` | `'auto' \| 'axios' \| 'fetch'` | `'auto'` | HTTP client for remote partials. `'auto'` uses Axios if available, falling back to native Fetch. |
| `ajaxHeaders` | `Record<string, string>` | `{}` | Additional HTTP headers sent with Ajax requests (e.g. CSRF tokens, bearer tokens). |
| `ajaxTabs` | `Record<string, string \| AjaxConfig>` | `{}` | Programmatic remote endpoints for tabs without inline `data-cge-ajax` attributes. |
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

- `CGETabs.init(selectorOrRoot, options, root)`: Initializes all matching tabs within the given root element (defaults to `document`).
- `CGETabs.get(elementOrId)`: Retrieves an existing `CGETabs` instance by DOM element or ID string.

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
- When the user selects the "Billing" tab, the browser URL becomes `https://example.com/account#billing`.
- Page reloading automatically restores the `#billing` tab.
- With `historyMode: 'push'`, Back and Forward switch tabs without reloads. The default replace mode does not create new history entries.

### Query Param Mode (`urlSync: 'query'`)
- Useful when deep linking within dashboard sub-sections: `https://example.com/admin/settings?tab=security`.
- Configurable parameter name: `queryParamKey: 'section'`.

---

## Ajax Lazy Loading & CGE Auto-Lifecycle Bridge

When an Ajax tab is selected:
1. An animated loading spinner is displayed inside the panel.
2. In-flight requests are tracked per tab with `AbortController`; a new request for the same tab cancels its predecessor.
3. On completion, the HTML partial is injected into the panel.
4. **CGE Auto-Lifecycle Bridge:**
   `CGETabs` automatically detects and initializes nested TailTools plugins (`CGEActionButton`, `CGEForm`, `CGESelect`, `CGEModal`, `CGEDrawer`, `CGEDropzone`, `CGEDataTable`, `CGEDataGrid`) inside the freshly loaded panel, and dispatches the global `cge:tabs:loaded` event.


## Precise configuration and loading behavior
Options resolve as defaults → `data-cge-tabs` JSON → individual attributes → explicit JavaScript options. `ui.tabList`, `ui.tab` and `ui.panelContainer` apply when explicitly configured; their default layout stays in consumer markup. The panel-container slot applies to the shared immediate parent of all owned panels. Other state/indicator/loading slots retain their existing defaults. `animationIn` can contain multiple whitespace-separated classes.

AJAX controllers are tracked per tab. Reloading a tab cancels its previous request, and late responses from canceled requests cannot replace current content. Switching to a different panel allows the first panel's independent request to finish and cache; `destroy()` aborts all requests. `cacheAjax: false` reloads on reactivation. A failed forced reload invalidates the previous loaded marker/cache so later activation can recover. The panel uses `aria-busy` and the loader uses `role="status"`; HTTP errors display `role="alert"` and a delegated Retry button. Translation strings are rendered as text. Endpoint HTML is trusted application/Blade markup.

Use `TailTools.init(panel)` once for the lifecycle bridge when available. Otherwise the bridge calls standalone scoped init APIs, with document delegates for ActionButton/Lightbox. Both paths include Tabs, Accordion and Collapse. Registry-backed child instances (including Select WeakMap entries) are destroyed before AJAX replacement and on Tabs destroy. Original panel nodes are restored; call init again if restored markup requires child-plugin initialization.

Horizontal tablists with default visible overflow use `overflow-x: auto`. Existing explicit overflow styles are preserved, and destroy restores the original style. Keyboard focus scrolls off-screen tabs into view; the indicator is remeasured after focus. Failed child initialization destroys partial instances, clears loaded/cache state and exposes the normal error/retry flow.
